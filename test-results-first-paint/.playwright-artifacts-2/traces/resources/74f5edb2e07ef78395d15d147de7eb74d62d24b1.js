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
import idle from "/src/assets/m1/m1-idle.jpg?import";
import printing from "/src/assets/m1/m1-printing.jpg?import";
import offline from "/src/assets/m1/m1-offline.jpg?import";
let PrinterStage = class extends Vue {
  state;
  height;
  get src() {
    if (this.state === "printing") return printing;
    if (this.state === "offline") return offline;
    return idle;
  }
};
__decorateClass([
  Prop({ type: String, default: "idle" })
], PrinterStage.prototype, "state", 2);
__decorateClass([
  Prop({ type: Number })
], PrinterStage.prototype, "height", 2);
PrinterStage = __decorateClass([
  Component({})
], PrinterStage);
const _sfc_main = PrinterStage;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "printer-stage", class: { "printer-stage--off": _vm.state === "offline" }, style: _vm.height ? { height: `${_vm.height}px` } : void 0 }, [_c("img", { staticClass: "printer-stage__m1", attrs: { "src": _vm.src, "alt": "", "fetchpriority": "high" } }), _vm._t("default")], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/PrinterStage.vue?vue&type=style&index=0&scoped=f3d02c30&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f3d02c30",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/PrinterStage.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWlCQTtBQUNBO0FBQ0E7QUFDQTtBQVFBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBVkE7QUFBQSxFQURBO0FBQUEsR0FEQSxhQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxhQUtBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUHJpbnRlclN0YWdlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cInByaW50ZXItc3RhZ2VcIlxuICAgIDpjbGFzcz1cInsgJ3ByaW50ZXItc3RhZ2UtLW9mZic6IHN0YXRlID09PSAnb2ZmbGluZScgfVwiXG4gICAgOnN0eWxlPVwiaGVpZ2h0ID8geyBoZWlnaHQ6IGAke2hlaWdodH1weGAgfSA6IHVuZGVmaW5lZFwiXG4gID5cbiAgICA8aW1nXG4gICAgICA6c3JjPVwic3JjXCJcbiAgICAgIGFsdD1cIlwiXG4gICAgICBmZXRjaHByaW9yaXR5PVwiaGlnaFwiXG4gICAgICBjbGFzcz1cInByaW50ZXItc3RhZ2VfX20xXCJcbiAgICA+XG4gICAgPHNsb3QgLz5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IGlkbGUgZnJvbSAnQC9hc3NldHMvbTEvbTEtaWRsZS5qcGcnXG5pbXBvcnQgcHJpbnRpbmcgZnJvbSAnQC9hc3NldHMvbTEvbTEtcHJpbnRpbmcuanBnJ1xuaW1wb3J0IG9mZmxpbmUgZnJvbSAnQC9hc3NldHMvbTEvbTEtb2ZmbGluZS5qcGcnXG5pbXBvcnQgdHlwZSB7IFRodW1iU3RhdGUgfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvUHJpbnRlclRodW1iLnZ1ZSdcblxuLyoqXG4gKiBUaGUgd2hvbGUgTTEgb24gdGhlIGxpZ2h0IHN0YWdlIHRoZSBhcHAgc2hvd3MgaXQgb24sIG5ldmVyIGNyb3BwZWQ6XG4gKiBpZGxlLCBwcmludGluZyAoYSBwYXJ0IG9uIHRoZSBwbGF0ZSkgb3Igb2ZmbGluZSAoZGltbWVkKS5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaW50ZXJTdGFnZSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnaWRsZScgfSlcbiAgcmVhZG9ubHkgc3RhdGUhOiBUaHVtYlN0YXRlXG5cbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIgfSlcbiAgcmVhZG9ubHkgaGVpZ2h0PzogbnVtYmVyXG5cbiAgZ2V0IHNyYyAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gJ3ByaW50aW5nJykgcmV0dXJuIHByaW50aW5nXG4gICAgaWYgKHRoaXMuc3RhdGUgPT09ICdvZmZsaW5lJykgcmV0dXJuIG9mZmxpbmVcbiAgICByZXR1cm4gaWRsZVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucHJpbnRlci1zdGFnZSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJvcmRlci1yYWRpdXM6IDE4cHg7XG4gICAgLyogVGhlIHByb2R1Y3Qgc2hvdCBpcyBvbiB3aGl0ZSBhbmQgbXVsdGlwbGllZCBpbiwgc28gaXRzIHN0YWdlIHN0YXlzIGxpZ2h0IGluIGVpdGhlciB0aGVtZTsgdGhlIGxpdmUgTTEgZHJhd3MgaXRzIG93bi4gKi9cbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoMTIwJSA5MCUgYXQgNTAlIDQwJSwgI2VjZWVmMCAwJSwgI2Q4ZGJkZiA2MiUsICNjNGM4Y2QgMTAwJSk7XG4gIH1cblxuICAucHJpbnRlci1zdGFnZS0tb2ZmIHtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoMTIwJSA5MCUgYXQgNTAlIDQwJSwgI2Q5ZDlkZCAwJSwgI2JkYmRjMyA3MCUsICNhOGE4YWYgMTAwJSk7XG4gIH1cblxuICAucHJpbnRlci1zdGFnZV9fbTEge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG1heC13aWR0aDogOTIlO1xuICAgIG1heC1oZWlnaHQ6IDkyJTtcbiAgICBvYmplY3QtZml0OiBjb250YWluO1xuICAgIG1peC1ibGVuZC1tb2RlOiBtdWx0aXBseTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3ByaW50ZXJzL1ByaW50ZXJTdGFnZS52dWUifQ==