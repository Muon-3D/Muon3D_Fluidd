# Publication must be held before the original merge sequence

This publication proposal was prepared outside the integration worktree and copied here for review. It activates no publication hold. The integration branch separately augments BUILD verification at a91976c (standalone type-check, exact full Vitest run, one worker and always-run component restore); its publisher conditions remain unchanged. No publication guard, repository variable, original PR branch, release, hosting configuration or printer was changed by this proposal. The only draft PR for this task is integration plan PR #67; it remains **do not merge**. The optional patch beside this document is an unapplied proposal for a **future, separately reviewed develop change**.

Production already runs #66's `764b9c1`, while develop is #35's `f805ae1` (deployment tips supplied by Jack, Git ancestry verified). Each original PR merge into develop triggers hosted publication. A bottom-up merge of #36 publishes an earlier UI than production; subsequent intermediate merges continue to omit already-live library/account functionality until #58/#63/#65/#66 arrive. Early stages also contain only part of the redesign. A green intermediate build would therefore permit a real production regression. This is separate from the mutable development ZIP checksum risk.

**Do not start the original `gh pr merge <n> --merge` sequence until publication is explicitly held and the hold has been verified.** No rearrangement of those commands alone prevents the current workflows from publishing intermediate develop trees.

## Current publication paths

| Workflow | Verification that must continue | Publication to hold |
|---|---|---|
| `.github/workflows/build.yml` | `build` job: lint, tests, circular check, build, setup budget, artifact | `publish-docker` job, including mutable latest-develop; `publish-web` job / Deploy to Host |
| `.github/workflows/build-develop.yaml` | Build/test/artifact/ZIP steps | Publish to development Release step, replacing development/fluidd.zip |

No existing pause variable or approval environment is referenced by these workflows. Setting a variable today without a workflow change has no effect. Disabling the entire BUILD workflow would also disable its verification, so it does not meet the requirement to keep Build CI running.

## Option A: a narrow publication pause variable

The proposed [RELEASE-GATE.patch](RELEASE-GATE.patch) adds `vars.FLUIDD_PAUSE_PUBLISH != 'true'` to the two publisher jobs and the mutable ZIP publication step. Both Build paths remain enabled. GitHub supports the vars context in job and step conditions. This proposal has not been applied, committed, pushed or tested in Actions. [GitHub context reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability).

Future Jack-controlled sequence:

1. Review the gate separately. Record the live hosted build, available rollback artifact, current development ZIP checksum and printer image pin/consumer expectations. Coordinate with other release owners because this proposed variable holds all Docker publication, including master/tag events, while enabled.
2. Check for queued or running publication from older workflow definitions. The new variable cannot control a job whose old definition lacks the condition; hold/cancel or finish those runs deliberately before proceeding.
3. Set the repository variable to the literal string `true` **before** merging the reviewed gate. This does nothing to the old code; the gate's own develop push reads the new guarded workflow and should skip publishing without changing the live application.

   ```powershell
   gh variable set FLUIDD_PAUSE_PUBLISH --repo Muon-3D/Muon3D_Fluidd --body true
   ```

4. Merge that separately reviewed gate only under Jack's future authorization. Verify its develop run: Build succeeds, Docker/Host are skipped, and the ZIP release step is skipped. Confirm hosted production and the development release asset remain at their recorded state. Only then begin the original PR sequence. The gate changes workflow files only; recheck any workflow drift against the train evidence.
5. Keep the pause through every original merge and conflict fix. Confirm the final develop head contains every intended captured head and resolution, with all local checks and CI passing. Retain the integration plan PR as a plan, not a release path.
6. Publish only the explicitly approved final develop commit. Coordinate the new ZIP checksum/pin before a printer image consumes it. Clear the pause only when old intermediate runs cannot publish, and rerun the **two runs for that final commit**. A skipped publisher is not a failed job; `--failed` alone will not release it. Verify each run's head SHA before rerunning. [GitHub CLI rerun reference](https://cli.github.com/manual/gh_run_rerun).

   ```powershell
   gh variable set FLUIDD_PAUSE_PUBLISH --repo Muon-3D/Muon3D_Fluidd --body false
   gh run rerun <FINAL_BUILD_RUN_ID> --repo Muon-3D/Muon3D_Fluidd
   gh run rerun <FINAL_DEVELOP_ZIP_RUN_ID> --repo Muon-3D/Muon3D_Fluidd
   ```

