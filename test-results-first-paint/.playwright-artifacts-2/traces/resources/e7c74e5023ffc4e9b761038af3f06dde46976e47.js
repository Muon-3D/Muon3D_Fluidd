/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { foreignBrand } from "/src/services/foreign-printers/brands.ts";
import ForeignSilhouette from "/src/components/foreign/ForeignSilhouette.vue";
import TonePill from "/src/components/printers/TonePill.vue";
let OtherPrinters = class extends Vue {
  tiles;
  record(tile) {
    return tile.entry.foreign.record;
  }
  brand(tile) {
    return foreignBrand(this.record(tile).kind).label;
  }
};
__decorateClass([
  Prop({ type: Array, required: true })
], OtherPrinters.prototype, "tiles", 2);
OtherPrinters = __decorateClass([
  Component({ components: { ForeignSilhouette, TonePill } })
], OtherPrinters);
const _sfc_main = OtherPrinters;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "rows", attrs: { "data-tid": "other-list" } }, _vm._l(_vm.tiles, function(tile) {
    return _c("article", { key: tile.key, staticClass: "row other", attrs: { "role": "link", "tabindex": "0", "aria-label": `Open ${tile.name}` }, on: { "click": function($event) {
      return _vm.$emit("open", tile);
    }, "keydown": [function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
      $event.preventDefault();
      return _vm.$emit("open", tile);
    }, function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "space", 32, $event.key, [" ", "Spacebar"])) return null;
      $event.preventDefault();
      return _vm.$emit("open", tile);
    }] } }, [_c("span", { staticClass: "row__icon other__icon" }, [_c("foreign-silhouette", { attrs: { "form-factor": _vm.record(tile).formFactor } })], 1), _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v(_vm._s(tile.name))]), _c("span", { staticClass: "row__sub" }, [_vm._v(" " + _vm._s(_vm.brand(tile))), _vm.record(tile).model ? [_vm._v(" \xB7 " + _vm._s(_vm.record(tile).model))] : _vm._e(), _vm._v(" \xB7 " + _vm._s(_vm.record(tile).via === "direct" ? "direct" : `through ${_vm.record(tile).m1Name || "M1"}`) + " ")], 2)]), _c("tone-pill", { attrs: { "tone": tile.tone } }, [_vm._v(" " + _vm._s(tile.label) + " ")]), _c(__unplugin_components_0, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
      return [_c("button", _vm._g(_vm._b({ staticClass: "icon-btn", attrs: { "type": "button", "aria-label": `Options for ${tile.name}` }, on: { "click": function($event) {
        $event.stopPropagation();
      }, "keydown": function($event) {
        $event.stopPropagation();
      } } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "more" } })], 1)];
    } }], null, true) }, [_c(__unplugin_components_2, { attrs: { "dense": "" } }, [_c(__unplugin_components_3, { on: { "click": function($event) {
      $event.stopPropagation();
      return _vm.$emit("forget", tile);
    } } }, [_c(__unplugin_components_4, { staticClass: "error--text" }, [_vm._v(" Forget ")])], 1)], 1)], 1)], 1);
  }), 0);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/OtherPrinters.vue?vue&type=style&index=0&scoped=17ddd806&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "17ddd806",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/OtherPrinters.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBMkRBO0FBR0E7QUFDQTtBQUNBO0FBSUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVRBO0FBQUEsRUFEQTtBQUFBLEdBREEsY0FFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk90aGVyUHJpbnRlcnMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwicm93c1wiXG4gICAgZGF0YS10aWQ9XCJvdGhlci1saXN0XCJcbiAgPlxuICAgIDxhcnRpY2xlXG4gICAgICB2LWZvcj1cInRpbGUgaW4gdGlsZXNcIlxuICAgICAgOmtleT1cInRpbGUua2V5XCJcbiAgICAgIGNsYXNzPVwicm93IG90aGVyXCJcbiAgICAgIHJvbGU9XCJsaW5rXCJcbiAgICAgIHRhYmluZGV4PVwiMFwiXG4gICAgICA6YXJpYS1sYWJlbD1cImBPcGVuICR7dGlsZS5uYW1lfWBcIlxuICAgICAgQGNsaWNrPVwiJGVtaXQoJ29wZW4nLCB0aWxlKVwiXG4gICAgICBAa2V5ZG93bi5lbnRlci5wcmV2ZW50PVwiJGVtaXQoJ29wZW4nLCB0aWxlKVwiXG4gICAgICBAa2V5ZG93bi5zcGFjZS5wcmV2ZW50PVwiJGVtaXQoJ29wZW4nLCB0aWxlKVwiXG4gICAgPlxuICAgICAgPHNwYW4gY2xhc3M9XCJyb3dfX2ljb24gb3RoZXJfX2ljb25cIj5cbiAgICAgICAgPGZvcmVpZ24tc2lsaG91ZXR0ZSA6Zm9ybS1mYWN0b3I9XCJyZWNvcmQodGlsZSkuZm9ybUZhY3RvclwiIC8+XG4gICAgICA8L3NwYW4+XG4gICAgICA8ZGl2IGNsYXNzPVwicm93X190ZXh0XCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicm93X190aXRsZVwiPnt7IHRpbGUubmFtZSB9fTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJyb3dfX3N1YlwiPlxuICAgICAgICAgIHt7IGJyYW5kKHRpbGUpIH19PHRlbXBsYXRlIHYtaWY9XCJyZWNvcmQodGlsZSkubW9kZWxcIj4gwrcge3sgcmVjb3JkKHRpbGUpLm1vZGVsIH19PC90ZW1wbGF0ZT5cbiAgICAgICAgICDCtyB7eyByZWNvcmQodGlsZSkudmlhID09PSAnZGlyZWN0JyA/ICdkaXJlY3QnIDogYHRocm91Z2ggJHtyZWNvcmQodGlsZSkubTFOYW1lIHx8ICdNMSd9YCB9fVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDx0b25lLXBpbGwgOnRvbmU9XCJ0aWxlLnRvbmVcIj5cbiAgICAgICAge3sgdGlsZS5sYWJlbCB9fVxuICAgICAgPC90b25lLXBpbGw+XG4gICAgICA8di1tZW51XG4gICAgICAgIGxlZnRcbiAgICAgICAgb2Zmc2V0LXlcbiAgICAgID5cbiAgICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImljb24tYnRuXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE9wdGlvbnMgZm9yICR7dGlsZS5uYW1lfWBcIlxuICAgICAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgICAgIEBjbGljay5zdG9wXG4gICAgICAgICAgICBAa2V5ZG93bi5zdG9wXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1vcmVcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICAgIDx2LWxpc3QtaXRlbSBAY2xpY2suc3RvcD1cIiRlbWl0KCdmb3JnZXQnLCB0aWxlKVwiPlxuICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlIGNsYXNzPVwiZXJyb3ItLXRleHRcIj5cbiAgICAgICAgICAgICAgRm9yZ2V0XG4gICAgICAgICAgICA8L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDwvdi1saXN0PlxuICAgICAgPC92LW1lbnU+XG4gICAgPC9hcnRpY2xlPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IFByaW50ZXJUaWxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL21vZGVsJ1xuaW1wb3J0IHR5cGUgeyBGb3JlaWduUHJpbnRlclJlY29yZCB9IGZyb20gJ0Avc2VydmljZXMvZm9yZWlnbi1wcmludGVycy90eXBlcydcbmltcG9ydCB7IGZvcmVpZ25CcmFuZCB9IGZyb20gJ0Avc2VydmljZXMvZm9yZWlnbi1wcmludGVycy9icmFuZHMnXG5pbXBvcnQgRm9yZWlnblNpbGhvdWV0dGUgZnJvbSAnQC9jb21wb25lbnRzL2ZvcmVpZ24vRm9yZWlnblNpbGhvdWV0dGUudnVlJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJy4vVG9uZVBpbGwudnVlJ1xuXG4vKiogUHJpbnRlcnMgc2F2ZWQgaW4gdGhpcyBicm93c2VyIHRoYXQgYXJlIG5vdCBNMXMgKG90aGVyIGJyYW5kcyk6IGEgcm93IGVhY2gsIHdpdGggRm9yZ2V0IGluIHRoZSBtZW51LiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgRm9yZWlnblNpbGhvdWV0dGUsIFRvbmVQaWxsIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE90aGVyUHJpbnRlcnMgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEFycmF5LCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSB0aWxlcyE6IFByaW50ZXJUaWxlW11cblxuICByZWNvcmQgKHRpbGU6IFByaW50ZXJUaWxlKTogRm9yZWlnblByaW50ZXJSZWNvcmQge1xuICAgIHJldHVybiB0aWxlLmVudHJ5LmZvcmVpZ24hLnJlY29yZFxuICB9XG5cbiAgYnJhbmQgKHRpbGU6IFByaW50ZXJUaWxlKTogc3RyaW5nIHtcbiAgICByZXR1cm4gZm9yZWlnbkJyYW5kKHRoaXMucmVjb3JkKHRpbGUpLmtpbmQpLmxhYmVsXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5vdGhlciB7IGN1cnNvcjogcG9pbnRlcjsgfVxuICAub3RoZXI6Zm9jdXMtdmlzaWJsZSB7IG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtYWNjZW50KTsgb3V0bGluZS1vZmZzZXQ6IC0ycHg7IH1cbiAgLm90aGVyX19pY29uIHsgb3ZlcmZsb3c6IGhpZGRlbjsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3ByaW50ZXJzL090aGVyUHJpbnRlcnMudnVlIn0=