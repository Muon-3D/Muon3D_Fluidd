import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Timelapse from '../Timelapse.vue'
import { SocketActions } from '@/api/socketActions'

const files = [
  { type: 'file', filename: 'timelapse_M1_bracket_PLA_0.2mm_20261104_0912.mp4', size: 84_000_000, modified: 1 },
  { type: 'file', filename: 'timelapse_M1_bracket_PLA_0.2mm_20261104_0912.jpg', size: 200_000, modified: 1 },
  { type: 'file', filename: 'timelapse_cable_clip_x6_PLA_0.2mm_20261103_1720.mp4', size: 46_000_000, modified: 2 }
]

function mountTimelapse (opts: { entries?: unknown[] | null, supported?: boolean, connected?: boolean, mobile?: boolean, render?: unknown, frames?: number } = {}) {
  const entries = opts.entries === undefined ? files : opts.entries
  return shallowMount(Timelapse, {
    mocks: {
      $store: {
        state: { config: { apiUrl: '' }, socket: {} },
        getters: {
          'files/getDirectory': (root: string) => (root === 'timelapse' ? entries ?? undefined : undefined),
          'server/componentSupport': () => opts.supported !== false,
          'config/getDisplayName': 'Boxwood',
          'timelapse/getSettings': undefined,
          'timelapse/getLastFrame': opts.frames ? { count: opts.frames, uniqueCount: opts.frames, file: `frame${String(opts.frames).padStart(6, '0')}.jpg` } : undefined,
          'timelapse/getRenderStatus': opts.render,
          'webcams/getWebcamById': () => undefined,
          'wait/hasWait': () => false
        },
        dispatch: vi.fn()
      },
      $confirm: vi.fn(async () => true),
      $waits: { onTimelapseSaveFrame: 'tl-save' }
    },
    computed: {
      socketConnected: () => opts.connected !== false,
      isMobileViewport: () => !!opts.mobile
    },
    stubs: { 'frame-icon': true, 'router-link': { template: '<a><slot /></a>' }, 'v-menu': true, 'v-dialog': true, 'file-name-dialog': true, 'range-slider': true, 'camera-item': true, 'timelapse-render-settings-dialog': true }
  })
}

describe('Timelapse, a page to watch', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('reads the folder, and shows each video as a card with its picture and play button', async () => {
    const get = vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    const wrapper = mountTimelapse()
    expect(get).toHaveBeenCalledWith('timelapse', 'timelapse')
    expect(wrapper.findAll('[data-file]').length).toBe(2)
    const card = wrapper.get(`[data-file="${files[0].filename}"]`)
    expect(card.text()).toContain('M1 bracket')
    expect(card.find('img').exists()).toBe(true)
    expect(card.find('.tl__play').exists()).toBe(true)
    expect(wrapper.find('[data-tid="timelapse-settings"]').exists()).toBe(false)
  })

  it('lays the cards out four across, and two across on a phone', () => {
    vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    expect(mountTimelapse().classes()).not.toContain('tl--phone')
    expect(mountTimelapse({ mobile: true }).classes()).toContain('tl--phone')
  })

  it('shows this print rendering first, with its progress and no play button', () => {
    vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    const wrapper = mountTimelapse({ frames: 240, render: { status: 'running', progress: 62 } })
    const card = wrapper.get('[data-tid="timelapse-status"]')
    expect(card.get('[data-tid="timelapse-rendering"]').text()).toBe('Rendering · 62%')
    expect(card.find('.tl__play').exists()).toBe(false)
    expect(card.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('62')
  })

  it('says so when there are no videos yet', () => {
    vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    const wrapper = mountTimelapse({ entries: [] })
    expect(wrapper.get('[data-tid="timelapse-empty"]').text()).toContain('No timelapses yet')
  })

  it('says so, with Retry, when the folder could not be read', async () => {
    const get = vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue(undefined as never)
    const wrapper = mountTimelapse({ entries: null })
    await vi.waitFor(() => expect(wrapper.find('[data-tid="timelapse-error"]').exists()).toBe(true))
    await wrapper.get('[data-tid="timelapse-retry"]').trigger('click')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('says the printer is offline, and keeps the videos it has without play', () => {
    const get = vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    const wrapper = mountTimelapse({ connected: false })
    expect(get).not.toHaveBeenCalled()
    expect(wrapper.get('[data-tid="timelapse-offline"]').text()).toContain('Boxwood is offline')
    expect(wrapper.get('[data-file] .tl__picture').attributes('disabled')).toBeDefined()
  })

  it('without moonraker-timelapse, says it isn\'t set up and asks nothing', () => {
    const get = vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    const wrapper = mountTimelapse({ supported: false })
    expect(get).not.toHaveBeenCalled()
    expect(wrapper.get('[data-tid="timelapse-unsupported"]').text()).toContain("Timelapse isn't set up on Boxwood")
  })

  it('renames a video and the picture beside it', () => {
    vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockResolvedValue({} as never)
    const move = vi.spyOn(SocketActions, 'serverFilesMove').mockImplementation(vi.fn() as never)
    const wrapper = mountTimelapse()
    const vm = wrapper.vm as unknown as { items: Array<{ name: string }>, renaming: unknown, rename: (name: string) => void }
    vm.renaming = vm.items.find(item => item.name === files[0].filename)
    vm.rename('bracket')
    expect(move).toHaveBeenCalledWith('timelapse/timelapse_M1_bracket_PLA_0.2mm_20261104_0912.mp4', 'timelapse/bracket.mp4')
    expect(move).toHaveBeenCalledWith('timelapse/timelapse_M1_bracket_PLA_0.2mm_20261104_0912.jpg', 'timelapse/bracket.jpg')
  })
})
