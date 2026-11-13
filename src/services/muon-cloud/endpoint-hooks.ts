/**
 * Hooks between the tab's link endpoint (iroh.ts) and the modules that use it
 * (KAN-2531). iroh.ts must not import pairing, setup or state (they import it),
 * so they register here instead. This module imports nothing.
 */

const busyChecks = new Set<() => boolean>()
const reboundListeners = new Set<(except: string) => void>()

/** A module whose work would be cut by replacing the endpoint (a pairing, a Bluetooth setup) says so here. */
export function registerEndpointBusy (check: () => boolean): () => void {
  busyChecks.add(check)
  return () => { busyChecks.delete(check) }
}

/** True while any registered user of the endpoint is mid-way through something a rebind would end. */
export function endpointBusy (): boolean {
  for (const check of busyChecks) {
    try {
      if (check()) return true
    } catch { /* a broken check never blocks a connect */ }
  }
  return false
}

/** Runs after an explicit Bluetooth connect replaced the endpoint; `except` is the printer it was for. */
export function onEndpointRebound (listener: (except: string) => void): () => void {
  reboundListeners.add(listener)
  return () => { reboundListeners.delete(listener) }
}

/** Tells every listener the endpoint was replaced. One listener failing never stops the others. */
export function notifyEndpointRebound (except: string): void {
  for (const listener of reboundListeners) {
    try {
      listener(except)
    } catch (error) {
      console.warn(`muon-link: a rebind listener failed: ${(error as Error)?.message ?? error}`)
    }
  }
}

/** Tests only: forget every registration. */
export function resetEndpointHooks (): void {
  busyChecks.clear()
  reboundListeners.clear()
}
