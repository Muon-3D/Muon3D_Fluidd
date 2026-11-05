import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import ObjectsList from '../tiles/ObjectsList.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'

vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

it('skips a real object once and refuses a context change during the confirm', async () => {
  const store = tileStore({ printing: true })
  Vue.set(store.state.printer.printer, 'exclude_object', { objects: [{ name: 'part_1' }], excluded_objects: [] })
  const opts = tileMount(store)
  let change = false
  opts.mocks.$confirm = vi.fn(async () => { if (change) store.state.config.apiUrl = 'http://other.local'; return true })
  const w = mount(ObjectsList, opts)
  await w.find('[data-skip="part_1"]').trigger('click'); await Vue.nextTick(); await Vue.nextTick()
  expect(sent()).toEqual(['EXCLUDE_OBJECT NAME=part_1'])
  change = true
  await w.find('[data-skip="part_1"]').trigger('click'); await Vue.nextTick(); await Vue.nextTick()
  expect(sent()).toHaveLength(1)
  w.destroy(); resetSocket()
})
