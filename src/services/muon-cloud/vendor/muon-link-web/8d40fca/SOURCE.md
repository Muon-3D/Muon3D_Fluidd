# Source of muon-link-web

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `8d40fca4068171599a43f12297798c077160262c`
(muon-link main; contains #155 `2549e752`, which reports upload progress every 32 KiB).
Built by muon-link's CI (the "Browser client (wasm32-unknown-unknown)" job, run 43998507123,
https://github.com/Muon-3D/muon-link/actions/runs/43998507123) and published as the prerelease `web-8d40fca4`, asset
`muon-link-web-8d40fca4.tar.gz` (https://github.com/Muon-3D/muon-link/releases/tag/web-8d40fca4, tarball SHA-256
`5e96e85dc61459cf636a6c999a5f4bae1a2e0d4a033aaa550ff91e869f90b5c8`). The glue and WASM here are that tarball's bytes;
its `SHA256SUMS` and `BUILD-INFO.json` match the lockfile. CI does not remap build paths, so panic locations in the WASM name
`/home/runner/.cargo/registry/...`.

SHA-256 of the CI-built files:
- `muon_link_web.js` `1bd3878e96e2c16291d92c006463d1f70f49120b7587122907dd7e2fa5557eb3`
- `muon_link_web_bg.wasm` `855c20f584c70d9afd5e15a962638d5e483152acc139d8bd6bfe4aa326e6b433`

Progress is reported every 32 KiB. `PrinterSession.fetchWithProgress` and `fetch` remain compatible. Only
`crates/muon-link-web/src/lib.rs` changed since 9491295d (no Cargo, licence or notice change), so the notices and dependency list are unchanged.

API audit against the previous 5b6aebb artifact: no JavaScript exports or class members
were removed. `MuonEndpoint.connect` adds an optional trailing `route`; `connectAs`
adds it after the existing optional `onMismatch` callback. Omitting it preserves Auto
or the legacy Bluetooth pin. `PrinterSession` adds `setRoute`, `currentPath` and
`nextRouteEvent`; `pinBluetooth` remains, deprecated. `fetch`, `fetchWithProgress`,
WebSocket and close signatures are unchanged, so Control's existing calls remain valid.
Route tokens are `auto`, `bluetooth`, `lan`, `cloud` (not Control's `ble` spelling).

Fluidd bundles this browser client into hashed `/assets/` files. It loads the JavaScript on demand and gives
the initializer the hashed WASM URL. The one-release console fallback is `ALLOW_CONSOLE_CLIENT_FALLBACK` in `iroh.ts`.

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `8d40fcabc6d7b40ba823212689bec5ac649f0a67`.

Toolchain (CI, x86_64-unknown-linux-gnu): rustc 1.97.1 (8bab26f4f 2026-07-14), from rust-toolchain.toml;
wasm-bindgen 0.2.127 (release binary, SHA-256 checked); zig 0.16.0 (ziglang, -target wasm32-freestanding).

```sh
rustup target add wasm32-unknown-unknown  # toolchain 1.97.1 (rust-toolchain.toml)
CC_wasm32_unknown_unknown="zig cc -target wasm32-freestanding, --target=* dropped"  AR_wasm32_unknown_unknown="zig ar"  # ziglang 0.16.0
cargo build --release --target wasm32-unknown-unknown -p muon-link-client -p muon-link-web --locked
wasm-bindgen --target web --out-dir pkg --out-name muon_link_web target/wasm32-unknown-unknown/release/muon_link_web.wasm
```

`LICENSE` is muon-link's at that commit. `THIRD-PARTY-NOTICES.md` was generated with the Muon3D Slicer's
`scripts/build-muon-link-web.mjs` notices code (cargo tree and the crates' own licence files) at that commit. The same
code reproduces the previous pin's notices byte for byte.

The build and Vitest verify every file against `muon-link-web.lock.json`. To update the pin, take a newer
`web-<sha8>` release (or build a clean source commit), copy the glue, WASM and licence notices, record their SHA-256
hashes, and update the two imports in `iroh.ts` and the module path in `bundled-client.spec.ts`.
Vite emits the licence notices under `/licenses/muon-link-web/8d40fca/`.
