/**
 * @vitest-environment-options { "url": "http://192.168.1.20/" }
 *
 * KAN-2198 (A-6c): on a plain-HTTP page nothing is probed.
 */
import { describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

describe('opening an account printer on a plain-HTTP page', () => {
  it('does not probe the secure address', async () => {
    const f = vi.fn(async () => ({ ok: true, text: async () => 'muon3d-secure-origin-1' }))
    vi.stubGlobal('fetch', f)
    const c = {
      $store: { state: { socket: { open: false, ready: false } } },
      connectCloud: vi.fn(),
      connectLocal: vi.fn(),
      run: vi.fn(async (_key: string, work: () => Promise<boolean>) => { await work() })
    }
    const e = {
      key: 'cloud:h1',
      section: 'cloud',
      name: 'Boxwood',
      host: null,
      active: null,
      saved: [],
      cloud: { id: 'h1', online: true, secure_name: 'abcdefghijklmnopqrst.lan.muon3d.com' }
    } as unknown as DirectoryEntry
    await methods.openCloudEntry.call(c, e)
    expect(f).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
