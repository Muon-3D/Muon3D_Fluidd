/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import BrowserMixin from "/src/mixins/browser.ts";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import { chartsPage, setChartsRange } from "/src/services/charts/page-state.ts";
import { chartRanges, effectiveRange } from "/src/services/charts/model.ts";
import { chartPresets } from "/src/store/layout/state.ts";
let ChartsActions = class extends Mixins(BrowserMixin) {
  page = chartsPage;
  get collecting() {
    return !!this.$store.state.config.uiSettings.general.enableDiagnostics;
  }
  get retention() {
    return this.$store.getters["charts/getChartRetention"];
  }
  get ranges() {
    return chartRanges(this.retention);
  }
  get range() {
    return effectiveRange(this.page.range, this.retention);
  }
  /** Charts to start from: the ones the default layout leaves out. */
  get presets() {
    return chartPresets().map((c) => c.title);
  }
  /** Opens the chart editor on a preset, or on a custom chart (no title). */
  add(preset) {
    this.page.addPreset = preset;
    this.page.addTick++;
  }
  setRange(value) {
    setChartsRange(Number(value));
  }
};
ChartsActions = __decorateClass([
  Component({ components: { SegPicker } })
], ChartsActions);
const _sfc_main = ChartsActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.collecting ? _c("div", { staticClass: "charts-actions", class: { "charts-actions--phone": _vm.isMobileViewport }, attrs: { "data-tid": "charts-actions" } }, [_c("seg-picker", { attrs: { "options": _vm.ranges, "value": _vm.range, "label": "Time range", "data-tid": "charts-range" }, on: { "input": _vm.setRange } }), _c(__unplugin_components_0, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "charts-add" } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "plus", "small": "" } }), _vm._v(" Add chart ")], 1)];
  } }], null, false, 1397952024) }, [_c(__unplugin_components_2, { attrs: { "dense": "" } }, [_vm._l(_vm.presets, function(preset) {
    return _c(__unplugin_components_3, { key: preset, attrs: { "data-tid": `charts-add-${preset}` }, on: { "click": function($event) {
      return _vm.add(preset);
    } } }, [_c(__unplugin_components_4, [_vm._v(_vm._s(preset))])], 1);
  }), _c(__unplugin_components_5, { attrs: { "data-tid": "charts-add-custom" }, on: { "click": function($event) {
    return _vm.add("");
  } } }, [_c(__unplugin_components_6, [_vm._v("Custom chart")])], 1)], 2)], 1)], 1) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/charts/ChartsActions.vue?vue&type=style&index=0&scoped=4547e532&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "4547e532",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/charts/ChartsActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBakNBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNoYXJ0c0FjdGlvbnMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIHYtaWY9XCJjb2xsZWN0aW5nXCJcbiAgICBjbGFzcz1cImNoYXJ0cy1hY3Rpb25zXCJcbiAgICA6Y2xhc3M9XCJ7ICdjaGFydHMtYWN0aW9ucy0tcGhvbmUnOiBpc01vYmlsZVZpZXdwb3J0IH1cIlxuICAgIGRhdGEtdGlkPVwiY2hhcnRzLWFjdGlvbnNcIlxuICA+XG4gICAgPHNlZy1waWNrZXJcbiAgICAgIDpvcHRpb25zPVwicmFuZ2VzXCJcbiAgICAgIDp2YWx1ZT1cInJhbmdlXCJcbiAgICAgIGxhYmVsPVwiVGltZSByYW5nZVwiXG4gICAgICBkYXRhLXRpZD1cImNoYXJ0cy1yYW5nZVwiXG4gICAgICBAaW5wdXQ9XCJzZXRSYW5nZVwiXG4gICAgLz5cbiAgICA8di1tZW51XG4gICAgICBvZmZzZXQteVxuICAgICAgbGVmdFxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiY2hhcnRzLWFkZFwiXG4gICAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICAgIHYtb249XCJvblwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cInBsdXNcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIEFkZCBjaGFydFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICA8di1saXN0LWl0ZW1cbiAgICAgICAgICB2LWZvcj1cInByZXNldCBpbiBwcmVzZXRzXCJcbiAgICAgICAgICA6a2V5PVwicHJlc2V0XCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgY2hhcnRzLWFkZC0ke3ByZXNldH1gXCJcbiAgICAgICAgICBAY2xpY2s9XCJhZGQocHJlc2V0KVwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+e3sgcHJlc2V0IH19PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgZGF0YS10aWQ9XCJjaGFydHMtYWRkLWN1c3RvbVwiXG4gICAgICAgICAgQGNsaWNrPVwiYWRkKCcnKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+Q3VzdG9tIGNoYXJ0PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgIDwvdi1saXN0PlxuICAgIDwvdi1tZW51PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgU2VnUGlja2VyLCB7IHR5cGUgU2VnT3B0aW9uIH0gZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvU2VnUGlja2VyLnZ1ZSdcbmltcG9ydCB7IGNoYXJ0c1BhZ2UsIHNldENoYXJ0c1JhbmdlIH0gZnJvbSAnQC9zZXJ2aWNlcy9jaGFydHMvcGFnZS1zdGF0ZSdcbmltcG9ydCB7IGNoYXJ0UmFuZ2VzLCBlZmZlY3RpdmVSYW5nZSB9IGZyb20gJ0Avc2VydmljZXMvY2hhcnRzL21vZGVsJ1xuaW1wb3J0IHsgY2hhcnRQcmVzZXRzIH0gZnJvbSAnQC9zdG9yZS9sYXlvdXQvc3RhdGUnXG5cbi8qKiBUaGUgQ2hhcnRzIGhlYWRlcjogb25lIHRpbWUgcmFuZ2UgZm9yIGV2ZXJ5IGNoYXJ0LCBhbmQgQWRkIGNoYXJ0IChhIG1lbnUgb2YgY2hhcnRzIHRvIHN0YXJ0IGZyb20sIG9yIGEgY3VzdG9tIG9uZSkuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBTZWdQaWNrZXIgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hhcnRzQWN0aW9ucyBleHRlbmRzIE1peGlucyhCcm93c2VyTWl4aW4pIHtcbiAgcGFnZSA9IGNoYXJ0c1BhZ2VcblxuICBnZXQgY29sbGVjdGluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVEaWFnbm9zdGljc1xuICB9XG5cbiAgZ2V0IHJldGVudGlvbiAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY2hhcnRzL2dldENoYXJ0UmV0ZW50aW9uJ10gYXMgbnVtYmVyXG4gIH1cblxuICBnZXQgcmFuZ2VzICgpOiBTZWdPcHRpb25bXSB7XG4gICAgcmV0dXJuIGNoYXJ0UmFuZ2VzKHRoaXMucmV0ZW50aW9uKVxuICB9XG5cbiAgZ2V0IHJhbmdlICgpOiBudW1iZXIge1xuICAgIHJldHVybiBlZmZlY3RpdmVSYW5nZSh0aGlzLnBhZ2UucmFuZ2UsIHRoaXMucmV0ZW50aW9uKVxuICB9XG5cbiAgLyoqIENoYXJ0cyB0byBzdGFydCBmcm9tOiB0aGUgb25lcyB0aGUgZGVmYXVsdCBsYXlvdXQgbGVhdmVzIG91dC4gKi9cbiAgZ2V0IHByZXNldHMgKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gY2hhcnRQcmVzZXRzKCkubWFwKGMgPT4gYy50aXRsZSlcbiAgfVxuXG4gIC8qKiBPcGVucyB0aGUgY2hhcnQgZWRpdG9yIG9uIGEgcHJlc2V0LCBvciBvbiBhIGN1c3RvbSBjaGFydCAobm8gdGl0bGUpLiAqL1xuICBhZGQgKHByZXNldDogc3RyaW5nKSB7XG4gICAgdGhpcy5wYWdlLmFkZFByZXNldCA9IHByZXNldFxuICAgIHRoaXMucGFnZS5hZGRUaWNrKytcbiAgfVxuXG4gIHNldFJhbmdlICh2YWx1ZTogc3RyaW5nIHwgbnVtYmVyKSB7XG4gICAgc2V0Q2hhcnRzUmFuZ2UoTnVtYmVyKHZhbHVlKSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmNoYXJ0cy1hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgfVxuXG4gIC5jaGFydHMtYWN0aW9ucy0tcGhvbmUge1xuICAgIGdhcDogOHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY2hhcnRzL0NoYXJ0c0FjdGlvbnMudnVlIn0=