import { Component, Mixins } from 'vue-property-decorator'
import consola from 'consola'
import type { InstanceConfig } from '@/store/config/types'
import StateMixin from './state'
import { cloudState, dropCloudConnection, rememberBluetoothOnly } from '@/services/muon-cloud/state'
import { deletionState } from '@/services/muon-cloud/deletion'
import { foundOpenFor } from '@/services/muon-cloud/found-open'
import {
  activateCloudPrinter,
  activateLocalPrinter,
  localSession,
  activationState,
  cancelActivation,
  SwitchSuperseded,
  MANAGED_API_URL
} from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  instanceFor,
  instanceForHost,
  isOwnHotspot,
  lanAddresses,
  refreshKnownPrinters
} from '@/services/muon-cloud/discovery'
import {
  hostOf,
  printerDirectory,
  type CardAction,
  type Directory,
  type DirectoryEntry,
  type LocalLive,
  type PrinterHealth
} from '@/services/muon-cloud/directory'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { bluetoothWhy as whyNoBluetooth, type BluetoothWhy } from '@/services/muon-ble/unavailable'
import { isPrinter, lookNearby, nearbyState, permittedPrinterFor, type NearbyPrinter } from '@/services/muon-ble/nearby'
import { scanForPrinters, scanState } from '@/services/scan'
import { startPairing } from '@/services/muon-ble/pairing'
import { bleRetryState, retryBluetooth } from '@/services/muon-ble/retry'
import { bluetoothCarrying, reconnectBluetooth, releaseBluetoothLink, stopUsingBluetoothFor, useBluetoothFor, wantsBluetoothFor } from '@/services/muon-ble/link'
import { chooseRouteMode, routeMode, type Route } from '@/services/muon-cloud/route-choice'
import { routeMenuItems, type RouteMenuFacts } from '@/services/muon-cloud/route-menu'
import type { BleDevice } from '@/services/muon-ble/webBluetooth'
import { besideAddrs, connectInPlace, localFailure, ownPageUrl, LOCAL_ACCESS_BLOCKED, NOT_ON_YOUR_NETWORK, REBINDING_FIX, REBINDING_LINE, type InPlaceResult, type LocalFailure } from '@/services/muon-cloud/connect-in-place'
import { chooseRelay, clearRelayChoice, mayTrySecureName, relayChosen, secureNameOf } from '@/services/secure-origin/hosted'
import { connectByAddress, LNA_PREPROMPT, type DirectResult } from '@/services/muon-cloud/direct-address'
import { bluetoothSupport } from '@/services/muon-ble/webBluetooth'
import { isOpenableAddr, localRoute, mdnsHostFromName, type LocalRoute } from '@/services/muon-cloud/local-route'
import { lanPrinterAccess, type AccessAsk, type AccessClient } from '@/services/muon-access/api'
import { requestRefused } from '@/services/managed-transport/refusal'

/**
 * The longest a row stays busy with one open. The slowest open is bounded
 * below this (`REMOTE_OPEN_TIMEOUT_MS`, `LOCAL_OPEN_TIMEOUT_MS`); this is the
 * backstop for a step that has no bound of its own.
 */
export const RUN_TIMEOUT_MS = 60_000

class RunTimeout extends Error {}

/** The service's nearby entry for a printer id. The directory matches ids without case, so does this. */
function nearbyOf (id: string) {
  const want = id.toLowerCase()
  return discoveryState.cloud.find(c => c.printerId.toLowerCase() === want)
}

/**
 * An address the printer itself told this browser (KAN-4898): its `.local` name from identity (live over Bluetooth
 * or LAN, or kept with a saved printer), else a LAN address it was saved or seen at. Never the guess from its display name.
 */
function printerSaidAddr (e: DirectoryEntry): string | null {
  const said = [
    e.lan?.mdnsHost,
    ...(e.saved ?? []).map(s => s.mdnsHost),
    e.host,
    ...(e.saved ?? []).map(s => hostOf(s.apiUrl))
  ]
  return said.find(a => isOpenableAddr(a) && !isOwnHotspot(a)) ?? null
}

/** How Connect locally would reach this printer from this page (KAN-2529). */
function localRouteOf (e: DirectoryEntry): LocalRoute {
  const id = e.cloud?.id ?? e.endpointId
  const nearby = id ? nearbyOf(id) : undefined
  return localRoute({
    hosted: mayTrySecureName(),
    host: e.host,
    // The account's own name for the printer, else the one the service gives a printer beside this browser (KAN-5459):
    // an Open printer is for anyone, signed in or not.
    secureName: secureNameOf(e.cloud) ?? secureNameOf({ secure_name: nearby?.secureName }),
    pageHost: window.location.hostname,
    mdnsHost: e.lan?.mdnsHost ?? e.saved?.find(s => s.mdnsHost)?.mdnsHost ?? mdnsHostFromName(e.cloud?.name ?? e.name),
    printerSaid: printerSaidAddr(e),
    nearby,
    nearbyChecked: discoveryState.cloudChecked,
    blockedByPage: !!discoveryState.blockedByPage
  })
}

/** The line under Connect locally: where it goes, or why it cannot. */
function localHint (route: LocalRoute, e: DirectoryEntry): string {
  switch (route.kind) {
    case 'secure': return 'Connects on your network, in this tab'
    case 'page': return 'Needs its secure address. Use Muon3D or Bluetooth'
    case 'lan': return e.host ?? ''
    case 'none': return route.reason
  }
}

