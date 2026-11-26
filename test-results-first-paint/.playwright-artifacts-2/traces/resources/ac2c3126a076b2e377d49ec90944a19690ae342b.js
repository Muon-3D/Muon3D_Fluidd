/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import MaintenanceTile from "/src/components/maintenance/MaintenanceTile.vue";
import { SERVICE_PRINT_HOURS } from "/src/services/maintenance/consumables.ts";
let MaintenanceWear = class extends Mixins(MaintenanceMixin) {
  get note() {
    if (this.printHours === null) return "Print history is not available on this printer.";
    const left = SERVICE_PRINT_HOURS - this.printHours;
    return left > 0 ? `Service reminder at ${SERVICE_PRINT_HOURS} print hours, ${left} h to go.` : `Past the ${SERVICE_PRINT_HOURS} print hour service reminder.`;
  }
};
MaintenanceWear = __decorateClass([
  Component({ components: { MaintenanceTile } })
], MaintenanceWear);
const _sfc_main = MaintenanceWear;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Uptime and wear", "icon": "clock", "data-tid": "maintenance-wear" } }, [_c("div", { staticClass: "mwear__stats" }, [_c("div", [_c("small", [_vm._v("Print hours")]), _c("b", [_vm._v(_vm._s(_vm.printHours === null ? "\u2014" : `${_vm.printHours} h`))])]), _c("div", [_c("small", [_vm._v("Prints")]), _c("b", [_vm._v(_vm._s(_vm.printCount === null ? "\u2014" : _vm.printCount))])])]), _c("p", { staticClass: "mwear__note" }, [_vm._v(" " + _vm._s(_vm.note) + " ")])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MaintenanceWear.vue?vue&type=style&index=0&scoped=9a771fab&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9a771fab",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceWear.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXVCQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFDQSw2RUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk1haW50ZW5hbmNlV2Vhci52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8bWFpbnRlbmFuY2UtdGlsZVxuICAgIHRpdGxlPVwiVXB0aW1lIGFuZCB3ZWFyXCJcbiAgICBpY29uPVwiY2xvY2tcIlxuICAgIGRhdGEtdGlkPVwibWFpbnRlbmFuY2Utd2VhclwiXG4gID5cbiAgICA8ZGl2IGNsYXNzPVwibXdlYXJfX3N0YXRzXCI+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c21hbGw+UHJpbnQgaG91cnM8L3NtYWxsPlxuICAgICAgICA8Yj57eyBwcmludEhvdXJzID09PSBudWxsID8gJ+KAlCcgOiBgJHtwcmludEhvdXJzfSBoYCB9fTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNtYWxsPlByaW50czwvc21hbGw+XG4gICAgICAgIDxiPnt7IHByaW50Q291bnQgPT09IG51bGwgPyAn4oCUJyA6IHByaW50Q291bnQgfX08L2I+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8cCBjbGFzcz1cIm13ZWFyX19ub3RlXCI+XG4gICAgICB7eyBub3RlIH19XG4gICAgPC9wPlxuICA8L21haW50ZW5hbmNlLXRpbGU+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFpbnRlbmFuY2UnXG5pbXBvcnQgTWFpbnRlbmFuY2VUaWxlIGZyb20gJy4vTWFpbnRlbmFuY2VUaWxlLnZ1ZSdcbmltcG9ydCB7IFNFUlZJQ0VfUFJJTlRfSE9VUlMgfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL2NvbnN1bWFibGVzJ1xuXG4vKiogV2hhdCB0aGlzIHByaW50ZXIgaGFzIGRvbmU6IHByaW50IGhvdXJzIGFuZCBwcmludHMsIHdpdGggd2hlbiBhIHNlcnZpY2UgaXMgZHVlLiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTWFpbnRlbmFuY2VUaWxlIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1haW50ZW5hbmNlV2VhciBleHRlbmRzIE1peGlucyhNYWludGVuYW5jZU1peGluKSB7XG4gIGdldCBub3RlICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnByaW50SG91cnMgPT09IG51bGwpIHJldHVybiAnUHJpbnQgaGlzdG9yeSBpcyBub3QgYXZhaWxhYmxlIG9uIHRoaXMgcHJpbnRlci4nXG4gICAgY29uc3QgbGVmdCA9IFNFUlZJQ0VfUFJJTlRfSE9VUlMgLSB0aGlzLnByaW50SG91cnNcbiAgICByZXR1cm4gbGVmdCA+IDBcbiAgICAgID8gYFNlcnZpY2UgcmVtaW5kZXIgYXQgJHtTRVJWSUNFX1BSSU5UX0hPVVJTfSBwcmludCBob3VycywgJHtsZWZ0fSBoIHRvIGdvLmBcbiAgICAgIDogYFBhc3QgdGhlICR7U0VSVklDRV9QUklOVF9IT1VSU30gcHJpbnQgaG91ciBzZXJ2aWNlIHJlbWluZGVyLmBcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm13ZWFyX19zdGF0cyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBnYXA6IDEwcHg7XG5cbiAgICA+IGRpdiB7XG4gICAgICBmbGV4OiAxIDEgMDtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIHBhZGRpbmc6IDEwcHggMTJweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICB9XG5cbiAgICBzbWFsbCB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgIH1cblxuICAgIGIge1xuICAgICAgZm9udC1zaXplOiAxOHB4O1xuICAgICAgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtcztcbiAgICB9XG4gIH1cblxuICAubXdlYXJfX25vdGUge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL21haW50ZW5hbmNlL01haW50ZW5hbmNlV2Vhci52dWUifQ==