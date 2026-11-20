import * as THREE from 'three';
import { lerp, clamp } from './cues.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...o });
const sphere = (r, mat, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat); m.scale.set(sx, sy, sz); m.castShadow = true; return m; };
export const ARM_L = 0.27;

function flower(c, s = 1, center = 0xffd75a) { const g = new THREE.Group(), pm = std(c, { roughness: .6 }); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; const p = sphere(.03 * s, pm, 1, 1, .45); p.position.set(Math.cos(a) * .034 * s, Math.sin(a) * .034 * s, 0); g.add(p); } const cc = sphere(.018 * s, std(center), 1, 1, .7); cc.position.z = .008 * s; g.add(cc); return g; }
function leaf(c, s = 1) { const m = sphere(.07 * s, std(c, { roughness: .6 }), 1, .16, .5); m.geometry = m.geometry.clone(); m.geometry.translate(.07 * s, 0, 0); return m; }
export function makeCup() { const g = new THREE.Group(); const prof = [[.0, 0], [.045, 0], [.062, .04], [.07, .1], [.062, .1], [.055, .045], [0, .03]].map(p => new THREE.Vector2(...p)); const c = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), std(0xf8efdf, { roughness: .3, side: THREE.DoubleSide })); c.castShadow = true; const s = new THREE.Mesh(new THREE.CircleGeometry(.058, 16), std(0x7b3b18, { roughness: .15 })); s.rotation.x = -Math.PI / 2; s.position.y = .082; const band = new THREE.Mesh(new THREE.TorusGeometry(.068, .006, 6, 18), std(0xd9843a)); band.rotation.x = Math.PI / 2; band.position.y = .075; g.add(c, s, band); g.userData.soup = s; return g; }

export const DEFS = {
  hsw: { prof: [[0, 0], [.26, .01], [.40, .12], [.46, .34], [.44, .56], [.36, .76], [.22, .88], [0, .93]], color: 0x5e3b25, lump: .045, faceY: .6, armY: .33, dark: 1 },
  danggui: { prof: [[0, 0], [.28, .02], [.37, .1], [.35, .3], [.31, .55], [.30, .75], [.24, .92], [.12, 1.0], [0, 1.02]], color: 0xf5e0a2, lump: .012, faceY: .68, armY: .42 },
  shanyao: { prof: [[0, 0], [.22, .01], [.28, .1], [.29, .5], [.29, .85], [.24, 1.02], [.12, 1.1], [0, 1.12]], color: 0xf6eed6, lump: .012, faceY: .86, armY: .46 },
  tianma: { prof: [[0, 0], [.24, .02], [.33, .15], [.35, .4], [.33, .62], [.27, .8], [.15, .9], [0, .93]], color: 0xe5bb7c, lump: .015, faceY: .57, armY: .34 },
  hongzao: { prof: [[0, 0], [.24, .01], [.35, .14], [.38, .38], [.35, .6], [.26, .78], [.12, .85], [0, .86]], color: 0x8e3022, lump: .01, groove: [9, .022], faceY: .58, armY: .33, dark: 1 },
  shudi: { prof: [[0, 0], [.4, .02], [.52, .15], [.54, .34], [.46, .54], [.3, .68], [.12, .74], [0, .75]], color: 0x4d2b30, lump: .05, faceY: .47, armY: .27, dark: 1 },
  gouqi: { prof: [[0, 0], [.2, .01], [.29, .12], [.31, .32], [.27, .52], [.18, .7], [.08, .82], [0, .86]], color: 0xe2412a, lump: .01, faceY: .5, armY: .28, gloss: .35 },
  beiqi: { prof: [[0, 0], [.2, .01], [.29, .1], [.31, .4], [.30, .7], [.24, .9], [.12, .98], [0, 1.0]], color: 0xf1dba3, lump: .008, groove: [16, .01], faceY: .72, armY: .45, sz: .68 },
  heidou: { prof: [[0, 0], [.26, .01], [.36, .14], [.39, .36], [.35, .56], [.24, .68], [.1, .73], [0, .74]], color: 0x2b2624, lump: .0, faceY: .42, armY: .25, dark: 1, gloss: .22 },
};

