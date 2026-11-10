import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PositionTile from '../tiles/PositionTile.vue'
import JogTile from '../tiles/JogTile.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'

vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

afterEach(() => resetSocket())

const SIZES = ['S', 'M', 'L'] as const
const isHomeAll = (b: any) => b.attributes('data-jog') === 'home' || /^Home all$/.test(b.text().trim())

const open = async (C: any, size: string) => {
  const w = mount(C, tileMount(tileStore(), { propsData: { size } }))
  const door = w.find('[data-tid="tile-door"]')
  if (door.exists()) await door.trigger('click')
  return w
}

// KAN-1963: every toolhead Home is a full G28, so the M1 contact guard re-zeros. Never G28 X Y.
describe.each(SIZES)('Home on the Overview tiles, size %s', size => {
  it.each([['JogTile', JogTile], ['PositionTile', PositionTile]] as const)('%s: every Home all button sends exactly G28', async (_name, C) => {
    const probe = await open(C, size)
    const count = probe.findAll('button').wrappers.filter(isHomeAll).length
    expect(count).toBeGreaterThan(0)
    // There is no X-Y-only home on any tile, at any size.
    expect(probe.findAll('button').wrappers.some(b => /Home X ?Y/i.test(b.text()))).toBe(false)
    probe.destroy()
    // A fresh tile per button: a homing in flight locks the others until it lands.
    for (let i = 0; i < count; i++) {
      resetSocket()
      const w = await open(C, size)
      await w.findAll('button').wrappers.filter(isHomeAll)[i].trigger('click')
      expect(sent()).toEqual(['G28'])
      w.destroy()
    }
  })
})
