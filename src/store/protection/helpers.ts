import { LEVEL_OPEN, LEVEL_PROTECTED, type ProtectionStatus } from './types'

/**
 * Moonraker's `server.muon.get_protection` result, or `null` if it is not one.
 *
 * Refuses anything but exactly 0 or 1. A notice drawn from a guess is worse
 * than none: `true` or "1" must not render as "protected", and a level this
 * build does not know must not render as "open".
 */
export const parseProtectionStatus = (payload: unknown): ProtectionStatus | null => {
  if (!payload || typeof payload !== 'object') return null
  const value = payload as Record<string, unknown>
  const level = value.level
  if (level !== LEVEL_OPEN && level !== LEVEL_PROTECTED) return null
  const strings = (list: unknown) =>
    Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : []
  return {
    level,
    name: typeof value.name === 'string' ? value.name : '',
    protectedSurfaces: strings(value.protected_surfaces),
    excludedSurfaces: strings(value.excluded_surfaces),
    callerHasIdentity: value.caller_has_identity === true,
    changeableByCaller: value.changeable_by_caller === true
  }
}

/**
 * What Level 1 takes back, as Moonraker's `muon_floor` defines it. Used only
 * until Moonraker's own list has arrived; after that its answer is the rule.
 */
export const DEFAULT_PROTECTED_SURFACES = ['/server/aux', '/machine/update']
export const DEFAULT_EXCLUDED_SURFACES = ['/server/aux/dev_mode']

const matches = (path: string, prefixes: string[]) =>
  prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))

/**
 * Is `path` -- an HTTP path like `/server/aux/wifi/scan` or a JSON-RPC method
 * like `machine.update.status` -- one of the surfaces Level 1 protects?
 *
 * The same rule as Moonraker's `muon_floor._matches`: a prefix matches itself
 * and anything below it, never a sibling that merely shares its spelling.
 */
export const isProtectedSurface = (status: ProtectionStatus | null, path: string): boolean => {
  const endpoint = path.startsWith('/') ? path : '/' + path.split('.').join('/')
  const protectedSurfaces = status?.protectedSurfaces ?? DEFAULT_PROTECTED_SURFACES
  const excludedSurfaces = status?.excludedSurfaces ?? DEFAULT_EXCLUDED_SURFACES
  return matches(endpoint, protectedSurfaces) && !matches(endpoint, excludedSurfaces)
}

/**
 * Is `path` one the level takes away from this browser right now?
 */
export const isLockedPath = (status: ProtectionStatus | null, path: string): boolean => {
  if (!status || status.level !== LEVEL_PROTECTED || status.callerHasIdentity) return false
  return isProtectedSurface(status, path)
}

/**
 * The reason a Moonraker HTTP call failed, in the words Moonraker used.
 *
 * Moonraker answers `{ error: { message } }`; the Aux API behind it answers
 * FastAPI's `{ detail }`. Either is better than a status line: SEC-8's refusal
 * says which surface is protected and where the setting is changed, and
 * "Forbidden" says neither.
 */
export const moonrakerErrorMessage = (error: unknown): string => {
  const e = error as {
    response?: { data?: { error?: { message?: unknown }, detail?: unknown }, statusText?: unknown },
    message?: unknown
  } | null
  const candidates = [
    e?.response?.data?.error?.message,
    e?.response?.data?.detail,
    e?.response?.statusText,
    e?.message
  ]
  const found = candidates.find(item => typeof item === 'string' && item.trim() !== '')
  return typeof found === 'string' ? found : String(error)
}
