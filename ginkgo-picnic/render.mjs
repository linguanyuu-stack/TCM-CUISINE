// node render.mjs --stills 1,5,9 | node render.mjs [--from s --to s] [--workers n] [--scale k]
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { execFileSync, spawn } from 'child_process';
const require = createRequire(import.meta.url); let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 24, DUR = 60, scale = parseFloat(arg('scale', '1')), url = 'file://' + path.resolve('build/ginkgo-picnic.html') + '?scale=' + scale;
const launch = () => chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
async function open(b) { const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', e => console.error('PAGE ERROR', e.message)); p.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); }); await p.goto(url); await p.evaluate(() => window.__ready); return p; }
if (arg('stills')) {
  const ts = arg('stills').split(',').map(Number), b = await launch(), p = await open(b); fs.mkdirSync('build/stills', { recursive: true });
  const files = []; for (const t of ts) { const t0 = Date.now(); const d = await p.evaluate(t => window.__still(t), t); const f = `build/stills/s_${t.toFixed(2).padStart(6, '0')}.jpg`; fs.writeFileSync(f, Buffer.from(d, 'base64')); files.push(f); console.log(t, (Date.now() - t0) + 'ms'); }
  await b.close();
  const cols = Math.min(arg('cols', 3) | 0, files.length), rows = Math.ceil(files.length / cols), tw = arg('tw', '960');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.map((f, i) => `[${i}]scale=${tw}:-1[v${i}]`).join(';') + ';' + files.map((f, i) => `[v${i}]`).join('') + `xstack=inputs=${files.length}:layout=` + files.map((f, i) => `${(i % cols)}*${tw}_${Math.floor(i / cols)}*${tw * 9 / 16}`.replace(/(\d+)\*(\d+(\.\d+)?)/g, (m, a, b2) => a * b2)).join('|') + (files.length % cols ? ':fill=black' : ''), '-q:v', '3', 'build/stills/sheet.jpg']);
  console.log('sheet -> build/stills/sheet.jpg'); process.exit(0);
}
const from = Math.round(parseFloat(arg('from', '0')) * FPS), to = Math.round(parseFloat(arg('to', DUR)) * FPS), NW = parseInt(arg('workers', '4'));
fs.mkdirSync('build/frames', { recursive: true });
const b = await launch(); let next = from, done = 0; const t0 = Date.now();
await Promise.all([...Array(NW)].map(async () => { const p = await open(b); while (true) { const f = next++; if (f >= to) break; const d = await p.evaluate(f => window.__frame(f), f); fs.writeFileSync(`build/frames/f_${String(f).padStart(5, '0')}.jpg`, Buffer.from(d, 'base64')); if (++done % 48 === 0) console.log(`${done}/${to - from} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`); } }));
if (!fs.existsSync('build/audio.wav') || arg('audio')) { const p = await open(b); fs.writeFileSync('build/audio.wav', Buffer.from(await p.evaluate(() => window.__wav()), 'base64')); }
await b.close();
if (from === 0 && to === DUR * FPS) {
  const run = a => execFileSync('ffmpeg', a, { stdio: ['ignore', 'pipe', 'pipe'] });
  const m = spawn('ffmpeg', ['-hide_banner', '-i', 'build/audio.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); let err = ''; m.stderr.on('data', d => err += d); await new Promise(r => m.on('close', r));
  const j = JSON.parse(err.slice(err.lastIndexOf('{')));
  run(['-y', '-loglevel', 'error', '-framerate', '24', '-i', 'build/frames/f_%05d.jpg', '-i', 'build/audio.wav', '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', '60', 'build/ginkgo-picnic.mp4']);
  fs.mkdirSync('build/review', { recursive: true });
  for (let k = 0; k < 4; k++) run(['-y', '-loglevel', 'error', '-ss', String(k * 15), '-t', '15', '-i', 'build/ginkgo-picnic.mp4', '-vf', "fps=1,scale=640:-1,drawtext=text='%{eif\\:t+" + k * 15 + "\\:d}s':x=8:y=8:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5,tile=5x3", '-frames:v', '1', '-q:v', '3', `build/review/contact-${k + 1}.jpg`]);
  console.log('wrote build/ginkgo-picnic.mp4');
}
