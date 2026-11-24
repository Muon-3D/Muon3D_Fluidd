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
import { normaliseSteps } from "/src/services/settings/motion-limits.ts";
let StepChips = class extends Vue {
  values;
  label;
  unit;
  tid;
  disabled;
  editing = null;
  draft = "";
  edit(index) {
    this.editing = index;
    this.draft = index < this.values.length ? String(this.values[index]) : "";
    this.$nextTick(() => {
      const el = this.$refs.edit;
      const input = Array.isArray(el) ? el[0] : el;
      input?.focus();
      input?.select();
    });
  }
  cancel() {
    this.editing = null;
    this.draft = "";
  }
  commit() {
    const index = this.editing;
    if (index === null) return;
    this.editing = null;
    const text = this.draft.trim().replace(",", ".");
    this.draft = "";
    const next = [...this.values];
    if (text === "") {
      if (index < next.length && next.length > 1) next.splice(index, 1);
    } else {
      const n = Number(text);
      if (!Number.isFinite(n) || n <= 0) return;
      if (index < next.length) next[index] = n;
      else next.push(n);
    }
    const saved = normaliseSteps(next);
    if (saved.length && saved.join() !== this.values.join()) this.$emit("change", saved);
  }
};
__decorateClass([
  Prop({ type: Array, required: true })
], StepChips.prototype, "values", 2);
__decorateClass([
  Prop({ type: String, required: true })
], StepChips.prototype, "label", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], StepChips.prototype, "unit", 2);
__decorateClass([
  Prop({ type: String, default: "step-chips" })
], StepChips.prototype, "tid", 2);
__decorateClass([
  Prop({ type: Boolean })
], StepChips.prototype, "disabled", 2);
StepChips = __decorateClass([
  Component({})
], StepChips);
const _sfc_main = StepChips;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "step-chips", attrs: { "role": "list", "aria-label": _vm.label, "data-tid": _vm.tid } }, [_vm._l(_vm.values, function(value, i) {
    return [_vm.editing === i ? _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.draft, expression: "draft" }], key: `edit-${i}`, ref: "edit", refInFor: true, staticClass: "step-chips__chip step-chips__input", attrs: { "inputmode": "decimal", "aria-label": `${_vm.label}: change ${value}, or clear it to remove it`, "data-tid": `${_vm.tid}-input` }, domProps: { "value": _vm.draft }, on: { "keydown": [function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
      $event.preventDefault();
      return _vm.commit.apply(null, arguments);
    }, function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
      return _vm.cancel.apply(null, arguments);
    }], "blur": _vm.commit, "input": function($event) {
      if ($event.target.composing) return;
      _vm.draft = $event.target.value;
    } } }) : _c("button", { key: `chip-${value}`, staticClass: "step-chips__chip", attrs: { "type": "button", "role": "listitem", "disabled": _vm.disabled, "aria-label": `${value}${_vm.unit ? ` ${_vm.unit}` : ""}. Change it, or clear it to remove it.`, "data-tid": `${_vm.tid}-chip` }, on: { "click": function($event) {
      return _vm.edit(i);
    } } }, [_vm._v(" " + _vm._s(value) + " ")])];
  }), _vm.editing === _vm.values.length ? _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.draft, expression: "draft" }], key: "new", ref: "edit", staticClass: "step-chips__chip step-chips__input", attrs: { "inputmode": "decimal", "aria-label": `${_vm.label}: a new size`, "data-tid": `${_vm.tid}-input` }, domProps: { "value": _vm.draft }, on: { "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    $event.preventDefault();
    return _vm.commit.apply(null, arguments);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    return _vm.cancel.apply(null, arguments);
  }], "blur": _vm.commit, "input": function($event) {
    if ($event.target.composing) return;
    _vm.draft = $event.target.value;
  } } }) : _c("button", { staticClass: "step-chips__chip step-chips__add", attrs: { "type": "button", "disabled": _vm.disabled, "aria-label": `Add a size to ${_vm.label}`, "data-tid": `${_vm.tid}-add` }, on: { "click": function($event) {
    return _vm.edit(_vm.values.length);
  } } }, [_vm._v(" + ")])], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/StepChips.vue?vue&type=style&index=0&scoped=f173089a&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f173089a",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/StepChips.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQStEQTtBQUNBO0FBUUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEzQ0E7QUFBQTtBQUFBLEdBREEsVUFDQTtBQUNBO0FBQUE7QUFBQSxHQUZBLFVBRUE7QUFDQTtBQUFBO0FBQUEsR0FIQSxVQUdBO0FBQ0E7QUFBQTtBQUFBLEdBSkEsVUFJQTtBQUNBO0FBQUE7QUFBQSxHQUxBLFVBS0E7QUFMQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJTdGVwQ2hpcHMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwic3RlcC1jaGlwc1wiXG4gICAgcm9sZT1cImxpc3RcIlxuICAgIDphcmlhLWxhYmVsPVwibGFiZWxcIlxuICAgIDpkYXRhLXRpZD1cInRpZFwiXG4gID5cbiAgICA8dGVtcGxhdGUgdi1mb3I9XCIodmFsdWUsIGkpIGluIHZhbHVlc1wiPlxuICAgICAgPGlucHV0XG4gICAgICAgIHYtaWY9XCJlZGl0aW5nID09PSBpXCJcbiAgICAgICAgOmtleT1cImBlZGl0LSR7aX1gXCJcbiAgICAgICAgcmVmPVwiZWRpdFwiXG4gICAgICAgIHYtbW9kZWw9XCJkcmFmdFwiXG4gICAgICAgIGNsYXNzPVwic3RlcC1jaGlwc19fY2hpcCBzdGVwLWNoaXBzX19pbnB1dFwiXG4gICAgICAgIGlucHV0bW9kZT1cImRlY2ltYWxcIlxuICAgICAgICA6YXJpYS1sYWJlbD1cImAke2xhYmVsfTogY2hhbmdlICR7dmFsdWV9LCBvciBjbGVhciBpdCB0byByZW1vdmUgaXRgXCJcbiAgICAgICAgOmRhdGEtdGlkPVwiYCR7dGlkfS1pbnB1dGBcIlxuICAgICAgICBAa2V5ZG93bi5lbnRlci5wcmV2ZW50PVwiY29tbWl0XCJcbiAgICAgICAgQGtleWRvd24uZXNjPVwiY2FuY2VsXCJcbiAgICAgICAgQGJsdXI9XCJjb21taXRcIlxuICAgICAgPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWVsc2VcbiAgICAgICAgOmtleT1cImBjaGlwLSR7dmFsdWV9YFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICByb2xlPVwibGlzdGl0ZW1cIlxuICAgICAgICBjbGFzcz1cInN0ZXAtY2hpcHNfX2NoaXBcIlxuICAgICAgICA6ZGlzYWJsZWQ9XCJkaXNhYmxlZFwiXG4gICAgICAgIDphcmlhLWxhYmVsPVwiYCR7dmFsdWV9JHt1bml0ID8gYCAke3VuaXR9YCA6ICcnfS4gQ2hhbmdlIGl0LCBvciBjbGVhciBpdCB0byByZW1vdmUgaXQuYFwiXG4gICAgICAgIDpkYXRhLXRpZD1cImAke3RpZH0tY2hpcGBcIlxuICAgICAgICBAY2xpY2s9XCJlZGl0KGkpXCJcbiAgICAgID5cbiAgICAgICAge3sgdmFsdWUgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gICAgPGlucHV0XG4gICAgICB2LWlmPVwiZWRpdGluZyA9PT0gdmFsdWVzLmxlbmd0aFwiXG4gICAgICBrZXk9XCJuZXdcIlxuICAgICAgcmVmPVwiZWRpdFwiXG4gICAgICB2LW1vZGVsPVwiZHJhZnRcIlxuICAgICAgY2xhc3M9XCJzdGVwLWNoaXBzX19jaGlwIHN0ZXAtY2hpcHNfX2lucHV0XCJcbiAgICAgIGlucHV0bW9kZT1cImRlY2ltYWxcIlxuICAgICAgOmFyaWEtbGFiZWw9XCJgJHtsYWJlbH06IGEgbmV3IHNpemVgXCJcbiAgICAgIDpkYXRhLXRpZD1cImAke3RpZH0taW5wdXRgXCJcbiAgICAgIEBrZXlkb3duLmVudGVyLnByZXZlbnQ9XCJjb21taXRcIlxuICAgICAgQGtleWRvd24uZXNjPVwiY2FuY2VsXCJcbiAgICAgIEBibHVyPVwiY29tbWl0XCJcbiAgICA+XG4gICAgPGJ1dHRvblxuICAgICAgdi1lbHNlXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwic3RlcC1jaGlwc19fY2hpcCBzdGVwLWNoaXBzX19hZGRcIlxuICAgICAgOmRpc2FibGVkPVwiZGlzYWJsZWRcIlxuICAgICAgOmFyaWEtbGFiZWw9XCJgQWRkIGEgc2l6ZSB0byAke2xhYmVsfWBcIlxuICAgICAgOmRhdGEtdGlkPVwiYCR7dGlkfS1hZGRgXCJcbiAgICAgIEBjbGljaz1cImVkaXQodmFsdWVzLmxlbmd0aClcIlxuICAgID5cbiAgICAgICtcbiAgICA8L2J1dHRvbj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgbm9ybWFsaXNlU3RlcHMgfSBmcm9tICdAL3NlcnZpY2VzL3NldHRpbmdzL21vdGlvbi1saW1pdHMnXG5cbi8qKlxuICogU3RlcCBzaXplcyBhcyBjaGlwczogcHJlc3Mgb25lIHRvIGNoYW5nZSBpdCAoY2xlYXIgaXQgdG8gcmVtb3ZlIGl0KSwgXCIrXCJcbiAqIGFkZHMgb25lLiBFbWl0cyBgY2hhbmdlYCB3aXRoIHRoZSB3aG9sZSBsaXN0LCBvbmNlIGVhY2gsIHNtYWxsZXN0IGZpcnN0LlxuICogQXQgbGVhc3Qgb25lIHNpemUgYWx3YXlzIHN0YXlzLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RlcENoaXBzIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBBcnJheSwgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgdmFsdWVzITogbnVtYmVyW11cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IGxhYmVsITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KSByZWFkb25seSB1bml0ITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnc3RlcC1jaGlwcycgfSkgcmVhZG9ubHkgdGlkITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSBkaXNhYmxlZD86IGJvb2xlYW5cblxuICBlZGl0aW5nOiBudW1iZXIgfCBudWxsID0gbnVsbFxuICBkcmFmdCA9ICcnXG5cbiAgZWRpdCAoaW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMuZWRpdGluZyA9IGluZGV4XG4gICAgdGhpcy5kcmFmdCA9IGluZGV4IDwgdGhpcy52YWx1ZXMubGVuZ3RoID8gU3RyaW5nKHRoaXMudmFsdWVzW2luZGV4XSkgOiAnJ1xuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgIGNvbnN0IGVsID0gdGhpcy4kcmVmcy5lZGl0IGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MSW5wdXRFbGVtZW50W10gfCB1bmRlZmluZWRcbiAgICAgIGNvbnN0IGlucHV0ID0gQXJyYXkuaXNBcnJheShlbCkgPyBlbFswXSA6IGVsXG4gICAgICBpbnB1dD8uZm9jdXMoKVxuICAgICAgaW5wdXQ/LnNlbGVjdCgpXG4gICAgfSlcbiAgfVxuXG4gIGNhbmNlbCAoKSB7XG4gICAgdGhpcy5lZGl0aW5nID0gbnVsbFxuICAgIHRoaXMuZHJhZnQgPSAnJ1xuICB9XG5cbiAgY29tbWl0ICgpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuZWRpdGluZ1xuICAgIGlmIChpbmRleCA9PT0gbnVsbCkgcmV0dXJuXG4gICAgdGhpcy5lZGl0aW5nID0gbnVsbFxuICAgIGNvbnN0IHRleHQgPSB0aGlzLmRyYWZ0LnRyaW0oKS5yZXBsYWNlKCcsJywgJy4nKVxuICAgIHRoaXMuZHJhZnQgPSAnJ1xuICAgIGNvbnN0IG5leHQgPSBbLi4udGhpcy52YWx1ZXNdXG4gICAgaWYgKHRleHQgPT09ICcnKSB7XG4gICAgICBpZiAoaW5kZXggPCBuZXh0Lmxlbmd0aCAmJiBuZXh0Lmxlbmd0aCA+IDEpIG5leHQuc3BsaWNlKGluZGV4LCAxKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBuID0gTnVtYmVyKHRleHQpXG4gICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShuKSB8fCBuIDw9IDApIHJldHVyblxuICAgICAgaWYgKGluZGV4IDwgbmV4dC5sZW5ndGgpIG5leHRbaW5kZXhdID0gblxuICAgICAgZWxzZSBuZXh0LnB1c2gobilcbiAgICB9XG4gICAgY29uc3Qgc2F2ZWQgPSBub3JtYWxpc2VTdGVwcyhuZXh0KVxuICAgIGlmIChzYXZlZC5sZW5ndGggJiYgc2F2ZWQuam9pbigpICE9PSB0aGlzLnZhbHVlcy5qb2luKCkpIHRoaXMuJGVtaXQoJ2NoYW5nZScsIHNhdmVkKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuc3RlcC1jaGlwcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDZweDtcbiAgfVxuXG4gIC5zdGVwLWNoaXBzX19jaGlwIHtcbiAgICBtaW4td2lkdGg6IDQwcHg7XG4gICAgaGVpZ2h0OiAzMnB4O1xuICAgIHBhZGRpbmc6IDAgMTBweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8sIG1vbm9zcGFjZSk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG4gICAgJjpkaXNhYmxlZCB7XG4gICAgICBvcGFjaXR5OiAwLjU7XG4gICAgICBjdXJzb3I6IGRlZmF1bHQ7XG4gICAgfVxuICB9XG5cbiAgLnN0ZXAtY2hpcHNfX2lucHV0IHtcbiAgICB3aWR0aDogNzJweDtcbiAgICBvdXRsaW5lOiBub25lO1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDEuNXB4IHZhcigtLW0zZC1hY2NlbnQpO1xuICB9XG5cbiAgLnN0ZXAtY2hpcHNfX2FkZCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL1N0ZXBDaGlwcy52dWUifQ==