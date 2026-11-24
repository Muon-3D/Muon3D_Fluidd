/* unplugin-vue-components disabled */import __unplugin_components_11 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_9 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_8 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_7 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_4 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppBtn.vue";
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
import { Component, Prop, VModel, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import SetupStepCard from "/src/components/muon-setup/SetupStepCard.vue";
import BluetoothSheet from "/src/components/muon-ble/BluetoothSheet.vue";
import BluetoothCodeBoxes from "/src/components/muon-ble/BluetoothCodeBoxes.vue";
import BluetoothPrinterRow from "/src/components/muon-ble/BluetoothPrinterRow.vue";
import SetupWifiSteps from "/src/components/muon-setup/SetupWifiSteps.vue";
import { connectForSetup } from "/src/services/muon-ble/setup.ts";
import { afterSetupRefusal } from "/src/services/muon-ble/setupOffer.ts";
import { createSetupClient } from "/src/services/muon-setup/client.ts";
import { applyState, resetSetupState, setLocal, setupState } from "/src/services/muon-setup/state.ts";
let BluetoothSetupDialog = class extends Vue {
  open;
  printer;
  connector;
  phase = "connecting";
  /** An update was started over this link: the printer restarts and the link ends. */
  installing = false;
  updateRestart = false;
  failure = null;
  code = "";
  client = null;
  session = null;
  /** Bumped by every attempt, so a late answer from an earlier one is dropped. */
  attempt = 0;
  get printerName() {
    return this.printer.display || this.printer.localName || "Printer";
  }
  /** "Walnut", as the screens say it. */
  get shortName() {
    return this.printerName.split(" \xB7 ")[0];
  }
  get hotspotName() {
    return this.printer.localName ? `Muon-${this.printer.localName}` : "Muon-\u2026";
  }
  get step() {
    if (this.phase === "setup") return setupState.state?.state === "complete" ? 3 : 2;
    return this.phase === "lost" ? 2 : 1;
  }
  get joinedWifi() {
    const network = setupState.state?.steps.network;
    return network && network.addresses.length ? network.ssid ?? "its network" : null;
  }
  created() {
    this.connect();
  }
  destroyed() {
    this.hangUp();
  }
  onOpen(value) {
    if (!value) this.hangUp();
  }
  async connect() {
    await this.hangUp();
    const attempt = ++this.attempt;
    this.installing = false;
    this.updateRestart = false;
    this.phase = "connecting";
    this.failure = null;
    const result = await this.connector(this.printer);
    if (attempt !== this.attempt) {
      if (result.ok) result.session.close();
      return;
    }
    if (!result.ok) {
      if (afterSetupRefusal(this.printer, result.reason) === "pair") return this.pairInstead();
      this.failure = result.reason;
      this.phase = "failed";
      return;
    }
    const session = result.session;
    this.session = session;
    this.code = session.code;
    resetSetupState();
    setLocal({ droveSetup: false, changingWifi: false, joinRev: null });
    applyState(session.state, { fromGet: true });
    const client = createSetupClient({ transport: session.transport, overBluetooth: true });
    this.client = client;
    client.start();
    this.phase = "compare";
    session.closed.then(() => this.onDropped(attempt));
  }
  /** The other ways in: the printer's own Wi-Fi, or the QR code on its screen. Hangs up first. */
  async useOtherWay() {
    await this.hangUp();
    this.phase = "hotspot";
  }
  theyMatch() {
    this.phase = "setup";
  }
  async theyDiffer() {
    await this.hangUp();
    this.phase = "mismatch";
  }
  /** muon-link hangs a setup session up when setup completes, or the radio went. */
  onDropped(attempt) {
    if (attempt !== this.attempt || !this.session) return;
    this.client?.stop();
    this.session = null;
    if (this.phase !== "compare" && this.phase !== "setup") return;
    this.updateRestart = this.installing || setupState.state?.op?.kind === "update_install";
    this.phase = setupState.state?.state === "complete" ? "setup" : "lost";
  }
  async hangUp() {
    this.attempt++;
    this.client?.stop();
    const session = this.session;
    this.session = null;
    await session?.close().catch(() => {
    });
  }
  finish() {
    this.open = false;
    this.$emit("finished");
  }
  /** Hangs up this setup attempt, then hands the printer to the pairing way in. */
  async pairInstead() {
    await this.hangUp();
    this.open = false;
    this.$emit("pair", this.printer);
  }
};
__decorateClass([
  VModel({ type: Boolean })
], BluetoothSetupDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: Object, required: true })
], BluetoothSetupDialog.prototype, "printer", 2);
__decorateClass([
  Prop({ type: Function, default: connectForSetup })
], BluetoothSetupDialog.prototype, "connector", 2);
__decorateClass([
  Watch("open")
], BluetoothSetupDialog.prototype, "onOpen", 1);
BluetoothSetupDialog = __decorateClass([
  Component({ components: { BluetoothSheet, BluetoothCodeBoxes, BluetoothPrinterRow, SetupStepCard, SetupWifiSteps } })
], BluetoothSetupDialog);
const _sfc_main = BluetoothSetupDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("bluetooth-sheet", { attrs: { "value": _vm.open, "step": _vm.step, "persistent": _vm.phase === "connecting" || _vm.phase === "setup", "label": "Set up over Bluetooth", "close-tid": "ble-setup-close" }, on: { "close": function($event) {
    _vm.open = false;
  } } }, [_vm.phase === "connecting" ? _c("div", { attrs: { "data-tid": "setup-ble-connecting" } }, [_c("setup-step-card", { attrs: { "flat": "", "title": "Find your printer", "sub": "Turn the printer on and keep it within a few metres of this device." }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_0, { staticClass: "setup-step__back", attrs: { "text": "", "data-tid": "ble-use-other" }, on: { "click": _vm.useOtherWay } }, [_vm._v(" Use the network or a code instead ")])];
  }, proxy: true }], null, false, 3954566399) }, [_c("bluetooth-printer-row", { attrs: { "name": _vm.printerName, "line": "New, not set up", "busy": "Connecting\u2026" } }), _c("p", { staticClass: "muon-ble-setup__body muon-ble-setup__after" }, [_vm._v(" This computer stays on its own network and talks to " + _vm._s(_vm.shortName) + " over Bluetooth. ")])], 1)], 1) : _vm.phase === "compare" ? _c("div", { attrs: { "data-tid": "setup-ble-compare" } }, [_c("setup-step-card", { attrs: { "flat": "", "title": "Check the code", "sub": `${_vm.shortName}'s screen shows six characters. They must be the same as these.` }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_1, { attrs: { "text": "", "data-tid": "ble-sas-mismatch" }, on: { "click": _vm.theyDiffer } }, [_vm._v(" They don't match ")]), _c(__unplugin_components_2, { attrs: { "color": "primary", "data-tid": "ble-sas-match" }, on: { "click": _vm.theyMatch } }, [_vm._v(" They match ")])];
  }, proxy: true }]) }, [_c("bluetooth-code-boxes", { attrs: { "code": _vm.code, "data-tid": "ble-sas" } })], 1)], 1) : _vm.phase === "mismatch" ? _c("div", { attrs: { "data-tid": "setup-ble-mismatch" } }, [_c("setup-step-card", { attrs: { "flat": "", "title": "That wasn't your printer", "sub": "The codes were different, so this page hung up and sent nothing." }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_3, { attrs: { "text": "" }, on: { "click": _vm.connect } }, [_vm._v(" Try Bluetooth again ")]), _c(__unplugin_components_4, { attrs: { "color": "primary" }, on: { "click": function($event) {
      _vm.phase = "hotspot";
    } } }, [_vm._v(" Use its Wi-Fi instead ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "muon-ble-setup__body" }, [_vm._v(" Set " + _vm._s(_vm.shortName) + " up through its own Wi-Fi instead, where what answers over Bluetooth doesn't matter. ")])])], 1) : _vm.phase === "failed" ? _c("div", { attrs: { "data-tid": "setup-ble-failed" } }, [_c("setup-step-card", { attrs: { "flat": "", "title": _vm.failure === "set-up" ? `${_vm.shortName} is set up already` : _vm.failure === "unsupported" ? `This page can't set printers up over Bluetooth yet` : `Couldn't reach ${_vm.shortName}` }, scopedSlots: _vm._u([_vm.failure === "set-up" && _vm.printer.endpointId ? { key: "footer", fn: function() {
    return [_c(__unplugin_components_5, { attrs: { "color": "primary", "data-tid": "ble-pair-instead" }, on: { "click": _vm.pairInstead } }, [_vm._v(" Pair over Bluetooth ")])];
  }, proxy: true } : _vm.failure !== "set-up" ? { key: "footer", fn: function() {
    return [_c(__unplugin_components_6, { attrs: { "text": _vm.failure !== "unsupported", "color": _vm.failure === "unsupported" ? "primary" : void 0, "data-tid": "ble-use-wifi" }, on: { "click": function($event) {
      _vm.phase = "hotspot";
    } } }, [_vm._v(" Use its Wi-Fi instead ")]), _vm.failure !== "unsupported" ? _c(__unplugin_components_7, { attrs: { "color": "primary", "data-tid": "ble-retry" }, on: { "click": _vm.connect } }, [_vm._v(" Try again ")]) : _vm._e()];
  }, proxy: true } : null], null, true) }, [_c("p", { staticClass: "muon-ble-setup__body" }, [_vm.failure === "set-up" ? [_vm._v(" " + _vm._s(_vm.shortName) + " only takes a new connection over Bluetooth before it is set up. Join the network it's on, or link it to your account at the printer. ")] : _vm.failure === "unsupported" ? [_vm._v(" The Muon3D console hasn't been updated for Bluetooth yet. Use " + _vm._s(_vm.shortName) + "'s Wi-Fi instead. ")] : _vm.failure === "busy" ? [_vm._v(" Another device is connected to " + _vm._s(_vm.shortName) + ". Try again once it has finished, or use " + _vm._s(_vm.shortName) + "'s Wi-Fi instead. ")] : [_vm._v(" " + _vm._s(_vm.shortName) + " stopped answering over Bluetooth. Bring this computer closer, or use " + _vm._s(_vm.shortName) + "'s Wi-Fi instead. ")]], 2)])], 1) : _vm.phase === "hotspot" ? _c("div", { attrs: { "data-tid": "setup-ble-hotspot" } }, [_c("setup-step-card", { attrs: { "flat": "", "title": `Set ${_vm.shortName} up on its Wi-Fi`, "sub": `Or scan the QR code on ${_vm.shortName}'s screen with the Muon3D app.` } }, [_c("ol", { staticClass: "muon-ble-setup__steps" }, [_c("li", [_vm._v("Join the Wi-Fi network "), _c("strong", [_vm._v(_vm._s(_vm.hotspotName))]), _vm._v(" on this computer.")]), _c("li", [_vm._v("Open "), _c("strong", [_vm._v("http://10.42.0.1/setup")]), _vm._v(".")])])])], 1) : _vm.phase === "setup" && _vm.client ? _c("div", { attrs: { "data-tid": "setup-ble-steps" } }, [_c("setup-wifi-steps", { attrs: { "client": _vm.client, "over-bluetooth": "" }, on: { "installing": function($event) {
    _vm.installing = true;
  } }, scopedSlots: _vm._u([{ key: "done", fn: function() {
    return [_c("p", { staticClass: "muon-ble-setup__body" }, [_vm._v(" " + _vm._s(_vm.shortName) + " is on its Wi-Fi. Search again to open it from this page. ")]), _c(__unplugin_components_8, { attrs: { "color": "primary" }, on: { "click": _vm.finish } }, [_vm._v(" Back to the list ")])];
  }, proxy: true }, { key: "elsewhere", fn: function() {
    return [_c(__unplugin_components_9, { attrs: { "text": "" }, on: { "click": _vm.finish } }, [_vm._v(" Back to the list ")])];
  }, proxy: true }]) })], 1) : _vm.phase === "lost" ? _c("div", { attrs: { "data-tid": "setup-ble-lost" } }, [_c("setup-step-card", { attrs: { "flat": "", "title": _vm.updateRestart ? `${_vm.shortName} is restarting to finish its update` : `The Bluetooth connection to ${_vm.shortName} dropped` }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_10, { attrs: { "text": "" }, on: { "click": _vm.finish } }, [_vm._v(" Back to the list ")]), !_vm.joinedWifi && !_vm.updateRestart ? _c(__unplugin_components_11, { attrs: { "color": "primary" }, on: { "click": _vm.connect } }, [_vm._v(" Try again ")]) : _vm._e()];
  }, proxy: true }]) }, [_c("p", { staticClass: "muon-ble-setup__body" }, [_vm.updateRestart ? [_vm._v(" The Bluetooth link ends while it restarts. Carry on at its screen, or search again in a few minutes to find it. ")] : _vm.joinedWifi ? [_vm._v(" " + _vm._s(_vm.shortName) + " is on " + _vm._s(_vm.joinedWifi) + ". Search again to find it there, or carry on at its screen. ")] : [_vm._v(" Bring this computer closer and try again, or use " + _vm._s(_vm.shortName) + "'s Wi-Fi instead. ")]], 2)])], 1) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-ble/BluetoothSetupDialog.vue?vue&type=style&index=0&scoped=1a8d60aa&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "1a8d60aa",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-ble/BluetoothSetupDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQWdCQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUF0SUE7QUFBQSxFQURBO0FBQUEsR0FEQSxxQkFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEscUJBS0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQVJBLHFCQVNBO0FBNkNBO0FBQUEsRUFEQTtBQUFBLEdBckRBLHFCQXNEQTtBQXREQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJCbHVldG9vdGhTZXR1cERpYWxvZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8Ymx1ZXRvb3RoLXNoZWV0XG4gICAgOnZhbHVlPVwib3BlblwiXG4gICAgOnN0ZXA9XCJzdGVwXCJcbiAgICA6cGVyc2lzdGVudD1cInBoYXNlID09PSAnY29ubmVjdGluZycgfHwgcGhhc2UgPT09ICdzZXR1cCdcIlxuICAgIGxhYmVsPVwiU2V0IHVwIG92ZXIgQmx1ZXRvb3RoXCJcbiAgICBjbG9zZS10aWQ9XCJibGUtc2V0dXAtY2xvc2VcIlxuICAgIEBjbG9zZT1cIm9wZW4gPSBmYWxzZVwiXG4gID5cbiAgICA8IS0tIHNldHVwLWJsZS1jb25uZWN0aW5nIC0tPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJwaGFzZSA9PT0gJ2Nvbm5lY3RpbmcnXCJcbiAgICAgIGRhdGEtdGlkPVwic2V0dXAtYmxlLWNvbm5lY3RpbmdcIlxuICAgID5cbiAgICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgICAgZmxhdFxuICAgICAgICB0aXRsZT1cIkZpbmQgeW91ciBwcmludGVyXCJcbiAgICAgICAgc3ViPVwiVHVybiB0aGUgcHJpbnRlciBvbiBhbmQga2VlcCBpdCB3aXRoaW4gYSBmZXcgbWV0cmVzIG9mIHRoaXMgZGV2aWNlLlwiXG4gICAgICA+XG4gICAgICAgIDxibHVldG9vdGgtcHJpbnRlci1yb3dcbiAgICAgICAgICA6bmFtZT1cInByaW50ZXJOYW1lXCJcbiAgICAgICAgICBsaW5lPVwiTmV3LCBub3Qgc2V0IHVwXCJcbiAgICAgICAgICBidXN5PVwiQ29ubmVjdGluZ+KAplwiXG4gICAgICAgIC8+XG4gICAgICAgIDxwIGNsYXNzPVwibXVvbi1ibGUtc2V0dXBfX2JvZHkgbXVvbi1ibGUtc2V0dXBfX2FmdGVyXCI+XG4gICAgICAgICAgVGhpcyBjb21wdXRlciBzdGF5cyBvbiBpdHMgb3duIG5ldHdvcmsgYW5kIHRhbGtzIHRvIHt7IHNob3J0TmFtZSB9fSBvdmVyIEJsdWV0b290aC5cbiAgICAgICAgPC9wPlxuICAgICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgY2xhc3M9XCJzZXR1cC1zdGVwX19iYWNrXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiYmxlLXVzZS1vdGhlclwiXG4gICAgICAgICAgICBAY2xpY2s9XCJ1c2VPdGhlcldheVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVXNlIHRoZSBuZXR3b3JrIG9yIGEgY29kZSBpbnN0ZWFkXG4gICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIHNldHVwLWJsZS1jb21wYXJlIC0tPlxuICAgIDxkaXZcbiAgICAgIHYtZWxzZS1pZj1cInBoYXNlID09PSAnY29tcGFyZSdcIlxuICAgICAgZGF0YS10aWQ9XCJzZXR1cC1ibGUtY29tcGFyZVwiXG4gICAgPlxuICAgICAgPHNldHVwLXN0ZXAtY2FyZFxuICAgICAgICBmbGF0XG4gICAgICAgIHRpdGxlPVwiQ2hlY2sgdGhlIGNvZGVcIlxuICAgICAgICA6c3ViPVwiYCR7c2hvcnROYW1lfSdzIHNjcmVlbiBzaG93cyBzaXggY2hhcmFjdGVycy4gVGhleSBtdXN0IGJlIHRoZSBzYW1lIGFzIHRoZXNlLmBcIlxuICAgICAgPlxuICAgICAgICA8Ymx1ZXRvb3RoLWNvZGUtYm94ZXNcbiAgICAgICAgICA6Y29kZT1cImNvZGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiYmxlLXNhc1wiXG4gICAgICAgIC8+XG4gICAgICAgIDx0ZW1wbGF0ZSAjZm9vdGVyPlxuICAgICAgICAgIDx2LWJ0blxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgZGF0YS10aWQ9XCJibGUtc2FzLW1pc21hdGNoXCJcbiAgICAgICAgICAgIEBjbGljaz1cInRoZXlEaWZmZXJcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFRoZXkgZG9uJ3QgbWF0Y2hcbiAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJibGUtc2FzLW1hdGNoXCJcbiAgICAgICAgICAgIEBjbGljaz1cInRoZXlNYXRjaFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVGhleSBtYXRjaFxuICAgICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDwvc2V0dXAtc3RlcC1jYXJkPlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSBzZXR1cC1ibGUtbWlzbWF0Y2ggLS0+XG4gICAgPGRpdlxuICAgICAgdi1lbHNlLWlmPVwicGhhc2UgPT09ICdtaXNtYXRjaCdcIlxuICAgICAgZGF0YS10aWQ9XCJzZXR1cC1ibGUtbWlzbWF0Y2hcIlxuICAgID5cbiAgICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgICAgZmxhdFxuICAgICAgICB0aXRsZT1cIlRoYXQgd2Fzbid0IHlvdXIgcHJpbnRlclwiXG4gICAgICAgIHN1Yj1cIlRoZSBjb2RlcyB3ZXJlIGRpZmZlcmVudCwgc28gdGhpcyBwYWdlIGh1bmcgdXAgYW5kIHNlbnQgbm90aGluZy5cIlxuICAgICAgPlxuICAgICAgICA8cCBjbGFzcz1cIm11b24tYmxlLXNldHVwX19ib2R5XCI+XG4gICAgICAgICAgU2V0IHt7IHNob3J0TmFtZSB9fSB1cCB0aHJvdWdoIGl0cyBvd24gV2ktRmkgaW5zdGVhZCwgd2hlcmUgd2hhdCBhbnN3ZXJzIG92ZXIgQmx1ZXRvb3RoXG4gICAgICAgICAgZG9lc24ndCBtYXR0ZXIuXG4gICAgICAgIDwvcD5cbiAgICAgICAgPHRlbXBsYXRlICNmb290ZXI+XG4gICAgICAgICAgPHYtYnRuXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICBAY2xpY2s9XCJjb25uZWN0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBUcnkgQmx1ZXRvb3RoIGFnYWluXG4gICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgICAgIEBjbGljaz1cInBoYXNlID0gJ2hvdHNwb3QnXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBVc2UgaXRzIFdpLUZpIGluc3RlYWRcbiAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L3NldHVwLXN0ZXAtY2FyZD5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0gc2V0dXAtYmxlLWZhaWxlZCwgYW5kIHRoZSBvdGhlciByZWFzb25zIGEgc2Vzc2lvbiBkaWQgbm90IHN0YXJ0IC0tPlxuICAgIDxkaXZcbiAgICAgIHYtZWxzZS1pZj1cInBoYXNlID09PSAnZmFpbGVkJ1wiXG4gICAgICBkYXRhLXRpZD1cInNldHVwLWJsZS1mYWlsZWRcIlxuICAgID5cbiAgICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgICAgZmxhdFxuICAgICAgICA6dGl0bGU9XCJmYWlsdXJlID09PSAnc2V0LXVwJyA/IGAke3Nob3J0TmFtZX0gaXMgc2V0IHVwIGFscmVhZHlgIDogZmFpbHVyZSA9PT0gJ3Vuc3VwcG9ydGVkJ1xuICAgICAgICAgID8gYFRoaXMgcGFnZSBjYW4ndCBzZXQgcHJpbnRlcnMgdXAgb3ZlciBCbHVldG9vdGggeWV0YCA6IGBDb3VsZG4ndCByZWFjaCAke3Nob3J0TmFtZX1gXCJcbiAgICAgID5cbiAgICAgICAgPHAgY2xhc3M9XCJtdW9uLWJsZS1zZXR1cF9fYm9keVwiPlxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiZmFpbHVyZSA9PT0gJ3NldC11cCdcIj5cbiAgICAgICAgICAgIHt7IHNob3J0TmFtZSB9fSBvbmx5IHRha2VzIGEgbmV3IGNvbm5lY3Rpb24gb3ZlciBCbHVldG9vdGggYmVmb3JlIGl0IGlzIHNldCB1cC4gSm9pbiB0aGVcbiAgICAgICAgICAgIG5ldHdvcmsgaXQncyBvbiwgb3IgbGluayBpdCB0byB5b3VyIGFjY291bnQgYXQgdGhlIHByaW50ZXIuXG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICA8dGVtcGxhdGUgdi1lbHNlLWlmPVwiZmFpbHVyZSA9PT0gJ3Vuc3VwcG9ydGVkJ1wiPlxuICAgICAgICAgICAgVGhlIE11b24zRCBjb25zb2xlIGhhc24ndCBiZWVuIHVwZGF0ZWQgZm9yIEJsdWV0b290aCB5ZXQuIFVzZSB7eyBzaG9ydE5hbWUgfX0ncyBXaS1GaVxuICAgICAgICAgICAgaW5zdGVhZC5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2UtaWY9XCJmYWlsdXJlID09PSAnYnVzeSdcIj5cbiAgICAgICAgICAgIEFub3RoZXIgZGV2aWNlIGlzIGNvbm5lY3RlZCB0byB7eyBzaG9ydE5hbWUgfX0uIFRyeSBhZ2FpbiBvbmNlIGl0IGhhcyBmaW5pc2hlZCwgb3IgdXNlXG4gICAgICAgICAgICB7eyBzaG9ydE5hbWUgfX0ncyBXaS1GaSBpbnN0ZWFkLlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgICAgICAgIHt7IHNob3J0TmFtZSB9fSBzdG9wcGVkIGFuc3dlcmluZyBvdmVyIEJsdWV0b290aC4gQnJpbmcgdGhpcyBjb21wdXRlciBjbG9zZXIsIG9yIHVzZVxuICAgICAgICAgICAge3sgc2hvcnROYW1lIH19J3MgV2ktRmkgaW5zdGVhZC5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8L3A+XG4gICAgICAgIDx0ZW1wbGF0ZVxuICAgICAgICAgIHYtaWY9XCJmYWlsdXJlID09PSAnc2V0LXVwJyAmJiBwcmludGVyLmVuZHBvaW50SWRcIlxuICAgICAgICAgICNmb290ZXJcbiAgICAgICAgPlxuICAgICAgICAgIDwhLS0gU2V0IHVwIGFscmVhZHk6IG5vdCBmb3Igc2V0dXAsIGJ1dCB0aGlzIGJyb3dzZXIgY2FuIHBhaXIgd2l0aCBpdCBvdmVyIEJsdWV0b290aCwgc2lnbmVkIGluIG9yIG5vdC4gLS0+XG4gICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImJsZS1wYWlyLWluc3RlYWRcIlxuICAgICAgICAgICAgQGNsaWNrPVwicGFpckluc3RlYWRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFBhaXIgb3ZlciBCbHVldG9vdGhcbiAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDx0ZW1wbGF0ZVxuICAgICAgICAgIHYtZWxzZS1pZj1cImZhaWx1cmUgIT09ICdzZXQtdXAnXCJcbiAgICAgICAgICAjZm9vdGVyXG4gICAgICAgID5cbiAgICAgICAgICA8di1idG5cbiAgICAgICAgICAgIDp0ZXh0PVwiZmFpbHVyZSAhPT0gJ3Vuc3VwcG9ydGVkJ1wiXG4gICAgICAgICAgICA6Y29sb3I9XCJmYWlsdXJlID09PSAndW5zdXBwb3J0ZWQnID8gJ3ByaW1hcnknIDogdW5kZWZpbmVkXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiYmxlLXVzZS13aWZpXCJcbiAgICAgICAgICAgIEBjbGljaz1cInBoYXNlID0gJ2hvdHNwb3QnXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBVc2UgaXRzIFdpLUZpIGluc3RlYWRcbiAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgICB2LWlmPVwiZmFpbHVyZSAhPT0gJ3Vuc3VwcG9ydGVkJ1wiXG4gICAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJibGUtcmV0cnlcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY29ubmVjdFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIFRoZSBob3RzcG90IHJvdXRlOiBpdCBkb2VzIG5vdCBkZXBlbmQgb24gd2hhdCBhbnN3ZXJzIG92ZXIgQmx1ZXRvb3RoLiAtLT5cbiAgICA8ZGl2XG4gICAgICB2LWVsc2UtaWY9XCJwaGFzZSA9PT0gJ2hvdHNwb3QnXCJcbiAgICAgIGRhdGEtdGlkPVwic2V0dXAtYmxlLWhvdHNwb3RcIlxuICAgID5cbiAgICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgICAgZmxhdFxuICAgICAgICA6dGl0bGU9XCJgU2V0ICR7c2hvcnROYW1lfSB1cCBvbiBpdHMgV2ktRmlgXCJcbiAgICAgICAgOnN1Yj1cImBPciBzY2FuIHRoZSBRUiBjb2RlIG9uICR7c2hvcnROYW1lfSdzIHNjcmVlbiB3aXRoIHRoZSBNdW9uM0QgYXBwLmBcIlxuICAgICAgPlxuICAgICAgICA8b2wgY2xhc3M9XCJtdW9uLWJsZS1zZXR1cF9fc3RlcHNcIj5cbiAgICAgICAgICA8bGk+Sm9pbiB0aGUgV2ktRmkgbmV0d29yayA8c3Ryb25nPnt7IGhvdHNwb3ROYW1lIH19PC9zdHJvbmc+IG9uIHRoaXMgY29tcHV0ZXIuPC9saT5cbiAgICAgICAgICA8bGk+T3BlbiA8c3Ryb25nPmh0dHA6Ly8xMC40Mi4wLjEvc2V0dXA8L3N0cm9uZz4uPC9saT5cbiAgICAgICAgPC9vbD5cbiAgICAgIDwvc2V0dXAtc3RlcC1jYXJkPlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSBBZnRlciBcIlRoZXkgbWF0Y2hcIjogdGhlIHN0ZXBzLCBvdmVyIHRoZSBzYW1lIGNvbm5lY3Rpb24uIC0tPlxuICAgIDxkaXZcbiAgICAgIHYtZWxzZS1pZj1cInBoYXNlID09PSAnc2V0dXAnICYmIGNsaWVudFwiXG4gICAgICBkYXRhLXRpZD1cInNldHVwLWJsZS1zdGVwc1wiXG4gICAgPlxuICAgICAgPHNldHVwLXdpZmktc3RlcHNcbiAgICAgICAgOmNsaWVudD1cImNsaWVudFwiXG4gICAgICAgIG92ZXItYmx1ZXRvb3RoXG4gICAgICAgIEBpbnN0YWxsaW5nPVwiaW5zdGFsbGluZyA9IHRydWVcIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2RvbmU+XG4gICAgICAgICAgPHAgY2xhc3M9XCJtdW9uLWJsZS1zZXR1cF9fYm9keVwiPlxuICAgICAgICAgICAge3sgc2hvcnROYW1lIH19IGlzIG9uIGl0cyBXaS1GaS4gU2VhcmNoIGFnYWluIHRvIG9wZW4gaXQgZnJvbSB0aGlzIHBhZ2UuXG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgICAgQGNsaWNrPVwiZmluaXNoXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBCYWNrIHRvIHRoZSBsaXN0XG4gICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8dGVtcGxhdGUgI2Vsc2V3aGVyZT5cbiAgICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgQGNsaWNrPVwiZmluaXNoXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBCYWNrIHRvIHRoZSBsaXN0XG4gICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgPC9zZXR1cC13aWZpLXN0ZXBzPlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSBUaGUgY29ubmVjdGlvbiBlbmRlZCBiZWZvcmUgc2V0dXAgZmluaXNoZWQuIC0tPlxuICAgIDxkaXZcbiAgICAgIHYtZWxzZS1pZj1cInBoYXNlID09PSAnbG9zdCdcIlxuICAgICAgZGF0YS10aWQ9XCJzZXR1cC1ibGUtbG9zdFwiXG4gICAgPlxuICAgICAgPHNldHVwLXN0ZXAtY2FyZFxuICAgICAgICBmbGF0XG4gICAgICAgIDp0aXRsZT1cInVwZGF0ZVJlc3RhcnQgPyBgJHtzaG9ydE5hbWV9IGlzIHJlc3RhcnRpbmcgdG8gZmluaXNoIGl0cyB1cGRhdGVgIDogYFRoZSBCbHVldG9vdGggY29ubmVjdGlvbiB0byAke3Nob3J0TmFtZX0gZHJvcHBlZGBcIlxuICAgICAgPlxuICAgICAgICA8cCBjbGFzcz1cIm11b24tYmxlLXNldHVwX19ib2R5XCI+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCJ1cGRhdGVSZXN0YXJ0XCI+XG4gICAgICAgICAgICBUaGUgQmx1ZXRvb3RoIGxpbmsgZW5kcyB3aGlsZSBpdCByZXN0YXJ0cy4gQ2Fycnkgb24gYXQgaXRzIHNjcmVlbiwgb3Igc2VhcmNoIGFnYWluIGluIGFcbiAgICAgICAgICAgIGZldyBtaW51dGVzIHRvIGZpbmQgaXQuXG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICA8dGVtcGxhdGUgdi1lbHNlLWlmPVwiam9pbmVkV2lmaVwiPlxuICAgICAgICAgICAge3sgc2hvcnROYW1lIH19IGlzIG9uIHt7IGpvaW5lZFdpZmkgfX0uIFNlYXJjaCBhZ2FpbiB0byBmaW5kIGl0IHRoZXJlLCBvciBjYXJyeSBvbiBhdCBpdHNcbiAgICAgICAgICAgIHNjcmVlbi5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgICAgICBCcmluZyB0aGlzIGNvbXB1dGVyIGNsb3NlciBhbmQgdHJ5IGFnYWluLCBvciB1c2Uge3sgc2hvcnROYW1lIH19J3MgV2ktRmkgaW5zdGVhZC5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8L3A+XG4gICAgICAgIDx0ZW1wbGF0ZSAjZm9vdGVyPlxuICAgICAgICAgIDx2LWJ0blxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgQGNsaWNrPVwiZmluaXNoXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBCYWNrIHRvIHRoZSBsaXN0XG4gICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgICAgdi1pZj1cIiFqb2luZWRXaWZpICYmICF1cGRhdGVSZXN0YXJ0XCJcbiAgICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgICBAY2xpY2s9XCJjb25uZWN0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBUcnkgYWdhaW5cbiAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L3NldHVwLXN0ZXAtY2FyZD5cbiAgICA8L2Rpdj5cbiAgPC9ibHVldG9vdGgtc2hlZXQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWTW9kZWwsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFNldHVwU3RlcENhcmQgZnJvbSAnQC9jb21wb25lbnRzL211b24tc2V0dXAvU2V0dXBTdGVwQ2FyZC52dWUnXG5pbXBvcnQgQmx1ZXRvb3RoU2hlZXQgZnJvbSAnLi9CbHVldG9vdGhTaGVldC52dWUnXG5pbXBvcnQgQmx1ZXRvb3RoQ29kZUJveGVzIGZyb20gJy4vQmx1ZXRvb3RoQ29kZUJveGVzLnZ1ZSdcbmltcG9ydCBCbHVldG9vdGhQcmludGVyUm93IGZyb20gJy4vQmx1ZXRvb3RoUHJpbnRlclJvdy52dWUnXG5pbXBvcnQgU2V0dXBXaWZpU3RlcHMgZnJvbSAnQC9jb21wb25lbnRzL211b24tc2V0dXAvU2V0dXBXaWZpU3RlcHMudnVlJ1xuaW1wb3J0IHsgY29ubmVjdEZvclNldHVwLCB0eXBlIEJsZVNldHVwRmFpbHVyZSwgdHlwZSBCbGVTZXR1cFNlc3Npb24gfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3NldHVwJ1xuaW1wb3J0IHR5cGUgeyBOZWFyYnlQcmludGVyIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS9uZWFyYnknXG5pbXBvcnQgeyBhZnRlclNldHVwUmVmdXNhbCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvc2V0dXBPZmZlcidcbmltcG9ydCB7IGNyZWF0ZVNldHVwQ2xpZW50LCB0eXBlIFNldHVwQ2xpZW50IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLXNldHVwL2NsaWVudCdcbmltcG9ydCB7IGFwcGx5U3RhdGUsIHJlc2V0U2V0dXBTdGF0ZSwgc2V0TG9jYWwsIHNldHVwU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tc2V0dXAvc3RhdGUnXG5cbnR5cGUgUGhhc2UgPSAnY29ubmVjdGluZycgfCAnY29tcGFyZScgfCAnbWlzbWF0Y2gnIHwgJ2ZhaWxlZCcgfCAnaG90c3BvdCcgfCAnc2V0dXAnIHwgJ2xvc3QnXG5cbi8qKlxuICogU2V0dXAgb3ZlciBCbHVldG9vdGggZnJvbSB0aGUgaG9zdGVkIHBhZ2UgKEFEUiAwMDMyIEQ3OyBXUy0xNiBiYXRjaCA4J3NcbiAqIGBzZXR1cC1ibGUtKmAgc2NyZWVucywgaW4gRmx1aWRkJ3MgZGlhbG9nKS4gVGhlIGNvbXB1dGVyIHN0YXlzIG9uIGl0cyBvd25cbiAqIG5ldHdvcmsuIE5vdGhpbmcgYnV0IHJlYWRzIG9mIHRoZSBzZXR1cCBzdGF0ZSBnb2VzIHRvIHRoZSBwcmludGVyIHVudGlsIHRoZVxuICogcGVyc29uIHNheXMgdGhlIGNvZGVzIG1hdGNoOyB0aG9zZSByZWFkcyBhbHNvIGtlZXAgdGhlIGNvZGUgb24gdGhlXG4gKiBwcmludGVyJ3Mgc2NyZWVuLlxuICpcbiAqIExhaWQgb3V0IGFzIHRoZSBCbHVldG9vdGggc2hlZXQgKHYzIGBibHVldG9vdGhgIHN0b3J5Ym9hcmQpOiBzdGVwIDEgZmluZHNcbiAqIHRoZSBwcmludGVyIGFuZCBjaGVja3MgdGhlIGNvZGUsIHN0ZXAgMiBpcyBzZXR1cCdzIG93biBzdGVwcyBvdmVyIHRoZSBzYW1lXG4gKiBjb25uZWN0aW9uLCBzdGVwIDMgaXMgdGhlIHByaW50ZXIgc2V0IHVwLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBCbHVldG9vdGhTaGVldCwgQmx1ZXRvb3RoQ29kZUJveGVzLCBCbHVldG9vdGhQcmludGVyUm93LCBTZXR1cFN0ZXBDYXJkLCBTZXR1cFdpZmlTdGVwcyB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCbHVldG9vdGhTZXR1cERpYWxvZyBleHRlbmRzIFZ1ZSB7XG4gIEBWTW9kZWwoeyB0eXBlOiBCb29sZWFuIH0pXG4gICAgb3BlbiE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgcHJpbnRlciE6IE5lYXJieVByaW50ZXJcblxuICAvKiogRm9yIHRlc3RzOiB3aGF0IGBjb25uZWN0Rm9yU2V0dXBgIGlzLiAqL1xuICBAUHJvcCh7IHR5cGU6IEZ1bmN0aW9uLCBkZWZhdWx0OiBjb25uZWN0Rm9yU2V0dXAgfSlcbiAgcmVhZG9ubHkgY29ubmVjdG9yITogdHlwZW9mIGNvbm5lY3RGb3JTZXR1cFxuXG4gIHBoYXNlOiBQaGFzZSA9ICdjb25uZWN0aW5nJ1xuICAvKiogQW4gdXBkYXRlIHdhcyBzdGFydGVkIG92ZXIgdGhpcyBsaW5rOiB0aGUgcHJpbnRlciByZXN0YXJ0cyBhbmQgdGhlIGxpbmsgZW5kcy4gKi9cbiAgaW5zdGFsbGluZyA9IGZhbHNlXG4gIHVwZGF0ZVJlc3RhcnQgPSBmYWxzZVxuICBmYWlsdXJlOiBCbGVTZXR1cEZhaWx1cmUgfCBudWxsID0gbnVsbFxuICBjb2RlID0gJydcbiAgY2xpZW50OiBTZXR1cENsaWVudCB8IG51bGwgPSBudWxsXG4gIHByaXZhdGUgc2Vzc2lvbjogQmxlU2V0dXBTZXNzaW9uIHwgbnVsbCA9IG51bGxcbiAgLyoqIEJ1bXBlZCBieSBldmVyeSBhdHRlbXB0LCBzbyBhIGxhdGUgYW5zd2VyIGZyb20gYW4gZWFybGllciBvbmUgaXMgZHJvcHBlZC4gKi9cbiAgcHJpdmF0ZSBhdHRlbXB0ID0gMFxuXG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5wcmludGVyLmRpc3BsYXkgfHwgdGhpcy5wcmludGVyLmxvY2FsTmFtZSB8fCAnUHJpbnRlcidcbiAgfVxuXG4gIC8qKiBcIldhbG51dFwiLCBhcyB0aGUgc2NyZWVucyBzYXkgaXQuICovXG4gIGdldCBzaG9ydE5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRlck5hbWUuc3BsaXQoJyDCtyAnKVswXVxuICB9XG5cbiAgZ2V0IGhvdHNwb3ROYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnByaW50ZXIubG9jYWxOYW1lID8gYE11b24tJHt0aGlzLnByaW50ZXIubG9jYWxOYW1lfWAgOiAnTXVvbi3igKYnXG4gIH1cblxuICBnZXQgc3RlcCAoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5waGFzZSA9PT0gJ3NldHVwJykgcmV0dXJuIHNldHVwU3RhdGUuc3RhdGU/LnN0YXRlID09PSAnY29tcGxldGUnID8gMyA6IDJcbiAgICByZXR1cm4gdGhpcy5waGFzZSA9PT0gJ2xvc3QnID8gMiA6IDFcbiAgfVxuXG4gIGdldCBqb2luZWRXaWZpICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBuZXR3b3JrID0gc2V0dXBTdGF0ZS5zdGF0ZT8uc3RlcHMubmV0d29ya1xuICAgIHJldHVybiBuZXR3b3JrICYmIG5ldHdvcmsuYWRkcmVzc2VzLmxlbmd0aCA/IG5ldHdvcmsuc3NpZCA/PyAnaXRzIG5ldHdvcmsnIDogbnVsbFxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgdGhpcy5jb25uZWN0KClcbiAgfVxuXG4gIGRlc3Ryb3llZCAoKSB7XG4gICAgdGhpcy5oYW5nVXAoKVxuICB9XG5cbiAgQFdhdGNoKCdvcGVuJylcbiAgb25PcGVuICh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdmFsdWUpIHRoaXMuaGFuZ1VwKClcbiAgfVxuXG4gIGFzeW5jIGNvbm5lY3QgKCkge1xuICAgIGF3YWl0IHRoaXMuaGFuZ1VwKClcbiAgICBjb25zdCBhdHRlbXB0ID0gKyt0aGlzLmF0dGVtcHRcbiAgICB0aGlzLmluc3RhbGxpbmcgPSBmYWxzZVxuICAgIHRoaXMudXBkYXRlUmVzdGFydCA9IGZhbHNlXG4gICAgdGhpcy5waGFzZSA9ICdjb25uZWN0aW5nJ1xuICAgIHRoaXMuZmFpbHVyZSA9IG51bGxcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNvbm5lY3Rvcih0aGlzLnByaW50ZXIpXG4gICAgaWYgKGF0dGVtcHQgIT09IHRoaXMuYXR0ZW1wdCkge1xuICAgICAgaWYgKHJlc3VsdC5vaykgcmVzdWx0LnNlc3Npb24uY2xvc2UoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICAvLyBQaWNrZWQgd2l0aCBubyBhZHZlcnRpc2VtZW50IGFuZCB0aGUgcHJpbnRlciBzYXlzIGl0IGlzIHNldCB1cDogcGFpciwgZG9uJ3QgZGVhZC1lbmQgKEtBTi00ODI4KS5cbiAgICAgIGlmIChhZnRlclNldHVwUmVmdXNhbCh0aGlzLnByaW50ZXIsIHJlc3VsdC5yZWFzb24pID09PSAncGFpcicpIHJldHVybiB0aGlzLnBhaXJJbnN0ZWFkKClcbiAgICAgIHRoaXMuZmFpbHVyZSA9IHJlc3VsdC5yZWFzb25cbiAgICAgIHRoaXMucGhhc2UgPSAnZmFpbGVkJ1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHNlc3Npb24gPSByZXN1bHQuc2Vzc2lvblxuICAgIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb25cbiAgICB0aGlzLmNvZGUgPSBzZXNzaW9uLmNvZGVcbiAgICByZXNldFNldHVwU3RhdGUoKVxuICAgIHNldExvY2FsKHsgZHJvdmVTZXR1cDogZmFsc2UsIGNoYW5naW5nV2lmaTogZmFsc2UsIGpvaW5SZXY6IG51bGwgfSlcbiAgICBhcHBseVN0YXRlKHNlc3Npb24uc3RhdGUsIHsgZnJvbUdldDogdHJ1ZSB9KVxuICAgIGNvbnN0IGNsaWVudCA9IGNyZWF0ZVNldHVwQ2xpZW50KHsgdHJhbnNwb3J0OiBzZXNzaW9uLnRyYW5zcG9ydCwgb3ZlckJsdWV0b290aDogdHJ1ZSB9KVxuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50XG4gICAgLy8gUmVhZHMgb25seSwgZXZlcnkgMiBzOiB0aGV5IGNhcnJ5IHRoZSBjb2RlIHRvIHRoZSBwcmludGVyJ3Mgc2NyZWVuLlxuICAgIGNsaWVudC5zdGFydCgpXG4gICAgdGhpcy5waGFzZSA9ICdjb21wYXJlJ1xuICAgIHNlc3Npb24uY2xvc2VkLnRoZW4oKCkgPT4gdGhpcy5vbkRyb3BwZWQoYXR0ZW1wdCkpXG4gIH1cblxuICAvKiogVGhlIG90aGVyIHdheXMgaW46IHRoZSBwcmludGVyJ3Mgb3duIFdpLUZpLCBvciB0aGUgUVIgY29kZSBvbiBpdHMgc2NyZWVuLiBIYW5ncyB1cCBmaXJzdC4gKi9cbiAgYXN5bmMgdXNlT3RoZXJXYXkgKCkge1xuICAgIGF3YWl0IHRoaXMuaGFuZ1VwKClcbiAgICB0aGlzLnBoYXNlID0gJ2hvdHNwb3QnXG4gIH1cblxuICB0aGV5TWF0Y2ggKCkge1xuICAgIHRoaXMucGhhc2UgPSAnc2V0dXAnXG4gIH1cblxuICBhc3luYyB0aGV5RGlmZmVyICgpIHtcbiAgICBhd2FpdCB0aGlzLmhhbmdVcCgpXG4gICAgdGhpcy5waGFzZSA9ICdtaXNtYXRjaCdcbiAgfVxuXG4gIC8qKiBtdW9uLWxpbmsgaGFuZ3MgYSBzZXR1cCBzZXNzaW9uIHVwIHdoZW4gc2V0dXAgY29tcGxldGVzLCBvciB0aGUgcmFkaW8gd2VudC4gKi9cbiAgb25Ecm9wcGVkIChhdHRlbXB0OiBudW1iZXIpIHtcbiAgICBpZiAoYXR0ZW1wdCAhPT0gdGhpcy5hdHRlbXB0IHx8ICF0aGlzLnNlc3Npb24pIHJldHVyblxuICAgIHRoaXMuY2xpZW50Py5zdG9wKClcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsXG4gICAgaWYgKHRoaXMucGhhc2UgIT09ICdjb21wYXJlJyAmJiB0aGlzLnBoYXNlICE9PSAnc2V0dXAnKSByZXR1cm5cbiAgICAvLyBBbiBpbnN0YWxsIHJlc3RhcnRzIHRoZSBwcmludGVyLCBzbyBpdHMgbGluayBnb2luZyBpcyBleHBlY3RlZCwgbm90IGEgZmF1bHQuXG4gICAgdGhpcy51cGRhdGVSZXN0YXJ0ID0gdGhpcy5pbnN0YWxsaW5nIHx8IHNldHVwU3RhdGUuc3RhdGU/Lm9wPy5raW5kID09PSAndXBkYXRlX2luc3RhbGwnXG4gICAgdGhpcy5waGFzZSA9IHNldHVwU3RhdGUuc3RhdGU/LnN0YXRlID09PSAnY29tcGxldGUnID8gJ3NldHVwJyA6ICdsb3N0J1xuICB9XG5cbiAgYXN5bmMgaGFuZ1VwICgpIHtcbiAgICB0aGlzLmF0dGVtcHQrK1xuICAgIHRoaXMuY2xpZW50Py5zdG9wKClcbiAgICBjb25zdCBzZXNzaW9uID0gdGhpcy5zZXNzaW9uXG4gICAgdGhpcy5zZXNzaW9uID0gbnVsbFxuICAgIGF3YWl0IHNlc3Npb24/LmNsb3NlKCkuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICBmaW5pc2ggKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgdGhpcy4kZW1pdCgnZmluaXNoZWQnKVxuICB9XG5cbiAgLyoqIEhhbmdzIHVwIHRoaXMgc2V0dXAgYXR0ZW1wdCwgdGhlbiBoYW5kcyB0aGUgcHJpbnRlciB0byB0aGUgcGFpcmluZyB3YXkgaW4uICovXG4gIGFzeW5jIHBhaXJJbnN0ZWFkICgpIHtcbiAgICBhd2FpdCB0aGlzLmhhbmdVcCgpXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICB0aGlzLiRlbWl0KCdwYWlyJywgdGhpcy5wcmludGVyKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuLm11b24tYmxlLXNldHVwIHtcbiAgJl9fYm9keSB7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC1zbSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBtYXJnaW46IDAgMCAxMnB4O1xuICB9XG5cbiAgJl9fYWZ0ZXIge1xuICAgIG1hcmdpbjogMTJweCAwIDA7XG4gIH1cblxuICAmX19zdGVwcyB7XG4gICAgbWFyZ2luOiAwIDAgMTJweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDIwcHg7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC1zbSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcblxuICAgIGxpIHtcbiAgICAgIG1hcmdpbi1ib3R0b206IDRweDtcbiAgICB9XG4gIH1cbn1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tdW9uLWJsZS9CbHVldG9vdGhTZXR1cERpYWxvZy52dWUifQ==