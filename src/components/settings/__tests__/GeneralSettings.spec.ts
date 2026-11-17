import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GeneralSettings from '../GeneralSettings.vue'
import { httpClientActions } from '@/api/httpClientActions'

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: {
    serverMuonIdentityGet: vi.fn(async () => ({ data: { result: { name: 'Boxwood', suffix: '367a' } } })),
    serverDatabaseItemGet: vi.fn(),
    serverDatabaseItemPost: vi.fn(async () => ({}))
  }
}))
vi.mock('@/util/file-system-entry', () => ({ readFileAsTextAsync: vi.fn(async (file: { text: string }) => file.text) }))

afterEach(() => { vi.clearAllMocks() })

const stubs = { 'v-text-field': true, 'v-select': true, 'v-combobox': true, 'v-icon': true, 'router-link': true }

function mount (over: { general?: Record<string, unknown>, theme?: Record<string, unknown>, devices?: unknown[], confirm?: boolean } = {}) {
  const dispatch = vi.fn()
  const confirm = vi.fn(async () => over.confirm ?? true)
  const general = {
    instanceName: 'Boxwood',
    confirmOnEstop: false,
    confirmOnSaveConfigAndRestart: true,
    confirmOnPowerDeviceChange: true,
    showUploadAndPrint: true,
    printProgressCalculation: ['file'],
    printEtaCalculation: ['slicer'],
    timeFormat: 'iso',
    sectionsToIgnorePendingConfigurationChanges: [],
    ...over.general
  }
  const wrapper = shallowMount(GeneralSettings, {
    stubs,
    mocks: {
      $t: (key: string) => key,
      $rules: { required: true },
      $globals: { APP_NAME: 'Control' },
      $confirm: confirm,
      $store: {
        dispatch,
        state: { config: { uiSettings: { general, theme: { color: '#80d6d1', isDark: true, ...over.theme } } } },
        getters: { 'config/getDisplayName': 'Boxwood', 'server/isMuonPrinter': true, 'power/getDevices': over.devices ?? [], 'printer/getPins': [] }
      }
    },
    computed: { settingsPath: () => '/boxwood-367a/settings', availableDateFormats: () => [] }
  })
  return { wrapper, dispatch, confirm }
}

const segValue = (wrapper: ReturnType<typeof mount>['wrapper'], tid: string) =>
  wrapper.find(`[data-tid="${tid}"]`).attributes('value')

describe('GeneralSettings', () => {
  it('has the storyboard groups in order, and none of the old Theme card', () => {
    const { wrapper } = mount()
    expect(wrapper.findAll('h2').wrappers.map(h => h.text())).toEqual([
      'This printer', 'Look', 'Language and time', 'Ask before', 'Overview and the top bar', 'Keyboard', 'These settings', 'More'
    ])
    for (const gone of ['Panels', 'Flat', 'Logo behind the pages', 'A community theme', 'Camera switch on Overview']) {
      expect(wrapper.text()).not.toContain(gone)
    }
    expect(wrapper.text()).toContain('These are yours on this printer: someone else on Boxwood keeps their own.')
  })

  it('reads the model from the printer, with no serial when it reports none', async () => {
    const { wrapper } = mount()
    await vi.waitFor(() => expect(httpClientActions.serverMuonIdentityGet).toHaveBeenCalled())
    expect(wrapper.find('[data-tid="setting-model"]').text()).toBe('Muon M1')
  })

  it('saves a swatch as this person\'s accent, and marks none for an older free colour', async () => {
    const { wrapper, dispatch } = mount({ theme: { color: '#123456' } })
    expect(wrapper.findAll('[role="radio"][aria-checked="true"]')).toHaveLength(0)
    await wrapper.find('[data-tid="accent-blue"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('config/savePersonal', { path: 'theme.color', value: '#7aa7ff' })
  })

  it('saves Light as mode and isDark together', async () => {
    const { wrapper, dispatch } = mount()
    expect(segValue(wrapper, 'setting-theme-mode')).toBe('dark')
    wrapper.findComponent({ name: 'SegPicker' }).vm.$emit('input', 'light')
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith('config/savePersonal', { path: 'theme.isDark', value: false }))
    expect(dispatch).toHaveBeenCalledWith('config/savePersonal', { path: 'theme.mode', value: 'light' })
  })

  it('shows ISO times as 24-hour, and today\'s lists as one choice each', () => {
    const { wrapper } = mount()
    expect(segValue(wrapper, 'setting-times')).toBe('hours24')
    expect(segValue(wrapper, 'setting-progress')).toBe('file')
    expect(segValue(wrapper, 'setting-eta')).toBe('slicer')
  })

  it('asks before E-STOP is made to ask, and saves nothing when that is turned down', async () => {
    const { wrapper, dispatch, confirm } = mount({ confirm: false })
    ;(wrapper.vm as any).setConfirmOnEstop(true)
    await vi.waitFor(() => expect(confirm).toHaveBeenCalled())
    expect((confirm.mock.calls[0] as unknown[])[1]).toMatchObject({ title: 'E-STOP will need two presses' })
    expect(dispatch).not.toHaveBeenCalledWith('config/savePersonal', expect.objectContaining({ path: 'general.confirmOnEstop' }))
  })

  it('turns E-STOP asking off at once', async () => {
    const { wrapper, dispatch, confirm } = mount({ general: { confirmOnEstop: true } })
    await (wrapper.vm as any).setConfirmOnEstop(false)
    expect(confirm).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith('config/savePersonal', { path: 'general.confirmOnEstop', value: false })
  })

  it('shows the power-switch question only when the printer has power switches', () => {
    expect(mount().wrapper.find('[data-tid="setting-ask-power"]').exists()).toBe(false)
    expect(mount({ devices: [{ device: 'psu' }] }).wrapper.find('[data-tid="setting-ask-power"]').exists()).toBe(true)
  })

  it('restores a copy only after Restore, showing what changes first', async () => {
    vi.mocked(httpClientActions.serverDatabaseItemGet).mockResolvedValue({
      data: { result: { value: { uiSettings: { theme: { color: '#80d6d1' }, general: { instanceName: 'Boxwood' } } } } }
    } as never)
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    const { wrapper } = mount()
    const copy = { meta: { app: 'Fluidd', version: '1', type: 'settings-backup' }, data: { uiSettings: { theme: { color: '#7aa7ff' }, general: { instanceName: 'Elm' } } } }
    const input = wrapper.find('[data-tid="settings-restore-file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [{ name: 'elm-control.json', text: JSON.stringify(copy) }], configurable: true })
    Object.defineProperty(input, 'value', { value: '', writable: true })
    await (wrapper.vm as any).handleRestoreSettings()

    const restore = (wrapper.vm as any).restore
    expect(restore.from).toBe('Elm')
    expect(restore.changes).toHaveLength(2)
    expect(restore.changes).toEqual(expect.arrayContaining([{ label: 'Accent colour', value: 'Teal → Blue' }, { label: 'Name', value: 'Boxwood → Elm' }]))
    expect(httpClientActions.serverDatabaseItemPost).not.toHaveBeenCalled()

    ;(wrapper.vm as any).cancelRestore()
    expect((wrapper.vm as any).restore).toBeNull()
    expect(httpClientActions.serverDatabaseItemPost).not.toHaveBeenCalled()

    ;(wrapper.vm as any).restore = restore
    await (wrapper.vm as any).applyRestore()
    expect(httpClientActions.serverDatabaseItemPost).toHaveBeenCalledWith('fluidd', 'uiSettings', copy.data.uiSettings)
    expect(reload).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
