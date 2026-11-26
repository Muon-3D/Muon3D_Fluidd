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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ReconnectMixin from "/src/mixins/reconnect.ts";
import { retryIn } from "/src/services/connection/view.ts";
import { bluetoothOpening } from "/src/services/muon-ble/link.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
let ConnectionBanner = class extends Mixins(ReconnectMixin) {
  kind;
  /** A try is running now, rather than waiting its turn. */
  get trying() {
    return this.socketConnecting && !this.retryPending;
  }
  /** Re-opening onto Bluetooth after Connect over Bluetooth: a wait the person asked for, not a drop. */
  get switchingToBluetooth() {
    const id = cloudState.activePrinterId;
    return this.kind === "reconnecting" && !!id && bluetoothOpening(id);
  }
  get title() {
    if (this.kind === "quiet") return `No word from ${this.printerName} for a few seconds`;
    if (this.switchingToBluetooth) return "Switching to Bluetooth\u2026";
    return this.kind === "offline" ? "Offline" : "Reconnecting\u2026";
  }
  get detail() {
    if (this.kind === "quiet") return "Probably a slow network. Nothing is lost.";
    if (this.switchingToBluetooth) return `Bringing up the Bluetooth link to ${this.printerName}. The page keeps its last view.`;
    if (this.kind === "offline") return `${this.printerName} has been offline for at least two minutes. The page keeps its last view.`;
    const wait = this.retryInMs;
    const when = this.trying ? "Trying again now." : wait !== null ? `Trying again in ${retryIn(wait)}.` : "Not trying.";
    return `${when} The page keeps its last view.`;
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], ConnectionBanner.prototype, "kind", 2);
ConnectionBanner = __decorateClass([
  Component({})
], ConnectionBanner);
const _sfc_main = ConnectionBanner;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "conn-bar", class: `conn-bar--${_vm.kind}`, attrs: { "role": "status", "aria-live": "polite", "data-tid": `connection-${_vm.kind}` } }, [_vm.kind === "quiet" ? _c("span", { staticClass: "conn-bar__dot" }) : _c(__unplugin_components_0, { staticClass: "conn-bar__icon", attrs: { "name": "wifi" } }), _c("div", { staticClass: "conn-bar__text" }, [_c("strong", [_vm._v(_vm._s(_vm.title))]), _c("span", [_vm._v(_vm._s(_vm.detail))])]), _vm.kind !== "quiet" && !_vm.trying ? _c("button", { staticClass: "cbtn conn-bar__btn", attrs: { "type": "button", "data-tid": "connection-try-now" }, on: { "click": _vm.tryNow } }, [_vm._v(" Try now ")]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/ConnectionBanner.vue?vue&type=style&index=0&scoped=47ff0e11&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "47ff0e11",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/ConnectionBanner.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFrQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBM0JBO0FBQUEsRUFEQTtBQUFBLEdBREEsaUJBRUE7QUFGQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb25uZWN0aW9uQmFubmVyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cImNvbm4tYmFyXCJcbiAgICA6Y2xhc3M9XCJgY29ubi1iYXItLSR7a2luZH1gXCJcbiAgICByb2xlPVwic3RhdHVzXCJcbiAgICBhcmlhLWxpdmU9XCJwb2xpdGVcIlxuICAgIDpkYXRhLXRpZD1cImBjb25uZWN0aW9uLSR7a2luZH1gXCJcbiAgPlxuICAgIDxzcGFuXG4gICAgICB2LWlmPVwia2luZCA9PT0gJ3F1aWV0J1wiXG4gICAgICBjbGFzcz1cImNvbm4tYmFyX19kb3RcIlxuICAgIC8+XG4gICAgPGZyYW1lLWljb25cbiAgICAgIHYtZWxzZVxuICAgICAgbmFtZT1cIndpZmlcIlxuICAgICAgY2xhc3M9XCJjb25uLWJhcl9faWNvblwiXG4gICAgLz5cbiAgICA8ZGl2IGNsYXNzPVwiY29ubi1iYXJfX3RleHRcIj5cbiAgICAgIDxzdHJvbmc+e3sgdGl0bGUgfX08L3N0cm9uZz5cbiAgICAgIDxzcGFuPnt7IGRldGFpbCB9fTwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgICA8YnV0dG9uXG4gICAgICB2LWlmPVwia2luZCAhPT0gJ3F1aWV0JyAmJiAhdHJ5aW5nXCJcbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3M9XCJjYnRuIGNvbm4tYmFyX19idG5cIlxuICAgICAgZGF0YS10aWQ9XCJjb25uZWN0aW9uLXRyeS1ub3dcIlxuICAgICAgQGNsaWNrPVwidHJ5Tm93XCJcbiAgICA+XG4gICAgICBUcnkgbm93XG4gICAgPC9idXR0b24+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBSZWNvbm5lY3RNaXhpbiBmcm9tICdAL21peGlucy9yZWNvbm5lY3QnXG5pbXBvcnQgeyByZXRyeUluIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb25uZWN0aW9uL3ZpZXcnXG5pbXBvcnQgeyBibHVldG9vdGhPcGVuaW5nIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS9saW5rJ1xuaW1wb3J0IHsgY2xvdWRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcblxuLyoqXG4gKiBPdmVyIGEgcGFnZSB3aG9zZSBwcmludGVyIGhhcyBnb25lIHF1aWV0IG9yIGRyb3BwZWQgKHRoZSBjb25jZXB0IHNoZWV0J3NcbiAqIFN0YXRlcyBib2FyZCk6IGl0IHNheXMgc28gYW5kIGtlZXBzIHRyeWluZywgYW5kIHRoZSBwYWdlIHVuZGVybmVhdGhcbiAqIGtlZXBzIGl0cyBsYXN0IHZpZXcgaW5zdGVhZCBvZiBiZWluZyB0b3JuIGRvd24uXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25uZWN0aW9uQmFubmVyIGV4dGVuZHMgTWl4aW5zKFJlY29ubmVjdE1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBraW5kITogJ3JlY29ubmVjdGluZycgfCAncXVpZXQnIHwgJ29mZmxpbmUnXG5cbiAgLyoqIEEgdHJ5IGlzIHJ1bm5pbmcgbm93LCByYXRoZXIgdGhhbiB3YWl0aW5nIGl0cyB0dXJuLiAqL1xuICBnZXQgdHJ5aW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zb2NrZXRDb25uZWN0aW5nICYmICF0aGlzLnJldHJ5UGVuZGluZ1xuICB9XG5cbiAgLyoqIFJlLW9wZW5pbmcgb250byBCbHVldG9vdGggYWZ0ZXIgQ29ubmVjdCBvdmVyIEJsdWV0b290aDogYSB3YWl0IHRoZSBwZXJzb24gYXNrZWQgZm9yLCBub3QgYSBkcm9wLiAqL1xuICBnZXQgc3dpdGNoaW5nVG9CbHVldG9vdGggKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlkID0gY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWRcbiAgICByZXR1cm4gdGhpcy5raW5kID09PSAncmVjb25uZWN0aW5nJyAmJiAhIWlkICYmIGJsdWV0b290aE9wZW5pbmcoaWQpXG4gIH1cblxuICBnZXQgdGl0bGUgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMua2luZCA9PT0gJ3F1aWV0JykgcmV0dXJuIGBObyB3b3JkIGZyb20gJHt0aGlzLnByaW50ZXJOYW1lfSBmb3IgYSBmZXcgc2Vjb25kc2BcbiAgICBpZiAodGhpcy5zd2l0Y2hpbmdUb0JsdWV0b290aCkgcmV0dXJuICdTd2l0Y2hpbmcgdG8gQmx1ZXRvb3Ro4oCmJ1xuICAgIHJldHVybiB0aGlzLmtpbmQgPT09ICdvZmZsaW5lJyA/ICdPZmZsaW5lJyA6ICdSZWNvbm5lY3RpbmfigKYnXG4gIH1cblxuICBnZXQgZGV0YWlsICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmtpbmQgPT09ICdxdWlldCcpIHJldHVybiAnUHJvYmFibHkgYSBzbG93IG5ldHdvcmsuIE5vdGhpbmcgaXMgbG9zdC4nXG4gICAgaWYgKHRoaXMuc3dpdGNoaW5nVG9CbHVldG9vdGgpIHJldHVybiBgQnJpbmdpbmcgdXAgdGhlIEJsdWV0b290aCBsaW5rIHRvICR7dGhpcy5wcmludGVyTmFtZX0uIFRoZSBwYWdlIGtlZXBzIGl0cyBsYXN0IHZpZXcuYFxuICAgIGlmICh0aGlzLmtpbmQgPT09ICdvZmZsaW5lJykgcmV0dXJuIGAke3RoaXMucHJpbnRlck5hbWV9IGhhcyBiZWVuIG9mZmxpbmUgZm9yIGF0IGxlYXN0IHR3byBtaW51dGVzLiBUaGUgcGFnZSBrZWVwcyBpdHMgbGFzdCB2aWV3LmBcbiAgICBjb25zdCB3YWl0ID0gdGhpcy5yZXRyeUluTXNcbiAgICBjb25zdCB3aGVuID0gdGhpcy50cnlpbmcgPyAnVHJ5aW5nIGFnYWluIG5vdy4nIDogd2FpdCAhPT0gbnVsbCA/IGBUcnlpbmcgYWdhaW4gaW4gJHtyZXRyeUluKHdhaXQpfS5gIDogJ05vdCB0cnlpbmcuJ1xuICAgIHJldHVybiBgJHt3aGVufSBUaGUgcGFnZSBrZWVwcyBpdHMgbGFzdCB2aWV3LmBcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmNvbm4tYmFyIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIG1hcmdpbjogMCAwIDE2cHg7XG4gICAgcGFkZGluZzogMTBweCAxMnB4IDEwcHggMTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAuY29ubi1iYXItLXJlY29ubmVjdGluZyB7XG4gICAgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC13YXJuaW5nKSAxNiUsIHZhcigtLW0zZC1zdXJmYWNlKSk7XG4gIH1cblxuICAuY29ubi1iYXItLW9mZmxpbmUge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgfVxuXG4gIC5jb25uLWJhci0tcXVpZXQge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgfVxuXG4gIC5jb25uLWJhcl9faWNvbiB7XG4gICAgZmxleDogbm9uZTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXdhcm5pbmcpO1xuICB9XG5cbiAgLmNvbm4tYmFyX19kb3Qge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgd2lkdGg6IDEwcHg7XG4gICAgaGVpZ2h0OiAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtd2FybmluZyk7XG4gIH1cblxuICAuY29ubi1iYXJfX3RleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMSAxIGF1dG87XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogMnB4IDEwcHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcblxuICAgIHNwYW4ge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB9XG4gIH1cblxuICAuY29ubi1iYXJfX2J0biB7XG4gICAgaGVpZ2h0OiAzNHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbGF5b3V0L0Nvbm5lY3Rpb25CYW5uZXIudnVlIn0=