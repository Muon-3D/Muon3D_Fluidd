# @muon3d/printer-client (vendored)

The parts of `@muon3d/printer-client` that Fluidd's **Slice** page (`src/views/Slice.vue`) uses to host the Muon3D
Slicer over `printer-bridge/1`:

- `bridge/host.ts`: `createBridgeHost`, the host's side of the protocol, which keeps its rules (printer keys, the read
  allowlist, the upload set, the start behind the host's own dialog);
- `bridge/protocol.ts`: the protocol's types and validators;
- `bridge/vectors/*.json`: the protocol's conformance vectors, which `src/services/slicer-bridge/__tests__` runs
  against Fluidd's host;
- `multipart/`: the upload's multipart body, built once, its checker and the safe-name rule;
- `errors/`: the error kinds and the parsers of the printer's answers.

Copyright 2026 Muon 3D Technologies Limited. Licensed under the Apache License, Version 2.0 (`LICENSE`, `NOTICE`),
which the GPL-3.0 of Fluidd allows it to be combined with.

The files are copied by `tools/vendor-printer-client.cjs` (each `.ts` file names its source and commit) with two
mechanical changes, which each changed file states: relative imports without the `.ts` suffix (Fluidd does not set
`allowImportingTsExtensions`), and `Object.hasOwn(a, b)` as `Object.prototype.hasOwnProperty.call(a, b)` (ES2022,
beyond Fluidd's ES2020 target). Change them in the package and copy them again; never edit them here.
