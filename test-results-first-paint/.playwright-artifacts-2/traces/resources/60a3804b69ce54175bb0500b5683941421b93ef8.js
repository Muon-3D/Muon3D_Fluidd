/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/AppDraggable.vue";
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
import StateMixin from "/src/mixins/state.ts";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import SegPicker from "/src/components/control/SegPicker.vue";
import AppDraggable from "/src/components/ui/AppDraggable.vue";
import ConsoleFilterDialog from "/src/components/settings/console/ConsoleFilterDialog.vue";
import QuickCommandDialog from "/src/components/settings/console/QuickCommandDialog.vue";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import {
  HISTORY_COUNTS,
  LINES_KEPT,
  PREVIEW_LONG_LINE,
  chipText,
  reconnectPreview,
  timestampPreview,
  consoleConfig,
  describeFilter,
  moveQuickCommand,
  quickCommandsFor,
  accountQuickKey,
  saveQuickCommand
} from "/src/services/console/settings.ts";
import { SocketActions } from "/src/api/socketActions.ts";
let ConsoleSettings = class extends Mixins(StateMixin) {
  quickOpen = false;
  quickEditing = null;
  filterOpen = false;
  filterEditing = null;
  chipText = chipText;
  timestampPreview = timestampPreview;
  reconnectPreview = reconnectPreview;
  longLine = PREVIEW_LONG_LINE;
  describe = describeFilter;
  linesKept = LINES_KEPT.map((n) => ({ value: n, label: n.toLocaleString("en") }));
  historyCounts = HISTORY_COUNTS.map((n) => ({ value: n, label: String(n) }));
  get config() {
    return consoleConfig(this.$store.state.config.uiSettings.console);
  }
  setConfig(key, value) {
    this.$store.dispatch("config/saveByPath", { path: `uiSettings.console.${key}`, value, server: true });
  }
  get hideTempWaits() {
    return this.$store.state.config.uiSettings.general.hideTempWaits !== false;
  }
  set hideTempWaits(value) {
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.hideTempWaits", value, server: true });
  }
  get flipLayout() {
    return !!this.$store.state.config.uiSettings.general.flipConsoleLayout;
  }
  set flipLayout(value) {
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.flipConsoleLayout", value, server: true });
  }
  // -- quick commands -----------------------------------------------------------
  /** This person's key, or null while the account is still loading: nothing is read or saved before it is known. */
  get quickKey() {
    return accountQuickKey(cloudState);
  }
  get quick() {
    return this.quickKey ? quickCommandsFor(this.config, this.quickKey) : [];
  }
  get quickOrder() {
    return this.quick;
  }
  set quickOrder(list) {
    this.saveQuickList(list);
  }
  /** Kept per person: the whole map in the page, only this person's list written to the printer. */
  saveQuickList(list) {
    const key = this.quickKey;
    if (!key) return;
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.console.quickCommands",
      value: { ...this.config.quickCommands, [key]: list }
    });
    SocketActions.serverWrite(`uiSettings.console.quickCommands.${key}`, list);
  }
  editQuick(q) {
    if (!this.quickKey) return;
    this.quickEditing = q ? { ...q } : null;
    this.quickOpen = true;
  }
  saveQuick(q) {
    this.saveQuickList(saveQuickCommand(this.quick, q));
  }
  removeQuick(q) {
    this.saveQuickList(this.quick.filter((x) => x.id !== q.id));
  }
  moveQuick(from, to) {
    if (to < 0 || to >= this.quick.length) return;
    this.saveQuickList(moveQuickCommand(this.quick, from, to));
    this.$nextTick(() => {
      const chips = this.$el.querySelectorAll(".cset__chip:not(.cset__add)");
      chips[to]?.focus();
    });
  }
  // -- filters ------------------------------------------------------------------
  get filters() {
    return this.$store.getters["console/getFilters"] ?? [];
  }
  editFilter(f) {
    this.filterEditing = f ? { ...f } : null;
    this.filterOpen = true;
  }
  saveFilter(f) {
    this.$store.dispatch("console/onSaveFilter", f);
  }
  removeFilter(f) {
    this.$store.dispatch("console/onRemoveFilter", f);
  }
  setFilterEnabled(f, enabled) {
    this.$store.dispatch("console/onSaveFilter", { ...f, enabled });
  }
  // -- the link -----------------------------------------------------------------
  /** People and access, when this printer has it. */
  get accessTo() {
    const supports = (name) => this.$store.getters["server/componentSupport"](name);
    if (!["muon_access", "muon_protection", "authorization"].some(supports)) return null;
    return `${scopedPath("/settings", activeSlug())}#access`;
  }
};
ConsoleSettings = __decorateClass([
  Component({ components: { ToggleSwitch, SegPicker, AppDraggable, ConsoleFilterDialog, QuickCommandDialog } })
], ConsoleSettings);
const _sfc_main = ConsoleSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-sets cset", attrs: { "id": "console", "data-tid": "console-settings" } }, [_c("section", { staticClass: "m3-set", attrs: { "data-tid": "console-settings-quick" } }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" Quick commands \xB7 " + _vm._s(_vm.quick.length) + " ")]), _c("div", { staticClass: "m3-set__row" }, [_c(__unplugin_components_0, { staticClass: "cset__chips", attrs: { "options": { animation: 150, forceFallback: true, fallbackTolerance: 4, draggable: ".cset__chip:not(.cset__add)", ghostClass: "cset__chip--ghost" }, "role": "list", "aria-label": "Quick commands" }, model: { value: _vm.quickOrder, callback: function($$v) {
    _vm.quickOrder = $$v;
  }, expression: "quickOrder" } }, [_vm._l(_vm.quick, function(q, i) {
    return _c("button", { key: q.id, staticClass: "cset__chip", attrs: { "type": "button", "role": "listitem", "title": q.label ? q.command : "", "aria-label": `${_vm.chipText(q)}. Double-click to edit; Alt and an arrow key moves it.`, "data-tid": `console-settings-chip-${q.command}` }, on: { "dblclick": function($event) {
      return _vm.editQuick(q);
    }, "keydown": [function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
      $event.preventDefault();
      return _vm.editQuick(q);
    }, function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "left", 37, $event.key, ["Left", "ArrowLeft"])) return null;
      if (!$event.altKey) return null;
      if ("button" in $event && $event.button !== 0) return null;
      $event.preventDefault();
      return _vm.moveQuick(i, i - 1);
    }, function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "right", 39, $event.key, ["Right", "ArrowRight"])) return null;
      if (!$event.altKey) return null;
      if ("button" in $event && $event.button !== 2) return null;
      $event.preventDefault();
      return _vm.moveQuick(i, i + 1);
    }] } }, [_c("span", { staticClass: "cset__grip", attrs: { "aria-hidden": "true" } }, [_c("i"), _c("i"), _c("i"), _c("i")]), _vm._v(" " + _vm._s(_vm.chipText(q)) + " ")]);
  }), _c("button", { staticClass: "cset__chip cset__add", attrs: { "type": "button", "data-tid": "console-settings-add-quick", "disabled": !_vm.quickKey }, on: { "click": function($event) {
    return _vm.editQuick(null);
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "plus", "small": "" } }), _vm._v(" Add ")], 1)], 2)], 1), !_vm.quickKey ? _c("p", { staticClass: "cset__help", attrs: { "data-tid": "console-settings-quick-loading" } }, [_vm._v(" Loading your account\u2026 ")]) : _c("p", { staticClass: "cset__help" }, [_vm._v(" Shown as chips above the console input. Drag to reorder; double-click to edit. Saved for you on this printer. ")])]), _c("section", { staticClass: "m3-set" }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" Showing ")]), _c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Times on each line")]), _c("span", { staticClass: "cset__mono cset__preview", attrs: { "data-tid": "console-preview-timestamps" } }, [_vm._v(_vm._s(_vm.timestampPreview(_vm.config.timestamps)))])]), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.config.timestamps, "label": "Times on each line" }, on: { "input": function($event) {
    return _vm.setConfig("timestamps", $event);
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(0), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": !_vm.hideTempWaits, "label": "Temperature reports" }, on: { "input": function($event) {
    _vm.hideTempWaits = !$event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(1), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "value": _vm.flipLayout ? "top" : "bottom", "options": [{ value: "bottom", label: "Bottom" }, { value: "top", label: "Top" }], "label": "Newest at" }, on: { "input": function($event) {
    _vm.flipLayout = $event === "top";
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(2), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "value": _vm.config.linesKept, "options": _vm.linesKept, "label": "Lines kept" }, on: { "input": function($event) {
    return _vm.setConfig("linesKept", $event);
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(3), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "value": _vm.config.textSize, "options": [{ value: "sm", label: "S", title: "Small" }, { value: "md", label: "M", title: "Medium" }, { value: "lg", label: "L", title: "Large" }], "label": "Text size" }, on: { "input": function($event) {
    return _vm.setConfig("textSize", $event);
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Wrap long lines")]), _c("span", { staticClass: "cset__mono cset__preview", class: { "cset__preview--cut": !_vm.config.wrap }, attrs: { "data-tid": "console-preview-wrap" } }, [_vm._v(_vm._s(_vm.longLine))])]), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.config.wrap, "label": "Wrap long lines" }, on: { "input": function($event) {
    return _vm.setConfig("wrap", $event);
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Start empty after a reconnect")]), _c("span", { staticClass: "cset__mono cset__preview", attrs: { "data-tid": "console-preview-reconnect" } }, [_vm._v(_vm._s(_vm.reconnectPreview(_vm.config.clearOnReconnect)))])]), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.config.clearOnReconnect, "label": "Start empty after a reconnect" }, on: { "input": function($event) {
    return _vm.setConfig("clearOnReconnect", $event);
  } } })], 1)])]), _c("section", { staticClass: "m3-set", attrs: { "data-tid": "console-settings-filters" } }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" Hide lines \xB7 " + _vm._s(_vm.filters.length) + " ")]), _vm._l(_vm.filters, function(f) {
    return _c("div", { key: f.id, staticClass: "m3-set__row cset__filter", attrs: { "data-tid": `console-filter-${f.name}` }, on: { "click": function($event) {
      return _vm.editFilter(f);
    } } }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v(_vm._s(f.name))]), _c("span", { staticClass: "cset__mono" }, [_vm._v(_vm._s(_vm.describe(f)))])]), _c("div", { staticClass: "m3-set__control cset__filter-ctl", on: { "click": function($event) {
      $event.stopPropagation();
    } } }, [_c("toggle-switch", { attrs: { "value": f.enabled, "label": `Hide ${f.name}` }, on: { "input": function($event) {
      return _vm.setFilterEnabled(f, $event);
    } } }), _c("button", { staticClass: "cset__go", attrs: { "type": "button", "aria-label": `Edit ${f.name}` }, on: { "click": function($event) {
      return _vm.editFilter(f);
    } } }, [_c(__unplugin_components_2, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 1)]);
  }), _c("button", { staticClass: "m3-set__row cset__addrow", attrs: { "type": "button", "data-tid": "console-add-filter" }, on: { "click": function($event) {
    return _vm.editFilter(null);
  } } }, [_c("span", { staticClass: "cset__ico" }, [_c(__unplugin_components_3, { attrs: { "name": "plus", "small": "" } })], 1), _c("span", { staticClass: "cset__grow" }, [_vm._v("Add a filter")]), _c(__unplugin_components_4, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 2), _c("section", { staticClass: "m3-set" }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" Typing ")]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(4), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.config.suggest, "label": "Suggest commands as you type" }, on: { "input": function($event) {
    return _vm.setConfig("suggest", $event);
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(5), _c("div", { staticClass: "m3-set__control" }, [_c("toggle-switch", { attrs: { "value": _vm.config.enterSends, "label": "Enter sends" }, on: { "input": function($event) {
    return _vm.setConfig("enterSends", $event);
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_vm._m(6), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "value": _vm.config.historyCount, "options": _vm.historyCounts, "label": "Remember what I typed" }, on: { "input": function($event) {
    return _vm.setConfig("historyCount", $event);
  } } })], 1)])]), _vm.accessTo ? _c("router-link", { staticClass: "cset__link", attrs: { "to": _vm.accessTo, "data-tid": "console-settings-access" } }, [_c(__unplugin_components_5, { attrs: { "name": "user" } }), _c("span", { staticClass: "cset__grow" }, [_c("b", [_vm._v("Who may type commands")]), _vm._v(" is set per person in People and access.")]), _c("span", { staticClass: "cset__link-go" }, [_vm._v("People and access \u203A")])], 1) : _vm._e(), _c("quick-command-dialog", { attrs: { "quick": _vm.quickEditing }, on: { "save": _vm.saveQuick, "remove": _vm.removeQuick }, model: { value: _vm.quickOpen, callback: function($$v) {
    _vm.quickOpen = $$v;
  }, expression: "quickOpen" } }), _c("console-filter-dialog", { attrs: { "filter": _vm.filterEditing }, on: { "save": _vm.saveFilter, "remove": _vm.removeFilter }, model: { value: _vm.filterOpen, callback: function($$v) {
    _vm.filterOpen = $$v;
  }, expression: "filterOpen" } })], 1);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Temperature reports")]), _c("span", [_vm._v('The "ok T:210 /210" lines a print sends every second.')])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Newest at")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Lines kept")]), _c("span", [_vm._v("Older lines are still in the printer's log.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Text size")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Suggest commands as you type")]), _c("span", [_vm._v("From the printer's own command list and quick commands, with their help text.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Enter sends")]), _c("span", [_vm._v("Off: Enter adds a line; Ctrl Enter sends. Useful for pasting several lines.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Remember what I typed")]), _c("span", [_vm._v("Up arrow brings back earlier commands.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/console/ConsoleSettings.vue?vue&type=style&index=0&scoped=7ecaff19&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "7ecaff19",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/console/ConsoleSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQXNUQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxPQUVBO0FBQ0E7QUFRQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUtBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBMUhBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnNvbGVTZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgaWQ9XCJjb25zb2xlXCJcbiAgICBjbGFzcz1cIm0zLXNldHMgY3NldFwiXG4gICAgZGF0YS10aWQ9XCJjb25zb2xlLXNldHRpbmdzXCJcbiAgPlxuICAgIDxzZWN0aW9uXG4gICAgICBjbGFzcz1cIm0zLXNldFwiXG4gICAgICBkYXRhLXRpZD1cImNvbnNvbGUtc2V0dGluZ3MtcXVpY2tcIlxuICAgID5cbiAgICAgIDxoMiBjbGFzcz1cIm0zLXNldF9fdGl0bGVcIj5cbiAgICAgICAgUXVpY2sgY29tbWFuZHMgwrcge3sgcXVpY2subGVuZ3RoIH19XG4gICAgICA8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICAgIDxhcHAtZHJhZ2dhYmxlXG4gICAgICAgICAgdi1tb2RlbD1cInF1aWNrT3JkZXJcIlxuICAgICAgICAgIGNsYXNzPVwiY3NldF9fY2hpcHNcIlxuICAgICAgICAgIDpvcHRpb25zPVwieyBhbmltYXRpb246IDE1MCwgZm9yY2VGYWxsYmFjazogdHJ1ZSwgZmFsbGJhY2tUb2xlcmFuY2U6IDQsIGRyYWdnYWJsZTogJy5jc2V0X19jaGlwOm5vdCguY3NldF9fYWRkKScsIGdob3N0Q2xhc3M6ICdjc2V0X19jaGlwLS1naG9zdCcgfVwiXG4gICAgICAgICAgcm9sZT1cImxpc3RcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJRdWljayBjb21tYW5kc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cIihxLCBpKSBpbiBxdWlja1wiXG4gICAgICAgICAgICA6a2V5PVwicS5pZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIHJvbGU9XCJsaXN0aXRlbVwiXG4gICAgICAgICAgICBjbGFzcz1cImNzZXRfX2NoaXBcIlxuICAgICAgICAgICAgOnRpdGxlPVwicS5sYWJlbCA/IHEuY29tbWFuZCA6ICcnXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7Y2hpcFRleHQocSl9LiBEb3VibGUtY2xpY2sgdG8gZWRpdDsgQWx0IGFuZCBhbiBhcnJvdyBrZXkgbW92ZXMgaXQuYFwiXG4gICAgICAgICAgICA6ZGF0YS10aWQ9XCJgY29uc29sZS1zZXR0aW5ncy1jaGlwLSR7cS5jb21tYW5kfWBcIlxuICAgICAgICAgICAgQGRibGNsaWNrPVwiZWRpdFF1aWNrKHEpXCJcbiAgICAgICAgICAgIEBrZXlkb3duLmVudGVyLnByZXZlbnQ9XCJlZGl0UXVpY2socSlcIlxuICAgICAgICAgICAgQGtleWRvd24uYWx0LmxlZnQucHJldmVudD1cIm1vdmVRdWljayhpLCBpIC0gMSlcIlxuICAgICAgICAgICAgQGtleWRvd24uYWx0LnJpZ2h0LnByZXZlbnQ9XCJtb3ZlUXVpY2soaSwgaSArIDEpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICBjbGFzcz1cImNzZXRfX2dyaXBcIlxuICAgICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgICAgPjxpIC8+PGkgLz48aSAvPjxpIC8+PC9zcGFuPlxuICAgICAgICAgICAge3sgY2hpcFRleHQocSkgfX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY3NldF9fY2hpcCBjc2V0X19hZGRcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLXNldHRpbmdzLWFkZC1xdWlja1wiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhcXVpY2tLZXlcIlxuICAgICAgICAgICAgQGNsaWNrPVwiZWRpdFF1aWNrKG51bGwpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgQWRkXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvYXBwLWRyYWdnYWJsZT5cbiAgICAgIDwvZGl2PlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIiFxdWlja0tleVwiXG4gICAgICAgIGNsYXNzPVwiY3NldF9faGVscFwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1zZXR0aW5ncy1xdWljay1sb2FkaW5nXCJcbiAgICAgID5cbiAgICAgICAgTG9hZGluZyB5b3VyIGFjY291bnTigKZcbiAgICAgIDwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtZWxzZVxuICAgICAgICBjbGFzcz1cImNzZXRfX2hlbHBcIlxuICAgICAgPlxuICAgICAgICBTaG93biBhcyBjaGlwcyBhYm92ZSB0aGUgY29uc29sZSBpbnB1dC4gRHJhZyB0byByZW9yZGVyOyBkb3VibGUtY2xpY2sgdG8gZWRpdC4gU2F2ZWQgZm9yIHlvdSBvbiB0aGlzIHByaW50ZXIuXG4gICAgICA8L3A+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJtMy1zZXRcIj5cbiAgICAgIDxoMiBjbGFzcz1cIm0zLXNldF9fdGl0bGVcIj5cbiAgICAgICAgU2hvd2luZ1xuICAgICAgPC9oMj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19sYWJlbFwiPlxuICAgICAgICAgIDxiPlRpbWVzIG9uIGVhY2ggbGluZTwvYj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJjc2V0X19tb25vIGNzZXRfX3ByZXZpZXdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLXByZXZpZXctdGltZXN0YW1wc1wiXG4gICAgICAgICAgPnt7IHRpbWVzdGFtcFByZXZpZXcoY29uZmlnLnRpbWVzdGFtcHMpIH19PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICA6dmFsdWU9XCJjb25maWcudGltZXN0YW1wc1wiXG4gICAgICAgICAgICBsYWJlbD1cIlRpbWVzIG9uIGVhY2ggbGluZVwiXG4gICAgICAgICAgICBAaW5wdXQ9XCJzZXRDb25maWcoJ3RpbWVzdGFtcHMnLCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgPGI+VGVtcGVyYXR1cmUgcmVwb3J0czwvYj5cbiAgICAgICAgICA8c3Bhbj5UaGUgXCJvayBUOjIxMCAvMjEwXCIgbGluZXMgYSBwcmludCBzZW5kcyBldmVyeSBzZWNvbmQuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICA6dmFsdWU9XCIhaGlkZVRlbXBXYWl0c1wiXG4gICAgICAgICAgICBsYWJlbD1cIlRlbXBlcmF0dXJlIHJlcG9ydHNcIlxuICAgICAgICAgICAgQGlucHV0PVwiaGlkZVRlbXBXYWl0cyA9ICEkZXZlbnRcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fbGFiZWxcIj5cbiAgICAgICAgICA8Yj5OZXdlc3QgYXQ8L2I+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgICAgPHNlZy1waWNrZXJcbiAgICAgICAgICAgIDp2YWx1ZT1cImZsaXBMYXlvdXQgPyAndG9wJyA6ICdib3R0b20nXCJcbiAgICAgICAgICAgIDpvcHRpb25zPVwiW3sgdmFsdWU6ICdib3R0b20nLCBsYWJlbDogJ0JvdHRvbScgfSwgeyB2YWx1ZTogJ3RvcCcsIGxhYmVsOiAnVG9wJyB9XVwiXG4gICAgICAgICAgICBsYWJlbD1cIk5ld2VzdCBhdFwiXG4gICAgICAgICAgICBAaW5wdXQ9XCJmbGlwTGF5b3V0ID0gJGV2ZW50ID09PSAndG9wJ1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19sYWJlbFwiPlxuICAgICAgICAgIDxiPkxpbmVzIGtlcHQ8L2I+XG4gICAgICAgICAgPHNwYW4+T2xkZXIgbGluZXMgYXJlIHN0aWxsIGluIHRoZSBwcmludGVyJ3MgbG9nLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2xcIj5cbiAgICAgICAgICA8c2VnLXBpY2tlclxuICAgICAgICAgICAgOnZhbHVlPVwiY29uZmlnLmxpbmVzS2VwdFwiXG4gICAgICAgICAgICA6b3B0aW9ucz1cImxpbmVzS2VwdFwiXG4gICAgICAgICAgICBsYWJlbD1cIkxpbmVzIGtlcHRcIlxuICAgICAgICAgICAgQGlucHV0PVwic2V0Q29uZmlnKCdsaW5lc0tlcHQnLCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgPGI+VGV4dCBzaXplPC9iPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgICA6dmFsdWU9XCJjb25maWcudGV4dFNpemVcIlxuICAgICAgICAgICAgOm9wdGlvbnM9XCJbeyB2YWx1ZTogJ3NtJywgbGFiZWw6ICdTJywgdGl0bGU6ICdTbWFsbCcgfSwgeyB2YWx1ZTogJ21kJywgbGFiZWw6ICdNJywgdGl0bGU6ICdNZWRpdW0nIH0sIHsgdmFsdWU6ICdsZycsIGxhYmVsOiAnTCcsIHRpdGxlOiAnTGFyZ2UnIH1dXCJcbiAgICAgICAgICAgIGxhYmVsPVwiVGV4dCBzaXplXCJcbiAgICAgICAgICAgIEBpbnB1dD1cInNldENvbmZpZygndGV4dFNpemUnLCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgPGI+V3JhcCBsb25nIGxpbmVzPC9iPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzcz1cImNzZXRfX21vbm8gY3NldF9fcHJldmlld1wiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdjc2V0X19wcmV2aWV3LS1jdXQnOiAhY29uZmlnLndyYXAgfVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImNvbnNvbGUtcHJldmlldy13cmFwXCJcbiAgICAgICAgICA+e3sgbG9uZ0xpbmUgfX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICAgIDp2YWx1ZT1cImNvbmZpZy53cmFwXCJcbiAgICAgICAgICAgIGxhYmVsPVwiV3JhcCBsb25nIGxpbmVzXCJcbiAgICAgICAgICAgIEBpbnB1dD1cInNldENvbmZpZygnd3JhcCcsICRldmVudClcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fbGFiZWxcIj5cbiAgICAgICAgICA8Yj5TdGFydCBlbXB0eSBhZnRlciBhIHJlY29ubmVjdDwvYj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJjc2V0X19tb25vIGNzZXRfX3ByZXZpZXdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLXByZXZpZXctcmVjb25uZWN0XCJcbiAgICAgICAgICA+e3sgcmVjb25uZWN0UHJldmlldyhjb25maWcuY2xlYXJPblJlY29ubmVjdCkgfX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICAgIDp2YWx1ZT1cImNvbmZpZy5jbGVhck9uUmVjb25uZWN0XCJcbiAgICAgICAgICAgIGxhYmVsPVwiU3RhcnQgZW1wdHkgYWZ0ZXIgYSByZWNvbm5lY3RcIlxuICAgICAgICAgICAgQGlucHV0PVwic2V0Q29uZmlnKCdjbGVhck9uUmVjb25uZWN0JywgJGV2ZW50KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8c2VjdGlvblxuICAgICAgY2xhc3M9XCJtMy1zZXRcIlxuICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLXNldHRpbmdzLWZpbHRlcnNcIlxuICAgID5cbiAgICAgIDxoMiBjbGFzcz1cIm0zLXNldF9fdGl0bGVcIj5cbiAgICAgICAgSGlkZSBsaW5lcyDCtyB7eyBmaWx0ZXJzLmxlbmd0aCB9fVxuICAgICAgPC9oMj5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJmIGluIGZpbHRlcnNcIlxuICAgICAgICA6a2V5PVwiZi5pZFwiXG4gICAgICAgIGNsYXNzPVwibTMtc2V0X19yb3cgY3NldF9fZmlsdGVyXCJcbiAgICAgICAgOmRhdGEtdGlkPVwiYGNvbnNvbGUtZmlsdGVyLSR7Zi5uYW1lfWBcIlxuICAgICAgICBAY2xpY2s9XCJlZGl0RmlsdGVyKGYpXCJcbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fbGFiZWxcIj5cbiAgICAgICAgICA8Yj57eyBmLm5hbWUgfX08L2I+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJjc2V0X19tb25vXCI+e3sgZGVzY3JpYmUoZikgfX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2wgY3NldF9fZmlsdGVyLWN0bFwiXG4gICAgICAgICAgQGNsaWNrLnN0b3BcbiAgICAgICAgPlxuICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICA6dmFsdWU9XCJmLmVuYWJsZWRcIlxuICAgICAgICAgICAgOmxhYmVsPVwiYEhpZGUgJHtmLm5hbWV9YFwiXG4gICAgICAgICAgICBAaW5wdXQ9XCJzZXRGaWx0ZXJFbmFibGVkKGYsICRldmVudClcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNzZXRfX2dvXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYEVkaXQgJHtmLm5hbWV9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJlZGl0RmlsdGVyKGYpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICBuYW1lPVwiY2hldnJvblJpZ2h0XCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cIm0zLXNldF9fcm93IGNzZXRfX2FkZHJvd1wiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1hZGQtZmlsdGVyXCJcbiAgICAgICAgQGNsaWNrPVwiZWRpdEZpbHRlcihudWxsKVwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY3NldF9faWNvXCI+PGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY3NldF9fZ3Jvd1wiPkFkZCBhIGZpbHRlcjwvc3Bhbj5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwiY2hldnJvblJpZ2h0XCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJtMy1zZXRcIj5cbiAgICAgIDxoMiBjbGFzcz1cIm0zLXNldF9fdGl0bGVcIj5cbiAgICAgICAgVHlwaW5nXG4gICAgICA8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgPGI+U3VnZ2VzdCBjb21tYW5kcyBhcyB5b3UgdHlwZTwvYj5cbiAgICAgICAgICA8c3Bhbj5Gcm9tIHRoZSBwcmludGVyJ3Mgb3duIGNvbW1hbmQgbGlzdCBhbmQgcXVpY2sgY29tbWFuZHMsIHdpdGggdGhlaXIgaGVscCB0ZXh0Ljwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2xcIj5cbiAgICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgICAgOnZhbHVlPVwiY29uZmlnLnN1Z2dlc3RcIlxuICAgICAgICAgICAgbGFiZWw9XCJTdWdnZXN0IGNvbW1hbmRzIGFzIHlvdSB0eXBlXCJcbiAgICAgICAgICAgIEBpbnB1dD1cInNldENvbmZpZygnc3VnZ2VzdCcsICRldmVudClcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fbGFiZWxcIj5cbiAgICAgICAgICA8Yj5FbnRlciBzZW5kczwvYj5cbiAgICAgICAgICA8c3Bhbj5PZmY6IEVudGVyIGFkZHMgYSBsaW5lOyBDdHJsIEVudGVyIHNlbmRzLiBVc2VmdWwgZm9yIHBhc3Rpbmcgc2V2ZXJhbCBsaW5lcy48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICAgIDp2YWx1ZT1cImNvbmZpZy5lbnRlclNlbmRzXCJcbiAgICAgICAgICAgIGxhYmVsPVwiRW50ZXIgc2VuZHNcIlxuICAgICAgICAgICAgQGlucHV0PVwic2V0Q29uZmlnKCdlbnRlclNlbmRzJywgJGV2ZW50KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19sYWJlbFwiPlxuICAgICAgICAgIDxiPlJlbWVtYmVyIHdoYXQgSSB0eXBlZDwvYj5cbiAgICAgICAgICA8c3Bhbj5VcCBhcnJvdyBicmluZ3MgYmFjayBlYXJsaWVyIGNvbW1hbmRzLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2NvbnRyb2xcIj5cbiAgICAgICAgICA8c2VnLXBpY2tlclxuICAgICAgICAgICAgOnZhbHVlPVwiY29uZmlnLmhpc3RvcnlDb3VudFwiXG4gICAgICAgICAgICA6b3B0aW9ucz1cImhpc3RvcnlDb3VudHNcIlxuICAgICAgICAgICAgbGFiZWw9XCJSZW1lbWJlciB3aGF0IEkgdHlwZWRcIlxuICAgICAgICAgICAgQGlucHV0PVwic2V0Q29uZmlnKCdoaXN0b3J5Q291bnQnLCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxyb3V0ZXItbGlua1xuICAgICAgdi1pZj1cImFjY2Vzc1RvXCJcbiAgICAgIDp0bz1cImFjY2Vzc1RvXCJcbiAgICAgIGNsYXNzPVwiY3NldF9fbGlua1wiXG4gICAgICBkYXRhLXRpZD1cImNvbnNvbGUtc2V0dGluZ3MtYWNjZXNzXCJcbiAgICA+XG4gICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwidXNlclwiIC8+XG4gICAgICA8c3BhbiBjbGFzcz1cImNzZXRfX2dyb3dcIj48Yj5XaG8gbWF5IHR5cGUgY29tbWFuZHM8L2I+IGlzIHNldCBwZXIgcGVyc29uIGluIFBlb3BsZSBhbmQgYWNjZXNzLjwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY3NldF9fbGluay1nb1wiPlBlb3BsZSBhbmQgYWNjZXNzIOKAujwvc3Bhbj5cbiAgICA8L3JvdXRlci1saW5rPlxuXG4gICAgPHF1aWNrLWNvbW1hbmQtZGlhbG9nXG4gICAgICB2LW1vZGVsPVwicXVpY2tPcGVuXCJcbiAgICAgIDpxdWljaz1cInF1aWNrRWRpdGluZ1wiXG4gICAgICBAc2F2ZT1cInNhdmVRdWlja1wiXG4gICAgICBAcmVtb3ZlPVwicmVtb3ZlUXVpY2tcIlxuICAgIC8+XG4gICAgPGNvbnNvbGUtZmlsdGVyLWRpYWxvZ1xuICAgICAgdi1tb2RlbD1cImZpbHRlck9wZW5cIlxuICAgICAgOmZpbHRlcj1cImZpbHRlckVkaXRpbmdcIlxuICAgICAgQHNhdmU9XCJzYXZlRmlsdGVyXCJcbiAgICAgIEByZW1vdmU9XCJyZW1vdmVGaWx0ZXJcIlxuICAgIC8+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBDb25zb2xlRmlsdGVyIH0gZnJvbSAnQC9zdG9yZS9jb25zb2xlL3R5cGVzJ1xuaW1wb3J0IFRvZ2dsZVN3aXRjaCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Ub2dnbGVTd2l0Y2gudnVlJ1xuaW1wb3J0IFNlZ1BpY2tlciBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9TZWdQaWNrZXIudnVlJ1xuaW1wb3J0IEFwcERyYWdnYWJsZSBmcm9tICdAL2NvbXBvbmVudHMvdWkvQXBwRHJhZ2dhYmxlLnZ1ZSdcbmltcG9ydCBDb25zb2xlRmlsdGVyRGlhbG9nIGZyb20gJy4vQ29uc29sZUZpbHRlckRpYWxvZy52dWUnXG5pbXBvcnQgUXVpY2tDb21tYW5kRGlhbG9nIGZyb20gJy4vUXVpY2tDb21tYW5kRGlhbG9nLnZ1ZSdcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuaW1wb3J0IHsgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5pbXBvcnQge1xuICBISVNUT1JZX0NPVU5UUywgTElORVNfS0VQVCwgUFJFVklFV19MT05HX0xJTkUsIGNoaXBUZXh0LCByZWNvbm5lY3RQcmV2aWV3LCB0aW1lc3RhbXBQcmV2aWV3LCBjb25zb2xlQ29uZmlnLCBkZXNjcmliZUZpbHRlciwgbW92ZVF1aWNrQ29tbWFuZCwgcXVpY2tDb21tYW5kc0ZvciwgYWNjb3VudFF1aWNrS2V5LCBzYXZlUXVpY2tDb21tYW5kLFxuICB0eXBlIENvbnNvbGVDb25maWcsIHR5cGUgUXVpY2tDb21tYW5kXG59IGZyb20gJ0Avc2VydmljZXMvY29uc29sZS9zZXR0aW5ncydcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuXG4vKipcbiAqIFNldHRpbmdzIOKAuiBDb25zb2xlOiB0aGUgcXVpY2stY29tbWFuZCBjaGlwcyBhYm92ZSB0aGUgQ29uc29sZSdzIGlucHV0XG4gKiAoZWFjaCBwZXJzb24ncyBvd24sIG9uIHRoaXMgcHJpbnRlciksIHdoYXQgdGhlIGNvbnNvbGUgc2hvd3MsIHRoZSBsaW5lc1xuICogaXQgaGlkZXMsIGFuZCBob3cgdHlwaW5nIHdvcmtzLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUb2dnbGVTd2l0Y2gsIFNlZ1BpY2tlciwgQXBwRHJhZ2dhYmxlLCBDb25zb2xlRmlsdGVyRGlhbG9nLCBRdWlja0NvbW1hbmREaWFsb2cgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uc29sZVNldHRpbmdzIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgcXVpY2tPcGVuID0gZmFsc2VcbiAgcXVpY2tFZGl0aW5nOiBRdWlja0NvbW1hbmQgfCBudWxsID0gbnVsbFxuICBmaWx0ZXJPcGVuID0gZmFsc2VcbiAgZmlsdGVyRWRpdGluZzogQ29uc29sZUZpbHRlciB8IG51bGwgPSBudWxsXG5cbiAgcmVhZG9ubHkgY2hpcFRleHQgPSBjaGlwVGV4dFxuICByZWFkb25seSB0aW1lc3RhbXBQcmV2aWV3ID0gdGltZXN0YW1wUHJldmlld1xuICByZWFkb25seSByZWNvbm5lY3RQcmV2aWV3ID0gcmVjb25uZWN0UHJldmlld1xuICByZWFkb25seSBsb25nTGluZSA9IFBSRVZJRVdfTE9OR19MSU5FXG4gIHJlYWRvbmx5IGRlc2NyaWJlID0gZGVzY3JpYmVGaWx0ZXJcbiAgcmVhZG9ubHkgbGluZXNLZXB0ID0gTElORVNfS0VQVC5tYXAobiA9PiAoeyB2YWx1ZTogbiwgbGFiZWw6IG4udG9Mb2NhbGVTdHJpbmcoJ2VuJykgfSkpXG4gIHJlYWRvbmx5IGhpc3RvcnlDb3VudHMgPSBISVNUT1JZX0NPVU5UUy5tYXAobiA9PiAoeyB2YWx1ZTogbiwgbGFiZWw6IFN0cmluZyhuKSB9KSlcblxuICBnZXQgY29uZmlnICgpOiBDb25zb2xlQ29uZmlnIHtcbiAgICByZXR1cm4gY29uc29sZUNvbmZpZyh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5jb25zb2xlKVxuICB9XG5cbiAgc2V0Q29uZmlnPEsgZXh0ZW5kcyBrZXlvZiBDb25zb2xlQ29uZmlnPiAoa2V5OiBLLCB2YWx1ZTogQ29uc29sZUNvbmZpZ1tLXSkge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHsgcGF0aDogYHVpU2V0dGluZ3MuY29uc29sZS4ke2tleX1gLCB2YWx1ZSwgc2VydmVyOiB0cnVlIH0pXG4gIH1cblxuICBnZXQgaGlkZVRlbXBXYWl0cyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuaGlkZVRlbXBXYWl0cyAhPT0gZmFsc2VcbiAgfVxuXG4gIHNldCBoaWRlVGVtcFdhaXRzICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHsgcGF0aDogJ3VpU2V0dGluZ3MuZ2VuZXJhbC5oaWRlVGVtcFdhaXRzJywgdmFsdWUsIHNlcnZlcjogdHJ1ZSB9KVxuICB9XG5cbiAgZ2V0IGZsaXBMYXlvdXQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuZmxpcENvbnNvbGVMYXlvdXRcbiAgfVxuXG4gIHNldCBmbGlwTGF5b3V0ICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHsgcGF0aDogJ3VpU2V0dGluZ3MuZ2VuZXJhbC5mbGlwQ29uc29sZUxheW91dCcsIHZhbHVlLCBzZXJ2ZXI6IHRydWUgfSlcbiAgfVxuXG4gIC8vIC0tIHF1aWNrIGNvbW1hbmRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqIFRoaXMgcGVyc29uJ3Mga2V5LCBvciBudWxsIHdoaWxlIHRoZSBhY2NvdW50IGlzIHN0aWxsIGxvYWRpbmc6IG5vdGhpbmcgaXMgcmVhZCBvciBzYXZlZCBiZWZvcmUgaXQgaXMga25vd24uICovXG4gIGdldCBxdWlja0tleSAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIGFjY291bnRRdWlja0tleShjbG91ZFN0YXRlKVxuICB9XG5cbiAgZ2V0IHF1aWNrICgpOiBRdWlja0NvbW1hbmRbXSB7XG4gICAgcmV0dXJuIHRoaXMucXVpY2tLZXkgPyBxdWlja0NvbW1hbmRzRm9yKHRoaXMuY29uZmlnLCB0aGlzLnF1aWNrS2V5KSA6IFtdXG4gIH1cblxuICBnZXQgcXVpY2tPcmRlciAoKTogUXVpY2tDb21tYW5kW10ge1xuICAgIHJldHVybiB0aGlzLnF1aWNrXG4gIH1cblxuICBzZXQgcXVpY2tPcmRlciAobGlzdDogUXVpY2tDb21tYW5kW10pIHtcbiAgICB0aGlzLnNhdmVRdWlja0xpc3QobGlzdClcbiAgfVxuXG4gIC8qKiBLZXB0IHBlciBwZXJzb246IHRoZSB3aG9sZSBtYXAgaW4gdGhlIHBhZ2UsIG9ubHkgdGhpcyBwZXJzb24ncyBsaXN0IHdyaXR0ZW4gdG8gdGhlIHByaW50ZXIuICovXG4gIHNhdmVRdWlja0xpc3QgKGxpc3Q6IFF1aWNrQ29tbWFuZFtdKSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5xdWlja0tleVxuICAgIGlmICgha2V5KSByZXR1cm5cbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5jb25zb2xlLnF1aWNrQ29tbWFuZHMnLFxuICAgICAgdmFsdWU6IHsgLi4udGhpcy5jb25maWcucXVpY2tDb21tYW5kcywgW2tleV06IGxpc3QgfVxuICAgIH0pXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJXcml0ZShgdWlTZXR0aW5ncy5jb25zb2xlLnF1aWNrQ29tbWFuZHMuJHtrZXl9YCwgbGlzdClcbiAgfVxuXG4gIGVkaXRRdWljayAocTogUXVpY2tDb21tYW5kIHwgbnVsbCkge1xuICAgIGlmICghdGhpcy5xdWlja0tleSkgcmV0dXJuXG4gICAgdGhpcy5xdWlja0VkaXRpbmcgPSBxID8geyAuLi5xIH0gOiBudWxsXG4gICAgdGhpcy5xdWlja09wZW4gPSB0cnVlXG4gIH1cblxuICBzYXZlUXVpY2sgKHE6IFF1aWNrQ29tbWFuZCkge1xuICAgIHRoaXMuc2F2ZVF1aWNrTGlzdChzYXZlUXVpY2tDb21tYW5kKHRoaXMucXVpY2ssIHEpKVxuICB9XG5cbiAgcmVtb3ZlUXVpY2sgKHE6IFF1aWNrQ29tbWFuZCkge1xuICAgIHRoaXMuc2F2ZVF1aWNrTGlzdCh0aGlzLnF1aWNrLmZpbHRlcih4ID0+IHguaWQgIT09IHEuaWQpKVxuICB9XG5cbiAgbW92ZVF1aWNrIChmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpIHtcbiAgICBpZiAodG8gPCAwIHx8IHRvID49IHRoaXMucXVpY2subGVuZ3RoKSByZXR1cm5cbiAgICB0aGlzLnNhdmVRdWlja0xpc3QobW92ZVF1aWNrQ29tbWFuZCh0aGlzLnF1aWNrLCBmcm9tLCB0bykpXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgY29uc3QgY2hpcHMgPSB0aGlzLiRlbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxCdXR0b25FbGVtZW50PignLmNzZXRfX2NoaXA6bm90KC5jc2V0X19hZGQpJylcbiAgICAgIGNoaXBzW3RvXT8uZm9jdXMoKVxuICAgIH0pXG4gIH1cblxuICAvLyAtLSBmaWx0ZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBmaWx0ZXJzICgpOiBDb25zb2xlRmlsdGVyW10ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25zb2xlL2dldEZpbHRlcnMnXSA/PyBbXVxuICB9XG5cbiAgZWRpdEZpbHRlciAoZjogQ29uc29sZUZpbHRlciB8IG51bGwpIHtcbiAgICB0aGlzLmZpbHRlckVkaXRpbmcgPSBmID8geyAuLi5mIH0gOiBudWxsXG4gICAgdGhpcy5maWx0ZXJPcGVuID0gdHJ1ZVxuICB9XG5cbiAgc2F2ZUZpbHRlciAoZjogQ29uc29sZUZpbHRlcikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25zb2xlL29uU2F2ZUZpbHRlcicsIGYpXG4gIH1cblxuICByZW1vdmVGaWx0ZXIgKGY6IENvbnNvbGVGaWx0ZXIpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uc29sZS9vblJlbW92ZUZpbHRlcicsIGYpXG4gIH1cblxuICBzZXRGaWx0ZXJFbmFibGVkIChmOiBDb25zb2xlRmlsdGVyLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbnNvbGUvb25TYXZlRmlsdGVyJywgeyAuLi5mLCBlbmFibGVkIH0pXG4gIH1cblxuICAvLyAtLSB0aGUgbGluayAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBQZW9wbGUgYW5kIGFjY2Vzcywgd2hlbiB0aGlzIHByaW50ZXIgaGFzIGl0LiAqL1xuICBnZXQgYWNjZXNzVG8gKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IHN1cHBvcnRzID0gKG5hbWU6IHN0cmluZykgPT4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2NvbXBvbmVudFN1cHBvcnQnXShuYW1lKSBhcyBib29sZWFuXG4gICAgaWYgKCFbJ211b25fYWNjZXNzJywgJ211b25fcHJvdGVjdGlvbicsICdhdXRob3JpemF0aW9uJ10uc29tZShzdXBwb3J0cykpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIGAke3Njb3BlZFBhdGgoJy9zZXR0aW5ncycsIGFjdGl2ZVNsdWcoKSl9I2FjY2Vzc2BcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmNzZXRfX2NoaXBzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiA0cHggMDtcbiAgfVxuXG4gIC5jc2V0X19jaGlwIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIGhlaWdodDogMzRweDtcbiAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vLCBtb25vc3BhY2UpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICAgIGN1cnNvcjogZ3JhYjtcbiAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICB0b3VjaC1hY3Rpb246IG5vbmU7XG4gIH1cblxuICAuY3NldF9fY2hpcC0tZ2hvc3Qge1xuICAgIG9wYWNpdHk6IDAuNDtcbiAgfVxuXG4gIC5jc2V0X19hZGQge1xuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyk7XG4gICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIHRvdWNoLWFjdGlvbjogYXV0bztcbiAgfVxuXG4gIC5jc2V0X19ncmlwIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogM3B4IDNweDtcbiAgICBnYXA6IDJweDtcblxuICAgIGkge1xuICAgICAgd2lkdGg6IDNweDtcbiAgICAgIGhlaWdodDogM3B4O1xuICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICB9XG4gIH1cblxuICAuY3NldF9faGVscCB7XG4gICAgbWFyZ2luOiA0cHggMCA4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuY3NldF9fbW9ubyB7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8sIG1vbm9zcGFjZSk7XG4gIH1cblxuICAuY3NldF9fZmlsdGVyIHtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gIH1cblxuICAuY3NldF9fZmlsdGVyLWN0bCB7XG4gICAgZ2FwOiA0cHg7XG4gIH1cblxuICAuY3NldF9fZ28ge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDMycHg7XG4gICAgaGVpZ2h0OiAzMnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAvLyBQaG9uZXM6IHRoZSBzd2l0Y2ggYW5kIHRoZSBjaGV2cm9uIHN0YXkgb24gdGhlIG5hbWUncyBsaW5lLlxuICBAbWVkaWEgKG1heC13aWR0aDogNzYwcHgpIHtcbiAgICAuY3NldF9fZmlsdGVyIHtcbiAgICAgIGZsZXgtd3JhcDogbm93cmFwO1xuICAgIH1cblxuICAgIC5jc2V0X19maWx0ZXItY3RsIHtcbiAgICAgIGZsZXg6IDAgMCBhdXRvO1xuICAgIH1cbiAgfVxuXG4gIC5jc2V0X19hZGRyb3cge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gIH1cblxuICAuY3NldF9faWNvIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDM2cHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAuY3NldF9fZ3JvdyB7XG4gICAgZmxleDogMSAxIGF1dG87XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLmNzZXRfX2xpbmsge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMTRweCAxOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE4cHg7XG4gICAgYmFja2dyb3VuZDogcmdiYSgxMjgsIDIxNCwgMjA5LCAwLjA4KTtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggcmdiYSgxMjgsIDIxNCwgMjA5LCAwLjMpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgfVxuXG4gIC5jc2V0X19saW5rLWdvIHtcbiAgICBmbGV4OiBub25lO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDc2MHB4KSB7XG4gICAgLmNzZXRfX2xpbmsge1xuICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgIH1cbiAgfVxuICAuY3NldF9fcHJldmlldyB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgIG1hcmdpbi10b3A6IDRweDtcbiAgICBwYWRkaW5nOiA0cHggOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgb3ZlcmZsb3ctd3JhcDogYW55d2hlcmU7XG4gIH1cblxuICAuY3NldF9fcHJldmlldy0tY3V0IHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9jb25zb2xlL0NvbnNvbGVTZXR0aW5ncy52dWUifQ==