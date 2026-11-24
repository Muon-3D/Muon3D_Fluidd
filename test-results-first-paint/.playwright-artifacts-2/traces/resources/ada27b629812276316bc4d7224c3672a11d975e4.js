/* unplugin-vue-components disabled */import { VCardText as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDivider as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VChip as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppSetting.vue";
import { VCard as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSubheader as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let ProtectionSettings = class extends Vue {
  get status() {
    return this.$store.state.protection.status;
  }
  get isProtected() {
    return this.$store.getters["protection/isProtected"];
  }
  get detail() {
    if (!this.isProtected) return this.$t("app.protection.msg.open").toString();
    return this.$store.getters["protection/isLocked"] ? this.$t("app.protection.msg.locked").toString() : this.$t("app.protection.msg.paired").toString();
  }
};
ProtectionSettings = __decorateClass([
  Component({})
], ProtectionSettings);
const _sfc_main = ProtectionSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.status ? _c("div", [_c(__unplugin_components_0, { attrs: { "id": "protection" } }, [_vm._v(" " + _vm._s(_vm.$t("app.protection.title")) + " ")]), _c(__unplugin_components_1, { staticClass: "mb-4", attrs: { "elevation": 5, "dense": "" } }, [_c(__unplugin_components_2, { attrs: { "title": _vm.$t("app.protection.title"), "sub-title": _vm.$t("app.protection.label.covers") } }, [_c(__unplugin_components_3, { attrs: { "color": _vm.isProtected ? "primary" : void 0, "label": "", "small": "", "data-test": "protection-level" } }, [_c(__unplugin_components_4, { attrs: { "left": "", "small": "" } }, [_vm._v(" " + _vm._s(_vm.isProtected ? "$lock" : "$lockOpen") + " ")]), _vm._v(" " + _vm._s(_vm.isProtected ? _vm.$t("app.protection.label.protected") : _vm.$t("app.protection.label.open")) + " ")], 1)], 1), _c(__unplugin_components_5), _c(__unplugin_components_6, { attrs: { "data-test": "protection-detail" } }, [_c("div", [_vm._v(_vm._s(_vm.detail))]), _c("div", { staticClass: "text-body-2 secondary--text mt-2" }, [_vm._v(" " + _vm._s(_vm.$t("app.protection.msg.panel_only")) + " " + _vm._s(_vm.$t("app.protection.msg.unaffected")) + " ")])])], 1)], 1) : _vm._e();
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/ProtectionSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0Q0E7QUFTQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0Esd0RBQ0Esa0RBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFmQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcm90ZWN0aW9uU2V0dGluZ3MudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdiB2LWlmPVwic3RhdHVzXCI+XG4gICAgPHYtc3ViaGVhZGVyIGlkPVwicHJvdGVjdGlvblwiPlxuICAgICAge3sgJHQoJ2FwcC5wcm90ZWN0aW9uLnRpdGxlJykgfX1cbiAgICA8L3Ytc3ViaGVhZGVyPlxuICAgIDx2LWNhcmRcbiAgICAgIDplbGV2YXRpb249XCI1XCJcbiAgICAgIGRlbnNlXG4gICAgICBjbGFzcz1cIm1iLTRcIlxuICAgID5cbiAgICAgIDxhcHAtc2V0dGluZ1xuICAgICAgICA6dGl0bGU9XCIkdCgnYXBwLnByb3RlY3Rpb24udGl0bGUnKVwiXG4gICAgICAgIDpzdWItdGl0bGU9XCIkdCgnYXBwLnByb3RlY3Rpb24ubGFiZWwuY292ZXJzJylcIlxuICAgICAgPlxuICAgICAgICA8di1jaGlwXG4gICAgICAgICAgOmNvbG9yPVwiaXNQcm90ZWN0ZWQgPyAncHJpbWFyeScgOiB1bmRlZmluZWRcIlxuICAgICAgICAgIGxhYmVsXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgICBkYXRhLXRlc3Q9XCJwcm90ZWN0aW9uLWxldmVsXCJcbiAgICAgICAgPlxuICAgICAgICAgIDx2LWljb25cbiAgICAgICAgICAgIGxlZnRcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgaXNQcm90ZWN0ZWQgPyAnJGxvY2snIDogJyRsb2NrT3BlbicgfX1cbiAgICAgICAgICA8L3YtaWNvbj5cbiAgICAgICAgICB7eyBpc1Byb3RlY3RlZCA/ICR0KCdhcHAucHJvdGVjdGlvbi5sYWJlbC5wcm90ZWN0ZWQnKSA6ICR0KCdhcHAucHJvdGVjdGlvbi5sYWJlbC5vcGVuJykgfX1cbiAgICAgICAgPC92LWNoaXA+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuXG4gICAgICA8di1kaXZpZGVyIC8+XG5cbiAgICAgIDx2LWNhcmQtdGV4dCBkYXRhLXRlc3Q9XCJwcm90ZWN0aW9uLWRldGFpbFwiPlxuICAgICAgICA8ZGl2Pnt7IGRldGFpbCB9fTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1ib2R5LTIgc2Vjb25kYXJ5LS10ZXh0IG10LTJcIj5cbiAgICAgICAgICB7eyAkdCgnYXBwLnByb3RlY3Rpb24ubXNnLnBhbmVsX29ubHknKSB9fVxuICAgICAgICAgIHt7ICR0KCdhcHAucHJvdGVjdGlvbi5tc2cudW5hZmZlY3RlZCcpIH19XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICA8L3YtY2FyZD5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBQcm90ZWN0aW9uU3RhdHVzIH0gZnJvbSAnQC9zdG9yZS9wcm90ZWN0aW9uL3R5cGVzJ1xuXG4vKipcbiAqIE11b25PUyBuZXR3b3JrIHByb3RlY3Rpb24gKFNQRUMgU0VDLTgpLCByZWFkLW9ubHkuIFRoZSBsZXZlbCBpcyBzZXQgYXQgdGhlXG4gKiBwcmludGVyJ3MgcGFuZWwgYW5kIE1vb25yYWtlciByZWZ1c2VzIGEgY2hhbmdlIGZyb20gYW55d2hlcmUgZWxzZSwgc28gdGhlcmVcbiAqIGlzIG5vIHN3aXRjaCBoZXJlIHRvIG9mZmVyLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvdGVjdGlvblNldHRpbmdzIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IHN0YXR1cyAoKTogUHJvdGVjdGlvblN0YXR1cyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5wcm90ZWN0aW9uLnN0YXR1c1xuICB9XG5cbiAgZ2V0IGlzUHJvdGVjdGVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJvdGVjdGlvbi9pc1Byb3RlY3RlZCddXG4gIH1cblxuICBnZXQgZGV0YWlsICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5pc1Byb3RlY3RlZCkgcmV0dXJuIHRoaXMuJHQoJ2FwcC5wcm90ZWN0aW9uLm1zZy5vcGVuJykudG9TdHJpbmcoKVxuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcm90ZWN0aW9uL2lzTG9ja2VkJ11cbiAgICAgID8gdGhpcy4kdCgnYXBwLnByb3RlY3Rpb24ubXNnLmxvY2tlZCcpLnRvU3RyaW5nKClcbiAgICAgIDogdGhpcy4kdCgnYXBwLnByb3RlY3Rpb24ubXNnLnBhaXJlZCcpLnRvU3RyaW5nKClcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9Qcm90ZWN0aW9uU2V0dGluZ3MudnVlIn0=