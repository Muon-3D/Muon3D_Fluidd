import Vue from 'vue'
import Vuetify from 'vuetify'
import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FileSystem from '../FileSystem.vue'
import FileEditorDialog from '../FileEditorDialog.vue'
import { SocketActions } from '@/api/socketActions'
import * as mode from '@/services/dev-mode/state'
import { EventBus } from '@/eventBus'

Vue.use(Vuetify)

const entry = (path: string, size = 10, modified = 1) => ({ path, size, modified })
const wrappers: Array<{ destroy: () => void }> = []
async function settle () {
  for (let i = 0; i < 12; i++) await Promise.resolve()
  await Vue.nextTick()
}

beforeEach(() => {
  mode.devModeState.enabled = true
  vi.spyOn(mode, 'refreshDevMode').mockResolvedValue(true)
  vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any)
  vi.spyOn(SocketActions, 'serverFilesListRoot').mockImplementation(async root => ({ result: root === 'config' ? [entry('changed.cfg', 20)] : [entry('changed.cfg')] }))
})
afterEach(() => {
  wrappers.splice(0).forEach(w => w.destroy())
  mode.devModeState.enabled = null
  vi.restoreAllMocks()
})

async function setup () {
  const context = Vue.observable({ target: 'account|printer', busy: false, readonly: false, path: 'config' })
  const root = { get readonly () { return context.readonly }, accepts: ['.cfg'], canView: [], canConfigure: true, filterTypes: [] }
  const confirm = vi.fn().mockResolvedValue(true)
  const wrapper = shallowMount(FileSystem, {
    propsData: { roots: ['config'], name: 'test', tile: true },
    mocks: {
      $store: {
        state: { files: { uploads: [] }, config: { uiSettings: { editor: {}, general: {}, fileSystem: { activeFilters: {} }, spoolman: {} } } },
        getters: {
          'files/getRootProperties': () => root,
          'files/isRootAvailable': () => true,
          'files/getCurrentPathByRoot': () => context.path,
          'files/getDirectory': () => [],
          'config/getMergedTableHeaders': (h: unknown) => h,
          'server/componentSupport': () => true,
          'server/isMuonPrinter': true,
          'spoolman/getAvailable': false
        },
        dispatch: vi.fn(),
        commit: vi.fn()
      },
      $route: { meta: {}, path: '/m1/configure' },
      $router: { currentRoute: { name: 'Configure' }, push: vi.fn() },
      $t: (s: string) => s,
      $tc: (s: string) => s,
      $waits: { onFileSystem: 'files' },
      $confirm: confirm
    },
    computed: {
      socketConnected: () => true,
      controlReady: () => true,
      klippyReady: () => true,
      panelTarget: () => context.target,
      busy: () => context.busy,
      printerPrinting: () => context.busy,
      printerPaused: () => false,
      printerName: () => 'Boxwood',
      hasWaitsBy: () => () => false
    },
    stubs: ['file-system-toolbar', 'file-system-bulk-actions', 'file-system-browser', 'file-system-context-menu',
      'file-editor-dialog', 'file-name-dialog', 'app-drag-overlay', 'file-system-upload-dialog', 'file-preview-dialog',
      'file-system-go-to-file-dialog', 'v-card']
  })
  wrappers.push(wrapper)
  const vm = wrapper.vm as any
  const get = vi.spyOn(vm, 'getFile').mockResolvedValue({ data: 'default' })
  const upload = vi.spyOn(vm, 'uploadFiles').mockResolvedValue(['changed.cfg'])
  const resetUi = vi.spyOn(vm, '_klipperReset').mockResolvedValue(undefined)
  const restart = vi.spyOn(SocketActions, 'printerFirmwareRestart').mockImplementation(vi.fn() as any)
  await settle()
  const open = (path = 'config', filename = 'changed.cfg') => {
    vm.fileEditorDialogState = { open: true, contents: 'edited', filename, path, root: 'config', target: context.target, readonly: false, loading: false }
    vm.defaults = { [`${path}/${filename}`.slice('config/'.length)]: 'changed' }
  }
  return { wrapper, vm, context, confirm, get, upload, restart, resetUi, open }
}

