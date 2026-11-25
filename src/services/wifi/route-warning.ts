import { cloudState } from '@/services/muon-cloud/state'
import { remoteRouteLabel } from '@/services/muon-ble/link'

/**
 * Which warning a network change gets when the printer is reached over a
 * managed session. Over Bluetooth the link survives a Wi-Fi or hotspot change
 * (it is its own radio); through Muon3D it rides the printer's Wi-Fi and
 * does not. Null on the printer's own network, where the usual text applies.
 */
export function remoteWarningKind (remote: boolean): 'ble' | 'cloud' | null {
  if (!remote) return null
  return remoteRouteLabel(cloudState.activePrinterId) === 'Via Bluetooth' ? 'ble' : 'cloud'
}
