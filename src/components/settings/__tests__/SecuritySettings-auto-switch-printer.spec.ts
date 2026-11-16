/**
 * @vitest-environment-options { "url": "http://192.168.1.50/" }
 *
 * KAN-2198: on a printer's plain-HTTP page, Settings > Security has this
 * browser's own "switch to the secure address automatically" row.
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SecuritySettings from '../SecuritySettings.vue'

const settle = () => new Promise(resolve => setTimeout(resolve))

function mounted () {
  const http = { get: vi.fn(async () => ({ status: 200, data: { claimed: true, knobs: [], switches: [] } })), post: vi.fn() }
  return mount(SecuritySettings as any, {
    computed: { isMuonPrinter: () => true, canManageAccess: () => true },
    mocks: { $httpClient: http, $store: { state: { config: { apiUrl: 'http://192.168.1.50' } }, getters: { 'config/getDisplayName': 'Boxwood' } } },
    stubs: { 'locked-row': true, 'can-manage-access': { template: '<div><slot /></div>' }, 'toggle-switch': { props: ['value', 'label'], template: '<button role="switch" :aria-label="label" :aria-checked="String(value)" @click="$emit(\'input\', !value)" />' } }
  })
}

beforeEach(() => localStorage.clear())

describe('automatic switch setting on a printer page', () => {
  it('shows the row, off until a person turns it on', async () => {
    const wrapper = mounted()
    await settle()
    const row = wrapper.find('[data-tid="security-auto-switch"]')
    expect(row.exists()).toBe(true)
    expect(row.text()).toContain('Switch to the secure address automatically')
    expect(row.text()).toContain('On this browser. When this printer has a secure address that works here, Control opens it by itself.')
    expect(row.find('button').attributes('aria-checked')).toBe('false')
  })

  it('writes the browser-local choice both ways', async () => {
    const wrapper = mounted()
    await settle()
    await wrapper.find('[data-tid="security-auto-switch"] button').trigger('click')
    expect(localStorage.getItem('muon.secureOrigin.auto')).toBe('1')
    expect(wrapper.find('[data-tid="security-auto-switch"] button').attributes('aria-checked')).toBe('true')
    await wrapper.find('[data-tid="security-auto-switch"] button').trigger('click')
    expect(localStorage.getItem('muon.secureOrigin.auto')).toBe('0')
  })

  it('shows the saved choice', async () => {
    localStorage.setItem('muon.secureOrigin.auto', '1')
    const wrapper = mounted()
    await settle()
    expect(wrapper.find('[data-tid="security-auto-switch"] button').attributes('aria-checked')).toBe('true')
  })
})
