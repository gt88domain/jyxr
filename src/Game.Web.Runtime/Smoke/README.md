# Native runtime checks

Run from the repository root with .NET 10. The native host links the same browser bridge and application services.

Normal gameplay regression, in sequence (output directory is caller-selected and not committed):

```sh
dotnet run --project src/Game.Web.Runtime/Smoke -- --campaign src/Game.Web/public/data/content-package.json /tmp/jyx-campaign new
dotnet run --project src/Game.Web.Runtime/Smoke -- --campaign src/Game.Web/public/data/content-package.json /tmp/jyx-campaign --resume
dotnet run --project src/Game.Web.Runtime/Smoke -- --campaign src/Game.Web/public/data/content-package.json /tmp/jyx-campaign --midgame
dotnet run --project src/Game.Web.Runtime/Smoke -- --campaign src/Game.Web/public/data/content-package.json /tmp/jyx-campaign --chapter2
```

Each stage resumes the previous unedited save. It uses actual creation, visible map actions, source choices, equipment, stat allocation, cultivation, paid training, auto battle and outcome handling. It never edits stats, grants inventory, marks stories complete, directly starts a story/map, or forces a battle result. The initial stage includes 20 browser-authored party practice fights; this is a normal progression check, not a claim that every action comes from the original content. Chance encounters and random rolls can vary. A resolved defeat remains a defeat and follows the original branch.

`normal-save.json`, `normal-report.json` and failure state describe what actually happened. Successful script completion alone does not prove all intended recruits, victories or endgame balance; read the reported party, level and completed stories. Current observed route reaches eight party members, level 20 and the first two mainline encounters, including one real defeat. Full normal progression through Huashan remains outstanding.

Other checks deliberately use fixtures: `--battle-items CONTENT MANAGEMENT_SAVE OUTPUT_SAVE` grants two actual talent books to a copied inventory, learns them through ItemUseService and recruits Hu Fei via the original reward segment. It then enters the original Yan Ji battle through its real world-map interaction, waits for an enemy-inflicted wound, checks ally healing and exact consumption. Its output feeds the visible browser controls in `npm run test:battle-items`. This is medicine integration evidence, not natural acquisition or whole-route completion. `--achievements` executes isolated original reward segments. `--flow` uses explicit high-stat/endgame prerequisites where documented; it is not normal-growth victory evidence.
