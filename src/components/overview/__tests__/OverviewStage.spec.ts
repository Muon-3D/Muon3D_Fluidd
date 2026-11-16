import Vue, { type CreateElement } from 'vue'
import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import OverviewStage from '../OverviewStage.vue'

const stage = vi.hoisted(() => ({ wait: vi.fn(), load: vi.fn() }))
vi.mock('@/services/m1-3d/stage-mount', () => ({ liveStageMayMount: stage.wait, loadLiveStage: stage.load }))
vi.mock('@/mixins/overview', () => ({
  default: {
    data: () => ({ socketConnected: true, klippyReady: true, busy: false, jobThumbnail: null, printerPaused: false, layer: null, layers: null, material: null }),
    methods: { isHomed: () => true }
  }
}))

const stub = (name: string) => ({ name, props: { state: { type: String, default: 'idle' }, shift: { type: Number, default: 0 }, parts: Boolean }, render: (h: CreateElement) => h('div') })
const Picture = stub('PrinterStage')
const Live = stub('DeferredLive')
let wrapper: Wrapper<Vue> | null
const show = () => (wrapper = mount(OverviewStage, { stubs: { PrinterStage: Picture } }))
async function flush () {
  for (let i = 0; i < 5; i++) await Promise.resolve()
  await Vue.nextTick()
}

beforeEach(() => {
  stage.wait.mockReset().mockResolvedValue(10_000)
  stage.load.mockReset().mockResolvedValue({ default: Live })
  wrapper = null
})
afterEach(() => {
  wrapper?.destroy()
  vi.restoreAllMocks()
})

it('keeps the picture until mounting is allowed, then preserves the current live state and part controls', async () => {
  let allow!: (deadline: number) => void
  let allowMount!: (deadline: number) => void
  stage.wait
    .mockReturnValueOnce(new Promise<number>(resolve => { allow = resolve }))
    .mockReturnValueOnce(new Promise<number>(resolve => { allowMount = resolve }))
  const w = show()
  await w.setData({ busy: true, jobThumbnail: '/part.png' })
  expect(w.findComponent(Picture).props('state')).toBe('printing')
  expect(w.findComponent(Live).exists()).toBe(false)
  expect(stage.load).not.toHaveBeenCalled()
  allow(10_000)
  await flush()
  expect(stage.load).toHaveBeenCalledTimes(1)
  expect(stage.wait).toHaveBeenLastCalledWith(10_000)
  expect(w.findComponent(Picture).exists()).toBe(true)
  expect(w.findComponent(Live).exists()).toBe(false)
  allowMount(10_000)
  await flush()
  expect(w.findComponent(Picture).exists()).toBe(false)
  expect(w.findComponent(Live).props()).toMatchObject({ state: 'printing', shift: 0.12, parts: true })
})

it('keeps the offline picture if the live component cannot load', async () => {
  const failure = new Error('chunk unavailable')
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  stage.load.mockRejectedValueOnce(failure)
  const w = show()
  await w.setData({ socketConnected: false })
  await flush()
  expect(w.findComponent(Picture).props('state')).toBe('offline')
  expect(w.findComponent(Live).exists()).toBe(false)
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('showing its picture'), failure)
})

it('does not register or mount a late live component after leaving the Overview', async () => {
  let finish!: (value: { default: typeof Live }) => void
  stage.load.mockReturnValueOnce(new Promise<{ default: typeof Live }>(resolve => { finish = resolve }))
  const w = show()
  await flush()
  expect(stage.load).toHaveBeenCalledTimes(1)
  w.destroy()
  finish({ default: Live })
  await flush()
  expect((w.vm as Vue & { liveReady: boolean }).liveReady).toBe(false)
  expect(w.vm.$options.components?.M1Live).toBeUndefined()
})
