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
import NumberField from "/src/components/control/NumberField.vue";
let TuningValue = class extends Vue {
  value;
  label;
  unit;
  min;
  max;
  decimals;
  disabled;
  reason;
  context;
  previous = null;
  reset() {
    this.previous = null;
  }
  disable(value) {
    if (value) this.reset();
  }
  change(value) {
    if (this.disabled || !Number.isFinite(value) || value < this.min || value > this.max) return;
    if (this.previous === null) this.previous = this.value;
    this.$emit("change", value);
  }
  putBack() {
    const value = this.previous;
    if (value === null || this.disabled || value < this.min || value > this.max) return;
    this.$emit("change", value);
    this.previous = null;
  }
};
__decorateClass([
  Prop({ type: Number, default: null })
], TuningValue.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, required: true })
], TuningValue.prototype, "label", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], TuningValue.prototype, "unit", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], TuningValue.prototype, "min", 2);
__decorateClass([
  Prop({ type: Number, default: Infinity })
], TuningValue.prototype, "max", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], TuningValue.prototype, "decimals", 2);
__decorateClass([
  Prop({ type: Boolean })
], TuningValue.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], TuningValue.prototype, "reason", 2);
__decorateClass([
  Prop({ type: String, required: true })
], TuningValue.prototype, "context", 2);
__decorateClass([
  Watch("context")
], TuningValue.prototype, "reset", 1);
__decorateClass([
  Watch("disabled")
], TuningValue.prototype, "disable", 1);
TuningValue = __decorateClass([
  Component({ components: { NumberField } })
], TuningValue);
const _sfc_main = TuningValue;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(_vm.label) + " "), _vm.previous !== null ? _c("span", { staticClass: "crow__sub" }, [_vm._v(" \xB7 was " + _vm._s(_vm.previous) + " " + _vm._s(_vm.unit))]) : _vm._e(), _vm.previous !== null ? _c("button", { staticClass: "tuning-value__back", attrs: { "type": "button", "data-tid": `put-back-${_vm.label}`, "disabled": _vm.disabled }, on: { "click": _vm.putBack } }, [_vm._v("Put back")]) : _vm._e()]), _c("number-field", { key: _vm.context, attrs: { "value": _vm.value, "unit": _vm.unit, "min": _vm.min, "max": _vm.max, "decimals": _vm.decimals, "label": _vm.label, "disabled": _vm.disabled }, on: { "change": _vm.change } }), _vm.reason ? _c("span", { staticClass: "crow__sub tuning-value__reason" }, [_vm._v(_vm._s(_vm.reason))]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/TuningValue.vue?vue&type=style&index=0&scoped=45011037&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "45011037",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/TuningValue.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW1DQTtBQUNBO0FBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBN0JBO0FBQUE7QUFBQSxHQURBLFlBQ0E7QUFDQTtBQUFBO0FBQUEsR0FGQSxZQUVBO0FBQ0E7QUFBQTtBQUFBLEdBSEEsWUFHQTtBQUNBO0FBQUE7QUFBQSxHQUpBLFlBSUE7QUFDQTtBQUFBO0FBQUEsR0FMQSxZQUtBO0FBQ0E7QUFBQTtBQUFBLEdBTkEsWUFNQTtBQUNBO0FBQUE7QUFBQSxHQVBBLFlBT0E7QUFDQTtBQUFBO0FBQUEsR0FSQSxZQVFBO0FBQ0E7QUFBQTtBQUFBLEdBVEEsWUFTQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBWkEsWUFhQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBZkEsWUFnQkE7QUFoQkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVHVuaW5nVmFsdWUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdiBjbGFzcz1cImNyb3dcIj5cbiAgICA8c3BhbiBjbGFzcz1cImNyb3dfX25hbWVcIj57eyBsYWJlbCB9fVxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cInByZXZpb3VzICE9PSBudWxsXCJcbiAgICAgICAgY2xhc3M9XCJjcm93X19zdWJcIlxuICAgICAgPiDCtyB3YXMge3sgcHJldmlvdXMgfX0ge3sgdW5pdCB9fTwvc3Bhbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cInByZXZpb3VzICE9PSBudWxsXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwidHVuaW5nLXZhbHVlX19iYWNrXCJcbiAgICAgICAgOmRhdGEtdGlkPVwiYHB1dC1iYWNrLSR7bGFiZWx9YFwiXG4gICAgICAgIDpkaXNhYmxlZD1cImRpc2FibGVkXCJcbiAgICAgICAgQGNsaWNrPVwicHV0QmFja1wiXG4gICAgICA+UHV0IGJhY2s8L2J1dHRvbj5cbiAgICA8L3NwYW4+XG4gICAgPG51bWJlci1maWVsZFxuICAgICAgOmtleT1cImNvbnRleHRcIlxuICAgICAgOnZhbHVlPVwidmFsdWVcIlxuICAgICAgOnVuaXQ9XCJ1bml0XCJcbiAgICAgIDptaW49XCJtaW5cIlxuICAgICAgOm1heD1cIm1heFwiXG4gICAgICA6ZGVjaW1hbHM9XCJkZWNpbWFsc1wiXG4gICAgICA6bGFiZWw9XCJsYWJlbFwiXG4gICAgICA6ZGlzYWJsZWQ9XCJkaXNhYmxlZFwiXG4gICAgICBAY2hhbmdlPVwiY2hhbmdlXCJcbiAgICAvPlxuICAgIDxzcGFuXG4gICAgICB2LWlmPVwicmVhc29uXCJcbiAgICAgIGNsYXNzPVwiY3Jvd19fc3ViIHR1bmluZy12YWx1ZV9fcmVhc29uXCJcbiAgICA+e3sgcmVhc29uIH19PC9zcGFuPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE51bWJlckZpZWxkIGZyb20gJy4vTnVtYmVyRmllbGQudnVlJ1xuXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBOdW1iZXJGaWVsZCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUdW5pbmdWYWx1ZSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiBudWxsIH0pIHJlYWRvbmx5IHZhbHVlITogbnVtYmVyIHwgbnVsbFxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgbGFiZWwhOiBzdHJpbmdcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pIHJlYWRvbmx5IHVuaXQhOiBzdHJpbmdcbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSkgcmVhZG9ubHkgbWluITogbnVtYmVyXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiBJbmZpbml0eSB9KSByZWFkb25seSBtYXghOiBudW1iZXJcbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSkgcmVhZG9ubHkgZGVjaW1hbHMhOiBudW1iZXJcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IGRpc2FibGVkPzogYm9vbGVhblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSkgcmVhZG9ubHkgcmVhc29uITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBjb250ZXh0ITogc3RyaW5nXG4gIHByZXZpb3VzOiBudW1iZXIgfCBudWxsID0gbnVsbFxuXG4gIEBXYXRjaCgnY29udGV4dCcpXG4gIHJlc2V0ICgpIHsgdGhpcy5wcmV2aW91cyA9IG51bGwgfVxuXG4gIEBXYXRjaCgnZGlzYWJsZWQnKVxuICBkaXNhYmxlICh2YWx1ZTogYm9vbGVhbikgeyBpZiAodmFsdWUpIHRoaXMucmVzZXQoKSB9XG5cbiAgY2hhbmdlICh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgfHwgdmFsdWUgPCB0aGlzLm1pbiB8fCB2YWx1ZSA+IHRoaXMubWF4KSByZXR1cm5cbiAgICBpZiAodGhpcy5wcmV2aW91cyA9PT0gbnVsbCkgdGhpcy5wcmV2aW91cyA9IHRoaXMudmFsdWVcbiAgICB0aGlzLiRlbWl0KCdjaGFuZ2UnLCB2YWx1ZSlcbiAgfVxuXG4gIHB1dEJhY2sgKCkge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5wcmV2aW91c1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB0aGlzLmRpc2FibGVkIHx8IHZhbHVlIDwgdGhpcy5taW4gfHwgdmFsdWUgPiB0aGlzLm1heCkgcmV0dXJuXG4gICAgdGhpcy4kZW1pdCgnY2hhbmdlJywgdmFsdWUpXG4gICAgdGhpcy5wcmV2aW91cyA9IG51bGxcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBzY29wZWQ+XG4udHVuaW5nLXZhbHVlX19iYWNrIHsgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpOyBmb250LXNpemU6IDEycHg7IG1hcmdpbi1sZWZ0OiA4cHg7IH1cbi50dW5pbmctdmFsdWVfX3JlYXNvbiB7IGZsZXgtYmFzaXM6IDEwMCU7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb250cm9sL1R1bmluZ1ZhbHVlLnZ1ZSJ9