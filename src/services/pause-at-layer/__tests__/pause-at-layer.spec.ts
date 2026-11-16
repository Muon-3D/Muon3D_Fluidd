import { describe, expect, it } from 'vitest'
import { printerHasPauseAtLayer } from '../index'

describe('printerHasPauseAtLayer', () => {
  it('is false when the printer reports commands without SET_PAUSE_AT_LAYER (the M1)', () => {
    expect(printerHasPauseAtLayer({ G28: {}, PAUSE: {}, SET_PAUSE_NEXT_LAYER: {} })).toBe(false)
  })

  it('is true when it reports the command, in any case', () => {
    expect(printerHasPauseAtLayer({ G28: {}, SET_PAUSE_AT_LAYER: {} })).toBe(true)
    expect(printerHasPauseAtLayer({ set_pause_at_layer: {} })).toBe(true)
  })

  it('does not judge before a command list has arrived', () => {
    expect(printerHasPauseAtLayer({})).toBe(true)
    expect(printerHasPauseAtLayer(null)).toBe(true)
  })
})
