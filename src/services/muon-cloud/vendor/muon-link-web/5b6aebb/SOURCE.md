# Source of muon-link-web

UPDATED PIN: `5b6aebb58f639d778a7556ca717b30d5eb4ce19f`, locally built from the
**unmerged** branch `fix/kan-2124-relay-upload-50mb`. **Re-pin to the merge SHA after merge.**
Artifacts: `/home/ubuntu/kan-2124-web-32k-artifact`, wasm-bindgen 0.2.127, Zig 0.16.0,
rustc 1.97.1, x86_64-unknown-linux-gnu. These are not CI release bytes.
The recipe below was used with Zig wrapper scripts. Build paths were not remapped;
WASM panic locations include the local builder's Cargo paths.
Progress is reported every 32 KiB. `PrinterSession.fetchWithProgress` and `fetch` remain compatible.
The normal WASM dependency graph is unchanged: the only Cargo.lock change is a client
dev-dependency on the existing sha2 crate. Licence texts are retained; the notices name this commit.
The lockfile records the new artifact hashes.

Fluidd bundles this browser client into hashed `/assets/` files. It loads the JavaScript on demand and gives
the initializer the hashed WASM URL. The one-release console fallback is `ALLOW_CONSOLE_CLIENT_FALLBACK` in `iroh.ts`.

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `5b6aebb58f639d778a7556ca717b30d5eb4ce19f`.

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
Vite emits the licence notices under `/licenses/muon-link-web/5b6aebb/`.
