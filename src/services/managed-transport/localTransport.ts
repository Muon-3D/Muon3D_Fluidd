import type { PrinterSocket, PrinterTransport } from './types'

export interface LocalPrinterTransportOptions {
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
  webSocketFactory?: (url: string) => PrinterSocket;
}

/** Direct HTTP/WebSocket behavior retained as the default Fluidd transport. */
export class LocalPrinterTransport implements PrinterTransport {
  private readonly baseUrl: string
  private readonly fetchImplementation: typeof fetch
  private readonly webSocketFactory: (url: string) => PrinterSocket
  private readonly sockets = new Set<PrinterSocket>()

  constructor (options: LocalPrinterTransportOptions = {}) {
    this.baseUrl = options.baseUrl ?? (
      typeof location === 'undefined' ? 'http://localhost' : location.origin
    )
    this.fetchImplementation = options.fetchImplementation ?? globalThis.fetch.bind(globalThis)
    this.webSocketFactory = options.webSocketFactory ?? ((url) => new WebSocket(url))
  }

  fetch (path: string, init?: RequestInit) {
    return this.fetchImplementation(new URL(path, this.baseUrl).toString(), init)
  }

  async openWebSocket (path: string): Promise<PrinterSocket> {
    const url = new URL(path, this.baseUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = this.webSocketFactory(url.toString())

    this.sockets.add(socket)
    socket.addEventListener('close', () => this.sockets.delete(socket))
    return socket
  }

  close () {
    for (const socket of this.sockets) socket.close()
    this.sockets.clear()
  }
}
