# Recorded merge conflicts and verification corrections

34 captured source heads are in scope; 34 have recorded train merges and 34 have complete successful stage receipts in this snapshot. The initial 32-head order is preserved, then newly discovered source heads follow their parents. Original PR branches were not pushed or retargeted; no develop/main merge, printer access or deployment occurred.

**31 clean source merges; 3 conflicted stages; 8 file-conflict occurrences across 6 unique files.** A repeated path in different stages is a separate occurrence, not another unique file. Hunk counts below are recorded resolution events, not guesses from final diff sizes.

Clean stages in train order: #36, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #29, #60, #62, #58, #59, #61, #63, #65, #66.

The event/source/check ledger is MERGE-CHECKS.json; run links identify actual CI, with raw input/check SHA256 receipts. This record was prepared from the preserved event ledger and reviewed before committing. It applies no patch and updates no original head.

## Textual source conflicts

| Stage | Merge commit | File | Hunks | Resolution chosen | Why |
|---|---|---|---:|---|---|
| #64 | `648faf53e8e7` | `src/router/index.ts` | 1 | Use #64 lazy route loaders, with #59 OverviewRoute/JobsRoute/CameraRoute foreign wrappers as their targets; preserve static Updating and all #63/#66 account/email/signed-out routes | Keeps other-printer behavior without undoing fast load or reintroducing router cycles; Updating must remain available during a printer restart |
| #64 | `648faf53e8e7` | `src/views/Printers.vue` | 2 | Keep printerHomePath and foreignSlugForId plus snapshot imports; retain all #59 foreign helper/control methods AND #64 snapshotTimer/onPageSnapshot watcher as separate class members | The changes are additive features. Choosing either side wholesale would discard foreign-printer controls or cached startup state; account-aware page construction remains intact |
| #68 | `b34aa4aa7a79` | `src/App.vue` | 1 | Retain #59 foreignPrinterRoute early return before #68 cloud printer/presence calculation; retain account/library section imports and #64 startup code | Foreign printers use their own local adapter state and must not be gated by cloud/M1 presence; cloud printers still get reconnecting status |
| #68 | `b34aa4aa7a79` | `src/services/muon-cloud/__tests__/directory.spec.ts` | 1 | Union imports: vi plus foreignEntries; retain both foreign-record tests and reconnecting status test/store fixture | Keep independent tests for #59 and #68 behaviors; neither import set supersedes the other |
| #68 | `b34aa4aa7a79` | `vite.config.ts` | 1 | Keep #68 globIgnores for muon_link_web assets AND #64 shellOnly manifestTransforms, existing cache size, startup and muonLinkWeb plugins and #58 envPrefix | Do not eagerly download the WASM client during service-worker install or lose fast-load shell filtering/library environment settings |
| #69 | `cc056c28b9c8` | `src/App.vue` | 1 | Union #64 startup/loader/snapshot imports with #69 deletionState/deletionBlocksView; retain #68 cloud presence and foreign-printer bypass | Deletion presentation and startup are independent; neither replaces the other |
| #69 | `cc056c28b9c8` | `src/services/muon-cloud/state.ts` | 2 | Keep #68 shared PrinterTransport, managedEndpointFactory, grant dedup/retry and borrowed sockets; add #69 deletionState import and move its requestAccess entry guard BEFORE grants lookup with Promise.reject; retain deletion pollAll cleanup | Prevents new deletion-pending requests from using cached grants or registering a key, preserves rejected-Promise semantics and shared in-flight promise identity, and avoids reverting reconnect ownership to old IrohPrinter construction. In-flight deletion during an existing retry remains a source-review risk |
| #69 | `cc056c28b9c8` | `src/views/Printers.vue` | 1 | Retain #59 foreign-augmented Directory and #64 snapshot watcher; use #69 account && !deletionPending group condition | Keep local/foreign printers available without exposing account cloud groups while deletion is pending |

## Automatic composition and related review

#64: src/sw.ts automatically combined #62 network-first navigation with #64 runtime asset caching. envPrefix composition retained the library environment settings; these were not additional textual conflicts. Review confirmed #61 accessory/reduced-motion code survived; its older #64 test double required the separate adaptation below.

#68: preserve bundled-client loading and reconnect ownership together with the already-integrated foreign-printer routing, shell filtering, startup/library plugins and account sections. #69: preserve managed/shared PrinterTransport, grant dedup/retry/borrowed sockets, foreign directory entries and snapshot watcher. Its deletion guard precedes cached-grant lookup and returns Promise.reject, preserving asynchronous errors and shared in-flight promise identity; pollAll cleanup/predicates remain.

