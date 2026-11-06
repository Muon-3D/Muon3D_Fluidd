import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Jobs from '../Jobs.vue'
import { SocketActions } from '@/api/socketActions'
import { jobsPage } from '@/services/jobs/page-state'

const NOW = Math.floor(Date.now() / 1000)
const file = (filename: string, over: Record<string, unknown> = {}) => ({
  type: 'file', filename, path: '', modified: NOW - 100, size: 612000, estimated_time: 2280, filament_type: 'PLA', filament_weight_total: 11.4, layer_height: 0.2, object_height: 5, history: {}, ...over
})
const folder = { type: 'directory', name: 'parts', dirname: 'parts', modified: 1, size: 0 }

function mountJobs (opts: { mobile?: boolean, busy?: boolean, ready?: boolean, entries?: any[], printing?: string } = {}) {
  const ready = () => opts.ready !== false
  const entries = opts.entries ?? [
    folder,
    file('M1_bracket_PLA_0.2mm.gcode', { modified: NOW - 10 }),
    file('cable_clip_x6_PLA_0.2mm.gcode', { modified: NOW - 50, history: { job_id: 'h', start_time: NOW - 90000 } }),
    file('benchy_PLA_0.2mm.gcode', { modified: NOW - 300, estimated_time: 5400 })
  ]
  return shallowMount(Jobs, {
    mocks: {
      $store: {
        state: { files: { pathFiles: {} }, config: { apiUrl: '', uiSettings: { general: {} } }, socket: {}, printer: { printer: {} } },
        getters: {
          'files/getDirectory': (p: string) => (p === 'gcodes' ? entries : undefined),
          'files/getCurrentPathByRoot': () => '',
          'files/getUsage': { free: 1.8e9 },
          'files/getRootProperties': () => ({}),
          'server/componentSupport': () => true
        },
        dispatch: vi.fn()
      },
      $confirm: vi.fn(async () => true),
      $route: { path: '/p/jobs', params: {} },
      $router: { push: vi.fn(async () => undefined) },
      $vuetify: { breakpoint: { mobile: !!opts.mobile } }
    },
    computed: {
      queue: () => [],
      busy: () => !!opts.busy,
      jobFile: () => opts.printing ?? '',
      printerName: () => 'Boxwood',
      isMobileViewport: () => !!opts.mobile,
      commandTarget: () => 'a|p',
      commandControlAvailable: ready,
      controlReady: ready,
      progress: () => 44,
      leftText: () => '1 h 12 m left',
      startedAt: () => '19:33',
      printerPaused: () => false,
      material: () => ({ name: 'PLA' })
    },
    stubs: ['frame-icon', 'job-menu', 'tone-pill', 'file-name-dialog', 'v-dialog']
  })
}

