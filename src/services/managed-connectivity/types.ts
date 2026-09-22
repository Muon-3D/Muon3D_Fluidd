export type ManagedCapabilityAvailability = 'available' | 'unavailable'

export type ManagedCapabilityIntegration = 'merged' | 'shared' | 'unmerged' | 'absent'

export type ManagedConnectivityCapabilityName =
  | 'localDiscovery'
  | 'irohTransport'
  | 'pairingCeremony'
  | 'managedAuthentication'
  | 'managedFleet'

export interface ManagedConnectivityCapability {
  availability: ManagedCapabilityAvailability;
  integration: ManagedCapabilityIntegration;
}

export interface ManagedConnectivityCapabilities {
  localDiscovery: ManagedConnectivityCapability;
  irohTransport: ManagedConnectivityCapability;
  pairingCeremony: ManagedConnectivityCapability;
  managedAuthentication: ManagedConnectivityCapability;
  managedFleet: ManagedConnectivityCapability;
}

export type LocalPrinterSource = 'local-discovery' | 'saved-local'

export interface MergedLocalPrinter {
  id: string;
  name: string;
  endpoint: string;
  source: LocalPrinterSource;
  isCurrent: boolean;
}

export interface LocalOnlyPrinter extends MergedLocalPrinter {
  access: 'local';
}

export interface ManagedPrinter {
  id: string;
  name: string;
  access: 'managed';
}

export interface ManagedFlowStatus {
  availability: ManagedCapabilityAvailability;
  blockedBy?: ManagedConnectivityCapabilityName;
}

export interface ManagedConnectivitySnapshot {
  contractVersion: 1;
  mode: 'preview-local-only';
  capabilities: ManagedConnectivityCapabilities;
  flows: {
    onboarding: ManagedFlowStatus;
    printerLinking: ManagedFlowStatus;
    fleet: ManagedFlowStatus;
  };
  localPrinters: LocalOnlyPrinter[];
  managedPrinters: ManagedPrinter[];
}

export interface CreateManagedConnectivitySnapshotOptions {
  /**
   * The caller owns local discovery and de-duplication. This service consumes
   * that merged result so it cannot become a second device-discovery path.
   */
  mergedLocalPrinters: MergedLocalPrinter[];
  irohTransportAvailable: boolean;
}
