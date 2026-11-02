/** NET-17 close code `unauthorised`: the key is fine, but the printer holds no standing for it. */
export const CLOSE_UNAUTHORISED = 0x040a

/**
 * True when the printer refused this browser's key as a stranger: the wasm
 * client rejects with `kind: 'refused'` and the NET-17 `code`. Nothing from
 * the Muon3D console looks like this (a console refusal is a `CloudError`
 * with an HTTP status), so a 401 or 403 from the console never matches.
 */
export function isUnauthorisedRefusal (error: unknown): boolean {
  const e = error as { kind?: unknown, code?: unknown } | null
  return !!e && typeof e === 'object' && e.kind === 'refused' && e.code === CLOSE_UNAUTHORISED
}
