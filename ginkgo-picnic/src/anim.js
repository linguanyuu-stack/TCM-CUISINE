import * as THREE from 'three';
import { IDS, NAMES, SEATS, SAUCERS, SAUCER_Y, STOOL_H, SPOTS, WALK, DISH, POT_Y, CUTS, T, TOSS, STRETCH, YAWN, PEEK, JUMP, TWIRL, cyc, gouqiRun, stepRate, pickTime, CLINKS, DRINKS, LAUGHS, WIN, HICCUP, FIREWORKS, FW_DIR, S, win, bump, lerp, sat, clamp, hash, mixAngle, shotAt } from './cues.js';
import { buildChar, poseArm, setFace, makeCup } from './chars.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ez = k => k * k * (3 - 2 * k);
const VIGYAW = { shudi: 1.28, tianma: .98, shanyao: .55, danggui: -1.1, heidou: -1.9 };
const maxWin = (list, t, f = .3) => { let m = 0; if (list) for (const d of list) m = Math.max(m, win(t, d[0], d[1], f)); return m; };
const W = 2.6; // stir speed
const stirGrip = t => V3(-.2 + .06 * Math.cos(W * t), .88, -.74 + .05 * Math.sin(W * t));
const stirBowl = t => V3(.18 * Math.cos(W * t + 1), POT_Y - .04, .18 * Math.sin(W * t + 1));
const H_REST = V3(-.16, .8, -.68), B_REST = V3(-.05, POT_Y - .05, .08), H_SIDE = V3(.42, .8, -.55);

