import { describe, expect, it, vi } from 'vitest'
import {
  ManagedIrohPrinterTransport,
  createPrinterTransportForSelection
} from '../index'
import type {
  AuthorizedManagedRelaySession,
  ManagedIrohEndpoint,
  ManagedIrohRelay,
  PrinterSocket,
  PrinterTransport
} from '../index'

describe('managed printer transport selection', () => {
  it('keeps direct local HTTP and WebSocket transport as the default', async () => {
    const requests: string[] = []
    const socketUrls: string[] = []
    const socket = contractSocket()
    const createManagedEndpoint = vi.fn<[], Promise<ManagedIrohEndpoint>>()
    const handoffSelectedPrinter = vi.fn()

    const transport = await createPrinterTransportForSelection(undefined, {
      local: {
        baseUrl: 'https://printer.local',
        fetchImplementation: async (input) => {
          requests.push(String(input))
          return new Response(null, { status: 204 })
        },
        webSocketFactory: (url) => {
          socketUrls.push(url)
          return socket
        }
      },
      handoffSelectedPrinter,
      createManagedEndpoint
    })

    await transport.fetch('/server/info')
    expect(await transport.openWebSocket('/websocket')).toBe(socket)

    expect(requests).toEqual(['https://printer.local/server/info'])
    expect(socketUrls).toEqual(['wss://printer.local/websocket'])
    expect(handoffSelectedPrinter).not.toHaveBeenCalled()
    expect(createManagedEndpoint).not.toHaveBeenCalled()
  })

  it('requires an explicit managed printer selection before creating a managed transport', async () => {
    const relayRequests: string[] = []
    const relay: ManagedIrohRelay = {
      fetch: async (path) => {
        relayRequests.push(path)
        return new Response(null, { status: 204 })
      },
      openWebSocket: async () => contractSocket(),
      close: () => {}
    }
    const authorizedSession: AuthorizedManagedRelaySession = {
      contractVersion: 'managed-iroh/v1',
      sessionId: 'session-31',
      tenantId: 'tenant-muon',
      printerId: 'printer-17',
      relayUrl: 'https://relay.example.test',
      expiresAt: futureExpiry()
    }
    const relaySessions: AuthorizedManagedRelaySession[] = []
    const createManagedEndpoint = vi.fn(async (): Promise<ManagedIrohEndpoint> => ({
      openRelay: async (session) => {
        relaySessions.push(session)
        return relay
      },
      close: () => {}
    }))

    const handoffSelectedPrinter = vi.fn(async (printerId: string) => {
      expect(printerId).toBe('printer-17')
      return authorizedSession
    })
    const transport = await createPrinterTransportForSelection({
      kind: 'managed-iroh',
      printerId: 'printer-17'
    }, {
      handoffSelectedPrinter,
      createManagedEndpoint
    })

    expect(transport).toBeInstanceOf(ManagedIrohPrinterTransport)
    expect(handoffSelectedPrinter).toHaveBeenCalledTimes(1)
    expect(createManagedEndpoint).not.toHaveBeenCalled()

    await transport.fetch('/printer/objects/list')

    expect(createManagedEndpoint).toHaveBeenCalledTimes(1)
    expect(relaySessions).toEqual([authorizedSession])
    expect(relayRequests).toEqual(['/printer/objects/list'])
  })
})

