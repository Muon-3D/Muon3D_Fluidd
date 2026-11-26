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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import SegPicker from "/src/components/control/SegPicker.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
let FileBrowserSettings = class extends Mixins(MuonGatesMixin) {
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  get developerLink() {
    return `${scopedPath("/settings", activeSlug())}#developer`;
  }
  get textSortOrder() {
    return this.$store.state.config.uiSettings.general.textSortOrder;
  }
  set textSortOrder(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.general.textSortOrder",
      value,
      server: true
    });
  }
  get showHiddenFiles() {
    return !!this.$store.state.config.uiSettings.fileSystem.showHiddenFiles;
  }
  set showHiddenFiles(value) {
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.fileSystem.showHiddenFiles", value, server: true });
  }
  sortOptions = [
    { value: "default", label: "A\u2013Z" },
    { value: "numeric-prefix", label: "Numbers in order" },
    { value: "version", label: "Versions" }
  ];
};
FileBrowserSettings = __decorateClass([
  Component({ components: { SegPicker, ToggleSwitch } })
], FileBrowserSettings);
const _sfc_main = FileBrowserSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { attrs: { "id": "browser" } }, [_vm.isMuonPrinter === true && !_vm.devModeEnabled ? _c("div", { staticClass: "files-devmode", attrs: { "data-tid": "files-devmode-note" } }, [_c("p", { staticClass: "files-devmode__title" }, [_vm._v(" Developer mode is off. ")]), _c("p", [_vm._v("On " + _vm._s(_vm.printerName) + " the config folder shows only in Developer mode; calibration and the Muon3D defaults stay open. Your print files in Jobs aren't affected.")]), _c("router-link", { attrs: { "to": _vm.developerLink, "data-tid": "files-devmode-link" } }, [_vm._v(" Developer mode \u203A ")])], 1) : _vm._e(), _c("section", { staticClass: "m3-set", attrs: { "data-tid": "files-lists" } }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" Lists of files ")]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(0), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "options": _vm.sortOptions, "value": _vm.textSortOrder, "label": "Sort names", "data-tid": "files-sort-names" }, on: { "input": function($event) {
    _vm.textSortOrder = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(1), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.showHiddenFiles, "label": "Show hidden files", "data-tid": "files-show-hidden" }, on: { "input": function($event) {
    _vm.showHiddenFiles = $event;
  } } })], 1)])])]);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Sort names")]), _c("span", [_vm._v('Numbers in order means "part 2" comes before "part 10".')])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Show hidden files")]), _c("span", [_vm._v("Names starting with a dot.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/FileBrowserSettings.vue?vue&type=style&index=0&scoped=3e7afd00&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3e7afd00",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/FileBrowserSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTJEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFsQ0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiRmlsZUJyb3dzZXJTZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2IGlkPVwiYnJvd3NlclwiPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJpc011b25QcmludGVyID09PSB0cnVlICYmICFkZXZNb2RlRW5hYmxlZFwiXG4gICAgICBjbGFzcz1cImZpbGVzLWRldm1vZGVcIlxuICAgICAgZGF0YS10aWQ9XCJmaWxlcy1kZXZtb2RlLW5vdGVcIlxuICAgID5cbiAgICAgIDxwIGNsYXNzPVwiZmlsZXMtZGV2bW9kZV9fdGl0bGVcIj5cbiAgICAgICAgRGV2ZWxvcGVyIG1vZGUgaXMgb2ZmLlxuICAgICAgPC9wPlxuICAgICAgPHA+T24ge3sgcHJpbnRlck5hbWUgfX0gdGhlIGNvbmZpZyBmb2xkZXIgc2hvd3Mgb25seSBpbiBEZXZlbG9wZXIgbW9kZTsgY2FsaWJyYXRpb24gYW5kIHRoZSBNdW9uM0QgZGVmYXVsdHMgc3RheSBvcGVuLiBZb3VyIHByaW50IGZpbGVzIGluIEpvYnMgYXJlbid0IGFmZmVjdGVkLjwvcD5cbiAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICA6dG89XCJkZXZlbG9wZXJMaW5rXCJcbiAgICAgICAgZGF0YS10aWQ9XCJmaWxlcy1kZXZtb2RlLWxpbmtcIlxuICAgICAgPlxuICAgICAgICBEZXZlbG9wZXIgbW9kZSDigLpcbiAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgPC9kaXY+XG4gICAgPHNlY3Rpb25cbiAgICAgIGNsYXNzPVwibTMtc2V0XCJcbiAgICAgIGRhdGEtdGlkPVwiZmlsZXMtbGlzdHNcIlxuICAgID5cbiAgICAgIDxoMiBjbGFzcz1cIm0zLXNldF9fdGl0bGVcIj5cbiAgICAgICAgTGlzdHMgb2YgZmlsZXNcbiAgICAgIDwvaDI+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fbGFiZWxcIj5cbiAgICAgICAgICA8Yj5Tb3J0IG5hbWVzPC9iPlxuICAgICAgICAgIDxzcGFuPk51bWJlcnMgaW4gb3JkZXIgbWVhbnMgXCJwYXJ0IDJcIiBjb21lcyBiZWZvcmUgXCJwYXJ0IDEwXCIuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgICA6b3B0aW9ucz1cInNvcnRPcHRpb25zXCJcbiAgICAgICAgICAgIDp2YWx1ZT1cInRleHRTb3J0T3JkZXJcIlxuICAgICAgICAgICAgbGFiZWw9XCJTb3J0IG5hbWVzXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiZmlsZXMtc29ydC1uYW1lc1wiXG4gICAgICAgICAgICBAaW5wdXQ9XCJ0ZXh0U29ydE9yZGVyID0gJGV2ZW50XCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgPGI+U2hvdyBoaWRkZW4gZmlsZXM8L2I+XG4gICAgICAgICAgPHNwYW4+TmFtZXMgc3RhcnRpbmcgd2l0aCBhIGRvdC48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICAgIDp2YWx1ZT1cInNob3dIaWRkZW5GaWxlc1wiXG4gICAgICAgICAgICBsYWJlbD1cIlNob3cgaGlkZGVuIGZpbGVzXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiZmlsZXMtc2hvdy1oaWRkZW5cIlxuICAgICAgICAgICAgQGlucHV0PVwic2hvd0hpZGRlbkZpbGVzID0gJGV2ZW50XCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE11b25HYXRlc01peGluIGZyb20gJ0AvbWl4aW5zL211b24tZ2F0ZXMnXG5pbXBvcnQgU2VnUGlja2VyIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1NlZ1BpY2tlci52dWUnXG5pbXBvcnQgVG9nZ2xlU3dpdGNoIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1RvZ2dsZVN3aXRjaC52dWUnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBwcmludGVyTmFtZVBhcnRzIH0gZnJvbSAnQC91dGlsL3ByaW50ZXItbmFtZSdcblxuLyoqIFNldHRpbmdzIOKAuiBGaWxlcyBhbmQgZWRpdG9yIChLQU4tMTk2MCwgZmlsZXMgc3Rvcnlib2FyZCk6IHNheXMgdXAgZnJvbnQgd2hhdCBEZXZlbG9wZXIgbW9kZSBtZWFucyBmb3IgdGhlc2UgZmlsZXMgb24gYSBNdW9uIHByaW50ZXIuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBTZWdQaWNrZXIsIFRvZ2dsZVN3aXRjaCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlQnJvd3NlclNldHRpbmdzIGV4dGVuZHMgTWl4aW5zKE11b25HYXRlc01peGluKSB7XG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJpbnRlck5hbWVQYXJ0cyh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0RGlzcGxheU5hbWUnXSBhcyBzdHJpbmcpLm5hbWVcbiAgfVxuXG4gIGdldCBkZXZlbG9wZXJMaW5rICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpfSNkZXZlbG9wZXJgXG4gIH1cblxuICBnZXQgdGV4dFNvcnRPcmRlciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwudGV4dFNvcnRPcmRlclxuICB9XG5cbiAgc2V0IHRleHRTb3J0T3JkZXIgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLnRleHRTb3J0T3JkZXInLFxuICAgICAgdmFsdWUsXG4gICAgICBzZXJ2ZXI6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgZ2V0IHNob3dIaWRkZW5GaWxlcyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZmlsZVN5c3RlbS5zaG93SGlkZGVuRmlsZXNcbiAgfVxuXG4gIHNldCBzaG93SGlkZGVuRmlsZXMgKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywgeyBwYXRoOiAndWlTZXR0aW5ncy5maWxlU3lzdGVtLnNob3dIaWRkZW5GaWxlcycsIHZhbHVlLCBzZXJ2ZXI6IHRydWUgfSlcbiAgfVxuXG4gIHJlYWRvbmx5IHNvcnRPcHRpb25zID0gW1xuICAgIHsgdmFsdWU6ICdkZWZhdWx0JywgbGFiZWw6ICdB4oCTWicgfSxcbiAgICB7IHZhbHVlOiAnbnVtZXJpYy1wcmVmaXgnLCBsYWJlbDogJ051bWJlcnMgaW4gb3JkZXInIH0sXG4gICAgeyB2YWx1ZTogJ3ZlcnNpb24nLCBsYWJlbDogJ1ZlcnNpb25zJyB9XG4gIF1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5maWxlcy1kZXZtb2RlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA0cHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMTJweDtcbiAgICBwYWRkaW5nOiAxNHB4IDE2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgfVxuICB9XG5cbiAgLmZpbGVzLWRldm1vZGVfX3RpdGxlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9GaWxlQnJvd3NlclNldHRpbmdzLnZ1ZSJ9