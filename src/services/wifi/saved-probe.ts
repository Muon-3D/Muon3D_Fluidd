/**
 * What the Wi-Fi card has learned about this printer during this page session
 * (KAN-3356). Module scope, not component state, so a card that remounts does
 * not ask again.
 *
 * Boxwood's Moonraker logged ~5,300 `404 GET /server/aux/wifi/show` in two
 * hours: the card asked per scanned SSID, on every poll. Each ask costs the
 * printer a `sudo nmcli connection show`.
 */
export const wifiProbe = {
  /** `GET /wifi/saved` answered 404: an older printer, so use `/wifi/show` per SSID. */
  savedUnsupported: false,
  /** SSIDs `/wifi/show` has already been asked about on such a printer. */
  asked: new Set<string>()
}

export function resetWifiProbe (): void {
  wifiProbe.savedUnsupported = false
  wifiProbe.asked = new Set<string>()
}
