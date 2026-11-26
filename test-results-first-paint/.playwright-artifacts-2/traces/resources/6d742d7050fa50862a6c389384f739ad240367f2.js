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
import PrinterDrawing from "/src/components/printers/PrinterDrawing.vue";
import { heatingTemp } from "/src/services/printers-page/model.ts";
let BenchPrinter = class extends Vue {
  tile;
  actions;
  draggable;
  found;
  drawOn;
  /** Something happens when it is pressed: not a found printer that offers nothing. */
  get interactive() {
    return !this.found || this.actions.length > 0;
  }
  activate() {
    if (!this.interactive) return;
    if (this.found) {
      if (this.actions[0] && !this.actions[0].disabled) this.$emit("action", this.actions[0].id);
    } else {
      this.$emit("open");
    }
  }
  get foreign() {
    return !!this.tile.entry.foreign;
  }
  get colour() {
    return this.tile.job?.material?.colour ?? null;
  }
  get stateWords() {
    if (this.found) return this.actions.length ? this.tile.detail : this.tile.entry.detail;
    const label = this.tile.label;
    if (this.heating !== null) return `Heating \xB7 ${this.heating}\xB0`;
    if (this.tile.state === "printing") return label === "Printing" ? "Printing" : `Printing \xB7 ${label}`;
    const detail = this.tile.state === "paused" ? this.tile.detail : "";
    return detail && detail !== label ? `${label} \xB7 ${detail}` : label;
  }
  /** The temperature the print is heating towards, while it is still heating. */
  get heating() {
    return !this.found && this.tile.state === "printing" ? heatingTemp(this.tile.job) : null;
  }
  /** The file being printed, on the line under the state. */
  get fileLine() {
    return !this.found && this.tile.state === "printing" ? this.tile.detail : "";
  }
  /** What is loaded, when the printer has said. How much is left isn't known yet, so it isn't drawn as known. */
  get materialLine() {
    return this.tile.job?.material?.name ?? "";
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], BenchPrinter.prototype, "tile", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], BenchPrinter.prototype, "actions", 2);
__decorateClass([
  Prop({ type: Boolean })
], BenchPrinter.prototype, "draggable", 2);
__decorateClass([
  Prop({ type: Boolean })
], BenchPrinter.prototype, "found", 2);
__decorateClass([
  Prop({ type: Boolean })
], BenchPrinter.prototype, "drawOn", 2);
BenchPrinter = __decorateClass([
  Component({ components: { PrinterDrawing } })
], BenchPrinter);
const _sfc_main = BenchPrinter;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "bprint", class: [`bprint--${_vm.tile.tone}`, { "bprint--found": _vm.found, "bprint--grab": _vm.draggable, "bprint--heating": _vm.heating !== null }], attrs: { "draggable": _vm.draggable ? "true" : void 0, "data-tid": `printer-tile-${_vm.tile.key}` }, on: { "dragstart": function($event) {
    return _vm.$emit("dragstart", $event);
  }, "dragend": function($event) {
    return _vm.$emit("dragend", $event);
  } } }, [_c("div", { staticClass: "bprint__stand", class: { "bprint__stand--still": !_vm.interactive }, attrs: { "role": _vm.interactive ? "button" : void 0, "tabindex": _vm.interactive ? 0 : void 0, "aria-label": _vm.found ? `${_vm.tile.name}: ${_vm.stateWords}` : `Open ${_vm.tile.name}` }, on: { "click": _vm.activate, "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    $event.preventDefault();
    return _vm.activate.apply(null, arguments);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "space", 32, $event.key, [" ", "Spacebar"])) return null;
    $event.preventDefault();
    return _vm.activate.apply(null, arguments);
  }] } }, [_c("printer-drawing", { attrs: { "kind": _vm.foreign ? "other" : "m1", "state": _vm.tile.state, "tone": _vm.tile.tone, "progress": _vm.tile.job ? _vm.tile.job.progress : null, "colour": _vm.colour, "draw-on": _vm.drawOn, "dim": _vm.tile.state === "offline" || _vm.found, "label": `${_vm.tile.name}, ${_vm.tile.label}` } })], 1), _vm.actions.length ? _c("div", { staticClass: "bprint__acts", class: { "bprint__acts--always": _vm.found } }, _vm._l(_vm.actions, function(a) {
    return _c("button", { key: a.id, staticClass: "bprint__act", attrs: { "type": "button", "disabled": a.disabled, "data-tid": `bench-action-${a.id}` }, on: { "click": function($event) {
      $event.stopPropagation();
      return _vm.$emit("action", a.id);
    } } }, [_vm._v(" " + _vm._s(a.label) + " ")]);
  }), 0) : _vm._e(), _c("div", { staticClass: "bprint__under" }, [_c("svg", { staticClass: "bprint__spool", attrs: { "viewBox": "-24 -24 48 48", "aria-hidden": "true" } }, [_c("circle", { staticClass: "bprint__flange", attrs: { "r": "21" } }), _vm.colour ? _c("circle", { attrs: { "r": "15", "fill": _vm.colour } }) : _vm._e(), _c("circle", { staticClass: "bprint__hub", attrs: { "r": "6" } })]), _c("div", { staticClass: "bprint__text" }, [_c("b", { staticClass: "bprint__name", attrs: { "title": _vm.tile.name } }, [_vm._v(_vm._s(_vm.tile.name))]), _vm.tile.sharedBy ? _c("span", { staticClass: "bprint__tag", attrs: { "data-tid": "shared-by", "title": `from ${_vm.tile.sharedBy}` } }, [_vm._v("from " + _vm._s(_vm.tile.sharedBy))]) : _vm.foreign ? _c("span", { staticClass: "bprint__tag" }, [_vm._v("Klipper")]) : _vm._e(), _c("span", { staticClass: "bprint__state" }, [_c("i"), _vm._v(_vm._s(_vm.stateWords))]), _vm.fileLine ? _c("small", { attrs: { "title": _vm.fileLine } }, [_vm._v(_vm._s(_vm.fileLine))]) : _vm._e(), _vm.materialLine ? _c("small", { attrs: { "title": _vm.materialLine } }, [_vm._v(_vm._s(_vm.materialLine))]) : _vm._e()])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/BenchPrinter.vue?vue&type=style&index=0&scoped=85a8f67d&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "85a8f67d",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/BenchPrinter.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtHQTtBQUNBO0FBQ0E7QUFhQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUlBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTlEQTtBQUFBLEVBREE7QUFBQSxHQURBLGFBRUE7QUFHQTtBQUFBO0dBTEEsYUFLQTtBQUdBO0FBQUE7R0FSQSxhQVFBO0FBR0E7QUFBQTtHQVhBLGFBV0E7QUFHQTtBQUFBO0dBZEEsYUFjQTtBQWRBO0FBQUE7QUFBQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQmVuY2hQcmludGVyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cImJwcmludFwiXG4gICAgOmNsYXNzPVwiW2BicHJpbnQtLSR7dGlsZS50b25lfWAsIHsgJ2JwcmludC0tZm91bmQnOiBmb3VuZCwgJ2JwcmludC0tZ3JhYic6IGRyYWdnYWJsZSwgJ2JwcmludC0taGVhdGluZyc6IGhlYXRpbmcgIT09IG51bGwgfV1cIlxuICAgIDpkcmFnZ2FibGU9XCJkcmFnZ2FibGUgPyAndHJ1ZScgOiB1bmRlZmluZWRcIlxuICAgIDpkYXRhLXRpZD1cImBwcmludGVyLXRpbGUtJHt0aWxlLmtleX1gXCJcbiAgICBAZHJhZ3N0YXJ0PVwiJGVtaXQoJ2RyYWdzdGFydCcsICRldmVudClcIlxuICAgIEBkcmFnZW5kPVwiJGVtaXQoJ2RyYWdlbmQnLCAkZXZlbnQpXCJcbiAgPlxuICAgIDwhLS0gQSBmb2N1c2FibGUgZWxlbWVudCwgbm90IGEgPGJ1dHRvbj46IGEgZHJhZyBjYW4ndCBzdGFydCBvbiBhIGJ1dHRvbi4gQSBmb3VuZCBwcmludGVyIHdpdGggbm90aGluZyB0byBkbyBpcyBvbmx5IGEgcGljdHVyZS4gLS0+XG4gICAgPGRpdlxuICAgICAgOnJvbGU9XCJpbnRlcmFjdGl2ZSA/ICdidXR0b24nIDogdW5kZWZpbmVkXCJcbiAgICAgIDp0YWJpbmRleD1cImludGVyYWN0aXZlID8gMCA6IHVuZGVmaW5lZFwiXG4gICAgICBjbGFzcz1cImJwcmludF9fc3RhbmRcIlxuICAgICAgOmNsYXNzPVwieyAnYnByaW50X19zdGFuZC0tc3RpbGwnOiAhaW50ZXJhY3RpdmUgfVwiXG4gICAgICA6YXJpYS1sYWJlbD1cImZvdW5kID8gYCR7dGlsZS5uYW1lfTogJHtzdGF0ZVdvcmRzfWAgOiBgT3BlbiAke3RpbGUubmFtZX1gXCJcbiAgICAgIEBjbGljaz1cImFjdGl2YXRlXCJcbiAgICAgIEBrZXlkb3duLmVudGVyLnByZXZlbnQ9XCJhY3RpdmF0ZVwiXG4gICAgICBAa2V5ZG93bi5zcGFjZS5wcmV2ZW50PVwiYWN0aXZhdGVcIlxuICAgID5cbiAgICAgIDxwcmludGVyLWRyYXdpbmdcbiAgICAgICAgOmtpbmQ9XCJmb3JlaWduID8gJ290aGVyJyA6ICdtMSdcIlxuICAgICAgICA6c3RhdGU9XCJ0aWxlLnN0YXRlXCJcbiAgICAgICAgOnRvbmU9XCJ0aWxlLnRvbmVcIlxuICAgICAgICA6cHJvZ3Jlc3M9XCJ0aWxlLmpvYiA/IHRpbGUuam9iLnByb2dyZXNzIDogbnVsbFwiXG4gICAgICAgIDpjb2xvdXI9XCJjb2xvdXJcIlxuICAgICAgICA6ZHJhdy1vbj1cImRyYXdPblwiXG4gICAgICAgIDpkaW09XCJ0aWxlLnN0YXRlID09PSAnb2ZmbGluZScgfHwgZm91bmRcIlxuICAgICAgICA6bGFiZWw9XCJgJHt0aWxlLm5hbWV9LCAke3RpbGUubGFiZWx9YFwiXG4gICAgICAvPlxuICAgIDwvZGl2PlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJhY3Rpb25zLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cImJwcmludF9fYWN0c1wiXG4gICAgICA6Y2xhc3M9XCJ7ICdicHJpbnRfX2FjdHMtLWFsd2F5cyc6IGZvdW5kIH1cIlxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1mb3I9XCJhIGluIGFjdGlvbnNcIlxuICAgICAgICA6a2V5PVwiYS5pZFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJwcmludF9fYWN0XCJcbiAgICAgICAgOmRpc2FibGVkPVwiYS5kaXNhYmxlZFwiXG4gICAgICAgIDpkYXRhLXRpZD1cImBiZW5jaC1hY3Rpb24tJHthLmlkfWBcIlxuICAgICAgICBAY2xpY2suc3RvcD1cIiRlbWl0KCdhY3Rpb24nLCBhLmlkKVwiXG4gICAgICA+XG4gICAgICAgIHt7IGEubGFiZWwgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJicHJpbnRfX3VuZGVyXCI+XG4gICAgICA8c3ZnXG4gICAgICAgIGNsYXNzPVwiYnByaW50X19zcG9vbFwiXG4gICAgICAgIHZpZXdCb3g9XCItMjQgLTI0IDQ4IDQ4XCJcbiAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgID5cbiAgICAgICAgPGNpcmNsZVxuICAgICAgICAgIHI9XCIyMVwiXG4gICAgICAgICAgY2xhc3M9XCJicHJpbnRfX2ZsYW5nZVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxjaXJjbGVcbiAgICAgICAgICB2LWlmPVwiY29sb3VyXCJcbiAgICAgICAgICByPVwiMTVcIlxuICAgICAgICAgIDpmaWxsPVwiY29sb3VyXCJcbiAgICAgICAgLz5cbiAgICAgICAgPGNpcmNsZVxuICAgICAgICAgIHI9XCI2XCJcbiAgICAgICAgICBjbGFzcz1cImJwcmludF9faHViXCJcbiAgICAgICAgLz5cbiAgICAgIDwvc3ZnPlxuICAgICAgPGRpdiBjbGFzcz1cImJwcmludF9fdGV4dFwiPlxuICAgICAgICA8YlxuICAgICAgICAgIGNsYXNzPVwiYnByaW50X19uYW1lXCJcbiAgICAgICAgICA6dGl0bGU9XCJ0aWxlLm5hbWVcIlxuICAgICAgICA+e3sgdGlsZS5uYW1lIH19PC9iPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJ0aWxlLnNoYXJlZEJ5XCJcbiAgICAgICAgICBjbGFzcz1cImJwcmludF9fdGFnXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNoYXJlZC1ieVwiXG4gICAgICAgICAgOnRpdGxlPVwiYGZyb20gJHt0aWxlLnNoYXJlZEJ5fWBcIlxuICAgICAgICA+ZnJvbSB7eyB0aWxlLnNoYXJlZEJ5IH19PC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtZWxzZS1pZj1cImZvcmVpZ25cIlxuICAgICAgICAgIGNsYXNzPVwiYnByaW50X190YWdcIlxuICAgICAgICA+S2xpcHBlcjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJicHJpbnRfX3N0YXRlXCI+PGkgLz57eyBzdGF0ZVdvcmRzIH19PC9zcGFuPlxuICAgICAgICA8c21hbGxcbiAgICAgICAgICB2LWlmPVwiZmlsZUxpbmVcIlxuICAgICAgICAgIDp0aXRsZT1cImZpbGVMaW5lXCJcbiAgICAgICAgPnt7IGZpbGVMaW5lIH19PC9zbWFsbD5cbiAgICAgICAgPHNtYWxsXG4gICAgICAgICAgdi1pZj1cIm1hdGVyaWFsTGluZVwiXG4gICAgICAgICAgOnRpdGxlPVwibWF0ZXJpYWxMaW5lXCJcbiAgICAgICAgPnt7IG1hdGVyaWFsTGluZSB9fTwvc21hbGw+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFByaW50ZXJEcmF3aW5nIGZyb20gJy4vUHJpbnRlckRyYXdpbmcudnVlJ1xuaW1wb3J0IHsgaGVhdGluZ1RlbXAsIHR5cGUgUHJpbnRlclRpbGUgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXJzLXBhZ2UvbW9kZWwnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQmVuY2hBY3Rpb24ge1xuICBpZDogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBkaXNhYmxlZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT25lIHByaW50ZXIgc3RhbmRpbmcgb24gYSBiZW5jaCAoS0FOLTIyNTcsIGNvbnRyb2wtY3R4KTogaXRzIGRyYXdpbmcsXG4gKiB0aGUgdHdvIG1vc3QgbGlrZWx5IHRoaW5ncyB0byBkbyB3aXRoIGl0IG9uIGhvdmVyIChhIGZvdW5kIHByaW50ZXIgc2hvd3NcbiAqIGl0cyBvbmUgYWN0aW9uIGFsbCB0aGUgdGltZSksIGFuZCB1bmRlciBpdCBpdHMgc3Bvb2wsIG5hbWUgYW5kIHN0YXRlLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBQcmludGVyRHJhd2luZyB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZW5jaFByaW50ZXIgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgdGlsZSE6IFByaW50ZXJUaWxlXG5cbiAgQFByb3AoeyB0eXBlOiBBcnJheSwgZGVmYXVsdDogKCkgPT4gW10gfSlcbiAgcmVhZG9ubHkgYWN0aW9ucyE6IEJlbmNoQWN0aW9uW11cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZHJhZ2dhYmxlITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBmb3VuZCE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZHJhd09uITogYm9vbGVhblxuXG4gIC8qKiBTb21ldGhpbmcgaGFwcGVucyB3aGVuIGl0IGlzIHByZXNzZWQ6IG5vdCBhIGZvdW5kIHByaW50ZXIgdGhhdCBvZmZlcnMgbm90aGluZy4gKi9cbiAgZ2V0IGludGVyYWN0aXZlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuZm91bmQgfHwgdGhpcy5hY3Rpb25zLmxlbmd0aCA+IDBcbiAgfVxuXG4gIGFjdGl2YXRlICgpIHtcbiAgICBpZiAoIXRoaXMuaW50ZXJhY3RpdmUpIHJldHVyblxuICAgIGlmICh0aGlzLmZvdW5kKSB7XG4gICAgICBpZiAodGhpcy5hY3Rpb25zWzBdICYmICF0aGlzLmFjdGlvbnNbMF0uZGlzYWJsZWQpIHRoaXMuJGVtaXQoJ2FjdGlvbicsIHRoaXMuYWN0aW9uc1swXS5pZClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZW1pdCgnb3BlbicpXG4gICAgfVxuICB9XG5cbiAgZ2V0IGZvcmVpZ24gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMudGlsZS5lbnRyeS5mb3JlaWduXG4gIH1cblxuICBnZXQgY29sb3VyICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy50aWxlLmpvYj8ubWF0ZXJpYWw/LmNvbG91ciA/PyBudWxsXG4gIH1cblxuICBnZXQgc3RhdGVXb3JkcyAoKTogc3RyaW5nIHtcbiAgICAvLyBBIGZvdW5kIHByaW50ZXIgd2l0aCBub3RoaW5nIHRvIGRvIHNheXMgd2h5LCBpbiB0aGUgbm90ZSBpdHMgcm93IGhhcyBpbiBHcmlkIGFuZCBMaXN0LlxuICAgIGlmICh0aGlzLmZvdW5kKSByZXR1cm4gdGhpcy5hY3Rpb25zLmxlbmd0aCA/IHRoaXMudGlsZS5kZXRhaWwgOiB0aGlzLnRpbGUuZW50cnkuZGV0YWlsXG4gICAgY29uc3QgbGFiZWwgPSB0aGlzLnRpbGUubGFiZWxcbiAgICAvLyBUaGUgc3RhdGUgd29yZCBmaXJzdCwgYXMgaW4gdGhlIGxhYjogXCJQcmludGluZyDCtyA2MiVcIiwgYW5kIFwiSGVhdGluZyDCtyA2MMKwXCIgdW50aWxcbiAgICAvLyB0aGUgaGVhdGVyIGlzIHdpdGhpbiAzIGRlZ3JlZXMgb2YgaXRzIHRhcmdldC5cbiAgICBpZiAodGhpcy5oZWF0aW5nICE9PSBudWxsKSByZXR1cm4gYEhlYXRpbmcgwrcgJHt0aGlzLmhlYXRpbmd9wrBgXG4gICAgaWYgKHRoaXMudGlsZS5zdGF0ZSA9PT0gJ3ByaW50aW5nJykgcmV0dXJuIGxhYmVsID09PSAnUHJpbnRpbmcnID8gJ1ByaW50aW5nJyA6IGBQcmludGluZyDCtyAke2xhYmVsfWBcbiAgICBjb25zdCBkZXRhaWwgPSB0aGlzLnRpbGUuc3RhdGUgPT09ICdwYXVzZWQnID8gdGhpcy50aWxlLmRldGFpbCA6ICcnXG4gICAgcmV0dXJuIGRldGFpbCAmJiBkZXRhaWwgIT09IGxhYmVsID8gYCR7bGFiZWx9IMK3ICR7ZGV0YWlsfWAgOiBsYWJlbFxuICB9XG5cbiAgLyoqIFRoZSB0ZW1wZXJhdHVyZSB0aGUgcHJpbnQgaXMgaGVhdGluZyB0b3dhcmRzLCB3aGlsZSBpdCBpcyBzdGlsbCBoZWF0aW5nLiAqL1xuICBnZXQgaGVhdGluZyAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuICF0aGlzLmZvdW5kICYmIHRoaXMudGlsZS5zdGF0ZSA9PT0gJ3ByaW50aW5nJyA/IGhlYXRpbmdUZW1wKHRoaXMudGlsZS5qb2IpIDogbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBmaWxlIGJlaW5nIHByaW50ZWQsIG9uIHRoZSBsaW5lIHVuZGVyIHRoZSBzdGF0ZS4gKi9cbiAgZ2V0IGZpbGVMaW5lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAhdGhpcy5mb3VuZCAmJiB0aGlzLnRpbGUuc3RhdGUgPT09ICdwcmludGluZycgPyB0aGlzLnRpbGUuZGV0YWlsIDogJydcbiAgfVxuXG4gIC8qKiBXaGF0IGlzIGxvYWRlZCwgd2hlbiB0aGUgcHJpbnRlciBoYXMgc2FpZC4gSG93IG11Y2ggaXMgbGVmdCBpc24ndCBrbm93biB5ZXQsIHNvIGl0IGlzbid0IGRyYXduIGFzIGtub3duLiAqL1xuICBnZXQgbWF0ZXJpYWxMaW5lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnRpbGUuam9iPy5tYXRlcmlhbD8ubmFtZSA/PyAnJ1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuYnByaW50IHtcbiAgICAtLWJwLXN0YXRlOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIHdpZHRoOiAxNTBweDtcbiAgICAvLyBPbmUgcm93IHRhbGwsIHNvIGEgYmVuY2gncyBsaW5lIGFuZCBzaGVsZiByZXBlYXQgdW5kZXIgZXZlcnkgcm93IG9mIHByaW50ZXJzLlxuICAgIGhlaWdodDogMjY4cHg7XG4gICAgZmxleDogbm9uZTtcbiAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgfVxuXG4gIC5icHJpbnQtLXJ1biB7IC0tYnAtc3RhdGU6IHZhcigtLW0zZC1hY2NlbnQpOyB9XG4gIC5icHJpbnQtLW9rIHsgLS1icC1zdGF0ZTogdmFyKC0tbTNkLXN1Y2Nlc3MpOyB9XG4gIC5icHJpbnQtLXdhcm4geyAtLWJwLXN0YXRlOiB2YXIoLS1tM2Qtd2FybmluZyk7IH1cbiAgLmJwcmludC0tZXJyIHsgLS1icC1zdGF0ZTogdmFyKC0tbTNkLWRhbmdlcik7IH1cbiAgLmJwcmludC0taW5mbyB7IC0tYnAtc3RhdGU6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuXG4gIC8vIFN0aWxsIGhlYXRpbmcgdXA6IHRoZSBhbWJlciBvZiBhIHByaW50ZXIgdGhhdCBpcyB3YWl0aW5nLCBub3QgdGhlIHRlYWwgb2Ygb25lIHByaW50aW5nLlxuICAuYnByaW50LS1oZWF0aW5nIHsgLS1icC1zdGF0ZTogdmFyKC0tbTNkLXdhcm5pbmcpOyB9XG5cbiAgLmJwcmludC0tZ3JhYiB7IGN1cnNvcjogZ3JhYjsgfVxuXG4gIC5icHJpbnRfX3N0YW5kIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICB3aWR0aDogMTUwcHg7XG4gICAgaGVpZ2h0OiAxNzBweDtcbiAgICBwYWRkaW5nOiAwO1xuICAgIGJvcmRlcjogMDtcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICBvdXRsaW5lOiBub25lO1xuICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSB2YXIoLS1tM2Qtc3ByaW5nLXNuYXBweS1kdXJhdGlvbikgdmFyKC0tbTNkLXNwcmluZy1zbmFwcHkpO1xuXG4gICAgJjpmb2N1cy12aXNpYmxlIHsgb3V0bGluZTogMnB4IHNvbGlkIHZhcigtLW0zZC1mb2N1cy1yaW5nKTsgb3V0bGluZS1vZmZzZXQ6IDRweDsgYm9yZGVyLXJhZGl1czogMTJweDsgfVxuICB9XG5cbiAgLmJwcmludF9fc3RhbmQtLXN0aWxsIHsgY3Vyc29yOiBkZWZhdWx0OyB9XG5cbiAgLmJwcmludDpob3ZlciAuYnByaW50X19zdGFuZDpub3QoLmJwcmludF9fc3RhbmQtLXN0aWxsKSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNHB4KTsgfVxuXG4gIC5icHJpbnRfX2FjdHMge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDZweDtcbiAgICBsZWZ0OiAwO1xuICAgIHJpZ2h0OiAyNHB4O1xuICAgIHotaW5kZXg6IDI7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgZ2FwOiA0cHggNnB4O1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDVweCk7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgdHJhbnNpdGlvbjpcbiAgICAgIG9wYWNpdHkgdmFyKC0tbTNkLW1vdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZS1zdGFuZGFyZCksXG4gICAgICB0cmFuc2Zvcm0gdmFyKC0tbTNkLXNwcmluZy1zbmFwcHktZHVyYXRpb24pIHZhcigtLW0zZC1zcHJpbmctc25hcHB5KTtcbiAgfVxuXG4gIC5icHJpbnQ6aG92ZXIgLmJwcmludF9fYWN0cyxcbiAgLmJwcmludDpmb2N1cy13aXRoaW4gLmJwcmludF9fYWN0cyxcbiAgLmJwcmludF9fYWN0cy0tYWx3YXlzIHtcbiAgICBvcGFjaXR5OiAxO1xuICAgIHRyYW5zZm9ybTogbm9uZTtcbiAgICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgfVxuXG4gIC5icHJpbnRfX2FjdCB7XG4gICAgcGFkZGluZzogNHB4IDEwcHg7XG4gICAgYm9yZGVyOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1maWxsLXN0cm9uZyk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDExLjVweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIC13ZWJraXQtYmFja2Ryb3AtZmlsdGVyOiBibHVyKDEwcHgpO1xuICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMHB4KTtcblxuICAgICY6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ1OyBjdXJzb3I6IGRlZmF1bHQ7IH1cbiAgfVxuXG4gIC5icHJpbnQtLWZvdW5kIC5icHJpbnRfX2FjdCB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1vbi1hY2NlbnQsICMwMDIwMWUpO1xuICB9XG5cbiAgLmJwcmludF9fdW5kZXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogMTBweCAwIDAgMnB4O1xuICB9XG5cbiAgLmJwcmludF9fc3Bvb2wge1xuICAgIHdpZHRoOiA0MnB4O1xuICAgIGhlaWdodDogNDJweDtcbiAgICBmbGV4OiBub25lO1xuICB9XG5cbiAgLmJwcmludF9fZmxhbmdlIHsgZmlsbDogdmFyKC0tbTNkLWZpbGwtMik7IHN0cm9rZTogdmFyKC0tbTNkLWJvcmRlcik7IH1cbiAgLmJwcmludF9faHViIHsgZmlsbDogdmFyKC0tbTNkLXN1cmZhY2UpOyBzdHJva2U6IHZhcigtLW0zZC1ib3JkZXIpOyB9XG5cbiAgLmJwcmludF9fdGV4dCB7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMWZyKTtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC8vIFRoZSBuYW1lIHdyYXBzIHRvIGEgc2Vjb25kIGxpbmUgYmVmb3JlIGl0IGlzIGN1dDsgdGhlIHRhZyBoYXMgaXRzIG93biBsaW5lLlxuICAuYnByaW50X19uYW1lIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGZvbnQtc2l6ZTogMTMuNXB4O1xuICAgIGxpbmUtaGVpZ2h0OiAxLjI1O1xuICAgIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1saW5lLWNsYW1wOiAyO1xuICAgIGxpbmUtY2xhbXA6IDI7XG4gIH1cblxuICAuYnByaW50X190YWcge1xuICAgIGp1c3RpZnktc2VsZjogc3RhcnQ7XG4gICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgIG1hcmdpbjogMnB4IDAgMXB4O1xuICAgIHBhZGRpbmc6IDFweCA2cHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5icHJpbnRfX3N0YXRlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIGdhcDogNXB4O1xuICAgIGNvbG9yOiB2YXIoLS1icC1zdGF0ZSk7XG4gICAgZm9udC1zaXplOiAxMS41cHg7XG4gICAgbGluZS1oZWlnaHQ6IDEuMjtcblxuICAgIGkge1xuICAgICAgZmxleDogbm9uZTtcbiAgICAgIHdpZHRoOiA3cHg7XG4gICAgICBoZWlnaHQ6IDdweDtcbiAgICAgIG1hcmdpbi10b3A6IDNweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLWJwLXN0YXRlKTtcbiAgICB9XG4gIH1cblxuICAuYnByaW50LS1ydW4gLmJwcmludF9fc3RhdGUgaSB7IGFuaW1hdGlvbjogYnByaW50LWJyZWF0aGUgMS44cyBlYXNlLWluLW91dCBpbmZpbml0ZTsgfVxuXG4gIEBrZXlmcmFtZXMgYnByaW50LWJyZWF0aGUge1xuICAgIDUwJSB7IG9wYWNpdHk6IDAuMzU7IHRyYW5zZm9ybTogc2NhbGUoMS41KTsgfVxuICB9XG5cbiAgLmJwcmludC0tZm91bmQgLmJwcmludF9fc3RhdGUgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyB9XG4gIC5icHJpbnQtLWZvdW5kIC5icHJpbnRfX3N0YXRlIGkgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyB9XG5cbiAgLmJwcmludF9fdGV4dCBzbWFsbCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvcHJpbnRlcnMvQmVuY2hQcmludGVyLnZ1ZSJ9