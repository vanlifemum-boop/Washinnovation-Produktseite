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
 * Ein unvollständiges Impressum ist bei einem Verkaufsangebot an deutsche
 * Verbraucher abmahnfähig. Der Wächter ersetzt den gelben Hinweisstreifen, der
 * früher auf der Seite selbst stand.
 */

/**
 * Land, in dem das Unternehmen eingetragen ist. Nicht dasselbe wie das
 * Liefergebiet — es bestimmt, welche Kennnummern ins Impressum gehören und
 * worauf sich die Pflichtangaben stützen.
 *
 *   "PL" — Eintrag in der CEIDG oder im KRS, Kennungen NIP und REGON
 *   "DE" — Gewerbeanmeldung in Deutschland, Kennung USt-IdNr. nach § 27a UStG
 */
export type Sitzland = "PL" | "DE";

export interface Firmendaten {
  /** Vollständige Firmierung, wie sie im Register steht. */
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  /** Klartext, erscheint so im Impressum. */
  land: string;
  sitzland: Sitzland;
  email: string;
  /** Inhaberin bzw. vertretungsberechtigte Person, zugleich verantwortlich für den Inhalt. */
  vertreten: string;

  /** Polen: Steuernummer (NIP), zehnstellig. */
  nip: string;
  /** Polen: Statistiknummer (REGON), neun- oder vierzehnstellig. */
  regon: string;
  /**
   * Polen: In welches Register das Unternehmen eingetragen ist.
   *   "CEIDG" — Einzelunternehmen (jednoosobowa działalność gospodarcza).
   *             Wird über NIP oder Namen gefunden, hat keine eigene Nummer.
   *   "KRS"   — Handelsregister für Gesellschaften, dann krsNummer setzen.
   */
  registerArt: "CEIDG" | "KRS" | "";
  /** Nur bei KRS: die Registernummer. */
  krsNummer: string;
  /**
   * Umsatzsteuer-Identifikationsnummer für den EU-Warenverkehr.
   * In Polen ist das die NIP mit vorangestelltem „PL“ — aber nur, wenn eine
   * VAT-EU-Registrierung besteht. Deshalb steht sie hier ausdrücklich und wird
   * nicht aus der NIP errechnet: Wer nicht VAT-EU-registriert ist, hätte sonst
   * eine Nummer im Impressum, die es nicht gibt.
   */
  ustId: string;
  /**
   * true  = umsatzsteuerbefreit — in Polen das zwolnienie podmiotowe nach
   *         Art. 113 des Umsatzsteuergesetzes, in Deutschland § 19 UStG
   * false = regelbesteuert
   * null  = noch nicht entschieden
   */
  kleinunternehmer: boolean | null;
}

export const FIRMA: Firmendaten = {
  // Schreibweise wie im Register: „WOW CAMP“ in Versalien, dann der Name.
  name: "WOW CAMP Justyna Martynek",
  strasse: "ul. Kamionka 11",
  plz: "87-300",
  ort: "Brodnica",
  land: "Polen",
  sitzland: "PL",
  email: "",
  vertreten: "Justyna Martynek",
  nip: "6671793054",
  regon: "542696594",
  registerArt: "CEIDG",
  krsNummer: "",
  // Kein VAT-EU-Eintrag, solange die Umsatzsteuerbefreiung gilt.
  ustId: "",
  kleinunternehmer: true,
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

/* ========================================================================
   Prüfziffern
   ------------------------------------------------------------------------
   NIP und REGON tragen eine Prüfziffer. Eine vertauschte Ziffer ergibt fast
   immer eine ungültige Nummer — und genau das ist der Fehler, den man sonst
   nie bemerkt: Die Seite baut fehlerfrei, das Impressum sieht vollständig
   aus, und die Nummer zeigt auf niemanden. Deshalb rechnet der Build nach.
   ======================================================================== */

const NIP_GEWICHTE = [6, 5, 7, 2, 3, 4, 5, 6, 7];

/** Zehnstellige NIP mit gültiger Prüfziffer? Bindestriche und Leerzeichen sind erlaubt. */
export function nipGueltig(wert: string): boolean {
  const z = wert.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(z)) return false;
  const rest = NIP_GEWICHTE.reduce((s, g, i) => s + g * Number(z[i]), 0) % 11;
  // Rest 10 kann keine Prüfziffer sein — solche Nummern werden nicht vergeben.
  return rest !== 10 && rest === Number(z[9]);
}

const REGON_9 = [8, 9, 2, 3, 4, 5, 6, 7];
const REGON_14 = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];

