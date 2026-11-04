/** NET-17 close code `unauthorised`: the key is fine, but the printer holds no standing for it. */
export const CLOSE_UNAUTHORISED = 0x040a
/** NET-17 `expired`: the access that admitted this key ran out. */
export const CLOSE_EXPIRED = 0x040b
/** NET-17 `revoked`: the printer's owner removed this key. */
export const CLOSE_REVOKED = 0x0403

/** Why the printer does not let this browser in; Control can offer to pair in each case. */
export type PairableRefusal = 'unknown' | 'expired' | 'revoked'

/**
 * Which pairable refusal the wasm client rejected with (`kind: 'refused'` and
 * the NET-17 `code`), or null for anything else: a policy refusal, a network
 * error, or a console error (a `CloudError` with an HTTP status, so a console
 * 401 or 403 never matches). The panel stays the gate: the
 * offer starts a ceremony that only a person at the printer can finish.
 */
export function pairableRefusal (error: unknown): PairableRefusal | null {
  const e = error as { kind?: unknown, code?: unknown } | null
  if (!e || typeof e !== 'object' || e.kind !== 'refused') return null
  if (e.code === CLOSE_UNAUTHORISED) return 'unknown'
  if (e.code === CLOSE_EXPIRED) return 'expired'
  if (e.code === CLOSE_REVOKED) return 'revoked'
  return null
}
