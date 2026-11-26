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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
import WifiManagerCard from "/src/components/widgets/wifi/WifiManagerCard.vue";
import HotspotManagerCard from "/src/components/widgets/wifi/HotspotManagerCard.vue";
import FrameIcon from "/src/components/ui/FrameIcon.vue";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { bluetoothCarrying, remoteRouteLabel } from "/src/services/muon-ble/link.ts";
import { networkRouteLabel } from "/src/services/hotspot/model.ts";
let Wifi = class extends Mixins(BrowserMixin) {
  /** Display only, from the connection state Control already has: how this browser reaches the printer. */
  get remote() {
    return !!cloudState.activePrinterId && isManagedApiUrl(this.$store.state.config.apiUrl);
  }
  get routeText() {
    return this.remote ? remoteRouteLabel(cloudState.activePrinterId) : networkRouteLabel();
  }
  get routeLine() {
    return this.remote ? "Changes to Wi-Fi are made over this connection." : "This browser reaches the printer directly.";
  }
  get bluetoothOn() {
    return !!cloudState.activePrinterId && bluetoothCarrying(cloudState.activePrinterId);
  }
  get bluetoothLine() {
    return this.bluetoothOn ? "Carrying this connection now." : "Not carrying this connection. Pair a phone or computer from the Bluetooth sheet.";
  }
};
Wifi = __decorateClass([
  Component({ components: { WifiManagerCard, HotspotManagerCard, FrameIcon } })
], Wifi);
const _sfc_main = Wifi;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "wifi-page", class: { "wifi-page--phone": _vm.isMobileViewport }, attrs: { "data-tid": "wifi-page" } }, [_c("p", { staticClass: "wifi-route", attrs: { "data-tid": "wifi-route" } }, [_c("span", { staticClass: "wifi-route__pill", attrs: { "data-tid": "wifi-route-pill" } }, [_vm._v(_vm._s(_vm.routeText))]), _c("span", [_vm._v(_vm._s(_vm.routeLine))])]), _c("div", { staticClass: "stiles" }, [_c("wifi-manager-card"), _c("section", { staticClass: "stile wifi-ble", attrs: { "data-tid": "wifi-bluetooth" } }, [_c("header", { staticClass: "stile__head" }, [_c(__unplugin_components_0, { attrs: { "name": "bluetooth" } }), _c("h2", [_vm._v("Bluetooth")])], 1), _c("p", { staticClass: "stile__note", attrs: { "data-tid": "wifi-bluetooth-line" } }, [_vm._v(" " + _vm._s(_vm.bluetoothLine) + " ")])]), _c("hotspot-manager-card")], 1)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Wifi.vue?vue&type=style&index=0&scoped=1a6c8849&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "1a6c8849",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Wifi.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBV0E7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFyQkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiV2lmaS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJ3aWZpLXBhZ2VcIlxuICAgIDpjbGFzcz1cInsgJ3dpZmktcGFnZS0tcGhvbmUnOiBpc01vYmlsZVZpZXdwb3J0IH1cIlxuICAgIGRhdGEtdGlkPVwid2lmaS1wYWdlXCJcbiAgPlxuICAgIDxwXG4gICAgICBjbGFzcz1cIndpZmktcm91dGVcIlxuICAgICAgZGF0YS10aWQ9XCJ3aWZpLXJvdXRlXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICBjbGFzcz1cIndpZmktcm91dGVfX3BpbGxcIlxuICAgICAgICBkYXRhLXRpZD1cIndpZmktcm91dGUtcGlsbFwiXG4gICAgICA+e3sgcm91dGVUZXh0IH19PC9zcGFuPlxuICAgICAgPHNwYW4+e3sgcm91dGVMaW5lIH19PC9zcGFuPlxuICAgIDwvcD5cbiAgICA8ZGl2IGNsYXNzPVwic3RpbGVzXCI+XG4gICAgICA8d2lmaS1tYW5hZ2VyLWNhcmQgLz5cbiAgICAgIDxzZWN0aW9uXG4gICAgICAgIGNsYXNzPVwic3RpbGUgd2lmaS1ibGVcIlxuICAgICAgICBkYXRhLXRpZD1cIndpZmktYmx1ZXRvb3RoXCJcbiAgICAgID5cbiAgICAgICAgPGhlYWRlciBjbGFzcz1cInN0aWxlX19oZWFkXCI+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImJsdWV0b290aFwiIC8+XG4gICAgICAgICAgPGgyPkJsdWV0b290aDwvaDI+XG4gICAgICAgIDwvaGVhZGVyPlxuICAgICAgICA8cFxuICAgICAgICAgIGNsYXNzPVwic3RpbGVfX25vdGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1ibHVldG9vdGgtbGluZVwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBibHVldG9vdGhMaW5lIH19XG4gICAgICAgIDwvcD5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICAgIDxob3RzcG90LW1hbmFnZXItY2FyZCAvPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgV2lmaU1hbmFnZXJDYXJkIGZyb20gJ0AvY29tcG9uZW50cy93aWRnZXRzL3dpZmkvV2lmaU1hbmFnZXJDYXJkLnZ1ZSdcbmltcG9ydCBIb3RzcG90TWFuYWdlckNhcmQgZnJvbSAnQC9jb21wb25lbnRzL3dpZGdldHMvd2lmaS9Ib3RzcG90TWFuYWdlckNhcmQudnVlJ1xuaW1wb3J0IEZyYW1lSWNvbiBmcm9tICdAL2NvbXBvbmVudHMvdWkvRnJhbWVJY29uLnZ1ZSdcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgYmx1ZXRvb3RoQ2FycnlpbmcsIHJlbW90ZVJvdXRlTGFiZWwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2xpbmsnXG5pbXBvcnQgeyBuZXR3b3JrUm91dGVMYWJlbCB9IGZyb20gJ0Avc2VydmljZXMvaG90c3BvdC9tb2RlbCdcblxuLyoqXG4gKiBXaS1GaSBhbmQgbmV0d29yayAoU2V0dGluZ3MpOiBvbmUgV2ktRmkgYm94ICh0aGUgbmV0d29yayB0aGUgcHJpbnRlclxuICogaXMgb24gYW5kIHRoZSBvbmVzIGl0IGhlYXJzLCB0byBqb2luLCBsZWF2ZSBvciBmb3JnZXQpLCB0aGVuIEJsdWV0b290aCwgdGhlblxuICogaXRzIG93biBob3RzcG90ICh0byB0dXJuIG9uIG9yIG9mZiBhbmQgcmVuYW1lKS4gV2ktRmkgd29ya3Mgb3ZlciBhbnkgcm91dGU6XG4gKiB0aGUgQXV4IEFQSSBvbiB0aGUgcHJpbnRlcidzIG5ldHdvcmssIG11b24tbGluaydzIG93biByb3V0ZXMgb3ZlciBCbHVldG9vdGhcbiAqIGFuZCBNdW9uM0QgKEtBTi0zNjAxKS4gVGhlIGhvdHNwb3Qgc3RpbGwgc2F5cyBzbyB3aGVuIGEgcmVtb3RlIGNvbm5lY3Rpb25cbiAqIHJ1bGVzIGNoYW5nZXMgb3V0LlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBXaWZpTWFuYWdlckNhcmQsIEhvdHNwb3RNYW5hZ2VyQ2FyZCwgRnJhbWVJY29uIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdpZmkgZXh0ZW5kcyBNaXhpbnMoQnJvd3Nlck1peGluKSB7XG4gIC8qKiBEaXNwbGF5IG9ubHksIGZyb20gdGhlIGNvbm5lY3Rpb24gc3RhdGUgQ29udHJvbCBhbHJlYWR5IGhhczogaG93IHRoaXMgYnJvd3NlciByZWFjaGVzIHRoZSBwcmludGVyLiAqL1xuICBnZXQgcmVtb3RlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISFjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCAmJiBpc01hbmFnZWRBcGlVcmwodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybCBhcyBzdHJpbmcgfCBudWxsKVxuICB9XG5cbiAgZ2V0IHJvdXRlVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdGUgPyByZW1vdGVSb3V0ZUxhYmVsKGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkKSA6IG5ldHdvcmtSb3V0ZUxhYmVsKClcbiAgfVxuXG4gIGdldCByb3V0ZUxpbmUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3RlID8gJ0NoYW5nZXMgdG8gV2ktRmkgYXJlIG1hZGUgb3ZlciB0aGlzIGNvbm5lY3Rpb24uJyA6ICdUaGlzIGJyb3dzZXIgcmVhY2hlcyB0aGUgcHJpbnRlciBkaXJlY3RseS4nXG4gIH1cblxuICBnZXQgYmx1ZXRvb3RoT24gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIWNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkICYmIGJsdWV0b290aENhcnJ5aW5nKGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkKVxuICB9XG5cbiAgZ2V0IGJsdWV0b290aExpbmUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuYmx1ZXRvb3RoT24gPyAnQ2FycnlpbmcgdGhpcyBjb25uZWN0aW9uIG5vdy4nIDogJ05vdCBjYXJyeWluZyB0aGlzIGNvbm5lY3Rpb24uIFBhaXIgYSBwaG9uZSBvciBjb21wdXRlciBmcm9tIHRoZSBCbHVldG9vdGggc2hlZXQuJ1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAud2lmaS1yb3V0ZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtYXJnaW46IDAgMCAxMnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLndpZmktcm91dGVfX3BpbGwge1xuICAgIHBhZGRpbmc6IDRweCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAvLyBPbmUgY29sdW1uIG9mIGJveGVzOiB0aGUgV2ktRmkgYm94ICh0aGUgbmV0d29yayBpdCBpcyBvbiwgYW5kIHRoZSBvdGhlcnMpLFxuICAvLyB0aGVuIEJsdWV0b290aCwgdGhlbiB0aGUgaG90c3BvdCAoS0FOLTM2MDcpLlxuICAud2lmaS1wYWdlIDpkZWVwKC53Zl9fc3Bhbikge1xuICAgIGdyaWQtY29sdW1uOiBzcGFuIDEyO1xuICB9XG5cbiAgLndpZmktcGFnZSA6ZGVlcCguaHMtLXBhZ2UpIHtcbiAgICBncmlkLWNvbHVtbjogc3BhbiAxMjtcbiAgfVxuXG4gIC8vIE9uIGEgcGhvbmUgdGhlIGxpc3QgaXMgdGhlIHBhZ2U6IG5vIHNpZGUgZGV0YWlsICh0aGUgYmFycyBzdGF5KSwgb25lIHNob3J0IHJvdyBwZXJcbiAgLy8gbmV0d29yaywgc28gc2Nyb2xsaW5nIGl0IGlzIG9uZSBnZXN0dXJlIGFuZCBub3QgYSBodW50LlxuICAud2lmaS1wYWdlLS1waG9uZSAuc3RpbGVzIHtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAud2lmaS1wYWdlLS1waG9uZSA6ZGVlcCguc3RpbGUpIHtcbiAgICBwYWRkaW5nOiAxNHB4O1xuICB9XG5cbiAgLndpZmktcGFnZS0tcGhvbmUgOmRlZXAoLndmX19kZXRhaWwpIHtcbiAgICBkaXNwbGF5OiBub25lO1xuICB9XG5cbiAgLndpZmktcGFnZS0tcGhvbmUgOmRlZXAoLndmX19uZXQgLndmX19iYXJzKSB7XG4gICAgd2lkdGg6IDIwcHg7XG4gICAgaGVpZ2h0OiAxNnB4O1xuICB9XG5cbiAgLndpZmktcGFnZS0tcGhvbmUgOmRlZXAoLndmX19uZXQgLnNyb3dfX3MpIHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAud2lmaS1wYWdlLS1waG9uZSA6ZGVlcCgud2ZfX25ldCkge1xuICAgIG1pbi1oZWlnaHQ6IDU2cHg7XG4gICAgZ2FwOiAxMHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL3ZpZXdzL1dpZmkudnVlIn0=