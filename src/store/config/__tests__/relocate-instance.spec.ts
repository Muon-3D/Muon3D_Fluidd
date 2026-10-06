import { afterEach, describe, expect, it } from 'vitest'
import { defaultState } from '../state'
import { mutations } from '../mutations'
import type { InstanceConfig } from '../types'

const A = 'aaaa1111'.repeat(8)
const B = 'bbbb2222'.repeat(8)

function saved (apiUrl: string, fields: Partial<InstanceConfig> = {}): InstanceConfig {
  return { name: apiUrl, apiUrl, socketUrl: `${apiUrl.replace(/^http/, 'ws')}/websocket`, active: false, ...fields }
}

function relocate (instances: InstanceConfig[], apiUrl: string, changes: Partial<InstanceConfig>) {
  const state = defaultState()
  state.instances = instances
  mutations.setRelocateInstance(state, { apiUrl, changes })
  return state.instances
}

const toNew = { apiUrl: 'http://192.168.1.40', socketUrl: 'ws://192.168.1.40/websocket' }

afterEach(() => {
  localStorage.clear()
})

describe('setRelocateInstance', () => {
  it('moves a saved printer to its new address', () => {
    const list = relocate([saved('http://192.168.1.37', { endpointId: A })], 'http://192.168.1.37', toNew)
    expect(list).toEqual([expect.objectContaining({ apiUrl: 'http://192.168.1.40', endpointId: A })])
  })

  it('drops the moving entry when the new address is saved already for the same printer', () => {
    const list = relocate(
      [saved('http://192.168.1.37', { endpointId: A }), saved('http://192.168.1.40', { endpointId: A })],
      'http://192.168.1.37', toNew)
    expect(list.map(i => i.apiUrl)).toEqual(['http://192.168.1.40'])
  })

  it('keeps the printer that answered, not another printer saved at that address before', () => {
    // Printer A took the DHCP address printer B was saved at.
    const list = relocate(
      [saved('http://192.168.1.37', { name: 'A', endpointId: A }), saved('http://192.168.1.40', { name: 'B', endpointId: B })],
      'http://192.168.1.37', toNew)
    expect(list).toEqual([expect.objectContaining({ name: 'A', apiUrl: 'http://192.168.1.40', endpointId: A })])
  })

  it('leaves both while Fluidd is connected through the other entry', () => {
    const list = relocate(
      [saved('http://192.168.1.37', { endpointId: A }), saved('http://192.168.1.40', { endpointId: B, active: true })],
      'http://192.168.1.37', toNew)
    expect(list.map(i => [i.apiUrl, i.endpointId])).toEqual([['http://192.168.1.37', A], ['http://192.168.1.40', B]])
  })
})
