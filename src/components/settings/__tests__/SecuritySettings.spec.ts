import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { MANAGED_API_URL } from '@/services/muon-cloud/origin'
import SecuritySettings from '../SecuritySettings.vue'

const settle = () => new Promise(resolve => setTimeout(resolve))

const LIST = {
  claimed: true,
  knobs: [
    { id: 'wifi_change', value: 'owner_and_shared', default: 'owner_and_shared', read_only: false },
    { id: 'plate_clear', value: 'owner_and_shared', read_only: false },
    { id: 'dev_mode_first_entry', value: 'owner_at_printer', values: ['owner_at_printer'], read_only: true, fixed: true }
  ],
  switches: [{ id: 'hotspot_change_confirm', label: 'Confirm hotspot changes', value: false, default: false, read_only: false }]
}

function mounted (apiUrl: string, post: (url: string, body: unknown) => unknown = () => ({ status: 200, data: {} }), list: unknown = LIST) {
  const http = {
    get: vi.fn(async () => ({ status: 200, data: list })),
    post: vi.fn(async (url: string, body: unknown) => post(url, body))
  }
  const wrapper = mount(SecuritySettings as any, {
    computed: { isMuonPrinter: () => true, canManageAccess: () => true },
    mocks: {
      $httpClient: http,
      $store: { state: { config: { apiUrl } }, getters: { 'config/getDisplayName': 'Boxwood' } }
    },
    stubs: { 'locked-row': { props: ['label', 'reasonText'], template: '<div data-tid="locked-row"><span data-tid="locked-row-label">{{ label }}</span></div>' }, 'can-manage-access': { template: '<div><slot /></div>' }, 'toggle-switch': { props: ['value', 'label'], template: '<button role="switch" :aria-label="label" @click="$emit(\'input\', !value)" />' } }
  })
  return { wrapper, http }
}

describe('Security settings routes', () => {
  it('reads and changes over /server/aux on the LAN, and shows the claimed default and the fixed row as printer only', async () => {
    const { wrapper, http } = mounted('http://boxwood.local')
    await settle()
    expect(http.get).toHaveBeenCalledWith('/server/aux/permissions', expect.anything())
    // wifi_change reports owner_and_shared but plate_clear reports none (so it reads open): mixed, no default sentence.
    expect(wrapper.find('[data-tid="security-claimed"]').text()).toBe('A claimed printer. The owner can restrict each one.')
    const options = wrapper.find('[data-knob="wifi_change"] select').findAll('option').wrappers.map(o => o.text())
    expect(options).toEqual(['Anyone', 'Owner and shared users', 'Owner', 'Owner, at the printer'])
    expect(wrapper.find('[data-knob="plate_clear"] [data-tid="security-default"]').text()).toBe('Open by default. Now set to Owner and shared users.')
    const fixed = wrapper.find('[data-tid="security-printer-only"]')
    expect(fixed.text()).toContain('The first time developer mode is turned on')
    expect(fixed.find('select').exists()).toBe(false)

    await wrapper.find('[data-knob="wifi_change"] select').setValue('owner')
    await settle()
    expect(http.post).toHaveBeenCalledWith('/server/aux/permissions', { id: 'wifi_change', value: 'owner' }, expect.anything())
    await wrapper.find('[data-switch="hotspot_change_confirm"] button').trigger('click')
    await settle()
    expect(http.post).toHaveBeenCalledWith('/server/aux/permissions/switch', { id: 'hotspot_change_confirm', value: true }, expect.anything())
  })

  it('goes over /muon-link on a managed session, never /server/aux, and shows detail.message on a refusal', async () => {
    const refusal = { status: 403, data: { detail: { code: 'permission_restricted', knob: 'wifi_change', message: 'Only the owner may change Wi-Fi on this printer.' } } }
    const { wrapper, http } = mounted(MANAGED_API_URL, () => refusal)
    await settle()
    expect(http.get).toHaveBeenCalledWith('/muon-link/permissions', expect.anything())
    await wrapper.find('[data-knob="wifi_change"] select').setValue('owner')
    await settle()
    expect(http.post).toHaveBeenCalledWith('/muon-link/permissions', { id: 'wifi_change', value: 'owner' }, expect.anything())
    expect(wrapper.find('[data-knob="wifi_change"] [data-tid="security-note"]').text()).toBe('Only the owner may change Wi-Fi on this printer.')
    await wrapper.find('[data-switch="hotspot_change_confirm"] button').trigger('click')
    await settle()
    expect(http.post).toHaveBeenCalledWith('/muon-link/permissions/switch', { id: 'hotspot_change_confirm', value: true }, expect.anything())
    for (const call of [...http.get.mock.calls, ...http.post.mock.calls]) expect(String(call[0])).not.toContain('/server/aux')
  })

  describe('the default sentence is built from what the printer reports (KAN-2457)', () => {
    const knobs = (claimed: boolean, defaults: Array<string | undefined>) => ({
      claimed,
      knobs: defaults.map((d, i) => ({ id: ['wifi_change', 'hotspot_toggle', 'plate_clear'][i], value: 'owner', ...(d ? { default: d } : {}) })),
      switches: []
    })
    const line = async (list: unknown) => {
      const { wrapper } = mounted('http://boxwood.local', undefined, list)
      await settle()
      return wrapper.find('[data-tid="security-claimed"]').text()
    }

    it('says anyone when every setting reports anyone, whether or not claimed', async () => {
      expect(await line(knobs(true, ['anyone', 'anyone']))).toBe('A claimed printer: Anyone may do each of these by default. The owner can restrict each one.')
      expect(await line(knobs(false, ['anyone', 'anyone']))).toBe('An open printer: Anyone may do each of these by default. The owner can restrict each one.')
    })

    it('says owner and shared users for a train 12 printer that reports it', async () => {
      expect(await line(knobs(true, ['owner_and_shared', 'owner_and_shared']))).toBe('A claimed printer: Owner and shared users by default. The owner can restrict each one.')
    })

    it('says nothing about defaults when they differ', async () => {
      expect(await line(knobs(true, ['anyone', 'owner_and_shared']))).toBe('A claimed printer. The owner can restrict each one.')
    })
  })
})
