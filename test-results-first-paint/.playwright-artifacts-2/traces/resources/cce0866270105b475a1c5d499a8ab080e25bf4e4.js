/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { emptyLine, foundAnything, progressLine } from "/src/services/scan/text.ts";
import { scanState } from "/src/services/scan/state.ts";
import PrinterRouteProblem from "/src/components/muon-cloud/PrinterRouteProblem.vue";
let ScanResults = class extends Vue {
  problem = "";
  ask = false;
  /** Open a printer found securely: connected in place in this tab (KAN-5459), never an address change. */
  async openSecure(p) {
    this.problem = "";
    this.ask = false;
    const { openOnNetwork } = await import("/src/services/muon-cloud/connect-in-place.ts");
    const { printerHomePath } = await import("/src/services/printer-pages/index.ts");
    const r = await openOnNetwork({ name: p.secureName, label: p.name, printerId: p.id });
    if (r.opened) this.$router.push(printerHomePath()).catch(() => {
    });
    this.problem = r.line ?? "";
    this.ask = r.ask;
  }
  get state() {
    return scanState;
  }
  get progress() {
    return progressLine(scanState);
  }
  get found() {
    return foundAnything(scanState);
  }
  get empty() {
    return emptyLine(scanState);
  }
};
ScanResults = __decorateClass([
  Component({ components: { PrinterRouteProblem } })
], ScanResults);
const _sfc_main = ScanResults;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.state.phase !== "idle" ? _c("section", { staticClass: "scan", attrs: { "data-tid": "scan-results" } }, [_vm.state.phase === "scanning" ? _c("p", { staticClass: "scan__progress", attrs: { "data-tid": "scan-progress" } }, [_c(__unplugin_components_0, { attrs: { "indeterminate": "", "size": "14", "width": "2" } }), _vm._v(" " + _vm._s(_vm.progress) + " ")], 1) : _vm._e(), _c("printer-route-problem", { attrs: { "problem": _vm.problem ? { line: _vm.problem, choices: [] } : null, "ask": _vm.ask }, on: { "cancel": function($event) {
    _vm.ask = false;
  } } }), _vm.state.secure.length ? _c("div", { staticClass: "rows" }, _vm._l(_vm.state.secure, function(p) {
    return _c("div", { key: `s-${p.id}`, staticClass: "row", attrs: { "data-tid": "scan-secure" } }, [_c("span", { staticClass: "row__icon" }, [_c(__unplugin_components_1, { attrs: { "name": "printer" } })], 1), _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v(_vm._s(p.name))]), _c("span", { staticClass: "row__sub" }, [_vm._v("On this network (secure)")])]), _c("button", { staticClass: "btn btn--primary btn--sm", attrs: { "type": "button", "data-tid": "scan-open-secure" }, on: { "click": function($event) {
      return _vm.openSecure(p);
    } } }, [_vm._v(" Open ")])]);
  }), 0) : _vm._e(), _vm.state.heard ? _c("p", { staticClass: "scan__line", attrs: { "data-tid": "scan-bluetooth-found" } }, [_vm._v(" Found over Bluetooth: " + _vm._s(_vm.state.heard.display || _vm.state.heard.localName) + " ")]) : _vm._e(), _vm.state.cloud === "skipped" && _vm.state.cloudWhy ? _c("p", { staticClass: "scan__note", attrs: { "data-tid": "scan-cloud-skipped" } }, [_vm._v(" " + _vm._s(_vm.state.cloudWhy) + " ")]) : _vm._e(), _vm.state.bluetooth === "skipped" && _vm.state.bluetoothWhy ? _c("p", { staticClass: "scan__note", attrs: { "data-tid": "scan-bluetooth-skipped" } }, [_vm._v(" " + _vm._s(_vm.state.bluetoothWhy) + " ")]) : _vm._e(), _vm.state.phase === "done" && !_vm.found ? _c("p", { staticClass: "scan__line", attrs: { "data-tid": "scan-empty" } }, [_vm._v(" " + _vm._s(_vm.empty) + " ")]) : _vm._e()], 1) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/ScanResults.vue?vue&type=style&index=0&scoped=8bf6a0e5&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "8bf6a0e5",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/ScanResults.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBbUZBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEvQkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiU2NhblJlc3VsdHMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNlY3Rpb25cbiAgICB2LWlmPVwic3RhdGUucGhhc2UgIT09ICdpZGxlJ1wiXG4gICAgY2xhc3M9XCJzY2FuXCJcbiAgICBkYXRhLXRpZD1cInNjYW4tcmVzdWx0c1wiXG4gID5cbiAgICA8cFxuICAgICAgdi1pZj1cInN0YXRlLnBoYXNlID09PSAnc2Nhbm5pbmcnXCJcbiAgICAgIGNsYXNzPVwic2Nhbl9fcHJvZ3Jlc3NcIlxuICAgICAgZGF0YS10aWQ9XCJzY2FuLXByb2dyZXNzXCJcbiAgICA+XG4gICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgIHNpemU9XCIxNFwiXG4gICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAvPlxuICAgICAge3sgcHJvZ3Jlc3MgfX1cbiAgICA8L3A+XG5cbiAgICA8cHJpbnRlci1yb3V0ZS1wcm9ibGVtXG4gICAgICA6cHJvYmxlbT1cInByb2JsZW0gPyB7IGxpbmU6IHByb2JsZW0sIGNob2ljZXM6IFtdIH0gOiBudWxsXCJcbiAgICAgIDphc2s9XCJhc2tcIlxuICAgICAgQGNhbmNlbD1cImFzayA9IGZhbHNlXCJcbiAgICAvPlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cInN0YXRlLnNlY3VyZS5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJyb3dzXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZm9yPVwicCBpbiBzdGF0ZS5zZWN1cmVcIlxuICAgICAgICA6a2V5PVwiYHMtJHtwLmlkfWBcIlxuICAgICAgICBjbGFzcz1cInJvd1wiXG4gICAgICAgIGRhdGEtdGlkPVwic2Nhbi1zZWN1cmVcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19faWNvblwiPjxmcmFtZS1pY29uIG5hbWU9XCJwcmludGVyXCIgLz48L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyb3dfX3RleHRcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fdGl0bGVcIj57eyBwLm5hbWUgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJyb3dfX3N1YlwiPk9uIHRoaXMgbmV0d29yayAoc2VjdXJlKTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImJ0biBidG4tLXByaW1hcnkgYnRuLS1zbVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzY2FuLW9wZW4tc2VjdXJlXCJcbiAgICAgICAgICBAY2xpY2s9XCJvcGVuU2VjdXJlKHApXCJcbiAgICAgICAgPlxuICAgICAgICAgIE9wZW5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxwXG4gICAgICB2LWlmPVwic3RhdGUuaGVhcmRcIlxuICAgICAgY2xhc3M9XCJzY2FuX19saW5lXCJcbiAgICAgIGRhdGEtdGlkPVwic2Nhbi1ibHVldG9vdGgtZm91bmRcIlxuICAgID5cbiAgICAgIEZvdW5kIG92ZXIgQmx1ZXRvb3RoOiB7eyBzdGF0ZS5oZWFyZC5kaXNwbGF5IHx8IHN0YXRlLmhlYXJkLmxvY2FsTmFtZSB9fVxuICAgIDwvcD5cbiAgICA8cFxuICAgICAgdi1pZj1cInN0YXRlLmNsb3VkID09PSAnc2tpcHBlZCcgJiYgc3RhdGUuY2xvdWRXaHlcIlxuICAgICAgY2xhc3M9XCJzY2FuX19ub3RlXCJcbiAgICAgIGRhdGEtdGlkPVwic2Nhbi1jbG91ZC1za2lwcGVkXCJcbiAgICA+XG4gICAgICB7eyBzdGF0ZS5jbG91ZFdoeSB9fVxuICAgIDwvcD5cbiAgICA8cFxuICAgICAgdi1pZj1cInN0YXRlLmJsdWV0b290aCA9PT0gJ3NraXBwZWQnICYmIHN0YXRlLmJsdWV0b290aFdoeVwiXG4gICAgICBjbGFzcz1cInNjYW5fX25vdGVcIlxuICAgICAgZGF0YS10aWQ9XCJzY2FuLWJsdWV0b290aC1za2lwcGVkXCJcbiAgICA+XG4gICAgICB7eyBzdGF0ZS5ibHVldG9vdGhXaHkgfX1cbiAgICA8L3A+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJzdGF0ZS5waGFzZSA9PT0gJ2RvbmUnICYmICFmb3VuZFwiXG4gICAgICBjbGFzcz1cInNjYW5fX2xpbmVcIlxuICAgICAgZGF0YS10aWQ9XCJzY2FuLWVtcHR5XCJcbiAgICA+XG4gICAgICB7eyBlbXB0eSB9fVxuICAgIDwvcD5cbiAgPC9zZWN0aW9uPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IGVtcHR5TGluZSwgZm91bmRBbnl0aGluZywgcHJvZ3Jlc3NMaW5lIH0gZnJvbSAnQC9zZXJ2aWNlcy9zY2FuL3RleHQnXG5pbXBvcnQgeyBzY2FuU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL3NjYW4vc3RhdGUnXG5pbXBvcnQgUHJpbnRlclJvdXRlUHJvYmxlbSBmcm9tICdAL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9QcmludGVyUm91dGVQcm9ibGVtLnZ1ZSdcblxuLyoqIFdoYXQgdGhlIHNjYW4gZm91bmQgYW5kIHdoYXQgaXQgaXMgZG9pbmcgKEtBTi01NDA5KS4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFByaW50ZXJSb3V0ZVByb2JsZW0gfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NhblJlc3VsdHMgZXh0ZW5kcyBWdWUge1xuICBwcm9ibGVtID0gJydcbiAgYXNrID0gZmFsc2VcblxuICAvKiogT3BlbiBhIHByaW50ZXIgZm91bmQgc2VjdXJlbHk6IGNvbm5lY3RlZCBpbiBwbGFjZSBpbiB0aGlzIHRhYiAoS0FOLTU0NTkpLCBuZXZlciBhbiBhZGRyZXNzIGNoYW5nZS4gKi9cbiAgYXN5bmMgb3BlblNlY3VyZSAocDogeyBpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHNlY3VyZU5hbWU6IHN0cmluZyB9KSB7XG4gICAgdGhpcy5wcm9ibGVtID0gJydcbiAgICB0aGlzLmFzayA9IGZhbHNlXG4gICAgY29uc3QgeyBvcGVuT25OZXR3b3JrIH0gPSBhd2FpdCBpbXBvcnQoJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9jb25uZWN0LWluLXBsYWNlJylcbiAgICBjb25zdCB7IHByaW50ZXJIb21lUGF0aCB9ID0gYXdhaXQgaW1wb3J0KCdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnKVxuICAgIGNvbnN0IHIgPSBhd2FpdCBvcGVuT25OZXR3b3JrKHsgbmFtZTogcC5zZWN1cmVOYW1lLCBsYWJlbDogcC5uYW1lLCBwcmludGVySWQ6IHAuaWQgfSlcbiAgICBpZiAoci5vcGVuZWQpIHRoaXMuJHJvdXRlci5wdXNoKHByaW50ZXJIb21lUGF0aCgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB0aGlzLnByb2JsZW0gPSByLmxpbmUgPz8gJydcbiAgICB0aGlzLmFzayA9IHIuYXNrXG4gIH1cblxuICBnZXQgc3RhdGUgKCkge1xuICAgIHJldHVybiBzY2FuU3RhdGVcbiAgfVxuXG4gIGdldCBwcm9ncmVzcyAoKSB7XG4gICAgcmV0dXJuIHByb2dyZXNzTGluZShzY2FuU3RhdGUpXG4gIH1cblxuICBnZXQgZm91bmQgKCkge1xuICAgIHJldHVybiBmb3VuZEFueXRoaW5nKHNjYW5TdGF0ZSlcbiAgfVxuXG4gIGdldCBlbXB0eSAoKSB7XG4gICAgcmV0dXJuIGVtcHR5TGluZShzY2FuU3RhdGUpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5zY2FuIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMHB4O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIG1hcmdpbi1ib3R0b206IDE0cHg7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgfVxuXG4gIC5zY2FuX19wcm9ncmVzcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAuc2Nhbl9fbGluZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLnNjYW5fX25vdGUge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3ByaW50ZXJzL1NjYW5SZXN1bHRzLnZ1ZSJ9