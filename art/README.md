# Original browser-game artwork

All images in this directory were newly generated for this project with the
OpenAI `image_gen` tool on 2026-10-15. They are not copied from the reference
games or their resource archives. No named artist style was requested.

| File | Purpose | Dimensions | Transparency |
| --- | --- | --- | --- |
| `nanxian-retreat.png` | Opening scene: secluded Jiangnan mountain courtyard, mist, bamboo, warm morning light | 1672 × 941 | Opaque |
| `training-courtyard.png` | Battle scene: elevated three-quarter view of an open stone training courtyard; buildings and bamboo around the margins | 1672 × 941 | Opaque |
| `hero-swordsman.png` | Single blue-teal young swordsman, full body, facing lower-right, holding a wooden practice sword | 1254 × 1254 | RGBA, transparent background |
| `training-dummy.png` | Single straw-wrapped wooden practice dummy, projecting pegs facing lower-left, complete cross base | 1254 × 1254 | RGBA, transparent background |

The battle sprites share an elevated three-quarter camera and warm lighting.
Use the lower center of the visible feet/base as their floor anchor. The hero's
sword extends toward the lower-right, so preserve its full image box when
positioning or flipping the sprite. The courtyard contains no baked-in game
grid, characters, labels, or selection markers; those belong to the renderer.

These are the generator's original PNG exports. Keep transparent sprite alpha
when optimizing delivery. Load the battle assets only when needed rather than
preloading every scene on the opening screen.
