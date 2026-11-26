/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_3 from "/src/components/ui/AppBtn.vue";
import { VTooltip as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppBtn.vue";
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
let AppSaveConfigAndRestartBtn = class extends Vue {
  disabled;
  loading;
  get isExpanded() {
    return this.$vuetify.breakpoint.mdAndUp;
  }
};
__decorateClass([
  Prop({ type: Boolean })
], AppSaveConfigAndRestartBtn.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppSaveConfigAndRestartBtn.prototype, "loading", 2);
AppSaveConfigAndRestartBtn = __decorateClass([
  Component({})
], AppSaveConfigAndRestartBtn);
const _sfc_main = AppSaveConfigAndRestartBtn;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.isExpanded ? _c(__unplugin_components_0, { attrs: { "color": "", "disabled": _vm.disabled, "loading": _vm.loading }, on: { "click": function($event) {
    return _vm.$emit("click");
  } } }, [_c(__unplugin_components_1, { staticClass: "mr-1", attrs: { "color": "warning" } }, [_vm._v(" $save ")]), _c("span", [_vm._v(_vm._s(_vm.$t("app.general.btn.save_config_and_restart")))])], 1) : _c(__unplugin_components_2, { attrs: { "bottom": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c(__unplugin_components_3, _vm._g(_vm._b({ attrs: { "fab": "", "small": "", "text": "", "color": "warning", "elevation": 0, "disabled": _vm.disabled, "loading": _vm.loading }, on: { "click": function($event) {
      return _vm.$emit("click");
    } } }, "app-btn", attrs, false), on), [_c(__unplugin_components_4, [_vm._v("$save")])], 1)];
  } }]) }, [_c("span", [_vm._v(_vm._s(_vm.$t("app.general.btn.save_config_and_restart")))])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppSaveConfigAndRestartBtn.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBMENBO0FBR0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVJBO0FBQUEsRUFEQTtBQUFBLEdBREEsMkJBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLDJCQUtBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwU2F2ZUNvbmZpZ0FuZFJlc3RhcnRCdG4udnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGFwcC1idG5cbiAgICB2LWlmPVwiaXNFeHBhbmRlZFwiXG4gICAgY29sb3I9XCJcIlxuICAgIDpkaXNhYmxlZD1cImRpc2FibGVkXCJcbiAgICA6bG9hZGluZz1cImxvYWRpbmdcIlxuICAgIEBjbGljaz1cIiRlbWl0KCdjbGljaycpXCJcbiAgPlxuICAgIDx2LWljb25cbiAgICAgIGNsYXNzPVwibXItMVwiXG4gICAgICBjb2xvcj1cIndhcm5pbmdcIlxuICAgID5cbiAgICAgICRzYXZlXG4gICAgPC92LWljb24+XG4gICAgPHNwYW4+e3sgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5zYXZlX2NvbmZpZ19hbmRfcmVzdGFydCcpIH19PC9zcGFuPlxuICA8L2FwcC1idG4+XG5cbiAgPHYtdG9vbHRpcFxuICAgIHYtZWxzZVxuICAgIGJvdHRvbVxuICA+XG4gICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICA8YXBwLWJ0blxuICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgIGZhYlxuICAgICAgICBzbWFsbFxuICAgICAgICB0ZXh0XG4gICAgICAgIGNvbG9yPVwid2FybmluZ1wiXG4gICAgICAgIDplbGV2YXRpb249XCIwXCJcbiAgICAgICAgOmRpc2FibGVkPVwiZGlzYWJsZWRcIlxuICAgICAgICA6bG9hZGluZz1cImxvYWRpbmdcIlxuICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnY2xpY2snKVwiXG4gICAgICA+XG4gICAgICAgIDx2LWljb24+JHNhdmU8L3YtaWNvbj5cbiAgICAgIDwvYXBwLWJ0bj5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDxzcGFuPnt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uc2F2ZV9jb25maWdfYW5kX3Jlc3RhcnQnKSB9fTwvc3Bhbj5cbiAgPC92LXRvb2x0aXA+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwU2F2ZUNvbmZpZ0FuZFJlc3RhcnRCdG4gZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZGlzYWJsZWQ/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGxvYWRpbmc/OiBib29sZWFuXG5cbiAgZ2V0IGlzRXhwYW5kZWQgKCkge1xuICAgIHJldHVybiB0aGlzLiR2dWV0aWZ5LmJyZWFrcG9pbnQubWRBbmRVcFxuICB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9BcHBTYXZlQ29uZmlnQW5kUmVzdGFydEJ0bi52dWUifQ==