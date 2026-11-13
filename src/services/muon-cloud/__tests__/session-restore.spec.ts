/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, REFRESH_KEY, storeToken, storedToken, TOKEN_KEY } from '../api'
import { checkCentralSession } from '../centralLogin'
import { cloudState, initCloud, saveLayout, signIn, signOut } from '../state'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); sessionStorage.clear() })

it('keeps the refreshed token when the saved session needed refreshing to load the account', async () => {
  vi.useFakeTimers()
  storeToken('expired')
  vi.spyOn(cloudApi, 'me').mockImplementation(async () => {
    storeToken('fresh')
    return { account: { id: 'account', name: 'Jack', email: 'jack@example.test', created_at: 1 }, endpoint_id: null }
  })
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  await initCloud()
  expect(storedToken()).toBe('fresh')
})

it('reports the pending central logout navigation so the caller does not reload over its form post', async () => {
  const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
  expect(await signOut()).toBe(true)
  expect(submit).toHaveBeenCalledOnce()
  const form = document.querySelector('form')!
  expect(form.action).toBe('https://control.muon3d.com/logout')
  expect(form.method).toBe('post')
  expect(new FormData(form).get('client_id')).toBe('fluidd')
  form.remove()
})

it('writes the access and refresh keys on sign-in and clears both on sign-out', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (new URL(url).pathname === '/token') {
      return new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer', expires_in: 900 }))
    }
    const state = new URL(url).searchParams.get('state')
    return { ok: true, redirected: true, url: `https://control.muon3d.com/?state=${state}&iss=https%3A%2F%2Fcontrol.muon3d.com&code=test`, body: { cancel: vi.fn() } } as unknown as Response
  }))
  await checkCentralSession()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('access')
  expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh')

  vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
  await signOut()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  document.querySelector('form')?.remove()
})

it('a group made while the saved layout is still loading is kept, not overwritten by the late answer', async () => {
  storeToken('token')
  vi.spyOn(cloudApi, 'me').mockResolvedValue({ account: { id: 'account', name: 'Jack', email: 'jack@example.test', created_at: 1 }, endpoint_id: null })
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'putLayout').mockResolvedValue({ ok: true })
  let answer!: (v: { layout: unknown }) => void
  vi.spyOn(cloudApi, 'getLayout').mockReturnValue(new Promise(resolve => { answer = resolve }))
  const init = initCloud()
  await vi.waitFor(() => expect(cloudApi.getLayout).toHaveBeenCalled())
  await saveLayout({ ...cloudState.layout, groups: [{ id: 'g1', name: 'Lab', printers: [] }] })
  answer({ layout: { groups: [] } })
  await init
  expect(cloudState.layout.groups.map(g => g.name)).toEqual(['Lab'])
})

describe('KAN-2249: the printer groups belong to one account', () => {
  const account = (id: string) => ({ account: { id, name: id, email: `${id}@example.test`, created_at: 1 }, endpoint_id: null })
  const group = (name: string) => ({ id: name, name, printers: [] })
  const names = () => cloudState.layout.groups.map(g => g.name)
  const pending = <T, >() => { let settle!: (v: T) => void; const promise = new Promise<T>(resolve => { settle = resolve }); return { promise, resolve: settle } }
  beforeEach(() => {
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
    vi.spyOn(cloudApi, 'putLayout').mockResolvedValue({ ok: true })
  })
  afterEach(() => { document.querySelectorAll('form').forEach(f => f.remove()) })

  it('signing out clears the groups, so the next account never sees (or saves) the first one\'s', async () => {
    storeToken('a')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('a'))
    vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: { groups: [group('A lab')] } })
    await initCloud()
    expect(names()).toEqual(['A lab'])
    await signOut()
    expect(names()).toEqual([])
    storeToken('b')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('b'))
    const b = pending<{ layout: unknown }>()
    vi.spyOn(cloudApi, 'getLayout').mockReturnValue(b.promise as never)
    const init = initCloud()
    await vi.waitFor(() => expect(cloudApi.getLayout).toHaveBeenCalled())
    expect(names()).toEqual([])
    b.resolve({ layout: { groups: [group('B bench')] } })
    await init
    expect(names()).toEqual(['B bench'])
  })

  it('a layout answer for an account that has signed out is dropped, even when it lands after the next one\'s', async () => {
    storeToken('a')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('a'))
    const a = pending<{ layout: unknown }>()
    vi.spyOn(cloudApi, 'getLayout').mockReturnValue(a.promise as never)
    const initA = initCloud()
    await vi.waitFor(() => expect(cloudApi.getLayout).toHaveBeenCalled())
    await signOut()
    storeToken('b')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('b'))
    vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: { groups: [group('B bench')] } })
    await initCloud()
    a.resolve({ layout: { groups: [group('A lab')] } })
    await initA
    expect(names()).toEqual(['B bench'])
  })

  it('signing in as someone else without signing out first clears the groups, even when their layout fails to load', async () => {
    storeToken('a')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('a'))
    vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: { groups: [group('A lab')] } })
    await initCloud()
    expect(names()).toEqual(['A lab'])
    vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token: 'b', ...account('b') } as never)
    vi.spyOn(cloudApi, 'getLayout').mockRejectedValue(new Error('console down'))
    await signIn('b@example.test', 'password')
    expect(cloudState.account?.id).toBe('b')
    expect(names()).toEqual([])
  })

  it('a group saved for one account is never sent again with the next account’s token', async () => {
    storeToken('a')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('a'))
    vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: { groups: [] } })
    await initCloud()
    vi.mocked(cloudApi.putLayout).mockRestore()
    const puts: string[] = []
    const first = pending<Response>()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/v1/fleet/layout') && init?.method === 'PUT') {
        puts.push(String((init.headers as Record<string, string>).authorization))
        if (puts.length === 1) return first.promise
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    const save = saveLayout({ ...cloudState.layout, groups: [group('A lab')] })
    await vi.waitFor(() => expect(puts).toHaveLength(1))
    await signOut()
    storeToken('b')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('b'))
    await initCloud()
    first.resolve(new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } }))
    await save
    expect(puts).toEqual(['Bearer a'])
    expect(cloudState.account?.id).toBe('b')
    expect(cloudState.error).toBeNull()
  })

  it('a save for the same account is still retried with a token another request rotated meanwhile', async () => {
    storeToken('a')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('a'))
    vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: { groups: [] } })
    await initCloud()
    vi.mocked(cloudApi.putLayout).mockRestore()
    const puts: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/v1/fleet/layout') && init?.method === 'PUT') {
        puts.push(String((init.headers as Record<string, string>).authorization))
        if (puts.length === 1) {
          storeToken('a-rotated')
          return new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })
        }
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    await saveLayout({ ...cloudState.layout, groups: [group('A lab')] })
    expect(puts).toEqual(['Bearer a', 'Bearer a-rotated'])
    expect(cloudState.account?.id).toBe('a')
  })

  it('a group made while the printers are still loading is kept, not overwritten by the saved layout', async () => {
    storeToken('a')
    vi.spyOn(cloudApi, 'me').mockResolvedValue(account('a'))
    const printers = pending<{ printers: never[] }>()
    vi.spyOn(cloudApi, 'printers').mockReturnValue(printers.promise as never)
    vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: { groups: [] } })
    const init = initCloud()
    await vi.waitFor(() => expect(cloudApi.printers).toHaveBeenCalled())
    await saveLayout({ ...cloudState.layout, groups: [group('Lab')] })
    printers.resolve({ printers: [] })
    await init
    expect(names()).toEqual(['Lab'])
  })
})
