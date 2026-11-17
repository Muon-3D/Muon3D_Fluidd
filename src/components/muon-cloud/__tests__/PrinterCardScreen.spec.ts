import { shallowMount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PrinterCard from '../PrinterCard.vue'

const entry = { key: 'cloud:a', section: 'cloud', name: 'Elm', health: 'online', detail: 'Idle', saved: [] }

it.each(['ready', 'heating'])('names %s instead of contradicting its screen with Idle', async state => {
  const w = shallowMount(PrinterCard, { propsData: { entry, screenState: state } })
  expect(w.find('.muon-card__detail-text').text()).toBe(state === 'ready' ? 'Ready' : 'Heating')
  expect(w.find('.muon-card__detail').classes()).not.toContain('is-online')
  expect(w.findComponent({ name: 'PrinterScreen' }).props('state')).toBe(state)
  await w.setProps({ entry: { ...entry, detail: 'Idle · 192.0.2.11' } })
  expect(w.find('.muon-card__detail-text').text()).toBe(`${state === 'ready' ? 'Ready' : 'Heating'} · 192.0.2.11`)
  w.destroy()
})

it('leaves the classic switcher thumbnail and detail unchanged', () => {
  const w = shallowMount(PrinterCard, { propsData: { entry } })
  expect(w.find('.muon-card__detail-text').text()).toBe('Idle')
  expect(w.find('.muon-card__detail').classes()).toContain('is-online')
  expect(w.findComponent({ name: 'PrinterScreen' }).exists()).toBe(false)
  w.destroy()
})