export function buildChar(id) {
  const def = DEFS[id], sx = def.sx || 1, sz = def.sz || 1;
  const root = new THREE.Group(), pivot = new THREE.Group(); root.add(pivot);
  const sp = new THREE.SplineCurve(def.prof.map(p => new THREE.Vector2(p[0], p[1]))).getPoints(48).map(p => { p.x = Math.max(p.x, 0); return p; }); sp[0].x = 0; sp[sp.length - 1].x = 0;
  const R = y => { for (let i = 1; i < sp.length; i++) if (y <= sp[i].y || i === sp.length - 1) { const a = sp[i - 1], b = sp[i], k = clamp((y - a.y) / Math.max(b.y - a.y, 1e-5), 0, 1); return lerp(a.x, b.x, k); } return 0; };
  const H = sp[sp.length - 1].y;
  const geo = new THREE.LatheGeometry(sp, 44); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z); let k = 1 + def.lump * (Math.sin(3 * a + 1.3 + 7 * y) + .6 * Math.sin(5 * a - 12 * y + 2) + .4 * Math.sin(9 * y + 2 * a)); if (def.groove) k += def.groove[1] * Math.sin(def.groove[0] * a) * Math.sin(Math.PI * y / H); p.setXYZ(i, x * k * sx, y, z * k * sz); }
  geo.computeVertexNormals();
  const bodyM = std(def.color, { roughness: def.gloss || .8 }); const body = new THREE.Mesh(geo, bodyM); body.castShadow = true; body.receiveShadow = true; pivot.add(body);
  const surf = (yaw, y, off = 0) => { const r = R(y) + off; return V3(Math.sin(yaw) * r * sx, y, Math.cos(yaw) * r * sz); };
  const place = (o, yaw, y, off = 0, parent = pivot) => { const pos = surf(yaw, y, off); const dr = (R(y + .02) - R(y - .02)) / .04; o.position.copy(pos); o.lookAt(pos.clone().add(V3(Math.sin(yaw) / sx, -dr, Math.cos(yaw) / sz))); parent.add(o); return o; };
  const shell = (y0, y1, off, phiC, phiLen, c, o = {}) => { const pts = []; for (let i = 0; i <= 14; i++) { const y = lerp(y0, y1, i / 14); pts.push(new THREE.Vector2(R(y) + off + (o.flare || 0) * (1 - i / 14), y)); } const g = new THREE.LatheGeometry(pts, 28, phiC - phiLen / 2, phiLen); g.scale(sx, 1, sz); g.computeVertexNormals(); const m = new THREE.Mesh(g, std(c, { side: THREE.DoubleSide, roughness: .9, ...(o.mat || {}) })); m.castShadow = true; return m; };

  // ---- face ----
  const fy = def.faceY, eyeR = .042, eyeDX = .40 * (.36 / Math.max(R(fy), .2));
  const eyeM = std(0x1d120c, { roughness: .15 }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lineM = std(def.dark ? 0x180c08 : 0x5a3320, { roughness: .6 });
  const eyes = [], happy = [], sleep = [];
  for (const s of [-1, 1]) {
    const holder = new THREE.Group(); place(holder, s * eyeDX, fy + .02, .004);
    if (def.dark) { const ring = sphere(eyeR * 1.28, std(new THREE.Color(def.color).lerp(new THREE.Color(0xffe0c0), .28), { roughness: .9 }), 1, 1.12, .2); holder.add(ring); }
    const e = sphere(eyeR, eyeM, 1, 1.15, .45); e.castShadow = false; e.position.z = .006; const h1 = sphere(eyeR * .32, white); h1.castShadow = false; h1.position.set(-.3 * eyeR, .4 * eyeR, eyeR * .5); const h2 = sphere(eyeR * .16, white); h2.castShadow = false; h2.position.set(.3 * eyeR, -.3 * eyeR, eyeR * .5); const eg = new THREE.Group(); eg.add(e, h1, h2); holder.add(eg); eyes.push(eg);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(eyeR * .85, eyeR * .26, 6, 12, Math.PI), def.dark ? std(0x0c0604, { roughness: .3 }) : lineM); arc.position.z = .012; holder.add(arc); happy.push(arc);
    const arc2 = arc.clone(); arc2.rotation.z = Math.PI; arc2.position.y = .012; holder.add(arc2); sleep.push(arc2);
    const ck = sphere(.05, new THREE.MeshStandardMaterial({ color: def.dark ? 0xff7d6e : 0xff9a8c, transparent: true, opacity: def.dark ? .75 : .6, roughness: 1 }), 1.15, .75, .18); ck.castShadow = false; place(ck, s * eyeDX * 1.55, fy - .065, .003);
  }
  const mouthH = new THREE.Group(); place(mouthH, 0, fy - .075, .006);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.03, .009, 6, 12, Math.PI), lineM); smile.rotation.z = Math.PI; smile.position.y = .012; mouthH.add(smile);
  const openM = sphere(.038, std(def.dark ? 0xc4483a : 0x7a2018, { roughness: .5 }), 1, 1, .2); openM.castShadow = false; const tongue = sphere(.02, std(0xff8f8a), 1.1, .7, .5); tongue.castShadow = false; tongue.position.set(0, -.016, .012); openM.add(tongue); mouthH.add(openM);

  // ---- arms + feet ----
  const armM = std(new THREE.Color(def.color).multiplyScalar(def.dark ? 1.25 : .93), { roughness: .8 });
  const mkArm = s => { const sh = new THREE.Group(); sh.position.copy(surf(s * 1.25, def.armY, -.05));
    const g = new THREE.CylinderGeometry(.072, .056, ARM_L - .05, 10); g.translate(0, -(ARM_L - .05) / 2, 0); const a = new THREE.Mesh(g, armM); a.castShadow = true;
    const hand = new THREE.Group(); hand.position.y = -ARM_L + .02; const palm = sphere(.072, armM); const th = sphere(.032, armM); th.position.set(-s * .02, -.01, .062); hand.add(palm, th); sh.add(a, hand); pivot.add(sh); return { sh, hand, side: s, rest: sh.position.clone() }; };
  const armP = mkArm(1), armN = mkArm(-1);
  const footM = std(new THREE.Color(def.color).multiplyScalar(.8)); const feet = [-1, 1].map(s => { const f = sphere(.085, footM, 1, .55, 1.35); f.position.set(s * R(.1) * .5 * sx, .04, R(.1) * .35 * sz + .04); root.add(f); return f; });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(R(def.armY) * 1.15, 20), new THREE.MeshBasicMaterial({ color: 0x1a1408, transparent: true, opacity: .25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .045; shadow.renderOrder = 1;

  // ---- accessories ----
  const wig = []; const top = new THREE.Group(); top.position.y = H - .01; pivot.add(top);
  if (id === 'hsw') {
    for (const s of [-1, 1]) { const st = new THREE.Group(); const stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .1, 6), std(0x6f9a3c)); stem.position.y = .05; const lf = leaf(0x7fb246, 1.5); lf.position.y = .1; lf.rotation.z = .5; if (s < 0) lf.rotation.y = Math.PI; st.add(stem, lf); st.rotation.z = -s * .25; st.position.x = s * .015; top.add(st); wig.push({ o: st, ax: 'z', base: -s * .25, amp: .12, f: 3.1, ph: s }); }
    const cape = new THREE.Group(); cape.add(shell(.03, .43, .035, Math.PI, 4.6, 0xb5382a, { flare: .08 }), shell(.03, .075, .045, Math.PI, 4.62, 0xe9b54a, { flare: .1 }), shell(.37, .45, .045, 0, 6.283, 0xc8442e), shell(.435, .455, .05, 0, 6.283, 0xe9b54a)); pivot.add(cape); wig.push({ o: cape, ax: 'x', base: 0, amp: .025, f: 1.7, ph: 0 });
    const fl = flower(0xffc64a, 1.5, 0xd9452a); place(fl, 0, .41, .06);
  }
  if (id === 'danggui') {
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + .2; if (Math.abs(Math.sin(a / 1)) < .0) continue; const g = new THREE.ConeGeometry(.06, .34, 8); g.translate(0, -.17, 0); const c = new THREE.Mesh(g, bodyM); c.castShadow = true; const pos = surf(a, .3, -.05); c.position.copy(pos); c.rotation.set(Math.cos(a) * .42, 0, -Math.sin(a) * .42); pivot.add(c); wig.push({ o: c, ax: 'y', base: 0, amp: 0, f: 1, ph: 0, sway: [a, .42, i] }); }
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const f = flower(i % 2 ? 0xf7a8b8 : 0xffc9d4, 2.1); f.position.set(Math.sin(a) * .21, .93 + (i % 2) * .012, Math.cos(a) * .21); f.lookAt(Math.sin(a) * 2, 1.6, Math.cos(a) * 2); pivot.add(f); }
  }
  if (id === 'shanyao') {
    const sh = new THREE.Group(); sh.add(shell(.16, .66, .03, Math.PI, 5.5, 0xa9bf8a, { flare: .06 }), shell(.6, .68, .04, 0, 6.283, 0x98b07a), shell(.16, .2, .04, Math.PI, 5.52, 0xd9e3b8, { flare: .075 })); pivot.add(sh); wig.push({ o: sh, ax: 'x', base: 0, amp: .02, f: 1.5, ph: 1 });
    for (let i = 0; i < 6; i++) { const f = flower(0xf3f6e0, .9, 0xf0d060); place(f, Math.PI + (i - 2.5) * .75, .3 + (i % 2) * .2, .055); }
    const lf = leaf(0x86b04c, 1.2); lf.position.set(.02, .0, 0); lf.rotation.z = .5; const lf2 = leaf(0x86b04c, 1.1); lf2.rotation.set(0, Math.PI, -.4); const f = flower(0xfff6e6, 1.8); f.position.set(0, .04, .05); f.rotation.x = -.7; const g = new THREE.Group(); g.add(lf, lf2, f); top.add(g); wig.push({ o: g, ax: 'z', base: 0, amp: .1, f: 2.7, ph: 2 });
    const r = [[.5, .9], [-.7, .75], [1.6, .95], [-2, .9], [2.6, .8], [.9, 1.0], [-1.3, 1.0]]; for (const q of r) { const d = sphere(.012, std(0xc9a878), 1, 1, .4); d.castShadow = false; place(d, q[0], q[1], .001); }
  }
  if (id === 'tianma') {
    for (const y of [.14, .27, .4, .74]) { const t = new THREE.Mesh(new THREE.TorusGeometry(R(y) + .004, .012, 6, 36), std(0xc99655)); t.rotation.x = Math.PI / 2; t.position.y = y; pivot.add(t); }
    const cap = new THREE.Group(); cap.position.y = .76; const capM = std(0xd9535a, { roughness: .9 });
    const base = new THREE.Mesh(new THREE.SphereGeometry(R(.76) + .03, 20, 10, 0, 6.283, 0, Math.PI / 2), capM); base.scale.y = .75; base.castShadow = true; const brim = new THREE.Mesh(new THREE.TorusGeometry(R(.76) + .025, .05, 8, 28), std(0xfff7ee, { roughness: 1 })); brim.rotation.x = Math.PI / 2; brim.castShadow = true;
    const tail = new THREE.Group(); tail.position.set(.06, .12, 0); const cg = new THREE.ConeGeometry(.17, .42, 14); cg.translate(0, .21, 0); const cone = new THREE.Mesh(cg, capM); cone.castShadow = true; const pom = sphere(.075, std(0xfff7ee, { roughness: 1 })); pom.position.y = .44; tail.add(cone, pom); tail.rotation.z = -1.0; cap.add(base, brim, tail); pivot.add(cap); wig.push({ o: tail, ax: 'z', base: -1.0, amp: .1, f: 2.3, ph: 0 });
  }
  if (id === 'hongzao') {
    pivot.add(shell(.06, .37, .03, 0, 2.0, 0xf2b63a, { flare: .03 }), shell(.34, .4, .035, 0, 6.283, 0xe89a2c));
    const fl = flower(0xfff0b8, 1.4, 0xe07a2a); place(fl, 0, .22, .05);
    const g = new THREE.Group(); const lf = leaf(0x7fae46, 1.3); lf.rotation.z = .45; const f = flower(0xfff6e0, 1.6); f.position.set(-.03, .03, .04); f.rotation.x = -.6; const stem = new THREE.Mesh(new THREE.CylinderGeometry(.01, .014, .06, 6), std(0x7a4a2a)); stem.position.y = .02; g.add(lf, f, stem); top.add(g); wig.push({ o: g, ax: 'z', base: 0, amp: .1, f: 2.9, ph: 3 });
  }
  if (id === 'shudi') {
    for (let i = 0; i < 6; i++) { const y = .1 + i * .105, r = R(y) * .96; const t = new THREE.Mesh(new THREE.TorusGeometry(r, .05 - i * .003, 8, 40), std(i % 2 ? 0x5a333a : 0x452529, { roughness: .85 })); t.rotation.set(Math.PI / 2 + Math.sin(i * 2.1) * .12, 0, Math.cos(i * 1.7) * .1); t.position.y = y; t.castShadow = true; if (y > .34 && y < .62) { t.geometry = new THREE.TorusGeometry(r, .05 - i * .003, 8, 40, 4.3); t.rotation.z = 0; t.geometry.rotateZ(Math.PI / 2 + (6.283 - 4.3) / 2 + Math.PI / 2 - 1.57); } pivot.add(t); }
    const pil = new THREE.Group(); const pm = sphere(.2, std(0xc9b6e6, { roughness: 1 }), 1.25, .55, .5); const f = flower(0xffffff, 1.2, 0xb49ad9); f.position.set(.05, 0, .1); pil.add(pm, f); for (const s of [-1, 1]) { const t = sphere(.025, std(0xe9c873)); t.position.set(s * .25, -.03, 0); pil.add(t); } pil.position.set(0, .16, R(.16) + .07); pil.rotation.x = -.25; pivot.add(pil);
  }
  if (id === 'gouqi') {
    const cal = new THREE.Group(); for (let i = 0; i < 5; i++) { const l = leaf(0x6f9a3c, .55); l.rotation.set(0, i / 5 * 6.283, -.5); cal.add(l); } const stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .07, 6), std(0x6f8a3c)); stem.position.y = .03; cal.add(stem); cal.position.y = -.02; top.add(cal);
    pivot.add(shell(.24, .33, .03, 0, 6.283, 0xf4c63a));
    const knot = new THREE.Group(); for (const s of [-1, 1]) { const g = new THREE.ConeGeometry(.06, .2, 8); g.translate(0, -.1, 0); const c = new THREE.Mesh(g, std(0xf4c63a)); c.scale.z = .4; c.rotation.z = s * .5; c.castShadow = true; knot.add(c); } const kb = sphere(.035, std(0xe9b22e)); knot.add(kb); knot.position.copy(surf(-1.9, .3, .04)); knot.rotation.y = -1.9; pivot.add(knot); wig.push({ o: knot, ax: 'x', base: 0, amp: .25, f: 4.2, ph: 0 });
  }
  if (id === 'beiqi') {
    pivot.add(shell(.08, .44, .03, 0, 2.2, 0x9a6238, { flare: .02 }), shell(.4, .47, .035, 0, 6.283, 0x7d4c2a));
    const fl = flower(0xffd76a, 1.3, 0xfff0c0); place(fl, 0, .27, .05);
    for (const s of [-1, 1]) { const st = sphere(.02, std(0xe3c88a), 1, 6, .5); st.castShadow = false; place(st, s * 1.0, .78, 0); }
  }
  if (id === 'heidou') {
    const hil = sphere(.05, std(0xf4efe6, { roughness: .5 }), .6, 1.4, .2); hil.castShadow = false; place(hil, 1.25, .5, .002);
    const bl = new THREE.Group(); bl.add(shell(.03, .7, .04, Math.PI, 4.3, 0xf6ead0, { flare: .1 }), shell(.03, .07, .05, Math.PI, 4.32, 0xe8cf9a, { flare: .12 })); const capg = new THREE.Mesh(new THREE.SphereGeometry(R(.66) + .06, 18, 8, 0, 6.283, 0, 1.2), std(0xf6ead0, { side: THREE.DoubleSide, roughness: .9 })); capg.scale.set(1, .5, 1); capg.position.set(0, .64, -.03); capg.rotation.x = -.35; capg.castShadow = true; bl.add(capg); const sp2 = leaf(0x8ab85a, .6); place(sp2, 2.4, .3, .06, bl); pivot.add(bl); wig.push({ o: bl, ax: 'x', base: 0, amp: .02, f: 1.9, ph: 2 });
  }

  const cup = makeCup(); cup.visible = false; armN.hand.add(cup); cup.position.set(0, -.085, 0.02);
  const c = { id, def, root, pivot, R, H, surf, armP, armN, feet, shadow, eyes, happy, sleep, smile, openM, wig, cup, sx, sz, top,
    mouthLocal: surf(0, fy - .075, .1), holdLocal: V3(-.2, def.armY + .03, R(def.armY) * sz + .2) };
  return c;
}

