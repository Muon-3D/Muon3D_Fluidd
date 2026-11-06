/**
 * The console's agent activity contract (KAN-1359 Phase A, frozen 3 Nov:
 * Muon_Internal_Documentation devin-briefs/AGENT-EVENTS-SSE.md). Version 1.
 */

/** Who acted. Null for the console's own heater-timeout watch. */
export interface AgentRef {
  id: string;
  name: string;
  /** The palette hex, a fallback only: Control themes from `colour_index`. */
  colour: string | null;
  /** 0-7, or null (a pilot token). */
  colour_index: number | null;
  provider: string;
}

export interface AgentPrinter {
  id: string;
  name: string;
  /** The 64-hex id `/v1/printers` uses: what Control matches the open printer by. */
  device_id: string;
}

export type AgentAction =
  | 'printer.home'
  | 'printer.move'
  | 'printer.heat'
  | 'printer.start'
  | 'printer.pause'
  | 'printer.cancel'
  | 'printer.estop'
  | 'printer.read'

export type AgentPhase = 'requested' | 'asked' | 'approved' | 'denied' | 'started' | 'finished' | 'failed'

export type HeatTarget = { heater: 'extruder' | 'heater_bed' | string, target_c: number }

export type ActionTarget =
  | { axes: string }
  | HeatTarget
  | HeatTarget[]
  | { move: { x?: number, y?: number, z?: number, relative?: boolean } }
  | null

/** `event: agent.action`. */
export interface AgentActionEvent {
  v: number;
  at: string;
  agent: AgentRef | null;
  printer: AgentPrinter | null;
  action: AgentAction | string;
  phase: AgentPhase | string;
  ask_id: string | null;
  target: ActionTarget;
  /** A fixed text per code, safe to show. */
  error: { code: string, message: string } | null;
}

/** `event: agent.revoked` (and `agent.connected`, `agent.grant_changed`). */
export interface AgentGrantEvent {
  v: number;
  at: string;
  agent: AgentRef | null;
  printers: AgentPrinter[];
}

export type ConnectionStatus = 'active' | 'paused' | 'expired' | 'revoked' | string

/** One row of `GET /v1/agents` → `connections`. */
export interface AgentConnection {
  agent: AgentRef | null;
  printers: AgentPrinter[];
  expires_at: string | null;
  last_active_at: string | null;
  status: ConnectionStatus;
  grant: Record<string, unknown> | null;
  /** `client_uri` is what the client registered for itself: text, never a link. */
  client: { id: string, name: string | null, client_uri: string | null } | null;
}
