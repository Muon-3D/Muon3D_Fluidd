/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/PlateClearBar.vue";
import __unplugin_components_0 from "/src/components/ui/MachineFaultBar.vue";
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
import BrowserMixin from "/src/mixins/browser.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import ControlActions from "/src/components/control/ControlActions.vue";
import PlateClearBar from "/src/components/ui/PlateClearBar.vue";
import MachineFaultBar from "/src/components/ui/MachineFaultBar.vue";
import { controlTiles } from "/src/components/control/registry.ts";
import { addTile, defaultLayout, moveBy, nudgeSize, removeTile, serverLayoutKey } from "/src/services/overview/layout.ts";
import { loadLayout, saveLayout } from "/src/services/overview/layout-store.ts";
let Control = class extends Mixins(BrowserMixin) {
  defs = controlTiles;
  layout = defaultLayout(controlTiles);
  draft = null;
  narrow = false;
  status = "";
  narrowQuery = null;
  get contextKey() {
    return `${this.$store.state.config.apiUrl}|${cloudState.activePrinterId ?? ""}|${cloudState.account?.id ?? ""}|${this.$route?.params?.printer ?? ""}`;
  }
  get editing() {
    return this.draft !== null;
  }
  get context() {
    return {
      accountId: cloudState.account?.id ?? null,
      printerId: cloudState.activePrinterId ?? this.$route?.params?.printer ?? this.$store.state.config.apiUrl ?? null,
      page: "control"
    };
  }
  get savedLayouts() {
    return this.$store.state.config.uiSettings?.control?.layouts;
  }
  get current() {
    return this.draft ?? this.layout;
  }
  get tiles() {
    return this.current.tiles.flatMap((p) => {
      const def = this.defs.find((d) => d.id === p.id);
      return def ? [{ ...def, ...p }] : [];
    });
  }
  get hiddenDefs() {
    return this.current.hidden.flatMap((id) => this.defs.find((d) => d.id === id) ?? []);
  }
  load() {
    if (this.editing) return;
    this.layout = loadLayout(this.context, this.savedLayouts, localStorage, this.defs);
  }
  created() {
    this.load();
  }
  mounted() {
    if (typeof window.matchMedia === "function") {
      this.narrowQuery = window.matchMedia("(max-width: 1099px)");
      this.narrow = this.narrowQuery.matches;
      this.narrowQuery.addEventListener?.("change", this.onNarrow);
    }
  }
  beforeDestroy() {
    this.narrowQuery?.removeEventListener?.("change", this.onNarrow);
  }
  onNarrow(e) {
    this.narrow = e.matches;
  }
  cellStyle(tile) {
    const def = this.defs.find((d) => d.id === tile.id);
    const tablet = tile.span === def?.span ? tile.tablet : tile.span > 6 ? 12 : 6;
    return { "--span": String(tile.span), "--rows": String(tile.rows), "--tablet": String(tablet) };
  }
  titleOf(id) {
    return this.defs.find((d) => d.id === id)?.title ?? id;
  }
  indexOf(id) {
    return this.current.tiles.findIndex((t) => t.id === id);
  }
  startEdit() {
    this.draft = { tiles: this.layout.tiles.map((t) => ({ ...t })), hidden: [...this.layout.hidden] };
    this.status = "Editing the Control layout.";
  }
  reset() {
    if (!this.draft) return;
    this.draft = defaultLayout(this.defs);
    this.status = "Every tile is back where it started. Choose Done to keep it.";
  }
  done() {
    const draft = this.draft;
    if (!draft) return;
    if (JSON.stringify(draft) !== JSON.stringify(this.layout)) {
      const record = saveLayout(this.context, draft, localStorage);
      this.$store.dispatch("config/saveByPath", {
        // Only this person's key on this printer, never the whole map.
        path: `uiSettings.control.layouts.${serverLayoutKey(this.context.accountId, this.context.printerId)}`,
        value: record,
        server: true
      });
      this.layout = { tiles: record.tiles, hidden: record.hidden };
    }
    this.draft = null;
    this.status = "Control layout saved.";
  }
  /** Stops presses, typing and form changes from reaching a tile while the page is being edited. */
  stopWhileEditing(e) {
    if (!this.editing) return;
    e.stopPropagation();
    e.preventDefault();
  }
  shift(id, by) {
    if (!this.draft) return;
    this.draft = moveBy(this.draft, id, by);
    this.status = `${this.titleOf(id)} moved to place ${this.indexOf(id) + 1} of ${this.draft.tiles.length}.`;
  }
  resize(id, by) {
    if (!this.draft) return;
    this.draft = nudgeSize(this.draft, id, by, 0);
    const t = this.draft.tiles.find((x) => x.id === id);
    this.status = t ? `${this.titleOf(id)} is ${t.span} columns wide.` : "";
  }
  remove(id) {
    if (!this.draft) return;
    this.draft = removeTile(this.draft, id);
    this.status = `${this.titleOf(id)} hidden.`;
  }
  add(id) {
    if (!this.draft) return;
    this.draft = addTile(this.draft, id, this.defs);
    this.status = `${this.titleOf(id)} added.`;
  }
};
__decorateClass([
  Watch("contextKey"),
  Watch("savedLayouts")
], Control.prototype, "load", 1);
Control = __decorateClass([
  Component({ components: { ControlActions, MachineFaultBar, PlateClearBar } })
], Control);
const _sfc_main = Control;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { key: _vm.contextKey, staticClass: "control-page", class: { "control-page--phone": _vm.isMobileViewport, "control-page--edit": _vm.editing }, attrs: { "data-tid": "control-page" } }, [_c(__unplugin_components_0), _c(__unplugin_components_1), _c("div", { staticClass: "control-page__bar" }, [_vm.isMobileViewport && !_vm.editing ? _c("control-actions", { staticClass: "control-page__actions", attrs: { "phone": "" } }) : _vm._e(), _c("span", { staticClass: "control-page__grow" }), _vm.editing ? [_c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "edit-reset" }, on: { "click": _vm.reset } }, [_vm._v(" Reset layout ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "edit-done" }, on: { "click": _vm.done } }, [_vm._v(" Done ")])] : _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "edit-open" }, on: { "click": _vm.startEdit } }, [_c(__unplugin_components_2, { attrs: { "name": "pencil", "small": "" } }), _vm._v(" Edit layout ")], 1)], 2), _vm.editing ? _c("section", { staticClass: "control-page__tray", attrs: { "data-tid": "add-tile-tray", "aria-label": "Hidden tiles" } }, [_c("b", [_vm._v("Hidden tiles")]), _c("span", { staticClass: "control-page__tray-help" }, [_vm._v(" Move tiles with the arrows, " + _vm._s(_vm.narrow ? "" : "make them narrower or wider, ") + "or hide them. Saved for you, on this printer. ")]), _c("div", { staticClass: "control-page__chips" }, [_vm._l(_vm.hiddenDefs, function(def) {
    return _c("button", { key: def.id, staticClass: "cbtn", attrs: { "type": "button", "data-tid": `add-${def.id}` }, on: { "click": function($event) {
      return _vm.add(def.id);
    } } }, [_vm._v(" " + _vm._s(def.title)), _c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v(" +")])]);
  }), !_vm.hiddenDefs.length ? _c("span", { staticClass: "control-page__muted" }, [_vm._v("Every tile is on the page.")]) : _vm._e()], 2)]) : _vm._e(), _c("div", { staticClass: "control-page__grid", attrs: { "data-tid": "control-grid" } }, [_vm._l(_vm.tiles, function(tile) {
    return _c("div", { key: tile.id, staticClass: "control-page__cell", style: _vm.cellStyle(tile), attrs: { "data-cell": tile.id } }, [_c("div", { staticClass: "control-page__body", attrs: { "inert": _vm.editing ? true : void 0, "aria-hidden": _vm.editing ? "true" : void 0 }, on: { "!click": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!pointerdown": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!keydown": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!input": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!change": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    } } }, [_c(tile.component, _vm._b({ tag: "component" }, "component", tile.phoneProp ? { phone: _vm.isMobileViewport } : {}, false))], 1), _vm.editing ? _c("div", { staticClass: "control-page__edit", attrs: { "data-tid": "tile-edit" } }, [_c("b", [_vm._v(_vm._s(tile.title))]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "aria-label": `Move ${tile.title} earlier`, "disabled": _vm.indexOf(tile.id) === 0, "data-tid": "tile-earlier" }, on: { "click": function($event) {
      return _vm.shift(tile.id, -1);
    } } }, [_vm._v(" \u2190 ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "aria-label": `Move ${tile.title} later`, "disabled": _vm.indexOf(tile.id) === _vm.tiles.length - 1, "data-tid": "tile-later" }, on: { "click": function($event) {
      return _vm.shift(tile.id, 1);
    } } }, [_vm._v(" \u2192 ")]), !_vm.narrow ? [_c("button", { staticClass: "cbtn", attrs: { "type": "button", "aria-label": `Make ${tile.title} narrower`, "data-tid": "tile-narrower" }, on: { "click": function($event) {
      return _vm.resize(tile.id, -1);
    } } }, [_vm._v(" \u2212 ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "aria-label": `Make ${tile.title} wider`, "data-tid": "tile-wider" }, on: { "click": function($event) {
      return _vm.resize(tile.id, 1);
    } } }, [_vm._v(" + ")])] : _vm._e(), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "aria-label": `Hide ${tile.title}`, "data-tid": "tile-remove" }, on: { "click": function($event) {
      return _vm.remove(tile.id);
    } } }, [_vm._v(" Hide ")])], 2) : _vm._e()]);
  }), !_vm.tiles.length ? _c("p", { staticClass: "control-page__empty", attrs: { "data-tid": "control-empty" } }, [_vm._v(" " + _vm._s(_vm.editing ? "No tiles on the page. Add one from Hidden tiles above." : "Every tile is hidden. Choose Edit layout to add some back.") + " ")]) : _vm._e()], 2), _c("p", { staticClass: "control-page__sr", attrs: { "role": "status", "aria-live": "polite", "data-tid": "edit-status" } }, [_vm._v(" " + _vm._s(_vm.status) + " ")])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Control.vue?vue&type=style&index=0&scoped=504cf00a&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "504cf00a",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Control.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFZQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLFFBRUE7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUE1RkE7QUFBQSxFQUZBO0FBQUEsRUFDQTtBQUFBLEdBeENBLFFBeUNBO0FBekNBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2wudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIDprZXk9XCJjb250ZXh0S2V5XCJcbiAgICBjbGFzcz1cImNvbnRyb2wtcGFnZVwiXG4gICAgOmNsYXNzPVwieyAnY29udHJvbC1wYWdlLS1waG9uZSc6IGlzTW9iaWxlVmlld3BvcnQsICdjb250cm9sLXBhZ2UtLWVkaXQnOiBlZGl0aW5nIH1cIlxuICAgIGRhdGEtdGlkPVwiY29udHJvbC1wYWdlXCJcbiAgPlxuICAgIDxtYWNoaW5lLWZhdWx0LWJhciAvPlxuXG4gICAgPHBsYXRlLWNsZWFyLWJhciAvPlxuXG4gICAgPGRpdiBjbGFzcz1cImNvbnRyb2wtcGFnZV9fYmFyXCI+XG4gICAgICA8Y29udHJvbC1hY3Rpb25zXG4gICAgICAgIHYtaWY9XCJpc01vYmlsZVZpZXdwb3J0ICYmICFlZGl0aW5nXCJcbiAgICAgICAgY2xhc3M9XCJjb250cm9sLXBhZ2VfX2FjdGlvbnNcIlxuICAgICAgICBwaG9uZVxuICAgICAgLz5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY29udHJvbC1wYWdlX19ncm93XCIgLz5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiZWRpdGluZ1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImVkaXQtcmVzZXRcIlxuICAgICAgICAgIEBjbGljaz1cInJlc2V0XCJcbiAgICAgICAgPlxuICAgICAgICAgIFJlc2V0IGxheW91dFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImVkaXQtZG9uZVwiXG4gICAgICAgICAgQGNsaWNrPVwiZG9uZVwiXG4gICAgICAgID5cbiAgICAgICAgICBEb25lXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1lbHNlXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICBkYXRhLXRpZD1cImVkaXQtb3BlblwiXG4gICAgICAgIEBjbGljaz1cInN0YXJ0RWRpdFwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cInBlbmNpbFwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgRWRpdCBsYXlvdXRcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuXG4gICAgPHNlY3Rpb25cbiAgICAgIHYtaWY9XCJlZGl0aW5nXCJcbiAgICAgIGNsYXNzPVwiY29udHJvbC1wYWdlX190cmF5XCJcbiAgICAgIGRhdGEtdGlkPVwiYWRkLXRpbGUtdHJheVwiXG4gICAgICBhcmlhLWxhYmVsPVwiSGlkZGVuIHRpbGVzXCJcbiAgICA+XG4gICAgICA8Yj5IaWRkZW4gdGlsZXM8L2I+XG4gICAgICA8c3BhbiBjbGFzcz1cImNvbnRyb2wtcGFnZV9fdHJheS1oZWxwXCI+XG4gICAgICAgIE1vdmUgdGlsZXMgd2l0aCB0aGUgYXJyb3dzLCB7eyBuYXJyb3cgPyAnJyA6ICdtYWtlIHRoZW0gbmFycm93ZXIgb3Igd2lkZXIsICcgfX1vciBoaWRlIHRoZW0uIFNhdmVkIGZvciB5b3UsIG9uIHRoaXMgcHJpbnRlci5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sLXBhZ2VfX2NoaXBzXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cImRlZiBpbiBoaWRkZW5EZWZzXCJcbiAgICAgICAgICA6a2V5PVwiZGVmLmlkXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBhZGQtJHtkZWYuaWR9YFwiXG4gICAgICAgICAgQGNsaWNrPVwiYWRkKGRlZi5pZClcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgZGVmLnRpdGxlIH19PHNwYW4gYXJpYS1oaWRkZW49XCJ0cnVlXCI+ICs8L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCIhaGlkZGVuRGVmcy5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwiY29udHJvbC1wYWdlX19tdXRlZFwiXG4gICAgICAgID5FdmVyeSB0aWxlIGlzIG9uIHRoZSBwYWdlLjwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxkaXZcbiAgICAgIGNsYXNzPVwiY29udHJvbC1wYWdlX19ncmlkXCJcbiAgICAgIGRhdGEtdGlkPVwiY29udHJvbC1ncmlkXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZm9yPVwidGlsZSBpbiB0aWxlc1wiXG4gICAgICAgIDprZXk9XCJ0aWxlLmlkXCJcbiAgICAgICAgY2xhc3M9XCJjb250cm9sLXBhZ2VfX2NlbGxcIlxuICAgICAgICA6c3R5bGU9XCJjZWxsU3R5bGUodGlsZSlcIlxuICAgICAgICA6ZGF0YS1jZWxsPVwidGlsZS5pZFwiXG4gICAgICA+XG4gICAgICAgIDwhLS0gV2hpbGUgZWRpdGluZywgdGhlIHRpbGUgaXMgb25seSBhIHBpY3R1cmU6IG5vdGhpbmcgaW4gaXQgY2FuIGJlIHByZXNzZWQgb3Igc2VudC4gLS0+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cImNvbnRyb2wtcGFnZV9fYm9keVwiXG4gICAgICAgICAgOmluZXJ0PVwiZWRpdGluZyA/IHRydWUgOiB1bmRlZmluZWRcIlxuICAgICAgICAgIDphcmlhLWhpZGRlbj1cImVkaXRpbmcgPyAndHJ1ZScgOiB1bmRlZmluZWRcIlxuICAgICAgICAgIEBjbGljay5jYXB0dXJlPVwic3RvcFdoaWxlRWRpdGluZ1wiXG4gICAgICAgICAgQHBvaW50ZXJkb3duLmNhcHR1cmU9XCJzdG9wV2hpbGVFZGl0aW5nXCJcbiAgICAgICAgICBAa2V5ZG93bi5jYXB0dXJlPVwic3RvcFdoaWxlRWRpdGluZ1wiXG4gICAgICAgICAgQGlucHV0LmNhcHR1cmU9XCJzdG9wV2hpbGVFZGl0aW5nXCJcbiAgICAgICAgICBAY2hhbmdlLmNhcHR1cmU9XCJzdG9wV2hpbGVFZGl0aW5nXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxjb21wb25lbnRcbiAgICAgICAgICAgIDppcz1cInRpbGUuY29tcG9uZW50XCJcbiAgICAgICAgICAgIHYtYmluZD1cInRpbGUucGhvbmVQcm9wID8geyBwaG9uZTogaXNNb2JpbGVWaWV3cG9ydCB9IDoge31cIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cImVkaXRpbmdcIlxuICAgICAgICAgIGNsYXNzPVwiY29udHJvbC1wYWdlX19lZGl0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInRpbGUtZWRpdFwiXG4gICAgICAgID5cbiAgICAgICAgICA8Yj57eyB0aWxlLnRpdGxlIH19PC9iPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE1vdmUgJHt0aWxlLnRpdGxlfSBlYXJsaWVyYFwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJpbmRleE9mKHRpbGUuaWQpID09PSAwXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1lYXJsaWVyXCJcbiAgICAgICAgICAgIEBjbGljaz1cInNoaWZ0KHRpbGUuaWQsIC0xKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAg4oaQXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgTW92ZSAke3RpbGUudGl0bGV9IGxhdGVyYFwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJpbmRleE9mKHRpbGUuaWQpID09PSB0aWxlcy5sZW5ndGggLSAxXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1sYXRlclwiXG4gICAgICAgICAgICBAY2xpY2s9XCJzaGlmdCh0aWxlLmlkLCAxKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAg4oaSXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCIhbmFycm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBNYWtlICR7dGlsZS50aXRsZX0gbmFycm93ZXJgXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ0aWxlLW5hcnJvd2VyXCJcbiAgICAgICAgICAgICAgQGNsaWNrPVwicmVzaXplKHRpbGUuaWQsIC0xKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIOKIklxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBNYWtlICR7dGlsZS50aXRsZX0gd2lkZXJgXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ0aWxlLXdpZGVyXCJcbiAgICAgICAgICAgICAgQGNsaWNrPVwicmVzaXplKHRpbGUuaWQsIDEpXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgK1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBIaWRlICR7dGlsZS50aXRsZX1gXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1yZW1vdmVcIlxuICAgICAgICAgICAgQGNsaWNrPVwicmVtb3ZlKHRpbGUuaWQpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBIaWRlXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwiIXRpbGVzLmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwiY29udHJvbC1wYWdlX19lbXB0eVwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29udHJvbC1lbXB0eVwiXG4gICAgICA+XG4gICAgICAgIHt7IGVkaXRpbmcgPyAnTm8gdGlsZXMgb24gdGhlIHBhZ2UuIEFkZCBvbmUgZnJvbSBIaWRkZW4gdGlsZXMgYWJvdmUuJyA6ICdFdmVyeSB0aWxlIGlzIGhpZGRlbi4gQ2hvb3NlIEVkaXQgbGF5b3V0IHRvIGFkZCBzb21lIGJhY2suJyB9fVxuICAgICAgPC9wPlxuICAgIDwvZGl2PlxuICAgIDxwXG4gICAgICBjbGFzcz1cImNvbnRyb2wtcGFnZV9fc3JcIlxuICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICBhcmlhLWxpdmU9XCJwb2xpdGVcIlxuICAgICAgZGF0YS10aWQ9XCJlZGl0LXN0YXR1c1wiXG4gICAgPlxuICAgICAge3sgc3RhdHVzIH19XG4gICAgPC9wPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IHsgY2xvdWRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCBDb250cm9sQWN0aW9ucyBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sQWN0aW9ucy52dWUnXG5pbXBvcnQgUGxhdGVDbGVhckJhciBmcm9tICdAL2NvbXBvbmVudHMvdWkvUGxhdGVDbGVhckJhci52dWUnXG5pbXBvcnQgTWFjaGluZUZhdWx0QmFyIGZyb20gJ0AvY29tcG9uZW50cy91aS9NYWNoaW5lRmF1bHRCYXIudnVlJ1xuaW1wb3J0IHsgY29udHJvbFRpbGVzLCB0eXBlIENvbnRyb2xUaWxlRGVmIH0gZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvcmVnaXN0cnknXG5pbXBvcnQgeyBhZGRUaWxlLCBkZWZhdWx0TGF5b3V0LCBtb3ZlQnksIG51ZGdlU2l6ZSwgcmVtb3ZlVGlsZSwgc2VydmVyTGF5b3V0S2V5LCB0eXBlIE92ZXJ2aWV3TGF5b3V0LCB0eXBlIFBsYWNlZFRpbGUgfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L2xheW91dCdcbmltcG9ydCB7IGxvYWRMYXlvdXQsIHNhdmVMYXlvdXQsIHR5cGUgTGF5b3V0Q29udGV4dCB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvbGF5b3V0LXN0b3JlJ1xuXG50eXBlIERyYXduVGlsZSA9IENvbnRyb2xUaWxlRGVmICYgUGxhY2VkVGlsZVxuXG4vKipcbiAqIENvbnRyb2w6IG1vdmUsIGhlYXQgYW5kIGZlZWQgdGhlIHByaW50ZXIgYnkgaGFuZCwgYXMgRDMgdGlsZXMgKHRoZSB2M1xuICogbGF5b3V0KS4gV2hpY2ggdGlsZXMgdGhlcmUgYXJlIGlzIGNvbXBvbmVudHMvY29udHJvbC9yZWdpc3RyeTsgd2hlcmUgdGhleVxuICogc2l0IGFuZCBob3cgd2lkZSB0aGV5IGFyZSBpcyB0aGlzIHBlcnNvbidzIGxheW91dCBvbiB0aGlzIHByaW50ZXIsIGNoYW5nZWRcbiAqIHdpdGggRWRpdCBsYXlvdXQgKHRoZSBzYW1lIGxheW91dCBydWxlcyBhcyB0aGUgT3ZlcnZpZXcpLiBXaGlsZSBlZGl0aW5nLFxuICogdGhlIHRpbGVzIGFyZSBpbmVydDogbm90aGluZyBpcyBzZW50IHRvIHRoZSBwcmludGVyLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBDb250cm9sQWN0aW9ucywgTWFjaGluZUZhdWx0QmFyLCBQbGF0ZUNsZWFyQmFyIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnRyb2wgZXh0ZW5kcyBNaXhpbnMoQnJvd3Nlck1peGluKSB7XG4gIHJlYWRvbmx5IGRlZnMgPSBjb250cm9sVGlsZXNcbiAgbGF5b3V0OiBPdmVydmlld0xheW91dCA9IGRlZmF1bHRMYXlvdXQoY29udHJvbFRpbGVzKVxuICBkcmFmdDogT3ZlcnZpZXdMYXlvdXQgfCBudWxsID0gbnVsbFxuICBuYXJyb3cgPSBmYWxzZVxuICBzdGF0dXMgPSAnJ1xuICBwcml2YXRlIG5hcnJvd1F1ZXJ5OiBNZWRpYVF1ZXJ5TGlzdCB8IG51bGwgPSBudWxsXG5cbiAgZ2V0IGNvbnRleHRLZXkgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmx9fCR7Y2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgPz8gJyd9fCR7Y2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyAnJ318JHt0aGlzLiRyb3V0ZT8ucGFyYW1zPy5wcmludGVyID8/ICcnfWBcbiAgfVxuXG4gIGdldCBlZGl0aW5nICgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZHJhZnQgIT09IG51bGwgfVxuXG4gIGdldCBjb250ZXh0ICgpOiBMYXlvdXRDb250ZXh0IHtcbiAgICByZXR1cm4ge1xuICAgICAgYWNjb3VudElkOiBjbG91ZFN0YXRlLmFjY291bnQ/LmlkID8/IG51bGwsXG4gICAgICBwcmludGVySWQ6IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkID8/IHRoaXMuJHJvdXRlPy5wYXJhbXM/LnByaW50ZXIgPz8gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybCA/PyBudWxsLFxuICAgICAgcGFnZTogJ2NvbnRyb2wnXG4gICAgfVxuICB9XG5cbiAgZ2V0IHNhdmVkTGF5b3V0cyAoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncz8uY29udHJvbD8ubGF5b3V0c1xuICB9XG5cbiAgZ2V0IGN1cnJlbnQgKCk6IE92ZXJ2aWV3TGF5b3V0IHsgcmV0dXJuIHRoaXMuZHJhZnQgPz8gdGhpcy5sYXlvdXQgfVxuXG4gIGdldCB0aWxlcyAoKTogRHJhd25UaWxlW10ge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnQudGlsZXMuZmxhdE1hcChwID0+IHtcbiAgICAgIGNvbnN0IGRlZiA9IHRoaXMuZGVmcy5maW5kKGQgPT4gZC5pZCA9PT0gcC5pZClcbiAgICAgIHJldHVybiBkZWYgPyBbeyAuLi5kZWYsIC4uLnAgfV0gOiBbXVxuICAgIH0pXG4gIH1cblxuICBnZXQgaGlkZGVuRGVmcyAoKTogQ29udHJvbFRpbGVEZWZbXSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudC5oaWRkZW4uZmxhdE1hcChpZCA9PiB0aGlzLmRlZnMuZmluZChkID0+IGQuaWQgPT09IGlkKSA/PyBbXSlcbiAgfVxuXG4gIEBXYXRjaCgnY29udGV4dEtleScpXG4gIEBXYXRjaCgnc2F2ZWRMYXlvdXRzJylcbiAgbG9hZCAoKSB7XG4gICAgaWYgKHRoaXMuZWRpdGluZykgcmV0dXJuXG4gICAgdGhpcy5sYXlvdXQgPSBsb2FkTGF5b3V0KHRoaXMuY29udGV4dCwgdGhpcy5zYXZlZExheW91dHMsIGxvY2FsU3RvcmFnZSwgdGhpcy5kZWZzKVxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgdGhpcy5sb2FkKClcbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93Lm1hdGNoTWVkaWEgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMubmFycm93UXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYSgnKG1heC13aWR0aDogMTA5OXB4KScpXG4gICAgICB0aGlzLm5hcnJvdyA9IHRoaXMubmFycm93UXVlcnkubWF0Y2hlc1xuICAgICAgdGhpcy5uYXJyb3dRdWVyeS5hZGRFdmVudExpc3RlbmVyPy4oJ2NoYW5nZScsIHRoaXMub25OYXJyb3cpXG4gICAgfVxuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgdGhpcy5uYXJyb3dRdWVyeT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcj8uKCdjaGFuZ2UnLCB0aGlzLm9uTmFycm93KVxuICB9XG5cbiAgb25OYXJyb3cgKGU6IE1lZGlhUXVlcnlMaXN0RXZlbnQpIHsgdGhpcy5uYXJyb3cgPSBlLm1hdGNoZXMgfVxuXG4gIGNlbGxTdHlsZSAodGlsZTogRHJhd25UaWxlKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgY29uc3QgZGVmID0gdGhpcy5kZWZzLmZpbmQoZCA9PiBkLmlkID09PSB0aWxlLmlkKVxuICAgIGNvbnN0IHRhYmxldCA9IHRpbGUuc3BhbiA9PT0gZGVmPy5zcGFuID8gdGlsZS50YWJsZXQgOiB0aWxlLnNwYW4gPiA2ID8gMTIgOiA2XG4gICAgcmV0dXJuIHsgJy0tc3Bhbic6IFN0cmluZyh0aWxlLnNwYW4pLCAnLS1yb3dzJzogU3RyaW5nKHRpbGUucm93cyksICctLXRhYmxldCc6IFN0cmluZyh0YWJsZXQpIH1cbiAgfVxuXG4gIHRpdGxlT2YgKGlkOiBzdHJpbmcpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5kZWZzLmZpbmQoZCA9PiBkLmlkID09PSBpZCk/LnRpdGxlID8/IGlkIH1cblxuICBpbmRleE9mIChpZDogc3RyaW5nKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuY3VycmVudC50aWxlcy5maW5kSW5kZXgodCA9PiB0LmlkID09PSBpZCkgfVxuXG4gIHN0YXJ0RWRpdCAoKSB7XG4gICAgdGhpcy5kcmFmdCA9IHsgdGlsZXM6IHRoaXMubGF5b3V0LnRpbGVzLm1hcCh0ID0+ICh7IC4uLnQgfSkpLCBoaWRkZW46IFsuLi50aGlzLmxheW91dC5oaWRkZW5dIH1cbiAgICB0aGlzLnN0YXR1cyA9ICdFZGl0aW5nIHRoZSBDb250cm9sIGxheW91dC4nXG4gIH1cblxuICByZXNldCAoKSB7XG4gICAgaWYgKCF0aGlzLmRyYWZ0KSByZXR1cm5cbiAgICB0aGlzLmRyYWZ0ID0gZGVmYXVsdExheW91dCh0aGlzLmRlZnMpXG4gICAgdGhpcy5zdGF0dXMgPSAnRXZlcnkgdGlsZSBpcyBiYWNrIHdoZXJlIGl0IHN0YXJ0ZWQuIENob29zZSBEb25lIHRvIGtlZXAgaXQuJ1xuICB9XG5cbiAgZG9uZSAoKSB7XG4gICAgY29uc3QgZHJhZnQgPSB0aGlzLmRyYWZ0XG4gICAgaWYgKCFkcmFmdCkgcmV0dXJuXG4gICAgaWYgKEpTT04uc3RyaW5naWZ5KGRyYWZ0KSAhPT0gSlNPTi5zdHJpbmdpZnkodGhpcy5sYXlvdXQpKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSBzYXZlTGF5b3V0KHRoaXMuY29udGV4dCwgZHJhZnQsIGxvY2FsU3RvcmFnZSlcbiAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgICAgLy8gT25seSB0aGlzIHBlcnNvbidzIGtleSBvbiB0aGlzIHByaW50ZXIsIG5ldmVyIHRoZSB3aG9sZSBtYXAuXG4gICAgICAgIHBhdGg6IGB1aVNldHRpbmdzLmNvbnRyb2wubGF5b3V0cy4ke3NlcnZlckxheW91dEtleSh0aGlzLmNvbnRleHQuYWNjb3VudElkLCB0aGlzLmNvbnRleHQucHJpbnRlcklkKX1gLFxuICAgICAgICB2YWx1ZTogcmVjb3JkLFxuICAgICAgICBzZXJ2ZXI6IHRydWVcbiAgICAgIH0pXG4gICAgICB0aGlzLmxheW91dCA9IHsgdGlsZXM6IHJlY29yZC50aWxlcywgaGlkZGVuOiByZWNvcmQuaGlkZGVuIH1cbiAgICB9XG4gICAgdGhpcy5kcmFmdCA9IG51bGxcbiAgICB0aGlzLnN0YXR1cyA9ICdDb250cm9sIGxheW91dCBzYXZlZC4nXG4gIH1cblxuICAvKiogU3RvcHMgcHJlc3NlcywgdHlwaW5nIGFuZCBmb3JtIGNoYW5nZXMgZnJvbSByZWFjaGluZyBhIHRpbGUgd2hpbGUgdGhlIHBhZ2UgaXMgYmVpbmcgZWRpdGVkLiAqL1xuICBzdG9wV2hpbGVFZGl0aW5nIChlOiBFdmVudCkge1xuICAgIGlmICghdGhpcy5lZGl0aW5nKSByZXR1cm5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBzaGlmdCAoaWQ6IHN0cmluZywgYnk6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5kcmFmdCkgcmV0dXJuXG4gICAgdGhpcy5kcmFmdCA9IG1vdmVCeSh0aGlzLmRyYWZ0LCBpZCwgYnkpXG4gICAgdGhpcy5zdGF0dXMgPSBgJHt0aGlzLnRpdGxlT2YoaWQpfSBtb3ZlZCB0byBwbGFjZSAke3RoaXMuaW5kZXhPZihpZCkgKyAxfSBvZiAke3RoaXMuZHJhZnQudGlsZXMubGVuZ3RofS5gXG4gIH1cblxuICByZXNpemUgKGlkOiBzdHJpbmcsIGJ5OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuZHJhZnQpIHJldHVyblxuICAgIHRoaXMuZHJhZnQgPSBudWRnZVNpemUodGhpcy5kcmFmdCwgaWQsIGJ5LCAwKVxuICAgIGNvbnN0IHQgPSB0aGlzLmRyYWZ0LnRpbGVzLmZpbmQoeCA9PiB4LmlkID09PSBpZClcbiAgICB0aGlzLnN0YXR1cyA9IHQgPyBgJHt0aGlzLnRpdGxlT2YoaWQpfSBpcyAke3Quc3Bhbn0gY29sdW1ucyB3aWRlLmAgOiAnJ1xuICB9XG5cbiAgcmVtb3ZlIChpZDogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLmRyYWZ0KSByZXR1cm5cbiAgICB0aGlzLmRyYWZ0ID0gcmVtb3ZlVGlsZSh0aGlzLmRyYWZ0LCBpZClcbiAgICB0aGlzLnN0YXR1cyA9IGAke3RoaXMudGl0bGVPZihpZCl9IGhpZGRlbi5gXG4gIH1cblxuICBhZGQgKGlkOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRoaXMuZHJhZnQpIHJldHVyblxuICAgIHRoaXMuZHJhZnQgPSBhZGRUaWxlKHRoaXMuZHJhZnQsIGlkLCB0aGlzLmRlZnMpXG4gICAgdGhpcy5zdGF0dXMgPSBgJHt0aGlzLnRpdGxlT2YoaWQpfSBhZGRlZC5gXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5jb250cm9sLXBhZ2Uge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE2cHg7XG4gIH1cblxuICAuY29udHJvbC1wYWdlX19iYXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAuY29udHJvbC1wYWdlX19ncm93IHtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgfVxuXG4gIC5jb250cm9sLXBhZ2UtLXBob25lIC5jb250cm9sLXBhZ2VfX2JhciB7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgfVxuXG4gIC5jb250cm9sLXBhZ2VfX3RyYXkge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiAxOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICB9XG5cbiAgLmNvbnRyb2wtcGFnZV9fdHJheS1oZWxwLFxuICAuY29udHJvbC1wYWdlX19tdXRlZCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuY29udHJvbC1wYWdlX19jaGlwcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAuY29udHJvbC1wYWdlX19ncmlkIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDEyLCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgZ3JpZC1hdXRvLWZsb3c6IHJvdyBkZW5zZTtcbiAgICBnYXA6IDE2cHg7XG4gICAgYWxpZ24taXRlbXM6IHN0YXJ0O1xuICB9XG5cbiAgLmNvbnRyb2wtcGFnZV9fY2VsbCB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBncmlkLWNvbHVtbjogc3BhbiB2YXIoLS1zcGFuKTtcbiAgICBncmlkLXJvdzogc3BhbiB2YXIoLS1yb3dzKTtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuY29udHJvbC1wYWdlX19ib2R5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWluLXdpZHRoOiAwO1xuXG4gICAgPiAqIHsgZmxleDogMSAxIGF1dG87IH1cbiAgfVxuXG4gIC5jb250cm9sLXBhZ2UtLWVkaXQgLmNvbnRyb2wtcGFnZV9fYm9keSB7XG4gICAgb3BhY2l0eTogMC41NTtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuXG4gIC5jb250cm9sLXBhZ2VfX2VkaXQge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDEwcHg7XG4gICAgcmlnaHQ6IDEwcHg7XG4gICAgbGVmdDogMTBweDtcbiAgICB6LWluZGV4OiA1O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgcGFkZGluZzogOHB4IDEwcHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgYm94LXNoYWRvdzogMCA2cHggMjBweCByZ2IoMCAwIDAgLyAyNSUpO1xuXG4gICAgYiB7IGZsZXg6IDEgMSBhdXRvOyBmb250LXNpemU6IDE0cHg7IH1cbiAgfVxuXG4gIC5jb250cm9sLXBhZ2VfX2VtcHR5IHtcbiAgICBncmlkLWNvbHVtbjogMSAvIC0xO1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAyNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB9XG5cbiAgLmNvbnRyb2wtcGFnZV9fc3Ige1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB3aWR0aDogMXB4O1xuICAgIGhlaWdodDogMXB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgY2xpcDogcmVjdCgwIDAgMCAwKTtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDEwOTlweCkge1xuICAgIC5jb250cm9sLXBhZ2VfX2NlbGwgeyBncmlkLWNvbHVtbjogc3BhbiB2YXIoLS10YWJsZXQpOyBncmlkLXJvdzogYXV0bzsgfVxuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDY5OXB4KSB7XG4gICAgLmNvbnRyb2wtcGFnZV9fZ3JpZCB7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KDAsIDFmcik7IGdhcDogMTJweDsgfVxuICAgIC5jb250cm9sLXBhZ2VfX2NlbGwgeyBncmlkLWNvbHVtbjogMSAvIC0xOyB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvdmlld3MvQ29udHJvbC52dWUifQ==