import { build } from 'esbuild'; import fs from 'fs';
const r = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = fs.readFileSync('src/template.html', 'utf8').replace('__FONT__', fs.readFileSync('src/title.woff2').toString('base64')).replace('__JS__', () => js);
fs.mkdirSync('build', { recursive: true }); fs.writeFileSync('build/ginkgo-picnic.html', html); console.log('built', (html.length / 1024 | 0) + ' KB');
