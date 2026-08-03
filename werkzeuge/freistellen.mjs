/**
 * Stellt ein Produktfoto frei: Der vom Rand zusammenhängende helle Hintergrund
 * wird durchsichtig, das Produkt selbst bleibt stehen — auch wenn es weiß ist.
 *
 * Verfahren: Flutfüllung von den Bildrändern aus. Nur was vom Rand aus über
 * helle Nachbarpixel erreichbar ist, gilt als Hintergrund. Eine reine
 * Helligkeitsschwelle würde den weißen Produktkörper mitlöschen.
 *
 * Aufruf: node werkzeuge/freistellen.mjs <quelle> <ziel.png> [schwelle]
 */
import sharp from "sharp";

const [, , quelle, ziel, schwelleRoh] = process.argv;
if (!quelle || !ziel) {
  console.error("Aufruf: node werkzeuge/freistellen.mjs <quelle> <ziel.png> [schwelle]");
  process.exit(1);
}
const SCHWELLE = Number(schwelleRoh ?? 232); // ab dieser Helligkeit gilt ein Pixel als Hintergrund

const bild = sharp(quelle).ensureAlpha();
const { data, info } = await bild.raw().toBuffer({ resolveWithObject: true });
const { width: b, height: h, channels: k } = info;

const hell = (i) => (data[i * k] + data[i * k + 1] + data[i * k + 2]) / 3;

const hintergrund = new Uint8Array(b * h);
const stapel = [];

// Startpunkte: alle Randpixel, die hell genug sind
for (let x = 0; x < b; x++) {
  stapel.push(x, (h - 1) * b + x);
}
for (let y = 0; y < h; y++) {
  stapel.push(y * b, y * b + b - 1);
}

while (stapel.length) {
  const i = stapel.pop();
  if (hintergrund[i]) continue;
  if (hell(i) < SCHWELLE) continue;
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
console.log(`${ziel}: ${b}×${h}, ${anteil} % als Hintergrund entfernt`);
