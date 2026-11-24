/* unplugin-vue-components disabled */import { VTextField as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppDialog.vue";
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
import { Component, Vue, Prop, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let MacroCategoryDialog = class extends Vue {
  open;
  title;
  label;
  name;
  newName = "";
  get customRules() {
    return {
      uniqueName: (v) => this.categories.findIndex((c) => c.name.toLowerCase() === v.toLowerCase()) < 0 || this.$t("app.general.simple_form.error.exists")
    };
  }
  mounted() {
    this.newName = this.name;
  }
  get categories() {
    return this.$store.getters["macros/getCategories"];
  }
  handleSave() {
    this.$emit("save", this.newName);
    this.open = false;
  }
};
__decorateClass([
  VModel({ type: Boolean })
], MacroCategoryDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: String, required: true })
], MacroCategoryDialog.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, required: true })
], MacroCategoryDialog.prototype, "label", 2);
__decorateClass([
  Prop({ type: String, required: true })
], MacroCategoryDialog.prototype, "name", 2);
MacroCategoryDialog = __decorateClass([
  Component({})
], MacroCategoryDialog);
const _sfc_main = MacroCategoryDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "title": _vm.title, "max-width": "350" }, on: { "save": _vm.handleSave }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_1, [_c(__unplugin_components_2, { attrs: { "autofocus": "", "outlined": "", "label": _vm.label, "rules": [
    _vm.$rules.required,
    _vm.customRules.uniqueName
  ], "required": "" }, model: { value: _vm.newName, callback: function($$v) {
    _vm.newName = $$v;
  }, expression: "newName" } })], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/macros/MacroCategoryDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXlCQTtBQUdBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBL0JBO0FBQUEsRUFEQTtBQUFBLEdBREEsb0JBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLG9CQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxvQkFRQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBVkEsb0JBV0E7QUFYQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNYWNyb0NhdGVnb3J5RGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxhcHAtZGlhbG9nXG4gICAgdi1tb2RlbD1cIm9wZW5cIlxuICAgIDp0aXRsZT1cInRpdGxlXCJcbiAgICBtYXgtd2lkdGg9XCIzNTBcIlxuICAgIEBzYXZlPVwiaGFuZGxlU2F2ZVwiXG4gID5cbiAgICA8di1jYXJkLXRleHQ+XG4gICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgIHYtbW9kZWw9XCJuZXdOYW1lXCJcbiAgICAgICAgYXV0b2ZvY3VzXG4gICAgICAgIG91dGxpbmVkXG4gICAgICAgIDpsYWJlbD1cImxhYmVsXCJcbiAgICAgICAgOnJ1bGVzPVwiW1xuICAgICAgICAgICRydWxlcy5yZXF1aXJlZCxcbiAgICAgICAgICBjdXN0b21SdWxlcy51bmlxdWVOYW1lXG4gICAgICAgIF1cIlxuICAgICAgICByZXF1aXJlZFxuICAgICAgLz5cbiAgICA8L3YtY2FyZC10ZXh0PlxuICA8L2FwcC1kaWFsb2c+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHR5cGUgeyBNYWNyb0NhdGVnb3J5IH0gZnJvbSAnQC9zdG9yZS9tYWNyb3MvdHlwZXMnXG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSwgUHJvcCwgVk1vZGVsIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcblxuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hY3JvQ2F0ZWdvcnlEaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogQm9vbGVhbiB9KVxuICAgIG9wZW4/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IGxhYmVsITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IG5hbWUhOiBzdHJpbmdcblxuICBuZXdOYW1lID0gJydcblxuICBnZXQgY3VzdG9tUnVsZXMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1bmlxdWVOYW1lOiAodjogc3RyaW5nKSA9PiB0aGlzLmNhdGVnb3JpZXMuZmluZEluZGV4KChjOiBNYWNyb0NhdGVnb3J5KSA9PiBjLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdi50b0xvd2VyQ2FzZSgpKSA8IDAgfHwgdGhpcy4kdCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IuZXhpc3RzJylcbiAgICB9XG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLm5ld05hbWUgPSB0aGlzLm5hbWVcbiAgfVxuXG4gIGdldCBjYXRlZ29yaWVzICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snbWFjcm9zL2dldENhdGVnb3JpZXMnXVxuICB9XG5cbiAgaGFuZGxlU2F2ZSAoKSB7XG4gICAgdGhpcy4kZW1pdCgnc2F2ZScsIHRoaXMubmV3TmFtZSlcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL21hY3Jvcy9NYWNyb0NhdGVnb3J5RGlhbG9nLnZ1ZSJ9