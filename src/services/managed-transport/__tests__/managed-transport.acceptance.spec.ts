import { describe, expect, it, vi } from 'vitest'

import {
  ManagedIrohPrinterTransport,
  createPrinterTransportForSelection,
  type AuthorizedManagedRelaySession,
  type ManagedIrohEndpoint,
  type ManagedIrohRelay,
  type ManagedPrinterSelection,
  type PrinterSocket
} from '../index'

describe('managed transport integration acceptance', () => {
  it('passes the selected managed ID once through opaque handoff and stays endpoint-free until Moonraker traffic', async () => {
    const session = authorizedSession()
    const handoff = vi.fn(async (printerId: string) => {
      expect(printerId).toBe(session.printerId)
      return session
    })
    const relay = relayFor({ fetch: async () => new Response(null, { status: 204 }) })
    const openRelay = vi.fn(async (received: AuthorizedManagedRelaySession) => {
      expect(received).toEqual(session)
      return relay
    })
    const createEndpoint = vi.fn(async (): Promise<ManagedIrohEndpoint> => ({
      openRelay,
      close: () => {}
    }))

    const transport = await createPrinterTransportForSelection(
      { kind: 'managed-iroh', printerId: session.printerId },
      { handoffSelectedPrinter: handoff, createManagedEndpoint: createEndpoint }
    )

    expect(handoff).toHaveBeenCalledTimes(1)
    expect(handoff).toHaveBeenCalledWith(session.printerId)
    expect(createEndpoint).not.toHaveBeenCalled()

    await transport.fetch('/server/info')

    expect(createEndpoint).toHaveBeenCalledTimes(1)
    expect(openRelay).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['mismatched printer', { printerId: 'other-printer' }, /match/i],
    ['expired session', { expiresAt: '2020-01-01T00:00:00.000Z' }, /expired/i],
    ['incomplete session', { sessionId: '' }, /incomplete/i]
  ])('rejects %s before creating an endpoint', async (_label, patch, expectedError) => {
    const session = { ...authorizedSession(), ...patch } as AuthorizedManagedRelaySession
    const createEndpoint = vi.fn<[], Promise<ManagedIrohEndpoint>>()

    await expect(createPrinterTransportForSelection(
      { kind: 'managed-iroh', printerId: 'printer-17' },
      {
        handoffSelectedPrinter: async () => session,
        createManagedEndpoint: createEndpoint
      }
    )).rejects.toThrow(expectedError)

    expect(createEndpoint).not.toHaveBeenCalled()
  })

  it('keeps managed traffic independent from local readiness', async () => {
    const managedRequests: string[] = []
    const relay = relayFor({
      fetch: async (path) => {
        managedRequests.push(path)
        return new Response(null, { status: 204 })
      }
    })
    const localFetch = vi.fn(async () => {
      throw new Error('local printer is not ready')
    })

    const transport = await createPrinterTransportForSelection(
      { kind: 'managed-iroh', printerId: 'printer-17' },
      {
        local: { fetchImplementation: localFetch },
        handoffSelectedPrinter: async () => authorizedSession(),
        createManagedEndpoint: async () => ({
          openRelay: async () => relay,
          close: () => {}
        })
      }
    )

    await transport.fetch('/printer/objects/query')

    expect(managedRequests).toEqual(['/printer/objects/query'])
    expect(localFetch).not.toHaveBeenCalled()
  })

  it('bypasses managed handoff for local and no-selection defaults', async () => {
    const handoff = vi.fn()
    const createEndpoint = vi.fn<[], Promise<ManagedIrohEndpoint>>()
    const transportOptions = {
      handoffSelectedPrinter: handoff,
      createManagedEndpoint: createEndpoint,
      local: {
        baseUrl: 'https://printer.local',
        fetchImplementation: async () => new Response(null, { status: 204 })
      }
    }

    await createPrinterTransportForSelection(undefined, transportOptions)
    await createPrinterTransportForSelection({ kind: 'local' }, transportOptions)

    expect(handoff).not.toHaveBeenCalled()
    expect(createEndpoint).not.toHaveBeenCalled()
  })

  it('uses one normal open lifecycle for an already-open managed socket', async () => {
    const socket = socketWithState(1)
    const openWebSocket = vi.fn(async () => socket)
    const statusChanges: string[] = []
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: authorizedSession(),
      createEndpoint: async () => ({
        openRelay: async () => relayFor({ openWebSocket }),
        close: () => {}
      }),
      onStatusChange: status => statusChanges.push(`${status.connection}:${status.usage}`)
    })

    expect(await transport.openWebSocket('/websocket')).toBe(socket)

    expect(openWebSocket).toHaveBeenCalledTimes(1)
    expect(statusChanges).toEqual(['connecting:WebSocket', 'connected:WebSocket'])
  })

  it('closes the old socket, relay, and endpoint when a managed session is revoked', async () => {
    const socket = socketWithState(1)
    const socketClose = vi.spyOn(socket, 'close')
    const relayClose = vi.fn()
    const endpointClose = vi.fn()
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: authorizedSession(),
      createEndpoint: async () => ({
        openRelay: async () => relayFor({ openWebSocket: async () => socket, close: relayClose }),
        close: endpointClose
      })
    })

    await transport.openWebSocket('/websocket')
    transport.close()
    await Promise.resolve()

    expect(socketClose).toHaveBeenCalledTimes(1)
    expect(relayClose).toHaveBeenCalledTimes(1)
    expect(endpointClose).toHaveBeenCalledTimes(1)
  })

  it('keeps runtime display models free of relay and session credentials', () => {
    const selection: ManagedPrinterSelection = {
      kind: 'managed-iroh',
      printerId: 'printer-17'
    }

    expect(Object.keys(selection)).toEqual(['kind', 'printerId'])
    expect(selection).not.toHaveProperty('sessionId')
    expect(selection).not.toHaveProperty('relayUrl')
    expect(selection).not.toHaveProperty('expiresAt')
  })
})

function authorizedSession (): AuthorizedManagedRelaySession {
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: 'session-31',
    tenantId: 'tenant-muon',
    printerId: 'printer-17',
    relayUrl: 'https://relay.example.test',
    expiresAt: '2099-09-22T14:00:00.000Z'
  }
}

function relayFor (overrides: Partial<ManagedIrohRelay> = {}): ManagedIrohRelay {
  return {
    fetch: async () => new Response(null, { status: 204 }),
    openWebSocket: async () => socketWithState(1),
    close: () => {},
    ...overrides
  }
}

function socketWithState (readyState: number): PrinterSocket {
  return {
    readyState,
    send: () => {},
    close: () => {},
    addEventListener: () => {}
  }
}
