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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import MacroRunMixin from "/src/mixins/macro-run.ts";
import OverviewMixin from "/src/mixins/overview.ts";
import {} from "/src/mixins/macros.ts";
import { QUICK_BUSY_BLOCKED, defaultQuick, quickSlots } from "/src/services/overview/quick-defaults.ts";
import { macroIcon } from "/src/services/macros/icon.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import TileDialog from "/src/components/widgets/overview/tiles/TileDialog.vue";
let MacrosTile = class extends Mixins(MacroRunMixin, OverviewMixin) {
  dialog = false;
  /** XS: icon-only. */
  get iconOnly() {
    return this.size === "XS";
  }
  /** How many show besides All commands: XS 5, S 3, M 7, L 11 (a full row each with All commands). */
  get count() {
    return { XS: 5, S: 3, M: 7, L: 30 }[this.size] ?? 7;
  }
  get chips() {
    return this.quickCommandList(this.count);
  }
  /** The tile's width, kept up to date (a ResizeObserver), so how many commands fit in a row follows it. */
  width = 1e3;
  watcher = null;
  mounted() {
    const el = this.$el;
    const measure = () => {
      const w = el.clientWidth - 36;
      if (w > 0) this.width = w;
    };
    measure();
    if (typeof ResizeObserver === "function") {
      this.watcher = new ResizeObserver(measure);
      this.watcher.observe(el);
    }
  }
  beforeDestroy() {
    this.watcher?.disconnect();
  }
  /** Names the printer has, upper case: its macros and the commands it lists. */
  get have() {
    const commands = Object.keys(this.$store.getters["printer/getAvailableCommands"] ?? {});
    return new Set([...this.arrangedMacros.map((m) => m.name), ...commands].map((n) => n.toUpperCase()));
  }
  /** L is the full-width row: exactly two rows, as many as fit, the last place always All commands. A person's own picks (Settings, Macros) win over the default set. */
  get slots() {
    const total = this.quickCommandPicks === null ? defaultQuick(this.have).length : this.quickCommandList(30).length;
    return quickSlots(this.width, total);
  }
  get grid() {
    return this.size === "L" ? { "--per": String(this.slots.perRow) } : void 0;
  }
  /** What the buttons are: for L the default set (or the picks) cut to the width, else the old automatic pick. */
  get tiles() {
    const ready = this.controlReady;
    const ofMacro = (m) => ({ key: m.name, title: m.title, icon: this.iconOf(m), tip: this.tooltipOf(m), disabled: !ready || m.disabledWhilePrinting && this.busy, go: () => this.run(m) });
    if (this.size !== "L") return this.chips.map(ofMacro);
    if (this.quickCommandPicks !== null) return this.quickCommandList(this.slots.shown).map(ofMacro);
    return defaultQuick(this.have).slice(0, this.slots.shown).map((d) => {
      const macro = this.arrangedMacros.find((m) => m.name === d.found);
      const send = d.gcode ?? d.found;
      const go = d.id === "home" ? () => this.home() : macro && !d.gcode ? () => this.run(macro) : () => {
        this.sendTypedGcode(send);
      };
      return { key: d.id, title: d.title, icon: d.icon, tip: d.gcode ? `${d.title} (${d.gcode})` : d.found, disabled: !ready || this.busy && (QUICK_BUSY_BLOCKED.has(d.id) || !!macro?.disabledWhilePrinting), go };
    });
  }
  /** The icon for a macro: by what its name says it does, else the bolt. */
  iconOf(m) {
    return macroIcon(m.name);
  }
  get menu() {
    return [
      // KAN-2122: managing which show is the Macros page's job, so the button is named for it.
      { id: "manage", label: "Manage in Macros\u2026", to: `${this.pagePath("/settings")}#macros` },
      { id: "console", label: "Open the console\u2026", to: this.pagePath("/console") }
    ];
  }
};
MacrosTile = __decorateClass([
  Component({ components: { TileShell, TileDialog, ControlMacros: () => import("/src/components/control/ControlMacros.vue") } })
], MacrosTile);
const _sfc_main = MacrosTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { class: ["mt", `mt--${_vm.size}`], attrs: { "tile": "macros", "title": "Quick commands", "icon": "bolt", "menu": _vm.menu } }, [_vm.tiles.length ? _c("div", { staticClass: "mt__chips", class: { "mt__chips--icons": _vm.iconOnly }, style: _vm.grid, attrs: { "data-tid": "macro-chips" } }, [_vm._l(_vm.tiles, function(c) {
    return _c("button", { key: c.key, staticClass: "mt__chip", attrs: { "type": "button", "disabled": c.disabled, "title": c.tip, "aria-label": _vm.iconOnly ? c.title : void 0, "data-macro": c.key, "data-tid": "macro-chip" }, on: { "click": function($event) {
      return c.go();
    } } }, [_c(__unplugin_components_0, { attrs: { "name": c.icon } }), !_vm.iconOnly ? _c("span", { staticClass: "mt__label" }, [_vm._v(_vm._s(c.title))]) : _vm._e()], 1);
  }), _c("button", { staticClass: "mt__chip mt__chip--more", attrs: { "type": "button", "data-tid": "macros-all", "aria-label": _vm.iconOnly ? "All commands" : void 0, "title": _vm.iconOnly ? "All commands" : void 0 }, on: { "click": function($event) {
    _vm.dialog = true;
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "list" } }), !_vm.iconOnly ? _c("span", { staticClass: "mt__label" }, [_vm._v(_vm._s(_vm.size === "S" ? "All" : "All commands"))]) : _vm._e()], 1)], 2) : _c("p", { staticClass: "ot__note" }, [_vm._v(" No quick commands on this printer. ")]), !_vm.controlReady && _vm.tiles.length ? _c("p", { staticClass: "ot__lock" }, [_vm._v(" " + _vm._s(_vm.controlLock) + " ")]) : _vm._e(), _vm.selected ? _c("form", { staticClass: "macros__values mt__form", attrs: { "data-tid": "macro-send", "aria-label": "Quick command values" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.submitMacro.apply(null, arguments);
  } } }, [_c("h3", [_vm._v(_vm._s(_vm.selected.title))]), _vm._l(_vm.fields, function(field) {
    return _c("label", { key: field.name, staticClass: "macros__field" }, [_c("span", [_vm._v(_vm._s(field.name) + " \xB7 " + _vm._s(field.optional ? "optional" : "required"))]), _c("textarea", { directives: [{ name: "model", rawName: "v-model", value: _vm.values[field.name], expression: "values[field.name]" }], attrs: { "rows": "1", "aria-label": `Value ${field.name}`, "autocomplete": "off" }, domProps: { "value": _vm.values[field.name] }, on: { "input": function($event) {
      if ($event.target.composing) return;
      _vm.$set(_vm.values, field.name, $event.target.value);
    } } })]);
  }), _c("p", [_vm._v("Sends "), _c("code", [_vm._v(_vm._s(_vm.preview || "check the values"))])]), _vm.formError || _vm.commandRefusal ? _c("p", { attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.formError || _vm.commandRefusal) + " ")]) : _vm._e(), _c("div", { staticClass: "mt__form-actions" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.selected = null;
  } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "disabled": !_vm.controlReady } }, [_vm._v(" Run ")])])], 2) : _vm._e(), _c("tile-dialog", { attrs: { "value": _vm.dialog, "title": "All quick commands", "max-width": "860" }, on: { "close": function($event) {
    _vm.dialog = false;
  } } }, [_c("control-macros")], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/MacrosTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/MacrosTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBdUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFXQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXJFQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNYWNyb3NUaWxlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx0aWxlLXNoZWxsXG4gICAgdGlsZT1cIm1hY3Jvc1wiXG4gICAgdGl0bGU9XCJRdWljayBjb21tYW5kc1wiXG4gICAgaWNvbj1cImJvbHRcIlxuICAgIDptZW51PVwibWVudVwiXG4gICAgOmNsYXNzPVwiWydtdCcsIGBtdC0tJHtzaXplfWBdXCJcbiAgPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJ0aWxlcy5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJtdF9fY2hpcHNcIlxuICAgICAgOmNsYXNzPVwieyAnbXRfX2NoaXBzLS1pY29ucyc6IGljb25Pbmx5IH1cIlxuICAgICAgOnN0eWxlPVwiZ3JpZFwiXG4gICAgICBkYXRhLXRpZD1cIm1hY3JvLWNoaXBzXCJcbiAgICA+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtZm9yPVwiYyBpbiB0aWxlc1wiXG4gICAgICAgIDprZXk9XCJjLmtleVwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cIm10X19jaGlwXCJcbiAgICAgICAgOmRpc2FibGVkPVwiYy5kaXNhYmxlZFwiXG4gICAgICAgIDp0aXRsZT1cImMudGlwXCJcbiAgICAgICAgOmFyaWEtbGFiZWw9XCJpY29uT25seSA/IGMudGl0bGUgOiB1bmRlZmluZWRcIlxuICAgICAgICA6ZGF0YS1tYWNybz1cImMua2V5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJtYWNyby1jaGlwXCJcbiAgICAgICAgQGNsaWNrPVwiYy5nbygpXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gOm5hbWU9XCJjLmljb25cIiAvPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCIhaWNvbk9ubHlcIlxuICAgICAgICAgIGNsYXNzPVwibXRfX2xhYmVsXCJcbiAgICAgICAgPnt7IGMudGl0bGUgfX08L3NwYW4+XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwibXRfX2NoaXAgbXRfX2NoaXAtLW1vcmVcIlxuICAgICAgICBkYXRhLXRpZD1cIm1hY3Jvcy1hbGxcIlxuICAgICAgICA6YXJpYS1sYWJlbD1cImljb25Pbmx5ID8gJ0FsbCBjb21tYW5kcycgOiB1bmRlZmluZWRcIlxuICAgICAgICA6dGl0bGU9XCJpY29uT25seSA/ICdBbGwgY29tbWFuZHMnIDogdW5kZWZpbmVkXCJcbiAgICAgICAgQGNsaWNrPVwiZGlhbG9nID0gdHJ1ZVwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJsaXN0XCIgLz5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWlmPVwiIWljb25Pbmx5XCJcbiAgICAgICAgICBjbGFzcz1cIm10X19sYWJlbFwiXG4gICAgICAgID57eyBzaXplID09PSAnUycgPyAnQWxsJyA6ICdBbGwgY29tbWFuZHMnIH19PC9zcGFuPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICAgPHBcbiAgICAgIHYtZWxzZVxuICAgICAgY2xhc3M9XCJvdF9fbm90ZVwiXG4gICAgPlxuICAgICAgTm8gcXVpY2sgY29tbWFuZHMgb24gdGhpcyBwcmludGVyLlxuICAgIDwvcD5cbiAgICA8cFxuICAgICAgdi1pZj1cIiFjb250cm9sUmVhZHkgJiYgdGlsZXMubGVuZ3RoXCJcbiAgICAgIGNsYXNzPVwib3RfX2xvY2tcIlxuICAgID5cbiAgICAgIHt7IGNvbnRyb2xMb2NrIH19XG4gICAgPC9wPlxuXG4gICAgPGZvcm1cbiAgICAgIHYtaWY9XCJzZWxlY3RlZFwiXG4gICAgICBjbGFzcz1cIm1hY3Jvc19fdmFsdWVzIG10X19mb3JtXCJcbiAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2VuZFwiXG4gICAgICBhcmlhLWxhYmVsPVwiUXVpY2sgY29tbWFuZCB2YWx1ZXNcIlxuICAgICAgQHN1Ym1pdC5wcmV2ZW50PVwic3VibWl0TWFjcm9cIlxuICAgID5cbiAgICAgIDxoMz57eyBzZWxlY3RlZC50aXRsZSB9fTwvaDM+XG4gICAgICA8bGFiZWxcbiAgICAgICAgdi1mb3I9XCJmaWVsZCBpbiBmaWVsZHNcIlxuICAgICAgICA6a2V5PVwiZmllbGQubmFtZVwiXG4gICAgICAgIGNsYXNzPVwibWFjcm9zX19maWVsZFwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuPnt7IGZpZWxkLm5hbWUgfX0gwrcge3sgZmllbGQub3B0aW9uYWwgPyAnb3B0aW9uYWwnIDogJ3JlcXVpcmVkJyB9fTwvc3Bhbj5cbiAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgdi1tb2RlbD1cInZhbHVlc1tmaWVsZC5uYW1lXVwiXG4gICAgICAgICAgcm93cz1cIjFcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiYFZhbHVlICR7ZmllbGQubmFtZX1gXCJcbiAgICAgICAgICBhdXRvY29tcGxldGU9XCJvZmZcIlxuICAgICAgICAvPlxuICAgICAgPC9sYWJlbD5cbiAgICAgIDxwPlNlbmRzIDxjb2RlPnt7IHByZXZpZXcgfHwgJ2NoZWNrIHRoZSB2YWx1ZXMnIH19PC9jb2RlPjwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJmb3JtRXJyb3IgfHwgY29tbWFuZFJlZnVzYWxcIlxuICAgICAgICByb2xlPVwiYWxlcnRcIlxuICAgICAgPlxuICAgICAgICB7eyBmb3JtRXJyb3IgfHwgY29tbWFuZFJlZnVzYWwgfX1cbiAgICAgIDwvcD5cbiAgICAgIDxkaXYgY2xhc3M9XCJtdF9fZm9ybS1hY3Rpb25zXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIEBjbGljaz1cInNlbGVjdGVkID0gbnVsbFwiXG4gICAgICAgID5cbiAgICAgICAgICBDYW5jZWxcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgID5cbiAgICAgICAgICBSdW5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Zvcm0+XG5cbiAgICA8dGlsZS1kaWFsb2dcbiAgICAgIDp2YWx1ZT1cImRpYWxvZ1wiXG4gICAgICB0aXRsZT1cIkFsbCBxdWljayBjb21tYW5kc1wiXG4gICAgICBtYXgtd2lkdGg9XCI4NjBcIlxuICAgICAgQGNsb3NlPVwiZGlhbG9nID0gZmFsc2VcIlxuICAgID5cbiAgICAgIDxjb250cm9sLW1hY3JvcyAvPlxuICAgIDwvdGlsZS1kaWFsb2c+XG4gIDwvdGlsZS1zaGVsbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTWFjcm9SdW5NaXhpbiBmcm9tICdAL21peGlucy9tYWNyby1ydW4nXG5pbXBvcnQgT3ZlcnZpZXdNaXhpbiBmcm9tICdAL21peGlucy9vdmVydmlldydcbmltcG9ydCB7IHR5cGUgU2hvd25NYWNybyB9IGZyb20gJ0AvbWl4aW5zL21hY3JvcydcbmltcG9ydCB7IFFVSUNLX0JVU1lfQkxPQ0tFRCwgZGVmYXVsdFF1aWNrLCBxdWlja1Nsb3RzIH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy9xdWljay1kZWZhdWx0cydcbmltcG9ydCB0eXBlIHsgVGlsZU1lbnVJdGVtIH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy90aWxlcydcbmltcG9ydCB7IG1hY3JvSWNvbiB9IGZyb20gJ0Avc2VydmljZXMvbWFjcm9zL2ljb24nXG5pbXBvcnQgVGlsZVNoZWxsIGZyb20gJy4vVGlsZVNoZWxsLnZ1ZSdcbmltcG9ydCBUaWxlRGlhbG9nIGZyb20gJy4vVGlsZURpYWxvZy52dWUnXG5cbi8qKlxuICogUXVpY2sgY29tbWFuZHMgYXMgdGhlIHRvcCBiYXIncyBRdWljayBhY3Rpb25zOiBhIGxpbmUgaWNvbiBvdmVyIHRoZSBuYW1lXG4gKiAoS0FOLTIwNzYpLiBXaGljaCBvbmVzIHNob3cgaXMgdGlja2VkIG9uIHRoZSBNYWNyb3MgcGFnZSdzIFwiUXVpY2sgY29tbWFuZHNcIlxuICogc2VjdGlvbiAoS0FOLTIxMjIpLCBlbHNlIHRoZSBiZXN0IG9mIGVhY2ggZ3JvdXAuIFRoZSB0aWxlIGdyb3dzIHdpdGggaXRzXG4gKiBzaXplIChPVi0yOSk6IFhTIGlzIHNtYWxsIGljb24tb25seSBidXR0b25zLCBzbyBtb3JlIGZpdDsgUywgTSBhbmQgTCBzaG93XG4gKiBtb3JlIG5hbWVkIGJ1dHRvbnMsIGFuZCB0aGUgYnV0dG9ucyBmaWxsIHRoZSB0aWxlIHRvIGl0cyBmbG9vci4gT25lIHRoYXRcbiAqIG5lZWRzIGEgdmFsdWUgYXNrcyBmb3IgaXQgaGVyZS4gQWxsIG9mIHRoZW0sIGdyb3VwZWQsIGFyZSBpbiBhIGRpYWxvZy5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVGlsZVNoZWxsLCBUaWxlRGlhbG9nLCBDb250cm9sTWFjcm9zOiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9jb250cm9sL0NvbnRyb2xNYWNyb3MudnVlJykgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFjcm9zVGlsZSBleHRlbmRzIE1peGlucyhNYWNyb1J1bk1peGluLCBPdmVydmlld01peGluKSB7XG4gIGRpYWxvZyA9IGZhbHNlXG5cbiAgLyoqIFhTOiBpY29uLW9ubHkuICovXG4gIGdldCBpY29uT25seSAoKTogYm9vbGVhbiB7IHJldHVybiAodGhpcy5zaXplIGFzIHN0cmluZykgPT09ICdYUycgfVxuXG4gIC8qKiBIb3cgbWFueSBzaG93IGJlc2lkZXMgQWxsIGNvbW1hbmRzOiBYUyA1LCBTIDMsIE0gNywgTCAxMSAoYSBmdWxsIHJvdyBlYWNoIHdpdGggQWxsIGNvbW1hbmRzKS4gKi9cbiAgZ2V0IGNvdW50ICgpOiBudW1iZXIge1xuICAgIHJldHVybiAoeyBYUzogNSwgUzogMywgTTogNywgTDogMzAgfSBhcyBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+KVt0aGlzLnNpemVdID8/IDdcbiAgfVxuXG4gIGdldCBjaGlwcyAoKTogU2hvd25NYWNyb1tdIHsgcmV0dXJuIHRoaXMucXVpY2tDb21tYW5kTGlzdCh0aGlzLmNvdW50KSB9XG5cbiAgLyoqIFRoZSB0aWxlJ3Mgd2lkdGgsIGtlcHQgdXAgdG8gZGF0ZSAoYSBSZXNpemVPYnNlcnZlciksIHNvIGhvdyBtYW55IGNvbW1hbmRzIGZpdCBpbiBhIHJvdyBmb2xsb3dzIGl0LiAqL1xuICB3aWR0aCA9IDEwMDBcbiAgcHJpdmF0ZSB3YXRjaGVyOiBSZXNpemVPYnNlcnZlciB8IG51bGwgPSBudWxsXG5cbiAgbW91bnRlZCAoKSB7XG4gICAgY29uc3QgZWwgPSB0aGlzLiRlbCBhcyBIVE1MRWxlbWVudFxuICAgIGNvbnN0IG1lYXN1cmUgPSAoKSA9PiB7IGNvbnN0IHcgPSBlbC5jbGllbnRXaWR0aCAtIDM2OyBpZiAodyA+IDApIHRoaXMud2lkdGggPSB3IH1cbiAgICBtZWFzdXJlKClcbiAgICBpZiAodHlwZW9mIFJlc2l6ZU9ic2VydmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLndhdGNoZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIobWVhc3VyZSlcbiAgICAgIHRoaXMud2F0Y2hlci5vYnNlcnZlKGVsKVxuICAgIH1cbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkgeyB0aGlzLndhdGNoZXI/LmRpc2Nvbm5lY3QoKSB9XG5cbiAgLyoqIE5hbWVzIHRoZSBwcmludGVyIGhhcywgdXBwZXIgY2FzZTogaXRzIG1hY3JvcyBhbmQgdGhlIGNvbW1hbmRzIGl0IGxpc3RzLiAqL1xuICBnZXQgaGF2ZSAoKTogU2V0PHN0cmluZz4ge1xuICAgIGNvbnN0IGNvbW1hbmRzID0gT2JqZWN0LmtleXMoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0QXZhaWxhYmxlQ29tbWFuZHMnXSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPz8ge30pXG4gICAgcmV0dXJuIG5ldyBTZXQoWy4uLnRoaXMuYXJyYW5nZWRNYWNyb3MubWFwKG0gPT4gbS5uYW1lKSwgLi4uY29tbWFuZHNdLm1hcChuID0+IG4udG9VcHBlckNhc2UoKSkpXG4gIH1cblxuICAvKiogTCBpcyB0aGUgZnVsbC13aWR0aCByb3c6IGV4YWN0bHkgdHdvIHJvd3MsIGFzIG1hbnkgYXMgZml0LCB0aGUgbGFzdCBwbGFjZSBhbHdheXMgQWxsIGNvbW1hbmRzLiBBIHBlcnNvbidzIG93biBwaWNrcyAoU2V0dGluZ3MsIE1hY3Jvcykgd2luIG92ZXIgdGhlIGRlZmF1bHQgc2V0LiAqL1xuICBnZXQgc2xvdHMgKCk6IHsgcGVyUm93OiBudW1iZXI7IHNob3duOiBudW1iZXIgfSB7XG4gICAgY29uc3QgdG90YWwgPSB0aGlzLnF1aWNrQ29tbWFuZFBpY2tzID09PSBudWxsID8gZGVmYXVsdFF1aWNrKHRoaXMuaGF2ZSkubGVuZ3RoIDogdGhpcy5xdWlja0NvbW1hbmRMaXN0KDMwKS5sZW5ndGhcbiAgICByZXR1cm4gcXVpY2tTbG90cyh0aGlzLndpZHRoLCB0b3RhbClcbiAgfVxuXG4gIGdldCBncmlkICgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zaXplID09PSAnTCcgPyB7ICctLXBlcic6IFN0cmluZyh0aGlzLnNsb3RzLnBlclJvdykgfSA6IHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqIFdoYXQgdGhlIGJ1dHRvbnMgYXJlOiBmb3IgTCB0aGUgZGVmYXVsdCBzZXQgKG9yIHRoZSBwaWNrcykgY3V0IHRvIHRoZSB3aWR0aCwgZWxzZSB0aGUgb2xkIGF1dG9tYXRpYyBwaWNrLiAqL1xuICBnZXQgdGlsZXMgKCk6IEFycmF5PHsga2V5OiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGljb246IHN0cmluZywgdGlwOiBzdHJpbmcsIGRpc2FibGVkOiBib29sZWFuLCBnbzogKCkgPT4gdm9pZCB9PiB7XG4gICAgY29uc3QgcmVhZHkgPSB0aGlzLmNvbnRyb2xSZWFkeVxuICAgIGNvbnN0IG9mTWFjcm8gPSAobTogU2hvd25NYWNybykgPT4gKHsga2V5OiBtLm5hbWUsIHRpdGxlOiBtLnRpdGxlLCBpY29uOiB0aGlzLmljb25PZihtKSwgdGlwOiB0aGlzLnRvb2x0aXBPZihtKSwgZGlzYWJsZWQ6ICFyZWFkeSB8fCAobS5kaXNhYmxlZFdoaWxlUHJpbnRpbmcgJiYgdGhpcy5idXN5KSwgZ286ICgpID0+IHRoaXMucnVuKG0pIH0pXG4gICAgaWYgKHRoaXMuc2l6ZSAhPT0gJ0wnKSByZXR1cm4gdGhpcy5jaGlwcy5tYXAob2ZNYWNybylcbiAgICBpZiAodGhpcy5xdWlja0NvbW1hbmRQaWNrcyAhPT0gbnVsbCkgcmV0dXJuIHRoaXMucXVpY2tDb21tYW5kTGlzdCh0aGlzLnNsb3RzLnNob3duKS5tYXAob2ZNYWNybylcbiAgICByZXR1cm4gZGVmYXVsdFF1aWNrKHRoaXMuaGF2ZSkuc2xpY2UoMCwgdGhpcy5zbG90cy5zaG93bikubWFwKGQgPT4ge1xuICAgICAgY29uc3QgbWFjcm8gPSB0aGlzLmFycmFuZ2VkTWFjcm9zLmZpbmQobSA9PiBtLm5hbWUgPT09IGQuZm91bmQpXG4gICAgICBjb25zdCBzZW5kID0gZC5nY29kZSA/PyBkLmZvdW5kXG4gICAgICBjb25zdCBnbyA9IGQuaWQgPT09ICdob21lJyA/ICgpID0+IHRoaXMuaG9tZSgpIDogbWFjcm8gJiYgIWQuZ2NvZGUgPyAoKSA9PiB0aGlzLnJ1bihtYWNybykgOiAoKSA9PiB7IHRoaXMuc2VuZFR5cGVkR2NvZGUoc2VuZCkgfVxuICAgICAgcmV0dXJuIHsga2V5OiBkLmlkLCB0aXRsZTogZC50aXRsZSwgaWNvbjogZC5pY29uLCB0aXA6IGQuZ2NvZGUgPyBgJHtkLnRpdGxlfSAoJHtkLmdjb2RlfSlgIDogZC5mb3VuZCwgZGlzYWJsZWQ6ICFyZWFkeSB8fCAodGhpcy5idXN5ICYmIChRVUlDS19CVVNZX0JMT0NLRUQuaGFzKGQuaWQpIHx8ICEhbWFjcm8/LmRpc2FibGVkV2hpbGVQcmludGluZykpLCBnbyB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKiBUaGUgaWNvbiBmb3IgYSBtYWNybzogYnkgd2hhdCBpdHMgbmFtZSBzYXlzIGl0IGRvZXMsIGVsc2UgdGhlIGJvbHQuICovXG4gIGljb25PZiAobTogU2hvd25NYWNybyk6IHN0cmluZyB7IHJldHVybiBtYWNyb0ljb24obS5uYW1lKSB9XG5cbiAgZ2V0IG1lbnUgKCk6IFRpbGVNZW51SXRlbVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgLy8gS0FOLTIxMjI6IG1hbmFnaW5nIHdoaWNoIHNob3cgaXMgdGhlIE1hY3JvcyBwYWdlJ3Mgam9iLCBzbyB0aGUgYnV0dG9uIGlzIG5hbWVkIGZvciBpdC5cbiAgICAgIHsgaWQ6ICdtYW5hZ2UnLCBsYWJlbDogJ01hbmFnZSBpbiBNYWNyb3PigKYnLCB0bzogYCR7dGhpcy5wYWdlUGF0aCgnL3NldHRpbmdzJyl9I21hY3Jvc2AgfSxcbiAgICAgIHsgaWQ6ICdjb25zb2xlJywgbGFiZWw6ICdPcGVuIHRoZSBjb25zb2xl4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy9jb25zb2xlJykgfVxuICAgIF1cbiAgfVxufTwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbi8qIE9WLTI5OiB0aGUgdGlsZSByZWFjaGVzIGl0cyBmbG9vcjsgdGhlIGJ1dHRvbnMgc2hhcmUgdGhlIGhlaWdodC4gKi9cbi5tdCA+IC5vdF9fZG9vciB7IGZsZXg6IDEgMSBhdXRvOyB9XG4ubXRfX2NoaXBzIHsgZGlzcGxheTogZ3JpZDsgZmxleDogMSAxIGF1dG87IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMTA0cHgsIDFmcikpOyBncmlkLWF1dG8tcm93czogbWlubWF4KDY0cHgsIDFmcik7IGdhcDogMTBweDsgfVxuLm10LS1MIC5tdF9fY2hpcHMgeyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCh2YXIoLS1wZXIsIDgpLCBtaW5tYXgoMCwgMWZyKSk7IGdyaWQtdGVtcGxhdGUtcm93czogcmVwZWF0KDIsIG1pbm1heCg3NnB4LCAxZnIpKTsgfVxuLm10LS1MIC5tdF9fbGFiZWwgeyBmb250LXNpemU6IDE0cHg7IH1cbi5tdC0tTCAubXRfX2NoaXAgLmZyYW1lLWljb24geyB3aWR0aDogMjZweDsgaGVpZ2h0OiAyNnB4OyB9XG4ubXQtLU0gLm10X19jaGlwcyB7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDgsIG1pbm1heCgwLCAxZnIpKTsgfVxuLm10LS1TIC5tdF9fY2hpcHMgeyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCBtaW5tYXgoMCwgMWZyKSk7IH1cbi5tdC0tWFMgLm10X19jaGlwcyB7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDMsIG1pbm1heCgwLCAxZnIpKTsgZ3JpZC1hdXRvLXJvd3M6IG1pbm1heCg0MHB4LCAxZnIpOyBnYXA6IDZweDsgfVxuLm10X19jaGlwIHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGdhcDogN3B4OyBtaW4td2lkdGg6IDA7IHBhZGRpbmc6IDEwcHggNnB4OyBib3JkZXItcmFkaXVzOiAxNHB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgdGV4dC1hbGlnbjogY2VudGVyOyBjdXJzb3I6IHBvaW50ZXI7IH1cbi5tdF9fY2hpcHMtLWljb25zIC5tdF9fY2hpcCB7IHBhZGRpbmc6IDZweDsgYm9yZGVyLXJhZGl1czogMTJweDsgfVxuLm10X19jaGlwIC5mcmFtZS1pY29uIHsgd2lkdGg6IDIycHg7IGhlaWdodDogMjJweDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuLm10X19jaGlwcy0taWNvbnMgLm10X19jaGlwIC5mcmFtZS1pY29uIHsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgfVxuLm10X19jaGlwOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHsgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1zdXJmYWNlLTIpIDgyJSwgI2ZmZik7IH1cbi5tdF9fY2hpcDpob3Zlcjpub3QoOmRpc2FibGVkKSAuZnJhbWUtaWNvbiB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IH1cbi5tdF9fY2hpcDpmb2N1cy12aXNpYmxlIHsgb3V0bGluZTogMnB4IHNvbGlkIHZhcigtLW0zZC1mb2N1cy1yaW5nLCB2YXIoLS1tM2QtYWNjZW50KSk7IG91dGxpbmUtb2Zmc2V0OiAycHg7IH1cbi5tdF9fY2hpcDpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNDU7IGN1cnNvcjogZGVmYXVsdDsgfVxuLm10X19sYWJlbCB7IGRpc3BsYXk6IC13ZWJraXQtYm94OyBtYXgtd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IGZvbnQtc2l6ZTogMTIuNXB4OyBmb250LXdlaWdodDogNjAwOyBsaW5lLWhlaWdodDogMS4yOyB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsgLXdlYmtpdC1saW5lLWNsYW1wOiAyOyAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsOyB9XG4ubXRfX2NoaXAtLW1vcmUgeyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTsgfVxuLm10X19jaGlwLS1tb3JlIC5tdF9fbGFiZWwgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyB9XG5AbWVkaWEgKG1heC13aWR0aDogNTk5cHgpIHtcbiAgLm10LS1NIC5tdF9fY2hpcHMgeyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCg0LCBtaW5tYXgoMCwgMWZyKSk7IGdhcDogOHB4OyB9XG4gIC5tdC0tWFMgLm10X19jaGlwcyB7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDYsIG1pbm1heCgwLCAxZnIpKTsgfVxuICAubXRfX2NoaXAgeyBwYWRkaW5nOiA4cHggNHB4OyB9XG4gIC5tdF9fbGFiZWwgeyBmb250LXNpemU6IDExLjVweDsgfVxufVxuLm10X19mb3JtIHsgcGFkZGluZy10b3A6IDEycHg7IGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTsgfVxuLm10X19mb3JtIGgzIHsgbWFyZ2luOiAwIDAgNHB4OyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cbi5tdF9fZm9ybS1hY3Rpb25zIHsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDsgZ2FwOiA4cHg7IH1cbi5tdCAubWFjcm9zX19maWVsZCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgZ2FwOiA4cHg7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgbWFyZ2luOiAxMHB4IDA7IGZvbnQtc2l6ZTogMTNweDsgfVxuLm10IC5tYWNyb3NfX2ZpZWxkIHRleHRhcmVhIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IHBhZGRpbmc6IDZweCAxMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IHdpZHRoOiAxNDBweDsgcmVzaXplOiBub25lOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9NYWNyb3NUaWxlLnZ1ZSJ9