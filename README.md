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

---

# 差點錯過的圍爐 · The Hot Pot Gathering I Almost Missed

A 90-second short for 宜康中醫 (cut down from a 150 s first version). It is 1080×1920 at 24 fps, with music, sound effects and three Mandarin lines. Source is in `hotpot/`.

The cut is an edit list (`EDL` in `hotpot/src/cues.js`): each shot plays a range of the scene timeline, and every motion, sound effect, voice and footfall is mapped through it. The music is written directly for the 90 s length.

| file | what |
|---|---|
| `dist/hotpot.html` | Self-contained playable film. Character art, font and voice clips are embedded; the music and sound effects are synthesized in the page. |
| `dist/hotpot_doortest.html` | Shot 03 on its own (9.4–18.8 s of the cut). |
| `dist/The_Hot_Pot_Gathering_I_Almost_Missed_90s.mp4` | Rendered 90 s film, −16 LUFS integrated. Not committed. |
| `dist/hotpot_motiontest_shot03.mp4` | 8 s doorway motion test (21–29 s). Not committed. |
| `dist/hotpot_contact_sheet_1fps.png`, `dist/hotpot_motiontest_contact.png` | Review sheets. |

## How it works
- **Rigs** (`hotpot/src/rig.js`): all nine characters are built from separately animated parts: body, eyes with lids and look direction, mouth shapes, cheeks, arms with gripping hands, feet, and accessories. 地地 uses his sheet art with the face painted out, with an animated face layer on top. 烏烏's body is painted with texture sampled from his sheet.
- **Walking** (`gait()` in `util.js`): each foot is fixed in world space while it's planted and swings two strides while the body moves one. Walk tracks (`WALKS` in `cues.js`) end on whole steps, so both feet finish planted. Every whole step also places a footfall in the audio. In shot 03 the feet are projected from a floor plan, so the planted foot stays fixed on the boards as 烏烏 backs up with the door.
- **One cue list** (`hotpot/src/cues.js`) holds the shots, actions with their sound effects, voices, ambience levels, chords and melody. Lip-sync is driven by each voice clip's loudness.
- **Voices**: generated offline with Kokoro TTS (sherpa-onnx; voices zm_yunxia, zm_yunxi, zf_xiaobei) and checked with an offline Mandarin speech recognizer, both on the raw clips and on the final mix.

```bash
python3 hotpot/tools/build.py                       # → dist/hotpot.html
node tools/render.js dist/hotpot.html dist/The_Hot_Pot_Gathering_I_Almost_Missed_90s.mp4 0 90
```
