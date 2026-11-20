// ---------------------------------------------------------------------------
// Watercolor painting helpers and props. All shapes are seeded & deterministic.
// ---------------------------------------------------------------------------
const PAL = {
  sienna: '#7a3f1d', siennaD: '#5a2c12', ink: '#4a2511',
  gold: '#f2c03a', goldD: '#d99a22', goldL: '#f8dc76',
  moss: '#93a24e', mossD: '#6f7f36', mossL: '#bcc57a',
  creek: '#7fb3cc', creekD: '#5b93b3', creekL: '#bfe0ea',
  paper: '#f7ecd8', cream: '#f8efdc',
};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

// ---- tileable fractal value noise (grayscale) -----------------------------
function noiseCanvas(size, seed, octaves = 5, base = 4, contrast = 1) {
  const rng = mulberry32(seed); const c = mkCanvas(size, size); const g = c.getContext('2d');
  const img = g.createImageData(size, size); const acc = new Float32Array(size * size);
  let amp = 1, tot = 0;
  for (let o = 0; o < octaves; o++) {
    const n = base << o; const grid = new Float32Array(n * n); for (let i = 0; i < n * n; i++) grid[i] = rng();
    for (let y = 0; y < size; y++) {
      const fy = y / size * n, iy = Math.floor(fy), ty = fy - iy, uy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < size; x++) {
        const fx = x / size * n, ix = Math.floor(fx), tx = fx - ix, ux = tx * tx * (3 - 2 * tx);
        const a = grid[(iy % n) * n + ix % n], b = grid[(iy % n) * n + (ix + 1) % n];
        const cc = grid[((iy + 1) % n) * n + ix % n], d = grid[((iy + 1) % n) * n + (ix + 1) % n];
        acc[y * size + x] += amp * lerp(lerp(a, b, ux), lerp(cc, d, ux), uy);
      }
    }
    tot += amp; amp *= 0.55;
  }
  for (let i = 0; i < size * size; i++) {
    let v = acc[i] / tot; v = clamp(.5 + (v - .5) * contrast * 2.2); const b = Math.round(v * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
let TEX = null;
function initTextures() {
  if (TEX) return TEX;
  TEX = {};
  TEX.grain = noiseCanvas(256, 11, 6, 4, 1.1);      // pigment granulation
  TEX.bloom = noiseCanvas(512, 23, 4, 2, 1.0);      // big wash variation
  // paper: fine fibre noise + soft blotches, full frame
  const p = mkCanvas(W, H), g = p.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const fine = noiseCanvas(256, 31, 3, 32, 1.4);
  g.globalAlpha = .55; g.fillStyle = g.createPattern(fine, 'repeat'); g.fillRect(0, 0, W, H);
  g.globalAlpha = .5; g.save(); g.scale(4, 4); g.fillStyle = g.createPattern(TEX.bloom, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
  const rng = mulberry32(77); g.globalAlpha = .12; g.strokeStyle = '#7a6040'; g.lineWidth = .6;
  for (let i = 0; i < 900; i++) { const x = rng() * W, y = rng() * H, a = rng() * 6.3, l = 4 + rng() * 14; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + rng() * 3, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.globalAlpha = 1;
  // warm vignette baked in
  const v = g.createRadialGradient(W / 2, H * .48, H * .25, W / 2, H / 2, H * .75);
  v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(160,110,60,.55)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  TEX.paper = p;
  return TEX;
}
function pat(ctx, c, scale = 1, ox = 0, oy = 0) {
  const p = ctx.createPattern(c, 'repeat');
  if (p.setTransform) p.setTransform(new DOMMatrix().translateSelf(ox, oy).scaleSelf(scale, scale));
  return p;
}

// ---- watercolor fill --------------------------------------------------------
// path: Path2D. fill: color/gradient. o: {grain, edge, edgeW, out, outW, bloom}
function wc(ctx, path, fill, o = {}) {
  ctx.save();
  ctx.fillStyle = fill; ctx.fill(path);
  ctx.clip(path);
  if (o.bloom) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.bloom; ctx.fillStyle = pat(ctx, TEX.bloom, o.bloomScale || 1.5, o.seedX || 0, o.seedY || 0); ctx.fillRect(-4000, -4000, 9000, 9000); }
  if (o.grain !== 0) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.grain == null ? .22 : o.grain; ctx.fillStyle = pat(ctx, TEX.grain, o.grainScale || 1, o.seedX || 0, o.seedY || 0); ctx.fillRect(-4000, -4000, 9000, 9000); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (o.edge) { ctx.strokeStyle = o.edge; ctx.globalAlpha = o.edgeA == null ? .45 : o.edgeA; ctx.lineWidth = (o.edgeW || 3) * 2; ctx.lineJoin = 'round'; ctx.stroke(path); }
  ctx.restore();
  if (o.out) { ctx.save(); ctx.strokeStyle = o.out; ctx.globalAlpha = o.outA == null ? .9 : o.outA; ctx.lineWidth = o.outW || 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(path); ctx.restore(); }
}
// smooth closed path through points (Catmull-Rom)
function smoothClosed(pts) {
  const p = new Path2D(), n = pts.length;
  p.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  for (let i = 1; i <= n; i++) { const a = pts[i % n], b = pts[(i + 1) % n]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  p.closePath(); return p;
}
function blob(cx, cy, rx, ry, rng, wob = .12, n = 14, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = 1 + (rng() * 2 - 1) * wob;
    const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return smoothClosed(pts);
}
function ell(cx, cy, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); return p; }

// ---- ginkgo leaf (fan). local: stem end at origin, blade grows toward -y ----
const GINKGO = (() => {
  const p = new Path2D();
  p.moveTo(0, -0.12);
  p.bezierCurveTo(-0.12, -0.25, -0.5, -0.5, -0.56, -0.74);
  p.bezierCurveTo(-0.42, -0.98, -0.16, -1.0, -0.04, -0.86);
  p.lineTo(0, -0.74);
  p.lineTo(0.04, -0.86);
  p.bezierCurveTo(0.16, -1.0, 0.42, -0.98, 0.56, -0.74);
  p.bezierCurveTo(0.5, -0.5, 0.12, -0.25, 0, -0.12);
  p.closePath();
  return p;
})();
function drawGinkgo(ctx, x, y, s, rot, col = PAL.gold, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * (o.flipX ? -1 : 1), s * (o.squash || 1));
  ctx.strokeStyle = o.stemCol || '#a8741e'; ctx.lineWidth = 0.035; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -0.12); ctx.lineTo(0, 0.25); ctx.stroke();
  const gr = ctx.createLinearGradient(0, -1, 0, -0.1);
  gr.addColorStop(0, o.tip || col); gr.addColorStop(1, o.base || shade(col, -0.12));
  ctx.fillStyle = gr; ctx.fill(GINKGO);
  if (o.detail !== false) {
    ctx.globalAlpha = .35; ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = 0.012;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, -0.14); ctx.lineTo(Math.sin(i * .16) * .9, -0.14 - Math.cos(i * .16) * .72); ctx.stroke(); }
    ctx.globalAlpha = .85; ctx.strokeStyle = o.out || '#a86a1c'; ctx.lineWidth = 0.035; ctx.stroke(GINKGO);
  }
  ctx.restore();
}
// color shade: amt -1..1
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}
function flower5(ctx, x, y, r, petal = '#fff8ee', center = '#f2b33a', out = '#b98a5a', rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
    const p = ell(0, -r * .55, r * .38, r * .55);
    ctx.fillStyle = petal; ctx.fill(p); ctx.strokeStyle = out; ctx.globalAlpha = .7; ctx.lineWidth = Math.max(.6, r * .08); ctx.stroke(p); ctx.globalAlpha = 1;
    ctx.restore();
  }
  ctx.fillStyle = center; ctx.beginPath(); ctx.arc(0, 0, r * .25, 0, 7); ctx.fill();
  ctx.restore();
}
function grassBlade(ctx, x, y, h, lean, w, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * .3 + lean * .4, y - h * .6, x + lean, y - h);
  ctx.quadraticCurveTo(x + w * .3 + lean * .4, y - h * .6, x + w, y); ctx.closePath(); ctx.fill();
}
function rock(ctx, x, y, rx, ry, rng, o = {}) {
  const p = blob(x, y, rx, ry, rng, .1, 12);
  const g = ctx.createLinearGradient(x - rx * .5, y - ry, x + rx * .3, y + ry);
  g.addColorStop(0, o.light || '#b9ab95'); g.addColorStop(1, o.dark || '#7c6e5e');
  wc(ctx, p, g, { grain: .35, edge: '#5d4e40', edgeW: Math.max(2, rx * .05), out: PAL.siennaD, outW: Math.max(1.5, rx * .025), outA: .55 });
  if (o.moss !== false) {
    ctx.save(); ctx.clip(p);
    const m = blob(x - rx * .2, y - ry * .85, rx * .7, ry * .35, rng, .25, 10);
    ctx.globalAlpha = .55; ctx.fillStyle = '#8f9d4c'; ctx.fill(m); ctx.restore();
  }
  ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#fff6e0'; ctx.fill(ell(x - rx * .35, y - ry * .45, rx * .28, ry * .12, -.3)); ctx.restore();
}

