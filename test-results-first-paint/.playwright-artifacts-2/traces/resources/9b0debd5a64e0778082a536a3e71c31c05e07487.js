/* unplugin-vue-components disabled */import __unplugin_components_24 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_23 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_22 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSelect as __unplugin_components_21 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_20 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_19 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_17 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_14 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_11 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_8 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSelect as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppSetting.vue";
import { VCard as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSubheader as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { defaultState } from "/src/store/config/state.ts";
import StateMixin from "/src/mixins/state.ts";
let SpoolmanSettings = class extends Mixins(StateMixin) {
  get autoSpoolSelectionDialog() {
    return this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog;
  }
  set autoSpoolSelectionDialog(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.autoSpoolSelectionDialog",
      value,
      server: true
    });
  }
  get enabledWebcams() {
    return this.$store.getters["webcams/getEnabledWebcams"];
  }
  get supportedCameras() {
    return [
      {
        text: this.$tc("app.setting.label.none"),
        value: null
      },
      ...this.enabledWebcams.map((camera) => ({
        text: camera.name,
        value: camera.uid,
        disabled: camera.service === "iframe"
      }))
    ];
  }
  get autoOpenQRDetectionCameraId() {
    return this.$store.state.config.uiSettings.spoolman.autoOpenQRDetectionCamera;
  }
  set autoOpenQRDetectionCameraId(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.autoOpenQRDetectionCamera",
      value,
      server: true
    });
  }
  get preferDeviceCamera() {
    return this.$store.state.config.uiSettings.spoolman.preferDeviceCamera;
  }
  set preferDeviceCamera(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.preferDeviceCamera",
      value,
      server: true
    });
  }
  get autoSelectSpoolOnMatch() {
    return this.$store.state.config.uiSettings.spoolman.autoSelectSpoolOnMatch;
  }
  set autoSelectSpoolOnMatch(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.autoSelectSpoolOnMatch",
      value,
      server: true
    });
  }
  get warnOnNotEnoughFilament() {
    return this.$store.state.config.uiSettings.spoolman.warnOnNotEnoughFilament;
  }
  set warnOnNotEnoughFilament(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.warnOnNotEnoughFilament",
      value,
      server: true
    });
  }
  get warnOnFilamentTypeMismatch() {
    return this.$store.state.config.uiSettings.spoolman.warnOnFilamentTypeMismatch;
  }
  set warnOnFilamentTypeMismatch(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.warnOnFilamentTypeMismatch",
      value,
      server: true
    });
  }
  get remainingFilamentUnit() {
    return this.$store.state.config.uiSettings.spoolman.remainingFilamentUnit;
  }
  set remainingFilamentUnit(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.remainingFilamentUnit",
      value,
      server: true
    });
  }
  handleReset() {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman",
      value: defaultState().uiSettings.spoolman,
      server: true
    });
  }
};
SpoolmanSettings = __decorateClass([
  Component({
    components: {}
  })
], SpoolmanSettings);
const _sfc_main = SpoolmanSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_c(__unplugin_components_0, { attrs: { "id": "spoolman" } }, [_vm._v(" " + _vm._s(_vm.$t("app.spoolman.title.spoolman")) + " ")]), _c(__unplugin_components_1, { staticClass: "mb-4", attrs: { "elevation": 5, "dense": "" } }, [_c(__unplugin_components_2, { attrs: { "title": _vm.$t("app.spoolman.setting.show_spool_selection_dialog_on_print_start") } }, [_c(__unplugin_components_3, { staticClass: "mt-0 mb-4", attrs: { "hide-details": "" }, model: { value: _vm.autoSpoolSelectionDialog, callback: function($$v) {
    _vm.autoSpoolSelectionDialog = $$v;
  }, expression: "autoSpoolSelectionDialog" } })], 1), _c(__unplugin_components_4), _c(__unplugin_components_5, { attrs: { "title": _vm.$tc("app.spoolman.setting.auto_open_qr_camera") } }, [_c(__unplugin_components_6, { attrs: { "filled": "", "dense": "", "single-line": "", "hide-details": "auto", "items": _vm.supportedCameras }, model: { value: _vm.autoOpenQRDetectionCameraId, callback: function($$v) {
    _vm.autoOpenQRDetectionCameraId = $$v;
  }, expression: "autoOpenQRDetectionCameraId" } })], 1), _c(__unplugin_components_7), _c(__unplugin_components_8, { attrs: { "title": _vm.$t("app.spoolman.setting.prefer_device_camera") } }, [_c(__unplugin_components_9, { staticClass: "mt-0 mb-4", attrs: { "hide-details": "" }, model: { value: _vm.preferDeviceCamera, callback: function($$v) {
    _vm.preferDeviceCamera = $$v;
  }, expression: "preferDeviceCamera" } })], 1), _c(__unplugin_components_10), _c(__unplugin_components_11, { attrs: { "title": _vm.$t("app.spoolman.setting.auto_select_spool_on_match") } }, [_c(__unplugin_components_12, { staticClass: "mt-0 mb-4", attrs: { "hide-details": "" }, model: { value: _vm.autoSelectSpoolOnMatch, callback: function($$v) {
    _vm.autoSelectSpoolOnMatch = $$v;
  }, expression: "autoSelectSpoolOnMatch" } })], 1), _c(__unplugin_components_13), _c(__unplugin_components_14, { attrs: { "title": _vm.$t("app.spoolman.setting.warn_on_not_enough_filament") } }, [_c(__unplugin_components_15, { staticClass: "mt-0 mb-4", attrs: { "hide-details": "" }, model: { value: _vm.warnOnNotEnoughFilament, callback: function($$v) {
    _vm.warnOnNotEnoughFilament = $$v;
  }, expression: "warnOnNotEnoughFilament" } })], 1), _c(__unplugin_components_16), _c(__unplugin_components_17, { attrs: { "title": _vm.$t("app.spoolman.setting.warn_on_filament_type_mismatch") } }, [_c(__unplugin_components_18, { staticClass: "mt-0 mb-4", attrs: { "hide-details": "" }, model: { value: _vm.warnOnFilamentTypeMismatch, callback: function($$v) {
    _vm.warnOnFilamentTypeMismatch = $$v;
  }, expression: "warnOnFilamentTypeMismatch" } })], 1), _c(__unplugin_components_19), _c(__unplugin_components_20, { attrs: { "title": _vm.$tc("app.spoolman.setting.remaining_filament_unit") } }, [_c(__unplugin_components_21, { attrs: { "filled": "", "dense": "", "single-line": "", "hide-details": "auto", "items": [
    { text: _vm.$tc("app.spoolman.label.weight"), value: "weight" },
    { text: _vm.$tc("app.spoolman.label.length"), value: "length" }
  ] }, model: { value: _vm.remainingFilamentUnit, callback: function($$v) {
    _vm.remainingFilamentUnit = $$v;
  }, expression: "remainingFilamentUnit" } })], 1), _c(__unplugin_components_22), _c(__unplugin_components_23, { attrs: { "title": _vm.$t("app.setting.label.reset") } }, [_c(__unplugin_components_24, { attrs: { "outlined": "", "small": "", "color": "primary" }, on: { "click": _vm.handleReset } }, [_vm._v(" " + _vm._s(_vm.$t("app.setting.btn.reset")) + " ")])], 1)], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/SpoolmanSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErR0E7QUFDQTtBQUNBO0FBTUE7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsdUJBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBL0dBO0FBQUEsRUFIQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiU3Bvb2xtYW5TZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2PlxuICAgIDx2LXN1YmhlYWRlciBpZD1cInNwb29sbWFuXCI+XG4gICAgICB7eyAkdCgnYXBwLnNwb29sbWFuLnRpdGxlLnNwb29sbWFuJykgfX1cbiAgICA8L3Ytc3ViaGVhZGVyPlxuICAgIDx2LWNhcmRcbiAgICAgIDplbGV2YXRpb249XCI1XCJcbiAgICAgIGRlbnNlXG4gICAgICBjbGFzcz1cIm1iLTRcIlxuICAgID5cbiAgICAgIDxhcHAtc2V0dGluZ1xuICAgICAgICA6dGl0bGU9XCIkdCgnYXBwLnNwb29sbWFuLnNldHRpbmcuc2hvd19zcG9vbF9zZWxlY3Rpb25fZGlhbG9nX29uX3ByaW50X3N0YXJ0JylcIlxuICAgICAgPlxuICAgICAgICA8di1zd2l0Y2hcbiAgICAgICAgICB2LW1vZGVsPVwiYXV0b1Nwb29sU2VsZWN0aW9uRGlhbG9nXCJcbiAgICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgICBjbGFzcz1cIm10LTAgbWItNFwiXG4gICAgICAgIC8+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuXG4gICAgICA8di1kaXZpZGVyIC8+XG4gICAgICA8YXBwLXNldHRpbmdcbiAgICAgICAgOnRpdGxlPVwiJHRjKCdhcHAuc3Bvb2xtYW4uc2V0dGluZy5hdXRvX29wZW5fcXJfY2FtZXJhJylcIlxuICAgICAgPlxuICAgICAgICA8di1zZWxlY3RcbiAgICAgICAgICB2LW1vZGVsPVwiYXV0b09wZW5RUkRldGVjdGlvbkNhbWVyYUlkXCJcbiAgICAgICAgICBmaWxsZWRcbiAgICAgICAgICBkZW5zZVxuICAgICAgICAgIHNpbmdsZS1saW5lXG4gICAgICAgICAgaGlkZS1kZXRhaWxzPVwiYXV0b1wiXG4gICAgICAgICAgOml0ZW1zPVwic3VwcG9ydGVkQ2FtZXJhc1wiXG4gICAgICAgIC8+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuXG4gICAgICA8di1kaXZpZGVyIC8+XG4gICAgICA8YXBwLXNldHRpbmdcbiAgICAgICAgOnRpdGxlPVwiJHQoJ2FwcC5zcG9vbG1hbi5zZXR0aW5nLnByZWZlcl9kZXZpY2VfY2FtZXJhJylcIlxuICAgICAgPlxuICAgICAgICA8di1zd2l0Y2hcbiAgICAgICAgICB2LW1vZGVsPVwicHJlZmVyRGV2aWNlQ2FtZXJhXCJcbiAgICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgICBjbGFzcz1cIm10LTAgbWItNFwiXG4gICAgICAgIC8+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuXG4gICAgICA8di1kaXZpZGVyIC8+XG4gICAgICA8YXBwLXNldHRpbmdcbiAgICAgICAgOnRpdGxlPVwiJHQoJ2FwcC5zcG9vbG1hbi5zZXR0aW5nLmF1dG9fc2VsZWN0X3Nwb29sX29uX21hdGNoJylcIlxuICAgICAgPlxuICAgICAgICA8di1zd2l0Y2hcbiAgICAgICAgICB2LW1vZGVsPVwiYXV0b1NlbGVjdFNwb29sT25NYXRjaFwiXG4gICAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgICAgY2xhc3M9XCJtdC0wIG1iLTRcIlxuICAgICAgICAvPlxuICAgICAgPC9hcHAtc2V0dGluZz5cblxuICAgICAgPHYtZGl2aWRlciAvPlxuICAgICAgPGFwcC1zZXR0aW5nXG4gICAgICAgIDp0aXRsZT1cIiR0KCdhcHAuc3Bvb2xtYW4uc2V0dGluZy53YXJuX29uX25vdF9lbm91Z2hfZmlsYW1lbnQnKVwiXG4gICAgICA+XG4gICAgICAgIDx2LXN3aXRjaFxuICAgICAgICAgIHYtbW9kZWw9XCJ3YXJuT25Ob3RFbm91Z2hGaWxhbWVudFwiXG4gICAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgICAgY2xhc3M9XCJtdC0wIG1iLTRcIlxuICAgICAgICAvPlxuICAgICAgPC9hcHAtc2V0dGluZz5cblxuICAgICAgPHYtZGl2aWRlciAvPlxuICAgICAgPGFwcC1zZXR0aW5nXG4gICAgICAgIDp0aXRsZT1cIiR0KCdhcHAuc3Bvb2xtYW4uc2V0dGluZy53YXJuX29uX2ZpbGFtZW50X3R5cGVfbWlzbWF0Y2gnKVwiXG4gICAgICA+XG4gICAgICAgIDx2LXN3aXRjaFxuICAgICAgICAgIHYtbW9kZWw9XCJ3YXJuT25GaWxhbWVudFR5cGVNaXNtYXRjaFwiXG4gICAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgICAgY2xhc3M9XCJtdC0wIG1iLTRcIlxuICAgICAgICAvPlxuICAgICAgPC9hcHAtc2V0dGluZz5cblxuICAgICAgPHYtZGl2aWRlciAvPlxuICAgICAgPGFwcC1zZXR0aW5nXG4gICAgICAgIDp0aXRsZT1cIiR0YygnYXBwLnNwb29sbWFuLnNldHRpbmcucmVtYWluaW5nX2ZpbGFtZW50X3VuaXQnKVwiXG4gICAgICA+XG4gICAgICAgIDx2LXNlbGVjdFxuICAgICAgICAgIHYtbW9kZWw9XCJyZW1haW5pbmdGaWxhbWVudFVuaXRcIlxuICAgICAgICAgIGZpbGxlZFxuICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgc2luZ2xlLWxpbmVcbiAgICAgICAgICBoaWRlLWRldGFpbHM9XCJhdXRvXCJcbiAgICAgICAgICA6aXRlbXM9XCJbXG4gICAgICAgICAgICB7dGV4dDogJHRjKCdhcHAuc3Bvb2xtYW4ubGFiZWwud2VpZ2h0JyksIHZhbHVlOiAnd2VpZ2h0J30sXG4gICAgICAgICAgICB7dGV4dDogJHRjKCdhcHAuc3Bvb2xtYW4ubGFiZWwubGVuZ3RoJyksIHZhbHVlOiAnbGVuZ3RoJ31cbiAgICAgICAgICBdXCJcbiAgICAgICAgLz5cbiAgICAgIDwvYXBwLXNldHRpbmc+XG5cbiAgICAgIDx2LWRpdmlkZXIgLz5cbiAgICAgIDxhcHAtc2V0dGluZyA6dGl0bGU9XCIkdCgnYXBwLnNldHRpbmcubGFiZWwucmVzZXQnKVwiPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIEBjbGljaz1cImhhbmRsZVJlc2V0XCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7ICR0KCdhcHAuc2V0dGluZy5idG4ucmVzZXQnKSB9fVxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuICAgIDwvdi1jYXJkPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBkZWZhdWx0U3RhdGUgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy9zdGF0ZSdcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBXZWJjYW1Db25maWcgfSBmcm9tICdAL3N0b3JlL3dlYmNhbXMvdHlwZXMnXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7fVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNwb29sbWFuU2V0dGluZ3MgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBnZXQgYXV0b1Nwb29sU2VsZWN0aW9uRGlhbG9nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4uYXV0b1Nwb29sU2VsZWN0aW9uRGlhbG9nXG4gIH1cblxuICBzZXQgYXV0b1Nwb29sU2VsZWN0aW9uRGlhbG9nICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLnNwb29sbWFuLmF1dG9TcG9vbFNlbGVjdGlvbkRpYWxvZycsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBnZXQgZW5hYmxlZFdlYmNhbXMgKCk6IFdlYmNhbUNvbmZpZ1tdIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snd2ViY2Ftcy9nZXRFbmFibGVkV2ViY2FtcyddIGFzIFdlYmNhbUNvbmZpZ1tdXG4gIH1cblxuICBnZXQgc3VwcG9ydGVkQ2FtZXJhcyAoKTogQXJyYXk8eyB0ZXh0Pzogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCwgZGlzYWJsZWQ/OiBib29sZWFuIH0+IHtcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICB0ZXh0OiB0aGlzLiR0YygnYXBwLnNldHRpbmcubGFiZWwubm9uZScpLFxuICAgICAgICB2YWx1ZTogbnVsbFxuICAgICAgfSxcbiAgICAgIC4uLnRoaXMuZW5hYmxlZFdlYmNhbXNcbiAgICAgICAgLm1hcChjYW1lcmEgPT4gKHtcbiAgICAgICAgICB0ZXh0OiBjYW1lcmEubmFtZSxcbiAgICAgICAgICB2YWx1ZTogY2FtZXJhLnVpZCxcbiAgICAgICAgICBkaXNhYmxlZDogY2FtZXJhLnNlcnZpY2UgPT09ICdpZnJhbWUnXG4gICAgICAgIH0pKVxuICAgIF1cbiAgfVxuXG4gIGdldCBhdXRvT3BlblFSRGV0ZWN0aW9uQ2FtZXJhSWQgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5zcG9vbG1hbi5hdXRvT3BlblFSRGV0ZWN0aW9uQ2FtZXJhXG4gIH1cblxuICBzZXQgYXV0b09wZW5RUkRldGVjdGlvbkNhbWVyYUlkICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywge1xuICAgICAgcGF0aDogJ3VpU2V0dGluZ3Muc3Bvb2xtYW4uYXV0b09wZW5RUkRldGVjdGlvbkNhbWVyYScsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBnZXQgcHJlZmVyRGV2aWNlQ2FtZXJhICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4ucHJlZmVyRGV2aWNlQ2FtZXJhXG4gIH1cblxuICBzZXQgcHJlZmVyRGV2aWNlQ2FtZXJhICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLnNwb29sbWFuLnByZWZlckRldmljZUNhbWVyYScsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBnZXQgYXV0b1NlbGVjdFNwb29sT25NYXRjaCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLnNwb29sbWFuLmF1dG9TZWxlY3RTcG9vbE9uTWF0Y2hcbiAgfVxuXG4gIHNldCBhdXRvU2VsZWN0U3Bvb2xPbk1hdGNoICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLnNwb29sbWFuLmF1dG9TZWxlY3RTcG9vbE9uTWF0Y2gnLFxuICAgICAgdmFsdWUsXG4gICAgICBzZXJ2ZXI6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgZ2V0IHdhcm5Pbk5vdEVub3VnaEZpbGFtZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4ud2Fybk9uTm90RW5vdWdoRmlsYW1lbnRcbiAgfVxuXG4gIHNldCB3YXJuT25Ob3RFbm91Z2hGaWxhbWVudCAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5zcG9vbG1hbi53YXJuT25Ob3RFbm91Z2hGaWxhbWVudCcsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBnZXQgd2Fybk9uRmlsYW1lbnRUeXBlTWlzbWF0Y2ggKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5zcG9vbG1hbi53YXJuT25GaWxhbWVudFR5cGVNaXNtYXRjaFxuICB9XG5cbiAgc2V0IHdhcm5PbkZpbGFtZW50VHlwZU1pc21hdGNoICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLnNwb29sbWFuLndhcm5PbkZpbGFtZW50VHlwZU1pc21hdGNoJyxcbiAgICAgIHZhbHVlLFxuICAgICAgc2VydmVyOiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIGdldCByZW1haW5pbmdGaWxhbWVudFVuaXQgKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5zcG9vbG1hbi5yZW1haW5pbmdGaWxhbWVudFVuaXRcbiAgfVxuXG4gIHNldCByZW1haW5pbmdGaWxhbWVudFVuaXQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5zcG9vbG1hbi5yZW1haW5pbmdGaWxhbWVudFVuaXQnLFxuICAgICAgdmFsdWUsXG4gICAgICBzZXJ2ZXI6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgaGFuZGxlUmVzZXQgKCkge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLnNwb29sbWFuJyxcbiAgICAgIHZhbHVlOiBkZWZhdWx0U3RhdGUoKS51aVNldHRpbmdzLnNwb29sbWFuLFxuICAgICAgc2VydmVyOiB0cnVlXG4gICAgfSlcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9TcG9vbG1hblNldHRpbmdzLnZ1ZSJ9