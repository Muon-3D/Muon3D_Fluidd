import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chooseRelay,
  clearRelayChoice,
  forgetSecureReach,
  knownReachable,
  mayTrySecureName,
  reachSecureName,
  relayChosen,
  secureNameOf
} from '../hosted'

const NAME = 'abcdefghijklmnopqrst.lan.muon3d.com'
const MARKER = 'muon3d-secure-origin-1'

describe('secureNameOf', () => {
  it('accepts a name under our zone', () => {
    expect(secureNameOf({ secure_name: NAME })).toBe(NAME)
  })
  it.each([
    'abcdefghijklmnopqrst.evil.com',
    'x.abcdefghijklmnopqrst.lan.muon3d.com',
    null,
    undefined,
    42
  ])('ignores %s', value => {
    expect(secureNameOf({ secure_name: value })).toBeNull()
  })
  it('ignores a missing printer', () => {
    expect(secureNameOf(undefined)).toBeNull()
    expect(secureNameOf(null)).toBeNull()
  })
})

describe('mayTrySecureName', () => {
  it('is true on https and false on http', () => {
    expect(mayTrySecureName({ protocol: 'https:' })).toBe(true)
    expect(mayTrySecureName({ protocol: 'http:' })).toBe(false)
  })
})

describe('reachSecureName', () => {
  const answer = (body: string, ok = true) => vi.fn(async () => ({ ok, text: async () => body }))
  beforeEach(() => forgetSecureReach())
  afterEach(() => vi.unstubAllGlobals())

  it('remembers a success for five minutes', async () => {
    const f = answer(MARKER)
    vi.stubGlobal('fetch', f)
    expect(await reachSecureName(NAME, 1000)).toBe(true)
    expect(await reachSecureName(NAME, 1000 + 4 * 60_000)).toBe(true)
    expect(f).toHaveBeenCalledTimes(1)
    expect(knownReachable(NAME, 1000 + 4 * 60_000)).toBe(true)
    expect(await reachSecureName(NAME, 1000 + 5 * 60_000 + 1)).toBe(true)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['wrong body', () => answer('hello')],
    ['404', () => answer(MARKER, false)],
    ['network error', () => vi.fn(async () => { throw new TypeError('blocked') })]
  ])('a failure (%s) is false and retried only after 60 seconds', async (_label, make) => {
    const f = make()
    vi.stubGlobal('fetch', f)
    expect(await reachSecureName(NAME, 1000)).toBe(false)
    expect(await reachSecureName(NAME, 1000 + 59_000)).toBe(false)
    expect(f).toHaveBeenCalledTimes(1)
    expect(knownReachable(NAME, 1000 + 59_000)).toBe(false)
    await reachSecureName(NAME, 1000 + 61_000)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('two concurrent calls make one fetch', async () => {
    const f = answer(MARKER)
    vi.stubGlobal('fetch', f)
    const [a, b] = await Promise.all([reachSecureName(NAME), reachSecureName(NAME)])
    expect([a, b]).toEqual([true, true])
    expect(f).toHaveBeenCalledTimes(1)
  })
})

describe('the held "through Muon3D" choice', () => {
  beforeEach(() => sessionStorage.clear())

  it('is set, read and cleared', () => {
    expect(relayChosen('p1')).toBe(false)
    chooseRelay('p1')
    expect(relayChosen('p1')).toBe(true)
    expect(relayChosen('p2')).toBe(false)
    clearRelayChoice('p1')
    expect(relayChosen('p1')).toBe(false)
  })

  it('survives a module reload through sessionStorage', async () => {
    chooseRelay('p1')
    vi.resetModules()
    const again = await import('../hosted')
    expect(again.relayChosen('p1')).toBe(true)
  })
})
