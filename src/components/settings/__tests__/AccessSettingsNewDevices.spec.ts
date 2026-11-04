import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccessClient, AccessState, Capability } from '@/services/muon-access/api'
import { NewDevicesRefused } from '@/services/muon-access/newDevices'

const client = { get: vi.fn(), capabilities: vi.fn() }
const newDevices = { get: vi.fn(), set: vi.fn() }

vi.mock('@/services/muon-access/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/muon-access/api')>()),
  currentPrinterAccess: () => client as unknown as AccessClient
}))
vi.mock('@/services/muon-access/newDevices', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/muon-access/newDevices')>()),
  currentPrinterNewDevices: () => newDevices
}))

const { default: AccessSettings } = await import('../AccessSettings.vue')

const owner: AccessState = {
  owner: { kind: 'account', email: 'sam@example.com' },
  entry: 'protected',
  you: { level: 'admin', role: 'operator', trusted: true, principal: 'device:sam-phone' },
  ways: { email: { on: false }, link: { on: false }, password: { on: false }, approve: { on: false } },
  privateUploads: false,
  dataMode: 'shared',
  levelsPreset: 'standard'
}
const ownerCaps: Record<string, Capability> = { read: 'allowed', protection: 'allowed' }
const guestCaps: Record<string, Capability> = { read: 'allowed', protection: 'refused' }

async function mount (caps: Record<string, Capability>) {
  client.get.mockResolvedValue(owner)
  client.capabilities.mockResolvedValue(caps)
  const wrapper = shallowMount(AccessSettings, { mocks: { $store: { getters: { 'config/getDisplayName': 'Walnut' }, state: {} } } })
  await new Promise(resolve => setTimeout(resolve, 0))
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mount>>
const sw = (w: Wrapper) => w.find('[data-test="access-accept-requests"]')
const vm = (w: Wrapper) => w.vm as any

describe('AccessSettings: Allow new devices to ask', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('loads the printer’s value for the owner', async () => {
    newDevices.get.mockResolvedValue(true)
    const wrapper = await mount(ownerCaps)
    expect(sw(wrapper).exists()).toBe(true)
    expect(vm(wrapper).acceptRequests).toBe(true)
  })

  it('never asks, and shows nothing, when this browser is not the owner', async () => {
    const wrapper = await mount(guestCaps)
    expect(newDevices.get).not.toHaveBeenCalled()
    expect(sw(wrapper).exists()).toBe(false)
  })

  it('is hidden when the printer has no such setting (404) or does not answer', async () => {
    newDevices.get.mockResolvedValue(null)
    expect(sw(await mount(ownerCaps)).exists()).toBe(false)
    newDevices.get.mockRejectedValue(new Error('offline'))
    expect(sw(await mount(ownerCaps)).exists()).toBe(false)
  })

  it('saves, and shows what the printer now holds', async () => {
    newDevices.get.mockResolvedValue(true)
    newDevices.set.mockResolvedValue(false)
    const wrapper = await mount(ownerCaps)
    await vm(wrapper).saveAcceptRequests(false)
    expect(newDevices.set).toHaveBeenCalledWith(false)
    expect(vm(wrapper).acceptRequests).toBe(false)
  })

  it('reverts on a refusal and shows the printer’s words', async () => {
    newDevices.get.mockResolvedValue(true)
    newDevices.set.mockRejectedValue(new NewDevicesRefused('Only the owner can change this.', 403))
    const wrapper = await mount(ownerCaps)
    const before = vm(wrapper).renderKey
    await vm(wrapper).saveAcceptRequests(false)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(vm(wrapper).acceptRequests).toBe(true)
    expect(vm(wrapper).renderKey).toBeGreaterThan(before)
    expect(wrapper.find('[data-test="access-message"]').text()).toContain('Only the owner can change this.')
  })
})
