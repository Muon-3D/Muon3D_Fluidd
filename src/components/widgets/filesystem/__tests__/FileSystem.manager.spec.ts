import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FileSystem from '../FileSystem.vue'
import FileSystemBrowser from '../FileSystemBrowser.vue'
import { SocketActions } from '@/api/socketActions'
import { Filters as filters } from '@/plugins/filters'

vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'm1', printerHomePath: () => '/m1', printerPath: (s: string) => `/${s}` }))

const dir = (name: string) => ({ type: 'directory', name, dirname: name, modified: 1, size: 0, permissions: 'rw' })
const up = { type: 'directory', name: '..', dirname: '..', modified: 0, size: 0 }
const file = (name: string, extra: Record<string, unknown> = {}) => ({
  type: 'file', name, filename: name, extension: name.split('.').pop(), path: 'gcodes', modified: 1, size: 10, permissions: 'rw', ...extra
})

interface Setup { path?: string, ready?: boolean, confirm?: boolean, folder?: unknown[] }

function mountFiles ({ path = 'gcodes', ready = true, confirm = true, folder = [] }: Setup = {}) {
  const dispatch = vi.fn()
  const $confirm = vi.fn(async () => confirm)
  const rootProperties = { readonly: false, accepts: ['.gcode'], canView: ['.png'], canConfigure: true, filterTypes: [] }
  const wrapper = shallowMount(FileSystem, {
    propsData: { roots: ['gcodes', 'config'], name: 'test', bulkActions: true },
    mocks: {
      $store: {
        state: { files: { uploads: [] }, config: { uiSettings: { editor: { autoEditExtensions: ['.cfg'] }, general: {}, fileSystem: { activeFilters: {} }, spoolman: {} } } },
        getters: {
          'files/getRootProperties': () => rootProperties,
          'files/isRootAvailable': () => true,
          'files/getCurrentPathByRoot': () => path,
          'files/getDirectory': () => folder,
          'config/getMergedTableHeaders': (h: unknown) => h,
          'spoolman/getAvailable': false,
          'server/componentSupport': () => true
        },
        dispatch,
        commit: vi.fn()
      },
      $t: (k: string) => k,
      $tc: (k: string, n: number) => `${k}:${n}`,
      $waits: { onFileSystem: 'onFileSystem' },
      $confirm,
      $filters: filters,
      $route: { meta: {}, path: '/x' },
      $router: { currentRoute: { name: 'Jobs', path: '/x' }, push: vi.fn() }
    },
    computed: {
      controlReady: () => ready,
      klippyReady: () => ready,
      printerPrinting: () => false,
      printerPaused: () => false,
      busy: () => false,
      hasWaitsBy: () => () => false,
      printerName: () => 'M1',
      panelTarget: () => 'a|p'
    },
    stubs: ['file-system-toolbar', 'file-system-bulk-actions', 'file-system-browser', 'file-system-context-menu',
      'file-editor-dialog', 'file-name-dialog', 'app-drag-overlay', 'file-system-upload-dialog', 'file-preview-dialog',
      'file-system-go-to-file-dialog', 'v-card']
  })
  Object.defineProperty(wrapper.vm, '$route', { value: { meta: {}, path: '/m1' }, configurable: true })
  return { wrapper, vm: wrapper.vm as any, dispatch, $confirm }
}

describe('file manager: folders', () => {
  beforeEach(() => { vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any) })
  afterEach(() => vi.restoreAllMocks())

  it('opens a folder when its row is clicked, and forgets the selection', () => {
    const { vm, dispatch } = mountFiles({ folder: [dir('parts')] })
    vm.selected = [file('a.gcode')]
    vm.handleRowClick(dir('parts'), { type: 'click' })
    expect(dispatch).toHaveBeenCalledWith('files/updateCurrentPathByRoot', { root: 'gcodes', path: 'gcodes/parts' })
    expect(vm.selected).toEqual([])
  })

  it('goes up from the .. row', () => {
    const { vm, dispatch } = mountFiles({ path: 'gcodes/parts/small', folder: [up] })
    vm.handleRowClick(up, { type: 'click' })
    expect(dispatch).toHaveBeenCalledWith('files/updateCurrentPathByRoot', { root: 'gcodes', path: 'gcodes/parts' })
  })

  it('shows the breadcrumbs for the folder it is in, and a crumb opens that folder', () => {
    const { vm, dispatch } = mountFiles({ path: 'gcodes/parts/small' })
    expect(vm.crumbs.map((c: any) => c.label)).toEqual(['gcodes', 'parts', 'small'])
    vm.handleCrumb({ label: 'parts', path: 'parts' })
    expect(dispatch).toHaveBeenCalledWith('files/updateCurrentPathByRoot', { root: 'gcodes', path: 'gcodes/parts' })
    vm.handleCrumb({ label: 'gcodes', path: '' })
    expect(dispatch).toHaveBeenCalledWith('files/updateCurrentPathByRoot', { root: 'gcodes', path: 'gcodes' })
  })

  it('moves a dragged file into a folder', () => {
    const { vm } = mountFiles({ path: 'gcodes' })
    const move = vi.spyOn(SocketActions, 'serverFilesMove').mockImplementation(vi.fn() as any)
    vm.handleMove([file('a.gcode')], dir('parts'))
    expect(move).toHaveBeenCalledWith('gcodes/a.gcode', 'gcodes/parts/a.gcode')
  })
})

