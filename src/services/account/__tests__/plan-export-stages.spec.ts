import { describe, expect, it } from 'vitest'
import { EXPORT_STAGES, exportStage, exportStatusText, exportsNewestFirst } from '../plan-export'

describe('data request stages (settings/account-data, frame 4)', () => {
  it('runs Requested → Confirmed → Gathering → Ready', () => {
    expect([...EXPORT_STAGES]).toEqual(['Requested', 'Confirmed', 'Gathering', 'Ready'])
    expect(exportStage({ status: 'queued' })).toBe(1)
    expect(exportStage({ status: 'building' })).toBe(2)
    expect(exportStage({ status: 'ready' })).toBe(3)
    expect(exportStage({ status: 'expired' })).toBeNull()
    expect(exportStage({ status: 'failed' })).toBeNull()
  })

  it('names each status on the row', () => {
    expect(exportStatusText({ status: 'building' })).toBe('Preparing')
    expect(exportStatusText({ status: 'ready' })).toBe('Ready')
    expect(exportStatusText({ status: 'expired' })).toBe('Expired')
  })

  it('lists the newest first, whatever the time format', () => {
    const list = exportsNewestFirst([
      { id: 'a', status: 'expired', requested_at: 100 },
      { id: 'b', status: 'queued', requested_at: new Date(2030, 0, 1).toISOString() },
      { id: 'c', status: 'ready', requested_at: null }
    ])
    expect(list.map(e => e.id)).toEqual(['b', 'a', 'c'])
  })
})
