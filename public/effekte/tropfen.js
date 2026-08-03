/* WashInnovation — schwebende Tropfen-Ebene (vanilla Three.js, lokal gevendort)
 *
 * Portiert von der WowMoman-Kugelebene, umgebaut auf Wasser: Tropfen in Weiß- und
 * Blautönen als fixe Ebene über der ganzen Seite. Sie folgen der Maus, bekommen
 * beim Scrollen Schub und werden über Text durchsichtig, damit alles lesbar bleibt.
 *
 * Abschaltungen (bewusst großzügig):
 *   - prefers-reduced-motion: reduce  → läuft gar nicht erst an
 *   - kein WebGL                      → still ab, die Seite bleibt vollständig
 *   - Tab im Hintergrund              → rAF-Schleife pausiert
 *   - schmale Viewports               → weniger Tropfen
 */
import {
  Clock, PerspectiveCamera, Scene, WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping,
  MathUtils, Vector2, Vector3, Color, Object3D, InstancedMesh, SphereGeometry,
  MeshStandardMaterial, AmbientLight, PointLight, DirectionalLight, Raycaster, Plane,
  InstancedBufferAttribute,
} from "./vendor/three.module.min.js";

if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  try { init(); } catch (e) { /* WebGL nicht verfügbar → Seite bleibt ohne Ebene */ }
}

