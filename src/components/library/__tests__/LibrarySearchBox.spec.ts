import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const suggestions = vi.fn(async () => [])
vi.mock('@/services/library/catalogue', () => ({ suggestions: (...args: unknown[]) => suggestions(...(args as [])) }))

// eslint-disable-next-line import/first
import LibrarySearchBox from '../v2/LibrarySearchBox.vue'

// The suggestion request waits for a 250 ms pause in typing (KAN-2904). e2e can't
// check this timing on a loaded runner, so it is checked here with fake timers.
describe('LibrarySearchBox suggestion debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); suggestions.mockClear() })
  afterEach(() => { vi.useRealTimers() })

  async function type (input: ReturnType<ReturnType<typeof mount>['find']>, text: string, gap: number) {
    for (let i = 1; i <= text.length; i++) {
      await input.setValue(text.slice(0, i))
      vi.advanceTimersByTime(gap)
    }
  }

  it('typing faster than 250 ms per key asks once, for the whole word', async () => {
    const wrapper = mount(LibrarySearchBox, { stubs: { 'frame-icon': true } })
    const input = wrapper.find('input')
    await type(input, 'Print', 20)
    expect(suggestions).not.toHaveBeenCalled()
    vi.advanceTimersByTime(250)
    expect(suggestions).toHaveBeenCalledTimes(1)
    expect(suggestions.mock.calls[0][0]).toBe('Print')
    wrapper.destroy()
  })

  it('a pause of 250 ms between keys asks again, and one letter never asks', async () => {
    const wrapper = mount(LibrarySearchBox, { stubs: { 'frame-icon': true } })
    const input = wrapper.find('input')
    await type(input, 'Pri', 300)
    // "P" is under two characters, so only "Pr" and "Pri" ask.
    expect(suggestions.mock.calls.map(c => c[0])).toEqual(['Pr', 'Pri'])
    wrapper.destroy()
  })

  it('pressing Enter before the pause cancels the pending request', async () => {
    const wrapper = mount(LibrarySearchBox, { stubs: { 'frame-icon': true } })
    const input = wrapper.find('input')
    await input.setValue('Print')
    await input.trigger('keydown', { key: 'Enter' })
    vi.advanceTimersByTime(1000)
    expect(suggestions).not.toHaveBeenCalled()
    expect(wrapper.emitted('search')?.[0]).toEqual(['Print'])
    wrapper.destroy()
  })
})
