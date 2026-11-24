/* unplugin-vue-components disabled */import __unplugin_components_21 from "/src/components/common/AddInstanceDialog.vue";
import __unplugin_components_20 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_19 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_18 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_16 from "/src/components/ui/FrameIcon.vue";
import { VListItemTitle as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_10 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { visibleInterval } from "/src/util/visible-interval.ts";
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import PrinterEntriesMixin from "/src/mixins/printer-entries.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import FilesMixin from "/src/mixins/files.ts";
import { cloudPrinterConnection, cloudState, saveLayout } from "/src/services/muon-cloud/state.ts";
import { activationState } from "/src/services/muon-cloud/activate.ts";
import { bluetoothCarrying, wantsBluetoothFor } from "/src/services/muon-ble/link.ts";
import { discoverPrinters, discoveryState, lanAddresses, lanFetch, refreshCloudNearby, refreshKnownPrinters, refreshLanStatus } from "/src/services/muon-cloud/discovery.ts";
import { afterFirstPaint } from "/src/services/startup/idle.ts";
import { loadedRecord } from "/src/services/muon-cloud/status.ts";
import { jobPicture } from "/src/services/printers-page/pictures.ts";
import { foreignEntries, savedUpdates } from "/src/services/muon-cloud/directory.ts";
import { startNearby, stopNearby } from "/src/services/muon-ble/nearby.ts";
import { printerHomePath, foreignSlugForId } from "/src/services/printer-pages/index.ts";
import { saveSnapshotPrinters, snapshotPrinter } from "/src/services/startup/snapshot.ts";
import {
  needsYou,
  printersPage,
  RouteLabelHold
} from "/src/services/printers-page/model.ts";
import { shortDuration } from "/src/util/short-duration.ts";
import { eventTargetIsContentEditable } from "/src/util/event-helpers.ts";
import CloudAccountDialog from "/src/components/muon-cloud/CloudAccountDialog.vue";
import LinkPrinterDialog from "/src/components/muon-cloud/LinkPrinterDialog.vue";
import BluetoothSetupDialog from "/src/components/muon-ble/BluetoothSetupDialog.vue";
import AccessRequestDialog from "/src/components/muon-access/AccessRequestDialog.vue";
import PrintersHeader from "/src/components/printers/PrintersHeader.vue";
import PrintersSection from "/src/components/printers/PrintersSection.vue";
import PrinterBench from "/src/components/printers/PrinterBench.vue";
import BenchPrinter, {} from "/src/components/printers/BenchPrinter.vue";
import PrintersWelcome from "/src/components/printers/PrintersWelcome.vue";
import PrinterRouteProblem from "/src/components/muon-cloud/PrinterRouteProblem.vue";
import ScanResults from "/src/components/printers/ScanResults.vue";
import AddPrinterSheet from "/src/components/printers/AddPrinterSheet.vue";
import FoundList from "/src/components/printers/FoundList.vue";
import OfflineList from "/src/components/printers/OfflineList.vue";
import OtherPrinters from "/src/components/printers/OtherPrinters.vue";
import PrinterTileCard from "/src/components/printers/PrinterTileCard.vue";
import PrintingNowCard from "/src/components/printers/PrintingNowCard.vue";
import { liveForeign, loadForeign, connectAll, forget as forgetForeign } from "/src/services/foreign-printers/live.ts";
import { blocksForeignHttp } from "/src/util/browser-family.ts";
import { pageBlocksPrinter } from "/src/util/page-blocks-printer.ts";
const OTHER_ACTIONS = [{ id: "open", label: "Open" }, { id: "forget", label: "Forget" }];
const HEALTH_EVERY_MS = 15e3;
const STATUS_EVERY_MS = 3e3;
const VIEW_KEY = "muon3d.printers.view";
function readView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "list" || v === "bench" ? v : "cards";
  } catch {
    return "cards";
  }
}
const routeHold = new RouteLabelHold();
let Printers = class extends Mixins(PrinterEntriesMixin, BrowserMixin, FilesMixin) {
  query = "";
  /** A print control was just used: the next one waits a moment (a double click is one). */
  controlBusy = false;
  view = readView();
  /** The Bench's drawings draw themselves on the first arrival only, not on every refresh. */
  drawOn = true;
  newBench = "new-bench";
  otherActions = OTHER_ACTIONS;
  mixedContentNote = "Firefox and Safari block this page (https) from talking to a printer on plain http \u2014 that's mixed content. Chrome can reach printers on your network: open Control in Chrome.";
  addSheetOpen = false;
  dragging = null;
  dropTarget = null;
  renaming = null;
  /**
   * The name being typed, kept here rather than read back from the input: a re-render of the groups (a printer going
   * offline, under load) can recreate the input, which then held the old name, and Enter saved that (#362's e2e).
   */
  renameDraft = "";
  timer = null;
  /** Set on destroy, so a sweep still waiting for the first paint doesn't start. */
  gone = false;
  statusTimer = null;
  created() {
    window.setTimeout(() => {
      this.drawOn = false;
    }, 1500);
    loadForeign().then(() => connectAll()).catch(() => {
    });
    if (new URLSearchParams(location.search).get("addPrinter") === "1") this.instanceDialogOpen = true;
    refreshCloudNearby().catch(() => {
    });
    afterFirstPaint(() => {
      if (!this.gone) discoverPrinters(false, { nearby: false }).catch(() => {
      });
    });
    startNearby().catch(() => {
    });
    this.timer = visibleInterval(() => {
      refreshKnownPrinters().catch(() => {
      });
    }, HEALTH_EVERY_MS);
    this.statusTimer = visibleInterval(() => {
      refreshLanStatus().catch(() => {
      });
    }, STATUS_EVERY_MS);
    window.addEventListener("keydown", this.onDigit);
  }
  beforeDestroy() {
    this.gone = true;
    this.timer?.();
    this.statusTimer?.();
    window.removeEventListener("keydown", this.onDigit);
    stopNearby();
  }
  /** The printers in the groups, in the order shown, each once: 1 to 9 open them. */
  get numbered() {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const t of this.printingNow) {
      if (!seen.has(t.key)) {
        seen.add(t.key);
        out.push(t);
      }
    }
    for (const g of this.shownGroups) {
      for (const t of this.groupTiles[g.id]) {
        if (!seen.has(t.key)) {
          seen.add(t.key);
          out.push(t);
        }
      }
    }
    return out;
  }
  onDigit(event) {
    if (!this.$store.state.config.uiSettings.general.enableKeyboardShortcuts) return;
    if (event.ctrlKey || event.metaKey || event.altKey || eventTargetIsContentEditable(event)) return;
    if (!/^[1-9]$/.test(event.key)) return;
    const tile = this.numbered[Number(event.key) - 1];
    if (!tile) return;
    event.preventDefault();
    this.openEntry(tile.entry);
  }
  /** Opened from here, a printer's own page follows. */
  afterOpen() {
    this.$router.push(printerHomePath()).catch(() => {
    });
  }
  /** The print on the printer Fluidd is on now, from its own socket. */
  get activeJob() {
    if (!this.printerPrinting && !this.printerPaused) return null;
    const printer = this.$store.state.printer.printer;
    const estimates = this.$store.getters["printer/getTimeEstimates"];
    const left = (estimates.eta - Date.now()) / 1e3;
    return {
      file: printer.print_stats?.filename || null,
      progress: Math.floor(this.$store.getters["printer/getPrintProgress"] * 100),
      secondsLeft: left > 0 ? left : null,
      layer: this.$store.getters["printer/getPrintLayer"] || null,
      layers: this.$store.getters["printer/getPrintLayers"] || null,
      nozzle: typeof printer.extruder?.temperature === "number" ? Math.round(printer.extruder.temperature) : null,
      bed: typeof printer.heater_bed?.temperature === "number" ? Math.round(printer.heater_bed.temperature) : null,
      nozzleTarget: typeof printer.extruder?.target === "number" ? printer.extruder.target : null,
      bedTarget: typeof printer.heater_bed?.target === "number" ? printer.heater_bed.target : null,
      material: loadedRecord(printer.save_variables?.variables) ?? null
    };
  }
  get page() {
    const directory = {
      ...this.directory,
      foreign: foreignEntries(liveForeign.records.map((r) => ({ record: r, status: liveForeign.status[r.id] ?? null })))
    };
    return printersPage({
      directory,
      groups: this.account && !this.deletionPending ? cloudState.layout.groups : [],
      status: cloudState.status,
      activeJob: this.activeJob,
      signedIn: !!this.account,
      routeHold
    });
  }
  get mixedContentBlocked() {
    return blocksForeignHttp() && this.page.other.some((tile) => pageBlocksPrinter(`http://${tile.entry.host}`));
  }
  openForeign(tile) {
    const slug = foreignSlugForId(tile.entry.foreign.record.id);
    if (slug) this.$router.push(`/${slug}`).catch(() => {
    });
  }
  async forgetForeignPrinter(tile) {
    const name = tile.entry.foreign.record.name;
    if (await this.$confirm(`Control forgets ${name} in this browser.`, { title: `Forget ${name}?`, buttonTrueText: "Forget", danger: true })) {
      await forgetForeign(tile.entry.foreign.record.id);
    }
  }
  async refreshForeignPrinters() {
    const live = await import("/src/services/foreign-printers/live.ts");
    await live.refreshForeign();
    await live.connectAll();
  }
  /** The tiles kept for the next load's cached view (KAN-525), saved a second after the page settles. */
  snapshotTimer = 0;
  onPageSnapshot() {
    clearTimeout(this.snapshotTimer);
    this.snapshotTimer = window.setTimeout(() => {
      const tiles = [
        this.page.printingNow,
        this.page.groups.map((g) => g.tiles),
        this.page.found,
        this.page.offline
      ].flat(2);
      const seen = /* @__PURE__ */ new Set();
      saveSnapshotPrinters(tiles.filter((t) => t.key && !seen.has(t.key) && !!seen.add(t.key)).map(snapshotPrinter));
    }, 1e3);
  }
  /** "7 printers · 2 printing · 1 found on this network": one muted line. */
  get summary() {
    const c = this.page.counts;
    const parts = [c.printers === 1 ? "1 printer" : `${c.printers} printers`];
    if (c.printing) parts.push(`${c.printing} printing`);
    if (c.ready) parts.push(`${c.ready} ready`);
    if (c.needsYou) parts.push(`${c.needsYou} ${c.needsYou === 1 ? "needs" : "need"} you`);
    if (c.offline) parts.push(`${c.offline} offline`);
    if (c.found) parts.push(`${c.found} found on this network`);
    return parts.join(" \xB7 ");
  }
  /** What a search looks at: the name, the state in words, the line under it and the group. */
  matches(tile) {
    const q = this.query.trim().toLowerCase();
    if (!q) return true;
    const words = [tile.name, tile.label, tile.state, tile.detail, tile.groupName ?? "", tile.entry.host ?? "", needsYou(tile.state) ? "needs you" : ""];
    return words.join(" ").toLowerCase().includes(q);
  }
  /** Nothing saved, linked or found, signed in or not: the empty state helps find the first printer. */
  get showWelcome() {
    return this.page.welcome || !this.page.counts.printers && !this.page.found.length;
  }
  /** Printing and paused printers lead the page, and stay in their groups too, with their menu and drag. */
  get printingNow() {
    return this.page.printingNow.filter((t) => this.matches(t));
  }
  onPrinterCount(count) {
    if (count <= 1) this.query = "";
  }
  /** "next to finish: Walnut in 3m". */
  get nextToFinish() {
    const timed = this.printingNow.filter((t) => t.state === "printing" && t.job?.secondsLeft);
    if (timed.length < 2) return null;
    const next = timed.reduce((a, b) => a.job.secondsLeft <= b.job.secondsLeft ? a : b);
    return `next to finish: ${next.name} in ${shortDuration(next.job.secondsLeft)}`;
  }
  /** A group's printers matching the search. */
  filtered(tiles) {
    return tiles.filter((t) => this.matches(t));
  }
  /** Each group's printers matching the search, worked out once per change rather than on every render. */
  get groupTiles() {
    const tiles = {};
    for (const g of this.page.groups) tiles[g.id] = this.filtered(g.tiles);
    return tiles;
  }
  get shownGroups() {
    return this.page.groups.filter((g) => {
      if (this.groupTiles[g.id].length) return true;
      if (this.query) return false;
      return g.editable || g.id === "ungrouped" && !!this.dragging;
    });
  }
  /** "1 printing · 2 ready", and for your own groups how to rearrange them. */
  groupNote(g) {
    let note = g.tiles.length ? g.summary : "";
    if (g.editable && !this.isMobileViewport) note = [note, "drag printers in or out"].filter(Boolean).join(" \xB7 ");
    return note;
  }
  get foundShown() {
    return this.page.found.filter((t) => this.matches(t));
  }
  get otherShown() {
    return this.page.other.filter((t) => this.matches(t));
  }
  get offlineShown() {
    return this.page.offline.filter((t) => this.matches(t));
  }
  get anyShown() {
    return !!(this.printingNow.length || this.shownGroups.length || this.foundShown.length || this.otherShown.length || this.offlineShown.length);
  }
  foundActionsFor(tile) {
    return this.foundActions(tile.entry);
  }
  offlineActionsFor(tile) {
    return this.actionsFor(tile.entry);
  }
  onFoundRow(tile, id) {
    return this.onFoundAction(tile.entry, id);
  }
  connectSteps(tile) {
    const id = tile.entry.endpointId ?? tile.entry.nearby?.endpointId ?? "";
    if (!id || !wantsBluetoothFor(id)) return null;
    const at = bluetoothCarrying(id) ? 2 : activationState.switching === id ? 1 : 0;
    const names = [`Finding ${tile.name}`, "Connecting", "Opening"];
    return names.map((n, i) => i === at ? `[${n}]` : n).join(" > ");
  }
  onFoundCancel(tile) {
    this.cancelOpen(tile.entry);
  }
  onOfflineRow(tile, id) {
    return this.onAction(tile.entry, id);
  }
  dropHint(g) {
    if (g.id === "ungrouped") return "Drop a printer here to take it out of its group";
    return g.tiles.length ? "Drop a printer here" : "Drag printers here";
  }
  /** Grid or List, on every size. */
  get tileVariant() {
    return this.view === "list" ? "row" : "card";
  }
  get gridClass() {
    return `printers__grid printers__grid--${this.tileVariant}`;
  }
  /** Pause, resume or stop the print on the printer Fluidd is on, once per click however fast it is clicked. */
  control(action) {
    if (this.controlBusy) return;
    this.controlBusy = true;
    Promise.resolve(action.call(this)).catch(() => {
    }).finally(() => {
      window.setTimeout(() => {
        this.controlBusy = false;
      }, 1200);
    });
  }
  setView(view) {
    this.view = view;
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
    }
  }
  /**
   * The part's picture: for the printer Fluidd is on, from its own store;
   * for any other, read from that printer (on this network, or through
   * Muon3D) once per file.
   */
  thumbnailFor(tile) {
    if (tile.entry.active) {
      const file = this.$store.state.printer.printer.current_file;
      if (!file?.thumbnails?.length) return null;
      return this.getThumbUrl(file, "gcodes", file.path, true, file.modified) ?? null;
    }
    const filename = tile.job?.file;
    if (!filename) return null;
    const lan = tile.entry.lan;
    if (lan && !tile.remote) return jobPicture(`lan:${lan.apiUrl}`, filename, (path) => lanFetch(`${lan.apiUrl}${path}`));
    const cloud = tile.entry.cloud;
    if (cloud) return jobPicture(`cloud:${cloud.id}`, filename, async (path) => (await cloudPrinterConnection(cloud.id)).fetch(path));
    return null;
  }
  /** What Add a printer offers in one tap: the printers found here that it can open. */
  get foundChoices() {
    return this.page.found.filter((t) => t.entry.row?.action === "open" && !!t.entry.host).map((t) => ({ key: t.key, name: t.name, detail: t.entry.host ?? t.detail }));
  }
  onPickFound(key) {
    const tile = this.page.found.find((t) => t.key === key);
    if (tile) this.openFoundEntry(tile.entry);
  }
  onFoundAction(e, id) {
    if (id === "set-up" || id === "nearby-info") return this.openFoundEntry(e);
    return this.onAction(e, id);
  }
  // -- groups (the account's, U6) --------------------------------------------
  get canGroup() {
    return !!this.account && !this.deletionPending;
  }
  persistGroups(groups) {
    saveLayout({ ...cloudState.layout, groups });
  }
  addGroup() {
    const id = `g${Date.now().toString(36)}`;
    const groups = cloudState.layout.groups;
    this.persistGroups([...groups, { id, name: `Group ${groups.length + 1}`, printers: [] }]);
    this.startRename(id);
  }
  startRename(id) {
    this.renaming = id;
    this.renameDraft = cloudState.layout.groups.find((g) => g.id === id)?.name ?? "";
    this.$nextTick(() => {
      const input = this.$refs.rename?.[0];
      input?.focus();
      input?.select();
    });
  }
  onRenameInput(event) {
    this.renameDraft = event.target.value;
  }
  finishRename(id) {
    if (this.renaming !== id) return;
    this.renaming = null;
    const name = this.renameDraft.trim();
    if (!name) return;
    this.persistGroups(cloudState.layout.groups.map((g) => g.id === id ? { ...g, name } : g));
  }
  removeGroup(id) {
    this.persistGroups(cloudState.layout.groups.filter((g) => g.id !== id));
  }
  onDragStart(tile) {
    this.dragging = tile.entry.cloud?.id ?? null;
  }
  onDragEnd() {
    this.dragging = null;
    this.dropTarget = null;
  }
  onDragOver(g) {
    if (this.dragging && (g.editable || g.id === "ungrouped")) this.dropTarget = g.id;
  }
  // -- the Bench --------------------------------------------------------------
  /**
   * Each printer's hover actions, by tile key: worked out once per change, not
   * on every render, for the benches, Offline and (as its one thing to do) Found.
   */
  get benchActionsByKey() {
    const actions = {};
    for (const g of this.page.groups) for (const t of g.tiles) actions[t.key] = this.benchActions(t);
    for (const t of this.page.offline) actions[t.key] = this.benchActions(t);
    for (const t of this.page.found) actions[t.key] = this.foundOne(t);
    return actions;
  }
  /**
   * On hover: Open, and what the printer most likely wants next, where Control can do it.
   * An offline printer also has what its Grid tile has: Remove, and Retry Bluetooth.
   */
  benchActions(tile) {
    const actions = [{ id: "open", label: "Open" }];
    if (tile.entry.active && tile.state === "printing") actions.push({ id: "pause", label: "Pause", disabled: this.controlBusy });
    else if (tile.entry.active && tile.state === "paused") actions.push({ id: "resume", label: "Resume", disabled: this.controlBusy });
    if (tile.state === "offline") {
      for (const a of this.actionsFor(tile.entry)) {
        if (a.id === "remove" || a.id === "retry-bluetooth") actions.push({ id: a.id, label: a.label, disabled: a.disabled });
      }
    }
    return actions;
  }
  onBenchAction(tile, id) {
    if (id === "open") return this.openEntry(tile.entry);
    if (id === "pause") return this.control(this.pausePrint);
    if (id === "resume") return this.control(this.resumePrint);
    return this.onAction(tile.entry, id);
  }
  onOtherAction(tile, id) {
    return id === "forget" ? this.forgetForeignPrinter(tile) : this.openForeign(tile);
  }
  /**
   * A printer found nearby that isn't yours has exactly one thing to do with
   * it: Set up a new one, Add one that is set up and linked to no one, or ask
   * the owner of one in another account.
   */
  foundOne(tile) {
    const e = tile.entry;
    if (e.row?.action === "set-up") return [{ id: "set-up", label: "Set up" }];
    const actions = this.foundActions(e);
    const ask = actions.find((a) => a.id === "ask");
    if (ask) return [{ id: "ask", label: "Ask its owner", disabled: ask.disabled }];
    const link = actions.find((a) => a.id === "link");
    if (link) return [{ id: "link", label: "Add", disabled: link.disabled }];
    const connect = actions.find((a) => a.id === "connect");
    if (connect) return [{ id: "connect", label: "Add", disabled: connect.disabled }];
    return [];
  }
  onDragOverNew() {
    if (this.dragging) this.dropTarget = this.newBench;
  }
  /** Dropped on "New bench": a new bench with this printer on it, named for renaming. */
  onDropNew() {
    const id = this.dragging;
    this.onDragEnd();
    if (!id) return;
    const groupId = `g${Date.now().toString(36)}`;
    const groups = cloudState.layout.groups.map((x) => ({ ...x, printers: x.printers.filter((p) => p !== id) }));
    this.persistGroups([...groups, { id: groupId, name: `Bench ${groups.length + 1}`, printers: [id] }]);
    this.startRename(groupId);
  }
  /** Into one of your groups, or out of them all onto Not in a group. */
  onDrop(g) {
    const id = this.dragging;
    this.onDragEnd();
    if (!id || !(g.editable || g.id === "ungrouped")) return;
    const groups = cloudState.layout.groups.map((x) => ({ ...x, printers: x.printers.filter((p) => p !== id) }));
    const target = groups.find((x) => x.id === g.id);
    if (target) target.printers.push(id);
    this.persistGroups(groups);
  }
  onFound() {
    for (const update of savedUpdates(this.savedInstances, discoveryState.found, !!discoveryState.blockedByPage)) {
      this.$store.dispatch("config/relocateInstance", update);
    }
  }
  get savedFound() {
    return discoveryState.found.map((l) => `${l.endpointId}@${lanAddresses(l).join(",")}`).join(";");
  }
};
__decorateClass([
  Watch("page")
], Printers.prototype, "onPageSnapshot", 1);
__decorateClass([
  Watch("page.counts.printers")
], Printers.prototype, "onPrinterCount", 1);
__decorateClass([
  Watch("savedFound", { immediate: true })
], Printers.prototype, "onFound", 1);
Printers = __decorateClass([
  Component({
    components: {
      DeletionNotice: () => import("/src/components/account/DeletionNotice.vue"),
      CloudAccountDialog,
      LinkPrinterDialog,
      BluetoothSetupDialog,
      AccessRequestDialog,
      PrintersHeader,
      PrintersSection,
      PrinterBench,
      BenchPrinter,
      PrintersWelcome,
      ScanResults,
      PrinterRouteProblem,
      AddPrinterSheet,
      FoundList,
      OfflineList,
      OtherPrinters,
      PrinterTileCard,
      PrintingNowCard
    }
  })
], Printers);
const _sfc_main = Printers;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "printers", class: { "printers--phone": _vm.isMobileViewport } }, [_vm.deletionPending ? _c("deletion-notice", { attrs: { "tid": "printers-deletion" } }) : _vm._e(), _vm.showWelcome ? _c("printers-welcome", { attrs: { "signed-in": !!_vm.account, "searching": _vm.searching, "network": _vm.scanNetwork || "", "bluetooth-search": _vm.bluetoothSearch, "bluetooth-off": _vm.bluetoothOff, "bluetooth-why": _vm.bluetoothWhy, "blocked-by-page": !!_vm.blockedByPage, "scanning": _vm.scanBusy }, on: { "rescan": _vm.rescan, "scan": _vm.onScan, "look-nearby": _vm.onLookNearby, "address": function($event) {
    _vm.instanceDialogOpen = true;
  }, "sign-in": function($event) {
    _vm.accountDialog = true;
  } } }) : [_c("printers-header", { attrs: { "summary": _vm.summary, "search": _vm.query, "view": _vm.view, "show-search": _vm.page.counts.printers > 1, "show-view": !!_vm.page.counts.printers, "bluetooth-search": _vm.bluetoothSearch, "bluetooth-off": _vm.bluetoothOff, "bluetooth-why": _vm.bluetoothWhy, "scanning": _vm.scanBusy }, on: { "update:search": function($event) {
    _vm.query = $event;
  }, "update:view": _vm.setView, "add": function($event) {
    _vm.addSheetOpen = true;
  }, "scan": _vm.onScan, "connect-bluetooth": _vm.onConnectOverBluetooth } }), _c("scan-results"), _vm.searching && !_vm.page.found.length ? _c("p", { staticClass: "printers__looking", attrs: { "data-tid": "printers-looking" } }, [_c(__unplugin_components_0, { attrs: { "indeterminate": "", "size": "11", "width": "2" } }), _vm._v(" Looking" + _vm._s(_vm.scanNetwork ? ` on ${_vm.scanNetwork}` : "") + " for printers\u2026 ")], 1) : _vm._e(), _vm.blockedByPage ? _c("p", { staticClass: "note", attrs: { "data-tid": "blocked-by-page" } }, [_vm._v(" This browser won't let this page reach printers by their IP address, because the page was opened by name. Add a printer by its name instead, as shown on its screen, such as muon-walnut-8987. ")]) : _vm._e(), _vm.printingNow.length && _vm.view !== "bench" ? _c("printers-section", { attrs: { "title": "Printing now", "count": _vm.printingNow.length, "note": _vm.nextToFinish || "", "data-tid": "printing-now" } }, [_vm.printingNow.length === 1 && !_vm.isMobileViewport ? _c("printing-now-card", { attrs: { "tile": _vm.printingNow[0], "variant": "wide", "thumbnail": _vm.thumbnailFor(_vm.printingNow[0]), "controllable": !!_vm.printingNow[0].entry.active, "busy": _vm.controlBusy }, on: { "open": function($event) {
    return _vm.openEntry(_vm.printingNow[0].entry);
  }, "pause": function($event) {
    return _vm.control(_vm.pausePrint);
  }, "resume": function($event) {
    return _vm.control(_vm.resumePrint);
  }, "stop": function($event) {
    return _vm.control(_vm.cancelPrint);
  } } }) : _c("div", { staticClass: "printers__now" }, _vm._l(_vm.printingNow, function(tile) {
    return _c("printing-now-card", { key: tile.key, attrs: { "tile": tile, "variant": "card", "thumbnail": _vm.thumbnailFor(tile), "controllable": !!tile.entry.active, "busy": _vm.controlBusy }, on: { "open": function($event) {
      return _vm.openEntry(tile.entry);
    }, "pause": function($event) {
      return _vm.control(_vm.pausePrint);
    }, "resume": function($event) {
      return _vm.control(_vm.resumePrint);
    }, "stop": function($event) {
      return _vm.control(_vm.cancelPrint);
    } } });
  }), 1)], 1) : _vm._e(), _vm.view === "bench" ? [_vm._l(_vm.shownGroups, function(g) {
    return _c("printer-bench", { key: g.id, attrs: { "bench-id": g.id, "kind": g.id === "shared" ? "shelf" : "bench", "title": g.name, "tiles": _vm.groupTiles[g.id], "over": _vm.dropTarget === g.id, "data-tid": `group-${g.id}` }, nativeOn: { "dragover": function($event) {
      $event.preventDefault();
      return _vm.onDragOver(g);
    }, "dragleave": function($event) {
      _vm.dropTarget = null;
    }, "drop": function($event) {
      $event.preventDefault();
      return _vm.onDrop(g);
    } }, scopedSlots: _vm._u([{ key: "title", fn: function() {
      return [_vm.renaming === g.id ? _c("input", { ref: "rename", refInFor: true, staticClass: "printers__rename", attrs: { "aria-label": "Bench name" }, domProps: { "value": _vm.renameDraft }, on: { "input": _vm.onRenameInput, "keydown": [function($event) {
        if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
        return _vm.finishRename(g.id);
      }, function($event) {
        if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
        _vm.renaming = null;
      }], "blur": function($event) {
        return _vm.finishRename(g.id);
      } } }) : _c("h2", { staticClass: "printers__bench-name" }, [_vm._v(" " + _vm._s(g.name) + " ")])];
    }, proxy: true }, { key: "actions", fn: function() {
      return [g.editable ? _c(__unplugin_components_1, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
        return [_c("button", _vm._g(_vm._b({ staticClass: "icon-btn", attrs: { "type": "button", "aria-label": "Bench options" } }, "button", attrs, false), on), [_c(__unplugin_components_2, { attrs: { "name": "more" } })], 1)];
      } }], null, true) }, [_c(__unplugin_components_3, { attrs: { "dense": "" } }, [_c(__unplugin_components_4, { on: { "click": function($event) {
        return _vm.startRename(g.id);
      } } }, [_c(__unplugin_components_5, [_vm._v("Rename")])], 1), _c(__unplugin_components_6, { on: { "click": function($event) {
        return _vm.removeGroup(g.id);
      } } }, [_c(__unplugin_components_7, { staticClass: "error--text" }, [_vm._v(" Remove bench ")])], 1)], 1)], 1) : _vm._e()];
    }, proxy: true }], null, true) }, _vm._l(_vm.groupTiles[g.id], function(tile) {
      return _c("bench-printer", { key: tile.key, attrs: { "tile": tile, "actions": _vm.benchActionsByKey[tile.key], "draggable": _vm.canGroup && !!tile.entry.cloud, "draw-on": _vm.drawOn }, on: { "open": function($event) {
        return _vm.openEntry(tile.entry);
      }, "action": function($event) {
        return _vm.onBenchAction(tile, $event);
      }, "dragstart": function($event) {
        return _vm.onDragStart(tile);
      }, "dragend": _vm.onDragEnd } });
    }), 1);
  }), _vm.canGroup && !_vm.query ? _c("div", { staticClass: "printers__new-bench", class: { "printers__new-bench--over": _vm.dropTarget === _vm.newBench }, attrs: { "role": "button", "tabindex": "0", "aria-label": "New bench", "data-tid": "new-bench" }, on: { "dragenter": function($event) {
    $event.preventDefault();
    return _vm.onDragOverNew.apply(null, arguments);
  }, "dragover": function($event) {
    $event.preventDefault();
    return _vm.onDragOverNew.apply(null, arguments);
  }, "dragleave": function($event) {
    _vm.dropTarget = null;
  }, "drop": function($event) {
    $event.preventDefault();
    return _vm.onDropNew.apply(null, arguments);
  }, "click": _vm.addGroup, "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    $event.preventDefault();
    return _vm.addGroup.apply(null, arguments);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "space", 32, $event.key, [" ", "Spacebar"])) return null;
    $event.preventDefault();
    return _vm.addGroup.apply(null, arguments);
  }] } }, [_c("svg", { attrs: { "viewBox": "0 0 300 40", "preserveAspectRatio": "none", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M6 12H294M22 12V38M278 12V38" } })]), _c("span", [_vm._v("+ New bench")]), _c("small", [_vm._v("Drop a printer here to start one")])]) : _vm._e(), _vm.foundShown.length ? _c("printer-bench", { attrs: { "bench-id": "found", "kind": "door", "title": "Other printers on your network", "caption": "Not on your account. Open one to use it, or add it to your account.", "tiles": _vm.foundShown, "searching": _vm.searching, "data-tid": "found" }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_vm.searching ? _c("span", { staticClass: "printers__looking" }, [_c(__unplugin_components_8, { attrs: { "indeterminate": "", "size": "11", "width": "2" } }), _vm._v(" Looking" + _vm._s(_vm.scanNetwork ? ` on ${_vm.scanNetwork}` : "") + "\u2026 ")], 1) : _vm._e()];
  }, proxy: true }], null, false, 2161974416) }, _vm._l(_vm.foundShown, function(tile) {
    return _c("bench-printer", { key: tile.key, attrs: { "tile": tile, "actions": _vm.benchActionsByKey[tile.key], "found": "", "draw-on": _vm.drawOn }, on: { "action": function($event) {
      return _vm.onFoundRow(tile, $event);
    } } });
  }), 1) : _vm._e(), _vm.otherShown.length && _vm.mixedContentBlocked ? _c("p", { staticClass: "foreign-warning" }, [_vm._v(" " + _vm._s(_vm.mixedContentNote) + " ")]) : _vm._e(), _vm.otherShown.length ? _c("printer-bench", { attrs: { "bench-id": "other", "kind": "shelf", "title": "Other brands", "icon": "printer", "tiles": _vm.otherShown, "data-tid": "other-printers" } }, _vm._l(_vm.otherShown, function(tile) {
    return _c("bench-printer", { key: tile.key, attrs: { "tile": tile, "actions": _vm.otherActions, "draw-on": _vm.drawOn }, on: { "open": function($event) {
      return _vm.openForeign(tile);
    }, "action": function($event) {
      return _vm.onOtherAction(tile, $event);
    } } });
  }), 1) : _vm._e(), _vm.offlineShown.length ? _c("printer-bench", { attrs: { "bench-id": "offline", "kind": "shelf", "icon": "printer", "title": "Offline", "tiles": _vm.offlineShown, "data-tid": "offline" } }, _vm._l(_vm.offlineShown, function(tile) {
    return _c("bench-printer", { key: tile.key, attrs: { "tile": tile, "actions": _vm.benchActionsByKey[tile.key], "draw-on": _vm.drawOn }, on: { "open": function($event) {
      return _vm.openEntry(tile.entry);
    }, "action": function($event) {
      return _vm.onBenchAction(tile, $event);
    } } });
  }), 1) : _vm._e()] : [_vm._l(_vm.shownGroups, function(g) {
    return _c("printers-section", { key: g.id, class: { "printers__section--drop": _vm.dropTarget === g.id }, attrs: { "count": _vm.groupTiles[g.id].length, "note": _vm.groupNote(g), "data-tid": `group-${g.id}` }, nativeOn: { "dragover": function($event) {
      $event.preventDefault();
      return _vm.onDragOver(g);
    }, "dragleave": function($event) {
      _vm.dropTarget = null;
    }, "drop": function($event) {
      $event.preventDefault();
      return _vm.onDrop(g);
    } }, scopedSlots: _vm._u([{ key: "title", fn: function() {
      return [_vm.renaming === g.id ? _c("input", { ref: "rename", refInFor: true, staticClass: "printers__rename", attrs: { "aria-label": "Group name" }, domProps: { "value": _vm.renameDraft }, on: { "input": _vm.onRenameInput, "keydown": [function($event) {
        if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
        return _vm.finishRename(g.id);
      }, function($event) {
        if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
        _vm.renaming = null;
      }], "blur": function($event) {
        return _vm.finishRename(g.id);
      } } }) : _c("h2", { staticClass: "printers__group-name" }, [_vm._v(" " + _vm._s(g.name) + " ")])];
    }, proxy: true }, { key: "actions", fn: function() {
      return [g.editable ? _c(__unplugin_components_9, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
        return [_c("button", _vm._g(_vm._b({ staticClass: "icon-btn", attrs: { "type": "button", "aria-label": "Group options" } }, "button", attrs, false), on), [_c(__unplugin_components_10, { attrs: { "name": "more" } })], 1)];
      } }], null, true) }, [_c(__unplugin_components_11, { attrs: { "dense": "" } }, [_c(__unplugin_components_12, { on: { "click": function($event) {
        return _vm.startRename(g.id);
      } } }, [_c(__unplugin_components_13, [_vm._v("Rename")])], 1), _c(__unplugin_components_14, { on: { "click": function($event) {
        return _vm.removeGroup(g.id);
      } } }, [_c(__unplugin_components_15, { staticClass: "error--text" }, [_vm._v(" Remove group ")])], 1)], 1)], 1) : _vm._e()];
    }, proxy: true }], null, true) }, [_c("div", { class: _vm.gridClass }, [_vm._l(_vm.groupTiles[g.id], function(tile) {
      return _c("printer-tile-card", { key: tile.key, attrs: { "tile": tile, "variant": _vm.tileVariant, "stage-height": 150, "actions": _vm.actionsFor(tile.entry), "busy": _vm.busyKey === tile.key, "draggable": _vm.canGroup && !!tile.entry.cloud }, on: { "open": function($event) {
        return _vm.openEntry(tile.entry);
      }, "action": function($event) {
        return _vm.onAction(tile.entry, $event);
      }, "dragstart": function($event) {
        return _vm.onDragStart(tile);
      }, "dragend": _vm.onDragEnd } });
    }), (g.editable || g.id === "ungrouped") && (_vm.dragging || !g.tiles.length) ? _c("div", { staticClass: "drop-hint" }, [_c(__unplugin_components_16, { attrs: { "name": "plus" } }), _c("span", [_vm._v(_vm._s(_vm.dropHint(g)))])], 1) : _vm._e()], 2)]);
  }), _vm.foundShown.length ? _c("printers-section", { attrs: { "title": "Other printers on your network", "count": _vm.foundShown.length, "data-tid": "found" }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_vm.searching ? _c("span", { staticClass: "printers__looking" }, [_c(__unplugin_components_17, { attrs: { "indeterminate": "", "size": "11", "width": "2" } }), _vm._v(" Looking" + _vm._s(_vm.scanNetwork ? ` on ${_vm.scanNetwork}` : "") + "\u2026 ")], 1) : _vm._e()];
  }, proxy: true }], null, false, 2161974416) }, [_c("found-list", { attrs: { "tiles": _vm.foundShown, "actions-for": _vm.foundActionsFor, "busy-key": _vm.busyKey, "steps-for": _vm.connectSteps }, on: { "action": _vm.onFoundRow, "cancel": _vm.onFoundCancel } })], 1) : _vm._e(), _vm.otherShown.length ? _c("printers-section", { attrs: { "title": "Other brands", "count": _vm.otherShown.length, "note": "Not M1s, saved in this browser only. They never go through Muon3D's servers.", "data-tid": "other-printers" } }, [_vm.mixedContentBlocked ? _c("p", { staticClass: "foreign-warning" }, [_vm._v(" " + _vm._s(_vm.mixedContentNote) + " ")]) : _vm._e(), _c("other-printers", { attrs: { "tiles": _vm.otherShown }, on: { "open": _vm.openForeign, "forget": _vm.forgetForeignPrinter } })], 1) : _vm._e(), _vm.offlineShown.length ? _c("printers-section", { attrs: { "title": "Offline", "count": _vm.offlineShown.length, "muted": "", "data-tid": "offline" } }, [_c("offline-list", { attrs: { "tiles": _vm.offlineShown, "actions-for": _vm.offlineActionsFor }, on: { "action": _vm.onOfflineRow } })], 1) : _vm._e()], !_vm.deletionPending && _vm.query && !_vm.anyShown ? _c("div", { staticClass: "printers__none", attrs: { "data-tid": "printers-none" } }, [_c("span", { staticClass: "printers__none-icon" }, [_c(__unplugin_components_18, { attrs: { "name": "search" } })], 1), _c("b", [_vm._v('No printer matches "' + _vm._s(_vm.query) + '"')]), _c("span", [_vm._v("Search looks at a printer's name, state and group.")]), _c("button", { staticClass: "btn btn--sm", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.query = "";
  } } }, [_vm._v(" Clear search ")])]) : _vm._e(), !_vm.account ? _c("div", { staticClass: "inset" }, [_c(__unplugin_components_19, { attrs: { "name": "cloud" } }), _c("span", { staticClass: "inset__text" }, [_vm._v(" Sign in to reach these from anywhere, sort them into groups and hear when a print finishes. "), _c("span", { staticClass: "dim" }, [_vm._v("Optional.")])]), _c("button", { staticClass: "btn btn--sm", attrs: { "type": "button", "data-tid": "sign-in" }, on: { "click": function($event) {
    _vm.accountDialog = true;
  } } }, [_vm._v(" Sign in ")])], 1) : _vm._e(), _vm.canGroup && _vm.view !== "bench" ? _c("button", { staticClass: "new-group", attrs: { "type": "button", "data-tid": "new-group" }, on: { "click": _vm.addGroup } }, [_c(__unplugin_components_20, { attrs: { "name": "plus", "small": "" } }), _vm._v(" New group ")], 1) : _vm._e()], _vm.notice ? _c("p", { staticClass: "note" }, [_vm._v(" " + _vm._s(_vm.notice) + " "), _vm.noticeLink ? _c("a", { attrs: { "href": _vm.noticeLink, "data-tid": "notice-link" } }, [_vm._v(_vm._s(_vm.noticeLink))]) : _vm._e()]) : _vm._e(), _c("printer-route-problem", { attrs: { "problem": _vm.routeProblem, "ask": _vm.askMuonLocal }, on: { "choose": _vm.onProblemChoice, "cancel": _vm.cancelMuonLocal } }), _vm.nearby.error ? _c("div", { staticClass: "note note--error", attrs: { "data-tid": "nearby-error" } }, [_c("p", { staticClass: "note__line" }, [_vm._v(" " + _vm._s(_vm.nearby.error) + " "), _c("button", { staticClass: "note__retry", attrs: { "type": "button", "data-tid": "nearby-retry" }, on: { "click": _vm.onLookNearby } }, [_vm._v(" Try again ")])]), _vm.nearby.errorDetail ? _c("details", { staticClass: "note__details" }, [_c("summary", [_vm._v("Details")]), _c("code", [_vm._v(_vm._s(_vm.nearby.errorDetail))])]) : _vm._e()]) : _vm._e(), _vm.activationError ? _c("p", { staticClass: "note note--error" }, [_vm._v(" " + _vm._s(_vm.activationError) + " "), _vm.activationFallback ? [_c("a", { attrs: { "href": _vm.activationFallback } }, [_vm._v("Open the printer's own page")]), _vm._v(" instead. ")] : _vm._e()], 2) : _vm._e(), _c("add-printer-sheet", { attrs: { "bluetooth-search": _vm.bluetoothSearch, "bluetooth-off": _vm.bluetoothOff, "bluetooth-why": _vm.bluetoothWhy, "searching": _vm.searching, "network": _vm.scanNetwork || "", "found": _vm.page.found.length }, on: { "look-nearby": function($event) {
    _vm.addSheetOpen = false;
    _vm.onLookNearby();
  }, "rescan": _vm.rescan, "address": function($event) {
    _vm.addSheetOpen = false;
    _vm.instanceDialogOpen = true;
  } }, model: { value: _vm.addSheetOpen, callback: function($$v) {
    _vm.addSheetOpen = $$v;
  }, expression: "addSheetOpen" } }), _vm.instanceDialogOpen ? _c(__unplugin_components_21, { attrs: { "found": _vm.foundChoices, "searching": _vm.searching }, on: { "resolve": _vm.openInstance, "pick": _vm.onPickFound, "saved": _vm.refreshForeignPrinters }, model: { value: _vm.instanceDialogOpen, callback: function($$v) {
    _vm.instanceDialogOpen = $$v;
  }, expression: "instanceDialogOpen" } }) : _vm._e(), _vm.accountDialog ? _c("cloud-account-dialog", { on: { "signed-in": _vm.onSignedIn }, model: { value: _vm.accountDialog, callback: function($$v) {
    _vm.accountDialog = $$v;
  }, expression: "accountDialog" } }) : _vm._e(), _vm.linkDialog ? _c("link-printer-dialog", { attrs: { "initial-printer-id": _vm.linkPrinterId, "initial-host": _vm.linkHost }, model: { value: _vm.linkDialog, callback: function($$v) {
    _vm.linkDialog = $$v;
  }, expression: "linkDialog" } }) : _vm._e(), _vm.accessDialog && _vm.accessAsk && _vm.accessClient ? _c("access-request-dialog", { attrs: { "client": _vm.accessClient, "ask": _vm.accessAsk, "printer-name": _vm.accessName }, on: { "answered": _vm.onAccessAnswered }, model: { value: _vm.accessDialog, callback: function($$v) {
    _vm.accessDialog = $$v;
  }, expression: "accessDialog" } }) : _vm._e(), _vm.setupDialog && _vm.setupPrinter ? _c("bluetooth-setup-dialog", { attrs: { "printer": _vm.setupPrinter }, on: { "finished": _vm.rescan, "pair": _vm.pairNearbyPrinter }, model: { value: _vm.setupDialog, callback: function($$v) {
    _vm.setupDialog = $$v;
  }, expression: "setupDialog" } }) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/printers-ui.scss?vue&type=style&index=0&src=true&lang.scss";
