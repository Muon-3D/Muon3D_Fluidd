/* unplugin-vue-components disabled */import __unplugin_components_7 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_6 from "/src/components/ui/AppBtn.vue";
import { VProgressCircular as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_4 from "/src/components/ui/AppBtn.vue";
import { VTextField as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_1 from "/src/components/ui/AppBtn.vue";
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
import { Component, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { cancelPairing, pairingState, startPairing, submitPairingCode } from "/src/services/muon-ble/pairing.ts";
import { cloudState, reachablePrinters } from "/src/services/muon-cloud/state.ts";
import { printerHomePath } from "/src/services/printer-pages/index.ts";
import SetupStepCard from "/src/components/muon-setup/SetupStepCard.vue";
import BluetoothSheet from "/src/components/muon-ble/BluetoothSheet.vue";
import BluetoothCodeBoxes from "/src/components/muon-ble/BluetoothCodeBoxes.vue";
import BluetoothPrinterRow from "/src/components/muon-ble/BluetoothPrinterRow.vue";
let BluetoothPairDialog = class extends Vue {
  code = "";
  get state() {
    return pairingState;
  }
  get printerName() {
    const id = pairingState.printerId;
    return reachablePrinters().find((p) => p.id === id)?.name || "the printer";
  }
  /** Step 1 finds it; the code and the printer's Confirm are step 2. */
  get step() {
    return pairingState.phase === "code" || pairingState.phase === "waiting" ? 2 : 1;
  }
  onPhase(phase) {
    if (phase === "code" || phase === "idle") this.code = "";
  }
  async submit() {
    const id = pairingState.printerId;
    await submitPairingCode(this.code);
    if (id && pairingState.phase === "idle" && cloudState.activePrinterId === id) {
      await this.$router.push(printerHomePath()).catch(() => {
      });
    }
  }
  cancel() {
    cancelPairing();
  }
  async retry() {
    const id = pairingState.printerId;
    if (!id) return;
    await startPairing(id);
    if (pairingState.phase === "idle" && cloudState.activePrinterId === id) {
      await this.$router.push(printerHomePath()).catch(() => {
      });
    }
  }
};
__decorateClass([
  Watch("state.phase")
], BluetoothPairDialog.prototype, "onPhase", 1);
BluetoothPairDialog = __decorateClass([
  Component({ components: { BluetoothSheet, BluetoothCodeBoxes, BluetoothPrinterRow, SetupStepCard } })
], BluetoothPairDialog);
const _sfc_main = BluetoothPairDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("bluetooth-sheet", { attrs: { "value": _vm.state.phase !== "idle", "step": _vm.step, "of": 2, "persistent": "", "label": "Pair this browser", "close-tid": "pair-close" }, on: { "close": _vm.cancel } }, [_vm.state.phase === "connecting" ? _c("setup-step-card", { attrs: { "flat": "", "title": "Find your printer", "sub": "Turn the printer on and keep it within a few metres of this device.", "data-tid": "pair-connecting" }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_0, { staticClass: "setup-step__back", attrs: { "text": "", "data-tid": "pair-cancel" }, on: { "click": _vm.cancel } }, [_vm._v(" Cancel ")])];
  }, proxy: true }], null, false, 4109234863) }, [_c("bluetooth-printer-row", { attrs: { "name": _vm.printerName, "line": "Pairing this browser", "busy": "Connecting\u2026" } })], 1) : _vm.state.phase === "code" ? _c("setup-step-card", { attrs: { "flat": "", "title": "Check the code", "sub": `${_vm.printerName} is locked. Ask its owner to share it with you, or enter the code shown on the printer.`, "data-tid": "pair-code-step" }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_1, { staticClass: "setup-step__back", attrs: { "text": "", "data-tid": "pair-cancel" }, on: { "click": _vm.cancel } }, [_vm._v(" Cancel ")]), _c(__unplugin_components_2, { attrs: { "color": "primary", "data-tid": "pair-submit" }, on: { "click": _vm.submit } }, [_vm._v(" Pair ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "muon-ble-pair__label" }, [_vm._v(" " + _vm._s(_vm.printerName) + " shows these six characters too ")]), _c("bluetooth-code-boxes", { attrs: { "code": _vm.state.comparison, "data-tid": "pair-sas" } }), _c(__unplugin_components_3, { attrs: { "data-tid": "pair-code", "label": "8-digit code from the printer", "inputmode": "numeric", "autocomplete": "off", "outlined": "", "dense": "", "hide-details": "auto" }, on: { "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    return _vm.submit.apply(null, arguments);
  } }, model: { value: _vm.code, callback: function($$v) {
    _vm.code = $$v;
  }, expression: "code" } }), _vm.state.message ? _c("p", { staticClass: "muon-ble-pair__error", attrs: { "data-tid": "pair-message" } }, [_vm._v(" " + _vm._s(_vm.state.message) + " ")]) : _vm._e()], 1) : _vm.state.phase === "waiting" ? _c("setup-step-card", { attrs: { "flat": "", "title": "Confirm on the printer", "sub": "Check its six characters are these, choose what Control may do, and press Confirm.", "data-tid": "pair-waiting" }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_4, { staticClass: "setup-step__back", attrs: { "text": "", "data-tid": "pair-cancel" }, on: { "click": _vm.cancel } }, [_vm._v(" Cancel ")])];
  }, proxy: true }]) }, [_c("bluetooth-code-boxes", { attrs: { "code": _vm.state.comparison, "data-tid": "pair-waiting-sas" } }), _c("p", { staticClass: "muon-ble-pair__body muon-ble-pair__wait" }, [_c(__unplugin_components_5, { attrs: { "indeterminate": "", "size": "14", "width": "2" } }), _vm._v(" Waiting for " + _vm._s(_vm.printerName) + ". This ends by itself after 2 minutes. ")], 1)], 1) : _c("setup-step-card", { attrs: { "flat": "", "title": "Pairing didn't finish", "data-tid": "pair-failed" }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_6, { staticClass: "setup-step__back", attrs: { "text": "", "data-tid": "pair-cancel" }, on: { "click": _vm.cancel } }, [_vm._v(" Close ")]), _c(__unplugin_components_7, { attrs: { "color": "primary", "data-tid": "pair-retry" }, on: { "click": _vm.retry } }, [_vm._v(" Try again ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "muon-ble-pair__body", attrs: { "data-tid": "pair-message" } }, [_vm._v(" " + _vm._s(_vm.state.message) + " ")])])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-ble/BluetoothPairDialog.vue?vue&type=style&index=0&scoped=5c4d0950&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5c4d0950",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-ble/BluetoothPairDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFRQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFBQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExQkE7QUFBQSxFQURBO0FBQUEsR0FqQkEsb0JBa0JBO0FBbEJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkJsdWV0b290aFBhaXJEaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGJsdWV0b290aC1zaGVldFxuICAgIDp2YWx1ZT1cInN0YXRlLnBoYXNlICE9PSAnaWRsZSdcIlxuICAgIDpzdGVwPVwic3RlcFwiXG4gICAgOm9mPVwiMlwiXG4gICAgcGVyc2lzdGVudFxuICAgIGxhYmVsPVwiUGFpciB0aGlzIGJyb3dzZXJcIlxuICAgIGNsb3NlLXRpZD1cInBhaXItY2xvc2VcIlxuICAgIEBjbG9zZT1cImNhbmNlbFwiXG4gID5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWlmPVwic3RhdGUucGhhc2UgPT09ICdjb25uZWN0aW5nJ1wiXG4gICAgICBmbGF0XG4gICAgICB0aXRsZT1cIkZpbmQgeW91ciBwcmludGVyXCJcbiAgICAgIHN1Yj1cIlR1cm4gdGhlIHByaW50ZXIgb24gYW5kIGtlZXAgaXQgd2l0aGluIGEgZmV3IG1ldHJlcyBvZiB0aGlzIGRldmljZS5cIlxuICAgICAgZGF0YS10aWQ9XCJwYWlyLWNvbm5lY3RpbmdcIlxuICAgID5cbiAgICAgIDxibHVldG9vdGgtcHJpbnRlci1yb3dcbiAgICAgICAgOm5hbWU9XCJwcmludGVyTmFtZVwiXG4gICAgICAgIGxpbmU9XCJQYWlyaW5nIHRoaXMgYnJvd3NlclwiXG4gICAgICAgIGJ1c3k9XCJDb25uZWN0aW5n4oCmXCJcbiAgICAgIC8+XG4gICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgY2xhc3M9XCJzZXR1cC1zdGVwX19iYWNrXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhaXItY2FuY2VsXCJcbiAgICAgICAgICBAY2xpY2s9XCJjYW5jZWxcIlxuICAgICAgICA+XG4gICAgICAgICAgQ2FuY2VsXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2UtaWY9XCJzdGF0ZS5waGFzZSA9PT0gJ2NvZGUnXCJcbiAgICAgIGZsYXRcbiAgICAgIHRpdGxlPVwiQ2hlY2sgdGhlIGNvZGVcIlxuICAgICAgOnN1Yj1cImAke3ByaW50ZXJOYW1lfSBpcyBsb2NrZWQuIEFzayBpdHMgb3duZXIgdG8gc2hhcmUgaXQgd2l0aCB5b3UsIG9yIGVudGVyIHRoZSBjb2RlIHNob3duIG9uIHRoZSBwcmludGVyLmBcIlxuICAgICAgZGF0YS10aWQ9XCJwYWlyLWNvZGUtc3RlcFwiXG4gICAgPlxuICAgICAgPHAgY2xhc3M9XCJtdW9uLWJsZS1wYWlyX19sYWJlbFwiPlxuICAgICAgICB7eyBwcmludGVyTmFtZSB9fSBzaG93cyB0aGVzZSBzaXggY2hhcmFjdGVycyB0b29cbiAgICAgIDwvcD5cbiAgICAgIDxibHVldG9vdGgtY29kZS1ib3hlc1xuICAgICAgICA6Y29kZT1cInN0YXRlLmNvbXBhcmlzb25cIlxuICAgICAgICBkYXRhLXRpZD1cInBhaXItc2FzXCJcbiAgICAgIC8+XG4gICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgIHYtbW9kZWw9XCJjb2RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJwYWlyLWNvZGVcIlxuICAgICAgICBsYWJlbD1cIjgtZGlnaXQgY29kZSBmcm9tIHRoZSBwcmludGVyXCJcbiAgICAgICAgaW5wdXRtb2RlPVwibnVtZXJpY1wiXG4gICAgICAgIGF1dG9jb21wbGV0ZT1cIm9mZlwiXG4gICAgICAgIG91dGxpbmVkXG4gICAgICAgIGRlbnNlXG4gICAgICAgIGhpZGUtZGV0YWlscz1cImF1dG9cIlxuICAgICAgICBAa2V5dXAuZW50ZXI9XCJzdWJtaXRcIlxuICAgICAgLz5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJzdGF0ZS5tZXNzYWdlXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLWJsZS1wYWlyX19lcnJvclwiXG4gICAgICAgIGRhdGEtdGlkPVwicGFpci1tZXNzYWdlXCJcbiAgICAgID5cbiAgICAgICAge3sgc3RhdGUubWVzc2FnZSB9fVxuICAgICAgPC9wPlxuICAgICAgPHRlbXBsYXRlICNmb290ZXI+XG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgdGV4dFxuICAgICAgICAgIGNsYXNzPVwic2V0dXAtc3RlcF9fYmFja1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYWlyLWNhbmNlbFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2FuY2VsXCJcbiAgICAgICAgPlxuICAgICAgICAgIENhbmNlbFxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhaXItc3VibWl0XCJcbiAgICAgICAgICBAY2xpY2s9XCJzdWJtaXRcIlxuICAgICAgICA+XG4gICAgICAgICAgUGFpclxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvc2V0dXAtc3RlcC1jYXJkPlxuXG4gICAgPHNldHVwLXN0ZXAtY2FyZFxuICAgICAgdi1lbHNlLWlmPVwic3RhdGUucGhhc2UgPT09ICd3YWl0aW5nJ1wiXG4gICAgICBmbGF0XG4gICAgICB0aXRsZT1cIkNvbmZpcm0gb24gdGhlIHByaW50ZXJcIlxuICAgICAgc3ViPVwiQ2hlY2sgaXRzIHNpeCBjaGFyYWN0ZXJzIGFyZSB0aGVzZSwgY2hvb3NlIHdoYXQgQ29udHJvbCBtYXkgZG8sIGFuZCBwcmVzcyBDb25maXJtLlwiXG4gICAgICBkYXRhLXRpZD1cInBhaXItd2FpdGluZ1wiXG4gICAgPlxuICAgICAgPGJsdWV0b290aC1jb2RlLWJveGVzXG4gICAgICAgIDpjb2RlPVwic3RhdGUuY29tcGFyaXNvblwiXG4gICAgICAgIGRhdGEtdGlkPVwicGFpci13YWl0aW5nLXNhc1wiXG4gICAgICAvPlxuICAgICAgPHAgY2xhc3M9XCJtdW9uLWJsZS1wYWlyX19ib2R5IG11b24tYmxlLXBhaXJfX3dhaXRcIj5cbiAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgc2l6ZT1cIjE0XCJcbiAgICAgICAgICB3aWR0aD1cIjJcIlxuICAgICAgICAvPlxuICAgICAgICBXYWl0aW5nIGZvciB7eyBwcmludGVyTmFtZSB9fS4gVGhpcyBlbmRzIGJ5IGl0c2VsZiBhZnRlciAyIG1pbnV0ZXMuXG4gICAgICA8L3A+XG4gICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgY2xhc3M9XCJzZXR1cC1zdGVwX19iYWNrXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhaXItY2FuY2VsXCJcbiAgICAgICAgICBAY2xpY2s9XCJjYW5jZWxcIlxuICAgICAgICA+XG4gICAgICAgICAgQ2FuY2VsXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2VcbiAgICAgIGZsYXRcbiAgICAgIHRpdGxlPVwiUGFpcmluZyBkaWRuJ3QgZmluaXNoXCJcbiAgICAgIGRhdGEtdGlkPVwicGFpci1mYWlsZWRcIlxuICAgID5cbiAgICAgIDxwXG4gICAgICAgIGNsYXNzPVwibXVvbi1ibGUtcGFpcl9fYm9keVwiXG4gICAgICAgIGRhdGEtdGlkPVwicGFpci1tZXNzYWdlXCJcbiAgICAgID5cbiAgICAgICAge3sgc3RhdGUubWVzc2FnZSB9fVxuICAgICAgPC9wPlxuICAgICAgPHRlbXBsYXRlICNmb290ZXI+XG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgdGV4dFxuICAgICAgICAgIGNsYXNzPVwic2V0dXAtc3RlcF9fYmFja1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYWlyLWNhbmNlbFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2FuY2VsXCJcbiAgICAgICAgPlxuICAgICAgICAgIENsb3NlXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGFpci1yZXRyeVwiXG4gICAgICAgICAgQGNsaWNrPVwicmV0cnlcIlxuICAgICAgICA+XG4gICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG4gIDwvYmx1ZXRvb3RoLXNoZWV0PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBjYW5jZWxQYWlyaW5nLCBwYWlyaW5nU3RhdGUsIHN0YXJ0UGFpcmluZywgc3VibWl0UGFpcmluZ0NvZGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3BhaXJpbmcnXG5pbXBvcnQgeyBjbG91ZFN0YXRlLCByZWFjaGFibGVQcmludGVycyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCB7IHByaW50ZXJIb21lUGF0aCB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCBTZXR1cFN0ZXBDYXJkIGZyb20gJ0AvY29tcG9uZW50cy9tdW9uLXNldHVwL1NldHVwU3RlcENhcmQudnVlJ1xuaW1wb3J0IEJsdWV0b290aFNoZWV0IGZyb20gJy4vQmx1ZXRvb3RoU2hlZXQudnVlJ1xuaW1wb3J0IEJsdWV0b290aENvZGVCb3hlcyBmcm9tICcuL0JsdWV0b290aENvZGVCb3hlcy52dWUnXG5pbXBvcnQgQmx1ZXRvb3RoUHJpbnRlclJvdyBmcm9tICcuL0JsdWV0b290aFByaW50ZXJSb3cudnVlJ1xuXG4vKipcbiAqIFBhaXJzIHRoaXMgYnJvd3NlciB3aXRoIGEgcHJpbnRlciBvdmVyIEJsdWV0b290aCAoS0FOLTEyNTM7IFNFQy03KS4gVGhlXG4gKiBwcmludGVyIGlzIGxvY2tlZDogdGhlIHBlcnNvbiByZWFkcyB0aGUgY29kZSBvZmYgaXRzIHNjcmVlbiBhbmQgY29uZmlybXMgdGhlcmUuIENvbnRyb2wgbmV2ZXIgYXNrcyBmb3IgYSByb2xlOiB0aGUgcHJpbnRlcidzIHBhbmVsIGRvZXMuXG4gKiBMYWlkIG91dCBhcyB0aGUgQmx1ZXRvb3RoIHNoZWV0OiBmaW5kIHRoZSBwcmludGVyLCB0aGVuIGNoZWNrIHRoZSBjb2RlLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBCbHVldG9vdGhTaGVldCwgQmx1ZXRvb3RoQ29kZUJveGVzLCBCbHVldG9vdGhQcmludGVyUm93LCBTZXR1cFN0ZXBDYXJkIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJsdWV0b290aFBhaXJEaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBjb2RlID0gJydcblxuICBnZXQgc3RhdGUgKCkge1xuICAgIHJldHVybiBwYWlyaW5nU3RhdGVcbiAgfVxuXG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBpZCA9IHBhaXJpbmdTdGF0ZS5wcmludGVySWRcbiAgICByZXR1cm4gcmVhY2hhYmxlUHJpbnRlcnMoKS5maW5kKHAgPT4gcC5pZCA9PT0gaWQpPy5uYW1lIHx8ICd0aGUgcHJpbnRlcidcbiAgfVxuXG4gIC8qKiBTdGVwIDEgZmluZHMgaXQ7IHRoZSBjb2RlIGFuZCB0aGUgcHJpbnRlcidzIENvbmZpcm0gYXJlIHN0ZXAgMi4gKi9cbiAgZ2V0IHN0ZXAgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHBhaXJpbmdTdGF0ZS5waGFzZSA9PT0gJ2NvZGUnIHx8IHBhaXJpbmdTdGF0ZS5waGFzZSA9PT0gJ3dhaXRpbmcnID8gMiA6IDFcbiAgfVxuXG4gIEBXYXRjaCgnc3RhdGUucGhhc2UnKVxuICBvblBoYXNlIChwaGFzZTogc3RyaW5nKSB7XG4gICAgaWYgKHBoYXNlID09PSAnY29kZScgfHwgcGhhc2UgPT09ICdpZGxlJykgdGhpcy5jb2RlID0gJydcbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdCAoKSB7XG4gICAgY29uc3QgaWQgPSBwYWlyaW5nU3RhdGUucHJpbnRlcklkXG4gICAgYXdhaXQgc3VibWl0UGFpcmluZ0NvZGUodGhpcy5jb2RlKVxuICAgIC8vIFBhaXJlZCwgYW5kIHRoZSBwcmludGVyIGlzIG9wZW46IGl0cyBvd24gcGFnZSBmb2xsb3dzLCBhcyBmb3IgYSBwcmludGVyIG9wZW5lZCBmcm9tIHRoZSBsaXN0LlxuICAgIGlmIChpZCAmJiBwYWlyaW5nU3RhdGUucGhhc2UgPT09ICdpZGxlJyAmJiBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCA9PT0gaWQpIHtcbiAgICAgIGF3YWl0IHRoaXMuJHJvdXRlci5wdXNoKHByaW50ZXJIb21lUGF0aCgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9XG4gIH1cblxuICBjYW5jZWwgKCkge1xuICAgIGNhbmNlbFBhaXJpbmcoKVxuICB9XG5cbiAgYXN5bmMgcmV0cnkgKCkge1xuICAgIGNvbnN0IGlkID0gcGFpcmluZ1N0YXRlLnByaW50ZXJJZFxuICAgIGlmICghaWQpIHJldHVyblxuICAgIGF3YWl0IHN0YXJ0UGFpcmluZyhpZClcbiAgICAvLyBUaGUgcHJpbnRlciB0dXJuZWQgb3V0IHRvIGJlIG9wZW46IG5vIGNvZGUsIHN0cmFpZ2h0IGluLlxuICAgIGlmIChwYWlyaW5nU3RhdGUucGhhc2UgPT09ICdpZGxlJyAmJiBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCA9PT0gaWQpIHtcbiAgICAgIGF3YWl0IHRoaXMuJHJvdXRlci5wdXNoKHByaW50ZXJIb21lUGF0aCgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4ubXVvbi1ibGUtcGFpciB7XG4gICZfX2xhYmVsIHtcbiAgICBtYXJnaW46IDAgMCA4cHg7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC14cyk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICAmX19ib2R5IHtcbiAgICBmb250LXNpemU6IHZhcigtLW0zZC10ZXh0LXNtKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIG1hcmdpbjogMTJweCAwIDA7XG4gIH1cblxuICAmX193YWl0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAmX19lcnJvciB7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC1zbSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIsICNkMzJmMmYpO1xuICAgIG1hcmdpbjogOHB4IDAgMDtcbiAgfVxufVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL211b24tYmxlL0JsdWV0b290aFBhaXJEaWFsb2cudnVlIn0=