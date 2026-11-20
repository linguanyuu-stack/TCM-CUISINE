// ---------------------------------------------------------------------------
// Characters. Eight are cut directly from the supplied character sheets
// (embedded sprites). 烏烏's right arm is a separate articulated limb painted
// with his own body texture. 豆豆 is drawn as vectors to match his sheet so
// that the blanket and the two-hand bowl pickup can really be animated.
// ---------------------------------------------------------------------------
const IMG = {};
const SPR = {
  // ax = horizontal anchor (fraction of width) of the feet; heights are in sprite px
  shan: { ax: .5 }, shan2: { ax: .5 }, zao_cup: { ax: .5 }, zao_wave: { ax: .5 }, zao_pour: { ax: .45 },
  di_sleep: { ax: .5 }, di_stretch: { ax: .5 }, di_yawn: { ax: .5 }, gui_cup: { ax: .48 },
  ma_cheer: { ax: .52 }, ma_sit: { ax: .5 }, ma_sleep: { ax: .5 }, qi_run: { ax: .55 }, qi_jump: { ax: .5 },
  qi2_stir: { ax: .4 }, qi2_tray: { ax: .45 }, wu_body: { ax: .5 }, wu_orig: { ax: .5 },
};
function loadImages(srcs) {
  return Promise.all(Object.entries(srcs).map(([k, src]) => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = rej; im.src = src;
  })));
}
function groundShadow(ctx, x, y, w, a = .26) {
  ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, w * .55);
  g.addColorStop(0, `rgba(90,50,20,${a})`); g.addColorStop(1, 'rgba(90,50,20,0)');
  ctx.fillStyle = g; ctx.scale(1, .22); ctx.beginPath(); ctx.arc(x, y / .22, w * .55, 0, 7); ctx.fill(); ctx.restore();
}
// draw a sprite with feet at (x,y), total height h (world units)
function drawSprite(ctx, name, x, y, h, o = {}) {
  const im = IMG[name]; if (!im) return;
  const k = h / im.height, w = im.width * k, ax = (SPR[name] || {}).ax || .5;
  if (o.shadow !== false) groundShadow(ctx, x + (o.shx || 0), y + 2, w * (o.shw || .75), o.sha == null ? .28 : o.sha);
  ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.translate(x, y - (o.lift || 0));
  if (o.pivotX) ctx.translate(o.pivotX, 0);
  ctx.rotate(o.rot || 0);
  if (o.pivotX) ctx.translate(-o.pivotX, 0);
  ctx.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
  ctx.drawImage(im, -ax * w, -h, w, h);
  ctx.restore();
}

