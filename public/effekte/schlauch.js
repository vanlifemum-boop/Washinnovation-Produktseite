/* WashInnovation — Silikonschlauch an der Duschbrause
 *
 * Zeichnet einen durchsichtigen Schlauch, der an der Düse der Brause ansetzt und
 * in einem weichen Bogen bis zum unteren Bildrand läuft — und damit über die
 * ganze Seite, weil die Ebene mitscrollt. Ist die Brause weggescrollt, kommt der
 * Schlauch von der oberen Kante herunter, so wie eine Leitung von oben.
 *
 * Umgesetzt als fixes SVG mit drei übereinanderliegenden Linien: eine breite
 * milchige für den Schlauchkörper, eine schmale helle als Glanzkante und eine
 * dunklere für die Schattenseite. Das ergibt die Silikon-Anmutung, ohne ein
 * einziges Bild zu laden.
 *
 * Die Quelle ist dasselbe Element wie beim Regen: [data-tropfen-quelle] mit
 * data-duese="x%,y%".
 *
 * Abschaltung: prefers-reduced-motion lässt den Schlauch stehen, aber ohne das
 * langsame Schwingen — er ist Deko, kein Inhalt.
 */
(function () {
  "use strict";

  var quelleEl = document.querySelector("[data-tropfen-quelle]");
  if (!quelleEl) return;

  var bewegungOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  var NS = "http://www.w3.org/2000/svg";
  var huelle = document.createElement("div");
  huelle.id = "schlauch-ebene";
  huelle.setAttribute("aria-hidden", "true");
  huelle.style.cssText = "position:fixed;inset:0;z-index:29;pointer-events:none;";

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
  var koerper = linie(15, "rgba(226,242,252,0.20)", 0.6);
  var schatten = linie(5, "rgba(10,60,105,0.16)", 0.4);
  var glanz = linie(3.5, "rgba(255,255,255,0.42)", 0.2);

  huelle.appendChild(svg);
  document.body.appendChild(huelle);

  var zeit = 0;

  function duese() {
    var kasten = quelleEl.getBoundingClientRect();
    if (kasten.width < 4) return null;
    var roh = (quelleEl.getAttribute("data-duese") || "50,100").split(",");
    return {
      x: kasten.left + kasten.width * (parseFloat(roh[0]) / 100),
      y: kasten.top + kasten.height * (parseFloat(roh[1]) / 100),
    };
  }

  function zeichnen() {
    var h = window.innerHeight;
    var b = window.innerWidth;
    var d = duese();

    // Brause weggescrollt → der Schlauch kommt von oben herein
    var startX = d ? d.x : b * 0.82;
    var startY = d ? d.y : -40;

    // Weicher S-Bogen bis unter den unteren Rand. Der Schlauch schwingt
    // seitlich aus, damit er nicht wie ein gerader Strich wirkt.
    var schwung = Math.sin(zeit * 0.5) * 14;
    var ende = h + 60;
    var laenge = ende - startY;

    var x1 = startX - 70 + schwung;
    var y1 = startY + laenge * 0.32;
    var x2 = startX + 90 - schwung;
    var y2 = startY + laenge * 0.68;
    var endeX = startX - 30 + schwung * 0.5;

    var pfad = "M " + startX + " " + startY +
      " C " + x1 + " " + y1 + ", " + x2 + " " + y2 + ", " + endeX + " " + ende;

    koerper.setAttribute("d", pfad);
    schatten.setAttribute("d", pfad);
    glanz.setAttribute("d", pfad);
    // Die Glanzkante sitzt leicht versetzt — das macht aus der Linie einen Schlauch
    glanz.setAttribute("transform", "translate(-3.5,0)");
    schatten.setAttribute("transform", "translate(4,0)");
  }

  zeichnen();
  window.addEventListener("scroll", zeichnen, { passive: true });
  window.addEventListener("resize", zeichnen);
  if (quelleEl.tagName === "IMG" && !quelleEl.complete) {
    quelleEl.addEventListener("load", zeichnen, { once: true });
  }

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
