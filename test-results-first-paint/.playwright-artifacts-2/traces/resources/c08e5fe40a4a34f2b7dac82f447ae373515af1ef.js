/* unplugin-vue-components disabled */import { VTextField as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/common/ProtectedNotice.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { useAuxApi } from "/src/aux_api/useAuxApi.ts";
import { PANEL_ONLY_NOTE, classifyRefusal, isPanelOnlyRefusal, panelOnlyMessage, refusedHere, routeFor } from "/src/services/wifi/panel-only.ts";
import PermissionRefusalNotice from "/src/components/widgets/wifi/PermissionRefusalNotice.vue";
import { useHotspotCheck } from "/src/aux_api/useHotspotCheck.ts";
import { wifiProbe } from "/src/services/wifi/saved-probe.ts";
import { managedNetworkProblem } from "/src/services/wifi/network-route.ts";
import { EventBus } from "/src/eventBus.ts";
import { moonrakerErrorMessage } from "/src/store/protection/helpers.ts";
import { printerTransportBinding } from "/src/services/managed-session/httpTransportBinding.ts";
import TonePill from "/src/components/printers/TonePill.vue";
import { interfaceIp, signalWord } from "/src/services/system/model.ts";
const { onHotspot } = useHotspotCheck();
const HIDDEN_NAME = "Hidden network";
let WifiManagerCard = class extends Vue {
  menuCollapsed;
  compact;
  /** The printer's permission store refused the last action (KAN-2457): who may do it, not a panel-only printer. */
  refusal = null;
  /** Keeps a permission refusal for the notice; false for any other error. */
  takePermissionRefusal(err) {
    const r = classifyRefusal(err);
    if (r.kind !== "permission") return false;
    this.refusal = r;
    return true;
  }
  // Dialog & connection state
  disconnectConfirmDialog = false;
  showWarningDialog = false;
  showPasswordDialog = false;
  selectedNetwork = null;
  password = "";
  // Menu state
  menuOpen = {};
  // Wi-Fi scan data
  wifi_available_networks = [];
  knownSsids = /* @__PURE__ */ new Set();
  /** SSIDs the per-SSID fallback has asked about: the page session's, see saved-probe.ts. */
  get testedSsids() {
    return wifiProbe.asked;
  }
  wifiOrder = [];
  intervalId = null;
  refresh() {
    this.wifi_available_networks = [];
    this.wifiOrder = [];
  }
  get onHotspot() {
    return onHotspot.value;
  }
  // MuonOS network protection is on and this browser has no identity, so
  // every Wi-Fi request would be refused. The notice says so instead, and
  // polling waits until that changes.
  get locked() {
    return this.$store.getters["protection/isLocked"];
  }
  // Reached over Bluetooth or Muon3D (Iroh): the Aux client sends each Wi-Fi
  // call to muon-link's own route instead (KAN-3601), so nothing here changes
  // by route. What can differ is the answer: an older muon-link has no such
  // route, or the owner turned the route off, and the note says which.
  get remote() {
    return printerTransportBinding.remote;
  }
  /** Why this connection can't change Wi-Fi, from the last answer; null when it can (or has not been asked). */
  routeProblem = null;
  onRemoteChanged() {
    this.routeProblem = null;
    wifiProbe.savedUnsupported = false;
    this.stopPolling();
    this.fetchDevices();
    this.startPolling();
  }
  auxApi = useAuxApi();
  // Lifecycle
  mounted() {
    this.visibilityHandler = () => this.onVisibilityChange();
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.fetchDevices();
    this.startPolling();
  }
  beforeDestroy() {
    if (this.visibilityHandler) document.removeEventListener("visibilitychange", this.visibilityHandler);
    this.stopPolling();
  }
  // The 5 s poll runs only while the tab is visible and on the printer's own
  // network: every tick costs the printer an nmcli scan, and the panel never
  // takes printer compute. Over Bluetooth or Muon3D it scans on open and on the
  // Scan button only, and it stops once the route has said it can't help.
  startPolling() {
    if (this.intervalId || document.visibilityState === "hidden" || this.remote || this.routeProblem) return;
    this.intervalId = setInterval(() => this.fetchDevices(), 5e3);
  }
  stopPolling() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }
  visibilityHandler = null;
  onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      this.stopPolling();
    } else if (!this.intervalId) {
      this.fetchDevices();
      this.startPolling();
    }
  }
  fetching = false;
  // Fetch and mark known SSIDs
  async fetchDevices() {
    if (this.fetching || this.locked) return;
    this.fetching = true;
    try {
      const res = await this.auxApi.wifi.wifiScanWifiScanGet(true);
      this.wifi_available_networks = res.data;
      this.routeProblem = null;
      await this.updateKnownSsids();
      const groups = this.groupedNetworks;
      const current = new Set(groups.map((g) => g.ssid));
      const bySignal = [...groups].sort((a, b) => b.signal - a.signal);
      for (const net of bySignal) {
        if (!this.wifiOrder.includes(net.ssid)) {
          this.wifiOrder.push(net.ssid);
        }
      }
      this.wifiOrder = this.wifiOrder.filter((ssid) => current.has(ssid));
    } catch (e) {
      console.error("Wi-Fi scan failed", e);
      if (this.remote) this.routeProblem = managedNetworkProblem(e);
      if (this.routeProblem) this.stopPolling();
      if (e?.response?.status === 403 && !this.routeProblem) this.$store.dispatch("protection/onRefused");
    }
    this.fetching = false;
  }
  /**
   * Which scanned networks the printer has saved. One `GET /wifi/saved` per
   * poll answers it for all of them. A printer without that route (404, once)
   * is asked per SSID instead, at most once each for the page session.
   */
  async updateKnownSsids() {
    if (!wifiProbe.savedUnsupported) {
      try {
        const res = await this.auxApi.wifi.wifiSavedWifiSavedGet();
        this.knownSsids = new Set((res.data || []).map((p) => (p.name || "").trim()));
        return;
      } catch (e) {
        if (e?.response?.status !== 404 || this.remote) return;
        wifiProbe.savedUnsupported = true;
      }
    }
    for (const net of this.wifi_available_networks) {
      const ssid = (net.ssid || "").trim();
      if (!ssid || this.knownSsids.has(ssid) || wifiProbe.asked.has(ssid)) continue;
      wifiProbe.asked.add(ssid);
      try {
        await this.auxApi.wifi.getDetailsWifiShowGet(ssid);
        this.knownSsids = new Set(this.knownSsids).add(ssid);
      } catch {
      }
    }
  }
  // NEW: one row per SSID with merged details
  get groupedNetworks() {
    const bySsid = /* @__PURE__ */ new Map();
    for (const n of this.wifi_available_networks) {
      const ssid = (n.ssid || "").trim() || (n.in_use ? HIDDEN_NAME : "");
      if (!ssid) continue;
      const isSecured = !!(n.security && !/^\s*open\s*$/i.test(n.security));
      if (!bySsid.has(ssid)) {
        bySsid.set(ssid, {
          ...n,
          ssid,
          // normalized
          in_use: !!n.in_use,
          signal: n.signal,
          rate: n.rate,
          security: isSecured ? n.security : "",
          // empty => “unsecured” label
          chanList: String(n.chan),
          freqList: String(n.freq),
          _chans: /* @__PURE__ */ new Set([String(n.chan)]),
          _freqs: /* @__PURE__ */ new Set([String(n.freq)])
        });
      } else {
        const g = bySsid.get(ssid);
        g.in_use = g.in_use || !!n.in_use;
        if (isSecured && (!g.security || /^\s*open\s*$/i.test(g.security))) {
          g.security = n.security;
        }
        if (n.signal > g.signal) g.signal = n.signal;
        if (n.rate > g.rate) g.rate = n.rate;
        g._chans.add(String(n.chan));
        g._freqs.add(String(n.freq));
      }
    }
    for (const g of bySsid.values()) {
      g.chanList = Array.from(g._chans).join(", ");
      g.freqList = Array.from(g._freqs).join(", ");
      delete g._chans;
      delete g._freqs;
    }
    return Array.from(bySsid.values());
  }
  // Sorting
  get sortedNetworks() {
    const groups = this.groupedNetworks;
    const connectedSsid = groups.find((n) => n.in_use)?.ssid ?? null;
    const map = new Map(groups.map((n) => [n.ssid, n]));
    const others = this.wifiOrder.filter((ssid) => map.has(ssid) && ssid !== connectedSsid).map((ssid) => map.get(ssid));
    return connectedSsid && map.has(connectedSsid) ? [map.get(connectedSsid), ...others] : others;
  }
  // Signal icon logic
  getSignalLevel(signal) {
    if (signal >= 75) return 4;
    if (signal >= 50) return 3;
    if (signal >= 25) return 2;
    return 1;
  }
  getWifiIconName(net) {
    const lvl = this.getSignalLevel(net.signal);
    if (net.in_use) return `$wifi-strength-${lvl}`;
    const sec = net.security?.toLowerCase() || "";
    const lockSuffix = !sec || sec.includes("open") ? "" : "-lock";
    return `$wifi-strength-${lvl}${lockSuffix}`;
  }
  getSignalColor(signal) {
    const lvl = this.getSignalLevel(signal);
    return lvl === 4 ? "green" : lvl === 3 ? "lime" : lvl === 2 ? "orange" : "red";
  }
  // Existing menu toggle
  openMenu(ssid) {
    Object.keys(this.menuOpen).forEach((k) => {
      if (k !== ssid) this.menuOpen[k] = false;
    });
    this.$set(this.menuOpen, ssid, true);
  }
  // Unchanged signature *usage*, but pass SSID now
  onNetworkClick(network) {
    if (network.in_use) {
      this.openMenu(network.ssid);
    } else {
      this.selectedNetwork = network;
      this.showWarningDialog = true;
    }
  }
  acceptWarning_loading = false;
  async acceptWarning() {
    this.acceptWarning_loading = true;
    this.showWarningDialog = false;
    try {
      await this.promptOrConnect();
    } catch {
    }
    this.acceptWarning_loading = false;
  }
  async promptOrConnect() {
    if (!this.selectedNetwork) return;
    const sec = this.selectedNetwork.security?.toLowerCase() || "";
    if (this.knownSsids.has(this.selectedNetwork.ssid)) {
      this.password = "";
      await this.connectToSelected();
      this.refresh();
      await this.fetchDevices();
    } else if (!sec || sec.includes("open")) {
      this.connectToSelected();
    } else {
      this.password = "";
      this.showPasswordDialog = true;
    }
  }
  async connectToSelected() {
    if (!this.selectedNetwork) return;
    this.showPasswordDialog = false;
    try {
      await this.auxApi.wifi.wifiConnectWifiConnectPost({
        ssid: this.selectedNetwork.ssid,
        password: this.password || void 0
      });
      this.testedSsids.delete(this.selectedNetwork.ssid);
      EventBus.$emit(this.$t("app.wifi.msg.connect.success") + " " + this.selectedNetwork.ssid, { type: "success", timeout: 2e3 });
      await this.fetchDevices();
    } catch (err) {
      const problem = this.remote ? managedNetworkProblem(err) : null;
      if (problem) {
        this.routeProblem = problem;
      } else if (this.takePermissionRefusal(err)) {
      } else if (isPanelOnlyRefusal(err)) {
        EventBus.$emit(panelOnlyMessage("join a network"), { type: "error", timeout: 8e3 });
      } else {
        EventBus.$emit(`${this.$t("app.wifi.msg.connect.error")} ${moonrakerErrorMessage(err)}`, { type: "error", timeout: 5e3 });
      }
    }
  }
  // Existing disconnect & forget
  get disconnectIsPanelOnly() {
    return routeFor("disconnect", refusedHere).kind === "panel";
  }
  panelOnlyNote = PANEL_ONLY_NOTE;
  async disconnect() {
    try {
      const resp = await this.auxApi.wifi.wifiDisconnectWifiDisconnectPost();
      if (resp.status === 200) {
        await this.fetchDevices();
      }
    } catch (err) {
      const problem = this.remote ? managedNetworkProblem(err) : null;
      if (problem) {
        this.routeProblem = problem;
      } else if (this.takePermissionRefusal(err)) {
      } else if (isPanelOnlyRefusal(err)) {
        refusedHere.disconnect = true;
        EventBus.$emit(panelOnlyMessage("disconnect from a network"), { type: "error", timeout: 8e3 });
      } else {
        EventBus.$emit(`${this.$t("app.wifi.msg.disconnect.error")} ${moonrakerErrorMessage(err)}`, { type: "error", timeout: 5e3 });
      }
    }
    this.disconnectConfirmDialog = false;
  }
  // -- for the page: what each row says -------------------------------------
  /** In the quick menu, the network it's on and the three strongest others. */
  get shownNetworks() {
    return this.compact ? this.sortedNetworks.slice(0, 4) : this.sortedNetworks;
  }
  /** The page lists the networks it is not on: the one it is on has its own place above the list. */
  get otherNetworks() {
    return this.sortedNetworks.filter((n) => !n.in_use);
  }
  get connectedNetwork() {
    return this.sortedNetworks.find((n) => n.in_use) ?? null;
  }
  /** A hidden network has no name to forget or to join by, only to leave. */
  isHidden(network) {
    return network.ssid === HIDDEN_NAME && !this.knownSsids.has(HIDDEN_NAME);
  }
  /** What the row says under its name, in sight: the channel, the speed and the frequency. */
  detail(network) {
    const chan = network.chanList || network.chan;
    const freq = network.freqList || network.freq;
    return [chan ? `channel ${chan}` : "", network.rate ? `${network.rate} Mbps` : "", freq ? `${freq} MHz` : ""].filter(Boolean).join(" \xB7 ");
  }
  /** The IPv4 address of the Wi-Fi interface, from the computer's own report. */
  get wifiIp() {
    const network = this.$store.getters["server/getSystemInfo"]?.network;
    return interfaceIp(network, ["wlan", "wl"])?.ip ?? "";
  }
  get hostname() {
    return this.$store.state.printer.printer.info?.hostname ?? "";
  }
  signalText(signal) {
    return signalWord(signal);
  }
  signalLevel(signal) {
    return this.getSignalLevel(signal);
  }
  rowState(network) {
    if (network.in_use) return "Connected";
    if (this.knownSsids.has(network.ssid)) return "Saved \xB7 joins without a password";
    return network.security ? network.security : "Open";
  }
  /** 2.4 GHz, 5 GHz, or both, from the access points heard under this name. */
  band(network) {
    const freqs = String(network.freqList || network.freq).split(",").map((f) => Number(f.trim())).filter((f) => f > 0);
    const bands = new Set(freqs.map((f) => f < 3e3 ? "2.4" : f < 5925 ? "5" : "6"));
    return bands.size ? `${[...bands].sort().join(" & ")} GHz` : "";
  }
  networkFacts(network) {
    return [
      `Security: ${network.security || "open"}`,
      `signal ${network.signal}%`,
      `${network.rate} Mbps`,
      `channel ${network.chanList || network.chan}`,
      `${network.freqList || network.freq} MHz`
    ].join(" \xB7 ");
  }
  /**
   * Forgetting asks first. For the network this page is reached over, it
   * says what that costs: the page may be lost, and the printer leaves the network.
   */
  async forgetConfirm(network) {
    const text = network.in_use ? "You may lose this page, and the printer will drop off this network. It will not rejoin it by itself until you join it again." : "The printer will not join it by itself any more. You can join it again with its password.";
    const yes = await this.$confirm(text, { title: `Forget ${network.ssid}?`, buttonTrueText: "Forget", danger: true });
    if (yes) await this.forget(network);
  }
  async forget(network) {
    try {
      await this.auxApi.wifi.wifiForgetWifiForgetDelete(network.ssid);
      this.knownSsids.delete(network.ssid);
      this.testedSsids.delete(network.ssid);
      await this.fetchDevices();
    } catch (e) {
      console.error("Forget failed", e);
      const problem = this.remote ? managedNetworkProblem(e) : null;
      if (problem) this.routeProblem = problem;
      else if (!this.takePermissionRefusal(e)) EventBus.$emit(`Could not forget ${network.ssid}. ${moonrakerErrorMessage(e)}`, { type: "error", timeout: 5e3 });
    }
  }
};
__decorateClass([
  Prop({ type: Boolean })
], WifiManagerCard.prototype, "menuCollapsed", 2);
__decorateClass([
  Prop({ type: Boolean })
], WifiManagerCard.prototype, "compact", 2);
__decorateClass([
  Watch("remote")
], WifiManagerCard.prototype, "onRemoteChanged", 1);
WifiManagerCard = __decorateClass([
  Component({ components: { TonePill, PermissionRefusalNotice } })
], WifiManagerCard);
const _sfc_main = WifiManagerCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "wf", class: { "wf--compact": _vm.compact, "wf--page": !_vm.compact }, attrs: { "data-tid": "wifi-card" } }, [_vm.compact ? _c("header", { staticClass: "wf__head" }, [_c("div", { staticClass: "wf__titles" }, [_c("h2", [_vm._v("Wi-Fi")]), !_vm.locked ? _c("p", [_vm._v(" " + _vm._s(_vm.connectedNetwork ? `On ${_vm.connectedNetwork.ssid} \xB7 signal ${_vm.connectedNetwork.signal}%` : "Not on a Wi-Fi network") + " ")]) : _vm._e()]), !_vm.locked ? _c("button", { staticClass: "wf__refresh", attrs: { "type": "button", "disabled": _vm.fetching, "aria-label": "Look for networks again", "data-tid": "wifi-refresh" }, on: { "click": _vm.fetchDevices } }, [_c(__unplugin_components_0, { attrs: { "name": "refresh", "small": "" } })], 1) : _vm._e()]) : _vm._e(), _c(__unplugin_components_1, { staticClass: "wf__span" }), _c("permission-refusal-notice", { staticClass: "wf__span", attrs: { "refusal": _vm.refusal }, on: { "dismiss": function($event) {
    _vm.refusal = null;
  } } }), _vm.routeProblem ? _c("p", { staticClass: "wf__note wf__span", attrs: { "role": "status", "data-problem": _vm.routeProblem.kind, "data-tid": "wifi-route-problem" } }, [_vm._v(" " + _vm._s(_vm.routeProblem.message) + " ")]) : _vm._e(), !_vm.compact && !_vm.locked ? _c("section", { staticClass: "stile wf__box", attrs: { "data-tid": "wifi-box" } }, [_c("header", { staticClass: "stile__head" }, [_c(__unplugin_components_2, { attrs: { "name": "wifi" } }), _c("h2", [_vm._v("Wi-Fi")]), _c("span", { staticClass: "stile__aside" }, [_c("tone-pill", { attrs: { "tone": _vm.connectedNetwork ? "ok" : "off" } }, [_vm._v(_vm._s(_vm.connectedNetwork ? "Online" : "Not connected"))]), _c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "disabled": _vm.fetching, "data-tid": "wifi-refresh" }, on: { "click": _vm.fetchDevices } }, [_c(__unplugin_components_3, { attrs: { "name": "refresh", "small": "" } }), _vm._v(" Scan ")], 1)], 1)], 1), _c("div", { staticClass: "wf__connected", class: { "wf__connected--on": !!_vm.connectedNetwork }, attrs: { "data-tid": "wifi-connected" } }, [_vm.connectedNetwork ? [_c("div", { staticClass: "wf__now" }, [_c("span", { staticClass: "srow__ico wf__now-ico" }, [_c(__unplugin_components_4, { attrs: { "name": "wifi" } })], 1), _c("div", { staticClass: "wf__now-text" }, [_c("div", { staticClass: "wf__now-name", attrs: { "data-tid": "wifi-connected-name" } }, [_vm._v(" " + _vm._s(_vm.connectedNetwork.ssid) + " ")]), _c("div", { staticClass: "stile__note" }, [_vm._v(" " + _vm._s([_vm.band(_vm.connectedNetwork), _vm.connectedNetwork.security || "Open", `${_vm.signalText(_vm.connectedNetwork.signal)} signal`].filter(Boolean).join(" \xB7 ")) + " ")])])]), _c("dl", { staticClass: "wf__kv" }, [_vm.wifiIp ? _c("div", [_c("dt", [_vm._v("IP address")]), _c("dd", { staticClass: "wf__mono" }, [_vm._v(" " + _vm._s(_vm.wifiIp) + " ")])]) : _vm._e(), _c("div", [_c("dt", [_vm._v("Signal")]), _c("dd", [_vm._v(_vm._s(_vm.connectedNetwork.signal) + "%")])]), _vm.hostname ? _c("div", [_c("dt", [_vm._v("Address")]), _c("dd", [_vm._v(_vm._s(_vm.hostname) + ".local")])]) : _vm._e()]), _c("div", { staticClass: "wf__now-acts" }, [_vm.disconnectIsPanelOnly ? _c("span", { staticClass: "wf__note", attrs: { "data-tid": "wifi-disconnect-panel" } }, [_vm._v(_vm._s(_vm.panelOnlyNote))]) : _c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "data-tid": "wifi-disconnect" }, on: { "click": function($event) {
    _vm.disconnectConfirmDialog = true;
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.disconnect")) + " ")]), !_vm.isHidden(_vm.connectedNetwork) ? _c("button", { staticClass: "cbtn cbtn--sm cbtn--danger", attrs: { "type": "button", "data-tid": "wifi-forget" }, on: { "click": function($event) {
    return _vm.forgetConfirm(_vm.connectedNetwork);
  } } }, [_vm._v(" Forget this network ")]) : _vm._e()])] : _c("p", { staticClass: "stile__note" }, [_vm._v(" Not on a Wi-Fi network. Pick one from the list to join it. ")])], 2), _c("div", { staticClass: "wf__available", attrs: { "data-tid": "wifi-available" } }, [_c("h3", { staticClass: "stile__group-title wf__group-title" }, [_c("span", [_vm._v("Other networks")]), _vm.otherNetworks.length ? _c("span", { staticClass: "wf__found", attrs: { "data-tid": "wifi-found" } }, [_vm._v(_vm._s(_vm.otherNetworks.length) + " found")]) : _vm._e()]), _c("div", { staticClass: "slist", attrs: { "data-tid": "wifi-networks" } }, [!_vm.wifi_available_networks.length ? _c("p", { staticClass: "stile__note wf__empty" }, [_vm._v(" Looking for networks\u2026 ")]) : _vm._e(), _vm._l(_vm.otherNetworks, function(network) {
    return _c("div", { key: network.ssid, staticClass: "srow wf__net", attrs: { "data-ssid": network.ssid } }, [_c("span", { staticClass: "srow__ico" }, [_c(__unplugin_components_5, { attrs: { "name": network.security ? "lock" : "wifi" } })], 1), _c("div", { staticClass: "srow__text", attrs: { "title": _vm.networkFacts(network) } }, [_c("span", { staticClass: "srow__t" }, [_vm._v(_vm._s(network.ssid))]), _c("span", { staticClass: "srow__s" }, [_vm._v(_vm._s(_vm.rowState(network)) + _vm._s(_vm.band(network) ? ` \xB7 ${_vm.band(network)}` : ""))]), _c("span", { staticClass: "srow__s wf__detail", attrs: { "data-tid": "wifi-detail" } }, [_vm._v(_vm._s(_vm.detail(network)))])]), _c("svg", { staticClass: "wf__bars", attrs: { "viewBox": "0 0 20 16", "role": "img", "aria-label": `${_vm.signalText(network.signal)} signal` } }, _vm._l(4, function(bar) {
      return _c("rect", { key: bar, class: { "wf__bar--on": bar <= _vm.signalLevel(network.signal) }, attrs: { "x": (bar - 1) * 5, "y": 16 - bar * 4, "width": "3.5", "height": bar * 4, "rx": "1" } });
    }), 0), _c("span", { staticClass: "srow__act" }, [_vm.knownSsids.has(network.ssid) ? _c("button", { staticClass: "cbtn cbtn--sm cbtn--ghost", attrs: { "type": "button", "data-tid": "wifi-forget" }, on: { "click": function($event) {
      return _vm.forgetConfirm(network);
    } } }, [_vm._v(" Forget ")]) : _vm._e(), _c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "data-tid": "wifi-join" }, on: { "click": function($event) {
      return _vm.onNetworkClick(network);
    } } }, [_vm._v(" Connect ")])])]);
  })], 2)])]) : _vm._e(), _vm.compact && !_vm.locked ? _c("div", { staticClass: "wf__list", attrs: { "data-tid": "wifi-networks" } }, [!_vm.wifi_available_networks.length ? _c("p", { staticClass: "wf__note wf__note--pad" }, [_vm._v(" Looking for networks\u2026 ")]) : _vm._e(), _vm._l(_vm.shownNetworks, function(network) {
    return _c("div", { key: network.ssid, staticClass: "wf__row", class: { "wf__row--on": network.in_use }, attrs: { "data-ssid": network.ssid } }, [_c("button", { staticClass: "wf__main", attrs: { "type": "button", "title": _vm.networkFacts(network) }, on: { "click": function($event) {
      return _vm.onNetworkClick(network);
    } } }, [_c("svg", { staticClass: "wf__bars", attrs: { "viewBox": "0 0 20 16", "aria-hidden": "true" } }, _vm._l(4, function(bar) {
      return _c("rect", { key: bar, class: { "wf__bar--on": bar <= _vm.signalLevel(network.signal) }, attrs: { "x": (bar - 1) * 5, "y": 16 - bar * 4, "width": "3.5", "height": bar * 4, "rx": "1" } });
    }), 0), _c("span", { staticClass: "wf__name" }, [_c("b", [_vm._v(_vm._s(network.ssid))]), _c("span", [_vm._v(_vm._s(_vm.rowState(network)))])])])]);
  })], 2) : _vm._e(), _c(__unplugin_components_6, { attrs: { "max-width": "420" }, model: { value: _vm.disconnectConfirmDialog, callback: function($$v) {
    _vm.disconnectConfirmDialog = $$v;
  }, expression: "disconnectConfirmDialog" } }, [_c("div", { staticClass: "wf__dialog" }, [_c("h3", [_vm._v(_vm._s(_vm.$t("app.wifi.modal.disconnect.title")))]), !_vm.onHotspot ? _c("p", [_vm._v(" " + _vm._s(_vm.$t("app.wifi.modal.disconnect.message")) + " ")]) : _vm._e(), _c("div", { staticClass: "wf__buttons" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.disconnectConfirmDialog = false;
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--danger", attrs: { "type": "button" }, on: { "click": _vm.disconnect } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.disconnect")) + " ")])])])]), _c(__unplugin_components_7, { attrs: { "max-width": "420" }, model: { value: _vm.showWarningDialog, callback: function($$v) {
    _vm.showWarningDialog = $$v;
  }, expression: "showWarningDialog" } }, [_c("div", { staticClass: "wf__dialog" }, [_c("h3", [_vm._v(_vm._s(_vm.$t("app.wifi.modal.warning.title")))]), _c("p", [_vm._v(_vm._s(_vm.onHotspot ? _vm.$t("app.wifi.modal.warning.hotspot_message") : _vm.$t("app.wifi.modal.warning.message")))]), _c("div", { staticClass: "wf__buttons" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "disabled": _vm.acceptWarning_loading }, on: { "click": function($event) {
    _vm.showWarningDialog = false;
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": _vm.acceptWarning_loading, "data-tid": "wifi-proceed" }, on: { "click": _vm.acceptWarning } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.Proceed")) + " ")])])])]), _c(__unplugin_components_8, { attrs: { "max-width": "420" }, model: { value: _vm.showPasswordDialog, callback: function($$v) {
    _vm.showPasswordDialog = $$v;
  }, expression: "showPasswordDialog" } }, [_c("div", { staticClass: "wf__dialog" }, [_c("h3", [_vm._v("Password for " + _vm._s(_vm.selectedNetwork?.ssid))]), _c(__unplugin_components_9, { attrs: { "label": _vm.$t("app.general.label.password"), "type": "password", "outlined": "", "dense": "", "hide-details": "" }, on: { "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    return _vm.connectToSelected.apply(null, arguments);
  } }, model: { value: _vm.password, callback: function($$v) {
    _vm.password = $$v;
  }, expression: "password" } }), _c("div", { staticClass: "wf__buttons" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.showPasswordDialog = false;
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "wifi-connect" }, on: { "click": _vm.connectToSelected } }, [_vm._v(" Connect ")])])], 1)])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/wifi/WifiManagerCard.vue?vue&type=style&index=0&scoped=e18c6fa6&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e18c6fa6",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/wifi/WifiManagerCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnWEE7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFHQTtBQUtBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUdBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BRUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsUUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUNBLDBEQUNBO0FBRUEscURBQ0Esc0NBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBSUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BRUE7QUFFQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUVBO0FBRUE7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQTtBQUNBLGtDQUNBLGlJQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxlQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXZjQTtBQUFBO0FBQUEsR0FEQSxnQkFDQTtBQUdBO0FBQUE7QUFBQSxHQUpBLGdCQUlBO0FBMkRBO0FBQUEsRUFEQTtBQUFBLEdBOURBLGdCQStEQTtBQS9EQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJXaWZpTWFuYWdlckNhcmQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cclxuICA8c2VjdGlvblxyXG4gICAgY2xhc3M9XCJ3ZlwiXHJcbiAgICA6Y2xhc3M9XCJ7ICd3Zi0tY29tcGFjdCc6IGNvbXBhY3QsICd3Zi0tcGFnZSc6ICFjb21wYWN0IH1cIlxyXG4gICAgZGF0YS10aWQ9XCJ3aWZpLWNhcmRcIlxyXG4gID5cclxuICAgIDxoZWFkZXJcclxuICAgICAgdi1pZj1cImNvbXBhY3RcIlxyXG4gICAgICBjbGFzcz1cIndmX19oZWFkXCJcclxuICAgID5cclxuICAgICAgPGRpdiBjbGFzcz1cIndmX190aXRsZXNcIj5cclxuICAgICAgICA8aDI+V2ktRmk8L2gyPlxyXG4gICAgICAgIDxwIHYtaWY9XCIhbG9ja2VkXCI+XHJcbiAgICAgICAgICB7eyBjb25uZWN0ZWROZXR3b3JrID8gYE9uICR7Y29ubmVjdGVkTmV0d29yay5zc2lkfSDCtyBzaWduYWwgJHtjb25uZWN0ZWROZXR3b3JrLnNpZ25hbH0lYCA6ICdOb3Qgb24gYSBXaS1GaSBuZXR3b3JrJyB9fVxyXG4gICAgICAgIDwvcD5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxidXR0b25cclxuICAgICAgICB2LWlmPVwiIWxvY2tlZFwiXHJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgY2xhc3M9XCJ3Zl9fcmVmcmVzaFwiXHJcbiAgICAgICAgOmRpc2FibGVkPVwiZmV0Y2hpbmdcIlxyXG4gICAgICAgIGFyaWEtbGFiZWw9XCJMb29rIGZvciBuZXR3b3JrcyBhZ2FpblwiXHJcbiAgICAgICAgZGF0YS10aWQ9XCJ3aWZpLXJlZnJlc2hcIlxyXG4gICAgICAgIEBjbGljaz1cImZldGNoRGV2aWNlc1wiXHJcbiAgICAgID5cclxuICAgICAgICA8ZnJhbWUtaWNvblxyXG4gICAgICAgICAgbmFtZT1cInJlZnJlc2hcIlxyXG4gICAgICAgICAgc21hbGxcclxuICAgICAgICAvPlxyXG4gICAgICA8L2J1dHRvbj5cclxuICAgIDwvaGVhZGVyPlxyXG5cclxuICAgIDxwcm90ZWN0ZWQtbm90aWNlIGNsYXNzPVwid2ZfX3NwYW5cIiAvPlxyXG4gICAgPHBlcm1pc3Npb24tcmVmdXNhbC1ub3RpY2VcclxuICAgICAgY2xhc3M9XCJ3Zl9fc3BhblwiXHJcbiAgICAgIDpyZWZ1c2FsPVwicmVmdXNhbFwiXHJcbiAgICAgIEBkaXNtaXNzPVwicmVmdXNhbCA9IG51bGxcIlxyXG4gICAgLz5cclxuICAgIDxwXHJcbiAgICAgIHYtaWY9XCJyb3V0ZVByb2JsZW1cIlxyXG4gICAgICBjbGFzcz1cIndmX19ub3RlIHdmX19zcGFuXCJcclxuICAgICAgcm9sZT1cInN0YXR1c1wiXHJcbiAgICAgIDpkYXRhLXByb2JsZW09XCJyb3V0ZVByb2JsZW0ua2luZFwiXHJcbiAgICAgIGRhdGEtdGlkPVwid2lmaS1yb3V0ZS1wcm9ibGVtXCJcclxuICAgID5cclxuICAgICAge3sgcm91dGVQcm9ibGVtLm1lc3NhZ2UgfX1cclxuICAgIDwvcD5cclxuXHJcbiAgICA8c2VjdGlvblxyXG4gICAgICB2LWlmPVwiIWNvbXBhY3QgJiYgIWxvY2tlZFwiXHJcbiAgICAgIGNsYXNzPVwic3RpbGUgd2ZfX2JveFwiXHJcbiAgICAgIGRhdGEtdGlkPVwid2lmaS1ib3hcIlxyXG4gICAgPlxyXG4gICAgICA8aGVhZGVyIGNsYXNzPVwic3RpbGVfX2hlYWRcIj5cclxuICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwid2lmaVwiIC8+XHJcbiAgICAgICAgPGgyPldpLUZpPC9oMj5cclxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0aWxlX19hc2lkZVwiPlxyXG4gICAgICAgICAgPHRvbmUtcGlsbCA6dG9uZT1cImNvbm5lY3RlZE5ldHdvcmsgPyAnb2snIDogJ29mZidcIj57eyBjb25uZWN0ZWROZXR3b3JrID8gJ09ubGluZScgOiAnTm90IGNvbm5lY3RlZCcgfX08L3RvbmUtcGlsbD5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1zbVwiXHJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImZldGNoaW5nXCJcclxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ3aWZpLXJlZnJlc2hcIlxyXG4gICAgICAgICAgICBAY2xpY2s9XCJmZXRjaERldmljZXNcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxyXG4gICAgICAgICAgICAgIG5hbWU9XCJyZWZyZXNoXCJcclxuICAgICAgICAgICAgICBzbWFsbFxyXG4gICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICBTY2FuXHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L3NwYW4+XHJcbiAgICAgIDwvaGVhZGVyPlxyXG5cclxuICAgICAgPGRpdlxyXG4gICAgICAgIGNsYXNzPVwid2ZfX2Nvbm5lY3RlZFwiXHJcbiAgICAgICAgOmNsYXNzPVwieyAnd2ZfX2Nvbm5lY3RlZC0tb24nOiAhIWNvbm5lY3RlZE5ldHdvcmsgfVwiXHJcbiAgICAgICAgZGF0YS10aWQ9XCJ3aWZpLWNvbm5lY3RlZFwiXHJcbiAgICAgID5cclxuICAgICAgICA8dGVtcGxhdGUgdi1pZj1cImNvbm5lY3RlZE5ldHdvcmtcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3Zl9fbm93XCI+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3Jvd19faWNvIHdmX19ub3ctaWNvXCI+PGZyYW1lLWljb24gbmFtZT1cIndpZmlcIiAvPjwvc3Bhbj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndmX19ub3ctdGV4dFwiPlxyXG4gICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgIGNsYXNzPVwid2ZfX25vdy1uYW1lXCJcclxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1jb25uZWN0ZWQtbmFtZVwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge3sgY29ubmVjdGVkTmV0d29yay5zc2lkIH19XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0aWxlX19ub3RlXCI+XHJcbiAgICAgICAgICAgICAgICB7eyBbYmFuZChjb25uZWN0ZWROZXR3b3JrKSwgY29ubmVjdGVkTmV0d29yay5zZWN1cml0eSB8fCAnT3BlbicsIGAke3NpZ25hbFRleHQoY29ubmVjdGVkTmV0d29yay5zaWduYWwpfSBzaWduYWxgXS5maWx0ZXIoQm9vbGVhbikuam9pbignIMK3ICcpIH19XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGwgY2xhc3M9XCJ3Zl9fa3ZcIj5cclxuICAgICAgICAgICAgPGRpdiB2LWlmPVwid2lmaUlwXCI+XHJcbiAgICAgICAgICAgICAgPGR0PklQIGFkZHJlc3M8L2R0PlxyXG4gICAgICAgICAgICAgIDxkZCBjbGFzcz1cIndmX19tb25vXCI+XHJcbiAgICAgICAgICAgICAgICB7eyB3aWZpSXAgfX1cclxuICAgICAgICAgICAgICA8L2RkPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICA8ZHQ+U2lnbmFsPC9kdD5cclxuICAgICAgICAgICAgICA8ZGQ+e3sgY29ubmVjdGVkTmV0d29yay5zaWduYWwgfX0lPC9kZD5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgdi1pZj1cImhvc3RuYW1lXCI+XHJcbiAgICAgICAgICAgICAgPGR0PkFkZHJlc3M8L2R0PlxyXG4gICAgICAgICAgICAgIDxkZD57eyBob3N0bmFtZSB9fS5sb2NhbDwvZGQ+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kbD5cclxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3Zl9fbm93LWFjdHNcIj5cclxuICAgICAgICAgICAgPHNwYW5cclxuICAgICAgICAgICAgICB2LWlmPVwiZGlzY29ubmVjdElzUGFuZWxPbmx5XCJcclxuICAgICAgICAgICAgICBjbGFzcz1cIndmX19ub3RlXCJcclxuICAgICAgICAgICAgICBkYXRhLXRpZD1cIndpZmktZGlzY29ubmVjdC1wYW5lbFwiXHJcbiAgICAgICAgICAgID57eyBwYW5lbE9ubHlOb3RlIH19PC9zcGFuPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgdi1lbHNlXHJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXNtXCJcclxuICAgICAgICAgICAgICBkYXRhLXRpZD1cIndpZmktZGlzY29ubmVjdFwiXHJcbiAgICAgICAgICAgICAgQGNsaWNrPVwiZGlzY29ubmVjdENvbmZpcm1EaWFsb2cgPSB0cnVlXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uZGlzY29ubmVjdCcpIH19XHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgdi1pZj1cIiFpc0hpZGRlbihjb25uZWN0ZWROZXR3b3JrKVwiXHJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXNtIGNidG4tLWRhbmdlclwiXHJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ3aWZpLWZvcmdldFwiXHJcbiAgICAgICAgICAgICAgQGNsaWNrPVwiZm9yZ2V0Q29uZmlybShjb25uZWN0ZWROZXR3b3JrKVwiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICBGb3JnZXQgdGhpcyBuZXR3b3JrXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC90ZW1wbGF0ZT5cclxuICAgICAgICA8cFxyXG4gICAgICAgICAgdi1lbHNlXHJcbiAgICAgICAgICBjbGFzcz1cInN0aWxlX19ub3RlXCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICBOb3Qgb24gYSBXaS1GaSBuZXR3b3JrLiBQaWNrIG9uZSBmcm9tIHRoZSBsaXN0IHRvIGpvaW4gaXQuXHJcbiAgICAgICAgPC9wPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXZcclxuICAgICAgICBjbGFzcz1cIndmX19hdmFpbGFibGVcIlxyXG4gICAgICAgIGRhdGEtdGlkPVwid2lmaS1hdmFpbGFibGVcIlxyXG4gICAgICA+XHJcbiAgICAgICAgPGgzIGNsYXNzPVwic3RpbGVfX2dyb3VwLXRpdGxlIHdmX19ncm91cC10aXRsZVwiPlxyXG4gICAgICAgICAgPHNwYW4+T3RoZXIgbmV0d29ya3M8L3NwYW4+XHJcbiAgICAgICAgICA8c3BhblxyXG4gICAgICAgICAgICB2LWlmPVwib3RoZXJOZXR3b3Jrcy5sZW5ndGhcIlxyXG4gICAgICAgICAgICBjbGFzcz1cIndmX19mb3VuZFwiXHJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1mb3VuZFwiXHJcbiAgICAgICAgICA+e3sgb3RoZXJOZXR3b3Jrcy5sZW5ndGggfX0gZm91bmQ8L3NwYW4+XHJcbiAgICAgICAgPC9oMz5cclxuICAgICAgICA8ZGl2XHJcbiAgICAgICAgICBjbGFzcz1cInNsaXN0XCJcclxuICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1uZXR3b3Jrc1wiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPHBcclxuICAgICAgICAgICAgdi1pZj1cIiF3aWZpX2F2YWlsYWJsZV9uZXR3b3Jrcy5sZW5ndGhcIlxyXG4gICAgICAgICAgICBjbGFzcz1cInN0aWxlX19ub3RlIHdmX19lbXB0eVwiXHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIExvb2tpbmcgZm9yIG5ldHdvcmtz4oCmXHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgIHYtZm9yPVwibmV0d29yayBpbiBvdGhlck5ldHdvcmtzXCJcclxuICAgICAgICAgICAgOmtleT1cIm5ldHdvcmsuc3NpZFwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwic3JvdyB3Zl9fbmV0XCJcclxuICAgICAgICAgICAgOmRhdGEtc3NpZD1cIm5ldHdvcmsuc3NpZFwiXHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3Jvd19faWNvXCI+PGZyYW1lLWljb24gOm5hbWU9XCJuZXR3b3JrLnNlY3VyaXR5ID8gJ2xvY2snIDogJ3dpZmknXCIgLz48L3NwYW4+XHJcbiAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICBjbGFzcz1cInNyb3dfX3RleHRcIlxyXG4gICAgICAgICAgICAgIDp0aXRsZT1cIm5ldHdvcmtGYWN0cyhuZXR3b3JrKVwiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNyb3dfX3RcIj57eyBuZXR3b3JrLnNzaWQgfX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzcm93X19zXCI+e3sgcm93U3RhdGUobmV0d29yaykgfX17eyBiYW5kKG5ldHdvcmspID8gYCDCtyAke2JhbmQobmV0d29yayl9YCA6ICcnIH19PC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxzcGFuXHJcbiAgICAgICAgICAgICAgICBjbGFzcz1cInNyb3dfX3Mgd2ZfX2RldGFpbFwiXHJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cIndpZmktZGV0YWlsXCJcclxuICAgICAgICAgICAgICA+e3sgZGV0YWlsKG5ldHdvcmspIH19PC9zcGFuPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPHN2Z1xyXG4gICAgICAgICAgICAgIGNsYXNzPVwid2ZfX2JhcnNcIlxyXG4gICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjAgMTZcIlxyXG4gICAgICAgICAgICAgIHJvbGU9XCJpbWdcIlxyXG4gICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7c2lnbmFsVGV4dChuZXR3b3JrLnNpZ25hbCl9IHNpZ25hbGBcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgPHJlY3RcclxuICAgICAgICAgICAgICAgIHYtZm9yPVwiYmFyIGluIDRcIlxyXG4gICAgICAgICAgICAgICAgOmtleT1cImJhclwiXHJcbiAgICAgICAgICAgICAgICA6eD1cIihiYXIgLSAxKSAqIDVcIlxyXG4gICAgICAgICAgICAgICAgOnk9XCIxNiAtIGJhciAqIDRcIlxyXG4gICAgICAgICAgICAgICAgd2lkdGg9XCIzLjVcIlxyXG4gICAgICAgICAgICAgICAgOmhlaWdodD1cImJhciAqIDRcIlxyXG4gICAgICAgICAgICAgICAgcng9XCIxXCJcclxuICAgICAgICAgICAgICAgIDpjbGFzcz1cInsgJ3dmX19iYXItLW9uJzogYmFyIDw9IHNpZ25hbExldmVsKG5ldHdvcmsuc2lnbmFsKSB9XCJcclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICA8L3N2Zz5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzcm93X19hY3RcIj5cclxuICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICB2LWlmPVwia25vd25Tc2lkcy5oYXMobmV0d29yay5zc2lkKVwiXHJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1zbSBjYnRuLS1naG9zdFwiXHJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cIndpZmktZm9yZ2V0XCJcclxuICAgICAgICAgICAgICAgIEBjbGljaz1cImZvcmdldENvbmZpcm0obmV0d29yaylcIlxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIEZvcmdldFxyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXNtXCJcclxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1qb2luXCJcclxuICAgICAgICAgICAgICAgIEBjbGljaz1cIm9uTmV0d29ya0NsaWNrKG5ldHdvcmspXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICBDb25uZWN0XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICA8ZGl2XHJcbiAgICAgIHYtaWY9XCJjb21wYWN0ICYmICFsb2NrZWRcIlxyXG4gICAgICBjbGFzcz1cIndmX19saXN0XCJcclxuICAgICAgZGF0YS10aWQ9XCJ3aWZpLW5ldHdvcmtzXCJcclxuICAgID5cclxuICAgICAgPHBcclxuICAgICAgICB2LWlmPVwiIXdpZmlfYXZhaWxhYmxlX25ldHdvcmtzLmxlbmd0aFwiXHJcbiAgICAgICAgY2xhc3M9XCJ3Zl9fbm90ZSB3Zl9fbm90ZS0tcGFkXCJcclxuICAgICAgPlxyXG4gICAgICAgIExvb2tpbmcgZm9yIG5ldHdvcmtz4oCmXHJcbiAgICAgIDwvcD5cclxuICAgICAgPGRpdlxyXG4gICAgICAgIHYtZm9yPVwibmV0d29yayBpbiBzaG93bk5ldHdvcmtzXCJcclxuICAgICAgICA6a2V5PVwibmV0d29yay5zc2lkXCJcclxuICAgICAgICBjbGFzcz1cIndmX19yb3dcIlxyXG4gICAgICAgIDpjbGFzcz1cInsgJ3dmX19yb3ctLW9uJzogbmV0d29yay5pbl91c2UgfVwiXHJcbiAgICAgICAgOmRhdGEtc3NpZD1cIm5ldHdvcmsuc3NpZFwiXHJcbiAgICAgID5cclxuICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgIGNsYXNzPVwid2ZfX21haW5cIlxyXG4gICAgICAgICAgOnRpdGxlPVwibmV0d29ya0ZhY3RzKG5ldHdvcmspXCJcclxuICAgICAgICAgIEBjbGljaz1cIm9uTmV0d29ya0NsaWNrKG5ldHdvcmspXCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8c3ZnXHJcbiAgICAgICAgICAgIGNsYXNzPVwid2ZfX2JhcnNcIlxyXG4gICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDIwIDE2XCJcclxuICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPHJlY3RcclxuICAgICAgICAgICAgICB2LWZvcj1cImJhciBpbiA0XCJcclxuICAgICAgICAgICAgICA6a2V5PVwiYmFyXCJcclxuICAgICAgICAgICAgICA6eD1cIihiYXIgLSAxKSAqIDVcIlxyXG4gICAgICAgICAgICAgIDp5PVwiMTYgLSBiYXIgKiA0XCJcclxuICAgICAgICAgICAgICB3aWR0aD1cIjMuNVwiXHJcbiAgICAgICAgICAgICAgOmhlaWdodD1cImJhciAqIDRcIlxyXG4gICAgICAgICAgICAgIHJ4PVwiMVwiXHJcbiAgICAgICAgICAgICAgOmNsYXNzPVwieyAnd2ZfX2Jhci0tb24nOiBiYXIgPD0gc2lnbmFsTGV2ZWwobmV0d29yay5zaWduYWwpIH1cIlxyXG4gICAgICAgICAgICAvPlxyXG4gICAgICAgICAgPC9zdmc+XHJcbiAgICAgICAgICA8c3BhbiBjbGFzcz1cIndmX19uYW1lXCI+XHJcbiAgICAgICAgICAgIDxiPnt7IG5ldHdvcmsuc3NpZCB9fTwvYj5cclxuICAgICAgICAgICAgPHNwYW4+e3sgcm93U3RhdGUobmV0d29yaykgfX08L3NwYW4+XHJcbiAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgPC9idXR0b24+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcblxyXG4gICAgPHYtZGlhbG9nXHJcbiAgICAgIHYtbW9kZWw9XCJkaXNjb25uZWN0Q29uZmlybURpYWxvZ1wiXHJcbiAgICAgIG1heC13aWR0aD1cIjQyMFwiXHJcbiAgICA+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3Zl9fZGlhbG9nXCI+XHJcbiAgICAgICAgPGgzPnt7ICR0KCdhcHAud2lmaS5tb2RhbC5kaXNjb25uZWN0LnRpdGxlJykgfX08L2gzPlxyXG4gICAgICAgIDxwIHYtaWY9XCIhb25Ib3RzcG90XCI+XHJcbiAgICAgICAgICB7eyAkdCgnYXBwLndpZmkubW9kYWwuZGlzY29ubmVjdC5tZXNzYWdlJykgfX1cclxuICAgICAgICA8L3A+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cIndmX19idXR0b25zXCI+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxyXG4gICAgICAgICAgICBAY2xpY2s9XCJkaXNjb25uZWN0Q29uZmlybURpYWxvZyA9IGZhbHNlXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5jYW5jZWwnKSB9fVxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZGFuZ2VyXCJcclxuICAgICAgICAgICAgQGNsaWNrPVwiZGlzY29ubmVjdFwiXHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uZGlzY29ubmVjdCcpIH19XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L3YtZGlhbG9nPlxyXG5cclxuICAgIDx2LWRpYWxvZ1xyXG4gICAgICB2LW1vZGVsPVwic2hvd1dhcm5pbmdEaWFsb2dcIlxyXG4gICAgICBtYXgtd2lkdGg9XCI0MjBcIlxyXG4gICAgPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwid2ZfX2RpYWxvZ1wiPlxyXG4gICAgICAgIDxoMz57eyAkdCgnYXBwLndpZmkubW9kYWwud2FybmluZy50aXRsZScpIH19PC9oMz5cclxuICAgICAgICA8cD57eyBvbkhvdHNwb3QgPyAkdCgnYXBwLndpZmkubW9kYWwud2FybmluZy5ob3RzcG90X21lc3NhZ2UnKSA6ICR0KCdhcHAud2lmaS5tb2RhbC53YXJuaW5nLm1lc3NhZ2UnKSB9fTwvcD5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwid2ZfX2J1dHRvbnNcIj5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXHJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImFjY2VwdFdhcm5pbmdfbG9hZGluZ1wiXHJcbiAgICAgICAgICAgIEBjbGljaz1cInNob3dXYXJuaW5nRGlhbG9nID0gZmFsc2VcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICB7eyAkdCgnYXBwLmdlbmVyYWwuYnRuLmNhbmNlbCcpIH19XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcclxuICAgICAgICAgICAgOmRpc2FibGVkPVwiYWNjZXB0V2FybmluZ19sb2FkaW5nXCJcclxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ3aWZpLXByb2NlZWRcIlxyXG4gICAgICAgICAgICBAY2xpY2s9XCJhY2NlcHRXYXJuaW5nXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5Qcm9jZWVkJykgfX1cclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvdi1kaWFsb2c+XHJcblxyXG4gICAgPHYtZGlhbG9nXHJcbiAgICAgIHYtbW9kZWw9XCJzaG93UGFzc3dvcmREaWFsb2dcIlxyXG4gICAgICBtYXgtd2lkdGg9XCI0MjBcIlxyXG4gICAgPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwid2ZfX2RpYWxvZ1wiPlxyXG4gICAgICAgIDxoMz5QYXNzd29yZCBmb3Ige3sgc2VsZWN0ZWROZXR3b3JrPy5zc2lkIH19PC9oMz5cclxuICAgICAgICA8di10ZXh0LWZpZWxkXHJcbiAgICAgICAgICB2LW1vZGVsPVwicGFzc3dvcmRcIlxyXG4gICAgICAgICAgOmxhYmVsPVwiJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLnBhc3N3b3JkJylcIlxyXG4gICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgICAgICAgIG91dGxpbmVkXHJcbiAgICAgICAgICBkZW5zZVxyXG4gICAgICAgICAgaGlkZS1kZXRhaWxzXHJcbiAgICAgICAgICBAa2V5dXAuZW50ZXI9XCJjb25uZWN0VG9TZWxlY3RlZFwiXHJcbiAgICAgICAgLz5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwid2ZfX2J1dHRvbnNcIj5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXHJcbiAgICAgICAgICAgIEBjbGljaz1cInNob3dQYXNzd29yZERpYWxvZyA9IGZhbHNlXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5jYW5jZWwnKSB9fVxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXHJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1jb25uZWN0XCJcclxuICAgICAgICAgICAgQGNsaWNrPVwiY29ubmVjdFRvU2VsZWN0ZWRcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICBDb25uZWN0XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L3YtZGlhbG9nPlxyXG4gIDwvc2VjdGlvbj5cclxuPC90ZW1wbGF0ZT5cclxuXHJcbjxzY3JpcHQgbGFuZz1cInRzXCI+XHJcbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXHJcbmltcG9ydCB7IHVzZUF1eEFwaSB9IGZyb20gJ0AvYXV4X2FwaS91c2VBdXhBcGknXHJcbmltcG9ydCB7IFBBTkVMX09OTFlfTk9URSwgY2xhc3NpZnlSZWZ1c2FsLCBpc1BhbmVsT25seVJlZnVzYWwsIHBhbmVsT25seU1lc3NhZ2UsIHJlZnVzZWRIZXJlLCByb3V0ZUZvciB9IGZyb20gJ0Avc2VydmljZXMvd2lmaS9wYW5lbC1vbmx5J1xyXG5pbXBvcnQgdHlwZSB7IFJlZnVzYWxLaW5kIH0gZnJvbSAnQC9zZXJ2aWNlcy93aWZpL3BhbmVsLW9ubHknXHJcbmltcG9ydCBQZXJtaXNzaW9uUmVmdXNhbE5vdGljZSBmcm9tICcuL1Blcm1pc3Npb25SZWZ1c2FsTm90aWNlLnZ1ZSdcclxuaW1wb3J0IHR5cGUgeyBEZXZpY2VXaWZpIH0gZnJvbSAnQC9hdXhfYXBpL21vZGVscy9kZXZpY2Utd2lmaSdcclxuaW1wb3J0IHsgdXNlSG90c3BvdENoZWNrIH0gZnJvbSAnQC9hdXhfYXBpL3VzZUhvdHNwb3RDaGVjaydcclxuaW1wb3J0IHsgd2lmaVByb2JlIH0gZnJvbSAnQC9zZXJ2aWNlcy93aWZpL3NhdmVkLXByb2JlJ1xyXG5pbXBvcnQgeyBtYW5hZ2VkTmV0d29ya1Byb2JsZW0gfSBmcm9tICdAL3NlcnZpY2VzL3dpZmkvbmV0d29yay1yb3V0ZSdcclxuaW1wb3J0IHR5cGUgeyBNYW5hZ2VkTmV0d29ya1Byb2JsZW0gfSBmcm9tICdAL3NlcnZpY2VzL3dpZmkvbmV0d29yay1yb3V0ZSdcclxuaW1wb3J0IHsgRXZlbnRCdXMgfSBmcm9tICdAL2V2ZW50QnVzJ1xyXG5pbXBvcnQgeyBtb29ucmFrZXJFcnJvck1lc3NhZ2UgfSBmcm9tICdAL3N0b3JlL3Byb3RlY3Rpb24vaGVscGVycydcclxuaW1wb3J0IHsgcHJpbnRlclRyYW5zcG9ydEJpbmRpbmcgfSBmcm9tICdAL3NlcnZpY2VzL21hbmFnZWQtc2Vzc2lvbi9odHRwVHJhbnNwb3J0QmluZGluZydcclxuaW1wb3J0IFRvbmVQaWxsIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9Ub25lUGlsbC52dWUnXHJcbmltcG9ydCB7IGludGVyZmFjZUlwLCBzaWduYWxXb3JkIH0gZnJvbSAnQC9zZXJ2aWNlcy9zeXN0ZW0vbW9kZWwnXHJcblxyXG5jb25zdCB7IG9uSG90c3BvdCB9ID0gdXNlSG90c3BvdENoZWNrKClcclxuXHJcbi8qKiBXaGF0IHRoZSBuZXR3b3JrIHRoZSBwcmludGVyIGlzIG9uIGlzIGNhbGxlZCB3aGVuIGl0IGRvZXMgbm90IGJyb2FkY2FzdCBpdHMgbmFtZS4gKi9cclxuY29uc3QgSElEREVOX05BTUUgPSAnSGlkZGVuIG5ldHdvcmsnXHJcblxyXG50eXBlIEFnZ1dpZmkgPSBEZXZpY2VXaWZpICYgeyBjaGFuTGlzdD86IHN0cmluZzsgZnJlcUxpc3Q/OiBzdHJpbmcgfVxyXG5cclxuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVG9uZVBpbGwsIFBlcm1pc3Npb25SZWZ1c2FsTm90aWNlIH0gfSlcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2lmaU1hbmFnZXJDYXJkIGV4dGVuZHMgVnVlIHtcclxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgbWVudUNvbGxhcHNlZD86IGJvb2xlYW5cclxuXHJcbiAgLyoqIFRoZSByYWlsJ3MgcXVpY2sgbWVudTogdGhlIG5ldHdvcmsgaXQncyBvbiBhbmQgdGhlIG5leHQgZmV3LCB0byBqb2luIHdpdGggdGhlIHNhbWUgd2FybmluZ3MuICovXHJcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IGNvbXBhY3Q/OiBib29sZWFuXHJcblxyXG4gIC8qKiBUaGUgcHJpbnRlcidzIHBlcm1pc3Npb24gc3RvcmUgcmVmdXNlZCB0aGUgbGFzdCBhY3Rpb24gKEtBTi0yNDU3KTogd2hvIG1heSBkbyBpdCwgbm90IGEgcGFuZWwtb25seSBwcmludGVyLiAqL1xyXG4gIHJlZnVzYWw6IEV4dHJhY3Q8UmVmdXNhbEtpbmQsIHsga2luZDogJ3Blcm1pc3Npb24nIH0+IHwgbnVsbCA9IG51bGxcclxuXHJcbiAgLyoqIEtlZXBzIGEgcGVybWlzc2lvbiByZWZ1c2FsIGZvciB0aGUgbm90aWNlOyBmYWxzZSBmb3IgYW55IG90aGVyIGVycm9yLiAqL1xyXG4gIHByaXZhdGUgdGFrZVBlcm1pc3Npb25SZWZ1c2FsIChlcnI6IHVua25vd24pOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHIgPSBjbGFzc2lmeVJlZnVzYWwoZXJyKVxyXG4gICAgaWYgKHIua2luZCAhPT0gJ3Blcm1pc3Npb24nKSByZXR1cm4gZmFsc2VcclxuICAgIHRoaXMucmVmdXNhbCA9IHJcclxuICAgIHJldHVybiB0cnVlXHJcbiAgfVxyXG5cclxuICAvLyBEaWFsb2cgJiBjb25uZWN0aW9uIHN0YXRlXHJcbiAgZGlzY29ubmVjdENvbmZpcm1EaWFsb2cgPSBmYWxzZVxyXG4gIHNob3dXYXJuaW5nRGlhbG9nID0gZmFsc2VcclxuICBzaG93UGFzc3dvcmREaWFsb2cgPSBmYWxzZVxyXG4gIHNlbGVjdGVkTmV0d29yazogRGV2aWNlV2lmaSB8IG51bGwgPSBudWxsXHJcbiAgcGFzc3dvcmQgPSAnJ1xyXG5cclxuICAvLyBNZW51IHN0YXRlXHJcbiAgbWVudU9wZW46IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge31cclxuXHJcbiAgLy8gV2ktRmkgc2NhbiBkYXRhXHJcbiAgd2lmaV9hdmFpbGFibGVfbmV0d29ya3M6IERldmljZVdpZmlbXSA9IFtdXHJcbiAga25vd25Tc2lkcyA9IG5ldyBTZXQ8c3RyaW5nPigpXHJcbiAgLyoqIFNTSURzIHRoZSBwZXItU1NJRCBmYWxsYmFjayBoYXMgYXNrZWQgYWJvdXQ6IHRoZSBwYWdlIHNlc3Npb24ncywgc2VlIHNhdmVkLXByb2JlLnRzLiAqL1xyXG4gIGdldCB0ZXN0ZWRTc2lkcyAoKTogU2V0PHN0cmluZz4geyByZXR1cm4gd2lmaVByb2JlLmFza2VkIH1cclxuICB3aWZpT3JkZXI6IHN0cmluZ1tdID0gW11cclxuICBwcml2YXRlIGludGVydmFsSWQ6IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPiB8IG51bGwgPSBudWxsXHJcblxyXG4gIHJlZnJlc2ggKCkge1xyXG4gICAgdGhpcy53aWZpX2F2YWlsYWJsZV9uZXR3b3JrcyA9IFtdXHJcbiAgICB0aGlzLndpZmlPcmRlciA9IFtdXHJcbiAgfVxyXG5cclxuICBnZXQgb25Ib3RzcG90ICgpIHtcclxuICAgIHJldHVybiBvbkhvdHNwb3QudmFsdWVcclxuICB9XHJcblxyXG4gIC8vIE11b25PUyBuZXR3b3JrIHByb3RlY3Rpb24gaXMgb24gYW5kIHRoaXMgYnJvd3NlciBoYXMgbm8gaWRlbnRpdHksIHNvXHJcbiAgLy8gZXZlcnkgV2ktRmkgcmVxdWVzdCB3b3VsZCBiZSByZWZ1c2VkLiBUaGUgbm90aWNlIHNheXMgc28gaW5zdGVhZCwgYW5kXHJcbiAgLy8gcG9sbGluZyB3YWl0cyB1bnRpbCB0aGF0IGNoYW5nZXMuXHJcbiAgZ2V0IGxvY2tlZCAoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJvdGVjdGlvbi9pc0xvY2tlZCddXHJcbiAgfVxyXG5cclxuICAvLyBSZWFjaGVkIG92ZXIgQmx1ZXRvb3RoIG9yIE11b24zRCAoSXJvaCk6IHRoZSBBdXggY2xpZW50IHNlbmRzIGVhY2ggV2ktRmlcclxuICAvLyBjYWxsIHRvIG11b24tbGluaydzIG93biByb3V0ZSBpbnN0ZWFkIChLQU4tMzYwMSksIHNvIG5vdGhpbmcgaGVyZSBjaGFuZ2VzXHJcbiAgLy8gYnkgcm91dGUuIFdoYXQgY2FuIGRpZmZlciBpcyB0aGUgYW5zd2VyOiBhbiBvbGRlciBtdW9uLWxpbmsgaGFzIG5vIHN1Y2hcclxuICAvLyByb3V0ZSwgb3IgdGhlIG93bmVyIHR1cm5lZCB0aGUgcm91dGUgb2ZmLCBhbmQgdGhlIG5vdGUgc2F5cyB3aGljaC5cclxuICBnZXQgcmVtb3RlICgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBwcmludGVyVHJhbnNwb3J0QmluZGluZy5yZW1vdGVcclxuICB9XHJcblxyXG4gIC8qKiBXaHkgdGhpcyBjb25uZWN0aW9uIGNhbid0IGNoYW5nZSBXaS1GaSwgZnJvbSB0aGUgbGFzdCBhbnN3ZXI7IG51bGwgd2hlbiBpdCBjYW4gKG9yIGhhcyBub3QgYmVlbiBhc2tlZCkuICovXHJcbiAgcm91dGVQcm9ibGVtOiBNYW5hZ2VkTmV0d29ya1Byb2JsZW0gfCBudWxsID0gbnVsbFxyXG5cclxuICBAV2F0Y2goJ3JlbW90ZScpXHJcbiAgb25SZW1vdGVDaGFuZ2VkICgpIHtcclxuICAgIHRoaXMucm91dGVQcm9ibGVtID0gbnVsbFxyXG4gICAgLy8gVGhlIHBlci1TU0lEIGZhbGxiYWNrIGlzIGFuIEF1eCBBUEkgcm91dGU6IHdoYXQgYSByZW1vdGUgcm91dGUgc2FpZCBhYm91dCAvd2lmaS9zYXZlZCBzYXlzIG5vdGhpbmcgYWJvdXQgdGhpcyBvbmUuXHJcbiAgICB3aWZpUHJvYmUuc2F2ZWRVbnN1cHBvcnRlZCA9IGZhbHNlXHJcbiAgICB0aGlzLnN0b3BQb2xsaW5nKClcclxuICAgIHRoaXMuZmV0Y2hEZXZpY2VzKClcclxuICAgIHRoaXMuc3RhcnRQb2xsaW5nKClcclxuICB9XHJcblxyXG4gIGF1eEFwaSA9IHVzZUF1eEFwaSgpXHJcblxyXG4gIC8vIExpZmVjeWNsZVxyXG4gIG1vdW50ZWQgKCkge1xyXG4gICAgdGhpcy52aXNpYmlsaXR5SGFuZGxlciA9ICgpID0+IHRoaXMub25WaXNpYmlsaXR5Q2hhbmdlKClcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLnZpc2liaWxpdHlIYW5kbGVyKVxyXG4gICAgdGhpcy5mZXRjaERldmljZXMoKVxyXG4gICAgdGhpcy5zdGFydFBvbGxpbmcoKVxyXG4gIH1cclxuXHJcbiAgYmVmb3JlRGVzdHJveSAoKSB7XHJcbiAgICBpZiAodGhpcy52aXNpYmlsaXR5SGFuZGxlcikgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMudmlzaWJpbGl0eUhhbmRsZXIpXHJcbiAgICB0aGlzLnN0b3BQb2xsaW5nKClcclxuICB9XHJcblxyXG4gIC8vIFRoZSA1IHMgcG9sbCBydW5zIG9ubHkgd2hpbGUgdGhlIHRhYiBpcyB2aXNpYmxlIGFuZCBvbiB0aGUgcHJpbnRlcidzIG93blxyXG4gIC8vIG5ldHdvcms6IGV2ZXJ5IHRpY2sgY29zdHMgdGhlIHByaW50ZXIgYW4gbm1jbGkgc2NhbiwgYW5kIHRoZSBwYW5lbCBuZXZlclxyXG4gIC8vIHRha2VzIHByaW50ZXIgY29tcHV0ZS4gT3ZlciBCbHVldG9vdGggb3IgTXVvbjNEIGl0IHNjYW5zIG9uIG9wZW4gYW5kIG9uIHRoZVxyXG4gIC8vIFNjYW4gYnV0dG9uIG9ubHksIGFuZCBpdCBzdG9wcyBvbmNlIHRoZSByb3V0ZSBoYXMgc2FpZCBpdCBjYW4ndCBoZWxwLlxyXG4gIHByaXZhdGUgc3RhcnRQb2xsaW5nICgpIHtcclxuICAgIGlmICh0aGlzLmludGVydmFsSWQgfHwgZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJyB8fCB0aGlzLnJlbW90ZSB8fCB0aGlzLnJvdXRlUHJvYmxlbSkgcmV0dXJuXHJcbiAgICB0aGlzLmludGVydmFsSWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmZldGNoRGV2aWNlcygpLCA1MDAwKVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzdG9wUG9sbGluZyAoKSB7XHJcbiAgICBpZiAodGhpcy5pbnRlcnZhbElkKSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZClcclxuICAgIHRoaXMuaW50ZXJ2YWxJZCA9IG51bGxcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdmlzaWJpbGl0eUhhbmRsZXI6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXHJcblxyXG4gIG9uVmlzaWJpbGl0eUNoYW5nZSAoKSB7XHJcbiAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xyXG4gICAgICB0aGlzLnN0b3BQb2xsaW5nKClcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuaW50ZXJ2YWxJZCkge1xyXG4gICAgICB0aGlzLmZldGNoRGV2aWNlcygpXHJcbiAgICAgIHRoaXMuc3RhcnRQb2xsaW5nKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZldGNoaW5nOiBib29sZWFuID0gZmFsc2VcclxuXHJcbiAgLy8gRmV0Y2ggYW5kIG1hcmsga25vd24gU1NJRHNcclxuICBhc3luYyBmZXRjaERldmljZXMgKCkge1xyXG4gICAgaWYgKHRoaXMuZmV0Y2hpbmcgfHwgdGhpcy5sb2NrZWQpIHJldHVyblxyXG4gICAgdGhpcy5mZXRjaGluZyA9IHRydWVcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuYXV4QXBpLndpZmkud2lmaVNjYW5XaWZpU2NhbkdldCh0cnVlKVxyXG4gICAgICB0aGlzLndpZmlfYXZhaWxhYmxlX25ldHdvcmtzID0gcmVzLmRhdGFcclxuICAgICAgdGhpcy5yb3V0ZVByb2JsZW0gPSBudWxsXHJcblxyXG4gICAgICBhd2FpdCB0aGlzLnVwZGF0ZUtub3duU3NpZHMoKVxyXG5cclxuICAgICAgLy8g4oCU4oCUIENIQU5HRUQ6IOKAnGZpcnN0LWNvbWXigJ0gb3JkZXJpbmcgbm93IHRyYWNrZWQgYnkgU1NJRCAoYWZ0ZXIgZ3JvdXBpbmcpIOKAlOKAlFxyXG4gICAgICBjb25zdCBncm91cHMgPSB0aGlzLmdyb3VwZWROZXR3b3JrcyAvLyBORVdcclxuICAgICAgY29uc3QgY3VycmVudCA9IG5ldyBTZXQoZ3JvdXBzLm1hcChnID0+IGcuc3NpZCkpIC8vIE5FV1xyXG4gICAgICBjb25zdCBieVNpZ25hbCA9IFsuLi5ncm91cHNdLnNvcnQoKGEsIGIpID0+IGIuc2lnbmFsIC0gYS5zaWduYWwpXHJcbiAgICAgIGZvciAoY29uc3QgbmV0IG9mIGJ5U2lnbmFsKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLndpZmlPcmRlci5pbmNsdWRlcyhuZXQuc3NpZCkpIHtcclxuICAgICAgICAgIHRoaXMud2lmaU9yZGVyLnB1c2gobmV0LnNzaWQpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMud2lmaU9yZGVyID0gdGhpcy53aWZpT3JkZXIuZmlsdGVyKHNzaWQgPT4gY3VycmVudC5oYXMoc3NpZCkpXHJcbiAgICAgIC8vIOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlFxyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1dpLUZpIHNjYW4gZmFpbGVkJywgZSlcclxuICAgICAgaWYgKHRoaXMucmVtb3RlKSB0aGlzLnJvdXRlUHJvYmxlbSA9IG1hbmFnZWROZXR3b3JrUHJvYmxlbShlKVxyXG4gICAgICBpZiAodGhpcy5yb3V0ZVByb2JsZW0pIHRoaXMuc3RvcFBvbGxpbmcoKVxyXG4gICAgICBpZiAoZT8ucmVzcG9uc2U/LnN0YXR1cyA9PT0gNDAzICYmICF0aGlzLnJvdXRlUHJvYmxlbSkgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ3Byb3RlY3Rpb24vb25SZWZ1c2VkJylcclxuICAgIH1cclxuICAgIHRoaXMuZmV0Y2hpbmcgPSBmYWxzZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hpY2ggc2Nhbm5lZCBuZXR3b3JrcyB0aGUgcHJpbnRlciBoYXMgc2F2ZWQuIE9uZSBgR0VUIC93aWZpL3NhdmVkYCBwZXJcclxuICAgKiBwb2xsIGFuc3dlcnMgaXQgZm9yIGFsbCBvZiB0aGVtLiBBIHByaW50ZXIgd2l0aG91dCB0aGF0IHJvdXRlICg0MDQsIG9uY2UpXHJcbiAgICogaXMgYXNrZWQgcGVyIFNTSUQgaW5zdGVhZCwgYXQgbW9zdCBvbmNlIGVhY2ggZm9yIHRoZSBwYWdlIHNlc3Npb24uXHJcbiAgICovXHJcbiAgYXN5bmMgdXBkYXRlS25vd25Tc2lkcyAoKSB7XHJcbiAgICBpZiAoIXdpZmlQcm9iZS5zYXZlZFVuc3VwcG9ydGVkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5hdXhBcGkud2lmaS53aWZpU2F2ZWRXaWZpU2F2ZWRHZXQoKVxyXG4gICAgICAgIHRoaXMua25vd25Tc2lkcyA9IG5ldyBTZXQoKHJlcy5kYXRhIHx8IFtdKS5tYXAocCA9PiAocC5uYW1lIHx8ICcnKS50cmltKCkpKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICBpZiAoZT8ucmVzcG9uc2U/LnN0YXR1cyAhPT0gNDA0IHx8IHRoaXMucmVtb3RlKSByZXR1cm4gLy8gdHJhbnNpZW50LCBvciBhIHJlbW90ZSByb3V0ZSAobm8gcGVyLVNTSUQgcm91dGUgdGhlcmUpOiBrZWVwIHdoYXQgd2Uga25vd1xyXG4gICAgICAgIHdpZmlQcm9iZS5zYXZlZFVuc3VwcG9ydGVkID0gdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBmb3IgKGNvbnN0IG5ldCBvZiB0aGlzLndpZmlfYXZhaWxhYmxlX25ldHdvcmtzKSB7XHJcbiAgICAgIGNvbnN0IHNzaWQgPSAobmV0LnNzaWQgfHwgJycpLnRyaW0oKVxyXG4gICAgICBpZiAoIXNzaWQgfHwgdGhpcy5rbm93blNzaWRzLmhhcyhzc2lkKSB8fCB3aWZpUHJvYmUuYXNrZWQuaGFzKHNzaWQpKSBjb250aW51ZVxyXG4gICAgICB3aWZpUHJvYmUuYXNrZWQuYWRkKHNzaWQpXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5hdXhBcGkud2lmaS5nZXREZXRhaWxzV2lmaVNob3dHZXQoc3NpZClcclxuICAgICAgICB0aGlzLmtub3duU3NpZHMgPSBuZXcgU2V0KHRoaXMua25vd25Tc2lkcykuYWRkKHNzaWQpXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIC8vIDQwNDogbm90IHNhdmVkLlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBORVc6IG9uZSByb3cgcGVyIFNTSUQgd2l0aCBtZXJnZWQgZGV0YWlsc1xyXG4gIGdldCBncm91cGVkTmV0d29ya3MgKCk6IEFnZ1dpZmlbXSB7XHJcbiAgICBjb25zdCBieVNzaWQgPSBuZXcgTWFwPHN0cmluZywgQWdnV2lmaSAmIHsgX2NoYW5zOiBTZXQ8c3RyaW5nPiwgX2ZyZXFzOiBTZXQ8c3RyaW5nPiB9PigpXHJcbiAgICBmb3IgKGNvbnN0IG4gb2YgdGhpcy53aWZpX2F2YWlsYWJsZV9uZXR3b3Jrcykge1xyXG4gICAgICAvLyBIaWRkZW4gbmV0d29ya3MgYXJlIGxlZnQgb3V0LCB1bmxlc3MgdGhpcyBpcyB0aGUgb25lIHRoZSBwcmludGVyIGlzIG9uOiB0aGF0IGlzIHNob3duLCBhcyBjb25uZWN0ZWQuXHJcbiAgICAgIGNvbnN0IHNzaWQgPSAobi5zc2lkIHx8ICcnKS50cmltKCkgfHwgKG4uaW5fdXNlID8gSElEREVOX05BTUUgOiAnJylcclxuICAgICAgaWYgKCFzc2lkKSBjb250aW51ZVxyXG5cclxuICAgICAgY29uc3QgaXNTZWN1cmVkID0gISEobi5zZWN1cml0eSAmJiAhL15cXHMqb3BlblxccyokL2kudGVzdChuLnNlY3VyaXR5KSlcclxuICAgICAgaWYgKCFieVNzaWQuaGFzKHNzaWQpKSB7XHJcbiAgICAgICAgYnlTc2lkLnNldChzc2lkLCB7XHJcbiAgICAgICAgICAuLi5uLFxyXG4gICAgICAgICAgc3NpZCwgLy8gbm9ybWFsaXplZFxyXG4gICAgICAgICAgaW5fdXNlOiAhIW4uaW5fdXNlLFxyXG4gICAgICAgICAgc2lnbmFsOiBuLnNpZ25hbCxcclxuICAgICAgICAgIHJhdGU6IG4ucmF0ZSxcclxuICAgICAgICAgIHNlY3VyaXR5OiBpc1NlY3VyZWQgPyBuLnNlY3VyaXR5IDogJycsIC8vIGVtcHR5ID0+IOKAnHVuc2VjdXJlZOKAnSBsYWJlbFxyXG4gICAgICAgICAgY2hhbkxpc3Q6IFN0cmluZyhuLmNoYW4pLFxyXG4gICAgICAgICAgZnJlcUxpc3Q6IFN0cmluZyhuLmZyZXEpLFxyXG4gICAgICAgICAgX2NoYW5zOiBuZXcgU2V0KFtTdHJpbmcobi5jaGFuKV0pLFxyXG4gICAgICAgICAgX2ZyZXFzOiBuZXcgU2V0KFtTdHJpbmcobi5mcmVxKV0pXHJcbiAgICAgICAgfSBhcyBhbnkpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgZyA9IGJ5U3NpZC5nZXQoc3NpZCkhXHJcbiAgICAgICAgZy5pbl91c2UgPSBnLmluX3VzZSB8fCAhIW4uaW5fdXNlXHJcbiAgICAgICAgLy8gUHJlZmVyIGFueSBzZWN1cmVkIGxhYmVsIG92ZXIg4oCcb3BlbuKAnVxyXG4gICAgICAgIGlmIChpc1NlY3VyZWQgJiYgKCFnLnNlY3VyaXR5IHx8IC9eXFxzKm9wZW5cXHMqJC9pLnRlc3QoZy5zZWN1cml0eSkpKSB7XHJcbiAgICAgICAgICBnLnNlY3VyaXR5ID0gbi5zZWN1cml0eVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobi5zaWduYWwgPiBnLnNpZ25hbCkgZy5zaWduYWwgPSBuLnNpZ25hbFxyXG4gICAgICAgIGlmIChuLnJhdGUgPiBnLnJhdGUpIGcucmF0ZSA9IG4ucmF0ZVxyXG4gICAgICAgIGcuX2NoYW5zLmFkZChTdHJpbmcobi5jaGFuKSlcclxuICAgICAgICBnLl9mcmVxcy5hZGQoU3RyaW5nKG4uZnJlcSkpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBmaW5hbGl6ZSByZWFkYWJsZSBsaXN0c1xyXG4gICAgZm9yIChjb25zdCBnIG9mIGJ5U3NpZC52YWx1ZXMoKSkge1xyXG4gICAgICBnLmNoYW5MaXN0ID0gQXJyYXkuZnJvbShnLl9jaGFucykuam9pbignLCAnKVxyXG4gICAgICBnLmZyZXFMaXN0ID0gQXJyYXkuZnJvbShnLl9mcmVxcykuam9pbignLCAnKVxyXG4gICAgICBkZWxldGUgKGcgYXMgYW55KS5fY2hhbnNcclxuICAgICAgZGVsZXRlIChnIGFzIGFueSkuX2ZyZXFzXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQXJyYXkuZnJvbShieVNzaWQudmFsdWVzKCkpXHJcbiAgfVxyXG5cclxuICAvLyBTb3J0aW5nXHJcbiAgZ2V0IHNvcnRlZE5ldHdvcmtzICgpOiBBZ2dXaWZpW10ge1xyXG4gICAgY29uc3QgZ3JvdXBzID0gdGhpcy5ncm91cGVkTmV0d29ya3NcclxuICAgIGNvbnN0IGNvbm5lY3RlZFNzaWQgPSBncm91cHMuZmluZChuID0+IG4uaW5fdXNlKT8uc3NpZCA/PyBudWxsXHJcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwKGdyb3Vwcy5tYXAobiA9PiBbbi5zc2lkLCBuXSkpXHJcbiAgICBjb25zdCBvdGhlcnMgPSB0aGlzLndpZmlPcmRlclxyXG4gICAgICAuZmlsdGVyKHNzaWQgPT4gbWFwLmhhcyhzc2lkKSAmJiBzc2lkICE9PSBjb25uZWN0ZWRTc2lkKVxyXG4gICAgICAubWFwKHNzaWQgPT4gbWFwLmdldChzc2lkKSEpXHJcblxyXG4gICAgcmV0dXJuIGNvbm5lY3RlZFNzaWQgJiYgbWFwLmhhcyhjb25uZWN0ZWRTc2lkKVxyXG4gICAgICA/IFttYXAuZ2V0KGNvbm5lY3RlZFNzaWQpISwgLi4ub3RoZXJzXVxyXG4gICAgICA6IG90aGVyc1xyXG4gIH1cclxuXHJcbiAgLy8gU2lnbmFsIGljb24gbG9naWNcclxuICBwcml2YXRlIGdldFNpZ25hbExldmVsIChzaWduYWw6IG51bWJlcik6IDEgfCAyIHwgMyB8IDQge1xyXG4gICAgaWYgKHNpZ25hbCA+PSA3NSkgcmV0dXJuIDRcclxuICAgIGlmIChzaWduYWwgPj0gNTApIHJldHVybiAzXHJcbiAgICBpZiAoc2lnbmFsID49IDI1KSByZXR1cm4gMlxyXG4gICAgcmV0dXJuIDFcclxuICB9XHJcblxyXG4gIGdldFdpZmlJY29uTmFtZSAobmV0OiBEZXZpY2VXaWZpKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGx2bCA9IHRoaXMuZ2V0U2lnbmFsTGV2ZWwobmV0LnNpZ25hbClcclxuICAgIGlmIChuZXQuaW5fdXNlKSByZXR1cm4gYCR3aWZpLXN0cmVuZ3RoLSR7bHZsfWBcclxuICAgIGNvbnN0IHNlYyA9IG5ldC5zZWN1cml0eT8udG9Mb3dlckNhc2UoKSB8fCAnJ1xyXG4gICAgY29uc3QgbG9ja1N1ZmZpeCA9ICghc2VjIHx8IHNlYy5pbmNsdWRlcygnb3BlbicpKSA/ICcnIDogJy1sb2NrJ1xyXG4gICAgcmV0dXJuIGAkd2lmaS1zdHJlbmd0aC0ke2x2bH0ke2xvY2tTdWZmaXh9YFxyXG4gIH1cclxuXHJcbiAgZ2V0U2lnbmFsQ29sb3IgKHNpZ25hbDogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGx2bCA9IHRoaXMuZ2V0U2lnbmFsTGV2ZWwoc2lnbmFsKVxyXG4gICAgcmV0dXJuIGx2bCA9PT0gNCA/ICdncmVlbicgOiBsdmwgPT09IDMgPyAnbGltZScgOiBsdmwgPT09IDIgPyAnb3JhbmdlJyA6ICdyZWQnXHJcbiAgfVxyXG5cclxuICAvLyBFeGlzdGluZyBtZW51IHRvZ2dsZVxyXG4gIG9wZW5NZW51IChzc2lkOiBzdHJpbmcpIHtcclxuICAgIE9iamVjdC5rZXlzKHRoaXMubWVudU9wZW4pLmZvckVhY2goayA9PiB7XHJcbiAgICAgIGlmIChrICE9PSBzc2lkKSB0aGlzLm1lbnVPcGVuW2tdID0gZmFsc2VcclxuICAgIH0pXHJcbiAgICB0aGlzLiRzZXQodGhpcy5tZW51T3Blbiwgc3NpZCwgdHJ1ZSlcclxuICB9XHJcblxyXG4gIC8vIFVuY2hhbmdlZCBzaWduYXR1cmUgKnVzYWdlKiwgYnV0IHBhc3MgU1NJRCBub3dcclxuICBvbk5ldHdvcmtDbGljayAobmV0d29yazogRGV2aWNlV2lmaSkge1xyXG4gICAgaWYgKG5ldHdvcmsuaW5fdXNlKSB7XHJcbiAgICAgIHRoaXMub3Blbk1lbnUobmV0d29yay5zc2lkKSAvLyBDSEFOR0VEICh3YXMgbmV0d29yay5ic3NpZClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc2VsZWN0ZWROZXR3b3JrID0gbmV0d29ya1xyXG4gICAgICAvLyBBbHdheXMgYXNrIGZpcnN0LiBGcm9tIHRoZSBMQU4sIHRoZSBwcmludGVyIGxlYXZlcyB0aGUgbmV0d29yayB0aGlzXHJcbiAgICAgIC8vIHBhZ2UgcmVhY2hlcyBpdCBvbi4gT24gdGhlIGhvdHNwb3QgaXQgc2hhcmVzIG9uZSByYWRpbywgc28gam9pbmluZyBhXHJcbiAgICAgIC8vIG5ldHdvcmsgb24gYW5vdGhlciBjaGFubmVsIG1vdmVzIHRoZSBob3RzcG90IGFuZCBkcm9wcyB0aGlzIHBob25lLlxyXG4gICAgICB0aGlzLnNob3dXYXJuaW5nRGlhbG9nID0gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYWNjZXB0V2FybmluZ19sb2FkaW5nID0gZmFsc2VcclxuICBhc3luYyBhY2NlcHRXYXJuaW5nICgpIHtcclxuICAgIHRoaXMuYWNjZXB0V2FybmluZ19sb2FkaW5nID0gdHJ1ZVxyXG4gICAgdGhpcy5zaG93V2FybmluZ0RpYWxvZyA9IGZhbHNlXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0aGlzLnByb21wdE9yQ29ubmVjdCgpXHJcbiAgICB9IGNhdGNoIHtcclxuXHJcbiAgICB9XHJcbiAgICB0aGlzLmFjY2VwdFdhcm5pbmdfbG9hZGluZyA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBhc3luYyBwcm9tcHRPckNvbm5lY3QgKCkge1xyXG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTmV0d29yaykgcmV0dXJuXHJcbiAgICBjb25zdCBzZWMgPSB0aGlzLnNlbGVjdGVkTmV0d29yay5zZWN1cml0eT8udG9Mb3dlckNhc2UoKSB8fCAnJ1xyXG4gICAgaWYgKHRoaXMua25vd25Tc2lkcy5oYXModGhpcy5zZWxlY3RlZE5ldHdvcmsuc3NpZCkpIHtcclxuICAgICAgLy8gQSBzYXZlZCBuZXR3b3JrIGpvaW5zIGJ5IFBPU1QgL3dpZmkvY29ubmVjdCB3aXRoIG5vIHBhc3N3b3JkLiBUaGUgb2xkXHJcbiAgICAgIC8vIC93aWZpL3VwIGlzIHBhbmVsLW9ubHkgb24gYSBwcmludGVyIHdpdGggTXVvbk9TICM0OTIuXHJcbiAgICAgIHRoaXMucGFzc3dvcmQgPSAnJ1xyXG4gICAgICBhd2FpdCB0aGlzLmNvbm5lY3RUb1NlbGVjdGVkKClcclxuICAgICAgdGhpcy5yZWZyZXNoKClcclxuICAgICAgYXdhaXQgdGhpcy5mZXRjaERldmljZXMoKVxyXG4gICAgfSBlbHNlIGlmICghc2VjIHx8IHNlYy5pbmNsdWRlcygnb3BlbicpKSB7XHJcbiAgICAgIHRoaXMuY29ubmVjdFRvU2VsZWN0ZWQoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5wYXNzd29yZCA9ICcnXHJcbiAgICAgIHRoaXMuc2hvd1Bhc3N3b3JkRGlhbG9nID0gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgY29ubmVjdFRvU2VsZWN0ZWQgKCkge1xyXG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTmV0d29yaykgcmV0dXJuXHJcbiAgICB0aGlzLnNob3dQYXNzd29yZERpYWxvZyA9IGZhbHNlXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0aGlzLmF1eEFwaS53aWZpLndpZmlDb25uZWN0V2lmaUNvbm5lY3RQb3N0KHtcclxuICAgICAgICBzc2lkOiB0aGlzLnNlbGVjdGVkTmV0d29yay5zc2lkLFxyXG4gICAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkIHx8IHVuZGVmaW5lZFxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLnRlc3RlZFNzaWRzLmRlbGV0ZSh0aGlzLnNlbGVjdGVkTmV0d29yay5zc2lkKSAvLyBub3cgc2F2ZWQ6IHRoZSBmYWxsYmFjayBtYXkgYXNrIG9uY2UgbW9yZVxyXG4gICAgICBFdmVudEJ1cy4kZW1pdCh0aGlzLiR0KCdhcHAud2lmaS5tc2cuY29ubmVjdC5zdWNjZXNzJykgKyAnICcgKyB0aGlzLnNlbGVjdGVkTmV0d29yay5zc2lkLCB7IHR5cGU6ICdzdWNjZXNzJywgdGltZW91dDogMjAwMCB9KVxyXG4gICAgICBhd2FpdCB0aGlzLmZldGNoRGV2aWNlcygpXHJcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICBjb25zdCBwcm9ibGVtID0gdGhpcy5yZW1vdGUgPyBtYW5hZ2VkTmV0d29ya1Byb2JsZW0oZXJyKSA6IG51bGxcclxuICAgICAgaWYgKHByb2JsZW0pIHtcclxuICAgICAgICB0aGlzLnJvdXRlUHJvYmxlbSA9IHByb2JsZW1cclxuICAgICAgfSBlbHNlIGlmICh0aGlzLnRha2VQZXJtaXNzaW9uUmVmdXNhbChlcnIpKSB7XHJcbiAgICAgICAgLy8gVGhlIHN0b3JlIHJlZnVzZWQgdGhpcyBjYWxsZXI7IHRoZSBub3RpY2Ugc2F5cyB3aG8gbWF5LlxyXG4gICAgICB9IGVsc2UgaWYgKGlzUGFuZWxPbmx5UmVmdXNhbChlcnIpKSB7XHJcbiAgICAgICAgLy8gQW4gb3duZXIgY2FuIHR1cm4gQVVYX05FVFdPUktfU1RSSUNUIG9uLCBhbmQgdGhlbiAvd2lmaS9jb25uZWN0IGlzIHJlZnVzZWQgdG9vLlxyXG4gICAgICAgIEV2ZW50QnVzLiRlbWl0KHBhbmVsT25seU1lc3NhZ2UoJ2pvaW4gYSBuZXR3b3JrJyksIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogODAwMCB9KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIEV2ZW50QnVzLiRlbWl0KGAke3RoaXMuJHQoJ2FwcC53aWZpLm1zZy5jb25uZWN0LmVycm9yJyl9ICR7bW9vbnJha2VyRXJyb3JNZXNzYWdlKGVycil9YCwgeyB0eXBlOiAnZXJyb3InLCB0aW1lb3V0OiA1MDAwIH0pXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEV4aXN0aW5nIGRpc2Nvbm5lY3QgJiBmb3JnZXRcclxuICBnZXQgZGlzY29ubmVjdElzUGFuZWxPbmx5ICgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiByb3V0ZUZvcignZGlzY29ubmVjdCcsIHJlZnVzZWRIZXJlKS5raW5kID09PSAncGFuZWwnXHJcbiAgfVxyXG5cclxuICByZWFkb25seSBwYW5lbE9ubHlOb3RlID0gUEFORUxfT05MWV9OT1RFXHJcblxyXG4gIGFzeW5jIGRpc2Nvbm5lY3QgKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuYXV4QXBpLndpZmkud2lmaURpc2Nvbm5lY3RXaWZpRGlzY29ubmVjdFBvc3QoKVxyXG4gICAgICBpZiAocmVzcC5zdGF0dXMgPT09IDIwMCkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuZmV0Y2hEZXZpY2VzKClcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgY29uc3QgcHJvYmxlbSA9IHRoaXMucmVtb3RlID8gbWFuYWdlZE5ldHdvcmtQcm9ibGVtKGVycikgOiBudWxsXHJcbiAgICAgIGlmIChwcm9ibGVtKSB7XHJcbiAgICAgICAgdGhpcy5yb3V0ZVByb2JsZW0gPSBwcm9ibGVtXHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50YWtlUGVybWlzc2lvblJlZnVzYWwoZXJyKSkge1xyXG4gICAgICAgIC8vIFRoZSBzdG9yZSByZWZ1c2VkIHRoaXMgY2FsbGVyOiBub3QgYSBwYW5lbC1vbmx5IHByaW50ZXIsIHNvIHJlZnVzZWRIZXJlIHN0YXlzIGFzIGl0IHdhcy5cclxuICAgICAgfSBlbHNlIGlmIChpc1BhbmVsT25seVJlZnVzYWwoZXJyKSkge1xyXG4gICAgICAgIC8vIE5vIG9wZW4gcm91dGUgZG9lcyB0aGlzIGpvYjogaXQgaXMgdGhlIHByaW50ZXIncyBzY3JlZW4gbm93LlxyXG4gICAgICAgIHJlZnVzZWRIZXJlLmRpc2Nvbm5lY3QgPSB0cnVlXHJcbiAgICAgICAgRXZlbnRCdXMuJGVtaXQocGFuZWxPbmx5TWVzc2FnZSgnZGlzY29ubmVjdCBmcm9tIGEgbmV0d29yaycpLCB7IHR5cGU6ICdlcnJvcicsIHRpbWVvdXQ6IDgwMDAgfSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBFdmVudEJ1cy4kZW1pdChgJHt0aGlzLiR0KCdhcHAud2lmaS5tc2cuZGlzY29ubmVjdC5lcnJvcicpfSAke21vb25yYWtlckVycm9yTWVzc2FnZShlcnIpfWAsIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogNTAwMCB9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmRpc2Nvbm5lY3RDb25maXJtRGlhbG9nID0gZmFsc2VcclxuICB9XHJcblxyXG4gIC8vIC0tIGZvciB0aGUgcGFnZTogd2hhdCBlYWNoIHJvdyBzYXlzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgLyoqIEluIHRoZSBxdWljayBtZW51LCB0aGUgbmV0d29yayBpdCdzIG9uIGFuZCB0aGUgdGhyZWUgc3Ryb25nZXN0IG90aGVycy4gKi9cclxuICBnZXQgc2hvd25OZXR3b3JrcyAoKTogQWdnV2lmaVtdIHtcclxuICAgIHJldHVybiB0aGlzLmNvbXBhY3QgPyB0aGlzLnNvcnRlZE5ldHdvcmtzLnNsaWNlKDAsIDQpIDogdGhpcy5zb3J0ZWROZXR3b3Jrc1xyXG4gIH1cclxuXHJcbiAgLyoqIFRoZSBwYWdlIGxpc3RzIHRoZSBuZXR3b3JrcyBpdCBpcyBub3Qgb246IHRoZSBvbmUgaXQgaXMgb24gaGFzIGl0cyBvd24gcGxhY2UgYWJvdmUgdGhlIGxpc3QuICovXHJcbiAgZ2V0IG90aGVyTmV0d29ya3MgKCk6IEFnZ1dpZmlbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5zb3J0ZWROZXR3b3Jrcy5maWx0ZXIobiA9PiAhbi5pbl91c2UpXHJcbiAgfVxyXG5cclxuICBnZXQgY29ubmVjdGVkTmV0d29yayAoKTogQWdnV2lmaSB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuc29ydGVkTmV0d29ya3MuZmluZChuID0+IG4uaW5fdXNlKSA/PyBudWxsXHJcbiAgfVxyXG5cclxuICAvKiogQSBoaWRkZW4gbmV0d29yayBoYXMgbm8gbmFtZSB0byBmb3JnZXQgb3IgdG8gam9pbiBieSwgb25seSB0byBsZWF2ZS4gKi9cclxuICBpc0hpZGRlbiAobmV0d29yazogRGV2aWNlV2lmaSk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIG5ldHdvcmsuc3NpZCA9PT0gSElEREVOX05BTUUgJiYgIXRoaXMua25vd25Tc2lkcy5oYXMoSElEREVOX05BTUUpXHJcbiAgfVxyXG5cclxuICAvKiogV2hhdCB0aGUgcm93IHNheXMgdW5kZXIgaXRzIG5hbWUsIGluIHNpZ2h0OiB0aGUgY2hhbm5lbCwgdGhlIHNwZWVkIGFuZCB0aGUgZnJlcXVlbmN5LiAqL1xyXG4gIGRldGFpbCAobmV0d29yazogQWdnV2lmaSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBjaGFuID0gbmV0d29yay5jaGFuTGlzdCB8fCBuZXR3b3JrLmNoYW5cclxuICAgIGNvbnN0IGZyZXEgPSBuZXR3b3JrLmZyZXFMaXN0IHx8IG5ldHdvcmsuZnJlcVxyXG4gICAgcmV0dXJuIFtjaGFuID8gYGNoYW5uZWwgJHtjaGFufWAgOiAnJywgbmV0d29yay5yYXRlID8gYCR7bmV0d29yay5yYXRlfSBNYnBzYCA6ICcnLCBmcmVxID8gYCR7ZnJlcX0gTUh6YCA6ICcnXS5maWx0ZXIoQm9vbGVhbikuam9pbignIMK3ICcpXHJcbiAgfVxyXG5cclxuICAvKiogVGhlIElQdjQgYWRkcmVzcyBvZiB0aGUgV2ktRmkgaW50ZXJmYWNlLCBmcm9tIHRoZSBjb21wdXRlcidzIG93biByZXBvcnQuICovXHJcbiAgZ2V0IHdpZmlJcCAoKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG5ldHdvcmsgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2dldFN5c3RlbUluZm8nXSBhcyB7IG5ldHdvcms/OiBSZWNvcmQ8c3RyaW5nLCB7IGlwX2FkZHJlc3Nlcz86IEFycmF5PHsgZmFtaWx5Pzogc3RyaW5nLCBhZGRyZXNzPzogc3RyaW5nIH0+IH0+IH0gfCBudWxsKT8ubmV0d29ya1xyXG4gICAgcmV0dXJuIGludGVyZmFjZUlwKG5ldHdvcmssIFsnd2xhbicsICd3bCddKT8uaXAgPz8gJydcclxuICB9XHJcblxyXG4gIGdldCBob3N0bmFtZSAoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiAodGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmluZm8/Lmhvc3RuYW1lIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgPz8gJydcclxuICB9XHJcblxyXG4gIHNpZ25hbFRleHQgKHNpZ25hbDogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBzaWduYWxXb3JkKHNpZ25hbClcclxuICB9XHJcblxyXG4gIHNpZ25hbExldmVsIChzaWduYWw6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRTaWduYWxMZXZlbChzaWduYWwpXHJcbiAgfVxyXG5cclxuICByb3dTdGF0ZSAobmV0d29yazogQWdnV2lmaSk6IHN0cmluZyB7XHJcbiAgICBpZiAobmV0d29yay5pbl91c2UpIHJldHVybiAnQ29ubmVjdGVkJ1xyXG4gICAgaWYgKHRoaXMua25vd25Tc2lkcy5oYXMobmV0d29yay5zc2lkKSkgcmV0dXJuICdTYXZlZCDCtyBqb2lucyB3aXRob3V0IGEgcGFzc3dvcmQnXHJcbiAgICByZXR1cm4gbmV0d29yay5zZWN1cml0eSA/IG5ldHdvcmsuc2VjdXJpdHkgOiAnT3BlbidcclxuICB9XHJcblxyXG4gIC8qKiAyLjQgR0h6LCA1IEdIeiwgb3IgYm90aCwgZnJvbSB0aGUgYWNjZXNzIHBvaW50cyBoZWFyZCB1bmRlciB0aGlzIG5hbWUuICovXHJcbiAgYmFuZCAobmV0d29yazogQWdnV2lmaSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBmcmVxcyA9IFN0cmluZyhuZXR3b3JrLmZyZXFMaXN0IHx8IG5ldHdvcmsuZnJlcSkuc3BsaXQoJywnKS5tYXAoZiA9PiBOdW1iZXIoZi50cmltKCkpKS5maWx0ZXIoZiA9PiBmID4gMClcclxuICAgIGNvbnN0IGJhbmRzID0gbmV3IFNldChmcmVxcy5tYXAoZiA9PiAoZiA8IDMwMDAgPyAnMi40JyA6IGYgPCA1OTI1ID8gJzUnIDogJzYnKSkpXHJcbiAgICByZXR1cm4gYmFuZHMuc2l6ZSA/IGAke1suLi5iYW5kc10uc29ydCgpLmpvaW4oJyAmICcpfSBHSHpgIDogJydcclxuICB9XHJcblxyXG4gIG5ldHdvcmtGYWN0cyAobmV0d29yazogQWdnV2lmaSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICBgU2VjdXJpdHk6ICR7bmV0d29yay5zZWN1cml0eSB8fCAnb3Blbid9YCxcclxuICAgICAgYHNpZ25hbCAke25ldHdvcmsuc2lnbmFsfSVgLFxyXG4gICAgICBgJHtuZXR3b3JrLnJhdGV9IE1icHNgLFxyXG4gICAgICBgY2hhbm5lbCAke25ldHdvcmsuY2hhbkxpc3QgfHwgbmV0d29yay5jaGFufWAsXHJcbiAgICAgIGAke25ldHdvcmsuZnJlcUxpc3QgfHwgbmV0d29yay5mcmVxfSBNSHpgXHJcbiAgICBdLmpvaW4oJyDCtyAnKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yZ2V0dGluZyBhc2tzIGZpcnN0LiBGb3IgdGhlIG5ldHdvcmsgdGhpcyBwYWdlIGlzIHJlYWNoZWQgb3ZlciwgaXRcclxuICAgKiBzYXlzIHdoYXQgdGhhdCBjb3N0czogdGhlIHBhZ2UgbWF5IGJlIGxvc3QsIGFuZCB0aGUgcHJpbnRlciBsZWF2ZXMgdGhlIG5ldHdvcmsuXHJcbiAgICovXHJcbiAgYXN5bmMgZm9yZ2V0Q29uZmlybSAobmV0d29yazogRGV2aWNlV2lmaSkge1xyXG4gICAgY29uc3QgdGV4dCA9IG5ldHdvcmsuaW5fdXNlXHJcbiAgICAgID8gJ1lvdSBtYXkgbG9zZSB0aGlzIHBhZ2UsIGFuZCB0aGUgcHJpbnRlciB3aWxsIGRyb3Agb2ZmIHRoaXMgbmV0d29yay4gSXQgd2lsbCBub3QgcmVqb2luIGl0IGJ5IGl0c2VsZiB1bnRpbCB5b3Ugam9pbiBpdCBhZ2Fpbi4nXHJcbiAgICAgIDogJ1RoZSBwcmludGVyIHdpbGwgbm90IGpvaW4gaXQgYnkgaXRzZWxmIGFueSBtb3JlLiBZb3UgY2FuIGpvaW4gaXQgYWdhaW4gd2l0aCBpdHMgcGFzc3dvcmQuJ1xyXG4gICAgY29uc3QgeWVzID0gYXdhaXQgdGhpcy4kY29uZmlybSh0ZXh0LCB7IHRpdGxlOiBgRm9yZ2V0ICR7bmV0d29yay5zc2lkfT9gLCBidXR0b25UcnVlVGV4dDogJ0ZvcmdldCcsIGRhbmdlcjogdHJ1ZSB9KVxyXG4gICAgaWYgKHllcykgYXdhaXQgdGhpcy5mb3JnZXQobmV0d29yaylcclxuICB9XHJcblxyXG4gIGFzeW5jIGZvcmdldCAobmV0d29yazogRGV2aWNlV2lmaSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgdGhpcy5hdXhBcGkud2lmaS53aWZpRm9yZ2V0V2lmaUZvcmdldERlbGV0ZShuZXR3b3JrLnNzaWQpXHJcbiAgICAgIHRoaXMua25vd25Tc2lkcy5kZWxldGUobmV0d29yay5zc2lkKVxyXG4gICAgICB0aGlzLnRlc3RlZFNzaWRzLmRlbGV0ZShuZXR3b3JrLnNzaWQpXHJcbiAgICAgIGF3YWl0IHRoaXMuZmV0Y2hEZXZpY2VzKClcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRm9yZ2V0IGZhaWxlZCcsIGUpXHJcbiAgICAgIGNvbnN0IHByb2JsZW0gPSB0aGlzLnJlbW90ZSA/IG1hbmFnZWROZXR3b3JrUHJvYmxlbShlKSA6IG51bGxcclxuICAgICAgaWYgKHByb2JsZW0pIHRoaXMucm91dGVQcm9ibGVtID0gcHJvYmxlbVxyXG4gICAgICBlbHNlIGlmICghdGhpcy50YWtlUGVybWlzc2lvblJlZnVzYWwoZSkpIEV2ZW50QnVzLiRlbWl0KGBDb3VsZCBub3QgZm9yZ2V0ICR7bmV0d29yay5zc2lkfS4gJHttb29ucmFrZXJFcnJvck1lc3NhZ2UoZSl9YCwgeyB0eXBlOiAnZXJyb3InLCB0aW1lb3V0OiA1MDAwIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxyXG4gIC53ZiB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICAgIGdhcDogMTRweDtcclxuICAgIG1pbi13aWR0aDogMDtcclxuICAgIHBhZGRpbmc6IDIwcHg7XHJcbiAgICBib3JkZXItcmFkaXVzOiAyMnB4O1xyXG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xyXG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcclxuICB9XHJcblxyXG4gIC8vIE9uIHRoZSBwYWdlIHRoZSBjYXJkIGlzIG5vdCBhIGJveDogaXRzIHRpbGVzIHNpdCBpbiB0aGUgcGFnZSdzIGdyaWQuXHJcbiAgLndmLS1wYWdlIHtcclxuICAgIGRpc3BsYXk6IGNvbnRlbnRzO1xyXG4gIH1cclxuXHJcbiAgLndmX19ub3cge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XHJcbiAgICBnYXA6IDE0cHg7XHJcbiAgfVxyXG5cclxuICAud2ZfX25vdy1pY28ge1xyXG4gICAgd2lkdGg6IDQ4cHg7XHJcbiAgICBoZWlnaHQ6IDQ4cHg7XHJcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQpO1xyXG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xyXG4gIH1cclxuXHJcbiAgLndmX19ub3ctbmFtZSB7XHJcbiAgICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcclxuICAgIGZvbnQtc2l6ZTogMjRweDtcclxuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XHJcbiAgfVxyXG5cclxuICAud2ZfX2t2IHtcclxuICAgIGRpc3BsYXk6IGdyaWQ7XHJcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7XHJcbiAgICBnYXA6IDEycHggMTZweDtcclxuICAgIG1hcmdpbjogMDtcclxuXHJcbiAgICBkdCB7XHJcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIH1cclxuXHJcbiAgICBkZCB7XHJcbiAgICAgIG1hcmdpbjogMDtcclxuICAgICAgZm9udC1zaXplOiAxNXB4O1xyXG4gICAgICBmb250LXdlaWdodDogNjAwO1xyXG4gICAgICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC53Zl9fbW9ubyB7XHJcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgbW9ub3NwYWNlKTtcclxuICB9XHJcblxyXG4gIC53Zl9fbm93LWFjdHMge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGZsZXgtd3JhcDogd3JhcDtcclxuICAgIGdhcDogMTBweDtcclxuICB9XHJcblxyXG4gIC53Zl9fZW1wdHkge1xyXG4gICAgcGFkZGluZzogMTJweCAwO1xyXG4gIH1cclxuXHJcbiAgLndmX19uZXQgLnNyb3dfX2FjdCB7XHJcbiAgICBnYXA6IDE2cHg7XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgY29ubmVjdGVkIG5ldHdvcmsgaXMgdGhlIHRpbnRlZCB0b3Agcm93IG9mIHRoZSBzYW1lIGNhcmQ7IHRoZSBvdGhlcnMgc2l0IHVuZGVyIGl0LlxyXG4gIC53Zl9fY29ubmVjdGVkLS1vbiB7XHJcbiAgICBwYWRkaW5nOiAxNHB4IDE2cHg7XHJcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xyXG4gICAgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1hY2NlbnQpIDEyJSwgdmFyKC0tbTNkLXN1cmZhY2UtMikpO1xyXG4gIH1cclxuXHJcbiAgLndmX19ncm91cC10aXRsZSB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lO1xyXG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xyXG4gICAgZ2FwOiAxMnB4O1xyXG4gIH1cclxuXHJcbiAgLndmX19mb3VuZCB7XHJcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcclxuICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XHJcbiAgfVxyXG5cclxuICAud2ZfX2RldGFpbCB7XHJcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcclxuICB9XHJcblxyXG4gIC53Zl9fbmV0IC53Zl9fYmFycyB7XHJcbiAgICB3aWR0aDogMjRweDtcclxuICAgIGhlaWdodDogMjBweDtcclxuICB9XHJcblxyXG4gIC53Zi0tY29tcGFjdCB7XHJcbiAgICBnYXA6IDZweDtcclxuICAgIHBhZGRpbmc6IDRweCAwO1xyXG4gICAgYm9yZGVyLXJhZGl1czogMDtcclxuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xyXG5cclxuICAgIC53Zl9fdGl0bGVzIGgyIHtcclxuICAgICAgZm9udC1zaXplOiAxNHB4O1xyXG4gICAgfVxyXG5cclxuICAgIC53Zl9fcm93IHtcclxuICAgICAgbWluLWhlaWdodDogNDRweDtcclxuICAgIH1cclxuXHJcbiAgICAud2ZfX25hbWUgYiB7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC53Zl9faGVhZCB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcclxuICAgIGdhcDogMTJweDtcclxuICB9XHJcblxyXG4gIC53Zl9fdGl0bGVzIHtcclxuICAgIG1pbi13aWR0aDogMDtcclxuXHJcbiAgICBoMiB7XHJcbiAgICAgIG1hcmdpbjogMDtcclxuICAgICAgZm9udC1zaXplOiAxN3B4O1xyXG4gICAgICBmb250LXdlaWdodDogNjAwO1xyXG4gICAgfVxyXG5cclxuICAgIHAge1xyXG4gICAgICBtYXJnaW46IDJweCAwIDA7XHJcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC53Zl9fcmVmcmVzaCB7XHJcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcclxuICAgIHBhZGRpbmc6IDhweDtcclxuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XHJcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xyXG5cclxuICAgICY6aG92ZXI6bm90KDpkaXNhYmxlZCkge1xyXG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcclxuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICAmOmRpc2FibGVkIHtcclxuICAgICAgb3BhY2l0eTogMC40NTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC53Zl9fbm90ZSB7XHJcbiAgICBtYXJnaW46IDA7XHJcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xyXG4gICAgZm9udC1zaXplOiAxNHB4O1xyXG4gIH1cclxuXHJcbiAgLndmX19ub3RlLS1wYWQge1xyXG4gICAgcGFkZGluZzogMTJweCA0cHg7XHJcbiAgfVxyXG5cclxuICAud2ZfX2xpc3Qge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcblxyXG4gICAgPiAud2ZfX3JvdyArIC53Zl9fcm93IHtcclxuICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLndmX19yb3cge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XHJcbiAgICBnYXA6IDEycHg7XHJcbiAgICBtaW4taGVpZ2h0OiA1NnB4O1xyXG4gIH1cclxuXHJcbiAgLndmX19yb3ctLW9uIC53Zl9fbmFtZSBiIHtcclxuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcclxuICB9XHJcblxyXG4gIC53Zl9fbWFpbiB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgZmxleDogMSAxIGF1dG87XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgZ2FwOiAxMnB4O1xyXG4gICAgbWluLXdpZHRoOiAwO1xyXG4gICAgcGFkZGluZzogNnB4IDA7XHJcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xyXG4gICAgdGV4dC1hbGlnbjogbGVmdDtcclxuICB9XHJcblxyXG4gIC53Zl9fYmFycyB7XHJcbiAgICBmbGV4OiBub25lO1xyXG4gICAgd2lkdGg6IDIwcHg7XHJcbiAgICBoZWlnaHQ6IDE2cHg7XHJcblxyXG4gICAgcmVjdCB7XHJcbiAgICAgIGZpbGw6IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTtcclxuICAgIH1cclxuXHJcbiAgICAud2ZfX2Jhci0tb24ge1xyXG4gICAgICBmaWxsOiB2YXIoLS1tM2QtdGV4dCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAud2ZfX25hbWUge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICBtaW4td2lkdGg6IDA7XHJcblxyXG4gICAgYiB7XHJcbiAgICAgIG92ZXJmbG93OiBoaWRkZW47XHJcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcclxuICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XHJcbiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbiAgICB9XHJcblxyXG4gICAgc3BhbiB7XHJcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XHJcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC53Zl9fZmFjdHMge1xyXG4gICAgZmxleDogbm9uZTtcclxuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xyXG4gICAgZm9udC1zaXplOiAxMnB4O1xyXG4gIH1cclxuXHJcbiAgLndmX19hY3Rpb25zIHtcclxuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xyXG4gICAgZmxleDogbm9uZTtcclxuICAgIGdhcDogMTJweDtcclxuICB9XHJcblxyXG4gIC53Zl9fbGluayB7XHJcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XHJcbiAgICBmb250LXNpemU6IDEzcHg7XHJcbiAgICBmb250LXdlaWdodDogNjAwO1xyXG4gIH1cclxuXHJcbiAgLndmX19saW5rLS1kYW5nZXIge1xyXG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xyXG4gIH1cclxuXHJcbiAgLndmX19kaWFsb2cge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICBnYXA6IDEycHg7XHJcbiAgICBwYWRkaW5nOiAyMnB4O1xyXG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcclxuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcclxuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XHJcblxyXG4gICAgaDMge1xyXG4gICAgICBtYXJnaW46IDA7XHJcbiAgICAgIGZvbnQtc2l6ZTogMThweDtcclxuICAgIH1cclxuXHJcbiAgICBwIHtcclxuICAgICAgbWFyZ2luOiAwO1xyXG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xyXG4gICAgICBmb250LXNpemU6IDE0cHg7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAud2ZfX2J1dHRvbnMge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XHJcbiAgICBnYXA6IDhweDtcclxuICB9XHJcbjwvc3R5bGU+XHJcbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvd2lmaS9XaWZpTWFuYWdlckNhcmQudnVlIn0=