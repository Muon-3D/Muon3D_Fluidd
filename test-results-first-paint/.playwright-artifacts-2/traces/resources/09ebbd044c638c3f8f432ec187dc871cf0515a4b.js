/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import FilamentActionsMixin from "/src/mixins/filament-actions.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { materialChoices } from "/src/services/control/model.ts";
import { EventBus } from "/src/eventBus.ts";
import { quickActions } from "/src/services/quick-actions/model.ts";
let QuickActionsMenu = class extends Mixins(MaintenanceMixin, FilamentActionsMixin) {
  open = false;
  /** The material to offer: the one loaded, else the one the heaters are set to, else PLA, else the first. */
  get preheatChoice() {
    const choices = materialChoices(this.materials);
    const heated = this.material ? choices.find((c) => c.presetId === this.material?.id) : void 0;
    return this.loadedMaterial ?? heated ?? choices.find((c) => /^pla$/i.test(c.name)) ?? choices[0] ?? null;
  }
  get macroList() {
    return this.$store.getters["macros/getMacros"] ?? [];
  }
  get levelRow() {
    return this.checks.find((c) => c.id === "bedMesh") ?? null;
  }
  get actions() {
    return quickActions({
      controlLock: this.controlLock,
      busy: this.busy,
      restartRefusal: this.restartRefusal,
      preheatName: this.preheatChoice?.name ?? null,
      changeFilament: this.changePlan.kind !== "none",
      changeFilamentReason: this.changePlan.kind === "none" ? this.changePlan.reason : void 0,
      levelGcode: this.levelRow?.gcode ?? null,
      levelBlocked: this.checksBlocked
    });
  }
  run(action) {
    if (action.reason) return;
    this.open = false;
    switch (action.id) {
      case "home":
        return this.home();
      case "preheat":
        return this.preheat();
      case "cool":
        return this.coolDown();
      case "filament":
        return this.changeFilament();
      case "level":
        return this.levelRow && this.runCheck(this.levelRow);
      case "motors":
        return this.motorsOff();
      case "restart":
        return this.restart();
    }
  }
  /** Mid-print this overwrites the running print's temperatures, so it asks first, as cool down does. */
  async preheat() {
    const choice = this.preheatChoice;
    if (!choice || !this.controlReady) return;
    const target = this.panelTarget;
    if (this.busy) {
      const ok = await this.$confirm("The printer is busy. The nozzle and bed go to the new temperatures, which can spoil the print.", {
        title: "Change the temperatures of the running print?",
        buttonTrueText: "Change them",
        buttonFalseText: "Leave them",
        danger: true
      });
      if (!ok || target !== this.panelTarget) return;
    }
    this.heatFor(choice);
  }
  /** Restart asks first (in sendTypedGcode); when it is refused, say why. */
  async restart() {
    if (await this.sendTypedGcode("RESTART")) return;
    if (this.commandRefusal) EventBus.$emit(this.commandRefusal, { type: "error", timeout: 6e3 });
  }
  /**
   * As Control's Filament card does it (FilamentActionsMixin, KAN-1700).
   * Mid-print: M600, which pauses the print, after its confirm. Idle: it
   * sends nothing and opens the material panel on Control, with Load and
   * Unload.
   */
  /** The material panel lives on Control's Filament card: open it there. */
  openFilamentPanel() {
    this.$router.push({ path: scopedPath("/control", activeSlug()), query: { filament: "open" } }).catch(() => {
    });
  }
  async changeFilament() {
    if (this.changePlan.kind === "panel") {
      this.openFilamentPanel();
      return;
    }
    await this.runFilamentPlan("change");
  }
};
QuickActionsMenu = __decorateClass([
  Component({})
], QuickActionsMenu);
const _sfc_main = QuickActionsMenu;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "bottom": "", "left": "", "offset-y": "", "nudge-bottom": "8", "min-width": "280", "max-width": "340", "content-class": "muon-account__menu" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "app-header__icon quick-actions__btn", class: { "quick-actions__btn--open": _vm.open }, attrs: { "type": "button", "aria-label": "Quick actions", "data-tid": "quick-actions" } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "bolt" } })], 1)];
  } }]), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c("div", { staticClass: "acct-menu", attrs: { "role": "menu", "aria-label": "Quick actions" } }, [_c("span", { staticClass: "acct-menu__caps" }, [_vm._v("Quick actions")]), _vm._l(_vm.actions, function(a, i) {
    return [a.id === "restart" ? _c("div", { key: `rule-${i}`, staticClass: "acct-menu__rule" }) : _vm._e(), _c("button", { key: a.id, staticClass: "acct-menu__item quick-actions__item", class: { "quick-actions__item--off": !!a.reason }, attrs: { "type": "button", "role": "menuitem", "aria-disabled": a.reason ? "true" : void 0, "title": a.reason || void 0, "data-tid": `quick-${a.id}` }, on: { "click": function($event) {
      return _vm.run(a);
    } } }, [_c(__unplugin_components_2, { attrs: { "name": a.icon, "small": "" } }), _c("span", { staticClass: "quick-actions__text" }, [_c("span", { staticClass: "quick-actions__label" }, [_vm._v(_vm._s(a.label))]), a.reason ? _c("span", { staticClass: "quick-actions__reason", attrs: { "data-tid": `quick-${a.id}-reason` } }, [_vm._v(_vm._s(a.reason))]) : _vm._e()]), a.hint && !a.reason ? _c("span", { staticClass: "acct-menu__key" }, [_vm._v(_vm._s(a.hint))]) : _vm._e()], 1)];
  })], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/QuickActionsMenu.vue?vue&type=style&index=0&scoped=3fd7a48c&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3fd7a48c",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/QuickActionsMenu.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBY0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBdkZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlF1aWNrQWN0aW9uc01lbnUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtbWVudVxuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICBib3R0b21cbiAgICBsZWZ0XG4gICAgb2Zmc2V0LXlcbiAgICBudWRnZS1ib3R0b209XCI4XCJcbiAgICBtaW4td2lkdGg9XCIyODBcIlxuICAgIG1heC13aWR0aD1cIjM0MFwiXG4gICAgY29udGVudC1jbGFzcz1cIm11b24tYWNjb3VudF9fbWVudVwiXG4gID5cbiAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiYXBwLWhlYWRlcl9faWNvbiBxdWljay1hY3Rpb25zX19idG5cIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdxdWljay1hY3Rpb25zX19idG4tLW9wZW4nOiBvcGVuIH1cIlxuICAgICAgICBhcmlhLWxhYmVsPVwiUXVpY2sgYWN0aW9uc1wiXG4gICAgICAgIGRhdGEtdGlkPVwicXVpY2stYWN0aW9uc1wiXG4gICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImJvbHRcIiAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cImFjY3QtbWVudVwiXG4gICAgICByb2xlPVwibWVudVwiXG4gICAgICBhcmlhLWxhYmVsPVwiUXVpY2sgYWN0aW9uc1wiXG4gICAgPlxuICAgICAgPHNwYW4gY2xhc3M9XCJhY2N0LW1lbnVfX2NhcHNcIj5RdWljayBhY3Rpb25zPC9zcGFuPlxuICAgICAgPHRlbXBsYXRlIHYtZm9yPVwiKGEsIGkpIGluIGFjdGlvbnNcIj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJhLmlkID09PSAncmVzdGFydCdcIlxuICAgICAgICAgIDprZXk9XCJgcnVsZS0ke2l9YFwiXG4gICAgICAgICAgY2xhc3M9XCJhY2N0LW1lbnVfX3J1bGVcIlxuICAgICAgICAvPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgOmtleT1cImEuaWRcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiYWNjdC1tZW51X19pdGVtIHF1aWNrLWFjdGlvbnNfX2l0ZW1cIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ3F1aWNrLWFjdGlvbnNfX2l0ZW0tLW9mZic6ICEhYS5yZWFzb24gfVwiXG4gICAgICAgICAgcm9sZT1cIm1lbnVpdGVtXCJcbiAgICAgICAgICA6YXJpYS1kaXNhYmxlZD1cImEucmVhc29uID8gJ3RydWUnIDogdW5kZWZpbmVkXCJcbiAgICAgICAgICA6dGl0bGU9XCJhLnJlYXNvbiB8fCB1bmRlZmluZWRcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBxdWljay0ke2EuaWR9YFwiXG4gICAgICAgICAgQGNsaWNrPVwicnVuKGEpXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICA6bmFtZT1cImEuaWNvblwiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWljay1hY3Rpb25zX190ZXh0XCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInF1aWNrLWFjdGlvbnNfX2xhYmVsXCI+e3sgYS5sYWJlbCB9fTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIHYtaWY9XCJhLnJlYXNvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwicXVpY2stYWN0aW9uc19fcmVhc29uXCJcbiAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHF1aWNrLSR7YS5pZH0tcmVhc29uYFwiXG4gICAgICAgICAgICA+e3sgYS5yZWFzb24gfX08L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICB2LWlmPVwiYS5oaW50ICYmICFhLnJlYXNvblwiXG4gICAgICAgICAgICBjbGFzcz1cImFjY3QtbWVudV9fa2V5XCJcbiAgICAgICAgICA+e3sgYS5oaW50IH19PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gIDwvdi1tZW51PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNYWludGVuYW5jZU1peGluIGZyb20gJ0AvbWl4aW5zL21haW50ZW5hbmNlJ1xuaW1wb3J0IEZpbGFtZW50QWN0aW9uc01peGluIGZyb20gJ0AvbWl4aW5zL2ZpbGFtZW50LWFjdGlvbnMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBtYXRlcmlhbENob2ljZXMsIHR5cGUgTWF0ZXJpYWxDaG9pY2UgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvbW9kZWwnXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgeyBxdWlja0FjdGlvbnMsIHR5cGUgUXVpY2tBY3Rpb24gfSBmcm9tICdAL3NlcnZpY2VzL3F1aWNrLWFjdGlvbnMvbW9kZWwnXG5cbmludGVyZmFjZSBNYWNyb0xpa2Uge1xuICBuYW1lPzogdW5rbm93bjtcbiAgY29uZmlnPzogeyBnY29kZT86IHVua25vd24gfTtcbn1cblxuLyoqXG4gKiBUaGUgdG9wIGJhcidzIFF1aWNrIGFjdGlvbnM6IHRoZSB0aGluZ3MgZG9uZSBtb3N0LCBhIHByZXNzIGVhY2guIEV2ZXJ5IG9uZVxuICogaXMgdGhlIGNvbW1hbmQgQ29udHJvbCBhbHJlYWR5IHNlbmRzIChpdHMgaG9tZSwgcHJlaGVhdCwgY29vbCBkb3duLFxuICogZmlsYW1lbnQgbWFjcm9zLCBMZXZlbCB0aGUgYmVkLCBtb3RvcnMgb2ZmIGFuZCBLbGlwcGVyIHJlc3RhcnQpLCBnYXRlZCB0aGVcbiAqIHNhbWUgd2F5LCBhbmQgc2F5cyBpbiBwbGFpbiB3b3JkcyB3aHkgaXQgY2Fubm90IGJlIHVzZWQgd2hlbiBpdCBjYW5ub3QuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRdWlja0FjdGlvbnNNZW51IGV4dGVuZHMgTWl4aW5zKE1haW50ZW5hbmNlTWl4aW4sIEZpbGFtZW50QWN0aW9uc01peGluKSB7XG4gIG9wZW4gPSBmYWxzZVxuXG4gIC8qKiBUaGUgbWF0ZXJpYWwgdG8gb2ZmZXI6IHRoZSBvbmUgbG9hZGVkLCBlbHNlIHRoZSBvbmUgdGhlIGhlYXRlcnMgYXJlIHNldCB0bywgZWxzZSBQTEEsIGVsc2UgdGhlIGZpcnN0LiAqL1xuICBnZXQgcHJlaGVhdENob2ljZSAoKTogTWF0ZXJpYWxDaG9pY2UgfCBudWxsIHtcbiAgICBjb25zdCBjaG9pY2VzID0gbWF0ZXJpYWxDaG9pY2VzKHRoaXMubWF0ZXJpYWxzKVxuICAgIGNvbnN0IGhlYXRlZCA9IHRoaXMubWF0ZXJpYWwgPyBjaG9pY2VzLmZpbmQoYyA9PiBjLnByZXNldElkID09PSB0aGlzLm1hdGVyaWFsPy5pZCkgOiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5sb2FkZWRNYXRlcmlhbCA/PyBoZWF0ZWQgPz8gY2hvaWNlcy5maW5kKGMgPT4gL15wbGEkL2kudGVzdChjLm5hbWUpKSA/PyBjaG9pY2VzWzBdID8/IG51bGxcbiAgfVxuXG4gIGdldCBtYWNyb0xpc3QgKCk6IE1hY3JvTGlrZVtdIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ21hY3Jvcy9nZXRNYWNyb3MnXSBhcyBNYWNyb0xpa2VbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgfVxuXG4gIGdldCBsZXZlbFJvdyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2tzLmZpbmQoYyA9PiBjLmlkID09PSAnYmVkTWVzaCcpID8/IG51bGxcbiAgfVxuXG4gIGdldCBhY3Rpb25zICgpOiBRdWlja0FjdGlvbltdIHtcbiAgICByZXR1cm4gcXVpY2tBY3Rpb25zKHtcbiAgICAgIGNvbnRyb2xMb2NrOiB0aGlzLmNvbnRyb2xMb2NrLFxuICAgICAgYnVzeTogdGhpcy5idXN5LFxuICAgICAgcmVzdGFydFJlZnVzYWw6IHRoaXMucmVzdGFydFJlZnVzYWwsXG4gICAgICBwcmVoZWF0TmFtZTogdGhpcy5wcmVoZWF0Q2hvaWNlPy5uYW1lID8/IG51bGwsXG4gICAgICBjaGFuZ2VGaWxhbWVudDogdGhpcy5jaGFuZ2VQbGFuLmtpbmQgIT09ICdub25lJyxcbiAgICAgIGNoYW5nZUZpbGFtZW50UmVhc29uOiB0aGlzLmNoYW5nZVBsYW4ua2luZCA9PT0gJ25vbmUnID8gdGhpcy5jaGFuZ2VQbGFuLnJlYXNvbiA6IHVuZGVmaW5lZCxcbiAgICAgIGxldmVsR2NvZGU6IHRoaXMubGV2ZWxSb3c/Lmdjb2RlID8/IG51bGwsXG4gICAgICBsZXZlbEJsb2NrZWQ6IHRoaXMuY2hlY2tzQmxvY2tlZFxuICAgIH0pXG4gIH1cblxuICBydW4gKGFjdGlvbjogUXVpY2tBY3Rpb24pIHtcbiAgICAvLyBEaXNhYmxlZCBpbiB3b3Jkcywgbm90IGJ5IHRoZSBicm93c2VyLCBzbyB0aGUgcmVhc29uIHN0YXlzIHJlYWRhYmxlIGFuZCBmb2N1c2FibGUuXG4gICAgaWYgKGFjdGlvbi5yZWFzb24pIHJldHVyblxuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgc3dpdGNoIChhY3Rpb24uaWQpIHtcbiAgICAgIGNhc2UgJ2hvbWUnOiByZXR1cm4gdGhpcy5ob21lKClcbiAgICAgIGNhc2UgJ3ByZWhlYXQnOiByZXR1cm4gdGhpcy5wcmVoZWF0KClcbiAgICAgIGNhc2UgJ2Nvb2wnOiByZXR1cm4gdGhpcy5jb29sRG93bigpXG4gICAgICBjYXNlICdmaWxhbWVudCc6IHJldHVybiB0aGlzLmNoYW5nZUZpbGFtZW50KClcbiAgICAgIGNhc2UgJ2xldmVsJzogcmV0dXJuIHRoaXMubGV2ZWxSb3cgJiYgdGhpcy5ydW5DaGVjayh0aGlzLmxldmVsUm93KVxuICAgICAgY2FzZSAnbW90b3JzJzogcmV0dXJuIHRoaXMubW90b3JzT2ZmKClcbiAgICAgIGNhc2UgJ3Jlc3RhcnQnOiByZXR1cm4gdGhpcy5yZXN0YXJ0KClcbiAgICB9XG4gIH1cblxuICAvKiogTWlkLXByaW50IHRoaXMgb3ZlcndyaXRlcyB0aGUgcnVubmluZyBwcmludCdzIHRlbXBlcmF0dXJlcywgc28gaXQgYXNrcyBmaXJzdCwgYXMgY29vbCBkb3duIGRvZXMuICovXG4gIGFzeW5jIHByZWhlYXQgKCkge1xuICAgIGNvbnN0IGNob2ljZSA9IHRoaXMucHJlaGVhdENob2ljZVxuICAgIGlmICghY2hvaWNlIHx8ICF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5wYW5lbFRhcmdldFxuICAgIGlmICh0aGlzLmJ1c3kpIHtcbiAgICAgIGNvbnN0IG9rID0gYXdhaXQgdGhpcy4kY29uZmlybSgnVGhlIHByaW50ZXIgaXMgYnVzeS4gVGhlIG5venpsZSBhbmQgYmVkIGdvIHRvIHRoZSBuZXcgdGVtcGVyYXR1cmVzLCB3aGljaCBjYW4gc3BvaWwgdGhlIHByaW50LicsIHtcbiAgICAgICAgdGl0bGU6ICdDaGFuZ2UgdGhlIHRlbXBlcmF0dXJlcyBvZiB0aGUgcnVubmluZyBwcmludD8nLFxuICAgICAgICBidXR0b25UcnVlVGV4dDogJ0NoYW5nZSB0aGVtJyxcbiAgICAgICAgYnV0dG9uRmFsc2VUZXh0OiAnTGVhdmUgdGhlbScsXG4gICAgICAgIGRhbmdlcjogdHJ1ZVxuICAgICAgfSlcbiAgICAgIGlmICghb2sgfHwgdGFyZ2V0ICE9PSB0aGlzLnBhbmVsVGFyZ2V0KSByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5oZWF0Rm9yKGNob2ljZSlcbiAgfVxuXG4gIC8qKiBSZXN0YXJ0IGFza3MgZmlyc3QgKGluIHNlbmRUeXBlZEdjb2RlKTsgd2hlbiBpdCBpcyByZWZ1c2VkLCBzYXkgd2h5LiAqL1xuICBhc3luYyByZXN0YXJ0ICgpIHtcbiAgICBpZiAoYXdhaXQgdGhpcy5zZW5kVHlwZWRHY29kZSgnUkVTVEFSVCcpKSByZXR1cm5cbiAgICBpZiAodGhpcy5jb21tYW5kUmVmdXNhbCkgRXZlbnRCdXMuJGVtaXQodGhpcy5jb21tYW5kUmVmdXNhbCwgeyB0eXBlOiAnZXJyb3InLCB0aW1lb3V0OiA2MDAwIH0pXG4gIH1cblxuICAvKipcbiAgICogQXMgQ29udHJvbCdzIEZpbGFtZW50IGNhcmQgZG9lcyBpdCAoRmlsYW1lbnRBY3Rpb25zTWl4aW4sIEtBTi0xNzAwKS5cbiAgICogTWlkLXByaW50OiBNNjAwLCB3aGljaCBwYXVzZXMgdGhlIHByaW50LCBhZnRlciBpdHMgY29uZmlybS4gSWRsZTogaXRcbiAgICogc2VuZHMgbm90aGluZyBhbmQgb3BlbnMgdGhlIG1hdGVyaWFsIHBhbmVsIG9uIENvbnRyb2wsIHdpdGggTG9hZCBhbmRcbiAgICogVW5sb2FkLlxuICAgKi9cbiAgLyoqIFRoZSBtYXRlcmlhbCBwYW5lbCBsaXZlcyBvbiBDb250cm9sJ3MgRmlsYW1lbnQgY2FyZDogb3BlbiBpdCB0aGVyZS4gKi9cbiAgb3BlbkZpbGFtZW50UGFuZWwgKCkge1xuICAgIHRoaXMuJHJvdXRlci5wdXNoKHsgcGF0aDogc2NvcGVkUGF0aCgnL2NvbnRyb2wnLCBhY3RpdmVTbHVnKCkpLCBxdWVyeTogeyBmaWxhbWVudDogJ29wZW4nIH0gfSkuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICBhc3luYyBjaGFuZ2VGaWxhbWVudCAoKSB7XG4gICAgaWYgKHRoaXMuY2hhbmdlUGxhbi5raW5kID09PSAncGFuZWwnKSB7XG4gICAgICB0aGlzLm9wZW5GaWxhbWVudFBhbmVsKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJ1bkZpbGFtZW50UGxhbignY2hhbmdlJylcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnF1aWNrLWFjdGlvbnNfX2J0bi0tb3BlbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5xdWljay1hY3Rpb25zX19pdGVtIHtcbiAgICBtaW4taGVpZ2h0OiA0MHB4O1xuICAgIHBhZGRpbmctdG9wOiA2cHg7XG4gICAgcGFkZGluZy1ib3R0b206IDZweDtcbiAgfVxuXG4gIC5xdWljay1hY3Rpb25zX19pdGVtLS1vZmYge1xuICAgIGN1cnNvcjogZGVmYXVsdDtcblxuICAgIC5xdWljay1hY3Rpb25zX19sYWJlbCxcbiAgICAuZnJhbWUtaWNvbiB7XG4gICAgICBvcGFjaXR5OiAwLjU1O1xuICAgIH1cblxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgLnF1aWNrLWFjdGlvbnNfX3RleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAucXVpY2stYWN0aW9uc19fcmVhc29uIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgZm9udC13ZWlnaHQ6IDQwMDtcbiAgICB3aGl0ZS1zcGFjZTogbm9ybWFsO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbGF5b3V0L1F1aWNrQWN0aW9uc01lbnUudnVlIn0=