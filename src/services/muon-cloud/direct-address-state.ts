import Vue from 'vue'

/** The address a printer is connected to by, so the badge can say so. */
export const directAddressState = Vue.observable({ host: null as string | null })

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
