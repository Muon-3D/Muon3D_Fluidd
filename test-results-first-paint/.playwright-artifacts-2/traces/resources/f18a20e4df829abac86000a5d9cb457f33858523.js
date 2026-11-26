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
import { isForeignSlug } from "/src/services/printer-pages/index.ts";
let OverviewRoute = class extends Vue {
  get isForeign() {
    return isForeignSlug(this.$route.params.printer);
  }
};
OverviewRoute = __decorateClass([
  Component({
    components: {
      Overview: () => import("/src/views/Overview.vue"),
      ForeignOverview: () => import("/src/components/foreign/ForeignPrinterOverview.vue")
    }
  })
], OverviewRoute);
const _sfc_main = OverviewRoute;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(_vm.isForeign ? "foreign-overview" : "overview", { key: _vm.isForeign ? _vm.$route.params.printer : void 0, tag: "component" });
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/foreign/OverviewRoute.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVFBO0FBQ0E7QUFRQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFGQTtBQUFBLEVBTkE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk92ZXJ2aWV3Um91dGUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGNvbXBvbmVudFxuICAgIDppcz1cImlzRm9yZWlnbiA/ICdmb3JlaWduLW92ZXJ2aWV3JyA6ICdvdmVydmlldydcIlxuICAgIDprZXk9XCJpc0ZvcmVpZ24gPyAkcm91dGUucGFyYW1zLnByaW50ZXIgOiB1bmRlZmluZWRcIlxuICAvPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IGlzRm9yZWlnblNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7XG4gICAgT3ZlcnZpZXc6ICgpID0+IGltcG9ydCgnQC92aWV3cy9PdmVydmlldy52dWUnKSxcbiAgICBGb3JlaWduT3ZlcnZpZXc6ICgpID0+IGltcG9ydCgnLi9Gb3JlaWduUHJpbnRlck92ZXJ2aWV3LnZ1ZScpXG4gIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPdmVydmlld1JvdXRlIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IGlzRm9yZWlnbiAoKSB7IHJldHVybiBpc0ZvcmVpZ25TbHVnKHRoaXMuJHJvdXRlLnBhcmFtcy5wcmludGVyKSB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2ZvcmVpZ24vT3ZlcnZpZXdSb3V0ZS52dWUifQ==