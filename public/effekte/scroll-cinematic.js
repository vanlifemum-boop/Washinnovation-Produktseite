/* scroll-cinematic engine
 * Canvas image-sequence scrub driven by scroll progress, on a Lenis rAF loop.
 *
 * Configure by defining `window.SCRUB_SECTIONS` BEFORE this script runs
 * (see the inline block at the bottom of index.html). Each entry:
 *   {
 *     section:    "#hero",            // CSS selector for the outer sticky section
 *     frameCount: 179,                 // number of frames to preload/scrub
 *     bg:         "#0a0a12",           // canvas clear color
 *     framePath:  (i) => `frames/spin/frame_${String(i).padStart(4,"0")}.jpg`
 *   }
 * Sections whose element is missing are skipped gracefully.
 */
(function () {
  "use strict";

  const DPR_CAP = 2;
  const sections = Array.isArray(window.SCRUB_SECTIONS) ? window.SCRUB_SECTIONS : [];

  // ---- Lenis smooth scroll (optional; falls back to native scroll) ----
  let lenis = null;
  if (typeof window.Lenis === "function") {
    lenis = new window.Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
  }

  // ---- Build a runtime state object per configured section ----
  const stages = [];

  function setupStage(cfg) {
    const outer = document.querySelector(cfg.section);
    if (!outer) return null; // skip missing sections

    const canvas = outer.querySelector("canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { alpha: false });

    // Render mode: a section can draw procedurally via cfg.render(ctx, progress,
    // { width, height }) instead of scrubbing preloaded JPGs. Used by the demo
    // so the effect is visible with zero binary assets.
    const isRender = typeof cfg.render === "function";

    const frameCount = isRender ? (cfg.frameCount | 0 || 180) : cfg.frameCount | 0;
    const images = new Array(isRender ? 0 : frameCount);
    let loaded = 0;

    if (!isRender) {
      // Preload every frame.
      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          loaded++;
          if (i === 0) drawFrame(stage, 0); // paint first frame ASAP
        };
        img.src = cfg.framePath(i);
        images[i] = img;
      }
    }

    const stage = {
      cfg,
      outer,
      canvas,
      ctx,
      images,
      frameCount,
      isRender,
      bg: cfg.bg || "#000",
      current: -1,
      lastProgress: -1,
      get loaded() { return loaded; },
    };
    return stage;
  }

  // Procedural draw for render-mode sections.
  function drawRender(stage, progress) {
    if (progress === stage.lastProgress) return;
    stage.lastProgress = progress;
    const { ctx, canvas, bg } = stage;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stage.cfg.render(ctx, progress, { width: canvas.width, height: canvas.height });
  }

  function resizeCanvas(stage) {
    const { canvas } = stage;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // force a redraw at current frame
    if (stage.isRender) {
      const p = stage.lastProgress < 0 ? 0 : stage.lastProgress;
      stage.lastProgress = -1;
      drawRender(stage, p);
    } else {
      const idx = stage.current < 0 ? 0 : stage.current;
      stage.current = -1;
      drawFrame(stage, idx);
    }
  }

  // Cover-fit draw (like CSS background-size: cover).
  function drawFrame(stage, index) {
    if (index === stage.current) return;
    const img = stage.images[index];
    stage.current = index;

    const { ctx, canvas, bg } = stage;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) * 0.5;
    const dy = (ch - dh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Progress of an outer sticky section through the viewport, 0..1.
  function sectionProgress(outer) {
    const rect = outer.getBoundingClientRect();
    const innerH = window.innerHeight;
    const scrollable = rect.height - innerH;
    if (scrollable <= 0) return 0;
    const p = -rect.top / scrollable;
    return Math.min(Math.max(p, 0), 1);
  }

  // ---- Scroll-synced overlay copy ----
  // Any element with [data-in]/[data-out] inside a stage fades over that
  // progress window. Values are 0..1 fractions of the section's progress.
  function updateOverlays(stage, progress) {
    const items = stage.outer.querySelectorAll("[data-in]");
    items.forEach((el) => {
      const inP = parseFloat(el.getAttribute("data-in")) || 0;
      const outAttr = el.getAttribute("data-out");
      const outP = outAttr == null ? 1 : parseFloat(outAttr);
      let opacity;
      const fade = 0.08;
      if (progress < inP) {
        opacity = 0;
      } else if (progress < inP + fade) {
        opacity = (progress - inP) / fade;
      } else if (progress < outP - fade) {
        opacity = 1;
      } else if (progress < outP) {
        opacity = (outP - progress) / fade;
      } else {
        opacity = 0;
      }
      el.style.opacity = opacity.toFixed(3);
      // subtle rise as it enters
      const y = (1 - Math.min(opacity, 1)) * 24;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    });
  }

  // ---- Generic scroll-reveal for non-scrub sections ----
  function setupReveals() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ---- Main loop ----
  function tick(time) {
    if (lenis) lenis.raf(time);
    for (const stage of stages) {
      const p = sectionProgress(stage.outer);
      if (stage.isRender) {
        drawRender(stage, p);
      } else {
        const idx = Math.min(
          stage.frameCount - 1,
          Math.max(0, Math.round(p * (stage.frameCount - 1)))
        );
        drawFrame(stage, idx);
      }
      updateOverlays(stage, p);
    }
    requestAnimationFrame(tick);
  }

  function init() {
    for (const cfg of sections) {
      const stage = setupStage(cfg);
      if (stage) stages.push(stage);
    }
    stages.forEach(resizeCanvas);
    setupReveals();

    window.addEventListener("resize", () => stages.forEach(resizeCanvas), {
      passive: true,
    });

    requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
