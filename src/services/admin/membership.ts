/**
 * Whether this account is Muon staff, for the account menu's "Muon3D staff" group (KAN-5207, ADR Decision 7).
 * The console says so on `GET /v1/me` (`staff_role`: "admin", "moderator" or null).
 * This is the ONE place that reads it, and the menu stays on `/v1/me` permanently. `muon_admin` gates Fleet on the
 * server side. It fails closed: only exactly "admin" and "moderator" count; a missing, unknown (including the old
 * "staff") or malformed field means no group at all. It is a convenience gate that only hides things; the console
 * still enforces every call.
 */
import type { CloudAccount } from '@/services/muon-cloud/api'

export type StaffRole = 'admin' | 'moderator'

export function staffRole (account: Pick<CloudAccount, 'staff_role'> | null | undefined): StaffRole | null {
  const value = account?.staff_role
  if (value === 'admin') return 'admin'
  if (value === 'moderator') return 'moderator'
  return null
}

/** Grafana stays hidden until KAN-7213. */
export const GRAFANA_ITEM_VISIBLE = false

export const FLEET_URL = 'https://fleet.muon3d.com'

export type StaffMenuItem = 'admin' | 'fleet' | 'grafana'

/** The items of the "Muon3D staff" group this role may see. An admin gets Admin and Fleet; a moderator gets Admin only (no Fleet, no Grafana). */
export function staffMenuItems (role: StaffRole | null): StaffMenuItem[] {
  if (!role) return []
  const items: StaffMenuItem[] = ['admin']
  if (role === 'admin') items.push('fleet')
  if (role === 'admin' && GRAFANA_ITEM_VISIBLE) items.push('grafana')
  return items
}
