"""Cut seamless texture swatches (and 烏烏's sprout) from the character sheets.
Coordinates are in the cut-out sprite space produced by tools/cut_sprites.py."""
import numpy as np, os, sys
from PIL import Image
CUT = sys.argv[1]          # dir with cut sprites  (s{sheet}_r{row}c{col}.png)
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
SW = {  # name: (sprite, x0, y0, x1, y1)
  'wu':    ('s3_r0c1', 150, 205, 250, 255),
  'gui':   ('s3_r1c1', 55, 185, 110, 235),
  'goji':  ('s4_r0c1', 75, 195, 125, 240),
  'ma':    ('s3_r2c2', 25, 185, 85, 240),
  'shan':  ('s2_r0c2', 80, 42, 128, 88),
  'zao':   ('s2_r1c2', 25, 145, 75, 190),
  'qi2':   ('s4_r1c0', 55, 35, 110, 90),
  'cape':  ('s3_r0c1', 18, 205, 58, 245),
  'sage':  ('s2_r0c2', 10, 232, 48, 268),
}
for k, (sp, x0, y0, x1, y1) in SW.items():
    a = np.array(Image.open(os.path.join(CUT, sp + '.png')).convert('RGBA'))[y0:y1, x0:x1, :3]
    # mirror-tile 2x2 → seamless
    t = np.concatenate([np.concatenate([a, a[:, ::-1]], 1), np.concatenate([a[::-1], a[::-1, ::-1]], 1)], 0)
    Image.fromarray(t).save(os.path.join(OUT, f'tex_{k}.png'))
# 烏烏's sprout (two leaves) — above the body outline
s = np.array(Image.open(os.path.join(CUT, 's3_r0c1.png')).convert('RGBA'))
sp = s[0:44, 118:262].copy()
Image.fromarray(sp).save(os.path.join(OUT, 'wu_sprout.png'))
print('ok')
# 地地 without his face (eyes, mouth, cheeks painted out) for the animated face layer
import cv2
im = np.array(Image.open(os.path.join(CUT, 's2_r2c1.png')).convert('RGBA'))
m = np.zeros(im.shape[:2], np.uint8)
for (x, y, r) in [(160, 150, 13), (207, 147, 12), (236, 127, 13), (153, 173, 21), (261, 135, 21)]:
    cv2.circle(m, (x, y), r, 255, -1)
rgb = cv2.inpaint(np.ascontiguousarray(im[:, :, :3]), m, 9, cv2.INPAINT_TELEA)
Image.fromarray(np.dstack([rgb, im[:, :, 3]])).save(os.path.join(OUT, 'di_body.png'))
print('di ok')
