import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';

const versionHash = createHash('sha256');
for (const relative of ['public/runtime/_framework/dotnet.js', 'public/data/content-package.json', 'public/runtime-loader.js']) {
  const path = new URL(relative, import.meta.url);
  if (existsSync(path)) versionHash.update(readFileSync(path));
}
const gameVersion = versionHash.digest('hex').slice(0, 16);

// The same static files must work at a domain root and at /jyxr/ on Pages.
export default defineConfig({
  base: './',
  define: {'import.meta.env.VITE_GAME_VERSION': JSON.stringify(gameVersion)},
  plugins: [{
    name: 'version-browser-runtime',
    transformIndexHtml(html) {
      return html.replace(/runtime-loader\.js(?=["'])/, `runtime-loader.js?v=${gameVersion}`);
    },
  }],
});
