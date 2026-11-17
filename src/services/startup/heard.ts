import Vue from 'vue'
import type { Store } from 'vuex'

/**
 * Whether Control has had an answer from the printer since this page loaded:
 * the socket opened, or connecting ended in a failure it reported. Until then
 * there is nothing true to say about the printer. It isn't "Offline" and
 * Klipper isn't "offline"; it is being reached. (KAN-2257: "very glitchy
 * when loading, with randomly named printers".)
 *
 * A printer that never answers at all (and pages that never open a socket)
 * would leave that state for ever, so after QUIET_MS without an answer the
 * silence is itself the answer: it is offline.
 */
export const startup = Vue.observable({ heard: false })

/** How long a printer may stay silent before Control says it is offline. */
export const QUIET_MS = 8000

interface SocketBits { open: boolean; error: unknown; connecting: boolean }

/** Watches the socket until the first answer (or QUIET_MS of silence), then stops. */
export function followStartup (store: Store<{ socket: SocketBits }>, quietMs = QUIET_MS): void {
  let wasConnecting = false
  let stop: () => void = () => {}
  const timer = setTimeout(() => settle(), quietMs)
  const settle = () => {
    startup.heard = true
    clearTimeout(timer)
    stop()
  }
  stop = store.watch(
    state => ({ open: state.socket.open, error: state.socket.error, connecting: state.socket.connecting }),
    ({ open, error, connecting }) => {
      if (open || error || (wasConnecting && !connecting)) return settle()
      wasConnecting = wasConnecting || connecting
    },
    { immediate: true }
  )
  if (startup.heard) stop()
}
