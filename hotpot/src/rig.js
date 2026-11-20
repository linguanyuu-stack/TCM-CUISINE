// ---------------------------------------------------------------------------
// Character rigs. Each friend is assembled from separately animated parts:
// body, eyes (lids + look direction), mouth shapes, cheeks, arms + hands,
// legs + feet, and accessories. Designs follow the three character sheets.
// Local units: ~300 = a standing friend's height; origin = ground under body.
// ---------------------------------------------------------------------------
const INK = '#5a2c12', INK_D = '#3a1a08';
const IMG = {};
function loadImages(srcs) { return Promise.all(Object.entries(srcs).map(([k, s]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = rej; im.src = s; }))); }

function capsule(x1, y1, x2, y2, r1, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1), p = new Path2D(), h = Math.PI / 2;
  p.moveTo(x1 + Math.cos(a + h) * r1, y1 + Math.sin(a + h) * r1);
  p.lineTo(x2 + Math.cos(a + h) * r2, y2 + Math.sin(a + h) * r2);
  p.arc(x2, y2, r2, a + h, a - h, true);
  p.lineTo(x1 + Math.cos(a - h) * r1, y1 + Math.sin(a - h) * r1);
  p.arc(x1, y1, r1, a - h, a + h - 2 * Math.PI, true);
  p.closePath(); return p;
}
function ink(ctx, p, w = 3, c = INK, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(p); ctx.restore(); }
function fillShade(ctx, p, base, o = {}) {
  // base fill + pigment grain + soft roundness + edge pooling
  ctx.save(); ctx.fillStyle = base; ctx.fill(p); ctx.clip(p);
  if (o.tex) { ctx.globalAlpha = o.texA || 1; ctx.fillStyle = o.tex; ctx.fill(p); ctx.globalAlpha = 1; }
  if (o.light) { const g = ctx.createRadialGradient(o.light[0], o.light[1], 2, o.light[0], o.light[1], o.light[2]); g.addColorStop(0, 'rgba(255,245,220,.42)'); g.addColorStop(1, 'rgba(255,245,220,0)'); ctx.fillStyle = g; ctx.fill(p); }
  if (o.dark) { ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(o.dark[0], o.dark[1], o.dark[2] * .45, o.dark[0], o.dark[1], o.dark[2]); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, o.darkC || 'rgba(150,90,60,.55)'); ctx.fillStyle = g; ctx.fill(p); ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.grain == null ? .22 : o.grain; ctx.fillStyle = pat(ctx, TEX.grain, .7); ctx.fill(p);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (o.edge) { ctx.strokeStyle = o.edge; ctx.globalAlpha = .35; ctx.lineWidth = 9; ctx.stroke(p); }
  ctx.restore();
}
function patImg(ctx, im, s = 1, rot = 0) { const p = ctx.createPattern(im, 'repeat'); p.setTransform(new DOMMatrix().rotateSelf(rot).scaleSelf(s, s)); return p; }

// ---- face ---------------------------------------------------------------------
// F: {x,y, ex (half eye spacing), rx, ry, cheek:[dx,dy,rx,ry], my (mouth dy), mw, skin}
// P.eye: {open 0..1, lx, ly (-1..1), style 'n'|'happy'|'wide'|'closed'}, P.mouth: {shape, open}
function drawFace(ctx, F, P) {
  const e = P.eye || {}, m = P.mouth || {}, open = e.open == null ? 1 : e.open, st = e.style || 'n';
  const wide = st === 'wide' ? (e.wide == null ? 1 : e.wide) : 0;
  const lx = (e.lx || 0) * F.rx * .75, ly = (e.ly || 0) * F.ry * .55;
  // cheeks
  const cb = 1 + (P.blush || 0) * .25;
  ctx.fillStyle = `rgba(238,116,92,${.78 + (P.blush || 0) * .2})`;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(F.x + s * F.cheek[0] + lx * .3, F.y + F.cheek[1], F.cheek[2] * cb, F.cheek[3] * cb, 0, 0, 7); ctx.fill(); }
  for (const s of [-1, 1]) {
    const ex = F.x + s * F.ex + lx, ey = F.y + ly, rx = F.rx * (1 + wide * .32), ry = F.ry * (1 + wide * .38);
    if (st === 'happy') { ctx.strokeStyle = INK_D; ctx.lineWidth = F.rx * .55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, ey + ry * .45, rx * 1.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); continue; }
    if (st === 'closed' || open < .07) { ctx.strokeStyle = INK_D; ctx.lineWidth = F.rx * .5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, ey - ry * .35, rx * 1.15, Math.PI * .18, Math.PI * .82); ctx.stroke(); continue; }
    ctx.save();
    const yl = ey - ry * 1.15 + (1 - open) * ry * 2.15;   // lid edge (top of the visible eye)
    if (open < .98) ctx.clip(new Path2D(`M${ex - rx * 2} ${yl} Q${ex} ${yl + ry * .25} ${ex + rx * 2} ${yl} V${ey + ry * 2} H${ex - rx * 2} Z`));
    const eyeP = new Path2D(); eyeP.ellipse(ex, ey, rx, ry, 0, 0, 7);
    ctx.fillStyle = '#1e0f07'; ctx.fill(eyeP);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex - rx * .32 + lx * .1, Math.max(ey - ry * .36, yl + rx * .45), rx * (.36 + wide * .08), 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + rx * .32, ey + ry * .3, rx * .16, 0, 7); ctx.fill();
    ctx.restore();
    if (open < .98) { // heavy upper lid line
      ctx.save(); ctx.strokeStyle = INK_D; ctx.lineWidth = F.rx * .45; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - rx * 1.1, yl - ry * .02); ctx.quadraticCurveTo(ex, yl + ry * .28, ex + rx * 1.1, yl - ry * .02); ctx.stroke(); ctx.restore();
    }
  }
  // mouth
  const mx = F.x + lx * .45, my = F.y + F.my, w = F.mw, o = clamp(m.open || 0), sh = m.shape || 'smile';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (sh === 'smile' && o < .12) { ctx.strokeStyle = INK_D; ctx.lineWidth = w * .2; ctx.beginPath(); ctx.arc(mx, my - w * .35, w * .75, .22 * Math.PI, .78 * Math.PI); ctx.stroke(); }
  else if (sh === 'flat') { ctx.strokeStyle = INK_D; ctx.lineWidth = w * .2; ctx.beginPath(); ctx.moveTo(mx - w * .5, my); ctx.quadraticCurveTo(mx, my + w * .12 * (m.wob || 1), mx + w * .5, my - w * .05); ctx.stroke(); }
  else if (sh === 'o' || sh === 'snore') {
    const rx = w * (.28 + o * .32), ry = w * (.25 + o * .62);
    const p = new Path2D(); p.ellipse(mx, my + ry * .4, rx, ry, 0, 0, 7);
    ctx.fillStyle = '#6e1c12'; ctx.fill(p); ctx.save(); ctx.clip(p); ctx.fillStyle = '#e8786a'; ctx.beginPath(); ctx.ellipse(mx, my + ry * 1.25, rx * .8, ry * .55, 0, 0, 7); ctx.fill(); ctx.restore();
    ink(ctx, p, w * .16, INK_D);
  } else { // 'smile' with open>0, 'talk', 'grin': D-shaped open smile
    const ww = w * (sh === 'grin' ? 1.25 : 1) * (.75 + o * .35), d = w * (.25 + o * .85);
    const p = new Path2D(); p.moveTo(mx - ww * .55, my - w * .05); p.quadraticCurveTo(mx, my + w * .04, mx + ww * .55, my - w * .05);
    p.bezierCurveTo(mx + ww * .5, my + d, mx - ww * .5, my + d, mx - ww * .55, my - w * .05); p.closePath();
    ctx.fillStyle = '#7a2216'; ctx.fill(p); ctx.save(); ctx.clip(p); ctx.fillStyle = '#ee7e6e'; ctx.beginPath(); ctx.ellipse(mx, my + d * .95, ww * .32, d * .45, 0, 0, 7); ctx.fill(); ctx.restore();
    ink(ctx, p, w * .16, INK_D);
  }
}

