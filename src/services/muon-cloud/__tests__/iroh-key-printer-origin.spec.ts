/**
 * @vitest-environment-options { "url": "https://abcdefghijklmnopqrst.lan.muon3d.com/" }
 *
 * KAN-2198: on a printer's secure address the browser's Iroh key lives in
 * memory only: a key an older build left in localStorage is removed when the
 * module loads, and making an endpoint never writes one back.
 */
import { afterEach, expect, it, vi } from 'vitest'

const binding = vi.hoisted(() => ({
  init: vi.fn<[unknown], Promise<void>>().mockResolvedValue(undefined),
  create: vi.fn(async () => ({ endpointId: () => 'browser', secretKey: () => new Uint8Array(32).fill(7), close: async () => {} }))
}))
vi.mock('../vendor/muon-link-web/1d6706d/muon_link_web.js', () => ({ default: binding.init, MuonEndpoint: { create: binding.create } }))

const OLD_KEY = 'ab'.repeat(32)

afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); localStorage.clear() })

it('removes a key an older build stored, when the module loads', async () => {
  localStorage.setItem('muon.cloud.key', OLD_KEY)
  vi.resetModules()
  await import('../iroh')
  expect(localStorage.getItem('muon.cloud.key')).toBeNull()
})

it('makes an endpoint without writing a key to localStorage', async () => {
  vi.resetModules()
  const { browserEndpoint } = await import('../iroh')
  await browserEndpoint('https://relay.example.test')
  expect(binding.create).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem('muon.cloud.key')).toBeNull()
})
