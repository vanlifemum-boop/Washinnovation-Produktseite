/* WashInnovation — prozedurale Hero-Szene für den Scroll-Scrub
 *
 * Zeichnet den Ablauf eines fallenden Tropfens: Er fällt, trifft auf die
 * Wasseroberfläche, wirft eine Krone und Ringe, die Oberfläche beruhigt sich.
 * Der Ablauf hängt allein am Scroll-Fortschritt (0…1).
 *
 * Der Sinn: Der Effekt läuft ohne eine einzige Bilddatei. Sobald echte Clips
 * vorliegen, wird in der Konfiguration `render` durch `framePath` ersetzt
 * (Frames per scripts/extract-frames.sh aus dem scroll-cinematic-Werkzeug).
 *
 * Signatur: render(ctx, fortschritt, { width, height })
 */
window.WASSER_SZENE = (function () {
  "use strict";

  var TIEFSEE = "#062a4a";
  var BLAU = "#0f6fc4";
  var HELL = "#9ed2f5";

  function misch(a, b, t) { return a + (b - a) * t; }
  function begrenze(v, min, max) { return v < min ? min : v > max ? max : v; }
  function weich(t) { return t * t * (3 - 2 * t); }

  return function zeichne(ctx, fortschritt, groesse) {
    var w = groesse.width, h = groesse.height;
    var oberflaeche = h * 0.68;      // Höhe der Wasseroberfläche
    var aufprall = 0.42;             // Fortschritt, bei dem der Tropfen auftrifft

    /* --- Hintergrund: Tiefe von oben nach unten --- */
    var himmel = ctx.createLinearGradient(0, 0, 0, h);
    himmel.addColorStop(0, "#03192c");
    himmel.addColorStop(0.55, TIEFSEE);
    himmel.addColorStop(1, "#04213a");
    ctx.fillStyle = himmel;
    ctx.fillRect(0, 0, w, h);

    /* --- Lichtschein, der beim Aufprall kurz aufflammt --- */
    var blitz = fortschritt < aufprall ? 0 : Math.exp(-(fortschritt - aufprall) * 14);
    var schein = ctx.createRadialGradient(w * 0.5, oberflaeche, 0, w * 0.5, oberflaeche, w * 0.7);
    schein.addColorStop(0, "rgba(158,210,245," + (0.08 + blitz * 0.28) + ")");
    schein.addColorStop(1, "rgba(158,210,245,0)");
    ctx.fillStyle = schein;
    ctx.fillRect(0, 0, w, h);

    /* --- Wasserfläche mit leichter Dünung --- */
    var wellenZeit = fortschritt * 6;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, oberflaeche);
    for (var x = 0; x <= w; x += 8) {
      var y = oberflaeche
        + Math.sin(x * 0.012 + wellenZeit) * 4
        + Math.sin(x * 0.031 - wellenZeit * 1.7) * 2.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    var tiefe = ctx.createLinearGradient(0, oberflaeche, 0, h);
    tiefe.addColorStop(0, "rgba(15,111,196,0.85)");
    tiefe.addColorStop(1, "rgba(3,25,44,0.98)");
    ctx.fillStyle = tiefe;
    ctx.fill();

    /* --- Kaustik: helle Linien unter der Oberfläche --- */
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = HELL;
    ctx.lineWidth = Math.max(1, w * 0.0012);
    for (var k = 0; k < 7; k++) {
      ctx.beginPath();
      var basis = oberflaeche + 18 + k * (h - oberflaeche) * 0.11;
      for (var xk = 0; xk <= w; xk += 10) {
        var yk = basis + Math.sin(xk * 0.02 + wellenZeit * 1.3 + k) * (5 + k);
        if (xk === 0) ctx.moveTo(xk, yk); else ctx.lineTo(xk, yk);
      }
      ctx.stroke();
    }
    ctx.restore();

    /* --- Der fallende Tropfen --- */
    if (fortschritt < aufprall) {
      var tf = weich(fortschritt / aufprall);          // 0…1 während des Falls
      var ty = misch(-h * 0.12, oberflaeche, tf);
      var r = Math.max(3, w * 0.018);
      var streckung = 1 + tf * 0.9;                     // je schneller, desto länglicher

      ctx.save();
      ctx.translate(w * 0.5, ty);
      ctx.scale(1, streckung);
      var tropfenFarbe = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
      tropfenFarbe.addColorStop(0, "rgba(255,255,255,0.95)");
      tropfenFarbe.addColorStop(0.5, "rgba(158,210,245,0.9)");
      tropfenFarbe.addColorStop(1, "rgba(15,111,196,0.75)");
      ctx.fillStyle = tropfenFarbe;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Spiegelung auf der Oberfläche, die mitwächst
      ctx.save();
      ctx.globalAlpha = 0.25 * tf;
      ctx.fillStyle = HELL;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, oberflaeche + 4, r * (1 + tf * 2), r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* --- Aufprall: Krone und Rückstoßtropfen --- */
    if (fortschritt >= aufprall) {
      var nach = (fortschritt - aufprall) / (1 - aufprall);   // 0…1 nach dem Aufprall
      var kronenHoehe = Math.max(0, Math.sin(begrenze(nach * 3.2, 0, Math.PI)) ) * h * 0.10;

      if (kronenHoehe > 0.5) {
        ctx.save();
        ctx.strokeStyle = "rgba(200,232,252,0.75)";
        ctx.lineWidth = Math.max(1.5, w * 0.003);
        for (var s = -1; s <= 1; s += 2) {
          ctx.beginPath();
          ctx.moveTo(w * 0.5 + s * w * 0.02, oberflaeche);
          ctx.quadraticCurveTo(
            w * 0.5 + s * w * 0.035, oberflaeche - kronenHoehe * 0.9,
            w * 0.5 + s * w * 0.05, oberflaeche - kronenHoehe
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // Rückstoßtropfen: fliegen hoch und fallen zurück
      var anzahl = 9;
      for (var i = 0; i < anzahl; i++) {
        var phase = begrenze(nach * 1.9 - i * 0.02, 0, 1);
        if (phase <= 0 || phase >= 1) continue;
        var richtung = (i - (anzahl - 1) / 2) / ((anzahl - 1) / 2);
        var weite = richtung * w * 0.22 * phase;
        var hoehe = Math.sin(phase * Math.PI) * h * (0.16 - Math.abs(richtung) * 0.06);
        var rr = Math.max(1.5, w * 0.006 * (1 - phase * 0.5));
        ctx.save();
        ctx.globalAlpha = 1 - phase * 0.8;
        ctx.fillStyle = "rgba(230,245,255,0.95)";
        ctx.beginPath();
        ctx.arc(w * 0.5 + weite, oberflaeche - hoehe, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ringe, die nach außen laufen
      for (var ring = 0; ring < 4; ring++) {
        var rp = nach * 1.5 - ring * 0.14;
        if (rp <= 0 || rp > 1) continue;
        ctx.save();
        ctx.globalAlpha = (1 - rp) * 0.5;
        ctx.strokeStyle = HELL;
        ctx.lineWidth = Math.max(1, w * 0.0022 * (1 - rp));
        ctx.beginPath();
        ctx.ellipse(w * 0.5, oberflaeche + 3, rp * w * 0.55, rp * w * 0.55 * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* --- Vignette, damit der Text darüber ruhig steht --- */
    var rand = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    rand.addColorStop(0, "rgba(0,0,0,0)");
    rand.addColorStop(1, "rgba(2,15,28,0.55)");
    ctx.fillStyle = rand;
    ctx.fillRect(0, 0, w, h);
  };
})();
