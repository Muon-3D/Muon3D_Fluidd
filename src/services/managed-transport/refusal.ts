/** A request refusal says nothing about the connection carrying it. */
export function requestRefused (error: unknown): boolean {
  const e = error as { status?: number, code?: number, kind?: string, message?: string, response?: { status?: number } } | null
  if (!e) return false
  const status = e.response?.status ?? e.status ?? e.code
  return status === 401 || status === 403 || e.kind === 'refused' ||
    /policy refused|denied for every role|not on the remote allowlist|permission_restricted/i.test(e.message ?? String(error))
}

/**
 * muon-link's own policy refusing a request for this role: "not on the remote allowlist; unlisted endpoints are
 * Owner-only by default", "only the owner is forwarded". It says what this person may not ask, never that the
 * printer is down or protected.
 */
export function policyRefusedText (text: unknown): boolean {
  return typeof text === 'string' && /remote allowlist|owner-only|only the owner is forwarded/i.test(text)
}

/** A JSON-RPC or HTTP error that is muon-link's Owner-only policy refusal (any code, the words decide). */
export function policyRefusal (error: unknown): boolean {
  const e = error as { message?: unknown, error?: unknown, response?: { data?: unknown } } | null
  if (!e) return false
  const data = e.response?.data as { error?: unknown } | string | undefined
  return [e.message, typeof e.error === 'string' ? e.error : (e.error as { message?: unknown } | undefined)?.message,
    typeof data === 'string' ? data : typeof data?.error === 'string' ? data.error : (data?.error as { message?: unknown } | undefined)?.message]
    .some(policyRefusedText)
}