function pose(i, t, c) {
  const id = IDS[i], seat = SEATS[i], w = WALK[id];
  const seatYaw = Math.atan2(-seat[0], -seat[1]);
  const P = { x: seat[0], z: seat[1], y0: id === 'hsw' ? STOOL_H : 0, yaw: seatYaw, hop: 0, sq: 1, leanF: 0, leanS: 0, tilt: 0, eye: 'open', blink: 0, open: 0, cupTilt: 0, walkAmt: 0, n: 0, reach: null,
    aN: { raise: .4, swing: 0, T: [] }, aP: { raise: .4, swing: 0, T: [] } };
  const aim = (arm, v, wt, world = false) => { if (wt > 0.001) arm.T.push({ v, w: wt, world }); };
  let v = 1;
  if (w) {
    const spot = id === 'gouqi' && t < w[0] ? gouqiRun(t) : SPOTS[id];
    const k = ez(sat((t - w[0]) / (w[1] - w[0]))); P.x = lerp(spot[0], seat[0], k); P.z = lerp(spot[1], seat[1], k);
    P.walkAmt = win(t, w[0], w[1], .15); P.n = (t - w[0]) * stepRate(id);
    P.hop += Math.abs(Math.sin(Math.PI * P.n)) * (id === 'gouqi' ? .18 : .12) * P.walkAmt; P.leanS += Math.sin(Math.PI * P.n) * .07 * P.walkAmt;
    v = 1 - S(w[0] - .35, w[0], t);
    const walkYaw = Math.atan2(seat[0] - SPOTS[id][0], seat[1] - SPOTS[id][1]);
    let vy = VIGYAW[id] ?? seatYaw;
    if (id === 'gouqi') { const cc = Math.cos(2 * Math.PI * (t - 12.6) / 3.2); vy = -Math.PI * (1 - (.5 + .5 * Math.tanh(4 * cc))); }
    if (id !== 'gouqi' && id !== 'beiqi') vy = mixAngle(vy, Math.atan2(-P.x, -P.z), S(14.95, 15.4, t) * .8);
    P.yaw = mixAngle(mixAngle(vy, walkYaw, S(w[0] - .3, w[0] + .12, t)), seatYaw, S(w[1] - .35, w[1] + .2, t));
    if (t > w[1]) { const d = t - w[1]; P.sq *= 1 - .16 * Math.exp(-d * 7) * Math.cos(d * 18); }
  }
  P.sq *= 1 + .012 * Math.sin(2.2 * t + i * 1.7);
  { const per = 3.1 + hash(i, 1) * 1.3, u = (t + hash(i, 2) * 3) % per; P.blink = u < .14 ? Math.sin(Math.PI * u / .14) : 0; }
  if (id !== 'hsw' && id !== 'shudi') P.hop += bump(t, 15.0 + i * .02, .3) * .07;

  // ---------- act 1 vignettes ----------
  if (id === 'shudi') { const as = 1 - S(T.wake, T.wake + .2, t); P.leanF += .26 * as; if (as > .5) P.eye = 'sleep'; P.sq *= 1 + .035 * Math.sin(1.7 * t) * as; P.hop += bump(t, T.wake + .05, .35) * .14; if (t > T.wake + .1 && t < T.wake + .9) P.eye = 'wide'; }
  if (id === 'tianma' && v > 0) { const u = cyc(t, YAWN), y = u < 1.6 ? win(u, 0, 1.6, .4) * v : 0; P.open = y * .95; aim(P.aP, c.mouthLocal.clone().add(V3(.1, -.07, .02)), y); P.tilt += .14 * y; if (y > .3) P.eye = 'sleep'; else P.blink = Math.max(P.blink, .45 * v); P.leanS += .07 * Math.sin(1.3 * t) * v; }
  if (id === 'shanyao' && v > 0) { const u = cyc(t, STRETCH), up = (u < 2.9 ? win(u, 0, 2.9, .45) : 0) * v; P.aN.raise = P.aP.raise = lerp(.4, 2.85, up); P.leanS += .2 * Math.sin(2 * Math.PI * (u - .5) / 1.9) * (u < 2.4 ? win(u, .5, 2.4, .3) : 0) * v; P.sq *= 1 + .07 * up; if (up > .5) P.eye = 'happy'; }
  if (id === 'hongzao' && t >= TOSS.t0 && t < TOSS.until + 1.2) { const u = cyc(t, TOSS); if (t - u < TOSS.until) { P.leanF += .62 * S(0, .28, u) * (1 - S(.36, .55, u)); aim(P.aN, V3(DISH[0], .13, DISH[1]), S(0, .26, u) * (1 - S(.9, 1.1, u)), true); aim(P.aN, c.throwLocal, S(.4, .6, u) * (1 - S(.7, .95, u))); P.hop += bump(u, .58, .22) * .05; P.open = Math.max(P.open, bump(u, .5, .4) * .7); } }
  if (id === 'hsw') { const st = 1 - S(19.5, 19.95, t); P.z = lerp(seat[1], seat[1], 1); P.leanF += .2 * st; aim(P.aN, stirGrip(t).lerp(H_REST, S(18.9, 19.3, t)), st, true);
    const wc = win(t, T.call - .1, T.call + 1.0, .2); P.aP.raise = lerp(.4, 2.5 + .3 * Math.sin(t * 14), wc); P.open = Math.max(P.open, .75 * wc * (.5 + .5 * Math.sin(t * 10))); P.hop += bump(t, T.call - .05, .3) * .06; }
  if (id === 'beiqi' && v > 0) { const f = Math.sin(2 * Math.PI * 2.5 * t); P.aN.raise = P.aP.raise = lerp(.4, .3, v); P.aN.swing = (1.15 + .45 * f) * v; P.aP.swing = (1.15 - .45 * f) * v; P.leanF += .22 * v; P.open = Math.max(P.open, .3 * v * sat(f)); }
  if (id === 'danggui' && v > 0) { P.leanS += .08 * Math.sin(2 * t) * v; const u = cyc(t, TWIRL), ok = (t - u) < 14.4; if (ok && u < 1) { P.yaw += 2 * Math.PI * ez(u); P.hop += Math.sin(Math.PI * u) * .1; P.eye = 'happy'; } const ww = (ok && u > 1.2 && u < 3.1 ? win(u, 1.2, 3.1, .3) : 0) * v; P.aP.raise = lerp(.4, 2.3 + .35 * Math.sin(9 * t), ww); }
  if (id === 'gouqi' && v > 0) { P.hop += Math.abs(Math.sin(Math.PI * 4.5 * t)) * .1 * v; P.walkAmt = Math.max(P.walkAmt, v); if (t < WALK.gouqi[0]) P.n = t * 4.5; const u = cyc(t, JUMP); if (u < .5 && t - u < 14.6) { const j = Math.sin(Math.PI * u / .5); P.hop += .5 * j; P.aN.raise = P.aP.raise = lerp(.4, 2.6, j); P.eye = 'happy'; P.open = .8 * j; } }
  if (id === 'heidou' && v > 0) { const u = cyc(t, PEEK), ok = (t - u) < 14.6; const hide = ok ? 1 - (u < 2.9 ? win(u, 0, 2.9, .25) : 0) : S(14.4, 13.9, t) * 0; const hd = (t < 14.6 ? hide : 0) * v; P.sq *= 1 - .26 * hd; if (ok) P.hop += bump(u, 0, .3) * .1; const ww = (ok && u > 1.2 && u < 2.6 ? win(u, 1.2, 2.6, .3) : 0) * v; P.aP.raise = lerp(.4, 1.9 + .25 * Math.sin(10 * t), ww); if (ww > .4) P.eye = 'happy'; }

  // ---------- act 2: cups ----------
  const tp = pickTime(i);
  if (t > tp - .6) {
    P.leanF += (id === 'hsw' ? .15 : .5) * S(tp - .5, tp - .08, t) * (1 - S(tp + .02, tp + .5, t));
    aim(P.aN, V3(SAUCERS[i][0], SAUCER_Y[i] + .05, SAUCERS[i][1]), S(tp - .5, tp - .12, t), true);
    aim(P.aN, c.holdLocal, S(tp + .02, tp + .45, t));
    let wT = win(t, 22.0, 23.5, .35) + win(t, 37.7, 38.8, .3); if (id === 'tianma') wT += win(t, WIN - .12, WIN + .9, .25); if (id === 'hsw') wT += win(t, 33.9, 34.7, .3);
    aim(P.aN, c.toastLocal, sat(wT)); P.open = Math.max(P.open, .8 * sat(wT));
    P.hop += bump(t, T.toast, .4) * .2 + bump(t, T.toast2, .35) * .15 + (id === 'tianma' ? bump(t, WIN, .4) * .28 : 0) + (id === 'shanyao' ? bump(t, HICCUP, .22) * .12 : 0);
    let wD = 0, extra = 0; for (const d of DRINKS[id] || []) { const q = win(t, d[0], d[1], .3); if (q > wD) { wD = q; extra = (d[1] - d[0] > 1.5) ? S(d[0], d[1], t) * .3 : 0; } }
    aim(P.aN, c.mouthLocal, wD); P.cupTilt = wD * (.9 + extra); P.tilt += (.18 + extra) * wD; if (wD > .5) P.eye = 'sleep';
    for (const k of CLINKS) if (k.ids.includes(id)) { const wC = S(k.t - .55, k.t - .03, t) * (1 - S(k.t + .12, k.t + .55, t)); if (wC > 0) { const Pv = V3(...k.P); const dx = P.x - Pv.x, dz = P.z - Pv.z, d = Math.hypot(dx, dz) || 1; Pv.x += dx / d * .055; Pv.z += dz / d * .055; P.yaw = mixAngle(P.yaw, Math.atan2(-dx, -dz), wC * .6); aim(P.aN, Pv, wC, true); P.reach = { v: Pv, w: wC }; P.hop += bump(t, k.t, .2) * .04; } }
    const wL = maxWin(LAUGHS[id], t); if (wL > 0) { const s = Math.sin(t * 13 + i); P.hop += Math.abs(s) * .05 * wL; P.leanS += s * .05 * wL; if (wL > .4) P.eye = 'happy'; P.open = Math.max(P.open, .75 * wL * (.6 + .4 * s)); }
    if (id === 'shudi') { const ch = win(t, 29.6, 32.2, .3); P.aP.raise = lerp(P.aP.raise, 2.3 + .4 * Math.sin(t * 12), ch); }
    if (t > 23.5 && t < 41) P.hop += .015 * Math.abs(Math.sin(3.5 * t + i * 1.3));
    const wow = win(t, T.lanterns + .1, 40.6, .3); P.tilt += .18 * wow; if (wow > .5) { P.eye = 'wide'; P.open = Math.max(P.open, .45); }
  }
  // ---------- act 3: fireworks + farewell ----------
  if (t > 41) {
    P.hop += bump(t, T.whistle + .15 + i * .02, .3) * .08;
    const wF = S(42.0, 43.0, t) * (1 - S(52.0, 53.2, t));
    P.yaw = mixAngle(P.yaw, Math.atan2(FW_DIR[0] - P.x, FW_DIR[1] - P.z), wF); P.tilt += .3 * wF; if (wF > .5) P.eye = 'wide';
    if (t < 53) for (const f of FIREWORKS) { if (f.bg) continue; const d = t - f.t - .1 - hash(i, f.seed) * .25; if (d > 0 && d < 1.2) { P.open = Math.max(P.open, .7 * Math.exp(-d * 2)); if (d < .4 && hash(i + 7, f.seed) < .45) P.hop += Math.sin(Math.PI * d / .4) * .13; } }
    const wCh = win(t, 48.4, 52.0, .4) * (hash(i, 3) < .7 ? 1 : .4); P.aP.raise = lerp(P.aP.raise, 2.5 + .25 * Math.sin(t * 9 + i), wCh); if (wCh > .6) P.eye = 'happy';
    if (id === 'hsw') {
      P.yaw += .55 * Math.sin((t - 52.9) * 2 * Math.PI / 1.5) * win(t, 52.9, 54.4, .25);
      const sp = win(t, T.speak[0], T.speak[1], .25); P.open = Math.max(P.open, sp * (.4 + .35 * Math.sin(t * 11)));
      P.aP.raise = lerp(P.aP.raise, 2.45 + .3 * Math.sin(8 * t), win(t, 54.2, 60.5, .3)); P.hop += bump(t, 54.05, .35) * .1 + bump(t, 57.5, .35) * .1; if (t > 57.7 || (t > 53 && t < 54)) P.eye = 'happy';
    } else if (t > 53) {
      P.yaw = mixAngle(P.yaw, Math.atan2(SEATS[4][0] - P.x, SEATS[4][1] - P.z), win(t, 53.4, 56.3, .5) * .5);
      const wv = S(T.waveAll + i * .05, T.waveAll + .5 + i * .05, t); P.yaw = mixAngle(P.yaw, Math.atan2(-P.x, 7.5 - P.z), wv * .85);
      P.aP.raise = lerp(P.aP.raise, 2.4 + .3 * Math.sin(9 * t + i), wv); P.hop += bump(t, 57.45 + hash(i, 4) * .2, .35) * .15; if (t > 57.3) { P.eye = 'happy'; P.open = Math.max(P.open, .5); }
    }
  }
  return P;
}

