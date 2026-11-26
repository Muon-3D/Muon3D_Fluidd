/**
 * Whether this account is Muon staff, for the account menu's Admin and Fleet items
 * (KAN-6113) and the admin route's guard (KAN-6100). The console says so on
 * `GET /v1/me` (`staff`: `true` or "staff" for staff, "moderator" for a moderator);
 * a console that does not send it yet means nobody is staff here. This is a convenience gate:
 * it only hides things, and the console still enforces every call.
 */
import type { CloudAccount } from '@/services/muon-cloud/api'

export type StaffLevel = 'staff' | 'moderator' | ''

export function staffLevel (account: Pick<CloudAccount, 'staff'> | null | undefined): StaffLevel {
  const value = account?.staff
  return value === true || value === 'staff' ? 'staff' : value === 'moderator' ? 'moderator' : ''
}

export const isStaff = (account: Pick<CloudAccount, 'staff'> | null | undefined): boolean => staffLevel(account) === 'staff'
