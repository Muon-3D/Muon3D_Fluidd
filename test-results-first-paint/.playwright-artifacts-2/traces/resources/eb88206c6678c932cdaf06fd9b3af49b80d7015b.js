/* unplugin-vue-components disabled */import { VCombobox as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { defaultState } from "/src/store/config/state.ts";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import SegPicker from "/src/components/control/SegPicker.vue";
import {
  SAVE_AND_RESTART_OPTIONS,
  TEXT_SIZE_OPTIONS,
  editorFontPx,
  editorTextSize,
  saveAndRestartLine,
  saveAndRestartMode
} from "/src/services/settings/editor.ts";
let FileEditorSettings = class extends Mixins(StateMixin) {
  saveAndRestartOptions = SAVE_AND_RESTART_OPTIONS;
  textSizeOptions = TEXT_SIZE_OPTIONS;
  save(path, value) {
    this.$store.dispatch("config/saveByPath", { path, value, server: true });
  }
  get saveAndRestart() {
    return saveAndRestartMode(this.$store.state.config.uiSettings.editor.saveAndRestart);
  }
  set saveAndRestart(value) {
    this.save("uiSettings.editor.saveAndRestart", saveAndRestartMode(value));
  }
  get saveAndRestartLine() {
    return saveAndRestartLine(this.saveAndRestart);
  }
  get showSaveConfigAndRestart() {
    return !!this.$store.state.config.uiSettings.general.showSaveConfigAndRestart;
  }
  set showSaveConfigAndRestart(value) {
    this.save("uiSettings.general.showSaveConfigAndRestart", value);
  }
  get textSize() {
    return editorTextSize(this.$store.state.config.uiSettings.editor.textSize);
  }
  set textSize(value) {
    this.save("uiSettings.editor.textSize", editorTextSize(value));
  }
  get textSizePx() {
    return editorFontPx(this.textSize);
  }
  get confirmDirtyEditorClose() {
    return this.$store.state.config.uiSettings.editor.confirmDirtyEditorClose;
  }
  set confirmDirtyEditorClose(value) {
    this.save("uiSettings.editor.confirmDirtyEditorClose", value);
  }
  get autoEditExtensions() {
    return this.$store.state.config.uiSettings.editor.autoEditExtensions;
  }
  set autoEditExtensions(value) {
    this.save("uiSettings.editor.autoEditExtensions", [
      ...new Set(value.map((ext) => ext.startsWith(".") ? ext : `.${ext}`))
    ].sort((a, b) => a.localeCompare(b)));
  }
  get restoreViewState() {
    return this.$store.state.config.uiSettings.editor.restoreViewState;
  }
  set restoreViewState(value) {
    this.save("uiSettings.editor.restoreViewState", value);
  }
  restoreOptions = [
    { value: "never", label: "Never" },
    { value: "session", label: "This visit" },
    { value: "local", label: "Always" }
  ];
  get codeLens() {
    return this.$store.state.config.uiSettings.editor.codeLens;
  }
  set codeLens(value) {
    this.save("uiSettings.editor.codeLens", value);
  }
  handleReset() {
    this.save("uiSettings.editor", defaultState().uiSettings.editor);
  }
};
FileEditorSettings = __decorateClass([
  Component({ components: { ToggleSwitch, SegPicker } })
], FileEditorSettings);
const _sfc_main = FileEditorSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "m3-set fes", attrs: { "id": "editor", "data-tid": "editor-settings" } }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" The editor ")]), _c("p", { staticClass: "m3-set__intro" }, [_vm._v(" How config files open, save and restart. ")]), _c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Save and restart")]), _c("span", { attrs: { "data-tid": "editor-save-restart-line" } }, [_vm._v(_vm._s(_vm.saveAndRestartLine))])]), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "options": _vm.saveAndRestartOptions, "value": _vm.saveAndRestart, "label": "Save and restart", "data-tid": "editor-save-restart" }, on: { "input": function($event) {
    _vm.saveAndRestart = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(0), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.showSaveConfigAndRestart, "label": "Save and restart in the top bar", "data-tid": "editor-top-bar-save" }, on: { "input": function($event) {
    _vm.showSaveConfigAndRestart = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row fes__size" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Text size")]), _c("span", { staticClass: "fes__preview", style: { fontSize: `${_vm.textSizePx}px` }, attrs: { "data-tid": "editor-text-size-preview" } }, [_vm._v("[extruder] max_temp: 265")])]), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "options": _vm.textSizeOptions, "value": _vm.textSize, "label": "Text size", "data-tid": "editor-text-size" }, on: { "input": function($event) {
    _vm.textSize = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(1), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.confirmDirtyEditorClose, "label": "Ask before closing with unsaved changes", "data-tid": "editor-confirm-close" }, on: { "input": function($event) {
    _vm.confirmDirtyEditorClose = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(2), _c("div", { staticClass: "m3-set__control m3-set__control--wide" }, [_c(__unplugin_components_0, { attrs: { "outlined": "", "dense": "", "hide-selected": "", "hide-details": "auto", "multiple": "", "small-chips": "", "append-icon": "", "deletable-chips": "", "aria-label": "Open these as text" }, model: { value: _vm.autoEditExtensions, callback: function($$v) {
    _vm.autoEditExtensions = $$v;
  }, expression: "autoEditExtensions" } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(3), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "options": _vm.restoreOptions, "value": _vm.restoreViewState, "label": "Reopen where I left off", "data-tid": "editor-restore-view" }, on: { "input": function($event) {
    _vm.restoreViewState = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(4), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.codeLens, "label": "Hints above sections", "data-tid": "editor-hints" }, on: { "input": function($event) {
    _vm.codeLens = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v(_vm._s(_vm.$t("app.setting.label.reset")))])]), _c("div", { staticClass: "m3-set__control" }, [_c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "data-tid": "editor-reset" }, on: { "click": _vm.handleReset } }, [_vm._v(" " + _vm._s(_vm.$t("app.setting.btn.reset")) + " ")])])])]);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Save and restart in the top bar")]), _c("span", [_vm._v("A button that appears when a calibration has results to keep.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Ask before closing with unsaved changes")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Open these as text")]), _c("span", [_vm._v("Other files download instead.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Reopen where I left off")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Hints above sections")]), _c("span", [_vm._v("Links to the Klipper docs above each [section].")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/FileEditorSettings.vue?vue&type=style&index=0&scoped=ef44cee1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ef44cee1",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/FileEditorSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFvSkE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxPQUVBO0FBUUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQW5GQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJGaWxlRWRpdG9yU2V0dGluZ3MudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNlY3Rpb25cbiAgICBpZD1cImVkaXRvclwiXG4gICAgY2xhc3M9XCJtMy1zZXQgZmVzXCJcbiAgICBkYXRhLXRpZD1cImVkaXRvci1zZXR0aW5nc1wiXG4gID5cbiAgICA8aDIgY2xhc3M9XCJtMy1zZXRfX3RpdGxlXCI+XG4gICAgICBUaGUgZWRpdG9yXG4gICAgPC9oMj5cbiAgICA8cCBjbGFzcz1cIm0zLXNldF9faW50cm9cIj5cbiAgICAgIEhvdyBjb25maWcgZmlsZXMgb3Blbiwgc2F2ZSBhbmQgcmVzdGFydC5cbiAgICA8L3A+XG5cbiAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgIDxiPlNhdmUgYW5kIHJlc3RhcnQ8L2I+XG4gICAgICAgIDxzcGFuIGRhdGEtdGlkPVwiZWRpdG9yLXNhdmUtcmVzdGFydC1saW5lXCI+e3sgc2F2ZUFuZFJlc3RhcnRMaW5lIH19PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgOm9wdGlvbnM9XCJzYXZlQW5kUmVzdGFydE9wdGlvbnNcIlxuICAgICAgICAgIDp2YWx1ZT1cInNhdmVBbmRSZXN0YXJ0XCJcbiAgICAgICAgICBsYWJlbD1cIlNhdmUgYW5kIHJlc3RhcnRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZWRpdG9yLXNhdmUtcmVzdGFydFwiXG4gICAgICAgICAgQGlucHV0PVwic2F2ZUFuZFJlc3RhcnQgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgIDxiPlNhdmUgYW5kIHJlc3RhcnQgaW4gdGhlIHRvcCBiYXI8L2I+XG4gICAgICAgIDxzcGFuPkEgYnV0dG9uIHRoYXQgYXBwZWFycyB3aGVuIGEgY2FsaWJyYXRpb24gaGFzIHJlc3VsdHMgdG8ga2VlcC48L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2xcIj5cbiAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICA6dmFsdWU9XCJzaG93U2F2ZUNvbmZpZ0FuZFJlc3RhcnRcIlxuICAgICAgICAgIGxhYmVsPVwiU2F2ZSBhbmQgcmVzdGFydCBpbiB0aGUgdG9wIGJhclwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJlZGl0b3ItdG9wLWJhci1zYXZlXCJcbiAgICAgICAgICBAaW5wdXQ9XCJzaG93U2F2ZUNvbmZpZ0FuZFJlc3RhcnQgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3cgZmVzX19zaXplXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19sYWJlbFwiPlxuICAgICAgICA8Yj5UZXh0IHNpemU8L2I+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgY2xhc3M9XCJmZXNfX3ByZXZpZXdcIlxuICAgICAgICAgIDpzdHlsZT1cInsgZm9udFNpemU6IGAke3RleHRTaXplUHh9cHhgIH1cIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZWRpdG9yLXRleHQtc2l6ZS1wcmV2aWV3XCJcbiAgICAgICAgPltleHRydWRlcl0gbWF4X3RlbXA6IDI2NTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICA8c2VnLXBpY2tlclxuICAgICAgICAgIDpvcHRpb25zPVwidGV4dFNpemVPcHRpb25zXCJcbiAgICAgICAgICA6dmFsdWU9XCJ0ZXh0U2l6ZVwiXG4gICAgICAgICAgbGFiZWw9XCJUZXh0IHNpemVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZWRpdG9yLXRleHQtc2l6ZVwiXG4gICAgICAgICAgQGlucHV0PVwidGV4dFNpemUgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgIDxiPkFzayBiZWZvcmUgY2xvc2luZyB3aXRoIHVuc2F2ZWQgY2hhbmdlczwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgIDp2YWx1ZT1cImNvbmZpcm1EaXJ0eUVkaXRvckNsb3NlXCJcbiAgICAgICAgICBsYWJlbD1cIkFzayBiZWZvcmUgY2xvc2luZyB3aXRoIHVuc2F2ZWQgY2hhbmdlc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJlZGl0b3ItY29uZmlybS1jbG9zZVwiXG4gICAgICAgICAgQGlucHV0PVwiY29uZmlybURpcnR5RWRpdG9yQ2xvc2UgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgIDxiPk9wZW4gdGhlc2UgYXMgdGV4dDwvYj5cbiAgICAgICAgPHNwYW4+T3RoZXIgZmlsZXMgZG93bmxvYWQgaW5zdGVhZC48L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2wgbTMtc2V0X19jb250cm9sLS13aWRlXCI+XG4gICAgICAgIDx2LWNvbWJvYm94XG4gICAgICAgICAgdi1tb2RlbD1cImF1dG9FZGl0RXh0ZW5zaW9uc1wiXG4gICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICBkZW5zZVxuICAgICAgICAgIGhpZGUtc2VsZWN0ZWRcbiAgICAgICAgICBoaWRlLWRldGFpbHM9XCJhdXRvXCJcbiAgICAgICAgICBtdWx0aXBsZVxuICAgICAgICAgIHNtYWxsLWNoaXBzXG4gICAgICAgICAgYXBwZW5kLWljb249XCJcIlxuICAgICAgICAgIGRlbGV0YWJsZS1jaGlwc1xuICAgICAgICAgIGFyaWEtbGFiZWw9XCJPcGVuIHRoZXNlIGFzIHRleHRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgIDxiPlJlb3BlbiB3aGVyZSBJIGxlZnQgb2ZmPC9iPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgOm9wdGlvbnM9XCJyZXN0b3JlT3B0aW9uc1wiXG4gICAgICAgICAgOnZhbHVlPVwicmVzdG9yZVZpZXdTdGF0ZVwiXG4gICAgICAgICAgbGFiZWw9XCJSZW9wZW4gd2hlcmUgSSBsZWZ0IG9mZlwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJlZGl0b3ItcmVzdG9yZS12aWV3XCJcbiAgICAgICAgICBAaW5wdXQ9XCJyZXN0b3JlVmlld1N0YXRlID0gJGV2ZW50XCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19sYWJlbFwiPlxuICAgICAgICA8Yj5IaW50cyBhYm92ZSBzZWN0aW9uczwvYj5cbiAgICAgICAgPHNwYW4+TGlua3MgdG8gdGhlIEtsaXBwZXIgZG9jcyBhYm92ZSBlYWNoIFtzZWN0aW9uXS48L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2xcIj5cbiAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICA6dmFsdWU9XCJjb2RlTGVuc1wiXG4gICAgICAgICAgbGFiZWw9XCJIaW50cyBhYm92ZSBzZWN0aW9uc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJlZGl0b3ItaGludHNcIlxuICAgICAgICAgIEBpbnB1dD1cImNvZGVMZW5zID0gJGV2ZW50XCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19sYWJlbFwiPlxuICAgICAgICA8Yj57eyAkdCgnYXBwLnNldHRpbmcubGFiZWwucmVzZXQnKSB9fTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXNtXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImVkaXRvci1yZXNldFwiXG4gICAgICAgICAgQGNsaWNrPVwiaGFuZGxlUmVzZXRcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgJHQoJ2FwcC5zZXR0aW5nLmJ0bi5yZXNldCcpIH19XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJ0Avc3RvcmUvY29uZmlnL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBSZXN0b3JlVmlld1N0YXRlIH0gZnJvbSAnQC9zdG9yZS9jb25maWcvdHlwZXMnXG5pbXBvcnQgVG9nZ2xlU3dpdGNoIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1RvZ2dsZVN3aXRjaC52dWUnXG5pbXBvcnQgU2VnUGlja2VyIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1NlZ1BpY2tlci52dWUnXG5pbXBvcnQge1xuICBTQVZFX0FORF9SRVNUQVJUX09QVElPTlMsIFRFWFRfU0laRV9PUFRJT05TLCBlZGl0b3JGb250UHgsIGVkaXRvclRleHRTaXplLCBzYXZlQW5kUmVzdGFydExpbmUsIHNhdmVBbmRSZXN0YXJ0TW9kZSxcbiAgdHlwZSBFZGl0b3JUZXh0U2l6ZSwgdHlwZSBTYXZlQW5kUmVzdGFydFxufSBmcm9tICdAL3NlcnZpY2VzL3NldHRpbmdzL2VkaXRvcidcblxuLyoqXG4gKiBTZXR0aW5ncyDigLogRmlsZXMgYW5kIGVkaXRvciwgdGhlIGVkaXRvcidzIHJvd3M6IHdoYXQgU2F2ZSBhbmQgcmVzdGFydCBkb2VzXG4gKiAoQXNrIC8gQWx3YXlzIC8gTmV2ZXIpLCB0aGUgdG9wIGJhcidzIFNhdmUgYW5kIHJlc3RhcnQgKG1vdmVkIGhlcmUgZnJvbVxuICogR2VuZXJhbCwgc2FtZSBzYXZlZCB2YWx1ZSksIHRoZSB0ZXh0IHNpemUsIGFuZCBGbHVpZGQncyBvd24gZWRpdG9yIHJvd3MuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRvZ2dsZVN3aXRjaCwgU2VnUGlja2VyIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGVFZGl0b3JTZXR0aW5ncyBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluKSB7XG4gIHNhdmVBbmRSZXN0YXJ0T3B0aW9ucyA9IFNBVkVfQU5EX1JFU1RBUlRfT1BUSU9OU1xuICB0ZXh0U2l6ZU9wdGlvbnMgPSBURVhUX1NJWkVfT1BUSU9OU1xuXG4gIHNhdmUgKHBhdGg6IHN0cmluZywgdmFsdWU6IHVua25vd24pIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7IHBhdGgsIHZhbHVlLCBzZXJ2ZXI6IHRydWUgfSlcbiAgfVxuXG4gIGdldCBzYXZlQW5kUmVzdGFydCAoKTogU2F2ZUFuZFJlc3RhcnQge1xuICAgIHJldHVybiBzYXZlQW5kUmVzdGFydE1vZGUodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZWRpdG9yLnNhdmVBbmRSZXN0YXJ0KVxuICB9XG5cbiAgc2V0IHNhdmVBbmRSZXN0YXJ0ICh2YWx1ZTogU2F2ZUFuZFJlc3RhcnQpIHtcbiAgICB0aGlzLnNhdmUoJ3VpU2V0dGluZ3MuZWRpdG9yLnNhdmVBbmRSZXN0YXJ0Jywgc2F2ZUFuZFJlc3RhcnRNb2RlKHZhbHVlKSlcbiAgfVxuXG4gIGdldCBzYXZlQW5kUmVzdGFydExpbmUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNhdmVBbmRSZXN0YXJ0TGluZSh0aGlzLnNhdmVBbmRSZXN0YXJ0KVxuICB9XG5cbiAgZ2V0IHNob3dTYXZlQ29uZmlnQW5kUmVzdGFydCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5zaG93U2F2ZUNvbmZpZ0FuZFJlc3RhcnRcbiAgfVxuXG4gIHNldCBzaG93U2F2ZUNvbmZpZ0FuZFJlc3RhcnQgKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zYXZlKCd1aVNldHRpbmdzLmdlbmVyYWwuc2hvd1NhdmVDb25maWdBbmRSZXN0YXJ0JywgdmFsdWUpXG4gIH1cblxuICBnZXQgdGV4dFNpemUgKCk6IEVkaXRvclRleHRTaXplIHtcbiAgICByZXR1cm4gZWRpdG9yVGV4dFNpemUodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZWRpdG9yLnRleHRTaXplKVxuICB9XG5cbiAgc2V0IHRleHRTaXplICh2YWx1ZTogRWRpdG9yVGV4dFNpemUpIHtcbiAgICB0aGlzLnNhdmUoJ3VpU2V0dGluZ3MuZWRpdG9yLnRleHRTaXplJywgZWRpdG9yVGV4dFNpemUodmFsdWUpKVxuICB9XG5cbiAgZ2V0IHRleHRTaXplUHggKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIGVkaXRvckZvbnRQeCh0aGlzLnRleHRTaXplKVxuICB9XG5cbiAgZ2V0IGNvbmZpcm1EaXJ0eUVkaXRvckNsb3NlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZWRpdG9yLmNvbmZpcm1EaXJ0eUVkaXRvckNsb3NlXG4gIH1cblxuICBzZXQgY29uZmlybURpcnR5RWRpdG9yQ2xvc2UgKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zYXZlKCd1aVNldHRpbmdzLmVkaXRvci5jb25maXJtRGlydHlFZGl0b3JDbG9zZScsIHZhbHVlKVxuICB9XG5cbiAgZ2V0IGF1dG9FZGl0RXh0ZW5zaW9ucyAoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5lZGl0b3IuYXV0b0VkaXRFeHRlbnNpb25zXG4gIH1cblxuICBzZXQgYXV0b0VkaXRFeHRlbnNpb25zICh2YWx1ZTogc3RyaW5nW10pIHtcbiAgICB0aGlzLnNhdmUoJ3VpU2V0dGluZ3MuZWRpdG9yLmF1dG9FZGl0RXh0ZW5zaW9ucycsIFtcbiAgICAgIC4uLm5ldyBTZXQodmFsdWUubWFwKGV4dCA9PiBleHQuc3RhcnRzV2l0aCgnLicpID8gZXh0IDogYC4ke2V4dH1gKSlcbiAgICBdLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSkpXG4gIH1cblxuICBnZXQgcmVzdG9yZVZpZXdTdGF0ZSAoKTogUmVzdG9yZVZpZXdTdGF0ZSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmVkaXRvci5yZXN0b3JlVmlld1N0YXRlXG4gIH1cblxuICBzZXQgcmVzdG9yZVZpZXdTdGF0ZSAodmFsdWU6IFJlc3RvcmVWaWV3U3RhdGUpIHtcbiAgICB0aGlzLnNhdmUoJ3VpU2V0dGluZ3MuZWRpdG9yLnJlc3RvcmVWaWV3U3RhdGUnLCB2YWx1ZSlcbiAgfVxuXG4gIHJlYWRvbmx5IHJlc3RvcmVPcHRpb25zID0gW1xuICAgIHsgdmFsdWU6ICduZXZlcicsIGxhYmVsOiAnTmV2ZXInIH0sXG4gICAgeyB2YWx1ZTogJ3Nlc3Npb24nLCBsYWJlbDogJ1RoaXMgdmlzaXQnIH0sXG4gICAgeyB2YWx1ZTogJ2xvY2FsJywgbGFiZWw6ICdBbHdheXMnIH1cbiAgXVxuXG4gIGdldCBjb2RlTGVucyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmVkaXRvci5jb2RlTGVuc1xuICB9XG5cbiAgc2V0IGNvZGVMZW5zICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2F2ZSgndWlTZXR0aW5ncy5lZGl0b3IuY29kZUxlbnMnLCB2YWx1ZSlcbiAgfVxuXG4gIGhhbmRsZVJlc2V0ICgpIHtcbiAgICB0aGlzLnNhdmUoJ3VpU2V0dGluZ3MuZWRpdG9yJywgZGVmYXVsdFN0YXRlKCkudWlTZXR0aW5ncy5lZGl0b3IpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5mZXMge1xuICAgIG1hcmdpbi1ib3R0b206IDE2cHg7XG4gIH1cblxuICAubTMtc2V0X19sYWJlbCAuZmVzX19wcmV2aWV3IHtcbiAgICBtYXJnaW4tdG9wOiA0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgbW9ub3NwYWNlKTtcbiAgICBsaW5lLWhlaWdodDogMS40O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvc2V0dGluZ3MvRmlsZUVkaXRvclNldHRpbmdzLnZ1ZSJ9