/**
 * Zwei getrennte Schalter — bewusst getrennt, nicht aus Ordnungsliebe.
 *
 * Der Hinweisstreifen ist Kosmetik: Er sagt Besuchern, dass die Seite noch nicht
 * fertig ist. Das `noindex` ist dagegen die eigentliche Absicherung. Solange
 * Impressum, Kontaktdaten und Preise Platzhalter sind, darf die Seite nicht in
 * Suchmaschinen auftauchen — ein unvollständiges Impressum ist auf einer
 * Verkaufsseite in Deutschland abmahnfähig.
 *
 * Vorher hing beides an einem Schalter. Wer den Streifen loswerden wollte, hätte
 * damit unbemerkt auch die Sperre aufgehoben.
 */

/** Gelber Streifen im Kopf („Vorschau — Impressum … fehlen noch"). */
export const VORSCHAU_STREIFEN = false;

/**
 * Hält Suchmaschinen fern: <meta name="robots" content="noindex, nofollow">
 * auf jeder Seite.
 *
 * Erst auf false setzen, wenn **alles** davon erledigt ist:
 *   1. Impressum mit vollständigen Firmendaten (src/inhalte/recht.ts)
 *   2. Datenschutz, AGB und Widerruf juristisch geprüft
 *   3. Kontakt- und Bestelladresse eingetragen
 *   4. Preise für die sieben Sets gesetzt
 * Danach zusätzlich public/robots.txt auf die Freigabe-Fassung umstellen —
 * die steht dort auskommentiert bereit.
 */
export const SUCHMASCHINEN_SPERREN = true;
