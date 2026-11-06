/**
 * Agents acting on this account's printers, live (KAN-1359 Phase A): the
 * activity stream (`./sse`), what it means for each control (`./activity`),
 * and the connected services (`GET /v1/agents`) with their revoke.
 *
 * One stream per tab, open while something on screen needs it: each
 * `v-agent-highlight` and the Connected services list holds it with
 * `acquireAgentStream()` and lets go when it goes.
 */
import Vue from 'vue'
import store from '@/store'
import type { InstanceConfig } from '@/store/config/types'
import { cloudBaseUrl, refreshSession, storedToken } from '@/services/muon-cloud/api'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { accountRequest } from '@/services/account/client'
import { learnedEndpointId } from '@/services/printer-pages'
import { AgentStream, type SseMessage, type StreamStatus } from './sse'
import {
  activityFor,
  applyEvent,
  dropAgent,
  emptyActivity,
  nextExpiry,
  prune,
  type ActivityState,
  type AgentActivity
} from './activity'
import type { AgentActionEvent, AgentConnection, AgentGrantEvent } from './types'

export type { AgentActivity, ControlActivity, ControlId } from './activity'
export type { AgentConnection } from './types'

interface AgentsState {
  activity: ActivityState;
  /** Null until the first read. */
  connections: AgentConnection[] | null;
  /** The console has no `GET /v1/agents` yet. */
  missing: boolean;
  /** The last read failed. */
  loadError: boolean;
  status: StreamStatus;
  /** Bumped when a look runs out, so whatever reads `agentActivity()` reads it again. */
  tick: number;
}

export const agentsState = Vue.observable<AgentsState>({
  activity: emptyActivity(),
  connections: null,
  missing: false,
  loadError: false,
  status: 'idle',
  tick: 0
})

/** The open printer's device id (the 64-hex id the console uses), or null. */
export function openPrinterDeviceId (): string | null {
  const apiUrl: string | undefined = store.state.config?.apiUrl
  if (!apiUrl) return null
  if (isManagedApiUrl(apiUrl)) return cloudState.activePrinterId?.toLowerCase() ?? null
  const instance = store.getters['config/getCurrentInstance'] as InstanceConfig | undefined
  return (instance?.endpointId ?? learnedEndpointId(apiUrl))?.toLowerCase() ?? null
}

/** `agentActivity` for the open printer: `{ [controlId]: { agentName, colour, colourIndex, phase, since, stack } }`. */
export function agentActivity (): AgentActivity {
  return activityFor(agentsState.activity, openPrinterDeviceId(), Date.now())
}

let expiryTimer: ReturnType<typeof setTimeout> | null = null

function setActivity (next: ActivityState) {
  agentsState.activity = prune(next, Date.now())
  if (expiryTimer !== null) clearTimeout(expiryTimer)
  expiryTimer = null
  const at = nextExpiry(agentsState.activity)
  if (at === null) return
  expiryTimer = setTimeout(() => {
    expiryTimer = null
    agentsState.tick++
    setActivity(agentsState.activity)
  }, Math.max(0, at - Date.now()) + 5)
}

function parse<T> (data: string): T | null {
  try {
    const value = JSON.parse(data)
    return value && typeof value === 'object' ? value as T : null
  } catch {
    return null
  }
}

/** One message off the stream. Exported for tests. */
export function handleMessage (message: SseMessage) {
  switch (message.event) {
    case 'agent.action': {
      const event = parse<AgentActionEvent>(message.data)
      if (event) setActivity(applyEvent(agentsState.activity, event, message.id, Date.now()))
      return
    }
    case 'agent.revoked': {
      const event = parse<AgentGrantEvent>(message.data)
      const id = event?.agent?.id
      if (id) {
        setActivity(dropAgent(agentsState.activity, id))
        if (agentsState.connections) {
          agentsState.connections = agentsState.connections.map(c => (c.agent?.id === id ? { ...c, status: 'revoked' } : c))
        }
      }
      if (watchingConnections) refreshConnections()
      return
    }
    case 'agent.connected':
    case 'agent.grant_changed':
      if (watchingConnections) refreshConnections()
      return
    case 'reset': {
      // The resume point is older than what the console holds: start again from the snapshot.
      const n = Number(message.id)
      setActivity({ ...emptyActivity(), lastId: Number.isFinite(n) && message.id !== '' ? n : null })
      refreshConnections()
    }
  }
}

let stream: AgentStream | null = null
let holders = 0
let watchingConnections = 0

/** Hold the tab's stream open; call the answer to let go. */
export function acquireAgentStream (): () => void {
  holders++
  if (!stream) {
    stream = new AgentStream({
      baseUrl: cloudBaseUrl,
      token: storedToken,
      refresh: refreshSession,
      onMessage: handleMessage,
      onStatus: status => { agentsState.status = status }
    })
  }
  stream.start()
  let held = true
  return () => {
    if (!held) return
    held = false
    holders--
    if (holders === 0) stream?.stop()
  }
}

/** The Connected services list: the stream, and a fresh snapshot on every change. */
export function watchConnections (): () => void {
  watchingConnections++
  const release = acquireAgentStream()
  refreshConnections()
  let held = true
  return () => {
    if (!held) return
    held = false
    watchingConnections--
    release()
  }
}

let reads = 0

/** Read `GET /v1/agents` again. */
export async function refreshConnections (): Promise<void> {
  const read = ++reads
  try {
    const answer = await accountRequest<{ connections?: unknown }>('GET', '/v1/agents')
    if (read !== reads) return
    if (!Array.isArray(answer?.connections)) {
      agentsState.missing = true
      agentsState.connections = []
    } else {
      agentsState.missing = false
      agentsState.connections = answer.connections as AgentConnection[]
    }
    agentsState.loadError = false
  } catch (error) {
    if (read !== reads) return
    const status = (error as { status?: number }).status
    const missing = (error as { missing?: boolean }).missing === true
    if (missing || status === 404 || status === 405) {
      agentsState.missing = true
      agentsState.connections = []
    } else {
      agentsState.loadError = true
      agentsState.connections = agentsState.connections ?? []
    }
  }
}

/** `POST /v1/agents/{id}/revoke` (204): every grant of the agent ends. `agent.revoked` follows on the stream. */
export async function revokeAgent (agentId: string): Promise<void> {
  await accountRequest<unknown>('POST', `/v1/agents/${encodeURIComponent(agentId)}/revoke`)
  reads++
  setActivity(dropAgent(agentsState.activity, agentId))
  if (agentsState.connections) {
    agentsState.connections = agentsState.connections.map(c => (c.agent?.id === agentId ? { ...c, status: 'revoked' } : c))
  }
}

/** For tests: everything back to the start. */
export function resetAgentsForTests () {
  stream?.stop()
  stream = null
  holders = 0
  watchingConnections = 0
  reads = 0
  if (expiryTimer !== null) clearTimeout(expiryTimer)
  expiryTimer = null
  agentsState.activity = emptyActivity()
  agentsState.connections = null
  agentsState.missing = false
  agentsState.loadError = false
  agentsState.status = 'idle'
  agentsState.tick = 0
}
