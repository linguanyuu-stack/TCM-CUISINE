// ---------------------------------------------------------------------------
// The picnic world (shots 04–08). One world, one camera. Static paint is
// pre-rendered into parallax layers; characters & props are drawn per frame.
// ---------------------------------------------------------------------------
const PIC = {
  // quilt trapezoid
  qBackY: 1190, qFrontY: 1830, qBackL: 60, qBackR: 1000, qFrontL: -80, qFrontR: 1110,
  seat: { x: 932, y: 1672 }, bowl: { x: 935, y: 1677, w: 70 }, coaster: { x: 935, y: 1703, r: 43 },
  pot: { x: 530, y: 1438, w: 214 }, grass: { x: 1100, y: 1652 }, hide: { x: 1112, y: 1612 },
  lantern: { x: 1012, y: 1548 }, basket: { x: 118, y: 1806 },
};
const qLeft = y => lerp(PIC.qBackL, PIC.qFrontL, (y - PIC.qBackY) / (PIC.qFrontY - PIC.qBackY));
const qRight = y => lerp(PIC.qBackR, PIC.qFrontR, (y - PIC.qBackY) / (PIC.qFrontY - PIC.qBackY));
const LAYERS = {};
const WIDE = { x: 540, y: 1190, z: 1.12 };

function quiltTiles() {
  const S = 96, tiles = {};
  const mk = (name, fn) => { const c = mkCanvas(S, S), g = c.getContext('2d'); fn(g); tiles[name] = c; };
  const ging = (g, base, stripe, n) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); g.fillStyle = stripe;
    for (let i = 0; i < n; i++) { g.globalAlpha = .45; g.fillRect(i * S / n, 0, S / n / 2, S); g.fillRect(0, i * S / n, S, S / n / 2); }
    g.globalAlpha = 1;
  };
  const floral = (g, base, petal, n, seed) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); const r = mulberry32(seed);
    for (let i = 0; i < n; i++) {
      const x = (i % 3) * 32 + 16 + (r() - .5) * 8, y = Math.floor(i / 3) * 32 + 16 + (r() - .5) * 8;
      g.fillStyle = '#9aab5a'; g.beginPath(); g.ellipse(x + 8, y + 5, 5, 2.4, .5, 0, 7); g.fill(); g.beginPath(); g.ellipse(x - 8, y + 5, 5, 2.4, -.5, 0, 7); g.fill();
      flower5(g, x, y, 8, petal, '#f2b33a', 'rgba(170,90,70,.6)', r());
    }
  };
  mk('pink', g => ging(g, '#f6dcd6', '#e59c96', 6));
  mk('red', g => ging(g, '#f3d2cc', '#d8726c', 8));
  mk('green', g => ging(g, '#e7ebcd', '#a4b67a', 6));
  mk('cream', g => floral(g, '#f8eedb', '#ef9b92', 9, 3));
  mk('rose', g => floral(g, '#f1c6be', '#fff3e6', 9, 8));
  mk('butter', g => { g.fillStyle = '#f6e3b4'; g.fillRect(0, 0, S, S); g.strokeStyle = 'rgba(200,150,80,.5)'; g.setLineDash([4, 4]); g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, 12 + i * 24); g.lineTo(S, 12 + i * 24); g.stroke(); } });
  return tiles;
}
function drawQuilt(g) {
  const tiles = quiltTiles(); const R = 6, C = 7;
  const yv = v => PIC.qBackY + (PIC.qFrontY - PIC.qBackY) * Math.pow(v, 1.12);
  const P = (u, v) => { const y = yv(v); return [lerp(qLeft(y), qRight(y), u), y]; };
  const order = ['cream', 'pink', 'green', 'rose', 'red', 'butter', 'cream', 'green', 'pink', 'rose', 'cream', 'red', 'green'];
  const outline = new Path2D(); { const a = P(0, 0), b = P(1, 0), c = P(1, 1), d = P(0, 1); outline.moveTo(...a); outline.lineTo(...b); outline.lineTo(...c); outline.lineTo(...d); outline.closePath(); }
  // shadow under quilt edge
  g.save(); g.fillStyle = 'rgba(70,60,20,.18)'; g.translate(0, 8); g.fill(outline); g.restore();
  let k = 0;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
    const a = P(j / C, i / R), b = P((j + 1) / C, i / R), c = P((j + 1) / C, (i + 1) / R), d = P(j / C, (i + 1) / R);
    const quad = new Path2D(); quad.moveTo(...a); quad.lineTo(...b); quad.lineTo(...c); quad.lineTo(...d); quad.closePath();
    const tile = tiles[order[(i * 5 + j * 3 + (i * j) % 4) % order.length]]; k++;
    g.save(); g.clip(quad);
    const p = g.createPattern(tile, 'repeat');
    // affine: tile (0..96) → a,b,d ; two repeats across a patch for ginghams
    const rep = 1.6;
    const m = new DOMMatrix([(b[0] - a[0]) / 96 / rep, (b[1] - a[1]) / 96 / rep, (d[0] - a[0]) / 96 / rep, (d[1] - a[1]) / 96 / rep, a[0], a[1]]);
    p.setTransform(m); g.fillStyle = p; g.fill(quad);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .2; g.fillStyle = pat(g, TEX.grain, 1.2); g.fill(quad);
    g.globalAlpha = .1; g.fillStyle = pat(g, TEX.bloom, 2.5); g.fill(quad);
    g.restore();
    g.save(); g.strokeStyle = 'rgba(140,80,60,.35)'; g.lineWidth = 2; g.stroke(quad);
    g.strokeStyle = 'rgba(255,250,240,.85)'; g.setLineDash([7, 6]); g.lineWidth = 1.6;
    const inset = (p, q, s) => [lerp(p[0], q[0], s), lerp(p[1], q[1], s)];
    const ce = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
    const ia = inset(a, ce, .07), ib = inset(b, ce, .07), ic = inset(c, ce, .07), id = inset(d, ce, .07);
    g.beginPath(); g.moveTo(...ia); g.lineTo(...ib); g.lineTo(...ic); g.lineTo(...id); g.closePath(); g.stroke(); g.restore();
  }
  // binding
  g.save(); g.lineJoin = 'round'; g.strokeStyle = '#d98d86'; g.lineWidth = 12; g.stroke(outline);
  g.strokeStyle = 'rgba(255,245,235,.8)'; g.setLineDash([8, 7]); g.lineWidth = 1.8; g.stroke(outline); g.setLineDash([]);
  g.strokeStyle = PAL.sienna; g.globalAlpha = .7; g.lineWidth = 2.4;
  g.save(); g.translate(0, 0); g.stroke(outline); g.restore(); g.restore();
}

