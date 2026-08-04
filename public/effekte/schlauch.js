/* WashInnovation — Silikonschlauch zwischen Flasche und Brause
 *
 * Verbindet den Auslass der aufgehängten Flasche mit dem Anschlussstück der
 * Duschbrause — also genau die Strecke, die beim echten Produkt der Schlauch
 * zurücklegt. Das Wasser läuft von oben nach unten, angetrieben allein von der
 * Schwerkraft; darunter kommen die Tropfen aus der Düse (tropfen.js).
 *
 * Umgesetzt als fixes SVG mit drei übereinanderliegenden Linien: eine breite
 * milchige für den Schlauchkörper, eine schmale helle als Glanzkante und eine
 * dunklere für die Schattenseite. Das ergibt die Silikon-Anmutung, ohne ein
 * einziges Bild zu laden.
 *
 * Die beiden Enden stehen im Markup, nicht hier:
 *   [data-schlauch-start] + data-auslass="x%,y%"   — an der Flasche
 *   [data-schlauch-ende]  + data-einlass="x%,y%"   — an der Brause
 *
 * Das Ende sitzt bewusst am Druckkopf und nicht am Körper der Brause: Der Kopf
 * sinkt beim Scrollen ein (pumpe.js), und weil getBoundingClientRect()
 * Transformationen mitrechnet, zuckt der Schlauch beim Pumpen leicht mit.
 *
 * Fehlt eines der beiden Enden, wird nichts gezeichnet. Ein Schlauch, der aus
 * dem Nichts kommt oder ins Leere läuft, ist schlechter als gar keiner.
 *
 * Abschaltung: prefers-reduced-motion lässt den Schlauch stehen, aber ohne das
 * langsame Schwingen — er ist Deko, kein Inhalt.
 */
(function () {
  "use strict";

  var startEl = document.querySelector("[data-schlauch-start]");
  var endeEl = document.querySelector("[data-schlauch-ende]");
  if (!startEl || !endeEl) return;

  var bewegungOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  var NS = "http://www.w3.org/2000/svg";
  var huelle = document.createElement("div");
  huelle.id = "schlauch-ebene";
  huelle.setAttribute("aria-hidden", "true");
  // Über der Tropfen-Ebene (30), aber unter Flasche und Brause (32): Der
  // Schlauch gehört sichtbar zum Aufbau, steckt aber in beiden Bildern.
  huelle.style.cssText = "position:fixed;inset:0;z-index:31;pointer-events:none;";

  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.style.cssText = "display:block;width:100%;height:100%";

  function linie(breite, farbe, unschaerfe) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", farbe);
    p.setAttribute("stroke-width", String(breite));
    p.setAttribute("stroke-linecap", "round");
    if (unschaerfe) p.style.filter = "blur(" + unschaerfe + "px)";
    svg.appendChild(p);
    return p;
  }

  // Reihenfolge = Zeichenreihenfolge: Körper, Schattenseite, Glanzkante
  var koerper = linie(13, "rgba(226,242,252,0.22)", 0.6);
  var schatten = linie(4.5, "rgba(10,60,105,0.18)", 0.4);
  var glanz = linie(3, "rgba(255,255,255,0.45)", 0.2);

  huelle.appendChild(svg);
  document.body.appendChild(huelle);

  var zeit = 0;

  /** Punkt auf einem Element aus einer Prozentangabe im Markup. */
  function punkt(el, attribut, vorgabe) {
    var kasten = el.getBoundingClientRect();
    if (kasten.width < 4) return null;
    var roh = (el.getAttribute(attribut) || vorgabe).split(",");
    return {
      x: kasten.left + kasten.width * (parseFloat(roh[0]) / 100),
      y: kasten.top + kasten.height * (parseFloat(roh[1]) / 100),
    };
  }

  function zeichnen() {
    var a = punkt(startEl, "data-auslass", "50,100");
    var b = punkt(endeEl, "data-einlass", "50,0");
    if (!a || !b) {
      koerper.removeAttribute("d");
      schatten.removeAttribute("d");
      glanz.removeAttribute("d");
      return;
    }

    // Ein hängender Schlauch ist an beiden Enden fest und schwingt nur in der
    // Mitte. Deshalb wirkt das Schwingen auf die Kontrollpunkte, nie auf die
    // Endpunkte — sonst löste er sich sichtbar von der Flasche.
    var laenge = b.y - a.y;
    var bauch = Math.max(18, Math.abs(laenge) * 0.22);
    var schwung = Math.sin(zeit * 0.28) * Math.min(9, Math.abs(laenge) * 0.05);

    var x1 = a.x + bauch * 0.5 + schwung;
    var y1 = a.y + laenge * 0.38;
    var x2 = b.x + bauch * 0.7 - schwung;
    var y2 = a.y + laenge * 0.72;

    var pfad = "M " + a.x + " " + a.y +
      " C " + x1 + " " + y1 + ", " + x2 + " " + y2 + ", " + b.x + " " + b.y;

    koerper.setAttribute("d", pfad);
    schatten.setAttribute("d", pfad);
    glanz.setAttribute("d", pfad);
    // Die Glanzkante sitzt leicht versetzt — das macht aus der Linie einen Schlauch
    glanz.setAttribute("transform", "translate(-3,0)");
    schatten.setAttribute("transform", "translate(3.5,0)");
  }

  zeichnen();
  window.addEventListener("scroll", zeichnen, { passive: true });
  window.addEventListener("resize", zeichnen);
  [startEl, endeEl].forEach(function (el) {
    if (el.tagName === "IMG" && !el.complete) {
      el.addEventListener("load", zeichnen, { once: true });
    }
  });

  if (bewegungOk) {
    var laeuft = true;
    function schleife() {
      if (!laeuft) return;
      requestAnimationFrame(schleife);
      zeit += 0.016;
      zeichnen();
    }
    schleife();
    document.addEventListener("visibilitychange", function () {
      var vorher = laeuft;
      laeuft = !document.hidden;
      if (laeuft && !vorher) schleife();
    });
  }
})();
