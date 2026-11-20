// ---------------------------------------------------------------------------
// THE CUE LIST — one list for shots, actions, voices, sound effects, music.
//   shot  {id,t,end,scene,xf?}           act {id,t,d,sfx?:[{n,at,g,pan,d,f}]}
//   voice {id(qi|wu|gui), t, g}          amb {t, ...levels}
//   chord {t, notes}                     note {t, n, v}
// ---------------------------------------------------------------------------
const CUES = [
  // ---------------- shots ----------------
  { kind: 'shot', id: '01', t: 0, end: 12, scene: 'bed' },
  { kind: 'shot', id: '02', t: 12, end: 20, scene: 'bed2' },
  { kind: 'shot', id: '03', t: 20, end: 34, scene: 'door' },
  { kind: 'shot', id: '04', t: 34, end: 46, scene: 'hall', xf: .3 },
  { kind: 'shot', id: '05a', t: 46, end: 51.6, scene: 'busstop', xf: .4 },
  { kind: 'shot', id: '05b', t: 51.6, end: 57, scene: 'businside' },
  { kind: 'shot', id: '06', t: 57, end: 66, scene: 'parkstop', xf: .4 },
  { kind: 'shot', id: '07a', t: 66, end: 72.6, scene: 'bridge', xf: .4 },
  { kind: 'shot', id: '07b', t: 72.6, end: 79, scene: 'field', xf: .35 },
  { kind: 'shot', id: '08', t: 79, end: 91, scene: 'tree', xf: .4 },
  { kind: 'shot', id: '09', t: 91, end: 109, scene: 'hotpot', xf: .35 },
  { kind: 'shot', id: '10', t: 109, end: 121, scene: 'cups', xf: .3 },
  { kind: 'shot', id: '11', t: 121, end: 137, scene: 'dusk', xf: .5 },
  { kind: 'shot', id: '12a', t: 137, end: 141.2, scene: 'fireworks', xf: .6 },
  { kind: 'shot', id: '12b', t: 141.2, end: 145.6, scene: 'fw2' },
  { kind: 'shot', id: '12c', t: 145.6, end: 150, scene: 'fireworks' },

  // ---------------- 01 snoring ----------------
  ...[1.2, 4.0, 6.8, 9.6].map((t, i) => ({ kind: 'act', id: 'snore' + i, t, d: 2.8, sfx: [{ n: 'snore', at: 0, g: .55, pan: -.1 }] })),
  { kind: 'act', id: 'cal.push', t: 7.4, d: 4.0 },
  // ---------------- 02 doorbell, jolt ----------------
  { kind: 'act', id: 'bell', t: 13.2, d: 1.2, sfx: [{ n: 'doorbell', at: 0, g: .7, pan: .35 }] },
  { kind: 'act', id: 'jolt', t: 13.55, d: .38, sfx: [{ n: 'cloth', at: 0, g: .55, pan: 0, d: .5 }, { n: 'boing', at: .05, g: .25 }] },
  { kind: 'act', id: 'quiltslip', t: 13.7, d: 1.0 },
  { kind: 'act', id: 'blink02', t: 15.2, d: .3 },
  { kind: 'act', id: 'bell2', t: 16.4, d: 1.2, sfx: [{ n: 'doorbell', at: 0, g: .55, pan: .35 }] },
  { kind: 'act', id: 'getup', t: 17.6, d: 1.6, sfx: [{ n: 'cloth', at: .1, g: .45, d: .7 }, { n: 'woodstep', at: 1.2, g: .35, pan: .2 }] },

  // ---------------- 03 the doorway (motion test = 21–29 s) ----------------
  { kind: 'act', id: 'd.reach', t: 20.55, d: .5, sfx: [{ n: 'woodstep', at: -.45, g: .3, pan: .4 }, { n: 'woodstep', at: -.15, g: .3, pan: .35 }] },
  { kind: 'act', id: 'd.grip', t: 21.05, d: .25, sfx: [{ n: 'latch', at: .05, g: .7, pan: .2 }] },
  { kind: 'act', id: 'd.open', t: 21.25, d: 2.95, sfx: [{ n: 'creak', at: 0, g: .5, pan: 0, d: 2.8 }, { n: 'birds', at: .4, g: .3, pan: .4, d: 6 }] },
  { kind: 'act', id: 'w.turn', t: 24.25, d: .55, sfx: [{ n: 'woodstep', at: .12, g: .3, pan: -.2 }, { n: 'woodstep', at: .45, g: .3, pan: -.1 }] },
  { kind: 'act', id: 'w.blink1', t: 24.55, d: .26 },
  { kind: 'act', id: 'q.raise', t: 24.6, d: .55, sfx: [{ n: 'paper', at: .3, g: .5, pan: .45 }] },
  { kind: 'voice', id: 'qi', t: 25.15, g: 1 },
  { kind: 'act', id: 'w.down', t: 26.55, d: .5 },
  { kind: 'act', id: 'w.blink2', t: 27.1, d: .42 },
  { kind: 'act', id: 'w.realize', t: 27.85, d: .22, sfx: [{ n: 'sting', at: 0, g: .55 }] },
  { kind: 'act', id: 'w.grip', t: 27.88, d: .25, sfx: [{ n: 'creak', at: .05, g: .25, d: .3, pan: -.3 }] },
  { kind: 'act', id: 'w.back', t: 28.0, d: .55, sfx: [{ n: 'woodstep', at: .45, g: .5, pan: -.2 }] },
  { kind: 'act', id: 'w.look', t: 29.5, d: .5 },
  { kind: 'act', id: 'w.dash', t: 30.7, d: 2.4, sfx: [{ n: 'patter', at: .1, g: .35, pan: -.4, d: 2.0 }] },
  { kind: 'act', id: 'q.giggle', t: 31.4, d: 1.2 },

  // ---------------- 04 cape, clasp, shoe ----------------
  { kind: 'act', id: 'c.grab', t: 34.6, d: .7, sfx: [{ n: 'cloth', at: .4, g: .5, d: .5 }] },
  { kind: 'act', id: 'c.swing', t: 35.3, d: .9, sfx: [{ n: 'whoosh', at: .1, g: .4 }] },
  { kind: 'act', id: 'c.try1', t: 36.6, d: .7, sfx: [{ n: 'tick', at: .55, g: .35 }] },
  { kind: 'act', id: 'c.try2', t: 37.5, d: .7, sfx: [{ n: 'tick', at: .55, g: .35 }] },
  { kind: 'act', id: 'c.click', t: 38.5, d: .55, sfx: [{ n: 'clasp', at: .45, g: .8 }] },
  { kind: 'act', id: 'c.walk', t: 39.6, d: 2.2, sfx: [0, .5, 1, 1.5].map(a => ({ n: 'woodstep', at: a + .25, g: .4, pan: .2 })) },
  { kind: 'act', id: 'c.notice', t: 41.9, d: .5, sfx: [{ n: 'twinkle', at: 0, g: .25 }] },
  { kind: 'act', id: 'c.back', t: 42.4, d: 1.2, sfx: [{ n: 'woodstep', at: .4, g: .4 }, { n: 'woodstep', at: .95, g: .4 }] },
  { kind: 'act', id: 'c.shoe', t: 43.6, d: .7, sfx: [{ n: 'tap', at: .55, g: .5 }] },
  { kind: 'act', id: 'c.exit', t: 44.4, d: 1.6, sfx: [{ n: 'woodstep', at: .3, g: .35 }, { n: 'woodstep', at: .8, g: .3 }, { n: 'doorclose', at: 1.3, g: .4 }] },

  // ---------------- 05 bus ----------------
  { kind: 'act', id: 'b.walk', t: 46.0, d: 2.2 },
  { kind: 'act', id: 'b.step', t: 48.2, d: .8, sfx: [{ n: 'busstep', at: .6, g: .55 }] },
  { kind: 'act', id: 'b.rail', t: 48.3, d: .4, sfx: [{ n: 'tink', at: .38, g: .45 }] },
  { kind: 'act', id: 'b.in', t: 49.0, d: 1.6 },
  { kind: 'act', id: 'b.doors', t: 50.7, d: .8, sfx: [{ n: 'busdoor', at: 0, g: .6 }] },
  { kind: 'act', id: 'b.soften', t: 53.2, d: 2.4 },
  // ---------------- 06 park stop ----------------
  { kind: 'act', id: 'p.doors', t: 57.2, d: .8, sfx: [{ n: 'busdoor', at: 0, g: .55 }] },
  { kind: 'act', id: 'p.off', t: 57.8, d: 2.6 },
  { kind: 'act', id: 'p.away', t: 60.6, d: 4.6, sfx: [{ n: 'busaway', at: 0, g: .55, d: 4.5 }] },
  // ---------------- 07 bridge + field ----------------
  { kind: 'act', id: 'br.walk', t: 66.0, d: 6.6 },
  { kind: 'act', id: 'f.walk', t: 72.6, d: 6.4 },
  // ---------------- 08 tree ----------------
  { kind: 'act', id: 't.walk', t: 79.2, d: 4.6 },
  { kind: 'act', id: 't.wave', t: 81.0, d: 2.4 },
  { kind: 'act', id: 't.slow', t: 83.2, d: 1.6 },
  { kind: 'act', id: 't.release', t: 84.6, d: 1.4 },
  { kind: 'act', id: 't.smile', t: 86.2, d: .8, sfx: [{ n: 'twinkle', at: .1, g: .25 }] },
  { kind: 'act', id: 't.sit', t: 88.4, d: 1.8, sfx: [{ n: 'cloth', at: 1.2, g: .4 }] },
  // ---------------- 09 hot pot ----------------
  { kind: 'act', id: 'h.ladle', t: 92.0, d: 2.6, sfx: [{ n: 'pour', at: .9, g: .5, d: 1.2 }] },
  { kind: 'act', id: 'h.pass', t: 95.2, d: 2.6, sfx: [{ n: 'clink', at: 1.25, g: .45, f: 1.15 }, { n: 'clink', at: 2.5, g: .35, f: .95 }] },
  { kind: 'act', id: 'h.eat', t: 98.6, d: 4.4 },
  { kind: 'act', id: 'h.laugh', t: 103.4, d: 3.4, sfx: [{ n: 'twinkle', at: .2, g: .2 }] },
  // ---------------- 10 cups ----------------
  { kind: 'act', id: 'u.face', t: 109.6, d: 2.6 },
  { kind: 'act', id: 'u.clink', t: 112.6, d: .9, sfx: [{ n: 'cupclink', at: .62, g: .75 }] },
  { kind: 'act', id: 'u.sip', t: 113.9, d: 2.2, sfx: [{ n: 'sip', at: .9, g: .4, pan: -.2 }, { n: 'sip', at: 1.15, g: .35, pan: .2 }] },
  { kind: 'act', id: 'u.ma', t: 116.4, d: 2.6 },
  { kind: 'act', id: 'u.dou', t: 117.2, d: 2.8 },
  // ---------------- 11 dusk → blue hour ----------------
  { kind: 'act', id: 'k.dusk', t: 121, d: 15.5 },
  ...[124.5, 126.0, 127.4, 128.6, 130.0, 131.2].map((t, i) => ({ kind: 'act', id: 'lamp' + i, t, d: .7, sfx: [{ n: 'lampon', at: 0, g: .3, pan: [-.5, .5, -.2, .3, -.4, .45][i] }] })),
  { kind: 'act', id: 'k.groups', t: 125, d: 10 },
  // ---------------- 12 fireworks ----------------
  ...[137.6, 139.0, 140.3, 142.4, 143.9, 146.1, 147.6, 148.6].map((t, i) => ({ kind: 'act', id: 'fw' + i, t, d: 2.6, sfx: [{ n: 'fwlaunch', at: 0, g: .2, pan: (i % 3 - 1) * .4 }, { n: 'fwboom', at: 1.0, g: .5, pan: (i % 3 - 1) * .4 }] })),
  { kind: 'voice', id: 'wu', t: 141.9, g: 1 },
  { kind: 'voice', id: 'gui', t: 143.9, g: 1 },
  { kind: 'act', id: 'endcard', t: 147.0, d: 3.0, sfx: [{ n: 'chime', at: .15, g: .45 }] },

  // ---------------- ambience levels ----------------
  { kind: 'amb', t: 0, room: .8, outdoor: 0, simmer: 0, city: 0, fw: 0 },
  { kind: 'amb', t: 20.6, room: .7, outdoor: 0, simmer: 0, city: 0, fw: 0 },
  { kind: 'amb', t: 21.6, room: .3, outdoor: .8, simmer: 0, city: 0, fw: 0 },
  { kind: 'amb', t: 33.8, room: .3, outdoor: .5, simmer: 0, city: 0, fw: 0 },
  { kind: 'amb', t: 34.2, room: .7, outdoor: .1, simmer: 0, city: 0, fw: 0 },
  { kind: 'amb', t: 45.8, room: .7, outdoor: .1, simmer: 0, city: 0, fw: 0 },
  { kind: 'amb', t: 46.2, room: 0, outdoor: .4, simmer: 0, city: .8, fw: 0 },
  { kind: 'amb', t: 51.4, room: 0, outdoor: .3, simmer: 0, city: .7, fw: 0 },
  { kind: 'amb', t: 51.8, room: 0, outdoor: 0, simmer: 0, city: .45, fw: 0 },
  { kind: 'amb', t: 56.8, room: 0, outdoor: 0, simmer: 0, city: .45, fw: 0 },
  { kind: 'amb', t: 57.2, room: 0, outdoor: .7, simmer: 0, city: .5, fw: 0 },
  { kind: 'amb', t: 65.8, room: 0, outdoor: .8, simmer: 0, city: .1, fw: 0 },
  { kind: 'amb', t: 79, room: 0, outdoor: .8, simmer: .3, city: 0, fw: 0 },
  { kind: 'amb', t: 91, room: 0, outdoor: .55, simmer: .9, city: 0, fw: 0 },
  { kind: 'amb', t: 121, room: 0, outdoor: .6, simmer: .5, city: 0, fw: 0 },
  { kind: 'amb', t: 136.5, room: 0, outdoor: .45, simmer: .3, city: 0, fw: 0 },
  { kind: 'amb', t: 137.5, room: 0, outdoor: .35, simmer: .25, city: 0, fw: 1 },
  { kind: 'amb', t: 150, room: 0, outdoor: .35, simmer: .25, city: 0, fw: 1 },

  // ---------------- music (warm, sparse; D major pentatonic) ----------------
  ...[[0, 'D3 A3 E4 F#4'], [12, 'B2 F#3 A3 D4'], [20, 'G2 D3 F#3 B3'], [27.85, 'E3 B3 D4 G4'], [34, 'D3 A3 D4 F#4'], [40, 'A2 E3 A3 C#4'], [46, 'G2 D3 G3 B3'],
     [51.6, 'B2 F#3 A3 D4'], [57, 'D3 A3 D4 F#4'], [66, 'G2 D3 G3 B3'], [72.6, 'A2 E3 A3 D4'], [79, 'B2 F#3 B3 D4'], [84.6, 'G2 D3 F#3 B3'], [88.4, 'D3 A3 D4 F#4'],
     [91, 'D3 A3 E4 F#4'], [97, 'B2 F#3 B3 D4'], [103, 'G2 D3 G3 B3'], [109, 'A2 E3 A3 C#4'], [115, 'D3 A3 D4 F#4'], [121, 'B2 F#3 A3 D4'], [127, 'G2 D3 F#3 B3'],
     [132, 'E3 B3 D4 G4'], [137, 'A2 E3 A3 D4'], [141.2, 'G2 D3 G3 B3'], [143.9, 'D3 A3 D4 F#4 A4']].map(([t, n]) => ({ kind: 'chord', t, notes: n.split(' ') })),
  ...[[2, 'A4'], [5, 'F#4'], [8, 'E4'], [10.5, 'D4'], [13.55, 'A5'], [20.4, 'B4'], [21.3, 'A4'], [23.1, 'F#4'], [25.1, 'D5'], [25.6, 'E5'], [27.85, 'B5'], [28.2, 'G5'],
     [30.7, 'D5'], [31.0, 'E5'], [31.3, 'F#5'], [31.6, 'A5'], [34.6, 'A4'], [36.6, 'B4'], [37.5, 'B4'], [38.95, 'D5'], [39.6, 'F#4'], [40.2, 'A4'], [40.8, 'B4'], [41.9, 'E5'],
     [44.4, 'D5'], [46.4, 'A4'], [47.4, 'B4'], [48.8, 'D5'], [52.4, 'F#4'], [54.2, 'E4'], [55.6, 'D4'], [57.8, 'A4'], [59.2, 'B4'], [61, 'D5'], [63.5, 'B4'],
     [66.3, 'D5'], [67.6, 'E5'], [68.9, 'F#5'], [70.2, 'E5'], [72.9, 'A4'], [74.2, 'B4'], [75.5, 'D5'], [76.8, 'E5'], [79.5, 'F#5'], [81.0, 'A5'], [83.2, 'E5'],
     [86.2, 'D5'], [86.6, 'F#5'], [87.0, 'A5'], [91.5, 'D5'], [93.0, 'E5'], [94.6, 'F#5'], [96.4, 'A5'], [98.6, 'F#5'], [100.4, 'E5'], [102.2, 'D5'], [103.4, 'A5'],
     [104.2, 'B5'], [106, 'A5'], [109.6, 'E5'], [111, 'D5'], [112.6, 'A5'], [114.6, 'F#5'], [116.4, 'E5'], [117.2, 'D5'], [121.5, 'A4'], [124.5, 'B4'], [128, 'D5'],
     [131.5, 'E5'], [134.5, 'F#5'], [138.6, 'A5'], [141.0, 'F#5'], [143.0, 'E5'], [145, 'D5'], [147.2, 'A5'], [148.4, 'D6']].map(([t, n], i) => ({ kind: 'note', t, n, v: .42 })),
];
const SHOTS = CUES.filter(c => c.kind === 'shot');
const ACT = {}; CUES.filter(c => c.kind === 'act').forEach(c => { ACT[c.id] = c; });
const VOICE = {}; CUES.filter(c => c.kind === 'voice').forEach(c => { VOICE[c.id] = c; });
function prog(id, t) { const c = ACT[id]; if (!c) return 0; return clamp((t - c.t) / c.d); }
function shotAt(t) { for (const s of SHOTS) if (t >= s.t && t < s.end) return s; return SHOTS[SHOTS.length - 1]; }
// lip-sync: mouth opening for a speaker from the voice's amplitude envelope
let ENV = null;
function buildEnvelopes() {
  ENV = {}; for (const [k, v] of Object.entries(ASSETS.voices)) {
    const b = atob(v.pcm), n = b.length / 2, x = new Float32Array(n); for (let i = 0; i < n; i++) { let s = b.charCodeAt(2 * i) | (b.charCodeAt(2 * i + 1) << 8); if (s > 32767) s -= 65536; x[i] = s / 32768; }
    const hop = Math.round(v.sr / 100), e = []; for (let i = 0; i < n; i += hop) { let a = 0; for (let j = i; j < Math.min(n, i + hop * 2); j++) a += x[j] * x[j]; e.push(Math.sqrt(a / (hop * 2))); }
    const mx = Math.max(...e); ENV[k] = { e: e.map(q => q / mx), dur: n / v.sr, pcm: x, sr: v.sr };
  }
}
function mouthOpen(who, t) {
  const c = VOICE[who]; if (!c || !ENV) return 0; const d = t - c.t; const E = ENV[who]; if (d < 0 || d > E.dur) return 0;
  const i = Math.floor(d * 100); return clamp(Math.pow(E.e[Math.min(E.e.length - 1, i)] || 0, .6) * 1.15);
}
const talking = (who, t) => { const c = VOICE[who]; return c && ENV && t >= c.t - .05 && t <= c.t + ENV[who].dur + .05; };
