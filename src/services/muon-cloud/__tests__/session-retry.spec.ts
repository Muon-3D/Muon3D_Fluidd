// An unconfirmed session (the console could not be reached for /me, or another tab changed the token): nothing is
// served or reported under a mismatched account and token, the check is retried until it answers, a refusal found by
// any call reaches the printer-origin re-sign-in, and a recovered pair that /me could not check is kept, not dropped.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, refreshOutcome, setSessionRecovery, storeRefreshToken, storeToken, storedToken, TOKEN_KEY } from '../api'
import { onAccountChange } from '../account-events'
import { signInAgainOnPrinterOrigin } from '../centralLogin'
import { cloudState, initCloud, RECONCILE_RETRY_MS, signIn, signOut } from '../state'
import { modelsAssertion } from '@/services/library/assertion'
import { createRun } from '@/services/library/runs'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
vi.mock('../centralLogin', async (importActual) => ({
  ...await importActual<typeof import('../centralLogin')>(),
  signOutCentral: vi.fn(),
  signInAgainOnPrinterOrigin: vi.fn(async () => {})
}))

const jack = { id: 'acct-jack', name: 'Jack', email: 'jack@example.test', created_at: 1 }
const harry = { id: 'acct-harry', name: 'Harry', email: 'harry@example.test', created_at: 1 }
const meOf = (account: typeof jack) => ({ account, endpoint_id: null })
const unreachable = () => new CloudError('The Muon3D service could not be reached.', 0)

const seen: string[] = []
const stops: Array<() => void> = []
const watch = () => stops.push(onAccountChange(next => seen.push(`${next.id} token=${storedToken()} account=${cloudState.account?.id ?? null}`)))
let issued = 0

function answer (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } } as unknown as Response
}

function otherTabWrites (token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, newValue: token }))
}

const fakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
const tick = (ms: number) => vi.advanceTimersByTimeAsync(ms)

async function signedInAs (account: typeof jack, token: string) {
  vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token, account })
  await signIn(account.email, 'pw')
}

const run = { printer_id: 'p1', printer_name: 'Pine', file_name: 'cube.gcode' }

beforeEach(() => {
  localStorage.clear()
  seen.length = 0
  issued = 0
  vi.mocked(signInAgainOnPrinterOrigin).mockClear()
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  vi.spyOn(cloudApi, 'assertion').mockImplementation(async () => ({ assertion: `assertion-${++issued}`, expires_at: Date.now() / 1000 + 300 }))
})

