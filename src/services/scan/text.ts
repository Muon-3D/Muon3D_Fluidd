/**
 * The scan's state and the words it shows (KAN-5409). Nothing here imports the app, so a component
 * can show the scan without dragging in the console client or the store.
 */
import type { NearbyPrinter } from '@/services/muon-ble/nearby'

/** What the scan needs to know of each account printer. */
export interface ScanAccountPrinter {
  id: string;
  name: string;
  secure_name?: string | null;
}

export interface ScanSecure {
  id: string;
  name: string;
  secureName: string;
  /** Opened in this tab. */
  url: string;
}

export interface ScanLocal {
  id: string;
  name: string;
  host: string;
  /** Plain http: top-level navigation is allowed from an https page, a fetch is not. */
  url: string;
}

export type SourceState = 'idle' | 'running' | 'done' | 'skipped'

export interface ScanState {
  phase: 'idle' | 'scanning' | 'done';
  cloud: SourceState;
  /** Why the cloud part was skipped, in one line. */
  cloudWhy: string | null;
  bluetooth: SourceState;
  bluetoothWhy: string | null;
  /** The printer picked in the Bluetooth chooser. */
  heard: NearbyPrinter | null;
  secure: ScanSecure[];
  local: ScanLocal[];
  /** What was tried, for the one empty line. */
  tried: string[];
}

export const CLOUD_ACCOUNT = "your printers' secure addresses"
export const CLOUD_NEARBY = 'the Muon3D list of printers on this network'
export const SCAN_TIMEOUT_MS = 6000
export const OFFLINE_WHY = "Couldn't reach the Muon3D service from here, so your account's printers and the same-network list were not checked. Check your internet connection."

export function newScanState (): ScanState {
  return {
    phase: 'idle',
    cloud: 'idle',
    cloudWhy: null,
    bluetooth: 'idle',
    bluetoothWhy: null,
    heard: null,
    secure: [],
    local: [],
    tried: []
  }
}

/** The line shown while scanning. */
export function progressLine (st: ScanState): string {
  const parts: string[] = []
  if (st.cloud === 'running') parts.push('checking your printers on this network…')
  if (st.bluetooth === 'running') parts.push('searching Bluetooth…')
  return parts.length ? `Scanning: ${parts.join(' ')}` : 'Scanning…'
}

/** Whether the scan has anything to list. */
export function foundAnything (st: ScanState): boolean {
  return !!(st.secure.length || st.local.length || st.heard)
}

/** The one line when nothing turned up: what was tried. */
export function emptyLine (st: ScanState): string {
  const tried = st.tried.length ? st.tried.join(', ') : 'nothing could be checked'
  return `No printers found. Tried: ${tried}.`
}