Source candidates remain unresolved: Printers.snapshotTimer is not cleared in beforeDestroy, so a delayed write can repopulate cache after sign-out/navigation even if cleanup is later added. Wrapper chunks such as OverviewRoute-* do not align with shellOnly/native-view warm-up, so offline/prefetch behavior needs browser validation. The #69 deletion transition does not abort sessionAbort; an existing grant retry and in-flight pollOne can complete/write after pollAll clearing. These are source-review candidates, not claims of browser/printer reproduction or fixes.

## Separate verification changes

These are not counted as textual source-conflict files. CI bootstrap a91976cf957bc3f65377575a7251417f12545875 changed only .github/workflows/build.yml: explicit standalone type-check, exact npx vitest run, one thread/fork worker, requested lint command and always-run components.d.ts restore. It left publisher conditions unchanged. [Bootstrap baseline run](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38416330356) passed before source merges began.

| Stage | Failed run / head | Failure | Correction / scope | Corrected run / head |
|---|---|---|---|---|
| #59 | [38437336058](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38437336058) / `a408905ea8bf` | 10 failed / 1406 passed / 1416 total tests | `94a5ec0b2e8e` (workflow/runtime only); NODE_OPTIONS=--experimental-websocket on integration Build job | [38438379702](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38438379702) / `94a5ec0b2e8e` / success |
| #64 | [38442077373](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38442077373) / `648faf53e8e7` | 2 failed / 1533 passed / 1535 total tests | `7095fbbeec87` (test-double compatibility only); Stable sync fixture with accessories.reducedMotion, setAccessories and newPrint; unchanged arming assertions | [38442757519](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38442757519) / `7095fbbeec87` / success |

#59 runtime correction94a5ec0b enables NODE_OPTIONS=--experimental-websocket on the integration Build job. Native WebSocket is opt-in on Node20.10+; the same ten assertions then passed unchanged. The future CI/publication proposal enables this runtime on all three existing Node20 Build jobs; it remains unapplied and does not pause independent tag publication. Future local checks require Node20.10+ with the same flag.

#64 fixture correction7095fbbe changes only src/components/m1/__tests__/M1Live.spec.ts: a stable sync mock gains accessories.reducedMotion:false plus setAccessories/newPrint spies. Assertions and production code remain unchanged. The old test blob d9a825876aabcacc1fc5e638fe22b7a1aad07df9 matches captured original #64. [PR64-FIXTURE.patch](PR64-FIXTURE.patch) is the exact test adaptation that Jack must replay in the future original #64 head after its source conflicts are resolved; it is not a third source conflict.

Each original merge has its actual local component restore event before staging. Each later correction has its own recorded commit/pushed-stage event and complete new CI receipt. No extra post-merge local restore event is fabricated. CI-only/test-only commits remain separate from original merge commits and captured source-head ancestry.

## Future original-head replay

The current integration branch is a plan artifact, not a way to make the remote original PR magically mergeable. Retarget only after the parent is merged, compare the remote original head with its captured SHA, and stop if it changed or mergeability is unknown/conflicting. For #64/#68/#69, Jack must intentionally merge current develop into the verified original head in a new authorized checkout, replay that stage's recorded source choices, include any required fixture adaptation, run all six checks and restore components.d.ts before staging, commit the merge, verify the original remote head still matches, then push non-force. Recheck the intentional new head and current base/CI before the exact gh pr merge <n> --merge command. Never delete stacked branches, squash or rebase.

**Conflict sides reverse:** train ours=integrated develop and theirs=original PR. Original-head replay ours=original PR and theirs=develop. Reuse the recorded semantic choices/hunks, never blindly reuse --ours/--theirs. Preserve the future publication gate/workflow fixes and any reviewed base changes. The required #64 test patch must follow the combined #61 API; future #69 guard placement must keep the before-cache Promise.reject contract.

If original heads must remain immutable forever, use a separately authorized helper PR containing the resolved merge; originals can then become indirectly merged and every original gh command is not guaranteed to execute. A verified publication hold is mandatory before any original develop merge because production already runs #66; hold independent v* tag releases and coordinate release/checksum pins. No such release/head updates were performed in this rehearsal.

Event snapshot SHA256: `1cf46cbbcbdfa79dae8abdeeb56f5bc1e9fb46ec0d0d7ace4efcc722bd0ea44b`. Fixture patch SHA256: `1e86e334eecea94674770d2d72b5d80e0d6821ea5699a6a12d90dabc8c8cb417`. Final documentation-only CI must still be checked on the exact final PR head after root copies/commits these documents.
