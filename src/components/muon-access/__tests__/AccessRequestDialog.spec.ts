import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccessRequestDialog from '../AccessRequestDialog.vue'
import { AccessUnavailable, type AccessClient, type RequestStatus } from '@/services/muon-access/api'

function fakeClient (statuses: RequestStatus[] = ['pending']) {
  let i = 0
  return {
    request: vi.fn(async () => ({ requestId: 'r1-abcd', code: '3F9A', expiresAt: Date.now() + 120_000 })),
    requestStatus: vi.fn(async () => statuses[Math.min(i++, statuses.length - 1)]),
    cancelRequest: vi.fn(async () => {})
  } as unknown as AccessClient & Record<'request' | 'requestStatus' | 'cancelRequest', ReturnType<typeof vi.fn>>
}

function mount (client: AccessClient, ask = { kind: 'join' as const }) {
  return shallowMount(AccessRequestDialog, {
    propsData: { value: true, client, ask, printerName: 'Walnut · 8987' }
  })
}

describe('AccessRequestDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the code the printer shows, and reports the panel’s answer', async () => {
    const client = fakeClient(['pending', 'allowed'])
    const wrapper = mount(client)
    await vi.advanceTimersByTimeAsync(0)

    expect(client.request).toHaveBeenCalledWith({ kind: 'join' }, 'Muon3D Fluidd')
    expect(wrapper.find('[data-tid="access-code"]').text()).toBe('3F9A')

    await vi.advanceTimersByTimeAsync(4000)
    expect(wrapper.emitted('answered')?.[0]).toEqual(['allowed'])
    expect((wrapper.vm as any).phase).toBe('allowed')
  })

  it('takes the question off the printer’s screen when it is closed while waiting', async () => {
    const client = fakeClient(['pending'])
    const wrapper = mount(client)
    await vi.advanceTimersByTimeAsync(0)

    wrapper.destroy()
    expect(client.cancelRequest).toHaveBeenCalledWith('r1-abcd')
  })

  it('says the printer cannot take requests when its software predates them', async () => {
    const client = fakeClient()
    client.request.mockRejectedValue(new AccessUnavailable())
    const wrapper = mount(client)
    await vi.advanceTimersByTimeAsync(0)

    expect((wrapper.vm as any).phase).toBe('failed')
    expect((wrapper.vm as any).outcome).toContain('cannot take requests yet')
  })
})