// ---- shared limbs ---------------------------------------------------------------
function arm(ctx, sx, sy, hx, hy, r, hr, fill, o = {}) {
  const p = capsule(sx, sy, hx, hy, r, r * .9);
  fillShade(ctx, p, fill, { tex: o.tex, grain: .2 }); ink(ctx, p, 3.2);
  const sq = o.grip || 0;
  const hp = new Path2D(); hp.ellipse(hx, hy, hr * (1 + sq * .12), hr * (1 - sq * .16), o.rot || 0, 0, 7);
  fillShade(ctx, hp, fill, { tex: o.tex, light: [hx - hr * .3, hy - hr * .4, hr * 1.2], grain: .2 }); ink(ctx, hp, 3.2);
  if (sq > .2) { ctx.save(); ctx.globalAlpha = sq; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + hr * .25, hy + hr * .1, hr * .45, -0.6, 1.2); ctx.stroke(); ctx.restore(); }
}
function foot(ctx, x, y, rx, ry, fill, o = {}) {
  const p = new Path2D(); p.ellipse(x, y - ry, rx, ry, o.rot || 0, 0, 7);
  fillShade(ctx, p, fill, { tex: o.tex, light: [x - rx * .3, y - ry * 1.5, rx], grain: .2 }); ink(ctx, p, 3.2);
}
function leg(ctx, hx, hy, fx, fy, r, fill, o = {}) { const p = capsule(hx, hy, fx, fy - r * .6, r, r * .9); fillShade(ctx, p, fill, { tex: o.tex, grain: .2 }); ink(ctx, p, 3); }
function shadowAt(ctx, x, y, w, a = .28) { ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, w); g.addColorStop(0, `rgba(80,45,20,${a})`); g.addColorStop(1, 'rgba(80,45,20,0)'); ctx.fillStyle = g; ctx.translate(x, y); ctx.scale(1, .2); ctx.beginPath(); ctx.arc(0, 0, w, 0, 7); ctx.fill(); ctx.restore(); }

// ---------------------------------------------------------------------------
// Pose P (all optional):
//  x,y        ground position (world)        k   scale (world px per local unit)
//  lean       body tilt (rad, about feet)     sq  squash (+ = squash down)
//  lift       body lift (local units)        turn  −1..1 (3/4 face offset)
//  back       true → seen from behind (no face)
//  eye, mouth, blush (see drawFace)
//  hands      {L:[x,y], R:[x,y]} local positions (default: hanging)
//  grip       {L,R} 0..1 squeeze
//  feet       {L:[x,y], R:[x,y]} local positions (default: standing)
//  hold       {L:fn(ctx,x,y), R:fn} props drawn in front of the hand
//  extra per character (cape, leaf, blanket …)
// ---------------------------------------------------------------------------
function withBody(ctx, P, fn) {
  ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.lean || 0);
  const k = P.k || 1, sq = P.sq || 0; ctx.scale(k * (1 + sq * .5) * (P.flip ? -1 : 1), k * (1 - sq));
  ctx.translate(0, -(P.lift || 0)); fn(); ctx.restore();
}
// convert local → world for a pose (ignores turn)
function toWorld(P, lx, ly) {
  const k = P.k || 1, sq = P.sq || 0; let x = lx * k * (1 + sq * .5) * (P.flip ? -1 : 1), y = (ly - (P.lift || 0)) * k * (1 - sq);
  const c = Math.cos(P.lean || 0), s = Math.sin(P.lean || 0); return [P.x + x * c - y * s, P.y + x * s + y * c];
}
function toLocal(P, wx, wy) {
  const k = P.k || 1, sq = P.sq || 0, c = Math.cos(-(P.lean || 0)), s = Math.sin(-(P.lean || 0));
  const dx = wx - P.x, dy = wy - P.y; const x = dx * c - dy * s, y = dx * s + dy * c;
  return [x / (k * (1 + sq * .5) * (P.flip ? -1 : 1)), y / (k * (1 - sq)) + (P.lift || 0)];
}
const hp = (P, side, def) => (P.hands && P.hands[side]) || def;
const fp = (P, side, def) => (P.feet && P.feet[side]) || def;

