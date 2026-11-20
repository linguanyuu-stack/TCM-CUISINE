const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => { const [html, out, mode = '0'] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('[err]', e.message)); p.on('console', m => console.log('[page]', m.text()));
  await p.goto('file://' + path.resolve(html)); await p.waitForFunction(() => window.FILM && FILM.ready, null, { timeout: 120000 });
  const d = await p.evaluate(m => { FILM.lineup(m); return FILM.canvas.toDataURL('image/png').split(',')[1]; }, parseInt(mode));
  fs.writeFileSync(out, Buffer.from(d, 'base64')); await b.close(); })();
