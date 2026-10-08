import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VueI18n from 'vue-i18n'
import Vue from 'vue'
import messages from '@/locales/en.yaml'
import PrintConfirmDialog, { ARM_DELAY_MS, type PrintConfirmRequest } from '../PrintConfirmDialog.vue'

Vue.use(VueI18n)

const i18n = new VueI18n({ locale: 'en', messages: { en: messages } })

/** Vuetify's parts as plain elements: the dialog's own behaviour is what is tested. */
const stubs = {
  'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<span />' },
  'v-icon': { template: '<i><slot /></i>' },
  'v-btn': { inheritAttrs: false, template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
  AppBtn: { inheritAttrs: false, props: ['disabled'], template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>' },
  'v-checkbox': { props: ['value', 'label'], template: '<label><input type="checkbox" :checked="value" @change="$emit(\'change\', $event.target.checked)">{{ label }}</label>', model: { prop: 'value', event: 'change' } }
}

const start = (patch: Partial<PrintConfirmRequest> = {}): PrintConfirmRequest =>
  ({ printer: 'Walnut', paths: ['benchy.gcode'], mode: 'start', plateClear: 'not-needed', ...patch })

function open (request: PrintConfirmRequest | null) {
  return mount(PrintConfirmDialog, { propsData: { request }, stubs, i18n, attachTo: document.body })
}

/** The dialog as the person sees it once Print has turned on. */
async function armed (request: PrintConfirmRequest | null) {
  const wrapper = open(request)
  vi.advanceTimersByTime(ARM_DELAY_MS)
  await wrapper.vm.$nextTick()
  return wrapper
}

const text = (wrapper: ReturnType<typeof open>, test: string) => wrapper.find(`[data-test="${test}"]`)

describe('PrintConfirmDialog', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('asks "Print ‹file› on ‹printer›?", with the plates queued after it', async () => {
    const wrapper = await armed(start({ paths: ['a.gcode', 'b.gcode', 'c.gcode'] }))
    expect(wrapper.find('#slicer-confirm-title').text()).toBe('Print a.gcode on Walnut?')
    expect(text(wrapper, 'slicer-confirm-more').text()).toBe('and queue 2 more')
    expect(text(wrapper, 'slicer-confirm-print').text()).toBe('Print')
    expect(text(wrapper, 'slicer-confirm-upload').text()).toBe('Upload only')
    expect(text(wrapper, 'slicer-confirm-plate').exists()).toBe(false)
    await text(wrapper, 'slicer-confirm-print').trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'print', plateClear: false }]])
    wrapper.destroy()
  })

  it('in queue mode asks "Queue ‹file› on ‹printer›?" and never Plate is clear', () => {
    const wrapper = open(start({ mode: 'queue', paths: ['a.gcode', 'b.gcode'], plateClear: 'ask' }))
    expect(wrapper.find('#slicer-confirm-title').text()).toBe('Queue a.gcode on Walnut?')
    expect(text(wrapper, 'slicer-confirm-more').text()).toBe('and 1 more')
    expect(text(wrapper, 'slicer-confirm-print').text()).toBe('Queue')
    expect(text(wrapper, 'slicer-confirm-plate').exists()).toBe(false)
    wrapper.destroy()
  })

  it('keeps Print off until Plate is clear is ticked, when the host asks it', async () => {
    const wrapper = await armed(start({ plateClear: 'ask' }))
    const print = text(wrapper, 'slicer-confirm-print')
    expect(text(wrapper, 'slicer-confirm-plate').text()).toContain('Plate is clear')
    expect(print.attributes('disabled')).toBe('disabled')
    ;(wrapper.vm as any).answer({ choice: 'print', plateClear: false })
    expect(wrapper.emitted('answer')).toBeUndefined()
    await wrapper.find('input[type="checkbox"]').setChecked(true)
    expect(print.attributes('disabled')).toBeUndefined()
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'print', plateClear: true }]])
    wrapper.destroy()
  })

  it.each([
    ['Upload only', (w: ReturnType<typeof open>) => text(w, 'slicer-confirm-upload').trigger('click')],
    ['its ✕', (w: ReturnType<typeof open>) => text(w, 'slicer-confirm-close').trigger('click')],
    ['Esc or a click outside (the dialog closes itself)', (w: ReturnType<typeof open>) => (w.vm as any).handleInput(false)]
  ])('%s answers Upload only, once', async (_how, close) => {
    const wrapper = await armed(start())
    await close(wrapper)
    await text(wrapper, 'slicer-confirm-print').trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'upload-only' }]])
    wrapper.destroy()
  })

  it('starts with the focus on its title, never on Print, and a new request starts unticked', async () => {
    const wrapper = open(start({ plateClear: 'ask' }))
    await wrapper.vm.$nextTick()
    expect(document.activeElement?.id).toBe('slicer-confirm-title')
    await wrapper.find('input[type="checkbox"]').setChecked(true)
    await wrapper.setProps({ request: start({ plateClear: 'ask', paths: ['next.gcode'] }) })
    expect((wrapper.vm as any).plateClear).toBe(false)
    wrapper.destroy()
  })

  it('keeps Print off for a moment after it shows, after each new request and after the window regains the focus', async () => {
    const wrapper = open(start())
    const print = text(wrapper, 'slicer-confirm-print')
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBe('disabled')
    await print.trigger('click')
    ;(wrapper.vm as any).answer({ choice: 'print', plateClear: false })
    expect(wrapper.emitted('answer')).toBeUndefined()
    vi.advanceTimersByTime(ARM_DELAY_MS - 1)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBe('disabled')
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBeUndefined()

    // A new request starts the wait again.
    await wrapper.setProps({ request: start({ paths: ['next.gcode'] }) })
    expect(print.attributes('disabled')).toBe('disabled')
    vi.advanceTimersByTime(ARM_DELAY_MS)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBeUndefined()

    // The window lost the focus (to another window, or the frame) and got it back: the wait starts again.
    window.dispatchEvent(new Event('blur'))
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBe('disabled')
    window.dispatchEvent(new Event('focus'))
    vi.advanceTimersByTime(ARM_DELAY_MS - 1)
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toBeUndefined()
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'print', plateClear: false }]])
    wrapper.destroy()
  })

  it('shows a file name as text', () => {
    const wrapper = open(start({ paths: ['<img src=x onerror=alert(1)>.gcode'] }))
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('#slicer-confirm-title').text()).toBe('Print <img src=x onerror=alert(1)>.gcode on Walnut?')
    wrapper.destroy()
  })

  it('shows nothing with no request', () => {
    const wrapper = open(null)
    expect(wrapper.find('.dialog').exists()).toBe(false)
    wrapper.destroy()
  })
})
