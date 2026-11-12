import Vue from 'vue'

/**
 * The route the person chose to each printer (Jack, 9 Nov 2026, KAN-1913,
 * KAN-2080):
 *
 * - An explicit choice (`lan`, `cloud`, `ble`) is held. Control never moves
 *   that session to another route on its own; when it drops, it says so and
 *   offers the other routes.
 * - `auto` (plain Connect) uses the best route that is there, in the order
 *   local network, then Muon3D's cloud relay, then Bluetooth. It fails over
 *   only when a better route is not there, and returns to a better route when
 *   it comes back.
 *
 * A permission refusal says nothing about a route, so nothing here reacts to
 * one (CONTRACT-perms: "Refusals never change the chosen route").
 */
export type RouteMode = 'auto' | 'lan' | 'cloud' | 'ble'
export type Route = 'lan' | 'cloud' | 'ble'

/** Best first. */
export const AUTO_ORDER: readonly Route[] = ['lan', 'cloud', 'ble']

const state = Vue.observable({
  modes: {} as Record<string, RouteMode>
})

const key = (printerId: string) => printerId.toLowerCase()

export function chooseRouteMode (printerId: string, mode: RouteMode) {
  Vue.set(state.modes, key(printerId), mode)
}

/** What the person chose for `printerId`; `auto` when they never chose. */
export function routeMode (printerId: string | null | undefined): RouteMode {
  return (printerId && state.modes[key(printerId)]) || 'auto'
}

export interface RouteAvailability {
  lan: boolean;
  cloud: boolean;
  ble: boolean;
}

/** The route auto mode wants now: the best one that is there, or null. */
export function autoTarget (available: RouteAvailability): Route | null {
  return AUTO_ORDER.find(route => available[route]) ?? null
}

/**
 * Where auto mode should move a session that is on `current` (null: no live
 * session), or null to stay. It moves up to a better route as soon as one is
 * there, and off a dead session to the best route left. It never moves off a
 * live session to a worse route.
 */
export function autoMove (current: Route | null, available: RouteAvailability): Route | null {
  const target = autoTarget(available)
  if (!target || target === current) return null
  if (current === null) return target
  return AUTO_ORDER.indexOf(target) < AUTO_ORDER.indexOf(current) ? target : null
}

export interface DropChoice {
  id: 'lan' | 'cloud' | 'ble';
  label: string;
}

/**
 * What the "Bluetooth dropped" sheet offers (Jack, 11 Nov: "connect local
 * network / cloud / try BT again"). Local network only when this page can
 * reach the printer there; the cloud and another try at Bluetooth always, so
 * the sheet never dead-ends.
 */
export function dropChoices (lanReachable: boolean): DropChoice[] {
  const choices: DropChoice[] = []
  if (lanReachable) choices.push({ id: 'lan', label: 'Connect on local network' })
  choices.push({ id: 'cloud', label: 'Connect via cloud' })
  choices.push({ id: 'ble', label: 'Try Bluetooth again' })
  return choices
}
