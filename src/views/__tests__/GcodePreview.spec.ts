import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GcodePreviewPage from '../GcodePreview.vue'
import { previewPage } from '@/services/gcode-preview/page-state'

const file = { type: 'file', filename: 'M1_bracket_PLA_0.2mm.gcode', path: '', size: 1_800_000, modified: 1 }
const layers = Array.from({ length: 187 }, (_, i) => ({ move: i * 10, z: (i + 1) * 0.2 }))

function mountPreview (opts: { loaded?: boolean, mobile?: boolean, connected?: boolean, options?: Record<string, boolean> } = {}) {
  const options: Record<string, boolean> = { showMoves: false, showRetractions: true, showPreviousLayer: false, showNextLayer: false, followProgress: false, ...opts.options }
  const commit = vi.fn((_: string, change: Record<string, boolean>) => Object.assign(options, change))
  const loaded = opts.loaded !== false
  const wrapper = shallowMount(GcodePreviewPage, {
    mocks: {
      $store: {
        state: { gcodePreview: { parserWorker: null }, printer: { printer: {} }, config: { uiSettings: { gcodePreview: {} } } },
        getters: {
          'gcodePreview/getFile': loaded ? file : undefined,
          'gcodePreview/getLayers': loaded ? layers : [],
          'gcodePreview/getMoves': loaded ? new Array(1870) : [],
          'gcodePreview/getParserProgress': 0,
          'gcodePreview/getViewerOption': (key: string) => options[key],
          'gcodePreview/getLayerNrByFilePosition': () => 0,
          'files/getDirectory': () => []
        },
        commit,
        dispatch: vi.fn()
      },
      $confirm: vi.fn(async () => true)
    },
    computed: {
      socketConnected: () => opts.connected !== false,
      isMobileViewport: () => !!opts.mobile,
      busy: () => false,
      printerName: () => 'Boxwood',
      jobFiles: () => []
    },
    stubs: ['frame-icon', 'gcode-preview', 'range-slider', 'toggle-switch', 'viewer-toggles', 'preview-open-menu', 'v-menu', 'v-progress-circular']
  })
  return { wrapper, commit }
}

describe('G-code preview, canvas first', () => {
  afterEach(() => { previewPage.requested = null })

  it('loads the layer viewer only when the page opens', () => {
    const registered = (GcodePreviewPage as unknown as { options: { components: Record<string, unknown> } }).options.components.GcodePreview
    expect(typeof registered).toBe('function')
  })

  it('draws the file on the canvas, its layer above and the layer slider under it', async () => {
    const { wrapper } = mountPreview()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-tid="preview-layer-pill"]').text()).toMatch(/^Layer 47 of 187 · Z 9\.40 mm$/)
    const canvas = wrapper.get('[data-tid="preview-canvas"]')
    expect(canvas.find('[data-tid="preview-layer"]').exists()).toBe(true)
    expect(canvas.text()).toContain('Drag to look through the layers')
  })

  it('groups what\'s drawn in the Show tile, with its legend', () => {
    const { wrapper } = mountPreview()
    const show = wrapper.get('[data-tid="preview-show"]')
    for (const label of ['Travel moves', 'Retractions', 'Follow the nozzle', 'Only current layer']) expect(show.text()).toContain(label)
    expect(show.get('[data-tid="preview-legend"]').text()).toContain('Retractions')
    expect(show.get('[data-tid="preview-legend"]').text()).not.toContain('Travel moves')
  })

  it('shows only the current layer, and turning it off brings back the layers as they were', () => {
    for (const before of [
      { showPreviousLayer: true, showNextLayer: false },
      { showPreviousLayer: false, showNextLayer: true },
      { showPreviousLayer: true, showNextLayer: true }
    ]) {
      const { wrapper, commit } = mountPreview({ options: before })
      const vm = wrapper.vm as unknown as { onlyCurrentLayer: boolean }
      expect(vm.onlyCurrentLayer).toBe(false)
      vm.onlyCurrentLayer = true
      expect(commit).toHaveBeenLastCalledWith('gcodePreview/setViewerState', { showPreviousLayer: false, showNextLayer: false })
      vm.onlyCurrentLayer = false
      expect(commit).toHaveBeenLastCalledWith('gcodePreview/setViewerState', before)
    }
  })

  it('turned off from the start (both layers were already off), it shows the layer below and above', () => {
    const { wrapper, commit } = mountPreview()
    const vm = wrapper.vm as unknown as { onlyCurrentLayer: boolean }
    expect(vm.onlyCurrentLayer).toBe(true)
    vm.onlyCurrentLayer = false
    expect(commit).toHaveBeenLastCalledWith('gcodePreview/setViewerState', { showPreviousLayer: true, showNextLayer: true })
  })

  it('stacks the canvas above the controls on a phone', () => {
    expect(mountPreview().wrapper.classes()).not.toContain('prev--phone')
    expect(mountPreview({ mobile: true }).wrapper.classes()).toContain('prev--phone')
  })

  it('says nothing is loaded, with one way to open a file', () => {
    const { wrapper } = mountPreview({ loaded: false })
    expect(wrapper.get('[data-tid="preview-empty"]').text()).toContain('Nothing loaded')
  })

  it('says why a file did not open, with Retry', async () => {
    const { wrapper } = mountPreview({ loaded: false })
    const getGcode = vi.fn().mockRejectedValue(new Error('404'))
    ;(wrapper.vm as unknown as { getGcode: unknown }).getGcode = getGcode
    await (wrapper.vm as unknown as { load: (f: unknown) => Promise<void> }).load(file)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-tid="preview-error"]').text()).toContain("Boxwood didn't send M1_bracket_PLA_0.2mm.gcode")
    await wrapper.get('[data-tid="preview-retry"]').trigger('click')
    expect(getGcode).toHaveBeenCalledTimes(2)
  })

  it('offline, keeps the loaded file to look through and says so', () => {
    const { wrapper } = mountPreview({ connected: false })
    expect(wrapper.get('[data-tid="preview-offline"]').text()).toContain('Boxwood is offline. This file stays here')
    expect(wrapper.get('[data-tid="preview-reload"]').attributes('disabled')).toBeDefined()
  })

  it('loads a file the header\'s Open another picked', async () => {
    const { wrapper } = mountPreview({ loaded: false })
    const getGcode = vi.fn().mockResolvedValue({ data: 'G1 X1' })
    ;(wrapper.vm as unknown as { getGcode: unknown }).getGcode = getGcode
    previewPage.requested = file as never
    ;(wrapper.vm as unknown as { onRequested: (f: unknown) => void }).onRequested(previewPage.requested)
    expect(getGcode.mock.calls[0][0].filename).toBe(file.filename)
    expect(previewPage.requested).toBeNull()
  })
})