function init() {
  // Weiß-Blau: von fast weißem Schaum bis Tiefsee. Bewusst wenig Sättigung —
  // die Tropfen sollen wie Wasser wirken, nicht wie Murmeln.
  const FARBEN = ["#ffffff", "#dcefff", "#9ed2f5", "#4aa8e8", "#0f6fc4"];

  const schmal = window.innerWidth < 760;
  const ANZAHL = schmal ? 45 : 90;   // Tropfen inkl. unsichtbarem Cursor-Schieber
  const CURSOR_R = 1.4;              // Radius des unsichtbaren Cursor-Schiebers
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

  // Licht: kühles Grundlicht, ein hartes Streiflicht für den nassen Glanz und
  // ein blaues Punktlicht, das am Zeiger hängt.
  szene.add(new AmbientLight(0xffffff, 1.0));
  const streiflicht = new DirectionalLight(0xffffff, 1.8);
  streiflicht.position.set(6, 9, 10);
  szene.add(streiflicht);
  const gegenlicht = new DirectionalLight(0x9ed2f5, 0.8);
  gegenlicht.position.set(-8, -4, 6);
  szene.add(gegenlicht);
  const zeigerlicht = new PointLight(0x4aa8e8, 55, 35, 1.8);
  szene.add(zeigerlicht);

  // Per-Tropfen-Transparenz über Instanz-Attribut + Shader-Patch:
  // So kann jeder einzelne Tropfen über Text ausblenden, ohne das Material zu tauschen.
  const geo = new SphereGeometry(1, 26, 26);
  const alphaAttr = new InstancedBufferAttribute(new Float32Array(ANZAHL).fill(ALPHA_VOLL), 1);
  geo.setAttribute("aAlpha", alphaAttr);
  // Wasser: kaum metallisch, sehr glatt — das ergibt den harten kleinen Glanzpunkt.
  const mat = new MeshStandardMaterial({ metalness: 0.15, roughness: 0.06, transparent: true });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aAlpha;\nvarying float vAlpha;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAlpha = aAlpha;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vAlpha;")
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );");
  };
  const mesh = new InstancedMesh(geo, mat, ANZAHL);
  const farbObjekte = FARBEN.map((c) => new Color(c));
  for (let i = 0; i < ANZAHL; i++) mesh.setColorAt(i, farbObjekte[i % farbObjekte.length]);
  mesh.instanceColor.needsUpdate = true;
  szene.add(mesh);

  // Physik-Daten als flache Arrays — ein Objekt pro Tropfen wäre hier reine Last.
  const pos = new Float32Array(ANZAHL * 3);
  const geschw = new Float32Array(ANZAHL * 3);
  const groesse = new Float32Array(ANZAHL);
  const alpha = new Float32Array(ANZAHL).fill(ALPHA_VOLL);
  const raum = { x: 12, y: 6, z: 4 };
  groesse[0] = CURSOR_R;
  for (let i = 1; i < ANZAHL; i++) groesse[i] = MathUtils.randFloat(0.28, 0.8);
  for (let i = 0; i < ANZAHL; i++) {
    pos[i * 3] = MathUtils.randFloatSpread(raum.x * 2);
    pos[i * 3 + 1] = MathUtils.randFloatSpread(raum.y * 2);
    pos[i * 3 + 2] = MathUtils.randFloatSpread(raum.z * 2);
    geschw[i * 3] = MathUtils.randFloatSpread(0.02);
    geschw[i * 3 + 1] = MathUtils.randFloatSpread(0.02);
  }

  const REIBUNG = 0.995, ABPRALL = 0.6, MAXV = 0.2, FOLGEN = 0.4;
  const zentrum = new Vector3();
  const platzhalter = new Object3D();
  const vA = new Vector3(), vB = new Vector3(), vDiff = new Vector3(), vProj = new Vector3();

  // Maus → Weltposition auf der Ebene z=0
  const zeiger = new Vector2(0.35, 0.25);
  const strahl = new Raycaster();
  const ebene = new Plane(new Vector3(0, 0, 1), 0);
  window.addEventListener("pointermove", (e) => {
    zeiger.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }, { passive: true });

  // Scroll-Impuls: die Tropfen bekommen beim Scrollen einen Schub nach oben/unten
  let schub = 0, letztesY = window.scrollY;
  window.addEventListener("scroll", () => {
    const dy = window.scrollY - letztesY;
    letztesY = window.scrollY;
    schub = MathUtils.clamp(schub + dy * 0.005, -0.25, 0.25);
  }, { passive: true });

  // Textflächen einsammeln — darüber werden die Tropfen durchsichtig.
  // Ohne das wäre die Seite an manchen Stellen schlicht nicht lesbar.
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
  setInterval(textFlaechenSammeln, 2000); // Reveals und Layout-Änderungen nachziehen
  window.addEventListener("resize", textFlaechenSammeln);

  function schritt(dt) {
    // Der unsichtbare Tropfen 0 hängt am Zeiger und schiebt die anderen weg.
    strahl.setFromCamera(zeiger, kamera);
    strahl.ray.intersectPlane(ebene, zentrum);
    vA.fromArray(pos, 0).lerp(zentrum, 0.15).toArray(pos, 0);
    zeigerlicht.position.set(pos[0], pos[1], pos[2] + 2);

    for (let i = 1; i < ANZAHL; i++) {
      const b = i * 3;
      vA.fromArray(pos, b); vB.fromArray(geschw, b);
      // sanfte Anziehung zum Zeiger
      vDiff.subVectors(zentrum, vA);
      vB.addScaledVector(vDiff.normalize(), FOLGEN * dt);
      vB.y += schub * groesse[i];
      vB.multiplyScalar(REIBUNG).clampLength(0, MAXV);
      vA.add(vB);
      // Kollisionen: einfache Paarprüfung, bei ≤90 Tropfen völlig ausreichend
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
    }
    schub *= 0.88;

    // Projektion auf den Bildschirm, Text-Prüfung, weiche Alpha-Blende
    const w = window.innerWidth, h = window.innerHeight;
    const fov = (kamera.fov * Math.PI) / 180;
    const wh = 2 * Math.tan(fov / 2) * kamera.position.z;
    const pxProEinheit = h / wh;
    const blende = 1 - Math.exp(-dt * 10);
    for (let i = 1; i < ANZAHL; i++) {
      vProj.fromArray(pos, i * 3).project(kamera);
      const sx = ((vProj.x + 1) / 2) * w;
      const sy = ((1 - vProj.y) / 2) * h + window.scrollY; // Dokument-Koordinate
      const rPx = groesse[i] * pxProEinheit;
      let ueberText = false;
      for (let k = 0; k < textFlaechen.length; k++) {
        const t = textFlaechen[k];
        const cx = Math.max(t.l, Math.min(sx, t.r));
        const cy = Math.max(t.o, Math.min(sy, t.u));
        const dx = sx - cx, dy2 = sy - cy;
        if (dx * dx + dy2 * dy2 < rPx * rPx) { ueberText = true; break; }
      }
      const ziel = ueberText ? ALPHA_TEXT : ALPHA_VOLL;
      alpha[i] += (ziel - alpha[i]) * blende;
    }
    alphaAttr.array.set(alpha);
    alphaAttr.needsUpdate = true;

    for (let i = 0; i < ANZAHL; i++) {
      platzhalter.position.fromArray(pos, i * 3);
      platzhalter.scale.setScalar(i === 0 ? 0.0001 : groesse[i]); // Cursor-Schieber bleibt unsichtbar
      platzhalter.updateMatrix();
      mesh.setMatrixAt(i, platzhalter.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
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
  }
  window.addEventListener("resize", groesseAnpassen);
  groesseAnpassen();

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
