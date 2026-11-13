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
  modes: {} as Record<string, RouteMode>,
  /** When the relay last failed for each printer (ms). */
  relayLostAt: {} as Record<string, number>,
  /** The printer the person last asked to open (lower case), or a marker for one with no id. */
  userTarget: null as string | null
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

/**
 * How long auto mode keeps off the relay after it failed for a printer, at
 * least. The account's printer list says "online" for up to its 10 s poll
 * after the relay is gone, so on its own it would send auto mode straight back
 * to the route it just lost (#370).
 */
export const RELAY_HOLD_MS = 30_000

/** The relay failed for `printerId`: an open through it did not work, or the session on it dropped. */
export function noteRelayLost (printerId: string, now = Date.now()) {
  Vue.set(state.relayLostAt, key(printerId), now)
}

/** When the relay last failed for `printerId`, or undefined. */
export function relayLostAt (printerId: string | null | undefined): number | undefined {
  return printerId ? state.relayLostAt[key(printerId)] : undefined
}

/**
 * Whether auto mode may count the relay as there for a printer the account's
 * list calls online. After a failure it may not until the list was asked
 * after the failure (`listSentAt`) and `RELAY_HOLD_MS` has passed, whichever
 * is later. With no failure, the list is believed.
 */
export function relayTrusted (lostAt: number | undefined, listSentAt: number, now: number): boolean {
  if (lostAt === undefined) return true
  return listSentAt > lostAt && now - lostAt >= RELAY_HOLD_MS
}

/** The person asked to open this printer (null: one with no id, such as a bare address). */
export function noteUserOpen (printerId: string | null | undefined, marker = '?') {
  state.userTarget = printerId ? key(printerId) : marker
}

/**
 * The printer auto mode keeps looking after when its session is gone.
 *
 * - `autoId`: the open printer in auto mode, when there is one; it is the one.
 * - `otherOpen`: a printer is open that auto mode does not look after (a chosen
 *   route, or another printer): nothing to keep.
 * - The person asked to open a printer other than `prev`: they walked away
 *   from it, so it is forgotten and auto mode never dials it (even when what
 *   they opened fails, or while it is still opening).
 * - Otherwise `prev` stays: its route died under the person.
 */
export function nextAutoSeen (
  prev: string | null,
  s: { autoId: string | null; otherOpen: boolean; userTarget: string | null }
): string | null {
  const walkedAway = (id: string | null) => !!id && !!s.userTarget && id.toLowerCase() !== s.userTarget
  if (s.autoId) return walkedAway(s.autoId) ? null : s.autoId
  if (s.otherOpen) return null
  return walkedAway(prev) ? null : prev
}

/** The printer the person last asked to open. */
export function userOpenTarget (): string | null {
  return state.userTarget
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
