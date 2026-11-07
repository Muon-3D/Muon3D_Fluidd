/**
 * The EndpointId the connected printer reports about itself
 * (`/server/muon/identity`), read fresh. A saved printer's EndpointId is
 * matched by its address, and an address can be handed to another printer
 * (DHCP): before acting on an account printer from its People and access
 * page, the printer on the other end must say it is that printer.
 */
import Vue from 'vue'

/** Lower-case EndpointId, or null when the printer didn't say (old MuonOS, refused, timed out). */
export async function connectedEndpointId (timeout = 4000): Promise<string | null> {
  try {
    const response = await Vue.$httpClient.get('/server/muon/identity', { timeout })
    const identity = response.data?.result ?? response.data
    const id = identity?.endpoint_id
    return typeof id === 'string' && id ? id.toLowerCase() : null
  } catch {
    return null
  }
}

/** The account printer is the one connected: same EndpointId, compared case-blind. */
export function sameEndpoint (accountPrinterId: string, reported: string | null): boolean {
  return !!reported && accountPrinterId.toLowerCase() === reported
}
