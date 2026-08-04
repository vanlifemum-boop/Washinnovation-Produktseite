# Werkzeuge

Einmal-Skripte für die Bildaufbereitung. Sie werden im normalen Betrieb nicht
gebraucht — die Ergebnisse liegen fertig unter `public/bilder/`.

Beide brauchen `sharp`, das absichtlich keine feste Abhängigkeit des Projekts ist:

```bash
npm i -D sharp
```

| Skript | Zweck |
|---|---|
| `katalog-zuschnitt.mjs` | Schneidet die Produktfotos aus den Seiten des Produktkatalogs 2025. Die Bildausschnitte stehen als Anteile (0…1) im Skript und können dort nachjustiert werden. |
| `freistellen.mjs` | Entfernt den Hintergrund eines Produktfotos per Flutfüllung vom Bildrand. Zwei Modi — siehe unten. |

Die Quelldateien der Katalogseiten liegen nicht im Repo. Wenn die Zuschnitte neu
erzeugt werden sollen, muss der Pfad `QUELLE` im Skript auf den Ordner mit den
Katalogseiten zeigen.

## `freistellen.mjs` — welcher Modus?

```bash
node werkzeuge/freistellen.mjs <quelle> <ziel.png> [schwelle]        # nach Helligkeit
node werkzeuge/freistellen.mjs <quelle> <ziel.png> farbe [toleranz]  # nach Farbe
```

**Helligkeit** — für Fotos auf weißem Grund. Die Schwelle muss *über* der
Helligkeit des Produkts liegen, sonst frisst die Flutfüllung einen weißen
Produktkörper mit. Bei der Duschbrause: Hintergrund 255, Körper 236–247 →
Schwelle 251.

**Farbe** — wenn der Hintergrund *nicht* das Hellste im Bild ist. Verglichen wird
der Abstand zur Farbe der linken oberen Ecke statt die Helligkeit. Nötig bei der
Flasche: Hintergrund hellblau (178, 200, 232), der Flaschenboden aber weiß und
damit heller als der Hintergrund — im Helligkeitsmodus liefe die Flutfüllung
mitten durch ihn hindurch und löschte ihn weg.

So ist `public/bilder/produkte/flasche-aufhaengung.png` entstanden:

```bash
node -e 'require("sharp")("public/bilder/produkte/pocket-bottle-shower-mini.jpg")
  .extract({left:320,top:0,width:205,height:518}).png().toFile("/tmp/flasche.png")'
node werkzeuge/freistellen.mjs /tmp/flasche.png public/bilder/produkte/flasche-aufhaengung.png farbe 30
```

Gemessene Abstände zur Hintergrundfarbe: Hintergrund 1, weißer Flaschenboden 61,
schwarze Hülle 205. Toleranz 30 trennt das sauber.

**Das Ergebnis immer einzeln ansehen, bevor es eingebaut wird** — und zwar auf
dunklem Grund, sonst fallen stehengebliebene Farbränder gar nicht auf.
