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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let MovementTile = class extends Vue {
  size;
};
__decorateClass([
  Prop({ type: String, default: "M" })
], MovementTile.prototype, "size", 2);
MovementTile = __decorateClass([
  Component({ components: { ControlMove: () => import("/src/components/control/ControlMove.vue") } })
], MovementTile);
const _sfc_main = MovementTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "et mv", class: `mv--${_vm.size}`, attrs: { "data-tile": "trackpad" } }, [_c("control-move", { attrs: { "phone": _vm.size === "S", "trackpad-only": "" } })], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/MovementTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWNBO0FBU0E7QUFBQSxFQUNBO0FBQ0E7QUFEQTtBQUFBO0FBQUEsR0FEQSxhQUNBO0FBREE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTW92ZW1lbnRUaWxlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJldCBtdlwiXG4gICAgOmNsYXNzPVwiYG12LS0ke3NpemV9YFwiXG4gICAgZGF0YS10aWxlPVwidHJhY2twYWRcIlxuICA+XG4gICAgPGNvbnRyb2wtbW92ZVxuICAgICAgOnBob25lPVwic2l6ZSA9PT0gJ1MnXCJcbiAgICAgIHRyYWNrcGFkLW9ubHlcbiAgICAvPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKipcbiAqIFRoZSBUcmFja3BhZDogQ29udHJvbCdzIE1vdmUgY2FyZCAoQ29udHJvbE1vdmUpIHdpdGhvdXQgaXRzIGpvZyBhbmRcbiAqIHBvc2l0aW9uIGJhcnMgKHRob3NlIGFyZSB0aGUgSm9nIGFuZCBQb3NpdGlvbiB3aWRnZXRzKSwgc28gZXZlcnkgbW92ZSBnb2VzXG4gKiB0aHJvdWdoIHRoZSBzYW1lIHNhZmUtbW92ZSBwYXRoLiBJdCBzdGF5cyBvbiB0aGUgcGFnZSBhbmQgZ3JleXMgb3V0IHdoaWxlXG4gKiB0aGUgcHJpbnRlciBpcyBtb3ZpbmcuIFNtYWxsIGlzIGl0cyBjb21wYWN0IGxheW91dC5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgQ29udHJvbE1vdmU6ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbE1vdmUudnVlJykgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW92ZW1lbnRUaWxlIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdNJyB9KSByZWFkb25seSBzaXplITogJ1MnIHwgJ00nIHwgJ0wnXG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvb3ZlcnZpZXcvdGlsZXMvTW92ZW1lbnRUaWxlLnZ1ZSJ9