function buildPicnicLayers() {
  if (LAYERS.picnic) return LAYERS.picnic;
  const L = {};
  // ---------------- far: sky, hills, distant trees, waterfall ----------------
  {
    const R = { x: -260, y: -220, w: 1600, h: 1420 }, s = .75, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d');
    g.scale(s, s); g.translate(-R.x, -R.y); const rng = mulberry32(101);
    const sky = g.createLinearGradient(0, -220, 0, 1100); sky.addColorStop(0, '#b6d3e2'); sky.addColorStop(.45, '#d6e6e6'); sky.addColorStop(.75, '#f2ead4'); sky.addColorStop(1, '#efe2bf');
    g.fillStyle = sky; g.fillRect(R.x, R.y, R.w, R.h);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .12; g.fillStyle = pat(g, TEX.bloom, 3); g.fillRect(R.x, R.y, R.w, R.h); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) { g.globalAlpha = .45; g.fillStyle = '#fffaf0'; g.fill(blob(rng() * 1300 - 100, 220 + rng() * 300, 90 + rng() * 120, 22 + rng() * 18, rng, .25)); }
    g.globalAlpha = 1;
    const ridge = (y0, amp, col, seed, wob) => {
      const r = mulberry32(seed), p = new Path2D(); p.moveTo(R.x, 1300);
      for (let x = R.x; x <= R.x + R.w; x += 40) p.lineTo(x, y0 + Math.sin(x * .004 + seed) * amp + Math.sin(x * .011 + seed * 2) * amp * .35 + r() * wob);
      p.lineTo(R.x + R.w, 1300); p.closePath(); wc(g, p, col, { grain: .2, bloom: .18, edge: shade(col, -.15), edgeW: 6, edgeA: .35 });
    };
    ridge(690, 50, '#a9c0cd', 1, 6); ridge(760, 38, '#9db6b2', 2, 6); ridge(830, 26, '#b9bf86', 3, 4);
    // distant autumn trees
    const tc = ['#e9b84a', '#dd8f3c', '#f1cd62', '#c8a24a', '#b8b25a', '#e7a03e'];
    for (let i = 0; i < 60; i++) {
      const x = R.x + rng() * R.w, y = 820 + rng() * 120 + Math.sin(x * .01) * 10, r = 22 + rng() * 34;
      g.fillStyle = '#6a5030'; g.fillRect(x - 2, y, 4, r * .6);
      wc(g, blob(x, y, r, r * .8, rng, .2, 10), tc[Math.floor(rng() * tc.length)], { grain: .3, edge: '#9a6a2a', edgeW: 3, edgeA: .3 });
    }
    // waterfall (right, back)
    rock(g, 1010, 905, 70, 50, rng, {}); rock(g, 1120, 925, 60, 45, rng, {});
    const fall = new Path2D(); fall.moveTo(1040, 860); fall.lineTo(1085, 860); fall.lineTo(1095, 975); fall.lineTo(1030, 975); fall.closePath();
    wc(g, fall, 'rgba(235,246,250,.9)', { grain: .1 });
    g.strokeStyle = 'rgba(150,195,215,.6)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(1045 + i * 8, 865); g.lineTo(1040 + i * 10, 970); g.stroke(); }
    // far meadow
    const md = new Path2D(); md.moveTo(R.x, 930); for (let x = R.x; x <= R.x + R.w; x += 50) md.lineTo(x, 930 + Math.sin(x * .006) * 14); md.lineTo(R.x + R.w, R.y + R.h); md.lineTo(R.x, R.y + R.h); md.closePath();
    const mg = g.createLinearGradient(0, 920, 0, 1200); mg.addColorStop(0, '#c9c682'); mg.addColorStop(1, '#adb565');
    wc(g, md, mg, { grain: .25, bloom: .15 });
    const cr = new Path2D(); cr.moveTo(1000, 975); cr.bezierCurveTo(1060, 990, 1150, 1000, 1340, 990); cr.lineTo(1340, 1020); cr.bezierCurveTo(1150, 1030, 1020, 1010, 990, 990); cr.closePath();
    wc(g, cr, '#9cc4d4', { grain: .15, edge: '#6f9fb8', edgeW: 2 });
    L.far = { c, R, s, f: .3 };
  }
  // ---------------- mid: ginkgo trees, shrubs ----------------
  {
    const R = { x: -260, y: -240, w: 1600, h: 1480 }, s = 1.1, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d');
    g.scale(s, s); g.translate(-R.x, -R.y); const rng = mulberry32(202);
    // shrubs along far meadow edge
    for (let i = 0; i < 26; i++) {
      const x = R.x + rng() * R.w, y = 1010 + rng() * 70, r = 30 + rng() * 40;
      wc(g, blob(x, y, r, r * .6, rng, .2, 10), ['#c9a947', '#b4ad55', '#e0b14a', '#9fa552'][i % 4], { grain: .3, edge: '#7c6a2a', edgeW: 3, edgeA: .3 });
    }
    // trunk + branches (left tree)
    const trunk = new Path2D(); trunk.moveTo(-90, 1150); trunk.bezierCurveTo(-60, 800, -40, 500, 10, 200); trunk.bezierCurveTo(30, 120, 60, 80, 120, 40); trunk.lineTo(140, 70); trunk.bezierCurveTo(90, 160, 80, 400, 70, 700); trunk.bezierCurveTo(60, 900, 70, 1050, 90, 1150); trunk.closePath();
    const tg = g.createLinearGradient(-90, 0, 90, 0); tg.addColorStop(0, '#6e4a2c'); tg.addColorStop(.5, '#8f6640'); tg.addColorStop(1, '#5c3c22');
    wc(g, trunk, tg, { grain: .4, edge: '#3e2614', edgeW: 4, out: PAL.siennaD, outW: 3, outA: .6 });
    g.strokeStyle = '#6e4a2c'; g.lineCap = 'round';
    const branch = (pts, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(...pts[0]); g.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]); g.stroke(); };
    branch([[30, 390], [200, 290], [380, 310], [560, 260]], 16); branch([[60, 590], [180, 550], [260, 500], [380, 510]], 10);
    branch([[100, 230], [160, 130], [260, 110], [360, 50]], 14);
    // right tree trunk peeking
    const t2 = new Path2D(); t2.moveTo(1200, 1100); t2.bezierCurveTo(1180, 700, 1150, 400, 1120, 100); t2.lineTo(1250, 100); t2.bezierCurveTo(1260, 400, 1290, 800, 1320, 1100); t2.closePath();
    wc(g, t2, '#7a5434', { grain: .4, edge: '#3e2614', edgeW: 4, out: PAL.siennaD, outW: 3, outA: .5 });
    branch([[1150, 430], [1050, 370], [960, 400], [880, 350]], 12);
    // canopies: clusters of ginkgo leaves
    const canopy = (cx, cy, rx, ry, n, seed) => {
      const r = mulberry32(seed);
      for (let i = 0; i < 9; i++) { g.globalAlpha = .55; wc(g, blob(cx + (r() - .5) * rx * 1.4, cy + (r() - .5) * ry * 1.2, rx * (.35 + r() * .3), ry * (.3 + r() * .3), r, .25), ['#f0c64a', '#e8b13a', '#f6d870'][i % 3], { grain: .3, edge: '#c58a22', edgeW: 4, edgeA: .25 }); }
      g.globalAlpha = 1;
      for (let i = 0; i < n; i++) {
        const a = r() * 6.283, d = Math.sqrt(r()); const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
        const col = ['#f4c63c', '#f8d867', '#e9a92c', '#f1bb35', '#fbe28a'][Math.floor(r() * 5)];
        drawGinkgo(g, x, y, 20 + r() * 16, r() * 6.28, col, { detail: r() < .5 });
      }
    };
    g.save(); g.translate(0, 170);
    canopy(90, 40, 360, 230, 520, 7); canopy(420, 120, 220, 110, 220, 8);
    canopy(1120, 40, 300, 220, 420, 9); canopy(870, 170, 130, 70, 90, 10);
    // hanging leaves (fringe)
    for (let i = 0; i < 70; i++) { const x = rng() * 1100 - 100, y = 260 + rng() * 140 * (1 - Math.abs(x - 500) / 700); if (x > 300 && x < 760 && y > 250) continue; drawGinkgo(g, x, y, 18 + rng() * 10, Math.PI + (rng() - .5) * .8, '#f3c544'); }
    g.restore();
    L.mid = { c, R, s, f: .62 };
  }
  // ---------------- ground: meadow, quilt, creek ----------------
  {
    const R = { x: -260, y: 1040, w: 1600, h: 1180 }, s = 2.4, c = mkCanvas(R.w * s, R.h * s), g = c.getContext('2d');
    g.scale(s, s); g.translate(-R.x, -R.y); const rng = mulberry32(303);
    const mg = g.createLinearGradient(0, 1040, 0, 1900); mg.addColorStop(0, '#bfc178'); mg.addColorStop(.5, '#a9b462'); mg.addColorStop(1, '#93a453');
    g.fillStyle = mg; g.fillRect(R.x, R.y, R.w, R.h);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .25; g.fillStyle = pat(g, TEX.bloom, 2); g.fillRect(R.x, R.y, R.w, R.h); g.globalAlpha = .2; g.fillStyle = pat(g, TEX.grain, 1); g.fillRect(R.x, R.y, R.w, R.h);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // fade top edge into the far layers
    // grass texture strokes
    for (let i = 0; i < 4200; i++) {
      const x = R.x + rng() * R.w, y = 1060 + rng() * 820; const d = (y - 1040) / 800;
      grassBlade(g, x, y, 8 + d * 22 * (.6 + rng() * .6), (rng() - .5) * 10, 1 + d * 1.6, ['#8c9e4c', '#b6b864', '#7b8e40', '#c7b85a', '#a0a955'][Math.floor(rng() * 5)]);
    }
    for (let i = 0; i < 160; i++) { const x = R.x + rng() * R.w, y = 1080 + rng() * 780; flower5(g, x, y, 3 + (y - 1040) / 800 * 6, rng() < .7 ? '#fffaf0' : '#f6c96a', '#f2b33a', 'rgba(150,120,70,.6)', rng() * 6); }
    for (let i = 0; i < 90; i++) { const x = R.x + rng() * R.w, y = 1080 + rng() * 780; drawGinkgo(g, x, y, 10 + (y - 1040) / 800 * 16, rng() * 6.28, '#f2c03a', { squash: .55 }); }
    drawQuilt(g);
    // leaves fallen on the quilt
    for (let i = 0; i < 16; i++) { const y = PIC.qBackY + 40 + rng() * 560, x = lerp(qLeft(y), qRight(y), .05 + rng() * .9); if (Math.hypot(x - PIC.seat.x, y - PIC.seat.y) < 120) continue; drawGinkgo(g, x, y, 14 + rng() * 8, rng() * 6.28, '#f2c03a', { squash: .6 }); }
    // grass tufts along quilt front edge
    for (let i = 0; i < 260; i++) { const x = -260 + rng() * 1600, y = 1838 + rng() * 26; grassBlade(g, x, y, 14 + rng() * 22, (rng() - .5) * 14, 2.4, ['#8c9e4c', '#7b8e40', '#a9b05a'][i % 3]); }
    // creek (front)
    const ck = new Path2D(); ck.moveTo(R.x, 1905); for (let x = R.x; x <= R.x + R.w; x += 40) ck.lineTo(x, 1890 + Math.sin(x * .008) * 12 + rng() * 4); ck.lineTo(R.x + R.w, 2230); ck.lineTo(R.x, 2230); ck.closePath();
    const cg = g.createLinearGradient(0, 1880, 0, 2200); cg.addColorStop(0, '#9cc8d8'); cg.addColorStop(1, '#5f98b6');
    wc(g, ck, cg, { grain: .2, bloom: .2, edge: '#4f86a6', edgeW: 4, edgeA: .4 });
    g.save(); g.clip(ck); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const x = R.x + rng() * R.w, y = 1910 + rng() * 280, l = 20 + rng() * 60; g.lineWidth = 1.5 + rng() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); }
    g.restore();
    for (let i = 0; i < 16; i++) { const x = R.x + i * 105 + rng() * 40, y = 1900 + rng() * 16; rock(g, x, y, 38 + rng() * 30, 22 + rng() * 12, rng, { moss: rng() < .6 }); }
    for (let i = 0; i < 6; i++) { const x = R.x + 100 + rng() * 1400, y = 2040 + rng() * 120; rock(g, x, y, 50 + rng() * 40, 30 + rng() * 14, rng, {}); }
    // soften top edge (alpha fade)
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 0, 0, 160 * s); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fade; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over';
    L.ground = { c, R, s, f: 1 };
  }
  // blurred copies for depth of field
  for (const k of ['far', 'mid']) {
    const l = L[k], b = mkCanvas(l.c.width, l.c.height), g = b.getContext('2d');
    g.filter = `blur(${k === 'far' ? 5 : 4}px)`; g.drawImage(l.c, 0, 0); l.blur = b;
  }
  LAYERS.picnic = L; return L;
}

