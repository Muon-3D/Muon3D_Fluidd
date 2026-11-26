/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { SocketActions } from "/src/api/socketActions.ts";
import { timelapsePage } from "/src/services/timelapse/page-state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let TimelapseActions = class extends Mixins(StateMixin) {
  page = timelapsePage;
  renderOpen = false;
  get settingsPath() {
    return `${scopedPath("/settings", activeSlug())}#timelapse`;
  }
  get frameCount() {
    return this.$store.getters["timelapse/getLastFrame"]?.uniqueCount ?? 0;
  }
  get rendering() {
    const status = this.$store.getters["timelapse/getRenderStatus"];
    return !!status && status.status !== "success";
  }
  get canRender() {
    return this.socketConnected && this.frameCount > 0 && !this.rendering;
  }
  get canSaveFrames() {
    return this.socketConnected && this.frameCount > 0 && !this.hasWait(this.$waits.onTimelapseSaveFrame);
  }
  saveFrames() {
    SocketActions.machineTimelapseSaveFrames(this.$waits.onTimelapseSaveFrame);
  }
};
TimelapseActions = __decorateClass([
  Component({ components: { TimelapseRenderSettingsDialog: () => import("/src/components/widgets/timelapse/TimelapseRenderSettingsDialog.vue") } })
], TimelapseActions);
const _sfc_main = TimelapseActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "tl-actions", attrs: { "data-tid": "timelapse-actions" } }, [_c("router-link", { staticClass: "cbtn tl-actions__settings", attrs: { "to": _vm.settingsPath, "data-tid": "timelapse-settings-link" } }, [_vm._v(" Timelapse settings "), _c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v("\u203A")])]), _c(__unplugin_components_0, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "tl-actions__round", attrs: { "type": "button", "aria-label": "More about timelapses", "data-tid": "timelapse-more" } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "more" } })], 1)];
  } }]) }, [_c(__unplugin_components_2, { attrs: { "dense": "" } }, [_c(__unplugin_components_3, { attrs: { "disabled": !_vm.canRender, "data-tid": "timelapse-render" }, on: { "click": function($event) {
    _vm.renderOpen = true;
  } } }, [_c(__unplugin_components_4, [_vm._v("Render this print now\u2026")])], 1), _c(__unplugin_components_5, { attrs: { "disabled": !_vm.canSaveFrames, "data-tid": "timelapse-save-frames" }, on: { "click": _vm.saveFrames } }, [_c(__unplugin_components_6, [_vm._v("Save this print's frames")])], 1), _c(__unplugin_components_7, { attrs: { "disabled": !_vm.socketConnected, "data-tid": "timelapse-refresh" }, on: { "click": function($event) {
    _vm.page.refreshTick++;
  } } }, [_c(__unplugin_components_8, [_vm._v("Refresh the list")])], 1)], 1)], 1), _vm.renderOpen ? _c("timelapse-render-settings-dialog", { attrs: { "renderable": "" }, model: { value: _vm.renderOpen, callback: function($$v) {
    _vm.renderOpen = $$v;
  }, expression: "renderOpen" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/timelapse/TimelapseActions.vue?vue&type=style&index=0&scoped=9cfb6a3c&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9cfb6a3c",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/timelapse/TimelapseActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZEQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFPQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTVCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJUaW1lbGFwc2VBY3Rpb25zLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cInRsLWFjdGlvbnNcIlxuICAgIGRhdGEtdGlkPVwidGltZWxhcHNlLWFjdGlvbnNcIlxuICA+XG4gICAgPHJvdXRlci1saW5rXG4gICAgICA6dG89XCJzZXR0aW5nc1BhdGhcIlxuICAgICAgY2xhc3M9XCJjYnRuIHRsLWFjdGlvbnNfX3NldHRpbmdzXCJcbiAgICAgIGRhdGEtdGlkPVwidGltZWxhcHNlLXNldHRpbmdzLWxpbmtcIlxuICAgID5cbiAgICAgIFRpbWVsYXBzZSBzZXR0aW5ncyA8c3BhbiBhcmlhLWhpZGRlbj1cInRydWVcIj7igLo8L3NwYW4+XG4gICAgPC9yb3V0ZXItbGluaz5cbiAgICA8di1tZW51XG4gICAgICBvZmZzZXQteVxuICAgICAgbGVmdFxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJ0bC1hY3Rpb25zX19yb3VuZFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIk1vcmUgYWJvdXQgdGltZWxhcHNlc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ0aW1lbGFwc2UtbW9yZVwiXG4gICAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICAgIHYtb249XCJvblwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwibW9yZVwiIC8+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDx2LWxpc3QgZGVuc2U+XG4gICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5SZW5kZXJcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidGltZWxhcHNlLXJlbmRlclwiXG4gICAgICAgICAgQGNsaWNrPVwicmVuZGVyT3BlbiA9IHRydWVcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPlJlbmRlciB0aGlzIHByaW50IG5vd+KApjwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5TYXZlRnJhbWVzXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInRpbWVsYXBzZS1zYXZlLWZyYW1lc1wiXG4gICAgICAgICAgQGNsaWNrPVwic2F2ZUZyYW1lc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+U2F2ZSB0aGlzIHByaW50J3MgZnJhbWVzPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgOmRpc2FibGVkPVwiIXNvY2tldENvbm5lY3RlZFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ0aW1lbGFwc2UtcmVmcmVzaFwiXG4gICAgICAgICAgQGNsaWNrPVwicGFnZS5yZWZyZXNoVGljaysrXCJcbiAgICAgICAgPlxuICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT5SZWZyZXNoIHRoZSBsaXN0PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgIDwvdi1saXN0PlxuICAgIDwvdi1tZW51PlxuICAgIDx0aW1lbGFwc2UtcmVuZGVyLXNldHRpbmdzLWRpYWxvZ1xuICAgICAgdi1pZj1cInJlbmRlck9wZW5cIlxuICAgICAgdi1tb2RlbD1cInJlbmRlck9wZW5cIlxuICAgICAgcmVuZGVyYWJsZVxuICAgIC8+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgdHlwZSB7IFJlbmRlclN0YXR1cywgVGltZWxhcHNlTGFzdEZyYW1lIH0gZnJvbSAnQC9zdG9yZS90aW1lbGFwc2UvdHlwZXMnXG5pbXBvcnQgeyB0aW1lbGFwc2VQYWdlIH0gZnJvbSAnQC9zZXJ2aWNlcy90aW1lbGFwc2UvcGFnZS1zdGF0ZSdcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcblxuLyoqXG4gKiBUaGUgVGltZWxhcHNlIGhlYWRlcidzIGFjdGlvbnM6IHRoZSBzZXR0aW5ncyBsaXZlIGluIFNldHRpbmdzIOKAuiBUaW1lbGFwc2UsXG4gKiBhbmQgdGhpcyBwcmludCdzIHJlbmRlciBhbmQgc2F2ZWQgZnJhbWVzLCB3aXRoIFJlZnJlc2gsIGluIHRoZSDCt8K3wrcgbWVudS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVGltZWxhcHNlUmVuZGVyU2V0dGluZ3NEaWFsb2c6ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL3dpZGdldHMvdGltZWxhcHNlL1RpbWVsYXBzZVJlbmRlclNldHRpbmdzRGlhbG9nLnZ1ZScpIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRpbWVsYXBzZUFjdGlvbnMgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBwYWdlID0gdGltZWxhcHNlUGFnZVxuICByZW5kZXJPcGVuID0gZmFsc2VcblxuICBnZXQgc2V0dGluZ3NQYXRoICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpfSN0aW1lbGFwc2VgXG4gIH1cblxuICBnZXQgZnJhbWVDb3VudCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3RpbWVsYXBzZS9nZXRMYXN0RnJhbWUnXSBhcyBUaW1lbGFwc2VMYXN0RnJhbWUgfCB1bmRlZmluZWQpPy51bmlxdWVDb3VudCA/PyAwXG4gIH1cblxuICBnZXQgcmVuZGVyaW5nICgpOiBib29sZWFuIHtcbiAgICBjb25zdCBzdGF0dXMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWyd0aW1lbGFwc2UvZ2V0UmVuZGVyU3RhdHVzJ10gYXMgUmVuZGVyU3RhdHVzIHwgdW5kZWZpbmVkXG4gICAgcmV0dXJuICEhc3RhdHVzICYmIHN0YXR1cy5zdGF0dXMgIT09ICdzdWNjZXNzJ1xuICB9XG5cbiAgZ2V0IGNhblJlbmRlciAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0Q29ubmVjdGVkICYmIHRoaXMuZnJhbWVDb3VudCA+IDAgJiYgIXRoaXMucmVuZGVyaW5nXG4gIH1cblxuICBnZXQgY2FuU2F2ZUZyYW1lcyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0Q29ubmVjdGVkICYmIHRoaXMuZnJhbWVDb3VudCA+IDAgJiYgIXRoaXMuaGFzV2FpdCh0aGlzLiR3YWl0cy5vblRpbWVsYXBzZVNhdmVGcmFtZSlcbiAgfVxuXG4gIHNhdmVGcmFtZXMgKCkge1xuICAgIFNvY2tldEFjdGlvbnMubWFjaGluZVRpbWVsYXBzZVNhdmVGcmFtZXModGhpcy4kd2FpdHMub25UaW1lbGFwc2VTYXZlRnJhbWUpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC50bC1hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDEwcHg7XG4gIH1cblxuICAudGwtYWN0aW9uc19fc2V0dGluZ3Mge1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgfVxuXG4gIC50bC1hY3Rpb25zX19yb3VuZCB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiA0NHB4O1xuICAgIGhlaWdodDogNDRweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3RpbWVsYXBzZS9UaW1lbGFwc2VBY3Rpb25zLnZ1ZSJ9