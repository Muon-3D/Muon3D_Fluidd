/* unplugin-vue-components disabled */import { VListItemSubtitle as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import TonePill from "/src/components/printers/TonePill.vue";
let OfflineList = class extends Vue {
  tiles;
  actionsFor;
  /** "Last seen 3d ago" when the console knows, else what the page knows. */
  reason(tile) {
    const seen = tile.entry.cloud?.last_seen;
    const group = tile.groupName ? ` \xB7 ${tile.groupName}` : "";
    if (seen && seen > 0) return `Last seen ${this.ago(Date.now() / 1e3 - seen)}${group}`;
    return `${tile.detail}${group}`;
  }
  ago(seconds) {
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `${hours}h ago`;
    return `${Math.round(hours / 24)} days ago`;
  }
};
__decorateClass([
  Prop({ type: Array, required: true })
], OfflineList.prototype, "tiles", 2);
__decorateClass([
  Prop({ type: Function, required: true })
], OfflineList.prototype, "actionsFor", 2);
OfflineList = __decorateClass([
  Component({ components: { TonePill } })
], OfflineList);
const _sfc_main = OfflineList;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "rows rows--dim", attrs: { "data-tid": "offline-list" } }, _vm._l(_vm.tiles, function(tile) {
    return _c("div", { key: tile.key, staticClass: "row" }, [_c("span", { staticClass: "row__icon" }, [_c(__unplugin_components_0, { attrs: { "name": "printer" } })], 1), _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v(_vm._s(tile.name))]), _c("span", { staticClass: "row__sub", attrs: { "data-tid": "offline-reason" } }, [_vm._v(_vm._s(_vm.reason(tile)) + " \xB7 Is it switched on and on Wi-Fi?")])]), _c("tone-pill", { attrs: { "tone": "err" } }, [_vm._v(" Offline ")]), _vm.actionsFor(tile).length ? _c(__unplugin_components_1, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
      return [_c("button", _vm._g(_vm._b({ staticClass: "icon-btn", attrs: { "type": "button", "aria-label": `Options for ${tile.name}` } }, "button", attrs, false), on), [_c(__unplugin_components_2, { attrs: { "name": "more" } })], 1)];
    } }], null, true) }, [_c(__unplugin_components_3, { attrs: { "dense": "" } }, _vm._l(_vm.actionsFor(tile), function(a) {
      return _c(__unplugin_components_4, { key: a.id, attrs: { "disabled": a.disabled, "data-action": a.id }, on: { "click": function($event) {
        return _vm.$emit("action", tile, a.id);
      } } }, [_c(__unplugin_components_5, [_c(__unplugin_components_6, { class: { "error--text": a.danger } }, [_vm._v(" " + _vm._s(a.label) + " ")]), a.hint ? _c(__unplugin_components_7, [_vm._v(" " + _vm._s(a.hint) + " ")]) : _vm._e()], 1)], 1);
    }), 1)], 1) : _vm._e()], 1);
  }), 0);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/OfflineList.vue?vue&type=style&index=0&scoped=43ceb373&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "43ceb373",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/OfflineList.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkRBO0FBR0E7QUFJQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFwQkE7QUFBQSxFQURBO0FBQUEsR0FEQSxZQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxZQUtBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiT2ZmbGluZUxpc3QudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwicm93cyByb3dzLS1kaW1cIlxuICAgIGRhdGEtdGlkPVwib2ZmbGluZS1saXN0XCJcbiAgPlxuICAgIDxkaXZcbiAgICAgIHYtZm9yPVwidGlsZSBpbiB0aWxlc1wiXG4gICAgICA6a2V5PVwidGlsZS5rZXlcIlxuICAgICAgY2xhc3M9XCJyb3dcIlxuICAgID5cbiAgICAgIDxzcGFuIGNsYXNzPVwicm93X19pY29uXCI+PGZyYW1lLWljb24gbmFtZT1cInByaW50ZXJcIiAvPjwvc3Bhbj5cbiAgICAgIDxkaXYgY2xhc3M9XCJyb3dfX3RleHRcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJyb3dfX3RpdGxlXCI+e3sgdGlsZS5uYW1lIH19PC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzPVwicm93X19zdWJcIlxuICAgICAgICAgIGRhdGEtdGlkPVwib2ZmbGluZS1yZWFzb25cIlxuICAgICAgICA+e3sgcmVhc29uKHRpbGUpIH19IMK3IElzIGl0IHN3aXRjaGVkIG9uIGFuZCBvbiBXaS1GaT88L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDx0b25lLXBpbGwgdG9uZT1cImVyclwiPlxuICAgICAgICBPZmZsaW5lXG4gICAgICA8L3RvbmUtcGlsbD5cbiAgICAgIDx2LW1lbnVcbiAgICAgICAgdi1pZj1cImFjdGlvbnNGb3IodGlsZSkubGVuZ3RoXCJcbiAgICAgICAgbGVmdFxuICAgICAgICBvZmZzZXQteVxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiaWNvbi1idG5cIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgT3B0aW9ucyBmb3IgJHt0aWxlLm5hbWV9YFwiXG4gICAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJtb3JlXCIgLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPHYtbGlzdCBkZW5zZT5cbiAgICAgICAgICA8di1saXN0LWl0ZW1cbiAgICAgICAgICAgIHYtZm9yPVwiYSBpbiBhY3Rpb25zRm9yKHRpbGUpXCJcbiAgICAgICAgICAgIDprZXk9XCJhLmlkXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImEuZGlzYWJsZWRcIlxuICAgICAgICAgICAgOmRhdGEtYWN0aW9uPVwiYS5pZFwiXG4gICAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnYWN0aW9uJywgdGlsZSwgYS5pZClcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGUgOmNsYXNzPVwieyAnZXJyb3ItLXRleHQnOiBhLmRhbmdlciB9XCI+XG4gICAgICAgICAgICAgICAge3sgYS5sYWJlbCB9fVxuICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICAgICAgICA8di1saXN0LWl0ZW0tc3VidGl0bGUgdi1pZj1cImEuaGludFwiPlxuICAgICAgICAgICAgICAgIHt7IGEuaGludCB9fVxuICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtLXN1YnRpdGxlPlxuICAgICAgICAgICAgPC92LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDwvdi1saXN0PlxuICAgICAgPC92LW1lbnU+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB0eXBlIHsgQ2FyZEFjdGlvbiB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXJlY3RvcnknXG5pbXBvcnQgdHlwZSB7IFByaW50ZXJUaWxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL21vZGVsJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJy4vVG9uZVBpbGwudnVlJ1xuXG4vKiogUHJpbnRlcnMgdGhhdCBhcmUgbm90IGFuc3dlcmluZzogbGFzdCwgZGltbWVkLCB3aXRoIHRoZSByZWFzb24gYW5kIHdoYXQgY2FuIHN0aWxsIGJlIGRvbmUuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUb25lUGlsbCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPZmZsaW5lTGlzdCBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogQXJyYXksIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHRpbGVzITogUHJpbnRlclRpbGVbXVxuXG4gIEBQcm9wKHsgdHlwZTogRnVuY3Rpb24sIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IGFjdGlvbnNGb3IhOiAodGlsZTogUHJpbnRlclRpbGUpID0+IENhcmRBY3Rpb25bXVxuXG4gIC8qKiBcIkxhc3Qgc2VlbiAzZCBhZ29cIiB3aGVuIHRoZSBjb25zb2xlIGtub3dzLCBlbHNlIHdoYXQgdGhlIHBhZ2Uga25vd3MuICovXG4gIHJlYXNvbiAodGlsZTogUHJpbnRlclRpbGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNlZW4gPSB0aWxlLmVudHJ5LmNsb3VkPy5sYXN0X3NlZW5cbiAgICBjb25zdCBncm91cCA9IHRpbGUuZ3JvdXBOYW1lID8gYCDCtyAke3RpbGUuZ3JvdXBOYW1lfWAgOiAnJ1xuICAgIGlmIChzZWVuICYmIHNlZW4gPiAwKSByZXR1cm4gYExhc3Qgc2VlbiAke3RoaXMuYWdvKERhdGUubm93KCkgLyAxMDAwIC0gc2Vlbil9JHtncm91cH1gXG4gICAgcmV0dXJuIGAke3RpbGUuZGV0YWlsfSR7Z3JvdXB9YFxuICB9XG5cbiAgYWdvIChzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKHNlY29uZHMgLyA2MCkpXG4gICAgaWYgKG1pbnV0ZXMgPCA2MCkgcmV0dXJuIGAke21pbnV0ZXN9bSBhZ29gXG4gICAgY29uc3QgaG91cnMgPSBNYXRoLnJvdW5kKG1pbnV0ZXMgLyA2MClcbiAgICBpZiAoaG91cnMgPCA0OCkgcmV0dXJuIGAke2hvdXJzfWggYWdvYFxuICAgIHJldHVybiBgJHtNYXRoLnJvdW5kKGhvdXJzIC8gMjQpfSBkYXlzIGFnb2BcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnJvd3MtLWRpbSAucm93X19pY29uLFxuICAucm93cy0tZGltIC5yb3dfX3RleHQge1xuICAgIG9wYWNpdHk6IDAuNjtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3ByaW50ZXJzL09mZmxpbmVMaXN0LnZ1ZSJ9