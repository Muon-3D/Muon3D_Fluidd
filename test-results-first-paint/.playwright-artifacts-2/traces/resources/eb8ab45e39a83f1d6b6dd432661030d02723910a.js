/* unplugin-vue-components disabled */import { VListItemSubtitle as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { healthLabel } from "/src/services/muon-cloud/directory.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
let PrinterCard = class extends Vue {
  entry;
  actions;
  busy;
  note;
  get spinning() {
    return this.entry.health === "connecting" || this.entry.health === "reconnecting" || this.entry.health === "searching";
  }
  get dim() {
    return this.entry.health === "offline" && !this.entry.active;
  }
  get statusTitle() {
    return healthLabel(this.entry.health);
  }
  get parts() {
    return printerNameParts(this.entry.name);
  }
  get thumbState() {
    if (this.entry.health === "printing" || this.entry.health === "paused") return "printing";
    if (this.entry.health === "offline") return "offline";
    return "idle";
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], PrinterCard.prototype, "entry", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], PrinterCard.prototype, "actions", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], PrinterCard.prototype, "busy", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], PrinterCard.prototype, "note", 2);
PrinterCard = __decorateClass([
  Component({})
], PrinterCard);
const _sfc_main = PrinterCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "muon-card", class: { "is-active": !!_vm.entry.active, "is-dim": _vm.dim }, attrs: { "role": "button", "tabindex": "0", "data-health": _vm.entry.health }, on: { "click": function($event) {
    return _vm.$emit("open");
  }, "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.target !== $event.currentTarget) return null;
    return _vm.$emit("open");
  } } }, [_c(__unplugin_components_0, { attrs: { "size": 40, "state": _vm.thumbState } }), _c("span", { staticClass: "muon-card__text" }, [_c("span", { staticClass: "muon-card__title" }, [_c("span", { staticClass: "muon-card__name" }, [_vm._v(_vm._s(_vm.parts.name))]), _vm.parts.suffix ? _c("span", { staticClass: "muon-card__suffix" }, [_vm._v(_vm._s(_vm.parts.suffix))]) : _vm._e(), _vm.entry.active ? _c("span", { staticClass: "muon-card__badge" }, [_vm._v(_vm._s(_vm.entry.active === "cloud" ? "Open, remote" : "Open"))]) : _vm._e()]), _c("span", { staticClass: "muon-card__detail", class: `is-${_vm.entry.health}`, attrs: { "title": _vm.statusTitle } }, [_vm.busy || _vm.spinning ? _c(__unplugin_components_1, { staticClass: "muon-card__spinner", attrs: { "indeterminate": "", "size": "11", "width": "2" } }) : _vm._e(), _vm.entry.nearby ? _c(__unplugin_components_2, { staticClass: "muon-card__meta-icon", attrs: { "x-small": "" } }, [_vm._v(" $bluetooth ")]) : _vm._e(), _c("span", { staticClass: "muon-card__detail-text" }, [_vm._v(_vm._s(_vm.entry.detail))])], 1), _vm.note ? _c("span", { staticClass: "muon-card__note" }, [_vm._v(" " + _vm._s(_vm.note) + " ")]) : _vm._e(), _vm._t("default")], 2), _vm.actions.length ? _c(__unplugin_components_3, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "muon-card__menu", attrs: { "type": "button", "aria-label": `Options for ${_vm.entry.name}` }, on: { "click": function($event) {
      $event.stopPropagation();
    } } }, "button", attrs, false), on), [_c(__unplugin_components_4, { attrs: { "name": "more" } })], 1)];
  } }], null, false, 405389521) }, [_c(__unplugin_components_5, { attrs: { "dense": "" } }, _vm._l(_vm.actions, function(a) {
    return _c(__unplugin_components_6, { key: a.id, attrs: { "disabled": a.disabled, "data-action": a.id }, on: { "click": function($event) {
      return _vm.$emit("action", a.id);
    } } }, [_c(__unplugin_components_7, { staticClass: "mr-3" }, [_c(__unplugin_components_8, { attrs: { "small": "", "color": a.danger ? "error" : void 0 } }, [_vm._v(" " + _vm._s(a.icon) + " ")])], 1), _c(__unplugin_components_9, [_c(__unplugin_components_10, { class: { "error--text": a.danger } }, [_vm._v(" " + _vm._s(a.label) + " ")]), a.hint ? _c(__unplugin_components_11, [_vm._v(" " + _vm._s(a.hint) + " ")]) : _vm._e()], 1)], 1);
  }), 1)], 1) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/PrinterCard.vue?vue&type=style&index=0&scoped=be30b245&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "be30b245",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/PrinterCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVHQTtBQUNBO0FBQ0E7QUFZQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBR0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBakNBO0FBQUEsRUFEQTtBQUFBLEdBREEsWUFFQTtBQUdBO0FBQUE7R0FMQSxZQUtBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FSQSxZQVNBO0FBR0E7QUFBQTtHQVpBLFlBWUE7QUFaQTtBQUFBO0FBQUEiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlByaW50ZXJDYXJkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cIm11b24tY2FyZFwiXG4gICAgOmNsYXNzPVwieyAnaXMtYWN0aXZlJzogISFlbnRyeS5hY3RpdmUsICdpcy1kaW0nOiBkaW0gfVwiXG4gICAgcm9sZT1cImJ1dHRvblwiXG4gICAgdGFiaW5kZXg9XCIwXCJcbiAgICA6ZGF0YS1oZWFsdGg9XCJlbnRyeS5oZWFsdGhcIlxuICAgIEBjbGljaz1cIiRlbWl0KCdvcGVuJylcIlxuICAgIEBrZXlkb3duLmVudGVyLnNlbGY9XCIkZW1pdCgnb3BlbicpXCJcbiAgPlxuICAgIDxwcmludGVyLXRodW1iXG4gICAgICA6c2l6ZT1cIjQwXCJcbiAgICAgIDpzdGF0ZT1cInRodW1iU3RhdGVcIlxuICAgIC8+XG4gICAgPHNwYW4gY2xhc3M9XCJtdW9uLWNhcmRfX3RleHRcIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1jYXJkX190aXRsZVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm11b24tY2FyZF9fbmFtZVwiPnt7IHBhcnRzLm5hbWUgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cInBhcnRzLnN1ZmZpeFwiXG4gICAgICAgICAgY2xhc3M9XCJtdW9uLWNhcmRfX3N1ZmZpeFwiXG4gICAgICAgID57eyBwYXJ0cy5zdWZmaXggfX08L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cImVudHJ5LmFjdGl2ZVwiXG4gICAgICAgICAgY2xhc3M9XCJtdW9uLWNhcmRfX2JhZGdlXCJcbiAgICAgICAgPnt7IGVudHJ5LmFjdGl2ZSA9PT0gJ2Nsb3VkJyA/ICdPcGVuLCByZW1vdGUnIDogJ09wZW4nIH19PC9zcGFuPlxuICAgICAgPC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgY2xhc3M9XCJtdW9uLWNhcmRfX2RldGFpbFwiXG4gICAgICAgIDpjbGFzcz1cImBpcy0ke2VudHJ5LmhlYWx0aH1gXCJcbiAgICAgICAgOnRpdGxlPVwic3RhdHVzVGl0bGVcIlxuICAgICAgPlxuICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgIHYtaWY9XCJidXN5IHx8IHNwaW5uaW5nXCJcbiAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgc2l6ZT1cIjExXCJcbiAgICAgICAgICB3aWR0aD1cIjJcIlxuICAgICAgICAgIGNsYXNzPVwibXVvbi1jYXJkX19zcGlubmVyXCJcbiAgICAgICAgLz5cbiAgICAgICAgPHYtaWNvblxuICAgICAgICAgIHYtaWY9XCJlbnRyeS5uZWFyYnlcIlxuICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICBjbGFzcz1cIm11b24tY2FyZF9fbWV0YS1pY29uXCJcbiAgICAgICAgPlxuICAgICAgICAgICRibHVldG9vdGhcbiAgICAgICAgPC92LWljb24+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1jYXJkX19kZXRhaWwtdGV4dFwiPnt7IGVudHJ5LmRldGFpbCB9fTwvc3Bhbj5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtaWY9XCJub3RlXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLWNhcmRfX25vdGVcIlxuICAgICAgPlxuICAgICAgICB7eyBub3RlIH19XG4gICAgICA8L3NwYW4+XG4gICAgICA8c2xvdCAvPlxuICAgIDwvc3Bhbj5cbiAgICA8di1tZW51XG4gICAgICB2LWlmPVwiYWN0aW9ucy5sZW5ndGhcIlxuICAgICAgbGVmdFxuICAgICAgb2Zmc2V0LXlcbiAgICA+XG4gICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwibXVvbi1jYXJkX19tZW51XCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cImBPcHRpb25zIGZvciAke2VudHJ5Lm5hbWV9YFwiXG4gICAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICAgIEBjbGljay5zdG9wXG4gICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJtb3JlXCIgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHYtbGlzdCBkZW5zZT5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgdi1mb3I9XCJhIGluIGFjdGlvbnNcIlxuICAgICAgICAgIDprZXk9XCJhLmlkXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJhLmRpc2FibGVkXCJcbiAgICAgICAgICA6ZGF0YS1hY3Rpb249XCJhLmlkXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnYWN0aW9uJywgYS5pZClcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtbGlzdC1pdGVtLWljb24gY2xhc3M9XCJtci0zXCI+XG4gICAgICAgICAgICA8di1pY29uXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAgIDpjb2xvcj1cImEuZGFuZ2VyID8gJ2Vycm9yJyA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt7IGEuaWNvbiB9fVxuICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgPC92LWxpc3QtaXRlbS1pY29uPlxuICAgICAgICAgIDx2LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlIDpjbGFzcz1cInsgJ2Vycm9yLS10ZXh0JzogYS5kYW5nZXIgfVwiPlxuICAgICAgICAgICAgICB7eyBhLmxhYmVsIH19XG4gICAgICAgICAgICA8L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXN1YnRpdGxlIHYtaWY9XCJhLmhpbnRcIj5cbiAgICAgICAgICAgICAge3sgYS5oaW50IH19XG4gICAgICAgICAgICA8L3YtbGlzdC1pdGVtLXN1YnRpdGxlPlxuICAgICAgICAgIDwvdi1saXN0LWl0ZW0tY29udGVudD5cbiAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgIDwvdi1saXN0PlxuICAgIDwvdi1tZW51PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBoZWFsdGhMYWJlbCwgdHlwZSBDYXJkQWN0aW9uLCB0eXBlIERpcmVjdG9yeUVudHJ5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2RpcmVjdG9yeSdcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMsIHR5cGUgUHJpbnRlck5hbWVQYXJ0cyB9IGZyb20gJ0AvdXRpbC9wcmludGVyLW5hbWUnXG5pbXBvcnQgdHlwZSB7IFRodW1iU3RhdGUgfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvUHJpbnRlclRodW1iLnZ1ZSdcblxuZXhwb3J0IHR5cGUgeyBDYXJkQWN0aW9uIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2RpcmVjdG9yeSdcblxuLyoqXG4gKiBPbmUgcHJpbnRlciBpbiB0aGUgc3dpdGNoZXI6IGl0cyBwaWN0dXJlLCBpdHMgbmFtZSwgYW5kIGhvdyBpdCBpcyBub3csXG4gKiBjb2xvdXJlZDogZ3JlZW4gd2hlbiBpdCBhbnN3ZXJlZCBhbmQgS2xpcHBlciBpcyByZWFkeSwgdGVhbCBwcmludGluZywgYVxuICogc3Bpbm5lciB3aGlsZSBpdCBpcyBiZWluZyByZWFjaGVkLCBncmV5IHdoZW4gbm90aGluZyBhbnN3ZXJzLCByZWQgd2hlbiBpdFxuICogYW5zd2VyZWQgd2l0aCBhIGZhdWx0LCBhbWJlciB3aGVuIGl0IHdhbnRzIGFjY2Vzcy4gV2hhdCBjYW4gYmUgZG9uZSB3aXRoXG4gKiB0aGUgcHJpbnRlciBpcyBpbiBpdHMgb3duIG1lbnUuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmludGVyQ2FyZCBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBlbnRyeSE6IERpcmVjdG9yeUVudHJ5XG5cbiAgQFByb3AoeyB0eXBlOiBBcnJheSwgZGVmYXVsdDogKCkgPT4gW10gfSlcbiAgcmVhZG9ubHkgYWN0aW9ucyE6IENhcmRBY3Rpb25bXVxuXG4gIC8qKiBUaGlzIGNhcmQncyBwcmludGVyIGlzIGJlaW5nIG9wZW5lZCBub3cuICovXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogZmFsc2UgfSlcbiAgcmVhZG9ubHkgYnVzeSE6IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgbm90ZSE6IHN0cmluZ1xuXG4gIGdldCBzcGlubmluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW50cnkuaGVhbHRoID09PSAnY29ubmVjdGluZycgfHwgdGhpcy5lbnRyeS5oZWFsdGggPT09ICdyZWNvbm5lY3RpbmcnIHx8IHRoaXMuZW50cnkuaGVhbHRoID09PSAnc2VhcmNoaW5nJ1xuICB9XG5cbiAgZ2V0IGRpbSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW50cnkuaGVhbHRoID09PSAnb2ZmbGluZScgJiYgIXRoaXMuZW50cnkuYWN0aXZlXG4gIH1cblxuICBnZXQgc3RhdHVzVGl0bGUgKCkge1xuICAgIHJldHVybiBoZWFsdGhMYWJlbCh0aGlzLmVudHJ5LmhlYWx0aClcbiAgfVxuXG4gIGdldCBwYXJ0cyAoKTogUHJpbnRlck5hbWVQYXJ0cyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy5lbnRyeS5uYW1lKVxuICB9XG5cbiAgZ2V0IHRodW1iU3RhdGUgKCk6IFRodW1iU3RhdGUge1xuICAgIGlmICh0aGlzLmVudHJ5LmhlYWx0aCA9PT0gJ3ByaW50aW5nJyB8fCB0aGlzLmVudHJ5LmhlYWx0aCA9PT0gJ3BhdXNlZCcpIHJldHVybiAncHJpbnRpbmcnXG4gICAgaWYgKHRoaXMuZW50cnkuaGVhbHRoID09PSAnb2ZmbGluZScpIHJldHVybiAnb2ZmbGluZSdcbiAgICByZXR1cm4gJ2lkbGUnXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4ubXVvbi1jYXJkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgZ2FwOiAxMnB4O1xuICBwYWRkaW5nOiA4cHggMTBweDtcbiAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kLWNvbG9yIHZhcigtLW0zZC1kdXJhdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZSk7XG5cbiAgJjpob3ZlcixcbiAgJjpmb2N1cy12aXNpYmxlIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cblxuICAmLmlzLWFjdGl2ZSB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAmLmlzLWRpbSB7XG4gICAgb3BhY2l0eTogMC43O1xuICB9XG5cbiAgJl9fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgMDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMnB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gICZfX3RpdGxlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgJl9fbmFtZSB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBmb250LXNpemU6IDE1cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgJl9fc3VmZml4IHtcbiAgICBmbGV4OiBub25lO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAmX19iYWRnZSB7XG4gICAgZmxleDogbm9uZTtcbiAgICBwYWRkaW5nOiAxcHggOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgJl9fZGV0YWlsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuXG4gICAgJi5pcy1vbmxpbmUgeyBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MpOyB9XG4gICAgJi5pcy1wcmludGluZyB7IGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTsgfVxuICAgICYuaXMtcGF1c2VkLFxuICAgICYuaXMtbG9ja2VkIHsgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTsgfVxuICAgICYuaXMtZXJyb3IgeyBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7IH1cbiAgICAmLmlzLW9mZmxpbmUsXG4gICAgJi5pcy1hdmFpbGFibGUgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTsgfVxuICB9XG5cbiAgJl9fZGV0YWlsLXRleHQge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gICZfX3NwaW5uZXIge1xuICAgIGZsZXg6IG5vbmU7XG4gIH1cblxuICAmX19ub3RlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gICZfX21ldGEtaWNvbiB7XG4gICAgY29sb3I6IGluaGVyaXQgIWltcG9ydGFudDtcbiAgfVxuXG4gICZfX21lbnUge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDM2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgJjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB9XG4gIH1cbn1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tdW9uLWNsb3VkL1ByaW50ZXJDYXJkLnZ1ZSJ9