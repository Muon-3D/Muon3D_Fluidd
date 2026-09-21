import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HotspotManagerCard from '../HotspotManagerCard.vue'

const apShowCredentials = vi.fn()
const apDeviceStatus = vi.fn()
const apModify = vi.fn()

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({
    ap: {
      wifiStatusWifiApDeviceStatusGet: apDeviceStatus,
      apShowCredentialsWifiApShowGet: apShowCredentials,
      apModifyWifiApModifyPost: apModify
    }
  })
}))

vi.mock('@/aux_api/useHotspotCheck', () => ({
  useHotspotCheck: () => ({ onHotspot: ref(false) })
}))

describe('HotspotManagerCard', () => {
  beforeEach(() => {
    apModify.mockResolvedValue({ data: { status: 'modified', ssid: 'Muon-M1' } })
    apDeviceStatus.mockResolvedValue({
      data: {
        device: 'ap0',
        device_type: 'wifi',
        state: 'connected',
        connection: 'ap0-con'
      }
    })
    apShowCredentials.mockResolvedValue({
      data: {
        ssid: 'Muon-M1',
        password: null,
        autoconnect: true
      }
    })
  })

  it('keeps the password setter enabled when the API redacts the current password', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: {
        $t: (key: string) => key
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect((wrapper.vm as any).form).toEqual({
      ssid: 'Muon-M1',
      password: '',
      securityEnabled: true
    })
  })

  it('keeps the password setter enabled after saving a new password', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: {
        $t: (key: string) => key
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.vm as any
    card.form.password = 'new-password'
    await card.$nextTick()
    await card.applyChanges()
    await card.$nextTick()

    expect(apModify).toHaveBeenCalledWith({
      ssid: 'Muon-M1',
      password: 'new-password',
      autoconnect: true
    })
    expect(card.form.securityEnabled).toBe(true)
  })
})