// ======================= 烏烏 (He Shou Wu) =======================================
let WU_SHAPE = null;
function wuShape() {
  if (WU_SHAPE) return WU_SHAPE; const pts = [], N = 44;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    let rx = 150 * (s < 0 ? 1 - .13 * Math.pow(-s, 2) : 1.02), ry = s > 0 ? 112 : 128;
    const b = 1 + .035 * Math.sin(7 * a + 1) + .025 * Math.sin(13 * a + 2) + .015 * Math.sin(23 * a);
    pts.push([c * rx * b, -128 + s * ry * b * (s > 0 ? .9 : 1)]);
  }
  WU_SHAPE = smoothClosed(pts); return WU_SHAPE;
}
const WU_FACE = { x: 0, y: -150, ex: 46, rx: 9.5, ry: 12.5, cheek: [86, 24, 21, 13], my: 24, mw: 17, skin: '#8a5a38' };
function drawWu(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 165 * (P.k || 1), .3);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, tex = patImg(ctx, IMG.wu_tex, 1);
    const cape = P.cape || 'off';  // 'off' | 'open' | 'on'
    // cape back drape
    if (cape !== 'off') {
      const wave = (P.capeWave || 0);
      const cb = new Path2D(); cb.moveTo(-128, -165); cb.quadraticCurveTo(0, -190, 128, -165);
      cb.quadraticCurveTo(175 + wave * 8, -80, 185 + wave * 12, -16); cb.quadraticCurveTo(90, -2 + wave * 4, 0, -10); cb.quadraticCurveTo(-90, -2 - wave * 4, -185 - wave * 6, -16); cb.quadraticCurveTo(-175, -80, -128, -165); cb.closePath();
      fillShade(ctx, cb, '#8b3438', { tex: IMG.tex_cape ? patImg(ctx, IMG.tex_cape, .9) : null, texA: .45, dark: [0, -90, 200], darkC: 'rgba(80,20,25,.5)' });
      ctx.save(); ctx.clip(cb); ctx.strokeStyle = '#e2a443'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-185, -16); ctx.quadraticCurveTo(-90, -2, 0, -10); ctx.quadraticCurveTo(90, -2, 185, -16); ctx.stroke(); ctx.restore();
      ink(ctx, cb, 3.2);
    }
    // feet (behind the body bottom)
    const fL = fp(P, 'L', [-62, 0]), fR = fp(P, 'R', [62, 0]);
    const shoe = P.shoes || {};
    for (const [f, sd] of [[fL, 'L'], [fR, 'R']]) {
      foot(ctx, f[0], f[1], 44, 27, '#7a4a2a', { tex });
      if (shoe[sd]) { const sp = new Path2D(); sp.moveTo(f[0] - 46, f[1] - 4); sp.quadraticCurveTo(f[0] - 46, f[1] - 34, f[0] - 8, f[1] - 32); sp.quadraticCurveTo(f[0] + 44, f[1] - 30, f[0] + 48, f[1] - 6); sp.quadraticCurveTo(f[0], f[1] + 4, f[0] - 46, f[1] - 4); fillShade(ctx, sp, '#8e5a32', { light: [f[0] - 10, f[1] - 30, 50] }); ink(ctx, sp, 3); flower5(ctx, f[0] + 6, f[1] - 22, 9, '#f2c14e', '#e07a3a', INK); }
    }
    // body
    const B = wuShape();
    fillShade(ctx, B, '#7c4f30', { tex, texA: .95, light: [-50 + turn * 30, -200, 150], dark: [turn * 20, -128, 175], darkC: 'rgba(70,35,15,.55)' });
    ctx.save(); ctx.clip(B); const r = mulberry32(31); ctx.strokeStyle = 'rgba(60,28,10,.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const x = (r() - .5) * 250, y = -230 + r() * 210, l = 18 + r() * 22, a = r() * 3; ctx.beginPath(); ctx.arc(x, y, l, a, a + 1.4); ctx.stroke(); } ctx.restore();
    ink(ctx, B, 4.2);
    // sprout with follow-through
    if (IMG.wu_sprout) { ctx.save(); ctx.translate(turn * 14, -238); ctx.rotate(P.leaf || 0); const sw = 132, sh = sw * IMG.wu_sprout.height / IMG.wu_sprout.width; ctx.drawImage(IMG.wu_sprout, -sw / 2, -sh + 4, sw, sh); ctx.restore(); }
    // face
    if (!P.back) drawFace(ctx, { ...WU_FACE, x: WU_FACE.x + turn * 40 }, P);
    // cape collar + clasp
    if (cape !== 'off') {
      const fas = cape === 'on' ? 1 : (P.fasten || 0);
      const band = (x0, y0, x1, y1, cy) => { const p = new Path2D(); p.moveTo(x0, y0 - 15); p.quadraticCurveTo((x0 + x1) / 2, cy - 15, x1, y1 - 15); p.lineTo(x1, y1 + 17); p.quadraticCurveTo((x0 + x1) / 2, cy + 17, x0, y0 + 17); p.closePath(); return p; };
      const L1 = P.capeL || [lerp(-40, 20, fas), lerp(-60, -82, fas)], R1 = P.capeR || [lerp(80, 50, fas), lerp(-58, -82, fas)];
      for (const [p, isR] of [[band(-138, -120, L1[0], L1[1], -88 + (1 - fas) * 20), 0], [band(138, -120, R1[0], R1[1], -88 + (1 - fas) * 20), 1]]) {
        fillShade(ctx, p, '#9b3c3e', { tex: IMG.tex_cape ? patImg(ctx, IMG.tex_cape, .9) : null, texA: .4 });
        ctx.save(); ctx.clip(p); ctx.strokeStyle = '#e2a443'; ctx.lineWidth = 6; ctx.stroke(p); ctx.restore(); ink(ctx, p, 3);
      }
      // flower clasp on the right end
      const cx = R1[0] - 6, cy = R1[1] + 1; ctx.save(); ctx.translate(cx, cy); ctx.rotate(P.claspRot || 0);
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * 1.2566); const pe = new Path2D(); pe.ellipse(0, -14, 10, 14, 0, 0, 7); ctx.fillStyle = '#f0b440'; ctx.fill(pe); ctx.fillStyle = '#c4553e'; ctx.beginPath(); ctx.ellipse(0, -14, 5, 8, 0, 0, 7); ctx.fill(); ink(ctx, pe, 2.4); ctx.restore(); }
      ctx.fillStyle = '#f6d36a'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); ink(ctx, new Path2D('M7 0 A7 7 0 1 1 7 -0.01'), 2); ctx.restore();
    }
    // arms
    const sw = P.armSwing || 0;
    const hL = hp(P, 'L', [-146 - sw * 12, -82 + Math.abs(sw) * 4]), hR = hp(P, 'R', [146 + sw * 12, -82 + Math.abs(sw) * 4]);
    if (P.hold && P.hold.L0) P.hold.L0(ctx, hL[0], hL[1]); if (P.hold && P.hold.R0) P.hold.R0(ctx, hR[0], hR[1]);
    arm(ctx, -118, -128, hL[0], hL[1], 21, 26, '#7c4f30', { tex, grip: (P.grip || {}).L });
    arm(ctx, 118, -128, hR[0], hR[1], 21, 26, '#7c4f30', { tex, grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}

// ======================= 歸歸 (Dang Gui) ========================================
const GUI_FACE = { x: 4, y: -192, ex: 38, rx: 8.5, ry: 11, cheek: [70, 24, 18, 11], my: 22, mw: 15, skin: '#f6e2a8' };
function ribbon(pts, w0, w1) {
  const L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, Math.pow(i / (n - 1), .8)) / 2; L.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); R.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]);
  }
  const p = new Path2D(); p.moveTo(...L[0]); for (let i = 1; i < n; i++) p.lineTo(...L[i]); p.arc(pts[n - 1][0], pts[n - 1][1], w1 / 2, 0, Math.PI * 2); for (let i = n - 1; i >= 0; i--) p.lineTo(...R[i]); p.closePath(); return p;
}
function bez(p0, p1, p2, p3, n = 14) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
function guiStrands(sway, t) {
  const S = [], r = mulberry32(7), N = 17;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1) - .5, sg = Math.sign(u) || 1, x0 = u * 200, y0 = -128 + Math.abs(u) * 30;
    const ex = u * 300 + (r() - .5) * 24 + sway * (10 + Math.abs(u) * 24), ey = -6 - Math.abs(u) * 26 + r() * 10;
    const wob = Math.sin((t || 0) * 1.3 + i) * 3;
    const pts = bez([x0, y0], [x0 + u * 30 + wob, -100], [ex - u * 70 - sg * 10 + wob, -50 + r() * 14], [ex, ey]);
    pts.push([ex + sg * 10, ey - 6]); pts.push([ex + sg * 12, ey - 15]);
    S.push({ pts, w: 34 + r() * 12, back: i % 2 === 1, tone: r() });
  }
  return S;
}
function drawGui(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 150 * (P.k || 1), .28);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, sway = P.sway || 0, cream = '#f8e6b2';
    const strands = guiStrands(sway, P.tt);
    const drawStrand = (s, back) => { const p = ribbon(s.pts, s.w, 7); fillShade(ctx, p, back ? '#ecd08e' : (s.tone < .5 ? '#f7e2a6' : '#f3d897'), { light: [s.pts[3][0], s.pts[3][1], 50], grain: .16 }); ctx.save(); ctx.clip(p); ctx.strokeStyle = 'rgba(200,150,70,.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); s.pts.forEach((q, k) => k ? ctx.lineTo(q[0] + 4, q[1]) : ctx.moveTo(q[0] + 4, q[1])); ctx.stroke(); ctx.restore(); ink(ctx, p, 2.4); };
    // feet peek under the roots
    const fL = fp(P, 'L', [-42, 0]), fR = fp(P, 'R', [42, 0]);
    strands.filter(s => s.back).forEach(s => drawStrand(s, true));
    foot(ctx, fL[0], fL[1], 26, 16, cream); foot(ctx, fR[0], fR[1], 26, 16, cream);
    const B = new Path2D(); B.moveTo(-112, -120); B.bezierCurveTo(-124, -210, -96, -294, 6, -294); B.bezierCurveTo(108, -292, 130, -210, 116, -120); B.quadraticCurveTo(0, -96, -112, -120); B.closePath();
    fillShade(ctx, B, cream, { light: [-30 + turn * 30, -235, 140], dark: [0, -190, 150], darkC: 'rgba(200,150,70,.4)' });
    ctx.save(); ctx.clip(B); ctx.strokeStyle = 'rgba(200,150,70,.3)'; ctx.lineWidth = 1.8; const r = mulberry32(12);
    for (let i = 0; i < 14; i++) { const x = -110 + i * 17 + r() * 6; ctx.beginPath(); ctx.moveTo(x * .5, -280); ctx.quadraticCurveTo(x * 1.05, -210, x * 1.1, -110); ctx.stroke(); } ctx.restore();
    ink(ctx, B, 3.4);
    strands.filter(s => !s.back).forEach(s => drawStrand(s, false));
    if (!P.back) drawFace(ctx, { ...GUI_FACE, x: GUI_FACE.x + turn * 34 }, P);
    ctx.save(); ctx.translate(-14, -282); ctx.rotate(P.crown || 0);
    ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-118, 82); ctx.quadraticCurveTo(-70, -6, 0, -4); ctx.quadraticCurveTo(70, -8, 116, 30); ctx.stroke();
    for (const [bx, by] of [[-114, 78], [-100, 50], [112, 26], [94, 6], [-82, 26]]) { const bp = new Path2D(); bp.ellipse(bx, by, 9, 11, 0, 0, 7); fillShade(ctx, bp, '#ef8f9b', { grain: .1 }); ink(ctx, bp, 2, '#a8505a'); }
    for (const [fx, fy, fr] of [[-62, -4, 25], [-18, -22, 29], [28, -14, 27], [68, 6, 22], [-44, 22, 21], [8, 12, 22]]) flower5(ctx, fx, fy, fr, '#f6bcc2', '#f2c14e', '#c4606e', fx * .02);
    ctx.restore();
    const sw = P.armSwing || 0;
    const hL = hp(P, 'L', [-104 - sw * 8, -104]), hR = hp(P, 'R', [108 + sw * 8, -104]);
    arm(ctx, -84, -140, hL[0], hL[1], 16, 20, cream, { grip: (P.grip || {}).L }); arm(ctx, 88, -140, hR[0], hR[1], 16, 20, cream, { grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
    if (P.hold && P.hold.both) P.hold.both(ctx, hL, hR);
  });
}

