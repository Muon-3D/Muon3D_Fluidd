/* unplugin-vue-components disabled */import { VProgressCircular as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { activationState } from "/src/services/muon-cloud/activate.ts";
import { cloudState, reachablePrinters } from "/src/services/muon-cloud/state.ts";
import { consolePresence } from "/src/services/muon-cloud/presence.ts";
import { startPairing } from "/src/services/muon-ble/pairing.ts";
import { openPrinterAt, printerPagesState, resolveSlug } from "/src/services/printer-pages/index.ts";
let PrinterOpening = class extends Vue {
  slug;
  get presence() {
    const target = resolveSlug(this.slug);
    const printer = target?.kind === "cloud" ? cloudState.printers.find((p) => p.id === target.printerId) : void 0;
    const status = printer ? cloudState.status[printer.id] : void 0;
    return printer ? consolePresence(printer, status?.updatedAt ?? Date.now()) : "online";
  }
  get name() {
    const target = resolveSlug(this.slug);
    if (target?.kind === "local") return target.instance.name || this.slug;
    if (target?.kind === "cloud") return reachablePrinters().find((p) => p.id === target.printerId)?.name ?? this.slug;
    return this.slug;
  }
  /** Only once the account's printers are known: one of them may be it. */
  get missing() {
    return printerPagesState.missing === this.slug && (cloudState.ready || !cloudState.account);
  }
  get error() {
    return activationState.switching ? null : activationState.error;
  }
  get fallbackUrl() {
    return activationState.fallbackUrl;
  }
  /** The printer that refused this browser over Bluetooth, when it is the one this page opens. */
  get pairingOffer() {
    const target = resolveSlug(this.slug);
    const id = activationState.pairing;
    return id && target?.kind === "cloud" && target.printerId === id ? id : null;
  }
  pair() {
    if (this.pairingOffer) startPairing(this.pairingOffer).catch(() => {
    });
  }
  onPresence(now, was) {
    if (now !== "online" || was === "online") return;
    if (!this.error || this.pairingOffer || resolveSlug(this.slug)?.kind !== "cloud") return;
    this.retry();
  }
  retry() {
    activationState.error = null;
    openPrinterAt(this.slug).catch(() => {
    });
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], PrinterOpening.prototype, "slug", 2);
__decorateClass([
  Watch("presence")
], PrinterOpening.prototype, "onPresence", 1);
PrinterOpening = __decorateClass([
  Component({})
], PrinterOpening);
const _sfc_main = PrinterOpening;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "printer-opening", attrs: { "data-tid": "printer-opening" } }, [_vm.missing ? [_c(__unplugin_components_0, { staticClass: "mb-4 printer-opening__icon", attrs: { "x-large": "" } }, [_vm._v(" $printer3d ")]), _c("h2", { staticClass: "printer-opening__title" }, [_vm._v(" No printer called " + _vm._s(_vm.slug) + " here ")]), _c("p", { staticClass: "printer-opening__text" }, [_vm._v(" This browser doesn't know that printer. It may be on another network, saved in another browser, or linked to another account. ")]), _c(__unplugin_components_1, { attrs: { "color": "primary", "to": "/", "data-tid": "printer-opening-all" } }, [_vm._v(" All printers ")])] : _vm.error ? [_c(__unplugin_components_2, { staticClass: "mb-4 printer-opening__icon", attrs: { "x-large": "" } }, [_vm._v(" $alertCircle ")]), _c("h2", { staticClass: "printer-opening__title" }, [_vm._v(" " + _vm._s(_vm.presence === "offline" ? "Offline" : `Couldn't open ${_vm.name}`) + " ")]), _c("p", { staticClass: "printer-opening__text" }, [_vm._v(" " + _vm._s(_vm.error) + " ")]), _c("div", { staticClass: "printer-opening__actions" }, [_vm.fallbackUrl ? _c(__unplugin_components_3, { attrs: { "color": "primary", "href": _vm.fallbackUrl } }, [_vm._v(" Open its own page ")]) : _vm._e(), _vm.pairingOffer ? _c(__unplugin_components_4, { attrs: { "color": "primary", "data-tid": "pair-offer" }, on: { "click": _vm.pair } }, [_vm._v(" Pair this browser ")]) : _vm._e(), _c(__unplugin_components_5, { attrs: { "text": "" }, on: { "click": _vm.retry } }, [_vm._v(" Try again ")]), _c(__unplugin_components_6, { attrs: { "text": "", "to": "/" } }, [_vm._v(" All printers ")])], 1)] : [_c(__unplugin_components_7, { staticClass: "mb-4", attrs: { "indeterminate": "", "size": "40", "width": "3", "color": "primary" } }), _c("h2", { staticClass: "printer-opening__title" }, [_vm._v(" " + _vm._s(_vm.presence === "reconnecting" ? "Reconnecting\u2026" : `Opening ${_vm.name}\u2026`) + " ")])]], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/PrinterOpening.vue?vue&type=style&index=0&scoped=6272b597&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "6272b597",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/PrinterOpening.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVFBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUEsRUFTQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsRUFDQTtBQUNBO0FBekRBO0FBQUEsRUFEQTtBQUFBLEdBREEsZUFFQTtBQStDQTtBQUFBLEVBREE7QUFBQSxHQWhEQSxlQWlEQTtBQWpEQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmludGVyT3BlbmluZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJwcmludGVyLW9wZW5pbmdcIlxuICAgIGRhdGEtdGlkPVwicHJpbnRlci1vcGVuaW5nXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSB2LWlmPVwibWlzc2luZ1wiPlxuICAgICAgPHYtaWNvblxuICAgICAgICB4LWxhcmdlXG4gICAgICAgIGNsYXNzPVwibWItNCBwcmludGVyLW9wZW5pbmdfX2ljb25cIlxuICAgICAgPlxuICAgICAgICAkcHJpbnRlcjNkXG4gICAgICA8L3YtaWNvbj5cbiAgICAgIDxoMiBjbGFzcz1cInByaW50ZXItb3BlbmluZ19fdGl0bGVcIj5cbiAgICAgICAgTm8gcHJpbnRlciBjYWxsZWQge3sgc2x1ZyB9fSBoZXJlXG4gICAgICA8L2gyPlxuICAgICAgPHAgY2xhc3M9XCJwcmludGVyLW9wZW5pbmdfX3RleHRcIj5cbiAgICAgICAgVGhpcyBicm93c2VyIGRvZXNuJ3Qga25vdyB0aGF0IHByaW50ZXIuIEl0IG1heSBiZSBvbiBhbm90aGVyIG5ldHdvcmssXG4gICAgICAgIHNhdmVkIGluIGFub3RoZXIgYnJvd3Nlciwgb3IgbGlua2VkIHRvIGFub3RoZXIgYWNjb3VudC5cbiAgICAgIDwvcD5cbiAgICAgIDx2LWJ0blxuICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICB0bz1cIi9cIlxuICAgICAgICBkYXRhLXRpZD1cInByaW50ZXItb3BlbmluZy1hbGxcIlxuICAgICAgPlxuICAgICAgICBBbGwgcHJpbnRlcnNcbiAgICAgIDwvdi1idG4+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDx0ZW1wbGF0ZSB2LWVsc2UtaWY9XCJlcnJvclwiPlxuICAgICAgPHYtaWNvblxuICAgICAgICB4LWxhcmdlXG4gICAgICAgIGNsYXNzPVwibWItNCBwcmludGVyLW9wZW5pbmdfX2ljb25cIlxuICAgICAgPlxuICAgICAgICAkYWxlcnRDaXJjbGVcbiAgICAgIDwvdi1pY29uPlxuICAgICAgPGgyIGNsYXNzPVwicHJpbnRlci1vcGVuaW5nX190aXRsZVwiPlxuICAgICAgICB7eyBwcmVzZW5jZSA9PT0gJ29mZmxpbmUnID8gJ09mZmxpbmUnIDogYENvdWxkbid0IG9wZW4gJHtuYW1lfWAgfX1cbiAgICAgIDwvaDI+XG4gICAgICA8cCBjbGFzcz1cInByaW50ZXItb3BlbmluZ19fdGV4dFwiPlxuICAgICAgICB7eyBlcnJvciB9fVxuICAgICAgPC9wPlxuICAgICAgPGRpdiBjbGFzcz1cInByaW50ZXItb3BlbmluZ19fYWN0aW9uc1wiPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB2LWlmPVwiZmFsbGJhY2tVcmxcIlxuICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgOmhyZWY9XCJmYWxsYmFja1VybFwiXG4gICAgICAgID5cbiAgICAgICAgICBPcGVuIGl0cyBvd24gcGFnZVxuICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB2LWlmPVwicGFpcmluZ09mZmVyXCJcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGFpci1vZmZlclwiXG4gICAgICAgICAgQGNsaWNrPVwicGFpclwiXG4gICAgICAgID5cbiAgICAgICAgICBQYWlyIHRoaXMgYnJvd3NlclxuICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgQGNsaWNrPVwicmV0cnlcIlxuICAgICAgICA+XG4gICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgIDwvdi1idG4+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHRleHRcbiAgICAgICAgICB0bz1cIi9cIlxuICAgICAgICA+XG4gICAgICAgICAgQWxsIHByaW50ZXJzXG4gICAgICAgIDwvdi1idG4+XG4gICAgICA8L2Rpdj5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgIGluZGV0ZXJtaW5hdGVcbiAgICAgICAgc2l6ZT1cIjQwXCJcbiAgICAgICAgd2lkdGg9XCIzXCJcbiAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgY2xhc3M9XCJtYi00XCJcbiAgICAgIC8+XG4gICAgICA8aDIgY2xhc3M9XCJwcmludGVyLW9wZW5pbmdfX3RpdGxlXCI+XG4gICAgICAgIHt7IHByZXNlbmNlID09PSAncmVjb25uZWN0aW5nJyA/ICdSZWNvbm5lY3RpbmfigKYnIDogYE9wZW5pbmcgJHtuYW1lfeKApmAgfX1cbiAgICAgIDwvaDI+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IGFjdGl2YXRpb25TdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9hY3RpdmF0ZSdcbmltcG9ydCB7IGNsb3VkU3RhdGUsIHJlYWNoYWJsZVByaW50ZXJzIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgY29uc29sZVByZXNlbmNlLCB0eXBlIENsb3VkUHJlc2VuY2UgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvcHJlc2VuY2UnXG5pbXBvcnQgeyBzdGFydFBhaXJpbmcgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3BhaXJpbmcnXG5pbXBvcnQgeyBvcGVuUHJpbnRlckF0LCBwcmludGVyUGFnZXNTdGF0ZSwgcmVzb2x2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5cbi8qKlxuICogU2hvd24gb24gYSBwcmludGVyJ3MgcGFnZSB3aGlsZSBGbHVpZGQgaXMgb24gYW5vdGhlciBwcmludGVyOiBvcGVuaW5nIHRoZVxuICogb25lIHRoZSBhZGRyZXNzIG5hbWVzLCBvciB3aHkgaXQgY2FuJ3QuIE5ldmVyIHRoZSBsYXN0IHByaW50ZXIncyBwYWdlIHVuZGVyXG4gKiB0aGlzIHByaW50ZXIncyBhZGRyZXNzLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJpbnRlck9wZW5pbmcgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgc2x1ZyE6IHN0cmluZ1xuXG4gIGdldCBwcmVzZW5jZSAoKTogQ2xvdWRQcmVzZW5jZSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gcmVzb2x2ZVNsdWcodGhpcy5zbHVnKVxuICAgIGNvbnN0IHByaW50ZXIgPSB0YXJnZXQ/LmtpbmQgPT09ICdjbG91ZCcgPyBjbG91ZFN0YXRlLnByaW50ZXJzLmZpbmQocCA9PiBwLmlkID09PSB0YXJnZXQucHJpbnRlcklkKSA6IHVuZGVmaW5lZFxuICAgIGNvbnN0IHN0YXR1cyA9IHByaW50ZXIgPyBjbG91ZFN0YXRlLnN0YXR1c1twcmludGVyLmlkXSA6IHVuZGVmaW5lZFxuICAgIHJldHVybiBwcmludGVyID8gY29uc29sZVByZXNlbmNlKHByaW50ZXIsIHN0YXR1cz8udXBkYXRlZEF0ID8/IERhdGUubm93KCkpIDogJ29ubGluZSdcbiAgfVxuXG4gIGdldCBuYW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVTbHVnKHRoaXMuc2x1ZylcbiAgICBpZiAodGFyZ2V0Py5raW5kID09PSAnbG9jYWwnKSByZXR1cm4gdGFyZ2V0Lmluc3RhbmNlLm5hbWUgfHwgdGhpcy5zbHVnXG4gICAgaWYgKHRhcmdldD8ua2luZCA9PT0gJ2Nsb3VkJykgcmV0dXJuIHJlYWNoYWJsZVByaW50ZXJzKCkuZmluZChwID0+IHAuaWQgPT09IHRhcmdldC5wcmludGVySWQpPy5uYW1lID8/IHRoaXMuc2x1Z1xuICAgIHJldHVybiB0aGlzLnNsdWdcbiAgfVxuXG4gIC8qKiBPbmx5IG9uY2UgdGhlIGFjY291bnQncyBwcmludGVycyBhcmUga25vd246IG9uZSBvZiB0aGVtIG1heSBiZSBpdC4gKi9cbiAgZ2V0IG1pc3NpbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwcmludGVyUGFnZXNTdGF0ZS5taXNzaW5nID09PSB0aGlzLnNsdWcgJiYgKGNsb3VkU3RhdGUucmVhZHkgfHwgIWNsb3VkU3RhdGUuYWNjb3VudClcbiAgfVxuXG4gIGdldCBlcnJvciAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIGFjdGl2YXRpb25TdGF0ZS5zd2l0Y2hpbmcgPyBudWxsIDogYWN0aXZhdGlvblN0YXRlLmVycm9yXG4gIH1cblxuICBnZXQgZmFsbGJhY2tVcmwgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBhY3RpdmF0aW9uU3RhdGUuZmFsbGJhY2tVcmxcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlciB0aGF0IHJlZnVzZWQgdGhpcyBicm93c2VyIG92ZXIgQmx1ZXRvb3RoLCB3aGVuIGl0IGlzIHRoZSBvbmUgdGhpcyBwYWdlIG9wZW5zLiAqL1xuICBnZXQgcGFpcmluZ09mZmVyICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCB0YXJnZXQgPSByZXNvbHZlU2x1Zyh0aGlzLnNsdWcpXG4gICAgY29uc3QgaWQgPSBhY3RpdmF0aW9uU3RhdGUucGFpcmluZ1xuICAgIHJldHVybiBpZCAmJiB0YXJnZXQ/LmtpbmQgPT09ICdjbG91ZCcgJiYgdGFyZ2V0LnByaW50ZXJJZCA9PT0gaWQgPyBpZCA6IG51bGxcbiAgfVxuXG4gIHBhaXIgKCkge1xuICAgIGlmICh0aGlzLnBhaXJpbmdPZmZlcikgc3RhcnRQYWlyaW5nKHRoaXMucGFpcmluZ09mZmVyKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcHJpbnRlciB3YXMgc3dpdGNoZWQgb24gd2hpbGUgdGhpcyBwYWdlIHNhaWQgaXQgY291bGQgbm90IG9wZW4gaXRcbiAgICogKEphY2ssIDE3IE5vdiwgS0FOLTM3ODMpOiB0aGUgYWNjb3VudCdzIHByaW50ZXIgbGlzdCBzYXlzIG9ubGluZSBub3csIHNvXG4gICAqIG9wZW4gaXQgYWdhaW4sIHdpdGggbm8gcmVmcmVzaCBhbmQgbm8gY2xpY2suIE9ubHkgb24gdGhlIGNoYW5nZSB0byBvbmxpbmUsXG4gICAqIHNvIGEgcHJpbnRlciB0aGF0IGlzIG9ubGluZSBhbmQgc3RpbGwgZmFpbHMgdG8gb3BlbiBpcyBub3QgcmV0cmllZCBpbiBhIGxvb3AuXG4gICAqL1xuICBAV2F0Y2goJ3ByZXNlbmNlJylcbiAgb25QcmVzZW5jZSAobm93OiBDbG91ZFByZXNlbmNlLCB3YXM6IENsb3VkUHJlc2VuY2UpIHtcbiAgICBpZiAobm93ICE9PSAnb25saW5lJyB8fCB3YXMgPT09ICdvbmxpbmUnKSByZXR1cm5cbiAgICBpZiAoIXRoaXMuZXJyb3IgfHwgdGhpcy5wYWlyaW5nT2ZmZXIgfHwgcmVzb2x2ZVNsdWcodGhpcy5zbHVnKT8ua2luZCAhPT0gJ2Nsb3VkJykgcmV0dXJuXG4gICAgdGhpcy5yZXRyeSgpXG4gIH1cblxuICByZXRyeSAoKSB7XG4gICAgYWN0aXZhdGlvblN0YXRlLmVycm9yID0gbnVsbFxuICAgIG9wZW5QcmludGVyQXQodGhpcy5zbHVnKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5wcmludGVyLW9wZW5pbmcge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBtaW4taGVpZ2h0OiA2MHZoO1xuICBwYWRkaW5nOiAyNHB4O1xufVxuXG4ucHJpbnRlci1vcGVuaW5nX19pY29uIHtcbiAgb3BhY2l0eTogLjY7XG59XG5cbi5wcmludGVyLW9wZW5pbmdfX3RpdGxlIHtcbiAgZm9udC1zaXplOiAyMnB4O1xuICBmb250LXdlaWdodDogNjAwO1xuICBtYXJnaW4tYm90dG9tOiA4cHg7XG59XG5cbi5wcmludGVyLW9wZW5pbmdfX3RleHQge1xuICBtYXgtd2lkdGg6IDQ0MHB4O1xuICBvcGFjaXR5OiAuNzU7XG4gIG1hcmdpbi1ib3R0b206IDIwcHg7XG59XG5cbi5wcmludGVyLW9wZW5pbmdfX2FjdGlvbnMge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LXdyYXA6IHdyYXA7XG4gIGdhcDogOHB4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbn1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tdW9uLWNsb3VkL1ByaW50ZXJPcGVuaW5nLnZ1ZSJ9