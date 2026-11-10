import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import StepChips from '../StepChips.vue'

const show = (values: number[]) => mount(StepChips, { propsData: { values, label: 'Steps', tid: 's' } })

it('adds a size with +, once each and smallest first', async () => {
  const w = show([1, 10])
  await w.get('[data-tid="s-add"]').trigger('click')
  await w.get('[data-tid="s-input"]').setValue('0,5')
  await w.get('[data-tid="s-input"]').trigger('keydown.enter')
  expect(w.emitted('change')).toEqual([[[0.5, 1, 10]]])
})

it('changes a size, removes one cleared, and never the last', async () => {
  const w = show([1, 10])
  await w.findAll('[data-tid="s-chip"]').at(1).trigger('click')
  await w.get('[data-tid="s-input"]').setValue('25')
  await w.get('[data-tid="s-input"]').trigger('keydown.enter')
  await w.findAll('[data-tid="s-chip"]').at(0).trigger('click')
  await w.get('[data-tid="s-input"]').setValue('')
  await w.get('[data-tid="s-input"]').trigger('blur')
  expect(w.emitted('change')).toEqual([[[1, 25]], [[10]]])

  const one = show([1])
  await one.get('[data-tid="s-chip"]').trigger('click')
  await one.get('[data-tid="s-input"]').setValue('')
  await one.get('[data-tid="s-input"]').trigger('keydown.enter')
  expect(one.emitted('change')).toBeUndefined()
})

it('ignores what is not a size, and Escape changes nothing', async () => {
  const w = show([1])
  await w.get('[data-tid="s-add"]').trigger('click')
  await w.get('[data-tid="s-input"]').setValue('-3')
  await w.get('[data-tid="s-input"]').trigger('keydown.enter')
  await w.get('[data-tid="s-add"]').trigger('click')
  await w.get('[data-tid="s-input"]').setValue('4')
  await w.get('[data-tid="s-input"]').trigger('keydown.esc')
  expect(w.emitted('change')).toBeUndefined()
  expect(w.find('[data-tid="s-input"]').exists()).toBe(false)
})