These commands describe future actions; none was run here. Unpausing does not publish by itself, and rerunning an old intermediate run would still deploy the wrong application tree.

## Option B: separate verification from explicit release

A larger future reviewed workflow change can leave BUILD verification unconditional, move Docker/host/ZIP publishing into an explicit manual release workflow, and require an approved immutable source SHA plus a protected publication environment. During the merge afternoon only verification runs; after the final combined develop SHA passes, Jack dispatches one release of that SHA. The release workflow must check out and build/download artifacts for the approved SHA throughout, rather than silently using a newer branch tip. This also avoids reopening old automatic publish runs. It requires a separate design/review and is not implemented by the small patch above.

Both options require future authorization. Current workflow settings are insufficient to provide a reliable job-only publication freeze, so the unguarded gh sequence must remain blocked until one of these controls or another verified release-owner control is in place.

## Future original-PR conflict replay

The integration branch records compatibility, but GitHub merges the original PR's remote head and base. It cannot import a conflict resolution from an unrelated integration commit. Jack's future resolution work is therefore an intentional update of the affected original PR head; **this task has made no such updates**.

For each PR, first verify its parent PR is merged. Then check that its remote `headRefOid` still matches the captured SHA, retarget it to develop, and wait for its new comparison/CI. #36's parent #35 is already merged; later parents must merge in the listed order. #29/#60/#62 already target develop. Drafts must become ready after review. Keep branch deletion disabled and never use `--delete-branch`.

At a recorded conflict boundary, Jack can use a fresh future worktree and a temporary branch starting at the verified original head:

```powershell
gh pr view <N> --repo Muon-3D/Muon3D_Fluidd --json baseRefName,headRefName,headRefOid,isDraft,mergeable
gh pr edit <N> --repo Muon-3D/Muon3D_Fluidd --base develop
git fetch origin develop
git fetch origin refs/heads/<ORIGINAL_HEAD_BRANCH>
git worktree add -b integration/resolve-pr-<N> C:/Users/jack/fluidd-resolve-pr-<N> <VERIFIED_ORIGINAL_HEAD_SHA>
# In that future worktree:
git merge --no-ff --no-commit origin/develop
```

Replay the recorded **semantic choices and conflict hunks** for that boundary. In our train, ours was develop/integrated work and theirs was the PR. Here ours is the PR and theirs is develop, so blind `--ours`/`--theirs` choices would reverse the intended result. Use the specific recorded train boundary commit as a reference, not the final train tree wholesale. Preserve unrelated current develop changes, including the publication gate. If either input changed beyond the expected gate/history, reassess the hunk and rerun checks; the prior train is not evidence for unreviewed drift.

Run the entire local check set before staging the resolution:

```powershell
$nodeVersion = [version]((node --version).TrimStart("v"))
if ($LASTEXITCODE -or $nodeVersion.Major -ne 20 -or $nodeVersion -lt [version]"20.10.0") { throw "Use Node 20.10+" }
if ($env:NODE_OPTIONS -notmatch "--experimental-websocket") { $env:NODE_OPTIONS = (($env:NODE_OPTIONS + " --experimental-websocket").Trim()) }
npm run lint
npm run type-check
npx vitest run
npm run circular-check
npm run build
npm run check:setup-budget
git checkout -- components.d.ts
```

