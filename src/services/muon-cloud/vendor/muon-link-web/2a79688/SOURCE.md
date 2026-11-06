# Source of muon-link-web

Fluidd bundles this browser client into hashed `/assets/` files. It loads the JavaScript on demand and gives
the initializer the hashed WASM URL. The one-release console fallback is `ALLOW_CONSOLE_CLIENT_FALLBACK` in `iroh.ts`.

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `2a796885b777e2209575781fae5b9a35b1ac0690`.
Built by muon-link's CI (the "Browser client (wasm32-unknown-unknown)" job, run 42194688566) and published as the
prerelease `web-2a796885`, asset `muon-link-web-2a796885.tar.gz`
(https://github.com/Muon-3D/muon-link/releases/tag/web-2a796885). The glue and WASM here are that tarball's bytes;
its `SHA256SUMS` and `BUILD-INFO.json` match the lockfile. The Actions artifact was not usable (storage quota, 6 Nov 2026).
This pin adds `MuonEndpoint.pinBluetooth` (muon-link#128) and the I-170 held-connection client to browser Bluetooth
(`MuonEndpoint.addLink`) and relay access.

Toolchain (CI, x86_64-unknown-linux-gnu): rustc 1.97.1 (8bab26f4f 2026-07-14), from rust-toolchain.toml;
wasm-bindgen 0.2.127 (release binary, SHA-256 checked); zig 0.16.0 (ziglang, -target wasm32-freestanding).
CI does not remap build paths, so panic locations in the WASM name `/home/runner/.cargo/registry/...`.

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
Vite emits the licence notices under `/licenses/muon-link-web/2a79688/`.
