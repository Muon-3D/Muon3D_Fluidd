# Redesign merge plan — 13 October 2026

**Plan only. Do not merge integration PR #67.** It preserves captured original heads with merge commits on `integration/redesign-train`, based on develop `f805ae141bed47ec7bd394adae9d2ff0d5ae63cc`. No original PR branch was pushed or retargeted, no develop/main merge was performed, and no printer or deploy was accessed. The train includes verification-only BUILD workflow changes at `a91976cf957bc3f65377575a7251417f12545875` and the separate Node 20 WebSocket runtime opt-in at `94a5ec0b`; it does not include the proposed publication pause guards.

## Read this before running commands

The full PR map is [PR-MAP.md](PR-MAP.md), source/firmware/hosting risks are [MERGE-RISKS.md](MERGE-RISKS.md), and observed conflicts and decisions are [MERGE-CONFLICTS.md](MERGE-CONFLICTS.md). Future publication controls and a conflict replay recipe are in [RELEASE-GATE.md](RELEASE-GATE.md). [RELEASE-GATE.patch](RELEASE-GATE.patch) is text for a future separately reviewed workflow change, not an applied gate.

**Safety gate:** original heads allow turning off sensors whose `insert_gcode` starts filament auto-load. Protect both ControlOutputs and the legacy RunoutSensorsCard, conservatively handle unknown config, and add regression checks before production merges reach this behaviour. **Fixed by #70** (`fix/filament-insert-stays-armed`, on #57's head `77566f17`, added 13 Oct by Claude Code): both panels refuse `ENABLE=0` for a sensor with a non-blank `insert_gcode`, or whose configfile has not arrived, even when the handler is called directly; `ENABLE=1` stays allowed; a confirmed runout-only sensor keeps its off. It is merged into this train as `0b867823` (stage 35 below). #70 must merge before production gets the train. Pro is display preference, not authorization. Review stale per-printer developer-mode state, foreign Moonraker partial-status loss and startup snapshots that survive sign-out. Passing CI does not waive these findings.

**Mandatory publication gate before the first original merge:** production already runs #66 (`764b9c1`), while develop is only #35 (`f805ae1`). Each original develop merge automatically publishes an intermediate tree; early merges would remove already-live redesign, library and account features until their later PRs arrive. Hosted/Docker publication and mutable `development/fluidd.zip` must be held while Build CI continues. The hold must be separately authorized, installed and verified before this sequence starts; setting a pause variable alone has no effect on the current publisher conditions. RELEASE.yml tag publication is independent of the proposed pause: push no v* tags and rerun no tag releases during this window. Follow [RELEASE-GATE.md](RELEASE-GATE.md), coordinate MuonOS archive/checksum pins, and publish only the final approved commit. PR #67 itself does not deploy because its publisher jobs are skipped for pull requests.

**Conflict gate:** `gh pr merge` cannot consume train-only resolutions. At a conflict, Jack must later merge develop into the verified original head in a separately authorized temporary checkout, replay the recorded semantic decisions, rerun all checks, and push that merge non-force to the original head. Check that the remote head has not advanced before pushing, then check the new head/CI again before the listed merge. In the train ours=integrated develop/theirs=PR; this replay reverses those sides. Never blindly reuse `--ours`/`--theirs`. If original heads must remain immutable forever, a helper PR is required and originals may become indirectly merged; not every original gh command can then be guaranteed. This task performed no such head updates.

Keep repository auto-delete disabled (captured `delete_branch_on_merge=false`), and never use `--delete-branch`. Do not squash/rebase. Retarget only after the recorded parent PR has merged. Recheck each head against PR-MAP before any action; refresh the proof if a head or develop has changed.

Draft #67 uses `ignore-semantic-pull-request` to preserve the exact requested Integration title; this is a title-check exemption only. All six Build gates still run. The new label is attached only to #67.

## Actual train verification and sequencing

Severe Windows paging prevented a usable local full-suite run. The six stage checks ran on GitHub Actions with project Node 20 through the single draft PR #67. The integration-only verification change adds explicit type-check and the literal `npx vitest run`, caps both thread/fork workers at one, and restores components.d.ts with an always-run step. The separate #59 correction opts into Node 20 native WebSocket; any recorded fixture adaptations are listed separately below. Publisher filters and original PR branches remain unchanged. Integration fixture edits change test doubles only, with their assertion/production-source scope recorded in the correction event.

For each train stage the local component declaration restore is recorded before staging, then the resolved merge is committed and pushed only to integration/redesign-train. That exact stage receives all six CI checks and the CI restore. A successful head/tree-associated receipt is required before the NEXT merge. This is remote verification after the stage commit/push, not a claim that the full suite ran locally before staging. The table below records this distinction and checks the receipt precedes the next merge event.

Dependency diagnosis reused completed dependencies in an isolated junction layout, with a separate cache. The source tree had 1,216 exact required versions, 19 installed optional packages and 284 nested entries verified; its superset adds seven #46 dependencies. No npm installation/update runs through those shared package junctions. The initial own npm ci was interrupted under memory pressure and is not claimed to have passed. Actual gates use fresh runner npm ci; do not install or update through the final shared node_modules junction.

## Future checks between every original merge

