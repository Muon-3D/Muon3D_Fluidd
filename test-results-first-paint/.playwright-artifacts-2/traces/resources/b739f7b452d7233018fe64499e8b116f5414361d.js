/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/PlateClearNotice.vue";
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
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import PlateClearNotice from "/src/components/ui/PlateClearNotice.vue";
import { plateNoticeShows } from "/src/services/plate/clear.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let PlateClearBar = class extends Mixins(MuonGatesMixin) {
  get shows() {
    return this.mayDo("plate_clear") && plateNoticeShows(this.$store.state.printer.printer, this.printerState);
  }
  get managed() {
    return isManagedApiUrl(this.$store.state.config.apiUrl);
  }
  get settingsPath() {
    return `${scopedPath("/settings", activeSlug())}#security`;
  }
};
PlateClearBar = __decorateClass([
  Component({ components: { PlateClearNotice } })
], PlateClearBar);
const _sfc_main = PlateClearBar;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.shows ? _c(__unplugin_components_0, { staticClass: "plate-bar", attrs: { "managed": _vm.managed, "owner": _vm.canManageAccess === true, "settings-path": _vm.settingsPath } }) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/PlateClearBar.vue?vue&type=style&index=0&scoped=6ba7472f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "6ba7472f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/PlateClearBar.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVNBO0FBQUEsRUFDQTtBQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFiQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQbGF0ZUNsZWFyQmFyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxwbGF0ZS1jbGVhci1ub3RpY2VcbiAgICB2LWlmPVwic2hvd3NcIlxuICAgIGNsYXNzPVwicGxhdGUtYmFyXCJcbiAgICA6bWFuYWdlZD1cIm1hbmFnZWRcIlxuICAgIDpvd25lcj1cImNhbk1hbmFnZUFjY2VzcyA9PT0gdHJ1ZVwiXG4gICAgOnNldHRpbmdzLXBhdGg9XCJzZXR0aW5nc1BhdGhcIlxuICAvPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNdW9uR2F0ZXNNaXhpbiBmcm9tICdAL21peGlucy9tdW9uLWdhdGVzJ1xuaW1wb3J0IFBsYXRlQ2xlYXJOb3RpY2UgZnJvbSAnLi9QbGF0ZUNsZWFyTm90aWNlLnZ1ZSdcbmltcG9ydCB7IHBsYXRlTm90aWNlU2hvd3MgfSBmcm9tICdAL3NlcnZpY2VzL3BsYXRlL2NsZWFyJ1xuaW1wb3J0IHsgaXNNYW5hZ2VkQXBpVXJsIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL29yaWdpbidcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcblxuLyoqXG4gKiBUaGUgcGxhdGUtY2xlYXIgbm90aWNlIGF0IHRoZSB0b3Agb2YgT3ZlcnZpZXcgYW5kIENvbnRyb2wgKENULTE0KTogb25seVxuICogd2hpbGUgdGhlIHByaW50ZXIgc2F5cyB0aGUgcGxhdGUgbmVlZHMgY29uZmlybWluZyBhbmQgbm90aGluZyBpcyBwcmludGluZ1xuICogb3IgcGF1c2VkLiBUaGUgb3duZXIgbGluayB0byBTZXR0aW5ncyA+IFNlY3VyaXR5IHVzZXMgdGhlIHByaW50ZXIncyBvd25cbiAqIFwibWF5IG1hbmFnZSBhY2Nlc3NcIiBhbnN3ZXI7IG5vIGdhdGUgaXMgY2hhbmdlZCBoZXJlLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBQbGF0ZUNsZWFyTm90aWNlIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYXRlQ2xlYXJCYXIgZXh0ZW5kcyBNaXhpbnMoTXVvbkdhdGVzTWl4aW4pIHtcbiAgZ2V0IHNob3dzICgpOiBib29sZWFuIHtcbiAgICAvLyBIaWRkZW4gZnJvbSBzb21lb25lIHRoZSBwcmludGVyJ3MgcGxhdGVfY2xlYXIgc2V0dGluZyBrZWVwcyBvdXQgKEtBTi0zNjA2KS5cbiAgICByZXR1cm4gdGhpcy5tYXlEbygncGxhdGVfY2xlYXInKSAmJiBwbGF0ZU5vdGljZVNob3dzKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlciwgdGhpcy5wcmludGVyU3RhdGUpXG4gIH1cblxuICBnZXQgbWFuYWdlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTWFuYWdlZEFwaVVybCh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsIGFzIHN0cmluZyB8IG51bGwpXG4gIH1cblxuICBnZXQgc2V0dGluZ3NQYXRoICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpfSNzZWN1cml0eWBcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5wbGF0ZS1iYXIgeyBtYXJnaW4tYm90dG9tOiAxNnB4OyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvUGxhdGVDbGVhckJhci52dWUifQ==