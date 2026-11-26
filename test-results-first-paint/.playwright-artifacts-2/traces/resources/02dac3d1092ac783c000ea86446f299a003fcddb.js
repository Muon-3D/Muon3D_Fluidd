/* unplugin-vue-components disabled */import __unplugin_components_36 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_35 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_34 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_33 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_32 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_31 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_30 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_29 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_28 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_27 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_26 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_25 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_24 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_23 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_22 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_21 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VAlert as __unplugin_components_20 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VOtpInput as __unplugin_components_19 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemSubtitle as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardSubtitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCard as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { cloudApi } from "/src/services/muon-cloud/api.ts";
import { deletionState } from "/src/services/muon-cloud/deletion.ts";
import { cloudState, refreshPrinters } from "/src/services/muon-cloud/state.ts";
import { activateCloudPrinter } from "/src/services/muon-cloud/activate.ts";
import {
  discoverPrinters,
  discoveryState,
  lanCodeOutcome,
  lanLinkAvailability,
  refreshCloudNearby,
  refreshLinkStates,
  sameNamedPrinter,
  showLanCode
} from "/src/services/muon-cloud/discovery.ts";
let LinkPrinterDialog = class extends Vue {
  get deleting() {
    return deletionState.deleteAfter !== null;
  }
  onDeleting(value) {
    if (value) this.reset();
  }
  open;
  initialCode;
  initialPrinterId;
  initialHost;
  step = "choose";
  code = "";
  busy = false;
  error = null;
  claimed = null;
  asking = null;
  /** What the printer just asked for a code is doing, as a sentence. */
  shown = "";
  timer = null;
  icons = { printer: "$printer3d" };
  get accountEmail() {
    return cloudState.account?.email ?? "";
  }
  /**
   * Printers near this browser that could show a code: from the service, and
   * from the LAN search where the page can run one. Each may be linked already.
   */
  get nearby() {
    const out = [];
    for (const c of discoveryState.cloud) {
      const mine = cloudState.printers.some((p) => p.id === c.printerId);
      out.push({
        key: c.printerId,
        name: c.name,
        cloud: c,
        canShow: !c.linked,
        note: !c.linked ? "Not linked \xB7 show its code" : mine ? "Already in your account" : "Linked to another account \xB7 its owner must unlink it first"
      });
    }
    for (const l of discoveryState.found) {
      if (discoveryState.cloud.some((c) => sameNamedPrinter(c.name, l.name))) continue;
      const { canShow, note } = lanLinkAvailability(l.link);
      out.push({ key: l.host, name: l.name, lan: l, canShow, note: `${l.host} \xB7 ${note}` });
    }
    return out;
  }
  get searching() {
    return discoveryState.scanning || !discoveryState.cloudChecked;
  }
  created() {
    if (this.deleting) return;
    this.code = (this.initialCode || "").replace(/\D/g, "").slice(0, 6);
    if (this.code.length === 6) this.claim(this.code);
    else if (this.initialPrinterId) this.askForCode(this.initialPrinterId, this.initialPrinterId);
    else if (this.initialHost) {
      const lan = discoveryState.found.find((l) => l.host === this.initialHost);
      if (lan) this.showCode({ key: lan.host, name: lan.name, lan });
    }
    refreshLinkStates().catch(() => {
    });
    discoverPrinters().catch(() => {
    });
  }
  beforeDestroy() {
    this.stopPolling();
  }
  onOpen(value) {
    if (!value) this.stopPolling();
  }
  rescan() {
    if (this.deleting) return;
    discoveryState.cloudChecked = false;
    discoverPrinters(true).catch(() => {
    });
  }
  /** Makes a printer show its link code, so that the person can read it and type it here. */
  async showCode(p) {
    if (this.deleting) return;
    if (p.cloud) return this.askForCode(p.cloud.printerId, p.key, p.name);
    if (!p.lan) return;
    this.error = null;
    this.shown = "";
    this.asking = p.key;
    try {
      const status = await showLanCode(p.lan.apiUrl);
      p.lan.link = status;
      const { note, error } = lanCodeOutcome(p.name, status);
      this.shown = note ?? "";
      this.error = error ?? null;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.asking = null;
    }
  }
  async askForCode(printerId, key, name) {
    if (this.deleting) return;
    this.error = null;
    this.asking = key;
    try {
      await cloudApi.startLink(printerId);
      const shown = name ?? discoveryState.cloud.find((c) => c.printerId === printerId)?.name ?? "The printer";
      this.shown = `${shown} is showing a code on its screen now. Type it below.`;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.asking = null;
    }
  }
  async claim(code) {
    if (this.deleting || this.busy || code.length !== 6) return;
    this.error = null;
    this.busy = true;
    try {
      const claimed = await cloudApi.claim(code);
      this.claimed = { printer_id: claimed.printer_id, name: claimed.name };
      this.step = "confirm";
      this.startPolling();
    } catch (error) {
      this.error = error.message;
      refreshCloudNearby().catch(() => {
      });
    } finally {
      this.busy = false;
    }
  }
  startPolling() {
    this.stopPolling();
    this.timer = window.setInterval(async () => {
      if (!this.claimed) return;
      try {
        const { state } = await cloudApi.linkState(this.claimed.printer_id);
        if (state === "linked") {
          this.stopPolling();
          await refreshPrinters();
          refreshLinkStates().catch(() => {
          });
          refreshCloudNearby().catch(() => {
          });
          this.step = "done";
        } else if (state === "declined" || state === "expired") {
          this.stopPolling();
          this.error = state === "declined" ? "The link was declined on the printer." : "The code expired. Start again.";
          this.step = "choose";
          this.code = "";
          refreshLinkStates().catch(() => {
          });
        }
      } catch {
      }
    }, 1500);
  }
  stopPolling() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
  reset() {
    this.stopPolling();
    this.step = "choose";
    this.code = "";
    this.claimed = null;
  }
  async openPrinter() {
    const id = this.claimed?.printer_id;
    this.open = false;
    if (id) await activateCloudPrinter(id).catch(() => {
    });
  }
};
__decorateClass([
  Watch("deleting")
], LinkPrinterDialog.prototype, "onDeleting", 1);
__decorateClass([
  VModel({ type: Boolean })
], LinkPrinterDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], LinkPrinterDialog.prototype, "initialCode", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], LinkPrinterDialog.prototype, "initialPrinterId", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], LinkPrinterDialog.prototype, "initialHost", 2);
__decorateClass([
  Watch("open")
], LinkPrinterDialog.prototype, "onOpen", 1);
LinkPrinterDialog = __decorateClass([
  Component({ components: { DeletionNotice: () => import("/src/components/account/DeletionNotice.vue") } })
], LinkPrinterDialog);
const _sfc_main = LinkPrinterDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "max-width": "480", "persistent": _vm.step === "confirm" && !_vm.deleting }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_1, { staticClass: "muon-cloud-dialog" }, [_vm.deleting ? [_c("deletion-notice", { attrs: { "tid": "link-deletion" } }), _c(__unplugin_components_2, [_c(__unplugin_components_3), _c(__unplugin_components_4, { attrs: { "text": "" }, on: { "click": function($event) {
    _vm.open = false;
  } } }, [_vm._v(" Close ")])], 1)] : _vm.step === "choose" ? [_c(__unplugin_components_5, [_vm._v("Link a printer to your account")]), _c(__unplugin_components_6, { staticClass: "pt-1" }, [_vm._v(" Enter the six-digit code the printer's screen shows while it is linking, or scan its QR code with your phone. Then confirm on the printer with the knob. ")]), _c(__unplugin_components_7, [_c("div", { staticClass: "muon-cloud-dialog__label" }, [_vm._v(" Show the code on a printer near you "), _c(__unplugin_components_8), _vm.searching ? _c("span", { staticClass: "muon-cloud-dialog__scan" }, [_c(__unplugin_components_9, { staticClass: "mr-1", attrs: { "indeterminate": "", "size": "11", "width": "2" } }), _vm._v(" Searching ")], 1) : _c(__unplugin_components_10, { attrs: { "x-small": "", "text": "" }, on: { "click": _vm.rescan } }, [_vm._v(" Search again ")])], 1), _vm.nearby.length ? _c(__unplugin_components_11, { staticClass: "mb-2 muon-cloud-dialog__list", attrs: { "dense": "" } }, _vm._l(_vm.nearby, function(p) {
    return _c(__unplugin_components_12, { key: p.key, attrs: { "disabled": _vm.busy || !p.canShow }, on: { "click": function($event) {
      return _vm.showCode(p);
    } } }, [_c(__unplugin_components_13, [_vm.asking === p.key ? _c(__unplugin_components_14, { attrs: { "indeterminate": "", "size": "20", "width": "2" } }) : _c(__unplugin_components_15, [_vm._v(" " + _vm._s(_vm.icons.printer) + " ")])], 1), _c(__unplugin_components_16, [_c(__unplugin_components_17, [_vm._v(_vm._s(p.name))]), _c(__unplugin_components_18, [_vm._v(_vm._s(p.note))])], 1)], 1);
  }), 1) : _c("div", { staticClass: "muon-cloud-dialog__empty mb-2" }, [_vm._v(" " + _vm._s(_vm.searching ? "Looking for Muon3D printers\u2026" : "No Muon3D printers found on your network.") + " ")]), _vm.shown ? _c("div", { staticClass: "text-caption mb-3" }, [_vm._v(" " + _vm._s(_vm.shown) + " ")]) : _vm._e(), _c("div", { staticClass: "muon-cloud-dialog__label" }, [_vm._v(" Or enter the code on the printer's screen ")]), _c(__unplugin_components_19, { attrs: { "length": "6", "type": "number", "disabled": _vm.busy }, on: { "finish": function($event) {
    return _vm.claim(_vm.code);
  } }, model: { value: _vm.code, callback: function($$v) {
    _vm.code = $$v;
  }, expression: "code" } }), _c("div", { staticClass: "text-caption text--secondary mt-1" }, [_vm._v(" Scanning the QR code on the screen with your phone opens this page with the code filled in. ")]), _vm.error ? _c(__unplugin_components_20, { staticClass: "mt-3 mb-0", attrs: { "type": "error", "dense": "", "text": "" } }, [_vm._v(" " + _vm._s(_vm.error) + " ")]) : _vm._e()], 1), _c(__unplugin_components_21, [_c(__unplugin_components_22), _c(__unplugin_components_23, { attrs: { "text": "" }, on: { "click": function($event) {
    _vm.open = false;
  } } }, [_vm._v(" Cancel ")]), _c(__unplugin_components_24, { attrs: { "color": "primary", "disabled": _vm.code.length !== 6, "loading": _vm.busy }, on: { "click": function($event) {
    return _vm.claim(_vm.code);
  } } }, [_vm._v(" Link ")])], 1)] : _vm.step === "confirm" ? [_c(__unplugin_components_25, [_vm._v("Confirm on the printer")]), _c(__unplugin_components_26, [_c("div", { staticClass: "muon-cloud-confirm" }, [_c(__unplugin_components_27, { attrs: { "indeterminate": "", "size": "36", "width": "3", "color": "primary" } }), _c("div", [_c("div", { staticClass: "text-subtitle-1" }, [_vm._v(" " + _vm._s(_vm.claimed && _vm.claimed.name) + " ")]), _c("div", { staticClass: "text-body-2 text--secondary" }, [_vm._v(" The printer's screen is asking whether to link it to "), _c("strong", [_vm._v(_vm._s(_vm.accountEmail))]), _vm._v(". Turn the knob to "), _c("strong", [_vm._v("Confirm")]), _vm._v(" and press it. ")])])], 1)]), _c(__unplugin_components_28, [_c(__unplugin_components_29), _c(__unplugin_components_30, { attrs: { "text": "" }, on: { "click": _vm.reset } }, [_vm._v(" Cancel ")])], 1)] : _vm.step === "done" ? [_c(__unplugin_components_31, [_vm._v(_vm._s(_vm.claimed && _vm.claimed.name) + " is linked")]), _c(__unplugin_components_32, [_vm._v(" You can reach it from anywhere you are signed in. It appears under "), _c("strong", [_vm._v("Cloud")]), _vm._v(" in the printer list and in "), _c("strong", [_vm._v("Fleet")]), _vm._v(". ")]), _c(__unplugin_components_33, [_c(__unplugin_components_34), _c(__unplugin_components_35, { attrs: { "text": "" }, on: { "click": function($event) {
    _vm.open = false;
  } } }, [_vm._v(" Close ")]), _c(__unplugin_components_36, { attrs: { "color": "primary" }, on: { "click": _vm.openPrinter } }, [_vm._v(" Open it now ")])], 1)] : _vm._e()], 2)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/LinkPrinterDialog.vue?vue&type=style&index=0&scoped=c0d8051f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "c0d8051f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/LinkPrinterDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUdBO0FBR0E7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBLGtCQUNBLGtDQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLGFBQ0E7QUFBQSxhQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUFBO0FBQ0E7QUFBQSxRQUNBO0FBQ0E7QUFDQSw4Q0FDQSwwQ0FDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFDQTtBQTVMQTtBQUFBLEVBREE7QUFBQSxHQUxBLGtCQU1BO0FBS0E7QUFBQSxFQURBO0FBQUEsR0FWQSxrQkFXQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBYkEsa0JBY0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQWpCQSxrQkFrQkE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQXJCQSxrQkFzQkE7QUFpRUE7QUFBQSxFQURBO0FBQUEsR0F0RkEsa0JBdUZBO0FBdkZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkxpbmtQcmludGVyRGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWRpYWxvZ1xuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICBtYXgtd2lkdGg9XCI0ODBcIlxuICAgIDpwZXJzaXN0ZW50PVwic3RlcCA9PT0gJ2NvbmZpcm0nICYmICFkZWxldGluZ1wiXG4gID5cbiAgICA8di1jYXJkIGNsYXNzPVwibXVvbi1jbG91ZC1kaWFsb2dcIj5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiZGVsZXRpbmdcIj5cbiAgICAgICAgPGRlbGV0aW9uLW5vdGljZSB0aWQ9XCJsaW5rLWRlbGV0aW9uXCIgLz5cbiAgICAgICAgPHYtY2FyZC1hY3Rpb25zPlxuICAgICAgICAgIDx2LXNwYWNlciAvPlxuICAgICAgICAgIDx2LWJ0blxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDbG9zZVxuICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwvdi1jYXJkLWFjdGlvbnM+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHRlbXBsYXRlIHYtZWxzZS1pZj1cInN0ZXAgPT09ICdjaG9vc2UnXCI+XG4gICAgICAgIDx2LWNhcmQtdGl0bGU+TGluayBhIHByaW50ZXIgdG8geW91ciBhY2NvdW50PC92LWNhcmQtdGl0bGU+XG4gICAgICAgIDx2LWNhcmQtc3VidGl0bGUgY2xhc3M9XCJwdC0xXCI+XG4gICAgICAgICAgRW50ZXIgdGhlIHNpeC1kaWdpdCBjb2RlIHRoZSBwcmludGVyJ3Mgc2NyZWVuIHNob3dzIHdoaWxlIGl0IGlzIGxpbmtpbmcsIG9yIHNjYW4gaXRzXG4gICAgICAgICAgUVIgY29kZSB3aXRoIHlvdXIgcGhvbmUuIFRoZW4gY29uZmlybSBvbiB0aGUgcHJpbnRlciB3aXRoIHRoZSBrbm9iLlxuICAgICAgICA8L3YtY2FyZC1zdWJ0aXRsZT5cblxuICAgICAgICA8di1jYXJkLXRleHQ+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm11b24tY2xvdWQtZGlhbG9nX19sYWJlbFwiPlxuICAgICAgICAgICAgU2hvdyB0aGUgY29kZSBvbiBhIHByaW50ZXIgbmVhciB5b3VcbiAgICAgICAgICAgIDx2LXNwYWNlciAvPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1pZj1cInNlYXJjaGluZ1wiXG4gICAgICAgICAgICAgIGNsYXNzPVwibXVvbi1jbG91ZC1kaWFsb2dfX3NjYW5cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgICAgICAgIGluZGV0ZXJtaW5hdGVcbiAgICAgICAgICAgICAgICBzaXplPVwiMTFcIlxuICAgICAgICAgICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJtci0xXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgU2VhcmNoaW5nXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8di1idG5cbiAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICBAY2xpY2s9XCJyZXNjYW5cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBTZWFyY2ggYWdhaW5cbiAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHYtbGlzdFxuICAgICAgICAgICAgdi1pZj1cIm5lYXJieS5sZW5ndGhcIlxuICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgIGNsYXNzPVwibWItMiBtdW9uLWNsb3VkLWRpYWxvZ19fbGlzdFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgICAgIHYtZm9yPVwicCBpbiBuZWFyYnlcIlxuICAgICAgICAgICAgICA6a2V5PVwicC5rZXlcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5IHx8ICFwLmNhblNob3dcIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJzaG93Q29kZShwKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1pY29uPlxuICAgICAgICAgICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgICAgICAgICAgICB2LWlmPVwiYXNraW5nID09PSBwLmtleVwiXG4gICAgICAgICAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgICAgICAgICBzaXplPVwiMjBcIlxuICAgICAgICAgICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDx2LWljb24gdi1lbHNlPlxuICAgICAgICAgICAgICAgICAge3sgaWNvbnMucHJpbnRlciB9fVxuICAgICAgICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtLWljb24+XG4gICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT57eyBwLm5hbWUgfX08L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1zdWJ0aXRsZT57eyBwLm5vdGUgfX08L3YtbGlzdC1pdGVtLXN1YnRpdGxlPlxuICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtLWNvbnRlbnQ+XG4gICAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICAgIDwvdi1saXN0PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgY2xhc3M9XCJtdW9uLWNsb3VkLWRpYWxvZ19fZW1wdHkgbWItMlwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgc2VhcmNoaW5nID8gJ0xvb2tpbmcgZm9yIE11b24zRCBwcmludGVyc+KApicgOiAnTm8gTXVvbjNEIHByaW50ZXJzIGZvdW5kIG9uIHlvdXIgbmV0d29yay4nIH19XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1pZj1cInNob3duXCJcbiAgICAgICAgICAgIGNsYXNzPVwidGV4dC1jYXB0aW9uIG1iLTNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IHNob3duIH19XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibXVvbi1jbG91ZC1kaWFsb2dfX2xhYmVsXCI+XG4gICAgICAgICAgICBPciBlbnRlciB0aGUgY29kZSBvbiB0aGUgcHJpbnRlcidzIHNjcmVlblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx2LW90cC1pbnB1dFxuICAgICAgICAgICAgdi1tb2RlbD1cImNvZGVcIlxuICAgICAgICAgICAgbGVuZ3RoPVwiNlwiXG4gICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgQGZpbmlzaD1cImNsYWltKGNvZGUpXCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWNhcHRpb24gdGV4dC0tc2Vjb25kYXJ5IG10LTFcIj5cbiAgICAgICAgICAgIFNjYW5uaW5nIHRoZSBRUiBjb2RlIG9uIHRoZSBzY3JlZW4gd2l0aCB5b3VyIHBob25lIG9wZW5zIHRoaXMgcGFnZSB3aXRoIHRoZSBjb2RlIGZpbGxlZCBpbi5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8di1hbGVydFxuICAgICAgICAgICAgdi1pZj1cImVycm9yXCJcbiAgICAgICAgICAgIHR5cGU9XCJlcnJvclwiXG4gICAgICAgICAgICBkZW5zZVxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgY2xhc3M9XCJtdC0zIG1iLTBcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGVycm9yIH19XG4gICAgICAgICAgPC92LWFsZXJ0PlxuICAgICAgICA8L3YtY2FyZC10ZXh0PlxuICAgICAgICA8di1jYXJkLWFjdGlvbnM+XG4gICAgICAgICAgPHYtc3BhY2VyIC8+XG4gICAgICAgICAgPHYtYnRuXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICBAY2xpY2s9XCJvcGVuID0gZmFsc2VcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJjb2RlLmxlbmd0aCAhPT0gNlwiXG4gICAgICAgICAgICA6bG9hZGluZz1cImJ1c3lcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY2xhaW0oY29kZSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIExpbmtcbiAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDwvdi1jYXJkLWFjdGlvbnM+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8dGVtcGxhdGUgdi1lbHNlLWlmPVwic3RlcCA9PT0gJ2NvbmZpcm0nXCI+XG4gICAgICAgIDx2LWNhcmQtdGl0bGU+Q29uZmlybSBvbiB0aGUgcHJpbnRlcjwvdi1jYXJkLXRpdGxlPlxuICAgICAgICA8di1jYXJkLXRleHQ+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm11b24tY2xvdWQtY29uZmlybVwiPlxuICAgICAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgICAgICBzaXplPVwiMzZcIlxuICAgICAgICAgICAgICB3aWR0aD1cIjNcIlxuICAgICAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXN1YnRpdGxlLTFcIj5cbiAgICAgICAgICAgICAgICB7eyBjbGFpbWVkICYmIGNsYWltZWQubmFtZSB9fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtYm9keS0yIHRleHQtLXNlY29uZGFyeVwiPlxuICAgICAgICAgICAgICAgIFRoZSBwcmludGVyJ3Mgc2NyZWVuIGlzIGFza2luZyB3aGV0aGVyIHRvIGxpbmsgaXQgdG9cbiAgICAgICAgICAgICAgICA8c3Ryb25nPnt7IGFjY291bnRFbWFpbCB9fTwvc3Ryb25nPi4gVHVybiB0aGUga25vYiB0byA8c3Ryb25nPkNvbmZpcm08L3N0cm9uZz4gYW5kIHByZXNzIGl0LlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3YtY2FyZC10ZXh0PlxuICAgICAgICA8di1jYXJkLWFjdGlvbnM+XG4gICAgICAgICAgPHYtc3BhY2VyIC8+XG4gICAgICAgICAgPHYtYnRuXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICBAY2xpY2s9XCJyZXNldFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQ2FuY2VsXG4gICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPC92LWNhcmQtYWN0aW9ucz5cbiAgICAgIDwvdGVtcGxhdGU+XG5cbiAgICAgIDx0ZW1wbGF0ZSB2LWVsc2UtaWY9XCJzdGVwID09PSAnZG9uZSdcIj5cbiAgICAgICAgPHYtY2FyZC10aXRsZT57eyBjbGFpbWVkICYmIGNsYWltZWQubmFtZSB9fSBpcyBsaW5rZWQ8L3YtY2FyZC10aXRsZT5cbiAgICAgICAgPHYtY2FyZC10ZXh0PlxuICAgICAgICAgIFlvdSBjYW4gcmVhY2ggaXQgZnJvbSBhbnl3aGVyZSB5b3UgYXJlIHNpZ25lZCBpbi4gSXQgYXBwZWFycyB1bmRlclxuICAgICAgICAgIDxzdHJvbmc+Q2xvdWQ8L3N0cm9uZz4gaW4gdGhlIHByaW50ZXIgbGlzdCBhbmQgaW4gPHN0cm9uZz5GbGVldDwvc3Ryb25nPi5cbiAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICAgICAgPHYtY2FyZC1hY3Rpb25zPlxuICAgICAgICAgIDx2LXNwYWNlciAvPlxuICAgICAgICAgIDx2LWJ0blxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDbG9zZVxuICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgICBAY2xpY2s9XCJvcGVuUHJpbnRlclwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgT3BlbiBpdCBub3dcbiAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDwvdi1jYXJkLWFjdGlvbnM+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvdi1jYXJkPlxuICA8L3YtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVk1vZGVsLCBWdWUsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IGNsb3VkQXBpIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FwaSdcbmltcG9ydCB7IGRlbGV0aW9uU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZGVsZXRpb24nXG5pbXBvcnQgeyBjbG91ZFN0YXRlLCByZWZyZXNoUHJpbnRlcnMgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBhY3RpdmF0ZUNsb3VkUHJpbnRlciB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9hY3RpdmF0ZSdcbmltcG9ydCB7XG4gIGRpc2NvdmVyUHJpbnRlcnMsXG4gIGRpc2NvdmVyeVN0YXRlLFxuICBsYW5Db2RlT3V0Y29tZSxcbiAgbGFuTGlua0F2YWlsYWJpbGl0eSxcbiAgcmVmcmVzaENsb3VkTmVhcmJ5LFxuICByZWZyZXNoTGlua1N0YXRlcyxcbiAgc2FtZU5hbWVkUHJpbnRlcixcbiAgc2hvd0xhbkNvZGUsXG4gIHR5cGUgQ2xvdWROZWFyYnlQcmludGVyLFxuICB0eXBlIExhblByaW50ZXJcbn0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2Rpc2NvdmVyeSdcblxuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgRGVsZXRpb25Ob3RpY2U6ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL2FjY291bnQvRGVsZXRpb25Ob3RpY2UudnVlJykgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGlua1ByaW50ZXJEaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBnZXQgZGVsZXRpbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBkZWxldGlvblN0YXRlLmRlbGV0ZUFmdGVyICE9PSBudWxsXG4gIH1cblxuICBAV2F0Y2goJ2RlbGV0aW5nJylcbiAgb25EZWxldGluZyAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUpIHRoaXMucmVzZXQoKVxuICB9XG5cbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBpbml0aWFsQ29kZSE6IHN0cmluZ1xuXG4gIC8qKiBBIHByaW50ZXIgdGhlIHNlcnZpY2UgZm91bmQgb24gdGhpcyBuZXR3b3JrLCB0byBhc2sgZm9yIGEgY29kZSBhcyBzb29uIGFzIHRoZSBkaWFsb2cgb3BlbnMuICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBpbml0aWFsUHJpbnRlcklkITogc3RyaW5nXG5cbiAgLyoqIEEgcHJpbnRlciB0aGUgTEFOIHNlYXJjaCBmb3VuZCwgYnkgYWRkcmVzcywgdG8gYXNrIGZvciBhIGNvZGUgYXMgc29vbiBhcyB0aGUgZGlhbG9nIG9wZW5zLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgaW5pdGlhbEhvc3QhOiBzdHJpbmdcblxuICBzdGVwOiAnY2hvb3NlJyB8ICdjb25maXJtJyB8ICdkb25lJyA9ICdjaG9vc2UnXG4gIGNvZGUgPSAnJ1xuICBidXN5ID0gZmFsc2VcbiAgZXJyb3I6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIGNsYWltZWQ6IHsgcHJpbnRlcl9pZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcgfSB8IG51bGwgPSBudWxsXG4gIGFza2luZzogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgLyoqIFdoYXQgdGhlIHByaW50ZXIganVzdCBhc2tlZCBmb3IgYSBjb2RlIGlzIGRvaW5nLCBhcyBhIHNlbnRlbmNlLiAqL1xuICBzaG93biA9ICcnXG4gIHRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbFxuICBpY29ucyA9IHsgcHJpbnRlcjogJyRwcmludGVyM2QnIH1cblxuICBnZXQgYWNjb3VudEVtYWlsICgpIHtcbiAgICByZXR1cm4gY2xvdWRTdGF0ZS5hY2NvdW50Py5lbWFpbCA/PyAnJ1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50ZXJzIG5lYXIgdGhpcyBicm93c2VyIHRoYXQgY291bGQgc2hvdyBhIGNvZGU6IGZyb20gdGhlIHNlcnZpY2UsIGFuZFxuICAgKiBmcm9tIHRoZSBMQU4gc2VhcmNoIHdoZXJlIHRoZSBwYWdlIGNhbiBydW4gb25lLiBFYWNoIG1heSBiZSBsaW5rZWQgYWxyZWFkeS5cbiAgICovXG4gIGdldCBuZWFyYnkgKCk6IEFycmF5PHsga2V5OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgbm90ZTogc3RyaW5nLCBjYW5TaG93OiBib29sZWFuLCBjbG91ZD86IENsb3VkTmVhcmJ5UHJpbnRlciwgbGFuPzogTGFuUHJpbnRlciB9PiB7XG4gICAgY29uc3Qgb3V0OiBBcnJheTx7IGtleTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIG5vdGU6IHN0cmluZywgY2FuU2hvdzogYm9vbGVhbiwgY2xvdWQ/OiBDbG91ZE5lYXJieVByaW50ZXIsIGxhbj86IExhblByaW50ZXIgfT4gPSBbXVxuICAgIGZvciAoY29uc3QgYyBvZiBkaXNjb3ZlcnlTdGF0ZS5jbG91ZCkge1xuICAgICAgY29uc3QgbWluZSA9IGNsb3VkU3RhdGUucHJpbnRlcnMuc29tZShwID0+IHAuaWQgPT09IGMucHJpbnRlcklkKVxuICAgICAgb3V0LnB1c2goe1xuICAgICAgICBrZXk6IGMucHJpbnRlcklkLFxuICAgICAgICBuYW1lOiBjLm5hbWUsXG4gICAgICAgIGNsb3VkOiBjLFxuICAgICAgICBjYW5TaG93OiAhYy5saW5rZWQsXG4gICAgICAgIG5vdGU6ICFjLmxpbmtlZFxuICAgICAgICAgID8gJ05vdCBsaW5rZWQgwrcgc2hvdyBpdHMgY29kZSdcbiAgICAgICAgICA6IG1pbmUgPyAnQWxyZWFkeSBpbiB5b3VyIGFjY291bnQnIDogJ0xpbmtlZCB0byBhbm90aGVyIGFjY291bnQgwrcgaXRzIG93bmVyIG11c3QgdW5saW5rIGl0IGZpcnN0J1xuICAgICAgfSlcbiAgICB9XG4gICAgZm9yIChjb25zdCBsIG9mIGRpc2NvdmVyeVN0YXRlLmZvdW5kKSB7XG4gICAgICBpZiAoZGlzY292ZXJ5U3RhdGUuY2xvdWQuc29tZShjID0+IHNhbWVOYW1lZFByaW50ZXIoYy5uYW1lLCBsLm5hbWUpKSkgY29udGludWVcbiAgICAgIGNvbnN0IHsgY2FuU2hvdywgbm90ZSB9ID0gbGFuTGlua0F2YWlsYWJpbGl0eShsLmxpbmspXG4gICAgICBvdXQucHVzaCh7IGtleTogbC5ob3N0LCBuYW1lOiBsLm5hbWUsIGxhbjogbCwgY2FuU2hvdywgbm90ZTogYCR7bC5ob3N0fSDCtyAke25vdGV9YCB9KVxuICAgIH1cbiAgICByZXR1cm4gb3V0XG4gIH1cblxuICBnZXQgc2VhcmNoaW5nICgpIHtcbiAgICByZXR1cm4gZGlzY292ZXJ5U3RhdGUuc2Nhbm5pbmcgfHwgIWRpc2NvdmVyeVN0YXRlLmNsb3VkQ2hlY2tlZFxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgaWYgKHRoaXMuZGVsZXRpbmcpIHJldHVyblxuICAgIHRoaXMuY29kZSA9ICh0aGlzLmluaXRpYWxDb2RlIHx8ICcnKS5yZXBsYWNlKC9cXEQvZywgJycpLnNsaWNlKDAsIDYpXG4gICAgaWYgKHRoaXMuY29kZS5sZW5ndGggPT09IDYpIHRoaXMuY2xhaW0odGhpcy5jb2RlKVxuICAgIGVsc2UgaWYgKHRoaXMuaW5pdGlhbFByaW50ZXJJZCkgdGhpcy5hc2tGb3JDb2RlKHRoaXMuaW5pdGlhbFByaW50ZXJJZCwgdGhpcy5pbml0aWFsUHJpbnRlcklkKVxuICAgIGVsc2UgaWYgKHRoaXMuaW5pdGlhbEhvc3QpIHtcbiAgICAgIGNvbnN0IGxhbiA9IGRpc2NvdmVyeVN0YXRlLmZvdW5kLmZpbmQobCA9PiBsLmhvc3QgPT09IHRoaXMuaW5pdGlhbEhvc3QpXG4gICAgICBpZiAobGFuKSB0aGlzLnNob3dDb2RlKHsga2V5OiBsYW4uaG9zdCwgbmFtZTogbGFuLm5hbWUsIGxhbiB9KVxuICAgIH1cbiAgICByZWZyZXNoTGlua1N0YXRlcygpLmNhdGNoKCgpID0+IHt9KVxuICAgIGRpc2NvdmVyUHJpbnRlcnMoKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuc3RvcFBvbGxpbmcoKVxuICB9XG5cbiAgQFdhdGNoKCdvcGVuJylcbiAgb25PcGVuICh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdmFsdWUpIHRoaXMuc3RvcFBvbGxpbmcoKVxuICB9XG5cbiAgcmVzY2FuICgpIHtcbiAgICBpZiAodGhpcy5kZWxldGluZykgcmV0dXJuXG4gICAgZGlzY292ZXJ5U3RhdGUuY2xvdWRDaGVja2VkID0gZmFsc2VcbiAgICBkaXNjb3ZlclByaW50ZXJzKHRydWUpLmNhdGNoKCgpID0+IHt9KVxuICB9XG5cbiAgLyoqIE1ha2VzIGEgcHJpbnRlciBzaG93IGl0cyBsaW5rIGNvZGUsIHNvIHRoYXQgdGhlIHBlcnNvbiBjYW4gcmVhZCBpdCBhbmQgdHlwZSBpdCBoZXJlLiAqL1xuICBhc3luYyBzaG93Q29kZSAocDogeyBrZXk6IHN0cmluZywgbmFtZTogc3RyaW5nLCBjbG91ZD86IENsb3VkTmVhcmJ5UHJpbnRlciwgbGFuPzogTGFuUHJpbnRlciB9KSB7XG4gICAgaWYgKHRoaXMuZGVsZXRpbmcpIHJldHVyblxuICAgIGlmIChwLmNsb3VkKSByZXR1cm4gdGhpcy5hc2tGb3JDb2RlKHAuY2xvdWQucHJpbnRlcklkLCBwLmtleSwgcC5uYW1lKVxuICAgIGlmICghcC5sYW4pIHJldHVyblxuICAgIHRoaXMuZXJyb3IgPSBudWxsXG4gICAgdGhpcy5zaG93biA9ICcnXG4gICAgdGhpcy5hc2tpbmcgPSBwLmtleVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzaG93TGFuQ29kZShwLmxhbi5hcGlVcmwpXG4gICAgICAvLyBTb21lb25lIGVsc2UgbWF5IGhhdmUgc3RhcnRlZCBpdCwgb3IgbGlua2VkIGl0OiBzYXkgc28sIGFuZCBsZXRcbiAgICAgIC8vIHRoZSBsaXN0IHNob3cgaXQgdG9vLlxuICAgICAgcC5sYW4ubGluayA9IHN0YXR1c1xuICAgICAgY29uc3QgeyBub3RlLCBlcnJvciB9ID0gbGFuQ29kZU91dGNvbWUocC5uYW1lLCBzdGF0dXMpXG4gICAgICB0aGlzLnNob3duID0gbm90ZSA/PyAnJ1xuICAgICAgdGhpcy5lcnJvciA9IGVycm9yID8/IG51bGxcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5lcnJvciA9IChlcnJvciBhcyBFcnJvcikubWVzc2FnZVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmFza2luZyA9IG51bGxcbiAgICB9XG4gIH1cblxuICBhc3luYyBhc2tGb3JDb2RlIChwcmludGVySWQ6IHN0cmluZywga2V5OiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5kZWxldGluZykgcmV0dXJuXG4gICAgdGhpcy5lcnJvciA9IG51bGxcbiAgICB0aGlzLmFza2luZyA9IGtleVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBjbG91ZEFwaS5zdGFydExpbmsocHJpbnRlcklkKVxuICAgICAgY29uc3Qgc2hvd24gPSBuYW1lID8/IGRpc2NvdmVyeVN0YXRlLmNsb3VkLmZpbmQoYyA9PiBjLnByaW50ZXJJZCA9PT0gcHJpbnRlcklkKT8ubmFtZSA/PyAnVGhlIHByaW50ZXInXG4gICAgICB0aGlzLnNob3duID0gYCR7c2hvd259IGlzIHNob3dpbmcgYSBjb2RlIG9uIGl0cyBzY3JlZW4gbm93LiBUeXBlIGl0IGJlbG93LmBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5lcnJvciA9IChlcnJvciBhcyBFcnJvcikubWVzc2FnZVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmFza2luZyA9IG51bGxcbiAgICB9XG4gIH1cblxuICBhc3luYyBjbGFpbSAoY29kZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuZGVsZXRpbmcgfHwgdGhpcy5idXN5IHx8IGNvZGUubGVuZ3RoICE9PSA2KSByZXR1cm5cbiAgICB0aGlzLmVycm9yID0gbnVsbFxuICAgIHRoaXMuYnVzeSA9IHRydWVcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2xhaW1lZCA9IGF3YWl0IGNsb3VkQXBpLmNsYWltKGNvZGUpXG4gICAgICB0aGlzLmNsYWltZWQgPSB7IHByaW50ZXJfaWQ6IGNsYWltZWQucHJpbnRlcl9pZCwgbmFtZTogY2xhaW1lZC5uYW1lIH1cbiAgICAgIHRoaXMuc3RlcCA9ICdjb25maXJtJ1xuICAgICAgdGhpcy5zdGFydFBvbGxpbmcoKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLmVycm9yID0gKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlXG4gICAgICByZWZyZXNoQ2xvdWROZWFyYnkoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5idXN5ID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBzdGFydFBvbGxpbmcgKCkge1xuICAgIHRoaXMuc3RvcFBvbGxpbmcoKVxuICAgIHRoaXMudGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmNsYWltZWQpIHJldHVyblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBzdGF0ZSB9ID0gYXdhaXQgY2xvdWRBcGkubGlua1N0YXRlKHRoaXMuY2xhaW1lZC5wcmludGVyX2lkKVxuICAgICAgICBpZiAoc3RhdGUgPT09ICdsaW5rZWQnKSB7XG4gICAgICAgICAgdGhpcy5zdG9wUG9sbGluZygpXG4gICAgICAgICAgYXdhaXQgcmVmcmVzaFByaW50ZXJzKClcbiAgICAgICAgICByZWZyZXNoTGlua1N0YXRlcygpLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgIHJlZnJlc2hDbG91ZE5lYXJieSgpLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgIHRoaXMuc3RlcCA9ICdkb25lJ1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSAnZGVjbGluZWQnIHx8IHN0YXRlID09PSAnZXhwaXJlZCcpIHtcbiAgICAgICAgICB0aGlzLnN0b3BQb2xsaW5nKClcbiAgICAgICAgICB0aGlzLmVycm9yID0gc3RhdGUgPT09ICdkZWNsaW5lZCdcbiAgICAgICAgICAgID8gJ1RoZSBsaW5rIHdhcyBkZWNsaW5lZCBvbiB0aGUgcHJpbnRlci4nXG4gICAgICAgICAgICA6ICdUaGUgY29kZSBleHBpcmVkLiBTdGFydCBhZ2Fpbi4nXG4gICAgICAgICAgdGhpcy5zdGVwID0gJ2Nob29zZSdcbiAgICAgICAgICB0aGlzLmNvZGUgPSAnJ1xuICAgICAgICAgIHJlZnJlc2hMaW5rU3RhdGVzKCkuY2F0Y2goKCkgPT4ge30pXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggeyAvKiBrZWVwIHdhaXRpbmcgKi8gfVxuICAgIH0sIDE1MDApXG4gIH1cblxuICBzdG9wUG9sbGluZyAoKSB7XG4gICAgaWYgKHRoaXMudGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMudGltZXIpXG4gICAgdGhpcy50aW1lciA9IG51bGxcbiAgfVxuXG4gIHJlc2V0ICgpIHtcbiAgICB0aGlzLnN0b3BQb2xsaW5nKClcbiAgICB0aGlzLnN0ZXAgPSAnY2hvb3NlJ1xuICAgIHRoaXMuY29kZSA9ICcnXG4gICAgdGhpcy5jbGFpbWVkID0gbnVsbFxuICB9XG5cbiAgYXN5bmMgb3BlblByaW50ZXIgKCkge1xuICAgIGNvbnN0IGlkID0gdGhpcy5jbGFpbWVkPy5wcmludGVyX2lkXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICBpZiAoaWQpIGF3YWl0IGFjdGl2YXRlQ2xvdWRQcmludGVyKGlkKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5tdW9uLWNsb3VkLWRpYWxvZyB7XG4gICZfX2xhYmVsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgbWluLWhlaWdodDogMjRweDtcbiAgICBtYXJnaW4tYm90dG9tOiA2cHg7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC0yeHMsIDExcHgpO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDhlbTtcbiAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAmX19zY2FuIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBsZXR0ZXItc3BhY2luZzogMDtcbiAgICB0ZXh0LXRyYW5zZm9ybTogbm9uZTtcbiAgfVxuXG4gICZfX2xpc3Qge1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLW0zZC1yYWRpdXMtbWQpO1xuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgJl9fZW1wdHkge1xuICAgIHBhZGRpbmc6IDEycHg7XG4gICAgYm9yZGVyOiAxcHggZGFzaGVkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLW0zZC1yYWRpdXMtbWQpO1xuICAgIGZvbnQtc2l6ZTogdmFyKC0tbTNkLXRleHQtc20pO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cbn1cblxuLm11b24tY2xvdWQtY29uZmlybSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogMTZweDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tdW9uLWNsb3VkL0xpbmtQcmludGVyRGlhbG9nLnZ1ZSJ9