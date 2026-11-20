// ---------------------------------------------------------------------------
// 差點錯過的圍爐 — shared utilities (deterministic: everything is f(t))
// ---------------------------------------------------------------------------
'use strict';
const W = 1080, H = 1920, FPS = 24, DUR = 150;
const END_CARD = '宜康中醫｜何首烏藥膳・天麻款';
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const easeOutBack = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const smooth = (e0, e1, x) => { x = clamp((x - e0) / (e1 - e0)); return x * x * (3 - 2 * x); };
const hump = t => Math.sin(Math.PI * clamp(t));
function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u) * 2 - 1; }
// damped spring response to an impulse at t0 (for follow-through: leaves, ears, cloth)
function spring(t, t0, amp, freq = 9, damp = 5) { const d = t - t0; if (d < 0) return 0; return amp * Math.exp(-d * damp) * Math.sin(d * freq); }
// keyframe track: [[t, v], ...] eased between keys
function track(keys, t, fn = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t <= b[0]) { const u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); const f = a[2] || fn; return typeof a[1] === 'number' ? lerp(a[1], b[1], f(u)) : a[1].map((v, j) => lerp(v, b[1][j], f(u))); } }
  return keys[keys.length - 1][1];
}
const step = (keys, t) => { let v = keys[0][1]; for (const k of keys) if (t >= k[0]) v = k[1]; return v; };
function noteFreq(n) { const m = /^([A-G])(#|b)?(\d)$/.exec(n), map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }; const s = map[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3]) + 1) * 12; return 440 * Math.pow(2, (s - 69) / 12); }

// ---------------------------------------------------------------------------
// Walk cycle with planted feet. s = distance travelled (px, world), Ls = step
// length. Each foot is fixed in world space during stance and swings 2·Ls
// while the body covers Ls. Returns per-foot offsets from the body (world px).
// Distances that end on a multiple of Ls leave both feet planted.
// ---------------------------------------------------------------------------
function gait(s, Ls, lift) {
  const k = Math.floor(s / Ls), f = s / Ls - k, e = f * f * (3 - 2 * f);
  const even = ((k % 2) + 2) % 2 === 0;
  const foot = (stanceEven) => {
    if (even === stanceEven) return { dx: k * Ls + Ls / 2 - s, lift: 0, stance: 1 };
    return { dx: lerp((k - 1) * Ls + Ls / 2, (k + 1) * Ls + Ls / 2, e) - s, lift: Math.sin(Math.PI * f) * lift, stance: 0 };
  };
  const A = foot(true), B = foot(false);   // at rest: A ahead (+Ls/2), B behind (−Ls/2)
  return {
    A, B,
    bob: Math.sin(Math.PI * f),                 // 0 at contact, 1 at passing
    contact: Math.pow(1 - Math.sin(Math.PI * f), 6), // spikes at each foot strike
    sway: Math.sin(Math.PI * s / Ls),           // weight shifts side to side
    swing: Math.sin(Math.PI * s / Ls),          // arm swing (opposite to legs)
  };
}
// distance along a walk defined by keys [[t, s], ...] (ease in/out per segment)
function walkS(keys, t) { return track(keys, t, ease); }
