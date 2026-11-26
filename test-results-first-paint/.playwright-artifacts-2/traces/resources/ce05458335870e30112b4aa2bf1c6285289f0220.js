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
let EmbedTile = class extends Vue {
  tile;
  loader;
  get inner() {
    return this.loader;
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], EmbedTile.prototype, "tile", 2);
__decorateClass([
  Prop({ type: Function, required: true })
], EmbedTile.prototype, "loader", 2);
EmbedTile = __decorateClass([
  Component({})
], EmbedTile);
const _sfc_main = EmbedTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "et", attrs: { "data-tile": _vm.tile } }, [_c(_vm.inner, { tag: "component" })], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/EmbedTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/EmbedTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVVBO0FBU0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQ0E7QUFKQTtBQUFBO0FBQUEsR0FEQSxVQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsVUFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkVtYmVkVGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvblxuICAgIGNsYXNzPVwiZXRcIlxuICAgIDpkYXRhLXRpbGU9XCJ0aWxlXCJcbiAgPlxuICAgIDxjb21wb25lbnQgOmlzPVwiaW5uZXJcIiAvPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKipcbiAqIEFuIGV4aXN0aW5nIGNhcmQgKHRoZSBjYW1lcmEsIGNvbnNvbGUsIGJlZCBtZXNoLCBzeXN0ZW0pIGRyYXduIGFzIGFuXG4gKiBPdmVydmlldyB3aWRnZXQuIFRoZSBjYXJkIGlzIGxvYWRlZCB3aGVuIHRoZSB3aWRnZXQgaXMgZmlyc3Qgb24gdGhlIHBhZ2UsXG4gKiBzbyBhIHdpZGdldCBub2JvZHkgYWRkZWQgY29zdHMgbm90aGluZy4gSXQgc2Nyb2xscyBpbnNpZGUgaXRzIHRpbGVcbiAqIHJhdGhlciB0aGFuIGdyb3dpbmcgdGhlIHBhZ2UuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbWJlZFRpbGUgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgdGlsZSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IEZ1bmN0aW9uLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBsb2FkZXIhOiAoKSA9PiBQcm9taXNlPHVua25vd24+XG5cbiAgZ2V0IGlubmVyICgpIHsgcmV0dXJuIHRoaXMubG9hZGVyIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbi5ldCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IG1pbi13aWR0aDogMDsgb3ZlcmZsb3c6IGF1dG87IGJvcmRlci1yYWRpdXM6IDIycHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgfVxuLmV0ID4gKiB7IGZsZXg6IDEgMSBhdXRvOyBtaW4td2lkdGg6IDA7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL292ZXJ2aWV3L3RpbGVzL0VtYmVkVGlsZS52dWUifQ==