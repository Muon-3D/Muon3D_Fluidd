import { afterEach, describe, expect, it } from 'vitest'
import { SETTLE_MARGIN_MS, SETTLE_MS, handMoveLock, handMoveSettling, lockHandMove, settleMs } from '../safe-move'

afterEach(() => { handMoveLock.target = null })

describe('the hand-move lock expiry', () => {
  it('is SETTLE_MS for a short move, and the travel time plus a margin for a long one', () => {
    expect(settleMs(0)).toBe(SETTLE_MS)
    expect(settleMs(500)).toBe(SETTLE_MS)
    expect(settleMs(20_000)).toBe(20_000 + SETTLE_MARGIN_MS)
    expect(settleMs(Number.NaN)).toBe(SETTLE_MS)
  })

  it('holds a long move past SETTLE_MS while it is still on its way', () => {
    lockHandMove([100, 100, 160], 'p', 0, 15_000)
    expect(handMoveSettling([100, 100, 10], 'p', SETTLE_MS + 1)).toBe(true)
    expect(handMoveSettling([100, 100, 10], 'p', 15_000 + SETTLE_MARGIN_MS - 1)).toBe(true)
  })

  it('frees itself when arrival is never reported (a move Klipper refused)', () => {
    lockHandMove([100, 100, 160], 'p', 0, 15_000)
    expect(handMoveSettling([100, 100, 10], 'p', 15_000 + SETTLE_MARGIN_MS + 1)).toBe(false)
    expect(handMoveLock.target).toBeNull()
    lockHandMove([110, 100, 10], 'p', 0)
    expect(handMoveSettling([100, 100, 10], 'p', SETTLE_MS + 1)).toBe(false)
  })

  it('is released on arrival, whatever the expiry', () => {
    lockHandMove([110, 100, 10], 'p', 0, 60_000)
    expect(handMoveSettling([110, 100, 10], 'p', 10)).toBe(false)
  })
})
