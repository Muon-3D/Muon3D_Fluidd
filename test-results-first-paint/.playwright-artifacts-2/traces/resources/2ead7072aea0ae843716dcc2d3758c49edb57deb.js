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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let nextErrorId = 0;
let NumberField = class extends Vue {
  value;
  unit;
  label;
  min;
  max;
  decimals;
  disabled;
  accent;
  editing = false;
  draft = null;
  invalid = false;
  errorId = `number-error-${++nextErrorId}`;
  get rangeHint() {
    if (Number.isFinite(this.min) && Number.isFinite(this.max)) return ` from ${this.min} to ${this.max}${this.unit ? ` ${this.unit}` : ""}`;
    if (Number.isFinite(this.min)) return ` of at least ${this.min}${this.unit ? ` ${this.unit}` : ""}`;
    if (Number.isFinite(this.max)) return ` no greater than ${this.max}${this.unit ? ` ${this.unit}` : ""}`;
    return "";
  }
  get shown() {
    return this.value === null || !Number.isFinite(this.value) ? "" : this.value.toFixed(this.decimals);
  }
  get text() {
    return this.draft !== null ? this.draft : this.shown;
  }
  onInput(event) {
    this.draft = event.target.value;
    this.invalid = false;
  }
  commit() {
    const draft = this.draft;
    if (this.disabled) {
      this.cancel();
      return;
    }
    if (draft === null) return;
    const text = draft.trim().replace(",", ".");
    const n = Number(text);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(n) || !(n >= this.min && n <= this.max)) {
      this.invalid = true;
      return;
    }
    this.editing = false;
    this.draft = null;
    this.invalid = false;
    if (n !== this.value) this.$emit("change", n);
  }
  cancel() {
    this.draft = null;
    this.invalid = false;
    this.editing = false;
    this.$refs.input.blur();
  }
};
__decorateClass([
  Prop({ type: Number, default: null })
], NumberField.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], NumberField.prototype, "unit", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], NumberField.prototype, "label", 2);
__decorateClass([
  Prop({ type: Number, default: -Infinity })
], NumberField.prototype, "min", 2);
__decorateClass([
  Prop({ type: Number, default: Infinity })
], NumberField.prototype, "max", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], NumberField.prototype, "decimals", 2);
__decorateClass([
  Prop({ type: Boolean })
], NumberField.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: Boolean })
], NumberField.prototype, "accent", 2);
NumberField = __decorateClass([
  Component({})
], NumberField);
const _sfc_main = NumberField;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("label", { staticClass: "numfield", class: { "numfield--disabled": _vm.disabled, "numfield--accent": _vm.accent } }, [_c("input", { ref: "input", attrs: { "type": "text", "inputmode": "decimal", "disabled": _vm.disabled, "aria-label": _vm.label, "aria-invalid": _vm.invalid ? "true" : void 0, "aria-describedby": _vm.invalid ? _vm.errorId : void 0 }, domProps: { "value": _vm.text }, on: { "focus": function($event) {
    _vm.editing = true;
  }, "input": _vm.onInput, "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    $event.preventDefault();
    return _vm.commit.apply(null, arguments);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    return _vm.cancel.apply(null, arguments);
  }], "blur": _vm.commit } }), _vm.unit ? _c("span", { staticClass: "numfield__unit" }, [_vm._v(_vm._s(_vm.unit))]) : _vm._e(), _vm.invalid ? _c("span", { staticClass: "numfield__error", attrs: { "id": _vm.errorId, "role": "status" } }, [_vm._v("Enter a number" + _vm._s(_vm.rangeHint) + ".")]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/NumberField.vue?vue&type=style&index=0&scoped=3508828b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3508828b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/NumberField.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtDQTtBQUVBO0FBUUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTFFQTtBQUFBLEVBREE7QUFBQSxHQURBLFlBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLFlBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLFlBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLFlBV0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWJBLFlBY0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQWpCQSxZQWtCQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBcEJBLFlBcUJBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0F2QkEsWUF3QkE7QUF4QkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTnVtYmVyRmllbGQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGxhYmVsXG4gICAgY2xhc3M9XCJudW1maWVsZFwiXG4gICAgOmNsYXNzPVwieyAnbnVtZmllbGQtLWRpc2FibGVkJzogZGlzYWJsZWQsICdudW1maWVsZC0tYWNjZW50JzogYWNjZW50IH1cIlxuICA+XG4gICAgPGlucHV0XG4gICAgICByZWY9XCJpbnB1dFwiXG4gICAgICB0eXBlPVwidGV4dFwiXG4gICAgICBpbnB1dG1vZGU9XCJkZWNpbWFsXCJcbiAgICAgIDp2YWx1ZT1cInRleHRcIlxuICAgICAgOmRpc2FibGVkPVwiZGlzYWJsZWRcIlxuICAgICAgOmFyaWEtbGFiZWw9XCJsYWJlbFwiXG4gICAgICA6YXJpYS1pbnZhbGlkPVwiaW52YWxpZCA/ICd0cnVlJyA6IHVuZGVmaW5lZFwiXG4gICAgICA6YXJpYS1kZXNjcmliZWRieT1cImludmFsaWQgPyBlcnJvcklkIDogdW5kZWZpbmVkXCJcbiAgICAgIEBmb2N1cz1cImVkaXRpbmcgPSB0cnVlXCJcbiAgICAgIEBpbnB1dD1cIm9uSW5wdXRcIlxuICAgICAgQGtleWRvd24uZW50ZXIucHJldmVudD1cImNvbW1pdFwiXG4gICAgICBAa2V5ZG93bi5lc2M9XCJjYW5jZWxcIlxuICAgICAgQGJsdXI9XCJjb21taXRcIlxuICAgID5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cInVuaXRcIlxuICAgICAgY2xhc3M9XCJudW1maWVsZF9fdW5pdFwiXG4gICAgPnt7IHVuaXQgfX08L3NwYW4+XG4gICAgPHNwYW5cbiAgICAgIHYtaWY9XCJpbnZhbGlkXCJcbiAgICAgIDppZD1cImVycm9ySWRcIlxuICAgICAgY2xhc3M9XCJudW1maWVsZF9fZXJyb3JcIlxuICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgPkVudGVyIGEgbnVtYmVye3sgcmFuZ2VIaW50IH19Ljwvc3Bhbj5cbiAgPC9sYWJlbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5cbmxldCBuZXh0RXJyb3JJZCA9IDBcblxuLyoqXG4gKiBBbiBleGFjdCB2YWx1ZTogaXQgc2hvd3MgdGhlIGxpdmUgdmFsdWUgdW50aWwgeW91IHR5cGUsXG4gKiBhbmQgc2VuZHMgb25seSB3aGVuIHlvdSBwcmVzcyBFbnRlciBvciBsZWF2ZSBpdCwgYW5kIG9ubHkgYSBudW1iZXIgaW5cbiAqIHJhbmdlLiBFc2MgcHV0cyB0aGUgbGl2ZSB2YWx1ZSBiYWNrLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTnVtYmVyRmllbGQgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSB2YWx1ZSE6IG51bWJlciB8IG51bGxcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgdW5pdCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBsYWJlbCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAtSW5maW5pdHkgfSlcbiAgcmVhZG9ubHkgbWluITogbnVtYmVyXG5cbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IEluZmluaXR5IH0pXG4gIHJlYWRvbmx5IG1heCE6IG51bWJlclxuXG4gIC8qKiBEaWdpdHMgYWZ0ZXIgdGhlIHBvaW50IHNob3duLiAqL1xuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMCB9KVxuICByZWFkb25seSBkZWNpbWFscyE6IG51bWJlclxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBkaXNhYmxlZD86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgYWNjZW50PzogYm9vbGVhblxuXG4gIGVkaXRpbmcgPSBmYWxzZVxuICBkcmFmdDogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgaW52YWxpZCA9IGZhbHNlXG4gIGVycm9ySWQgPSBgbnVtYmVyLWVycm9yLSR7KytuZXh0RXJyb3JJZH1gXG5cbiAgZ2V0IHJhbmdlSGludCAoKTogc3RyaW5nIHtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHRoaXMubWluKSAmJiBOdW1iZXIuaXNGaW5pdGUodGhpcy5tYXgpKSByZXR1cm4gYCBmcm9tICR7dGhpcy5taW59IHRvICR7dGhpcy5tYXh9JHt0aGlzLnVuaXQgPyBgICR7dGhpcy51bml0fWAgOiAnJ31gXG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZSh0aGlzLm1pbikpIHJldHVybiBgIG9mIGF0IGxlYXN0ICR7dGhpcy5taW59JHt0aGlzLnVuaXQgPyBgICR7dGhpcy51bml0fWAgOiAnJ31gXG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZSh0aGlzLm1heCkpIHJldHVybiBgIG5vIGdyZWF0ZXIgdGhhbiAke3RoaXMubWF4fSR7dGhpcy51bml0ID8gYCAke3RoaXMudW5pdH1gIDogJyd9YFxuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgZ2V0IHNob3duICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnZhbHVlID09PSBudWxsIHx8ICFOdW1iZXIuaXNGaW5pdGUodGhpcy52YWx1ZSkgPyAnJyA6IHRoaXMudmFsdWUudG9GaXhlZCh0aGlzLmRlY2ltYWxzKVxuICB9XG5cbiAgZ2V0IHRleHQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZHJhZnQgIT09IG51bGwgPyB0aGlzLmRyYWZ0IDogdGhpcy5zaG93blxuICB9XG5cbiAgb25JbnB1dCAoZXZlbnQ6IEV2ZW50KSB7XG4gICAgdGhpcy5kcmFmdCA9IChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWVcbiAgICB0aGlzLmludmFsaWQgPSBmYWxzZVxuICB9XG5cbiAgY29tbWl0ICgpIHtcbiAgICBjb25zdCBkcmFmdCA9IHRoaXMuZHJhZnRcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5jYW5jZWwoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChkcmFmdCA9PT0gbnVsbCkgcmV0dXJuXG4gICAgY29uc3QgdGV4dCA9IGRyYWZ0LnRyaW0oKS5yZXBsYWNlKCcsJywgJy4nKVxuICAgIGNvbnN0IG4gPSBOdW1iZXIodGV4dClcbiAgICBpZiAoIS9eWystXT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKD86ZVsrLV0/XFxkKyk/JC9pLnRlc3QodGV4dCkgfHwgIU51bWJlci5pc0Zpbml0ZShuKSB8fCAhKG4gPj0gdGhpcy5taW4gJiYgbiA8PSB0aGlzLm1heCkpIHtcbiAgICAgIHRoaXMuaW52YWxpZCA9IHRydWVcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmVkaXRpbmcgPSBmYWxzZVxuICAgIHRoaXMuZHJhZnQgPSBudWxsXG4gICAgdGhpcy5pbnZhbGlkID0gZmFsc2VcbiAgICBpZiAobiAhPT0gdGhpcy52YWx1ZSkgdGhpcy4kZW1pdCgnY2hhbmdlJywgbilcbiAgfVxuXG4gIGNhbmNlbCAoKSB7XG4gICAgdGhpcy5kcmFmdCA9IG51bGxcbiAgICB0aGlzLmludmFsaWQgPSBmYWxzZVxuICAgIHRoaXMuZWRpdGluZyA9IGZhbHNlO1xuICAgICh0aGlzLiRyZWZzLmlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmJsdXIoKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubnVtZmllbGQge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBiYXNlbGluZTtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgIGdhcDogNHB4O1xuICAgIG1pbi13aWR0aDogOTJweDtcbiAgICBoZWlnaHQ6IDMycHg7XG4gICAgcGFkZGluZzogMCAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY3Vyc29yOiB0ZXh0O1xuXG4gICAgJjpmb2N1cy13aXRoaW4ge1xuICAgICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMS41cHggdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuXG4gICAgaW5wdXQge1xuICAgICAgd2lkdGg6IDYwcHg7XG4gICAgICBtaW4td2lkdGg6IDA7XG4gICAgICBtYXJnaW4tdG9wOiA2cHg7XG4gICAgICBib3JkZXI6IDA7XG4gICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udDogaW5oZXJpdDtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLm51bWZpZWxkLS1hY2NlbnQgaW5wdXQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5udW1maWVsZC0tZGlzYWJsZWQge1xuICAgIG9wYWNpdHk6IDAuNTtcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XG4gIH1cblxuICAubnVtZmllbGRfX3VuaXQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgfVxuXG4gIC5udW1maWVsZF9fZXJyb3Ige1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDEwMCU7XG4gICAgcmlnaHQ6IDA7XG4gICAgei1pbmRleDogMTtcbiAgICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gICAgbWF4LXdpZHRoOiAyNDBweDtcbiAgICBwYWRkaW5nOiA0cHggOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvTnVtYmVyRmllbGQudnVlIn0=