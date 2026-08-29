/**
 * Firmendaten an genau einer Stelle.
 *
 * Alles, was Impressum, Datenschutz, AGB und Widerruf an echten Angaben
 * brauchen, steht hier. Ein leerer String heißt: liegt noch nicht vor.
 *
 * Wichtig — leer heißt *nicht*, dass ein Platzhalter auf der Seite erscheint.
 * Die Rechtstexte lassen jeden Absatz weg, dessen Angaben fehlen. Auf der Seite
 * steht damit nie „[PLATZHALTER]“, sondern schlicht nichts. Das ist für Besucher
 * das Richtige, verdeckt aber, dass eine Pflichtangabe fehlt — deshalb der
 * Wächter unten und der Schalter SUCHMASCHINEN_SPERREN in src/seite.config.ts:
 * Solange etwas aus PFLICHT fehlt, lässt sich die Seite nicht für Suchmaschinen
 * freigeben, ohne dass der Build abbricht.
 *
 * Ein unvollständiges Impressum ist auf einer Verkaufsseite in Deutschland
 * abmahnfähig. Der Wächter ersetzt den gelben Hinweisstreifen, der früher auf
 * der Seite selbst stand.
 */

export interface Firmendaten {
  /** Vollständige Firmierung, wie sie im Register bzw. auf der Rechnung steht. */
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  email: string;
  /** Vertretungsberechtigte Person, zugleich verantwortlich für den Inhalt. */
  vertreten: string;
  /** Umsatzsteuer-Identifikationsnummer nach § 27a UStG. */
  ustId: string;
  /**
   * true  = Kleinunternehmer nach § 19 UStG, es wird keine Umsatzsteuer erhoben
   * false = regelbesteuert
   * null  = noch nicht entschieden
   */
  kleinunternehmer: boolean | null;
}

export const FIRMA: Firmendaten = {
  name: "",
  strasse: "",
  plz: "",
  ort: "",
  land: "Deutschland",
  email: "",
  vertreten: "Justine Martynek",
  ustId: "",
  kleinunternehmer: null,
};

/**
 * Der Hoster. Steht fest und ist nachprüfbar: Die Seite wird über GitHub Pages
 * ausgeliefert, das Deployment läuft in .github/workflows/pages.yml.
 */
export const HOSTER = {
  name: "GitHub, Inc.",
  anschrift: "88 Colin P Kelly Jr Street, San Francisco, CA 94107, USA",
  dienst: "GitHub Pages",
};

/** Anschrift als eine Zeile, oder "" wenn sie unvollständig ist. */
export function anschriftEinzeilig(): string {
  const { strasse, plz, ort, land } = FIRMA;
  if (!strasse || !plz || !ort) return "";
  return [strasse, `${plz} ${ort}`, land].filter(Boolean).join(", ");
}

/** Anschrift als Zeilen für die Blockdarstellung im Impressum. */
export function anschriftZeilen(): string[] {
  const { name, strasse, plz, ort, land } = FIRMA;
  if (!strasse || !plz || !ort) return [];
  return [name, strasse, `${plz} ${ort}`, land].filter(Boolean);
}

/**
 * Pflichtangaben für ein vollständiges Impressum nach § 5 DDG und eine
 * belastbare Widerrufsbelehrung. Ohne sie darf die Seite nicht in den Index.
 */
const PFLICHT: Array<[schluessel: string, vorhanden: boolean]> = [
  ["Firmierung (FIRMA.name)", Boolean(FIRMA.name)],
  ["Straße (FIRMA.strasse)", Boolean(FIRMA.strasse)],
  ["PLZ (FIRMA.plz)", Boolean(FIRMA.plz)],
  ["Ort (FIRMA.ort)", Boolean(FIRMA.ort)],
  ["E-Mail (FIRMA.email)", Boolean(FIRMA.email)],
  ["Vertretung (FIRMA.vertreten)", Boolean(FIRMA.vertreten)],
  ["Umsatzsteuer: USt-IdNr. oder Kleinunternehmer-Kennzeichnung",
    Boolean(FIRMA.ustId) || FIRMA.kleinunternehmer !== null],
];

/** Was für einen Livegang noch fehlt. Leer = vollständig. */
export function fehlendePflichtangaben(): string[] {
  return PFLICHT.filter(([, da]) => !da).map(([name]) => name);
}
