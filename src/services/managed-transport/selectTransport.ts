import {
  LocalPrinterTransport,
  type LocalPrinterTransportOptions
} from './localTransport'
import { ManagedIrohPrinterTransport } from './managedIrohTransport'
import type {
  AuthorizedManagedRelaySession,
  ManagedIrohEndpoint,
  ManagedTransportStatus,
  PrinterTransport,
  PrinterTransportSelection
} from './types'

export interface PrinterTransportDependencies {
  local?: LocalPrinterTransportOptions;
  handoffSelectedPrinter?: (printerId: string) => Promise<AuthorizedManagedRelaySession>;
  createManagedEndpoint?: () => Promise<ManagedIrohEndpoint>;
  onManagedStatusChange?: (status: ManagedTransportStatus) => void;
}

/**
 * Selection boundary used outside components. Undefined/local selection keeps
 * normal browser HTTP/WebSocket behavior. Managed construction happens only
 * after the managed service returns an authorized session handoff.
 */
export async function createPrinterTransportForSelection (
  selection: PrinterTransportSelection | undefined,
  dependencies: PrinterTransportDependencies = {}
): Promise<PrinterTransport> {
  if (!selection || selection.kind === 'local') {
    return new LocalPrinterTransport(dependencies.local)
  }

  if (!dependencies.handoffSelectedPrinter) {
    throw new Error('Managed printer session handoff is unavailable')
  }
  if (!dependencies.createManagedEndpoint) {
    throw new Error('Managed Iroh endpoint integration is unavailable')
  }

  const authorizedSession = await dependencies.handoffSelectedPrinter(selection.printerId)
  assertAuthorizedSessionMatchesSelection(authorizedSession, selection.printerId)

  return new ManagedIrohPrinterTransport({
    authorizedSession,
    createEndpoint: dependencies.createManagedEndpoint,
    onStatusChange: dependencies.onManagedStatusChange
  })
}

function assertAuthorizedSessionMatchesSelection (
  session: AuthorizedManagedRelaySession,
  selectedPrinterId: string
) {
  if (session.contractVersion !== 'managed-iroh/v1') {
    throw new Error('Unsupported managed transport contract')
  }
  if (session.printerId !== selectedPrinterId) {
    throw new Error('Managed session does not match selected printer')
  }
  if (!session.sessionId || !session.tenantId || !session.relayUrl || !session.expiresAt) {
    throw new Error('Managed session handoff is incomplete')
  }
  const expiresAt = Date.parse(session.expiresAt)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error('Managed session handoff has expired')
  }
}
