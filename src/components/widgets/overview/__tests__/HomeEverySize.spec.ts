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

// KAN-1955 / KAN-2023: Home all is the Trackpad's alone (ControlMove, G28 in the e2e); Jog and Position carry none, at any size.
describe.each(SIZES)('Home on the Overview tiles, size %s', size => {
  it.each([['JogTile', JogTile], ['PositionTile', PositionTile]] as const)('%s: has no Home all, and no X-Y-only home', async (_name, C) => {
    const w = await open(C, size)
    expect(w.findAll('button').wrappers.filter(isHomeAll)).toHaveLength(0)
    expect(w.findAll('button').wrappers.some(b => /Home X ?Y/i.test(b.text()))).toBe(false)
    expect(sent()).toEqual([])
    w.destroy()
  })
})
