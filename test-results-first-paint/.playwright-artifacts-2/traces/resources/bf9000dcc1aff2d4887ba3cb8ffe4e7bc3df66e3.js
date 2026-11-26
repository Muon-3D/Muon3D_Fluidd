/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
let PositionTile = class extends Mixins(OverviewMixin) {
  axes = ["X", "Y", "Z"];
  editing = "";
  editIndex = 0;
  draft = "";
  invalid = false;
  reset() {
    this.cancel();
  }
  get known() {
    const p = this.toolhead.position;
    return Array.isArray(p) && p.slice(0, 3).every(Number.isFinite);
  }
  get homed() {
    return this.known && this.isHomed("XYZ");
  }
  get homedText() {
    if (this.homed) return "Homed";
    return this.homedAxes ? `Homed ${this.homedAxes.split("").join(" ")}` : "Not homed";
  }
  shown(i) {
    return this.known ? this.position[i].toFixed(i === 2 ? 2 : 1) : "\u2014";
  }
  get canHome() {
    return this.controlReady && !this.busy;
  }
  get canEdit() {
    return this.controlReady && !this.busy && this.known;
  }
  startEdit(axis, i) {
    if (!this.canEdit) return;
    this.editing = axis;
    this.editIndex = i;
    this.draft = this.position[i].toFixed(i === 2 ? 2 : 1);
    this.invalid = false;
    this.$nextTick(() => {
      const el = this.$refs[`edit-${axis}`]?.[0];
      el?.focus();
      el?.select();
    });
  }
  cancel() {
    this.editing = "";
    this.invalid = false;
  }
  commit(i) {
    if (!this.editing) return;
    const axis = this.editing;
    const value = Number(this.draft.replace(",", "."));
    if (this.draft.trim() === "" || !Number.isFinite(value) || value < this.axisMin[i] || value > this.axisMax[i]) {
      this.invalid = true;
      return;
    }
    this.cancel();
    if (Math.abs(value - this.position[i]) >= 5e-3) this.moveTo(axis === "X" ? { X: value } : axis === "Y" ? { Y: value } : { Z: value });
  }
};
__decorateClass([
  Watch("panelTarget")
], PositionTile.prototype, "reset", 1);
PositionTile = __decorateClass([
  Component({ components: { TileShell } })
], PositionTile);
const _sfc_main = PositionTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { class: ["po", `po--${_vm.size}`], attrs: { "tile": "position", "title": "Position", "icon": "expand", "state": _vm.homedText, "tone": _vm.homed ? "ok" : "warm" }, scopedSlots: _vm._u([{ key: "head", fn: function() {
    return [_c("button", { staticClass: "po__motors", attrs: { "type": "button", "disabled": !_vm.controlReady || _vm.busy, "aria-label": "Motors off", "title": "Turn the motors off (M84)", "data-tid": "motors-off" }, on: { "click": _vm.motorsOff } }, [_c(__unplugin_components_0, { attrs: { "name": "motorsOff", "small": "" } })], 1)];
  }, proxy: true }]) }, [_c("span", { staticClass: "po__xyz" }, _vm._l(_vm.axes, function(a, i) {
    return _c("span", { key: a, staticClass: "po__axis", class: { "po__axis--off": !_vm.isHomed(a), "po__axis--edit": _vm.editing === a }, attrs: { "data-tid": "axis" } }, [_c("span", { staticClass: "po__top" }, [_c("span", { staticClass: "po__k" }, [_vm._v(_vm._s(a))]), !_vm.isHomed(a) ? _c("button", { staticClass: "po__home", attrs: { "type": "button", "disabled": !_vm.canHome, "aria-label": `Home ${a}`, "title": `Home ${a} (G28 ${a})`, "data-tid": `home-${a.toLowerCase()}` }, on: { "click": function($event) {
      return _vm.home(a);
    } } }, [_vm.homing(a) ? _c(__unplugin_components_1, { attrs: { "indeterminate": "", "size": "12", "width": "2" } }) : _c(__unplugin_components_2, { attrs: { "name": "home", "small": "" } })], 1) : _vm._e()]), !_vm.isHomed(a) ? _c("span", { staticClass: "po__nohome", attrs: { "data-tid": "axis-not-homed" } }, [_vm._v("not homed")]) : _vm.editing === a ? _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.draft, expression: "draft" }], ref: `edit-${a}`, refInFor: true, staticClass: "po__input", attrs: { "type": "text", "inputmode": "decimal", "aria-label": `${a} position`, "aria-invalid": _vm.invalid ? "true" : void 0, "data-tid": `axis-input-${a.toLowerCase()}` }, domProps: { "value": _vm.draft }, on: { "keydown": [function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
      $event.preventDefault();
      return _vm.commit(i);
    }, function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
      $event.preventDefault();
      return _vm.cancel.apply(null, arguments);
    }], "blur": function($event) {
      return _vm.commit(i);
    }, "input": function($event) {
      if ($event.target.composing) return;
      _vm.draft = $event.target.value;
    } } }) : _c("button", { staticClass: "po__val", attrs: { "type": "button", "disabled": !_vm.canEdit, "aria-label": `${a} ${_vm.shown(i)} millimetres. Press to type a new position`, "title": _vm.canEdit ? `Type where ${a} should go` : "Not while the printer is busy", "data-tid": `axis-edit-${a.toLowerCase()}` }, on: { "click": function($event) {
      return _vm.startEdit(a, i);
    } } }, [_c("b", [_vm._v(_vm._s(_vm.shown(i)))]), _c("small", [_vm._v("mm")])])]);
  }), 0), _vm.invalid ? _c("span", { staticClass: "po__err", attrs: { "role": "status" } }, [_vm._v(_vm._s(_vm.editing) + " goes from " + _vm._s(_vm.axisMin[_vm.editIndex]) + " to " + _vm._s(_vm.axisMax[_vm.editIndex]))]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/PositionTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/PositionTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQW9HQTtBQUNBO0FBQ0E7QUFTQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUE3Q0E7QUFBQSxFQURBO0FBQUEsR0FQQSxhQVFBO0FBUkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUG9zaXRpb25UaWxlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx0aWxlLXNoZWxsXG4gICAgdGlsZT1cInBvc2l0aW9uXCJcbiAgICB0aXRsZT1cIlBvc2l0aW9uXCJcbiAgICBpY29uPVwiZXhwYW5kXCJcbiAgICA6c3RhdGU9XCJob21lZFRleHRcIlxuICAgIDp0b25lPVwiaG9tZWQgPyAnb2snIDogJ3dhcm0nXCJcbiAgICA6Y2xhc3M9XCJbJ3BvJywgYHBvLS0ke3NpemV9YF1cIlxuICA+XG4gICAgPHRlbXBsYXRlICNoZWFkPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJwb19fbW90b3JzXCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeSB8fCBidXN5XCJcbiAgICAgICAgYXJpYS1sYWJlbD1cIk1vdG9ycyBvZmZcIlxuICAgICAgICB0aXRsZT1cIlR1cm4gdGhlIG1vdG9ycyBvZmYgKE04NClcIlxuICAgICAgICBkYXRhLXRpZD1cIm1vdG9ycy1vZmZcIlxuICAgICAgICBAY2xpY2s9XCJtb3RvcnNPZmZcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJtb3RvcnNPZmZcIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDxzcGFuIGNsYXNzPVwicG9fX3h5elwiPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1mb3I9XCIoYSwgaSkgaW4gYXhlc1wiXG4gICAgICAgIDprZXk9XCJhXCJcbiAgICAgICAgY2xhc3M9XCJwb19fYXhpc1wiXG4gICAgICAgIDpjbGFzcz1cInsgJ3BvX19heGlzLS1vZmYnOiAhaXNIb21lZChhKSwgJ3BvX19heGlzLS1lZGl0JzogZWRpdGluZyA9PT0gYSB9XCJcbiAgICAgICAgZGF0YS10aWQ9XCJheGlzXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJwb19fdG9wXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwb19fa1wiPnt7IGEgfX08L3NwYW4+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1pZj1cIiFpc0hvbWVkKGEpXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJwb19faG9tZVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuSG9tZVwiXG4gICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBIb21lICR7YX1gXCJcbiAgICAgICAgICAgIDp0aXRsZT1cImBIb21lICR7YX0gKEcyOCAke2F9KWBcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYGhvbWUtJHthLnRvTG93ZXJDYXNlKCl9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJob21lKGEpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgICAgICB2LWlmPVwiaG9taW5nKGEpXCJcbiAgICAgICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgICAgICBzaXplPVwiMTJcIlxuICAgICAgICAgICAgICB3aWR0aD1cIjJcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgICBuYW1lPVwiaG9tZVwiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cIiFpc0hvbWVkKGEpXCJcbiAgICAgICAgICBjbGFzcz1cInBvX19ub2hvbWVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiYXhpcy1ub3QtaG9tZWRcIlxuICAgICAgICA+bm90IGhvbWVkPC9zcGFuPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICB2LWVsc2UtaWY9XCJlZGl0aW5nID09PSBhXCJcbiAgICAgICAgICA6cmVmPVwiYGVkaXQtJHthfWBcIlxuICAgICAgICAgIHYtbW9kZWw9XCJkcmFmdFwiXG4gICAgICAgICAgY2xhc3M9XCJwb19faW5wdXRcIlxuICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICBpbnB1dG1vZGU9XCJkZWNpbWFsXCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cImAke2F9IHBvc2l0aW9uYFwiXG4gICAgICAgICAgOmFyaWEtaW52YWxpZD1cImludmFsaWQgPyAndHJ1ZScgOiB1bmRlZmluZWRcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBheGlzLWlucHV0LSR7YS50b0xvd2VyQ2FzZSgpfWBcIlxuICAgICAgICAgIEBrZXlkb3duLmVudGVyLnByZXZlbnQ9XCJjb21taXQoaSlcIlxuICAgICAgICAgIEBrZXlkb3duLmVzYy5wcmV2ZW50PVwiY2FuY2VsXCJcbiAgICAgICAgICBAYmx1cj1cImNvbW1pdChpKVwiXG4gICAgICAgID5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwicG9fX3ZhbFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNhbkVkaXRcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7YX0gJHtzaG93bihpKX0gbWlsbGltZXRyZXMuIFByZXNzIHRvIHR5cGUgYSBuZXcgcG9zaXRpb25gXCJcbiAgICAgICAgICA6dGl0bGU9XCJjYW5FZGl0ID8gYFR5cGUgd2hlcmUgJHthfSBzaG91bGQgZ29gIDogJ05vdCB3aGlsZSB0aGUgcHJpbnRlciBpcyBidXN5J1wiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYGF4aXMtZWRpdC0ke2EudG9Mb3dlckNhc2UoKX1gXCJcbiAgICAgICAgICBAY2xpY2s9XCJzdGFydEVkaXQoYSwgaSlcIlxuICAgICAgICA+XG4gICAgICAgICAgPGI+e3sgc2hvd24oaSkgfX08L2I+PHNtYWxsPm1tPC9zbWFsbD5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3NwYW4+XG4gICAgPC9zcGFuPlxuICAgIDxzcGFuXG4gICAgICB2LWlmPVwiaW52YWxpZFwiXG4gICAgICBjbGFzcz1cInBvX19lcnJcIlxuICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgPnt7IGVkaXRpbmcgfX0gZ29lcyBmcm9tIHt7IGF4aXNNaW5bZWRpdEluZGV4XSB9fSB0byB7eyBheGlzTWF4W2VkaXRJbmRleF0gfX08L3NwYW4+XG4gIDwvdGlsZS1zaGVsbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5pbXBvcnQgVGlsZVNoZWxsIGZyb20gJy4vVGlsZVNoZWxsLnZ1ZSdcblxuLyoqXG4gKiBXaGVyZSB0aGUgaGVhZCBpcywgbGl2ZSwgYW5kIHdoZXRoZXIgaXQgaXMgaG9tZWQuIFByZXNzIGFuIGF4aXMgdG8gdHlwZSBhXG4gKiBudW1iZXIgKGl0IGdvZXMgdGhyb3VnaCBtb3ZlVG86IHRoZSBzYW1lIGNoZWNrcyBhcyB0aGUgVHJhY2twYWQpOyBhbiBheGlzIHRoYXQgaXNcbiAqIG5vdCBob21lZCBzYXlzIHNvIGFuZCBoYXMgaXRzIG93biBzbWFsbCBIb21lLiBNb3RvcnMgb2ZmIGlzIHRoZSBzbWFsbCBpY29uIGluIHRoZVxuICogaGVhZGVyLiBUaGUgZW5kc3RvcHMgYXJlIG5vdCBpbiBhIG1lbnUgaGVyZSBhbnkgbW9yZS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVGlsZVNoZWxsIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvc2l0aW9uVGlsZSBleHRlbmRzIE1peGlucyhPdmVydmlld01peGluKSB7XG4gIHJlYWRvbmx5IGF4ZXMgPSBbJ1gnLCAnWScsICdaJ11cbiAgZWRpdGluZyA9ICcnXG4gIGVkaXRJbmRleCA9IDBcbiAgZHJhZnQgPSAnJ1xuICBpbnZhbGlkID0gZmFsc2VcblxuICBAV2F0Y2goJ3BhbmVsVGFyZ2V0JylcbiAgcmVzZXQgKCkgeyB0aGlzLmNhbmNlbCgpIH1cblxuICBnZXQga25vd24gKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHAgPSB0aGlzLnRvb2xoZWFkLnBvc2l0aW9uXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocCkgJiYgcC5zbGljZSgwLCAzKS5ldmVyeShOdW1iZXIuaXNGaW5pdGUpXG4gIH1cblxuICBnZXQgaG9tZWQgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5rbm93biAmJiB0aGlzLmlzSG9tZWQoJ1hZWicpIH1cblxuICBnZXQgaG9tZWRUZXh0ICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmhvbWVkKSByZXR1cm4gJ0hvbWVkJ1xuICAgIHJldHVybiB0aGlzLmhvbWVkQXhlcyA/IGBIb21lZCAke3RoaXMuaG9tZWRBeGVzLnNwbGl0KCcnKS5qb2luKCcgJyl9YCA6ICdOb3QgaG9tZWQnXG4gIH1cblxuICBzaG93biAoaTogbnVtYmVyKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMua25vd24gPyB0aGlzLnBvc2l0aW9uW2ldLnRvRml4ZWQoaSA9PT0gMiA/IDIgOiAxKSA6ICfigJQnIH1cblxuICBnZXQgY2FuSG9tZSAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmNvbnRyb2xSZWFkeSAmJiAhdGhpcy5idXN5IH1cbiAgZ2V0IGNhbkVkaXQgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgJiYgIXRoaXMuYnVzeSAmJiB0aGlzLmtub3duIH1cblxuICBzdGFydEVkaXQgKGF4aXM6IHN0cmluZywgaTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmNhbkVkaXQpIHJldHVyblxuICAgIHRoaXMuZWRpdGluZyA9IGF4aXNcbiAgICB0aGlzLmVkaXRJbmRleCA9IGlcbiAgICB0aGlzLmRyYWZ0ID0gdGhpcy5wb3NpdGlvbltpXS50b0ZpeGVkKGkgPT09IDIgPyAyIDogMSlcbiAgICB0aGlzLmludmFsaWQgPSBmYWxzZVxuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgIGNvbnN0IGVsID0gKHRoaXMuJHJlZnNbYGVkaXQtJHtheGlzfWBdIGFzIEhUTUxJbnB1dEVsZW1lbnRbXSB8IHVuZGVmaW5lZCk/LlswXVxuICAgICAgZWw/LmZvY3VzKClcbiAgICAgIGVsPy5zZWxlY3QoKVxuICAgIH0pXG4gIH1cblxuICBjYW5jZWwgKCkgeyB0aGlzLmVkaXRpbmcgPSAnJzsgdGhpcy5pbnZhbGlkID0gZmFsc2UgfVxuXG4gIGNvbW1pdCAoaTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIGNvbnN0IGF4aXMgPSB0aGlzLmVkaXRpbmdcbiAgICBjb25zdCB2YWx1ZSA9IE51bWJlcih0aGlzLmRyYWZ0LnJlcGxhY2UoJywnLCAnLicpKVxuICAgIGlmICh0aGlzLmRyYWZ0LnRyaW0oKSA9PT0gJycgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgfHwgdmFsdWUgPCB0aGlzLmF4aXNNaW5baV0gfHwgdmFsdWUgPiB0aGlzLmF4aXNNYXhbaV0pIHtcbiAgICAgIHRoaXMuaW52YWxpZCA9IHRydWVcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmNhbmNlbCgpXG4gICAgaWYgKE1hdGguYWJzKHZhbHVlIC0gdGhpcy5wb3NpdGlvbltpXSkgPj0gMC4wMDUpIHRoaXMubW92ZVRvKGF4aXMgPT09ICdYJyA/IHsgWDogdmFsdWUgfSA6IGF4aXMgPT09ICdZJyA/IHsgWTogdmFsdWUgfSA6IHsgWjogdmFsdWUgfSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuLnBvX194eXogeyBkaXNwbGF5OiBncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgzLCBtaW5tYXgoMCwgMWZyKSk7IGdhcDogOHB4OyB9XG4ucG9fX2F4aXMgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IGdhcDogMnB4OyBtaW4td2lkdGg6IDA7IG1pbi1oZWlnaHQ6IDUycHg7IHBhZGRpbmc6IDZweCA4cHggNnB4IDEwcHg7IGJvcmRlci1yYWRpdXM6IDE0cHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpOyB9XG4ucG9fX3RvcCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgbWluLWhlaWdodDogMjRweDsgfVxuLnBvX19rIHsgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpOyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiA3MDA7IGxldHRlci1zcGFjaW5nOiAwLjA4ZW07IH1cbi5wb19fdmFsIHsgZGlzcGxheTogaW5saW5lLWZsZXg7IGFsaWduLWl0ZW1zOiBiYXNlbGluZTsgZ2FwOiAzcHg7IG1hcmdpbjogMCAtNHB4OyBwYWRkaW5nOiAycHggNHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IGNvbG9yOiBpbmhlcml0OyBmb250OiBpbmhlcml0OyB0ZXh0LWFsaWduOiBsZWZ0OyBjdXJzb3I6IHRleHQ7IH1cbi5wb19fdmFsOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpOyB9XG4ucG9fX3ZhbDpmb2N1cy12aXNpYmxlIHsgb3V0bGluZTogMnB4IHNvbGlkIHZhcigtLW0zZC1mb2N1cy1yaW5nLCB2YXIoLS1tM2QtYWNjZW50KSk7IG91dGxpbmUtb2Zmc2V0OiAxcHg7IH1cbi5wb19fdmFsOmRpc2FibGVkIHsgY3Vyc29yOiBkZWZhdWx0OyB9XG4ucG9fX3ZhbCBiIHsgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pOyBmb250LXNpemU6IDE4cHg7IGZvbnQtd2VpZ2h0OiA1MDA7IGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7IH1cbi5wb19fdmFsIHNtYWxsIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IGZvbnQtc2l6ZTogMTFweDsgfVxuLnBvX19heGlzLS1lZGl0IHsgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMS41cHggdmFyKC0tbTNkLWFjY2VudCk7IH1cbi5wb19faW5wdXQgeyB3aWR0aDogMTAwJTsgbWluLXdpZHRoOiAwOyBwYWRkaW5nOiAycHggNHB4OyBtYXJnaW46IDAgLTRweDsgYm9yZGVyLXJhZGl1czogOHB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTsgZm9udC1zaXplOiAxOHB4OyBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zOyBvdXRsaW5lOiBub25lOyB9XG4ucG9fX25vaG9tZSB7IGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7IGZvbnQtc2l6ZTogMTJweDsgZm9udC13ZWlnaHQ6IDYwMDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxuLnBvX19ob21lIHsgZGlzcGxheTogaW5saW5lLWZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB3aWR0aDogMjZweDsgaGVpZ2h0OiAyNnB4OyBib3JkZXItcmFkaXVzOiA5cHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1maWxsKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgY3Vyc29yOiBwb2ludGVyOyB9XG4ucG9fX2hvbWU6aG92ZXI6bm90KDpkaXNhYmxlZCkgeyBmaWx0ZXI6IGJyaWdodG5lc3MoMS4xNSk7IH1cbi5wb19faG9tZTpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNDU7IGN1cnNvcjogZGVmYXVsdDsgfVxuLnBvX19ob21lOmZvY3VzLXZpc2libGUgeyBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWZvY3VzLXJpbmcsIHZhcigtLW0zZC1hY2NlbnQpKTsgb3V0bGluZS1vZmZzZXQ6IDJweDsgfVxuLnBvLS1TIC5wb19fdmFsIHNtYWxsIHsgZGlzcGxheTogbm9uZTsgfVxuLnBvLS1TIC5wb19fdmFsIGIsIC5wby0tUyAucG9fX2lucHV0IHsgZm9udC1zaXplOiAxNnB4OyB9XG4ucG9fX21vdG9ycyB7IGRpc3BsYXk6IGlubGluZS1mbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgd2lkdGg6IDI2cHg7IGhlaWdodDogMjZweDsgYm9yZGVyLXJhZGl1czogOXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGN1cnNvcjogcG9pbnRlcjsgfVxuLnBvX19tb3RvcnM6aG92ZXI6bm90KDpkaXNhYmxlZCkgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyBmaWx0ZXI6IGJyaWdodG5lc3MoMS4xNSk7IH1cbi5wb19fbW90b3JzOmRpc2FibGVkIHsgb3BhY2l0eTogMC40NTsgY3Vyc29yOiBkZWZhdWx0OyB9XG4ucG9fX21vdG9yczpmb2N1cy12aXNpYmxlIHsgb3V0bGluZTogMnB4IHNvbGlkIHZhcigtLW0zZC1mb2N1cy1yaW5nLCB2YXIoLS1tM2QtYWNjZW50KSk7IG91dGxpbmUtb2Zmc2V0OiAycHg7IH1cbi5wb19fZXJyIHsgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpOyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL292ZXJ2aWV3L3RpbGVzL1Bvc2l0aW9uVGlsZS52dWUifQ==