// ---------------------------------------------------------------------------
// Audio — synthesized deterministically from the cue list: music, ambience
// beds, and sound effects on every contact.
// ---------------------------------------------------------------------------
const AUDIO_SR = 48000;
const MASTER_GAIN = 2.4;
let _AUDIO = null;
function synthAudio() {
  if (_AUDIO) return _AUDIO;
  const SR = AUDIO_SR, N = Math.ceil(SR * DUR);
  const mL = new Float32Array(N), mR = new Float32Array(N), sL = new Float32Array(N), sR = new Float32Array(N), aL = new Float32Array(N), aR = new Float32Array(N), vL = new Float32Array(N), vR = new Float32Array(N);
  const rng = mulberry32(2025), white = () => rng() * 2 - 1;
  function bq(type, f, Q = .707) {
    const w = 2 * Math.PI * Math.min(f, SR * .45) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * Q); let b0, b1, b2, a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; } else { b0 = a; b1 = 0; b2 = -a; }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return x => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  }
  function pinkGen(r) { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; return () => { const w = r() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; const o = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362; b6 = w * .115926; return o * .11; }; }
  const panG = p => [Math.cos((clamp(p || 0, -1, 1) + 1) * Math.PI / 4), Math.sin((clamp(p || 0, -1, 1) + 1) * Math.PI / 4)];
  function put(L, R, t, arr, g, pan) { const [gl, gr] = panG(pan); const i0 = Math.round(t * SR); for (let i = 0; i < arr.length; i++) { const k = i0 + i; if (k < 0 || k >= N) continue; L[k] += arr[i] * g * gl; R[k] += arr[i] * g * gr; } }
  const len = s => Math.max(1, Math.round(s * SR));
  const tone = (n, fn) => { const a = new Float32Array(len(n)); for (let i = 0; i < a.length; i++) a[i] = fn(i / SR, i); return a; };
  const FX = {
    snore(o) { // in-breath rasp + soft whistle out
      const lp = bq('lp', 700), bp = bq('bp', 160, 2); let ph = 0;
      return tone(2.6, t => { const inh = t < 1.2 ? Math.sin(Math.PI * t / 1.2) : 0, exh = t > 1.35 ? Math.sin(Math.PI * clamp((t - 1.35) / 1.1)) : 0;
        const buzz = Math.sign(Math.sin(2 * Math.PI * (38 + 6 * Math.sin(t * 9)) * t)) * .5; ph += 2 * Math.PI * (520 + 80 * Math.sin(t * 3)) / SR;
        return bp(lp(white() * .7 + buzz)) * inh * 1.4 + lp(white()) * exh * .5 + Math.sin(ph) * exh * .06; });
    },
    doorbell(o) { const P = [[1318.5, 1], [987.8, .9]]; return tone(1.8, t => { let v = 0; P.forEach(([f, g], i) => { const d = t - i * .38; if (d > 0) v += (Math.sin(2 * Math.PI * f * d) + .35 * Math.sin(2 * Math.PI * f * 2.76 * d) * Math.exp(-d * 6)) * g * Math.exp(-d * 2.4) * Math.min(1, d / .003); }); return v * .4; }); },
    latch(o) { const hp = bq('hp', 1500); return tone(.25, t => hp(white()) * Math.exp(-t / .006) * .9 + Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t / .03) * .3 + (t > .07 ? hp(white()) * Math.exp(-(t - .07) / .008) * .6 : 0)); },
    creak(o) { const d = o.d || 2.4, bp = bq('bp', 900, 6), bp2 = bq('bp', 1700, 8); let ph = 0;
      return tone(d, t => { const f = 70 + 40 * Math.sin(t * 2.1) + 25 * vnoise1(t * 6); ph += 2 * Math.PI * f / SR; const pulse = Math.pow(Math.max(0, Math.sin(ph)), 12); const e = Math.sin(Math.PI * clamp(t / d)) ** .6; return (bp(pulse * 3 + white() * .05) + bp2(pulse * 2) * .6) * e * .7; }); },
    woodstep(o) { const lp = bq('lp', 900), bp = bq('bp', 320, 3); return tone(.22, t => (lp(white()) * Math.exp(-t / .012) * .7 + bp(white()) * Math.exp(-t / .05) * 1.4 + Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t / .04) * .35)); },
    step(o) { return FX.woodstep(o).map(v => v * .8); },
    cuptap(o) { const bp = bq('bp', 1400, 2), hp = bq('hp', 2500); return tone(.35, t => bp(white()) * Math.exp(-t / .012) * 1.2 + Math.sin(2 * Math.PI * 1650 * t) * Math.exp(-t / .05) * .25 + hp(white()) * Math.exp(-t / .003) * .4); },
    rustle(o) { const d = o.d || .5, bp = bq('bp', 3200, .7); let g = 0; return tone(d + .1, t => { if (rng() < .004) g = .4 + rng() * .6; g *= .9993; return bp(white()) * g * Math.sin(Math.PI * clamp(t / d)) * .6; }); },
    land(o) { const lp = bq('lp', 300), bp = bq('bp', 2200, .8); return tone(.3, t => lp(white()) * Math.exp(-t / .05) * 2 + Math.sin(2 * Math.PI * 90 * t) * Math.exp(-t / .06) * .5 + bp(white()) * Math.exp(-t / .03) * .3); },
    plop(o) { let ph = 0; const bp = bq('bp', 900, 1); return tone(.6, t => { ph += 2 * Math.PI * (260 + 500 * Math.exp(-t / .04)) / SR; return Math.sin(ph) * Math.exp(-t / .09) * .7 + bp(white()) * Math.exp(-t / .15) * .5; }); },
    slosh(o) { const bp = bq('bp', 700, .9); return tone(.5, t => bp(white()) * Math.sin(Math.PI * t / .5) * (.6 + .4 * Math.sin(t * 40)) * .9); },
    gulp(o) { let ph = 0; return tone(.22, t => { ph += 2 * Math.PI * (180 + 260 * t) / SR; return Math.sin(ph) * Math.sin(Math.PI * t / .22) * .6; }); },
    cheer(o) { const d = o.d || 2.5, n = len(d), a = new Float32Array(n), r = mulberry32(77);
      for (let v = 0; v < 26; v++) { const f0 = 260 + r() * 420, t0 = r() * .5, dur = .6 + r() * 1.4; let p = 0; const o0 = len(t0); const lp = bq('lp', 1800);
        for (let i = 0; o0 + i < n && i < len(dur); i++) { const t = i / SR, f = f0 * (1 + .15 * Math.sin(t * 7 + v) + .2 * t); p += 2 * Math.PI * f / SR; a[o0 + i] += lp((Math.sin(p) + .5 * Math.sin(2 * p) + .25 * Math.sin(3 * p)) * Math.sin(Math.PI * i / len(dur))) * .05; } }
      const bp = bq('bp', 1500, .5); for (let i = 0; i < n; i++) a[i] += bp(white()) * Math.sin(Math.PI * i / n) * .25; return a; },
    plank(o) { const bp = bq('bp', 260, 2.5), bp2 = bq('bp', 900, 3); return tone(.3, t => bp(white()) * Math.exp(-t / .06) * 1.6 + bp2(white()) * Math.exp(-t / .02) * .5 + Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t / .07) * .4); },
    grass(o) { const bp = bq('bp', 2500, .7), lp = bq('lp', 400); return tone(.18, t => bp(white()) * Math.exp(-t / .035) * .7 + lp(white()) * Math.exp(-t / .03) * .6); },
    patter(o) { const d = o.d || 2, a = new Float32Array(len(d + .3)); for (let k = 0; k * .16 < d; k++) { const s = FX.woodstep({}), off = len(k * .16); for (let i = 0; i < s.length && off + i < a.length; i++) a[off + i] += s[i] * (k % 2 ? .75 : 1); } return a; },
    birds(o) { const d = o.d || 5, a = new Float32Array(len(d)), r = mulberry32(5); for (let k = 0; k < 9; k++) { const t0 = r() * (d - .5), f0 = 2600 + r() * 1500, n = len(.09 + r() * .07); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f0 * (1 + .35 * Math.sin(t * 60)); ph += 2 * Math.PI * f / SR; const k2 = len(t0) + i; if (k2 < a.length) a[k2] += Math.sin(ph) * Math.sin(Math.PI * i / n) * .15; } } return a; },
    paper(o) { const bp = bq('bp', 3500, .8); return tone(.3, t => bp(white()) * Math.exp(-t / .07) * Math.min(1, t / .01) * .9); },
    sting(o) { const fs = [587.3, 880, 1174.7]; return tone(1.4, t => fs.reduce((v, f, i) => v + Math.sin(2 * Math.PI * f * t) * Math.exp(-t * (2.2 + i)) * (i ? .4 : 1), 0) * Math.min(1, t / .004) * .35); },
    cloth(o) { const d = o.d || .5, lp = bq('lp', 1800), bp = bq('bp', 700, .6); let g = 0; return tone(d + .1, t => { if (rng() < .002) g = .5 + rng() * .5; g *= .9996; return (lp(white()) * .7 + bp(white()) * .5) * (.35 + g * .65) * Math.sin(Math.PI * clamp(t / d)) * .5; }); },
    whoosh(o) { let bp = bq('bp', 400, .8); return tone(.6, (t, i) => { if (i % 256 === 0) bp = bq('bp', 400 + 1600 * t / .6, .8); return bp(white()) * Math.sin(Math.PI * t / .6) * .8; }); },
    tick(o) { const bp = bq('bp', 3000, 3); return tone(.08, t => bp(white()) * Math.exp(-t / .006) * 1.2); },
    clasp(o) { const bp = bq('bp', 2500, 4), hp = bq('hp', 3000); return tone(.5, t => bp(white()) * Math.exp(-t / .004) * 1.5 + Math.sin(2 * Math.PI * 3150 * t) * Math.exp(-t / .09) * .35 + Math.sin(2 * Math.PI * 4720 * t) * Math.exp(-t / .05) * .2 + (t > .03 ? hp(white()) * Math.exp(-(t - .03) / .003) * .8 : 0)); },
    tap(o) { const lp = bq('lp', 260); return tone(.25, t => lp(white()) * Math.exp(-t / .05) * 2 + Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t / .05) * .5); },
    doorclose(o) { const lp = bq('lp', 300); return tone(.5, t => lp(white()) * Math.exp(-t / .06) * 2.5 + Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t / .08) * .6); },
    busstep(o) { const bp = bq('bp', 600, 2); return tone(.3, t => bp(white()) * Math.exp(-t / .03) * 1.4 + Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / .05) * .4); },
    tink(o) { return tone(.6, t => (Math.sin(2 * Math.PI * 2650 * t) + .5 * Math.sin(2 * Math.PI * 6900 * t)) * Math.exp(-t / .12) * Math.min(1, t / .002) * .3); },
    busdoor(o) { const bp = bq('bp', 2500, .7), lp = bq('lp', 200); return tone(1.0, t => bp(white()) * Math.exp(-t / .25) * Math.min(1, t / .01) * .9 + (t > .55 ? lp(white()) * Math.exp(-(t - .55) / .05) * 2 : 0)); },
    busaway(o) { const d = o.d || 4.5, lp = bq('lp', 240); let ph = 0; return tone(d, t => { const f = 42 + 18 * t / d; ph += 2 * Math.PI * f / SR; const e = Math.min(1, t / .4) * Math.exp(-t / (d * .5)); return (lp(white()) * 1.6 + Math.sin(ph) * .4 + Math.sin(ph * 2) * .15) * e; }); },
    twinkle(o) { const a = new Float32Array(len(1)); [[2637, 0], [3520, .07], [3136, .14]].forEach(([f, dt]) => { const o0 = len(dt); for (let i = 0; o0 + i < a.length; i++) { const t = i / SR; a[o0 + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t / .28) * Math.min(1, t / .002) * .22; } }); return a; },
    boing(o) { let ph = 0; return tone(.3, t => { ph += 2 * Math.PI * (380 + 320 * Math.min(1, t / .12)) / SR; return Math.sin(ph) * Math.exp(-t / .07) * .5; }); },
    pour(o) { const d = o.d || 1.2, bp = bq('bp', 1100, 1.4); return tone(d, t => { const e = Math.sin(Math.PI * clamp(t / d)) ** .5; return bp(white()) * e * (.6 + .4 * vnoise1(t * 30)) * .7; }); },
    clink(o) { const f0 = 1850 * (o.f || 1), P = [[1, 1, .7], [2.32, .55, .4], [4.25, .35, .22], [6.63, .2, .12]], hp = bq('hp', 2000); return tone(1.2, t => { let v = 0; for (const [r, g, d] of P) v += Math.sin(2 * Math.PI * f0 * r * t + r) * g * Math.exp(-t / d); return v * Math.min(1, t / .0015) * .35 + hp(white()) * Math.exp(-t / .004) * .3; }); },
    cupclink(o) { return FX.clink({ f: 1.45 }); },
    sip(o) { const bp = bq('bp', 1800, 1.5); return tone(.35, t => bp(white()) * Math.sin(Math.PI * t / .35) * (.5 + .5 * Math.sin(t * 90)) * .6); },
    lampon(o) { return tone(.8, t => (Math.sin(2 * Math.PI * 1568 * t) * .5 + Math.sin(2 * Math.PI * 2349 * t) * .3) * Math.exp(-t / .35) * Math.min(1, t / .01) * .25); },
    fwlaunch(o) { let bp = bq('bp', 800, 3); return tone(1.0, (t, i) => { if (i % 256 === 0) bp = bq('bp', 800 + 2400 * t, 3); return bp(white()) * Math.sin(Math.PI * t) * .5; }); },
    fwboom(o) { const lp = bq('lp', 160), lp2 = bq('lp', 900), r = mulberry32(Math.round((o.at || 1) * 999)); const a = tone(3.0, t => lp(white()) * Math.exp(-t / .5) * Math.min(1, t / .02) * 3.2 + lp2(white()) * Math.exp(-t / .12) * .6);
      for (let k = 0; k < 40; k++) { const o0 = len(.25 + r() * 1.6), g = .05 + r() * .1; for (let i = 0; i < len(.01) && o0 + i < a.length; i++) a[o0 + i] += (r() * 2 - 1) * g * Math.exp(-i / 40); } return a; },
    chime(o) { const f0 = 880, P = [[1, 1, 3.2], [2.0, .4, 1.6], [2.76, .3, 1.0], [5.4, .12, .4]]; return tone(4, t => P.reduce((v, [r, g, d]) => v + Math.sin(2 * Math.PI * f0 * r * t) * g * Math.exp(-t / d), 0) * Math.min(1, t / .004) * .3); },
  };
  // every cue lives in scene time; place it in film time through the edit
  const at = t => t;
  for (const c of CUES) if (c.kind === 'act' && c.sfx) for (const s of c.sfx) { const tn = at(c.t + (s.at || 0)); if (tn != null) put(sL, sR, tn, FX[s.n](s), s.g, s.pan); }
  // footfalls from the walk tracks: one per whole step (both feet planted)
  for (const [id, w] of Object.entries(WALKS)) { let prev = walkN(id, w.keys[0][0]); for (let t = w.keys[0][0]; t <= w.keys[w.keys.length - 1][0] + .01; t += .005) { const n = walkN(id, t); if (Math.floor(n + 1e-6) > Math.floor(prev + 1e-6)) { const tn = at(t); if (tn != null) put(sL, sR, tn, FX[w.snd]({}), w.g * (.85 + .3 * rng()), w.pan); } prev = n; } }
  // voices (mono, centred, gently warmed with a touch of room)
  for (const c of CUES.filter(c => c.kind === 'voice')) {
    const E = ENV[c.id], ratio = E.sr / SR, n = Math.floor(E.pcm.length / ratio), a = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * ratio, j = Math.floor(p), u = p - j; a[i] = lerp(E.pcm[j] || 0, E.pcm[j + 1] || 0, u); }
    const tn = at(c.t); if (tn != null) put(vL, vR, tn, a, (c.g || 1) * .9, 0);
  }
  // ambience beds from 'amb' keys: birds/air, stream, crowd murmur, simmer, night crickets, fireworks
  const AMB = CUES.filter(c => c.kind === 'amb'), KEYS = ['outdoor', 'stream', 'crowd', 'simmer', 'night', 'fw'];
  const level0 = (k, t) => { for (let i = 0; i < AMB.length - 1; i++) { const a = AMB[i], b = AMB[i + 1]; if (t >= a.t && t <= b.t) return lerp(a[k], b[k], (t - a.t) / Math.max(1e-6, b.t - a.t)); } return AMB[AMB.length - 1][k]; };
  const LV = {}; for (const k of KEYS) { LV[k] = new Float32Array(DUR * 100 + 2); for (let i = 0; i < LV[k].length; i++) LV[k][i] = level0(k, i / 100); }
  const level = (k, t) => LV[k][clamp(Math.floor(t * 100), 0, DUR * 100)];
  {
    const pl = pinkGen(mulberry32(7)), pr = pinkGen(mulberry32(8)), outL = bq('bp', 2200, .5), outR = bq('bp', 2300, .5), stL = bq('bp', 900, .6), stR = bq('bp', 1000, .6), st2L = bq('bp', 2600, 1.2), st2R = bq('bp', 2500, 1.2), simL = bq('lp', 380);
    const cr = [bq('bp', 420, 3), bq('bp', 650, 3), bq('bp', 980, 3)], crR = [bq('bp', 450, 3), bq('bp', 700, 3), bq('bp', 1050, 3)];
    for (let i = 0; i < N; i++) {
      const t = i / SR, l = pl(), r = pr();
      const out = level('outdoor', t) * .05 * (.8 + .2 * vnoise1(t * .7)), st = level('stream', t) * .07 * (.75 + .25 * vnoise1(t * 1.3)), sim = level('simmer', t) * .08;
      const crowd = level('crowd', t) * .05, w1 = .5 + .5 * vnoise1(t * 3.1), w2 = .5 + .5 * vnoise1(t * 4.3 + 9), w3 = .5 + .5 * vnoise1(t * 5.7 + 3);
      const cL = cr[0](l) * w1 + cr[1](l) * w2 + cr[2](l) * w3 * .6, cR = crR[0](r) * w2 + crR[1](r) * w3 + crR[2](r) * w1 * .6;
      aL[i] += outL(l) * out * 3 + (stL(l) + st2L(l) * .5) * st * 3 + cL * crowd * 6 + simL(white()) * sim;
      aR[i] += outR(r) * out * 3 + (stR(r) + st2R(r) * .5) * st * 3 + cR * crowd * 6 + simL(white()) * sim;
    }
    const br = mulberry32(55);
    for (let t = 0; t < DUR;) { t += -Math.log(1 - br()) / 7; const lv = level('simmer', t); if (lv <= 0.02) continue; const f = 170 + br() * 260; let p = 0; const a = tone(.08, tt => { p += 2 * Math.PI * f * (1 + 2.5 * tt) / SR; return Math.sin(p) * Math.exp(-tt / .018); }); put(aL, aR, t, a, .08 * lv * (.4 + br() * .6), br() * .6 - .3); }
    for (let t = 0; t < DUR;) { t += -Math.log(1 - br()) / 9; const lv = level('stream', t); if (lv <= 0.05) continue; const f = 500 + br() * 1200, d = .02 + br() * .04; let p = 0; const a = tone(d * 4, tt => { p += 2 * Math.PI * f * (1 + .6 * tt / d) / SR; return Math.sin(p) * Math.exp(-tt / d); }); put(aL, aR, t, a, .035 * lv, br() * 1.4 - .7); }
    for (let t = 0; t < DUR;) { t += -Math.log(1 - br()) / 1.2; const lv = level('outdoor', t); if (lv <= 0.05) continue; put(aL, aR, t, FX.birds({ d: .6 }), .45 * lv, br() * 1.4 - .7); }
    for (let t = 0; t < DUR;) { t += .9 + br() * .5; const lv = level('night', t); if (lv <= 0.05) continue; for (let k = 0; k < 3; k++) { const f = 4200 + br() * 600; const a = tone(.05, tt => Math.sin(2 * Math.PI * f * tt) * Math.sin(Math.PI * tt / .05)); put(aL, aR, t + k * .07, a, .05 * lv, br() * 1.6 - .8); } }
    for (let t = 0; t < DUR;) { t += -Math.log(1 - br()) / 1.6; const lv = level('crowd', t); if (lv <= 0.1) continue; const f0 = 220 + br() * 260; let p = 0; const d = .25 + br() * .3; const a = tone(d, tt => { p += 2 * Math.PI * f0 * (1 + .25 * Math.sin(tt * 18)) / SR; return (Math.sin(p) + .4 * Math.sin(2 * p)) * Math.sin(Math.PI * tt / d) * (.5 + .5 * Math.sin(tt * 30)); }); const lp = bq('lp', 900); put(aL, aR, t, a.map(v => lp(v)), .012 * lv, br() * 1.6 - .8); }
  }
  // music: pads + Karplus–Strong plucks
  const TB = 2048, tri = new Float32Array(TB); for (let i = 0; i < TB; i++) { const x = i / TB * 2 * Math.PI; tri[i] = Math.sin(x) + Math.sin(3 * x) / 9 + Math.sin(2 * x) * .18; }
  const chords = MUSIC.chords.map(([t, n]) => ({ t, notes: n.split(' ') }));
  chords.forEach((c, ci) => {
    const t0 = c.t, t1 = (chords[ci + 1] ? chords[ci + 1].t : DUR) + 1.6, n = len(t1 - t0), last = !chords[ci + 1];
    c.notes.forEach((nm, ni) => { const f = noteFreq(nm); for (const [side, det] of [[-1, .9985], [1, 1.0015]]) {
      const a = new Float32Array(n); let ph = rng() * TB; const inc = f * det * TB / SR, lp = bq('lp', 1300), rel = last ? 4 : 1.6;
      for (let i = 0; i < n; i++) { const t = i / SR, e = Math.min(1, t / 1.5) * (t > (t1 - t0 - rel) ? Math.max(0, (t1 - t0 - t) / rel) : 1); ph += inc; if (ph >= TB) ph -= TB; a[i] = lp(tri[ph | 0]) * e; }
      put(mL, mR, t0, a, .016 * (ni === 0 ? 1.2 : 1), side * .45); } });
  });
  MUSIC.notes.map(([t, n]) => ({ t, n, v: .42 })).forEach((c, k) => {
    const f = noteFreq(c.n), n = len(3), a = new Float32Array(n), D = Math.max(2, Math.round(SR / f)), buf = new Float32Array(D), r = mulberry32(300 + k);
    let prev = 0; for (let i = 0; i < D; i++) { prev = prev * .5 + (r() * 2 - 1) * .5; buf[i] = prev; }
    let idx = 0, ph = 0; const lp = bq('lp', 3600);
    for (let i = 0; i < n; i++) { const t = i / SR, j = (idx + 1) % D, v = buf[idx]; buf[idx] = (v + buf[j]) * .5 * .9965; idx = j; ph += 2 * Math.PI * f / SR; a[i] = lp(v * .9 + Math.sin(ph) * Math.exp(-t / .9) * .35); }
    put(mL, mR, c.t, a, c.v * .14, (k % 3 - 1) * .3);
  });
  // ducking under voices
  for (const c of CUES.filter(c => c.kind === 'voice')) { const tv = newT(c.t); if (tv == null) continue; const i0 = len(tv - .2), i1 = len(tv + ENV[c.id].dur + .3); for (let i = Math.max(0, i0); i < Math.min(N, i1); i++) { const u = Math.min(1, (i - i0) / len(.2), (i1 - i) / len(.3)); const g = 1 - .45 * u; mL[i] *= g; mR[i] *= g; aL[i] *= 1 - .3 * u; aR[i] *= 1 - .3 * u; } }
  // reverb
  const wetL = new Float32Array(N), wetR = new Float32Array(N);
  { const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491].map(x => Math.round(x * sc)), aps = [556, 441, 341].map(x => Math.round(x * sc));
    for (const [out, spread] of [[wetL, 0], [wetR, 23]]) { const cb = combs.map(d => ({ b: new Float32Array(d + spread), i: 0, f: 0 })), ab = aps.map(d => ({ b: new Float32Array(d + spread), i: 0 }));
      for (let i = 0; i < N; i++) { const x = (mL[i] + mR[i]) * .5 + (sL[i] + sR[i]) * .15 + (vL[i] + vR[i]) * .06; let y = 0; for (const c of cb) { const o = c.b[c.i]; c.f = o * .7 + c.f * .3; c.b[c.i] = x + c.f * .82; c.i = (c.i + 1) % c.b.length; y += o; } y *= .16; for (const a of ab) { const o = a.b[a.i]; const v = y + o * .5; a.b[a.i] = v; a.i = (a.i + 1) % a.b.length; y = o - v * .5; } out[i] = y; } } }
  const L = new Float32Array(N), R = new Float32Array(N);
  for (let i = 0; i < N; i++) { const t = i / SR, fade = Math.min(1, t / .6) * Math.min(1, (DUR - t) / 1.5);
    const l = (mL[i] + sL[i] + aL[i] + vL[i] + wetL[i] * .3) * fade * MASTER_GAIN, r = (mR[i] + sR[i] + aR[i] + vR[i] + wetR[i] * .3) * fade * MASTER_GAIN;
    L[i] = Math.tanh(l * 1.1) / 1.1; R[i] = Math.tanh(r * 1.1) / 1.1; }
  _AUDIO = { L, R, SR }; return _AUDIO;
}
function audioWavBase64(from = 0, to = DUR) {
  const a = synthAudio(), i0 = Math.round(from * AUDIO_SR), i1 = Math.round(to * AUDIO_SR), n = i1 - i0, buf = new ArrayBuffer(44 + n * 8), v = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 8, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 3, true); v.setUint16(22, 2, true); v.setUint32(24, AUDIO_SR, true); v.setUint32(28, AUDIO_SR * 8, true); v.setUint16(32, 8, true); v.setUint16(34, 32, true); ws(36, 'data'); v.setUint32(40, n * 8, true);
  for (let i = 0; i < n; i++) { v.setFloat32(44 + i * 8, a.L[i0 + i], true); v.setFloat32(48 + i * 8, a.R[i0 + i], true); }
  const u8 = new Uint8Array(buf); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s);
}
