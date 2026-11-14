/**
 * @vitest-environment-options { "url": "https://abcdefghijklmnopqrst.lan.muon3d.com/" }
 *
 * KAN-2198: a printer serves Control itself, so the page registers no service
 * worker and removes one an earlier visit left.
 */
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

const registerSW = vi.hoisted(() => vi.fn())
vi.mock('virtual:pwa-register', () => ({ registerSW }))
vi.mock('@/services/muon-cloud/activate', () => ({ activationState: { switching: null } }))
vi.mock('@/components/ui/M3Toast.vue', () => ({ default: { render: (h: any) => h('div') } }))

const flush = () => new Promise(resolve => setTimeout(resolve))

afterEach(() => { vi.clearAllMocks(); Reflect.deleteProperty(navigator, 'serviceWorker') })

it('registers no worker and unregisters the existing one', async () => {
  const unregister = vi.fn(async () => true)
  const getRegistrations = vi.fn(async () => [{ unregister }])
  Object.defineProperty(navigator, 'serviceWorker', { value: { getRegistrations }, configurable: true })
  const RegisterServiceWorker = (await import('../RegisterServiceWorker.vue')).default
  const wrapper = mount(RegisterServiceWorker as any, {
    stubs: { 'm3-toast': true },
    mocks: { $t: (k: string) => k, $tc: (k: string) => k }
  })
  await flush()
  await flush()
  expect(registerSW).not.toHaveBeenCalled()
  expect(unregister).toHaveBeenCalledTimes(1)
  wrapper.destroy()
})
