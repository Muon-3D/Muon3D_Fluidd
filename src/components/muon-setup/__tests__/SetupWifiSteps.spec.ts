import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SetupWifiSteps from '../SetupWifiSteps.vue'
import SetupStepCard from '../SetupStepCard.vue'
import { joinErrorCopy, validPsk } from '@/services/muon-setup/wifiCopy'
import { resetSetupState, setLocal, setupState } from '@/services/muon-setup/state'
import type { SetupClient } from '@/services/muon-setup/client'
import type { SetupState } from '@/services/muon-setup/types'
import newState from '@/services/muon-setup/__tests__/fixtures/state.01-new.json'
import networkPhone from '@/services/muon-setup/__tests__/fixtures/state.02-network-phone-driver.json'
import joining from '@/services/muon-setup/__tests__/fixtures/state.04-joining.json'
import regionConfirm from '@/services/muon-setup/__tests__/fixtures/state.04b-region-confirm.json'
import wrongPassword from '@/services/muon-setup/__tests__/fixtures/state.05-network-wrong-password.json'
import euNetworks from '@/services/muon-setup/__tests__/fixtures/networks.eu-unit.json'
import linkCode from '@/services/muon-setup/__tests__/fixtures/state.06-remote-link-code.json'
import readySelfTest from '@/services/muon-setup/__tests__/fixtures/state.07-ready-self-test.json'
import pickerOptions from '@/services/muon-setup/__tests__/fixtures/options.picker-eu.json'

// The fixtures' driver is this tab.
const PHONE = '5b1f0c7e-9f7a-4f5e-8f0a-2d6f3c1a9b10'
const copy = (fixture: unknown): SetupState => JSON.parse(JSON.stringify(fixture))

function fakeClient () {
  const posts: Array<[string, Record<string, unknown> | undefined, unknown]> = []
  const order: string[] = []
  const client = {
    start: vi.fn(),
    stop: vi.fn(),
    get: vi.fn(async () => null),
    post: vi.fn(async (path: string, body?: Record<string, unknown>, opts?: unknown) => {
      posts.push([path, body, opts])
      order.push(path)
      return { ok: true, error: null, state: null }
    }),
    claimDriver: vi.fn(async () => { order.push('driver'); return { ok: true, error: null, state: null } }),
    postClock: vi.fn(async () => { order.push('clock'); return null }),
    networks: vi.fn(async () => JSON.parse(JSON.stringify(euNetworks))),
    options: vi.fn(async () => ({ ...JSON.parse(JSON.stringify(pickerOptions)), languages: [{ code: 'en', endonym: 'English' }, { code: 'de', endonym: 'Deutsch' }] })),
    uploadCaCert: vi.fn()
  }
  return { client: client as unknown as SetupClient & typeof client, posts, order }
}

const flush = async (wrapper: { vm: { $nextTick: () => Promise<void> } }) => {
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}

// Real buttons, so a test presses what the owner presses (disabled, type and click all work).
const Btn = { inheritAttrs: false, render (this: any, h: any) { return h('button', { attrs: this.$attrs, on: this.$listeners }, this.$slots.default) } }

function mount (client: SetupClient) {
  return shallowMount(SetupWifiSteps, { propsData: { client, overBluetooth: true }, stubs: { SetupStepCard, AppBtn: Btn, VBtn: Btn }, mocks: { $t: (k: string) => k } })
}

const tid = (wrapper: ReturnType<typeof mount>, id: string) => wrapper.find(`[data-tid="${id}"]`)

beforeEach(() => {
  resetSetupState()
  setupState.local.clientId = PHONE
  setLocal({ droveSetup: false, changingWifi: false, joinRev: null })
})

afterEach(() => { vi.restoreAllMocks() })

