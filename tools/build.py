#!/usr/bin/env python3
"""Bundle src/*.js + embedded sprites/font into one self-contained HTML file.

usage: python3 tools/build.py [out.html] [--range FROM TO]
"""
import base64, io, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDER = ['core.js', 'draw.js', 'chars.js', 'picnic.js', 'early.js', 'audio.js', 'main.js']
SPRITES = ['shan', 'zao_cup', 'zao_wave', 'di_sleep', 'di_yawn', 'gui_cup', 'ma_cheer',
           'qi_run', 'qi_jump', 'qi2_stir', 'wu_body', 'wu_tex']


def b64img(path):
    im = Image.open(path)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=94, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def main():
    args = sys.argv[1:]
    rng = [0, 60]
    if '--range' in args:
        i = args.index('--range'); rng = [float(args[i + 1]), float(args[i + 2])]; del args[i:i + 3]
    out = args[0] if args else os.path.join(ROOT, 'dist', 'film.html')
    code = '\n'.join(open(os.path.join(ROOT, 'src', f), encoding='utf-8').read()
                     for f in ORDER if os.path.exists(os.path.join(ROOT, 'src', f)))
    assets = {
        'images': {k: b64img(os.path.join(ROOT, 'assets', 'sprites', k + '.png')) for k in SPRITES},
        'font': 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(ROOT, 'assets', 'font', 'title.woff2'), 'rb').read()).decode(),
    }
    html = open(os.path.join(ROOT, 'src', 'template.html'), encoding='utf-8').read()
    html = html.replace('/*ASSETS*/', json.dumps(assets)).replace('/*CODE*/', code).replace('/*RANGE*/', json.dumps(rng))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html)
    print(out, f'{os.path.getsize(out) / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
