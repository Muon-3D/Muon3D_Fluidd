import { Component, Mixins } from 'vue-property-decorator'
import consola from 'consola'
import type { InstanceConfig } from '@/store/config/types'
import StateMixin from './state'
import { cloudState, dropCloudConnection } from '@/services/muon-cloud/state'
import { deletionState } from '@/services/muon-cloud/deletion'
import { foundOpenFor } from '@/services/muon-cloud/found-open'
import {
  activateCloudPrinter,
  activateLocalPrinter,
  activationState,
  SwitchSuperseded,
  MANAGED_API_URL
} from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  instanceFor,
  instanceForHost,
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
import { isPrinter, lookNearby, nearbyState, permittedPrinterFor, type NearbyPrinter } from '@/services/muon-ble/nearby'
import { startPairing } from '@/services/muon-ble/pairing'
import { bleRetryState, retryBluetooth } from '@/services/muon-ble/retry'
import { bluetoothCarrying, reconnectBluetooth, releaseBluetoothLink, stopUsingBluetoothFor, useBluetoothFor, wantsBluetoothFor } from '@/services/muon-ble/link'
import { chooseRouteMode } from '@/services/muon-cloud/route-choice'
import type { BleDevice } from '@/services/muon-ble/webBluetooth'
import { chooseRelay, mayTrySecureName, reachSecureName, relayChosen, secureNameOf } from '@/services/secure-origin/hosted'
import { lanPrinterAccess, type AccessAsk, type AccessClient } from '@/services/muon-access/api'
import { requestRefused } from '@/services/managed-transport/refusal'

/**
 * The longest a row stays busy with one open. The slowest open is bounded
 * below this (`REMOTE_OPEN_TIMEOUT_MS`, `LOCAL_OPEN_TIMEOUT_MS`); this is the
 * backstop for a step that has no bound of its own.
 */
export const RUN_TIMEOUT_MS = 60_000

class RunTimeout extends Error {}

/** Printers whose "opened through Muon3D" notice has been shown on this page load. */
const toldRelay = new Set<string>()

let navigate = (url: string) => window.location.assign(url)

/** For tests: replaces how the page is sent to a printer's secure address. */
export function setNavigate (fn: (url: string) => void) {
  navigate = fn
}

/** Counts runs, so one taken over by a chosen route does not clear the row of the one that took over. */
let runCounter = 0

/**
 * Opens `e` the way `route` says. `auto` is auto mode's own move (the banner's
 * failover, or Connect locally's fall back to Muon3D): it opens the route but
 * records no choice, so nothing becomes held and later plain Connects behave as
 * before (#370).
 */