describe('configuration default comparison', () => {
  it('uses fresh listings and reads equal-sized files only when their times differ', async () => {
    vi.mocked(SocketActions.serverFilesListRoot).mockImplementation(async root => ({
      result: root === 'config'
        ? [entry('changed.cfg', 20), entry('check.cfg', 10, 2), entry('same.cfg'), entry('own.cfg')]
        : [entry('changed.cfg'), entry('check.cfg'), entry('same.cfg')]
    }))
    const { vm, get } = await setup()
    expect(vm.defaults).toEqual({ 'changed.cfg': 'changed', 'own.cfg': 'yours' })
    expect(get.mock.calls.map(c => c.slice(0, 2))).toEqual([['check.cfg', 'config'], ['check.cfg', 'defaults']])
    expect(vm.visibleDefaultTags).toEqual(vm.defaults)
    get.mockImplementation(async (_name: unknown, path: unknown) => ({ data: path }))
    await vm.refreshDefaults()
    expect(vm.defaults['check.cfg']).toBe('changed')
  })

  it('treats empty listings as empty, and offers retry after a read failure without guessing tags', async () => {
    vi.mocked(SocketActions.serverFilesListRoot).mockResolvedValue({ result: [] })
    const { vm } = await setup()
    expect(vm.defaults).toEqual({})
    expect(vm.defaultsError).toBe('')
    vi.mocked(SocketActions.serverFilesListRoot).mockResolvedValue(undefined)
    await vm.refreshDefaults()
    expect(vm.defaultsError).toContain('Cannot compare')
    expect(vm.defaults).toEqual({})
    vi.mocked(SocketActions.serverFilesListRoot).mockImplementation(async root => ({ result: root === 'config' ? [entry('changed.cfg', 20)] : [entry('changed.cfg')] }))
    await vm.refreshDefaults()
    expect(vm.defaultsError).toBe('')
    expect(vm.defaults).toEqual({ 'changed.cfg': 'changed' })
  })

  it('stops an unfinished comparison after leaving Files', async () => {
    const { wrapper, vm } = await setup()
    let finish!: () => void
    const released = new Promise<void>(resolve => { finish = resolve })
    vi.mocked(SocketActions.serverFilesListRoot).mockImplementation(async root => {
      await released
      return { result: [entry('old.cfg', root === 'config' ? 20 : 10)] }
    })
    const pending = vm.refreshDefaults()
    wrapper.destroy()
    finish()
    await pending
    expect(vm.defaults).toEqual({})
    expect(vm.defaultsGone).toBe(true)
  })
})

