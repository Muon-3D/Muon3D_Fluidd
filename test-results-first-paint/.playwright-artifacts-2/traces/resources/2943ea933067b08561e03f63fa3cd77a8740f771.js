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
import ControlMixin from "/src/mixins/control.ts";
import { signed } from "/src/services/overview/tiles.ts";
import { meshSpan, zNudgeRefusal } from "/src/services/control/safe-move.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
let ControlZOffset = class extends Mixins(ControlMixin) {
  nudges = [-0.05, -0.01, 0.01, 0.05];
  signed = signed;
  get origin() {
    const o = this.$store.state.printer.printer.gcode_move?.homing_origin;
    return Array.isArray(o) && Number.isFinite(+o[2]) ? +o[2] : 0;
  }
  get valueText() {
    return signed(this.origin);
  }
  get sub() {
    const info = this.$store.state.printer.printer.print_stats?.info;
    if ((this.printerPrinting || this.printerPaused) && info?.current_layer && info?.total_layer) {
      return `Live adjust while printing \xB7 layer ${info.current_layer} of ${info.total_layer}`;
    }
    if (this.printerPrinting || this.printerPaused) return "Live adjust while printing";
    return "Minus brings the nozzle closer. Not kept until you save it.";
  }
  get canStep() {
    return this.controlReady && this.isHomed("Z");
  }
  /**
   * A nudge moves the head (MOVE=1). While idle with no-go regions set, one
   * that would take the nozzle low over a region is refused. While a print
   * runs the head follows the print's own path, so live babysteps go.
   */
  refusal(by) {
    if (this.printerPrinting || this.printerPaused) return "";
    const p = this.position;
    return zNudgeRefusal({ x: Number(p[0]), y: Number(p[1]), z: Number(p[2]) }, by, this.noGo, meshSpan(this.$store.state.printer.printer.bed_mesh), this.isHomed("XY"));
  }
  get lowerRefusal() {
    return this.refusal(Math.min(...this.nudges));
  }
  nudge(by) {
    if (!this.canStep || this.refusal(by)) return;
    this.adjustZ(by);
  }
  get lockReason() {
    if (!this.controlReady) return this.controlLock;
    return this.isHomed("Z") ? "" : "Home Z first.";
  }
  get saveCommand() {
    const commands = this.$store.getters["printer/getAvailableCommands"] ?? {};
    return ["Z_OFFSET_APPLY_PROBE", "Z_OFFSET_APPLY_ENDSTOP"].find((c) => c in commands) ?? null;
  }
  get canSave() {
    return this.controlReady && !this.busy && !!this.origin;
  }
  save() {
    const command = this.saveCommand;
    if (command && this.canSave) this.sendGcode(command);
  }
};
ControlZOffset = __decorateClass([
  Component({ components: { ControlCard } })
], ControlZOffset);
const _sfc_main = ControlZOffset;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": "Z offset", "icon": "firstLayer", "locked": _vm.lockReason, "data-tid": "control-zoffset" } }, [_c("div", { staticClass: "zoff__value" }, [_c("b", { attrs: { "data-tid": "zoffset-value" } }, [_vm._v(_vm._s(_vm.valueText))]), _c("small", [_vm._v("mm")])]), _c("p", { staticClass: "zoff__sub" }, [_vm._v(" " + _vm._s(_vm.sub) + " ")]), _c("div", { staticClass: "zoff__nudges" }, _vm._l(_vm.nudges, function(n) {
    return _c("button", { key: n, staticClass: "cbtn", attrs: { "type": "button", "aria-label": n < 0 ? `Nozzle ${Math.abs(n)} mm closer` : `Nozzle ${n} mm further`, "data-tid": `zoffset-${n}`, "disabled": !_vm.canStep || !!_vm.refusal(n) }, on: { "click": function($event) {
      return _vm.nudge(n);
    } } }, [_vm._v(" " + _vm._s(_vm.signed(n, 2)) + " ")]);
  }), 0), _vm.canStep && _vm.lowerRefusal ? _c("p", { staticClass: "zoff__refusal", attrs: { "data-tid": "zoffset-refusal" } }, [_vm._v(" " + _vm._s(_vm.lowerRefusal) + " ")]) : _vm._e(), _vm.saveCommand ? _c("button", { staticClass: "cbtn zoff__save", attrs: { "type": "button", "disabled": !_vm.canSave, "data-tid": "zoffset-save" }, on: { "click": _vm.save } }, [_vm._v(" Save to config ")]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlZOffset.vue?vue&type=style&index=0&scoped=f5c89892&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f5c89892",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlZOffset.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBUUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExREE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29udHJvbFpPZmZzZXQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGNvbnRyb2wtY2FyZFxuICAgIHRpdGxlPVwiWiBvZmZzZXRcIlxuICAgIGljb249XCJmaXJzdExheWVyXCJcbiAgICA6bG9ja2VkPVwibG9ja1JlYXNvblwiXG4gICAgZGF0YS10aWQ9XCJjb250cm9sLXpvZmZzZXRcIlxuICA+XG4gICAgPGRpdiBjbGFzcz1cInpvZmZfX3ZhbHVlXCI+XG4gICAgICA8YiBkYXRhLXRpZD1cInpvZmZzZXQtdmFsdWVcIj57eyB2YWx1ZVRleHQgfX08L2I+PHNtYWxsPm1tPC9zbWFsbD5cbiAgICA8L2Rpdj5cbiAgICA8cCBjbGFzcz1cInpvZmZfX3N1YlwiPlxuICAgICAge3sgc3ViIH19XG4gICAgPC9wPlxuICAgIDxkaXYgY2xhc3M9XCJ6b2ZmX19udWRnZXNcIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1mb3I9XCJuIGluIG51ZGdlc1wiXG4gICAgICAgIDprZXk9XCJuXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgIDphcmlhLWxhYmVsPVwibiA8IDAgPyBgTm96emxlICR7TWF0aC5hYnMobil9IG1tIGNsb3NlcmAgOiBgTm96emxlICR7bn0gbW0gZnVydGhlcmBcIlxuICAgICAgICA6ZGF0YS10aWQ9XCJgem9mZnNldC0ke259YFwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFjYW5TdGVwIHx8ICEhcmVmdXNhbChuKVwiXG4gICAgICAgIEBjbGljaz1cIm51ZGdlKG4pXCJcbiAgICAgID5cbiAgICAgICAge3sgc2lnbmVkKG4sIDIpIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8cFxuICAgICAgdi1pZj1cImNhblN0ZXAgJiYgbG93ZXJSZWZ1c2FsXCJcbiAgICAgIGNsYXNzPVwiem9mZl9fcmVmdXNhbFwiXG4gICAgICBkYXRhLXRpZD1cInpvZmZzZXQtcmVmdXNhbFwiXG4gICAgPlxuICAgICAge3sgbG93ZXJSZWZ1c2FsIH19XG4gICAgPC9wPlxuICAgIDxidXR0b25cbiAgICAgIHYtaWY9XCJzYXZlQ29tbWFuZFwiXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwiY2J0biB6b2ZmX19zYXZlXCJcbiAgICAgIDpkaXNhYmxlZD1cIiFjYW5TYXZlXCJcbiAgICAgIGRhdGEtdGlkPVwiem9mZnNldC1zYXZlXCJcbiAgICAgIEBjbGljaz1cInNhdmVcIlxuICAgID5cbiAgICAgIFNhdmUgdG8gY29uZmlnXG4gICAgPC9idXR0b24+XG4gIDwvY29udHJvbC1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBDb250cm9sTWl4aW4gZnJvbSAnQC9taXhpbnMvY29udHJvbCdcbmltcG9ydCB7IHNpZ25lZCB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvdGlsZXMnXG5pbXBvcnQgeyBtZXNoU3Bhbiwgek51ZGdlUmVmdXNhbCB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9zYWZlLW1vdmUnXG5pbXBvcnQgQ29udHJvbENhcmQgZnJvbSAnLi9Db250cm9sQ2FyZC52dWUnXG5cbi8qKlxuICogVGhlIGxpdmUgWiBvZmZzZXQsIHdpdGggbnVkZ2VzIHRvIGJhYnlzdGVwIHRoZSBub3p6bGUgKHRoZSBzYW1lXG4gKiBTRVRfR0NPREVfT0ZGU0VUIGV2ZXJ5IFogYWRqdXN0IHNlbmRzOyBtaW51cyBpcyBjbG9zZXIgdG8gdGhlIHBsYXRlKSwgYW5kXG4gKiBTYXZlIHRvIGNvbmZpZyB3aGVyZSB0aGUgcHJpbnRlciBjYW4gYXBwbHkgaXQgdG8gaXRzIHByb2JlIG9yIGVuZHN0b3AuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENvbnRyb2xDYXJkIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnRyb2xaT2Zmc2V0IGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbikge1xuICByZWFkb25seSBudWRnZXMgPSBbLTAuMDUsIC0wLjAxLCAwLjAxLCAwLjA1XVxuICByZWFkb25seSBzaWduZWQgPSBzaWduZWRcblxuICBnZXQgb3JpZ2luICgpOiBudW1iZXIge1xuICAgIGNvbnN0IG8gPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZ2NvZGVfbW92ZT8uaG9taW5nX29yaWdpbiBhcyBudW1iZXJbXSB8IHVuZGVmaW5lZFxuICAgIHJldHVybiBBcnJheS5pc0FycmF5KG8pICYmIE51bWJlci5pc0Zpbml0ZSgrb1syXSkgPyArb1syXSA6IDBcbiAgfVxuXG4gIGdldCB2YWx1ZVRleHQgKCk6IHN0cmluZyB7IHJldHVybiBzaWduZWQodGhpcy5vcmlnaW4pIH1cblxuICBnZXQgc3ViICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGluZm8gPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIucHJpbnRfc3RhdHM/LmluZm8gYXMgeyBjdXJyZW50X2xheWVyPzogbnVtYmVyIHwgbnVsbCwgdG90YWxfbGF5ZXI/OiBudW1iZXIgfCBudWxsIH0gfCB1bmRlZmluZWRcbiAgICBpZiAoKHRoaXMucHJpbnRlclByaW50aW5nIHx8IHRoaXMucHJpbnRlclBhdXNlZCkgJiYgaW5mbz8uY3VycmVudF9sYXllciAmJiBpbmZvPy50b3RhbF9sYXllcikge1xuICAgICAgcmV0dXJuIGBMaXZlIGFkanVzdCB3aGlsZSBwcmludGluZyDCtyBsYXllciAke2luZm8uY3VycmVudF9sYXllcn0gb2YgJHtpbmZvLnRvdGFsX2xheWVyfWBcbiAgICB9XG4gICAgaWYgKHRoaXMucHJpbnRlclByaW50aW5nIHx8IHRoaXMucHJpbnRlclBhdXNlZCkgcmV0dXJuICdMaXZlIGFkanVzdCB3aGlsZSBwcmludGluZydcbiAgICByZXR1cm4gJ01pbnVzIGJyaW5ncyB0aGUgbm96emxlIGNsb3Nlci4gTm90IGtlcHQgdW50aWwgeW91IHNhdmUgaXQuJ1xuICB9XG5cbiAgZ2V0IGNhblN0ZXAgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgJiYgdGhpcy5pc0hvbWVkKCdaJykgfVxuXG4gIC8qKlxuICAgKiBBIG51ZGdlIG1vdmVzIHRoZSBoZWFkIChNT1ZFPTEpLiBXaGlsZSBpZGxlIHdpdGggbm8tZ28gcmVnaW9ucyBzZXQsIG9uZVxuICAgKiB0aGF0IHdvdWxkIHRha2UgdGhlIG5venpsZSBsb3cgb3ZlciBhIHJlZ2lvbiBpcyByZWZ1c2VkLiBXaGlsZSBhIHByaW50XG4gICAqIHJ1bnMgdGhlIGhlYWQgZm9sbG93cyB0aGUgcHJpbnQncyBvd24gcGF0aCwgc28gbGl2ZSBiYWJ5c3RlcHMgZ28uXG4gICAqL1xuICByZWZ1c2FsIChieTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkKSByZXR1cm4gJydcbiAgICBjb25zdCBwID0gdGhpcy5wb3NpdGlvblxuICAgIHJldHVybiB6TnVkZ2VSZWZ1c2FsKHsgeDogTnVtYmVyKHBbMF0pLCB5OiBOdW1iZXIocFsxXSksIHo6IE51bWJlcihwWzJdKSB9LCBieSwgdGhpcy5ub0dvLCBtZXNoU3Bhbih0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuYmVkX21lc2gpLCB0aGlzLmlzSG9tZWQoJ1hZJykpXG4gIH1cblxuICBnZXQgbG93ZXJSZWZ1c2FsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlZnVzYWwoTWF0aC5taW4oLi4udGhpcy5udWRnZXMpKVxuICB9XG5cbiAgbnVkZ2UgKGJ5OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuY2FuU3RlcCB8fCB0aGlzLnJlZnVzYWwoYnkpKSByZXR1cm5cbiAgICB0aGlzLmFkanVzdFooYnkpXG4gIH1cblxuICBnZXQgbG9ja1JlYXNvbiAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICAgIHJldHVybiB0aGlzLmlzSG9tZWQoJ1onKSA/ICcnIDogJ0hvbWUgWiBmaXJzdC4nXG4gIH1cblxuICBnZXQgc2F2ZUNvbW1hbmQgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGNvbW1hbmRzID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0QXZhaWxhYmxlQ29tbWFuZHMnXSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPz8ge31cbiAgICByZXR1cm4gWydaX09GRlNFVF9BUFBMWV9QUk9CRScsICdaX09GRlNFVF9BUFBMWV9FTkRTVE9QJ10uZmluZChjID0+IGMgaW4gY29tbWFuZHMpID8/IG51bGxcbiAgfVxuXG4gIGdldCBjYW5TYXZlICgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuY29udHJvbFJlYWR5ICYmICF0aGlzLmJ1c3kgJiYgISF0aGlzLm9yaWdpbiB9XG5cbiAgc2F2ZSAoKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IHRoaXMuc2F2ZUNvbW1hbmRcbiAgICBpZiAoY29tbWFuZCAmJiB0aGlzLmNhblNhdmUpIHRoaXMuc2VuZEdjb2RlKGNvbW1hbmQpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC56b2ZmX192YWx1ZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogYmFzZWxpbmU7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgZ2FwOiA0cHg7XG5cbiAgICBiIHsgZm9udC1zaXplOiAzMHB4OyBmb250LXdlaWdodDogNzAwOyBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zOyB9XG4gICAgc21hbGwgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXNpemU6IDEzcHg7IH1cbiAgfVxuXG4gIC56b2ZmX19zdWIge1xuICAgIG1hcmdpbjogLThweCAwIDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB9XG5cbiAgLnpvZmZfX251ZGdlcyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCg0LCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAuem9mZl9fcmVmdXNhbCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLnpvZmZfX3NhdmUge1xuICAgIHdpZHRoOiAxMDAlO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sWk9mZnNldC52dWUifQ==