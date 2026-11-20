// ---------------------------------------------------------------------------
// The park: one world (1920×1080 units), one cast, one camera per shot.
// ---------------------------------------------------------------------------
const SEAT = { // feet position + scale. Same in every shot (continuity).
  wu: [800, 885, .66], gui: [620, 820, .6], shan: [700, 715, .52], zao: [850, 690, .5], qi: [1010, 675, .48],
  qi2: [1110, 860, .58], ma: [1250, 820, .58], dou: [1380, 835, .62], di: [1520, 930, .62],
};
const POT = { x: 960, y: 790, w: 170 };
const CUPW = 30;                                   // cup width in world px
const CUP = { wu: [712, 872], gui: [690, 832], shan: [748, 724], qi2: null, dou: [1452, 848] };
const ZAO_TRAY = [915, 702], ZAO_SPOT = [[938, 716], [884, 716]];
const BASKET = [784, 726];
const MA_SLAM = [1322, 828];
const LANTERNS = [[505, 935], [560, 705], [1185, 692], [1470, 722], [1650, 985], [1100, 985]];
const SUN = [260, -180];
const TREE = { x: 300, base: 652 };
// rig geometry: shoulder (x, y), arm radius, hand radius; default hand positions
const SH = { wu: [118, -128, 21, 26], gui: [86, -140, 16, 20], qi: [62, -150, 10, 15], ma: [96, -140, 20, 24], zao: [100, -122, 20, 24], shan: [70, -160, 16, 20], qi2: [88, -126, 17, 21], dou: [40, -70, 30, 0] };
const DEF = { wu: { L: [-146, -82], R: [146, -82] }, gui: { L: [-104, -104], R: [108, -104] }, qi: { L: [-84, -104], R: [84, -104] }, ma: { L: [-116, -96], R: [116, -96] }, zao: { L: [-122, -88], R: [122, -88] }, shan: { L: [-38, -150], R: [38, -150] }, qi2: { L: [-108, -94], R: [108, -94] }, dou: { L: [-84, -54], R: [84, -54] } };
const MOUTH = { wu: -126, gui: -170, qi: -171, ma: -136, zao: -129, shan: -165, qi2: -155, dou: -88 };
const HALFW = { wu: 150, gui: 120, qi: 76, ma: 104, zao: 112, shan: 90, qi2: 98, dou: 88 };
const reachOf = w => w === 'dou' ? 95 : armReach(SH[w][2], SH[w][3]);

// ---- time of day: 0 day … 1 dusk … 2 night --------------------------------------
const tod = t => t < 38.5 ? 0 : t < 41.5 ? ease((t - 38.5) / 3) : t < 44.5 ? 1 + ease((t - 41.5) / 3) : 2;

// ---- reaching: bend (squash + lean) just enough for the hand to get there --------
function bendFor(who, P, side, target) {
  const [sx, sy] = SH[who], R = reachOf(who) * .94, s = side === 'L' ? -1 : 1;
  for (let e = 0; e <= 1.0001; e += .05) {
    const Q = { ...P, sq: (P.sq || 0) + .26 * e, lean: (P.lean || 0) + s * .42 * e };
    const sw = toWorld(Q, s * sx, sy); if (Math.hypot(target[0] - sw[0], target[1] - sw[1]) <= R * Q.k) return e;
  }
  return 1;
}
// u: 0 rest → 1 at target. Applies bend and returns the hand (local coords).
function reachTo(who, P, side, target, u) {
  if (u <= 0) return null; const e = bendFor(who, P, side, target) * u, s = side === 'L' ? -1 : 1;
  P.sq = (P.sq || 0) + .26 * e; P.lean = (P.lean || 0) + s * .42 * e;
  const h = toLocal(P, target[0], target[1]), d = DEF[who][side];
  P.hands = P.hands || {}; P.hands[side] = [lerp(d[0], h[0], u), lerp(d[1], h[1], u)];
  return P.hands[side];
}
const handW = (P, side) => toWorld(P, P.hands[side][0], P.hands[side][1]);
// a cup held in a hand: rim sits above the mitten so the hand reads as gripping it
function holdCup(P, side, tilt = 0, fill = .7, hr = 24) { const k = P.k, w = CUPW / k; P.hold = P.hold || {}; P.hold[side + '0'] = (g, hx, hy) => { g.save(); g.translate(hx, hy - hr * .35); g.rotate(tilt); drawCup(g, 0, -w * .7, w, 0, fill); g.restore(); }; }  // mitten grips the cup's base
function holdBowl(P, side, tilt = 0, hr = 24) { const w = 40 / P.k; P.hold = P.hold || {}; P.hold[side + '0'] = (g, hx, hy) => { g.save(); g.translate(hx, hy - hr * .4); g.rotate(tilt); drawBowl(g, 0, -w * .4, w, { shadow: false }); g.restore(); }; }
function sipPose(who, P, side, u) { const s = side === 'L' ? -1 : 1; P.hands = P.hands || {}; const d = DEF[who][side]; P.hands[side] = [lerp(d[0], s * 34, u), lerp(d[1], MOUTH[who] + CUPW / P.k * .55, u)]; return -s * .75 * u; }

// ---- the herb bundle 何首烏 brings --------------------------------------------------
function drawBundle(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  for (const [dx, a] of [[-10, -.5], [0, 0], [10, .5]]) { const r = new Path2D(); r.ellipse(dx * .6, -18, 7, 22, a * .5, 0, 7); fillShade(ctx, r, '#7a4a2a', { grain: .25 }); ink(ctx, r, 2); }
  for (const a of [-.7, .7]) drawGinkgo(ctx, a * 10, -36, 18, a, '#93a24e', { detail: false });
  ctx.strokeStyle = '#c4553e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, -12); ctx.stroke();
  ctx.restore();
}

// =================================================================================
// CAST: every character's pose at time t
// =================================================================================
function seatP(w, t, extra = {}) { const [x, y, k] = SEAT[w]; const P = { x, y, k, cape: 'on', tt: t, ...extra }; return P; }
function walker(w, t, x1, y, k) {
  const W0 = WALKS[w], n = walkN(w, t), o = W0.o || {}, nTot = W0.keys[W0.keys.length - 1][1];
  const Ls = 2 * HIP[w] * k * (o.stride || 1); const P = { x: x1 - nTot * Ls, y, k, cape: 'on', tt: t };
  walkPose(w, P, n, 1, walkMoving(w, t), o); return P;
}
function settle(P, id, t) { const p = prog(id, t); if (p > 0) P.sq = (P.sq || 0) + hump(p) * .1 + ease(p) * .03; }
function lookUp(P, t, seed) { P.eye = face(1, Math.sin(t * .4 + seed) * .4, -.95); P.turn = 0; }
function fwBoomAt(t) { let f = 0; for (let i = 0; i < 9; i++) { const d = t - ACT['fw' + i].t - 1; if (d > 0 && d < 1.8) f = Math.max(f, 1 - d / 1.8); } return f; }

