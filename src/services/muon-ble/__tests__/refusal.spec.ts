import { describe, expect, it } from 'vitest'
import { pairableRefusal } from '../refusal'

const refused = (extra: Record<string, unknown>) => Object.assign(new Error('refused'), { kind: 'refused', ...extra })

describe('which refusals Control can pair its way out of', () => {
  it.each([[0x040a, 'unknown'], [0x040b, 'expired'], [0x0403, 'revoked']])('code %i', (code, kind) => {
    expect(pairableRefusal(refused({ code }))).toBe(kind)
  })

  it('a printer whose owner turned off "Allow new devices to ask" is pairable by the code (I-170)', () => {
    expect(pairableRefusal(refused({ reason: 'disabled' }))).toBe('unknown')
  })

  it.each(['refused', 'timed_out', 'busy', 'cooldown'])('a held request that ended "%s" is not offered the code', reason => {
    expect(pairableRefusal(refused({ reason }))).toBeNull()
  })

  it('a policy refusal and a plain error are not pairable', () => {
    expect(pairableRefusal(refused({ code: 0x0402 }))).toBeNull()
    expect(pairableRefusal(new Error('network'))).toBeNull()
  })
})
