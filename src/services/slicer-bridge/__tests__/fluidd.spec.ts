// What Fluidd shows, as the bridge reads it (fluidd.ts): the transport, the
// account's active printer and a switch under way.
import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  activation: { switching: null as string | null },
  cloud: { activePrinterId: null as string | null, printers: [] as Array<Record<string, unknown>> },
  binding: { remote: false }
}))

vi.mock('@/services/muon-cloud/activate', () => ({ activationState: state.activation }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: state.cloud }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ printerTransportBinding: state.binding }))

const { readFluiddSelection } = await import('../fluidd')
const { MANAGED_API_URL } = await import('@/services/muon-cloud/origin')

const A = 'a'.repeat(64)
const B = 'b'.repeat(64)

function store (apiUrl: string) {
  return {
    state: { config: { apiUrl } },
    getters: {
      'socket/getConnectionState': true,
      'config/getCurrentInstance': { apiUrl, endpointId: null },
      'config/getDisplayName': 'walnut'
    }
  }
}

describe('readFluiddSelection', () => {
  it('selects nothing from the moment a cloud printer is bound until the account names it active (a cloud-to-cloud switch)', () => {
    state.cloud.printers = [
      { id: A, name: 'Walnut', model: 'M1', online: true, role: 'operator', shared: false },
      { id: B, name: 'Oak', model: 'M1', online: true, role: 'operator', shared: false }
    ]
    state.cloud.activePrinterId = A
    state.binding.remote = true
    expect(readFluiddSelection(store(MANAGED_API_URL))).toMatchObject({ switching: false, cloud: { id: A } })

    // activateCloudPrinter(B): switching, then the client bound to B's transport while A is still the active one.
    state.activation.switching = B
    expect(readFluiddSelection(store(MANAGED_API_URL))).toMatchObject({ switching: true, cloud: null })
    state.cloud.activePrinterId = B
    expect(readFluiddSelection(store(MANAGED_API_URL))).toMatchObject({ switching: true, cloud: null })

    // The switch is done: B.
    state.activation.switching = null
    expect(readFluiddSelection(store(MANAGED_API_URL))).toMatchObject({ switching: false, cloud: { id: B, name: 'Oak' } })
  })

  it('reads a network printer by its API address when no transport is bound', () => {
    state.binding.remote = false
    state.activation.switching = null
    expect(readFluiddSelection(store('http://192.0.2.10'))).toEqual({
      switching: false,
      cloud: null,
      apiUrl: 'http://192.0.2.10',
      displayName: 'walnut',
      savedEndpointId: null,
      connected: true
    })
  })
})
