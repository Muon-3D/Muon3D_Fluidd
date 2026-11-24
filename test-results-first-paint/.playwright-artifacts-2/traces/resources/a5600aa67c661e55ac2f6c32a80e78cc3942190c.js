/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import BrowserMixin from "/src/mixins/browser.ts";
import { EventBus } from "/src/eventBus.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let CameraActions = class extends Mixins(BrowserMixin) {
  get hasCamera() {
    return this.$store.getters["webcams/getEnabledWebcams"].length > 0;
  }
  get timelapseSupported() {
    return this.$store.getters["server/componentSupport"]("timelapse");
  }
  get timelapseTo() {
    return scopedPath("/timelapse", activeSlug());
  }
  get settingsTo() {
    return `${scopedPath("/settings", activeSlug())}#camera`;
  }
  send(event) {
    EventBus.bus.$emit(event);
  }
};
CameraActions = __decorateClass([
  Component({})
], CameraActions);
const _sfc_main = CameraActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.hasCamera ? _c("div", { staticClass: "camera-actions" }, [!_vm.isMobileViewport ? _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "camera-snapshot" }, on: { "click": function($event) {
    return _vm.send("camera-snapshot");
  } } }, [_c(__unplugin_components_0, { attrs: { "name": "camera2", "small": "" } }), _vm._v(" Snapshot ")], 1) : _vm._e(), _vm.timelapseSupported ? _c("router-link", { staticClass: "cbtn cbtn--ghost", attrs: { "to": _vm.timelapseTo, "data-tid": "camera-timelapse" } }, [_c(__unplugin_components_1, { attrs: { "name": "clock", "small": "" } }), _vm._v(" Timelapse ")], 1) : _vm._e(), _c(__unplugin_components_2, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "camera-actions__round", attrs: { "type": "button", "aria-label": "More camera actions", "data-tid": "camera-more" } }, "button", attrs, false), on), [_c(__unplugin_components_3, { attrs: { "name": "more" } })], 1)];
  } }], null, false, 244072533) }, [_c(__unplugin_components_4, { attrs: { "dense": "" } }, [!_vm.isMobileViewport ? _c(__unplugin_components_5, { attrs: { "data-tid": "camera-fullscreen" }, on: { "click": function($event) {
    return _vm.send("camera-fullscreen");
  } } }, [_c(__unplugin_components_6, [_vm._v(" Full screen "), !_vm.isMobileViewport ? _c("kbd", { staticClass: "camera-actions__key" }, [_vm._v("F")]) : _vm._e()])], 1) : _vm._e(), _c(__unplugin_components_7, { attrs: { "to": _vm.settingsTo, "data-tid": "camera-more-settings" } }, [_c(__unplugin_components_8, [_vm._v("Camera settings")])], 1)], 1)], 1)], 1) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/camera/CameraActions.vue?vue&type=style&index=0&scoped=c3625f2f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "c3625f2f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/camera/CameraActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBVUE7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBcEJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNhbWVyYUFjdGlvbnMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIHYtaWY9XCJoYXNDYW1lcmFcIlxuICAgIGNsYXNzPVwiY2FtZXJhLWFjdGlvbnNcIlxuICA+XG4gICAgPGJ1dHRvblxuICAgICAgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgIGRhdGEtdGlkPVwiY2FtZXJhLXNuYXBzaG90XCJcbiAgICAgIEBjbGljaz1cInNlbmQoJ2NhbWVyYS1zbmFwc2hvdCcpXCJcbiAgICA+XG4gICAgICA8ZnJhbWUtaWNvblxuICAgICAgICBuYW1lPVwiY2FtZXJhMlwiXG4gICAgICAgIHNtYWxsXG4gICAgICAvPlxuICAgICAgU25hcHNob3RcbiAgICA8L2J1dHRvbj5cbiAgICA8cm91dGVyLWxpbmtcbiAgICAgIHYtaWY9XCJ0aW1lbGFwc2VTdXBwb3J0ZWRcIlxuICAgICAgOnRvPVwidGltZWxhcHNlVG9cIlxuICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgIGRhdGEtdGlkPVwiY2FtZXJhLXRpbWVsYXBzZVwiXG4gICAgPlxuICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgbmFtZT1cImNsb2NrXCJcbiAgICAgICAgc21hbGxcbiAgICAgIC8+XG4gICAgICBUaW1lbGFwc2VcbiAgICA8L3JvdXRlci1saW5rPlxuICAgIDx2LW1lbnVcbiAgICAgIG9mZnNldC15XG4gICAgICBsZWZ0XG4gICAgPlxuICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNhbWVyYS1hY3Rpb25zX19yb3VuZFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIk1vcmUgY2FtZXJhIGFjdGlvbnNcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiY2FtZXJhLW1vcmVcIlxuICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1vcmVcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICA8di1saXN0LWl0ZW1cbiAgICAgICAgICB2LWlmPVwiIWlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiY2FtZXJhLWZ1bGxzY3JlZW5cIlxuICAgICAgICAgIEBjbGljaz1cInNlbmQoJ2NhbWVyYS1mdWxsc2NyZWVuJylcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICAgICAgRnVsbCBzY3JlZW5cbiAgICAgICAgICAgIDxrYmRcbiAgICAgICAgICAgICAgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYW1lcmEtYWN0aW9uc19fa2V5XCJcbiAgICAgICAgICAgID5GPC9rYmQ+XG4gICAgICAgICAgPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgOnRvPVwic2V0dGluZ3NUb1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJjYW1lcmEtbW9yZS1zZXR0aW5nc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+Q2FtZXJhIHNldHRpbmdzPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgIDwvdi1saXN0PlxuICAgIDwvdi1tZW51PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuaW1wb3J0IHsgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5cbi8qKlxuICogQ2FtZXJhJ3MgYWN0aW9ucyBpbiB0aGUgcGFnZSBoZWFkZXI6IFNuYXBzaG90LCBUaW1lbGFwc2UgKHdoZW4gdGhlXG4gKiBwcmludGVyIHJlY29yZHMgdGhlbSkgYW5kIGEgwrfCt8K3IG1lbnUgd2l0aCBGdWxsIHNjcmVlbiAoRikgYW5kIHRoZSBjYW1lcmFcbiAqIHNldHRpbmdzICh3aGVyZSBhIGNhbWVyYSBpcyBhZGRlZCkuIFRoZSBwYWdlIHRha2VzIHRoZSBzbmFwc2hvdCBhbmQgZmlsbHNcbiAqIHRoZSBzY3JlZW4uIE9uIGEgcGhvbmUgU25hcHNob3QgYW5kIEZ1bGwgc2NyZWVuIGFyZSBvbiB0aGUgcGljdHVyZSwgc28gdGhlXG4gKiBoZWFkZXIgZG9lcyBub3QgcmVwZWF0IHRoZW0uXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYW1lcmFBY3Rpb25zIGV4dGVuZHMgTWl4aW5zKEJyb3dzZXJNaXhpbikge1xuICBnZXQgaGFzQ2FtZXJhICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3dlYmNhbXMvZ2V0RW5hYmxlZFdlYmNhbXMnXSBhcyB1bmtub3duW10pLmxlbmd0aCA+IDBcbiAgfVxuXG4gIGdldCB0aW1lbGFwc2VTdXBwb3J0ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKCd0aW1lbGFwc2UnKSBhcyBib29sZWFuXG4gIH1cblxuICBnZXQgdGltZWxhcHNlVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy90aW1lbGFwc2UnLCBhY3RpdmVTbHVnKCkpXG4gIH1cblxuICBnZXQgc2V0dGluZ3NUbyAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7c2NvcGVkUGF0aCgnL3NldHRpbmdzJywgYWN0aXZlU2x1ZygpKX0jY2FtZXJhYFxuICB9XG5cbiAgc2VuZCAoZXZlbnQ6IHN0cmluZykge1xuICAgIEV2ZW50QnVzLmJ1cy4kZW1pdChldmVudClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmNhbWVyYS1hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAuY2FtZXJhLWFjdGlvbnNfX3JvdW5kIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDQ0cHg7XG4gICAgaGVpZ2h0OiA0NHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgLmNhbWVyYS1hY3Rpb25zX19rZXkge1xuICAgIG1hcmdpbi1sZWZ0OiA4cHg7XG4gICAgcGFkZGluZzogMXB4IDZweDtcbiAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwsIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCkpO1xuICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgbW9ub3NwYWNlKTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jYW1lcmEvQ2FtZXJhQWN0aW9ucy52dWUifQ==