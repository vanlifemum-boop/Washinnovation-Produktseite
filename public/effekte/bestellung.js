/* WashInnovation — Bestellanfrage
 *
 * Abgeleitet vom booking.js des scroll-cinematic-Werkzeugs, umgebaut auf
 * Produktbestellungen: Validierung mit Fehlern direkt am Feld, Bestätigung ohne
 * Seitenwechsel, vorbefüllte E-Mail als Standardweg und optional ein POST an
 * einen Formulardienst. Kein Backend nötig.
 *
 * Konfiguration im Seitenkopf, vor diesem Script:
 *   window.BESTELL_KONFIG = { email: "…", betreff: "…", endpunkt: null };
 *   window.BESTELL_TEXTE  = { pflicht: "…", email: "…", menge: "…", … };
 */
(function () {
  "use strict";

  var formular = document.querySelector("[data-bestellformular]");
  if (!formular) return;

  var konfig = window.BESTELL_KONFIG || {};
  var texte = window.BESTELL_TEXTE || {};
  var ergebnis = document.querySelector("[data-bestellergebnis]");

  function fehlerZeigen(feld, meldung) {
    var huelle = feld.closest(".feld");
    if (!huelle) return;
    huelle.classList.add("feld--fehler");
    var stelle = huelle.querySelector(".feld-fehler");
    if (stelle) stelle.textContent = meldung;
    feld.setAttribute("aria-invalid", "true");
  }

  function fehlerLoeschen(feld) {
    var huelle = feld.closest(".feld");
    if (!huelle) return;
    huelle.classList.remove("feld--fehler");
    var stelle = huelle.querySelector(".feld-fehler");
    if (stelle) stelle.textContent = "";
    feld.removeAttribute("aria-invalid");
  }

  formular.addEventListener("input", function (e) {
    if (e.target.name) fehlerLoeschen(e.target);
  });

  function pruefen() {
    var fehler = [];

    formular.querySelectorAll("[required]").forEach(function (feld) {
      if (feld.type === "checkbox") {
        if (!feld.checked) {
          fehlerZeigen(feld, texte.datenschutz || texte.pflicht || "Bitte bestätigen");
          fehler.push(feld);
        }
        return;
      }
      if (!String(feld.value).trim()) {
        fehlerZeigen(feld, texte.pflicht || "Bitte ausfüllen");
        fehler.push(feld);
      }
    });

    var email = formular.querySelector('[name="email"]');
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      fehlerZeigen(email, texte.email || "Bitte eine gültige E-Mail-Adresse angeben");
      fehler.push(email);
    }

    var menge = formular.querySelector('[name="menge"]');
    if (menge && (!menge.value || parseInt(menge.value, 10) < 1)) {
      fehlerZeigen(menge, texte.menge || "Bitte eine Menge ab 1 angeben");
      fehler.push(menge);
    }

    return fehler;
  }

  function nachrichtBauen(daten) {
    var zeilen = [];
    formular.querySelectorAll("[name]").forEach(function (feld) {
      if (feld.type === "checkbox") return;
      var beschriftung = feld.getAttribute("data-beschriftung") || feld.name;
      var wert = feld.value;
      if (feld.tagName === "SELECT" && feld.selectedOptions.length) {
        wert = feld.selectedOptions[0].textContent.trim();
      }
      if (String(wert).trim()) zeilen.push(beschriftung + ": " + wert);
    });
    zeilen.push("");
    zeilen.push("— gesendet über " + window.location.href);
    return zeilen.join("\n");
  }

  formular.addEventListener("submit", function (e) {
    e.preventDefault();

    var fehler = pruefen();
    if (fehler.length) {
      fehler[0].focus();
      fehler[0].scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    var daten = new FormData(formular);
    var nachricht = nachrichtBauen(daten);
    var betreff = konfig.betreff || "Bestellanfrage";

    // Optionaler Formulardienst (z. B. Formspree). Fehlt er, bleibt es bei mailto.
    if (konfig.endpunkt) {
      fetch(konfig.endpunkt, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(daten.entries())),
      }).catch(function () { /* Fehler ist unkritisch — die E-Mail geht trotzdem auf */ });
    }

    var mailto = "mailto:" + encodeURIComponent(konfig.email || "")
      + "?subject=" + encodeURIComponent(betreff)
      + "&body=" + encodeURIComponent(nachricht);

    if (ergebnis) {
      ergebnis.hidden = false;
      var textFeld = ergebnis.querySelector("[data-bestelltext]");
      if (textFeld) textFeld.value = nachricht;
      var kopierKnopf = ergebnis.querySelector("[data-kopieren]");
      if (kopierKnopf && !kopierKnopf.dataset.verdrahtet) {
        kopierKnopf.dataset.verdrahtet = "1";
        kopierKnopf.addEventListener("click", function () {
          var vorher = kopierKnopf.textContent;
          var fertig = function () {
            kopierKnopf.textContent = texte.kopiert || "Kopiert";
            setTimeout(function () { kopierKnopf.textContent = vorher; }, 2000);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(nachricht).then(fertig, function () {
              if (textFeld) { textFeld.select(); document.execCommand("copy"); fertig(); }
            });
          } else if (textFeld) {
            textFeld.select(); document.execCommand("copy"); fertig();
          }
        });
      }
      ergebnis.scrollIntoView({ block: "center", behavior: "smooth" });
      ergebnis.setAttribute("tabindex", "-1");
      ergebnis.focus({ preventScroll: true });
    }

    window.location.href = mailto;
  });
})();
