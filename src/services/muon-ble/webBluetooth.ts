/**
 * Web Bluetooth for Muon3D printers (Iroh_BLE; ADR 0032, KAN-434).
 *
 * Every M1 that runs `muon-link-ble` advertises one GATT service. Its
 * advertisement carries the printer's own short name (`walnut-8987`, ADR 0032
 * D6) and ten bytes of manufacturer data: whether setup is complete, whether
 * another device holds its one Bluetooth slot, and the first eight bytes of its
 * Iroh EndpointId. Its `INFO` characteristic names the whole EndpointId.
 * Reading `INFO` does not take the printer's one Bluetooth slot: only a
 * subscription or a write does.
 *
 * Web Bluetooth exists only in Chromium browsers, only in a secure context
 * (the hosted page, or localhost), and a page cannot scan by itself: the
 * browser's device chooser opens from a click. A printer chosen once can be
 * listened for again without the chooser (`getDevices`, `watchAdvertisements`)
 * where the browser supports that.
 */

/** The service every Muon printer advertises (Iroh_BLE `SERVICE_UUID`). */
export const MUON_BLE_SERVICE = '843ce1e6-c64c-4ac1-b06b-5afd8329b7f9'
/** `INFO`, read once: version, capabilities, segment size, EndpointId. */
export const MUON_BLE_INFO = '843ce1e6-c64c-4ac1-b06b-5afd8329b7fa'
/** `RX`: the page writes segments here. */
export const MUON_BLE_RX = '843ce1e6-c64c-4ac1-b06b-5afd8329b7fb'
/** `TX`: the printer notifies segments here. */
export const MUON_BLE_TX = '843ce1e6-c64c-4ac1-b06b-5afd8329b7fc'

/** The development company id Iroh_BLE uses until Muon3D has a Bluetooth SIG id (ADR 0032). */
export const MUON_BLE_COMPANY_ID = 0xffff

const FLAG_UNCLAIMED = 0x01
const FLAG_BUSY = 0x02

/** A decoded `INFO` value (Iroh_BLE `docs/CORE_API.md`, 38 bytes, little-endian). */
export interface BleInfo {
  version: number;
  /** The segment size the printer uses; 0 means it did not say. */
  maxSegment: number;
  /** The EndpointId the printer claims, 64 lower-case hex. A QUIC handshake is what proves it. */
  endpointId: string;
  l2cap: boolean;
  writeWithResponse: boolean;
}

/** What an advertisement's manufacturer data says. */
export interface BleAdvert {
  /** Setup is not complete. */
  unclaimed: boolean;
  /** Another device holds the printer's one Bluetooth slot. */
  busy: boolean;
  /** The first 8 bytes of the EndpointId, 16 lower-case hex. */
  endpointPrefix: string;
}

/* The parts of Web Bluetooth this page uses. TypeScript's DOM library has none. */

export interface GattCharacteristic extends EventTarget {
  readonly value?: DataView | null;
  readonly properties?: { write?: boolean, writeWithoutResponse?: boolean };
  readValue (): Promise<DataView>;
  writeValueWithoutResponse? (value: BufferSource): Promise<void>;
  writeValueWithResponse? (value: BufferSource): Promise<void>;
  startNotifications? (): Promise<unknown>;
}

export interface GattService {
  getCharacteristic (uuid: string): Promise<GattCharacteristic>;
}

export interface GattServer {
  readonly connected?: boolean;
  connect (): Promise<GattServer>;
  disconnect (): void;
  getPrimaryService (uuid: string): Promise<GattService>;
}

export interface BleDevice extends EventTarget {
  readonly id: string;
  readonly name?: string | null;
  readonly gatt?: GattServer;
  watchAdvertisements? (options?: { signal?: AbortSignal }): Promise<void>;
}

/** The `advertisementreceived` event, as far as this page reads it. */
export interface BleAdvertisementEvent extends Event {
  readonly device: BleDevice;
  readonly name?: string | null;
  readonly manufacturerData?: Map<number, DataView>;
}

export interface WebBluetooth extends EventTarget {
  requestDevice (options: unknown): Promise<BleDevice>;
  getAvailability? (): Promise<boolean>;
  getDevices? (): Promise<BleDevice[]>;
}

export type BluetoothSupport =
  | { supported: true }
  | { supported: false, reason: 'insecure' | 'unsupported' }

/** A printer read through the chooser. */
export interface ChosenPrinter {
  device: BleDevice;
  /** The advertised name, `walnut-8987`. */
  name: string;
  info: BleInfo;
}

