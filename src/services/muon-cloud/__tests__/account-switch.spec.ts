import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, refreshOutcome, storedRefreshToken, storedToken, storeRefreshToken, storeToken } from '../api'
import { cloudState, refreshPrinters, signIn, signOut } from '../state'
import { accountState, loadMe } from '@/services/account/state'
import { accountApi } from '@/services/account/api'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
vi.mock('../centralLogin', async importActual => ({ ...await importActual<typeof import('../centralLogin')>(), signOutCentral: vi.fn() }))

const alice = { id: 'alice', name: 'Alice', email: 'alice@example.test', created_at: 1 }
const bob = { id: 'bob', name: 'Bob', email: 'bob@example.test', created_at: 1 }
function deferred<T> () {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((_resolve, _reject) => { resolve = _resolve; reject = _reject })
  return { promise, resolve, reject }
}
async function login (account: typeof alice) {
  vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token: `access-${account.id}`, account })
  await signIn(account.email, 'password')
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
})
afterEach(async () => {
  await signOut()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it.each([false, true])('never stores a late successful refresh after sign-out, next account: %s', async nextAccount => {
  storeToken('access-alice')
  storeRefreshToken('refresh-alice')
  vi.stubGlobal('navigator', { locks: { request: (_name: string, work: () => Promise<unknown>) => work() } })
  const response = deferred<Response>()
  vi.stubGlobal('fetch', vi.fn(() => response.promise))
  const pending = refreshOutcome()
  await signOut()
  if (nextAccount) {
    storeToken('access-bob')
    storeRefreshToken('refresh-bob')
  }
  response.resolve(new Response(JSON.stringify({ access_token: 'access-alice-late', refresh_token: 'refresh-alice-late' })))
  await pending
  expect(storedToken()).toBe(nextAccount ? 'access-bob' : null)
  expect(storedRefreshToken()).toBe(nextAccount ? 'refresh-bob' : null)
})

it.each(['success', 'refusal'])('discards an old printer-list %s after a new account signs in', async outcome => {
  await login(alice)
  const response = deferred<Awaited<ReturnType<typeof cloudApi.printers>>>()
  vi.spyOn(cloudApi, 'printers').mockReturnValueOnce(response.promise)
  const pending = refreshPrinters()
  await signOut()
  await login(bob)
  const current = cloudState.printers
  if (outcome === 'success') response.resolve({ printers: [{ id: 'old-printer', name: 'Alice printer', model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: false, online_since: null }] })
  else response.reject(new CloudError('old session refused', 401))
  await pending
  expect(cloudState.account?.id).toBe('bob')
  expect(cloudState.printers).toBe(current)
})

it('does not resume an unfinished sign-in after sign-out', async () => {
  const response = deferred<Awaited<ReturnType<typeof cloudApi.printers>>>()
  vi.spyOn(cloudApi, 'printers').mockReturnValueOnce(response.promise)
  const pending = login(alice)
  await vi.waitFor(() => expect(cloudState.account?.id).toBe('alice'))
  await signOut()
  response.resolve({ printers: [] })
  await pending
  expect(cloudApi.getLayout).not.toHaveBeenCalled()
  expect(cloudState.account).toBeNull()
})

it.each(['success', 'error'])('does not publish a late Account details %s into the next account cache', async outcome => {
  await login(alice)
  const response = deferred<Awaited<ReturnType<typeof accountApi.me>>>()
  vi.spyOn(accountApi, 'me').mockReturnValueOnce(response.promise).mockResolvedValue({ account: bob, endpoint_id: null })
  const pending = loadMe().catch(() => {})
  await signOut()
  await login(bob)
  await loadMe()
  if (outcome === 'success') response.resolve({ account: alice, endpoint_id: null })
  else response.reject(new Error('Alice error'))
  await pending
  expect(accountState.me?.account.id).toBe('bob')
  expect(accountState.error).toBe('')
})

it('clears Account details immediately on sign-out, before another page requests them', async () => {
  await login(alice)
  vi.spyOn(accountApi, 'me').mockResolvedValue({ account: alice, endpoint_id: null })
  await loadMe()
  expect(accountState.me?.account.id).toBe('alice')
  await signOut()
  expect(accountState.me).toBeNull()
  expect(accountState.error).toBe('')
})
