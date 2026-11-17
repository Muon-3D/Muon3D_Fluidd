import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlActions from '../ControlActions.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); cloudState.account = null })

it('shows only unique actions on desktop and keeps Cool down in the phone menu (homing and Motors off are in the Move tile)', () => {
  const store = panelStore()
  const mountActions = (phone: boolean) => mount(ControlActions, { propsData: { phone }, mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: vi.fn() }, stubs: panelStubs })
  const desktop = mountActions(false)
  expect(desktop.find('[data-tid="home-all"]').exists()).toBe(false)
  expect(desktop.find('[data-tid="cool-down"]').exists()).toBe(false)
  expect(desktop.find('[data-tid="motors-off"]').exists()).toBe(false)
  expect(desktop.find('summary').exists()).toBe(false)
  desktop.destroy()
  const phone = mountActions(true)
  expect(phone.find('[data-tid="home-all"]').exists()).toBe(false)
  expect(phone.find('[data-tid="cool-down"]').exists()).toBe(true)
  expect(phone.find('summary').exists()).toBe(true)
  phone.destroy()
})

it('refuses a confirmation completed after the signed-in account changed', async () => {
  const store = panelStore()
  const confirm = vi.fn().mockImplementation(async () => { cloudState.account = { id: 'other' } as any; return true })
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: confirm }, stubs: panelStubs })
  await (wrapper.vm as any).sendTypedGcode('RESTART')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  cloudState.account = null; wrapper.destroy()
})

it('offers confirmed restarts with the mode off and refuses a print that starts during confirmation', async () => {
  const store = panelStore()
  const confirm = vi.fn().mockImplementation(async () => { store.getters['printer/getPrinterState'] = 'printing'; return true })
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: confirm }, stubs: panelStubs })
  const restart = wrapper.find('[data-tid="restart-printer"]')
  expect(restart.exists()).toBe(true)
  await restart.trigger('click'); await Promise.resolve(); await wrapper.vm.$nextTick()
  expect(confirm).toHaveBeenCalledTimes(1); expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Not sent')
  store.getters['printer/getPrinterState'] = 'ready'; confirm.mockResolvedValue(true)
  await wrapper.vm.$nextTick(); await restart.trigger('click'); await new Promise(resolve => setTimeout(resolve, 0))
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['FIRMWARE_RESTART'])
  wrapper.destroy()
})

it('keeps motors locked while paused and offers recovery restarts without Klipper ready', async () => {
  const store = panelStore()
  store.getters['printer/getPrinterState'] = 'paused'
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: vi.fn().mockResolvedValue(true) }, stubs: panelStubs })
  ;(wrapper.vm as any).motorsOff(); expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  store.getters['printer/getPrinterState'] = 'error'; store.getters['printer/getKlippyState'] = 'error'; store.getters['printer/getKlippyReady'] = false; store.getters['printer/getKlippyConnected'] = false
  await wrapper.vm.$nextTick()
  const firmware = wrapper.find('[data-tid="restart-printer"]')
  expect(firmware.attributes('disabled')).toBeUndefined(); await firmware.trigger('click'); await new Promise(resolve => setTimeout(resolve, 0))
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['FIRMWARE_RESTART'])
  wrapper.destroy()
})

it.each([false, true])('has one friendly restart, not technical or save-and-restart buttons, on phone=%s', phone => {
  const store = panelStore()
  store.state.printer.printer.configfile.save_config_pending = true
  const wrapper = mount(ControlActions, { propsData: { phone }, mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: vi.fn() }, stubs: panelStubs })
  expect(wrapper.findAll('[data-tid="restart-printer"]').length).toBe(1)
  expect(wrapper.find('[data-tid="restart-printer"]').text()).toBe('Restart printer')
  for (const id of ['restart-klipper', 'restart-firmware', 'save-config']) expect(wrapper.find(`[data-tid="${id}"]`).exists()).toBe(false)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('uses a printer-labelled confirmation and sends nothing when keeping it running', async () => {
  const store = panelStore()
  const confirm = vi.fn().mockResolvedValue(false)
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: confirm }, stubs: panelStubs })
  await wrapper.find('[data-tid="restart-printer"]').trigger('click')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining('firmware'), expect.objectContaining({ title: 'Restart printer?', buttonTrueText: 'Restart printer', buttonFalseText: 'Keep running', danger: true }))
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('cannot restart before it knows the printer status, rather than assuming an empty status is idle', () => {
  const store = panelStore()
  store.getters['printer/getPrinterState'] = 'loading'
  store.getters['printer/getKlippyState'] = 'startup'
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: vi.fn() }, stubs: panelStubs })
  const restart = wrapper.find('[data-tid="restart-printer"]')
  expect((restart.element as HTMLButtonElement).disabled).toBe(true)
  expect(restart.attributes('title')).toContain('Wait for the printer status')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})
