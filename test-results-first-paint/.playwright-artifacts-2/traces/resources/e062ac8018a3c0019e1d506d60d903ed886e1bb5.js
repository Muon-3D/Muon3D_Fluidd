import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};/* unplugin-vue-components disabled */import { VFooter as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Component } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let AppFooter = class extends Vue {
  get version() {
    return import.meta.env.VERSION;
  }
  get licencesUrl() {
    return `${import.meta.env.BASE_URL}licences.html`;
  }
  get hash() {
    return import.meta.env.HASH;
  }
};
AppFooter = __decorateClass([
  Component({})
], AppFooter);
const _sfc_main = AppFooter;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { staticClass: "footer justify-end", attrs: { "app": "", "absolute": "", "inset": "", "color": "transparent" } }, [_c("span", { staticClass: "secondary--text" }, [_vm._v(" " + _vm._s(_vm.$globals.PRODUCT_NAME) + " Control v" + _vm._s(_vm.version) + "-" + _vm._s(_vm.hash) + " \xB7 "), _c("a", { staticClass: "secondary--text", attrs: { "href": _vm.licencesUrl, "target": "_blank", "rel": "noopener" } }, [_vm._v("Licences")])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/AppFooter.vue?vue&type=style&index=0&scoped=772024c0&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "772024c0",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppFooter.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFzQkE7QUFDQTtBQUdBO0FBQUEsRUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFaQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHBGb290ZXIudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtZm9vdGVyXG4gICAgYXBwXG4gICAgYWJzb2x1dGVcbiAgICBpbnNldFxuICAgIGNvbG9yPVwidHJhbnNwYXJlbnRcIlxuICAgIGNsYXNzPVwiZm9vdGVyIGp1c3RpZnktZW5kXCJcbiAgPlxuICAgIDxzcGFuIGNsYXNzPVwic2Vjb25kYXJ5LS10ZXh0XCI+XG4gICAgICB7eyAkZ2xvYmFscy5QUk9EVUNUX05BTUUgfX0gQ29udHJvbCB2e3sgdmVyc2lvbiB9fS17eyBoYXNoIH19ICZtaWRkb3Q7XG4gICAgICA8IS0tIFRoZSBHUEwgbm90aWNlIGZvciBGbHVpZGQsIHdoaWNoIENvbnRyb2wgaXMgYmFzZWQgb24sIGxpdmVzIG9uIHRoaXMgcGFnZS4gLS0+XG4gICAgICA8YVxuICAgICAgICA6aHJlZj1cImxpY2VuY2VzVXJsXCJcbiAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgcmVsPVwibm9vcGVuZXJcIlxuICAgICAgICBjbGFzcz1cInNlY29uZGFyeS0tdGV4dFwiXG4gICAgICA+TGljZW5jZXM8L2E+XG4gICAgPC9zcGFuPlxuICA8L3YtZm9vdGVyPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcblxuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcEZvb3RlciBleHRlbmRzIFZ1ZSB7XG4gIGdldCB2ZXJzaW9uICgpIHtcbiAgICByZXR1cm4gaW1wb3J0Lm1ldGEuZW52LlZFUlNJT05cbiAgfVxuXG4gIGdldCBsaWNlbmNlc1VybCAoKSB7XG4gICAgcmV0dXJuIGAke2ltcG9ydC5tZXRhLmVudi5CQVNFX1VSTH1saWNlbmNlcy5odG1sYFxuICB9XG5cbiAgZ2V0IGhhc2ggKCkge1xuICAgIHJldHVybiBpbXBvcnQubWV0YS5lbnYuSEFTSFxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuZm9vdGVyIHtcbiAgICBzcGFuIHtcbiAgICAgIGZsZXg6IDAgMCBhdXRvO1xuICAgICAgZm9udC1zaXplOiAwLjc1cmVtO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9BcHBGb290ZXIudnVlIn0=