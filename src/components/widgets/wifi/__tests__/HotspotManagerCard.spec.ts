import { enableAutoDestroy, shallowMount } from '@vue/test-utils'
import Vue, { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HotspotManagerCard from '../HotspotManagerCard.vue'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

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

const emit = vi.fn()
vi.mock('@/eventBus', () => ({
  EventBus: { $emit: (...args: unknown[]) => emit(...args) }
}))

const dispatch = vi.fn()

/** `locked`: MuonOS network protection is on and this browser has no identity. */
const mocks = (locked = false) => ({
  $t: (key: string) => key,
  $store: { getters: { 'protection/isLocked': locked }, dispatch }
})

/** Moonraker's refusal, as axios hands it to the card. */
const refused = (message: string) => Object.assign(new Error('Request failed with status code 403'), {
  response: { status: 403, statusText: 'Forbidden', data: { error: { code: 403, message } } }
})

// A card polls on a real interval until destroyed. Without this, a wrapper
// from one test keeps calling the Aux API during the next.
enableAutoDestroy(afterEach)

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
      mocks: mocks()
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect((wrapper.vm as any).form.securityEnabled).toBe(false)
  })

  it('hides an entered password until the reveal control is used', async () => {
    const wrapper = shallowMount(HotspotManagerCard, {
      mocks: mocks()
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
      mocks: mocks()
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
      mocks: mocks()
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
      mocks: mocks()
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
      mocks: mocks()
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.vm as any
    card.form.password = 'new-password'
    await card.$nextTick()
    await card.applyChanges()
    await card.$nextTick()

    expect(apModify).toHaveBeenCalledWith({
      ssid: 'Muon-M1',
      password: 'new-password'
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
      mocks: mocks()
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const card = wrapper.vm as any
    card.form.password = 'new-password'
    await card.$nextTick()
    await card.confirmApply()

    expect(apModify).toHaveBeenCalledTimes(1)
    expect(apUp).toHaveBeenCalledTimes(1)
  })

  describe('under network protection (SEC-8)', () => {
    it('says it is protected, and asks the Aux API nothing', async () => {
      vi.useFakeTimers()
      const wrapper = shallowMount(HotspotManagerCard, {
        mocks: mocks(true),
        // Renders the #menu slot too, which holds the on/off switch.
        stubs: { CollapsableCard: { template: '<div><slot name="menu" /><slot /></div>' } }
      })
      await vi.advanceTimersByTimeAsync(3000)

      expect(wrapper.find('protectednotice-stub').exists()).toBe(true)
      expect(wrapper.find('.d-flex.align-stretch').exists()).toBe(false)
      expect(wrapper.find('v-switch-stub').attributes('disabled')).toBe('true')
      expect(apDeviceStatus).not.toHaveBeenCalled()
      expect(apShowCredentials).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('disables the switch when protection comes on after the card has loaded', async () => {
      const $store = Vue.observable({ getters: { 'protection/isLocked': false }, dispatch })
      const wrapper = shallowMount(HotspotManagerCard, {
        mocks: { $t: (key: string) => key, $store },
        stubs: { CollapsableCard: { template: '<div><slot name="menu" /><slot /></div>' } }
      })
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(wrapper.find('v-switch-stub').attributes('disabled')).toBeUndefined()

      $store.getters['protection/isLocked'] = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('v-switch-stub').attributes('disabled')).toBe('true')
      expect(wrapper.find('protectednotice-stub').exists()).toBe(true)
      wrapper.destroy()
    })

    it('loads the hotspot settings it skipped once protection comes off', async () => {
      // Mounted while locked, the card never asked for its settings. The status
      // poll resumes on its own, but only reads the state, so without this the
      // SSID stayed empty and the switch disabled until the page was reloaded.
      const $store = Vue.observable({ getters: { 'protection/isLocked': true }, dispatch })
      const wrapper = shallowMount(HotspotManagerCard, { mocks: { $t: (key: string) => key, $store } })
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(apShowCredentials).not.toHaveBeenCalled()

      $store.getters['protection/isLocked'] = false
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(apShowCredentials).toHaveBeenCalledTimes(1)
      expect((wrapper.vm as any).apCredentials?.ssid).toBe('Muon-M1')
    })

    it('does not toast a refused load nobody asked for', async () => {
      // Opening the Wi-Fi page directly can mount the card before the level has
      // arrived. The refusal is expected; the notice explains it a moment later.
      apDeviceStatus.mockRejectedValue(refused("'/server/aux/wifi/ap/device/status' is protected on this printer."))
      shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(emit).not.toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith('protection/onRefused')
    })

    it("shows Moonraker's reason when a toggle is refused, and asks for the level again", async () => {
      const reason = "'/server/aux/wifi/ap/down' is protected on this printer."
      apDown.mockRejectedValueOnce(refused(reason))
      const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
      await new Promise(resolve => setTimeout(resolve, 10))

      await (wrapper.vm as any).confirmToggle()

      expect(emit).toHaveBeenCalledWith(
        `app.wifi.msg.hotspot.toggle_error ${reason}`,
        { type: 'error', timeout: 5000 }
      )
      expect(dispatch).toHaveBeenCalledWith('protection/onRefused')
      expect((wrapper.vm as any).apState).toBe(true)
      wrapper.destroy()
    })
  })
})

describe('HotspotManagerCard over Iroh (07 §3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apDeviceStatus.mockResolvedValue({ data: { device: 'ap0', device_type: 'wifi', state: 'connected', connection: 'ap0-con' } })
    apShowCredentials.mockResolvedValue({ data: { ssid: 'Muon-M1', password: null, autoconnect: true, security_enabled: true } })
  })

  afterEach(() => {
    printerTransportBinding.remote = false
  })

  it('shows the hotspot, says why it cannot be changed, and offers no toggle or edit', async () => {
    printerTransportBinding.remote = true
    const wrapper = shallowMount(HotspotManagerCard, { mocks: mocks() })
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    const card = wrapper.vm as any

    expect(apDeviceStatus).toHaveBeenCalled()
    expect(wrapper.text()).toContain('app.wifi.remote_read_only')

    // The on/off switch sits in the card's menu slot, which a shallow mount
    // does not render; what it would call must do nothing.
    card.requestToggle()
    await card.requestApplyChanges()
    expect(apDown).not.toHaveBeenCalled()
    expect(apUp).not.toHaveBeenCalled()
    expect(apModify).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
