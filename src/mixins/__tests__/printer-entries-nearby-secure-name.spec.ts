/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-5459: a printer beside this browser that is not on the account is opened on its own secure name, for anyone,
 * when the service's nearby list gives one; the .local page is the fallback.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin, { setNavigate } from '../printer-entries'
import { discoveryState } from '@/services/muon-cloud/discovery'
import { forgetSecureReach } from '@/services/secure-origin/hosted'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.muonlan.net'
const MARKER = 'muon3d-secure-origin-1'

// A found printer: not on the account, so no `cloud`; it is known by the service's id.
const found = { key: 'found:p1', section: 'found', name: 'Sloe b26d', endpointId: 'p1', health: 'online', detail: '', host: null, active: null, saved: [] } as unknown as DirectoryEntry

const run = async (_key: string, work: () => Promise<boolean>) => { await work() }
const component = (navigate: (u: string) => void) => {
  setNavigate(navigate)
  return {
    $store: { state: { socket: { open: false, ready: false } } },
    run,
    notice: '',
    localRouteFor: methods.localRouteFor,
    connectLocalFromHostedPage: methods.connectLocalFromHostedPage
  }
}

function nearby (secureName: string | null) {
  discoveryState.cloudChecked = true
  discoveryState.cloud = [{ printerId: 'p1', name: 'Sloe b26d', model: 'M1', linked: true, localAddrs: ['192.168.1.20'], secureName }]
}

describe('Connect locally for a nearby printer that is not on the account', () => {
  beforeEach(() => { forgetSecureReach(); vi.restoreAllMocks() })

  it('goes to its secure name, the same tab, when it answers', async () => {
    nearby(NAME)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(MARKER + '\n', { status: 200 })))
    const navigate = vi.fn()
    const c = component(navigate)
    const route = (methods.localRouteFor as Fn).call(c, found)
    expect(route).toEqual({ kind: 'secure', name: NAME })
    await methods.connectLocalFromHostedPage.call(c, found, route)
    expect(navigate).toHaveBeenCalledWith(`https://${NAME}/`)
  })

  it('falls back to its .local page when the secure name does not answer', async () => {
    nearby(NAME)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const navigate = vi.fn()
    const c = component(navigate)
    const route = (methods.localRouteFor as Fn).call(c, found)
    await methods.connectLocalFromHostedPage.call(c, found, route)
    expect(navigate).toHaveBeenCalledWith('http://192.168.1.20/')
  })

  it('without a secure name from the console, it is the local page as before', () => {
    nearby(null)
    const route = (methods.localRouteFor as Fn).call(component(vi.fn()), found) as { kind: string }
    expect(route.kind).toBe('page')
  })

  it('ignores a name outside our zone', () => {
    nearby('abcdefghijklmnopqrst.example.com')
    const route = (methods.localRouteFor as Fn).call(component(vi.fn()), found) as { kind: string }
    expect(route.kind).toBe('page')
  })
})
