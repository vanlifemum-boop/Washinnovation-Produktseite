/* WashInnovation — Seitenverhalten
 *   - mobiles Menü
 *   - Scroll-Reveals
 *   - Parallax für Elemente mit data-parallax
 *   - Hochzählender Spendenzähler
 *   - Jahreszahl im Footer
 *
 * Bewegung wird komplett übersprungen, wenn prefers-reduced-motion gesetzt ist —
 * die Inhalte sind dann sofort und dauerhaft sichtbar.
 */
(function () {
  "use strict";

  var bewegungOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  /* ---- Mobiles Menü ---- */
  var schalter = document.querySelector(".nav-schalter");
  var menue = document.querySelector(".nav-links");
  if (schalter && menue) {
    schalter.addEventListener("click", function () {
      var offen = menue.classList.toggle("offen");
      schalter.setAttribute("aria-expanded", offen ? "true" : "false");
    });
    menue.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menue.classList.remove("offen");
        schalter.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Sprachmenü ---- */
  var sprachSchalter = document.querySelector(".sprache-schalter");
  var sprachMenue = document.querySelector(".sprache-menue");
  if (sprachSchalter && sprachMenue) {
    sprachSchalter.addEventListener("click", function (e) {
      e.stopPropagation();
      var offen = sprachMenue.classList.toggle("offen");
      sprachSchalter.setAttribute("aria-expanded", offen ? "true" : "false");
    });
    document.addEventListener("click", function () {
      sprachMenue.classList.remove("offen");
      sprachSchalter.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        sprachMenue.classList.remove("offen");
        sprachSchalter.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Scroll-Reveals ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (!bewegungOk || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("sichtbar"); });
  } else {
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("sichtbar"); beobachter.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { beobachter.observe(el); });
  }

  /* ---- Parallax ---- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (bewegungOk && parallaxEls.length) {
    var angefordert = false;
    var versetzen = function () {
      angefordert = false;
      var mitte = window.innerHeight / 2;
      parallaxEls.forEach(function (el) {
        var staerke = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var kasten = el.getBoundingClientRect();
        var abstand = (kasten.top + kasten.height / 2) - mitte;
        el.style.transform = "translate3d(0," + (-abstand * staerke).toFixed(1) + "px,0)";
      });
    };
    window.addEventListener("scroll", function () {
      if (!angefordert) { angefordert = true; requestAnimationFrame(versetzen); }
    }, { passive: true });
    window.addEventListener("resize", versetzen, { passive: true });
    versetzen();
  }

  /* ---- Spendenzähler ----
     Die Zahl steht als data-ziel im Markup und kommt aus den bestätigten
     Lieferungen. Hier wird sie nur animiert — nie berechnet. */
  var zaehler = document.querySelector("[data-zaehler]");
  if (zaehler) {
    var ziel = parseInt(zaehler.getAttribute("data-zaehler"), 10) || 0;
    if (!bewegungOk || ziel === 0) {
      zaehler.textContent = String(ziel);
    } else {
      var starten = function () {
        var beginn = null, dauer = 1400;
        var tick = function (jetzt) {
          if (beginn === null) beginn = jetzt;
          var t = Math.min(1, (jetzt - beginn) / dauer);
          var weich = 1 - Math.pow(1 - t, 3);
          zaehler.textContent = String(Math.round(ziel * weich));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      if ("IntersectionObserver" in window) {
        var zb = new IntersectionObserver(function (eintraege) {
          if (eintraege[0].isIntersecting) { starten(); zb.disconnect(); }
        }, { threshold: 0.4 });
        zb.observe(zaehler);
      } else {
        starten();
      }
    }
  }

  /* ---- Jahreszahl ---- */
  document.querySelectorAll("[data-jahr]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
