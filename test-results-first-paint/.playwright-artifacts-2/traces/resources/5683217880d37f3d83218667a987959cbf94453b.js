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
let uid = 0;
let PrinterDrawing = class extends Vue {
  kind;
  state;
  tone;
  progress;
  colour;
  drawOn;
  dim;
  label;
  clipId = `pdraw-clip-${++uid}`;
  get running() {
    return this.state === "printing";
  }
  get asleep() {
    return this.state === "offline" || this.state === "unreachable";
  }
  /** How far through the print it is, 0 to 1, only while there is a print. */
  get fraction() {
    if (this.state !== "printing" && this.state !== "paused") return 0;
    return Math.max(0, Math.min(1, (this.progress ?? 0) / 100));
  }
  /** The plate rises as the part hangs longer from it. */
  get plateY() {
    return this.fraction ? Math.round((132 - this.fraction * 76) * 10) / 10 : 60;
  }
  get grown() {
    return Math.round(this.fraction * 76 * 10) / 10;
  }
  get otherGrown() {
    return Math.round(this.fraction * 54 * 10) / 10;
  }
  get partColour() {
    return this.colour || "var(--m3d-accent)";
  }
};
__decorateClass([
  Prop({ type: String, default: "m1" })
], PrinterDrawing.prototype, "kind", 2);
__decorateClass([
  Prop({ type: String, required: true })
], PrinterDrawing.prototype, "state", 2);
__decorateClass([
  Prop({ type: String, required: true })
], PrinterDrawing.prototype, "tone", 2);
__decorateClass([
  Prop({ type: Number, default: null })
], PrinterDrawing.prototype, "progress", 2);
__decorateClass([
  Prop({ type: String, default: null })
], PrinterDrawing.prototype, "colour", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrinterDrawing.prototype, "drawOn", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrinterDrawing.prototype, "dim", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], PrinterDrawing.prototype, "label", 2);
PrinterDrawing = __decorateClass([
  Component({})
], PrinterDrawing);
const _sfc_main = PrinterDrawing;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("svg", { staticClass: "pdraw", class: [`pdraw--${_vm.tone}`, { "pdraw--still": !_vm.running, "pdraw--dim": _vm.dim, "pdraw--draw": _vm.drawOn }], attrs: { "viewBox": "0 0 150 170", "role": "img", "aria-label": _vm.label } }, [_vm.kind === "m1" ? [_c("path", { staticClass: "pdraw__ln", attrs: { "pathLength": "1", "d": "M118 150 V40 H127 V150" } }), _c("path", { staticClass: "pdraw__ln", attrs: { "pathLength": "1", "d": `M22 ${_vm.plateY} H122` } }), _c("clipPath", { attrs: { "id": _vm.clipId } }, [_c("rect", { attrs: { "x": "0", "y": _vm.plateY + 1, "width": "150", "height": _vm.grown } })]), _c("path", { staticClass: "pdraw__part", attrs: { "d": `M52 ${_vm.plateY + 1} H92 Q100 ${_vm.plateY + 25} 88 ${_vm.plateY + 43} Q80 ${_vm.plateY + 57} 90 ${_vm.plateY + 77} H54 Q64 ${_vm.plateY + 57} 56 ${_vm.plateY + 43} Q44 ${_vm.plateY + 25} 52 ${_vm.plateY + 1} Z`, "fill": _vm.partColour, "clip-path": `url(#${_vm.clipId})` } }), _c("g", { staticClass: "pdraw__head" }, [_c("path", { staticClass: "pdraw__noz", attrs: { "d": "M72 152 l-4.5 -6 l4.5 -6 l4.5 6 z" } })]), _c("path", { staticClass: "pdraw__ln pdraw__base", attrs: { "pathLength": "1", "d": "M10 152 H140 a8 8 0 0 1 8 8 V162 a8 8 0 0 1 -8 8 H10 a8 8 0 0 1 -8 -8 V160 a8 8 0 0 1 8 -8 Z" } }), _c("path", { staticClass: "pdraw__knob", attrs: { "d": "M8 154 a13 13 0 0 0 0 14" } }), _c("circle", { staticClass: "pdraw__glow", attrs: { "cx": "25", "cy": "161", "r": "13" } }), _c("circle", { staticClass: "pdraw__screen", attrs: { "cx": "25", "cy": "161", "r": "9.5" } })] : [_c("path", { staticClass: "pdraw__ln", attrs: { "pathLength": "1", "d": "M26 168 V34 H124 V168" } }), _c("path", { staticClass: "pdraw__ln", attrs: { "pathLength": "1", "d": "M14 168 H136" } }), _c("path", { staticClass: "pdraw__ln", attrs: { "pathLength": "1", "d": "M36 150 H114" } }), _c("clipPath", { attrs: { "id": _vm.clipId } }, [_c("rect", { attrs: { "x": "0", "y": 150 - _vm.otherGrown, "width": "150", "height": _vm.otherGrown } })]), _c("path", { staticClass: "pdraw__part", attrs: { "d": "M52 150 V96 H98 V150 Z", "fill": _vm.partColour, "clip-path": `url(#${_vm.clipId})` } }), _c("g", { attrs: { "transform": `translate(0 ${136 - _vm.otherGrown})` } }, [_c("path", { staticClass: "pdraw__ln", attrs: { "pathLength": "1", "d": "M26 0 H124" } }), _c("g", { staticClass: "pdraw__head" }, [_c("path", { staticClass: "pdraw__noz", attrs: { "d": "M75 1 l-4.5 6 l4.5 6 l4.5 -6 z" } })])]), _c("rect", { staticClass: "pdraw__square", attrs: { "x": "100", "y": "154", "width": "18", "height": "12", "rx": "2.5" } })], _vm.tone === "err" ? _c("path", { staticClass: "pdraw__warn", attrs: { "d": "M70 96 l12 21 h-24 z M70 104 v6 M70 113.5 v0.5" } }) : _vm._e(), _vm.asleep ? _c("g", [_c("text", { staticClass: "pdraw__zz", attrs: { "x": "100", "y": "36" } }, [_vm._v("z")]), _c("text", { staticClass: "pdraw__zz pdraw__zz--late", attrs: { "x": "110", "y": "24" } }, [_vm._v("z")])]) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/PrinterDrawing.vue?vue&type=style&index=0&scoped=0c915802&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "0c915802",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/PrinterDrawing.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTJJQTtBQUdBO0FBVUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExREE7QUFBQSxFQURBO0FBQUEsR0FEQSxlQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxlQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxlQVFBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FYQSxlQVlBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FmQSxlQWdCQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBbkJBLGVBb0JBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0F0QkEsZUF1QkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQXpCQSxlQTBCQTtBQTFCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmludGVyRHJhd2luZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c3ZnXG4gICAgY2xhc3M9XCJwZHJhd1wiXG4gICAgOmNsYXNzPVwiW2BwZHJhdy0tJHt0b25lfWAsIHsgJ3BkcmF3LS1zdGlsbCc6ICFydW5uaW5nLCAncGRyYXctLWRpbSc6IGRpbSwgJ3BkcmF3LS1kcmF3JzogZHJhd09uIH1dXCJcbiAgICB2aWV3Qm94PVwiMCAwIDE1MCAxNzBcIlxuICAgIHJvbGU9XCJpbWdcIlxuICAgIDphcmlhLWxhYmVsPVwibGFiZWxcIlxuICA+XG4gICAgPHRlbXBsYXRlIHYtaWY9XCJraW5kID09PSAnbTEnXCI+XG4gICAgICA8IS0tIEFuIE0xLCB1cHNpZGUgZG93biBhcyBpdCBpczogdGhlIGNvbHVtbiBhdCB0aGUgYmFjayBjYXJyaWVzIHRoZSBwbGF0ZSxcbiAgICAgICAgICAgdGhlIHBhcnQgaGFuZ3MgZnJvbSB0aGUgcGxhdGUgYW5kIGdyb3dzIGRvd24gdG8gdGhlIG5venpsZSBpbiB0aGUgYmFzZS4gLS0+XG4gICAgICA8cGF0aFxuICAgICAgICBjbGFzcz1cInBkcmF3X19sblwiXG4gICAgICAgIHBhdGhMZW5ndGg9XCIxXCJcbiAgICAgICAgZD1cIk0xMTggMTUwIFY0MCBIMTI3IFYxNTBcIlxuICAgICAgLz5cbiAgICAgIDxwYXRoXG4gICAgICAgIGNsYXNzPVwicGRyYXdfX2xuXCJcbiAgICAgICAgcGF0aExlbmd0aD1cIjFcIlxuICAgICAgICA6ZD1cImBNMjIgJHtwbGF0ZVl9IEgxMjJgXCJcbiAgICAgIC8+XG4gICAgICA8Y2xpcFBhdGggOmlkPVwiY2xpcElkXCI+XG4gICAgICAgIDxyZWN0XG4gICAgICAgICAgeD1cIjBcIlxuICAgICAgICAgIDp5PVwicGxhdGVZICsgMVwiXG4gICAgICAgICAgd2lkdGg9XCIxNTBcIlxuICAgICAgICAgIDpoZWlnaHQ9XCJncm93blwiXG4gICAgICAgIC8+XG4gICAgICA8L2NsaXBQYXRoPlxuICAgICAgPHBhdGhcbiAgICAgICAgY2xhc3M9XCJwZHJhd19fcGFydFwiXG4gICAgICAgIDpkPVwiYE01MiAke3BsYXRlWSArIDF9IEg5MiBRMTAwICR7cGxhdGVZICsgMjV9IDg4ICR7cGxhdGVZICsgNDN9IFE4MCAke3BsYXRlWSArIDU3fSA5MCAke3BsYXRlWSArIDc3fSBINTQgUTY0ICR7cGxhdGVZICsgNTd9IDU2ICR7cGxhdGVZICsgNDN9IFE0NCAke3BsYXRlWSArIDI1fSA1MiAke3BsYXRlWSArIDF9IFpgXCJcbiAgICAgICAgOmZpbGw9XCJwYXJ0Q29sb3VyXCJcbiAgICAgICAgOmNsaXAtcGF0aD1cImB1cmwoIyR7Y2xpcElkfSlgXCJcbiAgICAgIC8+XG4gICAgICA8ZyBjbGFzcz1cInBkcmF3X19oZWFkXCI+XG4gICAgICAgIDxwYXRoXG4gICAgICAgICAgY2xhc3M9XCJwZHJhd19fbm96XCJcbiAgICAgICAgICBkPVwiTTcyIDE1MiBsLTQuNSAtNiBsNC41IC02IGw0LjUgNiB6XCJcbiAgICAgICAgLz5cbiAgICAgIDwvZz5cbiAgICAgIDxwYXRoXG4gICAgICAgIGNsYXNzPVwicGRyYXdfX2xuIHBkcmF3X19iYXNlXCJcbiAgICAgICAgcGF0aExlbmd0aD1cIjFcIlxuICAgICAgICBkPVwiTTEwIDE1MiBIMTQwIGE4IDggMCAwIDEgOCA4IFYxNjIgYTggOCAwIDAgMSAtOCA4IEgxMCBhOCA4IDAgMCAxIC04IC04IFYxNjAgYTggOCAwIDAgMSA4IC04IFpcIlxuICAgICAgLz5cbiAgICAgIDxwYXRoXG4gICAgICAgIGNsYXNzPVwicGRyYXdfX2tub2JcIlxuICAgICAgICBkPVwiTTggMTU0IGExMyAxMyAwIDAgMCAwIDE0XCJcbiAgICAgIC8+XG4gICAgICA8IS0tIEl0cyByb3VuZCBzY3JlZW4sIGdsb3dpbmcgaW4gaXRzIHN0YXRlJ3MgY29sb3VyLiAtLT5cbiAgICAgIDxjaXJjbGVcbiAgICAgICAgY2xhc3M9XCJwZHJhd19fZ2xvd1wiXG4gICAgICAgIGN4PVwiMjVcIlxuICAgICAgICBjeT1cIjE2MVwiXG4gICAgICAgIHI9XCIxM1wiXG4gICAgICAvPlxuICAgICAgPGNpcmNsZVxuICAgICAgICBjbGFzcz1cInBkcmF3X19zY3JlZW5cIlxuICAgICAgICBjeD1cIjI1XCJcbiAgICAgICAgY3k9XCIxNjFcIlxuICAgICAgICByPVwiOS41XCJcbiAgICAgIC8+XG4gICAgPC90ZW1wbGF0ZT5cbiAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgPCEtLSBBbnkgb3RoZXIgS2xpcHBlciBwcmludGVyOiBhIHBsYWluIGJveCBmcmFtZSB0aGF0IHByaW50cyB1cHdhcmRzXG4gICAgICAgICAgIGZyb20gaXRzIGJlZCwgd2l0aCBhIHNtYWxsIHNxdWFyZSB3aGVyZSBhbiBNMSBoYXMgaXRzIHJvdW5kIHNjcmVlbi4gLS0+XG4gICAgICA8cGF0aFxuICAgICAgICBjbGFzcz1cInBkcmF3X19sblwiXG4gICAgICAgIHBhdGhMZW5ndGg9XCIxXCJcbiAgICAgICAgZD1cIk0yNiAxNjggVjM0IEgxMjQgVjE2OFwiXG4gICAgICAvPlxuICAgICAgPHBhdGhcbiAgICAgICAgY2xhc3M9XCJwZHJhd19fbG5cIlxuICAgICAgICBwYXRoTGVuZ3RoPVwiMVwiXG4gICAgICAgIGQ9XCJNMTQgMTY4IEgxMzZcIlxuICAgICAgLz5cbiAgICAgIDxwYXRoXG4gICAgICAgIGNsYXNzPVwicGRyYXdfX2xuXCJcbiAgICAgICAgcGF0aExlbmd0aD1cIjFcIlxuICAgICAgICBkPVwiTTM2IDE1MCBIMTE0XCJcbiAgICAgIC8+XG4gICAgICA8Y2xpcFBhdGggOmlkPVwiY2xpcElkXCI+XG4gICAgICAgIDxyZWN0XG4gICAgICAgICAgeD1cIjBcIlxuICAgICAgICAgIDp5PVwiMTUwIC0gb3RoZXJHcm93blwiXG4gICAgICAgICAgd2lkdGg9XCIxNTBcIlxuICAgICAgICAgIDpoZWlnaHQ9XCJvdGhlckdyb3duXCJcbiAgICAgICAgLz5cbiAgICAgIDwvY2xpcFBhdGg+XG4gICAgICA8cGF0aFxuICAgICAgICBjbGFzcz1cInBkcmF3X19wYXJ0XCJcbiAgICAgICAgZD1cIk01MiAxNTAgVjk2IEg5OCBWMTUwIFpcIlxuICAgICAgICA6ZmlsbD1cInBhcnRDb2xvdXJcIlxuICAgICAgICA6Y2xpcC1wYXRoPVwiYHVybCgjJHtjbGlwSWR9KWBcIlxuICAgICAgLz5cbiAgICAgIDxnIDp0cmFuc2Zvcm09XCJgdHJhbnNsYXRlKDAgJHsxMzYgLSBvdGhlckdyb3dufSlgXCI+XG4gICAgICAgIDxwYXRoXG4gICAgICAgICAgY2xhc3M9XCJwZHJhd19fbG5cIlxuICAgICAgICAgIHBhdGhMZW5ndGg9XCIxXCJcbiAgICAgICAgICBkPVwiTTI2IDAgSDEyNFwiXG4gICAgICAgIC8+XG4gICAgICAgIDxnIGNsYXNzPVwicGRyYXdfX2hlYWRcIj5cbiAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgY2xhc3M9XCJwZHJhd19fbm96XCJcbiAgICAgICAgICAgIGQ9XCJNNzUgMSBsLTQuNSA2IGw0LjUgNiBsNC41IC02IHpcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZz5cbiAgICAgIDwvZz5cbiAgICAgIDxyZWN0XG4gICAgICAgIGNsYXNzPVwicGRyYXdfX3NxdWFyZVwiXG4gICAgICAgIHg9XCIxMDBcIlxuICAgICAgICB5PVwiMTU0XCJcbiAgICAgICAgd2lkdGg9XCIxOFwiXG4gICAgICAgIGhlaWdodD1cIjEyXCJcbiAgICAgICAgcng9XCIyLjVcIlxuICAgICAgLz5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDxwYXRoXG4gICAgICB2LWlmPVwidG9uZSA9PT0gJ2VycidcIlxuICAgICAgY2xhc3M9XCJwZHJhd19fd2FyblwiXG4gICAgICBkPVwiTTcwIDk2IGwxMiAyMSBoLTI0IHogTTcwIDEwNCB2NiBNNzAgMTEzLjUgdjAuNVwiXG4gICAgLz5cbiAgICA8ZyB2LWlmPVwiYXNsZWVwXCI+XG4gICAgICA8dGV4dFxuICAgICAgICB4PVwiMTAwXCJcbiAgICAgICAgeT1cIjM2XCJcbiAgICAgICAgY2xhc3M9XCJwZHJhd19fenpcIlxuICAgICAgPno8L3RleHQ+XG4gICAgICA8dGV4dFxuICAgICAgICB4PVwiMTEwXCJcbiAgICAgICAgeT1cIjI0XCJcbiAgICAgICAgY2xhc3M9XCJwZHJhd19fenogcGRyYXdfX3p6LS1sYXRlXCJcbiAgICAgID56PC90ZXh0PlxuICAgIDwvZz5cbiAgPC9zdmc+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBUaWxlU3RhdGUsIFRpbGVUb25lIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL21vZGVsJ1xuXG5sZXQgdWlkID0gMFxuXG4vKipcbiAqIEEgcHJpbnRlciBkcmF3biBhcyBhIGxpbmUgZHJhd2luZyAoS0FOLTIyNTcsIHRoZSBCZW5jaCwgY29udHJvbC1jdHgpOiBhblxuICogTTEgd2l0aCBpdHMgcGFydCBncm93aW5nIGluIGl0cyBmaWxhbWVudCdzIGNvbG91ciBhcyBpdCBwcmludHMgYW5kIGl0c1xuICogc21hbGwgcm91bmQgc2NyZWVuIGdsb3dpbmcgaW4gaXRzIHN0YXRlJ3MgY29sb3VyLCBvciwgZm9yIGFueSBvdGhlclxuICogS2xpcHBlciBwcmludGVyLCBhIHBsYWluIGJveCBmcmFtZSB0aGF0IHByaW50cyB1cHdhcmRzLiBPbmx5IHRyYW5zZm9ybXNcbiAqIGFuZCB0aGUgbGluZSdzIGRhc2ggbW92ZTsgYSBwcmludGVyIHRoYXQgaXNuJ3QgcHJpbnRpbmcgc3RhbmRzIHN0aWxsLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJpbnRlckRyYXdpbmcgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ20xJyB9KVxuICByZWFkb25seSBraW5kITogJ20xJyB8ICdvdGhlcidcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgc3RhdGUhOiBUaWxlU3RhdGVcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgdG9uZSE6IFRpbGVUb25lXG5cbiAgLyoqIDAgdG8gMTAwLCB3aGlsZSBwcmludGluZyBvciBwYXVzZWQuICovXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiBudWxsIH0pXG4gIHJlYWRvbmx5IHByb2dyZXNzITogbnVtYmVyIHwgbnVsbFxuXG4gIC8qKiBUaGUgbG9hZGVkIGZpbGFtZW50J3MgY29sb3VyLCB3aGVuIHRoZSBwcmludGVyIGhhcyBzYWlkLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSBjb2xvdXIhOiBzdHJpbmcgfCBudWxsXG5cbiAgLyoqIERyYXcgdGhlIGxpbmVzIG9uLCBvbmNlLCBhcyB0aGUgcGFnZSBhcnJpdmVzLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZHJhd09uITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBkaW0hOiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IGxhYmVsITogc3RyaW5nXG5cbiAgcmVhZG9ubHkgY2xpcElkID0gYHBkcmF3LWNsaXAtJHsrK3VpZH1gXG5cbiAgZ2V0IHJ1bm5pbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlID09PSAncHJpbnRpbmcnXG4gIH1cblxuICBnZXQgYXNsZWVwICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZSA9PT0gJ29mZmxpbmUnIHx8IHRoaXMuc3RhdGUgPT09ICd1bnJlYWNoYWJsZSdcbiAgfVxuXG4gIC8qKiBIb3cgZmFyIHRocm91Z2ggdGhlIHByaW50IGl0IGlzLCAwIHRvIDEsIG9ubHkgd2hpbGUgdGhlcmUgaXMgYSBwcmludC4gKi9cbiAgZ2V0IGZyYWN0aW9uICgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSAncHJpbnRpbmcnICYmIHRoaXMuc3RhdGUgIT09ICdwYXVzZWQnKSByZXR1cm4gMFxuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAodGhpcy5wcm9ncmVzcyA/PyAwKSAvIDEwMCkpXG4gIH1cblxuICAvKiogVGhlIHBsYXRlIHJpc2VzIGFzIHRoZSBwYXJ0IGhhbmdzIGxvbmdlciBmcm9tIGl0LiAqL1xuICBnZXQgcGxhdGVZICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmZyYWN0aW9uID8gTWF0aC5yb3VuZCgoMTMyIC0gdGhpcy5mcmFjdGlvbiAqIDc2KSAqIDEwKSAvIDEwIDogNjBcbiAgfVxuXG4gIGdldCBncm93biAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmZyYWN0aW9uICogNzYgKiAxMCkgLyAxMFxuICB9XG5cbiAgZ2V0IG90aGVyR3Jvd24gKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5mcmFjdGlvbiAqIDU0ICogMTApIC8gMTBcbiAgfVxuXG4gIGdldCBwYXJ0Q29sb3VyICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNvbG91ciB8fCAndmFyKC0tbTNkLWFjY2VudCknXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5wZHJhdyB7XG4gICAgLS1wZC1pbms6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAtLXBkLXBhcGVyOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgLS1wZC1zdGF0ZTogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcblxuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogYXV0bztcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgfVxuXG4gIC8vIE9uZSBjb2xvdXIgcGVyIHN0YXRlLCBhcyBldmVyeXdoZXJlOiBwcmludGluZyB0ZWFsLCByZWFkeSBncmVlbiwgd2FpdGluZ1xuICAvLyBhbWJlciwgZmF1bHQgcmVkLCBhc2xlZXAgZ3JleS5cbiAgLnBkcmF3LS1ydW4geyAtLXBkLXN0YXRlOiB2YXIoLS1tM2QtYWNjZW50KTsgfVxuICAucGRyYXctLW9rIHsgLS1wZC1zdGF0ZTogdmFyKC0tbTNkLXN1Y2Nlc3MpOyB9XG4gIC5wZHJhdy0td2FybiB7IC0tcGQtc3RhdGU6IHZhcigtLW0zZC13YXJuaW5nKTsgfVxuICAucGRyYXctLWVyciB7IC0tcGQtc3RhdGU6IHZhcigtLW0zZC1kYW5nZXIpOyB9XG4gIC5wZHJhdy0tb2ZmIHsgLS1wZC1zdGF0ZTogdmFyKC0tbTNkLXRleHQtc3VidGxlKTsgfVxuICAucGRyYXctLWluZm8geyAtLXBkLXN0YXRlOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IH1cblxuICAucGRyYXdfX2xuIHtcbiAgICBmaWxsOiBub25lO1xuICAgIHN0cm9rZTogdmFyKC0tcGQtaW5rKTtcbiAgICBzdHJva2Utd2lkdGg6IDEuODtcbiAgICBzdHJva2UtbGluZWNhcDogcm91bmQ7XG4gICAgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDtcbiAgICBzdHJva2UtZGFzaGFycmF5OiAxO1xuICB9XG5cbiAgLnBkcmF3X19iYXNlIHsgZmlsbDogdmFyKC0tcGQtcGFwZXIpOyB9XG5cbiAgLnBkcmF3X19ub3oge1xuICAgIGZpbGw6IHZhcigtLXBkLXBhcGVyKTtcbiAgICBzdHJva2U6IHZhcigtLXBkLWluayk7XG4gICAgc3Ryb2tlLXdpZHRoOiAxLjQ7XG4gIH1cblxuICAvLyBUaGUgaGVhZCB3b3JrcyBzaWRlIHRvIHNpZGUgd2hpbGUgaXQgcHJpbnRzOiBhIHRyYW5zZm9ybSwgbm90aGluZyBlbHNlLlxuICAucGRyYXdfX2hlYWQgeyBhbmltYXRpb246IHBkcmF3LXByaW50IDEuMjVzIGVhc2UtaW4tb3V0IGluZmluaXRlIGFsdGVybmF0ZTsgfVxuICAucGRyYXctLXN0aWxsIC5wZHJhd19faGVhZCB7IGFuaW1hdGlvbjogbm9uZTsgb3BhY2l0eTogMC4zOyB9XG5cbiAgQGtleWZyYW1lcyBwZHJhdy1wcmludCB7XG4gICAgZnJvbSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTVweCk7IH1cbiAgICB0byB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxNXB4KTsgfVxuICB9XG5cbiAgLnBkcmF3X19rbm9iIHtcbiAgICBmaWxsOiBub25lO1xuICAgIHN0cm9rZTogdmFyKC0tcGQtc3RhdGUpO1xuICAgIHN0cm9rZS13aWR0aDogMi42O1xuICAgIHN0cm9rZS1saW5lY2FwOiByb3VuZDtcbiAgfVxuXG4gIC5wZHJhd19fc2NyZWVuIHtcbiAgICBmaWxsOiAjMDAwO1xuICAgIHN0cm9rZTogdmFyKC0tcGQtaW5rKTtcbiAgICBzdHJva2Utd2lkdGg6IDEuNjtcbiAgfVxuXG4gIC5wZHJhd19fZ2xvdyB7XG4gICAgZmlsbDogbm9uZTtcbiAgICBzdHJva2U6IHZhcigtLXBkLXN0YXRlKTtcbiAgICBzdHJva2Utd2lkdGg6IDM7XG4gICAgb3BhY2l0eTogMC41NTtcbiAgfVxuXG4gIC5wZHJhd19fc3F1YXJlIHtcbiAgICBmaWxsOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBzdHJva2U6IHZhcigtLXBkLXN0YXRlKTtcbiAgICBzdHJva2Utd2lkdGg6IDEuNjtcbiAgfVxuXG4gIC5wZHJhd19fd2FybiB7XG4gICAgZmlsbDogbm9uZTtcbiAgICBzdHJva2U6IHZhcigtLW0zZC1kYW5nZXIpO1xuICAgIHN0cm9rZS13aWR0aDogMi4yO1xuICAgIHN0cm9rZS1saW5lam9pbjogcm91bmQ7XG4gICAgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kO1xuICB9XG5cbiAgLnBkcmF3X196eiB7XG4gICAgZm9udDogMTJweCB2YXIoLS1tM2QtZm9udC1tb25vLCBtb25vc3BhY2UpO1xuICAgIGZpbGw6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBhbmltYXRpb246IHBkcmF3LXp6IDIuNHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7XG4gIH1cblxuICAucGRyYXdfX3p6LS1sYXRlIHsgYW5pbWF0aW9uLWRlbGF5OiAwLjlzOyB9XG5cbiAgQGtleWZyYW1lcyBwZHJhdy16eiB7XG4gICAgMCUgeyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNnB4KTsgfVxuICAgIDQwJSB7IG9wYWNpdHk6IDE7IH1cbiAgICAxMDAlIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC04cHgpOyB9XG4gIH1cblxuICAucGRyYXctLWRpbSB7IG9wYWNpdHk6IDAuNDU7IH1cblxuICAvLyBXaGlsZSB0aGUgbGlzdCBhcnJpdmVzLCB0aGUgZHJhd2luZyBkcmF3cyBpdHNlbGYgKG1vdGlvbi1zbG93ZXIsIGVhc2Utc3RhbmRhcmQpLlxuICAucGRyYXctLWRyYXcgLnBkcmF3X19sbiB7XG4gICAgYW5pbWF0aW9uOiBwZHJhdy1vbiB2YXIoLS1tM2QtbW90aW9uLXNsb3dlciwgNTIwbXMpIHZhcigtLW0zZC1lYXNlLXN0YW5kYXJkLCBlYXNlKSBib3RoO1xuICB9XG5cbiAgQGtleWZyYW1lcyBwZHJhdy1vbiB7XG4gICAgZnJvbSB7IHN0cm9rZS1kYXNob2Zmc2V0OiAxOyB9XG4gICAgdG8geyBzdHJva2UtZGFzaG9mZnNldDogMDsgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvcHJpbnRlcnMvUHJpbnRlckRyYXdpbmcudnVlIn0=