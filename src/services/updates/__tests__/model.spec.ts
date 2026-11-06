import { describe, expect, it } from 'vitest'
import { BOXWOOD_STAGED } from './fixtures/boxwood-staged'
import { DEFAULT_BUDGET_MS, PREPARING_GRACE_MS, UNSEEN_GRACE_MS, bannerVisible, expired, lost, offlineScreen, outcome, commitPending, isStaged, stagedUnverified, remember, sessionOf, updateHeadline, updateSteps, versionLabel, type AuxUpdateStatus } from '../model'

const FROM = '20261006141553-d0044d8'
const TO = '20261012093000-abc1234'
const status = (phase: string, extra: Partial<AuxUpdateStatus> = {}): AuxUpdateStatus => ({
  state: phase === 'installing' ? 'installing' : 'idle',
  current_version: FROM,
  target_version: TO,
  progress: phase === 'installing' ? 43 : null,
  session: { job_id: 'j1', phase: phase as never, from_version: FROM, to_version: TO, offline_budget_seconds: 1200 },
  ...extra
})

describe('the printer\'s versions', () => {
  it('reads a MuonOS version as its build date and commit', () => {
    expect(versionLabel(FROM).text).toBe('6 October 2026 · d0044d8')
    expect(versionLabel('v1.2.3').text).toBe('v1.2.3')
    expect(versionLabel(null).text).toBe('unknown')
  })
})

describe('following an install across the restart', () => {
  it('remembers an install under way, with its progress and the printer\'s restart budget', () => {
    const r = remember(null, status('installing'), 1000)
    expect(r).toMatchObject({ jobId: 'j1', phase: 'installing', from: FROM, to: TO, progress: 43, budgetMs: 1_200_000, lostAt: null })
  })

  it('says "updating" while the printer is quiet within its budget, then that it is late', () => {
    const r = lost(remember(null, status('rebooting'), 0), 10_000)
    expect(offlineScreen(r, 10_000 + 60_000)).toBe('updating')
    expect(offlineScreen(r, 10_000 + 1_200_001)).toBe('updating-late')
    expect(offlineScreen(null, 0)).toBeNull()
  })

  it('takes 20 minutes as the budget when the printer doesn\'t say', () => {
    const r = remember(null, status('rebooting', { session: { job_id: 'j1', phase: 'rebooting' } }), 0)
    expect(r?.budgetMs).toBe(DEFAULT_BUDGET_MS)
  })

  it('reads how it ended from the session once the printer is back', () => {
    const r = lost(remember(null, status('rebooting'), 0), 5)
    expect(outcome(r, status('verifying'))).toBeNull()
    expect(outcome(r, status('updated', { current_version: TO }))).toBe('updated')
    expect(outcome(r, status('rolled_back', { session: { job_id: 'j1', phase: 'rolled_back', error: { message: 'The new version failed its checks.' } } }))).toBe('rolled_back')
  })

  it('reads it from the versions on a printer whose image predates the session', () => {
    const r = lost(remember(null, { state: 'installing', current_version: FROM, target_version: TO, progress: 99 }, 0), 5)
    expect(r?.phase).toBe('installing')
    const rebooting = remember(r, { state: 'rebooting', current_version: FROM, target_version: TO }, 10)
    expect(outcome(rebooting, { state: 'idle', current_version: TO, requires_commit: false })).toBe('updated')
    expect(outcome(rebooting, { state: 'idle', current_version: FROM, requires_commit: false })).toBe('rolled_back')
    expect(outcome(rebooting, { state: 'commit_pending', current_version: TO, requires_commit: true })).toBeNull()
  })

  it('makes a session from the older fields', () => {
    expect(sessionOf({ state: 'idle', requires_commit: true, current_version: TO })?.phase).toBe('verifying')
    expect(sessionOf({ state: 'idle' })).toBeNull()
  })
})

describe('what the Updating page says', () => {
  it('steps through writing, restarting, checking and done', () => {
    expect(updateSteps('installing').map(s => s.state)).toEqual(['now', 'next', 'next', 'next'])
    expect(updateSteps('offline').map(s => s.state)).toEqual(['done', 'now', 'next', 'next'])
    expect(updateSteps('verifying').map(s => s.state)).toEqual(['done', 'done', 'now', 'next'])
    expect(updateSteps('updated').map(s => s.state)).toEqual(['done', 'done', 'done', 'done'])
  })

  it('says what is happening in plain words', () => {
    expect(updateHeadline('installing', 43, TO).text).toMatch(/12 October 2026 · abc1234: 43%/)
    expect(updateHeadline('installing', 100, TO).title).toBe('Finishing installation')
    expect(updateHeadline('offline', null, TO).text).toMatch(/Keep the printer on/)
    expect(updateHeadline('late', null, TO).title).toBe('Restart delayed')
  })
})