import "/src/views/Printers.vue?vue&type=style&index=1&scoped=0cfe0303&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "0cfe0303",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Printers.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUtBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFLQTtBQUdBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBVUE7QUF3QkE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUFBO0FBQUE7QUFDQTtBQUFBO0FBQ0E7QUFLQTtBQUFBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsSUFDQTtBQUNBO0FBQUE7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBLDJCQUNBLGdFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUE7QUFDQTtBQUNBO0FBQUEsYUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQU1BO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBaldBO0FBQUEsRUFEQTtBQUFBLEdBbkpBLFNBb0pBO0FBOENBO0FBQUEsRUFEQTtBQUFBLEdBak1BLFNBa01BO0FBMFNBO0FBQUEsRUFEQTtBQUFBLEdBM2VBLFNBNGVBO0FBNWVBO0FBQUEsRUF0QkE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmludGVycy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJwcmludGVyc1wiXG4gICAgOmNsYXNzPVwieyAncHJpbnRlcnMtLXBob25lJzogaXNNb2JpbGVWaWV3cG9ydCB9XCJcbiAgPlxuICAgIDxkZWxldGlvbi1ub3RpY2VcbiAgICAgIHYtaWY9XCJkZWxldGlvblBlbmRpbmdcIlxuICAgICAgdGlkPVwicHJpbnRlcnMtZGVsZXRpb25cIlxuICAgIC8+XG4gICAgPCEtLSBOb3RoaW5nIHNhdmVkLCBsaW5rZWQgb3IgZm91bmQgeWV0OiB0aGUgZW1wdHkgc3RhdGUgaGVscHMgZmluZCB0aGUgZmlyc3QgcHJpbnRlci4gLS0+XG4gICAgPHByaW50ZXJzLXdlbGNvbWVcbiAgICAgIHYtaWY9XCJzaG93V2VsY29tZVwiXG4gICAgICA6c2lnbmVkLWluPVwiISFhY2NvdW50XCJcbiAgICAgIDpzZWFyY2hpbmc9XCJzZWFyY2hpbmdcIlxuICAgICAgOm5ldHdvcms9XCJzY2FuTmV0d29yayB8fCAnJ1wiXG4gICAgICA6Ymx1ZXRvb3RoLXNlYXJjaD1cImJsdWV0b290aFNlYXJjaFwiXG4gICAgICA6Ymx1ZXRvb3RoLW9mZj1cImJsdWV0b290aE9mZlwiXG4gICAgICA6Ymx1ZXRvb3RoLXdoeT1cImJsdWV0b290aFdoeVwiXG4gICAgICA6YmxvY2tlZC1ieS1wYWdlPVwiISFibG9ja2VkQnlQYWdlXCJcbiAgICAgIDpzY2FubmluZz1cInNjYW5CdXN5XCJcbiAgICAgIEByZXNjYW49XCJyZXNjYW5cIlxuICAgICAgQHNjYW49XCJvblNjYW5cIlxuICAgICAgQGxvb2stbmVhcmJ5PVwib25Mb29rTmVhcmJ5XCJcbiAgICAgIEBhZGRyZXNzPVwiaW5zdGFuY2VEaWFsb2dPcGVuID0gdHJ1ZVwiXG4gICAgICBAc2lnbi1pbj1cImFjY291bnREaWFsb2cgPSB0cnVlXCJcbiAgICAvPlxuXG4gICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgIDxwcmludGVycy1oZWFkZXJcbiAgICAgICAgOnN1bW1hcnk9XCJzdW1tYXJ5XCJcbiAgICAgICAgOnNlYXJjaC5zeW5jPVwicXVlcnlcIlxuICAgICAgICA6dmlldz1cInZpZXdcIlxuICAgICAgICA6c2hvdy1zZWFyY2g9XCJwYWdlLmNvdW50cy5wcmludGVycyA+IDFcIlxuICAgICAgICA6c2hvdy12aWV3PVwiISFwYWdlLmNvdW50cy5wcmludGVyc1wiXG4gICAgICAgIDpibHVldG9vdGgtc2VhcmNoPVwiYmx1ZXRvb3RoU2VhcmNoXCJcbiAgICAgICAgOmJsdWV0b290aC1vZmY9XCJibHVldG9vdGhPZmZcIlxuICAgICAgICA6Ymx1ZXRvb3RoLXdoeT1cImJsdWV0b290aFdoeVwiXG4gICAgICAgIDpzY2FubmluZz1cInNjYW5CdXN5XCJcbiAgICAgICAgQHVwZGF0ZTp2aWV3PVwic2V0Vmlld1wiXG4gICAgICAgIEBhZGQ9XCJhZGRTaGVldE9wZW4gPSB0cnVlXCJcbiAgICAgICAgQHNjYW49XCJvblNjYW5cIlxuICAgICAgICBAY29ubmVjdC1ibHVldG9vdGg9XCJvbkNvbm5lY3RPdmVyQmx1ZXRvb3RoXCJcbiAgICAgIC8+XG4gICAgICA8c2Nhbi1yZXN1bHRzIC8+XG5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJzZWFyY2hpbmcgJiYgIXBhZ2UuZm91bmQubGVuZ3RoXCJcbiAgICAgICAgY2xhc3M9XCJwcmludGVyc19fbG9va2luZ1wiXG4gICAgICAgIGRhdGEtdGlkPVwicHJpbnRlcnMtbG9va2luZ1wiXG4gICAgICA+XG4gICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgIHNpemU9XCIxMVwiXG4gICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgLz5cbiAgICAgICAgTG9va2luZ3t7IHNjYW5OZXR3b3JrID8gYCBvbiAke3NjYW5OZXR3b3JrfWAgOiAnJyB9fSBmb3IgcHJpbnRlcnPigKZcbiAgICAgIDwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJibG9ja2VkQnlQYWdlXCJcbiAgICAgICAgY2xhc3M9XCJub3RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJibG9ja2VkLWJ5LXBhZ2VcIlxuICAgICAgPlxuICAgICAgICBUaGlzIGJyb3dzZXIgd29uJ3QgbGV0IHRoaXMgcGFnZSByZWFjaCBwcmludGVycyBieSB0aGVpciBJUCBhZGRyZXNzLCBiZWNhdXNlIHRoZSBwYWdlIHdhcyBvcGVuZWQgYnlcbiAgICAgICAgbmFtZS4gQWRkIGEgcHJpbnRlciBieSBpdHMgbmFtZSBpbnN0ZWFkLCBhcyBzaG93biBvbiBpdHMgc2NyZWVuLCBzdWNoIGFzIG11b24td2FsbnV0LTg5ODcuXG4gICAgICA8L3A+XG5cbiAgICAgIDwhLS0gUHJpbnRpbmcgbm93IGxlYWRzOiBhIHByaW50ZXIgc2hvd3MgaW4gb25lIHBsYWNlLCBzbyBncm91cHMgc2F5IHdoaWNoIG9mIHRoZWlycyBwcmludCBhYm92ZS4gLS0+XG4gICAgICA8cHJpbnRlcnMtc2VjdGlvblxuICAgICAgICB2LWlmPVwicHJpbnRpbmdOb3cubGVuZ3RoICYmIHZpZXcgIT09ICdiZW5jaCdcIlxuICAgICAgICB0aXRsZT1cIlByaW50aW5nIG5vd1wiXG4gICAgICAgIDpjb3VudD1cInByaW50aW5nTm93Lmxlbmd0aFwiXG4gICAgICAgIDpub3RlPVwibmV4dFRvRmluaXNoIHx8ICcnXCJcbiAgICAgICAgZGF0YS10aWQ9XCJwcmludGluZy1ub3dcIlxuICAgICAgPlxuICAgICAgICA8cHJpbnRpbmctbm93LWNhcmRcbiAgICAgICAgICB2LWlmPVwicHJpbnRpbmdOb3cubGVuZ3RoID09PSAxICYmICFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgICAgICA6dGlsZT1cInByaW50aW5nTm93WzBdXCJcbiAgICAgICAgICB2YXJpYW50PVwid2lkZVwiXG4gICAgICAgICAgOnRodW1ibmFpbD1cInRodW1ibmFpbEZvcihwcmludGluZ05vd1swXSlcIlxuICAgICAgICAgIDpjb250cm9sbGFibGU9XCIhIXByaW50aW5nTm93WzBdLmVudHJ5LmFjdGl2ZVwiXG4gICAgICAgICAgOmJ1c3k9XCJjb250cm9sQnVzeVwiXG4gICAgICAgICAgQG9wZW49XCJvcGVuRW50cnkocHJpbnRpbmdOb3dbMF0uZW50cnkpXCJcbiAgICAgICAgICBAcGF1c2U9XCJjb250cm9sKHBhdXNlUHJpbnQpXCJcbiAgICAgICAgICBAcmVzdW1lPVwiY29udHJvbChyZXN1bWVQcmludClcIlxuICAgICAgICAgIEBzdG9wPVwiY29udHJvbChjYW5jZWxQcmludClcIlxuICAgICAgICAvPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgY2xhc3M9XCJwcmludGVyc19fbm93XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxwcmludGluZy1ub3ctY2FyZFxuICAgICAgICAgICAgdi1mb3I9XCJ0aWxlIGluIHByaW50aW5nTm93XCJcbiAgICAgICAgICAgIDprZXk9XCJ0aWxlLmtleVwiXG4gICAgICAgICAgICA6dGlsZT1cInRpbGVcIlxuICAgICAgICAgICAgdmFyaWFudD1cImNhcmRcIlxuICAgICAgICAgICAgOnRodW1ibmFpbD1cInRodW1ibmFpbEZvcih0aWxlKVwiXG4gICAgICAgICAgICA6Y29udHJvbGxhYmxlPVwiISF0aWxlLmVudHJ5LmFjdGl2ZVwiXG4gICAgICAgICAgICA6YnVzeT1cImNvbnRyb2xCdXN5XCJcbiAgICAgICAgICAgIEBvcGVuPVwib3BlbkVudHJ5KHRpbGUuZW50cnkpXCJcbiAgICAgICAgICAgIEBwYXVzZT1cImNvbnRyb2wocGF1c2VQcmludClcIlxuICAgICAgICAgICAgQHJlc3VtZT1cImNvbnRyb2wocmVzdW1lUHJpbnQpXCJcbiAgICAgICAgICAgIEBzdG9wPVwiY29udHJvbChjYW5jZWxQcmludClcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9wcmludGVycy1zZWN0aW9uPlxuXG4gICAgICA8IS0tIFlvdXIgZ3JvdXBzLCB0aGVuIHRoZSBwcmludGVycyBzYXZlZCBpbiB0aGlzIGJyb3dzZXIuIC0tPlxuICAgICAgPCEtLSBUaGUgQmVuY2ggKEtBTi0yMjU3LCBjb250cm9sLWN0eCk6IGVhY2ggZ3JvdXAgaXMgYSBiZW5jaCwgdGhlIHByaW50ZXJzIGRyYXduIHN0YW5kaW5nIG9uIGl0LiAtLT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwidmlldyA9PT0gJ2JlbmNoJ1wiPlxuICAgICAgICA8cHJpbnRlci1iZW5jaFxuICAgICAgICAgIHYtZm9yPVwiZyBpbiBzaG93bkdyb3Vwc1wiXG4gICAgICAgICAgOmtleT1cImcuaWRcIlxuICAgICAgICAgIDpiZW5jaC1pZD1cImcuaWRcIlxuICAgICAgICAgIDpraW5kPVwiZy5pZCA9PT0gJ3NoYXJlZCcgPyAnc2hlbGYnIDogJ2JlbmNoJ1wiXG4gICAgICAgICAgOnRpdGxlPVwiZy5uYW1lXCJcbiAgICAgICAgICA6dGlsZXM9XCJncm91cFRpbGVzW2cuaWRdXCJcbiAgICAgICAgICA6b3Zlcj1cImRyb3BUYXJnZXQgPT09IGcuaWRcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBncm91cC0ke2cuaWR9YFwiXG4gICAgICAgICAgQGRyYWdvdmVyLm5hdGl2ZS5wcmV2ZW50PVwib25EcmFnT3ZlcihnKVwiXG4gICAgICAgICAgQGRyYWdsZWF2ZS5uYXRpdmU9XCJkcm9wVGFyZ2V0ID0gbnVsbFwiXG4gICAgICAgICAgQGRyb3AubmF0aXZlLnByZXZlbnQ9XCJvbkRyb3AoZylcIlxuICAgICAgICA+XG4gICAgICAgICAgPHRlbXBsYXRlICN0aXRsZT5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB2LWlmPVwicmVuYW1pbmcgPT09IGcuaWRcIlxuICAgICAgICAgICAgICByZWY9XCJyZW5hbWVcIlxuICAgICAgICAgICAgICBjbGFzcz1cInByaW50ZXJzX19yZW5hbWVcIlxuICAgICAgICAgICAgICA6dmFsdWU9XCJyZW5hbWVEcmFmdFwiXG4gICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJCZW5jaCBuYW1lXCJcbiAgICAgICAgICAgICAgQGlucHV0PVwib25SZW5hbWVJbnB1dFwiXG4gICAgICAgICAgICAgIEBrZXlkb3duLmVudGVyPVwiZmluaXNoUmVuYW1lKGcuaWQpXCJcbiAgICAgICAgICAgICAgQGtleWRvd24uZXNjPVwicmVuYW1pbmcgPSBudWxsXCJcbiAgICAgICAgICAgICAgQGJsdXI9XCJmaW5pc2hSZW5hbWUoZy5pZClcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgPGgyXG4gICAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgICBjbGFzcz1cInByaW50ZXJzX19iZW5jaC1uYW1lXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3sgZy5uYW1lIH19XG4gICAgICAgICAgICA8L2gyPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgICAgICAgPHYtbWVudVxuICAgICAgICAgICAgICB2LWlmPVwiZy5lZGl0YWJsZVwiXG4gICAgICAgICAgICAgIGxlZnRcbiAgICAgICAgICAgICAgb2Zmc2V0LXlcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImljb24tYnRuXCJcbiAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJCZW5jaCBvcHRpb25zXCJcbiAgICAgICAgICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICAgICAgICAgIHYtb249XCJvblwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1vcmVcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbSBAY2xpY2s9XCJzdGFydFJlbmFtZShnLmlkKVwiPlxuICAgICAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPlJlbmFtZTwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgICAgICAgICA8di1saXN0LWl0ZW0gQGNsaWNrPVwicmVtb3ZlR3JvdXAoZy5pZClcIj5cbiAgICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZSBjbGFzcz1cImVycm9yLS10ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIFJlbW92ZSBiZW5jaFxuICAgICAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICAgICAgICA8L3YtbGlzdD5cbiAgICAgICAgICAgIDwvdi1tZW51PlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgPGJlbmNoLXByaW50ZXJcbiAgICAgICAgICAgIHYtZm9yPVwidGlsZSBpbiBncm91cFRpbGVzW2cuaWRdXCJcbiAgICAgICAgICAgIDprZXk9XCJ0aWxlLmtleVwiXG4gICAgICAgICAgICA6dGlsZT1cInRpbGVcIlxuICAgICAgICAgICAgOmFjdGlvbnM9XCJiZW5jaEFjdGlvbnNCeUtleVt0aWxlLmtleV1cIlxuICAgICAgICAgICAgOmRyYWdnYWJsZT1cImNhbkdyb3VwICYmICEhdGlsZS5lbnRyeS5jbG91ZFwiXG4gICAgICAgICAgICA6ZHJhdy1vbj1cImRyYXdPblwiXG4gICAgICAgICAgICBAb3Blbj1cIm9wZW5FbnRyeSh0aWxlLmVudHJ5KVwiXG4gICAgICAgICAgICBAYWN0aW9uPVwib25CZW5jaEFjdGlvbih0aWxlLCAkZXZlbnQpXCJcbiAgICAgICAgICAgIEBkcmFnc3RhcnQ9XCJvbkRyYWdTdGFydCh0aWxlKVwiXG4gICAgICAgICAgICBAZHJhZ2VuZD1cIm9uRHJhZ0VuZFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9wcmludGVyLWJlbmNoPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cImNhbkdyb3VwICYmICFxdWVyeVwiXG4gICAgICAgICAgY2xhc3M9XCJwcmludGVyc19fbmV3LWJlbmNoXCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdwcmludGVyc19fbmV3LWJlbmNoLS1vdmVyJzogZHJvcFRhcmdldCA9PT0gbmV3QmVuY2ggfVwiXG4gICAgICAgICAgcm9sZT1cImJ1dHRvblwiXG4gICAgICAgICAgdGFiaW5kZXg9XCIwXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiTmV3IGJlbmNoXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm5ldy1iZW5jaFwiXG4gICAgICAgICAgQGRyYWdlbnRlci5wcmV2ZW50PVwib25EcmFnT3Zlck5ld1wiXG4gICAgICAgICAgQGRyYWdvdmVyLnByZXZlbnQ9XCJvbkRyYWdPdmVyTmV3XCJcbiAgICAgICAgICBAZHJhZ2xlYXZlPVwiZHJvcFRhcmdldCA9IG51bGxcIlxuICAgICAgICAgIEBkcm9wLnByZXZlbnQ9XCJvbkRyb3BOZXdcIlxuICAgICAgICAgIEBjbGljaz1cImFkZEdyb3VwXCJcbiAgICAgICAgICBAa2V5ZG93bi5lbnRlci5wcmV2ZW50PVwiYWRkR3JvdXBcIlxuICAgICAgICAgIEBrZXlkb3duLnNwYWNlLnByZXZlbnQ9XCJhZGRHcm91cFwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDMwMCA0MFwiXG4gICAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPVwibm9uZVwiXG4gICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgID48cGF0aCBkPVwiTTYgMTJIMjk0TTIyIDEyVjM4TTI3OCAxMlYzOFwiIC8+PC9zdmc+XG4gICAgICAgICAgPHNwYW4+KyBOZXcgYmVuY2g8L3NwYW4+XG4gICAgICAgICAgPHNtYWxsPkRyb3AgYSBwcmludGVyIGhlcmUgdG8gc3RhcnQgb25lPC9zbWFsbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxwcmludGVyLWJlbmNoXG4gICAgICAgICAgdi1pZj1cImZvdW5kU2hvd24ubGVuZ3RoXCJcbiAgICAgICAgICBiZW5jaC1pZD1cImZvdW5kXCJcbiAgICAgICAgICBraW5kPVwiZG9vclwiXG4gICAgICAgICAgdGl0bGU9XCJPdGhlciBwcmludGVycyBvbiB5b3VyIG5ldHdvcmtcIlxuICAgICAgICAgIGNhcHRpb249XCJOb3Qgb24geW91ciBhY2NvdW50LiBPcGVuIG9uZSB0byB1c2UgaXQsIG9yIGFkZCBpdCB0byB5b3VyIGFjY291bnQuXCJcbiAgICAgICAgICA6dGlsZXM9XCJmb3VuZFNob3duXCJcbiAgICAgICAgICA6c2VhcmNoaW5nPVwic2VhcmNoaW5nXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImZvdW5kXCJcbiAgICAgICAgPlxuICAgICAgICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIHYtaWY9XCJzZWFyY2hpbmdcIlxuICAgICAgICAgICAgICBjbGFzcz1cInByaW50ZXJzX19sb29raW5nXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgICAgICAgc2l6ZT1cIjExXCJcbiAgICAgICAgICAgICAgICB3aWR0aD1cIjJcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICBMb29raW5ne3sgc2Nhbk5ldHdvcmsgPyBgIG9uICR7c2Nhbk5ldHdvcmt9YCA6ICcnIH194oCmXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICA8YmVuY2gtcHJpbnRlclxuICAgICAgICAgICAgdi1mb3I9XCJ0aWxlIGluIGZvdW5kU2hvd25cIlxuICAgICAgICAgICAgOmtleT1cInRpbGUua2V5XCJcbiAgICAgICAgICAgIDp0aWxlPVwidGlsZVwiXG4gICAgICAgICAgICA6YWN0aW9ucz1cImJlbmNoQWN0aW9uc0J5S2V5W3RpbGUua2V5XVwiXG4gICAgICAgICAgICBmb3VuZFxuICAgICAgICAgICAgOmRyYXctb249XCJkcmF3T25cIlxuICAgICAgICAgICAgQGFjdGlvbj1cIm9uRm91bmRSb3codGlsZSwgJGV2ZW50KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9wcmludGVyLWJlbmNoPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJvdGhlclNob3duLmxlbmd0aCAmJiBtaXhlZENvbnRlbnRCbG9ja2VkXCJcbiAgICAgICAgICBjbGFzcz1cImZvcmVpZ24td2FybmluZ1wiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBtaXhlZENvbnRlbnROb3RlIH19XG4gICAgICAgIDwvcD5cbiAgICAgICAgPHByaW50ZXItYmVuY2hcbiAgICAgICAgICB2LWlmPVwib3RoZXJTaG93bi5sZW5ndGhcIlxuICAgICAgICAgIGJlbmNoLWlkPVwib3RoZXJcIlxuICAgICAgICAgIGtpbmQ9XCJzaGVsZlwiXG4gICAgICAgICAgdGl0bGU9XCJPdGhlciBicmFuZHNcIlxuICAgICAgICAgIGljb249XCJwcmludGVyXCJcbiAgICAgICAgICA6dGlsZXM9XCJvdGhlclNob3duXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm90aGVyLXByaW50ZXJzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxiZW5jaC1wcmludGVyXG4gICAgICAgICAgICB2LWZvcj1cInRpbGUgaW4gb3RoZXJTaG93blwiXG4gICAgICAgICAgICA6a2V5PVwidGlsZS5rZXlcIlxuICAgICAgICAgICAgOnRpbGU9XCJ0aWxlXCJcbiAgICAgICAgICAgIDphY3Rpb25zPVwib3RoZXJBY3Rpb25zXCJcbiAgICAgICAgICAgIDpkcmF3LW9uPVwiZHJhd09uXCJcbiAgICAgICAgICAgIEBvcGVuPVwib3BlbkZvcmVpZ24odGlsZSlcIlxuICAgICAgICAgICAgQGFjdGlvbj1cIm9uT3RoZXJBY3Rpb24odGlsZSwgJGV2ZW50KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9wcmludGVyLWJlbmNoPlxuICAgICAgICA8cHJpbnRlci1iZW5jaFxuICAgICAgICAgIHYtaWY9XCJvZmZsaW5lU2hvd24ubGVuZ3RoXCJcbiAgICAgICAgICBiZW5jaC1pZD1cIm9mZmxpbmVcIlxuICAgICAgICAgIGtpbmQ9XCJzaGVsZlwiXG4gICAgICAgICAgaWNvbj1cInByaW50ZXJcIlxuICAgICAgICAgIHRpdGxlPVwiT2ZmbGluZVwiXG4gICAgICAgICAgOnRpbGVzPVwib2ZmbGluZVNob3duXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm9mZmxpbmVcIlxuICAgICAgICA+XG4gICAgICAgICAgPGJlbmNoLXByaW50ZXJcbiAgICAgICAgICAgIHYtZm9yPVwidGlsZSBpbiBvZmZsaW5lU2hvd25cIlxuICAgICAgICAgICAgOmtleT1cInRpbGUua2V5XCJcbiAgICAgICAgICAgIDp0aWxlPVwidGlsZVwiXG4gICAgICAgICAgICA6YWN0aW9ucz1cImJlbmNoQWN0aW9uc0J5S2V5W3RpbGUua2V5XVwiXG4gICAgICAgICAgICA6ZHJhdy1vbj1cImRyYXdPblwiXG4gICAgICAgICAgICBAb3Blbj1cIm9wZW5FbnRyeSh0aWxlLmVudHJ5KVwiXG4gICAgICAgICAgICBAYWN0aW9uPVwib25CZW5jaEFjdGlvbih0aWxlLCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L3ByaW50ZXItYmVuY2g+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgICA8cHJpbnRlcnMtc2VjdGlvblxuICAgICAgICAgIHYtZm9yPVwiZyBpbiBzaG93bkdyb3Vwc1wiXG4gICAgICAgICAgOmtleT1cImcuaWRcIlxuICAgICAgICAgIDpjb3VudD1cImdyb3VwVGlsZXNbZy5pZF0ubGVuZ3RoXCJcbiAgICAgICAgICA6bm90ZT1cImdyb3VwTm90ZShnKVwiXG4gICAgICAgICAgOmNsYXNzPVwieyAncHJpbnRlcnNfX3NlY3Rpb24tLWRyb3AnOiBkcm9wVGFyZ2V0ID09PSBnLmlkIH1cIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBncm91cC0ke2cuaWR9YFwiXG4gICAgICAgICAgQGRyYWdvdmVyLm5hdGl2ZS5wcmV2ZW50PVwib25EcmFnT3ZlcihnKVwiXG4gICAgICAgICAgQGRyYWdsZWF2ZS5uYXRpdmU9XCJkcm9wVGFyZ2V0ID0gbnVsbFwiXG4gICAgICAgICAgQGRyb3AubmF0aXZlLnByZXZlbnQ9XCJvbkRyb3AoZylcIlxuICAgICAgICA+XG4gICAgICAgICAgPHRlbXBsYXRlICN0aXRsZT5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB2LWlmPVwicmVuYW1pbmcgPT09IGcuaWRcIlxuICAgICAgICAgICAgICByZWY9XCJyZW5hbWVcIlxuICAgICAgICAgICAgICBjbGFzcz1cInByaW50ZXJzX19yZW5hbWVcIlxuICAgICAgICAgICAgICA6dmFsdWU9XCJyZW5hbWVEcmFmdFwiXG4gICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJHcm91cCBuYW1lXCJcbiAgICAgICAgICAgICAgQGlucHV0PVwib25SZW5hbWVJbnB1dFwiXG4gICAgICAgICAgICAgIEBrZXlkb3duLmVudGVyPVwiZmluaXNoUmVuYW1lKGcuaWQpXCJcbiAgICAgICAgICAgICAgQGtleWRvd24uZXNjPVwicmVuYW1pbmcgPSBudWxsXCJcbiAgICAgICAgICAgICAgQGJsdXI9XCJmaW5pc2hSZW5hbWUoZy5pZClcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgPGgyXG4gICAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgICBjbGFzcz1cInByaW50ZXJzX19ncm91cC1uYW1lXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3sgZy5uYW1lIH19XG4gICAgICAgICAgICA8L2gyPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgICAgICAgPHYtbWVudVxuICAgICAgICAgICAgICB2LWlmPVwiZy5lZGl0YWJsZVwiXG4gICAgICAgICAgICAgIGxlZnRcbiAgICAgICAgICAgICAgb2Zmc2V0LXlcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImljb24tYnRuXCJcbiAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJHcm91cCBvcHRpb25zXCJcbiAgICAgICAgICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICAgICAgICAgIHYtb249XCJvblwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1vcmVcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbSBAY2xpY2s9XCJzdGFydFJlbmFtZShnLmlkKVwiPlxuICAgICAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPlJlbmFtZTwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgICAgICAgICA8di1saXN0LWl0ZW0gQGNsaWNrPVwicmVtb3ZlR3JvdXAoZy5pZClcIj5cbiAgICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZSBjbGFzcz1cImVycm9yLS10ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIFJlbW92ZSBncm91cFxuICAgICAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICAgICAgICA8L3YtbGlzdD5cbiAgICAgICAgICAgIDwvdi1tZW51PlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG5cbiAgICAgICAgICA8ZGl2IDpjbGFzcz1cImdyaWRDbGFzc1wiPlxuICAgICAgICAgICAgPHByaW50ZXItdGlsZS1jYXJkXG4gICAgICAgICAgICAgIHYtZm9yPVwidGlsZSBpbiBncm91cFRpbGVzW2cuaWRdXCJcbiAgICAgICAgICAgICAgOmtleT1cInRpbGUua2V5XCJcbiAgICAgICAgICAgICAgOnRpbGU9XCJ0aWxlXCJcbiAgICAgICAgICAgICAgOnZhcmlhbnQ9XCJ0aWxlVmFyaWFudFwiXG4gICAgICAgICAgICAgIDpzdGFnZS1oZWlnaHQ9XCIxNTBcIlxuICAgICAgICAgICAgICA6YWN0aW9ucz1cImFjdGlvbnNGb3IodGlsZS5lbnRyeSlcIlxuICAgICAgICAgICAgICA6YnVzeT1cImJ1c3lLZXkgPT09IHRpbGUua2V5XCJcbiAgICAgICAgICAgICAgOmRyYWdnYWJsZT1cImNhbkdyb3VwICYmICEhdGlsZS5lbnRyeS5jbG91ZFwiXG4gICAgICAgICAgICAgIEBvcGVuPVwib3BlbkVudHJ5KHRpbGUuZW50cnkpXCJcbiAgICAgICAgICAgICAgQGFjdGlvbj1cIm9uQWN0aW9uKHRpbGUuZW50cnksICRldmVudClcIlxuICAgICAgICAgICAgICBAZHJhZ3N0YXJ0PVwib25EcmFnU3RhcnQodGlsZSlcIlxuICAgICAgICAgICAgICBAZHJhZ2VuZD1cIm9uRHJhZ0VuZFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICB2LWlmPVwiKGcuZWRpdGFibGUgfHwgZy5pZCA9PT0gJ3VuZ3JvdXBlZCcpICYmIChkcmFnZ2luZyB8fCAhZy50aWxlcy5sZW5ndGgpXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJkcm9wLWhpbnRcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwicGx1c1wiIC8+XG4gICAgICAgICAgICAgIDxzcGFuPnt7IGRyb3BIaW50KGcpIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvcHJpbnRlcnMtc2VjdGlvbj5cblxuICAgICAgICA8IS0tIEZvdW5kIG5lYXJieSwgbm90IHlvdXJzIHlldDogaGlkZGVuIHdoZW4gbm90aGluZyBpcyBmb3VuZC4gLS0+XG4gICAgICAgIDxwcmludGVycy1zZWN0aW9uXG4gICAgICAgICAgdi1pZj1cImZvdW5kU2hvd24ubGVuZ3RoXCJcbiAgICAgICAgICB0aXRsZT1cIk90aGVyIHByaW50ZXJzIG9uIHlvdXIgbmV0d29ya1wiXG4gICAgICAgICAgOmNvdW50PVwiZm91bmRTaG93bi5sZW5ndGhcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZm91bmRcIlxuICAgICAgICA+XG4gICAgICAgICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1pZj1cInNlYXJjaGluZ1wiXG4gICAgICAgICAgICAgIGNsYXNzPVwicHJpbnRlcnNfX2xvb2tpbmdcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgICAgICAgIGluZGV0ZXJtaW5hdGVcbiAgICAgICAgICAgICAgICBzaXplPVwiMTFcIlxuICAgICAgICAgICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIExvb2tpbmd7eyBzY2FuTmV0d29yayA/IGAgb24gJHtzY2FuTmV0d29ya31gIDogJycgfX3igKZcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgIDxmb3VuZC1saXN0XG4gICAgICAgICAgICA6dGlsZXM9XCJmb3VuZFNob3duXCJcbiAgICAgICAgICAgIDphY3Rpb25zLWZvcj1cImZvdW5kQWN0aW9uc0ZvclwiXG4gICAgICAgICAgICA6YnVzeS1rZXk9XCJidXN5S2V5XCJcbiAgICAgICAgICAgIDpzdGVwcy1mb3I9XCJjb25uZWN0U3RlcHNcIlxuICAgICAgICAgICAgQGFjdGlvbj1cIm9uRm91bmRSb3dcIlxuICAgICAgICAgICAgQGNhbmNlbD1cIm9uRm91bmRDYW5jZWxcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvcHJpbnRlcnMtc2VjdGlvbj5cblxuICAgICAgICA8cHJpbnRlcnMtc2VjdGlvblxuICAgICAgICAgIHYtaWY9XCJvdGhlclNob3duLmxlbmd0aFwiXG4gICAgICAgICAgdGl0bGU9XCJPdGhlciBicmFuZHNcIlxuICAgICAgICAgIDpjb3VudD1cIm90aGVyU2hvd24ubGVuZ3RoXCJcbiAgICAgICAgICBub3RlPVwiTm90IE0xcywgc2F2ZWQgaW4gdGhpcyBicm93c2VyIG9ubHkuIFRoZXkgbmV2ZXIgZ28gdGhyb3VnaCBNdW9uM0QncyBzZXJ2ZXJzLlwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJvdGhlci1wcmludGVyc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8cFxuICAgICAgICAgICAgdi1pZj1cIm1peGVkQ29udGVudEJsb2NrZWRcIlxuICAgICAgICAgICAgY2xhc3M9XCJmb3JlaWduLXdhcm5pbmdcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IG1peGVkQ29udGVudE5vdGUgfX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPG90aGVyLXByaW50ZXJzXG4gICAgICAgICAgICA6dGlsZXM9XCJvdGhlclNob3duXCJcbiAgICAgICAgICAgIEBvcGVuPVwib3BlbkZvcmVpZ25cIlxuICAgICAgICAgICAgQGZvcmdldD1cImZvcmdldEZvcmVpZ25QcmludGVyXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L3ByaW50ZXJzLXNlY3Rpb24+XG5cbiAgICAgICAgPCEtLSBPZmZsaW5lIGlzIGxhc3QgYW5kIGRpbW1lZCwgd2l0aCBpdHMgcmVhc29uLiAtLT5cbiAgICAgICAgPHByaW50ZXJzLXNlY3Rpb25cbiAgICAgICAgICB2LWlmPVwib2ZmbGluZVNob3duLmxlbmd0aFwiXG4gICAgICAgICAgdGl0bGU9XCJPZmZsaW5lXCJcbiAgICAgICAgICA6Y291bnQ9XCJvZmZsaW5lU2hvd24ubGVuZ3RoXCJcbiAgICAgICAgICBtdXRlZFxuICAgICAgICAgIGRhdGEtdGlkPVwib2ZmbGluZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8b2ZmbGluZS1saXN0XG4gICAgICAgICAgICA6dGlsZXM9XCJvZmZsaW5lU2hvd25cIlxuICAgICAgICAgICAgOmFjdGlvbnMtZm9yPVwib2ZmbGluZUFjdGlvbnNGb3JcIlxuICAgICAgICAgICAgQGFjdGlvbj1cIm9uT2ZmbGluZVJvd1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9wcmludGVycy1zZWN0aW9uPlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPCEtLSBOb3RoaW5nIG1hdGNoZXM6IHNheSBzbywgYW5kIGhvdyB0byBnZXQgYmFjaywgaW4gZXZlcnkgdmlldy4gLS0+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCIhZGVsZXRpb25QZW5kaW5nICYmIHF1ZXJ5ICYmICFhbnlTaG93blwiXG4gICAgICAgIGNsYXNzPVwicHJpbnRlcnNfX25vbmVcIlxuICAgICAgICBkYXRhLXRpZD1cInByaW50ZXJzLW5vbmVcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInByaW50ZXJzX19ub25lLWljb25cIj48ZnJhbWUtaWNvbiBuYW1lPVwic2VhcmNoXCIgLz48L3NwYW4+XG4gICAgICAgIDxiPk5vIHByaW50ZXIgbWF0Y2hlcyBcInt7IHF1ZXJ5IH19XCI8L2I+XG4gICAgICAgIDxzcGFuPlNlYXJjaCBsb29rcyBhdCBhIHByaW50ZXIncyBuYW1lLCBzdGF0ZSBhbmQgZ3JvdXAuPC9zcGFuPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJidG4gYnRuLS1zbVwiXG4gICAgICAgICAgQGNsaWNrPVwicXVlcnkgPSAnJ1wiXG4gICAgICAgID5cbiAgICAgICAgICBDbGVhciBzZWFyY2hcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwiIWFjY291bnRcIlxuICAgICAgICBjbGFzcz1cImluc2V0XCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImNsb3VkXCIgLz5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJpbnNldF9fdGV4dFwiPlxuICAgICAgICAgIFNpZ24gaW4gdG8gcmVhY2ggdGhlc2UgZnJvbSBhbnl3aGVyZSwgc29ydCB0aGVtIGludG8gZ3JvdXBzIGFuZCBoZWFyIHdoZW4gYSBwcmludCBmaW5pc2hlcy5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImRpbVwiPk9wdGlvbmFsLjwvc3Bhbj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJidG4gYnRuLS1zbVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzaWduLWluXCJcbiAgICAgICAgICBAY2xpY2s9XCJhY2NvdW50RGlhbG9nID0gdHJ1ZVwiXG4gICAgICAgID5cbiAgICAgICAgICBTaWduIGluXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gVGhlIEJlbmNoIGhhcyBpdHMgb3duIFwiKyBOZXcgYmVuY2hcIiBkcm9wIHRhcmdldCBpbiBwbGFjZSBvZiB0aGlzLiAtLT5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cImNhbkdyb3VwICYmIHZpZXcgIT09ICdiZW5jaCdcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJuZXctZ3JvdXBcIlxuICAgICAgICBkYXRhLXRpZD1cIm5ldy1ncm91cFwiXG4gICAgICAgIEBjbGljaz1cImFkZEdyb3VwXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgTmV3IGdyb3VwXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCJub3RpY2VcIlxuICAgICAgY2xhc3M9XCJub3RlXCJcbiAgICA+XG4gICAgICB7eyBub3RpY2UgfX1cbiAgICAgIDxhXG4gICAgICAgIHYtaWY9XCJub3RpY2VMaW5rXCJcbiAgICAgICAgOmhyZWY9XCJub3RpY2VMaW5rXCJcbiAgICAgICAgZGF0YS10aWQ9XCJub3RpY2UtbGlua1wiXG4gICAgICA+e3sgbm90aWNlTGluayB9fTwvYT5cbiAgICA8L3A+XG4gICAgPHByaW50ZXItcm91dGUtcHJvYmxlbVxuICAgICAgOnByb2JsZW09XCJyb3V0ZVByb2JsZW1cIlxuICAgICAgOmFzaz1cImFza011b25Mb2NhbFwiXG4gICAgICBAY2hvb3NlPVwib25Qcm9ibGVtQ2hvaWNlXCJcbiAgICAgIEBjYW5jZWw9XCJjYW5jZWxNdW9uTG9jYWxcIlxuICAgIC8+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cIm5lYXJieS5lcnJvclwiXG4gICAgICBjbGFzcz1cIm5vdGUgbm90ZS0tZXJyb3JcIlxuICAgICAgZGF0YS10aWQ9XCJuZWFyYnktZXJyb3JcIlxuICAgID5cbiAgICAgIDxwIGNsYXNzPVwibm90ZV9fbGluZVwiPlxuICAgICAgICB7eyBuZWFyYnkuZXJyb3IgfX1cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwibm90ZV9fcmV0cnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibmVhcmJ5LXJldHJ5XCJcbiAgICAgICAgICBAY2xpY2s9XCJvbkxvb2tOZWFyYnlcIlxuICAgICAgICA+XG4gICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9wPlxuICAgICAgPGRldGFpbHNcbiAgICAgICAgdi1pZj1cIm5lYXJieS5lcnJvckRldGFpbFwiXG4gICAgICAgIGNsYXNzPVwibm90ZV9fZGV0YWlsc1wiXG4gICAgICA+XG4gICAgICAgIDxzdW1tYXJ5PkRldGFpbHM8L3N1bW1hcnk+XG4gICAgICAgIDxjb2RlPnt7IG5lYXJieS5lcnJvckRldGFpbCB9fTwvY29kZT5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L2Rpdj5cbiAgICA8cFxuICAgICAgdi1pZj1cImFjdGl2YXRpb25FcnJvclwiXG4gICAgICBjbGFzcz1cIm5vdGUgbm90ZS0tZXJyb3JcIlxuICAgID5cbiAgICAgIHt7IGFjdGl2YXRpb25FcnJvciB9fVxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCJhY3RpdmF0aW9uRmFsbGJhY2tcIj5cbiAgICAgICAgPGEgOmhyZWY9XCJhY3RpdmF0aW9uRmFsbGJhY2tcIj5PcGVuIHRoZSBwcmludGVyJ3Mgb3duIHBhZ2U8L2E+IGluc3RlYWQuXG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvcD5cblxuICAgIDxhZGQtcHJpbnRlci1zaGVldFxuICAgICAgdi1tb2RlbD1cImFkZFNoZWV0T3BlblwiXG4gICAgICA6Ymx1ZXRvb3RoLXNlYXJjaD1cImJsdWV0b290aFNlYXJjaFwiXG4gICAgICA6Ymx1ZXRvb3RoLW9mZj1cImJsdWV0b290aE9mZlwiXG4gICAgICA6Ymx1ZXRvb3RoLXdoeT1cImJsdWV0b290aFdoeVwiXG4gICAgICA6c2VhcmNoaW5nPVwic2VhcmNoaW5nXCJcbiAgICAgIDpuZXR3b3JrPVwic2Nhbk5ldHdvcmsgfHwgJydcIlxuICAgICAgOmZvdW5kPVwicGFnZS5mb3VuZC5sZW5ndGhcIlxuICAgICAgQGxvb2stbmVhcmJ5PVwiYWRkU2hlZXRPcGVuID0gZmFsc2U7IG9uTG9va05lYXJieSgpXCJcbiAgICAgIEByZXNjYW49XCJyZXNjYW5cIlxuICAgICAgQGFkZHJlc3M9XCJhZGRTaGVldE9wZW4gPSBmYWxzZTsgaW5zdGFuY2VEaWFsb2dPcGVuID0gdHJ1ZVwiXG4gICAgLz5cbiAgICA8YWRkLWluc3RhbmNlLWRpYWxvZ1xuICAgICAgdi1pZj1cImluc3RhbmNlRGlhbG9nT3BlblwiXG4gICAgICB2LW1vZGVsPVwiaW5zdGFuY2VEaWFsb2dPcGVuXCJcbiAgICAgIDpmb3VuZD1cImZvdW5kQ2hvaWNlc1wiXG4gICAgICA6c2VhcmNoaW5nPVwic2VhcmNoaW5nXCJcbiAgICAgIEByZXNvbHZlPVwib3Blbkluc3RhbmNlXCJcbiAgICAgIEBwaWNrPVwib25QaWNrRm91bmRcIlxuICAgICAgQHNhdmVkPVwicmVmcmVzaEZvcmVpZ25QcmludGVyc1wiXG4gICAgLz5cbiAgICA8Y2xvdWQtYWNjb3VudC1kaWFsb2dcbiAgICAgIHYtaWY9XCJhY2NvdW50RGlhbG9nXCJcbiAgICAgIHYtbW9kZWw9XCJhY2NvdW50RGlhbG9nXCJcbiAgICAgIEBzaWduZWQtaW49XCJvblNpZ25lZEluXCJcbiAgICAvPlxuICAgIDxsaW5rLXByaW50ZXItZGlhbG9nXG4gICAgICB2LWlmPVwibGlua0RpYWxvZ1wiXG4gICAgICB2LW1vZGVsPVwibGlua0RpYWxvZ1wiXG4gICAgICA6aW5pdGlhbC1wcmludGVyLWlkPVwibGlua1ByaW50ZXJJZFwiXG4gICAgICA6aW5pdGlhbC1ob3N0PVwibGlua0hvc3RcIlxuICAgIC8+XG4gICAgPGFjY2Vzcy1yZXF1ZXN0LWRpYWxvZ1xuICAgICAgdi1pZj1cImFjY2Vzc0RpYWxvZyAmJiBhY2Nlc3NBc2sgJiYgYWNjZXNzQ2xpZW50XCJcbiAgICAgIHYtbW9kZWw9XCJhY2Nlc3NEaWFsb2dcIlxuICAgICAgOmNsaWVudD1cImFjY2Vzc0NsaWVudFwiXG4gICAgICA6YXNrPVwiYWNjZXNzQXNrXCJcbiAgICAgIDpwcmludGVyLW5hbWU9XCJhY2Nlc3NOYW1lXCJcbiAgICAgIEBhbnN3ZXJlZD1cIm9uQWNjZXNzQW5zd2VyZWRcIlxuICAgIC8+XG4gICAgPGJsdWV0b290aC1zZXR1cC1kaWFsb2dcbiAgICAgIHYtaWY9XCJzZXR1cERpYWxvZyAmJiBzZXR1cFByaW50ZXJcIlxuICAgICAgdi1tb2RlbD1cInNldHVwRGlhbG9nXCJcbiAgICAgIDpwcmludGVyPVwic2V0dXBQcmludGVyXCJcbiAgICAgIEBmaW5pc2hlZD1cInJlc2NhblwiXG4gICAgICBAcGFpcj1cInBhaXJOZWFyYnlQcmludGVyXCJcbiAgICAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyB2aXNpYmxlSW50ZXJ2YWwgfSBmcm9tICdAL3V0aWwvdmlzaWJsZS1pbnRlcnZhbCdcbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgUHJpbnRlckVudHJpZXNNaXhpbiBmcm9tICdAL21peGlucy9wcmludGVyLWVudHJpZXMnXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgRmlsZXNNaXhpbiBmcm9tICdAL21peGlucy9maWxlcydcbmltcG9ydCB7IGNsb3VkUHJpbnRlckNvbm5lY3Rpb24sIGNsb3VkU3RhdGUsIHNhdmVMYXlvdXQgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBhY3RpdmF0aW9uU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvYWN0aXZhdGUnXG5pbXBvcnQgeyBibHVldG9vdGhDYXJyeWluZywgd2FudHNCbHVldG9vdGhGb3IgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2xpbmsnXG5pbXBvcnQgeyBkaXNjb3ZlclByaW50ZXJzLCBkaXNjb3ZlcnlTdGF0ZSwgbGFuQWRkcmVzc2VzLCBsYW5GZXRjaCwgcmVmcmVzaENsb3VkTmVhcmJ5LCByZWZyZXNoS25vd25QcmludGVycywgcmVmcmVzaExhblN0YXR1cyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXNjb3ZlcnknXG5pbXBvcnQgeyBhZnRlckZpcnN0UGFpbnQgfSBmcm9tICdAL3NlcnZpY2VzL3N0YXJ0dXAvaWRsZSdcbmltcG9ydCB7IGxvYWRlZFJlY29yZCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0dXMnXG5pbXBvcnQgeyBqb2JQaWN0dXJlIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL3BpY3R1cmVzJ1xuaW1wb3J0IHsgZm9yZWlnbkVudHJpZXMsIHNhdmVkVXBkYXRlcywgdHlwZSBEaXJlY3RvcnksIHR5cGUgRGlyZWN0b3J5RW50cnkgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZGlyZWN0b3J5J1xuaW1wb3J0IHsgc3RhcnROZWFyYnksIHN0b3BOZWFyYnkgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL25lYXJieSdcbmltcG9ydCB7IHByaW50ZXJIb21lUGF0aCwgZm9yZWlnblNsdWdGb3JJZCB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IHNhdmVTbmFwc2hvdFByaW50ZXJzLCBzbmFwc2hvdFByaW50ZXIgfSBmcm9tICdAL3NlcnZpY2VzL3N0YXJ0dXAvc25hcHNob3QnXG5pbXBvcnQge1xuICBuZWVkc1lvdSxcbiAgcHJpbnRlcnNQYWdlLFxuICBSb3V0ZUxhYmVsSG9sZCxcbiAgdHlwZSBQcmludGVyc1BhZ2UsXG4gIHR5cGUgUHJpbnRlclRpbGUsXG4gIHR5cGUgVGlsZUdyb3VwLFxuICB0eXBlIFRpbGVKb2Jcbn0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL21vZGVsJ1xuaW1wb3J0IHR5cGUgeyBUaW1lRXN0aW1hdGVzIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuaW1wb3J0IHsgc2hvcnREdXJhdGlvbiB9IGZyb20gJ0AvdXRpbC9zaG9ydC1kdXJhdGlvbidcbmltcG9ydCB7IGV2ZW50VGFyZ2V0SXNDb250ZW50RWRpdGFibGUgfSBmcm9tICdAL3V0aWwvZXZlbnQtaGVscGVycydcbmltcG9ydCBDbG91ZEFjY291bnREaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL211b24tY2xvdWQvQ2xvdWRBY2NvdW50RGlhbG9nLnZ1ZSdcbmltcG9ydCBMaW5rUHJpbnRlckRpYWxvZyBmcm9tICdAL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9MaW5rUHJpbnRlckRpYWxvZy52dWUnXG5pbXBvcnQgQmx1ZXRvb3RoU2V0dXBEaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL211b24tYmxlL0JsdWV0b290aFNldHVwRGlhbG9nLnZ1ZSdcbmltcG9ydCBBY2Nlc3NSZXF1ZXN0RGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy9tdW9uLWFjY2Vzcy9BY2Nlc3NSZXF1ZXN0RGlhbG9nLnZ1ZSdcbmltcG9ydCBQcmludGVyc0hlYWRlciBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvUHJpbnRlcnNIZWFkZXIudnVlJ1xuaW1wb3J0IFByaW50ZXJzU2VjdGlvbiBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvUHJpbnRlcnNTZWN0aW9uLnZ1ZSdcbmltcG9ydCBQcmludGVyQmVuY2ggZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL1ByaW50ZXJCZW5jaC52dWUnXG5pbXBvcnQgQmVuY2hQcmludGVyLCB7IHR5cGUgQmVuY2hBY3Rpb24gfSBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvQmVuY2hQcmludGVyLnZ1ZSdcbmltcG9ydCBQcmludGVyc1dlbGNvbWUgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL1ByaW50ZXJzV2VsY29tZS52dWUnXG5pbXBvcnQgUHJpbnRlclJvdXRlUHJvYmxlbSBmcm9tICdAL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9QcmludGVyUm91dGVQcm9ibGVtLnZ1ZSdcbmltcG9ydCBTY2FuUmVzdWx0cyBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvU2NhblJlc3VsdHMudnVlJ1xuaW1wb3J0IEFkZFByaW50ZXJTaGVldCBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvQWRkUHJpbnRlclNoZWV0LnZ1ZSdcbmltcG9ydCBGb3VuZExpc3QgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL0ZvdW5kTGlzdC52dWUnXG5pbXBvcnQgT2ZmbGluZUxpc3QgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL09mZmxpbmVMaXN0LnZ1ZSdcbmltcG9ydCBPdGhlclByaW50ZXJzIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9PdGhlclByaW50ZXJzLnZ1ZSdcbmltcG9ydCBQcmludGVyVGlsZUNhcmQgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL1ByaW50ZXJUaWxlQ2FyZC52dWUnXG5pbXBvcnQgUHJpbnRpbmdOb3dDYXJkIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9QcmludGluZ05vd0NhcmQudnVlJ1xuaW1wb3J0IHR5cGUgeyBGb3VuZENob2ljZSB9IGZyb20gJ0AvY29tcG9uZW50cy9jb21tb24vQWRkSW5zdGFuY2VEaWFsb2cudnVlJ1xuaW1wb3J0IHsgbGl2ZUZvcmVpZ24sIGxvYWRGb3JlaWduLCBjb25uZWN0QWxsLCBmb3JnZXQgYXMgZm9yZ2V0Rm9yZWlnbiB9IGZyb20gJ0Avc2VydmljZXMvZm9yZWlnbi1wcmludGVycy9saXZlJ1xuaW1wb3J0IHsgYmxvY2tzRm9yZWlnbkh0dHAgfSBmcm9tICdAL3V0aWwvYnJvd3Nlci1mYW1pbHknXG5pbXBvcnQgeyBwYWdlQmxvY2tzUHJpbnRlciB9IGZyb20gJ0AvdXRpbC9wYWdlLWJsb2Nrcy1wcmludGVyJ1xuXG50eXBlIFZpZXcgPSAnY2FyZHMnIHwgJ2xpc3QnIHwgJ2JlbmNoJ1xuXG4vKiogQW4gT3RoZXIgYnJhbmRzIHByaW50ZXIgb24gdGhlIEJlbmNoOiBvcGVuIGl0LCBvciBoYXZlIHRoaXMgYnJvd3NlciBmb3JnZXQgaXQuICovXG5jb25zdCBPVEhFUl9BQ1RJT05TOiBCZW5jaEFjdGlvbltdID0gW3sgaWQ6ICdvcGVuJywgbGFiZWw6ICdPcGVuJyB9LCB7IGlkOiAnZm9yZ2V0JywgbGFiZWw6ICdGb3JnZXQnIH1dXG5cbi8qKiBIb3cgb2Z0ZW4gdGhlIHByaW50ZXJzIGFscmVhZHkga25vd24gYXJlIGFza2VkIGFnYWluIHdoaWxlIHRoZSBwYWdlIGlzIG9wZW4uICovXG5jb25zdCBIRUFMVEhfRVZFUllfTVMgPSAxNV8wMDBcbi8qKiBIb3cgb2Z0ZW4gd2hhdCB0aGUgcHJpbnRlcnMgZm91bmQgb24gdGhpcyBuZXR3b3JrIGFyZSBkb2luZyBpcyByZWFkIGFnYWluOiBhIHByaW50IG1vdmVzLiAqL1xuY29uc3QgU1RBVFVTX0VWRVJZX01TID0gM18wMDBcbmNvbnN0IFZJRVdfS0VZID0gJ211b24zZC5wcmludGVycy52aWV3J1xuXG5mdW5jdGlvbiByZWFkVmlldyAoKTogVmlldyB7XG4gIHRyeSB7XG4gICAgY29uc3QgdiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFZJRVdfS0VZKVxuICAgIHJldHVybiB2ID09PSAnbGlzdCcgfHwgdiA9PT0gJ2JlbmNoJyA/IHYgOiAnY2FyZHMnXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiAnY2FyZHMnXG4gIH1cbn1cblxuLyoqXG4gKiBQcmludGVycyAoYC9gKTogZXZlcnkgcHJpbnRlciwgaW4gb25lIHBsYWNlIChVMSwgVTYpLiBXaGF0IGlzIHByaW50aW5nXG4gKiBub3cgbGVhZHMsIHRoZSB3aG9sZSB3aWR0aCBmb3Igb25lIGFuZCBzaWRlIGJ5IHNpZGUgZm9yIHNldmVyYWw7IHRoZW5cbiAqIHlvdXIgZ3JvdXBzOyB0aGVuIHdoYXQgd2FzIGZvdW5kIG9uIHRoaXMgbmV0d29yaywgbGFyZ2UsIHdoZXRoZXIgb3Igbm90XG4gKiB5b3UncmUgc2lnbmVkIGluOyB0aGVuIHdoYXQgaXMgb2ZmbGluZS4gV2l0aCBub3RoaW5nIHlldCwgaXQgd2VsY29tZXNcbiAqIGFuZCBoZWxwcyBmaW5kIHRoZSBmaXJzdCBwcmludGVyLlxuICovXG4vKiogT3V0c2lkZSB0aGUgY29tcG9uZW50J3MgcmVhY3RpdmUgZGF0YTogaXQgaXMgd3JpdHRlbiB3aGlsZSB0aGUgcGFnZSBpcyBjb21wdXRlZC4gKi9cbmNvbnN0IHJvdXRlSG9sZCA9IG5ldyBSb3V0ZUxhYmVsSG9sZCgpXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7XG4gICAgRGVsZXRpb25Ob3RpY2U6ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL2FjY291bnQvRGVsZXRpb25Ob3RpY2UudnVlJyksXG4gICAgQ2xvdWRBY2NvdW50RGlhbG9nLFxuICAgIExpbmtQcmludGVyRGlhbG9nLFxuICAgIEJsdWV0b290aFNldHVwRGlhbG9nLFxuICAgIEFjY2Vzc1JlcXVlc3REaWFsb2csXG4gICAgUHJpbnRlcnNIZWFkZXIsXG4gICAgUHJpbnRlcnNTZWN0aW9uLFxuICAgIFByaW50ZXJCZW5jaCxcbiAgICBCZW5jaFByaW50ZXIsXG4gICAgUHJpbnRlcnNXZWxjb21lLFxuICAgIFNjYW5SZXN1bHRzLFxuICAgIFByaW50ZXJSb3V0ZVByb2JsZW0sXG4gICAgQWRkUHJpbnRlclNoZWV0LFxuICAgIEZvdW5kTGlzdCxcbiAgICBPZmZsaW5lTGlzdCxcbiAgICBPdGhlclByaW50ZXJzLFxuICAgIFByaW50ZXJUaWxlQ2FyZCxcbiAgICBQcmludGluZ05vd0NhcmRcbiAgfVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaW50ZXJzIGV4dGVuZHMgTWl4aW5zKFByaW50ZXJFbnRyaWVzTWl4aW4sIEJyb3dzZXJNaXhpbiwgRmlsZXNNaXhpbikge1xuICBxdWVyeSA9ICcnXG4gIC8qKiBBIHByaW50IGNvbnRyb2wgd2FzIGp1c3QgdXNlZDogdGhlIG5leHQgb25lIHdhaXRzIGEgbW9tZW50IChhIGRvdWJsZSBjbGljayBpcyBvbmUpLiAqL1xuICBjb250cm9sQnVzeSA9IGZhbHNlXG4gIHZpZXc6IFZpZXcgPSByZWFkVmlldygpXG4gIC8qKiBUaGUgQmVuY2gncyBkcmF3aW5ncyBkcmF3IHRoZW1zZWx2ZXMgb24gdGhlIGZpcnN0IGFycml2YWwgb25seSwgbm90IG9uIGV2ZXJ5IHJlZnJlc2guICovXG4gIGRyYXdPbiA9IHRydWVcbiAgcmVhZG9ubHkgbmV3QmVuY2ggPSAnbmV3LWJlbmNoJ1xuICByZWFkb25seSBvdGhlckFjdGlvbnMgPSBPVEhFUl9BQ1RJT05TXG4gIHJlYWRvbmx5IG1peGVkQ29udGVudE5vdGUgPSBcIkZpcmVmb3ggYW5kIFNhZmFyaSBibG9jayB0aGlzIHBhZ2UgKGh0dHBzKSBmcm9tIHRhbGtpbmcgdG8gYSBwcmludGVyIG9uIHBsYWluIGh0dHAg4oCUIHRoYXQncyBtaXhlZCBjb250ZW50LiBDaHJvbWUgY2FuIHJlYWNoIHByaW50ZXJzIG9uIHlvdXIgbmV0d29yazogb3BlbiBDb250cm9sIGluIENocm9tZS5cIlxuICBhZGRTaGVldE9wZW4gPSBmYWxzZVxuICBkcmFnZ2luZzogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgZHJvcFRhcmdldDogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgcmVuYW1pbmc6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBiZWluZyB0eXBlZCwga2VwdCBoZXJlIHJhdGhlciB0aGFuIHJlYWQgYmFjayBmcm9tIHRoZSBpbnB1dDogYSByZS1yZW5kZXIgb2YgdGhlIGdyb3VwcyAoYSBwcmludGVyIGdvaW5nXG4gICAqIG9mZmxpbmUsIHVuZGVyIGxvYWQpIGNhbiByZWNyZWF0ZSB0aGUgaW5wdXQsIHdoaWNoIHRoZW4gaGVsZCB0aGUgb2xkIG5hbWUsIGFuZCBFbnRlciBzYXZlZCB0aGF0ICgjMzYyJ3MgZTJlKS5cbiAgICovXG4gIHJlbmFtZURyYWZ0ID0gJydcbiAgdGltZXI6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG4gIC8qKiBTZXQgb24gZGVzdHJveSwgc28gYSBzd2VlcCBzdGlsbCB3YWl0aW5nIGZvciB0aGUgZmlyc3QgcGFpbnQgZG9lc24ndCBzdGFydC4gKi9cbiAgZ29uZSA9IGZhbHNlXG4gIHN0YXR1c1RpbWVyOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG4gIGNyZWF0ZWQgKCkge1xuICAgIC8vIFRoZSBkcmF3aW5ncyBkcmF3IHRoZW1zZWx2ZXMgYXMgdGhlIHBhZ2UgYXJyaXZlcywgdGhlbiBzdGF5IGRyYXduLlxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5kcmF3T24gPSBmYWxzZSB9LCAxNTAwKVxuICAgIGxvYWRGb3JlaWduKCkudGhlbigoKSA9PiBjb25uZWN0QWxsKCkpLmNhdGNoKCgpID0+IHt9KVxuICAgIGlmIChuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLnNlYXJjaCkuZ2V0KCdhZGRQcmludGVyJykgPT09ICcxJykgdGhpcy5pbnN0YW5jZURpYWxvZ09wZW4gPSB0cnVlXG4gICAgLy8gVGhlIGNvbnNvbGUncyBsaXN0IG9mIHByaW50ZXJzIG9uIHRoaXMgbmV0d29yayBpcyBvbmUgcmVxdWVzdCwgYW5kIGl0c1xuICAgIC8vIHByaW50ZXJzIGFyZSByZWFkIGF0IG9uY2UuIFRoZSBzd2VlcCBpcyA1MDAgYW5kIG1vcmUgKGV2ZXJ5IGFkZHJlc3Mgb25cbiAgICAvLyB0d28gb3IgdGhyZWUgbmV0d29ya3MpOiBpdCB3YWl0cyB1bnRpbCB0aGUgcGFnZSBoYXMgcGFpbnRlZCwgc28gaXRcbiAgICAvLyBkb2Vzbid0IGhvbGQgdXAgdGhlIGZpcnN0IGxvYWQncyBvd24gcmVxdWVzdHMgKEtBTi01MjUsIDE0IE9jdCAyMDI2KS5cbiAgICByZWZyZXNoQ2xvdWROZWFyYnkoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICBhZnRlckZpcnN0UGFpbnQoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmdvbmUpIGRpc2NvdmVyUHJpbnRlcnMoZmFsc2UsIHsgbmVhcmJ5OiBmYWxzZSB9KS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9KVxuICAgIHN0YXJ0TmVhcmJ5KCkuY2F0Y2goKCkgPT4ge30pXG4gICAgdGhpcy50aW1lciA9IHZpc2libGVJbnRlcnZhbCgoKSA9PiB7IHJlZnJlc2hLbm93blByaW50ZXJzKCkuY2F0Y2goKCkgPT4ge30pIH0sIEhFQUxUSF9FVkVSWV9NUylcbiAgICB0aGlzLnN0YXR1c1RpbWVyID0gdmlzaWJsZUludGVydmFsKCgpID0+IHsgcmVmcmVzaExhblN0YXR1cygpLmNhdGNoKCgpID0+IHt9KSB9LCBTVEFUVVNfRVZFUllfTVMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uRGlnaXQpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLmdvbmUgPSB0cnVlXG4gICAgdGhpcy50aW1lcj8uKClcbiAgICB0aGlzLnN0YXR1c1RpbWVyPy4oKVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbkRpZ2l0KVxuICAgIHN0b3BOZWFyYnkoKVxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVycyBpbiB0aGUgZ3JvdXBzLCBpbiB0aGUgb3JkZXIgc2hvd24sIGVhY2ggb25jZTogMSB0byA5IG9wZW4gdGhlbS4gKi9cbiAgZ2V0IG51bWJlcmVkICgpOiBQcmludGVyVGlsZVtdIHtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KClcbiAgICBjb25zdCBvdXQ6IFByaW50ZXJUaWxlW10gPSBbXVxuICAgIGZvciAoY29uc3QgdCBvZiB0aGlzLnByaW50aW5nTm93KSB7XG4gICAgICBpZiAoIXNlZW4uaGFzKHQua2V5KSkge1xuICAgICAgICBzZWVuLmFkZCh0LmtleSlcbiAgICAgICAgb3V0LnB1c2godClcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBnIG9mIHRoaXMuc2hvd25Hcm91cHMpIHtcbiAgICAgIGZvciAoY29uc3QgdCBvZiB0aGlzLmdyb3VwVGlsZXNbZy5pZF0pIHtcbiAgICAgICAgaWYgKCFzZWVuLmhhcyh0LmtleSkpIHtcbiAgICAgICAgICBzZWVuLmFkZCh0LmtleSlcbiAgICAgICAgICBvdXQucHVzaCh0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRcbiAgfVxuXG4gIG9uRGlnaXQgKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmVuYWJsZUtleWJvYXJkU2hvcnRjdXRzKSByZXR1cm5cbiAgICBpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5IHx8IGV2ZW50LmFsdEtleSB8fCBldmVudFRhcmdldElzQ29udGVudEVkaXRhYmxlKGV2ZW50KSkgcmV0dXJuXG4gICAgaWYgKCEvXlsxLTldJC8udGVzdChldmVudC5rZXkpKSByZXR1cm5cbiAgICBjb25zdCB0aWxlID0gdGhpcy5udW1iZXJlZFtOdW1iZXIoZXZlbnQua2V5KSAtIDFdXG4gICAgaWYgKCF0aWxlKSByZXR1cm5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5vcGVuRW50cnkodGlsZS5lbnRyeSlcbiAgfVxuXG4gIC8qKiBPcGVuZWQgZnJvbSBoZXJlLCBhIHByaW50ZXIncyBvd24gcGFnZSBmb2xsb3dzLiAqL1xuICBhZnRlck9wZW4gKCkge1xuICAgIHRoaXMuJHJvdXRlci5wdXNoKHByaW50ZXJIb21lUGF0aCgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnQgb24gdGhlIHByaW50ZXIgRmx1aWRkIGlzIG9uIG5vdywgZnJvbSBpdHMgb3duIHNvY2tldC4gKi9cbiAgZ2V0IGFjdGl2ZUpvYiAoKTogVGlsZUpvYiB8IG51bGwge1xuICAgIGlmICghdGhpcy5wcmludGVyUHJpbnRpbmcgJiYgIXRoaXMucHJpbnRlclBhdXNlZCkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBwcmludGVyID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgY29uc3QgZXN0aW1hdGVzID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRUaW1lRXN0aW1hdGVzJ10gYXMgVGltZUVzdGltYXRlc1xuICAgIGNvbnN0IGxlZnQgPSAoZXN0aW1hdGVzLmV0YSAtIERhdGUubm93KCkpIC8gMTAwMFxuICAgIHJldHVybiB7XG4gICAgICBmaWxlOiBwcmludGVyLnByaW50X3N0YXRzPy5maWxlbmFtZSB8fCBudWxsLFxuICAgICAgcHJvZ3Jlc3M6IE1hdGguZmxvb3IoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRQcm9ncmVzcyddIGFzIG51bWJlcikgKiAxMDApLFxuICAgICAgc2Vjb25kc0xlZnQ6IGxlZnQgPiAwID8gbGVmdCA6IG51bGwsXG4gICAgICBsYXllcjogKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRMYXllciddIGFzIG51bWJlcikgfHwgbnVsbCxcbiAgICAgIGxheWVyczogKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRMYXllcnMnXSBhcyBudW1iZXIpIHx8IG51bGwsXG4gICAgICBub3p6bGU6IHR5cGVvZiBwcmludGVyLmV4dHJ1ZGVyPy50ZW1wZXJhdHVyZSA9PT0gJ251bWJlcicgPyBNYXRoLnJvdW5kKHByaW50ZXIuZXh0cnVkZXIudGVtcGVyYXR1cmUpIDogbnVsbCxcbiAgICAgIGJlZDogdHlwZW9mIHByaW50ZXIuaGVhdGVyX2JlZD8udGVtcGVyYXR1cmUgPT09ICdudW1iZXInID8gTWF0aC5yb3VuZChwcmludGVyLmhlYXRlcl9iZWQudGVtcGVyYXR1cmUpIDogbnVsbCxcbiAgICAgIG5venpsZVRhcmdldDogdHlwZW9mIHByaW50ZXIuZXh0cnVkZXI/LnRhcmdldCA9PT0gJ251bWJlcicgPyBwcmludGVyLmV4dHJ1ZGVyLnRhcmdldCA6IG51bGwsXG4gICAgICBiZWRUYXJnZXQ6IHR5cGVvZiBwcmludGVyLmhlYXRlcl9iZWQ/LnRhcmdldCA9PT0gJ251bWJlcicgPyBwcmludGVyLmhlYXRlcl9iZWQudGFyZ2V0IDogbnVsbCxcbiAgICAgIG1hdGVyaWFsOiBsb2FkZWRSZWNvcmQocHJpbnRlci5zYXZlX3ZhcmlhYmxlcz8udmFyaWFibGVzKSA/PyBudWxsXG4gICAgfVxuICB9XG5cbiAgZ2V0IHBhZ2UgKCk6IFByaW50ZXJzUGFnZSB7XG4gICAgY29uc3QgZGlyZWN0b3J5OiBEaXJlY3RvcnkgPSB7XG4gICAgICAuLi50aGlzLmRpcmVjdG9yeSxcbiAgICAgIGZvcmVpZ246IGZvcmVpZ25FbnRyaWVzKGxpdmVGb3JlaWduLnJlY29yZHMubWFwKHIgPT4gKHsgcmVjb3JkOiByLCBzdGF0dXM6IGxpdmVGb3JlaWduLnN0YXR1c1tyLmlkXSA/PyBudWxsIH0pKSlcbiAgICB9XG4gICAgcmV0dXJuIHByaW50ZXJzUGFnZSh7XG4gICAgICBkaXJlY3RvcnksXG4gICAgICBncm91cHM6IHRoaXMuYWNjb3VudCAmJiAhdGhpcy5kZWxldGlvblBlbmRpbmcgPyBjbG91ZFN0YXRlLmxheW91dC5ncm91cHMgOiBbXSxcbiAgICAgIHN0YXR1czogY2xvdWRTdGF0ZS5zdGF0dXMsXG4gICAgICBhY3RpdmVKb2I6IHRoaXMuYWN0aXZlSm9iLFxuICAgICAgc2lnbmVkSW46ICEhdGhpcy5hY2NvdW50LFxuICAgICAgcm91dGVIb2xkXG4gICAgfSlcbiAgfVxuXG4gIGdldCBtaXhlZENvbnRlbnRCbG9ja2VkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYmxvY2tzRm9yZWlnbkh0dHAoKSAmJiB0aGlzLnBhZ2Uub3RoZXIuc29tZSh0aWxlID0+IHBhZ2VCbG9ja3NQcmludGVyKGBodHRwOi8vJHt0aWxlLmVudHJ5Lmhvc3R9YCkpXG4gIH1cblxuICBvcGVuRm9yZWlnbiAodGlsZTogUHJpbnRlclRpbGUpIHtcbiAgICBjb25zdCBzbHVnID0gZm9yZWlnblNsdWdGb3JJZCh0aWxlLmVudHJ5LmZvcmVpZ24hLnJlY29yZC5pZClcbiAgICBpZiAoc2x1ZykgdGhpcy4kcm91dGVyLnB1c2goYC8ke3NsdWd9YCkuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICBhc3luYyBmb3JnZXRGb3JlaWduUHJpbnRlciAodGlsZTogUHJpbnRlclRpbGUpIHtcbiAgICBjb25zdCBuYW1lID0gdGlsZS5lbnRyeS5mb3JlaWduIS5yZWNvcmQubmFtZVxuICAgIGlmIChhd2FpdCB0aGlzLiRjb25maXJtKGBDb250cm9sIGZvcmdldHMgJHtuYW1lfSBpbiB0aGlzIGJyb3dzZXIuYCwgeyB0aXRsZTogYEZvcmdldCAke25hbWV9P2AsIGJ1dHRvblRydWVUZXh0OiAnRm9yZ2V0JywgZGFuZ2VyOiB0cnVlIH0pKSB7XG4gICAgICBhd2FpdCBmb3JnZXRGb3JlaWduKHRpbGUuZW50cnkuZm9yZWlnbiEucmVjb3JkLmlkKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hGb3JlaWduUHJpbnRlcnMgKCkge1xuICAgIGNvbnN0IGxpdmUgPSBhd2FpdCBpbXBvcnQoJ0Avc2VydmljZXMvZm9yZWlnbi1wcmludGVycy9saXZlJylcbiAgICBhd2FpdCBsaXZlLnJlZnJlc2hGb3JlaWduKClcbiAgICBhd2FpdCBsaXZlLmNvbm5lY3RBbGwoKVxuICB9XG5cbiAgLyoqIFRoZSB0aWxlcyBrZXB0IGZvciB0aGUgbmV4dCBsb2FkJ3MgY2FjaGVkIHZpZXcgKEtBTi01MjUpLCBzYXZlZCBhIHNlY29uZCBhZnRlciB0aGUgcGFnZSBzZXR0bGVzLiAqL1xuICBzbmFwc2hvdFRpbWVyID0gMFxuXG4gIEBXYXRjaCgncGFnZScpXG4gIG9uUGFnZVNuYXBzaG90ICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5zbmFwc2hvdFRpbWVyKVxuICAgIHRoaXMuc25hcHNob3RUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnN0IHRpbGVzID0gW1xuICAgICAgICB0aGlzLnBhZ2UucHJpbnRpbmdOb3csXG4gICAgICAgIHRoaXMucGFnZS5ncm91cHMubWFwKGcgPT4gZy50aWxlcyksXG4gICAgICAgIHRoaXMucGFnZS5mb3VuZCxcbiAgICAgICAgdGhpcy5wYWdlLm9mZmxpbmVcbiAgICAgIF0uZmxhdCgyKVxuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgICBzYXZlU25hcHNob3RQcmludGVycyh0aWxlcy5maWx0ZXIodCA9PiB0LmtleSAmJiAhc2Vlbi5oYXModC5rZXkpICYmICEhc2Vlbi5hZGQodC5rZXkpKS5tYXAoc25hcHNob3RQcmludGVyKSlcbiAgICB9LCAxMDAwKVxuICB9XG5cbiAgLyoqIFwiNyBwcmludGVycyDCtyAyIHByaW50aW5nIMK3IDEgZm91bmQgb24gdGhpcyBuZXR3b3JrXCI6IG9uZSBtdXRlZCBsaW5lLiAqL1xuICBnZXQgc3VtbWFyeSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjID0gdGhpcy5wYWdlLmNvdW50c1xuICAgIGNvbnN0IHBhcnRzID0gW2MucHJpbnRlcnMgPT09IDEgPyAnMSBwcmludGVyJyA6IGAke2MucHJpbnRlcnN9IHByaW50ZXJzYF1cbiAgICBpZiAoYy5wcmludGluZykgcGFydHMucHVzaChgJHtjLnByaW50aW5nfSBwcmludGluZ2ApXG4gICAgaWYgKGMucmVhZHkpIHBhcnRzLnB1c2goYCR7Yy5yZWFkeX0gcmVhZHlgKVxuICAgIGlmIChjLm5lZWRzWW91KSBwYXJ0cy5wdXNoKGAke2MubmVlZHNZb3V9ICR7Yy5uZWVkc1lvdSA9PT0gMSA/ICduZWVkcycgOiAnbmVlZCd9IHlvdWApXG4gICAgaWYgKGMub2ZmbGluZSkgcGFydHMucHVzaChgJHtjLm9mZmxpbmV9IG9mZmxpbmVgKVxuICAgIGlmIChjLmZvdW5kKSBwYXJ0cy5wdXNoKGAke2MuZm91bmR9IGZvdW5kIG9uIHRoaXMgbmV0d29ya2ApXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJyDCtyAnKVxuICB9XG5cbiAgLyoqIFdoYXQgYSBzZWFyY2ggbG9va3MgYXQ6IHRoZSBuYW1lLCB0aGUgc3RhdGUgaW4gd29yZHMsIHRoZSBsaW5lIHVuZGVyIGl0IGFuZCB0aGUgZ3JvdXAuICovXG4gIG1hdGNoZXMgKHRpbGU6IFByaW50ZXJUaWxlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcSA9IHRoaXMucXVlcnkudHJpbSgpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoIXEpIHJldHVybiB0cnVlXG4gICAgY29uc3Qgd29yZHMgPSBbdGlsZS5uYW1lLCB0aWxlLmxhYmVsLCB0aWxlLnN0YXRlLCB0aWxlLmRldGFpbCwgdGlsZS5ncm91cE5hbWUgPz8gJycsIHRpbGUuZW50cnkuaG9zdCA/PyAnJywgbmVlZHNZb3UodGlsZS5zdGF0ZSkgPyAnbmVlZHMgeW91JyA6ICcnXVxuICAgIHJldHVybiB3b3Jkcy5qb2luKCcgJykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKVxuICB9XG5cbiAgLyoqIE5vdGhpbmcgc2F2ZWQsIGxpbmtlZCBvciBmb3VuZCwgc2lnbmVkIGluIG9yIG5vdDogdGhlIGVtcHR5IHN0YXRlIGhlbHBzIGZpbmQgdGhlIGZpcnN0IHByaW50ZXIuICovXG4gIGdldCBzaG93V2VsY29tZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucGFnZS53ZWxjb21lIHx8ICghdGhpcy5wYWdlLmNvdW50cy5wcmludGVycyAmJiAhdGhpcy5wYWdlLmZvdW5kLmxlbmd0aClcbiAgfVxuXG4gIC8qKiBQcmludGluZyBhbmQgcGF1c2VkIHByaW50ZXJzIGxlYWQgdGhlIHBhZ2UsIGFuZCBzdGF5IGluIHRoZWlyIGdyb3VwcyB0b28sIHdpdGggdGhlaXIgbWVudSBhbmQgZHJhZy4gKi9cbiAgZ2V0IHByaW50aW5nTm93ICgpOiBQcmludGVyVGlsZVtdIHtcbiAgICByZXR1cm4gdGhpcy5wYWdlLnByaW50aW5nTm93LmZpbHRlcih0ID0+IHRoaXMubWF0Y2hlcyh0KSlcbiAgfVxuXG4gIC8qKiBXaXRob3V0IHByaW50ZXJzIHRvIHNlYXJjaCBhbW9uZywgc2VhcmNoIGlzIGdvbmU6IGEgcXVlcnkgbGVmdCBpbiBpdCB3b3VsZCBoaWRlIGV2ZXJ5dGhpbmcuICovXG4gIEBXYXRjaCgncGFnZS5jb3VudHMucHJpbnRlcnMnKVxuICBvblByaW50ZXJDb3VudCAoY291bnQ6IG51bWJlcikge1xuICAgIGlmIChjb3VudCA8PSAxKSB0aGlzLnF1ZXJ5ID0gJydcbiAgfVxuXG4gIC8qKiBcIm5leHQgdG8gZmluaXNoOiBXYWxudXQgaW4gM21cIi4gKi9cbiAgZ2V0IG5leHRUb0ZpbmlzaCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgdGltZWQgPSB0aGlzLnByaW50aW5nTm93LmZpbHRlcih0ID0+IHQuc3RhdGUgPT09ICdwcmludGluZycgJiYgdC5qb2I/LnNlY29uZHNMZWZ0KVxuICAgIGlmICh0aW1lZC5sZW5ndGggPCAyKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IG5leHQgPSB0aW1lZC5yZWR1Y2UoKGEsIGIpID0+IChhLmpvYiEuc2Vjb25kc0xlZnQhIDw9IGIuam9iIS5zZWNvbmRzTGVmdCEgPyBhIDogYikpXG4gICAgcmV0dXJuIGBuZXh0IHRvIGZpbmlzaDogJHtuZXh0Lm5hbWV9IGluICR7c2hvcnREdXJhdGlvbihuZXh0LmpvYiEuc2Vjb25kc0xlZnQhKX1gXG4gIH1cblxuICAvKiogQSBncm91cCdzIHByaW50ZXJzIG1hdGNoaW5nIHRoZSBzZWFyY2guICovXG4gIGZpbHRlcmVkICh0aWxlczogUHJpbnRlclRpbGVbXSk6IFByaW50ZXJUaWxlW10ge1xuICAgIHJldHVybiB0aWxlcy5maWx0ZXIodCA9PiB0aGlzLm1hdGNoZXModCkpXG4gIH1cblxuICAvKiogRWFjaCBncm91cCdzIHByaW50ZXJzIG1hdGNoaW5nIHRoZSBzZWFyY2gsIHdvcmtlZCBvdXQgb25jZSBwZXIgY2hhbmdlIHJhdGhlciB0aGFuIG9uIGV2ZXJ5IHJlbmRlci4gKi9cbiAgZ2V0IGdyb3VwVGlsZXMgKCk6IFJlY29yZDxzdHJpbmcsIFByaW50ZXJUaWxlW10+IHtcbiAgICBjb25zdCB0aWxlczogUmVjb3JkPHN0cmluZywgUHJpbnRlclRpbGVbXT4gPSB7fVxuICAgIGZvciAoY29uc3QgZyBvZiB0aGlzLnBhZ2UuZ3JvdXBzKSB0aWxlc1tnLmlkXSA9IHRoaXMuZmlsdGVyZWQoZy50aWxlcylcbiAgICByZXR1cm4gdGlsZXNcbiAgfVxuXG4gIGdldCBzaG93bkdyb3VwcyAoKTogVGlsZUdyb3VwW10ge1xuICAgIHJldHVybiB0aGlzLnBhZ2UuZ3JvdXBzLmZpbHRlcihnID0+IHtcbiAgICAgIGlmICh0aGlzLmdyb3VwVGlsZXNbZy5pZF0ubGVuZ3RoKSByZXR1cm4gdHJ1ZVxuICAgICAgaWYgKHRoaXMucXVlcnkpIHJldHVybiBmYWxzZVxuICAgICAgLy8gWW91cnMgc3RheSAodG8gcmVuYW1lLCByZW1vdmUgb3IgZHJvcCBpbnRvKTsgXCJOb3QgaW4gYSBncm91cFwiIG9ubHkgd2hpbGUgZHJhZ2dpbmcuXG4gICAgICByZXR1cm4gZy5lZGl0YWJsZSB8fCAoZy5pZCA9PT0gJ3VuZ3JvdXBlZCcgJiYgISF0aGlzLmRyYWdnaW5nKVxuICAgIH0pXG4gIH1cblxuICAvKiogXCIxIHByaW50aW5nIMK3IDIgcmVhZHlcIiwgYW5kIGZvciB5b3VyIG93biBncm91cHMgaG93IHRvIHJlYXJyYW5nZSB0aGVtLiAqL1xuICBncm91cE5vdGUgKGc6IFRpbGVHcm91cCk6IHN0cmluZyB7XG4gICAgbGV0IG5vdGUgPSBnLnRpbGVzLmxlbmd0aCA/IGcuc3VtbWFyeSA6ICcnXG4gICAgaWYgKGcuZWRpdGFibGUgJiYgIXRoaXMuaXNNb2JpbGVWaWV3cG9ydCkgbm90ZSA9IFtub3RlLCAnZHJhZyBwcmludGVycyBpbiBvciBvdXQnXS5maWx0ZXIoQm9vbGVhbikuam9pbignIMK3ICcpXG4gICAgcmV0dXJuIG5vdGVcbiAgfVxuXG4gIGdldCBmb3VuZFNob3duICgpOiBQcmludGVyVGlsZVtdIHtcbiAgICByZXR1cm4gdGhpcy5wYWdlLmZvdW5kLmZpbHRlcih0ID0+IHRoaXMubWF0Y2hlcyh0KSlcbiAgfVxuXG4gIGdldCBvdGhlclNob3duICgpOiBQcmludGVyVGlsZVtdIHtcbiAgICByZXR1cm4gdGhpcy5wYWdlLm90aGVyLmZpbHRlcih0ID0+IHRoaXMubWF0Y2hlcyh0KSlcbiAgfVxuXG4gIGdldCBvZmZsaW5lU2hvd24gKCk6IFByaW50ZXJUaWxlW10ge1xuICAgIHJldHVybiB0aGlzLnBhZ2Uub2ZmbGluZS5maWx0ZXIodCA9PiB0aGlzLm1hdGNoZXModCkpXG4gIH1cblxuICBnZXQgYW55U2hvd24gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhISh0aGlzLnByaW50aW5nTm93Lmxlbmd0aCB8fCB0aGlzLnNob3duR3JvdXBzLmxlbmd0aCB8fCB0aGlzLmZvdW5kU2hvd24ubGVuZ3RoIHx8IHRoaXMub3RoZXJTaG93bi5sZW5ndGggfHwgdGhpcy5vZmZsaW5lU2hvd24ubGVuZ3RoKVxuICB9XG5cbiAgZm91bmRBY3Rpb25zRm9yICh0aWxlOiBQcmludGVyVGlsZSkge1xuICAgIHJldHVybiB0aGlzLmZvdW5kQWN0aW9ucyh0aWxlLmVudHJ5KVxuICB9XG5cbiAgb2ZmbGluZUFjdGlvbnNGb3IgKHRpbGU6IFByaW50ZXJUaWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aW9uc0Zvcih0aWxlLmVudHJ5KVxuICB9XG5cbiAgb25Gb3VuZFJvdyAodGlsZTogUHJpbnRlclRpbGUsIGlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5vbkZvdW5kQWN0aW9uKHRpbGUuZW50cnksIGlkKVxuICB9XG5cbiAgY29ubmVjdFN0ZXBzICh0aWxlOiBQcmludGVyVGlsZSk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGlkID0gdGlsZS5lbnRyeS5lbmRwb2ludElkID8/IHRpbGUuZW50cnkubmVhcmJ5Py5lbmRwb2ludElkID8/ICcnXG4gICAgaWYgKCFpZCB8fCAhd2FudHNCbHVldG9vdGhGb3IoaWQpKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGF0ID0gYmx1ZXRvb3RoQ2FycnlpbmcoaWQpID8gMiA6IGFjdGl2YXRpb25TdGF0ZS5zd2l0Y2hpbmcgPT09IGlkID8gMSA6IDBcbiAgICBjb25zdCBuYW1lcyA9IFtgRmluZGluZyAke3RpbGUubmFtZX1gLCAnQ29ubmVjdGluZycsICdPcGVuaW5nJ11cbiAgICByZXR1cm4gbmFtZXMubWFwKChuLCBpKSA9PiBpID09PSBhdCA/IGBbJHtufV1gIDogbikuam9pbignID4gJylcbiAgfVxuXG4gIG9uRm91bmRDYW5jZWwgKHRpbGU6IFByaW50ZXJUaWxlKSB7XG4gICAgdGhpcy5jYW5jZWxPcGVuKHRpbGUuZW50cnkpXG4gIH1cblxuICBvbk9mZmxpbmVSb3cgKHRpbGU6IFByaW50ZXJUaWxlLCBpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMub25BY3Rpb24odGlsZS5lbnRyeSwgaWQpXG4gIH1cblxuICBkcm9wSGludCAoZzogVGlsZUdyb3VwKTogc3RyaW5nIHtcbiAgICBpZiAoZy5pZCA9PT0gJ3VuZ3JvdXBlZCcpIHJldHVybiAnRHJvcCBhIHByaW50ZXIgaGVyZSB0byB0YWtlIGl0IG91dCBvZiBpdHMgZ3JvdXAnXG4gICAgcmV0dXJuIGcudGlsZXMubGVuZ3RoID8gJ0Ryb3AgYSBwcmludGVyIGhlcmUnIDogJ0RyYWcgcHJpbnRlcnMgaGVyZSdcbiAgfVxuXG4gIC8qKiBHcmlkIG9yIExpc3QsIG9uIGV2ZXJ5IHNpemUuICovXG4gIGdldCB0aWxlVmFyaWFudCAoKTogJ2NhcmQnIHwgJ3Jvdycge1xuICAgIHJldHVybiB0aGlzLnZpZXcgPT09ICdsaXN0JyA/ICdyb3cnIDogJ2NhcmQnXG4gIH1cblxuICBnZXQgZ3JpZENsYXNzICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgcHJpbnRlcnNfX2dyaWQgcHJpbnRlcnNfX2dyaWQtLSR7dGhpcy50aWxlVmFyaWFudH1gXG4gIH1cblxuICAvKiogUGF1c2UsIHJlc3VtZSBvciBzdG9wIHRoZSBwcmludCBvbiB0aGUgcHJpbnRlciBGbHVpZGQgaXMgb24sIG9uY2UgcGVyIGNsaWNrIGhvd2V2ZXIgZmFzdCBpdCBpcyBjbGlja2VkLiAqL1xuICBjb250cm9sIChhY3Rpb246ICgpID0+IHVua25vd24pIHtcbiAgICBpZiAodGhpcy5jb250cm9sQnVzeSkgcmV0dXJuXG4gICAgdGhpcy5jb250cm9sQnVzeSA9IHRydWVcbiAgICBQcm9taXNlLnJlc29sdmUoYWN0aW9uLmNhbGwodGhpcykpLmNhdGNoKCgpID0+IHt9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5jb250cm9sQnVzeSA9IGZhbHNlIH0sIDEyMDApXG4gICAgfSlcbiAgfVxuXG4gIHNldFZpZXcgKHZpZXc6IFZpZXcpIHtcbiAgICB0aGlzLnZpZXcgPSB2aWV3XG4gICAgdHJ5IHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFZJRVdfS0VZLCB2aWV3KVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gVGhlIGNob2ljZSBob2xkcyBmb3IgdGhpcyB2aXNpdC5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHBhcnQncyBwaWN0dXJlOiBmb3IgdGhlIHByaW50ZXIgRmx1aWRkIGlzIG9uLCBmcm9tIGl0cyBvd24gc3RvcmU7XG4gICAqIGZvciBhbnkgb3RoZXIsIHJlYWQgZnJvbSB0aGF0IHByaW50ZXIgKG9uIHRoaXMgbmV0d29yaywgb3IgdGhyb3VnaFxuICAgKiBNdW9uM0QpIG9uY2UgcGVyIGZpbGUuXG4gICAqL1xuICB0aHVtYm5haWxGb3IgKHRpbGU6IFByaW50ZXJUaWxlKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKHRpbGUuZW50cnkuYWN0aXZlKSB7XG4gICAgICBjb25zdCBmaWxlID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmN1cnJlbnRfZmlsZVxuICAgICAgaWYgKCFmaWxlPy50aHVtYm5haWxzPy5sZW5ndGgpIHJldHVybiBudWxsXG4gICAgICByZXR1cm4gdGhpcy5nZXRUaHVtYlVybChmaWxlLCAnZ2NvZGVzJywgZmlsZS5wYXRoLCB0cnVlLCBmaWxlLm1vZGlmaWVkKSA/PyBudWxsXG4gICAgfVxuICAgIGNvbnN0IGZpbGVuYW1lID0gdGlsZS5qb2I/LmZpbGVcbiAgICBpZiAoIWZpbGVuYW1lKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGxhbiA9IHRpbGUuZW50cnkubGFuXG4gICAgaWYgKGxhbiAmJiAhdGlsZS5yZW1vdGUpIHJldHVybiBqb2JQaWN0dXJlKGBsYW46JHtsYW4uYXBpVXJsfWAsIGZpbGVuYW1lLCBwYXRoID0+IGxhbkZldGNoKGAke2xhbi5hcGlVcmx9JHtwYXRofWApKVxuICAgIGNvbnN0IGNsb3VkID0gdGlsZS5lbnRyeS5jbG91ZFxuICAgIGlmIChjbG91ZCkgcmV0dXJuIGpvYlBpY3R1cmUoYGNsb3VkOiR7Y2xvdWQuaWR9YCwgZmlsZW5hbWUsIGFzeW5jIHBhdGggPT4gKGF3YWl0IGNsb3VkUHJpbnRlckNvbm5lY3Rpb24oY2xvdWQuaWQpKS5mZXRjaChwYXRoKSlcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLyoqIFdoYXQgQWRkIGEgcHJpbnRlciBvZmZlcnMgaW4gb25lIHRhcDogdGhlIHByaW50ZXJzIGZvdW5kIGhlcmUgdGhhdCBpdCBjYW4gb3Blbi4gKi9cbiAgZ2V0IGZvdW5kQ2hvaWNlcyAoKTogRm91bmRDaG9pY2VbXSB7XG4gICAgcmV0dXJuIHRoaXMucGFnZS5mb3VuZFxuICAgICAgLmZpbHRlcih0ID0+IHQuZW50cnkucm93Py5hY3Rpb24gPT09ICdvcGVuJyAmJiAhIXQuZW50cnkuaG9zdClcbiAgICAgIC5tYXAodCA9PiAoeyBrZXk6IHQua2V5LCBuYW1lOiB0Lm5hbWUsIGRldGFpbDogdC5lbnRyeS5ob3N0ID8/IHQuZGV0YWlsIH0pKVxuICB9XG5cbiAgb25QaWNrRm91bmQgKGtleTogc3RyaW5nKSB7XG4gICAgY29uc3QgdGlsZSA9IHRoaXMucGFnZS5mb3VuZC5maW5kKHQgPT4gdC5rZXkgPT09IGtleSlcbiAgICBpZiAodGlsZSkgdGhpcy5vcGVuRm91bmRFbnRyeSh0aWxlLmVudHJ5KVxuICB9XG5cbiAgb25Gb3VuZEFjdGlvbiAoZTogRGlyZWN0b3J5RW50cnksIGlkOiBzdHJpbmcpIHtcbiAgICBpZiAoaWQgPT09ICdzZXQtdXAnIHx8IGlkID09PSAnbmVhcmJ5LWluZm8nKSByZXR1cm4gdGhpcy5vcGVuRm91bmRFbnRyeShlKVxuICAgIHJldHVybiB0aGlzLm9uQWN0aW9uKGUsIGlkKVxuICB9XG5cbiAgLy8gLS0gZ3JvdXBzICh0aGUgYWNjb3VudCdzLCBVNikgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBnZXQgY2FuR3JvdXAgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuYWNjb3VudCAmJiAhdGhpcy5kZWxldGlvblBlbmRpbmdcbiAgfVxuXG4gIHBlcnNpc3RHcm91cHMgKGdyb3VwczogQXJyYXk8eyBpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHByaW50ZXJzOiBzdHJpbmdbXSB9Pikge1xuICAgIHNhdmVMYXlvdXQoeyAuLi5jbG91ZFN0YXRlLmxheW91dCwgZ3JvdXBzIH0pXG4gIH1cblxuICBhZGRHcm91cCAoKSB7XG4gICAgY29uc3QgaWQgPSBgZyR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9YFxuICAgIGNvbnN0IGdyb3VwcyA9IGNsb3VkU3RhdGUubGF5b3V0Lmdyb3Vwc1xuICAgIHRoaXMucGVyc2lzdEdyb3VwcyhbLi4uZ3JvdXBzLCB7IGlkLCBuYW1lOiBgR3JvdXAgJHtncm91cHMubGVuZ3RoICsgMX1gLCBwcmludGVyczogW10gfV0pXG4gICAgdGhpcy5zdGFydFJlbmFtZShpZClcbiAgfVxuXG4gIHN0YXJ0UmVuYW1lIChpZDogc3RyaW5nKSB7XG4gICAgdGhpcy5yZW5hbWluZyA9IGlkXG4gICAgdGhpcy5yZW5hbWVEcmFmdCA9IGNsb3VkU3RhdGUubGF5b3V0Lmdyb3Vwcy5maW5kKGcgPT4gZy5pZCA9PT0gaWQpPy5uYW1lID8/ICcnXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgY29uc3QgaW5wdXQgPSAodGhpcy4kcmVmcy5yZW5hbWUgYXMgSFRNTElucHV0RWxlbWVudFtdIHwgdW5kZWZpbmVkKT8uWzBdXG4gICAgICBpbnB1dD8uZm9jdXMoKVxuICAgICAgaW5wdXQ/LnNlbGVjdCgpXG4gICAgfSlcbiAgfVxuXG4gIG9uUmVuYW1lSW5wdXQgKGV2ZW50OiBFdmVudCkge1xuICAgIHRoaXMucmVuYW1lRHJhZnQgPSAoZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlXG4gIH1cblxuICBmaW5pc2hSZW5hbWUgKGlkOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5yZW5hbWluZyAhPT0gaWQpIHJldHVyblxuICAgIHRoaXMucmVuYW1pbmcgPSBudWxsXG4gICAgY29uc3QgbmFtZSA9IHRoaXMucmVuYW1lRHJhZnQudHJpbSgpXG4gICAgaWYgKCFuYW1lKSByZXR1cm5cbiAgICB0aGlzLnBlcnNpc3RHcm91cHMoY2xvdWRTdGF0ZS5sYXlvdXQuZ3JvdXBzLm1hcChnID0+IChnLmlkID09PSBpZCA/IHsgLi4uZywgbmFtZSB9IDogZykpKVxuICB9XG5cbiAgcmVtb3ZlR3JvdXAgKGlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLnBlcnNpc3RHcm91cHMoY2xvdWRTdGF0ZS5sYXlvdXQuZ3JvdXBzLmZpbHRlcihnID0+IGcuaWQgIT09IGlkKSlcbiAgfVxuXG4gIG9uRHJhZ1N0YXJ0ICh0aWxlOiBQcmludGVyVGlsZSkge1xuICAgIHRoaXMuZHJhZ2dpbmcgPSB0aWxlLmVudHJ5LmNsb3VkPy5pZCA/PyBudWxsXG4gIH1cblxuICBvbkRyYWdFbmQgKCkge1xuICAgIHRoaXMuZHJhZ2dpbmcgPSBudWxsXG4gICAgdGhpcy5kcm9wVGFyZ2V0ID0gbnVsbFxuICB9XG5cbiAgb25EcmFnT3ZlciAoZzogVGlsZUdyb3VwKSB7XG4gICAgaWYgKHRoaXMuZHJhZ2dpbmcgJiYgKGcuZWRpdGFibGUgfHwgZy5pZCA9PT0gJ3VuZ3JvdXBlZCcpKSB0aGlzLmRyb3BUYXJnZXQgPSBnLmlkXG4gIH1cblxuICAvLyAtLSB0aGUgQmVuY2ggLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogRWFjaCBwcmludGVyJ3MgaG92ZXIgYWN0aW9ucywgYnkgdGlsZSBrZXk6IHdvcmtlZCBvdXQgb25jZSBwZXIgY2hhbmdlLCBub3RcbiAgICogb24gZXZlcnkgcmVuZGVyLCBmb3IgdGhlIGJlbmNoZXMsIE9mZmxpbmUgYW5kIChhcyBpdHMgb25lIHRoaW5nIHRvIGRvKSBGb3VuZC5cbiAgICovXG4gIGdldCBiZW5jaEFjdGlvbnNCeUtleSAoKTogUmVjb3JkPHN0cmluZywgQmVuY2hBY3Rpb25bXT4ge1xuICAgIGNvbnN0IGFjdGlvbnM6IFJlY29yZDxzdHJpbmcsIEJlbmNoQWN0aW9uW10+ID0ge31cbiAgICBmb3IgKGNvbnN0IGcgb2YgdGhpcy5wYWdlLmdyb3VwcykgZm9yIChjb25zdCB0IG9mIGcudGlsZXMpIGFjdGlvbnNbdC5rZXldID0gdGhpcy5iZW5jaEFjdGlvbnModClcbiAgICBmb3IgKGNvbnN0IHQgb2YgdGhpcy5wYWdlLm9mZmxpbmUpIGFjdGlvbnNbdC5rZXldID0gdGhpcy5iZW5jaEFjdGlvbnModClcbiAgICBmb3IgKGNvbnN0IHQgb2YgdGhpcy5wYWdlLmZvdW5kKSBhY3Rpb25zW3Qua2V5XSA9IHRoaXMuZm91bmRPbmUodClcbiAgICByZXR1cm4gYWN0aW9uc1xuICB9XG5cbiAgLyoqXG4gICAqIE9uIGhvdmVyOiBPcGVuLCBhbmQgd2hhdCB0aGUgcHJpbnRlciBtb3N0IGxpa2VseSB3YW50cyBuZXh0LCB3aGVyZSBDb250cm9sIGNhbiBkbyBpdC5cbiAgICogQW4gb2ZmbGluZSBwcmludGVyIGFsc28gaGFzIHdoYXQgaXRzIEdyaWQgdGlsZSBoYXM6IFJlbW92ZSwgYW5kIFJldHJ5IEJsdWV0b290aC5cbiAgICovXG4gIGJlbmNoQWN0aW9ucyAodGlsZTogUHJpbnRlclRpbGUpOiBCZW5jaEFjdGlvbltdIHtcbiAgICBjb25zdCBhY3Rpb25zOiBCZW5jaEFjdGlvbltdID0gW3sgaWQ6ICdvcGVuJywgbGFiZWw6ICdPcGVuJyB9XVxuICAgIGlmICh0aWxlLmVudHJ5LmFjdGl2ZSAmJiB0aWxlLnN0YXRlID09PSAncHJpbnRpbmcnKSBhY3Rpb25zLnB1c2goeyBpZDogJ3BhdXNlJywgbGFiZWw6ICdQYXVzZScsIGRpc2FibGVkOiB0aGlzLmNvbnRyb2xCdXN5IH0pXG4gICAgZWxzZSBpZiAodGlsZS5lbnRyeS5hY3RpdmUgJiYgdGlsZS5zdGF0ZSA9PT0gJ3BhdXNlZCcpIGFjdGlvbnMucHVzaCh7IGlkOiAncmVzdW1lJywgbGFiZWw6ICdSZXN1bWUnLCBkaXNhYmxlZDogdGhpcy5jb250cm9sQnVzeSB9KVxuICAgIGlmICh0aWxlLnN0YXRlID09PSAnb2ZmbGluZScpIHtcbiAgICAgIGZvciAoY29uc3QgYSBvZiB0aGlzLmFjdGlvbnNGb3IodGlsZS5lbnRyeSkpIHtcbiAgICAgICAgaWYgKGEuaWQgPT09ICdyZW1vdmUnIHx8IGEuaWQgPT09ICdyZXRyeS1ibHVldG9vdGgnKSBhY3Rpb25zLnB1c2goeyBpZDogYS5pZCwgbGFiZWw6IGEubGFiZWwsIGRpc2FibGVkOiBhLmRpc2FibGVkIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY3Rpb25zXG4gIH1cblxuICBvbkJlbmNoQWN0aW9uICh0aWxlOiBQcmludGVyVGlsZSwgaWQ6IHN0cmluZykge1xuICAgIGlmIChpZCA9PT0gJ29wZW4nKSByZXR1cm4gdGhpcy5vcGVuRW50cnkodGlsZS5lbnRyeSlcbiAgICBpZiAoaWQgPT09ICdwYXVzZScpIHJldHVybiB0aGlzLmNvbnRyb2wodGhpcy5wYXVzZVByaW50KVxuICAgIGlmIChpZCA9PT0gJ3Jlc3VtZScpIHJldHVybiB0aGlzLmNvbnRyb2wodGhpcy5yZXN1bWVQcmludClcbiAgICByZXR1cm4gdGhpcy5vbkFjdGlvbih0aWxlLmVudHJ5LCBpZClcbiAgfVxuXG4gIG9uT3RoZXJBY3Rpb24gKHRpbGU6IFByaW50ZXJUaWxlLCBpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGlkID09PSAnZm9yZ2V0JyA/IHRoaXMuZm9yZ2V0Rm9yZWlnblByaW50ZXIodGlsZSkgOiB0aGlzLm9wZW5Gb3JlaWduKHRpbGUpXG4gIH1cblxuICAvKipcbiAgICogQSBwcmludGVyIGZvdW5kIG5lYXJieSB0aGF0IGlzbid0IHlvdXJzIGhhcyBleGFjdGx5IG9uZSB0aGluZyB0byBkbyB3aXRoXG4gICAqIGl0OiBTZXQgdXAgYSBuZXcgb25lLCBBZGQgb25lIHRoYXQgaXMgc2V0IHVwIGFuZCBsaW5rZWQgdG8gbm8gb25lLCBvciBhc2tcbiAgICogdGhlIG93bmVyIG9mIG9uZSBpbiBhbm90aGVyIGFjY291bnQuXG4gICAqL1xuICBmb3VuZE9uZSAodGlsZTogUHJpbnRlclRpbGUpOiBCZW5jaEFjdGlvbltdIHtcbiAgICBjb25zdCBlID0gdGlsZS5lbnRyeVxuICAgIGlmIChlLnJvdz8uYWN0aW9uID09PSAnc2V0LXVwJykgcmV0dXJuIFt7IGlkOiAnc2V0LXVwJywgbGFiZWw6ICdTZXQgdXAnIH1dXG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuZm91bmRBY3Rpb25zKGUpXG4gICAgY29uc3QgYXNrID0gYWN0aW9ucy5maW5kKGEgPT4gYS5pZCA9PT0gJ2FzaycpXG4gICAgaWYgKGFzaykgcmV0dXJuIFt7IGlkOiAnYXNrJywgbGFiZWw6ICdBc2sgaXRzIG93bmVyJywgZGlzYWJsZWQ6IGFzay5kaXNhYmxlZCB9XVxuICAgIGNvbnN0IGxpbmsgPSBhY3Rpb25zLmZpbmQoYSA9PiBhLmlkID09PSAnbGluaycpXG4gICAgaWYgKGxpbmspIHJldHVybiBbeyBpZDogJ2xpbmsnLCBsYWJlbDogJ0FkZCcsIGRpc2FibGVkOiBsaW5rLmRpc2FibGVkIH1dXG4gICAgY29uc3QgY29ubmVjdCA9IGFjdGlvbnMuZmluZChhID0+IGEuaWQgPT09ICdjb25uZWN0JylcbiAgICBpZiAoY29ubmVjdCkgcmV0dXJuIFt7IGlkOiAnY29ubmVjdCcsIGxhYmVsOiAnQWRkJywgZGlzYWJsZWQ6IGNvbm5lY3QuZGlzYWJsZWQgfV1cbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIG9uRHJhZ092ZXJOZXcgKCkge1xuICAgIGlmICh0aGlzLmRyYWdnaW5nKSB0aGlzLmRyb3BUYXJnZXQgPSB0aGlzLm5ld0JlbmNoXG4gIH1cblxuICAvKiogRHJvcHBlZCBvbiBcIk5ldyBiZW5jaFwiOiBhIG5ldyBiZW5jaCB3aXRoIHRoaXMgcHJpbnRlciBvbiBpdCwgbmFtZWQgZm9yIHJlbmFtaW5nLiAqL1xuICBvbkRyb3BOZXcgKCkge1xuICAgIGNvbnN0IGlkID0gdGhpcy5kcmFnZ2luZ1xuICAgIHRoaXMub25EcmFnRW5kKClcbiAgICBpZiAoIWlkKSByZXR1cm5cbiAgICBjb25zdCBncm91cElkID0gYGcke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfWBcbiAgICBjb25zdCBncm91cHMgPSBjbG91ZFN0YXRlLmxheW91dC5ncm91cHMubWFwKHggPT4gKHsgLi4ueCwgcHJpbnRlcnM6IHgucHJpbnRlcnMuZmlsdGVyKHAgPT4gcCAhPT0gaWQpIH0pKVxuICAgIHRoaXMucGVyc2lzdEdyb3VwcyhbLi4uZ3JvdXBzLCB7IGlkOiBncm91cElkLCBuYW1lOiBgQmVuY2ggJHtncm91cHMubGVuZ3RoICsgMX1gLCBwcmludGVyczogW2lkXSB9XSlcbiAgICB0aGlzLnN0YXJ0UmVuYW1lKGdyb3VwSWQpXG4gIH1cblxuICAvKiogSW50byBvbmUgb2YgeW91ciBncm91cHMsIG9yIG91dCBvZiB0aGVtIGFsbCBvbnRvIE5vdCBpbiBhIGdyb3VwLiAqL1xuICBvbkRyb3AgKGc6IFRpbGVHcm91cCkge1xuICAgIGNvbnN0IGlkID0gdGhpcy5kcmFnZ2luZ1xuICAgIHRoaXMub25EcmFnRW5kKClcbiAgICBpZiAoIWlkIHx8ICEoZy5lZGl0YWJsZSB8fCBnLmlkID09PSAndW5ncm91cGVkJykpIHJldHVyblxuICAgIGNvbnN0IGdyb3VwcyA9IGNsb3VkU3RhdGUubGF5b3V0Lmdyb3Vwcy5tYXAoeCA9PiAoeyAuLi54LCBwcmludGVyczogeC5wcmludGVycy5maWx0ZXIocCA9PiBwICE9PSBpZCkgfSkpXG4gICAgY29uc3QgdGFyZ2V0ID0gZ3JvdXBzLmZpbmQoeCA9PiB4LmlkID09PSBnLmlkKVxuICAgIGlmICh0YXJnZXQpIHRhcmdldC5wcmludGVycy5wdXNoKGlkKVxuICAgIHRoaXMucGVyc2lzdEdyb3Vwcyhncm91cHMpXG4gIH1cblxuICAvLyAtLSBrZWVwaW5nIHNhdmVkIHByaW50ZXJzIGN1cnJlbnQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBBIHNhdmVkIHByaW50ZXIgc2FpZCB3aG8gaXQgaXMsIG9yIG1vdmVkOiBrZWVwIHRoZSBzYXZlZCBlbnRyeSB1cCB0byBkYXRlLiAqL1xuICBAV2F0Y2goJ3NhdmVkRm91bmQnLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICBvbkZvdW5kICgpIHtcbiAgICBmb3IgKGNvbnN0IHVwZGF0ZSBvZiBzYXZlZFVwZGF0ZXModGhpcy5zYXZlZEluc3RhbmNlcywgZGlzY292ZXJ5U3RhdGUuZm91bmQsICEhZGlzY292ZXJ5U3RhdGUuYmxvY2tlZEJ5UGFnZSkpIHtcbiAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvcmVsb2NhdGVJbnN0YW5jZScsIHVwZGF0ZSlcbiAgICB9XG4gIH1cblxuICBnZXQgc2F2ZWRGb3VuZCAoKSB7XG4gICAgcmV0dXJuIGRpc2NvdmVyeVN0YXRlLmZvdW5kLm1hcChsID0+IGAke2wuZW5kcG9pbnRJZH1AJHtsYW5BZGRyZXNzZXMobCkuam9pbignLCcpfWApLmpvaW4oJzsnKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc3JjPVwiQC9jb21wb25lbnRzL3ByaW50ZXJzL3ByaW50ZXJzLXVpLnNjc3NcIj48L3N0eWxlPlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5wcmludGVycyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMjhweDtcbiAgICBtYXgtd2lkdGg6IDE0NDBweDtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBwYWRkaW5nOiAxMnB4IDE2cHggNDBweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgLnByaW50ZXJzLS1waG9uZSB7XG4gICAgZ2FwOiAyMnB4O1xuICAgIHBhZGRpbmc6IDRweCAwIDI0cHg7XG4gIH1cblxuICAvLyAtLSB0aGUgb25lIGdyaWQ6IDQgYWNyb3NzIG9uIGRlc2t0b3AsIDIgb24gYSB0YWJsZXQgYW5kIGEgcGhvbmUgKHYzIHNlY3Rpb24gNykgLS0tLVxuXG4gIC5wcmludGVyc19fZ3JpZCB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCg0LCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgZ2FwOiAxNnB4O1xuICB9XG5cbiAgLnByaW50ZXJzX19ncmlkLS1yb3cge1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KDAsIDFmcik7XG4gICAgZ2FwOiAwO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG5cbiAgICA+ICogKyAqIHtcbiAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICB9XG4gIH1cblxuICAucHJpbnRlcnNfX25vdyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgZ2FwOiAxNnB4O1xuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDEwMjNweCkge1xuICAgIC5wcmludGVyc19fZ3JpZC0tY2FyZCB7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgfVxuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDY5OXB4KSB7XG4gICAgLnByaW50ZXJzX19ncmlkLS1jYXJkIHtcbiAgICAgIGdhcDogMTJweDtcbiAgICB9XG5cbiAgICAucHJpbnRlcnNfX25vdyB7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IG1pbm1heCgwLCAxZnIpO1xuICAgIH1cbiAgfVxuXG4gIC5wcmludGVyc19fc2VjdGlvbi0tZHJvcCB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgMnB4IHZhcigtLW0zZC1hY2NlbnQpLCAwIDAgMCAxMHB4IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gIH1cblxuICAucHJpbnRlcnNfX2dyb3VwLW5hbWUge1xuICAgIG1hcmdpbjogMDtcbiAgICBmb250LXNpemU6IDIwcHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC5wcmludGVycy0tcGhvbmUgLnByaW50ZXJzX19ncm91cC1uYW1lIHtcbiAgICBmb250LXNpemU6IDE3cHg7XG4gIH1cblxuICAucHJpbnRlcnNfX2JlbmNoLW5hbWUge1xuICAgIG1hcmdpbjogMDtcbiAgICBmb250LXNpemU6IDE1cHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC8vIFwiTmV3IGJlbmNoXCI6IGEgZmFpbnQgZGFzaGVkIGJlbmNoIHdpdGggbm8gYm94LCB3aGljaCB0YWtlcyBhIGRyb3BwZWQgcHJpbnRlci5cbiAgLnByaW50ZXJzX19uZXctYmVuY2gge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAganVzdGlmeS1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMnB4O1xuICAgIG1hcmdpbi1ib3R0b206IDE0cHg7XG4gICAgcGFkZGluZzogMTJweCAyMHB4IDE0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBjdXJzb3I6IGNvcHk7XG4gICAgdHJhbnNpdGlvbjpcbiAgICAgIGNvbG9yIHZhcigtLW0zZC1tb3Rpb24tYmFzZSkgdmFyKC0tbTNkLWVhc2Utc3RhbmRhcmQpLFxuICAgICAgdHJhbnNmb3JtIHZhcigtLW0zZC1zcHJpbmctc25hcHB5LWR1cmF0aW9uKSB2YXIoLS1tM2Qtc3ByaW5nLXNuYXBweSk7XG5cbiAgICBzdmcge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICBoZWlnaHQ6IDQwcHg7XG4gICAgICBmaWxsOiBub25lO1xuICAgICAgc3Ryb2tlOiB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICAgIHN0cm9rZS13aWR0aDogMjtcbiAgICAgIHN0cm9rZS1kYXNoYXJyYXk6IDcgNjtcbiAgICAgIHN0cm9rZS1saW5lY2FwOiByb3VuZDtcbiAgICAgIHRyYW5zaXRpb246IHN0cm9rZSB2YXIoLS1tM2QtbW90aW9uLWJhc2UpIHZhcigtLW0zZC1lYXNlLXN0YW5kYXJkKTtcblxuICAgICAgcGF0aCB7IHZlY3Rvci1lZmZlY3Q6IG5vbi1zY2FsaW5nLXN0cm9rZTsgfVxuICAgIH1cblxuICAgIHNwYW4ge1xuICAgICAgbWFyZ2luLXRvcDogLTM0cHg7XG4gICAgICBwYWRkaW5nOiA0cHggMTJweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWJnKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgc21hbGwge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgICBmb250LXNpemU6IDExLjVweDtcbiAgICB9XG5cbiAgICAmOmhvdmVyLFxuICAgICYucHJpbnRlcnNfX25ldy1iZW5jaC0tb3ZlciB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG5cbiAgICAgIHN2ZyB7IHN0cm9rZTogdmFyKC0tbTNkLWFjY2VudCk7IH1cbiAgICB9XG5cbiAgICAmLnByaW50ZXJzX19uZXctYmVuY2gtLW92ZXIgeyB0cmFuc2Zvcm06IHNjYWxlKDEuMDEpOyB9XG5cbiAgICAvLyBPbmx5IHRoZSBiZW5jaCBpdHNlbGYgdGFrZXMgdGhlIGRyYWc6IG1vdmluZyBvdmVyIGl0cyB3b3JkcyBvciBsaW5lXG4gICAgLy8gd291bGQgZmlyZSBhIGRyYWdsZWF2ZSBhbmQgZHJvcCB0aGUgaGlnaGxpZ2h0LlxuICAgID4gKiB7IHBvaW50ZXItZXZlbnRzOiBub25lOyB9XG4gIH1cblxuICAucHJpbnRlcnNfX3JlbmFtZSB7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIHBhZGRpbmc6IDJweCA4cHg7XG4gICAgYm9yZGVyOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250OiBpbmhlcml0O1xuICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICB9XG5cbiAgLmRyb3AtaGludCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWluLWhlaWdodDogMTIwcHg7XG4gICAgcGFkZGluZzogMjRweDtcbiAgICBib3JkZXI6IDEuNXB4IGRhc2hlZCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyk7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICAucHJpbnRlcnNfX2dyaWQtLXJvdyAuZHJvcC1oaW50IHtcbiAgICBtaW4taGVpZ2h0OiA2MHB4O1xuICAgIGJvcmRlcjogMDtcbiAgfVxuXG4gIC8vIC0tIHN0YXRlcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC5wcmludGVyc19fbm9uZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogNDBweCAxNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG4gICAgYiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgIH1cbiAgfVxuXG4gIC5wcmludGVyc19fbm9uZS1pY29uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiA1NnB4O1xuICAgIGhlaWdodDogNTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICB9XG5cbiAgcC5wcmludGVyc19fbG9va2luZyB7XG4gICAgbWFyZ2luOiAwO1xuICB9XG5cbiAgLnByaW50ZXJzX19sb29raW5nIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLnByaW50ZXJzX19zZWN1cmUge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgYSB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIG1hcmdpbi10b3A6IDRweDtcbiAgICB9XG4gIH1cblxuICAuZm9yZWlnbi13YXJuaW5nIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5pbnNldCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMTRweCAxNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC5pbnNldF9fdGV4dCB7XG4gICAgZmxleDogMSAxIDI0MHB4O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5uZXctZ3JvdXAge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgYWxpZ24tc2VsZjogZmxleC1zdGFydDtcbiAgICBwYWRkaW5nOiA4cHggNHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL3ZpZXdzL1ByaW50ZXJzLnZ1ZSJ9