// ---- camera -------------------------------------------------------------------
// cam = {x, y, z}: world point at screen centre and zoom
function picnicCam(t) {
  const K = [
    // shot 04: slow push across the picnic
    [20.0, 660, 1500, 1.42], [28.0, 690, 1510, 1.52],
    // shot 05: hold on the bowl, a gentle drift toward the grass
    [28.0, 965, 1612, 2.9], [37.0, 985, 1606, 2.95],
    // shot 06
    [37.0, 842, 1592, 2.08], [46.0, 852, 1592, 2.14],
  ];
  if (t < 28) { const a = K[0], b = K[1], u = ease((t - a[0]) / (b[0] - a[0])); return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) }; }
  if (t < 37) { const a = K[2], b = K[3], u = ease((t - a[0]) / (b[0] - a[0])); return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) }; }
  if (t < 46) { const a = K[4], b = K[5], u = ease((t - a[0]) / (b[0] - a[0])); return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) }; }
  if (t < 54) {
    // shot 07: close on 豆豆 → follow steam up → pull back to the wide
    const s0 = { x: 935, y: 1590, z: 3.0 };
    const drift = { x: 935, y: 1584, z: 3.08 };
    const u0 = clamp((t - 46) / 4.8);
    let c = { x: lerp(s0.x, drift.x, u0), y: lerp(s0.y, drift.y, u0), z: lerp(s0.z, drift.z, u0) };
    const us = ease(prog('cam.steam', t)); // tilt up with the steam
    c = { x: c.x, y: c.y - us * 150, z: c.z };
    const up = prog('cam.pull', t), e = ease(up);
    // zoom in log-space so the pull-back feels even
    const z = Math.exp(lerp(Math.log(c.z), Math.log(WIDE.z), e));
    return { x: lerp(c.x, WIDE.x, e), y: lerp(c.y, WIDE.y, e), z };
  }
  // shot 08: hold wide with a whisper of drift
  const u = clamp((t - 54) / 6);
  return { x: WIDE.x, y: WIDE.y - u * 6, z: WIDE.z + u * .015 };
}
function layerTransform(ctx, cam, f) {
  const zf = 1 + (cam.z - 1) * f, cx = 540 + (cam.x - 540) * f, cy = 960 + (cam.y - 960) * f;
  ctx.setTransform(zf, 0, 0, zf, W / 2 - cx * zf, H / 2 - cy * zf);
  return zf;
}
function drawLayer(ctx, cam, l, blurMix = 0) {
  layerTransform(ctx, cam, l.f);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(l.c, l.R.x, l.R.y, l.R.w, l.R.h);
  if (blurMix > 0 && l.blur) { ctx.globalAlpha = blurMix; ctx.drawImage(l.blur, l.R.x, l.R.y, l.R.w, l.R.h); ctx.globalAlpha = 1; }
}

