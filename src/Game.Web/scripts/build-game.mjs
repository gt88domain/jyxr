import {spawnSync} from 'node:child_process';
const module=process.argv[2]||process.env.GAME_MODULE||'jyx';
if(!['jyx','frontier','worlds'].includes(module))throw new Error('Unknown content module: '+module);
for(const task of ['contract','content','runtime','frontend']){
  const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run',task],{
    stdio:'inherit',env:{...process.env,GAME_MODULE:module},shell:process.platform==='win32',
  });
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
