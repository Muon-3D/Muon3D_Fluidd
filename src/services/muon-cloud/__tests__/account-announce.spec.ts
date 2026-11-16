// The signed-in account is announced (account-events.ts) synchronously at the moment the session changes, before the
// session is cleared or replaced and before the assertion cache forgets it: the bridge host's rule for `account`
// (muon3d-slicer docs/fluidd-integration.md section 12), which a late Vue watcher cannot keep.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, storedToken } from '../api'
import { onAccountChange, onAccountCleared, currentAccount } from '../account-events'
import { cloudState, resetReconcileForTests, signIn, signOut } from '../state'
import { modelsAssertion } from '@/services/library/assertion'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
vi.mock('../centralLogin', async (importActual) => ({ ...await importActual<typeof import('../centralLogin')>(), signOutCentral: vi.fn() }))

const jack = { id: 'acct-jack', name: 'Jack', email: 'jack@example.test', created_at: 1 }
const harry = { id: 'acct-harry', name: '', email: 'harry@example.test', created_at: 1 }

let issued = 0
const seen: string[] = []

beforeEach(() => {
  localStorage.clear()
  issued = 0
  seen.length = 0
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  vi.spyOn(cloudApi, 'assertion').mockImplementation(async () => ({ assertion: `assertion-${++issued}`, expires_at: Date.now() / 1000 + 300 }))
})

afterEach(async () => {
  resetReconcileForTests()
  await signOut()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('announcing the account where the session changes', () => {
  it('announces a sign-in before the session and the account are stored', async () => {
    const stop = onAccountChange((next) => seen.push(`${JSON.stringify(next)} token=${storedToken()} account=${cloudState.account?.id ?? null}`))
    vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token: 'shared-token', account: jack })
    await signIn('jack@example.test', 'pw')
    stop()
    expect(seen).toEqual(['{"signedIn":true,"id":"acct-jack","name":"Jack"} token=null account=null'])
    expect(currentAccount()).toEqual({ signedIn: true, id: 'acct-jack', name: 'Jack' })
  })

  it('names an account with no name by its e-mail address', async () => {
    vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token: 'shared-token', account: harry })
    await signIn('harry@example.test', 'pw')
    expect(currentAccount()).toEqual({ signedIn: true, id: 'acct-harry', name: 'harry@example.test' })
  })

  it('announces a sign-out before the token, the account or the cache are cleared', async () => {
    vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token: 'shared-token', account: jack })
    await signIn('jack@example.test', 'pw')
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
    const stopA = onAccountChange((next) => seen.push(`announce ${JSON.stringify(next)} token=${storedToken()} account=${cloudState.account?.id ?? null}`))
    const stopB = onAccountCleared(() => seen.push('cache cleared'))
    await signOut()
    stopA()
    stopB()
    expect(seen).toEqual([
      'announce {"signedIn":false,"id":null,"name":null} token=shared-token account=acct-jack',
      'cache cleared'
    ])
    await expect(modelsAssertion.get()).rejects.toMatchObject({ code: 'not-signed-in' })
  })

  it('announces a switch Jack to Harry before the new token replaces the old, and never answers Harry with Jack\'s assertion', async () => {
    const signInAs = vi.spyOn(cloudApi, 'signIn')
    signInAs.mockResolvedValueOnce({ token: 'shared-token', account: jack })
    await signIn('jack@example.test', 'pw')
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')

    const stop = onAccountChange((next) => seen.push(`announce ${next.id} token=${storedToken()} account=${cloudState.account?.id}`))
    signInAs.mockResolvedValueOnce({ token: 'shared-token', account: harry })
    await signIn('harry@example.test', 'pw')
    stop()
    expect(seen).toEqual(['announce acct-harry token=shared-token account=acct-jack'])
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-2')
    expect(cloudApi.assertion).toHaveBeenCalledTimes(2)
  })

  it('announces nothing when the same account signs in again', async () => {
    const signInAs = vi.spyOn(cloudApi, 'signIn')
    signInAs.mockResolvedValue({ token: 'shared-token', account: jack })
    await signIn('jack@example.test', 'pw')
    const stop = onAccountChange(next => seen.push(String(next.id)))
    signInAs.mockResolvedValue({ token: 'token-jack-rotated', account: jack })
    await signIn('jack@example.test', 'pw')
    stop()
    expect(seen).toEqual([])
  })
})
