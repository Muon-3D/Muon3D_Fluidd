import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { WebSocketClient } from '@/plugins/socketClient'
import { ManagedPrinterSessionController } from '../index'
import type {
  AuthorizedManagedRelaySession,
  ManagedIrohEndpoint,
  ManagedIrohRelay,
  PrinterSocket
} from '@/services/managed-transport'

describe('WebSocketClient transport adoption', () => {
  it('attaches every handler before opening an already-open transport socket exactly once', () => {
    const events: string[] = []
    const store = socketStore(events)
    const client = new WebSocketClient({
      url: 'ws://local-printer/websocket',
      store
    } as never)
    const socket = new ContractSocket(1, events)

    client.adoptTransportSocket(socket)

    expect(events.slice(0, 4)).toEqual([
      'attach:open',
      'attach:close',
      'attach:error',
      'attach:message'
    ])
    expect(store.dispatch).toHaveBeenCalledWith('socket/onSocketConnecting', false)
    expect(store.dispatch).toHaveBeenCalledWith('socket/onSocketOpen', true)

    socket.emit('open', {})

    expect(store.dispatch.mock.calls.filter(call => call[0] === 'socket/onSocketOpen')).toHaveLength(1)
  })
})

describe('ManagedPrinterSessionController', () => {
  it('binds existing Axios actions and the Fluidd socket lifecycle to one authorized session', async () => {
    const events: string[] = []
    const store = socketStore(events)
    const socketClient = new WebSocketClient({ url: '', store } as never)
    const httpClient = axios.create()
    const originalAdapter = httpClient.defaults.adapter
    const socket = new ContractSocket(1, events)
    const relayRequests: string[] = []
    const relay: ManagedIrohRelay = {
      fetch: async (path) => {
        relayRequests.push(path)
        return new Response(JSON.stringify({ result: { klippy_connected: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      },
      openWebSocket: async (path) => {
        events.push(`relay:websocket:${path}`)
        return socket
      },
      close: () => events.push('relay:close')
    }
    const controller = new ManagedPrinterSessionController({
      socketClient,
      httpClient,
      transportDependencies: dependenciesFor(relay, events)
    })

    await controller.selectManagedPrinter('printer-17')
    const response = await httpClient.get('/server/info')

    expect(response.data).toEqual({ result: { klippy_connected: true } })
    expect(relayRequests).toEqual(['/server/info'])
    expect(socketClient.connection).toBe(socket)
    expect(events.indexOf('relay:websocket:/websocket')).toBeLessThan(events.indexOf('attach:open'))

    await controller.revoke()

    expect(socket.closed).toBe(true)
    expect(events).toContain('relay:close')
    expect(httpClient.defaults.adapter).toBe(originalAdapter)
  })

  it('closes the prior socket and transport before binding a changed selection', async () => {
    const events: string[] = []
    const store = socketStore(events)
    const socketClient = new WebSocketClient({ url: '', store } as never)
    const httpClient = axios.create()
    const relays = new Map<string, ManagedIrohRelay>()
    for (const printerId of ['printer-a', 'printer-b']) {
      const socket = new ContractSocket(1, events, printerId)
      relays.set(printerId, {
        fetch: async () => new Response(null, { status: 204 }),
        openWebSocket: async () => {
          events.push(`${printerId}:socket-open`)
          return socket
        },
        close: () => events.push(`${printerId}:relay-close`)
      })
    }
    const controller = new ManagedPrinterSessionController({
      socketClient,
      httpClient,
      transportDependencies: {
        handoffSelectedPrinter: async printerId => sessionFor(printerId),
        createManagedEndpoint: async () => ({
          openRelay: async session => relays.get(session.printerId) as ManagedIrohRelay,
          close: () => events.push('endpoint:close')
        })
      }
    })

    await controller.selectManagedPrinter('printer-a')
    await controller.selectManagedPrinter('printer-b')

    expect(events.indexOf('printer-a:socket-close')).toBeLessThan(events.indexOf('printer-b:socket-open'))
    expect(events.indexOf('printer-a:relay-close')).toBeLessThan(events.indexOf('printer-b:socket-open'))
    expect(controller.selectedPrinterId).toBe('printer-b')
  })
})

function dependenciesFor (relay: ManagedIrohRelay, events: string[]) {
  return {
    handoffSelectedPrinter: async (printerId: string) => sessionFor(printerId),
    createManagedEndpoint: async (): Promise<ManagedIrohEndpoint> => ({
      openRelay: async (session) => {
        events.push(`handoff:${session.printerId}`)
        return relay
      },
      close: () => events.push('endpoint:close')
    })
  }
}

function sessionFor (printerId: string): AuthorizedManagedRelaySession {
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: `session:${printerId}`,
    tenantId: 'tenant-muon',
    printerId,
    relayUrl: 'https://relay.example.test',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }
}

function socketStore (events: string[]) {
  return {
    state: {
      socket: { disconnecting: false, connecting: false },
      files: { download: false }
    },
    dispatch: vi.fn((name: string) => events.push(`dispatch:${name}`)),
    commit: vi.fn((name: string) => events.push(`commit:${name}`))
  }
}

class ContractSocket implements PrinterSocket {
  readonly listeners = new Map<string, Array<(event: any) => void>>()
  readonly readyState: number
  closed = false
  private readonly events: string[]
  private readonly name: string

  constructor (
    readyState: number,
    events: string[],
    name = 'managed'
  ) {
    this.readyState = readyState
    this.events = events
    this.name = name
  }

  send () {}

  close () {
    this.closed = true
    this.events.push(`${this.name}:socket-close`)
  }

  addEventListener (type: string, listener: (event: any) => void) {
    this.events.push(`attach:${type}`)
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  emit (type: string, event: any) {
    this.listeners.get(type)?.forEach(listener => listener(event))
  }
}
