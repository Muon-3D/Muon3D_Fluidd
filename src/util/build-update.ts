/**
 * Notices that the server has a newer build than the one running (I-159).
 * The service worker alone cannot be trusted to say so: a tab can sit on an old
 * bundle for days. build-info.json (written by every build) names the commit.
 */

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>

/** The commit the server is serving now, or null when it cannot be read. */
export async function fetchBuildCommit (fetcher: Fetcher = (input, init) => fetch(input, init)): Promise<string | null> {
  try {
    const response = await fetcher('/build-info.json', { cache: 'no-store' })
    if (!response.ok) return null
    const info = await response.json() as { commit?: unknown }
    return typeof info.commit === 'string' && info.commit ? info.commit : null
  } catch {
    return null
  }
}

export interface WatchOptions {
  /** The commit this page was built from; '' (a dev build) disables the watch. */
  running: string
  check?: () => Promise<string | null>
  /** Called once when the server serves a different commit. */
  onNewer: (commit: string) => void
  /** Asks the service worker to look for its own update (registration.update()). */
  update?: () => Promise<unknown>
  doc?: Document
  win?: Window
  intervalMs?: number
}

/** Checks on focus, when the tab is shown, and every few minutes. Returns a stop function. */
export function watchForNewBuild (options: WatchOptions): () => void {
  const {
    running,
    check = () => fetchBuildCommit(),
    onNewer,
    update,
    doc = document,
    win = window,
    intervalMs = 5 * 60 * 1000
  } = options
  if (!running) return () => {}

  let reported = false
  let checking = false
  const run = async () => {
    if (reported || checking) return
    checking = true
    try {
      if (update) await Promise.resolve(update()).catch(() => {})
      const served = await check()
      if (served && served !== running && !reported) {
        reported = true
        onNewer(served)
      }
    } finally {
      checking = false
    }
  }
  const onVisible = () => { if (doc.visibilityState === 'visible') run().catch(() => {}) }
  const onFocus = () => { run().catch(() => {}) }

  win.addEventListener('focus', onFocus)
  doc.addEventListener('visibilitychange', onVisible)
  const timer = setInterval(() => { run().catch(() => {}) }, intervalMs)
  return () => {
    win.removeEventListener('focus', onFocus)
    doc.removeEventListener('visibilitychange', onVisible)
    clearInterval(timer)
  }
}
