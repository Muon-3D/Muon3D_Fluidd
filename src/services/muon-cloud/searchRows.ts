/**
 * Welcome's one printer list (ADR 0032; KAN-434): what the LAN sweep found,
 * what the Muon3D service sees on this network, and what this page heard over
 * Bluetooth, one row per printer.
 *
 * Before its Wi-Fi is set, an M1 is on nobody's network: this page finds it
 * over Bluetooth or not at all. So a printer heard nearby lists with the rest,
 * and the line under its name says where it was found. A printer both on this
 * network and nearby lists once.
 *
 * Joins: the service's printer id is the printer's EndpointId, which `INFO`
 * names and the advertisement starts; the LAN sweep has only a name, and the
 * printer advertises the same name its screen shows (`walnut-8987` is
 * "Walnut · 8987", ADR 0032 D6).
 */
import type { CloudPrinter } from './api'
import { lanLinkAvailability, nearbyHost, sameNamedPrinter, type CloudNearbyPrinter, type LanPrinter } from './discovery'
import { isPrinter, type NearbyPrinter } from '@/services/muon-ble/nearby'

/**
 * What a row's main button does:
 * - `open`: this network, at `host`.
 * - `open-cloud`: a printer on the account, through the service's relay.
 * - `open-bluetooth`: a printer on the account with no Wi-Fi, over Bluetooth.
 * - `set-up`: a new printer heard nearby.
 * - `nearby-info`: a set-up printer heard nearby that this page cannot open.
 */
export type RowAction = 'open' | 'open-cloud' | 'open-bluetooth' | 'set-up' | 'nearby-info'

export interface SearchRow {
  key: string;
  name: string;
  /** Its address on this network, when known. */
  host: string | null;
  meta: string;
  /** Why it can or cannot be linked, in words. */
  status: string;
  linked: boolean;
  canLink: boolean;
  /** Set when the service sees it: the code is then asked for through the service. */
  cloudId?: string;
  lan?: LanPrinter;
  /** Set when this page heard it over Bluetooth. */
  nearby?: NearbyPrinter;
  action: RowAction;
}

export interface SearchSources {
  found: LanPrinter[];
  cloud: CloudNearbyPrinter[];
  nearby: NearbyPrinter[];
  /** The signed-in account's printers. */
  account: CloudPrinter[];
  email: string | null;
}

function cloudRow (key: string, name: string, host: string | null, linked: boolean, mine: boolean, cloudId: string, lan?: LanPrinter): SearchRow {
  const status = !linked
    ? 'not linked to an account'
    : mine ? 'in your account' : 'linked to another account'
  return {
    key,
    name,
    host,
    meta: `${host ?? 'address unknown'} · ${status}`,
    status,
    linked,
    canLink: !linked,
    cloudId,
    lan,
    action: 'open'
  }
}

function heardAs (p: NearbyPrinter): string {
  return p.display || p.localName
}

/** "Set up · nearby", with the busy flag when another device holds the printer's one slot. */
function nearbyNote (p: NearbyPrinter, what: string | null): string {
  const busy = p.advert?.busy ? ' · busy with another device' : ''
  return `${what ? `${what} · ` : ''}nearby${busy}`
}

export function searchRows (sources: SearchSources): SearchRow[] {
  const { found, cloud, nearby, account, email } = sources
  const isMine = (id: string) => account.some(p => p.id === id)
  const rows: SearchRow[] = []

  for (const l of found) {
    const c = cloud.find(x => sameNamedPrinter(x.name, l.name))
    if (c) {
      rows.push(cloudRow(c.printerId, l.name, l.host, c.linked, isMine(c.printerId), c.printerId, l))
      continue
    }
    const linked = l.link.phase === 'linked'
    const mine = linked && !!l.link.account && l.link.account === email
    const { canShow, note } = lanLinkAvailability(l.link)
    rows.push({
      key: l.host,
      name: l.name,
      host: l.host,
      meta: `${l.host} · ${linked ? (mine ? 'in your account' : 'linked to an account') : note}`,
      status: note,
      linked,
      canLink: canShow,
      lan: l,
      action: 'open'
    })
  }
  for (const c of cloud) {
    if (found.some(l => sameNamedPrinter(c.name, l.name))) continue
    rows.push(cloudRow(c.printerId, c.name, nearbyHost(c.localAddrs), c.linked, isMine(c.printerId), c.printerId))
  }

  for (const p of nearby) {
    // Already listed from this network: say it is nearby too.
    const same = rows.find(r =>
      (r.cloudId && isPrinter(p, r.cloudId)) ||
      (!r.cloudId && !!r.lan && !!p.localName && sameNamedPrinter(p.localName, r.lan.name)))
    if (same) {
      if (!same.nearby) {
        same.nearby = p
        same.meta = `${same.meta} · nearby`
        // The service sees it but this page has no address for it: the radio is the way in.
        if (!same.host && same.cloudId && isMine(same.cloudId)) same.action = 'open-bluetooth'
      }
      continue
    }
    const owned = account.find(a => isPrinter(p, a.id))
    if (owned) {
      rows.push({
        key: owned.id,
        name: owned.name,
        host: null,
        meta: nearbyNote(p, 'In your account'),
        status: 'in your account',
        linked: true,
        canLink: false,
        cloudId: owned.id,
        nearby: p,
        // Online: the relay, which leaves the printer's one Bluetooth slot free.
        action: owned.online ? 'open-cloud' : 'open-bluetooth'
      })
      continue
    }
    const setUp = p.advert ? !p.advert.unclaimed : null
    rows.push({
      key: `ble:${p.deviceId}`,
      name: heardAs(p),
      host: null,
      meta: nearbyNote(p, setUp === null ? null : setUp ? 'Set up' : 'New'),
      status: setUp ? 'set up, and not on this network' : 'not set up yet',
      linked: false,
      canLink: false,
      nearby: p,
      // Unknown (no advertisement) is tried as new: the printer refuses a
      // stranger once it is set up, and the setup flow says so.
      action: setUp ? 'nearby-info' : 'set-up'
    })
  }
  return rows
}
