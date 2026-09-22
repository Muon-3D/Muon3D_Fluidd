import { describe, expect, it } from 'vitest'

import { createManagedConnectivitySnapshot } from '../index'

describe('managed connectivity boundaries', () => {
  it('does not present placeholder managed auth as real authorization', () => {
    const snapshot = createManagedConnectivitySnapshot({
      mergedLocalPrinters: [],
      irohTransportAvailable: true
    })

    expect(snapshot.capabilities.managedAuthentication).toEqual({
      availability: 'unavailable',
      integration: 'absent'
    })
    expect(snapshot.flows.onboarding).toEqual({
      availability: 'unavailable',
      blockedBy: 'managedAuthentication'
    })
    expect(snapshot.managedPrinters).toEqual([])
    expect(snapshot).not.toHaveProperty('authorization')
    expect(snapshot).not.toHaveProperty('accessToken')
  })

  it('feeds merged local discovery into fleet presentation as local-only printers', () => {
    const mergedLocalPrinters = [
      {
        id: 'http://boxwood.local',
        name: 'Boxwood',
        endpoint: 'http://boxwood.local',
        source: 'local-discovery' as const,
        isCurrent: true
      },
      {
        id: 'http://walnut.local',
        name: 'Walnut',
        endpoint: 'http://walnut.local',
        source: 'saved-local' as const,
        isCurrent: false
      }
    ]

    const snapshot = createManagedConnectivitySnapshot({
      mergedLocalPrinters,
      irohTransportAvailable: false
    })

    expect(snapshot.localPrinters).toEqual(mergedLocalPrinters.map(printer => ({
      ...printer,
      access: 'local'
    })))
    expect(snapshot.managedPrinters).toEqual([])
  })
})
