# WashInnovation — Produktseite

Verkaufsseite für sieben tragbare, wassersparende Sets von WaSH Innovation
(Pocket Bath Plus, Handy Bath Plus, Pocket Self-Priming Shower, Pocket Bottle
Shower Mini, Pocket Sink Plus, Pocket Sink, Pocket Tap Self-Priming) mit
vorbereitetem **1+1-Spendenmodell**: pro Kauf ein gespendetes Produkt —
sichtbar, zählbar und nachprüfbar.

Alle Produktangaben — Vorteile, Lieferumfang, Pflege, Gewicht, Maße,
Artikelnummer — stammen aus dem Produktkatalog 2025 des Herstellers.
**Preise stehen bewusst auf `null`**, sie sind noch nicht festgelegt; die Seite
zeigt dann „Preis folgt".

Gebaut mit **Astro**, statisch, ohne Datenbank. Veröffentlicht über GitHub Pages.

---

## ⚠️ Vor dem Livegang

Die Seite ist vollständig gebaut, aber noch nicht startklar. Diese Punkte gehören
erledigt, bevor sie beworben wird — alle betroffenen Stellen sind im Code und auf
der Seite mit `[PLATZHALTER]` markiert:

1. **Zustimmung des Herstellers.** Für die Verwendung des Namens liegt sie vor.
   Offen ist noch, ob sie auch die Spendenkommunikation abdeckt: Das
   1+1-Versprechen ist das des Vertriebspartners, steht aber unter der Marke des
   Herstellers — das gehört einmal schriftlich festgehalten.
2. **Werberecht.** Konkrete Spendenaussagen sind in Deutschland streng geregelt:
   Empfänger und Höhe müssen benannt sein. Deshalb steht das Modell derzeit als
   Ankündigung auf der Seite, nicht als Versprechen. Unbestimmte Formulierungen
   wie „ein Teil des Erlöses geht an Bedürftige“ sind abmahnfähig.
3. **Keine Spendenquittung.** Wer nicht gemeinnützig ist, darf keine
   Zuwendungsbestätigung ausstellen. Das steht so auf `/1plus1` und `/spenden`.
4. **Rechtstexte prüfen lassen.** Impressum, Datenschutz, AGB und Widerruf sind
   Gerüste, keine Rechtsberatung (`src/inhalte/recht.ts`).
5. **Steuer.** Warenspenden sind umsatzsteuerlich nicht neutral — vor dem Start
   mit der Steuerberatung klären.
6. **Kalkulation.** Ein gespendetes Set heißt: der Einkaufspreis steckt zweimal im
   Verkaufspreis. Falls der Endpreis dadurch nicht marktfähig ist, ist ein fester
   Spendenbetrag je Kauf das ehrlichere Modell.

### Konkrete Platzhalter

| Was | Wo |
|---|---|
| Empfängeradresse für Bestellungen | `src/pages/[lang]/bestellen.astro` (`bestellKonfig.email`) |
| Kontaktadresse | `src/pages/[lang]/kontakt.astro` |
| Preise | `src/content/produkte/<sprache>/*.md` (Feld `preis`) |
| Produktvideos | `public/bilder/produkte/` |
| Firmendaten, Rechtstexte | `src/inhalte/recht.ts` |
| Eure Geschichte | `src/pages/[lang]/ueber-uns.astro` |

Alle Platzhalter finden:

```bash
grep -rn "PLATZHALTER\|PLACEHOLDER\|BITTE-EINTRAGEN" src/
```

---

## Loslegen

```bash
npm install
npm run dev      # http://localhost:4321/Washinnovation-Produktseite/
npm run build    # baut nach dist/
npm run preview  # gebaute Seite ansehen
npm run check    # Typprüfung
```

Veröffentlicht wird automatisch: Ein Push auf `main` oder auf den Arbeitsbranch
startet den Workflow `.github/workflows/pages.yml`, der baut und auf GitHub Pages
ausliefert.

---

## Aufbau

