import { describe, expect, it, vi } from 'vitest'
import { createPoser } from '../accurate/tube'
import { placeAccurate } from '../accurate/klipper-map'

const pose = (x: number, y: number, z: number) => placeAccurate({ x, y, z, led: false, progress: 0 })

describe('the tube follows the head', () => {
  it('is driven with the mapped values on each pose change, after the nodes', () => {
    const order: string[] = []
    const nodes = vi.fn(() => { order.push('nodes') })
    const tube = vi.fn(() => { order.push('tube') })
    const poser = createPoser(nodes, tube)
    const a = pose(20, 30, 10)
    expect(poser(a)).toBe(true)
    expect(tube).toHaveBeenLastCalledWith(a.headX, a.headZ, a.z)
    const b = pose(120, 30, 10)
    poser(b)
    expect(tube).toHaveBeenLastCalledWith(b.headX, b.headZ, b.z)
    poser(pose(120, 30, 55))
    expect(tube).toHaveBeenCalledTimes(3)
    expect(order).toEqual(['nodes', 'tube', 'nodes', 'tube', 'nodes', 'tube'])
  })

  it('is not called on frames where nothing moved', () => {
    const nodes = vi.fn()
    const tube = vi.fn()
    const poser = createPoser(nodes, tube)
    poser(pose(50, 50, 5))
    expect(poser(pose(50, 50, 5))).toBe(false)
    expect(poser(pose(50, 50, 5))).toBe(false)
    expect(tube).toHaveBeenCalledTimes(1)
    expect(nodes).toHaveBeenCalledTimes(1)
  })

  it('is not called again for moves the travel limits swallow', () => {
    const tube = vi.fn()
    const poser = createPoser(vi.fn(), tube)
    poser(pose(500, 0, 0))
    poser(pose(900, 0, 0))
    expect(tube).toHaveBeenCalledTimes(1)
  })
})
