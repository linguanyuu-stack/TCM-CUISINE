// usage: node tools/stills.js film.html outdir t1 t2 ...   (renders PNG stills)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [html, out, ...ts] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto('file://' + path.resolve(html));
  await p.waitForFunction(() => window.FILM && window.FILM.ready, null, { timeout: 180000 });
  for (const t of ts) {
    const t0 = Date.now();
    const d = await p.evaluate(t => FILM.frameJPEG(Math.round(t * 24), .9), parseFloat(t));
    fs.writeFileSync(path.join(out, `t${parseFloat(t).toFixed(2).padStart(6, '0')}.jpg`), Buffer.from(d, 'base64'));
    console.log(t, Date.now() - t0, 'ms');
  }
  await b.close();
})();
