/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2198: the other half of `printer-origin-console-screens.spec.ts`: on the
 * console's own page `consoleServesPage()` is true.
 */
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs() })

it('consoleServesPage() is true on control.muon3d.com', async () => {
  vi.stubEnv('VUE_MUON_CLOUD_URL', 'https://control.muon3d.com')
  vi.resetModules()
  const login = await import('@/services/muon-cloud/centralLogin')
  expect(login.consoleServesPage()).toBe(true)
  expect(login.centralLoginEnabled()).toBe(true)
})
