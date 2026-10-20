import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, cpSync, mkdirSync} from 'node:fs';

const moduleId=process.env.GAME_MODULE||'jyx';
if(!['jyx','frontier','worlds'].includes(moduleId))throw new Error('Unknown content module: '+moduleId);
const manifest=JSON.parse(readFileSync(new URL(`content/${moduleId}/manifest.json`,import.meta.url),'utf8'));
const resources=[...(manifest.assets||JSON.parse(readFileSync(new URL(`content/${moduleId}/${manifest.inventory}`,import.meta.url),'utf8')).files),...(manifest.localAssets||[])];
const runtimePackId=manifest.runtimePackId||moduleId;
const title=manifest.title||(moduleId==='frontier'?'灰烬边境 · 佣兵的第一份委托':'金庸群侠传 X');
const generatedPath=new URL('public/data/module-manifest.json',import.meta.url);
const indexPath=new URL('public/data/packs/index.json',import.meta.url);
if(!existsSync(generatedPath)||!existsSync(indexPath))throw new Error('Run npm run content before starting the frontend.');
const generated=JSON.parse(readFileSync(generatedPath,'utf8'));
const catalog=JSON.parse(readFileSync(indexPath,'utf8'));
if(generated.id!==moduleId||catalog.defaultPackId!==runtimePackId||catalog.packs.length!==1||catalog.packs[0].id!==runtimePackId)
  throw new Error(`Content/app module mismatch: generate ${moduleId} content before building or starting its frontend.`);

const versionHash = createHash('sha256');
const packFiles=[...new Set(catalog.packs.flatMap((pack:{url:string;localeUrls?:Record<string,string>})=>[pack.url,...Object.values(pack.localeUrls||{})]))].map(relative=>'public/data/'+relative);
for (const relative of ['public/runtime/_framework/dotnet.js', 'public/data/packs/index.json', ...packFiles, 'public/data/module-manifest.json', 'public/runtime-loader.js']) {
  const path = new URL(relative, import.meta.url);
  if (existsSync(path)) versionHash.update(readFileSync(path));
}
const gameVersion = versionHash.digest('hex').slice(0, 16);

// The same static files must work at a domain root and at /jyxr/ on Pages.
export default defineConfig({
  base: './',
  build: {copyPublicDir:false},
  define: {'import.meta.env.VITE_GAME_VERSION': JSON.stringify(gameVersion),'__GAME_APP__':JSON.stringify(manifest.app)},
  plugins: [{
    name: 'version-browser-runtime',
    transformIndexHtml(html) {
      return html.replace(/runtime-loader\.js(?=["'])/, `runtime-loader.js?v=${gameVersion}`)
        .replace('<html lang="zh-CN">',`<html lang="${manifest.locale||'zh-CN'}">`)
        .replace(/<title>.*?<\/title>/,`<title>${title}</title>`)
        .replace('<!--MODULE_TITLE-->',title).replace('<!--MODULE_SEAL-->',title.slice(0,1));
    },
    closeBundle() {
      const files=['runtime-loader.js','favicon.svg','runtime','data/packs/index.json',`data/packs/${moduleId}`,'data/module-manifest.json',...resources.map((asset:{path:string})=>asset.path)];
      for(const relative of files){
        const source=new URL('public/'+relative,import.meta.url),target=new URL('dist/'+relative,import.meta.url);
        mkdirSync(new URL('.',target),{recursive:true});cpSync(source,target,{recursive:true});
      }
    },
  }],
});
