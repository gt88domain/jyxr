import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync} from 'node:fs';

const versionHash = createHash('sha256');
for (const relative of ['public/runtime/_framework/dotnet.js', 'public/data/content-package.json', 'public/data/restoration-progress.json', 'public/data/restoration-checklist.json', 'public/data/original-remaining.md', 'public/data/companion-catalog.json', 'public/runtime-loader.js']) {
  const path = new URL(relative, import.meta.url);
  if (existsSync(path)) versionHash.update(readFileSync(path));
}
function hashPackDirectory(directory: URL): void {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) hashPackDirectory(path);
    else if (entry.name.endsWith('.json')) versionHash.update(entry.name).update(readFileSync(path));
  }
}
hashPackDirectory(new URL('public/data/packs/', import.meta.url));
hashPackDirectory(new URL('public/data/library/', import.meta.url));
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
