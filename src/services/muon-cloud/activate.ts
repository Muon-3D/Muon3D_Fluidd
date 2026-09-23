/**
 * Switching Fluidd between printers: a local one over the LAN, or a cloud one
 * over Iroh.
 *
 * A cloud printer reuses Fluidd's own machinery end to end. Axios is routed
 * through the Iroh transport, `appInit` loads the printer's own database (its
 * dashboard layout lives there), and the socket client adopts a WebSocket that
 * runs through the gateway. Nothing above that layer knows the difference.
 */
import Vue from 'vue'
import store from '@/store'
import { appInit } from '@/init'
import type { InstanceConfig } from '@/store/config/types'
import { bindHttpClientToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import {
  createPrinterTransportForSelection,
  type AuthorizedManagedRelaySession,
  type PrinterTransport
} from '@/services/managed-transport'
import { managedEndpointFactory } from './iroh'
import { cloudState, printerName, requestAccess, setActiveCloudPrinter } from './state'

/** The API origin Fluidd is told about while a cloud printer is selected. Never dialled. */
export const MANAGED_API_URL = 'https://muon-cloud.invalid'
export const MANAGED_SOCKET_URL = 'wss://muon-cloud.invalid/websocket'

export const activationState = Vue.observable({
  switching: null as string | null,
  error: null as string | null
})

let current: { transport: PrinterTransport, release: () => void } | null = null
let generation = 0

function releaseCurrent () {
  if (!current) return
  Vue.$socket?.releaseTransportSocket(true)
  current.release()
  current.transport.close()
  current = null
}

async function handoff (printerId: string): Promise<AuthorizedManagedRelaySession> {
  const grant = await requestAccess(printerId)
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: grant.grant_id,
    tenantId: cloudState.account?.id ?? '',
    printerId: grant.printer_id,
    relayUrl: grant.relay_url,
    expiresAt: new Date(grant.expires_at * 1000).toISOString()
  }
}

/** Points Fluidd at a cloud printer. */
export async function activateCloudPrinter (printerId: string) {
  const mine = ++generation
  activationState.switching = printerId
  activationState.error = null
  try {
    Vue.$socket?.releaseTransportSocket(true)
    releaseCurrent()
    const transport = await createPrinterTransportForSelection(
      { kind: 'managed-iroh', printerId },
      { handoffSelectedPrinter: handoff, createManagedEndpoint: managedEndpointFactory }
    )
    if (mine !== generation) {
      transport.close()
      return
    }
    const release = bindHttpClientToPrinterTransport(Vue.$httpClient, transport)
    current = { transport, release }
    setActiveCloudPrinter(printerId)

    const instance: InstanceConfig = {
      name: printerName(printerId),
      apiUrl: MANAGED_API_URL,
      socketUrl: MANAGED_SOCKET_URL,
      active: true
    }
    await appInit(instance, store.state.config.hostConfig)
    if (mine !== generation) return

    const socket = await transport.openWebSocket('/websocket')
    if (mine !== generation) {
      socket.close()
      return
    }
    Vue.$socket.adoptTransportSocket(socket, () => transport.openWebSocket('/websocket'))
  } catch (error) {
    if (mine === generation) {
      activationState.error = (error as Error).message
      setActiveCloudPrinter(null)
      releaseCurrent()
    }
    throw error
  } finally {
    if (mine === generation) activationState.switching = null
  }
}

/** Points Fluidd back at a printer on the local network. */
export async function activateLocalPrinter (instance: InstanceConfig) {
  ++generation
  activationState.error = null
  releaseCurrent()
  setActiveCloudPrinter(null)
  Vue.$socket?.close()
  const config = await appInit(instance, store.state.config.hostConfig)
  if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
    Vue.$socket.connect(config.apiConfig.socketUrl)
  }
}

/** Whether Fluidd is showing a cloud printer now. */
export function isCloudActive (): boolean {
  return current !== null && cloudState.activePrinterId !== null
}
