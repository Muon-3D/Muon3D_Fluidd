import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultState } from '../state'
import { mutations } from '../mutations'
import { getters } from '../getters'
import { actions } from '../actions'
import type { ConfigState, InstanceConfig } from '../types'
import type { ActionContext } from 'vuex'
import type { RootState } from '../../types'

const getInstances = getters.getInstances as (state: ConfigState) => InstanceConfig[]
const getTokenKeys = getters.getTokenKeys as (state: ConfigState) => Record<string, string>
const discoverLanInstances = actions.discoverLanInstances as (
  context: Pick<ActionContext<ConfigState, RootState>, 'commit'>
) => Promise<void>

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('LAN printer discovery', () => {
  it('has a mutation that replaces the ephemeral LAN snapshot', () => {
    const mutation = mutations.setLanInstances

    expect(typeof mutation).toBe('function')

    const state = defaultState()
    mutation(state, [{
      name: 'Boxwood',
      apiUrl: 'http://192.168.1.21',
      socketUrl: 'ws://192.168.1.21/websocket',
      active: false,
      discovered: true
    }])

    expect(state.lanInstances.map(instance => instance.name)).toEqual(['Boxwood'])
    expect(localStorage.length).toBe(0)
  })

  it('merges discovered printers without duplicating a previously used instance', () => {
    const state = defaultState()
    state.instances = [{
      name: 'My Boxwood',
      apiUrl: 'http://192.168.1.21',
      socketUrl: 'ws://192.168.1.21/websocket',
      active: true
    }]
    state.lanInstances = [
      {
        name: 'Boxwood from mDNS',
        apiUrl: 'http://192.168.1.21',
        socketUrl: 'ws://192.168.1.21/websocket',
        active: false,
        discovered: true
      },
      {
        name: 'Walnut',
        apiUrl: 'http://192.168.1.22',
        socketUrl: 'ws://192.168.1.22/websocket',
        active: false,
        discovered: true
      }
    ]

    const instances = getInstances(state)

    expect(instances.map(instance => [instance.name, instance.active])).toEqual([
      ['My Boxwood', true],
      ['Walnut', false]
    ])
  })

  it('loads and validates the same-origin discovery feed', async () => {
    const state = defaultState()
    vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit) => {
      expect(input).toBe('/muon/lan-printers.json')
      expect(init.cache).toBe('no-store')
      return {
        ok: true,
        json: async () => ({
          version: 1,
          printers: [
            {
              name: 'Boxwood',
              apiUrl: 'http://192.168.1.21',
              socketUrl: 'ws://192.168.1.21/websocket',
              authKey: 'muon-boxwood-367a.local'
            },
            {
              name: 'Hostile',
              apiUrl: 'javascript:alert(1)',
              socketUrl: 'ws://192.168.1.99/websocket'
            }
          ]
        })
      }
    }))
    const commit = (name: string, payload: unknown) => {
      const mutation = mutations[name]
      if (mutation) mutation(state, payload)
    }

    expect(typeof actions.discoverLanInstances).toBe('function')
    await discoverLanInstances({ commit } as never)

    expect(state.lanInstances).toEqual([{
      name: 'Boxwood',
      apiUrl: 'http://192.168.1.21',
      socketUrl: 'ws://192.168.1.21/websocket',
      authKey: 'muon-boxwood-367a.local',
      active: false,
      discovered: true
    }])
  })

  it('keeps a manually configured session when its stable key has an address change', () => {
    const state = defaultState()
    state.discovered = false
    state.authKey = 'muon-boxwood-367a.local'
    state.apiUrl = 'http://192.168.1.21'
    const before = getTokenKeys(state)

    state.apiUrl = 'http://192.168.1.84'
    const after = getTokenKeys(state)

    expect(after).toEqual(before)
  })

  it('never reuses a discovered printer token after an mDNS endpoint change', () => {
    const state = defaultState()
    const init = mutations.setInitApiConfig

    init(state, {
      name: 'Boxwood',
      apiUrl: 'http://192.168.1.21',
      socketUrl: 'ws://192.168.1.21/websocket',
      authKey: 'muon-boxwood-367a.local',
      active: false,
      discovered: true
    })
    const before = getTokenKeys(state)

    init(state, {
      name: 'Spoofed Boxwood',
      apiUrl: 'http://192.168.1.84',
      socketUrl: 'ws://192.168.1.84/websocket',
      authKey: 'muon-boxwood-367a.local',
      active: false,
      discovered: true
    })

    expect(getTokenKeys(state)).not.toEqual(before)
  })

  it('keeps the previous snapshot when discovery is temporarily unavailable', async () => {
    const state = defaultState()
    state.lanInstances = [{
      name: 'Known',
      apiUrl: 'http://192.168.1.20',
      socketUrl: 'ws://192.168.1.20/websocket',
      active: false,
      discovered: true
    }]
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const commit = (name: string, payload: unknown) => {
      const mutation = mutations[name]
      if (mutation) mutation(state, payload)
    }

    expect(typeof actions.discoverLanInstances).toBe('function')
    await discoverLanInstances({ commit } as never)

    expect(state.lanInstances.map(instance => instance.name)).toEqual(['Known'])
  })
})
