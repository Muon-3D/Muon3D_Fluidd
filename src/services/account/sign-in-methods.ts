/**
 * The sign-in card's methods (KAN-6114, spec docs/control/sign-in.md 4.3-4.5, 4.8-4.9):
 * the provider list, the order, the "Last used" memory and the passkey-nudge
 * snooze. Nothing here talks to the console.
 *
 * What is remembered is the METHOD only, on this origin: never the address,
 * an account id, a name or a time. Every storage call is wrapped, so a
 * browser that blocks storage simply shows the first-visit card each time.
 */
import type { ConsoleConfig } from './api'

export type MethodId = 'passkey' | 'email' | 'google' | 'apple' | 'github' | 'microsoft'

export interface Provider {
  id: Exclude<MethodId, 'passkey' | 'email'>;
  label: string;
  icon: string;
  /** True once this provider's browser flow is built. Today none is. */
  webFlow: boolean;
}

export const PROVIDERS: Provider[] = [
  { id: 'google', label: 'Google', icon: 'google', webFlow: false },
  { id: 'apple', label: 'Apple', icon: 'apple', webFlow: false },
  { id: 'github', label: 'GitHub', icon: 'github', webFlow: false },
  { id: 'microsoft', label: 'Microsoft', icon: 'microsoft', webFlow: false }
]

/** 'on' when the web flow is built AND the console says the provider is configured; otherwise 'soon'. */
export function providerState (provider: Provider, config: ConsoleConfig | null | undefined): 'on' | 'soon' {
  const social = (config?.social ?? {}) as Record<string, boolean | undefined>
  return provider.webFlow && social[provider.id] === true ? 'on' : 'soon'
}

/** The name a surface shows as "continuing to ...": from a fixed map, never from the URL. */
export const SURFACES: Record<string, string> = {
  fluidd: 'Control',
  slicer: 'Slicer',
  models: 'Models',
  library: 'Library'
}

/** The surface a validated `/authorize?...` continue path is for, or null (unknown client, none). */
export function surfaceOf (continuePath: string | null | undefined): string | null {
  if (!continuePath) return null
  try {
    const clientId = new URL(continuePath, 'https://console.invalid').searchParams.get('client_id')
    return clientId && Object.prototype.hasOwnProperty.call(SURFACES, clientId) ? SURFACES[clientId] : null
  } catch {
    return null
  }
}

/** True when the sign-in must not be answered silently: `prompt=login` in the carried request. */
export function forcesPrompt (continuePath: string | null | undefined): boolean {
  if (!continuePath) return false
  try {
    const prompt = new URL(continuePath, 'https://console.invalid').searchParams.get('prompt') ?? ''
    return prompt.split(' ').includes('login')
  } catch {
    return false
  }
}

export const LAST_KEY = 'muon.signin.last'
export const NUDGE_KEY = 'muon.signin.passkeyNudge'
const METHODS: MethodId[] = ['passkey', 'email', 'google', 'apple', 'github', 'microsoft']

function read (key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write (key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage blocked: the card is the first-visit card every time */ }
}

/** The method used last time, or null (missing, unreadable, unknown version, unknown method). */
export function readLastMethod (): MethodId | null {
  const value = read(LAST_KEY) as { v?: unknown, method?: unknown } | null
  if (!value || value.v !== 1 || typeof value.method !== 'string') return null
  return METHODS.includes(value.method as MethodId) ? value.method as MethodId : null
}

/** Remembers the method, and nothing else. */
export function writeLastMethod (method: MethodId) {
  write(LAST_KEY, { v: 1, method })
}

export function nudgeSnoozed (now = Date.now()): boolean {
  const value = read(NUDGE_KEY) as { v?: unknown, until?: unknown } | null
  if (!value || value.v !== 1) return false
  if (value.until === null) return true
  return typeof value.until === 'number' && value.until > now
}

/** `days` from now, or null for "never again on this device". */
export function snoozeNudge (days: number | null, now = Date.now()) {
  write(NUDGE_KEY, { v: 1, until: days === null ? null : now + days * 86400000 })
}

export interface OrderInput {
  passkeys: boolean;
  last: MethodId | null;
  /** Providers that are 'on': full-width buttons after email. */
  on: MethodId[];
}

/**
 * The methods drawn as blocks, first to last: passkey, email, then the
 * providers that are on. The last-used one, if it is among them, moves first.
 * (The greyed providers are a grid at the bottom, never in this list.)
 */
export function orderMethods (input: OrderInput): MethodId[] {
  const list: MethodId[] = [...(input.passkeys ? ['passkey' as const] : []), 'email', ...input.on]
  if (input.last && list.includes(input.last)) return [input.last, ...list.filter(m => m !== input.last)]
  return list
}
