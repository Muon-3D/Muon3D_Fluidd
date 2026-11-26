/* unplugin-vue-components disabled */import __unplugin_components_12 from "/src/components/ui/FrameIcon.vue";
import { VListItemSubtitle as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/PrinterThumb.vue";
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
import { needsYou } from "/src/services/printers-page/model.ts";
import PrinterStage from "/src/components/printers/PrinterStage.vue";
import TonePill from "/src/components/printers/TonePill.vue";
let PrinterTileCard = class extends Vue {
  tile;
  variant;
  actions;
  busy;
  draggable;
  stageHeight;
  get needs() {
    return needsYou(this.tile.state);
  }
  get thumbState() {
    if (this.tile.state === "printing" || this.tile.state === "paused") return "printing";
    if (this.tile.state === "offline") return "offline";
    return "idle";
  }
  get detailText() {
    if (this.busy) return "Connecting\u2026";
    if (this.variant !== "card") {
      if (this.tile.state === "printing") return this.tile.label === "Printing" ? "Printing" : `Printing \xB7 ${this.tile.label}`;
      return this.tile.state === "ready" ? `Ready \xB7 ${this.tile.detail}` : this.tile.detail;
    }
    return this.tile.detail;
  }
  get detailTone() {
    if (this.tile.state === "ready" && this.variant === "card") return "muted";
    return this.tile.tone;
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], PrinterTileCard.prototype, "tile", 2);
__decorateClass([
  Prop({ type: String, default: "card" })
], PrinterTileCard.prototype, "variant", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], PrinterTileCard.prototype, "actions", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrinterTileCard.prototype, "busy", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrinterTileCard.prototype, "draggable", 2);
__decorateClass([
  Prop({ type: Number, default: 236 })
], PrinterTileCard.prototype, "stageHeight", 2);
PrinterTileCard = __decorateClass([
  Component({ components: { PrinterStage, TonePill } })
], PrinterTileCard);
const _sfc_main = PrinterTileCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "tile", class: [`tile--${_vm.variant}`, { "tile--needs": _vm.needs, "tile--printing": _vm.tile.state === "printing", "tile--busy": _vm.busy, "tile--offline": _vm.tile.state === "offline" }], attrs: { "role": "button", "tabindex": "0", "draggable": _vm.draggable ? "true" : "false", "data-tid": `printer-tile-${_vm.tile.key}` }, on: { "click": function($event) {
    return _vm.$emit("open");
  }, "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.target !== $event.currentTarget) return null;
    return _vm.$emit("open");
  }, "dragstart": function($event) {
    return _vm.$emit("dragstart", $event);
  }, "dragend": function($event) {
    return _vm.$emit("dragend");
  } } }, [_vm.variant === "card" ? _c("printer-stage", { staticClass: "tile__stage", attrs: { "state": _vm.thumbState, "height": _vm.stageHeight } }) : _c(__unplugin_components_0, { attrs: { "size": _vm.variant === "row" ? 44 : 48, "state": _vm.thumbState } }), _c("div", { staticClass: "tile__text" }, [_c("div", { staticClass: "tile__title" }, [_c("span", { staticClass: "tile__name" }, [_vm._v(_vm._s(_vm.tile.name))]), _vm.variant === "card" ? _c("tone-pill", { attrs: { "tone": _vm.tile.tone } }, [_vm._v(" " + _vm._s(_vm.tile.label) + " ")]) : _vm._e()], 1), _vm.tile.sharedBy ? _c("span", { staticClass: "tile__tag", attrs: { "data-tid": "shared-by", "title": `from ${_vm.tile.sharedBy}` } }, [_vm._v("from " + _vm._s(_vm.tile.sharedBy))]) : _vm._e(), _c("span", { staticClass: "tile__detail", class: `tile__detail--${_vm.detailTone}` }, [_vm.tile.remote ? _c(__unplugin_components_1, { attrs: { "name": "cloud", "small": "" } }) : _vm._e(), _vm.busy ? _c(__unplugin_components_2, { attrs: { "indeterminate": "", "size": "11", "width": "2" } }) : _vm._e(), _vm._v(" " + _vm._s(_vm.detailText) + " ")], 1)]), _vm.actions.length ? _c(__unplugin_components_3, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "tile__menu", attrs: { "type": "button", "aria-label": `Options for ${_vm.tile.name}` }, on: { "click": function($event) {
      $event.stopPropagation();
    } } }, "button", attrs, false), on), [_c(__unplugin_components_4, { attrs: { "name": "more" } })], 1)];
  } }], null, false, 802981893) }, [_c(__unplugin_components_5, { attrs: { "dense": "" } }, _vm._l(_vm.actions, function(a) {
    return _c(__unplugin_components_6, { key: a.id, attrs: { "disabled": a.disabled, "data-action": a.id }, on: { "click": function($event) {
      return _vm.$emit("action", a.id);
    } } }, [_c(__unplugin_components_7, { staticClass: "mr-3" }, [_c(__unplugin_components_8, { attrs: { "small": "", "color": a.danger ? "error" : void 0 } }, [_vm._v(" " + _vm._s(a.icon) + " ")])], 1), _c(__unplugin_components_9, [_c(__unplugin_components_10, { class: { "error--text": a.danger } }, [_vm._v(" " + _vm._s(a.label) + " ")]), a.hint ? _c(__unplugin_components_11, [_vm._v(" " + _vm._s(a.hint) + " ")]) : _vm._e()], 1)], 1);
  }), 1)], 1) : _vm.variant === "row" ? _c(__unplugin_components_12, { staticClass: "tile__chevron", attrs: { "name": "chevronRight", "small": "" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/PrinterTileCard.vue?vue&type=style&index=0&scoped=22c56a6f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "22c56a6f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/PrinterTileCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrSEE7QUFFQTtBQUVBO0FBQ0E7QUFPQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXhDQTtBQUFBLEVBREE7QUFBQSxHQURBLGdCQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxnQkFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZ0JBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLGdCQVdBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FiQSxnQkFjQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBaEJBLGdCQWlCQTtBQWpCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmludGVyVGlsZUNhcmQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwidGlsZVwiXG4gICAgOmNsYXNzPVwiW2B0aWxlLS0ke3ZhcmlhbnR9YCwgeyAndGlsZS0tbmVlZHMnOiBuZWVkcywgJ3RpbGUtLXByaW50aW5nJzogdGlsZS5zdGF0ZSA9PT0gJ3ByaW50aW5nJywgJ3RpbGUtLWJ1c3knOiBidXN5LCAndGlsZS0tb2ZmbGluZSc6IHRpbGUuc3RhdGUgPT09ICdvZmZsaW5lJyB9XVwiXG4gICAgcm9sZT1cImJ1dHRvblwiXG4gICAgdGFiaW5kZXg9XCIwXCJcbiAgICA6ZHJhZ2dhYmxlPVwiZHJhZ2dhYmxlID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgOmRhdGEtdGlkPVwiYHByaW50ZXItdGlsZS0ke3RpbGUua2V5fWBcIlxuICAgIEBjbGljaz1cIiRlbWl0KCdvcGVuJylcIlxuICAgIEBrZXlkb3duLmVudGVyLnNlbGY9XCIkZW1pdCgnb3BlbicpXCJcbiAgICBAZHJhZ3N0YXJ0PVwiJGVtaXQoJ2RyYWdzdGFydCcsICRldmVudClcIlxuICAgIEBkcmFnZW5kPVwiJGVtaXQoJ2RyYWdlbmQnKVwiXG4gID5cbiAgICA8cHJpbnRlci1zdGFnZVxuICAgICAgdi1pZj1cInZhcmlhbnQgPT09ICdjYXJkJ1wiXG4gICAgICA6c3RhdGU9XCJ0aHVtYlN0YXRlXCJcbiAgICAgIDpoZWlnaHQ9XCJzdGFnZUhlaWdodFwiXG4gICAgICBjbGFzcz1cInRpbGVfX3N0YWdlXCJcbiAgICAvPlxuICAgIDxwcmludGVyLXRodW1iXG4gICAgICB2LWVsc2VcbiAgICAgIDpzaXplPVwidmFyaWFudCA9PT0gJ3JvdycgPyA0NCA6IDQ4XCJcbiAgICAgIDpzdGF0ZT1cInRodW1iU3RhdGVcIlxuICAgIC8+XG5cbiAgICA8ZGl2IGNsYXNzPVwidGlsZV9fdGV4dFwiPlxuICAgICAgPGRpdiBjbGFzcz1cInRpbGVfX3RpdGxlXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwidGlsZV9fbmFtZVwiPnt7IHRpbGUubmFtZSB9fTwvc3Bhbj5cbiAgICAgICAgPHRvbmUtcGlsbFxuICAgICAgICAgIHYtaWY9XCJ2YXJpYW50ID09PSAnY2FyZCdcIlxuICAgICAgICAgIDp0b25lPVwidGlsZS50b25lXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHRpbGUubGFiZWwgfX1cbiAgICAgICAgPC90b25lLXBpbGw+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtaWY9XCJ0aWxlLnNoYXJlZEJ5XCJcbiAgICAgICAgY2xhc3M9XCJ0aWxlX190YWdcIlxuICAgICAgICBkYXRhLXRpZD1cInNoYXJlZC1ieVwiXG4gICAgICAgIDp0aXRsZT1cImBmcm9tICR7dGlsZS5zaGFyZWRCeX1gXCJcbiAgICAgID5mcm9tIHt7IHRpbGUuc2hhcmVkQnkgfX08L3NwYW4+XG4gICAgICA8c3BhblxuICAgICAgICBjbGFzcz1cInRpbGVfX2RldGFpbFwiXG4gICAgICAgIDpjbGFzcz1cImB0aWxlX19kZXRhaWwtLSR7ZGV0YWlsVG9uZX1gXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICB2LWlmPVwidGlsZS5yZW1vdGVcIlxuICAgICAgICAgIG5hbWU9XCJjbG91ZFwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICB2LWlmPVwiYnVzeVwiXG4gICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgIHNpemU9XCIxMVwiXG4gICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgLz5cbiAgICAgICAge3sgZGV0YWlsVGV4dCB9fVxuICAgICAgPC9zcGFuPlxuICAgIDwvZGl2PlxuXG4gICAgPHYtbWVudVxuICAgICAgdi1pZj1cImFjdGlvbnMubGVuZ3RoXCJcbiAgICAgIGxlZnRcbiAgICAgIG9mZnNldC15XG4gICAgPlxuICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cInRpbGVfX21lbnVcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE9wdGlvbnMgZm9yICR7dGlsZS5uYW1lfWBcIlxuICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICBAY2xpY2suc3RvcFxuICAgICAgICAgIHYtb249XCJvblwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwibW9yZVwiIC8+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDx2LWxpc3QgZGVuc2U+XG4gICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgIHYtZm9yPVwiYSBpbiBhY3Rpb25zXCJcbiAgICAgICAgICA6a2V5PVwiYS5pZFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiYS5kaXNhYmxlZFwiXG4gICAgICAgICAgOmRhdGEtYWN0aW9uPVwiYS5pZFwiXG4gICAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ2FjdGlvbicsIGEuaWQpXCJcbiAgICAgICAgPlxuICAgICAgICAgIDx2LWxpc3QtaXRlbS1pY29uIGNsYXNzPVwibXItM1wiPlxuICAgICAgICAgICAgPHYtaWNvblxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICA6Y29sb3I9XCJhLmRhbmdlciA/ICdlcnJvcicgOiB1bmRlZmluZWRcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7eyBhLmljb24gfX1cbiAgICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgIDwvdi1saXN0LWl0ZW0taWNvbj5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tY29udGVudD5cbiAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZSA6Y2xhc3M9XCJ7ICdlcnJvci0tdGV4dCc6IGEuZGFuZ2VyIH1cIj5cbiAgICAgICAgICAgICAge3sgYS5sYWJlbCB9fVxuICAgICAgICAgICAgPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1zdWJ0aXRsZSB2LWlmPVwiYS5oaW50XCI+XG4gICAgICAgICAgICAgIHt7IGEuaGludCB9fVxuICAgICAgICAgICAgPC92LWxpc3QtaXRlbS1zdWJ0aXRsZT5cbiAgICAgICAgICA8L3YtbGlzdC1pdGVtLWNvbnRlbnQ+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICA8L3YtbGlzdD5cbiAgICA8L3YtbWVudT5cbiAgICA8ZnJhbWUtaWNvblxuICAgICAgdi1lbHNlLWlmPVwidmFyaWFudCA9PT0gJ3JvdydcIlxuICAgICAgbmFtZT1cImNoZXZyb25SaWdodFwiXG4gICAgICBzbWFsbFxuICAgICAgY2xhc3M9XCJ0aWxlX19jaGV2cm9uXCJcbiAgICAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IENhcmRBY3Rpb24gfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZGlyZWN0b3J5J1xuaW1wb3J0IHsgbmVlZHNZb3UsIHR5cGUgUHJpbnRlclRpbGUsIHR5cGUgVGlsZVRvbmUgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXJzLXBhZ2UvbW9kZWwnXG5pbXBvcnQgdHlwZSB7IFRodW1iU3RhdGUgfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvUHJpbnRlclRodW1iLnZ1ZSdcbmltcG9ydCBQcmludGVyU3RhZ2UgZnJvbSAnLi9QcmludGVyU3RhZ2UudnVlJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJy4vVG9uZVBpbGwudnVlJ1xuXG4vKipcbiAqIE9uZSBwcmludGVyIGluIGEgZ3JvdXA6IGEgY2FyZCB3aXRoIHRoZSB3aG9sZSBNMSwgYSBzbWFsbCBjYXJkIHdoZW5cbiAqIHNldmVyYWwgYXJlIHByaW50aW5nIGFuZCByb29tIGlzIHNob3J0LCBvciBhIHJvdyBvbiBhIHBob25lLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBQcmludGVyU3RhZ2UsIFRvbmVQaWxsIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaW50ZXJUaWxlQ2FyZCBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSB0aWxlITogUHJpbnRlclRpbGVcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ2NhcmQnIH0pXG4gIHJlYWRvbmx5IHZhcmlhbnQhOiAnY2FyZCcgfCAnY29tcGFjdCcgfCAncm93J1xuXG4gIEBQcm9wKHsgdHlwZTogQXJyYXksIGRlZmF1bHQ6ICgpID0+IFtdIH0pXG4gIHJlYWRvbmx5IGFjdGlvbnMhOiBDYXJkQWN0aW9uW11cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgYnVzeT86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZHJhZ2dhYmxlPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAyMzYgfSlcbiAgcmVhZG9ubHkgc3RhZ2VIZWlnaHQhOiBudW1iZXJcblxuICBnZXQgbmVlZHMgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBuZWVkc1lvdSh0aGlzLnRpbGUuc3RhdGUpXG4gIH1cblxuICBnZXQgdGh1bWJTdGF0ZSAoKTogVGh1bWJTdGF0ZSB7XG4gICAgaWYgKHRoaXMudGlsZS5zdGF0ZSA9PT0gJ3ByaW50aW5nJyB8fCB0aGlzLnRpbGUuc3RhdGUgPT09ICdwYXVzZWQnKSByZXR1cm4gJ3ByaW50aW5nJ1xuICAgIGlmICh0aGlzLnRpbGUuc3RhdGUgPT09ICdvZmZsaW5lJykgcmV0dXJuICdvZmZsaW5lJ1xuICAgIHJldHVybiAnaWRsZSdcbiAgfVxuXG4gIGdldCBkZXRhaWxUZXh0ICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybiAnQ29ubmVjdGluZ+KApidcbiAgICBpZiAodGhpcy52YXJpYW50ICE9PSAnY2FyZCcpIHtcbiAgICAgIGlmICh0aGlzLnRpbGUuc3RhdGUgPT09ICdwcmludGluZycpIHJldHVybiB0aGlzLnRpbGUubGFiZWwgPT09ICdQcmludGluZycgPyAnUHJpbnRpbmcnIDogYFByaW50aW5nIMK3ICR7dGhpcy50aWxlLmxhYmVsfWBcbiAgICAgIHJldHVybiB0aGlzLnRpbGUuc3RhdGUgPT09ICdyZWFkeScgPyBgUmVhZHkgwrcgJHt0aGlzLnRpbGUuZGV0YWlsfWAgOiB0aGlzLnRpbGUuZGV0YWlsXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRpbGUuZGV0YWlsXG4gIH1cblxuICBnZXQgZGV0YWlsVG9uZSAoKTogVGlsZVRvbmUgfCAnbXV0ZWQnIHtcbiAgICBpZiAodGhpcy50aWxlLnN0YXRlID09PSAncmVhZHknICYmIHRoaXMudmFyaWFudCA9PT0gJ2NhcmQnKSByZXR1cm4gJ211dGVkJ1xuICAgIHJldHVybiB0aGlzLnRpbGUudG9uZVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAudGlsZSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIHRyYW5zaXRpb246IGJveC1zaGFkb3cgdmFyKC0tbTNkLWR1cmF0aW9uLWZhc3QpIHZhcigtLW0zZC1lYXNlKSwgdHJhbnNmb3JtIHZhcigtLW0zZC1kdXJhdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZSk7XG5cbiAgICAmOmhvdmVyLFxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICAgICAgb3V0bGluZTogbm9uZTtcbiAgICB9XG4gIH1cblxuICAudGlsZS0tbmVlZHMge1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDEuNXB4IHZhcigtLW0zZC13YXJuaW5nKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLnRpbGUtLXByaW50aW5nIHtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxLjVweCBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWFjY2VudCkgMzIlLCB0cmFuc3BhcmVudCk7XG4gIH1cblxuICAudGlsZS0tYnVzeSB7XG4gICAgb3BhY2l0eTogMC44O1xuICB9XG5cbiAgLnRpbGUtLW9mZmxpbmUge1xuICAgIG9wYWNpdHk6IDAuNjtcbiAgICBmaWx0ZXI6IGdyYXlzY2FsZSgwLjYpO1xuICB9XG5cbiAgLnRpbGUtLWNhcmQge1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cbiAgICAudGlsZV9fc3RhZ2Uge1xuICAgICAgbWFyZ2luOiA4cHggOHB4IDA7XG4gICAgfVxuXG4gICAgLnRpbGVfX3RleHQge1xuICAgICAgZ2FwOiA2cHg7XG4gICAgICBwYWRkaW5nOiAxMnB4IDE2cHggMTZweDtcbiAgICB9XG5cbiAgICAudGlsZV9fbmFtZSB7XG4gICAgICBmb250LXNpemU6IDE3cHg7XG4gICAgfVxuXG4gICAgLnRpbGVfX21lbnUge1xuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgdG9wOiAxNHB4O1xuICAgICAgcmlnaHQ6IDE0cHg7XG4gICAgICBiYWNrZ3JvdW5kOiByZ2IoMjU1IDI1NSAyNTUgLyA3MCUpO1xuICAgICAgY29sb3I6ICMzYTNhM2M7XG4gICAgICBvcGFjaXR5OiAwO1xuICAgIH1cblxuICAgICY6aG92ZXIgLnRpbGVfX21lbnUsXG4gICAgJjpmb2N1cy13aXRoaW4gLnRpbGVfX21lbnUge1xuICAgICAgb3BhY2l0eTogMTtcbiAgICB9XG4gIH1cblxuICBAbWVkaWEgKGhvdmVyOiBub25lKSB7XG4gICAgLnRpbGUtLWNhcmQgLnRpbGVfX21lbnUge1xuICAgICAgb3BhY2l0eTogMTtcbiAgICB9XG4gIH1cblxuICAudGlsZS0tY29tcGFjdCxcbiAgLnRpbGUtLXJvdyB7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gICAgcGFkZGluZzogMTBweDtcbiAgfVxuXG4gIC50aWxlLS1jb21wYWN0IHtcbiAgICBib3JkZXItcmFkaXVzOiAxOHB4O1xuICB9XG5cbiAgLy8gQSByb3cgaW4gYSBsaXN0IHNheXMgaXRzIHN0YXRlIGluIGl0cyBjb2xvdXI7IGFuIG91dGxpbmUgcGVyIHJvdyB3b3VsZFxuICAvLyBib3ggZWFjaCBvbmUgb2ZmIGZyb20gdGhlIGxpc3QuXG4gIC50aWxlLS1yb3cge1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4taGVpZ2h0OiA2MHB4O1xuICAgIHBhZGRpbmc6IDhweCAxMnB4IDhweCA4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICBib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XG5cbiAgICAmOmhvdmVyLFxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICAgIH1cbiAgfVxuXG4gIC50aWxlX190ZXh0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDEgMSAwO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAycHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLnRpbGVfX3RpdGxlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogOHB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC50aWxlX19uYW1lIHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAvLyBXaG8gc2hhcmVkIGl0LCB0aGUgc2FtZSBzbWFsbCB0YWcgYXMgb24gdGhlIEJlbmNoLlxuICAudGlsZV9fdGFnIHtcbiAgICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xuICAgIG1heC13aWR0aDogMTAwJTtcbiAgICBwYWRkaW5nOiAxcHggNnB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1maWxsKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTBweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAudGlsZV9fZGV0YWlsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC50aWxlLS1jb21wYWN0IC50aWxlX19kZXRhaWwge1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC50aWxlX19kZXRhaWwtLW11dGVkLFxuICAudGlsZV9fZGV0YWlsLS1vZmYgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyB9XG4gIC50aWxlX19kZXRhaWwtLW9rIHsgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzKTsgfVxuICAudGlsZV9fZGV0YWlsLS1ydW4geyBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7IH1cbiAgLnRpbGVfX2RldGFpbC0td2FybiB7IGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7IH1cbiAgLnRpbGVfX2RldGFpbC0tZXJyIHsgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpOyB9XG4gIC50aWxlX19kZXRhaWwtLWluZm8geyBjb2xvcjogIzZhYThmZjsgfVxuXG4gIC50aWxlX19tZW51IHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDM2cHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IHZhcigtLW0zZC1kdXJhdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZSk7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1ob3Zlcik7XG4gICAgfVxuICB9XG5cbiAgLnRpbGVfX2NoZXZyb24ge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvcHJpbnRlcnMvUHJpbnRlclRpbGVDYXJkLnZ1ZSJ9