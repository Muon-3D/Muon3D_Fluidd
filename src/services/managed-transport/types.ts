/** Shared browser transport contract for direct and managed Moonraker traffic. */
export interface PrinterSocket {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener(type: string, listener: (event: any) => void): void;
}

export const PRINTER_SOCKET_OPEN = 1

export type UploadProgress = (sent: number, total: number) => void

export interface PrinterTransport {
  fetch(path: string, init?: RequestInit, progress?: UploadProgress): Promise<Response>;
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
  /**
   * True for a session this page made itself because the console gave no
   * grant (KAN-1253: opening over Bluetooth). Nothing authorised it: it only
   * names the relay and printer to dial, and the printer decides admission.
   * No code may treat such a session as proof of access.
   */
  grantless?: boolean;
}

export interface ManagedIrohRelay {
  fetch(path: string, init?: RequestInit, progress?: UploadProgress): Promise<Response>;
  openWebSocket(path: string): Promise<PrinterSocket>;
  close(): void;
  /** True once the relay closed itself; the transport then dials a new one. */
  readonly closed?: boolean;
}

/** Contract supplied by a future browser Iroh integration, not an Iroh proof. */
export interface ManagedIrohEndpoint {
  openRelay(session: AuthorizedManagedRelaySession): Promise<ManagedIrohRelay>;
  close(): void;
}

export interface ManagedIrohTransportOptions {
  authorizedSession: AuthorizedManagedRelaySession;
  createEndpoint: () => Promise<ManagedIrohEndpoint>;
  /** A fresh handoff, for when dials keep failing with the one it has. */
  reauthorize?: () => Promise<AuthorizedManagedRelaySession>;
  /**
   * A fresh handoff ahead of an ordinary redial (best effort: it may refuse or
   * be skipped, and the redial then goes out with the session it has). Falls
   * back to `reauthorize`.
   */
  regrant?: () => Promise<AuthorizedManagedRelaySession>;
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