// ---- characters over time --------------------------------------------------------
function wuState(t) {
  const shift = ease(prog('w.shift', t));
  const hop = Math.abs(Math.sin(prog('w.shift', t) * Math.PI * 2)) * (prog('w.shift', t) > 0 && prog('w.shift', t) < 1 ? 1 : 0);
  let x = lerp(738, 698, shift), lift = hop * 10, sq = -hop * .04 + (t > 37 && t < 54 ? .01 * Math.sin(t * 2.1) : .012 * Math.sin(t * 2.1));
  // arm: rest raised (-0.6) → reach (+1.05, long) → two pats → rest
  const reach = ease(prog('w.reach', t)), rest = ease(prog('w.rest', t));
  const pat = p => p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;
  const p1 = pat(prog('w.pat1', t)), p2 = pat(prog('w.pat2', t));
  const lift2 = (p1 + p2); // paw lifts between pats
  let arm = lerp(-0.6, 1.02, reach), len = lerp(1, 1.62, reach), lean = lerp(0, .2, reach);
  arm -= lift2 * .3; lean -= lift2 * .03;
  arm = lerp(arm, -0.6, rest); len = lerp(len, 1, rest); lean = lerp(lean, 0, rest);
  // final shot: cheer arm gently waves
  if (t > 52) arm += Math.sin((t - 52) * 2.4) * .12 * smooth(52, 53.5, t);
  return { x, y: 1655, h: 228, pose: { arm, len, lean, sq, lift } };
}
function douState(t) {
  const st = { blanket: 0, eyes: 'open', mouth: 'smile', sit: 0, lean: 0, sq: 0, lift: 0 };
  let x = PIC.hide.x, y = PIC.hide.y; const h = 165;
  // 05: hidden → peek out from behind the grass
  const peek = ease(prog('b.peek', t)), hide = ease(prog('b.hide', t));
  let pk = peek * (1 - hide * .45);
  x = PIC.hide.x - pk * 50; st.lean = -pk * .14; st.lift = -(1 - pk) * 95; st.hidden = t < ACT['b.step'].t;
  if (t >= 33.6 && t < 35.5) { st.eyesK = 0; }
  // 06: step forward to the seat and sit
  const step = prog('b.step', t), sit = ease(prog('b.sit', t));
  if (t >= ACT['b.step'].t) {
    const e = ease(step);
    const sx = PIC.hide.x - 50 * .55, sy = PIC.hide.y;
    x = lerp(sx, PIC.seat.x, e); y = lerp(sy, PIC.seat.y, e);
    st.walk = step < 1 ? step * 3 : null; st.lift = step < 1 ? Math.abs(Math.sin(step * Math.PI * 3)) * 9 : 0;
    st.lean = lerp(-.06, 0, e) + (step < 1 ? Math.sin(step * Math.PI * 6) * .05 : 0);
  }
  if (t >= ACT['b.sit'].t) { st.sit = sit; st.sq = hump(prog('b.sit', t)) * .09 + sit * .03; st.walk = null; st.lift = 0; }
  // 07: blanket loosens into the lap, then two-hand bowl pickup
  const lo = ease(prog('b.loosen', t)); st.blanket = lo;
  const c = douBlanketCorners(lo);
  let hands = [[c.tl[0] + .03, c.tl[1] + .01], [c.tr[0] - .03, c.tr[1] + .01]];
  const reach = ease(prog('b.reach', t)), lift = ease(prog('b.lift', t));
  st.bowl = null;
  if (t >= ACT['b.reach'].t) {
    // bowl position in world: on coaster until lift, then up to the chest
    const B = PIC.bowl; const chest = douToWorld(x, y, h, st, -0.03, -0.36);
    const bx = lerp(B.x, chest[0], lift), by = lerp(B.y, chest[1], lift) - hump(lift) * 8;
    st.bowl = { x: bx, y: by };
    st.sq += reach * (1 - lift) * .06; // bends toward the bowl
    const lb = worldToDou(x, y, h, st, bx - B.w * .46, by + B.w * .2), rb = worldToDou(x, y, h, st, bx + B.w * .46, by + B.w * .2);
    hands = [[lerp(hands[0][0], lb[0], reach), lerp(hands[0][1], lb[1], reach)], [lerp(hands[1][0], rb[0], reach), lerp(hands[1][1], rb[1], reach)]];
  }
  st.hands = hands;
  const sm = ease(prog('b.smile', t));
  if (sm > 0) { st.eyesK = sm; st.mouthK = sm; st.blush = sm; }
  if (t > 51 && t < 54) { st.lift = 0; }
  st.sq += (t > 44.3 ? .01 * Math.sin(t * 2.4) : 0);
  return { x, y, h, st };
}

