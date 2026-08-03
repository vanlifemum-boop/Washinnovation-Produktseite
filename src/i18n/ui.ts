/**
 * Mehrsprachigkeit
 * -----------------------------------------------------------------------------
 * Quellsprache ist Deutsch. Fehlt ein Schlüssel in einer Sprache, greift die
 * Kette Sprache → Englisch → Deutsch. So bleibt die Seite auch dann vollständig,
 * wenn eine Übersetzung noch lückenhaft ist.
 *
 * Eine Sprache freischalten:
 *   1. src/i18n/<sprache>.json vollständig übersetzen
 *   2. hier in AKTIVE_SPRACHEN eintragen
 *   3. dieselbe Sprache in astro.config.mjs unter i18n.locales ergänzen
 */
import de from "./de.json";
import pl from "./pl.json";
import en from "./en.json";
import fr from "./fr.json";
import es from "./es.json";
import it from "./it.json";

export const STANDARD_SPRACHE = "de" as const;

/** Sprachen, für die Seiten gebaut werden. */
export const AKTIVE_SPRACHEN = ["de", "pl", "en"] as const;

/** Alle vorbereiteten Sprachen — fr/es/it warten auf ihre Übersetzung. */
export const ALLE_SPRACHEN = ["de", "pl", "en", "fr", "es", "it"] as const;

export type Sprache = (typeof ALLE_SPRACHEN)[number];

export const SPRACH_NAMEN: Record<Sprache, string> = {
  de: "Deutsch",
  pl: "Polski",
  en: "English",
  fr: "Français",
  es: "Español",
  it: "Italiano",
};

type Woerterbuch = Record<string, string>;

const WOERTERBUECHER: Record<Sprache, Woerterbuch> = { de, pl, en, fr, es, it };

// Für die Fallback-Kette als einfache Wörterbücher — die importierten JSON-Dateien
// haben je einen eigenen literalen Typ und ließen sich sonst nicht mit einem
// beliebigen Schlüssel abfragen.
const EN: Woerterbuch = en;
const DE: Woerterbuch = de;

export function istSprache(wert: unknown): wert is Sprache {
  return typeof wert === "string" && (ALLE_SPRACHEN as readonly string[]).includes(wert);
}

/**
 * Übersetzungsfunktion für eine Sprache.
 * Unbekannte Schlüssel geben den Schlüssel selbst zurück — so fällt eine
 * vergessene Zeile beim Durchklicken sofort auf, statt leer zu bleiben.
 */
export function uebersetzer(sprache: Sprache) {
  const primaer = WOERTERBUECHER[sprache] ?? {};
  return function t(schluessel: string, ersetzungen?: Record<string, string | number>): string {
    const roh = primaer[schluessel] ?? EN[schluessel] ?? DE[schluessel] ?? schluessel;
    if (!ersetzungen) return roh;
    return Object.entries(ersetzungen).reduce(
      (text, [name, wert]) => text.replaceAll(`{${name}}`, String(wert)),
      roh,
    );
  };
}

/** Datum in der Schreibweise der jeweiligen Sprache. */
export function datum(iso: string, sprache: Sprache): string {
  const gebietsschema = { de: "de-DE", pl: "pl-PL", en: "en-GB", fr: "fr-FR", es: "es-ES", it: "it-IT" }[sprache];
  return new Intl.DateTimeFormat(gebietsschema, { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

/**
 * Interner Link. Setzt die Basis-URL (auf GitHub Pages /washinnovation-shop)
 * und die Sprache davor. `pfad` ohne führenden Slash, z. B. "produkte".
 */
export function pfad(sprache: Sprache, pfadAngabe = ""): string {
  const basis = import.meta.env.BASE_URL.replace(/\/$/, "");
  const rest = pfadAngabe.replace(/^\/|\/$/g, "");
  return rest ? `${basis}/${sprache}/${rest}/` : `${basis}/${sprache}/`;
}

/** Link auf eine Datei in public/, z. B. bild("bilder/camptap.svg"). */
export function datei(pfadAngabe: string): string {
  const basis = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${basis}/${pfadAngabe.replace(/^\//, "")}`;
}
