// QA positioning intent only. Every returned tile must already be present in
// the host's reachable list. Diagonal goal tiles are scoring hints, never a
// generated movement command or a claim that a future route is walkable.
export function chooseFlankMove(source,enemy,reachable){
 const goals=[{x:enemy.x-1,y:enemy.y-1},{x:enemy.x-1,y:enemy.y+1},{x:enemy.x+1,y:enemy.y-1},{x:enemy.x+1,y:enemy.y+1}];
 const score=cell=>Math.min(...goals.map(goal=>Math.abs(cell.x-goal.x)+Math.abs(cell.y-goal.y)))*10+(cell.x===enemy.x||cell.y===enemy.y?5:0);
 const currentScore=score(source),candidates=reachable.filter(c=>c.x!==source.x||c.y!==source.y).map(cell=>({x:cell.x,y:cell.y,score:score(cell)})).sort((a,b)=>a.score-b.score||b.y-a.y||a.x-b.x);
 return {currentScore,candidates,cell:candidates[0]?.score<currentScore?{x:candidates[0].x,y:candidates[0].y}:null};
}
