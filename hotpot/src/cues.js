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
  ...[1.8, 4.6, 7.4, 10.2].map((t, i) => ({ kind: 'act', id: 'snore' + i, t, d: 2.8, sfx: [{ n: 'snore', at: 0, g: .55, pan: -.1 }] })),
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
  { kind: 'act', id: 'c.grab', t: 34.4, d: .6, sfx: [{ n: 'cloth', at: .45, g: .5, d: .4 }] },
  { kind: 'act', id: 'c.lift', t: 35.0, d: .55, sfx: [{ n: 'whoosh', at: .15, g: .4 }] },
  { kind: 'act', id: 'c.drape', t: 35.55, d: .55, sfx: [{ n: 'cloth', at: .2, g: .45, d: .4 }] },
  { kind: 'act', id: 'c.try1', t: 36.2, d: .6, sfx: [{ n: 'tick', at: .42, g: .4 }] },
  { kind: 'act', id: 'c.click', t: 36.9, d: .5, sfx: [{ n: 'clasp', at: .4, g: .8 }] },
  { kind: 'act', id: 'c.notice', t: 38.9, d: .45, sfx: [{ n: 'twinkle', at: 0, g: .25 }] },
  { kind: 'act', id: 'c.shoe', t: 40.1, d: .9, sfx: [{ n: 'tap', at: .42, g: .5 }] },
  { kind: 'act', id: 'c.exit', t: 41.1, d: 1.2, sfx: [{ n: 'doorclose', at: 1.1, g: .35, pan: .6 }] },

  // ---------------- 05 bus ----------------
  { kind: 'act', id: 'b.walk', t: 46.0, d: 2.2 },
  { kind: 'act', id: 'b.step', t: 48.2, d: .8, sfx: [{ n: 'busstep', at: .6, g: .55 }] },
  { kind: 'act', id: 'b.rail', t: 48.0, d: .35, sfx: [{ n: 'tink', at: .33, g: .45 }] },
  { kind: 'act', id: 'b.in', t: 49.0, d: 1.6 },
  { kind: 'act', id: 'b.doors', t: 52.2, d: .6, sfx: [{ n: 'busdoor', at: 0, g: .6 }] },
  { kind: 'act', id: 'b.soften', t: 53.2, d: 2.4 },
  // ---------------- 06 park stop ----------------
  { kind: 'act', id: 'p.doors', t: 57.2, d: .8, sfx: [{ n: 'busdoor', at: 0, g: .55 }] },
  { kind: 'act', id: 'p.off', t: 57.8, d: 2.6 },
  { kind: 'act', id: 'p.close', t: 60.4, d: .5, sfx: [{ n: 'busdoor', at: 0, g: .45 }] },
  { kind: 'act', id: 'p.away', t: 60.9, d: 4.6, sfx: [{ n: 'busaway', at: 0, g: .55, d: 4.5 }] },
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
  { kind: 'act', id: 'h.eat', t: 97.9, d: 1.8 },
  { kind: 'act', id: 'h.laugh', t: 99.6, d: 2.4, sfx: [{ n: 'twinkle', at: .2, g: .2 }] },
  // ---------------- 10 cups ----------------
  { kind: 'act', id: 'u.face', t: 109.4, d: 1.4 },
  { kind: 'act', id: 'u.clink', t: 110.9, d: .9, sfx: [{ n: 'cupclink', at: .62, g: .6 }] },
  { kind: 'act', id: 'u.sip', t: 112.0, d: 1.6, sfx: [{ n: 'sip', at: .65, g: .4, pan: -.2 }, { n: 'sip', at: .85, g: .35, pan: .2 }] },
  { kind: 'act', id: 'u.ma', t: 113.7, d: 2.4 },
  { kind: 'act', id: 'u.dou', t: 114.3, d: 2.4 },
  // ---------------- 11 dusk → blue hour ----------------
  { kind: 'act', id: 'k.dusk', t: 121, d: 4.8 },
  ...[121.8, 122.3, 122.8, 123.3, 123.8, 124.3].map((t, i) => ({ kind: 'act', id: 'lamp' + i, t, d: .7, sfx: [{ n: 'lampon', at: 0, g: .3, pan: [-.5, .5, -.2, .3, -.4, .45][i] }] })),
  { kind: 'act', id: 'k.groups', t: 121.3, d: 3.6 },
  // ---------------- 12 fireworks ----------------
  ...[137.6, 139.0, 140.3, 142.4, 143.9, 146.1, 147.6, 148.6].map((t, i) => ({ kind: 'act', id: 'fw' + i, t, d: 2.6, sfx: [{ n: 'fwlaunch', at: 0, g: .2, pan: (i % 3 - 1) * .4 }, { n: 'fwboom', at: 1.0, g: .5, pan: (i % 3 - 1) * .4 }] })),
  { kind: 'voice', id: 'wu', t: 141.9, g: 1 },
  { kind: 'voice', id: 'gui', t: 143.9, g: 1 },
  { kind: 'act', id: 'endcard', t: 146.6, d: 3.0, sfx: [{ n: 'chime', at: .15, g: .45 }] },

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
     [132, 'E3 B3 D4 G4'], [137, 'A2 E3 A3 D4'], [141.2, 'G2 D3 G3 B3'], [143.9, 'D3 A3 D4 F#4 A4']].map(([t, n]) => ({ kind: 'oldchord', t, notes: n.split(' ') })),
  ...[[2, 'A4'], [5, 'F#4'], [8, 'E4'], [10.5, 'D4'], [13.55, 'A5'], [20.4, 'B4'], [21.3, 'A4'], [23.1, 'F#4'], [25.1, 'D5'], [25.6, 'E5'], [27.85, 'B5'], [28.2, 'G5'],
     [30.7, 'D5'], [31.0, 'E5'], [31.3, 'F#5'], [31.6, 'A5'], [34.6, 'A4'], [36.6, 'B4'], [37.5, 'B4'], [38.95, 'D5'], [39.6, 'F#4'], [40.2, 'A4'], [40.8, 'B4'], [41.9, 'E5'],
     [44.4, 'D5'], [46.4, 'A4'], [47.4, 'B4'], [48.8, 'D5'], [52.4, 'F#4'], [54.2, 'E4'], [55.6, 'D4'], [57.8, 'A4'], [59.2, 'B4'], [61, 'D5'], [63.5, 'B4'],
     [66.3, 'D5'], [67.6, 'E5'], [68.9, 'F#5'], [70.2, 'E5'], [72.9, 'A4'], [74.2, 'B4'], [75.5, 'D5'], [76.8, 'E5'], [79.5, 'F#5'], [81.0, 'A5'], [83.2, 'E5'],
     [86.2, 'D5'], [86.6, 'F#5'], [87.0, 'A5'], [91.5, 'D5'], [93.0, 'E5'], [94.6, 'F#5'], [96.4, 'A5'], [98.6, 'F#5'], [100.4, 'E5'], [102.2, 'D5'], [103.4, 'A5'],
     [104.2, 'B5'], [106, 'A5'], [109.6, 'E5'], [111, 'D5'], [112.6, 'A5'], [114.6, 'F#5'], [116.4, 'E5'], [117.2, 'D5'], [121.5, 'A4'], [124.5, 'B4'], [128, 'D5'],
     [131.5, 'E5'], [134.5, 'F#5'], [138.6, 'A5'], [141.0, 'F#5'], [143.0, 'E5'], [145, 'D5'], [147.2, 'A5'], [148.4, 'D6']].map(([t, n], i) => ({ kind: 'oldnote', t, n, v: .42 })),
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