describe('file manager: bulk delete', () => {
  afterEach(() => vi.restoreAllMocks())

  it('asks once for the whole selection, counting the files and not the .. row', async () => {
    const { vm, $confirm } = mountFiles()
    vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    await vm.handleRemove([up, file('a.gcode'), file('b.gcode')])
    expect($confirm).toHaveBeenCalledTimes(1)
    expect($confirm.mock.calls[0][0]).toBe('app.general.simple_form.msg.confirm_delete:2')
  })

  it('deletes nothing when the answer is no', async () => {
    const { vm } = mountFiles({ confirm: false })
    const del = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const delDir = vi.spyOn(SocketActions, 'serverFilesDeleteDirectory').mockImplementation(vi.fn() as any)
    await vm.handleRemove([file('a.gcode'), dir('parts')])
    expect(del).not.toHaveBeenCalled()
    expect(delDir).not.toHaveBeenCalled()
  })

  it('deletes each file, and each folder with what is in it, when confirmed', async () => {
    const { vm } = mountFiles()
    const del = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const delDir = vi.spyOn(SocketActions, 'serverFilesDeleteDirectory').mockImplementation(vi.fn() as any)
    await vm.handleRemove([up, file('a.gcode'), dir('parts')])
    expect(del).toHaveBeenCalledWith('gcodes/a.gcode')
    expect(delDir).toHaveBeenCalledWith('gcodes/parts', true)
    expect(del).toHaveBeenCalledTimes(1)
  })
})

describe('file manager: upload', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uploads into the folder it is in and shows it is busy meanwhile', async () => {
    const { vm, dispatch } = mountFiles({ path: 'gcodes/parts' })
    const upload = vi.spyOn(vm, 'uploadFiles').mockResolvedValue(true)
    const files = [new File(['x'], 'a.gcode')]
    await vm.handleUpload(files, false)
    expect(upload).toHaveBeenCalledWith(files, 'parts', 'gcodes', false)
    expect(dispatch).toHaveBeenCalledWith('wait/addWait', 'onFileSystem/gcodes/parts/')
    expect(dispatch).toHaveBeenLastCalledWith('wait/removeWait', 'onFileSystem/gcodes/parts/')
  })

  it('cancels an upload that has not started by marking it, and one that has by aborting it', () => {
    const { vm, dispatch } = mountFiles()
    vm.handleCancelUpload({ filepath: 'a.gcode', loaded: 0, size: 10, complete: false })
    expect(dispatch).toHaveBeenCalledWith('files/updateFileUpload', { filepath: 'a.gcode', cancelled: true })
    const abort = vi.fn()
    vm.handleCancelUpload({ filepath: 'b.gcode', loaded: 5, size: 10, complete: false, abortController: { abort } })
    expect(abort).toHaveBeenCalled()
  })
})

