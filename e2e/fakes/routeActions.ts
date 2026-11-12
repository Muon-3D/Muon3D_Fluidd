/**
 * In-page helpers for the route e2e (route-hold.spec.ts), loaded by the page
 * itself so they share Control's own modules: what the page sends when a
 * person presses something the printer's permission list refuses, and the
 * state a test reads back.
 */
import Vue from 'vue'
import store from '../../src/store'
import { cloudState } from '../../src/services/muon-cloud/state'
import { lookNearby } from '../../src/services/muon-ble/nearby'
import { routeMode } from '../../src/services/muon-cloud/route-choice'
import { activationState } from '../../src/services/muon-cloud/activate'

/** A request the printer refuses for this session, over HTTP and over the socket. */
export async function refusedRequests () {
  let http: number | null = null
  try {
    await Vue.$httpClient.post('/muon-link/plate/clear')
  } catch (error) {
    http = (error as { response?: { status?: number } }).response?.status ?? -1
  }
  // The socket's refusal settles as an error answer; it must not end the socket.
  Vue.$socket.emit('machine.update.status')
  return { http }
}

/** "Look nearby": the browser's chooser picks the printer, so this page has heard it. */
export async function hearNearby () {
  return !!(await lookNearby())
}

export function where () {
  return {
    apiUrl: store.state.config.apiUrl as string,
    activeCloud: cloudState.activePrinterId,
    mode: routeMode(cloudState.activePrinterId ?? '3fa9c0de'.repeat(8)),
    socketOpen: !!store.state.socket.open,
    error: activationState.error,
    switching: activationState.switching
  }
}
