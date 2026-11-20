// Kit: helpers shared with the earlier hot pot film (extracted verbatim).
const CACHE = {};
let QT = null;
const HIP = { wu: 62, gui: 42, qi: 26, ma: 50, zao: 46, shan: 36, qi2: 40, dou: 30 };
const face = (open = 1, lx = 0, ly = 0, style = 'n') => ({ open, lx, ly, style });
function cached(key, w, h, fn) { if (!CACHE[key]) { const c = mkCanvas(w, h), g = c.getContext('2d'); fn(g); CACHE[key] = c; } return CACHE[key]; }
function mkProj(CX, CY, F) { return (X, Y, Z) => { const s = F / (F + Z); return [CX + (X - CX) * s, CY + (Y - CY) * s, s]; }; }
function blinkAt(t, seed, period = 3.6) { const ph = ((t + hash1(seed) * period) % period) / period; const d = ph * period; return d < .14 ? Math.sin(d / .14 * Math.PI) : 0; }
function plaster(g, x, y, w, h, c1, c2, seed) { const p = new Path2D(); p.rect(x, y, w, h); const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); wc(g, p, gr, { grain: .25, bloom: .2, seedX: seed }); }
function setCam(ctx, z, cx, cy) { ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z); }
function walkPose(who, P, n, dir, moving, o = {}) {
  const k = P.k, h = HIP[who] * (o.stride || 1), Ls = 2 * h * k, s = n * Ls, g = gait(s, Ls, (o.lift || 24) * k);
  P.x += dir * s;
  const fA = [dir * g.A.dx / k, -g.A.lift / k], fB = [dir * g.B.dx / k, -g.B.lift / k];
  P.feet = dir > 0 ? { R: fA, L: fB } : { L: fA, R: fB };
  if (moving) { P.lift = (P.lift || 0) + g.bob * (o.bob || 7); P.lean = (P.lean || 0) + g.sway * .035 + dir * .04; P.sq = (P.sq || 0) + g.contact * .045; P.armSwing = g.swing * dir; P.sway = g.sway; }
  return P;
}
function idle(P, t, seed, o = {}) { P.sq = (P.sq || 0) + .012 * Math.sin(t * 2 + seed); P.eye = P.eye || face(); if (P.eye.style !== 'happy' && P.eye.style !== 'closed') P.eye.open = (P.eye.open == null ? 1 : P.eye.open) * (1 - blinkAt(t, seed)); P.tt = t; return P; }
function paintSky(g, y0, y1, cols) { const gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); g.fillStyle = gr; g.fillRect(-400, y0, W + 800, y1 - y0); }
function paintClouds(g, n, y0, y1, seed, a = .5) { const r = mulberry32(seed); for (let i = 0; i < n; i++) { g.globalAlpha = a; g.fillStyle = '#fffaf0'; g.fill(blob(r() * W, y0 + r() * (y1 - y0), 90 + r() * 120, 18 + r() * 16, r, .25)); } g.globalAlpha = 1; }
function paintRidge(g, y0, amp, col, sd, x0 = -400, x1 = W + 400, yb = 2400) { const p = new Path2D(); p.moveTo(x0, yb); for (let x = x0; x <= x1; x += 30) p.lineTo(x, y0 + Math.sin(x * .005 + sd) * amp + Math.sin(x * .013 + sd * 3) * amp * .4); p.lineTo(x1, yb); p.closePath(); wc(g, p, col, { grain: .2, bloom: .18, edge: shade(col, -.15), edgeW: 6, edgeA: .3 }); }
function paintTrees(g, y0, y1, n, seed, sc = 1, x0 = -100, x1 = W + 100) { const r = mulberry32(seed), tc = ['#e9b84a', '#dd8f3c', '#f1cd62', '#c8a24a', '#b8b25a', '#e7a03e', '#f3d27a']; for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rr = (30 + r() * 50) * sc; g.fillStyle = '#6a5030'; g.fillRect(x - 3 * sc, y, 6 * sc, rr * .8); wc(g, blob(x, y, rr, rr * .85, r, .2, 10), tc[Math.floor(r() * tc.length)], { grain: .3, edge: '#9a6a2a', edgeW: 3, edgeA: .3 }); } }
function paintCanopy(g, cx, cy, rx, ry, n, seed, sz = 1) { const r = mulberry32(seed); for (let i = 0; i < 8; i++) { g.globalAlpha = .5; wc(g, blob(cx + (r() - .5) * rx * 1.3, cy + (r() - .5) * ry * 1.1, rx * (.35 + r() * .3), ry * (.3 + r() * .3), r, .25), ['#f0c64a', '#e8b13a', '#f6d870'][i % 3], { grain: .3 }); } g.globalAlpha = 1; for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()); drawGinkgo(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, (20 + r() * 16) * sz, r() * 6.28, ['#f4c63c', '#f8d867', '#e9a92c', '#f1bb35', '#fbe28a'][Math.floor(r() * 5)], { detail: r() < .4 }); } }
function paintLake(g, y0, y1, seed, cols = ['#8fbcd2', '#6a9fbe']) { const r = mulberry32(seed), p = new Path2D(); p.rect(-400, y0, W + 800, y1 - y0); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); wc(g, p, gr, { grain: .2, bloom: .15 }); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = r() * W, y = y0 + r() * (y1 - y0); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 50, y); g.stroke(); } }
function paintGround(g, y0, y1, seed, cols = ['#c3c27a', '#9fae5a'], n = 900) { const r = mulberry32(seed), p = new Path2D(); p.rect(-400, y0, W + 800, y1 - y0); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); wc(g, p, gr, { grain: .25, bloom: .2 }); for (let i = 0; i < n; i++) { const x = -100 + r() * (W + 200), y = y0 + r() * (y1 - y0), d = (y - y0) / (y1 - y0); grassBlade(g, x, y, 6 + d * 26, (r() - .5) * 10, 1 + d * 2, ['#8c9e4c', '#b6b864', '#7b8e40', '#c7b85a'][i % 4]); } for (let i = 0; i < n / 20; i++) flower5(g, r() * W, y0 + 20 + r() * (y1 - y0 - 20), 4 + r() * 6, r() < .7 ? '#fffaf0' : '#f2a49a', '#f2b33a', 'rgba(150,120,70,.6)', r() * 6); for (let i = 0; i < n / 25; i++) drawGinkgo(g, r() * W, y0 + 10 + r() * (y1 - y0), 12 + r() * 12, r() * 6.28, PAL.gold, { squash: .55 }); }
function quiltQuad(g, y0, y1, xl0, xr0, xl1, xr1, R, C, seed) {
  const tiles = quiltTiles2(); const order = ['cream', 'pink', 'green', 'rose', 'red', 'butter'];
  const P = (u, v) => { const y = lerp(y0, y1, v); return [lerp(lerp(xl0, xl1, v), lerp(xr0, xr1, v), u), y]; };
  const r = mulberry32(seed);
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
    const a = P(j / C, i / R), b = P((j + 1) / C, i / R), c = P((j + 1) / C, (i + 1) / R), d = P(j / C, (i + 1) / R);
    const q = new Path2D(); q.moveTo(...a); q.lineTo(...b); q.lineTo(...c); q.lineTo(...d); q.closePath();
    g.save(); g.clip(q); const p = g.createPattern(tiles[order[Math.floor(r() * order.length)]], 'repeat'); p.setTransform(new DOMMatrix([(b[0] - a[0]) / 150, (b[1] - a[1]) / 150, (d[0] - a[0]) / 150, (d[1] - a[1]) / 150, a[0], a[1]])); g.fillStyle = p; g.fill(q);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = .2; g.fillStyle = pat(g, TEX.grain, 1.2); g.fill(q); g.restore();
    g.save(); g.strokeStyle = 'rgba(140,80,60,.35)'; g.lineWidth = 2; g.stroke(q); g.restore();
  }
  const o = new Path2D(); o.moveTo(...P(0, 0)); o.lineTo(...P(1, 0)); o.lineTo(...P(1, 1)); o.lineTo(...P(0, 1)); o.closePath();
  g.save(); g.strokeStyle = '#d98d86'; g.lineWidth = 10; g.stroke(o); g.strokeStyle = PAL.sienna; g.lineWidth = 2.4; g.globalAlpha = .7; g.stroke(o); g.restore();
}
function quiltTiles2() {
  if (QT) return QT; QT = {}; const S = 96;
  const mk = (n, fn) => { const c = mkCanvas(S, S), g = c.getContext('2d'); fn(g); QT[n] = c; };
  const ging = (g, base, stripe, n) => { g.fillStyle = base; g.fillRect(0, 0, S, S); g.fillStyle = stripe; g.globalAlpha = .45; for (let i = 0; i < n; i++) { g.fillRect(i * S / n, 0, S / n / 2, S); g.fillRect(0, i * S / n, S, S / n / 2); } g.globalAlpha = 1; };
  const floral = (g, base, petal, seed) => { g.fillStyle = base; g.fillRect(0, 0, S, S); const r = mulberry32(seed); for (let i = 0; i < 9; i++) { const x = (i % 3) * 32 + 16, y = Math.floor(i / 3) * 32 + 16; flower5(g, x, y, 8, petal, '#f2b33a', 'rgba(170,90,70,.6)', r()); } };
  mk('pink', g => ging(g, '#f6dcd6', '#e59c96', 6)); mk('red', g => ging(g, '#f3d2cc', '#d8726c', 8)); mk('green', g => ging(g, '#e7ebcd', '#a4b67a', 6));
  mk('cream', g => { floral(g, '#f8eedb', '#ef9b92', 3); drawGinkgo(g, 48, 70, 30, 0, '#f0b833', { detail: false }); });
  mk('rose', g => floral(g, '#f1c6be', '#fff3e6', 8)); mk('butter', g => { g.fillStyle = '#f6e3b4'; g.fillRect(0, 0, S, S); drawGinkgo(g, 48, 72, 40, 0, '#eeb02e', {}); });
  return QT;
}
function grade(ctx, k) { // k: 0 day … 1 dusk … 2 blue hour … 3 night
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'multiply';
  const c = k < 1 ? [255, lerp(255, 205, k), lerp(255, 160, k), 1] : k < 2 ? [lerp(255, 120, k - 1), lerp(205, 140, k - 1), lerp(160, 210, k - 1), 1] : [lerp(120, 80, k - 2), lerp(140, 95, k - 2), lerp(210, 170, k - 2), 1];
  ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function fwFlash(t) { let f = 0; for (let i = 0; i < 8; i++) { const d = t - ACT['fw' + i].t - 1; if (d > 0 && d < 1.8) f = Math.max(f, (1 - d / 1.8)); } return f; }
