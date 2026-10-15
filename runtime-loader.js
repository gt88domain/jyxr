// Kept as an unbundled static script so the SDK owns its relative module URLs.
const jyxrRuntimeBase = new URL('.', document.currentScript.src);
let jyxrRuntimeTask;
window.loadJyxrRuntime = function () {
  jyxrRuntimeTask ??= import(new URL('runtime/_framework/dotnet.js', jyxrRuntimeBase).href)
    .then(({dotnet}) => dotnet.create());
  return jyxrRuntimeTask;
};
