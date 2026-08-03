/* WashInnovation — Tropfen-Ebene (vanilla Three.js, lokal gevendort)
 *
 * Zwei Gruppen echter Tropfenformen als fixe Ebene über der ganzen Seite:
 *
 *   1. SCHWEBEND — Tropfen treiben umher, folgen der Maus, bekommen beim
 *      Scrollen Schub und stoßen sich gegenseitig ab.
 *   2. REGEN — Tropfen treten aus der Düse der Duschbrause im Hero aus, fallen
 *      beschleunigt nach unten und regnen über die Seite. Ist die Brause
 *      weggescrollt, kommt der Regen von der oberen Bildschirmkante.
 *
 * Beide werden über Text durchsichtig, damit alles lesbar bleibt.
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
  const FARBEN = ["#ffffff", "#dcefff", "#9ed2f5", "#4aa8e8", "#0f6fc4"];

  const schmal = window.innerWidth < 760;
  const ANZAHL = schmal ? 40 : 78;        // schwebende Tropfen inkl. Cursor-Schieber
  const REGEN_ANZAHL = schmal ? 26 : 55;  // fallende Tropfen
  const CURSOR_R = 1.4;
  const ALPHA_VOLL = 0.9, ALPHA_TEXT = 0.14;

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
    const mat = new MeshStandardMaterial({ metalness: 0.15, roughness: 0.06, transparent: true });
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
    // Regen etwas heller als die schwebenden Tropfen — er soll vor allem lesbar bleiben
    regenMesh.setColorAt(i, farbObjekte[i % 3]);
  }
  regenMesh.instanceColor.needsUpdate = true;
  szene.add(regenMesh);

  /* ---------------------- Physik: schwebende Tropfen ---------------------- */
  const pos = new Float32Array(ANZAHL * 3);
  const geschw = new Float32Array(ANZAHL * 3);
  const groesse = new Float32Array(ANZAHL);
  const alpha = new Float32Array(ANZAHL).fill(ALPHA_VOLL);
  const raum = { x: 12, y: 6, z: 4 };
  groesse[0] = CURSOR_R;
  for (let i = 1; i < ANZAHL; i++) groesse[i] = MathUtils.randFloat(0.26, 0.72);
  for (let i = 0; i < ANZAHL; i++) {
    pos[i * 3] = MathUtils.randFloatSpread(raum.x * 2);
    pos[i * 3 + 1] = MathUtils.randFloatSpread(raum.y * 2);
    pos[i * 3 + 2] = MathUtils.randFloatSpread(raum.z * 2);
    geschw[i * 3] = MathUtils.randFloatSpread(0.02);
    geschw[i * 3 + 1] = MathUtils.randFloatSpread(0.02);
  }

  const REIBUNG = 0.995, ABPRALL = 0.6, MAXV = 0.2, FOLGEN = 0.4;

  /* ------------------------------ Regen ---------------------------------- */
  const rPos = new Float32Array(REGEN_ANZAHL * 3);
  const rGeschw = new Float32Array(REGEN_ANZAHL * 3);
  const rGroesse = new Float32Array(REGEN_ANZAHL);
  const rAlpha = new Float32Array(REGEN_ANZAHL).fill(ALPHA_VOLL);
  const rWartet = new Float32Array(REGEN_ANZAHL);       // Sekunden bis zum nächsten Austritt
  const SCHWERKRAFT = 9.0;

  for (let i = 0; i < REGEN_ANZAHL; i++) {
    rGroesse[i] = MathUtils.randFloat(0.12, 0.3);
    rWartet[i] = Math.random() * 3.5;
  }

  /* Düse der Duschbrause im Dokument finden.
     Das Element trägt data-tropfen-quelle und data-duese="x%,y%" — damit weiß
     die Ebene, wo genau am Bild die Tropfen austreten. */
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
    if (quelle && quelle.y > -60 && quelle.y < window.innerHeight) {
      // Austritt an der Düse — mit ein wenig Streuung, sonst wirkt es wie eine Schnur
      const p = ausBildschirm(quelle.x, quelle.y, z);
      rPos[b] = p.x + MathUtils.randFloatSpread(0.45);
      rPos[b + 1] = p.y;
      rPos[b + 2] = z;
      rGeschw[b] = MathUtils.randFloatSpread(0.5);
      rGeschw[b + 1] = -MathUtils.randFloat(0.4, 1.4);
    } else {
      // Brause nicht im Bild: Regen fällt von oben auf die Seite
      rPos[b] = MathUtils.randFloatSpread(raum.x * 2);
      rPos[b + 1] = raum.y + MathUtils.randFloat(0.5, 4);
      rPos[b + 2] = z;
      rGeschw[b] = MathUtils.randFloatSpread(0.3);
      rGeschw[b + 1] = -MathUtils.randFloat(1, 3);
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
     Ohne das wäre die Seite an manchen Stellen schlicht nicht lesbar. */
  let textFlaechen = [];
  function textFlaechenSammeln() {
    const els = document.querySelectorAll("h1, h2, h3, h4, p, li, blockquote, .btn, .augenbraue, .zaehler-zahl, td, th, label, summary");
    const flaechen = [];
    els.forEach((el) => {
      if (!el.offsetParent && el.offsetWidth === 0) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      flaechen.push({ l: r.left, o: r.top + window.scrollY, r: r.right, u: r.bottom + window.scrollY });
    });
    textFlaechen = flaechen;
  }
  textFlaechenSammeln();
  setInterval(textFlaechenSammeln, 2000);
  window.addEventListener("resize", textFlaechenSammeln);

  let pxProEinheit = 1;
  function ueberText(weltPos, radius) {
    vProj.copy(weltPos).project(kamera);
    const sx = ((vProj.x + 1) / 2) * window.innerWidth;
    const sy = ((1 - vProj.y) / 2) * window.innerHeight + window.scrollY;
    const rPx = radius * pxProEinheit;
    for (let k = 0; k < textFlaechen.length; k++) {
      const t = textFlaechen[k];
      const cx = Math.max(t.l, Math.min(sx, t.r));
      const cy = Math.max(t.o, Math.min(sy, t.u));
      const dx = sx - cx, dy = sy - cy;
      if (dx * dx + dy * dy < rPx * rPx) return true;
    }
    return false;
  }

  /* ------------------------------- Schritt -------------------------------- */
  function schritt(dt) {
    const fov = (kamera.fov * Math.PI) / 180;
    const wh = 2 * Math.tan(fov / 2) * kamera.position.z;
    pxProEinheit = window.innerHeight / wh;
    const blende = 1 - Math.exp(-dt * 10);

    // --- Cursor-Schieber ---
    strahl.setFromCamera(zeiger, kamera);
    strahl.ray.intersectPlane(ebene, zentrum);
    vA.fromArray(pos, 0).lerp(zentrum, 0.15).toArray(pos, 0);
    zeigerlicht.position.set(pos[0], pos[1], pos[2] + 2);

    // --- Schwebende Tropfen ---
    for (let i = 1; i < ANZAHL; i++) {
      const b = i * 3;
      vA.fromArray(pos, b); vB.fromArray(geschw, b);
      vDiff.subVectors(zentrum, vA);
      vB.addScaledVector(vDiff.normalize(), FOLGEN * dt);
      vB.y += schub * groesse[i];
      vB.multiplyScalar(REIBUNG).clampLength(0, MAXV);
      vA.add(vB);
      for (let j = 0; j < ANZAHL; j++) {
        if (j === i) continue;
        const ob = j * 3;
        vDiff.set(pos[ob] - vA.x, pos[ob + 1] - vA.y, pos[ob + 2] - vA.z);
        const d = vDiff.length(), rSumme = groesse[i] + groesse[j];
        if (d > 0 && d < rSumme) {
          const druck = (rSumme - d) * 0.5;
          vDiff.normalize();
          vA.addScaledVector(vDiff, -druck);
          vB.addScaledVector(vDiff, -druck * 0.6);
        }
      }
      if (Math.abs(vA.x) + groesse[i] > raum.x) { vA.x = Math.sign(vA.x) * (raum.x - groesse[i]); vB.x *= -ABPRALL; }
      if (Math.abs(vA.y) + groesse[i] > raum.y) { vA.y = Math.sign(vA.y) * (raum.y - groesse[i]); vB.y *= -ABPRALL; }
      if (Math.abs(vA.z) + groesse[i] > raum.z) { vA.z = Math.sign(vA.z) * (raum.z - groesse[i]); vB.z *= -ABPRALL; }
      vA.toArray(pos, b); vB.toArray(geschw, b);

      const ziel = ueberText(vA, groesse[i]) ? ALPHA_TEXT : ALPHA_VOLL;
      alpha[i] += (ziel - alpha[i]) * blende;
    }
    schub *= 0.88;

    // --- Regen ---
    for (let i = 0; i < REGEN_ANZAHL; i++) {
      const b = i * 3;
      if (rWartet[i] > 0) {
        rWartet[i] -= dt;
        rAlpha[i] = 0;
        continue;
      }
      rGeschw[b + 1] -= SCHWERKRAFT * dt;             // beschleunigtes Fallen
      rPos[b] += rGeschw[b] * dt;
      rPos[b + 1] += rGeschw[b + 1] * dt;

      if (rPos[b + 1] < -raum.y - 1.5) {
        regenSetzen(i);
        rWartet[i] = Math.random() * 1.8;             // ungleichmäßig, sonst wirkt es wie ein Vorhang
        continue;
      }
      vA.set(rPos[b], rPos[b + 1], rPos[b + 2]);
      const ziel = ueberText(vA, rGroesse[i]) ? ALPHA_TEXT : ALPHA_VOLL;
      rAlpha[i] += (ziel - rAlpha[i]) * blende;
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
      // Fallende Tropfen ziehen sich in die Länge, je schneller sie werden
      const streckung = MathUtils.clamp(1 + Math.abs(rGeschw[i * 3 + 1]) * 0.18, 1, 2.4);
      platzhalter.scale.set(rGroesse[i], rGroesse[i] * streckung, rGroesse[i]);
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
