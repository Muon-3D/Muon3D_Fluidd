import { beforeEach, describe, expect, it } from 'vitest'
import { HISTORY_MAX, historyLine, loadHistory, printerHistory, recordOutcome, updateHistory } from '../history'

describe('update history', () => {
  beforeEach(() => {
    localStorage.clear()
    updateHistory.printer = ''
    updateHistory.entries = []
  })

  it('keeps what this browser followed, newest first, once each, per printer', () => {
    recordOutcome('boxwood', { version: 'a', outcome: 'updated', at: 1000 })
    recordOutcome('boxwood', { version: 'a', outcome: 'updated', at: 2000 })
    recordOutcome('boxwood', { version: 'b', outcome: 'rolled_back', at: 5 * 60 * 60 * 1000 })
    updateHistory.printer = ''
    expect(loadHistory('boxwood').map(e => e.version)).toEqual(['b', 'a'])
    expect(loadHistory('hazel')).toEqual([])
  })

  it('keeps at most ten', () => {
    for (let i = 0; i < 15; i++) recordOutcome('boxwood', { version: `v${i}`, outcome: 'updated', at: i * 2 * 60 * 60 * 1000 })
    expect(loadHistory('boxwood')).toHaveLength(HISTORY_MAX)
  })

  it('reads the printer\'s own list when it reports one, newest first', () => {
    const list = printerHistory({
      history: [
        { version: 'a', outcome: 'updated', finished_at: '2026-10-28T10:00:00Z' },
        { version: 'b', outcome: 'rolled_back', finished_at: '2026-10-30T10:00:00Z' },
        { version: 'c', outcome: 'weird', finished_at: '2026-10-31T10:00:00Z' }
      ]
    } as never)
    expect(list?.map(e => e.version)).toEqual(['b', 'a'])
    expect(printerHistory({} as never)).toBeNull()
  })

  it('says how each one ended in plain words', () => {
    expect(historyLine({ version: 'a', outcome: 'updated', at: 0 }, 'Boxwood')).toBe('Installed')
    expect(historyLine({ version: 'a', outcome: 'rolled_back', at: 0 }, 'Boxwood')).toBe("Didn't finish, so Boxwood went back to the version it had")
    expect(historyLine({ version: 'a', outcome: 'failed', at: 0 }, 'Boxwood')).toBe("Didn't install; nothing changed")
  })
})