describe('ManagedIrohPrinterTransport contract', () => {
  it('shares one relay across HTTP and WebSocket traffic', async () => {
    const calls: Array<{ kind: string; path: string }> = []
    const socket = contractSocket()
    const relay: ManagedIrohRelay = {
      fetch: async (path) => {
        calls.push({ kind: 'http', path })
        return new Response(JSON.stringify({ result: 'ready' }), { status: 200 })
      },
      openWebSocket: async (path) => {
        calls.push({ kind: 'websocket', path })
        return socket
      },
      close: () => {}
    }
    const openRelay = vi.fn(async () => relay)
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: {
        contractVersion: 'managed-iroh/v1',
        sessionId: 'session-31',
        tenantId: 'tenant-muon',
        printerId: 'printer-17',
        relayUrl: 'https://relay.example.test',
        expiresAt: futureExpiry()
      },
      createEndpoint: async () => ({ openRelay, close: () => {} })
    })

    const response = await transport.fetch('/server/info')
    expect(await transport.openWebSocket('/websocket')).toBe(socket)

    await expect(response.json()).resolves.toEqual({ result: 'ready' })
    expect(openRelay).toHaveBeenCalledTimes(1)
    expect(calls).toEqual([
      { kind: 'http', path: '/server/info' },
      { kind: 'websocket', path: '/websocket' }
    ])
    expect(transport.status).toEqual({
      contractVersion: 'managed-iroh/v1',
      connection: 'connected',
      usage: 'WebSocket'
    })
  })

  it('reports HTTP usage and returns to idle status after the request completes', async () => {
    let releaseResponse: () => void = () => {}
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    const statusChanges: string[] = []
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: {
        contractVersion: 'managed-iroh/v1',
        sessionId: 'session-31',
        tenantId: 'tenant-muon',
        printerId: 'printer-17',
        relayUrl: 'https://relay.example.test',
        expiresAt: futureExpiry()
      },
      createEndpoint: async () => ({
        openRelay: async () => ({
          fetch: async () => {
            await responseReady
            return new Response(null, { status: 204 })
          },
          openWebSocket: async () => contractSocket(),
          close: () => {}
        }),
        close: () => {}
      }),
      onStatusChange: status => statusChanges.push(`${status.connection}:${status.usage}`)
    })

    const request = transport.fetch('/server/info')
    await Promise.resolve()
    expect(transport.status.usage).toBe('Http')

    releaseResponse()
    await request

    expect(statusChanges).toContain('connecting:Http')
    expect(transport.status).toEqual({
      contractVersion: 'managed-iroh/v1',
      connection: 'connected',
      usage: 'IdleStatus'
    })
  })

  it('closes a late endpoint when its managed printer selection has ended', async () => {
    let resolveEndpoint: (endpoint: ManagedIrohEndpoint) => void = () => {}
    const endpointReady = new Promise<ManagedIrohEndpoint>((resolve) => {
      resolveEndpoint = resolve
    })
    const endpointClose = vi.fn()
    const relayOpen = vi.fn()
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: {
        contractVersion: 'managed-iroh/v1',
        sessionId: 'session-31',
        tenantId: 'tenant-muon',
        printerId: 'printer-17',
        relayUrl: 'https://relay.example.test',
        expiresAt: futureExpiry()
      },
      createEndpoint: () => endpointReady
    })

    const inFlightRequest = transport.fetch('/server/info')
    transport.close()
    resolveEndpoint({
      openRelay: relayOpen,
      close: endpointClose
    })

    await expect(inFlightRequest).rejects.toThrow('selection closed')
    expect(endpointClose).toHaveBeenCalledTimes(1)
    expect(relayOpen).not.toHaveBeenCalled()
  })

  it('closes both the selected relay and endpoint when access is revoked', async () => {
    const relayClose = vi.fn()
    const endpointClose = vi.fn()
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: {
        contractVersion: 'managed-iroh/v1',
        sessionId: 'session-31',
        tenantId: 'tenant-muon',
        printerId: 'printer-17',
        relayUrl: 'https://relay.example.test',
        expiresAt: futureExpiry()
      },
      createEndpoint: async () => ({
        openRelay: async () => ({
          fetch: async () => new Response(null, { status: 204 }),
          openWebSocket: async () => contractSocket(),
          close: relayClose
        }),
        close: endpointClose
      })
    })

    await transport.fetch('/server/info')
    transport.close()
    await Promise.resolve()

    expect(relayClose).toHaveBeenCalledTimes(1)
    expect(endpointClose).toHaveBeenCalledTimes(1)
    expect(transport.status.connection).toBe('closed')
  })
})

function contractSocket (): PrinterSocket {
  return {
    readyState: 1,
    send: () => {},
    close: () => {},
    addEventListener: () => {}
  }
}

function futureExpiry (): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString()
}

const satisfiesTransport: PrinterTransport | undefined = undefined
expect(satisfiesTransport).toBeUndefined()
