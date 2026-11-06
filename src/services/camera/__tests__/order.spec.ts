import { describe, expect, it } from 'vitest'
import { moveCamera, orderCameras } from '../order'

const cam = (uid: string, name: string) => ({ uid, name })
const A = cam('u-a', 'Alpha')
const B = cam('u-b', 'Bravo')
const C = cam('u-c', 'Charlie')
const names = (list: Array<{ name: string }>) => list.map(c => c.name)

describe('orderCameras', () => {
  it('follows the saved order', () => {
    expect(names(orderCameras([A, B, C], ['u-c', 'u-a', 'u-b']))).toEqual(['Charlie', 'Alpha', 'Bravo'])
  })

  it('puts cameras the order does not name last, by name', () => {
    expect(names(orderCameras([cam('u-z', 'Zed'), A, B, cam('u-m', 'Mid')], ['u-b']))).toEqual(['Bravo', 'Alpha', 'Mid', 'Zed'])
  })

  it('is by name with no saved order', () => {
    expect(names(orderCameras([C, A, B], []))).toEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(names(orderCameras([C, A, B], undefined))).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('matches an entry by name when no uid matches', () => {
    expect(names(orderCameras([A, B, C], ['Charlie', 'u-a']))).toEqual(['Charlie', 'Alpha', 'Bravo'])
  })

  it('skips entries for cameras that are gone and repeats', () => {
    expect(names(orderCameras([A, B], ['gone', 'u-b', 'u-b', 'u-a']))).toEqual(['Bravo', 'Alpha'])
  })

  it('does not change what it is given', () => {
    const input = [C, A, B]
    orderCameras(input, ['u-b'])
    expect(input).toEqual([C, A, B])
  })
})

describe('moveCamera', () => {
  it('moves one camera and returns every uid', () => {
    expect(moveCamera([A, B, C], 0, 1)).toEqual(['u-b', 'u-a', 'u-c'])
    expect(moveCamera([A, B, C], 2, 0)).toEqual(['u-c', 'u-a', 'u-b'])
  })

  it('stops at the ends and ignores a bad index', () => {
    expect(moveCamera([A, B, C], 0, -1)).toEqual(['u-a', 'u-b', 'u-c'])
    expect(moveCamera([A, B, C], 2, 3)).toEqual(['u-a', 'u-b', 'u-c'])
    expect(moveCamera([A, B, C], 5, 0)).toEqual(['u-a', 'u-b', 'u-c'])
  })
})
