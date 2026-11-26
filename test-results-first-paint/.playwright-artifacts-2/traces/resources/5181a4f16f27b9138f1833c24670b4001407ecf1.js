/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VIcon as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { EventBus } from "/src/eventBus.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let OverviewActions = class extends Mixins(StateMixin) {
  get busy() {
    return this.printerPrinting || this.printerPaused;
  }
  get jobsPath() {
    return scopedPath("/jobs", activeSlug());
  }
  upload() {
    EventBus.bus.$emit("upload-file");
  }
};
OverviewActions = __decorateClass([
  Component({})
], OverviewActions);
const _sfc_main = OverviewActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "ov-actions", attrs: { "data-tid": "overview-actions" } }, [_vm.busy ? [_c("button", { staticClass: "ov-actions__btn", attrs: { "type": "button", "disabled": !_vm.klippyReady, "data-tid": "overview-pause" }, on: { "click": function($event) {
    _vm.printerPaused ? _vm.resumePrint() : _vm.pausePrint();
  } } }, [_c(__unplugin_components_0, { attrs: { "small": "" } }, [_vm._v(" " + _vm._s(_vm.printerPaused ? "$resume" : "$pause") + " ")]), _vm._v(" " + _vm._s(_vm.printerPaused ? "Resume" : "Pause") + " ")], 1), _c("button", { staticClass: "ov-actions__btn ov-actions__btn--danger", attrs: { "type": "button", "disabled": !_vm.klippyReady, "data-tid": "overview-stop" }, on: { "click": function($event) {
    return _vm.cancelPrint();
  } } }, [_c(__unplugin_components_1, { attrs: { "small": "" } }, [_vm._v(" $stop ")]), _vm._v(" Stop print ")], 1)] : [_c("button", { staticClass: "ov-actions__btn", attrs: { "type": "button", "disabled": !_vm.socketConnected, "data-tid": "overview-upload" }, on: { "click": _vm.upload } }, [_c(__unplugin_components_2, { attrs: { "name": "upload", "small": "" } }), _vm._v(" Upload ")], 1), _c("router-link", { staticClass: "ov-actions__btn ov-actions__btn--primary", attrs: { "to": _vm.jobsPath, "data-tid": "overview-print-a-file" } }, [_c(__unplugin_components_3, { attrs: { "small": "" } }, [_vm._v(" $play ")]), _vm._v(" Print a file ")], 1)]], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/overview/OverviewActions.vue?vue&type=style&index=0&scoped=c6242e6c&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "c6242e6c",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/overview/OverviewActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUE0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFaQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJPdmVydmlld0FjdGlvbnMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwib3YtYWN0aW9uc1wiXG4gICAgZGF0YS10aWQ9XCJvdmVydmlldy1hY3Rpb25zXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSB2LWlmPVwiYnVzeVwiPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJvdi1hY3Rpb25zX19idG5cIlxuICAgICAgICA6ZGlzYWJsZWQ9XCIha2xpcHB5UmVhZHlcIlxuICAgICAgICBkYXRhLXRpZD1cIm92ZXJ2aWV3LXBhdXNlXCJcbiAgICAgICAgQGNsaWNrPVwicHJpbnRlclBhdXNlZCA/IHJlc3VtZVByaW50KCkgOiBwYXVzZVByaW50KClcIlxuICAgICAgPlxuICAgICAgICA8di1pY29uIHNtYWxsPlxuICAgICAgICAgIHt7IHByaW50ZXJQYXVzZWQgPyAnJHJlc3VtZScgOiAnJHBhdXNlJyB9fVxuICAgICAgICA8L3YtaWNvbj5cbiAgICAgICAge3sgcHJpbnRlclBhdXNlZCA/ICdSZXN1bWUnIDogJ1BhdXNlJyB9fVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cIm92LWFjdGlvbnNfX2J0biBvdi1hY3Rpb25zX19idG4tLWRhbmdlclwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFrbGlwcHlSZWFkeVwiXG4gICAgICAgIGRhdGEtdGlkPVwib3ZlcnZpZXctc3RvcFwiXG4gICAgICAgIEBjbGljaz1cImNhbmNlbFByaW50KClcIlxuICAgICAgPlxuICAgICAgICA8di1pY29uIHNtYWxsPlxuICAgICAgICAgICRzdG9wXG4gICAgICAgIDwvdi1pY29uPlxuICAgICAgICBTdG9wIHByaW50XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cIm92LWFjdGlvbnNfX2J0blwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFzb2NrZXRDb25uZWN0ZWRcIlxuICAgICAgICBkYXRhLXRpZD1cIm92ZXJ2aWV3LXVwbG9hZFwiXG4gICAgICAgIEBjbGljaz1cInVwbG9hZFwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cInVwbG9hZFwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgVXBsb2FkXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICBjbGFzcz1cIm92LWFjdGlvbnNfX2J0biBvdi1hY3Rpb25zX19idG4tLXByaW1hcnlcIlxuICAgICAgICA6dG89XCJqb2JzUGF0aFwiXG4gICAgICAgIGRhdGEtdGlkPVwib3ZlcnZpZXctcHJpbnQtYS1maWxlXCJcbiAgICAgID5cbiAgICAgICAgPHYtaWNvbiBzbWFsbD5cbiAgICAgICAgICAkcGxheVxuICAgICAgICA8L3YtaWNvbj5cbiAgICAgICAgUHJpbnQgYSBmaWxlXG4gICAgICA8L3JvdXRlci1saW5rPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHsgRXZlbnRCdXMgfSBmcm9tICdAL2V2ZW50QnVzJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IHNjb3BlZFBhdGggfSBmcm9tICdAL3JvdXRlci9wcmludGVyUGFnZVBhdGhzJ1xuXG4vKiogT3ZlcnZpZXcncyBwYWdlIGFjdGlvbnM6IFBhdXNlIGFuZCBTdG9wIHdoaWxlIGl0IHByaW50czsgVXBsb2FkIGFuZCBQcmludCBhIGZpbGUgd2hlbiBpdCBkb2Vzbid0LiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE92ZXJ2aWV3QWN0aW9ucyBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluKSB7XG4gIGdldCBidXN5ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkXG4gIH1cblxuICBnZXQgam9ic1BhdGggKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy9qb2JzJywgYWN0aXZlU2x1ZygpKVxuICB9XG5cbiAgdXBsb2FkICgpIHtcbiAgICBFdmVudEJ1cy5idXMuJGVtaXQoJ3VwbG9hZC1maWxlJylcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm92LWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAub3YtYWN0aW9uc19fYnRuIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIGhlaWdodDogNDBweDtcbiAgICBwYWRkaW5nOiAwIDE2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuXG4gICAgLnYtaWNvbiB7XG4gICAgICBjb2xvcjogaW5oZXJpdCAhaW1wb3J0YW50O1xuICAgIH1cblxuICAgICY6ZGlzYWJsZWQge1xuICAgICAgb3BhY2l0eTogMC40NTtcbiAgICAgIGN1cnNvcjogZGVmYXVsdDtcbiAgICB9XG4gIH1cblxuICAub3YtYWN0aW9uc19fYnRuLS1wcmltYXJ5IHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLW9uLWFjY2VudCwgIzAwMjAxZSkgIWltcG9ydGFudDtcbiAgfVxuXG4gIC5vdi1hY3Rpb25zX19idG4tLWRhbmdlciB7XG4gICAgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1kYW5nZXIpIDE2JSwgdHJhbnNwYXJlbnQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKSAhaW1wb3J0YW50O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvb3ZlcnZpZXcvT3ZlcnZpZXdBY3Rpb25zLnZ1ZSJ9