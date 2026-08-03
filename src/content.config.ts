import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * Produkte und Journalbeiträge liegen als Markdown je Sprache:
 *   src/content/produkte/de/camptap.md
 *   src/content/produkte/en/camptap.md
 * Die Sprache steckt im Ordnernamen und damit in der id ("de/camptap").
 */

/**
 * Ohne eigenes generateId nimmt der Loader das Feld `slug` als id — dieselbe id
 * in drei Sprachen, die sich gegenseitig überschreiben. Deshalb wird die id hier
 * aus dem Pfad gebildet: "de/camptap", "pl/camptap", …
 */
const idAusPfad = ({ entry }: { entry: string }) => entry.replace(/\.mdx?$/, "");

const produkte = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/produkte", generateId: idAusPfad }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    /** Reihenfolge in der Übersicht — kleinere Zahl zuerst. */
    reihenfolge: z.number().default(99),
    kurz: z.string(),
    /** Preis in Euro. null, solange er nicht bestätigt ist — die Seite zeigt dann "Preis folgt". */
    preis: z.number().nullable().default(null),
    bild: z.string(),
    /** Für das 1+1-Versprechen vorgesehen. */
    spendenfaehig: z.boolean().default(true),
    merkmale: z.array(z.string()).default([]),
    lieferumfang: z.array(z.string()).default([]),
    technisch: z.array(z.object({ bezeichnung: z.string(), wert: z.string() })).default([]),
    anwendung: z.array(z.string()).default([]),
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
