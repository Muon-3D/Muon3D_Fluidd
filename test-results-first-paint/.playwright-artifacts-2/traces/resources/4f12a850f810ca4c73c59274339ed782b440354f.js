/* unplugin-vue-components disabled */import { VSimpleTable as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCard as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSimpleTable as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCard as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppDialog.vue";
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
import { Component, Prop, VModel, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let McuInformationDialog = class extends Vue {
  open;
  mcu;
};
__decorateClass([
  VModel({ type: Boolean })
], McuInformationDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: Object, required: true })
], McuInformationDialog.prototype, "mcu", 2);
McuInformationDialog = __decorateClass([
  Component({})
], McuInformationDialog);
const _sfc_main = McuInformationDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "title": _vm.$t("app.system_info.label.mcu_information", { mcu: _vm.mcu.name }), "max-width": "500", "no-actions": "" }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_1, { staticClass: "pa-0" }, [_c(__unplugin_components_2, { attrs: { "flat": "" } }, [_c(__unplugin_components_3, [_vm._v(_vm._s(_vm.$t("app.system_info.label.constants")))]), _c(__unplugin_components_4, { attrs: { "dense": "" } }, [_c("tbody", _vm._l(_vm.mcu.mcu_constants, function(value, key) {
    return _c("tr", { key }, [_c("th", [_vm._v(_vm._s(key))]), _c("td", [_vm._v(_vm._s(value))])]);
  }), 0)])], 1), _c(__unplugin_components_5, { attrs: { "flat": "" } }, [_c(__unplugin_components_6, [_vm._v(_vm._s(_vm.$t("app.system_info.label.last_stats")))]), _c(__unplugin_components_7, { attrs: { "dense": "" } }, [_c("tbody", _vm._l(_vm.mcu.last_stats, function(value, key) {
    return _c("tr", { key }, [_c("th", [_vm._v(_vm._s(key))]), _c("td", [_vm._v(_vm._s(value))])]);
  }), 0)])], 1)], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/system/McuInformationDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkNBO0FBR0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUNBO0FBSkE7QUFBQSxFQURBO0FBQUEsR0FEQSxxQkFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEscUJBS0E7QUFMQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNY3VJbmZvcm1hdGlvbkRpYWxvZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8YXBwLWRpYWxvZ1xuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICA6dGl0bGU9XCIkdCgnYXBwLnN5c3RlbV9pbmZvLmxhYmVsLm1jdV9pbmZvcm1hdGlvbicsIHsgbWN1OiBtY3UubmFtZSB9KVwiXG4gICAgbWF4LXdpZHRoPVwiNTAwXCJcbiAgICBuby1hY3Rpb25zXG4gID5cbiAgICA8di1jYXJkLXRleHQgY2xhc3M9XCJwYS0wXCI+XG4gICAgICA8di1jYXJkIGZsYXQ+XG4gICAgICAgIDx2LWNhcmQtdGl0bGU+e3sgJHQoJ2FwcC5zeXN0ZW1faW5mby5sYWJlbC5jb25zdGFudHMnKSB9fTwvdi1jYXJkLXRpdGxlPlxuXG4gICAgICAgIDx2LXNpbXBsZS10YWJsZSBkZW5zZT5cbiAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICA8dHJcbiAgICAgICAgICAgICAgdi1mb3I9XCIodmFsdWUsIGtleSkgaW4gbWN1Lm1jdV9jb25zdGFudHNcIlxuICAgICAgICAgICAgICA6a2V5PVwia2V5XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHRoPnt7IGtleSB9fTwvdGg+XG4gICAgICAgICAgICAgIDx0ZD57eyB2YWx1ZSB9fTwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgIDwvdi1zaW1wbGUtdGFibGU+XG4gICAgICA8L3YtY2FyZD5cblxuICAgICAgPHYtY2FyZCBmbGF0PlxuICAgICAgICA8di1jYXJkLXRpdGxlPnt7ICR0KCdhcHAuc3lzdGVtX2luZm8ubGFiZWwubGFzdF9zdGF0cycpIH19PC92LWNhcmQtdGl0bGU+XG5cbiAgICAgICAgPHYtc2ltcGxlLXRhYmxlIGRlbnNlPlxuICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgIDx0clxuICAgICAgICAgICAgICB2LWZvcj1cIih2YWx1ZSwga2V5KSBpbiBtY3UubGFzdF9zdGF0c1wiXG4gICAgICAgICAgICAgIDprZXk9XCJrZXlcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8dGg+e3sga2V5IH19PC90aD5cbiAgICAgICAgICAgICAgPHRkPnt7IHZhbHVlIH19PC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgPC92LXNpbXBsZS10YWJsZT5cbiAgICAgIDwvdi1jYXJkPlxuICAgIDwvdi1jYXJkLXRleHQ+XG4gIDwvYXBwLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgdHlwZSB7IE1DVSB9IGZyb20gJ0Avc3RvcmUvcHJpbnRlci90eXBlcydcbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVk1vZGVsLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWN1SW5mb3JtYXRpb25EaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogQm9vbGVhbiB9KVxuICAgIG9wZW4/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IG1jdSE6IE1DVVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL3N5c3RlbS9NY3VJbmZvcm1hdGlvbkRpYWxvZy52dWUifQ==