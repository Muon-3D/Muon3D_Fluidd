/**
 * @vitest-environment-options { "url": "http://10.42.0.1/" }
 *
 * KAN-2192 (H2/B9): the browser's Iroh key is this browser's identity to
 * every printer the account reaches. On the printer's plain-HTTP address
 * (here the hotspot, the origin every printer shares) the page never makes,
 * reads or keeps one, and removes a key an older build left.
 */
import { afterEach, expect, it, vi } from 'vitest'

const binding = vi.hoisted(() => ({
  init: vi.fn<[unknown], Promise<void>>().mockResolvedValue(undefined),
  create: vi.fn(async () => ({ endpointId: () => 'browser', secretKey: () => new Uint8Array(32).fill(7), close: async () => {} }))
}))
vi.mock('../vendor/muon-link-web/1608e20/muon_link_web.js', () => ({ default: binding.init, MuonEndpoint: { create: binding.create } }))

const OLD_KEY = 'ab'.repeat(32)

afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); localStorage.clear() })

it('removes a key an older build stored, when the module loads', async () => {
  localStorage.setItem('muon.cloud.key', OLD_KEY)
  localStorage.setItem('muon.cloud.active', 'printer-1')
  vi.resetModules()
  await import('../iroh')
  expect(localStorage.getItem('muon.cloud.key')).toBeNull()
  // Only the key goes.
  expect(localStorage.getItem('muon.cloud.active')).toBe('printer-1')
})

it('refuses to make an endpoint: no key is created, read or written', async () => {
  vi.resetModules()
  const { browserEndpoint } = await import('../iroh')
  // A key planted after load must not be picked up either.
  localStorage.setItem('muon.cloud.key', OLD_KEY)
  await expect(browserEndpoint('https://relay.example.test')).rejects.toMatchObject({ code: 'insecure_origin' })
  expect(binding.init).not.toHaveBeenCalled()
  expect(binding.create).not.toHaveBeenCalled()
  expect(localStorage.getItem('muon.cloud.key')).toBe(OLD_KEY)
})

it('removes a key that a tab running an older build writes back', async () => {
  vi.resetModules()
  await import('../iroh')
  localStorage.setItem('muon.cloud.key', OLD_KEY)
  window.dispatchEvent(new StorageEvent('storage', { key: 'muon.cloud.key', newValue: OLD_KEY }))
  expect(localStorage.getItem('muon.cloud.key')).toBeNull()
  // Another key changing is not its business.
  localStorage.setItem('muon.cloud.active', 'printer-1')
  window.dispatchEvent(new StorageEvent('storage', { key: 'muon.cloud.active', newValue: 'printer-1' }))
  expect(localStorage.getItem('muon.cloud.active')).toBe('printer-1')
})