export function buildCast(scene) {
  const cast = IDS.map(buildChar);
  cast.forEach((c, i) => { scene.add(c.root, c.shadow); c.toastLocal = V3(c.armN.rest.x * .9, c.armN.rest.y + .26, c.armN.rest.z + .17); c.throwLocal = V3(c.armN.rest.x * .8, c.armN.rest.y + .2, c.armN.rest.z + .24);
    c.gcup = makeCup(); c.gcup.position.set(SAUCERS[i][0], SAUCER_Y[i], SAUCERS[i][1]); scene.add(c.gcup); });
  const wood = new THREE.MeshStandardMaterial({ color: 0xb58a55, roughness: .7 });
  const ladle = new THREE.Group(); const hg = new THREE.CylinderGeometry(.016, .016, 1, 8); hg.rotateX(Math.PI / 2); hg.translate(0, 0, .5); const handle = new THREE.Mesh(hg, wood); handle.castShadow = true; const bowl = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 8, 0, 6.283, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb58a55, side: THREE.DoubleSide })); ladle.add(handle, bowl); scene.add(ladle);
  const date = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), new THREE.MeshStandardMaterial({ color: 0xa82a1c, roughness: .4 })); date.scale.set(1.4, 1, 1); date.castShadow = true; scene.add(date);
  const drops = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.022, 6, 5), new THREE.MeshStandardMaterial({ color: 0x9a5a2a, roughness: .2 })); scene.add(m); return m; });
  const tv = V3(), tv2 = V3(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), XA = V3(1, 0, 0), YA = V3(0, 1, 0), hz = cast[3], hsw = cast[4];

  function resolve(c, arm, a) { let tgt = null, wt = 0; for (const k of a.T) { const lv = k.world ? c.pivot.worldToLocal(tv.copy(k.v)).clone() : k.v; if (!tgt) { tgt = lv.clone(); wt = k.w; } else { tgt.lerp(lv, k.w); wt = Math.max(wt, k.w); } } poseArm(arm, { raise: a.raise, swing: a.swing, aim: tgt, w: wt }); }
  function apply(c, P, t) {
    c.root.position.set(P.x, P.y0 + P.hop, P.z); c.root.rotation.y = P.yaw; c.pivot.rotation.set(P.leanF - P.tilt, 0, P.leanS); const k = 1 / Math.sqrt(P.sq); c.pivot.scale.set(k, P.sq, k); c.root.updateMatrixWorld(true);
  }
  function update(t) {
    cast.forEach((c, i) => {
      const P = pose(i, t, c); c.P = P; apply(c, P, t);
      if (P.reach && P.reach.w > 0) { c.armN.sh.getWorldPosition(tv); const dy = P.reach.v.y - tv.y, h = Math.hypot(P.reach.v.x - tv.x, P.reach.v.z - tv.z), ht = Math.sqrt(Math.max(.44 * .44 - dy * dy, .01)); if (h > ht) { const m = (h - ht) * P.reach.w / h * .45; P.x += (P.reach.v.x - tv.x) * m; P.z += (P.reach.v.z - tv.z) * m; apply(c, P, t); } }
      resolve(c, c.armN, P.aN); resolve(c, c.armP, P.aP);
      setFace(c, P.eye, P.blink, P.open);
      const wa = P.walkAmt; c.feet.forEach((f, s) => { const ph = Math.PI * P.n + (s ? Math.PI / 2 : 0); f.position.z = c.R(.1) * .35 * c.sz + .04 + Math.sin(ph * 1) * .07 * wa * (s ? 1 : -1); f.position.y = .04 + Math.max(0, Math.sin(ph)) * .03 * wa; });
      c.shadow.position.set(P.x, P.y0 + .045, P.z); c.shadow.scale.setScalar(Math.max(.4, 1 - P.hop * .9));
      for (const w of c.wig) { if (w.sway) { const a = w.sway[0], sw = w.sway[1] + .06 * Math.sin(t * 2.2 + w.sway[2]) + P.hop * .5; w.o.rotation.set(Math.cos(a) * sw, 0, -Math.sin(a) * sw); } else w.o.rotation[w.ax] = w.base + w.amp * Math.sin(t * w.f + w.ph) * (1 + P.walkAmt * 1.5) + P.hop * w.amp * 3; }
      const held = t >= pickTime(i); c.gcup.visible = !held; c.cup.visible = held;
      if (held) { c.root.updateMatrixWorld(true); c.armN.hand.getWorldQuaternion(q).invert(); q2.setFromAxisAngle(YA, P.yaw); c.cup.quaternion.copy(q).multiply(q2).multiply(q.setFromAxisAngle(XA, -P.cupTilt)); c.cup.userData.soup.visible = t < 40; }
    });
    // ladle: bowl end in the pot, handle end in He Shou Wu's hand until he rests it on the rim
    hsw.root.updateMatrixWorld(true); hsw.armN.hand.getWorldPosition(tv); tv.lerp(H_REST, S(19.3, 19.48, t)).lerp(H_SIDE, S(19.55, 20.15, t)); const B = stirBowl(t).lerp(B_REST, S(18.9, 19.3, t)); ladle.position.copy(B); ladle.lookAt(tv); handle.scale.z = B.distanceTo(tv) + .05; bowl.quaternion.copy(ladle.quaternion).invert();
    // Hong Zao's date: grabbed from the dish, thrown, lands in the pot
    let dv = false; drops.forEach(d => d.visible = false);
    if (t >= TOSS.t0) { const u = cyc(t, TOSS), st = t - u; if (st < TOSS.until) { const k = Math.round((st - TOSS.t0) / TOSS.period); const L = V3((hash(k, 1) - .5) * .4, POT_Y, (hash(k, 2) - .5) * .4 - .05);
        hz.root.updateMatrixWorld(true); hz.armN.hand.getWorldPosition(tv);
        if (u >= TOSS.grab && u < TOSS.release) { date.position.copy(tv); date.position.y -= .03; dv = true; }
        else if (u >= TOSS.release && u < TOSS.land) { const f = (u - TOSS.release) / (TOSS.land - TOSS.release); hz.pivot.localToWorld(tv2.copy(hz.throwLocal)); tv2.y -= .03; date.position.lerpVectors(tv2, L, f); date.position.y += Math.sin(Math.PI * f) * .55; date.rotation.x = f * 9; dv = true; }
        else if (u >= TOSS.land && u < TOSS.land + .3) { const f = (u - TOSS.land) / .3; drops.forEach((d, j) => { d.visible = true; const a = j * 1.57 + k; d.position.set(L.x + Math.cos(a) * .12 * f, POT_Y + Math.sin(Math.PI * f) * .16, L.z + Math.sin(a) * .12 * f); }); } } }
    date.visible = dv;
  }
  return { cast, update };
}