// ---- props ------------------------------------------------------------------
// wooden coaster slice, centered at (x,y), radius r (ellipse ry = r*.38)
function drawCoaster(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(90,50,20,.22)'; ctx.fill(ell(x, y + r * .16, r * 1.05, r * .4));
  const side = new Path2D(); side.ellipse(x, y + r * .1, r, r * .38, 0, 0, Math.PI); side.lineTo(x - r, y); side.ellipse(x, y, r, r * .38, 0, Math.PI, 0, true); side.closePath();
  wc(ctx, side, '#7b5232', { grain: .3, out: PAL.siennaD, outW: r * .04 });
  const top = ell(x, y, r, r * .38);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#e2b77f'); g.addColorStop(1, '#c48f57');
  wc(ctx, top, g, { grain: .3, edge: '#8a5a2e', edgeW: r * .07, out: PAL.siennaD, outW: r * .04 });
  ctx.strokeStyle = 'rgba(130,80,40,.45)'; ctx.lineWidth = r * .02;
  for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(x + r * .03, y, r * k * .22, r * k * .22 * .38, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
}
// ceramic bowl: (x,y)=center of rim ellipse, w=rim width
function drawBowl(ctx, x, y, w, o = {}) {
  const rw = w / 2, rh = w * .15, bh = w * .42;
  ctx.save();
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(80,45,20,.25)'; ctx.fill(ell(x, y + bh + rh * .2, rw * .75, rh * .45)); }
  const body = new Path2D();
  body.moveTo(x - rw, y); body.bezierCurveTo(x - rw, y + bh * .75, x - rw * .5, y + bh, x - rw * .32, y + bh);
  body.lineTo(x + rw * .32, y + bh); body.bezierCurveTo(x + rw * .5, y + bh, x + rw, y + bh * .75, x + rw, y);
  body.ellipse(x, y, rw, rh, 0, 0, Math.PI, false); body.closePath();
  const g = ctx.createLinearGradient(x - rw, 0, x + rw, 0);
  g.addColorStop(0, '#e9d7bb'); g.addColorStop(.35, '#fbf3e3'); g.addColorStop(1, '#dcc6a6');
  wc(ctx, body, g, { grain: .18, edge: '#b99a73', edgeW: w * .02, out: PAL.sienna, outW: w * .022 });
  // foot ring
  ctx.strokeStyle = PAL.sienna; ctx.globalAlpha = .7; ctx.lineWidth = w * .015; ctx.beginPath(); ctx.ellipse(x, y + bh * .93, rw * .34, rh * .3, 0, 0, Math.PI); ctx.stroke(); ctx.globalAlpha = 1;
  // painted flower
  ctx.save(); ctx.translate(x, y + bh * .45);
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * 1.2566); ctx.fillStyle = '#ee8c86'; ctx.fill(ell(0, -w * .055, w * .045, w * .06)); ctx.restore(); }
  ctx.fillStyle = '#f2b33a'; ctx.beginPath(); ctx.arc(0, 0, w * .025, 0, 7); ctx.fill();
  ctx.fillStyle = '#9aaa55'; ctx.fill(ell(w * .14, w * .03, w * .05, w * .022, .4)); ctx.fill(ell(-w * .14, w * .03, w * .05, w * .022, -.4));
  ctx.restore();
  // rim + broth
  const rim = ell(x, y, rw, rh);
  wc(ctx, rim, '#f6ead6', { grain: .1, out: PAL.sienna, outW: w * .022 });
  const tea = ell(x, y + rh * .12, rw * .84, rh * .72);
  const tg = ctx.createRadialGradient(x - rw * .2, y, 0, x, y, rw); tg.addColorStop(0, '#e6b46a'); tg.addColorStop(1, '#b8792f');
  wc(ctx, tea, tg, { grain: .15, edge: '#9a5e22', edgeW: w * .02 });
  ctx.globalAlpha = .5; ctx.fillStyle = '#fff3d6'; ctx.fill(ell(x - rw * .35, y - rh * .05, rw * .2, rh * .16, -.1)); ctx.globalAlpha = 1;
  ctx.restore();
}
// big floral clay pot. (x,y)=rim center. w = body width
function drawPot(ctx, x, y, w, t) {
  const rw = w / 2, rh = w * .13, bh = w * .5;
  ctx.save();
  ctx.fillStyle = 'rgba(80,45,20,.28)'; ctx.fill(ell(x, y + bh + 4, rw * 1.05, rh * .9));
  // trivet
  drawCoaster(ctx, x, y + bh * .98, rw * 1.02);
  // handles
  for (const s of [-1, 1]) {
    const hp = new Path2D(); hp.ellipse(x + s * rw * 1.02, y + bh * .2, w * .07, w * .05, 0, 0, 7);
    wc(ctx, hp, '#9a5a30', { grain: .3, out: PAL.siennaD, outW: w * .012 });
  }
  const body = new Path2D();
  body.moveTo(x - rw, y); body.bezierCurveTo(x - rw * 1.08, y + bh * .7, x - rw * .7, y + bh, x - rw * .45, y + bh);
  body.lineTo(x + rw * .45, y + bh); body.bezierCurveTo(x + rw * .7, y + bh, x + rw * 1.08, y + bh * .7, x + rw, y);
  body.ellipse(x, y, rw, rh, 0, 0, Math.PI, false); body.closePath();
  const g = ctx.createLinearGradient(x - rw, 0, x + rw, 0);
  g.addColorStop(0, '#8f5229'); g.addColorStop(.38, '#b8743f'); g.addColorStop(1, '#7c4521');
  wc(ctx, body, g, { grain: .35, edge: '#5e3015', edgeW: w * .02, out: PAL.siennaD, outW: w * .014 });
  // cream painted band with flowers
  ctx.save(); ctx.clip(body);
  const band = new Path2D(); band.moveTo(x - rw * 1.1, y + bh * .28); band.bezierCurveTo(x - rw * .5, y + bh * .4, x + rw * .5, y + bh * .4, x + rw * 1.1, y + bh * .28);
  band.lineTo(x + rw * 1.1, y + bh * .7); band.bezierCurveTo(x + rw * .5, y + bh * .82, x - rw * .5, y + bh * .82, x - rw * 1.1, y + bh * .7); band.closePath();
  wc(ctx, band, '#f1dfc0', { grain: .2, edge: '#c9a77a', edgeW: 2 });
  const fl = [[-.62, .52, '#f3a49c'], [-.22, .58, '#fff6ea'], [.2, .58, '#f3a49c'], [.6, .52, '#fff6ea']];
  for (const [fx, fy, c] of fl) {
    ctx.fillStyle = '#93a24e'; ctx.fill(ell(x + fx * rw - w * .05, y + fy * bh + w * .02, w * .04, w * .016, .5)); ctx.fill(ell(x + fx * rw + w * .05, y + fy * bh + w * .02, w * .04, w * .016, -.5));
    flower5(ctx, x + fx * rw, y + fy * bh, w * .05, c, '#f2b33a', '#c07a5a');
  }
  ctx.restore();
  // rim and soup
  const rim = ell(x, y, rw, rh); wc(ctx, rim, '#a8663a', { grain: .3, out: PAL.siennaD, outW: w * .014 });
  const soup = ell(x, y + rh * .08, rw * .9, rh * .75);
  const sg = ctx.createRadialGradient(x - rw * .2, y, 0, x, y, rw); sg.addColorStop(0, '#d79a4e'); sg.addColorStop(1, '#9c5e25');
  wc(ctx, soup, sg, { grain: .25, edge: '#7a4214', edgeW: 3 });
  ctx.save(); ctx.clip(soup);
  const rng = mulberry32(5);
  for (let i = 0; i < 12; i++) {
    const a = rng() * 6.28, r = Math.sqrt(rng()) * .8, bob = Math.sin(t * 2.2 + i) * 1.2;
    const px = x + Math.cos(a) * rw * r, py = y + Math.sin(a) * rh * .7 * r + bob, k = rng();
    if (k < .35) { ctx.fillStyle = '#a3291f'; ctx.fill(ell(px, py, w * .03, w * .02)); ctx.fillStyle = 'rgba(255,200,180,.5)'; ctx.fill(ell(px - w * .008, py - w * .006, w * .01, w * .005)); }
    else if (k < .7) { ctx.fillStyle = '#f2e3c4'; ctx.fill(ell(px, py, w * .035, w * .015)); ctx.strokeStyle = 'rgba(140,100,60,.6)'; ctx.lineWidth = 1; ctx.stroke(ell(px, py, w * .035, w * .015)); }
    else { ctx.fillStyle = '#e25a2a'; ctx.fill(ell(px, py, w * .014, w * .008, a)); }
  }
  // simmer bubbles
  for (let i = 0; i < 9; i++) {
    const ph = (t * .9 + i * .37) % 1, a = hash1(i * 7.1 + Math.floor(t * .9 + i * .37)) * 6.28, r = .2 + .6 * hash1(i * 3.3 + Math.floor(t * .9 + i * .37));
    const px = x + Math.cos(a) * rw * r * .85, py = y + Math.sin(a) * rh * .6 * r;
    ctx.globalAlpha = (1 - ph) * .7; ctx.strokeStyle = '#fff1d0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(px, py, 1.5 + ph * w * .018, 0, 7); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
// steam: soft wisps rising from (x,y). t time, s scale
function drawSteam(ctx, x, y, t, s = 1, o = {}) {
  const n = o.n || 3, h = (o.h || 160) * s, alpha = o.a == null ? .5 : o.a, sp = o.speed || 1;
  ctx.save(); ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const x0 = x + (k - (n - 1) / 2) * 9 * s, seg = 22;
    const breath = .75 + .25 * Math.sin(t * .9 * sp + k * 2.1);
    for (const [lw, la] of [[22, .1], [12, .16], [5, .26]]) {
      for (let i = 0; i < seg; i++) {
        const u0 = i / seg, u1 = (i + 1) / seg;
        const px = u => x0 + Math.sin(u * 4.2 - t * 1.6 * sp + k * 2.3) * (3 + u * 18) * s + Math.sin(u * 1.7 + t * .5 + k) * u * 10 * s;
        const py = u => y - u * h * breath;
        const a = alpha * la * Math.sin(Math.PI * Math.pow(u0, .8)) * (1 - u0 * .35);
        ctx.strokeStyle = `rgba(255,253,246,${a})`; ctx.lineWidth = lw * s * (.6 + u0 * 1.1);
        ctx.beginPath(); ctx.moveTo(px(u0), py(u0)); ctx.lineTo(px(u1), py(u1)); ctx.stroke();
      }
    }
  }
  ctx.restore();
}
function drawLantern(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const glow = .75 + .12 * Math.sin(t * 2.3) + .05 * vnoise1(t * 4);
  const rg = ctx.createRadialGradient(0, -40, 5, 0, -40, 120); rg.addColorStop(0, `rgba(255,214,120,${.55 * glow})`); rg.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = rg; ctx.fillRect(-130, -170, 260, 260);
  ctx.fillStyle = 'rgba(80,45,20,.25)'; ctx.fill(ell(0, 2, 34, 8));
  const base = new Path2D(); base.rect(-26, -14, 52, 14); wc(ctx, base, '#8a5a2e', { out: PAL.siennaD, outW: 2.5 });
  const top = new Path2D(); top.moveTo(-22, -72); top.lineTo(22, -72); top.lineTo(14, -86); top.lineTo(-14, -86); top.closePath(); wc(ctx, top, '#8a5a2e', { out: PAL.siennaD, outW: 2.5 });
  const body = new Path2D(); body.moveTo(-24, -14); body.bezierCurveTo(-36, -30, -36, -56, -24, -72); body.lineTo(24, -72); body.bezierCurveTo(36, -56, 36, -30, 24, -14); body.closePath();
  const bg = ctx.createRadialGradient(0, -43, 3, 0, -43, 34); bg.addColorStop(0, '#fffbe0'); bg.addColorStop(.6, '#ffd877'); bg.addColorStop(1, '#eba640');
  wc(ctx, body, bg, { grain: .12, out: PAL.siennaD, outW: 2.5 });
  ctx.strokeStyle = 'rgba(160,100,40,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -72); ctx.lineTo(0, -14); ctx.moveTo(-12, -71); ctx.quadraticCurveTo(-22, -43, -12, -15); ctx.moveTo(12, -71); ctx.quadraticCurveTo(22, -43, 12, -15); ctx.stroke();
  flower5(ctx, 0, -43, 10, 'rgba(255,255,240,.9)', '#f6b84a', '#d08a3a');
  ctx.strokeStyle = PAL.siennaD; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -92, 9, Math.PI, 0); ctx.stroke();
  ctx.restore();
}
function drawBasket(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(80,45,20,.25)'; ctx.fill(ell(0, 4, 70, 14));
  const rng = mulberry32(9);
  for (let i = 0; i < 9; i++) drawGinkgo(ctx, -45 + i * 11 + rng() * 6, -40 + rng() * 10, 26 + rng() * 6, -0.6 + rng() * 1.2, PAL.gold);
  const b = new Path2D(); b.moveTo(-62, -42); b.lineTo(62, -42); b.lineTo(50, 0); b.lineTo(-50, 0); b.closePath();
  wc(ctx, b, '#c99a5c', { grain: .35, edge: '#94652f', edgeW: 3, out: PAL.siennaD, outW: 2.5 });
  ctx.strokeStyle = 'rgba(120,75,30,.6)'; ctx.lineWidth = 2;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-62 + k * 3, -42 + k * 10.5); ctx.lineTo(62 - k * 3, -42 + k * 10.5); ctx.stroke(); }
  for (let k = -5; k <= 5; k++) { ctx.beginPath(); ctx.moveTo(k * 11, -42); ctx.lineTo(k * 9, 0); ctx.stroke(); }
  ctx.strokeStyle = '#a8763a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -42, 62, 9, 0, Math.PI, 0); ctx.stroke();
  ctx.restore();
}
function drawSparkle(ctx, x, y, s, a, col = '#f2b33a', rot = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 4 * s;
  for (const [ang, l] of [[-0.9, 1], [-0.25, 1.15], [0.45, .9]]) { ctx.beginPath(); ctx.moveTo(Math.sin(ang) * 14 * s, -Math.cos(ang) * 14 * s); ctx.lineTo(Math.sin(ang) * (14 + 16 * l) * s, -Math.cos(ang) * (14 + 16 * l) * s); ctx.stroke(); }
  ctx.restore();
}
