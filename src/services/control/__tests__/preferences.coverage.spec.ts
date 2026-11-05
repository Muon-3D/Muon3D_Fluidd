import { beforeEach, describe, expect, it } from 'vitest'
import { ControlPreferenceStore, validatePreferences, type ControlPreferences, type PreferenceContext, type PreferenceRemote } from '../preferences'

const account: PreferenceContext = { accountId: 'alice', printerId: 'm1', token: 'token' }
const v1 = (): ControlPreferences => ({ version: 1, folds: {} })
const remote = (overrides: Partial<PreferenceRemote> = {}): PreferenceRemote => ({
  read: async () => v1(),
  patch: async (_context, folds) => ({ ...v1(), folds }),
  ...overrides
})

describe('Control preference hardening branches', () => {
  beforeEach(() => localStorage.clear())

  it('rejects malformed fold containers, values, keys, and excessive entries', () => {
    const bad = [
      { version: 1, folds: [] },
      { version: 1, folds: { ok: 'yes' } },
      { version: 1, folds: { 'not allowed': true } },
      { version: 1, folds: Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`k${i}`, true])) }
    ]
    for (const value of bad) expect(() => validatePreferences(value)).toThrow('Unsupported Control preferences')
  })

  it('accepts a version 2 answer for its folds and rejects a version it does not know', () => {
    expect(() => validatePreferences({ version: 2, folds: { heat: true } })).not.toThrow()
    expect(() => validatePreferences({ version: 3, folds: {} })).toThrow('Unsupported Control preferences')
  })

  it('ignores invalid fold keys without changing visible or remote state', async () => {
    let writes = 0
    const store = new ControlPreferenceStore(remote({ patch: async () => { writes++; return v1() } }), localStorage)
    await store.select(account)
    for (const key of ['', 'has space', 'x'.repeat(65)]) await store.setFold(key, true)
    expect(store.state.folds).toEqual({})
    expect(writes).toBe(0)
  })
})
