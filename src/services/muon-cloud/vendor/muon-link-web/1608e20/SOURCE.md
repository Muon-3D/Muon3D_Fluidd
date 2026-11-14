# Source of muon-link-web

Fluidd bundles this browser client into hashed `/assets/` files. It loads the JavaScript on demand and gives
the initializer the hashed WASM URL. The one-release console fallback is `ALLOW_CONSOLE_CLIENT_FALLBACK` in `iroh.ts`.

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `1608e20c93be86e6bd78d461f7a3878a54890604`.
Built by muon-link's CI (the "Browser client (wasm32-unknown-unknown)" job, run 43503185303) and published as the
prerelease `web-1608e20c`, asset `muon-link-web-1608e20c.tar.gz`
(https://github.com/Muon-3D/muon-link/releases/tag/web-1608e20c). The glue and WASM here are that tarball's bytes;
its `SHA256SUMS` and `BUILD-INFO.json` match the lockfile. The Actions artifact was not used; the release asset is the source of the bytes.
This pin is muon-link main after #150 (the KAN-2531 library fix): a pinned Bluetooth dial refuses relay paths, and the client adds
`endpointIdOf`, `signEndpointProof` and `PrinterSession.closed()`. The notices are unchanged.

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
Vite emits the licence notices under `/licenses/muon-link-web/1608e20/`.
