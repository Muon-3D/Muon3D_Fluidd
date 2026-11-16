import type { NearbySupport } from '@/services/muon-ble/nearby'
import type { Route } from './route-choice'

/**
 * Which ways in a printer's menus offer (KAN-2487, Jack 13 Nov).
 *
 * A printer reached over one route offers the other two, and a printer that
 * is not open offers all three. A route that cannot be used now is still
 * listed, greyed, with one line saying why. The route a session is on is
 * never offered. Nothing here depends on who owns the printer: the account
 * only decides whether the Muon3D route is open to it.
 */
export type RouteItemId = 'connect-local' | 'connect-cloud' | 'connect-bluetooth'

export interface RouteMenuItem {
  id: RouteItemId;
  route: Route;
  label: string;
  icon: string;
  hint?: string;
  disabled?: boolean;
}

export interface RouteMenuFacts {
  /** The route the open session is on now, or null when this printer is not open. */
  live: Route | null;
  /** What Connect locally would do from this page. */
  local: { usable: boolean, hint: string };
  /** The Muon3D route: the printer is on this account's list, and the service says it is online. */
  cloud: { listed: boolean, online: boolean };
  /** Bluetooth: this browser has it, or the printer was heard, and the printer can be told apart. */
  ble: { support: NearbySupport, heard: boolean, identified: boolean };
}

/** Said when the account does not list the printer, so Muon3D cannot carry it. */
export const NOT_ON_ACCOUNT = 'Not on your account'
export const OFFLINE_IN_MUON3D = 'Offline in Muon3D'
export const NO_BLUETOOTH = 'This browser has no Bluetooth'
export const BLUETOOTH_NEEDS_HTTPS = 'Bluetooth needs a secure page'
export const NOT_IDENTIFIED = 'Not heard nearby yet'

/** Why Bluetooth cannot be used now, or null when it can. */
export function bluetoothReason (ble: RouteMenuFacts['ble']): string | null {
  if (ble.heard) return null
  if (ble.support === 'unsupported') return NO_BLUETOOTH
  if (ble.support === 'insecure') return BLUETOOTH_NEEDS_HTTPS
  return ble.identified ? null : NOT_IDENTIFIED
}

/** The routes the menu lists for a printer, in the order Local, Muon3D, Bluetooth. */
export function routeMenuItems (f: RouteMenuFacts): RouteMenuItem[] {
  const items: RouteMenuItem[] = []
  if (f.live !== 'lan') {
    items.push({
      id: 'connect-local',
      route: 'lan',
      label: 'Connect locally',
      icon: '$lan',
      hint: f.local.hint || undefined,
      disabled: !f.local.usable
    })
  }
  if (f.live !== 'cloud') {
    const reason = !f.cloud.listed ? NOT_ON_ACCOUNT : !f.cloud.online ? OFFLINE_IN_MUON3D : undefined
    items.push({ id: 'connect-cloud', route: 'cloud', label: 'Connect through Muon3D', icon: '$cloud', hint: reason, disabled: !!reason })
  }
  if (f.live !== 'ble') {
    const reason = bluetoothReason(f.ble)
    items.push({ id: 'connect-bluetooth', route: 'ble', label: 'Connect over Bluetooth', icon: '$bluetooth', hint: reason ?? undefined, disabled: !!reason })
  }
  return items
}
