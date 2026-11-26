/* unplugin-vue-components disabled */import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BluetoothWhyText from "/src/components/printers/BluetoothWhyText.vue";
let AddPrinterSheet = class extends Vue {
  value;
  bluetoothSearch;
  bluetoothOff;
  bluetoothWhy;
  searching;
  network;
  found;
};
__decorateClass([
  Prop({ type: Boolean })
], AddPrinterSheet.prototype, "value", 2);
__decorateClass([
  Prop({ type: Boolean })
], AddPrinterSheet.prototype, "bluetoothSearch", 2);
__decorateClass([
  Prop({ type: Boolean })
], AddPrinterSheet.prototype, "bluetoothOff", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], AddPrinterSheet.prototype, "bluetoothWhy", 2);
__decorateClass([
  Prop({ type: Boolean })
], AddPrinterSheet.prototype, "searching", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], AddPrinterSheet.prototype, "network", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], AddPrinterSheet.prototype, "found", 2);
AddPrinterSheet = __decorateClass([
  Component({ components: { BluetoothWhyText } })
], AddPrinterSheet);
const _sfc_main = AddPrinterSheet;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "max-width": "480", "fullscreen": _vm.$vuetify.breakpoint.xsOnly }, on: { "input": function($event) {
    return _vm.$emit("input", $event);
  } } }, [_c("div", { staticClass: "sheet", attrs: { "data-tid": "add-printer-sheet" } }, [_c("div", { staticClass: "sheet__head" }, [_c("h2", { staticClass: "sheet__title" }, [_vm._v(" Add a printer ")]), _c("button", { staticClass: "sheet__close", attrs: { "type": "button", "aria-label": "Close" }, on: { "click": function($event) {
    return _vm.$emit("input", false);
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "x" } })], 1)]), _c("p", { staticClass: "sheet__lead" }, [_vm._v(" Three ways to find it. Pick the one that matches where the printer is. ")]), _c("div", { staticClass: "sheet__ways" }, [_c("div", { staticClass: "sway", attrs: { "data-tid": "bluetooth-row" } }, [_c("span", { staticClass: "sway__icon" }, [_c(__unplugin_components_2, { attrs: { "name": "bluetooth" } })], 1), _c("div", { staticClass: "sway__text" }, [_c("span", { staticClass: "sway__title" }, [_vm._v("Over Bluetooth")]), _vm.bluetoothSearch && !_vm.bluetoothOff ? _c("span", { staticClass: "sway__about" }, [_vm._v("A new printer, or one that is close. Turn it on and keep it near.")]) : _vm.bluetoothSearch ? _c("span", { staticClass: "sway__about", attrs: { "data-tid": "bluetooth-off" } }, [_c("bluetooth-why-text", { attrs: { "why": _vm.bluetoothWhy } })], 1) : _c("span", { staticClass: "sway__about", attrs: { "data-tid": "bluetooth-unavailable" } }, [_c("bluetooth-why-text", { attrs: { "why": _vm.bluetoothWhy } })], 1)]), _vm.bluetoothSearch ? _c("button", { staticClass: "sbtn sbtn--primary", attrs: { "type": "button", "data-tid": "look-nearby" }, on: { "click": function($event) {
    return _vm.$emit("look-nearby");
  } } }, [_vm._v(" " + _vm._s(_vm.bluetoothOff ? "Turn on Bluetooth search" : "Look nearby") + " ")]) : _vm._e()]), _c("div", { staticClass: "sway" }, [_c("span", { staticClass: "sway__icon" }, [_c(__unplugin_components_3, { attrs: { "name": "wifi" } })], 1), _c("div", { staticClass: "sway__text" }, [_c("span", { staticClass: "sway__title" }, [_vm._v("On this network")]), _c("span", { staticClass: "sway__about" }, [_vm.found ? [_vm._v(_vm._s(_vm.found) + " found. It's listed on the page, under Other printers on your network.")] : _vm.searching ? [_vm._v("Looking" + _vm._s(_vm.network ? ` on ${_vm.network}` : "") + "\u2026")] : [_vm._v("Nothing new found yet.")]], 2)]), _c("button", { staticClass: "sbtn", attrs: { "type": "button", "disabled": _vm.searching, "data-tid": "search-again" }, on: { "click": function($event) {
    return _vm.$emit("rescan");
  } } }, [_vm._v(" Search this network ")])]), _c("div", { staticClass: "sway" }, [_c("span", { staticClass: "sway__icon" }, [_c(__unplugin_components_4, { attrs: { "name": "search" } })], 1), _c("div", { staticClass: "sway__text" }, [_c("span", { staticClass: "sway__title" }, [_vm._v("By its address")]), _c("span", { staticClass: "sway__about" }, [_vm._v("It's on the printer's screen, such as muon-boxwood-367a.local or 192.168.1.20.")])]), _c("button", { staticClass: "sbtn", attrs: { "type": "button", "data-tid": "enter-address" }, on: { "click": function($event) {
    return _vm.$emit("address");
  } } }, [_vm._v(" Add by address ")])])])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/AddPrinterSheet.vue?vue&type=style&index=0&scoped=34270150&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "34270150",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/AddPrinterSheet.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBd0dBO0FBQ0E7QUFRQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFDQTtBQXBCQTtBQUFBLEVBREE7QUFBQSxHQURBLGdCQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxnQkFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZ0JBUUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQVhBLGdCQVlBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FkQSxnQkFlQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBakJBLGdCQWtCQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBcEJBLGdCQXFCQTtBQXJCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBZGRQcmludGVyU2hlZXQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtZGlhbG9nXG4gICAgOnZhbHVlPVwidmFsdWVcIlxuICAgIG1heC13aWR0aD1cIjQ4MFwiXG4gICAgOmZ1bGxzY3JlZW49XCIkdnVldGlmeS5icmVha3BvaW50LnhzT25seVwiXG4gICAgQGlucHV0PVwiJGVtaXQoJ2lucHV0JywgJGV2ZW50KVwiXG4gID5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cInNoZWV0XCJcbiAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItc2hlZXRcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJzaGVldF9faGVhZFwiPlxuICAgICAgICA8aDIgY2xhc3M9XCJzaGVldF9fdGl0bGVcIj5cbiAgICAgICAgICBBZGQgYSBwcmludGVyXG4gICAgICAgIDwvaDI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cInNoZWV0X19jbG9zZVwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkNsb3NlXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInhcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHAgY2xhc3M9XCJzaGVldF9fbGVhZFwiPlxuICAgICAgICBUaHJlZSB3YXlzIHRvIGZpbmQgaXQuIFBpY2sgdGhlIG9uZSB0aGF0IG1hdGNoZXMgd2hlcmUgdGhlIHByaW50ZXIgaXMuXG4gICAgICA8L3A+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJzaGVldF9fd2F5c1wiPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJzd2F5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImJsdWV0b290aC1yb3dcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJzd2F5X19pY29uXCI+PGZyYW1lLWljb24gbmFtZT1cImJsdWV0b290aFwiIC8+PC9zcGFuPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzd2F5X190ZXh0XCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN3YXlfX3RpdGxlXCI+T3ZlciBCbHVldG9vdGg8L3NwYW4+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwiYmx1ZXRvb3RoU2VhcmNoICYmICFibHVldG9vdGhPZmZcIlxuICAgICAgICAgICAgICBjbGFzcz1cInN3YXlfX2Fib3V0XCJcbiAgICAgICAgICAgID5BIG5ldyBwcmludGVyLCBvciBvbmUgdGhhdCBpcyBjbG9zZS4gVHVybiBpdCBvbiBhbmQga2VlcCBpdCBuZWFyLjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIHYtZWxzZS1pZj1cImJsdWV0b290aFNlYXJjaFwiXG4gICAgICAgICAgICAgIGNsYXNzPVwic3dheV9fYWJvdXRcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImJsdWV0b290aC1vZmZcIlxuICAgICAgICAgICAgPjxibHVldG9vdGgtd2h5LXRleHQgOndoeT1cImJsdWV0b290aFdoeVwiIC8+PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgIGNsYXNzPVwic3dheV9fYWJvdXRcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImJsdWV0b290aC11bmF2YWlsYWJsZVwiXG4gICAgICAgICAgICA+PGJsdWV0b290aC13aHktdGV4dCA6d2h5PVwiYmx1ZXRvb3RoV2h5XCIgLz48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1pZj1cImJsdWV0b290aFNlYXJjaFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwic2J0biBzYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwibG9vay1uZWFyYnlcIlxuICAgICAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ2xvb2stbmVhcmJ5JylcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGJsdWV0b290aE9mZiA/ICdUdXJuIG9uIEJsdWV0b290aCBzZWFyY2gnIDogJ0xvb2sgbmVhcmJ5JyB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzPVwic3dheVwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3dheV9faWNvblwiPjxmcmFtZS1pY29uIG5hbWU9XCJ3aWZpXCIgLz48L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInN3YXlfX3RleHRcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3dheV9fdGl0bGVcIj5PbiB0aGlzIG5ldHdvcms8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN3YXlfX2Fib3V0XCI+XG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiZm91bmRcIj57eyBmb3VuZCB9fSBmb3VuZC4gSXQncyBsaXN0ZWQgb24gdGhlIHBhZ2UsIHVuZGVyIE90aGVyIHByaW50ZXJzIG9uIHlvdXIgbmV0d29yay48L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8dGVtcGxhdGUgdi1lbHNlLWlmPVwic2VhcmNoaW5nXCI+TG9va2luZ3t7IG5ldHdvcmsgPyBgIG9uICR7bmV0d29ya31gIDogJycgfX3igKY8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8dGVtcGxhdGUgdi1lbHNlPk5vdGhpbmcgbmV3IGZvdW5kIHlldC48L3RlbXBsYXRlPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJzYnRuXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInNlYXJjaGluZ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNlYXJjaC1hZ2FpblwiXG4gICAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgncmVzY2FuJylcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFNlYXJjaCB0aGlzIG5ldHdvcmtcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzcz1cInN3YXlcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInN3YXlfX2ljb25cIj48ZnJhbWUtaWNvbiBuYW1lPVwic2VhcmNoXCIgLz48L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInN3YXlfX3RleHRcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3dheV9fdGl0bGVcIj5CeSBpdHMgYWRkcmVzczwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3dheV9fYWJvdXRcIj5JdCdzIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuLCBzdWNoIGFzIG11b24tYm94d29vZC0zNjdhLmxvY2FsIG9yIDE5Mi4xNjguMS4yMC48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cInNidG5cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJlbnRlci1hZGRyZXNzXCJcbiAgICAgICAgICAgIEBjbGljaz1cIiRlbWl0KCdhZGRyZXNzJylcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIEFkZCBieSBhZGRyZXNzXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvdi1kaWFsb2c+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEJsdWV0b290aFdoeVRleHQgZnJvbSAnLi9CbHVldG9vdGhXaHlUZXh0LnZ1ZSdcbmltcG9ydCB0eXBlIHsgQmx1ZXRvb3RoV2h5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS91bmF2YWlsYWJsZSdcblxuLyoqXG4gKiBBZGQgcHJpbnRlciAodjMpOiBvbmUgc2hlZXQgd2l0aCB0aGUgd2F5cyBpbiwgc28gdGhlIHBhZ2UgaXRzZWxmIGhhcyBvbmVcbiAqIHByaW1hcnkgYnV0dG9uLiBCbHVldG9vdGgsIHRoaXMgbmV0d29yaywgb3IgYW4gYWRkcmVzcy5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgQmx1ZXRvb3RoV2h5VGV4dCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBZGRQcmludGVyU2hlZXQgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgdmFsdWU/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGJsdWV0b290aFNlYXJjaD86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgYmx1ZXRvb3RoT2ZmPzogYm9vbGVhblxuXG4gIC8qKiBXaHkgQmx1ZXRvb3RoIGNhbm5vdCBiZSB1c2VkIGhlcmUsIHNhaWQgcGxhaW5seS4gKi9cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgYmx1ZXRvb3RoV2h5ITogQmx1ZXRvb3RoV2h5IHwgbnVsbFxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBzZWFyY2hpbmc/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IG5ldHdvcmshOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMCB9KVxuICByZWFkb25seSBmb3VuZCE6IG51bWJlclxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnNoZWV0IHtcbiAgICBtaW4taGVpZ2h0OiAxMDAlO1xuICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5zaGVldF9faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgfVxuXG4gIC5zaGVldF9fdGl0bGUge1xuICAgIG1hcmdpbjogMDtcbiAgICBmb250LXNpemU6IDIwcHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC5zaGVldF9fY2xvc2Uge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDQwcHg7XG4gICAgaGVpZ2h0OiA0MHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC5zaGVldF9fbGVhZCB7XG4gICAgbWFyZ2luOiA0cHggMCAxNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLnNoZWV0X193YXlzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMHB4O1xuICB9XG5cbiAgLnN3YXkge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIHBhZGRpbmc6IDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5zd2F5X19pY29uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDM2cHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuc3dheV9fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgMTgwcHg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuc3dheV9fdGl0bGUgeyBmb250LXNpemU6IDE1cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cbiAgLnN3YXlfX2Fib3V0IHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgZm9udC1zaXplOiAxM3B4OyB9XG5cbiAgLnNidG4ge1xuICAgIGhlaWdodDogMzZweDtcbiAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtc3Ryb25nLCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZykpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcblxuICAgICY6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjU7IH1cbiAgfVxuXG4gIC5zYnRuLS1wcmltYXJ5IHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLW9uLWFjY2VudCwgIzAwMjAxZSk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9wcmludGVycy9BZGRQcmludGVyU2hlZXQudnVlIn0=