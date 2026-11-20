// Single source of truth for timing: picture and sound both read these.
export const DUR = 60, FPS = 24;
export const CUTS = [0, 4, 7.5, 11, 14.5, 20, 24, 28, 33, 37, 40, 44, 48, 52, 60];

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const sat = x => clamp(x, 0, 1);
export const lerp = (a, b, k) => a + (b - a) * k;
export const S = (a, b, x) => { const k = sat((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const win = (t, a, b, f = 0.25) => S(a, a + f, t) * (1 - S(b - f, b, t));
export const bump = (t, a, d) => (t > a && t < a + d) ? Math.sin(Math.PI * (t - a) / d) : 0;
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
export const mixAngle = (a, b, k) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

export const IDS = ['shudi', 'tianma', 'shanyao', 'hongzao', 'hsw', 'beiqi', 'danggui', 'gouqi', 'heidou'];
export const NAMES = { shudi: '熟地', tianma: '天麻', shanyao: '山藥', hongzao: '紅棗', hsw: '何首烏', beiqi: '北耆', danggui: '當歸', gouqi: '枸杞', heidou: '黑豆' };
const ANG = [-104, -78, -52, -26, 0, 26, 52, 78, 104], RAD = [1.9, 1.9, 1.9, 1.9, 1.15, 1.9, 1.9, 1.9, 1.9];
export const polar = (deg, r) => [r * Math.sin(deg * Math.PI / 180), -r * Math.cos(deg * Math.PI / 180)];
export const SEATS = ANG.map((a, i) => polar(a, RAD[i]));
export const SAUCERS = ANG.map((a, i) => i === 4 ? [-0.5, -0.88] : polar(a, RAD[i] - 0.6));
export const SAUCER_Y = ANG.map((a, i) => i === 4 ? 0.42 : 0.05);   // He Shou Wu's cup waits on a stump beside his stool
export const STOOL_H = 0.3;
export const DISH = polar(-34, 1.5);            // Hong Zao's dish of dates
export const POT_Y = 0.6;                        // soup surface height

// Gou Qi's running line before the gathering
export const gouqiRun = t => [6.0, 0.6 + 2.2 * Math.sin(2 * Math.PI * (t - 12.6) / 3.2)];
export const WALK = { shudi: [16.2, 18.6], tianma: [15.8, 18.3], shanyao: [15.6, 18.0], beiqi: [15.5, 16.9], danggui: [15.9, 18.4], gouqi: [15.4, 17.6], heidou: [16.4, 18.9] };
export const SPOTS = { shudi: [-3.6, 0.8], tianma: [-4.3, -0.7], shanyao: [-3.3, -2.3], hongzao: SEATS[3], hsw: SEATS[4], beiqi: polar(39, 1.14), danggui: [4.6, -1.5], gouqi: gouqiRun(15.4), heidou: [4.0, 1.5] };
export const STEP_RATE = { gouqi: 4.5 };
export const stepRate = id => STEP_RATE[id] || 3;
export const stepTimes = id => { const w = WALK[id]; if (!w) return []; const r = stepRate(id), out = []; for (let k = 1; k / r < w[1] - w[0]; k++) out.push(w[0] + k / r); return out; };

// vignette cycles (anchor, period)
export const TOSS = { t0: 0.7, period: 1.3, grab: 0.35, release: 0.62, land: 1.02, until: 13.6 };
export const tossTimes = () => { const o = []; for (let t = TOSS.t0; t < TOSS.until; t += TOSS.period) o.push(t); return o; };
export const STRETCH = { t0: 7.9, period: 3.4 }, YAWN = { t0: 8.4, period: 3.6 }, PEEK = { t0: 12.0, period: 3.5 }, JUMP = { t0: 12.6, period: 3.2 }, TWIRL = { t0: 11.7, period: 3.5 };
export const cyc = (t, c) => { const u = (t - c.t0) % c.period; return u < 0 ? u + c.period : u; };
export const cycTimes = (c, a, b) => { const o = []; for (let t = c.t0 - 10 * c.period; t < b; t += c.period) if (t >= a) o.push(t); return o; };

export const T = {
  title: [0.7, 3.7], call: 14.8, wake: 15.2, ladleRest: 19.3,
  pick: 20.75, toast: 22.45, toast2: 38.05, lanterns: 39.0,
  whistle: 41.5, speak: [54.0, 57.7], waveAll: 56.3, endCard: 57.9,
};
export const pickTime = i => T.pick + 0.06 * i;

// clinks: time, participants, meeting point (world)
export const CLINKS = [
  { t: 25.0, ids: ['gouqi', 'heidou'], P: [1.62, 0.62, 0.03] },
  { t: 28.9, ids: ['tianma', 'shanyao'], P: [-1.47, 0.72, -0.72] },
  { t: 34.2, ids: ['hongzao', 'shanyao'], P: [-1.05, 0.55, -1.28] },
  { t: 34.25, ids: ['beiqi', 'danggui'], P: [1.05, 0.58, -1.28] },
];
export const DRINKS = {
  gouqi: [[25.5, 26.9], [30.5, 31.5], [35, 36]], heidou: [[25.6, 27.0], [33.5, 34.5]],
  tianma: [[29.3, 31.3], [35.5, 36.5]], shanyao: [[29.4, 32.0], [25.5, 26.5], [34.95, 35.95]],
  hongzao: [[34.8, 35.9], [24.5, 25.5], [30, 31]], hsw: [[34.85, 35.95], [29, 30]], beiqi: [[34.9, 36.0], [27, 28], [31, 32]],
  shudi: [[25, 26], [35, 36]], danggui: [[26, 27], [34.9, 35.9]],
};
export const LAUGHS = {
  gouqi: [[27.3, 28.2], [37, 37.8]], heidou: [[27.4, 28.2], [37.1, 37.8]], tianma: [[32.5, 33.3], [37, 37.7]], shanyao: [[32.7, 33.3], [36.2, 37.8]],
  hongzao: [[36.1, 37.6]], hsw: [[36.2, 37.7]], beiqi: [[36.15, 37.65]], shudi: [[29.6, 32.2], [37.1, 37.7]], danggui: [[36.2, 37.7]],
};
export const GULPS = (() => { const o = []; for (let t = 29.45; t < 31.25; t += 0.3) o.push([t, 0]); for (let t = 29.6; t < 31.95; t += 0.36) o.push([t, 1]); return o; })();
export const WIN = 31.5, HICCUP = 32.4;

// fireworks: one list for picture, light and sound
export const FW_DIR = [16, -26];
export const FIREWORKS = (() => {
  const times = [42.4, 43.4, 44.2, 45.0, 45.7, 46.5, 47.2, 48.0, 48.5, 49.0, 49.4, 49.9, 50.3, 50.8, 51.2, 51.7, 53.0, 54.6, 56.0, 57.4, 58.7];
  const pal = [[1, .78, .42], [1, .42, .5], [.5, .82, 1], [.68, 1, .55], [1, .62, .92], [1, .93, .7], [1, .58, .25]];
  const r = rng(77), out = [];
  times.forEach((t, i) => {
    const big = (t === 50.8 || t === 57.4 || t === 42.4);
    out.push({ t, x: 14 + (r() - .5) * 34, y: 19 + r() * 9 + (big ? 2 : 0), z: -27 + (r() - .5) * 8, col: big ? pal[0] : pal[Math.floor(r() * pal.length)], col2: pal[Math.floor(r() * pal.length)], size: big ? 10 : 6.5 + r() * 2.5, type: big ? 2 : Math.floor(r() * 2), seed: i * 13 + 5 });
  });
  // extra bursts all around the park so the whole sky is full (quieter in the mix)
  for (let t = 43.1, i = 0; t < 59; t += (t < 52 ? .36 : .62) + r() * .25, i++) {
    const a = r() * 6.283, d = 30 + r() * 12;
    out.push({ t: Math.round(t * 24) / 24, x: Math.cos(a) * d, y: 17 + r() * 13, z: Math.sin(a) * d, col: pal[Math.floor(r() * pal.length)], col2: pal[Math.floor(r() * pal.length)], size: 5.5 + r() * 3.5, type: Math.floor(r() * 2), seed: 400 + i * 7, bg: 1 });
  }
  return out.sort((p, q) => p.t - q.t);
})();
// flash envelope of all bursts at time t -> [r,g,b] intensity
export function fwFlash(t) { const c = [0, 0, 0]; for (const f of FIREWORKS) { const a = t - f.t; if (a < 0 || a > 2.2) continue; const e = Math.exp(-a * 2.2) * (a < .06 ? a / .06 : 1) * f.size / 8 * (f.bg ? .5 : 1); c[0] += f.col[0] * e; c[1] += f.col[1] * e; c[2] += f.col[2] * e; } return c; }

export function env(t) {
  return { day: 1 - S(35.5, 41.5, t), gold: S(32, 37, t) * (1 - S(39, 42, t)), dusk: S(35, 38.8, t), night: S(39.2, 42.5, t), lamp: S(T.lanterns, T.lanterns + .7, t) };
}
export const shotAt = t => { let i = 0; while (i < CUTS.length - 2 && t >= CUTS[i + 1]) i++; return i; };