// ---------- camera ----------
const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const SHOTS = [
  u => { const e = S(.12, .95, u); return { p: L3([-1.5, 2.2, 6.0], [0, 3.1, 10.5], e), q: L3([-4.2, 8.2, -3.5], [0, .8, 0], e), fov: 40 }; },
  u => ({ p: L3([-2.3, 1.55, 3.3], [-2.0, 1.45, 3.0], u), q: [0, .78, -.9], fov: 34 }),
  u => ({ p: L3([-.2, 1.05, 2.5], [-.45, 1.0, 2.3], u), q: [-3.8, .55, -.9], fov: 40 }),
  u => ({ p: L3([.3, 1.15, .3], [.5, 1.1, .25], u), q: [4.4, .55, 0], fov: 44 }),
  u => ({ p: L3([0, 3.2, 9.0], [0, 2.3, 6.2], ez(u)), q: [0, .6, -.3], fov: 36 }),
  u => ({ p: L3([0, 2.4, 5.6], [0, 2.1, 5.0], u), q: [0, .85, -.5], fov: 38 }),
  u => ({ p: L3([.22, 1.02, .08], [.32, .98, .06], u), q: [1.85, .5, .03], fov: 41 }),
  u => ({ p: L3([-.18, 1.02, -.02], [-.26, .98, -.06], u), q: [-1.7, .58, -.5], fov: 45 }),
  u => ({ p: L3([0, 1.7, 2.9], [0, 1.55, 2.5], u), q: [0, .75, -1.25], fov: 40 }),
  u => ({ p: L3([-2.8, 1.9, 5.0], [-1.2, 1.8, 5.4], u), q: [0, 1.25, -.4], fov: 42 }),
  u => ({ p: L3([-2.5, .9, 6.8], [-2.2, .85, 6.4], u), q: [5.5, 5.5, -9], fov: 52 }),
  u => ({ p: L3([3.3, .7, -5.3], [3.0, .7, -4.8], u), q: [0, 1.25, 0], fov: 40 }),
  u => ({ p: L3([-3.0, 1.2, 8.5], [-2.6, 1.15, 8.0], u), q: [6, 6.5, -9], fov: 56 }),
  u => { const e = S(.42, .95, u); return { p: L3([-.7, 1.5, 2.0], [0, 2.1, 5.7], e), q: L3([0, 1.0, -1.15], [0, 1.2, -.4], e), fov: lerp(36, 40, e) }; },
];
export function setCamera(cam, t) {
  const s = shotAt(t), u = (t - CUTS[s]) / (CUTS[s + 1] - CUTS[s]), c = SHOTS[s](u);
  cam.position.set(c.p[0] + Math.sin(t * .5) * .03, c.p[1] + Math.sin(t * .37 + 1) * .02, c.p[2]); cam.fov = c.fov; cam.lookAt(c.q[0] + Math.sin(t * .43) * .02, c.q[1], c.q[2]); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}

