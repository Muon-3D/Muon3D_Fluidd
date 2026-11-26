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
let ControlPositionReadout = class extends Mixins(PredictedHeadMixin) {
  axes;
  stack;
  get shown() {
    const p = this.predictedHead;
    return this.axes.split("").map((axis) => {
      const i = "XYZ".indexOf(axis);
      const v = p ? p[i] : Number.NaN;
      return { axis, text: Number.isFinite(v) ? v.toFixed(axis === "Z" ? 2 : 1) : "\u2013" };
    });
  }
};
__decorateClass([
  Prop({ type: String, default: "XYZ" })
], ControlPositionReadout.prototype, "axes", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlPositionReadout.prototype, "stack", 2);
ControlPositionReadout = __decorateClass([
  Component({})
], ControlPositionReadout);
const _sfc_main = ControlPositionReadout;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "posread", class: { "posread--stack": _vm.stack }, attrs: { "data-tid": "position-readout" } }, _vm._l(_vm.shown, function(a) {
    return _c("span", { key: a.axis, staticClass: "posread__cell", attrs: { "data-tid": `pos-${a.axis.toLowerCase()}` } }, [_c("small", [_vm._v(_vm._s(a.axis))]), _vm._v(_vm._s(a.text) + " ")]);
  }), 0);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlPositionReadout.vue?vue&type=style&index=0&scoped=ca42faa0&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ca42faa0",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlPositionReadout.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtCQTtBQUNBO0FBUUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVpBO0FBQUE7QUFBQSxHQUZBLHVCQUVBO0FBRUE7QUFBQTtBQUFBLEdBSkEsdUJBSUE7QUFKQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb250cm9sUG9zaXRpb25SZWFkb3V0LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cInBvc3JlYWRcIlxuICAgIDpjbGFzcz1cInsgJ3Bvc3JlYWQtLXN0YWNrJzogc3RhY2sgfVwiXG4gICAgZGF0YS10aWQ9XCJwb3NpdGlvbi1yZWFkb3V0XCJcbiAgPlxuICAgIDxzcGFuXG4gICAgICB2LWZvcj1cImEgaW4gc2hvd25cIlxuICAgICAgOmtleT1cImEuYXhpc1wiXG4gICAgICBjbGFzcz1cInBvc3JlYWRfX2NlbGxcIlxuICAgICAgOmRhdGEtdGlkPVwiYHBvcy0ke2EuYXhpcy50b0xvd2VyQ2FzZSgpfWBcIlxuICAgID5cbiAgICAgIDxzbWFsbD57eyBhLmF4aXMgfX08L3NtYWxsPnt7IGEudGV4dCB9fVxuICAgIDwvc3Bhbj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFByZWRpY3RlZEhlYWRNaXhpbiBmcm9tICdAL21peGlucy9wcmVkaWN0ZWQtaGVhZCdcblxuLyoqXG4gKiBUaGUgaGVhZCdzIHBvc2l0aW9uIGFzIHRleHQsIHByZWRpY3RlZCBiZXR3ZWVuIHN0YXR1cyB1cGRhdGVzIHNvIGl0IHJ1bnNcbiAqIHNtb290aGx5IHdoaWxlIHRoZSBoZWFkIG1vdmVzIChtaXhpbnMvcHJlZGljdGVkLWhlYWQpLiBPbmx5IHRoaXMgc21hbGxcbiAqIGNvbXBvbmVudCByZS1yZW5kZXJzIGVhY2ggZnJhbWUuIE5vdCBhIGNvbnRyb2w6IGl0IGNhbid0IGJlIHByZXNzZWQuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sUG9zaXRpb25SZWFkb3V0IGV4dGVuZHMgTWl4aW5zKFByZWRpY3RlZEhlYWRNaXhpbikge1xuICAvKiogV2hpY2ggYXhlcywgaW4gb3JkZXI6ICdYWVonIG9yICdaJy4gKi9cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdYWVonIH0pIHJlYWRvbmx5IGF4ZXMhOiBzdHJpbmdcbiAgLyoqIExhYmVsIGFib3ZlIHRoZSBudW1iZXIgKHRoZSBaIHJlYWRvdXQgYmV0d2VlbiB0aGUgWiBrZXlzKS4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IHN0YWNrITogYm9vbGVhblxuXG4gIGdldCBzaG93biAoKTogQXJyYXk8eyBheGlzOiBzdHJpbmcsIHRleHQ6IHN0cmluZyB9PiB7XG4gICAgY29uc3QgcCA9IHRoaXMucHJlZGljdGVkSGVhZFxuICAgIHJldHVybiB0aGlzLmF4ZXMuc3BsaXQoJycpLm1hcChheGlzID0+IHtcbiAgICAgIGNvbnN0IGkgPSAnWFlaJy5pbmRleE9mKGF4aXMpXG4gICAgICBjb25zdCB2ID0gcCA/IHBbaV0gOiBOdW1iZXIuTmFOXG4gICAgICByZXR1cm4geyBheGlzLCB0ZXh0OiBOdW1iZXIuaXNGaW5pdGUodikgPyB2LnRvRml4ZWQoYXhpcyA9PT0gJ1onID8gMiA6IDEpIDogJ+KAkycgfVxuICAgIH0pXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5wb3NyZWFkIHtcbiAgICBkaXNwbGF5OiBjb250ZW50cztcbiAgfVxuXG4gIC5wb3NyZWFkX19jZWxsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDEgMSA3MHB4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIHBhZGRpbmc6IDdweCAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG5cbiAgICBzbWFsbCB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICBsZXR0ZXItc3BhY2luZzogMC4wOGVtO1xuICAgIH1cbiAgfVxuXG4gIC5wb3NyZWFkLS1zdGFjayAucG9zcmVhZF9fY2VsbCB7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbFBvc2l0aW9uUmVhZG91dC52dWUifQ==