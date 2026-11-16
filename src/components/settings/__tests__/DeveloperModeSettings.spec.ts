import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHALLENGE, FakePrinter, OWNER } from '@/services/dev-mode/__tests__/fakePrinter'

// The Aux API's own client is only for reading the state, backing up and
// starting again from the defaults now. A change never goes through it.
const api = vi.hoisted(() => ({
  getDevModeStatusDevModeGet: vi.fn(),
  getDevModeWaiverDevModeWaiverGet: vi.fn(),
  openDevModeConsentDevModeConsentPost: vi.fn(),
  getDevModeConsentDevModeConsentChallengeIdGet: vi.fn(),
  setDevModeDevModePost: vi.fn(),
  refreshDevModeConfigDevModeRefreshPost: vi.fn(),
  manualBackupDevModeBackupPost: vi.fn()
}))

vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({ devMode: api })
}))

const http = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), serverMuonDevModeGet: vi.fn() }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))

// The mocks must be registered before the component and the state capture useAuxApi().
// eslint-disable-next-line import/first
import DeveloperModeSettings from '../DeveloperModeSettings.vue'
// eslint-disable-next-line import/first
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'

let printer: FakePrinter

function component () {
  const vm = new (DeveloperModeSettings as any)()
  vm.$t = (key: string) => key
  return vm
}

const settle = () => new Promise(resolve => setTimeout(resolve))

function mounted () {
  return mount(DeveloperModeSettings as any, {
    mocks: { $t: (key: string) => key },
    stubs: {
      'v-dialog': { props: ['value'], template: '<div v-if="value"><slot /></div>' },
      'toggle-switch': { props: ['value', 'disabled'], template: '<button data-tid="developer-mode-switch" :disabled="disabled" />' },
      'frame-icon': true,
      'router-link': true
    }
  })
}

const status = (over: Record<string, unknown> = {}) => ({
  data: { enabled: false, core_cfg: '/opt/klipper/core/M1/core.cfg', guard_armed: true, otp_record_armed: false, otp_fuse: null, ...over }
})

