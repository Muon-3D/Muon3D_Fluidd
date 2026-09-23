/**
 * The Muon3D account, its linked printers, and their live status.
 *
 * Kept outside Vuex on purpose: Fluidd resets its whole store every time it
 * switches printer, and the account must survive the switch.
 */
import Vue from 'vue'
import {
  cloudApi,
  CloudError,
  storedToken,
  storeToken,
  type CloudAccount,
  type CloudConfig,
  type CloudPrinter
} from './api'
import { browserEndpoint, forgetBrowserKey, IrohPrinter } from './iroh'

const ACTIVE_KEY = 'muon.cloud.active'

/** A printer's live state, read over its own Iroh connection. */
export interface PrinterStatus {
  reachable: boolean;
  error?: string;
  state?: string;
  message?: string;
  filename?: string;
  progress?: number;
  printDuration?: number;
  totalDuration?: number;
  filamentUsed?: number;
  extruder?: { temperature: number, target: number };
  bed?: { temperature: number, target: number };
  position?: number[];
  speedFactor?: number;
  extrudeFactor?: number;
  layer?: number;
  totalLayers?: number;
  filePosition?: number;
  fileSize?: number;
  updatedAt: number;
}

export interface FleetLayout {
  groups: Array<{ id: string, name: string, printers: string[] }>;
  widgets: Record<string, boolean>;
  density: 'comfortable' | 'compact';
}

export const DEFAULT_FLEET_LAYOUT: FleetLayout = {
  groups: [],
  widgets: {
    model: true,
    progress: true,
    temps: true,
    eta: true,
    file: true,
    position: true,
    layer: true,
    factors: false
  },
  density: 'comfortable'
}

interface CloudState {
  ready: boolean;
  account: CloudAccount | null;
  config: CloudConfig | null;
  printers: CloudPrinter[];
  status: Record<string, PrinterStatus>;
  activePrinterId: string | null;
  layout: FleetLayout;
  error: string | null;
  endpointId: string | null;
}

export const cloudState = Vue.observable<CloudState>({
  ready: false,
  account: null,
  config: null,
  printers: [],
  status: {},
  activePrinterId: readActive(),
  layout: { ...DEFAULT_FLEET_LAYOUT },
  error: null,
  endpointId: null
})

function readActive (): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function setActiveCloudPrinter (id: string | null) {
  cloudState.activePrinterId = id
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch { /* no storage */ }
}

/** Connections used for status, one per printer, separate from Fluidd's own. */
const statusConnections = new Map<string, Promise<IrohPrinter>>()
let pollTimer: number | null = null
let printersTimer: number | null = null

async function ensureEndpoint (): Promise<void> {
  if (!cloudState.config) cloudState.config = await cloudApi.config()
  const endpoint = await browserEndpoint(cloudState.config.relay_url)
  const id = endpoint.endpointId()
  if (cloudState.endpointId !== id) {
    await cloudApi.registerEndpoint(id)
    cloudState.endpointId = id
  }
}

/** Asks the console to deliver a grant for this browser to `printerId`. */
export async function requestAccess (printerId: string) {
  await ensureEndpoint()
  return cloudApi.access(printerId)
}

async function statusConnection (printerId: string): Promise<IrohPrinter> {
  let existing = statusConnections.get(printerId)
  if (!existing) {
    existing = (async () => {
      const handoff = await requestAccess(printerId)
      const endpoint = await browserEndpoint(handoff.relay_url)
      return new IrohPrinter(await endpoint.connect(printerId))
    })()
    statusConnections.set(printerId, existing)
    existing.catch(() => statusConnections.delete(printerId))
  }
  return existing
}

const STATUS_QUERY = '/printer/objects/query?print_stats&display_status&virtual_sdcard&extruder=temperature,target&heater_bed=temperature,target&toolhead=position,homed_axes&gcode_move=speed_factor,extrude_factor&webhooks'

