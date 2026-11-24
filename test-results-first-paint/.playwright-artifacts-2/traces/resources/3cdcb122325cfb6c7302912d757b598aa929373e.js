/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/PrinterThumb.vue";
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
import { activeSlug } from "/src/services/printer-pages/index.ts";
const HELP_AFTER_MS = 8e3;
let ConnectingScreen = class extends Mixins(ReconnectMixin) {
  state;
  shownAt = Date.now();
  get showHelp() {
    return this.state === "unreachable" || this.now - this.shownAt >= HELP_AFTER_MS;
  }
  get retryText() {
    return retryIn(this.retryInMs ?? 0);
  }
  /** The hotspot an M1 makes when it can't join a Wi-Fi: Muon- and its address name (Muon-boxwood-367a). */
  get hotspot() {
    const slug = activeSlug();
    return slug && /-[0-9a-f]{4}$/.test(slug) ? `Muon-${slug}` : null;
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], ConnectingScreen.prototype, "state", 2);
ConnectingScreen = __decorateClass([
  Component({})
], ConnectingScreen);
const _sfc_main = ConnectingScreen;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "conn-screen", attrs: { "data-tid": `connection-${_vm.state}` } }, [_c("div", { staticClass: "conn-screen__card" }, [_c(__unplugin_components_0, { attrs: { "size": 72, "state": _vm.state === "unreachable" ? "offline" : "idle" } }), _c("h1", { staticClass: "conn-screen__title" }, [_vm._v(" " + _vm._s(_vm.state === "unreachable" ? `Can't reach ${_vm.printerName}` : `Connecting to ${_vm.printerName}`) + " ")]), _vm.address ? _c("p", { staticClass: "conn-screen__address" }, [_vm._v(" " + _vm._s(_vm.address) + " ")]) : _vm._e(), _vm.state === "connecting" ? _c("div", { staticClass: "conn-screen__bar", attrs: { "role": "progressbar", "aria-label": "Connecting" } }, [_c("span")]) : _vm._e(), _vm.state === "connecting" && _vm.retryInMs !== null ? _c("p", { staticClass: "conn-screen__line" }, [_vm._v(" No answer yet. Trying again in " + _vm._s(_vm.retryText) + ". ")]) : _vm._e(), _vm.showHelp ? _c("ul", { staticClass: "conn-screen__help", attrs: { "data-tid": "connection-help" } }, [_vm.viaCloud ? [_c("li", [_vm._v("Is " + _vm._s(_vm.printerName) + " switched on and online? Its screen shows its Wi-Fi.")]), _c("li", [_vm._v("Muon3D reaches it over the internet, so it needs a working Wi-Fi of its own.")])] : [_c("li", [_vm._v("Is " + _vm._s(_vm.printerName) + " switched on? Its screen lights up when it is.")]), _c("li", [_vm._v("Is this device on the same Wi-Fi as " + _vm._s(_vm.printerName) + "?")]), _vm.hotspot ? _c("li", [_vm._v(" If it can't join a Wi-Fi, it makes its own: join "), _c("strong", [_vm._v(_vm._s(_vm.hotspot))]), _vm._v(", then open this page again. ")]) : _vm._e()]], 2) : _vm._e(), _c("div", { staticClass: "conn-screen__actions" }, [_c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "connection-try-again" }, on: { "click": _vm.tryNow } }, [_vm._v(" Try again ")]), _c("router-link", { staticClass: "cbtn", attrs: { "to": "/" } }, [_vm._v(" Choose another printer ")])], 1)], 1)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/ConnectingScreen.vue?vue&type=style&index=0&scoped=9c910fd9&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9c910fd9",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/ConnectingScreen.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUEyRUE7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQVNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFqQkE7QUFBQSxFQURBO0FBQUEsR0FEQSxpQkFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbm5lY3RpbmdTY3JlZW4udnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwiY29ubi1zY3JlZW5cIlxuICAgIDpkYXRhLXRpZD1cImBjb25uZWN0aW9uLSR7c3RhdGV9YFwiXG4gID5cbiAgICA8ZGl2IGNsYXNzPVwiY29ubi1zY3JlZW5fX2NhcmRcIj5cbiAgICAgIDxwcmludGVyLXRodW1iXG4gICAgICAgIDpzaXplPVwiNzJcIlxuICAgICAgICA6c3RhdGU9XCJzdGF0ZSA9PT0gJ3VucmVhY2hhYmxlJyA/ICdvZmZsaW5lJyA6ICdpZGxlJ1wiXG4gICAgICAvPlxuICAgICAgPGgxIGNsYXNzPVwiY29ubi1zY3JlZW5fX3RpdGxlXCI+XG4gICAgICAgIHt7IHN0YXRlID09PSAndW5yZWFjaGFibGUnID8gYENhbid0IHJlYWNoICR7cHJpbnRlck5hbWV9YCA6IGBDb25uZWN0aW5nIHRvICR7cHJpbnRlck5hbWV9YCB9fVxuICAgICAgPC9oMT5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJhZGRyZXNzXCJcbiAgICAgICAgY2xhc3M9XCJjb25uLXNjcmVlbl9fYWRkcmVzc1wiXG4gICAgICA+XG4gICAgICAgIHt7IGFkZHJlc3MgfX1cbiAgICAgIDwvcD5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwic3RhdGUgPT09ICdjb25uZWN0aW5nJ1wiXG4gICAgICAgIGNsYXNzPVwiY29ubi1zY3JlZW5fX2JhclwiXG4gICAgICAgIHJvbGU9XCJwcm9ncmVzc2JhclwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJDb25uZWN0aW5nXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8cFxuICAgICAgICB2LWlmPVwic3RhdGUgPT09ICdjb25uZWN0aW5nJyAmJiByZXRyeUluTXMgIT09IG51bGxcIlxuICAgICAgICBjbGFzcz1cImNvbm4tc2NyZWVuX19saW5lXCJcbiAgICAgID5cbiAgICAgICAgTm8gYW5zd2VyIHlldC4gVHJ5aW5nIGFnYWluIGluIHt7IHJldHJ5VGV4dCB9fS5cbiAgICAgIDwvcD5cblxuICAgICAgPHVsXG4gICAgICAgIHYtaWY9XCJzaG93SGVscFwiXG4gICAgICAgIGNsYXNzPVwiY29ubi1zY3JlZW5fX2hlbHBcIlxuICAgICAgICBkYXRhLXRpZD1cImNvbm5lY3Rpb24taGVscFwiXG4gICAgICA+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwidmlhQ2xvdWRcIj5cbiAgICAgICAgICA8bGk+SXMge3sgcHJpbnRlck5hbWUgfX0gc3dpdGNoZWQgb24gYW5kIG9ubGluZT8gSXRzIHNjcmVlbiBzaG93cyBpdHMgV2ktRmkuPC9saT5cbiAgICAgICAgICA8bGk+TXVvbjNEIHJlYWNoZXMgaXQgb3ZlciB0aGUgaW50ZXJuZXQsIHNvIGl0IG5lZWRzIGEgd29ya2luZyBXaS1GaSBvZiBpdHMgb3duLjwvbGk+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgICAgPGxpPklzIHt7IHByaW50ZXJOYW1lIH19IHN3aXRjaGVkIG9uPyBJdHMgc2NyZWVuIGxpZ2h0cyB1cCB3aGVuIGl0IGlzLjwvbGk+XG4gICAgICAgICAgPGxpPklzIHRoaXMgZGV2aWNlIG9uIHRoZSBzYW1lIFdpLUZpIGFzIHt7IHByaW50ZXJOYW1lIH19PzwvbGk+XG4gICAgICAgICAgPGxpIHYtaWY9XCJob3RzcG90XCI+XG4gICAgICAgICAgICBJZiBpdCBjYW4ndCBqb2luIGEgV2ktRmksIGl0IG1ha2VzIGl0cyBvd246IGpvaW4gPHN0cm9uZz57eyBob3RzcG90IH19PC9zdHJvbmc+LCB0aGVuIG9wZW4gdGhpcyBwYWdlIGFnYWluLlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L3VsPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY29ubi1zY3JlZW5fX2FjdGlvbnNcIj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImNvbm5lY3Rpb24tdHJ5LWFnYWluXCJcbiAgICAgICAgICBAY2xpY2s9XCJ0cnlOb3dcIlxuICAgICAgICA+XG4gICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgICB0bz1cIi9cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgID5cbiAgICAgICAgICBDaG9vc2UgYW5vdGhlciBwcmludGVyXG4gICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFJlY29ubmVjdE1peGluIGZyb20gJ0AvbWl4aW5zL3JlY29ubmVjdCdcbmltcG9ydCB7IHJldHJ5SW4gfSBmcm9tICdAL3NlcnZpY2VzL2Nvbm5lY3Rpb24vdmlldydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5cbi8qKiBBZnRlciB0aGlzIGxvbmcgY29ubmVjdGluZywgdGhlIHNjcmVlbiBzYXlzIHdoYXQgdG8gY2hlY2suICovXG5jb25zdCBIRUxQX0FGVEVSX01TID0gODAwMFxuXG4vKipcbiAqIEluc3RlYWQgb2YgYSBwcmludGVyJ3MgcGFnZSB1bnRpbCBGbHVpZGQgaGFzIHJlYWNoZWQgaXQgb25jZTogdGhlXG4gKiBwcmludGVyLCB0aGUgYWRkcmVzcyBpdCBpcyB0cnlpbmcgYW5kLCBpZiBpdCBjYW4ndCwgd2hhdCB0byBjaGVjay5cbiAqIEFmdGVyIHRoZSBmaXJzdCBjb25uZWN0aW9uIGEgZHJvcCBrZWVwcyB0aGUgcGFnZSBpbnN0ZWFkXG4gKiAoQ29ubmVjdGlvbkJhbm5lcikuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25uZWN0aW5nU2NyZWVuIGV4dGVuZHMgTWl4aW5zKFJlY29ubmVjdE1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBzdGF0ZSE6ICdjb25uZWN0aW5nJyB8ICd1bnJlYWNoYWJsZSdcblxuICBzaG93bkF0ID0gRGF0ZS5ub3coKVxuXG4gIGdldCBzaG93SGVscCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUgPT09ICd1bnJlYWNoYWJsZScgfHwgdGhpcy5ub3cgLSB0aGlzLnNob3duQXQgPj0gSEVMUF9BRlRFUl9NU1xuICB9XG5cbiAgZ2V0IHJldHJ5VGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmV0cnlJbih0aGlzLnJldHJ5SW5NcyA/PyAwKVxuICB9XG5cbiAgLyoqIFRoZSBob3RzcG90IGFuIE0xIG1ha2VzIHdoZW4gaXQgY2FuJ3Qgam9pbiBhIFdpLUZpOiBNdW9uLSBhbmQgaXRzIGFkZHJlc3MgbmFtZSAoTXVvbi1ib3h3b29kLTM2N2EpLiAqL1xuICBnZXQgaG90c3BvdCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3Qgc2x1ZyA9IGFjdGl2ZVNsdWcoKVxuICAgIHJldHVybiBzbHVnICYmIC8tWzAtOWEtZl17NH0kLy50ZXN0KHNsdWcpID8gYE11b24tJHtzbHVnfWAgOiBudWxsXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5jb25uLXNjcmVlbiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBwYWRkaW5nOiA0OHB4IDE2cHg7XG4gIH1cblxuICAuY29ubi1zY3JlZW5fX2NhcmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDQ2MHB4O1xuICAgIHBhZGRpbmc6IDMycHggMjRweDtcbiAgICBib3JkZXItcmFkaXVzOiAyNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgfVxuXG4gIC5jb25uLXNjcmVlbl9fdGl0bGUge1xuICAgIG1hcmdpbjogOHB4IDAgMDtcbiAgICBmb250LXNpemU6IDIycHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC5jb25uLXNjcmVlbl9fYWRkcmVzcyB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8sIG1vbm9zcGFjZSk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmNvbm4tc2NyZWVuX19iYXIge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDI2MHB4O1xuICAgIGhlaWdodDogNnB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG5cbiAgICBzcGFuIHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIGluc2V0OiAwIGF1dG8gMCAwO1xuICAgICAgd2lkdGg6IDM1JTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IGluaGVyaXQ7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICAgIGFuaW1hdGlvbjogY29ubi1zbGlkZSAxLjRzIGVhc2UtaW4tb3V0IGluZmluaXRlO1xuICAgIH1cbiAgfVxuXG4gIEBrZXlmcmFtZXMgY29ubi1zbGlkZSB7XG4gICAgZnJvbSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7IH1cbiAgICB0byB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgzMDAlKTsgfVxuICB9XG5cbiAgLmNvbm4tc2NyZWVuX19saW5lIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAuY29ubi1zY3JlZW5fX2hlbHAge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDhweDtcbiAgICBtYXJnaW46IDhweCAwIDA7XG4gICAgcGFkZGluZzogMTRweCAxNnB4IDE0cHggMzJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICB9XG5cbiAgLmNvbm4tc2NyZWVuX19hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBtYXJnaW4tdG9wOiA4cHg7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9sYXlvdXQvQ29ubmVjdGluZ1NjcmVlbi52dWUifQ==