```
public/effekte/     Die Wasser-Effekte (reines JS, gehen nicht durchs Bundling)
public/bilder/      Produktfotos aus dem Katalog, freigestellte Brause, Symbole
src/i18n/           Übersetzungen und Sprachhilfen
src/data/           Projekte, Lieferungen, Veranstaltungen, Wasserzahlen (JSON)
src/content/        Produkte und Journalbeiträge (Markdown, je Sprache ein Ordner)
src/inhalte/        Rechtstexte
src/components/     Zähler, Produktkarte, Bildfläche
src/layouts/        Basis-Layout mit Kopf, Fuß, hreflang
src/pages/[lang]/   Alle Seiten, einmal je Sprache
werkzeuge/          Einmal-Skripte für die Bildaufbereitung (siehe werkzeuge/README.md)
```

---

## Die Effekte

Vorbild ist die Kugel-Ebene der WowMoman-Seite, umgebaut auf Wasser.

| Datei | Was sie macht |
|---|---|
| `public/effekte/tropfen.js` | Fixe Ebene über der ganzen Seite (Three.js, lokal gevendort) mit zwei Gruppen echter Tropfenformen: **schwebende** Tropfen folgen der Maus und bekommen beim Scrollen Schub, **fallende** treten an der Düse der Brause im Hero aus und regnen über die Seite. Beide nutzen dieselbe Palette von Weiß bis Tiefblau. Alles in **Zeitlupe** — der Regen braucht rund fünf Sekunden über die Bildhöhe. Beide Gruppen **werden über Text durchsichtig**, damit alles lesbar bleibt. |
| `public/effekte/pumpe.js` | Der blaue Druckkopf im Hero sinkt beim Runterscrollen ein und kommt beim Hochscrollen zurück — du pumpst mit dem Mausrad. Zusätzlich pumpt er alle 4,5 Sekunden von selbst, damit man es auch im Stillstand sieht. Beim Drücken spritzt es, sonst tropft es langsam weiter. |
| `public/effekte/hero-szene.js` | Zeichnet den Hero prozedural: ein Tropfen fällt, trifft auf, wirft Krone und Ringe — gesteuert allein vom Scroll-Fortschritt. |
| `public/effekte/ripple.js` | Wasserwellen auf Bildflächen (`data-ripple`). Gedämpftes Höhenfeld auf Canvas 2D, rechnet auf 220 px und wird hochskaliert. |
| `public/effekte/schlauch.js` | Durchsichtiger Silikonschlauch, der am unteren Ende der Brause ansetzt und die Seite hinunterläuft. Reines SVG, drei Linien übereinander für die Silikon-Anmutung. |
| `public/effekte/seite.js` | Menü, Reveals, Parallax (`data-parallax`), hochzählender Zähler. |

Alle Effekte schalten sich ab bei `prefers-reduced-motion: reduce`, bei
verstecktem Tab und außerhalb des Sichtbereichs. Ohne WebGL bleibt die Seite
still, aber vollständig.

**Farben und Lesbarkeit hängen zusammen.** `FARBEN` reicht von Weiß bis
Tiefblau, und parallel dazu steht `ALPHA_TEXT_JE_FARBE`: Je dunkler ein Tropfen,
desto stärker verschwindet er über Text. Wer eine Farbe ergänzt, muss dort einen
Wert ergänzen — sonst greift für die neue Farbe der Wert einer fremden. Genau
darum darf der Regen inzwischen die volle Palette nutzen: Die Lesbarkeit hängt an
der Farbe, nicht an der Gruppe. Nachgemessen über Hero, `/wasser` und
`/produkte`: Buchstaben ändern sich um höchstens 17 von 255.

**Alles rechnet in Sekunden, nichts je Bild.** Geschwindigkeiten stehen in
Einheiten pro Sekunde und werden mit `dt` verrechnet, Dämpfungen laufen über
`Math.exp(-k * dt)`. Wer hier eine Zeile ergänzt, muss das mitmachen: Wird je
*Bild* gerechnet, läuft die Szene auf einem 120-Hz-Bildschirm doppelt so
schnell wie auf einem 60-Hz-Gerät. Genau dieser Fehler steckte vorher in der
Tropfen-Physik.

### Der Aufbau im Hero: warum ein Liter reicht

Der Hero zeigt das Funktionsprinzip, nicht nur ein Produktfoto. Aus dem Katalog
(`src/content/produkte/de/pocket-bath-plus.md`):

> „Schwerkraftbetrieben: Der Wasserbehälter wird einfach höher aufgehängt als der
> Duschkopf — ganz ohne Pumpe und Strom."

