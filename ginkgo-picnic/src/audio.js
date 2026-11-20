// Music + sound effects, synthesized sample by sample from the cue list (deterministic).
import { DUR, CUTS, IDS, WALK, stepTimes, tossTimes, TOSS, T, STRETCH, YAWN, PEEK, JUMP, TWIRL, cycTimes, pickTime, CLINKS, DRINKS, LAUGHS, GULPS, WIN, HICCUP, FIREWORKS, rng, shotAt } from './cues.js';

export function buildAudio(sr = 48000) {
  const N = Math.floor(sr * DUR), L = new Float32Array(N), R = new Float32Array(N), SL = new Float32Array(N), SR = new Float32Array(N);
  const rnd = rng(4242), TAU = Math.PI * 2;
  // mix a mono generator fn(i, tt) for dur seconds at t0
  const put = (t0, dur, gain, pan, send, fn) => { const a = Math.max(0, Math.floor(t0 * sr)), n = Math.floor(dur * sr), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4); for (let i = 0; i < n && a + i < N; i++) { const s = fn(i / sr, i); L[a + i] += s * gl; R[a + i] += s * gr; SL[a + i] += s * gl * send; SR[a + i] += s * gr * send; } };
  const lp = (fc) => { let y = 0; const k = 1 - Math.exp(-TAU * fc / sr); return x => (y += k * (x - y)); };
  const bp = (fc, q) => { let lo = 0, bd = 0; const f = 2 * Math.sin(Math.PI * fc / sr); return x => { lo += f * bd; const hi = x - lo - bd / q; bd += f * hi; return bd; }; };
  const noise = () => rnd() * 2 - 1;
  const pluck = (t0, f, dur, g, pan = 0, send = .3, bright = .5) => { const P = Math.round(sr / f), buf = new Float32Array(P); const l = lp(1500 + bright * 5000); for (let i = 0; i < P; i++) buf[i] = l(noise()); let j = 0, prev = 0; put(t0, dur, g, pan, send, tt => { const s = buf[j]; const nx = (s + prev) * .5 * .996; prev = s; buf[j] = nx; j = (j + 1) % P; return s * Math.min(1, (dur - tt) * 20); }); };
  const bell = (t0, f, dur, g, pan = 0, send = .5) => put(t0, dur, g, pan, send, tt => (Math.sin(TAU * f * tt) + .5 * Math.sin(TAU * f * 2.76 * tt) * Math.exp(-tt * 5) + .25 * Math.sin(TAU * f * 5.4 * tt) * Math.exp(-tt * 9)) * Math.exp(-tt * 3.2 / dur * 2) * Math.min(1, tt * 400));
  const chirp = (t0, f0, f1, dur, g, pan = 0, send = .25, vib = 0) => { let ph = 0; put(t0, dur, g, pan, send, tt => { const k = tt / dur, f = f0 * Math.pow(f1 / f0, k) * (1 + vib * Math.sin(TAU * 7 * tt)); ph += TAU * f / sr; const e = Math.sin(Math.PI * Math.min(1, k)) ** .6; return (Math.sin(ph) + .3 * Math.sin(2 * ph) + .12 * Math.sin(3 * ph)) * e; }); };
  const thud = (t0, g, pan = 0, f = 95) => { let ph = 0; const l = lp(500); put(t0, .14, g, pan, .15, tt => { ph += TAU * f * (1 + 1.2 * Math.exp(-tt * 40)) / sr; return (Math.sin(ph) + l(noise()) * .5) * Math.exp(-tt * 34); }); };
  const nz = (t0, dur, g, pan, send, fc, q, envf) => { const b = bp(fc, q); put(t0, dur, g, pan, send, tt => b(noise()) * envf(tt / dur)); };
  const clink = (t0, g, pan = 0) => { for (const [f, d] of [[2350, .5], [3720, .35], [5480, .22], [7100, .12]]) put(t0, d, g * .5, pan, .5, tt => Math.sin(TAU * f * tt) * Math.exp(-tt * 9 / d)); nz(t0, .02, g * .6, pan, .3, 5000, 1, k => 1 - k); };
  const tick = (t0, g, pan = 0, f = 1700) => put(t0, .07, g, pan, .25, tt => Math.sin(TAU * f * tt) * Math.exp(-tt * 70));
  const bubble = (t0, g, pan = 0, f = 400) => chirp(t0, f, f * 2.1, .06, g, pan, .2);
  const voice = (t0, notes, g, pan = 0, base = 700) => { let t = t0; for (const [a, b, d] of notes) { chirp(t, base * a, base * b, d, g, pan, .3, .02); t += d * .95; } };
  const shotGain = (t, s, far = .3) => (shotAt(t) === s ? 1 : far);
  const sem = n => 440 * Math.pow(2, (n - 69) / 12);

  // ---------- music: 120 bpm, G major pentatonic ----------
  const beat = .5, bar = 2;
  const chords = [[43, 55, 59, 62, 67], [40, 52, 55, 59, 64], [36, 48, 52, 55, 60], [38, 50, 54, 57, 62]];
  const melA = [74, 0, 76, 79, 0, 76, 74, 0, 71, 0, 74, 76, 0, 0, 67, 0, 76, 0, 79, 81, 0, 79, 76, 0, 74, 0, 76, 74, 0, 71, 69, 0];
  const melB = [79, 0, 81, 83, 0, 81, 79, 0, 76, 0, 79, 76, 74, 0, 71, 0, 76, 0, 74, 76, 79, 0, 81, 0, 74, 0, 0, 71, 69, 71, 74, 0];
  const pad = (t0, dur, notes, g) => { const l = lp(1400); put(t0, dur, g, 0, .6, tt => { let s = 0; for (const n of notes) { const f = sem(n); s += Math.sin(TAU * f * tt) + .4 * Math.sin(TAU * f * 1.004 * tt + 1) + .2 * Math.sin(TAU * f * 2 * tt); } return l(s) / notes.length * Math.min(1, tt / .6) * Math.min(1, (dur - tt) / .8); }); };
  for (let b = 0; b < 30; b++) {
    const t0 = b * bar, ch = chords[b % 4], sec = t0 < 20 ? 0 : t0 < 40 ? 1 : t0 < 52 ? 2 : 3;
    if (b === 29) { pad(t0, 3, chords[0].slice(1), .05); for (const [k, n] of [67, 71, 74, 79, 83].entries()) bell(t0 + k * .09, sem(n), 2.5, .05, (k - 2) * .2); pluck(t0, sem(43), 2, .16, 0, .4, .3); break; }
    pad(t0, bar + .3, ch.slice(1), [.035, .03, .06, .05][sec]);
    const mel = (Math.floor(b / 4) % 2 ? melB : melA).slice((b % 4) * 8, (b % 4) * 8 + 8);
    if (sec < 2) { pluck(t0, sem(ch[0]), .9, .2, 0, .15, .2); pluck(t0 + beat * 2, sem(ch[0] + (sec ? 7 : 0)), .8, .16, 0, .15, .2); if (sec) { pluck(t0 + beat * 1.5, sem(ch[0] + 12), .4, .1, 0, .1, .2); pluck(t0 + beat * 3.5, sem(ch[0] + 7), .4, .1, 0, .1, .2); } }
    mel.forEach((n, k) => { if (!n) return; const tt = t0 + k * .25; if (sec === 0) { if (b >= 1) pluck(tt, sem(n), 1.2, .15, .15, .4, .7); } else if (sec === 1) { pluck(tt, sem(n), 1.0, .16, .15, .35, .8); if (k % 4 === 0) pluck(tt, sem(n - 12), .8, .07, -.3, .3, .5); } else if (sec === 2) { if (k % 2 === 0) bell(tt, sem(n), 1.6, .035, (k % 4 ? .4 : -.4)); } else if (b < 29) { if (k % 2 === 0) { pluck(tt, sem(n), 1.6, .13, .1, .5, .6); bell(tt, sem(n + 12), 1.2, .018, -.2); } } });
    if (sec === 2) for (let k = 0; k < 8; k++) bell(t0 + k * .25, sem(ch[1 + (k * 2) % 4] + 12), .7, .016, Math.sin(k) * .6);
    for (let k = 0; k < 8; k++) { const tt = t0 + k * .25; if (sec === 0 && b >= 2 && k % 2 === 1) nz(tt, .05, .03, .3, .1, 6500, 1.5, x => 1 - x); if (sec === 1) { nz(tt, .05, k % 2 ? .05 : .025, .3, .1, 6500, 1.5, x => 1 - x); if (k % 4 === 0) thud(tt, .16, 0, 70); if (k % 4 === 2) { tick(tt, .07, -.25, 880); nz(tt, .09, .07, .1, .2, 1900, 1.2, x => (1 - x) ** 2); } } }
  }

  // ---------- ambience ----------
  { const b1 = bp(900, .8), b2 = bp(2300, .9), l1 = lp(.7), l2 = lp(380), cr = bp(4300, 9); let babble = 0;
    for (let i = 0; i < N; i++) { const t = i / sr, night = Math.min(1, Math.max(0, (t - 39.5) / 3)), day = 1 - night; const n = noise(); const mod = .6 + .4 * Math.sin(t * .7) + l1(noise()) * 8;
      const creek = (b1(n) * .5 + b2(n) * .3) * mod * .028 * (shotAt(t) === 3 ? 1.8 : 1) * (.6 + .4 * day);
      babble = l2(noise()) * (.5 + .5 * Math.sin(t * 2.1) * Math.sin(t * .37)) * .1 * (1 - .3 * night);
      const cri = cr(noise()) * (Math.sin(TAU * 38 * t) > .2 ? 1 : 0) * (Math.sin(TAU * 1.3 * t) > 0 ? 1 : 0) * .02 * night;
      const fadeio = Math.min(1, t / .8) * Math.min(1, (DUR - t) / 1.2); L[i] += (creek + babble + cri) * fadeio; R[i] += (creek * .8 + babble + cri * .7) * fadeio; } }
  { const r = rng(11); for (let t = .6; t < 38; t += .9 + r() * 2.2) { const f = 2400 + r() * 1800, pan = r() * 2 - 1, n = 2 + Math.floor(r() * 4); for (let k = 0; k < n; k++) chirp(t + k * .11, f * (1 + r() * .1), f * (1.15 + r() * .3), .07, .022, pan, .5); }
    for (let t = 1; t < 59; t += .35 + r() * .9) { const f = 520 + r() * 500; chirp(t, f, f * (.8 + r() * .5), .09 + r() * .08, .012 + (t > 42 && t < 52 ? .008 : 0), r() * 2 - 1, .5, .03); } }
  // simmer + fire
  for (let t = .3; t < 59.5; t += .16 + rnd() * .22) bubble(t, .018 * (shotAt(t) === 1 || shotAt(t) >= 5 && shotAt(t) <= 9 ? 1.5 : .7), rnd() * .4 - .2, 260 + rnd() * 320);

  // ---------- act 1 ----------
  nz(.1, 3.2, .05, 0, .5, 3000, .6, k => Math.sin(Math.PI * k) ** 2);            // leafy breeze on the crane down
  for (const t of tossTimes()) { const g = shotGain(t, 1, .35); nz(t + TOSS.release - .05, .16, .05 * g, -.2, .2, 2500, 1, k => Math.sin(Math.PI * k)); tick(t + TOSS.grab, .04 * g, -.2, 1300); bubble(t + TOSS.land, .16 * g, 0, 300); nz(t + TOSS.land, .12, .07 * g, 0, .3, 3200, 1, k => (1 - k) ** 2); }
  for (let t = 4.0; t < 7.5; t += .4) nz(t, .22, .035, .3, .2, 1100, 1.2, k => Math.sin(Math.PI * k));           // Bei Qi fanning
  for (let t = 4.3; t < 7.5; t += 2.42) put(t, .1, .05, -.05, .3, tt => Math.sin(TAU * 620 * tt) * Math.exp(-tt * 60)); // ladle knocks the pot
  for (const t of cycTimes(STRETCH, 7.4, 11)) { chirp(t, 420, 900, .55, .05, .3, .4, .01); voice(t + .7, [[1.2, 1.5, .25]], .05, .3, 620); }
  for (const t of cycTimes(YAWN, 7.4, 11)) chirp(t + .1, 760, 380, 1.3, .07, 0, .4, .03);
  for (let t = 7.7; t < 11; t += 1.65) nz(t, .8, .04, -.4, .3, 420, 2, k => Math.sin(Math.PI * k));               // Shu Di snoring
  for (const t of cycTimes(TWIRL, 11, 14.4)) { nz(t, .9, .05, .2, .4, 2600, 1, k => Math.sin(Math.PI * k)); for (let k = 0; k < 5; k++) bell(t + .15 + k * .12, sem(84 + [0, 2, 4, 7, 9][k]), .5, .02, .3); voice(t + 1.4, [[1, 1.3, .14], [1.3, 1.1, .18]], .05, .2, 880); }
  for (const t of cycTimes(PEEK, 11, 14.5)) { chirp(t, 300, 900, .12, .08, .5, .3); voice(t + 1.3, [[1, 1.15, .12], [1.1, 1.2, .14]], .04, .5, 760); }
  for (const t of cycTimes(JUMP, 11, 14.5)) { chirp(t, 260, 780, .22, .09, .1, .3); voice(t + .1, [[1, 1.6, .2]], .07, .1, 900); thud(t + .5, .3, .1); }
  for (let t = 11.05; t < 14.45; t += 1 / 4.5) thud(t, .1, .1, 130);                                              // Gou Qi running
  voice(T.call - .05, [[1, 1.25, .16], [1.25, 1.5, .16], [1.5, 1.2, .3]], .11, 0, 520);                          // He Shou Wu calls
  IDS.forEach((id, i) => { if (id !== 'hsw' && id !== 'shudi') chirp(15.0 + i * .02, 700 + i * 60, 1000 + i * 60, .08, .03, (i - 4) / 5, .3); });
  chirp(T.wake + .05, 500, 1100, .15, .07, -.5, .3);
  IDS.forEach((id, i) => { const pan = (i - 4) / 5; for (const t of stepTimes(id)) thud(t, id === 'gouqi' ? .2 : .16, pan, 100 + i * 8); if (WALK[id]) { thud(WALK[id][1], .32, pan, 70); nz(WALK[id][1], .12, .06, pan, .2, 900, 1, k => 1 - k); } });
  put(T.ladleRest + .12, .2, .1, 0, .3, tt => (Math.sin(TAU * 540 * tt) + .5 * Math.sin(TAU * 1310 * tt)) * Math.exp(-tt * 30));

  // ---------- act 2 ----------
  IDS.forEach((id, i) => { const pan = (i - 4) / 5, t = pickTime(i); tick(t, .12, pan, 1500 + i * 90); nz(t - .25, .25, .03, pan, .2, 1500, 1, k => Math.sin(Math.PI * k)); });
  for (const tt of [T.toast, T.toast2]) { IDS.forEach((id, i) => voice(tt - .1 + i * .015, [[1, 1.5, .16], [1.5, 1.35, .3]], .05, (i - 4) / 5, 560 + i * 55)); thud(tt + .38, .3, 0, 75); for (let k = 0; k < 5; k++) clink(tt + .02 + k * .045, .1, (k - 2) / 3); }
  for (const c of CLINKS) { const pan = c.P[0] / 2.2; clink(c.t, .3, pan); nz(c.t - .5, .5, .03, pan, .2, 2000, 1, k => k * k); }
  for (const id of IDS) for (const d of DRINKS[id] || []) { if (d[1] - d[0] > 1.5) continue; const pan = (IDS.indexOf(id) - 4) / 5, g = (d[0] >= CUTS[6] && d[0] < CUTS[9]) ? 1 : .5; for (let t = d[0] + .35; t < d[1] - .3; t += .28) chirp(t, 210, 150, .09, .1 * g, pan, .15); chirp(d[1] + .02, 900, 620, .32, .05 * g, pan, .4, .02); }
  for (const [t, who] of GULPS) chirp(t, who ? 230 : 190, who ? 160 : 135, .1, .16, who ? -.15 : -.5, .15);
  voice(WIN - .05, [[1, 1.4, .12], [1.4, 1.8, .14], [1.8, 1.6, .3]], .11, -.5, 640); thud(WIN + .4, .3, -.5, 75); for (let k = 0; k < 4; k++) bell(WIN + k * .07, sem(79 + k * 4), .6, .04, -.4);
  chirp(HICCUP, 500, 1300, .09, .12, -.2, .3); thud(HICCUP + .22, .2, -.2);
  for (const id of IDS) for (const l of LAUGHS[id] || []) { const i = IDS.indexOf(id), base = 520 + i * 60; for (let t = l[0] + .1; t < l[1] - .1; t += .16) chirp(t, base * 1.5, base * 1.2, .09, .045, (i - 4) / 5, .3); }
  for (let t = 29.7; t < 32; t += .45) chirp(t, 420, 560, .12, .04, -.75, .3);                                    // Shu Di cheering
  for (let k = 0; k < 9; k++) bell(T.lanterns + k * .07, sem(72 + [0, 4, 7, 12, 16, 19, 24, 28, 31][k]), 1.6, .04, (k - 4) / 5); // lanterns light
  nz(T.lanterns, .9, .04, 0, .5, 5000, .7, k => Math.sin(Math.PI * k));
  IDS.forEach((id, i) => chirp(T.lanterns + .25 + i * .03, 600 + i * 50, 820 + i * 50, .3, .03, (i - 4) / 5, .4, .02));

  // ---------- act 3 ----------
  for (const f of FIREWORKS) { const pan = Math.max(-.8, Math.min(.8, (f.x - 6) / 20)), g = f.size / 6 * (f.t > 52.5 ? .55 : 1);
    { let ph = 0; put(f.t - .95, .95, .035 * g, pan, .5, tt => { ph += TAU * (700 + 1500 * tt * tt) * (1 + .02 * Math.sin(TAU * 18 * tt)) / sr; return Math.sin(ph) * Math.sin(Math.PI * Math.min(1, tt / .95)) ** .7; }); }
    { const l = lp(260), l2 = lp(1800); let ph = 0; put(f.t + .05, 1.8, .9 * g, pan, .7, tt => { ph += TAU * (48 + 40 * Math.exp(-tt * 12)) / sr; return (l(noise()) * 2.2 + Math.sin(ph) * .9) * Math.exp(-tt * 3.2) + l2(noise()) * .5 * Math.exp(-tt * 14); }); }
    { const r = rng(f.seed + 99), h = bp(5200, 1.2); put(f.t + .35, 1.5, .11 * g, pan, .5, tt => h((r() < .012 * (1 - tt / 1.5) * 6 ? (r() * 2 - 1) * 6 : 0)) * (1 - tt / 1.5)); }
    if (f.t < 52.5) { const r = rng(f.seed); for (let k = 0; k < 5; k++) { const b = 420 + r() * 600; chirp(f.t + .3 + r() * .4, b, b * 1.5, .28 + r() * .2, .028, r() * 2 - 1, .5, .02); } } }
  chirp(T.whistle + .2, 600, 1100, .14, .05, 0, .3);
  for (let t = 48.5; t < 52; t += .5) IDS.forEach((id, i) => { if ((i + Math.round(t * 2)) % 3 === 0) chirp(t + i * .03, 640 + i * 50, 980 + i * 50, .2, .04, (i - 4) / 5, .4, .02); });
  // He Shou Wu's line: 12 warm syllables (來年大家還要再次相聚喔！)
  { const pat = [1, 1.12, 1, 1.2, 1.26, 1.12, 1.33, 1.26, 1.5, 1.33, 1.5, 1.68]; pat.forEach((p, k) => { const t = T.speak[0] + .15 + k * .27; chirp(t, 400 * p, 400 * p * (k === 11 ? 1.25 : 1.06), k === 11 ? .5 : .2, .12, 0, .35, .025); }); }
  chirp(54.05, 380, 700, .14, .07, 0, .3);
  IDS.forEach((id, i) => { if (id !== 'hsw') voice(57.4 + i * .03, [[1, 1.4, .15], [1.4, 1.7, .35]], .05, (i - 4) / 5, 540 + i * 50); });
  for (let k = 0; k < 6; k++) bell(T.endCard + k * .1, sem(79 + [0, 4, 7, 12, 16, 19][k]), 2, .035, (k - 3) / 4);

  // ---------- reverb (Schroeder) + soft limit ----------
  for (const [S_, O] of [[SL, L], [SR, R]]) { const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d, k) => ({ b: new Float32Array(Math.round(d * sr / 44100) + (O === R ? 23 : 0)), i: 0, fb: .8, lp: 0 })); const aps = [225, 556, 441].map(d => ({ b: new Float32Array(Math.round(d * sr / 44100)), i: 0 }));
    for (let i = 0; i < N; i++) { const x = S_[i] * .25; let y = 0; for (const c of combs) { const o = c.b[c.i]; c.lp = o * .7 + c.lp * .3; c.b[c.i] = x + c.lp * c.fb; c.i = (c.i + 1) % c.b.length; y += o; } for (const a of aps) { const o = a.b[a.i]; a.b[a.i] = y + o * .5; y = o - y * .5; a.i = (a.i + 1) % a.b.length; } O[i] += y * .22; } }
  let pk = 0; for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.6); R[i] = Math.tanh(R[i] * 1.6); pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
  const g = .9 / (pk || 1); for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
  return { L, R, sr };
}

export function toWavBase64(a) {
  const n = a.L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf); const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, a.sr, true); v.setUint32(28, a.sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, a.L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, a.R[i])) * 32767, true); }
  const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s);
}
