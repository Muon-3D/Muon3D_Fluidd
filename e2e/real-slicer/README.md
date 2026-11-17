# Real slicer acceptance (local)

This project deliberately lives outside the default `*.spec.ts` CI selection.
It needs the sibling muon3d-slicer checkout, its Node dependencies and its real
engine/profile assets. Use Node 24 (the slicer's mock imports TypeScript).

```sh
# In muon3d-slicer (main/v0.2.5 or newer):
npm ci
node scripts/build-printer.mjs

# In Control:
PYTHON=python3 E2E_PORT=8310 E2E_MOCK_PORT=7310 \
  npx playwright test -c e2e/playwright.real-slicer.config.ts

# Also check the release bundle, after building Control:
REAL_CONTROL_DIST="$PWD/dist" PYTHON=python3 E2E_PORT=8310 \
  npx playwright test -c e2e/playwright.real-slicer.config.ts
```

`SLICER_REPO` overrides the sibling `../muon3d-slicer` checkout.
`REAL_SLICER_DIR` overrides its `data/printer/slicer` build. Serve a **printer
build**, not the hosted website's `web/dist`: its base is `/slicer/` and its
embed-host policy admits its own origin. This is deployment configuration;
the suite never replaces the slicer's JavaScript, bridge, import worker or engine.

The four cases cover Jobs' picker and drop for STL and 3MF, the real import on
the plate, and no Moonraker upload of model files. The STL picker case also
slices, presses Print on the host printer, confirms in Control, and asserts
the real HTTP mock received G-code and started exactly the uploaded filename.
The mock is muon3d-slicer's Moonraker/M1 mock, not an iframe stand-in.
Screenshots of the plate are kept in the project's Playwright output.

The CI-capable bridge-boundary coverage remains
`e2e/control/open-in-slicer.spec.ts` (desktop and phone) and
`src/services/slicer-bridge/__tests__/handover.spec.ts`.
