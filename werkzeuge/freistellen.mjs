/**
 * Stellt ein Produktfoto frei: Der vom Rand zusammenhängende Hintergrund wird
 * durchsichtig, das Produkt selbst bleibt stehen — auch wenn es weiß ist.
 *
 * Verfahren: Flutfüllung von den Bildrändern aus. Nur was vom Rand aus über
 * hintergrundähnliche Nachbarpixel erreichbar ist, gilt als Hintergrund. Eine
 * reine Schwelle ohne Flutfüllung würde den weißen Produktkörper mitlöschen.
 *
 * Zwei Modi, weil die Katalogfotos zwei verschiedene Hintergründe haben:
 *
 *   hell   — Hintergrund ist heller als alles andere (weiße Freisteller).
 *            Die Schwelle muss über der Helligkeit des Produkts liegen, sonst
 *            frisst die Flutfüllung einen weißen Produktkörper mit.
 *            Bei der Duschbrause: Hintergrund 255, Körper 236–247 → 251.
 *
 *   farbe  — Hintergrund ist eine Fläche in einer bestimmten Farbe, die nicht
 *            unbedingt die hellste im Bild ist. Verglichen wird der Abstand zu
 *            einer Referenzfarbe aus der Bildecke, nicht die Helligkeit.
 *            Nötig bei der Flasche: Hintergrund hellblau (178, 200, 232), der
 *            Flaschenboden aber weiß und damit *heller* als der Hintergrund —
 *            im Modus „hell" liefe die Flutfüllung mitten durch ihn hindurch.
 *
 * Aufruf: node werkzeuge/freistellen.mjs <quelle> <ziel.png> [schwelle]
 *         node werkzeuge/freistellen.mjs <quelle> <ziel.png> farbe [toleranz]
 */
import sharp from "sharp";

const [, , quelle, ziel, modusRoh, toleranzRoh] = process.argv;
if (!quelle || !ziel) {
  console.error("Aufruf: node werkzeuge/freistellen.mjs <quelle> <ziel.png> [schwelle]");
  console.error("        node werkzeuge/freistellen.mjs <quelle> <ziel.png> farbe [toleranz]");
  process.exit(1);
}

const NACH_FARBE = modusRoh === "farbe";
const SCHWELLE = Number(NACH_FARBE ? 0 : (modusRoh ?? 232));
const TOLERANZ = Number(toleranzRoh ?? 30);

const bild = sharp(quelle).ensureAlpha();
const { data, info } = await bild.raw().toBuffer({ resolveWithObject: true });
const { width: b, height: h, channels: k } = info;

const hell = (i) => (data[i * k] + data[i * k + 1] + data[i * k + 2]) / 3;

// Referenzfarbe für den Farbmodus: die linke obere Ecke. Alle Katalogseiten
// haben dort Hintergrund und nie Produkt.
const referenz = [data[0], data[1], data[2]];
const abstand = (i) => Math.max(
  Math.abs(data[i * k] - referenz[0]),
  Math.abs(data[i * k + 1] - referenz[1]),
  Math.abs(data[i * k + 2] - referenz[2]),
);

/** Zählt dieses Pixel als Hintergrund? */
const istHintergrund = NACH_FARBE
  ? (i) => abstand(i) <= TOLERANZ
  : (i) => hell(i) >= SCHWELLE;

const hintergrund = new Uint8Array(b * h);
const stapel = [];

// Startpunkte: alle Randpixel
for (let x = 0; x < b; x++) {
  stapel.push(x, (h - 1) * b + x);
}
for (let y = 0; y < h; y++) {
  stapel.push(y * b, y * b + b - 1);
}

while (stapel.length) {
  const i = stapel.pop();
  if (hintergrund[i]) continue;
  if (!istHintergrund(i)) continue;
  hintergrund[i] = 1;
  const x = i % b, y = (i / b) | 0;
  if (x > 0) stapel.push(i - 1);
  if (x < b - 1) stapel.push(i + 1);
  if (y > 0) stapel.push(i - b);
  if (y < h - 1) stapel.push(i + b);
}

// Kanten weich machen: Hintergrundpixel mit Produktnachbarn bekommen Teilalpha,
// sonst bleibt eine harte, treppige Silhouette stehen.
let entfernt = 0;
for (let i = 0; i < b * h; i++) {
  if (!hintergrund[i]) continue;
  const x = i % b, y = (i / b) | 0;
  let nachbarnProdukt = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= b || ny >= h) continue;
      if (!hintergrund[ny * b + nx]) nachbarnProdukt++;
    }
  }
  data[i * k + 3] = nachbarnProdukt > 0 ? Math.min(255, nachbarnProdukt * 40) : 0;
  entfernt++;
}

await sharp(data, { raw: { width: b, height: h, channels: k } }).png().toFile(ziel);

const anteil = ((entfernt / (b * h)) * 100).toFixed(1);
const modus = NACH_FARBE
  ? `Farbe ${referenz.join(",")} ± ${TOLERANZ}`
  : `Helligkeit ≥ ${SCHWELLE}`;
console.log(`${ziel}: ${b}×${h}, ${anteil} % als Hintergrund entfernt (${modus})`);
