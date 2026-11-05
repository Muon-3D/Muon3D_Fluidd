/**
 * setInterval for background refreshes: a tab nobody is looking at skips its
 * turns instead of asking the printer or the cloud, and refreshes once on
 * return if it missed any. Returns a function that stops it.
 */
export function visibleInterval (fn: () => void, ms: number): () => void {
  let missed = false
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'hidden') {
      missed = true
      return
    }
    fn()
  }, ms)
  const onVisible = () => {
    if (document.visibilityState === 'hidden' || !missed) return
    missed = false
    fn()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