describe('file manager: context menu actions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens the menu for the row that was right-clicked, or for the whole selection', async () => {
    const { vm } = mountFiles()
    const a = file('a.gcode')
    const b = file('b.gcode')
    vm.handleRowClick(a, { type: 'contextmenu', clientX: 10, clientY: 20 })
    await vm.$nextTick()
    expect(vm.contextMenuState).toMatchObject({ open: true, x: 10, y: 20, file: a })
    vm.contextMenuState.open = false
    vm.selected = [a, b]
    vm.handleRowClick(a, { type: 'contextmenu', clientX: 1, clientY: 2 })
    await vm.$nextTick()
    expect(vm.contextMenuState.file).toEqual([a, b])
  })

  it('preheats to the first layer temperatures in the file', () => {
    const { vm } = mountFiles()
    const send = vi.spyOn(vm, 'sendGcode').mockImplementation(() => undefined)
    vm.handlePreheat(file('a.gcode', { first_layer_extr_temp: 215, first_layer_bed_temp: 60 }))
    expect(send).toHaveBeenCalledWith('M104 S215')
    expect(send).toHaveBeenCalledWith('M140 S60')
  })

  it('renames and duplicates through the name dialog, as moves and copies', () => {
    const { vm } = mountFiles({ path: 'gcodes/parts' })
    const move = vi.spyOn(SocketActions, 'serverFilesMove').mockImplementation(vi.fn() as any)
    const copy = vi.spyOn(SocketActions, 'serverFilesCopy').mockImplementation(vi.fn() as any)
    vm.handleRenameDialog(file('a.gcode'))
    vm.fileNameDialogState.handler('b.gcode')
    expect(move).toHaveBeenCalledWith('gcodes/parts/a.gcode', 'gcodes/parts/b.gcode')
    vm.handleDuplicateDialog(file('a.gcode'))
    vm.fileNameDialogState.handler('c.gcode')
    expect(copy).toHaveBeenCalledWith('gcodes/parts/a.gcode', 'gcodes/parts/c.gcode')
  })

  it('puts files in the queue, skipping folders and files the printer cannot print', () => {
    const { vm } = mountFiles()
    const queue = vi.spyOn(SocketActions, 'serverJobQueuePostJob').mockImplementation(vi.fn() as any)
    vm.handleEnqueue([file('a.gcode', { path: 'gcodes/x' }), dir('parts'), file('notes.txt')])
    expect(queue).toHaveBeenCalledWith(['gcodes/x/a.gcode'])
  })

  it('print asks first, as Jobs does, and starts only on yes', async () => {
    const yes = mountFiles()
    const start = vi.spyOn(SocketActions, 'printerPrintStart').mockImplementation(vi.fn() as any)
    await yes.vm.handlePrint(file('a.gcode', { path: 'parts' }))
    expect(yes.$confirm).toHaveBeenCalledTimes(1)
    expect(start).toHaveBeenCalledWith('parts/a.gcode')
    start.mockClear()
    const no = mountFiles({ confirm: false })
    await no.vm.handlePrint(file('a.gcode'))
    expect(start).not.toHaveBeenCalled()
  })

  it('does not print when Control is not ready', async () => {
    const { vm, $confirm } = mountFiles({ ready: false })
    const start = vi.spyOn(SocketActions, 'printerPrintStart').mockImplementation(vi.fn() as any)
    await vm.handlePrint(file('a.gcode'))
    expect($confirm).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })
})

describe('file manager: sorting', () => {
  const sort = (rows: any[], by: string, desc: boolean) => filters.fileSystemSort([...rows], [by], [desc], 'en', 'default')

  it('keeps the .. row and folders first, whatever the column', () => {
    const rows = [file('b.gcode', { size: 5 }), dir('zeta'), file('a.gcode', { size: 50 }), up]
    expect(sort(rows, 'size', true).map(r => r.name)).toEqual(['..', 'zeta', 'a.gcode', 'b.gcode'])
    expect(sort(rows, 'size', false).map(r => r.name)).toEqual(['..', 'zeta', 'b.gcode', 'a.gcode'])
  })

  it('sorts by print time and by filament from the metadata in the file', () => {
    const rows = [file('a.gcode', { estimated_time: 100, filament_total: 9 }), file('b.gcode', { estimated_time: 300, filament_total: 2 })]
    expect(sort(rows, 'estimated_time', true).map(r => r.name)).toEqual(['b.gcode', 'a.gcode'])
    expect(sort(rows, 'filament_total', false).map(r => r.name)).toEqual(['b.gcode', 'a.gcode'])
  })

  it('remembers the sort for each root, and starts with the newest first', () => {
    const dispatch = vi.fn()
    const state = { config: { uiSettings: { general: {}, fileSystem: { sortBy: { gcodes: 'size' }, sortDesc: {} } } } }
    const ctx: any = { $store: { state, dispatch }, root: 'gcodes' }
    const get = (k: string) => (FileSystemBrowser as any).options.computed[k]
    expect(get('sortBy').get.call(ctx)).toBe('size')
    expect(get('sortDesc').get.call(ctx)).toBe(true)
    get('sortBy').set.call(ctx, 'name')
    expect(dispatch).toHaveBeenCalledWith('config/updateFileSystemSortBy', { root: 'gcodes', value: 'name' })
  })
})
