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
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { restartReason } from "/src/services/quick-actions/model.ts";
import {
  RESTART_COMMANDS,
  coveredElsewhere,
  quickCommandIcon,
  quickCommandLabel,
  quickCommandReason
} from "/src/services/control/quick-commands.ts";
import { quickCommandEligible } from "/src/services/control/quick-command-picks.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
let ControlQuickCommands = class extends Mixins(MacroRunMixin) {
  TOP = 5;
  all = false;
  get commands() {
    const byScore = (a, b) => b.score - a.score || a.name.localeCompare(b.name);
    return this.arrangedMacros.filter((m) => quickCommandEligible(m) && !coveredElsewhere(m.name) && !RESTART_COMMANDS.some((r) => r.name === m.name.toUpperCase())).sort((a, b) => Number(!!b.userGroup) - Number(!!a.userGroup) || byScore(a, b)).map((m) => ({
      name: m.name,
      label: quickCommandLabel(m.name, m.description),
      icon: quickCommandIcon(m.group, m.name),
      reason: quickCommandReason({ controlLock: this.controlLock, busy: this.busy, disabledWhilePrinting: m.disabledWhilePrinting }),
      tooltip: this.tooltipOf(m),
      params: m.params,
      macro: m
    }));
  }
  /**
   * What shows before All commands: the ones ticked on the Macros page's Quick
   * commands section (KAN-2122), in that order, else the first few.
   */
  get shownDefault() {
    const picks = this.quickCommandPicks;
    if (picks === null) return this.commands.slice(0, this.TOP);
    const byName = new Map(this.commands.map((c) => [c.name.toUpperCase(), c]));
    return picks.map((p) => byName.get(p)).filter((c) => !!c);
  }
  get shown() {
    return this.all ? this.commands : this.shownDefault;
  }
  get restarts() {
    return RESTART_COMMANDS.map((r) => ({ ...r, reason: restartReason(this.restartRefusal) }));
  }
  runCommand(c) {
    if (c.reason) return;
    this.run(c.macro);
  }
  restartWith(r) {
    if (r.reason) return;
    this.sendTypedGcode(r.name);
  }
  get arrangeLink() {
    return `${scopedPath("/settings", activeSlug())}#macros`;
  }
};
ControlQuickCommands = __decorateClass([
  Component({ components: { ControlCard } })
], ControlQuickCommands);
const _sfc_main = ControlQuickCommands;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": "Quick commands", "icon": "bolt", "locked": _vm.controlLock, "data-tid": "control-quick" }, scopedSlots: _vm._u([{ key: "aside", fn: function() {
    return [_vm.commands.length > _vm.shownDefault.length ? _c("button", { staticClass: "qc__all", attrs: { "type": "button", "aria-expanded": _vm.all ? "true" : "false", "data-tid": "quick-all" }, on: { "click": function($event) {
      _vm.all = !_vm.all;
    } } }, [_vm._v(" " + _vm._s(_vm.all ? "Fewer" : "All commands") + " ")]) : _vm._e(), _c("a", { staticClass: "qc__arrange", attrs: { "href": _vm.arrangeLink, "title": "Choose which quick commands show here and on Overview, on the Macros page", "data-tid": "quick-manage" }, on: { "click": function($event) {
      $event.preventDefault();
      return _vm.$router.push(_vm.arrangeLink);
    } } }, [_vm._v("Manage in Macros")])];
  }, proxy: true }]) }, [_c("div", { staticClass: "qc", attrs: { "role": "list" } }, [_vm._l(_vm.shown, function(c) {
    return _c("button", { key: c.name, staticClass: "qc__row", class: { "qc__row--off": !!c.reason }, attrs: { "type": "button", "role": "listitem", "aria-disabled": c.reason ? "true" : void 0, "title": c.tooltip, "data-tid": `qc-${c.name}` }, on: { "click": function($event) {
      return _vm.runCommand(c);
    } } }, [_c(__unplugin_components_0, { attrs: { "name": c.icon, "small": "" } }), _c("span", { staticClass: "qc__text" }, [_c("b", [_vm._v(_vm._s(c.label))]), c.reason ? _c("small", { attrs: { "data-tid": `qc-${c.name}-reason` } }, [_vm._v(_vm._s(c.reason))]) : c.params.length ? _c("small", [_vm._v("Asks for " + _vm._s(c.params.join(", ")))]) : _vm._e()]), _c("kbd", [_vm._v(_vm._s(c.name))])], 1);
  }), !_vm.commands.length ? _c("p", { staticClass: "qc__none" }, [_vm._v(" No macros to show here. Quick actions and Filament have the everyday ones. ")]) : _vm._e(), _c("div", { staticClass: "qc__rule", attrs: { "role": "separator" } }), _vm._l(_vm.restarts, function(r) {
    return _c("button", { key: r.name, staticClass: "qc__row qc__row--danger", class: { "qc__row--off": !!r.reason }, attrs: { "type": "button", "role": "listitem", "aria-disabled": r.reason ? "true" : void 0, "data-tid": `qc-${r.name}` }, on: { "click": function($event) {
      return _vm.restartWith(r);
    } } }, [_c(__unplugin_components_1, { attrs: { "name": "refresh", "small": "" } }), _c("span", { staticClass: "qc__text" }, [_c("b", [_vm._v(_vm._s(r.label))]), r.reason ? _c("small", [_vm._v(_vm._s(r.reason))]) : _vm._e()]), _c("kbd", [_vm._v(_vm._s(r.name))])], 1);
  })], 2), _vm.commandRefusal ? _c("p", { staticClass: "qc__refusal", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.commandRefusal) + " ")]) : _vm._e(), _vm.selected ? _c("form", { staticClass: "macros__values", attrs: { "data-tid": "macro-send", "aria-label": "Quick command values" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.submitMacro.apply(null, arguments);
  } } }, [_c("h3", [_vm._v(_vm._s(_vm.selected.title))]), _c("p", [_vm._v(_vm._s(_vm.selected.description))]), _vm._l(_vm.fields, function(field) {
    return _c("label", { key: field.name, staticClass: "macros__field" }, [_c("span", [_vm._v(_vm._s(field.name) + " \xB7 " + _vm._s(field.optional ? `optional${field.defaultValue ? ` \xB7 default ${field.defaultValue}` : " \xB7 uses the command\u2019s own value"}` : "required"))]), _c("textarea", { directives: [{ name: "model", rawName: "v-model", value: _vm.values[field.name], expression: "values[field.name]" }], attrs: { "rows": "1", "aria-label": `Value ${field.name}`, "autocomplete": "off" }, domProps: { "value": _vm.values[field.name] }, on: { "input": function($event) {
      if ($event.target.composing) return;
      _vm.$set(_vm.values, field.name, $event.target.value);
    } } })]);
  }), _c("p", [_vm._v("Sends "), _c("code", [_vm._v(_vm._s(_vm.preview || "check the values"))])]), _vm.formError ? _c("p", { attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.formError) + " ")]) : _vm._e(), _c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.selected = null;
  } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "disabled": !_vm.controlReady } }, [_vm._v(" Run ")])], 2) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlQuickCommands.vue?vue&type=style&index=0&scoped=ce507a73&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ce507a73",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlQuickCommands.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBaUpBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE9BQ0E7QUFDQTtBQUNBO0FBc0JBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQSwrQkFFQSxzSUFDQSwrRUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBdERBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2xRdWlja0NvbW1hbmRzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxjb250cm9sLWNhcmRcbiAgICB0aXRsZT1cIlF1aWNrIGNvbW1hbmRzXCJcbiAgICBpY29uPVwiYm9sdFwiXG4gICAgOmxvY2tlZD1cImNvbnRyb2xMb2NrXCJcbiAgICBkYXRhLXRpZD1cImNvbnRyb2wtcXVpY2tcIlxuICA+XG4gICAgPHRlbXBsYXRlICNhc2lkZT5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cImNvbW1hbmRzLmxlbmd0aCA+IHNob3duRGVmYXVsdC5sZW5ndGhcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJxY19fYWxsXCJcbiAgICAgICAgOmFyaWEtZXhwYW5kZWQ9XCJhbGwgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgZGF0YS10aWQ9XCJxdWljay1hbGxcIlxuICAgICAgICBAY2xpY2s9XCJhbGwgPSAhYWxsXCJcbiAgICAgID5cbiAgICAgICAge3sgYWxsID8gJ0Zld2VyJyA6ICdBbGwgY29tbWFuZHMnIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxhXG4gICAgICAgIGNsYXNzPVwicWNfX2FycmFuZ2VcIlxuICAgICAgICA6aHJlZj1cImFycmFuZ2VMaW5rXCJcbiAgICAgICAgdGl0bGU9XCJDaG9vc2Ugd2hpY2ggcXVpY2sgY29tbWFuZHMgc2hvdyBoZXJlIGFuZCBvbiBPdmVydmlldywgb24gdGhlIE1hY3JvcyBwYWdlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJxdWljay1tYW5hZ2VcIlxuICAgICAgICBAY2xpY2sucHJldmVudD1cIiRyb3V0ZXIucHVzaChhcnJhbmdlTGluaylcIlxuICAgICAgPk1hbmFnZSBpbiBNYWNyb3M8L2E+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDxkaXZcbiAgICAgIGNsYXNzPVwicWNcIlxuICAgICAgcm9sZT1cImxpc3RcIlxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1mb3I9XCJjIGluIHNob3duXCJcbiAgICAgICAgOmtleT1cImMubmFtZVwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICByb2xlPVwibGlzdGl0ZW1cIlxuICAgICAgICBjbGFzcz1cInFjX19yb3dcIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdxY19fcm93LS1vZmYnOiAhIWMucmVhc29uIH1cIlxuICAgICAgICA6YXJpYS1kaXNhYmxlZD1cImMucmVhc29uID8gJ3RydWUnIDogdW5kZWZpbmVkXCJcbiAgICAgICAgOnRpdGxlPVwiYy50b29sdGlwXCJcbiAgICAgICAgOmRhdGEtdGlkPVwiYHFjLSR7Yy5uYW1lfWBcIlxuICAgICAgICBAY2xpY2s9XCJydW5Db21tYW5kKGMpXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICA6bmFtZT1cImMuaWNvblwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxY19fdGV4dFwiPlxuICAgICAgICAgIDxiPnt7IGMubGFiZWwgfX08L2I+XG4gICAgICAgICAgPHNtYWxsXG4gICAgICAgICAgICB2LWlmPVwiYy5yZWFzb25cIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHFjLSR7Yy5uYW1lfS1yZWFzb25gXCJcbiAgICAgICAgICA+e3sgYy5yZWFzb24gfX08L3NtYWxsPlxuICAgICAgICAgIDxzbWFsbCB2LWVsc2UtaWY9XCJjLnBhcmFtcy5sZW5ndGhcIj5Bc2tzIGZvciB7eyBjLnBhcmFtcy5qb2luKCcsICcpIH19PC9zbWFsbD5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8a2JkPnt7IGMubmFtZSB9fTwva2JkPlxuICAgICAgPC9idXR0b24+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwiIWNvbW1hbmRzLmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwicWNfX25vbmVcIlxuICAgICAgPlxuICAgICAgICBObyBtYWNyb3MgdG8gc2hvdyBoZXJlLiBRdWljayBhY3Rpb25zIGFuZCBGaWxhbWVudCBoYXZlIHRoZSBldmVyeWRheSBvbmVzLlxuICAgICAgPC9wPlxuICAgICAgPGRpdlxuICAgICAgICBjbGFzcz1cInFjX19ydWxlXCJcbiAgICAgICAgcm9sZT1cInNlcGFyYXRvclwiXG4gICAgICAvPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWZvcj1cInIgaW4gcmVzdGFydHNcIlxuICAgICAgICA6a2V5PVwici5uYW1lXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIHJvbGU9XCJsaXN0aXRlbVwiXG4gICAgICAgIGNsYXNzPVwicWNfX3JvdyBxY19fcm93LS1kYW5nZXJcIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdxY19fcm93LS1vZmYnOiAhIXIucmVhc29uIH1cIlxuICAgICAgICA6YXJpYS1kaXNhYmxlZD1cInIucmVhc29uID8gJ3RydWUnIDogdW5kZWZpbmVkXCJcbiAgICAgICAgOmRhdGEtdGlkPVwiYHFjLSR7ci5uYW1lfWBcIlxuICAgICAgICBAY2xpY2s9XCJyZXN0YXJ0V2l0aChyKVwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cInJlZnJlc2hcIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicWNfX3RleHRcIj5cbiAgICAgICAgICA8Yj57eyByLmxhYmVsIH19PC9iPlxuICAgICAgICAgIDxzbWFsbCB2LWlmPVwici5yZWFzb25cIj57eyByLnJlYXNvbiB9fTwvc21hbGw+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGtiZD57eyByLm5hbWUgfX08L2tiZD5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxwXG4gICAgICB2LWlmPVwiY29tbWFuZFJlZnVzYWxcIlxuICAgICAgY2xhc3M9XCJxY19fcmVmdXNhbFwiXG4gICAgICByb2xlPVwiYWxlcnRcIlxuICAgID5cbiAgICAgIHt7IGNvbW1hbmRSZWZ1c2FsIH19XG4gICAgPC9wPlxuXG4gICAgPGZvcm1cbiAgICAgIHYtaWY9XCJzZWxlY3RlZFwiXG4gICAgICBjbGFzcz1cIm1hY3Jvc19fdmFsdWVzXCJcbiAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2VuZFwiXG4gICAgICBhcmlhLWxhYmVsPVwiUXVpY2sgY29tbWFuZCB2YWx1ZXNcIlxuICAgICAgQHN1Ym1pdC5wcmV2ZW50PVwic3VibWl0TWFjcm9cIlxuICAgID5cbiAgICAgIDxoMz57eyBzZWxlY3RlZC50aXRsZSB9fTwvaDM+XG4gICAgICA8cD57eyBzZWxlY3RlZC5kZXNjcmlwdGlvbiB9fTwvcD5cbiAgICAgIDxsYWJlbFxuICAgICAgICB2LWZvcj1cImZpZWxkIGluIGZpZWxkc1wiXG4gICAgICAgIDprZXk9XCJmaWVsZC5uYW1lXCJcbiAgICAgICAgY2xhc3M9XCJtYWNyb3NfX2ZpZWxkXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4+e3sgZmllbGQubmFtZSB9fSDCtyB7eyBmaWVsZC5vcHRpb25hbCA/IGBvcHRpb25hbCR7ZmllbGQuZGVmYXVsdFZhbHVlID8gYCDCtyBkZWZhdWx0ICR7ZmllbGQuZGVmYXVsdFZhbHVlfWAgOiAnIMK3IHVzZXMgdGhlIGNvbW1hbmTigJlzIG93biB2YWx1ZSd9YCA6ICdyZXF1aXJlZCcgfX08L3NwYW4+XG4gICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgIHYtbW9kZWw9XCJ2YWx1ZXNbZmllbGQubmFtZV1cIlxuICAgICAgICAgIHJvd3M9XCIxXCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cImBWYWx1ZSAke2ZpZWxkLm5hbWV9YFwiXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgLz5cbiAgICAgIDwvbGFiZWw+XG4gICAgICA8cD5TZW5kcyA8Y29kZT57eyBwcmV2aWV3IHx8ICdjaGVjayB0aGUgdmFsdWVzJyB9fTwvY29kZT48L3A+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwiZm9ybUVycm9yXCJcbiAgICAgICAgcm9sZT1cImFsZXJ0XCJcbiAgICAgID5cbiAgICAgICAge3sgZm9ybUVycm9yIH19XG4gICAgICA8L3A+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICBAY2xpY2s9XCJzZWxlY3RlZCA9IG51bGxcIlxuICAgICAgPlxuICAgICAgICBDYW5jZWxcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgID5cbiAgICAgICAgUnVuXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Zvcm0+XG4gIDwvY29udHJvbC1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNYWNyb1J1bk1peGluIGZyb20gJ0AvbWl4aW5zL21hY3JvLXJ1bidcbmltcG9ydCB0eXBlIHsgU2hvd25NYWNybyB9IGZyb20gJ0AvbWl4aW5zL21hY3JvcydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IHJlc3RhcnRSZWFzb24gfSBmcm9tICdAL3NlcnZpY2VzL3F1aWNrLWFjdGlvbnMvbW9kZWwnXG5pbXBvcnQge1xuICBSRVNUQVJUX0NPTU1BTkRTLCBjb3ZlcmVkRWxzZXdoZXJlLCBxdWlja0NvbW1hbmRJY29uLCBxdWlja0NvbW1hbmRMYWJlbCwgcXVpY2tDb21tYW5kUmVhc29uXG59IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9xdWljay1jb21tYW5kcydcbmltcG9ydCB7IHF1aWNrQ29tbWFuZEVsaWdpYmxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3F1aWNrLWNvbW1hbmQtcGlja3MnXG5pbXBvcnQgQ29udHJvbENhcmQgZnJvbSAnLi9Db250cm9sQ2FyZC52dWUnXG5cbmludGVyZmFjZSBRdWlja0NvbW1hbmQge1xuICBuYW1lOiBzdHJpbmdcbiAgbGFiZWw6IHN0cmluZ1xuICBpY29uOiBzdHJpbmdcbiAgcmVhc29uOiBzdHJpbmdcbiAgdG9vbHRpcDogc3RyaW5nXG4gIHBhcmFtczogc3RyaW5nW11cbiAgbWFjcm86IFNob3duTWFjcm9cbn1cblxuLyoqXG4gKiBRdWljayBjb21tYW5kczogdGhlIHByaW50ZXIncyBtYWNyb3MgYXMgcm93cyBpbiB0aGUgdG9wIGJhcidzIFF1aWNrXG4gKiBhY3Rpb25zIHN0eWxlOiBhbiBpY29uLCBhIHBsYWluLXdvcmRzIG5hbWUsIHRoZSBtYWNybyBhcyBhIG11dGVkIGhpbnQsXG4gKiB0aGUgcmVhc29uIHdoZW4gaXQgY2FuJ3QgcnVuLCBhbmQgdGhlIGZpcm13YXJlIHJlc3RhcnQgaW4gcmVkIGJlbG93IGFcbiAqIHJ1bGUuIFdoYXQgUXVpY2sgYWN0aW9ucyBvciB0aGUgRmlsYW1lbnQgdGlsZSBhbHJlYWR5IGRvIGlzIGxlZnQgb3V0XG4gKiAoc2VydmljZXMvY29udHJvbC9xdWljay1jb21tYW5kcykuIEhpZGRlbiBtYWNyb3MgYW5kIGdyb3VwcyBmb2xsb3dcbiAqIFNldHRpbmdzIOKAuiBNYWNyb3MuIEEgbWFjcm8gdGhhdCBuZWVkcyB2YWx1ZXMgb3BlbnMgdGhlIHZhbHVlcyBmb3JtOyBhXG4gKiByZXN0YXJ0IGFza3MgZmlyc3QsIGFzIGV2ZXJ5d2hlcmUgKFR5cGVkQ29tbWFuZHNNaXhpbikuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENvbnRyb2xDYXJkIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnRyb2xRdWlja0NvbW1hbmRzIGV4dGVuZHMgTWl4aW5zKE1hY3JvUnVuTWl4aW4pIHtcbiAgcmVhZG9ubHkgVE9QID0gNVxuICBhbGwgPSBmYWxzZVxuXG4gIGdldCBjb21tYW5kcyAoKTogUXVpY2tDb21tYW5kW10ge1xuICAgIGNvbnN0IGJ5U2NvcmUgPSAoYTogU2hvd25NYWNybywgYjogU2hvd25NYWNybykgPT4gYi5zY29yZSAtIGEuc2NvcmUgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKVxuICAgIHJldHVybiB0aGlzLmFycmFuZ2VkTWFjcm9zXG4gICAgICAvLyBPbmUgcnVsZSB3aXRoIHRoZSBPdmVydmlldyB0aWxlIGFuZCB0aGUgTWFjcm9zIHBhZ2UncyB0aWNrIGxpc3Q6IG5ldmVyIHRoZSBwcmludCBjb250cm9scyAocXVpY2stY29tbWFuZC1waWNrcykuXG4gICAgICAuZmlsdGVyKG0gPT4gcXVpY2tDb21tYW5kRWxpZ2libGUobSkgJiYgIWNvdmVyZWRFbHNld2hlcmUobS5uYW1lKSAmJiAhUkVTVEFSVF9DT01NQU5EUy5zb21lKHIgPT4gci5uYW1lID09PSBtLm5hbWUudG9VcHBlckNhc2UoKSkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gTnVtYmVyKCEhYi51c2VyR3JvdXApIC0gTnVtYmVyKCEhYS51c2VyR3JvdXApIHx8IGJ5U2NvcmUoYSwgYikpXG4gICAgICAubWFwKG0gPT4gKHtcbiAgICAgICAgbmFtZTogbS5uYW1lLFxuICAgICAgICBsYWJlbDogcXVpY2tDb21tYW5kTGFiZWwobS5uYW1lLCBtLmRlc2NyaXB0aW9uKSxcbiAgICAgICAgaWNvbjogcXVpY2tDb21tYW5kSWNvbihtLmdyb3VwLCBtLm5hbWUpLFxuICAgICAgICByZWFzb246IHF1aWNrQ29tbWFuZFJlYXNvbih7IGNvbnRyb2xMb2NrOiB0aGlzLmNvbnRyb2xMb2NrLCBidXN5OiB0aGlzLmJ1c3ksIGRpc2FibGVkV2hpbGVQcmludGluZzogbS5kaXNhYmxlZFdoaWxlUHJpbnRpbmcgfSksXG4gICAgICAgIHRvb2x0aXA6IHRoaXMudG9vbHRpcE9mKG0pLFxuICAgICAgICBwYXJhbXM6IG0ucGFyYW1zLFxuICAgICAgICBtYWNybzogbVxuICAgICAgfSkpXG4gIH1cblxuICAvKipcbiAgICogV2hhdCBzaG93cyBiZWZvcmUgQWxsIGNvbW1hbmRzOiB0aGUgb25lcyB0aWNrZWQgb24gdGhlIE1hY3JvcyBwYWdlJ3MgUXVpY2tcbiAgICogY29tbWFuZHMgc2VjdGlvbiAoS0FOLTIxMjIpLCBpbiB0aGF0IG9yZGVyLCBlbHNlIHRoZSBmaXJzdCBmZXcuXG4gICAqL1xuICBnZXQgc2hvd25EZWZhdWx0ICgpOiBRdWlja0NvbW1hbmRbXSB7XG4gICAgY29uc3QgcGlja3MgPSB0aGlzLnF1aWNrQ29tbWFuZFBpY2tzXG4gICAgaWYgKHBpY2tzID09PSBudWxsKSByZXR1cm4gdGhpcy5jb21tYW5kcy5zbGljZSgwLCB0aGlzLlRPUClcbiAgICBjb25zdCBieU5hbWUgPSBuZXcgTWFwKHRoaXMuY29tbWFuZHMubWFwKGMgPT4gW2MubmFtZS50b1VwcGVyQ2FzZSgpLCBjXSkpXG4gICAgcmV0dXJuIHBpY2tzLm1hcChwID0+IGJ5TmFtZS5nZXQocCkpLmZpbHRlcigoYyk6IGMgaXMgUXVpY2tDb21tYW5kID0+ICEhYylcbiAgfVxuXG4gIGdldCBzaG93biAoKTogUXVpY2tDb21tYW5kW10ge1xuICAgIHJldHVybiB0aGlzLmFsbCA/IHRoaXMuY29tbWFuZHMgOiB0aGlzLnNob3duRGVmYXVsdFxuICB9XG5cbiAgZ2V0IHJlc3RhcnRzICgpIHtcbiAgICByZXR1cm4gUkVTVEFSVF9DT01NQU5EUy5tYXAociA9PiAoeyAuLi5yLCByZWFzb246IHJlc3RhcnRSZWFzb24odGhpcy5yZXN0YXJ0UmVmdXNhbCkgfSkpXG4gIH1cblxuICBydW5Db21tYW5kIChjOiBRdWlja0NvbW1hbmQpIHtcbiAgICAvLyBEaXNhYmxlZCBpbiB3b3Jkcywgbm90IGJ5IHRoZSBicm93c2VyLCBzbyB0aGUgcmVhc29uIHN0YXlzIHJlYWRhYmxlIGFuZCBmb2N1c2FibGUuXG4gICAgaWYgKGMucmVhc29uKSByZXR1cm5cbiAgICB0aGlzLnJ1bihjLm1hY3JvKVxuICB9XG5cbiAgcmVzdGFydFdpdGggKHI6IHsgbmFtZTogc3RyaW5nLCByZWFzb246IHN0cmluZyB9KSB7XG4gICAgaWYgKHIucmVhc29uKSByZXR1cm5cbiAgICB0aGlzLnNlbmRUeXBlZEdjb2RlKHIubmFtZSlcbiAgfVxuXG4gIGdldCBhcnJhbmdlTGluayAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7c2NvcGVkUGF0aCgnL3NldHRpbmdzJywgYWN0aXZlU2x1ZygpKX0jbWFjcm9zYFxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucWMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBtYXJnaW46IDAgLTE4cHggLTEwcHg7XG4gIH1cblxuICAucWNfX3JvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4taGVpZ2h0OiA0NHB4O1xuICAgIHBhZGRpbmc6IDdweCAxOHB4O1xuICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG5cbiAgICAmOmZpcnN0LWNoaWxkIHsgYm9yZGVyLXRvcDogMDsgfVxuICAgICY6aG92ZXI6bm90KC5xY19fcm93LS1vZmYpIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7IH1cblxuICAgIC5mcmFtZS1pY29uIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuXG4gICAga2JkIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pO1xuICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgYmFja2dyb3VuZDogbm9uZTtcbiAgICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgfVxuICB9XG5cbiAgLnFjX190ZXh0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDE7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBtaW4td2lkdGg6IDA7XG5cbiAgICBiIHsgZm9udC13ZWlnaHQ6IDYwMDsgfVxuXG4gICAgc21hbGwge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgICBmb250LXNpemU6IDEycHg7XG4gICAgfVxuICB9XG5cbiAgLnFjX19yb3ctLW9mZiB7XG4gICAgY3Vyc29yOiBkZWZhdWx0O1xuXG4gICAgYiwgLmZyYW1lLWljb24geyBvcGFjaXR5OiAwLjU1OyB9XG4gIH1cblxuICAucWNfX3J1bGUge1xuICAgIGhlaWdodDogMDtcbiAgICBtYXJnaW46IDAgMThweDtcbiAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICB9XG5cbiAgLnFjX19ydWxlICsgLnFjX19yb3cgeyBib3JkZXItdG9wOiAwOyB9XG5cbiAgLnFjX19yb3ctLWRhbmdlciB7XG4gICAgYiwgLmZyYW1lLWljb24geyBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7IH1cbiAgfVxuXG4gIC5xY19fYWxsLFxuICAucWNfX2FycmFuZ2Uge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICB9XG5cbiAgLnFjX19ub25lLFxuICAucWNfX3JlZnVzYWwge1xuICAgIG1hcmdpbjogOHB4IDE4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAucWNfX3JlZnVzYWwgeyBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7IH1cblxuICAubWFjcm9zX192YWx1ZXMgeyBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7IG1hcmdpbi10b3A6IDEycHg7IHBhZGRpbmctdG9wOiAxMnB4OyB9XG4gIC5tYWNyb3NfX2ZpZWxkIHsgZGlzcGxheTogZmxleDsgZmxleC13cmFwOiB3cmFwOyBnYXA6IDhweDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBtYXJnaW46IDEwcHggMDsgZm9udC1zaXplOiAxM3B4OyB9XG4gIC5tYWNyb3NfX2ZpZWxkIHRleHRhcmVhIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IHBhZGRpbmc6IDZweCAxMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IHdpZHRoOiAxNDBweDsgcmVzaXplOiBub25lOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sUXVpY2tDb21tYW5kcy52dWUifQ==