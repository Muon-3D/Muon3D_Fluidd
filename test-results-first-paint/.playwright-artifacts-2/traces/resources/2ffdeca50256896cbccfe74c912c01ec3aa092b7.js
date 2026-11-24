/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import { printerNameParts } from "/src/util/printer-name.ts";
let LibraryOffline = class extends Vue {
  get printerLabel() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
};
LibraryOffline = __decorateClass([
  Component({})
], LibraryOffline);
const _sfc_main = LibraryOffline;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "libofl", attrs: { "role": "status", "data-tid": "library-offline" } }, [_c(__unplugin_components_0, { attrs: { "name": "cloud", "small": "" } }), _c("span", [_vm._v("The material library is offline. Materials on " + _vm._s(_vm.printerLabel) + " still work.")]), _c("button", { staticClass: "libofl__retry", attrs: { "type": "button", "data-tid": "library-retry" }, on: { "click": function($event) {
    return _vm.$emit("retry");
  } } }, [_vm._v(" Retry ")])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/presets/LibraryOffline.vue?vue&type=style&index=0&scoped=5ce70674&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5ce70674",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/presets/LibraryOffline.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF1QkE7QUFDQTtBQUdBO0FBQUEsRUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBSkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTGlicmFyeU9mZmxpbmUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwibGlib2ZsXCJcbiAgICByb2xlPVwic3RhdHVzXCJcbiAgICBkYXRhLXRpZD1cImxpYnJhcnktb2ZmbGluZVwiXG4gID5cbiAgICA8ZnJhbWUtaWNvblxuICAgICAgbmFtZT1cImNsb3VkXCJcbiAgICAgIHNtYWxsXG4gICAgLz5cbiAgICA8c3Bhbj5UaGUgbWF0ZXJpYWwgbGlicmFyeSBpcyBvZmZsaW5lLiBNYXRlcmlhbHMgb24ge3sgcHJpbnRlckxhYmVsIH19IHN0aWxsIHdvcmsuPC9zcGFuPlxuICAgIDxidXR0b25cbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3M9XCJsaWJvZmxfX3JldHJ5XCJcbiAgICAgIGRhdGEtdGlkPVwibGlicmFyeS1yZXRyeVwiXG4gICAgICBAY2xpY2s9XCIkZW1pdCgncmV0cnknKVwiXG4gICAgPlxuICAgICAgUmV0cnlcbiAgICA8L2J1dHRvbj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgcHJpbnRlck5hbWVQYXJ0cyB9IGZyb20gJ0AvdXRpbC9wcmludGVyLW5hbWUnXG5cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaWJyYXJ5T2ZmbGluZSBleHRlbmRzIFZ1ZSB7XG4gIGdldCBwcmludGVyTGFiZWwgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKS5uYW1lXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5saWJvZmwge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gICAgcGFkZGluZzogMTJweCAxNHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG5cbiAgICBzcGFuIHtcbiAgICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIH1cbiAgfVxuXG4gIC5saWJvZmxfX3JldHJ5IHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL3ByZXNldHMvTGlicmFyeU9mZmxpbmUudnVlIn0=