/**
 * What each of Control's controls shows of the agents acting on the open
 * printer: a pure reducer over `agent.action` events (KAN-1359 Phase A, the
 * look frozen with lead-sw on 3 Nov).
 *
 *   requested            nothing
 *   asked                a pulsing outline, "waiting for you"
 *   approved / denied    a badge for BADGE_MS
 *   started              the agent's tint and name, until finished or failed,
 *                        cleared after ACTIVE_MS without either
 *   failed               a red flash for FLASH_MS
 *   printer.estop        a red flash on every control
 *
 * Two agents on one control stack. Times are this browser's clock when the
 * event arrived: `at` is to the second, and the console's clock isn't ours.
 */
import type { ActionTarget, AgentActionEvent, AgentPhase } from './types'

export const CONTROL_IDS = ['home', 'jog', 'hotend', 'bed', 'fans', 'print-start'] as const
export type ControlId = typeof CONTROL_IDS[number]

export const ACTIVE_MS = 120_000
export const BADGE_MS = 2_000
export const FLASH_MS = 1_500

export type Look = 'asked' | 'approved' | 'denied' | 'active' | 'failed' | 'estop'

export interface Highlight {
  /** One per agent per control: `${agentKey}|${controlId}`. */
  key: string;
  controlId: ControlId;
  deviceId: string;
  /** Null for the console's own safety watch. */
  agentId: string | null;
  agentName: string;
  colour: string | null;
  colourIndex: number | null;
  action: string;
  phase: AgentPhase;
  look: Look;
  /** When this look began (ms, this browser's clock). */
  since: number;
  /** When it goes by itself (ms). */
  until: number;
}

export interface ActivityState {
  /** The SSE id of the last event applied: an older or repeated one is dropped. */
  lastId: number | null;
  entries: Highlight[];
}

export const emptyActivity = (): ActivityState => ({ lastId: null, entries: [] })

/** What the brief calls "Muon3D safety": an event with no agent (the heater-timeout watch). */
export const SAFETY_NAME = 'Muon3D safety'
/** An agent with no name. */
export const AGENT_NAME = 'Agent'

const heaterControl = (heater: unknown): ControlId | null =>
  heater === 'extruder' ? 'hotend' : heater === 'heater_bed' ? 'bed' : null

/** The controls an action lights. Unknown actions and reads light none. */
export function controlsFor (action: string, target: ActionTarget | undefined): ControlId[] {
  switch (action) {
    case 'printer.home': return ['home']
    case 'printer.move': return ['jog']
    case 'printer.start':
    case 'printer.pause':
    case 'printer.cancel': return ['print-start']
    case 'printer.estop': return [...CONTROL_IDS]
    case 'printer.heat': {
      const targets = Array.isArray(target) ? target : target ? [target] : []
      const ids = targets
        .map(t => heaterControl((t as { heater?: unknown }).heater))
        .filter((id): id is ControlId => id !== null)
      // A heat that names no heater: both, rather than none.
      if (!targets.length) return ['hotend', 'bed']
      return [...new Set(ids)]
    }
    default: return []
  }
}

function lookFor (action: string, phase: string): { look: Look, ms: number } | 'clear' | null {
  if (action === 'printer.estop') {
    if (phase === 'started' || phase === 'finished' || phase === 'failed') return { look: 'estop', ms: FLASH_MS }
  }
  switch (phase) {
    case 'asked': return { look: 'asked', ms: ACTIVE_MS }
    case 'approved': return { look: 'approved', ms: BADGE_MS }
    case 'denied': return { look: 'denied', ms: BADGE_MS }
    case 'started': return { look: 'active', ms: ACTIVE_MS }
    case 'failed': return { look: 'failed', ms: FLASH_MS }
    case 'finished': return 'clear'
    default: return null
  }
}

const idOf = (id: string | number | null | undefined): number | null => {
  if (id === null || id === undefined || id === '') return null
  const n = typeof id === 'number' ? id : Number(id)
  return Number.isFinite(n) ? n : null
}

/**
 * `event` applied at `now`. `id` is the SSE id: an event at or below the last
 * one applied is a replay and changes nothing.
 */
export function applyEvent (state: ActivityState, event: AgentActionEvent, id: string | number | null, now: number): ActivityState {
  const n = idOf(id)
  if (n !== null && state.lastId !== null && n <= state.lastId) return state
  const lastId = n ?? state.lastId
  const deviceId = event.printer?.device_id?.toLowerCase()
  if (!deviceId || event.action === 'printer.read') return { ...state, lastId }
  const next = lookFor(event.action, event.phase)
  const controls = controlsFor(event.action, event.target)
  if (!next || !controls.length) return { ...state, lastId }
  const agentKey = event.agent ? `agent:${event.agent.id}` : 'safety'
  const keys = new Set(controls.map(c => `${agentKey}|${deviceId}|${c}`))
  const kept = state.entries.filter(e => !keys.has(e.key))
  if (next === 'clear') return { lastId, entries: kept }
  const added: Highlight[] = controls.map(controlId => ({
    key: `${agentKey}|${deviceId}|${controlId}`,
    controlId,
    deviceId,
    agentId: event.agent?.id ?? null,
    agentName: event.agent ? (event.agent.name?.trim() || AGENT_NAME) : SAFETY_NAME,
    colour: event.agent?.colour ?? null,
    colourIndex: typeof event.agent?.colour_index === 'number' ? event.agent.colour_index : null,
    action: event.action,
    phase: event.phase as AgentPhase,
    look: next.look,
    since: now,
    until: now + next.ms
  }))
  return { lastId, entries: [...kept, ...added] }
}

/** The looks that have run their time at `now`, gone. */
export function prune (state: ActivityState, now: number): ActivityState {
  const entries = state.entries.filter(e => e.until > now)
  return entries.length === state.entries.length ? state : { ...state, entries }
}

/** Everything an agent shows, gone: it was revoked. */
export function dropAgent (state: ActivityState, agentId: string): ActivityState {
  return { ...state, entries: state.entries.filter(e => e.agentId !== agentId) }
}

/** When the next look runs out, or null. */
export function nextExpiry (state: ActivityState): number | null {
  return state.entries.reduce<number | null>((min, e) => (min === null || e.until < min ? e.until : min), null)
}

export interface ControlActivity {
  /** The newest of `stack`, the brief's `{ agentName, colour, colourIndex, phase, since }`. */
  agentName: string;
  colour: string | null;
  colourIndex: number | null;
  phase: AgentPhase;
  look: Look;
  since: number;
  /** Everyone on this control, oldest first: two agents at once stack their names. */
  stack: Highlight[];
}

export type AgentActivity = Partial<Record<ControlId, ControlActivity>>

/** `agentActivity` for the printer with `deviceId`, at `now`. */
export function activityFor (state: ActivityState, deviceId: string | null, now: number): AgentActivity {
  const out: AgentActivity = {}
  if (!deviceId) return out
  const id = deviceId.toLowerCase()
  const live = state.entries.filter(e => e.deviceId === id && e.until > now).sort((a, b) => a.since - b.since)
  for (const e of live) {
    const stack = [...(out[e.controlId]?.stack ?? []), e]
    out[e.controlId] = { agentName: e.agentName, colour: e.colour, colourIndex: e.colourIndex, phase: e.phase, look: e.look, since: e.since, stack }
  }
  return out
}