Stage only the intended resolution files and commit the merge (no squash or rebase). Immediately before pushing, `git ls-remote origin refs/heads/<ORIGINAL_HEAD_BRANCH>` must still equal the verified original SHA; stop if it advanced. Then push the temporary branch's HEAD to that original head **without force**, record the new head SHA, wait for CI and verify that SHA again:

```powershell
git push origin HEAD:refs/heads/<ORIGINAL_HEAD_BRANCH>
gh pr checks <N> --repo Muon-3D/Muon3D_Fluidd --watch
gh pr view <N> --repo Muon-3D/Muon3D_Fluidd --json headRefOid,mergeable,statusCheckRollup
gh pr merge <N> --merge
```

The final gh command is the plan's original command after the authorized head update. If original heads must remain immutable even during Jack's future execution, this replay route is unavailable: a separate helper PR carrying the resolved merge is needed, and the original PR can become included/merged indirectly instead of every original gh merge command running. Do not represent these two routes as equivalent.

## Node 20 test-runtime prerequisite

The first #59 integration run [38437336058](https://github.com/Muon-3D/Muon3D_Fluidd/actions/runs/38437336058) failed all ten new Node-environment adapter tests because globalThis.WebSocket was absent; 1,406 other tests passed. A separate integration-only verification commit 94a5ec0b opts into the native runtime with NODE_OPTIONS=--experimental-websocket, leaving original source heads and test assertions unchanged. The future proposal also opts into this runtime on the Build jobs in BUILD, build-develop and RELEASE so their existing Node 20 test commands can run #59 unchanged. Use Node 20.10+ and the same flag for every future local six-check gate. This opt-in does not pause RELEASE publication; the no-v*-tags rule still applies. Original PR #59 does not need a source/test change solely to solve this runtime issue, but its CI definition must inherit or independently enable the reviewed opt-in before relying on its Build. [Node 20 CLI documentation](https://nodejs.org/download/release/v20.20.1/docs/api/globals.html#websocket).

## Required #64 fixture replay

After resolving #64's router and Printers.vue conflicts against develop containing #61, also apply [PR64-FIXTURE.patch](PR64-FIXTURE.patch) to src/components/m1/__tests__/M1Live.spec.ts in that future original-head checkout. The original #64 mock was written before #61 expanded the sync API; failed run38442077373 had 1,533 passed and two failed arming tests. Commit7095fbbe adds a stable sync mock with accessories.reducedMotion:false plus setAccessories/newPrint spies, preserving assertions and production code. This patch is required compatibility work before the full six checks and original `gh pr merge 64 --merge`; it was not a third textual Git conflict. If the file/base has drifted, reassess the API adaptation rather than applying blindly. No original head was updated by this rehearsal.

## Independent tag publication

The proposed pause guards cover BUILD Docker/host publication and the mutable development ZIP step only. `.github/workflows/release.yml` independently reacts to `v*` tag pushes, creates/publishes a release ZIP and deploys to its host without this variable. During the merge window, create/push no `v*` tags and rerun no tag-release publication jobs; coordinate existing queued/running tag releases before establishing the hold. A tag release is a separate, approved release of the final verified state, not a way to advance the train. No tag or release action was performed here. [Captured RELEASE workflow](https://github.com/Muon-3D/Muon3D_Fluidd/blob/f805ae141bed47ec7bd394adae9d2ff0d5ae63cc/.github/workflows/release.yml).

## Retargeting does not guarantee fresh verification

Original BUILD uses the default pull_request activity types: opened, synchronize and reopened. Retargeting/ready-for-review alone does not guarantee a new Build, and gh pr checks --watch only watches existing checks. Require a fresh Build associated with the intended head/base, or run all six local checks on the exact prospective merged tree as described in MERGE-PLAN.md. Stop on conflicting or unknown original mergeability and use the original-head update recipe above; a green semantic-title check is insufficient. Future reviewed trigger changes are a separate proposal, not part of this publication patch. [GitHub event defaults](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request), [checks watch semantics](https://cli.github.com/manual/gh_pr_checks).
