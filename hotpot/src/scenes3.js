// ---------------------------------------------------------------------------
// Shots 08–12: the ginkgo tree, the hot pot, the cups, dusk, fireworks.
// One picnic world is shared by 08, 09 and 11 so seats and props stay put.
// ---------------------------------------------------------------------------
const SEAT = { // world positions (feet) and scales
  zao: [230, 1030, .88], qi2: [545, 1030, .88], shan: [850, 1030, .88],
  di: [150, 1255, 1.0], gui: [345, 1250, 1.0], ma: [880, 1255, 1.0],
  wu: [330, 1505, 1.1], dou: [640, 1505, 1.1], qi: [905, 1505, 1.1],
};
const POT = { x: 565, y: 1185, w: 300 };
function buildPicnicWorld() {
  return cached('picnicworld', 2000, 3400, g => {
    g.translate(460, 1000); // world (-460..1540, -1000..2400)
    paintSky(g, -1000, 760, ['#9fc6dc', '#cfe1e6', '#f4e6c6']); paintClouds(g, 8, -700, 300, 111);
    paintRidge(g, 620, 60, '#a7bdcb', 8, -460, 1540); paintLake(g, 760, 940, 112); paintTrees(g, 700, 780, 30, 113, .8, -460, 1540);
    paintGround(g, 900, 2400, 114, ['#c3c27a', '#97a854'], 2200);
    // the big ginkgo tree behind the quilt
    const tr = new Path2D(); tr.moveTo(300, 980); tr.bezierCurveTo(330, 600, 300, 200, 360, -300); tr.lineTo(560, -300); tr.bezierCurveTo(600, 200, 600, 640, 660, 980); tr.quadraticCurveTo(480, 1010, 300, 980); tr.closePath();
    const tg = g.createLinearGradient(300, 0, 660, 0); tg.addColorStop(0, '#6e4a2c'); tg.addColorStop(.5, '#946a42'); tg.addColorStop(1, '#5c3c22'); wc(g, tr, tg, { grain: .45, edge: '#3e2614', edgeW: 6, out: INK, outW: 3 });
    g.strokeStyle = 'rgba(60,35,15,.45)'; g.lineWidth = 4; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(340 + i * 34, 960); g.bezierCurveTo(350 + i * 30, 600, 370 + i * 22, 200, 390 + i * 18, -300); g.stroke(); }
    g.strokeStyle = '#6e4a2c'; g.lineCap = 'round'; for (const [a, b, c, d, w] of [[[380, -100], [200, -260], [0, -300], [-300, -260], 40], [[540, -80], [760, -240], [1000, -260], [1400, -200], 40], [[460, -260], [400, -500], [300, -620], [200, -700], 30]]) { g.lineWidth = w; g.beginPath(); g.moveTo(...a); g.bezierCurveTo(...b, ...c, ...d); g.stroke(); }
    paintCanopy(g, 480, -560, 900, 380, 1300, 115, 1.5); paintCanopy(g, -200, -300, 420, 260, 400, 116, 1.4); paintCanopy(g, 1200, -320, 420, 260, 400, 117, 1.4);
    for (let i = 0; i < 120; i++) { const r = mulberry32(118 + i); drawGinkgo(g, -400 + r() * 1900, -60 + r() * 120, 26 + r() * 10, Math.PI + (r() - .5), '#f3c544'); }
    quiltQuad(g, 930, 1660, 0, 1080, -140, 1220, 5, 7, 119);
    const r = mulberry32(120); for (let i = 0; i < 22; i++) drawGinkgo(g, r() * 1080, 960 + r() * 680, 16 + r() * 8, r() * 6.3, PAL.gold, { squash: .6 });
  });
}
function drawWorld(ctx, cam) { setCam(ctx, cam.z, cam.x, cam.y); ctx.drawImage(buildPicnicWorld(), -460, -1000); }
function seatPose(who, t, o = {}) { const [x, y, k] = SEAT[who]; const P = { x, y, k, cape: 'on', tt: t, sprite: 'di_body', h: 160 }; idle(P, t, x * .01 + y); return P; }
const LANTERNS = [[60, 1640], [1040, 1650], [-60, 1180], [1130, 1200], [700, 960], [120, 960]];
function picnicCast(t, mode) {
  // mode: 'arrive' (08) | 'pot' (09) | 'dusk' (11)
  const L = [];
  // ---- the six already waiting
  for (const w of ['zao', 'qi2', 'shan', 'di', 'ma', 'dou']) {
    const P = seatPose(w, t); P.mouth = { shape: 'smile' };
    if (w === 'di') { P.eye = face(.2 + .1 * Math.sin(t), .3, .2); P.sprite = 'di_body'; }
    if (w === 'dou') { P.blanket = 1; P.hands = { L: [-56, -40], R: [52, -40] }; }
    if (w === 'qi2') { P.hands = { R: [70, -60], L: [-108, -94] }; }
    L.push([w, P]);
  }
  const by = Object.fromEntries(L.map(([w, P]) => [w, P]));
  if (mode === 'arrive') {
    // 棗棗 waves to the arriving three
    const wv = prog('t.wave', t); if (wv > 0 && wv < 1) { const P = by.zao; P.hands = { L: [-122, -88], R: [lerp(122, 140, hump(wv)), lerp(-88, -230, ease(clamp(wv * 4)) * (1 - ease(clamp((wv - .85) * 6.6)))) + Math.sin(wv * 30) * 10 * hump(wv)] }; P.eye = face(1, -.6, .3, wv > .2 ? 'happy' : 'n'); P.mouth = { shape: 'open', open: .5 }; P.lean = -.05; }
    for (const w of ['qi2', 'shan', 'ma', 'dou']) { const P = by[w]; P.eye = face(1, -.7, .4); P.turn = -.25; }
  }
  // ---- the three arrivals
  const arrivals = [['wu', 't.wu', 10, 2050], ['gui', 't.gui', 10, 1900], ['qi', 't.qi', 14, 2100]];
  for (const [w, id, nTot, y0] of arrivals) {
    const [sx, sy, k] = SEAT[w]; const P = { x: 0, y: 0, k, cape: 'on', tt: t };
    if (mode === 'arrive' && t < WALKS[id].keys[WALKS[id].keys.length - 1][0] + .05) {
      const n = walkN(id, t), Ls = 2 * HIP[w] * k, dir = w === 'qi' ? -1 : 1; P.x = sx - dir * nTot * Ls; walkPose(w, P, n, dir, walkMoving(id, t));
      P.y = lerp(y0, sy, n / nTot);
    } else { P.x = sx; P.y = sy; }
    P.turn = w === 'qi' ? -.25 : .25; P.eye = face(1, w === 'qi' ? -.5 : .5, -.3); P.mouth = { shape: 'smile' }; idle(P, t, sx);
    if (w === 'qi') P.hold = { L: (g, hx, hy) => drawCard(g, hx, hy + 20, 56, .3) };
    L.push([w, P]); by[w] = P;
  }
  if (mode === 'arrive') {
    const W0 = by.wu;
    const tense = 1 - ease(prog('t.release', t));
    W0.hands = { L: [lerp(-146, -126, tense), lerp(-82, -112, tense)], R: [lerp(146, 126, tense), lerp(-82, -112, tense)] }; W0.lift = (W0.lift || 0) + tense * 6; W0.sq = (W0.sq || 0) - tense * .02 + ease(prog('t.release', t)) * hump(prog('t.release', t)) * .06;
    W0.eye = face(lerp(.85, 1, ease(prog('t.slow', t))), .55, lerp(-.2, .35, ease(prog('t.slow', t))));
    const sm = ease(prog('t.smile', t)); if (sm > 0) { W0.eye = face(1, .2, .5, sm > .4 ? 'happy' : 'n'); W0.mouth = { shape: 'smile', open: sm * .5 }; W0.blush = sm * .6; }
    W0.leaf = spring(t, ACT['t.release'].t + .3, -.18) + (W0.sway || 0) * .06;
    if (t > ACT['t.sit'].t + 1.2) { W0.sq += .03; }
  }
  return { L, by };
}
function drawPicnicProps(ctx, t, glow = 0) {
  drawPot(ctx, POT.x, POT.y, POT.w, t);
  drawSteam(ctx, POT.x, POT.y - 6, t, 1.7, { n: 4, h: 280, a: .6, speed: .8 });
}
function drawCast(ctx, L) { L.slice().sort((a, b) => a[1].y - b[1].y).forEach(([w, P]) => RIG[w](ctx, P)); }

