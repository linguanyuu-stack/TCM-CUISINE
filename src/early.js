// ---------------------------------------------------------------------------
// Shots 01–03: creek close-up, mountain path, stepping stones.
// Screen-space scenes (1080×1920) with two parallax planes each.
// ---------------------------------------------------------------------------
const EARLY = {};
function sceneCanvas(fn) { const c = mkCanvas(W + 160, H + 160), g = c.getContext('2d'); g.translate(80, 80); fn(g); return c; }
function drawPlane(ctx, c, dx, dy, s) { ctx.setTransform(s, 0, 0, s, W / 2 - (W / 2 + 80) * s + dx, H / 2 - (H / 2 + 80) * s + dy); ctx.drawImage(c, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0); }
function waterBase(g, x, y, w, h, seed, top = '#7db3cb', bot = '#4f8aab') {
  const rng = mulberry32(seed); const p = new Path2D(); p.rect(x, y, w, h);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  wc(g, p, gr, { grain: .22, bloom: .25 });
  g.save(); g.clip(p);
  // reflections of the golden canopy
  for (let i = 0; i < 26; i++) { g.globalAlpha = .22; g.fillStyle = ['#f1c64c', '#e9a83a', '#f6dc7a'][i % 3]; g.fill(blob(x + rng() * w, y + rng() * h * .45, 60 + rng() * 120, 14 + rng() * 22, rng, .3)); }
  g.globalAlpha = 1; g.lineCap = 'round';
  for (let i = 0; i < 110; i++) { const xx = x + rng() * w, yy = y + rng() * h, l = 20 + rng() * 80; g.strokeStyle = `rgba(255,255,255,${.15 + rng() * .3})`; g.lineWidth = 1.5 + rng() * 3; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + l / 2, yy - 4, xx + l, yy); g.stroke(); }
  g.restore();
}
function treeLine(g, y0, y1, seed, n = 40, scale = 1) {
  const rng = mulberry32(seed), tc = ['#e9b84a', '#dd8f3c', '#f1cd62', '#c8a24a', '#b8b25a', '#e7a03e', '#f3d27a'];
  for (let i = 0; i < n; i++) {
    const x = -80 + rng() * (W + 160), y = y0 + rng() * (y1 - y0), r = (30 + rng() * 50) * scale;
    g.fillStyle = '#6a5030'; g.fillRect(x - 3 * scale, y, 6 * scale, r * .8);
    wc(g, blob(x, y, r, r * .85, rng, .2, 10), tc[Math.floor(rng() * tc.length)], { grain: .3, edge: '#9a6a2a', edgeW: 3, edgeA: .3 });
  }
}
function meadow(g, y0, y1, seed, cols = ['#c3c27a', '#9fae5a']) {
  const rng = mulberry32(seed); const p = new Path2D(); p.moveTo(-80, y0); for (let x = -80; x <= W + 80; x += 40) p.lineTo(x, y0 + Math.sin(x * .007 + seed) * 18); p.lineTo(W + 80, y1); p.lineTo(-80, y1); p.closePath();
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); wc(g, p, gr, { grain: .25, bloom: .2 });
  for (let i = 0; i < 900; i++) { const x = -80 + rng() * (W + 160), y = y0 + 20 + rng() * (y1 - y0 - 20), d = (y - y0) / (y1 - y0); grassBlade(g, x, y, 8 + d * 30, (rng() - .5) * 12, 1.2 + d * 2, ['#8c9e4c', '#b6b864', '#7b8e40', '#c7b85a'][i % 4]); }
  for (let i = 0; i < 60; i++) { const x = rng() * W, y = y0 + 40 + rng() * (y1 - y0 - 40); flower5(g, x, y, 4 + (y - y0) / (y1 - y0) * 8, rng() < .7 ? '#fffaf0' : '#f2a49a', '#f2b33a', 'rgba(150,120,70,.6)', rng() * 6); }
  for (let i = 0; i < 40; i++) { const x = rng() * W, y = y0 + 30 + rng() * (y1 - y0 - 30); drawGinkgo(g, x, y, 14 + (y - y0) / (y1 - y0) * 14, rng() * 6.28, PAL.gold, { squash: .55 }); }
}
function skyHills(g, seed, hy = 700) {
  const sky = g.createLinearGradient(0, -80, 0, hy + 200); sky.addColorStop(0, '#b6d3e2'); sky.addColorStop(.6, '#dbe8e4'); sky.addColorStop(1, '#f1e7cc');
  g.fillStyle = sky; g.fillRect(-80, -80, W + 160, H + 160);
  const rng = mulberry32(seed);
  for (let i = 0; i < 6; i++) { g.globalAlpha = .45; g.fillStyle = '#fffaf0'; g.fill(blob(rng() * W, 150 + rng() * 300, 100 + rng() * 120, 22 + rng() * 16, rng, .25)); } g.globalAlpha = 1;
  const ridge = (y0, amp, col, sd) => { const p = new Path2D(); p.moveTo(-80, H + 80); for (let x = -80; x <= W + 80; x += 30) p.lineTo(x, y0 + Math.sin(x * .005 + sd) * amp + Math.sin(x * .013 + sd * 3) * amp * .4); p.lineTo(W + 80, H + 80); p.closePath(); wc(g, p, col, { grain: .2, bloom: .18, edge: shade(col, -.15), edgeW: 6, edgeA: .35 }); };
  ridge(hy, 60, '#a9c0cd', seed); ridge(hy + 80, 40, '#9db6b2', seed + 1);
}

