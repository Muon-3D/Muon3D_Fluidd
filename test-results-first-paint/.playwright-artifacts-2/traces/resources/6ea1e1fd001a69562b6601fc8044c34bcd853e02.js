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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import M1Live from "/src/components/m1/M1Live.vue";
let OverviewStage = class extends Mixins(OverviewMixin) {
  /** Offline while the printer isn't there, so the live M1 lets go and the picture shows. */
  get stageState() {
    if (!this.socketConnected || !this.klippyReady) return "offline";
    return this.busy ? "printing" : "idle";
  }
  get badge() {
    if (this.busy) {
      if (this.printerPaused) return "Paused";
      return this.layer && this.layers ? `Live \xB7 layer ${this.layer} of ${this.layers}` : "Printing";
    }
    return this.material ? `${this.material.name} heat set` : null;
  }
  get badgeDot() {
    if (this.busy) return null;
    return this.material ? "var(--m3d-warning)" : null;
  }
  get chips() {
    if (this.busy || !this.klippyReady) return [];
    return this.isHomed("XYZ") ? [] : ["Not homed"];
  }
};
OverviewStage = __decorateClass([
  Component({ components: { M1Live } })
], OverviewStage);
const _sfc_main = OverviewStage;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "ov-stage", attrs: { "data-tid": "overview-stage" } }, [_c("m1-live", { staticClass: "ov-stage__m1", attrs: { "state": _vm.stageState, "shift": _vm.busy && _vm.jobThumbnail ? 0.12 : 0, "parts": "" } }), _vm.badge ? _c("span", { staticClass: "ov-stage__badge" }, [_vm.badgeDot ? _c("span", { staticClass: "ov-stage__dot", style: { background: _vm.badgeDot } }) : _vm._e(), _vm._v(" " + _vm._s(_vm.badge) + " ")]) : _vm._e(), _vm.chips.length ? _c("div", { staticClass: "ov-stage__chips" }, _vm._l(_vm.chips, function(chip) {
    return _c("span", { key: chip, staticClass: "ov-stage__chip" }, [_vm._v(_vm._s(chip))]);
  }), 0) : _vm._e(), _vm.busy && _vm.jobThumbnail ? _c("div", { staticClass: "ov-stage__part" }, [_c("img", { attrs: { "src": _vm.jobThumbnail, "alt": "" } })]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/overview/OverviewStage.vue?vue&type=style&index=0&scoped=f0f9a88b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f0f9a88b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/overview/OverviewStage.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTZDQTtBQUNBO0FBQ0E7QUFRQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXhCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJPdmVydmlld1N0YWdlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cIm92LXN0YWdlXCJcbiAgICBkYXRhLXRpZD1cIm92ZXJ2aWV3LXN0YWdlXCJcbiAgPlxuICAgIDxtMS1saXZlXG4gICAgICBjbGFzcz1cIm92LXN0YWdlX19tMVwiXG4gICAgICA6c3RhdGU9XCJzdGFnZVN0YXRlXCJcbiAgICAgIDpzaGlmdD1cImJ1c3kgJiYgam9iVGh1bWJuYWlsID8gMC4xMiA6IDBcIlxuICAgICAgcGFydHNcbiAgICAvPlxuICAgIDxzcGFuXG4gICAgICB2LWlmPVwiYmFkZ2VcIlxuICAgICAgY2xhc3M9XCJvdi1zdGFnZV9fYmFkZ2VcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtaWY9XCJiYWRnZURvdFwiXG4gICAgICAgIGNsYXNzPVwib3Ytc3RhZ2VfX2RvdFwiXG4gICAgICAgIDpzdHlsZT1cInsgYmFja2dyb3VuZDogYmFkZ2VEb3QgfVwiXG4gICAgICAvPlxuICAgICAge3sgYmFkZ2UgfX1cbiAgICA8L3NwYW4+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cImNoaXBzLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cIm92LXN0YWdlX19jaGlwc1wiXG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1mb3I9XCJjaGlwIGluIGNoaXBzXCJcbiAgICAgICAgOmtleT1cImNoaXBcIlxuICAgICAgICBjbGFzcz1cIm92LXN0YWdlX19jaGlwXCJcbiAgICAgID57eyBjaGlwIH19PC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJidXN5ICYmIGpvYlRodW1ibmFpbFwiXG4gICAgICBjbGFzcz1cIm92LXN0YWdlX19wYXJ0XCJcbiAgICA+XG4gICAgICA8aW1nXG4gICAgICAgIDpzcmM9XCJqb2JUaHVtYm5haWxcIlxuICAgICAgICBhbHQ9XCJcIlxuICAgICAgPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgT3ZlcnZpZXdNaXhpbiBmcm9tICdAL21peGlucy9vdmVydmlldydcbmltcG9ydCBNMUxpdmUgZnJvbSAnQC9jb21wb25lbnRzL20xL00xTGl2ZS52dWUnXG5cbi8qKlxuICogVGhlIHdob2xlIE0xLCBsaXZlIG9uIHRoZSBsaWdodCBzdGFnZSwgd2l0aCB3aGF0IGNhbiBiZSBzZWVuIGF0IGEgZ2xhbmNlOlxuICogcHJpbnRpbmcsIHRoZSBsYXllciBhbmQgdGhlIHBhcnQncyBwaWN0dXJlOyBpZGxlLCB0aGUgbWF0ZXJpYWwgYW5kXG4gKiB3aGV0aGVyIGl0IGlzIGhvbWVkLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNMUxpdmUgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3ZlcnZpZXdTdGFnZSBleHRlbmRzIE1peGlucyhPdmVydmlld01peGluKSB7XG4gIC8qKiBPZmZsaW5lIHdoaWxlIHRoZSBwcmludGVyIGlzbid0IHRoZXJlLCBzbyB0aGUgbGl2ZSBNMSBsZXRzIGdvIGFuZCB0aGUgcGljdHVyZSBzaG93cy4gKi9cbiAgZ2V0IHN0YWdlU3RhdGUgKCk6ICdvZmZsaW5lJyB8ICdwcmludGluZycgfCAnaWRsZScge1xuICAgIGlmICghdGhpcy5zb2NrZXRDb25uZWN0ZWQgfHwgIXRoaXMua2xpcHB5UmVhZHkpIHJldHVybiAnb2ZmbGluZSdcbiAgICByZXR1cm4gdGhpcy5idXN5ID8gJ3ByaW50aW5nJyA6ICdpZGxlJ1xuICB9XG5cbiAgZ2V0IGJhZGdlICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAodGhpcy5idXN5KSB7XG4gICAgICBpZiAodGhpcy5wcmludGVyUGF1c2VkKSByZXR1cm4gJ1BhdXNlZCdcbiAgICAgIHJldHVybiB0aGlzLmxheWVyICYmIHRoaXMubGF5ZXJzID8gYExpdmUgwrcgbGF5ZXIgJHt0aGlzLmxheWVyfSBvZiAke3RoaXMubGF5ZXJzfWAgOiAnUHJpbnRpbmcnXG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hdGVyaWFsID8gYCR7dGhpcy5tYXRlcmlhbC5uYW1lfSBoZWF0IHNldGAgOiBudWxsXG4gIH1cblxuICBnZXQgYmFkZ2VEb3QgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIHRoaXMubWF0ZXJpYWwgPyAndmFyKC0tbTNkLXdhcm5pbmcpJyA6IG51bGxcbiAgfVxuXG4gIGdldCBjaGlwcyAoKTogc3RyaW5nW10ge1xuICAgIGlmICh0aGlzLmJ1c3kgfHwgIXRoaXMua2xpcHB5UmVhZHkpIHJldHVybiBbXVxuICAgIHJldHVybiB0aGlzLmlzSG9tZWQoJ1hZWicpID8gW10gOiBbJ05vdCBob21lZCddXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5vdi1zdGFnZSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgbWluLWhlaWdodDogMzAwcHg7XG4gIH1cblxuICAub3Ytc3RhZ2VfX20xIHtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgICBtaW4taGVpZ2h0OiAxMDAlO1xuICB9XG5cbiAgLm92LXN0YWdlX19iYWRnZSB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHRvcDogMTRweDtcbiAgICBsZWZ0OiAxNHB4O1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogNHB4IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogcmdiKDI1NSAyNTUgMjU1IC8gOTIlKTtcbiAgICBjb2xvcjogIzFjMWMxZTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgfVxuXG4gIC5vdi1zdGFnZV9fZG90IHtcbiAgICB3aWR0aDogOHB4O1xuICAgIGhlaWdodDogOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgfVxuXG4gIC5vdi1zdGFnZV9fY2hpcHMge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICByaWdodDogMTRweDtcbiAgICBib3R0b206IDE0cHg7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBnYXA6IDZweDtcbiAgfVxuXG4gIC5vdi1zdGFnZV9fY2hpcCB7XG4gICAgcGFkZGluZzogNHB4IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogcmdiKDI1NSAyNTUgMjU1IC8gOTIlKTtcbiAgICBjb2xvcjogIzFjMWMxZTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgfVxuXG4gIC5vdi1zdGFnZV9fcGFydCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHJpZ2h0OiAxNHB4O1xuICAgIGJvdHRvbTogMTRweDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDMyJTtcbiAgICBtYXgtd2lkdGg6IDE5MHB4O1xuICAgIGFzcGVjdC1yYXRpbzogMTtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudCg5MCUgODAlIGF0IDUwJSA0NSUsICMxZDJhMmEgMCUsICMxMjE1MTYgNzUlKTtcblxuICAgIGltZyB7XG4gICAgICB3aWR0aDogODYlO1xuICAgICAgaGVpZ2h0OiA4NiU7XG4gICAgICBvYmplY3QtZml0OiBjb250YWluO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL292ZXJ2aWV3L092ZXJ2aWV3U3RhZ2UudnVlIn0=