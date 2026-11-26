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
import PredictedHeadMixin from "/src/mixins/predicted-head.ts";
import { aspectOf, bedToPixel, nudgeTarget, pixelToBed, regionRect } from "/src/services/control/trackpad.ts";
import { X_RIGHT, Y_BACK } from "/src/services/machine/orientation.ts";
const PERCENT = { width: 100, height: 100 };
const MAX_HEIGHT = 540;
const pct = (r) => ({ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` });
const DRAG_SLOP = 6;
let ControlTrackpad = class extends Mixins(PredictedHeadMixin) {
  bed;
  showHead;
  target;
  noGo;
  disabled;
  targetBad;
  onRelease;
  step;
  /** The tallest the bed is drawn, px. Width is capped from it, so the bed stays to scale. */
  MAX_HEIGHT = MAX_HEIGHT;
  pointer = null;
  downAt = null;
  dragging = false;
  get aspect() {
    return String(aspectOf(this.bed));
  }
  get label() {
    if (this.onRelease) return "The bed, to scale, seen from above. Tap or drag to pick where the head should go; lifting the pointer, or Enter, moves it there once. Arrow keys move the pick.";
    return "The bed, to scale, seen from above. Tap to pick where the head should go, then press Move here; or drag, and the head follows. Arrow keys move the pick.";
  }
  get regions() {
    const noGo = this.noGo;
    if (!noGo || noGo === "invalid") return null;
    return noGo.regions.map((r) => ({ rect: pct(regionRect(r, this.bed, PERCENT)) }));
  }
  /** Where the head is drawn: predicted between reports (services/control/position-predict). */
  get head() {
    const p = this.predictedHead;
    return this.showHead && p ? { x: p[0], y: p[1] } : null;
  }
  get headAt() {
    return this.head ? bedToPixel(this.head, this.bed, PERCENT) : null;
  }
  get targetAt() {
    return this.target ? bedToPixel(this.target, this.bed, PERCENT) : null;
  }
  /** The bed point under a pointer event, or null. */
  pointAt(clientX, clientY) {
    const el = this.$refs.pad;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return pixelToBed({ x: clientX - r.left, y: clientY - r.top }, this.bed, { width: r.width, height: r.height });
  }
  pick(p) {
    if (p && !this.disabled) this.$emit("pick", p);
  }
  onDown(e) {
    if (this.disabled || this.pointer !== null || e.pointerType === "mouse" && e.button !== 0) return;
    this.pointer = e.pointerId;
    this.downAt = { x: e.clientX, y: e.clientY };
    this.dragging = false;
    e.currentTarget?.setPointerCapture?.(e.pointerId);
    this.pick(this.pointAt(e.clientX, e.clientY));
  }
  /** Past DRAG_SLOP a press is a drag: the target follows the pointer, and Movement streams it. */
  onDrag(e) {
    if (this.pointer === null || e.pointerId !== this.pointer || this.disabled) return;
    const p = this.pointAt(e.clientX, e.clientY);
    if (!p) return;
    if (!this.dragging) {
      const from = this.downAt;
      if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) < DRAG_SLOP) return;
      this.dragging = true;
      this.$emit("drag-start", p);
      return;
    }
    this.$emit("drag", p);
  }
  onUp(e) {
    if (e.pointerId !== this.pointer) return;
    this.pointer = null;
    const was = this.dragging;
    this.dragging = false;
    if (was) this.$emit("drag-end");
    this.$emit("release");
  }
  /** The pointer was taken away (a system gesture, a palm, a call): stop at once. */
  onCancel(e) {
    if (e.pointerId !== this.pointer) return;
    this.endWithCancel();
  }
  /** Capture lost without a pointer-up (the element hid, another capture). */
  onLost(e) {
    if (e.pointerId === this.pointer) this.endWithCancel();
  }
  onBlur() {
    if (this.dragging) this.endWithCancel();
  }
  endWithCancel() {
    const was = this.dragging;
    this.pointer = null;
    this.dragging = false;
    if (was) this.$emit("drag-cancel");
  }
  mounted() {
    window.addEventListener("blur", this.onBlur);
  }
  beforeDestroy() {
    window.removeEventListener("blur", this.onBlur);
    this.endWithCancel();
  }
  onKey(e) {
    const keys = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (e.key === "Enter" && !this.disabled) {
      e.preventDefault();
      this.$emit("release");
      return;
    }
    const k = keys[e.key];
    if (!k || this.disabled) return;
    e.preventDefault();
    const from = this.target ?? this.head;
    if (!from) return;
    const by = this.step * (e.shiftKey ? 10 : 1);
    this.$emit("pick", nudgeTarget(from, k[0] * by, k[1] * by, this.bed, Y_BACK, X_RIGHT));
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], ControlTrackpad.prototype, "bed", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlTrackpad.prototype, "showHead", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], ControlTrackpad.prototype, "target", 2);
__decorateClass([
  Prop({ default: null })
], ControlTrackpad.prototype, "noGo", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlTrackpad.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlTrackpad.prototype, "targetBad", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlTrackpad.prototype, "onRelease", 2);
__decorateClass([
  Prop({ type: Number, default: 10 })
], ControlTrackpad.prototype, "step", 2);
ControlTrackpad = __decorateClass([
  Component({})
], ControlTrackpad);
const _sfc_main = ControlTrackpad;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { ref: "pad", staticClass: "tpad", class: { "tpad--off": _vm.disabled }, style: { aspectRatio: _vm.aspect, maxWidth: `calc(${_vm.MAX_HEIGHT}px * ${_vm.aspect})` }, attrs: { "tabindex": "0", "role": "application", "aria-label": _vm.label, "aria-disabled": _vm.disabled ? "true" : void 0, "data-tid": "move-trackpad" }, on: { "pointerdown": _vm.onDown, "pointermove": _vm.onDrag, "pointerup": _vm.onUp, "pointercancel": _vm.onCancel, "lostpointercapture": _vm.onLost, "blur": _vm.onBlur, "keydown": _vm.onKey } }, [_c("span", { staticClass: "tpad__watermark" }, [_vm._v("MUON3D")]), _vm.regions ? _vm._l(_vm.regions, function(r, i) {
    return _c("span", { key: `notch-${i}`, staticClass: "tpad__notch", style: r.rect, attrs: { "data-tid": "trackpad-notch", "aria-hidden": "true" } }, [i === 0 ? _c("span", [_vm._v("notch")]) : _vm._e()]);
  }) : _vm._e(), _vm.headAt && _vm.targetAt ? _c("svg", { staticClass: "tpad__line", attrs: { "viewBox": "0 0 100 100", "preserveAspectRatio": "none", "aria-hidden": "true", "data-tid": "trackpad-line" } }, [_c("line", { attrs: { "x1": _vm.headAt.x, "y1": _vm.headAt.y, "x2": _vm.targetAt.x, "y2": _vm.targetAt.y, "vector-effect": "non-scaling-stroke" } })]) : _vm._e(), _vm.headAt ? _c("span", { staticClass: "tpad__head", style: { left: `${_vm.headAt.x}%`, top: `${_vm.headAt.y}%` }, attrs: { "data-tid": "trackpad-head" } }) : _vm._e(), _vm.targetAt ? _c("span", { staticClass: "tpad__target", class: { "tpad__target--bad": _vm.targetBad }, style: { left: `${_vm.targetAt.x}%`, top: `${_vm.targetAt.y}%` }, attrs: { "data-tid": "trackpad-target" } }) : _vm._e(), _vm._t("default")], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlTrackpad.vue?vue&type=style&index=0&scoped=ac34338c&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ac34338c",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlTrackpad.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtFQTtBQUNBO0FBQ0E7QUFFQTtBQUdBO0FBQ0E7QUFDQTtBQUdBO0FBZUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXZJQTtBQUFBO0FBQUEsR0FEQSxnQkFDQTtBQUVBO0FBQUE7QUFBQSxHQUhBLGdCQUdBO0FBQ0E7QUFBQTtBQUFBLEdBSkEsZ0JBSUE7QUFDQTtBQUFBO0FBQUEsR0FMQSxnQkFLQTtBQUNBO0FBQUE7QUFBQSxHQU5BLGdCQU1BO0FBQ0E7QUFBQTtBQUFBLEdBUEEsZ0JBT0E7QUFFQTtBQUFBO0FBQUEsR0FUQSxnQkFTQTtBQUNBO0FBQUE7QUFBQSxHQVZBLGdCQVVBO0FBVkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29udHJvbFRyYWNrcGFkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICByZWY9XCJwYWRcIlxuICAgIGNsYXNzPVwidHBhZFwiXG4gICAgOmNsYXNzPVwieyAndHBhZC0tb2ZmJzogZGlzYWJsZWQgfVwiXG4gICAgOnN0eWxlPVwieyBhc3BlY3RSYXRpbzogYXNwZWN0LCBtYXhXaWR0aDogYGNhbGMoJHtNQVhfSEVJR0hUfXB4ICogJHthc3BlY3R9KWAgfVwiXG4gICAgdGFiaW5kZXg9XCIwXCJcbiAgICByb2xlPVwiYXBwbGljYXRpb25cIlxuICAgIDphcmlhLWxhYmVsPVwibGFiZWxcIlxuICAgIDphcmlhLWRpc2FibGVkPVwiZGlzYWJsZWQgPyAndHJ1ZScgOiB1bmRlZmluZWRcIlxuICAgIGRhdGEtdGlkPVwibW92ZS10cmFja3BhZFwiXG4gICAgQHBvaW50ZXJkb3duPVwib25Eb3duXCJcbiAgICBAcG9pbnRlcm1vdmU9XCJvbkRyYWdcIlxuICAgIEBwb2ludGVydXA9XCJvblVwXCJcbiAgICBAcG9pbnRlcmNhbmNlbD1cIm9uQ2FuY2VsXCJcbiAgICBAbG9zdHBvaW50ZXJjYXB0dXJlPVwib25Mb3N0XCJcbiAgICBAYmx1cj1cIm9uQmx1clwiXG4gICAgQGtleWRvd249XCJvbktleVwiXG4gID5cbiAgICA8c3BhbiBjbGFzcz1cInRwYWRfX3dhdGVybWFya1wiPk1VT04zRDwvc3Bhbj5cbiAgICA8dGVtcGxhdGUgdi1pZj1cInJlZ2lvbnNcIj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtZm9yPVwiKHIsIGkpIGluIHJlZ2lvbnNcIlxuICAgICAgICA6a2V5PVwiYG5vdGNoLSR7aX1gXCJcbiAgICAgICAgY2xhc3M9XCJ0cGFkX19ub3RjaFwiXG4gICAgICAgIDpzdHlsZT1cInIucmVjdFwiXG4gICAgICAgIGRhdGEtdGlkPVwidHJhY2twYWQtbm90Y2hcIlxuICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiB2LWlmPVwiaSA9PT0gMFwiPm5vdGNoPC9zcGFuPlxuICAgICAgPC9zcGFuPlxuICAgIDwvdGVtcGxhdGU+XG4gICAgPHN2Z1xuICAgICAgdi1pZj1cImhlYWRBdCAmJiB0YXJnZXRBdFwiXG4gICAgICBjbGFzcz1cInRwYWRfX2xpbmVcIlxuICAgICAgdmlld0JveD1cIjAgMCAxMDAgMTAwXCJcbiAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW89XCJub25lXCJcbiAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICBkYXRhLXRpZD1cInRyYWNrcGFkLWxpbmVcIlxuICAgID5cbiAgICAgIDxsaW5lXG4gICAgICAgIDp4MT1cImhlYWRBdC54XCJcbiAgICAgICAgOnkxPVwiaGVhZEF0LnlcIlxuICAgICAgICA6eDI9XCJ0YXJnZXRBdC54XCJcbiAgICAgICAgOnkyPVwidGFyZ2V0QXQueVwiXG4gICAgICAgIHZlY3Rvci1lZmZlY3Q9XCJub24tc2NhbGluZy1zdHJva2VcIlxuICAgICAgLz5cbiAgICA8L3N2Zz5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cImhlYWRBdFwiXG4gICAgICBjbGFzcz1cInRwYWRfX2hlYWRcIlxuICAgICAgOnN0eWxlPVwieyBsZWZ0OiBgJHtoZWFkQXQueH0lYCwgdG9wOiBgJHtoZWFkQXQueX0lYCB9XCJcbiAgICAgIGRhdGEtdGlkPVwidHJhY2twYWQtaGVhZFwiXG4gICAgLz5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cInRhcmdldEF0XCJcbiAgICAgIGNsYXNzPVwidHBhZF9fdGFyZ2V0XCJcbiAgICAgIDpjbGFzcz1cInsgJ3RwYWRfX3RhcmdldC0tYmFkJzogdGFyZ2V0QmFkIH1cIlxuICAgICAgOnN0eWxlPVwieyBsZWZ0OiBgJHt0YXJnZXRBdC54fSVgLCB0b3A6IGAke3RhcmdldEF0Lnl9JWAgfVwiXG4gICAgICBkYXRhLXRpZD1cInRyYWNrcGFkLXRhcmdldFwiXG4gICAgLz5cbiAgICA8c2xvdCAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgUHJlZGljdGVkSGVhZE1peGluIGZyb20gJ0AvbWl4aW5zL3ByZWRpY3RlZC1oZWFkJ1xuaW1wb3J0IHsgYXNwZWN0T2YsIGJlZFRvUGl4ZWwsIG51ZGdlVGFyZ2V0LCBwaXhlbFRvQmVkLCByZWdpb25SZWN0LCB0eXBlIEJlZCwgdHlwZSBQb2ludCwgdHlwZSBSZWN0IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3RyYWNrcGFkJ1xuaW1wb3J0IHR5cGUgeyBOb0dvQ29uZmlnIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3NhZmUtbW92ZSdcbmltcG9ydCB7IFhfUklHSFQsIFlfQkFDSyB9IGZyb20gJ0Avc2VydmljZXMvbWFjaGluZS9vcmllbnRhdGlvbidcblxuLyoqIFBlcmNlbnRhZ2VzIG9mIHRoZSB0cmFja3BhZDogZXZlcnkgZHJhd2luZyBzY2FsZXMgd2l0aCBpdCwgZGVza3RvcCBvciBwaG9uZS4gKi9cbmNvbnN0IFBFUkNFTlQgPSB7IHdpZHRoOiAxMDAsIGhlaWdodDogMTAwIH1cbmNvbnN0IE1BWF9IRUlHSFQgPSA1NDBcbmNvbnN0IHBjdCA9IChyOiBSZWN0KSA9PiAoeyBsZWZ0OiBgJHtyLmxlZnR9JWAsIHRvcDogYCR7ci50b3B9JWAsIHdpZHRoOiBgJHtyLndpZHRofSVgLCBoZWlnaHQ6IGAke3IuaGVpZ2h0fSVgIH0pXG5cbi8qKiBIb3cgZmFyIGEgcG9pbnRlciBtb3ZlcyBiZWZvcmUgYSBwcmVzcyBiZWNvbWVzIGEgZHJhZywgcHguICovXG5jb25zdCBEUkFHX1NMT1AgPSA2XG5cbi8qKlxuICogVGhlIGJlZCwgdG8gc2NhbGUgYW5kIHNlZW4gZnJvbSBhYm92ZSBhcyB5b3UgZmFjZSB0aGUgcHJpbnRlciwgd2l0aCB0aGVcbiAqIGhlYWQgKGRyYXduIHdoZXJlIGl0IGlzIHByZWRpY3RlZCB0byBiZSwgbm90IHdoZXJlIGl0IHdhcyBsYXN0IHJlcG9ydGVkKSxcbiAqIHRoZSBwcmludGVyJ3Mgbm8tZ28gcmVnaW9ucywgdGhlIHRhcmdldCwgYW5kIGEgbGl2ZSBsaW5lIGZyb20gdGhlIGhlYWQgdG9cbiAqIHRoZSB0YXJnZXQuXG4gKlxuICogVGhpcyBjb21wb25lbnQgc2VuZHMgbm90aGluZy4gSXQgdGVsbHMgdGhlIE1vdmVtZW50IHRpbGUgd2hhdCB0aGUgcG9pbnRlclxuICogZG9lczogYSB0YXAgb3IgYW4gYXJyb3cga2V5IGBwaWNrYHMgYSB0YXJnZXQgKHNlbnQgb25seSBieSBNb3ZlIGhlcmUpOyBhXG4gKiBwcmVzcyB0aGF0IG1vdmVzIHBhc3QgRFJBR19TTE9QIGlzIGEgZHJhZzogYGRyYWctc3RhcnRgLCBgZHJhZ2AgYXMgaXRcbiAqIG1vdmVzLCB0aGVuIGBkcmFnLWVuZGAgb24gcmVsZWFzZSBvciBgZHJhZy1jYW5jZWxgIChwb2ludGVyIGNhbmNlbGxlZCxcbiAqIGNhcHR1cmUgb3IgZm9jdXMgbG9zdCkuIE1vdmVtZW50IHN0cmVhbXMgYSBkcmFnIHRocm91Z2ggZHJhZy1mb2xsb3cuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sVHJhY2twYWQgZXh0ZW5kcyBNaXhpbnMoUHJlZGljdGVkSGVhZE1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBiZWQhOiBCZWRcbiAgLyoqIERyYXcgdGhlIGhlYWQgKGZhbHNlIHdoaWxlIGl0cyBwb3NpdGlvbiBpc24ndCBrbm93bjogbm90IGhvbWVkKS4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IHNob3dIZWFkITogYm9vbGVhblxuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgZGVmYXVsdDogbnVsbCB9KSByZWFkb25seSB0YXJnZXQhOiBQb2ludCB8IG51bGxcbiAgQFByb3AoeyBkZWZhdWx0OiBudWxsIH0pIHJlYWRvbmx5IG5vR28hOiBOb0dvQ29uZmlnIHwgbnVsbCB8ICdpbnZhbGlkJ1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgZGlzYWJsZWQhOiBib29sZWFuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSB0YXJnZXRCYWQhOiBib29sZWFuXG4gIC8qKiBUaGUgT3ZlcnZpZXcncyBUcmFja3BhZDogbGlmdGluZyB0aGUgcG9pbnRlciBzZW5kcyB0aGUgb25lIG1vdmUsIHNvIHRoZXJlIGlzIG5vIE1vdmUgaGVyZSB0byBwcmVzcy4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IG9uUmVsZWFzZSE6IGJvb2xlYW5cbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDEwIH0pIHJlYWRvbmx5IHN0ZXAhOiBudW1iZXJcblxuICAvKiogVGhlIHRhbGxlc3QgdGhlIGJlZCBpcyBkcmF3biwgcHguIFdpZHRoIGlzIGNhcHBlZCBmcm9tIGl0LCBzbyB0aGUgYmVkIHN0YXlzIHRvIHNjYWxlLiAqL1xuICByZWFkb25seSBNQVhfSEVJR0hUID0gTUFYX0hFSUdIVFxuICBwcml2YXRlIHBvaW50ZXI6IG51bWJlciB8IG51bGwgPSBudWxsXG4gIHByaXZhdGUgZG93bkF0OiB7IHg6IG51bWJlciwgeTogbnVtYmVyIH0gfCBudWxsID0gbnVsbFxuICBkcmFnZ2luZyA9IGZhbHNlXG5cbiAgZ2V0IGFzcGVjdCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKGFzcGVjdE9mKHRoaXMuYmVkKSlcbiAgfVxuXG4gIGdldCBsYWJlbCAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5vblJlbGVhc2UpIHJldHVybiAnVGhlIGJlZCwgdG8gc2NhbGUsIHNlZW4gZnJvbSBhYm92ZS4gVGFwIG9yIGRyYWcgdG8gcGljayB3aGVyZSB0aGUgaGVhZCBzaG91bGQgZ287IGxpZnRpbmcgdGhlIHBvaW50ZXIsIG9yIEVudGVyLCBtb3ZlcyBpdCB0aGVyZSBvbmNlLiBBcnJvdyBrZXlzIG1vdmUgdGhlIHBpY2suJ1xuICAgIHJldHVybiAnVGhlIGJlZCwgdG8gc2NhbGUsIHNlZW4gZnJvbSBhYm92ZS4gVGFwIHRvIHBpY2sgd2hlcmUgdGhlIGhlYWQgc2hvdWxkIGdvLCB0aGVuIHByZXNzIE1vdmUgaGVyZTsgb3IgZHJhZywgYW5kIHRoZSBoZWFkIGZvbGxvd3MuIEFycm93IGtleXMgbW92ZSB0aGUgcGljay4nXG4gIH1cblxuICBnZXQgcmVnaW9ucyAoKSB7XG4gICAgY29uc3Qgbm9HbyA9IHRoaXMubm9Hb1xuICAgIGlmICghbm9HbyB8fCBub0dvID09PSAnaW52YWxpZCcpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIG5vR28ucmVnaW9ucy5tYXAociA9PiAoeyByZWN0OiBwY3QocmVnaW9uUmVjdChyLCB0aGlzLmJlZCwgUEVSQ0VOVCkpIH0pKVxuICB9XG5cbiAgLyoqIFdoZXJlIHRoZSBoZWFkIGlzIGRyYXduOiBwcmVkaWN0ZWQgYmV0d2VlbiByZXBvcnRzIChzZXJ2aWNlcy9jb250cm9sL3Bvc2l0aW9uLXByZWRpY3QpLiAqL1xuICBnZXQgaGVhZCAoKTogUG9pbnQgfCBudWxsIHtcbiAgICBjb25zdCBwID0gdGhpcy5wcmVkaWN0ZWRIZWFkXG4gICAgcmV0dXJuIHRoaXMuc2hvd0hlYWQgJiYgcCA/IHsgeDogcFswXSwgeTogcFsxXSB9IDogbnVsbFxuICB9XG5cbiAgZ2V0IGhlYWRBdCAoKTogUG9pbnQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5oZWFkID8gYmVkVG9QaXhlbCh0aGlzLmhlYWQsIHRoaXMuYmVkLCBQRVJDRU5UKSA6IG51bGxcbiAgfVxuXG4gIGdldCB0YXJnZXRBdCAoKTogUG9pbnQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy50YXJnZXQgPyBiZWRUb1BpeGVsKHRoaXMudGFyZ2V0LCB0aGlzLmJlZCwgUEVSQ0VOVCkgOiBudWxsXG4gIH1cblxuICAvKiogVGhlIGJlZCBwb2ludCB1bmRlciBhIHBvaW50ZXIgZXZlbnQsIG9yIG51bGwuICovXG4gIHBvaW50QXQgKGNsaWVudFg6IG51bWJlciwgY2xpZW50WTogbnVtYmVyKTogUG9pbnQgfCBudWxsIHtcbiAgICBjb25zdCBlbCA9IHRoaXMuJHJlZnMucGFkIGFzIEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkXG4gICAgaWYgKCFlbCkgcmV0dXJuIG51bGxcbiAgICBjb25zdCByID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICByZXR1cm4gcGl4ZWxUb0JlZCh7IHg6IGNsaWVudFggLSByLmxlZnQsIHk6IGNsaWVudFkgLSByLnRvcCB9LCB0aGlzLmJlZCwgeyB3aWR0aDogci53aWR0aCwgaGVpZ2h0OiByLmhlaWdodCB9KVxuICB9XG5cbiAgcGljayAocDogUG9pbnQgfCBudWxsKSB7XG4gICAgaWYgKHAgJiYgIXRoaXMuZGlzYWJsZWQpIHRoaXMuJGVtaXQoJ3BpY2snLCBwKVxuICB9XG5cbiAgb25Eb3duIChlOiBQb2ludGVyRXZlbnQpIHtcbiAgICAvLyBPbmUgcG9pbnRlciBhdCBhIHRpbWU6IGEgc2Vjb25kIGZpbmdlciB3aGlsZSBvbmUgaXMgZG93biBkb2VzIG5vdGhpbmcuXG4gICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgdGhpcy5wb2ludGVyICE9PSBudWxsIHx8IChlLnBvaW50ZXJUeXBlID09PSAnbW91c2UnICYmIGUuYnV0dG9uICE9PSAwKSkgcmV0dXJuXG4gICAgdGhpcy5wb2ludGVyID0gZS5wb2ludGVySWRcbiAgICB0aGlzLmRvd25BdCA9IHsgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgfVxuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZVxuICAgIDsoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbCk/LnNldFBvaW50ZXJDYXB0dXJlPy4oZS5wb2ludGVySWQpXG4gICAgdGhpcy5waWNrKHRoaXMucG9pbnRBdChlLmNsaWVudFgsIGUuY2xpZW50WSkpXG4gIH1cblxuICAvKiogUGFzdCBEUkFHX1NMT1AgYSBwcmVzcyBpcyBhIGRyYWc6IHRoZSB0YXJnZXQgZm9sbG93cyB0aGUgcG9pbnRlciwgYW5kIE1vdmVtZW50IHN0cmVhbXMgaXQuICovXG4gIG9uRHJhZyAoZTogUG9pbnRlckV2ZW50KSB7XG4gICAgaWYgKHRoaXMucG9pbnRlciA9PT0gbnVsbCB8fCBlLnBvaW50ZXJJZCAhPT0gdGhpcy5wb2ludGVyIHx8IHRoaXMuZGlzYWJsZWQpIHJldHVyblxuICAgIGNvbnN0IHAgPSB0aGlzLnBvaW50QXQoZS5jbGllbnRYLCBlLmNsaWVudFkpXG4gICAgaWYgKCFwKSByZXR1cm5cbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgIGNvbnN0IGZyb20gPSB0aGlzLmRvd25BdFxuICAgICAgaWYgKGZyb20gJiYgTWF0aC5oeXBvdChlLmNsaWVudFggLSBmcm9tLngsIGUuY2xpZW50WSAtIGZyb20ueSkgPCBEUkFHX1NMT1ApIHJldHVyblxuICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWVcbiAgICAgIHRoaXMuJGVtaXQoJ2RyYWctc3RhcnQnLCBwKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuJGVtaXQoJ2RyYWcnLCBwKVxuICB9XG5cbiAgb25VcCAoZTogUG9pbnRlckV2ZW50KSB7XG4gICAgaWYgKGUucG9pbnRlcklkICE9PSB0aGlzLnBvaW50ZXIpIHJldHVyblxuICAgIHRoaXMucG9pbnRlciA9IG51bGxcbiAgICBjb25zdCB3YXMgPSB0aGlzLmRyYWdnaW5nXG4gICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlXG4gICAgaWYgKHdhcykgdGhpcy4kZW1pdCgnZHJhZy1lbmQnKVxuICAgIC8vIEV2ZXJ5IGxpZnQsIHRhcCBvciBkcmFnOiB0aGUgT3ZlcnZpZXcncyBUcmFja3BhZCBzZW5kcyBpdHMgb25lIG1vdmUgaGVyZS5cbiAgICB0aGlzLiRlbWl0KCdyZWxlYXNlJylcbiAgfVxuXG4gIC8qKiBUaGUgcG9pbnRlciB3YXMgdGFrZW4gYXdheSAoYSBzeXN0ZW0gZ2VzdHVyZSwgYSBwYWxtLCBhIGNhbGwpOiBzdG9wIGF0IG9uY2UuICovXG4gIG9uQ2FuY2VsIChlOiBQb2ludGVyRXZlbnQpIHtcbiAgICBpZiAoZS5wb2ludGVySWQgIT09IHRoaXMucG9pbnRlcikgcmV0dXJuXG4gICAgdGhpcy5lbmRXaXRoQ2FuY2VsKClcbiAgfVxuXG4gIC8qKiBDYXB0dXJlIGxvc3Qgd2l0aG91dCBhIHBvaW50ZXItdXAgKHRoZSBlbGVtZW50IGhpZCwgYW5vdGhlciBjYXB0dXJlKS4gKi9cbiAgb25Mb3N0IChlOiBQb2ludGVyRXZlbnQpIHtcbiAgICBpZiAoZS5wb2ludGVySWQgPT09IHRoaXMucG9pbnRlcikgdGhpcy5lbmRXaXRoQ2FuY2VsKClcbiAgfVxuXG4gIG9uQmx1ciAoKSB7XG4gICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHRoaXMuZW5kV2l0aENhbmNlbCgpXG4gIH1cblxuICBlbmRXaXRoQ2FuY2VsICgpIHtcbiAgICBjb25zdCB3YXMgPSB0aGlzLmRyYWdnaW5nXG4gICAgdGhpcy5wb2ludGVyID0gbnVsbFxuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZVxuICAgIGlmICh3YXMpIHRoaXMuJGVtaXQoJ2RyYWctY2FuY2VsJylcbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5vbkJsdXIpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMub25CbHVyKVxuICAgIHRoaXMuZW5kV2l0aENhbmNlbCgpXG4gIH1cblxuICBvbktleSAoZTogS2V5Ym9hcmRFdmVudCkge1xuICAgIGNvbnN0IGtleXM6IFJlY29yZDxzdHJpbmcsIFtudW1iZXIsIG51bWJlcl0+ID0geyBBcnJvd1VwOiBbMCwgMV0sIEFycm93RG93bjogWzAsIC0xXSwgQXJyb3dMZWZ0OiBbLTEsIDBdLCBBcnJvd1JpZ2h0OiBbMSwgMF0gfVxuICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhdGhpcy5kaXNhYmxlZCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IHRoaXMuJGVtaXQoJ3JlbGVhc2UnKTsgcmV0dXJuIH1cbiAgICBjb25zdCBrID0ga2V5c1tlLmtleV1cbiAgICBpZiAoIWsgfHwgdGhpcy5kaXNhYmxlZCkgcmV0dXJuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZnJvbSA9IHRoaXMudGFyZ2V0ID8/IHRoaXMuaGVhZFxuICAgIGlmICghZnJvbSkgcmV0dXJuXG4gICAgY29uc3QgYnkgPSB0aGlzLnN0ZXAgKiAoZS5zaGlmdEtleSA/IDEwIDogMSlcbiAgICB0aGlzLiRlbWl0KCdwaWNrJywgbnVkZ2VUYXJnZXQoZnJvbSwga1swXSAqIGJ5LCBrWzFdICogYnksIHRoaXMuYmVkLCBZX0JBQ0ssIFhfUklHSFQpKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAudHBhZCB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICBiYWNrZ3JvdW5kOlxuICAgICAgbGluZWFyLWdyYWRpZW50KHZhcigtLW0zZC1ib3JkZXIpIDFweCwgdHJhbnNwYXJlbnQgMXB4KSAwIDAgLyAxMDAlIDEwJSxcbiAgICAgIGxpbmVhci1ncmFkaWVudCg5MGRlZywgdmFyKC0tbTNkLWJvcmRlcikgMXB4LCB0cmFuc3BhcmVudCAxcHgpIDAgMCAvIDEwJSAxMDAlLFxuICAgICAgdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGN1cnNvcjogY3Jvc3NoYWlyO1xuICAgIHRvdWNoLWFjdGlvbjogbm9uZTtcbiAgICB1c2VyLXNlbGVjdDogbm9uZTtcblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMnB4IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qIERpc2FibGVkIChhIHByaW50IG9yIGhvbWluZyBpcyBtb3ZpbmcgdGhlIHByaW50ZXIsIG9yIGl0IGlzIG5vdCBob21lZCk6IGdyZXllZCBvdXQsIHN0aWxsIHRoZXJlLiAqL1xuICAudHBhZC0tb2ZmIHtcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XG4gICAgb3BhY2l0eTogMC40NTtcbiAgICBmaWx0ZXI6IGdyYXlzY2FsZSgxKTtcbiAgfVxuXG4gIC50cGFkX193YXRlcm1hcmsge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDUwJTtcbiAgICBsZWZ0OiA1MCU7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtZGlzcGxheSwgc2Fucy1zZXJpZik7XG4gICAgZm9udC1zaXplOiBjbGFtcCgxNHB4LCAzdncsIDI2cHgpO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjI0ZW07XG4gICAgb3BhY2l0eTogMC4wNjtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLnRwYWRfX25vdGNoIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGJhY2tncm91bmQ6IHJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoMTM1ZGVnLCBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMzAlLCB0cmFuc3BhcmVudCkgMCA2cHgsIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtZGFuZ2VyKSAxMiUsIHRyYW5zcGFyZW50KSA2cHggMTJweCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC50cGFkX19saW5lIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaW5zZXQ6IDA7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIG92ZXJmbG93OiB2aXNpYmxlO1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuXG4gICAgbGluZSB7XG4gICAgICBzdHJva2U6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtYWNjZW50KSA3MCUsIHRyYW5zcGFyZW50KTtcbiAgICAgIHN0cm9rZS13aWR0aDogMjtcbiAgICAgIHN0cm9rZS1kYXNoYXJyYXk6IDUgNDtcbiAgICB9XG4gIH1cblxuICAudHBhZF9faGVhZCxcbiAgLnRwYWRfX3RhcmdldCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuXG4gIC50cGFkX19oZWFkIHtcbiAgICB3aWR0aDogMjJweDtcbiAgICBoZWlnaHQ6IDIycHg7XG4gICAgbWFyZ2luOiAtMTFweCAwIDAgLTExcHg7XG4gICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICBib3gtc2hhZG93OiAwIDAgMCA2cHggcmdiKDI1NSAyNTUgMjU1IC8gMTIlKSwgMCAycHggNnB4IHJnYigwIDAgMCAvIDUwJSk7XG4gIH1cblxuICAudHBhZF9fdGFyZ2V0IHtcbiAgICB3aWR0aDogMjZweDtcbiAgICBoZWlnaHQ6IDI2cHg7XG4gICAgbWFyZ2luOiAtMTNweCAwIDAgLTEzcHg7XG4gICAgYm9yZGVyOiAycHggc29saWQgdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgNHB4IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtYWNjZW50KSAyMCUsIHRyYW5zcGFyZW50KTtcblxuICAgICY6OmFmdGVyIHtcbiAgICAgIGNvbnRlbnQ6ICcnO1xuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgdG9wOiA1MCU7XG4gICAgICBsZWZ0OiA1MCU7XG4gICAgICB3aWR0aDogNHB4O1xuICAgICAgaGVpZ2h0OiA0cHg7XG4gICAgICBtYXJnaW46IC0ycHggMCAwIC0ycHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICB9XG4gIH1cblxuICAudHBhZF9fdGFyZ2V0LS1iYWQge1xuICAgIGJvcmRlci1jb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgNHB4IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtZGFuZ2VyKSAyMCUsIHRyYW5zcGFyZW50KTtcblxuICAgICY6OmFmdGVyIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWRhbmdlcik7IH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbFRyYWNrcGFkLnZ1ZSJ9