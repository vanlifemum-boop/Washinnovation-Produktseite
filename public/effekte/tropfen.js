/* WashInnovation — Tropfen-Ebene (vanilla Three.js, lokal gevendort)
 *
 * Zwei Gruppen echter Tropfenformen als fixe Ebene über der ganzen Seite:
 *
 *   1. SCHWEBEND — Tropfen treiben umher, folgen der Maus, bekommen beim
 *      Scrollen Schub und stoßen sich gegenseitig ab.
 *   2. REGEN — Tropfen treten aus der Düse der Duschbrause im Hero aus, fallen
 *      nach unten und regnen über die Seite. Ist die Brause weggescrollt, kommt
 *      der Regen von der oberen Bildschirmkante.
 *
 * Alles läuft in Zeitlupe: Der Regen braucht rund fünf Sekunden über die
 * Bildhöhe, die schwebenden Tropfen treiben kaum merklich.
 *
 * Alle Geschwindigkeiten sind in Welteinheiten **je Sekunde** angegeben und
 * werden mit dt verrechnet. Das ist wichtig: Vorher wurde je *Bild* gerechnet,
 * dadurch lief die Szene auf einem 120-Hz-Bildschirm doppelt so schnell wie auf
 * einem 60-Hz-Gerät.
 *
 * Die Pumpe (public/effekte/pumpe.js) meldet über window.WI_PUMPE, wie weit der
 * blaue Druckkopf eingesunken ist und ob gerade gedrückt wird. Beim Drücken
 * spritzt es, sonst tropft es langsam weiter. Der Zugriff ist absichtlich
 * defensiv — auf allen Seiten außer der Startseite gibt es keine Pumpe.
 *
 * Beide Gruppen werden über Text durchsichtig, damit alles lesbar bleibt.
 *
 * Abschaltungen: prefers-reduced-motion, kein WebGL, Tab im Hintergrund,
 * schmale Viewports bekommen weniger Tropfen.
 */
import {
  Clock, PerspectiveCamera, Scene, WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping,
  MathUtils, Vector2, Vector3, Color, Object3D, InstancedMesh, LatheGeometry,
  MeshStandardMaterial, AmbientLight, PointLight, DirectionalLight, Raycaster, Plane,
  InstancedBufferAttribute,
} from "./vendor/three.module.min.js";

if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  try { init(); } catch (e) { /* WebGL nicht verfügbar → Seite bleibt ohne Ebene */ }
}

