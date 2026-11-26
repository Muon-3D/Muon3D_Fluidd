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
let JobMenu = class extends Vue {
  kind;
  label;
  printing;
  queueing;
  locked;
  button;
  noPrint;
  noPreview;
  get items() {
    const held = !!this.printing;
    const items = [];
    if (this.kind === "file") {
      if (!this.noPrint) {
        items.push({ id: this.queueing ? "queue" : "print", label: this.queueing ? "Add to queue" : "Print", disabled: this.locked || held && !this.queueing });
      }
      if (!this.noPreview) items.push({ id: "preview", label: "Preview" });
      items.push({ id: "download", label: "Download" });
    }
    items.push({ id: "rename", label: "Rename", disabled: this.locked || held });
    items.push({ id: "move", label: "Move to\u2026", disabled: this.locked || held });
    items.push({ id: "delete", label: "Delete", disabled: this.locked || held, danger: true });
    return items;
  }
};
__decorateClass([
  Prop({ type: String, default: "file" })
], JobMenu.prototype, "kind", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], JobMenu.prototype, "label", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobMenu.prototype, "printing", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobMenu.prototype, "queueing", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobMenu.prototype, "locked", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobMenu.prototype, "button", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobMenu.prototype, "noPrint", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobMenu.prototype, "noPreview", 2);
JobMenu = __decorateClass([
  Component({})
], JobMenu);
const _sfc_main = JobMenu;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "job-menu", class: { "job-menu--button": _vm.button }, attrs: { "type": "button", "aria-label": `Options for ${_vm.label}`, "data-tid": "job-menu" }, on: { "click": function($event) {
      $event.stopPropagation();
    } } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "more" } })], 1)];
  } }]) }, [_c(__unplugin_components_2, { attrs: { "dense": "" } }, _vm._l(_vm.items, function(item) {
    return _c(__unplugin_components_3, { key: item.id, attrs: { "disabled": item.disabled, "data-action": item.id }, on: { "click": function($event) {
      return _vm.$emit("action", item.id);
    } } }, [_c(__unplugin_components_4, { class: { "error--text": item.danger } }, [_vm._v(" " + _vm._s(item.label) + " ")])], 1);
  }), 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/jobs/JobMenu.vue?vue&type=style&index=0&scoped=123fddba&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "123fddba",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/jobs/JobMenu.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBb0NBO0FBZ0JBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQSxFQUlBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTNDQTtBQUFBLEVBREE7QUFBQSxHQURBLFFBRUE7QUFHQTtBQUFBO0dBTEEsUUFLQTtBQUdBO0FBQUE7R0FSQSxRQVFBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FYQSxRQVlBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FmQSxRQWdCQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBbkJBLFFBb0JBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0F2QkEsUUF3QkE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQTNCQSxRQTRCQTtBQTVCQTtBQUFBO0FBQUEiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkpvYk1lbnUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtbWVudVxuICAgIG9mZnNldC15XG4gICAgbGVmdFxuICA+XG4gICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImpvYi1tZW51XCJcbiAgICAgICAgOmNsYXNzPVwieyAnam9iLW1lbnUtLWJ1dHRvbic6IGJ1dHRvbiB9XCJcbiAgICAgICAgOmFyaWEtbGFiZWw9XCJgT3B0aW9ucyBmb3IgJHtsYWJlbH1gXCJcbiAgICAgICAgZGF0YS10aWQ9XCJqb2ItbWVudVwiXG4gICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgQGNsaWNrLnN0b3BcbiAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1vcmVcIiAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cbiAgICA8di1saXN0IGRlbnNlPlxuICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgIHYtZm9yPVwiaXRlbSBpbiBpdGVtc1wiXG4gICAgICAgIDprZXk9XCJpdGVtLmlkXCJcbiAgICAgICAgOmRpc2FibGVkPVwiaXRlbS5kaXNhYmxlZFwiXG4gICAgICAgIDpkYXRhLWFjdGlvbj1cIml0ZW0uaWRcIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnYWN0aW9uJywgaXRlbS5pZClcIlxuICAgICAgPlxuICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGUgOmNsYXNzPVwieyAnZXJyb3ItLXRleHQnOiBpdGVtLmRhbmdlciB9XCI+XG4gICAgICAgICAge3sgaXRlbS5sYWJlbCB9fVxuICAgICAgICA8L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICA8L3YtbGlzdD5cbiAgPC92LW1lbnU+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5leHBvcnQgdHlwZSBKb2JNZW51QWN0aW9uID0gJ3ByaW50JyB8ICdxdWV1ZScgfCAncHJldmlldycgfCAnZG93bmxvYWQnIHwgJ3JlbmFtZScgfCAnbW92ZScgfCAnZGVsZXRlJ1xuXG5pbnRlcmZhY2UgTWVudUl0ZW0ge1xuICBpZDogSm9iTWVudUFjdGlvbjtcbiAgbGFiZWw6IHN0cmluZztcbiAgZGlzYWJsZWQ/OiBib29sZWFuO1xuICBkYW5nZXI/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRoZSDCt8K3wrcgb24gYSBmaWxlIG9yIGZvbGRlcjogZXZlcnl0aGluZyB0aGF0IGNhbiBiZSBkb25lIHRvIHRoZSBpdGVtLFxuICogc28gbm90aGluZyB3YWl0cyBvbiBhIGhvdmVyLiBUaGUgZmlsZSB0aGF0IGlzIHByaW50aW5nIHN0YXlzIHdoZXJlIGl0XG4gKiBpcywgc28gaXQgY2FuJ3QgYmUgcmVuYW1lZCwgbW92ZWQgb3IgZGVsZXRlZC5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEpvYk1lbnUgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ2ZpbGUnIH0pXG4gIHJlYWRvbmx5IGtpbmQhOiAnZmlsZScgfCAnZm9sZGVyJ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBsYWJlbCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBwcmludGluZz86IGJvb2xlYW5cblxuICAvKiogVGhlIHByaW50ZXIgaXMgYnVzeSBhbmQgaGFzIGEgcXVldWU6IFByaW50IGJlY29tZXMgQWRkIHRvIHF1ZXVlLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgcXVldWVpbmc/OiBib29sZWFuXG5cbiAgLyoqIFRoZSBwcmludGVyIGNhbid0IGJlIHRvbGQgYW55dGhpbmcgbm93LiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbG9ja2VkPzogYm9vbGVhblxuXG4gIC8qKiBBIHJvdW5kIGJ1dHRvbiBvZiBpdHMgb3duICh0aGUgZGV0YWlsIHRpbGUncyksIG5vdCBhIHRhYmxlIGNlbGwncy4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGJ1dHRvbj86IGJvb2xlYW5cblxuICAvKiogTGVhdmUgb3V0IFByaW50OiB0aGUgZGV0YWlsIHRpbGUgYW5kIHRoZSBzdGlja3kgYmFyIGhhdmUgaXQgYmVzaWRlIHRoZSBtZW51LiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbm9QcmludD86IGJvb2xlYW5cblxuICAvKiogTGVhdmUgb3V0IFByZXZpZXc6IHRoZSBkZXRhaWwgdGlsZSBoYXMgaXQgYmVzaWRlIHRoZSBtZW51LiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbm9QcmV2aWV3PzogYm9vbGVhblxuXG4gIGdldCBpdGVtcyAoKTogTWVudUl0ZW1bXSB7XG4gICAgY29uc3QgaGVsZCA9ICEhdGhpcy5wcmludGluZ1xuICAgIGNvbnN0IGl0ZW1zOiBNZW51SXRlbVtdID0gW11cbiAgICBpZiAodGhpcy5raW5kID09PSAnZmlsZScpIHtcbiAgICAgIGlmICghdGhpcy5ub1ByaW50KSB7XG4gICAgICAgIGl0ZW1zLnB1c2goeyBpZDogdGhpcy5xdWV1ZWluZyA/ICdxdWV1ZScgOiAncHJpbnQnLCBsYWJlbDogdGhpcy5xdWV1ZWluZyA/ICdBZGQgdG8gcXVldWUnIDogJ1ByaW50JywgZGlzYWJsZWQ6IHRoaXMubG9ja2VkIHx8IChoZWxkICYmICF0aGlzLnF1ZXVlaW5nKSB9KVxuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLm5vUHJldmlldykgaXRlbXMucHVzaCh7IGlkOiAncHJldmlldycsIGxhYmVsOiAnUHJldmlldycgfSlcbiAgICAgIGl0ZW1zLnB1c2goeyBpZDogJ2Rvd25sb2FkJywgbGFiZWw6ICdEb3dubG9hZCcgfSlcbiAgICB9XG4gICAgaXRlbXMucHVzaCh7IGlkOiAncmVuYW1lJywgbGFiZWw6ICdSZW5hbWUnLCBkaXNhYmxlZDogdGhpcy5sb2NrZWQgfHwgaGVsZCB9KVxuICAgIGl0ZW1zLnB1c2goeyBpZDogJ21vdmUnLCBsYWJlbDogJ01vdmUgdG/igKYnLCBkaXNhYmxlZDogdGhpcy5sb2NrZWQgfHwgaGVsZCB9KVxuICAgIGl0ZW1zLnB1c2goeyBpZDogJ2RlbGV0ZScsIGxhYmVsOiAnRGVsZXRlJywgZGlzYWJsZWQ6IHRoaXMubG9ja2VkIHx8IGhlbGQsIGRhbmdlcjogdHJ1ZSB9KVxuICAgIHJldHVybiBpdGVtc1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuam9iLW1lbnUge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDM2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB9XG4gIH1cblxuICAuam9iLW1lbnUtLWJ1dHRvbiB7XG4gICAgd2lkdGg6IDQwcHg7XG4gICAgaGVpZ2h0OiA0MHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9qb2JzL0pvYk1lbnUudnVlIn0=