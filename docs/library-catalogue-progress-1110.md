# Fusion Library catalogue: PROGRESS

Brief: Muon_Internal_Documentation `devin-briefs/fusion-library-catalogue-1110.md`. Goal: the Library as an App Store-quality model catalogue across Control, the app, the standalone site, the slicer and Design. All PRs are drafts; nothing is merged or deployed by this project.

## Milestones

| # | Milestone | Status | PRs |
| --- | --- | --- | --- |
| 1 | Audit and plan | Draft open | model-service [#190](https://github.com/Muon-3D/muon3d-model-service/pull/190) |
| 2 | Offline fix integration (on MuonOS #502) | Next | |
| 3 | Backend: categories, search, shelves, collections, saves, seed | Planned | |
| 4 | Discover and Browse (web, then app) | Planned | |
| 5 | Model page | Planned | |
| 6 | Collections and Yours | Planned | |
| 7 | Upload and publish, moderation queue | Planned | |
| 8 | Print to printer, both clients | Planned | |
| 9 | Integrations: slicer, Design, identity, notifications | Planned | |
| 10 | Polish: accessibility, responsive, performance, states, themes | Planned | |
| 11 | Coverage sweep and final report | Planned | |

## Carried forward (not duplicated)
- MuonOS #502 (Harry, `/models/` proxy): built on, no second proxy PR.
- Control #349 (honest offline message), #318 (Library defaults), #250 (Design at /design).
- model-service #188 (type filter, shared-with-me), #189 (exact CORS list).
- app #292 (Discover v2), #294 (Yours v2), #285 (iOS Print from Library).
- slicer #34 (open a Library link), Design #57 (merged, Save to Library).

## Assumptions
- "Continue" is local recents per device until a cross-device history contract exists.
- No ratings are fabricated: the rating filter and sort appear only when real ratings exist.
- "Open in Design" opens an exported model until Design has a native document reopen contract.
- CONTROL-MASTER-LIST.md section 8 (LB-01 to LB-05) was not found in the repos available; fidelity is judged against the merged v3 pages (#271, #275, #276, #281, #308), the app's design/ws16 and the design system.
- Seed content is our own generated primitives (licence recorded in `data/examples/manifest.json`); no model claims an M1-tested plate without hardware evidence.

## Risks
- Several open PRs (#292, #294, #318, #349, #502) overlap the Library shell; milestone PRs stack on them and will need rebasing as they land.
- Printer-side reachability (CORS, proxy) is verified in source and e2e only; bench checks are Jack's.

## Bench and device checklist (Jack)
- (filled in as milestones land)
