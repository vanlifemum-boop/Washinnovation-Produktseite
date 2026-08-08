/* WashInnovation — Silikonschlauch an der Brause
 *
 * Setzt am unteren Ende der Duschbrause an und läuft von dort in einem weichen
 * Bogen die Seite hinunter, über den unteren Bildrand hinaus. Weil die Ebene
 * fest im Fenster steht, begleitet er den ganzen Weg nach unten.
 *
 * Umgesetzt als fixes SVG mit drei übereinanderliegenden Linien: eine breite
 * milchige für den Schlauchkörper, eine schmale helle als Glanzkante und eine
 * dunklere für die Schattenseite. Das ergibt die Silikon-Anmutung, ohne ein
 * einziges Bild zu laden.
 *
 * Die Enden stehen im Markup, nicht hier:
 *   [data-schlauch-start] + data-auslass="x%,y%"   — an der Brause, Pflicht
 *   [data-schlauch-ende]  + data-einlass="x%,y%"   — Gegenstück, optional
 *
 * Ohne Gegenstück läuft der Schlauch bis unter den unteren Bildrand. Das ist
 * der Normalfall im Hero.
 *
 * Der Ansatz sitzt bewusst am **Körper** der Brause und nicht am Druckkopf:
 * Der Kopf sinkt beim Pumpen ein, und weil getBoundingClientRect()
 * Transformationen mitrechnet, würde der Schlauch bei jedem Stoß mitzappeln.
 * Am Körper bleibt er ruhig — dieselbe Überlegung wie bei der Düse.
 *
 * Fehlt die Brause, wird nichts gezeichnet — auf allen Seiten außer der
 * Startseite gibt es deshalb keine Schlauch-Ebene.
 *
 * Abschaltung: prefers-reduced-motion lässt den Schlauch stehen, aber ohne das
 * langsame Schwingen — er ist Deko, kein Inhalt.
 */
(function () {
  "use strict";

  var startEl = document.querySelector("[data-schlauch-start]");
  if (!startEl) return;                                      // ohne Brause kein Schlauch
  var endeEl = document.querySelector("[data-schlauch-ende]"); // optional

  var bewegungOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  var NS = "http://www.w3.org/2000/svg";
  var huelle = document.createElement("div");
  huelle.id = "schlauch-ebene";
  huelle.setAttribute("aria-hidden", "true");
  // Über der Tropfen-Ebene (30): Der Schlauch gehört zum Aufbau und soll nicht
  // hinter jedem vorbeitreibenden Tropfen verschwinden.
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

    /* Zur Seite, auf die der Schlauch ausbaucht: Sitzt die Brause am rechten
       Rand — auf dem Handy sind es 4 px —, muss der Bogen nach innen gehen.
       Nach außen liefe er aus dem Bild, das SVG schnitte ihn ab, und übrig
       bliebe ein an die Kante gepresster gerader Strich. */
    var nachInnen = a && a.x > window.innerWidth * 0.6 ? -1 : 1;

    // Ohne Gegenstück läuft der Schlauch über den unteren Rand hinaus und
    // schwingt dabei zur Bildmitte hin aus.
    var b = endeEl ? punkt(endeEl, "data-einlass", "50,0")
                   : (a ? { x: a.x + 54 * nachInnen, y: window.innerHeight + 80 } : null);
    if (!a || !b) {
      koerper.removeAttribute("d");
      schatten.removeAttribute("d");
      glanz.removeAttribute("d");
      return;
    }

    // Der Schlauch ist an der Brause fest und schwingt nur auf seiner Länge.
    // Deshalb wirkt das Schwingen auf die Kontrollpunkte, nie auf die
    // Endpunkte — sonst löste er sich sichtbar von der Düse.
    var laenge = b.y - a.y;
    var bauch = Math.max(18, Math.abs(laenge) * 0.22);
    var schwung = Math.sin(zeit * 0.28) * Math.min(9, Math.abs(laenge) * 0.05);

    var x1 = a.x + (bauch * 0.5) * nachInnen + schwung;
    var y1 = a.y + laenge * 0.38;
    var x2 = b.x + (bauch * 0.7) * nachInnen - schwung;
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
  // endeEl kann fehlen — dann läuft der Schlauch aus dem Bild heraus.
  [startEl, endeEl].forEach(function (el) {
    if (el && el.tagName === "IMG" && !el.complete) {
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
