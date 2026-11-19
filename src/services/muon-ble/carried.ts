import { NOT_ON_BLUETOOTH_MS, bluetoothCarrying, bluetoothFellBack } from './link'

/**
 * True once the session really travels over Bluetooth (the radio truth, KAN-2531). That is only known a
 * moment after the first answer, so it is given the time Control itself allows before it calls the session
 * "not on Bluetooth" (a relay fallback); a fallback never gets there.
 */
export async function carriedByBluetooth (printerId: string): Promise<boolean> {
  const until = Date.now() + NOT_ON_BLUETOOTH_MS + 1000
  while (!bluetoothCarrying(printerId)) {
    if (bluetoothFellBack(printerId) || Date.now() >= until) return false
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return true
}