// ---------------------------------------------------------------------------
// Walks: [[t, steps], …] keys in whole steps. Scenes read the distance, audio
// places a footfall at every integer step (the frame both feet are planted).
// ---------------------------------------------------------------------------
const WALKS = {
  'hall1':  { keys: [[37.6, 0], [38.8, 2]], snd: 'woodstep', g: .4, pan: .1 },
  'hall2':  { keys: [[39.35, 0], [39.95, 1]], snd: 'woodstep', g: .38, pan: 0 },
  'hall3':  { keys: [[41.1, 0], [42.3, 4]], snd: 'woodstep', g: .35, pan: .4 },
  'bus.wu': { keys: [[45.6, 0], [48.0, 6], [48.4, 6], [49.8, 9]], snd: 'step', g: .3, pan: -.3 },
  'bus.gui': { keys: [[45.6, 0], [48.6, 6], [49.4, 6], [51.6, 13]], snd: 'step', g: .22, pan: -.5 },
  'bus.qi': { keys: [[45.6, 0], [49.6, 8], [52.0, 12]], snd: 'step', g: .22, pan: -.6 },
  'park.wu': { keys: [[57.9, 0], [61.3, 8]], snd: 'step', g: .3, pan: .2 },
  'park.gui': { keys: [[58.7, 0], [61.9, 9]], snd: 'step', g: .2, pan: .1 },
  'park.qi': { keys: [[59.4, 0], [62.0, 11]], snd: 'step', g: .2, pan: 0 },
  'br.wu':  { keys: [[66.0, 0], [72.6, 16]], snd: 'plank', g: .45, pan: 0 },
  'br.gui': { keys: [[66.0, 0], [72.6, 18]], snd: 'plank', g: .3, pan: -.2 },
  'br.qi':  { keys: [[66.0, 0], [72.6, 22]], snd: 'plank', g: .3, pan: .2 },
  'f.wu':   { keys: [[72.6, 0], [79.0, 14]], snd: 'grass', g: .4, pan: 0 },
  'f.gui':  { keys: [[72.6, 0], [79.0, 16]], snd: 'grass', g: .28, pan: -.2 },
  'f.qi':   { keys: [[72.6, 0], [79.0, 20]], snd: 'grass', g: .28, pan: .2 },
  't.wu':   { keys: [[79.2, 0], [82.6, 6], [84.8, 8], [88.4, 8], [89.6, 10]], snd: 'grass', g: .35, pan: -.2 },
  't.gui':  { keys: [[79.2, 0], [83.4, 8], [87.6, 8], [88.8, 10]], snd: 'grass', g: .22, pan: -.3 },
  't.qi':   { keys: [[79.2, 0], [83.8, 12], [87.8, 12], [89.0, 14]], snd: 'grass', g: .22, pan: .4 },
};
const walkN = (id, t) => track(WALKS[id].keys, t, ease);
const walkMoving = (id, t) => Math.abs(walkN(id, t + .02) - walkN(id, t - .02)) > .002;

