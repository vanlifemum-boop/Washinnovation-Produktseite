# Unterlagen

Quellenmaterial für die Inhalte der Website. **Kein Website-Inhalt** — diese Dateien
werden nicht mitgebaut und erscheinen nicht auf der Seite.

| Datei | Wofür |
|---|---|
| `wasserstatistik_bericht.pdf` | Grundlage der Zahlen auf `/wasser`. Zusammenstellung aus WHO/UNICEF Joint Monitoring Programme, UN-Weltwasserbericht (UNESCO) und Destatis/BDEW. Stand August 2026. |
| `wash_innovation_berichte.pdf` | Medienanalyse und Presseschau zu WaSH Innovation. Grundlage für einen späteren Ausbau der Über-uns-Seite. Noch nicht verwendet. |

## Wichtig zu den Zahlen

Die Werte in `src/data/wasserzahlen.json` sind aus dem zusammengestellten Bericht
übernommen, nicht aus einer eigenen Prüfung der Primärquellen. Deshalb trägt jede
Zahl auf der Seite **Quelle und Stand**.

Vor größeren Kampagnen oder Druckerzeugnissen: gegen die dann aktuelle Fassung von
JMP und UN-Weltwasserbericht gegenprüfen und `stand` in der JSON-Datei nachziehen.
Der Bericht selbst mahnt das ebenfalls an.
