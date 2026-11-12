import Vue from 'vue'
import type { Store } from 'vuex'

/**
 * Whether Control has had an answer from the printer since this page loaded:
 * the socket opened, or connecting ended in a failure it reported. Until then
 * there is nothing true to say about the printer. It isn't "Offline" and
 * Klipper isn't "offline"; it is being reached. (KAN-2257: "very glitchy
 * when loading, with randomly named printers".)
 */
export const startup = Vue.observable({ heard: false })

interface SocketBits { open: boolean; error: unknown; connecting: boolean }

/** Watches the socket until the first answer, then stops. */
export function followStartup (store: Store<{ socket: SocketBits }>): void {
  let wasConnecting = false
  const stop = store.watch(
    state => ({ open: state.socket.open, error: state.socket.error, connecting: state.socket.connecting }),
    ({ open, error, connecting }) => {
      if (open || error || (wasConnecting && !connecting)) {
        startup.heard = true
        stop()
        return
      }
      wasConnecting = wasConnecting || connecting
    }
  )
}
