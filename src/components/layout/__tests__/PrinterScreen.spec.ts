import { shallowMount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PrinterScreen from '../PrinterScreen.vue'
import { STRIP_LABELS, type StripState } from '@/services/muon-cloud/printer-strip'

it.each(Object.keys(STRIP_LABELS) as StripState[])('names %s without relying on colour', state => {
  const w = shallowMount(PrinterScreen, { propsData: { state } })
  expect(w.attributes('aria-label')).toBe(STRIP_LABELS[state])
  expect(w.attributes('data-state')).toBe(state)
  expect(w.classes()).toContain(`printer-screen--${state}`)
  expect(w.text()).not.toBe('')
  w.destroy()
})

it('uses a rounded square only for a foreign printer', async () => {
  const w = shallowMount(PrinterScreen, { propsData: { state: 'ready' } })
  expect(w.classes()).not.toContain('printer-screen--foreign')
  await w.setProps({ foreign: true })
  expect(w.classes()).toContain('printer-screen--foreign')
  w.destroy()
})
