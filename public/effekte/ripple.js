/* WashInnovation — Wasser-Ripple auf Bildflächen
 *
 * Klassisches gedämpftes Höhenfeld (zwei Puffer, Nachbarmittelung, Dämpfung).
 * Maus und Berührung setzen Tropfen, dazu fallen in Ruhe zufällige. Die Wellen
 * verzerren das darunterliegende Bild.
 *
 * Verwendung im Markup:
 *   <figure data-ripple><img src="…" alt="…"></figure>
 *
 * Gerechnet wird auf stark reduzierter Auflösung (max. 220 px breit) und per CSS
 * hochskaliert — das reicht optisch völlig und kostet kaum Rechenzeit.
 *
 * Abschaltungen: prefers-reduced-motion, Tab im Hintergrund, außerhalb des
 * Sichtbereichs. Schlägt etwas fehl, bleibt schlicht das Originalbild stehen.
 */
(function () {
  "use strict";

  if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

  var MAX_BREITE = 220;      // Rechenauflösung
  var DAEMPFUNG = 0.962;     // je näher an 1, desto länger laufen die Wellen
  var TROPFEN_STAERKE = 520;

  document.querySelectorAll("[data-ripple]").forEach(function (behaelter) {
    var bild = behaelter.querySelector("img");
    if (!bild) return;
    if (bild.complete && bild.naturalWidth) starten(behaelter, bild);
    else bild.addEventListener("load", function () { starten(behaelter, bild); }, { once: true });
  });

  function starten(behaelter, bild) {
    var kasten = behaelter.getBoundingClientRect();
    if (kasten.width < 40) return;

    var seitenverhaeltnis = bild.naturalHeight / bild.naturalWidth;
    var b = Math.min(MAX_BREITE, Math.round(kasten.width));
    var h = Math.max(8, Math.round(b * seitenverhaeltnis));

    var canvas = document.createElement("canvas");
    canvas.width = b;
    canvas.height = h;
    canvas.className = "ripple-canvas";
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Quellbild einmal in Rechenauflösung ablegen
    var quelle = document.createElement("canvas");
    quelle.width = b; quelle.height = h;
    var qctx = quelle.getContext("2d", { alpha: false });
    if (!qctx) return;
    try {
      qctx.drawImage(bild, 0, 0, b, h);
      var quellDaten = qctx.getImageData(0, 0, b, h);
    } catch (e) {
      return; // z. B. fremdes Bild ohne CORS — dann bleibt das Original stehen
    }

    behaelter.appendChild(canvas);
    behaelter.classList.add("hat-ripple");

    var ziel = ctx.createImageData(b, h);
    var vorher = new Float32Array(b * h);
    var jetzt = new Float32Array(b * h);

    function tropfen(x, y, staerke) {
      x = Math.round(x); y = Math.round(y);
      if (x < 2 || y < 2 || x > b - 3 || y > h - 3) return;
      vorher[y * b + x] += staerke;
    }

    behaelter.addEventListener("pointermove", function (e) {
      var r = behaelter.getBoundingClientRect();
      tropfen(((e.clientX - r.left) / r.width) * b, ((e.clientY - r.top) / r.height) * h, TROPFEN_STAERKE * 0.5);
    }, { passive: true });

    behaelter.addEventListener("pointerdown", function (e) {
      var r = behaelter.getBoundingClientRect();
      tropfen(((e.clientX - r.left) / r.width) * b, ((e.clientY - r.top) / r.height) * h, TROPFEN_STAERKE * 2);
    }, { passive: true });

    var naechsterTropfen = 0;

    function schritt(zeit) {
      // Wellengleichung: neuer Zustand aus den vier Nachbarn minus altem Zustand
      for (var y = 1; y < h - 1; y++) {
        var zeile = y * b;
        for (var x = 1; x < b - 1; x++) {
          var i = zeile + x;
          var wert = (vorher[i - 1] + vorher[i + 1] + vorher[i - b] + vorher[i + b]) / 2 - jetzt[i];
          jetzt[i] = wert * DAEMPFUNG;
        }
      }
      var tausch = vorher; vorher = jetzt; jetzt = tausch;

      // Höhenfeld → Bildversatz
      var q = quellDaten.data, z = ziel.data;
      for (var y2 = 1; y2 < h - 1; y2++) {
        var zeile2 = y2 * b;
        for (var x2 = 1; x2 < b - 1; x2++) {
          var j = zeile2 + x2;
          var dx = (vorher[j - 1] - vorher[j + 1]) | 0;
          var dy = (vorher[j - b] - vorher[j + b]) | 0;
          var qx = x2 + dx, qy = y2 + dy;
          if (qx < 0) qx = 0; else if (qx > b - 1) qx = b - 1;
          if (qy < 0) qy = 0; else if (qy > h - 1) qy = h - 1;
          var von = (qy * b + qx) * 4, nach = j * 4;
          // Gefälle als Glanzlicht — dadurch sieht die Welle nass aus
          var glanz = dx * 2;
          z[nach] = klemme(q[von] + glanz);
          z[nach + 1] = klemme(q[von + 1] + glanz);
          z[nach + 2] = klemme(q[von + 2] + glanz);
          z[nach + 3] = 255;
        }
      }
      ctx.putImageData(ziel, 0, 0);

      // gelegentlich ein Tropfen von selbst
      if (zeit > naechsterTropfen) {
        tropfen(2 + Math.random() * (b - 4), 2 + Math.random() * (h - 4), TROPFEN_STAERKE);
        naechsterTropfen = zeit + 1800 + Math.random() * 2600;
      }
    }

    function klemme(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

    var laeuft = false, raf = 0;
    function schleife(zeit) {
      raf = requestAnimationFrame(schleife);
      schritt(zeit);
    }
    function laufen(an) {
      if (an && !laeuft) { laeuft = true; raf = requestAnimationFrame(schleife); }
      else if (!an && laeuft) { laeuft = false; cancelAnimationFrame(raf); }
    }

    // Nur rechnen, wenn die Fläche auch zu sehen ist
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (eintraege) {
        laufen(eintraege[0].isIntersecting && !document.hidden);
      }, { threshold: 0.05 }).observe(behaelter);
    } else {
      laufen(true);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) laufen(false);
    });
  }
})();
