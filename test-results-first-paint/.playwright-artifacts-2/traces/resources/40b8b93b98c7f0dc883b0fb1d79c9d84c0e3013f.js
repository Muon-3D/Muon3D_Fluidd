/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_29 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_28 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_27 from "/src/components/ui/FrameIcon.vue";
import { VListItemAction as __unplugin_components_26 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_25 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_24 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_23 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_22 from "/src/components/ui/AppDialog.vue";
import __unplugin_components_21 from "/src/components/ui/FrameIcon.vue";
import { VListItemTitle as __unplugin_components_20 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_19 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_15 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSwitch as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import MacroCategoryDialog from "/src/components/settings/macros/MacroCategoryDialog.vue";
import MacroSheet from "/src/components/settings/macros/MacroSheet.vue";
import QuickCommandPicker from "/src/components/settings/macros/QuickCommandPicker.vue";
import { devModeState, refreshDevMode } from "/src/services/dev-mode/state.ts";
import { macroPlacesOn } from "/src/services/macros/places.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { macroSections, macrosMovedTo, rangeOf, sectionsMoved } from "/src/components/settings/macros/macro-sections.ts";
const LONG_PRESS_MS = 500;
const HIDDEN_SHOWN = 3;
let MacroPanel = class extends Mixins(StateMixin) {
  query = "";
  places = /* @__PURE__ */ new Map();
  error = "";
  dev = devModeState;
  selected = [];
  anchor = null;
  focused = null;
  dragging = [];
  draggingSection = null;
  dropOn = null;
  moveFor = null;
  sheetFor = null;
  allHidden = false;
  pressTimer = 0;
  pressed = false;
  /** Set by a long-press: taps then add to the selection, as on a phone's file list. */
  picking = false;
  categoryDialog = {
    open: false,
    title: "",
    name: "",
    save: () => void 0
  };
  mounted() {
    refreshDevMode().then(() => this.load());
  }
  beforeDestroy() {
    clearTimeout(this.pressTimer);
  }
  get connected() {
    return this.$store.state.socket.open === true;
  }
  get locked() {
    return !this.connected;
  }
  get registered() {
    return this.$store.state.server.info.registered_directories ?? [];
  }
  /** Where the macros are read from: the editable copy in developer mode, else the defaults the printer runs. */
  get root() {
    if (this.dev.enabled || !this.registered.includes("defaults")) return "config";
    return "defaults";
  }
  /** Edit in Files opens: a non-Muon printer's config, or a Muon's in developer mode. */
  get editable() {
    return this.root === "config" && this.dev.enabled !== false;
  }
  onRoot() {
    this.load();
  }
  async load() {
    this.error = "";
    try {
      this.places = await macroPlacesOn(this.root);
    } catch {
      this.error = "The printer didn't list its config files, so where each command is written isn't known yet.";
    }
  }
  get allMacros() {
    return this.$store.getters["macros/getMacros"];
  }
  /** Macros whose names start with _: Klipper's helpers, hidden from everyone. */
  get hiddenMacros() {
    const q = this.query.trim().toLowerCase();
    return Object.keys(this.$store.state.printer.printer ?? {}).filter((key) => /^gcode_macro _/.test(key)).map((key) => key.slice("gcode_macro ".length)).filter((name) => !q || name.toLowerCase().includes(q));
  }
  get shownHidden() {
    return this.allHidden ? this.hiddenMacros : this.hiddenMacros.slice(0, HIDDEN_SHOWN);
  }
  get sections() {
    return macroSections(
      this.$store.getters["macros/getCategories"],
      (id) => this.$store.getters["macros/getMacrosByCategory"](id),
      this.$t("app.general.label.uncategorized").toString(),
      this.query
    );
  }
  countOf(section) {
    return section.count + (section.id === "0" ? this.hiddenMacros.length : 0);
  }
  get order() {
    return this.sections.flatMap((s) => s.macros.map((m) => m.name));
  }
  /** The row that takes Tab: the one last chosen, else the first. */
  get focusName() {
    return this.focused && this.order.includes(this.focused) ? this.focused : this.order[0];
  }
  get sheetMacro() {
    return this.sheetFor ? this.allMacros.find((m) => m.name === this.sheetFor) : void 0;
  }
  macro(name) {
    return this.allMacros.find((m) => m.name === name);
  }
  titleOf(m) {
    return m.alias || m.name.toUpperCase();
  }
  titleOfName(name) {
    const m = this.macro(name);
    return m ? this.titleOf(m) : name;
  }
  sectionOf(m) {
    return m.categoryId && m.category ? m.categoryId : "0";
  }
  allIn(names, sectionId) {
    return names.every((n) => {
      const m = this.macro(n);
      return m && this.sectionOf(m) === sectionId;
    });
  }
  placeOf(name) {
    return this.places.get(name.toUpperCase());
  }
  /** " · macros/filament.cfg:49", or nothing until it's found. */
  placeText(name) {
    const place = this.placeOf(name);
    return place ? ` \xB7 ${place.path}:${place.line}` : "";
  }
  get developerTo() {
    return `${scopedPath("/settings", activeSlug())}#developer`;
  }
  isSelected(name) {
    return this.selected.includes(name);
  }
  select(name) {
    this.selected = [name];
    this.anchor = name;
    this.focused = name;
  }
  toggle(name) {
    this.selected = this.isSelected(name) ? this.selected.filter((n) => n !== name) : [...this.selected, name];
    this.anchor = name;
    this.focused = name;
  }
  clear() {
    this.selected = [];
    this.anchor = null;
    this.picking = false;
  }
  /** Empty space anywhere in the panel (padding, gaps, headings) clears the selection; a row, button, field or menu keeps it. */
  onPanelClick(event) {
    const target = event.target;
    if (target?.closest('[role="option"], [role="menuitem"], button, a, input, textarea, select, label, .v-input, .v-menu__content')) return;
    this.clear();
  }
  /** Ctrl+A (Cmd+A) selects every macro shown, unless the keys are going to a field. */
  onPanelKey(event) {
    if (event.key.toLowerCase() !== "a" || !(event.ctrlKey || event.metaKey) || event.altKey) return;
    const target = event.target;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    this.selected = [...this.order];
    this.anchor = this.order[0] ?? null;
  }
  /** A shift-click selects a range; without this the browser also selects the text between. */
  onRowMouseDown(event) {
    if (event.shiftKey) event.preventDefault();
  }
  onRowClick(event, name) {
    if (this.pressed) {
      this.pressed = false;
      return;
    }
    if (event.shiftKey && this.anchor) {
      this.selected = rangeOf(this.order, this.anchor, name);
      this.focused = name;
    } else if (event.ctrlKey || event.metaKey || this.picking) {
      this.toggle(name);
    } else {
      this.select(name);
    }
  }
  onPressStart(name) {
    clearTimeout(this.pressTimer);
    this.pressed = false;
    this.pressTimer = window.setTimeout(() => {
      this.pressed = true;
      this.picking = true;
      if (!this.isSelected(name)) this.toggle(name);
    }, LONG_PRESS_MS);
  }
  onPressEnd() {
    clearTimeout(this.pressTimer);
  }
  open(m) {
    this.select(m.name);
    this.sheetFor = m.name;
  }
  openInEditor(name) {
    const place = this.placeOf(name);
    if (!place || !this.editable) return;
    this.$router.push({
      path: scopedPath("/configure", activeSlug()),
      query: { open: `${place.root}/${place.path}`, line: String(place.line) }
    });
  }
  onKey(event, m) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter") {
      event.preventDefault();
      this.open(m);
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) this.toggle(m.name);
      else this.select(m.name);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const i = this.order.indexOf(m.name);
    const next = this.order[i + (event.key === "ArrowDown" ? 1 : -1)];
    if (!next) return;
    if (event.shiftKey && this.anchor) {
      this.selected = rangeOf(this.order, this.anchor, next);
      this.focused = next;
    } else {
      this.select(next);
    }
    this.$nextTick(() => {
      this.$el.querySelector(`[data-tid=${JSON.stringify(`macro-row-${next}`)}]`)?.focus();
    });
  }
  /** Drags the selection when the row is in it, else just the row. */
  onDragStart(event, name) {
    if (this.locked) return;
    if (!this.isSelected(name)) this.select(name);
    this.dragging = this.order.filter((n) => this.isSelected(n));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", this.dragging.join("\n"));
    }
  }
  onSectionDragStart(event, id) {
    if (id === "0" || this.locked) return;
    this.draggingSection = id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `section:${id}`);
    }
  }
  onDragEnd() {
    this.dragging = [];
    this.draggingSection = null;
    this.dropOn = null;
  }
  onDragOver(event, sectionId) {
    if (!this.dragging.length && !this.draggingSection) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    this.dropOn = sectionId;
  }
  onDragLeave(event, sectionId) {
    const to = event.relatedTarget;
    if (to && event.currentTarget.contains(to)) return;
    if (this.dropOn === sectionId) this.dropOn = null;
  }
  onDrop(event, sectionId, before) {
    const section = this.draggingSection;
    const names = this.dragging.length ? this.dragging : (event.dataTransfer?.getData("text/plain") ?? "").split("\n").filter((n) => n && !n.startsWith("section:"));
    this.onDragEnd();
    if (this.locked) return;
    event.preventDefault();
    if (section) this.moveSection(section, sectionId);
    else if (names.length) this.moveTo(names, sectionId, before);
  }
  /** Puts the dragged section before the one it's dropped on (Uncategorised stays last). */
  moveSection(id, onto) {
    const ids = this.sections.map((s) => s.id).filter((s) => s !== "0");
    const next = sectionsMoved(ids, id, onto === "0" ? void 0 : onto);
    if (next) this.$store.dispatch("macros/saveCategoryOrder", next);
  }
  /** Moves the macros into the section, before `before` (or last), and saves the section's order. */
  moveTo(names, sectionId, before) {
    this.moveFor = null;
    const macros = macrosMovedTo(
      this.allMacros,
      (id) => this.$store.getters["macros/getMacrosByCategory"](id),
      names,
      sectionId,
      before
    );
    if (!macros) return;
    this.$store.dispatch("macros/saveAllOrder", macros);
  }
  setVisible(m, visible) {
    this.$store.dispatch("macros/saveMacro", { ...m, visible: !!visible });
  }
  setSelectedVisible(visible) {
    const macros = this.selected.map((n) => this.macro(n)).filter((m) => !!m);
    if (macros.length) this.$store.dispatch(visible ? "macros/saveAllOn" : "macros/saveAllOff", macros);
  }
  setAllVisible(section, visible) {
    const macros = this.$store.getters["macros/getMacrosByCategory"](section.id);
    this.$store.dispatch(visible ? "macros/saveAllOn" : "macros/saveAllOff", macros);
  }
  /** A new section; from Move to…, the macros go into it. */
  addCategory(moving) {
    this.moveFor = null;
    this.categoryDialog = {
      open: true,
      title: "New section",
      name: "",
      save: async (name) => {
        await this.$store.dispatch("macros/addCategory", name);
        const made = [...this.$store.state.macros.categories].reverse().find((c) => c.name === name);
        if (moving?.length && made) this.moveTo(moving, made.id);
      }
    };
  }
  renameCategory(section) {
    this.categoryDialog = {
      open: true,
      title: "Rename the section",
      name: section.name,
      save: (name) => this.$store.dispatch("macros/editCategory", { id: section.id, name })
    };
  }
  removeCategory(section) {
    this.$store.dispatch("macros/removeCategory", { id: section.id, name: section.name });
  }
};
__decorateClass([
  Watch("root")
], MacroPanel.prototype, "onRoot", 1);
MacroPanel = __decorateClass([
  Component({
    components: { MacroCategoryDialog, MacroSheet, QuickCommandPicker }
  })
], MacroPanel);
const _sfc_main = MacroPanel;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "mpanel", attrs: { "id": "macros", "data-tid": "macro-panel" }, on: { "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    return _vm.clear.apply(null, arguments);
  }, _vm.onPanelKey], "click": _vm.onPanelClick } }, [_c("header", { staticClass: "mpanel__head" }, [_vm._m(0), _c("div", { staticClass: "mpanel__tools" }, [_c("label", { staticClass: "mpanel__find" }, [_c(__unplugin_components_0, { attrs: { "name": "search", "small": "" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.query, expression: "query" }], attrs: { "type": "search", "placeholder": `Search ${_vm.allMacros.length} quick commands`, "aria-label": "Find a quick command" }, domProps: { "value": _vm.query }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.query = $event.target.value;
  } } })], 1), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "macro-add-category", "disabled": _vm.locked }, on: { "click": function($event) {
    return _vm.addCategory();
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "plus", "small": "" } }), _vm._v(" New section ")], 1)])]), _vm.allMacros.length ? _c("quick-command-picker") : _vm._e(), _vm.allMacros.length && !_vm.connected ? _c("p", { staticClass: "mpanel__note", attrs: { "data-tid": "macro-panel-offline" } }, [_vm._v(" The printer isn't connected, so these can't be moved or hidden until it's back. ")]) : _vm._e(), !_vm.allMacros.length ? _c("p", { staticClass: "mpanel__note", attrs: { "data-tid": "macro-panel-empty" } }, [_vm._v(" " + _vm._s(_vm.connected ? "This printer has no quick commands yet. A [gcode_macro] in its config shows here." : "The printer isn't connected, so its quick commands can't be listed yet.") + " ")]) : _vm._e(), _c("div", { staticClass: "mpanel__list", attrs: { "data-tid": "macro-list" } }, [_c("div", { staticClass: "mpanel__bar", class: { "mpanel__bar--on": _vm.selected.length }, attrs: { "data-tid": "macro-toolbar" } }, [_vm.selected.length ? [_c("b", { attrs: { "data-tid": "macro-selected-count" } }, [_vm._v(_vm._s(_vm.selected.length) + " selected")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "macro-toolbar-move", "disabled": _vm.locked }, on: { "click": function($event) {
    _vm.moveFor = [..._vm.selected];
  } } }, [_vm._v(" Move to\u2026 ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "macro-toolbar-show", "disabled": _vm.locked }, on: { "click": function($event) {
    return _vm.setSelectedVisible(true);
  } } }, [_vm._v(" Show ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "macro-toolbar-hide", "disabled": _vm.locked }, on: { "click": function($event) {
    return _vm.setSelectedVisible(false);
  } } }, [_vm._v(" Hide ")]), _c("button", { staticClass: "cbtn mpanel__done", attrs: { "type": "button", "data-tid": "macro-toolbar-done" }, on: { "click": _vm.clear } }, [_vm._v(" Done ")])] : _c("span", { staticClass: "mpanel__hint" }, [_vm._v("Click selects \xB7 Ctrl/Shift adds \xB7 drag between sections \xB7 double-click opens")])], 2), _vm._l(_vm.sections, function(section) {
    return _c("section", { key: section.id, staticClass: "mpanel__section", class: { "mpanel__section--drop": _vm.dropOn === section.id }, attrs: { "data-tid": `macro-section-${section.id}`, "data-section": section.name }, on: { "dragover": function($event) {
      return _vm.onDragOver($event, section.id);
    }, "dragleave": function($event) {
      return _vm.onDragLeave($event, section.id);
    }, "drop": function($event) {
      return _vm.onDrop($event, section.id);
    } } }, [_c("header", { staticClass: "mpanel__section-head", attrs: { "draggable": section.id !== "0" && !_vm.locked ? "true" : "false", "data-tid": `macro-section-head-${section.id}` }, on: { "dragstart": function($event) {
      return _vm.onSectionDragStart($event, section.id);
    }, "dragend": _vm.onDragEnd } }, [section.id !== "0" ? _c("span", { staticClass: "mpanel__grip", attrs: { "aria-hidden": "true" } }) : _vm._e(), _c("h3", [_vm._v(_vm._s(section.name))]), _c("span", { staticClass: "mpanel__count", attrs: { "data-tid": `macro-section-count-${section.id}` } }, [_vm._v(_vm._s(section.visible) + " of " + _vm._s(_vm.countOf(section)) + " shown")]), _c(__unplugin_components_2, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
      return [_c("button", _vm._g(_vm._b({ staticClass: "mpanel__more", attrs: { "type": "button", "aria-label": `${section.name}: more`, "data-tid": `macro-section-menu-${section.id}` } }, "button", attrs, false), on), [_c(__unplugin_components_3, { attrs: { "name": "more", "small": "" } })], 1)];
    } }], null, true) }, [_c(__unplugin_components_4, { attrs: { "dense": "" } }, [section.id !== "0" ? _c(__unplugin_components_5, { attrs: { "data-tid": "macro-category-rename", "disabled": _vm.locked }, on: { "click": function($event) {
      return _vm.renameCategory(section);
    } } }, [_c(__unplugin_components_6, [_vm._v("Rename\u2026")])], 1) : _vm._e(), _c(__unplugin_components_7, { attrs: { "disabled": !section.count || _vm.locked, "data-tid": "macro-section-all-on" }, on: { "click": function($event) {
      return _vm.setAllVisible(section, true);
    } } }, [_c(__unplugin_components_8, [_vm._v("Show all")])], 1), _c(__unplugin_components_9, { attrs: { "disabled": !section.count || _vm.locked, "data-tid": "macro-section-all-off" }, on: { "click": function($event) {
      return _vm.setAllVisible(section, false);
    } } }, [_c(__unplugin_components_10, [_vm._v("Hide all")])], 1), section.id !== "0" ? _c(__unplugin_components_11, { attrs: { "data-tid": "macro-category-remove", "disabled": _vm.locked }, on: { "click": function($event) {
      return _vm.removeCategory(section);
    } } }, [_c(__unplugin_components_12, [_vm._v("Remove")])], 1) : _vm._e()], 1)], 1)], 1), _c("div", { staticClass: "mpanel__rows", attrs: { "role": "listbox", "aria-multiselectable": "true", "aria-label": section.name } }, [_vm._l(section.macros, function(m) {
      return _c("div", { key: m.name, staticClass: "mpanel__row", class: { "mpanel__row--selected": _vm.isSelected(m.name), "mpanel__row--dragging": _vm.dragging.includes(m.name) }, attrs: { "role": "option", "aria-selected": _vm.isSelected(m.name) ? "true" : "false", "tabindex": m.name === _vm.focusName ? 0 : -1, "data-tid": `macro-row-${m.name}`, "draggable": _vm.locked ? "false" : "true" }, on: { "mousedown": _vm.onRowMouseDown, "click": function($event) {
        return _vm.onRowClick($event, m.name);
      }, "dblclick": function($event) {
        return _vm.open(m);
      }, "keydown": function($event) {
        return _vm.onKey($event, m);
      }, "&touchstart": function($event) {
        return _vm.onPressStart(m.name);
      }, "&touchmove": function($event) {
        return _vm.onPressEnd.apply(null, arguments);
      }, "touchend": _vm.onPressEnd, "contextmenu": function($event) {
        _vm.pressed && $event.preventDefault();
      }, "dragstart": function($event) {
        return _vm.onDragStart($event, m.name);
      }, "dragend": _vm.onDragEnd, "dragover": function($event) {
        return _vm.onDragOver($event, section.id);
      }, "drop": function($event) {
        $event.stopPropagation();
        return _vm.onDrop($event, section.id, m.name);
      } } }, [_c("span", { staticClass: "mpanel__grip", attrs: { "aria-hidden": "true" } }), _c("input", { staticClass: "mpanel__check", attrs: { "type": "checkbox", "aria-label": `Select ${_vm.titleOf(m)}`, "data-tid": `macro-check-${m.name}` }, domProps: { "checked": _vm.isSelected(m.name) }, on: { "click": function($event) {
        $event.stopPropagation();
        return _vm.toggle(m.name);
      }, "dblclick": function($event) {
        $event.stopPropagation();
      } } }), _c("span", { staticClass: "mpanel__dot", style: m.color ? { background: m.color } : void 0, attrs: { "aria-hidden": "true" } }), _c("div", { staticClass: "mpanel__what" }, [_c("b", [_vm._v(_vm._s(_vm.titleOf(m)))]), _c("span", [_vm._v(_vm._s(m.name.toUpperCase()) + _vm._s(_vm.placeText(m.name)))])]), m.disabledWhilePrinting ? _c("span", { staticClass: "mpanel__chip" }, [_vm._v("Not while printing")]) : _vm._e(), _c(__unplugin_components_13, { staticClass: "mpanel__shown mt-0 pt-0", attrs: { "input-value": m.visible, "hide-details": "", "dense": "", "aria-label": `Show ${_vm.titleOf(m)} on the dashboard`, "disabled": _vm.locked, "data-tid": `macro-visible-${m.name}` }, on: { "change": function($event) {
        return _vm.setVisible(m, $event);
      } }, nativeOn: { "click": function($event) {
        $event.stopPropagation();
      }, "dblclick": function($event) {
        $event.stopPropagation();
      } } }), _c(__unplugin_components_14, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
        return [_c("button", _vm._g(_vm._b({ staticClass: "mpanel__more", attrs: { "type": "button", "aria-label": `${_vm.titleOf(m)}: more`, "data-tid": `macro-menu-${m.name}` }, on: { "dblclick": function($event) {
          $event.stopPropagation();
        } } }, "button", attrs, false), on), [_c(__unplugin_components_15, { attrs: { "name": "more", "small": "" } })], 1)];
      } }], null, true) }, [_c(__unplugin_components_16, { attrs: { "dense": "" } }, [_c(__unplugin_components_17, { attrs: { "data-tid": "macro-details" }, on: { "click": function($event) {
        return _vm.open(m);
      } } }, [_c(__unplugin_components_18, [_vm._v("Open\u2026")])], 1), _c(__unplugin_components_19, { attrs: { "data-tid": "macro-move", "disabled": _vm.locked }, on: { "click": function($event) {
        _vm.moveFor = [m.name];
      } } }, [_c(__unplugin_components_20, [_vm._v("Move to\u2026")])], 1)], 1)], 1)], 1);
    }), section.id === "0" ? [_vm._l(_vm.shownHidden, function(name) {
      return _c("div", { key: name, staticClass: "mpanel__row mpanel__row--hidden", attrs: { "data-tid": `macro-hidden-${name}` } }, [_c("span", { staticClass: "mpanel__grip", attrs: { "aria-hidden": "true" } }), _c("span", { staticClass: "mpanel__dot", attrs: { "aria-hidden": "true" } }), _c("div", { staticClass: "mpanel__what" }, [_c("b", { staticClass: "mpanel__mono" }, [_vm._v(_vm._s(name.toUpperCase()))]), _c("span", [_vm._v("Starts with _ : hidden from everyone, can't be shown")])]), _c(__unplugin_components_21, { attrs: { "name": "lock", "small": "", "aria-label": "Can't be shown" } })], 1);
    }), _vm.hiddenMacros.length > _vm.shownHidden.length ? _c("button", { staticClass: "mpanel__more-rows", attrs: { "type": "button", "data-tid": "macro-hidden-more" }, on: { "click": function($event) {
      _vm.allHidden = true;
    } } }, [_vm._v(" + " + _vm._s(_vm.hiddenMacros.length - _vm.shownHidden.length) + " more ")]) : _vm._e()] : _vm._e(), !section.macros.length && !(section.id === "0" && _vm.hiddenMacros.length) ? _c("p", { staticClass: "mpanel__empty" }, [_vm._v(" " + _vm._s(_vm.query ? "None found here." : "None yet. Drag a command here, or use its Move to\u2026.") + " ")]) : _vm._e()], 2)]);
  })], 2), _c("p", { staticClass: "mpanel__foot" }, [_vm._v(" Shown commands appear in Quick commands and in Quick actions, in this order. Sections are saved on the printer, for everyone. ")]), !_vm.editable ? _c("p", { staticClass: "mpanel__note", attrs: { "data-tid": "macro-edit-readonly" } }, [_c("b", [_vm._v("Editing what a command does")]), _vm._v(" needs developer mode on a Muon printer. Non-Muon printers open the file straight away. "), _c("router-link", { attrs: { "to": _vm.developerTo } }, [_vm._v(" Developer mode \u203A ")])], 1) : _vm._e(), _vm.error ? _c("p", { staticClass: "mpanel__note", attrs: { "data-tid": "macro-panel-error" } }, [_vm._v(" " + _vm._s(_vm.error) + " "), _c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": _vm.load } }, [_vm._v(" Try again ")])]) : _vm._e(), _vm.moveFor ? _c(__unplugin_components_22, { attrs: { "value": !!_vm.moveFor, "title": _vm.moveFor.length === 1 ? `Move ${_vm.titleOfName(_vm.moveFor[0])} to` : `Move ${_vm.moveFor.length} commands to`, "max-width": "360", "no-actions": "" }, on: { "input": function($event) {
    _vm.moveFor = $event ? _vm.moveFor : null;
  } } }, [_c(__unplugin_components_23, { attrs: { "data-tid": "macro-move-to" } }, [_vm._l(_vm.sections, function(section) {
    return _c(__unplugin_components_24, { key: section.id, attrs: { "data-tid": `macro-move-to-${section.id}`, "disabled": _vm.allIn(_vm.moveFor, section.id) }, on: { "click": function($event) {
      return _vm.moveTo(_vm.moveFor, section.id);
    } } }, [_c(__unplugin_components_25, [_vm._v(_vm._s(section.name))]), _vm.allIn(_vm.moveFor, section.id) ? _c(__unplugin_components_26, [_c(__unplugin_components_27, { attrs: { "name": "check", "small": "" } })], 1) : _vm._e()], 1);
  }), _c(__unplugin_components_28, { attrs: { "data-tid": "macro-move-to-new" }, on: { "click": function($event) {
    return _vm.addCategory(_vm.moveFor);
  } } }, [_c(__unplugin_components_29, [_vm._v("New section\u2026")])], 1)], 2)], 1) : _vm._e(), _vm.sheetMacro ? _c("macro-sheet", { key: _vm.sheetMacro.name, attrs: { "macro": _vm.sheetMacro, "sections": _vm.sections, "section-id": _vm.sectionOf(_vm.sheetMacro), "place": _vm.placeOf(_vm.sheetMacro.name), "editable": _vm.editable, "read-only": _vm.locked, "developer-to": _vm.developerTo }, on: { "move": function($event) {
    return _vm.moveTo([_vm.sheetMacro.name], $event);
  }, "edit": function($event) {
    return _vm.openInEditor(_vm.sheetMacro.name);
  }, "close": function($event) {
    _vm.sheetFor = null;
  } } }) : _vm._e(), _vm.categoryDialog.open ? _c("macro-category-dialog", { attrs: { "title": _vm.categoryDialog.title, "label": _vm.$t("app.general.label.name"), "name": _vm.categoryDialog.name }, on: { "save": _vm.categoryDialog.save }, model: { value: _vm.categoryDialog.open, callback: function($$v) {
    _vm.$set(_vm.categoryDialog, "open", $$v);
  }, expression: "categoryDialog.open" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_c("h2", [_vm._v("Macros")]), _c("p", [_vm._v("The printer's commands: which show on Overview and Control, in which section, and what they're called")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/macros/MacroPanel.vue?vue&type=style&index=0&scoped=7dfafe04&lang.scss";
import "/src/components/settings/macros/MacroPanel.vue?vue&type=style&index=1&scoped=7dfafe04&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "7dfafe04",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/macros/MacroPanel.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQSthQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFjQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0EsZ0VBQ0EsNENBQ0EsK0NBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsYUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBalVBO0FBQUEsRUFEQTtBQUFBLEdBeERBLFdBeURBO0FBekRBO0FBQUEsRUFIQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTWFjcm9QYW5lbC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvblxuICAgIGlkPVwibWFjcm9zXCJcbiAgICBjbGFzcz1cIm1wYW5lbFwiXG4gICAgZGF0YS10aWQ9XCJtYWNyby1wYW5lbFwiXG4gICAgQGtleWRvd24uZXNjPVwiY2xlYXJcIlxuICAgIEBrZXlkb3duPVwib25QYW5lbEtleVwiXG4gICAgQGNsaWNrPVwib25QYW5lbENsaWNrXCJcbiAgPlxuICAgIDxoZWFkZXIgY2xhc3M9XCJtcGFuZWxfX2hlYWRcIj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxoMj5NYWNyb3M8L2gyPlxuICAgICAgICA8cD5UaGUgcHJpbnRlcidzIGNvbW1hbmRzOiB3aGljaCBzaG93IG9uIE92ZXJ2aWV3IGFuZCBDb250cm9sLCBpbiB3aGljaCBzZWN0aW9uLCBhbmQgd2hhdCB0aGV5J3JlIGNhbGxlZDwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm1wYW5lbF9fdG9vbHNcIj5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwibXBhbmVsX19maW5kXCI+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJzZWFyY2hcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgdi1tb2RlbD1cInF1ZXJ5XCJcbiAgICAgICAgICAgIHR5cGU9XCJzZWFyY2hcIlxuICAgICAgICAgICAgOnBsYWNlaG9sZGVyPVwiYFNlYXJjaCAke2FsbE1hY3Jvcy5sZW5ndGh9IHF1aWNrIGNvbW1hbmRzYFwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiRmluZCBhIHF1aWNrIGNvbW1hbmRcIlxuICAgICAgICAgID5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby1hZGQtY2F0ZWdvcnlcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImxvY2tlZFwiXG4gICAgICAgICAgQGNsaWNrPVwiYWRkQ2F0ZWdvcnkoKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cInBsdXNcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIE5ldyBzZWN0aW9uXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9oZWFkZXI+XG5cbiAgICA8cXVpY2stY29tbWFuZC1waWNrZXIgdi1pZj1cImFsbE1hY3Jvcy5sZW5ndGhcIiAvPlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCJhbGxNYWNyb3MubGVuZ3RoICYmICFjb25uZWN0ZWRcIlxuICAgICAgY2xhc3M9XCJtcGFuZWxfX25vdGVcIlxuICAgICAgZGF0YS10aWQ9XCJtYWNyby1wYW5lbC1vZmZsaW5lXCJcbiAgICA+XG4gICAgICBUaGUgcHJpbnRlciBpc24ndCBjb25uZWN0ZWQsIHNvIHRoZXNlIGNhbid0IGJlIG1vdmVkIG9yIGhpZGRlbiB1bnRpbCBpdCdzIGJhY2suXG4gICAgPC9wPlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCIhYWxsTWFjcm9zLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cIm1wYW5lbF9fbm90ZVwiXG4gICAgICBkYXRhLXRpZD1cIm1hY3JvLXBhbmVsLWVtcHR5XCJcbiAgICA+XG4gICAgICB7eyBjb25uZWN0ZWQgPyAnVGhpcyBwcmludGVyIGhhcyBubyBxdWljayBjb21tYW5kcyB5ZXQuIEEgW2djb2RlX21hY3JvXSBpbiBpdHMgY29uZmlnIHNob3dzIGhlcmUuJyA6ICdUaGUgcHJpbnRlciBpc25cXCd0IGNvbm5lY3RlZCwgc28gaXRzIHF1aWNrIGNvbW1hbmRzIGNhblxcJ3QgYmUgbGlzdGVkIHlldC4nIH19XG4gICAgPC9wPlxuXG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJtcGFuZWxfX2xpc3RcIlxuICAgICAgZGF0YS10aWQ9XCJtYWNyby1saXN0XCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwibXBhbmVsX19iYXJcIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdtcGFuZWxfX2Jhci0tb24nOiBzZWxlY3RlZC5sZW5ndGggfVwiXG4gICAgICAgIGRhdGEtdGlkPVwibWFjcm8tdG9vbGJhclwiXG4gICAgICA+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2VsZWN0ZWQubGVuZ3RoXCI+XG4gICAgICAgICAgPGIgZGF0YS10aWQ9XCJtYWNyby1zZWxlY3RlZC1jb3VudFwiPnt7IHNlbGVjdGVkLmxlbmd0aCB9fSBzZWxlY3RlZDwvYj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIm1hY3JvLXRvb2xiYXItbW92ZVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJsb2NrZWRcIlxuICAgICAgICAgICAgQGNsaWNrPVwibW92ZUZvciA9IFsuLi5zZWxlY3RlZF1cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIE1vdmUgdG/igKZcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIm1hY3JvLXRvb2xiYXItc2hvd1wiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJsb2NrZWRcIlxuICAgICAgICAgICAgQGNsaWNrPVwic2V0U2VsZWN0ZWRWaXNpYmxlKHRydWUpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBTaG93XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby10b29sYmFyLWhpZGVcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwibG9ja2VkXCJcbiAgICAgICAgICAgIEBjbGljaz1cInNldFNlbGVjdGVkVmlzaWJsZShmYWxzZSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIEhpZGVcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBtcGFuZWxfX2RvbmVcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby10b29sYmFyLWRvbmVcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY2xlYXJcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIERvbmVcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICBjbGFzcz1cIm1wYW5lbF9faGludFwiXG4gICAgICAgID5DbGljayBzZWxlY3RzIMK3IEN0cmwvU2hpZnQgYWRkcyDCtyBkcmFnIGJldHdlZW4gc2VjdGlvbnMgwrcgZG91YmxlLWNsaWNrIG9wZW5zPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxzZWN0aW9uXG4gICAgICAgIHYtZm9yPVwic2VjdGlvbiBpbiBzZWN0aW9uc1wiXG4gICAgICAgIDprZXk9XCJzZWN0aW9uLmlkXCJcbiAgICAgICAgY2xhc3M9XCJtcGFuZWxfX3NlY3Rpb25cIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdtcGFuZWxfX3NlY3Rpb24tLWRyb3AnOiBkcm9wT24gPT09IHNlY3Rpb24uaWQgfVwiXG4gICAgICAgIDpkYXRhLXRpZD1cImBtYWNyby1zZWN0aW9uLSR7c2VjdGlvbi5pZH1gXCJcbiAgICAgICAgOmRhdGEtc2VjdGlvbj1cInNlY3Rpb24ubmFtZVwiXG4gICAgICAgIEBkcmFnb3Zlcj1cIm9uRHJhZ092ZXIoJGV2ZW50LCBzZWN0aW9uLmlkKVwiXG4gICAgICAgIEBkcmFnbGVhdmU9XCJvbkRyYWdMZWF2ZSgkZXZlbnQsIHNlY3Rpb24uaWQpXCJcbiAgICAgICAgQGRyb3A9XCJvbkRyb3AoJGV2ZW50LCBzZWN0aW9uLmlkKVwiXG4gICAgICA+XG4gICAgICAgIDxoZWFkZXJcbiAgICAgICAgICBjbGFzcz1cIm1wYW5lbF9fc2VjdGlvbi1oZWFkXCJcbiAgICAgICAgICA6ZHJhZ2dhYmxlPVwic2VjdGlvbi5pZCAhPT0gJzAnICYmICFsb2NrZWQgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgbWFjcm8tc2VjdGlvbi1oZWFkLSR7c2VjdGlvbi5pZH1gXCJcbiAgICAgICAgICBAZHJhZ3N0YXJ0PVwib25TZWN0aW9uRHJhZ1N0YXJ0KCRldmVudCwgc2VjdGlvbi5pZClcIlxuICAgICAgICAgIEBkcmFnZW5kPVwib25EcmFnRW5kXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICB2LWlmPVwic2VjdGlvbi5pZCAhPT0gJzAnXCJcbiAgICAgICAgICAgIGNsYXNzPVwibXBhbmVsX19ncmlwXCJcbiAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8aDM+e3sgc2VjdGlvbi5uYW1lIH19PC9oMz5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX2NvdW50XCJcbiAgICAgICAgICAgIDpkYXRhLXRpZD1cImBtYWNyby1zZWN0aW9uLWNvdW50LSR7c2VjdGlvbi5pZH1gXCJcbiAgICAgICAgICA+e3sgc2VjdGlvbi52aXNpYmxlIH19IG9mIHt7IGNvdW50T2Yoc2VjdGlvbikgfX0gc2hvd248L3NwYW4+XG4gICAgICAgICAgPHYtbWVudVxuICAgICAgICAgICAgb2Zmc2V0LXlcbiAgICAgICAgICAgIGxlZnRcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibXBhbmVsX19tb3JlXCJcbiAgICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImAke3NlY3Rpb24ubmFtZX06IG1vcmVgXCJcbiAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgbWFjcm8tc2VjdGlvbi1tZW51LSR7c2VjdGlvbi5pZH1gXCJcbiAgICAgICAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgICAgICBuYW1lPVwibW9yZVwiXG4gICAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICAgIDx2LWxpc3QgZGVuc2U+XG4gICAgICAgICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgICAgICAgIHYtaWY9XCJzZWN0aW9uLmlkICE9PSAnMCdcIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tY2F0ZWdvcnktcmVuYW1lXCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJsb2NrZWRcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cInJlbmFtZUNhdGVnb3J5KHNlY3Rpb24pXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT5SZW5hbWXigKY8L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICAgICAgICA8di1saXN0LWl0ZW1cbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhc2VjdGlvbi5jb3VudCB8fCBsb2NrZWRcIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tc2VjdGlvbi1hbGwtb25cIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cInNldEFsbFZpc2libGUoc2VjdGlvbiwgdHJ1ZSlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPlNob3cgYWxsPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgICAgICAgOmRpc2FibGVkPVwiIXNlY3Rpb24uY291bnQgfHwgbG9ja2VkXCJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cIm1hY3JvLXNlY3Rpb24tYWxsLW9mZlwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwic2V0QWxsVmlzaWJsZShzZWN0aW9uLCBmYWxzZSlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPkhpZGUgYWxsPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgICAgICAgdi1pZj1cInNlY3Rpb24uaWQgIT09ICcwJ1wiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby1jYXRlZ29yeS1yZW1vdmVcIlxuICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cImxvY2tlZFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwicmVtb3ZlQ2F0ZWdvcnkoc2VjdGlvbilcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHYtbGlzdC1pdGVtLXRpdGxlPlJlbW92ZTwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgICAgICA8L3YtbGlzdD5cbiAgICAgICAgICA8L3YtbWVudT5cbiAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICByb2xlPVwibGlzdGJveFwiXG4gICAgICAgICAgYXJpYS1tdWx0aXNlbGVjdGFibGU9XCJ0cnVlXCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cInNlY3Rpb24ubmFtZVwiXG4gICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX3Jvd3NcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1mb3I9XCJtIGluIHNlY3Rpb24ubWFjcm9zXCJcbiAgICAgICAgICAgIDprZXk9XCJtLm5hbWVcIlxuICAgICAgICAgICAgcm9sZT1cIm9wdGlvblwiXG4gICAgICAgICAgICBjbGFzcz1cIm1wYW5lbF9fcm93XCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ21wYW5lbF9fcm93LS1zZWxlY3RlZCc6IGlzU2VsZWN0ZWQobS5uYW1lKSwgJ21wYW5lbF9fcm93LS1kcmFnZ2luZyc6IGRyYWdnaW5nLmluY2x1ZGVzKG0ubmFtZSkgfVwiXG4gICAgICAgICAgICA6YXJpYS1zZWxlY3RlZD1cImlzU2VsZWN0ZWQobS5uYW1lKSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgOnRhYmluZGV4PVwibS5uYW1lID09PSBmb2N1c05hbWUgPyAwIDogLTFcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYG1hY3JvLXJvdy0ke20ubmFtZX1gXCJcbiAgICAgICAgICAgIDpkcmFnZ2FibGU9XCJsb2NrZWQgPyAnZmFsc2UnIDogJ3RydWUnXCJcbiAgICAgICAgICAgIEBtb3VzZWRvd249XCJvblJvd01vdXNlRG93blwiXG4gICAgICAgICAgICBAY2xpY2s9XCJvblJvd0NsaWNrKCRldmVudCwgbS5uYW1lKVwiXG4gICAgICAgICAgICBAZGJsY2xpY2s9XCJvcGVuKG0pXCJcbiAgICAgICAgICAgIEBrZXlkb3duPVwib25LZXkoJGV2ZW50LCBtKVwiXG4gICAgICAgICAgICBAdG91Y2hzdGFydC5wYXNzaXZlPVwib25QcmVzc1N0YXJ0KG0ubmFtZSlcIlxuICAgICAgICAgICAgQHRvdWNobW92ZS5wYXNzaXZlPVwib25QcmVzc0VuZFwiXG4gICAgICAgICAgICBAdG91Y2hlbmQ9XCJvblByZXNzRW5kXCJcbiAgICAgICAgICAgIEBjb250ZXh0bWVudT1cInByZXNzZWQgJiYgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIlxuICAgICAgICAgICAgQGRyYWdzdGFydD1cIm9uRHJhZ1N0YXJ0KCRldmVudCwgbS5uYW1lKVwiXG4gICAgICAgICAgICBAZHJhZ2VuZD1cIm9uRHJhZ0VuZFwiXG4gICAgICAgICAgICBAZHJhZ292ZXI9XCJvbkRyYWdPdmVyKCRldmVudCwgc2VjdGlvbi5pZClcIlxuICAgICAgICAgICAgQGRyb3Auc3RvcD1cIm9uRHJvcCgkZXZlbnQsIHNlY3Rpb24uaWQsIG0ubmFtZSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIGNsYXNzPVwibXBhbmVsX19ncmlwXCJcbiAgICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX2NoZWNrXCJcbiAgICAgICAgICAgICAgOmNoZWNrZWQ9XCJpc1NlbGVjdGVkKG0ubmFtZSlcIlxuICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBTZWxlY3QgJHt0aXRsZU9mKG0pfWBcIlxuICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgbWFjcm8tY2hlY2stJHttLm5hbWV9YFwiXG4gICAgICAgICAgICAgIEBjbGljay5zdG9wPVwidG9nZ2xlKG0ubmFtZSlcIlxuICAgICAgICAgICAgICBAZGJsY2xpY2suc3RvcFxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX2RvdFwiXG4gICAgICAgICAgICAgIDpzdHlsZT1cIm0uY29sb3IgPyB7IGJhY2tncm91bmQ6IG0uY29sb3IgfSA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1wYW5lbF9fd2hhdFwiPlxuICAgICAgICAgICAgICA8Yj57eyB0aXRsZU9mKG0pIH19PC9iPlxuICAgICAgICAgICAgICA8c3Bhbj57eyBtLm5hbWUudG9VcHBlckNhc2UoKSB9fXt7IHBsYWNlVGV4dChtLm5hbWUpIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwibS5kaXNhYmxlZFdoaWxlUHJpbnRpbmdcIlxuICAgICAgICAgICAgICBjbGFzcz1cIm1wYW5lbF9fY2hpcFwiXG4gICAgICAgICAgICA+Tm90IHdoaWxlIHByaW50aW5nPC9zcGFuPlxuICAgICAgICAgICAgPHYtc3dpdGNoXG4gICAgICAgICAgICAgIDppbnB1dC12YWx1ZT1cIm0udmlzaWJsZVwiXG4gICAgICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgICAgICBkZW5zZVxuICAgICAgICAgICAgICBjbGFzcz1cIm1wYW5lbF9fc2hvd24gbXQtMCBwdC0wXCJcbiAgICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgU2hvdyAke3RpdGxlT2YobSl9IG9uIHRoZSBkYXNoYm9hcmRgXCJcbiAgICAgICAgICAgICAgOmRpc2FibGVkPVwibG9ja2VkXCJcbiAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYG1hY3JvLXZpc2libGUtJHttLm5hbWV9YFwiXG4gICAgICAgICAgICAgIEBjbGljay5uYXRpdmUuc3RvcFxuICAgICAgICAgICAgICBAZGJsY2xpY2submF0aXZlLnN0b3BcbiAgICAgICAgICAgICAgQGNoYW5nZT1cInNldFZpc2libGUobSwgJGV2ZW50KVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHYtbWVudVxuICAgICAgICAgICAgICBvZmZzZXQteVxuICAgICAgICAgICAgICBsZWZ0XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX21vcmVcIlxuICAgICAgICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgJHt0aXRsZU9mKG0pfTogbW9yZWBcIlxuICAgICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYG1hY3JvLW1lbnUtJHttLm5hbWV9YFwiXG4gICAgICAgICAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgICAgICAgICBAZGJsY2xpY2suc3RvcFxuICAgICAgICAgICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgICAgICBuYW1lPVwibW9yZVwiXG4gICAgICAgICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby1kZXRhaWxzXCJcbiAgICAgICAgICAgICAgICAgIEBjbGljaz1cIm9wZW4obSlcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT5PcGVu4oCmPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJtYWNyby1tb3ZlXCJcbiAgICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cImxvY2tlZFwiXG4gICAgICAgICAgICAgICAgICBAY2xpY2s9XCJtb3ZlRm9yID0gW20ubmFtZV1cIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT5Nb3ZlIHRv4oCmPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICAgICAgICA8L3YtbGlzdD5cbiAgICAgICAgICAgIDwvdi1tZW51PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2VjdGlvbi5pZCA9PT0gJzAnXCI+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgIHYtZm9yPVwibmFtZSBpbiBzaG93bkhpZGRlblwiXG4gICAgICAgICAgICAgIDprZXk9XCJuYW1lXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX3JvdyBtcGFuZWxfX3Jvdy0taGlkZGVuXCJcbiAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYG1hY3JvLWhpZGRlbi0ke25hbWV9YFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX2dyaXBcIlxuICAgICAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX2RvdFwiXG4gICAgICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1wYW5lbF9fd2hhdFwiPlxuICAgICAgICAgICAgICAgIDxiIGNsYXNzPVwibXBhbmVsX19tb25vXCI+e3sgbmFtZS50b1VwcGVyQ2FzZSgpIH19PC9iPlxuICAgICAgICAgICAgICAgIDxzcGFuPlN0YXJ0cyB3aXRoIF8gOiBoaWRkZW4gZnJvbSBldmVyeW9uZSwgY2FuJ3QgYmUgc2hvd248L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgIG5hbWU9XCJsb2NrXCJcbiAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJDYW4ndCBiZSBzaG93blwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdi1pZj1cImhpZGRlbk1hY3Jvcy5sZW5ndGggPiBzaG93bkhpZGRlbi5sZW5ndGhcIlxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJtcGFuZWxfX21vcmUtcm93c1wiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8taGlkZGVuLW1vcmVcIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJhbGxIaWRkZW4gPSB0cnVlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgKyB7eyBoaWRkZW5NYWNyb3MubGVuZ3RoIC0gc2hvd25IaWRkZW4ubGVuZ3RoIH19IG1vcmVcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgPHBcbiAgICAgICAgICAgIHYtaWY9XCIhc2VjdGlvbi5tYWNyb3MubGVuZ3RoICYmICEoc2VjdGlvbi5pZCA9PT0gJzAnICYmIGhpZGRlbk1hY3Jvcy5sZW5ndGgpXCJcbiAgICAgICAgICAgIGNsYXNzPVwibXBhbmVsX19lbXB0eVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgcXVlcnkgPyAnTm9uZSBmb3VuZCBoZXJlLicgOiAnTm9uZSB5ZXQuIERyYWcgYSBjb21tYW5kIGhlcmUsIG9yIHVzZSBpdHMgTW92ZSB0b+KApi4nIH19XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICA8L2Rpdj5cblxuICAgIDxwIGNsYXNzPVwibXBhbmVsX19mb290XCI+XG4gICAgICBTaG93biBjb21tYW5kcyBhcHBlYXIgaW4gUXVpY2sgY29tbWFuZHMgYW5kIGluIFF1aWNrIGFjdGlvbnMsIGluIHRoaXMgb3JkZXIuIFNlY3Rpb25zIGFyZSBzYXZlZCBvbiB0aGUgcHJpbnRlciwgZm9yIGV2ZXJ5b25lLlxuICAgIDwvcD5cblxuICAgIDxwXG4gICAgICB2LWlmPVwiIWVkaXRhYmxlXCJcbiAgICAgIGNsYXNzPVwibXBhbmVsX19ub3RlXCJcbiAgICAgIGRhdGEtdGlkPVwibWFjcm8tZWRpdC1yZWFkb25seVwiXG4gICAgPlxuICAgICAgPGI+RWRpdGluZyB3aGF0IGEgY29tbWFuZCBkb2VzPC9iPiBuZWVkcyBkZXZlbG9wZXIgbW9kZSBvbiBhIE11b24gcHJpbnRlci4gTm9uLU11b24gcHJpbnRlcnMgb3BlbiB0aGUgZmlsZSBzdHJhaWdodCBhd2F5LlxuICAgICAgPHJvdXRlci1saW5rIDp0bz1cImRldmVsb3BlclRvXCI+XG4gICAgICAgIERldmVsb3BlciBtb2RlIOKAulxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L3A+XG5cbiAgICA8cFxuICAgICAgdi1pZj1cImVycm9yXCJcbiAgICAgIGNsYXNzPVwibXBhbmVsX19ub3RlXCJcbiAgICAgIGRhdGEtdGlkPVwibWFjcm8tcGFuZWwtZXJyb3JcIlxuICAgID5cbiAgICAgIHt7IGVycm9yIH19XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICBAY2xpY2s9XCJsb2FkXCJcbiAgICAgID5cbiAgICAgICAgVHJ5IGFnYWluXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3A+XG4gICAgPGFwcC1kaWFsb2dcbiAgICAgIHYtaWY9XCJtb3ZlRm9yXCJcbiAgICAgIDp2YWx1ZT1cIiEhbW92ZUZvclwiXG4gICAgICA6dGl0bGU9XCJtb3ZlRm9yLmxlbmd0aCA9PT0gMSA/IGBNb3ZlICR7dGl0bGVPZk5hbWUobW92ZUZvclswXSl9IHRvYCA6IGBNb3ZlICR7bW92ZUZvci5sZW5ndGh9IGNvbW1hbmRzIHRvYFwiXG4gICAgICBtYXgtd2lkdGg9XCIzNjBcIlxuICAgICAgbm8tYWN0aW9uc1xuICAgICAgQGlucHV0PVwibW92ZUZvciA9ICRldmVudCA/IG1vdmVGb3IgOiBudWxsXCJcbiAgICA+XG4gICAgICA8di1saXN0IGRhdGEtdGlkPVwibWFjcm8tbW92ZS10b1wiPlxuICAgICAgICA8di1saXN0LWl0ZW1cbiAgICAgICAgICB2LWZvcj1cInNlY3Rpb24gaW4gc2VjdGlvbnNcIlxuICAgICAgICAgIDprZXk9XCJzZWN0aW9uLmlkXCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgbWFjcm8tbW92ZS10by0ke3NlY3Rpb24uaWR9YFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiYWxsSW4obW92ZUZvciwgc2VjdGlvbi5pZClcIlxuICAgICAgICAgIEBjbGljaz1cIm1vdmVUbyhtb3ZlRm9yLCBzZWN0aW9uLmlkKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+e3sgc2VjdGlvbi5uYW1lIH19PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tYWN0aW9uIHYtaWY9XCJhbGxJbihtb3ZlRm9yLCBzZWN0aW9uLmlkKVwiPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cImNoZWNrXCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC92LWxpc3QtaXRlbS1hY3Rpb24+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgIGRhdGEtdGlkPVwibWFjcm8tbW92ZS10by1uZXdcIlxuICAgICAgICAgIEBjbGljaz1cImFkZENhdGVnb3J5KG1vdmVGb3IpXCJcbiAgICAgICAgPlxuICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT5OZXcgc2VjdGlvbuKApjwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICA8L3YtbGlzdD5cbiAgICA8L2FwcC1kaWFsb2c+XG4gICAgPG1hY3JvLXNoZWV0XG4gICAgICB2LWlmPVwic2hlZXRNYWNyb1wiXG4gICAgICA6a2V5PVwic2hlZXRNYWNyby5uYW1lXCJcbiAgICAgIDptYWNybz1cInNoZWV0TWFjcm9cIlxuICAgICAgOnNlY3Rpb25zPVwic2VjdGlvbnNcIlxuICAgICAgOnNlY3Rpb24taWQ9XCJzZWN0aW9uT2Yoc2hlZXRNYWNybylcIlxuICAgICAgOnBsYWNlPVwicGxhY2VPZihzaGVldE1hY3JvLm5hbWUpXCJcbiAgICAgIDplZGl0YWJsZT1cImVkaXRhYmxlXCJcbiAgICAgIDpyZWFkLW9ubHk9XCJsb2NrZWRcIlxuICAgICAgOmRldmVsb3Blci10bz1cImRldmVsb3BlclRvXCJcbiAgICAgIEBtb3ZlPVwibW92ZVRvKFtzaGVldE1hY3JvLm5hbWVdLCAkZXZlbnQpXCJcbiAgICAgIEBlZGl0PVwib3BlbkluRWRpdG9yKHNoZWV0TWFjcm8ubmFtZSlcIlxuICAgICAgQGNsb3NlPVwic2hlZXRGb3IgPSBudWxsXCJcbiAgICAvPlxuICAgIDxtYWNyby1jYXRlZ29yeS1kaWFsb2dcbiAgICAgIHYtaWY9XCJjYXRlZ29yeURpYWxvZy5vcGVuXCJcbiAgICAgIHYtbW9kZWw9XCJjYXRlZ29yeURpYWxvZy5vcGVuXCJcbiAgICAgIDp0aXRsZT1cImNhdGVnb3J5RGlhbG9nLnRpdGxlXCJcbiAgICAgIDpsYWJlbD1cIiR0KCdhcHAuZ2VuZXJhbC5sYWJlbC5uYW1lJylcIlxuICAgICAgOm5hbWU9XCJjYXRlZ29yeURpYWxvZy5uYW1lXCJcbiAgICAgIEBzYXZlPVwiY2F0ZWdvcnlEaWFsb2cuc2F2ZVwiXG4gICAgLz5cbiAgPC9zZWN0aW9uPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCBNYWNyb0NhdGVnb3J5RGlhbG9nIGZyb20gJy4vTWFjcm9DYXRlZ29yeURpYWxvZy52dWUnXG5pbXBvcnQgTWFjcm9TaGVldCBmcm9tICcuL01hY3JvU2hlZXQudnVlJ1xuaW1wb3J0IFF1aWNrQ29tbWFuZFBpY2tlciBmcm9tICcuL1F1aWNrQ29tbWFuZFBpY2tlci52dWUnXG5pbXBvcnQgeyBkZXZNb2RlU3RhdGUsIHJlZnJlc2hEZXZNb2RlIH0gZnJvbSAnQC9zZXJ2aWNlcy9kZXYtbW9kZS9zdGF0ZSdcbmltcG9ydCB7IG1hY3JvUGxhY2VzT24gfSBmcm9tICdAL3NlcnZpY2VzL21hY3Jvcy9wbGFjZXMnXG5pbXBvcnQgdHlwZSB7IE1hY3JvUGxhY2UgfSBmcm9tICdAL3NlcnZpY2VzL21hY3Jvcy9sb2NhdGUnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgdHlwZSB7IE1hY3JvLCBNYWNyb0NhdGVnb3J5IH0gZnJvbSAnQC9zdG9yZS9tYWNyb3MvdHlwZXMnXG5pbXBvcnQgeyBtYWNyb1NlY3Rpb25zLCBtYWNyb3NNb3ZlZFRvLCByYW5nZU9mLCBzZWN0aW9uc01vdmVkLCB0eXBlIE1hY3JvU2VjdGlvbiB9IGZyb20gJy4vbWFjcm8tc2VjdGlvbnMnXG5cbmNvbnN0IExPTkdfUFJFU1NfTVMgPSA1MDBcbmNvbnN0IEhJRERFTl9TSE9XTiA9IDNcblxuLyoqXG4gKiBTZXR0aW5ncyDigLogTWFjcm9zLCBhcyBvbmUgbGlzdDogZXZlcnkgY2F0ZWdvcnkgYSBzZWN0aW9uIChhIGhlYWRlciByb3dcbiAqIHdpdGggYSBncmlwLCBpdHMgY291bnQgYW5kIGEgwrfCt8K3IG1lbnUpLCBhbmQgVW5jYXRlZ29yaXNlZCB0aGUgbGFzdC5cbiAqIFNlbGVjdGlvbiBmb2xsb3dzIEZpbGUgRXhwbG9yZXI6IGNsaWNrIHNlbGVjdHMgb25lLCBDdHJsLWNsaWNrIHRvZ2dsZXMsXG4gKiBTaGlmdC1jbGljayBzZWxlY3RzIGEgcmFuZ2UsIGEgY2hlY2tib3ggKG9yLCBvbiBhIHBob25lLCBhIGxvbmctcHJlc3MpXG4gKiBzZWxlY3RzIHdpdGhvdXQgYSBrZXlib2FyZCwgYW5kIHRoZSB0b29sYmFyIGFjdHMgb24gdGhlIHNlbGVjdGlvbi5cbiAqIE1hY3JvcyBhcmUgZHJhZ2dlZCwgb3IgbW92ZWQgd2l0aCBNb3ZlIHRv4oCmLCBiZXR3ZWVuIHNlY3Rpb25zLiBBXG4gKiBkb3VibGUtY2xpY2sgb3IgRW50ZXIgb3BlbnMgdGhlIG1hY3JvJ3Mgc2hlZXQsIHdpdGggaXRzIGNvZGUgcmVhZC1vbmx5LlxuICovXG5AQ29tcG9uZW50KHtcbiAgY29tcG9uZW50czogeyBNYWNyb0NhdGVnb3J5RGlhbG9nLCBNYWNyb1NoZWV0LCBRdWlja0NvbW1hbmRQaWNrZXIgfVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hY3JvUGFuZWwgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBxdWVyeSA9ICcnXG4gIHBsYWNlczogTWFwPHN0cmluZywgTWFjcm9QbGFjZT4gPSBuZXcgTWFwKClcbiAgZXJyb3IgPSAnJ1xuICBkZXYgPSBkZXZNb2RlU3RhdGVcbiAgc2VsZWN0ZWQ6IHN0cmluZ1tdID0gW11cbiAgYW5jaG9yOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBmb2N1c2VkOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBkcmFnZ2luZzogc3RyaW5nW10gPSBbXVxuICBkcmFnZ2luZ1NlY3Rpb246IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIGRyb3BPbjogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgbW92ZUZvcjogc3RyaW5nW10gfCBudWxsID0gbnVsbFxuICBzaGVldEZvcjogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgYWxsSGlkZGVuID0gZmFsc2VcbiAgcHJlc3NUaW1lciA9IDBcbiAgcHJlc3NlZCA9IGZhbHNlXG4gIC8qKiBTZXQgYnkgYSBsb25nLXByZXNzOiB0YXBzIHRoZW4gYWRkIHRvIHRoZSBzZWxlY3Rpb24sIGFzIG9uIGEgcGhvbmUncyBmaWxlIGxpc3QuICovXG4gIHBpY2tpbmcgPSBmYWxzZVxuICBjYXRlZ29yeURpYWxvZzogeyBvcGVuOiBib29sZWFuLCB0aXRsZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHNhdmU6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQgfSA9IHtcbiAgICBvcGVuOiBmYWxzZSxcbiAgICB0aXRsZTogJycsXG4gICAgbmFtZTogJycsXG4gICAgc2F2ZTogKCkgPT4gdW5kZWZpbmVkXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICByZWZyZXNoRGV2TW9kZSgpLnRoZW4oKCkgPT4gdGhpcy5sb2FkKCkpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5wcmVzc1RpbWVyKVxuICB9XG5cbiAgZ2V0IGNvbm5lY3RlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnNvY2tldC5vcGVuID09PSB0cnVlXG4gIH1cblxuICBnZXQgbG9ja2VkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuY29ubmVjdGVkXG4gIH1cblxuICBnZXQgcmVnaXN0ZXJlZCAoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuc3RhdGUuc2VydmVyLmluZm8ucmVnaXN0ZXJlZF9kaXJlY3RvcmllcyBhcyBzdHJpbmdbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgfVxuXG4gIC8qKiBXaGVyZSB0aGUgbWFjcm9zIGFyZSByZWFkIGZyb206IHRoZSBlZGl0YWJsZSBjb3B5IGluIGRldmVsb3BlciBtb2RlLCBlbHNlIHRoZSBkZWZhdWx0cyB0aGUgcHJpbnRlciBydW5zLiAqL1xuICBnZXQgcm9vdCAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5kZXYuZW5hYmxlZCB8fCAhdGhpcy5yZWdpc3RlcmVkLmluY2x1ZGVzKCdkZWZhdWx0cycpKSByZXR1cm4gJ2NvbmZpZydcbiAgICByZXR1cm4gJ2RlZmF1bHRzJ1xuICB9XG5cbiAgLyoqIEVkaXQgaW4gRmlsZXMgb3BlbnM6IGEgbm9uLU11b24gcHJpbnRlcidzIGNvbmZpZywgb3IgYSBNdW9uJ3MgaW4gZGV2ZWxvcGVyIG1vZGUuICovXG4gIGdldCBlZGl0YWJsZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucm9vdCA9PT0gJ2NvbmZpZycgJiYgdGhpcy5kZXYuZW5hYmxlZCAhPT0gZmFsc2VcbiAgfVxuXG4gIEBXYXRjaCgncm9vdCcpXG4gIG9uUm9vdCAoKSB7XG4gICAgdGhpcy5sb2FkKClcbiAgfVxuXG4gIGFzeW5jIGxvYWQgKCkge1xuICAgIHRoaXMuZXJyb3IgPSAnJ1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnBsYWNlcyA9IGF3YWl0IG1hY3JvUGxhY2VzT24odGhpcy5yb290KVxuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5lcnJvciA9ICdUaGUgcHJpbnRlciBkaWRuXFwndCBsaXN0IGl0cyBjb25maWcgZmlsZXMsIHNvIHdoZXJlIGVhY2ggY29tbWFuZCBpcyB3cml0dGVuIGlzblxcJ3Qga25vd24geWV0LidcbiAgICB9XG4gIH1cblxuICBnZXQgYWxsTWFjcm9zICgpOiBNYWNyb1tdIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snbWFjcm9zL2dldE1hY3JvcyddIGFzIE1hY3JvW11cbiAgfVxuXG4gIC8qKiBNYWNyb3Mgd2hvc2UgbmFtZXMgc3RhcnQgd2l0aCBfOiBLbGlwcGVyJ3MgaGVscGVycywgaGlkZGVuIGZyb20gZXZlcnlvbmUuICovXG4gIGdldCBoaWRkZW5NYWNyb3MgKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBxID0gdGhpcy5xdWVyeS50cmltKCkudG9Mb3dlckNhc2UoKVxuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIgPz8ge30pXG4gICAgICAuZmlsdGVyKGtleSA9PiAvXmdjb2RlX21hY3JvIF8vLnRlc3Qoa2V5KSlcbiAgICAgIC5tYXAoa2V5ID0+IGtleS5zbGljZSgnZ2NvZGVfbWFjcm8gJy5sZW5ndGgpKVxuICAgICAgLmZpbHRlcihuYW1lID0+ICFxIHx8IG5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSlcbiAgfVxuXG4gIGdldCBzaG93bkhpZGRlbiAoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmFsbEhpZGRlbiA/IHRoaXMuaGlkZGVuTWFjcm9zIDogdGhpcy5oaWRkZW5NYWNyb3Muc2xpY2UoMCwgSElEREVOX1NIT1dOKVxuICB9XG5cbiAgZ2V0IHNlY3Rpb25zICgpOiBNYWNyb1NlY3Rpb25bXSB7XG4gICAgcmV0dXJuIG1hY3JvU2VjdGlvbnMoXG4gICAgICB0aGlzLiRzdG9yZS5nZXR0ZXJzWydtYWNyb3MvZ2V0Q2F0ZWdvcmllcyddIGFzIE1hY3JvQ2F0ZWdvcnlbXSxcbiAgICAgIChpZDogc3RyaW5nKSA9PiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydtYWNyb3MvZ2V0TWFjcm9zQnlDYXRlZ29yeSddKGlkKSBhcyBNYWNyb1tdLFxuICAgICAgdGhpcy4kdCgnYXBwLmdlbmVyYWwubGFiZWwudW5jYXRlZ29yaXplZCcpLnRvU3RyaW5nKCksXG4gICAgICB0aGlzLnF1ZXJ5XG4gICAgKVxuICB9XG5cbiAgY291bnRPZiAoc2VjdGlvbjogTWFjcm9TZWN0aW9uKTogbnVtYmVyIHtcbiAgICByZXR1cm4gc2VjdGlvbi5jb3VudCArIChzZWN0aW9uLmlkID09PSAnMCcgPyB0aGlzLmhpZGRlbk1hY3Jvcy5sZW5ndGggOiAwKVxuICB9XG5cbiAgZ2V0IG9yZGVyICgpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2VjdGlvbnMuZmxhdE1hcChzID0+IHMubWFjcm9zLm1hcChtID0+IG0ubmFtZSkpXG4gIH1cblxuICAvKiogVGhlIHJvdyB0aGF0IHRha2VzIFRhYjogdGhlIG9uZSBsYXN0IGNob3NlbiwgZWxzZSB0aGUgZmlyc3QuICovXG4gIGdldCBmb2N1c05hbWUgKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZm9jdXNlZCAmJiB0aGlzLm9yZGVyLmluY2x1ZGVzKHRoaXMuZm9jdXNlZCkgPyB0aGlzLmZvY3VzZWQgOiB0aGlzLm9yZGVyWzBdXG4gIH1cblxuICBnZXQgc2hlZXRNYWNybyAoKTogTWFjcm8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnNoZWV0Rm9yID8gdGhpcy5hbGxNYWNyb3MuZmluZChtID0+IG0ubmFtZSA9PT0gdGhpcy5zaGVldEZvcikgOiB1bmRlZmluZWRcbiAgfVxuXG4gIG1hY3JvIChuYW1lOiBzdHJpbmcpOiBNYWNybyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuYWxsTWFjcm9zLmZpbmQobSA9PiBtLm5hbWUgPT09IG5hbWUpXG4gIH1cblxuICB0aXRsZU9mIChtOiBNYWNybyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG0uYWxpYXMgfHwgbS5uYW1lLnRvVXBwZXJDYXNlKClcbiAgfVxuXG4gIHRpdGxlT2ZOYW1lIChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG0gPSB0aGlzLm1hY3JvKG5hbWUpXG4gICAgcmV0dXJuIG0gPyB0aGlzLnRpdGxlT2YobSkgOiBuYW1lXG4gIH1cblxuICBzZWN0aW9uT2YgKG06IE1hY3JvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbS5jYXRlZ29yeUlkICYmIG0uY2F0ZWdvcnkgPyBtLmNhdGVnb3J5SWQgOiAnMCdcbiAgfVxuXG4gIGFsbEluIChuYW1lczogc3RyaW5nW10sIHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG5hbWVzLmV2ZXJ5KG4gPT4ge1xuICAgICAgY29uc3QgbSA9IHRoaXMubWFjcm8obilcbiAgICAgIHJldHVybiBtICYmIHRoaXMuc2VjdGlvbk9mKG0pID09PSBzZWN0aW9uSWRcbiAgICB9KVxuICB9XG5cbiAgcGxhY2VPZiAobmFtZTogc3RyaW5nKTogTWFjcm9QbGFjZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGxhY2VzLmdldChuYW1lLnRvVXBwZXJDYXNlKCkpXG4gIH1cblxuICAvKiogXCIgwrcgbWFjcm9zL2ZpbGFtZW50LmNmZzo0OVwiLCBvciBub3RoaW5nIHVudGlsIGl0J3MgZm91bmQuICovXG4gIHBsYWNlVGV4dCAobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBwbGFjZSA9IHRoaXMucGxhY2VPZihuYW1lKVxuICAgIHJldHVybiBwbGFjZSA/IGAgwrcgJHtwbGFjZS5wYXRofToke3BsYWNlLmxpbmV9YCA6ICcnXG4gIH1cblxuICBnZXQgZGV2ZWxvcGVyVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Njb3BlZFBhdGgoJy9zZXR0aW5ncycsIGFjdGl2ZVNsdWcoKSl9I2RldmVsb3BlcmBcbiAgfVxuXG4gIGlzU2VsZWN0ZWQgKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGVkLmluY2x1ZGVzKG5hbWUpXG4gIH1cblxuICBzZWxlY3QgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuc2VsZWN0ZWQgPSBbbmFtZV1cbiAgICB0aGlzLmFuY2hvciA9IG5hbWVcbiAgICB0aGlzLmZvY3VzZWQgPSBuYW1lXG4gIH1cblxuICB0b2dnbGUgKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuc2VsZWN0ZWQgPSB0aGlzLmlzU2VsZWN0ZWQobmFtZSkgPyB0aGlzLnNlbGVjdGVkLmZpbHRlcihuID0+IG4gIT09IG5hbWUpIDogWy4uLnRoaXMuc2VsZWN0ZWQsIG5hbWVdXG4gICAgdGhpcy5hbmNob3IgPSBuYW1lXG4gICAgdGhpcy5mb2N1c2VkID0gbmFtZVxuICB9XG5cbiAgY2xlYXIgKCkge1xuICAgIHRoaXMuc2VsZWN0ZWQgPSBbXVxuICAgIHRoaXMuYW5jaG9yID0gbnVsbFxuICAgIHRoaXMucGlja2luZyA9IGZhbHNlXG4gIH1cblxuICAvKiogRW1wdHkgc3BhY2UgYW55d2hlcmUgaW4gdGhlIHBhbmVsIChwYWRkaW5nLCBnYXBzLCBoZWFkaW5ncykgY2xlYXJzIHRoZSBzZWxlY3Rpb247IGEgcm93LCBidXR0b24sIGZpZWxkIG9yIG1lbnUga2VlcHMgaXQuICovXG4gIG9uUGFuZWxDbGljayAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsXG4gICAgaWYgKHRhcmdldD8uY2xvc2VzdCgnW3JvbGU9XCJvcHRpb25cIl0sIFtyb2xlPVwibWVudWl0ZW1cIl0sIGJ1dHRvbiwgYSwgaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIGxhYmVsLCAudi1pbnB1dCwgLnYtbWVudV9fY29udGVudCcpKSByZXR1cm5cbiAgICB0aGlzLmNsZWFyKClcbiAgfVxuXG4gIC8qKiBDdHJsK0EgKENtZCtBKSBzZWxlY3RzIGV2ZXJ5IG1hY3JvIHNob3duLCB1bmxlc3MgdGhlIGtleXMgYXJlIGdvaW5nIHRvIGEgZmllbGQuICovXG4gIG9uUGFuZWxLZXkgKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpICE9PSAnYScgfHwgIShldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXkpIHx8IGV2ZW50LmFsdEtleSkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuICAgIGlmICh0YXJnZXQ/LmNsb3Nlc3QoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0LCBbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXScpKSByZXR1cm5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5zZWxlY3RlZCA9IFsuLi50aGlzLm9yZGVyXVxuICAgIHRoaXMuYW5jaG9yID0gdGhpcy5vcmRlclswXSA/PyBudWxsXG4gIH1cblxuICAvKiogQSBzaGlmdC1jbGljayBzZWxlY3RzIGEgcmFuZ2U7IHdpdGhvdXQgdGhpcyB0aGUgYnJvd3NlciBhbHNvIHNlbGVjdHMgdGhlIHRleHQgYmV0d2Vlbi4gKi9cbiAgb25Sb3dNb3VzZURvd24gKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBvblJvd0NsaWNrIChldmVudDogTW91c2VFdmVudCwgbmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMucHJlc3NlZCkge1xuICAgICAgdGhpcy5wcmVzc2VkID0gZmFsc2VcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkgJiYgdGhpcy5hbmNob3IpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWQgPSByYW5nZU9mKHRoaXMub3JkZXIsIHRoaXMuYW5jaG9yLCBuYW1lKVxuICAgICAgdGhpcy5mb2N1c2VkID0gbmFtZVxuICAgIH0gZWxzZSBpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5IHx8IHRoaXMucGlja2luZykge1xuICAgICAgdGhpcy50b2dnbGUobmFtZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZWxlY3QobmFtZSlcbiAgICB9XG4gIH1cblxuICBvblByZXNzU3RhcnQgKG5hbWU6IHN0cmluZykge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnByZXNzVGltZXIpXG4gICAgdGhpcy5wcmVzc2VkID0gZmFsc2VcbiAgICB0aGlzLnByZXNzVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLnByZXNzZWQgPSB0cnVlXG4gICAgICB0aGlzLnBpY2tpbmcgPSB0cnVlXG4gICAgICBpZiAoIXRoaXMuaXNTZWxlY3RlZChuYW1lKSkgdGhpcy50b2dnbGUobmFtZSlcbiAgICB9LCBMT05HX1BSRVNTX01TKVxuICB9XG5cbiAgb25QcmVzc0VuZCAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucHJlc3NUaW1lcilcbiAgfVxuXG4gIG9wZW4gKG06IE1hY3JvKSB7XG4gICAgdGhpcy5zZWxlY3QobS5uYW1lKVxuICAgIHRoaXMuc2hlZXRGb3IgPSBtLm5hbWVcbiAgfVxuXG4gIG9wZW5JbkVkaXRvciAobmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgcGxhY2UgPSB0aGlzLnBsYWNlT2YobmFtZSlcbiAgICBpZiAoIXBsYWNlIHx8ICF0aGlzLmVkaXRhYmxlKSByZXR1cm5cbiAgICB0aGlzLiRyb3V0ZXIucHVzaCh7XG4gICAgICBwYXRoOiBzY29wZWRQYXRoKCcvY29uZmlndXJlJywgYWN0aXZlU2x1ZygpKSxcbiAgICAgIHF1ZXJ5OiB7IG9wZW46IGAke3BsYWNlLnJvb3R9LyR7cGxhY2UucGF0aH1gLCBsaW5lOiBTdHJpbmcocGxhY2UubGluZSkgfVxuICAgIH0pXG4gIH1cblxuICBvbktleSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIG06IE1hY3JvKSB7XG4gICAgaWYgKGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCkgcmV0dXJuXG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgdGhpcy5vcGVuKG0pXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJyAnKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5KSB0aGlzLnRvZ2dsZShtLm5hbWUpXG4gICAgICBlbHNlIHRoaXMuc2VsZWN0KG0ubmFtZSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ICE9PSAnQXJyb3dEb3duJyAmJiBldmVudC5rZXkgIT09ICdBcnJvd1VwJykgcmV0dXJuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGkgPSB0aGlzLm9yZGVyLmluZGV4T2YobS5uYW1lKVxuICAgIGNvbnN0IG5leHQgPSB0aGlzLm9yZGVyW2kgKyAoZXZlbnQua2V5ID09PSAnQXJyb3dEb3duJyA/IDEgOiAtMSldXG4gICAgaWYgKCFuZXh0KSByZXR1cm5cbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkgJiYgdGhpcy5hbmNob3IpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWQgPSByYW5nZU9mKHRoaXMub3JkZXIsIHRoaXMuYW5jaG9yLCBuZXh0KVxuICAgICAgdGhpcy5mb2N1c2VkID0gbmV4dFxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlbGVjdChuZXh0KVxuICAgIH1cbiAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAodGhpcy4kZWwucXVlcnlTZWxlY3RvcihgW2RhdGEtdGlkPSR7SlNPTi5zdHJpbmdpZnkoYG1hY3JvLXJvdy0ke25leHR9YCl9XWApIGFzIEhUTUxFbGVtZW50IHwgbnVsbCk/LmZvY3VzKClcbiAgICB9KVxuICB9XG5cbiAgLyoqIERyYWdzIHRoZSBzZWxlY3Rpb24gd2hlbiB0aGUgcm93IGlzIGluIGl0LCBlbHNlIGp1c3QgdGhlIHJvdy4gKi9cbiAgb25EcmFnU3RhcnQgKGV2ZW50OiBEcmFnRXZlbnQsIG5hbWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLmxvY2tlZCkgcmV0dXJuXG4gICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQobmFtZSkpIHRoaXMuc2VsZWN0KG5hbWUpXG4gICAgdGhpcy5kcmFnZ2luZyA9IHRoaXMub3JkZXIuZmlsdGVyKG4gPT4gdGhpcy5pc1NlbGVjdGVkKG4pKVxuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnXG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIHRoaXMuZHJhZ2dpbmcuam9pbignXFxuJykpXG4gICAgfVxuICB9XG5cbiAgb25TZWN0aW9uRHJhZ1N0YXJ0IChldmVudDogRHJhZ0V2ZW50LCBpZDogc3RyaW5nKSB7XG4gICAgaWYgKGlkID09PSAnMCcgfHwgdGhpcy5sb2NrZWQpIHJldHVyblxuICAgIHRoaXMuZHJhZ2dpbmdTZWN0aW9uID0gaWRcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9ICdtb3ZlJ1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBgc2VjdGlvbjoke2lkfWApXG4gICAgfVxuICB9XG5cbiAgb25EcmFnRW5kICgpIHtcbiAgICB0aGlzLmRyYWdnaW5nID0gW11cbiAgICB0aGlzLmRyYWdnaW5nU2VjdGlvbiA9IG51bGxcbiAgICB0aGlzLmRyb3BPbiA9IG51bGxcbiAgfVxuXG4gIG9uRHJhZ092ZXIgKGV2ZW50OiBEcmFnRXZlbnQsIHNlY3Rpb25JZDogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nLmxlbmd0aCAmJiAhdGhpcy5kcmFnZ2luZ1NlY3Rpb24pIHJldHVyblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdtb3ZlJ1xuICAgIHRoaXMuZHJvcE9uID0gc2VjdGlvbklkXG4gIH1cblxuICBvbkRyYWdMZWF2ZSAoZXZlbnQ6IERyYWdFdmVudCwgc2VjdGlvbklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCB0byA9IGV2ZW50LnJlbGF0ZWRUYXJnZXQgYXMgTm9kZSB8IG51bGxcbiAgICBpZiAodG8gJiYgKGV2ZW50LmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNvbnRhaW5zKHRvKSkgcmV0dXJuXG4gICAgaWYgKHRoaXMuZHJvcE9uID09PSBzZWN0aW9uSWQpIHRoaXMuZHJvcE9uID0gbnVsbFxuICB9XG5cbiAgb25Ecm9wIChldmVudDogRHJhZ0V2ZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgYmVmb3JlPzogc3RyaW5nKSB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuZHJhZ2dpbmdTZWN0aW9uXG4gICAgY29uc3QgbmFtZXMgPSB0aGlzLmRyYWdnaW5nLmxlbmd0aCA/IHRoaXMuZHJhZ2dpbmcgOiAoZXZlbnQuZGF0YVRyYW5zZmVyPy5nZXREYXRhKCd0ZXh0L3BsYWluJykgPz8gJycpLnNwbGl0KCdcXG4nKS5maWx0ZXIobiA9PiBuICYmICFuLnN0YXJ0c1dpdGgoJ3NlY3Rpb246JykpXG4gICAgdGhpcy5vbkRyYWdFbmQoKVxuICAgIGlmICh0aGlzLmxvY2tlZCkgcmV0dXJuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGlmIChzZWN0aW9uKSB0aGlzLm1vdmVTZWN0aW9uKHNlY3Rpb24sIHNlY3Rpb25JZClcbiAgICBlbHNlIGlmIChuYW1lcy5sZW5ndGgpIHRoaXMubW92ZVRvKG5hbWVzLCBzZWN0aW9uSWQsIGJlZm9yZSlcbiAgfVxuXG4gIC8qKiBQdXRzIHRoZSBkcmFnZ2VkIHNlY3Rpb24gYmVmb3JlIHRoZSBvbmUgaXQncyBkcm9wcGVkIG9uIChVbmNhdGVnb3Jpc2VkIHN0YXlzIGxhc3QpLiAqL1xuICBtb3ZlU2VjdGlvbiAoaWQ6IHN0cmluZywgb250bzogc3RyaW5nKSB7XG4gICAgY29uc3QgaWRzID0gdGhpcy5zZWN0aW9ucy5tYXAocyA9PiBzLmlkKS5maWx0ZXIocyA9PiBzICE9PSAnMCcpXG4gICAgY29uc3QgbmV4dCA9IHNlY3Rpb25zTW92ZWQoaWRzLCBpZCwgb250byA9PT0gJzAnID8gdW5kZWZpbmVkIDogb250bylcbiAgICBpZiAobmV4dCkgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ21hY3Jvcy9zYXZlQ2F0ZWdvcnlPcmRlcicsIG5leHQpXG4gIH1cblxuICAvKiogTW92ZXMgdGhlIG1hY3JvcyBpbnRvIHRoZSBzZWN0aW9uLCBiZWZvcmUgYGJlZm9yZWAgKG9yIGxhc3QpLCBhbmQgc2F2ZXMgdGhlIHNlY3Rpb24ncyBvcmRlci4gKi9cbiAgbW92ZVRvIChuYW1lczogc3RyaW5nW10sIHNlY3Rpb25JZDogc3RyaW5nLCBiZWZvcmU/OiBzdHJpbmcpIHtcbiAgICB0aGlzLm1vdmVGb3IgPSBudWxsXG4gICAgY29uc3QgbWFjcm9zID0gbWFjcm9zTW92ZWRUbyhcbiAgICAgIHRoaXMuYWxsTWFjcm9zLFxuICAgICAgKGlkOiBzdHJpbmcpID0+IHRoaXMuJHN0b3JlLmdldHRlcnNbJ21hY3Jvcy9nZXRNYWNyb3NCeUNhdGVnb3J5J10oaWQpIGFzIE1hY3JvW10sXG4gICAgICBuYW1lcyxcbiAgICAgIHNlY3Rpb25JZCxcbiAgICAgIGJlZm9yZVxuICAgIClcbiAgICBpZiAoIW1hY3JvcykgcmV0dXJuXG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ21hY3Jvcy9zYXZlQWxsT3JkZXInLCBtYWNyb3MpXG4gIH1cblxuICBzZXRWaXNpYmxlIChtOiBNYWNybywgdmlzaWJsZTogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdtYWNyb3Mvc2F2ZU1hY3JvJywgeyAuLi5tLCB2aXNpYmxlOiAhIXZpc2libGUgfSlcbiAgfVxuXG4gIHNldFNlbGVjdGVkVmlzaWJsZSAodmlzaWJsZTogYm9vbGVhbikge1xuICAgIGNvbnN0IG1hY3JvcyA9IHRoaXMuc2VsZWN0ZWQubWFwKG4gPT4gdGhpcy5tYWNybyhuKSkuZmlsdGVyKChtKTogbSBpcyBNYWNybyA9PiAhIW0pXG4gICAgaWYgKG1hY3Jvcy5sZW5ndGgpIHRoaXMuJHN0b3JlLmRpc3BhdGNoKHZpc2libGUgPyAnbWFjcm9zL3NhdmVBbGxPbicgOiAnbWFjcm9zL3NhdmVBbGxPZmYnLCBtYWNyb3MpXG4gIH1cblxuICBzZXRBbGxWaXNpYmxlIChzZWN0aW9uOiBNYWNyb1NlY3Rpb24sIHZpc2libGU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBtYWNyb3MgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydtYWNyb3MvZ2V0TWFjcm9zQnlDYXRlZ29yeSddKHNlY3Rpb24uaWQpIGFzIE1hY3JvW11cbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCh2aXNpYmxlID8gJ21hY3Jvcy9zYXZlQWxsT24nIDogJ21hY3Jvcy9zYXZlQWxsT2ZmJywgbWFjcm9zKVxuICB9XG5cbiAgLyoqIEEgbmV3IHNlY3Rpb247IGZyb20gTW92ZSB0b+KApiwgdGhlIG1hY3JvcyBnbyBpbnRvIGl0LiAqL1xuICBhZGRDYXRlZ29yeSAobW92aW5nPzogc3RyaW5nW10pIHtcbiAgICB0aGlzLm1vdmVGb3IgPSBudWxsXG4gICAgdGhpcy5jYXRlZ29yeURpYWxvZyA9IHtcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICB0aXRsZTogJ05ldyBzZWN0aW9uJyxcbiAgICAgIG5hbWU6ICcnLFxuICAgICAgc2F2ZTogYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnbWFjcm9zL2FkZENhdGVnb3J5JywgbmFtZSlcbiAgICAgICAgY29uc3QgbWFkZSA9IFsuLi4odGhpcy4kc3RvcmUuc3RhdGUubWFjcm9zLmNhdGVnb3JpZXMgYXMgTWFjcm9DYXRlZ29yeVtdKV0ucmV2ZXJzZSgpLmZpbmQoYyA9PiBjLm5hbWUgPT09IG5hbWUpXG4gICAgICAgIGlmIChtb3Zpbmc/Lmxlbmd0aCAmJiBtYWRlKSB0aGlzLm1vdmVUbyhtb3ZpbmcsIG1hZGUuaWQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVuYW1lQ2F0ZWdvcnkgKHNlY3Rpb246IE1hY3JvU2VjdGlvbikge1xuICAgIHRoaXMuY2F0ZWdvcnlEaWFsb2cgPSB7XG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgdGl0bGU6ICdSZW5hbWUgdGhlIHNlY3Rpb24nLFxuICAgICAgbmFtZTogc2VjdGlvbi5uYW1lLFxuICAgICAgc2F2ZTogKG5hbWU6IHN0cmluZykgPT4gdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ21hY3Jvcy9lZGl0Q2F0ZWdvcnknLCB7IGlkOiBzZWN0aW9uLmlkLCBuYW1lIH0pXG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2F0ZWdvcnkgKHNlY3Rpb246IE1hY3JvU2VjdGlvbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdtYWNyb3MvcmVtb3ZlQ2F0ZWdvcnknLCB7IGlkOiBzZWN0aW9uLmlkLCBuYW1lOiBzZWN0aW9uLm5hbWUgfSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm1wYW5lbCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTJweDtcbiAgICBtYXJnaW4tYm90dG9tOiAxNnB4O1xuICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5tcGFuZWxfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogMTJweDtcblxuICAgIGgyIHtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTdweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDJweCAwIDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5tcGFuZWxfX3Rvb2xzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAubXBhbmVsX19maW5kIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIHdpZHRoOiAxNjBweDtcbiAgICBoZWlnaHQ6IDMycHg7XG4gICAgcGFkZGluZzogMCAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcblxuICAgIGlucHV0IHtcbiAgICAgIGZsZXg6IDEgMSAwO1xuICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgYm9yZGVyOiAwO1xuICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAgIGZvbnQ6IGluaGVyaXQ7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxuICB9XG5cbiAgLm1wYW5lbF9fbm90ZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDEwcHggMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuXG4gICAgYSB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCkgIWltcG9ydGFudDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuICB9XG5cbiAgLm1wYW5lbF9faGludCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5tcGFuZWxfX3NlY3Rpb24ge1xuICAgIHBhZGRpbmc6IDRweCAxMHB4IDZweDtcbiAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICB9XG5cbiAgLm1wYW5lbF9fc2VjdGlvbi0tZHJvcCB7XG4gICAgYm9yZGVyLXN0eWxlOiBkYXNoZWQ7XG4gICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5tcGFuZWxfX3NlY3Rpb24taGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcblxuICAgIGgzIHtcbiAgICAgIG1hcmdpbjogNnB4IDAgMnB4O1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICBsZXR0ZXItc3BhY2luZzogMC4wNGVtO1xuICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcblxuICAgICAgc3BhbiB7XG4gICAgICAgIG1hcmdpbi1sZWZ0OiA2cHg7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICBsZXR0ZXItc3BhY2luZzogMDtcbiAgICAgICAgdGV4dC10cmFuc2Zvcm06IG5vbmU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLm1wYW5lbF9fbW9yZSB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogMzJweDtcbiAgICBoZWlnaHQ6IDMycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgJjpob3ZlcixcbiAgICAmOmZvY3VzLXZpc2libGUge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgfVxuICB9XG5cbiAgLm1wYW5lbF9fcm93IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIG1pbi1oZWlnaHQ6IDQ4cHg7XG4gICAgcGFkZGluZzogMCA2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgdXNlci1zZWxlY3Q6IG5vbmU7XG5cbiAgICAmICsgJiB7XG4gICAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgfVxuXG4gICAgJjpmb2N1cy12aXNpYmxlIHtcbiAgICAgIG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICAgIG91dGxpbmUtb2Zmc2V0OiAtMnB4O1xuICAgIH1cbiAgfVxuXG4gIC5tcGFuZWxfX3Jvdy0tc2VsZWN0ZWQge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICB9XG5cbiAgLm1wYW5lbF9fcm93LS1kcmFnZ2luZyB7XG4gICAgb3BhY2l0eTogMC41O1xuICB9XG5cbiAgLm1wYW5lbF9fd2hhdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi13aWR0aDogMDtcblxuICAgIGIge1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG5cbiAgICBzcGFuIHtcbiAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICB9XG4gIH1cblxuICAubXBhbmVsX19zaG93biB7XG4gICAgZmxleDogMCAwIGF1dG87XG4gIH1cblxuICAubXBhbmVsX19lbXB0eSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDEwcHggNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuPC9zdHlsZT5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubXBhbmVsX19saXN0IHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgYm9yZGVyLXJhZGl1czogMTZweDsgb3ZlcmZsb3c6IGhpZGRlbjsgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7IH1cbiAgLm1wYW5lbF9fYmFyIHsgZGlzcGxheTogZmxleDsgZmxleC13cmFwOiB3cmFwOyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDhweDsgbWluLWhlaWdodDogNDRweDsgcGFkZGluZzogNnB4IDEycHg7IH1cbiAgLm1wYW5lbF9fYmFyLS1vbiB7IGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtYWNjZW50KSAxNCUsIHRyYW5zcGFyZW50KTsgfVxuICAubXBhbmVsX19kb25lIHsgbWFyZ2luLWxlZnQ6IGF1dG87IH1cbiAgLm1wYW5lbF9fc2VjdGlvbi1oZWFkIHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA4cHg7IHBhZGRpbmc6IDhweCAxMnB4OyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlOyBsZXR0ZXItc3BhY2luZzogLjA2ZW07IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuICAubXBhbmVsX19zZWN0aW9uLWhlYWQgaDMgeyBmbGV4OiAxIDEgYXV0bzsgbWFyZ2luOiAwOyBmb250LXNpemU6IDEycHg7IH1cbiAgLm1wYW5lbF9fc2VjdGlvbi1oZWFkW2RyYWdnYWJsZT1cInRydWVcIl0geyBjdXJzb3I6IGdyYWI7IH1cbiAgLm1wYW5lbF9fY291bnQgeyBmb250LXNpemU6IDEycHg7IHRleHQtdHJhbnNmb3JtOiBub25lOyBsZXR0ZXItc3BhY2luZzogMDsgfVxuICAubXBhbmVsX19ncmlwIHsgZmxleDogbm9uZTsgd2lkdGg6IDhweDsgaGVpZ2h0OiAxNHB4OyBvcGFjaXR5OiAuNTsgYmFja2dyb3VuZC1pbWFnZTogcmFkaWFsLWdyYWRpZW50KGN1cnJlbnRDb2xvciAxLjJweCwgdHJhbnNwYXJlbnQgMS4zcHgpOyBiYWNrZ3JvdW5kLXNpemU6IDRweCA0cHg7IH1cbiAgLm1wYW5lbF9fY2hlY2sgeyBmbGV4OiBub25lOyB3aWR0aDogMTZweDsgaGVpZ2h0OiAxNnB4OyBhY2NlbnQtY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpOyB9XG4gIC5tcGFuZWxfX3Jvdzpub3QoLm1wYW5lbF9fcm93LS1zZWxlY3RlZCk6bm90KDpob3ZlcikgLm1wYW5lbF9fY2hlY2sgeyBvcGFjaXR5OiAuMzU7IH1cbiAgLm1wYW5lbF9fZG90IHsgZmxleDogbm9uZTsgd2lkdGg6IDEwcHg7IGhlaWdodDogMTBweDsgYm9yZGVyLXJhZGl1czogNTAlOyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IH1cbiAgLm1wYW5lbF9fY2hpcCB7IGZsZXg6IG5vbmU7IHBhZGRpbmc6IDJweCA4cHg7IGJvcmRlci1yYWRpdXM6IDk5OXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTJweDsgfVxuICAubXBhbmVsX19tb25vIHsgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8sIG1vbm9zcGFjZSk7IH1cbiAgLm1wYW5lbF9fcm93LS1oaWRkZW4geyBvcGFjaXR5OiAuNzU7IGN1cnNvcjogZGVmYXVsdDsgfVxuICAubXBhbmVsX19tb3JlLXJvd3MgeyBwYWRkaW5nOiA4cHggMTZweDsgdGV4dC1hbGlnbjogbGVmdDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgZm9udC1zaXplOiAxM3B4OyBjdXJzb3I6IHBvaW50ZXI7IH1cbiAgLm1wYW5lbF9fZm9vdCB7IG1hcmdpbjogMDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgZm9udC1zaXplOiAxMnB4OyB9XG4gIEBtZWRpYSAoaG92ZXI6IG5vbmUpIHsgLm1wYW5lbF9fY2hlY2sgeyBvcGFjaXR5OiAxICFpbXBvcnRhbnQ7IH0gfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL21hY3Jvcy9NYWNyb1BhbmVsLnZ1ZSJ9