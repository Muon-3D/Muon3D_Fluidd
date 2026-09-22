import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HotspotManagerCard from '../HotspotManagerCard.vue'

const apShowCredentials = vi.fn()
const apDeviceStatus = vi.fn()
const apModify = vi.fn()
const apUp = vi.fn()
const apDown = vi.fn()

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({
    ap: {
      wifiStatusWifiApDeviceStatusGet: apDeviceStatus,
      apShowCredentialsWifiApShowGet: apShowCredentials,
      apModifyWifiApModifyPost: apModify,
      apUpWifiApUpPost: apUp,
      apDownWifiApDownPost: apDown
    }
  })
}))

vi.mock('@/aux_api/useHotspotCheck', () => ({
  useHotspotCheck: () => ({ onHotspot: ref(false) })
}))

describe('HotspotManagerCard', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    apModify.mockResolvedValue({ data: { status: 'modified', ssid: 'Muon-M1' } })
    apUp.mockResolvedValue({ data: { status: 'activation-requested' } })
    apDown.mockResolvedValue({ data: { status: 'deactivation-requested' } })
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
        autoconnect: true,
        security_enabled: true
      }
    })
  })

  it('reflects an unsecured hotspot reported by the API', async () => {
    apShowCredentials.mockResolvedValueOnce({
      data: {
        ssid: 'Muon-M1',
        password: null,
        autoconnect: true,
        security_enabled: false
      }
    })
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: { $t: (key: string) => key }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect((wrapper.vm as any).form.securityEnabled).toBe(false)
  })

  it('hides an entered password until the reveal control is used', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: { $t: (key: string) => key }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const passwordField = wrapper.findAll('v-text-field-stub').at(1)
    expect(passwordField.attributes('type')).toBe('password')

    passwordField.vm.$emit('click:append', new MouseEvent('click'))
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('v-text-field-stub').at(1).attributes('type')).toBe('text')
  })

  it('updates the hotspot switch when the device changes outside Fluidd', async () => {
    vi.useFakeTimers()
    apDeviceStatus
      .mockResolvedValueOnce({
        data: {
          device: 'ap0',
          device_type: 'wifi',
          state: 'connected',
          connection: 'ap0-con'
        }
      })
      .mockResolvedValueOnce({
        data: {
          device: 'ap0',
          device_type: 'wifi',
          state: 'disconnected',
          connection: null
        }
      })
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: { $t: (key: string) => key }
    })

    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).apState).toBe(true)

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()

    expect((wrapper.vm as any).apState).toBe(false)
    wrapper.destroy()
    vi.useRealTimers()
  })

  it('does not rewrite or reload hotspot credentials just to turn it off', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: { $t: (key: string) => key }
    })
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    await (wrapper.vm as any).confirmToggle()

    expect(apDown).toHaveBeenCalledTimes(1)
    expect(apModify).not.toHaveBeenCalled()
    expect(apShowCredentials).toHaveBeenCalledTimes(1)
    expect((wrapper.vm as any).apState).toBe(false)
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

  it('queues hotspot activation only once after saving while it is off', async () => {
    apDeviceStatus.mockResolvedValue({
      data: {
        device: 'ap0',
        device_type: 'wifi',
        state: 'disconnected',
        connection: null
      }
    })
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: { $t: (key: string) => key }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.vm as any
    card.form.password = 'new-password'
    await card.$nextTick()
    await card.confirmApply()

    expect(apModify).toHaveBeenCalledTimes(1)
    expect(apUp).toHaveBeenCalledTimes(1)
  })
})
