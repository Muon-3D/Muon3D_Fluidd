/**
 * The Bluetooth half of the printer search (ADR 0032, KAN-434).
 *
 * Before its Wi-Fi is set, an M1 is on nobody's network, so a page finds it
 * over Bluetooth or not at all. Welcome runs one search: the LAN sweep, the
 * Muon3D service's list, and this. A browser cannot scan by itself, so this
 * half has two sources:
 *
 * - **Look nearby**, from a click: the browser's chooser, then one `INFO` read.
 * - **Printers chosen before**, heard again without the chooser where the
 *   browser supports `getDevices` and `watchAdvertisements`. Their EndpointIds
 *   are remembered here, by the browser's device id, because an advertisement
 *   carries only the first eight bytes.
 *
 * Nothing here connects to a printer beyond reading `INFO`; `link.ts` does.
 */
import Vue from 'vue'
import {
  bluetoothAvailable,
  bluetoothSupport,
  choosePrinter,
  chooserDismissed,
  decodeAdvert,
  displayName,
  MUON_BLE_COMPANY_ID,
  rememberedDevices,
  webBluetooth,
  type BleAdvert,
  type BleAdvertisementEvent,
  type BleDevice
} from './webBluetooth'

/** A printer this page heard over Bluetooth. */
export interface NearbyPrinter {
  /** The browser's id for the device, stable for this origin. */
  deviceId: string;
  device: BleDevice;
  /** The advertised name, `walnut-8987`. */
  localName: string;
  /** As its screen shows it, "Walnut · 8987"; the advertised name otherwise. */
  display: string;
  /** From `INFO`; `null` until it is read, or once an advertisement contradicts it. */
  endpointId: string | null;
  /** The latest advertisement's flags; `null` when the browser gave none. */
  advert: BleAdvert | null;
  heardAt: number;
}

export type NearbySupport = 'supported' | 'insecure' | 'unsupported'

export const nearbyState = Vue.observable({
  support: 'unsupported' as NearbySupport,
  /** Whether the adapter is on, where the browser says. */
  radio: 'unknown' as 'unknown' | 'on' | 'off',
  printers: [] as NearbyPrinter[],
  /** The chooser is open. */
  choosing: false,
  error: null as string | null
})

const STORAGE = 'muon.ble.printers'

interface Remembered { endpointId: string, localName: string }

function loadRemembered (): Record<string, Remembered> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function remember (deviceId: string, value: Remembered) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ ...loadRemembered(), [deviceId]: value }))
  } catch { /* no storage: the printer is only heard again after another Look nearby */ }
}

/** Adds or refreshes a sighting, and returns it. */
function upsert (device: BleDevice, fields: { localName?: string | null, endpointId?: string | null, advert?: BleAdvert | null }): NearbyPrinter {
  let p = nearbyState.printers.find(x => x.deviceId === device.id)
  if (!p) {
    p = {
      deviceId: device.id,
      device,
      localName: '',
      display: '',
      endpointId: null,
      advert: null,
      heardAt: 0
    }
    nearbyState.printers.push(p)
  }
  if (fields.localName) {
    p.localName = fields.localName
    p.display = displayName(fields.localName) ?? fields.localName
  }
  if (fields.endpointId !== undefined) p.endpointId = fields.endpointId
  if (fields.advert !== undefined && fields.advert !== null) {
    p.advert = fields.advert
    // A factory reset gives the printer a new key: the remembered id is stale.
    if (p.endpointId && !p.endpointId.startsWith(fields.advert.endpointPrefix)) p.endpointId = null
  }
  p.heardAt = Date.now()
  return p
}

let listening: AbortController | null = null

function onAdvertisement (event: Event) {
  const e = event as BleAdvertisementEvent
  const advert = decodeAdvert(e.manufacturerData?.get(MUON_BLE_COMPANY_ID))
  const known = loadRemembered()[e.device.id]
  const existing = nearbyState.printers.some(p => p.deviceId === e.device.id)
  upsert(e.device, {
    localName: e.name ?? e.device.name ?? known?.localName,
    // A remembered id, until an advertisement says otherwise (upsert checks it).
    endpointId: existing ? undefined : known?.endpointId ?? null,
    advert
  })
}

function onAvailability (event: Event) {
  const value = (event as Event & { value?: boolean }).value
  if (typeof value === 'boolean') nearbyState.radio = value ? 'on' : 'off'
}

/** Watches one device's advertisements, where the browser can. */
async function watch (device: BleDevice, signal: AbortSignal) {
  if (typeof device.watchAdvertisements !== 'function') return
  device.addEventListener('advertisementreceived', onAdvertisement)
  signal.addEventListener('abort', () => device.removeEventListener('advertisementreceived', onAdvertisement))
  try {
    await device.watchAdvertisements({ signal })
  } catch { /* out of range, or the browser refused: it is simply not heard */ }
}

/**
 * Starts the Bluetooth half of the search: the adapter's state, and printers
 * chosen before. Needs no click and opens no chooser. Safe to call again.
 */
export async function startNearby (): Promise<void> {
  const support = bluetoothSupport()
  nearbyState.support = support.supported ? 'supported' : support.reason
  if (!support.supported || listening) return
  const controller = new AbortController()
  listening = controller
  const bt = webBluetooth()
  bt?.addEventListener('availabilitychanged', onAvailability)
  controller.signal.addEventListener('abort', () => bt?.removeEventListener('availabilitychanged', onAvailability))
  const available = await bluetoothAvailable()
  if (listening !== controller) return
  if (available !== null) nearbyState.radio = available ? 'on' : 'off'
  const known = loadRemembered()
  for (const device of await rememberedDevices()) {
    if (listening !== controller) return
    if (known[device.id]) watch(device, controller.signal)
  }
}

/** Stops listening. Sightings stay until the next search. */
export function stopNearby () {
  listening?.abort()
  listening = null
}

/** Forgets every sighting, for a new search. Remembered printers are heard again. */
export function clearNearby () {
  nearbyState.printers.splice(0)
  nearbyState.error = null
}

/**
 * Look nearby: the browser's chooser, then the chosen printer's `INFO`. Call
 * it straight from a click. Resolves to the printer, or `null` when the
 * person closed the chooser.
 */
export async function lookNearby (): Promise<NearbyPrinter | null> {
  nearbyState.error = null
  nearbyState.choosing = true
  try {
    const chosen = await choosePrinter()
    remember(chosen.device.id, { endpointId: chosen.info.endpointId, localName: chosen.name })
    const printer = upsert(chosen.device, { localName: chosen.name, endpointId: chosen.info.endpointId })
    if (listening) watch(chosen.device, listening.signal)
    return printer
  } catch (error) {
    if (!chooserDismissed(error)) {
      nearbyState.error = `Couldn't read the printer over Bluetooth: ${(error as Error)?.message ?? error}`
    }
    return null
  } finally {
    nearbyState.choosing = false
  }
}

/** Whether a sighting is this EndpointId, by the whole id or the advertised prefix. */
export function isPrinter (p: NearbyPrinter, endpointId: string): boolean {
  const id = endpointId.toLowerCase()
  if (p.endpointId) return p.endpointId === id
  return !!p.advert && id.startsWith(p.advert.endpointPrefix)
}
