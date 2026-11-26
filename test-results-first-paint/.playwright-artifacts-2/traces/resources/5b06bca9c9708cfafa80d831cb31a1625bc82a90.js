/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { Component, Vue, Prop, Ref, Watch, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import iro from "/.vite-e2e/4291/deps/@jaames_iro.js?v=9b9fafc7";
import { IroColor } from "/.vite-e2e/4291/deps/@irojs_iro-core.js?v=9b9fafc7";
let AppColorPicker = class extends Vue {
  inputValue;
  options;
  picker;
  colorPicker = null;
  onValue(value) {
    if (value && this.colorPicker) {
      this.colorPicker.color.set(value);
    }
  }
  mounted() {
    const options = {
      ...this.options,
      color: this.inputValue,
      sliderSize: 14
    };
    this.colorPicker = iro.ColorPicker(this.picker, options);
    this.colorPicker.on("input:end", this.handleColorChange);
  }
  beforeUnmount() {
    if (this.colorPicker) {
      this.colorPicker.off("input:end", this.handleColorChange);
    }
  }
  handleColorChange(color) {
    this.inputValue = color.hexString;
  }
};
__decorateClass([
  VModel({ type: String, default: "#ffffff" })
], AppColorPicker.prototype, "inputValue", 2);
__decorateClass([
  Prop({ type: Object })
], AppColorPicker.prototype, "options", 2);
__decorateClass([
  Ref("picker")
], AppColorPicker.prototype, "picker", 2);
__decorateClass([
  Watch("value")
], AppColorPicker.prototype, "onValue", 1);
AppColorPicker = __decorateClass([
  Component({})
], AppColorPicker);
const _sfc_main = AppColorPicker;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_c("div", { ref: "picker" })]);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppIroColorPicker.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQU9BO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBdENBO0FBQUEsRUFEQTtBQUFBLEdBREEsZUFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsZUFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZUFRQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBWkEsZUFhQTtBQWJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFwcElyb0NvbG9yUGlja2VyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXY+XG4gICAgPGRpdiByZWY9XCJwaWNrZXJcIiAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSwgUHJvcCwgUmVmLCBXYXRjaCwgVk1vZGVsIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBpcm8gZnJvbSAnQGphYW1lcy9pcm8nXG5pbXBvcnQgeyBJcm9Db2xvciB9IGZyb20gJ0Bpcm9qcy9pcm8tY29yZSdcbmltcG9ydCB0eXBlIHsgQ29sb3JQaWNrZXJQcm9wcywgSXJvQ29sb3JQaWNrZXIgfSBmcm9tICdAamFhbWVzL2lyby9kaXN0L0NvbG9yUGlja2VyJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwQ29sb3JQaWNrZXIgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnI2ZmZmZmZicgfSlcbiAgICBpbnB1dFZhbHVlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QgfSlcbiAgcmVhZG9ubHkgb3B0aW9ucz86IFBhcnRpYWw8Q29sb3JQaWNrZXJQcm9wcz5cblxuICBAUmVmKCdwaWNrZXInKVxuICByZWFkb25seSBwaWNrZXIhOiBIVE1MRWxlbWVudFxuXG4gIGNvbG9yUGlja2VyOiBJcm9Db2xvclBpY2tlciB8IG51bGwgPSBudWxsXG5cbiAgQFdhdGNoKCd2YWx1ZScpXG4gIG9uVmFsdWUgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAodmFsdWUgJiYgdGhpcy5jb2xvclBpY2tlcikge1xuICAgICAgdGhpcy5jb2xvclBpY2tlci5jb2xvci5zZXQodmFsdWUpXG4gICAgfVxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgY29uc3Qgb3B0aW9uczogUGFydGlhbDxDb2xvclBpY2tlclByb3BzPiA9IHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIGNvbG9yOiB0aGlzLmlucHV0VmFsdWUsXG4gICAgICBzbGlkZXJTaXplOiAxNFxuICAgIH1cblxuICAgIHRoaXMuY29sb3JQaWNrZXIgPSBpcm8uQ29sb3JQaWNrZXIodGhpcy5waWNrZXIsIG9wdGlvbnMpXG5cbiAgICB0aGlzLmNvbG9yUGlja2VyLm9uKCdpbnB1dDplbmQnLCB0aGlzLmhhbmRsZUNvbG9yQ2hhbmdlKVxuICB9XG5cbiAgYmVmb3JlVW5tb3VudCAoKSB7XG4gICAgaWYgKHRoaXMuY29sb3JQaWNrZXIpIHtcbiAgICAgIHRoaXMuY29sb3JQaWNrZXIub2ZmKCdpbnB1dDplbmQnLCB0aGlzLmhhbmRsZUNvbG9yQ2hhbmdlKVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUNvbG9yQ2hhbmdlIChjb2xvcjogSXJvQ29sb3IpIHtcbiAgICB0aGlzLmlucHV0VmFsdWUgPSBjb2xvci5oZXhTdHJpbmdcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9BcHBJcm9Db2xvclBpY2tlci52dWUifQ==