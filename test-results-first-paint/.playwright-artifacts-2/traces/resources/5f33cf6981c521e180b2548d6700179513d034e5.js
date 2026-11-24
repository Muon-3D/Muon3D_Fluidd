/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import PrinterEntriesMixin from "/src/mixins/printer-entries.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { activationState } from "/src/services/muon-cloud/activate.ts";
import { discoverPrinters } from "/src/services/muon-cloud/discovery.ts";
import {
  bluetoothCarrying,
  bluetoothDeviceFor,
  bluetoothDropped,
  bluetoothDroppedAt,
  bluetoothFellBack,
  clearBluetoothDropped,
  droppedBluetoothPrinters
} from "/src/services/muon-ble/link.ts";
import { nearbyState } from "/src/services/muon-ble/nearby.ts";
import { webBluetooth } from "/src/services/muon-ble/webBluetooth.ts";
import {
  autoMove,
  autoRetryDelay,
  dropChoices,
  nextAutoSeen,
  noteRelayLost,
  relayLostAt,
  relayTrusted,
  chooseRouteMode,
  routeMode,
  userOpenTarget
} from "/src/services/muon-cloud/route-choice.ts";
export const AUTO_SETTLE_MS = 3e3;
export const AUTO_LOOK_MS = 1e3;
export const AUTO_DISCOVER_MS = 3e4;
let BluetoothFallbackBanner = class extends Mixins(PrinterEntriesMixin) {
  retrying = false;
  /** When Bluetooth was last seen coming back, so one return gives one automatic try. */
  lastReturn = 0;
  autoTimer = null;
  /** The move auto mode is waiting to make, and since when. */
  pendingMove = null;
  lastDiscover = 0;
  get reason() {
    const id = cloudState.activePrinterId;
    return id ? bluetoothFellBack(id) : null;
  }
  /** The printer whose dropped route the sheet is about: the open one first, else any. */
  get droppedId() {
    const active = cloudState.activePrinterId;
    if (active && bluetoothDropped(active)) return active;
    return droppedBluetoothPrinters()[0] ?? null;
  }
  get allEntries() {
    const d = this.directory;
    return [...d.cloud, ...d.local, ...d.found];
  }
  entryFor(id) {
    if (!id) return null;
    const lower = id.toLowerCase();
    return this.allEntries.find((e) => e.cloud?.id.toLowerCase() === lower || e.endpointId?.toLowerCase() === lower) ?? null;
  }
  lanReachable(e) {
    if (!e) return false;
    const kind = this.localRouteFor(e).kind;
    return kind === "lan" || kind === "secure";
  }
  get droppedSheet() {
    const id = this.droppedId;
    if (!id) return null;
    const reason = bluetoothDropped(id);
    if (!reason) return null;
    if (routeMode(id) === "auto" && this.availability(id).cloud) return null;
    const e = this.entryFor(id);
    return {
      id,
      name: e?.name ?? "the printer",
      reason,
      choices: dropChoices(this.lanReachable(e), cloudState.printers.some((p) => p.id.toLowerCase() === id.toLowerCase())),
      retrying: this.retrying
    };
  }
  /**
   * A route the person chose (local network or Muon3D) that was carrying the open printer is gone
   * (KAN-1913): Control never moves the session on its own, so it says so and offers the others and Auto.
   */
  get lostSheet() {
    const lost = this.heldLost;
    if (!lost || routeMode(lost.id) !== lost.route || this.droppedSheet) return null;
    const e = this.entryFor(lost.id);
    const there = this.availability(lost.id);
    const choices = [];
    if (lost.route !== "lan" && there.lan) choices.push({ id: "lan", label: "Connect on local network" });
    if (lost.route !== "cloud" && there.cloud) choices.push({ id: "cloud", label: "Connect via cloud" });
    if (there.ble) choices.push({ id: "ble", label: "Connect over Bluetooth" });
    choices.push({ id: "auto", label: "Use Auto" });
    return { id: lost.id, name: e?.name ?? "the printer", title: `${lost.route === "lan" ? "Local network" : "Muon3D"} isn't reachable`, choices };
  }
  async chooseAfterLoss(choice) {
    const sheet = this.lostSheet;
    if (!sheet) return;
    const e = this.entryFor(sheet.id);
    if (!e) return;
    this.clearHeld();
    if (choice === "auto") {
      chooseRouteMode(sheet.id, "auto");
      this.autoSeen = sheet.id;
      return;
    }
    if (choice === "lan") return this.connectLocal(e);
    if (choice === "cloud") return this.connectCloud(e, "relay");
    const device = e.nearby?.device;
    return device ? this.connectCloud(e, device) : this.connectOverBluetooth(e);
  }
  /** The chosen route (lan or cloud) the open printer was last seen on, and when it was first seen gone. */
  heldSeen = null;
  heldDownSince = 0;
  heldLost = null;
  clearHeld() {
    this.heldSeen = null;
    this.heldDownSince = 0;
    this.heldLost = null;
  }
  /** Watches a held local or Muon3D route: seen carrying, then gone for longer than a blip, is a drop. */
  trackHeld() {
    const open = cloudState.activePrinterId ?? this.localOpenId;
    const seen = this.heldSeen;
    if (open && seen && open.toLowerCase() !== seen.id.toLowerCase()) this.clearHeld();
    const id = open ?? this.heldSeen?.id ?? null;
    const mode = routeMode(id);
    if (!id || mode !== "lan" && mode !== "cloud") return this.clearHeld();
    const target = userOpenTarget();
    if (!open && target && target !== id.toLowerCase() && !target.startsWith("address:")) return this.clearHeld();
    const route = open ? this.currentRoute(id) : null;
    if (route === mode) {
      this.heldSeen = { id, route: mode };
      this.heldDownSince = 0;
      this.heldLost = null;
      return;
    }
    if (!this.heldSeen || route !== null) return;
    if (!this.heldDownSince) this.heldDownSince = Date.now();
    if (Date.now() - this.heldDownSince >= AUTO_SETTLE_MS && !this.busyKey && !activationState.switching && !this.retrying) {
      this.heldLost = { ...this.heldSeen };
    }
  }
  async choose(choice) {
    const sheet = this.droppedSheet;
    if (!sheet) return;
    const e = this.entryFor(sheet.id);
    if (!e) return;
    if (choice === "lan") return this.connectLocal(e);
    if (choice === "cloud") return this.connectCloud(e, "relay");
    return this.tryBluetoothAgain(sheet.id);
  }
  async tryBluetoothAgain(id, automatic = false) {
    const e = this.entryFor(id);
    const device = bluetoothDeviceFor(id) ?? e?.nearby?.device ?? null;
    if (!e || this.retrying) return;
    this.retrying = true;
    try {
      if (device) await this.connectCloud(e, device);
      else await this.connectOverBluetooth(e);
    } finally {
      this.retrying = false;
      if (automatic) this.noteAutoRetry(id, !!bluetoothDropped(id));
    }
  }
  /** Per printer: how many automatic tries failed in a row, and when the next may run. */
  retryFailures = {};
  retryNotBefore = {};
  /** An automatic try ended: a failed one waits longer each time (30 s, 60 s, 120 s ... up to 10 min). */
  noteAutoRetry(id, failed) {
    const key = id.toLowerCase();
    if (!failed) {
      Vue.delete(this.retryFailures, key);
      Vue.delete(this.retryNotBefore, key);
      return;
    }
    const failures = (this.retryFailures[key] ?? 0) + 1;
    Vue.set(this.retryFailures, key, failures);
    Vue.set(this.retryNotBefore, key, Date.now() + autoRetryDelay(failures));
  }
  /**
   * Whether Bluetooth coming back may retry `id` by itself: only for the printer
   * that is open (or the one the person is opening), never for one they left,
   * and not before its backoff has passed.
   */
  mayAutoRetry(id, now = Date.now()) {
    const lower = id.toLowerCase();
    const open = cloudState.activePrinterId?.toLowerCase() ?? null;
    const target = userOpenTarget();
    if (lower !== open && lower !== target) return false;
    return now >= (this.retryNotBefore[lower] ?? 0);
  }
  // -- Bluetooth coming back -------------------------------------------------
  /** The newest sign that Bluetooth is back for the dropped printer: the radio on, or the printer heard. */
  get bluetoothBackAt() {
    const id = this.droppedId;
    if (!id || this.radioOff) return 0;
    const heard = nearbyState.printers.filter((p) => p.endpointId?.toLowerCase() === id.toLowerCase()).reduce((latest, p) => Math.max(latest, p.heardAt), 0);
    const radioBack = this.radioOff ? 0 : this.radioOnAt;
    const back = Math.max(heard, radioBack);
    return back > bluetoothDroppedAt(id) ? back : 0;
  }
  radioOnAt = 0;
  /** The radio as this sheet last heard it: the Printers page's own listener stops when it closes. */
  radioHeard = null;
  get radioOff() {
    return (this.radioHeard ?? nearbyState.radio) === "off";
  }
  get radio() {
    return nearbyState.radio;
  }
  onRadio(now, before) {
    if (now === "on" && before === "off") this.radioOnAt = Date.now();
  }
  onAvailability(event) {
    const value = event.value;
    if (typeof value !== "boolean") return;
    const was = this.radioHeard ?? nearbyState.radio;
    this.radioHeard = value ? "on" : "off";
    if (value && was !== "on") this.radioOnAt = Date.now();
  }
  onBluetoothBack(at) {
    const sheet = this.droppedSheet;
    if (!at || at <= this.lastReturn || !sheet) return;
    if (!sheet.choices.some((c) => c.id === "ble")) return;
    if (!this.mayAutoRetry(sheet.id)) return;
    this.lastReturn = at;
    this.tryBluetoothAgain(sheet.id, true);
  }
  onUserTarget(target) {
    if (!target) return;
    for (const id of droppedBluetoothPrinters()) {
      if (id.toLowerCase() !== target) clearBluetoothDropped(id);
    }
  }
  get userTarget() {
    return userOpenTarget();
  }
  // -- auto mode -------------------------------------------------------------
  availability(id) {
    const e = this.entryFor(id);
    return {
      lan: this.lanReachable(e),
      // The list says online for up to its poll after the relay is gone: not while the relay just failed.
      cloud: !!e?.cloud?.online && relayTrusted(relayLostAt(e.cloud.id), cloudState.printersAsOf, Date.now()),
      ble: (!!e?.nearby || !!bluetoothDeviceFor(id)) && !this.radioOff
    };
  }
  /** The printer auto mode looks after: the open one, when it was opened with plain Connect. */
  get autoId() {
    const active = cloudState.activePrinterId;
    if (active) return routeMode(active) === "auto" ? active : null;
    const id = this.localOpenId;
    if (id) return routeMode(id) === "auto" ? id : null;
    const seen = this.autoSeen;
    return seen && routeMode(seen) === "auto" && this.entryFor(seen) ? seen : null;
  }
  /** The printer open on the local network, if any. */
  get localOpenId() {
    const local = this.allEntries.find((e) => e.active === "local");
    return local?.cloud?.id ?? local?.endpointId ?? null;
  }
  /** The printer auto mode last looked after, so it is still looked after when its session is gone. */
  autoSeen = null;
  /** The route the looked-after printer's session was on at the last look, to see the relay go. */
  lastLook = null;
  /** Another account, or none: the printer auto mode looked after is not theirs to be dialled. */
  get accountId() {
    return cloudState.account?.id ?? null;
  }
  onAccountChanged() {
    this.autoSeen = null;
    this.lastLook = null;
  }
  /** The route the open printer's session is on, or null when it is down. */
  currentRoute(id) {
    const socket = this.$store.state.socket;
    const live = !!socket?.open;
    if (cloudState.activePrinterId?.toLowerCase() === id.toLowerCase()) {
      if (bluetoothDropped(id)) return null;
      if (!live) return null;
      return bluetoothCarrying(id) ? "ble" : "cloud";
    }
    return live ? "lan" : null;
  }
  autoTick() {
    this.trackHeld();
    const id = this.autoId;
    this.autoSeen = nextAutoSeen(this.autoSeen, {
      autoId: id,
      otherOpen: !!(cloudState.activePrinterId || this.localOpenId),
      userTarget: userOpenTarget()
    });
    const route = id ? this.currentRoute(id) : null;
    if (id && this.lastLook?.id === id && this.lastLook.route === "cloud" && route === null) noteRelayLost(id);
    this.lastLook = id ? { id, route } : null;
    if (!id || this.busyKey || activationState.switching || this.retrying) {
      this.pendingMove = null;
      return;
    }
    const now = Date.now();
    const current = this.currentRoute(id);
    if (current !== "lan" && now - this.lastDiscover > AUTO_DISCOVER_MS) {
      this.lastDiscover = now;
      discoverPrinters(false, { nearby: false }).catch(() => {
      });
    }
    const to = autoMove(current, this.availability(id));
    if (!to) {
      this.pendingMove = null;
      return;
    }
    if (this.pendingMove?.to !== to) {
      this.pendingMove = { to, since: now };
      return;
    }
    if (now - this.pendingMove.since < AUTO_SETTLE_MS) return;
    this.pendingMove = null;
    const e = this.entryFor(id);
    if (!e) return;
    if (to === "lan") this.connectLocal(e, true);
    else if (to === "cloud") this.openAuto(e, "relay");
    else {
      const device = bluetoothDeviceFor(id) ?? e.nearby?.device;
      if (device) this.openAuto(e, device);
    }
  }
  /** An auto-mode move: the same open as a chosen route, but the choice stays auto. */
  openAuto(e, route) {
    return this.connectCloud(e, route, true);
  }
  /** The switcher closes after an open; here there is nothing to close. */
  afterOpen() {
  }
  mounted() {
    this.autoTimer = setInterval(() => this.autoTick(), AUTO_LOOK_MS);
    webBluetooth()?.addEventListener("availabilitychanged", this.onAvailability);
  }
  beforeDestroy() {
    if (this.autoTimer) clearInterval(this.autoTimer);
    webBluetooth()?.removeEventListener("availabilitychanged", this.onAvailability);
  }
};
__decorateClass([
  Watch("radio")
], BluetoothFallbackBanner.prototype, "onRadio", 1);
__decorateClass([
  Watch("bluetoothBackAt")
], BluetoothFallbackBanner.prototype, "onBluetoothBack", 1);
__decorateClass([
  Watch("userTarget")
], BluetoothFallbackBanner.prototype, "onUserTarget", 1);
__decorateClass([
  Watch("accountId")
], BluetoothFallbackBanner.prototype, "onAccountChanged", 1);
BluetoothFallbackBanner = __decorateClass([
  Component({})
], BluetoothFallbackBanner);
const _sfc_main = BluetoothFallbackBanner;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.reason || _vm.droppedSheet || _vm.lostSheet ? _c("div", { staticClass: "ble-fallback", attrs: { "role": "status", "aria-live": "polite", "data-tid": "bluetooth-fallback" } }, [_c(__unplugin_components_0, { staticClass: "ble-fallback__icon", attrs: { "name": "wifi" } }), _c("div", { staticClass: "ble-fallback__text" }, [_vm.droppedSheet ? [_c("strong", [_vm._v("Bluetooth dropped")]), _c("span", { attrs: { "data-tid": "bluetooth-dropped-reason" } }, [_vm._v(_vm._s(_vm.droppedSheet.reason) + " Choose how to connect to " + _vm._s(_vm.droppedSheet.name) + ".")]), _vm.droppedSheet.retrying ? _c("span", { attrs: { "data-tid": "bluetooth-dropped-retrying" } }, [_vm._v("Trying Bluetooth again\u2026")]) : _vm._e()] : _vm.lostSheet ? [_c("strong", { attrs: { "data-tid": "route-lost-title" } }, [_vm._v(_vm._s(_vm.lostSheet.title))]), _c("span", [_vm._v("Choose how to connect to " + _vm._s(_vm.lostSheet.name) + ".")])] : [_c("strong", [_vm._v("Bluetooth didn't connect, using Muon3D instead")]), _c("span", [_vm._v(_vm._s(_vm.reason))])]], 2), _vm.lostSheet && !_vm.droppedSheet ? _c("div", { staticClass: "ble-fallback__actions" }, _vm._l(_vm.lostSheet.choices, function(choice) {
    return _c("button", { key: choice.id, attrs: { "type": "button", "data-tid": `route-lost-${choice.id}` }, on: { "click": function($event) {
      return _vm.chooseAfterLoss(choice.id);
    } } }, [_vm._v(" " + _vm._s(choice.label) + " ")]);
  }), 0) : _vm._e(), _vm.droppedSheet ? _c("div", { staticClass: "ble-fallback__actions" }, _vm._l(_vm.droppedSheet.choices, function(choice) {
    return _c("button", { key: choice.id, attrs: { "type": "button", "data-tid": `bluetooth-dropped-${choice.id}`, "disabled": _vm.droppedSheet.retrying }, on: { "click": function($event) {
      return _vm.choose(choice.id);
    } } }, [_vm._v(" " + _vm._s(choice.label) + " ")]);
  }), 0) : _vm._e()], 1) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/BluetoothFallbackBanner.vue?vue&type=style&index=0&scoped=e7f0028b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e7f0028b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/BluetoothFallbackBanner.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUErREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUlBO0FBR0E7QUFFQTtBQUVBO0FBa0NBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQ0EsdUNBQ0EsZ0VBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUVBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLGFBQ0E7QUFBQSxTQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBRUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTNKQTtBQUFBLEVBREE7QUFBQSxHQWhOQSx3QkFpTkE7QUFhQTtBQUFBLEVBREE7QUFBQSxHQTdOQSx3QkE4TkE7QUFXQTtBQUFBLEVBREE7QUFBQSxHQXhPQSx3QkF5T0E7QUFxREE7QUFBQSxFQURBO0FBQUEsR0E3UkEsd0JBOFJBO0FBOVJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkJsdWV0b290aEZhbGxiYWNrQmFubmVyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICB2LWlmPVwicmVhc29uIHx8IGRyb3BwZWRTaGVldCB8fCBsb3N0U2hlZXRcIlxuICAgIGNsYXNzPVwiYmxlLWZhbGxiYWNrXCJcbiAgICByb2xlPVwic3RhdHVzXCJcbiAgICBhcmlhLWxpdmU9XCJwb2xpdGVcIlxuICAgIGRhdGEtdGlkPVwiYmx1ZXRvb3RoLWZhbGxiYWNrXCJcbiAgPlxuICAgIDxmcmFtZS1pY29uXG4gICAgICBuYW1lPVwid2lmaVwiXG4gICAgICBjbGFzcz1cImJsZS1mYWxsYmFja19faWNvblwiXG4gICAgLz5cbiAgICA8ZGl2IGNsYXNzPVwiYmxlLWZhbGxiYWNrX190ZXh0XCI+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cImRyb3BwZWRTaGVldFwiPlxuICAgICAgICA8c3Ryb25nPkJsdWV0b290aCBkcm9wcGVkPC9zdHJvbmc+XG4gICAgICAgIDxzcGFuIGRhdGEtdGlkPVwiYmx1ZXRvb3RoLWRyb3BwZWQtcmVhc29uXCI+e3sgZHJvcHBlZFNoZWV0LnJlYXNvbiB9fSBDaG9vc2UgaG93IHRvIGNvbm5lY3QgdG8ge3sgZHJvcHBlZFNoZWV0Lm5hbWUgfX0uPC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJkcm9wcGVkU2hlZXQucmV0cnlpbmdcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiYmx1ZXRvb3RoLWRyb3BwZWQtcmV0cnlpbmdcIlxuICAgICAgICA+VHJ5aW5nIEJsdWV0b290aCBhZ2FpbuKApjwvc3Bhbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8dGVtcGxhdGUgdi1lbHNlLWlmPVwibG9zdFNoZWV0XCI+XG4gICAgICAgIDxzdHJvbmcgZGF0YS10aWQ9XCJyb3V0ZS1sb3N0LXRpdGxlXCI+e3sgbG9zdFNoZWV0LnRpdGxlIH19PC9zdHJvbmc+XG4gICAgICAgIDxzcGFuPkNob29zZSBob3cgdG8gY29ubmVjdCB0byB7eyBsb3N0U2hlZXQubmFtZSB9fS48L3NwYW4+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgICAgPHN0cm9uZz5CbHVldG9vdGggZGlkbid0IGNvbm5lY3QsIHVzaW5nIE11b24zRCBpbnN0ZWFkPC9zdHJvbmc+XG4gICAgICAgIDxzcGFuPnt7IHJlYXNvbiB9fTwvc3Bhbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cImxvc3RTaGVldCAmJiAhZHJvcHBlZFNoZWV0XCJcbiAgICAgIGNsYXNzPVwiYmxlLWZhbGxiYWNrX19hY3Rpb25zXCJcbiAgICA+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtZm9yPVwiY2hvaWNlIGluIGxvc3RTaGVldC5jaG9pY2VzXCJcbiAgICAgICAgOmtleT1cImNob2ljZS5pZFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICA6ZGF0YS10aWQ9XCJgcm91dGUtbG9zdC0ke2Nob2ljZS5pZH1gXCJcbiAgICAgICAgQGNsaWNrPVwiY2hvb3NlQWZ0ZXJMb3NzKGNob2ljZS5pZClcIlxuICAgICAgPlxuICAgICAgICB7eyBjaG9pY2UubGFiZWwgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJkcm9wcGVkU2hlZXRcIlxuICAgICAgY2xhc3M9XCJibGUtZmFsbGJhY2tfX2FjdGlvbnNcIlxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1mb3I9XCJjaG9pY2UgaW4gZHJvcHBlZFNoZWV0LmNob2ljZXNcIlxuICAgICAgICA6a2V5PVwiY2hvaWNlLmlkXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIDpkYXRhLXRpZD1cImBibHVldG9vdGgtZHJvcHBlZC0ke2Nob2ljZS5pZH1gXCJcbiAgICAgICAgOmRpc2FibGVkPVwiZHJvcHBlZFNoZWV0LnJldHJ5aW5nXCJcbiAgICAgICAgQGNsaWNrPVwiY2hvb3NlKGNob2ljZS5pZClcIlxuICAgICAgPlxuICAgICAgICB7eyBjaG9pY2UubGFiZWwgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgUHJpbnRlckVudHJpZXNNaXhpbiBmcm9tICdAL21peGlucy9wcmludGVyLWVudHJpZXMnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgYWN0aXZhdGlvblN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FjdGl2YXRlJ1xuaW1wb3J0IHsgZGlzY292ZXJQcmludGVycyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXNjb3ZlcnknXG5pbXBvcnQgdHlwZSB7IERpcmVjdG9yeUVudHJ5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2RpcmVjdG9yeSdcbmltcG9ydCB7XG4gIGJsdWV0b290aENhcnJ5aW5nLFxuICBibHVldG9vdGhEZXZpY2VGb3IsXG4gIGJsdWV0b290aERyb3BwZWQsXG4gIGJsdWV0b290aERyb3BwZWRBdCxcbiAgYmx1ZXRvb3RoRmVsbEJhY2ssXG4gIGNsZWFyQmx1ZXRvb3RoRHJvcHBlZCxcbiAgZHJvcHBlZEJsdWV0b290aFByaW50ZXJzXG59IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IG5lYXJieVN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS9uZWFyYnknXG5pbXBvcnQgeyB3ZWJCbHVldG9vdGggfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3dlYkJsdWV0b290aCdcbmltcG9ydCB7XG4gIGF1dG9Nb3ZlLFxuICBhdXRvUmV0cnlEZWxheSxcbiAgZHJvcENob2ljZXMsXG4gIG5leHRBdXRvU2VlbixcbiAgbm90ZVJlbGF5TG9zdCxcbiAgcmVsYXlMb3N0QXQsXG4gIHJlbGF5VHJ1c3RlZCxcbiAgY2hvb3NlUm91dGVNb2RlLFxuICByb3V0ZU1vZGUsXG4gIHVzZXJPcGVuVGFyZ2V0LFxuICB0eXBlIERyb3BDaG9pY2UsXG4gIHR5cGUgUm91dGUsXG4gIHR5cGUgUm91dGVBdmFpbGFiaWxpdHlcbn0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3JvdXRlLWNob2ljZSdcblxuLyoqIEhvdyBsb25nIGF1dG8gbW9kZSB3YWl0cyBvbiBhIHJvdXRlIGNoYW5nZSBiZWZvcmUgYWN0aW5nIG9uIGl0OiBhIGJsaXAgaXMgbm90IGEgY2hhbmdlLiAqL1xuZXhwb3J0IGNvbnN0IEFVVE9fU0VUVExFX01TID0gM18wMDBcbi8qKiBIb3cgb2Z0ZW4gYXV0byBtb2RlIGxvb2tzIGZvciBhIGJldHRlciByb3V0ZSB0aGFuIHRoZSBvbmUgaXQgaXMgb24uICovXG5leHBvcnQgY29uc3QgQVVUT19MT09LX01TID0gMV8wMDBcbi8qKiBIb3cgb2Z0ZW4gYXV0byBtb2RlIGFza3Mgd2hldGhlciB0aGUgcHJpbnRlciBhbnN3ZXJzIG9uIHRoaXMgbmV0d29yaywgd2hlbiBpdCBpcyBub3Qgb24gaXQuICovXG5leHBvcnQgY29uc3QgQVVUT19ESVNDT1ZFUl9NUyA9IDMwXzAwMFxuXG5pbnRlcmZhY2UgTG9zdFNoZWV0IHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBjaG9pY2VzOiBBcnJheTx7IGlkOiBSb3V0ZSB8ICdhdXRvJywgbGFiZWw6IHN0cmluZyB9Pjtcbn1cblxuaW50ZXJmYWNlIERyb3BwZWRTaGVldCB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNob2ljZXM6IERyb3BDaG9pY2VbXTtcbiAgcmV0cnlpbmc6IGJvb2xlYW47XG59XG5cbi8qKlxuICogVGhlIGNvbm5lY3Rpb24gc2hlZXQgb3ZlciBldmVyeSBwYWdlIChLQU4tMTM5NiwgS0FOLTE5MTMsIEtBTi0yMDgwKTpcbiAqXG4gKiAtIFRoZSBCbHVldG9vdGggcm91dGUgdGhlIHBlcnNvbiBjaG9zZSBkcm9wcGVkLiBDb250cm9sIGRvZXMgbm90IG1vdmUgdGhlXG4gKiAgIHNlc3Npb24gYW55d2hlcmUgb24gaXRzIG93bjogaXQgc2F5cyBcIkJsdWV0b290aCBkcm9wcGVkXCIgYW5kIG9mZmVyc1xuICogICBDb25uZWN0IG9uIGxvY2FsIG5ldHdvcmsgKG9ubHkgd2hlbiB0aGlzIHBhZ2UgY2FuIHJlYWNoIGl0IHRoZXJlKSxcbiAqICAgQ29ubmVjdCB2aWEgY2xvdWQsIGFuZCBUcnkgQmx1ZXRvb3RoIGFnYWluLiBCbHVldG9vdGggY29taW5nIGJhY2sgKHRoZVxuICogICByYWRpbyBvbiBhZ2Fpbiwgb3IgdGhlIHByaW50ZXIgaGVhcmQgYWdhaW4pIHRyaWVzIGl0IGFnYWluIGJ5IGl0c2VsZi4gQVxuICogICB0cnkgdGhhdCBmYWlscyBsZWF2ZXMgdGhlIHNoZWV0IHVwIHdpdGggdGhlIHNhbWUgdGhyZWUgY2hvaWNlcy5cbiAqIC0gQXV0byBtb2RlIChwbGFpbiBDb25uZWN0KToga2VlcHMgdGhlIHNlc3Npb24gb24gdGhlIGJlc3Qgcm91dGUgdGhlcmUgaXMsXG4gKiAgIGxvY2FsIG5ldHdvcmssIHRoZW4gY2xvdWQsIHRoZW4gQmx1ZXRvb3RoLCBhbmQgbW92ZXMgYmFjayB1cCB3aGVuIGFcbiAqICAgYmV0dGVyIG9uZSByZXR1cm5zLlxuICpcbiAqIFRoZSBkcm9wIGlzIG5vdCBhc3N1bWVkIHRvIGJlIHRoZSByYWRpbyBnb2luZyBhd2F5OiB0aGUgbGluayBjYW4gc3RheSB1cFxuICogd2hpbGUgY2Fycnlpbmcgbm90aGluZyAodGhlIGJlbmNoLCAxMiBOb3YpLCBzbyB0aGUgd29yZHMgc2F5IHdoYXQgd2FzIHNlZW4uXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCbHVldG9vdGhGYWxsYmFja0Jhbm5lciBleHRlbmRzIE1peGlucyhQcmludGVyRW50cmllc01peGluKSB7XG4gIHJldHJ5aW5nID0gZmFsc2VcbiAgLyoqIFdoZW4gQmx1ZXRvb3RoIHdhcyBsYXN0IHNlZW4gY29taW5nIGJhY2ssIHNvIG9uZSByZXR1cm4gZ2l2ZXMgb25lIGF1dG9tYXRpYyB0cnkuICovXG4gIGxhc3RSZXR1cm4gPSAwXG4gIGF1dG9UaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+IHwgbnVsbCA9IG51bGxcbiAgLyoqIFRoZSBtb3ZlIGF1dG8gbW9kZSBpcyB3YWl0aW5nIHRvIG1ha2UsIGFuZCBzaW5jZSB3aGVuLiAqL1xuICBwZW5kaW5nTW92ZTogeyB0bzogUm91dGUsIHNpbmNlOiBudW1iZXIgfSB8IG51bGwgPSBudWxsXG4gIGxhc3REaXNjb3ZlciA9IDBcblxuICBnZXQgcmVhc29uICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBpZCA9IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkXG4gICAgcmV0dXJuIGlkID8gYmx1ZXRvb3RoRmVsbEJhY2soaWQpIDogbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIHdob3NlIGRyb3BwZWQgcm91dGUgdGhlIHNoZWV0IGlzIGFib3V0OiB0aGUgb3BlbiBvbmUgZmlyc3QsIGVsc2UgYW55LiAqL1xuICBnZXQgZHJvcHBlZElkICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBhY3RpdmUgPSBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZFxuICAgIGlmIChhY3RpdmUgJiYgYmx1ZXRvb3RoRHJvcHBlZChhY3RpdmUpKSByZXR1cm4gYWN0aXZlXG4gICAgcmV0dXJuIGRyb3BwZWRCbHVldG9vdGhQcmludGVycygpWzBdID8/IG51bGxcbiAgfVxuXG4gIGdldCBhbGxFbnRyaWVzICgpOiBEaXJlY3RvcnlFbnRyeVtdIHtcbiAgICBjb25zdCBkID0gdGhpcy5kaXJlY3RvcnlcbiAgICByZXR1cm4gWy4uLmQuY2xvdWQsIC4uLmQubG9jYWwsIC4uLmQuZm91bmRdXG4gIH1cblxuICBlbnRyeUZvciAoaWQ6IHN0cmluZyB8IG51bGwpOiBEaXJlY3RvcnlFbnRyeSB8IG51bGwge1xuICAgIGlmICghaWQpIHJldHVybiBudWxsXG4gICAgY29uc3QgbG93ZXIgPSBpZC50b0xvd2VyQ2FzZSgpXG4gICAgcmV0dXJuIHRoaXMuYWxsRW50cmllcy5maW5kKGUgPT4gZS5jbG91ZD8uaWQudG9Mb3dlckNhc2UoKSA9PT0gbG93ZXIgfHwgZS5lbmRwb2ludElkPy50b0xvd2VyQ2FzZSgpID09PSBsb3dlcikgPz8gbnVsbFxuICB9XG5cbiAgbGFuUmVhY2hhYmxlIChlOiBEaXJlY3RvcnlFbnRyeSB8IG51bGwpOiBib29sZWFuIHtcbiAgICAvLyBUaGUgc2FtZSBsb2NhbC1yb3V0ZSBsb2dpYyBhcyBDb25uZWN0IGxvY2FsbHkuIEEgJ3RhYicgcm91dGUgb3BlbnMgYSBwYWdlIG9ubHkgb24gYSBjbGljaywgc28gaXQgaXMgbm8gYXV0b21hdGljIHdheSBpbi5cbiAgICBpZiAoIWUpIHJldHVybiBmYWxzZVxuICAgIGNvbnN0IGtpbmQgPSB0aGlzLmxvY2FsUm91dGVGb3IoZSkua2luZFxuICAgIHJldHVybiBraW5kID09PSAnbGFuJyB8fCBraW5kID09PSAnc2VjdXJlJ1xuICB9XG5cbiAgZ2V0IGRyb3BwZWRTaGVldCAoKTogRHJvcHBlZFNoZWV0IHwgbnVsbCB7XG4gICAgY29uc3QgaWQgPSB0aGlzLmRyb3BwZWRJZFxuICAgIGlmICghaWQpIHJldHVybiBudWxsXG4gICAgY29uc3QgcmVhc29uID0gYmx1ZXRvb3RoRHJvcHBlZChpZClcbiAgICBpZiAoIXJlYXNvbikgcmV0dXJuIG51bGxcbiAgICAvLyBBdXRvIG1vZGUgbW92ZXMgb24gYnkgaXRzZWxmOyB0aGUgc2hlZXQgaXMgZm9yIGEgcm91dGUgdGhlIHBlcnNvbiBjaG9zZSxcbiAgICAvLyBhbmQgZm9yIGF1dG8gbW9kZSB3aXRoIG5vd2hlcmUgbGVmdCB0byBnby5cbiAgICBpZiAocm91dGVNb2RlKGlkKSA9PT0gJ2F1dG8nICYmIHRoaXMuYXZhaWxhYmlsaXR5KGlkKS5jbG91ZCkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBlID0gdGhpcy5lbnRyeUZvcihpZClcbiAgICByZXR1cm4ge1xuICAgICAgaWQsXG4gICAgICBuYW1lOiBlPy5uYW1lID8/ICd0aGUgcHJpbnRlcicsXG4gICAgICByZWFzb24sXG4gICAgICBjaG9pY2VzOiBkcm9wQ2hvaWNlcyh0aGlzLmxhblJlYWNoYWJsZShlKSwgY2xvdWRTdGF0ZS5wcmludGVycy5zb21lKHAgPT4gcC5pZC50b0xvd2VyQ2FzZSgpID09PSBpZC50b0xvd2VyQ2FzZSgpKSksXG4gICAgICByZXRyeWluZzogdGhpcy5yZXRyeWluZ1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJvdXRlIHRoZSBwZXJzb24gY2hvc2UgKGxvY2FsIG5ldHdvcmsgb3IgTXVvbjNEKSB0aGF0IHdhcyBjYXJyeWluZyB0aGUgb3BlbiBwcmludGVyIGlzIGdvbmVcbiAgICogKEtBTi0xOTEzKTogQ29udHJvbCBuZXZlciBtb3ZlcyB0aGUgc2Vzc2lvbiBvbiBpdHMgb3duLCBzbyBpdCBzYXlzIHNvIGFuZCBvZmZlcnMgdGhlIG90aGVycyBhbmQgQXV0by5cbiAgICovXG4gIGdldCBsb3N0U2hlZXQgKCk6IExvc3RTaGVldCB8IG51bGwge1xuICAgIGNvbnN0IGxvc3QgPSB0aGlzLmhlbGRMb3N0XG4gICAgaWYgKCFsb3N0IHx8IHJvdXRlTW9kZShsb3N0LmlkKSAhPT0gbG9zdC5yb3V0ZSB8fCB0aGlzLmRyb3BwZWRTaGVldCkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBlID0gdGhpcy5lbnRyeUZvcihsb3N0LmlkKVxuICAgIGNvbnN0IHRoZXJlID0gdGhpcy5hdmFpbGFiaWxpdHkobG9zdC5pZClcbiAgICBjb25zdCBjaG9pY2VzOiBMb3N0U2hlZXRbJ2Nob2ljZXMnXSA9IFtdXG4gICAgaWYgKGxvc3Qucm91dGUgIT09ICdsYW4nICYmIHRoZXJlLmxhbikgY2hvaWNlcy5wdXNoKHsgaWQ6ICdsYW4nLCBsYWJlbDogJ0Nvbm5lY3Qgb24gbG9jYWwgbmV0d29yaycgfSlcbiAgICBpZiAobG9zdC5yb3V0ZSAhPT0gJ2Nsb3VkJyAmJiB0aGVyZS5jbG91ZCkgY2hvaWNlcy5wdXNoKHsgaWQ6ICdjbG91ZCcsIGxhYmVsOiAnQ29ubmVjdCB2aWEgY2xvdWQnIH0pXG4gICAgaWYgKHRoZXJlLmJsZSkgY2hvaWNlcy5wdXNoKHsgaWQ6ICdibGUnLCBsYWJlbDogJ0Nvbm5lY3Qgb3ZlciBCbHVldG9vdGgnIH0pXG4gICAgY2hvaWNlcy5wdXNoKHsgaWQ6ICdhdXRvJywgbGFiZWw6ICdVc2UgQXV0bycgfSlcbiAgICByZXR1cm4geyBpZDogbG9zdC5pZCwgbmFtZTogZT8ubmFtZSA/PyAndGhlIHByaW50ZXInLCB0aXRsZTogYCR7bG9zdC5yb3V0ZSA9PT0gJ2xhbicgPyAnTG9jYWwgbmV0d29yaycgOiAnTXVvbjNEJ30gaXNuJ3QgcmVhY2hhYmxlYCwgY2hvaWNlcyB9XG4gIH1cblxuICBhc3luYyBjaG9vc2VBZnRlckxvc3MgKGNob2ljZTogUm91dGUgfCAnYXV0bycpIHtcbiAgICBjb25zdCBzaGVldCA9IHRoaXMubG9zdFNoZWV0XG4gICAgaWYgKCFzaGVldCkgcmV0dXJuXG4gICAgY29uc3QgZSA9IHRoaXMuZW50cnlGb3Ioc2hlZXQuaWQpXG4gICAgaWYgKCFlKSByZXR1cm5cbiAgICB0aGlzLmNsZWFySGVsZCgpXG4gICAgaWYgKGNob2ljZSA9PT0gJ2F1dG8nKSB7XG4gICAgICAvLyBBdXRvIHRha2VzIGl0IGZyb20gaGVyZTogdGhlIGJlc3Qgcm91dGUgdGhlcmUgaXMsIGFmdGVyIGl0cyB1c3VhbCBzZXR0bGUuXG4gICAgICBjaG9vc2VSb3V0ZU1vZGUoc2hlZXQuaWQsICdhdXRvJylcbiAgICAgIHRoaXMuYXV0b1NlZW4gPSBzaGVldC5pZFxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChjaG9pY2UgPT09ICdsYW4nKSByZXR1cm4gdGhpcy5jb25uZWN0TG9jYWwoZSlcbiAgICBpZiAoY2hvaWNlID09PSAnY2xvdWQnKSByZXR1cm4gdGhpcy5jb25uZWN0Q2xvdWQoZSwgJ3JlbGF5JylcbiAgICBjb25zdCBkZXZpY2UgPSBlLm5lYXJieT8uZGV2aWNlXG4gICAgcmV0dXJuIGRldmljZSA/IHRoaXMuY29ubmVjdENsb3VkKGUsIGRldmljZSkgOiB0aGlzLmNvbm5lY3RPdmVyQmx1ZXRvb3RoKGUpXG4gIH1cblxuICAvKiogVGhlIGNob3NlbiByb3V0ZSAobGFuIG9yIGNsb3VkKSB0aGUgb3BlbiBwcmludGVyIHdhcyBsYXN0IHNlZW4gb24sIGFuZCB3aGVuIGl0IHdhcyBmaXJzdCBzZWVuIGdvbmUuICovXG4gIGhlbGRTZWVuOiB7IGlkOiBzdHJpbmcsIHJvdXRlOiAnbGFuJyB8ICdjbG91ZCcgfSB8IG51bGwgPSBudWxsXG4gIGhlbGREb3duU2luY2UgPSAwXG4gIGhlbGRMb3N0OiB7IGlkOiBzdHJpbmcsIHJvdXRlOiAnbGFuJyB8ICdjbG91ZCcgfSB8IG51bGwgPSBudWxsXG5cbiAgY2xlYXJIZWxkICgpIHtcbiAgICB0aGlzLmhlbGRTZWVuID0gbnVsbFxuICAgIHRoaXMuaGVsZERvd25TaW5jZSA9IDBcbiAgICB0aGlzLmhlbGRMb3N0ID0gbnVsbFxuICB9XG5cbiAgLyoqIFdhdGNoZXMgYSBoZWxkIGxvY2FsIG9yIE11b24zRCByb3V0ZTogc2VlbiBjYXJyeWluZywgdGhlbiBnb25lIGZvciBsb25nZXIgdGhhbiBhIGJsaXAsIGlzIGEgZHJvcC4gKi9cbiAgdHJhY2tIZWxkICgpIHtcbiAgICBjb25zdCBvcGVuID0gY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgPz8gdGhpcy5sb2NhbE9wZW5JZFxuICAgIGNvbnN0IHNlZW4gPSB0aGlzLmhlbGRTZWVuXG4gICAgaWYgKG9wZW4gJiYgc2VlbiAmJiBvcGVuLnRvTG93ZXJDYXNlKCkgIT09IHNlZW4uaWQudG9Mb3dlckNhc2UoKSkgdGhpcy5jbGVhckhlbGQoKVxuICAgIGNvbnN0IGlkID0gb3BlbiA/PyB0aGlzLmhlbGRTZWVuPy5pZCA/PyBudWxsXG4gICAgY29uc3QgbW9kZSA9IHJvdXRlTW9kZShpZClcbiAgICBpZiAoIWlkIHx8IChtb2RlICE9PSAnbGFuJyAmJiBtb2RlICE9PSAnY2xvdWQnKSkgcmV0dXJuIHRoaXMuY2xlYXJIZWxkKClcbiAgICBjb25zdCB0YXJnZXQgPSB1c2VyT3BlblRhcmdldCgpXG4gICAgLy8gVGhlIHBlcnNvbiBvcGVuZWQgYW5vdGhlciBwcmludGVyOiB0aGlzIG9uZSBpcyB0aGVpcnMgdG8gbGVhdmUuXG4gICAgaWYgKCFvcGVuICYmIHRhcmdldCAmJiB0YXJnZXQgIT09IGlkLnRvTG93ZXJDYXNlKCkgJiYgIXRhcmdldC5zdGFydHNXaXRoKCdhZGRyZXNzOicpKSByZXR1cm4gdGhpcy5jbGVhckhlbGQoKVxuICAgIGNvbnN0IHJvdXRlID0gb3BlbiA/IHRoaXMuY3VycmVudFJvdXRlKGlkKSA6IG51bGxcbiAgICBpZiAocm91dGUgPT09IG1vZGUpIHtcbiAgICAgIHRoaXMuaGVsZFNlZW4gPSB7IGlkLCByb3V0ZTogbW9kZSB9XG4gICAgICB0aGlzLmhlbGREb3duU2luY2UgPSAwXG4gICAgICB0aGlzLmhlbGRMb3N0ID0gbnVsbFxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghdGhpcy5oZWxkU2VlbiB8fCByb3V0ZSAhPT0gbnVsbCkgcmV0dXJuXG4gICAgaWYgKCF0aGlzLmhlbGREb3duU2luY2UpIHRoaXMuaGVsZERvd25TaW5jZSA9IERhdGUubm93KClcbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMuaGVsZERvd25TaW5jZSA+PSBBVVRPX1NFVFRMRV9NUyAmJiAhdGhpcy5idXN5S2V5ICYmICFhY3RpdmF0aW9uU3RhdGUuc3dpdGNoaW5nICYmICF0aGlzLnJldHJ5aW5nKSB7XG4gICAgICB0aGlzLmhlbGRMb3N0ID0geyAuLi50aGlzLmhlbGRTZWVuIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBjaG9vc2UgKGNob2ljZTogRHJvcENob2ljZVsnaWQnXSkge1xuICAgIGNvbnN0IHNoZWV0ID0gdGhpcy5kcm9wcGVkU2hlZXRcbiAgICBpZiAoIXNoZWV0KSByZXR1cm5cbiAgICBjb25zdCBlID0gdGhpcy5lbnRyeUZvcihzaGVldC5pZClcbiAgICBpZiAoIWUpIHJldHVyblxuICAgIGlmIChjaG9pY2UgPT09ICdsYW4nKSByZXR1cm4gdGhpcy5jb25uZWN0TG9jYWwoZSlcbiAgICBpZiAoY2hvaWNlID09PSAnY2xvdWQnKSByZXR1cm4gdGhpcy5jb25uZWN0Q2xvdWQoZSwgJ3JlbGF5JylcbiAgICByZXR1cm4gdGhpcy50cnlCbHVldG9vdGhBZ2FpbihzaGVldC5pZClcbiAgfVxuXG4gIGFzeW5jIHRyeUJsdWV0b290aEFnYWluIChpZDogc3RyaW5nLCBhdXRvbWF0aWMgPSBmYWxzZSkge1xuICAgIGNvbnN0IGUgPSB0aGlzLmVudHJ5Rm9yKGlkKVxuICAgIGNvbnN0IGRldmljZSA9IGJsdWV0b290aERldmljZUZvcihpZCkgPz8gZT8ubmVhcmJ5Py5kZXZpY2UgPz8gbnVsbFxuICAgIGlmICghZSB8fCB0aGlzLnJldHJ5aW5nKSByZXR1cm5cbiAgICB0aGlzLnJldHJ5aW5nID0gdHJ1ZVxuICAgIHRyeSB7XG4gICAgICBpZiAoZGV2aWNlKSBhd2FpdCB0aGlzLmNvbm5lY3RDbG91ZChlLCBkZXZpY2UpXG4gICAgICBlbHNlIGF3YWl0IHRoaXMuY29ubmVjdE92ZXJCbHVldG9vdGgoZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5yZXRyeWluZyA9IGZhbHNlXG4gICAgICBpZiAoYXV0b21hdGljKSB0aGlzLm5vdGVBdXRvUmV0cnkoaWQsICEhYmx1ZXRvb3RoRHJvcHBlZChpZCkpXG4gICAgfVxuICB9XG5cbiAgLyoqIFBlciBwcmludGVyOiBob3cgbWFueSBhdXRvbWF0aWMgdHJpZXMgZmFpbGVkIGluIGEgcm93LCBhbmQgd2hlbiB0aGUgbmV4dCBtYXkgcnVuLiAqL1xuICByZXRyeUZhaWx1cmVzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge31cbiAgcmV0cnlOb3RCZWZvcmU6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fVxuXG4gIC8qKiBBbiBhdXRvbWF0aWMgdHJ5IGVuZGVkOiBhIGZhaWxlZCBvbmUgd2FpdHMgbG9uZ2VyIGVhY2ggdGltZSAoMzAgcywgNjAgcywgMTIwIHMgLi4uIHVwIHRvIDEwIG1pbikuICovXG4gIG5vdGVBdXRvUmV0cnkgKGlkOiBzdHJpbmcsIGZhaWxlZDogYm9vbGVhbikge1xuICAgIGNvbnN0IGtleSA9IGlkLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoIWZhaWxlZCkge1xuICAgICAgVnVlLmRlbGV0ZSh0aGlzLnJldHJ5RmFpbHVyZXMsIGtleSlcbiAgICAgIFZ1ZS5kZWxldGUodGhpcy5yZXRyeU5vdEJlZm9yZSwga2V5KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGZhaWx1cmVzID0gKHRoaXMucmV0cnlGYWlsdXJlc1trZXldID8/IDApICsgMVxuICAgIFZ1ZS5zZXQodGhpcy5yZXRyeUZhaWx1cmVzLCBrZXksIGZhaWx1cmVzKVxuICAgIFZ1ZS5zZXQodGhpcy5yZXRyeU5vdEJlZm9yZSwga2V5LCBEYXRlLm5vdygpICsgYXV0b1JldHJ5RGVsYXkoZmFpbHVyZXMpKVxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgQmx1ZXRvb3RoIGNvbWluZyBiYWNrIG1heSByZXRyeSBgaWRgIGJ5IGl0c2VsZjogb25seSBmb3IgdGhlIHByaW50ZXJcbiAgICogdGhhdCBpcyBvcGVuIChvciB0aGUgb25lIHRoZSBwZXJzb24gaXMgb3BlbmluZyksIG5ldmVyIGZvciBvbmUgdGhleSBsZWZ0LFxuICAgKiBhbmQgbm90IGJlZm9yZSBpdHMgYmFja29mZiBoYXMgcGFzc2VkLlxuICAgKi9cbiAgbWF5QXV0b1JldHJ5IChpZDogc3RyaW5nLCBub3cgPSBEYXRlLm5vdygpKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbG93ZXIgPSBpZC50b0xvd2VyQ2FzZSgpXG4gICAgY29uc3Qgb3BlbiA9IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkPy50b0xvd2VyQ2FzZSgpID8/IG51bGxcbiAgICBjb25zdCB0YXJnZXQgPSB1c2VyT3BlblRhcmdldCgpXG4gICAgaWYgKGxvd2VyICE9PSBvcGVuICYmIGxvd2VyICE9PSB0YXJnZXQpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiBub3cgPj0gKHRoaXMucmV0cnlOb3RCZWZvcmVbbG93ZXJdID8/IDApXG4gIH1cblxuICAvLyAtLSBCbHVldG9vdGggY29taW5nIGJhY2sgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBUaGUgbmV3ZXN0IHNpZ24gdGhhdCBCbHVldG9vdGggaXMgYmFjayBmb3IgdGhlIGRyb3BwZWQgcHJpbnRlcjogdGhlIHJhZGlvIG9uLCBvciB0aGUgcHJpbnRlciBoZWFyZC4gKi9cbiAgZ2V0IGJsdWV0b290aEJhY2tBdCAoKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZCA9IHRoaXMuZHJvcHBlZElkXG4gICAgaWYgKCFpZCB8fCB0aGlzLnJhZGlvT2ZmKSByZXR1cm4gMFxuICAgIGNvbnN0IGhlYXJkID0gbmVhcmJ5U3RhdGUucHJpbnRlcnNcbiAgICAgIC5maWx0ZXIocCA9PiBwLmVuZHBvaW50SWQ/LnRvTG93ZXJDYXNlKCkgPT09IGlkLnRvTG93ZXJDYXNlKCkpXG4gICAgICAucmVkdWNlKChsYXRlc3QsIHApID0+IE1hdGgubWF4KGxhdGVzdCwgcC5oZWFyZEF0KSwgMClcbiAgICBjb25zdCByYWRpb0JhY2sgPSB0aGlzLnJhZGlvT2ZmID8gMCA6IHRoaXMucmFkaW9PbkF0XG4gICAgY29uc3QgYmFjayA9IE1hdGgubWF4KGhlYXJkLCByYWRpb0JhY2spXG4gICAgcmV0dXJuIGJhY2sgPiBibHVldG9vdGhEcm9wcGVkQXQoaWQpID8gYmFjayA6IDBcbiAgfVxuXG4gIHJhZGlvT25BdCA9IDBcbiAgLyoqIFRoZSByYWRpbyBhcyB0aGlzIHNoZWV0IGxhc3QgaGVhcmQgaXQ6IHRoZSBQcmludGVycyBwYWdlJ3Mgb3duIGxpc3RlbmVyIHN0b3BzIHdoZW4gaXQgY2xvc2VzLiAqL1xuICByYWRpb0hlYXJkOiAnb24nIHwgJ29mZicgfCBudWxsID0gbnVsbFxuXG4gIGdldCByYWRpb09mZiAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0aGlzLnJhZGlvSGVhcmQgPz8gbmVhcmJ5U3RhdGUucmFkaW8pID09PSAnb2ZmJ1xuICB9XG5cbiAgZ2V0IHJhZGlvICgpIHtcbiAgICByZXR1cm4gbmVhcmJ5U3RhdGUucmFkaW9cbiAgfVxuXG4gIEBXYXRjaCgncmFkaW8nKVxuICBvblJhZGlvIChub3c6IHN0cmluZywgYmVmb3JlOiBzdHJpbmcpIHtcbiAgICBpZiAobm93ID09PSAnb24nICYmIGJlZm9yZSA9PT0gJ29mZicpIHRoaXMucmFkaW9PbkF0ID0gRGF0ZS5ub3coKVxuICB9XG5cbiAgb25BdmFpbGFiaWxpdHkgKGV2ZW50OiBFdmVudCkge1xuICAgIGNvbnN0IHZhbHVlID0gKGV2ZW50IGFzIEV2ZW50ICYgeyB2YWx1ZT86IGJvb2xlYW4gfSkudmFsdWVcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnYm9vbGVhbicpIHJldHVyblxuICAgIGNvbnN0IHdhcyA9IHRoaXMucmFkaW9IZWFyZCA/PyBuZWFyYnlTdGF0ZS5yYWRpb1xuICAgIHRoaXMucmFkaW9IZWFyZCA9IHZhbHVlID8gJ29uJyA6ICdvZmYnXG4gICAgaWYgKHZhbHVlICYmIHdhcyAhPT0gJ29uJykgdGhpcy5yYWRpb09uQXQgPSBEYXRlLm5vdygpXG4gIH1cblxuICBAV2F0Y2goJ2JsdWV0b290aEJhY2tBdCcpXG4gIG9uQmx1ZXRvb3RoQmFjayAoYXQ6IG51bWJlcikge1xuICAgIGNvbnN0IHNoZWV0ID0gdGhpcy5kcm9wcGVkU2hlZXRcbiAgICBpZiAoIWF0IHx8IGF0IDw9IHRoaXMubGFzdFJldHVybiB8fCAhc2hlZXQpIHJldHVyblxuICAgIGlmICghc2hlZXQuY2hvaWNlcy5zb21lKGMgPT4gYy5pZCA9PT0gJ2JsZScpKSByZXR1cm5cbiAgICBpZiAoIXRoaXMubWF5QXV0b1JldHJ5KHNoZWV0LmlkKSkgcmV0dXJuXG4gICAgdGhpcy5sYXN0UmV0dXJuID0gYXRcbiAgICB0aGlzLnRyeUJsdWV0b290aEFnYWluKHNoZWV0LmlkLCB0cnVlKVxuICB9XG5cbiAgLyoqIFRoZSBwZXJzb24gb3BlbmVkIGEgcHJpbnRlcjogZXZlcnkgb3RoZXIgcHJpbnRlcidzIGRyb3BwZWQgcm91dGUgaXMgZm9yZ290dGVuLCB3aXRoIGl0cyBhdXRvbWF0aWMgdHJpZXMuICovXG4gIEBXYXRjaCgndXNlclRhcmdldCcpXG4gIG9uVXNlclRhcmdldCAodGFyZ2V0OiBzdHJpbmcgfCBudWxsKSB7XG4gICAgaWYgKCF0YXJnZXQpIHJldHVyblxuICAgIGZvciAoY29uc3QgaWQgb2YgZHJvcHBlZEJsdWV0b290aFByaW50ZXJzKCkpIHtcbiAgICAgIGlmIChpZC50b0xvd2VyQ2FzZSgpICE9PSB0YXJnZXQpIGNsZWFyQmx1ZXRvb3RoRHJvcHBlZChpZClcbiAgICB9XG4gIH1cblxuICBnZXQgdXNlclRhcmdldCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHVzZXJPcGVuVGFyZ2V0KClcbiAgfVxuXG4gIC8vIC0tIGF1dG8gbW9kZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgYXZhaWxhYmlsaXR5IChpZDogc3RyaW5nKTogUm91dGVBdmFpbGFiaWxpdHkge1xuICAgIGNvbnN0IGUgPSB0aGlzLmVudHJ5Rm9yKGlkKVxuICAgIHJldHVybiB7XG4gICAgICBsYW46IHRoaXMubGFuUmVhY2hhYmxlKGUpLFxuICAgICAgLy8gVGhlIGxpc3Qgc2F5cyBvbmxpbmUgZm9yIHVwIHRvIGl0cyBwb2xsIGFmdGVyIHRoZSByZWxheSBpcyBnb25lOiBub3Qgd2hpbGUgdGhlIHJlbGF5IGp1c3QgZmFpbGVkLlxuICAgICAgY2xvdWQ6ICEhZT8uY2xvdWQ/Lm9ubGluZSAmJiByZWxheVRydXN0ZWQocmVsYXlMb3N0QXQoZS5jbG91ZC5pZCksIGNsb3VkU3RhdGUucHJpbnRlcnNBc09mLCBEYXRlLm5vdygpKSxcbiAgICAgIGJsZTogKCEhZT8ubmVhcmJ5IHx8ICEhYmx1ZXRvb3RoRGV2aWNlRm9yKGlkKSkgJiYgIXRoaXMucmFkaW9PZmZcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHByaW50ZXIgYXV0byBtb2RlIGxvb2tzIGFmdGVyOiB0aGUgb3BlbiBvbmUsIHdoZW4gaXQgd2FzIG9wZW5lZCB3aXRoIHBsYWluIENvbm5lY3QuICovXG4gIGdldCBhdXRvSWQgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGFjdGl2ZSA9IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkXG4gICAgaWYgKGFjdGl2ZSkgcmV0dXJuIHJvdXRlTW9kZShhY3RpdmUpID09PSAnYXV0bycgPyBhY3RpdmUgOiBudWxsXG4gICAgY29uc3QgaWQgPSB0aGlzLmxvY2FsT3BlbklkXG4gICAgaWYgKGlkKSByZXR1cm4gcm91dGVNb2RlKGlkKSA9PT0gJ2F1dG8nID8gaWQgOiBudWxsXG4gICAgLy8gQSByb3V0ZSB0aGF0IGRpZWQgdGFrZXMgdGhlIG9wZW4gcHJpbnRlciB3aXRoIGl0IChhIGZhaWxlZCByZW9wZW4gY2xlYXJzXG4gICAgLy8gaXQpOiB0aGUgcHJpbnRlciBhdXRvIG1vZGUgd2FzIGxvb2tpbmcgYWZ0ZXIgc3RpbGwgbmVlZHMgYSByb3V0ZS5cbiAgICBjb25zdCBzZWVuID0gdGhpcy5hdXRvU2VlblxuICAgIHJldHVybiBzZWVuICYmIHJvdXRlTW9kZShzZWVuKSA9PT0gJ2F1dG8nICYmIHRoaXMuZW50cnlGb3Ioc2VlbikgPyBzZWVuIDogbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIG9wZW4gb24gdGhlIGxvY2FsIG5ldHdvcmssIGlmIGFueS4gKi9cbiAgZ2V0IGxvY2FsT3BlbklkICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBsb2NhbCA9IHRoaXMuYWxsRW50cmllcy5maW5kKGUgPT4gZS5hY3RpdmUgPT09ICdsb2NhbCcpXG4gICAgcmV0dXJuIGxvY2FsPy5jbG91ZD8uaWQgPz8gbG9jYWw/LmVuZHBvaW50SWQgPz8gbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIGF1dG8gbW9kZSBsYXN0IGxvb2tlZCBhZnRlciwgc28gaXQgaXMgc3RpbGwgbG9va2VkIGFmdGVyIHdoZW4gaXRzIHNlc3Npb24gaXMgZ29uZS4gKi9cbiAgYXV0b1NlZW46IHN0cmluZyB8IG51bGwgPSBudWxsXG5cbiAgLyoqIFRoZSByb3V0ZSB0aGUgbG9va2VkLWFmdGVyIHByaW50ZXIncyBzZXNzaW9uIHdhcyBvbiBhdCB0aGUgbGFzdCBsb29rLCB0byBzZWUgdGhlIHJlbGF5IGdvLiAqL1xuICBsYXN0TG9vazogeyBpZDogc3RyaW5nLCByb3V0ZTogUm91dGUgfCBudWxsIH0gfCBudWxsID0gbnVsbFxuXG4gIC8qKiBBbm90aGVyIGFjY291bnQsIG9yIG5vbmU6IHRoZSBwcmludGVyIGF1dG8gbW9kZSBsb29rZWQgYWZ0ZXIgaXMgbm90IHRoZWlycyB0byBiZSBkaWFsbGVkLiAqL1xuICBnZXQgYWNjb3VudElkICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyBudWxsXG4gIH1cblxuICBAV2F0Y2goJ2FjY291bnRJZCcpXG4gIG9uQWNjb3VudENoYW5nZWQgKCkge1xuICAgIHRoaXMuYXV0b1NlZW4gPSBudWxsXG4gICAgdGhpcy5sYXN0TG9vayA9IG51bGxcbiAgfVxuXG4gIC8qKiBUaGUgcm91dGUgdGhlIG9wZW4gcHJpbnRlcidzIHNlc3Npb24gaXMgb24sIG9yIG51bGwgd2hlbiBpdCBpcyBkb3duLiAqL1xuICBjdXJyZW50Um91dGUgKGlkOiBzdHJpbmcpOiBSb3V0ZSB8IG51bGwge1xuICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuJHN0b3JlLnN0YXRlLnNvY2tldFxuICAgIGNvbnN0IGxpdmUgPSAhIXNvY2tldD8ub3BlblxuICAgIGlmIChjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZD8udG9Mb3dlckNhc2UoKSA9PT0gaWQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgaWYgKGJsdWV0b290aERyb3BwZWQoaWQpKSByZXR1cm4gbnVsbFxuICAgICAgaWYgKCFsaXZlKSByZXR1cm4gbnVsbFxuICAgICAgcmV0dXJuIGJsdWV0b290aENhcnJ5aW5nKGlkKSA/ICdibGUnIDogJ2Nsb3VkJ1xuICAgIH1cbiAgICByZXR1cm4gbGl2ZSA/ICdsYW4nIDogbnVsbFxuICB9XG5cbiAgYXV0b1RpY2sgKCkge1xuICAgIHRoaXMudHJhY2tIZWxkKClcbiAgICBjb25zdCBpZCA9IHRoaXMuYXV0b0lkXG4gICAgdGhpcy5hdXRvU2VlbiA9IG5leHRBdXRvU2Vlbih0aGlzLmF1dG9TZWVuLCB7XG4gICAgICBhdXRvSWQ6IGlkLFxuICAgICAgb3RoZXJPcGVuOiAhIShjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCB8fCB0aGlzLmxvY2FsT3BlbklkKSxcbiAgICAgIHVzZXJUYXJnZXQ6IHVzZXJPcGVuVGFyZ2V0KClcbiAgICB9KVxuICAgIC8vIFRoZSByZWxheSB3ZW50IGF3YXkgdW5kZXIgdGhlIHNlc3Npb246IHRoZSBhY2NvdW50J3MgbGlzdCBkb2VzIG5vdCBrbm93IHlldCwgc28ga2VlcCBvZmYgaXQgZm9yIGEgd2hpbGUuXG4gICAgY29uc3Qgcm91dGUgPSBpZCA/IHRoaXMuY3VycmVudFJvdXRlKGlkKSA6IG51bGxcbiAgICBpZiAoaWQgJiYgdGhpcy5sYXN0TG9vaz8uaWQgPT09IGlkICYmIHRoaXMubGFzdExvb2sucm91dGUgPT09ICdjbG91ZCcgJiYgcm91dGUgPT09IG51bGwpIG5vdGVSZWxheUxvc3QoaWQpXG4gICAgdGhpcy5sYXN0TG9vayA9IGlkID8geyBpZCwgcm91dGUgfSA6IG51bGxcbiAgICBpZiAoIWlkIHx8IHRoaXMuYnVzeUtleSB8fCBhY3RpdmF0aW9uU3RhdGUuc3dpdGNoaW5nIHx8IHRoaXMucmV0cnlpbmcpIHtcbiAgICAgIHRoaXMucGVuZGluZ01vdmUgPSBudWxsXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKVxuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmN1cnJlbnRSb3V0ZShpZClcbiAgICBpZiAoY3VycmVudCAhPT0gJ2xhbicgJiYgbm93IC0gdGhpcy5sYXN0RGlzY292ZXIgPiBBVVRPX0RJU0NPVkVSX01TKSB7XG4gICAgICB0aGlzLmxhc3REaXNjb3ZlciA9IG5vd1xuICAgICAgZGlzY292ZXJQcmludGVycyhmYWxzZSwgeyBuZWFyYnk6IGZhbHNlIH0pLmNhdGNoKCgpID0+IHt9KVxuICAgIH1cbiAgICBjb25zdCB0byA9IGF1dG9Nb3ZlKGN1cnJlbnQsIHRoaXMuYXZhaWxhYmlsaXR5KGlkKSlcbiAgICBpZiAoIXRvKSB7XG4gICAgICB0aGlzLnBlbmRpbmdNb3ZlID0gbnVsbFxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICh0aGlzLnBlbmRpbmdNb3ZlPy50byAhPT0gdG8pIHtcbiAgICAgIHRoaXMucGVuZGluZ01vdmUgPSB7IHRvLCBzaW5jZTogbm93IH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAobm93IC0gdGhpcy5wZW5kaW5nTW92ZS5zaW5jZSA8IEFVVE9fU0VUVExFX01TKSByZXR1cm5cbiAgICB0aGlzLnBlbmRpbmdNb3ZlID0gbnVsbFxuICAgIGNvbnN0IGUgPSB0aGlzLmVudHJ5Rm9yKGlkKVxuICAgIGlmICghZSkgcmV0dXJuXG4gICAgaWYgKHRvID09PSAnbGFuJykgdGhpcy5jb25uZWN0TG9jYWwoZSwgdHJ1ZSlcbiAgICBlbHNlIGlmICh0byA9PT0gJ2Nsb3VkJykgdGhpcy5vcGVuQXV0byhlLCAncmVsYXknKVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgZGV2aWNlID0gYmx1ZXRvb3RoRGV2aWNlRm9yKGlkKSA/PyBlLm5lYXJieT8uZGV2aWNlXG4gICAgICBpZiAoZGV2aWNlKSB0aGlzLm9wZW5BdXRvKGUsIGRldmljZSlcbiAgICB9XG4gIH1cblxuICAvKiogQW4gYXV0by1tb2RlIG1vdmU6IHRoZSBzYW1lIG9wZW4gYXMgYSBjaG9zZW4gcm91dGUsIGJ1dCB0aGUgY2hvaWNlIHN0YXlzIGF1dG8uICovXG4gIG9wZW5BdXRvIChlOiBEaXJlY3RvcnlFbnRyeSwgcm91dGU6IFBhcmFtZXRlcnM8UHJpbnRlckVudHJpZXNNaXhpblsnY29ubmVjdENsb3VkJ10+WzFdKSB7XG4gICAgLy8gYGF1dG9gOiB0aGUgb3BlbiBtb3ZlcyB0aGUgc2Vzc2lvbiBidXQgcmVjb3JkcyBubyBjaG9pY2UgKG5vIGhlbGQgbW9kZSwgbm8ga2VwdCByZWxheSBjaG9pY2UpLlxuICAgIHJldHVybiB0aGlzLmNvbm5lY3RDbG91ZChlLCByb3V0ZSwgdHJ1ZSlcbiAgfVxuXG4gIC8qKiBUaGUgc3dpdGNoZXIgY2xvc2VzIGFmdGVyIGFuIG9wZW47IGhlcmUgdGhlcmUgaXMgbm90aGluZyB0byBjbG9zZS4gKi9cbiAgYWZ0ZXJPcGVuICgpIHt9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5hdXRvVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmF1dG9UaWNrKCksIEFVVE9fTE9PS19NUylcbiAgICB3ZWJCbHVldG9vdGgoKT8uYWRkRXZlbnRMaXN0ZW5lcignYXZhaWxhYmlsaXR5Y2hhbmdlZCcsIHRoaXMub25BdmFpbGFiaWxpdHkpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICBpZiAodGhpcy5hdXRvVGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy5hdXRvVGltZXIpXG4gICAgd2ViQmx1ZXRvb3RoKCk/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2F2YWlsYWJpbGl0eWNoYW5nZWQnLCB0aGlzLm9uQXZhaWxhYmlsaXR5KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuYmxlLWZhbGxiYWNrIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtYXJnaW46IDAgMCAxNnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC13YXJuaW5nKSAxNiUsIHZhcigtLW0zZC1zdXJmYWNlKSk7XG4gIH1cblxuICAuYmxlLWZhbGxiYWNrX19pY29uIHtcbiAgICBmbGV4OiBub25lO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7XG4gIH1cblxuICAuYmxlLWZhbGxiYWNrX190ZXh0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDEgMSAyNDBweDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiAycHggMTBweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIC5ibGUtZmFsbGJhY2tfX2FjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogOHB4O1xuXG4gICAgYnV0dG9uIHtcbiAgICAgIHBhZGRpbmc6IDZweCAxNHB4O1xuICAgICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtdGV4dCkgMjAlLCB0cmFuc3BhcmVudCk7XG5cbiAgICAgICY6ZGlzYWJsZWQge1xuICAgICAgICBvcGFjaXR5OiAwLjU7XG4gICAgICB9XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbGF5b3V0L0JsdWV0b290aEZhbGxiYWNrQmFubmVyLnZ1ZSJ9