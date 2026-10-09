/**
 * What Fluidd shows now, read for the bridge (selection.ts turns it into the
 * BridgePrinter the slicer is told of). Read at once from Fluidd's own state:
 * the API address, the socket, the cloud printer and the transport its
 * requests travel over.
 *
 * Fluidd's $httpClient always talks to the printer selected now, so the
 * selection follows the transport, not only the store: while the client is
 * bound to a cloud printer's Iroh connection, that printer is the selection
 * (none until the account names it); while it is not bound, the network
 * printer at the store's API address is, and the cloud placeholder address
 * with no transport (a switch under way) is none. While a cloud printer is
 * being opened (activationState.switching), nothing is selected either: the
 * client is bound to the new printer's transport a moment before the account
 * names it active, and the frame must not be told of the old one meanwhile.
 */
import type { Store } from 'vuex'
import { cloudState } from '@/services/muon-cloud/state'
import { activationState } from '@/services/muon-cloud/activate'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import type { CloudEntry, FluiddSelection } from './selection'

export function readFluiddSelection (store: Pick<Store<any>, 'state' | 'getters'>): FluiddSelection {
  const connected = store.getters['socket/getConnectionState'] === true
  const apiUrl = (store.state.config?.apiUrl ?? '') as string
  if (activationState.switching !== null) {
    return { switching: true, cloud: null, apiUrl: '', displayName: '', connected }
  }
  if (printerTransportBinding.remote) {
    const id = cloudState.activePrinterId
    const entry = id ? cloudState.printers.find(p => p.id === id) : undefined
    const cloud: CloudEntry | null = entry
      ? { id: entry.id, name: entry.name, model: entry.model, online: entry.online, role: entry.role ?? null, shared: entry.shared === true }
      : null
    return { switching: !cloud, cloud, cloudName: entry?.name, apiUrl: '', displayName: '', connected }
  }
  if (!apiUrl || isManagedApiUrl(apiUrl)) {
    return { switching: isManagedApiUrl(apiUrl), cloud: null, apiUrl: '', displayName: '', connected }
  }
  const instance = store.getters['config/getCurrentInstance'] as { apiUrl?: string, endpointId?: string } | undefined
  return {
    switching: false,
    cloud: null,
    apiUrl,
    displayName: (store.getters['config/getDisplayName'] as string | undefined) ?? '',
    savedEndpointId: instance?.apiUrl === apiUrl ? instance.endpointId ?? null : null,
    connected
  }
}
