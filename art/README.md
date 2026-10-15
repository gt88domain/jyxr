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
| `green-traveler.png` | Original adult green-robed Chinese wandering swordswoman, facing lower-right; companion appearance for the opening chapter | 1254 × 1254 | RGBA, transparent background |
| `frontier-camp.png` | Low-magic western mercenary camp: timber palisade, tents, campfire and open central training ground | 1672 × 941 | Opaque |
| `frontier-forest.png` | Frontier woodland road with a broad open clearing and faint wolf tracks | 1672 × 941 | Opaque |
| `frontier-ruins.png` | Abandoned stone watchpost with an open paved courtyard, ivy and distant hills | 1672 × 941 | Opaque |
| `mercenary.png` | Original adult frontier swordsman in olive tunic and practical leather armor, with short sword and buckler, facing lower-right | 1254 × 1254 | RGBA, transparent background |
| `wolf.png` | Single natural gray wolf in an alert stance, full body facing lower-left | 1254 × 1254 | RGBA, transparent background |

The battle sprites share an elevated three-quarter camera and warm lighting.
Use the lower center of the visible feet/base as their floor anchor. The hero's
sword extends toward the lower-right, so preserve its full image box when
positioning or flipping the sprite. The courtyard contains no baked-in game
grid, characters, labels, or selection markers; those belong to the renderer.

The frontier chapter deliberately uses only three environment paintings and two
character sprites. The three scenes share warm upper-left lighting and a muted
pine-green, earth and stone palette. Their central clearings are kept open for
the renderer's tactical grid. Reuse the camp for its opening scene, world view
and training battle rather than generating additional variants. The wolf's
tail and the mercenary's sword remain inside their image bounds; preserve the
whole transparent box when scaling. The green traveler is an original design,
not a reproduction of an existing game's companion illustration.

These are the generator's original PNG exports. Keep transparent sprite alpha
when optimizing delivery. Load the battle assets only when needed rather than
preloading every scene on the opening screen.
