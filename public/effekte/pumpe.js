/* WashInnovation — die Handpumpe im Hero
 *
 * Das Produkt im Hero ist eine Handpumpe: oben ein blauer Druckkopf, unten die
 * Düse. Beim Runterscrollen sinkt der Kopf ein, beim Hochscrollen kommt er
 * wieder heraus — du pumpst also selbst mit dem Mausrad. Beim Drücken spritzt
 * es, sonst tropft es langsam weiter.
 *
 * Umgesetzt mit zwei Ebenen desselben Bildes (siehe .hero-produkt in
 * design.css): Der Körper ist unbeweglich und oben abgeschnitten, der Kopf
 * liegt darüber, ist unten abgeschnitten und wird hier verschoben. Weil der
 * Kopf breiter ist als der Körper, bleibt die Naht in jeder Stellung gedeckt.
 *
 * Wichtig: Die Düse sitzt am Körper und wandert deshalb nicht mit. Regen
 * (tropfen.js) und Schlauch (schlauch.js) setzen unverändert dort an.
 *
 * Veröffentlicht window.WI_PUMPE = { druck, stoss }:
 *   druck — 0…1, wie weit der Kopf eingesunken ist
 *   stoss — 0…1, kurzer Ausschlag beim Runterdrücken, klingt weich ab
 *
 * Abschaltung: prefers-reduced-motion lässt das Bild ruhig und vollständig.
 */
(function () {
  "use strict";

  window.WI_PUMPE = { druck: 0, stoss: 0 };

  var kopf = document.querySelector("[data-pumpen-kopf]");
  if (!kopf) return;
  if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

  var buehne = document.querySelector("#hero") || document.querySelector(".hero-buehne");
  if (!buehne) return;

  // Wie weit der Kopf maximal einsinkt, in Prozent der Bildhöhe. Bei 230 px
  // Bildbreite sind das rund 11 px — spürbar, aber nicht comichaft.
  var HUB = 4.5;

  var letzterDruck = 0;
  var letzteZeit = 0;
  var laeuft = false;
  var raf = 0;

  /** Fortschritt des Heros durch das Bild, 0…1 — dieselbe Rechnung wie in
   *  scroll-cinematic.js, damit sich beide Effekte gleich anfühlen. */
  function fortschritt() {
    var r = buehne.getBoundingClientRect();
    var weg = r.height - window.innerHeight;
    if (weg <= 0) return 0;
    var p = -r.top / weg;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function imBild() {
    var r = buehne.getBoundingClientRect();
    return r.bottom > -200 && r.top < window.innerHeight + 200;
  }

  function schritt(jetzt) {
    raf = requestAnimationFrame(schritt);

    // In Sekunden rechnen, nicht in Bildern: Sonst pumpt ein 120-Hz-Bildschirm
    // doppelt so kräftig wie ein 60-Hz-Gerät.
    var dt = letzteZeit ? Math.min((jetzt - letzteZeit) / 1000, 0.05) : 0.016;
    letzteZeit = jetzt;

    var p = fortschritt();
    var druck = p * p * (3 - 2 * p);          // weiches Ein- und Ausfahren
    kopf.style.setProperty("--druck", (druck * HUB).toFixed(3) + "%");

    // Stoß nur beim Runterdrücken. Hochscrollen entlastet die Pumpe, spritzt
    // aber nicht — genau wie bei einer echten Handpumpe.
    var tempo = dt > 0 ? (druck - letzterDruck) / dt : 0;   // Druck je Sekunde
    letzterDruck = druck;
    var neu = tempo > 0 ? Math.min(1, tempo) : 0;
    window.WI_PUMPE.druck = druck;
    window.WI_PUMPE.stoss = Math.max(window.WI_PUMPE.stoss * Math.exp(-5 * dt), neu);

    // Ist der Hero weggescrollt, gibt es nichts mehr zu rechnen
    if (!imBild() && window.WI_PUMPE.stoss < 0.01) laufen(false);
  }

  function laufen(an) {
    if (an && !laeuft) {
      laeuft = true;
      // Immer über requestAnimationFrame starten, nie schritt() direkt rufen:
      // sonst käme der erste Aufruf ohne Zeitstempel herein, während letzteZeit
      // noch den Wert von vor der Pause trägt. dt wäre NaN, und über stoss
      // würde das bis in den Regen durchschlagen — der dann dauerhaft steht.
      letzteZeit = 0;
      raf = requestAnimationFrame(schritt);
    } else if (!an && laeuft) {
      laeuft = false;
      letzteZeit = 0;
      cancelAnimationFrame(raf);
    }
  }

  laufen(true);
  window.addEventListener("scroll", function () {
    if (imBild()) laufen(true);
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    laufen(!document.hidden && imBild());
  });
})();
