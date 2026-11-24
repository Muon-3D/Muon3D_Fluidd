/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
let TileDialog = class extends Vue {
  value;
  title;
  maxWidth;
};
__decorateClass([
  Prop({ type: Boolean })
], TileDialog.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, required: true })
], TileDialog.prototype, "title", 2);
__decorateClass([
  Prop({ type: [String, Number], default: 560 })
], TileDialog.prototype, "maxWidth", 2);
TileDialog = __decorateClass([
  Component({})
], TileDialog);
const _sfc_main = TileDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "title": _vm.title, "max-width": _vm.maxWidth, "data-tid": "tile-dialog" }, on: { "close": function($event) {
    return _vm.$emit("close");
  } } }, [_vm._t("default")], 2);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/TileDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFhQTtBQUlBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFIQTtBQUFBO0FBQUEsR0FEQSxXQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsV0FFQTtBQUNBO0FBQUE7QUFBQSxHQUhBLFdBR0E7QUFIQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJUaWxlRGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtMy1kaWFsb2dcbiAgICA6dmFsdWU9XCJ2YWx1ZVwiXG4gICAgOnRpdGxlPVwidGl0bGVcIlxuICAgIDptYXgtd2lkdGg9XCJtYXhXaWR0aFwiXG4gICAgZGF0YS10aWQ9XCJ0aWxlLWRpYWxvZ1wiXG4gICAgQGNsb3NlPVwiJGVtaXQoJ2Nsb3NlJylcIlxuICA+XG4gICAgPHNsb3QgLz5cbiAgPC9tMy1kaWFsb2c+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKiogVGhlIGRlcHRoIGJlaGluZCBhIOKLryBpdGVtOiB0aGUgZXhpc3RpbmcgY29udHJvbCBvciBsaXN0LCBpbiBvbmUgb2Ygb3VyIGRpYWxvZ3MuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGlsZURpYWxvZyBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSB2YWx1ZSE6IGJvb2xlYW5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogW1N0cmluZywgTnVtYmVyXSwgZGVmYXVsdDogNTYwIH0pIHJlYWRvbmx5IG1heFdpZHRoITogc3RyaW5nIHwgbnVtYmVyXG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvb3ZlcnZpZXcvdGlsZXMvVGlsZURpYWxvZy52dWUifQ==