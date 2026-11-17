import { describe, expect, it } from 'vitest'
import { DEFAULT_PINS, MAX_PINS, byPins, movePin, nudgePin, pinnedNames, renamePin, togglePin } from '../pins'

describe('pins', () => {
  it('defaults to the four materials every printer has', () => {
    expect(pinnedNames(null)).toEqual(DEFAULT_PINS)
    expect(pinnedNames(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toHaveLength(MAX_PINS)
  })

  it('pins up to six, then refuses', () => {
    let pins = [...DEFAULT_PINS]
    pins = togglePin(pins, 'ASA')!
    pins = togglePin(pins, 'PC')!
    expect(pins).toHaveLength(6)
    expect(togglePin(pins, 'PA')).toBeNull()
    expect(togglePin(pins, 'pla')).toEqual(['PETG', 'ABS', 'TPU', 'ASA', 'PC'])
  })

  it('reorders by drag and by keyboard', () => {
    expect(movePin(['A', 'B', 'C'], 'C', 'A')).toEqual(['C', 'A', 'B'])
    expect(movePin(['A', 'B', 'C'], 'A', 'C')).toEqual(['B', 'C', 'A'])
    expect(nudgePin(['A', 'B', 'C'], 'B', -1)).toEqual(['B', 'A', 'C'])
    expect(nudgePin(['A', 'B', 'C'], 'C', 1)).toEqual(['A', 'B', 'C'])
  })

  it('follows a rename and sorts pinned first', () => {
    expect(renamePin(['A', 'B'], 'b', 'Bee')).toEqual(['A', 'Bee'])
    expect(byPins([{ name: 'Z' }, { name: 'B' }, { name: 'A' }], ['B']).map(x => x.name)).toEqual(['B', 'A', 'Z'])
  })
})