// list of drawables for the picnic at time t
function picnicDrawables(t) {
  const D = [], add = (y, fn, tag) => D.push({ y, fn, tag });
  const breathe = (ph, a = .012) => a * Math.sin(t * 2.0 + ph);
  const in04 = t < 28;
  // pot + 耆耆 (always)
  const stir = Math.sin(t * 3.1);
  add(1495, ctx => drawSprite(ctx, 'qi2_stir', 440, 1495, 255, { rot: stir * .035, sy: 1 + breathe(1, .01), pivotX: 0 }), 'qi2');
  add(1545, ctx => { drawPot(ctx, PIC.pot.x, PIC.pot.y, PIC.pot.w, t); }, 'pot');
  add(1546, ctx => drawSteam(ctx, PIC.pot.x, PIC.pot.y - 6, t, 1.5, { n: 4, h: 260, a: .6, speed: .7 }), 'potsteam');
  // coaster + bowl
  add(PIC.coaster.y, ctx => drawCoaster(ctx, PIC.coaster.x, PIC.coaster.y, PIC.coaster.r), 'coaster');
  const bowlSet = prog('z.set', t);
  const ds = douState(t);
  if (in04) {
    // 棗棗 walks in with the bowl and sets it at the empty seat
    const wk = prog('z.walk', t), e = ease(wk);
    const zx = lerp(1250, 1015, e), zy = lerp(1650, 1690, e);
    const bob = wk > 0 && wk < 1 ? Math.abs(Math.sin(wk * Math.PI * 4)) * 8 : 0;
    const dip = hump(bowlSet) * .05;
    const holding = bowlSet < .62;
    add(zy, ctx => drawSprite(ctx, holding ? 'zao_cup' : 'zao_wave', zx, zy, 215, { lift: bob, flip: true, sy: 1 - dip, sx: 1 + dip * .5 }), 'zao');
    if (t >= ACT['z.walk'].t) {
      // bowl carried in her hands (local offset), then lowered onto the coaster
      const hx = zx - 40, hy = zy - 100 - bob;
      const u = smooth(.15, .92, bowlSet);
      const bx = lerp(hx, PIC.bowl.x, u), by = lerp(hy, PIC.bowl.y, u) - hump(u) * 18;
      add(Math.max(zy + 1, PIC.coaster.y + 1), ctx => { drawBowl(ctx, bx, by, PIC.bowl.w, { shadow: u > .9 }); if (bowlSet >= 1) drawSteam(ctx, PIC.bowl.x, PIC.bowl.y - 4, t, .55, { n: 2, h: 130, a: .5 }); }, 'bowl');
    }
    // 杞杞 runs in and jumps
    const rn = prog('k.run', t), jp = prog('k.jump', t);
    const kx = lerp(80, 400, easeOut(rn)), ky = 1765;
    const jumping = t >= ACT['k.jump'].t;
    add(ky, ctx => drawSprite(ctx, jumping ? 'qi_jump' : 'qi_run', kx, ky, jumping ? 190 : 200, { lift: jumping ? hump(jp) * 45 : Math.abs(Math.sin(rn * Math.PI * 7)) * 12 * (rn < 1 ? 1 : 0), sy: jumping ? 1 + hump(jp) * .05 : 1 }), 'qi');
    // 地地 straightens the quilt: pushes a wrinkle out along the front edge
    const tg = prog('d.tug', t);
    const dx = lerp(360, 520, ease(tg)), dlean = Math.sin(tg * Math.PI * 2) * .06;
    add(1846, ctx => {
      const wx = lerp(470, 640, ease(tg)), amp = (1 - ease(tg)) * 1;
      if (amp > .02) { // wrinkle ridge on the quilt
        ctx.save(); ctx.globalAlpha = amp; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(120,60,50,.35)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(wx - 50, 1822); ctx.quadraticCurveTo(wx, 1770, wx + 40, 1700); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,235,.75)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(wx - 56, 1818); ctx.quadraticCurveTo(wx - 6, 1766, wx + 34, 1697); ctx.stroke(); ctx.restore();
      }
      drawSprite(ctx, 'di_yawn', dx, 1846, 160, { rot: dlean, sy: 1 + breathe(2, .012) });
    }, 'di');
  } else {
    // ---- shots 05–08: everyone in place ----
    add(1268, ctx => drawSprite(ctx, 'shan', 180, 1268, 232, { sy: 1 + breathe(0), rot: Math.sin(t * 1.3) * .015 }), 'shan');
    add(1250, ctx => drawSprite(ctx, 'gui_cup', 415, 1250, 245, { sy: 1 + breathe(1.5) }), 'gui');
    add(1258, ctx => drawSprite(ctx, 'zao_cup', 652, 1258, 205, { sy: 1 + breathe(3) }), 'zao');
    add(1292, ctx => drawSprite(ctx, 'ma_cheer', 872, 1292, 262, { sy: 1 + breathe(4.2, .015), rot: Math.sin(t * 1.7) * .02 }), 'ma');
    add(1500, ctx => drawSprite(ctx, 'di_sleep', 178, 1500, 148, { sy: 1 + .025 * Math.sin(t * 1.4) }), 'di');
    add(1765, ctx => drawSprite(ctx, 'qi_jump', 280, 1765, 188, { lift: 8 + Math.abs(Math.sin(t * 2.6)) * 10, sy: 1 + breathe(2, .02) }), 'qi');
    // bowl (on coaster unless 豆豆 holds it)
    if (!ds.st.bowl) add(PIC.coaster.y + 1, ctx => { drawBowl(ctx, PIC.bowl.x, PIC.bowl.y, PIC.bowl.w); drawSteam(ctx, PIC.bowl.x, PIC.bowl.y - 4, t, .62, { n: 2, h: 140, a: .55 }); }, 'bowl');
    // 烏烏
    const wu = wuState(t);
    add(wu.y, ctx => drawWu(ctx, wu.x, wu.y, wu.h, wu.pose), 'wu');
    // quilt dimples where 烏烏 pats
    for (const id of ['w.pat1', 'w.pat2']) {
      const c = ACT[id], tt = t - (c.t + c.d * .5);
      if (tt > 0 && tt < .7) add(1600, ctx => { const f = wuFist(wu.x, wu.y, wu.h, wu.pose); ctx.save(); ctx.globalAlpha = (1 - tt / .7) * .6; ctx.strokeStyle = '#fff5e6'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(f[0], f[1] + 14, 18 + tt * 50, (18 + tt * 50) * .32, 0, 0, 7); ctx.stroke(); ctx.restore(); }, 'dimple');
    }
    // 豆豆 + held bowl + hands
    add(ds.y, ctx => {
      ctx.save(); if (ds.st.hidden) { ctx.beginPath(); ctx.rect(-5000, -5000, 10000, 5000 + PIC.grass.y - 6); ctx.clip(); }
      drawDouBody(ctx, ds.x, ds.y, ds.h, ds.st); ctx.restore();
      if (ds.st.bowl) { drawBowl(ctx, ds.st.bowl.x, ds.st.bowl.y, PIC.bowl.w, { shadow: false }); }
      drawDouHands(ctx, ds.x, ds.y, ds.h, ds.st);
      if (ds.st.bowl) drawSteam(ctx, ds.st.bowl.x, ds.st.bowl.y - 4, t, .62, { n: 2, h: 150, a: .58 });
      // noticing marks
      const nt = prog('b.notice', t); if (nt > 0 && nt < 1) drawSparkle(ctx, ds.x + 62, ds.y - ds.h * 1.02, .9, hump(nt), '#f2b33a', .2);
      const sm = prog('b.smile', t); if (sm > 0 && t < 51.5) drawSparkle(ctx, ds.x + 70, ds.y - ds.h * 1.05, .9, hump(clamp(sm * 1.2)) , '#f2b33a', .2);
    }, 'dou');
    if (ds.st.bowl && Math.abs(ds.st.bowl.y - PIC.bowl.y) < 1 && Math.abs(ds.st.bowl.x - PIC.bowl.x) < 1) { /* still on the coaster */ }
  }
  // grass clump (hiding place) — in front of the hiding spot
  add(PIC.grass.y, ctx => drawGrassClump(ctx, PIC.grass.x, PIC.grass.y, t), 'grass');
  add(PIC.lantern.y, ctx => drawLantern(ctx, PIC.lantern.x, PIC.lantern.y, .85, t), 'lantern');
  add(PIC.basket.y, ctx => drawBasket(ctx, PIC.basket.x, PIC.basket.y, .95), 'basket');
  D.sort((a, b) => a.y - b.y);
  return D;
}
function drawGrassClump(ctx, x, y, t) {
  const r = mulberry32(44); const rustle = hump(prog('b.peek', t)) + hump(prog('b.step', t) * 2) * .8;
  for (let i = 0; i < 70; i++) {
    const bx = x + (r() - .5) * 130, hh = 150 + r() * 150, lean = (r() - .5) * 70 + Math.sin(t * 1.3 + i) * 5 + rustle * Math.sin(t * 18 + i) * 10 - (bx < x ? 20 : -10);
    grassBlade(ctx, bx, y + r() * 10, hh, lean, 5 + r() * 4, ['#9aa451', '#b5ad5a', '#86934a', '#c4b062', '#7d8a42'][i % 5]);
  }
  for (let i = 0; i < 4; i++) drawGinkgo(ctx, x - 40 + i * 28, y + 4, 18, r() * 6.3, PAL.gold, { squash: .6 });
}

