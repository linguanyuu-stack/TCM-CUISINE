#!/usr/bin/env python3
"""Bundle 一起圍爐 (60 s, 16:9) into one self-contained HTML. usage: build.py [out.html]"""
import base64, io, json, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); ROOT = os.path.dirname(HERE)
ORDER = [('picnic60/src', 'util.js'), ('src', 'draw.js'), ('picnic60/src', 'rig.js'), ('picnic60/src', 'props.js'), ('picnic60/src', 'kit.js'),
         ('picnic60/src', 'cues.js'), ('picnic60/src', 'world.js'), ('picnic60/src', 'audio.js'), ('picnic60/src', 'gl.js'), ('picnic60/src', 'main.js')]
IMGS = ['wu_tex', 'wu_sprout', 'tex_cape', 'di_body', 'di_yawn']
def b64img(p):
    buf = io.BytesIO(); Image.open(p).save(buf, 'WEBP', quality=94, method=6); return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'picnic60.html')
code = '\n'.join(open(os.path.join(ROOT, d, f), encoding='utf-8').read() for d, f in ORDER)
assets = {'images': {k: b64img(os.path.join(ROOT, 'assets', 'hotpot', k + '.png')) for k in IMGS},
          'font': 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(ROOT, 'assets', 'font', 'caption60.woff2'), 'rb').read()).decode()}
html = open(os.path.join(HERE, 'src', 'template.html'), encoding='utf-8').read().replace('/*ASSETS*/', json.dumps(assets)).replace('/*CODE*/', code).replace('/*RANGE*/', '[0, 60]')
open(out, 'w', encoding='utf-8').write(html); print(out, f'{os.path.getsize(out) / 1e6:.2f} MB')
