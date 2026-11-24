/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import OverviewMixin from "/src/mixins/overview.ts";
import { signed } from "/src/services/overview/tiles.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import { meshSpan, zNudgeRefusal } from "/src/services/control/safe-move.ts";
let ZOffsetTile = class extends Mixins(OverviewMixin) {
  open = false;
  step = 5e-3;
  stepOptions = [5e-3, 0.01, 0.025, 0.05].map((v) => ({ value: v, label: String(v) }));
  get origin() {
    const o = this.gcodeMove.homing_origin;
    return Array.isArray(o) && Number.isFinite(+o[2]) ? +o[2] : null;
  }
  get valueText() {
    return signed(this.origin ?? 0);
  }
  get sub() {
    return `Not saved until you save it \xB7 steps of ${this.step}`;
  }
  get canStep() {
    return this.controlReady && this.isHomed("Z");
  }
  /**
   * The same notch rule as Control's Z offset card (ControlZOffset): a nudge moves the head (MOVE=1), so while idle
   * one that would take the nozzle low over the notch, or lower it with X/Y unhomed, is refused. Live babysteps
   * during a print follow the print's own path and go.
   */
  refusal(by) {
    if (this.printerPrinting || this.printerPaused) return "";
    const p = this.position;
    return zNudgeRefusal({ x: Number(p[0]), y: Number(p[1]), z: Number(p[2]) }, by, this.noGo, meshSpan(this.$store.state.printer.printer.bed_mesh), this.isHomed("XY"));
  }
  nudge(by) {
    if (!this.canStep || this.refusal(by)) return;
    this.adjustZ(by);
  }
  get commands() {
    return this.$store.getters["printer/getAvailableCommands"] ?? {};
  }
  get saveCommand() {
    return ["Z_OFFSET_APPLY_PROBE", "Z_OFFSET_APPLY_ENDSTOP"].find((c) => c in this.commands) ?? null;
  }
  get calibrateCommand() {
    return "PROBE_CALIBRATE" in this.commands || "Z_ENDSTOP_CALIBRATE" in this.commands;
  }
  get menu() {
    const items = [];
    const save = this.saveCommand;
    if (save) items.push({ id: "save", label: "Save to config", disabled: !this.controlReady || this.busy || !this.origin, action: () => {
      if (this.controlReady && !this.busy) this.sendGcode(save);
    } });
    if (this.calibrateCommand) items.push({ id: "calibrate", label: "Run probe calibration\u2026", to: this.pagePath("/maintenance") });
    return items;
  }
};
ZOffsetTile = __decorateClass([
  Component({ components: { TileShell, SegPicker } })
], ZOffsetTile);
const _sfc_main = ZOffsetTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { staticClass: "zo", attrs: { "tile": "zoffset", "title": "Z offset", "icon": "firstLayer", "menu": _vm.menu, "open": _vm.open }, on: { "toggle": function($event) {
    _vm.open = !_vm.open;
  } }, scopedSlots: _vm._u([{ key: "after", fn: function() {
    return [_c("span", { staticClass: "zo__step" }, [_c("button", { staticClass: "zo__round", attrs: { "type": "button", "aria-label": "Lower the nozzle", "data-tid": "zoffset-down", "disabled": !_vm.canStep || !!_vm.refusal(-_vm.step), "title": _vm.refusal(-_vm.step) || void 0 }, on: { "click": function($event) {
      return _vm.nudge(-_vm.step);
    } } }, [_c(__unplugin_components_0, { attrs: { "name": "minus", "small": "" } })], 1), _c("button", { staticClass: "zo__round", attrs: { "type": "button", "aria-label": "Raise the nozzle", "data-tid": "zoffset-up", "disabled": !_vm.canStep }, on: { "click": function($event) {
      return _vm.nudge(_vm.step);
    } } }, [_c(__unplugin_components_1, { attrs: { "name": "plus", "small": "" } })], 1)])];
  }, proxy: true }, { key: "popover", fn: function() {
    return [_c("div", { staticClass: "zo__pop" }, [_c("p", { staticClass: "ot__note" }, [_vm._v(" Moves the nozzle a little closer to or further from the plate, now. Minus is closer. ")]), _c("seg-picker", { attrs: { "options": _vm.stepOptions, "value": _vm.step, "label": "Step size", "accent": "", "fill": "" }, on: { "input": function($event) {
      _vm.step = $event;
    } } }), !_vm.canStep ? _c("p", { staticClass: "ot__lock" }, [_vm._v(" " + _vm._s(_vm.controlReady ? "Home Z first." : _vm.controlLock) + " ")]) : _vm._e()], 1)];
  }, proxy: true }]) }, [_c("span", { staticClass: "ot__value", attrs: { "data-tid": "zoffset-value" } }, [_vm._v(_vm._s(_vm.valueText)), _c("small", [_vm._v("mm")])]), _c("span", { staticClass: "ot__sub" }, [_vm._v(_vm._s(_vm.sub))])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/ZOffsetTile.vue?vue&type=style&index=0&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  null,
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/ZOffsetTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBeUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQS9DQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJaT2Zmc2V0VGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dGlsZS1zaGVsbFxuICAgIHRpbGU9XCJ6b2Zmc2V0XCJcbiAgICB0aXRsZT1cIlogb2Zmc2V0XCJcbiAgICBpY29uPVwiZmlyc3RMYXllclwiXG4gICAgOm1lbnU9XCJtZW51XCJcbiAgICA6b3Blbj1cIm9wZW5cIlxuICAgIGNsYXNzPVwiem9cIlxuICAgIEB0b2dnbGU9XCJvcGVuID0gIW9wZW5cIlxuICA+XG4gICAgPHNwYW5cbiAgICAgIGNsYXNzPVwib3RfX3ZhbHVlXCJcbiAgICAgIGRhdGEtdGlkPVwiem9mZnNldC12YWx1ZVwiXG4gICAgPnt7IHZhbHVlVGV4dCB9fTxzbWFsbD5tbTwvc21hbGw+PC9zcGFuPlxuICAgIDxzcGFuIGNsYXNzPVwib3RfX3N1YlwiPnt7IHN1YiB9fTwvc3Bhbj5cblxuICAgIDx0ZW1wbGF0ZSAjYWZ0ZXI+XG4gICAgICA8c3BhbiBjbGFzcz1cInpvX19zdGVwXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cInpvX19yb3VuZFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkxvd2VyIHRoZSBub3p6bGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiem9mZnNldC1kb3duXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuU3RlcCB8fCAhIXJlZnVzYWwoLXN0ZXApXCJcbiAgICAgICAgICA6dGl0bGU9XCJyZWZ1c2FsKC1zdGVwKSB8fCB1bmRlZmluZWRcIlxuICAgICAgICAgIEBjbGljaz1cIm51ZGdlKC1zdGVwKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cIm1pbnVzXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cInpvX19yb3VuZFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIlJhaXNlIHRoZSBub3p6bGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiem9mZnNldC11cFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNhblN0ZXBcIlxuICAgICAgICAgIEBjbGljaz1cIm51ZGdlKHN0ZXApXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9zcGFuPlxuICAgIDwvdGVtcGxhdGU+XG5cbiAgICA8dGVtcGxhdGUgI3BvcG92ZXI+XG4gICAgICA8ZGl2IGNsYXNzPVwiem9fX3BvcFwiPlxuICAgICAgICA8cCBjbGFzcz1cIm90X19ub3RlXCI+XG4gICAgICAgICAgTW92ZXMgdGhlIG5venpsZSBhIGxpdHRsZSBjbG9zZXIgdG8gb3IgZnVydGhlciBmcm9tIHRoZSBwbGF0ZSwgbm93LiBNaW51cyBpcyBjbG9zZXIuXG4gICAgICAgIDwvcD5cbiAgICAgICAgPHNlZy1waWNrZXJcbiAgICAgICAgICA6b3B0aW9ucz1cInN0ZXBPcHRpb25zXCJcbiAgICAgICAgICA6dmFsdWU9XCJzdGVwXCJcbiAgICAgICAgICBsYWJlbD1cIlN0ZXAgc2l6ZVwiXG4gICAgICAgICAgYWNjZW50XG4gICAgICAgICAgZmlsbFxuICAgICAgICAgIEBpbnB1dD1cInN0ZXAgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCIhY2FuU3RlcFwiXG4gICAgICAgICAgY2xhc3M9XCJvdF9fbG9ja1wiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBjb250cm9sUmVhZHkgPyAnSG9tZSBaIGZpcnN0LicgOiBjb250cm9sTG9jayB9fVxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L3RpbGUtc2hlbGw+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5pbXBvcnQgeyBzaWduZWQsIHR5cGUgVGlsZU1lbnVJdGVtIH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy90aWxlcydcbmltcG9ydCBUaWxlU2hlbGwgZnJvbSAnLi9UaWxlU2hlbGwudnVlJ1xuaW1wb3J0IFNlZ1BpY2tlciwgeyB0eXBlIFNlZ09wdGlvbiB9IGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1NlZ1BpY2tlci52dWUnXG5pbXBvcnQgeyBtZXNoU3Bhbiwgek51ZGdlUmVmdXNhbCB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9zYWZlLW1vdmUnXG5cbi8qKlxuICogVGhlIGxpdmUgWiBvZmZzZXQsIHdpdGggbWludXMgYW5kIHBsdXMgdG8gYmFieXN0ZXAgdGhlIG5venpsZSAoQ29udHJvbFxuICogc2VuZHMgdGhlIHNhbWUgRy1jb2RlIGFzIGV2ZXJ5IG90aGVyIFogYWRqdXN0KS4gVGhlIHN0ZXAgc2l6ZSBpcyBpbiB0aGVcbiAqIHBvcG92ZXI7IHNhdmluZyBpdCB0byB0aGUgcHJpbnRlciBjb25maWcgYW5kIHByb2JlIGNhbGlicmF0aW9uIGFyZSBiZWhpbmRcbiAqIHRoZSB0aHJlZSBkb3RzLCBhbmQgb25seSBmb3IgcHJpbnRlcnMgdGhhdCBjYW4uXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRpbGVTaGVsbCwgU2VnUGlja2VyIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFpPZmZzZXRUaWxlIGV4dGVuZHMgTWl4aW5zKE92ZXJ2aWV3TWl4aW4pIHtcbiAgb3BlbiA9IGZhbHNlXG4gIHN0ZXAgPSAwLjAwNVxuICByZWFkb25seSBzdGVwT3B0aW9uczogU2VnT3B0aW9uW10gPSBbMC4wMDUsIDAuMDEsIDAuMDI1LCAwLjA1XS5tYXAodiA9PiAoeyB2YWx1ZTogdiwgbGFiZWw6IFN0cmluZyh2KSB9KSlcblxuICBnZXQgb3JpZ2luICgpOiBudW1iZXIgfCBudWxsIHtcbiAgICBjb25zdCBvID0gdGhpcy5nY29kZU1vdmUuaG9taW5nX29yaWdpbiBhcyBudW1iZXJbXSB8IHVuZGVmaW5lZFxuICAgIHJldHVybiBBcnJheS5pc0FycmF5KG8pICYmIE51bWJlci5pc0Zpbml0ZSgrb1syXSkgPyArb1syXSA6IG51bGxcbiAgfVxuXG4gIGdldCB2YWx1ZVRleHQgKCk6IHN0cmluZyB7IHJldHVybiBzaWduZWQodGhpcy5vcmlnaW4gPz8gMCkgfVxuICBnZXQgc3ViICgpOiBzdHJpbmcgeyByZXR1cm4gYE5vdCBzYXZlZCB1bnRpbCB5b3Ugc2F2ZSBpdCDCtyBzdGVwcyBvZiAke3RoaXMuc3RlcH1gIH1cbiAgZ2V0IGNhblN0ZXAgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgJiYgdGhpcy5pc0hvbWVkKCdaJykgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2FtZSBub3RjaCBydWxlIGFzIENvbnRyb2wncyBaIG9mZnNldCBjYXJkIChDb250cm9sWk9mZnNldCk6IGEgbnVkZ2UgbW92ZXMgdGhlIGhlYWQgKE1PVkU9MSksIHNvIHdoaWxlIGlkbGVcbiAgICogb25lIHRoYXQgd291bGQgdGFrZSB0aGUgbm96emxlIGxvdyBvdmVyIHRoZSBub3RjaCwgb3IgbG93ZXIgaXQgd2l0aCBYL1kgdW5ob21lZCwgaXMgcmVmdXNlZC4gTGl2ZSBiYWJ5c3RlcHNcbiAgICogZHVyaW5nIGEgcHJpbnQgZm9sbG93IHRoZSBwcmludCdzIG93biBwYXRoIGFuZCBnby5cbiAgICovXG4gIHJlZnVzYWwgKGJ5OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnByaW50ZXJQcmludGluZyB8fCB0aGlzLnByaW50ZXJQYXVzZWQpIHJldHVybiAnJ1xuICAgIGNvbnN0IHAgPSB0aGlzLnBvc2l0aW9uXG4gICAgcmV0dXJuIHpOdWRnZVJlZnVzYWwoeyB4OiBOdW1iZXIocFswXSksIHk6IE51bWJlcihwWzFdKSwgejogTnVtYmVyKHBbMl0pIH0sIGJ5LCB0aGlzLm5vR28sIG1lc2hTcGFuKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5iZWRfbWVzaCksIHRoaXMuaXNIb21lZCgnWFknKSlcbiAgfVxuXG4gIG51ZGdlIChieTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmNhblN0ZXAgfHwgdGhpcy5yZWZ1c2FsKGJ5KSkgcmV0dXJuXG4gICAgdGhpcy5hZGp1c3RaKGJ5KVxuICB9XG5cbiAgZ2V0IGNvbW1hbmRzICgpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEF2YWlsYWJsZUNvbW1hbmRzJ10gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID8/IHt9XG4gIH1cblxuICBnZXQgc2F2ZUNvbW1hbmQgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBbJ1pfT0ZGU0VUX0FQUExZX1BST0JFJywgJ1pfT0ZGU0VUX0FQUExZX0VORFNUT1AnXS5maW5kKGMgPT4gYyBpbiB0aGlzLmNvbW1hbmRzKSA/PyBudWxsXG4gIH1cblxuICBnZXQgY2FsaWJyYXRlQ29tbWFuZCAoKTogYm9vbGVhbiB7IHJldHVybiAnUFJPQkVfQ0FMSUJSQVRFJyBpbiB0aGlzLmNvbW1hbmRzIHx8ICdaX0VORFNUT1BfQ0FMSUJSQVRFJyBpbiB0aGlzLmNvbW1hbmRzIH1cblxuICBnZXQgbWVudSAoKTogVGlsZU1lbnVJdGVtW10ge1xuICAgIGNvbnN0IGl0ZW1zOiBUaWxlTWVudUl0ZW1bXSA9IFtdXG4gICAgY29uc3Qgc2F2ZSA9IHRoaXMuc2F2ZUNvbW1hbmRcbiAgICBpZiAoc2F2ZSkgaXRlbXMucHVzaCh7IGlkOiAnc2F2ZScsIGxhYmVsOiAnU2F2ZSB0byBjb25maWcnLCBkaXNhYmxlZDogIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuYnVzeSB8fCAhdGhpcy5vcmlnaW4sIGFjdGlvbjogKCkgPT4geyBpZiAodGhpcy5jb250cm9sUmVhZHkgJiYgIXRoaXMuYnVzeSkgdGhpcy5zZW5kR2NvZGUoc2F2ZSkgfSB9KVxuICAgIGlmICh0aGlzLmNhbGlicmF0ZUNvbW1hbmQpIGl0ZW1zLnB1c2goeyBpZDogJ2NhbGlicmF0ZScsIGxhYmVsOiAnUnVuIHByb2JlIGNhbGlicmF0aW9u4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy9tYWludGVuYW5jZScpIH0pXG4gICAgcmV0dXJuIGl0ZW1zXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbi56b19fc3RlcCB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiA0NnB4OyByaWdodDogMThweDsgZGlzcGxheTogaW5saW5lLWZsZXg7IGdhcDogOHB4OyB9XG4uem9fX3JvdW5kIHsgZGlzcGxheTogaW5saW5lLWZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB3aWR0aDogNDBweDsgaGVpZ2h0OiA0MHB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpOyBjdXJzb3I6IHBvaW50ZXI7IH1cbi56b19fcm91bmQgLmZyYW1lLWljb24geyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyB9XG4uem9fX3JvdW5kOmRpc2FibGVkIHsgb3BhY2l0eTogMC40OyBjdXJzb3I6IGRlZmF1bHQ7IH1cbi56b19fcG9wIHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiAxMnB4OyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9aT2Zmc2V0VGlsZS52dWUifQ==