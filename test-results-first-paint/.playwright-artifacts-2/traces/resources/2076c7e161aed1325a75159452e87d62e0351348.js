/* unplugin-vue-components disabled */import { VBtn as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSnackbar as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemSubtitle as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import PrinterEntriesMixin from "/src/mixins/printer-entries.ts";
import { activationState } from "/src/services/muon-cloud/activate.ts";
import { lookForPrinters } from "/src/services/muon-cloud/discovery.ts";
import { afterFirstPaint } from "/src/services/startup/idle.ts";
const PAGE_ACTIONS = ["connect-local", "connect-cloud", "connect-bluetooth", "retry-bluetooth", "access"];
let PrinterPageMenu = class extends Mixins(PrinterEntriesMixin) {
  /** The printer this page is on: the account's, or one reached locally. */
  get entry() {
    const d = this.directory;
    return d.cloud.find((e) => e.active) ?? d.local.find((e) => e.active) ?? null;
  }
  /** The local network is searched when the menu opens, and on page load, not only once a session is open (KAN-2487). */
  look() {
    lookForPrinters().catch(() => {
    });
  }
  mounted() {
    afterFirstPaint(() => this.look());
  }
  get actions() {
    return this.entry ? this.actionsFor(this.entry).filter((a) => PAGE_ACTIONS.includes(a.id)) : [];
  }
  get message() {
    return this.notice ?? activationState.error ?? "";
  }
  clearMessage() {
    this.notice = null;
    activationState.error = null;
  }
};
PrinterPageMenu = __decorateClass([
  Component({})
], PrinterPageMenu);
const _sfc_main = PrinterPageMenu;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.entry && _vm.actions.length ? _c("div", { staticClass: "page-menu", attrs: { "data-tid": "printer-page-menu" } }, [_c(__unplugin_components_0, { attrs: { "left": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "page-menu__button", attrs: { "type": "button", "aria-label": `Options for ${_vm.entry.name}`, "data-tid": "printer-page-menu-button" }, on: { "click": _vm.look } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "more" } })], 1)];
  } }], null, false, 393305630) }, [_c(__unplugin_components_2, { attrs: { "dense": "" } }, _vm._l(_vm.actions, function(a) {
    return _c(__unplugin_components_3, { key: a.id, attrs: { "disabled": a.disabled, "data-action": a.id }, on: { "click": function($event) {
      return _vm.onAction(_vm.entry, a.id);
    } } }, [_c(__unplugin_components_4, { staticClass: "mr-3" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v(" " + _vm._s(a.icon) + " ")])], 1), _c(__unplugin_components_6, [_c(__unplugin_components_7, [_vm._v(_vm._s(a.label))]), a.hint ? _c(__unplugin_components_8, [_vm._v(" " + _vm._s(a.hint) + " ")]) : _vm._e()], 1)], 1);
  }), 1)], 1), _c(__unplugin_components_9, { attrs: { "value": !!_vm.message, "timeout": -1, "color": "surface", "data-tid": "printer-page-menu-note" }, on: { "input": _vm.clearMessage }, scopedSlots: _vm._u([{ key: "action", fn: function({ attrs }) {
    return [_c(__unplugin_components_10, _vm._b({ attrs: { "text": "" }, on: { "click": _vm.clearMessage } }, "v-btn", attrs, false), [_vm._v(" Close ")])];
  } }], null, false, 2638835875) }, [_vm._v(" " + _vm._s(_vm.message) + " ")])], 1) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/overview/PrinterPageMenu.vue?vue&type=style&index=0&scoped=5fbb9f7c&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5fbb9f7c",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/overview/PrinterPageMenu.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFJQTtBQVFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBNUJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlByaW50ZXJQYWdlTWVudS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgdi1pZj1cImVudHJ5ICYmIGFjdGlvbnMubGVuZ3RoXCJcbiAgICBjbGFzcz1cInBhZ2UtbWVudVwiXG4gICAgZGF0YS10aWQ9XCJwcmludGVyLXBhZ2UtbWVudVwiXG4gID5cbiAgICA8di1tZW51XG4gICAgICBsZWZ0XG4gICAgICBvZmZzZXQteVxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJwYWdlLW1lbnVfX2J1dHRvblwiXG4gICAgICAgICAgOmFyaWEtbGFiZWw9XCJgT3B0aW9ucyBmb3IgJHtlbnRyeS5uYW1lfWBcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicHJpbnRlci1wYWdlLW1lbnUtYnV0dG9uXCJcbiAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgICBAY2xpY2s9XCJsb29rXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJtb3JlXCIgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHYtbGlzdCBkZW5zZT5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgdi1mb3I9XCJhIGluIGFjdGlvbnNcIlxuICAgICAgICAgIDprZXk9XCJhLmlkXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJhLmRpc2FibGVkXCJcbiAgICAgICAgICA6ZGF0YS1hY3Rpb249XCJhLmlkXCJcbiAgICAgICAgICBAY2xpY2s9XCJvbkFjdGlvbihlbnRyeSwgYS5pZClcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtbGlzdC1pdGVtLWljb24gY2xhc3M9XCJtci0zXCI+XG4gICAgICAgICAgICA8di1pY29uIHNtYWxsPlxuICAgICAgICAgICAgICB7eyBhLmljb24gfX1cbiAgICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgIDwvdi1saXN0LWl0ZW0taWNvbj5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tY29udGVudD5cbiAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT57eyBhLmxhYmVsIH19PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1zdWJ0aXRsZSB2LWlmPVwiYS5oaW50XCI+XG4gICAgICAgICAgICAgIHt7IGEuaGludCB9fVxuICAgICAgICAgICAgPC92LWxpc3QtaXRlbS1zdWJ0aXRsZT5cbiAgICAgICAgICA8L3YtbGlzdC1pdGVtLWNvbnRlbnQ+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICA8L3YtbGlzdD5cbiAgICA8L3YtbWVudT5cbiAgICA8di1zbmFja2JhclxuICAgICAgOnZhbHVlPVwiISFtZXNzYWdlXCJcbiAgICAgIDp0aW1lb3V0PVwiLTFcIlxuICAgICAgY29sb3I9XCJzdXJmYWNlXCJcbiAgICAgIGRhdGEtdGlkPVwicHJpbnRlci1wYWdlLW1lbnUtbm90ZVwiXG4gICAgICBAaW5wdXQ9XCJjbGVhck1lc3NhZ2VcIlxuICAgID5cbiAgICAgIHt7IG1lc3NhZ2UgfX1cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aW9uPVwieyBhdHRycyB9XCI+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHRleHRcbiAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgQGNsaWNrPVwiY2xlYXJNZXNzYWdlXCJcbiAgICAgICAgPlxuICAgICAgICAgIENsb3NlXG4gICAgICAgIDwvdi1idG4+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvdi1zbmFja2Jhcj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFByaW50ZXJFbnRyaWVzTWl4aW4gZnJvbSAnQC9taXhpbnMvcHJpbnRlci1lbnRyaWVzJ1xuaW1wb3J0IHsgYWN0aXZhdGlvblN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FjdGl2YXRlJ1xuaW1wb3J0IHsgbG9va0ZvclByaW50ZXJzIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2Rpc2NvdmVyeSdcbmltcG9ydCB7IGFmdGVyRmlyc3RQYWludCB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9pZGxlJ1xuaW1wb3J0IHR5cGUgeyBDYXJkQWN0aW9uLCBEaXJlY3RvcnlFbnRyeSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXJlY3RvcnknXG5cbi8qKiBXaGF0IHRoZSBwcmludGVyJ3Mgb3duIHBhZ2Ugb2ZmZXJzIGZyb20gaXRzIG1lbnU6IHRoZSByb3V0ZXMgaXQgaXMgbm90IG9uLCBSZXRyeSBCbHVldG9vdGgsIGFuZCBpdHMgYWNjZXNzIHNldHRpbmdzLiAqL1xuY29uc3QgUEFHRV9BQ1RJT05TID0gWydjb25uZWN0LWxvY2FsJywgJ2Nvbm5lY3QtY2xvdWQnLCAnY29ubmVjdC1ibHVldG9vdGgnLCAncmV0cnktYmx1ZXRvb3RoJywgJ2FjY2VzcyddXG5cbi8qKlxuICogVGhlIHRocmVlLWRvdCBtZW51IG9uIGEgcHJpbnRlcidzIG93biBwYWdlIChLQU4tMTQyOSkuIEl0IGxpc3RzIHRoZSBzYW1lXG4gKiBpdGVtcyB0aGUgcHJpbnRlcidzIGNhcmQgZG9lcywgZnJvbSB0aGUgc2FtZSBydWxlcyBhbmQgaGFuZGxlcnMgaW5cbiAqIFByaW50ZXJFbnRyaWVzTWl4aW4sIGZvciB0aGUgcHJpbnRlciB0aGlzIHBhZ2UgaXMgb24uXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmludGVyUGFnZU1lbnUgZXh0ZW5kcyBNaXhpbnMoUHJpbnRlckVudHJpZXNNaXhpbikge1xuICAvKiogVGhlIHByaW50ZXIgdGhpcyBwYWdlIGlzIG9uOiB0aGUgYWNjb3VudCdzLCBvciBvbmUgcmVhY2hlZCBsb2NhbGx5LiAqL1xuICBnZXQgZW50cnkgKCk6IERpcmVjdG9yeUVudHJ5IHwgbnVsbCB7XG4gICAgY29uc3QgZCA9IHRoaXMuZGlyZWN0b3J5XG4gICAgcmV0dXJuIGQuY2xvdWQuZmluZChlID0+IGUuYWN0aXZlKSA/PyBkLmxvY2FsLmZpbmQoZSA9PiBlLmFjdGl2ZSkgPz8gbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBsb2NhbCBuZXR3b3JrIGlzIHNlYXJjaGVkIHdoZW4gdGhlIG1lbnUgb3BlbnMsIGFuZCBvbiBwYWdlIGxvYWQsIG5vdCBvbmx5IG9uY2UgYSBzZXNzaW9uIGlzIG9wZW4gKEtBTi0yNDg3KS4gKi9cbiAgbG9vayAoKSB7XG4gICAgbG9va0ZvclByaW50ZXJzKCkuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICBhZnRlckZpcnN0UGFpbnQoKCkgPT4gdGhpcy5sb29rKCkpXG4gIH1cblxuICBnZXQgYWN0aW9ucyAoKTogQ2FyZEFjdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyeSA/IHRoaXMuYWN0aW9uc0Zvcih0aGlzLmVudHJ5KS5maWx0ZXIoYSA9PiBQQUdFX0FDVElPTlMuaW5jbHVkZXMoYS5pZCkpIDogW11cbiAgfVxuXG4gIGdldCBtZXNzYWdlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm5vdGljZSA/PyBhY3RpdmF0aW9uU3RhdGUuZXJyb3IgPz8gJydcbiAgfVxuXG4gIGNsZWFyTWVzc2FnZSAoKSB7XG4gICAgdGhpcy5ub3RpY2UgPSBudWxsXG4gICAgYWN0aXZhdGlvblN0YXRlLmVycm9yID0gbnVsbFxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucGFnZS1tZW51X19idXR0b24ge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDM2cHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcblxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyKTtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9vdmVydmlldy9QcmludGVyUGFnZU1lbnUudnVlIn0=