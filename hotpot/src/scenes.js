// ---------------------------------------------------------------------------
// Scenes. Each scene is f(ctx, t). Static paint is cached in offscreen canvases.
// ---------------------------------------------------------------------------
const SCENES = {};
const CACHE = {};
function cached(key, w, h, fn) { if (!CACHE[key]) { const c = mkCanvas(w, h), g = c.getContext('2d'); fn(g); CACHE[key] = c; } return CACHE[key]; }
// simple perspective for floor-plan staging: X (screen-x at depth 0), Y (screen-y at depth 0), Z depth (+ away)
function mkProj(CX, CY, F) { return (X, Y, Z) => { const s = F / (F + Z); return [CX + (X - CX) * s, CY + (Y - CY) * s, s]; }; }
// periodic blinks: returns 0..1 lid closure added on top of a pose
function blinkAt(t, seed, period = 3.6) { const ph = ((t + hash1(seed) * period) % period) / period; const d = ph * period; return d < .14 ? Math.sin(d / .14 * Math.PI) : 0; }
function plaster(g, x, y, w, h, c1, c2, seed) { const p = new Path2D(); p.rect(x, y, w, h); const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); wc(g, p, gr, { grain: .25, bloom: .2, seedX: seed }); }
function planks(g, x0, x1, y0, y1, vx, vy, n, col) {
  const p = new Path2D(); p.rect(x0, y0, x1 - x0, y1 - y0); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, shade(col, -.15)); gr.addColorStop(1, col); wc(g, p, gr, { grain: .3, bloom: .2 });
  g.save(); g.clip(p); g.strokeStyle = 'rgba(90,50,20,.45)'; g.lineWidth = 2.5;
  for (let i = -n; i <= 2 * n; i++) { const xb = x0 + (x1 - x0) * i / n; g.beginPath(); g.moveTo(xb, y1); g.lineTo(lerp(xb, vx, (y1 - y0) / (y1 - vy)), y0); g.stroke(); }
  g.restore();
}

// ===================== 03 · THE DOORWAY ==========================================
const DOOR = { AMAX: 1.40, ZOOM: 1.25, ZX: 520, ZY: 1138, CX: 380, CY: 880, F: 1500, FLOOR: 1400, hinge: 200, width: 600, handle: 560, handleY: 1235, archY: x => 470 - Math.sin(clamp((x - 200) / 600) * Math.PI) * 140 };
const dproj = mkProj(DOOR.CX, DOOR.CY, DOOR.F);
function doorAngle(t) {
  const o = ease(prog('d.open', t)); let a = o * DOOR.AMAX;
  a += spring(t, ACT['w.grip'].t, .035, 18, 7);           // grip tightens → door jolts
  a -= spring(t, ACT['d.open'].t + ACT['d.open'].d, .02, 10, 5);
  return a;
}
const doorHandle = a => [DOOR.hinge + DOOR.handle * Math.cos(a), -DOOR.handle * Math.sin(a)];
const wuPlan = a => { const h = doorHandle(a); return [h[0] + 110, h[1] - 30]; };
let WU_PATH = null;
function wuPathTable() {
  if (WU_PATH) return WU_PATH; const N = 240, A = [], S = []; let s = 0, prev = wuPlan(0);
  for (let i = 0; i <= N; i++) { const a = 1.70 * i / N, p = wuPlan(a); s += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; A.push(a); S.push(s); }
  WU_PATH = { A, S, L: s }; return WU_PATH;
}
function pathS(a) { const T = wuPathTable(); const i = clamp(Math.floor(a / 1.70 * 240), 0, 239), u = clamp(a / 1.70 * 240 - i); return lerp(T.S[i], T.S[i + 1], u); }

