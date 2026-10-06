import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccessRefused, AccessUnavailable, lanPrinterAccess } from '../api'

function answer (body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('lanPrinterAccess', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the state from the printer at its address', async () => {
    // "no owner, Open, anyone at home" in Moonraker's tests/assets/muon_access_contract.json
    const state = {
      owner: { kind: 'none' },
      entry: 'open',
      you: { level: 'signed-out-guest', role: 'operator', trusted: false, principal: 'anyone at home' },
      ways: { email: { on: false }, link: { on: false }, password: { on: false }, approve: { on: false } },
      privateUploads: false,
      dataMode: 'shared',
      levelsPreset: 'standard'
    }
    const fetch = vi.fn(async () => answer({ result: state }))
    vi.stubGlobal('fetch', fetch)

    await expect(lanPrinterAccess('http://192.168.137.88/').get()).resolves.toEqual(state)
    expect(fetch).toHaveBeenCalledWith('http://192.168.137.88/server/muon/access/get', expect.objectContaining({ cache: 'no-store' }))
  })

  it('says the printer has no access settings when Moonraker does not know the method', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer({ error: { code: 404, message: 'Not Found' } }, 404)))
    await expect(lanPrinterAccess('http://192.168.137.32').get()).rejects.toBeInstanceOf(AccessUnavailable)
  })

  it('passes on the reason the printer gave for a refusal', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      answer({ error: { code: 403, message: "The printer's screen can be asked only from its home network." } }, 403)))
    const asking = lanPrinterAccess('http://192.168.137.88').request({ kind: 'join' })
    await expect(asking).rejects.toBeInstanceOf(AccessRefused)
    await expect(asking).rejects.toThrow('home network')
  })

  it('reports a setting the printer did not apply as not applied', async () => {
    const fetch = vi.fn(async () => answer({ result: { applied: false } }))
    vi.stubGlobal('fetch', fetch)

    await expect(lanPrinterAccess('http://192.168.137.88').setEntry('protected')).resolves.toBe(false)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://192.168.137.88/server/muon/access/set_entry')
    expect(init.method).toBe('POST')
    // Moonraker refuses a write without a JSON body (415).
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(String(init.body))).toEqual({ entry: 'protected' })
  })

  it('asks for a request by its id', async () => {
    const fetch = vi.fn(async () => answer({ result: { status: 'allowed' } }))
    vi.stubGlobal('fetch', fetch)

    await expect(lanPrinterAccess('http://192.168.137.88').requestStatus('r1-abcd')).resolves.toBe('allowed')
    expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('http://192.168.137.88/server/muon/access/request_status?request_id=r1-abcd')
  })
})
