# Werkzeuge

Einmal-Skripte für die Bildaufbereitung. Sie werden im normalen Betrieb nicht
gebraucht — die Ergebnisse liegen fertig unter `public/bilder/`.

Beide brauchen `sharp`, das absichtlich keine feste Abhängigkeit des Projekts ist:

```bash
npm i -D sharp
```

| Skript | Zweck |
|---|---|
| `katalog-zuschnitt.mjs` | Schneidet die Produktfotos aus den Seiten des Produktkatalogs 2025. Die Bildausschnitte stehen als Anteile (0…1) im Skript und können dort nachjustiert werden. |
| `freistellen.mjs` | Entfernt den weißen Hintergrund eines Produktfotos per Flutfüllung vom Bildrand. Wichtig: Die Schwelle muss über der Helligkeit des Produkts liegen, sonst wird ein weißer Produktkörper mitgelöscht (bei der Duschbrause: Hintergrund 255, Körper 236–247 → Schwelle 251). |

Die Quelldateien der Katalogseiten liegen nicht im Repo. Wenn die Zuschnitte neu
erzeugt werden sollen, muss der Pfad `QUELLE` im Skript auf den Ordner mit den
Katalogseiten zeigen.