afterEach(async () => {
  while (stops.length) stops.pop()!()
  setSessionRecovery(null)
  await signOut()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('the console could not be reached when the page loaded', () => {
  it('reports nothing until /me answers on a retry, then reports', async () => {
    fakeTimers()
    storeToken('token-jack')
    const me = vi.spyOn(cloudApi, 'me').mockRejectedValueOnce(unreachable()).mockResolvedValue(meOf(jack))
    await initCloud()
    expect(cloudState.account).toBeNull()
    const early = vi.fn()
    expect(await createRun(run, early)).toBeNull()
    expect(early).not.toHaveBeenCalled()

    await tick(RECONCILE_RETRY_MS[0])
    expect(me).toHaveBeenCalledTimes(2)
    expect(cloudState.account?.id).toBe('acct-jack')
    const sent = vi.fn(async () => answer(201, { id: 'run-1' }))
    expect(await createRun(run, sent as unknown as typeof fetch)).toEqual({ id: 'run-1' })
    expect(sent).toHaveBeenCalledTimes(1)
  })

  it('backs off 5 s, 15 s, 60 s, then every 5 minutes', async () => {
    fakeTimers()
    storeToken('token-jack')
    const me = vi.spyOn(cloudApi, 'me').mockRejectedValue(unreachable())
    await initCloud()
    expect(me).toHaveBeenCalledTimes(1)
    await tick(4_999); expect(me).toHaveBeenCalledTimes(1)
    await tick(1); expect(me).toHaveBeenCalledTimes(2)
    await tick(14_999); expect(me).toHaveBeenCalledTimes(2)
    await tick(1); expect(me).toHaveBeenCalledTimes(3)
    await tick(59_999); expect(me).toHaveBeenCalledTimes(3)
    await tick(1); expect(me).toHaveBeenCalledTimes(4)
    await tick(299_999); expect(me).toHaveBeenCalledTimes(4)
    await tick(1); expect(me).toHaveBeenCalledTimes(5)
    await tick(300_000); expect(me).toHaveBeenCalledTimes(6)
  })

  it('retries at once when the browser comes back online', async () => {
    fakeTimers()
    storeToken('token-jack')
    const me = vi.spyOn(cloudApi, 'me').mockRejectedValueOnce(unreachable()).mockResolvedValue(meOf(jack))
    await initCloud()
    window.dispatchEvent(new Event('online'))
    await tick(0)
    expect(me).toHaveBeenCalledTimes(2)
    expect(cloudState.account?.id).toBe('acct-jack')
    // The timer that was waiting was replaced, not left to ask again.
    await tick(10 * 60_000)
    expect(me).toHaveBeenCalledTimes(2)
  })

  it('stops for good when the console refuses the token', async () => {
    fakeTimers()
    storeToken('token-jack')
    const me = vi.spyOn(cloudApi, 'me').mockRejectedValueOnce(unreachable()).mockRejectedValue(new CloudError('refused', 401))
    await initCloud()
    window.dispatchEvent(new Event('online'))
    await tick(0)
    expect(me).toHaveBeenCalledTimes(2)
    await tick(30 * 60_000)
    expect(me).toHaveBeenCalledTimes(2)
    expect(storedToken()).toBeNull()
  })

  it('never has more than one question in flight', async () => {
    fakeTimers()
    storeToken('token-jack')
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    const me = vi.spyOn(cloudApi, 'me').mockRejectedValueOnce(unreachable()).mockImplementation(async () => { await gate; return meOf(jack) })
    await initCloud()
    window.dispatchEvent(new Event('online'))
    window.dispatchEvent(new Event('online'))
    window.dispatchEvent(new Event('online'))
    await tick(0)
    expect(me).toHaveBeenCalledTimes(2)
    release()
    await tick(0)
    expect(cloudState.account?.id).toBe('acct-jack')
  })
})

describe('another tab switches the account', () => {
  it('serves nothing under a mismatched token while /me is slow, then announces and serves the new account', async () => {
    await signedInAs(jack, 'token-jack')
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    vi.spyOn(cloudApi, 'me').mockImplementation(async () => { await gate; return meOf(harry) })
    watch()
    otherTabWrites('token-harry')
    await new Promise(resolve => setTimeout(resolve, 20))
    // Token B is stored; /me has not answered. Nothing is asked of the console for account A under B's token.
    await expect(modelsAssertion.get()).rejects.toMatchObject({ code: 'not-signed-in' })
    expect(cloudApi.assertion).toHaveBeenCalledTimes(1)
    release()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(seen).toEqual(['acct-harry token=token-harry account=acct-jack'])
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-2')
    expect(cloudApi.assertion).toHaveBeenCalledTimes(2)
  })
})

describe('a refusal found by any call', () => {
  it('announces, then signs in again on a printer\'s own address', async () => {
    await signedInAs(jack, 'token-jack')
    storeRefreshToken('refresh-1')
    vi.mocked(cloudApi.assertion).mockRestore()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => String(url).endsWith('/token') ? answer(400, { error: 'invalid_grant' }) : answer(401, { error: 'expired' })))
    watch()
    await expect(cloudApi.assertion('models-audience')).rejects.toMatchObject({ status: 401 })
    expect(seen).toEqual(['null token=token-jack account=acct-jack'])
    expect(signInAgainOnPrinterOrigin).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBeNull()
  })
})

describe('a recovered pair /me could not check', () => {
  it('keeps the pair, serves nothing until the retry confirms it, and drops nothing', async () => {
    await signedInAs(jack, 'token-jack')
    storeRefreshToken('refresh-1')
    vi.stubGlobal('fetch', vi.fn(async () => answer(400, { error: 'invalid_grant' })))
    setSessionRecovery(async () => { storeToken('token-recovered'); storeRefreshToken('refresh-2'); return true })
    vi.spyOn(cloudApi, 'meWithoutRefresh').mockRejectedValue(unreachable())
    const me = vi.spyOn(cloudApi, 'me').mockResolvedValue(meOf(jack))
    watch()
    expect(await refreshOutcome()).toBe('ok')
    expect(storedToken()).toBe('token-recovered')
    expect(cloudState.account?.id).toBe('acct-jack')
    expect(seen).toEqual([])
    await expect(modelsAssertion.get()).rejects.toMatchObject({ code: 'not-signed-in' })
    // The retry (a timer on the backoff, or the browser coming online) finishes the check.
    window.dispatchEvent(new Event('online'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(me).toHaveBeenCalledTimes(1)
    expect(seen).toEqual([])
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
  })
})

describe('this tab\'s own refresh', () => {
  it('keeps the account confirmed for the rotated token', async () => {
    await signedInAs(jack, 'token-jack')
    storeRefreshToken('refresh-1')
    vi.stubGlobal('fetch', vi.fn(async () => answer(200, { access_token: 'token-jack-2', refresh_token: 'refresh-2', token_type: 'Bearer', expires_in: 900 })))
    expect(await refreshOutcome()).toBe('ok')
    expect(storedToken()).toBe('token-jack-2')
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
  })
})
