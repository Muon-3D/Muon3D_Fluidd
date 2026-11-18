import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TypedCommandsMixin from '../typed-commands'
import { cloudState } from '@/services/muon-cloud/state'
import { MANAGED_API_URL } from '@/services/muon-cloud/origin'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { forgetGrantedRole, grantedRoleOf, readGrantedRole } from '@/services/muon-ble/granted-role'

// KAN-4309 (Jack's D-166): an Open printer's Operator guest over Bluetooth may command it; nobody else gains anything.
const route = vi.hoisted(() => ({ label: 'Via Bluetooth' }))
vi.mock('@/services/muon-ble/link', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/muon-ble/link')>(),
  remoteRouteLabel: () => route.label
}))

const ID = '5c7d1e22'.repeat(8)
const available = (TypedCommandsMixin as unknown as { options: { computed: { commandControlAvailable: { get: (this: unknown) => boolean } } } }).options.computed.commandControlAvailable.get

const ctx = (apiUrl = MANAGED_API_URL) => ({ socketConnected: true, apiConnected: true, authenticated: true, $store: { state: { config: { apiUrl } } } })
const reply = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status })
const held = (role?: 'operator' | 'viewer') => ({ id: ID, name: 'Alder', model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: true, online_since: null, role })

beforeEach(() => {
  route.label = 'Via Bluetooth'
  printerTransportBinding.remote = true
  cloudState.printers = []
  cloudState.activePrinterId = ID
})
afterEach(() => {
  forgetGrantedRole(ID)
  cloudState.printers = []
  cloudState.activePrinterId = null
  printerTransportBinding.remote = false
})

describe('what an Open printer grants (D-166)', () => {
  it('grants Operator only to the exact entry "open"', () => {
    expect(grantedRoleOf({ entry: 'open' })).toBe('operator')
    expect(grantedRoleOf({ entry: 'protected' })).toBeNull()
    expect(grantedRoleOf({ accepting: false })).toBeNull()
    expect(grantedRoleOf(null)).toBeNull()
  })
  it('never goes above Operator, and an unknown role grants nothing', () => {
    expect(grantedRoleOf({ entry: 'open', role: 'viewer' })).toBe('viewer')
    expect(grantedRoleOf({ entry: 'open', role: 'owner' })).toBeNull()
  })
  it('records nothing from a refused, failed or protected answer', async () => {
    expect(await readGrantedRole(ID, reply({ entry: 'protected' }))).toBeNull()
    expect(await readGrantedRole(ID, reply({ entry: 'open' }, 403))).toBeNull()
    expect(await readGrantedRole(ID, async () => { throw new Error('gone') })).toBeNull()
  })
})

describe('commandControlAvailable', () => {
  it('is on for an Open printer that granted Operator, over Bluetooth, with no account entry', async () => {
    await readGrantedRole(ID, reply({ entry: 'open' }))
    expect(available.call(ctx())).toBe(true)
  })
  it('stays off for a protected printer the person is not admitted to', async () => {
    await readGrantedRole(ID, reply({ entry: 'protected' }))
    expect(available.call(ctx())).toBe(false)
  })
  it('stays off with nothing recorded', () => {
    expect(available.call(ctx())).toBe(false)
  })
  it('stays off when the grant was only a viewer', async () => {
    await readGrantedRole(ID, reply({ entry: 'open', role: 'viewer' }))
    expect(available.call(ctx())).toBe(false)
  })
  it('is not widened onto the cloud relay', async () => {
    await readGrantedRole(ID, reply({ entry: 'open' }))
    route.label = 'Through Muon3D'
    expect(available.call(ctx())).toBe(false)
    route.label = 'Bluetooth dropped'
    expect(available.call(ctx())).toBe(false)
  })
  it('leaves an account printer to its own role, whatever Bluetooth was granted', async () => {
    await readGrantedRole(ID, reply({ entry: 'open' }))
    cloudState.printers = [held('viewer')]
    expect(available.call(ctx())).toBe(false)
    cloudState.printers = [held()]
    expect(available.call(ctx())).toBe(false)
    cloudState.printers = [held('operator')]
    expect(available.call(ctx())).toBe(true)
  })
  it('keeps its other conditions: not connected is off, and LAN is unchanged', async () => {
    await readGrantedRole(ID, reply({ entry: 'open' }))
    expect(available.call({ ...ctx(), socketConnected: false })).toBe(false)
    printerTransportBinding.remote = false
    expect(available.call(ctx('http://192.0.2.9:7125'))).toBe(true)
  })
})
