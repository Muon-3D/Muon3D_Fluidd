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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import { filesView } from "/src/services/files/view.ts";
let FilesActions = class extends Vue {
  view = filesView;
  options = [
    { value: "config", label: "Config files" },
    { value: "other", label: "Other files" }
  ];
};
FilesActions = __decorateClass([
  Component({ components: { SegPicker } })
], FilesActions);
const _sfc_main = FilesActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("seg-picker", { staticClass: "files-actions", attrs: { "options": _vm.options, "value": _vm.view.pane, "label": "Files", "data-tid": "files-actions" }, on: { "input": function($event) {
    _vm.view.pane = $event;
  } } });
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/files/FilesActions.vue?vue&type=style&index=0&scoped=662c1162&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "662c1162",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/files/FilesActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVlBO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVBBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkZpbGVzQWN0aW9ucy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VnLXBpY2tlclxuICAgIGNsYXNzPVwiZmlsZXMtYWN0aW9uc1wiXG4gICAgOm9wdGlvbnM9XCJvcHRpb25zXCJcbiAgICA6dmFsdWU9XCJ2aWV3LnBhbmVcIlxuICAgIGxhYmVsPVwiRmlsZXNcIlxuICAgIGRhdGEtdGlkPVwiZmlsZXMtYWN0aW9uc1wiXG4gICAgQGlucHV0PVwidmlldy5wYW5lID0gJGV2ZW50XCJcbiAgLz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU2VnUGlja2VyLCB7IHR5cGUgU2VnT3B0aW9uIH0gZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvU2VnUGlja2VyLnZ1ZSdcbmltcG9ydCB7IGZpbGVzVmlldyB9IGZyb20gJ0Avc2VydmljZXMvZmlsZXMvdmlldydcblxuLyoqIEZpbGVzJyBwYWdlLWhlYWRlciBjaG9pY2Ugb24gYSBwaG9uZTogdGhlIGNvbmZpZyBmaWxlcywgb3IgdGhlIG90aGVyIGZpbGVzLiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgU2VnUGlja2VyIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGVzQWN0aW9ucyBleHRlbmRzIFZ1ZSB7XG4gIHZpZXcgPSBmaWxlc1ZpZXdcblxuICBvcHRpb25zOiBTZWdPcHRpb25bXSA9IFtcbiAgICB7IHZhbHVlOiAnY29uZmlnJywgbGFiZWw6ICdDb25maWcgZmlsZXMnIH0sXG4gICAgeyB2YWx1ZTogJ290aGVyJywgbGFiZWw6ICdPdGhlciBmaWxlcycgfVxuICBdXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuZmlsZXMtYWN0aW9ucyB7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvZmlsZXMvRmlsZXNBY3Rpb25zLnZ1ZSJ9