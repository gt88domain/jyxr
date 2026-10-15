import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, cpSync, rmSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(web, '../..');
const cloud = '/workspace/.cloud-setup-jyxr';
const env = {...process.env};
// Keep the cloud image's read-only home out of SDK caches and named mutexes.
if (!env.DOTNET_ROOT && existsSync(path.join(cloud, 'dotnet/dotnet'))) {
  env.DOTNET_ROOT = path.join(cloud, 'dotnet');
  const directories = {DOTNET_CLI_HOME: 'dotnet-home', NUGET_PACKAGES: 'nuget', XDG_RUNTIME_DIR: 'runtime', XDG_CACHE_HOME: 'cache', XDG_CONFIG_HOME: 'config', XDG_DATA_HOME: 'data'};
  for (const [key, suffix] of Object.entries(directories)) {
    env[key] ??= path.join(cloud, suffix);
    mkdirSync(env[key], {recursive: true, mode: 0o700});
  }
}
env.DOTNET_CLI_TELEMETRY_OPTOUT ??= '1';
env.DOTNET_NOLOGO ??= '1';
const dotnet = env.DOTNET_ROOT ? path.join(env.DOTNET_ROOT, process.platform === 'win32' ? 'dotnet.exe' : 'dotnet') : 'dotnet';
const build = spawnSync(dotnet, ['publish', 'src/Game.Web.Runtime/Game.Web.Runtime.csproj', '-c', 'Debug', '-m:3', '--verbosity', 'minimal'], {cwd: repo, env, stdio: 'inherit'});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
const source = path.join(repo, 'src/Game.Web.Runtime/bin/Debug/net10.0/publish/wwwroot/_framework');
if (!existsSync(path.join(source, 'dotnet.js'))) throw new Error('Browser runtime bundle was not generated. Install the .NET 10 wasm-tools workload.');
const target = path.join(web, 'public/runtime/_framework');
rmSync(target, {recursive: true, force: true});
mkdirSync(path.dirname(target), {recursive: true});
cpSync(source, target, {recursive: true});
console.log('Browser runtime copied to public/runtime/_framework.');
