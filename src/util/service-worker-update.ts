/** Refresh the worker before recovering a stale chunk; never hold navigation forever. */
export function refreshServiceWorker (
  container: Pick<ServiceWorkerContainer, 'getRegistration'> | null = typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? navigator.serviceWorker : null,
  timeoutMs = 5000
): Promise<void> {
  if (!container) return Promise.resolve()
  return new Promise(resolve => {
    let finished = false
    let unlisten = () => {}
    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      unlisten()
      resolve()
    }
    const timer = setTimeout(finish, timeoutMs)
    ;(async () => {
      const registration = await container.getRegistration()
      if (finished) return
      if (!registration) return finish()
      await registration.update()
      if (finished) return
      const worker = registration.waiting ?? registration.installing
      if (!worker) return finish()
      let requested = false
      const changed = () => {
        if (worker.state === 'activated' || worker.state === 'redundant') return finish()
        if (worker.state === 'installed' && !requested) {
          requested = true
          worker.postMessage({ type: 'SKIP_WAITING' })
        }
      }
      worker.addEventListener('statechange', changed)
      unlisten = () => worker.removeEventListener('statechange', changed)
      changed()
    })().catch(finish)
  })
}

/**
 * Applies a waiting service worker without waiting for a click on the toast
 * (KAN-1279: a tab kept the old bundle for a week because nobody pressed
 * Reload). It runs `apply` now when nothing is in flight, else as soon as
 * `busy` turns false. Returns whether it ran at once; `cancel` stops a wait.
 */
export function applyUpdateWhenIdle (
  busy: () => boolean,
  apply: () => void,
  pollMs = 500
): { immediate: boolean, cancel: () => void } {
  if (!busy()) {
    apply()
    return { immediate: true, cancel: () => {} }
  }
  const timer = setInterval(() => {
    if (busy()) return
    clearInterval(timer)
    apply()
  }, pollMs)
  return { immediate: false, cancel: () => clearInterval(timer) }
}