export function webBluetooth (): WebBluetooth | null {
  const nav = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & { bluetooth?: WebBluetooth }) | null
  return nav?.bluetooth ?? null
}

/** Whether this browser can look for a printer over Bluetooth at all. */
export function bluetoothSupport (): BluetoothSupport {
  if (typeof window !== 'undefined' && window.isSecureContext === false) return { supported: false, reason: 'insecure' }
  if (!webBluetooth()) return { supported: false, reason: 'unsupported' }
  return { supported: true }
}

/**
 * Whether a Bluetooth adapter is present and on, where the browser can tell.
 * `null` when it cannot.
 */
export async function bluetoothAvailable (): Promise<boolean | null> {
  const bt = webBluetooth()
  if (!bt) return false
  if (typeof bt.getAvailability !== 'function') return null
  try {
    return await bt.getAvailability()
  } catch {
    return null
  }
}

/** Devices this origin was allowed before, where the browser keeps them. */
export async function rememberedDevices (): Promise<BleDevice[]> {
  const bt = webBluetooth()
  if (!bt || typeof bt.getDevices !== 'function') return []
  try {
    return await bt.getDevices()
  } catch {
    return []
  }
}

function hex (bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** Decodes `INFO`; `null` for anything that is not a version-1 Iroh_BLE value. */
export function decodeInfo (bytes: Uint8Array): BleInfo | null {
  if (bytes.length < 38 || bytes[0] !== 1) return null
  const caps = bytes[1]
  const maxSegment = bytes[4] | (bytes[5] << 8)
  return {
    version: 1,
    maxSegment,
    endpointId: hex(bytes.slice(6, 38)),
    l2cap: (caps & 0x01) !== 0,
    writeWithResponse: (caps & 0x02) !== 0
  }
}

/**
 * Decodes Muon's manufacturer data, the value under the company id (Web
 * Bluetooth strips the id): version, flags, EndpointId prefix. `null` for
 * another version or a short value.
 */
export function decodeAdvert (data: DataView | undefined | null): BleAdvert | null {
  if (!data || data.byteLength < 10) return null
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  if (bytes[0] !== 1) return null
  const flags = bytes[1]
  return {
    unclaimed: (flags & FLAG_UNCLAIMED) !== 0,
    busy: (flags & FLAG_BUSY) !== 0,
    endpointPrefix: hex(bytes.slice(2, 10))
  }
}

/**
 * The printer's advertised name as its screen shows it: `walnut-8987` is
 * "Walnut · 8987". `null` for a name that is not an M1's.
 */
export function displayName (localName: string | null | undefined): string | null {
  const m = /^(?:muon-)?([a-z]+)-([0-9a-f]{4})$/i.exec(localName ?? '')
  if (!m) return null
  const word = m[1].toLowerCase()
  return `${word[0].toUpperCase()}${word.slice(1)} · ${m[2].toLowerCase()}`
}

/** Reads a device's `INFO` over a GATT connection this function opens and closes. */
export async function readInfo (device: BleDevice): Promise<BleInfo> {
  const gatt = device.gatt
  if (!gatt) throw new Error('The printer offered no GATT connection.')
  const server = await gatt.connect()
  try {
    const service = await server.getPrimaryService(MUON_BLE_SERVICE)
    const characteristic = await service.getCharacteristic(MUON_BLE_INFO)
    const value = await characteristic.readValue()
    const info = decodeInfo(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    if (!info) throw new Error('The printer answered with an INFO value this page does not understand.')
    return info
  } finally {
    gatt.disconnect()
  }
}

/**
 * Opens the browser's chooser for Muon3D printers and reads the chosen one's
 * `INFO`. Must run from a click, with nothing awaited before it.
 *
 * Rejects with the browser's `NotFoundError` when the person closes the
 * chooser, which callers treat as "nothing chosen", not as a failure.
 */
export async function choosePrinter (): Promise<ChosenPrinter> {
  const bt = webBluetooth()
  if (!bt) throw new Error('This browser has no Web Bluetooth.')
  const device = await bt.requestDevice({
    filters: [{ services: [MUON_BLE_SERVICE] }],
    optionalManufacturerData: [MUON_BLE_COMPANY_ID]
  })
  const info = await readInfo(device)
  return { device, name: device.name ?? '', info }
}

/** True when the person dismissed the chooser. */
export function chooserDismissed (error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'NotFoundError'
}
