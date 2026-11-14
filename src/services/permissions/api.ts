/**
 * Settings > Security (KAN-1926, KAN-2189): who may do each security-sensitive
 * thing on this printer, one row per setting the printer reports. The printer
 * owns the list and enforces every value; Control shows what it says, sends
 * the owner's choice, and shows the printer's refusal in its own words.
 *
 * Contract (MuonOS docs/connectivity/PERMISSIONS.md, muon-link NETWORK_ROUTES.md):
 *   GET  <base>                -> { claimed, knobs: [{ id, label?, description?, value, values?, default?, read_only?, fixed? }],
 *                                   switches: [{ id, label?, description?, value: boolean, default?, read_only? }] }
 *   POST <base> { id, value }          -> 200 { knob }
 *   POST <base>/switch { id, value }   -> 200 { switch }
 *   403 { detail: { code, message, allowed?, required? } }   refused
 * <base> is /server/aux/permissions on the LAN and /muon-link/permissions on a
 * managed (cloud) session, where /server/aux is refused for everyone.
 * A printer from before the contract (three values, no `claimed`) is still read:
 * its developer-mode row stays printer-only, and a 202 means a knob press.
 */
export const PERMISSIONS_PATH = '/server/aux/permissions'
export const MANAGED_PERMISSIONS_PATH = '/muon-link/permissions'

/** The route's base path: managed sessions go over muon-link. */
export const permissionsPath = (managed: boolean): string => (managed ? MANAGED_PERMISSIONS_PATH : PERMISSIONS_PATH)
export const switchPath = (managed: boolean): string => `${permissionsPath(managed)}/switch`

export type PermissionValue = 'anyone' | 'owner_and_shared' | 'owner' | 'owner_at_printer'

export const PERMISSION_VALUES: PermissionValue[] = ['anyone', 'owner_and_shared', 'owner', 'owner_at_printer']

export const VALUE_LABELS: Record<PermissionValue, string> = {
  anyone: 'Anyone',
  owner_and_shared: 'Owner and shared users',
  owner: 'Owner',
  owner_at_printer: 'Owner, at the printer'
}

export interface PermissionKnob {
  id: string;
  label: string;
  description: string;
  /** One of PERMISSION_VALUES, or a value this Control doesn't know yet. */
  value: string;
  /** The values this printer accepts for it, in order. */
  values: string[];
  /** This session may not change it (per caller, as the printer says), or it is fixed. */
  readOnly: boolean;
  /** Always done at the printer ("Printer only"), whoever asks. */
  fixed: boolean;
  /** Its value is one Control doesn't know: shown as the printer reports it, never offered as a choice. */
  generic: boolean;
  /** What it is when nobody has changed it; '' when the printer doesn't say and Control can't. */
  defaultValue: string;
}

export interface PermissionSwitch {
  id: string;
  label: string;
  description: string;
  value: boolean;
  defaultValue: boolean | null;
  readOnly: boolean;
}

export interface PermissionList {
  /** Null when the printer doesn't say (a printer from before the contract). */
  claimed: boolean | null;
  knobs: PermissionKnob[];
  switches: PermissionSwitch[];
}

/** Control's words for the settings it knows; anything else shows as the printer names it. */
export const KNOWN_KNOBS: Record<string, { label: string, description: string }> = {
  hotspot_toggle: { label: 'Turn the hotspot on or off', description: 'From a phone or computer, not the printer.' },
  hotspot_change: { label: "Change the hotspot's name or password", description: 'From a phone or computer, not the printer.' },
  wifi_change: { label: 'Join or forget Wi-Fi networks', description: 'From a phone or computer, not the printer.' },
  update_install: { label: 'Install updates', description: 'Including whether the printer asks for a knob press first.' },
  plate_clear: { label: 'Confirm the plate is clear', description: 'After a print, from Control or other software.' },
  dev_mode: { label: 'Turn developer mode back on', description: "After the first time, which is at the printer's screen." },
  dev_mode_first_entry: { label: 'The first time developer mode is turned on', description: "Confirmed on the printer's screen, with the warranty waiver. After that it is an ordinary setting." },
  lockdown: { label: 'Lockdown', description: 'Turn Lockdown on or off.' }
}

const isValue = (v: unknown): v is PermissionValue => typeof v === 'string' && (PERMISSION_VALUES as string[]).includes(v)

/**
 * Printer only, whatever `fixed` says (a malformed flag must never give them a control): the first
 * developer-mode entry. `dev_mode` itself is an ordinary setting only when the list also has
 * `dev_mode_first_entry`; without it the printer is older than the contract (or sends no `fixed`),
 * and developer mode stays at the printer's screen.
 */
const ALWAYS_PRINTER_ONLY = new Set(['dev_mode_first_entry'])

/** Settings that are not a "who may" choice and so have no default shown. */
const NO_DEFAULT = new Set(['lockdown', 'dev_mode'])

/** A value in words: Control's for the ones it knows, the printer's id made readable for the rest. */
export function valueLabel (value: string): string {
  if (isValue(value)) return VALUE_LABELS[value]
  const words = value.replace(/[_-]+/g, ' ').trim()
  return words ? words[0].toUpperCase() + words.slice(1) : value
}

