import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * Produkte und Journalbeiträge liegen als Markdown je Sprache:
 *   src/content/produkte/de/pocket-bath-plus.md
 *   src/content/produkte/en/pocket-bath-plus.md
 * Die Sprache steckt im Ordnernamen und damit in der id ("de/pocket-bath-plus").
 */

/**
 * Ohne eigenes generateId nimmt der Loader das Feld `slug` als id — dieselbe id
 * in drei Sprachen, die sich gegenseitig überschreiben. Deshalb wird die id hier
 * aus dem Pfad gebildet: "de/pocket-bath-plus", "pl/pocket-bath-plus", …
 */
const idAusPfad = ({ entry }: { entry: string }) => entry.replace(/\.mdx?$/, "");

const produkte = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/produkte", generateId: idAusPfad }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    /** Artikelnummer aus dem Produktkatalog, z. B. "PBPCV-NB-EN". */
    code: z.string(),
    /** "dusche" = Duschset, "spuele" = Armatur- und Beckenset. */
    kategorie: z.enum(["dusche", "spuele"]),
    /** Reihenfolge in der Übersicht — kleinere Zahl zuerst. */
    reihenfolge: z.number().default(99),
    kurz: z.string(),
    /** Preis in Euro. null, solange er nicht bestätigt ist — die Seite zeigt dann "Preis folgt". */
    preis: z.number().nullable().default(null),
    bild: z.string(),
    /** Für das 1+1-Versprechen vorgesehen. */
    spendenfaehig: z.boolean().default(true),
    /** Vorteile („Benefits" im Katalog). */
    merkmale: z.array(z.string()).default([]),
    /** Lieferumfang („Components" im Katalog). */
    komponenten: z.array(z.string()).default([]),
    /** Pflegehinweis („Maintenance" im Katalog). */
    pflege: z.string().optional(),
    technisch: z.array(z.object({ bezeichnung: z.string(), wert: z.string() })).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog", generateId: idAusPfad }),
  schema: z.object({
    titel: z.string(),
    slug: z.string(),
    /**
     * Klammert die Sprachfassungen eines Beitrags zusammen. Die Slugs sind je
     * Sprache übersetzt — ohne diese Kennung wüsste der Sprachumschalter nicht,
     * welche Seiten zusammengehören.
     */
    familie: z.string(),
    datum: z.string(),
    beschreibung: z.string(),
    bild: z.string().optional(),
    entwurf: z.boolean().default(false),
  }),
});

export const collections = { produkte, blog };
