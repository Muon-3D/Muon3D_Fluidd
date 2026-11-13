/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import { createAssertionCache, REFRESH_BEFORE_MS, type AssertionAnswer } from '../assertion'
import { LibraryError } from '../api'
import { fakeService } from './fakeService'

vi.mock('@/services/muon-cloud/api', () => ({ cloudApi: {}, CloudError: class {}, storedToken: () => null }))

function cache (session: () => string | null = () => 'console-session') {
  let clock = 1_000_000_000
  let n = 0
  const fetch = vi.fn(async (): Promise<AssertionAnswer> => ({ assertion: `a${++n}`, expires_at: (clock + 300_000) / 1000 }))
  const assertions = createAssertionCache({ fetch, session, now: () => clock })
  return { assertions, fetch, advance: (ms: number) => { clock += ms } }
}

describe('the assertion cache', () => {
  it('asks the console once and keeps the assertion', async () => {
    const { assertions, fetch } = cache()
    expect(await assertions.get()).toBe('a1')
    expect(await assertions.get()).toBe('a1')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('asks once for requests made together', async () => {
    const { assertions, fetch } = cache()
    expect(await Promise.all([assertions.get(), assertions.get(), assertions.get()])).toEqual(['a1', 'a1', 'a1'])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('replaces it a minute before it expires, not before', async () => {
    const { assertions, fetch, advance } = cache()
    await assertions.get()
    advance(300_000 - REFRESH_BEFORE_MS - 1)
    expect(await assertions.get()).toBe('a1')
    advance(1)
    expect(await assertions.get()).toBe('a2')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('asks again after drop (the service refused it)', async () => {
    const { assertions } = cache()
    await assertions.get()
    assertions.drop()
    expect(await assertions.get()).toBe('a2')
  })

  it('asks again for a new console session', async () => {
    let session = 'one'
    const { assertions } = cache(() => session)
    expect(await assertions.get()).toBe('a1')
    session = 'two'
    expect(await assertions.get()).toBe('a2')
  })

  it('is not-signed-in with no console session, and asks the console nothing', async () => {
    const { assertions, fetch } = cache(() => null)
    await expect(assertions.get()).rejects.toMatchObject({ code: 'not-signed-in' })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('a 401 from the model service', () => {
  it('drops the assertion and asks once more with a new one', async () => {
    let current = 'stale'
    const service = fakeService({ assertion: () => 'fresh' })
    const drop = vi.fn(() => { current = 'fresh' })
    const client = service.client({ get: async () => current, drop })
    const info = await client.info()
    expect(info.enabled).toBe(true)
    expect(drop).toHaveBeenCalledTimes(1)
    expect(service.calls.map(c => c.auth)).toEqual(['Bearer stale', 'Bearer fresh'])
  })

  it('is not-signed-in when the new one is refused too, after exactly two tries', async () => {
    const service = fakeService({ assertion: () => 'never' })
    const client = service.client({ get: async () => 'wrong', drop: () => {} })
    const error = await client.info().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(LibraryError)
    expect(error).toMatchObject({ code: 'not-signed-in', status: 401 })
    expect(service.calls).toHaveLength(2)
  })
})

describe('the assertion cache keyed by account', () => {
  function keyed () {
    let account: string | null = 'acct-a'
    const clock = 1_000_000_000
    let n = 0
    const fetch = vi.fn(async (): Promise<AssertionAnswer> => ({ assertion: `${account}-${++n}`, expires_at: (clock + 300_000) / 1000 }))
    const assertions = createAssertionCache({ fetch, session: () => 'console-session', account: () => account, now: () => clock })
    return { assertions, fetch, as: (next: string | null) => { account = next } }
  }

  it('hands the bridge the assertion with its expiry in milliseconds', async () => {
    const { assertions } = keyed()
    expect(await assertions.getWithExpiry()).toEqual({ assertion: 'acct-a-1', expiresAt: 1_000_300_000 })
    expect(await assertions.get()).toBe('acct-a-1')
  })

  it('never answers account B with account A\'s assertion, even before anything clears it', async () => {
    const { assertions, fetch, as } = keyed()
    expect((await assertions.getWithExpiry()).assertion).toBe('acct-a-1')
    as('acct-b')
    expect((await assertions.getWithExpiry()).assertion).toBe('acct-b-2')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('is not-signed-in with a console session but no account, and asks nothing', async () => {
    const { assertions, fetch, as } = keyed()
    as(null)
    await expect(assertions.getWithExpiry()).rejects.toMatchObject({ code: 'not-signed-in' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('clear forgets the kept assertion, and an ask that began before it never keeps its answer', async () => {
    const { assertions, fetch } = keyed()
    await assertions.getWithExpiry()
    assertions.clear()
    const late = assertions.getWithExpiry()
    assertions.clear()
    expect((await late).assertion).toBe('acct-a-2')
    expect((await assertions.getWithExpiry()).assertion).toBe('acct-a-3')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
