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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
let CanManageAccess = class extends Mixins(MuonGatesMixin) {
  nonMuon;
  get visible() {
    if (this.isMuonPrinter === false) return this.nonMuon === "show";
    return this.canManageAccess === true;
  }
};
__decorateClass([
  Prop({ type: String, default: "hide", validator: (v) => ["hide", "show"].includes(v) })
], CanManageAccess.prototype, "nonMuon", 2);
CanManageAccess = __decorateClass([
  Component
], CanManageAccess);
const _sfc_main = CanManageAccess;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.visible ? _c("div", { staticClass: "can-manage-access", attrs: { "data-tid": "can-manage-access" } }, [_vm._t("default")], 2) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/gates/CanManageAccess.vue?vue&type=style&index=0&scoped=e8fafc7b&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e8fafc7b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/gates/CanManageAccess.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVdBO0FBQ0E7QUEyQkE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFOQTtBQUFBLEVBREE7QUFBQSxHQURBLGdCQUVBO0FBRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ2FuTWFuYWdlQWNjZXNzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICB2LWlmPVwidmlzaWJsZVwiXG4gICAgY2xhc3M9XCJjYW4tbWFuYWdlLWFjY2Vzc1wiXG4gICAgZGF0YS10aWQ9XCJjYW4tbWFuYWdlLWFjY2Vzc1wiXG4gID5cbiAgICA8c2xvdCAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTXVvbkdhdGVzTWl4aW4gZnJvbSAnQC9taXhpbnMvbXVvbi1nYXRlcydcblxuLyoqXG4gKiBTaG93cyBpdHMgY29udGVudCB0byBhIGNsaWVudCB0aGUgcHJpbnRlciBsZXRzIG1hbmFnZSBhY2Nlc3MsIGFuZCByZW5kZXJzXG4gKiBub3RoaW5nIGZvciBhbnlvbmUgZWxzZTogaGlkZGVuLCBub3QgZ3JleWVkIChQUklOQ0lQTEVTLm1kIHNlY3Rpb24gOSkuXG4gKiBVc2UgaXQgZm9yIHRoZSBjb250cm9scyBvZiB0aGUgcHJvdGVjdGlvbiByb3dzICh3aG8gY2FuIHVzZSB0aGUgcHJpbnRlcixcbiAqIGVudHJ5LCBsZXZlbHMsIGRhdGEpLCB3aGVyZSBBY2Nlc3Mgc2V0dGluZ3Mgc2F5cyBcIk9ubHkgdGhlIG93bmVyIGNhblxuICogY2hhbmdlIHRoaXNcIi5cbiAqXG4gKiBXaGF0IGl0IHRlc3RzIGlzIHRoZSBwcmludGVyJ3Mgb3duIGFuc3dlcjogYHByb3RlY3Rpb246IGFsbG93ZWRgIGZyb21cbiAqIGBzZXJ2ZXIubXVvbi5hY2Nlc3MuY2FwYWJpbGl0aWVzYC4gVGhhdCBpcyBcIm1heSBtYW5hZ2UgYWNjZXNzXCIsIHdoaWNoXG4gKiB0aGUgcHJpbnRlciBhbHNvIGdyYW50cyB0byBhbnkgYWRtaW4sIHRvIHRoZSBwYW5lbCwgdG8gbG9jYWwgYWRkcmVzc2VzXG4gKiBhbmQgdG8gZ2F0ZXdheSBjYWxsZXJzIHdpdGggbm8gbGV2ZWwuIEl0IGlzIG5vdCBcImlzIHRoZSBhY2NvdW50IG93bmVyXCIsXG4gKiBhbmQgbm8gYWNjb3VudC1vd25lciBjaGVjayBpcyBwcm92aWRlZCB5ZXQuIFRoZSBwcmludGVyIGVuZm9yY2VzIHRoZVxuICogcnVsZSBlaXRoZXIgd2F5OyB0aGlzIG9ubHkga2VlcHMgdGhlIGNvbnRyb2xzIG91dCBvZiBzaWdodC5cbiAqXG4gKiBBbnl0aGluZyB0aGF0IGlzIG5vdCBhIGNsZWFyIHllcyBoaWRlcyB0aGUgY29udGVudDogYSBtZW1iZXIsIGEgdmlld2VyLFxuICogYSByZWZ1c2VkICg0MDMpLCBmYWlsZWQgKDV4eCkgb3IgdGltZWQtb3V0IGNhbGwsIGFuIGFuc3dlciBmb3IgYW5vdGhlclxuICogcHJpbnRlciwgYW5kIGEgcHJpbnRlciB3aG9zZSBzZXJ2ZXIgaW5mbyBoYXMgbm90IGxvYWRlZC4gQSBNdW9uIHByaW50ZXJcbiAqIHdpdGggb25seSBtdW9uX3Byb3RlY3Rpb24gaGFzIG5vIGFjY2VzcyByb3V0ZSwgc28gaXQgaGlkZXMgdG9vLlxuICpcbiAqIEEgcHJpbnRlciB0aGF0IGlzIGNlcnRhaW5seSBub3QgYSBNdW9uIChhIGxvYWRlZCBjb21wb25lbnQgbGlzdCB3aXRoXG4gKiBuZWl0aGVyIE11b24gY29tcG9uZW50KSBoYXMgbm8gYWNjb3VudHMgYW5kIG5vIG93bmVyLiBBIHJvdyB0aGF0IGlzXG4gKiBoYXJtbGVzcyB0aGVyZSBvcHRzIGluIHdpdGggYG5vbi1tdW9uPVwic2hvd1wiYDsgbm90aGluZyBlbHNlIHNob3dzXG4gKiBjb250ZW50IG9uIGFuIHVua25vd24gYW5zd2VyLlxuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYW5NYW5hZ2VBY2Nlc3MgZXh0ZW5kcyBNaXhpbnMoTXVvbkdhdGVzTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdoaWRlJywgdmFsaWRhdG9yOiAodjogc3RyaW5nKSA9PiBbJ2hpZGUnLCAnc2hvdyddLmluY2x1ZGVzKHYpIH0pXG4gIHJlYWRvbmx5IG5vbk11b24hOiAnaGlkZScgfCAnc2hvdydcblxuICBnZXQgdmlzaWJsZSAoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuaXNNdW9uUHJpbnRlciA9PT0gZmFsc2UpIHJldHVybiB0aGlzLm5vbk11b24gPT09ICdzaG93J1xuICAgIHJldHVybiB0aGlzLmNhbk1hbmFnZUFjY2VzcyA9PT0gdHJ1ZVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIHNjb3BlZD5cbiAgLmNhbi1tYW5hZ2UtYWNjZXNzIHtcbiAgICBkaXNwbGF5OiBjb250ZW50cztcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL2dhdGVzL0Nhbk1hbmFnZUFjY2Vzcy52dWUifQ==