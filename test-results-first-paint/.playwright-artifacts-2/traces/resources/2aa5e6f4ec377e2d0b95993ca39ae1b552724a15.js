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
import StateMixin from "/src/mixins/state.ts";
import UpdatingScreen from "/src/components/updates/UpdatingScreen.vue";
import { poll } from "/src/services/updates/watch.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
let Updating = class extends Mixins(StateMixin) {
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  mounted() {
    poll();
  }
  /** Back to Overview. The update carries on: the bar at the top follows it. */
  leave() {
    this.$router.push(scopedPath("/", activeSlug())).catch(() => void 0);
  }
  back() {
    this.$router.push(scopedPath("/settings", activeSlug()) + "#versions").catch(() => void 0);
  }
};
Updating = __decorateClass([
  Component({ components: { UpdatingScreen } })
], Updating);
const _sfc_main = Updating;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("updating-screen", { attrs: { "printer-name": _vm.printerName, "can-leave": "", "data-tid": "updating-page" }, on: { "done": _vm.back, "leave": _vm.leave } });
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Updating.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBVUE7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWpCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJVcGRhdGluZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dXBkYXRpbmctc2NyZWVuXG4gICAgOnByaW50ZXItbmFtZT1cInByaW50ZXJOYW1lXCJcbiAgICBjYW4tbGVhdmVcbiAgICBkYXRhLXRpZD1cInVwZGF0aW5nLXBhZ2VcIlxuICAgIEBkb25lPVwiYmFja1wiXG4gICAgQGxlYXZlPVwibGVhdmVcIlxuICAvPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IFVwZGF0aW5nU2NyZWVuIGZyb20gJ0AvY29tcG9uZW50cy91cGRhdGVzL1VwZGF0aW5nU2NyZWVuLnZ1ZSdcbmltcG9ydCB7IHBvbGwgfSBmcm9tICdAL3NlcnZpY2VzL3VwZGF0ZXMvd2F0Y2gnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBwcmludGVyTmFtZVBhcnRzIH0gZnJvbSAnQC91dGlsL3ByaW50ZXItbmFtZSdcblxuLyoqXG4gKiBUaGUgcHJpbnRlciB1cGRhdGluZyAoL2JveHdvb2QtMzY3YS91cGRhdGluZyk6IHdoZXJlIEluc3RhbGwgZ29lcywgYW5kXG4gKiB3aGVyZSB0aGUgYmFyIG9uIGV2ZXJ5IG90aGVyIHBhZ2UgbGVhZHMgd2hpbGUgYW4gaW5zdGFsbCBydW5zLiBJdCBzaXRzXG4gKiBpbnNpZGUgdGhlIGZyYW1lLCB3aXRoIGEgd2F5IGJhY2sgdG8gT3ZlcnZpZXcgdGhhdCBsZWF2ZXMgdGhlIGluc3RhbGxcbiAqIHJ1bm5pbmcuIFdoaWxlIHRoZSBwcmludGVyIHJlc3RhcnRzLCB0aGUgY29ubmVjdGlvbiBzY3JlZW5zIHNob3cgdGhlXG4gKiBzYW1lIHRoaW5nLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBVcGRhdGluZ1NjcmVlbiB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVcGRhdGluZyBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluKSB7XG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJpbnRlck5hbWVQYXJ0cyh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0RGlzcGxheU5hbWUnXSBhcyBzdHJpbmcpLm5hbWVcbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHBvbGwoKVxuICB9XG5cbiAgLyoqIEJhY2sgdG8gT3ZlcnZpZXcuIFRoZSB1cGRhdGUgY2FycmllcyBvbjogdGhlIGJhciBhdCB0aGUgdG9wIGZvbGxvd3MgaXQuICovXG4gIGxlYXZlICgpIHtcbiAgICB0aGlzLiRyb3V0ZXIucHVzaChzY29wZWRQYXRoKCcvJywgYWN0aXZlU2x1ZygpKSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKVxuICB9XG5cbiAgYmFjayAoKSB7XG4gICAgdGhpcy4kcm91dGVyLnB1c2goc2NvcGVkUGF0aCgnL3NldHRpbmdzJywgYWN0aXZlU2x1ZygpKSArICcjdmVyc2lvbnMnKS5jYXRjaCgoKSA9PiB1bmRlZmluZWQpXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL3ZpZXdzL1VwZGF0aW5nLnZ1ZSJ9