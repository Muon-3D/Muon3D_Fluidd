import { describe, expect, it, vi } from 'vitest'
import { confirmPlateClear, FAILED_MESSAGE, plateClearOutcome, plateClearPath, plateNeedsClearing, plateNoticeShows } from '../clear'

const machine = (conditions: Record<string, unknown>) => ({ m1_machine: { activity: 'idle', conditions } })

describe('plateNeedsClearing', () => {
  it('is true only when the printer says plate_cleared is false', () => {
    expect(plateNeedsClearing(machine({ plate_cleared: false }))).toBe(true)
    expect(plateNeedsClearing({ m1_machine: { plate_cleared: false } })).toBe(true)
  })
  it('is false when cleared, or when the printer cannot say', () => {
    expect(plateNeedsClearing(machine({ plate_cleared: true }))).toBe(false)
    expect(plateNeedsClearing(machine({}))).toBe(false)
    expect(plateNeedsClearing({ m1_machine: {} })).toBe(false)
    expect(plateNeedsClearing({})).toBe(false)
    expect(plateNeedsClearing(null)).toBe(false)
    expect(plateNeedsClearing(machine({ plate_cleared: 'no' }))).toBe(false)
  })
})

describe('plateNoticeShows', () => {
  it('hides while printing, paused or busy', () => {
    const s = machine({ plate_cleared: false })
    expect(plateNoticeShows(s, 'ready')).toBe(true)
    expect(plateNoticeShows(s, 'standby')).toBe(true)
    for (const state of ['printing', 'Paused', 'busy']) expect(plateNoticeShows(s, state)).toBe(false)
    expect(plateNoticeShows(machine({ plate_cleared: true }), 'ready')).toBe(false)
  })
})

describe('plateClearPath', () => {
  it('goes over muon-link on a managed session', () => {
    expect(plateClearPath(false)).toBe('/server/aux/plate/clear')
    expect(plateClearPath(true)).toBe('/muon-link/plate/clear')
  })
})

describe('plateClearOutcome', () => {
  it('200 cleared', () => {
    expect(plateClearOutcome(200, { cleared: true })).toEqual({ kind: 'cleared' })
    expect(plateClearOutcome(200, { result: { cleared: true } })).toEqual({ kind: 'cleared' })
  })
  it('200 without cleared is not taken as done', () => {
    expect(plateClearOutcome(200, {})).toEqual({ kind: 'failed', message: FAILED_MESSAGE })
  })
  it('403 permission_restricted shows the printer words', () => {
    const detail = { code: 'permission_restricted', knob: 'plate_clear', required: 'owner', allowed: false, message: 'Only the owner can confirm the plate here.' }
    expect(plateClearOutcome(403, { detail })).toEqual({ kind: 'refused', code: 'permission_restricted', message: detail.message })
  })
  it('503 plate_clear_unavailable shows the printer words', () => {
    expect(plateClearOutcome(503, { detail: { code: 'plate_clear_unavailable', message: 'Not on this printer yet.' } }))
      .toEqual({ kind: 'unavailable', message: 'Not on this printer yet.' })
  })
  it('anything else is one plain sentence', () => {
    const cases: Array<[number, unknown]> = [[500, {}], [403, { detail: { code: 'owner_only', message: 'x' } }], [404, null], [503, { detail: { code: 'other' } }]]
    for (const [s, d] of cases) {
      expect(plateClearOutcome(s, d)).toEqual({ kind: 'failed', message: FAILED_MESSAGE })
    }
  })
})

describe('confirmPlateClear', () => {
  it('posts once with no body to the path for the session', async () => {
    const post = vi.fn().mockResolvedValue({ status: 200, data: { cleared: true } })
    expect(await confirmPlateClear(false, { post })).toEqual({ kind: 'cleared' })
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toBe('/server/aux/plate/clear')
    expect(post.mock.calls[0][1]).toBeUndefined()
    await confirmPlateClear(true, { post })
    expect(post.mock.calls[1][0]).toBe('/muon-link/plate/clear')
  })
  it('a network failure is failed', async () => {
    const post = vi.fn().mockRejectedValue(new Error('Network Error'))
    expect(await confirmPlateClear(false, { post })).toEqual({ kind: 'failed', message: FAILED_MESSAGE })
  })
})
