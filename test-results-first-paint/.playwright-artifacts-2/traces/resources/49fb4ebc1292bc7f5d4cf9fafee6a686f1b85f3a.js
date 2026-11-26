/* unplugin-vue-components disabled */import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import { VIcon as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BluetoothWhyText from "/src/components/printers/BluetoothWhyText.vue";
let PrintersHeader = class extends Vue {
  summary;
  search;
  view;
  showSearch;
  showView;
  bluetoothSearch;
  bluetoothOff;
  scanning;
  bluetoothWhy;
  onInput(event) {
    this.$emit("update:search", event.target.value);
  }
};
__decorateClass([
  Prop({ type: String, default: "" })
], PrintersHeader.prototype, "summary", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], PrintersHeader.prototype, "search", 2);
__decorateClass([
  Prop({ type: String, default: "cards" })
], PrintersHeader.prototype, "view", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersHeader.prototype, "showSearch", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersHeader.prototype, "showView", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersHeader.prototype, "bluetoothSearch", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersHeader.prototype, "bluetoothOff", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersHeader.prototype, "scanning", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], PrintersHeader.prototype, "bluetoothWhy", 2);
PrintersHeader = __decorateClass([
  Component({ components: { BluetoothWhyText } })
], PrintersHeader);
const _sfc_main = PrintersHeader;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("header", { staticClass: "phead" }, [_c("div", { staticClass: "phead__titles" }, [_c("h1", { staticClass: "phead__title", attrs: { "data-tid": "page-title" } }, [_vm._v(" All printers ")]), _c("p", { staticClass: "phead__summary", attrs: { "data-tid": "printers-summary" } }, [_vm._v(" " + _vm._s(_vm.summary) + " ")])]), _c("div", { staticClass: "phead__tools" }, [_vm.showSearch ? _c("label", { staticClass: "phead__search" }, [_c(__unplugin_components_0, { attrs: { "name": "search", "small": "" } }), _c("input", { attrs: { "type": "search", "placeholder": "Search printers", "aria-label": "Search printers", "data-tid": "printers-search" }, domProps: { "value": _vm.search }, on: { "input": _vm.onInput } })], 1) : _vm._e(), _vm.showView ? _c("div", { staticClass: "seg", attrs: { "role": "group", "aria-label": "View" } }, [_c("button", { class: { on: _vm.view === "bench" }, attrs: { "type": "button", "aria-pressed": _vm.view === "bench" ? "true" : "false", "data-tid": "view-bench" }, on: { "click": function($event) {
    return _vm.$emit("update:view", "bench");
  } } }, [_vm._v(" Bench ")]), _c("button", { class: { on: _vm.view === "cards" }, attrs: { "type": "button", "aria-pressed": _vm.view === "cards" ? "true" : "false", "data-tid": "view-grid" }, on: { "click": function($event) {
    return _vm.$emit("update:view", "cards");
  } } }, [_vm._v(" Grid ")]), _c("button", { class: { on: _vm.view === "list" }, attrs: { "type": "button", "aria-pressed": _vm.view === "list" ? "true" : "false", "data-tid": "view-list" }, on: { "click": function($event) {
    return _vm.$emit("update:view", "list");
  } } }, [_vm._v(" List ")])]) : _vm._e(), _c("button", { staticClass: "btn", attrs: { "type": "button", "data-tid": "scan-printers", "disabled": _vm.scanning }, on: { "click": function($event) {
    return _vm.$emit("scan");
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "search", "small": "" } }), _vm._v(" " + _vm._s(_vm.scanning ? "Scanning\u2026" : "Scan for printers") + " ")], 1), _vm.bluetoothSearch ? _c("button", { staticClass: "btn btn--primary btn--icon", attrs: { "type": "button", "data-tid": "connect-bluetooth", "aria-label": "Connect over Bluetooth", "title": "Connect over Bluetooth", "disabled": _vm.bluetoothOff }, on: { "click": function($event) {
    return _vm.$emit("connect-bluetooth");
  } } }, [_c(__unplugin_components_2, { attrs: { "small": "" } }, [_vm._v(" $bluetooth ")])], 1) : _vm._e(), _c("button", { staticClass: "btn btn--primary", attrs: { "type": "button", "data-tid": "add-printer" }, on: { "click": function($event) {
    return _vm.$emit("add");
  } } }, [_c(__unplugin_components_3, { attrs: { "name": "plus", "small": "" } }), _vm._v(" Add printer ")], 1), !_vm.bluetoothSearch ? _c("p", { staticClass: "phead__quiet", attrs: { "data-tid": "bluetooth-needs-chrome" } }, [_c("bluetooth-why-text", { attrs: { "why": _vm.bluetoothWhy } })], 1) : _vm._e()])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/PrintersHeader.vue?vue&type=style&index=0&scoped=f8d29a96&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f8d29a96",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/PrintersHeader.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUF1SEE7QUFDQTtBQVNBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUlBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBaENBO0FBQUEsRUFEQTtBQUFBLEdBREEsZUFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsZUFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZUFRQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBVkEsZUFXQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBYkEsZUFjQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBakJBLGVBa0JBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FwQkEsZUFxQkE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQXhCQSxlQXlCQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBNUJBLGVBNkJBO0FBN0JBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlByaW50ZXJzSGVhZGVyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxoZWFkZXIgY2xhc3M9XCJwaGVhZFwiPlxuICAgIDxkaXYgY2xhc3M9XCJwaGVhZF9fdGl0bGVzXCI+XG4gICAgICA8aDFcbiAgICAgICAgY2xhc3M9XCJwaGVhZF9fdGl0bGVcIlxuICAgICAgICBkYXRhLXRpZD1cInBhZ2UtdGl0bGVcIlxuICAgICAgPlxuICAgICAgICBBbGwgcHJpbnRlcnNcbiAgICAgIDwvaDE+XG4gICAgICA8cFxuICAgICAgICBjbGFzcz1cInBoZWFkX19zdW1tYXJ5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJwcmludGVycy1zdW1tYXJ5XCJcbiAgICAgID5cbiAgICAgICAge3sgc3VtbWFyeSB9fVxuICAgICAgPC9wPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJwaGVhZF9fdG9vbHNcIj5cbiAgICAgIDxsYWJlbFxuICAgICAgICB2LWlmPVwic2hvd1NlYXJjaFwiXG4gICAgICAgIGNsYXNzPVwicGhlYWRfX3NlYXJjaFwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cInNlYXJjaFwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdHlwZT1cInNlYXJjaFwiXG4gICAgICAgICAgOnZhbHVlPVwic2VhcmNoXCJcbiAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBwcmludGVyc1wiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIlNlYXJjaCBwcmludGVyc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwcmludGVycy1zZWFyY2hcIlxuICAgICAgICAgIEBpbnB1dD1cIm9uSW5wdXRcIlxuICAgICAgICA+XG4gICAgICA8L2xhYmVsPlxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwic2hvd1ZpZXdcIlxuICAgICAgICBjbGFzcz1cInNlZ1wiXG4gICAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJWaWV3XCJcbiAgICAgID5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIDpjbGFzcz1cInsgb246IHZpZXcgPT09ICdiZW5jaCcgfVwiXG4gICAgICAgICAgOmFyaWEtcHJlc3NlZD1cInZpZXcgPT09ICdiZW5jaCcgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInZpZXctYmVuY2hcIlxuICAgICAgICAgIEBjbGljaz1cIiRlbWl0KCd1cGRhdGU6dmlldycsICdiZW5jaCcpXCJcbiAgICAgICAgPlxuICAgICAgICAgIEJlbmNoXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgOmNsYXNzPVwieyBvbjogdmlldyA9PT0gJ2NhcmRzJyB9XCJcbiAgICAgICAgICA6YXJpYS1wcmVzc2VkPVwidmlldyA9PT0gJ2NhcmRzJyA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidmlldy1ncmlkXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgndXBkYXRlOnZpZXcnLCAnY2FyZHMnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBHcmlkXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgOmNsYXNzPVwieyBvbjogdmlldyA9PT0gJ2xpc3QnIH1cIlxuICAgICAgICAgIDphcmlhLXByZXNzZWQ9XCJ2aWV3ID09PSAnbGlzdCcgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInZpZXctbGlzdFwiXG4gICAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ3VwZGF0ZTp2aWV3JywgJ2xpc3QnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBMaXN0XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJ0blwiXG4gICAgICAgIGRhdGEtdGlkPVwic2Nhbi1wcmludGVyc1wiXG4gICAgICAgIDpkaXNhYmxlZD1cInNjYW5uaW5nXCJcbiAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ3NjYW4nKVwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cInNlYXJjaFwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAge3sgc2Nhbm5pbmcgPyAnU2Nhbm5pbmfigKYnIDogJ1NjYW4gZm9yIHByaW50ZXJzJyB9fVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtaWY9XCJibHVldG9vdGhTZWFyY2hcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJidG4gYnRuLS1wcmltYXJ5IGJ0bi0taWNvblwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29ubmVjdC1ibHVldG9vdGhcIlxuICAgICAgICBhcmlhLWxhYmVsPVwiQ29ubmVjdCBvdmVyIEJsdWV0b290aFwiXG4gICAgICAgIHRpdGxlPVwiQ29ubmVjdCBvdmVyIEJsdWV0b290aFwiXG4gICAgICAgIDpkaXNhYmxlZD1cImJsdWV0b290aE9mZlwiXG4gICAgICAgIEBjbGljaz1cIiRlbWl0KCdjb25uZWN0LWJsdWV0b290aCcpXCJcbiAgICAgID5cbiAgICAgICAgPHYtaWNvbiBzbWFsbD5cbiAgICAgICAgICAkYmx1ZXRvb3RoXG4gICAgICAgIDwvdi1pY29uPlxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJ0biBidG4tLXByaW1hcnlcIlxuICAgICAgICBkYXRhLXRpZD1cImFkZC1wcmludGVyXCJcbiAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ2FkZCcpXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgQWRkIHByaW50ZXJcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIiFibHVldG9vdGhTZWFyY2hcIlxuICAgICAgICBjbGFzcz1cInBoZWFkX19xdWlldFwiXG4gICAgICAgIGRhdGEtdGlkPVwiYmx1ZXRvb3RoLW5lZWRzLWNocm9tZVwiXG4gICAgICA+XG4gICAgICAgIDxibHVldG9vdGgtd2h5LXRleHQgOndoeT1cImJsdWV0b290aFdoeVwiIC8+XG4gICAgICA8L3A+XG4gICAgPC9kaXY+XG4gIDwvaGVhZGVyPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBCbHVldG9vdGhXaHlUZXh0IGZyb20gJy4vQmx1ZXRvb3RoV2h5VGV4dC52dWUnXG5pbXBvcnQgdHlwZSB7IEJsdWV0b290aFdoeSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvdW5hdmFpbGFibGUnXG5cbi8qKlxuICogVGhlIHBhZ2UgaGVhZGVyICh2MyBzZWN0aW9uIDIpOiB0aGUgdGl0bGUsIG9uZSBtdXRlZCBsaW5lIHNheWluZyB3aGF0IGlzXG4gKiBoZXJlLCB0aGVuIHRoZSBwYWdlJ3MgYWN0aW9uczogc2VhcmNoLCBHcmlkIC8gTGlzdCwgYW5kIHRoZSBvbmUgcHJpbWFyeSxcbiAqIEFkZCBwcmludGVyLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBCbHVldG9vdGhXaHlUZXh0IH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaW50ZXJzSGVhZGVyIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IHN1bW1hcnkhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgc2VhcmNoITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdjYXJkcycgfSlcbiAgcmVhZG9ubHkgdmlldyE6ICdjYXJkcycgfCAnbGlzdCcgfCAnYmVuY2gnXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNob3dTZWFyY2g/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNob3dWaWV3PzogYm9vbGVhblxuXG4gIC8qKiBXZWIgQmx1ZXRvb3RoIGlzIGhlcmUgKENocm9taXVtLCBzZWN1cmUgY29udGV4dCkuICovXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBibHVldG9vdGhTZWFyY2g/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGJsdWV0b290aE9mZj86IGJvb2xlYW5cblxuICAvKiogQSBzY2FuIGlzIHJ1bm5pbmcgKEtBTi01NDA5KS4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNjYW5uaW5nPzogYm9vbGVhblxuXG4gIC8qKiBXaHkgQmx1ZXRvb3RoIGNhbm5vdCBiZSB1c2VkIGhlcmUsIHNhaWQgcGxhaW5seS4gKi9cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgYmx1ZXRvb3RoV2h5ITogQmx1ZXRvb3RoV2h5IHwgbnVsbFxuXG4gIG9uSW5wdXQgKGV2ZW50OiBFdmVudCkge1xuICAgIHRoaXMuJGVtaXQoJ3VwZGF0ZTpzZWFyY2gnLCAoZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucGhlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LWVuZDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgZ2FwOiAxNnB4O1xuICB9XG5cbiAgLnBoZWFkX190aXRsZXMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDRweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAucGhlYWRfX3RpdGxlIHtcbiAgICBtYXJnaW46IDA7XG4gICAgZm9udC1zaXplOiAyOHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICBsZXR0ZXItc3BhY2luZzogLTAuMDE1ZW07XG4gIH1cblxuICAucGhlYWRfX3N1bW1hcnkge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5waGVhZF9fdG9vbHMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICB9XG5cbiAgLnBoZWFkX19xdWlldCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLnBoZWFkX19zZWFyY2gge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICB3aWR0aDogMjQwcHg7XG4gICAgaGVpZ2h0OiA0MHB4O1xuICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICBpbnB1dCB7XG4gICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlIEJsdWV0b290aCBidXR0b24gaXMgdGhlIGljb24gYWxvbmUgKEtBTi0yNTMwKTogYSBzcXVhcmUsIG5vdCBhIGxhYmVsbGVkIGJ1dHRvbi5cbiAgLnBoZWFkIC5idG4tLWljb24ge1xuICAgIHdpZHRoOiA0MHB4O1xuICAgIG1pbi13aWR0aDogNDBweDtcbiAgICBwYWRkaW5nOiAwO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICB9XG5cbiAgLy8gUGhvbmU6IHNlYXJjaCBnb2VzICh0aGUgbW9ja3VwKSwgYW5kIEdyaWQgLyBMaXN0IGFuZCBBZGQgc2hhcmUgdGhlIHJvdy5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDY5OXB4KSB7XG4gICAgLnBoZWFkX19zZWFyY2ggeyBkaXNwbGF5OiBub25lOyB9XG4gICAgLnBoZWFkX190b29scyB7IHdpZHRoOiAxMDAlOyB9XG4gICAgLnBoZWFkX190b29scyAuYnRuIHsgZmxleDogMSAxIGF1dG87IH1cbiAgICAucGhlYWRfX3Rvb2xzIC5idG4tLWljb24geyBmbGV4OiAwIDAgYXV0bzsgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvcHJpbnRlcnMvUHJpbnRlcnNIZWFkZXIudnVlIn0=