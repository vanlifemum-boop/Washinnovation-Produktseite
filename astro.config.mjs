// @ts-check
import { defineConfig } from "astro/config";

// Basis-URL: Auf GitHub Pages liegt die Seite unter dem Repo-Namen.
// Achtung: Der Pfad ist Groß-/Kleinschreibung-empfindlich und muss exakt so
// heißen wie das Repository.
// Sobald eine eigene Domain eingerichtet ist: BASE auf "/" setzen, SITE auf die
// Domain ändern und public/CNAME anlegen.
const SITE = "https://vanlifemum-boop.github.io";
const BASE = "/Washinnovation-Produktseite";

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "always",
  build: { format: "directory" },

  // Sprachen: de/pl/en sind live. fr/es/it sind vorbereitet — ihre
  // Übersetzungsdateien liegen unter src/i18n/, sie werden hier eingetragen,
  // sobald die Texte vollständig sind (siehe README, Abschnitt "Sprache aktivieren").
  i18n: {
    defaultLocale: "de",
    locales: ["de", "pl", "en"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