describe('S1 Start', () => {
  it("posts the owner's clock, then the language, then claims the driver", async () => {
    setupState.state = copy(newState)
    const { client, order, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(wrapper.text()).toContain('over Bluetooth')
    await (wrapper.vm as any).start()
    expect(order).toEqual(['clock', 'language', 'driver'])
    expect(posts[0][1]).toEqual({ code: expect.any(String) })
    expect(setupState.local.droveSetup).toBe(true)
  })
})

describe('S3 Wi-Fi', () => {
  beforeEach(() => { setupState.state = copy(networkPhone) })

  it("scans on entry, and says which networks it can't join here", async () => {
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(client.networks).toHaveBeenCalledWith(true)
    const vm = wrapper.vm as any
    const byName = Object.fromEntries(vm.networks.map((n: any) => [n.ssid, vm.unusable(n)]))
    expect(byName).toEqual({
      HomeWiFi: null,
      'BT-Hub-8JX2': null,
      'Neighbour 5G': null,
      eduroam: expect.stringContaining('Enterprise'),
      OldRouter: 'Not supported'
    })
  })

  it('posts the join with the password, remembers it is this tab’s join, and forgets the password', async () => {
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    const vm = wrapper.vm as any
    const home = vm.networks[0]
    vm.choose(home)
    vm.password = 'correct horse battery staple'
    await vm.join(home)
    expect(posts).toEqual([['network', {
      kind: 'wifi', ssid: 'HomeWiFi', hidden: false, security: 'wpa2', psk: 'correct horse battery staple', region: null, eap: null
    }, undefined]])
    expect(setupState.local.joinRev).toBe(networkPhone.rev)
    expect(vm.password).toBe('')
  })

  it('refuses a password no network would take, without sending it', async () => {
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    const vm = wrapper.vm as any
    vm.choose(vm.networks[0])
    vm.password = 'short'
    await vm.join(vm.networks[0])
    expect(posts).toEqual([])
    expect(vm.passwordError).toMatch(/8 to 63/)
  })

  it('skips only after the owner confirms', async () => {
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    const vm = wrapper.vm as any
    vm.confirmSkip = true
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('will stay offline')
    await vm.skipNetwork()
    expect(posts).toEqual([['skip', { step: 'network' }, undefined]])
  })
})

describe('S4 and S4r', () => {
  it('follows the join through its checklist', async () => {
    setupState.state = copy(joining)
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    const list = (wrapper.vm as any).checklist
    expect(list.map((i: any) => i.status)).toEqual(['done', 'now', 'next', 'next'])
  })

  it("shows this tab's failed join, and Try again goes back to the list", async () => {
    setupState.state = copy(wrongPassword)
    setLocal({ joinRev: 7 })
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(tid(wrapper, 'join-error').text()).toBe("the network didn't accept that password.")
    await tid(wrapper, 'join-retry').trigger('click')
    expect((wrapper.vm as any).screen).toBe('S3')
  })

  it('never reveals the password after Try again, and hides it again when the row changes', async () => {
    setupState.state = copy(wrongPassword)
    setupState.state!.steps.network.error = { ...setupState.state!.steps.network.error!, detail: { ssid: 'HomeWiFi' } }
    setLocal({ joinRev: 7 })
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    await tid(wrapper, 'join-retry').trigger('click')
    await flush(wrapper)
    expect(tid(wrapper, 'wifi-password').attributes('type')).toBe('password')
    // Revealed by the owner, then another row opens: hidden again.
    ;(wrapper.vm as any).showPassword = true
    await tid(wrapper, 'wifi-BT-Hub-8JX2').trigger('click')
    await wrapper.vm.$nextTick()
    expect(tid(wrapper, 'wifi-password').attributes('type')).toBe('password')
  })

  it('hides a revealed password when the owner chooses another network', async () => {
    setupState.state = copy(wrongPassword)
    setLocal({ joinRev: 7 })
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    ;(wrapper.vm as any).showPassword = true
    await tid(wrapper, 'join-another').trigger('click')
    expect((wrapper.vm as any).showPassword).toBe(false)
  })

  it('confirms the region the printer detected after joining', async () => {
    setupState.state = copy(regionConfirm)
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(tid(wrapper, 'join-done').text()).toContain('is on HomeWiFi')
    expect(wrapper.text()).toContain('United Kingdom')
    await (wrapper.vm as any).confirmRegion()
    expect(posts).toEqual([['region', { country: 'GB' }, undefined]])
  })
})

describe('the step card', () => {
  it('puts each step in the card, with its place among the steps', async () => {
    setupState.state = copy(networkPhone)
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(tid(wrapper, 'step-eyebrow').text()).toBe('Step 2 of 7')
    expect(wrapper.find('h1').text()).toBe('Choose Wi-Fi')
  })

  it('opens the chosen network\'s password in place with Connect under it, and drops the footer one', async () => {
    setupState.state = copy(networkPhone)
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(wrapper.findAll('[data-tid="wifi-connect"]').length).toBe(1)
    expect(tid(wrapper, 'wifi-connect').attributes('disabled')).toBeDefined()
    await tid(wrapper, 'wifi-HomeWiFi').trigger('click')
    expect(tid(wrapper, 'wifi-password').exists()).toBe(true)
    // One Connect, inside the open row's form: no second tab stop in the footer.
    expect(wrapper.findAll('[data-tid="wifi-connect"]').length).toBe(1)
    expect(tid(wrapper, 'wifi-connect').element.closest('form')).not.toBeNull()
    expect(tid(wrapper, 'wifi-connect').attributes('disabled')).toBeDefined()
    ;(wrapper.vm as any).password = 'correct horse battery staple'
    await wrapper.vm.$nextTick()
    expect(tid(wrapper, 'wifi-connect').attributes('disabled')).toBeUndefined()
    expect((wrapper.vm as any).selectedNetwork.ssid).toBe('HomeWiFi')
    tid(wrapper, 'wifi-password').element.closest('form')!.dispatchEvent(new Event('submit'))
    await flush(wrapper)
    expect(posts.map(p => p[0])).toEqual(['network'])
  })
})

describe('S5 name, updates and your account', () => {
  const at = (cursor: 'name' | 'update' | 'remote') => {
    const state = copy(linkCode)
    state.cursor = cursor
    state.steps.remote = { status: 'pending', mode: null, link: null, error: null }
    if (cursor === 'name') state.steps.name.status = 'pending'
    if (cursor !== 'remote') state.steps.update.status = 'pending'
    return state
  }

  it('names the printer, and Back goes to the step before', async () => {
    setupState.state = at('name')
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    const vm = wrapper.vm as any
    expect(vm.screen).toBe('S5')
    expect(vm.nameDraft).toBe('Walnut')
    vm.nameDraft = '  Workshop  '
    await tid(wrapper, 'name-save').trigger('click')
    await flush(wrapper)
    await tid(wrapper, 'setup-back').trigger('click')
    await flush(wrapper)
    expect(posts).toEqual([['name', { name: 'Workshop' }, undefined], ['goto', { step: 'network' }, undefined]])
  })

  it('installs the update, or leaves it for later', async () => {
    setupState.state = at('update')
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(wrapper.find('h1').text()).toBe('Update available')
    await tid(wrapper, 'update-go').trigger('click')
    await flush(wrapper)
    await tid(wrapper, 'update-later').trigger('click')
    await flush(wrapper)
    expect(posts.map(p => p[1])).toEqual([{ action: 'install' }, { action: 'later' }])
    expect(wrapper.emitted('installing')).toHaveLength(1)
  })

  it('warns over Bluetooth that installing restarts the printer and drops the link', async () => {
    setupState.state = at('update')
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(tid(wrapper, 'update-ble-warning').text()).toMatch(/restarts.*Bluetooth link will drop/s)
    await wrapper.setProps({ overBluetooth: false })
    expect(tid(wrapper, 'update-ble-warning').exists()).toBe(false)
  })

  it('sends one write when a button is pressed twice before the first answers', async () => {
    setupState.state = at('update')
    const { client, posts } = fakeClient()
    let release: () => void = () => {}
    client.post.mockImplementationOnce(async (path: string, body?: Record<string, unknown>) => {
      posts.push([path, body, undefined])
      await new Promise<void>(resolve => { release = resolve })
      return { ok: true, error: null, state: null }
    })
    const wrapper = mount(client)
    await flush(wrapper)
    const go = tid(wrapper, 'update-go')
    await go.trigger('click')
    await go.trigger('click')
    release()
    await flush(wrapper)
    expect(posts).toHaveLength(1)
  })

  it('offers the account link, only on this network, or Skip for now', async () => {
    setupState.state = at('remote')
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    const vm = wrapper.vm as any
    expect(vm.remoteChoice).toBe('cloud')
    await tid(wrapper, 'remote-continue').trigger('click')
    await flush(wrapper)
    await tid(wrapper, 'remote-skip').trigger('click')
    await flush(wrapper)
    expect(posts).toEqual([['remote', { mode: 'cloud' }, undefined], ['remote', { mode: 'later' }, undefined]])
  })

  it('falls back to the working choice if the internet goes after the link was picked', async () => {
    setupState.state = at('remote')
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect((wrapper.vm as any).remoteChoice).toBe('cloud')
    setupState.state!.steps.network.internet = false
    await wrapper.vm.$nextTick()
    expect(tid(wrapper, 'remote-cloud').attributes('aria-checked')).toBe('false')
    await tid(wrapper, 'remote-continue').trigger('click')
    await flush(wrapper)
    expect(posts.some(p => (p[1] as any)?.mode === 'cloud')).toBe(false)
  })

  it('keeps Continue off while the selected option is blocked', async () => {
    setupState.state = at('remote')
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    setupState.state!.steps.network.internet = false
    await wrapper.vm.$nextTick()
    // A stale selection the watcher would repair: force it to prove Continue itself holds.
    ;(wrapper.vm as any).remoteChoice = 'cloud'
    await wrapper.vm.$nextTick()
    expect(tid(wrapper, 'remote-continue').attributes('disabled')).toBeDefined()
    await tid(wrapper, 'remote-continue').trigger('click')
    expect(posts).toEqual([])
  })

  it("doesn't offer the account link without the internet", async () => {
    const state = at('remote')
    state.steps.network.internet = false
    setupState.state = state
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect((wrapper.vm as any).remoteChoice).toBe('local')
    expect(tid(wrapper, 'remote-cloud').attributes('disabled')).toBeDefined()
    expect(tid(wrapper, 'remote-cloud').text()).toContain('Needs Walnut on the internet')
  })
})

describe('S6 and S7', () => {
  it('shows the link code, and Back cancels the link', async () => {
    setupState.state = copy(linkCode)
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect(tid(wrapper, 'link-code').text()).toBe('482913')
    await (wrapper.vm as any).cancelLink()
    expect(posts).toEqual([['remote/cancel', {}, { rev: false }]])
  })

  it('lists the first calibration, and offers Skip only for what is optional', async () => {
    setupState.state = copy(readySelfTest)
    setupState.state!.driver = { ...setupState.state!.driver!, kind: 'phone', client_id: PHONE }
    const { client, posts } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect((wrapper.vm as any).screen).toBe('S7')
    expect(tid(wrapper, 'ready-self_test').text()).toContain('Running now')
    expect(tid(wrapper, 'ready-skip-transport_clips').exists()).toBe(false)
    expect(tid(wrapper, 'ready-skip-self_test').exists()).toBe(false)
    expect(tid(wrapper, 'ready-skip-load_filament').exists()).toBe(true)
    await tid(wrapper, 'ready-skip-load_filament').trigger('click')
    await flush(wrapper)
    expect(posts).toEqual([['ready', { action: 'skip', item: 'load_filament' }, undefined]])
  })

  it("follows the printer's screen when it is in charge", async () => {
    setupState.state = copy(readySelfTest)
    const { client } = fakeClient()
    const wrapper = mount(client)
    await flush(wrapper)
    expect((wrapper.vm as any).screen).toBe('S9')
    expect(wrapper.find('h1').text()).toBe("Carry on at Walnut's screen")
  })
})

describe('copy', () => {
  it('follows 08-errors.md', () => {
    expect(joinErrorCopy({ code: 'ssid_not_found' }, 'Walnut', 'HomeWiFi')).toBe("Walnut can't see HomeWiFi from here.")
    expect(joinErrorCopy({ code: 'mystery' }, 'Walnut', 'HomeWiFi')).toBe("Walnut couldn't join HomeWiFi.")
  })

  it('takes 8 to 63 characters, or 64 hex digits', () => {
    expect(validPsk('12345678')).toBe(true)
    expect(validPsk('1234567')).toBe(false)
    expect(validPsk('a'.repeat(64))).toBe(true)
    expect(validPsk('z'.repeat(64))).toBe(false)
  })
})
