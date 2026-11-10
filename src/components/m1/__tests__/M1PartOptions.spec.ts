import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import M1PartOptions from '../M1PartOptions.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/eventBus', () => ({ EventBus: { $emit: vi.fn(), $on: vi.fn(), $off: vi.fn() } }))

afterEach(() => { socket.printerGcodeScript.mockClear() })

it('the toolhead Home sends a full G28: X, Y and Z', async () => {
  const store = panelStore()
  const wrapper = mount(M1PartOptions, { propsData: { part: 'toolhead' }, mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: vi.fn() }, stubs: panelStubs })
  const home = wrapper.find('[data-tid="m1-pad-home"]')
  expect(home.attributes('aria-label')).toBe('Home all (X, Y and Z)')
  await home.trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['G28'])
  wrapper.destroy()
})
