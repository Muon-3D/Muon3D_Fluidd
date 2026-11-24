import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountError } from '../client'
import { alertFor, stepUpMessage } from '../sign-in-errors'
import {
  PROVIDERS, forcesPrompt, nudgeSnoozed, orderMethods, providerState, readLastMethod, snoozeNudge, surfaceOf, writeLastMethod
} from '../sign-in-methods'

afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('the provider list', () => {
  it('greys every provider until its web flow is built, whatever the console says', () => {
    const config = { social: { google: true, apple: true } }
    for (const p of PROVIDERS) expect(providerState(p, config)).toBe('soon')
  })

  it('turns a provider on only when its flow is built and the console has it', () => {
    const google = { ...PROVIDERS[0], webFlow: true }
    expect(providerState(google, { social: { google: true } })).toBe('on')
    expect(providerState(google, { social: { google: false } })).toBe('soon')
    expect(providerState(google, null)).toBe('soon')
  })

  it('lists Google, Apple, GitHub and Microsoft', () => {
    expect(PROVIDERS.map(p => p.label)).toEqual(['Google', 'Apple', 'GitHub', 'Microsoft'])
  })
})

describe('order', () => {
  it('is passkey, email, then providers that are on', () => {
    expect(orderMethods({ passkeys: true, last: null, on: ['google'] })).toEqual(['passkey', 'email', 'google'])
  })
  it('moves the last used method first and leaves the rest', () => {
    expect(orderMethods({ passkeys: true, last: 'google', on: ['google'] })).toEqual(['google', 'passkey', 'email'])
    expect(orderMethods({ passkeys: true, last: 'email', on: [] })).toEqual(['email', 'passkey'])
  })
  it('ignores a last used method that is not offered', () => {
    expect(orderMethods({ passkeys: false, last: 'passkey', on: [] })).toEqual(['email'])
    expect(orderMethods({ passkeys: true, last: 'github', on: [] })).toEqual(['passkey', 'email'])
  })
})

describe('last used', () => {
  it('stores the method and nothing else', () => {
    writeLastMethod('passkey')
    expect(localStorage.getItem('muon.signin.last')).toBe('{"v":1,"method":"passkey"}')
    expect(readLastMethod()).toBe('passkey')
  })
  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => writeLastMethod('email')).not.toThrow()
    expect(readLastMethod()).toBeNull()
  })
  it('ignores an unknown version or method', () => {
    localStorage.setItem('muon.signin.last', '{"v":9,"method":"email"}')
    expect(readLastMethod()).toBeNull()
    localStorage.setItem('muon.signin.last', '{"v":1,"method":"passwordless"}')
    expect(readLastMethod()).toBeNull()
  })
})

describe('the nudge snooze', () => {
  it('is quiet for 30 days, then asks again', () => {
    const now = 1_000_000
    snoozeNudge(30, now)
    expect(nudgeSnoozed(now + 29 * 86400000)).toBe(true)
    expect(nudgeSnoozed(now + 31 * 86400000)).toBe(false)
  })
  it('never asks again when told so', () => {
    snoozeNudge(null)
    expect(nudgeSnoozed(Date.now() + 9e12)).toBe(true)
  })
})

describe('the surface line', () => {
  it('names a surface only from the fixed client map', () => {
    expect(surfaceOf('/authorize?client_id=library&state=x')).toBe('Library')
    expect(surfaceOf('/authorize?client_id=fluidd')).toBe('Control')
    expect(surfaceOf('/authorize?client_id=slicer')).toBe('Slicer')
    expect(surfaceOf('/authorize?client_id=models')).toBe('Models')
    expect(surfaceOf('/authorize?client_id=__proto__')).toBeNull()
    expect(surfaceOf('/authorize?client_id=Evil%20Corp')).toBeNull()
    expect(surfaceOf(null)).toBeNull()
  })
  it('notices prompt=login so the page is never answered silently', () => {
    expect(forcesPrompt('/authorize?client_id=fluidd&prompt=login')).toBe(true)
    expect(forcesPrompt('/authorize?client_id=fluidd')).toBe(false)
  })
})

describe('error copy', () => {
  it('reads the console\'s code when there is one, and falls back to its sentence', () => {
    const byCode = new AccountError('x', 401, { code: 'passkey_not_registered' })
    const bySentence = new AccountError('That passkey is not registered here.', 401, { error: 'that passkey is not registered here' })
    expect(alertFor(byCode, 'passkey').title).toBe('That passkey isn\'t set up for Muon3D.')
    expect(alertFor(bySentence, 'passkey').title).toBe('That passkey isn\'t set up for Muon3D.')
    expect(alertFor(new AccountError('x', 401, { error: { code: 'passkey_not_registered' } }), 'passkey').title).toContain('isn\'t set up')
  })
  it('turns a 429 into a wait, from Retry-After first', () => {
    expect(alertFor(new AccountError('Too many.', 429, {}, 120000), 'password')).toMatchObject({ kind: 'warning', waitS: 120, body: 'Try again in about 2 minutes.' })
    expect(alertFor(new AccountError('Too many attempts; try again in 30 seconds.', 429), 'password').waitS).toBe(30)
    expect(alertFor(new AccountError('Too many.', 429), 'password').waitS).toBe(60)
  })
  it('asks for a fresh start when the code step ran out', () => {
    expect(alertFor(new AccountError('That sign-in has expired; sign in again.', 401), 'code').action).toBe('restart')
  })
  it('offers sign in for an address that already has an account', () => {
    expect(alertFor(new AccountError('x', 409), 'sign-up').action).toBe('sign-in')
  })
  it('says the service is unreachable, or that the person is offline', () => {
    expect(alertFor(new AccountError('x', 0), 'password').title).toBe('Muon3D can\'t be reached right now.')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(alertFor(new AccountError('x', 0), 'password').title).toBe('You\'re offline')
  })
  it('words the step-up sheet\'s refusals', () => {
    expect(stepUpMessage(new DOMException('c', 'NotAllowedError'))).toBe('Passkey confirmation cancelled. No action was sent.')
    expect(stepUpMessage(new Error('x'))).toBe('That didn\'t work. Try your passkey again.')
  })
})
