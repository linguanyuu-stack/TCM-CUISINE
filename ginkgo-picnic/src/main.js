import * as THREE from 'three';
import { DUR, FPS, env } from './cues.js';
import { buildWorld } from './world.js';
import { buildCast, setCamera, drawOverlay } from './anim.js';
import { buildAudio, toWavBase64 } from './audio.js';

const W = 1920, H = 1080;
const q = new URLSearchParams(location.search), scale = parseFloat(q.get('scale') || '1');
const glc = document.getElementById('gl'), ov = document.getElementById('ov');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W * scale, H * scale, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
ov.width = W; ov.height = H; const g2 = ov.getContext('2d');
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, W / H, .1, 600);
const world = buildWorld(scene), cast = buildCast(scene);

function renderAt(t) {
  t = Math.min(Math.max(t, 0), DUR - 1e-4);
  setCamera(cam, t); cast.update(t); world.update(t, env(t), cam, renderer);
  renderer.render(scene, cam); drawOverlay(g2, t, cam, cast.cast, W, H);
}
// ---- export hooks (frame-by-frame render) ----
const comp = document.createElement('canvas'); comp.width = W * scale; comp.height = H * scale; const cg = comp.getContext('2d');
window.__frame = (f, quality = .93) => { renderAt(f / FPS); cg.drawImage(glc, 0, 0); cg.drawImage(ov, 0, 0, comp.width, comp.height); return comp.toDataURL('image/jpeg', quality).slice(23); };
window.__still = t => { renderAt(t); cg.drawImage(glc, 0, 0); cg.drawImage(ov, 0, 0, comp.width, comp.height); return comp.toDataURL('image/jpeg', .9).slice(23); };
window.__wav = () => toWavBase64(buildAudio());
window.__ready = document.fonts.load('60px Title', '何首烏').then(() => { renderAt(0); return true; });

// ---- playback ----
let playing = false, t0 = 0, tNow = 0, actx = null, abuf = null, src = null;
const hint = document.getElementById('hint'), bar = document.getElementById('bar');
function startAudio(t) { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); const a = buildAudio(actx.sampleRate); abuf = actx.createBuffer(2, a.L.length, a.sr); abuf.copyToChannel(a.L, 0); abuf.copyToChannel(a.R, 1); } actx.resume(); src = actx.createBufferSource(); src.buffer = abuf; src.connect(actx.destination); src.start(0, t); t0 = actx.currentTime - t; }
function stop() { playing = false; if (src) { try { src.stop(); } catch (e) { } src = null; } hint.style.opacity = 1; }
function play() { if (tNow >= DUR - .05) tNow = 0; hint.textContent = '…'; setTimeout(() => { startAudio(tNow); playing = true; hint.style.opacity = 0; hint.textContent = '▶ click or press space'; requestAnimationFrame(loop); }, 30); }
function loop() { if (!playing) return; tNow = actx.currentTime - t0; if (tNow >= DUR) { tNow = DUR; stop(); } renderAt(Math.floor(tNow * FPS) / FPS); bar.style.width = (tNow / DUR * 100) + '%'; if (playing) requestAnimationFrame(loop); }
const toggle = () => playing ? stop() : play();
addEventListener('click', toggle);
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); toggle(); } else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { stop(); tNow = Math.min(DUR, Math.max(0, tNow + (e.code === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 : 1 / FPS))); renderAt(tNow); bar.style.width = (tNow / DUR * 100) + '%'; } });
if (q.get('t')) { tNow = parseFloat(q.get('t')); window.__ready.then(() => renderAt(tNow)); }
