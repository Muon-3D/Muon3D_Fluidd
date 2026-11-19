import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LightingTile from '../tiles/LightingTile.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'
import { lightsStore } from '@/services/control/lights-store'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))
vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: {
    serverDatabaseItemGet: vi.fn(async () => ({ data: { result: { value: {} } } })),
    serverDatabaseItemPost: vi.fn(async () => ({}))
  }
}))

const LED = { mode: 'solid', h: 0, h2: 240, bright: 80, speed: 55 }

function show (size: 'S' | 'M' | 'L', macro: unknown = LED) {
  const store = tileStore()
  if (macro) Vue.set(store.state.printer.printer, 'gcode_macro LED_MODE', macro)
  return mount(LightingTile, tileMount(store, { propsData: { size } }))
}

const leds = () => sent().filter(s => s.startsWith('LED_MODE'))

beforeEach(() => lightsStore.reset())
afterEach(() => { resetSocket(); lightsStore.reset(); vi.restoreAllMocks() })

describe('LightingTile', () => {
  it('draws different things at S, M and L, not the same thing scaled', () => {
    // One at a time: the fixture's printer state is shared between stores.
    const has = (size: 'S' | 'M' | 'L', tid: string) => { const w = show(size); const found = w.find(`[data-tid="${tid}"]`).exists(); w.destroy(); return found }
    expect(has('S', 'lighting-next')).toBe(true)
    expect(has('S', 'lights-strip')).toBe(false)
    expect(has('M', 'lights-strip')).toBe(true)
    expect(has('M', 'lighting-brightness')).toBe(true)
    expect(has('M', 'lighting-swatch-0')).toBe(false)
    expect(has('L', 'lighting-swatch-0')).toBe(true)
    expect(has('L', 'lighting-speed')).toBe(true)
    expect(has('L', 'lighting-effect')).toBe(true)
  })

  it('the switch sends LED_MODE MODE=off', async () => {
    const w = show('S', { ...LED, mode: 'chase' })
    await w.find('[data-tid="lighting-power"]').trigger('click')
    expect(leds().at(-1)).toBe('LED_MODE MODE=off')
    w.destroy()
  })

  it('the effect list has only what LED_MODE can do', async () => {
    const w = show('L')
    await w.find('[data-tid="lighting-effect"]').trigger('click')
    expect(w.findAll('[role="option"]').wrappers.map(o => o.text())).toEqual(['Solid', 'Gradient', 'Rainbow', 'Breathe', 'Chase', 'Status'])
    w.destroy()
  })

  it('the effect list picks an effect and sends it', async () => {
    const w = show('L')
    await w.find('[data-tid="lighting-effect"]').trigger('click')
    await w.find('[data-tid="lighting-effect-gradient"]').trigger('click')
    // The writer's three-a-second limit carries over from the test before, so the line may wait up to a third of a second.
    await vi.waitFor(() => expect(leds().at(-1)).toBe('LED_MODE MODE=gradient H=0 H2=240 BRIGHT=80 SPEED=55'), { timeout: 2000 })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    w.destroy()
  })

  it('Speed is off for an effect with none', () => {
    const w = show('L')
    expect((w.find('[data-tid="lighting-speed"]').element as HTMLInputElement).disabled).toBe(true)
    w.destroy()
  })

  it('negative control: without LED_MODE it says so and sends nothing', async () => {
    const w = show('M', null)
    expect(w.find('[data-tid="lighting-unavailable"]').text()).toContain('Not available on this printer')
    expect(w.find('[data-tid="lighting-power"]').exists()).toBe(false)
    expect(leds()).toEqual([])
    w.destroy()
  })
})
