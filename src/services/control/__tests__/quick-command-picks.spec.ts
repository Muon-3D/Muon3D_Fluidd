import { describe, expect, it } from 'vitest'
import { isPicked, normalisePicks, pickedMacros, togglePick } from '../quick-command-picks'

const macros = ['PURGE_LINE', 'PARK_HEAD', 'LIGHTS_ON', 'CLEAN_NOZZLE'].map(name => ({ name }))
const auto = (n: number) => macros.slice(0, n)

describe('quick command picks', () => {
  it('reads anything that is not a list as "nothing chosen", and a list without case, blanks or repeats', () => {
    expect(normalisePicks(undefined)).toBeNull()
    expect(normalisePicks('PURGE_LINE')).toBeNull()
    expect(normalisePicks([])).toEqual([])
    expect(normalisePicks(['purge_line', ' PURGE_LINE ', '', 3, 'park_head'])).toEqual(['PURGE_LINE', 'PARK_HEAD'])
  })

  it('with nothing chosen, shows the automatic pick, and those count as ticked', () => {
    expect(pickedMacros(macros, null, auto, 2).map(m => m.name)).toEqual(['PURGE_LINE', 'PARK_HEAD'])
    expect(isPicked(null, 'park_head', ['PURGE_LINE', 'PARK_HEAD'])).toBe(true)
    expect(isPicked(null, 'LIGHTS_ON', ['PURGE_LINE', 'PARK_HEAD'])).toBe(false)
  })

  it('shows the chosen ones in the order they were ticked, only those the printer still has, at most the count', () => {
    expect(pickedMacros(macros, ['CLEAN_NOZZLE', 'GONE', 'PURGE_LINE', 'LIGHTS_ON'], auto, 2).map(m => m.name)).toEqual(['CLEAN_NOZZLE', 'PURGE_LINE'])
    expect(pickedMacros(macros, [], auto, 5)).toEqual([])
  })

  it('the first tick or untick starts from what shows now, so nothing else moves; a new tick goes first so it shows', () => {
    expect(togglePick(null, 'LIGHTS_ON', true, ['PURGE_LINE', 'PARK_HEAD'])).toEqual(['LIGHTS_ON', 'PURGE_LINE', 'PARK_HEAD'])
    expect(togglePick(['A', 'B'], 'C', true, [])).toEqual(['C', 'A', 'B'])
    expect(togglePick(null, 'PURGE_LINE', false, ['PURGE_LINE', 'PARK_HEAD'])).toEqual(['PARK_HEAD'])
    expect(togglePick(['PARK_HEAD'], 'park_head', true, [])).toEqual(['PARK_HEAD'])
    expect(togglePick(['PARK_HEAD'], 'PARK_HEAD', false, [])).toEqual([])
  })
})
