/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import MacrosMixin from "/src/mixins/macros.ts";
import { isPicked, quickCommandEligible } from "/src/services/control/quick-command-picks.ts";
import { macroIcon } from "/src/services/macros/icon.ts";
let QuickCommandPicker = class extends Mixins(MacrosMixin) {
  get choices() {
    const picks = this.quickCommandPicks;
    const auto = this.autoQuickCommandNames;
    return this.arrangedMacros.filter(quickCommandEligible).map((m) => ({ name: m.name, title: m.title, icon: macroIcon(m.name), on: isPicked(picks, m.name, auto) })).sort((a, b) => Number(b.on) - Number(a.on) || a.title.localeCompare(b.title));
  }
  onToggle(name, event) {
    this.setQuickCommand(name, event.target.checked);
  }
  useAutomatic() {
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.quickCommands", value: null, server: true });
  }
};
QuickCommandPicker = __decorateClass([
  Component({})
], QuickCommandPicker);
const _sfc_main = QuickCommandPicker;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "qpick", attrs: { "aria-labelledby": "qpick-title", "data-tid": "quick-command-picker" } }, [_c("header", { staticClass: "qpick__head" }, [_vm._m(0), _vm.quickCommandPicks !== null ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "quick-pick-auto" }, on: { "click": _vm.useAutomatic } }, [_vm._v(" Pick for me ")]) : _vm._e()]), !_vm.choices.length ? _c("p", { staticClass: "qpick__none" }, [_vm._v(" This printer has nothing to show there yet. ")]) : _c("ul", { staticClass: "qpick__list" }, _vm._l(_vm.choices, function(c) {
    return _c("li", { key: c.name }, [_c("label", { staticClass: "qpick__row", attrs: { "data-tid": `quick-pick-${c.name}` } }, [_c("input", { attrs: { "type": "checkbox" }, domProps: { "checked": c.on }, on: { "change": function($event) {
      return _vm.onToggle(c.name, $event);
    } } }), _c(__unplugin_components_0, { attrs: { "name": c.icon, "small": "" } }), _c("span", [_vm._v(_vm._s(c.title))])], 1)]);
  }), 0)]);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_c("h3", { attrs: { "id": "qpick-title" } }, [_vm._v(" Quick commands ")]), _c("p", [_vm._v("Tick the ones Overview and Control show. The last one you tick comes first. Print controls (start, pause, resume, cancel) keep their own buttons on the print, so they are not offered here.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/macros/QuickCommandPicker.vue?vue&type=style&index=0&scoped=9c38fc29&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9c38fc29",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/macros/QuickCommandPicker.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUEwREE7QUFDQTtBQUNBO0FBQ0E7QUFVQTtBQUFBLEVBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQ0EsNkJBQ0EsMkdBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWpCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJRdWlja0NvbW1hbmRQaWNrZXIudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNlY3Rpb25cbiAgICBjbGFzcz1cInFwaWNrXCJcbiAgICBhcmlhLWxhYmVsbGVkYnk9XCJxcGljay10aXRsZVwiXG4gICAgZGF0YS10aWQ9XCJxdWljay1jb21tYW5kLXBpY2tlclwiXG4gID5cbiAgICA8aGVhZGVyIGNsYXNzPVwicXBpY2tfX2hlYWRcIj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxoMyBpZD1cInFwaWNrLXRpdGxlXCI+XG4gICAgICAgICAgUXVpY2sgY29tbWFuZHNcbiAgICAgICAgPC9oMz5cbiAgICAgICAgPHA+VGljayB0aGUgb25lcyBPdmVydmlldyBhbmQgQ29udHJvbCBzaG93LiBUaGUgbGFzdCBvbmUgeW91IHRpY2sgY29tZXMgZmlyc3QuIFByaW50IGNvbnRyb2xzIChzdGFydCwgcGF1c2UsIHJlc3VtZSwgY2FuY2VsKSBrZWVwIHRoZWlyIG93biBidXR0b25zIG9uIHRoZSBwcmludCwgc28gdGhleSBhcmUgbm90IG9mZmVyZWQgaGVyZS48L3A+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cInF1aWNrQ29tbWFuZFBpY2tzICE9PSBudWxsXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgIGRhdGEtdGlkPVwicXVpY2stcGljay1hdXRvXCJcbiAgICAgICAgQGNsaWNrPVwidXNlQXV0b21hdGljXCJcbiAgICAgID5cbiAgICAgICAgUGljayBmb3IgbWVcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvaGVhZGVyPlxuICAgIDxwXG4gICAgICB2LWlmPVwiIWNob2ljZXMubGVuZ3RoXCJcbiAgICAgIGNsYXNzPVwicXBpY2tfX25vbmVcIlxuICAgID5cbiAgICAgIFRoaXMgcHJpbnRlciBoYXMgbm90aGluZyB0byBzaG93IHRoZXJlIHlldC5cbiAgICA8L3A+XG4gICAgPHVsXG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwicXBpY2tfX2xpc3RcIlxuICAgID5cbiAgICAgIDxsaVxuICAgICAgICB2LWZvcj1cImMgaW4gY2hvaWNlc1wiXG4gICAgICAgIDprZXk9XCJjLm5hbWVcIlxuICAgICAgPlxuICAgICAgICA8bGFiZWxcbiAgICAgICAgICBjbGFzcz1cInFwaWNrX19yb3dcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBxdWljay1waWNrLSR7Yy5uYW1lfWBcIlxuICAgICAgICA+XG4gICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgOmNoZWNrZWQ9XCJjLm9uXCJcbiAgICAgICAgICAgIEBjaGFuZ2U9XCJvblRvZ2dsZShjLm5hbWUsICRldmVudClcIlxuICAgICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgOm5hbWU9XCJjLmljb25cIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxzcGFuPnt7IGMudGl0bGUgfX08L3NwYW4+XG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2xpPlxuICAgIDwvdWw+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTWFjcm9zTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFjcm9zJ1xuaW1wb3J0IHsgaXNQaWNrZWQsIHF1aWNrQ29tbWFuZEVsaWdpYmxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3F1aWNrLWNvbW1hbmQtcGlja3MnXG5pbXBvcnQgeyBtYWNyb0ljb24gfSBmcm9tICdAL3NlcnZpY2VzL21hY3Jvcy9pY29uJ1xuXG4vKipcbiAqIFRoZSBNYWNyb3MgcGFnZSdzIFwiUXVpY2sgY29tbWFuZHNcIiBzZWN0aW9uIChLQU4tMjEyMik6IHRpY2sgb3IgdW50aWNrIHdoaWNoXG4gKiBjb21tYW5kcyB0aGUgT3ZlcnZpZXcncyBRdWljayBjb21tYW5kcyB0aWxlIGFuZCBDb250cm9sJ3MgUXVpY2sgY29tbWFuZHNcbiAqIGNhcmQgc2hvdy4gS2VwdCBpbiB0aGUgcHJpbnRlcidzIHNldHRpbmdzICh1aVNldHRpbmdzLmdlbmVyYWwucXVpY2tDb21tYW5kcyksXG4gKiBzbyBldmVyeSBkZXZpY2Ugb3BlbmluZyB0aGlzIHByaW50ZXIgYWdyZWVzLiBVbnRpbCBzb21ldGhpbmcgaXMgdGlja2VkIHRoZVxuICogYmVzdCBvZiBlYWNoIGdyb3VwIHNob3csIGFuZCB0aG9zZSBzdGFydCB0aWNrZWQuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRdWlja0NvbW1hbmRQaWNrZXIgZXh0ZW5kcyBNaXhpbnMoTWFjcm9zTWl4aW4pIHtcbiAgZ2V0IGNob2ljZXMgKCkge1xuICAgIGNvbnN0IHBpY2tzID0gdGhpcy5xdWlja0NvbW1hbmRQaWNrc1xuICAgIGNvbnN0IGF1dG8gPSB0aGlzLmF1dG9RdWlja0NvbW1hbmROYW1lc1xuICAgIHJldHVybiB0aGlzLmFycmFuZ2VkTWFjcm9zXG4gICAgICAuZmlsdGVyKHF1aWNrQ29tbWFuZEVsaWdpYmxlKVxuICAgICAgLm1hcChtID0+ICh7IG5hbWU6IG0ubmFtZSwgdGl0bGU6IG0udGl0bGUsIGljb246IG1hY3JvSWNvbihtLm5hbWUpLCBvbjogaXNQaWNrZWQocGlja3MsIG0ubmFtZSwgYXV0bykgfSkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gTnVtYmVyKGIub24pIC0gTnVtYmVyKGEub24pIHx8IGEudGl0bGUubG9jYWxlQ29tcGFyZShiLnRpdGxlKSlcbiAgfVxuXG4gIG9uVG9nZ2xlIChuYW1lOiBzdHJpbmcsIGV2ZW50OiBFdmVudCkge1xuICAgIHRoaXMuc2V0UXVpY2tDb21tYW5kKG5hbWUsIChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZClcbiAgfVxuXG4gIHVzZUF1dG9tYXRpYyAoKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywgeyBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLnF1aWNrQ29tbWFuZHMnLCB2YWx1ZTogbnVsbCwgc2VydmVyOiB0cnVlIH0pXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5xcGljayB7XG4gICAgbWFyZ2luOiAwIDAgMjBweDtcbiAgICBwYWRkaW5nOiAxNnB4IDE4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMThweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gIH1cblxuICAucXBpY2tfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogMTJweDtcblxuICAgIGgzIHsgbWFyZ2luOiAwOyBmb250LXNpemU6IDE1cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cbiAgICBwIHsgbWFyZ2luOiAycHggMCAwOyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXNpemU6IDEzcHg7IH1cbiAgfVxuXG4gIC5xcGlja19fbGlzdCB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgyMjBweCwgMWZyKSk7XG4gICAgZ2FwOiA0cHggMTJweDtcbiAgICBtYXJnaW46IDEycHggMCAwO1xuICAgIHBhZGRpbmc6IDA7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgfVxuXG4gIC5xcGlja19fcm93IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICAgIG1pbi1oZWlnaHQ6IDQwcHg7XG4gICAgcGFkZGluZzogNnB4IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcblxuICAgICY6aG92ZXIgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTsgfVxuICAgIGlucHV0IHsgd2lkdGg6IDE4cHg7IGhlaWdodDogMThweDsgYWNjZW50LWNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTsgfVxuICAgIC5mcmFtZS1pY29uIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuICB9XG5cbiAgLnFwaWNrX19ub25lIHtcbiAgICBtYXJnaW46IDEwcHggMCAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvc2V0dGluZ3MvbWFjcm9zL1F1aWNrQ29tbWFuZFBpY2tlci52dWUifQ==