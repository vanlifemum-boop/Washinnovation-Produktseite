/**
 * Zugriff auf die JSON-Daten.
 *
 * Wichtigste Regel dieser Datei: Der Spendenzähler wird aus `lieferungen.json`
 * berechnet — aus bestätigten Übergaben, niemals aus Bestellungen. Solange dort
 * nichts steht, ist die richtige Antwort null.
 */
import projekteDatei from "./projekte.json";
import lieferungenDatei from "./lieferungen.json";
import eventsDatei from "./events.json";
import type { Sprache } from "../i18n/ui";

export type MehrsprachigerText = Partial<Record<Sprache, string>>;

export interface Projekt {
  id: string;
  slug: string;
  name: string;
  stadt: string;
  website?: string;
  spendenlink?: string;
  logo?: string;
  bilder?: string[];
  ziel?: number;
  aktiv: boolean;
  beschreibung: MehrsprachigerText;
}

export interface Lieferung {
  id: string;
  projektId: string;
  menge: number;
  datum: string;
  fotos?: string[];
  notiz?: MehrsprachigerText;
  oeffentlich: boolean;
}

export interface Veranstaltung {
  id: string;
  slug: string;
  name: string;
  ort: string;
  datum: string;
  datumBis?: string;
  verkauft: number | null;
  gespendet: number | null;
  text: MehrsprachigerText;
}

export const projekte = (projekteDatei.eintraege ?? []) as Projekt[];
export const lieferungen = (lieferungenDatei.eintraege ?? []) as Lieferung[];
export const veranstaltungen = (eventsDatei.eintraege ?? []) as Veranstaltung[];

/** Nur bestätigte, öffentliche Lieferungen — die einzige Grundlage für Zahlen auf der Seite. */
export function bestaetigteLieferungen(): Lieferung[] {
  return lieferungen
    .filter((l) => l.oeffentlich)
    .sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Summe aller tatsächlich übergebenen Sets. Ohne Lieferung: 0. */
export function gespendetGesamt(): number {
  return bestaetigteLieferungen().reduce((summe, l) => summe + (l.menge || 0), 0);
}

/** Übergebene Sets an ein einzelnes Projekt. */
export function gespendetAnProjekt(projektId: string): number {
  return bestaetigteLieferungen()
    .filter((l) => l.projektId === projektId)
    .reduce((summe, l) => summe + (l.menge || 0), 0);
}

/** Sichtbare Projekte — nur mit unterschriebener Vereinbarung. */
export function sichtbareProjekte(): Projekt[] {
  return projekte.filter((p) => p.aktiv);
}

export function projektNachSlug(slug: string): Projekt | undefined {
  return sichtbareProjekte().find((p) => p.slug === slug);
}

/** Läuft das 1+1-Modell schon? Erst wenn ein Projekt bestätigt ist. */
export function modellAktiv(): boolean {
  return sichtbareProjekte().length > 0;
}

export function kommendeVeranstaltungen(): Veranstaltung[] {
  const heute = new Date().toISOString().slice(0, 10);
  return veranstaltungen
    .filter((v) => (v.datumBis ?? v.datum) >= heute)
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

export function vergangeneVeranstaltungen(): Veranstaltung[] {
  const heute = new Date().toISOString().slice(0, 10);
  return veranstaltungen
    .filter((v) => (v.datumBis ?? v.datum) < heute)
    .sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Text in der gewünschten Sprache, sonst Englisch, sonst Deutsch, sonst leer. */
export function text(feld: MehrsprachigerText | undefined, sprache: Sprache): string {
  if (!feld) return "";
  return feld[sprache] ?? feld.en ?? feld.de ?? "";
}