async function openManagedRoute (e: DirectoryEntry, route?: 'relay' | BleDevice, auto = false): Promise<boolean> {
  if (!e.cloud) return false
  const id = e.cloud.id
  if (!route || route === 'relay') {
    if (route === 'relay' && !auto) chooseRelay(id)
    stopUsingBluetoothFor(id)
  } else {
    useBluetoothFor(id, route)
    // Another try gets a fresh link: the old one can look open while it
    // carries nothing (KAN-2080), and reusing it dead-ended "Try again".
    await releaseBluetoothLink(id)
    reconnectBluetooth(id)
  }
  dropCloudConnection(id)
  try {
    await activateCloudPrinter(id)
  } catch (error) {
    if (route || error instanceof SwitchSuperseded || requestRefused(error)) throw error
    const nearby = e.nearby ?? await permittedPrinterFor(id)
    if (!nearby) throw error
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
  notice: string | null = null
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

  get bluetoothInsecure () {
    return nearbyState.support === 'insecure'
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

  get savedInstances (): InstanceConfig[] {
    const all: InstanceConfig[] = this.$store.getters['config/getInstances'] ?? []
    return all.filter(i => i.apiUrl !== MANAGED_API_URL)
  }

  /** The printer Fluidd is on locally, from its own socket. */
  get localLive (): LocalLive | null {
    if (cloudState.activePrinterId) return null
    const apiUrl: string = this.$store.state.config.apiUrl
    if (!apiUrl || apiUrl === MANAGED_API_URL) return null
    let health: PrinterHealth
    if (!this.socketConnected) health = 'connecting'
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
    const heard = await lookNearby()
    if (!heard?.endpointId) return
    const entry = this.directory.cloud.find(c => c.cloud && isPrinter(heard, c.cloud.id))
    if (entry) await this.connectOverBluetooth(entry, heard)
  }

  // -- what each printer offers ----------------------------------------------

  cloudActions (e: DirectoryEntry): CardAction[] {
    const actions: CardAction[] = []
    if (e.active !== 'local') {
      actions.push({
        id: 'connect-local',
        label: 'Connect locally',
        icon: '$lan',
        hint: e.host ? e.host : 'Not found on this network',
        disabled: !e.host
      })
    }
    if (e.active !== 'cloud') {
      actions.push({ id: 'connect-cloud', label: 'Connect through Muon3D', icon: '$cloud', disabled: !e.cloud?.online })
    }
    // Whenever it was heard nearby, whatever the service says (KAN-1175, ADR
    // 0052): the service can call a printer online that this browser cannot
    // reach through the relay, and Bluetooth is the way in then.
    // I-129: and wherever this browser has Bluetooth at all, heard or not: the
    // action runs the device picker itself, so "Look nearby" is not a first step.
    if (e.cloud && (e.nearby || nearbyState.support === 'supported')) {
      actions.push({ id: 'connect-bluetooth', label: 'Connect over Bluetooth', icon: '$bluetooth' })
    }
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
    return actions
  }

  actionsFor (e: DirectoryEntry): CardAction[] {
    if (e.section === 'cloud') return this.cloudActions(e)
    if (e.section === 'local') return this.localActions(e)
    return this.foundActions(e)
  }

  async onAction (e: DirectoryEntry, id: string) {
    this.notice = null
    switch (id) {
      case 'connect-local': return this.connectLocal(e)
      case 'connect-cloud': return this.connectCloud(e, 'relay')
      case 'retry-bluetooth':
      case 'connect-bluetooth':
        if (!e.cloud) return
        return this.connectOverBluetooth(e)
      case 'connect': return this.openFoundEntry(e)
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
    } catch (error) {
      if (error instanceof RunTimeout) {
        // Whatever the open was waiting on never answered: free the row.
        consola.warn(`Opening ${key} took longer than ${RUN_TIMEOUT_MS / 1000} seconds; gave up`)
        activationState.error = "The printer didn't open in time. Check that it's on and online, then try again."
      }
      // Otherwise activationState holds the reason.
    } finally {
      clearTimeout(timer)
      // A run that was taken over leaves the row to the run that took over.
      if (mine === runCounter) this.busyKey = null
    }
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
    if (!e.cloud) return
    const id = e.cloud.id
    let heard = chosen ?? e.nearby ?? await permittedPrinterFor(id).catch(() => null)
    if (!heard) {
      // KAN-2470: the chooser lists only this printer (its EndpointId, else its short name).
      heard = await lookNearby({ endpointId: id, name: e.nearby?.localName })
      if (!heard) return
      if (heard.endpointId && !isPrinter(heard, id)) {
        this.notice = `That device isn't ${e.name}. Choose ${e.name} in the Bluetooth list.`
        return
      }
    }
    retryBluetooth(id)
    await this.connectCloud(e, heard.device, auto)
    if (activationState.pairing === id) await startPairing(id)
  }

  async openCloudEntry (e: DirectoryEntry) {
    // KAN-1279: `active` only says this printer was chosen. With its socket not
    // open and ready the page is empty, and going to it again did nothing.
    const socket = this.$store.state.socket
    if (e.active && socket.open && socket.ready) {
      this.afterOpen()
      return
    }
    if (e.cloud) chooseRouteMode(e.cloud.id, 'auto')
    // On the hosted page, the printer's own secure address is the way in on this network.
    const name = secureNameOf(e.cloud)
    if (e.cloud && name && mayTrySecureName() && !relayChosen(e.cloud.id) &&
      !wantsBluetoothFor(e.cloud.id) && name !== window.location.hostname) {
      let reached = false
      await this.run(e.key, async () => {
        reached = await reachSecureName(name)
        if (reached) navigate('https://' + name + '/')
        return reached
      })
      if (reached) return true
      if (!toldRelay.has(e.cloud.id)) {
        toldRelay.add(e.cloud.id)
        this.notice = `Opened ${e.name} through Muon3D. This browser can't reach its secure address on this network.`
      }
    }
    // The service lost it, or it answers on this network: the local way in is the one that works.
    if (e.lan || (!e.cloud?.online && e.host)) return this.connectLocal(e, true)
    return this.connectCloud(e)
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
    if (!e.cloud) return
    if (route && !auto) chooseRouteMode(e.cloud.id, route === 'relay' ? 'cloud' : 'ble')
    return this.run(e.key, () => openManagedRoute(e, route, auto), !!route)
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

  connectLocal (e: DirectoryEntry, auto = false) {
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
      if (e.endpointId) {
        stopUsingBluetoothFor(e.endpointId)
        dropCloudConnection(e.endpointId)
      }
      if (await activateLocalPrinter(instance, id)) return true
      return auto ? openManagedRoute(e) : false
    }, true)
  }

  openLocalEntry (e: DirectoryEntry) {
    if (e.active) {
      this.afterOpen()
      return
    }
    return this.connectLocal(e)
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
        if (way.kind === 'sign-in') {
          this.pendingOpen = e
          this.accountDialog = true
          return
        }
        return this.connectLocal(e)
      }
      case 'set-up':
        if (!row.nearby) return
        this.setupPrinter = row.nearby
        this.setupDialog = true
        return
      case 'nearby-info':
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
