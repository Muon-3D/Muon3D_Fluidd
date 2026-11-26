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
import { DEV_ONLY_NOTE } from "/src/services/dev-guard/index.ts";
let DevOnlyNote = class extends Vue {
  get note() {
    return DEV_ONLY_NOTE;
  }
};
DevOnlyNote = __decorateClass([
  Component({})
], DevOnlyNote);
const _sfc_main = DevOnlyNote;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", { staticClass: "dev-only-note text-caption text--secondary", attrs: { "data-tid": "dev-only-note" } }, [_vm._v(_vm._s(_vm.note))]);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/toolhead/DevOnlyNote.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVFBO0FBQ0E7QUFJQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQUpBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkRldk9ubHlOb3RlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzcGFuXG4gICAgY2xhc3M9XCJkZXYtb25seS1ub3RlIHRleHQtY2FwdGlvbiB0ZXh0LS1zZWNvbmRhcnlcIlxuICAgIGRhdGEtdGlkPVwiZGV2LW9ubHktbm90ZVwiXG4gID57eyBub3RlIH19PC9zcGFuPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IERFVl9PTkxZX05PVEUgfSBmcm9tICdAL3NlcnZpY2VzL2Rldi1ndWFyZCdcblxuLyoqIFRoZSBwbGFpbiBub3RlIGJlc2lkZSBhIGNvbnRyb2wgQ29udHJvbCB3aWxsIG5vdCBzZW5kIG91dHNpZGUgZGV2ZWxvcGVyIG1vZGUuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2T25seU5vdGUgZXh0ZW5kcyBWdWUge1xuICBnZXQgbm90ZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gREVWX09OTFlfTk9URVxuICB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvdG9vbGhlYWQvRGV2T25seU5vdGUudnVlIn0=