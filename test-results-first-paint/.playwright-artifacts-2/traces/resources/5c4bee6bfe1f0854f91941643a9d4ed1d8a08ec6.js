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
import CloudAccountDialog from "/src/components/muon-cloud/CloudAccountDialog.vue";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { permissionMessage } from "/src/services/wifi/panel-only.ts";
let PermissionRefusalNotice = class extends Mixins(MuonGatesMixin) {
  refusal;
  signInOpen = false;
  get signedIn() {
    return !!cloudState.account;
  }
  /** The other ways to do it. Only the printer's screen when the printer allows nothing else. */
  get instead() {
    const r = this.refusal;
    const atPrinterOnly = !!r && (r.required === "owner_at_printer" || !r.required && r.allowed.length === 1 && r.allowed[0] === "owner_at_printer");
    return atPrinterOnly ? "Instead: at the printer's screen." : "Instead: at the printer's screen, over Bluetooth (Connect over Bluetooth), or signed in, through Muon3D.";
  }
  get text() {
    return this.refusal ? permissionMessage(this.refusal, this.signedIn) : "";
  }
  /** The printer's own wording, when it adds something. */
  get detail() {
    const message = this.refusal?.message ?? "";
    return message && message !== this.text ? message : "";
  }
  get securityTo() {
    return { path: scopedPath("/settings", activeSlug()), hash: "#security" };
  }
};
__decorateClass([
  Prop({ type: Object, default: null })
], PermissionRefusalNotice.prototype, "refusal", 2);
PermissionRefusalNotice = __decorateClass([
  Component({ components: { CloudAccountDialog } })
], PermissionRefusalNotice);
const _sfc_main = PermissionRefusalNotice;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.refusal ? _c("div", { staticClass: "prn", attrs: { "role": "alert", "data-tid": "permission-refusal" } }, [_vm.detail ? _c("p", { staticClass: "prn__text", attrs: { "data-tid": "permission-refusal-detail" } }, [_vm._v(" " + _vm._s(_vm.detail) + " ")]) : _vm._e(), _c("p", { staticClass: "prn__detail", attrs: { "data-tid": "permission-refusal-text" } }, [_vm._v(" " + _vm._s(_vm.text) + " ")]), _c("p", { staticClass: "prn__detail", attrs: { "data-tid": "permission-refusal-instead" } }, [_vm._v(" " + _vm._s(_vm.instead) + " ")]), _c("div", { staticClass: "prn__actions" }, [!_vm.signedIn ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "permission-refusal-sign-in" }, on: { "click": function($event) {
    _vm.signInOpen = true;
  } } }, [_vm._v(" Sign in ")]) : _vm.canManageAccess === true ? _c("router-link", { staticClass: "cbtn cbtn--ghost", attrs: { "to": _vm.securityTo, "data-tid": "permission-refusal-change" } }, [_vm._v(" Change who can do this ")]) : _vm._e(), _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "permission-refusal-dismiss" }, on: { "click": function($event) {
    return _vm.$emit("dismiss");
  } } }, [_vm._v(" Dismiss ")])], 1), _c("cloud-account-dialog", { model: { value: _vm.signInOpen, callback: function($$v) {
    _vm.signInOpen = $$v;
  }, expression: "signInOpen" } })], 1) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/wifi/PermissionRefusalNotice.vue?vue&type=style&index=0&scoped=1424587d&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "1424587d",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/wifi/PermissionRefusalNotice.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTBEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBLDJCQUNBLHNDQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTlCQTtBQUFBO0FBQUEsR0FEQSx3QkFDQTtBQURBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlBlcm1pc3Npb25SZWZ1c2FsTm90aWNlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICB2LWlmPVwicmVmdXNhbFwiXG4gICAgY2xhc3M9XCJwcm5cIlxuICAgIHJvbGU9XCJhbGVydFwiXG4gICAgZGF0YS10aWQ9XCJwZXJtaXNzaW9uLXJlZnVzYWxcIlxuICA+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJkZXRhaWxcIlxuICAgICAgY2xhc3M9XCJwcm5fX3RleHRcIlxuICAgICAgZGF0YS10aWQ9XCJwZXJtaXNzaW9uLXJlZnVzYWwtZGV0YWlsXCJcbiAgICA+XG4gICAgICB7eyBkZXRhaWwgfX1cbiAgICA8L3A+XG4gICAgPHBcbiAgICAgIGNsYXNzPVwicHJuX19kZXRhaWxcIlxuICAgICAgZGF0YS10aWQ9XCJwZXJtaXNzaW9uLXJlZnVzYWwtdGV4dFwiXG4gICAgPlxuICAgICAge3sgdGV4dCB9fVxuICAgIDwvcD5cbiAgICA8cFxuICAgICAgY2xhc3M9XCJwcm5fX2RldGFpbFwiXG4gICAgICBkYXRhLXRpZD1cInBlcm1pc3Npb24tcmVmdXNhbC1pbnN0ZWFkXCJcbiAgICA+XG4gICAgICB7eyBpbnN0ZWFkIH19XG4gICAgPC9wPlxuICAgIDxkaXYgY2xhc3M9XCJwcm5fX2FjdGlvbnNcIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cIiFzaWduZWRJblwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIGRhdGEtdGlkPVwicGVybWlzc2lvbi1yZWZ1c2FsLXNpZ24taW5cIlxuICAgICAgICBAY2xpY2s9XCJzaWduSW5PcGVuID0gdHJ1ZVwiXG4gICAgICA+XG4gICAgICAgIFNpZ24gaW5cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgIHYtZWxzZS1pZj1cImNhbk1hbmFnZUFjY2VzcyA9PT0gdHJ1ZVwiXG4gICAgICAgIDp0bz1cInNlY3VyaXR5VG9cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICBkYXRhLXRpZD1cInBlcm1pc3Npb24tcmVmdXNhbC1jaGFuZ2VcIlxuICAgICAgPlxuICAgICAgICBDaGFuZ2Ugd2hvIGNhbiBkbyB0aGlzXG4gICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJwZXJtaXNzaW9uLXJlZnVzYWwtZGlzbWlzc1wiXG4gICAgICAgIEBjbGljaz1cIiRlbWl0KCdkaXNtaXNzJylcIlxuICAgICAgPlxuICAgICAgICBEaXNtaXNzXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8Y2xvdWQtYWNjb3VudC1kaWFsb2cgdi1tb2RlbD1cInNpZ25Jbk9wZW5cIiAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTXVvbkdhdGVzTWl4aW4gZnJvbSAnQC9taXhpbnMvbXVvbi1nYXRlcydcbmltcG9ydCBDbG91ZEFjY291bnREaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL211b24tY2xvdWQvQ2xvdWRBY2NvdW50RGlhbG9nLnZ1ZSdcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBwZXJtaXNzaW9uTWVzc2FnZSB9IGZyb20gJ0Avc2VydmljZXMvd2lmaS9wYW5lbC1vbmx5J1xuaW1wb3J0IHR5cGUgeyBSZWZ1c2FsS2luZCB9IGZyb20gJ0Avc2VydmljZXMvd2lmaS9wYW5lbC1vbmx5J1xuXG50eXBlIFBlcm1pc3Npb25SZWZ1c2FsID0gRXh0cmFjdDxSZWZ1c2FsS2luZCwgeyBraW5kOiAncGVybWlzc2lvbicgfT5cblxuLyoqXG4gKiBLQU4tMjQ1NyAoSmFjaywgMTMgTm92KTogdGhlIHByaW50ZXIncyBvd24gbWVzc2FnZSBmaXJzdCwgdGhlbiB3aG8gbWF5IGFuZFxuICogdGhlIHdheXMgdG8gZG8gaXQgaW5zdGVhZDogYXQgdGhlIHByaW50ZXIsIG92ZXIgQmx1ZXRvb3RoLCBvciB0aHJvdWdoIHRoZVxuICogYWNjb3VudCdzIGNsb3VkIHJvdXRlLiBOZXZlciBcInRyeSBhZ2FpbiBoZXJlXCIgKEtBTi0yNDY2IG5vdCBsYW5kZWQpLlxuICogS0FOLTI0NTc6IHRoZSBwcmludGVyJ3MgcGVybWlzc2lvbiBzdG9yZSByZWZ1c2VkIGEgV2ktRmkgb3IgaG90c3BvdCBhY3Rpb24uXG4gKiBTYXlzIHdobyBtYXkgZG8gaXQsIGFuZCBvZmZlcnMgdGhlIGFjdGlvbiB0aGF0IGZpdHM6IFNpZ24gaW4gd2hlbiB0aGlzXG4gKiBicm93c2VyIGhhcyBubyBhY2NvdW50LCBDaGFuZ2Ugd2hvIGNhbiBkbyB0aGlzIChTZXR0aW5ncyA+IFNlY3VyaXR5KSB3aGVuXG4gKiBpdCBkb2VzIGFuZCBtYXkgbWFuYWdlIGFjY2Vzcy4gTm90IGEgcGFuZWwtb25seSBwcmludGVyLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBDbG91ZEFjY291bnREaWFsb2cgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGVybWlzc2lvblJlZnVzYWxOb3RpY2UgZXh0ZW5kcyBNaXhpbnMoTXVvbkdhdGVzTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIGRlZmF1bHQ6IG51bGwgfSkgcmVhZG9ubHkgcmVmdXNhbCE6IFBlcm1pc3Npb25SZWZ1c2FsIHwgbnVsbFxuXG4gIHNpZ25Jbk9wZW4gPSBmYWxzZVxuXG4gIGdldCBzaWduZWRJbiAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhY2xvdWRTdGF0ZS5hY2NvdW50XG4gIH1cblxuICAvKiogVGhlIG90aGVyIHdheXMgdG8gZG8gaXQuIE9ubHkgdGhlIHByaW50ZXIncyBzY3JlZW4gd2hlbiB0aGUgcHJpbnRlciBhbGxvd3Mgbm90aGluZyBlbHNlLiAqL1xuICBnZXQgaW5zdGVhZCAoKTogc3RyaW5nIHtcbiAgICBjb25zdCByID0gdGhpcy5yZWZ1c2FsXG4gICAgY29uc3QgYXRQcmludGVyT25seSA9ICEhciAmJiAoci5yZXF1aXJlZCA9PT0gJ293bmVyX2F0X3ByaW50ZXInIHx8ICghci5yZXF1aXJlZCAmJiByLmFsbG93ZWQubGVuZ3RoID09PSAxICYmIHIuYWxsb3dlZFswXSA9PT0gJ293bmVyX2F0X3ByaW50ZXInKSlcbiAgICByZXR1cm4gYXRQcmludGVyT25seVxuICAgICAgPyBcIkluc3RlYWQ6IGF0IHRoZSBwcmludGVyJ3Mgc2NyZWVuLlwiXG4gICAgICA6IFwiSW5zdGVhZDogYXQgdGhlIHByaW50ZXIncyBzY3JlZW4sIG92ZXIgQmx1ZXRvb3RoIChDb25uZWN0IG92ZXIgQmx1ZXRvb3RoKSwgb3Igc2lnbmVkIGluLCB0aHJvdWdoIE11b24zRC5cIlxuICB9XG5cbiAgZ2V0IHRleHQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucmVmdXNhbCA/IHBlcm1pc3Npb25NZXNzYWdlKHRoaXMucmVmdXNhbCwgdGhpcy5zaWduZWRJbikgOiAnJ1xuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyJ3Mgb3duIHdvcmRpbmcsIHdoZW4gaXQgYWRkcyBzb21ldGhpbmcuICovXG4gIGdldCBkZXRhaWwgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMucmVmdXNhbD8ubWVzc2FnZSA/PyAnJ1xuICAgIHJldHVybiBtZXNzYWdlICYmIG1lc3NhZ2UgIT09IHRoaXMudGV4dCA/IG1lc3NhZ2UgOiAnJ1xuICB9XG5cbiAgZ2V0IHNlY3VyaXR5VG8gKCkge1xuICAgIHJldHVybiB7IHBhdGg6IHNjb3BlZFBhdGgoJy9zZXR0aW5ncycsIGFjdGl2ZVNsdWcoKSksIGhhc2g6ICcjc2VjdXJpdHknIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnBybiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogOHB4O1xuICAgIHBhZGRpbmc6IDEycHggMTRweDtcbiAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1tM2QtbGluZSwgcmdiYSgxMjgsIDEyOCwgMTI4LCAwLjM1KSk7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgfVxuXG4gIC5wcm5fX3RleHQsXG4gIC5wcm5fX2RldGFpbCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5wcm5fX2RldGFpbCB7XG4gICAgb3BhY2l0eTogMC43NTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAucHJuX19hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDhweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvd2lmaS9QZXJtaXNzaW9uUmVmdXNhbE5vdGljZS52dWUifQ==