describe('resetting one configuration file', () => {
  it('asks first, copies even an empty default to the captured subfolder, then asks before restarting', async () => {
    const { vm, confirm, get, upload, restart, open } = await setup()
    open('config/macros')
    get.mockResolvedValue({ data: '' })
    const accept = vi.fn()
    await vm.resetDefault(accept)
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(confirm.mock.calls[0][0]).toContain('Unsaved changes')
    expect(get).toHaveBeenCalledWith('changed.cfg', 'defaults/macros', 0, expect.any(Object))
    expect(upload).toHaveBeenCalledWith(expect.any(Array), 'macros', 'config', false, expect.any(Function))
    expect((upload.mock.calls[0][0] as File[])[0].size).toBe(0)
    expect(accept).toHaveBeenCalledWith('')
    expect(vm.fileEditorDialogState.contents).toBe('')
    expect(restart).toHaveBeenCalledTimes(1)
  })

  it('saves during a print but defers restarting, and does nothing when reset is cancelled', async () => {
    const { vm, context, open, confirm, upload, get, restart } = await setup()
    const notify = vi.spyOn(EventBus, '$emit')
    open()
    context.busy = true
    await vm.resetDefault()
    expect(upload).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(restart).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("Restart once it's done"), expect.any(Object))
    open()
    confirm.mockResolvedValue(false)
    upload.mockClear(); get.mockClear()
    await vm.resetDefault()
    expect(upload).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
  })

  it('requires a changed writable file, a current target, and a fresh Developer mode answer', async () => {
    const { vm, context, open, upload, confirm, get } = await setup()
    open()
    vm.fileEditorDialogState.readonly = true
    await vm.resetDefault()
    expect(confirm).not.toHaveBeenCalled()
    open()
    vm.defaults = { 'changed.cfg': 'yours' }
    await vm.resetDefault()
    expect(confirm).not.toHaveBeenCalled()
    open()
    confirm.mockImplementationOnce(async () => { context.target = 'other|printer'; return true })
    await vm.resetDefault()
    expect(upload).not.toHaveBeenCalled()
    open()
    vi.mocked(mode.refreshDevMode).mockResolvedValueOnce(null)
    await vm.resetDefault()
    expect(get).not.toHaveBeenCalled()
    expect(vm.defaultsError).toContain('did not confirm Developer mode')
    expect(upload).not.toHaveBeenCalled()
  })

  it('does not restart or update a new editor after a target change, permission change or a failed write', async () => {
    const { vm, context, open, get, upload, restart } = await setup()
    open()
    upload.mockResolvedValueOnce([])
    await vm.resetDefault()
    expect(vm.defaultsError).toContain('Could not complete')
    expect(restart).not.toHaveBeenCalled()
    open()
    get.mockImplementationOnce(async () => { context.readonly = true; return { data: 'default' } })
    upload.mockClear()
    await vm.resetDefault()
    expect(upload).not.toHaveBeenCalled()
    context.readonly = false
    open()
    const accept = vi.fn()
    upload.mockImplementationOnce(async () => { context.target = 'other|printer'; return ['changed.cfg'] })
    await vm.resetDefault(accept)
    expect(accept).not.toHaveBeenCalled()
    expect(restart).not.toHaveBeenCalled()
  })

  it('rechecks printing after the restart confirmation', async () => {
    const { vm, context, open, confirm, restart } = await setup()
    open()
    confirm.mockImplementationOnce(async () => true).mockImplementationOnce(async () => { context.busy = true; return true })
    await vm.resetDefault()
    expect(restart).not.toHaveBeenCalled()
  })

  it('does not transfer a restart to another printer during the asynchronous UI reset', async () => {
    const { vm, context, open, resetUi, restart } = await setup()
    open()
    const dispatched: string[] = []
    restart.mockImplementation((() => { dispatched.push(context.target) }) as any)
    resetUi.mockImplementationOnce(async () => { context.target = 'another|printer' })
    await vm.resetDefault()
    expect(resetUi).toHaveBeenCalledTimes(1)
    expect(dispatched).toEqual(['account|printer'])
  })
})

describe('the default action in the editor', () => {
  function show (extra: Record<string, unknown> = {}) {
    const wrapper = shallowMount(FileEditorDialog, {
      vuetify: new Vuetify(),
      propsData: { value: true, root: 'config', path: 'config', filename: 'changed.cfg', contents: 'saved', strictGuard: true, defaultStatus: 'changed', canResetDefault: true, ...extra },
      mocks: { $t: (s: string) => s, $tc: (s: string) => s },
      computed: { ready: () => true, useTextOnlyEditor: () => true, codeLens: () => false, fontSize: () => 16, configMap: () => ({}), printerPrinting: () => false, canSaveAndRestart: () => false, restartInfo: () => '' },
      stubs: { AppBtn: { template: '<button v-on="$listeners"><slot /></button>' }, 'v-dialog': true, 'v-card': true, 'v-toolbar': true, 'v-toolbar-title': true, 'v-spacer': true, 'v-toolbar-items': true, 'v-icon': true, 'file-editor-text-only': true }
    })
    wrappers.push(wrapper)
    return wrapper
  }

  it('shows the default status and action, and accepts an empty saved default over unsaved edits', async () => {
    const w = show()
    await w.setData({ updatedContent: 'unsaved' })
    expect(w.find('[data-tid="files-editor-default-status"]').text()).toContain('Different')
    await w.find('[data-tid="files-reset-default"]').trigger('click')
    const accept = w.emitted('reset-default')![0][0] as (text: string) => void
    accept('')
    expect((w.vm as any).updatedContent).toBe('')
    expect((w.vm as any).dirty).toBe(false)
  })

  it('does not offer a reset for read-only files and shows a failed comparison explicitly', () => {
    const w = show({ readonly: true, defaultStatus: 'yours', defaultError: 'Cannot compare the defaults' })
    expect(w.find('[data-tid="files-reset-default"]').exists()).toBe(false)
    expect(w.find('[data-tid="files-editor-default-status"]').text()).toContain('no default')
    expect(w.find('[data-tid="files-default-error"]').text()).toContain('Cannot compare')
  })
})
