/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-5459: a printer beside this browser that is not on the account connects in place on its own secure name, for
 * anyone, when the service's nearby list gives one. The tab never goes to a printer's address.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import { connectInPlace } from '@/services/muon-cloud/connect-in-place'
import { discoveryState } from '@/services/muon-cloud/discovery'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

vi.mock('@/services/muon-cloud/connect-in-place', async (orig) => ({ ...(await orig<object>()), connectInPlace: vi.fn() }))
const inPlace = vi.mocked(connectInPlace)

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.muonlan.net'

// A found printer: not on the account, so no `cloud`; it is known by the service's id.
const found = { key: 'found:p1', section: 'found', name: 'Sloe b26d', endpointId: 'p1', health: 'online', detail: '', host: null, active: null, saved: [] } as unknown as DirectoryEntry

const run = async (_key: string, work: () => Promise<boolean>) => { await work() }
const component = () => ({
  $store: { state: { socket: { open: false, ready: false } } },
  run,
  notice: '',
  askMuonLocal: false,
  routeProblem: null as { choices: Array<{ id: string }> } | null,
  routeProblemUrl: null as string | null,
  routeProblemEntry: null as unknown,
  failRoute: methods.failRoute,
  localRouteFor: methods.localRouteFor,
  connectLocalFromHostedPage: methods.connectLocalFromHostedPage,
  connectByAddressFor: methods.connectByAddressFor
})

function nearby (secureName: string | null) {
  discoveryState.cloudChecked = true
  discoveryState.cloud = [{ printerId: 'p1', name: 'Sloe b26d', model: 'M1', linked: true, localAddrs: ['192.168.1.20'], secureName }]
}

describe('Connect locally for a nearby printer that is not on the account', () => {
  beforeEach(() => { inPlace.mockReset() })

  it('connects in place on its secure name when it answers', async () => {
    nearby(NAME)
    inPlace.mockResolvedValue({ ok: true })
    const c = component()
    const route = (methods.localRouteFor as Fn).call(c, found)
    expect(route).toEqual({ kind: 'secure', name: NAME })
    expect(await methods.connectLocalFromHostedPage.call(c, found, route, false)).toBe(true)
    expect(inPlace).toHaveBeenCalledWith(expect.objectContaining({ name: NAME, label: 'Sloe b26d' }))
    expect(c.askMuonLocal).toBe(false)
  })

  it('with nothing else to try, asks about muon3d.local instead of opening the printer\'s address', async () => {
    nearby(NAME)
    inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
    const c = component()
    await methods.connectLocalFromHostedPage.call(c, found, (methods.localRouteFor as Fn).call(c, found), false)
    expect(c.askMuonLocal).toBe(false)
    expect(c.routeProblem?.choices[0]).toMatchObject({ id: 'open-page' })
    expect(c.routeProblemUrl).toBe('http://192.168.1.20/sloe-b26d')
  })

  it('without a secure name from the console there is no local route from this page', () => {
    nearby(null)
    const route = (methods.localRouteFor as Fn).call(component(), found) as { kind: string }
    expect(route.kind).toBe('page')
  })

  it('ignores a name outside our zone', () => {
    nearby('abcdefghijklmnopqrst.example.com')
    const route = (methods.localRouteFor as Fn).call(component(), found) as { kind: string }
    expect(route.kind).toBe('page')
  })
})
