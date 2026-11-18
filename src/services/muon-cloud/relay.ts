/**
 * The relay address Bluetooth starts from. The browser's endpoint only needs
 * the URL as a string to bind, so Bluetooth never has to ask the console for
 * it: the console's own answer is used when this page has it, else the last
 * one it gave (kept in localStorage), else the production relay built in.
 * An offline demo (hotspot and Bluetooth only) therefore works after a reload.
 *
 * Only a Muon3D relay is ever used or kept: https, on muon3d.com or a
 * subdomain. A console answer or a stored value that is anything else (a
 * hostile or mistaken console, a tampered storage) is ignored.
 */
export const DEFAULT_RELAY_URL = 'https://relay.muon3d.com/'
export const RELAY_CACHE_KEY = 'muon.cloud.relay-url'

export function isMuonRelay (url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && (parsed.hostname === 'muon3d.com' || parsed.hostname.endsWith('.muon3d.com'))
  } catch {
    return false
  }
}

export function cachedRelayUrl (): string | null {
  try {
    const value = localStorage.getItem(RELAY_CACHE_KEY)
    if (value === null) return null
    if (isMuonRelay(value)) return value
    localStorage.removeItem(RELAY_CACHE_KEY)
  } catch { /* no storage */ }
  return null
}

export function rememberRelayUrl (url: string | undefined | null): void {
  if (!isMuonRelay(url)) return
  try {
    localStorage.setItem(RELAY_CACHE_KEY, url)
  } catch { /* no storage */ }
}

/** Cloud value, then cached, then built-in; each only if it is a Muon3D relay. Never asks the network. */
export function relayUrlForBluetooth (fromCloud?: string | null): string {
  return (isMuonRelay(fromCloud) ? fromCloud : null) || cachedRelayUrl() || DEFAULT_RELAY_URL
}