const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), qa = new THREE.Quaternion(), v1 = V3(), DOWN = V3(0, -1, 0), XA = V3(1, 0, 0), ZA = V3(0, 0, 1);
// arm: {raise, swing, aim (Vector3 in pivot-local space) , w}
export function poseArm(arm, a) {
  q1.setFromAxisAngle(ZA, arm.side * a.raise); q2.setFromAxisAngle(XA, -a.swing); qa.copy(q2).multiply(q1);
  let stretch = 1;
  if (a.aim && a.w > 0) { v1.copy(a.aim).sub(arm.sh.position); const d = v1.length(); v1.normalize(); q1.setFromUnitVectors(DOWN, v1); qa.slerp(q1, a.w); stretch = lerp(1, clamp(d / (ARM_L + .04), .75, 1.5), a.w); }
  arm.sh.quaternion.copy(qa); arm.sh.scale.set(1, stretch, 1); arm.hand.scale.set(1, 1 / stretch, 1);
}
export function setFace(c, eye, blink, mouthOpen) {
  const open = eye === 'open' || eye === 'wide';
  c.eyes.forEach(e => { e.visible = open; e.scale.set(eye === 'wide' ? 1.18 : 1, (eye === 'wide' ? 1.18 : 1) * (1 - .92 * blink), 1); });
  c.happy.forEach(e => e.visible = eye === 'happy'); c.sleep.forEach(e => e.visible = eye === 'sleep');
  c.smile.visible = mouthOpen < .08; c.openM.visible = !c.smile.visible; c.openM.scale.set(.75 + mouthOpen * .45, .25 + mouthOpen * 1.0, .2);
}
