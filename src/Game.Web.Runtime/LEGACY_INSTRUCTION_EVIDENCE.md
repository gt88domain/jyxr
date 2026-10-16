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
