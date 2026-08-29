/**
 * Der eine Schalter, der noch übrig ist — und der Wächter dahinter.
 *
 * Auf der Seite selbst steht nirgends mehr „PLATZHALTER“. Für Besucher ist das
 * richtig; für die Betreiberin verschwindet damit aber die einzige sichtbare
 * Erinnerung daran, dass Pflichtangaben fehlen. Der Wächter unten tritt an
 * ihre Stelle: Er lässt die Seite nicht für Suchmaschinen freigeben, solange
 * in src/inhalte/firma.ts noch etwas offen ist. Statt eines gelben Streifens
 * für alle gibt es einen Abbruch beim Bauen — genau einmal, für die Person,
 * die den Schalter umlegt.
 */
import { fehlendePflichtangaben } from "./inhalte/firma";

/**
 * Hält Suchmaschinen fern: <meta name="robots" content="noindex, nofollow">
 * auf jeder Seite.
 *
 * Erst auf false setzen, wenn **alles** davon erledigt ist:
 *   1. Firmendaten vollständig in src/inhalte/firma.ts
 *   2. Datenschutz, AGB und Widerruf juristisch geprüft
 *   3. Preise für die sieben Sets in src/content/produkte/
 * Danach zusätzlich public/robots.txt auf die Freigabe-Fassung umstellen —
 * die steht dort auskommentiert bereit.
 */
export const SUCHMASCHINEN_SPERREN = true;

/*
 * Wächter. Läuft beim Bauen, nicht im Browser.
 *
 * Ein unvollständiges Impressum ist auf einer Verkaufsseite in Deutschland
 * abmahnfähig. Seit die Rechtstexte fehlende Angaben stillschweigend weglassen,
 * sieht eine unfertige Seite fertig aus — deshalb bricht der Build hier ab,
 * statt sich auf einen aufmerksamen Blick zu verlassen.
 */
if (!SUCHMASCHINEN_SPERREN) {
  const offen = fehlendePflichtangaben();
  if (offen.length > 0) {
    throw new Error(
      "SUCHMASCHINEN_SPERREN steht auf false, aber es fehlen noch Pflichtangaben " +
        "in src/inhalte/firma.ts:\n  - " + offen.join("\n  - ") +
        "\n\nEntweder die Angaben ergänzen oder den Schalter wieder auf true setzen.",
    );
  }
}
