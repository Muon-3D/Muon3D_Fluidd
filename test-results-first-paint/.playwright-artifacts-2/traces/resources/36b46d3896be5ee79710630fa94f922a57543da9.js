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
import { confirmPlateClear } from "/src/services/plate/clear.ts";
let PlateClearNotice = class extends Vue {
  managed;
  inline;
  owner;
  settingsPath;
  busy = false;
  done = false;
  message = "";
  result = null;
  get showSettingsLink() {
    return this.owner && this.result?.kind === "refused";
  }
  async ask() {
    if (this.busy || this.done) return;
    this.busy = true;
    try {
      const yes = await this.$confirm("Check that nothing from the last print is still on it, then confirm.", {
        title: "Is the plate clear?",
        buttonTrueText: "The plate is clear",
        buttonFalseText: "Cancel"
      });
      if (!yes) return;
      this.message = "";
      this.result = await confirmPlateClear(this.managed, this.$httpClient);
      if (this.result.kind === "cleared") this.done = true;
      else this.message = this.result.message;
    } finally {
      this.busy = false;
    }
  }
};
__decorateClass([
  Prop({ type: Boolean })
], PlateClearNotice.prototype, "managed", 2);
__decorateClass([
  Prop({ type: Boolean })
], PlateClearNotice.prototype, "inline", 2);
__decorateClass([
  Prop({ type: Boolean })
], PlateClearNotice.prototype, "owner", 2);
__decorateClass([
  Prop({ type: String, default: "/settings#security" })
], PlateClearNotice.prototype, "settingsPath", 2);
PlateClearNotice = __decorateClass([
  Component({})
], PlateClearNotice);
const _sfc_main = PlateClearNotice;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "plate-notice", class: { "plate-notice--inline": _vm.inline }, attrs: { "role": "status", "aria-live": "polite", "data-tid": "plate-clear-notice" } }, [_c("div", { staticClass: "plate-notice__row" }, [_c("span", { staticClass: "plate-notice__text", attrs: { "data-tid": "plate-clear-text" } }, [_vm._v(_vm._s(_vm.done ? "Confirmed. Waiting for the printer to say so." : "Clear the plate before the next print."))]), _c("button", { staticClass: "cbtn", class: _vm.inline ? "" : "cbtn--primary", attrs: { "type": "button", "disabled": _vm.busy || _vm.done, "aria-busy": _vm.busy ? "true" : "false", "data-tid": "plate-clear-btn" }, on: { "click": _vm.ask } }, [_vm._v(" The plate is clear ")])]), _vm.message ? _c("p", { staticClass: "plate-notice__message", attrs: { "role": "alert", "data-tid": "plate-clear-message" } }, [_vm._v(" " + _vm._s(_vm.message) + " "), _vm.showSettingsLink ? _c("router-link", { staticClass: "plate-notice__link", attrs: { "to": _vm.settingsPath, "data-tid": "plate-clear-settings" } }, [_vm._v(" Settings \u203A Security ")]) : _vm._e()], 1) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/PlateClearNotice.vue?vue&type=style&index=0&scoped=81dbd5b9&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "81dbd5b9",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/PlateClearNotice.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTZDQTtBQUNBO0FBY0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXZDQTtBQUFBLEVBREE7QUFBQSxHQURBLGlCQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxpQkFLQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBUkEsaUJBU0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVhBLGlCQVlBO0FBWkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUGxhdGVDbGVhck5vdGljZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJwbGF0ZS1ub3RpY2VcIlxuICAgIDpjbGFzcz1cInsgJ3BsYXRlLW5vdGljZS0taW5saW5lJzogaW5saW5lIH1cIlxuICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgIGFyaWEtbGl2ZT1cInBvbGl0ZVwiXG4gICAgZGF0YS10aWQ9XCJwbGF0ZS1jbGVhci1ub3RpY2VcIlxuICA+XG4gICAgPGRpdiBjbGFzcz1cInBsYXRlLW5vdGljZV9fcm93XCI+XG4gICAgICA8c3BhblxuICAgICAgICBjbGFzcz1cInBsYXRlLW5vdGljZV9fdGV4dFwiXG4gICAgICAgIGRhdGEtdGlkPVwicGxhdGUtY2xlYXItdGV4dFwiXG4gICAgICA+e3sgZG9uZSA/ICdDb25maXJtZWQuIFdhaXRpbmcgZm9yIHRoZSBwcmludGVyIHRvIHNheSBzby4nIDogJ0NsZWFyIHRoZSBwbGF0ZSBiZWZvcmUgdGhlIG5leHQgcHJpbnQuJyB9fTwvc3Bhbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgIDpjbGFzcz1cImlubGluZSA/ICcnIDogJ2NidG4tLXByaW1hcnknXCJcbiAgICAgICAgOmRpc2FibGVkPVwiYnVzeSB8fCBkb25lXCJcbiAgICAgICAgOmFyaWEtYnVzeT1cImJ1c3kgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgZGF0YS10aWQ9XCJwbGF0ZS1jbGVhci1idG5cIlxuICAgICAgICBAY2xpY2s9XCJhc2tcIlxuICAgICAgPlxuICAgICAgICBUaGUgcGxhdGUgaXMgY2xlYXJcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxwXG4gICAgICB2LWlmPVwibWVzc2FnZVwiXG4gICAgICBjbGFzcz1cInBsYXRlLW5vdGljZV9fbWVzc2FnZVwiXG4gICAgICByb2xlPVwiYWxlcnRcIlxuICAgICAgZGF0YS10aWQ9XCJwbGF0ZS1jbGVhci1tZXNzYWdlXCJcbiAgICA+XG4gICAgICB7eyBtZXNzYWdlIH19XG4gICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgdi1pZj1cInNob3dTZXR0aW5nc0xpbmtcIlxuICAgICAgICA6dG89XCJzZXR0aW5nc1BhdGhcIlxuICAgICAgICBjbGFzcz1cInBsYXRlLW5vdGljZV9fbGlua1wiXG4gICAgICAgIGRhdGEtdGlkPVwicGxhdGUtY2xlYXItc2V0dGluZ3NcIlxuICAgICAgPlxuICAgICAgICBTZXR0aW5ncyAmcnNhcXVvOyBTZWN1cml0eVxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L3A+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IGNvbmZpcm1QbGF0ZUNsZWFyIH0gZnJvbSAnQC9zZXJ2aWNlcy9wbGF0ZS9jbGVhcidcbmltcG9ydCB0eXBlIHsgUGxhdGVDbGVhclJlc3VsdCB9IGZyb20gJ0Avc2VydmljZXMvcGxhdGUvY2xlYXInXG5cbi8qKlxuICogVGhlIHBsYXRlLWNsZWFyIG5vdGljZSAoQ1QtMTQsIEtBTi0yMTg3KTogdGhlIHByaW50ZXIgcmVmdXNlcyB0aGUgbmV4dFxuICogcHJpbnQgdW50aWwgdGhlIHBsYXRlIGlzIGNvbmZpcm1lZCBjbGVhciwgc28gQ29udHJvbCBzaG93cyBpdCB3aXRoIHRoZVxuICogc2FtZSBjb25maXJtIHRoZSBwcmludGVyIGhhcy4gU2hvd24gYnkgUGxhdGVDbGVhckJhciBvbiBPdmVydmlldyBhbmRcbiAqIENvbnRyb2wgd2hpbGUgdGhlIHByaW50ZXIgc2F5cyBgcGxhdGVfY2xlYXJlZDogZmFsc2VgLCBhbmQgaW5saW5lIGluIHRoZVxuICogcHJpbnQgc2hlZXQuIFRoZSBidXR0b24gYXNrcyBmaXJzdCAoXCJJcyB0aGUgcGxhdGUgY2xlYXI/XCIpLCBzZW5kcyBvbmVcbiAqIFBPU1QgKGEgZG91YmxlLWNsaWNrIHNlbmRzIG9uY2UpLCBhbmQgbmV2ZXIgZmFrZXMgdGhlIGFuc3dlcjogdGhlIG5vdGljZVxuICogZ29lcyBhd2F5IHdoZW4gdGhlIHByaW50ZXIgcmVwb3J0cyB0aGUgcGxhdGUgY2xlYXIuIEEgcmVmdXNhbCBzaG93cyBpblxuICogdGhlIHByaW50ZXIncyB3b3Jkczsgb25seSB0aGUgb3duZXIgZ2V0cyBhIGxpbmsgdG8gU2V0dGluZ3MgPiBTZWN1cml0eS5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYXRlQ2xlYXJOb3RpY2UgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbWFuYWdlZCE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgaW5saW5lITogYm9vbGVhblxuXG4gIC8qKiBUaGlzIHNlc3Npb24gbWF5IG1hbmFnZSBhY2Nlc3MgKHRoZSBvd25lcik6IHNob3dzIHRoZSBsaW5rIHRvIFNldHRpbmdzID4gU2VjdXJpdHkgb24gYSByZWZ1c2FsLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgb3duZXIhOiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcvc2V0dGluZ3Mjc2VjdXJpdHknIH0pXG4gIHJlYWRvbmx5IHNldHRpbmdzUGF0aCE6IHN0cmluZ1xuXG4gIGJ1c3kgPSBmYWxzZVxuICBkb25lID0gZmFsc2VcbiAgbWVzc2FnZSA9ICcnXG4gIHJlc3VsdDogUGxhdGVDbGVhclJlc3VsdCB8IG51bGwgPSBudWxsXG5cbiAgZ2V0IHNob3dTZXR0aW5nc0xpbmsgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm93bmVyICYmIHRoaXMucmVzdWx0Py5raW5kID09PSAncmVmdXNlZCdcbiAgfVxuXG4gIGFzeW5jIGFzayAoKSB7XG4gICAgaWYgKHRoaXMuYnVzeSB8fCB0aGlzLmRvbmUpIHJldHVyblxuICAgIHRoaXMuYnVzeSA9IHRydWVcbiAgICB0cnkge1xuICAgICAgY29uc3QgeWVzID0gYXdhaXQgdGhpcy4kY29uZmlybSgnQ2hlY2sgdGhhdCBub3RoaW5nIGZyb20gdGhlIGxhc3QgcHJpbnQgaXMgc3RpbGwgb24gaXQsIHRoZW4gY29uZmlybS4nLCB7XG4gICAgICAgIHRpdGxlOiAnSXMgdGhlIHBsYXRlIGNsZWFyPycsXG4gICAgICAgIGJ1dHRvblRydWVUZXh0OiAnVGhlIHBsYXRlIGlzIGNsZWFyJyxcbiAgICAgICAgYnV0dG9uRmFsc2VUZXh0OiAnQ2FuY2VsJ1xuICAgICAgfSlcbiAgICAgIGlmICgheWVzKSByZXR1cm5cbiAgICAgIHRoaXMubWVzc2FnZSA9ICcnXG4gICAgICB0aGlzLnJlc3VsdCA9IGF3YWl0IGNvbmZpcm1QbGF0ZUNsZWFyKHRoaXMubWFuYWdlZCwgdGhpcy4kaHR0cENsaWVudClcbiAgICAgIGlmICh0aGlzLnJlc3VsdC5raW5kID09PSAnY2xlYXJlZCcpIHRoaXMuZG9uZSA9IHRydWVcbiAgICAgIGVsc2UgdGhpcy5tZXNzYWdlID0gdGhpcy5yZXN1bHQubWVzc2FnZVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmJ1c3kgPSBmYWxzZVxuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5wbGF0ZS1ub3RpY2Uge1xuICBwYWRkaW5nOiAxMnB4IDE2cHg7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cbi5wbGF0ZS1ub3RpY2UtLWlubGluZSB7XG4gIG1hcmdpbjogMTJweCAwO1xuICBwYWRkaW5nOiAxMnB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbn1cbi5wbGF0ZS1ub3RpY2VfX3JvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgZmxleC13cmFwOiB3cmFwO1xuICBnYXA6IDhweCAxNnB4O1xufVxuLnBsYXRlLW5vdGljZV9fdGV4dCB7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cbi5wbGF0ZS1ub3RpY2VfX21lc3NhZ2Uge1xuICBtYXJnaW46IDhweCAwIDA7XG4gIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLnBsYXRlLW5vdGljZV9fbGluayB7XG4gIG1hcmdpbi1sZWZ0OiA2cHg7XG4gIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XG59XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvUGxhdGVDbGVhck5vdGljZS52dWUifQ==