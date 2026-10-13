# Redesign train timing evidence — 13 October 2026

**Complete: 34/34 captured source stages have complete successful, hash-verified head/tree-associated receipts.** 34 captured heads have recorded merge commits. The initial 32-stage snapshot/order is preserved separately; completion refresh adds #68, #69. Pending/failed stages contribute no invented durations. Baseline, laptop dependency setup and final documentation-only CI are excluded.

| Metric | Observation | What it measures |
|---|---:|---|
| Six-check gate sum | 103.8 min | Successful selected stage executions, with step handoff |
| Maximum six-check gate | 4.1 min | Slowest observed successful stage |
| Median six-check gate | 3.1 min | Median observed successful stage |
| Full Build-job log sum | 129.5 min | Runner execution with install/artifact overhead; queue excluded |
| Explicit full workflow timing | not supplied | No workflow timestamps are fabricated |
| First merge → latest six-check end | 190.7 min | Actual train interval; includes queue/controller/resolution delays |
| First merge → latest restore | 190.7 min | Includes required CI declaration restore |
| First merge → latest receipt | 191.0 min | Also includes receipt retrieval latency |
| All distinct attempts, logged gate intervals | 109.9 min | Includes partial failed runs and retries, without double counting |

All distinct attempt Build-job log windows, including failures/retries: **137.3 min** across 36 runs. The selected successful-stage job total above does not conceal this additional execution cost.

The gate/job sums exclude GitHub queue transparently; the actual train interval includes it. The normalized run metadata does not expose exact workflow start/completion or exact queue durations. Push-to-first-log lag includes dispatch and provisioning as well as queue, so subtracting it and calling the result queue-free wall time would overstate the evidence. Older Python needs Actions' seven-digit log fractions normalized to six digits for arithmetic; original timestamps remain in the JSON.

| PR | State / CI | Six gates s | Build log wall s | Push→first log s | Tests / files | /setup |
|---|---|---:|---:|---:|---|---|
| #36 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38419197273) | 139.353 | 215.742 | 10.029 | 795/795 / 76/76 | 637 KB / 900 KB |
| #37 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38421011883) | 164.599 | 238.094 | 11.037 | 830/830 / 79/79 | 648 KB / 900 KB |
| #38 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38421679804) | 186.161 | 264.482 | 8.932 | 851/851 / 80/80 | 638 KB / 900 KB |
| #39 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38422418412) | 185.996 | 264.406 | 9.777 | 867/867 / 83/83 | 645 KB / 900 KB |
| #40 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38423164429) | 196.312 | 274.841 | 9.502 | 893/893 / 84/84 | 659 KB / 900 KB |
| #41 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38424160322) | 185.749 | 266.374 | 11.240 | 906/906 / 85/85 | 634 KB / 900 KB |
| #42 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38424863262) | 184.731 | 265.029 | 9.404 | 925/925 / 86/86 | 644 KB / 900 KB |
| #43 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38425624103) | 153.505 | 223.554 | 8.918 | 947/947 / 87/87 | 650 KB / 900 KB |
| #44 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38426248863) | 149.769 | 220.451 | 8.458 | 954/954 / 88/88 | 651 KB / 900 KB |
| #45 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38426924143) | 133.593 | 194.411 | 11.356 | 965/965 / 89/89 | 654 KB / 900 KB |
| #46 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38427503466) | 191.137 | 273.569 | 9.732 | 973/973 / 91/91 | 655 KB / 900 KB |
| #47 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38428240693) | 113.732 | 134.409 | 8.821 | 980/980 / 92/92 | 656 KB / 900 KB |
| #48 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38428626159) | 132.071 | 156.648 | 8.382 | 988/988 / 93/93 | 658 KB / 900 KB |
| #49 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38429078989) | 193.532 | 225.466 | 11.004 | 1044/1044 / 95/95 | 674 KB / 900 KB |
| #50 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38429681898) | 198.345 | 236.071 | 10.165 | 1084/1084 / 99/99 | 650 KB / 900 KB |
| #51 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38430315662) | 135.758 | 162.919 | 9.607 | 1111/1111 / 103/103 | 660 KB / 900 KB |
| #52 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38430875806) | 142.614 | 167.708 | 8.640 | 1120/1120 / 104/104 | 660 KB / 900 KB |
| #53 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38431374261) | 199.351 | 229.101 | 8.812 | 1130/1130 / 105/105 | 665 KB / 900 KB |
| #54 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38432043762) | 128.533 | 151.854 | 9.347 | 1157/1157 / 107/107 | 669 KB / 900 KB |
| #55 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38432495495) | 198.752 | 228.319 | 9.722 | 1168/1168 / 108/108 | 670 KB / 900 KB |
| #56 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38433346171) | 212.763 | 240.798 | 8.249 | 1207/1207 / 114/114 | 674 KB / 900 KB |
| #57 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38433987899) | 156.086 | 184.118 | 9.433 | 1224/1224 / 114/114 | 674 KB / 900 KB |
| #29 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38434727353) | 214.217 | 242.650 | 11.319 | 1225/1225 / 114/114 | 674 KB / 900 KB |
| #60 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38435369465) | 199.036 | 229.063 | 9.829 | 1239/1239 / 116/116 | 674 KB / 900 KB |
| #62 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38436019896) | 172.463 | 199.465 | 8.917 | 1244/1244 / 117/117 | 674 KB / 900 KB |
| #58 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38436620477) | 230.202 | 262.906 | 8.378 | 1389/1389 / 127/127 | 685 KB / 900 KB |
| #59 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38438379702) | 210.629 | 290.031 | 9.669 | 1416/1416 / 133/133 | 697 KB / 900 KB |
| #61 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38439143796) | 238.104 | 267.588 | 8.555 | 1425/1425 / 134/134 | 699 KB / 900 KB |
| #63 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38439826950) | 235.464 | 266.553 | 8.217 | 1461/1461 / 137/137 | 695 KB / 900 KB |
| #65 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38440574185) | 244.153 | 273.169 | 8.756 | 1486/1486 / 141/141 | 695 KB / 900 KB |
| #66 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38441266996) | 159.184 | 180.893 | 9.832 | 1513/1513 / 145/145 | 697 KB / 900 KB |
| #64 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38442757519) | 244.840 | 279.709 | 9.516 | 1535/1535 / 150/150 | 503 KB / 900 KB |
| #68 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38443938164) | 225.553 | 258.302 | 11.590 | 1552/1552 / 154/154 | 503 KB / 900 KB |
| #69 | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38444994291) | 172.655 | 198.810 | 10.527 | 1590/1590 / 161/161 | 505 KB / 900 KB |

