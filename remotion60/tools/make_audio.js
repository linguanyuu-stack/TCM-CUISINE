// Synthesize the soundtrack from the same cue list, normalize to -16 LUFS → public/mix.wav
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), SRC = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const code = ['picnic60/src/util.js', 'picnic60/src/cues.js', 'picnic60/src/audio.js'].map(SRC).join('\n') + '\nreturn { audioWavBase64 };';
const { audioWavBase64 } = new Function('btoa', code)(s => Buffer.from(s, 'binary').toString('base64'));
const raw = path.join(__dirname, 'raw.wav'), out = path.resolve(__dirname, '../public/mix.wav');
fs.writeFileSync(raw, Buffer.from(audioWavBase64(0, 60), 'base64'));
const j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${raw}" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p'`]).toString());
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`, '-ar', '48000', '-c:a', 'pcm_s16le', out]);
fs.unlinkSync(raw); console.log('measured', j.input_i, 'LUFS → normalized', out);
