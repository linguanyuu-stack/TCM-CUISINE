// ---------------------------------------------------------------------------
// Shots 01, 02, 04, 05, 06, 07
// ---------------------------------------------------------------------------
const HIP = { wu: 62, gui: 42, qi: 26, ma: 50, zao: 46, shan: 36, qi2: 40, dou: 30 };
function setCam(ctx, z, cx, cy) { ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z); }
// 2D walk with planted feet. n = steps walked (float). dir = ±1.
function walkPose(who, P, n, dir, moving, o = {}) {
  const k = P.k, h = HIP[who] * (o.stride || 1), Ls = 2 * h * k, s = n * Ls, g = gait(s, Ls, (o.lift || 24) * k);
  P.x += dir * s;
  const fA = [dir * g.A.dx / k, -g.A.lift / k], fB = [dir * g.B.dx / k, -g.B.lift / k];
  P.feet = dir > 0 ? { R: fA, L: fB } : { L: fA, R: fB };
  if (moving) { P.lift = (P.lift || 0) + g.bob * (o.bob || 7); P.lean = (P.lean || 0) + g.sway * .035 + dir * .04; P.sq = (P.sq || 0) + g.contact * .045; P.armSwing = g.swing * dir; P.sway = g.sway; }
  return P;
}
const face = (open = 1, lx = 0, ly = 0, style = 'n') => ({ open, lx, ly, style });
function idle(P, t, seed, o = {}) { P.sq = (P.sq || 0) + .012 * Math.sin(t * 2 + seed); P.eye = P.eye || face(); if (P.eye.style !== 'happy' && P.eye.style !== 'closed') P.eye.open = (P.eye.open == null ? 1 : P.eye.open) * (1 - blinkAt(t, seed)); P.tt = t; return P; }

// ---- generic painters -------------------------------------------------------------
function paintSky(g, y0, y1, cols) { const gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); g.fillStyle = gr; g.fillRect(-400, y0, W + 800, y1 - y0); }
function paintClouds(g, n, y0, y1, seed, a = .5) { const r = mulberry32(seed); for (let i = 0; i < n; i++) { g.globalAlpha = a; g.fillStyle = '#fffaf0'; g.fill(blob(r() * W, y0 + r() * (y1 - y0), 90 + r() * 120, 18 + r() * 16, r, .25)); } g.globalAlpha = 1; }
function paintRidge(g, y0, amp, col, sd, x0 = -400, x1 = W + 400, yb = 2400) { const p = new Path2D(); p.moveTo(x0, yb); for (let x = x0; x <= x1; x += 30) p.lineTo(x, y0 + Math.sin(x * .005 + sd) * amp + Math.sin(x * .013 + sd * 3) * amp * .4); p.lineTo(x1, yb); p.closePath(); wc(g, p, col, { grain: .2, bloom: .18, edge: shade(col, -.15), edgeW: 6, edgeA: .3 }); }
function paintTrees(g, y0, y1, n, seed, sc = 1, x0 = -100, x1 = W + 100) { const r = mulberry32(seed), tc = ['#e9b84a', '#dd8f3c', '#f1cd62', '#c8a24a', '#b8b25a', '#e7a03e', '#f3d27a']; for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rr = (30 + r() * 50) * sc; g.fillStyle = '#6a5030'; g.fillRect(x - 3 * sc, y, 6 * sc, rr * .8); wc(g, blob(x, y, rr, rr * .85, r, .2, 10), tc[Math.floor(r() * tc.length)], { grain: .3, edge: '#9a6a2a', edgeW: 3, edgeA: .3 }); } }
function paintCanopy(g, cx, cy, rx, ry, n, seed, sz = 1) { const r = mulberry32(seed); for (let i = 0; i < 8; i++) { g.globalAlpha = .5; wc(g, blob(cx + (r() - .5) * rx * 1.3, cy + (r() - .5) * ry * 1.1, rx * (.35 + r() * .3), ry * (.3 + r() * .3), r, .25), ['#f0c64a', '#e8b13a', '#f6d870'][i % 3], { grain: .3 }); } g.globalAlpha = 1; for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()); drawGinkgo(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, (20 + r() * 16) * sz, r() * 6.28, ['#f4c63c', '#f8d867', '#e9a92c', '#f1bb35', '#fbe28a'][Math.floor(r() * 5)], { detail: r() < .4 }); } }
function paintLake(g, y0, y1, seed, cols = ['#8fbcd2', '#6a9fbe']) { const r = mulberry32(seed), p = new Path2D(); p.rect(-400, y0, W + 800, y1 - y0); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); wc(g, p, gr, { grain: .2, bloom: .15 }); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = r() * W, y = y0 + r() * (y1 - y0); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 50, y); g.stroke(); } }
function paintGround(g, y0, y1, seed, cols = ['#c3c27a', '#9fae5a'], n = 900) { const r = mulberry32(seed), p = new Path2D(); p.rect(-400, y0, W + 800, y1 - y0); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); wc(g, p, gr, { grain: .25, bloom: .2 }); for (let i = 0; i < n; i++) { const x = -100 + r() * (W + 200), y = y0 + r() * (y1 - y0), d = (y - y0) / (y1 - y0); grassBlade(g, x, y, 6 + d * 26, (r() - .5) * 10, 1 + d * 2, ['#8c9e4c', '#b6b864', '#7b8e40', '#c7b85a'][i % 4]); } for (let i = 0; i < n / 20; i++) flower5(g, r() * W, y0 + 20 + r() * (y1 - y0 - 20), 4 + r() * 6, r() < .7 ? '#fffaf0' : '#f2a49a', '#f2b33a', 'rgba(150,120,70,.6)', r() * 6); for (let i = 0; i < n / 25; i++) drawGinkgo(g, r() * W, y0 + 10 + r() * (y1 - y0), 12 + r() * 12, r() * 6.28, PAL.gold, { squash: .55 }); }
function quiltQuad(g, y0, y1, xl0, xr0, xl1, xr1, R, C, seed) {
  const tiles = quiltTiles2(); const order = ['cream', 'pink', 'green', 'rose', 'red', 'butter'];
  const P = (u, v) => { const y = lerp(y0, y1, v); return [lerp(lerp(xl0, xl1, v), lerp(xr0, xr1, v), u), y]; };
  const r = mulberry32(seed);
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
    const a = P(j / C, i / R), b = P((j + 1) / C, i / R), c = P((j + 1) / C, (i + 1) / R), d = P(j / C, (i + 1) / R);
    const q = new Path2D(); q.moveTo(...a); q.lineTo(...b); q.lineTo(...c); q.lineTo(...d); q.closePath();
    g.save(); g.clip(q); const p = g.createPattern(tiles[order[Math.floor(r() * order.length)]], 'repeat'); p.setTransform(new DOMMatrix([(b[0] - a[0]) / 150, (b[1] - a[1]) / 150, (d[0] - a[0]) / 150, (d[1] - a[1]) / 150, a[0], a[1]])); g.fillStyle = p; g.fill(q);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .2; g.fillStyle = pat(g, TEX.grain, 1.2); g.fill(q); g.restore();
    g.save(); g.strokeStyle = 'rgba(140,80,60,.35)'; g.lineWidth = 2; g.stroke(q); g.restore();
  }
  const o = new Path2D(); o.moveTo(...P(0, 0)); o.lineTo(...P(1, 0)); o.lineTo(...P(1, 1)); o.lineTo(...P(0, 1)); o.closePath();
  g.save(); g.strokeStyle = '#d98d86'; g.lineWidth = 10; g.stroke(o); g.strokeStyle = PAL.sienna; g.lineWidth = 2.4; g.globalAlpha = .7; g.stroke(o); g.restore();
}
let QT = null;
function quiltTiles2() {
  if (QT) return QT; QT = {}; const S = 96;
  const mk = (n, fn) => { const c = mkCanvas(S, S), g = c.getContext('2d'); fn(g); QT[n] = c; };
  const ging = (g, base, stripe, n) => { g.fillStyle = base; g.fillRect(0, 0, S, S); g.fillStyle = stripe; g.globalAlpha = .45; for (let i = 0; i < n; i++) { g.fillRect(i * S / n, 0, S / n / 2, S); g.fillRect(0, i * S / n, S, S / n / 2); } g.globalAlpha = 1; };
  const floral = (g, base, petal, seed) => { g.fillStyle = base; g.fillRect(0, 0, S, S); const r = mulberry32(seed); for (let i = 0; i < 9; i++) { const x = (i % 3) * 32 + 16, y = Math.floor(i / 3) * 32 + 16; flower5(g, x, y, 8, petal, '#f2b33a', 'rgba(170,90,70,.6)', r()); } };
  mk('pink', g => ging(g, '#f6dcd6', '#e59c96', 6)); mk('red', g => ging(g, '#f3d2cc', '#d8726c', 8)); mk('green', g => ging(g, '#e7ebcd', '#a4b67a', 6));
  mk('cream', g => { floral(g, '#f8eedb', '#ef9b92', 3); drawGinkgo(g, 48, 70, 30, 0, '#f0b833', { detail: false }); });
  mk('rose', g => floral(g, '#f1c6be', '#fff3e6', 8)); mk('butter', g => { g.fillStyle = '#f6e3b4'; g.fillRect(0, 0, S, S); drawGinkgo(g, 48, 72, 40, 0, '#eeb02e', {}); });
  return QT;
}
function drawBellRing(ctx, x, y, a, t) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(Math.sin(t * 40) * .25 * a);
  const b = new Path2D(); b.moveTo(-26, 20); b.quadraticCurveTo(-24, -30, 0, -32); b.quadraticCurveTo(24, -30, 26, 20); b.lineTo(32, 26); b.lineTo(-32, 26); b.closePath(); wc(ctx, b, '#f2c14e', { out: INK, outW: 3 });
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 32, 7, 0, 7); ctx.fill(); ctx.restore(); drawSparkle(ctx, x - 50, y - 10, 1.1, a, '#f2b33a', -.6); drawSparkle(ctx, x + 50, y - 10, 1.1, a, '#f2b33a', .6); }

