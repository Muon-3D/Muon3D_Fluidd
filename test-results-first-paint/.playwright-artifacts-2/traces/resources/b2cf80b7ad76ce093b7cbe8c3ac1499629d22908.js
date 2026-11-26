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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import FilamentActionsMixin from "/src/mixins/filament-actions.ts";
import { sensorsPath } from "/src/services/control/sensors-link.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import FilamentSection from "/src/components/control/FilamentSection.vue";
let FilamentTile = class extends Mixins(OverviewMixin, FilamentActionsMixin) {
  get menu() {
    const items = [
      { id: "material", label: "Set material and colour\u2026", action: () => this.openPanel() },
      { id: "load", label: "Load or unload\u2026", action: () => this.openPanel() },
      { id: "sensors", label: "Filament sensors\u2026", to: sensorsPath() }
    ];
    if (this.$store.getters["spoolman/getAvailable"]) {
      items.push({ id: "spoolman", label: "Pick a Spoolman spool\u2026", action: () => this.$store.commit("spoolman/setDialogState", { show: true }) });
    }
    return items;
  }
  openPanel() {
    this.$refs.section?.openPanel();
  }
};
FilamentTile = __decorateClass([
  Component({ components: { TileShell, FilamentSection } })
], FilamentTile);
const _sfc_main = FilamentTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { class: ["ft", `ft--${_vm.size}`], attrs: { "tile": "filament", "title": "Filament", "menu": _vm.menu } }, [_c("filament-section", { ref: "section", attrs: { "compact": _vm.size === "S", "tid-prefix": "overview-" } }), _vm.size === "L" ? _c("p", { staticClass: "ot__sub ft__note" }, [_vm._v(" " + _vm._s(_vm.changeMacro ? "Change filament is guided: it heats the nozzle, tells you when to pull and push, then purges." : "Load and unload heat the nozzle for you first.") + " ")]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/FilamentTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/FilamentTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXNCQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFXQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWhCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJGaWxhbWVudFRpbGUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHRpbGUtc2hlbGxcbiAgICB0aWxlPVwiZmlsYW1lbnRcIlxuICAgIHRpdGxlPVwiRmlsYW1lbnRcIlxuICAgIDptZW51PVwibWVudVwiXG4gICAgOmNsYXNzPVwiWydmdCcsIGBmdC0tJHtzaXplfWBdXCJcbiAgPlxuICAgIDxmaWxhbWVudC1zZWN0aW9uXG4gICAgICByZWY9XCJzZWN0aW9uXCJcbiAgICAgIDpjb21wYWN0PVwic2l6ZSA9PT0gJ1MnXCJcbiAgICAgIHRpZC1wcmVmaXg9XCJvdmVydmlldy1cIlxuICAgIC8+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJzaXplID09PSAnTCdcIlxuICAgICAgY2xhc3M9XCJvdF9fc3ViIGZ0X19ub3RlXCJcbiAgICA+XG4gICAgICB7eyBjaGFuZ2VNYWNybyA/ICdDaGFuZ2UgZmlsYW1lbnQgaXMgZ3VpZGVkOiBpdCBoZWF0cyB0aGUgbm96emxlLCB0ZWxscyB5b3Ugd2hlbiB0byBwdWxsIGFuZCBwdXNoLCB0aGVuIHB1cmdlcy4nIDogJ0xvYWQgYW5kIHVubG9hZCBoZWF0IHRoZSBub3p6bGUgZm9yIHlvdSBmaXJzdC4nIH19XG4gICAgPC9wPlxuICA8L3RpbGUtc2hlbGw+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5pbXBvcnQgRmlsYW1lbnRBY3Rpb25zTWl4aW4gZnJvbSAnQC9taXhpbnMvZmlsYW1lbnQtYWN0aW9ucydcbmltcG9ydCB0eXBlIHsgVGlsZU1lbnVJdGVtIH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy90aWxlcydcbmltcG9ydCB7IHNlbnNvcnNQYXRoIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3NlbnNvcnMtbGluaydcbmltcG9ydCBUaWxlU2hlbGwgZnJvbSAnLi9UaWxlU2hlbGwudnVlJ1xuaW1wb3J0IEZpbGFtZW50U2VjdGlvbiBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9GaWxhbWVudFNlY3Rpb24udnVlJ1xuXG4vKipcbiAqIFdoYXQgaXMgbG9hZGVkLCBhbmQgdGhlIGJ1dHRvbnMgdG8gY2hhbmdlIGl0OiBDb250cm9sJ3MgZmlsYW1lbnQgc2VjdGlvblxuICogKEZpbGFtZW50U2VjdGlvbiksIHRoZSBzYW1lIGNvbXBvbmVudCAoSmFjaywgNiBOb3YgMjAyNjogXCJ0aGUgc2FtZVxuICogY29tcG9uZW50LCBpbiBwYXJpdHlcIiksIHdpdGhvdXQgRXh0cnVkZSBieSBoYW5kLiBBIHByZXNzIG9uIHRoZSByaW5nIG9yXG4gKiBpdHMgbmFtZSwgb3Ig4ouvIFNldCBtYXRlcmlhbCBhbmQgY29sb3VyLCBvcGVucyB0aGUgbWF0ZXJpYWwgcGFuZWxcbiAqIChNYXRlcmlhbFBpY2tlcikgZGlyZWN0bHkuIFRoZXJlIGlzIG5vIGFtb3VudCBhbmQgbm8gcGVyY2VudGFnZTogdGhlXG4gKiBwcmludGVyIGRvZXMgbm90IHRyYWNrIHRoZW0uXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRpbGVTaGVsbCwgRmlsYW1lbnRTZWN0aW9uIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGFtZW50VGlsZSBleHRlbmRzIE1peGlucyhPdmVydmlld01peGluLCBGaWxhbWVudEFjdGlvbnNNaXhpbikge1xuICBnZXQgbWVudSAoKTogVGlsZU1lbnVJdGVtW10ge1xuICAgIGNvbnN0IGl0ZW1zOiBUaWxlTWVudUl0ZW1bXSA9IFtcbiAgICAgIHsgaWQ6ICdtYXRlcmlhbCcsIGxhYmVsOiAnU2V0IG1hdGVyaWFsIGFuZCBjb2xvdXLigKYnLCBhY3Rpb246ICgpID0+IHRoaXMub3BlblBhbmVsKCkgfSxcbiAgICAgIHsgaWQ6ICdsb2FkJywgbGFiZWw6ICdMb2FkIG9yIHVubG9hZOKApicsIGFjdGlvbjogKCkgPT4gdGhpcy5vcGVuUGFuZWwoKSB9LFxuICAgICAgeyBpZDogJ3NlbnNvcnMnLCBsYWJlbDogJ0ZpbGFtZW50IHNlbnNvcnPigKYnLCB0bzogc2Vuc29yc1BhdGgoKSB9XG4gICAgXVxuICAgIGlmICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydzcG9vbG1hbi9nZXRBdmFpbGFibGUnXSkge1xuICAgICAgaXRlbXMucHVzaCh7IGlkOiAnc3Bvb2xtYW4nLCBsYWJlbDogJ1BpY2sgYSBTcG9vbG1hbiBzcG9vbOKApicsIGFjdGlvbjogKCkgPT4gdGhpcy4kc3RvcmUuY29tbWl0KCdzcG9vbG1hbi9zZXREaWFsb2dTdGF0ZScsIHsgc2hvdzogdHJ1ZSB9KSB9KVxuICAgIH1cbiAgICByZXR1cm4gaXRlbXNcbiAgfVxuXG4gIG9wZW5QYW5lbCAoKSB7XG4gICAgKHRoaXMuJHJlZnMuc2VjdGlvbiBhcyBGaWxhbWVudFNlY3Rpb24gfCB1bmRlZmluZWQpPy5vcGVuUGFuZWwoKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4uZnRfX25vdGUgeyBtYXJnaW4tdG9wOiA4cHg7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL292ZXJ2aWV3L3RpbGVzL0ZpbGFtZW50VGlsZS52dWUifQ==