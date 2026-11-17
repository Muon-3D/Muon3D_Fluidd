import Vue from 'vue'
import Vuex from 'vuex'
import type { ActionContext } from 'vuex'
import { describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { mutations } from '../mutations'
import { defaultState } from '../state'
import type { RootState } from '@/store/types'

Vue.use(Vuex)

function fixture () {
  let finish!: () => void
  const pending = new Promise<void>(resolve => { finish = resolve })
  const reset = vi.fn(async ({ dispatch }: ActionContext<RootState, RootState>, modules: string[]) => {
    if (modules.includes('socket')) await dispatch('socket/reset')
    await pending
  })
  const store = new Vuex.Store<RootState>({
    modules: { socket: { namespaced: true, state: defaultState(), actions, mutations } },
    actions: { reset }
  })
  return { store, reset, finish }
}

describe('socket state while other modules reset after a drop', () => {
  it('stays reconnecting across the async reset instead of briefly going Offline', async () => {
    const { store, reset, finish } = fixture()
    store.commit('socket/setSocketOpen', true)
    store.commit('socket/setAcceptNotifications', true)
    const closing = store.dispatch('socket/onSocketClose', { code: 1000, wasClean: false })
    await Vue.nextTick()
    const duringReset = { ...store.state.socket }
    finish()
    await closing
    expect(duringReset).toMatchObject({ open: false, connecting: true, acceptingNotifications: false })
    expect(reset.mock.calls[0][1]).not.toContain('socket')
    expect(store.state.socket.connecting).toBe(true)
  })

  it('stops connecting when Fluidd asked for the close', async () => {
    const { store, reset } = fixture()
    store.commit('socket/setSocketOpen', true)
    store.commit('socket/setSocketConnecting', true)
    await store.dispatch('socket/onSocketClose', { code: 1000, wasClean: true })
    expect(store.state.socket).toMatchObject({ open: false, connecting: false })
    expect(reset).not.toHaveBeenCalled()
  })

  it('does not clear a new connection when an older module reset finishes late', async () => {
    const { store, finish } = fixture()
    store.commit('socket/setSocketOpen', true)
    const closing = store.dispatch('socket/onSocketClose', { code: 1006, wasClean: false })
    await Vue.nextTick()
    store.commit('socket/setSocketOpen', true)
    store.commit('socket/setSocketConnecting', false)
    finish()
    await closing
    expect(store.state.socket).toMatchObject({ open: true, connecting: false })
  })

  it('an ordinary reset does not start reconnecting', async () => {
    const { store } = fixture()
    store.commit('socket/setSocketConnecting', true)
    await store.dispatch('socket/reset')
    expect(store.state.socket).toEqual(defaultState())
  })
})