describe('an install the printer no longer mentions', () => {
  const idle: AuxUpdateStatus = { state: 'idle', current_version: FROM, session: null }

  it('is dropped once the printer says nothing is under way, instead of staying "Verifying" for good', () => {
    const verifying = remember(null, { state: 'idle', requires_commit: true, current_version: FROM }, 0)
    expect(verifying?.phase).toBe('verifying')
    expect(remember(verifying, idle, UNSEEN_GRACE_MS + 1)).toBeNull()
  })

  it('is kept for a moment, since the first answer after Install may still say idle', () => {
    const started = remember(null, status('installing'), 0)
    expect(remember(started, idle, 5_000)).toBe(started)
  })

  it('ends with its outcome when the versions tell it, to be shown once', () => {
    const rebooting = remember(null, status('rebooting'), 0)
    expect(remember(rebooting, { ...idle, current_version: TO }, UNSEEN_GRACE_MS + 1)?.phase).toBe('updated')
    expect(remember(rebooting, idle, UNSEEN_GRACE_MS + 1)?.phase).toBe('rolled_back')
  })

  it('is dropped when the printer reports the end of another job, or an idle session', () => {
    const r = remember(null, status('installing'), 0)
    expect(remember(r, status('updated', { session: { job_id: 'other', phase: 'updated' } }), UNSEEN_GRACE_MS + 1)).toBeNull()
    expect(remember(r, status('idle', { session: { job_id: 'j1', phase: 'idle' } }), UNSEEN_GRACE_MS + 1)).toBeNull()
  })

  it('expires past its budget, counted from when the printer went quiet', () => {
    const r = lost(remember(null, status('rebooting'), 0), 10_000)
    expect(expired(r, 10_000 + 1_199_000)).toBe(false)
    expect(expired(r, 10_000 + 1_200_001)).toBe(true)
    expect(expired(remember(null, status('updated'), 0), 9e9)).toBe(false)
  })
})

describe('an install across an outage and a reboot', () => {
  const idle: AuxUpdateStatus = { state: 'idle', current_version: FROM, session: null }

  it('reports "updated" when the printer comes back with another job id, instead of losing the outcome', () => {
    const rebooting = remember(null, status('rebooting'), 0)
    const back = status('updated', { current_version: TO, session: { job_id: 'jobB', phase: 'updated', to_version: TO } })
    expect(remember(rebooting, back, 60_000)?.phase).toBe('updated')
  })

  it('reports a failure for another job id too, as the versions show it', () => {
    const rebooting = remember(null, status('rebooting'), 0)
    const failed = status('failed', { current_version: FROM, session: { job_id: 'jobB', phase: 'failed' } })
    expect(remember(rebooting, failed, 60_000)?.phase).toBe('rolled_back')
  })

  it('does not drop an install on the first quiet answer after an outage: the grace counts from the reconnect', () => {
    const installing = remember(null, status('installing'), 0)
    const reconnected = { ...installing!, reconnectedAt: 100_000 }
    expect(remember(reconnected, idle, 110_000)).toBe(reconnected)
    expect(remember(reconnected, idle, 100_000 + UNSEEN_GRACE_MS + 1)).toBeNull()
    // Without the reconnect time the same answer would drop it at once.
    expect(remember(installing, idle, 110_000)).toBeNull()
  })

  it('decides by the versions before dropping: back on the new version is "updated", not nothing', () => {
    const rebooting = remember(null, status('rebooting'), 0)
    expect(remember(rebooting, { ...idle, current_version: TO, session: { job_id: 'j1', phase: 'idle' } }, 10_000)?.phase).toBe('updated')
  })

  it('waits a slow "preparing" out: five minutes, not thirty seconds', () => {
    const pressed = { jobId: null, phase: 'preparing' as const, from: FROM, to: TO, progress: null, seenAt: 0, lostAt: null, budgetMs: DEFAULT_BUDGET_MS, startedAt: 0 }
    expect(remember(pressed, idle, 120_000)).toBe(pressed)
    expect(remember(pressed, idle, PREPARING_GRACE_MS + 1)).toBeNull()
  })

  it('does not adopt an earlier job\'s finished session as this install\'s end', () => {
    const press = Date.parse('2026-11-06T12:00:00Z')
    const pressed = { jobId: null, phase: 'preparing' as const, from: FROM, to: TO, progress: null, seenAt: press, lostAt: null, budgetMs: DEFAULT_BUDGET_MS, startedAt: press }
    const earlier = status('updated', { current_version: FROM, session: { job_id: 'old', phase: 'updated', started_at: '2026-11-06T09:00:00Z' } })
    expect(remember(pressed, earlier, press + 5_000)).toBe(pressed)
    const later = status('failed', { session: { job_id: 'new', phase: 'failed', started_at: '2026-11-06T12:00:05Z' } })
    expect(remember(pressed, later, press + 60_000)?.phase).toBe('failed')
  })
})

