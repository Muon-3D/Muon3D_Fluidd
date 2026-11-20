import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { openFleet, fleetFailure, AdminError } from '../client'
import { TOKEN_KEY } from '@/services/muon-cloud/api'

const response = (value: unknown, status = 200) => ({ ok: status === 200, status, text: async () => JSON.stringify(value) })
const JWS = 'eyJhbGciOi.pay+load/==.sig'
const credential = { id: 'YQ', rawId: new Uint8Array([1]).buffer, type: 'public-key', response: { clientDataJSON: new Uint8Array([1]).buffer, authenticatorData: new Uint8Array([1]).buffer, signature: new Uint8Array([1]).buffer } }
const ceremony = () => [
  response({ ceremony_id: 'c', options: { publicKey: { challenge: 'YQ' } }, expires_at: Date.now() / 1000 + 60 }),
  response({ ok: true }),
  response({ actor: 'staff', staff_expires_at: Date.now() / 1000 + 120 })
]
const spies = () => (['log', 'info', 'warn', 'error', 'debug'] as const).map(k => vi.spyOn(console, k).mockImplementation(() => {}))

beforeEach(() => {
  vi.stubGlobal('location', new URL('https://control.muon3d.com/admin'))
  localStorage.setItem(TOKEN_KEY, 'ordinary-session')
  vi.stubGlobal('navigator', { credentials: { get: async () => credential } })
})
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('openFleet', () => {
  it('confirms with the passkey, mints a Fleet assertion and navigates this tab with a fragment only', async () => {
    const logs = spies()
    const fetch = vi.fn()
    for (const r of ceremony()) fetch.mockResolvedValueOnce(r)
    fetch.mockResolvedValueOnce(response({ assertion: JWS, expires_at: Date.now() / 1000 + 60 }))
    vi.stubGlobal('fetch', fetch)
    const navigate = vi.fn()
    const stages: string[] = []
    await openFleet({ navigate, onStage: s => stages.push(s) })
    const [url, init] = fetch.mock.calls[3]
    expect(url).toBe('https://control.muon3d.com/v1/me/staff/assertion')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ audience: 'https://fleet.muon3d.com' })
    expect(init.headers.authorization).toBe('Bearer ordinary-session')
    expect(init.referrerPolicy).toBe('no-referrer')
    expect(navigate).toHaveBeenCalledTimes(1)
    const target = navigate.mock.calls[0][0] as string
    expect(target).toBe(`https://fleet.muon3d.com/sign-in#assertion=${encodeURIComponent(JWS)}`)
    expect(new URL(target).search).toBe('')
    expect(new URL(target).pathname).toBe('/sign-in')
    expect(stages).toEqual(['passkey', 'opening'])
    for (const spy of logs) expect(JSON.stringify(spy.mock.calls)).not.toContain('pay+load')
    expect(JSON.stringify(localStorage)).not.toContain('pay+load')
  })

  it('skips the passkey step when a fresh confirmation is passed in', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ assertion: JWS, expires_at: Date.now() / 1000 + 60 }))
    vi.stubGlobal('fetch', fetch)
    const navigate = vi.fn()
    await openFleet({ confirmed: true, navigate })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('says Fleet sign-in is not turned on for the console 400', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ error: 'fleet staff assertions are not turned on' }, 400))
    vi.stubGlobal('fetch', fetch)
    const navigate = vi.fn()
    const error = await openFleet({ confirmed: true, navigate }).catch(e => e)
    expect(error).toBeInstanceOf(AdminError)
    expect(fleetFailure(error)).toBe('Fleet sign-in is not turned on yet.')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('makes no assertion request and no navigation when the passkey is cancelled', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(ceremony()[0])
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', { credentials: { get: async () => { throw new DOMException('no', 'NotAllowedError') } } })
    const navigate = vi.fn()
    const error = await openFleet({ navigate }).catch(e => e)
    expect(fleetFailure(error)).toContain('passkey was cancelled')
    expect(fetch.mock.calls.map(c => c[0])).not.toContain('https://control.muon3d.com/v1/me/staff/assertion')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('maps non-staff and network failures to plain sentences', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ error: 'staff only' }, 403)))
    const nav = vi.fn()
    expect(fleetFailure(await openFleet({ confirmed: true, navigate: nav }).catch(e => e))).toContain('not Muon staff')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('down')))
    expect(fleetFailure(await openFleet({ confirmed: true, navigate: nav }).catch(e => e))).toContain('Check your connection')
    expect(nav).not.toHaveBeenCalled()
  })

  it('does not send anything away from the console origin', async () => {
    vi.stubGlobal('location', new URL('https://evil.example/admin'))
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(openFleet({ confirmed: true, navigate: vi.fn() })).rejects.toBeInstanceOf(AdminError)
    expect(fetch).not.toHaveBeenCalled()
  })
})
