#!/usr/bin/env python3
"""Verify retained NuGet archives before using the installed WASM workload.

Run after `dotnet workload install wasm-tools --skip-manifest-update` and
before building. No trust/signature/TLS checks are disabled. A missing archive
or nonzero `dotnet nuget verify --all` result fails setup.
"""

import os
from pathlib import Path
import shutil
import subprocess
import sys


def main() -> int:
    configured = os.environ.get("DOTNET_ROOT")
    dotnet = Path(configured) / ("dotnet.exe" if os.name == "nt" else "dotnet") if configured else Path(shutil.which("dotnet") or "")
    if not dotnet.is_file():
        raise RuntimeError("Set DOTNET_ROOT or add the .NET SDK to PATH before verifying the workload.")
    dotnet = dotnet.resolve()
    sdk_root = dotnet.parent
    packs = sdk_root / "packs"
    groups = [
        "Microsoft.NETCore.App.Runtime.AOT.*.Cross.browser-wasm",
        "Microsoft.NET.Runtime.WebAssembly.Sdk",
        "Microsoft.NET.Runtime.MonoTargets.Sdk",
        "Microsoft.NET.Runtime.MonoAOTCompiler.Task",
        "Microsoft.NET.Runtime.Emscripten.*.Cache.*",
        "Microsoft.NET.Runtime.Emscripten.*.Node.*",
        "Microsoft.NET.Runtime.Emscripten.*.Sdk.*",
        "Microsoft.NETCore.App.Runtime.Mono.browser-wasm",
    ]
    archives = []
    for pattern in groups:
        matches = sorted({archive for directory in packs.glob(pattern) for archive in directory.glob("*/*.nupkg")})
        if not matches:
            raise RuntimeError(f"Missing retained workload archive for {pattern}; reinstall the workload before building.")
        archives.extend(matches)

    sdk_archives = sorted((sdk_root / "library-packs").glob("microsoft.net.sdk.webassembly.pack.*.nupkg"))
    if not sdk_archives:
        raise RuntimeError("Missing retained Microsoft.NET.Sdk.WebAssembly.Pack archive in DOTNET_ROOT/library-packs.")
    archives.extend(sdk_archives)

    for archive in dict.fromkeys(archives):
        print(f"Verifying {archive}", flush=True)
        subprocess.run([str(dotnet), "nuget", "verify", "--all", str(archive)], check=True)
    print(f"Verified {len(set(archives))} retained WASM workload archives.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"WASM workload verification failed: {error}", file=sys.stderr)
        sys.exit(1)
