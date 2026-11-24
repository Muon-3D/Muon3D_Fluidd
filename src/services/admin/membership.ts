/**
 * Whether this account is Muon staff, for the account menu's Admin and Fleet
 * items (KAN-6113). The only signal the console gives is the answer to
 * `POST /v1/admin/session`: 200 or 403 `reauth_required` is a member, 403
 * `staff.required` is not. Anything else (offline, wrong origin, a console
 * without the route) means "not shown". Asked once per account and kept in
 * memory; it never counts as admin activity and needs no passkey.
 */
import Vue from 'vue'
import { AdminError, adminAvailable, staffSession } from './client'
import { storedToken } from '@/services/muon-cloud/api'

export const membership = Vue.observable({ account: '', staff: false })
const asked = new Map<string, Promise<boolean>>()

export const isStaffMember = (accountId: string): boolean => !!accountId && membership.account === accountId && membership.staff

export function forgetMembership (): void { membership.account = ''; membership.staff = false; asked.clear() }

export async function checkMembership (accountId: string): Promise<boolean> {
  if (!accountId || !adminAvailable() || !storedToken()) return false
  let answer = asked.get(accountId)
  if (!answer) {
    answer = staffSession().then(() => true, (error: unknown) => error instanceof AdminError && error.status === 403 && error.code === 'console.staff.reauth_required')
    asked.set(accountId, answer)
  }
  const staff = await answer
  membership.account = accountId; membership.staff = staff
  return staff
}