// ---- 烏烏 with an articulated right arm --------------------------------------
let WU_PAT = null;
function wuPattern(ctx) {
  if (!WU_PAT) { const c = mkCanvas(IMG.wu_tex.width, IMG.wu_tex.height); c.getContext('2d').drawImage(IMG.wu_tex, 0, 0); WU_PAT = c; }
  return ctx.createPattern(WU_PAT, 'repeat');
}
// pose: {arm: radians (−0.6 = raised as on the sheet), len: stretch, lean, sq, lift, hold:fn(ctx) at fist}
function drawWu(ctx, x, y, h, pose = {}) {
  const im = IMG.wu_body, k = h / im.height, w = im.width * k;
  groundShadow(ctx, x, y + 2, w * .8, .3);
  ctx.save();
  ctx.translate(x, y - (pose.lift || 0));
  ctx.rotate(pose.lean || 0);
  ctx.scale(k * (1 + (pose.sq || 0) * .5), k * (1 - (pose.sq || 0)));
  ctx.drawImage(im, -im.width / 2, -im.height);
  // arm (sprite pixel units). pivot = shoulder under the cape
  const px = 308 - im.width / 2, py = 176 - im.height;
  const ang = pose.arm == null ? -0.6 : pose.arm, L = 41 * (pose.len || 1);
  ctx.translate(px, py); ctx.rotate(ang);
  const P = wuPattern(ctx);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#5a2c12'; ctx.lineWidth = 29; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(L, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(L, 0, 21.5, 0, 7); ctx.fillStyle = '#5a2c12'; ctx.fill();
  ctx.strokeStyle = P; ctx.lineWidth = 23.5; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(L, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(L, 0, 18.5, 0, 7); ctx.fillStyle = P; ctx.fill();
  // soft roundness
  const g = ctx.createRadialGradient(L - 5, -8, 2, L, 0, 20); g.addColorStop(0, 'rgba(255,220,180,.28)'); g.addColorStop(1, 'rgba(60,25,5,.18)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L, 0, 18.5, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(70,30,10,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(L + 4, 3, 8, -0.3, 1.6); ctx.stroke();
  if (pose.hold) { ctx.save(); ctx.translate(L, 0); ctx.rotate(-ang - (pose.lean || 0)); ctx.scale(1 / k, 1 / k); pose.hold(ctx); ctx.restore(); }
  ctx.restore();
}
// world position of 烏烏's fist for a pose (used for contact checks / props)
function wuFist(x, y, h, pose) {
  const im = IMG.wu_body, k = h / im.height, sq = pose.sq || 0;
  const ang = pose.arm == null ? -0.6 : pose.arm, L = 41 * (pose.len || 1);
  let lx = 308 - im.width / 2 + Math.cos(ang) * L, ly = 176 - im.height + Math.sin(ang) * L;
  lx *= k * (1 + sq * .5); ly *= k * (1 - sq);
  const c = Math.cos(pose.lean || 0), s = Math.sin(pose.lean || 0);
  return [x + lx * c - ly * s, y - (pose.lift || 0) + lx * s + ly * c];
}

// ---- 豆豆 (vector) ------------------------------------------------------------
// local units: 1 = body height; origin at the feet (bottom centre)
// st: {lean, sq, lift, blanket:0 clutch..1 lap, eyes:'open'|'happy', mouth:'smile'|'open', walk:phase|null, sit:0..1,
//      hands:[[x,y],[x,y]] (local), blush}
function douBodyPath() { return ell(0, -0.5, 0.445, 0.5, -0.1); }
function drawDouBody(ctx, x, y, h, st) {
  ctx.save();
  groundShadow(ctx, x, y + 2, h * .95, .3);
  ctx.translate(x, y - (st.lift || 0)); ctx.rotate(st.lean || 0);
  const sq = st.sq || 0; ctx.scale(h * (1 + sq * .6), h * (1 - sq));
  const lw = 1 / h;
  // feet
  const sit = st.sit || 0, wp = st.walk;
  for (const s of [-1, 1]) {
    let fx = s * .15, fy = -0.03, lift = 0;
    if (wp != null) { const ph = Math.sin(wp * Math.PI * 2 + (s > 0 ? Math.PI : 0)); lift = Math.max(0, ph) * .06; fx += ph * .03; }
    fy = lerp(fy - lift, 0.0, sit); fx = lerp(fx, s * .2, sit);
    const f = ell(fx, fy, lerp(.085, .1, sit), lerp(.055, .05, sit));
    ctx.fillStyle = '#2b1914'; ctx.fill(f); ctx.strokeStyle = '#140a06'; ctx.lineWidth = 2.6 * lw; ctx.stroke(f);
  }
  // body
  const body = douBodyPath();
  const g = ctx.createRadialGradient(-0.14, -0.74, 0.02, -0.02, -0.5, 0.62);
  g.addColorStop(0, '#6b4636'); g.addColorStop(.45, '#382219'); g.addColorStop(1, '#1d110c');
  ctx.save(); ctx.fillStyle = g; ctx.fill(body); ctx.clip(body);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .25; ctx.fillStyle = pat(ctx, TEX.grain, 1 / h * 1.4); ctx.fillRect(-1, -1.2, 2, 1.4);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // hilum (pale side mark)
  const mk = ell(0.37, -0.56, 0.085, 0.175, 0.12);
  ctx.fillStyle = '#f2e1ba'; ctx.fill(mk); ctx.strokeStyle = '#8b5a2c'; ctx.lineWidth = 2.4 * lw; ctx.stroke(mk);
  ctx.fillStyle = 'rgba(255,250,232,.7)'; ctx.fill(ell(0.355, -0.6, 0.035, 0.1, 0.12));
  // glossy highlight
  ctx.fillStyle = 'rgba(255,240,226,.55)'; ctx.fill(ell(-0.13, -0.88, 0.15, 0.05, -0.38));
  ctx.fillStyle = 'rgba(255,240,226,.35)'; ctx.fill(ell(0.06, -0.94, 0.035, 0.018, -0.1));
  ctx.restore();
  ctx.strokeStyle = '#140a06'; ctx.lineWidth = 3.2 * lw; ctx.stroke(body);
  // face
  const fx = -0.05, fy = -0.5;
  ctx.fillStyle = st.blush ? `rgba(240,112,90,${.85 + .15 * st.blush})` : 'rgba(238,118,94,.85)';
  const cr = 1 + (st.blush || 0) * .15;
  ctx.fill(ell(fx - 0.2, fy + 0.07, 0.06 * cr, 0.038 * cr)); ctx.fill(ell(fx + 0.2, fy + 0.07, 0.06 * cr, 0.038 * cr));
  const happy = st.eyes === 'happy' ? 1 : (st.eyesK || 0);
  for (const s of [-1, 1]) {
    const ex = fx + s * 0.115, ey = fy - 0.02;
    if (happy < .5) {
      ctx.fillStyle = '#120804'; ctx.fill(ell(ex, ey, 0.03, 0.038 * (1 - happy * 1.6)));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 0.009, ey - 0.014, 0.0095, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = '#120804'; ctx.lineWidth = 3.4 * lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(ex, ey + 0.012, 0.03, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
  }
  const mo = st.mouth === 'open' ? 1 : (st.mouthK || 0);
  if (mo > .5) {
    const m = new Path2D(); m.moveTo(fx - 0.04, fy + 0.035); m.quadraticCurveTo(fx, fy + 0.03, fx + 0.04, fy + 0.035); m.quadraticCurveTo(fx + 0.035, fy + 0.1, fx, fy + 0.1); m.quadraticCurveTo(fx - 0.035, fy + 0.1, fx - 0.04, fy + 0.035); m.closePath();
    ctx.fillStyle = '#7a2418'; ctx.fill(m); ctx.save(); ctx.clip(m); ctx.fillStyle = '#ec7b6c'; ctx.fill(ell(fx, fy + 0.1, 0.035, 0.03)); ctx.restore();
    ctx.strokeStyle = '#120804'; ctx.lineWidth = 2.4 * lw; ctx.stroke(m);
  } else {
    ctx.strokeStyle = '#120804'; ctx.lineWidth = 2.8 * lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(fx, fy + 0.02, 0.032, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  }
  // blanket
  if (st.blanket != null) drawDouBlanket(ctx, st.blanket, lw, st);
  ctx.restore();
}
function douBlanketCorners(b) {
  return {
    tl: [lerp(-0.17, -0.3, b), lerp(-0.4, -0.25, b)], tr: [lerp(0.15, 0.28, b), lerp(-0.4, -0.25, b)],
    bl: [lerp(-0.5, -0.44, b), lerp(0.02, 0.03, b)], br: [lerp(0.5, 0.44, b), lerp(0.02, 0.03, b)],
  };
}
function drawDouBlanket(ctx, b, lw, st) {
  const c = douBlanketCorners(b);
  const sag = lerp(0.035, -0.05, b); // top edge: sags between hands → becomes mound over knees
  const p = new Path2D();
  p.moveTo(c.tl[0], c.tl[1]);
  p.quadraticCurveTo(0, c.tl[1] + sag + (b > .5 ? -0.03 : 0), c.tr[0], c.tr[1]);
  p.bezierCurveTo(c.tr[0] + lerp(.12, .07, b), lerp(-0.25, -0.15, b), c.br[0] - 0.02, lerp(-0.1, -0.06, b), c.br[0], c.br[1]);
  const n = 5; // scalloped hem
  for (let i = 1; i <= n; i++) {
    const x0 = lerp(c.br[0], c.bl[0], (i - 1) / n), x1 = lerp(c.br[0], c.bl[0], i / n);
    p.quadraticCurveTo((x0 + x1) / 2, c.br[1] + (i % 2 ? 0.045 : -0.005), x1, c.bl[1] + (i === n ? 0 : 0.01));
  }
  p.bezierCurveTo(c.bl[0] + 0.02, lerp(-0.1, -0.06, b), c.tl[0] - lerp(.12, .07, b), lerp(-0.25, -0.15, b), c.tl[0], c.tl[1]);
  p.closePath();
  const g = ctx.createLinearGradient(0, c.tl[1], 0, 0.05);
  g.addColorStop(0, '#fae6a8'); g.addColorStop(1, '#ebc471');
  ctx.save(); ctx.fillStyle = g; ctx.fill(p); ctx.clip(p);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .18; ctx.fillStyle = pat(ctx, TEX.grain, 1 / 160); ctx.fillRect(-1, -1, 2, 1.2);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .55; ctx.strokeStyle = '#d6a957'; ctx.lineWidth = 3 * lw;
  for (const fxp of [-0.22, 0.02, 0.24]) { ctx.beginPath(); ctx.moveTo(fxp * lerp(.7, 1, b), c.tl[1] + 0.04); ctx.quadraticCurveTo(fxp * 1.3 + 0.03, lerp(-0.15, -0.1, b), fxp * 1.5, 0.02); ctx.stroke(); }
  ctx.globalAlpha = .9; ctx.setLineDash([0.025, 0.018]); ctx.strokeStyle = '#c48f3c'; ctx.lineWidth = 2.2 * lw;
  ctx.beginPath(); ctx.moveTo(c.bl[0] + 0.07, -0.02); ctx.lineTo(c.br[0] - 0.07, -0.02); ctx.stroke(); ctx.setLineDash([]);
  // sprout embroidery
  const sx = 0.02, sy = lerp(-0.13, -0.09, b), s = 0.07;
  ctx.globalAlpha = 1; ctx.strokeStyle = '#6f7f36'; ctx.lineWidth = 2.4 * lw;
  ctx.beginPath(); ctx.moveTo(sx, sy + s * .6); ctx.lineTo(sx, sy - s * .1); ctx.stroke();
  ctx.fillStyle = '#9aab52'; const l1 = ell(sx - s * .38, sy - s * .25, s * .4, s * .2, .5), l2 = ell(sx + s * .38, sy - s * .25, s * .4, s * .2, -.5);
  ctx.fill(l1); ctx.fill(l2); ctx.stroke(l1); ctx.stroke(l2);
  ctx.restore();
  ctx.strokeStyle = '#a8742c'; ctx.lineWidth = 2.8 * lw; ctx.lineJoin = 'round'; ctx.stroke(p);
}
function drawDouHands(ctx, x, y, h, st) {
  const hands = st.hands; if (!hands) return;
  ctx.save(); ctx.translate(x, y - (st.lift || 0)); ctx.rotate(st.lean || 0);
  const sq = st.sq || 0; ctx.scale(h * (1 + sq * .6), h * (1 - sq));
  for (const [hx, hy] of hands) {
    const p = ell(hx, hy, 0.072, 0.066);
    const g = ctx.createRadialGradient(hx - 0.02, hy - 0.025, 0.005, hx, hy, 0.08); g.addColorStop(0, '#5a3a2e'); g.addColorStop(1, '#24140f');
    ctx.fillStyle = g; ctx.fill(p); ctx.strokeStyle = '#120804'; ctx.lineWidth = 2.8 / h; ctx.stroke(p);
  }
  ctx.restore();
}
// convert 豆豆-local coords to world (approx; ignores squash)
function douToWorld(x, y, h, st, lx, ly) {
  const sq = st.sq || 0; lx *= h * (1 + sq * .6); ly *= h * (1 - sq);
  const c = Math.cos(st.lean || 0), s = Math.sin(st.lean || 0);
  return [x + lx * c - ly * s, y - (st.lift || 0) + lx * s + ly * c];
}
function worldToDou(x, y, h, st, wx, wy) {
  const sq = st.sq || 0; let dx = wx - x, dy = wy - (y - (st.lift || 0));
  const c = Math.cos(-(st.lean || 0)), s = Math.sin(-(st.lean || 0));
  const lx = dx * c - dy * s, ly = dx * s + dy * c;
  return [lx / (h * (1 + sq * .6)), ly / (h * (1 - sq))];
}
