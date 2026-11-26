/**
 * Whether this account is Muon staff, for the account menu's "Muon3D staff" group (KAN-5207, ADR Decision 7).
 * The console says so on `GET /v1/me` (`staff`: `true` or "staff" for staff, "moderator" for a moderator).
 * This is the ONE place that reads it; KAN-6138 moves it to the id_token `muon_admin` claim by changing only
 * `staffRole`. It fails closed: a missing, unknown or malformed field means no group at all. It is a
 * convenience gate that only hides things; the console still enforces every call.
 */
import type { CloudAccount } from '@/services/muon-cloud/api'

export type StaffRole = 'staff' | 'moderator'

export function staffRole (account: Pick<CloudAccount, 'staff'> | null | undefined): StaffRole | null {
  const value = account?.staff
  if (value === true || value === 'staff') return 'staff'
  if (value === 'moderator') return 'moderator'
  return null
}

/** Grafana stays hidden until KAN-7213. */
export const GRAFANA_ITEM_VISIBLE = false

export const FLEET_URL = 'https://fleet.muon3d.com'

export type StaffMenuItem = 'admin' | 'fleet' | 'grafana'

/** The items of the "Muon3D staff" group this role may see. Moderators get neither Fleet nor Grafana. */
export function staffMenuItems (role: StaffRole | null): StaffMenuItem[] {
  if (!role) return []
  const items: StaffMenuItem[] = ['admin']
  if (role === 'staff') items.push('fleet')
  if (role === 'staff' && GRAFANA_ITEM_VISIBLE) items.push('grafana')
  return items
}
