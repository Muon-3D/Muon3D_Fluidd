import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ApprovalWaitDialog from '../ApprovalWaitDialog.vue'
import type { ApprovalOutcome, ApprovalWatch } from '@/services/muon-cloud/approval'

function fakeWatch () {
  let pending!: (symbols: string) => void
  let outcome!: (o: ApprovalOutcome) => void
  const watch: ApprovalWatch & { cancel: ReturnType<typeof vi.fn> } = {
    pending: new Promise<string>(resolve => { pending = resolve }),
    outcome: new Promise<ApprovalOutcome>(resolve => { outcome = resolve }),
    cancel: vi.fn()
  }
  return { watch, pending, outcome }
}

const AppDialog = { props: ['value', 'title'], template: '<div v-if="value"><slot /><slot name="actions" /></div>' }
const Plain = { template: '<div><slot /></div>' }
const Button = { template: '<button @click="$emit(\'click\')"><slot /></button>' }

function mountWith (watch: ApprovalWatch) {
  return mount(ApprovalWaitDialog, {
    propsData: { watch, printerName: 'Walnut · 8987' },
    stubs: {
      'app-dialog': AppDialog,
      AppDialog,
      'v-card-text': Plain,
      VCardText: Plain,
      'v-alert': Plain,
      VAlert: Plain,
      'v-spacer': Plain,
      VSpacer: Plain,
      'v-btn': Button,
      VBtn: Button
    }
  })
}

describe('ApprovalWaitDialog', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('shows nothing until the printer says it is holding the browser', async () => {
    const { watch } = fakeWatch()
    const wrapper = mountWith(watch)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('[data-tid="approval-symbols"]').exists()).toBe(false)
  })

  it('shows the symbols and the wait, and counts 120 s down', async () => {
    const { watch, pending } = fakeWatch()
    const wrapper = mountWith(watch)
    pending('F6Q TDH')
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.text()).toContain('Waiting for approval at the printer')
    expect(wrapper.text()).toContain("Check these match the printer's screen.")
    expect(wrapper.find('[data-tid="approval-symbols"]').text()).toBe('F6Q TDH')
    expect(wrapper.find('[data-tid="approval-countdown"]').text()).toBe('120 s left')

    await vi.advanceTimersByTimeAsync(30_000)
    expect(wrapper.find('[data-tid="approval-countdown"]').text()).toBe('90 s left')
    await vi.advanceTimersByTimeAsync(200_000)
    expect(wrapper.find('[data-tid="approval-countdown"]').text()).toBe('0 s left')
  })

  it('Cancel withdraws the request and closes', async () => {
    const { watch, pending } = fakeWatch()
    const wrapper = mountWith(watch)
    pending('F6Q TDH')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.find('[data-tid="approval-cancel"]').trigger('click')
    expect(watch.cancel).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('carries on when admitted, with no Try again', async () => {
    const { watch, pending, outcome } = fakeWatch()
    const wrapper = mountWith(watch)
    pending('F6Q TDH')
    outcome('admitted')
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.emitted('admitted')).toHaveLength(1)
    expect(wrapper.find('[data-tid="approval-outcome"]').text()).toContain('let this device in')
    expect(wrapper.find('[data-tid="approval-retry"]').exists()).toBe(false)
  })

  it.each([
    ['refused', 'refused this device'],
    ['timed_out', 'Nobody answered'],
    ['disabled', "isn't accepting new devices. Ask its owner"],
    ['busy', 'requests waiting'],
    ['cooldown', 'Too many tries']
  ] as const)('says %s in plain words, with Try again', async (outcomeName, words) => {
    const { watch, pending, outcome } = fakeWatch()
    const wrapper = mountWith(watch)
    pending('F6Q TDH')
    await vi.advanceTimersByTimeAsync(0)
    outcome(outcomeName)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('[data-tid="approval-outcome"]').text()).toContain(words)
    expect(wrapper.emitted('failed')?.[0]).toEqual([outcomeName])
    await wrapper.find('[data-tid="approval-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('shows a refusal that comes without a pending notice (disabled, busy, cooldown)', async () => {
    const { watch, outcome } = fakeWatch()
    const wrapper = mountWith(watch)
    outcome('disabled')
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('[data-tid="approval-outcome"]').text()).toContain('Ask its owner')
  })
})
