// Parallel render: N headless Chromium workers each encode a slice of frames,
// slices are concatenated, then the synthesized mix is loudness-normalized
// to -16 LUFS (two-pass loudnorm) and muxed.  usage: render_par.js page.html out.mp4 [workers]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const FPS = 24;
async function openPage(html) {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto('file://' + path.resolve(html)); await p.waitForFunction(() => window.FILM && FILM.ready, null, { timeout: 300000 }); return [b, p];
}
async function slice(html, i0, i1, out, tag) {
  const [b, p] = await openPage(html);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = i0; i < i1; i++) { const d = await p.evaluate(i => FILM.frameJPEG(i, .95), i); if (!ff.stdin.write(Buffer.from(d, 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if ((i - i0) % 72 === 0) console.log(`${tag} ${i - i0}/${i1 - i0}`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
}
(async () => {
  const [html, out, nw = '4'] = process.argv.slice(2), N = parseInt(nw);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p60-'));
  const [b, p] = await openPage(html); const dur = await p.evaluate(() => DUR);
  const wav = await p.evaluate(() => audioWavBase64(0, DUR)); fs.writeFileSync(path.join(tmp, 'mix.wav'), Buffer.from(wav, 'base64')); await b.close();
  const total = Math.round(dur * FPS), per = Math.ceil(total / N), parts = [];
  await Promise.all([...Array(N)].map((_, w) => { const a = w * per, z = Math.min(total, a + per), f = path.join(tmp, `part${w}.mp4`); parts.push(f); return slice(html, a, z, f, 'w' + w); }));
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(f => `file '${f}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', path.join(tmp, 'video.mp4')]);
  const j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${path.join(tmp, 'mix.wav')}" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p'`]).toString());
  const af = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, 'video.mp4'), '-i', path.join(tmp, 'mix.wav'), '-af', af, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  const v = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${out}" -af ebur128=peak=true -f null - 2>&1 | grep -E ' I:| Peak:' | tail -2`]).toString().trim();
  console.log('measured', j.input_i, 'LUFS →', v.replace(/\s+/g, ' '), '→', out);
})();
