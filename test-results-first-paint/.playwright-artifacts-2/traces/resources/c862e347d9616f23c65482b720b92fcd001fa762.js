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
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import Component from "/.vite-e2e/4291/deps/vue-class-component.js?v=9b9fafc7";
import { Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { hotspotCountTitle, hotspotDeviceCount, hotspotState } from "/src/services/hotspot/model.ts";
import { startHotspotPoll } from "/src/services/hotspot/poller.ts";
let HotspotCount = class extends Vue {
  compact;
  stop = null;
  mounted() {
    this.stop = startHotspotPoll();
  }
  beforeDestroy() {
    this.stop?.();
    this.stop = null;
  }
  get count() {
    return hotspotDeviceCount(hotspotState.stations);
  }
  get title() {
    return hotspotCountTitle(this.count ?? 0);
  }
};
__decorateClass([
  Prop({ type: Boolean, default: false })
], HotspotCount.prototype, "compact", 2);
HotspotCount = __decorateClass([
  Component
], HotspotCount);
const _sfc_main = HotspotCount;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.count !== null && _vm.count > 0 ? _c("span", { staticClass: "hotspot-count", attrs: { "data-tid": "hotspot-count", "role": "img", "title": _vm.title, "aria-label": _vm.title } }, [_c("i", { staticClass: "hotspot-count__dot" }), _c("span", { attrs: { "data-tid": "hotspot-count-n" } }, [_vm._v(_vm._s(_vm.count))]), !_vm.compact ? _c("span", { staticClass: "hotspot-count__word" }, [_vm._v("connected")]) : _vm._e()]) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/HotspotCount.vue?vue&type=style&index=0&scoped=44c4a080&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "44c4a080",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/HotspotCount.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBVUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBcEJBO0FBQUE7QUFBQSxHQUZBLGFBRUE7QUFGQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJIb3RzcG90Q291bnQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNwYW5cbiAgICB2LWlmPVwiY291bnQgIT09IG51bGwgJiYgY291bnQgPiAwXCJcbiAgICBjbGFzcz1cImhvdHNwb3QtY291bnRcIlxuICAgIGRhdGEtdGlkPVwiaG90c3BvdC1jb3VudFwiXG4gICAgcm9sZT1cImltZ1wiXG4gICAgOnRpdGxlPVwidGl0bGVcIlxuICAgIDphcmlhLWxhYmVsPVwidGl0bGVcIlxuICA+XG4gICAgPGkgY2xhc3M9XCJob3RzcG90LWNvdW50X19kb3RcIiAvPlxuICAgIDxzcGFuIGRhdGEtdGlkPVwiaG90c3BvdC1jb3VudC1uXCI+e3sgY291bnQgfX08L3NwYW4+XG4gICAgPHNwYW5cbiAgICAgIHYtaWY9XCIhY29tcGFjdFwiXG4gICAgICBjbGFzcz1cImhvdHNwb3QtY291bnRfX3dvcmRcIlxuICAgID5jb25uZWN0ZWQ8L3NwYW4+XG4gIDwvc3Bhbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCBDb21wb25lbnQgZnJvbSAndnVlLWNsYXNzLWNvbXBvbmVudCdcbmltcG9ydCB7IFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgaG90c3BvdENvdW50VGl0bGUsIGhvdHNwb3REZXZpY2VDb3VudCwgaG90c3BvdFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9ob3RzcG90L21vZGVsJ1xuaW1wb3J0IHsgc3RhcnRIb3RzcG90UG9sbCB9IGZyb20gJ0Avc2VydmljZXMvaG90c3BvdC9wb2xsZXInXG5cbi8qKlxuICogSG93IG1hbnkgZGV2aWNlcyBhcmUgb24gdGhlIHByaW50ZXIncyBob3RzcG90IChLQU4tNDI5NyksIHdoYXRldmVyIHJvdXRlXG4gKiBDb250cm9sIHJlYWNoZXMgdGhlIHByaW50ZXIgYnkuIEl0IHJ1bnMgdGhlIHNoYXJlZCBsaWdodCBwb2xsIHdoaWxlIGl0IGlzIG9uXG4gKiBzY3JlZW4sIGFuZCBzaG93cyBub3RoaW5nIHdoZW4gdGhlIGhvdHNwb3QgaXMgZG93biwgbm9ib2R5IGlzIG9uIGl0LCBvciB0aGVcbiAqIHByaW50ZXIgY2FuJ3Qgc2F5LiBJdCBpcyB0aGUgc21hbGwgZ3JlZW4gXCIzIGNvbm5lY3RlZFwiIHRhYiB0aGF0IHNpdHMgb24gdG9wIG9mXG4gKiB0aGUgY29ubmVjdGlvbiBpdGVtLCBib3R0b20tbGVmdCAoS0FOLTQzNTQpLlxuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIb3RzcG90Q291bnQgZXh0ZW5kcyBWdWUge1xuICAvKiogSnVzdCB0aGUgbnVtYmVyLCBmb3IgYSByYWlsIHRoYXQgaXMgb25seSBpY29ucy4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9KSByZWFkb25seSBjb21wYWN0ITogYm9vbGVhblxuXG4gIHByaXZhdGUgc3RvcDogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLnN0b3AgPSBzdGFydEhvdHNwb3RQb2xsKClcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuc3RvcD8uKClcbiAgICB0aGlzLnN0b3AgPSBudWxsXG4gIH1cblxuICBnZXQgY291bnQgKCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiBob3RzcG90RGV2aWNlQ291bnQoaG90c3BvdFN0YXRlLnN0YXRpb25zKVxuICB9XG5cbiAgZ2V0IHRpdGxlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBob3RzcG90Q291bnRUaXRsZSh0aGlzLmNvdW50ID8/IDApXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5ob3RzcG90LWNvdW50IHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIGhlaWdodDogMjRweDtcbiAgICBwYWRkaW5nOiAwIDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweCAxMHB4IDAgMDtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLXN1Y2Nlc3MpIDIyJSwgdmFyKC0tbTNkLXN1cmZhY2UtMikpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtc3VjY2Vzcyk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5ob3RzcG90LWNvdW50X19kb3Qge1xuICAgIHdpZHRoOiA2cHg7XG4gICAgaGVpZ2h0OiA2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IGN1cnJlbnRjb2xvcjtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9Ib3RzcG90Q291bnQudnVlIn0=