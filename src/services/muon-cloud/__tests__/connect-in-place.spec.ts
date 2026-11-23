/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-5459: Control connects to a printer on this network in place, over its secure name, from the hosted page.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const activate = vi.hoisted(() => ({ local: vi.fn(), cloud: vi.fn() }))
vi.mock('../activate', () => ({ activateLocalPrinter: activate.local, activateCloudPrinter: activate.cloud }))

const { connectInPlace, openOnNetwork, probeSecureApi, secureInstance, openMuonLocal, setLeave, MUON_LOCAL_URL, LOCAL_ACCESS_BLOCKED } =
  await import('../connect-in-place')
const { cloudState } = await import('../state')

const NAME = 'abcdefghijklmnopqrst.muonlan.net'

const answers = () => vi.fn(async () => new Response('{"result":{}}', { status: 200 }))
const refuses = () => vi.fn(async () => { throw new TypeError('Failed to fetch') })
const permission = (state: string) => vi.stubGlobal('navigator', { permissions: { query: async () => ({ state }) } })

beforeEach(() => {
  vi.unstubAllGlobals()
  activate.local.mockReset().mockResolvedValue(true)
  activate.cloud.mockReset().mockResolvedValue(true)
  cloudState.printers = []
  sessionStorage.clear()
})

describe('the instance', () => {
  it('is wss://<name>/websocket and https://<name>, only for a name in our zone', () => {
    expect(secureInstance(NAME, 'Sloe', 'p1')).toMatchObject({ apiUrl: `https://${NAME}`, socketUrl: `wss://${NAME}/websocket`, name: 'Sloe' })
    expect(secureInstance('abcdefghijklmnopqrst.example.com', 'x')).toBeNull()
    expect(secureInstance(`${NAME}.evil.com`, 'x')).toBeNull()
    expect(secureInstance('muon-sloe-b26d.local', 'x')).toBeNull()
  })
})

describe('connecting in place', () => {
  it('a name that answers connects in place: the socket is wss://<name>/websocket and the address does not change', async () => {
    vi.stubGlobal('fetch', answers())
    const before = window.location.href
    expect(await connectInPlace({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ ok: true })
    expect(activate.local).toHaveBeenCalledWith(expect.objectContaining({ apiUrl: `https://${NAME}`, socketUrl: `wss://${NAME}/websocket` }), 'p1')
    expect(window.location.href).toBe(before)
  })

  it('the probe sends no credentials, no token and no headers, and refuses redirects', async () => {
    const f = answers()
    vi.stubGlobal('fetch', f)
    expect(await probeSecureApi(NAME)).toBe('reached')
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`https://${NAME}/server/info`)
    expect(init.credentials).toBe('omit')
    expect(init.redirect).toBe('error')
    expect(init.headers).toBeUndefined()
  })

  it('never dials a name outside the zone', async () => {
    const f = answers()
    vi.stubGlobal('fetch', f)
    expect(await connectInPlace({ name: 'abcdefghijklmnopqrst.example.com', label: 'x' })).toEqual({ ok: false, why: 'bad-name' })
    expect(await probeSecureApi('evil.example.com')).toBe('unreachable')
    expect(f).not.toHaveBeenCalled()
    expect(activate.local).not.toHaveBeenCalled()
  })

  it('a probe that fails opens nothing', async () => {
    vi.stubGlobal('fetch', refuses())
    expect(await connectInPlace({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ ok: false, why: 'unreachable' })
    expect(activate.local).not.toHaveBeenCalled()
  })

  it('a refused local-network permission is told apart from an unreachable printer', async () => {
    vi.stubGlobal('fetch', refuses())
    permission('denied')
    expect(await probeSecureApi(NAME)).toBe('blocked')
    expect(LOCAL_ACCESS_BLOCKED).toMatch(/blocked access to printers on your network/)
  })
})

describe('opening from a scan result or the sign-in list (Auto)', () => {
  it('connects in place first', async () => {
    vi.stubGlobal('fetch', answers())
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: true, line: null, ask: false })
    expect(activate.cloud).not.toHaveBeenCalled()
  })

  it('then Muon3D when the account holds it online', async () => {
    vi.stubGlobal('fetch', refuses())
    cloudState.printers = [{ id: 'p1', online: true } as never]
    const r = await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })
    expect(r).toMatchObject({ opened: true, ask: false })
    expect(activate.cloud).toHaveBeenCalledWith('p1')
  })

  it('then asks about muon3d.local, and says the permission line when it was refused', async () => {
    vi.stubGlobal('fetch', refuses())
    permission('denied')
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: false, line: LOCAL_ACCESS_BLOCKED, ask: true })
  })
})

describe('muon3d.local', () => {
  it('is the only address the tab is sent to, and only when asked for', () => {
    const go = vi.fn()
    setLeave(go)
    expect(go).not.toHaveBeenCalled()
    openMuonLocal()
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(MUON_LOCAL_URL)
    expect(MUON_LOCAL_URL).toBe('http://muon3d.local/')
  })
})