// ---------------------------------------------------------------------------
// THE 90-SECOND EDIT. Each entry plays a range of the scene timeline above
// (old time). Film time is the running sum. Every cue (motion, sfx, voice,
// footfall) keeps its place inside its scene and is mapped into film time.
// ---------------------------------------------------------------------------
const EDL = [
  { id: '01',  a: 4.4,   b: 11.4 },
  { id: '02',  a: 13.1,  b: 19.1 },
  { id: '03',  a: 20.4,  b: 29.8 },
  { id: '04',  a: 34.2,  b: 42.2,  xf: .3 },
  { id: '05a', a: 46.6,  b: 51.4,  xf: .4 },
  { id: '05b', a: 52.4,  b: 56.0 },
  { id: '06',  a: 57.8,  b: 62.0,  xf: .4 },
  { id: '07',  a: 66.0,  b: 72.0,  xf: .4 },
  { id: '08',  a: 79.8,  b: 87.2,  xf: .4 },
  { id: '09',  a: 91.8,  b: 102.0, xf: .35 },
  { id: '10',  a: 109.2, b: 116.6, xf: .3 },
  { id: '11',  a: 121.0, b: 126.0, xf: .5 },
  { id: '12a', a: 138.0, b: 141.2, xf: .6 },
  { id: '12b', a: 141.2, b: 145.6 },
  { id: '12c', a: 146.2, b: 149.6 },
];
(() => { let s = 0; for (const e of EDL) { e.s = s; s += e.b - e.a; } })();
const FILM_DUR = EDL.reduce((n, e) => n + e.b - e.a, 0);
function edlAt(tn) { for (const e of EDL) if (tn >= e.s && tn < e.s + e.b - e.a) return e; return EDL[EDL.length - 1]; }
function oldT(tn) { const e = edlAt(tn); return clamp(e.a + (tn - e.s), e.a, e.b - 1e-4); }
function newT(to) { for (const e of EDL) if (to >= e.a && to < e.b) return e.s + (to - e.a); return null; }
// music, written directly in film time (warm, sparse; D major pentatonic)
const MUSIC = {
  chords: [[0, 'D3 A3 E4 F#4'], [7, 'B2 F#3 A3 D4'], [13, 'G2 D3 F#3 B3'], [20.0, 'E3 B3 D4 G4'], [22.4, 'D3 A3 D4 F#4'], [26.4, 'A2 E3 A3 C#4'], [30.4, 'G2 D3 G3 B3'],
    [35.2, 'B2 F#3 A3 D4'], [38.8, 'D3 A3 D4 F#4'], [43, 'G2 D3 G3 B3'], [49, 'B2 F#3 B3 D4'], [53, 'G2 D3 F#3 B3'], [56.4, 'D3 A3 E4 F#4'], [61.5, 'B2 F#3 B3 D4'],
    [66.6, 'A2 E3 A3 C#4'], [70.5, 'D3 A3 D4 F#4'], [74, 'B2 F#3 A3 D4'], [79, 'A2 E3 A3 D4'], [82.2, 'G2 D3 G3 B3'], [85.2, 'D3 A3 D4 F#4 A4']],
  notes: [[1.2, 'A4'], [3.6, 'F#4'], [5.8, 'E4'], [7.4, 'A5'], [9.6, 'E5'], [13.4, 'B4'], [15.2, 'A4'], [17.3, 'D5'], [19.6, 'E5'], [20.4, 'B5'], [20.8, 'G5'],
    [22.8, 'A4'], [24.4, 'B4'], [25.3, 'D5'], [26.6, 'F#4'], [27.4, 'A4'], [28.2, 'B4'], [29.4, 'D5'], [30.8, 'A4'], [32.0, 'B4'], [33.2, 'D5'], [35.6, 'F#4'], [37.0, 'E4'],
    [39.2, 'A4'], [40.6, 'B4'], [42.0, 'D5'], [43.3, 'D5'], [44.6, 'E5'], [45.9, 'F#5'], [47.2, 'E5'], [49.4, 'F#5'], [50.8, 'A5'], [52.6, 'E5'], [54.4, 'D5'], [54.8, 'F#5'], [55.2, 'A5'],
    [56.8, 'D5'], [58.4, 'E5'], [60.0, 'F#5'], [61.8, 'A5'], [63.6, 'F#5'], [64.8, 'B5'], [66.9, 'E5'], [68.2, 'A5'], [69.8, 'F#5'], [71.6, 'E5'], [72.6, 'D5'],
    [74.4, 'A4'], [75.8, 'B4'], [77.2, 'D5'], [79.6, 'A5'], [81.4, 'F#5'], [83.4, 'E5'], [85.4, 'D5'], [87.2, 'A5'], [88.4, 'D6']],
};
