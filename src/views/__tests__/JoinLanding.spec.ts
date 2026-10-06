import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Approval } from '@/services/muon-cloud/api'

const cloud = vi.hoisted(() => ({
  state: { account: null as null | { id: string }, ready: true },
  join: vi.fn(),
  approval: vi.fn(),
  refreshPrinters: vi.fn(async () => {})
}))

vi.mock('@/services/muon-cloud/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/muon-cloud/api')>('@/services/muon-cloud/api')
  return { ...actual, cloudApi: { join: cloud.join, approval: cloud.approval } }
})
vi.mock('@/services/muon-cloud/state', () => ({
  cloudState: cloud.state,
  printerName: (id: string) => (id === 'p1' ? 'Walnut' : id),
  refreshPrinters: cloud.refreshPrinters
}))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { render: () => null } }))

// eslint-disable-next-line import/first
import JoinLanding from '../JoinLanding.vue'
// eslint-disable-next-line import/first
import { CloudError } from '@/services/muon-cloud/api'

const APPROVAL: Approval = {
  id: 'ap1',
  kind: 'link_join',
  printer_id: 'p1',
  printer_name: 'Walnut',
  link_id: 'l1',
  role: 'viewer',
  state: 'pending',
  created_at: 1,
  expires_at: 86_401,
  answered_at: null
}

function mount (code: string | undefined = '7kq2m-9xdpf', pollMs = 5) {
  return shallowMount(JoinLanding, {
    propsData: { pollMs },
    mocks: { $route: { query: { code } }, $router: { push: vi.fn() } }
  })
}

const flush = async (wrapper: { vm: { $nextTick: () => Promise<void> } }, ms = 0) => {
  await new Promise(resolve => setTimeout(resolve, ms))
  await wrapper.vm.$nextTick()
}

const tid = (wrapper: ReturnType<typeof mount>, id: string) => wrapper.find(`[data-tid="${id}"]`)

async function pressJoin (wrapper: ReturnType<typeof mount>) {
  await (wrapper.vm as any).join()
  await flush(wrapper)
}

beforeEach(() => {
  cloud.state.account = { id: 'a1' }
  cloud.join.mockReset()
  cloud.approval.mockReset()
  cloud.refreshPrinters.mockClear()
})

afterEach(() => { vi.restoreAllMocks() })

describe('the join page', () => {
  it('says a code that is not one is incomplete, and asks nothing', () => {
    const wrapper = mount('nope')
    expect(tid(wrapper, 'join-bad-code').exists()).toBe(true)
    expect(tid(wrapper, 'join-button').exists()).toBe(false)
  })

  it('asks a signed-out person to sign in first, and posts nothing', () => {
    cloud.state.account = null
    const wrapper = mount()
    expect(tid(wrapper, 'join-sign-in').exists()).toBe(true)
    expect(tid(wrapper, 'join-button').exists()).toBe(false)
    expect(cloud.join).not.toHaveBeenCalled()
  })

  it('joins only when Join is pressed, with the code as the console reads it', async () => {
    cloud.join.mockResolvedValue({ state: 'joined', printer_id: 'p1', share: {} })
    const wrapper = mount()
    await flush(wrapper)
    expect(cloud.join).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('7KQ2M-9XDPF')

    await pressJoin(wrapper)
    expect(cloud.join).toHaveBeenCalledWith('7KQ2M9XDPF')
    expect(tid(wrapper, 'join-joined').text()).toContain("You've joined Walnut")
    expect(cloud.refreshPrinters).toHaveBeenCalled()
  })

  it('waits for the owner to approve, then shows they did', async () => {
    cloud.join.mockResolvedValue({ state: 'pending', printer_id: 'p1', approval: APPROVAL })
    cloud.approval
      .mockResolvedValueOnce({ approval: APPROVAL })
      .mockResolvedValueOnce({ approval: { ...APPROVAL, state: 'allowed' } })
    const wrapper = mount()
    await pressJoin(wrapper)
    expect(tid(wrapper, 'join-pending').text()).toContain('Waiting for the owner of Walnut to approve')

    await flush(wrapper, 30)
    expect(cloud.approval).toHaveBeenCalledWith('ap1')
    expect(tid(wrapper, 'join-joined').exists()).toBe(true)
    wrapper.destroy()
  })

  it.each([
    ['refused', 'join-refused', 'did not approve'],
    ['expired', 'join-expired', 'did not answer in time']
  ])('says when the owner %s', async (state, id, text) => {
    cloud.join.mockResolvedValue({ state: 'pending', printer_id: 'p1', approval: APPROVAL })
    cloud.approval.mockResolvedValue({ approval: { ...APPROVAL, state } })
    const wrapper = mount()
    await pressJoin(wrapper)
    await flush(wrapper, 20)
    expect(tid(wrapper, id).text()).toContain(text)
    const calls = cloud.approval.mock.calls.length
    await flush(wrapper, 20)
    expect(cloud.approval.mock.calls.length).toBe(calls)
  })

  it('keeps waiting through a failed check', async () => {
    cloud.join.mockResolvedValue({ state: 'pending', printer_id: 'p1', approval: APPROVAL })
    cloud.approval
      .mockRejectedValueOnce(new CloudError('offline', 0))
      .mockResolvedValueOnce({ approval: { ...APPROVAL, state: 'allowed' } })
    const wrapper = mount()
    await pressJoin(wrapper)
    await flush(wrapper, 40)
    expect(tid(wrapper, 'join-joined').exists()).toBe(true)
  })

  it('shows a refusal, and Join can be pressed again', async () => {
    cloud.join.mockRejectedValueOnce(new CloudError('gone', 410))
    const wrapper = mount()
    await pressJoin(wrapper)
    expect(tid(wrapper, 'join-error').text()).toContain('expired or been used up')
    expect(tid(wrapper, 'join-button').exists()).toBe(true)
  })

  it('stops asking once the page is left', async () => {
    cloud.join.mockResolvedValue({ state: 'pending', printer_id: 'p1', approval: APPROVAL })
    cloud.approval.mockResolvedValue({ approval: APPROVAL })
    // An interval the press cannot outrun, so only leaving can stop it.
    const wrapper = mount('7kq2m-9xdpf', 200)
    await pressJoin(wrapper)
    wrapper.destroy()
    await new Promise(resolve => setTimeout(resolve, 300))
    expect(cloud.approval).not.toHaveBeenCalled()
  })
})
