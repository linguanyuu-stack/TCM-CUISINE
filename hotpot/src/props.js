// ---------------------------------------------------------------------------
// Props: invitation card, calendar, door, small cups, ladle, bus, lanterns …
// ---------------------------------------------------------------------------
// invitation card (local: centre at 0,0; w = width)
function drawCard(ctx, x, y, w, rot = 0, o = {}) {
  const h = w * 1.25; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(80,45,20,.18)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
  const p = new Path2D(); p.roundRect(-w / 2, -h / 2, w, h, w * .06);
  fillShade(ctx, p, '#fbf3e1', { grain: .12 }); ctx.save(); ctx.clip(p); ctx.strokeStyle = '#e6b44a'; ctx.lineWidth = w * .05; ctx.strokeRect(-w / 2 + w * .07, -h / 2 + w * .07, w - w * .14, h - w * .14); ctx.restore(); ink(ctx, p, Math.max(1.5, w * .025));
  drawGinkgo(ctx, 0, -h * .02, w * .42, 0, '#f0b833', {});
  if (o.circle !== false) { ctx.strokeStyle = '#d0473a'; ctx.lineWidth = w * .035; ctx.beginPath(); ctx.ellipse(0, -h * .17, w * .32, w * .3, -.1, -.3, Math.PI * 1.85); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,80,40,.6)'; ctx.lineWidth = w * .025; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-w * .28, h * .2 + i * h * .1); ctx.lineTo(w * .28 - i * w * .12, h * .2 + i * h * .1); ctx.stroke(); }
  ctx.restore();
}
function drawCalendar(ctx, x, y, w, ring = 1) {
  const h = w * .72; ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(80,45,20,.2)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  const p = new Path2D(); p.rect(-w / 2, -h / 2, w, h); fillShade(ctx, p, '#fbf5e8', { grain: .1 }); ink(ctx, p, 3);
  ctx.fillStyle = '#c96a4a'; ctx.fillRect(-w / 2, -h / 2, w, h * .16);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = '#6b4a30'; ctx.beginPath(); ctx.arc(-w / 2 + w * .1 + i * w * .1, -h / 2, 5, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(120,90,60,.45)'; ctx.lineWidth = 1.5;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) ctx.strokeRect(-w / 2 + w * .06 + c * w * .126, -h / 2 + h * .22 + r * h * .145, w * .126, h * .145);
  const cx = -w / 2 + w * .06 + 4.5 * w * .126, cy = -h / 2 + h * .22 + 2.5 * h * .145;
  drawGinkgo(ctx, cx, cy + h * .05, w * .1, 0, '#f0b833', { detail: false });
  ctx.strokeStyle = '#d0473a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, w * .085, h * .1, -.15, -.4, -.4 + Math.PI * 2 * ring); ctx.stroke();
  for (const [a, l] of [[-0.9, 1], [-0.4, 1.2], [0.2, 1]]) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - 1.2) * w * .11, cy + Math.sin(a - 1.2) * h * .14); ctx.lineTo(cx + Math.cos(a - 1.2) * w * (.11 + .05 * l), cy + Math.sin(a - 1.2) * h * (.14 + .07 * l)); ctx.stroke(); }
  ctx.restore();
}
function drawCup(ctx, x, y, w, tilt = 0, fill = .7) { // small wine cup, (x,y) = rim centre
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  const h = w * .7, p = new Path2D(); p.moveTo(-w / 2, 0); p.bezierCurveTo(-w / 2, h * .8, -w * .2, h, 0, h); p.bezierCurveTo(w * .2, h, w / 2, h * .8, w / 2, 0); p.ellipse(0, 0, w / 2, w * .14, 0, 0, Math.PI); p.closePath();
  fillShade(ctx, p, '#f7eedb', { grain: .1, light: [-w * .2, h * .3, w] }); ink(ctx, p, 2);
  flower5(ctx, 0, h * .45, w * .12, '#ee8c86', '#f2b33a', 'rgba(170,90,70,.6)');
  const rim = new Path2D(); rim.ellipse(0, 0, w / 2, w * .14, 0, 0, 7); ctx.fillStyle = '#fbf5e6'; ctx.fill(rim); ink(ctx, rim, 2);
  if (fill > 0) { ctx.fillStyle = '#d9a453'; ctx.beginPath(); ctx.ellipse(0, w * .02, w * .4, w * .1, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawLadle(ctx, x, y, s, rot) { // (x,y) = grip point
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(90, 0); ctx.stroke(); ink(ctx, new Path2D('M-30 -5 L90 -5 M-30 5 L90 5'), 1.5, INK, .5);
  const b = new Path2D(); b.ellipse(112, 6, 28, 20, 0, 0, Math.PI); b.closePath(); fillShade(ctx, b, '#9a6236'); ink(ctx, b, 2.4);
  ctx.restore();
}
function drawLanternOn(ctx, x, y, s, on, t) { // lantern that can be switched on (0..1)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (on > 0) { const glow = (.8 + .1 * Math.sin(t * 2.3 + x)) * on; const rg = ctx.createRadialGradient(0, -40, 5, 0, -40, 150); rg.addColorStop(0, `rgba(255,210,120,${.6 * glow})`); rg.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = rg; ctx.fillRect(-160, -200, 320, 320); }
  shadowAt(ctx, 0, 2, 40, .25);
  const base = new Path2D(); base.rect(-26, -14, 52, 14); fillShade(ctx, base, '#8a5a2e'); ink(ctx, base, 2.5);
  const top = new Path2D(); top.moveTo(-22, -72); top.lineTo(22, -72); top.lineTo(14, -86); top.lineTo(-14, -86); top.closePath(); fillShade(ctx, top, '#8a5a2e'); ink(ctx, top, 2.5);
  const body = new Path2D(); body.moveTo(-24, -14); body.bezierCurveTo(-36, -30, -36, -56, -24, -72); body.lineTo(24, -72); body.bezierCurveTo(36, -56, 36, -30, 24, -14); body.closePath();
  const g = ctx.createRadialGradient(0, -43, 3, 0, -43, 34); g.addColorStop(0, on > .5 ? '#fffbe0' : '#f3e6c6'); g.addColorStop(.6, on > .5 ? '#ffd877' : '#e8cf9e'); g.addColorStop(1, on > .5 ? '#eba640' : '#c9a46a');
  ctx.fillStyle = g; ctx.fill(body); ink(ctx, body, 2.5);
  ctx.strokeStyle = 'rgba(160,100,40,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -72); ctx.lineTo(0, -14); ctx.stroke();
  flower5(ctx, 0, -43, 10, 'rgba(255,255,240,.9)', '#f6b84a', '#d08a3a');
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -92, 9, Math.PI, 0); ctx.stroke();
  ctx.restore();
}
function marks(ctx, x, y, s, a, col = '#f2b33a', rot = 0) { drawSparkle(ctx, x, y, s, a, col, rot); }
function zzz(ctx, x, y, s, t) {
  ctx.save(); ctx.font = `700 ${40 * s}px serif`; ctx.fillStyle = '#7a5a8a'; ctx.strokeStyle = '#fff6e8'; ctx.lineWidth = 6 * s; ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) { const ph = ((t * .45 + i / 3) % 1); ctx.globalAlpha = Math.sin(ph * Math.PI); const xx = x + ph * 70 * s + Math.sin(ph * 6) * 8 * s, yy = y - ph * 120 * s; ctx.font = `700 ${(26 + ph * 26) * s}px serif`; ctx.strokeText('Z', xx, yy); ctx.fillText('Z', xx, yy); }
  ctx.restore();
}