// falling leaves over the picnic (seeded, a function of t)
function fallingLeaves(ctx, t, n, seed, area, scale = 1) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const period = 9 + r() * 7, ph = r(), x0 = area.x + r() * area.w, sz = (16 + r() * 14) * scale, spin = (r() - .5) * 3;
    const u = ((t / period + ph) % 1);
    const y = area.y + u * area.h, x = x0 + Math.sin(t * .9 + i) * 40 * scale + u * 60 * scale;
    const flip = Math.cos(t * 2.2 + i * 1.7);
    drawGinkgo(ctx, x, y, sz, t * spin + i, ['#f4c63c', '#f8d867', '#e9a92c'][i % 3], { squash: .4 + .6 * Math.abs(flip) });
  }
}

function renderPicnic(ctx, t) {
  const L = buildPicnicLayers(); const cam = picnicCam(t);
  const dof = clamp((cam.z - 1.45) / 1.2);           // 0 wide … 1 close-up
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#efe2bf'; ctx.fillRect(0, 0, W, H);
  drawLayer(ctx, cam, L.far, dof); drawLayer(ctx, cam, L.mid, dof);
  // leaves drifting in the middle distance
  layerTransform(ctx, cam, .75); fallingLeaves(ctx, t, 10, 91, { x: -100, y: 150, w: 1200, h: 1100 }, .8);
  drawLayer(ctx, cam, L.ground, 0);
  // drawables, with depth of field for things behind the focus plane
  const D = picnicDrawables(t);
  const focusY = t < 28 ? 0 : (t < 37 ? 1650 : 1640);
  const blurPx = dof * 7;
  const behind = D.filter(d => d.y < focusY - 90), front = D.filter(d => d.y >= focusY - 90);
  layerTransform(ctx, cam, 1); for (const d of behind) d.fn(ctx);
  if (blurPx > .5) {
    // depth of field: a blurred copy of the ground + everything behind the focus
    // plane, faded in above the focus line (picture-book tilt-shift)
    const buf = getBuf('dof'), g = buf.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    drawLayer(g, cam, L.ground, 0);
    layerTransform(g, cam, 1); for (const d of behind) d.fn(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sy = wy => (wy - cam.y) * cam.z + H / 2;
    const m = g.createLinearGradient(0, sy(focusY - 230), 0, sy(focusY - 70));
    m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${blurPx.toFixed(2)}px)`; ctx.drawImage(buf, 0, 0); ctx.filter = 'none';
  }
  layerTransform(ctx, cam, 1); for (const d of front) d.fn(ctx);
  // creek shimmer
  layerTransform(ctx, cam, 1); creekShimmer(ctx, t, { x: -260, y: 1905, w: 1600, h: 300 }, 33);
  // foreground leaves
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (dof < .5) { layerTransform(ctx, cam, 1.05); fallingLeaves(ctx, t + 3, 5, 92, { x: -100, y: 0, w: 1250, h: 1950 }, 1.1); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return cam;
}
const BUFS = {};
function getBuf(k) { if (!BUFS[k]) BUFS[k] = mkCanvas(W, H); return BUFS[k]; }
function creekShimmer(ctx, t, R, seed) {
  const r = mulberry32(seed); ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x0 = R.x + r() * R.w, y = R.y + 20 + r() * (R.h - 30), sp = 20 + r() * 30, l = 18 + r() * 40, ph = r() * 10;
    const x = R.x + ((x0 - R.x + t * sp) % R.w);
    ctx.globalAlpha = .35 + .3 * Math.sin(t * 2 + ph); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 2, x + l, y); ctx.stroke();
  }
  ctx.restore();
}
