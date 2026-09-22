import type { AxiosInstance } from 'axios'
import type { WebSocketClient } from '@/plugins/socketClient'
import {
  createPrinterTransportForSelection,
  type PrinterTransport,
  type PrinterTransportDependencies
} from '@/services/managed-transport'
import { bindHttpClientToPrinterTransport } from './httpTransportBinding'

export interface ManagedPrinterSessionControllerOptions {
  socketClient: WebSocketClient;
  httpClient: AxiosInstance;
  transportDependencies: PrinterTransportDependencies;
}

/**
 * Framework-independent selected-printer lifecycle. It accepts only a display-
 * safe printer ID; the injected managed service owns the authorized handoff.
 */
export class ManagedPrinterSessionController {
  private readonly options: ManagedPrinterSessionControllerOptions
  private generation = 0
  private transport: PrinterTransport | null = null
  private releaseHttpBinding: (() => void) | null = null
  private currentPrinterId: string | null = null

  constructor (options: ManagedPrinterSessionControllerOptions) {
    this.options = options
  }

  get selectedPrinterId () {
    return this.currentPrinterId
  }

  async selectManagedPrinter (printerId: string): Promise<void> {
    const generation = ++this.generation
    await this.closeCurrentSession()

    const transport = await createPrinterTransportForSelection({
      kind: 'managed-iroh',
      printerId
    }, this.options.transportDependencies)

    if (generation !== this.generation) {
      transport.close()
      return
    }

    let socket
    try {
      socket = await transport.openWebSocket('/websocket')
    } catch (error) {
      transport.close()
      throw error
    }

    if (generation !== this.generation) {
      socket.close()
      transport.close()
      return
    }

    const releaseHttp = bindHttpClientToPrinterTransport(this.options.httpClient, transport)
    this.transport = transport
    this.releaseHttpBinding = releaseHttp
    this.currentPrinterId = printerId
    this.options.socketClient.adoptTransportSocket(
      socket,
      async () => {
        if (generation !== this.generation || this.transport !== transport) {
          throw new Error('Managed printer session is no longer selected')
        }
        return transport.openWebSocket('/websocket')
      }
    )
  }

  async revoke (): Promise<void> {
    this.generation += 1
    await this.closeCurrentSession()
  }

  async clearManagedSelection (): Promise<void> {
    await this.revoke()
  }

  private async closeCurrentSession () {
    const transport = this.transport
    const releaseHttp = this.releaseHttpBinding

    this.transport = null
    this.releaseHttpBinding = null
    this.currentPrinterId = null
    this.options.socketClient.releaseTransportSocket(transport === null)
    releaseHttp?.()
    transport?.close()

    // Managed transport close may resolve a previously-created relay promise.
    // Complete that close before a changed selection begins its handoff.
    await Promise.resolve()
  }
}
