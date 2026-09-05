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
import wasserDatei from "./wasserzahlen.json";
import bezugsquellenDatei from "./bezugsquellen.json";
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

/**
 * Ein Laden oder Shop, in dem es die Sets zu kaufen gibt. Nicht zu verwechseln
 * mit der Seite /haendler — dort geht es darum, selbst Händler zu *werden*.
 */
export interface Bezugsquelle {
  id: string;
  /** Firmierung, wie sie im Impressum des Händlers steht. */
  name: string;
  /** Wie der Shop sich nennt. */
  marke: string;
  url: string;
  land: string;
  spruch: MehrsprachigerText;
  aktiv: boolean;
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

/**
 * Eine belegte Zahl für die Seite /wasser.
 *
 * `quelle` und `stand` sind Pflichtfelder — dieselbe Regel wie beim
 * Spendenzähler: ohne Beleg kommt keine Zahl auf die Seite. Deshalb sind sie
 * hier nicht optional, und `wasserzahlen()` wirft Einträge weg, denen sie fehlen.
 */
export interface Wasserzahl {
  id: string;
  wert: string;
  gruppe: "welt" | "nutzung" | "deutschland";
  titel: MehrsprachigerText;
  erlaeuterung?: MehrsprachigerText;
  quelle: string;
  stand: string;
}

export interface Wasserquelle {
  id: string;
  name: string;
  beschreibung: MehrsprachigerText;
  url?: string;
}

export const projekte = (projekteDatei.eintraege ?? []) as Projekt[];
export const lieferungen = (lieferungenDatei.eintraege ?? []) as Lieferung[];
export const alleBezugsquellen = (bezugsquellenDatei.eintraege ?? []) as Bezugsquelle[];
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

/**
 * Bezugsquellen, in denen die Sets wirklich bestellbar sind.
 * Genau wie bei den Projekten gilt: Ein Eintrag erscheint erst, wenn es
 * stimmt — ein Knopf auf einen Shop ohne unsere Produkte kostet Vertrauen.
 */
export function bezugsquellen(): Bezugsquelle[] {
  return alleBezugsquellen.filter((b) => b.aktiv);
}

/** Gibt es überhaupt schon einen Laden, auf den sich verweisen lässt? */
export function bezugsquellenVorhanden(): boolean {
  return bezugsquellen().length > 0;
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

/**
 * Zahlen einer Gruppe, in der Reihenfolge der Datei.
 *
 * Einträge ohne Quelle oder ohne Stand werden stillschweigend übergangen —
 * lieber eine Kachel weniger als eine Zahl ohne Beleg.
 */
export function wasserzahlen(gruppe: Wasserzahl["gruppe"]): Wasserzahl[] {
  return ((wasserDatei.eintraege ?? []) as Wasserzahl[]).filter(
    (z) => z.gruppe === gruppe && Boolean(z.quelle) && Boolean(z.stand),
  );
}

/** Die Quellenangaben für den Nachweis am Fuß der Seite. */
export function wasserquellen(): Wasserquelle[] {
  return (wasserDatei.quellen ?? []) as Wasserquelle[];
}

/** Eine einzelne Zahl, etwa für die Startseite. Fehlt sie, kommt undefined zurück. */
export function wasserzahl(id: string): Wasserzahl | undefined {
  return ((wasserDatei.eintraege ?? []) as Wasserzahl[]).find(
    (z) => z.id === id && Boolean(z.quelle) && Boolean(z.stand),
  );
}

/** „2026-08" → „08/2026". Der Stand steht neben jeder Zahl. */
export function standLesbar(stand: string): string {
  const [jahr, monat] = stand.split("-");
  return monat ? `${monat}/${jahr}` : stand;
}

/** Sprachgerechte Abkürzungen und Dezimaltrennzeichen für die belegten Zahlen. */
export function wasserwert(wert: string, sprache: Sprache): string {
  const milliard = {
    de: "Mrd.",
    pl: "mld",
    en: "bn",
    fr: "Md",
    es: "mil mill.",
    it: "mld",
  }[sprache];
  const million = {
    de: "Mio.",
    pl: "mln",
    en: "m",
    fr: "M",
    es: "mill.",
    it: "mln",
  }[sprache];
  const lokalisiert = wert.replace("Mrd.", milliard).replace("Mio.", million);
  return sprache === "en" ? lokalisiert.replace(/(\d),(\d)/g, "$1.$2") : lokalisiert;
}

/** Text in der gewünschten Sprache, sonst Englisch, sonst Deutsch, sonst leer. */
export function text(feld: MehrsprachigerText | undefined, sprache: Sprache): string {
  if (!feld) return "";
  return feld[sprache] ?? feld.en ?? feld.de ?? "";
}
