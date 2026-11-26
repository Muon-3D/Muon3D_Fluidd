/* unplugin-vue-components disabled */import { VAlert as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
let ProtectedNotice = class extends Vue {
  get locked() {
    return this.$store.getters["protection/isLocked"];
  }
};
ProtectedNotice = __decorateClass([
  Component({})
], ProtectedNotice);
const _sfc_main = ProtectedNotice;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.locked ? _c(__unplugin_components_0, { staticClass: "protected-notice mb-0", attrs: { "type": "info", "text": "", "icon": "$lock" } }, [_c("div", [_vm._v(_vm._s(_vm.$t("app.protection.msg.locked")))]), _c("div", { staticClass: "text-caption mt-1" }, [_vm._v(" " + _vm._s(_vm.$t("app.protection.msg.panel_only")) + " ")])]) : _vm._e();
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/ProtectedNotice.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7QUFRQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQUpBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlByb3RlY3RlZE5vdGljZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8di1hbGVydFxuICAgIHYtaWY9XCJsb2NrZWRcIlxuICAgIHR5cGU9XCJpbmZvXCJcbiAgICB0ZXh0XG4gICAgaWNvbj1cIiRsb2NrXCJcbiAgICBjbGFzcz1cInByb3RlY3RlZC1ub3RpY2UgbWItMFwiXG4gID5cbiAgICA8ZGl2Pnt7ICR0KCdhcHAucHJvdGVjdGlvbi5tc2cubG9ja2VkJykgfX08L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwidGV4dC1jYXB0aW9uIG10LTFcIj5cbiAgICAgIHt7ICR0KCdhcHAucHJvdGVjdGlvbi5tc2cucGFuZWxfb25seScpIH19XG4gICAgPC9kaXY+XG4gIDwvdi1hbGVydD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5cbi8qKlxuICogU2hvd24gaW4gcGxhY2Ugb2YgYSBjb250cm9sIHRoYXQgTXVvbk9TIG5ldHdvcmsgcHJvdGVjdGlvbiAoU1BFQyBTRUMtOClcbiAqIHRha2VzIGF3YXkgZnJvbSB0aGlzIGJyb3dzZXIsIHNvIHRoZSBhbnN3ZXIgaXMgXCJwcm90ZWN0ZWQsIGFuZCBoZXJlIGlzXG4gKiB3aGVyZSBpdCBpcyBjaGFuZ2VkXCIgcmF0aGVyIHRoYW4gYW4gZXJyb3Igb3IgYSBzaWxlbnRseSBlbXB0eSBjYXJkLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvdGVjdGVkTm90aWNlIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IGxvY2tlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Byb3RlY3Rpb24vaXNMb2NrZWQnXVxuICB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbW1vbi9Qcm90ZWN0ZWROb3RpY2UudnVlIn0=