import { beforeEach, describe, expect, it, vi } from 'vitest'
import { actions, resetConsoleLoaded } from '../actions'

const store = { gcode_store: [{ message: 'ok', type: 'response', time: 1 }] }

function load (clearOnReconnect: boolean | undefined) {
  const commit = vi.fn()
  const rootState = { config: { uiSettings: { console: clearOnReconnect === undefined ? {} : { clearOnReconnect } } } }
  const run = actions.onGcodeStore as unknown as (ctx: unknown, payload: unknown) => Promise<void>
  return run({ commit, dispatch: vi.fn(), rootState }, { gcode_store: store.gcode_store.map(e => ({ ...e })) }).then(() => commit.mock.calls.map(c => c[0]))
}

describe('Settings › Console › Start empty after a reconnect', () => {
  beforeEach(() => resetConsoleLoaded())

  it('never clears the first load in a tab', async () => {
    expect(await load(true)).not.toContain('setLastCleared')
  })

  it('clears this tab\'s view when the history loads again after a reconnect', async () => {
    await load(true)
    expect(await load(true)).toContain('setLastCleared')
  })

  it('keeps the lines when it is off, as before', async () => {
    await load(false)
    expect(await load(false)).not.toContain('setLastCleared')
    expect(await load(undefined)).not.toContain('setLastCleared')
  })
})
