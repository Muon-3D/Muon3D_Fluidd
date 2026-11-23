/**
 * The page's scan (KAN-5409): the real sources wired into `runScan`.
 */
import Vue from 'vue'
import { cloudApi } from '@/services/muon-cloud/api'
import { cloudState } from '@/services/muon-cloud/state'
import { lookNearby, nearbyState, type NearbyPrinter } from '@/services/muon-ble/nearby'
import { bluetoothWhy } from '@/services/muon-ble/unavailable'
import { reachSecureNameNow } from '@/services/secure-origin/hosted'
import { newScanState, runScan, type ScanDeps, type ScanState } from './scan'

export * from './scan'

/** Read by the Scan results on the Printers page and in the welcome. */
export const scanState: ScanState = Vue.observable(newScanState())

/** The real sources. Signed out, there are no account printers to ask for. */
export function liveScanDeps (): ScanDeps {
  const canBluetooth = nearbyState.support === 'supported'
  return {
    accountPrinters: async () => {
      if (!cloudState.account) return []
      const { printers } = await cloudApi.printers()
      return printers
    },
    nearby: async () => {
      const { printers } = await cloudApi.nearby()
      return printers.map(p => ({
        printerId: p.printer_id,
        name: p.name,
        model: p.model,
        linked: !!p.linked,
        localAddrs: p.local_addrs ?? []
      }))
    },
    reach: reachSecureNameNow,
    bluetooth: canBluetooth ? () => lookNearby() : null,
    bluetoothUnavailable: bluetoothWhy()?.text ?? null,
    pageHost: location.hostname
  }
}

let scanning = false

/**
 * Scans from a click. Call it straight from the click handler: Bluetooth's chooser needs that gesture.
 * Returns the printer picked in the Bluetooth chooser, if any, for the caller to open.
 */
export async function scanForPrinters (): Promise<NearbyPrinter | null> {
  if (scanning) return null
  scanning = true
  try {
    await runScan(liveScanDeps(), scanState)
    return scanState.heard
  } finally {
    scanning = false
  }
}

/** Hides the results. */
export function dismissScan () {
  Object.assign(scanState, newScanState())
}
