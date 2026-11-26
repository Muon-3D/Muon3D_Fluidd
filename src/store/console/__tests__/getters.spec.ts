import { getters } from '../getters'
import type { ConsoleState } from '../types'
import type { RootState } from '../../types'

const wait = 'ok T0:25.00 /60.00 B:20.00 /0.00'

function run (hideTempWaits: boolean | undefined) {
  const state = {
    console: [
      { message: wait, time: 0, type: 'response' },
      { message: 'hello', time: 0, type: 'response' }
    ],
    lastCleared: 0,
    consoleFilters: [],
    consoleFiltersRegexp: []
  } as unknown as ConsoleState
  const root = { config: { uiSettings: { general: { hideTempWaits } } } } as unknown as RootState
  const fn = getters.getConsoleEntries as unknown as (s: ConsoleState, g: unknown, r: RootState) => { message: string }[]
  return fn(state, {}, root).map(e => e.message)
}

describe('getConsoleEntries heating lines', () => {
  it('shows heating lines when the toggle is off', () => {
    expect(run(false)).toEqual([wait, 'hello'])
  })

  it('hides heating lines when the toggle is on', () => {
    expect(run(true)).toEqual(['hello'])
  })

  it('hides heating lines by default when unset', () => {
    expect(run(undefined)).toEqual(['hello'])
  })
})