/** The id a printer is reached by over any route: the account's, else the one it publishes. */
function idOf (e: DirectoryEntry): string | null {
  return e.cloud?.id ?? e.endpointId
}

/** The route the open session for this printer is on now, or null when it is not open. */
export function liveRouteOf (e: DirectoryEntry): Route | null {
  if (e.active === 'local') return 'lan'
  if (e.active !== 'cloud') return null
  const id = idOf(e)
  return id && bluetoothCarrying(id) ? 'ble' : 'cloud'
}

/** The routes this printer offers: the ones it is not on, or all three when it is not open (KAN-2487). */
function routeActionsOf (e: DirectoryEntry): CardAction[] {
  return routeMenuItems(routeFactsOf(e)).map(({ id, label, icon, hint, disabled }) => ({ id, label, icon, hint, disabled }))
}

/**
 * The small route buttons on the Wi-Fi and network page (KAN-5973): one per route that is there now. A route
 * the printer is on counts as there; one that cannot be used is left out, not greyed.
 */
export function routeButtonsOf (e: DirectoryEntry): Array<{ route: Route, id: string, label: string, icon: string, active: boolean }> {
  const live = liveRouteOf(e)
  const names: Record<Route, string> = { lan: 'Connect locally', cloud: 'Connect over Muon3D', ble: 'Connect over Bluetooth' }
  return routeMenuItems({ ...routeFactsOf(e), mode: 'auto', live: null })
    .filter(i => !i.disabled || i.route === live)
    .map(i => ({ route: i.route, id: i.id, label: names[i.route], icon: i.icon, active: i.route === live }))
}

/** What the route menu needs to know about this printer, from the live state. */
function routeFactsOf (e: DirectoryEntry): RouteMenuFacts {
  const route = localRouteOf(e)
  return {
    mode: routeMode(idOf(e)),
    live: liveRouteOf(e),
    local: { usable: route.kind === 'secure' || route.kind === 'lan', hint: localHint(route, e) },
    cloud: { listed: !!e.cloud, online: !!e.cloud?.online },
    ble: { support: nearbyState.support, heard: !!e.nearby, identified: !!idOf(e), why: whyNoBluetooth()?.text ?? null }
  }
}

/** Printers whose "opened through Muon3D" notice has been shown on this page load. */
const toldRelay = new Set<string>()

/** Counts runs, so one taken over by a chosen route does not clear the row of the one that took over. */
let runCounter = 0

/**
 * Opens `e` the way `route` says. `auto` is auto mode's own move (the banner's
 * failover, or Connect locally's fall back to Muon3D): it opens the route but
 * records no choice, so nothing becomes held and later plain Connects behave as
 * before (#370).
 */
async function openManagedRoute (e: DirectoryEntry, route?: 'relay' | BleDevice, auto = false): Promise<boolean> {
  // A printer off the account has no Muon3D route, but Bluetooth reaches it as anyone's (KAN-2487).
  const id = idOf(e)
  if (!id || (!e.cloud && (!route || route === 'relay'))) return false
  if (auto && routeMode(id) !== 'auto') return false
  if (!route || route === 'relay') {
    if (route === 'relay' && !auto) chooseRelay(id)
    stopUsingBluetoothFor(id)
  } else {
    useBluetoothFor(id, route)
    // Another try gets a fresh link: the old one can look open while it
    // carries nothing (KAN-2080), and reusing it dead-ended "Try again".
    await releaseBluetoothLink(id)
    if (auto && routeMode(id) !== 'auto') return false
    reconnectBluetooth(id)
  }
  dropCloudConnection(id)
  try {
    await activateCloudPrinter(id)
  } catch (error) {
    if (route || error instanceof SwitchSuperseded || requestRefused(error)) throw error
    const nearby = e.nearby ?? await permittedPrinterFor(id)
    if (!nearby) throw error
    if (routeMode(id) !== 'auto') throw new SwitchSuperseded()
    useBluetoothFor(id, nearby.device)
    dropCloudConnection(id)
    await activateCloudPrinter(id)
  }
  return true
}

/**
 * Every printer this browser knows of, and what can be done with each:
 * open it here or through Muon3D, link it, ask for access, set it up,
 * forget it. The header's switcher and the Printers page both list
 * printers this way, so a printer behaves the same in either. Each keeps
 * the dialogs these open in its own template.
 */
