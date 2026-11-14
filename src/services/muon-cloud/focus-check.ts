/**
 * KAN-1389: a signed-in tab asks the console whether the session still stands
 * when it becomes visible or gets focus, whether or not cloud polling was ever
 * started (a tab on an Account page does not poll). One cheap call, at most
 * once every FOCUS_CHECK_MS. A refusal is handled where every refusal is
 * (`request()` in api.ts); an error that is not a refusal is ignored.
 */
export const FOCUS_CHECK_MS = 30_000

let lastCheck = 0

/** For tests. */
export function resetFocusCheck () {
  lastCheck = 0
}

/** Runs the check now if signed in and the last one was long enough ago. */
export function checkOnFocus (signedIn: () => boolean, check: () => Promise<unknown>, now = Date.now()): boolean {
  if (!signedIn()) return false
  if (lastCheck && now - lastCheck < FOCUS_CHECK_MS && now >= lastCheck) return false
  lastCheck = now
  check().catch(() => { /* not reachable, or a transient refusal: the session stands */ })
  return true
}

/** Listens for the tab coming back. Returns the stop function. */
export function watchFocus (signedIn: () => boolean, check: () => Promise<unknown>): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}
  const onVisible = () => { if (document.visibilityState === 'visible') checkOnFocus(signedIn, check) }
  const onFocus = () => { checkOnFocus(signedIn, check) }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onFocus)
  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onFocus)
  }
}
