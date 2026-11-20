# 留一個位子 · A Place for You

A 60-second animated picture-book short for 宜康中醫. It is 1080×1920 (9:16) at 24 fps, has music and sound effects, and has no narration.

## Deliverables (`dist/`)
| file | what |
|---|---|
| `film.html` | Self-contained playable film. All artwork, the font and the audio are embedded or generated inside the page. Space key plays and pauses. `?from=28&to=54` plays a time range. |
| `test_05-07.html` | The shots 05–07 test (28–54 s) as its own page. |
| `A_Place_for_You.mp4` | Rendered film: H.264 1080×1920 at 24 fps, AAC 48 kHz, normalized to −16 LUFS integrated. Not committed because of its size. Rebuild it with the commands below. |
| `test_05-07.mp4` | Rendered test of shots 05–07. Not committed. |
| `contact_sheet_1fps.png` | One frame per second of the full film. |

## How it is built
- **One cue list** (`src/core.js` → `CUES`) holds the cuts, every motion beat, the sound effects attached to each beat, the ambience levels, and the music (pad chords and plucked notes).
- **Deterministic rendering.** `render(t)` is a pure function of time. All randomness comes from seeded PRNGs (`mulberry32`).
- **Characters.** Eight characters are cut directly from the supplied character sheets (`tools/cut_sprites.py`, `tools/prep_sprites.py`). 烏烏's right arm is split off as an articulated limb, painted with his own texture, so he can lift the branch and pat the quilt. 豆豆 is drawn as vectors that match his sheet, so his blanket and the two-handed bowl pickup can be animated.
- **Watercolor look.** Layered 2D canvas with parallax planes, pigment-granulation noise, edge darkening, sienna outlines and a paper-grain overlay. Close-ups use depth of field.
- **Audio** is synthesized in the page from the cue list. It has a pentatonic pad and Karplus–Strong plucks, a creek bed, a simmer, a ceramic clink, two quilt taps, cloth, rustles, steps and a chime, with a small reverb.

## Rebuild / export
```bash
pip install pillow
python3 tools/build.py                                   # → dist/film.html
python3 tools/build.py dist/test_05-07.html --range 28 54
# MP4 export (needs Node + Playwright Chromium + ffmpeg):
node tools/render.js dist/film.html dist/A_Place_for_You.mp4 0 60
node tools/stills.js dist/film.html /tmp/stills 30 44.5 49.5 57   # review stills
```
`render.js` draws every frame in headless Chromium, pipes JPEG frames to ffmpeg (libx264, CRF 17), and pulls the synthesized WAV from the page. It then runs a two-pass `loudnorm` (I=−16, TP=−1.5) and muxes the result as AAC.

## Sources
`assets/refs/` holds the supplied storyboard, character sheets and poster. `assets/sprites/` holds the cut-outs. `assets/font/title.woff2` is a 19-glyph subset of LXGW WenKai TC Bold (SIL OFL) used for the title.
