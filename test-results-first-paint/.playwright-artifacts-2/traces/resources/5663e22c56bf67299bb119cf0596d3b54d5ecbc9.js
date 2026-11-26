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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import idle from "/src/assets/m1/m1-idle-thumb.jpg?import";
import printing from "/src/assets/m1/m1-printing-thumb.jpg?import";
import offline from "/src/assets/m1/m1-offline-thumb.jpg?import";
let PrinterThumb = class extends Vue {
  size;
  state;
  get src() {
    if (this.state === "printing") return printing;
    if (this.state === "offline") return offline;
    return idle;
  }
};
__decorateClass([
  Prop({ type: Number, default: 40 })
], PrinterThumb.prototype, "size", 2);
__decorateClass([
  Prop({ type: String, default: "idle" })
], PrinterThumb.prototype, "state", 2);
PrinterThumb = __decorateClass([
  Component({})
], PrinterThumb);
const _sfc_main = PrinterThumb;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", { staticClass: "printer-thumb", class: { "printer-thumb--off": _vm.state === "offline" }, style: { width: `${_vm.size}px`, height: `${_vm.size}px`, borderRadius: `${Math.round(_vm.size * 0.28)}px` } }, [_c("img", { attrs: { "src": _vm.src, "alt": "", "width": _vm.size, "height": _vm.size } })]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/PrinterThumb.vue?vue&type=style&index=0&scoped=f0524efd&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f0524efd",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/PrinterThumb.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWdCQTtBQUNBO0FBQ0E7QUFDQTtBQUtBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVZBO0FBQUEsRUFEQTtBQUFBLEdBREEsYUFFQTtBQUdBO0FBQUE7R0FMQSxhQUtBO0FBTEE7QUFBQTtBQUFBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmludGVyVGh1bWIudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNwYW5cbiAgICBjbGFzcz1cInByaW50ZXItdGh1bWJcIlxuICAgIDpjbGFzcz1cInsgJ3ByaW50ZXItdGh1bWItLW9mZic6IHN0YXRlID09PSAnb2ZmbGluZScgfVwiXG4gICAgOnN0eWxlPVwieyB3aWR0aDogYCR7c2l6ZX1weGAsIGhlaWdodDogYCR7c2l6ZX1weGAsIGJvcmRlclJhZGl1czogYCR7TWF0aC5yb3VuZChzaXplICogMC4yOCl9cHhgIH1cIlxuICA+XG4gICAgPGltZ1xuICAgICAgOnNyYz1cInNyY1wiXG4gICAgICBhbHQ9XCJcIlxuICAgICAgOndpZHRoPVwic2l6ZVwiXG4gICAgICA6aGVpZ2h0PVwic2l6ZVwiXG4gICAgPlxuICA8L3NwYW4+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IGlkbGUgZnJvbSAnQC9hc3NldHMvbTEvbTEtaWRsZS10aHVtYi5qcGcnXG5pbXBvcnQgcHJpbnRpbmcgZnJvbSAnQC9hc3NldHMvbTEvbTEtcHJpbnRpbmctdGh1bWIuanBnJ1xuaW1wb3J0IG9mZmxpbmUgZnJvbSAnQC9hc3NldHMvbTEvbTEtb2ZmbGluZS10aHVtYi5qcGcnXG5cbmV4cG9ydCB0eXBlIFRodW1iU3RhdGUgPSAnaWRsZScgfCAncHJpbnRpbmcnIHwgJ29mZmxpbmUnXG5cbi8qKiBUaGUgTTEsIHNtYWxsLCBvbiB0aGUgbGlnaHQgc3RhZ2UgdGhlIGFwcCBzaG93cyBpdCBvbjogcHJpbnRpbmcsIGlkbGUgb3Igb2ZmbGluZS4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmludGVyVGh1bWIgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogNDAgfSlcbiAgcmVhZG9ubHkgc2l6ZSE6IG51bWJlclxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnaWRsZScgfSlcbiAgcmVhZG9ubHkgc3RhdGUhOiBUaHVtYlN0YXRlXG5cbiAgZ2V0IHNyYyAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gJ3ByaW50aW5nJykgcmV0dXJuIHByaW50aW5nXG4gICAgaWYgKHRoaXMuc3RhdGUgPT09ICdvZmZsaW5lJykgcmV0dXJuIG9mZmxpbmVcbiAgICByZXR1cm4gaWRsZVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucHJpbnRlci10aHVtYiB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudCgxMjAlIDkwJSBhdCA1MCUgNDAlLCAjZmJmYmZjIDAlLCAjZTRlNGU4IDYyJSwgI2NmY2ZkNCAxMDAlKTtcblxuICAgIGltZyB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgb2JqZWN0LWZpdDogY292ZXI7XG4gICAgICBtaXgtYmxlbmQtbW9kZTogbXVsdGlwbHk7XG4gICAgfVxuICB9XG5cbiAgLnByaW50ZXItdGh1bWItLW9mZiB7XG4gICAgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KDEyMCUgOTAlIGF0IDUwJSA0MCUsICNkOWQ5ZGQgMCUsICNiZGJkYzMgNzAlLCAjYThhOGFmIDEwMCUpO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvUHJpbnRlclRodW1iLnZ1ZSJ9