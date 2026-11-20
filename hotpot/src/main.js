// ---------------------------------------------------------------------------
// Compositor + player API
// ---------------------------------------------------------------------------
function render(ctx, t) {
  initTextures(); t = clamp(t, 0, DUR - 1e-4);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const s = shotAt(t); (SCENES[s.scene] || (() => {}))(ctx, t, s);
  // dissolves between shots where the cue list asks for one
  const prev = SHOTS[SHOTS.indexOf(s) - 1];
  if (prev && s.xf && t - s.t < s.xf) {
    const b = getBuf('xf'), g = b.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
    (SCENES[prev.scene])(g, s.t - 1e-3, prev);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - ease((t - s.t) / s.xf); ctx.drawImage(b, 0, 0); ctx.globalAlpha = 1;
  }
  drawEndCard(ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .22; ctx.drawImage(TEX.paper, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const fin = 1 - smooth(0, .8, t); if (fin > 0) { ctx.fillStyle = `rgba(247,236,216,${fin})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
const BUFS = {}; function getBuf(k) { if (!BUFS[k]) BUFS[k] = mkCanvas(W, H); return BUFS[k]; }
function drawEndCard(ctx, t) {
  const c = ACT['endcard']; if (!c || t < c.t) return; const a = ease((t - c.t) / .8);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save();
  ctx.fillStyle = `rgba(20,24,52,${.45 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a; ctx.font = '700 64px "TitleTC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const y = 900; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(60,30,10,.55)'; ctx.lineWidth = 10; ctx.strokeText(END_CARD, W / 2, y);
  ctx.fillStyle = '#fff4dc'; ctx.fillText(END_CARD, W / 2, y);
  drawGinkgo(ctx, W / 2, y + 80, 34, Math.PI, '#f2c03a', {});
  ctx.restore();
}
const FILM = {
  ready: false,
  async init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    await loadImages(ASSETS.images);
    const f = new FontFace('TitleTC', `url(${ASSETS.font})`, { weight: '700' }); await f.load(); document.fonts.add(f);
    initTextures(); if (typeof buildScenes === 'function') buildScenes();
    this.ready = true;
  },
  frame(t) { render(this.ctx, t); },
  frameJPEG(i, q = .93) { render(this.ctx, i / FPS); return this.canvas.toDataURL('image/jpeg', q).split(',')[1]; },
  lineup(mode = 0) {
    const ctx = this.ctx; initTextures(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#f7ecd8'; ctx.fillRect(0, 0, W, H);
    const ex = [{ eye: { open: 1 }, mouth: { shape: 'smile' } }, { eye: { open: .35, ly: .3 }, mouth: { shape: 'flat' } }, { eye: { open: 1, style: 'wide' }, mouth: { shape: 'o', open: 1 } }, { eye: { style: 'happy' }, mouth: { shape: 'open', open: .8 } }][mode];
    const row = (y, list) => list.forEach(([name, x, extra]) => RIG[name](ctx, { x, y, k: .95, ...ex, ...(extra || {}) }));
    row(560, [['wu', 190, { cape: 'on' }], ['gui', 540], ['qi', 860]]);
    row(1100, [['shan', 170], ['zao', 540], ['di', 880, { h: 185 }]]);
    row(1640, [['qi2', 180], ['ma', 520], ['dou', 870, { blanket: 0, hands: { L: [-60, -48], R: [56, -48] } }]]);
  },
};