Im Hero steht davon die Brause: Am **unteren Ende** treten die Tropfen aus und
setzt der Schlauch an, der von dort die Seite hinunterläuft. Die Anschlusspunkte
stehen **im Markup** als Prozent der Bildmaße, nicht als Zahlen in den Skripten:

| Element | Attribut | Wert | Wer liest es |
|---|---|---|---|
| `.hero-produkt__koerper` | `data-duese` | `58.2,98.6` | `tropfen.js` (Austritt) |
| `.hero-produkt__koerper` | `data-auslass` | `58.2,98.6` | `schlauch.js` (Ansatz) |

Beide zeigen absichtlich auf **denselben Punkt**: Das Wasser läuft am Schlauch
entlang nach unten. Ein `[data-schlauch-ende]` mit `data-einlass` ist optional —
fehlt es, läuft der Schlauch über den unteren Bildrand hinaus.

**Beide sitzen am Körper, nicht am Druckkopf.** Der Kopf sinkt beim Pumpen ein,
und weil `getBoundingClientRect()` Transformationen mitrechnet, würden Düse und
Schlauch bei jedem Stoß mitzappeln. Am Körper bleiben sie ruhig — nachgemessen:
Der Schlauchansatz steht über einen ganzen Pumpzyklus (Druck 0 → 0,99) auf
derselben Bildzeile.

**Warum kein Behälterbild im Hero.** Es war eines drin, zweimal — erst die
Flasche des Pocket Bottle Shower Mini, dann der 4-Liter-Beutel des Pocket Bath
Plus. Beide sahen schlecht aus, und zwar aus einem messbaren Grund: Die Brause
ist bei 132 px Breite **442 px hoch**, ein Beutel darüber wäre über 300 px hoch,
und ein Hero von 100 vh abzüglich Navigation hat rund 830 px. Für einen
Behälter, der sichtbar *über* der Brause hängt, bleibt kein Platz — auf dem
Handy schrumpfte er auf einen schwarzen Splitter. Er gehört in einen eigenen
Abschnitt „So funktioniert's", wo er groß genug ist, um etwas zu erklären. Die
Zuschnitte dafür sind in `werkzeuge/README.md` als Einzeiler dokumentiert.

**Das Produktfoto ist beschnitten, und das ist wichtig.** Vorher war
`handy-shower-foto.png` 451 × 501 px groß, das sichtbare Produkt steckte aber nur
in x 104–237 — **keine 30 % der Bildbreite**. Von `width: 170px` blieben also
50 px Brause übrig, und niemand verstand, warum sie so klein wirkt. Seit dem
Beschnitt auf **146 × 489** heißt 132 px auch 132 px. Wer das Foto austauscht,
muss es genauso eng beschneiden — sonst kehrt der Fehler zurück.

**Zur Stapelreihenfolge, damit es niemand erneut versucht:** Die Brause lässt
sich von ihrem CSS aus **nicht** über die Tropfen-Ebene heben. Sie steckt in
`.hero-klebrig`, und `position: sticky` erzeugt immer einen eigenen
Stapelkontext — ein `z-index` dort wirkt nur innerhalb des Heros. Die Tropfen
ziehen deshalb vor dem Produkt vorbei. Damit sie es nicht zudecken, staffelt
`tropfen.js` die Tropfengröße nach Bildschirmbreite: Die Welt ist immer gleich
hoch, ein Tropfen misst also überall rund 70 Pixel — auf 1280 px sind das 5 % der
Breite, auf 360 px aber 16 %.

### Die Pumpe im Hero

Das Produkt im Hero ist eine Handpumpe. Im Markup (`src/pages/[lang]/index.astro`)
liegen dafür **zwei Ebenen desselben Bildes** übereinander — eine Datei, ein
Abruf, getrennt per `clip-path` bei 28,3 % der Bildhöhe. Dort endet im Foto der
blaue Kopf und beginnt der weiße Körper.

- `.hero-produkt__koerper` — unbeweglich, trägt `data-tropfen-quelle` und
  `data-duese`. **Die Quelle gehört an den Körper, nicht an den Kopf:** Die Düse
  sitzt unten und pumpt nicht mit. Weil `clip-path` nur ein Malfilter ist und
  `getBoundingClientRect()` unverändert lässt, stimmt die Prozentrechnung für
  die Düse weiterhin auf das ganze Bild.
