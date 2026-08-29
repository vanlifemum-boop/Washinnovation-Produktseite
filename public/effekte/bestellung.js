/* WashInnovation — Bestellanfrage
 *
 * Abgeleitet vom booking.js des scroll-cinematic-Werkzeugs, umgebaut auf
 * Produktbestellungen: Validierung mit Fehlern direkt am Feld, Bestätigung ohne
 * Seitenwechsel, vorbefüllte Nachricht als Standardweg und optional ein POST an
 * einen Formulardienst. Kein Backend nötig.
 *
 * Konfiguration im Seitenkopf, vor diesem Script:
 *   window.BESTELL_KONFIG = { email: "…", whatsapp: "…", betreff: "…", endpunkt: null };
 *   window.BESTELL_TEXTE  = { pflicht: "…", email: "…", menge: "…", … };
 *
 * Ist `email` leer, geht die fertige Anfrage über `whatsapp`. Das ist kein
 * Notbehelf, sondern der Normalfall, solange keine Postadresse hinterlegt ist:
 * Ohne Empfänger öffnete mailto: früher ein leeres Mailfenster, und die
 * ausgefüllte Bestellung war weg. Fehlt beides, bleibt die Bestätigung mit dem
 * Text zum Kopieren stehen — dann ist wenigstens nichts verloren.
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

    // Wohin die fertige Anfrage geht: E-Mail, wenn eine Adresse hinterlegt ist,
    // sonst WhatsApp. encodeURIComponent gehört nicht um die Adresse selbst —
    // das @ würde zu %40 und manche Mailprogramme stolpern darüber.
    var ziel = konfig.email
      ? "mailto:" + konfig.email
        + "?subject=" + encodeURIComponent(betreff)
        + "&body=" + encodeURIComponent(nachricht)
      : (konfig.whatsapp
        ? konfig.whatsapp + "?text=" + encodeURIComponent(betreff + "\n\n" + nachricht)
        : null);

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

    // Ohne Ziel bleibt die Bestätigung mit dem Text zum Kopieren stehen.
    if (!ziel) return;
    if (konfig.email) {
      window.location.href = ziel;
    } else {
      // WhatsApp in einem neuen Tab: Die ausgefüllte Bestellseite bleibt so
      // stehen, falls der Chat nicht aufgeht.
      window.open(ziel, "_blank", "noopener");
    }
  });
})();