async function pollOne (printer: CloudPrinter) {
  if (!printer.online) {
    Vue.set(cloudState.status, printer.id, { reachable: false, error: 'offline', updatedAt: Date.now() })
    return
  }
  try {
    const connection = await statusConnection(printer.id)
    const response = await connection.fetch(STATUS_QUERY)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const s = (await response.json()).result.status
    const info = s.print_stats?.info ?? {}
    Vue.set(cloudState.status, printer.id, {
      reachable: true,
      state: s.webhooks?.state === 'ready' ? s.print_stats?.state : `klipper ${s.webhooks?.state ?? 'unknown'}`,
      message: s.display_status?.message ?? undefined,
      filename: s.print_stats?.filename || undefined,
      progress: s.virtual_sdcard?.progress ?? s.display_status?.progress,
      printDuration: s.print_stats?.print_duration,
      totalDuration: s.print_stats?.total_duration,
      filamentUsed: s.print_stats?.filament_used,
      extruder: s.extruder,
      bed: s.heater_bed,
      position: s.toolhead?.position,
      speedFactor: s.gcode_move?.speed_factor,
      extrudeFactor: s.gcode_move?.extrude_factor,
      layer: info.current_layer ?? undefined,
      totalLayers: info.total_layer ?? undefined,
      filePosition: s.virtual_sdcard?.file_position,
      fileSize: s.virtual_sdcard?.file_size,
      updatedAt: Date.now()
    } as PrinterStatus)
  } catch (error) {
    statusConnections.get(printer.id)?.then(c => c.close()).catch(() => {})
    statusConnections.delete(printer.id)
    Vue.set(cloudState.status, printer.id, {
      reachable: false,
      error: (error as Error).message,
      updatedAt: Date.now()
    })
  }
}

/** A connection to a cloud printer for anything besides status, such as file reads. */
export function cloudPrinterConnection (printerId: string): Promise<IrohPrinter> {
  return statusConnection(printerId)
}

async function pollAll () {
  await Promise.all(cloudState.printers.map(p => pollOne(p)))
}

export async function refreshPrinters () {
  if (!cloudState.account) return
  try {
    cloudState.printers = (await cloudApi.printers()).printers
  } catch (error) {
    if (error instanceof CloudError && error.status === 401) await dropSession()
  }
}

function startPolling () {
  stopPolling()
  pollTimer = window.setInterval(() => { pollAll() }, 3000)
  printersTimer = window.setInterval(() => { refreshPrinters() }, 10000)
  pollAll()
}

function stopPolling () {
  if (pollTimer !== null) window.clearInterval(pollTimer)
  if (printersTimer !== null) window.clearInterval(printersTimer)
  pollTimer = printersTimer = null
}

async function dropSession () {
  stopPolling()
  storeToken(null)
  for (const c of statusConnections.values()) c.then(p => p.close()).catch(() => {})
  statusConnections.clear()
  cloudState.account = null
  cloudState.printers = []
  cloudState.status = {}
  cloudState.endpointId = null
}

async function adoptSession (token: string, account: CloudAccount) {
  storeToken(token)
  cloudState.account = account
  cloudState.error = null
  await refreshPrinters()
  try {
    const { layout } = await cloudApi.getLayout()
    cloudState.layout = { ...DEFAULT_FLEET_LAYOUT, ...layout, widgets: { ...DEFAULT_FLEET_LAYOUT.widgets, ...(layout?.widgets ?? {}) } }
  } catch { /* keep the default */ }
  startPolling()
}

/** Restores a saved session at start-up. */
export async function initCloud () {
  const token = storedToken()
  if (token) {
    try {
      const me = await cloudApi.me()
      await adoptSession(token, me.account)
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) await dropSession()
    }
  }
  cloudState.ready = true
}

export async function signIn (email: string, password: string) {
  const { token, account } = await cloudApi.signIn(email, password)
  await adoptSession(token, account)
}

export async function signUp (email: string, password: string, name: string) {
  const { token, account } = await cloudApi.signUp(email, password, name)
  await adoptSession(token, account)
}

export async function signOut () {
  try {
    await cloudApi.signOut()
  } catch { /* the session ends here either way */ }
  await dropSession()
  forgetBrowserKey()
  setActiveCloudPrinter(null)
}

export async function saveLayout (layout: FleetLayout) {
  cloudState.layout = layout
  try {
    await cloudApi.putLayout(layout)
  } catch (error) {
    cloudState.error = (error as Error).message
  }
}

export function printerName (id: string): string {
  return cloudState.printers.find(p => p.id === id)?.name ?? id.slice(0, 8)
}
