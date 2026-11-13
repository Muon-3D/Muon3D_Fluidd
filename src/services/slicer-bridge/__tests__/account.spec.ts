/**
 * @vitest-environment node
 */
// Control's sign-in over the bridge (account.ts, host.ts): the host answers account.status and account.assertion for
// the signed-in account only, the assertion cache is keyed by that account, a switch or a sign-out is announced
// synchronously (account-events.ts) before the cache forgets it, and the first announcement precedes the frame's src.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startSlicerHost } from '../host'
import { createFluiddAccount, type FluiddAccount } from '../account'
import { createAssertionCache } from '@/services/library/assertion'
import { announceAccount, currentAccount, onAccountChange, onAccountCleared, SIGNED_OUT } from '@/services/muon-cloud/account-events'
import { fakeMoonraker, newPrinter } from './moonraker'

vi.mock('@/services/muon-cloud/api', () => ({ cloudApi: {}, CloudError: class {}, storedToken: () => 'session' }))

const JACK = { signedIn: true, id: 'acct-jack', name: 'Jack' }
const HARRY = { signedIn: true, id: 'acct-harry', name: 'harry@example.test' }
const NOW = 1_000_000_000
const SLICER = 'http://127.0.0.1:5173'

const cleanups: Array<() => void> = []
afterEach(() => {
  while (cleanups.length) cleanups.pop()!()
  announceAccount(SIGNED_OUT)
})

/** The production wiring: the cache keyed by the announced account, cleared by the second phase of every announcement. */
function wiring () {
  let n = 0
  const fetch = vi.fn(async () => ({ assertion: `assertion-for-${currentAccount().id}-${++n}`, expires_at: (NOW + 300_000) / 1000 }))
  const cache = createAssertionCache({ fetch, session: () => 'session', account: () => currentAccount().id, now: () => NOW })
  cleanups.push(onAccountCleared(() => cache.clear()))
  return { cache, fetch, account: createFluiddAccount({ assertions: { models: cache } }) }
}

async function frame (account: FluiddAccount, features: string[] = ['account'], order: string[] = []) {
  const printers = { walnut: newPrinter('walnut') }
  const moonraker = fakeMoonraker(printers, () => null)
  const listeners = new Set<(e: MessageEvent) => void>()
  const target = { addEventListener: (_t: string, l: any) => { listeners.add(l) }, removeEventListener: (_t: string, l: any) => { listeners.delete(l) } }
  let port: MessagePort | null = null
  const contentWindow = { postMessage: (_m: unknown, _o: string, transfer: unknown[]) => { port = transfer[0] as MessagePort } }
  const frameElement = { contentWindow } as unknown as HTMLIFrameElement
  Object.defineProperty(frameElement, 'src', { get: () => '', set: () => { order.push('src set') } })
  const host = startSlicerHost({
    frame: frameElement,
    slicerUrl: new URL(`${SLICER}/slicer/embed.html`),
    store: { state: { socket: { acceptingNotifications: true }, printer: { printer: {} } }, getters: {}, subscribeAction: () => () => {} } as any,
    http: moonraker.http,
    selection: () => ({ switching: false, cloud: null, apiUrl: '', displayName: '', connected: false }),
    remote: () => true,
    fetchIdentity: async () => ({}),
    confirm: async () => ({ choice: 'upload-only' }),
    theme: 'dark',
    hostVersion: 'test',
    account,
    target
  })
  for (const l of listeners) {
    l({ source: contentWindow, origin: SLICER, data: { protocol: 'printer-bridge', type: 'hello', versions: [1], app: 't', appVersion: 't', features, nonce: '0'.repeat(32) } } as any)
  }
  const p = port as unknown as MessagePort
  const received: any[] = []
  const waiting = new Set<() => void>()
  p.onmessage = (e: MessageEvent) => {
    setTimeout(() => { received.push(e.data); for (const check of [...waiting]) check() }, 5)
  }
  let id = 0
  const ask = (op: string, params: Record<string, unknown>) => {
    const mine = ++id
    p.postMessage({ v: 1, id: mine, op, params: { printer: null, ...params } })
    return new Promise<any>(resolve => {
      const check = () => {
        const m = received.find(x => x.re === mine)
        if (!m) return
        waiting.delete(check)
        resolve(m)
      }
      waiting.add(check)
      check()
    })
  }
  cleanups.push(() => { p.close(); host.close() })
  return { host, ask, received, order }
}

