import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import M3Dialog from '../M3Dialog.vue'

// KAN-1831: the title-focus retry is a 30 ms timer chain. When the dialog went
// away with a retry pending, it fired after the test environment was torn
// down: "ReferenceError: window is not defined", and a red CI run.
afterEach(() => { vi.useRealTimers() })

const open = () => mount(M3Dialog, {
  propsData: { value: true, title: 'Title' },
  // The stub never renders the title, so the focus keeps retrying.
  stubs: { 'v-dialog': { template: '<div><slot /></div>' } }
})

it('keeps retrying the title focus while it is open', async () => {
  vi.useFakeTimers()
  const wrapper = open()
  await wrapper.vm.$nextTick()
  expect(vi.getTimerCount()).toBe(1)
  wrapper.destroy()
})

it('leaves no focus timer behind when it is destroyed', async () => {
  vi.useFakeTimers()
  const wrapper = open()
  await wrapper.vm.$nextTick()
  wrapper.destroy()
  expect(vi.getTimerCount()).toBe(0)
})

it('leaves no focus timer behind when it closes', async () => {
  vi.useFakeTimers()
  const wrapper = open()
  await wrapper.vm.$nextTick()
  await wrapper.setProps({ value: false })
  expect(vi.getTimerCount()).toBe(0)
  wrapper.destroy()
})

it('does not start a retry when destroyed before the focus runs', async () => {
  vi.useFakeTimers()
  const wrapper = open()
  wrapper.destroy()
  await Promise.resolve()
  expect(vi.getTimerCount()).toBe(0)
})
