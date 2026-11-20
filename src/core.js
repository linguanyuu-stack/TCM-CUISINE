// ---------------------------------------------------------------------------
// A Place for You (留一個位子) — core: constants, math, seeded RNG, CUE LIST
// Every frame is a pure function of time t. All randomness is seeded.
// ---------------------------------------------------------------------------
'use strict';
const W = 1080, H = 1920, FPS = 24, DUR = 60;
const TITLE = '宜康中醫｜何首烏藥膳・天麻款';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const smooth = (e0, e1, x) => { x = clamp((x - e0) / (e1 - e0)); return x * x * (3 - 2 * x); };
const hump = t => Math.sin(Math.PI * clamp(t)); // 0 -> 1 -> 0
// deterministic hash noise (for per-frame jitter that is still a function of t)
function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u) * 2 - 1; }

// ---------------------------------------------------------------------------
// THE CUE LIST — the single source of truth for cuts, motion and audio.
//   kind 'shot' : a cut. {id, t, end, scene}
//   kind 'act'  : a motion beat. {id, t, d} → prog(id,t) gives eased 0..1.
//                 optional sfx:[{n:name, at:offset, g:gain, pan}]
//   kind 'amb'  : ambience level keys {t, creek, simmer}
//   kind 'chord': music pad chord {t, notes}
//   kind 'note' : music pluck {t, n, v}
// ---------------------------------------------------------------------------
const CUES = [
  // ---- cuts ---------------------------------------------------------------
  { kind: 'shot', id: '01', t: 0,  end: 6,  scene: 'creek' },
  { kind: 'shot', id: '02', t: 6,  end: 13, scene: 'path' },
  { kind: 'shot', id: '03', t: 13, end: 20, scene: 'stones' },
  { kind: 'shot', id: '04', t: 20, end: 28, scene: 'picnic' },
  { kind: 'shot', id: '05', t: 28, end: 37, scene: 'picnic' },
  { kind: 'shot', id: '06', t: 37, end: 46, scene: 'picnic' },
  { kind: 'shot', id: '07', t: 46, end: 54, scene: 'picnic' },
  { kind: 'shot', id: '08', t: 54, end: 60, scene: 'picnic' },

  // ---- 01 ginkgo leaf falls into the creek --------------------------------
  { kind: 'act', id: 'c.drop',  t: 0.55, d: 0.75, sfx: [{ n: 'plip', at: 0.75, g: .55, pan: .05 }] },
  { kind: 'act', id: 'c.leaf',  t: 1.5,  d: 2.3,  sfx: [{ n: 'leaftouch', at: 2.3, g: .7, pan: 0 }] },
  { kind: 'act', id: 'c.drift', t: 3.8,  d: 2.6 },
  { kind: 'act', id: 'x.leaf1', t: 5.55, d: 0.9, sfx: [{ n: 'rustle', at: .1, g: .25, pan: -.3, d: .6 }] },

  // ---- 02 烏烏 lifts a branch so 山山 can pass ------------------------------
  { kind: 'act', id: 'p.reach', t: 6.9,  d: 0.8 },
  { kind: 'act', id: 'p.lift',  t: 7.5,  d: 1.0, sfx: [{ n: 'rustle', at: .05, g: .7, pan: .1, d: .9 }] },
  { kind: 'act', id: 'p.walk',  t: 8.1,  d: 4.6, sfx: [{ n: 'step', at: .3, g: .35, pan: .3 }, { n: 'step', at: .95, g: .33, pan: .2 }, { n: 'step', at: 1.6, g: .32, pan: .1 }, { n: 'step', at: 2.25, g: .3, pan: 0 }, { n: 'step', at: 3.4, g: .26, pan: -.1 }, { n: 'step', at: 4.0, g: .22, pan: -.15 }] },
  { kind: 'act', id: 'p.bow',   t: 10.3, d: 0.8, sfx: [{ n: 'twinkle', at: .3, g: .25, pan: 0 }] },
  { kind: 'act', id: 'p.lower', t: 12.0, d: 0.8, sfx: [{ n: 'rustle', at: 0, g: .35, pan: .1, d: .5 }] },
  { kind: 'act', id: 'x.leaf2', t: 12.55, d: 0.9, sfx: [{ n: 'rustle', at: .1, g: .2, pan: .3, d: .5 }] },

  // ---- 03 stepping stones: 歸歸 carries two bowls, 麻麻 yawns & dodges ------
  { kind: 'act', id: 's.hop1',  t: 13.5, d: 0.75, sfx: [{ n: 'stone', at: .72, g: .45, pan: -.35 }] },
  { kind: 'act', id: 's.hop2',  t: 14.7, d: 0.75, sfx: [{ n: 'stone', at: .72, g: .45, pan: -.15 }] },
  { kind: 'act', id: 's.hop3',  t: 15.9, d: 0.75, sfx: [{ n: 'stone', at: .72, g: .45, pan: .05 }] },
  { kind: 'act', id: 's.yawn',  t: 14.2, d: 2.0 },
  { kind: 'act', id: 's.splash', t: 17.0, d: 0.9, sfx: [{ n: 'splash', at: 0, g: .8, pan: .3 }] },
  { kind: 'act', id: 's.footback', t: 17.05, d: 0.55 },
  { kind: 'act', id: 's.hop4',  t: 18.2, d: 0.75, sfx: [{ n: 'stone', at: .72, g: .4, pan: .3 }] },
  { kind: 'act', id: 'x.leaf3', t: 19.55, d: 0.9, sfx: [{ n: 'rustle', at: .1, g: .2, pan: -.2, d: .5 }] },

  // ---- 04 the picnic comes to life ----------------------------------------
  { kind: 'act', id: 'k.run',   t: 20.5, d: 2.2, sfx: [{ n: 'patter', at: 0, g: .4, pan: -.4, d: 2.1 }] },
  { kind: 'act', id: 'k.jump',  t: 22.8, d: 0.7, sfx: [{ n: 'boing', at: .05, g: .22, pan: -.3 }] },
  { kind: 'act', id: 'z.walk',  t: 22.0, d: 2.4, sfx: [{ n: 'step', at: .5, g: .25, pan: .5 }, { n: 'step', at: 1.2, g: .25, pan: .45 }, { n: 'step', at: 1.9, g: .25, pan: .4 }] },
  { kind: 'act', id: 'z.set',   t: 24.6, d: 1.0, sfx: [{ n: 'clink', at: .92, g: .55, pan: .4, f: 1.12 }] },
  { kind: 'act', id: 'd.tug',   t: 25.4, d: 1.6, sfx: [{ n: 'cloth', at: 0.05, g: .45, pan: -.2, d: .5 }, { n: 'cloth', at: .85, g: .4, pan: -.2, d: .45 }] },

  // ---- 05 the steaming bowl beside an empty seat; 豆豆 behind the grass -----
  { kind: 'act', id: 'b.peek',  t: 31.4, d: 1.6, sfx: [{ n: 'rustle', at: 0, g: .55, pan: .45, d: 1.0 }] },
  { kind: 'act', id: 'b.notice', t: 33.6, d: 0.6, sfx: [{ n: 'twinkle', at: 0, g: .2, pan: .4 }] },
  { kind: 'act', id: 'b.hide',  t: 35.2, d: 0.9 },

  // ---- 06 烏烏 makes room and pats twice; 豆豆 comes and sits ---------------
  { kind: 'act', id: 'w.shift', t: 37.6, d: 1.2, sfx: [{ n: 'cloth', at: .15, g: .35, pan: -.2, d: .4 }, { n: 'cloth', at: .75, g: .3, pan: -.2, d: .35 }] },
  { kind: 'act', id: 'w.reach', t: 39.0, d: 0.6 },
  { kind: 'act', id: 'w.pat1',  t: 39.6, d: 0.42, sfx: [{ n: 'tap', at: .2, g: .9, pan: .1 }] },
  { kind: 'act', id: 'w.pat2',  t: 40.05, d: 0.42, sfx: [{ n: 'tap', at: .2, g: .85, pan: .1 }] },
  { kind: 'act', id: 'w.rest',  t: 40.6, d: 0.8 },
  { kind: 'act', id: 'b.step',  t: 41.0, d: 2.4, sfx: [{ n: 'softstep', at: .35, g: .4, pan: .35 }, { n: 'softstep', at: 1.0, g: .4, pan: .25 }, { n: 'softstep', at: 1.65, g: .4, pan: .15 }, { n: 'rustle', at: 0, g: .3, pan: .45, d: .6 }] },
  { kind: 'act', id: 'b.sit',   t: 43.5, d: 0.8, sfx: [{ n: 'cloth', at: .45, g: .4, pan: .1, d: .4 }] },

  // ---- 07 blanket loosens, bowl up, smile; follow steam; pull back ---------
  { kind: 'act', id: 'b.loosen', t: 46.6, d: 1.5, sfx: [{ n: 'cloth', at: .1, g: .55, pan: .05, d: 1.1 }] },
  { kind: 'act', id: 'b.reach',  t: 48.3, d: 0.7 },
  { kind: 'act', id: 'b.lift',   t: 49.0, d: 0.85, sfx: [{ n: 'clink', at: 0.02, g: .5, pan: .05, f: 1 }] },
  { kind: 'act', id: 'b.smile',  t: 50.0, d: 0.5, sfx: [{ n: 'twinkle', at: .1, g: .22, pan: 0 }] },
  { kind: 'act', id: 'cam.steam', t: 50.8, d: 1.6 },
  { kind: 'act', id: 'cam.pull', t: 51.4, d: 2.6, sfx: [{ n: 'air', at: 0, g: .35, pan: 0, d: 2.8 }] },

  // ---- 08 hold wide, title ------------------------------------------------
  { kind: 'act', id: 'title',  t: 55.0, d: 1.8, sfx: [{ n: 'chime', at: .1, g: .5, pan: 0 }] },
  { kind: 'act', id: 'end',    t: 59.3, d: 0.7 },

  // ---- ambience levels (linear between keys) -----------------------------
  { kind: 'amb', t: 0,    creek: 1.0,  simmer: 0 },
  { kind: 'amb', t: 5.6,  creek: 1.0,  simmer: 0 },
  { kind: 'amb', t: 6.4,  creek: 0.35, simmer: 0 },
  { kind: 'amb', t: 12.6, creek: 0.4,  simmer: 0 },
  { kind: 'amb', t: 13.4, creek: 1.05, simmer: 0 },
  { kind: 'amb', t: 19.6, creek: 1.0,  simmer: 0 },
  { kind: 'amb', t: 20.4, creek: 0.45, simmer: 0.9 },
  { kind: 'amb', t: 27.6, creek: 0.45, simmer: 0.85 },
  { kind: 'amb', t: 28.4, creek: 0.5,  simmer: 0.45 },
  { kind: 'amb', t: 46,   creek: 0.45, simmer: 0.5 },
  { kind: 'amb', t: 54,   creek: 0.6,  simmer: 0.55 },
  { kind: 'amb', t: 60,   creek: 0.6,  simmer: 0.55 },

  // ---- music: pad chords --------------------------------------------------
  ...[
    [0, 'D3 A3 E4 F#4'], [6, 'B2 F#3 A3 D4'], [9.5, 'G2 D3 F#3 B3'], [13, 'A2 D3 F#3 A3'],
    [16.5, 'G2 D3 E3 B3'], [20, 'D3 A3 D4 F#4'], [23.5, 'B2 F#3 B3 D4'], [26, 'G2 D3 G3 B3'],
    [28, 'E3 B3 D4 G4'], [32.5, 'G2 D3 A3 B3'], [37, 'A2 E3 A3 D4'], [39.6, 'A2 E3 A3 C#4'],
    [41.5, 'B2 F#3 B3 D4'], [44, 'G2 D3 G3 B3'], [46, 'A2 E3 A3 D4'], [47.6, 'A2 E3 G3 C#4'],
    [49.0, 'D3 A3 D4 F#4'], [51.5, 'B2 F#3 B3 D4'], [53, 'G2 D3 G3 B3'], [54.5, 'D3 A3 D4 F#4 A4'],
  ].map(([t, n]) => ({ kind: 'chord', t, notes: n.split(' ') })),
  // ---- music: plucked melody (D major pentatonic) -------------------------
  ...[
    [0.9, 'A4', .5], [1.75, 'F#4', .4], [2.6, 'E4', .45], [4.3, 'D4', .4], [5.1, 'E4', .35],
    [6.3, 'F#4', .5], [7.15, 'A4', .5], [8.0, 'B4', .55], [9.7, 'A4', .45], [10.55, 'F#4', .45], [11.4, 'E4', .4], [12.2, 'D4', .4],
    [13.5, 'A4', .45], [14.7, 'B4', .45], [15.9, 'D5', .5], [17.05, 'E5', .35], [17.4, 'D5', .4], [18.2, 'B4', .45], [19.0, 'A4', .4],
    [20.5, 'D5', .45], [20.95, 'E5', .4], [21.4, 'F#5', .45], [22.8, 'A5', .5], [23.6, 'F#5', .4], [24.4, 'E5', .4], [25.5, 'D5', .4], [26.3, 'B4', .35], [27.1, 'A4', .35],
    [28.6, 'B4', .3], [30.3, 'A4', .3], [33.6, 'D5', .35], [34.5, 'B4', .3], [36.0, 'A4', .28],
    [37.7, 'E4', .35], [38.6, 'F#4', .35], [39.62, 'A4', .4], [40.07, 'A4', .35], [41.5, 'B4', .4], [42.5, 'D5', .4], [43.6, 'E5', .45],
    [46.6, 'F#5', .35], [47.6, 'E5', .35], [49.02, 'A5', .5], [49.5, 'F#5', .42], [50.05, 'D5', .45], [51.0, 'E5', .4], [51.9, 'F#5', .42], [52.8, 'A5', .45],
    [54.5, 'D5', .45], [55.1, 'F#5', .4], [55.7, 'A5', .42], [57.0, 'D6', .32],
  ].map(([t, n, v]) => ({ kind: 'note', t, n, v })),
];

const SHOTS = CUES.filter(c => c.kind === 'shot');
const ACT = {}; CUES.filter(c => c.kind === 'act').forEach(c => { ACT[c.id] = c; });
// raw linear progress of an act at time t
function prog(id, t) { const c = ACT[id]; if (!c) return 0; return clamp((t - c.t) / c.d); }
function shotAt(t) { for (const s of SHOTS) if (t >= s.t && t < s.end) return s; return SHOTS[SHOTS.length - 1]; }
function noteFreq(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n); const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let s = map[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (s - 69) / 12);
}
