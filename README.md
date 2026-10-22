# Website Showcase

Turn website screenshots into a locally rendered motion showcase. The renderer uses Averlo's existing motion and composition; your assistant supplies the images and shot selection, rather than recreating the animation.

## First result

Use a computer with Node.js 22+, Python 3.12+, FFmpeg available on PATH, and enough space for rendered PNG frames. No Averlo server performs rendering. Remotion downloads its Chromium browser on the first render. Dependency licenses still apply; review Remotion's current license for your team/use case.

From this repository:

```sh
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/prepare-input.py sample
npm run sample:check
SHOWCASE_PYTHON="$PWD/.venv/bin/python" npm run sample:render
```

On Windows, use `.venv\Scripts\python.exe`, set `SHOWCASE_PYTHON` to its absolute path, and run the same Node commands. The sample is an original geometric illustration with no client content, downloaded images, or bundled font files.

The result is `sample/showcase.mp4`: silent H.264, 2228×1672, 60 fps. Open it for the user. `sample/poster.png` and `sample/evidence.zip` accompany the result. Frame and source checks must pass before reporting success. Rendering produces hundreds of temporary PNGs; remove `sample/frames` and `sample/bundle` after reviewing the output if space is needed.

## Your own website

Create a separate working directory and copy `sample/request.json` into it. Supply a full-page PNG/JPEG as `image-0`; update its SHA-256, width and height in `images`, and supply the logical `page` dimensions. Define coherent `sections` as vertical crops with unique IDs, y positions, widths and heights. Select IDs for the two solo shots, left/right columns and two pairs in `shots`. Paired sections must have different pixels. Opening strips need distinct upper and lower passages.

The section examples and shot mappings in `sample/request.json` are runnable examples. Preserve actual input pixels. Do not invent missing client content or fetch private assets. Use only images you have permission to use.

```sh
.venv/bin/python scripts/prepare-input.py /absolute/path/to/your-input
node scripts/render-input.mjs /absolute/path/to/your-input --validate
SHOWCASE_PYTHON="$PWD/.venv/bin/python" node scripts/render-input.mjs /absolute/path/to/your-input
```

If fit validation fails, choose shorter sections or different slots and rerun it. Do not disable validation to force a render. Background may use an explicit six-digit hex override, automatic palette selection, or the included balanced strategy.

## Updates and credentials

The Git remote must remain credential-free. Obtain fresh temporary access through your saved Averlo collection, then fetch using a temporary credential helper. Preserve local customizations before updating and inspect changes before applying them. Do not commit access tokens, private screenshots, generated frames or videos.

## Package status

This private repository stores the curated Showcase distribution. Averlo catalog delivery is enabled separately; repository creation alone does not make the download available. The preserved renderer and newly authored sample are identified in `PROVENANCE.md`. Publication terms for Averlo's source must be selected before distribution; this package does not silently grant an open-source license.
