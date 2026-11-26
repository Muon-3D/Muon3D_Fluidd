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
import TonePill from "/src/components/printers/TonePill.vue";
let MaintenanceDue = class extends Mixins(MaintenanceMixin) {
  get text() {
    if (!this.dueCount) return "Nothing is due";
    return this.dueCount === 1 ? "1 thing is due" : `${this.dueCount} things are due`;
  }
};
MaintenanceDue = __decorateClass([
  Component({ components: { TonePill } })
], MaintenanceDue);
const _sfc_main = MaintenanceDue;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.klippyReady && _vm.checks.length ? _c("tone-pill", { attrs: { "tone": _vm.dueCount ? "warn" : "ok", "data-tid": "maintenance-due" } }, [_vm._v(" " + _vm._s(_vm.text) + " ")]) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  null,
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceDue.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVdBO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFMQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNYWludGVuYW5jZUR1ZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dG9uZS1waWxsXG4gICAgdi1pZj1cImtsaXBweVJlYWR5ICYmIGNoZWNrcy5sZW5ndGhcIlxuICAgIDp0b25lPVwiZHVlQ291bnQgPyAnd2FybicgOiAnb2snXCJcbiAgICBkYXRhLXRpZD1cIm1haW50ZW5hbmNlLWR1ZVwiXG4gID5cbiAgICB7eyB0ZXh0IH19XG4gIDwvdG9uZS1waWxsPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNYWludGVuYW5jZU1peGluIGZyb20gJ0AvbWl4aW5zL21haW50ZW5hbmNlJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9Ub25lUGlsbC52dWUnXG5cbi8qKiBCZXNpZGUgTWFpbnRlbmFuY2UncyB0aXRsZTogaG93IG1hbnkgY2hlY2tzIGFyZSBkdWUsIG9yIHRoYXQgbm9uZSBhcmUuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUb25lUGlsbCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZUR1ZSBleHRlbmRzIE1peGlucyhNYWludGVuYW5jZU1peGluKSB7XG4gIGdldCB0ZXh0ICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5kdWVDb3VudCkgcmV0dXJuICdOb3RoaW5nIGlzIGR1ZSdcbiAgICByZXR1cm4gdGhpcy5kdWVDb3VudCA9PT0gMSA/ICcxIHRoaW5nIGlzIGR1ZScgOiBgJHt0aGlzLmR1ZUNvdW50fSB0aGluZ3MgYXJlIGR1ZWBcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tYWludGVuYW5jZS9NYWludGVuYW5jZUR1ZS52dWUifQ==