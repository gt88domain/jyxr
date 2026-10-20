# Original artwork conversion

Audio was also recovered from the same uploaded archive. `audio-manifest.json`
locks the `StreamingAssets/audios` SHA-256 and maps 183 clips to browser MP3
files, covering all 166 original music/effect resource IDs. Source paths use
exact matching or an unambiguous filename, recorded per binding. Rebuild with
`PYTHONPATH=... python3 scripts/extract-legacy-audio.py JYGAME_DATA_DIRECTORY`
(UnityPy 1.24.2 and FFmpeg with libmp3lame). The source branch stores this index
and extraction code; audio bytes belong to the locked media bundle/static site.
The runtime loads only current music and requested effects. Music is unlocked
by a user gesture and pauses in a hidden tab; volume settings persist locally.

Source: the user-provided `X.rar`, labelled X1.0.0.1.
SHA-256: `331d5df9e7867621fda2e42ca0fe0072591fd03df57a2b6bfe1162b319b4d995`.

These are original game images, not newly generated artwork. Original ownership
and notices remain applicable; the code repository's license does not relabel
the artwork as newly authored material.

`manifest.json` records source asset files/object IDs, input hashes, exported file
hashes and model clip provenance. PNG images preserve decoded original pixels.
Phaser atlases pack original frames without resizing/repainting them. Mesh
coordinates retain frame alignment and original AnimationClip pointer order and
sample rates are used when available. Numbered-frame/timing fallbacks are marked
in each clip; this does not claim exact Unity animation timing or event playback.

Rebuild with `scripts/extract-legacy-art.py` and the reviewed local archive/data
directory. No executable, assembly or Lua from the original package is run.
The modern .NET WebAssembly/TypeScript engine remains in use. Audio and skill
effect sequences are outside this conversion pass.

From `src/Game.Web`, install the extraction-only dependencies into your chosen
Python environment and pass the extracted Unity data directory explicitly:

```sh
python3 -m pip install -r scripts/requirements-art.txt
python3 scripts/extract-legacy-art.py --archive /path/to/X.rar --data-root /path/to/jygame_Data
```

Ordinary content/web builds use a verified external/local artwork bundle and do
not need UnityPy, Pillow or the archive. Media payloads are no longer tracked in
source Git; the manifest and provenance remain source files. Restore with
`python3 scripts/art-bundle.py restore --archive /path/to/jyxr-web-art.zip`.
When replacing exports, use a clean output directory so
obsolete content-hashed files do not accumulate; preserve this provenance file.