/** Neun- oder vierzehnstelliger REGON mit gültiger Prüfziffer? */
export function regonGueltig(wert: string): boolean {
  const z = wert.replace(/[\s-]/g, "");
  if (!/^\d{9}$/.test(z) && !/^\d{14}$/.test(z)) return false;
  const ziffer = (gewichte: number[]) => {
    const s = gewichte.reduce((a, g, i) => a + g * Number(z[i]), 0) % 11;
    return s === 10 ? 0 : s;
  };
  if (ziffer(REGON_9) !== Number(z[8])) return false;
  return z.length === 9 || ziffer(REGON_14) === Number(z[13]);
}

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
 * Steuerliche Kennung des Sitzlandes, fertig beschriftet — oder null, solange
 * sie fehlt. Die Beschriftung kommt von außen, damit sie übersetzt sein kann.
 */
export function steuerKennungen(bez: { nip: string; regon: string; ustId: string }): string[] {
  if (FIRMA.sitzland === "PL") {
    return [
      FIRMA.nip && `${bez.nip}: ${FIRMA.nip}`,
      FIRMA.regon && `${bez.regon}: ${FIRMA.regon}`,
    ].filter((s): s is string => Boolean(s));
  }
  return FIRMA.ustId ? [`${bez.ustId}: ${FIRMA.ustId}`] : [];
}

/**
 * Satz zur Registereintragung, oder null, wenn keiner passt.
 * Die Textbausteine kommen von außen, damit sie übersetzt sein können.
 */
export function registerAngabe(bez: { ceidg: string; krs: (nr: string) => string }): string | null {
  if (FIRMA.sitzland !== "PL") return null;
  if (FIRMA.registerArt === "CEIDG") return bez.ceidg;
  if (FIRMA.registerArt === "KRS" && FIRMA.krsNummer) return bez.krs(FIRMA.krsNummer);
  return null;
}

/**
 * Pflichtangaben für ein vollständiges Impressum und eine belastbare
 * Widerrufsbelehrung. Ohne sie darf die Seite nicht in den Index.
 */
function pflichtliste(): Array<[name: string, erfuellt: boolean]> {
  const kennung: [string, boolean] =
    FIRMA.sitzland === "PL"
      ? ["NIP (FIRMA.nip)", Boolean(FIRMA.nip)]
      : ["USt-IdNr. oder Kleinunternehmer-Kennzeichnung (FIRMA.ustId)",
         Boolean(FIRMA.ustId) || FIRMA.kleinunternehmer !== null];
  const register: Array<[string, boolean]> =
    FIRMA.sitzland === "PL" && FIRMA.registerArt === "KRS"
      ? [["KRS-Nummer (FIRMA.krsNummer)", Boolean(FIRMA.krsNummer)]]
      : [];
  return [
    ...register,
    ["Firmierung (FIRMA.name)", Boolean(FIRMA.name)],
    ["Straße (FIRMA.strasse)", Boolean(FIRMA.strasse)],
    ["PLZ (FIRMA.plz)", Boolean(FIRMA.plz)],
    ["Ort (FIRMA.ort)", Boolean(FIRMA.ort)],
    ["E-Mail (FIRMA.email)", Boolean(FIRMA.email)],
    ["Vertretung (FIRMA.vertreten)", Boolean(FIRMA.vertreten)],
    kennung,
  ];
}

/** Was für einen Livegang noch fehlt. Leer = vollständig. */
export function fehlendePflichtangaben(): string[] {
  return pflichtliste().filter(([, da]) => !da).map(([name]) => name);
}

/**
 * Angaben, die zwar dastehen, aber nicht stimmen können. Anders als fehlende
 * Angaben ist das immer ein Fehler — auch im Vorschaubetrieb.
 */
export function fehlerhafteAngaben(): string[] {
  const fehler: string[] = [];
  if (FIRMA.nip && !nipGueltig(FIRMA.nip)) {
    fehler.push(`NIP „${FIRMA.nip}“ hat keine gültige Prüfziffer — bitte Ziffern vergleichen.`);
  }
  if (FIRMA.regon && !regonGueltig(FIRMA.regon)) {
    fehler.push(`REGON „${FIRMA.regon}“ hat keine gültige Prüfziffer — bitte Ziffern vergleichen.`);
  }
  if (FIRMA.ustId && !/^[A-Z]{2}[0-9A-Z]{2,12}$/.test(FIRMA.ustId.replace(/\s/g, ""))) {
    fehler.push(`USt-IdNr. „${FIRMA.ustId}“ sieht nicht wie eine EU-Umsatzsteuer-ID aus (Länderkürzel + Ziffern).`);
  }
  return fehler;
}

/* Falsche Kennnummern sind schlimmer als fehlende: Sie zeigen auf ein anderes
   Unternehmen. Deshalb bricht der Build sofort ab, unabhängig davon, ob die
   Seite schon freigegeben ist. */
const kaputt = fehlerhafteAngaben();
if (kaputt.length > 0) {
  throw new Error("Fehlerhafte Angaben in src/inhalte/firma.ts:\n  - " + kaputt.join("\n  - "));
}
