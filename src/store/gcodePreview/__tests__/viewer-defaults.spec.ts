import { describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { defaultState as configDefaults } from '@/store/config/state'

type Handler = (ctx: unknown, payload?: unknown) => Promise<void>

const run = (name: 'applyViewerDefaults' | 'reset', gcodePreview: Record<string, unknown>) => {
  const commit = vi.fn()
  const dispatch = vi.fn()
  const config = configDefaults()
  Object.assign(config.uiSettings.gcodePreview, gcodePreview)
  ;(actions[name] as Handler)({ commit, dispatch, rootState: { config } })
  return { commit, dispatch }
}

describe('what a preview starts out showing', () => {
  it('follows the saved travel moves and retractions settings', () => {
    const { commit } = run('applyViewerDefaults', { showMoves: false, showRetractions: true })
    expect(commit).toHaveBeenCalledWith('setViewerState', { showMoves: false, showRetractions: true })
  })

  it('shows both for a printer that has never saved them', () => {
    const { commit } = run('applyViewerDefaults', { showMoves: undefined, showRetractions: undefined })
    expect(commit).toHaveBeenCalledWith('setViewerState', { showMoves: true, showRetractions: true })
  })

  it('unloading a file goes back to the saved defaults, not the built-in ones', () => {
    const { commit, dispatch } = run('reset', {})
    expect(commit).toHaveBeenCalledWith('setReset')
    expect(dispatch).toHaveBeenCalledWith('applyViewerDefaults')
  })
})