const unwrap = (data: unknown): unknown => (data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data)

/** One reported setting, or null when it isn't usable. A printer with no `default` is open whether or not it is claimed (train 13); its own `default` always wins. */
export function parseKnob (raw: unknown, devModeLocked = false): PermissionKnob | null {
  if (!raw || typeof raw !== 'object') return null
  const k = raw as Record<string, unknown>
  if (typeof k.id !== 'string' || !k.id || typeof k.value !== 'string' || !k.value) return null
  const known = KNOWN_KNOBS[k.id]
  const generic = !isValue(k.value)
  const fixed = k.fixed === true || ALWAYS_PRINTER_ONLY.has(k.id) || (devModeLocked && k.id === 'dev_mode')
  const listed = Array.isArray(k.values) ? k.values.filter((v): v is string => typeof v === 'string' && !!v) : []
  const fallback = known && !fixed && !NO_DEFAULT.has(k.id) ? 'anyone' : ''
  return {
    id: k.id,
    label: (typeof k.label === 'string' && k.label) || known?.label || k.id,
    description: (typeof k.description === 'string' && k.description) || known?.description || '',
    value: k.value,
    values: listed.length ? listed : PERMISSION_VALUES,
    readOnly: k.read_only === true || fixed || generic,
    fixed,
    generic,
    defaultValue: fixed ? '' : typeof k.default === 'string' && k.default ? k.default : fallback
  }
}

/** One reported switch, or null when it isn't usable. */
export function parseSwitch (raw: unknown): PermissionSwitch | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.id !== 'string' || !s.id || typeof s.value !== 'boolean') return null
  return {
    id: s.id,
    label: (typeof s.label === 'string' && s.label) || s.id.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()),
    description: typeof s.description === 'string' ? s.description : '',
    value: s.value,
    defaultValue: typeof s.default === 'boolean' ? s.default : null,
    readOnly: s.read_only === true
  }
}

/** Everything the printer reports, in its order; null when the answer isn't a list. */
export function parsePermissions (data: unknown): PermissionList | null {
  const body = unwrap(data)
  const object = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null
  const list = Array.isArray(body) ? body : object?.knobs
  if (!Array.isArray(list)) return null
  const claimed = typeof object?.claimed === 'boolean' ? object.claimed : null
  const devModeLocked = !list.some(k => (k as { id?: unknown } | null)?.id === 'dev_mode_first_entry')
  const switches = Array.isArray(object?.switches) ? object.switches.map(parseSwitch).filter((x): x is PermissionSwitch => x !== null) : []
  return {
    claimed,
    knobs: list.map(k => parseKnob(k, devModeLocked)).filter((k): k is PermissionKnob => k !== null),
    switches
  }
}

/** Every setting the printer reports, in its order. */
export function parseKnobs (data: unknown): PermissionKnob[] | null {
  return parsePermissions(data)?.knobs ?? null
}

export type ChangeOutcome =
  | { kind: 'applied', knob: PermissionKnob | null }
  | { kind: 'switch', value: PermissionSwitch | null }
  | { kind: 'knob' }
  | { kind: 'refused', message: string, code: string }

export const KNOB_NOTE = 'Press the knob on the printer to confirm'

/** The printer's words for a refusal: detail.message, else the older error.message. */
export function refusal (body: Record<string, unknown> | null | undefined): { message: string, code: string } {
  const detail = (body?.detail && typeof body.detail === 'object' ? body.detail : null) as Record<string, unknown> | null
  const error = (body?.error && typeof body.error === 'object' ? body.error : null) as Record<string, unknown> | null
  const message = [detail?.message, error?.message].find((m): m is string => typeof m === 'string' && !!m)
  const code = [detail?.code, typeof body?.error === 'string' ? body.error : undefined, error?.code].find((c): c is string => typeof c === 'string' && !!c)
  return { message: message ?? "The printer didn't take that change.", code: code ?? '' }
}

/** What the printer's answer to a change means. A 2xx without the knob is `applied` with `knob: null`: read it again. */
export function changeOutcome (status: number, data: unknown): ChangeOutcome {
  const body = unwrap(data) as Record<string, unknown> | null | undefined
  if (status === 202 || body?.consent_required === true) return { kind: 'knob' }
  if (status >= 200 && status < 300) return { kind: 'applied', knob: parseKnob(body?.knob ?? body) }
  return { kind: 'refused', ...refusal(body) }
}

/** What the printer's answer to a switch change means. */
export function switchOutcome (status: number, data: unknown): ChangeOutcome {
  const body = unwrap(data) as Record<string, unknown> | null | undefined
  if (status >= 200 && status < 300) return { kind: 'switch', value: parseSwitch(body?.switch ?? body) }
  return { kind: 'refused', ...refusal(body) }
}

/** What a row says after its change. */
export function outcomeNote (o: ChangeOutcome): string {
  if (o.kind === 'knob') return `${KNOB_NOTE}. The setting changes when you do.`
  if (o.kind === 'refused') return o.message
  return ''
}
