/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/PlateCheck.vue";
import __unplugin_components_1 from "/src/components/ui/PlateClearNotice.vue";
import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import M3Dialog from "/src/components/ui/M3Dialog.vue";
import PlateCheck from "/src/components/ui/PlateCheck.vue";
import PlateClearNotice from "/src/components/ui/PlateClearNotice.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
export const CLOSE_MS = 220;
let M3Confirm = class extends Vue {
  message;
  title;
  eyebrow;
  buttonTrueText;
  buttonFalseText;
  danger;
  persistent;
  width;
  plateCheck;
  plateNotice;
  film;
  open = true;
  plateClear = false;
  filmOn = false;
  answered = false;
  /** Class fields run before props are set, so the printer's timelapse setting is read here. */
  created() {
    this.filmOn = !!this.film?.on;
  }
  get okText() {
    return this.buttonTrueText || "Continue";
  }
  get cancelText() {
    return this.buttonFalseText || "Cancel";
  }
  get fallbackTitle() {
    return this.okText;
  }
  choose(value) {
    if (this.answered) return;
    if (value && this.plateCheck && !this.plateClear) return;
    this.answered = true;
    if (value && this.film && this.filmOn !== !!this.film.on) this.film.set(this.filmOn);
    this.open = false;
    window.setTimeout(() => this.$emit("result", value), CLOSE_MS);
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], M3Confirm.prototype, "message", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Confirm.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Confirm.prototype, "eyebrow", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Confirm.prototype, "buttonTrueText", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], M3Confirm.prototype, "buttonFalseText", 2);
__decorateClass([
  Prop({ type: Boolean })
], M3Confirm.prototype, "danger", 2);
__decorateClass([
  Prop({ type: Boolean })
], M3Confirm.prototype, "persistent", 2);
__decorateClass([
  Prop({ type: Number, default: 440 })
], M3Confirm.prototype, "width", 2);
__decorateClass([
  Prop({ type: Boolean })
], M3Confirm.prototype, "plateCheck", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], M3Confirm.prototype, "plateNotice", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], M3Confirm.prototype, "film", 2);
M3Confirm = __decorateClass([
  Component({ components: { M3Dialog, PlateCheck, PlateClearNotice, ToggleSwitch } })
], M3Confirm);
const _sfc_main = M3Confirm;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "title": _vm.title || _vm.fallbackTitle, "eyebrow": _vm.eyebrow, "tone": _vm.danger ? "danger" : "", "max-width": _vm.width, "persistent": _vm.persistent, "close-label": _vm.cancelText, "data-tid": "confirm" }, on: { "close": function($event) {
    return _vm.choose(false);
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "confirm-cancel" }, on: { "click": function($event) {
      return _vm.choose(false);
    } } }, [_vm._v(" " + _vm._s(_vm.cancelText) + " ")]), _c("button", { staticClass: "cbtn", class: _vm.danger ? "cbtn--danger" : "cbtn--primary", attrs: { "type": "button", "disabled": _vm.plateCheck && !_vm.plateClear, "data-tid": "confirm-ok" }, on: { "click": function($event) {
      return _vm.choose(true);
    } } }, [_vm._v(" " + _vm._s(_vm.okText) + " ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "m3-dlg__text", attrs: { "data-tid": "confirm-message" } }, [_vm._v(" " + _vm._s(_vm.message) + " ")]), _vm.plateNotice ? _c(__unplugin_components_1, { attrs: { "inline": "", "managed": _vm.plateNotice.managed } }) : _vm._e(), _vm.plateCheck ? _c(__unplugin_components_2, { attrs: { "data-tid": "confirm-plate" }, model: { value: _vm.plateClear, callback: function($$v) {
    _vm.plateClear = $$v;
  }, expression: "plateClear" } }) : _vm._e(), _vm.film ? _c("div", { staticClass: "m3-confirm__film", attrs: { "data-tid": "confirm-film" } }, [_c("span", { staticClass: "m3-confirm__film-text" }, [_c("b", [_vm._v("Film it")]), _c("span", [_vm._v(_vm._s(_vm.film.line))])]), _c("toggle-switch", { attrs: { "label": "Film it", "data-tid": "confirm-film-switch" }, model: { value: _vm.filmOn, callback: function($$v) {
    _vm.filmOn = $$v;
  }, expression: "filmOn" } })], 1) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/M3Confirm.vue?vue&type=style&index=0&scoped=efe22ddc&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "efe22ddc",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/M3Confirm.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFRQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQSxFQUlBO0FBQUE7RUFHQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFuRUE7QUFBQSxFQURBO0FBQUEsR0FEQSxVQUVBO0FBR0E7QUFBQTtHQUxBLFVBS0E7QUFHQTtBQUFBO0dBUkEsVUFRQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBWEEsVUFZQTtBQUdBO0FBQUE7R0FmQSxVQWVBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FsQkEsVUFtQkE7QUFHQTtBQUFBO0dBdEJBLFVBc0JBO0FBR0E7QUFBQTtHQXpCQSxVQXlCQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBNUJBLFVBNkJBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FoQ0EsVUFpQ0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQXBDQSxVQXFDQTtBQXJDQTtBQUFBO0FBQUEiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk0zQ29uZmlybS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8bTMtZGlhbG9nXG4gICAgOnZhbHVlPVwib3BlblwiXG4gICAgOnRpdGxlPVwidGl0bGUgfHwgZmFsbGJhY2tUaXRsZVwiXG4gICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICA6dG9uZT1cImRhbmdlciA/ICdkYW5nZXInIDogJydcIlxuICAgIDptYXgtd2lkdGg9XCJ3aWR0aFwiXG4gICAgOnBlcnNpc3RlbnQ9XCJwZXJzaXN0ZW50XCJcbiAgICA6Y2xvc2UtbGFiZWw9XCJjYW5jZWxUZXh0XCJcbiAgICBkYXRhLXRpZD1cImNvbmZpcm1cIlxuICAgIEBjbG9zZT1cImNob29zZShmYWxzZSlcIlxuICA+XG4gICAgPHBcbiAgICAgIGNsYXNzPVwibTMtZGxnX190ZXh0XCJcbiAgICAgIGRhdGEtdGlkPVwiY29uZmlybS1tZXNzYWdlXCJcbiAgICA+XG4gICAgICB7eyBtZXNzYWdlIH19XG4gICAgPC9wPlxuXG4gICAgPHBsYXRlLWNsZWFyLW5vdGljZVxuICAgICAgdi1pZj1cInBsYXRlTm90aWNlXCJcbiAgICAgIGlubGluZVxuICAgICAgOm1hbmFnZWQ9XCJwbGF0ZU5vdGljZS5tYW5hZ2VkXCJcbiAgICAvPlxuXG4gICAgPHBsYXRlLWNoZWNrXG4gICAgICB2LWlmPVwicGxhdGVDaGVja1wiXG4gICAgICB2LW1vZGVsPVwicGxhdGVDbGVhclwiXG4gICAgICBkYXRhLXRpZD1cImNvbmZpcm0tcGxhdGVcIlxuICAgIC8+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiZmlsbVwiXG4gICAgICBjbGFzcz1cIm0zLWNvbmZpcm1fX2ZpbG1cIlxuICAgICAgZGF0YS10aWQ9XCJjb25maXJtLWZpbG1cIlxuICAgID5cbiAgICAgIDxzcGFuIGNsYXNzPVwibTMtY29uZmlybV9fZmlsbS10ZXh0XCI+XG4gICAgICAgIDxiPkZpbG0gaXQ8L2I+XG4gICAgICAgIDxzcGFuPnt7IGZpbG0ubGluZSB9fTwvc3Bhbj5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgIHYtbW9kZWw9XCJmaWxtT25cIlxuICAgICAgICBsYWJlbD1cIkZpbG0gaXRcIlxuICAgICAgICBkYXRhLXRpZD1cImNvbmZpcm0tZmlsbS1zd2l0Y2hcIlxuICAgICAgLz5cbiAgICA8L2Rpdj5cblxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uZmlybS1jYW5jZWxcIlxuICAgICAgICBAY2xpY2s9XCJjaG9vc2UoZmFsc2UpXCJcbiAgICAgID5cbiAgICAgICAge3sgY2FuY2VsVGV4dCB9fVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICA6Y2xhc3M9XCJkYW5nZXIgPyAnY2J0bi0tZGFuZ2VyJyA6ICdjYnRuLS1wcmltYXJ5J1wiXG4gICAgICAgIDpkaXNhYmxlZD1cInBsYXRlQ2hlY2sgJiYgIXBsYXRlQ2xlYXJcIlxuICAgICAgICBkYXRhLXRpZD1cImNvbmZpcm0tb2tcIlxuICAgICAgICBAY2xpY2s9XCJjaG9vc2UodHJ1ZSlcIlxuICAgICAgPlxuICAgICAgICB7eyBva1RleHQgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvbTMtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNM0RpYWxvZyBmcm9tICcuL00zRGlhbG9nLnZ1ZSdcbmltcG9ydCBQbGF0ZUNoZWNrIGZyb20gJy4vUGxhdGVDaGVjay52dWUnXG5pbXBvcnQgUGxhdGVDbGVhck5vdGljZSBmcm9tICcuL1BsYXRlQ2xlYXJOb3RpY2UudnVlJ1xuaW1wb3J0IFRvZ2dsZVN3aXRjaCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Ub2dnbGVTd2l0Y2gudnVlJ1xuXG4vKiogSG93IGxvbmcgdGhlIGRpYWxvZyB0YWtlcyB0byBjbG9zZSBiZWZvcmUgaXRzIGFuc3dlciBpcyBnaXZlbi4gKi9cbmV4cG9ydCBjb25zdCBDTE9TRV9NUyA9IDIyMFxuXG4vKipcbiAqIFRoZSBxdWVzdGlvbiBiZWhpbmQgYCRjb25maXJtYCAocGx1Z2lucy9jb25maXJtLnRzKTogd2hhdCB3aWxsIGhhcHBlbiwgYW5kXG4gKiBhIGJ1dHRvbiB0aGF0IHNheXMgaXQuIOKclSwgRXNjLCBDYW5jZWwgYW5kIGEgY2xpY2sgb3V0c2lkZSBhbGwgYW5zd2VyIG5vLlxuICogVGhlIG1lc3NhZ2UgaXMgdGV4dCwgbmV2ZXIgSFRNTDogaXQgb2Z0ZW4gaG9sZHMgYSBmaWxlJ3MgbmFtZS4gV2l0aFxuICogYHBsYXRlQ2hlY2tgLCB0aGUgYnV0dG9uIHN0YXlzIG9mZiB1bnRpbCB0aGUgcGxhdGUgY2hlY2sgaXMgdGlja2VkLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNM0RpYWxvZywgUGxhdGVDaGVjaywgUGxhdGVDbGVhck5vdGljZSwgVG9nZ2xlU3dpdGNoIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE0zQ29uZmlybSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBtZXNzYWdlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IGV5ZWJyb3chOiBzdHJpbmdcblxuICAvKiogV2hhdCB0aGUgYnV0dG9uIHRoYXQgc2F5cyB5ZXMgc2F5czogd2hhdCB3aWxsIGhhcHBlbiAoXCJEZWxldGVcIiwgXCJSZXN0YXJ0XCIpLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgYnV0dG9uVHJ1ZVRleHQhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgYnV0dG9uRmFsc2VUZXh0ITogc3RyaW5nXG5cbiAgLyoqIEl0IGNhbid0IGJlIHVuZG9uZSwgb3IgaXQgc3RvcHMgdGhlIHByaW50ZXI6IHRoZSBidXR0b24gaXMgcmVkLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZGFuZ2VyITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBwZXJzaXN0ZW50ITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiA0NDAgfSlcbiAgcmVhZG9ubHkgd2lkdGghOiBudW1iZXJcblxuICAvKiogQSBwcmludCBzdGFydHM6IGFzayB0aGUgcGxhdGUgY2hlY2sgKFBsYXRlQ2hlY2spIGZpcnN0LiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgcGxhdGVDaGVjayE6IGJvb2xlYW5cblxuICAvKiogVGhlIHByaW50ZXIgd2FudHMgdGhlIHBsYXRlIGNvbmZpcm1lZDogdGhlIG5vdGljZSBzaG93cyBpbmxpbmUgKENULTE0KS4gKi9cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgcGxhdGVOb3RpY2UhOiB7IG1hbmFnZWQ6IGJvb2xlYW4gfSB8IG51bGxcblxuICAvKiogQSBwcmludCB0aGUgcHJpbnRlciBjYW4gZmlsbTogdGhlIFwiRmlsbSBpdFwiIHN3aXRjaCAoc2VlIENvbmZpcm1PcHRpb25zLmZpbG0pLiAqL1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSBmaWxtITogeyBvbjogYm9vbGVhbiwgbGluZTogc3RyaW5nLCBzZXQ6IChvbjogYm9vbGVhbikgPT4gdW5rbm93biB9IHwgbnVsbFxuXG4gIG9wZW4gPSB0cnVlXG4gIHBsYXRlQ2xlYXIgPSBmYWxzZVxuICBmaWxtT24gPSBmYWxzZVxuICBhbnN3ZXJlZCA9IGZhbHNlXG5cbiAgLyoqIENsYXNzIGZpZWxkcyBydW4gYmVmb3JlIHByb3BzIGFyZSBzZXQsIHNvIHRoZSBwcmludGVyJ3MgdGltZWxhcHNlIHNldHRpbmcgaXMgcmVhZCBoZXJlLiAqL1xuICBjcmVhdGVkICgpIHtcbiAgICB0aGlzLmZpbG1PbiA9ICEhdGhpcy5maWxtPy5vblxuICB9XG5cbiAgZ2V0IG9rVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5idXR0b25UcnVlVGV4dCB8fCAnQ29udGludWUnXG4gIH1cblxuICBnZXQgY2FuY2VsVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5idXR0b25GYWxzZVRleHQgfHwgJ0NhbmNlbCdcbiAgfVxuXG4gIGdldCBmYWxsYmFja1RpdGxlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm9rVGV4dFxuICB9XG5cbiAgY2hvb3NlICh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLmFuc3dlcmVkKSByZXR1cm5cbiAgICBpZiAodmFsdWUgJiYgdGhpcy5wbGF0ZUNoZWNrICYmICF0aGlzLnBsYXRlQ2xlYXIpIHJldHVyblxuICAgIHRoaXMuYW5zd2VyZWQgPSB0cnVlXG4gICAgaWYgKHZhbHVlICYmIHRoaXMuZmlsbSAmJiB0aGlzLmZpbG1PbiAhPT0gISF0aGlzLmZpbG0ub24pIHRoaXMuZmlsbS5zZXQodGhpcy5maWxtT24pXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLiRlbWl0KCdyZXN1bHQnLCB2YWx1ZSksIENMT1NFX01TKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubTMtY29uZmlybV9fZmlsbSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWFyZ2luLXRvcDogMTJweDtcbiAgICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5tMy1jb25maXJtX19maWxtLXRleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDJweDtcblxuICAgIHNwYW4ge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9NM0NvbmZpcm0udnVlIn0=