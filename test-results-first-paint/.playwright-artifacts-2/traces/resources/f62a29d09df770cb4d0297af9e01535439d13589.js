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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
let LinkTile = class extends Mixins(OverviewMixin) {
  tile;
  title;
  icon;
  note;
  action;
  page;
  get target() {
    return this.pagePath(this.page);
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], LinkTile.prototype, "tile", 2);
__decorateClass([
  Prop({ type: String, required: true })
], LinkTile.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "pulse" })
], LinkTile.prototype, "icon", 2);
__decorateClass([
  Prop({ type: String, required: true })
], LinkTile.prototype, "note", 2);
__decorateClass([
  Prop({ type: String, required: true })
], LinkTile.prototype, "action", 2);
__decorateClass([
  Prop({ type: String, required: true })
], LinkTile.prototype, "page", 2);
LinkTile = __decorateClass([
  Component({ components: { TileShell } })
], LinkTile);
const _sfc_main = LinkTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { staticClass: "lt", attrs: { "tile": _vm.tile, "title": _vm.title, "icon": _vm.icon } }, [_vm.size !== "S" ? _c("span", { staticClass: "ot__sub" }, [_vm._v(_vm._s(_vm.note))]) : _vm._e(), _c("router-link", { staticClass: "lt__go", attrs: { "to": _vm.target, "data-tid": "link-tile-go" } }, [_vm._v(" " + _vm._s(_vm.action) + " ")])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/LinkTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/LinkTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXNCQTtBQUNBO0FBQ0E7QUFTQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQ0E7QUFUQTtBQUFBO0FBQUEsR0FEQSxTQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsU0FFQTtBQUNBO0FBQUE7QUFBQSxHQUhBLFNBR0E7QUFDQTtBQUFBO0FBQUEsR0FKQSxTQUlBO0FBQ0E7QUFBQTtBQUFBLEdBTEEsU0FLQTtBQUVBO0FBQUE7QUFBQSxHQVBBLFNBT0E7QUFQQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJMaW5rVGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dGlsZS1zaGVsbFxuICAgIDp0aWxlPVwidGlsZVwiXG4gICAgOnRpdGxlPVwidGl0bGVcIlxuICAgIDppY29uPVwiaWNvblwiXG4gICAgY2xhc3M9XCJsdFwiXG4gID5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cInNpemUgIT09ICdTJ1wiXG4gICAgICBjbGFzcz1cIm90X19zdWJcIlxuICAgID57eyBub3RlIH19PC9zcGFuPlxuICAgIDxyb3V0ZXItbGlua1xuICAgICAgY2xhc3M9XCJsdF9fZ29cIlxuICAgICAgOnRvPVwidGFyZ2V0XCJcbiAgICAgIGRhdGEtdGlkPVwibGluay10aWxlLWdvXCJcbiAgICA+XG4gICAgICB7eyBhY3Rpb24gfX1cbiAgICA8L3JvdXRlci1saW5rPlxuICA8L3RpbGUtc2hlbGw+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5pbXBvcnQgVGlsZVNoZWxsIGZyb20gJy4vVGlsZVNoZWxsLnZ1ZSdcblxuLyoqXG4gKiBBIHdpZGdldCB3aG9zZSBkYXRhIGRvZXMgbm90IGV4aXN0IG9uIHRoZSBwcmludGVyIHNpZGUgeWV0IChDYXJlKSBvciB3aG9zZVxuICogc2hlbGYgaXMgc3RpbGwgdGhlIExpYnJhcnkgcGFnZSdzIChQcmludCBuZXh0KTogaXQgc2F5cyB3aGF0IGl0IGlzIGZvciBhbmRcbiAqIGdvZXMgdG8gdGhlIHBhZ2UgdGhhdCBoYXMgaXQuIFJlcGxhY2UgaXQgd2l0aCB0aGUgd2lkZ2V0IGl0c2VsZiB3aGVuIHRoZVxuICogZGF0YSBsYW5kcyAoc2VlIHRoZSBUT0RPcyBpbiByZWdpc3RyeS50cykuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRpbGVTaGVsbCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5rVGlsZSBleHRlbmRzIE1peGlucyhPdmVydmlld01peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSB0aWxlITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSB0aXRsZSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ3B1bHNlJyB9KSByZWFkb25seSBpY29uITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBub3RlITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBhY3Rpb24hOiBzdHJpbmdcbiAgLyoqIFRoZSBwYWdlLCB1bmRlciB0aGUgcHJpbnRlciAoXCIvbWFpbnRlbmFuY2VcIikuICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBwYWdlITogc3RyaW5nXG5cbiAgZ2V0IHRhcmdldCAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucGFnZVBhdGgodGhpcy5wYWdlKSB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4ubHRfX2dvIHsgYWxpZ24tc2VsZjogZmxleC1zdGFydDsgbWFyZ2luLXRvcDogYXV0bzsgcGFkZGluZzogNnB4IDE0cHg7IGJvcmRlci1yYWRpdXM6IDk5OXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQsIHZhcigtLW0zZC1maWxsKSk7IGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTsgZm9udC1zaXplOiAxMy41cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvb3ZlcnZpZXcvdGlsZXMvTGlua1RpbGUudnVlIn0=