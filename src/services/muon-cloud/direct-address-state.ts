import Vue from 'vue'

/** The address a printer is connected to by, so the badge can say so. */
export const directAddressState = Vue.observable({ host: null as string | null })

const KEY = 'muonByAddress'

function read (): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

/**
 * The address this browser last connected a printer by (the person's own choice, after its secure name did not
 * answer), kept so a reload or a deep link reconnects the same way. Cleared once the secure name connects.
 */
export function rememberByAddress (id: string | null | undefined, host: string | null) {
  if (!id) return
  try {
    const all = read()
    if (host) all[id.toLowerCase()] = host.toLowerCase(); else delete all[id.toLowerCase()]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* no storage: a reload goes to the secure name or the tile */ }
}

/** Whether this browser connected the printer by this very address (and has not since used the secure name). */
export function connectedByAddress (id: string | null | undefined, host: string | null | undefined): boolean {
  if (!id || !host) return false
  const saved = read()[id.toLowerCase()]
  return !!saved && saved === host.replace(/^\[|\]$/g, '').toLowerCase()
}

/**
 * " (by address, not encrypted)" for the host Control is connected to that way, else "". The route is plain HTTP to
 * a private address: the identity check catches the wrong printer, not someone on the network reading or changing
 * the traffic, so the badge says so (KAN-6283).
 */
export function byAddressSuffix (apiUrlOrHost: string | null | undefined): string {
  const host = directAddressState.host
  // The secure name (https) is never the by-address route, whatever address was dialled before.
  if (!host || !apiUrlOrHost || /^https:/i.test(apiUrlOrHost) || /^wss:/i.test(apiUrlOrHost)) return ''
  const bare = apiUrlOrHost.replace(/^[a-z]+:\/\//i, '').replace(/[/?#].*$/, '').replace(/^([^:]+):\d+$/, '$1').replace(/^\[|\]$/g, '').toLowerCase()
  return bare === host ? ' (by address, not encrypted)' : ''
}
