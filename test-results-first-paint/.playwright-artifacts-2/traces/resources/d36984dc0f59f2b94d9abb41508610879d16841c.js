/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VDialog as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let shown = 0;
let M3Dialog = class extends Vue {
  value;
  title;
  eyebrow;
  maxWidth;
  persistent;
  closable;
  closeDisabled;
  closeLabel;
  closeTest;
  tone;
  contentClass;
  labelId;
  focusTitle;
  uid = ++shown;
  returnFocus = null;
  focusTimer = null;
  get titleId() {
    return this.labelId || `m3-dlg-title-${this.uid}`;
  }
  mounted() {
    if (this.value) this.onValue(true);
  }
  beforeDestroy() {
    this.cancelFocusTimer();
  }
  cancelFocusTimer() {
    if (this.focusTimer !== null) clearTimeout(this.focusTimer);
    this.focusTimer = null;
  }
  onValue(open) {
    if (open) {
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.cancelFocusTimer();
      if (this.focusTitle) this.$nextTick(() => this.focus());
    } else {
      this.cancelFocusTimer();
    }
    if (!open && this.returnFocus) {
      const target = this.returnFocus;
      this.returnFocus = null;
      this.$nextTick(() => target.isConnected && target.focus());
    }
  }
  /**
   * The title takes the focus. Vuetify renders a dialog's content the first
   * time it opens, a moment after `value` turns on, and then focuses the
   * dialog itself unless the focus is already inside: so this tries again
   * until the title is there and has it.
   */
  focus(tries = 10) {
    if (this._isDestroyed) return;
    const title = this.$refs.title;
    title?.focus();
    if (title && document.activeElement === title) return;
    if (tries > 0) this.focusTimer = setTimeout(() => this.focus(tries - 1), 30);
  }
  /** Esc or a click outside: Vuetify closes it unless it is persistent. */
  onInput(open) {
    if (!open) this.$emit("close");
  }
};
__decorateClass([
  Prop({ type: Boolean })
], M3Dialog.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Dialog.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Dialog.prototype, "eyebrow", 2);
__decorateClass([
  Prop({ type: [Number, String], default: 460 })
], M3Dialog.prototype, "maxWidth", 2);
__decorateClass([
  Prop({ type: Boolean })
], M3Dialog.prototype, "persistent", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], M3Dialog.prototype, "closable", 2);
__decorateClass([
  Prop({ type: Boolean })
], M3Dialog.prototype, "closeDisabled", 2);
__decorateClass([
  Prop({ type: String, default: "Close" })
], M3Dialog.prototype, "closeLabel", 2);
__decorateClass([
  Prop({ type: String })
], M3Dialog.prototype, "closeTest", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Dialog.prototype, "tone", 2);
__decorateClass([
  Prop({ type: String })
], M3Dialog.prototype, "contentClass", 2);
__decorateClass([
  Prop({ type: String })
], M3Dialog.prototype, "labelId", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], M3Dialog.prototype, "focusTitle", 2);
__decorateClass([
  Watch("value")
], M3Dialog.prototype, "onValue", 1);
M3Dialog = __decorateClass([
  Component({ inheritAttrs: false })
], M3Dialog);
const _sfc_main = M3Dialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "max-width": _vm.maxWidth, "persistent": _vm.persistent, "content-class": `m3-dlg-frame ${_vm.contentClass || ""}` }, on: { "input": _vm.onInput } }, [_c("div", _vm._b({ staticClass: "m3-dlg", class: _vm.tone ? `m3-dlg--${_vm.tone}` : "", attrs: { "role": "dialog", "aria-modal": "true", "aria-labelledby": _vm.titleId } }, "div", _vm.$attrs, false), [_c("header", { staticClass: "m3-dlg__head" }, [_c("div", { staticClass: "m3-dlg__titles" }, [_vm.eyebrow ? _c("span", { staticClass: "m3-dlg__eyebrow" }, [_vm._v(_vm._s(_vm.eyebrow))]) : _vm._e(), _c("h2", { ref: "title", staticClass: "m3-dlg__title", attrs: { "id": _vm.titleId, "tabindex": "-1" } }, [_vm._t("title", function() {
    return [_vm._v(" " + _vm._s(_vm.title) + " ")];
  })], 2)]), _vm.closable ? _c("button", { staticClass: "m3-dlg__close", attrs: { "type": "button", "aria-label": _vm.closeLabel, "disabled": _vm.closeDisabled, "data-test": _vm.closeTest, "data-tid": "m3-dlg-close" }, on: { "click": function($event) {
    return _vm.$emit("close");
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "x" } })], 1) : _vm._e()]), _c("div", { staticClass: "m3-dlg__body" }, [_vm._t("default")], 2), _vm.$slots.actions || _vm.$scopedSlots.actions ? _c("footer", { staticClass: "m3-dlg__actions" }, [_vm._t("actions")], 2) : _vm._e()])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/M3Dialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBOERBO0FBR0E7QUFlQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBakdBO0FBQUEsRUFEQTtBQUFBLEdBREEsU0FFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsU0FLQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBUkEsU0FTQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBWEEsU0FZQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBZEEsU0FlQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBakJBLFNBa0JBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FwQkEsU0FxQkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQXZCQSxTQXdCQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBM0JBLFNBNEJBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0EvQkEsU0FnQ0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWxDQSxTQW1DQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBckNBLFNBc0NBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0F4Q0EsU0F5Q0E7QUF5QkE7QUFBQSxFQURBO0FBQUEsR0FqRUEsU0FrRUE7QUFsRUE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTTNEaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtZGlhbG9nXG4gICAgOnZhbHVlPVwidmFsdWVcIlxuICAgIDptYXgtd2lkdGg9XCJtYXhXaWR0aFwiXG4gICAgOnBlcnNpc3RlbnQ9XCJwZXJzaXN0ZW50XCJcbiAgICA6Y29udGVudC1jbGFzcz1cImBtMy1kbGctZnJhbWUgJHtjb250ZW50Q2xhc3MgfHwgJyd9YFwiXG4gICAgQGlucHV0PVwib25JbnB1dFwiXG4gID5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cIm0zLWRsZ1wiXG4gICAgICA6Y2xhc3M9XCJ0b25lID8gYG0zLWRsZy0tJHt0b25lfWAgOiAnJ1wiXG4gICAgICByb2xlPVwiZGlhbG9nXCJcbiAgICAgIGFyaWEtbW9kYWw9XCJ0cnVlXCJcbiAgICAgIDphcmlhLWxhYmVsbGVkYnk9XCJ0aXRsZUlkXCJcbiAgICAgIHYtYmluZD1cIiRhdHRyc1wiXG4gICAgPlxuICAgICAgPGhlYWRlciBjbGFzcz1cIm0zLWRsZ19faGVhZFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtZGxnX190aXRsZXNcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgdi1pZj1cImV5ZWJyb3dcIlxuICAgICAgICAgICAgY2xhc3M9XCJtMy1kbGdfX2V5ZWJyb3dcIlxuICAgICAgICAgID57eyBleWVicm93IH19PC9zcGFuPlxuICAgICAgICAgIDxoMlxuICAgICAgICAgICAgOmlkPVwidGl0bGVJZFwiXG4gICAgICAgICAgICByZWY9XCJ0aXRsZVwiXG4gICAgICAgICAgICB0YWJpbmRleD1cIi0xXCJcbiAgICAgICAgICAgIGNsYXNzPVwibTMtZGxnX190aXRsZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNsb3QgbmFtZT1cInRpdGxlXCI+XG4gICAgICAgICAgICAgIHt7IHRpdGxlIH19XG4gICAgICAgICAgICA8L3Nsb3Q+XG4gICAgICAgICAgPC9oMj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWlmPVwiY2xvc2FibGVcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwibTMtZGxnX19jbG9zZVwiXG4gICAgICAgICAgOmFyaWEtbGFiZWw9XCJjbG9zZUxhYmVsXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJjbG9zZURpc2FibGVkXCJcbiAgICAgICAgICA6ZGF0YS10ZXN0PVwiY2xvc2VUZXN0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm0zLWRsZy1jbG9zZVwiXG4gICAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ2Nsb3NlJylcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInhcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwibTMtZGxnX19ib2R5XCI+XG4gICAgICAgIDxzbG90IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGZvb3RlclxuICAgICAgICB2LWlmPVwiJHNsb3RzLmFjdGlvbnMgfHwgJHNjb3BlZFNsb3RzLmFjdGlvbnNcIlxuICAgICAgICBjbGFzcz1cIm0zLWRsZ19fYWN0aW9uc1wiXG4gICAgICA+XG4gICAgICAgIDxzbG90IG5hbWU9XCJhY3Rpb25zXCIgLz5cbiAgICAgIDwvZm9vdGVyPlxuICAgIDwvZGl2PlxuICA8L3YtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5cbi8qKiBFYWNoIGRpYWxvZydzIG93biBpZCwgZm9yIGl0cyB0aXRsZS4gKi9cbmxldCBzaG93biA9IDBcblxuLyoqXG4gKiBUaGUgcmVkZXNpZ24ncyBkaWFsb2c6IGEgdGl0bGUgKHdpdGggYSBzbWFsbCBsaW5lIGFib3ZlIGl0IHdoZW4gdGhhdFxuICogaGVscHMpLCB3aGF0IGl0J3MgYWJvdXQsIGFuZCBpdHMgYnV0dG9ucywgb24gdGhlIHBhZ2UncyBvd24gc3VyZmFjZS4gT25lXG4gKiBzaGVsbCBmb3IgZXZlcnkgZGlhbG9nIEZsdWlkZCBhc2tzIHdpdGggKCRjb25maXJtLCB0aGUgc2xpY2VyJ3MgcHJpbnRcbiAqIGNoZWNrLCBBZGQgYSBwcmludGVyLCB0aGUgcHJpbnRlcidzIG93biBwcm9tcHRzKSwgc28gdGhleSBsb29rIGFuZCBiZWhhdmVcbiAqIGFsaWtlLlxuICpcbiAqIOKclSwgRXNjIGFuZCBhIGNsaWNrIG91dHNpZGUgYWxsIGVtaXQgYGNsb3NlYCAobm9uZSBvZiB0aGVtLCB3aGlsZVxuICogYHBlcnNpc3RlbnRgKSwgYW5kIHRoZSBwYXJlbnQgZGVjaWRlcyB3aGF0IGNsb3NpbmcgbWVhbnMuIFRoZSBmb2N1cyBzdGFydHNcbiAqIG9uIHRoZSB0aXRsZSwgbmV2ZXIgb24gYSBidXR0b24sIHNvIGEga2V5IHByZXNzZWQgYXMgdGhlIGRpYWxvZyBhcHBlYXJzXG4gKiBjYW5ub3QgYW5zd2VyIGl0LlxuICovXG5AQ29tcG9uZW50KHsgaW5oZXJpdEF0dHJzOiBmYWxzZSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTTNEaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgdmFsdWUhOiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgLyoqIEEgc2hvcnQgbGluZSBhYm92ZSB0aGUgdGl0bGU6IHdoYXQgdGhpcyBpcyBhYm91dC4gKi9cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IGV5ZWJyb3chOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFtOdW1iZXIsIFN0cmluZ10sIGRlZmF1bHQ6IDQ2MCB9KVxuICByZWFkb25seSBtYXhXaWR0aCE6IG51bWJlciB8IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBwZXJzaXN0ZW50ITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogdHJ1ZSB9KVxuICByZWFkb25seSBjbG9zYWJsZSE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgY2xvc2VEaXNhYmxlZCE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ0Nsb3NlJyB9KVxuICByZWFkb25seSBjbG9zZUxhYmVsITogc3RyaW5nXG5cbiAgLyoqIEEgZGF0YS10ZXN0IGZvciDinJUsIGZvciB0aGUgc3BlY3MgdGhhdCBsb29rIGZvciBpdC4gKi9cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgY2xvc2VUZXN0Pzogc3RyaW5nXG5cbiAgLyoqIGBkYW5nZXJgIG9yIGB3YXJuYDogdGhlIGxpbmUgYWJvdmUgdGhlIHRpdGxlIHRha2VzIHRoZSBjb2xvdXIuICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSB0b25lITogJycgfCAnZGFuZ2VyJyB8ICd3YXJuJ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nIH0pXG4gIHJlYWRvbmx5IGNvbnRlbnRDbGFzcz86IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nIH0pXG4gIHJlYWRvbmx5IGxhYmVsSWQ/OiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgZm9jdXNUaXRsZSE6IGJvb2xlYW5cblxuICB1aWQgPSArK3Nob3duXG4gIHJldHVybkZvY3VzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG4gIGZvY3VzVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGxcblxuICBnZXQgdGl0bGVJZCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sYWJlbElkIHx8IGBtMy1kbGctdGl0bGUtJHt0aGlzLnVpZH1gXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICBpZiAodGhpcy52YWx1ZSkgdGhpcy5vblZhbHVlKHRydWUpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICAvLyBUaGUgZm9jdXMgcmV0cnkgbXVzdCBub3Qgb3V0bGl2ZSB0aGUgZGlhbG9nLlxuICAgIHRoaXMuY2FuY2VsRm9jdXNUaW1lcigpXG4gIH1cblxuICBjYW5jZWxGb2N1c1RpbWVyICgpIHtcbiAgICBpZiAodGhpcy5mb2N1c1RpbWVyICE9PSBudWxsKSBjbGVhclRpbWVvdXQodGhpcy5mb2N1c1RpbWVyKVxuICAgIHRoaXMuZm9jdXNUaW1lciA9IG51bGxcbiAgfVxuXG4gIEBXYXRjaCgndmFsdWUnKVxuICBvblZhbHVlIChvcGVuOiBib29sZWFuKSB7XG4gICAgaWYgKG9wZW4pIHtcbiAgICAgIHRoaXMucmV0dXJuRm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IDogbnVsbFxuICAgICAgdGhpcy5jYW5jZWxGb2N1c1RpbWVyKClcbiAgICAgIGlmICh0aGlzLmZvY3VzVGl0bGUpIHRoaXMuJG5leHRUaWNrKCgpID0+IHRoaXMuZm9jdXMoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxGb2N1c1RpbWVyKClcbiAgICB9XG4gICAgaWYgKCFvcGVuICYmIHRoaXMucmV0dXJuRm9jdXMpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucmV0dXJuRm9jdXNcbiAgICAgIHRoaXMucmV0dXJuRm9jdXMgPSBudWxsXG4gICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB0YXJnZXQuaXNDb25uZWN0ZWQgJiYgdGFyZ2V0LmZvY3VzKCkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSB0aXRsZSB0YWtlcyB0aGUgZm9jdXMuIFZ1ZXRpZnkgcmVuZGVycyBhIGRpYWxvZydzIGNvbnRlbnQgdGhlIGZpcnN0XG4gICAqIHRpbWUgaXQgb3BlbnMsIGEgbW9tZW50IGFmdGVyIGB2YWx1ZWAgdHVybnMgb24sIGFuZCB0aGVuIGZvY3VzZXMgdGhlXG4gICAqIGRpYWxvZyBpdHNlbGYgdW5sZXNzIHRoZSBmb2N1cyBpcyBhbHJlYWR5IGluc2lkZTogc28gdGhpcyB0cmllcyBhZ2FpblxuICAgKiB1bnRpbCB0aGUgdGl0bGUgaXMgdGhlcmUgYW5kIGhhcyBpdC5cbiAgICovXG4gIGZvY3VzICh0cmllcyA9IDEwKSB7XG4gICAgaWYgKCh0aGlzIGFzIGFueSkuX2lzRGVzdHJveWVkKSByZXR1cm5cbiAgICBjb25zdCB0aXRsZSA9IHRoaXMuJHJlZnMudGl0bGUgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWRcbiAgICB0aXRsZT8uZm9jdXMoKVxuICAgIGlmICh0aXRsZSAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSB0aXRsZSkgcmV0dXJuXG4gICAgaWYgKHRyaWVzID4gMCkgdGhpcy5mb2N1c1RpbWVyID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmZvY3VzKHRyaWVzIC0gMSksIDMwKVxuICB9XG5cbiAgLyoqIEVzYyBvciBhIGNsaWNrIG91dHNpZGU6IFZ1ZXRpZnkgY2xvc2VzIGl0IHVubGVzcyBpdCBpcyBwZXJzaXN0ZW50LiAqL1xuICBvbklucHV0IChvcGVuOiBib29sZWFuKSB7XG4gICAgaWYgKCFvcGVuKSB0aGlzLiRlbWl0KCdjbG9zZScpXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvTTNEaWFsb2cudnVlIn0=