# Source of muon-link-web

UPDATED PIN: `022d090bc6d7b40ba823212689bec5ac649f0a67`, locally built from the
**unmerged** branch `fix/upload-progress-32k`. **Re-pin to the merge SHA after merge.**
Artifacts: `/home/ubuntu/upload-progress-route-artifact`, wasm-bindgen 0.2.127, Zig 0.16.0,
rustc 1.97.1, x86_64-unknown-linux-gnu. These are not CI release bytes.
The recipe below was used with Zig wrapper scripts. Build paths were not remapped;
WASM panic locations include the local builder's Cargo paths.
Progress is reported every 32 KiB. `PrinterSession.fetchWithProgress` and `fetch` remain compatible.
Built on main 9491295d839a17c9511b2a8413ac901562d1a8ed, including the #154 route-session API.
The notices and lockfile record this build's dependency graph and artifact hashes.

API audit against the previous 5b6aebb artifact: no JavaScript exports or class members
were removed. `MuonEndpoint.connect` adds an optional trailing `route`; `connectAs`
adds it after the existing optional `onMismatch` callback. Omitting it preserves Auto
or the legacy Bluetooth pin. `PrinterSession` adds `setRoute`, `currentPath` and
`nextRouteEvent`; `pinBluetooth` remains, deprecated. `fetch`, `fetchWithProgress`,
WebSocket and close signatures are unchanged, so Control's existing calls remain valid.
Route tokens are `auto`, `bluetooth`, `lan`, `cloud` (not Control's `ble` spelling).

Fluidd bundles this browser client into hashed `/assets/` files. It loads the JavaScript on demand and gives
the initializer the hashed WASM URL. The one-release console fallback is `ALLOW_CONSOLE_CLIENT_FALLBACK` in `iroh.ts`.

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `022d090bc6d7b40ba823212689bec5ac649f0a67`.

Toolchain (x86_64-unknown-linux-gnu): rustc 1.97.1 (8bab26f4f 2026-07-14), from rust-toolchain.toml;
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
Vite emits the licence notices under `/licenses/muon-link-web/022d090/`.