// ======================= 杞杞 (Gou Qi) ==========================================
const QI_FACE = { x: 0, y: -190, ex: 28, rx: 7.5, ry: 10, cheek: [52, 20, 15, 9], my: 19, mw: 14, skin: '#e65c30' };
function drawQiqi(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 95 * (P.k || 1), .28);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, red = '#e2552a', limb = '#d84a24';
    const fL = fp(P, 'L', [-26, 0]), fR = fp(P, 'R', [26, 0]);
    leg(ctx, -20, -50, fL[0], fL[1], 10, limb); leg(ctx, 20, -50, fR[0], fR[1], 10, limb);
    foot(ctx, fL[0] - 4, fL[1], 18, 11, limb); foot(ctx, fR[0] + 4, fR[1], 18, 11, limb);
    const B = new Path2D(); B.moveTo(0, -292); B.bezierCurveTo(52, -270, 82, -200, 76, -140); B.bezierCurveTo(70, -70, 36, -38, 0, -38); B.bezierCurveTo(-36, -38, -72, -70, -76, -140); B.bezierCurveTo(-82, -200, -52, -270, 0, -292); B.closePath();
    fillShade(ctx, B, red, { light: [-25 + turn * 25, -220, 100], dark: [0, -160, 110], darkC: 'rgba(150,30,10,.5)' });
    ctx.save(); ctx.clip(B); const r = mulberry32(21); ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const x = -70 + r() * 140, y = -270 + r() * 220; ctx.strokeStyle = r() < .6 ? 'rgba(150,35,12,.55)' : 'rgba(255,165,110,.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 8, y + 15, x - 8, y + 30, x + 4, y + 48); ctx.stroke(); } ctx.restore();
    ink(ctx, B, 3.6);
    ctx.fillStyle = '#7a3a18'; ctx.beginPath(); ctx.ellipse(0, -290, 7, 5, 0, 0, 7); ctx.fill();
    if (!P.back) drawFace(ctx, { ...QI_FACE, x: turn * 22 }, P);
    // mustard neckerchief
    if (!P.back) {
    const sc = new Path2D(); sc.moveTo(-78, -162); sc.quadraticCurveTo(0, -132, 78, -162); sc.lineTo(76, -130); sc.quadraticCurveTo(40, -108, 2, -64); sc.quadraticCurveTo(-36, -104, -78, -128); sc.closePath();
    fillShade(ctx, sc, '#eeb53c', { light: [-20, -140, 60] }); ink(ctx, sc, 3);
    ctx.strokeStyle = '#fff4d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -118); ctx.lineTo(16, -108); ctx.stroke(); for (const [x, y] of [[-4, -120], [6, -112], [-6, -110]]) { ctx.fillStyle = '#fff4d2'; ctx.beginPath(); ctx.ellipse(x, y, 4, 2, .4, 0, 7); ctx.fill(); }
    const kn = P.knot || 0; const tails = new Path2D(); tails.moveTo(64, -142); tails.quadraticCurveTo(96 + kn * 6, -150, 110 + kn * 10, -128); tails.lineTo(92, -124); tails.closePath(); tails.moveTo(64, -138); tails.quadraticCurveTo(92, -118 + kn * 4, 98 + kn * 6, -96); tails.lineTo(80, -104); tails.closePath();
    fillShade(ctx, tails, '#e2a52e'); ink(ctx, tails, 2.6); const knot = new Path2D(); knot.ellipse(66, -140, 11, 9, 0, 0, 7); fillShade(ctx, knot, '#eeb53c'); ink(ctx, knot, 2.6);
    } else { const band = new Path2D(); band.moveTo(-76, -160); band.quadraticCurveTo(0, -136, 76, -160); band.lineTo(76, -140); band.quadraticCurveTo(0, -116, -76, -140); band.closePath(); fillShade(ctx, band, '#eeb53c'); ink(ctx, band, 2.6); }
    const sw = P.armSwing || 0;
    const hL = hp(P, 'L', [-84 - sw * 10, -104]), hR = hp(P, 'R', [84 + sw * 10, -104]);
    if (P.hold && P.hold.L0) P.hold.L0(ctx, hL[0], hL[1]); if (P.hold && P.hold.R0) P.hold.R0(ctx, hR[0], hR[1]);
    arm(ctx, -62, -150, hL[0], hL[1], 10, 15, limb, { grip: (P.grip || {}).L }); arm(ctx, 62, -150, hR[0], hR[1], 10, 15, limb, { grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}

// ======================= 麻麻 (Tian Ma) =========================================
const MA_FACE = { x: 0, y: -158, ex: 40, rx: 9, ry: 12, cheek: [74, 24, 20, 12], my: 22, mw: 16, skin: '#e2b878' };
function drawMa(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 130 * (P.k || 1), .28);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, och = '#e5bf84';
    const fL = fp(P, 'L', [-50, 0]), fR = fp(P, 'R', [50, 0]);
    foot(ctx, fL[0], fL[1], 34, 21, och); foot(ctx, fR[0], fR[1], 34, 21, och);
    const B = new Path2D(); B.ellipse(0, -150, 104, 130, 0, 0, 7);
    fillShade(ctx, B, och, { light: [-35 + turn * 30, -210, 130], dark: [0, -150, 140], darkC: 'rgba(170,110,50,.5)' });
    ctx.save(); ctx.clip(B); ctx.strokeStyle = 'rgba(160,110,55,.6)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const y = -255 + i * 30; ctx.beginPath(); ctx.ellipse(0, y, 110, 9 + i, 0, .1 * Math.PI, .9 * Math.PI); ctx.stroke(); }
    ctx.fillStyle = 'rgba(150,100,50,.5)'; const r = mulberry32(5); for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc((r() - .5) * 180, -260 + r() * 220, 1.8, 0, 7); ctx.fill(); }
    ctx.restore(); ink(ctx, B, 3.6);
    if (!P.back) drawFace(ctx, { ...MA_FACE, x: turn * 36 }, P);
    // sleeping cap (flops with follow-through)
    ctx.save(); ctx.translate(0, -258); ctx.rotate(P.cap || 0);
    const cap = new Path2D(); cap.moveTo(-100, 10); cap.bezierCurveTo(-110, -70, 40, -96, 92, -10); cap.quadraticCurveTo(0, -24, -100, 10); cap.closePath();
    fillShade(ctx, cap, '#9a4556', { light: [-10, -60, 80], dark: [0, -30, 110], darkC: 'rgba(80,20,30,.45)' }); ink(ctx, cap, 3);
    const flop = new Path2D(); flop.moveTo(-40, -60); flop.bezierCurveTo(-100, -64, -138, -20, -126, 40 + (P.capFlop || 0) * 10); flop.quadraticCurveTo(-110, 20, -96, 4); flop.quadraticCurveTo(-80, -40, -40, -60); flop.closePath();
    fillShade(ctx, flop, '#8a3a4b', {}); ink(ctx, flop, 3);
    const pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(-110, 102, u), y = lerp(12, -6, u) - 14 - 5 * Math.abs(Math.sin(u * Math.PI * 7)); pts.push([x, y]); }
    for (let i = 40; i >= 0; i--) { const u = i / 40, x = lerp(-110, 102, u), y = lerp(12, -6, u) + 14 + 5 * Math.abs(Math.sin(u * Math.PI * 7 + 1)); pts.push([x, y]); }
    const bp = smoothClosed(pts);
    fillShade(ctx, bp, '#f7f0e4', { grain: .1, dark: [0, 4, 120], darkC: 'rgba(170,150,130,.35)' }); ink(ctx, bp, 2.4);
    const pom = new Path2D(); pom.arc(-122, 52 + (P.capFlop || 0) * 10, 24, 0, 7); fillShade(ctx, pom, '#f7f0e4', { grain: .12, light: [-130, 42, 22] }); ink(ctx, pom, 2.4);
    ctx.restore();
    const sw = P.armSwing || 0;
    const hL = hp(P, 'L', [-116 - sw * 10, -96]), hR = hp(P, 'R', [116 + sw * 10, -96]);
    arm(ctx, -96, -140, hL[0], hL[1], 20, 24, och, { grip: (P.grip || {}).L }); arm(ctx, 96, -140, hR[0], hR[1], 20, 24, och, { grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}

// ======================= 棗棗 (Hong Zao) ========================================
const ZAO_FACE = { x: 0, y: -150, ex: 36, rx: 8.5, ry: 11, cheek: [66, 22, 19, 12], my: 21, mw: 15, skin: '#963026' };
function drawZao(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 125 * (P.k || 1), .28);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, red = '#93302a';
    const fL = fp(P, 'L', [-46, 0]), fR = fp(P, 'R', [46, 0]);
    foot(ctx, fL[0], fL[1], 32, 20, '#7e2420'); foot(ctx, fR[0], fR[1], 32, 20, '#7e2420');
    const r0 = mulberry32(17), pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, b = 1 + .04 * Math.sin(9 * a) + (r0() - .5) * .03; pts.push([Math.cos(a) * 112 * b, -130 + Math.sin(a) * 112 * b * (Math.sin(a) < 0 ? 1.04 : .95)]); }
    const B = smoothClosed(pts);
    fillShade(ctx, B, red, { light: [-40 + turn * 30, -190, 120], dark: [0, -130, 125], darkC: 'rgba(80,10,8,.55)' });
    ctx.save(); ctx.clip(B); const r = mulberry32(19); ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) { const x = (r() - .5) * 200, y = -230 + r() * 190; ctx.strokeStyle = r() < .65 ? 'rgba(70,12,8,.45)' : 'rgba(220,120,100,.45)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 8, x + 4, y + 22); ctx.stroke(); } ctx.restore();
    ink(ctx, B, 3.6);
    // stem, leaf, blossoms
    ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4, -236); ctx.quadraticCurveTo(10, -262, 26, -270); ctx.stroke();
    const lf = new Path2D(); lf.moveTo(-6, -238); lf.quadraticCurveTo(-60, -290, -96, -250); lf.quadraticCurveTo(-56, -226, -6, -238); fillShade(ctx, lf, '#9aac56'); ink(ctx, lf, 2.6);
    for (const [fx, fy] of [[-48, -232], [-74, -214], [-26, -216]]) flower5(ctx, fx, fy, 14, '#fff8ea', '#f2c14e', '#b98a5a');
    if (!P.back) drawFace(ctx, { ...ZAO_FACE, x: turn * 34 }, P);
    // ochre apron
    if (!P.back) {
    const ap = new Path2D(); ap.moveTo(-82, -104); ap.quadraticCurveTo(0, -94, 82, -104); ap.lineTo(78, -50); ap.quadraticCurveTo(0, -18, -78, -50); ap.closePath();
    fillShade(ctx, ap, '#eda93a', { light: [-20, -90, 70] }); ink(ctx, ap, 3);
    const pk = new Path2D(); pk.roundRect(-30, -82, 60, 40, 8); ctx.save(); ctx.setLineDash([5, 4]); ink(ctx, pk, 2, '#b07020'); ctx.restore(); flower5(ctx, 0, -62, 11, '#fff3d6', '#f2c14e', '#b07020');
    for (const s of [-1, 1]) { const tie = new Path2D(); tie.ellipse(s * 98, -100, 14, 9, s * .5, 0, 7); fillShade(ctx, tie, '#eda93a'); ink(ctx, tie, 2.4); }
    } else { const bw = new Path2D(); bw.ellipse(0, -100, 26, 14, 0, 0, 7); fillShade(ctx, bw, '#eda93a'); ink(ctx, bw, 2.4); ctx.strokeStyle = '#eda93a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-100, -100); ctx.lineTo(100, -100); ctx.stroke(); }
    const hL = hp(P, 'L', [-122, -88]), hR = hp(P, 'R', [122, -88]);
    if (P.hold && P.hold.R0) P.hold.R0(ctx, hR[0], hR[1]);
    arm(ctx, -100, -122, hL[0], hL[1], 20, 24, red, { grip: (P.grip || {}).L }); arm(ctx, 100, -122, hR[0], hR[1], 20, 24, red, { grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}

// ======================= 山山 (Shan Yao) ========================================
const SHAN_FACE = { x: 0, y: -186, ex: 36, rx: 8.5, ry: 11, cheek: [62, 24, 17, 11], my: 21, mw: 14, skin: '#f1e5cc' };
function drawShan(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 120 * (P.k || 1), .28);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, iv = '#f7ead0', sage = '#bccb98';
    const bk = new Path2D(); bk.moveTo(-96, -180); bk.quadraticCurveTo(-140, -90, -124, -8); bk.lineTo(124, -8); bk.quadraticCurveTo(140, -90, 96, -180); bk.closePath();
    fillShade(ctx, bk, '#aebd8a', { dark: [0, -90, 150], darkC: 'rgba(80,100,40,.4)' }); ink(ctx, bk, 3);
    const fL = fp(P, 'L', [-36, 0]), fR = fp(P, 'R', [36, 0]); foot(ctx, fL[0], fL[1], 26, 17, iv); foot(ctx, fR[0], fR[1], 26, 17, iv);
    const B = new Path2D(); B.moveTo(-80, -286); B.lineTo(-90, -40); B.quadraticCurveTo(-88, -18, -60, -16); B.lineTo(60, -16); B.quadraticCurveTo(88, -18, 90, -40); B.lineTo(80, -286); B.closePath();
    fillShade(ctx, B, iv, { light: [-25 + turn * 25, -220, 120], dark: [0, -150, 130], darkC: 'rgba(200,150,90,.35)', grain: .12 });
    ctx.save(); ctx.clip(B); const r = mulberry32(3); ctx.fillStyle = 'rgba(140,100,60,.55)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse((r() - .5) * 160, -280 + r() * 260, 2, 1.3, 0, 0, 7); ctx.fill(); } ctx.restore();
    ink(ctx, B, 3.4);
    const top = new Path2D(); top.ellipse(0, -286, 80, 17, 0, 0, 7); fillShade(ctx, top, '#fbf5e8', { grain: .1 }); ink(ctx, top, 3);
    ctx.strokeStyle = 'rgba(190,160,110,.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(4, -286, 46, 9, 0, 0, 7); ctx.stroke();
    if (!P.back) drawFace(ctx, { ...SHAN_FACE, x: turn * 30 }, P);
    // vine with heart leaves and a white flower
    ctx.strokeStyle = '#7f8f3a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-40, -300); ctx.bezierCurveTo(-110, -300, -120, -240, -96, -190); ctx.bezierCurveTo(-80, -160, -110, -130, -96, -110); ctx.stroke();
    for (const [lx, ly, a] of [[-104, -262, -.8], [-90, -205, .6], [-58, -302, -1.6]]) { const l = new Path2D(); l.moveTo(lx, ly); l.bezierCurveTo(lx - 30, ly - 22, lx - 32, ly + 14, lx, ly + 26); l.bezierCurveTo(lx + 32, ly + 14, lx + 30, ly - 22, lx, ly); ctx.save(); ctx.translate(lx, ly); ctx.rotate(a); ctx.translate(-lx, -ly); fillShade(ctx, l, '#93a24e'); ink(ctx, l, 2.4); ctx.restore(); }
    flower5(ctx, -30, -312, 20, '#fffaf0', '#f2c14e', '#b98a5a');
    // sage blanket front flaps (from behind: the blanket covers the back)
    if (P.back) { const bb = new Path2D(); bb.moveTo(-96, -182); bb.quadraticCurveTo(0, -200, 96, -182); bb.quadraticCurveTo(140, -100, 128, -8); bb.lineTo(-128, -8); bb.quadraticCurveTo(-140, -100, -96, -182); bb.closePath(); fillShade(ctx, bb, sage, { dark: [0, -90, 150], darkC: 'rgba(80,100,40,.35)' }); ink(ctx, bb, 3); }
    else for (const s of [-1, 1]) {
      const fl = new Path2D(); fl.moveTo(s * 96, -182); fl.quadraticCurveTo(s * 40, -170, s * 34, -150); fl.quadraticCurveTo(s * 30, -80, s * 50, -10); fl.lineTo(s * 128, -8); fl.quadraticCurveTo(s * 140, -100, s * 96, -182); fl.closePath();
      fillShade(ctx, fl, sage, { light: [s * 70, -150, 80] }); ctx.save(); ctx.clip(fl); ctx.strokeStyle = '#f1ecd6'; ctx.lineWidth = 8; ctx.stroke(fl); ctx.restore(); ink(ctx, fl, 3);
      ctx.strokeStyle = '#7f8f3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s * 90, -30); ctx.quadraticCurveTo(s * 100, -60, s * 92, -84); ctx.stroke();
    }
    const hL = hp(P, 'L', [-38, -150]), hR = hp(P, 'R', [38, -150]);
    arm(ctx, -70, -160, hL[0], hL[1], 16, 20, iv, { grip: (P.grip || {}).L }); arm(ctx, 70, -160, hR[0], hR[1], 16, 20, iv, { grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}

// ======================= 耆耆 (Huang Qi) ========================================
const QI2_FACE = { x: 6, y: -176, ex: 34, rx: 8.5, ry: 11, cheek: [62, 22, 18, 11], my: 21, mw: 15, skin: '#f4dc9c' };
function drawQi2(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 120 * (P.k || 1), .28);
  withBody(ctx, P, () => {
    const turn = P.turn || 0, cr = '#f6e2a2';
    const fL = fp(P, 'L', [-40, 0]), fR = fp(P, 'R', [40, 0]); foot(ctx, fL[0], fL[1], 28, 18, cr); foot(ctx, fR[0], fR[1], 28, 18, cr);
    const r0 = mulberry32(8), pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * 6.283, b = 1 + (i % 2 ? .03 : -.01) + (r0() - .5) * .02; pts.push([Math.cos(a) * 98 * b, -150 + Math.sin(a) * 136 * b]); }
    const rim = smoothClosed(pts); fillShade(ctx, rim, '#d9ad5e', { dark: [0, -150, 140], darkC: 'rgba(150,100,40,.5)' }); ink(ctx, rim, 3.4);
    const face = new Path2D(); face.ellipse(2, -152, 82, 120, 0, 0, 7);
    fillShade(ctx, face, cr, { light: [-20 + turn * 25, -220, 110], dark: [0, -150, 120], darkC: 'rgba(200,150,70,.4)' });
    ctx.save(); ctx.clip(face); ctx.strokeStyle = 'rgba(200,150,70,.45)'; ctx.lineWidth = 2; for (let i = 0; i < 24; i++) { const a = -Math.PI / 2 + (i - 12) * .11; ctx.beginPath(); ctx.moveTo(2, -40); ctx.lineTo(2 + Math.cos(a) * 160, -40 + Math.sin(a) * 160); ctx.stroke(); } ctx.restore();
    ink(ctx, face, 2.2, '#b8883e');
    if (!P.back) drawFace(ctx, { ...QI2_FACE, x: QI2_FACE.x + turn * 30 }, P);
    if (!P.back) {
    const ap = new Path2D(); ap.moveTo(-86, -110); ap.quadraticCurveTo(0, -100, 86, -110); ap.lineTo(80, -44); ap.quadraticCurveTo(0, -12, -80, -44); ap.closePath();
    fillShade(ctx, ap, '#9a6236', { light: [-20, -90, 70] }); ink(ctx, ap, 3);
    const pk = new Path2D(); pk.roundRect(-26, -86, 52, 36, 7); ctx.save(); ctx.setLineDash([5, 4]); ink(ctx, pk, 2, '#e8c070'); ctx.restore(); flower5(ctx, 0, -68, 11, '#f2c14e', '#e07a3a', '#7a4a20');
    const tie = new Path2D(); tie.ellipse(-100, -106, 16, 10, -.5, 0, 7); fillShade(ctx, tie, '#9a6236'); ink(ctx, tie, 2.4);
    } else { ctx.strokeStyle = '#9a6236'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-96, -106); ctx.lineTo(96, -106); ctx.stroke(); const bw = new Path2D(); bw.ellipse(0, -106, 24, 13, 0, 0, 7); fillShade(ctx, bw, '#9a6236'); ink(ctx, bw, 2.4); }
    const hL = hp(P, 'L', [-108, -94]), hR = hp(P, 'R', [108, -94]);
    if (P.hold && P.hold.R0) P.hold.R0(ctx, hR[0], hR[1]); if (P.hold && P.hold.L0) P.hold.L0(ctx, hL[0], hL[1]);
    arm(ctx, -88, -126, hL[0], hL[1], 17, 21, cr, { grip: (P.grip || {}).L }); arm(ctx, 88, -126, hR[0], hR[1], 17, 21, cr, { grip: (P.grip || {}).R });
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}

// ======================= 豆豆 (Hei Dou) =========================================
const DOU_FACE = { x: -8, y: -100, ex: 23, rx: 6.5, ry: 8, cheek: [40, 15, 12, 8], my: 12, mw: 12, skin: '#3a2219' };
function drawDou(ctx, P) {
  shadowAt(ctx, P.x, P.y + 2, 95 * (P.k || 1), .3);
  withBody(ctx, P, () => {
    const turn = P.turn || 0;
    const fL = fp(P, 'L', [-30, 0]), fR = fp(P, 'R', [30, 0]); foot(ctx, fL[0], fL[1], 18, 11, '#2b1914'); foot(ctx, fR[0], fR[1], 18, 11, '#2b1914');
    const B = new Path2D(); B.ellipse(0, -100, 88, 100, -.1, 0, 7);
    ctx.save(); const g = ctx.createRadialGradient(-28, -150, 4, -4, -100, 124); g.addColorStop(0, '#6b4636'); g.addColorStop(.45, '#382219'); g.addColorStop(1, '#1d110c'); ctx.fillStyle = g; ctx.fill(B); ctx.clip(B);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .22; ctx.fillStyle = pat(ctx, TEX.grain, .7); ctx.fill(B); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (!P.back || true) { const mk = new Path2D(); mk.ellipse(74 - turn * 20, -112, 17, 35, .12, 0, 7); ctx.fillStyle = '#f2e1ba'; ctx.fill(mk); ink(ctx, mk, 2.2, '#8b5a2c'); ctx.fillStyle = 'rgba(255,250,232,.7)'; ctx.beginPath(); ctx.ellipse(71 - turn * 20, -120, 7, 20, .12, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,240,226,.55)'; ctx.beginPath(); ctx.ellipse(-26, -176, 30, 10, -.38, 0, 7); ctx.fill();
    ctx.restore(); ink(ctx, B, 3.4, '#140a06');
    if (!P.back) drawFace(ctx, { ...DOU_FACE, x: DOU_FACE.x + turn * 22 }, P);
    if (P.blanket != null) drawDouBlanket2(ctx, P.blanket);
    const hL = hp(P, 'L', [-84, -54]), hR = hp(P, 'R', [84, -54]);
    if (P.hold && P.hold.L0) P.hold.L0(ctx, hL[0], hL[1]); if (P.hold && P.hold.both0) P.hold.both0(ctx, hL, hR);
    for (const h of [hL, hR]) { const p = new Path2D(); p.ellipse(h[0], h[1], 14, 13, 0, 0, 7); const gg = ctx.createRadialGradient(h[0] - 4, h[1] - 5, 1, h[0], h[1], 16); gg.addColorStop(0, '#5a3a2e'); gg.addColorStop(1, '#24140f'); ctx.fillStyle = gg; ctx.fill(p); ink(ctx, p, 2.6, '#120804'); }
    if (P.hold && P.hold.L) P.hold.L(ctx, hL[0], hL[1]); if (P.hold && P.hold.R) P.hold.R(ctx, hR[0], hR[1]);
  });
}
// blanket in 豆豆-local units (body height 200): b = 0 clutched … 1 in lap, 2 = shawl round shoulders
function drawDouBlanket2(ctx, b) {
  ctx.save(); ctx.scale(200, 200); const lw = 1 / 200;
  const c = { tl: [lerp(-.3, -.36, b), lerp(-.25, -.2, b)], tr: [lerp(.28, .34, b), lerp(-.25, -.2, b)], bl: [-.46, .03], br: [.46, .03] };
  const p = new Path2D(); p.moveTo(c.tl[0], c.tl[1]); p.quadraticCurveTo(0, c.tl[1] - .05, c.tr[0], c.tr[1]);
  p.bezierCurveTo(c.tr[0] + .07, -.15, c.br[0] - .02, -.06, c.br[0], c.br[1]);
  for (let i = 1; i <= 5; i++) { const x0 = lerp(c.br[0], c.bl[0], (i - 1) / 5), x1 = lerp(c.br[0], c.bl[0], i / 5); p.quadraticCurveTo((x0 + x1) / 2, c.br[1] + (i % 2 ? .045 : -.005), x1, c.bl[1]); }
  p.bezierCurveTo(c.bl[0] + .02, -.06, c.tl[0] - .07, -.15, c.tl[0], c.tl[1]); p.closePath();
  const g = ctx.createLinearGradient(0, c.tl[1], 0, .05); g.addColorStop(0, '#fae6a8'); g.addColorStop(1, '#ebc471');
  ctx.fillStyle = g; ctx.fill(p); ctx.save(); ctx.clip(p); ctx.globalAlpha = .55; ctx.strokeStyle = '#d6a957'; ctx.lineWidth = 3 * lw;
  for (const fx of [-.2, .02, .22]) { ctx.beginPath(); ctx.moveTo(fx, c.tl[1] + .04); ctx.quadraticCurveTo(fx * 1.3 + .03, -.1, fx * 1.5, .02); ctx.stroke(); }
  ctx.globalAlpha = .9; ctx.setLineDash([.025, .018]); ctx.strokeStyle = '#c48f3c'; ctx.lineWidth = 2.2 * lw; ctx.beginPath(); ctx.moveTo(c.bl[0] + .07, -.02); ctx.lineTo(c.br[0] - .07, -.02); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 1; ctx.strokeStyle = '#6f7f36'; ctx.lineWidth = 2.4 * lw; ctx.beginPath(); ctx.moveTo(.02, -.05); ctx.lineTo(.02, -.1); ctx.stroke();
  ctx.fillStyle = '#9aab52'; for (const s of [-1, 1]) { const l = new Path2D(); l.ellipse(.02 + s * .027, -.115, .028, .014, -s * .5, 0, 7); ctx.fill(l); ctx.stroke(l); }
  ctx.restore(); ctx.strokeStyle = '#a8742c'; ctx.lineWidth = 2.8 * lw; ctx.lineJoin = 'round'; ctx.stroke(p);
  ctx.restore();
}

// ======================= 地地 (Shu Di) — layered sheet art + face layer ==========
function drawDi(ctx, P) {
  const im = IMG[P.sprite || 'di_body']; if (!im) return;
  const h = (P.h || 175) * (P.k || 1), w = im.width * h / im.height;
  shadowAt(ctx, P.x, P.y + 2, w * .5, .3);
  ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.lean || 0); ctx.scale(1 + (P.sq || 0) * .5, 1 - (P.sq || 0)); ctx.drawImage(im, -w / 2, -h, w, h);
  if (!P.back && P.sprite !== 'di_yawn') { const s = h / im.height; ctx.translate(-w / 2, -h); ctx.scale(s, s); ctx.translate(200, 140); ctx.rotate(-.28); drawFace(ctx, { x: 0, y: 0, ex: 38, rx: 8, ry: 10.5, cheek: [60, 26, 19, 12], my: 16, mw: 15, skin: '#5a3330' }, P); }
  ctx.restore();
}
const RIG = { wu: drawWu, gui: drawGui, qi: drawQiqi, ma: drawMa, zao: drawZao, shan: drawShan, qi2: drawQi2, dou: drawDou, di: drawDi };
