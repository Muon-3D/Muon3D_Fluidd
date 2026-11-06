import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const accountRequest = vi.hoisted(() => vi.fn())
const device = vi.hoisted(() => ({ id: 'a'.repeat(64) }))
vi.mock('@/services/account/client', () => ({ accountRequest }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { get activePrinterId () { return device.id } } }))
vi.mock('@/services/muon-cloud/origin', () => ({ isManagedApiUrl: () => true }))
vi.mock('@/services/printer-pages', () => ({ learnedEndpointId: () => null }))
vi.mock('@/store', () => ({ default: { state: { config: { apiUrl: 'https://control.muon3d.com' } }, getters: {} } }))

const { agentActivity, agentsState, handleMessage, refreshConnections, resetAgentsForTests, revokeAgent, watchConnections } = await import('..')

const CLAUDE = { id: 'agt_1', name: 'Claude', colour: '#476CE0', colour_index: 5, provider: 'anthropic' }
const PRINTER = { id: 'p1', name: 'Boxwood', device_id: 'a'.repeat(64) }
const connection = (status = 'active') => ({ agent: CLAUDE, printers: [PRINTER], expires_at: null, last_active_at: null, status, grant: null, client: { id: 'dcr_1', name: 'Claude', client_uri: 'https://claude.ai' } })
const action = (id: number, phase = 'started') => handleMessage({
  event: 'agent.action',
  id: String(id),
  data: JSON.stringify({ v: 1, at: '', agent: CLAUDE, printer: PRINTER, action: 'printer.home', phase, ask_id: null, target: { axes: 'xyz' }, error: null })
})
const settle = () => new Promise(resolve => setTimeout(resolve))

beforeEach(() => {
  resetAgentsForTests()
  accountRequest.mockReset()
  accountRequest.mockResolvedValue({ connections: [connection()] })
})
afterEach(() => resetAgentsForTests())

describe('agents service', () => {
  it('feeds agentActivity for the open printer from agent.action', () => {
    action(1)
    expect(agentActivity().home).toMatchObject({ agentName: 'Claude', colourIndex: 5, phase: 'started' })
    device.id = 'b'.repeat(64)
    expect(agentActivity()).toEqual({})
    device.id = 'a'.repeat(64)
  })

  it('reset clears what it shows and reads the snapshot again', async () => {
    action(1)
    handleMessage({ event: 'reset', id: '90', data: '{}' })
    expect(agentActivity()).toEqual({})
    expect(agentsState.activity.lastId).toBe(90)
    // An event from before the reset is a replay.
    action(80)
    expect(agentActivity()).toEqual({})
    await settle()
    expect(accountRequest).toHaveBeenCalledWith('GET', '/v1/agents')
    expect(agentsState.connections).toHaveLength(1)
  })

  it('a console without GET /v1/agents is missing, not an error', async () => {
    accountRequest.mockRejectedValue(Object.assign(new Error('nope'), { status: 404, missing: true }))
    await refreshConnections()
    expect(agentsState.missing).toBe(true)
    expect(agentsState.loadError).toBe(false)
    accountRequest.mockRejectedValue(Object.assign(new Error('down'), { status: 503 }))
    await refreshConnections()
    expect(agentsState.loadError).toBe(true)
  })

  it('revoke posts, takes the agent off Control, marks the row, and agent.revoked re-reads', async () => {
    await refreshConnections()
    action(1)
    accountRequest.mockResolvedValueOnce({})
    await revokeAgent('agt_1')
    expect(accountRequest).toHaveBeenCalledWith('POST', '/v1/agents/agt_1/revoke')
    expect(agentActivity()).toEqual({})
    expect(agentsState.connections![0].status).toBe('revoked')

    const release = watchConnections()
    await settle()
    accountRequest.mockClear()
    accountRequest.mockResolvedValue({ connections: [connection('revoked')] })
    handleMessage({ event: 'agent.revoked', id: '2', data: JSON.stringify({ v: 1, at: '', agent: CLAUDE, printers: [PRINTER] }) })
    await settle()
    expect(accountRequest).toHaveBeenCalledWith('GET', '/v1/agents')
    release()
  })

  it('a failed revoke changes nothing', async () => {
    await refreshConnections()
    accountRequest.mockRejectedValueOnce(Object.assign(new Error('forbidden'), { status: 403 }))
    await expect(revokeAgent('agt_1')).rejects.toThrow('forbidden')
    expect(agentsState.connections![0].status).toBe('active')
  })

  it('ignores an unreadable event', () => {
    handleMessage({ event: 'agent.action', id: '1', data: 'not json' })
    expect(agentActivity()).toEqual({})
  })
})
