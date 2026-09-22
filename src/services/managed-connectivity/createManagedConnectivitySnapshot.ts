import type {
  CreateManagedConnectivitySnapshotOptions,
  ManagedConnectivitySnapshot
} from './types'

export function createManagedConnectivitySnapshot (
  options: CreateManagedConnectivitySnapshotOptions
): ManagedConnectivitySnapshot {
  const transportAvailability = options.irohTransportAvailable
    ? 'available'
    : 'unavailable'

  return {
    contractVersion: 1,
    mode: 'preview-local-only',
    capabilities: {
      localDiscovery: {
        availability: 'available',
        integration: 'merged'
      },
      irohTransport: {
        availability: transportAvailability,
        integration: 'shared'
      },
      pairingCeremony: {
        availability: 'unavailable',
        integration: 'unmerged'
      },
      managedAuthentication: {
        availability: 'unavailable',
        integration: 'absent'
      },
      managedFleet: {
        availability: 'unavailable',
        integration: 'absent'
      }
    },
    flows: {
      onboarding: {
        availability: 'unavailable',
        blockedBy: 'managedAuthentication'
      },
      printerLinking: {
        availability: 'unavailable',
        blockedBy: options.irohTransportAvailable
          ? 'pairingCeremony'
          : 'irohTransport'
      },
      fleet: {
        availability: 'unavailable',
        blockedBy: 'managedFleet'
      }
    },
    localPrinters: options.mergedLocalPrinters.map(printer => ({
      ...printer,
      access: 'local'
    })),
    managedPrinters: []
  }
}
