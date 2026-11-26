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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
import SegPicker from "/src/components/control/SegPicker.vue";
import { FILTER_TYPES, filterProblem, previewFilter } from "/src/services/console/settings.ts";
import { entryText } from "/src/services/console/model.ts";
let ConsoleFilterDialog = class extends Vue {
  value;
  filter;
  name = "";
  type = "contains";
  text = "";
  types = FILTER_TYPES;
  onOpen(open) {
    if (!open) return;
    this.name = this.filter?.name ?? "";
    this.type = this.filter?.type ?? "contains";
    this.text = this.filter?.value ?? "";
  }
  get filters() {
    return this.$store.getters["console/getFilters"] ?? [];
  }
  get entries() {
    return this.$store.state.console.console ?? [];
  }
  get problem() {
    return filterProblem({ type: this.type, value: this.text });
  }
  get nameProblem() {
    const name = this.name.trim();
    if (!name) return this.text ? "Give it a name." : null;
    return this.filters.some((f) => f.id !== this.filter?.id && f.name.toLowerCase() === name.toLowerCase()) ? "A filter has that name already." : null;
  }
  get preview() {
    return previewFilter({ type: this.type, value: this.text }, this.entries);
  }
  time(e) {
    return e.time ? this.$filters.formatTimeWithSeconds(e.time * 1e3) : "";
  }
  lineText(e) {
    return entryText(e.message);
  }
  save() {
    if (this.problem || this.nameProblem || !this.name.trim()) return;
    this.$emit("save", {
      id: this.filter?.id ?? "",
      enabled: this.filter?.enabled ?? true,
      name: this.name.trim(),
      type: this.type,
      value: this.text
    });
    this.$emit("input", false);
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ConsoleFilterDialog.prototype, "value", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], ConsoleFilterDialog.prototype, "filter", 2);
__decorateClass([
  Watch("value", { immediate: true })
], ConsoleFilterDialog.prototype, "onOpen", 1);
ConsoleFilterDialog = __decorateClass([
  Component({ components: { M3Dialog, SegPicker } })
], ConsoleFilterDialog);
const _sfc_main = ConsoleFilterDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "eyebrow": "Hide lines", "title": "Hide lines that\u2026", "max-width": "480", "data-tid": "console-filter-dialog" }, on: { "input": function($event) {
    return _vm.$emit("input", $event);
  }, "close": function($event) {
    return _vm.$emit("input", false);
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": function($event) {
      return _vm.$emit("input", false);
    } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary dlg-pri", attrs: { "type": "button", "disabled": !!_vm.problem || !!_vm.nameProblem, "data-tid": "console-filter-save" }, on: { "click": _vm.save } }, [_vm._v(" Save ")])];
  }, proxy: true }]) }, [_c("form", { staticClass: "cfd", on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.save.apply(null, arguments);
  } } }, [_c("label", { staticClass: "cfd__lbl" }, [_vm._v(" Name "), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.name, expression: "name" }], staticClass: "cfd__field", attrs: { "placeholder": "Probe chatter", "data-tid": "console-filter-name" }, domProps: { "value": _vm.name }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.name = $event.target.value;
  } } })]), _c("div", { staticClass: "cfd__lbl" }, [_vm._v(" Match "), _c("seg-picker", { attrs: { "options": _vm.types, "label": "Match" }, model: { value: _vm.type, callback: function($$v) {
    _vm.type = $$v;
  }, expression: "type" } })], 1), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.text, expression: "text" }], staticClass: "cfd__field cfd__field--mono", attrs: { "spellcheck": "false", "autocomplete": "off", "aria-label": _vm.type === "expression" ? "Pattern" : "Text", "placeholder": _vm.type === "expression" ? "^probe at .* is z=" : "// timelapse", "data-tid": "console-filter-value" }, domProps: { "value": _vm.text }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.text = $event.target.value;
  } } }), _vm.problem && _vm.text ? _c("p", { staticClass: "cfd__error", attrs: { "role": "alert", "data-tid": "console-filter-problem" } }, [_vm._v(" " + _vm._s(_vm.problem) + " ")]) : _vm.nameProblem ? _c("p", { staticClass: "cfd__error", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.nameProblem) + " ")]) : _vm._e(), !_vm.problem ? _c("div", { staticClass: "cfd__lbl" }, [_c("span", { attrs: { "data-tid": "console-filter-count" } }, [_vm._v("Would hide " + _vm._s(_vm.preview.hidden.length) + " of the last " + _vm._s(_vm.preview.of) + " lines")]), _vm.preview.hidden.length ? _c("div", { staticClass: "cfd__term", attrs: { "data-tid": "console-filter-preview" } }, _vm._l(_vm.preview.hidden.slice(-8), function(e, i) {
    return _c("div", { key: `${e.id}-${i}` }, [e.time ? _c("span", { staticClass: "cfd__time" }, [_vm._v(_vm._s(_vm.time(e)))]) : _vm._e(), _vm._v(" " + _vm._s(_vm.lineText(e)) + " ")]);
  }), 0) : _vm._e()]) : _vm._e(), _c("p", { staticClass: "cfd__note" }, [_vm._v(" Hidden lines are hidden only in Control; the printer's log keeps them. ")]), _vm.filter && _vm.filter.id ? _c("button", { staticClass: "cfd__remove", attrs: { "type": "button", "data-tid": "console-filter-remove" }, on: { "click": function($event) {
    _vm.$emit("remove", _vm.filter);
    _vm.$emit("input", false);
  } } }, [_vm._v(" Remove this filter ")]) : _vm._e()])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/console/ConsoleFilterDialog.vue?vue&type=style&index=0&scoped=6550fb6f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "6550fb6f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/console/ConsoleFilterDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUErR0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUlBO0FBQUEsRUFFQTtBQUFBLEVBSUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTdEQTtBQUFBLEVBREE7QUFBQSxHQURBLG9CQUVBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FMQSxvQkFNQTtBQVNBO0FBQUEsRUFEQTtBQUFBLEdBZEEsb0JBZUE7QUFmQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb25zb2xlRmlsdGVyRGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtMy1kaWFsb2dcbiAgICA6dmFsdWU9XCJ2YWx1ZVwiXG4gICAgZXllYnJvdz1cIkhpZGUgbGluZXNcIlxuICAgIHRpdGxlPVwiSGlkZSBsaW5lcyB0aGF04oCmXCJcbiAgICBtYXgtd2lkdGg9XCI0ODBcIlxuICAgIGRhdGEtdGlkPVwiY29uc29sZS1maWx0ZXItZGlhbG9nXCJcbiAgICBAaW5wdXQ9XCIkZW1pdCgnaW5wdXQnLCAkZXZlbnQpXCJcbiAgICBAY2xvc2U9XCIkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICA+XG4gICAgPGZvcm1cbiAgICAgIGNsYXNzPVwiY2ZkXCJcbiAgICAgIEBzdWJtaXQucHJldmVudD1cInNhdmVcIlxuICAgID5cbiAgICAgIDxsYWJlbCBjbGFzcz1cImNmZF9fbGJsXCI+XG4gICAgICAgIE5hbWVcbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdi1tb2RlbD1cIm5hbWVcIlxuICAgICAgICAgIGNsYXNzPVwiY2ZkX19maWVsZFwiXG4gICAgICAgICAgcGxhY2Vob2xkZXI9XCJQcm9iZSBjaGF0dGVyXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImNvbnNvbGUtZmlsdGVyLW5hbWVcIlxuICAgICAgICA+XG4gICAgICA8L2xhYmVsPlxuICAgICAgPGRpdiBjbGFzcz1cImNmZF9fbGJsXCI+XG4gICAgICAgIE1hdGNoXG4gICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgdi1tb2RlbD1cInR5cGVcIlxuICAgICAgICAgIDpvcHRpb25zPVwidHlwZXNcIlxuICAgICAgICAgIGxhYmVsPVwiTWF0Y2hcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8aW5wdXRcbiAgICAgICAgdi1tb2RlbD1cInRleHRcIlxuICAgICAgICBjbGFzcz1cImNmZF9fZmllbGQgY2ZkX19maWVsZC0tbW9ub1wiXG4gICAgICAgIHNwZWxsY2hlY2s9XCJmYWxzZVwiXG4gICAgICAgIGF1dG9jb21wbGV0ZT1cIm9mZlwiXG4gICAgICAgIDphcmlhLWxhYmVsPVwidHlwZSA9PT0gJ2V4cHJlc3Npb24nID8gJ1BhdHRlcm4nIDogJ1RleHQnXCJcbiAgICAgICAgOnBsYWNlaG9sZGVyPVwidHlwZSA9PT0gJ2V4cHJlc3Npb24nID8gJ15wcm9iZSBhdCAuKiBpcyB6PScgOiAnLy8gdGltZWxhcHNlJ1wiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1maWx0ZXItdmFsdWVcIlxuICAgICAgPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cInByb2JsZW0gJiYgdGV4dFwiXG4gICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgIGNsYXNzPVwiY2ZkX19lcnJvclwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1maWx0ZXItcHJvYmxlbVwiXG4gICAgICA+XG4gICAgICAgIHt7IHByb2JsZW0gfX1cbiAgICAgIDwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtZWxzZS1pZj1cIm5hbWVQcm9ibGVtXCJcbiAgICAgICAgcm9sZT1cImFsZXJ0XCJcbiAgICAgICAgY2xhc3M9XCJjZmRfX2Vycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgbmFtZVByb2JsZW0gfX1cbiAgICAgIDwvcD5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cIiFwcm9ibGVtXCJcbiAgICAgICAgY2xhc3M9XCJjZmRfX2xibFwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGRhdGEtdGlkPVwiY29uc29sZS1maWx0ZXItY291bnRcIj5Xb3VsZCBoaWRlIHt7IHByZXZpZXcuaGlkZGVuLmxlbmd0aCB9fSBvZiB0aGUgbGFzdCB7eyBwcmV2aWV3Lm9mIH19IGxpbmVzPC9zcGFuPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cInByZXZpZXcuaGlkZGVuLmxlbmd0aFwiXG4gICAgICAgICAgY2xhc3M9XCJjZmRfX3Rlcm1cIlxuICAgICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1maWx0ZXItcHJldmlld1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWZvcj1cIihlLCBpKSBpbiBwcmV2aWV3LmhpZGRlbi5zbGljZSgtOClcIlxuICAgICAgICAgICAgOmtleT1cImAke2UuaWR9LSR7aX1gXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwiZS50aW1lXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjZmRfX3RpbWVcIlxuICAgICAgICAgICAgPnt7IHRpbWUoZSkgfX08L3NwYW4+IHt7IGxpbmVUZXh0KGUpIH19XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8cCBjbGFzcz1cImNmZF9fbm90ZVwiPlxuICAgICAgICBIaWRkZW4gbGluZXMgYXJlIGhpZGRlbiBvbmx5IGluIENvbnRyb2w7IHRoZSBwcmludGVyJ3MgbG9nIGtlZXBzIHRoZW0uXG4gICAgICA8L3A+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtaWY9XCJmaWx0ZXIgJiYgZmlsdGVyLmlkXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2ZkX19yZW1vdmVcIlxuICAgICAgICBkYXRhLXRpZD1cImNvbnNvbGUtZmlsdGVyLXJlbW92ZVwiXG4gICAgICAgIEBjbGljaz1cIiRlbWl0KCdyZW1vdmUnLCBmaWx0ZXIpOyAkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICAgICAgPlxuICAgICAgICBSZW1vdmUgdGhpcyBmaWx0ZXJcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZm9ybT5cbiAgICA8dGVtcGxhdGUgI2FjdGlvbnM+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICAgICAgPlxuICAgICAgICBDYW5jZWxcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnkgZGxnLXByaVwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiEhcHJvYmxlbSB8fCAhIW5hbWVQcm9ibGVtXCJcbiAgICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLWZpbHRlci1zYXZlXCJcbiAgICAgICAgQGNsaWNrPVwic2F2ZVwiXG4gICAgICA+XG4gICAgICAgIFNhdmVcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvbTMtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTTNEaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL3VpL00zRGlhbG9nLnZ1ZSdcbmltcG9ydCBTZWdQaWNrZXIgZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvU2VnUGlja2VyLnZ1ZSdcbmltcG9ydCB0eXBlIHsgQ29uc29sZUVudHJ5LCBDb25zb2xlRmlsdGVyLCBDb25zb2xlRmlsdGVyVHlwZSB9IGZyb20gJ0Avc3RvcmUvY29uc29sZS90eXBlcydcbmltcG9ydCB7IEZJTFRFUl9UWVBFUywgZmlsdGVyUHJvYmxlbSwgcHJldmlld0ZpbHRlciwgdHlwZSBGaWx0ZXJQcmV2aWV3IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb25zb2xlL3NldHRpbmdzJ1xuaW1wb3J0IHsgZW50cnlUZXh0IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb25zb2xlL21vZGVsJ1xuXG4vKiogT25lIFwiaGlkZSBsaW5lc1wiIGZpbHRlciwgd2l0aCBhIGxpdmUgcHJldmlldyBvbiB0aGUgbGFzdCAyMDAgY29uc29sZSBsaW5lcy4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE0zRGlhbG9nLCBTZWdQaWNrZXIgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uc29sZUZpbHRlckRpYWxvZyBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSB2YWx1ZSE6IGJvb2xlYW5cblxuICAvKiogVGhlIGZpbHRlciBiZWluZyBlZGl0ZWQ7IG51bGwgYWRkcyBvbmUuICovXG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCBkZWZhdWx0OiBudWxsIH0pXG4gIHJlYWRvbmx5IGZpbHRlciE6IENvbnNvbGVGaWx0ZXIgfCBudWxsXG5cbiAgbmFtZSA9ICcnXG4gIHR5cGU6IENvbnNvbGVGaWx0ZXJUeXBlID0gJ2NvbnRhaW5zJ1xuICB0ZXh0ID0gJydcblxuICByZWFkb25seSB0eXBlcyA9IEZJTFRFUl9UWVBFU1xuXG4gIEBXYXRjaCgndmFsdWUnLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICBvbk9wZW4gKG9wZW46IGJvb2xlYW4pIHtcbiAgICBpZiAoIW9wZW4pIHJldHVyblxuICAgIHRoaXMubmFtZSA9IHRoaXMuZmlsdGVyPy5uYW1lID8/ICcnXG4gICAgdGhpcy50eXBlID0gdGhpcy5maWx0ZXI/LnR5cGUgPz8gJ2NvbnRhaW5zJ1xuICAgIHRoaXMudGV4dCA9IHRoaXMuZmlsdGVyPy52YWx1ZSA/PyAnJ1xuICB9XG5cbiAgZ2V0IGZpbHRlcnMgKCk6IENvbnNvbGVGaWx0ZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbnNvbGUvZ2V0RmlsdGVycyddID8/IFtdXG4gIH1cblxuICBnZXQgZW50cmllcyAoKTogQ29uc29sZUVudHJ5W10ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25zb2xlLmNvbnNvbGUgPz8gW11cbiAgfVxuXG4gIGdldCBwcm9ibGVtICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gZmlsdGVyUHJvYmxlbSh7IHR5cGU6IHRoaXMudHlwZSwgdmFsdWU6IHRoaXMudGV4dCB9KVxuICB9XG5cbiAgZ2V0IG5hbWVQcm9ibGVtICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5uYW1lLnRyaW0oKVxuICAgIGlmICghbmFtZSkgcmV0dXJuIHRoaXMudGV4dCA/ICdHaXZlIGl0IGEgbmFtZS4nIDogbnVsbFxuICAgIHJldHVybiB0aGlzLmZpbHRlcnMuc29tZShmID0+IGYuaWQgIT09IHRoaXMuZmlsdGVyPy5pZCAmJiBmLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpKSA/ICdBIGZpbHRlciBoYXMgdGhhdCBuYW1lIGFscmVhZHkuJyA6IG51bGxcbiAgfVxuXG4gIGdldCBwcmV2aWV3ICgpOiBGaWx0ZXJQcmV2aWV3IHtcbiAgICByZXR1cm4gcHJldmlld0ZpbHRlcih7IHR5cGU6IHRoaXMudHlwZSwgdmFsdWU6IHRoaXMudGV4dCB9LCB0aGlzLmVudHJpZXMpXG4gIH1cblxuICB0aW1lIChlOiBDb25zb2xlRW50cnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBlLnRpbWUgPyB0aGlzLiRmaWx0ZXJzLmZvcm1hdFRpbWVXaXRoU2Vjb25kcyhlLnRpbWUgKiAxMDAwKSA6ICcnXG4gIH1cblxuICBsaW5lVGV4dCAoZTogQ29uc29sZUVudHJ5KTogc3RyaW5nIHtcbiAgICByZXR1cm4gZW50cnlUZXh0KGUubWVzc2FnZSlcbiAgfVxuXG4gIHNhdmUgKCkge1xuICAgIGlmICh0aGlzLnByb2JsZW0gfHwgdGhpcy5uYW1lUHJvYmxlbSB8fCAhdGhpcy5uYW1lLnRyaW0oKSkgcmV0dXJuXG4gICAgdGhpcy4kZW1pdCgnc2F2ZScsIHtcbiAgICAgIGlkOiB0aGlzLmZpbHRlcj8uaWQgPz8gJycsXG4gICAgICBlbmFibGVkOiB0aGlzLmZpbHRlcj8uZW5hYmxlZCA/PyB0cnVlLFxuICAgICAgbmFtZTogdGhpcy5uYW1lLnRyaW0oKSxcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIHZhbHVlOiB0aGlzLnRleHRcbiAgICB9KVxuICAgIHRoaXMuJGVtaXQoJ2lucHV0JywgZmFsc2UpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC8vIFRoZSBzdG9yeWJvYXJkJ3Mgc2hlZXQ6IENhbmNlbCwgdGhlbiB0aGUgYWN0aW9uIGFjcm9zcyB0aGUgcmVzdCBvZiB0aGUgcm93LlxuICAuZGxnLXByaSB7XG4gICAgZmxleDogMSAxIGF1dG87XG4gIH1cblxuICAuY2ZkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMnB4O1xuICB9XG5cbiAgLmNmZF9fbGJsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA2cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5jZmRfX2ZpZWxkIHtcbiAgICBoZWlnaHQ6IDQycHg7XG4gICAgcGFkZGluZzogMCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250OiBpbmhlcml0O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNDAwO1xuICAgIG91dGxpbmU6IG5vbmU7XG5cbiAgICAmOmZvY3VzLXZpc2libGUgeyBib3gtc2hhZG93OiAwIDAgMCAycHggdmFyKC0tbTNkLWFjY2VudCk7IH1cbiAgfVxuXG4gIC5jZmRfX2ZpZWxkLS1tb25vIHtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgbW9ub3NwYWNlKTtcbiAgfVxuXG4gIC5jZmRfX3Rlcm0ge1xuICAgIG1heC1oZWlnaHQ6IDE4MHB4O1xuICAgIG92ZXJmbG93OiBhdXRvO1xuICAgIHBhZGRpbmc6IDEwcHggMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1iZywgIzAwMCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgbW9ub3NwYWNlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgZm9udC13ZWlnaHQ6IDQwMDtcbiAgICBsaW5lLWhlaWdodDogMS42O1xuICAgIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgfVxuXG4gIC5jZmRfX3RpbWUge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICB9XG5cbiAgLmNmZF9fZXJyb3Ige1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmNmZF9fbm90ZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5jZmRfX3JlbW92ZSB7XG4gICAgYWxpZ24tc2VsZjogZmxleC1zdGFydDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9jb25zb2xlL0NvbnNvbGVGaWx0ZXJEaWFsb2cudnVlIn0=