// ---------- 2D overlay: titles, name tags, speech ----------
const FONT = '"Title", "LXGW WenKai TC", "PingFang TC", "Microsoft JhengHei", "WenQuanYi Zen Hei", sans-serif';
const TAGS = { 1: ['hongzao', 'hsw', 'beiqi'], 2: ['shudi', 'tianma', 'shanyao'], 3: ['danggui', 'gouqi', 'heidou'] };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function drawOverlay(g, t, cam, cast, Wd, Hd) {
  g.clearRect(0, 0, Wd, Hd); const pv = V3();
  const proj = (x, y, z) => { pv.set(x, y, z).project(cam); return [(pv.x * .5 + .5) * Wd, (-pv.y * .5 + .5) * Hd, pv.z < 1]; };
  if (!drawOverlay.paper) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); let sd = 7; const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 5200; i++) { const v = rn(); x.fillStyle = v > .5 ? `rgba(255,250,235,${.03 + rn() * .04})` : `rgba(90,60,30,${.02 + rn() * .03})`; x.fillRect(rn() * 256, rn() * 256, 1 + rn() * 2.4, 1 + rn() * 2.4); } drawOverlay.paper = g.createPattern(c, 'repeat'); }
  g.fillStyle = drawOverlay.paper; g.fillRect(0, 0, Wd, Hd); g.fillStyle = 'rgba(255,236,200,.05)'; g.fillRect(0, 0, Wd, Hd);
  const vg = g.createRadialGradient(Wd / 2, Hd / 2, Hd * .45, Wd / 2, Hd / 2, Hd * 1.05); vg.addColorStop(0, 'rgba(40,20,5,0)'); vg.addColorStop(1, 'rgba(40,20,5,.42)'); g.fillStyle = vg; g.fillRect(0, 0, Wd, Hd);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const s = shotAt(t);
  if (TAGS[s]) { const a = win(t, CUTS[s] + .35, CUTS[s + 1] - .15, .3); if (a > 0) for (const id of TAGS[s]) { const c = cast[IDS.indexOf(id)], P = c.P; const [x, y] = proj(P.x, P.y0 + c.H + .34, P.z); const name = NAMES[id]; g.globalAlpha = a; g.font = `44px ${FONT}`; const w = g.measureText(name).width + 44; const yy = y - (1 - a) * 12; rr(g, x - w / 2, yy - 32, w, 64, 32); g.fillStyle = 'rgba(255,247,228,.94)'; g.fill(); g.strokeStyle = '#a8703a'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#6b3f1d'; g.fillText(name, x, yy + 2); } g.globalAlpha = 1; }
  if (s === 2) { const c = cast[0], a = win(t, 7.9, 10.8, .3); for (let k = 0; k < 3; k++) { const u = ((t * .6 + k / 3) % 1); const [x, y] = proj(c.P.x + .25 + u * .3, c.H + .2 + u * .6, c.P.z); g.globalAlpha = a * Math.sin(Math.PI * u); g.font = `${Math.round(30 + u * 30)}px ${FONT}`; g.fillStyle = '#fff'; g.strokeStyle = '#7a5a8a'; g.lineWidth = 5; g.strokeText('z', x, y); g.fillText('z', x, y); } g.globalAlpha = 1; }
  const stroked = (txt, x, y, px, fill, stroke, lw) => { g.font = `${px}px ${FONT}`; g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(txt, x, y); g.fillStyle = fill; g.fillText(txt, x, y); };
  { const a = win(t, T.title[0], T.title[1], .5); if (a > 0) { g.globalAlpha = a; const y0 = Hd * .30 - (1 - S(T.title[0], T.title[0] + .7, t)) * 30; g.font = `52px ${FONT}`; const w = g.measureText('宜康中醫').width + 80; rr(g, Wd / 2 - w / 2, y0 - 150, w, 84, 42); g.fillStyle = 'rgba(255,246,222,.95)'; g.fill(); g.strokeStyle = '#b07a3c'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#7a4a22'; g.fillText('宜康中醫', Wd / 2, y0 - 106); stroked('何首烏藥膳', Wd / 2, y0 + 30, 170, '#6b3518', '#fff6dc', 22); g.globalAlpha = 1; } }
  { const a = win(t, T.toast, T.toast + 1.25, .15); if (a > 0) { const k = 1 + .35 * Math.exp(-(t - T.toast) * 6) * Math.cos((t - T.toast) * 14); let [x, y] = proj(0, 2.1, 0); y = Math.max(y, 130); g.globalAlpha = a; g.save(); g.translate(x, y); g.rotate(-.06); g.scale(k, k); stroked('乾杯！', 0, 0, 130, '#e0662a', '#fff6dc', 20); g.restore(); g.globalAlpha = 1; } }
  for (const k of CLINKS) { const d = t - k.t; if (d >= 0 && d < .4) { const [x, y] = proj(k.P[0], k.P[1] + .08, k.P[2]); const r = 30 + d * 170, a = 1 - d / .4; g.globalAlpha = a; g.strokeStyle = '#fff6c8'; g.lineWidth = 7 * a + 1; for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4 + .3; g.beginPath(); g.moveTo(x + Math.cos(an) * r * .45, y + Math.sin(an) * r * .45); g.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); g.stroke(); } g.globalAlpha = 1; } }
  { const a = win(t, T.speak[0], T.speak[1], .2); if (a > 0) { const c = cast[4]; const [hx, hy] = proj(c.P.x, c.P.y0 + c.H + .1, c.P.z); const txt = '來年大家還要再次相聚喔！'; g.font = `66px ${FONT}`; const w = g.measureText(txt).width + 110, h = 130; const x = clamp(hx + 40, w / 2 + 40, Wd - w / 2 - 40), y = Math.max(hy - 150, h / 2 + 40); const k = .9 + .1 * S(T.speak[0], T.speak[0] + .3, t); g.globalAlpha = a; g.save(); g.translate(x, y); g.scale(k, k); g.beginPath(); g.moveTo(hx - x - 10, h / 2 - 6); g.lineTo(hx - x + 6, h / 2 + 48); g.lineTo(hx - x + 60, h / 2 - 6); g.closePath(); g.fillStyle = 'rgba(255,248,230,.97)'; g.strokeStyle = '#a8703a'; g.lineWidth = 5; g.stroke(); rr(g, -w / 2, -h / 2, w, h, 60); g.stroke(); g.fill(); g.beginPath(); g.moveTo(hx - x - 7, h / 2 - 8); g.lineTo(hx - x + 6, h / 2 + 42); g.lineTo(hx - x + 56, h / 2 - 8); g.closePath(); g.fill(); g.fillStyle = '#6b3518'; g.fillText(txt, 0, 4); g.restore(); g.globalAlpha = 1; } }
  { const a = S(T.endCard, T.endCard + .8, t); if (a > 0) { g.globalAlpha = a; const gr = g.createLinearGradient(0, Hd * .62, 0, Hd); gr.addColorStop(0, 'rgba(20,10,30,0)'); gr.addColorStop(1, 'rgba(20,10,30,.6)'); g.fillStyle = gr; g.fillRect(0, Hd * .62, Wd, Hd * .38); stroked('宜康中醫 · 何首烏藥膳', Wd / 2, Hd * .86, 96, '#fff3d2', 'rgba(90,45,15,.9)', 14); g.globalAlpha = 1; } }
  const f = 1 - S(0, .7, t) + S(59.5, 60, t) * .0; if (f > 0) { g.fillStyle = `rgba(30,18,8,${f})`; g.fillRect(0, 0, Wd, Hd); }
}