describe('Jobs, one list', () => {
  beforeEach(() => {
    vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any)
    jobsPage.query = ''
    jobsPage.sort = 'newest'
    jobsPage.filter = 'all'
    jobsPage.reverse = false
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('lists folders first, the printing file pinned on top, then the files newest first', () => {
    const w = mountJobs({ busy: true, printing: 'cable_clip_x6_PLA_0.2mm.gcode' })
    const names = (w.vm as any).rows.map((r: any) => r.name)
    expect(names).toEqual(['cable_clip_x6_PLA_0.2mm.gcode', 'parts', 'M1_bracket_PLA_0.2mm.gcode', 'benchy_PLA_0.2mm.gcode'])
    expect(w.find('.jobs__row--now').exists()).toBe(true)
  })

  it('has one list and no view modes', () => {
    const w = mountJobs()
    expect(w.find('[data-tid="jobs-list"]').exists()).toBe(true)
    expect(w.find('[data-tid="jobs-table"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Pictures')
  })

  it('follows the header: the search narrows the list and the order changes it', async () => {
    const w = mountJobs()
    jobsPage.query = 'benchy'
    await w.vm.$nextTick()
    expect((w.vm as any).rows.map((r: any) => r.name)).toEqual(['benchy_PLA_0.2mm.gcode'])
    jobsPage.query = ''
    jobsPage.sort = 'longest'
    await w.vm.$nextTick()
    expect((w.vm as any).rows.filter((r: any) => r.kind === 'file')[0].name).toBe('benchy_PLA_0.2mm.gcode')
  })

  it('tells the header how many files there are and how much room is left', () => {
    mountJobs()
    expect(jobsPage.files).toBe(3)
    expect(jobsPage.free).toBe('1.8 GB free')
    expect(jobsPage.printerName).toBe('Boxwood')
  })

  it('picks a file for the tile on a desktop, and a phone waits for a tap', async () => {
    const desktop = mountJobs()
    ;(desktop.vm as any).keepSelection((desktop.vm as any).rows)
    expect((desktop.vm as any).selectedRow.name).toBe('M1_bracket_PLA_0.2mm.gcode')
    const phone = mountJobs({ mobile: true })
    expect((phone.vm as any).selectedRow).toBeUndefined()
    expect(phone.find('[data-tid="jobs-sticky"]').exists()).toBe(false)
    ;(phone.vm as any).pick((phone.vm as any).rows[1])
    await phone.vm.$nextTick()
    expect(phone.find('[data-tid="jobs-sticky"]').exists()).toBe(true)
    ;(phone.vm as any).pick((phone.vm as any).rows[1])
    await phone.vm.$nextTick()
    expect(phone.find('[data-tid="jobs-sticky"]').exists()).toBe(false)
  })

  it('shows the picked file facts', async () => {
    const w = mountJobs()
    ;(w.vm as any).selectedKey = 'cable_clip_x6_PLA_0.2mm.gcode'
    await w.vm.$nextTick()
    const stats = (w.vm as any).stats
    expect(stats.map((s: any) => s.value)).toEqual(['38 m', 'PLA', '11.4 g', '25'])
    expect(w.find('[data-tid="jobs-print"]').text()).toBe('Print')
  })

  it('asks the printer to print through the confirm, not at once', async () => {
    const start = vi.spyOn(SocketActions, 'printerPrintStart').mockImplementation(vi.fn() as any)
    const w = mountJobs()
    ;(w.vm as any).selectedKey = 'cable_clip_x6_PLA_0.2mm.gcode'
    // Once printing starts, the mixin goes home: the mocked route has nowhere to go, which is not what is tested.
    await (w.vm as any).printRow((w.vm as any).selectedRow).catch(() => undefined)
    expect((w.vm as any).$confirm).toHaveBeenCalled()
    expect(start).toHaveBeenCalledWith('cable_clip_x6_PLA_0.2mm.gcode')
  })

  it('does nothing when the printer takes no commands', async () => {
    const start = vi.spyOn(SocketActions, 'printerPrintStart').mockImplementation(vi.fn() as any)
    const w = mountJobs({ ready: false })
    ;(w.vm as any).selectedKey = 'benchy_PLA_0.2mm.gcode'
    expect((w.vm as any).canStart((w.vm as any).selectedRow)).toBe(false)
    await (w.vm as any).printRow((w.vm as any).selectedRow)
    expect(start).not.toHaveBeenCalled()
    expect(w.find('[data-tid="jobs-readonly"]').exists()).toBe(true)
  })

  it('offers Add to queue while the printer is busy, and never reprints the file that is printing', () => {
    const w = mountJobs({ busy: true, printing: 'benchy_PLA_0.2mm.gcode' })
    const rows = (w.vm as any).rows
    expect((w.vm as any).printLabel(rows[1])).toBe('Add to queue')
    expect((w.vm as any).printLabel(rows[0])).toBe('Printing now')
    expect((w.vm as any).canStart(rows[0])).toBe(false)
  })

  it('shows an empty state with Upload when there is no G-code', () => {
    const empty = mountJobs({ entries: [] })
    expect(empty.find('[data-tid="jobs-empty"]').text()).toContain('No G-code on the printer yet')
    expect(empty.find('[data-tid="jobs-empty-upload"]').exists()).toBe(true)
  })

  it('opens the file picker when the header asks for an upload', async () => {
    const w = mountJobs()
    const click = vi.fn()
    ;(w.vm.$refs.upload as HTMLInputElement).click = click
    jobsPage.uploadTick++
    await w.vm.$nextTick()
    expect(click).toHaveBeenCalled()
  })

  it('deletes only after the confirm, and never the file that is printing', async () => {
    const del = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const w = mountJobs({ busy: true, printing: 'benchy_PLA_0.2mm.gcode' })
    const rows = (w.vm as any).rows
    await (w.vm as any).removeRow(rows[0])
    expect(del).not.toHaveBeenCalled()
    await (w.vm as any).removeRow(rows[2])
    expect((w.vm as any).$confirm).toHaveBeenCalled()
    expect(del).toHaveBeenCalledWith('gcodes/M1_bracket_PLA_0.2mm.gcode')
  })

  it('takes keys only when the list itself has them, not a row menu button', async () => {
    const del = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const w = mountJobs()
    ;(w.vm as any).selectedKey = 'cable_clip_x6_PLA_0.2mm.gcode'
    const button = document.createElement('button')
    const key = (k: string, target: any) => ({ key: k, target, preventDefault: vi.fn() })
    ;(w.vm as any).onKey(key('Delete', button))
    ;(w.vm as any).onKey(key('ArrowDown', button))
    await w.vm.$nextTick()
    expect((w.vm as any).$confirm).not.toHaveBeenCalled()
    expect((w.vm as any).selectedKey).toBe('cable_clip_x6_PLA_0.2mm.gcode')
    ;(w.vm as any).onKey(key('Delete', (w.vm as any).$refs.rows))
    await new Promise(resolve => setTimeout(resolve))
    expect((w.vm as any).$confirm).toHaveBeenCalled()
    expect(del).toHaveBeenCalled()
  })

  it('Delete on the printing file does nothing', async () => {
    const del = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const w = mountJobs({ busy: true, printing: 'benchy_PLA_0.2mm.gcode' })
    ;(w.vm as any).selectedKey = 'benchy_PLA_0.2mm.gcode'
    ;(w.vm as any).onKey({ key: 'Delete', target: (w.vm as any).$refs.rows, preventDefault: vi.fn() })
    await new Promise(resolve => setTimeout(resolve))
    expect((w.vm as any).$confirm).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })

  it('checks again at submit: a rename or move of the file that started printing is refused', () => {
    const move = vi.spyOn(SocketActions, 'serverFilesMove').mockImplementation(vi.fn() as any)
    const w = mountJobs({ busy: true, printing: 'benchy_PLA_0.2mm.gcode' })
    const benchy = (w.vm as any).rows.find((r: any) => r.name === 'benchy_PLA_0.2mm.gcode')
    // The dialogs were opened from a snapshot that did not know it was printing.
    ;(w.vm as any).renameRow = { ...benchy, held: false, printing: false }
    ;(w.vm as any).rename('x.gcode')
    ;(w.vm as any).moveRows = [{ ...benchy, held: false, printing: false }]
    ;(w.vm as any).moveInto('parts')
    expect(move).not.toHaveBeenCalled()
  })

  it('holds a folder that has the printing file in it', async () => {
    const del = vi.spyOn(SocketActions, 'serverFilesDeleteDirectory').mockImplementation(vi.fn() as any)
    const w = mountJobs({ busy: true, printing: 'parts/a.gcode' })
    const parts = (w.vm as any).rows.find((r: any) => r.name === 'parts')
    expect(parts.held).toBe(true)
    await (w.vm as any).removeRow(parts)
    expect(del).not.toHaveBeenCalled()
  })

  it('says Printed before when a print is on record without a time, and Never when there is none', () => {
    const w = mountJobs({ entries: [file('a.gcode', { history: { job_id: 'x' } }), file('b.gcode')] })
    const rows = (w.vm as any).rows
    expect(rows.find((r: any) => r.name === 'a.gcode').printed).toBe(true)
    expect(w.text()).toContain('Printed before')
    expect(w.text()).toContain('Never')
  })

  it('filters to Never printed or Printed before, keeping folders', async () => {
    const w = mountJobs()
    jobsPage.filter = 'never'
    await w.vm.$nextTick()
    expect((w.vm as any).rows.map((r: any) => r.name)).toEqual(['parts', 'M1_bracket_PLA_0.2mm.gcode', 'benchy_PLA_0.2mm.gcode'])
    jobsPage.filter = 'before'
    await w.vm.$nextTick()
    expect((w.vm as any).rows.map((r: any) => r.name)).toEqual(['parts', 'cable_clip_x6_PLA_0.2mm.gcode'])
  })

  it('selects many: checkboxes, select all, a range, and Escape lets go', async () => {
    const w = mountJobs()
    jobsPage.selectTick++
    await w.vm.$nextTick()
    expect(w.find('[data-tid="jobs-selection"]').exists()).toBe(true)
    const rows = (w.vm as any).rows
    ;(w.vm as any).onCheck(rows[1], { shiftKey: false })
    ;(w.vm as any).onCheck(rows[3], { shiftKey: true })
    expect((w.vm as any).selection).toEqual([rows[1].key, rows[2].key, rows[3].key])
    ;(w.vm as any).toggleAll()
    expect((w.vm as any).selection).toHaveLength(rows.length)
    ;(w.vm as any).onKey({ key: 'Escape', target: (w.vm as any).$refs.rows, preventDefault: vi.fn() })
    expect((w.vm as any).selection).toEqual([])
    expect((w.vm as any).selecting).toBe(true)
  })

  it('bulk Delete asks once, and leaves the printing file out', async () => {
    const deleteFile = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const deleteDirectory = vi.spyOn(SocketActions, 'serverFilesDeleteDirectory').mockImplementation(vi.fn() as any)
    const w = mountJobs({ busy: true, printing: 'benchy_PLA_0.2mm.gcode' })
    jobsPage.selectTick++
    ;(w.vm as any).selection = (w.vm as any).rows.map((r: any) => r.key)
    await (w.vm as any).deleteSelected()
    expect((w.vm as any).$confirm).toHaveBeenCalledTimes(1)
    expect(deleteFile.mock.calls.map(c => c[0]).sort()).toEqual(['gcodes/M1_bracket_PLA_0.2mm.gcode', 'gcodes/cable_clip_x6_PLA_0.2mm.gcode'])
    expect(deleteDirectory).toHaveBeenCalledWith('gcodes/parts', true)
    expect((w.vm as any).selecting).toBe(false)
  })

  it('bulk Queue sends the files that are not printing', async () => {
    const post = vi.spyOn(SocketActions, 'serverJobQueuePostJob').mockImplementation(vi.fn() as any)
    const w = mountJobs({ busy: true, printing: 'benchy_PLA_0.2mm.gcode' })
    jobsPage.selectTick++
    ;(w.vm as any).selection = ['benchy_PLA_0.2mm.gcode', 'cable_clip_x6_PLA_0.2mm.gcode']
    await (w.vm as any).queueSelected()
    expect(post).toHaveBeenCalledWith(['cable_clip_x6_PLA_0.2mm.gcode'])
  })

  it('a long press on a phone starts selecting, and the click that follows does not undo it', () => {
    vi.useFakeTimers()
    const w = mountJobs({ mobile: true })
    const row = (w.vm as any).rows[1]
    ;(w.vm as any).pressStart(row)
    vi.advanceTimersByTime(600)
    ;(w.vm as any).onRowClick(row, {})
    expect((w.vm as any).selecting).toBe(true)
    expect((w.vm as any).selection).toEqual([row.key])
    vi.useRealTimers()
  })

  it('shows folders as breadcrumbs that jump to any ancestor', () => {
    const w = mountJobs()
    ;(w.vm as any).path = 'a/b'
    expect((w.vm as any).crumbs).toEqual([{ name: 'a', path: 'a' }, { name: 'b', path: 'a/b' }])
    ;(w.vm as any).openFolder('a')
    expect((w.vm as any).path).toBe('a')
  })

  it('opens a folder on Enter or a double-click', () => {
    const w = mountJobs()
    ;(w.vm as any).openRow((w.vm as any).rows[0])
    expect((w.vm as any).path).toBe('parts')
  })
})