/** What follows a Bluetooth pick: open the account's printer, set up a new one, or say where it is listed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function afterBluetoothPick (vm: any, heard: NearbyPrinter | null) {
  // A dismissed chooser is the person's answer: silent. A failed read already
  // shows its own message (nearbyState.error).
  if (!heard) return
  if (!heard.endpointId) {
    vm.notice = `Couldn't tell which printer ${heard.display || heard.localName || 'that device'} is. ` +
      'Move closer to it and try again.'
    return
  }
  const entry = vm.directory.cloud.find((c: DirectoryEntry) => c.cloud && isPrinter(heard, c.cloud.id))
  if (entry) {
    await vm.connectOverBluetooth(entry, heard)
    return
  }
  // Not on this account. If the account's printers have not loaded, it may be one of them.
  if (!cloudState.ready) {
    vm.notice = 'Your printers are still loading. Try Connect over Bluetooth again in a moment.'
    return
  }
  // The out-of-box path: a printer nobody has set up goes to its set-up (or its link), as from Look nearby.
  const nearbyEntry = vm.directory.found.find((f: DirectoryEntry) => f.nearby?.deviceId === heard.deviceId)
  const known = vm.directory.local.find((l: DirectoryEntry) => l.nearby?.deviceId === heard.deviceId) ??
    (nearbyEntry?.row?.action === 'open' ? nearbyEntry : undefined)
  if (known) {
    await vm.pairNearbyPrinter(heard, known.key, true)
    return
  }
  if (nearbyEntry) {
    await vm.openFoundEntry(nearbyEntry)
    return
  }
  vm.notice = `${heard.display || heard.localName || 'That printer'} was found over Bluetooth. It is listed with the printers found nearby.`
}

@Component
export default class PrinterEntriesMixin extends Mixins(StateMixin) {
  get deletionPending (): boolean {
    return deletionState.deleteAfter !== null
  }

  instanceDialogOpen = false
  accountDialog = false
  linkDialog = false
  linkPrinterId = ''
  linkHost = ''
  /** A printer picked for linking before sign-in. */
  pendingLink: DirectoryEntry | null = null
  /** A found tile on an https page, waiting for sign-in to open through the account. */
  pendingOpen: DirectoryEntry | null = null
  busyKey: string | null = null
  /**
   * The row a local connect is on from the click to its end. The secure-name probe, the by-address try and the
   * routes after them are separate runs, and the row dropped its spinner between them (KAN-6743).
   */
  holdKey: string | null = null
  notice: string | null = null
  /** A route the person picked failed: what happened and the other routes as buttons (nothing switches by itself). */
  routeProblem: { line: string, detail?: string, choices: Array<{ id: string, label: string }> } | null = null
  /** The printer's own page, offered as a button after the secure name failed; opened only on that click. */
  routeProblemUrl: string | null = null
  routeProblemEntry: DirectoryEntry | null = null
  /** Auto found no way in: ask whether to open muon3d.local. */
  askMuonLocal = false
  /** An address to show as a link under the notice, when a new tab was blocked. */
  noticeLink: string | null = null
  setupDialog = false
  setupPrinter: NearbyPrinter | null = null
  /** "Ask for access" to a printer on this network (ACC-17). */
  accessDialog = false
  accessClient: AccessClient | null = null
  accessAsk: AccessAsk | null = null
  accessName = ''

  get account () {
    return cloudState.account
  }

  get nearby () {
    return nearbyState
  }

  get bluetoothSearch () {
    return nearbyState.support === 'supported'
  }

  /** Why Bluetooth cannot be used here, said plainly, or null when it can (KAN-4802). */
  get bluetoothWhy (): BluetoothWhy | null {
    return whyNoBluetooth(undefined, this.bluetoothOff)
  }

  get bluetoothOff () {
    return this.bluetoothSearch && nearbyState.radio === 'off'
  }

  get activationError () {
    return activationState.error
  }

  /** The printer that refused this browser over Bluetooth: Control can pair with it (KAN-1253). */
  get pairingOffer () {
    return activationState.pairing
  }

  pairThisBrowser () {
    if (activationState.pairing) startPairing(activationState.pairing).catch(() => {})
  }

  get activationFallback () {
    return activationState.fallbackUrl
  }

  get searching () {
    return discoveryState.scanning
  }

  get blockedByPage () {
    return discoveryState.blockedByPage
  }

  get scanNetwork () {
    return discoveryState.network
  }

  /** The row to show as connecting: the one a run is on, else the one a local connect holds. */
  get openingKey (): string | null {
    return this.busyKey ?? this.holdKey
  }

  get savedInstances (): InstanceConfig[] {
    const all: InstanceConfig[] = this.$store.getters['config/getInstances'] ?? []
    const saved = all.filter(i => i.apiUrl !== MANAGED_API_URL)
    // KAN-6743: a printer opened in place (secure name or address) is not always in the saved list (a browser that
    // already held other printers never adds it). It is the live session all the same: without it the tile took the
    // account's status read, which has none, and sat on a grey Connecting beside a connected printer.
    const live = localSession.instance
    if (live && live.apiUrl === this.$store.state.config.apiUrl && !saved.some(i => i.apiUrl === live.apiUrl)) {
      return [...saved, live]
    }
    return saved
  }

  /** The printer Fluidd is on locally, from its own socket. */
  get localLive (): LocalLive | null {
    if (cloudState.activePrinterId) return null
    const apiUrl: string = this.$store.state.config.apiUrl
    if (!apiUrl || apiUrl === MANAGED_API_URL) return null
    let health: PrinterHealth
    // KAN-5975: a printer that answered but wants its login never opens the socket; that is "Needs access", not "Connecting".
    if (!this.socketConnected) health = this.apiConnected && !this.authenticated && !this.socketConnecting ? 'locked' : 'connecting'
    else if (!this.authenticated) health = 'locked'
    else if (!this.klippyReady) health = 'error'
    else if (this.printerPrinting) health = 'printing'
    else if (this.printerPaused) health = 'paused'
    else health = 'online'
    return { apiUrl, health, detail: this.localDetail(health) }
  }

  localDetail (health: PrinterHealth): string {
    if (health === 'connecting') return 'Connecting…'
    if (health === 'locked') return 'Waiting for sign-in'
    const state = this.$filters.prettyCase(this.printerState || 'unknown')
    if (this.printerPrinting || this.printerPaused) {
      const progress = Math.floor((this.$store.getters['printer/getPrintProgress'] ?? 0) * 100)
      return `${state} · ${progress}%`
    }
    return state
  }

  get directory (): Directory {
    return printerDirectory({
      account: this.account && !this.deletionPending ? cloudState.printers : [],
      status: cloudState.status,
      email: this.account?.email ?? null,
      saved: this.savedInstances,
      found: discoveryState.found,
      cloudNearby: discoveryState.cloud,
      nearby: nearbyState.printers,
      now: nearbyState.now,
      activeCloudId: cloudState.activePrinterId,
      viaBluetooth: bluetoothCarrying,
      local: this.localLive,
      searching: discoveryState.scanning || !discoveryState.finishedAt
    })
  }

  rescan () {
    this.notice = null
    discoveryState.cloudChecked = false
    discoverPrinters(true).catch(() => {})
  }

  async onLookNearby () {
    this.notice = null
    await lookNearby()
  }

  /**
   * The big Connect over Bluetooth button (KAN-2470): the chooser lists only
   * Muon printers. A printer already on the account is opened over Bluetooth;
   * a new one is now in the Bluetooth list (Look nearby's own result), ready
   * to be set up or paired. A dismissed chooser does nothing.
   */
  async onConnectOverBluetooth () {
    this.notice = null
    await afterBluetoothPick(this, await lookNearby())
  }

  /** The Printers page's "Scan for printers" (KAN-5409): one click runs every source; a printer picked over Bluetooth is then opened as ever. */
  get scanBusy () {
    return scanState.phase === 'scanning'
  }

  async onScan () {
    this.notice = null
    // Straight from the click: the Bluetooth chooser needs the gesture.
    await afterBluetoothPick(this, await scanForPrinters())
  }

  // -- what each printer offers ----------------------------------------------

  /** How Connect locally would reach this printer from this page (KAN-2529). */
  localRouteFor (e: DirectoryEntry): LocalRoute {
    return localRouteOf(e)
  }

  cloudActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = routeActionsOf(e)
    if (e.cloud && bleRetryState.stopped[e.cloud.id]) {
      actions.push({ id: 'retry-bluetooth', label: 'Retry Bluetooth', icon: '$bluetooth', hint: bleRetryState.stopped[e.cloud.id] })
    }
    actions.push({
      id: 'access',
      label: 'Access and protection',
      icon: '$printerAccess',
      hint: e.active ? undefined : 'Opens the printer first'
    })
    return actions
  }

  /** Someone else's printer, or one that refused this browser: ask its panel to let this browser in. */
  askAction (e: DirectoryEntry): CardAction | null {
    // An Open printer (D-166) lets anyone in: there is nothing to ask for.
    if (e.lan?.entry === 'open') return null
    if (e.linkedTo !== 'other' && e.health !== 'locked') return null
    return {
      id: 'ask',
      label: 'Ask for access',
      icon: '$printerAsk',
      hint: e.linkedTo === 'other' ? 'Linked to another account' : 'It wants access',
      disabled: !e.host
    }
  }

  localActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = []
    const ask = this.askAction(e)
    if (ask) {
      actions.push(ask)
    } else if (e.linkedTo !== 'mine') {
      actions.push({ id: 'link', label: 'Link to my account', icon: '$linkPrinter', disabled: !e.host, hint: e.host ? undefined : 'Not found on this network' })
    }
    // Any route anyone can reach the printer by (KAN-2487): the account only decides the Muon3D one.
    actions.push(...routeActionsOf(e))
    if (e.active) {
      actions.push({ id: 'access', label: 'Access and protection', icon: '$printerAccess' })
    }
    actions.push({
      id: 'remove',
      label: 'Remove',
      icon: '$printerRemove',
      danger: true,
      disabled: !!e.active,
      hint: e.active ? 'Connect to another printer first' : undefined
    })
    return actions
  }

  foundActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = []
    if (e.row?.action === 'open') actions.push({ id: 'connect', label: 'Connect', icon: '$lan', disabled: !e.host })
    if (e.row?.canLink) actions.push({ id: 'link', label: 'Link to my account', icon: '$linkPrinter' })
    const ask = this.askAction(e)
    if (ask) actions.push(ask)
    // Bluetooth is the out-of-box way in to a printer nobody owns, or one that is someone else's (KAN-2487, I-285).
    const bluetooth = routeActionsOf(e).find(a => a.id === 'connect-bluetooth')
    if (bluetooth && (e.nearby || e.endpointId)) actions.push(bluetooth)
    return actions
  }

  actionsFor (e: DirectoryEntry): CardAction[] {
    if (e.section === 'cloud') return this.cloudActions(e)
    if (e.section === 'local') return this.localActions(e)
    return this.foundActions(e)
  }

  async onAction (e: DirectoryEntry, id: string) {
    this.notice = null
    this.noticeLink = null
    this.routeProblem = null
    this.askMuonLocal = false
    switch (id) {
      case 'connect-local': return this.connectLocal(e)
      case 'connect-cloud': return this.connectCloud(e, 'relay')
      case 'retry-bluetooth':
      case 'connect-bluetooth':
        if (!idOf(e)) return
        return this.connectOverBluetooth(e)
      case 'connect': return this.openFoundEntry(e)
      case 'pair-bluetooth': return this.pairNearby(e, true)
      case 'link': return this.link(e)
      case 'remove': return this.remove(e)
      case 'access': return this.openAccess(e)
      case 'ask': return this.askForAccess(e)
    }
  }

  // -- opening ---------------------------------------------------------------

  /** After a printer opened from here. The switcher closes; the Printers page goes to the printer. */
  afterOpen () {
    this.$emit('click')
  }

  /**
   * `supersede` is a chosen way in (I-133): Connect over Bluetooth, or back to
   * Muon3D. It takes over from an open already in flight (activateCloudPrinter
   * supersedes the earlier dial) instead of hitting the busy guard.
   */
  async run (key: string, work: () => Promise<boolean>, supersede = false) {
    if (this.busyKey && !supersede) {
      // KAN-1279: this used to return without a word, so a row whose earlier
      // open never settled looked dead: no spinner change, nothing logged.
      consola.warn(`Ignored a click on ${key}: still opening ${this.busyKey}`)
      this.notice = 'Still opening a printer. Give it a moment, or reload the page if it stays stuck.'
      return
    }
    const mine = ++runCounter
    this.busyKey = key
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const outcome = await Promise.race([
        work(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new RunTimeout()), RUN_TIMEOUT_MS)
        })
      ])
      if (outcome) this.afterOpen()
      return outcome
    } catch (error) {
      if (error instanceof RunTimeout) {
        // Whatever the open was waiting on never answered: free the row.
        consola.warn(`Opening ${key} took longer than ${RUN_TIMEOUT_MS / 1000} seconds; gave up`)
        activationState.error = "The printer didn't open in time. Check that it's on and online, then try again."
      }
      // Otherwise activationState holds the reason.
      return error instanceof SwitchSuperseded ? undefined : false
    } finally {
      clearTimeout(timer)
      // A run that was taken over leaves the row to the run that took over.
      if (mine === runCounter) this.busyKey = null
    }
  }

  /** Cancel on a Bluetooth connect in flight: the open is replaced, the link dropped, the row freed. */
  cancelOpen (e: DirectoryEntry) {
    const id = idOf(e)
    cancelActivation()
    if (id) {
      stopUsingBluetoothFor(id)
      releaseBluetoothLink(id).catch(() => {})
    }
    ++runCounter
    this.busyKey = null
  }

  /** Opens any printer the way its group does: the account's, a saved one, or one found here. */
  openEntry (e: DirectoryEntry) {
    if (e.section === 'cloud') return this.openCloudEntry(e)
    if (e.section === 'local') return this.openLocalEntry(e)
    return this.openFoundEntry(e)
  }

  /**
   * The whole Bluetooth way in from one menu item (I-131): the device already
   * heard, else one this browser may already use, else the chooser; then the
   * link and the connect. A printer that refuses this browser as a stranger
   * goes straight into pairing, and the connect continues once paired.
   */
  async connectOverBluetooth (e: DirectoryEntry, chosen?: NearbyPrinter, auto = false) {
    const id = idOf(e)
    if (!id) return
    let heard = chosen ?? e.nearby ?? await permittedPrinterFor(id).catch(() => null)
    if (!heard) {
      // KAN-3589: the same chooser as the top-right Bluetooth button (every Muon printer). The filter built
      // from this printer's EndpointId (or remembered name) matched nothing in Chrome: "No compatible
      // devices found". The pick is checked against this printer below.
      heard = await lookNearby()
      if (!heard) return
      // A device that names no printer (no EndpointId, no advertisement) is not this one either.
      if (!isPrinter(heard, id)) {
        this.notice = `That device isn't ${e.name}. Choose ${e.name} in the Bluetooth list.`
        return
      }
    }
    if (!cloudState.printers.some(p => p.id === id)) rememberBluetoothOnly(id, heard.display || heard.localName || e.name)
    retryBluetooth(id)
    const opened = await this.connectCloud(e, heard.device, auto)
    if (activationState.pairing === id) {
      // The printer would not hold this browser for Accept or Reject: the code is the way in, so the wait's outcome goes.
      activationState.approval = null
      await startPairing(id)
    }
    return opened
  }

  /**
   * A printer heard over Bluetooth that is set up and not on this account (or
   * with nobody signed in): open it over Bluetooth, which needs no account. One
   * this browser was paired with opens; one that does not know this browser yet
   * goes straight into pairing (the code on its screen), as from a menu.
   */
  async pairNearby (e: DirectoryEntry, hold = false) {
    await this.pairNearbyPrinter(e.row?.nearby ?? e.nearby ?? null, e.key, hold)
  }

  /**
   * `hold` is true only from the explicit Pair over Bluetooth button, which
   * keeps the Bluetooth route. An automatic open (a click on the tile) records
   * no held route.
   */
  async pairNearbyPrinter (heard: NearbyPrinter | null, key = `ble:${heard?.deviceId}`, hold = false) {
    const id = heard?.endpointId
    if (!heard || !id) return
    this.notice = null
    chooseRouteMode(id, hold ? 'ble' : 'auto')
    // The account may not hold it (nobody signed in): it still needs a name for its page.
    if (!cloudState.printers.some(p => p.id === id)) rememberBluetoothOnly(id, heard.display || heard.localName || id.slice(0, 8))
    await this.run(key, async () => {
      useBluetoothFor(id, heard.device)
      await releaseBluetoothLink(id)
      reconnectBluetooth(id)
      dropCloudConnection(id)
      await activateCloudPrinter(id)
      return true
    }, true)
    if (activationState.pairing === id) await startPairing(id)
  }

  /** From the click to the end, the row says it is connecting, whichever route is tried (KAN-6743). */
  async openCloudEntry (e: DirectoryEntry) {
    this.holdKey = e.key
    try {
      return await this.openCloudEntryRoutes(e)
    } finally {
      this.holdKey = null
    }
  }

  async openCloudEntryRoutes (e: DirectoryEntry) {
    // KAN-1279: `active` only says this printer was chosen. With its socket not
    // open and ready the page is empty, and going to it again did nothing.
    const socket = this.$store.state.socket
    if (e.active && socket.open && socket.ready) {
      this.afterOpen()
      return
    }
    if (e.cloud) chooseRouteMode(e.cloud.id, 'auto')
    // Heard over Bluetooth and out of every other reach: the cloud says it is offline, so Bluetooth is the way in.
    // An automatic move, not a choice: it records no held route.
    if (e.health === 'nearby' && e.nearby && e.cloud) return this.connectOverBluetooth(e, e.nearby, true)
    // On the hosted page, the printer's own secure address is the way in on this network.
    const name = secureNameOf(e.cloud)
    if (e.cloud && name && mayTrySecureName() && !relayChosen(e.cloud.id) &&
      !wantsBluetoothFor(e.cloud.id) && name !== window.location.hostname) {
      const id = e.cloud.id
      let result: InPlaceResult = { ok: false, why: 'unreachable' }
      // In place, from the click: no address change (KAN-5459).
      await this.run(e.key, async () => {
        result = await connectInPlace({ name, label: e.name, endpointId: e.endpointId, printerId: id })
        return result.ok
      })
      if (routeMode(id) !== 'auto') return false
      if (result.ok) return true
      let why = localFailure(id, result.ok ? 'failed' : result.why)
      // KAN-6283 (A): the name did not resolve although the printer is here: its address, in place, before Muon3D.
      if (why === 'rebinding') {
        const direct = await this.connectByAddressFor(e, id)
        if (direct.ok) {
          this.notice = null
          return true
        }
        if (!direct.ok && direct.why === 'blocked') why = 'blocked'
        if (routeMode(id) !== 'auto') return false
      }
      if (!toldRelay.has(e.cloud.id)) {
        toldRelay.add(e.cloud.id)
        this.notice = why === 'blocked'
          ? LOCAL_ACCESS_BLOCKED
          : why === 'rebinding'
            ? `Opened ${e.name} through Muon3D. ${REBINDING_LINE} ${REBINDING_FIX}`
            : `Opened ${e.name} through Muon3D. This browser can't reach its secure address on this network.`
      }
    }
    // The service lost it, or it answers on this network: the local way in is the one that works.
    // Auto's order: this network, Muon3D, Bluetooth (openManagedRoute moves on to it), then the question.
    const opened = e.lan || (!e.cloud?.online && e.host) ? await this.connectLocal(e, true) : await this.connectCloud(e)
    if (opened === false) this.askMuonLocal = true
    return opened
  }

  /**
   * A route the person picked failed. It stays the held route, nothing else is tried, and the other routes are
   * offered as buttons the person chooses.
   */
  failRoute (e: DirectoryEntry, picked: 'local' | 'cloud' | 'bluetooth', line: string, why: LocalFailure = 'other') {
    const choices: Array<{ id: string, label: string }> = []
    // KAN-6283 (B): where this network blocks the secure name, or the browser won't let this page reach the printer, the
    // primary choice is the printer's own page on this network, opened only by this click, in a new tab.
    const onNetwork = why === 'rebinding' || (why === 'blocked' && !!besideAddrs(idOf(e)).length)
    if (onNetwork) {
      this.routeProblemUrl = ownPageUrl(idOf(e))
      choices.push({ id: 'open-page', label: `Open ${e.name} on this network` })
    }
    const bluetooth = why === 'elsewhere' ? !!e.nearby : !!(e.nearby || idOf(e))
    const webBluetooth = !onNetwork || bluetoothSupport().supported
    if (picked !== 'bluetooth' && bluetooth && webBluetooth) {
      choices.push({ id: 'bluetooth', label: onNetwork ? 'Connect over Bluetooth' : 'Over Bluetooth' })
    }
    if (picked !== 'cloud' && e.cloud?.online) choices.push({ id: 'cloud', label: 'Over Muon3D' })
    if (!onNetwork) {
      if (picked !== 'local' && localRouteOf(e).kind === 'secure') choices.push({ id: 'local', label: 'On this network' })
      // A printer on another network has no muon3d.local to open from here.
      if (why !== 'elsewhere') choices.push({ id: 'muon-local', label: 'muon3d.local' })
    }
    this.routeProblem = { line, ...(why === 'rebinding' ? { detail: REBINDING_FIX } : {}), choices }
    this.routeProblemEntry = e
  }

  /** A button under "Couldn't connect": the person's choice of the next route. */
  onProblemChoice (id: string) {
    const e = this.routeProblemEntry
    this.routeProblem = null
    if (id === 'muon-local') {
      this.askMuonLocal = true
      return
    }
    if (id === 'open-page') {
      const url = this.routeProblemUrl
      this.routeProblemUrl = null
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!e) return
    if (id === 'cloud') return this.connectCloud(e, 'relay')
    if (id === 'bluetooth') return this.connectOverBluetooth(e)
    if (id === 'local') return this.connectLocal(e)
  }

  cancelMuonLocal () {
    this.askMuonLocal = false
  }

  /**
   * `route` is the person's choice of way in (KAN-1253): the device to open it
   * over Bluetooth, or `'relay'` to undo an earlier Bluetooth choice. The
   * choice and the drop of any open connection happen inside `run`, so a click
   * ignored while another open is busy changes nothing. The handoff behind a
   * Bluetooth choice no longer waits on the service for this printer, and a
   * connection already open is dropped so this dial uses the chosen route.
   */
  connectCloud (e: DirectoryEntry, route?: 'relay' | BleDevice, auto = false) {
    const id = idOf(e)
    if (!id || (!e.cloud && (!route || route === 'relay'))) return
    if (route && !auto) chooseRouteMode(id, route === 'relay' ? 'cloud' : 'ble')
    return Promise.resolve(this.run(e.key, () => openManagedRoute(e, route, auto), !!route)).then(opened => {
      // A picked route is held: no other is tried, and the person is told and offered the rest.
      if (opened === false && route && !auto) {
        this.failRoute(e, route === 'relay' ? 'cloud' : 'bluetooth',
          route === 'relay' ? "Couldn't connect over Muon3D." : "Couldn't connect over Bluetooth.")
      }
      return opened
    })
  }

  /** The saved address it answers on, else its address on this network. */
  localInstance (e: DirectoryEntry): InstanceConfig | null {
    if (e.lan) {
      const answering = lanAddresses(e.lan)
      const saved = e.saved.find(s => answering.includes(hostOf(s.apiUrl)))
      return saved ?? instanceFor(e.lan)
    }
    if (e.host) return instanceForHost(e.host, e.name, e.endpointId)
    return e.saved[0] ?? null
  }

  /**
   * KAN-6283 (A): the printer's LAN address, in place, where the secure name did not resolve. Only an address the
   * service lists beside this browser or the printer reported, only a private one (direct-address.ts), and only a
   * printer that answers as this one. The browser's own question is explained first.
   */
  async connectByAddressFor (e: DirectoryEntry, id: string | null | undefined): Promise<DirectResult> {
    let direct = { ok: false, why: 'unsupported' } as DirectResult
    await this.run(e.key, async () => {
      direct = await connectByAddress({
        addrs: [...besideAddrs(id), e.host, printerSaidAddr(e)],
        label: e.name,
        printerId: id,
        endpointId: e.endpointId,
        names: [e.cloud?.name],
        onAsking: () => { this.notice = LNA_PREPROMPT }
      })
      if (direct.ok && id) {
        clearRelayChoice(id)
        stopUsingBluetoothFor(id)
      }
      return direct.ok
    })
    if (this.notice === LNA_PREPROMPT) this.notice = null
    return direct
  }

  /**
   * Connect locally from the hosted page (KAN-5459): in place, over the printer's secure name, so the tab stays on
   * control.muon3d.com and the printer shows as connected locally. Never to a printer's own address.
   *
   * `picked` is the person's own choice of route (Connect locally in the route menu): 'lan' is held, and if it fails
   * it stays held, says so and offers the other routes as buttons. Not picked (a plain click on a found printer) it is
   * Auto: this network, then Muon3D, then Bluetooth, then the question about muon3d.local.
   */
  async connectLocalFromHostedPage (e: DirectoryEntry, route: LocalRoute, picked = true): Promise<boolean | undefined> {
    this.holdKey = e.key
    try {
      return await this.connectLocalFromHostedPageRoutes(e, route, picked)
    } finally {
      this.holdKey = null
    }
  }

  async connectLocalFromHostedPageRoutes (e: DirectoryEntry, route: LocalRoute, picked = true): Promise<boolean | undefined> {
    const id = e.cloud?.id ?? e.endpointId
    let result: InPlaceResult = { ok: false, why: 'unreachable' }
    // Busy: run says "Still opening" itself, and that stays the answer.
    const busy = !!this.busyKey
    if (picked && id && !busy) chooseRouteMode(id, 'lan')
    if (route.kind === 'secure') {
      await this.run(e.key, async () => {
        result = await connectInPlace({ name: route.name, label: e.name, endpointId: e.endpointId, printerId: id })
        if (result.ok && id) {
          clearRelayChoice(id)
          stopUsingBluetoothFor(id)
        }
        return result.ok
      })
      if (result.ok) return true
    }
    if (busy) return
    let why = result.ok ? 'other' : localFailure(id, result.why, route.kind === 'secure')
    // KAN-6283 (A): the secure name did not resolve although the printer is here. Try its address, in place, before
    // Muon3D and Bluetooth, in a browser with Local Network Access. Never anything but a private address the
    // service or the printer gave, and only the printer that answers as this one.
    if (why === 'rebinding') {
      const direct = await this.connectByAddressFor(e, id)
      if (direct.ok) {
        this.notice = null
        return true
      }
      if (this.notice === LNA_PREPROMPT) this.notice = null
      if (!direct.ok && direct.why === 'blocked') why = 'blocked'
    }
    let line = "Couldn't connect locally."
    if (why === 'blocked') line = LOCAL_ACCESS_BLOCKED
    else if (why === 'rebinding') line = REBINDING_LINE
    else if (why === 'elsewhere') line = NOT_ON_YOUR_NETWORK
    if (picked) {
      this.notice = null
      this.failRoute(e, 'local', line, why)
      return false
    }
    // Auto moves on, and says why this network was skipped.
    if (why === 'blocked') this.notice = LOCAL_ACCESS_BLOCKED
    else if (why === 'rebinding') this.notice = `${REBINDING_LINE} ${REBINDING_FIX}`
    let opened: boolean | undefined
    if (e.cloud?.online) opened = await this.connectCloud(e, undefined, true)
    else if (e.nearby) opened = await this.connectOverBluetooth(e, e.nearby, true)
    if (opened !== true) {
      // Never the sign-in page from here (KAN-6283): another network gets its own line and the routes that are there.
      if (why === 'elsewhere' || why === 'rebinding' || (why === 'blocked' && besideAddrs(id).length)) this.failRoute(e, 'local', line, why)
      else this.askMuonLocal = true
    }
    return opened
  }

  connectLocal (e: DirectoryEntry, auto = false, picked = true) {
    if (auto && routeMode(idOf(e)) !== 'auto') return false
    // An automatic move never opens a tab or leaves the page: only a person's Connect locally does.
    if (!auto && mayTrySecureName()) {
      return this.connectLocalFromHostedPage(e, this.localRouteFor(e), picked)
    }
    // An automatic move on the hosted page can't dial a plain local address (the browser blocks it), so Muon3D carries it.
    if (auto && mayTrySecureName() && e.cloud?.online) return this.connectCloud(e, undefined, true)
    const instance = this.localInstance(e)
    if (!instance) {
      // The service found it beside this browser but gave no address to use
      // (only the printer's own hotspot): there is nothing to open here.
      this.notice = `${e.name} is on this network, but Muon3D doesn't know its address here. ` +
        'Search again, or add it by the IP address its screen shows under System.'
      return
    }
    const id = e.cloud?.id ?? e.endpointId
    if (id && !auto) chooseRouteMode(id, 'lan')
    return this.run(e.key, async () => {
      if (e.endpointId && !auto) {
        stopUsingBluetoothFor(e.endpointId)
        dropCloudConnection(e.endpointId)
      }
      if (await activateLocalPrinter(instance, id)) {
        if (auto && e.endpointId && routeMode(id) === 'auto') {
          stopUsingBluetoothFor(e.endpointId)
          dropCloudConnection(e.endpointId)
        }
        return true
      }
      return auto && (!id || routeMode(id) === 'auto') ? openManagedRoute(e, undefined, true) : false
    }, true)
  }

  openLocalEntry (e: DirectoryEntry) {
    if (e.active) {
      this.afterOpen()
      return
    }
    return this.connectLocal(e, false, false)
  }

  openFoundEntry (e: DirectoryEntry) {
    const row = e.row
    if (!row) return
    switch (row.action) {
      case 'open': {
        const way = foundOpenFor(e, cloudState.printers, !!cloudState.account)
        if (way.kind === 'relay') {
          return this.run(e.key, async () => {
            await activateCloudPrinter(way.printerId)
            return true
          })
        }
        // KAN-6283: "Connect" on a found tile is the local route. It never goes to the sign-in page: on this network it
        // connects, elsewhere it says the printer isn't here and offers the routes that are.
        return this.connectLocal(e, false, false)
      }
      case 'set-up':
        if (!row.nearby) return
        this.setupPrinter = row.nearby
        this.setupDialog = true
        return
      case 'nearby-info':
        // Set up, and not on this network or an account: still this browser's to pair with over Bluetooth, signed in or not.
        if (row.nearby?.endpointId) return this.pairNearby(e)
        this.notice = `${row.name} is nearby. This browser hears it over Bluetooth, but it isn't on this ` +
          "network or your account. Join the network it's on, or link it to your account at the printer."
    }
  }

  async openInstance (instance: InstanceConfig) {
    await this.run(`address:${instance.apiUrl}`, () => activateLocalPrinter(instance))
  }

  // -- managing --------------------------------------------------------------

  link (e: DirectoryEntry) {
    if (!this.account) {
      this.pendingLink = e
      this.accountDialog = true
      return
    }
    const nearbyId = e.row?.cloudId ??
      discoveryState.cloud.find(c => c.printerId === e.endpointId)?.printerId ?? ''
    this.linkPrinterId = nearbyId
    this.linkHost = nearbyId ? '' : (e.host ?? '')
    this.linkDialog = true
  }

  onSignedIn () {
    const pending = this.pendingLink
    this.pendingLink = null
    if (pending) this.link(pending)
    const open = this.pendingOpen
    this.pendingOpen = null
    if (open) this.openFoundEntry(open)
  }

  remove (e: DirectoryEntry) {
    for (const s of e.saved) this.$store.dispatch('config/removeInstance', s)
  }

  askForAccess (e: DirectoryEntry) {
    if (!e.host) return
    this.accessClient = lanPrinterAccess(`http://${e.host}`)
    this.accessAsk = { kind: 'join' }
    this.accessName = e.name
    this.accessDialog = true
  }

  onAccessAnswered () {
    refreshKnownPrinters().catch(() => {})
  }

  async openAccess (e: DirectoryEntry) {
    if (!e.active) {
      if (e.section === 'cloud') await this.connectCloud(e)
      else await this.connectLocal(e)
      if (activationState.error) return
    }
    this.$emit('click')
    const hash = this.$store.getters['server/componentSupport']('muon_access') ? '#access' : '#protection'
    const settings = scopedPath('/settings', activeSlug())
    if (this.$route.path !== settings || this.$route.hash !== hash) {
      this.$router.push({ path: settings, hash }).catch(() => {})
    }
  }
}
