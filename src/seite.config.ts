/**
 * Schalter für den Vorschau-Betrieb.
 *
 * Solange VORSCHAU auf true steht:
 *   - jede Seite trägt <meta name="robots" content="noindex, nofollow">
 *   - im Kopf erscheint ein Hinweisstreifen
 *
 * Zum Livegang:
 *   1. Hier auf false setzen
 *   2. public/robots.txt auf die Freigabe-Fassung umstellen (steht dort auskommentiert)
 *   3. Vorher die Platzhalter füllen — siehe README, Abschnitt „Vor dem Livegang"
 */
export const VORSCHAU = true;
