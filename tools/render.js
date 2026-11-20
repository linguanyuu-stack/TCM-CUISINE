// Render the film (or a time range) to MP4 with headless Chromium + ffmpeg.
// usage: node tools/render.js dist/film.html out.mp4 [from] [to]
// Audio is synthesized in the page from the cue list, then loudness-normalized
// to −16 LUFS integrated (two-pass ffmpeg loudnorm) and muxed as AAC.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
(async () => {
  const [html, out, a = '0', b = '60'] = process.argv.slice(2);
  const from = parseFloat(a), to = parseFloat(b), FPS = 24;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-'));
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await br.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('pageerror', e => console.log('[err]', e.message));
  await page.goto('file://' + path.resolve(html));
  await page.waitForFunction(() => window.FILM && window.FILM.ready, null, { timeout: 300000 });
  // audio
  const t0 = Date.now();
  const wav = await page.evaluate(([f, t]) => audioWavBase64(f, t), [from, to]);
  fs.writeFileSync(path.join(tmp, 'mix.wav'), Buffer.from(wav, 'base64'));
  console.log('audio synthesized in', Date.now() - t0, 'ms');
  // video frames → ffmpeg
  const vid = path.join(tmp, 'video.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', vid], { stdio: ['pipe', 'inherit', 'inherit'] });
  const i0 = Math.round(from * FPS), i1 = Math.round(to * FPS);
  for (let i = i0; i < i1; i++) {
    const d = await page.evaluate(i => FILM.frameJPEG(i, .95), i);
    if (!ff.stdin.write(Buffer.from(d, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - i0) % 48 === 0) console.log(`frame ${i - i0}/${i1 - i0}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await br.close();
  // loudness: pass 1 measure, pass 2 linear normalize to −16 LUFS / −1.5 dBTP
  let j; try { j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${path.join(tmp, 'mix.wav')}" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p'`]).toString()); } catch (e) { throw e; }
  console.log('measured', j.input_i, 'LUFS', j.input_tp, 'dBTP');
  const af = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-i', path.join(tmp, 'mix.wav'), '-af', af, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  const v = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${out}" -af ebur128 -f null - 2>&1 | grep -A2 'Integrated loudness' | grep ' I:'`]).toString().trim();
  console.log('final', v, '→', out);
  fs.writeFileSync(out + '.loudness.json', JSON.stringify({ measured_in_page: j, final: v }, null, 1));
})();
