import { describe, expect, it } from 'vitest'
import { DEFAULT_BUDGET_MS, UNSEEN_GRACE_MS, expired, lost, offlineScreen, outcome, remember, sessionOf, updateHeadline, updateSteps, versionLabel, type AuxUpdateStatus } from '../model'

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
    const verifying = remember(null, { state: 'commit_pending', current_version: FROM, requires_commit: true }, 0)
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
