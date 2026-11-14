/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2198: the automatic-switch row means nothing on a page the console
 * serves, so it is not there.
 */
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import SecuritySettings from '../SecuritySettings.vue'

it('hides the automatic switch row on control.muon3d.com', async () => {
  const http = { get: vi.fn(async () => ({ status: 200, data: { claimed: true, knobs: [], switches: [] } })), post: vi.fn() }
  const wrapper = mount(SecuritySettings as any, {
    computed: { isMuonPrinter: () => true, canManageAccess: () => true },
    mocks: { $httpClient: http, $store: { state: { config: { apiUrl: 'https://control.muon3d.com' } }, getters: { 'config/getDisplayName': 'Boxwood' } } },
    stubs: { 'locked-row': true, 'can-manage-access': { template: '<div><slot /></div>' }, 'toggle-switch': true }
  })
  await new Promise(resolve => setTimeout(resolve))
  expect(wrapper.find('[data-tid="security-settings"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="security-auto-switch"]').exists()).toBe(false)
})
