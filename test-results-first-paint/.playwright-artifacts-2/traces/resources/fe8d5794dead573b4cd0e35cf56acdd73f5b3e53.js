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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let RangeSlider = class extends Vue {
  value;
  min;
  max;
  step;
  label;
  valueTextFormatter;
  disabled;
  /** Where the thumb is while it is dragged; the value again once the printer answers. */
  dragged = null;
  get current() {
    return this.dragged ?? (Number.isFinite(this.value) ? this.value : this.min);
  }
  onValue() {
    this.dragged = null;
  }
  onInput(event) {
    this.dragged = Number(event.target.value);
  }
  onChange(event) {
    this.$emit("change", Number(event.target.value));
  }
  get fill() {
    return this.max > this.min ? (this.current - this.min) / (this.max - this.min) * 100 : 0;
  }
};
__decorateClass([
  Prop({ type: Number, default: 0 })
], RangeSlider.prototype, "value", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], RangeSlider.prototype, "min", 2);
__decorateClass([
  Prop({ type: Number, default: 100 })
], RangeSlider.prototype, "max", 2);
__decorateClass([
  Prop({ type: Number, default: 1 })
], RangeSlider.prototype, "step", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], RangeSlider.prototype, "label", 2);
__decorateClass([
  Prop({ type: Function, default: (value) => String(value) })
], RangeSlider.prototype, "valueTextFormatter", 2);
__decorateClass([
  Prop({ type: Boolean })
], RangeSlider.prototype, "disabled", 2);
__decorateClass([
  Watch("value")
], RangeSlider.prototype, "onValue", 1);
RangeSlider = __decorateClass([
  Component({})
], RangeSlider);
const _sfc_main = RangeSlider;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("input", { staticClass: "range", style: { "--fill": `${_vm.fill}%`, height: "24px" }, attrs: { "type": "range", "min": _vm.min, "max": _vm.max, "step": _vm.step, "disabled": _vm.disabled, "aria-label": _vm.label, "aria-valuetext": _vm.valueTextFormatter(_vm.current) }, domProps: { "value": _vm.current }, on: { "input": _vm.onInput, "change": _vm.onChange } });
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/RangeSlider.vue?vue&type=style&index=0&scoped=84026db6&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "84026db6",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/RangeSlider.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtCQTtBQUlBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEzQ0E7QUFBQSxFQURBO0FBQUEsR0FEQSxZQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxZQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxZQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxZQVdBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FiQSxZQWNBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FoQkEsWUFpQkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQW5CQSxZQW9CQTtBQVVBO0FBQUEsRUFEQTtBQUFBLEdBN0JBLFlBOEJBO0FBOUJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlJhbmdlU2xpZGVyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxpbnB1dFxuICAgIHR5cGU9XCJyYW5nZVwiXG4gICAgY2xhc3M9XCJyYW5nZVwiXG4gICAgOm1pbj1cIm1pblwiXG4gICAgOm1heD1cIm1heFwiXG4gICAgOnN0ZXA9XCJzdGVwXCJcbiAgICA6dmFsdWU9XCJjdXJyZW50XCJcbiAgICA6ZGlzYWJsZWQ9XCJkaXNhYmxlZFwiXG4gICAgOmFyaWEtbGFiZWw9XCJsYWJlbFwiXG4gICAgOmFyaWEtdmFsdWV0ZXh0PVwidmFsdWVUZXh0Rm9ybWF0dGVyKGN1cnJlbnQpXCJcbiAgICA6c3R5bGU9XCJ7ICctLWZpbGwnOiBgJHtmaWxsfSVgLCBoZWlnaHQ6ICcyNHB4JyB9XCJcbiAgICBAaW5wdXQ9XCJvbklucHV0XCJcbiAgICBAY2hhbmdlPVwib25DaGFuZ2VcIlxuICA+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcblxuLyoqIEEgc2xpZGVyIHRoYXQgc2VuZHMgaXRzIHZhbHVlIG9uY2UsIHdoZW4gbGV0IGdvLiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJhbmdlU2xpZGVyIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSlcbiAgcmVhZG9ubHkgdmFsdWUhOiBudW1iZXJcblxuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMCB9KVxuICByZWFkb25seSBtaW4hOiBudW1iZXJcblxuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMTAwIH0pXG4gIHJlYWRvbmx5IG1heCE6IG51bWJlclxuXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAxIH0pXG4gIHJlYWRvbmx5IHN0ZXAhOiBudW1iZXJcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgbGFiZWwhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IEZ1bmN0aW9uLCBkZWZhdWx0OiAodmFsdWU6IG51bWJlcikgPT4gU3RyaW5nKHZhbHVlKSB9KVxuICByZWFkb25seSB2YWx1ZVRleHRGb3JtYXR0ZXIhOiAodmFsdWU6IG51bWJlcikgPT4gc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGRpc2FibGVkPzogYm9vbGVhblxuXG4gIC8qKiBXaGVyZSB0aGUgdGh1bWIgaXMgd2hpbGUgaXQgaXMgZHJhZ2dlZDsgdGhlIHZhbHVlIGFnYWluIG9uY2UgdGhlIHByaW50ZXIgYW5zd2Vycy4gKi9cbiAgZHJhZ2dlZDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuICBnZXQgY3VycmVudCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5kcmFnZ2VkID8/IChOdW1iZXIuaXNGaW5pdGUodGhpcy52YWx1ZSkgPyB0aGlzLnZhbHVlIDogdGhpcy5taW4pXG4gIH1cblxuICBAV2F0Y2goJ3ZhbHVlJylcbiAgb25WYWx1ZSAoKSB7XG4gICAgdGhpcy5kcmFnZ2VkID0gbnVsbFxuICB9XG5cbiAgb25JbnB1dCAoZXZlbnQ6IEV2ZW50KSB7XG4gICAgdGhpcy5kcmFnZ2VkID0gTnVtYmVyKChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUpXG4gIH1cblxuICBvbkNoYW5nZSAoZXZlbnQ6IEV2ZW50KSB7XG4gICAgdGhpcy4kZW1pdCgnY2hhbmdlJywgTnVtYmVyKChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUpKVxuICB9XG5cbiAgZ2V0IGZpbGwgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubWF4ID4gdGhpcy5taW4gPyAodGhpcy5jdXJyZW50IC0gdGhpcy5taW4pIC8gKHRoaXMubWF4IC0gdGhpcy5taW4pICogMTAwIDogMFxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAvLyBUaGUgaW5wdXQgaXMgdGhlIHRyYWNrLCBmaWxsZWQgdXAgdG8gdGhlIHZhbHVlOyB0aGUgdGh1bWIgc2l0cyBvbiBpdC5cbiAgLnJhbmdlIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDI0cHg7XG4gICAgbWFyZ2luOiAycHggMDtcbiAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCB2YXIoLS1tM2QtYWNjZW50KSB2YXIoLS1maWxsKSwgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpIHZhcigtLWZpbGwpKTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7XG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgICBiYWNrZ3JvdW5kLXNpemU6IDEwMCUgNHB4O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICBhcHBlYXJhbmNlOiBub25lO1xuXG4gICAgJjpkaXNhYmxlZCB7XG4gICAgICBvcGFjaXR5OiAwLjQ1O1xuICAgICAgY3Vyc29yOiBkZWZhdWx0O1xuICAgIH1cblxuICAgICY6Oi13ZWJraXQtc2xpZGVyLXRodW1iIHtcbiAgICAgIHdpZHRoOiAyNHB4O1xuICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgYm9yZGVyOiAwO1xuICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICAgIGJveC1zaGFkb3c6IDAgMXB4IDRweCByZ2IoMCAwIDAgLyA1MCUpO1xuICAgICAgYXBwZWFyYW5jZTogbm9uZTtcbiAgICB9XG5cbiAgICAmOjotbW96LXJhbmdlLXRodW1iIHtcbiAgICAgIHdpZHRoOiAyNHB4O1xuICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgYm9yZGVyOiAwO1xuICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICAgIGJveC1zaGFkb3c6IDAgMXB4IDRweCByZ2IoMCAwIDAgLyA1MCUpO1xuICAgIH1cblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBvdXRsaW5lOiBub25lO1xuXG4gICAgICAmOjotd2Via2l0LXNsaWRlci10aHVtYiB7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDRweCB2YXIoLS1tM2QtYWNjZW50LXNvZnQpLCAwIDFweCA0cHggcmdiKDAgMCAwIC8gNTAlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb250cm9sL1JhbmdlU2xpZGVyLnZ1ZSJ9