function castAt(t) {
  const C = {}, night = t >= 44.6, laughP = prog('laugh', t);
  const happy = (P, s = 1) => { P.eye = face(1, 0, 0, 'happy'); P.mouth = { shape: 'open', open: .5 * s }; P.blush = .5; };

  // ---------------- 何首烏
  { let P;
    if (t < WALKS.wu.keys[1][0]) { P = walker('wu', t, SEAT.wu[0], SEAT.wu[1], SEAT.wu[2]); P.turn = .35; P.eye = face(1, .6, -.1); P.mouth = { shape: 'smile', open: .2 }; P.leaf = (P.sway || 0) * .08; }
    else P = seatP('wu', t);
    // carries the herb bundle in his right hand until he drops it into the pot
    const dp = prog('w.drop', t);
    if (dp < .5) { P.hands = P.hands || {}; if (dp <= 0 && t < WALKS.wu.keys[1][0]) P.hands.R = [140 + (P.armSwing || 0) * 10, -86]; P.hold = { R0: (g, hx, hy) => drawBundle(g, hx + 4, hy + 6, 1 / P.k * .9, .2) }; }
    if (dp > 0) { const reach = dp < .45 ? ease(dp / .45) : dp < .6 ? 1 : 1 - ease((dp - .6) / .4); reachTo('wu', P, 'R', [POT.x - 52, POT.y - 22], reach); P.eye = face(1, .8, .5); P.mouth = { shape: 'smile', open: .3 }; }
    settle(P, 'sit.wu', t);
    // cup: picked up with the left hand, sipped, clinked with 歸歸, put down; picked up again at the end
    const pk = prog('all.pick', t), sp = prog('all.sip', t), cr = prog('c.raise', t), cl = prog('c.clink', t), dk = prog('c.drink', t), dn = prog('c.down', t);
    const hasCup = (t >= ACT['all.pick'].t + ACT['all.pick'].d * .75 && t < ACT['c.down'].t + ACT['c.down'].d * .7) || t >= ACT['p.pick'].t + ACT['p.pick'].d * .75;
    let tilt = 0;
    if (pk > 0 && pk < 1) reachTo('wu', P, 'L', [CUP.wu[0], CUP.wu[1] - 10], hump(pk) > 0 ? (pk < .75 ? ease(pk / .75) : 1 - ease((pk - .75) / .25) * .7) : 0);
    if (t >= ACT['all.pick'].t + ACT['all.pick'].d && t < ACT['c.raise'].t) { P.hands = { ...(P.hands || {}), L: [-118, -110] }; tilt = sipPose('wu', P, 'L', hump(sp)) ; if (sp > .3 && sp < .8) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } }
    if (cr > 0 && t < ACT['c.down'].t) { const meet = [lerp(730, 717, ease(cl)), 772 + (cl > .6 && cl < .9 ? -4 : 0)]; const e = ease(cr) * (1 - ease(dk * 3) * .9); if (e > .01) reachTo('wu', P, 'L', meet, e); P.turn = -.35; P.eye = face(1, -.8, -.3); P.mouth = { shape: 'smile', open: .3 }; if (dk > 0) { tilt = sipPose('wu', P, 'L', hump(dk)); if (dk > .2 && dk < .85) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } } }
    if (dn > 0 && dn < 1) reachTo('wu', P, 'L', [CUP.wu[0], CUP.wu[1] - 10], dn < .7 ? ease(dn / .7) : 1 - ease((dn - .7) / .3));
    if (hasCup) holdCup(P, 'L', tilt);
    P.wuHasCup = hasCup;
    // night: looks up; final: turns to everyone, warm smile, raises his cup
    if (night) { lookUp(P, t, 1); P.mouth = { shape: fwBoomAt(t) > .6 ? 'o' : 'smile', open: fwBoomAt(t) * .5 }; P.blush = .3; }
    const pt = prog('p.turn', t), pp = prog('p.pick', t), pr = prog('p.raise', t);
    if (pt > 0) { const e = ease(pt); P.turn = lerp(0, .45, e); P.eye = face(1, lerp(0, .85, e), lerp(-.95, .15, e)); P.mouth = { shape: 'smile', open: .2 }; P.blush = .6; }
    if (pp > 0 && pp < 1) reachTo('wu', P, 'L', [CUP.wu[0], CUP.wu[1] - 10], pp < .75 ? ease(pp / .75) : 1 - ease((pp - .75) / .25) * .6);
    if (pr > 0) { P.hands = { ...(P.hands || {}), L: [lerp(-120, -96, ease(pr)), lerp(-104, -168, ease(pr))] }; }
    if (t > ACT['p.raise'].t + .4) { P.eye = face(1, .7, .1, 'happy'); P.mouth = { shape: 'smile', open: .45 }; P.blush = .8; }
    if (laughP > 0 && laughP < 1 && !night) { happy(P, 1); P.lift = (P.lift || 0) + Math.abs(Math.sin((t - 37.9) * 7)) * 8 * hump(laughP); }
    P.leaf = (P.leaf || 0) + spring(t, ACT['sit.wu'].t + .3, .2) + spring(t, ACT['c.clink'].t + .3, .15) + spring(t, ACT['p.turn'].t + .5, .25) + Math.sin(t * 1.7) * .03;
    P.capeWave = Math.sin(t * 1.3) * .4;
    idle(P, t, 1); C.wu = P; }

  // ---------------- 歸歸
  { let P;
    if (t < WALKS.gui.keys[1][0]) { P = walker('gui', t, SEAT.gui[0], SEAT.gui[1], SEAT.gui[2]); P.turn = .3; P.eye = face(1, .5, 0); P.mouth = { shape: 'smile' }; }
    else P = seatP('gui', t);
    settle(P, 'sit.gui', t);
    const pk = prog('all.pick', t), sp = prog('all.sip', t), cr = prog('c.raise', t), cl = prog('c.clink', t), dk = prog('c.drink', t);
    let tilt = 0; const has = t >= ACT['all.pick'].t + ACT['all.pick'].d * .75;
    if (pk > 0 && pk < 1) reachTo('gui', P, 'R', [CUP.gui[0], CUP.gui[1] - 10], pk < .75 ? ease(pk / .75) : 1 - ease((pk - .75) / .25) * .7);
    if (t >= ACT['all.pick'].t + ACT['all.pick'].d) { P.hands = { ...(P.hands || {}), R: [92, -118] }; tilt = sipPose('gui', P, 'R', hump(sp)); if (sp > .3 && sp < .8) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } }
    if (cr > 0) { const e = ease(cr) * (1 - ease(dk * 3) * .9); if (e > .01) reachTo('gui', P, 'R', [lerp(672, 687, ease(cl)), 772], e); P.turn = .3; P.eye = face(1, .8, .2); P.mouth = { shape: 'smile', open: .3 };
      if (dk > 0) { tilt = sipPose('gui', P, 'R', hump(dk)); if (dk > .2 && dk < .85) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } } if (t > ACT['c.drink'].t + 1.2) happy(P, .8); }
    if (has) holdCup(P, 'R', tilt);
    if (t < 12) { P.eye = face(1, .2, 0); }
    if (night) lookUp(P, t, 2);
    if (t > 52 && t > ACT['p.raise'].t + .2) { P.turn = -.3; P.eye = face(1, -.8, .1, t > ACT['p.raise'].t + .7 ? 'happy' : 'n'); P.mouth = { shape: 'smile', open: .35 }; P.blush = .5; }
    if (laughP > 0 && laughP < 1 && !night) { happy(P); P.lift = (P.lift || 0) + Math.abs(Math.sin((t - 37.9) * 7 + 1)) * 6 * hump(laughP); }
    P.sway = (P.sway || 0) + Math.sin(t * 1.1) * .3; P.crown = Math.sin(t * 1.4) * .01 + spring(t, ACT['sit.gui'].t + .3, .04);
    idle(P, t, 2); C.gui = P; }

  // ---------------- 杞杞 runs in, hops, sits behind the pot; cheers in the contest
  { let P;
    if (t < WALKS.qi.keys[1][0]) { P = walker('qi', t, SEAT.qi[0], SEAT.qi[1], SEAT.qi[2]); P.turn = .4; P.eye = face(1, .7, -.1, 'n'); P.mouth = { shape: 'open', open: .4 }; P.knot = Math.sin(t * 9) * .8; }
    else P = seatP('qi', t);
    const hp2 = prog('q.hop', t); if (hp2 > 0 && hp2 < 1) { P.lift = hump(hp2) * 70; P.sq = -hump(hp2) * .08; P.hands = { L: [-90, -200], R: [90, -200] }; happy(P); P.feet = { L: [-22, -10], R: [22, -10] }; }
    settle(P, 'sit.qi', t);
    const sp = prog('all.sip', t); if (sp > 0 && sp < 1) { const c = Math.abs(Math.sin((t - 27) * 9)); P.hands = { L: [-30 + c * -14, -120], R: [30 + c * 14, -120] }; happy(P, .6); }
    const win = prog('x.win', t); if (win > 0 && win < 1) { P.lift = Math.abs(Math.sin(win * Math.PI * 2)) * 30; P.hands = { L: [-90, -210], R: [90, -210] }; happy(P); }
    if (night) { lookUp(P, t, 3); if (fwBoomAt(t) > .5) P.hands = { L: [-90, -205], R: [90, -205] }; }
    if (laughP > 0 && laughP < 1 && !night) { happy(P); P.lift = (P.lift || 0) + Math.abs(Math.sin((t - 37.9) * 8)) * 10 * hump(laughP); }
    if (t > 12.9 && t < 16.4) P.knot = Math.sin(t * 9) * .8; else P.knot = Math.sin(t * 2) * .3;
    idle(P, t, 3); C.qi = P; }

  // ---------------- 山山: picks a sprig from the basket and smells it
  { const P = seatP('shan', t), pk = prog('sh.pick', t), sn = prog('sh.sniff', t);
    if (pk > 0 && pk < 1) reachTo('shan', P, 'R', [BASKET[0] - 4, BASKET[1] - 20], pk < .6 ? ease(pk / .6) : 1 - ease((pk - .6) / .4) * .4);
    const hasSprig = t >= ACT['sh.pick'].t + ACT['sh.pick'].d * .6;
    if (t >= ACT['sh.pick'].t + ACT['sh.pick'].d) P.hands = { R: [lerp(60, 26, ease(sn)), lerp(-120, -170, hump(sn) > 0 ? ease(clamp(sn * 2)) : 0)] };
    if (hasSprig && t < ACT['all.pick'].t) { P.hold = { R0: (g, hx, hy) => { for (let i = 0; i < 3; i++) drawGinkgo(g, hx - 6 + i * 6, hy - 18 - i * 4, 16, -.4 + i * .4, i === 1 ? '#f2c03a' : '#93a24e', { detail: false }); g.strokeStyle = '#7f8f3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy + 8); g.lineTo(hx, hy - 20); g.stroke(); } }; }
    if (sn > .2 && sn < .9) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'smile', open: .3 }; P.blush = .7; }
    if (t > ACT['sh.sniff'].t + 1.5 && t < 20) { P.eye = face(1, .5, .2, 'happy'); }
    // after the herbs: holds the sprig until cups, then a cup
    const pk2 = prog('all.pick', t), sp = prog('all.sip', t);
    if (pk2 > 0 && pk2 < 1) { P.hands = {}; reachTo('shan', P, 'R', [CUP.shan[0], CUP.shan[1] - 10], pk2 < .75 ? ease(pk2 / .75) : 1 - ease((pk2 - .75) / .25) * .6); }
    if (t >= ACT['all.pick'].t + ACT['all.pick'].d * .75) { if (pk2 >= 1) { P.hands = { R: [60, -130] }; } const tl = pk2 >= 1 ? sipPose('shan', P, 'R', hump(sp)) : 0; holdCup(P, 'R', tl); if (sp > .3 && sp < .8) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } }
    if (night) lookUp(P, t, 4);
    if (laughP > 0 && laughP < 1 && !night) happy(P, .7);
    idle(P, t, 4); C.shan = P; }

  // ---------------- 棗棗: sets out cups from her tray
  { const P = seatP('zao', t);
    const steps = [['z.pick', ZAO_TRAY, 'pick', 0], ['z.place', ZAO_SPOT[0], 'place', 0], ['z.pick2', ZAO_TRAY, 'pick', 1], ['z.place2', ZAO_SPOT[1], 'place', 1]];
    let carrying = -1;
    for (const [id, pt, kind, ci] of steps) {
      const p = prog(id, t); if (p <= 0) continue;
      if (kind === 'pick' && p >= .7) carrying = ci; if (kind === 'place' && p < .7) carrying = ci; if (kind === 'place' && p >= .7 && carrying === ci) carrying = -1;
      if (p < 1) reachTo('zao', P, 'R', [pt[0], pt[1] - 12], p < .7 ? ease(p / .7) : 1 - ease((p - .7) / .3) * .5);
    }
    if (carrying >= 0) holdCup(P, 'R', 0, 0);
    P.zaoCarry = carrying;
    if (t > 4.5 && t < 8.5) { P.eye = face(1, .6, .7); P.mouth = { shape: 'smile', open: .2 }; P.turn = .2; }
    const pk2 = prog('all.pick', t), sp = prog('all.sip', t);
    if (pk2 > 0 && pk2 < 1) reachTo('zao', P, 'R', [ZAO_SPOT[1][0], ZAO_SPOT[1][1] - 12], pk2 < .75 ? ease(pk2 / .75) : 1 - ease((pk2 - .75) / .25) * .6);
    if (t >= ACT['all.pick'].t + ACT['all.pick'].d * .75) { if (pk2 >= 1) P.hands = { R: [100, -110] }; const tl = pk2 >= 1 ? sipPose('zao', P, 'R', hump(sp)) : 0; holdCup(P, 'R', tl); if (sp > .3 && sp < .8) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } }
    if (t > 12.5 && t < 17) { P.turn = -.3; P.eye = face(1, -.8, .1); if (t > 13.4 && t < 15.6) { P.hands = { L: [-130, lerp(-90, -210, hump((t - 13.4) / 2.2)) + Math.sin(t * 16) * 8], ...(P.hands || {}) }; happy(P, .7); } }
    if (night) lookUp(P, t, 5);
    if (laughP > 0 && laughP < 1 && !night) happy(P);
    idle(P, t, 5); C.zao = P; }

  // ---------------- 耆耆: stirs, ladles soup into a bowl, hands it to 麻麻
  { const P = seatP('qi2', t); P.turn = -.2;
    const stir = t < ACT['l.dip'].t || t > ACT['l.pass'].t + 1.2;
    const lb = prog('l.bowl', t), dp = prog('l.dip', t), po = prog('l.pour', t), ps = prog('l.pass', t);
    // ladle in the left hand: stirring circles inside the pot
    let lad = null;
    const potIn = [POT.x + 48, POT.y - 4];
    if (stir) { const a = t * 2.4; const hx = potIn[0] + 16 + Math.cos(a) * 9, hy = potIn[1] - 16 + Math.sin(a) * 4; reachTo('qi2', P, 'L', [hx, hy], 1); lad = { rot: Math.PI + .9 + Math.sin(a) * .1 }; P.eye = face(1, -.7, .8); P.mouth = { shape: 'smile', open: .15 }; }
    // bowl picked from the quilt with the right hand
    const bowlSpot = [1182, 872];
    if (lb > 0 && lb < 1) reachTo('qi2', P, 'R', [bowlSpot[0], bowlSpot[1] - 10], lb < .7 ? ease(lb / .7) : 1 - ease((lb - .7) / .3));
    const holdingBowl = t >= ACT['l.bowl'].t + ACT['l.bowl'].d * .7 && t < ACT['l.pass'].t + ACT['l.pass'].d * .7;
    const bowlHold = [1140, 806];
    if (holdingBowl && lb >= 1) reachTo('qi2', P, 'R', bowlHold, 1);
    if (dp > 0 && !stir) { const e = hump(dp); reachTo('qi2', P, 'L', [potIn[0] + 18, potIn[1] - 14 + e * 6], 1); lad = { rot: Math.PI + 1.1 - e * .3 }; P.eye = face(1, -.7, .9); }
    if (po > 0 && !stir) { const e = ease(clamp(po * 2.5)); const tip = [bowlHold[0] - 10, bowlHold[1] - 34]; reachTo('qi2', P, 'L', [lerp(potIn[0] + 18, tip[0] - 46, e), lerp(potIn[1] - 14, tip[1] - 6, e)], 1); lad = { rot: lerp(Math.PI + 1.1, .55 + (po > .4 ? .35 : 0), e), pouring: po > .35 && po < .9 }; P.eye = face(1, .4, .9); P.mouth = { shape: 'smile', open: .3 }; }
    if (ps > 0 && !stir) { reachTo('qi2', P, 'L', [potIn[0] + 18, potIn[1] - 14], ease(ps)); lad = { rot: Math.PI + 1.1 }; }
    // pass: right hand carries the bowl to 麻麻 (her left hand meets it)
    if (ps > 0 && ps < 1) { const e = ease(clamp(ps / .7)); reachTo('qi2', P, 'R', [lerp(bowlHold[0], 1190, e), lerp(bowlHold[1], 772, e)], 1); P.turn = .35; P.eye = face(1, .8, -.2); P.mouth = { shape: 'smile', open: .4 }; }
    if (holdingBowl) holdBowl(P, 'R');
    if (lad) { P.hold = P.hold || {}; P.hold.L0 = (g, hx, hy) => drawLadle(g, hx, hy, 1.0 / P.k * .55, lad.rot); }
    P.ladle = lad;
    if (night) lookUp(P, t, 6);
    if (laughP > 0 && laughP < 1 && !night) happy(P);
    idle(P, t, 6); C.qi2 = P; }

  // ---------------- 麻麻: big stretch & yawn; receives the soup; wins the drinking contest
  { const P = seatP('ma', t);
    const st = prog('m.stretch', t); if (st > 0 && st < 1) { const e = hump(st); P.hands = { L: [lerp(-116, -70, e), lerp(-96, -290, e)], R: [lerp(116, 70, e), lerp(-96, -290, e)] }; P.sq = -e * .07; P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: e }; P.cap = e * .15; P.capFlop = e; }
    if (t < 8.9) { P.eye = face(.45, 0, .2); P.mouth = { shape: 'flat' }; }
    settle(P, 'sit.ma', t);
    const ps = prog('l.pass', t), sn = prog('m.sniff', t);
    const hasBowl = t >= ACT['l.pass'].t + ACT['l.pass'].d * .55 && t < ACT['x.slam'].t + ACT['x.slam'].d * .6;
    if (ps > .4 && ps < 1) { reachTo('ma', P, 'L', [1194, 774], ease((ps - .4) / .3)); P.turn = -.4; P.eye = face(1, -.8, .2); P.mouth = { shape: 'smile', open: .4 }; }
    if (t >= ACT['l.pass'].t + ACT['l.pass'].d && t < ACT['x.raise'].t) { const e = ease(clamp((t - ACT['l.pass'].t - ACT['l.pass'].d) / .4)); P.hands = { L: [lerp(-70, -40, e), lerp(-60, -102, e)], R: [lerp(116, 40, e), lerp(-96, -102, e)] }; P.grip = { L: .5, R: .5 }; }
    if (sn > 0 && sn < 1) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'smile', open: .3 }; P.blush = .8; P.lift = hump(sn) * 4; }
    const hp3 = prog('m.happy', t); if (hp3 > 0 && t < ACT['x.raise'].t) { happy(P); P.lift = (P.lift || 0) + Math.abs(Math.sin(hp3 * Math.PI * 2)) * 8 * (1 - hp3); }
    // contest: bowl to the right hand, clink with 豆豆, gulp, slam it down first
    const xr = prog('x.raise', t), xc = prog('x.clink', t), xg = prog('x.gulp', t), xs = prog('x.slam', t), xw = prog('x.win', t);
    let tilt = 0;
    if (xr > 0 && xg <= 0) { reachTo('ma', P, 'R', [lerp(1318, 1330, ease(xc)), 758 + (xc > .7 ? -3 : 0)], ease(xr)); P.turn = .4; P.eye = face(.55, .9, 0); P.mouth = { shape: 'flat', wob: -1.5 }; }
    if (xg > 0 && xs <= 0) { P.hands = { R: [lerp(80, 32, ease(clamp(xg * 4))), lerp(-110, MOUTH.ma + 30, ease(clamp(xg * 4)))] }; tilt = -1.1 * ease(clamp(xg * 4)); P.lean = -.12 * ease(clamp(xg * 4)); P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .3 }; P.sq = (P.sq || 0) + Math.abs(Math.sin(xg * 14)) * .02; }
    if (xs > 0 && xs < 1) reachTo('ma', P, 'R', [MA_SLAM[0], MA_SLAM[1] - 8], xs < .8 ? ease(xs / .8) : 1);
    if (xw > 0 && xw < 1) { happy(P); P.hands = { L: [-90, -230], R: [lerp(100, 90, xw), -230] }; P.lift = Math.abs(Math.sin(xw * Math.PI * 2)) * 18; P.capFlop = Math.sin(xw * 14) * (1 - xw); P.cap = Math.sin(xw * 12) * .1 * (1 - xw); }
    if (hasBowl) { if (t >= ACT['x.raise'].t) holdBowl(P, 'R'); else holdBowl(P, 'L'); }
    if (hasBowl && tilt) holdBowl(P, 'R', tilt);
    if (night) lookUp(P, t, 7);
    if (laughP > 0 && laughP < 1 && !night) { happy(P); P.lift = (P.lift || 0) + Math.abs(Math.sin((t - 37.9) * 6)) * 10 * hump(laughP); P.capFlop = Math.sin(t * 6) * hump(laughP); }
    P.cap = (P.cap || 0) + Math.sin(t * 1.5) * .02;
    idle(P, t, 7); C.ma = P; }

  // ---------------- 豆豆: waves the blanket; drinking contest with 麻麻
  { const P = seatP('dou', t); P.blanket = 1;
    const wv = prog('b.wave', t); if (wv > 0 && wv < 1) { P.hands = { L: [-56, -40], R: [lerp(52, 96, hump(wv)), lerp(-40, -160, hump(wv)) + Math.sin(t * 14) * 10 * hump(wv)] }; P.turn = -.4; P.eye = face(1, -.8, -.1, wv > .2 && wv < .85 ? 'happy' : 'n'); P.mouth = { shape: 'open', open: .5 * hump(wv) }; }
    const pk = prog('all.pick', t), sp = prog('all.sip', t), xr = prog('x.raise', t), xc = prog('x.clink', t), xg = prog('x.gulp', t), xd = prog('x.dou', t);
    const has = t >= ACT['all.pick'].t + ACT['all.pick'].d * .75 && t < ACT['x.dou'].t + ACT['x.dou'].d * .55;
    let tilt = 0;
    if (pk > 0 && pk < 1) reachTo('dou', P, 'R', [CUP.dou[0], CUP.dou[1] - 8], pk < .75 ? ease(pk / .75) : 1 - ease((pk - .75) / .25) * .6);
    if (t >= ACT['all.pick'].t + ACT['all.pick'].d && t < ACT['x.raise'].t) { P.hands = { L: [-56, -40], R: [lerp(70, 26, hump(sp)), lerp(-60, -70, hump(sp))] }; tilt = -.7 * hump(sp); if (sp > .3 && sp < .8) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .2 }; } }
    if (xr > 0 && xg <= 0) { reachTo('dou', P, 'R', [lerp(1376, 1362, ease(xc)), 762], ease(xr)); P.lean = -.12 * ease(xr); P.turn = -.4; P.eye = face(.55, -.9, -.2); P.mouth = { shape: 'flat', wob: -1.5 }; }
    if (xg > 0 && xd <= 0) { P.hands = { L: [-56, -40], R: [26, -66] }; tilt = -1.0; P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'o', open: .3 }; P.sq = Math.abs(Math.sin(xg * 13)) * .03; }
    if (xd > 0 && xd < 1) { reachTo('dou', P, 'R', [CUP.dou[0], CUP.dou[1] - 8], xd < .55 ? ease(xd / .55) : 1 - ease((xd - .55) / .45)); if (xd > .5) happy(P); }
    if (t > ACT['x.dou'].t + .5 && t < 40) { happy(P); P.lift = Math.abs(Math.sin((t - 37.6) * 8)) * 8 * (t < 39.8 ? 1 : 0); }
    if (has) holdCup(P, 'R', tilt, .7, 13);
    if (night) lookUp(P, t, 8);
    idle(P, t, 8); C.dou = P; }

  // ---------------- 地地: naps on the pillow, wakes with a yawn
  { const P = seatP('di', t); P.h = 260; P.sprite = 'di_body';
    const wk = prog('d.wake', t);
    if (wk <= 0) { P.eye = face(0, 0, 0, 'closed'); P.mouth = { shape: 'smile' }; P.sq = .03 * Math.sin(t * 1.4); }
    else if (wk < .55) { P.sprite = 'di_yawn'; P.sq = -hump(wk / .55) * .06; }
    else { P.eye = face(lerp(.3, 1, (wk - .55) / .45), -.3, .1); P.mouth = { shape: 'smile', open: .2 }; }
    if (t > 12 && t < 40) { P.eye = face(1, -.6, .1, laughP > 0 && laughP < 1 ? 'happy' : 'n'); P.mouth = { shape: 'smile', open: laughP > 0 ? .4 : .1 }; }
    if (night) { P.eye = face(1, -.2, -.95); }
    C.di = P; }
  return C;
}

