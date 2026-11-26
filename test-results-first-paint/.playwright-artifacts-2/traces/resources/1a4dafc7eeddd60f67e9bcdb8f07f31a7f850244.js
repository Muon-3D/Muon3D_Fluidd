/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCol as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VRow as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VContainer as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VOverlay as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
let AppDragOverlay = class extends Vue {
  value;
  message;
  icon;
};
__decorateClass([
  Prop({ type: Boolean })
], AppDragOverlay.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, required: true })
], AppDragOverlay.prototype, "message", 2);
__decorateClass([
  Prop({ type: String, required: true })
], AppDragOverlay.prototype, "icon", 2);
AppDragOverlay = __decorateClass([
  Component({})
], AppDragOverlay);
const _sfc_main = AppDragOverlay;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, _vm._b({ staticClass: "dragOverlay", attrs: { "value": _vm.value, "opacity": 0.85 } }, "v-overlay", _vm.$attrs, false), [_c(__unplugin_components_1, [_c(__unplugin_components_2, { staticClass: "fill-height", attrs: { "align-content": "center", "justify": "center", "no-gutters": "" } }, [_c(__unplugin_components_3, { staticClass: "text-h6 font-weight-light text-center", attrs: { "cols": "12", "sm": "6" } }, [_c(__unplugin_components_4, { staticClass: "mr-1", attrs: { "x-large": "" } }, [_vm._v(" " + _vm._s(_vm.icon) + " ")]), _c("span", { domProps: { "innerHTML": _vm._s(_vm.message) } })], 1)], 1)], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/AppDragOverlay.vue?vue&type=style&index=0&scoped=3c50070d&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3c50070d",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppDragOverlay.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBaUNBO0FBR0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFDQTtBQVBBO0FBQUEsRUFEQTtBQUFBLEdBREEsZUFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsZUFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZUFRQTtBQVJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFwcERyYWdPdmVybGF5LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LW92ZXJsYXlcbiAgICB2LWJpbmQ9XCIkYXR0cnNcIlxuICAgIGNsYXNzPVwiZHJhZ092ZXJsYXlcIlxuICAgIDp2YWx1ZT1cInZhbHVlXCJcbiAgICA6b3BhY2l0eT1cIjAuODVcIlxuICA+XG4gICAgPHYtY29udGFpbmVyPlxuICAgICAgPHYtcm93XG4gICAgICAgIGNsYXNzPVwiZmlsbC1oZWlnaHRcIlxuICAgICAgICBhbGlnbi1jb250ZW50PVwiY2VudGVyXCJcbiAgICAgICAganVzdGlmeT1cImNlbnRlclwiXG4gICAgICAgIG5vLWd1dHRlcnNcbiAgICAgID5cbiAgICAgICAgPHYtY29sXG4gICAgICAgICAgY2xhc3M9XCJ0ZXh0LWg2IGZvbnQtd2VpZ2h0LWxpZ2h0IHRleHQtY2VudGVyXCJcbiAgICAgICAgICBjb2xzPVwiMTJcIlxuICAgICAgICAgIHNtPVwiNlwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1pY29uXG4gICAgICAgICAgICB4LWxhcmdlXG4gICAgICAgICAgICBjbGFzcz1cIm1yLTFcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGljb24gfX1cbiAgICAgICAgICA8L3YtaWNvbj5cbiAgICAgICAgICA8c3BhbiB2LWh0bWw9XCJtZXNzYWdlXCIgLz5cbiAgICAgICAgPC92LWNvbD5cbiAgICAgIDwvdi1yb3c+XG4gICAgPC92LWNvbnRhaW5lcj5cbiAgPC92LW92ZXJsYXk+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwRHJhZ092ZXJsYXkgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgdmFsdWU/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IG1lc3NhZ2UhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgaWNvbiE6IHN0cmluZ1xufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmRyYWdPdmVybGF5LnYtb3ZlcmxheS0tYWN0aXZlIHtcbiAgICBib3JkZXI6IGRhc2hlZCAzcHggIzYxNjE2MTtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmRyYWdPdmVybGF5IDpkZWVwKC52LW92ZXJsYXlfX2NvbnRlbnQpIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3VpL0FwcERyYWdPdmVybGF5LnZ1ZSJ9