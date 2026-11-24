/* unplugin-vue-components disabled */import __unplugin_components_20 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_19 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_18 from "/src/components/ui/AppBtn.vue";
import { VDivider as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_15 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_12 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_10 from "/src/components/ui/AppColorPicker.vue";
import __unplugin_components_9 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_8 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSelect as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppSetting.vue";
import { VCardText as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppDialog.vue";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let MacroSheet = class extends Vue {
  macro;
  sections;
  sectionId;
  place;
  editable;
  readOnly;
  developerTo;
  get title() {
    return this.macro.alias || this.macro.name.toUpperCase();
  }
  get subTitle() {
    const place = this.place ? ` \xB7 ${this.place.path} line ${this.place.line}` : "";
    return `${this.macro.name.toUpperCase()}${place}`;
  }
  get sectionName() {
    return this.sections.find((s) => s.id === this.sectionId)?.name ?? "";
  }
  get code() {
    const gcode = this.macro.config?.gcode;
    return typeof gcode === "string" && gcode.trim() ? gcode.trim() : "The printer hasn't said what this command does.";
  }
  get colour() {
    return this.macro.color || this.$vuetify.theme.currentTheme.secondary?.toString();
  }
  /** Why Edit in Files can't open, or nothing when it can. */
  get editLock() {
    if (!this.editable) return "Editing what a command does needs developer mode on a Muon printer.";
    if (!this.place) return "This command wasn't found in the config files.";
    return "";
  }
  save(change) {
    this.$store.dispatch("macros/saveMacro", { ...this.macro, ...change });
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], MacroSheet.prototype, "macro", 2);
__decorateClass([
  Prop({ type: Array, required: true })
], MacroSheet.prototype, "sections", 2);
__decorateClass([
  Prop({ type: String, required: true })
], MacroSheet.prototype, "sectionId", 2);
__decorateClass([
  Prop({ type: Object })
], MacroSheet.prototype, "place", 2);
__decorateClass([
  Prop({ type: Boolean })
], MacroSheet.prototype, "editable", 2);
__decorateClass([
  Prop({ type: Boolean })
], MacroSheet.prototype, "readOnly", 2);
__decorateClass([
  Prop({ type: String, required: true })
], MacroSheet.prototype, "developerTo", 2);
MacroSheet = __decorateClass([
  Component({})
], MacroSheet);
const _sfc_main = MacroSheet;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": true, "title": _vm.title, "sub-title": _vm.subTitle, "max-width": "480", "no-actions": "", "data-tid": "macro-sheet" }, on: { "input": function($event) {
    !$event && _vm.$emit("close");
  } } }, [_c(__unplugin_components_1, { staticClass: "pa-0" }, [_c("p", { staticClass: "msheet__over" }, [_vm._v(" " + _vm._s(_vm.sectionName) + " ")]), _c(__unplugin_components_2, { attrs: { "title": "Name in Control" } }, [_c(__unplugin_components_3, { attrs: { "value": _vm.macro.alias, "placeholder": _vm.macro.name.toUpperCase(), "dense": "", "filled": "", "hide-details": "", "aria-label": "Name in Control", "data-tid": "macro-sheet-alias", "disabled": _vm.readOnly }, on: { "change": function($event) {
    return _vm.save({ alias: $event });
  } } })], 1), _c(__unplugin_components_4), _c(__unplugin_components_5, { attrs: { "title": "Section" } }, [_c(__unplugin_components_6, { attrs: { "value": _vm.sectionId, "items": _vm.sections, "item-value": "id", "item-text": "name", "dense": "", "filled": "", "hide-details": "", "aria-label": "Section", "data-tid": "macro-sheet-section", "disabled": _vm.readOnly }, on: { "change": function($event) {
    return _vm.$emit("move", $event);
  } } })], 1), _c(__unplugin_components_7), _c(__unplugin_components_8, { attrs: { "title": "Colour" } }, [_c(__unplugin_components_9, { staticClass: "mr-1", attrs: { "outlined": "", "small": "", "color": "primary", "disabled": _vm.readOnly }, on: { "click": function($event) {
    return _vm.save({ color: "" });
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.setting.btn.reset")) + " ")]), _c(__unplugin_components_10, { attrs: { "value": _vm.colour, "title": _vm.$t("app.general.btn.set_color"), "disabled": _vm.readOnly }, on: { "input": function($event) {
    return _vm.save({ color: $event });
  } } })], 1), _c(__unplugin_components_11), _c(__unplugin_components_12, { attrs: { "title": "Shown" } }, [_c(__unplugin_components_13, { staticClass: "mt-0 pt-0", attrs: { "input-value": _vm.macro.visible, "hide-details": "", "aria-label": "Shown", "data-tid": "macro-sheet-shown", "disabled": _vm.readOnly }, on: { "change": function($event) {
    return _vm.save({ visible: !!$event });
  } } })], 1), _c(__unplugin_components_14), _c(__unplugin_components_15, { attrs: { "title": "Not while printing", "sub-title": "Greyed out during a print" } }, [_c(__unplugin_components_16, { staticClass: "mt-0 pt-0", attrs: { "input-value": !!_vm.macro.disabledWhilePrinting, "hide-details": "", "aria-label": "Not while printing", "data-tid": "macro-sheet-not-printing", "disabled": _vm.readOnly }, on: { "change": function($event) {
    return _vm.save({ disabledWhilePrinting: !!$event });
  } } })], 1), _c(__unplugin_components_17), _c("div", { staticClass: "msheet__code" }, [_c("h3", [_vm._v("What it does")]), _c("pre", { attrs: { "data-tid": "macro-sheet-code", "aria-label": "The command's code, read-only" } }, [_vm._v(_vm._s(_vm.code))])]), _vm.editLock ? _c("p", { staticClass: "msheet__lock", attrs: { "data-tid": "macro-sheet-lock" } }, [_vm._v(" " + _vm._s(_vm.editLock) + " "), !_vm.editable ? _c("router-link", { attrs: { "to": _vm.developerTo } }, [_vm._v(" Developer mode ")]) : _vm._e()], 1) : _vm._e(), _c("div", { staticClass: "msheet__actions" }, [_c(__unplugin_components_18, { attrs: { "outlined": "", "disabled": !!_vm.editLock, "data-tid": "macro-sheet-edit" }, on: { "click": function($event) {
    return _vm.$emit("edit");
  } } }, [!_vm.editable ? _c(__unplugin_components_19, { attrs: { "name": "lock", "small": "" } }) : _vm._e(), _vm._v(" Edit in Files ")], 1), _c(__unplugin_components_20, { attrs: { "color": "primary", "data-tid": "macro-sheet-done" }, on: { "click": function($event) {
    return _vm.$emit("close");
  } } }, [_vm._v(" Done ")])], 1)], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/macros/MacroSheet.vue?vue&type=style&index=0&scoped=e06dbb06&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e06dbb06",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/macros/MacroSheet.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlJQTtBQVlBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFwREE7QUFBQSxFQURBO0FBQUEsR0FEQSxXQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxXQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxXQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxXQVdBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FiQSxXQWNBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FoQkEsV0FpQkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQW5CQSxXQW9CQTtBQXBCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNYWNyb1NoZWV0LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxhcHAtZGlhbG9nXG4gICAgOnZhbHVlPVwidHJ1ZVwiXG4gICAgOnRpdGxlPVwidGl0bGVcIlxuICAgIDpzdWItdGl0bGU9XCJzdWJUaXRsZVwiXG4gICAgbWF4LXdpZHRoPVwiNDgwXCJcbiAgICBuby1hY3Rpb25zXG4gICAgZGF0YS10aWQ9XCJtYWNyby1zaGVldFwiXG4gICAgQGlucHV0PVwiISRldmVudCAmJiAkZW1pdCgnY2xvc2UnKVwiXG4gID5cbiAgICA8di1jYXJkLXRleHQgY2xhc3M9XCJwYS0wXCI+XG4gICAgICA8cCBjbGFzcz1cIm1zaGVldF9fb3ZlclwiPlxuICAgICAgICB7eyBzZWN0aW9uTmFtZSB9fVxuICAgICAgPC9wPlxuICAgICAgPGFwcC1zZXR0aW5nIHRpdGxlPVwiTmFtZSBpbiBDb250cm9sXCI+XG4gICAgICAgIDx2LXRleHQtZmllbGRcbiAgICAgICAgICA6dmFsdWU9XCJtYWNyby5hbGlhc1wiXG4gICAgICAgICAgOnBsYWNlaG9sZGVyPVwibWFjcm8ubmFtZS50b1VwcGVyQ2FzZSgpXCJcbiAgICAgICAgICBkZW5zZVxuICAgICAgICAgIGZpbGxlZFxuICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYW1lIGluIENvbnRyb2xcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2hlZXQtYWxpYXNcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cInJlYWRPbmx5XCJcbiAgICAgICAgICBAY2hhbmdlPVwic2F2ZSh7IGFsaWFzOiAkZXZlbnQgfSlcIlxuICAgICAgICAvPlxuICAgICAgPC9hcHAtc2V0dGluZz5cbiAgICAgIDx2LWRpdmlkZXIgLz5cbiAgICAgIDxhcHAtc2V0dGluZyB0aXRsZT1cIlNlY3Rpb25cIj5cbiAgICAgICAgPHYtc2VsZWN0XG4gICAgICAgICAgOnZhbHVlPVwic2VjdGlvbklkXCJcbiAgICAgICAgICA6aXRlbXM9XCJzZWN0aW9uc1wiXG4gICAgICAgICAgaXRlbS12YWx1ZT1cImlkXCJcbiAgICAgICAgICBpdGVtLXRleHQ9XCJuYW1lXCJcbiAgICAgICAgICBkZW5zZVxuICAgICAgICAgIGZpbGxlZFxuICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgIGFyaWEtbGFiZWw9XCJTZWN0aW9uXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm1hY3JvLXNoZWV0LXNlY3Rpb25cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cInJlYWRPbmx5XCJcbiAgICAgICAgICBAY2hhbmdlPVwiJGVtaXQoJ21vdmUnLCAkZXZlbnQpXCJcbiAgICAgICAgLz5cbiAgICAgIDwvYXBwLXNldHRpbmc+XG4gICAgICA8di1kaXZpZGVyIC8+XG4gICAgICA8YXBwLXNldHRpbmcgdGl0bGU9XCJDb2xvdXJcIj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgICBjbGFzcz1cIm1yLTFcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cInJlYWRPbmx5XCJcbiAgICAgICAgICBAY2xpY2s9XCJzYXZlKHsgY29sb3I6ICcnIH0pXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7ICR0KCdhcHAuc2V0dGluZy5idG4ucmVzZXQnKSB9fVxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDxhcHAtY29sb3ItcGlja2VyXG4gICAgICAgICAgOnZhbHVlPVwiY29sb3VyXCJcbiAgICAgICAgICA6dGl0bGU9XCIkdCgnYXBwLmdlbmVyYWwuYnRuLnNldF9jb2xvcicpXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJyZWFkT25seVwiXG4gICAgICAgICAgQGlucHV0PVwic2F2ZSh7IGNvbG9yOiAkZXZlbnQgfSlcIlxuICAgICAgICAvPlxuICAgICAgPC9hcHAtc2V0dGluZz5cbiAgICAgIDx2LWRpdmlkZXIgLz5cbiAgICAgIDxhcHAtc2V0dGluZyB0aXRsZT1cIlNob3duXCI+XG4gICAgICAgIDx2LXN3aXRjaFxuICAgICAgICAgIDppbnB1dC12YWx1ZT1cIm1hY3JvLnZpc2libGVcIlxuICAgICAgICAgIGNsYXNzPVwibXQtMCBwdC0wXCJcbiAgICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiU2hvd25cIlxuICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2hlZXQtc2hvd25cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cInJlYWRPbmx5XCJcbiAgICAgICAgICBAY2hhbmdlPVwic2F2ZSh7IHZpc2libGU6ICEhJGV2ZW50IH0pXCJcbiAgICAgICAgLz5cbiAgICAgIDwvYXBwLXNldHRpbmc+XG4gICAgICA8di1kaXZpZGVyIC8+XG4gICAgICA8YXBwLXNldHRpbmdcbiAgICAgICAgdGl0bGU9XCJOb3Qgd2hpbGUgcHJpbnRpbmdcIlxuICAgICAgICBzdWItdGl0bGU9XCJHcmV5ZWQgb3V0IGR1cmluZyBhIHByaW50XCJcbiAgICAgID5cbiAgICAgICAgPHYtc3dpdGNoXG4gICAgICAgICAgOmlucHV0LXZhbHVlPVwiISFtYWNyby5kaXNhYmxlZFdoaWxlUHJpbnRpbmdcIlxuICAgICAgICAgIGNsYXNzPVwibXQtMCBwdC0wXCJcbiAgICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiTm90IHdoaWxlIHByaW50aW5nXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm1hY3JvLXNoZWV0LW5vdC1wcmludGluZ1wiXG4gICAgICAgICAgOmRpc2FibGVkPVwicmVhZE9ubHlcIlxuICAgICAgICAgIEBjaGFuZ2U9XCJzYXZlKHsgZGlzYWJsZWRXaGlsZVByaW50aW5nOiAhISRldmVudCB9KVwiXG4gICAgICAgIC8+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuICAgICAgPHYtZGl2aWRlciAvPlxuICAgICAgPGRpdiBjbGFzcz1cIm1zaGVldF9fY29kZVwiPlxuICAgICAgICA8aDM+V2hhdCBpdCBkb2VzPC9oMz5cbiAgICAgICAgPHByZVxuICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2hlZXQtY29kZVwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIlRoZSBjb21tYW5kJ3MgY29kZSwgcmVhZC1vbmx5XCJcbiAgICAgICAgPnt7IGNvZGUgfX08L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cImVkaXRMb2NrXCJcbiAgICAgICAgY2xhc3M9XCJtc2hlZXRfX2xvY2tcIlxuICAgICAgICBkYXRhLXRpZD1cIm1hY3JvLXNoZWV0LWxvY2tcIlxuICAgICAgPlxuICAgICAgICB7eyBlZGl0TG9jayB9fVxuICAgICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgICB2LWlmPVwiIWVkaXRhYmxlXCJcbiAgICAgICAgICA6dG89XCJkZXZlbG9wZXJUb1wiXG4gICAgICAgID5cbiAgICAgICAgICBEZXZlbG9wZXIgbW9kZVxuICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgPC9wPlxuICAgICAgPGRpdiBjbGFzcz1cIm1zaGVldF9fYWN0aW9uc1wiPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgOmRpc2FibGVkPVwiISFlZGl0TG9ja1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby1zaGVldC1lZGl0XCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnZWRpdCcpXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICB2LWlmPVwiIWVkaXRhYmxlXCJcbiAgICAgICAgICAgIG5hbWU9XCJsb2NrXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICBFZGl0IGluIEZpbGVzXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2hlZXQtZG9uZVwiXG4gICAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ2Nsb3NlJylcIlxuICAgICAgICA+XG4gICAgICAgICAgRG9uZVxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICA8L2Rpdj5cbiAgICA8L3YtY2FyZC10ZXh0PlxuICA8L2FwcC1kaWFsb2c+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBNYWNybyB9IGZyb20gJ0Avc3RvcmUvbWFjcm9zL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBNYWNyb1BsYWNlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWNyb3MvbG9jYXRlJ1xuaW1wb3J0IHR5cGUgeyBNYWNyb1NlY3Rpb24gfSBmcm9tICcuL21hY3JvLXNlY3Rpb25zJ1xuXG4vKipcbiAqIEEgbWFjcm8sIG9wZW5lZCBmcm9tIFNldHRpbmdzIOKAuiBNYWNyb3M6IHdoYXQgQ29udHJvbCBjYWxscyBpdCwgaXRzXG4gKiBzZWN0aW9uLCBjb2xvdXIsIHdoZXRoZXIgaXQncyBzaG93biBhbmQgZ3JleWVkIG91dCB3aGlsZSBwcmludGluZywgYW5kXG4gKiBpdHMgY29kZSwgcmVhZC1vbmx5LiBFZGl0IGluIEZpbGVzIG9wZW5zIHRoZSBlZGl0b3IgYXQgaXRzIGxpbmUsIHdoaWNoXG4gKiBvbiBhIE11b24gcHJpbnRlciBuZWVkcyBkZXZlbG9wZXIgbW9kZS5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hY3JvU2hlZXQgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgbWFjcm8hOiBNYWNyb1xuXG4gIEBQcm9wKHsgdHlwZTogQXJyYXksIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHNlY3Rpb25zITogTWFjcm9TZWN0aW9uW11cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgc2VjdGlvbklkITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QgfSlcbiAgcmVhZG9ubHkgcGxhY2U/OiBNYWNyb1BsYWNlXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGVkaXRhYmxlITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSByZWFkT25seSE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgZGV2ZWxvcGVyVG8hOiBzdHJpbmdcblxuICBnZXQgdGl0bGUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubWFjcm8uYWxpYXMgfHwgdGhpcy5tYWNyby5uYW1lLnRvVXBwZXJDYXNlKClcbiAgfVxuXG4gIGdldCBzdWJUaXRsZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwbGFjZSA9IHRoaXMucGxhY2UgPyBgIMK3ICR7dGhpcy5wbGFjZS5wYXRofSBsaW5lICR7dGhpcy5wbGFjZS5saW5lfWAgOiAnJ1xuICAgIHJldHVybiBgJHt0aGlzLm1hY3JvLm5hbWUudG9VcHBlckNhc2UoKX0ke3BsYWNlfWBcbiAgfVxuXG4gIGdldCBzZWN0aW9uTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zZWN0aW9ucy5maW5kKHMgPT4gcy5pZCA9PT0gdGhpcy5zZWN0aW9uSWQpPy5uYW1lID8/ICcnXG4gIH1cblxuICBnZXQgY29kZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBnY29kZSA9IHRoaXMubWFjcm8uY29uZmlnPy5nY29kZVxuICAgIHJldHVybiB0eXBlb2YgZ2NvZGUgPT09ICdzdHJpbmcnICYmIGdjb2RlLnRyaW0oKSA/IGdjb2RlLnRyaW0oKSA6ICdUaGUgcHJpbnRlciBoYXNuXFwndCBzYWlkIHdoYXQgdGhpcyBjb21tYW5kIGRvZXMuJ1xuICB9XG5cbiAgZ2V0IGNvbG91ciAoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5tYWNyby5jb2xvciB8fCB0aGlzLiR2dWV0aWZ5LnRoZW1lLmN1cnJlbnRUaGVtZS5zZWNvbmRhcnk/LnRvU3RyaW5nKClcbiAgfVxuXG4gIC8qKiBXaHkgRWRpdCBpbiBGaWxlcyBjYW4ndCBvcGVuLCBvciBub3RoaW5nIHdoZW4gaXQgY2FuLiAqL1xuICBnZXQgZWRpdExvY2sgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmVkaXRhYmxlKSByZXR1cm4gJ0VkaXRpbmcgd2hhdCBhIGNvbW1hbmQgZG9lcyBuZWVkcyBkZXZlbG9wZXIgbW9kZSBvbiBhIE11b24gcHJpbnRlci4nXG4gICAgaWYgKCF0aGlzLnBsYWNlKSByZXR1cm4gJ1RoaXMgY29tbWFuZCB3YXNuXFwndCBmb3VuZCBpbiB0aGUgY29uZmlnIGZpbGVzLidcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIHNhdmUgKGNoYW5nZTogUGFydGlhbDxNYWNybz4pIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnbWFjcm9zL3NhdmVNYWNybycsIHsgLi4udGhpcy5tYWNybywgLi4uY2hhbmdlIH0pXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5tc2hlZXRfX292ZXIge1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAxMnB4IDE2cHggMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGxldHRlci1zcGFjaW5nOiAuMDZlbTtcbiAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICB9XG5cbiAgLm1zaGVldF9fY29kZSB7XG4gICAgcGFkZGluZzogMTJweCAxNnB4IDA7XG5cbiAgICBoMyB7XG4gICAgICBtYXJnaW46IDAgMCA2cHg7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG5cbiAgICBwcmUge1xuICAgICAgbWF4LWhlaWdodDogMjQwcHg7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBwYWRkaW5nOiAxMHB4IDEycHg7XG4gICAgICBvdmVyZmxvdzogYXV0bztcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vLCBtb25vc3BhY2UpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICAgICAgdXNlci1zZWxlY3Q6IHRleHQ7XG4gICAgfVxuICB9XG5cbiAgLm1zaGVldF9fbG9jayB7XG4gICAgbWFyZ2luOiAxMHB4IDE2cHggMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5tc2hlZXRfX2FjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogMTBweDtcbiAgICBwYWRkaW5nOiAxNHB4IDE2cHggMTZweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL21hY3Jvcy9NYWNyb1NoZWV0LnZ1ZSJ9