/** A request refusal says nothing about the connection carrying it. */
export function requestRefused (error: unknown): boolean {
  const e = error as { status?: number, code?: number, kind?: string, message?: string, response?: { status?: number } } | null
  if (!e) return false
  const status = e.response?.status ?? e.status ?? e.code
  return status === 401 || status === 403 || e.kind === 'refused' ||
    /policy refused|denied for every role|not on the remote allowlist/i.test(e.message ?? String(error))
}
