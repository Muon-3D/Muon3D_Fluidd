# Fluidd PR map — 13 October 2026

Read-only map refreshed at 2026-10-13T18:21:17.979359Z from captured source PR metadata, fresh integration PR #67 metadata, merged-PR JSON and Git objects in C:/Users/jack/Muon3D_Fluidd. No PR, branch or printer was changed by this mapping analysis. Initial32 source metadata is preserved separately in C:/Users/jack/fluidd-train-initial32-open.json.

## Findings

- **35 open PRs: 34 source PRs plus plan-only integration draft #67.** Initial32 were #29 and #36–#66. Completion refresh found #68 (base #57, cloud reconnect/bundled client) and #69 (base #66, account follow-ups). They extend the source train while #67 remains do not merge. The redesign starts with #36; #35 is already merged.
- `origin/develop` is `f805ae141bed47ec7bd394adae9d2ff0d5ae63cc`, the merge of #35. Source heads already in develop: none. Initial32 captured heads remain unchanged; new ancestry is recorded in fluidd-train-refreshed-ancestry.json.
- **#36 needs retargeting now**: its base `feat/redesign-paths` was merged as #35. No other currently open PR targets a branch whose associated PR is already merged.
- **31 source PRs report semantic-title checks only.** Those checks validate titles, not application correctness. #29/#60/#62 have captured successful original BUILD checks with publication skipped. #67 carries the train verification; its exact fresh captured status/head appears in its row. Mergeability against a feature base does not predict sibling conflicts.
- **12 source PRs are drafts**: #29, #58, #59, #60, #61, #62, #63, #64, #65, #66, #68, #69. The separate #67 plan PR is also a draft. Jack must ready source drafts after review before merging; never ready/merge #67 as part of this sequence.
- Hosted production tip `764b9c1` (#66) includes #36–#58 and #63/#65/#66. Boxwood tip `2ead8bd` (#61) includes #36–#57/#61. Their tips were supplied by the user; this report proves Git ancestry only and did not inspect either deployment.
- Neither deployed tip includes #29/#59/#60/#62/#64/#68/#69. Hosted #66 does not include #61; Boxwood #61 does not include library/accounts (#58/#63/#65/#66). #69 descends from #66; it is not present in the older production tip itself. The train is a new combination, not a tree already exercised by one deployment.
- Repository settings checked through the GitHub API: merge commits allowed; automatic head deletion **false**. Keep automatic deletion false and never add `--delete-branch`; retaining a base branch is needed until its children have been retargeted.

## Every open base → head

Sizes compare against each listed base. Source statuses are their captured metadata; #67 is freshly read on its current head. S means title only. A Build label links to the actual reported Build state; no pending run is described as green. All rows are open; the integration row is a plan artifact.

| PR | Base → head | Head SHA | Files | + / − | CI | Draft | Dependents / retarget |
|---|---|---|---:|---:|---|---|---|
| [#29](https://github.com/Muon-3D/Muon3D_Fluidd/pull/29) | `develop` → `chore/KAN-414-control-host` | `97acd8e` | 6 | +6 / −5 | [Build SUCCESS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/37461550957/job/112262098222) + semantic | yes | host-default migration; retain with #60 |
| [#36](https://github.com/Muon-3D/Muon3D_Fluidd/pull/36) | `feat/redesign-paths` → `feat/redesign-printer-pages` | `303d21a` | 27 | +1238 / −133 | S (title only) | no | retarget now to develop; base #35 merged; base for #37 |
| [#37](https://github.com/Muon-3D/Muon3D_Fluidd/pull/37) | `feat/redesign-printer-pages` → `feat/redesign-frame` | `a2e29cb` | 39 | +2737 / −2219 | S (title only) | no | base for #38 |
| [#38](https://github.com/Muon-3D/Muon3D_Fluidd/pull/38) | `feat/redesign-frame` → `feat/redesign-printers-page` | `cdf02b6` | 27 | +3590 / −2358 | S (title only) | no | base for #39 |
| [#39](https://github.com/Muon-3D/Muon3D_Fluidd/pull/39) | `feat/redesign-printers-page` → `feat/redesign-keys` | `ba01bbe` | 16 | +1437 / −113 | S (title only) | no | base for #40 |
| [#40](https://github.com/Muon-3D/Muon3D_Fluidd/pull/40) | `feat/redesign-keys` → `feat/redesign-control` | `3927705` | 24 | +3226 / −13 | S (title only) | no | base for #41 |
| [#41](https://github.com/Muon-3D/Muon3D_Fluidd/pull/41) | `feat/redesign-control` → `feat/redesign-overview` | `3ce24a3` | 18 | +2503 / −17 | S (title only) | no | base for #42 |
| [#42](https://github.com/Muon-3D/Muon3D_Fluidd/pull/42) | `feat/redesign-overview` → `feat/redesign-jobs` | `a0ad409` | 14 | +2442 / −145 | S (title only) | no | base for #43 |
| [#43](https://github.com/Muon-3D/Muon3D_Fluidd/pull/43) | `feat/redesign-jobs` → `feat/redesign-maintenance` | `a09144f` | 17 | +1232 / −3 | S (title only) | no | base for #44 |
| [#44](https://github.com/Muon-3D/Muon3D_Fluidd/pull/44) | `feat/redesign-maintenance` → `feat/redesign-settings` | `6d554dd` | 9 | +368 / −177 | S (title only) | no | base for #45 |
| [#45](https://github.com/Muon-3D/Muon3D_Fluidd/pull/45) | `feat/redesign-settings` → `feat/redesign-camera` | `6a6cf97` | 11 | +753 / −37 | S (title only) | no | base for #46 |
| [#46](https://github.com/Muon-3D/Muon3D_Fluidd/pull/46) | `feat/redesign-camera` → `feat/redesign-m1-3d` | `eed7170` | 16 | +3574 / −6 | S (title only) | no | base for #47 |
| [#47](https://github.com/Muon-3D/Muon3D_Fluidd/pull/47) | `feat/redesign-m1-3d` → `feat/redesign-m1-print` | `6ad14a9` | 7 | +451 / −78 | S (title only) | no | base for #48 |
| [#48](https://github.com/Muon-3D/Muon3D_Fluidd/pull/48) | `feat/redesign-m1-print` → `feat/redesign-connection` | `d765dff` | 16 | +593 / −150 | S (title only) | no | base for #49 |
| [#49](https://github.com/Muon-3D/Muon3D_Fluidd/pull/49) | `feat/redesign-connection` → `feat/redesign-pro` | `6e90643` | 33 | +6027 / −281 | S (title only) | no | base for #50 |
| [#50](https://github.com/Muon-3D/Muon3D_Fluidd/pull/50) | `feat/redesign-pro` → `feat/redesign-remaining` | `f6fa88f` | 23 | +4245 / −1397 | S (title only) | no | base for #51 |
| [#51](https://github.com/Muon-3D/Muon3D_Fluidd/pull/51) | `feat/redesign-remaining` → `feat/redesign-feedback` | `315ee08` | 54 | +3497 / −954 | S (title only) | no | base for #52 |
| [#52](https://github.com/Muon-3D/Muon3D_Fluidd/pull/52) | `feat/redesign-feedback` → `feat/redesign-slicer` | `ed931d8` | 17 | +676 / −24 | S (title only) | no | base for #53 |
| [#53](https://github.com/Muon-3D/Muon3D_Fluidd/pull/53) | `feat/redesign-slicer` → `feat/redesign-updates` | `6e474b2` | 21 | +2334 / −787 | S (title only) | no | base for #54 |
| [#54](https://github.com/Muon-3D/Muon3D_Fluidd/pull/54) | `feat/redesign-updates` → `feat/redesign-m1-live` | `9a4ea27` | 15 | +2711 / −564 | S (title only) | no | base for #55 |
| [#55](https://github.com/Muon-3D/Muon3D_Fluidd/pull/55) | `feat/redesign-m1-live` → `feat/redesign-feedback-2` | `41dac9e` | 19 | +599 / −35 | S (title only) | no | base for #56 |
| [#56](https://github.com/Muon-3D/Muon3D_Fluidd/pull/56) | `feat/redesign-feedback-2` → `feat/redesign-dialogs` | `8473971` | 58 | +3333 / −991 | S (title only) | no | base for #57 |
| [#57](https://github.com/Muon-3D/Muon3D_Fluidd/pull/57) | `feat/redesign-dialogs` → `feat/redesign-feedback-3` | `77566f1` | 15 | +826 / −239 | S (title only) | no | base for #58, #59, #61, #64, #68 |
| [#58](https://github.com/Muon-3D/Muon3D_Fluidd/pull/58) | `feat/redesign-feedback-3` → `feat/redesign-library` | `5f07ffe` | 70 | +7504 / −42 | S (title only) | yes | base for #63 |
| [#59](https://github.com/Muon-3D/Muon3D_Fluidd/pull/59) | `feat/redesign-feedback-3` → `feat/KAN-527-other-printers` | `4e36acd` | 50 | +3578 / −133 | S (title only) | yes | leaf |
| [#60](https://github.com/Muon-3D/Muon3D_Fluidd/pull/60) | `develop` → `feat/KAN-414-either-console-name` | `1b59e14` | 6 | +158 / −9 | [Build SUCCESS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38328053334/job/115071218119) + semantic | yes | dual-host compatibility; complements #29 |
| [#61](https://github.com/Muon-3D/Muon3D_Fluidd/pull/61) | `feat/redesign-feedback-3` → `feat/KAN-526-m1-animations` | `2ead8bd` | 10 | +1351 / −13 | S (title only) | yes | leaf |
| [#62](https://github.com/Muon-3D/Muon3D_Fluidd/pull/62) | `develop` → `fix/sw-navigations-reach-the-server` | `02499de` | 4 | +95 / −3 | [Build SUCCESS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38333942722/job/115089704700) + semantic | yes | leaf |
| [#63](https://github.com/Muon-3D/Muon3D_Fluidd/pull/63) | `feat/redesign-library` → `feat/KAN-533-account-shell` | `ec1463c` | 26 | +2884 / −114 | S (title only) | yes | base for #65 |
| [#64](https://github.com/Muon-3D/Muon3D_Fluidd/pull/64) | `feat/redesign-feedback-3` → `feat/KAN-525-fast-load` | `bb2d04a` | 18 | +1183 / −36 | S (title only) | yes | leaf |
| [#65](https://github.com/Muon-3D/Muon3D_Fluidd/pull/65) | `feat/KAN-533-account-shell` → `feat/KAN-533-account-sections` | `77f9cfa` | 25 | +4258 / −28 | S (title only) | yes | base for #66 |
| [#66](https://github.com/Muon-3D/Muon3D_Fluidd/pull/66) | `feat/KAN-533-account-sections` → `feat/KAN-533-sign-out` | `764b9c1` | 22 | +2502 / −226 | S (title only) | yes | base for #69 |
| [#67](https://github.com/Muon-3D/Muon3D_Fluidd/pull/67) | `develop` → `integration/redesign-train` | `cc056c2` | 467 | +83644 / −9092 | [Build SUCCESS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38444994291/job/115460942131) + semantic | yes | PLAN ONLY: do not merge; current train CI |
| [#68](https://github.com/Muon-3D/Muon3D_Fluidd/pull/68) | `feat/redesign-feedback-3` → `feat/KAN-531-reconnect` | `4e71404` | 33 | +12723 / −84 | S (title only) | yes | completion refresh; base #57; reconnect/bundled client |
| [#69](https://github.com/Muon-3D/Muon3D_Fluidd/pull/69) | `feat/KAN-533-sign-out` → `feat/KAN-533-followups` | `fc33f37` | 35 | +1379 / −67 | S (title only) | yes | completion refresh; base #66; account follow-ups |

## Already merged

The API records #2–#28 and #30–#35 as merged. #29 remains open. All their recorded merge commits are ancestors of develop except #26, which merged into #22’s branch and reached develop through #22’s squash commit `07c9178`; do not replay #26. Historical squash merges mean that many old original heads are not ancestors of develop even though their merged result is present.

| PR | Former head | Merged at (UTC) | Merge result | Result ancestor of develop |
|---|---|---|---|---|
| [#2](https://github.com/Muon-3D/Muon3D_Fluidd/pull/2) | `codex/power-fan-ui` | 2026-05-06T15:01:14Z | `31434c5` | yes |
| [#3](https://github.com/Muon-3D/Muon3D_Fluidd/pull/3) | `fix/dev-mode-status-off-floor` | 2026-09-15T22:59:43Z | `5f3d40c` | yes |
| [#4](https://github.com/Muon-3D/Muon3D_Fluidd/pull/4) | `fix/KAN-371-dev-mode-consent-flow` | 2026-09-21T14:51:09Z | `64294dd` | yes |
| [#5](https://github.com/Muon-3D/Muon3D_Fluidd/pull/5) | `feat/KAN-364-local-printer-discovery` | 2026-09-21T13:48:30Z | `4a0f782` | yes |
| [#6](https://github.com/Muon-3D/Muon3D_Fluidd/pull/6) | `codex/fix-hotspot-password` | 2026-09-21T13:35:32Z | `4cc2e2a` | yes |
| [#7](https://github.com/Muon-3D/Muon3D_Fluidd/pull/7) | `codex/muonos-fluidd-overhaul` | 2026-09-22T15:00:45Z | `7b8001a` | yes |
| [#8](https://github.com/Muon-3D/Muon3D_Fluidd/pull/8) | `feat/KAN-374-fluidd-design-overhaul` | 2026-09-23T09:49:47Z | `4ecb7f3` | yes |
| [#9](https://github.com/Muon-3D/Muon3D_Fluidd/pull/9) | `feat/KAN-372-muon-rebrand` | 2026-09-23T17:18:25Z | `9694dec` | yes |
| [#10](https://github.com/Muon-3D/Muon3D_Fluidd/pull/10) | `codex/hotspot-state-sync` | 2026-09-23T17:05:43Z | `b49f1ee` | yes |
| [#11](https://github.com/Muon-3D/Muon3D_Fluidd/pull/11) | `feat/muon-cloud-accounts` | 2026-09-23T17:08:52Z | `fe3c3e2` | yes |
| [#12](https://github.com/Muon-3D/Muon3D_Fluidd/pull/12) | `feat/KAN-375-apple-style` | 2026-09-24T13:47:12Z | `9a929b6` | yes |
| [#13](https://github.com/Muon-3D/Muon3D_Fluidd/pull/13) | `feat/KAN-191-protected-ux` | 2026-09-24T15:03:48Z | `cc3653e` | yes |
| [#14](https://github.com/Muon-3D/Muon3D_Fluidd/pull/14) | `fix/KAN-408-app-host-self-probe` | 2026-09-26T11:44:54Z | `7b63e73` | yes |
| [#15](https://github.com/Muon-3D/Muon3D_Fluidd/pull/15) | `fix/KAN-376-hotspot-origin-and-qr` | 2026-09-26T11:44:58Z | `b7d83ed` | yes |
| [#16](https://github.com/Muon-3D/Muon3D_Fluidd/pull/16) | `fix/KAN-409-aux-over-printer-transport` | 2026-09-26T11:45:02Z | `a7113db` | yes |
| [#17](https://github.com/Muon-3D/Muon3D_Fluidd/pull/17) | `feat/KAN-203-setup-shell` | 2026-09-26T11:45:06Z | `d16bca0` | yes |
| [#18](https://github.com/Muon-3D/Muon3D_Fluidd/pull/18) | `feat/KAN-401-link-path-form` | 2026-09-30T13:46:28Z | `8ea97e6` | yes |
| [#19](https://github.com/Muon-3D/Muon3D_Fluidd/pull/19) | `fix/nearby-reachable-address` | 2026-09-28T11:28:55Z | `db63b25` | yes |
| [#20](https://github.com/Muon-3D/Muon3D_Fluidd/pull/20) | `fix/KAN-423-link-start-json` | 2026-09-28T11:35:18Z | `4ddf9b8` | yes |
| [#21](https://github.com/Muon-3D/Muon3D_Fluidd/pull/21) | `fix/KAN-423-link-status-reasons` | 2026-09-29T01:00:26Z | `ba13cd2` | yes |
| [#22](https://github.com/Muon-3D/Muon3D_Fluidd/pull/22) | `feat/KAN-434-web-bluetooth` | 2026-09-30T22:41:07Z | `07c9178` | yes |
| [#23](https://github.com/Muon-3D/Muon3D_Fluidd/pull/23) | `fix/KAN-423-cloud-no-access-reads` | 2026-09-29T01:00:32Z | `d61f815` | yes |
| [#24](https://github.com/Muon-3D/Muon3D_Fluidd/pull/24) | `fix/KAN-423-local-printer-blocked` | 2026-09-29T01:50:02Z | `5aa1667` | yes |
| [#25](https://github.com/Muon-3D/Muon3D_Fluidd/pull/25) | `fix/KAN-423-address-dialog-blocked` | 2026-09-30T13:46:35Z | `a11da46` | yes |
| [#26](https://github.com/Muon-3D/Muon3D_Fluidd/pull/26) | `feat/KAN-436-web-bluetooth-setup` | 2026-09-30T22:29:11Z | `e4519f4` | via #22 squash |
| [#27](https://github.com/Muon-3D/Muon3D_Fluidd/pull/27) | `feat/WEB-12-central-sign-in` | 2026-10-06T10:47:16Z | `13645ce` | yes |
| [#28](https://github.com/Muon-3D/Muon3D_Fluidd/pull/28) | `feat/printer-list-one-entry` | 2026-10-06T13:49:26Z | `9204def` | yes |
| [#30](https://github.com/Muon-3D/Muon3D_Fluidd/pull/30) | `fix/iroh-upload-multipart-once` | 2026-10-08T10:00:06Z | `36f28ff` | yes |
| [#31](https://github.com/Muon-3D/Muon3D_Fluidd/pull/31) | `feat/slice-route` | 2026-10-09T11:34:55Z | `8119698` | yes |
| [#32](https://github.com/Muon-3D/Muon3D_Fluidd/pull/32) | `fix/printer-to-printer-local-names` | 2026-10-09T13:08:28Z | `085b6c5` | yes |
| [#33](https://github.com/Muon-3D/Muon3D_Fluidd/pull/33) | `fix/reconnect-after-a-drop` | 2026-10-09T13:08:50Z | `dafaa2a` | yes |
| [#34](https://github.com/Muon-3D/Muon3D_Fluidd/pull/34) | `fix/load-without-waiting` | 2026-10-09T13:11:29Z | `b3c618f` | yes |
| [#35](https://github.com/Muon-3D/Muon3D_Fluidd/pull/35) | `feat/redesign-paths` | 2026-10-11T13:27:55Z | `f805ae1` | yes |

## Supersession versus accumulation

The linear #36→…→#57 heads include their parents by ancestry. #58→#63→#65→#66→#69 does the same. #68 branches from #57 and replaces/refines cloud reconnect/client loading; it is not an account-stack descendant. Later heads carry earlier work; that does not make earlier PRs dispensable in the requested audited bottom-up merge history.

Later work refines earlier implementations: #37–#38 navigation; #48 connections; #49–#51 pages; #54–#55 live M1/input/material; #56 dialogs; #57 slicer persistence/hose connectors; #61 animation. #64 follows the initial account stack and makes routes/startup/precache load differently. Refreshed #68/#69 then follow that proven initial32 order; they must preserve #64 loading and earlier sibling features. These are follow-ups, not reasons to drop parent PRs.

**#60 is not a complete supersession of #29.** #29 changes `.env.production` from `https://app.muon3d.com` to `https://control.muon3d.com` and updates comments plus a hotspot-origin test. #60 does not contain #29 and keeps `.env.production` pointing to app; it changes authentication/cloud APIs to accept the two approved HTTPS console names, preserving the origin used by each page. Thus #60 supersedes the assumption that only one name can work, but #29 still supplies the chosen default migration for printer-served builds. Merge both in the train, #29 before #60, and flag the external migration dependencies.

## Retargeting and GitHub replay feasibility

For `36..57, 29, 60, 62, 58, 59, 61, 63, 65, 66, 64, 68, 69`, retarget #36 after its already-merged parent35; #37..57 after their preceding parent; #58/#59/#61/#64/#68 after #57; #63 after #58; #65 after #63; #66 after #65; #69 after #66. #29/#60/#62 already target develop. #67 stays plan-only. Base edits/ready-for-review do not guarantee fresh BUILD under default activity types; require fresh head/base Build or local prospective-tree six-check verification. gh pr checks --watch alone cannot trigger missing checks. [GitHub event defaults](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).

`gh pr merge <n> --merge` uses the head/base refs on GitHub. It has no option to take conflict resolutions from the integration branch. Once a sibling makes a later original PR conflict with develop, the original command cannot complete solely because a local integration merge was resolved. [GitHub CLI merge options](https://cli.github.com/manual/gh_pr_merge) and [GitHub conflict-resolution workflow](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line) establish this boundary.

The plan must keep exact requested original-PR commands, but mark conflict boundaries as **stop gates**, not an executable unattended script. At a boundary, Jack can later authorize/update that PR’s head with the tested resolution and rerun checks, then run the original command. If existing heads must remain immutable forever, a newly created helper PR carrying the resolved merge is necessary; after that helper is merged the original head is already included and its original PR may be marked merged indirectly, so the helper path cannot promise every original `gh pr merge <n> --merge` runs. This train alone proves a compatible combined tree, not that GitHub can reproduce manual resolutions without these choices.

## CI and publishing boundaries

Original BUILD runs on PR bases develop/master, not feature bases; standalone requested type-check was additional. Integration #67 augments verification at a91976c, and a separate94a5ec0b opts into native WebSocket on Node20.10+. Original #59 tests otherwise fail on Node20; the separately reviewed future CI proposal must carry the runtime opt-in. Draft status itself is not what prevented BUILD on feature bases.

#67 retains the requested Integration title. Its fresh labels include `ignore-semantic-pull-request`. The workflow supports ignore-semantic-pull-request for this plan-only title; semantic success is not application verification.

Integration pushes do not match publisher branch filters; draft PR BUILD skips Docker/host publication. Actual develop merges deploy intermediate older application trees even though production already runs #66, and replace mutable development/fluidd.zip. A verified publication hold is mandatory before original merges; coordinate archive/checksum pins and independent v* tag releases. The publication guard is a future unapplied proposal, while integration verification-only workflow changes are explicitly recorded. This mapping analysis performed no deployment or workflow mutation.
