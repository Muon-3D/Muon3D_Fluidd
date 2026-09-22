import type {
  ManagedIrohEndpoint,
  ManagedIrohRelay,
  ManagedIrohTransportOptions,
  ManagedTransportConnection,
  ManagedTransportRequestUsage,
  ManagedTransportStatus,
  ManagedTransportUsage,
  PrinterSocket,
  PrinterTransport
} from './types'

/**
 * Contract-only browser adapter for an authorized managed relay session.
 * Endpoint creation is delayed until selected-printer traffic begins. It owns
 * no discovery, account, grant, loopback, encryption, or device-side logic.
 */
export class ManagedIrohPrinterTransport implements PrinterTransport {
  private readonly options: ManagedIrohTransportOptions
  private endpoint: ManagedIrohEndpoint | null = null
  private relayPromise: Promise<ManagedIrohRelay> | null = null
  private selectionGeneration = 0
  private readonly sockets = new Set<PrinterSocket>()
  private currentStatus: ManagedTransportStatus = {
    contractVersion: 'managed-iroh/v1',
    connection: 'idle',
    usage: 'IdleStatus'
  }

  constructor (options: ManagedIrohTransportOptions) {
    this.options = options
  }

  get status (): ManagedTransportStatus {
    return { ...this.currentStatus }
  }

  fetch (path: string, init?: RequestInit): Promise<Response> {
    return this.fetchWithUsage(path, init, 'Http')
  }

  async fetchWithUsage (
    path: string,
    init: RequestInit | undefined,
    usage: ManagedTransportRequestUsage
  ): Promise<Response> {
    this.updateStatus('connecting', usage)
    try {
      const response = await (await this.relay()).fetch(path, init)
      this.updateStatus('connected', 'IdleStatus')
      return response
    } catch (error) {
      this.markUnavailableUnlessClosed()
      throw error
    }
  }

  async openWebSocket (path: string): Promise<PrinterSocket> {
    this.updateStatus('connecting', 'WebSocket')
    try {
      const socket = await (await this.relay()).openWebSocket(path)
      if (this.currentStatus.connection === 'closed') {
        socket.close()
        throw new Error('Managed Iroh printer selection closed before socket was ready')
      }
      this.sockets.add(socket)
      this.updateStatus('connected', 'WebSocket')
      socket.addEventListener('close', () => {
        this.sockets.delete(socket)
        if (this.currentStatus.connection !== 'closed') {
          this.updateStatus('connected', 'IdleStatus')
        }
      })
      return socket
    } catch (error) {
      this.markUnavailableUnlessClosed()
      throw error
    }
  }

  close () {
    this.selectionGeneration += 1
    const endpoint = this.endpoint
    this.endpoint = null
    for (const socket of this.sockets) socket.close()
    this.sockets.clear()
    this.relayPromise?.then(relay => relay.close()).catch(() => {})
    endpoint?.close()
    this.relayPromise = null
    this.updateStatus('closed', 'IdleStatus')
  }

  private relay (): Promise<ManagedIrohRelay> {
    if (!this.relayPromise) {
      const generation = this.selectionGeneration
      this.relayPromise = this.options.createEndpoint().then(async endpoint => {
        if (generation !== this.selectionGeneration) {
          endpoint.close()
          throw new Error('Managed Iroh printer selection closed before endpoint was ready')
        }
        this.endpoint = endpoint
        return endpoint.openRelay(this.options.authorizedSession)
      })
    }
    return this.relayPromise
  }

  private markUnavailableUnlessClosed () {
    if (this.currentStatus.connection !== 'closed') {
      this.updateStatus('unavailable', 'IdleStatus')
    }
  }

  private updateStatus (
    connection: ManagedTransportConnection,
    usage: ManagedTransportUsage
  ) {
    this.currentStatus = {
      contractVersion: 'managed-iroh/v1',
      connection,
      usage
    }
    this.options.onStatusChange?.(this.status)
  }
}