function wuDoorPose(t) {
  const a = doorAngle(t), aOpen = ease(prog('d.open', t)) * DOOR.AMAX;
  const T = wuPathTable(), Lend = pathS(DOOR.AMAX), Ls = Lend / 7;      // 7 whole steps → ends planted
  const pre = ease(clamp((t - 20.0) / .6)), preS = (1 - pre) * 180;  // shuffles in from the right
  const s = pathS(aOpen) - preS;
  const W0 = wuPlan(aOpen), W1 = wuPlan(Math.min(1.70, aOpen + .02)); let dir = [W1[0] - W0[0], W1[1] - W0[1]]; const dl = Math.hypot(...dir) || 1; dir = [dir[0] / dl, dir[1] / dl];
  if (aOpen < .002) dir = [-1, 0]; if (aOpen >= DOOR.AMAX - .001) dir = [-0.62, -0.78];
  const G = gait(s, Ls, 26);
  // dash out (after releasing the door)
  const dash = prog('w.dash', t), dashS = ease(dash) * 900;
  let plan = [W0[0] - dashS * .85 + preS, W0[1] - dashS * .35];
  const Gd = gait(dashS, 110, 34);
  const g = dash > 0 ? Gd : G, dirM = dash > 0 ? [-.92, -.38] : dir;
  const [sx, sy, sc] = dproj(plan[0], DOOR.FLOOR, plan[1]);
  const k = .95 * sc;
  const back = prog('w.back', t), backE = ease(back);
  const P = { x: sx, y: sy, k };
  // feet: projected from floor plan so planted feet stay fixed on the floorboards
  const footW = (d, side) => { const fp = [plan[0] + dirM[0] * d.dx + side * 58, plan[1] + dirM[1] * d.dx]; const q = dproj(fp[0], DOOR.FLOOR, fp[1]); const L = toLocal({ x: sx, y: sy, k }, q[0], q[1]); return [L[0], L[1] - d.lift]; };
  let fL = footW(g.B, -1), fR = footW(g.A, 1);
  // settling steps after the walk: each foot steps back under the body (lift → plant)
  for (const [key, t0, home] of [['L', 24.3, [-62, 0]], ['R', 24.62, [62, 0]]]) {
    const u = clamp((t - t0) / .32); if (u <= 0 || dash > 0) continue; const f = key === 'L' ? fL : fR, e = u * u * (3 - 2 * u);
    const v = [lerp(f[0], home[0], e), lerp(f[1], home[1], e) - Math.sin(Math.PI * u) * 18]; if (key === 'L') fL = v; else fR = v;
  }
  // weight back on realization: front foot lifts and re-plants behind
  if (back > 0) { const lift = hump(back) * 22; fR = [fR[0] - backE * 46, fR[1] - lift + backE * 4]; }
  P.feet = { L: fL, R: fR };
  // body
  const walking = (prog('d.open', t) > 0 && prog('d.open', t) < 1) || (dash > 0 && dash < 1) || (pre > 0 && pre < 1);
  P.lift = walking ? g.bob * 9 : 0;
  P.sq = (walking ? g.contact * .05 : 0) + .012 * Math.sin(t * 2.2) - (prog('w.realize', t) > 0 ? hump(prog('w.realize', t)) * .05 : 0);
  P.lean = (walking ? g.sway * .045 : 0) - .03 * smooth(21.2, 22, t) * (1 - smooth(24.2, 24.8, t)) - backE * .11 * (1 - smooth(29.4, 30.2, t)) + (dash > 0 ? -.12 * hump(dash * 1.3) : 0) + ease(prog('w.down', t)) * .035 * (1 - backE);
  P.x -= backE * 16 * k * (1 - prog('w.dash', t));
  // head turn & eyes
  let turn = track([[20, -.45], [24.25, -.45], [24.8, .5], [29.5, .5], [30.0, -.65]], t);
  P.turn = turn;
  const realize = prog('w.realize', t);
  let open = .32 + .05 * Math.sin(t * 1.3);
  open = lerp(open, .42, smooth(24.3, 24.9, t));
  if (t > 27.1 && t < 27.6) open = lerp(.42, 0, hump(prog('w.blink2', t)));   // the heavy, slow blink
  open = lerp(open, 1, easeOut(realize));
  open *= 1 - hump(prog('w.blink1', t));
  P.eye = { open, lx: 0, ly: 0, style: realize > 0 ? 'wide' : 'n', wide: realize > 0 ? lerp(1, .55, smooth(28.6, 30, t)) : 0 };
  const look = track([[20, [-.7, .1]], [24.3, [-.7, .1]], [24.75, [.75, -.45]], [26.55, [.75, -.45]], [27.05, [.85, .45]], [29.5, [.85, .45]], [29.9, [-.8, .25]]], t);
  P.eye.lx = look[0]; P.eye.ly = look[1];
  if (dash > 0) { P.eye.lx = -.9; P.eye.ly = .1; }
  // mouth: groggy → yawn → small smile → flat → O of realization
  const yawn = hump(clamp((t - 22.2) / 1.2));
  if (realize > 0) P.mouth = { shape: 'o', open: lerp(.15, 1, easeOut(clamp((t - 27.9) / .35))) * (1 - .3 * smooth(29.5, 30.5, t)) };
  else if (yawn > .05) P.mouth = { shape: 'o', open: yawn };
  else if (t > 24.6 && t < 26.55) P.mouth = { shape: 'smile', open: 0 };
  else P.mouth = { shape: 'flat', wob: 1.4 };
  P.blush = realize > 0 ? .4 : 0;
  // sprout: follow-through after head moves
  P.leaf = spring(t, ACT['d.grip'].t, .08) + spring(t, 24.6, -.12) + spring(t, ACT['w.realize'].t + .05, .5, 11, 3.2) + (walking ? g.sway * .05 : 0) + spring(t, 29.8, -.25);
  // hands
  const hd = doorHandle(a), hs = dproj(hd[0], DOOR.handleY, hd[1]); const handleL = toLocal(P, hs[0], hs[1]);
  const reach = ease(prog('d.reach', t)), release = ease(clamp((t - 30.5) / .3));
  const restL = [-146, -82];
  let hL = [lerp(restL[0], handleL[0], reach), lerp(restL[1], handleL[1], reach)];
  hL = [lerp(hL[0], restL[0] + (dash > 0 ? Gd.swing * 30 : 0), release), lerp(hL[1], restL[1], release)];
  let hR = [146, -82];
  if (yawn > .05) hR = [lerp(146, 40, yawn), lerp(-82, -128, yawn)];                               // covers the yawn
  if (realize > 0) { const sh = smooth(27.9, 28.15, t) * (1 - smooth(29.4, 30, t)); hR = [lerp(146, 150, sh), lerp(-82, -178, sh)]; } // hand flies up beside the cheek
  if (dash > 0) hR = [146 - Gd.swing * 30, -84];
  P.hands = { L: hL, R: hR };
  P.grip = { L: reach > .9 && release < .5 ? (.35 + .65 * smooth(27.88, 28.05, t) * (1 - .3 * smooth(28.6, 29.5, t))) : 0 };
  if (dash > 0 && dash < 1) P.armSwing = Gd.swing;
  P.cape = 'off'; P.alpha = 1;
  return P;
}
function friendsDoor(t) {
  const out = [];
  // 歸歸
  { const [x, y, sc] = dproj(548, DOOR.FLOOR, 270); const P = { x, y, k: sc * 1.22, tt: t };
    P.sway = Math.sin(t * 1.1) * .4; P.turn = -.25;
    P.eye = { open: 1 - blinkAt(t, 3), lx: -.6, ly: .2 }; P.mouth = { shape: 'smile', open: 0 };
    const wave = clamp((t - 24.2) / 1.6); if (wave > 0 && wave < 1) { P.hands = { L: [-104, -104], R: [120, lerp(-104, -240, hump(wave)) + Math.sin(wave * 18) * 8 * hump(wave)] }; P.mouth = { shape: 'smile', open: .5 * hump(wave) }; }
    if (t > 25.9) P.hands = { L: [-30, -120], R: [30, -120] };                                       // hands clasped
    if (t > 28.3) { P.eye = { style: 'happy' }; P.mouth = { shape: 'smile', open: .45 }; P.lift = Math.abs(Math.sin((t - 28.3) * 7)) * 5 * (t < 30 ? 1 : 0); }
    P.crown = spring(t, 24.3, .05) + Math.sin(t * 1.4) * .01;
    out.push(['gui', P]); }
  // 杞杞 with the invitation
  { const [x, y, sc] = dproj(668, DOOR.FLOOR, 10); const P = { x, y, k: sc * 1.22, turn: -.5 };
    const r = prog('q.raise', t), antic = t > 24.35 && t < 24.6 ? hump((t - 24.35) / .25) : 0;
    P.sq = antic * .07 - hump(r) * .03; P.lift = hump(r) * 10;
    const cardUp = easeOutBack(r);
    const talk = mouthOpen('qi', t);
    P.eye = { open: 1 - blinkAt(t, 9, 3.1), lx: -.7, ly: -.1, style: talking('qi', t) && t > VOICE.qi.t + .9 ? 'happy' : 'n' };
    P.mouth = { shape: talking('qi', t) ? 'open' : 'smile', open: talking('qi', t) ? talk : 0 };
    P.hands = { L: [lerp(-84, -120, cardUp), lerp(-104, -150, cardUp)], R: [84, -104] };
    if (t > 26.4) P.hands.L = [lerp(-120, -116, smooth(26.4, 26.9, t)), lerp(-150, -112, smooth(26.4, 26.9, t))]; // offers it lower
    P.hold = { L: (g, hx, hy) => { if (t < 24.3) return; drawCard(g, hx - 16, hy + 14, 70, -.12 + spring(t, 24.85, .12, 12, 6)); } };
    if (t < 24.3) P.hold = { L: (g, hx, hy) => drawCard(g, hx + 10, hy + 6, 62, .25, {}) };
    const gg = prog('q.giggle', t); if (gg > 0) { P.lift = Math.abs(Math.sin(gg * Math.PI * 3)) * 16 * (1 - gg); P.eye = { style: 'happy' }; P.mouth = { shape: 'open', open: .6 }; }
    P.knot = Math.sin(t * 3) * .5;
    out.push(['qi', P]); }
  return out;
}
function buildDoorScene() {
  return cached('door', W, H, g => {
    const { CX, CY, FLOOR } = DOOR;
    plaster(g, 0, 0, W, FLOOR, '#f6e2bc', '#ebcf9c', 1);
    // floor planks converging to the vanishing point
    planks(g, -400, W + 400, FLOOR, H, CX, CY, 14, '#b47c48');
    // round rag rug by the door
    g.save(); g.translate(600, 1700); g.scale(1, .3); for (let r = 9; r >= 1; r--) { g.fillStyle = ['#e9b08f', '#f4e4c8', '#d9907c', '#f0d6a8'][r % 4]; g.beginPath(); g.arc(0, 0, r * 38, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,80,50,.35)'; g.lineWidth = 3; g.setLineDash([6, 8]); g.stroke(); } g.setLineDash([]); g.restore();
    // wainscot strip
    g.fillStyle = 'rgba(140,90,50,.35)'; g.fillRect(0, FLOOR - 60, W, 12);
    // door frame (thick wooden jambs + arch)
    const fr = new Path2D(); fr.moveTo(150, FLOOR); fr.lineTo(150, 470); for (let i = 0; i <= 30; i++) { const x = lerp(150, 850, i / 30); fr.lineTo(x, DOOR.archY(lerp(200, 800, i / 30)) - 55); } fr.lineTo(850, FLOOR); fr.lineTo(800, FLOOR); fr.lineTo(800, 470);
    for (let i = 30; i >= 0; i--) { const x = lerp(200, 800, i / 30); fr.lineTo(x, DOOR.archY(x)); } fr.lineTo(200, FLOOR); fr.closePath();
    wc(g, fr, '#8a5a34', { grain: .35, edge: '#5a3518', edgeW: 4, out: INK, outW: 3 });
    // coat hook with the burgundy cape (continuity for shot 04) and slippers
    g.fillStyle = '#6a4424'; g.fillRect(930, 640, 110, 14);
    const cp = new Path2D(); cp.moveTo(965, 650); cp.quadraticCurveTo(930, 760, 940, 900); cp.quadraticCurveTo(990, 920, 1040, 900); cp.quadraticCurveTo(1040, 760, 1005, 650); cp.closePath();
    wc(g, cp, '#8b3438', { grain: .3, edge: '#5a1c1e', edgeW: 4, out: INK, outW: 3 });
    g.strokeStyle = '#e2a443'; g.lineWidth = 6; g.beginPath(); g.moveTo(940, 896); g.quadraticCurveTo(990, 916, 1040, 896); g.stroke();
    flower5(g, 990, 690, 12, '#f0b440', '#c4553e', INK);
    for (const [x, y] of [[930, 1530], [1000, 1545]]) { const s = new Path2D(); s.moveTo(x - 36, y); s.quadraticCurveTo(x - 36, y - 26, x, y - 24); s.quadraticCurveTo(x + 34, y - 22, x + 36, y); s.quadraticCurveTo(x, y + 8, x - 36, y); wc(g, s, '#8e5a32', { grain: .3, out: INK, outW: 2.5 }); flower5(g, x + 4, y - 14, 7, '#f2c14e', '#e07a3a', INK); }
    // little shelf + plant on the left wall
    g.fillStyle = '#7a4e2c'; g.fillRect(20, 700, 110, 12); const pot = new Path2D(); pot.moveTo(45, 700); pot.lineTo(105, 700); pot.lineTo(98, 650); pot.lineTo(52, 650); pot.closePath(); wc(g, pot, '#c98a5a', { out: INK, outW: 2 });
    for (let i = 0; i < 5; i++) drawGinkgo(g, 75 + (i - 2) * 14, 650, 30, (i - 2) * .4, '#93a24e');
  });
}
function buildOutside() {
  return cached('outside', W, H, g => {
    const sky = g.createLinearGradient(0, 200, 0, 1100); sky.addColorStop(0, '#a9cde0'); sky.addColorStop(.6, '#dbe9e6'); sky.addColorStop(1, '#f3e8cc');
    g.fillStyle = sky; g.fillRect(0, 0, W, H); const r = mulberry32(41);
    for (let i = 0; i < 5; i++) { g.globalAlpha = .5; g.fillStyle = '#fffaf0'; g.fill(blob(200 + r() * 700, 420 + r() * 200, 90, 20, r, .25)); } g.globalAlpha = 1;
    const ridge = (y0, amp, col, sd) => { const p = new Path2D(); p.moveTo(0, 1400); for (let x = 0; x <= W; x += 30) p.lineTo(x, y0 + Math.sin(x * .006 + sd) * amp + Math.sin(x * .017 + sd) * amp * .4); p.lineTo(W, 1400); p.closePath(); wc(g, p, col, { grain: .2, bloom: .15, edge: shade(col, -.15), edgeW: 5, edgeA: .3 }); };
    ridge(800, 50, '#a7bdcb', 1); ridge(860, 35, '#98b2b0', 2);
    const lake = new Path2D(); lake.rect(0, 930, W, 160); const lg = g.createLinearGradient(0, 930, 0, 1090); lg.addColorStop(0, '#8fbcd2'); lg.addColorStop(1, '#6a9fbe'); wc(g, lake, lg, { grain: .2 });
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; for (let i = 0; i < 30; i++) { const x = r() * W, y = 940 + r() * 140; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r() * 40, y); g.stroke(); }
    meadowLite(g, 1060, 1500, 42);
    // stone path from the doorstep
    for (let i = 0; i < 9; i++) { const u = i / 8, y = lerp(1395, 1080, Math.pow(u, .8)), x = lerp(520, 470, u), s = lerp(1, .3, u); rock(g, x + (i % 2 ? 40 : -40) * s, y, 90 * s, 28 * s, r, { moss: false, light: '#d6cbb6', dark: '#a69886' }); }
    // ginkgo branches overhead, flower pot, outdoor lantern post
    for (let i = 0; i < 160; i++) { const a = r() * 6.283, d = Math.sqrt(r()); drawGinkgo(g, 660 + Math.cos(a) * 330 * d, 350 + Math.sin(a) * 140 * d, 22 + r() * 14, r() * 6.28, ['#f4c63c', '#f8d867', '#e9a92c'][i % 3], { detail: r() < .4 }); }
    g.strokeStyle = '#6e4a2c'; g.lineWidth = 12; g.beginPath(); g.moveTo(1000, 200); g.quadraticCurveTo(800, 330, 520, 360); g.stroke();
    const fp = new Path2D(); fp.moveTo(700, 1395); fp.lineTo(790, 1395); fp.lineTo(810, 1320); fp.lineTo(680, 1320); fp.closePath(); wc(g, fp, '#c98a5a', { out: INK, outW: 2.5 });
    for (let i = 0; i < 9; i++) flower5(g, 690 + r() * 110, 1300 - r() * 50, 12, '#fffaf0', '#f2c14e', '#b98a5a', r());
  });
}
function meadowLite(g, y0, y1, seed) {
  const r = mulberry32(seed); const p = new Path2D(); p.rect(0, y0, W, y1 - y0); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#c3c27a'); gr.addColorStop(1, '#9fae5a'); wc(g, p, gr, { grain: .25, bloom: .2 });
  for (let i = 0; i < 500; i++) { const x = r() * W, y = y0 + r() * (y1 - y0), d = (y - y0) / (y1 - y0); grassBlade(g, x, y, 6 + d * 20, (r() - .5) * 8, 1 + d * 1.5, ['#8c9e4c', '#b6b864', '#7b8e40', '#c7b85a'][i % 4]); }
  for (let i = 0; i < 30; i++) flower5(g, r() * W, y0 + 20 + r() * (y1 - y0 - 20), 4 + r() * 5, r() < .7 ? '#fffaf0' : '#f2a49a', '#f2b33a', 'rgba(150,120,70,.6)', r() * 6);
}
function doorOpening() { const p = new Path2D(); p.moveTo(200, DOOR.FLOOR); p.lineTo(200, DOOR.archY(200)); for (let i = 0; i <= 30; i++) { const x = lerp(200, 800, i / 30); p.lineTo(x, DOOR.archY(x)); } p.lineTo(800, DOOR.FLOOR); p.closePath(); return p; }
function drawDoorPanel(ctx, a, t) {
  const N = 12, top = [], bot = [];
  for (let i = 0; i <= N; i++) { const u = i / N, X = DOOR.hinge + u * DOOR.width * Math.cos(a), Z = -u * DOOR.width * Math.sin(a), x0 = DOOR.hinge + u * DOOR.width; top.push(dproj(X, DOOR.archY(x0), Z)); bot.push(dproj(X, DOOR.FLOOR, Z)); }
  const p = new Path2D(); p.moveTo(top[0][0], top[0][1]); top.forEach(q => p.lineTo(q[0], q[1])); for (let i = N; i >= 0; i--) p.lineTo(bot[i][0], bot[i][1]); p.closePath();
  // thickness on the free edge
  const th = 34, nx = Math.sin(a) * th, nz = Math.cos(a) * th, eT = top[N], eB = bot[N];
  const X1 = DOOR.hinge + DOOR.width * Math.cos(a), Z1 = -DOOR.width * Math.sin(a);
  const eT2 = dproj(X1 + nx, DOOR.archY(800), Z1 + nz), eB2 = dproj(X1 + nx, DOOR.FLOOR, Z1 + nz);
  const edge = new Path2D(); edge.moveTo(eT[0], eT[1]); edge.lineTo(eT2[0], eT2[1]); edge.lineTo(eB2[0], eB2[1]); edge.lineTo(eB[0], eB[1]); edge.closePath();
  wc(ctx, edge, '#6e4426', { grain: .3, out: INK, outW: 2.5 });
  const gr = ctx.createLinearGradient(top[0][0], 0, top[N][0], 0); gr.addColorStop(0, '#7a4c2a'); gr.addColorStop(1, '#9a6a3e');
  wc(ctx, p, gr, { grain: .35, bloom: .15, edge: '#4e2c12', edgeW: 4, out: INK, outW: 3 });
  ctx.save(); ctx.clip(p); ctx.strokeStyle = 'rgba(60,30,10,.5)'; ctx.lineWidth = 2.5;
  for (let k = 1; k < 6; k++) { const u = k / 6, X = DOOR.hinge + u * DOOR.width * Math.cos(a), Z = -u * DOOR.width * Math.sin(a), x0 = DOOR.hinge + u * DOOR.width; const q1 = dproj(X, DOOR.archY(x0), Z), q2 = dproj(X, DOOR.FLOOR, Z); ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); }
  for (const Y of [760, 1150]) { ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(70,40,15,.55)'; ctx.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N, q = dproj(DOOR.hinge + u * DOOR.width * Math.cos(a), Y, -u * DOOR.width * Math.sin(a)); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
  ctx.restore();
  // ring handle
  const hd = doorHandle(a), hs = dproj(hd[0], DOOR.handleY, hd[1]); const s = hs[2];
  ctx.save(); ctx.translate(hs[0], hs[1]); ctx.scale(Math.max(.25, Math.cos(a)) * .55 + .45, 1);
  const plate = new Path2D(); plate.ellipse(0, -28 * s, 20 * s, 20 * s, 0, 0, 7); wc(ctx, plate, '#b98a3a', { out: INK, outW: 2.5 });
  ctx.strokeStyle = '#a77a2a'; ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.arc(0, 0, 30 * s, 0, 7); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 34 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 26 * s, 0, 7); ctx.stroke();
  ctx.restore();
}
SCENES.door = (ctx, t) => {
  const Z = DOOR.ZOOM; ctx.setTransform(Z, 0, 0, Z, W / 2 - DOOR.ZX * Z, H / 2 - DOOR.ZY * Z);
  ctx.drawImage(buildDoorScene(), 0, 0);
  const a = doorAngle(t);
  // the outside, seen through the opening
  ctx.save(); ctx.clip(doorOpening());
  ctx.drawImage(buildOutside(), 0, 0);
  fallingLeavesSimple(ctx, t, 6, 5, { x: 200, y: 250, w: 600, h: 1100 }, 1);
  for (const [who, P] of friendsDoor(t)) RIG[who](ctx, P);
  // warm light spilling in
  ctx.restore();
  if (a > .05) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const lp = new Path2D(); lp.moveTo(200, DOOR.FLOOR); lp.lineTo(800, DOOR.FLOOR); lp.lineTo(1000, 1920); lp.lineTo(260, 1920); lp.closePath(); ctx.globalAlpha = .22 * clamp(a / 1.2); ctx.fillStyle = '#ffe6b0'; ctx.fill(lp); ctx.restore(); }
  drawDoorPanel(ctx, a, t);
  RIG.wu(ctx, wuDoorPose(t));
  // shock marks at the realization
  const rz = prog('w.realize', t); if (rz > 0 && t < 29.4) { const P = wuDoorPose(t); const hd = toWorld(P, 40, -300); drawSparkle(ctx, hd[0] + 60, hd[1], 1.6, hump(clamp((t - 27.85) / 1.4)), '#f2b33a', .1); }
  const lk = prog('w.look', t); if (lk > 0 && t < 30.8) { const P = wuDoorPose(t); const hd = toWorld(P, -60, -300); drawSparkle(ctx, hd[0] - 50, hd[1], 1.5, hump(lk), '#e8664a', -.6); }
};
function fallingLeavesSimple(ctx, t, n, seed, A, sc) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) { const per = 8 + r() * 6, ph = r(), x0 = A.x + r() * A.w; const u = (t / per + ph) % 1; drawGinkgo(ctx, x0 + Math.sin(t * .9 + i) * 30 + u * 50, A.y + u * A.h, (18 + r() * 10) * sc, t * (r() - .5) * 3 + i, ['#f4c63c', '#f8d867', '#e9a92c'][i % 3], { squash: .4 + .6 * Math.abs(Math.cos(t * 2 + i)) }); }
}
function buildScenes() { buildDoorScene(); buildOutside(); wuPathTable(); buildEnvelopes(); }