function buildEarlyLayers() {
  if (EARLY.built) return; EARLY.built = true;
  // ---------- 01 creek close-up ----------
  EARLY.creekBack = sceneCanvas(g => {
    waterBase(g, -80, -80, W + 160, H + 160, 501);
    const rng = mulberry32(502);
    rock(g, 80, 1700, 230, 150, rng, {}); rock(g, 1000, 1560, 200, 130, rng, {}); rock(g, 860, 1880, 260, 120, rng, {}); rock(g, -20, 1180, 140, 90, rng, {}); rock(g, 1070, 980, 120, 80, rng, {});
    for (let i = 0; i < 7; i++) drawGinkgo(g, 100 + rng() * 900, 500 + rng() * 1200, 34 + rng() * 14, rng() * 6.28, PAL.gold, { squash: .45 });
  });
  EARLY.creekFront = sceneCanvas(g => {
    // overhanging ginkgo branch (top-left)
    g.strokeStyle = '#6e4a2c'; g.lineCap = 'round'; g.lineWidth = 24;
    g.beginPath(); g.moveTo(-90, 60); g.bezierCurveTo(150, 140, 380, 230, 640, 300); g.stroke();
    g.lineWidth = 10; g.beginPath(); g.moveTo(300, 200); g.quadraticCurveTo(380, 120, 470, 90); g.stroke();
    g.lineWidth = 4; g.strokeStyle = PAL.siennaD; g.globalAlpha = .5; g.beginPath(); g.moveTo(-90, 72); g.bezierCurveTo(150, 152, 380, 242, 640, 312); g.stroke(); g.globalAlpha = 1;
    const rng = mulberry32(503);
    const L = [[40, 120, 120, 2.6], [150, 170, 140, 3.4], [250, 215, 150, 2.9], [360, 250, 130, 3.6], [420, 120, 110, 2.2], [480, 92, 100, 3.9], [520, 280, 140, 3.3], [130, 80, 100, 2.1], [600, 300, 120, 2.9]];
    for (const [x, y, s, r] of L) drawGinkgo(g, x, y, s, r, ['#f4c63c', '#f8d867', '#e9a92c'][Math.floor(rng() * 3)]);
  });
  // ---------- 02 mountain path ----------
  EARLY.pathBack = sceneCanvas(g => {
    skyHills(g, 601, 640);
    treeLine(g, 760, 900, 602, 46, .9);
    meadow(g, 880, H + 80, 603);
    // stepping-stone path receding to the back centre
    const rng = mulberry32(604);
    const stones = []; for (let i = 0; i < 12; i++) { const u = i / 11, y = lerp(1880, 960, Math.pow(u, .8)), x = lerp(640, 560, u) + Math.sin(u * 6) * 60 * (1 - u), s = lerp(1, .22, Math.pow(u, .7)); stones.push([x, y, s]); }
    for (const [x, y, s] of stones.reverse()) { const r = mulberry32(Math.round(x * y)); const p = blob(x, y, 120 * s, 46 * s, r, .12, 12); const gr = g.createLinearGradient(0, y - 40 * s, 0, y + 40 * s); gr.addColorStop(0, '#d2c6b0'); gr.addColorStop(1, '#a29480'); wc(g, p, gr, { grain: .35, edge: '#776a58', edgeW: 3 * s + 1, out: PAL.siennaD, outW: 2 * s + .6, outA: .5 }); }
    // trunks either side
    for (const [x, w] of [[-20, 110], [990, 130]]) { const p = new Path2D(); p.moveTo(x - w / 2, 1500); p.bezierCurveTo(x - w * .4, 900, x - w * .3, 400, x - w * .2, -80); p.lineTo(x + w * .3, -80); p.bezierCurveTo(x + w * .4, 400, x + w * .5, 900, x + w / 2, 1500); p.closePath(); wc(g, p, '#7a5434', { grain: .4, edge: '#3e2614', edgeW: 4, out: PAL.siennaD, outW: 3, outA: .6 }); }
    for (const [cx, cy, rx, ry, sd] of [[60, 140, 330, 260, 1], [1040, 120, 330, 280, 2]]) {
      const r = mulberry32(sd); for (let i = 0; i < 380; i++) { const a = r() * 6.283, d = Math.sqrt(r()); drawGinkgo(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 22 + r() * 16, r() * 6.28, ['#f4c63c', '#f8d867', '#e9a92c', '#fbe28a'][Math.floor(r() * 4)], { detail: r() < .5 }); }
    }
  });
  // ---------- 03 stepping stones over the creek ----------
  EARLY.stoneBack = sceneCanvas(g => {
    skyHills(g, 701, 560);
    treeLine(g, 640, 820, 702, 50, 1);
    meadow(g, 800, 1060, 703);
    waterBase(g, -80, 1040, W + 160, 760, 704);
    meadow(g, 1720, H + 80, 705, ['#a9b462', '#8fa050']);
    const rng = mulberry32(706);
    for (let i = 0; i < 9; i++) rock(g, -60 + i * 140 + rng() * 40, 1060 + rng() * 20, 60 + rng() * 30, 26, rng, {});
    for (let i = 0; i < 9; i++) rock(g, -60 + i * 140 + rng() * 40, 1730 + rng() * 20, 70 + rng() * 30, 32, rng, {});
  });
  EARLY.stones = [[175, 1430], [355, 1395], [525, 1418], [680, 1388], [875, 1420]];
}

