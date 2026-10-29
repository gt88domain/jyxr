// QA targeting aid only. Mirrors the frozen three-cell Cleave footprint;
// it does not select, unlock or alter any runtime cast target. A nullable
// targetId describes occupancy, not permission to cast at that tile.
export function cleaveImpactTiles(source,aim){
 const target=source.x===aim.x&&source.y===aim.y?{x:source.x+1,y:source.y}:{x:aim.x,y:aim.y};
 const horizontal=Math.abs(target.x-source.x)>=Math.abs(target.y-source.y);
 return [target,horizontal?{x:target.x,y:target.y-1}:{x:target.x-1,y:target.y},horizontal?{x:target.x,y:target.y+1}:{x:target.x+1,y:target.y}];
}
export function cleaveEnemyHits(source,aim,enemies){
 const cells=cleaveImpactTiles(source,aim);
 return enemies.filter(enemy=>cells.some(cell=>cell.x===enemy.x&&cell.y===enemy.y)).length;
}
