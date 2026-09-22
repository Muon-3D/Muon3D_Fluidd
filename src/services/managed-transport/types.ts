/** Shared browser transport contract for direct and managed Moonraker traffic. */
export interface PrinterSocket {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener(type: string, listener: (event: any) => void): void;
}

export const PRINTER_SOCKET_OPEN = 1

export interface PrinterTransport {
  fetch(path: string, init?: RequestInit): Promise<Response>;
  openWebSocket(path: string): Promise<PrinterSocket>;
  close(): void;
}

export type ManagedTransportContractVersion = 'managed-iroh/v1'

export type ManagedTransportUsage =
  | 'IdleStatus'
  | 'Http'
  | 'WebSocket'
  | 'Upload'
  | 'Camera'
  | 'CameraLow'
  | 'CameraMedium'
  | 'CameraHigh'

export type ManagedTransportRequestUsage = Exclude<
  ManagedTransportUsage,
  'IdleStatus' | 'WebSocket'
>

export type ManagedTransportConnection =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'closed'

export interface ManagedTransportStatus {
  contractVersion: ManagedTransportContractVersion;
  connection: ManagedTransportConnection;
  usage: ManagedTransportUsage;
}

/**
 * Secure output of the managed service's selected-printer handoff. Fleet and
 * display models contain only printer IDs; relay/session data begins here.
 * Encryption and endpoint keys remain opaque and are not part of this browser
 * contract.
 */
export interface AuthorizedManagedRelaySession {
  contractVersion: ManagedTransportContractVersion;
  sessionId: string;
  tenantId: string;
  printerId: string;
  relayUrl: string;
  expiresAt: string;
}

export interface ManagedIrohRelay {
  fetch(path: string, init?: RequestInit): Promise<Response>;
  openWebSocket(path: string): Promise<PrinterSocket>;
  close(): void;
}

/** Contract supplied by a future browser Iroh integration, not an Iroh proof. */
export interface ManagedIrohEndpoint {
  openRelay(session: AuthorizedManagedRelaySession): Promise<ManagedIrohRelay>;
  close(): void;
}

export interface ManagedIrohTransportOptions {
  authorizedSession: AuthorizedManagedRelaySession;
  createEndpoint: () => Promise<ManagedIrohEndpoint>;
  onStatusChange?: (status: ManagedTransportStatus) => void;
}

export interface LocalPrinterSelection {
  kind: 'local';
}

/** Safe display-side selection: deliberately excludes relay/session fields. */
export interface ManagedPrinterSelection {
  kind: 'managed-iroh';
  printerId: string;
}

export type PrinterTransportSelection = LocalPrinterSelection | ManagedPrinterSelection
