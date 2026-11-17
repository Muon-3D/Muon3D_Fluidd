/**
 * Fluidd's host of printer-bridge/1 for /design: Muon3D Design's embed.html
 * in a frame, hosted with the same vendored helper as the slicer
 * (slicer-bridge/vendor/printer-client/bridge/host.ts), which keeps the
 * host's rules: it listens before the frame's src is set and answers a hello
 * only from the frame's window at the origin of that src.
 *
 * Design gets no printer: the welcome grants only Fluidd's look (ui.look)
 * and the account's Library (library), each when given. Every printer op is
 * refused by the helper as not granted; the adapter behind it has no
 * printer, should one ever reach it.
 */
import {
  createBridgeHost,
  type BridgeHost,
  type HostAdapter,
  type HostLibrary,
  type HostLogEntry
} from '@/services/slicer-bridge/vendor/printer-client/bridge/host'
import type { Density, HostLook, Theme } from '@/services/slicer-bridge/vendor/printer-client/bridge/protocol'
import { printerError } from '@/services/slicer-bridge/vendor/printer-client/errors/kinds'

export interface DesignHostOptions {
  frame: HTMLIFrameElement;
  /** Design's embed.html (designUrl.ts). */
  designUrl: URL;
  theme: Theme;
  density?: Density;
  /** Fluidd's look (ui.look, slicer-bridge/look.ts): Design draws itself as a part of the page. */
  look?: HostLook;
  /** The account's Library (slicer-bridge/library.ts): given, the welcome grants `library`. */
  library?: HostLibrary;
  hostVersion: string;
  log?: (entry: HostLogEntry) => void;
  /** Where the hello arrives (the page's window). */
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export interface DesignHost {
  bridge: BridgeHost;
  close (): void;
}

/** What the welcome grants: the host UI and account capabilities given, never a printer's. */
export function designCapabilities (options: Pick<DesignHostOptions, 'look' | 'library'>): string[] {
  return [
    ...(options.look ? ['ui.look'] : []),
    ...(options.library ? ['library'] : [])
  ]
}

const noPrinter = (): Promise<never> => Promise.reject(printerError('unsupported', 'Design has no printer here'))

/** No printer selected, and nothing done to one. */
const NO_PRINTER: HostAdapter = {
  selected: () => null,
  read: noPrinter,
  printStats: noPrinter,
  upload: noPrinter,
  start: noPrinter,
  queue: noPrinter,
  cancelPrint: noPrinter,
  confirm: noPrinter,
  status: () => null
}

export function startDesignHost (options: DesignHostOptions): DesignHost {
  const bridge = createBridgeHost({
    frame: { window: () => options.frame.contentWindow, origin: options.designUrl.origin },
    target: options.target ?? window,
    host: 'fluidd',
    hostVersion: options.hostVersion,
    capabilities: designCapabilities(options),
    theme: options.theme,
    density: options.density,
    look: options.look,
    library: options.library,
    adapter: NO_PRINTER,
    log: options.log
  })

  // The listener is in place: now the frame may load.
  options.frame.src = options.designUrl.href

  let closed = false
  return {
    bridge,
    close () {
      if (closed) return
      closed = true
      bridge.close()
    }
  }
}
