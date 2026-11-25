import Vue from 'vue'

/** The address a printer is connected to by, so the badge can say so. */
export const directAddressState = Vue.observable({ host: null as string | null })

/** " (by address)" for the host Control is connected to that way, else "". */
export function byAddressSuffix (apiUrlOrHost: string | null | undefined): string {
  const host = directAddressState.host
  if (!host || !apiUrlOrHost) return ''
  const bare = apiUrlOrHost.replace(/^[a-z]+:\/\//i, '').replace(/[/?#].*$/, '').replace(/^([^:]+):\d+$/, '$1').replace(/^\[|\]$/g, '').toLowerCase()
  return bare === host ? ' (by address)' : ''
}