describe('what shows for an entry the browser kept', () => {
  const r = lost(remember(null, status('rebooting'), 0), 10_000)
  const kept = remember(null, status('installing'), 0)

  it('shows the bar only once the printer has answered, and only within its time', () => {
    expect(bannerVisible(kept, 1000, false)).toBe(false)
    expect(bannerVisible(kept, 1000, true)).toBe(true)
    expect(bannerVisible(kept, DEFAULT_BUDGET_MS + 1000, true)).toBe(false)
  })

  it('holds the restart screen for a stale entry that was not lost in this page, until the printer has answered', () => {
    expect(offlineScreen(kept, 1000, false)).toBeNull()
    expect(offlineScreen(kept, 1000, true)).toBe('updating')
    expect(offlineScreen(kept, DEFAULT_BUDGET_MS + 1000, true)).toBeNull()
  })

  it('still shows it when the printer was seen up and then down, and the late one past the budget', () => {
    expect(offlineScreen(r, 20_000, false)).toBe('updating')
    expect(offlineScreen(r, 10_000 + 1_200_001, false)).toBe('updating-late')
  })
})

describe('an update staged on the spare slot, waiting for a person (Boxwood\'s real status)', () => {
  const staged = BOXWOOD_STAGED
  const clone = (over: Partial<AuxUpdateStatus>): AuxUpdateStatus => ({ ...JSON.parse(JSON.stringify(staged)), ...over })

  it('is "ready to install": an update available, stage staged, install idle, no commit pending', () => {
    expect(isStaged(staged)).toBe(true)
    expect(isStaged(clone({ update_available: false }))).toBe(false)
    expect(isStaged(clone({ stage: { ...staged.stage, state: 'writing' } }))).toBe(false)
    expect(isStaged(clone({ install: { ...staged.install, phase: 'installing' } }))).toBe(false)
    expect(isStaged(clone({ requires_commit: true }))).toBe(false)
    expect(isStaged(null)).toBe(false)
  })

  it('is not an install under way, so nothing remembers it and no bar or restart screen follows', () => {
    expect(sessionOf(staged)).toBeNull()
    expect(remember(null, staged, 0)).toBeNull()
    expect(bannerVisible(remember(null, staged, 0), 0, true)).toBe(false)
  })

  it('ignores the old install left in install (its job id and times) and the old quarantine error left in commit', () => {
    expect(staged.install?.job_id).toBeTruthy()
    expect(staged.commit?.error?.kind).toBe('update_quarantined')
    expect(commitPending(staged)).toBe(false)
    expect(sessionOf(staged)).toBeNull()
  })

  it('is "verifying" only when a commit is asked for or its state is not committed', () => {
    expect(commitPending(clone({ requires_commit: true }))).toBe(true)
    expect(commitPending(clone({ commit: { state: 'pending', required: true } }))).toBe(true)
    expect(sessionOf(clone({ requires_commit: true }))?.phase).toBe('verifying')
    expect(sessionOf(clone({ commit: { state: 'committing' } }))?.phase).toBe('verifying')
    // The top-level state is not read: MuonOS leaves commit_pending there for hours with the commit committed.
    expect(sessionOf(clone({ state: 'commit_pending' }))).toBeNull()
    expect(sessionOf(clone({ state: 'committing' }))).toBeNull()
    expect(bannerVisible(remember(null, clone({ state: 'commit_pending' }), 0), 0, true)).toBe(false)
  })

  it('does not adopt a stage into an install the person pressed, and drops it after the grace', () => {
    const pressed = remember(null, status('installing'), 0)
    expect(remember(pressed, staged, 10_000)?.phase).toBe('installing')
    expect(remember(pressed, staged, UNSEEN_GRACE_MS + 1)).toBeNull()
  })

  it('cannot be checked from here while its slot fingerprint is empty (KAN-1364)', () => {
    expect(stagedUnverified(staged)).toBe(true)
    expect(stagedUnverified(clone({ stage: { ...staged.stage, slot_fingerprint: { 'system-b': 'sha512-256:abc' } } }))).toBe(false)
    expect(stagedUnverified(clone({ stage: { state: 'idle' } }))).toBe(false)
  })
})

