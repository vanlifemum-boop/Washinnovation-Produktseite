/**
 * Kontaktdaten an genau einer Stelle.
 *
 * Warum eine eigene Datei: Die Nummer taucht auf der Kontaktseite, im Fuß, auf
 * der Bestellseite, im Schwebeknopf und im Impressum auf. Beim Domainwechsel
 * stand dieselbe Adresse an drei Stellen im Code, an zweien mit Tippfehler —
 * die Seite war danach unter keiner Adresse erreichbar. Eine Rufnummer mit
 * einer falschen Ziffer fällt noch später auf, weil die Seite dabei fehlerfrei
 * baut. Deshalb: hier ändern, überall richtig.
 *
 * Beim Ändern der Nummer nur RUFNUMMER anfassen. Alles andere leitet sich ab.
 */
import { FIRMA } from "./firma";

/**
 * Internationale Rufnummer, nur Ziffern, mit Ländervorwahl und ohne die
 * führende Null der nationalen Schreibweise.
 *
 * 0152 08643106  →  49 152 08643106  →  "4915208643106"
 *
 * WhatsApp verlangt genau diese Form: wa.me akzeptiert weder Leerzeichen noch
 * Plus noch Bindestriche und zeigt bei einer nicht auflösbaren Nummer eine
 * Fehlerseite statt des Chats.
 */
export const RUFNUMMER = "4915208643106";

/** Lesbare Schreibweise für die Anzeige. */
export const RUFNUMMER_LESBAR = "+49 152 08643106";

/**
 * Name der Person hinter der Nummer — steht neben dem Knopf, damit klar ist,
 * wer antwortet.
 *
 * Bewusst kein eigener Wert: Der Name steht in src/inhalte/firma.ts, weil er
 * dort auch das Impressum speist. Zwei Schreibweisen desselben Namens auf einer
 * Seite („Justine“ im Kontakt, „Justyna“ im Impressum) sähen aus wie ein Fehler
 * — und eine davon wäre auch einer.
 */
export const ANSPRECHPERSON = FIRMA.vertreten;

/** `tel:`-Ziel. E.164, also mit Plus und ohne Leerzeichen. */
export const TELEFON_LINK = `tel:+${RUFNUMMER}`;

/**
 * WhatsApp-Chat. `wa.me` ist der offizielle Kurzlink; er öffnet die App, wenn
 * sie installiert ist, sonst WhatsApp Web.
 *
 * Bewusst ein einfacher Link und kein eingebundenes Widget: Ein Widget lädt
 * Code von Meta schon beim Seitenaufruf und wäre ohne Einwilligung nicht
 * zulässig. Ein Link überträgt erst dann etwas, wenn jemand ihn anklickt.
 *
 * @param text Vorbelegter Nachrichtentext, unkodiert.
 */
export function whatsappLink(text?: string): string {
  const ziel = `https://wa.me/${RUFNUMMER}`;
  return text ? `${ziel}?text=${encodeURIComponent(text)}` : ziel;
}