// ---------- shot 01 ----------
function renderCreek(ctx, t) {
  const u = clamp(t / 6), push = 1 + u * .05;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawPlane(ctx, EARLY.creekBack, -u * 10, -u * 6, push);
  ctx.setTransform(push, 0, 0, push, W / 2 * (1 - push), H / 2 * (1 - push));
  creekShimmer(ctx, t, { x: -40, y: 420, w: W + 80, h: 1500 }, 55);
  // floating leaves drifting downstream
  const r = mulberry32(57);
  for (let i = 0; i < 6; i++) { const x0 = r() * W, y0 = 500 + r() * 1300, sp = 14 + r() * 16; const x = ((x0 + t * sp) % (W + 200)) - 100, y = y0 + t * sp * .4; drawGinkgo(ctx, x, y, 30 + r() * 10, r() * 6 + t * .1, PAL.gold, { squash: .45 }); }
  // droplet from the hanging leaf tip
  const tip = { x: 618, y: 640 }, land = { x: 600, y: 1200 };
  const dp = prog('c.drop', t);
  if (dp > 0 && dp < 1) { const y = lerp(tip.y, land.y, dp * dp); ctx.fillStyle = 'rgba(235,248,255,.95)'; ctx.strokeStyle = 'rgba(80,140,170,.8)'; ctx.lineWidth = 2; const p = new Path2D(); p.moveTo(tip.x, y - 16); p.quadraticCurveTo(tip.x + 9, y, tip.x, y + 6); p.quadraticCurveTo(tip.x - 9, y, tip.x, y - 16); ctx.fill(p); ctx.stroke(p); }
  else if (dp === 0) { const g = clamp(t / .55); ctx.fillStyle = 'rgba(235,248,255,.95)'; ctx.beginPath(); ctx.arc(tip.x, tip.y + 4 * g, 4 + 5 * g, 0, 7); ctx.fill(); }
  ripples(ctx, land.x, land.y, t - (ACT['c.drop'].t + ACT['c.drop'].d), 1);
  // the hanging leaf falls, lands, drifts away
  const lp = prog('c.leaf', t), dr = ease(prog('c.drift', t));
  let lx = 620, ly = 520, rot = Math.PI + .15 + Math.sin(t * 1.6) * .05, sq = 1;
  if (lp > 0) { lx = 620 - Math.sin(lp * Math.PI * 2.2) * 120 * (1 - lp) - lp * 40; ly = lerp(520, 1230, ease(lp)); rot = Math.PI + .15 + lp * 2.6 + Math.sin(lp * 9) * .5; sq = .5 + .5 * Math.abs(Math.cos(lp * 8)); }
  const landT = ACT['c.leaf'].t + ACT['c.leaf'].d;
  if (t >= landT) { sq = .45; rot = Math.PI + 2.75 + dr * 1.2; lx = 580 + dr * 520 + Math.sin(t * 1.2) * 6; ly = 1230 + dr * 420; }
  ripples(ctx, 580, 1240, t - landT, 1.5, dr * 520, dr * 420);
  if (lp <= 0) { ctx.strokeStyle = '#a8741e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(620, 360); ctx.quadraticCurveTo(625, 440, 620, 522); ctx.stroke(); }
  drawGinkgo(ctx, lx, ly, 170, rot, '#f6c83e', { squash: sq, tip: '#fbe07a' });
  // water sheen on the landed leaf
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawPlane(ctx, EARLY.creekFront, -u * 24, -u * 10, push * 1.01);
}
function ripples(ctx, x, y, dt, s, ox = 0, oy = 0) {
  if (dt < 0 || dt > 3.2) return;
  ctx.save(); ctx.lineWidth = 3;
  for (let k = 0; k < 3; k++) { const d = dt - k * .35; if (d < 0) continue; const r = (20 + d * 150) * s, a = Math.max(0, .65 - d * .22); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.ellipse(x + ox * Math.min(1, d), y + oy * Math.min(1, d), r, r * .32, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
}

// ---------- shot 02 ----------
const PATHB = { P: { x: 1010, y: 800 }, len: 900 };
function pathWu(t) {
  const reach = ease(prog('p.reach', t)), lift = ease(prog('p.lift', t)), lower = ease(prog('p.lower', t));
  let arm = lerp(-0.6, -0.9, reach), len = lerp(1, 1.4, reach);
  arm = lerp(arm, -1.57, lift); len = lerp(len, 2.0, lift);
  arm = lerp(arm, -0.6, lower); len = lerp(len, 1, lower);
  const lean = lerp(0, .05, reach) - lift * .03 + lower * .0; const lift2 = lift * 30 * (1 - lower);
  return { x: 260, y: 1560, h: 430, pose: { arm, len, lean, sq: .01 * Math.sin(t * 2), lift: lift2 } };
}
function branchAngle(t) {
  const P = PATHB.P;
  const reachPose = { arm: -0.9, len: 1.4, lean: .05 };
  const F1 = wuFist(260, 1560, 430, reachPose); const rest = Math.atan2(F1[1] - P.y, F1[0] - P.x);
  const w = pathWu(t); const F = wuFist(w.x, w.y, w.h, w.pose); const held = Math.atan2(F[1] - P.y, F[0] - P.x);
  const holding = t >= ACT['p.reach'].t + ACT['p.reach'].d && t < ACT['p.lower'].t + ACT['p.lower'].d * .6;
  let a = holding ? held : rest;
  const rel = ACT['p.lower'].t + ACT['p.lower'].d * .6;
  if (t >= rel) { const d = t - rel, from = held; a = rest + (Math.atan2(wuFist(260, 1560, 430, pathWu(rel).pose)[1] - P.y, wuFist(260, 1560, 430, pathWu(rel).pose)[0] - P.x) - rest) * Math.exp(-d * 3) * Math.cos(d * 9); }
  return a + Math.sin(t * 1.4) * .006;
}
function drawBranch(ctx, a) {
  const P = PATHB.P; ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(a);
  ctx.strokeStyle = '#6e4a2c'; ctx.lineCap = 'round'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(PATHB.len * .5, -18, PATHB.len, 6); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = PAL.siennaD; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(-40, 9); ctx.quadraticCurveTo(PATHB.len * .5, -9, PATHB.len, 14); ctx.stroke(); ctx.globalAlpha = 1;
  const r = mulberry32(611);
  ctx.lineWidth = 6; ctx.strokeStyle = '#6e4a2c'; for (let i = 0; i < 6; i++) { const u = .2 + i * .13; ctx.beginPath(); ctx.moveTo(PATHB.len * u, -10 * Math.sin(u * Math.PI)); ctx.lineTo(PATHB.len * u + 40, (i % 2 ? -1 : 1) * 50); ctx.stroke(); }
  for (let i = 0; i < 44; i++) { const u = .12 + r() * .82, x = PATHB.len * u + (r() - .5) * 40, y = -14 * Math.sin(u * Math.PI) + (r() - .4) * 90; drawGinkgo(ctx, x, y, 46 + r() * 30, Math.PI - a + (r() - .5) * 1.6, ['#f4c63c', '#f8d867', '#e9a92c', '#fbe28a'][i % 4]); }
  ctx.restore();
}
function renderPath(ctx, t) {
  const u = clamp((t - 6) / 7), s = 1.02 + u * .03;
  drawPlane(ctx, EARLY.pathBack, -u * 14, 0, s);
  ctx.setTransform(s, 0, 0, s, W / 2 * (1 - s) - u * 20, H / 2 * (1 - s));
  fallingLeaves(ctx, t, 8, 81, { x: -80, y: -100, w: 1200, h: 1900 }, 1.2);
  // 山山 walks up the path, passes under the lifted branch, bows thanks
  const T0 = ACT['p.walk'].t, Tb = ACT['p.bow'].t, Tb1 = Tb + ACT['p.bow'].d, T1 = T0 + ACT['p.walk'].d;
  let uu = 0; if (t > T0) uu = t < Tb ? .58 * ease((t - T0) / (Tb - T0)) : t < Tb1 ? .58 : .58 + .42 * ease((t - Tb1) / (T1 - Tb1));
  const sx = lerp(860, 600, uu) + Math.sin(uu * 5) * 40 * (1 - uu), sy = lerp(1830, 1040, Math.pow(uu, .85)), sh = lerp(520, 150, Math.pow(uu, .75));
  const walking = t > T0 && t < T1 && !(t > Tb && t < Tb1); const bob = walking ? Math.abs(Math.sin(t * 7.5)) * 10 * sh / 400 : 0;
  const bow = hump(prog('p.bow', t));
  const shanDraw = () => drawSprite(ctx, 'shan', sx, sy, sh, { lift: bob, sy: 1 - bow * .08, rot: bow * .12 + (walking ? Math.sin(t * 7.5) * .03 : 0), alpha: t < T0 + .05 ? 0 : 1 });
  const a = branchAngle(t);
  const branchDepthY = 1430; // where the branch crosses the path
  if (sy > branchDepthY) { drawBranch(ctx, a); shanDraw(); } else { shanDraw(); drawBranch(ctx, a); }
  if (bow > .3) drawSparkle(ctx, sx + sh * .3, sy - sh * 1.05, sh / 300, (bow - .3) / .7, '#f2b33a', .3);
  const w = pathWu(t); drawWu(ctx, w.x, w.y, w.h, w.pose);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------- shot 03 ----------
function guiPos(t) {
  const S = EARLY.stones; let i = 0, h = 0, x = S[0][0], y = S[0][1];
  const hops = ['s.hop1', 's.hop2', 's.hop3'];
  for (let k = 0; k < hops.length; k++) { const p = prog(hops[k], t); if (p >= 1) i = k + 1; else if (p > 0) { const e = ease(p); x = lerp(S[k][0], S[k + 1][0], e); y = lerp(S[k][1], S[k + 1][1], e); h = hump(p) * 110; return { x, y, h, air: p }; } }
  x = S[i][0]; y = S[i][1];
  const p4 = prog('s.hop4', t); if (p4 > 0 && p4 < 1) h = hump(p4) * 60;
  return { x, y, h, air: 0 };
}
function renderStones(ctx, t) {
  const u = clamp((t - 13) / 7), s = 1.1 + u * .025, oy = -150;
  drawPlane(ctx, EARLY.stoneBack, u * 12, oy, s);
  ctx.setTransform(s, 0, 0, s, W / 2 * (1 - s) + u * 10, H / 2 * (1 - s) + oy);
  creekShimmer(ctx, t, { x: -40, y: 1080, w: W + 80, h: 620 }, 77);
  const r = mulberry32(78);
  for (let i = 0; i < 5; i++) { const x0 = r() * W, y0 = 1150 + r() * 520, sp = 30 + r() * 20; drawGinkgo(ctx, ((x0 + t * sp) % (W + 200)) - 100, y0, 26, r() * 6 + t * .2, PAL.gold, { squash: .45 }); }
  const rs = mulberry32(79);
  for (const [x, y] of EARLY.stones) {
    ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 8, 112 + Math.sin(t * 3 + x) * 4, 30, 0, 0, Math.PI); ctx.stroke(); ctx.restore();
    rock(ctx, x, y, 100, 42, rs, { light: '#c9bda8', dark: '#8f8270' });
  }
  // 麻麻 yawns, then pulls a foot back from the splash
  const yw = hump(prog('s.yawn', t)), fb = prog('s.footback', t);
  const back = fb > 0 ? Math.sin(Math.PI * Math.min(1, fb * 1.15)) * (t < ACT['s.footback'].t + 1.6 ? 1 : 0) : 0;
  const settle = smooth(ACT['s.footback'].t + .55, ACT['s.footback'].t + 1.2, t);
  const mb = back * (1 - settle);
  const mx = 880 + mb * 18, my = EARLY.stones[4][1] - 6, mh = 305;
  drawSprite(ctx, 'ma_cheer', mx, my, mh, { sy: 1 + yw * .07, sx: 1 - yw * .03, rot: .2 * mb, pivotX: 60, lift: mb * 4, shw: .55 });
  // splash beside 麻麻's left foot
  const sp = prog('s.splash', t);
  if (sp > 0 && sp < 1) {
    const ox = 790, oy = 1432, rr = mulberry32(81);
    ctx.save();
    for (let i = 0; i < 22; i++) { const a = -Math.PI / 2 + (rr() - .5) * 1.8, v = 300 + rr() * 380, tt = sp * .9; const x = ox + Math.cos(a) * v * tt, y = oy + Math.sin(a) * v * tt + 900 * tt * tt; ctx.globalAlpha = 1 - sp; ctx.fillStyle = '#eaf6fb'; ctx.strokeStyle = 'rgba(80,140,170,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 5 + rr() * 6, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.globalAlpha = (1 - sp) * .8; ctx.fillStyle = '#f3fbff'; ctx.fill(blob(ox, oy - 20 * hump(sp), 50 + sp * 30, 26 + 50 * hump(sp), mulberry32(82), .3)); ctx.restore();
    ripples(ctx, ox, oy + 6, sp * 2, 1);
  }
  if (back > .2 && back < .99) drawSparkle(ctx, mx - 120, my - mh * .95, 1.1, back, '#f2b33a', -.5);
  // 歸歸 hops across carrying two bowls
  const G = guiPos(t), gh = 300, gs = 1 - (G.air > 0 ? hump(G.air) * -.04 : 0);
  const land = ['s.hop1', 's.hop2', 's.hop3', 's.hop4'].map(id => t - (ACT[id].t + ACT[id].d)).filter(d => d >= 0 && d < .25);
  const squash = land.length ? hump(land[0] / .25) * .07 : 0;
  drawSprite(ctx, 'gui_cup', G.x, G.y - 4, gh, { lift: G.h, sy: (1 - squash) * gs, sx: 1 + squash * .6, shw: .5, sha: G.h > 20 ? .15 : .28 });
  // two bowls in her hands (cover the cup on the sheet)
  const im = IMG.gui_cup, k = gh / im.height, bw = 58;
  const hx = G.x + (0.61 - .48) * im.width * k, hy = G.y - 4 - G.h - gh * (1 - squash) * (1 - .66);
  drawBowl(ctx, hx - 30, hy - 10, bw, { shadow: false }); drawBowl(ctx, hx + 30, hy - 4, bw, { shadow: false });
  drawSteam(ctx, hx - 30, hy - 14, t, .5, { n: 1, h: 120, a: .5 }); drawSteam(ctx, hx + 30, hy - 8, t + 1.3, .5, { n: 1, h: 120, a: .5 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
