/* unplugin-vue-components disabled */import { VBtn as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let AppBtn = class extends Vue {
  get classes() {
    if (this.$attrs.fab === void 0 && this.$attrs.icon === void 0 && this.$attrs.outlined === void 0 && this.$attrs.text === void 0 && this.$attrs.color === "primary") {
      return { "grey--text text--darken-3": !this.colorIsDark };
    }
  }
  get colorIsDark() {
    const color = this.$vuetify.theme.currentTheme[this.$attrs.color]?.toString() ?? "";
    return this.$filters.isColorDark(color);
  }
  get attrs() {
    let attrs = this.$attrs;
    if (attrs.color === void 0) {
      attrs = {
        ...attrs,
        color: "btncolor"
      };
    }
    return attrs;
  }
};
AppBtn = __decorateClass([
  Component({})
], AppBtn);
const _sfc_main = AppBtn;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, _vm._g(_vm._b({ class: _vm.classes }, "v-btn", _vm.attrs, false), _vm.$listeners), [_vm._t("default")], 2);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppBtn.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFXQTtBQUdBO0FBQUEsRUFDQTtBQUlBLFFBQ0EsOEJBQ0EsK0JBQ0EsbUNBQ0EsK0JBQ0EsaUNBQ0E7QUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWpDQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHBCdG4udnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtYnRuXG4gICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgIDpjbGFzcz1cImNsYXNzZXNcIlxuICAgIHYtb249XCIkbGlzdGVuZXJzXCJcbiAgPlxuICAgIDxzbG90IC8+XG4gIDwvdi1idG4+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwQnRuIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IGNsYXNzZXMgKCkge1xuICAgIC8vIE9ubHkgYXBwbHkgdGhlIHRleHQgY2hhbmdlIGlmIHRoaXMgaXNuJ3Q7XG4gICAgLy8gLSBhbiBpY29uLCBmYWIsIG91dGxpbmVkIG9yIHRleHQgYnV0dG9uIGFuZFxuICAgIC8vIGl0J3MgdGhlIHByaW1hcnkgY29sb3IuXG4gICAgaWYgKFxuICAgICAgdGhpcy4kYXR0cnMuZmFiID09PSB1bmRlZmluZWQgJiZcbiAgICAgIHRoaXMuJGF0dHJzLmljb24gPT09IHVuZGVmaW5lZCAmJlxuICAgICAgdGhpcy4kYXR0cnMub3V0bGluZWQgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgdGhpcy4kYXR0cnMudGV4dCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICB0aGlzLiRhdHRycy5jb2xvciA9PT0gJ3ByaW1hcnknXG4gICAgKSB7XG4gICAgICAvLyBJZiB0aGUgY29sb3Igb2YgdGhlIGJ0biBpc24ndCBkYXJrIChpLmUuLCBsaWdodCkgdGhlbiBkYXJrZW4gdGhlIHRleHQuXG4gICAgICByZXR1cm4geyAnZ3JleS0tdGV4dCB0ZXh0LS1kYXJrZW4tMyc6ICF0aGlzLmNvbG9ySXNEYXJrIH1cbiAgICB9XG4gIH1cblxuICBnZXQgY29sb3JJc0RhcmsgKCkge1xuICAgIGNvbnN0IGNvbG9yID0gdGhpcy4kdnVldGlmeS50aGVtZS5jdXJyZW50VGhlbWVbdGhpcy4kYXR0cnMuY29sb3JdPy50b1N0cmluZygpID8/ICcnXG5cbiAgICByZXR1cm4gdGhpcy4kZmlsdGVycy5pc0NvbG9yRGFyayhjb2xvcilcbiAgfVxuXG4gIGdldCBhdHRycyAoKSB7XG4gICAgbGV0IGF0dHJzID0gdGhpcy4kYXR0cnNcbiAgICBpZiAoYXR0cnMuY29sb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXR0cnMgPSB7XG4gICAgICAgIC4uLmF0dHJzLFxuICAgICAgICBjb2xvcjogJ2J0bmNvbG9yJ1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXR0cnNcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9BcHBCdG4udnVlIn0=