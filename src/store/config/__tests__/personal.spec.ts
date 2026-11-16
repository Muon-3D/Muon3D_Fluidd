import { describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { mutations } from '../mutations'
import { defaultState } from '../state'
import type { ConfigState } from '../types'
import { SocketActions } from '@/api/socketActions'

vi.mock('@/plugins/vuetify', () => ({ default: { framework: { theme: { dark: true, currentTheme: {} } } } }))
vi.mock('@/api/socketActions', () => ({ SocketActions: { serverWrite: vi.fn() } }))

/** The config store's actions and mutations, run against one state. */
function store (state: ConfigState = defaultState()) {
  const commit = (type: string, payload?: unknown) => (mutations as any)[type](state, payload)
  const dispatch = async (type: string, payload?: unknown): Promise<unknown> => {
    if (type === 'onThemeChange') return
    return (actions as any)[type]({ state, commit, dispatch, rootState: {}, getters: {}, rootGetters: {} }, payload)
  }
  return { state, commit, dispatch }
}

describe('personal settings on a printer', () => {
  it("put someone's own Look and Ask before over the printer's, and back when they go", async () => {
    const { state, commit, dispatch } = store()
    commit('setInitUiSettings', {
      theme: { color: '#80d6d1', isDark: true },
      general: { confirmOnEstop: false },
      personal: { jack: { theme: { color: '#ffb36b' }, general: { confirmOnEstop: true } } }
    })
    await dispatch('applyPersonal', 'jack')
    expect(state.uiSettings.theme.color).toBe('#ffb36b')
    expect(state.uiSettings.general.confirmOnEstop).toBe(true)

    await dispatch('applyPersonal', 'anonymous')
    expect(state.uiSettings.theme.color).toBe('#80d6d1')
    expect(state.uiSettings.general.confirmOnEstop).toBe(false)
  })

  it("save under the person's key, leaving the printer's alone", async () => {
    const { state, dispatch } = store()
    await dispatch('applyPersonal', 'jack')
    await dispatch('savePersonal', { path: 'theme.color', value: '#7aa7ff' })
    expect(SocketActions.serverWrite).toHaveBeenCalledWith('uiSettings.personal.jack.theme.color', '#7aa7ff')
    expect(state.uiSettings.theme.color).toBe('#7aa7ff')
    expect(state.sharedPersonal?.theme?.color).toBe('#80D6D1')
  })

  it('save for the printer before anyone is known', async () => {
    const { dispatch } = store()
    await dispatch('applyPersonal', null)
    await dispatch('savePersonal', { path: 'general.confirmOnEstop', value: true })
    expect(SocketActions.serverWrite).toHaveBeenCalledWith('uiSettings.general.confirmOnEstop', true)
  })

  it('follow the device in Auto, and only in Auto', async () => {
    const { state, commit, dispatch } = store()
    commit('setInitUiSettings', { theme: { color: '#80d6d1', isDark: true, mode: 'auto' } })
    await dispatch('applySystemDark', false)
    expect(state.uiSettings.theme.isDark).toBe(false)
    commit('setSaveByPath', { path: 'uiSettings.theme.mode', value: 'dark' })
    commit('setSaveByPath', { path: 'uiSettings.theme.isDark', value: true })
    await dispatch('applySystemDark', false)
    expect(state.uiSettings.theme.isDark).toBe(true)
  })
})
