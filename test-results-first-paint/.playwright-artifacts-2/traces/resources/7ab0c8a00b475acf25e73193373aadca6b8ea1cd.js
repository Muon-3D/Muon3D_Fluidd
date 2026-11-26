/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import { Component, Mixins, Prop, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
let named = 0;
let FileNameDialog = class extends Mixins(StateMixin) {
  open;
  title;
  label;
  name;
  newName = "";
  inputId = `file-name-${++named}`;
  get canSave() {
    return this.newName.trim().length > 0;
  }
  mounted() {
    this.newName = this.name;
    this.$nextTick(() => {
      const input = this.$refs.input;
      if (!input) return;
      input.focus();
      const dot = this.newName.lastIndexOf(".");
      input.setSelectionRange(0, dot > 0 ? dot : this.newName.length);
    });
  }
  handleSave() {
    if (!this.canSave) return;
    this.$emit("save", this.newName);
    this.open = false;
  }
};
__decorateClass([
  VModel({ type: Boolean })
], FileNameDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: String, required: true })
], FileNameDialog.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, required: true })
], FileNameDialog.prototype, "label", 2);
__decorateClass([
  Prop({ type: String, required: true })
], FileNameDialog.prototype, "name", 2);
FileNameDialog = __decorateClass([
  Component({ components: { M3Dialog } })
], FileNameDialog);
const _sfc_main = FileNameDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "title": _vm.title, "focus-title": false, "max-width": "420", "data-tid": "file-name-dialog" }, on: { "close": function($event) {
    _vm.open = false;
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "file-name-cancel" }, on: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.canSave, "data-tid": "file-name-save" }, on: { "click": _vm.handleSave } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.save")) + " ")])];
  }, proxy: true }]) }, [_c("form", { staticClass: "m3-field", attrs: { "autocomplete": "off" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.handleSave.apply(null, arguments);
  } } }, [_c("label", { staticClass: "m3-field__label", attrs: { "for": _vm.inputId } }, [_vm._v(_vm._s(_vm.label))]), _c("span", { staticClass: "m3-field__box" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.newName, expression: "newName" }], ref: "input", attrs: { "id": _vm.inputId, "type": "text", "spellcheck": "false", "autocapitalize": "off", "data-tid": "file-name-input" }, domProps: { "value": _vm.newName }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.newName = $event.target.value;
  } } })])])]);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/filesystem/FileNameDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFzREE7QUFDQTtBQUNBO0FBRUE7QUFRQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFsQ0E7QUFBQSxFQURBO0FBQUEsR0FEQSxlQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxlQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxlQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxlQVdBO0FBWEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiRmlsZU5hbWVEaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPG0zLWRpYWxvZ1xuICAgIDp2YWx1ZT1cIm9wZW5cIlxuICAgIDp0aXRsZT1cInRpdGxlXCJcbiAgICA6Zm9jdXMtdGl0bGU9XCJmYWxzZVwiXG4gICAgbWF4LXdpZHRoPVwiNDIwXCJcbiAgICBkYXRhLXRpZD1cImZpbGUtbmFtZS1kaWFsb2dcIlxuICAgIEBjbG9zZT1cIm9wZW4gPSBmYWxzZVwiXG4gID5cbiAgICA8Zm9ybVxuICAgICAgY2xhc3M9XCJtMy1maWVsZFwiXG4gICAgICBhdXRvY29tcGxldGU9XCJvZmZcIlxuICAgICAgQHN1Ym1pdC5wcmV2ZW50PVwiaGFuZGxlU2F2ZVwiXG4gICAgPlxuICAgICAgPGxhYmVsXG4gICAgICAgIGNsYXNzPVwibTMtZmllbGRfX2xhYmVsXCJcbiAgICAgICAgOmZvcj1cImlucHV0SWRcIlxuICAgICAgPnt7IGxhYmVsIH19PC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzPVwibTMtZmllbGRfX2JveFwiPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICA6aWQ9XCJpbnB1dElkXCJcbiAgICAgICAgICByZWY9XCJpbnB1dFwiXG4gICAgICAgICAgdi1tb2RlbD1cIm5ld05hbWVcIlxuICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICBzcGVsbGNoZWNrPVwiZmFsc2VcIlxuICAgICAgICAgIGF1dG9jYXBpdGFsaXplPVwib2ZmXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImZpbGUtbmFtZS1pbnB1dFwiXG4gICAgICAgID5cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2Zvcm0+XG5cbiAgICA8dGVtcGxhdGUgI2FjdGlvbnM+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICBkYXRhLXRpZD1cImZpbGUtbmFtZS1jYW5jZWxcIlxuICAgICAgICBAY2xpY2s9XCJvcGVuID0gZmFsc2VcIlxuICAgICAgPlxuICAgICAgICB7eyAkdCgnYXBwLmdlbmVyYWwuYnRuLmNhbmNlbCcpIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNhblNhdmVcIlxuICAgICAgICBkYXRhLXRpZD1cImZpbGUtbmFtZS1zYXZlXCJcbiAgICAgICAgQGNsaWNrPVwiaGFuZGxlU2F2ZVwiXG4gICAgICA+XG4gICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uc2F2ZScpIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L20zLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgVk1vZGVsIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IE0zRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy91aS9NM0RpYWxvZy52dWUnXG5cbmxldCBuYW1lZCA9IDBcblxuLyoqXG4gKiBBIG5hbWUgZm9yIHNvbWV0aGluZyBuZXcgKGEgZm9sZGVyLCBhIGZpbGUsIGEgbWVzaCkgb3IgYSBuZXcgbmFtZSBmb3JcbiAqIHNvbWV0aGluZyB0aGVyZTogb25lIGJveCwgU2F2ZSB0dXJucyBvbiBvbmNlIGl0IGhvbGRzIGEgbmFtZS4gVGhlIHBhcnRcbiAqIGJlZm9yZSB0aGUgZXh0ZW5zaW9uIHN0YXJ0cyBzZWxlY3RlZCwgc28gdHlwaW5nIHJlcGxhY2VzIGp1c3QgdGhlIG5hbWUuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE0zRGlhbG9nIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGVOYW1lRGlhbG9nIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSB0aXRsZSE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBsYWJlbCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBuYW1lITogc3RyaW5nXG5cbiAgbmV3TmFtZSA9ICcnXG4gIGlucHV0SWQgPSBgZmlsZS1uYW1lLSR7KytuYW1lZH1gXG5cbiAgZ2V0IGNhblNhdmUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm5ld05hbWUudHJpbSgpLmxlbmd0aCA+IDBcbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMubmV3TmFtZSA9IHRoaXMubmFtZVxuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgIGNvbnN0IGlucHV0ID0gdGhpcy4kcmVmcy5pbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgdW5kZWZpbmVkXG4gICAgICBpZiAoIWlucHV0KSByZXR1cm5cbiAgICAgIGlucHV0LmZvY3VzKClcbiAgICAgIGNvbnN0IGRvdCA9IHRoaXMubmV3TmFtZS5sYXN0SW5kZXhPZignLicpXG4gICAgICBpbnB1dC5zZXRTZWxlY3Rpb25SYW5nZSgwLCBkb3QgPiAwID8gZG90IDogdGhpcy5uZXdOYW1lLmxlbmd0aClcbiAgICB9KVxuICB9XG5cbiAgaGFuZGxlU2F2ZSAoKSB7XG4gICAgaWYgKCF0aGlzLmNhblNhdmUpIHJldHVyblxuICAgIHRoaXMuJGVtaXQoJ3NhdmUnLCB0aGlzLm5ld05hbWUpXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL2ZpbGVzeXN0ZW0vRmlsZU5hbWVEaWFsb2cudnVlIn0=