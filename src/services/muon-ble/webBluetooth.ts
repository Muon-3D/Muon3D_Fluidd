/**
 * Finds a Muon3D printer over Bluetooth from the browser (Iroh_BLE; ADR 0032,
 * KAN-434).
 *
 * Every M1 that runs `muon-link-ble` advertises one GATT service and serves an
 * `INFO` characteristic whose value names its Iroh EndpointId. This module asks
 * the browser's device chooser for such a printer, reads `INFO` once and hangs
 * up. Reading `INFO` does not take the printer's one Bluetooth slot: only a
 * subscription or a write does.
 *
 * What it gives is identification, not a connection: the EndpointId matches a
 * printer the Muon3D service knows, even when this browser shares no network
 * with it. Opening a printer over Bluetooth needs `muon-link-web` with Iroh_BLE
 * (KAN-435), and first-run setup over Bluetooth needs KAN-436.
 *
 * Web Bluetooth exists only in Chromium browsers, only in a secure context
 * (the hosted page, or localhost), and the chooser needs a click.
 */

/** The service every Muon printer advertises (Iroh_BLE `SERVICE_UUID`). */
export const MUON_BLE_SERVICE = '843ce1e6-c64c-4ac1-b06b-5afd8329b7f9'
/** `INFO`, read once: version, capabilities, segment size, EndpointId. */
export const MUON_BLE_INFO = '843ce1e6-c64c-4ac1-b06b-5afd8329b7fa'

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

/** A printer found over Bluetooth. */
export interface BlePrinter {
  /** The advertised name, `Muon3D-3fa9`. */
  name: string;
  info: BleInfo;
}

export type BluetoothSupport =
  | { supported: true }
  | { supported: false, reason: 'insecure' | 'unsupported' }

interface BluetoothLike {
  requestDevice (options: unknown): Promise<{
    name?: string | null;
    gatt?: {
      connect (): Promise<{
        getPrimaryService (uuid: string): Promise<{
          getCharacteristic (uuid: string): Promise<{ readValue (): Promise<DataView> }>;
        }>;
      }>;
      disconnect (): void;
    };
  }>;
}

function bluetooth (): BluetoothLike | null {
  const nav = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & { bluetooth?: BluetoothLike }) | null
  return nav?.bluetooth ?? null
}

/** Whether this browser can look for a printer over Bluetooth at all. */
export function bluetoothSupport (): BluetoothSupport {
  if (typeof window !== 'undefined' && window.isSecureContext === false) return { supported: false, reason: 'insecure' }
  if (!bluetooth()) return { supported: false, reason: 'unsupported' }
  return { supported: true }
}

/** Decodes `INFO`; `null` for anything that is not a version-1 Iroh_BLE value. */
export function decodeInfo (bytes: Uint8Array): BleInfo | null {
  if (bytes.length < 38 || bytes[0] !== 1) return null
  const caps = bytes[1]
  const maxSegment = bytes[4] | (bytes[5] << 8)
  const endpointId = Array.from(bytes.slice(6, 38), b => b.toString(16).padStart(2, '0')).join('')
  return {
    version: 1,
    maxSegment,
    endpointId,
    l2cap: (caps & 0x01) !== 0,
    writeWithResponse: (caps & 0x02) !== 0
  }
}

/**
 * Opens the browser's chooser for Muon3D printers, reads the chosen one's
 * `INFO` and disconnects. Must run from a click.
 *
 * Rejects with the browser's `NotFoundError` when the person closes the
 * chooser, which callers treat as "nothing chosen", not as a failure.
 */
export async function findPrinterOverBluetooth (): Promise<BlePrinter> {
  const bt = bluetooth()
  if (!bt) throw new Error('This browser has no Web Bluetooth.')
  const device = await bt.requestDevice({ filters: [{ services: [MUON_BLE_SERVICE] }] })
  const gatt = device.gatt
  if (!gatt) throw new Error('The printer offered no GATT connection.')
  const server = await gatt.connect()
  try {
    const service = await server.getPrimaryService(MUON_BLE_SERVICE)
    const characteristic = await service.getCharacteristic(MUON_BLE_INFO)
    const value = await characteristic.readValue()
    const info = decodeInfo(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    if (!info) throw new Error('The printer answered with an INFO value this page does not understand.')
    return { name: device.name ?? 'Muon3D printer', info }
  } finally {
    gatt.disconnect()
  }
}

/** True when the person dismissed the chooser. */
export function chooserDismissed (error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'NotFoundError'
}
