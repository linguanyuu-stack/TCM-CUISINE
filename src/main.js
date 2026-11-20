// ---------------------------------------------------------------------------
// Compositor: render(t) → canvas. Cuts come from the cue list; shots are joined
// by a short dissolve carried by a passing ginkgo leaf or steam.
// ---------------------------------------------------------------------------
const SCENES = { picnic: renderPicnic, creek: renderCreek, path: renderPath, stones: renderStones };
const XF = 0.42; // dissolve length (s) at cuts
function renderScene(ctx, t) {
  const s = shotAt(t); const fn = SCENES[s.scene] || renderPicnic;
  fn(ctx, t);
}
function render(ctx, t) {
  initTextures();
  t = clamp(t, 0, DUR - 1e-4);
  ctx.save();
  renderScene(ctx, t);
  // dissolve from the previous shot when the scene changes
  const s = shotAt(t), prev = SHOTS[SHOTS.indexOf(s) - 1];
  if (prev && t - s.t < XF && prev.scene !== s.scene) {
    const b = getBuf('xf'), g = b.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
    (SCENES[prev.scene] || renderPicnic)(g, s.t - 1e-3 + 0 * (t - s.t)); // hold last frame of previous shot
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - ease((t - s.t) / XF); ctx.drawImage(b, 0, 0); ctx.globalAlpha = 1;
  }
  // 07 → 08 is one continuous move; 04 → 05 dissolves through steam
  if (t > 27.6 && t < 28.45) { ctx.setTransform(1, 0, 0, 1, 0, 0); const a = hump((t - 27.6) / .85) * .55; const g = ctx.createRadialGradient(W / 2, H * .55, 50, W / 2, H * .55, 900); g.addColorStop(0, `rgba(255,252,244,${a})`); g.addColorStop(1, `rgba(255,252,244,${a * .4})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  // a foreground ginkgo leaf sweeps across the early cuts
  for (const id of ['x.leaf1', 'x.leaf2', 'x.leaf3']) {
    const p = prog(id, t); if (p <= 0 || p >= 1) continue;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const x = lerp(-260, W + 260, easeIn(p) * .4 + p * .6), y = lerp(260, 1500, p) + Math.sin(p * 7) * 90;
    ctx.save(); ctx.filter = 'blur(3px)'; drawGinkgo(ctx, x, y, 520, p * 2.2 - .8, '#f3c33d', { squash: .55 + .45 * Math.abs(Math.cos(p * 5)) }); ctx.restore();
  }
  // title (separate text layer)
  drawTitle(ctx, t);
  // paper grain + vignette over everything
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .24; ctx.drawImage(TEX.paper, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // fade in from paper / to paper at the very ends
  const fin = 1 - smooth(0, .8, t), fout = smooth(ACT.end.t, DUR, t) * 0;
  if (fin > 0) { ctx.fillStyle = `rgba(247,236,216,${fin})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
function drawTitle(ctx, t) {
  const p = prog('title', t); if (p <= 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const a = ease(p), y = 470 - (1 - a) * 14;
  ctx.save(); ctx.globalAlpha = a;
  // soft cream wash behind the words
  const g = ctx.createRadialGradient(W / 2, y, 30, W / 2, y, 520); g.addColorStop(0, 'rgba(252,246,232,.82)'); g.addColorStop(.55, 'rgba(252,246,232,.55)'); g.addColorStop(1, 'rgba(252,246,232,0)');
  ctx.fillStyle = g; ctx.save(); ctx.translate(W / 2, y); ctx.scale(1, .3); ctx.beginPath(); ctx.arc(0, 0, 520, 0, 7); ctx.restore(); ctx.fill();
  ctx.font = '700 66px "TitleTC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,250,238,.95)'; ctx.lineWidth = 12; ctx.strokeText(TITLE, W / 2, y);
  ctx.fillStyle = '#6b3415'; ctx.fillText(TITLE, W / 2, y);
  // small ginkgo ornament
  drawGinkgo(ctx, W / 2, y + 74, 30, Math.PI, '#e9b13a', {});
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Player + export API
// ---------------------------------------------------------------------------
const FILM = {
  ready: false, canvas: null, ctx: null,
  async init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    await loadImages(ASSETS.images);
    const f = new FontFace('TitleTC', `url(${ASSETS.font})`, { weight: '700' }); await f.load(); document.fonts.add(f);
    initTextures(); buildPicnicLayers(); if (typeof buildEarlyLayers === 'function') buildEarlyLayers();
    this.ready = true;
  },
  frame(t) { render(this.ctx, t); },
  frameJPEG(i, q = .93) { render(this.ctx, i / FPS); return this.canvas.toDataURL('image/jpeg', q).split(',')[1]; },
};
