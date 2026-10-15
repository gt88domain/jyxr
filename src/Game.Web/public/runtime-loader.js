// Kept as an unbundled static script so the SDK owns its relative module URLs.
const jyxrLoaderUrl = new URL(document.currentScript.src);
const jyxrRuntimeBase = new URL('.', jyxrLoaderUrl);
const jyxrRuntimeUrl = new URL('runtime/_framework/dotnet.js', jyxrRuntimeBase);
if (jyxrLoaderUrl.searchParams.has('v')) jyxrRuntimeUrl.searchParams.set('v', jyxrLoaderUrl.searchParams.get('v'));
let jyxrRuntimeTask;
window.loadJyxrRuntime = function () {
  jyxrRuntimeTask ??= import(jyxrRuntimeUrl.href)
    .then(({dotnet}) => dotnet.create());
  return jyxrRuntimeTask;
};
