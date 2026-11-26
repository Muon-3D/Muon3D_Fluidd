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
import PreviewClock from "/src/components/lighting/preview-clock.ts";
let seed = 0;
let LightsStrip = class extends Mixins(PreviewClock) {
  uid = ++seed;
  rows = [7, 19];
};
LightsStrip = __decorateClass([
  Component
], LightsStrip);
const _sfc_main = LightsStrip;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "ls", attrs: { "data-tid": "lights-strip" } }, [_c("svg", { attrs: { "viewBox": "0 0 380 26", "preserveAspectRatio": "none", "role": "img", "aria-label": "Live preview of the Left and Right light strips, 40 LEDs each, shown unrolled" } }, [_c("defs", [_c("filter", { attrs: { "id": `ls-glow-${_vm.uid}`, "x": "-20%", "y": "-100%", "width": "140%", "height": "300%" } }, [_c("feGaussianBlur", { attrs: { "stdDeviation": "2.4" } })], 1)]), _c("g", { attrs: { "opacity": _vm.luminance } }, [_c("g", { attrs: { "filter": `url(#ls-glow-${_vm.uid})`, "opacity": "0.8" } }, [_vm._l(_vm.rows, function(row) {
    return _vm._l(_vm.dots, function(d, i) {
      return _c("circle", { key: `g${row}-${i}`, attrs: { "cx": 10 + i * (360 / 39), "cy": row, "r": "4.9", "fill": d.fill, "opacity": d.opacity } });
    });
  })], 2), _c("g", [_vm._l(_vm.rows, function(row) {
    return _vm._l(_vm.dots, function(d, i) {
      return _c("circle", { key: `d${row}-${i}`, attrs: { "cx": 10 + i * (360 / 39), "cy": row, "r": "2.6", "fill": d.fill, "opacity": d.opacity, "data-tid": "lights-dot" } });
    });
  })], 2)])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/lighting/LightsStrip.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/lighting/LightsStrip.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTJEQTtBQUNBO0FBRUE7QUFJQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFIQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJMaWdodHNTdHJpcC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJsc1wiXG4gICAgZGF0YS10aWQ9XCJsaWdodHMtc3RyaXBcIlxuICA+XG4gICAgPHN2Z1xuICAgICAgdmlld0JveD1cIjAgMCAzODAgMjZcIlxuICAgICAgcHJlc2VydmVBc3BlY3RSYXRpbz1cIm5vbmVcIlxuICAgICAgcm9sZT1cImltZ1wiXG4gICAgICBhcmlhLWxhYmVsPVwiTGl2ZSBwcmV2aWV3IG9mIHRoZSBMZWZ0IGFuZCBSaWdodCBsaWdodCBzdHJpcHMsIDQwIExFRHMgZWFjaCwgc2hvd24gdW5yb2xsZWRcIlxuICAgID5cbiAgICAgIDxkZWZzPlxuICAgICAgICA8ZmlsdGVyXG4gICAgICAgICAgOmlkPVwiYGxzLWdsb3ctJHt1aWR9YFwiXG4gICAgICAgICAgeD1cIi0yMCVcIlxuICAgICAgICAgIHk9XCItMTAwJVwiXG4gICAgICAgICAgd2lkdGg9XCIxNDAlXCJcbiAgICAgICAgICBoZWlnaHQ9XCIzMDAlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249XCIyLjRcIiAvPlxuICAgICAgICA8L2ZpbHRlcj5cbiAgICAgIDwvZGVmcz5cbiAgICAgIDxnIDpvcGFjaXR5PVwibHVtaW5hbmNlXCI+XG4gICAgICAgIDxnXG4gICAgICAgICAgOmZpbHRlcj1cImB1cmwoI2xzLWdsb3ctJHt1aWR9KWBcIlxuICAgICAgICAgIG9wYWNpdHk9XCIwLjhcIlxuICAgICAgICA+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtZm9yPVwicm93IGluIHJvd3NcIj5cbiAgICAgICAgICAgIDxjaXJjbGVcbiAgICAgICAgICAgICAgdi1mb3I9XCIoZCwgaSkgaW4gZG90c1wiXG4gICAgICAgICAgICAgIDprZXk9XCJgZyR7cm93fS0ke2l9YFwiXG4gICAgICAgICAgICAgIDpjeD1cIjEwICsgaSAqICgzNjAgLyAzOSlcIlxuICAgICAgICAgICAgICA6Y3k9XCJyb3dcIlxuICAgICAgICAgICAgICByPVwiNC45XCJcbiAgICAgICAgICAgICAgOmZpbGw9XCJkLmZpbGxcIlxuICAgICAgICAgICAgICA6b3BhY2l0eT1cImQub3BhY2l0eVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvZz5cbiAgICAgICAgPGc+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtZm9yPVwicm93IGluIHJvd3NcIj5cbiAgICAgICAgICAgIDxjaXJjbGVcbiAgICAgICAgICAgICAgdi1mb3I9XCIoZCwgaSkgaW4gZG90c1wiXG4gICAgICAgICAgICAgIDprZXk9XCJgZCR7cm93fS0ke2l9YFwiXG4gICAgICAgICAgICAgIDpjeD1cIjEwICsgaSAqICgzNjAgLyAzOSlcIlxuICAgICAgICAgICAgICA6Y3k9XCJyb3dcIlxuICAgICAgICAgICAgICByPVwiMi42XCJcbiAgICAgICAgICAgICAgOmZpbGw9XCJkLmZpbGxcIlxuICAgICAgICAgICAgICA6b3BhY2l0eT1cImQub3BhY2l0eVwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwibGlnaHRzLWRvdFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvZz5cbiAgICAgIDwvZz5cbiAgICA8L3N2Zz5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFByZXZpZXdDbG9jayBmcm9tICcuL3ByZXZpZXctY2xvY2snXG5cbmxldCBzZWVkID0gMFxuXG4vKiogVGhlIHR3byBzdHJpcHMsIHVucm9sbGVkOiB0aGUgYmFyIG9uIHRoZSBNZWRpdW0gYW5kIExhcmdlIHdpZGdldHMuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaWdodHNTdHJpcCBleHRlbmRzIE1peGlucyhQcmV2aWV3Q2xvY2spIHtcbiAgdWlkID0gKytzZWVkXG4gIHJvd3MgPSBbNywgMTldXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4ubHMgeyBoZWlnaHQ6IDI4cHg7IGJvcmRlci1yYWRpdXM6IDEwcHg7IGJhY2tncm91bmQ6ICMxMDEwMTI7IGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDYpOyBvdmVyZmxvdzogaGlkZGVuOyB9XG4ubHMgc3ZnIHsgZGlzcGxheTogYmxvY2s7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9saWdodGluZy9MaWdodHNTdHJpcC52dWUifQ==