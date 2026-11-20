// ---------------------------------------------------------------------------
// Frame = f(t): paint scene/emissive/occluder in 2D, composite in WebGL.
// ---------------------------------------------------------------------------
const CAPTION = '來年大家還要再次相聚喔！';
const CV = {};
function drawCaption(ui, t) {
  ui.setTransform(1, 0, 0, 1, 0, 0); ui.clearRect(0, 0, W, H);
  const a = ease(prog('caption', t)) * (1 - ease(prog('fadeout', t))); if (a <= 0) return 0;
  ui.save(); ui.globalAlpha = a;
  const g = ui.createLinearGradient(0, 840, 0, 1080); g.addColorStop(0, 'rgba(20,16,30,0)'); g.addColorStop(.5, 'rgba(20,16,30,.55)'); g.addColorStop(1, 'rgba(20,16,30,.65)'); ui.fillStyle = g; ui.fillRect(0, 840, W, 240);
  ui.font = '700 78px "TitleTC"'; ui.textAlign = 'center'; ui.textBaseline = 'middle';
  const y = 968 - (1 - ease(prog('caption', t))) * 12;
  ui.lineJoin = 'round'; ui.strokeStyle = 'rgba(70,30,10,.85)'; ui.lineWidth = 12; ui.strokeText(CAPTION, W / 2, y);
  ui.fillStyle = '#fff1d2'; ui.fillText(CAPTION, W / 2, y);
  drawGinkgo(ui, W / 2 - 470, y + 6, 34, -.4, '#f2c03a', {}); drawGinkgo(ui, W / 2 + 470, y + 6, 34, .4, '#f2c03a', {});
  ui.restore(); return a;
}
function render(t, frameIdx = 0) {
  initTextures(); t = clamp(t, 0, DUR - 1e-4);
  const info = renderWorld(CV.s, CV.f, CV.e, CV.ef, CV.o, t);
  CV.b.setTransform(1, 0, 0, 1, 0, 0); CV.b.clearRect(0, 0, 480, 270); CV.b.filter = 'blur(5px)'; CV.b.drawImage(CV.e.canvas, 0, 0, 480, 270); CV.b.drawImage(CV.ef.canvas, 0, 0, 480, 270); CV.b.filter = 'none';
  // paper grain stays: a light multiply over the painted scene
  CV.s.setTransform(1, 0, 0, 1, 0, 0); CV.s.globalCompositeOperation = 'multiply'; CV.s.globalAlpha = .14; CV.s.drawImage(TEX.paper, 0, 0, W, H); CV.s.globalAlpha = 1; CV.s.globalCompositeOperation = 'source-over';
  const uiOn = drawCaption(CV.u, t);
  const fade = Math.min(smooth(0, .7, t), 1 - smooth(ACT.fadeout.t + .2, DUR, t));
  GLX.frame({ scene: CV.s.canvas, fg: CV.f.canvas, emisF: CV.ef.canvas, emis: CV.e.canvas, bloom: CV.b.canvas, occ: CV.o.canvas, ui: CV.u.canvas }, { ...info, rayAmt: (1 - clamp(info.k)) * .95, frame: frameIdx, fade, uiOn: uiOn > 0 ? 1 : 0 });
}
const FILM = {
  ready: false,
  async init(canvas) {
    this.canvas = canvas;
    await loadImages(ASSETS.images);
    const f = new FontFace('TitleTC', `url(${ASSETS.font})`, { weight: '700' }); await f.load(); document.fonts.add(f);
    CV.s = mkCanvas(W, H).getContext('2d'); CV.f = mkCanvas(W, H).getContext('2d'); CV.e = mkCanvas(W, H).getContext('2d'); CV.ef = mkCanvas(W, H).getContext('2d'); CV.u = mkCanvas(W, H).getContext('2d');
    CV.b = mkCanvas(480, 270).getContext('2d'); CV.o = mkCanvas(480, 270).getContext('2d');
    GLX.init(canvas); initTextures(); buildLayers(); buildCrowd(); quiltTiles2();
    this.ready = true;
  },
  frame(t) { render(t, Math.round(t * FPS)); },
  frameJPEG(i, q = .92) { render(i / FPS, i); return this.canvas.toDataURL('image/jpeg', q).split(',')[1]; },
};
