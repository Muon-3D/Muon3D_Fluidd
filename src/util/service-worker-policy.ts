import { isPrinterSecureOrigin } from '@/services/secure-origin'

type PageLocation = Pick<Location, 'protocol' | 'hostname'>

const LOOPBACK = ['localhost', '127.0.0.1', '[::1]']

/**
 * Whether this page may register the service worker (KAN-2198). A printer
 * serves the page itself, and a worker that outlived a printer's certificate,
 * name or firmware would keep answering for it: plain HTTP that is not
 * loopback, and a printer's own HTTPS name, run without one. The console's
 * hosted pages and localhost keep it.
 */
export function serviceWorkerAllowed (location: PageLocation = globalThis.location): boolean {
  if (!location) return true
  if (isPrinterSecureOrigin(location)) return false
  if (location.protocol === 'http:' && !LOOPBACK.includes(location.hostname)) return false
  return true
}

/** Whether a worker already registered here must be removed: a printer's secure origin has none. */
export function serviceWorkerMustGo (location: PageLocation = globalThis.location): boolean {
  return !!location && isPrinterSecureOrigin(location)
}

/** Unregisters every worker on this origin. */
export async function unregisterServiceWorkers (container: Pick<ServiceWorkerContainer, 'getRegistrations'> | null = typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? navigator.serviceWorker : null): Promise<number> {
  if (!container) return 0
  const registrations = await container.getRegistrations()
  await Promise.all(registrations.map(r => r.unregister()))
  return registrations.length
}
