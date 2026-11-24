/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import MacrosMixin, {} from "/src/mixins/macros.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let ConsoleMacros = class extends Mixins(MacrosMixin) {
  locked;
  busy;
  get macros() {
    return this.arrangedMacros;
  }
  get top() {
    return this.topMacroList(3);
  }
  get allLink() {
    return scopedPath("/control", activeSlug());
  }
  disabled(m) {
    return this.locked || m.disabledWhilePrinting && this.busy;
  }
};
__decorateClass([
  Prop({ type: Boolean, default: false })
], ConsoleMacros.prototype, "locked", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], ConsoleMacros.prototype, "busy", 2);
ConsoleMacros = __decorateClass([
  Component({})
], ConsoleMacros);
const _sfc_main = ConsoleMacros;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "cmac", attrs: { "data-tid": "console-macros" } }, [_c("header", { staticClass: "cmac__head" }, [_c("h2", [_c(__unplugin_components_0, { attrs: { "name": "console" } }), _vm._v(" Quick commands")], 1), _c("a", { staticClass: "cmac__all", attrs: { "href": _vm.allLink }, on: { "click": function($event) {
    $event.preventDefault();
    return _vm.$router.push(_vm.allLink);
  } } }, [_vm._v("All " + _vm._s(_vm.macros.length))])]), _vm.top.length ? _c("ul", { staticClass: "cmac__list" }, _vm._l(_vm.top, function(m) {
    return _c("li", { key: m.name }, [_c("button", { attrs: { "type": "button", "disabled": _vm.disabled(m), "title": m.description || m.name, "data-tid": `console-macro-${m.name}` }, on: { "click": function($event) {
      return _vm.$emit("run", m);
    } } }, [_c("span", { staticClass: "cmac__name" }, [_vm._v(_vm._s(m.name))]), _c(__unplugin_components_1, { attrs: { "name": "chevronRight", "small": "" } })], 1)]);
  }), 0) : _c("p", { staticClass: "cmac__none" }, [_vm._v(" This printer has no macros to show. ")])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/console/ConsoleMacros.vue?vue&type=style&index=0&scoped=cb85b55f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "cb85b55f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/console/ConsoleMacros.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBOENBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVZBO0FBQUE7QUFBQSxHQURBLGNBQ0E7QUFDQTtBQUFBO0FBQUEsR0FGQSxjQUVBO0FBRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29uc29sZU1hY3Jvcy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvblxuICAgIGNsYXNzPVwiY21hY1wiXG4gICAgZGF0YS10aWQ9XCJjb25zb2xlLW1hY3Jvc1wiXG4gID5cbiAgICA8aGVhZGVyIGNsYXNzPVwiY21hY19faGVhZFwiPlxuICAgICAgPGgyPjxmcmFtZS1pY29uIG5hbWU9XCJjb25zb2xlXCIgLz4gUXVpY2sgY29tbWFuZHM8L2gyPlxuICAgICAgPGFcbiAgICAgICAgY2xhc3M9XCJjbWFjX19hbGxcIlxuICAgICAgICA6aHJlZj1cImFsbExpbmtcIlxuICAgICAgICBAY2xpY2sucHJldmVudD1cIiRyb3V0ZXIucHVzaChhbGxMaW5rKVwiXG4gICAgICA+QWxsIHt7IG1hY3Jvcy5sZW5ndGggfX08L2E+XG4gICAgPC9oZWFkZXI+XG4gICAgPHVsXG4gICAgICB2LWlmPVwidG9wLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cImNtYWNfX2xpc3RcIlxuICAgID5cbiAgICAgIDxsaVxuICAgICAgICB2LWZvcj1cIm0gaW4gdG9wXCJcbiAgICAgICAgOmtleT1cIm0ubmFtZVwiXG4gICAgICA+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJkaXNhYmxlZChtKVwiXG4gICAgICAgICAgOnRpdGxlPVwibS5kZXNjcmlwdGlvbiB8fCBtLm5hbWVcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBjb25zb2xlLW1hY3JvLSR7bS5uYW1lfWBcIlxuICAgICAgICAgIEBjbGljaz1cIiRlbWl0KCdydW4nLCBtKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImNtYWNfX25hbWVcIj57eyBtLm5hbWUgfX08L3NwYW4+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJjaGV2cm9uUmlnaHRcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvbGk+XG4gICAgPC91bD5cbiAgICA8cFxuICAgICAgdi1lbHNlXG4gICAgICBjbGFzcz1cImNtYWNfX25vbmVcIlxuICAgID5cbiAgICAgIFRoaXMgcHJpbnRlciBoYXMgbm8gbWFjcm9zIHRvIHNob3cuXG4gICAgPC9wPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1hY3Jvc01peGluLCB7IHR5cGUgU2hvd25NYWNybyB9IGZyb20gJ0AvbWl4aW5zL21hY3JvcydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcblxuLyoqIEEgc2hvcnQgbGlzdCBvZiB0aGUgbWFjcm9zIHlvdSdkIHJlYWNoIGZvci4gVGFwcGluZyBvbmUgcnVucyBpdCwgb3IsIGlmIGl0IG5lZWRzIHZhbHVlcywgcHV0cyBpdCBpbiB0aGUgbGluZSB0byBmaWxsIGluLiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnNvbGVNYWNyb3MgZXh0ZW5kcyBNaXhpbnMoTWFjcm9zTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9KSByZWFkb25seSBsb2NrZWQhOiBib29sZWFuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogZmFsc2UgfSkgcmVhZG9ubHkgYnVzeSE6IGJvb2xlYW5cblxuICBnZXQgbWFjcm9zICgpOiBTaG93bk1hY3JvW10geyByZXR1cm4gdGhpcy5hcnJhbmdlZE1hY3JvcyB9XG4gIGdldCB0b3AgKCk6IFNob3duTWFjcm9bXSB7IHJldHVybiB0aGlzLnRvcE1hY3JvTGlzdCgzKSB9XG4gIGdldCBhbGxMaW5rICgpOiBzdHJpbmcgeyByZXR1cm4gc2NvcGVkUGF0aCgnL2NvbnRyb2wnLCBhY3RpdmVTbHVnKCkpIH1cblxuICBkaXNhYmxlZCAobTogU2hvd25NYWNybyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxvY2tlZCB8fCAobS5kaXNhYmxlZFdoaWxlUHJpbnRpbmcgJiYgdGhpcy5idXN5KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuY21hYyB7XG4gICAgcGFkZGluZzogMThweDtcbiAgICBib3JkZXItcmFkaXVzOiAyMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgfVxuXG4gIC5jbWFjX19oZWFkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIG1hcmdpbi1ib3R0b206IDEycHg7XG5cbiAgICBoMiB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIGdhcDogMTBweDtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgfVxuICB9XG5cbiAgLmNtYWNfX2FsbCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpICFpbXBvcnRhbnQ7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgfVxuXG4gIC5jbWFjX19saXN0IHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcblxuICAgIGxpICsgbGkgeyBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7IH1cblxuICAgIGJ1dHRvbiB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgbWluLWhlaWdodDogNTJweDtcbiAgICAgIHBhZGRpbmc6IDAgMTZweDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgdGV4dC1hbGlnbjogbGVmdDtcblxuICAgICAgJjpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNDU7IH1cbiAgICB9XG4gIH1cblxuICAuY21hY19fbmFtZSB7IGZsZXg6IDEgMSBhdXRvOyBtaW4td2lkdGg6IDA7IG92ZXJmbG93OiBoaWRkZW47IHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzOyB9XG4gIC5jbWFjX19ub25lIHsgbWFyZ2luOiAwOyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXNpemU6IDE0cHg7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb25zb2xlL0NvbnNvbGVNYWNyb3MudnVlIn0=