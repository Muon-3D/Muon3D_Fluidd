/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VFadeTransition as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTooltip as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, VModel, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let AppTextFieldWithCopy = class extends Vue {
  inputValue;
  hasCopied = false;
  handleCopy() {
    if (this.inputValue && navigator.clipboard) {
      navigator.clipboard.writeText(this.inputValue.toString());
      this.hasCopied = true;
      setTimeout(() => {
        this.hasCopied = false;
      }, 2e3);
    }
  }
};
__decorateClass([
  VModel()
], AppTextFieldWithCopy.prototype, "inputValue", 2);
AppTextFieldWithCopy = __decorateClass([
  Component({})
], AppTextFieldWithCopy);
const _sfc_main = AppTextFieldWithCopy;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, _vm._g(_vm._b({ staticClass: "app-text-field", scopedSlots: _vm._u([{ key: "append-outer", fn: function() {
    return [_c(__unplugin_components_1, { attrs: { "close-delay": _vm.hasCopied ? 2e3 : void 0, "open-on-focus": false, "bottom": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
      return [_c(__unplugin_components_2, _vm._g(_vm._b({ staticClass: "btn-copy", attrs: { "icon": "", "text": "" }, on: { "click": _vm.handleCopy } }, "v-btn", attrs, false), on), [_c(__unplugin_components_3, { attrs: { "leave-absolute": "" } }, [_c(__unplugin_components_4, { key: _vm.hasCopied, staticClass: "icon-copy" }, [_vm._v(" " + _vm._s(_vm.hasCopied ? "$check" : "$contentCopy") + " ")])], 1)], 1)];
    } }]) }, [_c("span", [_vm._v(_vm._s(_vm.hasCopied ? _vm.$t("app.general.btn.copied") : _vm.$t("app.general.btn.copy")))])])];
  }, proxy: true }]), model: { value: _vm.inputValue, callback: function($$v) {
    _vm.inputValue = $$v;
  }, expression: "inputValue" } }, "v-text-field", _vm.$attrs, false), _vm.$listeners));
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/AppTextFieldWithCopy.vue?vue&type=style&index=0&scoped=5261410b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5261410b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppTextFieldWithCopy.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBdUNBO0FBR0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQSxRQUNBLG1CQUNBLHFCQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWxCQTtBQUFBLEVBREE7QUFBQSxHQURBLHFCQUVBO0FBRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwVGV4dEZpZWxkV2l0aENvcHkudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtdGV4dC1maWVsZFxuICAgIHYtbW9kZWw9XCJpbnB1dFZhbHVlXCJcbiAgICB2LWJpbmQ9XCIkYXR0cnNcIlxuICAgIGNsYXNzPVwiYXBwLXRleHQtZmllbGRcIlxuICAgIHYtb249XCIkbGlzdGVuZXJzXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSAjYXBwZW5kLW91dGVyPlxuICAgICAgPHYtdG9vbHRpcFxuICAgICAgICA6Y2xvc2UtZGVsYXk9XCJoYXNDb3BpZWQgPyAyMDAwIDogdW5kZWZpbmVkXCJcbiAgICAgICAgOm9wZW4tb24tZm9jdXM9XCJmYWxzZVwiXG4gICAgICAgIGJvdHRvbVxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgICAgICA8di1idG5cbiAgICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICAgIGljb25cbiAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIGNsYXNzPVwiYnRuLWNvcHlcIlxuICAgICAgICAgICAgQGNsaWNrPVwiaGFuZGxlQ29weVwiXG4gICAgICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDx2LWZhZGUtdHJhbnNpdGlvbiBsZWF2ZS1hYnNvbHV0ZT5cbiAgICAgICAgICAgICAgPHYtaWNvblxuICAgICAgICAgICAgICAgIDprZXk9XCJoYXNDb3BpZWRcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwiaWNvbi1jb3B5XCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt7IGhhc0NvcGllZCA/ICckY2hlY2snIDogJyRjb250ZW50Q29weScgfX1cbiAgICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgICA8L3YtZmFkZS10cmFuc2l0aW9uPlxuICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDxzcGFuPnt7IGhhc0NvcGllZCA/ICR0KCdhcHAuZ2VuZXJhbC5idG4uY29waWVkJykgOiAkdCgnYXBwLmdlbmVyYWwuYnRuLmNvcHknKSB9fTwvc3Bhbj5cbiAgICAgIDwvdi10b29sdGlwPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvdi10ZXh0LWZpZWxkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVk1vZGVsLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwVGV4dEZpZWxkV2l0aENvcHkgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKClcbiAgICBpbnB1dFZhbHVlITogdW5rbm93blxuXG4gIGhhc0NvcGllZCA9IGZhbHNlXG5cbiAgaGFuZGxlQ29weSAoKSB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5pbnB1dFZhbHVlICYmXG4gICAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkXG4gICAgKSB7XG4gICAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0aGlzLmlucHV0VmFsdWUudG9TdHJpbmcoKSlcblxuICAgICAgdGhpcy5oYXNDb3BpZWQgPSB0cnVlXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmhhc0NvcGllZCA9IGZhbHNlXG4gICAgICB9LCAyMDAwKVxuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmFwcC10ZXh0LWZpZWxkIHtcbiAgICAuYnRuLWNvcHkge1xuICAgICAgbWFyZ2luLXRvcDogLThweDtcbiAgICAgIG1hcmdpbi1yaWdodDogLTJweDtcbiAgICB9XG5cbiAgICAuaWNvbi1jb3B5IHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9BcHBUZXh0RmllbGRXaXRoQ29weS52dWUifQ==