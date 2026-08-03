/**
 * Schneidet die Produktfotos aus den Seiten des Produktkatalogs 2025 heraus.
 *
 * Die Angaben sind Anteile der Seitenmaße (0…1), damit sie unabhängig von der
 * Auflösung der Vorlage bleiben. Einmalig ausgeführt; die Ergebnisse liegen
 * danach als Dateien in public/bilder/produkte/ und sind die Quelle für die Seite.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const QUELLE = "/root/.claude/uploads/711ecc5f-8eec-54ef-8858-cdc1f701b0bf";
const ZIEL = "public/bilder/produkte";
mkdirSync(ZIEL, { recursive: true });

const ZUSCHNITTE = [
  { datei: "90315bc1-1000110718.jpg", name: "pocket-bath-plus",       l: 0.546, o: 0.084, r: 0.950, u: 0.374 },
  { datei: "b9381eb4-1000110719.jpg", name: "pocket-bottle-shower-mini", l: 0.552, o: 0.080, r: 0.992, u: 0.372 },
  { datei: "5a989e17-1000110720.jpg", name: "pocket-self-priming-shower", l: 0.266, o: 0.074, r: 0.483, u: 0.376 },
  { datei: "5a989e17-1000110720.jpg", name: "handy-bath-plus",        l: 0.776, o: 0.074, r: 0.993, u: 0.376 },
  { datei: "517d3ad9-1000110721.jpg", name: "pocket-sink-plus",       l: 0.547, o: 0.083, r: 0.986, u: 0.378 },
  { datei: "855952e1-1000110722.jpg", name: "pocket-sink",            l: 0.266, o: 0.072, r: 0.483, u: 0.374 },
  { datei: "855952e1-1000110722.jpg", name: "pocket-tap-self-priming", l: 0.776, o: 0.072, r: 0.993, u: 0.374 },
];

for (const z of ZUSCHNITTE) {
  const pfad = `${QUELLE}/${z.datei}`;
  const bild = sharp(pfad);
  const { width, height } = await bild.metadata();
  const links = Math.round(z.l * width);
  const oben = Math.round(z.o * height);
  const breite = Math.round((z.r - z.l) * width);
  const hoehe = Math.round((z.u - z.o) * height);

  await sharp(pfad)
    .extract({ left: links, top: oben, width: breite, height: hoehe })
    .resize({ width: 1000, withoutEnlargement: false })
    .jpeg({ quality: 86 })
    .toFile(`${ZIEL}/${z.name}.jpg`);

  console.log(`${z.name}.jpg  ←  ${z.datei}  ${breite}×${hoehe}`);
}
