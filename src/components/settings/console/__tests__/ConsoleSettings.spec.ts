import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConsoleSettings from '../ConsoleSettings.vue'
import ConsoleFilterDialog from '../ConsoleFilterDialog.vue'
import { SocketActions } from '@/api/socketActions'
import { cloudState } from '@/services/muon-cloud/state'
import { defaultConsoleConfig } from '@/services/console/settings'

vi.mock('@/api/socketActions', () => ({ SocketActions: { serverWrite: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'boxwood-367a' }))
vi.mock('@/services/muon-cloud/state', async () => {
  const Vue = (await import('vue')).default
  return { cloudState: Vue.observable({ ready: true, account: null as null | { id: string } }) }
})

const stubs = {
  'frame-icon': true,
  'router-link': { props: ['to'], template: '<a :href="to" v-bind="$attrs"><slot /></a>' },
  AppDraggable: { template: '<div><slot /></div>' },
  ToggleSwitch: { props: ['value', 'label'], template: '<button role="switch" :aria-label="label" :aria-checked="String(value)" @click="$emit(\'input\', !value)" />' },
  SegPicker: { props: ['value', 'options', 'label'], template: '<div :aria-label="label"><button v-for="o in options" :key="o.value" :data-v="o.value" @click="$emit(\'input\', o.value)">{{ o.label }}</button></div>' },
  M3Dialog: { props: ['value'], template: '<div v-if="value"><slot /><slot name="actions" /></div>' }
}

function show (o: { console?: Record<string, unknown>, components?: string[], entries?: Array<{ message: string }> } = {}) {
  const dispatch = vi.fn()
  const store = {
    state: {
      config: { uiSettings: { general: { hideTempWaits: true, flipConsoleLayout: false }, console: { ...defaultConsoleConfig(), ...o.console } } },
      console: { console: (o.entries ?? []).map((e, i) => ({ id: i, type: 'response', ...e })) }
    },
    getters: {
      'console/getFilters': [],
      'server/componentSupport': (name: string) => (o.components ?? ['authorization']).includes(name)
    },
    dispatch
  }
  const wrapper = mount(ConsoleSettings, { mocks: { $store: store, $filters: { formatTimeWithSeconds: () => '19:41:02' } }, stubs })
  return { wrapper, dispatch }
}

afterEach(() => {
  vi.clearAllMocks()
  cloudState.account = null
  cloudState.ready = true
})

describe('Settings › Console', () => {
  it('shows the default chips, and leaves out the move-or-heat check and other people\'s commands', () => {
    const { wrapper } = show()
    expect(wrapper.text()).toContain('Quick commands · 6')
    expect(wrapper.text()).not.toContain('Check commands that move or heat')
    expect(wrapper.text()).not.toContain("Other people's commands")
  })

  it('saves the chips for this person only, on the printer', async () => {
    cloudState.account = { id: 'acc.7' } as typeof cloudState.account
    const { wrapper, dispatch } = show()
    await wrapper.find('[data-tid="console-settings-chip-STATUS"]').trigger('keydown', { key: 'ArrowLeft', altKey: true })
    expect(SocketActions.serverWrite).toHaveBeenCalledWith('uiSettings.console.quickCommands.acc_7', expect.any(Array))
    const list = (SocketActions.serverWrite as any).mock.calls[0][1].map((q: { command: string }) => q.command)
    expect(list.slice(-2)).toEqual(['STATUS', 'FIRMWARE_RESTART'])
    expect(dispatch).toHaveBeenCalledWith('config/saveByPath', expect.objectContaining({ path: 'uiSettings.console.quickCommands' }))
  })

  it('saves nothing, and offers no chips, until the account is known', async () => {
    cloudState.ready = false
    const { wrapper, dispatch } = show()
    expect(wrapper.text()).toContain('Quick commands · 0')
    expect(wrapper.find('[data-tid="console-settings-chip-STATUS"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="console-settings-quick-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="console-settings-add-quick"]').attributes('disabled')).toBe('disabled')
    ;(wrapper.vm as unknown as { saveQuickList: (list: unknown[]) => void }).saveQuickList([])
    expect(SocketActions.serverWrite).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    // Once it is known, the chips are that person's, and writing works.
    cloudState.account = { id: 'acc.7' } as typeof cloudState.account
    cloudState.ready = true
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Quick commands · 6')
    ;(wrapper.vm as unknown as { saveQuickList: (list: unknown[]) => void }).saveQuickList([])
    expect(SocketActions.serverWrite).toHaveBeenCalledWith('uiSettings.console.quickCommands.acc_7', [])
  })

  it('turns temperature reports on by clearing hideTempWaits', async () => {
    const { wrapper, dispatch } = show()
    await wrapper.find('[aria-label="Temperature reports"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('config/saveByPath', { path: 'uiSettings.general.hideTempWaits', value: false, server: true })
  })

  it('saves Newest at as flipConsoleLayout, and the typing settings under uiSettings.console', async () => {
    const { wrapper, dispatch } = show()
    await wrapper.find('[aria-label="Newest at"] [data-v="top"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('config/saveByPath', { path: 'uiSettings.general.flipConsoleLayout', value: true, server: true })
    await wrapper.find('[aria-label="Enter sends"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('config/saveByPath', { path: 'uiSettings.console.enterSends', value: false, server: true })
  })

  it('links to People and access only where the printer has it', () => {
    expect(show().wrapper.find('[data-tid="console-settings-access"]').attributes('href')).toBe('/boxwood-367a/settings#access')
    expect(show({ components: [] }).wrapper.find('[data-tid="console-settings-access"]').exists()).toBe(false)
  })
})

describe('the filter sheet', () => {
  const sheet = (entries: Array<{ message: string }>) => mount(ConsoleFilterDialog, {
    propsData: { value: true, filter: null },
    mocks: {
      $store: { state: { console: { console: entries.map((e, i) => ({ id: i, type: 'response', time: 1, ...e })) } }, getters: { 'console/getFilters': [] } },
      $filters: { formatTimeWithSeconds: () => '19:41:02' }
    },
    stubs
  })

  it('counts what it would hide of the last lines, live', async () => {
    const w = sheet([{ message: 'probe at 1 is z=0.1' }, { message: 'ok' }, { message: 'probe at 2 is z=0.2' }])
    await w.find('[data-tid="console-filter-value"]').setValue('probe at')
    expect(w.find('[data-tid="console-filter-count"]').text()).toBe('Would hide 2 of the last 3 lines')
    expect(w.find('[data-tid="console-filter-preview"]').text()).toContain('probe at 2 is z=0.2')
  })

  it('refuses a bad pattern with the reason', async () => {
    const w = sheet([])
    await w.find('[data-v="expression"]').trigger('click')
    await w.find('[data-tid="console-filter-name"]').setValue('Bad')
    await w.find('[data-tid="console-filter-value"]').setValue('([')
    expect(w.find('[role="alert"]').text()).toMatch(/^That pattern can't be used: /)
    expect(w.find('[data-tid="console-filter-save"]').attributes('disabled')).toBeDefined()
    await w.find('[data-tid="console-filter-save"]').trigger('click')
    expect(w.emitted('save')).toBeUndefined()
  })

  it('saves a new filter switched on', async () => {
    const w = sheet([])
    await w.find('[data-tid="console-filter-name"]').setValue('Timelapse frames')
    await w.find('[data-v="starts-with"]').trigger('click')
    await w.find('[data-tid="console-filter-value"]').setValue('// timelapse')
    await w.find('[data-tid="console-filter-save"]').trigger('click')
    expect(w.emitted('save')![0][0]).toEqual({ id: '', enabled: true, name: 'Timelapse frames', type: 'starts-with', value: '// timelapse' })
  })
})