- `.hero-produkt__kopf` — trägt `data-pumpen-kopf`, wird über die
  CSS-Variable `--druck` nach unten geschoben. Der Kopf ist an der Naht breiter
  als der Körper, deshalb bleibt sie in jeder Stellung gedeckt.

Der Druck kommt aus **zwei** Quellen — dem Scroll-Fortschritt und einem eigenen
Takt alle 4,5 Sekunden. Sie werden über `Math.max` verrechnet, nicht addiert:
Addiert schöbe ein Eigenstoß während des Scrollens den Kopf über den vollen Weg
hinaus, und er stünde tiefer, als das Bild es hergibt.

`pumpe.js` veröffentlicht `window.WI_PUMPE = { druck, stoss }`. `tropfen.js`
liest daraus nur `stoss` und prüft den Wert, bevor er verrechnet wird — er
fließt direkt in Positionen und Wartezeiten, ein einziger ungültiger Wert würde
den Regen dauerhaft anhalten.

Ein anderes Foto bedeutet: Trennkante neu ausmessen (`clip-path` in
`design.css`) und `data-duese` anpassen.

### Echte Videos statt der gezeichneten Hero-Szene

Die Hero-Szene läuft ohne eine einzige Bilddatei. Sobald echtes Material da ist:
Clip mit `scripts/extract-frames.sh` aus dem `scroll-cinematic`-Werkzeug in ~180
JPGs zerlegen, nach `public/frames/` legen und in
`src/pages/[lang]/index.astro` die Zeile

```js
{ section: "#hero", frameCount: 180, bg: "#03192c", render: window.WASSER_SZENE }
```

ersetzen durch

```js
{ section: "#hero", frameCount: 180, bg: "#03192c",
  framePath: (i) => `frames/hero/frame_${String(i).padStart(4, "0")}.jpg` }
```

### Produktfotos

Die Fotos sind aus den Seiten des Produktkatalogs 2025 herausgeschnitten
(`werkzeuge/katalog-zuschnitt.mjs`) und tragen noch den Katalog-Hintergrund.
Sobald freigestellte Pressefotos vorliegen, genügt es, die Dateien unter
`public/bilder/produkte/` gleichnamig zu ersetzen.

Die Brause im Hero ist ein freigestelltes Foto
(`werkzeuge/freistellen.mjs`). Ihr Attribut `data-duese="40.6,98"` sagt der
Tropfen-Ebene, wo am Bild die Düse sitzt — bei einem anderen Foto muss dieser
Wert angepasst werden, sonst treten die Tropfen an der falschen Stelle aus.

Beide Werkzeuge brauchen `sharp`:

```bash
npm i -D sharp
node werkzeuge/katalog-zuschnitt.mjs
```

---

## Der Spendenzähler

**Der Zähler zählt ausschließlich bestätigte Lieferungen** — nie Bestellungen,
nie Zusagen. Solange `src/data/lieferungen.json` leer ist, steht dort eine
ehrliche Null, und die Seite sagt auch warum.

Eine Lieferung eintragen:

```jsonc
// src/data/lieferungen.json → "eintraege"
{
  "id": "2026-09-gobanyo",
  "projektId": "gobanyo",          // muss zu einer id in projekte.json passen
  "menge": 50,
  "datum": "2026-09-14",
  "fotos": ["bilder/projekte/uebergabe-1.jpg"],
  "notiz": { "de": "Erste Übergabe.", "pl": "…", "en": "…" },
  "oeffentlich": true
}
```

Damit ändern sich gleichzeitig: Zähler auf der Startseite, Transparenztabelle,
Menge auf der Projektseite und der Fortschrittsbalken.

**Keine Fotos von Betroffenen** ohne schriftliche Einwilligung. Im Zweifel Hände,
Details, Orte statt Gesichter.

### Eine Partnerorganisation aufnehmen

Erst eintragen, wenn eine Vereinbarung unterschrieben ist und die Organisation
der Nennung von Name und Logo zugestimmt hat. In `src/data/projekte.json` unter
`eintraege` ergänzen und `"aktiv": true` setzen — das Schema mit Beispiel steht
in derselben Datei unter `_schema`. Damit verschwindet automatisch der Hinweis
„Modell startet demnächst“ von der Seite.

---

