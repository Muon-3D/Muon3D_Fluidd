/**
 * A failure of the account's services (the Library, the assertion) as the
 * slicer reads it: the protocol's kinds, from the service's own.
 */
import { isPrinterError, printerError, type PrinterError } from './vendor/printer-client/errors/kinds'
import { LibraryError } from '@/services/library/api'

/** A failure of the Library as the slicer reads it. */
export function libraryBridgeError (error: unknown): PrinterError {
  if (isPrinterError(error)) return error
  if (error instanceof LibraryError) {
    const status = error.status ? { status: error.status } : {}
    if (error.code === 'not-signed-in') return printerError('not-signed-in', 'Nobody is signed in to Muon3D', status)
    if (error.code === 'quota_exceeded') return printerError('quota', error.message, status)
    if (error.code === 'cancelled') return printerError('cancelled', error.message)
    return printerError('console', error.message, { ...status, detail: error.code })
  }
  return printerError('console', 'The Library could not do it')
}
