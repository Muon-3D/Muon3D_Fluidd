import Vue from 'vue'
import Vuex from 'vuex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { followStartup, startup } from '../heard'

Vue.use(Vuex)

const storeWith = (socket: { open: boolean, error: unknown, connecting: boolean }) => new Vuex.Store({
  state: { socket },
  mutations: { set (state, patch: Partial<typeof socket>) { Object.assign(state.socket, patch) } }
})

const tick = () => new Promise<void>(resolve => Vue.nextTick(() => resolve()))

describe('followStartup', () => {
  beforeEach(() => { startup.heard = false; vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('has heard once the socket opens', async () => {
    const store = storeWith({ open: false, error: null, connecting: false })
    followStartup(store)
    expect(startup.heard).toBe(false)
    store.commit('set', { connecting: true })
    await tick()
    expect(startup.heard).toBe(false)
    store.commit('set', { open: true, connecting: false })
    await tick()
    expect(startup.heard).toBe(true)
  })

  it('has heard when connecting ends without opening (a refusal)', async () => {
    const store = storeWith({ open: false, error: null, connecting: false })
    followStartup(store)
    store.commit('set', { connecting: true })
    await tick()
    store.commit('set', { connecting: false })
    await tick()
    expect(startup.heard).toBe(true)
  })

  it('counts a socket that was already open when it started', () => {
    followStartup(storeWith({ open: true, error: null, connecting: false }))
    expect(startup.heard).toBe(true)
  })

  it('takes silence as the answer after the quiet time, for a printer that never answers', async () => {
    followStartup(storeWith({ open: false, error: null, connecting: false }), 8000)
    vi.advanceTimersByTime(7999)
    expect(startup.heard).toBe(false)
    vi.advanceTimersByTime(1)
    expect(startup.heard).toBe(true)
  })
})
