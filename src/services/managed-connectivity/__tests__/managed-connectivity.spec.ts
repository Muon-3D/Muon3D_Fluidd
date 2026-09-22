import { describe, expect, it } from 'vitest'

describe('managed connectivity preview', () => {
  it('keeps transport availability separate from unfinished managed services', async () => {
    const { createManagedConnectivitySnapshot } = await import('../index')

    const snapshot = createManagedConnectivitySnapshot({
      mergedLocalPrinters: [],
      irohTransportAvailable: true
    })

    expect(snapshot.mode).toBe('preview-local-only')
    expect(snapshot.capabilities).toEqual({
      localDiscovery: { availability: 'available', integration: 'merged' },
      irohTransport: { availability: 'available', integration: 'shared' },
      pairingCeremony: { availability: 'unavailable', integration: 'unmerged' },
      managedAuthentication: { availability: 'unavailable', integration: 'absent' },
      managedFleet: { availability: 'unavailable', integration: 'absent' }
    })
  })

  it('exposes an already-merged local printer without claiming it is managed', async () => {
    const { createManagedConnectivitySnapshot } = await import('../index')

    const snapshot = createManagedConnectivitySnapshot({
      mergedLocalPrinters: [{
        id: 'http://boxwood.local',
        name: 'Boxwood',
        endpoint: 'http://boxwood.local',
        source: 'local-discovery',
        isCurrent: true
      }],
      irohTransportAvailable: true
    })

    expect(snapshot.localPrinters).toEqual([{
      id: 'http://boxwood.local',
      name: 'Boxwood',
      endpoint: 'http://boxwood.local',
      source: 'local-discovery',
      isCurrent: true,
      access: 'local'
    }])
    expect(snapshot.managedPrinters).toEqual([])
  })

  it('blocks each managed flow at the capability that is actually missing', async () => {
    const { createManagedConnectivitySnapshot } = await import('../index')
    const snapshot = createManagedConnectivitySnapshot({
      mergedLocalPrinters: [],
      irohTransportAvailable: true
    })

    expect(snapshot.flows.onboarding).toEqual({
      availability: 'unavailable',
      blockedBy: 'managedAuthentication'
    })
    expect(snapshot.flows.printerLinking).toEqual({
      availability: 'unavailable',
      blockedBy: 'pairingCeremony'
    })
    expect(snapshot.flows.fleet).toEqual({
      availability: 'unavailable',
      blockedBy: 'managedFleet'
    })
  })
})
