import { describe, expect, it } from 'vitest'
import { devOnlyLocked } from '../index'

describe('devOnlyLocked', () => {
  it('locks a Muon printer whose muon_guard says dev mode is off', () => {
    expect(devOnlyLocked({ isMuon: true, guardDevMode: false, gateDevMode: false })).toBe(true)
  })

  it('unlocks when muon_guard says dev mode is on', () => {
    expect(devOnlyLocked({ isMuon: true, guardDevMode: true, gateDevMode: false })).toBe(false)
  })

  it('muon_guard wins over the gate answer, both ways', () => {
    expect(devOnlyLocked({ isMuon: true, guardDevMode: false, gateDevMode: true })).toBe(true)
    expect(devOnlyLocked({ isMuon: true, guardDevMode: true, gateDevMode: false })).toBe(false)
  })

  it('falls back to the per-printer gate when there is no muon_guard', () => {
    expect(devOnlyLocked({ isMuon: true, guardDevMode: undefined, gateDevMode: true })).toBe(false)
    expect(devOnlyLocked({ isMuon: true, guardDevMode: undefined, gateDevMode: false })).toBe(true)
    expect(devOnlyLocked({ isMuon: true, guardDevMode: {}, gateDevMode: true })).toBe(false)
  })

  it('treats both unknown as not dev mode', () => {
    expect(devOnlyLocked({ isMuon: null, guardDevMode: undefined, gateDevMode: false })).toBe(true)
    expect(devOnlyLocked({ isMuon: true, guardDevMode: null, gateDevMode: false })).toBe(true)
  })

  it('keeps everything on a printer known not to be Muon', () => {
    expect(devOnlyLocked({ isMuon: false, guardDevMode: undefined, gateDevMode: false })).toBe(false)
    expect(devOnlyLocked({ isMuon: false, guardDevMode: false, gateDevMode: false })).toBe(false)
  })
})