describe('the account over the bridge', () => {
  it('answers account.status with the signed-in account', async () => {
    announceAccount(JACK)
    const { account } = wiring()
    const t = await frame(account)
    const answer = await t.ask('account.status', {})
    expect(answer.result).toEqual({ signedIn: true, id: 'acct-jack', name: 'Jack' })
  })

  it('answers account.assertion for models with the cached assertion and its expiry', async () => {
    announceAccount(JACK)
    const { account, fetch } = wiring()
    const t = await frame(account)
    const first = await t.ask('account.assertion', { audience: 'models' })
    const second = await t.ask('account.assertion', { audience: 'models' })
    expect(first.result).toEqual({ assertion: 'assertion-for-acct-jack-1', expiresAt: NOW + 300_000 })
    expect(second.result).toEqual({ assertion: 'assertion-for-acct-jack-1', expiresAt: NOW + 300_000 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('refuses an audience the protocol does not name before the host hears of it', async () => {
    announceAccount(JACK)
    const { account, fetch } = wiring()
    const t = await frame(account)
    const answer = await t.ask('account.assertion', { audience: 'https://control.muon3d.com' })
    expect(answer.error.kind).toBe('bad-request')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('never answers account B from account A cached assertion after a switch', async () => {
    announceAccount(JACK)
    const { account, fetch } = wiring()
    const t = await frame(account)
    expect((await t.ask('account.assertion', { audience: 'models' })).result.assertion).toBe('assertion-for-acct-jack-1')
    announceAccount(HARRY)
    const after = await t.ask('account.assertion', { audience: 'models' })
    expect(after.result).toEqual({ assertion: 'assertion-for-acct-harry-2', expiresAt: NOW + 300_000 })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect((await t.ask('account.status', {})).result).toEqual({ signedIn: true, id: 'acct-harry', name: 'harry@example.test' })
  })

  it('answers not-signed-in after a sign-out, and the event says so', async () => {
    announceAccount(JACK)
    const { account } = wiring()
    const t = await frame(account)
    await t.ask('account.assertion', { audience: 'models' })
    announceAccount(SIGNED_OUT)
    const answer = await t.ask('account.assertion', { audience: 'models' })
    expect(answer.error.kind).toBe('not-signed-in')
    const events = t.received.filter(m => m.event === 'account.status')
    expect(events.at(-1).data).toEqual({ signedIn: false, id: null, name: null })
  })

  it('drops an assertion that was being fetched when the account switched', async () => {
    announceAccount(JACK)
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    const cache = createAssertionCache({
      fetch: async () => { await gate; return { assertion: 'jack-late', expires_at: (NOW + 300_000) / 1000 } },
      session: () => 'session',
      account: () => currentAccount().id,
      now: () => NOW
    })
    cleanups.push(onAccountCleared(() => cache.clear()))
    const t = await frame(createFluiddAccount({ assertions: { models: cache } }))
    const pending = t.ask('account.assertion', { audience: 'models' })
    await new Promise(resolve => setTimeout(resolve, 20))
    announceAccount(HARRY)
    release()
    const answer = await pending
    expect(answer.error.kind).toBe('not-signed-in')
  })
})

describe('announcing the account', () => {
  it('reads the current account once, before the frame src is set', async () => {
    announceAccount(JACK)
    const order: string[] = []
    const { account } = wiring()
    const real = account.current
    account.current = () => { order.push('current read'); return real() }
    await frame(account, ['account'], order)
    expect(order).toEqual(['current read', 'src set'])
  })

  it('has announced the first status before the frame asks, so a request is answered from it', async () => {
    announceAccount(JACK)
    const { account } = wiring()
    // status() would answer signed out; only the announcement before src (Jack) can make the host say otherwise.
    account.status = () => ({ signedIn: false, id: null, name: null })
    const t = await frame(account)
    const answer = await t.ask('account.assertion', { audience: 'models' })
    expect(answer.result.assertion).toBe('assertion-for-acct-jack-1')
  })

  it('tells the frame at once, before the cache clears, when the session changes', async () => {
    announceAccount(JACK)
    const order: string[] = []
    const { account, cache } = wiring()
    const clear = cache.clear
    cache.clear = () => { order.push('cache cleared'); clear() }
    const t = await frame(account)
    cleanups.push(onAccountChange(status => order.push(`announced ${status.id}`)))
    announceAccount(HARRY)
    expect(order).toEqual(['announced acct-harry', 'cache cleared'])
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(t.received.find(m => m.event === 'account.status').data).toEqual({ signedIn: true, id: 'acct-harry', name: 'harry@example.test' })
  })

  it('posts no account.status after host.close, and leaves no listener behind', async () => {
    announceAccount(JACK)
    const { account } = wiring()
    const subscribed = account.subscribe
    let listeners = 0
    account.subscribe = (listener) => {
      listeners++
      const stop = subscribed(listener)
      return () => { listeners--; stop() }
    }
    const t = await frame(account)
    expect(listeners).toBe(1)
    t.host.close()
    expect(listeners).toBe(0)
    announceAccount(HARRY)
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(t.received.filter(m => m.event === 'account.status')).toEqual([])
  })

  it('grants account only to a frame whose hello asks for it', async () => {
    announceAccount(JACK)
    const { account } = wiring()
    const t = await frame(account, [])
    const answer = await t.ask('account.status', {})
    expect(answer.error).toBeDefined()
    expect(answer.result).toBeUndefined()
  })
})
