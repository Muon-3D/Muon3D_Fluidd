import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SetupWifiSteps from '../SetupWifiSteps.vue'
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
    options: vi.fn(async () => ({ languages: [{ code: 'en', endonym: 'English' }, { code: 'de', endonym: 'Deutsch' }] })),
    uploadCaCert: vi.fn()
  }
  return { client: client as unknown as SetupClient & typeof client, posts, order }
}

const flush = async (wrapper: { vm: { $nextTick: () => Promise<void> } }) => {
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}

function mount (client: SetupClient) {
  return shallowMount(SetupWifiSteps, { propsData: { client, overBluetooth: true }, mocks: { $t: (k: string) => k } })
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
    ;(wrapper.vm as any).tryAgain()
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).screen).toBe('S3')
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
