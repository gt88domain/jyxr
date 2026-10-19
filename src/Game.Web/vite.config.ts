import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, cpSync, mkdirSync} from 'node:fs';

const versionHash = createHash('sha256');
for (const relative of ['public/runtime/_framework/dotnet.js', 'public/data/packs/index.json', 'public/data/packs/frontier/content-package.json', 'public/data/module-manifest.json', 'public/runtime-loader.js']) {
  const path = new URL(relative, import.meta.url);
  if (existsSync(path)) versionHash.update(readFileSync(path));
}
const gameVersion = versionHash.digest('hex').slice(0, 16);

// The same static files must work at a domain root and at /jyxr/ on Pages.
export default defineConfig({
  base: './',
  build: {copyPublicDir:false},
  define: {'import.meta.env.VITE_GAME_VERSION': JSON.stringify(gameVersion)},
  plugins: [{
    name: 'version-browser-runtime',
    transformIndexHtml(html) {
      return html.replace(/runtime-loader\.js(?=["'])/, `runtime-loader.js?v=${gameVersion}`);
    },
    closeBundle() {
      const manifest=JSON.parse(readFileSync(new URL('content/frontier/manifest.json',import.meta.url),'utf8'));
      const files=['runtime-loader.js','favicon.svg','runtime','data/packs/index.json','data/packs/frontier','data/module-manifest.json',...manifest.assets.map((asset:{path:string})=>asset.path)];
      for(const relative of files){
        const source=new URL('public/'+relative,import.meta.url),target=new URL('dist/'+relative,import.meta.url);
        mkdirSync(new URL('.',target),{recursive:true});cpSync(source,target,{recursive:true});
      }
    },
  }],
});
