/**
 * The relay address Bluetooth starts from. The browser's endpoint only needs
 * the URL as a string to bind, so Bluetooth never has to ask the console for
 * it: the console's own answer is used when this page has it, else the last
 * one it gave (kept in localStorage), else the production relay built in.
 * An offline demo (hotspot and Bluetooth only) therefore works after a reload.
 */
export const DEFAULT_RELAY_URL = 'https://relay.muon3d.com/'
export const RELAY_CACHE_KEY = 'muon.cloud.relay-url'

export function cachedRelayUrl (): string | null {
  try {
    const value = localStorage.getItem(RELAY_CACHE_KEY)
    return value && /^https?:\/\//.test(value) ? value : null
  } catch {
    return null
  }
}

export function rememberRelayUrl (url: string | undefined | null): void {
  if (!url) return
  try {
    localStorage.setItem(RELAY_CACHE_KEY, url)
  } catch { /* no storage */ }
}

/** Cloud value, then cached, then built-in. Never asks the network. */
export function relayUrlForBluetooth (fromCloud?: string | null): string {
  return fromCloud || cachedRelayUrl() || DEFAULT_RELAY_URL
}
