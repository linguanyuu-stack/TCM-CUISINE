// ---------------------------------------------------------------------------
// 一起圍爐 · 60 s, 16:9. THE CUE LIST: shots, actions (+ their sounds), walks,
// ambience levels and music. Picture and sound both read from here.
// ---------------------------------------------------------------------------
const CUES = [
  // ---------------- shots (all in one park set, so positions carry across cuts)
  { kind: 'shot', id: '01 wide park',      t: 0,    end: 4.5,  cam: 'wide' },
  { kind: 'shot', id: '02 at the pot',     t: 4.5,  end: 8.5,  cam: 'pot' },
  { kind: 'shot', id: '03 right side',     t: 8.5,  end: 12.5, cam: 'right' },
  { kind: 'shot', id: '04 arrivals',       t: 12.5, end: 16.5, cam: 'arrive' },
  { kind: 'shot', id: '05 gathering',      t: 16.5, end: 20,   cam: 'gather' },
  { kind: 'shot', id: '06 ladle',          t: 20,   end: 26,   cam: 'ladle' },
  { kind: 'shot', id: '07 everyone sips',  t: 26,   end: 30,   cam: 'sip' },
  { kind: 'shot', id: '08 clink',          t: 30,   end: 34,   cam: 'clink' },
  { kind: 'shot', id: '09 contest',        t: 34,   end: 38,   cam: 'contest' },
  { kind: 'shot', id: '10 laughter',       t: 38,   end: 40,   cam: 'laugh' },
  { kind: 'shot', id: '11 dusk to night',  t: 40,   end: 46,   cam: 'dusk', xf: .6 },
  { kind: 'shot', id: '12 fireworks',      t: 46,   end: 52,   cam: 'fw' },
  { kind: 'shot', id: '13 promise',        t: 52,   end: 60,   cam: 'promise', xf: .5 },

  // ---------------- 0–20 individual actions & gathering
  { kind: 'act', id: 'z.pick',   t: 4.9, d: .55, sfx: [{ n: 'tick', at: .5, g: .3, pan: -.1 }] },
  { kind: 'act', id: 'z.place',  t: 5.45, d: .65, sfx: [{ n: 'cuptap', at: .6, g: .5, pan: -.1 }] },
  { kind: 'act', id: 'z.pick2',  t: 6.35, d: .55, sfx: [{ n: 'tick', at: .5, g: .3, pan: -.1 }] },
  { kind: 'act', id: 'z.place2', t: 6.9, d: .65, sfx: [{ n: 'cuptap', at: .6, g: .5, pan: -.15 }] },
  { kind: 'act', id: 'sh.pick',  t: 5.2, d: .7, sfx: [{ n: 'rustle', at: .4, g: .35, pan: -.4, d: .4 }] },
  { kind: 'act', id: 'sh.sniff', t: 6.1, d: 1.6, sfx: [{ n: 'twinkle', at: .6, g: .18, pan: -.4 }] },
  { kind: 'act', id: 'm.stretch', t: 8.9, d: 2.0, sfx: [{ n: 'cloth', at: .1, g: .35, pan: .3, d: .6 }, { n: 'boing', at: 1.55, g: .15, pan: .3 }] },
  { kind: 'act', id: 'd.wake',   t: 9.3, d: 1.6, sfx: [{ n: 'cloth', at: .3, g: .3, pan: .6, d: .6 }] },
  { kind: 'act', id: 'b.wave',   t: 10.2, d: 2.2, sfx: [{ n: 'cloth', at: .2, g: .3, pan: .5, d: 1.2 }] },
  { kind: 'act', id: 'q.hop',    t: 16.45, d: .5, sfx: [{ n: 'boing', at: .05, g: .2 }, { n: 'land', at: .48, g: .45 }] },
  { kind: 'act', id: 'w.drop',   t: 17.75, d: 1.3, sfx: [{ n: 'plop', at: .62, g: .6 }, { n: 'whoosh', at: .7, g: .18 }] },
  { kind: 'act', id: 'sit.gui',  t: 17.25, d: .5, sfx: [{ n: 'land', at: .4, g: .3, pan: -.3 }] },
  { kind: 'act', id: 'sit.qi',   t: 17.0, d: .5, sfx: [{ n: 'land', at: .4, g: .25 }] },
  { kind: 'act', id: 'sit.wu',   t: 19.2, d: .5, sfx: [{ n: 'land', at: .4, g: .4, pan: -.2 }] },
  { kind: 'act', id: 'sit.ma',   t: 11.3, d: .5, sfx: [{ n: 'land', at: .4, g: .3, pan: .3 }] },

  // ---------------- 20–40 feast & toasts
  { kind: 'act', id: 'l.bowl',  t: 20.2, d: .5, sfx: [{ n: 'tick', at: .45, g: .35, pan: .2 }] },
  { kind: 'act', id: 'l.dip',   t: 20.75, d: .7, sfx: [{ n: 'slosh', at: .5, g: .5, pan: .1 }] },
  { kind: 'act', id: 'l.pour',  t: 21.5, d: 1.1, sfx: [{ n: 'pour', at: .25, g: .5, d: .8, pan: .2 }] },
  { kind: 'act', id: 'l.pass',  t: 22.8, d: 1.0, sfx: [{ n: 'clink', at: .85, g: .35, f: 1.2, pan: .3 }] },
  { kind: 'act', id: 'm.sniff', t: 23.9, d: 1.6, sfx: [{ n: 'sip', at: .9, g: .4, pan: .3 }] },
  { kind: 'act', id: 'm.happy', t: 25.0, d: 1.0, sfx: [{ n: 'twinkle', at: .05, g: .22, pan: .3 }] },
  { kind: 'act', id: 'all.pick', t: 26.2, d: .6, sfx: [{ n: 'tick', at: .5, g: .3, pan: -.4 }, { n: 'tick', at: .6, g: .25, pan: .4 }, { n: 'tick', at: .7, g: .25, pan: 0 }] },
  { kind: 'act', id: 'all.sip', t: 27.0, d: 1.6, sfx: [{ n: 'sip', at: .6, g: .35, pan: -.3 }, { n: 'sip', at: .8, g: .3, pan: .3 }] },
  { kind: 'act', id: 'all.ah',  t: 28.7, d: .9 },
  { kind: 'act', id: 'c.pick',  t: 30.3, d: .5, sfx: [{ n: 'tick', at: .45, g: .35 }] },
  { kind: 'act', id: 'c.raise', t: 30.8, d: .55 },
  { kind: 'act', id: 'c.clink', t: 31.35, d: .4, sfx: [{ n: 'cupclink', at: .3, g: .7 }] },
  { kind: 'act', id: 'c.drink', t: 31.9, d: 1.2, sfx: [{ n: 'sip', at: .6, g: .4, pan: -.2 }] },
  { kind: 'act', id: 'c.down',  t: 33.2, d: .5, sfx: [{ n: 'cuptap', at: .45, g: .45, pan: -.2 }] },
  { kind: 'act', id: 'x.raise', t: 34.2, d: .5 },
  { kind: 'act', id: 'x.clink', t: 34.7, d: .35, sfx: [{ n: 'cupclink', at: .28, g: .7, pan: .2 }] },
  { kind: 'act', id: 'x.gulp',  t: 35.15, d: 1.5, sfx: [{ n: 'gulp', at: .3, g: .45, pan: .1 }, { n: 'gulp', at: .65, g: .45, pan: .3 }, { n: 'gulp', at: 1.0, g: .45, pan: .1 }] },
  { kind: 'act', id: 'x.slam',  t: 36.65, d: .35, sfx: [{ n: 'cuptap', at: .3, g: .7, pan: .1 }] },
  { kind: 'act', id: 'x.win',   t: 36.95, d: 1.0, sfx: [{ n: 'twinkle', at: 0, g: .3, pan: .1 }] },
  { kind: 'act', id: 'x.dou',   t: 37.15, d: .9, sfx: [{ n: 'cuptap', at: .5, g: .45, pan: .4 }] },
  { kind: 'act', id: 'laugh',   t: 37.9, d: 2.3 },

  // ---------------- 40–60 night, fireworks, promise
  ...[42.4, 42.8, 43.2, 43.6, 44.0, 44.4].map((t, i) => ({ kind: 'act', id: 'lamp' + i, t, d: .6, sfx: [{ n: 'lampon', at: 0, g: .3, pan: [-.6, -.3, 0, .3, .6, .1][i] }] })),
  ...[45.2, 46.6, 47.5, 48.7, 49.9, 51.1, 52.9, 55.3, 57.1].map((t, i) => ({ kind: 'act', id: 'fw' + i, t, d: 3.0, sfx: [{ n: 'fwlaunch', at: 0, g: .2, pan: [-.4, .3, 0, -.2, .45, -.45, .2, -.1, .3][i] }, { n: 'fwboom', at: 1.0, g: .55, pan: [-.4, .3, 0, -.2, .45, -.45, .2, -.1, .3][i] }] })),
  { kind: 'act', id: 'cheer',   t: 46.3, d: 4.5, sfx: [{ n: 'cheer', at: .2, g: .5, d: 2.5 }] },
  { kind: 'act', id: 'p.turn',  t: 53.4, d: .8, sfx: [{ n: 'cloth', at: .2, g: .25, d: .4 }] },
  { kind: 'act', id: 'p.pick',  t: 54.1, d: .55, sfx: [{ n: 'tick', at: .5, g: .35 }] },
  { kind: 'act', id: 'p.raise', t: 54.65, d: .7 },
  { kind: 'act', id: 'caption', t: 55.0, d: .9, sfx: [{ n: 'chime', at: .1, g: .45 }] },
  { kind: 'act', id: 'fadeout', t: 59.1, d: .9 },

  // ---------------- ambience levels
  { kind: 'amb', t: 0,    outdoor: .9, stream: .8, crowd: .8, simmer: .4, night: 0, fw: 0 },
  { kind: 'amb', t: 4.5,  outdoor: .7, stream: .5, crowd: .55, simmer: .9, night: 0, fw: 0 },
  { kind: 'amb', t: 12.5, outdoor: .8, stream: .6, crowd: .7, simmer: .5, night: 0, fw: 0 },
  { kind: 'amb', t: 20,   outdoor: .6, stream: .4, crowd: .5, simmer: 1, night: 0, fw: 0 },
  { kind: 'amb', t: 38,   outdoor: .6, stream: .5, crowd: .7, simmer: .6, night: 0, fw: 0 },
  { kind: 'amb', t: 41,   outdoor: .3, stream: .6, crowd: .6, simmer: .5, night: .4, fw: 0 },
  { kind: 'amb', t: 45,   outdoor: 0,  stream: .6, crowd: .8, simmer: .4, night: 1, fw: 1 },
  { kind: 'amb', t: 52,   outdoor: 0,  stream: .5, crowd: .5, simmer: .4, night: .9, fw: .8 },
  { kind: 'amb', t: 60,   outdoor: 0,  stream: .4, crowd: .3, simmer: .3, night: .8, fw: .6 },
];
const SHOTS = CUES.filter(c => c.kind === 'shot');
const ACT = {}; CUES.filter(c => c.kind === 'act').forEach(c => { ACT[c.id] = c; });
function prog(id, t) { const c = ACT[id]; if (!c) return 0; return clamp((t - c.t) / c.d); }
function shotAt(t) { for (const s of SHOTS) if (t >= s.t && t < s.end) return s; return SHOTS[SHOTS.length - 1]; }
const newT = t => t, oldT = t => t, ENV = {};

