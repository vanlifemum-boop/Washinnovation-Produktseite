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
src/data/           Projekte, Lieferungen, Veranstaltungen (JSON)
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
| `public/effekte/tropfen.js` | Fixe Ebene über der ganzen Seite (Three.js, lokal gevendort) mit zwei Gruppen echter Tropfenformen: **schwebende** Tropfen folgen der Maus und bekommen beim Scrollen Schub, **fallende** treten an der Düse der Duschbrause im Hero aus und regnen über die Seite. Beide **werden über Text durchsichtig**, damit alles lesbar bleibt. |
| `public/effekte/hero-szene.js` | Zeichnet den Hero prozedural: ein Tropfen fällt, trifft auf, wirft Krone und Ringe — gesteuert allein vom Scroll-Fortschritt. |
| `public/effekte/ripple.js` | Wasserwellen auf Bildflächen (`data-ripple`). Gedämpftes Höhenfeld auf Canvas 2D, rechnet auf 220 px und wird hochskaliert. |
| `public/effekte/schlauch.js` | Durchsichtiger Silikonschlauch, der an der Düse der Brause ansetzt und über die ganze Seite nach unten läuft. Reines SVG, drei Linien übereinander für die Silikon-Anmutung. |
| `public/effekte/seite.js` | Menü, Reveals, Parallax (`data-parallax`), hochzählender Zähler. |

Alle Effekte schalten sich ab bei `prefers-reduced-motion: reduce`, bei
verstecktem Tab und außerhalb des Sichtbereichs. Ohne WebGL bleibt die Seite
still, aber vollständig.

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