describe('developer mode in Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    printer = new FakePrinter()
    ;(Vue as unknown as { $httpClient: unknown }).$httpClient = printer
    // As on a real printer: the state read follows what the printer did.
    api.getDevModeStatusDevModeGet.mockImplementation(async () => status({ enabled: printer.devMode }))
  })

  it('reads whether the printer would record it for good', async () => {
    await refreshDevMode()
    expect(devModeState).toMatchObject({ enabled: false, canManage: true, guardArmed: true, otpArmed: false })
    expect(component().fuseText).toMatch(/fuse is disarmed, so you can turn developer mode on and off freely/)

    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ otp_record_armed: true }))
    await refreshDevMode()
    expect(component().fuseTone).toBe('warn')
  })

  it('does not take a page that answers with HTML for an answer', async () => {
    api.getDevModeStatusDevModeGet.mockResolvedValue({ data: '<!doctype html>' })
    await refreshDevMode()
    expect(devModeState.canManage).toBe(false)
  })

  it('resolves to the value this request got, and null when it got none', async () => {
    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ enabled: true }))
    expect(await refreshDevMode()).toBe(true)

    api.getDevModeStatusDevModeGet.mockRejectedValue(new Error('down'))
    http.serverMuonDevModeGet.mockResolvedValue({ data: { result: { enabled: false } } })
    expect(await refreshDevMode()).toBe(false)

    // Neither route answers: the shared state keeps the last value, the return does not.
    http.serverMuonDevModeGet.mockRejectedValue(new Error('down'))
    expect(await refreshDevMode()).toBeNull()
    expect(devModeState.enabled).toBe(false)
  })

  it('shows the way out to the owner, and to nobody else on a linked printer', async () => {
    printer.devMode = true
    const owner = mounted()
    await settle()
    expect(owner.find('[data-tid="developer-mode-switch"]').exists()).toBe(true)
    expect(owner.find('[data-tid="developer-mode-who"]').exists()).toBe(false)
    owner.destroy()

    printer.asOwner = false
    const other = mounted()
    await settle()
    expect(other.find('[data-tid="developer-mode-switch"]').exists()).toBe(false)
    expect(other.find('[data-tid="developer-mode-who"]').text()).toContain(`Only ${OWNER} can change developer mode`)
    other.destroy()

    // While nobody owns the printer, anyone may ask.
    printer.linked = false
    const open = mounted()
    await settle()
    expect(open.find('[data-tid="developer-mode-switch"]').exists()).toBe(true)
    open.destroy()
  })

  it('off: says to go to the printer\'s screen, offers no switch and asks the printer nothing (KAN-1763)', async () => {
    for (const asOwner of [true, false]) {
      printer.asOwner = asOwner
      printer.devMode = false
      const w = mounted()
      await settle()
      const go = w.find('[data-tid="developer-mode-go-to-printer"]')
      expect(go.exists()).toBe(true)
      expect(go.text()).toContain("Go to the printer's screen to turn on developer mode")
      expect(go.text()).toContain('System, then Protection, then Developer mode')
      expect(w.find('[data-tid="developer-mode-switch"]').exists()).toBe(false)
      expect(w.find('[data-tid="developer-enable"]').exists()).toBe(false)
      expect(w.find('[data-tid="developer-enable-dialog"]').exists()).toBe(false)
      w.destroy()
    }
    expect(printer.opened).toEqual([])
    expect(printer.post).not.toHaveBeenCalled()
  })

  it('on: no go-to-the-printer message, the way out stays', async () => {
    printer.devMode = true
    const w = mounted()
    await settle()
    expect(w.find('[data-tid="developer-mode-go-to-printer"]').exists()).toBe(false)
    expect(w.find('[data-tid="developer-mode-switch"]').exists()).toBe(true)
    w.destroy()
  })

  it('shows no switch where the printer has no request route, and says why', async () => {
    printer.devMode = true
    printer.routeMissing = true
    const w = mounted()
    await settle()
    expect(w.find('[data-tid="developer-mode-switch"]').exists()).toBe(false)
    expect(w.find('[data-tid="developer-mode-who"]').text()).toMatch(/can't take a developer-mode request/)
    w.destroy()
  })

  it.each([404, 501])('explains when printer software lacks owner confirmation (%s)', async (responseStatus) => {
    await refreshDevMode()
    const vm = component()
    printer.post.mockRejectedValueOnce({ response: { status: responseStatus } })

    await vm.ask(false)

    expect(vm.awaiting).toBe(false)
    expect(vm.errorMessage).toBe('This printer software does not support owner confirmation yet. Developer mode was not changed.')
    expect(api.setDevModeDevModePost).not.toHaveBeenCalled()
  })

  it('turns off only once the printer\'s screen is answered', async () => {
    printer.devMode = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    expect(vm.disableDialog).toBe(true)

    await vm.confirmDisable()
    expect(printer.opened).toEqual([{ enabled: false }])
    expect(vm.awaiting).toBe(true)
    await vm.pollConsent()
    expect(printer.completed).toEqual([])
    expect(printer.devMode).toBe(true)

    printer.confirm()
    await vm.pollConsent()
    expect(printer.completed).toEqual([{ enabled: false, challenge_id: CHALLENGE }])
    expect(printer.devMode).toBe(false)
    expect(vm.disableDialog).toBe(false)
    expect(api.setDevModeDevModePost).not.toHaveBeenCalled()
  })

  it('says "Confirm on the printer\'s screen" until the printer answers', async () => {
    printer.devMode = true
    const w = mounted()
    await settle()
    const vm = w.vm as any
    await vm.toggle()
    await w.vm.$nextTick()
    expect(w.find('[data-tid="developer-disable-dialog"]').exists()).toBe(true)
    expect(w.find('[data-tid="developer-press-knob"]').exists()).toBe(false)

    await w.find('[data-tid="developer-disable"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="developer-press-knob"]').text()).toContain("Confirm on the printer's screen")
    expect(w.find('[data-tid="developer-press-knob"]').text()).toContain('Press the knob on the printer to turn Developer Mode off.')

    printer.confirm()
    await vm.pollConsent()
    await settle()
    expect(w.find('[data-tid="developer-press-knob"]').exists()).toBe(false)
    expect(w.find('[data-tid="developer-disable-dialog"]').exists()).toBe(false)
    w.destroy()
  })

  it('stops waiting when it is turned down at the printer, and says so when the printer stops answering', async () => {
    printer.devMode = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    await vm.confirmDisable()

    const answer = printer.get.getMockImplementation()!
    printer.get.mockImplementation(async () => { throw new Error('Network Error') })
    for (let i = 0; i < 4; i++) await vm.pollConsent()
    expect(vm.awaiting).toBe(true)
    expect(vm.errorMessage).toMatch(/isn't saying whether its screen was answered/)

    printer.get.mockImplementation(answer)
    printer.refused = true
    await vm.pollConsent()
    expect(vm.awaiting).toBe(false)
    expect(vm.errorMessage).toMatch(/Turned down at the printer/)
    expect(printer.completed).toEqual([])
    vm.stopWaiting()
  })

  it('shows a refusal in the printer\'s words, and takes the switch away from a non-owner', async () => {
    printer.devMode = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    expect(vm.mayAsk).toBe(true)
    await vm.toggle()

    // The printer was linked to someone else after the page loaded.
    printer.asOwner = false
    await vm.confirmDisable()
    expect(vm.errorMessage).toMatch(new RegExp(`^Only ${OWNER} can change developer mode`))
    expect(vm.awaiting).toBe(false)
    expect(vm.mayAsk).toBe(false)
    expect(printer.opened).toEqual([])
  })

  it('catches up when the printer is already in the state asked for', async () => {
    printer.devMode = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    printer.devMode = false // changed at the printer meanwhile
    await vm.confirmDisable()
    expect(vm.errorMessage).toBe('Developer mode is already off.')
    expect(vm.disableDialog).toBe(false)
    expect(devModeState.enabled).toBe(false)
  })

  it('a printer that only takes the change at its own screen is said so, and nothing waits', async () => {
    printer.devMode = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    printer.panelOnly = true
    await vm.confirmDisable()
    expect(vm.errorMessage).toBe('The printer only takes this at its own screen. Go there: System, then Protection, then Developer mode.')
    expect(vm.awaiting).toBe(false)
    expect(printer.opened).toEqual([])
    expect(printer.completed).toEqual([])
  })

  it('turning on is no longer started from here', async () => {
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    expect(vm.disableDialog).toBe(false)
    expect(printer.opened).toEqual([])
    expect(typeof vm.confirmEnable).toBe('undefined')
  })
})
