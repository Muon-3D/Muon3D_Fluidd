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
    api.getDevModeStatusDevModeGet.mockImplementation(async () => status({ enabled: printer.devMode, ever_enabled: printer.everEnabled }))
  })

  it('is an admin build only when the printer says its guard is disarmed', async () => {
    await refreshDevMode()
    expect(devModeState).toMatchObject({ enabled: false, canManage: true, guardArmed: true, otpArmed: false })
    expect(component().adminBuild).toBe(false)

    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ guard_armed: false }))
    await refreshDevMode()
    expect(component().adminBuild).toBe(true)

    // An answer that doesn't say counts as a release build, and a fuse that records is never an admin build.
    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ guard_armed: undefined }))
    await refreshDevMode()
    expect(component().adminBuild).toBe(false)
    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ guard_armed: false, otp_record_armed: true }))
    await refreshDevMode()
    expect(component().adminBuild).toBe(false)
  })

  it('gives an SSH address on an admin build with it on, from the printer own name, and nowhere else', async () => {
    const withHost = (hostname: unknown) => {
      const vm = component()
      vm.$store = { state: { printer: { printer: { info: { hostname } } } } }
      return vm
    }
    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ enabled: true, guard_armed: false }))
    await refreshDevMode()
    expect(withHost('m1-4f2a').sshAddress).toBe('ssh root@m1-4f2a.local')
    expect(withHost('').sshAddress).toBe('')
    expect(withHost(undefined).sshAddress).toBe('')
    expect(withHost('a b; rm -rf').sshAddress).toBe('')

    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ enabled: true, guard_armed: true }))
    await refreshDevMode()
    expect(withHost('m1-4f2a').sshAddress).toBe('')

    api.getDevModeStatusDevModeGet.mockResolvedValue(status({ enabled: false, guard_armed: false }))
    await refreshDevMode()
    expect(withHost('m1-4f2a').sshAddress).toBe('')
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

  it('off: the owner gets the switch, someone else gets the reason, and nothing is asked of the printer', async () => {
    printer.devMode = false
    let w = mounted()
    await settle()
    expect(w.find('[data-tid="developer-mode-go-to-printer"]').exists()).toBe(false)
    expect(w.find('[data-tid="developer-mode-switch"]').exists()).toBe(true)
    w.destroy()
    printer.asOwner = false
    w = mounted()
    await settle()
    expect(w.find('[data-tid="developer-mode-switch"]').exists()).toBe(false)
    expect(w.find('[data-tid="developer-mode-who"]').text()).toMatch(/Only .* can change developer mode/)
    w.destroy()
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
    expect(vm.changeDialog).toBe(true)

    await vm.confirmChange()
    expect(printer.opened).toEqual([{ enabled: false }])
    expect(vm.awaiting).toBe(true)
    await vm.pollConsent()
    expect(printer.completed).toEqual([])
    expect(printer.devMode).toBe(true)

    printer.confirm()
    await vm.pollConsent()
    expect(printer.completed).toEqual([{ enabled: false, challenge_id: CHALLENGE }])
    expect(printer.devMode).toBe(false)
    expect(vm.changeDialog).toBe(false)
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

    await w.find('[data-tid="developer-confirm"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="developer-press-knob"]').text()).toContain('Confirm on the printer')
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
    await vm.confirmChange()

    const answer = printer.get.getMockImplementation()!
    printer.get.mockImplementation(async () => { throw new Error('Network Error') })
    for (let i = 0; i < 4; i++) await vm.pollConsent()
    expect(vm.awaiting).toBe(true)
    expect(vm.errorMessage).toMatch(/isn't saying whether its screen was answered/)

    printer.get.mockImplementation(answer)
    printer.refused = true
    await vm.pollConsent()
    expect(vm.awaiting).toBe(false)
    expect(vm.errorMessage).toMatch(/It was declined on the printer's screen\. Nothing changed\./)
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
    await vm.confirmChange()
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
    await vm.confirmChange()
    expect(vm.errorMessage).toBe('Developer mode is already off.')
    expect(vm.changeDialog).toBe(false)
    expect(devModeState.enabled).toBe(false)
  })

  it('a printer that only takes the change at its own screen is said so, and nothing waits', async () => {
    printer.devMode = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    printer.panelOnly = true
    await vm.confirmChange()
    expect(vm.errorMessage).toContain('only takes this at its own screen')
    expect(vm.awaiting).toBe(false)
    expect(printer.opened).toEqual([])
    expect(printer.completed).toEqual([])
  })

  it('the first turn-on shows the terms, needs them accepted, then waits for the printer and sends the waiver', async () => {
    await refreshDevMode()
    const w = mounted()
    await settle()
    const vm = w.vm as any
    await vm.toggle()
    await w.vm.$nextTick()
    expect(w.find('[data-tid="developer-enable-dialog"]').exists()).toBe(true)
    expect(w.find('[data-tid="developer-terms"]').text()).toContain("The printer's waiver")
    expect(w.find('[data-tid="developer-confirm"]').attributes('disabled')).toBeDefined()
    await vm.confirmChange()
    expect(printer.opened).toEqual([])

    await w.find('[data-tid="developer-accept"]').setChecked(true)
    await w.find('[data-tid="developer-confirm"]').trigger('click')
    await settle()
    expect(printer.opened).toEqual([{ enabled: true }])
    expect(w.find('[data-tid="developer-press-knob"]').text()).toContain("Sign the warranty release on the printer's screen to turn on developer mode for the first time.")
    await vm.pollConsent()
    expect(printer.completed).toEqual([])
    expect(printer.devMode).toBe(false)

    printer.confirm()
    await vm.pollConsent()
    expect(printer.completed).toEqual([{ enabled: true, challenge_id: CHALLENGE, waiver_acknowledged: true, waiver_version: 'w-1' }])
    expect(printer.devMode).toBe(true)
    expect(vm.changeDialog).toBe(false)
    w.destroy()
  })

  it('a later turn-on, after the warranty release, does not wait for the printer', async () => {
    printer.everEnabled = true
    printer.laterWithoutConfirm = true
    await refreshDevMode()
    const w = mounted()
    await settle()
    const vm = w.vm as any
    await vm.toggle()
    await w.vm.$nextTick()
    expect(w.find('[data-tid="developer-terms"]').exists()).toBe(false)
    await w.find('[data-tid="developer-confirm"]').trigger('click')
    await settle()
    expect(printer.opened).toEqual([{ enabled: true }])
    expect(printer.completed).toEqual([])
    expect(w.find('[data-tid="developer-press-knob"]').exists()).toBe(false)
    expect(printer.devMode).toBe(true)
    expect(vm.changeDialog).toBe(false)
    expect(vm.awaiting).toBe(false)
    w.destroy()
  })

  async function firstTurnOn () {
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    vm.accepted = true
    return vm
  }

  it('nobody signs in time: says so in plain words and nothing changed', async () => {
    const vm = await firstTurnOn()
    await vm.confirmChange()
    expect(vm.awaiting).toBe(true)
    vm.secondsRemaining = 1
    // The countdown started by ask() ticks each second: let it run out.
    await new Promise(resolve => setTimeout(resolve, 1200))
    expect(vm.awaiting).toBe(false)
    expect(vm.errorMessage).toBe("Nobody confirmed on the printer's screen in time. Nothing changed.")
    expect(printer.devMode).toBe(false)
    expect(printer.completed).toEqual([])
    vm.stopWaiting()
  })

  it('a 428 on the first turn-on starts the signing wait, and shows it only once the state reads as on', async () => {
    printer.precondition = 'bare'
    http.serverMuonDevModeGet.mockImplementation(async () => ({ data: { result: { enabled: printer.devMode } } }))
    const vm = await firstTurnOn()
    await vm.confirmChange()
    expect(vm.awaiting).toBe(true)
    expect(vm.errorMessage).toBe('')
    await vm.pollConsent()
    expect(vm.awaiting).toBe(true)
    expect(devModeState.enabled).toBe(false)
    printer.devMode = true
    await vm.pollConsent()
    expect(vm.awaiting).toBe(false)
    expect(devModeState.enabled).toBe(true)
    expect(printer.completed).toEqual([])
    vm.stopWaiting()
  })

  it('a 428 that names a challenge is followed like any other', async () => {
    printer.precondition = 'challenge'
    const vm = await firstTurnOn()
    await vm.confirmChange()
    expect(vm.awaiting).toBe(true)
    expect(vm.pending.challengeId).toBe(CHALLENGE)
    printer.confirm()
    await vm.pollConsent()
    expect(printer.completed).toHaveLength(1)
    expect(printer.devMode).toBe(true)
    vm.stopWaiting()
  })

  it('a later switch is direct, on and off: no wait, and the new state shows after the printer reports it', async () => {
    printer.everEnabled = true
    printer.laterWithoutConfirm = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    for (const target of [true, false]) {
      await vm.toggle()
      await vm.confirmChange()
      expect(vm.awaiting).toBe(false)
      expect(devModeState.enabled).toBe(target)
    }
    expect(printer.opened).toEqual([{ enabled: true }, { enabled: false }])
  })

  it('does not say it changed when the printer replies applied but the state disagrees', async () => {
    printer.everEnabled = true
    await refreshDevMode()
    const vm = component()
    await vm.refreshAsking()
    await vm.toggle()
    printer.post.mockImplementationOnce(async () => ({ data: { result: { enabled: false } } }))
    await vm.confirmChange()
    expect(devModeState.enabled).toBe(false)
    expect(vm.errorMessage).toBe("Couldn't confirm the printer made the change. Nothing changed.")
  })
})