## What this supports

All 34 captured application merge stages have measured successful execution. Their full runner-job baseline is 129.5 min; the observed first-merge-to-last-check train interval is 190.7 min. These figures establish a measured rehearsal cost, not a guarantee that every future original PR command is ready today.

Preserved initial 32-stage proof: 32/32 successful; six-gate sum 97.2 min, Build-job sum 121.8 min, first merge → last check 175.4 min. This initial subset does not claim the added source heads are verified.

For Jack's real merge afternoon, require the publication hold before the first original merge: production already runs #66 and intermediate develop publication would regress live features. Hold independent v* tag releases as well. Recorded conflicts require intentional original-head merge updates or a different helper-PR route; original gh commands cannot consume train-only resolutions. Neither the hold nor these future head updates has been performed.

Use the completed 34-stage gate/job totals as execution baselines, with failed/retried attempt totals retained, then separately budget queue, Jack review, retargeting, actual conflict-head updates, safety fixes and release coordination. When retarget/ready does not yield fresh Build, the prospective local merged-tree gate adds another full six-check execution before that PR is merged; required six checks after the actual merge still remain. In the worst case of all 34 needing that fallback, measured six-gate execution cost doubles before these other costs. Future Node 20 local/CI checks must enable native WebSocket with --experimental-websocket (Node 20.10+) for unchanged #59 tests. The overloaded Windows host is not measured as equivalent to Actions Node 20, so this is not a promise about that machine.

Event snapshot SHA256: `1cf46cbbcbdfa79dae8abdeeb56f5bc1e9fb46ec0d0d7ace4efcc722bd0ea44b`. Per-run source limits, exact checked heads/trees, individual check/raw hashes, original timestamps and missing-stage statuses are in [fluidd-train-timing.json](fluidd-train-timing.json). This script imports read-only helper functions and never calls compose() or writes to the integration worktree.

## Failed runs retained

| Stage | Failed run | Head | Executed gates | Logged gate intervals s | Build log wall s |
|---|---|---|---|---:|---:|
| pr59 | [38437336058](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38437336058) | `a408905ea8bf` | lint, type-check, vitest | 174.157 | 250.466 |
| pr64 | [38442077373](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38442077373) | `648faf53e8e7` | lint, type-check, vitest | 193.518 | 221.587 |

A later retry stays a separate run. Skipped/not-started checks in a failed run have no executed interval; their recorded zero does not represent a fabricated execution. #59's failed run 38437336058 exposed an absent Node 20 WebSocket global; the integration-only runtime correction was separately recorded at 94a5ec0b. All raw attempts, fixes and hashes remain in the JSON; no extra post-merge local component-restore event is invented.
