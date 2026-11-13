// Every way the session changes announces the account first (account-events.ts): another tab replacing the token,
// a refresh recovered into a new pair, a refresh refused for good, and a start-up that raced another tab. Also the
// assertion request's 401 retry, which must never carry the next account's token.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, refreshOutcome, setSessionRecovery, storeRefreshToken, storeToken, storedToken, TOKEN_KEY } from '../api'
import { announceAccount, onAccountChange } from '../account-events'
import { cloudState, initCloud, signIn, signOut } from '../state'
import { modelsAssertion } from '@/services/library/assertion'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
vi.mock('../centralLogin', async (importActual) => ({ ...await importActual<typeof import('../centralLogin')>(), signOutCentral: vi.fn() }))

const jack = { id: 'acct-jack', name: 'Jack', email: 'jack@example.test', created_at: 1 }
const harry = { id: 'acct-harry', name: 'Harry', email: 'harry@example.test', created_at: 1 }
const meOf = (account: typeof jack) => ({ account, endpoint_id: null })

const seen: string[] = []
const stops: Array<() => void> = []
const watch = () => stops.push(onAccountChange(next => seen.push(`${next.id} token=${storedToken()} account=${cloudState.account?.id ?? null}`)))
let issued = 0

function answer (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } } as unknown as Response
}

/** The storage event another tab's write raises in this one. */
function otherTabWrites (token: string | null) {
  if (token === null) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, newValue: token }))
}

const flush = () => new Promise(resolve => setTimeout(resolve, 20))

async function signedInAs (account: typeof jack, token: string) {
  vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token, account })
  await signIn(account.email, 'pw')
}

beforeEach(() => {
  localStorage.clear()
  seen.length = 0
  issued = 0
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  vi.spyOn(cloudApi, 'assertion').mockImplementation(async () => ({ assertion: `assertion-${++issued}`, expires_at: Date.now() / 1000 + 300 }))
})

afterEach(async () => {
  while (stops.length) stops.pop()!()
  setSessionRecovery(null)
  await signOut()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('another tab replaces the token', () => {
  it('announces the new account before the cache could serve the old one', async () => {
    await signedInAs(jack, 'token-jack')
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(meOf(harry))
    watch()
    otherTabWrites('token-harry')
    await flush()
    expect(seen).toEqual(['acct-harry token=token-harry account=acct-jack'])
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-2')
    expect(cloudState.account?.id).toBe('acct-harry')
  })

  it('announces nothing when the other tab only rotated the same account\'s token', async () => {
    await signedInAs(jack, 'token-jack')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(meOf(jack))
    watch()
    otherTabWrites('token-jack-rotated')
    await flush()
    expect(seen).toEqual([])
    expect(cloudState.account?.id).toBe('acct-jack')
  })

  it('ends the session, announcing it, when the console refuses the new token', async () => {
    await signedInAs(jack, 'token-jack')
    vi.spyOn(cloudApi, 'me').mockRejectedValue(new CloudError('refused', 401))
    watch()
    otherTabWrites('token-other')
    await flush()
    expect(seen).toEqual(['null token=token-other account=acct-jack'])
    expect(cloudState.account).toBeNull()
  })
})

describe('a refresh recovered into a new pair', () => {
  async function refusedThenRecovered () {
    await signedInAs(jack, 'token-jack')
    storeRefreshToken('refresh-1')
    vi.stubGlobal('fetch', vi.fn(async () => answer(400, { error: 'invalid_grant' })))
    setSessionRecovery(async () => { storeToken('token-recovered'); storeRefreshToken('refresh-2'); return true })
    watch()
  }

  it('keeps the session when /me names the same account', async () => {
    await refusedThenRecovered()
    vi.spyOn(cloudApi, 'meWithoutRefresh').mockResolvedValue(meOf(jack))
    expect(await refreshOutcome()).toBe('ok')
    expect(seen).toEqual([])
    expect(storedToken()).toBe('token-recovered')
  })

  it('adopts, announcing, when /me names another account', async () => {
    await refusedThenRecovered()
    vi.spyOn(cloudApi, 'meWithoutRefresh').mockResolvedValue(meOf(harry))
    expect(await refreshOutcome()).toBe('ok')
    expect(seen).toEqual(['acct-harry token=token-recovered account=acct-jack'])
  })

  it('drops the session, announcing it, when /me fails', async () => {
    await refusedThenRecovered()
    vi.spyOn(cloudApi, 'meWithoutRefresh').mockRejectedValue(new CloudError('refused', 401))
    expect(await refreshOutcome()).toBe('refused')
    expect(seen).toEqual(['null token=token-recovered account=acct-jack'])
    expect(storedToken()).toBeNull()
    expect(cloudState.account).toBeNull()
  })
})

describe('a refresh refused for good', () => {
  it('announces the sign-out before the token is cleared', async () => {
    await signedInAs(jack, 'token-jack')
    storeRefreshToken('refresh-1')
    vi.stubGlobal('fetch', vi.fn(async () => answer(400, { error: 'invalid_grant' })))
    setSessionRecovery(null)
    watch()
    expect(await refreshOutcome()).toBe('refused')
    expect(seen).toEqual(['null token=token-jack account=acct-jack'])
    expect(storedToken()).toBeNull()
  })
})

describe('start-up while another tab changes the session', () => {
  it('never pairs the account /me named with a token that is no longer the stored one', async () => {
    storeToken('token-jack')
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    const me = vi.spyOn(cloudApi, 'me').mockImplementation(async () => {
      const asked = storedToken()
      await gate
      return meOf(asked === 'token-jack' ? jack : harry)
    })
    watch()
    const starting = initCloud()
    await flush()
    storeToken('token-harry')
    release()
    await starting
    // Jack was never adopted nor announced; Harry was, from a /me asked with his own token.
    expect(seen).toEqual(['acct-harry token=token-harry account=null'])
    expect(cloudState.account?.id).toBe('acct-harry')
    expect(me).toHaveBeenCalledTimes(2)
  })
})

describe('the assertion request\'s 401 retry', () => {
  const assertionBody = { assertion: 'fresh', expires_at: 1_900_000_000 }

  beforeEach(() => { vi.mocked(cloudApi.assertion).mockRestore() })

  it('is not sent again with the next account\'s token when the account switched meanwhile', async () => {
    await signedInAs(jack, 'token-jack')
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      calls.push(String((init.headers as Record<string, string>).authorization))
      // The 401 arrives after the person switched to Harry in another tab (token stored, account announced).
      announceAccount({ signedIn: true, id: 'acct-harry', name: 'Harry' })
      storeToken('token-harry')
      return answer(401, { error: 'expired' })
    }))
    await expect(cloudApi.assertion('models-audience')).rejects.toMatchObject({ status: 401 })
    expect(calls).toEqual(['Bearer token-jack'])
  })

  it('is sent again with the rotated token when the same account is still signed in', async () => {
    await signedInAs(jack, 'token-jack')
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      calls.push(String((init.headers as Record<string, string>).authorization))
      if (calls.length === 1) {
        storeToken('token-jack-rotated')
        return answer(401, { error: 'expired' })
      }
      return answer(200, assertionBody)
    }))
    expect(await cloudApi.assertion('models-audience')).toEqual(assertionBody)
    expect(calls).toEqual(['Bearer token-jack', 'Bearer token-jack-rotated'])
  })
})
