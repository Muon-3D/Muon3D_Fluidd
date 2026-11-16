import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JobTile from '../tiles/JobTile.vue'
import { resetSocket, socket, tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const extra = { 'first-layer-nudges': true }
const mountJob = (store: ReturnType<typeof tileStore>) => mount(JobTile, tileMount(store, { stubs: { ...tileMount(store).stubs, ...extra } }))
afterEach(() => resetSocket())

describe('JobTile', () => {
  it('renders with no data: nothing printing, and a way to the jobs', () => {
    const store = tileStore({ empty: true })
    const w = mountJob(store)
    expect(w.text()).toContain('Print job')
    expect(w.text()).toContain('Nothing is printing')
    expect(w.find('[data-tid="job-pause"]').exists()).toBe(false)
    w.destroy()
  })

  it('shows the live job: name, progress, layer, and the three times', () => {
    const store = tileStore({ printing: true })
    const w = mountJob(store)
    const text = w.text()
    expect(text).toContain('M1_bracket_PLA')
    expect(text).toContain('45%')
    expect(text).toContain('Layer 27 of 63')
    expect(text).toContain('Elapsed')
    expect(text).toContain('40 min')
    expect(text).toContain('Remaining')
    expect(text).toContain('Done at')
    expect(w.find('[data-tid="tile-state"]').text()).toBe('Printing')
    w.destroy()
  })

  it('pauses, resumes, and stops only after the confirm', async () => {
    const store = tileStore({ printing: true })
    const w = mountJob(store)
    await w.find('[data-tid="job-pause"]').trigger('click')
    expect(socket.printerPrintPause).toHaveBeenCalledTimes(1)
    Vue.set(store.getters, 'printer/getPrinterState', 'paused')
    await w.vm.$nextTick()
    expect(w.find('[data-tid="job-pause"]').text()).toContain('Resume')
    await w.find('[data-tid="job-pause"]').trigger('click')
    expect(socket.printerPrintResume).toHaveBeenCalledTimes(1)
    const confirm = (w.vm as any).$confirm as ReturnType<typeof vi.fn>
    await w.find('[data-tid="job-stop"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(confirm.mock.calls[0][1]).toMatchObject({ title: 'Stop this print?', danger: true })
    expect(socket.printerPrintCancel).toHaveBeenCalledTimes(1)
    w.destroy()
  })

  it('shows a pause icon on Pause and a play icon on Resume, never a dash', async () => {
    const store = tileStore({ printing: true })
    const w = mountJob(store)
    const html = () => w.find('[data-tid="job-pause"]').html()
    expect(html()).toContain('$pause')
    expect(html()).not.toContain('minus')
    Vue.set(store.getters, 'printer/getPrinterState', 'paused')
    await w.vm.$nextTick()
    expect(html()).toContain('$resume')
    w.destroy()
  })

  it('logs CANCEL_PRINT in the console when it stops, as every other stop does', async () => {
    const store = tileStore({ printing: true })
    const w = mountJob(store)
    const log = vi.spyOn(w.vm as any, 'addConsoleEntry').mockImplementation(() => {})
    await w.find('[data-tid="job-stop"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(socket.printerPrintCancel).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith('CANCEL_PRINT')
    w.destroy()
  })

  it('does not stop when the confirm is refused', async () => {
    const store = tileStore({ printing: true })
    const w = mountJob(store)
    ;((w.vm as any).$confirm as ReturnType<typeof vi.fn>).mockResolvedValue(false)
    await w.find('[data-tid="job-stop"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(socket.printerPrintCancel).not.toHaveBeenCalled()
    w.destroy()
  })

  it('locks pause and stop when the printer is not ready', async () => {
    const store = tileStore({ printing: true })
    Vue.set(store.getters, 'printer/getKlippyReady', false)
    const w = mountJob(store)
    expect(w.find('[data-tid="job-pause"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-tid="job-stop"]').attributes('disabled')).toBeDefined()
    await w.find('[data-tid="job-pause"]').trigger('click')
    expect(socket.printerPrintPause).not.toHaveBeenCalled()
    w.destroy()
  })

  it('keeps the Pro depth in the three dots: live numbers, the queue, history', async () => {
    const store = tileStore({ printing: true })
    Vue.set(store.state.printer.printer, 'exclude_object', { objects: [{ name: 'A' }, { name: 'B' }], excluded_objects: [] })
    const w = mountJob(store)
    await w.find('[data-tid="tile-more"]').trigger('click')
    const ids = w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))
    expect(ids).toEqual(expect.arrayContaining(['live', 'objects', 'queue', 'history']))
    await w.find('[data-menu="objects"]').trigger('click')
    expect(w.text()).toContain('Objects on the plate')
    w.destroy()
  })
})
