/**
 * The host side of printer-client 0.4.0's `library` capability: the
 * slicer's library.* requests answered from the account's Library
 * (services/library). They are the account's, not a printer's, so they
 * work with any printer selected, or none.
 *
 * Errors reach the slicer as the protocol's kinds: nobody signed in is
 * `not-signed-in`, a full Library `quota` (with the service's words, which
 * say how much is used of what), anything else the service refused
 * `console`, its message as the message and its code as the detail.
 */
import type { HostLibrary } from './vendor/printer-client/bridge/host'
import type { LibraryStatus } from './vendor/printer-client/bridge/protocol'
import { libraryBridgeError } from './errors'
import {
  ensureLibraryRead,
  libraryStatus,
  loadProject,
  requireSignedIn,
  saveFromSlicer,
  setLibraryPreferences
} from '@/services/library/store'

export { libraryBridgeError }

async function guard<T> (work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    throw libraryBridgeError(error)
  }
}

/** The bytes as their own ArrayBuffer, as the protocol carries them. */
const buffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? bytes.buffer as ArrayBuffer
    : bytes.slice().buffer as ArrayBuffer

export interface FluiddLibraryOptions {
  /** library.browse: Fluidd's own Library page. */
  browse: () => void;
}

export function createFluiddLibrary (options: FluiddLibraryOptions): HostLibrary {
  const status = (): LibraryStatus => libraryStatus()
  return {
    status: () => guard(async () => {
      await ensureLibraryRead()
      return status()
    }),

    preferences: (change) => guard(async () => {
      requireSignedIn()
      await setLibraryPreferences(change)
      return status()
    }),

    save: (save, { onStep }) => guard(async () => {
      requireSignedIn()
      const saved = await saveFromSlicer(save, progress => onStep({ step: 'sending', sent: progress.sent, total: progress.total }))
      const at = Date.parse(saved.version.created_at)
      return {
        item: saved.item.id,
        version: saved.version.number,
        savedAt: Number.isFinite(at) ? new Date(at).toISOString() : new Date().toISOString()
      }
    }),

    get: (item, version) => guard(async () => {
      requireSignedIn()
      const loaded = await loadProject(item, version)
      return { item, version: loaded.version, name: loaded.name, project: buffer(loaded.project) }
    }),

    browse: () => guard(async () => {
      options.browse()
    })
  }
}