Use a fresh verification checkout with Node 20.10+ and NODE_OPTIONS=--experimental-websocket; the Node 20 opt-in is required for unchanged #59 adapter tests. Preserve any other approved NODE_OPTIONS when adding it. After the parent is merged, retarget its child to develop and verify its unchanged original head and CI/mergeability. After each GitHub merge, fetch/check out the new develop commit and run all six commands below before continuing. For a future conflict-head merge, run them before staging/committing the resolution. Refresh dependencies with npm ci in that independently owned checkout after lock changes; do not install through the train dependency junctions. The future proposal in RELEASE-GATE.patch enables this runtime on all three existing Node 20 CI Build jobs, but it remains unapplied. [Node 20 flag and minimum version](https://nodejs.org/download/release/v20.20.1/docs/api/globals.html#websocket).

```powershell
$nodeVersion = [version]((node --version).TrimStart("v"))
if ($LASTEXITCODE -or $nodeVersion.Major -ne 20 -or $nodeVersion -lt [version]"20.10.0") { throw "Use Node 20.10+ for this verification gate" }
if ($env:NODE_OPTIONS -notmatch "--experimental-websocket") { $env:NODE_OPTIONS = (($env:NODE_OPTIONS + " --experimental-websocket").Trim()) }
$env:VITEST_MAX_THREADS = '1'
$env:VITEST_MIN_THREADS = '1'
$env:VITEST_MAX_FORKS = '1'
$env:VITEST_MIN_FORKS = '1'
npm run lint
if ($LASTEXITCODE) { throw "lint failed" }
npm run type-check
if ($LASTEXITCODE) { throw "type-check failed" }
npx vitest run
if ($LASTEXITCODE) { throw "tests failed" }
npm run circular-check
if ($LASTEXITCODE) { throw "circular-check failed" }
npm run build
if ($LASTEXITCODE) { throw "build failed" }
npm run check:setup-budget
if ($LASTEXITCODE) { throw "setup budget failed" }
git checkout -- components.d.ts
if ($LASTEXITCODE) { throw "component declarations restore failed" }
```

The worker environment changes scheduling, not test selection. Original PRs whose bases are feature branches had semantic-title checks only; do not treat those captured green checks as this full gate.

