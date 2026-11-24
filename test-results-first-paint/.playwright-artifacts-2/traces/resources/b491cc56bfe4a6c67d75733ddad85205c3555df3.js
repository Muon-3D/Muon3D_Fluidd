/* unplugin-vue-components disabled */import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import { Component, Mixins, VModel, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import TypedCommandsMixin from "/src/mixins/typed-commands.ts";
import ToolheadMixin from "/src/mixins/toolhead.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
const BISECT_MAX = 0.2;
let ManualProbeDialog = class extends Mixins(TypedCommandsMixin, ToolheadMixin) {
  open;
  finer = false;
  probeTarget = null;
  get probeContext() {
    return `${this.commandTarget}|${cloudState.account?.id ?? ""}`;
  }
  created() {
    this.probeTarget = this.probeContext;
  }
  onTargetChanged() {
    this.open = false;
  }
  get canStop() {
    return this.probeTarget === this.probeContext && this.commandControlAvailable && this.klippyReady && this.klippyConnected && this.isManualProbeActive && !this.hasWait(this.$waits.onManualProbe);
  }
  get canMove() {
    return this.canStop && !this.printerPrinting && !this.printerPaused && this.printerState !== "loading";
  }
  get offsets() {
    return [.../* @__PURE__ */ new Set([
      1,
      0.1,
      ...this.$store.state.config.uiSettings.general.zAdjustDistances
    ])].filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => b - a);
  }
  get manualProbe() {
    return this.$store.state.printer.printer.manual_probe ?? {};
  }
  get zPositionLower() {
    return this.manualProbe.z_position_lower?.toFixed(3) || "\u2013";
  }
  get zPosition() {
    return this.manualProbe.z_position?.toFixed(3) || "\u2013";
  }
  get zPositionUpper() {
    return this.manualProbe.z_position_upper?.toFixed(3) || "\u2013";
  }
  onIsManualProbeActive(value) {
    if (!value) {
      this.open = false;
    }
  }
  sendTestZ(zValue) {
    if (!this.canMove) return;
    const bracket = ["--", "-", "+", "++"].includes(zValue);
    const numeric = /^[+-]\d+(?:\.\d+)?$/.test(zValue) && this.offsets.includes(Math.abs(Number(zValue)));
    if (bracket || numeric) this.sendGcode(`TESTZ Z=${zValue}`, this.$waits.onManualProbe);
  }
  stepLabel(step) {
    const current = this.manualProbe.z_position;
    const lower = this.manualProbe.z_position_lower;
    const upper = this.manualProbe.z_position_upper;
    if (!Number.isFinite(current) || !["--", "-", "+", "++"].includes(step)) return step;
    const closer = step.startsWith("-");
    const neighbour = closer ? lower : upper;
    let target = neighbour;
    if (target == null) target = closer ? -Number.MAX_VALUE : Number.MAX_VALUE;
    if (step.length === 1) target = (target + current) / 2;
    target = closer ? Math.max(target, current - BISECT_MAX) : Math.min(target, current + BISECT_MAX);
    return `To ${target.toFixed(3)} mm (${closer ? "closer" : "away"})`;
  }
  sendAbort() {
    if (this.canStop) this.sendGcode("ABORT", this.$waits.onManualProbe);
    this.open = false;
  }
  sendAccept() {
    if (!this.canMove) return;
    this.sendGcode("ACCEPT", this.$waits.onManualProbe);
  }
};
__decorateClass([
  VModel({ type: Boolean })
], ManualProbeDialog.prototype, "open", 2);
__decorateClass([
  Watch("probeContext")
], ManualProbeDialog.prototype, "onTargetChanged", 1);
__decorateClass([
  Watch("isManualProbeActive")
], ManualProbeDialog.prototype, "onIsManualProbeActive", 1);
ManualProbeDialog = __decorateClass([
  Component({ components: { M3Dialog } })
], ManualProbeDialog);
const _sfc_main = ManualProbeDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "eyebrow": "First layer height", "title": "Bring the nozzle to the paper", "max-width": "480", "persistent": "", "close-label": _vm.canStop ? "Stop without saving" : "Close", "data-tid": "manual-probe" }, on: { "close": _vm.sendAbort }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "manual-probe-abort" }, on: { "click": _vm.sendAbort } }, [_vm._v(" " + _vm._s(_vm.canStop ? "Stop without saving" : "Close") + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.canMove, "data-tid": "manual-probe-accept" }, on: { "click": _vm.sendAccept } }, [_vm.hasWait(_vm.$waits.onManualProbe) ? _c(__unplugin_components_1, { attrs: { "indeterminate": "", "size": "16", "width": "2" } }) : _vm._e(), _vm._v(" Save this height ")], 1)];
  }, proxy: true }]) }, [_c("p", { staticClass: "m3-dlg__text" }, [_vm._v(" Slide a sheet of paper between the nozzle and the plate. Move the nozzle closer in small steps until the paper just drags when you push it, then save the height. ")]), _c("div", { staticClass: "mp__readout" }, [_c("span", { staticClass: "mp__z" }, [_vm._v(_vm._s(_vm.zPosition))]), _c("span", { staticClass: "mp__unit" }, [_vm._v("mm")]), _vm.manualProbe.z_position_lower != null || _vm.manualProbe.z_position_upper != null ? _c("span", { staticClass: "mp__range" }, [_vm._v(" tried " + _vm._s(_vm.zPositionLower) + " to " + _vm._s(_vm.zPositionUpper) + " ")]) : _vm._e()]), _c("div", { staticClass: "mp__steps" }, [_vm._l(_vm.offsets, function(offset) {
    return [_c("button", { key: `down-${offset}`, staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.canMove, "aria-label": `${offset} mm closer to the plate` }, on: { "click": function($event) {
      return _vm.sendTestZ(`-${offset}`);
    } } }, [_c(__unplugin_components_2, { attrs: { "name": "minus", "small": "" } }), _vm._v(" Closer ")], 1), _c("span", { key: `size-${offset}`, staticClass: "mp__size" }, [_vm._v(_vm._s(offset) + " mm")]), _c("button", { key: `up-${offset}`, staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.canMove, "aria-label": `${offset} mm away from the plate` }, on: { "click": function($event) {
      return _vm.sendTestZ(`+${offset}`);
    } } }, [_c(__unplugin_components_3, { attrs: { "name": "plus", "small": "" } }), _vm._v(" Away ")], 1)];
  })], 2), _c("div", { staticClass: "mp__bisect" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "manual-probe-finer", "aria-expanded": _vm.finer ? "true" : "false", "aria-controls": "manual-probe-finer-steps" }, on: { "click": function($event) {
    _vm.finer = !_vm.finer;
  } } }, [_vm._v(" Finer steps ")]), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.finer, expression: "finer" }], staticClass: "mp__bisect-buttons", attrs: { "id": "manual-probe-finer-steps" } }, _vm._l(["--", "-", "+", "++"], function(step) {
    return _c("button", { key: step, staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.canMove, "data-step": step, "aria-label": _vm.stepLabel(step) }, on: { "click": function($event) {
      return _vm.sendTestZ(step);
    } } }, [_vm._v(" " + _vm._s(_vm.stepLabel(step)) + " ")]);
  }), 0)])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/common/ManualProbeDialog.vue?vue&type=style&index=0&scoped=a7f22117&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "a7f22117",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/ManualProbeDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUE0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBV0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0EscUZBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFuRkE7QUFBQSxFQURBO0FBQUEsR0FEQSxrQkFFQTtBQVVBO0FBQUEsRUFEQTtBQUFBLEdBWEEsa0JBWUE7QUFvQ0E7QUFBQSxFQURBO0FBQUEsR0EvQ0Esa0JBZ0RBO0FBaERBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk1hbnVhbFByb2JlRGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtMy1kaWFsb2dcbiAgICA6dmFsdWU9XCJvcGVuXCJcbiAgICBleWVicm93PVwiRmlyc3QgbGF5ZXIgaGVpZ2h0XCJcbiAgICB0aXRsZT1cIkJyaW5nIHRoZSBub3p6bGUgdG8gdGhlIHBhcGVyXCJcbiAgICBtYXgtd2lkdGg9XCI0ODBcIlxuICAgIHBlcnNpc3RlbnRcbiAgICA6Y2xvc2UtbGFiZWw9XCJjYW5TdG9wID8gJ1N0b3Agd2l0aG91dCBzYXZpbmcnIDogJ0Nsb3NlJ1wiXG4gICAgZGF0YS10aWQ9XCJtYW51YWwtcHJvYmVcIlxuICAgIEBjbG9zZT1cInNlbmRBYm9ydFwiXG4gID5cbiAgICA8cCBjbGFzcz1cIm0zLWRsZ19fdGV4dFwiPlxuICAgICAgU2xpZGUgYSBzaGVldCBvZiBwYXBlciBiZXR3ZWVuIHRoZSBub3p6bGUgYW5kIHRoZSBwbGF0ZS4gTW92ZSB0aGUgbm96emxlIGNsb3NlciBpbiBzbWFsbCBzdGVwcyB1bnRpbCB0aGUgcGFwZXJcbiAgICAgIGp1c3QgZHJhZ3Mgd2hlbiB5b3UgcHVzaCBpdCwgdGhlbiBzYXZlIHRoZSBoZWlnaHQuXG4gICAgPC9wPlxuXG4gICAgPGRpdiBjbGFzcz1cIm1wX19yZWFkb3V0XCI+XG4gICAgICA8c3BhbiBjbGFzcz1cIm1wX196XCI+e3sgelBvc2l0aW9uIH19PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJtcF9fdW5pdFwiPm1tPC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cIm1hbnVhbFByb2JlLnpfcG9zaXRpb25fbG93ZXIgIT0gbnVsbCB8fCBtYW51YWxQcm9iZS56X3Bvc2l0aW9uX3VwcGVyICE9IG51bGxcIlxuICAgICAgICBjbGFzcz1cIm1wX19yYW5nZVwiXG4gICAgICA+XG4gICAgICAgIHRyaWVkIHt7IHpQb3NpdGlvbkxvd2VyIH19IHRvIHt7IHpQb3NpdGlvblVwcGVyIH19XG4gICAgICA8L3NwYW4+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwibXBfX3N0ZXBzXCI+XG4gICAgICA8dGVtcGxhdGUgdi1mb3I9XCJvZmZzZXQgaW4gb2Zmc2V0c1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgOmtleT1cImBkb3duLSR7b2Zmc2V0fWBcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNhbk1vdmVcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7b2Zmc2V0fSBtbSBjbG9zZXIgdG8gdGhlIHBsYXRlYFwiXG4gICAgICAgICAgQGNsaWNrPVwic2VuZFRlc3RaKGAtJHtvZmZzZXR9YClcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJtaW51c1wiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgICAgQ2xvc2VyXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIDprZXk9XCJgc2l6ZS0ke29mZnNldH1gXCJcbiAgICAgICAgICBjbGFzcz1cIm1wX19zaXplXCJcbiAgICAgICAgPnt7IG9mZnNldCB9fSBtbTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIDprZXk9XCJgdXAtJHtvZmZzZXR9YFwiXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuTW92ZVwiXG4gICAgICAgICAgOmFyaWEtbGFiZWw9XCJgJHtvZmZzZXR9IG1tIGF3YXkgZnJvbSB0aGUgcGxhdGVgXCJcbiAgICAgICAgICBAY2xpY2s9XCJzZW5kVGVzdFooYCske29mZnNldH1gKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cInBsdXNcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIEF3YXlcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cIm1wX19iaXNlY3RcIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgIGRhdGEtdGlkPVwibWFudWFsLXByb2JlLWZpbmVyXCJcbiAgICAgICAgOmFyaWEtZXhwYW5kZWQ9XCJmaW5lciA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICBhcmlhLWNvbnRyb2xzPVwibWFudWFsLXByb2JlLWZpbmVyLXN0ZXBzXCJcbiAgICAgICAgQGNsaWNrPVwiZmluZXIgPSAhZmluZXJcIlxuICAgICAgPlxuICAgICAgICBGaW5lciBzdGVwc1xuICAgICAgPC9idXR0b24+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtc2hvdz1cImZpbmVyXCJcbiAgICAgICAgaWQ9XCJtYW51YWwtcHJvYmUtZmluZXItc3RlcHNcIlxuICAgICAgICBjbGFzcz1cIm1wX19iaXNlY3QtYnV0dG9uc1wiXG4gICAgICA+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cInN0ZXAgaW4gWyctLScsICctJywgJysnLCAnKysnXVwiXG4gICAgICAgICAgOmtleT1cInN0ZXBcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNhbk1vdmVcIlxuICAgICAgICAgIDpkYXRhLXN0ZXA9XCJzdGVwXCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cInN0ZXBMYWJlbChzdGVwKVwiXG4gICAgICAgICAgQGNsaWNrPVwic2VuZFRlc3RaKHN0ZXApXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHN0ZXBMYWJlbChzdGVwKSB9fVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJtYW51YWwtcHJvYmUtYWJvcnRcIlxuICAgICAgICBAY2xpY2s9XCJzZW5kQWJvcnRcIlxuICAgICAgPlxuICAgICAgICB7eyBjYW5TdG9wID8gJ1N0b3Agd2l0aG91dCBzYXZpbmcnIDogJ0Nsb3NlJyB9fVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJtYW51YWwtcHJvYmUtYWNjZXB0XCJcbiAgICAgICAgQGNsaWNrPVwic2VuZEFjY2VwdFwiXG4gICAgICA+XG4gICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgICAgdi1pZj1cImhhc1dhaXQoJHdhaXRzLm9uTWFudWFsUHJvYmUpXCJcbiAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgc2l6ZT1cIjE2XCJcbiAgICAgICAgICB3aWR0aD1cIjJcIlxuICAgICAgICAvPlxuICAgICAgICBTYXZlIHRoaXMgaGVpZ2h0XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L20zLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgVk1vZGVsLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVHlwZWRDb21tYW5kc01peGluIGZyb20gJ0AvbWl4aW5zL3R5cGVkLWNvbW1hbmRzJ1xuaW1wb3J0IFRvb2xoZWFkTWl4aW4gZnJvbSAnQC9taXhpbnMvdG9vbGhlYWQnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IE0zRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy91aS9NM0RpYWxvZy52dWUnXG5cbmNvbnN0IEJJU0VDVF9NQVggPSAwLjJcblxuLyoqXG4gKiBLbGlwcGVyJ3MgbWFudWFsIHByb2JlIChQUk9CRV9DQUxJQlJBVEUsIFpfRU5EU1RPUF9DQUxJQlJBVEUpOiB0aGUgcGFwZXJcbiAqIHRlc3QsIGFzIE1haW50ZW5hbmNlJ3MgRmlyc3QgbGF5ZXIgaGVpZ2h0IHJ1bnMgaXQuIENsb3NlciBhbmQgQXdheSBtb3ZlXG4gKiB0aGUgbm96emxlIChURVNUWiksIGJ5IDEgbW0gZG93biB0byB0aGUgc21hbGxlc3Qgc3RlcDsgU2F2ZSB0aGlzIGhlaWdodFxuICogYWNjZXB0cyBpdCAoQUNDRVBUKSwgU3RvcCB3aXRob3V0IHNhdmluZyBhYm9ydHMgKEFCT1JUKSwgYXMg4pyVIGRvZXM6IGFcbiAqIGNsb3NlZCBkaWFsb2cgd2l0aCB0aGUgcHJvYmUgc3RpbGwgd2FpdGluZyBsZWZ0IEtsaXBwZXIgc3R1Y2sgaW4gaXQuIEFcbiAqIGNsaWNrIG91dHNpZGUgZG9lcyBub3RoaW5nLiBGaW5lciBzdGVwcyBleHBvc2VzIEtsaXBwZXIncyBicmFja2V0IHN0ZXBzLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNM0RpYWxvZyB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYW51YWxQcm9iZURpYWxvZyBleHRlbmRzIE1peGlucyhUeXBlZENvbW1hbmRzTWl4aW4sIFRvb2xoZWFkTWl4aW4pIHtcbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIGZpbmVyID0gZmFsc2VcbiAgcHJvYmVUYXJnZXQ6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cbiAgZ2V0IHByb2JlQ29udGV4dCAoKTogc3RyaW5nIHsgcmV0dXJuIGAke3RoaXMuY29tbWFuZFRhcmdldH18JHtjbG91ZFN0YXRlLmFjY291bnQ/LmlkID8/ICcnfWAgfVxuXG4gIGNyZWF0ZWQgKCkgeyB0aGlzLnByb2JlVGFyZ2V0ID0gdGhpcy5wcm9iZUNvbnRleHQgfVxuXG4gIEBXYXRjaCgncHJvYmVDb250ZXh0JylcbiAgb25UYXJnZXRDaGFuZ2VkICgpIHsgdGhpcy5vcGVuID0gZmFsc2UgfVxuXG4gIGdldCBjYW5TdG9wICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5wcm9iZVRhcmdldCA9PT0gdGhpcy5wcm9iZUNvbnRleHQgJiYgdGhpcy5jb21tYW5kQ29udHJvbEF2YWlsYWJsZSAmJlxuICAgICAgdGhpcy5rbGlwcHlSZWFkeSAmJiB0aGlzLmtsaXBweUNvbm5lY3RlZCAmJiB0aGlzLmlzTWFudWFsUHJvYmVBY3RpdmUgJiYgIXRoaXMuaGFzV2FpdCh0aGlzLiR3YWl0cy5vbk1hbnVhbFByb2JlKVxuICB9XG5cbiAgZ2V0IGNhbk1vdmUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNhblN0b3AgJiYgIXRoaXMucHJpbnRlclByaW50aW5nICYmICF0aGlzLnByaW50ZXJQYXVzZWQgJiYgdGhpcy5wcmludGVyU3RhdGUgIT09ICdsb2FkaW5nJ1xuICB9XG5cbiAgZ2V0IG9mZnNldHMgKCkge1xuICAgIHJldHVybiBbLi4ubmV3IFNldChbXG4gICAgICAxLFxuICAgICAgMC4xLFxuICAgICAgLi4udGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC56QWRqdXN0RGlzdGFuY2VzXG4gICAgXSldLmZpbHRlcihuID0+IE51bWJlci5pc0Zpbml0ZShuKSAmJiBuID4gMCkuc29ydCgoYSwgYikgPT4gYiAtIGEpXG4gIH1cblxuICBnZXQgbWFudWFsUHJvYmUgKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIubWFudWFsX3Byb2JlID8/IHt9XG4gIH1cblxuICBnZXQgelBvc2l0aW9uTG93ZXIgKCkge1xuICAgIHJldHVybiB0aGlzLm1hbnVhbFByb2JlLnpfcG9zaXRpb25fbG93ZXI/LnRvRml4ZWQoMykgfHwgJ+KAkydcbiAgfVxuXG4gIGdldCB6UG9zaXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1hbnVhbFByb2JlLnpfcG9zaXRpb24/LnRvRml4ZWQoMykgfHwgJ+KAkydcbiAgfVxuXG4gIGdldCB6UG9zaXRpb25VcHBlciAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFudWFsUHJvYmUuel9wb3NpdGlvbl91cHBlcj8udG9GaXhlZCgzKSB8fCAn4oCTJ1xuICB9XG5cbiAgQFdhdGNoKCdpc01hbnVhbFByb2JlQWN0aXZlJylcbiAgb25Jc01hbnVhbFByb2JlQWN0aXZlICh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgc2VuZFRlc3RaICh6VmFsdWU6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5jYW5Nb3ZlKSByZXR1cm5cbiAgICBjb25zdCBicmFja2V0ID0gWyctLScsICctJywgJysnLCAnKysnXS5pbmNsdWRlcyh6VmFsdWUpXG4gICAgY29uc3QgbnVtZXJpYyA9IC9eWystXVxcZCsoPzpcXC5cXGQrKT8kLy50ZXN0KHpWYWx1ZSkgJiYgdGhpcy5vZmZzZXRzLmluY2x1ZGVzKE1hdGguYWJzKE51bWJlcih6VmFsdWUpKSlcbiAgICBpZiAoYnJhY2tldCB8fCBudW1lcmljKSB0aGlzLnNlbmRHY29kZShgVEVTVFogWj0ke3pWYWx1ZX1gLCB0aGlzLiR3YWl0cy5vbk1hbnVhbFByb2JlKVxuICB9XG5cbiAgc3RlcExhYmVsIChzdGVwOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLm1hbnVhbFByb2JlLnpfcG9zaXRpb25cbiAgICBjb25zdCBsb3dlciA9IHRoaXMubWFudWFsUHJvYmUuel9wb3NpdGlvbl9sb3dlclxuICAgIGNvbnN0IHVwcGVyID0gdGhpcy5tYW51YWxQcm9iZS56X3Bvc2l0aW9uX3VwcGVyXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoY3VycmVudCkgfHwgIVsnLS0nLCAnLScsICcrJywgJysrJ10uaW5jbHVkZXMoc3RlcCkpIHJldHVybiBzdGVwXG5cbiAgICBjb25zdCBjbG9zZXIgPSBzdGVwLnN0YXJ0c1dpdGgoJy0nKVxuICAgIGNvbnN0IG5laWdoYm91ciA9IGNsb3NlciA/IGxvd2VyIDogdXBwZXJcbiAgICBsZXQgdGFyZ2V0ID0gbmVpZ2hib3VyXG4gICAgaWYgKHRhcmdldCA9PSBudWxsKSB0YXJnZXQgPSBjbG9zZXIgPyAtTnVtYmVyLk1BWF9WQUxVRSA6IE51bWJlci5NQVhfVkFMVUVcbiAgICBpZiAoc3RlcC5sZW5ndGggPT09IDEpIHRhcmdldCA9ICh0YXJnZXQgKyBjdXJyZW50KSAvIDJcbiAgICB0YXJnZXQgPSBjbG9zZXIgPyBNYXRoLm1heCh0YXJnZXQsIGN1cnJlbnQgLSBCSVNFQ1RfTUFYKSA6IE1hdGgubWluKHRhcmdldCwgY3VycmVudCArIEJJU0VDVF9NQVgpXG4gICAgcmV0dXJuIGBUbyAke3RhcmdldC50b0ZpeGVkKDMpfSBtbSAoJHtjbG9zZXIgPyAnY2xvc2VyJyA6ICdhd2F5J30pYFxuICB9XG5cbiAgc2VuZEFib3J0ICgpIHtcbiAgICBpZiAodGhpcy5jYW5TdG9wKSB0aGlzLnNlbmRHY29kZSgnQUJPUlQnLCB0aGlzLiR3YWl0cy5vbk1hbnVhbFByb2JlKVxuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gIH1cblxuICBzZW5kQWNjZXB0ICgpIHtcbiAgICBpZiAoIXRoaXMuY2FuTW92ZSkgcmV0dXJuXG4gICAgdGhpcy5zZW5kR2NvZGUoJ0FDQ0VQVCcsIHRoaXMuJHdhaXRzLm9uTWFudWFsUHJvYmUpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5tcF9fcmVhZG91dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lO1xuICAgIGdhcDogNnB4O1xuICAgIHBhZGRpbmc6IDRweCAycHg7XG4gIH1cblxuICAubXBfX3oge1xuICAgIGZvbnQtc2l6ZTogNDBweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGxpbmUtaGVpZ2h0OiAxO1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAubXBfX3VuaXQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNXB4O1xuICB9XG5cbiAgLm1wX19yYW5nZSB7XG4gICAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAubXBfX3N0ZXBzIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIGF1dG8gMWZyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHggMTJweDtcblxuICAgIC5jYnRuIHtcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgIH1cbiAgfVxuXG4gIC5tcF9fc2l6ZSB7XG4gICAgbWluLXdpZHRoOiA2NHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB9XG5cbiAgLm1wX19iaXNlY3Qge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDhweDtcbiAgfVxuXG4gIC5tcF9fYmlzZWN0LWJ1dHRvbnMge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgZ2FwOiA4cHg7XG5cbiAgICAuY2J0biB7XG4gICAgICB3aWR0aDogMTAwJTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb21tb24vTWFudWFsUHJvYmVEaWFsb2cudnVlIn0=