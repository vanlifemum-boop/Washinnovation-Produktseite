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

Im Farbmodus wird **jedes** passende Pixel entfernt, auch eingeschlossene. Die
Flutfüllung gibt es nur, um im Helligkeitsmodus einen weißen Produktkörper zu
schützen; bei eigener Hintergrundfarbe braucht es diesen Schutz nicht, und sie
richtet dort sogar Schaden an — Löcher *im* Produkt sind vom Rand aus nicht
erreichbar und blieben als farbige Flecken stehen. Beim hängenden Wasserbeutel
ist das der Spalt zwischen den beiden Gurten.

### Vorbereitete Zuschnitte für einen Abschnitt „So funktioniert's"

Beide Behälter sind ausgemessen, aber derzeit **nicht** eingebunden: Im Hero ist
kein Platz für sie (siehe README, „Warum kein Behälterbild im Hero"). Für einen
eigenen Abschnitt genügen diese Einzeiler.

Hängende Flasche aus dem Pocket Bottle Shower Mini — Auslass bei 46 % / 99,5 %:

```bash
node -e 'require("sharp")("public/bilder/produkte/pocket-bottle-shower-mini.jpg")
  .extract({left:320,top:0,width:205,height:518}).png().toFile("/tmp/flasche.png")'
node werkzeuge/freistellen.mjs /tmp/flasche.png public/bilder/produkte/flasche-aufhaengung.png farbe 30
```

Hängender 4-Liter-Beutel aus dem Pocket Bath Plus — Auslass bei 52 % / 99 %.
Achtung: Links oben ragt das Katalog-Logo in den Ausschnitt und muss vorher
zugedeckt werden, sonst bleibt es als blauer Ring stehen:

```bash
node -e 'const sharp=require("sharp");(async()=>{
  const {data,info}=await sharp("public/bilder/produkte/pocket-bath-plus.jpg")
    .extract({left:105,top:0,width:245,height:678}).raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<56;y++)for(let x=0;x<68;x++){const i=(y*info.width+x)*info.channels;
    data[i]=179;data[i+1]=200;data[i+2]=231;}
  await sharp(data,{raw:info}).png().toFile("/tmp/beutel.png");})()'
node werkzeuge/freistellen.mjs /tmp/beutel.png public/bilder/produkte/beutel-aufhaengung.png farbe 30
```

Gemessene Abstände zur Hintergrundfarbe: Hintergrund 1, weißer Flaschenboden 61,
schwarze Hülle 205. Toleranz 30 trennt das sauber.

### Die Brause ist eng beschnitten — bitte so lassen

`public/bilder/produkte/handy-shower-foto.png` war einmal 451 × 501 px groß, das
sichtbare Produkt steckte aber nur in x 104–237 — keine 30 % der Bildbreite. Von
jeder CSS-Breite blieb weniger als ein Drittel Brause übrig. Jetzt ist die Datei
auf **146 × 489** beschnitten. Wer sie ersetzt, muss genauso eng beschneiden und
danach die Prozentwerte im Markup neu ausmessen: `data-duese`, `data-einlass`
und die beiden `clip-path`-Werte in `design.css`.

**Das Ergebnis immer einzeln ansehen, bevor es eingebaut wird** — und zwar auf
dunklem Grund, sonst fallen stehengebliebene Farbränder gar nicht auf.
