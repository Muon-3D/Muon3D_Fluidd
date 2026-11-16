import { describe, expect, it } from 'vitest'
import ControlMixin from '../control'

type Ctx = { $store: { getters: Record<string, unknown>, state: { config: { uiSettings: { general: { axis: Record<string, { inverted: boolean }> } } } } } }
const inverted = (ControlMixin as unknown as { options: { methods: { inverted: (this: Ctx, axis: string) => boolean } } }).options.methods.inverted

const ctx = (muon: boolean | null): Ctx => ({
  $store: {
    getters: { 'server/isMuonPrinter': muon },
    state: { config: { uiSettings: { general: { axis: { x: { inverted: true }, y: { inverted: false }, z: { inverted: true } } } } } }
  }
})

describe('a reversed axis (#331)', () => {
  it('reverses Z on a printer that is not a Muon one', () => {
    expect(inverted.call(ctx(false), 'z')).toBe(true)
    expect(inverted.call(ctx(false), 'Z')).toBe(true)
  })
  it('never reverses Z on a Muon printer, or one not known yet', () => {
    expect(inverted.call(ctx(true), 'z')).toBe(false)
    expect(inverted.call(ctx(null), 'z')).toBe(false)
  })
  it('reverses X and Y as saved, on any printer', () => {
    expect(inverted.call(ctx(true), 'x')).toBe(true)
    expect(inverted.call(ctx(false), 'y')).toBe(false)
  })
})
