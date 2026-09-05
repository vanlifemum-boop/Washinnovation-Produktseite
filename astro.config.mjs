// @ts-check
import { defineConfig } from "astro/config";

// Eigene Domain: Die Seite läuft unter washinnovation.de, deshalb BASE = "/".
//
// Die Domain steht an genau zwei Stellen: hier und in public/CNAME. Aus SITE
// werden alle canonical-Adressen und hreflang-Verweise berechnet, aus BASE alle
// internen Links und Dateipfade — ein Tippfehler hier vergiftet die ganze Seite.
//
// Die Datei muss exakt "CNAME" heißen (Großbuchstaben, ohne Endung). Jeder
// andere Name wird von GitHub Pages ignoriert, die Domain bleibt dann inaktiv.
// Sie liegt in public/, damit sie bei jedem Build mit ausgeliefert wird: Bei
// einem Actions-Deploy überschreibt das Artefakt sonst die Datei, die GitHub
// beim Eintragen der Domain selbst anlegt.
const SITE = "https://washinnovation.de";
const BASE = "/";

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "always",
  build: { format: "directory" },

  // Alle sechs Sprachfassungen sind vollständig und werden statisch gebaut.
  i18n: {
    defaultLocale: "de",
    locales: ["de", "pl", "en", "fr", "es", "it"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
