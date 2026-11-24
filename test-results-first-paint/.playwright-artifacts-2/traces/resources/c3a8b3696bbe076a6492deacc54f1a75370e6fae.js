var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { cloudState, dropCloudConnection, rememberBluetoothOnly } from "/src/services/muon-cloud/state.ts";
import { deletionState } from "/src/services/muon-cloud/deletion.ts";
import { foundOpenFor } from "/src/services/muon-cloud/found-open.ts";
import {
  activateCloudPrinter,
  activateLocalPrinter,
  activationState,
  cancelActivation,
  SwitchSuperseded,
  MANAGED_API_URL
} from "/src/services/muon-cloud/activate.ts";
import {
  discoverPrinters,
  discoveryState,
  instanceFor,
  instanceForHost,
  isOwnHotspot,
  lanAddresses,
  refreshKnownPrinters
} from "/src/services/muon-cloud/discovery.ts";
import {
  hostOf,
  printerDirectory
} from "/src/services/muon-cloud/directory.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { bluetoothWhy as whyNoBluetooth } from "/src/services/muon-ble/unavailable.ts";
import { isPrinter, lookNearby, nearbyState, permittedPrinterFor } from "/src/services/muon-ble/nearby.ts";
import { scanForPrinters, scanState } from "/src/services/scan/index.ts";
import { startPairing } from "/src/services/muon-ble/pairing.ts";
import { bleRetryState, retryBluetooth } from "/src/services/muon-ble/retry.ts";
import { bluetoothCarrying, reconnectBluetooth, releaseBluetoothLink, stopUsingBluetoothFor, useBluetoothFor, wantsBluetoothFor } from "/src/services/muon-ble/link.ts";
import { chooseRouteMode, routeMode } from "/src/services/muon-cloud/route-choice.ts";
import { routeMenuItems } from "/src/services/muon-cloud/route-menu.ts";
import { connectInPlace, LOCAL_ACCESS_BLOCKED } from "/src/services/muon-cloud/connect-in-place.ts";
import { chooseRelay, clearRelayChoice, mayTrySecureName, relayChosen, secureNameOf } from "/src/services/secure-origin/hosted.ts";
import { isOpenableAddr, localRoute, mdnsHostFromName } from "/src/services/muon-cloud/local-route.ts";
import { lanPrinterAccess } from "/src/services/muon-access/api.ts";
import { requestRefused } from "/src/services/managed-transport/refusal.ts";
export const RUN_TIMEOUT_MS = 6e4;
class RunTimeout extends Error {
}
function nearbyOf(id) {
  const want = id.toLowerCase();
  return discoveryState.cloud.find((c) => c.printerId.toLowerCase() === want);
}
function printerSaidAddr(e) {
  const said = [
    e.lan?.mdnsHost,
    ...(e.saved ?? []).map((s) => s.mdnsHost),
    e.host,
    ...(e.saved ?? []).map((s) => hostOf(s.apiUrl))
  ];
  return said.find((a) => isOpenableAddr(a) && !isOwnHotspot(a)) ?? null;
}
function localRouteOf(e) {
  const id = e.cloud?.id ?? e.endpointId;
  const nearby = id ? nearbyOf(id) : void 0;
  return localRoute({
    hosted: mayTrySecureName(),
    host: e.host,
    // The account's own name for the printer, else the one the service gives a printer beside this browser (KAN-5459):
    // an Open printer is for anyone, signed in or not.
    secureName: secureNameOf(e.cloud) ?? secureNameOf({ secure_name: nearby?.secureName }),
    pageHost: window.location.hostname,
    mdnsHost: e.lan?.mdnsHost ?? e.saved?.find((s) => s.mdnsHost)?.mdnsHost ?? mdnsHostFromName(e.cloud?.name ?? e.name),
    printerSaid: printerSaidAddr(e),
    nearby,
    nearbyChecked: discoveryState.cloudChecked,
    blockedByPage: !!discoveryState.blockedByPage
  });
}
function localHint(route, e) {
  switch (route.kind) {
    case "secure":
      return "Connects on your network, in this tab";
    case "page":
      return "Needs its secure address. Use Muon3D or Bluetooth";
    case "lan":
      return e.host ?? "";
    case "none":
      return route.reason;
  }
}
function idOf(e) {
  return e.cloud?.id ?? e.endpointId;
}
export function liveRouteOf(e) {
  if (e.active === "local") return "lan";
  if (e.active !== "cloud") return null;
  const id = idOf(e);
  return id && bluetoothCarrying(id) ? "ble" : "cloud";
}
function routeActionsOf(e) {
  return routeMenuItems(routeFactsOf(e)).map(({ id, label, icon, hint, disabled }) => ({ id, label, icon, hint, disabled }));
}
function routeFactsOf(e) {
  const route = localRouteOf(e);
  return {
    mode: routeMode(idOf(e)),
    live: liveRouteOf(e),
    local: { usable: route.kind === "secure" || route.kind === "lan", hint: localHint(route, e) },
    cloud: { listed: !!e.cloud, online: !!e.cloud?.online },
    ble: { support: nearbyState.support, heard: !!e.nearby, identified: !!idOf(e), why: whyNoBluetooth()?.text ?? null }
  };
}
const toldRelay = /* @__PURE__ */ new Set();
let runCounter = 0;
async function openManagedRoute(e, route, auto = false) {
  const id = idOf(e);
  if (!id || !e.cloud && (!route || route === "relay")) return false;
  if (auto && routeMode(id) !== "auto") return false;
  if (!route || route === "relay") {
    if (route === "relay" && !auto) chooseRelay(id);
    stopUsingBluetoothFor(id);
  } else {
    useBluetoothFor(id, route);
    await releaseBluetoothLink(id);
    if (auto && routeMode(id) !== "auto") return false;
    reconnectBluetooth(id);
  }
  dropCloudConnection(id);
  try {
    await activateCloudPrinter(id);
  } catch (error) {
    if (route || error instanceof SwitchSuperseded || requestRefused(error)) throw error;
    const nearby = e.nearby ?? await permittedPrinterFor(id);
    if (!nearby) throw error;
    if (routeMode(id) !== "auto") throw new SwitchSuperseded();
    useBluetoothFor(id, nearby.device);
    dropCloudConnection(id);
    await activateCloudPrinter(id);
  }
  return true;
}
async function afterBluetoothPick(vm, heard) {
  if (!heard) return;
  if (!heard.endpointId) {
    vm.notice = `Couldn't tell which printer ${heard.display || heard.localName || "that device"} is. Move closer to it and try again.`;
    return;
  }
  const entry = vm.directory.cloud.find((c) => c.cloud && isPrinter(heard, c.cloud.id));
  if (entry) {
    await vm.connectOverBluetooth(entry, heard);
    return;
  }
  if (!cloudState.ready) {
    vm.notice = "Your printers are still loading. Try Connect over Bluetooth again in a moment.";
    return;
  }
  const nearbyEntry = vm.directory.found.find((f) => f.nearby?.deviceId === heard.deviceId);
  const known = vm.directory.local.find((l) => l.nearby?.deviceId === heard.deviceId) ?? (nearbyEntry?.row?.action === "open" ? nearbyEntry : void 0);
  if (known) {
    await vm.pairNearbyPrinter(heard, known.key, true);
    return;
  }
  if (nearbyEntry) {
    await vm.openFoundEntry(nearbyEntry);
    return;
  }
  vm.notice = `${heard.display || heard.localName || "That printer"} was found over Bluetooth. It is listed with the printers found nearby.`;
}
let PrinterEntriesMixin = class extends Mixins(StateMixin) {
  get deletionPending() {
    return deletionState.deleteAfter !== null;
  }
  instanceDialogOpen = false;
  accountDialog = false;
  linkDialog = false;
  linkPrinterId = "";
  linkHost = "";
  /** A printer picked for linking before sign-in. */
  pendingLink = null;
  /** A found tile on an https page, waiting for sign-in to open through the account. */
  pendingOpen = null;
  busyKey = null;
  notice = null;
  /** A route the person picked failed: what happened and the other routes as buttons (nothing switches by itself). */
  routeProblem = null;
  routeProblemEntry = null;
  /** Auto found no way in: ask whether to open muon3d.local. */
  askMuonLocal = false;
  /** An address to show as a link under the notice, when a new tab was blocked. */
  noticeLink = null;
  setupDialog = false;
  setupPrinter = null;
  /** "Ask for access" to a printer on this network (ACC-17). */
  accessDialog = false;
  accessClient = null;
  accessAsk = null;
  accessName = "";
  get account() {
    return cloudState.account;
  }
  get nearby() {
    return nearbyState;
  }
  get bluetoothSearch() {
    return nearbyState.support === "supported";
  }
  /** Why Bluetooth cannot be used here, said plainly, or null when it can (KAN-4802). */
  get bluetoothWhy() {
    return whyNoBluetooth(void 0, this.bluetoothOff);
  }
  get bluetoothOff() {
    return this.bluetoothSearch && nearbyState.radio === "off";
  }
  get activationError() {
    return activationState.error;
  }
  /** The printer that refused this browser over Bluetooth: Control can pair with it (KAN-1253). */
  get pairingOffer() {
    return activationState.pairing;
  }
  pairThisBrowser() {
    if (activationState.pairing) startPairing(activationState.pairing).catch(() => {
    });
  }
  get activationFallback() {
    return activationState.fallbackUrl;
  }
  get searching() {
    return discoveryState.scanning;
  }
  get blockedByPage() {
    return discoveryState.blockedByPage;
  }
  get scanNetwork() {
    return discoveryState.network;
  }
  get savedInstances() {
    const all = this.$store.getters["config/getInstances"] ?? [];
    return all.filter((i) => i.apiUrl !== MANAGED_API_URL);
  }
  /** The printer Fluidd is on locally, from its own socket. */
  get localLive() {
    if (cloudState.activePrinterId) return null;
    const apiUrl = this.$store.state.config.apiUrl;
    if (!apiUrl || apiUrl === MANAGED_API_URL) return null;
    let health;
    if (!this.socketConnected) health = "connecting";
    else if (!this.authenticated) health = "locked";
    else if (!this.klippyReady) health = "error";
    else if (this.printerPrinting) health = "printing";
    else if (this.printerPaused) health = "paused";
    else health = "online";
    return { apiUrl, health, detail: this.localDetail(health) };
  }
  localDetail(health) {
    if (health === "connecting") return "Connecting…";
    if (health === "locked") return "Waiting for sign-in";
    const state = this.$filters.prettyCase(this.printerState || "unknown");
    if (this.printerPrinting || this.printerPaused) {
      const progress = Math.floor((this.$store.getters["printer/getPrintProgress"] ?? 0) * 100);
      return `${state} · ${progress}%`;
    }
    return state;
  }
  get directory() {
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
    });
  }
  rescan() {
    this.notice = null;
    discoveryState.cloudChecked = false;
    discoverPrinters(true).catch(() => {
    });
  }
  async onLookNearby() {
    this.notice = null;
    await lookNearby();
  }
  /**
   * The big Connect over Bluetooth button (KAN-2470): the chooser lists only
   * Muon printers. A printer already on the account is opened over Bluetooth;
   * a new one is now in the Bluetooth list (Look nearby's own result), ready
   * to be set up or paired. A dismissed chooser does nothing.
   */
  async onConnectOverBluetooth() {
    this.notice = null;
    await afterBluetoothPick(this, await lookNearby());
  }
  /** The Printers page's "Scan for printers" (KAN-5409): one click runs every source; a printer picked over Bluetooth is then opened as ever. */
  get scanBusy() {
    return scanState.phase === "scanning";
  }
  async onScan() {
    this.notice = null;
    await afterBluetoothPick(this, await scanForPrinters());
  }
  // -- what each printer offers ----------------------------------------------
  /** How Connect locally would reach this printer from this page (KAN-2529). */
  localRouteFor(e) {
    return localRouteOf(e);
  }
  cloudActions(e) {
    const actions = routeActionsOf(e);
    if (e.cloud && bleRetryState.stopped[e.cloud.id]) {
      actions.push({ id: "retry-bluetooth", label: "Retry Bluetooth", icon: "$bluetooth", hint: bleRetryState.stopped[e.cloud.id] });
    }
    actions.push({
      id: "access",
      label: "Access and protection",
      icon: "$printerAccess",
      hint: e.active ? void 0 : "Opens the printer first"
    });
    return actions;
  }
  /** Someone else's printer, or one that refused this browser: ask its panel to let this browser in. */
  askAction(e) {
    if (e.lan?.entry === "open") return null;
    if (e.linkedTo !== "other" && e.health !== "locked") return null;
    return {
      id: "ask",
      label: "Ask for access",
      icon: "$printerAsk",
      hint: e.linkedTo === "other" ? "Linked to another account" : "It wants access",
      disabled: !e.host
    };
  }
  localActions(e) {
    const actions = [];
    const ask = this.askAction(e);
    if (ask) {
      actions.push(ask);
    } else if (e.linkedTo !== "mine") {
      actions.push({ id: "link", label: "Link to my account", icon: "$linkPrinter", disabled: !e.host, hint: e.host ? void 0 : "Not found on this network" });
    }
    actions.push(...routeActionsOf(e));
    if (e.active) {
      actions.push({ id: "access", label: "Access and protection", icon: "$printerAccess" });
    }
    actions.push({
      id: "remove",
      label: "Remove",
      icon: "$printerRemove",
      danger: true,
      disabled: !!e.active,
      hint: e.active ? "Connect to another printer first" : void 0
    });
    return actions;
  }
  foundActions(e) {
    const actions = [];
    if (e.row?.action === "open") actions.push({ id: "connect", label: "Connect", icon: "$lan", disabled: !e.host });
    if (e.row?.canLink) actions.push({ id: "link", label: "Link to my account", icon: "$linkPrinter" });
    const ask = this.askAction(e);
    if (ask) actions.push(ask);
    const bluetooth = routeActionsOf(e).find((a) => a.id === "connect-bluetooth");
    if (bluetooth && (e.nearby || e.endpointId)) actions.push(bluetooth);
    return actions;
  }
  actionsFor(e) {
    if (e.section === "cloud") return this.cloudActions(e);
    if (e.section === "local") return this.localActions(e);
    return this.foundActions(e);
  }
  async onAction(e, id) {
    this.notice = null;
    this.noticeLink = null;
    this.routeProblem = null;
    this.askMuonLocal = false;
    switch (id) {
      case "connect-local":
        return this.connectLocal(e);
      case "connect-cloud":
        return this.connectCloud(e, "relay");
      case "retry-bluetooth":
      case "connect-bluetooth":
        if (!idOf(e)) return;
        return this.connectOverBluetooth(e);
      case "connect":
        return this.openFoundEntry(e);
      case "pair-bluetooth":
        return this.pairNearby(e, true);
      case "link":
        return this.link(e);
      case "remove":
        return this.remove(e);
      case "access":
        return this.openAccess(e);
      case "ask":
        return this.askForAccess(e);
    }
  }
  // -- opening ---------------------------------------------------------------
  /** After a printer opened from here. The switcher closes; the Printers page goes to the printer. */
  afterOpen() {
    this.$emit("click");
  }
  /**
   * `supersede` is a chosen way in (I-133): Connect over Bluetooth, or back to
   * Muon3D. It takes over from an open already in flight (activateCloudPrinter
   * supersedes the earlier dial) instead of hitting the busy guard.
   */
  async run(key, work, supersede = false) {
    if (this.busyKey && !supersede) {
      consola.warn(`Ignored a click on ${key}: still opening ${this.busyKey}`);
      this.notice = "Still opening a printer. Give it a moment, or reload the page if it stays stuck.";
      return;
    }
    const mine = ++runCounter;
    this.busyKey = key;
    let timer;
    try {
      const outcome = await Promise.race([
        work(),
        new Promise((_resolve, reject) => {
          timer = setTimeout(() => reject(new RunTimeout()), RUN_TIMEOUT_MS);
        })
      ]);
      if (outcome) this.afterOpen();
      return outcome;
    } catch (error) {
      if (error instanceof RunTimeout) {
        consola.warn(`Opening ${key} took longer than ${RUN_TIMEOUT_MS / 1e3} seconds; gave up`);
        activationState.error = "The printer didn't open in time. Check that it's on and online, then try again.";
      }
      return error instanceof SwitchSuperseded ? void 0 : false;
    } finally {
      clearTimeout(timer);
      if (mine === runCounter) this.busyKey = null;
    }
  }
  /** Cancel on a Bluetooth connect in flight: the open is replaced, the link dropped, the row freed. */
  cancelOpen(e) {
    const id = idOf(e);
    cancelActivation();
    if (id) {
      stopUsingBluetoothFor(id);
      releaseBluetoothLink(id).catch(() => {
      });
    }
    ++runCounter;
    this.busyKey = null;
  }
  /** Opens any printer the way its group does: the account's, a saved one, or one found here. */
  openEntry(e) {
    if (e.section === "cloud") return this.openCloudEntry(e);
    if (e.section === "local") return this.openLocalEntry(e);
    return this.openFoundEntry(e);
  }
  /**
   * The whole Bluetooth way in from one menu item (I-131): the device already
   * heard, else one this browser may already use, else the chooser; then the
   * link and the connect. A printer that refuses this browser as a stranger
   * goes straight into pairing, and the connect continues once paired.
   */
  async connectOverBluetooth(e, chosen, auto = false) {
    const id = idOf(e);
    if (!id) return;
    let heard = chosen ?? e.nearby ?? await permittedPrinterFor(id).catch(() => null);
    if (!heard) {
      heard = await lookNearby();
      if (!heard) return;
      if (!isPrinter(heard, id)) {
        this.notice = `That device isn't ${e.name}. Choose ${e.name} in the Bluetooth list.`;
        return;
      }
    }
    if (!cloudState.printers.some((p) => p.id === id)) rememberBluetoothOnly(id, heard.display || heard.localName || e.name);
    retryBluetooth(id);
    const opened = await this.connectCloud(e, heard.device, auto);
    if (activationState.pairing === id) {
      activationState.approval = null;
      await startPairing(id);
    }
    return opened;
  }
  /**
   * A printer heard over Bluetooth that is set up and not on this account (or
   * with nobody signed in): open it over Bluetooth, which needs no account. One
   * this browser was paired with opens; one that does not know this browser yet
   * goes straight into pairing (the code on its screen), as from a menu.
   */
  async pairNearby(e, hold = false) {
    await this.pairNearbyPrinter(e.row?.nearby ?? e.nearby ?? null, e.key, hold);
  }
  /**
   * `hold` is true only from the explicit Pair over Bluetooth button, which
   * keeps the Bluetooth route. An automatic open (a click on the tile) records
   * no held route.
   */
  async pairNearbyPrinter(heard, key = `ble:${heard?.deviceId}`, hold = false) {
    const id = heard?.endpointId;
    if (!heard || !id) return;
    this.notice = null;
    chooseRouteMode(id, hold ? "ble" : "auto");
    if (!cloudState.printers.some((p) => p.id === id)) rememberBluetoothOnly(id, heard.display || heard.localName || id.slice(0, 8));
    await this.run(key, async () => {
      useBluetoothFor(id, heard.device);
      await releaseBluetoothLink(id);
      reconnectBluetooth(id);
      dropCloudConnection(id);
      await activateCloudPrinter(id);
      return true;
    }, true);
    if (activationState.pairing === id) await startPairing(id);
  }
  async openCloudEntry(e) {
    const socket = this.$store.state.socket;
    if (e.active && socket.open && socket.ready) {
      this.afterOpen();
      return;
    }
    if (e.cloud) chooseRouteMode(e.cloud.id, "auto");
    if (e.health === "nearby" && e.nearby && e.cloud) return this.connectOverBluetooth(e, e.nearby, true);
    const name = secureNameOf(e.cloud);
    if (e.cloud && name && mayTrySecureName() && !relayChosen(e.cloud.id) && !wantsBluetoothFor(e.cloud.id) && name !== window.location.hostname) {
      const id = e.cloud.id;
      let result = { ok: false, why: "unreachable" };
      await this.run(e.key, async () => {
        result = await connectInPlace({ name, label: e.name, endpointId: e.endpointId, printerId: id });
        return result.ok;
      });
      if (routeMode(id) !== "auto") return false;
      if (result.ok) return true;
      if (!toldRelay.has(e.cloud.id)) {
        toldRelay.add(e.cloud.id);
        this.notice = result.why === "blocked" ? LOCAL_ACCESS_BLOCKED : `Opened ${e.name} through Muon3D. This browser can't reach its secure address on this network.`;
      }
    }
    const opened = e.lan || !e.cloud?.online && e.host ? await this.connectLocal(e, true) : await this.connectCloud(e);
    if (opened === false) this.askMuonLocal = true;
    return opened;
  }
  /**
   * A route the person picked failed. It stays the held route, nothing else is tried, and the other routes are
   * offered as buttons the person chooses.
   */
  failRoute(e, picked, line) {
    const choices = [];
    if (picked !== "cloud" && e.cloud?.online) choices.push({ id: "cloud", label: "Over Muon3D" });
    if (picked !== "bluetooth" && (e.nearby || idOf(e))) choices.push({ id: "bluetooth", label: "Over Bluetooth" });
    if (picked !== "local" && localRouteOf(e).kind === "secure") choices.push({ id: "local", label: "On this network" });
    choices.push({ id: "muon-local", label: "muon3d.local" });
    this.routeProblem = { line, choices };
    this.routeProblemEntry = e;
  }
  /** A button under "Couldn't connect": the person's choice of the next route. */
  onProblemChoice(id) {
    const e = this.routeProblemEntry;
    this.routeProblem = null;
    if (id === "muon-local") {
      this.askMuonLocal = true;
      return;
    }
    if (!e) return;
    if (id === "cloud") return this.connectCloud(e, "relay");
    if (id === "bluetooth") return this.connectOverBluetooth(e);
    if (id === "local") return this.connectLocal(e);
  }
  cancelMuonLocal() {
    this.askMuonLocal = false;
  }
  /**
   * `route` is the person's choice of way in (KAN-1253): the device to open it
   * over Bluetooth, or `'relay'` to undo an earlier Bluetooth choice. The
   * choice and the drop of any open connection happen inside `run`, so a click
   * ignored while another open is busy changes nothing. The handoff behind a
   * Bluetooth choice no longer waits on the service for this printer, and a
   * connection already open is dropped so this dial uses the chosen route.
   */
  connectCloud(e, route, auto = false) {
    const id = idOf(e);
    if (!id || !e.cloud && (!route || route === "relay")) return;
    if (route && !auto) chooseRouteMode(id, route === "relay" ? "cloud" : "ble");
    return Promise.resolve(this.run(e.key, () => openManagedRoute(e, route, auto), !!route)).then((opened) => {
      if (opened === false && route && !auto) {
        this.failRoute(
          e,
          route === "relay" ? "cloud" : "bluetooth",
          route === "relay" ? "Couldn't connect over Muon3D." : "Couldn't connect over Bluetooth."
        );
      }
      return opened;
    });
  }
  /** The saved address it answers on, else its address on this network. */
  localInstance(e) {
    if (e.lan) {
      const answering = lanAddresses(e.lan);
      const saved = e.saved.find((s) => answering.includes(hostOf(s.apiUrl)));
      return saved ?? instanceFor(e.lan);
    }
    if (e.host) return instanceForHost(e.host, e.name, e.endpointId);
    return e.saved[0] ?? null;
  }
  /**
   * Connect locally from the hosted page (KAN-5459): in place, over the printer's secure name, so the tab stays on
   * control.muon3d.com and the printer shows as connected locally. Never to a printer's own address.
   *
   * `picked` is the person's own choice of route (Connect locally in the route menu): 'lan' is held, and if it fails
   * it stays held, says so and offers the other routes as buttons. Not picked (a plain click on a found printer) it is
   * Auto: this network, then Muon3D, then Bluetooth, then the question about muon3d.local.
   */
  async connectLocalFromHostedPage(e, route, picked = true) {
    const id = e.cloud?.id ?? e.endpointId;
    let result = { ok: false, why: "unreachable" };
    const busy = !!this.busyKey;
    if (picked && id && !busy) chooseRouteMode(id, "lan");
    if (route.kind === "secure") {
      await this.run(e.key, async () => {
        result = await connectInPlace({ name: route.name, label: e.name, endpointId: e.endpointId, printerId: id });
        if (result.ok && id) {
          clearRelayChoice(id);
          stopUsingBluetoothFor(id);
        }
        return result.ok;
      });
      if (result.ok) return true;
    }
    if (busy) return;
    const blocked = !result.ok && result.why === "blocked";
    if (picked) {
      this.notice = null;
      this.failRoute(e, "local", blocked ? LOCAL_ACCESS_BLOCKED : "Couldn't connect locally.");
      return false;
    }
    if (blocked) this.notice = LOCAL_ACCESS_BLOCKED;
    let opened;
    if (e.cloud?.online) opened = await this.connectCloud(e, void 0, true);
    else if (e.nearby) opened = await this.connectOverBluetooth(e, e.nearby, true);
    if (opened !== true) this.askMuonLocal = true;
    return opened;
  }
  connectLocal(e, auto = false, picked = true) {
    if (auto && routeMode(idOf(e)) !== "auto") return false;
    if (!auto && mayTrySecureName()) {
      return this.connectLocalFromHostedPage(e, this.localRouteFor(e), picked);
    }
    if (auto && mayTrySecureName() && e.cloud?.online) return this.connectCloud(e, void 0, true);
    const instance = this.localInstance(e);
    if (!instance) {
      this.notice = `${e.name} is on this network, but Muon3D doesn't know its address here. Search again, or add it by the IP address its screen shows under System.`;
      return;
    }
    const id = e.cloud?.id ?? e.endpointId;
    if (id && !auto) chooseRouteMode(id, "lan");
    return this.run(e.key, async () => {
      if (e.endpointId && !auto) {
        stopUsingBluetoothFor(e.endpointId);
        dropCloudConnection(e.endpointId);
      }
      if (await activateLocalPrinter(instance, id)) {
        if (auto && e.endpointId && routeMode(id) === "auto") {
          stopUsingBluetoothFor(e.endpointId);
          dropCloudConnection(e.endpointId);
        }
        return true;
      }
      return auto && (!id || routeMode(id) === "auto") ? openManagedRoute(e, void 0, true) : false;
    }, true);
  }
  openLocalEntry(e) {
    if (e.active) {
      this.afterOpen();
      return;
    }
    return this.connectLocal(e, false, false);
  }
  openFoundEntry(e) {
    const row = e.row;
    if (!row) return;
    switch (row.action) {
      case "open": {
        const way = foundOpenFor(e, cloudState.printers, !!cloudState.account);
        if (way.kind === "relay") {
          return this.run(e.key, async () => {
            await activateCloudPrinter(way.printerId);
            return true;
          });
        }
        if (way.kind === "sign-in") {
          this.pendingOpen = e;
          this.accountDialog = true;
          return;
        }
        return this.connectLocal(e, false, false);
      }
      case "set-up":
        if (!row.nearby) return;
        this.setupPrinter = row.nearby;
        this.setupDialog = true;
        return;
      case "nearby-info":
        if (row.nearby?.endpointId) return this.pairNearby(e);
        this.notice = `${row.name} is nearby. This browser hears it over Bluetooth, but it isn't on this network or your account. Join the network it's on, or link it to your account at the printer.`;
    }
  }
  async openInstance(instance) {
    await this.run(`address:${instance.apiUrl}`, () => activateLocalPrinter(instance));
  }
  // -- managing --------------------------------------------------------------
  link(e) {
    if (!this.account) {
      this.pendingLink = e;
      this.accountDialog = true;
      return;
    }
    const nearbyId = e.row?.cloudId ?? discoveryState.cloud.find((c) => c.printerId === e.endpointId)?.printerId ?? "";
    this.linkPrinterId = nearbyId;
    this.linkHost = nearbyId ? "" : e.host ?? "";
    this.linkDialog = true;
  }
  onSignedIn() {
    const pending = this.pendingLink;
    this.pendingLink = null;
    if (pending) this.link(pending);
    const open = this.pendingOpen;
    this.pendingOpen = null;
    if (open) this.openFoundEntry(open);
  }
  remove(e) {
    for (const s of e.saved) this.$store.dispatch("config/removeInstance", s);
  }
  askForAccess(e) {
    if (!e.host) return;
    this.accessClient = lanPrinterAccess(`http://${e.host}`);
    this.accessAsk = { kind: "join" };
    this.accessName = e.name;
    this.accessDialog = true;
  }
  onAccessAnswered() {
    refreshKnownPrinters().catch(() => {
    });
  }
  async openAccess(e) {
    if (!e.active) {
      if (e.section === "cloud") await this.connectCloud(e);
      else await this.connectLocal(e);
      if (activationState.error) return;
    }
    this.$emit("click");
    const hash = this.$store.getters["server/componentSupport"]("muon_access") ? "#access" : "#protection";
    const settings = scopedPath("/settings", activeSlug());
    if (this.$route.path !== settings || this.$route.hash !== hash) {
      this.$router.push({ path: settings, hash }).catch(() => {
      });
    }
  }
};
PrinterEntriesMixin = __decorateClass([
  Component
], PrinterEntriesMixin);
export {
  PrinterEntriesMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByaW50ZXItZW50cmllcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgY29uc29sYSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHR5cGUgeyBJbnN0YW5jZUNvbmZpZyB9IGZyb20gJ0Avc3RvcmUvY29uZmlnL3R5cGVzJ1xuaW1wb3J0IFN0YXRlTWl4aW4gZnJvbSAnLi9zdGF0ZSdcbmltcG9ydCB7IGNsb3VkU3RhdGUsIGRyb3BDbG91ZENvbm5lY3Rpb24sIHJlbWVtYmVyQmx1ZXRvb3RoT25seSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCB7IGRlbGV0aW9uU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZGVsZXRpb24nXG5pbXBvcnQgeyBmb3VuZE9wZW5Gb3IgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZm91bmQtb3BlbidcbmltcG9ydCB7XG4gIGFjdGl2YXRlQ2xvdWRQcmludGVyLFxuICBhY3RpdmF0ZUxvY2FsUHJpbnRlcixcbiAgYWN0aXZhdGlvblN0YXRlLFxuICBjYW5jZWxBY3RpdmF0aW9uLFxuICBTd2l0Y2hTdXBlcnNlZGVkLFxuICBNQU5BR0VEX0FQSV9VUkxcbn0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FjdGl2YXRlJ1xuaW1wb3J0IHtcbiAgZGlzY292ZXJQcmludGVycyxcbiAgZGlzY292ZXJ5U3RhdGUsXG4gIGluc3RhbmNlRm9yLFxuICBpbnN0YW5jZUZvckhvc3QsXG4gIGlzT3duSG90c3BvdCxcbiAgbGFuQWRkcmVzc2VzLFxuICByZWZyZXNoS25vd25QcmludGVyc1xufSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZGlzY292ZXJ5J1xuaW1wb3J0IHtcbiAgaG9zdE9mLFxuICBwcmludGVyRGlyZWN0b3J5LFxuICB0eXBlIENhcmRBY3Rpb24sXG4gIHR5cGUgRGlyZWN0b3J5LFxuICB0eXBlIERpcmVjdG9yeUVudHJ5LFxuICB0eXBlIExvY2FsTGl2ZSxcbiAgdHlwZSBQcmludGVySGVhbHRoXG59IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXJlY3RvcnknXG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuaW1wb3J0IHsgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5pbXBvcnQgeyBibHVldG9vdGhXaHkgYXMgd2h5Tm9CbHVldG9vdGgsIHR5cGUgQmx1ZXRvb3RoV2h5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS91bmF2YWlsYWJsZSdcbmltcG9ydCB7IGlzUHJpbnRlciwgbG9va05lYXJieSwgbmVhcmJ5U3RhdGUsIHBlcm1pdHRlZFByaW50ZXJGb3IsIHR5cGUgTmVhcmJ5UHJpbnRlciB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbmVhcmJ5J1xuaW1wb3J0IHsgc2NhbkZvclByaW50ZXJzLCBzY2FuU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL3NjYW4nXG5pbXBvcnQgeyBzdGFydFBhaXJpbmcgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3BhaXJpbmcnXG5pbXBvcnQgeyBibGVSZXRyeVN0YXRlLCByZXRyeUJsdWV0b290aCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvcmV0cnknXG5pbXBvcnQgeyBibHVldG9vdGhDYXJyeWluZywgcmVjb25uZWN0Qmx1ZXRvb3RoLCByZWxlYXNlQmx1ZXRvb3RoTGluaywgc3RvcFVzaW5nQmx1ZXRvb3RoRm9yLCB1c2VCbHVldG9vdGhGb3IsIHdhbnRzQmx1ZXRvb3RoRm9yIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS9saW5rJ1xuaW1wb3J0IHsgY2hvb3NlUm91dGVNb2RlLCByb3V0ZU1vZGUsIHR5cGUgUm91dGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvcm91dGUtY2hvaWNlJ1xuaW1wb3J0IHsgcm91dGVNZW51SXRlbXMsIHR5cGUgUm91dGVNZW51RmFjdHMgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvcm91dGUtbWVudSdcbmltcG9ydCB0eXBlIHsgQmxlRGV2aWNlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS93ZWJCbHVldG9vdGgnXG5pbXBvcnQgeyBjb25uZWN0SW5QbGFjZSwgTE9DQUxfQUNDRVNTX0JMT0NLRUQsIHR5cGUgSW5QbGFjZVJlc3VsdCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9jb25uZWN0LWluLXBsYWNlJ1xuaW1wb3J0IHsgY2hvb3NlUmVsYXksIGNsZWFyUmVsYXlDaG9pY2UsIG1heVRyeVNlY3VyZU5hbWUsIHJlbGF5Q2hvc2VuLCBzZWN1cmVOYW1lT2YgfSBmcm9tICdAL3NlcnZpY2VzL3NlY3VyZS1vcmlnaW4vaG9zdGVkJ1xuaW1wb3J0IHsgaXNPcGVuYWJsZUFkZHIsIGxvY2FsUm91dGUsIG1kbnNIb3N0RnJvbU5hbWUsIHR5cGUgTG9jYWxSb3V0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9sb2NhbC1yb3V0ZSdcbmltcG9ydCB7IGxhblByaW50ZXJBY2Nlc3MsIHR5cGUgQWNjZXNzQXNrLCB0eXBlIEFjY2Vzc0NsaWVudCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1hY2Nlc3MvYXBpJ1xuaW1wb3J0IHsgcmVxdWVzdFJlZnVzZWQgfSBmcm9tICdAL3NlcnZpY2VzL21hbmFnZWQtdHJhbnNwb3J0L3JlZnVzYWwnXG5cbi8qKlxuICogVGhlIGxvbmdlc3QgYSByb3cgc3RheXMgYnVzeSB3aXRoIG9uZSBvcGVuLiBUaGUgc2xvd2VzdCBvcGVuIGlzIGJvdW5kZWRcbiAqIGJlbG93IHRoaXMgKGBSRU1PVEVfT1BFTl9USU1FT1VUX01TYCwgYExPQ0FMX09QRU5fVElNRU9VVF9NU2ApOyB0aGlzIGlzIHRoZVxuICogYmFja3N0b3AgZm9yIGEgc3RlcCB0aGF0IGhhcyBubyBib3VuZCBvZiBpdHMgb3duLlxuICovXG5leHBvcnQgY29uc3QgUlVOX1RJTUVPVVRfTVMgPSA2MF8wMDBcblxuY2xhc3MgUnVuVGltZW91dCBleHRlbmRzIEVycm9yIHt9XG5cbi8qKiBUaGUgc2VydmljZSdzIG5lYXJieSBlbnRyeSBmb3IgYSBwcmludGVyIGlkLiBUaGUgZGlyZWN0b3J5IG1hdGNoZXMgaWRzIHdpdGhvdXQgY2FzZSwgc28gZG9lcyB0aGlzLiAqL1xuZnVuY3Rpb24gbmVhcmJ5T2YgKGlkOiBzdHJpbmcpIHtcbiAgY29uc3Qgd2FudCA9IGlkLnRvTG93ZXJDYXNlKClcbiAgcmV0dXJuIGRpc2NvdmVyeVN0YXRlLmNsb3VkLmZpbmQoYyA9PiBjLnByaW50ZXJJZC50b0xvd2VyQ2FzZSgpID09PSB3YW50KVxufVxuXG4vKipcbiAqIEFuIGFkZHJlc3MgdGhlIHByaW50ZXIgaXRzZWxmIHRvbGQgdGhpcyBicm93c2VyIChLQU4tNDg5OCk6IGl0cyBgLmxvY2FsYCBuYW1lIGZyb20gaWRlbnRpdHkgKGxpdmUgb3ZlciBCbHVldG9vdGhcbiAqIG9yIExBTiwgb3Iga2VwdCB3aXRoIGEgc2F2ZWQgcHJpbnRlciksIGVsc2UgYSBMQU4gYWRkcmVzcyBpdCB3YXMgc2F2ZWQgb3Igc2VlbiBhdC4gTmV2ZXIgdGhlIGd1ZXNzIGZyb20gaXRzIGRpc3BsYXkgbmFtZS5cbiAqL1xuZnVuY3Rpb24gcHJpbnRlclNhaWRBZGRyIChlOiBEaXJlY3RvcnlFbnRyeSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzYWlkID0gW1xuICAgIGUubGFuPy5tZG5zSG9zdCxcbiAgICAuLi4oZS5zYXZlZCA/PyBbXSkubWFwKHMgPT4gcy5tZG5zSG9zdCksXG4gICAgZS5ob3N0LFxuICAgIC4uLihlLnNhdmVkID8/IFtdKS5tYXAocyA9PiBob3N0T2Yocy5hcGlVcmwpKVxuICBdXG4gIHJldHVybiBzYWlkLmZpbmQoYSA9PiBpc09wZW5hYmxlQWRkcihhKSAmJiAhaXNPd25Ib3RzcG90KGEpKSA/PyBudWxsXG59XG5cbi8qKiBIb3cgQ29ubmVjdCBsb2NhbGx5IHdvdWxkIHJlYWNoIHRoaXMgcHJpbnRlciBmcm9tIHRoaXMgcGFnZSAoS0FOLTI1MjkpLiAqL1xuZnVuY3Rpb24gbG9jYWxSb3V0ZU9mIChlOiBEaXJlY3RvcnlFbnRyeSk6IExvY2FsUm91dGUge1xuICBjb25zdCBpZCA9IGUuY2xvdWQ/LmlkID8/IGUuZW5kcG9pbnRJZFxuICBjb25zdCBuZWFyYnkgPSBpZCA/IG5lYXJieU9mKGlkKSA6IHVuZGVmaW5lZFxuICByZXR1cm4gbG9jYWxSb3V0ZSh7XG4gICAgaG9zdGVkOiBtYXlUcnlTZWN1cmVOYW1lKCksXG4gICAgaG9zdDogZS5ob3N0LFxuICAgIC8vIFRoZSBhY2NvdW50J3Mgb3duIG5hbWUgZm9yIHRoZSBwcmludGVyLCBlbHNlIHRoZSBvbmUgdGhlIHNlcnZpY2UgZ2l2ZXMgYSBwcmludGVyIGJlc2lkZSB0aGlzIGJyb3dzZXIgKEtBTi01NDU5KTpcbiAgICAvLyBhbiBPcGVuIHByaW50ZXIgaXMgZm9yIGFueW9uZSwgc2lnbmVkIGluIG9yIG5vdC5cbiAgICBzZWN1cmVOYW1lOiBzZWN1cmVOYW1lT2YoZS5jbG91ZCkgPz8gc2VjdXJlTmFtZU9mKHsgc2VjdXJlX25hbWU6IG5lYXJieT8uc2VjdXJlTmFtZSB9KSxcbiAgICBwYWdlSG9zdDogd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLFxuICAgIG1kbnNIb3N0OiBlLmxhbj8ubWRuc0hvc3QgPz8gZS5zYXZlZD8uZmluZChzID0+IHMubWRuc0hvc3QpPy5tZG5zSG9zdCA/PyBtZG5zSG9zdEZyb21OYW1lKGUuY2xvdWQ/Lm5hbWUgPz8gZS5uYW1lKSxcbiAgICBwcmludGVyU2FpZDogcHJpbnRlclNhaWRBZGRyKGUpLFxuICAgIG5lYXJieSxcbiAgICBuZWFyYnlDaGVja2VkOiBkaXNjb3ZlcnlTdGF0ZS5jbG91ZENoZWNrZWQsXG4gICAgYmxvY2tlZEJ5UGFnZTogISFkaXNjb3ZlcnlTdGF0ZS5ibG9ja2VkQnlQYWdlXG4gIH0pXG59XG5cbi8qKiBUaGUgbGluZSB1bmRlciBDb25uZWN0IGxvY2FsbHk6IHdoZXJlIGl0IGdvZXMsIG9yIHdoeSBpdCBjYW5ub3QuICovXG5mdW5jdGlvbiBsb2NhbEhpbnQgKHJvdXRlOiBMb2NhbFJvdXRlLCBlOiBEaXJlY3RvcnlFbnRyeSk6IHN0cmluZyB7XG4gIHN3aXRjaCAocm91dGUua2luZCkge1xuICAgIGNhc2UgJ3NlY3VyZSc6IHJldHVybiAnQ29ubmVjdHMgb24geW91ciBuZXR3b3JrLCBpbiB0aGlzIHRhYidcbiAgICBjYXNlICdwYWdlJzogcmV0dXJuICdOZWVkcyBpdHMgc2VjdXJlIGFkZHJlc3MuIFVzZSBNdW9uM0Qgb3IgQmx1ZXRvb3RoJ1xuICAgIGNhc2UgJ2xhbic6IHJldHVybiBlLmhvc3QgPz8gJydcbiAgICBjYXNlICdub25lJzogcmV0dXJuIHJvdXRlLnJlYXNvblxuICB9XG59XG5cbi8qKiBUaGUgaWQgYSBwcmludGVyIGlzIHJlYWNoZWQgYnkgb3ZlciBhbnkgcm91dGU6IHRoZSBhY2NvdW50J3MsIGVsc2UgdGhlIG9uZSBpdCBwdWJsaXNoZXMuICovXG5mdW5jdGlvbiBpZE9mIChlOiBEaXJlY3RvcnlFbnRyeSk6IHN0cmluZyB8IG51bGwge1xuICByZXR1cm4gZS5jbG91ZD8uaWQgPz8gZS5lbmRwb2ludElkXG59XG5cbi8qKiBUaGUgcm91dGUgdGhlIG9wZW4gc2Vzc2lvbiBmb3IgdGhpcyBwcmludGVyIGlzIG9uIG5vdywgb3IgbnVsbCB3aGVuIGl0IGlzIG5vdCBvcGVuLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpdmVSb3V0ZU9mIChlOiBEaXJlY3RvcnlFbnRyeSk6IFJvdXRlIHwgbnVsbCB7XG4gIGlmIChlLmFjdGl2ZSA9PT0gJ2xvY2FsJykgcmV0dXJuICdsYW4nXG4gIGlmIChlLmFjdGl2ZSAhPT0gJ2Nsb3VkJykgcmV0dXJuIG51bGxcbiAgY29uc3QgaWQgPSBpZE9mKGUpXG4gIHJldHVybiBpZCAmJiBibHVldG9vdGhDYXJyeWluZyhpZCkgPyAnYmxlJyA6ICdjbG91ZCdcbn1cblxuLyoqIFRoZSByb3V0ZXMgdGhpcyBwcmludGVyIG9mZmVyczogdGhlIG9uZXMgaXQgaXMgbm90IG9uLCBvciBhbGwgdGhyZWUgd2hlbiBpdCBpcyBub3Qgb3BlbiAoS0FOLTI0ODcpLiAqL1xuZnVuY3Rpb24gcm91dGVBY3Rpb25zT2YgKGU6IERpcmVjdG9yeUVudHJ5KTogQ2FyZEFjdGlvbltdIHtcbiAgcmV0dXJuIHJvdXRlTWVudUl0ZW1zKHJvdXRlRmFjdHNPZihlKSkubWFwKCh7IGlkLCBsYWJlbCwgaWNvbiwgaGludCwgZGlzYWJsZWQgfSkgPT4gKHsgaWQsIGxhYmVsLCBpY29uLCBoaW50LCBkaXNhYmxlZCB9KSlcbn1cblxuLyoqIFdoYXQgdGhlIHJvdXRlIG1lbnUgbmVlZHMgdG8ga25vdyBhYm91dCB0aGlzIHByaW50ZXIsIGZyb20gdGhlIGxpdmUgc3RhdGUuICovXG5mdW5jdGlvbiByb3V0ZUZhY3RzT2YgKGU6IERpcmVjdG9yeUVudHJ5KTogUm91dGVNZW51RmFjdHMge1xuICBjb25zdCByb3V0ZSA9IGxvY2FsUm91dGVPZihlKVxuICByZXR1cm4ge1xuICAgIG1vZGU6IHJvdXRlTW9kZShpZE9mKGUpKSxcbiAgICBsaXZlOiBsaXZlUm91dGVPZihlKSxcbiAgICBsb2NhbDogeyB1c2FibGU6IHJvdXRlLmtpbmQgPT09ICdzZWN1cmUnIHx8IHJvdXRlLmtpbmQgPT09ICdsYW4nLCBoaW50OiBsb2NhbEhpbnQocm91dGUsIGUpIH0sXG4gICAgY2xvdWQ6IHsgbGlzdGVkOiAhIWUuY2xvdWQsIG9ubGluZTogISFlLmNsb3VkPy5vbmxpbmUgfSxcbiAgICBibGU6IHsgc3VwcG9ydDogbmVhcmJ5U3RhdGUuc3VwcG9ydCwgaGVhcmQ6ICEhZS5uZWFyYnksIGlkZW50aWZpZWQ6ICEhaWRPZihlKSwgd2h5OiB3aHlOb0JsdWV0b290aCgpPy50ZXh0ID8/IG51bGwgfVxuICB9XG59XG5cbi8qKiBQcmludGVycyB3aG9zZSBcIm9wZW5lZCB0aHJvdWdoIE11b24zRFwiIG5vdGljZSBoYXMgYmVlbiBzaG93biBvbiB0aGlzIHBhZ2UgbG9hZC4gKi9cbmNvbnN0IHRvbGRSZWxheSA9IG5ldyBTZXQ8c3RyaW5nPigpXG5cbi8qKiBDb3VudHMgcnVucywgc28gb25lIHRha2VuIG92ZXIgYnkgYSBjaG9zZW4gcm91dGUgZG9lcyBub3QgY2xlYXIgdGhlIHJvdyBvZiB0aGUgb25lIHRoYXQgdG9vayBvdmVyLiAqL1xubGV0IHJ1bkNvdW50ZXIgPSAwXG5cbi8qKlxuICogT3BlbnMgYGVgIHRoZSB3YXkgYHJvdXRlYCBzYXlzLiBgYXV0b2AgaXMgYXV0byBtb2RlJ3Mgb3duIG1vdmUgKHRoZSBiYW5uZXInc1xuICogZmFpbG92ZXIsIG9yIENvbm5lY3QgbG9jYWxseSdzIGZhbGwgYmFjayB0byBNdW9uM0QpOiBpdCBvcGVucyB0aGUgcm91dGUgYnV0XG4gKiByZWNvcmRzIG5vIGNob2ljZSwgc28gbm90aGluZyBiZWNvbWVzIGhlbGQgYW5kIGxhdGVyIHBsYWluIENvbm5lY3RzIGJlaGF2ZSBhc1xuICogYmVmb3JlICgjMzcwKS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gb3Blbk1hbmFnZWRSb3V0ZSAoZTogRGlyZWN0b3J5RW50cnksIHJvdXRlPzogJ3JlbGF5JyB8IEJsZURldmljZSwgYXV0byA9IGZhbHNlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIC8vIEEgcHJpbnRlciBvZmYgdGhlIGFjY291bnQgaGFzIG5vIE11b24zRCByb3V0ZSwgYnV0IEJsdWV0b290aCByZWFjaGVzIGl0IGFzIGFueW9uZSdzIChLQU4tMjQ4NykuXG4gIGNvbnN0IGlkID0gaWRPZihlKVxuICBpZiAoIWlkIHx8ICghZS5jbG91ZCAmJiAoIXJvdXRlIHx8IHJvdXRlID09PSAncmVsYXknKSkpIHJldHVybiBmYWxzZVxuICBpZiAoYXV0byAmJiByb3V0ZU1vZGUoaWQpICE9PSAnYXV0bycpIHJldHVybiBmYWxzZVxuICBpZiAoIXJvdXRlIHx8IHJvdXRlID09PSAncmVsYXknKSB7XG4gICAgaWYgKHJvdXRlID09PSAncmVsYXknICYmICFhdXRvKSBjaG9vc2VSZWxheShpZClcbiAgICBzdG9wVXNpbmdCbHVldG9vdGhGb3IoaWQpXG4gIH0gZWxzZSB7XG4gICAgdXNlQmx1ZXRvb3RoRm9yKGlkLCByb3V0ZSlcbiAgICAvLyBBbm90aGVyIHRyeSBnZXRzIGEgZnJlc2ggbGluazogdGhlIG9sZCBvbmUgY2FuIGxvb2sgb3BlbiB3aGlsZSBpdFxuICAgIC8vIGNhcnJpZXMgbm90aGluZyAoS0FOLTIwODApLCBhbmQgcmV1c2luZyBpdCBkZWFkLWVuZGVkIFwiVHJ5IGFnYWluXCIuXG4gICAgYXdhaXQgcmVsZWFzZUJsdWV0b290aExpbmsoaWQpXG4gICAgaWYgKGF1dG8gJiYgcm91dGVNb2RlKGlkKSAhPT0gJ2F1dG8nKSByZXR1cm4gZmFsc2VcbiAgICByZWNvbm5lY3RCbHVldG9vdGgoaWQpXG4gIH1cbiAgZHJvcENsb3VkQ29ubmVjdGlvbihpZClcbiAgdHJ5IHtcbiAgICBhd2FpdCBhY3RpdmF0ZUNsb3VkUHJpbnRlcihpZClcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAocm91dGUgfHwgZXJyb3IgaW5zdGFuY2VvZiBTd2l0Y2hTdXBlcnNlZGVkIHx8IHJlcXVlc3RSZWZ1c2VkKGVycm9yKSkgdGhyb3cgZXJyb3JcbiAgICBjb25zdCBuZWFyYnkgPSBlLm5lYXJieSA/PyBhd2FpdCBwZXJtaXR0ZWRQcmludGVyRm9yKGlkKVxuICAgIGlmICghbmVhcmJ5KSB0aHJvdyBlcnJvclxuICAgIGlmIChyb3V0ZU1vZGUoaWQpICE9PSAnYXV0bycpIHRocm93IG5ldyBTd2l0Y2hTdXBlcnNlZGVkKClcbiAgICB1c2VCbHVldG9vdGhGb3IoaWQsIG5lYXJieS5kZXZpY2UpXG4gICAgZHJvcENsb3VkQ29ubmVjdGlvbihpZClcbiAgICBhd2FpdCBhY3RpdmF0ZUNsb3VkUHJpbnRlcihpZClcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIEV2ZXJ5IHByaW50ZXIgdGhpcyBicm93c2VyIGtub3dzIG9mLCBhbmQgd2hhdCBjYW4gYmUgZG9uZSB3aXRoIGVhY2g6XG4gKiBvcGVuIGl0IGhlcmUgb3IgdGhyb3VnaCBNdW9uM0QsIGxpbmsgaXQsIGFzayBmb3IgYWNjZXNzLCBzZXQgaXQgdXAsXG4gKiBmb3JnZXQgaXQuIFRoZSBoZWFkZXIncyBzd2l0Y2hlciBhbmQgdGhlIFByaW50ZXJzIHBhZ2UgYm90aCBsaXN0XG4gKiBwcmludGVycyB0aGlzIHdheSwgc28gYSBwcmludGVyIGJlaGF2ZXMgdGhlIHNhbWUgaW4gZWl0aGVyLiBFYWNoIGtlZXBzXG4gKiB0aGUgZGlhbG9ncyB0aGVzZSBvcGVuIGluIGl0cyBvd24gdGVtcGxhdGUuXG4gKi9cbi8qKiBXaGF0IGZvbGxvd3MgYSBCbHVldG9vdGggcGljazogb3BlbiB0aGUgYWNjb3VudCdzIHByaW50ZXIsIHNldCB1cCBhIG5ldyBvbmUsIG9yIHNheSB3aGVyZSBpdCBpcyBsaXN0ZWQuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuYXN5bmMgZnVuY3Rpb24gYWZ0ZXJCbHVldG9vdGhQaWNrICh2bTogYW55LCBoZWFyZDogTmVhcmJ5UHJpbnRlciB8IG51bGwpIHtcbiAgLy8gQSBkaXNtaXNzZWQgY2hvb3NlciBpcyB0aGUgcGVyc29uJ3MgYW5zd2VyOiBzaWxlbnQuIEEgZmFpbGVkIHJlYWQgYWxyZWFkeVxuICAvLyBzaG93cyBpdHMgb3duIG1lc3NhZ2UgKG5lYXJieVN0YXRlLmVycm9yKS5cbiAgaWYgKCFoZWFyZCkgcmV0dXJuXG4gIGlmICghaGVhcmQuZW5kcG9pbnRJZCkge1xuICAgIHZtLm5vdGljZSA9IGBDb3VsZG4ndCB0ZWxsIHdoaWNoIHByaW50ZXIgJHtoZWFyZC5kaXNwbGF5IHx8IGhlYXJkLmxvY2FsTmFtZSB8fCAndGhhdCBkZXZpY2UnfSBpcy4gYCArXG4gICAgICAnTW92ZSBjbG9zZXIgdG8gaXQgYW5kIHRyeSBhZ2Fpbi4nXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgZW50cnkgPSB2bS5kaXJlY3RvcnkuY2xvdWQuZmluZCgoYzogRGlyZWN0b3J5RW50cnkpID0+IGMuY2xvdWQgJiYgaXNQcmludGVyKGhlYXJkLCBjLmNsb3VkLmlkKSlcbiAgaWYgKGVudHJ5KSB7XG4gICAgYXdhaXQgdm0uY29ubmVjdE92ZXJCbHVldG9vdGgoZW50cnksIGhlYXJkKVxuICAgIHJldHVyblxuICB9XG4gIC8vIE5vdCBvbiB0aGlzIGFjY291bnQuIElmIHRoZSBhY2NvdW50J3MgcHJpbnRlcnMgaGF2ZSBub3QgbG9hZGVkLCBpdCBtYXkgYmUgb25lIG9mIHRoZW0uXG4gIGlmICghY2xvdWRTdGF0ZS5yZWFkeSkge1xuICAgIHZtLm5vdGljZSA9ICdZb3VyIHByaW50ZXJzIGFyZSBzdGlsbCBsb2FkaW5nLiBUcnkgQ29ubmVjdCBvdmVyIEJsdWV0b290aCBhZ2FpbiBpbiBhIG1vbWVudC4nXG4gICAgcmV0dXJuXG4gIH1cbiAgLy8gVGhlIG91dC1vZi1ib3ggcGF0aDogYSBwcmludGVyIG5vYm9keSBoYXMgc2V0IHVwIGdvZXMgdG8gaXRzIHNldC11cCAob3IgaXRzIGxpbmspLCBhcyBmcm9tIExvb2sgbmVhcmJ5LlxuICBjb25zdCBuZWFyYnlFbnRyeSA9IHZtLmRpcmVjdG9yeS5mb3VuZC5maW5kKChmOiBEaXJlY3RvcnlFbnRyeSkgPT4gZi5uZWFyYnk/LmRldmljZUlkID09PSBoZWFyZC5kZXZpY2VJZClcbiAgY29uc3Qga25vd24gPSB2bS5kaXJlY3RvcnkubG9jYWwuZmluZCgobDogRGlyZWN0b3J5RW50cnkpID0+IGwubmVhcmJ5Py5kZXZpY2VJZCA9PT0gaGVhcmQuZGV2aWNlSWQpID8/XG4gICAgKG5lYXJieUVudHJ5Py5yb3c/LmFjdGlvbiA9PT0gJ29wZW4nID8gbmVhcmJ5RW50cnkgOiB1bmRlZmluZWQpXG4gIGlmIChrbm93bikge1xuICAgIGF3YWl0IHZtLnBhaXJOZWFyYnlQcmludGVyKGhlYXJkLCBrbm93bi5rZXksIHRydWUpXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKG5lYXJieUVudHJ5KSB7XG4gICAgYXdhaXQgdm0ub3BlbkZvdW5kRW50cnkobmVhcmJ5RW50cnkpXG4gICAgcmV0dXJuXG4gIH1cbiAgdm0ubm90aWNlID0gYCR7aGVhcmQuZGlzcGxheSB8fCBoZWFyZC5sb2NhbE5hbWUgfHwgJ1RoYXQgcHJpbnRlcid9IHdhcyBmb3VuZCBvdmVyIEJsdWV0b290aC4gSXQgaXMgbGlzdGVkIHdpdGggdGhlIHByaW50ZXJzIGZvdW5kIG5lYXJieS5gXG59XG5cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaW50ZXJFbnRyaWVzTWl4aW4gZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBnZXQgZGVsZXRpb25QZW5kaW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZGVsZXRpb25TdGF0ZS5kZWxldGVBZnRlciAhPT0gbnVsbFxuICB9XG5cbiAgaW5zdGFuY2VEaWFsb2dPcGVuID0gZmFsc2VcbiAgYWNjb3VudERpYWxvZyA9IGZhbHNlXG4gIGxpbmtEaWFsb2cgPSBmYWxzZVxuICBsaW5rUHJpbnRlcklkID0gJydcbiAgbGlua0hvc3QgPSAnJ1xuICAvKiogQSBwcmludGVyIHBpY2tlZCBmb3IgbGlua2luZyBiZWZvcmUgc2lnbi1pbi4gKi9cbiAgcGVuZGluZ0xpbms6IERpcmVjdG9yeUVudHJ5IHwgbnVsbCA9IG51bGxcbiAgLyoqIEEgZm91bmQgdGlsZSBvbiBhbiBodHRwcyBwYWdlLCB3YWl0aW5nIGZvciBzaWduLWluIHRvIG9wZW4gdGhyb3VnaCB0aGUgYWNjb3VudC4gKi9cbiAgcGVuZGluZ09wZW46IERpcmVjdG9yeUVudHJ5IHwgbnVsbCA9IG51bGxcbiAgYnVzeUtleTogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgbm90aWNlOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICAvKiogQSByb3V0ZSB0aGUgcGVyc29uIHBpY2tlZCBmYWlsZWQ6IHdoYXQgaGFwcGVuZWQgYW5kIHRoZSBvdGhlciByb3V0ZXMgYXMgYnV0dG9ucyAobm90aGluZyBzd2l0Y2hlcyBieSBpdHNlbGYpLiAqL1xuICByb3V0ZVByb2JsZW06IHsgbGluZTogc3RyaW5nLCBjaG9pY2VzOiBBcnJheTx7IGlkOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcgfT4gfSB8IG51bGwgPSBudWxsXG4gIHJvdXRlUHJvYmxlbUVudHJ5OiBEaXJlY3RvcnlFbnRyeSB8IG51bGwgPSBudWxsXG4gIC8qKiBBdXRvIGZvdW5kIG5vIHdheSBpbjogYXNrIHdoZXRoZXIgdG8gb3BlbiBtdW9uM2QubG9jYWwuICovXG4gIGFza011b25Mb2NhbCA9IGZhbHNlXG4gIC8qKiBBbiBhZGRyZXNzIHRvIHNob3cgYXMgYSBsaW5rIHVuZGVyIHRoZSBub3RpY2UsIHdoZW4gYSBuZXcgdGFiIHdhcyBibG9ja2VkLiAqL1xuICBub3RpY2VMaW5rOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBzZXR1cERpYWxvZyA9IGZhbHNlXG4gIHNldHVwUHJpbnRlcjogTmVhcmJ5UHJpbnRlciB8IG51bGwgPSBudWxsXG4gIC8qKiBcIkFzayBmb3IgYWNjZXNzXCIgdG8gYSBwcmludGVyIG9uIHRoaXMgbmV0d29yayAoQUNDLTE3KS4gKi9cbiAgYWNjZXNzRGlhbG9nID0gZmFsc2VcbiAgYWNjZXNzQ2xpZW50OiBBY2Nlc3NDbGllbnQgfCBudWxsID0gbnVsbFxuICBhY2Nlc3NBc2s6IEFjY2Vzc0FzayB8IG51bGwgPSBudWxsXG4gIGFjY2Vzc05hbWUgPSAnJ1xuXG4gIGdldCBhY2NvdW50ICgpIHtcbiAgICByZXR1cm4gY2xvdWRTdGF0ZS5hY2NvdW50XG4gIH1cblxuICBnZXQgbmVhcmJ5ICgpIHtcbiAgICByZXR1cm4gbmVhcmJ5U3RhdGVcbiAgfVxuXG4gIGdldCBibHVldG9vdGhTZWFyY2ggKCkge1xuICAgIHJldHVybiBuZWFyYnlTdGF0ZS5zdXBwb3J0ID09PSAnc3VwcG9ydGVkJ1xuICB9XG5cbiAgLyoqIFdoeSBCbHVldG9vdGggY2Fubm90IGJlIHVzZWQgaGVyZSwgc2FpZCBwbGFpbmx5LCBvciBudWxsIHdoZW4gaXQgY2FuIChLQU4tNDgwMikuICovXG4gIGdldCBibHVldG9vdGhXaHkgKCk6IEJsdWV0b290aFdoeSB8IG51bGwge1xuICAgIHJldHVybiB3aHlOb0JsdWV0b290aCh1bmRlZmluZWQsIHRoaXMuYmx1ZXRvb3RoT2ZmKVxuICB9XG5cbiAgZ2V0IGJsdWV0b290aE9mZiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYmx1ZXRvb3RoU2VhcmNoICYmIG5lYXJieVN0YXRlLnJhZGlvID09PSAnb2ZmJ1xuICB9XG5cbiAgZ2V0IGFjdGl2YXRpb25FcnJvciAoKSB7XG4gICAgcmV0dXJuIGFjdGl2YXRpb25TdGF0ZS5lcnJvclxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIHRoYXQgcmVmdXNlZCB0aGlzIGJyb3dzZXIgb3ZlciBCbHVldG9vdGg6IENvbnRyb2wgY2FuIHBhaXIgd2l0aCBpdCAoS0FOLTEyNTMpLiAqL1xuICBnZXQgcGFpcmluZ09mZmVyICgpIHtcbiAgICByZXR1cm4gYWN0aXZhdGlvblN0YXRlLnBhaXJpbmdcbiAgfVxuXG4gIHBhaXJUaGlzQnJvd3NlciAoKSB7XG4gICAgaWYgKGFjdGl2YXRpb25TdGF0ZS5wYWlyaW5nKSBzdGFydFBhaXJpbmcoYWN0aXZhdGlvblN0YXRlLnBhaXJpbmcpLmNhdGNoKCgpID0+IHt9KVxuICB9XG5cbiAgZ2V0IGFjdGl2YXRpb25GYWxsYmFjayAoKSB7XG4gICAgcmV0dXJuIGFjdGl2YXRpb25TdGF0ZS5mYWxsYmFja1VybFxuICB9XG5cbiAgZ2V0IHNlYXJjaGluZyAoKSB7XG4gICAgcmV0dXJuIGRpc2NvdmVyeVN0YXRlLnNjYW5uaW5nXG4gIH1cblxuICBnZXQgYmxvY2tlZEJ5UGFnZSAoKSB7XG4gICAgcmV0dXJuIGRpc2NvdmVyeVN0YXRlLmJsb2NrZWRCeVBhZ2VcbiAgfVxuXG4gIGdldCBzY2FuTmV0d29yayAoKSB7XG4gICAgcmV0dXJuIGRpc2NvdmVyeVN0YXRlLm5ldHdvcmtcbiAgfVxuXG4gIGdldCBzYXZlZEluc3RhbmNlcyAoKTogSW5zdGFuY2VDb25maWdbXSB7XG4gICAgY29uc3QgYWxsOiBJbnN0YW5jZUNvbmZpZ1tdID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldEluc3RhbmNlcyddID8/IFtdXG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoaSA9PiBpLmFwaVVybCAhPT0gTUFOQUdFRF9BUElfVVJMKVxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIEZsdWlkZCBpcyBvbiBsb2NhbGx5LCBmcm9tIGl0cyBvd24gc29ja2V0LiAqL1xuICBnZXQgbG9jYWxMaXZlICgpOiBMb2NhbExpdmUgfCBudWxsIHtcbiAgICBpZiAoY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQpIHJldHVybiBudWxsXG4gICAgY29uc3QgYXBpVXJsOiBzdHJpbmcgPSB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsXG4gICAgaWYgKCFhcGlVcmwgfHwgYXBpVXJsID09PSBNQU5BR0VEX0FQSV9VUkwpIHJldHVybiBudWxsXG4gICAgbGV0IGhlYWx0aDogUHJpbnRlckhlYWx0aFxuICAgIGlmICghdGhpcy5zb2NrZXRDb25uZWN0ZWQpIGhlYWx0aCA9ICdjb25uZWN0aW5nJ1xuICAgIGVsc2UgaWYgKCF0aGlzLmF1dGhlbnRpY2F0ZWQpIGhlYWx0aCA9ICdsb2NrZWQnXG4gICAgZWxzZSBpZiAoIXRoaXMua2xpcHB5UmVhZHkpIGhlYWx0aCA9ICdlcnJvcidcbiAgICBlbHNlIGlmICh0aGlzLnByaW50ZXJQcmludGluZykgaGVhbHRoID0gJ3ByaW50aW5nJ1xuICAgIGVsc2UgaWYgKHRoaXMucHJpbnRlclBhdXNlZCkgaGVhbHRoID0gJ3BhdXNlZCdcbiAgICBlbHNlIGhlYWx0aCA9ICdvbmxpbmUnXG4gICAgcmV0dXJuIHsgYXBpVXJsLCBoZWFsdGgsIGRldGFpbDogdGhpcy5sb2NhbERldGFpbChoZWFsdGgpIH1cbiAgfVxuXG4gIGxvY2FsRGV0YWlsIChoZWFsdGg6IFByaW50ZXJIZWFsdGgpOiBzdHJpbmcge1xuICAgIGlmIChoZWFsdGggPT09ICdjb25uZWN0aW5nJykgcmV0dXJuICdDb25uZWN0aW5n4oCmJ1xuICAgIGlmIChoZWFsdGggPT09ICdsb2NrZWQnKSByZXR1cm4gJ1dhaXRpbmcgZm9yIHNpZ24taW4nXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLiRmaWx0ZXJzLnByZXR0eUNhc2UodGhpcy5wcmludGVyU3RhdGUgfHwgJ3Vua25vd24nKVxuICAgIGlmICh0aGlzLnByaW50ZXJQcmludGluZyB8fCB0aGlzLnByaW50ZXJQYXVzZWQpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gTWF0aC5mbG9vcigodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludFByb2dyZXNzJ10gPz8gMCkgKiAxMDApXG4gICAgICByZXR1cm4gYCR7c3RhdGV9IMK3ICR7cHJvZ3Jlc3N9JWBcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlXG4gIH1cblxuICBnZXQgZGlyZWN0b3J5ICgpOiBEaXJlY3Rvcnkge1xuICAgIHJldHVybiBwcmludGVyRGlyZWN0b3J5KHtcbiAgICAgIGFjY291bnQ6IHRoaXMuYWNjb3VudCAmJiAhdGhpcy5kZWxldGlvblBlbmRpbmcgPyBjbG91ZFN0YXRlLnByaW50ZXJzIDogW10sXG4gICAgICBzdGF0dXM6IGNsb3VkU3RhdGUuc3RhdHVzLFxuICAgICAgZW1haWw6IHRoaXMuYWNjb3VudD8uZW1haWwgPz8gbnVsbCxcbiAgICAgIHNhdmVkOiB0aGlzLnNhdmVkSW5zdGFuY2VzLFxuICAgICAgZm91bmQ6IGRpc2NvdmVyeVN0YXRlLmZvdW5kLFxuICAgICAgY2xvdWROZWFyYnk6IGRpc2NvdmVyeVN0YXRlLmNsb3VkLFxuICAgICAgbmVhcmJ5OiBuZWFyYnlTdGF0ZS5wcmludGVycyxcbiAgICAgIG5vdzogbmVhcmJ5U3RhdGUubm93LFxuICAgICAgYWN0aXZlQ2xvdWRJZDogY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQsXG4gICAgICB2aWFCbHVldG9vdGg6IGJsdWV0b290aENhcnJ5aW5nLFxuICAgICAgbG9jYWw6IHRoaXMubG9jYWxMaXZlLFxuICAgICAgc2VhcmNoaW5nOiBkaXNjb3ZlcnlTdGF0ZS5zY2FubmluZyB8fCAhZGlzY292ZXJ5U3RhdGUuZmluaXNoZWRBdFxuICAgIH0pXG4gIH1cblxuICByZXNjYW4gKCkge1xuICAgIHRoaXMubm90aWNlID0gbnVsbFxuICAgIGRpc2NvdmVyeVN0YXRlLmNsb3VkQ2hlY2tlZCA9IGZhbHNlXG4gICAgZGlzY292ZXJQcmludGVycyh0cnVlKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIGFzeW5jIG9uTG9va05lYXJieSAoKSB7XG4gICAgdGhpcy5ub3RpY2UgPSBudWxsXG4gICAgYXdhaXQgbG9va05lYXJieSgpXG4gIH1cblxuICAvKipcbiAgICogVGhlIGJpZyBDb25uZWN0IG92ZXIgQmx1ZXRvb3RoIGJ1dHRvbiAoS0FOLTI0NzApOiB0aGUgY2hvb3NlciBsaXN0cyBvbmx5XG4gICAqIE11b24gcHJpbnRlcnMuIEEgcHJpbnRlciBhbHJlYWR5IG9uIHRoZSBhY2NvdW50IGlzIG9wZW5lZCBvdmVyIEJsdWV0b290aDtcbiAgICogYSBuZXcgb25lIGlzIG5vdyBpbiB0aGUgQmx1ZXRvb3RoIGxpc3QgKExvb2sgbmVhcmJ5J3Mgb3duIHJlc3VsdCksIHJlYWR5XG4gICAqIHRvIGJlIHNldCB1cCBvciBwYWlyZWQuIEEgZGlzbWlzc2VkIGNob29zZXIgZG9lcyBub3RoaW5nLlxuICAgKi9cbiAgYXN5bmMgb25Db25uZWN0T3ZlckJsdWV0b290aCAoKSB7XG4gICAgdGhpcy5ub3RpY2UgPSBudWxsXG4gICAgYXdhaXQgYWZ0ZXJCbHVldG9vdGhQaWNrKHRoaXMsIGF3YWl0IGxvb2tOZWFyYnkoKSlcbiAgfVxuXG4gIC8qKiBUaGUgUHJpbnRlcnMgcGFnZSdzIFwiU2NhbiBmb3IgcHJpbnRlcnNcIiAoS0FOLTU0MDkpOiBvbmUgY2xpY2sgcnVucyBldmVyeSBzb3VyY2U7IGEgcHJpbnRlciBwaWNrZWQgb3ZlciBCbHVldG9vdGggaXMgdGhlbiBvcGVuZWQgYXMgZXZlci4gKi9cbiAgZ2V0IHNjYW5CdXN5ICgpIHtcbiAgICByZXR1cm4gc2NhblN0YXRlLnBoYXNlID09PSAnc2Nhbm5pbmcnXG4gIH1cblxuICBhc3luYyBvblNjYW4gKCkge1xuICAgIHRoaXMubm90aWNlID0gbnVsbFxuICAgIC8vIFN0cmFpZ2h0IGZyb20gdGhlIGNsaWNrOiB0aGUgQmx1ZXRvb3RoIGNob29zZXIgbmVlZHMgdGhlIGdlc3R1cmUuXG4gICAgYXdhaXQgYWZ0ZXJCbHVldG9vdGhQaWNrKHRoaXMsIGF3YWl0IHNjYW5Gb3JQcmludGVycygpKVxuICB9XG5cbiAgLy8gLS0gd2hhdCBlYWNoIHByaW50ZXIgb2ZmZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogSG93IENvbm5lY3QgbG9jYWxseSB3b3VsZCByZWFjaCB0aGlzIHByaW50ZXIgZnJvbSB0aGlzIHBhZ2UgKEtBTi0yNTI5KS4gKi9cbiAgbG9jYWxSb3V0ZUZvciAoZTogRGlyZWN0b3J5RW50cnkpOiBMb2NhbFJvdXRlIHtcbiAgICByZXR1cm4gbG9jYWxSb3V0ZU9mKGUpXG4gIH1cblxuICBjbG91ZEFjdGlvbnMgKGU6IERpcmVjdG9yeUVudHJ5KTogQ2FyZEFjdGlvbltdIHtcbiAgICBjb25zdCBhY3Rpb25zOiBDYXJkQWN0aW9uW10gPSByb3V0ZUFjdGlvbnNPZihlKVxuICAgIGlmIChlLmNsb3VkICYmIGJsZVJldHJ5U3RhdGUuc3RvcHBlZFtlLmNsb3VkLmlkXSkge1xuICAgICAgYWN0aW9ucy5wdXNoKHsgaWQ6ICdyZXRyeS1ibHVldG9vdGgnLCBsYWJlbDogJ1JldHJ5IEJsdWV0b290aCcsIGljb246ICckYmx1ZXRvb3RoJywgaGludDogYmxlUmV0cnlTdGF0ZS5zdG9wcGVkW2UuY2xvdWQuaWRdIH0pXG4gICAgfVxuICAgIGFjdGlvbnMucHVzaCh7XG4gICAgICBpZDogJ2FjY2VzcycsXG4gICAgICBsYWJlbDogJ0FjY2VzcyBhbmQgcHJvdGVjdGlvbicsXG4gICAgICBpY29uOiAnJHByaW50ZXJBY2Nlc3MnLFxuICAgICAgaGludDogZS5hY3RpdmUgPyB1bmRlZmluZWQgOiAnT3BlbnMgdGhlIHByaW50ZXIgZmlyc3QnXG4gICAgfSlcbiAgICByZXR1cm4gYWN0aW9uc1xuICB9XG5cbiAgLyoqIFNvbWVvbmUgZWxzZSdzIHByaW50ZXIsIG9yIG9uZSB0aGF0IHJlZnVzZWQgdGhpcyBicm93c2VyOiBhc2sgaXRzIHBhbmVsIHRvIGxldCB0aGlzIGJyb3dzZXIgaW4uICovXG4gIGFza0FjdGlvbiAoZTogRGlyZWN0b3J5RW50cnkpOiBDYXJkQWN0aW9uIHwgbnVsbCB7XG4gICAgLy8gQW4gT3BlbiBwcmludGVyIChELTE2NikgbGV0cyBhbnlvbmUgaW46IHRoZXJlIGlzIG5vdGhpbmcgdG8gYXNrIGZvci5cbiAgICBpZiAoZS5sYW4/LmVudHJ5ID09PSAnb3BlbicpIHJldHVybiBudWxsXG4gICAgaWYgKGUubGlua2VkVG8gIT09ICdvdGhlcicgJiYgZS5oZWFsdGggIT09ICdsb2NrZWQnKSByZXR1cm4gbnVsbFxuICAgIHJldHVybiB7XG4gICAgICBpZDogJ2FzaycsXG4gICAgICBsYWJlbDogJ0FzayBmb3IgYWNjZXNzJyxcbiAgICAgIGljb246ICckcHJpbnRlckFzaycsXG4gICAgICBoaW50OiBlLmxpbmtlZFRvID09PSAnb3RoZXInID8gJ0xpbmtlZCB0byBhbm90aGVyIGFjY291bnQnIDogJ0l0IHdhbnRzIGFjY2VzcycsXG4gICAgICBkaXNhYmxlZDogIWUuaG9zdFxuICAgIH1cbiAgfVxuXG4gIGxvY2FsQWN0aW9ucyAoZTogRGlyZWN0b3J5RW50cnkpOiBDYXJkQWN0aW9uW10ge1xuICAgIGNvbnN0IGFjdGlvbnM6IENhcmRBY3Rpb25bXSA9IFtdXG4gICAgY29uc3QgYXNrID0gdGhpcy5hc2tBY3Rpb24oZSlcbiAgICBpZiAoYXNrKSB7XG4gICAgICBhY3Rpb25zLnB1c2goYXNrKVxuICAgIH0gZWxzZSBpZiAoZS5saW5rZWRUbyAhPT0gJ21pbmUnKSB7XG4gICAgICBhY3Rpb25zLnB1c2goeyBpZDogJ2xpbmsnLCBsYWJlbDogJ0xpbmsgdG8gbXkgYWNjb3VudCcsIGljb246ICckbGlua1ByaW50ZXInLCBkaXNhYmxlZDogIWUuaG9zdCwgaGludDogZS5ob3N0ID8gdW5kZWZpbmVkIDogJ05vdCBmb3VuZCBvbiB0aGlzIG5ldHdvcmsnIH0pXG4gICAgfVxuICAgIC8vIEFueSByb3V0ZSBhbnlvbmUgY2FuIHJlYWNoIHRoZSBwcmludGVyIGJ5IChLQU4tMjQ4Nyk6IHRoZSBhY2NvdW50IG9ubHkgZGVjaWRlcyB0aGUgTXVvbjNEIG9uZS5cbiAgICBhY3Rpb25zLnB1c2goLi4ucm91dGVBY3Rpb25zT2YoZSkpXG4gICAgaWYgKGUuYWN0aXZlKSB7XG4gICAgICBhY3Rpb25zLnB1c2goeyBpZDogJ2FjY2VzcycsIGxhYmVsOiAnQWNjZXNzIGFuZCBwcm90ZWN0aW9uJywgaWNvbjogJyRwcmludGVyQWNjZXNzJyB9KVxuICAgIH1cbiAgICBhY3Rpb25zLnB1c2goe1xuICAgICAgaWQ6ICdyZW1vdmUnLFxuICAgICAgbGFiZWw6ICdSZW1vdmUnLFxuICAgICAgaWNvbjogJyRwcmludGVyUmVtb3ZlJyxcbiAgICAgIGRhbmdlcjogdHJ1ZSxcbiAgICAgIGRpc2FibGVkOiAhIWUuYWN0aXZlLFxuICAgICAgaGludDogZS5hY3RpdmUgPyAnQ29ubmVjdCB0byBhbm90aGVyIHByaW50ZXIgZmlyc3QnIDogdW5kZWZpbmVkXG4gICAgfSlcbiAgICByZXR1cm4gYWN0aW9uc1xuICB9XG5cbiAgZm91bmRBY3Rpb25zIChlOiBEaXJlY3RvcnlFbnRyeSk6IENhcmRBY3Rpb25bXSB7XG4gICAgY29uc3QgYWN0aW9uczogQ2FyZEFjdGlvbltdID0gW11cbiAgICBpZiAoZS5yb3c/LmFjdGlvbiA9PT0gJ29wZW4nKSBhY3Rpb25zLnB1c2goeyBpZDogJ2Nvbm5lY3QnLCBsYWJlbDogJ0Nvbm5lY3QnLCBpY29uOiAnJGxhbicsIGRpc2FibGVkOiAhZS5ob3N0IH0pXG4gICAgaWYgKGUucm93Py5jYW5MaW5rKSBhY3Rpb25zLnB1c2goeyBpZDogJ2xpbmsnLCBsYWJlbDogJ0xpbmsgdG8gbXkgYWNjb3VudCcsIGljb246ICckbGlua1ByaW50ZXInIH0pXG4gICAgY29uc3QgYXNrID0gdGhpcy5hc2tBY3Rpb24oZSlcbiAgICBpZiAoYXNrKSBhY3Rpb25zLnB1c2goYXNrKVxuICAgIC8vIEJsdWV0b290aCBpcyB0aGUgb3V0LW9mLWJveCB3YXkgaW4gdG8gYSBwcmludGVyIG5vYm9keSBvd25zLCBvciBvbmUgdGhhdCBpcyBzb21lb25lIGVsc2UncyAoS0FOLTI0ODcsIEktMjg1KS5cbiAgICBjb25zdCBibHVldG9vdGggPSByb3V0ZUFjdGlvbnNPZihlKS5maW5kKGEgPT4gYS5pZCA9PT0gJ2Nvbm5lY3QtYmx1ZXRvb3RoJylcbiAgICBpZiAoYmx1ZXRvb3RoICYmIChlLm5lYXJieSB8fCBlLmVuZHBvaW50SWQpKSBhY3Rpb25zLnB1c2goYmx1ZXRvb3RoKVxuICAgIHJldHVybiBhY3Rpb25zXG4gIH1cblxuICBhY3Rpb25zRm9yIChlOiBEaXJlY3RvcnlFbnRyeSk6IENhcmRBY3Rpb25bXSB7XG4gICAgaWYgKGUuc2VjdGlvbiA9PT0gJ2Nsb3VkJykgcmV0dXJuIHRoaXMuY2xvdWRBY3Rpb25zKGUpXG4gICAgaWYgKGUuc2VjdGlvbiA9PT0gJ2xvY2FsJykgcmV0dXJuIHRoaXMubG9jYWxBY3Rpb25zKGUpXG4gICAgcmV0dXJuIHRoaXMuZm91bmRBY3Rpb25zKGUpXG4gIH1cblxuICBhc3luYyBvbkFjdGlvbiAoZTogRGlyZWN0b3J5RW50cnksIGlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLm5vdGljZSA9IG51bGxcbiAgICB0aGlzLm5vdGljZUxpbmsgPSBudWxsXG4gICAgdGhpcy5yb3V0ZVByb2JsZW0gPSBudWxsXG4gICAgdGhpcy5hc2tNdW9uTG9jYWwgPSBmYWxzZVxuICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgIGNhc2UgJ2Nvbm5lY3QtbG9jYWwnOiByZXR1cm4gdGhpcy5jb25uZWN0TG9jYWwoZSlcbiAgICAgIGNhc2UgJ2Nvbm5lY3QtY2xvdWQnOiByZXR1cm4gdGhpcy5jb25uZWN0Q2xvdWQoZSwgJ3JlbGF5JylcbiAgICAgIGNhc2UgJ3JldHJ5LWJsdWV0b290aCc6XG4gICAgICBjYXNlICdjb25uZWN0LWJsdWV0b290aCc6XG4gICAgICAgIGlmICghaWRPZihlKSkgcmV0dXJuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RPdmVyQmx1ZXRvb3RoKGUpXG4gICAgICBjYXNlICdjb25uZWN0JzogcmV0dXJuIHRoaXMub3BlbkZvdW5kRW50cnkoZSlcbiAgICAgIGNhc2UgJ3BhaXItYmx1ZXRvb3RoJzogcmV0dXJuIHRoaXMucGFpck5lYXJieShlLCB0cnVlKVxuICAgICAgY2FzZSAnbGluayc6IHJldHVybiB0aGlzLmxpbmsoZSlcbiAgICAgIGNhc2UgJ3JlbW92ZSc6IHJldHVybiB0aGlzLnJlbW92ZShlKVxuICAgICAgY2FzZSAnYWNjZXNzJzogcmV0dXJuIHRoaXMub3BlbkFjY2VzcyhlKVxuICAgICAgY2FzZSAnYXNrJzogcmV0dXJuIHRoaXMuYXNrRm9yQWNjZXNzKGUpXG4gICAgfVxuICB9XG5cbiAgLy8gLS0gb3BlbmluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQWZ0ZXIgYSBwcmludGVyIG9wZW5lZCBmcm9tIGhlcmUuIFRoZSBzd2l0Y2hlciBjbG9zZXM7IHRoZSBQcmludGVycyBwYWdlIGdvZXMgdG8gdGhlIHByaW50ZXIuICovXG4gIGFmdGVyT3BlbiAoKSB7XG4gICAgdGhpcy4kZW1pdCgnY2xpY2snKVxuICB9XG5cbiAgLyoqXG4gICAqIGBzdXBlcnNlZGVgIGlzIGEgY2hvc2VuIHdheSBpbiAoSS0xMzMpOiBDb25uZWN0IG92ZXIgQmx1ZXRvb3RoLCBvciBiYWNrIHRvXG4gICAqIE11b24zRC4gSXQgdGFrZXMgb3ZlciBmcm9tIGFuIG9wZW4gYWxyZWFkeSBpbiBmbGlnaHQgKGFjdGl2YXRlQ2xvdWRQcmludGVyXG4gICAqIHN1cGVyc2VkZXMgdGhlIGVhcmxpZXIgZGlhbCkgaW5zdGVhZCBvZiBoaXR0aW5nIHRoZSBidXN5IGd1YXJkLlxuICAgKi9cbiAgYXN5bmMgcnVuIChrZXk6IHN0cmluZywgd29yazogKCkgPT4gUHJvbWlzZTxib29sZWFuPiwgc3VwZXJzZWRlID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5idXN5S2V5ICYmICFzdXBlcnNlZGUpIHtcbiAgICAgIC8vIEtBTi0xMjc5OiB0aGlzIHVzZWQgdG8gcmV0dXJuIHdpdGhvdXQgYSB3b3JkLCBzbyBhIHJvdyB3aG9zZSBlYXJsaWVyXG4gICAgICAvLyBvcGVuIG5ldmVyIHNldHRsZWQgbG9va2VkIGRlYWQ6IG5vIHNwaW5uZXIgY2hhbmdlLCBub3RoaW5nIGxvZ2dlZC5cbiAgICAgIGNvbnNvbGEud2FybihgSWdub3JlZCBhIGNsaWNrIG9uICR7a2V5fTogc3RpbGwgb3BlbmluZyAke3RoaXMuYnVzeUtleX1gKVxuICAgICAgdGhpcy5ub3RpY2UgPSAnU3RpbGwgb3BlbmluZyBhIHByaW50ZXIuIEdpdmUgaXQgYSBtb21lbnQsIG9yIHJlbG9hZCB0aGUgcGFnZSBpZiBpdCBzdGF5cyBzdHVjay4nXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgbWluZSA9ICsrcnVuQ291bnRlclxuICAgIHRoaXMuYnVzeUtleSA9IGtleVxuICAgIGxldCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCB1bmRlZmluZWRcbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3V0Y29tZSA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgIHdvcmsoKSxcbiAgICAgICAgbmV3IFByb21pc2U8bmV2ZXI+KChfcmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgUnVuVGltZW91dCgpKSwgUlVOX1RJTUVPVVRfTVMpXG4gICAgICAgIH0pXG4gICAgICBdKVxuICAgICAgaWYgKG91dGNvbWUpIHRoaXMuYWZ0ZXJPcGVuKClcbiAgICAgIHJldHVybiBvdXRjb21lXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFJ1blRpbWVvdXQpIHtcbiAgICAgICAgLy8gV2hhdGV2ZXIgdGhlIG9wZW4gd2FzIHdhaXRpbmcgb24gbmV2ZXIgYW5zd2VyZWQ6IGZyZWUgdGhlIHJvdy5cbiAgICAgICAgY29uc29sYS53YXJuKGBPcGVuaW5nICR7a2V5fSB0b29rIGxvbmdlciB0aGFuICR7UlVOX1RJTUVPVVRfTVMgLyAxMDAwfSBzZWNvbmRzOyBnYXZlIHVwYClcbiAgICAgICAgYWN0aXZhdGlvblN0YXRlLmVycm9yID0gXCJUaGUgcHJpbnRlciBkaWRuJ3Qgb3BlbiBpbiB0aW1lLiBDaGVjayB0aGF0IGl0J3Mgb24gYW5kIG9ubGluZSwgdGhlbiB0cnkgYWdhaW4uXCJcbiAgICAgIH1cbiAgICAgIC8vIE90aGVyd2lzZSBhY3RpdmF0aW9uU3RhdGUgaG9sZHMgdGhlIHJlYXNvbi5cbiAgICAgIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIFN3aXRjaFN1cGVyc2VkZWQgPyB1bmRlZmluZWQgOiBmYWxzZVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpXG4gICAgICAvLyBBIHJ1biB0aGF0IHdhcyB0YWtlbiBvdmVyIGxlYXZlcyB0aGUgcm93IHRvIHRoZSBydW4gdGhhdCB0b29rIG92ZXIuXG4gICAgICBpZiAobWluZSA9PT0gcnVuQ291bnRlcikgdGhpcy5idXN5S2V5ID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIC8qKiBDYW5jZWwgb24gYSBCbHVldG9vdGggY29ubmVjdCBpbiBmbGlnaHQ6IHRoZSBvcGVuIGlzIHJlcGxhY2VkLCB0aGUgbGluayBkcm9wcGVkLCB0aGUgcm93IGZyZWVkLiAqL1xuICBjYW5jZWxPcGVuIChlOiBEaXJlY3RvcnlFbnRyeSkge1xuICAgIGNvbnN0IGlkID0gaWRPZihlKVxuICAgIGNhbmNlbEFjdGl2YXRpb24oKVxuICAgIGlmIChpZCkge1xuICAgICAgc3RvcFVzaW5nQmx1ZXRvb3RoRm9yKGlkKVxuICAgICAgcmVsZWFzZUJsdWV0b290aExpbmsoaWQpLmNhdGNoKCgpID0+IHt9KVxuICAgIH1cbiAgICArK3J1bkNvdW50ZXJcbiAgICB0aGlzLmJ1c3lLZXkgPSBudWxsXG4gIH1cblxuICAvKiogT3BlbnMgYW55IHByaW50ZXIgdGhlIHdheSBpdHMgZ3JvdXAgZG9lczogdGhlIGFjY291bnQncywgYSBzYXZlZCBvbmUsIG9yIG9uZSBmb3VuZCBoZXJlLiAqL1xuICBvcGVuRW50cnkgKGU6IERpcmVjdG9yeUVudHJ5KSB7XG4gICAgaWYgKGUuc2VjdGlvbiA9PT0gJ2Nsb3VkJykgcmV0dXJuIHRoaXMub3BlbkNsb3VkRW50cnkoZSlcbiAgICBpZiAoZS5zZWN0aW9uID09PSAnbG9jYWwnKSByZXR1cm4gdGhpcy5vcGVuTG9jYWxFbnRyeShlKVxuICAgIHJldHVybiB0aGlzLm9wZW5Gb3VuZEVudHJ5KGUpXG4gIH1cblxuICAvKipcbiAgICogVGhlIHdob2xlIEJsdWV0b290aCB3YXkgaW4gZnJvbSBvbmUgbWVudSBpdGVtIChJLTEzMSk6IHRoZSBkZXZpY2UgYWxyZWFkeVxuICAgKiBoZWFyZCwgZWxzZSBvbmUgdGhpcyBicm93c2VyIG1heSBhbHJlYWR5IHVzZSwgZWxzZSB0aGUgY2hvb3NlcjsgdGhlbiB0aGVcbiAgICogbGluayBhbmQgdGhlIGNvbm5lY3QuIEEgcHJpbnRlciB0aGF0IHJlZnVzZXMgdGhpcyBicm93c2VyIGFzIGEgc3RyYW5nZXJcbiAgICogZ29lcyBzdHJhaWdodCBpbnRvIHBhaXJpbmcsIGFuZCB0aGUgY29ubmVjdCBjb250aW51ZXMgb25jZSBwYWlyZWQuXG4gICAqL1xuICBhc3luYyBjb25uZWN0T3ZlckJsdWV0b290aCAoZTogRGlyZWN0b3J5RW50cnksIGNob3Nlbj86IE5lYXJieVByaW50ZXIsIGF1dG8gPSBmYWxzZSkge1xuICAgIGNvbnN0IGlkID0gaWRPZihlKVxuICAgIGlmICghaWQpIHJldHVyblxuICAgIGxldCBoZWFyZCA9IGNob3NlbiA/PyBlLm5lYXJieSA/PyBhd2FpdCBwZXJtaXR0ZWRQcmludGVyRm9yKGlkKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgIGlmICghaGVhcmQpIHtcbiAgICAgIC8vIEtBTi0zNTg5OiB0aGUgc2FtZSBjaG9vc2VyIGFzIHRoZSB0b3AtcmlnaHQgQmx1ZXRvb3RoIGJ1dHRvbiAoZXZlcnkgTXVvbiBwcmludGVyKS4gVGhlIGZpbHRlciBidWlsdFxuICAgICAgLy8gZnJvbSB0aGlzIHByaW50ZXIncyBFbmRwb2ludElkIChvciByZW1lbWJlcmVkIG5hbWUpIG1hdGNoZWQgbm90aGluZyBpbiBDaHJvbWU6IFwiTm8gY29tcGF0aWJsZVxuICAgICAgLy8gZGV2aWNlcyBmb3VuZFwiLiBUaGUgcGljayBpcyBjaGVja2VkIGFnYWluc3QgdGhpcyBwcmludGVyIGJlbG93LlxuICAgICAgaGVhcmQgPSBhd2FpdCBsb29rTmVhcmJ5KClcbiAgICAgIGlmICghaGVhcmQpIHJldHVyblxuICAgICAgLy8gQSBkZXZpY2UgdGhhdCBuYW1lcyBubyBwcmludGVyIChubyBFbmRwb2ludElkLCBubyBhZHZlcnRpc2VtZW50KSBpcyBub3QgdGhpcyBvbmUgZWl0aGVyLlxuICAgICAgaWYgKCFpc1ByaW50ZXIoaGVhcmQsIGlkKSkge1xuICAgICAgICB0aGlzLm5vdGljZSA9IGBUaGF0IGRldmljZSBpc24ndCAke2UubmFtZX0uIENob29zZSAke2UubmFtZX0gaW4gdGhlIEJsdWV0b290aCBsaXN0LmBcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghY2xvdWRTdGF0ZS5wcmludGVycy5zb21lKHAgPT4gcC5pZCA9PT0gaWQpKSByZW1lbWJlckJsdWV0b290aE9ubHkoaWQsIGhlYXJkLmRpc3BsYXkgfHwgaGVhcmQubG9jYWxOYW1lIHx8IGUubmFtZSlcbiAgICByZXRyeUJsdWV0b290aChpZClcbiAgICBjb25zdCBvcGVuZWQgPSBhd2FpdCB0aGlzLmNvbm5lY3RDbG91ZChlLCBoZWFyZC5kZXZpY2UsIGF1dG8pXG4gICAgaWYgKGFjdGl2YXRpb25TdGF0ZS5wYWlyaW5nID09PSBpZCkge1xuICAgICAgLy8gVGhlIHByaW50ZXIgd291bGQgbm90IGhvbGQgdGhpcyBicm93c2VyIGZvciBBY2NlcHQgb3IgUmVqZWN0OiB0aGUgY29kZSBpcyB0aGUgd2F5IGluLCBzbyB0aGUgd2FpdCdzIG91dGNvbWUgZ29lcy5cbiAgICAgIGFjdGl2YXRpb25TdGF0ZS5hcHByb3ZhbCA9IG51bGxcbiAgICAgIGF3YWl0IHN0YXJ0UGFpcmluZyhpZClcbiAgICB9XG4gICAgcmV0dXJuIG9wZW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJpbnRlciBoZWFyZCBvdmVyIEJsdWV0b290aCB0aGF0IGlzIHNldCB1cCBhbmQgbm90IG9uIHRoaXMgYWNjb3VudCAob3JcbiAgICogd2l0aCBub2JvZHkgc2lnbmVkIGluKTogb3BlbiBpdCBvdmVyIEJsdWV0b290aCwgd2hpY2ggbmVlZHMgbm8gYWNjb3VudC4gT25lXG4gICAqIHRoaXMgYnJvd3NlciB3YXMgcGFpcmVkIHdpdGggb3BlbnM7IG9uZSB0aGF0IGRvZXMgbm90IGtub3cgdGhpcyBicm93c2VyIHlldFxuICAgKiBnb2VzIHN0cmFpZ2h0IGludG8gcGFpcmluZyAodGhlIGNvZGUgb24gaXRzIHNjcmVlbiksIGFzIGZyb20gYSBtZW51LlxuICAgKi9cbiAgYXN5bmMgcGFpck5lYXJieSAoZTogRGlyZWN0b3J5RW50cnksIGhvbGQgPSBmYWxzZSkge1xuICAgIGF3YWl0IHRoaXMucGFpck5lYXJieVByaW50ZXIoZS5yb3c/Lm5lYXJieSA/PyBlLm5lYXJieSA/PyBudWxsLCBlLmtleSwgaG9sZClcbiAgfVxuXG4gIC8qKlxuICAgKiBgaG9sZGAgaXMgdHJ1ZSBvbmx5IGZyb20gdGhlIGV4cGxpY2l0IFBhaXIgb3ZlciBCbHVldG9vdGggYnV0dG9uLCB3aGljaFxuICAgKiBrZWVwcyB0aGUgQmx1ZXRvb3RoIHJvdXRlLiBBbiBhdXRvbWF0aWMgb3BlbiAoYSBjbGljayBvbiB0aGUgdGlsZSkgcmVjb3Jkc1xuICAgKiBubyBoZWxkIHJvdXRlLlxuICAgKi9cbiAgYXN5bmMgcGFpck5lYXJieVByaW50ZXIgKGhlYXJkOiBOZWFyYnlQcmludGVyIHwgbnVsbCwga2V5ID0gYGJsZToke2hlYXJkPy5kZXZpY2VJZH1gLCBob2xkID0gZmFsc2UpIHtcbiAgICBjb25zdCBpZCA9IGhlYXJkPy5lbmRwb2ludElkXG4gICAgaWYgKCFoZWFyZCB8fCAhaWQpIHJldHVyblxuICAgIHRoaXMubm90aWNlID0gbnVsbFxuICAgIGNob29zZVJvdXRlTW9kZShpZCwgaG9sZCA/ICdibGUnIDogJ2F1dG8nKVxuICAgIC8vIFRoZSBhY2NvdW50IG1heSBub3QgaG9sZCBpdCAobm9ib2R5IHNpZ25lZCBpbik6IGl0IHN0aWxsIG5lZWRzIGEgbmFtZSBmb3IgaXRzIHBhZ2UuXG4gICAgaWYgKCFjbG91ZFN0YXRlLnByaW50ZXJzLnNvbWUocCA9PiBwLmlkID09PSBpZCkpIHJlbWVtYmVyQmx1ZXRvb3RoT25seShpZCwgaGVhcmQuZGlzcGxheSB8fCBoZWFyZC5sb2NhbE5hbWUgfHwgaWQuc2xpY2UoMCwgOCkpXG4gICAgYXdhaXQgdGhpcy5ydW4oa2V5LCBhc3luYyAoKSA9PiB7XG4gICAgICB1c2VCbHVldG9vdGhGb3IoaWQsIGhlYXJkLmRldmljZSlcbiAgICAgIGF3YWl0IHJlbGVhc2VCbHVldG9vdGhMaW5rKGlkKVxuICAgICAgcmVjb25uZWN0Qmx1ZXRvb3RoKGlkKVxuICAgICAgZHJvcENsb3VkQ29ubmVjdGlvbihpZClcbiAgICAgIGF3YWl0IGFjdGl2YXRlQ2xvdWRQcmludGVyKGlkKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LCB0cnVlKVxuICAgIGlmIChhY3RpdmF0aW9uU3RhdGUucGFpcmluZyA9PT0gaWQpIGF3YWl0IHN0YXJ0UGFpcmluZyhpZClcbiAgfVxuXG4gIGFzeW5jIG9wZW5DbG91ZEVudHJ5IChlOiBEaXJlY3RvcnlFbnRyeSkge1xuICAgIC8vIEtBTi0xMjc5OiBgYWN0aXZlYCBvbmx5IHNheXMgdGhpcyBwcmludGVyIHdhcyBjaG9zZW4uIFdpdGggaXRzIHNvY2tldCBub3RcbiAgICAvLyBvcGVuIGFuZCByZWFkeSB0aGUgcGFnZSBpcyBlbXB0eSwgYW5kIGdvaW5nIHRvIGl0IGFnYWluIGRpZCBub3RoaW5nLlxuICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuJHN0b3JlLnN0YXRlLnNvY2tldFxuICAgIGlmIChlLmFjdGl2ZSAmJiBzb2NrZXQub3BlbiAmJiBzb2NrZXQucmVhZHkpIHtcbiAgICAgIHRoaXMuYWZ0ZXJPcGVuKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZS5jbG91ZCkgY2hvb3NlUm91dGVNb2RlKGUuY2xvdWQuaWQsICdhdXRvJylcbiAgICAvLyBIZWFyZCBvdmVyIEJsdWV0b290aCBhbmQgb3V0IG9mIGV2ZXJ5IG90aGVyIHJlYWNoOiB0aGUgY2xvdWQgc2F5cyBpdCBpcyBvZmZsaW5lLCBzbyBCbHVldG9vdGggaXMgdGhlIHdheSBpbi5cbiAgICAvLyBBbiBhdXRvbWF0aWMgbW92ZSwgbm90IGEgY2hvaWNlOiBpdCByZWNvcmRzIG5vIGhlbGQgcm91dGUuXG4gICAgaWYgKGUuaGVhbHRoID09PSAnbmVhcmJ5JyAmJiBlLm5lYXJieSAmJiBlLmNsb3VkKSByZXR1cm4gdGhpcy5jb25uZWN0T3ZlckJsdWV0b290aChlLCBlLm5lYXJieSwgdHJ1ZSlcbiAgICAvLyBPbiB0aGUgaG9zdGVkIHBhZ2UsIHRoZSBwcmludGVyJ3Mgb3duIHNlY3VyZSBhZGRyZXNzIGlzIHRoZSB3YXkgaW4gb24gdGhpcyBuZXR3b3JrLlxuICAgIGNvbnN0IG5hbWUgPSBzZWN1cmVOYW1lT2YoZS5jbG91ZClcbiAgICBpZiAoZS5jbG91ZCAmJiBuYW1lICYmIG1heVRyeVNlY3VyZU5hbWUoKSAmJiAhcmVsYXlDaG9zZW4oZS5jbG91ZC5pZCkgJiZcbiAgICAgICF3YW50c0JsdWV0b290aEZvcihlLmNsb3VkLmlkKSAmJiBuYW1lICE9PSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUpIHtcbiAgICAgIGNvbnN0IGlkID0gZS5jbG91ZC5pZFxuICAgICAgbGV0IHJlc3VsdDogSW5QbGFjZVJlc3VsdCA9IHsgb2s6IGZhbHNlLCB3aHk6ICd1bnJlYWNoYWJsZScgfVxuICAgICAgLy8gSW4gcGxhY2UsIGZyb20gdGhlIGNsaWNrOiBubyBhZGRyZXNzIGNoYW5nZSAoS0FOLTU0NTkpLlxuICAgICAgYXdhaXQgdGhpcy5ydW4oZS5rZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgY29ubmVjdEluUGxhY2UoeyBuYW1lLCBsYWJlbDogZS5uYW1lLCBlbmRwb2ludElkOiBlLmVuZHBvaW50SWQsIHByaW50ZXJJZDogaWQgfSlcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5va1xuICAgICAgfSlcbiAgICAgIGlmIChyb3V0ZU1vZGUoaWQpICE9PSAnYXV0bycpIHJldHVybiBmYWxzZVxuICAgICAgaWYgKHJlc3VsdC5vaykgcmV0dXJuIHRydWVcbiAgICAgIGlmICghdG9sZFJlbGF5LmhhcyhlLmNsb3VkLmlkKSkge1xuICAgICAgICB0b2xkUmVsYXkuYWRkKGUuY2xvdWQuaWQpXG4gICAgICAgIHRoaXMubm90aWNlID0gcmVzdWx0LndoeSA9PT0gJ2Jsb2NrZWQnXG4gICAgICAgICAgPyBMT0NBTF9BQ0NFU1NfQkxPQ0tFRFxuICAgICAgICAgIDogYE9wZW5lZCAke2UubmFtZX0gdGhyb3VnaCBNdW9uM0QuIFRoaXMgYnJvd3NlciBjYW4ndCByZWFjaCBpdHMgc2VjdXJlIGFkZHJlc3Mgb24gdGhpcyBuZXR3b3JrLmBcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gVGhlIHNlcnZpY2UgbG9zdCBpdCwgb3IgaXQgYW5zd2VycyBvbiB0aGlzIG5ldHdvcms6IHRoZSBsb2NhbCB3YXkgaW4gaXMgdGhlIG9uZSB0aGF0IHdvcmtzLlxuICAgIC8vIEF1dG8ncyBvcmRlcjogdGhpcyBuZXR3b3JrLCBNdW9uM0QsIEJsdWV0b290aCAob3Blbk1hbmFnZWRSb3V0ZSBtb3ZlcyBvbiB0byBpdCksIHRoZW4gdGhlIHF1ZXN0aW9uLlxuICAgIGNvbnN0IG9wZW5lZCA9IGUubGFuIHx8ICghZS5jbG91ZD8ub25saW5lICYmIGUuaG9zdCkgPyBhd2FpdCB0aGlzLmNvbm5lY3RMb2NhbChlLCB0cnVlKSA6IGF3YWl0IHRoaXMuY29ubmVjdENsb3VkKGUpXG4gICAgaWYgKG9wZW5lZCA9PT0gZmFsc2UpIHRoaXMuYXNrTXVvbkxvY2FsID0gdHJ1ZVxuICAgIHJldHVybiBvcGVuZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJvdXRlIHRoZSBwZXJzb24gcGlja2VkIGZhaWxlZC4gSXQgc3RheXMgdGhlIGhlbGQgcm91dGUsIG5vdGhpbmcgZWxzZSBpcyB0cmllZCwgYW5kIHRoZSBvdGhlciByb3V0ZXMgYXJlXG4gICAqIG9mZmVyZWQgYXMgYnV0dG9ucyB0aGUgcGVyc29uIGNob29zZXMuXG4gICAqL1xuICBmYWlsUm91dGUgKGU6IERpcmVjdG9yeUVudHJ5LCBwaWNrZWQ6ICdsb2NhbCcgfCAnY2xvdWQnIHwgJ2JsdWV0b290aCcsIGxpbmU6IHN0cmluZykge1xuICAgIGNvbnN0IGNob2ljZXM6IEFycmF5PHsgaWQ6IHN0cmluZywgbGFiZWw6IHN0cmluZyB9PiA9IFtdXG4gICAgaWYgKHBpY2tlZCAhPT0gJ2Nsb3VkJyAmJiBlLmNsb3VkPy5vbmxpbmUpIGNob2ljZXMucHVzaCh7IGlkOiAnY2xvdWQnLCBsYWJlbDogJ092ZXIgTXVvbjNEJyB9KVxuICAgIGlmIChwaWNrZWQgIT09ICdibHVldG9vdGgnICYmIChlLm5lYXJieSB8fCBpZE9mKGUpKSkgY2hvaWNlcy5wdXNoKHsgaWQ6ICdibHVldG9vdGgnLCBsYWJlbDogJ092ZXIgQmx1ZXRvb3RoJyB9KVxuICAgIGlmIChwaWNrZWQgIT09ICdsb2NhbCcgJiYgbG9jYWxSb3V0ZU9mKGUpLmtpbmQgPT09ICdzZWN1cmUnKSBjaG9pY2VzLnB1c2goeyBpZDogJ2xvY2FsJywgbGFiZWw6ICdPbiB0aGlzIG5ldHdvcmsnIH0pXG4gICAgY2hvaWNlcy5wdXNoKHsgaWQ6ICdtdW9uLWxvY2FsJywgbGFiZWw6ICdtdW9uM2QubG9jYWwnIH0pXG4gICAgdGhpcy5yb3V0ZVByb2JsZW0gPSB7IGxpbmUsIGNob2ljZXMgfVxuICAgIHRoaXMucm91dGVQcm9ibGVtRW50cnkgPSBlXG4gIH1cblxuICAvKiogQSBidXR0b24gdW5kZXIgXCJDb3VsZG4ndCBjb25uZWN0XCI6IHRoZSBwZXJzb24ncyBjaG9pY2Ugb2YgdGhlIG5leHQgcm91dGUuICovXG4gIG9uUHJvYmxlbUNob2ljZSAoaWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGUgPSB0aGlzLnJvdXRlUHJvYmxlbUVudHJ5XG4gICAgdGhpcy5yb3V0ZVByb2JsZW0gPSBudWxsXG4gICAgaWYgKGlkID09PSAnbXVvbi1sb2NhbCcpIHtcbiAgICAgIHRoaXMuYXNrTXVvbkxvY2FsID0gdHJ1ZVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghZSkgcmV0dXJuXG4gICAgaWYgKGlkID09PSAnY2xvdWQnKSByZXR1cm4gdGhpcy5jb25uZWN0Q2xvdWQoZSwgJ3JlbGF5JylcbiAgICBpZiAoaWQgPT09ICdibHVldG9vdGgnKSByZXR1cm4gdGhpcy5jb25uZWN0T3ZlckJsdWV0b290aChlKVxuICAgIGlmIChpZCA9PT0gJ2xvY2FsJykgcmV0dXJuIHRoaXMuY29ubmVjdExvY2FsKGUpXG4gIH1cblxuICBjYW5jZWxNdW9uTG9jYWwgKCkge1xuICAgIHRoaXMuYXNrTXVvbkxvY2FsID0gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBgcm91dGVgIGlzIHRoZSBwZXJzb24ncyBjaG9pY2Ugb2Ygd2F5IGluIChLQU4tMTI1Myk6IHRoZSBkZXZpY2UgdG8gb3BlbiBpdFxuICAgKiBvdmVyIEJsdWV0b290aCwgb3IgYCdyZWxheSdgIHRvIHVuZG8gYW4gZWFybGllciBCbHVldG9vdGggY2hvaWNlLiBUaGVcbiAgICogY2hvaWNlIGFuZCB0aGUgZHJvcCBvZiBhbnkgb3BlbiBjb25uZWN0aW9uIGhhcHBlbiBpbnNpZGUgYHJ1bmAsIHNvIGEgY2xpY2tcbiAgICogaWdub3JlZCB3aGlsZSBhbm90aGVyIG9wZW4gaXMgYnVzeSBjaGFuZ2VzIG5vdGhpbmcuIFRoZSBoYW5kb2ZmIGJlaGluZCBhXG4gICAqIEJsdWV0b290aCBjaG9pY2Ugbm8gbG9uZ2VyIHdhaXRzIG9uIHRoZSBzZXJ2aWNlIGZvciB0aGlzIHByaW50ZXIsIGFuZCBhXG4gICAqIGNvbm5lY3Rpb24gYWxyZWFkeSBvcGVuIGlzIGRyb3BwZWQgc28gdGhpcyBkaWFsIHVzZXMgdGhlIGNob3NlbiByb3V0ZS5cbiAgICovXG4gIGNvbm5lY3RDbG91ZCAoZTogRGlyZWN0b3J5RW50cnksIHJvdXRlPzogJ3JlbGF5JyB8IEJsZURldmljZSwgYXV0byA9IGZhbHNlKSB7XG4gICAgY29uc3QgaWQgPSBpZE9mKGUpXG4gICAgaWYgKCFpZCB8fCAoIWUuY2xvdWQgJiYgKCFyb3V0ZSB8fCByb3V0ZSA9PT0gJ3JlbGF5JykpKSByZXR1cm5cbiAgICBpZiAocm91dGUgJiYgIWF1dG8pIGNob29zZVJvdXRlTW9kZShpZCwgcm91dGUgPT09ICdyZWxheScgPyAnY2xvdWQnIDogJ2JsZScpXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnJ1bihlLmtleSwgKCkgPT4gb3Blbk1hbmFnZWRSb3V0ZShlLCByb3V0ZSwgYXV0byksICEhcm91dGUpKS50aGVuKG9wZW5lZCA9PiB7XG4gICAgICAvLyBBIHBpY2tlZCByb3V0ZSBpcyBoZWxkOiBubyBvdGhlciBpcyB0cmllZCwgYW5kIHRoZSBwZXJzb24gaXMgdG9sZCBhbmQgb2ZmZXJlZCB0aGUgcmVzdC5cbiAgICAgIGlmIChvcGVuZWQgPT09IGZhbHNlICYmIHJvdXRlICYmICFhdXRvKSB7XG4gICAgICAgIHRoaXMuZmFpbFJvdXRlKGUsIHJvdXRlID09PSAncmVsYXknID8gJ2Nsb3VkJyA6ICdibHVldG9vdGgnLFxuICAgICAgICAgIHJvdXRlID09PSAncmVsYXknID8gXCJDb3VsZG4ndCBjb25uZWN0IG92ZXIgTXVvbjNELlwiIDogXCJDb3VsZG4ndCBjb25uZWN0IG92ZXIgQmx1ZXRvb3RoLlwiKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9wZW5lZFxuICAgIH0pXG4gIH1cblxuICAvKiogVGhlIHNhdmVkIGFkZHJlc3MgaXQgYW5zd2VycyBvbiwgZWxzZSBpdHMgYWRkcmVzcyBvbiB0aGlzIG5ldHdvcmsuICovXG4gIGxvY2FsSW5zdGFuY2UgKGU6IERpcmVjdG9yeUVudHJ5KTogSW5zdGFuY2VDb25maWcgfCBudWxsIHtcbiAgICBpZiAoZS5sYW4pIHtcbiAgICAgIGNvbnN0IGFuc3dlcmluZyA9IGxhbkFkZHJlc3NlcyhlLmxhbilcbiAgICAgIGNvbnN0IHNhdmVkID0gZS5zYXZlZC5maW5kKHMgPT4gYW5zd2VyaW5nLmluY2x1ZGVzKGhvc3RPZihzLmFwaVVybCkpKVxuICAgICAgcmV0dXJuIHNhdmVkID8/IGluc3RhbmNlRm9yKGUubGFuKVxuICAgIH1cbiAgICBpZiAoZS5ob3N0KSByZXR1cm4gaW5zdGFuY2VGb3JIb3N0KGUuaG9zdCwgZS5uYW1lLCBlLmVuZHBvaW50SWQpXG4gICAgcmV0dXJuIGUuc2F2ZWRbMF0gPz8gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIENvbm5lY3QgbG9jYWxseSBmcm9tIHRoZSBob3N0ZWQgcGFnZSAoS0FOLTU0NTkpOiBpbiBwbGFjZSwgb3ZlciB0aGUgcHJpbnRlcidzIHNlY3VyZSBuYW1lLCBzbyB0aGUgdGFiIHN0YXlzIG9uXG4gICAqIGNvbnRyb2wubXVvbjNkLmNvbSBhbmQgdGhlIHByaW50ZXIgc2hvd3MgYXMgY29ubmVjdGVkIGxvY2FsbHkuIE5ldmVyIHRvIGEgcHJpbnRlcidzIG93biBhZGRyZXNzLlxuICAgKlxuICAgKiBgcGlja2VkYCBpcyB0aGUgcGVyc29uJ3Mgb3duIGNob2ljZSBvZiByb3V0ZSAoQ29ubmVjdCBsb2NhbGx5IGluIHRoZSByb3V0ZSBtZW51KTogJ2xhbicgaXMgaGVsZCwgYW5kIGlmIGl0IGZhaWxzXG4gICAqIGl0IHN0YXlzIGhlbGQsIHNheXMgc28gYW5kIG9mZmVycyB0aGUgb3RoZXIgcm91dGVzIGFzIGJ1dHRvbnMuIE5vdCBwaWNrZWQgKGEgcGxhaW4gY2xpY2sgb24gYSBmb3VuZCBwcmludGVyKSBpdCBpc1xuICAgKiBBdXRvOiB0aGlzIG5ldHdvcmssIHRoZW4gTXVvbjNELCB0aGVuIEJsdWV0b290aCwgdGhlbiB0aGUgcXVlc3Rpb24gYWJvdXQgbXVvbjNkLmxvY2FsLlxuICAgKi9cbiAgYXN5bmMgY29ubmVjdExvY2FsRnJvbUhvc3RlZFBhZ2UgKGU6IERpcmVjdG9yeUVudHJ5LCByb3V0ZTogTG9jYWxSb3V0ZSwgcGlja2VkID0gdHJ1ZSk6IFByb21pc2U8Ym9vbGVhbiB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGlkID0gZS5jbG91ZD8uaWQgPz8gZS5lbmRwb2ludElkXG4gICAgbGV0IHJlc3VsdDogSW5QbGFjZVJlc3VsdCA9IHsgb2s6IGZhbHNlLCB3aHk6ICd1bnJlYWNoYWJsZScgfVxuICAgIC8vIEJ1c3k6IHJ1biBzYXlzIFwiU3RpbGwgb3BlbmluZ1wiIGl0c2VsZiwgYW5kIHRoYXQgc3RheXMgdGhlIGFuc3dlci5cbiAgICBjb25zdCBidXN5ID0gISF0aGlzLmJ1c3lLZXlcbiAgICBpZiAocGlja2VkICYmIGlkICYmICFidXN5KSBjaG9vc2VSb3V0ZU1vZGUoaWQsICdsYW4nKVxuICAgIGlmIChyb3V0ZS5raW5kID09PSAnc2VjdXJlJykge1xuICAgICAgYXdhaXQgdGhpcy5ydW4oZS5rZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgY29ubmVjdEluUGxhY2UoeyBuYW1lOiByb3V0ZS5uYW1lLCBsYWJlbDogZS5uYW1lLCBlbmRwb2ludElkOiBlLmVuZHBvaW50SWQsIHByaW50ZXJJZDogaWQgfSlcbiAgICAgICAgaWYgKHJlc3VsdC5vayAmJiBpZCkge1xuICAgICAgICAgIGNsZWFyUmVsYXlDaG9pY2UoaWQpXG4gICAgICAgICAgc3RvcFVzaW5nQmx1ZXRvb3RoRm9yKGlkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQub2tcbiAgICAgIH0pXG4gICAgICBpZiAocmVzdWx0Lm9rKSByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAoYnVzeSkgcmV0dXJuXG4gICAgY29uc3QgYmxvY2tlZCA9ICFyZXN1bHQub2sgJiYgcmVzdWx0LndoeSA9PT0gJ2Jsb2NrZWQnXG4gICAgaWYgKHBpY2tlZCkge1xuICAgICAgdGhpcy5ub3RpY2UgPSBudWxsXG4gICAgICB0aGlzLmZhaWxSb3V0ZShlLCAnbG9jYWwnLCBibG9ja2VkID8gTE9DQUxfQUNDRVNTX0JMT0NLRUQgOiBcIkNvdWxkbid0IGNvbm5lY3QgbG9jYWxseS5cIilcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoYmxvY2tlZCkgdGhpcy5ub3RpY2UgPSBMT0NBTF9BQ0NFU1NfQkxPQ0tFRFxuICAgIGxldCBvcGVuZWQ6IGJvb2xlYW4gfCB1bmRlZmluZWRcbiAgICBpZiAoZS5jbG91ZD8ub25saW5lKSBvcGVuZWQgPSBhd2FpdCB0aGlzLmNvbm5lY3RDbG91ZChlLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZWxzZSBpZiAoZS5uZWFyYnkpIG9wZW5lZCA9IGF3YWl0IHRoaXMuY29ubmVjdE92ZXJCbHVldG9vdGgoZSwgZS5uZWFyYnksIHRydWUpXG4gICAgaWYgKG9wZW5lZCAhPT0gdHJ1ZSkgdGhpcy5hc2tNdW9uTG9jYWwgPSB0cnVlXG4gICAgcmV0dXJuIG9wZW5lZFxuICB9XG5cbiAgY29ubmVjdExvY2FsIChlOiBEaXJlY3RvcnlFbnRyeSwgYXV0byA9IGZhbHNlLCBwaWNrZWQgPSB0cnVlKSB7XG4gICAgaWYgKGF1dG8gJiYgcm91dGVNb2RlKGlkT2YoZSkpICE9PSAnYXV0bycpIHJldHVybiBmYWxzZVxuICAgIC8vIEFuIGF1dG9tYXRpYyBtb3ZlIG5ldmVyIG9wZW5zIGEgdGFiIG9yIGxlYXZlcyB0aGUgcGFnZTogb25seSBhIHBlcnNvbidzIENvbm5lY3QgbG9jYWxseSBkb2VzLlxuICAgIGlmICghYXV0byAmJiBtYXlUcnlTZWN1cmVOYW1lKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RMb2NhbEZyb21Ib3N0ZWRQYWdlKGUsIHRoaXMubG9jYWxSb3V0ZUZvcihlKSwgcGlja2VkKVxuICAgIH1cbiAgICAvLyBBbiBhdXRvbWF0aWMgbW92ZSBvbiB0aGUgaG9zdGVkIHBhZ2UgY2FuJ3QgZGlhbCBhIHBsYWluIGxvY2FsIGFkZHJlc3MgKHRoZSBicm93c2VyIGJsb2NrcyBpdCksIHNvIE11b24zRCBjYXJyaWVzIGl0LlxuICAgIGlmIChhdXRvICYmIG1heVRyeVNlY3VyZU5hbWUoKSAmJiBlLmNsb3VkPy5vbmxpbmUpIHJldHVybiB0aGlzLmNvbm5lY3RDbG91ZChlLCB1bmRlZmluZWQsIHRydWUpXG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLmxvY2FsSW5zdGFuY2UoZSlcbiAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICAvLyBUaGUgc2VydmljZSBmb3VuZCBpdCBiZXNpZGUgdGhpcyBicm93c2VyIGJ1dCBnYXZlIG5vIGFkZHJlc3MgdG8gdXNlXG4gICAgICAvLyAob25seSB0aGUgcHJpbnRlcidzIG93biBob3RzcG90KTogdGhlcmUgaXMgbm90aGluZyB0byBvcGVuIGhlcmUuXG4gICAgICB0aGlzLm5vdGljZSA9IGAke2UubmFtZX0gaXMgb24gdGhpcyBuZXR3b3JrLCBidXQgTXVvbjNEIGRvZXNuJ3Qga25vdyBpdHMgYWRkcmVzcyBoZXJlLiBgICtcbiAgICAgICAgJ1NlYXJjaCBhZ2Fpbiwgb3IgYWRkIGl0IGJ5IHRoZSBJUCBhZGRyZXNzIGl0cyBzY3JlZW4gc2hvd3MgdW5kZXIgU3lzdGVtLidcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBpZCA9IGUuY2xvdWQ/LmlkID8/IGUuZW5kcG9pbnRJZFxuICAgIGlmIChpZCAmJiAhYXV0bykgY2hvb3NlUm91dGVNb2RlKGlkLCAnbGFuJylcbiAgICByZXR1cm4gdGhpcy5ydW4oZS5rZXksIGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChlLmVuZHBvaW50SWQgJiYgIWF1dG8pIHtcbiAgICAgICAgc3RvcFVzaW5nQmx1ZXRvb3RoRm9yKGUuZW5kcG9pbnRJZClcbiAgICAgICAgZHJvcENsb3VkQ29ubmVjdGlvbihlLmVuZHBvaW50SWQpXG4gICAgICB9XG4gICAgICBpZiAoYXdhaXQgYWN0aXZhdGVMb2NhbFByaW50ZXIoaW5zdGFuY2UsIGlkKSkge1xuICAgICAgICBpZiAoYXV0byAmJiBlLmVuZHBvaW50SWQgJiYgcm91dGVNb2RlKGlkKSA9PT0gJ2F1dG8nKSB7XG4gICAgICAgICAgc3RvcFVzaW5nQmx1ZXRvb3RoRm9yKGUuZW5kcG9pbnRJZClcbiAgICAgICAgICBkcm9wQ2xvdWRDb25uZWN0aW9uKGUuZW5kcG9pbnRJZClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGF1dG8gJiYgKCFpZCB8fCByb3V0ZU1vZGUoaWQpID09PSAnYXV0bycpID8gb3Blbk1hbmFnZWRSb3V0ZShlLCB1bmRlZmluZWQsIHRydWUpIDogZmFsc2VcbiAgICB9LCB0cnVlKVxuICB9XG5cbiAgb3BlbkxvY2FsRW50cnkgKGU6IERpcmVjdG9yeUVudHJ5KSB7XG4gICAgaWYgKGUuYWN0aXZlKSB7XG4gICAgICB0aGlzLmFmdGVyT3BlbigpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdExvY2FsKGUsIGZhbHNlLCBmYWxzZSlcbiAgfVxuXG4gIG9wZW5Gb3VuZEVudHJ5IChlOiBEaXJlY3RvcnlFbnRyeSkge1xuICAgIGNvbnN0IHJvdyA9IGUucm93XG4gICAgaWYgKCFyb3cpIHJldHVyblxuICAgIHN3aXRjaCAocm93LmFjdGlvbikge1xuICAgICAgY2FzZSAnb3Blbic6IHtcbiAgICAgICAgY29uc3Qgd2F5ID0gZm91bmRPcGVuRm9yKGUsIGNsb3VkU3RhdGUucHJpbnRlcnMsICEhY2xvdWRTdGF0ZS5hY2NvdW50KVxuICAgICAgICBpZiAod2F5LmtpbmQgPT09ICdyZWxheScpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ydW4oZS5rZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IGFjdGl2YXRlQ2xvdWRQcmludGVyKHdheS5wcmludGVySWQpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdheS5raW5kID09PSAnc2lnbi1pbicpIHtcbiAgICAgICAgICB0aGlzLnBlbmRpbmdPcGVuID0gZVxuICAgICAgICAgIHRoaXMuYWNjb3VudERpYWxvZyA9IHRydWVcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0TG9jYWwoZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgfVxuICAgICAgY2FzZSAnc2V0LXVwJzpcbiAgICAgICAgaWYgKCFyb3cubmVhcmJ5KSByZXR1cm5cbiAgICAgICAgdGhpcy5zZXR1cFByaW50ZXIgPSByb3cubmVhcmJ5XG4gICAgICAgIHRoaXMuc2V0dXBEaWFsb2cgPSB0cnVlXG4gICAgICAgIHJldHVyblxuICAgICAgY2FzZSAnbmVhcmJ5LWluZm8nOlxuICAgICAgICAvLyBTZXQgdXAsIGFuZCBub3Qgb24gdGhpcyBuZXR3b3JrIG9yIGFuIGFjY291bnQ6IHN0aWxsIHRoaXMgYnJvd3NlcidzIHRvIHBhaXIgd2l0aCBvdmVyIEJsdWV0b290aCwgc2lnbmVkIGluIG9yIG5vdC5cbiAgICAgICAgaWYgKHJvdy5uZWFyYnk/LmVuZHBvaW50SWQpIHJldHVybiB0aGlzLnBhaXJOZWFyYnkoZSlcbiAgICAgICAgdGhpcy5ub3RpY2UgPSBgJHtyb3cubmFtZX0gaXMgbmVhcmJ5LiBUaGlzIGJyb3dzZXIgaGVhcnMgaXQgb3ZlciBCbHVldG9vdGgsIGJ1dCBpdCBpc24ndCBvbiB0aGlzIGAgK1xuICAgICAgICAgIFwibmV0d29yayBvciB5b3VyIGFjY291bnQuIEpvaW4gdGhlIG5ldHdvcmsgaXQncyBvbiwgb3IgbGluayBpdCB0byB5b3VyIGFjY291bnQgYXQgdGhlIHByaW50ZXIuXCJcbiAgICB9XG4gIH1cblxuICBhc3luYyBvcGVuSW5zdGFuY2UgKGluc3RhbmNlOiBJbnN0YW5jZUNvbmZpZykge1xuICAgIGF3YWl0IHRoaXMucnVuKGBhZGRyZXNzOiR7aW5zdGFuY2UuYXBpVXJsfWAsICgpID0+IGFjdGl2YXRlTG9jYWxQcmludGVyKGluc3RhbmNlKSlcbiAgfVxuXG4gIC8vIC0tIG1hbmFnaW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgbGluayAoZTogRGlyZWN0b3J5RW50cnkpIHtcbiAgICBpZiAoIXRoaXMuYWNjb3VudCkge1xuICAgICAgdGhpcy5wZW5kaW5nTGluayA9IGVcbiAgICAgIHRoaXMuYWNjb3VudERpYWxvZyA9IHRydWVcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBuZWFyYnlJZCA9IGUucm93Py5jbG91ZElkID8/XG4gICAgICBkaXNjb3ZlcnlTdGF0ZS5jbG91ZC5maW5kKGMgPT4gYy5wcmludGVySWQgPT09IGUuZW5kcG9pbnRJZCk/LnByaW50ZXJJZCA/PyAnJ1xuICAgIHRoaXMubGlua1ByaW50ZXJJZCA9IG5lYXJieUlkXG4gICAgdGhpcy5saW5rSG9zdCA9IG5lYXJieUlkID8gJycgOiAoZS5ob3N0ID8/ICcnKVxuICAgIHRoaXMubGlua0RpYWxvZyA9IHRydWVcbiAgfVxuXG4gIG9uU2lnbmVkSW4gKCkge1xuICAgIGNvbnN0IHBlbmRpbmcgPSB0aGlzLnBlbmRpbmdMaW5rXG4gICAgdGhpcy5wZW5kaW5nTGluayA9IG51bGxcbiAgICBpZiAocGVuZGluZykgdGhpcy5saW5rKHBlbmRpbmcpXG4gICAgY29uc3Qgb3BlbiA9IHRoaXMucGVuZGluZ09wZW5cbiAgICB0aGlzLnBlbmRpbmdPcGVuID0gbnVsbFxuICAgIGlmIChvcGVuKSB0aGlzLm9wZW5Gb3VuZEVudHJ5KG9wZW4pXG4gIH1cblxuICByZW1vdmUgKGU6IERpcmVjdG9yeUVudHJ5KSB7XG4gICAgZm9yIChjb25zdCBzIG9mIGUuc2F2ZWQpIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvcmVtb3ZlSW5zdGFuY2UnLCBzKVxuICB9XG5cbiAgYXNrRm9yQWNjZXNzIChlOiBEaXJlY3RvcnlFbnRyeSkge1xuICAgIGlmICghZS5ob3N0KSByZXR1cm5cbiAgICB0aGlzLmFjY2Vzc0NsaWVudCA9IGxhblByaW50ZXJBY2Nlc3MoYGh0dHA6Ly8ke2UuaG9zdH1gKVxuICAgIHRoaXMuYWNjZXNzQXNrID0geyBraW5kOiAnam9pbicgfVxuICAgIHRoaXMuYWNjZXNzTmFtZSA9IGUubmFtZVxuICAgIHRoaXMuYWNjZXNzRGlhbG9nID0gdHJ1ZVxuICB9XG5cbiAgb25BY2Nlc3NBbnN3ZXJlZCAoKSB7XG4gICAgcmVmcmVzaEtub3duUHJpbnRlcnMoKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIGFzeW5jIG9wZW5BY2Nlc3MgKGU6IERpcmVjdG9yeUVudHJ5KSB7XG4gICAgaWYgKCFlLmFjdGl2ZSkge1xuICAgICAgaWYgKGUuc2VjdGlvbiA9PT0gJ2Nsb3VkJykgYXdhaXQgdGhpcy5jb25uZWN0Q2xvdWQoZSlcbiAgICAgIGVsc2UgYXdhaXQgdGhpcy5jb25uZWN0TG9jYWwoZSlcbiAgICAgIGlmIChhY3RpdmF0aW9uU3RhdGUuZXJyb3IpIHJldHVyblxuICAgIH1cbiAgICB0aGlzLiRlbWl0KCdjbGljaycpXG4gICAgY29uc3QgaGFzaCA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9jb21wb25lbnRTdXBwb3J0J10oJ211b25fYWNjZXNzJykgPyAnI2FjY2VzcycgOiAnI3Byb3RlY3Rpb24nXG4gICAgY29uc3Qgc2V0dGluZ3MgPSBzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpXG4gICAgaWYgKHRoaXMuJHJvdXRlLnBhdGggIT09IHNldHRpbmdzIHx8IHRoaXMuJHJvdXRlLmhhc2ggIT09IGhhc2gpIHtcbiAgICAgIHRoaXMuJHJvdXRlci5wdXNoKHsgcGF0aDogc2V0dGluZ3MsIGhhc2ggfSkuY2F0Y2goKCkgPT4ge30pXG4gICAgfVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLFdBQVcsY0FBYztBQUNsQyxPQUFPLGFBQWE7QUFFcEIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxZQUFZLHFCQUFxQiw2QkFBNkI7QUFDdkUsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxvQkFBb0I7QUFDN0I7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBQ1A7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FDSztBQUNQO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxPQU1LO0FBQ1AsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxnQkFBZ0Isc0JBQXlDO0FBQ2xFLFNBQVMsV0FBVyxZQUFZLGFBQWEsMkJBQStDO0FBQzVGLFNBQVMsaUJBQWlCLGlCQUFpQjtBQUMzQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWUsc0JBQXNCO0FBQzlDLFNBQVMsbUJBQW1CLG9CQUFvQixzQkFBc0IsdUJBQXVCLGlCQUFpQix5QkFBeUI7QUFDdkksU0FBUyxpQkFBaUIsaUJBQTZCO0FBQ3ZELFNBQVMsc0JBQTJDO0FBRXBELFNBQVMsZ0JBQWdCLDRCQUFnRDtBQUN6RSxTQUFTLGFBQWEsa0JBQWtCLGtCQUFrQixhQUFhLG9CQUFvQjtBQUMzRixTQUFTLGdCQUFnQixZQUFZLHdCQUF5QztBQUM5RSxTQUFTLHdCQUEyRDtBQUNwRSxTQUFTLHNCQUFzQjtBQU94QixhQUFNLGlCQUFpQjtBQUU5QixNQUFNLG1CQUFtQixNQUFNO0FBQUM7QUFHaEMsU0FBUyxTQUFVLElBQVk7QUFDN0IsUUFBTSxPQUFPLEdBQUcsWUFBWTtBQUM1QixTQUFPLGVBQWUsTUFBTSxLQUFLLE9BQUssRUFBRSxVQUFVLFlBQVksTUFBTSxJQUFJO0FBQzFFO0FBTUEsU0FBUyxnQkFBaUIsR0FBa0M7QUFDMUQsUUFBTSxPQUFPO0FBQUEsSUFDWCxFQUFFLEtBQUs7QUFBQSxJQUNQLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLE9BQUssRUFBRSxRQUFRO0FBQUEsSUFDdEMsRUFBRTtBQUFBLElBQ0YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksT0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDO0FBQUEsRUFDOUM7QUFDQSxTQUFPLEtBQUssS0FBSyxPQUFLLGVBQWUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSztBQUNsRTtBQUdBLFNBQVMsYUFBYyxHQUErQjtBQUNwRCxRQUFNLEtBQUssRUFBRSxPQUFPLE1BQU0sRUFBRTtBQUM1QixRQUFNLFNBQVMsS0FBSyxTQUFTLEVBQUUsSUFBSTtBQUNuQyxTQUFPLFdBQVc7QUFBQSxJQUNoQixRQUFRLGlCQUFpQjtBQUFBLElBQ3pCLE1BQU0sRUFBRTtBQUFBO0FBQUE7QUFBQSxJQUdSLFlBQVksYUFBYSxFQUFFLEtBQUssS0FBSyxhQUFhLEVBQUUsYUFBYSxRQUFRLFdBQVcsQ0FBQztBQUFBLElBQ3JGLFVBQVUsT0FBTyxTQUFTO0FBQUEsSUFDMUIsVUFBVSxFQUFFLEtBQUssWUFBWSxFQUFFLE9BQU8sS0FBSyxPQUFLLEVBQUUsUUFBUSxHQUFHLFlBQVksaUJBQWlCLEVBQUUsT0FBTyxRQUFRLEVBQUUsSUFBSTtBQUFBLElBQ2pILGFBQWEsZ0JBQWdCLENBQUM7QUFBQSxJQUM5QjtBQUFBLElBQ0EsZUFBZSxlQUFlO0FBQUEsSUFDOUIsZUFBZSxDQUFDLENBQUMsZUFBZTtBQUFBLEVBQ2xDLENBQUM7QUFDSDtBQUdBLFNBQVMsVUFBVyxPQUFtQixHQUEyQjtBQUNoRSxVQUFRLE1BQU0sTUFBTTtBQUFBLElBQ2xCLEtBQUs7QUFBVSxhQUFPO0FBQUEsSUFDdEIsS0FBSztBQUFRLGFBQU87QUFBQSxJQUNwQixLQUFLO0FBQU8sYUFBTyxFQUFFLFFBQVE7QUFBQSxJQUM3QixLQUFLO0FBQVEsYUFBTyxNQUFNO0FBQUEsRUFDNUI7QUFDRjtBQUdBLFNBQVMsS0FBTSxHQUFrQztBQUMvQyxTQUFPLEVBQUUsT0FBTyxNQUFNLEVBQUU7QUFDMUI7QUFHTyxnQkFBUyxZQUFhLEdBQWlDO0FBQzVELE1BQUksRUFBRSxXQUFXLFFBQVMsUUFBTztBQUNqQyxNQUFJLEVBQUUsV0FBVyxRQUFTLFFBQU87QUFDakMsUUFBTSxLQUFLLEtBQUssQ0FBQztBQUNqQixTQUFPLE1BQU0sa0JBQWtCLEVBQUUsSUFBSSxRQUFRO0FBQy9DO0FBR0EsU0FBUyxlQUFnQixHQUFpQztBQUN4RCxTQUFPLGVBQWUsYUFBYSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxJQUFJLE9BQU8sTUFBTSxNQUFNLFNBQVMsT0FBTyxFQUFFLElBQUksT0FBTyxNQUFNLE1BQU0sU0FBUyxFQUFFO0FBQzNIO0FBR0EsU0FBUyxhQUFjLEdBQW1DO0FBQ3hELFFBQU0sUUFBUSxhQUFhLENBQUM7QUFDNUIsU0FBTztBQUFBLElBQ0wsTUFBTSxVQUFVLEtBQUssQ0FBQyxDQUFDO0FBQUEsSUFDdkIsTUFBTSxZQUFZLENBQUM7QUFBQSxJQUNuQixPQUFPLEVBQUUsUUFBUSxNQUFNLFNBQVMsWUFBWSxNQUFNLFNBQVMsT0FBTyxNQUFNLFVBQVUsT0FBTyxDQUFDLEVBQUU7QUFBQSxJQUM1RixPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxPQUFPLFFBQVEsQ0FBQyxDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDdEQsS0FBSyxFQUFFLFNBQVMsWUFBWSxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUUsUUFBUSxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLGVBQWUsR0FBRyxRQUFRLEtBQUs7QUFBQSxFQUNySDtBQUNGO0FBR0EsTUFBTSxZQUFZLG9CQUFJLElBQVk7QUFHbEMsSUFBSSxhQUFhO0FBUWpCLGVBQWUsaUJBQWtCLEdBQW1CLE9BQTZCLE9BQU8sT0FBeUI7QUFFL0csUUFBTSxLQUFLLEtBQUssQ0FBQztBQUNqQixNQUFJLENBQUMsTUFBTyxDQUFDLEVBQUUsVUFBVSxDQUFDLFNBQVMsVUFBVSxTQUFXLFFBQU87QUFDL0QsTUFBSSxRQUFRLFVBQVUsRUFBRSxNQUFNLE9BQVEsUUFBTztBQUM3QyxNQUFJLENBQUMsU0FBUyxVQUFVLFNBQVM7QUFDL0IsUUFBSSxVQUFVLFdBQVcsQ0FBQyxLQUFNLGFBQVksRUFBRTtBQUM5QywwQkFBc0IsRUFBRTtBQUFBLEVBQzFCLE9BQU87QUFDTCxvQkFBZ0IsSUFBSSxLQUFLO0FBR3pCLFVBQU0scUJBQXFCLEVBQUU7QUFDN0IsUUFBSSxRQUFRLFVBQVUsRUFBRSxNQUFNLE9BQVEsUUFBTztBQUM3Qyx1QkFBbUIsRUFBRTtBQUFBLEVBQ3ZCO0FBQ0Esc0JBQW9CLEVBQUU7QUFDdEIsTUFBSTtBQUNGLFVBQU0scUJBQXFCLEVBQUU7QUFBQSxFQUMvQixTQUFTLE9BQU87QUFDZCxRQUFJLFNBQVMsaUJBQWlCLG9CQUFvQixlQUFlLEtBQUssRUFBRyxPQUFNO0FBQy9FLFVBQU0sU0FBUyxFQUFFLFVBQVUsTUFBTSxvQkFBb0IsRUFBRTtBQUN2RCxRQUFJLENBQUMsT0FBUSxPQUFNO0FBQ25CLFFBQUksVUFBVSxFQUFFLE1BQU0sT0FBUSxPQUFNLElBQUksaUJBQWlCO0FBQ3pELG9CQUFnQixJQUFJLE9BQU8sTUFBTTtBQUNqQyx3QkFBb0IsRUFBRTtBQUN0QixVQUFNLHFCQUFxQixFQUFFO0FBQUEsRUFDL0I7QUFDQSxTQUFPO0FBQ1Q7QUFXQSxlQUFlLG1CQUFvQixJQUFTLE9BQTZCO0FBR3ZFLE1BQUksQ0FBQyxNQUFPO0FBQ1osTUFBSSxDQUFDLE1BQU0sWUFBWTtBQUNyQixPQUFHLFNBQVMsK0JBQStCLE1BQU0sV0FBVyxNQUFNLGFBQWEsYUFBYTtBQUU1RjtBQUFBLEVBQ0Y7QUFDQSxRQUFNLFFBQVEsR0FBRyxVQUFVLE1BQU0sS0FBSyxDQUFDLE1BQXNCLEVBQUUsU0FBUyxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUNwRyxNQUFJLE9BQU87QUFDVCxVQUFNLEdBQUcscUJBQXFCLE9BQU8sS0FBSztBQUMxQztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsV0FBVyxPQUFPO0FBQ3JCLE9BQUcsU0FBUztBQUNaO0FBQUEsRUFDRjtBQUVBLFFBQU0sY0FBYyxHQUFHLFVBQVUsTUFBTSxLQUFLLENBQUMsTUFBc0IsRUFBRSxRQUFRLGFBQWEsTUFBTSxRQUFRO0FBQ3hHLFFBQU0sUUFBUSxHQUFHLFVBQVUsTUFBTSxLQUFLLENBQUMsTUFBc0IsRUFBRSxRQUFRLGFBQWEsTUFBTSxRQUFRLE1BQy9GLGFBQWEsS0FBSyxXQUFXLFNBQVMsY0FBYztBQUN2RCxNQUFJLE9BQU87QUFDVCxVQUFNLEdBQUcsa0JBQWtCLE9BQU8sTUFBTSxLQUFLLElBQUk7QUFDakQ7QUFBQSxFQUNGO0FBQ0EsTUFBSSxhQUFhO0FBQ2YsVUFBTSxHQUFHLGVBQWUsV0FBVztBQUNuQztBQUFBLEVBQ0Y7QUFDQSxLQUFHLFNBQVMsR0FBRyxNQUFNLFdBQVcsTUFBTSxhQUFhLGNBQWM7QUFDbkU7QUFHQSxJQUFxQixzQkFBckIsY0FBaUQsT0FBTyxVQUFVLEVBQUU7QUFBQSxFQUNsRSxJQUFJLGtCQUE0QjtBQUM5QixXQUFPLGNBQWMsZ0JBQWdCO0FBQUEsRUFDdkM7QUFBQSxFQUVBLHFCQUFxQjtBQUFBLEVBQ3JCLGdCQUFnQjtBQUFBLEVBQ2hCLGFBQWE7QUFBQSxFQUNiLGdCQUFnQjtBQUFBLEVBQ2hCLFdBQVc7QUFBQTtBQUFBLEVBRVgsY0FBcUM7QUFBQTtBQUFBLEVBRXJDLGNBQXFDO0FBQUEsRUFDckMsVUFBeUI7QUFBQSxFQUN6QixTQUF3QjtBQUFBO0FBQUEsRUFFeEIsZUFBdUY7QUFBQSxFQUN2RixvQkFBMkM7QUFBQTtBQUFBLEVBRTNDLGVBQWU7QUFBQTtBQUFBLEVBRWYsYUFBNEI7QUFBQSxFQUM1QixjQUFjO0FBQUEsRUFDZCxlQUFxQztBQUFBO0FBQUEsRUFFckMsZUFBZTtBQUFBLEVBQ2YsZUFBb0M7QUFBQSxFQUNwQyxZQUE4QjtBQUFBLEVBQzlCLGFBQWE7QUFBQSxFQUViLElBQUksVUFBVztBQUNiLFdBQU8sV0FBVztBQUFBLEVBQ3BCO0FBQUEsRUFFQSxJQUFJLFNBQVU7QUFDWixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsSUFBSSxrQkFBbUI7QUFDckIsV0FBTyxZQUFZLFlBQVk7QUFBQSxFQUNqQztBQUFBO0FBQUEsRUFHQSxJQUFJLGVBQXFDO0FBQ3ZDLFdBQU8sZUFBZSxRQUFXLEtBQUssWUFBWTtBQUFBLEVBQ3BEO0FBQUEsRUFFQSxJQUFJLGVBQWdCO0FBQ2xCLFdBQU8sS0FBSyxtQkFBbUIsWUFBWSxVQUFVO0FBQUEsRUFDdkQ7QUFBQSxFQUVBLElBQUksa0JBQW1CO0FBQ3JCLFdBQU8sZ0JBQWdCO0FBQUEsRUFDekI7QUFBQTtBQUFBLEVBR0EsSUFBSSxlQUFnQjtBQUNsQixXQUFPLGdCQUFnQjtBQUFBLEVBQ3pCO0FBQUEsRUFFQSxrQkFBbUI7QUFDakIsUUFBSSxnQkFBZ0IsUUFBUyxjQUFhLGdCQUFnQixPQUFPLEVBQUUsTUFBTSxNQUFNO0FBQUEsSUFBQyxDQUFDO0FBQUEsRUFDbkY7QUFBQSxFQUVBLElBQUkscUJBQXNCO0FBQ3hCLFdBQU8sZ0JBQWdCO0FBQUEsRUFDekI7QUFBQSxFQUVBLElBQUksWUFBYTtBQUNmLFdBQU8sZUFBZTtBQUFBLEVBQ3hCO0FBQUEsRUFFQSxJQUFJLGdCQUFpQjtBQUNuQixXQUFPLGVBQWU7QUFBQSxFQUN4QjtBQUFBLEVBRUEsSUFBSSxjQUFlO0FBQ2pCLFdBQU8sZUFBZTtBQUFBLEVBQ3hCO0FBQUEsRUFFQSxJQUFJLGlCQUFvQztBQUN0QyxVQUFNLE1BQXdCLEtBQUssT0FBTyxRQUFRLHFCQUFxQixLQUFLLENBQUM7QUFDN0UsV0FBTyxJQUFJLE9BQU8sT0FBSyxFQUFFLFdBQVcsZUFBZTtBQUFBLEVBQ3JEO0FBQUE7QUFBQSxFQUdBLElBQUksWUFBK0I7QUFDakMsUUFBSSxXQUFXLGdCQUFpQixRQUFPO0FBQ3ZDLFVBQU0sU0FBaUIsS0FBSyxPQUFPLE1BQU0sT0FBTztBQUNoRCxRQUFJLENBQUMsVUFBVSxXQUFXLGdCQUFpQixRQUFPO0FBQ2xELFFBQUk7QUFDSixRQUFJLENBQUMsS0FBSyxnQkFBaUIsVUFBUztBQUFBLGFBQzNCLENBQUMsS0FBSyxjQUFlLFVBQVM7QUFBQSxhQUM5QixDQUFDLEtBQUssWUFBYSxVQUFTO0FBQUEsYUFDNUIsS0FBSyxnQkFBaUIsVUFBUztBQUFBLGFBQy9CLEtBQUssY0FBZSxVQUFTO0FBQUEsUUFDakMsVUFBUztBQUNkLFdBQU8sRUFBRSxRQUFRLFFBQVEsUUFBUSxLQUFLLFlBQVksTUFBTSxFQUFFO0FBQUEsRUFDNUQ7QUFBQSxFQUVBLFlBQWEsUUFBK0I7QUFDMUMsUUFBSSxXQUFXLGFBQWMsUUFBTztBQUNwQyxRQUFJLFdBQVcsU0FBVSxRQUFPO0FBQ2hDLFVBQU0sUUFBUSxLQUFLLFNBQVMsV0FBVyxLQUFLLGdCQUFnQixTQUFTO0FBQ3JFLFFBQUksS0FBSyxtQkFBbUIsS0FBSyxlQUFlO0FBQzlDLFlBQU0sV0FBVyxLQUFLLE9BQU8sS0FBSyxPQUFPLFFBQVEsMEJBQTBCLEtBQUssS0FBSyxHQUFHO0FBQ3hGLGFBQU8sR0FBRyxLQUFLLE1BQU0sUUFBUTtBQUFBLElBQy9CO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLElBQUksWUFBd0I7QUFDMUIsV0FBTyxpQkFBaUI7QUFBQSxNQUN0QixTQUFTLEtBQUssV0FBVyxDQUFDLEtBQUssa0JBQWtCLFdBQVcsV0FBVyxDQUFDO0FBQUEsTUFDeEUsUUFBUSxXQUFXO0FBQUEsTUFDbkIsT0FBTyxLQUFLLFNBQVMsU0FBUztBQUFBLE1BQzlCLE9BQU8sS0FBSztBQUFBLE1BQ1osT0FBTyxlQUFlO0FBQUEsTUFDdEIsYUFBYSxlQUFlO0FBQUEsTUFDNUIsUUFBUSxZQUFZO0FBQUEsTUFDcEIsS0FBSyxZQUFZO0FBQUEsTUFDakIsZUFBZSxXQUFXO0FBQUEsTUFDMUIsY0FBYztBQUFBLE1BQ2QsT0FBTyxLQUFLO0FBQUEsTUFDWixXQUFXLGVBQWUsWUFBWSxDQUFDLGVBQWU7QUFBQSxJQUN4RCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsU0FBVTtBQUNSLFNBQUssU0FBUztBQUNkLG1CQUFlLGVBQWU7QUFDOUIscUJBQWlCLElBQUksRUFBRSxNQUFNLE1BQU07QUFBQSxJQUFDLENBQUM7QUFBQSxFQUN2QztBQUFBLEVBRUEsTUFBTSxlQUFnQjtBQUNwQixTQUFLLFNBQVM7QUFDZCxVQUFNLFdBQVc7QUFBQSxFQUNuQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsTUFBTSx5QkFBMEI7QUFDOUIsU0FBSyxTQUFTO0FBQ2QsVUFBTSxtQkFBbUIsTUFBTSxNQUFNLFdBQVcsQ0FBQztBQUFBLEVBQ25EO0FBQUE7QUFBQSxFQUdBLElBQUksV0FBWTtBQUNkLFdBQU8sVUFBVSxVQUFVO0FBQUEsRUFDN0I7QUFBQSxFQUVBLE1BQU0sU0FBVTtBQUNkLFNBQUssU0FBUztBQUVkLFVBQU0sbUJBQW1CLE1BQU0sTUFBTSxnQkFBZ0IsQ0FBQztBQUFBLEVBQ3hEO0FBQUE7QUFBQTtBQUFBLEVBS0EsY0FBZSxHQUErQjtBQUM1QyxXQUFPLGFBQWEsQ0FBQztBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxhQUFjLEdBQWlDO0FBQzdDLFVBQU0sVUFBd0IsZUFBZSxDQUFDO0FBQzlDLFFBQUksRUFBRSxTQUFTLGNBQWMsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHO0FBQ2hELGNBQVEsS0FBSyxFQUFFLElBQUksbUJBQW1CLE9BQU8sbUJBQW1CLE1BQU0sY0FBYyxNQUFNLGNBQWMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7QUFBQSxJQUMvSDtBQUNBLFlBQVEsS0FBSztBQUFBLE1BQ1gsSUFBSTtBQUFBLE1BQ0osT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sTUFBTSxFQUFFLFNBQVMsU0FBWTtBQUFBLElBQy9CLENBQUM7QUFDRCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUEsRUFHQSxVQUFXLEdBQXNDO0FBRS9DLFFBQUksRUFBRSxLQUFLLFVBQVUsT0FBUSxRQUFPO0FBQ3BDLFFBQUksRUFBRSxhQUFhLFdBQVcsRUFBRSxXQUFXLFNBQVUsUUFBTztBQUM1RCxXQUFPO0FBQUEsTUFDTCxJQUFJO0FBQUEsTUFDSixPQUFPO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixNQUFNLEVBQUUsYUFBYSxVQUFVLDhCQUE4QjtBQUFBLE1BQzdELFVBQVUsQ0FBQyxFQUFFO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLGFBQWMsR0FBaUM7QUFDN0MsVUFBTSxVQUF3QixDQUFDO0FBQy9CLFVBQU0sTUFBTSxLQUFLLFVBQVUsQ0FBQztBQUM1QixRQUFJLEtBQUs7QUFDUCxjQUFRLEtBQUssR0FBRztBQUFBLElBQ2xCLFdBQVcsRUFBRSxhQUFhLFFBQVE7QUFDaEMsY0FBUSxLQUFLLEVBQUUsSUFBSSxRQUFRLE9BQU8sc0JBQXNCLE1BQU0sZ0JBQWdCLFVBQVUsQ0FBQyxFQUFFLE1BQU0sTUFBTSxFQUFFLE9BQU8sU0FBWSw0QkFBNEIsQ0FBQztBQUFBLElBQzNKO0FBRUEsWUFBUSxLQUFLLEdBQUcsZUFBZSxDQUFDLENBQUM7QUFDakMsUUFBSSxFQUFFLFFBQVE7QUFDWixjQUFRLEtBQUssRUFBRSxJQUFJLFVBQVUsT0FBTyx5QkFBeUIsTUFBTSxpQkFBaUIsQ0FBQztBQUFBLElBQ3ZGO0FBQ0EsWUFBUSxLQUFLO0FBQUEsTUFDWCxJQUFJO0FBQUEsTUFDSixPQUFPO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsTUFDUixVQUFVLENBQUMsQ0FBQyxFQUFFO0FBQUEsTUFDZCxNQUFNLEVBQUUsU0FBUyxxQ0FBcUM7QUFBQSxJQUN4RCxDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLGFBQWMsR0FBaUM7QUFDN0MsVUFBTSxVQUF3QixDQUFDO0FBQy9CLFFBQUksRUFBRSxLQUFLLFdBQVcsT0FBUSxTQUFRLEtBQUssRUFBRSxJQUFJLFdBQVcsT0FBTyxXQUFXLE1BQU0sUUFBUSxVQUFVLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDL0csUUFBSSxFQUFFLEtBQUssUUFBUyxTQUFRLEtBQUssRUFBRSxJQUFJLFFBQVEsT0FBTyxzQkFBc0IsTUFBTSxlQUFlLENBQUM7QUFDbEcsVUFBTSxNQUFNLEtBQUssVUFBVSxDQUFDO0FBQzVCLFFBQUksSUFBSyxTQUFRLEtBQUssR0FBRztBQUV6QixVQUFNLFlBQVksZUFBZSxDQUFDLEVBQUUsS0FBSyxPQUFLLEVBQUUsT0FBTyxtQkFBbUI7QUFDMUUsUUFBSSxjQUFjLEVBQUUsVUFBVSxFQUFFLFlBQWEsU0FBUSxLQUFLLFNBQVM7QUFDbkUsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLFdBQVksR0FBaUM7QUFDM0MsUUFBSSxFQUFFLFlBQVksUUFBUyxRQUFPLEtBQUssYUFBYSxDQUFDO0FBQ3JELFFBQUksRUFBRSxZQUFZLFFBQVMsUUFBTyxLQUFLLGFBQWEsQ0FBQztBQUNyRCxXQUFPLEtBQUssYUFBYSxDQUFDO0FBQUEsRUFDNUI7QUFBQSxFQUVBLE1BQU0sU0FBVSxHQUFtQixJQUFZO0FBQzdDLFNBQUssU0FBUztBQUNkLFNBQUssYUFBYTtBQUNsQixTQUFLLGVBQWU7QUFDcEIsU0FBSyxlQUFlO0FBQ3BCLFlBQVEsSUFBSTtBQUFBLE1BQ1YsS0FBSztBQUFpQixlQUFPLEtBQUssYUFBYSxDQUFDO0FBQUEsTUFDaEQsS0FBSztBQUFpQixlQUFPLEtBQUssYUFBYSxHQUFHLE9BQU87QUFBQSxNQUN6RCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQ0gsWUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFHO0FBQ2QsZUFBTyxLQUFLLHFCQUFxQixDQUFDO0FBQUEsTUFDcEMsS0FBSztBQUFXLGVBQU8sS0FBSyxlQUFlLENBQUM7QUFBQSxNQUM1QyxLQUFLO0FBQWtCLGVBQU8sS0FBSyxXQUFXLEdBQUcsSUFBSTtBQUFBLE1BQ3JELEtBQUs7QUFBUSxlQUFPLEtBQUssS0FBSyxDQUFDO0FBQUEsTUFDL0IsS0FBSztBQUFVLGVBQU8sS0FBSyxPQUFPLENBQUM7QUFBQSxNQUNuQyxLQUFLO0FBQVUsZUFBTyxLQUFLLFdBQVcsQ0FBQztBQUFBLE1BQ3ZDLEtBQUs7QUFBTyxlQUFPLEtBQUssYUFBYSxDQUFDO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBLEVBS0EsWUFBYTtBQUNYLFNBQUssTUFBTSxPQUFPO0FBQUEsRUFDcEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxNQUFNLElBQUssS0FBYSxNQUE4QixZQUFZLE9BQU87QUFDdkUsUUFBSSxLQUFLLFdBQVcsQ0FBQyxXQUFXO0FBRzlCLGNBQVEsS0FBSyxzQkFBc0IsR0FBRyxtQkFBbUIsS0FBSyxPQUFPLEVBQUU7QUFDdkUsV0FBSyxTQUFTO0FBQ2Q7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLEVBQUU7QUFDZixTQUFLLFVBQVU7QUFDZixRQUFJO0FBQ0osUUFBSTtBQUNGLFlBQU0sVUFBVSxNQUFNLFFBQVEsS0FBSztBQUFBLFFBQ2pDLEtBQUs7QUFBQSxRQUNMLElBQUksUUFBZSxDQUFDLFVBQVUsV0FBVztBQUN2QyxrQkFBUSxXQUFXLE1BQU0sT0FBTyxJQUFJLFdBQVcsQ0FBQyxHQUFHLGNBQWM7QUFBQSxRQUNuRSxDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQ0QsVUFBSSxRQUFTLE1BQUssVUFBVTtBQUM1QixhQUFPO0FBQUEsSUFDVCxTQUFTLE9BQU87QUFDZCxVQUFJLGlCQUFpQixZQUFZO0FBRS9CLGdCQUFRLEtBQUssV0FBVyxHQUFHLHFCQUFxQixpQkFBaUIsR0FBSSxtQkFBbUI7QUFDeEYsd0JBQWdCLFFBQVE7QUFBQSxNQUMxQjtBQUVBLGFBQU8saUJBQWlCLG1CQUFtQixTQUFZO0FBQUEsSUFDekQsVUFBRTtBQUNBLG1CQUFhLEtBQUs7QUFFbEIsVUFBSSxTQUFTLFdBQVksTUFBSyxVQUFVO0FBQUEsSUFDMUM7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFdBQVksR0FBbUI7QUFDN0IsVUFBTSxLQUFLLEtBQUssQ0FBQztBQUNqQixxQkFBaUI7QUFDakIsUUFBSSxJQUFJO0FBQ04sNEJBQXNCLEVBQUU7QUFDeEIsMkJBQXFCLEVBQUUsRUFBRSxNQUFNLE1BQU07QUFBQSxNQUFDLENBQUM7QUFBQSxJQUN6QztBQUNBLE1BQUU7QUFDRixTQUFLLFVBQVU7QUFBQSxFQUNqQjtBQUFBO0FBQUEsRUFHQSxVQUFXLEdBQW1CO0FBQzVCLFFBQUksRUFBRSxZQUFZLFFBQVMsUUFBTyxLQUFLLGVBQWUsQ0FBQztBQUN2RCxRQUFJLEVBQUUsWUFBWSxRQUFTLFFBQU8sS0FBSyxlQUFlLENBQUM7QUFDdkQsV0FBTyxLQUFLLGVBQWUsQ0FBQztBQUFBLEVBQzlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxNQUFNLHFCQUFzQixHQUFtQixRQUF3QixPQUFPLE9BQU87QUFDbkYsVUFBTSxLQUFLLEtBQUssQ0FBQztBQUNqQixRQUFJLENBQUMsR0FBSTtBQUNULFFBQUksUUFBUSxVQUFVLEVBQUUsVUFBVSxNQUFNLG9CQUFvQixFQUFFLEVBQUUsTUFBTSxNQUFNLElBQUk7QUFDaEYsUUFBSSxDQUFDLE9BQU87QUFJVixjQUFRLE1BQU0sV0FBVztBQUN6QixVQUFJLENBQUMsTUFBTztBQUVaLFVBQUksQ0FBQyxVQUFVLE9BQU8sRUFBRSxHQUFHO0FBQ3pCLGFBQUssU0FBUyxxQkFBcUIsRUFBRSxJQUFJLFlBQVksRUFBRSxJQUFJO0FBQzNEO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxRQUFJLENBQUMsV0FBVyxTQUFTLEtBQUssT0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFHLHVCQUFzQixJQUFJLE1BQU0sV0FBVyxNQUFNLGFBQWEsRUFBRSxJQUFJO0FBQ3JILG1CQUFlLEVBQUU7QUFDakIsVUFBTSxTQUFTLE1BQU0sS0FBSyxhQUFhLEdBQUcsTUFBTSxRQUFRLElBQUk7QUFDNUQsUUFBSSxnQkFBZ0IsWUFBWSxJQUFJO0FBRWxDLHNCQUFnQixXQUFXO0FBQzNCLFlBQU0sYUFBYSxFQUFFO0FBQUEsSUFDdkI7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsTUFBTSxXQUFZLEdBQW1CLE9BQU8sT0FBTztBQUNqRCxVQUFNLEtBQUssa0JBQWtCLEVBQUUsS0FBSyxVQUFVLEVBQUUsVUFBVSxNQUFNLEVBQUUsS0FBSyxJQUFJO0FBQUEsRUFDN0U7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxNQUFNLGtCQUFtQixPQUE2QixNQUFNLE9BQU8sT0FBTyxRQUFRLElBQUksT0FBTyxPQUFPO0FBQ2xHLFVBQU0sS0FBSyxPQUFPO0FBQ2xCLFFBQUksQ0FBQyxTQUFTLENBQUMsR0FBSTtBQUNuQixTQUFLLFNBQVM7QUFDZCxvQkFBZ0IsSUFBSSxPQUFPLFFBQVEsTUFBTTtBQUV6QyxRQUFJLENBQUMsV0FBVyxTQUFTLEtBQUssT0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFHLHVCQUFzQixJQUFJLE1BQU0sV0FBVyxNQUFNLGFBQWEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzdILFVBQU0sS0FBSyxJQUFJLEtBQUssWUFBWTtBQUM5QixzQkFBZ0IsSUFBSSxNQUFNLE1BQU07QUFDaEMsWUFBTSxxQkFBcUIsRUFBRTtBQUM3Qix5QkFBbUIsRUFBRTtBQUNyQiwwQkFBb0IsRUFBRTtBQUN0QixZQUFNLHFCQUFxQixFQUFFO0FBQzdCLGFBQU87QUFBQSxJQUNULEdBQUcsSUFBSTtBQUNQLFFBQUksZ0JBQWdCLFlBQVksR0FBSSxPQUFNLGFBQWEsRUFBRTtBQUFBLEVBQzNEO0FBQUEsRUFFQSxNQUFNLGVBQWdCLEdBQW1CO0FBR3ZDLFVBQU0sU0FBUyxLQUFLLE9BQU8sTUFBTTtBQUNqQyxRQUFJLEVBQUUsVUFBVSxPQUFPLFFBQVEsT0FBTyxPQUFPO0FBQzNDLFdBQUssVUFBVTtBQUNmO0FBQUEsSUFDRjtBQUNBLFFBQUksRUFBRSxNQUFPLGlCQUFnQixFQUFFLE1BQU0sSUFBSSxNQUFNO0FBRy9DLFFBQUksRUFBRSxXQUFXLFlBQVksRUFBRSxVQUFVLEVBQUUsTUFBTyxRQUFPLEtBQUsscUJBQXFCLEdBQUcsRUFBRSxRQUFRLElBQUk7QUFFcEcsVUFBTSxPQUFPLGFBQWEsRUFBRSxLQUFLO0FBQ2pDLFFBQUksRUFBRSxTQUFTLFFBQVEsaUJBQWlCLEtBQUssQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQ2xFLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLEtBQUssU0FBUyxPQUFPLFNBQVMsVUFBVTtBQUNyRSxZQUFNLEtBQUssRUFBRSxNQUFNO0FBQ25CLFVBQUksU0FBd0IsRUFBRSxJQUFJLE9BQU8sS0FBSyxjQUFjO0FBRTVELFlBQU0sS0FBSyxJQUFJLEVBQUUsS0FBSyxZQUFZO0FBQ2hDLGlCQUFTLE1BQU0sZUFBZSxFQUFFLE1BQU0sT0FBTyxFQUFFLE1BQU0sWUFBWSxFQUFFLFlBQVksV0FBVyxHQUFHLENBQUM7QUFDOUYsZUFBTyxPQUFPO0FBQUEsTUFDaEIsQ0FBQztBQUNELFVBQUksVUFBVSxFQUFFLE1BQU0sT0FBUSxRQUFPO0FBQ3JDLFVBQUksT0FBTyxHQUFJLFFBQU87QUFDdEIsVUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHO0FBQzlCLGtCQUFVLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDeEIsYUFBSyxTQUFTLE9BQU8sUUFBUSxZQUN6Qix1QkFDQSxVQUFVLEVBQUUsSUFBSTtBQUFBLE1BQ3RCO0FBQUEsSUFDRjtBQUdBLFVBQU0sU0FBUyxFQUFFLE9BQVEsQ0FBQyxFQUFFLE9BQU8sVUFBVSxFQUFFLE9BQVEsTUFBTSxLQUFLLGFBQWEsR0FBRyxJQUFJLElBQUksTUFBTSxLQUFLLGFBQWEsQ0FBQztBQUNuSCxRQUFJLFdBQVcsTUFBTyxNQUFLLGVBQWU7QUFDMUMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsVUFBVyxHQUFtQixRQUF5QyxNQUFjO0FBQ25GLFVBQU0sVUFBZ0QsQ0FBQztBQUN2RCxRQUFJLFdBQVcsV0FBVyxFQUFFLE9BQU8sT0FBUSxTQUFRLEtBQUssRUFBRSxJQUFJLFNBQVMsT0FBTyxjQUFjLENBQUM7QUFDN0YsUUFBSSxXQUFXLGdCQUFnQixFQUFFLFVBQVUsS0FBSyxDQUFDLEdBQUksU0FBUSxLQUFLLEVBQUUsSUFBSSxhQUFhLE9BQU8saUJBQWlCLENBQUM7QUFDOUcsUUFBSSxXQUFXLFdBQVcsYUFBYSxDQUFDLEVBQUUsU0FBUyxTQUFVLFNBQVEsS0FBSyxFQUFFLElBQUksU0FBUyxPQUFPLGtCQUFrQixDQUFDO0FBQ25ILFlBQVEsS0FBSyxFQUFFLElBQUksY0FBYyxPQUFPLGVBQWUsQ0FBQztBQUN4RCxTQUFLLGVBQWUsRUFBRSxNQUFNLFFBQVE7QUFDcEMsU0FBSyxvQkFBb0I7QUFBQSxFQUMzQjtBQUFBO0FBQUEsRUFHQSxnQkFBaUIsSUFBWTtBQUMzQixVQUFNLElBQUksS0FBSztBQUNmLFNBQUssZUFBZTtBQUNwQixRQUFJLE9BQU8sY0FBYztBQUN2QixXQUFLLGVBQWU7QUFDcEI7QUFBQSxJQUNGO0FBQ0EsUUFBSSxDQUFDLEVBQUc7QUFDUixRQUFJLE9BQU8sUUFBUyxRQUFPLEtBQUssYUFBYSxHQUFHLE9BQU87QUFDdkQsUUFBSSxPQUFPLFlBQWEsUUFBTyxLQUFLLHFCQUFxQixDQUFDO0FBQzFELFFBQUksT0FBTyxRQUFTLFFBQU8sS0FBSyxhQUFhLENBQUM7QUFBQSxFQUNoRDtBQUFBLEVBRUEsa0JBQW1CO0FBQ2pCLFNBQUssZUFBZTtBQUFBLEVBQ3RCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsYUFBYyxHQUFtQixPQUE2QixPQUFPLE9BQU87QUFDMUUsVUFBTSxLQUFLLEtBQUssQ0FBQztBQUNqQixRQUFJLENBQUMsTUFBTyxDQUFDLEVBQUUsVUFBVSxDQUFDLFNBQVMsVUFBVSxTQUFXO0FBQ3hELFFBQUksU0FBUyxDQUFDLEtBQU0saUJBQWdCLElBQUksVUFBVSxVQUFVLFVBQVUsS0FBSztBQUMzRSxXQUFPLFFBQVEsUUFBUSxLQUFLLElBQUksRUFBRSxLQUFLLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssWUFBVTtBQUV0RyxVQUFJLFdBQVcsU0FBUyxTQUFTLENBQUMsTUFBTTtBQUN0QyxhQUFLO0FBQUEsVUFBVTtBQUFBLFVBQUcsVUFBVSxVQUFVLFVBQVU7QUFBQSxVQUM5QyxVQUFVLFVBQVUsa0NBQWtDO0FBQUEsUUFBa0M7QUFBQSxNQUM1RjtBQUNBLGFBQU87QUFBQSxJQUNULENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQSxFQUdBLGNBQWUsR0FBMEM7QUFDdkQsUUFBSSxFQUFFLEtBQUs7QUFDVCxZQUFNLFlBQVksYUFBYSxFQUFFLEdBQUc7QUFDcEMsWUFBTSxRQUFRLEVBQUUsTUFBTSxLQUFLLE9BQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNwRSxhQUFPLFNBQVMsWUFBWSxFQUFFLEdBQUc7QUFBQSxJQUNuQztBQUNBLFFBQUksRUFBRSxLQUFNLFFBQU8sZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxVQUFVO0FBQy9ELFdBQU8sRUFBRSxNQUFNLENBQUMsS0FBSztBQUFBLEVBQ3ZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsTUFBTSwyQkFBNEIsR0FBbUIsT0FBbUIsU0FBUyxNQUFvQztBQUNuSCxVQUFNLEtBQUssRUFBRSxPQUFPLE1BQU0sRUFBRTtBQUM1QixRQUFJLFNBQXdCLEVBQUUsSUFBSSxPQUFPLEtBQUssY0FBYztBQUU1RCxVQUFNLE9BQU8sQ0FBQyxDQUFDLEtBQUs7QUFDcEIsUUFBSSxVQUFVLE1BQU0sQ0FBQyxLQUFNLGlCQUFnQixJQUFJLEtBQUs7QUFDcEQsUUFBSSxNQUFNLFNBQVMsVUFBVTtBQUMzQixZQUFNLEtBQUssSUFBSSxFQUFFLEtBQUssWUFBWTtBQUNoQyxpQkFBUyxNQUFNLGVBQWUsRUFBRSxNQUFNLE1BQU0sTUFBTSxPQUFPLEVBQUUsTUFBTSxZQUFZLEVBQUUsWUFBWSxXQUFXLEdBQUcsQ0FBQztBQUMxRyxZQUFJLE9BQU8sTUFBTSxJQUFJO0FBQ25CLDJCQUFpQixFQUFFO0FBQ25CLGdDQUFzQixFQUFFO0FBQUEsUUFDMUI7QUFDQSxlQUFPLE9BQU87QUFBQSxNQUNoQixDQUFDO0FBQ0QsVUFBSSxPQUFPLEdBQUksUUFBTztBQUFBLElBQ3hCO0FBQ0EsUUFBSSxLQUFNO0FBQ1YsVUFBTSxVQUFVLENBQUMsT0FBTyxNQUFNLE9BQU8sUUFBUTtBQUM3QyxRQUFJLFFBQVE7QUFDVixXQUFLLFNBQVM7QUFDZCxXQUFLLFVBQVUsR0FBRyxTQUFTLFVBQVUsdUJBQXVCLDJCQUEyQjtBQUN2RixhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksUUFBUyxNQUFLLFNBQVM7QUFDM0IsUUFBSTtBQUNKLFFBQUksRUFBRSxPQUFPLE9BQVEsVUFBUyxNQUFNLEtBQUssYUFBYSxHQUFHLFFBQVcsSUFBSTtBQUFBLGFBQy9ELEVBQUUsT0FBUSxVQUFTLE1BQU0sS0FBSyxxQkFBcUIsR0FBRyxFQUFFLFFBQVEsSUFBSTtBQUM3RSxRQUFJLFdBQVcsS0FBTSxNQUFLLGVBQWU7QUFDekMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLGFBQWMsR0FBbUIsT0FBTyxPQUFPLFNBQVMsTUFBTTtBQUM1RCxRQUFJLFFBQVEsVUFBVSxLQUFLLENBQUMsQ0FBQyxNQUFNLE9BQVEsUUFBTztBQUVsRCxRQUFJLENBQUMsUUFBUSxpQkFBaUIsR0FBRztBQUMvQixhQUFPLEtBQUssMkJBQTJCLEdBQUcsS0FBSyxjQUFjLENBQUMsR0FBRyxNQUFNO0FBQUEsSUFDekU7QUFFQSxRQUFJLFFBQVEsaUJBQWlCLEtBQUssRUFBRSxPQUFPLE9BQVEsUUFBTyxLQUFLLGFBQWEsR0FBRyxRQUFXLElBQUk7QUFDOUYsVUFBTSxXQUFXLEtBQUssY0FBYyxDQUFDO0FBQ3JDLFFBQUksQ0FBQyxVQUFVO0FBR2IsV0FBSyxTQUFTLEdBQUcsRUFBRSxJQUFJO0FBRXZCO0FBQUEsSUFDRjtBQUNBLFVBQU0sS0FBSyxFQUFFLE9BQU8sTUFBTSxFQUFFO0FBQzVCLFFBQUksTUFBTSxDQUFDLEtBQU0saUJBQWdCLElBQUksS0FBSztBQUMxQyxXQUFPLEtBQUssSUFBSSxFQUFFLEtBQUssWUFBWTtBQUNqQyxVQUFJLEVBQUUsY0FBYyxDQUFDLE1BQU07QUFDekIsOEJBQXNCLEVBQUUsVUFBVTtBQUNsQyw0QkFBb0IsRUFBRSxVQUFVO0FBQUEsTUFDbEM7QUFDQSxVQUFJLE1BQU0scUJBQXFCLFVBQVUsRUFBRSxHQUFHO0FBQzVDLFlBQUksUUFBUSxFQUFFLGNBQWMsVUFBVSxFQUFFLE1BQU0sUUFBUTtBQUNwRCxnQ0FBc0IsRUFBRSxVQUFVO0FBQ2xDLDhCQUFvQixFQUFFLFVBQVU7QUFBQSxRQUNsQztBQUNBLGVBQU87QUFBQSxNQUNUO0FBQ0EsYUFBTyxTQUFTLENBQUMsTUFBTSxVQUFVLEVBQUUsTUFBTSxVQUFVLGlCQUFpQixHQUFHLFFBQVcsSUFBSSxJQUFJO0FBQUEsSUFDNUYsR0FBRyxJQUFJO0FBQUEsRUFDVDtBQUFBLEVBRUEsZUFBZ0IsR0FBbUI7QUFDakMsUUFBSSxFQUFFLFFBQVE7QUFDWixXQUFLLFVBQVU7QUFDZjtBQUFBLElBQ0Y7QUFDQSxXQUFPLEtBQUssYUFBYSxHQUFHLE9BQU8sS0FBSztBQUFBLEVBQzFDO0FBQUEsRUFFQSxlQUFnQixHQUFtQjtBQUNqQyxVQUFNLE1BQU0sRUFBRTtBQUNkLFFBQUksQ0FBQyxJQUFLO0FBQ1YsWUFBUSxJQUFJLFFBQVE7QUFBQSxNQUNsQixLQUFLLFFBQVE7QUFDWCxjQUFNLE1BQU0sYUFBYSxHQUFHLFdBQVcsVUFBVSxDQUFDLENBQUMsV0FBVyxPQUFPO0FBQ3JFLFlBQUksSUFBSSxTQUFTLFNBQVM7QUFDeEIsaUJBQU8sS0FBSyxJQUFJLEVBQUUsS0FBSyxZQUFZO0FBQ2pDLGtCQUFNLHFCQUFxQixJQUFJLFNBQVM7QUFDeEMsbUJBQU87QUFBQSxVQUNULENBQUM7QUFBQSxRQUNIO0FBQ0EsWUFBSSxJQUFJLFNBQVMsV0FBVztBQUMxQixlQUFLLGNBQWM7QUFDbkIsZUFBSyxnQkFBZ0I7QUFDckI7QUFBQSxRQUNGO0FBQ0EsZUFBTyxLQUFLLGFBQWEsR0FBRyxPQUFPLEtBQUs7QUFBQSxNQUMxQztBQUFBLE1BQ0EsS0FBSztBQUNILFlBQUksQ0FBQyxJQUFJLE9BQVE7QUFDakIsYUFBSyxlQUFlLElBQUk7QUFDeEIsYUFBSyxjQUFjO0FBQ25CO0FBQUEsTUFDRixLQUFLO0FBRUgsWUFBSSxJQUFJLFFBQVEsV0FBWSxRQUFPLEtBQUssV0FBVyxDQUFDO0FBQ3BELGFBQUssU0FBUyxHQUFHLElBQUksSUFBSTtBQUFBLElBRTdCO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxhQUFjLFVBQTBCO0FBQzVDLFVBQU0sS0FBSyxJQUFJLFdBQVcsU0FBUyxNQUFNLElBQUksTUFBTSxxQkFBcUIsUUFBUSxDQUFDO0FBQUEsRUFDbkY7QUFBQTtBQUFBLEVBSUEsS0FBTSxHQUFtQjtBQUN2QixRQUFJLENBQUMsS0FBSyxTQUFTO0FBQ2pCLFdBQUssY0FBYztBQUNuQixXQUFLLGdCQUFnQjtBQUNyQjtBQUFBLElBQ0Y7QUFDQSxVQUFNLFdBQVcsRUFBRSxLQUFLLFdBQ3RCLGVBQWUsTUFBTSxLQUFLLE9BQUssRUFBRSxjQUFjLEVBQUUsVUFBVSxHQUFHLGFBQWE7QUFDN0UsU0FBSyxnQkFBZ0I7QUFDckIsU0FBSyxXQUFXLFdBQVcsS0FBTSxFQUFFLFFBQVE7QUFDM0MsU0FBSyxhQUFhO0FBQUEsRUFDcEI7QUFBQSxFQUVBLGFBQWM7QUFDWixVQUFNLFVBQVUsS0FBSztBQUNyQixTQUFLLGNBQWM7QUFDbkIsUUFBSSxRQUFTLE1BQUssS0FBSyxPQUFPO0FBQzlCLFVBQU0sT0FBTyxLQUFLO0FBQ2xCLFNBQUssY0FBYztBQUNuQixRQUFJLEtBQU0sTUFBSyxlQUFlLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRUEsT0FBUSxHQUFtQjtBQUN6QixlQUFXLEtBQUssRUFBRSxNQUFPLE1BQUssT0FBTyxTQUFTLHlCQUF5QixDQUFDO0FBQUEsRUFDMUU7QUFBQSxFQUVBLGFBQWMsR0FBbUI7QUFDL0IsUUFBSSxDQUFDLEVBQUUsS0FBTTtBQUNiLFNBQUssZUFBZSxpQkFBaUIsVUFBVSxFQUFFLElBQUksRUFBRTtBQUN2RCxTQUFLLFlBQVksRUFBRSxNQUFNLE9BQU87QUFDaEMsU0FBSyxhQUFhLEVBQUU7QUFDcEIsU0FBSyxlQUFlO0FBQUEsRUFDdEI7QUFBQSxFQUVBLG1CQUFvQjtBQUNsQix5QkFBcUIsRUFBRSxNQUFNLE1BQU07QUFBQSxJQUFDLENBQUM7QUFBQSxFQUN2QztBQUFBLEVBRUEsTUFBTSxXQUFZLEdBQW1CO0FBQ25DLFFBQUksQ0FBQyxFQUFFLFFBQVE7QUFDYixVQUFJLEVBQUUsWUFBWSxRQUFTLE9BQU0sS0FBSyxhQUFhLENBQUM7QUFBQSxVQUMvQyxPQUFNLEtBQUssYUFBYSxDQUFDO0FBQzlCLFVBQUksZ0JBQWdCLE1BQU87QUFBQSxJQUM3QjtBQUNBLFNBQUssTUFBTSxPQUFPO0FBQ2xCLFVBQU0sT0FBTyxLQUFLLE9BQU8sUUFBUSx5QkFBeUIsRUFBRSxhQUFhLElBQUksWUFBWTtBQUN6RixVQUFNLFdBQVcsV0FBVyxhQUFhLFdBQVcsQ0FBQztBQUNyRCxRQUFJLEtBQUssT0FBTyxTQUFTLFlBQVksS0FBSyxPQUFPLFNBQVMsTUFBTTtBQUM5RCxXQUFLLFFBQVEsS0FBSyxFQUFFLE1BQU0sVUFBVSxLQUFLLENBQUMsRUFBRSxNQUFNLE1BQU07QUFBQSxNQUFDLENBQUM7QUFBQSxJQUM1RDtBQUFBLEVBQ0Y7QUFDRjtBQTNwQnFCLHNCQUFyQjtBQUFBLEVBREM7QUFBQSxHQUNvQjtBQUFyQjtBQUFBLEVBQU8sdUJBak9QO0FBQUE7IiwibmFtZXMiOltdfQ==