// ---------------------------------------------------------------------------
// Audio: everything is synthesized deterministically from the CUE LIST —
// music (pads + plucked pentatonic melody), creek ambience, simmer, and the
// sound effects attached to motion beats. Returns stereo Float32 at AUDIO_SR.
// ---------------------------------------------------------------------------
const AUDIO_SR = 48000;
const MASTER_GAIN = 2.1; // set by tools/render.js measurement so playback ≈ −16 LUFS
let _AUDIO = null;
function synthAudio() {
  if (_AUDIO) return _AUDIO;
  const SR = AUDIO_SR, N = Math.ceil(SR * DUR);
  const mL = new Float32Array(N), mR = new Float32Array(N);   // music
  const sL = new Float32Array(N), sR = new Float32Array(N);   // sfx
  const aL = new Float32Array(N), aR = new Float32Array(N);   // ambience
  const rng = mulberry32(2024);
  const white = () => rng() * 2 - 1;

  // --- small DSP kit ---------------------------------------------------------
  function biquad(type, f, Q = .707) {
    const w = 2 * Math.PI * f / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * Q);
    let b0, b1, b2, a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; } // band-pass (0 dB peak)
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return x => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  }
  function pinkGen(r) { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; return () => { const w = r() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; const o = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362; b6 = w * .115926; return o * .11; }; }
  const panG = p => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
  function put(L, R, t, arr, g, pan) { const [gl, gr] = panG(pan || 0); const i0 = Math.round(t * SR); for (let i = 0; i < arr.length; i++) { const k = i0 + i; if (k < 0 || k >= N) continue; L[k] += arr[i] * g * gl; R[k] += arr[i] * g * gr; } }
  const len = s => Math.max(1, Math.round(s * SR));
  function env(n, att, dec) { return i => { const t = i / SR; return (t < att ? t / att : 1) * Math.exp(-(t - att) / dec); }; }

  // --- sound effects -----------------------------------------------------------
  const FX = {
    plip(o) { const n = len(.35), a = new Float32Array(n); let ph = 0, ph2 = 0; const lp = biquad('hp', 300);
      for (let i = 0; i < n; i++) { const t = i / SR, f = 700 + 1000 * (1 - Math.exp(-t / .02)), e = Math.exp(-t / .06) * Math.min(1, t / .002);
        ph += 2 * Math.PI * f / SR; ph2 += 2 * Math.PI * f * 1.9 / SR; a[i] = lp((Math.sin(ph) + .25 * Math.sin(ph2)) * e * .6 + white() * Math.exp(-t / .01) * .05); }
      return a; },
    leaftouch(o) { const p = FX.plip(o); const n = p.length, a = new Float32Array(n); const bp = biquad('bp', 2800, .8); for (let i = 0; i < n; i++) { const t = i / SR; a[i] = p[i] * .55 + bp(white()) * Math.exp(-t / .05) * .25; } return a; },
    rustle(o) { const d = o.d || .6, n = len(d + .2), a = new Float32Array(n); const bp = biquad('bp', 3200, .7), bp2 = biquad('bp', 1500, .9);
      let g = 0; for (let i = 0; i < n; i++) { const t = i / SR, u = t / d; if (rng() < 0.004) g = .4 + rng() * .6; g *= .9993; const sh = Math.sin(Math.PI * clamp(u)) ** .7;
        a[i] = (bp(white()) * .8 + bp2(white()) * .4) * g * sh * .55; } return a; },
    cloth(o) { const d = o.d || .5, n = len(d + .15), a = new Float32Array(n); const lp = biquad('lp', 1800), bp = biquad('bp', 700, .6);
      let g = 0; for (let i = 0; i < n; i++) { const t = i / SR, u = t / d; if (rng() < 0.002) g = .5 + rng() * .5; g *= .9996; const sh = Math.sin(Math.PI * clamp(u));
        a[i] = (lp(white()) * .7 + bp(white()) * .5) * (0.35 + g * .65) * sh * .5; } return a; },
    step(o) { const n = len(.18), a = new Float32Array(n), lp = biquad('lp', 380); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / SR, f = 95 - 35 * t / .18; ph += 2 * Math.PI * f / SR; a[i] = Math.sin(ph) * Math.exp(-t / .045) * .6 + lp(white()) * Math.exp(-t / .03) * .7; } return a; },
    softstep(o) { const s = FX.step(o); const lp = biquad('lp', 600); return s.map(v => lp(v) * .8); },
    stone(o) { const n = len(.25), a = new Float32Array(n), bp = biquad('bp', 1900, 2.2); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * 820 / SR; a[i] = bp(white()) * Math.exp(-t / .02) * 1.2 + Math.sin(ph) * Math.exp(-t / .035) * .3 + FX._thump(t) * .5; } return a; },
    _thump(t) { return Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t / .05); },
    splash(o) { const n = len(1.0), a = new Float32Array(n), bp = biquad('bp', 1600, .6), hp = biquad('hp', 400);
      for (let i = 0; i < n; i++) { const t = i / SR; a[i] = hp(bp(white())) * Math.min(1, t / .008) * Math.exp(-t / .22) * 1.4; }
      for (let k = 0; k < 6; k++) { const p = FX.plip({}), off = len(.08 + rng() * .5), g = .15 + rng() * .25; for (let i = 0; i < p.length && off + i < n; i++) a[off + i] += p[i] * g; }
      return a; },
    patter(o) { const d = o.d || 2, n = len(d + .2), a = new Float32Array(n); for (let k = 0; k * .14 < d; k++) { const s = FX.step({}), off = len(k * .14 + rng() * .02), g = (.55 + rng() * .3) * (k % 2 ? .8 : 1); for (let i = 0; i < s.length && off + i < n; i++) a[off + i] += s[i] * g * .6; } return a; },
    boing(o) { const n = len(.3), a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = 380 + 320 * Math.min(1, t / .12); ph += 2 * Math.PI * f / SR; a[i] = Math.sin(ph) * Math.exp(-t / .07) * Math.min(1, t / .005) * .5; } return a; },
    clink(o) { const f0 = 1850 * (o.f || 1), P = [[1, 1, .7], [2.32, .55, .4], [4.25, .35, .22], [6.63, .2, .12], [9.1, .1, .06]];
      const n = len(1.2), a = new Float32Array(n), hp = biquad('hp', 2000);
      for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [r, g, d] of P) v += Math.sin(2 * Math.PI * f0 * r * t + r) * g * Math.exp(-t / d); a[i] = v * Math.min(1, t / .0015) * .35 + hp(white()) * Math.exp(-t / .004) * .3; }
      return a; },
    tap(o) { const n = len(.25), a = new Float32Array(n), lp = biquad('lp', 260), lp2 = biquad('lp', 900);
      for (let i = 0; i < n; i++) { const t = i / SR; a[i] = lp(white()) * Math.exp(-t / .05) * 2.2 + Math.sin(2 * Math.PI * (120 - 40 * t) * t) * Math.exp(-t / .055) * .55 + lp2(white()) * Math.exp(-t / .012) * .25; } return a; },
    twinkle(o) { const n = len(1.0), a = new Float32Array(n); for (const [f, dt] of [[2637, 0], [3520, .07], [3136, .14]]) { const o0 = len(dt); for (let i = 0; o0 + i < n; i++) { const t = i / SR; a[o0 + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t / .28) * Math.min(1, t / .002) * .25; } } return a; },
    air(o) { const d = o.d || 2.5, n = len(d), a = new Float32Array(n); let bp = null;
      for (let i = 0; i < n; i++) { const u = i / n; if (i % 256 === 0) bp = biquad('bp', 350 + 900 * u, .7); a[i] = bp(white()) * Math.sin(Math.PI * u) ** 1.5 * .5; } return a; },
    chime(o) { const f0 = 880, P = [[1, 1, 3.2], [2.0, .4, 1.6], [2.76, .3, 1.0], [5.4, .12, .4]]; const n = len(4), a = new Float32Array(n);
      for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [r, g, d] of P) v += Math.sin(2 * Math.PI * f0 * r * t) * g * Math.exp(-t / d); a[i] = v * Math.min(1, t / .004) * .3; } return a; },
  };
  for (const c of CUES) if (c.kind === 'act' && c.sfx) for (const s of c.sfx) {
    const arr = FX[s.n](s); put(sL, sR, c.t + (s.at || 0), arr, s.g, s.pan);
  }

  // --- ambience: creek + simmer, levels from 'amb' cues ---------------------------
  const AMB = CUES.filter(c => c.kind === 'amb');
  const level = (k, t) => { for (let i = 0; i < AMB.length - 1; i++) { const a = AMB[i], b = AMB[i + 1]; if (t >= a.t && t <= b.t) return lerp(a[k], b[k], (t - a.t) / Math.max(1e-6, b.t - a.t)); } return AMB[AMB.length - 1][k]; };
  {
    const pl = pinkGen(mulberry32(7)), pr = pinkGen(mulberry32(8));
    const bl1 = biquad('bp', 900, .5), br1 = biquad('bp', 950, .5), bl2 = biquad('bp', 2600, 1), br2 = biquad('bp', 2400, 1);
    const hl = biquad('hp', 150), hr = biquad('hp', 150);
    let ph = 0;
    for (let i = 0; i < N; i++) {
      const t = i / SR, lv = level('creek', t) * .55; if (lv <= 0) continue;
      const mod = .75 + .25 * vnoise1(t * 1.3) + .1 * vnoise1(t * 7.1);
      const l = pl(), r = pr();
      aL[i] += hl(bl1(l) * .9 + bl2(l) * .5) * mod * lv; aR[i] += hr(br1(r) * .9 + br2(r) * .5) * mod * lv;
    }
    // babble: little bubbling chirps
    const br = mulberry32(99);
    for (let t = 0; t < DUR;) {
      t += -Math.log(1 - br()) / 10; const lv = level('creek', t); if (lv <= 0) continue;
      const f = 450 + br() * 1300, d = .02 + br() * .04, n = len(d * 4), a = new Float32Array(n); let p = 0;
      for (let i = 0; i < n; i++) { const tt = i / SR; p += 2 * Math.PI * f * (1 + .6 * tt / d) / SR; a[i] = Math.sin(p) * Math.exp(-tt / d) * Math.min(1, tt / .003); }
      put(aL, aR, t, a, .045 * lv * (.4 + br() * .6), br() * 1.4 - .7);
    }
    // simmer
    const lpS = biquad('lp', 380), sr2 = mulberry32(55);
    for (let i = 0; i < N; i++) { const t = i / SR, lv = level('simmer', t); if (lv <= 0) continue; const v = lpS(white()) * .22 * lv * (.8 + .2 * vnoise1(t * 3)); aL[i] += v; aR[i] += v; }
    for (let t = 0; t < DUR;) {
      t += -Math.log(1 - sr2()) / 7; const lv = level('simmer', t); if (lv <= 0) continue;
      const f = 170 + sr2() * 260, n = len(.08), a = new Float32Array(n); let p = 0;
      for (let i = 0; i < n; i++) { const tt = i / SR; p += 2 * Math.PI * f * (1 + 2.5 * tt) / SR; a[i] = Math.sin(p) * Math.exp(-tt / .018) * Math.min(1, tt / .002); }
      put(aL, aR, t, a, .09 * lv * (.4 + sr2() * .6), sr2() * .6 - .3);
    }
  }

  // --- music ------------------------------------------------------------------------
  const TB = 2048, tri = new Float32Array(TB); for (let i = 0; i < TB; i++) { const x = i / TB * 2 * Math.PI; tri[i] = Math.sin(x) + Math.sin(3 * x) / 9 + Math.sin(2 * x) * .18 + Math.sin(5 * x) / 30; }
  const chords = CUES.filter(c => c.kind === 'chord');
  chords.forEach((c, ci) => {
    const t0 = c.t, t1 = (chords[ci + 1] ? chords[ci + 1].t : DUR) + 1.6, n = len(t1 - t0);
    const last = !chords[ci + 1];
    c.notes.forEach((nm, ni) => {
      const f = noteFreq(nm);
      for (const [side, det] of [[-1, .9985], [1, 1.0015]]) {
        const a = new Float32Array(n); let ph = rng() * TB; const inc = f * det * TB / SR; const lp = biquad('lp', 1500);
        const rel = last ? 3.5 : 1.6;
        for (let i = 0; i < n; i++) {
          const t = i / SR, e = Math.min(1, t / 1.3) * (t > (t1 - t0 - rel) ? Math.max(0, (t1 - t0 - t) / rel) : 1);
          ph += inc; if (ph >= TB) ph -= TB; a[i] = lp(tri[ph | 0]) * e * (1 + .08 * Math.sin(t * 1.7 + ni));
        }
        put(mL, mR, t0, a, .022 * (ni === 0 ? 1.2 : 1), side * .45);
      }
    });
  });
  // plucks (Karplus–Strong)
  CUES.filter(c => c.kind === 'note').forEach((c, k) => {
    const f = noteFreq(c.n), n = len(3.0), a = new Float32Array(n), D = Math.max(2, Math.round(SR / f)), buf = new Float32Array(D);
    const r = mulberry32(300 + k); let prev = 0; for (let i = 0; i < D; i++) { prev = prev * .5 + (r() * 2 - 1) * .5; buf[i] = prev; }
    let idx = 0, ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, j = (idx + 1) % D, v = buf[idx]; buf[idx] = (v + buf[j]) * .5 * .9965; idx = j;
      ph += 2 * Math.PI * f / SR; a[i] = v * .9 + Math.sin(ph) * Math.exp(-t / .9) * .35 + Math.sin(ph * 2) * Math.exp(-t / .3) * .08;
    }
    const lp = biquad('lp', 3800); for (let i = 0; i < n; i++) a[i] = lp(a[i]);
    put(mL, mR, c.t, a, c.v * .16, (k % 3 - 1) * .3);
  });

  // --- reverb (Schroeder/Freeverb-lite) on music + some sfx ------------------------
  const wetL = new Float32Array(N), wetR = new Float32Array(N);
  {
    const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491].map(x => Math.round(x * sc)), aps = [556, 441, 341].map(x => Math.round(x * sc));
    for (const [out, spread] of [[wetL, 0], [wetR, 23]]) {
      const cb = combs.map(d => ({ b: new Float32Array(d + spread), i: 0, f: 0 }));
      const ab = aps.map(d => ({ b: new Float32Array(d + spread), i: 0 }));
      for (let i = 0; i < N; i++) {
        const x = (mL[i] + mR[i]) * .5 + (sL[i] + sR[i]) * .18;
        let y = 0;
        for (const c of cb) { const o = c.b[c.i]; c.f = o * .7 + c.f * .3; c.b[c.i] = x + c.f * .84; c.i = (c.i + 1) % c.b.length; y += o; }
        y *= .16;
        for (const a of ab) { const o = a.b[a.i]; const v = y + o * .5; a.b[a.i] = v; a.i = (a.i + 1) % a.b.length; y = o - v * .5; }
        out[i] = y;
      }
    }
  }
  // --- mix ----------------------------------------------------------------------------
  const L = new Float32Array(N), R = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR, fade = Math.min(1, t / .6) * Math.min(1, (DUR - t) / 1.2);
    let l = (mL[i] * .95 + sL[i] + aL[i] + wetL[i] * .35) * fade * MASTER_GAIN;
    let r = (mR[i] * .95 + sR[i] + aR[i] + wetR[i] * .35) * fade * MASTER_GAIN;
    L[i] = Math.tanh(l * 1.1) / 1.1; R[i] = Math.tanh(r * 1.1) / 1.1;
  }
  _AUDIO = { L, R, SR };
  return _AUDIO;
}
function audioWavBase64(from = 0, to = DUR) {
  const a = synthAudio(), i0 = Math.round(from * AUDIO_SR), i1 = Math.round(to * AUDIO_SR), n = i1 - i0;
  const buf = new ArrayBuffer(44 + n * 8), v = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 8, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 3, true); v.setUint16(22, 2, true);
  v.setUint32(24, AUDIO_SR, true); v.setUint32(28, AUDIO_SR * 8, true); v.setUint16(32, 8, true); v.setUint16(34, 32, true); ws(36, 'data'); v.setUint32(40, n * 8, true);
  for (let i = 0; i < n; i++) { v.setFloat32(44 + i * 8, a.L[i0 + i], true); v.setFloat32(48 + i * 8, a.R[i0 + i], true); }
  const u8 = new Uint8Array(buf); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
