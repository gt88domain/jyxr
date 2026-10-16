# Missing instruction evidence

The pinned data submodule remains the content baseline. The user's uploaded X1.0.0.1 archive supplies additional instruction evidence where the reference source omits MapUI. Its assembly was inspected as data and never loaded or executed.

`jygame_Data/Managed/Assembly-CSharp.dll` SHA-256:
`a9d1456b1fa5e09f9e39a18c66564612da2aa4c7c83db6ff34430d436b872b4a`.

## MINUS_MAXPOINTS

`MapUI.ExecuteAction` dispatch entry 30 points to IL `0x153b`. It parses the second argument, converts to float, multiplies by `0.1f`, then multiplies and truncates max HP, max MP, unspent points and all ten dimensions separately. The dialogue at `0x16c9` says `气血、内力、全属性降为【` + argument + `成】！`.

Consequently `主角#5` retains **50%**, rather than removing five points or five percent. The compiler uses the existing `CharacterService.ScaleStats(..., 0.5)`, which covers the same stats and unspent points. These explicit source arguments stay within `0..10`. Current HP/MP are clamped to the new maxima by the modern service.

## 黑衣 talent identity

The pinned `storys.xml` grants `主角#黑衣`, but its `resource.xml` lacks a talent description. The same assembly's `LEARN.TALENT` dispatch entry 49 (`0x2c8c..0x2d51`) inserts the original ID into `Role.Talents` after checking for duplicates; it does not require a description resource. The pinned C# `Resource.GetTalentCost` returns zero when that resource is absent, and `GetTalentDesc` returns null.

The browser therefore registers the declared identity with its original name, zero cost and empty description/affixes. This prevents a missing description from quarantining the entire Xiangyang choice tree. It does **not** invent a combat bonus or imply that undocumented Lua behavior has been restored. The fallback is listed separately in the generated migration audit; the original resource count remains 157, with one additional script-declared identity.

## Story acupoint game (TOUCH)

The pinned `touch.xml` and uploaded `touch.txt` match for all five subject definitions, including image keys and zones. The same uploaded assembly supplies the missing UI behavior:

| Method | Verified behavior |
| --- | --- |
| `TouchUI..ctor` (RVA `0x340dc`) | Eight points, minimum separation 80 in either axis, five rounds. |
| `TouchUI.startNewRound` (`0x34384`) | Each next point starts after a cumulative random interval of 0.3–0.5 seconds. |
| `TouchUI.getTouchPoint` (`0x344b4`) | Pick an original XML zone and random integer coordinates; retry when both coordinate distances from any existing point are below 80. |
| `TouchPoint..ctor` (`0x33dcc`) | Three-second lifetime; perfect/good/early windows 0.2/0.4/0.6 seconds. |
| `TouchPoint.onClick` (`0x33f80`) | Aim at age 1.5 seconds. Too-early clicks are ignored. Strict absolute error <0.2 scores 3, <0.4 scores 1, otherwise 0; accepted hits resolve once. |
| `TouchUI.finishARound` (`0x34250`) | After all five rounds, total score >=100 returns `win`, otherwise `lose`. |

Presentation simulation handles timing and scoring. The runtime accepts only start/pause/resume/hit/quit inputs and advances its own stopwatch; it never accepts a submitted score, duration or outcome. The compiler follows the original TOUCH `win`/`lose` result trees after the host finishes. Quitting is an explicit modern control and follows failure, including when partially accumulated score already exceeds 100.

The modern responsive panel reuses the already deployed original subject images and numbered point icons; no media is generated or newly uploaded. The original Unity animation timeline, sound, identical random sequence and pixel layout are not claimed. Positions are mapped from the XML coordinates around the original image center; mobile hit buttons have a 44px minimum.
