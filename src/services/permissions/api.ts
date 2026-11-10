/**
 * Settings › Security (KAN-1926): who may do each security-sensitive thing
 * on this printer, one row per setting the printer reports. The printer
 * owns the list and enforces every value; Control shows what it says, sends
 * the owner's choice, and shows the printer's refusal as it gives it.
 *
 * Assumed shape (no device route merged yet; see the PR):
 *   GET  /server/aux/permissions
 *     -> { knobs: [{ id, label?, description?, value, values?, read_only? }] }
 *   POST /server/aux/permissions { id, value }
 *     -> 200 { knob }                         applied
 *     -> 202 { consent_required: true, ... }  waits for a knob press
 *     -> 403 { error: { message } }           refused (only at the printer)
 * `value` is one of anyone | owner | owner_at_printer.
 */
import { PANEL_ONLY_NOTE } from '@/services/wifi/panel-only'

export const PERMISSIONS_PATH = '/server/aux/permissions'

export type PermissionValue = 'anyone' | 'owner' | 'owner_at_printer'

export const PERMISSION_VALUES: PermissionValue[] = ['anyone', 'owner', 'owner_at_printer']

export const VALUE_LABELS: Record<PermissionValue, string> = {
  anyone: 'Anyone',
  owner: 'Owner',
  owner_at_printer: 'Owner, at the printer'
}

export interface PermissionKnob {
  id: string;
  label: string;
  description: string;
  value: PermissionValue;
  /** The values this printer accepts for it, in order. */
  values: PermissionValue[];
  /** Shown, never changed from here (developer mode is entered at the panel). */
  readOnly: boolean;
}

/** Control's words for the settings it knows; anything else shows as the printer names it. */
export const KNOWN_KNOBS: Record<string, { label: string, description: string }> = {
  hotspot_toggle: { label: 'Turn the hotspot on or off', description: 'From a phone or computer, not the printer.' },
  hotspot_change: { label: "Change the hotspot's name or password", description: 'From a phone or computer, not the printer.' },
  wifi_change: { label: 'Join or forget Wi-Fi networks', description: 'From a phone or computer, not the printer.' },
  update_install: { label: 'Install updates', description: 'Including whether the printer asks for a knob press first.' },
  new_device_requests: { label: 'Accept requests from new devices', description: 'A phone or computer asking to use this printer.' },
  hotspot_password_on_screen: { label: "Show the hotspot password on the printer's screen", description: 'Anyone standing at the printer can read it.' },
  lockdown: { label: 'Lockdown', description: 'Turn Lockdown on or off.' },
  dev_mode: { label: 'Turn on developer mode', description: "Only at the printer's screen." }
}

const isValue = (v: unknown): v is PermissionValue => typeof v === 'string' && (PERMISSION_VALUES as string[]).includes(v)

const unwrap = (data: unknown): unknown => (data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data)

/** One reported setting, or null when it isn't usable. */
export function parseKnob (raw: unknown): PermissionKnob | null {
  if (!raw || typeof raw !== 'object') return null
  const k = raw as Record<string, unknown>
  if (typeof k.id !== 'string' || !k.id || !isValue(k.value)) return null
  const known = KNOWN_KNOBS[k.id]
  const values = Array.isArray(k.values) ? k.values.filter(isValue) : []
  return {
    id: k.id,
    label: (typeof k.label === 'string' && k.label) || known?.label || k.id,
    description: (typeof k.description === 'string' && k.description) || known?.description || '',
    value: k.value,
    values: values.length ? values : PERMISSION_VALUES,
    readOnly: k.read_only === true
  }
}

/** Every setting the printer reports, in its order. */
export function parseKnobs (data: unknown): PermissionKnob[] | null {
  const body = unwrap(data)
  const list = Array.isArray(body) ? body : (body as { knobs?: unknown } | null)?.knobs
  if (!Array.isArray(list)) return null
  return list.map(parseKnob).filter((k): k is PermissionKnob => k !== null)
}

export type ChangeOutcome =
  | { kind: 'applied', knob: PermissionKnob | null }
  | { kind: 'knob' }
  | { kind: 'panel' }
  | { kind: 'refused', message: string }

export const KNOB_NOTE = 'Press the knob on the printer to confirm'

/** What the printer's answer to a change means. */
export function changeOutcome (status: number, data: unknown): ChangeOutcome {
  const body = unwrap(data) as Record<string, unknown> | null | undefined
  if (status === 202 || body?.consent_required === true) return { kind: 'knob' }
  if (status >= 200 && status < 300) return { kind: 'applied', knob: parseKnob(body?.knob ?? body) }
  const message = (body?.error as { message?: unknown } | undefined)?.message
  // A 403 that isn't network protection is the printer keeping this to its own screen, as Wi-Fi does.
  if (status === 403 && !(typeof message === 'string' && /protected/i.test(message))) return { kind: 'panel' }
  return { kind: 'refused', message: typeof message === 'string' && message ? message : "The printer didn't take that change." }
}

/** What a row says after its change. */
export function outcomeNote (o: ChangeOutcome): string {
  if (o.kind === 'knob') return `${KNOB_NOTE}. The setting changes when you do.`
  if (o.kind === 'panel') return `${PANEL_ONLY_NOTE}: this printer only lets its own screen change this.`
  if (o.kind === 'refused') return o.message
  return ''
}
