/**
 * Sign-in through accounts.muon3d.com (KAN-7197, ADR D-213): OAuth 2.1 authorization code + PKCE (S256)
 * against the accounts issuer, from Control at control.muon3d.com. Same client (`fluidd`), same scopes, same
 * redirect URI (the page's root) as the console's own central login; no `openid` scope and so no nonce.
 *
 * Behind a build-time flag that is OFF unless `VITE_CONTROL_ACCOUNTS_SIGNIN` is exactly "true", and then only
 * on exactly https://control.muon3d.com. On a printer's own address, on app.muon3d.com, on any other origin, the
 * flag is ignored and today's path runs unchanged (the Army units' printer-served Control must never change).
 * The one other origin is an e2e test's, named at build time by `VITE_CONTROL_ACCOUNTS_E2E_ORIGIN`, which no
 * production build sets.
 */
import { isPrinterSecureOrigin } from '@/services/secure-origin'

export const ACCOUNTS_ORIGIN = 'https://accounts.muon3d.com'
const CONTROL_ORIGIN = 'https://control.muon3d.com'

function e2eOrigin (): string {
  return (import.meta.env.VITE_CONTROL_ACCOUNTS_E2E_ORIGIN as string | undefined) || ''
}

export function accountsSignInEnabled (location: Pick<Location, 'origin' | 'protocol' | 'hostname'> = window.location): boolean {
  if (import.meta.env.VITE_CONTROL_ACCOUNTS_SIGNIN !== 'true') return false
  if (isPrinterSecureOrigin(location)) return false
  if (location.origin === CONTROL_ORIGIN) return true
  const e2e = e2eOrigin()
  return e2e !== '' && location.origin === e2e
}

/** The accounts issuer: the constant, unless an e2e build on its own origin points at a fake. */
export function accountsOrigin (location: Pick<Location, 'origin'> = window.location): string {
  const e2e = e2eOrigin()
  const fake = (import.meta.env.VITE_CONTROL_ACCOUNTS_URL as string | undefined) || ''
  if (e2e !== '' && fake !== '' && location.origin === e2e) return fake.replace(/\/$/, '')
  return ACCOUNTS_ORIGIN
}