// walks: [[t, steps], …]; whole steps = both feet planted. Footfalls are placed from these.
const WALKS = {
  'wu':  { keys: [[12.6, 0], [17.5, 11]], snd: 'grass', g: .42, pan: -.2 },
  'gui': { keys: [[12.8, 0], [17.1, 15]], snd: 'grass', g: .3, pan: -.4 },
  'qi':  { keys: [[12.9, 0], [16.3, 21]], snd: 'grass', g: .25, pan: -.1, o: { stride: 2.2, lift: 40, bob: 16 } },
};
const walkN = (id, t) => track(WALKS[id].keys, t, ease);
const walkMoving = (id, t) => Math.abs(walkN(id, t + .02) - walkN(id, t - .02)) > .002;

// music in film time: warm, bright folk feel in D major; a hush at dusk, swell at fireworks
const MUSIC = {
  chords: [[0, 'D3 A3 E4 F#4'], [4.5, 'G2 D3 B3 D4'], [8.5, 'B2 F#3 A3 D4'], [12.5, 'A2 E3 A3 C#4'], [16.5, 'D3 A3 D4 F#4'], [20, 'G2 D3 G3 B3'], [24, 'E3 B3 D4 G4'],
    [26, 'D3 A3 D4 F#4'], [30, 'B2 F#3 B3 D4'], [34, 'G2 D3 G3 B3'], [36.95, 'A2 E3 A3 C#4'], [38, 'D3 A3 D4 F#4'], [40, 'B2 F#3 A3 D4'], [43, 'G2 D3 F#3 B3'],
    [46, 'D3 A3 E4 F#4 A4'], [49, 'B2 F#3 B3 D4'], [52, 'G2 D3 G3 B3'], [55, 'D3 A3 D4 F#4 A4']],
  notes: [[.6, 'A4'], [1.4, 'B4'], [2.2, 'D5'], [3.4, 'E5'], [4.9, 'F#5'], [5.5, 'E5'], [6.35, 'D5'], [6.9, 'B4'], [7.6, 'A4'], [8.9, 'D5'], [9.7, 'E5'], [10.5, 'F#5'],
    [11.3, 'A5'], [12.6, 'F#5'], [13.1, 'E5'], [13.6, 'D5'], [14.1, 'E5'], [14.6, 'F#5'], [15.1, 'A5'], [15.6, 'B5'], [16.45, 'A5'], [16.95, 'F#5'], [17.95, 'D5'], [18.4, 'E5'],
    [19.2, 'D5'], [20.75, 'A4'], [21.5, 'B4'], [22.3, 'D5'], [23.65, 'E5'], [24.9, 'F#5'], [26.7, 'A5'], [27.6, 'F#5'], [28.7, 'E5'], [29.4, 'D5'], [31.65, 'A5'], [32.2, 'F#5'],
    [33.65, 'D5'], [34.98, 'B5'], [35.45, 'A5'], [35.8, 'F#5'], [36.15, 'E5'], [36.95, 'A5'], [37.3, 'D6'], [38.2, 'F#5'], [38.7, 'A5'], [39.2, 'F#5'], [40.6, 'D5'], [42.4, 'E5'],
    [43.6, 'D5'], [44.8, 'A4'], [46.2, 'D5'], [46.6, 'F#5'], [47.5, 'A5'], [48.7, 'F#5'], [49.9, 'E5'], [51.1, 'D5'], [53.4, 'A4'], [54.65, 'B4'], [55.1, 'D5'], [55.9, 'F#5'],
    [56.8, 'E5'], [57.6, 'D5'], [58.4, 'A5'], [59.2, 'D6']],
};
