#!/usr/bin/env python3
"""Bundle 差點錯過的圍爐 into one self-contained HTML (art, font, voices embedded).
usage: python3 hotpot/tools/build.py [out.html] [--range FROM TO]"""
import base64, io, json, os, sys, wave
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(HERE)
ORDER = [('hotpot/src', 'util.js'), ('src', 'draw.js'), ('hotpot/src', 'rig.js'), ('hotpot/src', 'props.js'),
         ('hotpot/src', 'cues.js'), ('hotpot/src', 'scenes.js'), ('hotpot/src', 'audio.js'), ('hotpot/src', 'main.js')]
IMGS = ['wu_tex', 'wu_sprout', 'tex_cape', 'di_body', 'di_yawn']
def b64img(p):
    buf = io.BytesIO(); Image.open(p).save(buf, 'WEBP', quality=94, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
def b64wav(p):
    w = wave.open(p); assert w.getsampwidth() == 2 and w.getnchannels() == 1
    return {'sr': w.getframerate(), 'pcm': base64.b64encode(w.readframes(w.getnframes())).decode()}
def main():
    a = sys.argv[1:]; rng = [0, 150]
    if '--range' in a: i = a.index('--range'); rng = [float(a[i + 1]), float(a[i + 2])]; del a[i:i + 3]
    out = a[0] if a else os.path.join(ROOT, 'dist', 'hotpot.html')
    code = '\n'.join(open(os.path.join(ROOT, d, f), encoding='utf-8').read() for d, f in ORDER if os.path.exists(os.path.join(ROOT, d, f)))
    assets = {'images': {k: b64img(os.path.join(ROOT, 'assets', 'hotpot', k + '.png')) for k in IMGS},
              'font': 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(ROOT, 'assets', 'font', 'title.woff2'), 'rb').read()).decode(),
              'voices': {k: b64wav(os.path.join(ROOT, 'assets', 'hotpot', f'voice_{k}.wav')) for k in ['qi', 'wu', 'gui']}}
    html = open(os.path.join(HERE, 'src', 'template.html'), encoding='utf-8').read()
    html = html.replace('/*ASSETS*/', json.dumps(assets)).replace('/*CODE*/', code).replace('/*RANGE*/', json.dumps(rng))
    os.makedirs(os.path.dirname(out), exist_ok=True); open(out, 'w', encoding='utf-8').write(html)
    print(out, f'{os.path.getsize(out) / 1e6:.2f} MB')
if __name__ == '__main__': main()