function init() {
  // Weiß-Blau: von fast weißem Schaum bis Tiefsee. Bewusst wenig Sättigung —
  // es soll nach Wasser aussehen, nicht nach Murmeln.
  const FARBEN = ["#ffffff", "#dcefff", "#9ed2f5", "#4aa8e8", "#0f6fc4", "#0b568f"];

  const schmal = window.innerWidth < 760;
  const ANZAHL = schmal ? 40 : 78;        // schwebende Tropfen inkl. Cursor-Schieber
  const REGEN_ANZAHL = schmal ? 38 : 78;  // fallende Tropfen
  const CURSOR_R = schmal ? 0.85 : 1.4;
  const ALPHA_VOLL = 0.9;

  /* Tropfengröße nach Bildschirmbreite.
     Die Welt ist immer gleich hoch, egal wie breit das Fenster ist — ein
     Tropfen mit Radius 0,72 misst deshalb auf jedem Gerät rund 70 Pixel. Auf
     einem 1280er Schirm sind das 5 % der Breite, auf einem 360er aber 16 %:
     Dort begraben ein paar Tropfen den halben Hero samt Produktbild. Auf
     schmalen Geräten fallen sie deshalb kleiner aus. */
  const R_MIN = schmal ? 0.16 : 0.26;
  const R_MAX = schmal ? 0.40 : 0.72;
  const REGEN_R_MIN = schmal ? 0.09 : 0.14;
  const REGEN_R_MAX = schmal ? 0.20 : 0.34;

  /* Restdeckung über Text, je Farbe aus FARBEN — je dunkler das Blau, desto
     stärker verschwindet der Tropfen. Die hellen Tropfen stören auf Text kaum,
     die dunklen sehr; deshalb werden sie ungleich behandelt statt alle über
     einen Kamm geschoren. */
  const ALPHA_TEXT_JE_FARBE = [0.10, 0.09, 0.06, 0.035, 0.02, 0.02];

  /* Sicherheitsrand um jede Textfläche. Damit verblasst ein Tropfen, *bevor* er
     die Buchstaben erreicht, statt mitten über dem Wort auszugehen. */
  const TEXT_RAND = 14;

  const huelle = document.createElement("div");
  huelle.id = "tropfen-ebene";
  huelle.setAttribute("aria-hidden", "true");
  huelle.style.cssText = "position:fixed;inset:0;z-index:30;pointer-events:none;";
  document.body.appendChild(huelle);
  document.documentElement.classList.add("hat-tropfen");

  const canvas = document.createElement("canvas");
  huelle.appendChild(canvas);

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const kamera = new PerspectiveCamera(50, 1, 0.1, 100);
  kamera.position.set(0, 0, 20);
  const szene = new Scene();

  szene.add(new AmbientLight(0xffffff, 1.0));
  const streiflicht = new DirectionalLight(0xffffff, 1.8);
  streiflicht.position.set(6, 9, 10);
  szene.add(streiflicht);
  const gegenlicht = new DirectionalLight(0x9ed2f5, 0.8);
  gegenlicht.position.set(-8, -4, 6);
  szene.add(gegenlicht);
  const zeigerlicht = new PointLight(0x4aa8e8, 55, 35, 1.8);
  szene.add(zeigerlicht);

  /* ---------------------------------------------------------------------
     Tropfenform
     Tropfenkurve, um die Hochachse rotiert: oben eine weiche Spitze, unten
     rund und voll — wie ein hängender Wassertropfen. Die Exponenten machen den
     Körper bewusst rundlich statt spitz zulaufend. Der größte Radius wird auf
     1 normiert, damit `scale = Radius` bleibt und die Stoßrechnung stimmt.
     --------------------------------------------------------------------- */
  function tropfenGeometrie(segmente = 26) {
    const punkte = [];
    for (let i = 0; i <= segmente; i++) {
      const t = (i / segmente) * Math.PI;      // 0 = Spitze oben, π = Boden
      const r = Math.sin(t) * Math.pow(Math.sin(t / 2), 0.72);
      punkte.push(new Vector2(r, Math.cos(t) * 0.96));
    }
    const maxR = punkte.reduce((m, p) => Math.max(m, p.x), 0.0001);
    punkte.forEach((p) => { p.x /= maxR; });
    return new LatheGeometry(punkte, 24);
  }

  const geo = tropfenGeometrie();

  // Per-Tropfen-Transparenz über Instanz-Attribut + Shader-Patch: So kann jeder
  // einzelne Tropfen über Text ausblenden, ohne das Material zu tauschen.
  function materialMitAlpha(anzahl) {
    const attr = new InstancedBufferAttribute(new Float32Array(anzahl).fill(ALPHA_VOLL), 1);
    /* depthWrite: false ist hier Pflicht, nicht Geschmack. Durchsichtige
       Instanzen werden in Reihenfolge gezeichnet und nicht nach Tiefe sortiert;
       schreiben sie dabei in den Tiefenpuffer, verwirft er alles, was später
       und weiter hinten kommt. Sichtbar wurde das als glatt abgeschnittene
       Tropfen — halbe Eier statt Wasser, überall dort, wo zwei sich
       überlappen. */
    const mat = new MeshStandardMaterial({
      metalness: 0.15, roughness: 0.06, transparent: true, depthWrite: false,
    });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aAlpha;\nvarying float vAlpha;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAlpha = aAlpha;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vAlpha;")
        .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );");
    };
    return { mat, attr };
  }

  const farbObjekte = FARBEN.map((c) => new Color(c));

  // ---- Gruppe 1: schwebende Tropfen ----
  const schwebeGeo = geo.clone();
  const { mat: schwebeMat, attr: schwebeAlphaAttr } = materialMitAlpha(ANZAHL);
  schwebeGeo.setAttribute("aAlpha", schwebeAlphaAttr);
  const mesh = new InstancedMesh(schwebeGeo, schwebeMat, ANZAHL);
  for (let i = 0; i < ANZAHL; i++) mesh.setColorAt(i, farbObjekte[i % farbObjekte.length]);
  mesh.instanceColor.needsUpdate = true;
  szene.add(mesh);

  // ---- Gruppe 2: Regen ----
  const regenGeo = geo.clone();
  const { mat: regenMat, attr: regenAlphaAttr } = materialMitAlpha(REGEN_ANZAHL);
  regenGeo.setAttribute("aAlpha", regenAlphaAttr);
  const regenMesh = new InstancedMesh(regenGeo, regenMat, REGEN_ANZAHL);
  for (let i = 0; i < REGEN_ANZAHL; i++) {
    /* Der Regen bekommt dieselbe volle Palette wie die schwebenden Tropfen.
       Vorher waren es nur die ersten drei Farben — aus der Brause kam damit
       ausschließlich Weiß und helles Blau, während das kräftige Dunkelblau nur
       oben herumtrieb. Über Text bleibt es trotzdem lesbar: Die Restdeckung
       hängt an der Farbe, nicht an der Gruppe. */
    regenMesh.setColorAt(i, farbObjekte[i % farbObjekte.length]);
  }
  regenMesh.instanceColor.needsUpdate = true;
  szene.add(regenMesh);

  /* ---------------------- Physik: schwebende Tropfen ---------------------- */
  const pos = new Float32Array(ANZAHL * 3);
  const geschw = new Float32Array(ANZAHL * 3);        // Einheiten je Sekunde
  const groesse = new Float32Array(ANZAHL);
  const alpha = new Float32Array(ANZAHL).fill(ALPHA_VOLL);
  const alphaText = new Float32Array(ANZAHL);
  const raum = { x: 12, y: 6, z: 4 };
  groesse[0] = CURSOR_R;
  for (let i = 1; i < ANZAHL; i++) groesse[i] = MathUtils.randFloat(R_MIN, R_MAX);
  for (let i = 0; i < ANZAHL; i++) {
    alphaText[i] = ALPHA_TEXT_JE_FARBE[i % ALPHA_TEXT_JE_FARBE.length];
    pos[i * 3] = MathUtils.randFloatSpread(raum.x * 2);
    pos[i * 3 + 1] = MathUtils.randFloatSpread(raum.y * 2);
    pos[i * 3 + 2] = MathUtils.randFloatSpread(raum.z * 2);
    geschw[i * 3] = MathUtils.randFloatSpread(0.3);
    geschw[i * 3 + 1] = MathUtils.randFloatSpread(0.3);
  }

  const REIBUNG = 0.3;    // e-Dämpfung je Sekunde (≈ 0,74 der Geschwindigkeit)
  const ABPRALL = 0.6;
  const MAXV = 3.0;       // Einheiten/s — vorher 12, also rund ein Viertel
  const FOLGEN = 2.5;     // Beschleunigung zum Zeiger, Einheiten/s²
  const SCHUB_KRAFT = 15; // Umrechnung des Scroll-Schubs in Beschleunigung
  const TRENN_KRAFT = 9;  // Rückstoß beim Auseinanderschieben, Einheiten/s

  /* ------------------------------ Regen ---------------------------------- */
  const rPos = new Float32Array(REGEN_ANZAHL * 3);
  const rGeschw = new Float32Array(REGEN_ANZAHL * 3);
  const rGroesse = new Float32Array(REGEN_ANZAHL);
  const rStreckung = new Float32Array(REGEN_ANZAHL).fill(1);
  const rAlpha = new Float32Array(REGEN_ANZAHL).fill(ALPHA_VOLL);
  const rAlphaText = new Float32Array(REGEN_ANZAHL);
  const rWartet = new Float32Array(REGEN_ANZAHL);       // Sekunden bis zum nächsten Austritt

  /* Zeitlupe: gebremste Beschleunigung plus Endgeschwindigkeit. Ohne den Deckel
     würden die Tropfen unten wieder schnell — die Beschleunigung allein zu
     senken reicht dafür nicht. */
  const SCHWERKRAFT = 2.6;   // Einheiten/s²
  const MAX_FALL = 5.5;      // Einheiten/s — Weg über die Bildhöhe ≈ 5 s

  for (let i = 0; i < REGEN_ANZAHL; i++) {
    rGroesse[i] = MathUtils.randFloat(REGEN_R_MIN, REGEN_R_MAX);
    rAlphaText[i] = ALPHA_TEXT_JE_FARBE[i % ALPHA_TEXT_JE_FARBE.length];
    rWartet[i] = Math.random() * 2.0;   // gestaffelter Start, aber nicht zu zäh
  }

  /** Stärke des Pumpenstoßes, 0…1. Fehlt die Pumpe (alle Seiten außer der
   *  Startseite), bleibt es beim gleichmäßigen langsamen Tropfen.
   *
   *  Der Wert wird geprüft, nicht nur gelesen: Er kommt aus einer fremden Datei
   *  und geht hier direkt in Positionen und Wartezeiten ein. Ein einziger
   *  ungültiger Wert würde die Tropfen auf NaN setzen und den Regen für immer
   *  anhalten — dagegen hilft eine Zeile hier mehr als jede Sorgfalt dort. */
  function pumpenStoss() {
    const p = window.WI_PUMPE;
    if (!p || typeof p.stoss !== "number" || !Number.isFinite(p.stoss)) return 0;
    return Math.min(Math.max(p.stoss, 0), 1);
  }

  /* Düse der Duschbrause im Dokument finden.
     Das Element trägt data-tropfen-quelle und data-duese="x%,y%" — damit weiß
     die Ebene, wo genau am Bild die Tropfen austreten. Das ist der Körper der
     Brause, nicht der bewegte Druckkopf: Die Düse wandert beim Pumpen nicht. */
  let quelle = null;      // { x, y } in Bildschirmkoordinaten, oder null
  function quelleMessen() {
    const el = document.querySelector("[data-tropfen-quelle]");
    if (!el) { quelle = null; return; }
    const kasten = el.getBoundingClientRect();
    if (kasten.width < 4) { quelle = null; return; }
    const roh = (el.getAttribute("data-duese") || "50,100").split(",");
    const ax = parseFloat(roh[0]) / 100;
    const ay = parseFloat(roh[1]) / 100;
    quelle = { x: kasten.left + kasten.width * ax, y: kasten.top + kasten.height * ay };
  }
  quelleMessen();
  window.addEventListener("scroll", quelleMessen, { passive: true });
  window.addEventListener("resize", quelleMessen);

  /** Bildschirmkoordinate (px) → Weltkoordinate auf der Ebene z.
   *  Die Kamera schaut ungedreht entlang −Z, deshalb genügt die lineare
   *  Umrechnung über das Sichtfeld. Der Umweg über unproject() lieferte hier
   *  falsche Werte — der Regen fiel in der Bildmitte statt an der Düse. */
  function ausBildschirm(x, y, z) {
    const abstand = kamera.position.z - z;
    const hoehe = 2 * Math.tan((kamera.fov * Math.PI) / 360) * abstand;
    const breite = hoehe * kamera.aspect;
    return new Vector3(
      (x / window.innerWidth - 0.5) * breite,
      (0.5 - y / window.innerHeight) * hoehe,
      z,
    );
  }

  function regenSetzen(i) {
    const b = i * 3;
    const z = MathUtils.randFloat(-1.5, 1.5);
    // Beim Drücken kommt der Tropfen mit mehr Schwung und breiter gestreut heraus
    const stoss = pumpenStoss();
    if (quelle && quelle.y > -60 && quelle.y < window.innerHeight) {
      // Austritt an der Düse. Die Streuung muss breiter sein als früher: In
      // Zeitlupe legen die Tropfen bis zum Bildrand viel weniger Weg zurück, um
      // sich zu verteilen — mit der alten engen Streuung hing eine Perlenkette
      // unter der Brause statt eines Regens.
      const p = ausBildschirm(quelle.x, quelle.y, z);
      rPos[b] = p.x + MathUtils.randFloatSpread(0.9);
      rPos[b + 1] = p.y;
      rPos[b + 2] = z;
      rGeschw[b] = MathUtils.randFloatSpread(0.35 + stoss * 0.6);
      rGeschw[b + 1] = -MathUtils.randFloat(0.1, 0.35) * (1 + stoss * 2.5);
    } else {
      // Brause nicht im Bild: Regen fällt von oben auf die Seite
      rPos[b] = MathUtils.randFloatSpread(raum.x * 2);
      rPos[b + 1] = raum.y + MathUtils.randFloat(0.5, 4);
      rPos[b + 2] = z;
      rGeschw[b] = MathUtils.randFloatSpread(0.1);
      rGeschw[b + 1] = -MathUtils.randFloat(0.3, 0.8);
    }
    rAlpha[i] = ALPHA_VOLL;
  }
  // Die erste Platzierung passiert weiter unten, erst nachdem
  // groesseAnpassen() Kamera und Raumgrenzen gesetzt hat — vorher liefert die
  // Umrechnung von Bildschirm- in Weltkoordinaten Unsinn und alle Tropfen
  // landen im Bildmittelpunkt statt an der Düse.

  /* --------------------------- Zeiger und Scroll -------------------------- */
  const zentrum = new Vector3();
  const platzhalter = new Object3D();
  const vA = new Vector3(), vB = new Vector3(), vDiff = new Vector3(), vProj = new Vector3();

  const zeiger = new Vector2(0.35, 0.25);
  const strahl = new Raycaster();
  const ebene = new Plane(new Vector3(0, 0, 1), 0);
  window.addEventListener("pointermove", (e) => {
    zeiger.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }, { passive: true });

  let schub = 0, letztesY = window.scrollY;
  window.addEventListener("scroll", () => {
    const dy = window.scrollY - letztesY;
    letztesY = window.scrollY;
    schub = MathUtils.clamp(schub + dy * 0.005, -0.25, 0.25);
  }, { passive: true });

  /* Textflächen einsammeln — darüber werden die Tropfen durchsichtig.
     Ohne das wäre die Seite an manchen Stellen schlicht nicht lesbar.

     Die Kandidatenliste ändert sich selten und wird deshalb nur alle zwei
     Sekunden neu geholt. Die Rechtecke dagegen werden **jeden Frame** frisch
     gemessen, und zwar in Bildschirmkoordinaten. Das ist der entscheidende
     Punkt: Die Hero-Überschrift steckt in einem `position: sticky`-Kasten, ihre
     Dokumentposition wandert beim Scrollen also mit. Gemerkte Dokument-
     koordinaten waren dort fast immer falsch — ausgerechnet bei der größten
     Schrift der Seite. Gleiches gilt für die klebende Navigation.

     Alle getBoundingClientRect() stehen bewusst am Stück ohne Schreibzugriff
     dazwischen: Dann rechnet der Browser das Layout einmal statt hundertfach. */
  const TEXT_SELEKTOR = "h1, h2, h3, h4, p, li, blockquote, .btn, .augenbraue, .zaehler-zahl, td, th, label, summary";
  let textKandidaten = [];
  function textKandidatenSammeln() {
    textKandidaten = Array.prototype.slice.call(document.querySelectorAll(TEXT_SELEKTOR));
  }
  textKandidatenSammeln();
  setInterval(textKandidatenSammeln, 2000);

  let textFlaechen = [];
  function textFlaechenMessen() {
    const h = window.innerHeight;
    const flaechen = [];
    for (let k = 0; k < textKandidaten.length; k++) {
      const r = textKandidaten[k].getBoundingClientRect();
      if (r.bottom < -80 || r.top > h + 80) continue;   // außerhalb des Bildes
      if (r.width < 8 || r.height < 8) continue;        // unsichtbar oder winzig
      flaechen.push({
        l: r.left - TEXT_RAND, o: r.top - TEXT_RAND,
        r: r.right + TEXT_RAND, u: r.bottom + TEXT_RAND,
      });
    }
    textFlaechen = flaechen;
  }

  let pxProEinheit = 1;
  /** Überdeckt der Tropfen Text? Ellipse statt Kreis, weil fallende Tropfen in
   *  die Länge gezogen werden — mit dem ungestreckten Radius gerechnet blieben
   *  sie über Text deckend stehen. */
  function ueberText(weltPos, rx, ry) {
    vProj.copy(weltPos).project(kamera);
    const sx = ((vProj.x + 1) / 2) * window.innerWidth;
    const sy = ((1 - vProj.y) / 2) * window.innerHeight;
    const rxPx = Math.max(rx * pxProEinheit, 1);
    const ryPx = Math.max(ry * pxProEinheit, 1);
    for (let k = 0; k < textFlaechen.length; k++) {
      const t = textFlaechen[k];
      const cx = Math.max(t.l, Math.min(sx, t.r));
      const cy = Math.max(t.o, Math.min(sy, t.u));
      const dx = (sx - cx) / rxPx, dy = (sy - cy) / ryPx;
      if (dx * dx + dy * dy < 1) return true;
    }
    return false;
  }

  /* ------------------------------- Schritt -------------------------------- */
  function schritt(dt) {
    const fov = (kamera.fov * Math.PI) / 180;
    const wh = 2 * Math.tan(fov / 2) * kamera.position.z;
    pxProEinheit = window.innerHeight / wh;
    textFlaechenMessen();

    // Über Text schnell verschwinden, danach langsam zurückkommen. Sonst blitzt
    // ein vorbeiziehender Tropfen mitten im Wort auf.
    const blendeWeg = 1 - Math.exp(-dt * 14);
    const blendeZurueck = 1 - Math.exp(-dt * 3);
    const reibung = Math.exp(-REIBUNG * dt);

    // --- Cursor-Schieber ---
    strahl.setFromCamera(zeiger, kamera);
    strahl.ray.intersectPlane(ebene, zentrum);
    vA.fromArray(pos, 0).lerp(zentrum, 1 - Math.exp(-9 * dt)).toArray(pos, 0);
    zeigerlicht.position.set(pos[0], pos[1], pos[2] + 2);

    // --- Schwebende Tropfen ---
    for (let i = 1; i < ANZAHL; i++) {
      const b = i * 3;
      vA.fromArray(pos, b); vB.fromArray(geschw, b);
      vDiff.subVectors(zentrum, vA);
      /* Anziehung zum Zeiger, aber in seiner Nähe abgeschaltet. Sonst sammeln
         sich alle Tropfen auf dem Mauszeiger zu einem dichten Klumpen, sobald
         er einen Moment stillsteht — in Zeitlupe fehlt ihnen das Tempo, sich
         wieder auseinanderzuschieben. */
      const naehe = MathUtils.clamp((vDiff.length() - 2.5) / 4, 0, 1);
      vB.addScaledVector(vDiff.normalize(), FOLGEN * naehe * dt);
      vB.y += schub * groesse[i] * SCHUB_KRAFT * dt;
      vB.multiplyScalar(reibung).clampLength(0, MAXV);
      vA.addScaledVector(vB, dt);
      for (let j = 0; j < ANZAHL; j++) {
        if (j === i) continue;
        const ob = j * 3;
        vDiff.set(pos[ob] - vA.x, pos[ob + 1] - vA.y, pos[ob + 2] - vA.z);
        const d = vDiff.length(), rSumme = groesse[i] + groesse[j];
        if (d > 0 && d < rSumme) {
          // Überlappung fast vollständig auflösen. Bei 0,5 blieben die Tropfen
          // in Zeitlupe ineinander stecken, statt sich zu berühren.
          const druck = (rSumme - d) * 0.9;
          vDiff.normalize();
          vA.addScaledVector(vDiff, -druck);                  // Lagekorrektur
          vB.addScaledVector(vDiff, -druck * TRENN_KRAFT * dt); // Rückstoß
        }
      }
      if (Math.abs(vA.x) + groesse[i] > raum.x) { vA.x = Math.sign(vA.x) * (raum.x - groesse[i]); vB.x *= -ABPRALL; }
      if (Math.abs(vA.y) + groesse[i] > raum.y) { vA.y = Math.sign(vA.y) * (raum.y - groesse[i]); vB.y *= -ABPRALL; }
      if (Math.abs(vA.z) + groesse[i] > raum.z) { vA.z = Math.sign(vA.z) * (raum.z - groesse[i]); vB.z *= -ABPRALL; }
      vA.toArray(pos, b); vB.toArray(geschw, b);

      const ziel = ueberText(vA, groesse[i], groesse[i]) ? alphaText[i] : ALPHA_VOLL;
      alpha[i] += (ziel - alpha[i]) * (ziel < alpha[i] ? blendeWeg : blendeZurueck);
    }
    schub *= Math.exp(-7.6 * dt);

    // --- Regen ---
    const stoss = pumpenStoss();
    for (let i = 0; i < REGEN_ANZAHL; i++) {
      const b = i * 3;
      if (rWartet[i] > 0) {
        rWartet[i] -= dt;
        rAlpha[i] = 0;
        continue;
      }
      // Gebremstes Fallen mit Endgeschwindigkeit
      rGeschw[b + 1] = Math.max(rGeschw[b + 1] - SCHWERKRAFT * dt, -MAX_FALL);
      rPos[b] += rGeschw[b] * dt;
      rPos[b + 1] += rGeschw[b + 1] * dt;

      if (rPos[b + 1] < -raum.y - 1.5) {
        regenSetzen(i);
        // Beim Pumpen kommen die Tropfen dichter — ungleichmäßig, sonst wirkt
        // es wie ein Vorhang statt wie Wasser.
        rWartet[i] = MathUtils.randFloat(0.25, 1.5) * (1 - 0.85 * stoss);
        continue;
      }
      // Fallende Tropfen ziehen sich in die Länge, je schneller sie werden.
      // In Zeitlupe fällt das milder aus — langsame Tropfen sind runder.
      rStreckung[i] = MathUtils.clamp(1 + Math.abs(rGeschw[b + 1]) * 0.09, 1, 1.6);
      vA.set(rPos[b], rPos[b + 1], rPos[b + 2]);
      const ziel = ueberText(vA, rGroesse[i], rGroesse[i] * rStreckung[i]) ? rAlphaText[i] : ALPHA_VOLL;
      rAlpha[i] += (ziel - rAlpha[i]) * (ziel < rAlpha[i] ? blendeWeg : blendeZurueck);
    }

    // --- Matrizen schreiben ---
    schwebeAlphaAttr.array.set(alpha);
    schwebeAlphaAttr.needsUpdate = true;
    for (let i = 0; i < ANZAHL; i++) {
      platzhalter.position.fromArray(pos, i * 3);
      platzhalter.rotation.set(0, 0, Math.sin(pos[i * 3] * 0.4) * 0.18); // leichtes Wiegen
      platzhalter.scale.setScalar(i === 0 ? 0.0001 : groesse[i]);        // Cursor-Schieber unsichtbar
      platzhalter.updateMatrix();
      mesh.setMatrixAt(i, platzhalter.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    regenAlphaAttr.array.set(rAlpha);
    regenAlphaAttr.needsUpdate = true;
    for (let i = 0; i < REGEN_ANZAHL; i++) {
      platzhalter.position.fromArray(rPos, i * 3);
      platzhalter.rotation.set(0, 0, 0);
      platzhalter.scale.set(rGroesse[i], rGroesse[i] * rStreckung[i], rGroesse[i]);
      platzhalter.updateMatrix();
      regenMesh.setMatrixAt(i, platzhalter.matrix);
    }
    regenMesh.instanceMatrix.needsUpdate = true;
  }

  function groesseAnpassen() {
    const w = window.innerWidth || 1, h = window.innerHeight || 1;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    const fov = (kamera.fov * Math.PI) / 180;
    const wh = 2 * Math.tan(fov / 2) * kamera.position.z;
    raum.y = wh / 2;
    raum.x = (wh * kamera.aspect) / 2;
    raum.z = raum.x / 4;
    quelleMessen();
  }
  window.addEventListener("resize", groesseAnpassen);
  groesseAnpassen();
  for (let i = 0; i < REGEN_ANZAHL; i++) regenSetzen(i);

  /* Das Bild der Duschbrause ist beim Seitenaufbau womöglich noch nicht
     geladen und hat dann keine Maße. Sobald es steht, wird die Düse neu
     vermessen und alle noch wartenden Tropfen bekommen den richtigen Austritt. */
  const brause = document.querySelector("[data-tropfen-quelle]");
  if (brause && !brause.complete) {
    brause.addEventListener("load", () => {
      quelleMessen();
      for (let i = 0; i < REGEN_ANZAHL; i++) {
        if (rWartet[i] > 0) regenSetzen(i);
      }
    }, { once: true });
  }

  const uhr = new Clock();
  let laeuft = false, raf = 0;
  function schleife() {
    raf = requestAnimationFrame(schleife);
    const dt = Math.min(uhr.getDelta(), 0.05);
    schritt(dt);
    renderer.render(szene, kamera);
  }
  function laufen(an) {
    if (an && !laeuft) { laeuft = true; uhr.start(); schleife(); }
    else if (!an && laeuft) { laeuft = false; cancelAnimationFrame(raf); uhr.stop(); }
  }
  laufen(true);
  document.addEventListener("visibilitychange", () => laufen(!document.hidden));
}
