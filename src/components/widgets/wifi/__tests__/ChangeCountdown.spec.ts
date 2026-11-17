import { enableAutoDestroy, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChangeCountdown from '../ChangeCountdown.vue'

const confirm = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-cloud/ownerNetwork', async () => ({
  ...(await vi.importActual<object>('@/services/muon-cloud/ownerNetwork')),
  confirmNetworkChange: confirm
}))

enableAutoDestroy(afterEach)

beforeEach(() => {
  vi.useFakeTimers()
  confirm.mockReset()
})
afterEach(() => { vi.useRealTimers() })

describe('the 90 second confirm-or-revert countdown', () => {
  it('starts at 90 and explains the printer reverts on its own', () => {
    const w = shallowMount(ChangeCountdown)
    expect(w.find('[data-tid=change-countdown-left]').text()).toBe('90')
    expect(w.text()).toContain('goes back to how it was on its own')
    expect(w.find('[data-tid=change-keep]').text()).toBe('Keep this change')
  })

  it('counts down a second at a time, and tells the parent at zero', async () => {
    const w = shallowMount(ChangeCountdown)
    vi.advanceTimersByTime(30_000)
    await w.vm.$nextTick()
    expect(w.find('[data-tid=change-countdown-left]').text()).toBe('60')
    vi.advanceTimersByTime(60_000)
    await w.vm.$nextTick()
    expect(w.find('[data-tid=change-countdown-left]').text()).toBe('0')
    expect(w.emitted('expired')).toHaveLength(1)
    vi.advanceTimersByTime(5_000)
    expect(w.emitted('expired')).toHaveLength(1)
  })

  it('Keep this change confirms, stops the clock and tells the parent', async () => {
    confirm.mockResolvedValue(undefined)
    const w = shallowMount(ChangeCountdown)
    await w.find('[data-tid=change-keep]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(w.emitted('kept')).toHaveLength(1)
    vi.advanceTimersByTime(120_000)
    expect(w.emitted('expired')).toBeUndefined()
  })

  it('a failed confirm says so and leaves the clock running', async () => {
    confirm.mockRejectedValue(new Error("This printer can't confirm a network change yet."))
    const w = shallowMount(ChangeCountdown)
    await w.find('[data-tid=change-keep]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('[data-tid=change-countdown-error]').text()).toContain("can't confirm")
    expect(w.emitted('kept')).toBeUndefined()
    vi.advanceTimersByTime(90_000)
    expect(w.emitted('expired')).toHaveLength(1)
  })
})
