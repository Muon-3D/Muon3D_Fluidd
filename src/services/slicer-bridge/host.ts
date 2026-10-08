/**
 * Fluidd's host of printer-bridge/1 for /slice: the slicer's embed.html in a
 * frame, hosted with @muon3d/printer-client's helper (vendored, Apache-2.0:
 * vendor/printer-client/bridge/host.ts), which keeps the host's rules.
 *
 * - The helper listens before the frame's src is set, and answers a hello
 *   only from the frame's window at the origin of that src.
 * - Every op names a printer key; one that is not Fluidd's selection now is
 *   refused with `printer-changed`. When Fluidd's printer changes, the frame
 *   is told (printer.changed) before anything else about the new printer, and
 *   what was running for the old one ends.
 * - The start is the host's: print.request opens Fluidd's own dialog
 *   (PrintConfirmDialog.vue), only for files this frame uploaded to that
 *   printer in the last 30 minutes; Print, Queue or Upload only.
 * - Uploads, reads, starts and queue entries go over Fluidd's own
 *   $httpClient (the printer on the network, or Iroh); status comes from
 *   Fluidd's own socket subscription; console lines from its
 *   notify_gcode_response handling.
 */
import type { Store } from 'vuex'
import {
  createBridgeHost,
  type BridgeHost,
  type ConfirmAnswer,
  type ConfirmRequest,
  type HostLogEntry
} from './vendor/printer-client/bridge/host'
import type { BridgePrinter, Density, Theme } from './vendor/printer-client/bridge/protocol'
import { createFluiddAdapter, type HttpClient } from './adapter'
import { bridgePrinterFor, createIdentityCache, samePrinter, type FluiddSelection } from './selection'
import { createStoreStatusFeed } from './statusFeed'

export interface SlicerHostOptions {
  frame: HTMLIFrameElement;
  /** The slicer's embed.html (slicerUrl.ts). */
  slicerUrl: URL;
  store: Pick<Store<any>, 'state' | 'getters' | 'subscribeAction'>;
  http: HttpClient;
  /** What Fluidd shows now (fluidd.ts). */
  selection: () => FluiddSelection;
  /** Whether Fluidd's requests travel over Iroh now (no upload progress there). */
  remote: () => boolean;
  /** Asks a network printer's /server/muon/identity. */
  fetchJson: (url: string) => Promise<unknown>;
  confirm: (request: ConfirmRequest) => Promise<ConfirmAnswer>;
  theme: Theme;
  density?: Density;
  hostVersion: string;
  onState?: (state: Record<string, unknown>) => void;
  log?: (entry: HostLogEntry) => void;
  /** Where the hello arrives (the page's window). */
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export interface SlicerHost {
  bridge: BridgeHost;
  /** Reads Fluidd's selection again and tells the frame when it changed. */
  refresh (): void;
  /** The printer the frame was last told of. */
  printer (): BridgePrinter | null;
  close (): void;
}

export function startSlicerHost (options: SlicerHostOptions): SlicerHost {
  const identity = createIdentityCache(options.fetchJson)
  let announced: BridgePrinter | null = null
  let bridge: BridgeHost | null = null
  let closed = false

  const now = (): BridgePrinter | null => {
    const selection = options.selection()
    if (!selection.cloud && selection.apiUrl && identity.get(selection.apiUrl) === undefined && !selection.switching) {
      identity.ask(selection.apiUrl).then(() => refresh(), () => {})
    }
    return bridgePrinterFor(selection, selection.apiUrl ? identity.get(selection.apiUrl) : undefined)
  }

  /** Tells the frame of a change first, then answers about the printer selected now. */
  const refresh = () => {
    if (closed) return
    const next = now()
    if (samePrinter(announced, next)) return
    announced = next
    bridge?.printerChanged()
  }

  const selected = (): BridgePrinter | null => {
    refresh()
    return announced
  }

  const adapter = createFluiddAdapter({
    http: options.http,
    selected,
    reportsProgress: () => !options.remote(),
    status: (key) => createStoreStatusFeed(options.store, () => selected()?.key === key),
    confirm: options.confirm
  })

  announced = now()
  bridge = createBridgeHost({
    frame: { window: () => options.frame.contentWindow, origin: options.slicerUrl.origin },
    target: options.target ?? window,
    host: 'fluidd',
    hostVersion: options.hostVersion,
    theme: options.theme,
    density: options.density,
    adapter,
    onState: options.onState,
    log: options.log
  })

  // Console lines of the selected printer, as Fluidd's console takes them in.
  const stopGcode = options.store.subscribeAction((action) => {
    if (action.type !== 'socket/notifyGcodeResponse' || typeof action.payload !== 'string') return
    const key = selected()?.key
    if (key) bridge?.gcode(key, [action.payload])
  })

  // The listener is in place: now the frame may load.
  options.frame.src = options.slicerUrl.href

  return {
    bridge,
    refresh,
    printer: () => announced,
    close () {
      if (closed) return
      closed = true
      stopGcode()
      bridge?.close()
    }
  }
}