// ===================== 08 · ARRIVAL AT THE GINKGO TREE ===========================
SCENES.tree = (ctx, t) => {
  const u = ease(clamp((t - 79) / 12));
  const cam = { z: lerp(.62, .7, u), x: 540, y: lerp(700, 900, u) };
  drawWorld(ctx, cam);
  const { L, by } = picnicCast(t, 'arrive');
  // the empty place waiting for 烏烏: a cushion with a bowl
  const [sx, sy] = SEAT.wu; if (t < ACT['t.sit'].t + 1.0) { const c = new Path2D(); c.ellipse(sx, sy - 10, 120, 34, 0, 0, 7); fillShade(ctx, c, '#e8a28f', { grain: .15 }); ink(ctx, c, 3); drawBowl(ctx, sx + 70, sy - 60, 70); drawSteam(ctx, sx + 70, sy - 64, t, .7, { n: 2, h: 140 }); if (prog('t.smile', t) > 0) drawSparkle(ctx, sx + 80, sy - 200, 1.4, hump(clamp((t - 86.2) / 1.6)), '#f2b33a', .2); }
  const back = L.filter(([w, P]) => P.y < POT.y), front = L.filter(([w, P]) => P.y >= POT.y);
  drawCast(ctx, back); drawPicnicProps(ctx, t); drawCast(ctx, front);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ===================== 09 · SHARING THE HOT POT =================================
function hotpotState(t) {
  const { L, by } = picnicCast(t, 'pot');
  const Q = by.qi2, G = by.gui, Wu = by.wu;
  // 耆耆 ladles: dip → scoop → pour into 歸歸's bowl → back
  const lk = [[91.4, [653, 971, 2.0]], [92.0, [653, 971, 2.0]], [92.6, [653, 990, 2.05]], [93.1, [679, 926, 2.5]], [93.5, [660, 1000, 2.6]], [94.1, [660, 1011, 2.85]], [94.6, [653, 971, 2.0]]];
  const lad = track(lk, t);
  const gripL = toLocal(Q, lad[0], lad[1]); Q.hands = { R: gripL, L: [-108, -94] }; Q.grip = { R: .7 }; Q.lean = (lad[1] - 1000) * .0006;
  Q.eye = face(1, -.6, .9); Q.mouth = { shape: 'smile', open: .2 }; Q.turn = -.2;
  const pouring = t > 93.6 && t < 94.35;
  // the bowl: in 歸歸's hands → handed to 烏烏 → he drinks
  const p = prog('h.pass', t);
  const bowlG = [430, 1112], bowlW = [345, 1290], bowlMouth = [355, 1335];
  let bowl = bowlG, holdG = 1, holdW = 0;
  if (t >= ACT['h.pass'].t) { const e1 = ease(clamp(p / .42)); bowl = [lerp(bowlG[0], bowlW[0], e1), lerp(bowlG[1], bowlW[1], e1) - hump(clamp(p / .42)) * 20]; holdW = smooth(.25, .42, p); holdG = 1 - smooth(.6, .72, p); }
  const eat = prog('h.eat', t); if (eat > 0) { const sip = hump(clamp((eat - .1) / .5)) ; bowl = [lerp(bowlW[0], bowlMouth[0], sip), lerp(bowlW[1], bowlMouth[1] - 40, sip)]; }
  const fill = t < 93.6 ? 0 : clamp((t - 93.6) / .7);
  const bowlLocalG = (P) => toLocal(P, bowl[0], bowl[1] + 20);
  if (holdG > .02) { const c = bowlLocalG(G); G.hands = { L: [lerp(-104, c[0] - 42, holdG), lerp(-104, c[1], holdG)], R: [lerp(108, c[0] + 42, holdG), lerp(-104, c[1], holdG)] }; G.grip = { L: .5 * holdG, R: .5 * holdG }; }
  G.eye = face(1, t > 95.4 ? -.4 : .6, .6); G.turn = t > 95.4 ? -.1 : .3; G.mouth = { shape: 'smile', open: pouring ? .3 : .1 };
  if (holdW > .02 || t > ACT['h.pass'].t + 1.0) { const c = bowlLocalG(Wu); const h2 = t > ACT['h.pass'].t + .4 ? 1 : holdW; Wu.hands = { L: [lerp(-146, c[0] - 46, h2), lerp(-82, c[1], h2)], R: [lerp(146, c[0] + 46, h2), lerp(-82, c[1], h2)] }; Wu.grip = { L: .6 * h2, R: .6 * h2 }; }
  Wu.eye = face(1, .3, -.6); Wu.turn = .1; Wu.mouth = { shape: 'smile' };
  if (eat > 0) { const sip = hump(clamp((eat - .1) / .5)); Wu.eye = sip > .5 ? face(0, 0, 0, 'closed') : face(1, 0, .3); Wu.mouth = sip > .4 ? { shape: 'o', open: .3 } : { shape: 'smile', open: .3 }; Wu.blush = .6; }
  // everyone eats & laughs
  const la = prog('h.laugh', t);
  for (const [w, P] of L) {
    if (w !== 'di' && eat > 0 && la <= 0) { const ph = Math.sin((t - ACT['h.eat'].t) * 2.6 + P.x * .01); if (w !== 'wu' && w !== 'qi2' && w !== 'gui') P.mouth = { shape: ph > .3 ? 'o' : 'smile', open: Math.max(0, ph) * .5 }; }
    if (la > 0 && la < 1 && w !== 'di') { const e = hump(la); P.eye = face(1, 0, 0, 'happy'); P.mouth = { shape: 'open', open: .5 + .4 * Math.abs(Math.sin((t - ACT['h.laugh'].t) * 9 + P.x)) }; P.lift = (P.lift || 0) + Math.abs(Math.sin((t - ACT['h.laugh'].t) * 6 + P.x)) * 8 * e; P.blush = .5; }
    if (la > 0 && la < 1 && w === 'di') { P.sprite = 'di_yawn'; }
  }
  return { L, by, bowl, fill, lad, pouring, Q };
}
// helper so the ladle can be drawn in world space from inside a rig callback
let _WORLD_M = null; function ctxMatrix(g, which) { return _WORLD_M; }
SCENES.hotpot = (ctx, t) => {
  const u = clamp((t - 91) / 18);
  const cam = { z: lerp(1.0, 1.06, u), x: 565, y: lerp(1150, 1170, u) };
  drawWorld(ctx, cam); const m = ctx.getTransform(); _WORLD_M = [m.a, m.b, m.c, m.d, m.e, m.f];
  const S = hotpotState(t);
  const back = S.L.filter(([w, P]) => P.y < POT.y), front = S.L.filter(([w, P]) => P.y >= POT.y);
  drawCast(ctx, back.filter(([w]) => w !== 'qi2'));
  RIG.qi2(ctx, S.Q);
  drawPicnicProps(ctx, t);
  // the ladle (world space, in front of the pot) with 耆耆's hand on the grip
  drawLadle(ctx, S.lad[0], S.lad[1], 2.0, S.lad[2]); { const hp2 = new Path2D(); hp2.ellipse(S.lad[0], S.lad[1], 21 * .88, 19 * .88, 0, 0, 7); fillShade(ctx, hp2, '#f6e2a2'); ink(ctx, hp2, 3); }
  if (S.pouring) { const tip = [S.lad[0] + Math.cos(S.lad[2]) * 224 + Math.cos(S.lad[2] + 1.57) * 12, S.lad[1] + Math.sin(S.lad[2]) * 224 + Math.sin(S.lad[2] + 1.57) * 12]; ctx.save(); ctx.strokeStyle = 'rgba(200,130,50,.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo(tip[0] + 6, (tip[1] + S.bowl[1]) / 2, S.bowl[0] + 4, S.bowl[1] + 4); ctx.stroke(); ctx.restore(); }
  // bowl between hands: drawn before the front row so hands overlap it
  const bowlOver = (g) => { drawBowl(g, S.bowl[0], S.bowl[1], 74, { shadow: false }); if (S.fill > 0) { g.save(); g.globalAlpha = S.fill; g.fillStyle = '#c98a3e'; g.beginPath(); g.ellipse(S.bowl[0], S.bowl[1] + 2, 30, 8, 0, 0, 7); g.fill(); g.restore(); drawSteam(g, S.bowl[0], S.bowl[1] - 4, t, .6, { n: 2, h: 130, a: .5 * S.fill }); } };
  drawCast(ctx, front);
  bowlOver(ctx);
  if (S.by.wu.hands && t > ACT['h.pass'].t + .4) { for (const h of ['L', 'R']) { const q = toWorld(S.by.wu, S.by.wu.hands[h][0], S.by.wu.hands[h][1]); const hp2 = new Path2D(); hp2.ellipse(q[0], q[1], 26 * 1.1, 24 * 1.1, 0, 0, 7); fillShade(ctx, hp2, '#7c4f30', { tex: patImg(ctx, IMG.wu_tex, 1) }); ink(ctx, hp2, 3.4); } }
  if (S.by.gui.hands && t < ACT['h.pass'].t + 1.6 && t > ACT['h.ladle'].t - .6) { for (const h of ['L', 'R']) { const q = toWorld(S.by.gui, S.by.gui.hands[h][0], S.by.gui.hands[h][1]); const hp2 = new Path2D(); hp2.ellipse(q[0], q[1], 20, 18, 0, 0, 7); fillShade(ctx, hp2, '#f8e6b2'); ink(ctx, hp2, 3.2); } }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ===================== 10 · THE TWO SMALL CUPS ===================================
SCENES.cups = (ctx, t) => {
  // soft, blurred picnic behind
  const bb = getBuf('cupsbg'), g = bb.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
  drawWorld(g, { z: 1.5, x: 600, y: 1300 }); drawPicnicProps(g, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'blur(7px)'; ctx.drawImage(bb, 0, 0); ctx.filter = 'none';
  const ql = new Path2D(); ql.rect(0, 1380, W, 540); ctx.save(); ctx.clip(ql); const tiles = quiltTiles2(); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const pt = ctx.createPattern(tiles[['pink', 'cream', 'green', 'red', 'butter', 'rose'][(i + j * 2) % 6]], 'repeat'); pt.setTransform(new DOMMatrix().translateSelf(i * 200 - 60, 1380 + j * 200).scaleSelf(2.1, 2.1)); ctx.fillStyle = pt; ctx.fillRect(i * 200 - 60, 1380 + j * 200, 200, 200); } ctx.restore();
  const fade = ctx.createLinearGradient(0, 1300, 0, 1460); fade.addColorStop(0, 'rgba(120,140,80,.5)'); fade.addColorStop(1, 'rgba(120,140,80,0)'); ctx.fillStyle = fade; ctx.fillRect(0, 1300, W, 160);
  const face_ = prog('u.face', t), cl = prog('u.clink', t), sp = prog('u.sip', t), ml = prog('u.ma', t), dl = prog('u.dou', t);
  const M = { x: 320, y: 1640, k: 2.0, tt: t, turn: .45 }, D = { x: 790, y: 1660, k: 2.25, turn: -.45 };
  const lean = ease(clamp(face_ * 1.4)) * (1 - ease(clamp((t - ACT['u.clink'].t - 1.0) / .4)));
  M.lean = lean * .08; D.lean = -lean * .08;
  // playful face-off: narrowed eyes, side glance, tiny smirk
  M.eye = face(lerp(1, .5, lean), .9, 0); D.eye = face(lerp(1, .5, lean), -.9, 0);
  M.mouth = { shape: lean > .5 ? 'flat' : 'smile', wob: -1 }; D.mouth = { shape: lean > .5 ? 'flat' : 'smile', wob: -1 };
  // cups: rims meet once at the centre
  const meet = cl > 0 ? (cl < .62 ? ease(cl / .62) : 1 - ease((cl - .62) / .38) * .85) : 0, bounce = cl > .62 && cl < .75 ? -hump((cl - .62) / .13) * 10 : 0;
  const sip = hump(sp);
  const mc = [lerp(480, 534, meet) + bounce, lerp(1420, 1370, meet)], dc = [lerp(640, 588, meet) - bounce, lerp(1440, 1370, meet)];
  const mcSip = toWorld(M, 34, -128), dcSip = toWorld(D, -8, -78);
  const mcup = sip > 0 ? [lerp(mc[0], mcSip[0], sip), lerp(mc[1], mcSip[1], sip)] : mc, dcup = sip > 0 ? [lerp(dc[0], dcSip[0], sip), lerp(dc[1], dcSip[1], sip)] : dc;
  M.hands = { R: toLocal(M, mcup[0] - 34, mcup[1] + 34), L: [-116, -96] }; M.grip = { R: .7 };
  D.hands = { L: toLocal(D, dcup[0] - 40, dcup[1] + 30), R: toLocal(D, dcup[0] + 40, dcup[1] + 30) };
  if (sip > .3) { M.eye = face(0, 0, 0, 'closed'); D.eye = face(0, 0, 0, 'closed'); M.mouth = { shape: 'o', open: .2 }; D.mouth = { shape: 'o', open: .2 }; }
  // 麻麻 laughs first, 豆豆 follows
  if (ml > 0 && ml < 1) { M.eye = face(1, 0, 0, 'happy'); M.mouth = { shape: 'open', open: .55 + .4 * Math.abs(Math.sin((t - ACT['u.ma'].t) * 10)) }; M.lift = Math.abs(Math.sin((t - ACT['u.ma'].t) * 7)) * 10 * hump(ml); M.capFlop = Math.sin((t - ACT['u.ma'].t) * 7) * hump(ml); M.blush = .6; M.hands.L = [-60, -150]; }
  if (dl > 0 && dl < 1) { D.eye = face(1, 0, 0, 'happy'); D.mouth = { shape: 'open', open: .5 + .4 * Math.abs(Math.sin((t - ACT['u.dou'].t) * 11)) }; D.lift = Math.abs(Math.sin((t - ACT['u.dou'].t) * 8)) * 12 * hump(dl); D.blush = .6; }
  if (t > ACT['u.dou'].t + 2.6) { M.eye = face(1, .6, .1); D.eye = face(1, -.6, .1); M.mouth = { shape: 'smile', open: .3 }; D.mouth = { shape: 'smile', open: .3 }; }
  M.cap = Math.sin(t * 1.5) * .02 + spring(t, ACT['u.clink'].t + .56, .05); idle(M, t, 1); idle(D, t, 2);
  D.blanket = 1;
  RIG.ma(ctx, M); RIG.dou(ctx, D);
  for (const [P, side, col, r] of [[M, 'R', '#e5bf84', 24 * 2.0], [D, 'L', '#2b1914', 14 * 2.25], [D, 'R', '#2b1914', 14 * 2.25]]) { const q = toWorld(P, P.hands[side][0], P.hands[side][1]); const hp2 = new Path2D(); hp2.ellipse(q[0], q[1], r, r * .92, 0, 0, 7); fillShade(ctx, hp2, col, { light: [q[0] - r * .3, q[1] - r * .4, r] }); ink(ctx, hp2, 3.4, col === '#2b1914' ? '#120804' : INK); }
  drawCup(ctx, mcup[0], mcup[1], 74, sip * -.9 + (cl > .55 && cl < .7 ? .1 : 0)); drawCup(ctx, dcup[0], dcup[1], 70, sip * .9 - (cl > .55 && cl < .7 ? .1 : 0));
  if (cl > .6 && cl < .85) drawSparkle(ctx, 561, 1300, 1.3, hump((cl - .6) / .25), '#f2c14e', 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ===================== 11 · DUSK → BLUE HOUR ===================================
function grade(ctx, k) { // k: 0 day … 1 dusk … 2 blue hour … 3 night
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'multiply';
  const c = k < 1 ? [255, lerp(255, 205, k), lerp(255, 160, k), 1] : k < 2 ? [lerp(255, 120, k - 1), lerp(205, 140, k - 1), lerp(160, 210, k - 1), 1] : [lerp(120, 80, k - 2), lerp(140, 95, k - 2), lerp(210, 170, k - 2), 1];
  ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function lampsOn(t) { return [0, 1, 2, 3, 4, 5].map(i => ease(prog('lamp' + i, t))); }
SCENES.dusk = (ctx, t) => {
  const d = ease(prog('k.dusk', t)); const k = lerp(.9, 2.15, d);
  const cam = { z: .72, x: 540, y: 920 };
  drawWorld(ctx, cam);
  // more picnic groups gather along the lakeside
  const grp = ease(prog('k.groups', t)); const r = mulberry32(131);
  for (let i = 0; i < 9; i++) { const x = -300 + i * 210 + r() * 60, y = 905 + r() * 20, a = clamp(grp * 9 - i); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = a * .85; for (let j = 0; j < 3 + (i % 3); j++) { ctx.fillStyle = ['#5a4a5a', '#6a5040', '#4a5060'][j % 3]; ctx.beginPath(); ctx.ellipse(x + j * 26, y - 22, 13, 24, 0, 0, 7); ctx.fill(); } ctx.restore(); drawLanternOn(ctx, x + 40, y + 6, .35, a * smooth(.4, .9, d), t); }
  const { L } = picnicCast(t, 'dusk');
  for (const [w, P] of L) { const ph = Math.sin(t * .8 + P.x * .02); if (w !== 'di' && ph > .7) { P.eye = face(1, 0, 0, 'happy'); P.mouth = { shape: 'open', open: .4 }; } else if (w !== 'di') { P.eye = P.eye || face(); P.eye.lx = Math.sin(t * .3 + P.x) * .6; } if (w === 'qi' && t > 123.5) { P.hands = { L: [-84, -104], R: [100, -200] }; P.eye = face(1, .7, -.6); } }
  const back = L.filter(([w, P]) => P.y < POT.y), front = L.filter(([w, P]) => P.y >= POT.y);
  drawCast(ctx, back); drawPicnicProps(ctx, t); drawCast(ctx, front);
  grade(ctx, k);
  // lanterns glow on top of the grade
  setCam(ctx, cam.z, cam.x, cam.y); const on = lampsOn(t);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; LANTERNS.forEach(([x, y], i) => { if (on[i] > 0) { const g = ctx.createRadialGradient(x, y - 50, 5, x, y - 50, 260); g.addColorStop(0, `rgba(255,200,110,${.55 * on[i]})`); g.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = g; ctx.fillRect(x - 260, y - 310, 520, 520); } }); ctx.restore();
  LANTERNS.forEach(([x, y], i) => drawLanternOn(ctx, x, y, 1.1, on[i], t));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ===================== 12 · FIREWORKS ===========================================
const FW_COL = [['#ffd36a', '#fff3c0'], ['#ff9fb0', '#ffe1e8'], ['#9fe0ff', '#e6f8ff'], ['#ffb46a', '#fff0d0'], ['#c9a6ff', '#efe6ff']];
function fireworks(ctx, t, sky, reflectY, s = 1, reflect = true) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const c = ACT['fw' + i], d = t - c.t; if (d < 0 || d > 3) continue; const r = mulberry32(700 + i);
    const x = sky.x + r() * sky.w, y = sky.y + r() * sky.h * .6, col = FW_COL[i % FW_COL.length], R = (260 + r() * 150) * s;
    const draw = (mirror) => {
      const Y = (yy) => mirror ? reflectY + (reflectY - yy) * .55 : yy;
      if (d < 1) { const yy = lerp(reflectY - 20, y, easeOut(d)); ctx.strokeStyle = `rgba(255,230,180,${(1 - d) * .8})`; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x, Y(yy + 60 * s)); ctx.lineTo(x, Y(yy)); ctx.stroke(); return; }
      const b = d - 1, f = Math.max(0, 1 - b / 1.8);
      const g = ctx.createRadialGradient(x, Y(y), 0, x, Y(y), R * 1.4); g.addColorStop(0, `rgba(255,220,170,${.35 * f * (mirror ? .4 : 1)})`); g.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = g; ctx.fillRect(x - R * 1.4, Y(y) - R * 1.4, R * 2.8, R * 2.8);
      const n = 80; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + r() * .05, v = R * (.75 + .25 * hash1(k + i * 31)), ex = easeOut(clamp(b / 1.1)), px = x + Math.cos(a) * v * ex, py = y + Math.sin(a) * v * ex + b * b * 40 * s;
        ctx.strokeStyle = k % 2 ? col[0] : col[1]; ctx.globalAlpha = f * (mirror ? .35 : 1); ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(lerp(x, px, .7), Y(lerp(y, py, .7))); ctx.lineTo(px, Y(py)); ctx.stroke();
        if (b > .3) { ctx.fillStyle = col[1]; ctx.beginPath(); ctx.arc(px, Y(py), 4 * s * f, 0, 7); ctx.fill(); } }
      ctx.globalAlpha = 1;
    };
    draw(false); if (reflect) draw(true);
  }
  ctx.restore();
}
function fwFlash(t) { let f = 0; for (let i = 0; i < 8; i++) { const d = t - ACT['fw' + i].t - 1; if (d > 0 && d < 1.8) f = Math.max(f, (1 - d / 1.8)); } return f; }
function buildNight() {
  return cached('night', W, H, g => {
    paintSky(g, 0, 1100, ['#141a3e', '#26306a', '#4a4a86', '#7a5a86']); const r = mulberry32(141);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,250,230,${.3 + r() * .6})`; g.beginPath(); g.arc(r() * W, r() * 900, r() * 1.8 + .3, 0, 7); g.fill(); }
    paintRidge(g, 960, 45, '#2a3058', 9); paintTrees(g, 1020, 1080, 40, 142, .7); g.fillStyle = 'rgba(20,20,50,.5)'; g.fillRect(0, 980, W, 120);
    paintLake(g, 1080, 1380, 143, ['#2e3a72', '#1e2650']);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,210,130,${.4 + r() * .4})`; const x = r() * W; g.fillRect(x, 1080 + r() * 10, 3, 30 + r() * 60); }
    paintGround(g, 1360, 1920, 144, ['#3a4a3a', '#2a3628'], 700);
    quiltQuad(g, 1440, 1920, 20, 1060, -140, 1220, 3, 7, 145);
  });
}
const ROW = [['shan', 105, .74], ['zao', 220, .76], ['di', 330, .78], ['qi', 440, .8], ['wu', 545, .82], ['gui', 660, .8], ['qi2', 770, .78], ['ma', 880, .78], ['dou', 985, .78]];
SCENES.fireworks = (ctx, t) => {
  setCam(ctx, 1, 540, 960); ctx.drawImage(buildNight(), 0, 0);
  fireworks(ctx, t, { x: 140, y: 160, w: 800, h: 700 }, 1090, 1);
  const fl = fwFlash(t);
  for (const [w, x, k] of ROW) { const P = { x, y: 1720, k: k * 1.3, back: true, cape: 'on', tt: t, sprite: 'di_body', h: 150 }; P.sq = .01 * Math.sin(t * 1.6 + x); if (w === 'qi' || w === 'gui') P.lean = Math.sin(t * .9 + x) * .02; if (w === 'wu' && t > 141 && t < 146) P.turn = 0; RIG[w](ctx, P); }
  grade(ctx, 2.05 - fl * .45);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const rim = ctx.createLinearGradient(0, 1300, 0, 1920); rim.addColorStop(0, 'rgba(255,190,120,0)'); rim.addColorStop(1, 'rgba(255,190,120,.22)'); ctx.fillStyle = rim; ctx.fillRect(0, 1300, W, 620); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,200,150,${fl * .18})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  fireworks(ctx, t, { x: 140, y: 160, w: 800, h: 700 }, 1090, 1);
  for (const [x, y] of [[80, 1860], [1000, 1860]]) drawLanternOn(ctx, x, y, 1.6, 1, t);
};
SCENES.fw2 = (ctx, t) => {
  setCam(ctx, 1, 540, 960); paintSky(ctx, 0, H, ['#151b40', '#2a3470', '#5a4a80']);
  fireworks(ctx, t, { x: 100, y: 120, w: 880, h: 500 }, 1250, 1.1, false);
  const fl = fwFlash(t);
  const wl = mouthOpen('wu', t), gl = mouthOpen('gui', t);
  const Wp = { x: 330, y: 1700, k: 2.5, cape: 'on', tt: t }, Gp = { x: 790, y: 1720, k: 2.3, tt: t };
  const wTurn = smooth(141.5, 141.9, t), gTurn = smooth(143.0, 143.6, t), bothUp = smooth(145.0, 145.5, t);
  Wp.turn = lerp(.1, .55, wTurn) * (1 - bothUp) + .1 * bothUp; Wp.eye = face(1, lerp(.2, .9, wTurn) * (1 - bothUp), lerp(-.9, -.2, wTurn) * (1 - bothUp) - .9 * bothUp); Wp.mouth = talking('wu', t) ? { shape: 'talk', open: wl } : { shape: 'smile', open: .15 };
  Gp.turn = lerp(.1, -.55, gTurn) * (1 - bothUp); Gp.eye = face(1, lerp(.2, -.9, gTurn) * (1 - bothUp), lerp(-.9, -.1, gTurn) * (1 - bothUp) - .9 * bothUp); Gp.mouth = talking('gui', t) ? { shape: 'talk', open: gl } : { shape: 'smile', open: t > 144.6 ? .3 : .1 };
  if (t > 144.7) { Gp.eye = face(1, 0, 0, 'happy'); Wp.eye = t > 144.9 ? face(1, 0, 0, 'happy') : Wp.eye; Wp.mouth = { shape: 'smile', open: .35 }; Wp.blush = .6; Gp.blush = .6; }
  Wp.leaf = spring(t, 141.9, .1) + spring(t, 144.9, .15); Gp.crown = spring(t, 143.6, .05);
  idle(Wp, t, 1); idle(Gp, t, 2); if (t > 144.7) { Wp.eye.open = 1; }
  RIG.gui(ctx, Gp); RIG.wu(ctx, Wp);
  grade(ctx, 1.75 - fl * .45);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(540, 300, 50, 540, 300, 1600); g.addColorStop(0, `rgba(255,190,140,${.2 + fl * .25})`); g.addColorStop(1, 'rgba(255,190,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  fireworks(ctx, t, { x: 100, y: 120, w: 880, h: 500 }, 1250, 1.1, false);
};
