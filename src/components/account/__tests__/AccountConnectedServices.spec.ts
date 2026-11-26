import Vue from 'vue'
import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountConnectedServices, { serviceRow } from '../AccountConnectedServices.vue'
import { agentsState, type AgentConnection } from '@/services/agents'
import { AccountError } from '@/services/account/client'

const calls = vi.hoisted(() => ({ read: vi.fn(), revoke: vi.fn(), release: vi.fn(), watch: vi.fn() }))
vi.mock('@/services/agents', async () => {
  const Vue = (await import('vue')).default
  return {
    agentsState: Vue.observable({ connections: null as AgentConnection[] | null, missing: false, loadError: false }),
    refreshConnections: calls.read,
    revokeAgent: calls.revoke,
    watchConnections: calls.watch,
    agentActivity: () => ({}),
    acquireAgentStream: () => calls.release
  }
})

const connection = (): AgentConnection => ({
  agent: { id: 'agt_1', name: 'Claude', colour: '#476CE0', colour_index: 5, provider: 'anthropic' },
  printers: [{ id: 'p1', name: 'Boxwood', device_id: 'a'.repeat(64) }],
  expires_at: null,
  last_active_at: null,
  status: 'active',
  grant: null,
  client: { id: 'client-1', name: 'Claude', client_uri: 'javascript:alert(1)' }
})
const wrappers: Array<Wrapper<Vue>> = []
const settle = async () => { for (let i = 0; i < 6; i++) await Vue.nextTick() }

function open (sure = true) {
  const confirm = vi.fn(async () => sure)
  const w = mount(AccountConnectedServices, { mocks: { $confirm: confirm } })
  wrappers.push(w)
  return { w, confirm }
}

beforeEach(() => {
  agentsState.connections = null
  agentsState.missing = false
  agentsState.loadError = false
  calls.read.mockReset().mockResolvedValue(undefined)
  calls.revoke.mockReset().mockResolvedValue(undefined)
  calls.watch.mockReset().mockReturnValue(calls.release)
})
afterEach(() => {
  wrappers.splice(0).forEach(w => w.destroy())
  vi.clearAllMocks()
})

describe('Connected services', () => {
  it('reads the list, uses the agent palette and never links a client-supplied URI', async () => {
    const { w } = open()
    expect(w.text()).toContain('Reading your connected services')
    expect(calls.watch).toHaveBeenCalledTimes(1)
    agentsState.connections = [connection()]
    await settle()
    expect(w.find('[data-tid="services-name"]').text()).toBe('Claude')
    expect(w.find('[data-tid="services-provider"]').text()).toContain('anthropic')
    expect(w.find('[data-tid="services-printers"]').text()).toBe('Boxwood')
    expect(w.find('[data-tid="services-times"]').text()).toBe('Never expires · Never used')
    expect(w.find('[data-tid="services-client-uri"]').text()).toBe('javascript:alert(1)')
    expect(w.findAll('a').length).toBe(0)
    expect(serviceRow(connection(), 0).colour).toBe('var(--m3d-agent-5)')
  })

  it('shows an empty list and releases its stream when it leaves', () => {
    agentsState.connections = []
    const { w } = open()
    expect(w.find('[data-tid="services-empty"]').exists()).toBe(true)
    expect(w.find('[data-tid="services-list"]').exists()).toBe(false)
    w.destroy()
    expect(calls.release).toHaveBeenCalledTimes(1)
  })

  it('distinguishes an absent API from an empty list', () => {
    agentsState.connections = []
    agentsState.missing = true
    const { w } = open()
    expect(w.find('[data-tid="services-missing"]').exists()).toBe(true)
    expect(w.find('[data-tid="services-empty"]').exists()).toBe(false)
  })

  it('keeps cached rows while showing an actionable read error', async () => {
    agentsState.connections = [connection()]
    agentsState.loadError = true
    const { w } = open()
    expect(w.find('[data-tid="services-name"]').text()).toBe('Claude')
    expect(w.find('[data-tid="services-load-error"]').text()).toContain("didn't load")
    await w.find('[data-tid="services-retry"]').trigger('click')
    expect(calls.read).toHaveBeenCalledTimes(1)
  })

  it('cancel leaves the agent alone', async () => {
    agentsState.connections = [connection()]
    const { w, confirm } = open(false)
    await w.find('[data-tid="services-revoke"]').trigger('click')
    await settle()
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('every printer at once'), expect.objectContaining({ title: 'Revoke Claude?' }))
    expect(calls.revoke).not.toHaveBeenCalled()
    expect(calls.read).not.toHaveBeenCalled()
    expect(w.find('[data-tid="services-status"]').text()).toBe('Active')
  })

  it('confirms before revoke, reports success and rereads the snapshot', async () => {
    agentsState.connections = [connection()]
    calls.revoke.mockImplementation(async () => { agentsState.connections = [{ ...connection(), status: 'revoked' }] })
    const { w } = open()
    await w.find('[data-tid="services-revoke"]').trigger('click')
    await settle()
    expect(calls.revoke).toHaveBeenCalledWith('agt_1')
    expect(w.find('[data-tid="services-message"]').text()).toBe('Claude is revoked.')
    expect(w.find('[data-tid="services-revoke"]').exists()).toBe(false)
    expect(calls.read).toHaveBeenCalledTimes(1)
  })

  it('leaves a failed revoke active and explains the failure', async () => {
    agentsState.connections = [connection()]
    calls.revoke.mockRejectedValue(new AccountError('The Muon3D service could not be reached.', 0))
    const { w } = open()
    await w.find('[data-tid="services-revoke"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="services-error"]').text()).toBe('The Muon3D service could not be reached.')
    expect(w.find('[data-tid="services-status"]').text()).toBe('Active')
    expect(w.find('[data-tid="services-revoke"]').attributes('disabled')).toBeUndefined()
    expect(w.find('[data-tid="services-message"]').exists()).toBe(false)
  })
})
