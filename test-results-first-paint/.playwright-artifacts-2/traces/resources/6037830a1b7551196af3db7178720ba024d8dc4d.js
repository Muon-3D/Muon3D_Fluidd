/* unplugin-vue-components disabled */import { VCol as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCol as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VRow as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let AppSetting = class extends Vue {
  title;
  subTitle;
  help;
  accentColor;
  rCols;
  get cols() {
    return [12 - this.rCols, this.rCols];
  }
  get hasClick() {
    return this.$listeners && this.$listeners.click;
  }
  get hasSubTitle() {
    return this.$slots["sub-title"] || this.$scopedSlots["sub-title"] || this.subTitle;
  }
};
__decorateClass([
  Prop({ type: String, default: "" })
], AppSetting.prototype, "title", 2);
__decorateClass([
  Prop({ type: String })
], AppSetting.prototype, "subTitle", 2);
__decorateClass([
  Prop({ type: String })
], AppSetting.prototype, "help", 2);
__decorateClass([
  Prop({ type: String })
], AppSetting.prototype, "accentColor", 2);
__decorateClass([
  Prop({ type: Number, default: 6 })
], AppSetting.prototype, "rCols", 2);
AppSetting = __decorateClass([
  Component({})
], AppSetting);
const _sfc_main = AppSetting;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, _vm._g(_vm._b({ staticClass: "app-setting-control", class: {
    "sc-link": _vm.hasClick
  }, attrs: { "no-gutters": "" } }, "v-row", _vm.$attrs, false), _vm.$listeners), [_vm.accentColor ? _c("div", { staticClass: "sc-color", style: {
    "background-color": _vm.accentColor
  } }) : _vm._e(), _c(__unplugin_components_1, { staticClass: "sc-label text-body-1 pr-0 pr-sm-3 pb-0 pb-sm-3", attrs: { "cols": "12", "sm": _vm.cols[0], "align-self": "center" } }, [_vm._t("title", function() {
    return [_vm._v(" " + _vm._s(_vm.title) + " ")];
  }), _vm.hasSubTitle ? _c("div", { staticClass: "text-body-2 secondary--text" }, [_vm._t("sub-title", function() {
    return [_vm._v(" " + _vm._s(_vm.subTitle) + " ")];
  })], 2) : _vm._e()], 2), _c(__unplugin_components_2, { staticClass: "sc-content py-3", attrs: { "cols": "12", "sm": _vm.cols[1], "align-self": "center" } }, [_vm._t("default")], 2)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/AppSetting.vue?vue&type=style&index=0&scoped=db2af5fa&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "db2af5fa",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppSetting.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlEQTtBQUdBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSxXQUNBLDRCQUNBLGtDQUNBO0FBQUEsRUFFQTtBQUNBO0FBN0JBO0FBQUEsRUFEQTtBQUFBLEdBREEsV0FFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsV0FLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsV0FRQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBVkEsV0FXQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBYkEsV0FjQTtBQWRBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFwcFNldHRpbmcudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtcm93XG4gICAgbm8tZ3V0dGVyc1xuICAgIHYtYmluZD1cIiRhdHRyc1wiXG4gICAgOmNsYXNzPVwie1xuICAgICAgJ3NjLWxpbmsnOiBoYXNDbGlja1xuICAgIH1cIlxuICAgIGNsYXNzPVwiYXBwLXNldHRpbmctY29udHJvbFwiXG4gICAgdi1vbj1cIiRsaXN0ZW5lcnNcIlxuICA+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cImFjY2VudENvbG9yXCJcbiAgICAgIDpzdHlsZT1cIntcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiBhY2NlbnRDb2xvclxuICAgICAgfVwiXG4gICAgICBjbGFzcz1cInNjLWNvbG9yXCJcbiAgICAvPlxuXG4gICAgPHYtY29sXG4gICAgICBjb2xzPVwiMTJcIlxuICAgICAgOnNtPVwiY29sc1swXVwiXG4gICAgICBjbGFzcz1cInNjLWxhYmVsIHRleHQtYm9keS0xIHByLTAgcHItc20tMyBwYi0wIHBiLXNtLTNcIlxuICAgICAgYWxpZ24tc2VsZj1cImNlbnRlclwiXG4gICAgPlxuICAgICAgPHNsb3QgbmFtZT1cInRpdGxlXCI+XG4gICAgICAgIHt7IHRpdGxlIH19XG4gICAgICA8L3Nsb3Q+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJoYXNTdWJUaXRsZVwiXG4gICAgICAgIGNsYXNzPVwidGV4dC1ib2R5LTIgc2Vjb25kYXJ5LS10ZXh0XCJcbiAgICAgID5cbiAgICAgICAgPHNsb3QgbmFtZT1cInN1Yi10aXRsZVwiPlxuICAgICAgICAgIHt7IHN1YlRpdGxlIH19XG4gICAgICAgIDwvc2xvdD5cbiAgICAgIDwvZGl2PlxuICAgIDwvdi1jb2w+XG5cbiAgICA8di1jb2xcbiAgICAgIGNvbHM9XCIxMlwiXG4gICAgICA6c209XCJjb2xzWzFdXCJcbiAgICAgIGNsYXNzPVwic2MtY29udGVudCBweS0zXCJcbiAgICAgIGFsaWduLXNlbGY9XCJjZW50ZXJcIlxuICAgID5cbiAgICAgIDxzbG90IC8+XG4gICAgPC92LWNvbD5cbiAgPC92LXJvdz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSwgUHJvcCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHBTZXR0aW5nIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgc3ViVGl0bGUhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZyB9KVxuICByZWFkb25seSBoZWxwITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgYWNjZW50Q29sb3IhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogNiB9KVxuICByZWFkb25seSByQ29scyE6IG51bWJlclxuXG4gIGdldCBjb2xzICgpIHtcbiAgICByZXR1cm4gWzEyIC0gdGhpcy5yQ29scywgdGhpcy5yQ29sc11cbiAgfVxuXG4gIGdldCBoYXNDbGljayAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJGxpc3RlbmVycyAmJiB0aGlzLiRsaXN0ZW5lcnMuY2xpY2tcbiAgfVxuXG4gIGdldCBoYXNTdWJUaXRsZSAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuJHNsb3RzWydzdWItdGl0bGUnXSB8fFxuICAgICAgdGhpcy4kc2NvcGVkU2xvdHNbJ3N1Yi10aXRsZSddIHx8XG4gICAgICB0aGlzLnN1YlRpdGxlXG4gICAgKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuYXBwLXNldHRpbmctY29udHJvbCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgMTAwJTtcbiAgICBtaW4taGVpZ2h0OiA0OHB4O1xuICAgIG91dGxpbmU6IG5vbmU7XG4gICAgcGFkZGluZzogMCAxNnB4O1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG5cbiAgICAmLnNjLWxpbmsge1xuICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgfVxuXG4gICAgJi5zYy1saW5rOmhvdmVyOjpiZWZvcmUge1xuICAgICAgb3BhY2l0eTogMC4wODtcbiAgICB9XG5cbiAgICAmLnNjLWxpbms6OmJlZm9yZSB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBjdXJyZW50Q29sb3I7XG4gICAgICBib3R0b206IDA7XG4gICAgICBjb250ZW50OiBcIlwiO1xuICAgICAgbGVmdDogMDtcbiAgICAgIG9wYWNpdHk6IDA7XG4gICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIHJpZ2h0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgICAgdHJhbnNpdGlvbjogMC4zcyBjdWJpYy1iZXppZXIoMC4yNSwgMC44LCAwLjUsIDEpO1xuICAgIH1cblxuICAgIC5zYy1hY2NlbnQge1xuICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICBsZWZ0OiAwO1xuICAgICAgd2lkdGg6IDNweDtcbiAgICAgIGhlaWdodDogMTAwJTtcbiAgICB9XG5cbiAgICAuc2MtbGFiZWwge1xuICAgICAgcGFkZGluZzogMTJweCAwO1xuICAgIH1cblxuICAgIC5zYy1jb250ZW50IHtcbiAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgfVxuXG4gICAgLnNjLWNvbnRlbnQgLnYtaW5wdXQge1xuICAgICAgbWFyZ2luOiAwICFpbXBvcnRhbnQ7XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvQXBwU2V0dGluZy52dWUifQ==