describe('an install the printer says is under way, in its real status (state only, no session)', () => {
  it('is not over while the state is rebooting, even though the version has not changed yet', () => {
    const r = remember(null, { state: 'rebooting', current_version: FROM, target_version: TO, install: { phase: 'rebooting', job_id: 'j1' } }, 0)
    expect(r?.phase).toBe('rebooting')
    expect(outcome(r, { state: 'rebooting', current_version: FROM, target_version: TO })).toBeNull()
    expect(outcome(r, { state: 'installing', current_version: FROM })).toBeNull()
    // Back and idle on the old version: then it is a rollback.
    expect(outcome(r, { state: 'idle', current_version: FROM })).toBe('rolled_back')
  })
})

describe('a fast failure or rollback of an install the person started', () => {
  const press = Date.parse('2026-11-06T12:00:00Z')
  const preparing = { jobId: null, phase: 'preparing' as const, from: FROM, to: TO, progress: null, seenAt: press, lostAt: null, budgetMs: DEFAULT_BUDGET_MS, startedAt: press }

  it('reads install.phase failed, begun after the press, as "failed"', () => {
    const failed: AuxUpdateStatus = { state: 'idle', current_version: FROM, target_version: TO, install: { phase: 'failed', job_id: 'new', started_at: '2026-11-06T12:00:05Z' } }
    expect(remember(preparing, failed, press + 20_000)?.phase).toBe('failed')
    expect(outcome(preparing, failed)).toBe('failed')
  })

  it('ignores a failed install from before the press', () => {
    const old: AuxUpdateStatus = { state: 'idle', current_version: FROM, target_version: TO, install: { phase: 'failed', job_id: 'old', started_at: '2026-11-02T12:00:00Z' } }
    expect(outcome(preparing, old)).toBeNull()
    expect(remember(preparing, old, press + 5_000)).toBe(preparing)
  })

  it('reads a newer commit error on the old version as "rolled back": the printer came back on what it had', () => {
    const back: AuxUpdateStatus = {
      state: 'idle',
      current_version: FROM,
      target_version: TO,
      commit: { state: 'committed', error: { kind: 'update_quarantined', occurred_at: '2026-11-06T12:05:00Z' } }
    }
    expect(outcome(preparing, back)).toBe('rolled_back')
    expect(remember(preparing, back, press + 600_000)?.phase).toBe('rolled_back')
    // The same error from 5 Oct is old: not an outcome of this install.
    const old = { ...back, commit: { state: 'committed', error: { kind: 'update_quarantined', occurred_at: '2026-10-05T11:02:26Z' } } }
    expect(outcome(preparing, old)).toBeNull()
  })

  it('returns an outcome already reached, so Settings can still say it', () => {
    const done = { ...preparing, phase: 'rolled_back' as const }
    expect(outcome(done, { state: 'idle', current_version: FROM })).toBe('rolled_back')
    expect(outcome({ ...preparing, phase: 'failed' }, null)).toBe('failed')
  })
})

describe('a fast failure with the printer clock behind, or a job id Fluidd has not learned yet', () => {
  const press = Date.parse('2026-11-06T12:00:00Z')
  const base = { jobId: null, phase: 'preparing' as const, from: FROM, to: TO, progress: null, seenAt: press, lostAt: null, budgetMs: DEFAULT_BUDGET_MS, startedAt: press }
  const failed = (jobId: string, startedAt: string): AuxUpdateStatus => ({ state: 'idle', current_version: FROM, target_version: TO, install: { phase: 'failed', job_id: jobId, started_at: startedAt } })

  it('reports "failed" when the printer clock is 2 s behind: the job id differs from the one held at the press', () => {
    const pressed = { ...base, startedJobId: 'old' }
    const behind = failed('new', '2026-11-06T11:59:58Z')
    expect(remember(pressed, behind, press + 20_000)?.phase).toBe('failed')
    expect(outcome(pressed, behind)).toBe('failed')
  })

  it('still reports it with no job id known at the press, within a minute of clock tolerance', () => {
    expect(remember(base, failed('new', '2026-11-06T11:59:58Z'), press + 20_000)?.phase).toBe('failed')
  })

  it('does not take the earlier install that was there at the press for this one', () => {
    const pressed = { ...base, startedJobId: 'old' }
    expect(remember(pressed, failed('old', '2026-11-06T11:59:58Z'), press + 20_000)).toBe(pressed)
    expect(outcome(pressed, failed('old', '2026-11-02T12:00:00Z'))).toBeNull()
  })

  it('still ignores an install from days before the press, beyond the tolerance', () => {
    expect(outcome(base, failed('old', '2026-11-02T12:00:00Z'))).toBeNull()
  })
})
