/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2198 (A-6c): the hosted page opens a printer on its secure address.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import { connectInPlace } from '@/services/muon-cloud/connect-in-place'
import { forgetSecureReach, relayChosen } from '@/services/secure-origin/hosted'
import { useBluetoothFor, stopUsingBluetoothFor } from '@/services/muon-ble/link'
import { chooseRouteMode } from '@/services/muon-cloud/route-choice'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

vi.mock('@/services/muon-cloud/connect-in-place', async (orig) => ({ ...(await orig<object>()), connectInPlace: vi.fn() }))
const inPlace = vi.mocked(connectInPlace)

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.muonlan.net'

let n = 0
const entry = (...args: [unknown?]): DirectoryEntry => {
  const secureName = args.length ? args[0] : NAME
  n++
  return {
    key: `cloud:p${n}`,
    section: 'cloud',
    name: 'Boxwood',
    endpointId: `p${n}`,
    health: 'online',
    detail: '',
    host: null,
    active: null,
    linkedTo: 'mine',
    saved: [],
    cloud: { id: `p${n}`, online: true, secure_name: secureName }
  } as unknown as DirectoryEntry
}

const run = async (_key: string, work: () => Promise<boolean>) => { await work() }

const component = () => ({
  $store: { state: { socket: { open: false, ready: false } } },
  notice: null as string | null,
  afterOpen: vi.fn(),
  connectCloud: vi.fn(),
  connectLocal: vi.fn(),
  run: vi.fn(run)
})

const nav = vi.fn()
beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  nav.mockReset()
  inPlace.mockReset()
  inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
  vi.unstubAllGlobals()
})

describe('opening an account printer on the hosted page', () => {
  it.each([true, false])('a late secure probe (%s) cannot override an explicit Bluetooth choice', async reached => {
    const e = entry()
    inPlace.mockImplementation(async () => {
      chooseRouteMode(e.cloud!.id, 'ble')
      return reached ? { ok: true } : { ok: false, why: 'unreachable' }
    })
    const c = component()
    await methods.openCloudEntry.call(c, e)
    expect(nav).not.toHaveBeenCalled()
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.connectLocal).not.toHaveBeenCalled()
  })
  it('connects in place over the secure name when it answers, and uses no other way in', async () => {
    inPlace.mockResolvedValue({ ok: true })
    const c = component()
    await methods.openCloudEntry.call(c, entry())
    expect(inPlace).toHaveBeenCalledWith(expect.objectContaining({ name: NAME, label: 'Boxwood' }))
    expect(nav).not.toHaveBeenCalled()
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.connectLocal).not.toHaveBeenCalled()
  })

  it('falls back to Muon3D when it does not answer, and says so once', async () => {
    const e = entry()
    const c = component()
    await methods.openCloudEntry.call(c, e)
    expect(nav).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
    expect(c.notice).toBe("Opened Boxwood through Muon3D. This browser can't reach its secure address on this network.")
    c.notice = null
    await methods.openCloudEntry.call(c, e)
    expect(c.connectCloud).toHaveBeenCalledTimes(2)
    expect(c.notice).toBeNull()
  })

  it('does not probe once the person chose Muon3D', async () => {
    const e = entry()
    await Promise.resolve(methods.connectCloud.call({ run }, e, 'relay')).catch(() => {})
    expect(relayChosen(e.cloud!.id)).toBe(true)
    const c = component()
    await methods.openCloudEntry.call(c, e)
    expect(inPlace).not.toHaveBeenCalled()
    expect(nav).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('does not probe when Bluetooth is chosen', async () => {
    const e = entry()
    useBluetoothFor(e.cloud!.id, {} as never)
    const c = component()
    await methods.openCloudEntry.call(c, e)
    stopUsingBluetoothFor(e.cloud!.id)
    expect(inPlace).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it.each([[null], ['abcdefghijklmnopqrst.evil.com'], [undefined]])('does not probe for secure_name %s', async value => {
    const c = component()
    await methods.openCloudEntry.call(c, entry(value))
    expect(inPlace).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('"Through Muon3D" holds the choice', async () => {
    const e = entry()
    expect(relayChosen(e.cloud!.id)).toBe(false)
    await Promise.resolve(methods.connectCloud.call({ run }, e, 'relay')).catch(() => {})
    expect(relayChosen(e.cloud!.id)).toBe(true)
  })
})