**Freshness gate before each original merge:** default pull_request activity types are opened/synchronize/reopened; retargeting or gh pr ready alone does not guarantee a fresh Build. gh pr checks --watch does not trigger one and may show only old title checks. Require current-head/current-base Build evidence, or perform the local prospective-tree gate below. This is separate from the mandatory six checks after each actual merge. Conflicting/UNKNOWN original mergeability is a stop, even when a title check is green. [GitHub event defaults](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request), [gh pr checks](https://cli.github.com/manual/gh_pr_checks).

For a clean retarget without fresh Build, choose a new owned checkout/temporary branch. Fetch the exact current develop and approved original head; record both SHAs. Prepare their prospective merge locally, run every command in the six-check block above, restore components.d.ts, require a clean tracked worktree against its index, and record git write-tree. Do not push this verification branch or resolve a conflicting original only in this preview: at a conflict, stop and use the authorized original-head update recipe in RELEASE-GATE.md first.

```powershell
git fetch origin develop
if ($LASTEXITCODE) { throw "develop fetch failed" }
git fetch origin refs/heads/<ORIGINAL_HEAD_BRANCH>
if ($LASTEXITCODE) { throw "original head fetch failed" }
git ls-remote origin refs/heads/develop refs/heads/<ORIGINAL_HEAD_BRANCH>
git worktree add -b codex/verify-pr-<N> C:/Users/jack/fluidd-verify-pr-<N> <VERIFIED_DEVELOP_SHA>
if ($LASTEXITCODE) { throw "verification worktree creation failed" }
# In that new checkout; inputs must be the recorded/approved SHAs:
git merge --no-ff --no-commit <VERIFIED_ORIGINAL_HEAD_SHA>
if ($LASTEXITCODE) { throw "prospective merge conflicts: update the original head first" }
# Run ALL SIX commands and restore components.d.ts from the block above.
git diff --quiet
if ($LASTEXITCODE) { throw "checks changed tracked prospective source" }
git write-tree
```

Immediately before gh pr merge, check that both remote input SHAs still match the verified inputs and that the original is MERGEABLE against develop; refresh verification if either changed. Immediately after the GitHub merge, compare its tree to the recorded prospective tree, then run all six checks on that new develop commit before continuing. If a gate fails, stop; do not rely on a later merge to repair the stage. Retargeting/head updates that affect approval state also require renewed review. This runbook preserves the requested exact gh pr merge commands, but it is deliberately not an unattended paste-and-run script.

## Exact original-PR order

The initial 32-head snapshot/order is preserved. The completion refresh discovered additional source PRs: #68, #69; these extend the train to 34 source heads. #70, the filament-sensor safety fix opened after the rehearsal, is stage 35: the train merged it last, and it may move up to directly after #57 (see its section). It is a draft too, so it also needs gh pr ready. Integration PR #67 is the plan artifact, not a source head to merge. Run from Muon-3D/Muon3D_Fluidd or append --repo Muon-3D/Muon3D_Fluidd. Every retarget below waits for its parent to merge. Before each merge compare the current head with the captured SHA (or the explicitly reviewed conflict-update SHA), inspect mergeability and await checks against the updated base. 12 source drafts need gh pr ready. No command below is authorized until publication and safety gates are resolved.

### 1. PR #36 — `feat/redesign-printer-pages`

Captured head: `303d21a5f8d2cbf6b2bc37b93f02885f18f82b63`.
Retarget only after parent PR #35 is verified merged.

```powershell
gh pr view 36 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 35 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 36 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 36 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 36 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 36 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 2. PR #37 — `feat/redesign-frame`

Captured head: `a2e29cb7c6130a0b34d948f029d9ff57e4892fad`.
Retarget only after parent PR #36 is verified merged.

```powershell
gh pr view 37 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 36 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 37 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 37 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 37 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 37 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 3. PR #38 — `feat/redesign-printers-page`

Captured head: `cdf02b61656a88992fcfa361a5bd9c4317c9f1d1`.
Retarget only after parent PR #37 is verified merged.

```powershell
gh pr view 38 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 37 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 38 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 38 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 38 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 38 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 4. PR #39 — `feat/redesign-keys`

Captured head: `ba01bbe94d953316681e139c6c4169d2fa1b40f0`.
Retarget only after parent PR #38 is verified merged.

```powershell
gh pr view 39 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 38 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 39 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 39 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 39 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 39 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 5. PR #40 — `feat/redesign-control`

Captured head: `3927705731004fa53ea53b36bb34cb094a273946`.
Retarget only after parent PR #39 is verified merged.

```powershell
gh pr view 40 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 39 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 40 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 40 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 40 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 40 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 6. PR #41 — `feat/redesign-overview`

Captured head: `3ce24a316da6c8e97504fd45e0e58f2cc576ac3e`.
Retarget only after parent PR #40 is verified merged.

```powershell
gh pr view 41 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 40 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 41 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 41 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 41 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 41 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 7. PR #42 — `feat/redesign-jobs`

Captured head: `a0ad40974b8360789bd380ba2f5a3c3d4a8b1eb1`.
Retarget only after parent PR #41 is verified merged.

```powershell
gh pr view 42 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 41 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 42 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 42 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 42 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 42 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 8. PR #43 — `feat/redesign-maintenance`

Captured head: `a09144f9f32d89b274dc0037c73b3a39b896e5a7`.
Retarget only after parent PR #42 is verified merged.

```powershell
gh pr view 43 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 42 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 43 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 43 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 43 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 43 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 9. PR #44 — `feat/redesign-settings`

Captured head: `6d554dd8a57274b0e7b80e0b3ec49307869e6d71`.
Retarget only after parent PR #43 is verified merged.

```powershell
gh pr view 44 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 43 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 44 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 44 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 44 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 44 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 10. PR #45 — `feat/redesign-camera`

Captured head: `6a6cf97d6995f249b2fd62808ad8a7fa91da262d`.
Retarget only after parent PR #44 is verified merged.

```powershell
gh pr view 45 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 44 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 45 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 45 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 45 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 45 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 11. PR #46 — `feat/redesign-m1-3d`

Captured head: `eed7170d9f1f5547ab90206f1e3319819ffabafc`.
Retarget only after parent PR #45 is verified merged.

```powershell
gh pr view 46 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 45 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 46 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 46 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 46 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 46 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 12. PR #47 — `feat/redesign-m1-print`

Captured head: `6ad14a9c9f9653eba568ae529258af495863d5cf`.
Retarget only after parent PR #46 is verified merged.

```powershell
gh pr view 47 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 46 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 47 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 47 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 47 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 47 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 13. PR #48 — `feat/redesign-connection`

Captured head: `d765dff73cf4981489fe5e8909e212c0447c930f`.
Retarget only after parent PR #47 is verified merged.

```powershell
gh pr view 48 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 47 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 48 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 48 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 48 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 48 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 14. PR #49 — `feat/redesign-pro`

Captured head: `6e906438e3835de60a9978f34b1da5cba41035e4`.
Retarget only after parent PR #48 is verified merged.

```powershell
gh pr view 49 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 48 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 49 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 49 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 49 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 49 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 15. PR #50 — `feat/redesign-remaining`

Captured head: `f6fa88f1c88281dc5467d8f03f5a0b062973a485`.
Retarget only after parent PR #49 is verified merged.

```powershell
gh pr view 50 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 49 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 50 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 50 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 50 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 50 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 16. PR #51 — `feat/redesign-feedback`

Captured head: `315ee08650a1b16bac73895ce2cdda837a02e520`.
Retarget only after parent PR #50 is verified merged.

```powershell
gh pr view 51 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 50 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 51 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 51 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 51 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 51 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 17. PR #52 — `feat/redesign-slicer`

Captured head: `ed931d8c7656061d7c1ab171feb671b589abbdc2`.
Retarget only after parent PR #51 is verified merged.

```powershell
gh pr view 52 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 51 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 52 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 52 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 52 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 52 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 18. PR #53 — `feat/redesign-updates`

Captured head: `6e474b2d90550e4d55888fb27c3d4a9c7b2d3237`.
Retarget only after parent PR #52 is verified merged.

```powershell
gh pr view 53 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 52 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 53 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 53 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 53 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 53 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 19. PR #54 — `feat/redesign-m1-live`

Captured head: `9a4ea27c5b5dfbadd9dfd8f198f5622dde4f8af7`.
Retarget only after parent PR #53 is verified merged.

```powershell
gh pr view 54 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 53 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 54 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 54 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 54 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 54 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 20. PR #55 — `feat/redesign-feedback-2`

Captured head: `41dac9e9c519dca1374ede54c474507cb3bff270`.
Retarget only after parent PR #54 is verified merged.

```powershell
gh pr view 55 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 54 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 55 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 55 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 55 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 55 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 21. PR #56 — `feat/redesign-dialogs`

Captured head: `8473971b3085aca4976b901572f67c063ac04421`.
Retarget only after parent PR #55 is verified merged.

```powershell
gh pr view 56 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 55 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 56 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 56 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 56 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 56 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 22. PR #57 — `feat/redesign-feedback-3`

Captured head: `77566f177a660c3754611eb869b6f8bcfaabc753`.
Retarget only after parent PR #56 is verified merged.

```powershell
gh pr view 57 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 56 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 57 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr checks 57 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 57 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 57 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 23. PR #29 — `chore/KAN-414-control-host`

Captured head: `97acd8eaeb5a30587ef03c972aed6365802b9c2a`.

```powershell
gh pr view 29 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
# Base is already develop; no retarget needed.
gh pr ready 29
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 29 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 29 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 29 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 24. PR #60 — `feat/KAN-414-either-console-name`

Captured head: `1b59e146cb9da242d1f6a7a481055eafb9bb1a2b`.

```powershell
gh pr view 60 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
# Base is already develop; no retarget needed.
gh pr ready 60
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 60 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 60 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 60 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 25. PR #62 — `fix/sw-navigations-reach-the-server`

Captured head: `02499dec29581603180a47f6b07fa19af975ce3e`.

```powershell
gh pr view 62 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
# Base is already develop; no retarget needed.
gh pr ready 62
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 62 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 62 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 62 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 26. PR #58 — `feat/redesign-library`

Captured head: `5f07ffe49a51012cf0b4108da32f558383bbf11f`.
Retarget only after parent PR #57 is verified merged.

```powershell
gh pr view 58 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 57 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 58 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 58
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 58 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 58 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 58 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 27. PR #59 — `feat/KAN-527-other-printers`

Captured head: `4e36acd66ddd0fe3f2e3860a148a4a1914bc4037`.
Retarget only after parent PR #57 is verified merged.

```powershell
gh pr view 59 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 57 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 59 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 59
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 59 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 59 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 59 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 28. PR #61 — `feat/KAN-526-m1-animations`

Captured head: `2ead8bd12a3986b894313654dd1b78f4bd662946`.
Retarget only after parent PR #57 is verified merged.

```powershell
gh pr view 61 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 57 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 61 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 61
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 61 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 61 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 61 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 29. PR #63 — `feat/KAN-533-account-shell`

Captured head: `ec1463c537b7521cc91862db50743bd571ebc0e6`.
Retarget only after parent PR #58 is verified merged.

```powershell
gh pr view 63 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 58 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 63 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 63
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 63 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 63 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 63 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 30. PR #65 — `feat/KAN-533-account-sections`

Captured head: `77f9cfac3578361c7b10a52a60d6061ff970f048`.
Retarget only after parent PR #63 is verified merged.

```powershell
gh pr view 65 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 63 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 65 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 65
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 65 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 65 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 65 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 31. PR #66 — `feat/KAN-533-sign-out`

Captured head: `764b9c17c0061a6ad901218ff0078baae239599f`.
Retarget only after parent PR #65 is verified merged.

```powershell
gh pr view 66 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 65 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 66 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 66
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 66 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 66 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 66 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 32. PR #64 — `feat/KAN-525-fast-load`

Captured head: `bb2d04a74f896f5f98775baf83e20e9ca57c34df`.
Retarget only after parent PR #57 is verified merged.

**Stop for conflict resolution:** `src/router/index.ts`, `src/views/Printers.vue`. Replay this stage's decisions from MERGE-CONFLICTS.md using the future recipe in RELEASE-GATE.md; verify the intentional updated head before continuing.

**Additional required original-head adaptation before checks/merge:** `src/components/m1/__tests__/M1Live.spec.ts`. Replay verification commit `7095fbbeec878fea9f3fcdea900e27de8fb60581` (Stable sync fixture with accessories.reducedMotion, setAccessories and newPrint; unchanged arming assertions), keeping the assertions/production scope stated in its event. This compatibility fixture update was discovered by a failed test after Git composition; it is separate from the textual conflict list.
Use [PR64-FIXTURE.patch](PR64-FIXTURE.patch) after the recorded source resolutions. Its old test blob matches captured original #64; recheck for drift before applying.

```powershell
gh pr view 64 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 57 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 64 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 64
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 64 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 64 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 64 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 33. PR #68 — `feat/KAN-531-reconnect`

Captured head: `4e71404c56813870ebfd5e546c1ba867ff915fdc`.
Retarget only after parent PR #57 is verified merged.

**Stop for conflict resolution:** `src/App.vue`, `src/services/muon-cloud/__tests__/directory.spec.ts`, `vite.config.ts`. Replay this stage's decisions from MERGE-CONFLICTS.md using the future recipe in RELEASE-GATE.md; verify the intentional updated head before continuing.

```powershell
gh pr view 68 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 57 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 68 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 68
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 68 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 68 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 68 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 34. PR #69 — `feat/KAN-533-followups`

Captured head: `fc33f37e4cb381309dca500e3c0865e0c5f4a64f`.
Retarget only after parent PR #66 is verified merged.

**Stop for conflict resolution:** `src/App.vue`, `src/services/muon-cloud/state.ts`, `src/views/Printers.vue`. Replay this stage's decisions from MERGE-CONFLICTS.md using the future recipe in RELEASE-GATE.md; verify the intentional updated head before continuing.

```powershell
gh pr view 69 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 66 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 69 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 69
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 69 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 69 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 69 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

### 35. PR #70 — `fix/filament-insert-stays-armed`

Captured head: `3aa201a7154740deebc4fbca5829ff6470a2fe2e`.
Retarget only after parent PR #57 is verified merged.

**Position:** the train merged #70 last (after #69), as `0b867823`, with no conflict. No source PR after #57 changes any of its seven files (`src/services/control/model.ts` and its spec, `src/components/control/ControlOutputs.vue`, `src/components/widgets/runout-sensors/RunoutSensorsCard.vue`, the two new specs, `src/locales/en.yaml`), so it can merge at any point after #57. Directly after #57 is preferred: it shortens the time `develop` holds the unprotected Outputs panel. It must merge before the train reaches production.

```powershell
gh pr view 70 --json headRefOid,baseRefName,mergeable,statusCheckRollup
if ($LASTEXITCODE) { throw "PR inspection failed" }
# Compare head with the captured SHA or explicitly reviewed conflict-update SHA.
$parentState = gh pr view 57 --json state | ConvertFrom-Json
if ($LASTEXITCODE -or $parentState.state -ne "MERGED") { throw "parent PR is not verified merged" }
gh pr edit 70 --base develop
if ($LASTEXITCODE) { throw "retarget failed" }
gh pr ready 70
if ($LASTEXITCODE) { throw "ready-for-review failed" }
gh pr checks 70 --watch
if ($LASTEXITCODE) { throw "reported checks failed or remain pending" }
# Watching existing checks is insufficient: pass the fresh Build OR prospective-tree gate above.
$prState = gh pr view 70 --json headRefOid,baseRefName,mergeable,statusCheckRollup | ConvertFrom-Json
if ($LASTEXITCODE -or $prState.baseRefName -ne "develop" -or $prState.mergeable -ne "MERGEABLE") { throw "original mergeability/base is unresolved" }
# STOP unless head and develop still match the approved verified inputs, and publication is held.
gh pr merge 70 --merge
if ($LASTEXITCODE) { throw "merge failed: stop before the next PR" }
```

Verify the resulting develop tree, run all six future local checks and restore components.d.ts before continuing.

## Rehearsal evidence

**Stage 35, #70 (added 13 Oct by Claude Code; not in MERGE-CHECKS.json or MERGE-TIMING.md):** merge commit `0b867823` of fix head `3aa201a7`, with no conflict. [Build 38454318882](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38454318882) passed lint, type-check, vitest, circular-check, build, setup budget and the component restore on that head: 1,610 tests in 163 files (stage #69: 1,590 in 161), no circular dependencies, /setup 505 KB of 900 KB. The same six checks also ran serially on the laptop on `0b867823` (Node 22, a fresh `npm ci` in a separate checkout, not the shared junction) with the same results, and on #70's own head (1,244 tests in 116 files, /setup 674 KB). Each of #70's 20 new tests fails with its production files reverted to `77566f17`.

34 of 34 captured heads have recorded train merge commits; 34 stages have complete successful CI, hash and head/tree proofs. These are GitHub checks, not local full-suite claims. Pending rows make no end-state claim. [MERGE-CHECKS.json](MERGE-CHECKS.json) preserves all events and the derived per-stage ledger. Raw normalized inputs and individual check logs remain under `C:\Users\jack\fluidd-train-evidence` with SHA256 receipts.

| PR | Merge commit | CI run / gate | Lint | Type | Vitest | Circular | Build | Budget | Restore | Tests / files | /setup | Six checks s | Build log wall s | Workflow wall s |
|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|
| #36 | `e67e250faf89` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38419197273) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 795/795 / 76/76 | 637 KB / 900 KB | 139.4 | 215.7 | n/a |
| #37 | `d5332b8a2c2d` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38421011883) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 830/830 / 79/79 | 648 KB / 900 KB | 164.6 | 238.1 | n/a |
| #38 | `a3af67f3d07d` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38421679804) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 851/851 / 80/80 | 638 KB / 900 KB | 186.2 | 264.5 | n/a |
| #39 | `37ee16840cec` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38422418412) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 867/867 / 83/83 | 645 KB / 900 KB | 186.0 | 264.4 | n/a |
| #40 | `442097fce17d` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38423164429) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 893/893 / 84/84 | 659 KB / 900 KB | 196.3 | 274.8 | n/a |
| #41 | `ab1f67c72eaf` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38424160322) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 906/906 / 85/85 | 634 KB / 900 KB | 185.7 | 266.4 | n/a |
| #42 | `ae9c9d30493e` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38424863262) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 925/925 / 86/86 | 644 KB / 900 KB | 184.7 | 265.0 | n/a |
| #43 | `7599f39f9713` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38425624103) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 947/947 / 87/87 | 650 KB / 900 KB | 153.5 | 223.6 | n/a |
| #44 | `2f91105eae63` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38426248863) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 954/954 / 88/88 | 651 KB / 900 KB | 149.8 | 220.5 | n/a |
| #45 | `9fad3ee85f24` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38426924143) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 965/965 / 89/89 | 654 KB / 900 KB | 133.6 | 194.4 | n/a |
| #46 | `e9f6938b16ab` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38427503466) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 973/973 / 91/91 | 655 KB / 900 KB | 191.1 | 273.6 | n/a |
| #47 | `2cedf6145a16` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38428240693) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 980/980 / 92/92 | 656 KB / 900 KB | 113.7 | 134.4 | n/a |
| #48 | `a012402eb502` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38428626159) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 988/988 / 93/93 | 658 KB / 900 KB | 132.1 | 156.6 | n/a |
| #49 | `d844090b1124` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38429078989) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1044/1044 / 95/95 | 674 KB / 900 KB | 193.5 | 225.5 | n/a |
| #50 | `27f60b9a56f2` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38429681898) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1084/1084 / 99/99 | 650 KB / 900 KB | 198.3 | 236.1 | n/a |
| #51 | `40ba27ec18a4` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38430315662) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1111/1111 / 103/103 | 660 KB / 900 KB | 135.8 | 162.9 | n/a |
| #52 | `9cb57cc41844` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38430875806) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1120/1120 / 104/104 | 660 KB / 900 KB | 142.6 | 167.7 | n/a |
| #53 | `a4f2c0d42b40` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38431374261) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1130/1130 / 105/105 | 665 KB / 900 KB | 199.4 | 229.1 | n/a |
| #54 | `4d0f96c3e40a` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38432043762) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1157/1157 / 107/107 | 669 KB / 900 KB | 128.5 | 151.9 | n/a |
| #55 | `1a56fc386bad` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38432495495) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1168/1168 / 108/108 | 670 KB / 900 KB | 198.8 | 228.3 | n/a |
| #56 | `631e7a29702e` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38433346171) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1207/1207 / 114/114 | 674 KB / 900 KB | 212.8 | 240.8 | n/a |
| #57 | `59dbd929fd8d` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38433987899) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1224/1224 / 114/114 | 674 KB / 900 KB | 156.1 | 184.1 | n/a |
| #29 | `750c3c9b9510` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38434727353) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1225/1225 / 114/114 | 674 KB / 900 KB | 214.2 | 242.7 | n/a |
| #60 | `aa3c6c995ce1` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38435369465) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1239/1239 / 116/116 | 674 KB / 900 KB | 199.0 | 229.1 | n/a |
| #62 | `ffe0e0f5750b` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38436019896) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1244/1244 / 117/117 | 674 KB / 900 KB | 172.5 | 199.5 | n/a |
| #58 | `17800719e544` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38436620477) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1389/1389 / 127/127 | 685 KB / 900 KB | 230.2 | 262.9 | n/a |
| #59 | `a408905ea8bf` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38438379702) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1416/1416 / 133/133 | 697 KB / 900 KB | 210.6 | 290.0 | n/a |
| #61 | `fbc9c61020ea` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38439143796) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1425/1425 / 134/134 | 699 KB / 900 KB | 238.1 | 267.6 | n/a |
| #63 | `77facc2ac61f` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38439826950) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1461/1461 / 137/137 | 695 KB / 900 KB | 235.5 | 266.6 | n/a |
| #65 | `ee18c2011b0c` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38440574185) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1486/1486 / 141/141 | 695 KB / 900 KB | 244.2 | 273.2 | n/a |
| #66 | `9d27d333edf8` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38441266996) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1513/1513 / 145/145 | 697 KB / 900 KB | 159.2 | 180.9 | n/a |
| #64 | `648faf53e8e7` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38442757519) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1535/1535 / 150/150 | 503 KB / 900 KB | 244.8 | 279.7 | n/a |
| #68 | `b34aa4aa7a79` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38443938164) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1552/1552 / 154/154 | 503 KB / 900 KB | 225.6 | 258.3 | n/a |
| #69 | `cc056c28b9c8` | [PASS](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38444994291) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1590/1590 / 161/161 | 505 KB / 900 KB | 172.7 | 198.8 | n/a |

Six-check durations use Run-group start to next Run-group start and include step handoff; they are not pure CPU time. Build log wall time is the first-to-last timestamp in the full Build-job log, including checkout/install/upload/cleanup but excluding queue and other jobs. Workflow wall time appears only if explicit workflow start/completion fields are supplied; the current normalized API run fields omit them, so n/a is intentional.

| PR | CI head | Synthetic checkout / tree proof | Source / raw input SHA256 | Gate before next merge |
|---|---|---|---|---|
| #36 | `e67e250faf89` | `e031c8044f9f` / `3d784c200fa9` = checkout tree | github-mcp-normalized / `217bc5e0471bf88119dc66d73f528987cba2dcba86a7cc174b698f4b147db2dc` | yes |
| #37 | `d5332b8a2c2d` | `a0921e6cdf68` / `7f628adddeed` = checkout tree | github-mcp-normalized / `e467773588785f838dd1b03caf53aec1c0f1a0d057ced299129453e4c2830c49` | yes |
| #38 | `a3af67f3d07d` | `706b9dce8d95` / `31d198e5b8e3` = checkout tree | github-mcp-normalized / `d9167658b3e4529adb29475340cf0203eda0ddb2b7e1fb1940eb5538d7f8de3e` | yes |
| #39 | `37ee16840cec` | `9b1879ac2125` / `594891401036` = checkout tree | github-mcp-normalized / `0c8c1166dc53b4a5c79e2c5944e70c74dbc503d2cebbfd19afeef556d79e14f5` | yes |
| #40 | `442097fce17d` | `c3b516af55d9` / `c136c496d7f1` = checkout tree | github-mcp-normalized / `22d472f0847fb809708ce09444c535dad35caa3838c7fa34bd50973ca8651426` | yes |
| #41 | `ab1f67c72eaf` | `e7ae1fc888ed` / `106fdd26179f` = checkout tree | github-mcp-normalized / `e0da4e2d5df7267deb098399b428b4995c47c5e76e57f3f0ce51aebb7c01e6fd` | yes |
| #42 | `ae9c9d30493e` | `7ea563cd50a8` / `f579641d00cc` = checkout tree | github-mcp-normalized / `3480e42e9f34abe7f48fb523c67e1dce8edb7186fe8cab476f6dd8f222e11daf` | yes |
| #43 | `7599f39f9713` | `d5e0a4398905` / `e66de714f02a` = checkout tree | github-mcp-normalized / `e3cae648560ca9c4440841809bd95460316d5f17e0fc95e3ed20cd96d3d418a8` | yes |
| #44 | `2f91105eae63` | `070c2d96235b` / `02e71f869468` = checkout tree | github-mcp-normalized / `ca09e841b2191e8d7a12dc9de2a2946299e4448a0bbf57ef9c638ebb567544c7` | yes |
| #45 | `9fad3ee85f24` | `67a69a6e628a` / `104caf75941b` = checkout tree | github-mcp-normalized / `773d197941bd3bec691f212eaa748c8791ff233f0f7ec9a2aa62e1fb59e4fc15` | yes |
| #46 | `e9f6938b16ab` | `b29867bd5e78` / `d5c33ab6432c` = checkout tree | github-mcp-normalized / `4d16cb33f04c331afc5bae70be24e80976886088f4582f89dc8e7c05e0270756` | yes |
| #47 | `2cedf6145a16` | `63edc95eb703` / `61c1673d0af2` = checkout tree | github-mcp-normalized / `cd491f7dfcef38887df1132dd7ea8e08e52c0d8ddcf390fdf6fd03e3c774982b` | yes |
| #48 | `a012402eb502` | `b0edde11391b` / `68c1f7741b84` = checkout tree | github-mcp-normalized / `5b41cf4131d2c8e2f5d7656433df815d65f79211810e55df4affd9889e787b7a` | yes |
| #49 | `d844090b1124` | `723cc7555350` / `4c38bb737611` = checkout tree | github-mcp-normalized / `d47fa159003962526fc23eeb2aa331918e66b08cd0a68c9aa12a57feef12d050` | yes |
| #50 | `27f60b9a56f2` | `b3ae2ddcf005` / `9d9e41c87b43` = checkout tree | github-mcp-normalized / `23a47b9fb5fb431d0b8cc9adb1d7d4e6ce27904b8e955c31b3c6c49b6a359371` | yes |
| #51 | `40ba27ec18a4` | `1ba588ad3e89` / `620a979312bf` = checkout tree | github-mcp-normalized / `47edfebb703fd730ac9da526f06b7e432e061777813f4692cc993377fa2c4de6` | yes |
| #52 | `9cb57cc41844` | `4d5ef125a024` / `644b6b647ea5` = checkout tree | github-mcp-normalized / `7319064e9dd9f7ed24d517fb46aac07594f55e913932f2639ddffd806733635d` | yes |
| #53 | `a4f2c0d42b40` | `0ab188143855` / `ca3b9ed1b162` = checkout tree | github-mcp-normalized / `8a6560132a6420c2a6e13ece7924abcddbfbedd42164dbdf1e1bccb5364ae541` | yes |
| #54 | `4d0f96c3e40a` | `52cd5a34bdba` / `f6410a8f1315` = checkout tree | github-mcp-normalized / `a2738d9bbd9d18d60236146668f42795977a7c4c7f77ebcf12369cef066bd0fb` | yes |
| #55 | `1a56fc386bad` | `7846c984a98a` / `1dae104d9f41` = checkout tree | github-mcp-normalized / `1dc9fb179cb3e8867900601f04e908e0cea5077d26f9fbf0b74f79a77bec1793` | yes |
| #56 | `631e7a29702e` | `957a2e908612` / `f38a9cd55023` = checkout tree | github-mcp-normalized / `9579718486e48825ebace950644b40dfbe9009b1441727a6352117828893f127` | yes |
| #57 | `59dbd929fd8d` | `0f037084e231` / `984df00d8047` = checkout tree | github-mcp-normalized / `b147d0d45a4f444ff3f3185eed046f0614037d44c89cf0e0ce434866924952a2` | yes |
| #29 | `750c3c9b9510` | `d81a31227f36` / `3eb7da8163c7` = checkout tree | github-mcp-normalized / `fd1b12aaf04d9ac33612c7951d05c9d4283ac5a28dfe0c1b2373b24a93e8e232` | yes |
| #60 | `aa3c6c995ce1` | `a03de1687961` / `79e13055c594` = checkout tree | github-mcp-normalized / `0b854107d77deec80f79c0a9fc34f05f7417c782c05e639de77d26ba7e50e4b3` | yes |
| #62 | `ffe0e0f5750b` | `626f6cfcfaf4` / `d84194f56378` = checkout tree | github-mcp-normalized / `2f636a5fa727d32e0c5b59806efa02f23c58a5ef2467f37be115856d7b41329e` | yes |
| #58 | `17800719e544` | `8ce57e2300dd` / `5146d8d5aa5a` = checkout tree | github-mcp-normalized / `f0cd034afad7e5445a23b4bdd5852ba38df051cb03df61fd91f3918fe812aa31` | yes |
| #59 | `94a5ec0b2e8e` | `1b60788c9480` / `3f34d22b5a20` = checkout tree | github-mcp-normalized / `255e5fdb3f9546e02a245282b2ae407ee7ebf1532427e1e3e224d621d2fbfb42` | yes |
| #61 | `fbc9c61020ea` | `1c85d115cfce` / `a7fda056e511` = checkout tree | github-mcp-normalized / `36bc2ac46253fcb983a946b294e3a9fe800c7e5247a50fde66c8fef7daa517d7` | yes |
| #63 | `77facc2ac61f` | `34c1c0a30c86` / `edde83d6968a` = checkout tree | github-mcp-normalized / `c5cf7e5936d93e4681678465305f2aaa85ff43c019c59d8de8514f310cebb47b` | yes |
| #65 | `ee18c2011b0c` | `883550719d0e` / `a0344d755018` = checkout tree | github-mcp-normalized / `c223bd9836266c59c13c1b3587c6bc4bd4e25140d512a5787e3b627f363eb5a2` | yes |
| #66 | `9d27d333edf8` | `022590800124` / `f3df15d1cbd6` = checkout tree | github-mcp-normalized / `5150878e94f45c083b26f14b8579b252b9cdca0b0d271d12b80a97d6eec5af4f` | yes |
| #64 | `7095fbbeec87` | `723de986f598` / `87e05e3b857c` = checkout tree | github-mcp-normalized / `1f8c649f5cc66eefd89928274f1970536c89f97172baa3fb3ce43ad22096e673` | yes |
| #68 | `b34aa4aa7a79` | `13a18a0ea4d2` / `03c28091008b` = checkout tree | github-mcp-normalized / `ea4a715ffdf8e05fe25b0cb03eb053206031ea976ae9d15fe7b5937f147791ae` | yes |
| #69 | `cc056c28b9c8` | `0667f0d2bb6f` / `eb86229c3924` = checkout tree | github-mcp-normalized / `0ad103aea62ad209012fcafe61957ee35b712895e733673ae9ad383efd5136be` | next stage not observed |

Association proves the queried PR head and local stage head agree, develop is an ancestor, and the Actions synthetic merge checkout tree equals that head tree. The normalized run object does not supply raw head_sha/event fields; those fields are not invented. Full association parents/trees, provenance limits, timestamps and verified raw/check hashes remain in MERGE-CHECKS.json.

## Failed attempts and separate CI corrections

These failed runs remain failed in the raw/event history; a later successful retry does not relabel them. No next merge is permitted until the corrected stage has a complete new six-gate receipt.

| Stage | Failed run | Tested head | Failure recorded | Raw input SHA256 |
|---|---|---|---|---|
| pr59 | [38437336058](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38437336058) | `a408905ea8bf` | 10 failed / 1406 passed / 1416 total tests | `32652d9b24c0b9f035f6a8e42ff6bdaa6c4e1983e8fd3527761979c105c2f4d3` |
| pr64 | [38442077373](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38442077373) | `648faf53e8e7` | 2 failed / 1533 passed / 1535 total tests | `1bdbd2e69d709d393742b3661c72cc6235533accc8fbde8b3f2203e242f47f90` |

CI workflow/runtime correction for PR #59: `94a5ec0b2e8ea327c9b64ee43a9601cf7a57fe9f` after failed run `38437336058`. Files: `.github/workflows/build.yml`. Choice: NODE_OPTIONS=--experimental-websocket on integration Build job. Reason: All ten new Node-environment adapter tests failed because globalThis.WebSocket is absent without Node 20 opt-in; preserve original production code and test assertions.
This is a separate verification commit, not a replacement of the original merge or source head. Its pushed-stage head must be the head associated with the successful retry. The component restore before the original merge is retained as its original event; no extra local restore event is invented after that merge.

Test-fixture compatibility adaptation for PR #64: `7095fbbeec878fea9f3fcdea900e27de8fb60581` after failed run `38442077373`. Files: `src/components/m1/__tests__/M1Live.spec.ts`. Choice: Stable sync fixture with accessories.reducedMotion, setAccessories and newPrint; unchanged arming assertions. Reason: Two KAN-525 arming tests failed when KAN-526 mounted/accessory watcher used fields absent from the older mock; production source already has the correct API.
This is a separate verification commit, not a replacement of the original merge or source head. Its pushed-stage head must be the head associated with the successful retry. The component restore before the original merge is retained as its original event; no extra local restore event is invented after that merge.

## Observed time and the afternoon claim

Observed selected-stage six-check total: **103.8 minutes** across 34 receipts. All distinct PR-stage check attempts total 109.9 minutes. Observed Build-job log windows total 129.5 minutes. Baseline and final documentation-only CI are excluded from these stage totals.

Observed rehearsal interval from first train merge to latest recorded stage receipt: 191.0 minutes. This includes observed merge work, CI queue and receipt retrieval delays; it excludes earlier setup/installation and remains partial until all 34 captured source stages pass.

All 34 captured source stages have observed successful CI and evidence. The measured totals establish verification cost for this rehearsal, not an unconditional wall-clock promise for Jack's original merge afternoon.

For a future estimate use the completed 34-stage Build-job total as the measured execution baseline, then separately budget GitHub queue time, Jack review, retargeting, conflict-head updates and checks, dependency setup, required safety fixes and publication-freeze work. Queue/review/head-update/safety/freeze time is excluded from the check/job totals and cannot be assigned zero. Final CI must be read on the draft's exact final head after documents land; a train proves source composition, not hardware safety, deployment or permission to publish.
