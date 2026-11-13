/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2198 (A-6c): the hosted page opens a printer on its secure address.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin, { setNavigate } from '../printer-entries'
import { forgetSecureReach, relayChosen } from '@/services/secure-origin/hosted'
import { useBluetoothFor, stopUsingBluetoothFor } from '@/services/muon-ble/link'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.lan.muon3d.com'
const MARKER = 'muon3d-secure-origin-1'

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

const probes = (f: { mock: { calls: unknown[][] } }) => f.mock.calls.filter(c => String(c[0]).includes('secure-probe'))

const marker = () => vi.fn(async () => ({ ok: true, text: async () => MARKER }))
const nothing = () => vi.fn(async () => { throw new TypeError('blocked') })

const nav = vi.fn()
beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  nav.mockReset()
  setNavigate(nav)
  vi.unstubAllGlobals()
})

describe('opening an account printer on the hosted page', () => {
  it('goes to the secure address when it answers, and uses no other way in', async () => {
    vi.stubGlobal('fetch', marker())
    const c = component()
    await methods.openCloudEntry.call(c, entry())
    expect(nav).toHaveBeenCalledWith(`https://${NAME}/`)
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.connectLocal).not.toHaveBeenCalled()
  })

  it('falls back to Muon3D when it does not answer, and says so once', async () => {
    vi.stubGlobal('fetch', nothing())
    const e = entry()
    const c = component()
    await methods.openCloudEntry.call(c, e)
    expect(nav).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
    expect(c.notice).toBe("Opened Boxwood through Muon3D. This browser can't reach its secure address on this network.")
    c.notice = null
    forgetSecureReach()
    await methods.openCloudEntry.call(c, e)
    expect(c.connectCloud).toHaveBeenCalledTimes(2)
    expect(c.notice).toBeNull()
  })

  it('does not probe once the person chose Muon3D', async () => {
    const f = marker()
    vi.stubGlobal('fetch', f)
    const e = entry()
    await methods.connectCloud.call({ run }, e, 'relay').catch(() => {})
    expect(relayChosen(e.cloud!.id)).toBe(true)
    const c = component()
    await methods.openCloudEntry.call(c, e)
    expect(probes(f)).toEqual([])
    expect(nav).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('does not probe when Bluetooth is chosen', async () => {
    const f = marker()
    vi.stubGlobal('fetch', f)
    const e = entry()
    useBluetoothFor(e.cloud!.id, {} as never)
    const c = component()
    await methods.openCloudEntry.call(c, e)
    stopUsingBluetoothFor(e.cloud!.id)
    expect(probes(f)).toEqual([])
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it.each([[null], ['abcdefghijklmnopqrst.evil.com'], [undefined]])('does not probe for secure_name %s', async value => {
    const f = marker()
    vi.stubGlobal('fetch', f)
    const c = component()
    await methods.openCloudEntry.call(c, entry(value))
    expect(probes(f)).toEqual([])
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('"Through Muon3D" holds the choice', async () => {
    const e = entry()
    expect(relayChosen(e.cloud!.id)).toBe(false)
    await methods.connectCloud.call({ run }, e, 'relay').catch(() => {})
    expect(relayChosen(e.cloud!.id)).toBe(true)
  })
})