// ===================== 01 / 02 · BEDROOM =========================================
function buildBedroom() {
  return cached('bedroom', W, H, g => {
    plaster(g, 0, 0, W, 1760, '#f4dcb0', '#e9c896', 3);
    for (const x of [0, 1030]) { const p = new Path2D(); p.rect(x, 0, 50, 1760); wc(g, p, '#8a5a34', { grain: .35, out: INK, outW: 2.5 }); }
    const bm = new Path2D(); bm.rect(0, 0, W, 56); wc(g, bm, '#8a5a34', { grain: .35, out: INK, outW: 2.5 });
    // arched window with ginkgo outside
    const win = new Path2D(); win.moveTo(100, 700); win.lineTo(100, 330); win.quadraticCurveTo(100, 170, 270, 170); win.quadraticCurveTo(440, 170, 440, 330); win.lineTo(440, 700); win.closePath();
    g.save(); g.clip(win); paintSky(g, 160, 700, ['#ffe0a8', '#fbe9c8', '#f6e6c4']); paintCanopy(g, 230, 300, 230, 170, 160, 51); g.restore();
    wc(g, win, 'rgba(0,0,0,0)', { grain: 0, out: INK, outW: 3 });
    g.strokeStyle = '#7a4e2c'; g.lineWidth = 14; g.stroke(win); g.lineWidth = 8; g.beginPath(); g.moveTo(270, 175); g.lineTo(270, 700); g.moveTo(100, 440); g.lineTo(440, 440); g.stroke();
    const sill = new Path2D(); sill.rect(80, 700, 380, 26); wc(g, sill, '#8a5a34', { out: INK, outW: 2.5 });
    const vase = new Path2D(); vase.ellipse(170, 670, 30, 32, 0, 0, 7); wc(g, vase, '#f3e8d2', { out: INK, outW: 2 }); for (let i = 0; i < 6; i++) flower5(g, 150 + i * 9, 600 + (i % 2) * 12, 13, '#f6c14a', '#e07a3a', '#b07a2a');
    drawCalendar(g, 790, 520, 330, 1);
    // headboard
    const hb = new Path2D(); hb.moveTo(140, 1240); hb.lineTo(140, 900); hb.quadraticCurveTo(540, 780, 940, 900); hb.lineTo(940, 1240); hb.closePath(); wc(g, hb, '#9a6a3e', { grain: .35, edge: '#5a3518', edgeW: 4, out: INK, outW: 3 });
    for (const x of [120, 960]) { const p = new Path2D(); p.roundRect(x - 24, 860, 48, 900, 12); wc(g, p, '#8a5a34', { grain: .35, out: INK, outW: 3 }); const k = new Path2D(); k.arc(x, 850, 26, 0, 7); wc(g, k, '#8a5a34', { out: INK, outW: 3 }); }
    const pil = new Path2D(); pil.moveTo(220, 1260); pil.bezierCurveTo(210, 1090, 600, 1080, 640, 1150); pil.bezierCurveTo(660, 1260, 300, 1300, 220, 1260); wc(g, pil, '#f7efe2', { grain: .15, edge: '#cdbfa8', edgeW: 4, out: INK, outW: 2.5 });
    // nightstand, lantern lamp, books, doily
    const ns = new Path2D(); ns.rect(-20, 1300, 210, 460); wc(g, ns, '#8a5a34', { grain: .35, out: INK, outW: 3 });
    g.save(); g.translate(90, 1300); g.scale(1, .35); g.fillStyle = '#fbf3e4'; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.fill(); g.restore();
    const bk = new Path2D(); bk.rect(40, 1240, 120, 34); wc(g, bk, '#a8463e', { out: INK, outW: 2 }); const bk2 = new Path2D(); bk2.rect(50, 1210, 100, 30); wc(g, bk2, '#c98a3a', { out: INK, outW: 2 });
    const fl = new Path2D(); fl.rect(-50, 1760, W + 100, 200); wc(g, fl, '#a8744a', { grain: .3 });
  });
}
// the quilt is cloth draped over 烏烏: its top edge passes through points on his body
function quiltCloth(ctx, top) {
  const pts = [[60, 1470], ...top, [1020, 1470]];
  const p = new Path2D(); p.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; p.bezierCurveTo(a[0] + (b[0] - a[0]) * .5, a[1], a[0] + (b[0] - a[0]) * .5, b[1], b[0], b[1]); }
  p.lineTo(1040, 1790); p.lineTo(40, 1790); p.closePath();
  ctx.save(); ctx.clip(p); const tiles = quiltTiles2();
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) { const x = 40 + i * 145, y = 1000 + j * 175; const pt = ctx.createPattern(tiles[['red', 'cream', 'pink', 'butter', 'red', 'cream', 'pink'][(i + j) % 7]], 'repeat'); pt.setTransform(new DOMMatrix().translateSelf(x, y).scaleSelf(1.51, 1.82)); ctx.fillStyle = pt; ctx.fillRect(x, y, 145, 175); ctx.strokeStyle = 'rgba(255,248,236,.8)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeRect(x + 8, y + 8, 129, 159); ctx.setLineDash([]); }
  // soft folds that follow the edge, and shading under the hem
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(150,90,60,.35)'; ctx.lineWidth = 16;
  for (const k of [1, 2, 3]) { const a = pts[k], b = pts[k + 1] || pts[k]; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 30); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 160, (a[0] + b[0]) / 2 + 20, 1700); ctx.stroke(); }
  const sh = ctx.createLinearGradient(0, 1300, 0, 1500); sh.addColorStop(0, 'rgba(140,90,60,.25)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 1200, W, 400);
  ctx.globalAlpha = .2; ctx.fillStyle = pat(ctx, TEX.grain, 1); ctx.fill(p); ctx.restore();
  ink(ctx, p, 3.2);
}
function wuInBed(t) {
  let breath = 0; for (let i = 0; i < 4; i++) { const c = ACT['snore' + i], d = t - c.t; if (d >= 0 && d < 2.8) breath = d < 1.2 ? Math.sin(Math.PI / 2 * d / 1.2) : Math.cos(Math.PI / 2 * clamp((d - 1.35) / 1.2)); }
  if (t > 12.4) breath = .5 + .5 * Math.sin(t * 2.2);
  const antic = t > 13.42 && t < 13.6 ? hump((t - 13.42) / .18) : 0;           // anticipation squash
  const jolt = easeOutBack(prog('jolt', t)), up = prog('getup', t);
  const hop = clamp((up - .2) / .8), hx = ease(hop), hy = hump(hop);
  const P = { x: 540 + hx * 470, y: 1400 + 30 * (1 - jolt) + hx * 90, k: 1.15, cape: 'off' };
  P.lean = lerp(-.32, .02, jolt) + hy * .18; P.lift = jolt * 40 + hy * 150 - hx * 40; P.sq = breath * -.03 * (1 - jolt) + antic * .08 + .012 * Math.sin(t * 2.2) * jolt - hump(clamp((up - .05) / .2)) * -.07;
  const awake = jolt > 0 || antic > 0;
  const look = track([[13.6, [0, -.3]], [15.6, [0, -.3]], [16.0, [.85, 0]], [17.4, [.85, 0]], [17.7, [.9, .3]]], t);
  P.eye = awake ? { open: 1 - hump(prog('blink02', t)), style: t < 15.0 ? 'wide' : 'n', wide: 1 - smooth(14, 15, t), lx: look[0], ly: look[1] } : { style: 'closed' };
  P.mouth = awake ? (t < 15 ? { shape: 'o', open: lerp(1, .5, smooth(14, 15, t)) } : { shape: 'flat' }) : { shape: 'snore', open: breath * .8 + .1 };
  if (up > 0) { P.mouth = { shape: 'o', open: .5 }; P.eye.style = 'wide'; P.eye.wide = .6; }
  P.blush = awake ? 0 : .3;
  P.leaf = spring(t, 13.93, .55, 10, 3.5) + spring(t, 16.45, .2, 10, 4) + spring(t, ACT.getup.t + .3, -.3) + (awake ? 0 : breath * .05);
  // the quilt: lies over his chest, slides to his lap a beat after he sits up, then is thrown off
  const slip = easeOutBack(prog('quiltslip', t)), yq = lerp(-118, -42, slip);
  const release = ease(clamp((up - .05) / .35));
  const onBody = [toWorld(P, -162, yq + 14), toWorld(P, -70, yq - 10), toWorld(P, 70, yq - 10), toWorld(P, 162, yq + 14)];
  const flat = [[330, 1452], [480, 1442], [620, 1444], [760, 1456]];
  const top = onBody.map((q, i) => [lerp(q[0], flat[i][0], release), lerp(q[1], flat[i][1], release)]);
  P.quiltTop = top;
  // hands: resting on the quilt edge asleep; pushing on it as he sits up; free when he hops out
  if (!awake) P.hands = { L: [-120, yq - 6 + breath * 4], R: [120, yq - 6 + breath * 4] };
  else if (up <= 0) P.hands = { L: [-150, lerp(yq - 6, -64, jolt)], R: [150, lerp(yq - 6, -64, jolt)] };
  else P.hands = { L: [-150, -130], R: [160, -150] };
  P.breath = breath; return P;
}
function renderBed(ctx, t, close) {
  if (!close) { const c = ease(prog('cal.push', t)); setCam(ctx, lerp(1.3, 1.8, c), lerp(540, 790, c), lerp(1175, 560, c)); }
  else { const shake = spring(t, 13.55, 6, 30, 8); setCam(ctx, 1.5, 560 + shake, 1260); }
  ctx.drawImage(buildBedroom(), 0, 0);
  if (!close) { const gl = hump(clamp((t - 9.6) / 2)); if (gl > 0) drawSparkle(ctx, 880, 470, 1.2, gl, '#f2b33a', .3); }
  drawLanternOn(ctx, 110, 1210, .9, 1, t);
  const P = wuInBed(t), M = ctx.getTransform();
  P.layer = g => { g.save(); g.setTransform(M); quiltCloth(g, P.quiltTop); g.restore(); };
  RIG.wu(ctx, P);
  if (!(prog('jolt', t) > 0) && t < 13.4) zzz(ctx, P.x + 140, P.y - 330, 1.3, t);
  if (close) { drawBellRing(ctx, 920, 1000, hump(prog('bell', t)), t); drawBellRing(ctx, 920, 1000, hump(prog('bell2', t)) * .8, t); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
SCENES.bed = (ctx, t) => renderBed(ctx, t, false);
SCENES.bed2 = (ctx, t) => renderBed(ctx, t, true);

// ===================== 04 · HALL: cape, clasp, shoe =============================
function buildHall() {
  return cached('hall', W, H, g => {
    plaster(g, 0, 0, W, 1520, '#f4dcb0', '#e8c590', 5);
    const win = new Path2D(); win.moveTo(90, 820); win.lineTo(90, 420); win.quadraticCurveTo(90, 250, 260, 250); win.quadraticCurveTo(430, 250, 430, 420); win.lineTo(430, 820); win.closePath();
    g.save(); g.clip(win); paintSky(g, 240, 820, ['#cfe4ec', '#f5ecd2']); paintCanopy(g, 260, 380, 220, 150, 120, 61); g.restore(); g.strokeStyle = '#7a4e2c'; g.lineWidth = 14; g.stroke(win); g.lineWidth = 8; g.beginPath(); g.moveTo(260, 255); g.lineTo(260, 820); g.stroke();
    // dried herbs hanging from a beam
    const bm = new Path2D(); bm.rect(0, 120, W, 40); wc(g, bm, '#8a5a34', { out: INK, outW: 2.5 });
    const r = mulberry32(62);
    for (let i = 0; i < 5; i++) { const x = 520 + i * 60; g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 160); g.lineTo(x, 200); g.stroke(); for (let j = 0; j < 14; j++) { const a = (r() - .5) * .8; g.strokeStyle = ['#7f8f3a', '#a08ab0', '#c9a24a'][i % 3]; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 200); g.lineTo(x + Math.sin(a) * 60, 200 + Math.cos(a) * 110); g.stroke(); } }
    // shelf with jars
    const sh = new Path2D(); sh.rect(760, 560, 300, 18); wc(g, sh, '#7a4e2c', { out: INK, outW: 2.5 });
    for (let i = 0; i < 3; i++) { const j = new Path2D(); j.roundRect(790 + i * 90, 470, 64, 90, 14); wc(g, j, ['#e9e2d0', '#d6e2e4', '#f2e2c8'][i], { out: INK, outW: 2.2 }); flower5(g, 822 + i * 90, 520, 10, '#f0b440', '#c4553e', INK); }
    const fl = new Path2D(); fl.rect(-50, 1520, W + 100, 500); wc(g, fl, '#b47c48', { grain: .3, bloom: .2 }); g.strokeStyle = 'rgba(90,50,20,.4)'; g.lineWidth = 2.5; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-50, 1560 + i * 50 + i * i * 4); g.lineTo(W + 50, 1560 + i * 50 + i * i * 4); g.stroke(); }
    g.save(); g.translate(540, 1720); g.scale(1, .3); for (let rr = 9; rr >= 1; rr--) { g.fillStyle = ['#e9b08f', '#f4e4c8', '#d9907c', '#f0d6a8'][rr % 4]; g.beginPath(); g.arc(0, 0, rr * 44, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,80,50,.35)'; g.lineWidth = 3; g.setLineDash([6, 8]); g.stroke(); } g.setLineDash([]); g.restore();
    g.fillStyle = '#6a4424'; g.fillRect(300, 1255, 120, 14); g.beginPath(); g.arc(362, 1270, 8, 0, 7); g.fill(); g.strokeStyle = '#6a4424'; g.lineWidth = 6; g.beginPath(); g.moveTo(362, 1270); g.quadraticCurveTo(372, 1290, 360, 1296); g.stroke();
  });
}
const HALL = { floor: 1600, k: 1.5, x0: 280, hook: [362, 1290] };
const HALL_LS = 2 * 62 * 1.5;
const HALL_SHOE = [280 + HALL_LS - 62 * 1.5 + 14, 1600 + 40];   // in front of where his left foot comes to rest
function hallWuPose(t) {
  const k = HALL.k, Ls = HALL_LS;
  const P = { x: HALL.x0, y: HALL.floor, k, cape: 'off', shoes: { R: true, L: t >= ACT['c.shoe'].t + .42 } };
  let dir = 1, n = walkN('hall1', t), base = HALL.x0, moving = walkMoving('hall1', t);
  if (t >= WALKS.hall2.keys[0][0]) { base = HALL.x0 + 2 * Ls; dir = -1; n = walkN('hall2', t); moving = walkMoving('hall2', t); }
  if (t >= WALKS.hall3.keys[0][0]) { base = HALL.x0 + Ls; dir = 1; n = walkN('hall3', t); moving = walkMoving('hall3', t); }
  P.x = base; walkPose('wu', P, n, dir, moving);
  const rest = { L: [-146, -82], R: [146, -82] };
  let hL = rest.L, hR = rest.R;
  // 1) reach the hook and grip the cape
  const g = ease(prog('c.grab', t)), hook = toLocal(P, HALL.hook[0], HALL.hook[1] - 14);
  hR = [lerp(rest.R[0], hook[0], g), lerp(rest.R[1], hook[1], g)];
  const gripped = t >= ACT['c.grab'].t + .45;
  // 2) lift it over his head with both hands
  const lf = ease(prog('c.lift', t)), over = { L: [-62, -300], R: [62, -300] };
  if (lf > 0) { hR = [lerp(hook[0], over.R[0], lf), lerp(hook[1], over.R[1], lf)]; hL = [lerp(rest.L[0], over.L[0], lf), lerp(rest.L[1], over.L[1], lf)]; }
  // 3) swing it down over his back
  const dp = prog('c.drape', t), de = ease(dp), shoulder = { L: [-122, -150], R: [122, -150] };
  if (dp > 0) { hR = [lerp(over.R[0], shoulder.R[0], de), lerp(over.R[1], shoulder.R[1], de)]; hL = [lerp(over.L[0], shoulder.L[0], de), lerp(over.L[1], shoulder.L[1], de)]; }
  if (gripped && dp < .5) { P.capeHeld = [lf > .05 || dp > 0 ? hL : [hR[0] - 40, hR[1]], hR]; P.capeDrop = lerp(250, 150, de); P.capeSwing = spring(t, ACT['c.lift'].t + .2, .8, 7, 3) + spring(t, ACT['c.drape'].t + .1, -.6, 7, 3); }
  if (dp >= .5) { P.cape = 'open'; P.capeReveal = lerp(.72, 1, ease((dp - .5) / .5)); P.capeWave = spring(t, ACT['c.drape'].t + .3, 1.2, 8, 3); }
  // 4) bring the collar ends together: one miss, then the click
  const tr = prog('c.try1', t), ck = prog('c.click', t);
  if (tr > 0) { const meet = { L: [-6, -88], R: [40, -88] }, apart = { L: [-60, -72], R: [96, -72] }; const a = tr < .45 ? ease(tr / .45) : 1 - ease((tr - .45) / .55);
    const from = { L: shoulder.L, R: shoulder.R }, to = tr < .45 ? meet : apart; const u = tr < .45 ? a : ease((tr - .45) / .55);
    hL = tr < .45 ? [lerp(from.L[0], meet.L[0] + 18, u), lerp(from.L[1], meet.L[1], u)] : [lerp(meet.L[0] + 18, apart.L[0], u), lerp(meet.L[1], apart.L[1], u)];
    hR = tr < .45 ? [lerp(from.R[0], meet.R[0] - 18, u), lerp(from.R[1], meet.R[1], u)] : [lerp(meet.R[0] - 18, apart.R[0], u), lerp(meet.R[1], apart.R[1], u)]; }
  if (ck > 0) { const u = ease(clamp(ck / .8)); hL = [lerp(-60, 8, u), lerp(-72, -86, u)]; hR = [lerp(96, 44, u), lerp(-72, -86, u)]; }
  const clicked = t >= ACT['c.click'].t + .4;
  if (clicked) { P.cape = 'on'; P.capeReveal = 1; const u = ease(clamp((t - ACT['c.click'].t - .55) / .4)); hL = [lerp(8, rest.L[0], u), lerp(-86, rest.L[1], u)]; hR = [lerp(44, rest.R[0], u), lerp(-86, rest.R[1], u)]; }
  if (P.cape === 'open') { P.capeL = [hL[0] + 8, hL[1] + 4]; P.capeR = [hR[0] - 8, hR[1] + 4]; P.grip = { L: .6, R: .6 }; }
  if (gripped && dp < .5) P.grip = { R: .7, L: lf > .3 ? .7 : 0 };
  P.hands = { L: hL, R: hR };
  if (t >= WALKS.hall1.keys[0][0] && !(moving)) { /* standing */ }
  if (moving) { delete P.hands; }
  // 5) the forgotten slipper: lift, step forward into it, settle back
  const sp = prog('c.shoe', t);
  if (sp > 0 && sp < 1) {
    const s0 = P.feet.L, tgt = toLocal(P, HALL_SHOE[0], HALL_SHOE[1]);
    let f;
    if (sp < .47) { const u = ease(sp / .47); f = [lerp(s0[0], tgt[0], u), lerp(s0[1], tgt[1], u) - Math.sin(Math.PI * u) * 34]; }
    else if (sp < .7) { f = [tgt[0] + Math.sin((sp - .47) * 60) * 3, tgt[1]]; }          // toe wiggle into the shoe
    else { const u = ease((sp - .7) / .3); f = [lerp(tgt[0], s0[0], u), lerp(tgt[1], s0[1], u) - Math.sin(Math.PI * u) * 24]; }
    P.feet.L = f; P.lean = (P.lean || 0) + hump(sp) * .05; P.sq = (P.sq || 0) + (sp > .45 && sp < .55 ? .03 : 0);
  }
  // face
  const fiddling = t > ACT['c.try1'].t - .2 && t < ACT['c.click'].t + .45;
  P.turn = fiddling ? 0 : .15; P.eye = face(fiddling ? .78 : 1, 0, fiddling ? .9 : (lf > 0 && dp < 1 ? -.7 : 0)); P.mouth = fiddling ? { shape: 'flat', wob: 2 } : { shape: 'smile' };
  if (g > 0 && g < 1) P.eye = face(1, .4, -.8);
  if (tr > .42 && tr < 1) { P.mouth = { shape: 'o', open: .45 }; P.eye.style = 'wide'; P.eye.wide = .4; }
  if (clicked && t < ACT['c.click'].t + 1.2) { P.eye = face(1, 0, 0, 'happy'); P.mouth = { shape: 'open', open: .6 }; }
  const nt = prog('c.notice', t); if (nt > 0 && t < ACT['c.shoe'].t + .2) { P.eye = face(1, -.75, .8, nt < .5 ? 'wide' : 'n'); P.eye.wide = .7; P.turn = -.3; P.mouth = { shape: 'o', open: .5 }; }
  if (sp > 0 && sp < 1) { P.eye = face(1, -.4, .9); P.mouth = { shape: 'flat', wob: 2 }; P.turn = -.15; }
  if (t > ACT['c.shoe'].t + .45 && t < ACT['c.exit'].t + 1.0 && sp >= .6) { P.eye = face(1, .3, 0, 'happy'); P.mouth = { shape: 'smile', open: .4 }; }
  P.leaf = spring(t, ACT['c.click'].t + .4, .25) + spring(t, ACT['c.notice'].t, -.3) + spring(t, ACT['c.lift'].t + .3, .2) + (P.sway || 0) * .06;
  idle(P, t, 11);
  return P;
}
SCENES.hall = (ctx, t) => {
  setCam(ctx, 1.45, 480, 1258); ctx.drawImage(buildHall(), 0, 0);
  const gripped = t >= ACT['c.grab'].t + .45;
  // cape hanging on the hook until he lifts it off
  if (!gripped) { const [hx, hy] = HALL.hook; const cp = new Path2D(); cp.moveTo(hx - 24, hy); cp.quadraticCurveTo(hx - 70, hy + 120, hx - 60, hy + 250); cp.quadraticCurveTo(hx, hy + 266, hx + 60, hy + 250); cp.quadraticCurveTo(hx + 70, hy + 120, hx + 24, hy); cp.closePath(); wc(ctx, cp, '#8b3438', { grain: .3, edge: '#5a1c1e', edgeW: 4, out: INK, outW: 3 }); ctx.strokeStyle = '#e2a443'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - 60, hy + 246); ctx.quadraticCurveTo(hx, hy + 262, hx + 60, hy + 246); ctx.stroke(); flower5(ctx, hx + 26, hy + 24, 11, '#f0b440', '#c4553e', INK); }
  const P = hallWuPose(t);
  RIG.wu(ctx, P);
  // the slipper waits on the floor in front of him
  if (!(t >= ACT['c.shoe'].t + .42)) { const [x, y] = HALL_SHOE; const s = new Path2D(); s.moveTo(x - 66, y); s.quadraticCurveTo(x - 66, y - 46, x - 10, y - 44); s.quadraticCurveTo(x + 62, y - 40, x + 66, y); s.quadraticCurveTo(x, y + 10, x - 66, y); wc(ctx, s, '#8e5a32', { grain: .3, out: INK, outW: 3 }); flower5(ctx, x + 6, y - 26, 13, '#f2c14e', '#e07a3a', INK); }
  const ck = prog('c.click', t); if (ck > .75) { const q = toWorld(P, 30, -86); drawSparkle(ctx, q[0] + 30, q[1] - 30, 1.2, hump((ck - .75) / .25 * .5 + .5), '#f2b33a', .2); }
  const nt = prog('c.notice', t); if (nt > 0 && nt < 1) { const q = toWorld(P, -60, -300); drawSparkle(ctx, q[0], q[1], 1.3, hump(nt), '#e8664a', -.4); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ===================== 05 · BUS STOP & INSIDE =====================================
const BUS = { x0: 420, x1: 1260, top: 700, floorY: 1395, stepY: 1480, curb: 1560, doorX0: 440, doorX1: 620, rail: 452 };
function buildBusStop() {
  return cached('busstop', W, H, g => {
    paintSky(g, 0, 1200, ['#b7d6e6', '#e2ece6', '#f4e8cc']); paintClouds(g, 6, 120, 420, 71);
    for (let i = 0; i < 7; i++) { const x = i * 170 - 40, h = 260 + (i % 3) * 90; const b = new Path2D(); b.rect(x, 980 - h, 150, h + 40); wc(g, b, ['#e8d2b4', '#d9c2a2', '#efdcc0'][i % 3], { grain: .25, out: INK, outW: 2, outA: .4 }); g.fillStyle = 'rgba(120,150,170,.45)'; for (let r = 0; r < Math.floor(h / 70); r++) for (let c = 0; c < 3; c++) g.fillRect(x + 18 + c * 44, 1000 - h + r * 70, 24, 34); }
    for (const x of [-60, 300, 700, 1080]) { g.fillStyle = '#6e4a2c'; g.fillRect(x - 10, 700, 20, 340); paintCanopy(g, x, 640, 150, 130, 110, x + 9); }
    const road = new Path2D(); road.rect(-50, 1040, W + 100, 440); wc(g, road, '#9a948a', { grain: .3 });
    const sw = new Path2D(); sw.rect(-50, 1480, W + 100, 520); wc(g, sw, '#d8ccb4', { grain: .3, bloom: .15 });
    g.strokeStyle = 'rgba(120,100,80,.4)'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 100 - 20, 1480); g.lineTo(i * 130 - 200, 1920); g.stroke(); } for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(-50, 1560 + j * 90 + j * j * 10); g.lineTo(W + 50, 1560 + j * 90 + j * j * 10); g.stroke(); }
    const curb = new Path2D(); curb.rect(-50, 1470, W + 100, 22); wc(g, curb, '#bdb19a', { out: INK, outW: 2 });
    // shelter + bench on the left
    const roof = new Path2D(); roof.moveTo(-40, 860); roof.lineTo(330, 830); roof.lineTo(340, 880); roof.lineTo(-40, 910); roof.closePath(); wc(g, roof, '#8a5a34', { out: INK, outW: 3 });
    g.fillStyle = '#6e4a2c'; g.fillRect(290, 870, 18, 640);
    const bench = new Path2D(); bench.rect(20, 1380, 240, 26); wc(g, bench, '#9a6a3e', { out: INK, outW: 2.5 }); g.fillStyle = '#6e4a2c'; g.fillRect(40, 1406, 14, 100); g.fillRect(226, 1406, 14, 100);
    for (let i = 0; i < 14; i++) drawGinkgo(g, 40 + i * 70, 1600 + (i % 3) * 90, 26, i, PAL.gold, { squash: .55 });
  });
}
function drawBus(ctx, x0, y0, s, t, o = {}) { // side view, facing left; (x0,y0) = front-bottom
  ctx.save(); ctx.translate(x0, y0); ctx.scale(s, s);
  const L = 980, Hb = 700, body = new Path2D(); body.roundRect(0, -Hb, L, Hb - 40, 60);
  const gr = ctx.createLinearGradient(0, -Hb, 0, 0); gr.addColorStop(0, '#f8ecd4'); gr.addColorStop(.6, '#f2dfbd'); gr.addColorStop(.62, '#d96a52'); gr.addColorStop(1, '#c95a44');
  wc(ctx, body, gr, { grain: .25, out: INK, outW: 4 });
  ctx.fillStyle = '#e9c873'; ctx.fillRect(0, -Hb + 70, L, 14);
  for (let i = 0; i < 4; i++) { const w = new Path2D(); w.roundRect(240 + i * 180, -Hb + 120, 150, 210, 18); wc(ctx, w, '#a9c9d4', { grain: .15, out: INK, outW: 3 }); for (let k = 0; k < 2; k++) { ctx.fillStyle = 'rgba(80,60,40,.45)'; ctx.beginPath(); ctx.arc(280 + i * 180 + k * 60, -Hb + 300, 26, Math.PI, 0); ctx.fill(); } }
  const fw = new Path2D(); fw.roundRect(10, -Hb + 120, 0 + 30, 210, 10); wc(ctx, fw, '#a9c9d4', { out: INK, outW: 3 });
  drawGinkgo(ctx, 870, -260, 70, 0, '#f0b833', {}); drawGinkgo(ctx, 760, -230, 44, .4, '#f0b833', {});
  for (const wx of [160, 820]) { const wh = new Path2D(); wh.arc(wx, -30, 70, 0, 7); wc(ctx, wh, '#3a3330', { out: INK, outW: 3 }); const hb = new Path2D(); hb.arc(wx, -30, 30, 0, 7); wc(ctx, hb, '#bdb6aa', { out: INK, outW: 2 }); }
  // door
  const dOpen = o.door == null ? 1 : o.door; const dx0 = 30, dw = 170;
  const dp = new Path2D(); dp.rect(dx0, -Hb + 100, dw, Hb - 140);
  ctx.save(); ctx.clip(dp); ctx.fillStyle = '#5a4a3c'; ctx.fillRect(dx0, -Hb, dw, Hb); ctx.fillStyle = 'rgba(220,190,120,.4)'; ctx.fillRect(dx0, -Hb + 100, dw, 60);
  ctx.fillStyle = '#c9b48a'; ctx.fillRect(dx0, -110, dw, 30); ctx.fillStyle = '#a89470'; ctx.fillRect(dx0, -80, dw, 40);
  if (o.inside) o.inside(ctx);
  ctx.restore();
  const leaf = (x, w) => { const p = new Path2D(); p.rect(x, -Hb + 100, w, Hb - 140); wc(ctx, p, '#a9c9d4', { grain: .15, out: INK, outW: 3 }); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x + 8, -Hb + 110, w - 16, Hb - 160); };
  const lw = lerp(dw / 2, 14, dOpen); leaf(dx0, lw); leaf(dx0 + dw - lw, lw);
  ctx.strokeStyle = '#e9b833'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(dx0 + 12 + 6, -Hb + 160); ctx.lineTo(dx0 + 12 + 6, -60); ctx.stroke(); ink(ctx, new Path2D(`M${dx0 + 12} ${-Hb + 160} L${dx0 + 12} -60 M${dx0 + 24} ${-Hb + 160} L${dx0 + 24} -60`), 2);
  ctx.restore();
}
// one ground under every foot: curb → door step → bus floor
const busGround = x => x < 468 ? BUS.curb : x < 560 ? BUS.stepY : BUS.floorY;
function boarder(who, id, x0, k, t, seed) {
  const P = { x: x0, y: BUS.curb, k, cape: 'on', tt: t }; walkPose(who, P, walkN(id, t), 1, walkMoving(id, t), { lift: 30 });
  const fx = f => P.x + P.feet[f][0] * k, gL = busGround(fx('L')), gR = busGround(fx('R'));
  P.y = Math.max(gL, gR) - Math.abs(gL - gR) * .5;              // body sits between the two feet
  for (const f of ['L', 'R']) { const gy = busGround(fx(f)); P.feet[f] = [P.feet[f][0], P.feet[f][1] + (gy - P.y) / k]; }
  P.turn = .45; P.eye = face(1, .6, -.1); P.mouth = { shape: 'smile' }; idle(P, t, seed);
  return P;
}
function busFriends(t) {
  const out = [], k = 1.15;
  const W0 = boarder('wu', 'bus.wu', -460, k, t, 3);
  // 烏烏's hand finds the yellow rail as he climbs (one clear step, one clear grip)
  const rl = ease(prog('b.rail', t)), off = clamp((W0.x - 560) / 60);
  if (rl > 0 && off < 1) { const rail = toLocal(W0, 468, 1320); W0.hands = { R: [lerp(146, rail[0], rl * (1 - off)), lerp(-82, rail[1], rl * (1 - off))], L: [-146, -82] }; W0.grip = { R: .8 * rl * (1 - off) }; }
  out.push(['wu', W0]);
  const G = boarder('gui', 'bus.gui', -430, k * .96, t, 5); out.push(['gui', G]);
  const Q = boarder('qi', 'bus.qi', -500, k * .96, t, 7); Q.hold = { L: (g, hx, hy) => drawCard(g, hx, hy + 20, 56, .3) }; out.push(['qi', Q]);
  return out.map(([w, P]) => [w, P, P.x > 470 ? 'in' : 'out']);
}
SCENES.busstop = (ctx, t) => {
  setCam(ctx, 1, 540, 960); ctx.drawImage(buildBusStop(), 0, 0);
  const door = 1 - ease(prog('b.doors', t)) * 0;
  const F = busFriends(t);
  // inside-the-door figures are clipped into the doorway
  drawBus(ctx, BUS.x0, BUS.stepY + 20, 1, t, { door: 1 - ease(prog('b.doors', t)), inside: g => { g.save(); g.translate(-BUS.x0, -(BUS.stepY + 20)); for (const [w, P, where] of F) if (where === 'in') RIG[w](g, P); g.restore(); } });
  for (const [w, P, where] of F) if (where === 'out') RIG[w](ctx, P);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
function buildBusInside() {
  return cached('businside', W, H, g => {
    plaster(g, 0, 0, W, H, '#efe0c4', '#e4cfa8', 9);
    const fr = new Path2D(); fr.roundRect(70, 260, 940, 760, 40); wc(g, fr, '#d9c29a', { out: INK, outW: 4 });
    g.strokeStyle = '#e9b833'; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 170); g.lineTo(W, 170); g.stroke(); for (let i = 0; i < 4; i++) { g.strokeStyle = '#e9b833'; g.lineWidth = 6; g.beginPath(); g.moveTo(200 + i * 220, 170); g.lineTo(200 + i * 220, 230); g.stroke(); g.beginPath(); g.arc(200 + i * 220, 250, 20, 0, 7); g.stroke(); }
    const seat = new Path2D(); seat.roundRect(40, 1300, 1000, 240, 30); wc(g, seat, '#5f8a86', { grain: .3, out: INK, outW: 3 }); const back = new Path2D(); back.roundRect(40, 1040, 1000, 280, 30); wc(g, back, '#6f9a94', { grain: .3, out: INK, outW: 3 });
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(80 + i * 100, 1060); g.lineTo(80 + i * 100, 1300); g.stroke(); }
    const fl = new Path2D(); fl.rect(-20, 1540, W + 40, 400); wc(g, fl, '#8f857a', { grain: .3 });
  });
}
function buildPassing() { return cached('passing', 2400, 760, g => { g.translate(0, -260); { const gr = g.createLinearGradient(0, 260, 0, 1020); gr.addColorStop(0, '#b9d6e4'); gr.addColorStop(1, '#f1e8cc'); g.fillStyle = gr; g.fillRect(0, 260, 2400, 760); } paintRidge(g, 640, 40, '#a7bdcb', 3, 0, 2400, 1100); g.fillStyle = '#8fbcd2'; g.fillRect(0, 760, 2400, 120); for (let i = 0; i < 16; i++) { const x = i * 150 + 40; g.fillStyle = '#6e4a2c'; g.fillRect(x - 6, 640, 12, 380); paintCanopy(g, x, 600, 110, 120, 60, i + 300, .9); } g.fillStyle = '#b9b48a'; g.fillRect(0, 960, 2400, 60); }); }
SCENES.businside = (ctx, t) => {
  const rock = Math.sin(t * 3.1) * 3 + Math.sin(t * 7.3) * 1.2;
  setCam(ctx, 1, 540, 960 + rock * .3);
  ctx.save(); const win = new Path2D(); win.roundRect(100, 290, 880, 700, 30); ctx.clip(win);
  const pass = buildPassing(), off = ((t - 51.6) * 260) % 2400; ctx.drawImage(pass, -off, 290); ctx.drawImage(pass, -off + 2400, 290);
  ctx.restore();
  ctx.drawImage(buildBusInside(), 0, 0, W, 260, 0, 0, W, 260);
  const bg = buildBusInside(); ctx.drawImage(bg, 0, 260, 100, 760, 0, 260, 100, 760); ctx.drawImage(bg, 980, 260, 100, 760, 980, 260, 100, 760); ctx.drawImage(bg, 0, 990, W, 930, 0, 990, W, 930);
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(100, 290, 880, 700, 30); ctx.stroke();
  // 烏烏 by the window: grip on the clasp softens
  const soft = ease(prog('b.soften', t));
  const P = { x: 330, y: 1460 + rock, k: 1.45, cape: 'on' };
  P.hands = { R: [lerp(54, 120, soft), lerp(-78, -60, soft)], L: [-146, -76] }; P.grip = { R: lerp(1, 0, soft) };
  P.sq = lerp(-.01, .035, soft); P.lift = lerp(4, -4, soft);
  P.turn = lerp(.1, -.45, smooth(54, 55.5, t)); P.eye = face(lerp(1, .78, soft), lerp(.2, -.85, smooth(54, 55.5, t)), lerp(.5, -.2, soft)); P.mouth = soft > .6 ? { shape: 'smile' } : { shape: 'flat', wob: 1.6 }; P.blush = soft * .5;
  idle(P, t, 4); P.leaf = Math.sin(t * 3.1) * .03;
  const G = { x: 690, y: 1450 + rock, k: 1.3, tt: t, turn: lerp(-.2, -.5, smooth(54.5, 55.5, t)) }; G.eye = face(1, -.7, .1); G.mouth = { shape: 'smile', open: smooth(55, 55.6, t) * .3 }; G.hands = { L: [-50, -110], R: [40, -110] }; idle(G, t, 6);
  const Q = { x: 920, y: 1470 + rock, k: 1.25, turn: -.3 }; Q.eye = face(1, -.8, -.2); Q.mouth = { shape: 'smile' }; Q.hands = { L: [-60, -110], R: [70, -96] }; Q.hold = { L: (g, hx, hy) => drawCard(g, hx + 10, hy + 10, 60, .1) }; idle(Q, t, 8);
  RIG.gui(ctx, G); RIG.qi(ctx, Q); RIG.wu(ctx, P);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ===================== 06 · PARK STOP =========================================
function buildPark() {
  return cached('park', W, H, g => {
    paintSky(g, 0, 1000, ['#c9d9e8', '#f3dcc0', '#f6c8a0']); paintClouds(g, 5, 150, 450, 81, .45);
    paintRidge(g, 720, 50, '#a9b6c8', 4); paintLake(g, 880, 1160, 82, ['#a6c4d6', '#7fa8c4']);
    paintTrees(g, 820, 900, 30, 83, .8);
    paintGround(g, 1150, 1920, 84, ['#c3c27a', '#a3b05e'], 700);
    const path = new Path2D(); path.moveTo(-50, 1420); path.quadraticCurveTo(540, 1330, 1130, 1440); path.lineTo(1130, 1640); path.quadraticCurveTo(540, 1560, -50, 1660); path.closePath(); wc(g, path, '#d6c9ae', { grain: .3, bloom: .2, out: INK, outW: 2, outA: .4 });
    const r = mulberry32(85); for (let i = 0; i < 40; i++) { const x = r() * W, y = 1440 + r() * 160; rock(g, x, y, 22, 8, r, { moss: false, light: '#e2d8c2', dark: '#b8ab92' }); }
    for (const x of [130, 960]) { g.fillStyle = '#4a4038'; g.fillRect(x - 6, 1000, 12, 420); const l = new Path2D(); l.roundRect(x - 26, 960, 52, 60, 10); wc(g, l, '#f6dc8a', { out: INK, outW: 2.5 }); }
    paintCanopy(g, 80, 260, 260, 200, 150, 86); paintCanopy(g, 1040, 220, 240, 190, 140, 87);
  });
}
const PARK = { bx: 40, s: .85, wheel: 1500, side: 1650 };
// door (x≈70–210) → step → sidewalk in front of the bus; then along the sidewalk
const parkGround = x => x < 150 ? PARK.wheel - 70 : x < 230 ? PARK.wheel - 10 : PARK.side;
SCENES.parkstop = (ctx, t) => {
  setCam(ctx, 1, 540, 960); ctx.drawImage(buildPark(), 0, 0);
  const away = easeIn(prog('p.away', t)), bx = PARK.bx - away * 1100;
  const people = [];
  for (const [who, id, x0, k, seed] of [['wu', 'park.wu', 60, 1.2, 1], ['gui', 'park.gui', 60, 1.15, 2], ['qi', 'park.qi', 60, 1.15, 3]]) {
    if (t < WALKS[id].keys[0][0]) continue;
    const P = { x: x0, y: 0, k, cape: 'on', tt: t }; walkPose(who, P, walkN(id, t), 1, walkMoving(id, t), { lift: 30 });
    const fx = f => P.x + P.feet[f][0] * k, gL = parkGround(fx('L')), gR = parkGround(fx('R'));
    P.y = Math.max(gL, gR) - Math.abs(gL - gR) * .5;
    for (const f of ['L', 'R']) P.feet[f] = [P.feet[f][0], P.feet[f][1] + (parkGround(fx(f)) - P.y) / k];
    P.turn = .35; P.eye = face(1, .5, -.1); P.mouth = { shape: 'smile' }; idle(P, t, seed);
    if (who === 'qi') { P.hold = { L: (g, hx, hy) => drawCard(g, hx, hy + 20, 56, .3) }; if (t > 61.2) { P.turn = -.4; P.eye = face(1, -.8, -.2, 'happy'); P.hands = { L: [-84, -104], R: [110, -200 + Math.sin(t * 16) * 10] }; } }
    people.push([who, P, P.x < 215 ? 'in' : 'out']);
  }
  drawBus(ctx, bx, PARK.wheel, PARK.s, t, { door: 1 - ease(prog('p.close', t)), inside: g => { g.save(); g.translate(-bx, -PARK.wheel); g.scale(1 / PARK.s, 1 / PARK.s); g.translate(bx * (1 - PARK.s) / 1, 0); g.restore(); } });
  // figures still in the doorway are masked by the door frame
  const dx0 = bx + 30 * PARK.s, dw = 170 * PARK.s, top = PARK.wheel - 600 * PARK.s;
  ctx.save(); ctx.beginPath(); ctx.rect(dx0, top, dw, PARK.wheel - top + 400); ctx.rect(dx0 + dw, -2000, 4000, 6000); ctx.clip();
  people.filter(p => p[2] === 'in').forEach(([w, P]) => RIG[w](ctx, P)); ctx.restore();
  people.filter(p => p[2] === 'out').sort((a, b) => a[1].y - b[1].y).forEach(([w, P]) => RIG[w](ctx, P));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
// ===================== 07 · BRIDGE (low angle) & FIELD ===========================
const BRIDGE = { y: x => 1500 - Math.sin(clamp((x + 120) / 1320) * Math.PI) * 140 };
function buildBridge() {
  return cached('bridge', W, H, g => {
    paintSky(g, 0, 1100, ['#a9cde0', '#dbe9e6', '#f6e8c8']); paintClouds(g, 7, 120, 600, 91);
    paintRidge(g, 900, 50, '#a7bdcb', 6); paintTrees(g, 980, 1080, 40, 92, .9);
    paintLake(g, 1060, 1920, 93, ['#8fbcd2', '#5f97b6']);
    // reflections of the bridge
    g.save(); g.globalAlpha = .25; g.strokeStyle = '#6e4426'; g.lineWidth = 30; g.beginPath(); for (let x = -120; x <= 1200; x += 20) { const y = 1500 + (1500 - BRIDGE.y(x)) + 40; x === -120 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.restore();
    // deck
    const deck = new Path2D(); for (let x = -120; x <= 1200; x += 20) { const y = BRIDGE.y(x); x === -120 ? deck.moveTo(x, y) : deck.lineTo(x, y); } for (let x = 1200; x >= -120; x -= 20) deck.lineTo(x, BRIDGE.y(x) + 46); deck.closePath();
    wc(g, deck, '#9a6a3e', { grain: .35, out: INK, outW: 3 });
    g.strokeStyle = 'rgba(70,40,15,.55)'; g.lineWidth = 2.5; for (let x = -120; x <= 1200; x += 34) { g.beginPath(); g.moveTo(x, BRIDGE.y(x)); g.lineTo(x, BRIDGE.y(x) + 46); g.stroke(); }
    // arch beam under
    const arch = new Path2D(); for (let x = -120; x <= 1200; x += 20) { const y = BRIDGE.y(x) + 46; x === -120 ? arch.moveTo(x, y) : arch.lineTo(x, y); } for (let x = 1200; x >= -120; x -= 20) arch.lineTo(x, BRIDGE.y(x) + 90 + (1500 - BRIDGE.y(x)) * .6); arch.closePath(); wc(g, arch, '#7a4e2c', { grain: .35, out: INK, outW: 3 });
  });
}
function bridgeRail(ctx, front) {
  const yo = front ? 10 : -120;
  ctx.save(); ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = front ? 16 : 10; ctx.lineCap = 'round';
  ctx.beginPath(); for (let x = -120; x <= 1200; x += 20) { const y = BRIDGE.y(x) + yo - (front ? 120 : 0); x === -120 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  for (let x = -100; x <= 1200; x += 120) { ctx.lineWidth = front ? 14 : 9; ctx.beginPath(); ctx.moveTo(x, BRIDGE.y(x) + (front ? 30 : -4)); ctx.lineTo(x, BRIDGE.y(x) + yo - (front ? 124 : 4)); ctx.stroke(); }
  ctx.restore();
}
function walkersOn(ground, ids, t, k, opts = {}) {
  const out = [];
  for (const [who, id, x0, seed] of ids) {
    const P = { x: x0, y: 0, k, cape: 'on', tt: t };
    walkPose(who, P, walkN(id, t), 1, walkMoving(id, t), { lift: 26 });
    P.y = ground(P.x);
    // feet follow the ground under each foot (planks / slope)
    for (const f of ['L', 'R']) { const wx = P.x + P.feet[f][0] * k; P.feet[f] = [P.feet[f][0], P.feet[f][1] + (ground(wx) - P.y) / k]; }
    P.turn = .3; P.eye = face(1, .6, -.05); P.mouth = { shape: 'smile', open: opts.chat && Math.sin(t * 2 + seed) > .6 ? .3 : 0 }; idle(P, t, seed);
    if (who === 'qi') P.hold = { L: (g, hx, hy) => drawCard(g, hx, hy + 20, 56, .3) };
    out.push([who, P]);
  }
  return out;
}
SCENES.bridge = (ctx, t) => {
  const pan = (t - 66) / 6.6;
  setCam(ctx, 1.06, 520 + pan * 40, 960); ctx.drawImage(buildBridge(), 0, 0);
  bridgeRail(ctx, false);
  const W3 = walkersOn(BRIDGE.y, [['qi', 'br.qi', -420, 3], ['gui', 'br.gui', -250, 2], ['wu', 'br.wu', -60, 1]], t, 1.15);
  W3.sort((a, b) => a[1].x - b[1].x).forEach(([w, P]) => RIG[w](ctx, P));
  bridgeRail(ctx, true);
  creekRipples(ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
function creekRipples(ctx, t) { const r = mulberry32(95); ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; for (let i = 0; i < 24; i++) { const x0 = r() * W, y = 1620 + r() * 300, sp = 10 + r() * 20, l = 20 + r() * 40; const x = ((x0 + t * sp) % (W + 100)) - 50; ctx.globalAlpha = .3 + .3 * Math.sin(t * 2 + i); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); } ctx.restore(); }
function buildField() {
  return cached('field', W, H, g => {
    paintSky(g, 0, 1000, ['#b4d4e4', '#e6ede2', '#f6e6c4']); paintClouds(g, 6, 120, 500, 101);
    paintRidge(g, 780, 40, '#a7bdcb', 7); paintTrees(g, 860, 940, 36, 102, .8);
    paintGround(g, 920, 1300, 103, ['#c6cf86', '#a9bb66'], 300);
    const track = new Path2D(); track.moveTo(-100, 1080); track.quadraticCurveTo(540, 1000, 1180, 1080); track.lineTo(1180, 1200); track.quadraticCurveTo(540, 1110, -100, 1200); track.closePath(); wc(g, track, '#c96a52', { grain: .3, out: INK, outW: 2, outA: .4 });
    g.strokeStyle = 'rgba(255,245,235,.85)'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-100, 1080 + i * 30); g.quadraticCurveTo(540, 1000 + i * 28, 1180, 1080 + i * 30); g.stroke(); }
    g.strokeStyle = '#fff'; g.lineWidth = 7; g.strokeRect(740, 900, 200, 90); g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(745 + i * 25, 905); g.lineTo(745 + i * 25, 985); g.stroke(); }
    for (const x of [110, 1000]) { g.fillStyle = '#9a9a9a'; g.fillRect(x - 5, 560, 10, 420); g.fillStyle = '#e8e2d2'; g.fillRect(x - 40, 540, 80, 30); }
    paintGround(g, 1300, 1920, 104, ['#b8bf72', '#97a854'], 900);
    const path = new Path2D(); path.rect(-50, 1560, W + 100, 120); wc(g, path, '#d9cbb0', { grain: .3, bloom: .2 });
  });
}
SCENES.field = (ctx, t) => {
  setCam(ctx, 1, 540, 960); ctx.drawImage(buildField(), 0, 0);
  const W3 = walkersOn(() => 1640, [['qi', 'f.qi', -460, 3], ['gui', 'f.gui', -280, 2], ['wu', 'f.wu', -90, 1]], t, 1.3, { chat: true });
  W3.sort((a, b) => a[1].x - b[1].x).forEach(([w, P]) => RIG[w](ctx, P));
  // foreground grass blades (low angle)
  const r = mulberry32(105); for (let i = 0; i < 70; i++) { const x = r() * W, h = 60 + r() * 120; grassBlade(ctx, x, 1930, h, (r() - .5) * 40 + Math.sin(t * 1.5 + i) * 6, 6, ['#8c9e4c', '#7b8e40', '#a9b05a'][i % 3]); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
