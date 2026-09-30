/**
 * The Wi-Fi step's words and checks (02-setup-api.md §5.6, 08-errors.md),
 * shared by every page that draws the step.
 */
import type { SetupError } from './types'

/** A WPA passphrase: 8 to 63 characters, or 64 hex digits (02 §5.6). */
export function validPsk (psk: string): boolean {
  return (psk.length >= 8 && psk.length <= 63) || /^[0-9a-f]{64}$/i.test(psk)
}

/** 08-errors.md, the join rows. */
export function joinErrorCopy (error: SetupError, name: string, ssid: string): string {
  switch (error.code) {
    case 'wrong_password': return `${ssid} didn't accept that password.`
    case 'ssid_not_found': return `${name} can't see ${ssid} from here.`
    case 'no_address': return `${name} joined ${ssid}, but the router didn't give it an address. Restarting the router often fixes this.`
    case 'timeout': return `Joining ${ssid} took too long.`
    case 'eap_failed': return `${ssid} didn't accept that username or password.`
    case 'cert_invalid': return `${ssid}'s certificate couldn't be checked.`
    case 'unsupported_security': return `${name} can't join this kind of network.`
    default: return `${name} couldn't join ${ssid}.`
  }
}

/** 08-errors.md, the rows every screen handles. */
export function writeErrorCopy (error: SetupError | null, name: string): string {
  switch (error?.code) {
    case 'stale_rev': return `This step changed on ${name}'s screen.`
    case 'busy': return `${name} is busy with another step. One moment…`
    case 'invalid_network': return 'Check the network details and try again.'
    case 'protected': return `${name} is protected. Change Wi-Fi on its screen.`
    default: return error?.message ?? `${name} couldn't do that. Try again.`
  }
}
