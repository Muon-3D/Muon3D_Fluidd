/**
 * The LAN addresses Control has learned for a printer (KAN-6743), kept in this browser: the address it last connected
 * by, and the ones the printer reported over any session (Bluetooth, the socket: `machine.system_info` network).
 * The service's nearby list can lack a printer (a reset one, or a network whose public address differs); a known
 * address still lets the in-place direct connect start. Only private addresses are kept, and every one is still
 * checked against the printer's own identity before it is trusted (direct-address.ts).
 */
import { isPrivateAddress } from './direct-address'
import { isOwnHotspot } from './discovery'

const KEY = 'muonKnownLanAddrs'
const MAX_PER_PRINTER = 4

function read (): Record<string, string[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function knownAddresses (id: string | null | undefined): string[] {
  if (!id) return []
  const list = read()[id.toLowerCase()]
  return Array.isArray(list) ? list.filter(a => isPrivateAddress(a) && !isOwnHotspot(a)) : []
}

/** Newest first; the printer's own hotspot and anything not private is never kept. */
export function rememberAddresses (id: string | null | undefined, addrs: ReadonlyArray<unknown>) {
  if (!id) return
  const fresh = addrs.filter((a): a is string => isPrivateAddress(a) && !isOwnHotspot(a)).map(a => a.toLowerCase())
  if (!fresh.length) return
  try {
    const all = read()
    const key = id.toLowerCase()
    all[key] = [...fresh, ...(all[key] ?? [])].filter((a, i, l) => l.indexOf(a) === i).slice(0, MAX_PER_PRINTER)
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* no storage: nothing is remembered */ }
}

/** The IPv4 addresses in a printer's reported network interfaces (`machine.system_info`). */
export function addressesOfNetwork (network: Record<string, { ip_addresses?: Array<{ family?: string, address?: string }> }> | undefined | null): string[] {
  const out: string[] = []
  for (const entry of Object.values(network ?? {})) {
    for (const a of entry?.ip_addresses ?? []) if (a.family === 'ipv4' && a.address) out.push(a.address)
  }
  return out
}