## Die Seite „Wasser in Zahlen“ (`/wasser`)

Die Seite begründet mit belegten Zahlen, warum ein Liter ein Thema ist. Sie ist
im Fuß unter „Entdecken“ verlinkt, von der Startseite und von `/1plus1` — in der
Hauptnavigation steht sie bewusst nicht, die ist mit sechs Punkten voll.

Alle Zahlen stehen in `src/data/wasserzahlen.json`. **Pflichtfelder sind `quelle`
und `stand`** — dieselbe Regel wie beim Spendenzähler. Einträge ohne diese beiden
Felder werden in `wasserzahlen()` stillschweigend übergangen und erscheinen nicht
auf der Seite. Das Schema mit Beispiel steht in der Datei unter `_schema`.

```jsonc
// src/data/wasserzahlen.json → "eintraege"
{
  "id": "ohne-trinkwasser",
  "wert": "2,2 Mrd.",              // Text, damit „~70 %“ und „121–125 L“ gleich behandelt werden
  "gruppe": "welt",                // welt | nutzung | deutschland — bestimmt den Abschnitt
  "titel":        { "de": "…", "pl": "…", "en": "…" },
  "erlaeuterung": { "de": "…", "pl": "…", "en": "…" },   // optional
  "quelle": "WHO/UNICEF Joint Monitoring Programme (JMP)",
  "stand": "2026-08"
}
```

Die Startseite zieht sich zwei einzelne Zahlen über `wasserzahl("<id>")`
(`ohne-trinkwasser` und `pro-kopf`). Fehlt eine davon, fällt sie dort weg, ohne
den Abschnitt zu beschädigen.

**Herkunft der Zahlen, ehrlich gesagt:** Sie stammen aus
`unterlagen/wasserstatistik_bericht.pdf`, einer Zusammenstellung — nicht aus einer
eigenen Auswertung der Primärquellen. Deshalb trägt jede Zahl Quelle und Stand,
und deshalb steht dieser Vorbehalt auch sichtbar auf der Seite selbst. **Vor
Presse- oder Kampagnenverwendung gegen die dann aktuelle Fassung von JMP,
UN-Weltwasserbericht und Destatis gegenprüfen.**

Zwei Regeln für neue Texte auf dieser Seite: keine Zahl ohne Beleg, und keine
Zahl als Vorwurf formuliert. Nicht „wir verschwenden“, sondern „wir haben viel —
und können klug damit umgehen“.

---

## Übersetzungen

| Sprache | Stand |
|---|---|
| Deutsch | Quellsprache, vollständig |
| Englisch | vollständig |
| Polnisch | **Rohübersetzung — muss von einer Muttersprachlerin geprüft werden** (siehe `_hinweis` in `src/i18n/pl.json`) |
| Französisch, Spanisch, Italienisch | vorbereitet: Navigation übersetzt, Rest fällt auf Englisch zurück |

Fehlt ein Schlüssel, greift die Kette Sprache → Englisch → Deutsch. Die Seite
bleibt also vollständig, auch wenn eine Übersetzung Lücken hat.

**Eine Sprache freischalten:**

1. `src/i18n/<sprache>.json` nach dem Muster von `de.json` vervollständigen
2. Sprache in `src/i18n/ui.ts` bei `AKTIVE_SPRACHEN` eintragen
3. dieselbe Sprache in `astro.config.mjs` bei `i18n.locales` ergänzen
4. Produkt- und Journaltexte unter `src/content/*/<sprache>/` anlegen

Journalbeiträge haben je Sprache einen eigenen Slug. Zusammengehalten werden die
Fassungen über das Feld `familie` im Frontmatter — daraus entstehen hreflang und
Sprachumschalter.

---

## Eigene Domain

1. `public/CNAME` mit der Domain anlegen
2. In `astro.config.mjs` `SITE` auf die Domain und `BASE` auf `"/"` setzen
3. DNS beim Anbieter auf GitHub Pages zeigen lassen

---

## Was noch fehlt

Bewusst nicht gebaut, weil es echte Bestellungen voraussetzt:
Warenkorb und Zahlung, automatisches Spendenzertifikat, Referral-Programm,
Admin-Oberfläche zum Eintragen von Lieferungen. Die Datenstruktur ist so
angelegt, dass das später andocken kann, ohne die Seite umzubauen.