// =================================================================================
// GRAY CROWD (路人甲): soft, simple, muted figures — never outlined, never colored
// =================================================================================
function drawMob(ctx, x, y, k, o = {}) {
  const tone = o.tone || '#b2b2b7';
  ctx.save(); ctx.translate(x, y); ctx.scale(k * (o.flip ? -1 : 1), k);
  ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  const g = ctx.createRadialGradient(0, 4, 2, 0, 4, 80); g.addColorStop(0, 'rgba(70,60,60,.22)'); g.addColorStop(1, 'rgba(70,60,60,0)'); ctx.fillStyle = g; ctx.save(); ctx.scale(1, .2); ctx.beginPath(); ctx.arc(0, 20, 80, 0, 7); ctx.fill(); ctx.restore();
  const bob = o.bob || 0, sit = o.sit || 0, lean = o.lean || 0;
  ctx.translate(0, -bob); ctx.rotate(lean);
  const sh = shade(tone, -.18), hi = shade(tone, .25);
  // feet
  ctx.fillStyle = sh; const fw = o.walk;
  for (const s of [-1, 1]) { const ph = fw == null ? 0 : Math.max(0, Math.sin(fw * Math.PI * 2 + (s > 0 ? Math.PI : 0))); ctx.beginPath(); ctx.ellipse(s * (24 + sit * 14), -6 - ph * 12, 20, 11, 0, 0, 7); ctx.fill(); }
  // body (rice-ball silhouette)
  const sy = 1 - sit * .12; ctx.save(); ctx.scale(1, sy);
  const b = new Path2D(); b.moveTo(0, -190); b.bezierCurveTo(52, -190, 76, -130, 78, -80); b.bezierCurveTo(80, -30, 52, -8, 0, -8); b.bezierCurveTo(-52, -8, -80, -30, -78, -80); b.bezierCurveTo(-76, -130, -52, -190, 0, -190); b.closePath();
  const bg = ctx.createRadialGradient(-22, -140, 8, 0, -95, 110); bg.addColorStop(0, hi); bg.addColorStop(.6, tone); bg.addColorStop(1, sh);
  ctx.fillStyle = bg; ctx.fill(b);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= .12; ctx.fillStyle = pat(ctx, TEX.grain, .8); ctx.fill(b); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.strokeStyle = 'rgba(90,90,100,.22)'; ctx.lineWidth = 3; ctx.stroke(b);
  // face: two dots and a tiny mouth (eyes shift up when looking at the sky)
  const ly = o.up ? -8 : 0, lx = o.lx || 0;
  if (!o.back) { ctx.fillStyle = '#4a4a52'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 17 + lx, -118 + ly, 4.5, 6, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#5a5a62'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); if (o.cheer) { ctx.ellipse(lx, -100 + ly, 6, 5, 0, 0, 7); ctx.fillStyle = '#6a6a72'; ctx.fill(); } else { ctx.arc(lx, -106 + ly, 6, .2 * Math.PI, .8 * Math.PI); ctx.stroke(); } }
  ctx.restore();
  // little arms
  ctx.fillStyle = tone;
  const up = o.arms || 0;
  for (const s of [-1, 1]) { const ax = s * lerp(78, 60, up), ay = lerp(-70, -168, up) * sy - (o.wave && s > 0 ? Math.sin(o.wave) * 14 : 0); ctx.beginPath(); ctx.ellipse(ax, ay, 16, 22, s * lerp(.5, -.3, up), 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(90,90,100,.18)'; ctx.lineWidth = 2; ctx.stroke(); }
  if (o.balloon) { ctx.strokeStyle = 'rgba(120,120,130,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, -80); ctx.quadraticCurveTo(80 + Math.sin(o.balloon) * 10, -200, 70 + Math.sin(o.balloon) * 16, -300); ctx.stroke(); ctx.fillStyle = '#c9cdd6'; ctx.beginPath(); ctx.ellipse(70 + Math.sin(o.balloon) * 16, -340, 34, 42, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
let CROWD = null;
function buildCrowd() {
  if (CROWD) return CROWD; const r = mulberry32(4242), tones = ['#b6b6ba', '#a9a9ae', '#c3c2c5', '#9f9fa5', '#bdbcc0'];
  const L = [];
  const group = (cx, cy, n, k, spread, extra = {}) => { const g = { blanket: [cx, cy + 8, spread * 1.2 * k / .3, 22 * k / .3] }; L.push({ type: 'blanket', x: cx, y: cy - 12 * k / .3, w: spread * 1.25, h: 30 * k / .3, tone: ['#d9d3c6', '#cfcabf', '#dcd6cf'][Math.floor(r() * 3)] });
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r(); L.push({ type: 'sit', x: cx + Math.cos(a) * spread * .45, y: cy + Math.sin(a) * spread * .12 * k / .3, k: k * (.85 + r() * .3), tone: tones[Math.floor(r() * 5)], ph: r() * 6, flip: Math.cos(a) > 0, ...extra }); } };
  // far bank (beyond the stream)
  for (let i = 0; i < 6; i++) group(-60 + i * 380 + r() * 80, 512 + r() * 20, 3 + Math.floor(r() * 2), .15, 90);
  for (let i = 0; i < 10; i++) L.push({ type: 'walk', x0: r() * 2400 - 240, y: 540 + r() * 8, k: .16 + r() * .02, sp: (r() < .5 ? -1 : 1) * (24 + r() * 18), tone: tones[Math.floor(r() * 5)], ph: r() * 6, balloon: r() < .25 });
  // near lawns, left and right of the quilt (a walking lane is kept clear at y 780–940)
  group(110, 700, 4, .3, 170); group(300, 1010, 3, .44, 210); group(-40, 1040, 3, .46, 200);
  group(1790, 690, 4, .3, 170); group(1900, 1000, 4, .46, 230); group(1750, 840, 3, .38, 180);
  for (let i = 0; i < 3; i++) L.push({ type: 'stand', x: 1680 + i * 60, y: 600 + i * 6, k: .26, tone: tones[i], ph: r() * 6, chat: true });
  L.push({ type: 'stand', x: 140, y: 610, k: .25, tone: tones[2], ph: 1, balloon: true });
  L.push({ type: 'kid', x: 240, y: 760, k: .24, tone: tones[3], ph: 2 }); L.push({ type: 'kid', x: 1700, y: 770, k: .24, tone: tones[1], ph: 4 });
  // more people come to watch at night (walk in during dusk)
  for (let i = 0; i < 8; i++) { const left = i < 4; L.push({ type: 'arrive', x1: left ? 60 + i * 80 : 1680 + (i - 4) * 70, y: left ? 610 + (i % 2) * 18 : 612 + (i % 2) * 16, k: .25, tone: tones[i % 5], dir: left ? 1 : -1, t0: 40.6 + i * .35, ph: r() * 6 }); }
  CROWD = L; return L;
}
function crowdDrawables(t, night) {
  const out = [], boom = fwBoomAt(t);
  for (const m of buildCrowd()) {
    if (m.type === 'blanket') { out.push({ y: m.y - 30, fn: ctx => { ctx.fillStyle = m.tone; ctx.globalAlpha = .9; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.w * .5, m.h * .5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }); continue; }
    const o = { tone: m.tone, flip: m.flip };
    let x = m.x, y = m.y, k = m.k;
    if (m.type === 'walk') { const span = 2600; x = ((m.x0 + t * m.sp) % span + span) % span - 340; o.walk = t * 1.6 + m.ph; o.bob = Math.abs(Math.sin(o.walk * Math.PI * 2)) * 6; o.flip = m.sp < 0; if (m.balloon) o.balloon = t * 1.3 + m.ph; }
    if (m.type === 'sit') { o.sit = 1; o.bob = Math.max(0, Math.sin(t * 2.2 + m.ph)) * 3; o.lean = Math.sin(t * .9 + m.ph) * .05; if (Math.sin(t * .7 + m.ph) > .6) o.cheer = true; }
    if (m.type === 'stand') { o.lean = Math.sin(t * 1.1 + m.ph) * .06; o.bob = m.chat ? Math.max(0, Math.sin(t * 3 + m.ph)) * 4 : 0; if (m.balloon) o.balloon = t + m.ph; }
    if (m.type === 'kid') { const run = Math.sin(t * .8 + m.ph); x = m.x + run * 60; o.walk = t * 2.6 + m.ph; o.bob = Math.abs(Math.sin(o.walk * Math.PI)) * 14; o.flip = Math.cos(t * .8 + m.ph) < 0; o.arms = .5; }
    if (m.type === 'arrive') { if (t < m.t0) continue; const u = clamp((t - m.t0) / 3.2); x = m.x1 - m.dir * (1 - ease(u)) * 420; o.flip = m.dir < 0; if (u < 1) { o.walk = (t - m.t0) * 1.8; o.bob = Math.abs(Math.sin(o.walk * Math.PI * 2)) * 6; } else o.sit = 1; o.alpha = clamp(u * 3); }
    if (night) { o.up = true; o.lx = 0; if (boom > .45 && m.type !== 'walk') { o.arms = .9; o.cheer = true; } else if (m.type !== 'walk') o.arms = .15; if (m.type === 'sit') o.lean = -.05; }
    out.push({ y, fn: ctx => drawMob(ctx, x, y, k, o) });
  }
  return out;
}

// =================================================================================
// STATIC LAYERS
// =================================================================================
const LAY = {};
function buildLayers() {
  if (LAY.ground) return LAY;
  // far: hills, far trees and the far bank of the stream (parallax .4)
  { const R = { x: -700, y: 120, w: 3320, h: 520 }, s = 1, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d'); g.translate(-R.x, -R.y);
    paintRidge(g, 330, 55, '#a7bdcb', 11, R.x, R.x + R.w, 900); paintRidge(g, 395, 36, '#9db6b2', 12, R.x, R.x + R.w, 900);
    paintTrees(g, 430, 500, 90, 13, .7, R.x, R.x + R.w);
    LAY.far = { c, R, s, f: .4 }; }
  // mid: far bank lawn, the stream, the near bank (parallax .75)
  { const R = { x: -500, y: 360, w: 2920, h: 330 }, s = 1.3, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d'); g.scale(s, s); g.translate(-R.x, -R.y);
    const rr = mulberry32(21);
    const fb = new Path2D(); fb.rect(R.x, 470, R.w, 100); const fg = g.createLinearGradient(0, 470, 0, 570); fg.addColorStop(0, '#c7c784'); fg.addColorStop(1, '#adb565'); wc(g, fb, fg, { grain: .25, bloom: .2 });
    for (let i = 0; i < 700; i++) grassBlade(g, R.x + rr() * R.w, 475 + rr() * 90, 5 + rr() * 6, (rr() - .5) * 6, 1, ['#8c9e4c', '#b6b864', '#a3ad5a'][i % 3]);
    for (let i = 0; i < 26; i++) { const x = R.x + rr() * R.w; g.fillStyle = '#6a5030'; g.fillRect(x - 3, 452, 6, 30); wc(g, blob(x, 440, 30 + rr() * 18, 28, rr, .2, 10), ['#f0c64a', '#e8b13a', '#d99a3a', '#b8b25a'][i % 4], { grain: .3 }); }
    const path = new Path2D(); path.rect(R.x, 534, R.w, 14); wc(g, path, '#d8cdb2', { grain: .2 });
    const st = new Path2D(); st.moveTo(R.x, 572); for (let x = R.x; x <= R.x + R.w; x += 40) st.lineTo(x, 570 + Math.sin(x * .006) * 5); st.lineTo(R.x + R.w, 628); for (let x = R.x + R.w; x >= R.x; x -= 40) st.lineTo(x, 626 + Math.sin(x * .008 + 1) * 6); st.closePath();
    const sg = g.createLinearGradient(0, 570, 0, 628); sg.addColorStop(0, '#9fc9da'); sg.addColorStop(1, '#6ea4c0'); wc(g, st, sg, { grain: .15, edge: '#4f86a6', edgeW: 3, edgeA: .4 });
    for (let i = 0; i < 40; i++) rock(g, R.x + rr() * R.w, 574 + (rr() < .5 ? 0 : 52) + rr() * 4, 14 + rr() * 16, 6 + rr() * 4, rr, { moss: rr() < .5 });
    const nb = new Path2D(); nb.rect(R.x, 628, R.w, 70); const ng = g.createLinearGradient(0, 628, 0, 700); ng.addColorStop(0, '#b9bd76'); ng.addColorStop(1, '#adb565'); wc(g, nb, ng, { grain: .25 });
    LAY.mid = { c, R, s, f: .75 }; }
  // ground: near lawn, quilt, tree trunk (parallax 1, 2× resolution for close-ups)
  { const R = { x: -500, y: 640, w: 2920, h: 640 }, s = 2, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d'); g.scale(s, s); g.translate(-R.x, -R.y);
    const rr = mulberry32(31);
    const lg = g.createLinearGradient(0, 640, 0, 1280); lg.addColorStop(0, '#b4b96f'); lg.addColorStop(.5, '#a3b05e'); lg.addColorStop(1, '#8c9e4f'); g.fillStyle = lg; g.fillRect(R.x, 640, R.w, 640);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .22; g.fillStyle = pat(g, TEX.bloom, 2); g.fillRect(R.x, 640, R.w, 640); g.globalAlpha = .18; g.fillStyle = pat(g, TEX.grain, 1); g.fillRect(R.x, 640, R.w, 640); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 6000; i++) { const x = R.x + rr() * R.w, y = 645 + rr() * 630, d = (y - 640) / 640; grassBlade(g, x, y, 6 + d * 18, (rr() - .5) * 8, .8 + d * 1.6, ['#8c9e4c', '#b6b864', '#7b8e40', '#c7b85a', '#9aa451'][i % 5]); }
    for (let i = 0; i < 160; i++) flower5(g, R.x + rr() * R.w, 650 + rr() * 620, 3 + rr() * 5, rr() < .7 ? '#fffaf0' : '#f6c96a', '#f2b33a', 'rgba(150,120,70,.6)', rr() * 6);
    for (let i = 0; i < 220; i++) drawGinkgo(g, R.x + rr() * R.w, 650 + rr() * 620, 9 + rr() * 10, rr() * 6.28, ['#f2c03a', '#f6d060', '#e9a92c'][i % 3], { squash: .55 });
    // tree trunk and roots (left-back)
    const tr = new Path2D(); tr.moveTo(TREE.x - 120, TREE.base + 10); tr.bezierCurveTo(TREE.x - 70, TREE.base - 120, TREE.x - 90, 380, TREE.x - 60, 100); tr.lineTo(TREE.x + 80, 100); tr.bezierCurveTo(TREE.x + 100, 380, TREE.x + 90, TREE.base - 120, TREE.x + 150, TREE.base + 10); tr.quadraticCurveTo(TREE.x, TREE.base + 30, TREE.x - 120, TREE.base + 10); tr.closePath();
    const rootShadow = new Path2D(); rootShadow.ellipse(TREE.x + 15, TREE.base + 6, 190, 26, 0, 0, 7); g.fillStyle = 'rgba(60,45,20,.28)'; g.fill(rootShadow);
    // quilt under the friends
    quiltQuad(g, 640, 1010, 470, 1600, 380, 1700, 5, 8, 33);
    for (let i = 0; i < 14; i++) drawGinkgo(g, 450 + rr() * 1200, 660 + rr() * 340, 12 + rr() * 6, rr() * 6.3, PAL.gold, { squash: .6 });
    LAY.ground = { c, R, s, f: 1 }; }
  // trunk above the ground layer + canopy (parallax 1.06), also the light occluder
  { const R = { x: TREE.x - 200, y: -160, w: 440, h: 840 }, s = 1.5, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d'); g.scale(s, s); g.translate(-R.x, -R.y);
    const tr = new Path2D(); tr.moveTo(TREE.x - 90, 660); tr.bezierCurveTo(TREE.x - 80, 400, TREE.x - 70, 200, TREE.x - 40, -100); tr.lineTo(TREE.x + 80, -100); tr.bezierCurveTo(TREE.x + 95, 200, TREE.x + 100, 400, TREE.x + 110, 660); tr.closePath();
    const tg = g.createLinearGradient(TREE.x - 90, 0, TREE.x + 110, 0); tg.addColorStop(0, '#6e4a2c'); tg.addColorStop(.5, '#946a42'); tg.addColorStop(1, '#5c3c22'); wc(g, tr, tg, { grain: .45, edge: '#3e2614', edgeW: 6, out: INK, outW: 3 });
    g.strokeStyle = 'rgba(60,35,15,.45)'; g.lineWidth = 4; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(TREE.x - 70 + i * 26, 650); g.bezierCurveTo(TREE.x - 60 + i * 24, 400, TREE.x - 50 + i * 20, 100, TREE.x - 30 + i * 16, -100); g.stroke(); }
    for (const [rx, a] of [[-110, -.5], [130, .5]]) { const rt = new Path2D(); rt.moveTo(TREE.x + rx * .5, 600); rt.quadraticCurveTo(TREE.x + rx, 640, TREE.x + rx * 1.4, 668); rt.lineTo(TREE.x + rx * 1.2, 676); rt.quadraticCurveTo(TREE.x + rx * .6, 650, TREE.x + rx * .2, 640); rt.closePath(); wc(g, rt, '#7a5434', { grain: .4, out: INK, outW: 2.5 }); }
    LAY.trunk = { c, R, s, f: 1 }; }
  { const R = { x: -700, y: -420, w: 3320, h: 1020 }, s = 1, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d'); g.translate(-R.x, -R.y);
    g.strokeStyle = '#6e4a2c'; g.lineCap = 'round';
    for (const [a, b, cc, d, w] of [[[TREE.x + 40, 40], [500, -20], [900, -60], [1500, -40], 34], [[TREE.x, 0], [100, -60], [-100, -120], [-400, -100], 30], [[TREE.x + 50, -60], [700, -200], [1100, -240], [1900, -200], 26]]) { g.lineWidth = w; g.beginPath(); g.moveTo(...a); g.bezierCurveTo(...b, ...cc, ...d); g.stroke(); }
    paintCanopy(g, 420, -150, 1100, 250, 1900, 41, 1.3); paintCanopy(g, 1500, -170, 600, 200, 700, 42, 1.3); paintCanopy(g, -200, -120, 520, 220, 600, 43, 1.3);
    const rr = mulberry32(44); for (let i = 0; i < 260; i++) { const x = -500 + rr() * 2900, y = 40 + rr() * 90 * (1 - Math.abs(x - 600) / 2400); drawGinkgo(g, x, y, 22 + rr() * 12, Math.PI + (rr() - .5), ['#f3c544', '#f8d867', '#e9a92c'][i % 3]); }
    LAY.canopy = { c, R, s, f: 1 }; }
  for (const k of ['far', 'mid']) { const l = LAY[k], b = mkCanvas(l.c.width, l.c.height), g = b.getContext('2d'); g.filter = 'blur(4px)'; g.drawImage(l.c, 0, 0); l.blur = b; }
  return LAY;
}

// =================================================================================
// CAMERA (one per shot, gentle drift inside the shot)
// =================================================================================
const CAMS = {
  wide:    [[960, 545, 1.0], [960, 560, 1.06]],
  pot:     [[935, 742, 2.05], [955, 746, 2.12]],
  right:   [[1355, 762, 2.0], [1335, 760, 2.06]],
  gather:  [[960, 700, 1.25], [960, 690, 1.3]],
  ladle:   [[1172, 762, 2.3], [1182, 756, 2.36]],
  sip:     [[985, 742, 1.45], [985, 732, 1.5]],
  clink:   [[728, 768, 2.6], [722, 760, 2.7]],
  contest: [[1328, 768, 2.5], [1334, 760, 2.58]],
  laugh:   [[960, 640, 1.25], [960, 600, 1.12]],
  dusk:    [[960, 560, 1.05], [960, 505, .99]],
  fw:      [[960, 470, .94], [960, 462, .93]],
  promise: [[792, 772, 2.3], [792, 778, 2.48]],
};
function camAt(t) {
  const s = shotAt(t), u = ease((t - s.t) / (s.end - s.t));
  if (s.cam === 'arrive') { const P = walkN('wu', t), Ls = 2 * HIP.wu * SEAT.wu[2], x = SEAT.wu[0] - 11 * Ls + P * Ls; return { x: clamp(x + 300, 520, 900), y: 760, z: 1.65 }; }
  const [a, b] = CAMS[s.cam]; return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), z: lerp(a[2], b[2], u) };
}
function layerT(ctx, cam, f, sx = 1) { const zf = 1 + (cam.z - 1) * f, cx = 960 + (cam.x - 960) * f, cy = 540 + (cam.y - 540) * f; ctx.setTransform(zf * sx, 0, 0, zf * sx, (W / 2 - cx * zf) * sx, (H / 2 - cy * zf) * sx); }
function drawLay(ctx, cam, l, blur = 0, sx = 1) { layerT(ctx, cam, l.f, sx); ctx.drawImage(l.c, l.R.x, l.R.y, l.R.w, l.R.h); if (blur > 0 && l.blur) { ctx.globalAlpha = blur; ctx.drawImage(l.blur, l.R.x, l.R.y, l.R.w, l.R.h); ctx.globalAlpha = 1; } }

// sky by time of day
function skyCols(k) { const D = [[159, 198, 220], [207, 225, 230], [246, 230, 196]], K = [[74, 90, 140], [201, 120, 154], [246, 178, 106]], N = [[13, 18, 51], [31, 42, 92], [59, 63, 114]];
  const m = (A, B, u) => A.map((c, i) => c.map((v, j) => Math.round(lerp(v, B[i][j], u))));
  const c = k < 1 ? m(D, K, k) : m(K, N, k - 1); return c.map(v => `rgb(${v[0]},${v[1]},${v[2]})`); }

// fireworks (emissive). world sky positions; reflections clipped to the stream
const FW_COL = [['#ffd36a', '#fff3c0'], ['#ff9fb0', '#ffe1e8'], ['#9fe0ff', '#e6f8ff'], ['#ffb46a', '#fff0d0'], ['#c9a6ff', '#efe6ff'], ['#a6ffcf', '#eafff3']];
function drawFireworks(ctx, t, cam) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const c = ACT['fw' + i], d = t - c.t; if (d < 0 || d > 3.2) continue; const r = mulberry32(900 + i);
    const x = 520 + r() * 1180, y = 330 + r() * 120, col = FW_COL[i % FW_COL.length], R = 105 + r() * 70;
    for (const mirror of [false, true]) {
      // sky bursts sit far away (parallax .4); their reflections shimmer in the stream (parallax .75)
      const Y = yy => mirror ? 574 + (520 - yy) * .2 + Math.sin(t * 6 + yy * .05) * 1.5 : yy, A = mirror ? .35 : 1;
      if (mirror) { layerT(ctx, cam, .75); ctx.save(); ctx.beginPath(); ctx.rect(-800, 572, 3600, 56); ctx.clip(); } else layerT(ctx, cam, .4);
      if (d < 1) { const yy = lerp(560, y, easeOut(d)); ctx.strokeStyle = `rgba(255,230,180,${(1 - d) * .9 * A})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, Y(yy + 40)); ctx.lineTo(x, Y(yy)); ctx.stroke(); }
      else { const b = d - 1, f = Math.max(0, 1 - b / 2.0);
        const g = ctx.createRadialGradient(x, Y(y), 0, x, Y(y), R * 1.5); g.addColorStop(0, `rgba(255,220,170,${.35 * f * A})`); g.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = g; ctx.fillRect(x - R * 1.5, Y(y) - R * 1.5, R * 3, R * 3);
        const n = 70; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + hash1(k + i) * .08, v = R * (.72 + .28 * hash1(k * 3 + i * 31)), ex = easeOut(clamp(b / 1.1)), px = x + Math.cos(a) * v * ex, py = y + Math.sin(a) * v * ex + b * b * 30;
          ctx.strokeStyle = k % 2 ? col[0] : col[1]; ctx.globalAlpha = f * A; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(lerp(x, px, .72), Y(lerp(y, py, .72))); ctx.lineTo(px, Y(py)); ctx.stroke();
          if (b > .3) { ctx.fillStyle = col[1]; ctx.beginPath(); ctx.arc(px, Y(py), 3.2 * f, 0, 7); ctx.fill(); } }
        ctx.globalAlpha = 1; }
      if (mirror) ctx.restore();
    }
  }
  ctx.restore();
}

// =================================================================================
// FRAME: scene (graded), emissive (added after grade), occluder (for light rays)
// =================================================================================
function renderWorld(sc, fg, em, ef, oc, t) {
  const cam = camAt(t), L = buildLayers(), k = tod(t), night = t >= 44.6;
  const dof = clamp((cam.z - 1.6) / 1.0) * .9;
  // sky
  sc.setTransform(1, 0, 0, 1, 0, 0); const cols = skyCols(k);
  layerT(sc, cam, .2); const sg = sc.createLinearGradient(0, -500, 0, 560); sg.addColorStop(0, cols[0]); sg.addColorStop(.6, cols[1]); sg.addColorStop(1, cols[2]); sc.fillStyle = sg; sc.fillRect(-1500, -1500, 5000, 3000);
  if (k < .9) { paintCloudsT(sc, t, 1 - k); }
  drawLay(sc, cam, L.far, dof); drawLay(sc, cam, L.mid, dof * .8);
  // stream shimmer
  layerT(sc, cam, .75); { const r = mulberry32(61); sc.save(); sc.lineCap = 'round'; for (let i = 0; i < 40; i++) { const x0 = r() * 2900 - 500, y = 578 + r() * 44, sp = 18 + r() * 22, l = 14 + r() * 30, x = ((x0 + t * sp) % 2900 + 2900) % 2900 - 500; sc.globalAlpha = .35 + .3 * Math.sin(t * 2 + i); sc.strokeStyle = '#fff'; sc.lineWidth = 2; sc.beginPath(); sc.moveTo(x, y); sc.lineTo(x + l, y); sc.stroke(); } sc.restore(); }
  // ---- foreground (separate layer so sky light never paints over it)
  const bg = sc; sc = fg; sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, H);
  drawLay(sc, cam, L.ground, 0); drawLay(sc, cam, L.trunk, 0);
  // everything that stands on the ground, sorted by depth
  layerT(sc, cam, 1);
  const C = castAt(t), D = crowdDrawables(t, night);
  // props on the quilt
  D.push({ y: POT.y + POT.w * .5 - 2, fn: g => { drawPot(g, POT.x, POT.y, POT.w, t); } });
  D.push({ y: POT.y + POT.w * .5 - 1, fn: g => drawSteam(g, POT.x, POT.y - 6, t, 1.1, { n: 4, h: 230, a: .6, speed: .8 }) });
  D.push({ y: BASKET[1], fn: g => drawBasket(g, BASKET[0], BASKET[1], .32) });
  D.push({ y: ZAO_TRAY[1], fn: g => { const tr = new Path2D(); tr.roundRect(ZAO_TRAY[0] - 26, ZAO_TRAY[1] - 6, 52, 12, 4); fillShade(g, tr, '#a8743e', { grain: .2 }); ink(g, tr, 1.6); const left = 2 - (t >= ACT['z.pick'].t + ACT['z.pick'].d * .7 ? 1 : 0) - (t >= ACT['z.pick2'].t + ACT['z.pick2'].d * .7 ? 1 : 0); for (let i = 0; i < left; i++) drawCup(g, ZAO_TRAY[0] - 10 + i * 18, ZAO_TRAY[1] - 6 - CUPW * .7, CUPW, 0, 0); } });
  ZAO_SPOT.forEach((sp, i) => { const placed = t >= ACT[i ? 'z.place2' : 'z.place'].t + ACT[i ? 'z.place2' : 'z.place'].d * .7, taken = i === 1 && t >= ACT['all.pick'].t + ACT['all.pick'].d * .75; if (placed && !taken) D.push({ y: sp[1], fn: g => drawCup(g, sp[0], sp[1] - CUPW * .7, CUPW, 0, i === 1 ? .7 : 0) }); });
  // cups waiting on the quilt
  const cupOn = { wu: !C.wu.wuHasCup, gui: t < ACT['all.pick'].t + ACT['all.pick'].d * .75, shan: t < ACT['all.pick'].t + ACT['all.pick'].d * .75, dou: !(t >= ACT['all.pick'].t + ACT['all.pick'].d * .75 && t < ACT['x.dou'].t + ACT['x.dou'].d * .55) };
  for (const w of ['wu', 'gui', 'shan', 'dou']) if (cupOn[w]) { const [x, y] = CUP[w]; D.push({ y, fn: g => drawCup(g, x, y - CUPW * .7, CUPW, 0, .7) }); }
  if (t < ACT['l.bowl'].t + ACT['l.bowl'].d * .7) D.push({ y: 872, fn: g => drawBowl(g, 1182, 872 - 14, 36) });
  if (t >= ACT['x.slam'].t + ACT['x.slam'].d * .6) D.push({ y: MA_SLAM[1], fn: g => drawBowl(g, MA_SLAM[0], MA_SLAM[1] - 14, 36) });
  LANTERNS.forEach(([x, y]) => D.push({ y, fn: g => drawLanternOn(g, x, y, .55, 0, t) }));
  // the bundle falling into the pot
  const dp = prog('w.drop', t); if (dp >= .5 && dp < .66) { const u = (dp - .5) / .16, h = handW(C.wu, 'R'); D.push({ y: POT.y + POT.w * .5, fn: g => { g.save(); g.beginPath(); g.rect(-5000, -5000, 10000, 5000 + POT.y + 4); g.clip(); drawBundle(g, lerp(h[0] + 4, POT.x - 20, u), lerp(h[1] + 6, POT.y + 14, u * u), .9, .2 + u * .6); g.restore(); } }); }
  if (dp >= .62 && dp < 1) { const u = (dp - .62) / .38; D.push({ y: POT.y + POT.w * .5 + 1, fn: g => { const r = mulberry32(7); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.2, v = 40 + r() * 50; g.globalAlpha = 1 - u; g.fillStyle = '#d9a453'; g.beginPath(); g.arc(POT.x - 20 + Math.cos(a) * v * u, POT.y + Math.sin(a) * v * u + 90 * u * u, 3, 0, 7); g.fill(); } g.globalAlpha = 1; drawSteam(g, POT.x - 20, POT.y, t, 1.0, { n: 2, h: 160, a: .7 * (1 - u) }); } }); }
  // the cast
  for (const [w, P] of Object.entries(C)) D.push({ y: P.y, fn: g => RIG[w](g, P) });
  // the ladle's pour and steam from 麻麻's bowl
  if (C.qi2.ladle && C.qi2.ladle.pouring) D.push({ y: 999, fn: g => { const h = handW(C.qi2, 'L'), rot = C.qi2.ladle.rot, s = .55; const tip = [h[0] + Math.cos(rot) * 112 * s, h[1] + Math.sin(rot) * 112 * s + 6]; g.save(); g.strokeStyle = 'rgba(200,130,50,.9)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(tip[0], tip[1]); g.quadraticCurveTo(tip[0] + 2, tip[1] + 10, 1132, 800); g.stroke(); g.restore(); } });
  D.sort((a, b) => a.y - b.y); for (const d of D) d.fn(sc);
  if (t >= ACT['l.pass'].t + .6 && t < ACT['x.raise'].t) { const h = handW(C.ma, 'L'); drawSteam(sc, h[0] + 30, h[1] - 18, t, .45, { n: 2, h: 90, a: .55 }); }
  // sparkles for little moments
  const sparkle = (P, lx, ly, a, rot = .2) => { const q = toWorld(P, lx, ly); drawSparkle(sc, q[0], q[1], .9, a, '#f2b33a', rot); };
  const sn = prog('sh.sniff', t); if (sn > .3 && sn < 1) sparkle(C.shan, 90, -300, hump((sn - .3) / .7));
  const mh = prog('m.happy', t); if (mh > 0 && mh < 1) sparkle(C.ma, 110, -300, hump(mh));
  const xw = prog('x.win', t); if (xw > 0 && xw < 1) sparkle(C.ma, 130, -320, hump(xw), .1);
  const cl = prog('c.clink', t); if (cl > .55 && cl < 1) { drawSparkle(sc, 702, 728, 1.0, hump((cl - .55) / .45), '#f2c14e', 0); }
  const xc = prog('x.clink', t); if (xc > .6 && xc < 1) { drawSparkle(sc, 1346, 714, 1.0, hump((xc - .6) / .4), '#f2c14e', 0); }
  // canopy over everything
  drawLay(sc, cam, L.canopy, 0);
  // falling leaves
  layerT(sc, cam, 1.1); { const r = mulberry32(81); for (let i = 0; i < 26; i++) { const per = 7 + r() * 6, ph = r(), x0 = -200 + r() * 2300, sz = 16 + r() * 10; const u = (t / per + ph) % 1; drawGinkgo(sc, x0 + Math.sin(t * .9 + i) * 40 + u * 120, -40 + u * 1200, sz, t * (r() - .5) * 3 + i, ['#f4c63c', '#f8d867', '#e9a92c'][i % 3], { squash: .4 + .6 * Math.abs(Math.cos(t * 2 + i)) }); } }

  // ---- emissive: stars, lantern light, fireworks
  em.setTransform(1, 0, 0, 1, 0, 0); em.clearRect(0, 0, W, H);
  if (k > 1.2) { layerT(em, cam, .15); const r = mulberry32(71), a = clamp((k - 1.2) / .8); for (let i = 0; i < 220; i++) { const x = r() * 3000 - 500, y = -500 + r() * 900; em.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(t * (1 + r()) + i))); em.fillStyle = '#fff6e0'; em.beginPath(); em.arc(x, y, .6 + r() * 1.6, 0, 7); em.fill(); } em.globalAlpha = 1; }
  if (t > 45) drawFireworks(em, t, cam);
  // lantern light belongs to the foreground
  ef.setTransform(1, 0, 0, 1, 0, 0); ef.clearRect(0, 0, W, H); layerT(ef, cam, 1);
  LANTERNS.forEach(([x, y], i) => { const on = ease(prog('lamp' + i, t)); if (on <= 0) return; const fl = .85 + .1 * Math.sin(t * 2.3 + i) + .05 * vnoise1(t * 4 + i);
    const g = ef.createRadialGradient(x, y - 24, 2, x, y - 24, 70); g.addColorStop(0, `rgba(255,190,100,${.42 * on * fl})`); g.addColorStop(1, 'rgba(255,190,100,0)'); ef.fillStyle = g; ef.fillRect(x - 70, y - 94, 140, 140);
    const c = ef.createRadialGradient(x, y - 24, 1, x, y - 24, 14); c.addColorStop(0, `rgba(255,236,170,${.9 * on})`); c.addColorStop(1, 'rgba(255,200,110,0)'); ef.fillStyle = c; ef.fillRect(x - 16, y - 40, 32, 32);
    const pool = ef.createRadialGradient(x, y, 2, x, y, 120); pool.addColorStop(0, `rgba(255,170,80,${.16 * on})`); pool.addColorStop(1, 'rgba(255,170,80,0)'); ef.save(); ef.translate(x, y); ef.scale(1, .35); ef.translate(-x, -y); ef.fillStyle = pool; ef.fillRect(x - 120, y - 120, 240, 240); ef.restore(); });
  // ---- occluder: open sky (white) seen through the canopy and around the trunk
  oc.setTransform(1, 0, 0, 1, 0, 0); oc.fillStyle = '#000'; oc.fillRect(0, 0, oc.canvas.width, oc.canvas.height);
  const os = oc.canvas.width / W; layerT(oc, cam, 1, os); oc.fillStyle = '#fff'; for (const [cx, cy, rx, ry] of [[420, -150, 1100, 250], [1500, -170, 600, 200], [-200, -120, 520, 220]]) { oc.beginPath(); oc.ellipse(cx, cy + 40, rx * .95, ry * 1.05, 0, 0, 7); oc.fill(); }
  oc.globalCompositeOperation = 'destination-out'; drawLay(oc, cam, L.canopy, 0, os); oc.globalCompositeOperation = 'source-over';
  return { cam, sun: worldToScreen(cam, SUN[0], SUN[1], .3), flash: fwBoomAt(t), k };
}
function worldToScreen(cam, x, y, f) { const zf = 1 + (cam.z - 1) * f, cx = 960 + (cam.x - 960) * f, cy = 540 + (cam.y - 540) * f; return [W / 2 + (x - cx) * zf, H / 2 + (y - cy) * zf]; }
function paintCloudsT(g, t, a) { const r = mulberry32(91); g.save(); for (let i = 0; i < 9; i++) { const x = ((r() * 2600 + t * (6 + r() * 6)) % 2600) - 500, y = -200 + r() * 420; g.globalAlpha = .45 * a; g.fillStyle = '#fffaf0'; g.beginPath(); g.ellipse(x, y, 120 + r() * 120, 24 + r() * 16, 0, 0, 7); g.fill(); } g.restore(); }
