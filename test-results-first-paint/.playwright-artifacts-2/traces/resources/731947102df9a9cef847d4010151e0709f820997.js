/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/PlateClearBar.vue";
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
import DevGuardMixin from "/src/mixins/dev-guard.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import PlateClearBar from "/src/components/ui/PlateClearBar.vue";
import MachineFaultBar from "/src/components/ui/MachineFaultBar.vue";
import { overviewTiles } from "/src/components/widgets/overview/registry.ts";
import {
  addTile,
  defaultLayout,
  dropIndex,
  moveBy,
  moveTile,
  nudgeSize,
  removeTile,
  resizeTile,
  serverLayoutKey,
  sizeKeyOf
} from "/src/services/overview/layout.ts";
import { reducedMotion, springCurve, springKeyframes } from "/src/services/overview/spring.ts";
import { searchWidgets, treatAsMuon, widgetCategories, widgetsFor } from "/src/services/overview/widgets.ts";
import { loadLayout, saveLayout, staleLayout } from "/src/services/overview/layout-store.ts";
const GRID_GAP = 16;
const SPRING = "overview-spring";
let Overview = class extends Mixins(DevGuardMixin) {
  layout = defaultLayout(overviewTiles);
  draft = null;
  drag = null;
  /** Below 1100 px (tablet and phone) tiles can be moved and hidden but not resized: sizes are the desktop grid. */
  narrow = false;
  /** A layout saved before the I-542 row existed was set aside; the new default shows until it is kept or edited. */
  migrated = false;
  status = "";
  narrowQuery = null;
  /** Where each tile was before the layout changed, so it can glide to where it is now. */
  rects = /* @__PURE__ */ new Map();
  shape = "";
  sheet = false;
  query = "";
  category = null;
  picked = {};
  categories = widgetCategories;
  stopDrag = null;
  /** The widgets this printer has: a Muon printer has Z offset only in developer mode. */
  get defs() {
    return widgetsFor(overviewTiles, treatAsMuon(this.$store.getters["server/isMuonPrinter"]) && this.devOnlyLocked);
  }
  get editing() {
    return this.draft !== null;
  }
  /** A different printer or account starts every tile afresh, so nothing half-typed crosses over. */
  get contextKey() {
    return `${this.$store.state.config.apiUrl}|${cloudState.activePrinterId ?? ""}|${cloudState.account?.id ?? ""}|${this.$route?.params?.printer ?? ""}`;
  }
  get context() {
    return { accountId: cloudState.account?.id ?? null, printerId: cloudState.activePrinterId ?? this.$route?.params?.printer ?? this.$store.state.config.apiUrl ?? null };
  }
  /** What this printer's settings hold, which fills in after the page opens. */
  get savedLayouts() {
    return this.$store.state.config.uiSettings?.overview?.layouts;
  }
  get current() {
    return this.draft ?? this.layout;
  }
  get tiles() {
    return this.current.tiles.flatMap((p) => {
      const def = this.defs.find((d) => d.id === p.id);
      return def ? [{ ...def, ...p, sizeKey: sizeKeyOf(def, p) ?? def.size }] : [];
    });
  }
  get shownWidgets() {
    return searchWidgets(this.defs, this.query, this.category);
  }
  isOn(id) {
    return this.current.tiles.some((t) => t.id === id);
  }
  sizeFor(w) {
    return this.picked[w.id] ?? w.size;
  }
  pick(id, key) {
    this.$set(this.picked, id, key);
  }
  openSheet() {
    this.query = "";
    this.category = null;
    this.picked = {};
    this.sheet = true;
  }
  glide() {
    const shape = this.current.tiles.map((t) => `${t.id}:${t.span}:${t.rows}`).join("|");
    if (shape === this.shape) return;
    this.shape = shape;
    if (reducedMotion() || !this.editing) return;
    const before = /* @__PURE__ */ new Map();
    for (const t of this.current.tiles) {
      const el = this.cellEl(t.id);
      if (el) before.set(t.id, el.getBoundingClientRect());
    }
    for (const [id, rect] of this.rects) if (!before.has(id)) before.set(id, rect);
    this.$nextTick(() => {
      const curve = springCurve();
      const dragged = this.drag?.kind === "move" ? this.drag.id : null;
      const moves = [];
      for (const t of this.current.tiles) {
        const el = this.cellEl(t.id);
        const was = before.get(t.id);
        if (!el || !was || t.id === dragged || typeof el.animate !== "function") continue;
        el.getAnimations?.().forEach((a) => a.cancel());
        const now = el.getBoundingClientRect();
        if (!now.width || !now.height) continue;
        const from = { dx: was.left - now.left, dy: was.top - now.top, sx: was.width / now.width, sy: was.height / now.height };
        if (Math.abs(from.dx) < 1 && Math.abs(from.dy) < 1 && Math.abs(from.sx - 1) < 0.01 && Math.abs(from.sy - 1) < 0.01) continue;
        moves.push([el, springKeyframes(from, curve)]);
      }
      for (const [el, frames] of moves) el.animate(frames, { id: SPRING, duration: curve.duration, easing: "linear" });
      this.rects = before;
    });
  }
  cellEl(id) {
    return this.$refs[`cell-${id}`]?.[0];
  }
  load() {
    if (this.editing) return;
    this.layout = loadLayout(this.context, this.savedLayouts, localStorage, this.defs);
    this.migrated = staleLayout(this.context, this.savedLayouts, localStorage, this.defs);
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
    this.stopDrag?.();
    this.narrowQuery?.removeEventListener?.("change", this.onNarrow);
  }
  onNarrow(e) {
    this.narrow = e.matches;
  }
  cellStyle(tile) {
    const tablet = tile.span > 6 ? 12 : 6;
    return { "--span": String(tile.span), "--rows": String(tile.rows), "--tablet": String(tablet), "--phone": String(tile.span <= 3 && !["mode", "position"].includes(tile.id) ? 1 : 2) };
  }
  titleOf(id) {
    return this.defs.find((d) => d.id === id)?.title ?? id;
  }
  /* Edit mode */
  /** Writes the new default as this person's own, so the notice goes and the layout stays. */
  keepNew() {
    const record = saveLayout(this.context, this.layout, localStorage);
    this.$store.dispatch("config/saveByPath", {
      path: `uiSettings.overview.layouts.${serverLayoutKey(this.context.accountId, this.context.printerId)}`,
      value: record,
      server: true
    });
    this.migrated = false;
  }
  startEdit() {
    this.draft = { tiles: this.layout.tiles.map((t) => ({ ...t })), hidden: [...this.layout.hidden] };
    this.status = "Editing the Overview.";
  }
  reset() {
    if (!this.draft) return;
    this.draft = defaultLayout(this.defs);
    this.status = "Every widget is back where it started. Choose Done to keep it.";
    this.sheet = false;
  }
  done() {
    const draft = this.draft;
    if (!draft) return;
    this.stopDrag?.();
    this.sheet = false;
    if (JSON.stringify(draft) !== JSON.stringify(this.layout)) {
      const record = saveLayout(this.context, draft, localStorage);
      this.$store.dispatch("config/saveByPath", {
        // Only this person's key on this printer, never the whole map: another
        // person's tab saving from an older copy must not wipe this layout.
        path: `uiSettings.overview.layouts.${serverLayoutKey(this.context.accountId, this.context.printerId)}`,
        value: record,
        server: true
      });
      this.layout = { tiles: record.tiles, hidden: record.hidden };
    }
    this.draft = null;
    this.migrated = false;
    this.status = "Overview saved.";
  }
  /** Stops presses, typing and form changes from reaching a tile while the page is being edited. */
  stopWhileEditing(e) {
    if (!this.editing) return;
    e.stopPropagation();
    e.preventDefault();
  }
  remove(id) {
    if (!this.draft) return;
    this.draft = removeTile(this.draft, id);
    this.status = `${this.titleOf(id)} put away.`;
  }
  add(id, at, sizeKey) {
    if (!this.draft) return;
    this.draft = addTile(this.draft, id, this.defs, at, sizeKey, 12);
    const t = this.draft.tiles.find((x) => x.id === id);
    this.status = `${this.titleOf(id)} added${t ? `, ${t.span} columns wide and ${t.rows} ${t.rows === 1 ? "row" : "rows"} tall` : ""}.`;
  }
  addWidget(id) {
    const def = this.defs.find((d) => d.id === id);
    if (!def) return;
    this.add(id, void 0, this.sizeFor(def));
  }
  gripLabel(tile) {
    const pos = this.current.tiles.findIndex((t) => t.id === tile.id) + 1;
    return `Move ${tile.title}, place ${pos} of ${this.current.tiles.length}. Arrow keys move it${this.narrow ? "" : ", Shift and arrow keys resize it"}.`;
  }
  gripKey(e, id) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!this.draft || !keys.includes(e.key)) return;
    e.preventDefault();
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (e.shiftKey) {
      if (this.narrow) return;
      const step = back ? -1 : 1;
      const horizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
      this.draft = nudgeSize(this.draft, id, horizontal ? step : 0, horizontal ? 0 : step, this.defs);
      const t = this.draft.tiles.find((x) => x.id === id);
      this.status = t ? `${this.titleOf(id)} is ${t.span} columns wide and ${t.rows} ${t.rows === 1 ? "row" : "rows"} tall.` : "";
    } else {
      this.draft = moveBy(this.draft, id, back ? -1 : 1);
      this.status = `${this.titleOf(id)} moved to place ${this.draft.tiles.findIndex((t) => t.id === id) + 1} of ${this.draft.tiles.length}.`;
    }
    this.$nextTick(() => this.$refs[`cell-${id}`]?.[0]?.querySelector('[data-tid="tile-grip"]')?.focus());
  }
  /** Each tile's slot on screen, in layout order. Slots, not drawn boxes: a tile still springing is where it is going. */
  slots() {
    const out = [];
    for (const t of this.current.tiles) {
      const el = this.cellEl(t.id);
      const parent = el?.offsetParent;
      if (!el || !parent) continue;
      const p = parent.getBoundingClientRect();
      out.push({ id: t.id, left: p.left + parent.clientLeft + el.offsetLeft, top: p.top + parent.clientTop + el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    }
    return out;
  }
  /** The tile whose slot is under the point. */
  cellAt(x, y) {
    return this.slots().find((s) => x >= s.left && x < s.left + s.width && y >= s.top && y < s.top + s.height)?.id ?? null;
  }
  /** Follows the pointer until it lifts, calling back with each move and the final position. */
  track(e, onMove, onEnd) {
    this.stopDrag?.();
    const move = (ev) => {
      if (ev.pointerId === e.pointerId) onMove(ev);
    };
    const end = (ev) => {
      if (ev.pointerId === e.pointerId) {
        stop();
        onEnd(ev, ev.type === "pointercancel");
      }
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      this.stopDrag = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    this.stopDrag = () => {
      stop();
      this.drag = null;
    };
  }
  edgeScroll(y) {
    if (typeof window.scrollBy !== "function") return;
    if (y < 70) window.scrollBy(0, -18);
    else if (y > window.innerHeight - 70) window.scrollBy(0, 18);
  }
  /**
   * Picks a tile up: it follows the pointer, and the others move out of the
   * way as it passes over them. On release it springs into the gap it made.
   */
  startMove(e, id) {
    const el = this.cellEl(id);
    if (!this.draft || !el || e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget?.setPointerCapture?.(e.pointerId);
    const start = this.draft;
    const from = { x: e.clientX, y: e.clientY + window.scrollY, left: el.offsetLeft, top: el.offsetTop };
    let last = null;
    let shift = { x: 0, y: 0 };
    const follow = (x, y) => {
      shift = { x: x - from.x - (el.offsetLeft - from.left), y: y + window.scrollY - from.y - (el.offsetTop - from.top) };
      el.style.transform = `translate(${shift.x}px, ${shift.y}px)`;
    };
    this.drag = { kind: "move", id, over: null, x: e.clientX, y: e.clientY };
    this.track(e, (ev) => {
      this.edgeScroll(ev.clientY);
      const over = this.cellAt(ev.clientX, ev.clientY);
      this.drag = { kind: "move", id, over: over === id ? null : over, x: ev.clientX, y: ev.clientY };
      if (this.draft && over && over !== id && over !== last) {
        const to = this.draft.tiles.findIndex((t) => t.id === over);
        if (to >= 0) this.draft = moveTile(this.draft, id, to);
        last = over;
      } else if (this.draft && !over) {
        const to = dropIndex(this.slots(), id, ev.clientX, ev.clientY);
        const key = to === null ? null : `gap:${to}`;
        if (to !== null && key !== last && to !== this.draft.tiles.findIndex((t) => t.id === id)) this.draft = moveTile(this.draft, id, to);
        if (key) last = key;
      }
      follow(ev.clientX, ev.clientY);
      this.$nextTick(() => {
        if (this.drag?.kind === "move" && this.drag.id === id) follow(ev.clientX, ev.clientY);
      });
    }, (_ev, cancelled) => {
      if (cancelled) this.draft = start;
      const at = this.draft?.tiles.findIndex((t) => t.id === id) ?? -1;
      if (!cancelled && this.draft && at !== start.tiles.findIndex((t) => t.id === id)) this.status = `${this.titleOf(id)} moved to place ${at + 1} of ${this.draft.tiles.length}.`;
      this.drag = null;
      this.$nextTick(() => {
        const now = shift;
        el.style.transform = "";
        if (reducedMotion() || typeof el.animate !== "function" || Math.abs(now.x) < 1 && Math.abs(now.y) < 1) return;
        el.animate(springKeyframes({ dx: now.x, dy: now.y, sx: 1, sy: 1 }), { id: SPRING, duration: springCurve().duration, easing: "linear" });
      });
    });
  }
  /** Dragging the corner resizes in whole grid steps, then snaps to the nearest size the widget offers. */
  startResize(e, id) {
    const grid = this.$refs.grid;
    const cell = this.$refs[`cell-${id}`]?.[0];
    const from = this.draft?.tiles.find((t) => t.id === id);
    if (!this.draft || !grid || !cell || !from || e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget?.setPointerCapture?.(e.pointerId);
    const base = this.draft;
    const column = (grid.getBoundingClientRect().width + GRID_GAP) / 12;
    const row = (cell.offsetHeight + GRID_GAP) / from.rows;
    this.track(e, (ev) => {
      if (!column || !row) return;
      this.edgeScroll(ev.clientY);
      this.draft = resizeTile(base, id, from.span + Math.round((ev.clientX - e.clientX) / column), from.rows + Math.round((ev.clientY - e.clientY) / row), this.defs);
    }, () => {
      const t = this.draft?.tiles.find((x) => x.id === id);
      if (t) this.status = `${this.titleOf(id)} is ${t.span} columns wide and ${t.rows} ${t.rows === 1 ? "row" : "rows"} tall.`;
    });
  }
};
__decorateClass([
  Watch("current")
], Overview.prototype, "glide", 1);
__decorateClass([
  Watch("contextKey"),
  Watch("savedLayouts"),
  Watch("defs")
], Overview.prototype, "load", 1);
Overview = __decorateClass([
  Component({ components: { MachineFaultBar, PlateClearBar } })
], Overview);
const _sfc_main = Overview;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { key: _vm.contextKey, staticClass: "overview", class: { "overview--edit": _vm.editing, "overview--narrow": _vm.narrow }, attrs: { "data-tid": "overview-page" } }, [_c("div", { staticClass: "overview__head" }, [_c("h1", { staticClass: "overview__title" }, [_vm._v(" Overview ")]), _c("div", { staticClass: "overview__actions" }, [_vm.editing ? [_c("button", { staticClass: "overview__btn", attrs: { "type": "button", "data-tid": "widget-sheet-open" }, on: { "click": _vm.openSheet } }, [_vm._v(" Add widget ")]), _c("button", { staticClass: "overview__btn", attrs: { "type": "button", "data-tid": "edit-reset" }, on: { "click": _vm.reset } }, [_vm._v(" Reset layout ")]), _c("button", { staticClass: "overview__btn overview__btn--primary", attrs: { "type": "button", "data-tid": "edit-done" }, on: { "click": _vm.done } }, [_vm._v(" Done ")])] : _c("button", { staticClass: "overview__btn", attrs: { "type": "button", "data-tid": "edit-open" }, on: { "click": _vm.startEdit } }, [_vm._v(" Edit ")])], 2)]), _vm.editing ? _c("p", { staticClass: "overview__hint", attrs: { "data-tid": "edit-hint" } }, [_vm._v(" " + _vm._s(_vm.narrow ? "Drag the grip to move a widget, or the \xD7 to put it away. Add widget brings one back, at the size you pick." : "Drag the grip to move a widget and the corner to resize it; it snaps to a size the widget offers. Saved for you, on this printer.") + " ")]) : _vm._e(), _vm.migrated && !_vm.editing ? _c("p", { staticClass: "overview__notice", attrs: { "role": "status", "data-tid": "layout-migrated" } }, [_c("span", [_vm._v("The Overview has a new layout: the temperatures, position and print mode in one row, a bigger trackpad and Quick commands across the bottom. Edit to rearrange it.")]), _c("button", { staticClass: "overview__btn", attrs: { "type": "button", "data-tid": "layout-keep" }, on: { "click": _vm.keepNew } }, [_vm._v(" Keep this layout ")])]) : _vm._e(), _c(__unplugin_components_0), _c(__unplugin_components_1), _c("div", { ref: "grid", staticClass: "overview__grid", attrs: { "data-tid": "overview-grid" } }, [_vm._l(_vm.tiles, function(tile) {
    return _c("div", { key: tile.id, ref: `cell-${tile.id}`, refInFor: true, staticClass: "overview__cell", class: [`overview__cell--${tile.id}`, { "overview__cell--moving": _vm.drag && _vm.drag.kind === "move" && _vm.drag.id === tile.id, "overview__cell--over": _vm.drag && _vm.drag.over === tile.id }], style: _vm.cellStyle(tile), attrs: { "data-cell": tile.id, "data-size": tile.sizeKey } }, [_c("div", { staticClass: "overview__body", attrs: { "inert": _vm.editing ? true : void 0, "aria-hidden": _vm.editing ? "true" : void 0, "data-tid": "tile-body" }, on: { "!click": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!dblclick": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!mousedown": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!pointerdown": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!keydown": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!keyup": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!submit": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!input": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    }, "!change": function($event) {
      return _vm.stopWhileEditing.apply(null, arguments);
    } } }, [_c(tile.component, _vm._b({ tag: "component", attrs: { "size": tile.sizeKey } }, "component", tile.props, false))], 1), _vm.editing ? [_c("button", { staticClass: "overview__grip", attrs: { "type": "button", "aria-label": _vm.gripLabel(tile), "data-tid": "tile-grip" }, on: { "pointerdown": function($event) {
      return _vm.startMove($event, tile.id);
    }, "keydown": function($event) {
      return _vm.gripKey($event, tile.id);
    } } }, [_c("i"), _c("i"), _c("i"), _c("i"), _c("i"), _c("i")]), _c("button", { staticClass: "overview__remove", attrs: { "type": "button", "aria-label": `Hide ${tile.title}`, "title": `Hide ${tile.title}`, "data-tid": "tile-remove" }, on: { "click": function($event) {
      return _vm.remove(tile.id);
    } } }, [_c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v("\xD7")])]), !_vm.narrow ? _c("span", { staticClass: "overview__resize", attrs: { "data-tid": "tile-resize", "aria-hidden": "true" }, on: { "pointerdown": function($event) {
      return _vm.startResize($event, tile.id);
    } } }) : _vm._e()] : _vm._e()], 2);
  }), !_vm.tiles.length ? _c("p", { staticClass: "overview__empty", attrs: { "data-tid": "overview-empty" } }, [_vm._v(" " + _vm._s(_vm.editing ? "No widgets on the page. Choose Add widget." : "Every widget is put away. Choose Edit to add some back.") + " ")]) : _vm._e()], 2), _vm.sheet && _vm.editing ? _c("div", { staticClass: "overview__sheet", attrs: { "role": "dialog", "aria-modal": "true", "aria-label": "Add widget", "data-tid": "widget-sheet" }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    _vm.sheet = false;
  }, "click": function($event) {
    if ($event.target !== $event.currentTarget) return null;
    _vm.sheet = false;
  } } }, [_c("div", { staticClass: "overview__sheet-card" }, [_c("div", { staticClass: "overview__sheet-head" }, [_c("b", [_vm._v("Add widget")]), _c("button", { staticClass: "overview__btn", attrs: { "type": "button", "data-tid": "widget-sheet-close" }, on: { "click": function($event) {
    _vm.sheet = false;
  } } }, [_vm._v(" Close ")])]), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.query, expression: "query" }], staticClass: "overview__search", attrs: { "type": "search", "placeholder": "Search widgets", "aria-label": "Search widgets", "data-tid": "widget-search" }, domProps: { "value": _vm.query }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.query = $event.target.value;
  } } }), _c("div", { staticClass: "overview__cats", attrs: { "role": "group", "aria-label": "Categories" } }, [_c("button", { staticClass: "overview__chip", class: { "overview__chip--on": !_vm.category }, attrs: { "type": "button", "aria-pressed": !_vm.category ? "true" : "false", "data-tid": "widget-cat-all" }, on: { "click": function($event) {
    _vm.category = null;
  } } }, [_vm._v(" All ")]), _vm._l(_vm.categories, function(c) {
    return _c("button", { key: c, staticClass: "overview__chip", class: { "overview__chip--on": _vm.category === c }, attrs: { "type": "button", "aria-pressed": _vm.category === c ? "true" : "false", "data-tid": `widget-cat-${c}` }, on: { "click": function($event) {
      _vm.category = c;
    } } }, [_vm._v(" " + _vm._s(c) + " ")]);
  })], 2), _c("ul", { staticClass: "overview__cards" }, [_vm._l(_vm.shownWidgets, function(w) {
    return _c("li", { key: w.id, staticClass: "overview__card", attrs: { "data-tid": `widget-card-${w.id}` } }, [_c("div", { staticClass: "overview__card-top" }, [_c("b", [_vm._v(_vm._s(w.title))]), _c("span", { staticClass: "overview__card-cat" }, [_vm._v(_vm._s(w.category))]), _vm.isOn(w.id) ? _c("button", { staticClass: "overview__pm", attrs: { "type": "button", "aria-label": `Remove ${w.title} from Overview`, "data-tid": `widget-remove-${w.id}` }, on: { "click": function($event) {
      return _vm.remove(w.id);
    } } }, [_vm._v(" \u2212 ")]) : _c("button", { staticClass: "overview__pm", attrs: { "type": "button", "aria-label": `Add ${w.title} to Overview`, "data-tid": `widget-add-${w.id}` }, on: { "click": function($event) {
      return _vm.addWidget(w.id);
    } } }, [_vm._v(" + ")])]), _c("p", [_vm._v(_vm._s(w.blurb))]), !_vm.isOn(w.id) ? _c("div", { staticClass: "overview__card-act" }, [_c("span", { staticClass: "overview__sizes", attrs: { "role": "group", "aria-label": `${w.title} size` } }, _vm._l(w.sizes, function(z) {
      return _c("button", { key: z.key, staticClass: "overview__size", class: { "overview__size--on": _vm.sizeFor(w) === z.key }, attrs: { "type": "button", "aria-pressed": _vm.sizeFor(w) === z.key ? "true" : "false", "title": `${z.span} columns, ${z.rows} ${z.rows === 1 ? "row" : "rows"}`, "data-tid": `widget-size-${w.id}-${z.key}` }, on: { "click": function($event) {
        return _vm.pick(w.id, z.key);
      } } }, [_vm._v(_vm._s(z.key))]);
    }), 0)]) : _vm._e()]);
  }), !_vm.shownWidgets.length ? _c("li", { staticClass: "overview__none", attrs: { "data-tid": "widget-none" } }, [_vm._v(" No widget matches. ")]) : _vm._e()], 2)])]) : _vm._e(), _c("p", { staticClass: "overview__sr", attrs: { "role": "status", "aria-live": "polite", "data-tid": "edit-status" } }, [_vm._v(" " + _vm._s(_vm.status) + " ")])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Overview.vue?vue&type=style&index=0&scoped=8e6ceb57&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "8e6ceb57",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Overview.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBa1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE9BRUE7QUFDQTtBQUNBO0FBQ0E7QUFPQTtBQUVBO0FBWUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBRUE7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBLFFBR0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxhQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBNVJBO0FBQUEsRUFEQTtBQUFBLEdBakVBLFNBa0VBO0FBMENBO0FBQUEsRUFIQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsR0EzR0EsU0E0R0E7QUE1R0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiT3ZlcnZpZXcudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIDprZXk9XCJjb250ZXh0S2V5XCJcbiAgICBjbGFzcz1cIm92ZXJ2aWV3XCJcbiAgICA6Y2xhc3M9XCJ7ICdvdmVydmlldy0tZWRpdCc6IGVkaXRpbmcsICdvdmVydmlldy0tbmFycm93JzogbmFycm93IH1cIlxuICAgIGRhdGEtdGlkPVwib3ZlcnZpZXctcGFnZVwiXG4gID5cbiAgICA8ZGl2IGNsYXNzPVwib3ZlcnZpZXdfX2hlYWRcIj5cbiAgICAgIDxoMSBjbGFzcz1cIm92ZXJ2aWV3X190aXRsZVwiPlxuICAgICAgICBPdmVydmlld1xuICAgICAgPC9oMT5cbiAgICAgIDxkaXYgY2xhc3M9XCJvdmVydmlld19fYWN0aW9uc1wiPlxuICAgICAgICA8dGVtcGxhdGUgdi1pZj1cImVkaXRpbmdcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2J0blwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIndpZGdldC1zaGVldC1vcGVuXCJcbiAgICAgICAgICAgIEBjbGljaz1cIm9wZW5TaGVldFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQWRkIHdpZGdldFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJvdmVydmlld19fYnRuXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiZWRpdC1yZXNldFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJyZXNldFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgUmVzZXQgbGF5b3V0XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19idG4gb3ZlcnZpZXdfX2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImVkaXQtZG9uZVwiXG4gICAgICAgICAgICBAY2xpY2s9XCJkb25lXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBEb25lXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19idG5cIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZWRpdC1vcGVuXCJcbiAgICAgICAgICBAY2xpY2s9XCJzdGFydEVkaXRcIlxuICAgICAgICA+XG4gICAgICAgICAgRWRpdFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCJlZGl0aW5nXCJcbiAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2hpbnRcIlxuICAgICAgZGF0YS10aWQ9XCJlZGl0LWhpbnRcIlxuICAgID5cbiAgICAgIHt7IG5hcnJvdyA/ICdEcmFnIHRoZSBncmlwIHRvIG1vdmUgYSB3aWRnZXQsIG9yIHRoZSDDlyB0byBwdXQgaXQgYXdheS4gQWRkIHdpZGdldCBicmluZ3Mgb25lIGJhY2ssIGF0IHRoZSBzaXplIHlvdSBwaWNrLicgOiAnRHJhZyB0aGUgZ3JpcCB0byBtb3ZlIGEgd2lkZ2V0IGFuZCB0aGUgY29ybmVyIHRvIHJlc2l6ZSBpdDsgaXQgc25hcHMgdG8gYSBzaXplIHRoZSB3aWRnZXQgb2ZmZXJzLiBTYXZlZCBmb3IgeW91LCBvbiB0aGlzIHByaW50ZXIuJyB9fVxuICAgIDwvcD5cblxuICAgIDxwXG4gICAgICB2LWlmPVwibWlncmF0ZWQgJiYgIWVkaXRpbmdcIlxuICAgICAgY2xhc3M9XCJvdmVydmlld19fbm90aWNlXCJcbiAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgZGF0YS10aWQ9XCJsYXlvdXQtbWlncmF0ZWRcIlxuICAgID5cbiAgICAgIDxzcGFuPlRoZSBPdmVydmlldyBoYXMgYSBuZXcgbGF5b3V0OiB0aGUgdGVtcGVyYXR1cmVzLCBwb3NpdGlvbiBhbmQgcHJpbnQgbW9kZSBpbiBvbmUgcm93LCBhIGJpZ2dlciB0cmFja3BhZCBhbmQgUXVpY2sgY29tbWFuZHMgYWNyb3NzIHRoZSBib3R0b20uIEVkaXQgdG8gcmVhcnJhbmdlIGl0Ljwvc3Bhbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2J0blwiXG4gICAgICAgIGRhdGEtdGlkPVwibGF5b3V0LWtlZXBcIlxuICAgICAgICBAY2xpY2s9XCJrZWVwTmV3XCJcbiAgICAgID5cbiAgICAgICAgS2VlcCB0aGlzIGxheW91dFxuICAgICAgPC9idXR0b24+XG4gICAgPC9wPlxuXG4gICAgPG1hY2hpbmUtZmF1bHQtYmFyIC8+XG5cbiAgICA8cGxhdGUtY2xlYXItYmFyIC8+XG5cbiAgICA8ZGl2XG4gICAgICByZWY9XCJncmlkXCJcbiAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2dyaWRcIlxuICAgICAgZGF0YS10aWQ9XCJvdmVydmlldy1ncmlkXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZm9yPVwidGlsZSBpbiB0aWxlc1wiXG4gICAgICAgIDprZXk9XCJ0aWxlLmlkXCJcbiAgICAgICAgOnJlZj1cImBjZWxsLSR7dGlsZS5pZH1gXCJcbiAgICAgICAgY2xhc3M9XCJvdmVydmlld19fY2VsbFwiXG4gICAgICAgIDpjbGFzcz1cIltgb3ZlcnZpZXdfX2NlbGwtLSR7dGlsZS5pZH1gLCB7ICdvdmVydmlld19fY2VsbC0tbW92aW5nJzogZHJhZyAmJiBkcmFnLmtpbmQgPT09ICdtb3ZlJyAmJiBkcmFnLmlkID09PSB0aWxlLmlkLCAnb3ZlcnZpZXdfX2NlbGwtLW92ZXInOiBkcmFnICYmIGRyYWcub3ZlciA9PT0gdGlsZS5pZCB9XVwiXG4gICAgICAgIDpzdHlsZT1cImNlbGxTdHlsZSh0aWxlKVwiXG4gICAgICAgIDpkYXRhLWNlbGw9XCJ0aWxlLmlkXCJcbiAgICAgICAgOmRhdGEtc2l6ZT1cInRpbGUuc2l6ZUtleVwiXG4gICAgICA+XG4gICAgICAgIDwhLS0gV2hpbGUgZWRpdGluZywgdGhlIHRpbGUgaXMgb25seSBhIHBpY3R1cmU6IG5vdGhpbmcgaW4gaXQgY2FuIGJlIHByZXNzZWQgb3IgZm9jdXNlZC4gLS0+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19ib2R5XCJcbiAgICAgICAgICA6aW5lcnQ9XCJlZGl0aW5nID8gdHJ1ZSA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgOmFyaWEtaGlkZGVuPVwiZWRpdGluZyA/ICd0cnVlJyA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ0aWxlLWJvZHlcIlxuICAgICAgICAgIEBjbGljay5jYXB0dXJlPVwic3RvcFdoaWxlRWRpdGluZ1wiXG4gICAgICAgICAgQGRibGNsaWNrLmNhcHR1cmU9XCJzdG9wV2hpbGVFZGl0aW5nXCJcbiAgICAgICAgICBAbW91c2Vkb3duLmNhcHR1cmU9XCJzdG9wV2hpbGVFZGl0aW5nXCJcbiAgICAgICAgICBAcG9pbnRlcmRvd24uY2FwdHVyZT1cInN0b3BXaGlsZUVkaXRpbmdcIlxuICAgICAgICAgIEBrZXlkb3duLmNhcHR1cmU9XCJzdG9wV2hpbGVFZGl0aW5nXCJcbiAgICAgICAgICBAa2V5dXAuY2FwdHVyZT1cInN0b3BXaGlsZUVkaXRpbmdcIlxuICAgICAgICAgIEBzdWJtaXQuY2FwdHVyZT1cInN0b3BXaGlsZUVkaXRpbmdcIlxuICAgICAgICAgIEBpbnB1dC5jYXB0dXJlPVwic3RvcFdoaWxlRWRpdGluZ1wiXG4gICAgICAgICAgQGNoYW5nZS5jYXB0dXJlPVwic3RvcFdoaWxlRWRpdGluZ1wiXG4gICAgICAgID5cbiAgICAgICAgICA8Y29tcG9uZW50XG4gICAgICAgICAgICA6aXM9XCJ0aWxlLmNvbXBvbmVudFwiXG4gICAgICAgICAgICB2LWJpbmQ9XCJ0aWxlLnByb3BzXCJcbiAgICAgICAgICAgIDpzaXplPVwidGlsZS5zaXplS2V5XCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCJlZGl0aW5nXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19ncmlwXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiZ3JpcExhYmVsKHRpbGUpXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1ncmlwXCJcbiAgICAgICAgICAgIEBwb2ludGVyZG93bj1cInN0YXJ0TW92ZSgkZXZlbnQsIHRpbGUuaWQpXCJcbiAgICAgICAgICAgIEBrZXlkb3duPVwiZ3JpcEtleSgkZXZlbnQsIHRpbGUuaWQpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8aSAvPjxpIC8+PGkgLz48aSAvPjxpIC8+PGkgLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX3JlbW92ZVwiXG4gICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBIaWRlICR7dGlsZS50aXRsZX1gXCJcbiAgICAgICAgICAgIDp0aXRsZT1cImBIaWRlICR7dGlsZS50aXRsZX1gXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1yZW1vdmVcIlxuICAgICAgICAgICAgQGNsaWNrPVwicmVtb3ZlKHRpbGUuaWQpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3BhbiBhcmlhLWhpZGRlbj1cInRydWVcIj7Dlzwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgdi1pZj1cIiFuYXJyb3dcIlxuICAgICAgICAgICAgY2xhc3M9XCJvdmVydmlld19fcmVzaXplXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1yZXNpemVcIlxuICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgIEBwb2ludGVyZG93bj1cInN0YXJ0UmVzaXplKCRldmVudCwgdGlsZS5pZClcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCIhdGlsZXMubGVuZ3RoXCJcbiAgICAgICAgY2xhc3M9XCJvdmVydmlld19fZW1wdHlcIlxuICAgICAgICBkYXRhLXRpZD1cIm92ZXJ2aWV3LWVtcHR5XCJcbiAgICAgID5cbiAgICAgICAge3sgZWRpdGluZyA/ICdObyB3aWRnZXRzIG9uIHRoZSBwYWdlLiBDaG9vc2UgQWRkIHdpZGdldC4nIDogJ0V2ZXJ5IHdpZGdldCBpcyBwdXQgYXdheS4gQ2hvb3NlIEVkaXQgdG8gYWRkIHNvbWUgYmFjay4nIH19XG4gICAgICA8L3A+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwic2hlZXQgJiYgZWRpdGluZ1wiXG4gICAgICBjbGFzcz1cIm92ZXJ2aWV3X19zaGVldFwiXG4gICAgICByb2xlPVwiZGlhbG9nXCJcbiAgICAgIGFyaWEtbW9kYWw9XCJ0cnVlXCJcbiAgICAgIGFyaWEtbGFiZWw9XCJBZGQgd2lkZ2V0XCJcbiAgICAgIGRhdGEtdGlkPVwid2lkZ2V0LXNoZWV0XCJcbiAgICAgIEBrZXlkb3duLmVzYz1cInNoZWV0ID0gZmFsc2VcIlxuICAgICAgQGNsaWNrLnNlbGY9XCJzaGVldCA9IGZhbHNlXCJcbiAgICA+XG4gICAgICA8ZGl2IGNsYXNzPVwib3ZlcnZpZXdfX3NoZWV0LWNhcmRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm92ZXJ2aWV3X19zaGVldC1oZWFkXCI+XG4gICAgICAgICAgPGI+QWRkIHdpZGdldDwvYj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2J0blwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIndpZGdldC1zaGVldC1jbG9zZVwiXG4gICAgICAgICAgICBAY2xpY2s9XCJzaGVldCA9IGZhbHNlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDbG9zZVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdi1tb2RlbD1cInF1ZXJ5XCJcbiAgICAgICAgICB0eXBlPVwic2VhcmNoXCJcbiAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19zZWFyY2hcIlxuICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIHdpZGdldHNcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJTZWFyY2ggd2lkZ2V0c1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ3aWRnZXQtc2VhcmNoXCJcbiAgICAgICAgPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJvdmVydmlld19fY2F0c1wiXG4gICAgICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiQ2F0ZWdvcmllc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2NoaXBcIlxuICAgICAgICAgICAgOmNsYXNzPVwieyAnb3ZlcnZpZXdfX2NoaXAtLW9uJzogIWNhdGVnb3J5IH1cIlxuICAgICAgICAgICAgOmFyaWEtcHJlc3NlZD1cIiFjYXRlZ29yeSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ3aWRnZXQtY2F0LWFsbFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJjYXRlZ29yeSA9IG51bGxcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIEFsbFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtZm9yPVwiYyBpbiBjYXRlZ29yaWVzXCJcbiAgICAgICAgICAgIDprZXk9XCJjXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJvdmVydmlld19fY2hpcFwiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdvdmVydmlld19fY2hpcC0tb24nOiBjYXRlZ29yeSA9PT0gYyB9XCJcbiAgICAgICAgICAgIDphcmlhLXByZXNzZWQ9XCJjYXRlZ29yeSA9PT0gYyA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHdpZGdldC1jYXQtJHtjfWBcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY2F0ZWdvcnkgPSBjXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyBjIH19XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dWwgY2xhc3M9XCJvdmVydmlld19fY2FyZHNcIj5cbiAgICAgICAgICA8bGlcbiAgICAgICAgICAgIHYtZm9yPVwidyBpbiBzaG93bldpZGdldHNcIlxuICAgICAgICAgICAgOmtleT1cIncuaWRcIlxuICAgICAgICAgICAgY2xhc3M9XCJvdmVydmlld19fY2FyZFwiXG4gICAgICAgICAgICA6ZGF0YS10aWQ9XCJgd2lkZ2V0LWNhcmQtJHt3LmlkfWBcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvdmVydmlld19fY2FyZC10b3BcIj5cbiAgICAgICAgICAgICAgPGI+e3sgdy50aXRsZSB9fTwvYj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJvdmVydmlld19fY2FyZC1jYXRcIj57eyB3LmNhdGVnb3J5IH19PC9zcGFuPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1pZj1cImlzT24ody5pZClcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX3BtXCJcbiAgICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBSZW1vdmUgJHt3LnRpdGxlfSBmcm9tIE92ZXJ2aWV3YFwiXG4gICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHdpZGdldC1yZW1vdmUtJHt3LmlkfWBcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cInJlbW92ZSh3LmlkKVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDiiJJcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19wbVwiXG4gICAgICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgQWRkICR7dy50aXRsZX0gdG8gT3ZlcnZpZXdgXCJcbiAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgd2lkZ2V0LWFkZC0ke3cuaWR9YFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwiYWRkV2lkZ2V0KHcuaWQpXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICtcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwPnt7IHcuYmx1cmIgfX08L3A+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgIHYtaWY9XCIhaXNPbih3LmlkKVwiXG4gICAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX2NhcmQtYWN0XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICBjbGFzcz1cIm92ZXJ2aWV3X19zaXplc1wiXG4gICAgICAgICAgICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImAke3cudGl0bGV9IHNpemVgXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHYtZm9yPVwieiBpbiB3LnNpemVzXCJcbiAgICAgICAgICAgICAgICAgIDprZXk9XCJ6LmtleVwiXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX3NpemVcIlxuICAgICAgICAgICAgICAgICAgOmNsYXNzPVwieyAnb3ZlcnZpZXdfX3NpemUtLW9uJzogc2l6ZUZvcih3KSA9PT0gei5rZXkgfVwiXG4gICAgICAgICAgICAgICAgICA6YXJpYS1wcmVzc2VkPVwic2l6ZUZvcih3KSA9PT0gei5rZXkgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgICAgICAgIDp0aXRsZT1cImAke3ouc3Bhbn0gY29sdW1ucywgJHt6LnJvd3N9ICR7ei5yb3dzID09PSAxID8gJ3JvdycgOiAncm93cyd9YFwiXG4gICAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgd2lkZ2V0LXNpemUtJHt3LmlkfS0ke3oua2V5fWBcIlxuICAgICAgICAgICAgICAgICAgQGNsaWNrPVwicGljayh3LmlkLCB6LmtleSlcIlxuICAgICAgICAgICAgICAgID57eyB6LmtleSB9fTwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDxsaVxuICAgICAgICAgICAgdi1pZj1cIiFzaG93bldpZGdldHMubGVuZ3RoXCJcbiAgICAgICAgICAgIGNsYXNzPVwib3ZlcnZpZXdfX25vbmVcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ3aWRnZXQtbm9uZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgTm8gd2lkZ2V0IG1hdGNoZXMuXG4gICAgICAgICAgPC9saT5cbiAgICAgICAgPC91bD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxwXG4gICAgICBjbGFzcz1cIm92ZXJ2aWV3X19zclwiXG4gICAgICByb2xlPVwic3RhdHVzXCJcbiAgICAgIGFyaWEtbGl2ZT1cInBvbGl0ZVwiXG4gICAgICBkYXRhLXRpZD1cImVkaXQtc3RhdHVzXCJcbiAgICA+XG4gICAgICB7eyBzdGF0dXMgfX1cbiAgICA8L3A+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgRGV2R3VhcmRNaXhpbiBmcm9tICdAL21peGlucy9kZXYtZ3VhcmQnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IFBsYXRlQ2xlYXJCYXIgZnJvbSAnQC9jb21wb25lbnRzL3VpL1BsYXRlQ2xlYXJCYXIudnVlJ1xuaW1wb3J0IE1hY2hpbmVGYXVsdEJhciBmcm9tICdAL2NvbXBvbmVudHMvdWkvTWFjaGluZUZhdWx0QmFyLnZ1ZSdcbmltcG9ydCB7IG92ZXJ2aWV3VGlsZXMsIHR5cGUgT3ZlcnZpZXdUaWxlRGVmIH0gZnJvbSAnQC9jb21wb25lbnRzL3dpZGdldHMvb3ZlcnZpZXcvcmVnaXN0cnknXG5pbXBvcnQge1xuICBhZGRUaWxlLCBkZWZhdWx0TGF5b3V0LCBkcm9wSW5kZXgsIG1vdmVCeSwgbW92ZVRpbGUsIG51ZGdlU2l6ZSwgcmVtb3ZlVGlsZSwgcmVzaXplVGlsZSwgc2VydmVyTGF5b3V0S2V5LCBzaXplS2V5T2YsXG4gIHR5cGUgT3ZlcnZpZXdMYXlvdXQsIHR5cGUgUGxhY2VkVGlsZSwgdHlwZSBTbG90XG59IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvbGF5b3V0J1xuaW1wb3J0IHsgcmVkdWNlZE1vdGlvbiwgc3ByaW5nQ3VydmUsIHNwcmluZ0tleWZyYW1lcyB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvc3ByaW5nJ1xuaW1wb3J0IHsgc2VhcmNoV2lkZ2V0cywgdHJlYXRBc011b24sIHdpZGdldENhdGVnb3JpZXMsIHdpZGdldHNGb3IsIHR5cGUgV2lkZ2V0Q2F0ZWdvcnkgfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L3dpZGdldHMnXG5pbXBvcnQgeyBsb2FkTGF5b3V0LCBzYXZlTGF5b3V0LCBzdGFsZUxheW91dCwgdHlwZSBMYXlvdXRDb250ZXh0IH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy9sYXlvdXQtc3RvcmUnXG5cbi8qKiBBIHRpbGUgYXMgZHJhd246IHdoYXQgdGhlIHJlZ2lzdHJ5IHNheXMgaXQgaXMsIGF0IHRoZSBzaXplIHRoZSBsYXlvdXQgZ2l2ZXMgaXQuICovXG50eXBlIERyYXduVGlsZSA9IE92ZXJ2aWV3VGlsZURlZiAmIFBsYWNlZFRpbGUgJiB7IHNpemVLZXk6IHN0cmluZyB9XG5cbmludGVyZmFjZSBEcmFnIHsga2luZDogJ21vdmUnOyBpZDogc3RyaW5nOyBvdmVyOiBzdHJpbmcgfCBudWxsOyB4OiBudW1iZXI7IHk6IG51bWJlciB9XG5cbmNvbnN0IEdSSURfR0FQID0gMTZcbi8qKiBUaGUgaWQgb2YgZXZlcnkgc3ByaW5nIHRoaXMgcGFnZSBzdGFydHMsIHNvIGEgdGVzdCAob3IgZGV2dG9vbHMpIGNhbiB0ZWxsIHRoZW0gZnJvbSBvdGhlciBhbmltYXRpb25zLiAqL1xuY29uc3QgU1BSSU5HID0gJ292ZXJ2aWV3LXNwcmluZydcblxuLyoqXG4gKiBUaGUgcHJpbnRlcidzIG93biBwYWdlOiB0aGUgbGl2ZSAzRCB2aWV3LCB0aGUgcHJpbnQgam9iLCB0aGUgZmlsYW1lbnQsXG4gKiB0aGVuIGluc3RydW1lbnQgdGlsZXMgZm9yIHRoZSBoZWF0ZXJzLCBmYW5zLCBzcGVlZCwgcG9zaXRpb24gYW5kIFogb2Zmc2V0LFxuICogYSBqb2cgcGFkLCBtYWNyb3MgYW5kIHRoZSB0ZW1wZXJhdHVyZSBncmFwaC4gRWFjaCB0aWxlIG9wZW5zIGl0cyBmdWxsXG4gKiBjb250cm9scyBpbiBhIHBvcG92ZXIsIGFuZCBrZWVwcyB0aGUgUHJvLWxldmVsIGRlcHRoIGJlaGluZCBpdHMgdGhyZWUgZG90cy5cbiAqIFdoaWNoIHRpbGVzIHRoZXJlIGFyZSBpcyB0aGUgbGlzdCBpbiB3aWRnZXRzL292ZXJ2aWV3L3JlZ2lzdHJ5OyB3aGVyZSB0aGV5XG4gKiBzaXQgYW5kIGhvdyBiaWcgdGhleSBhcmUgaXMgdGhpcyBwZXJzb24ncyBzYXZlZCBsYXlvdXQgKHNlcnZpY2VzL292ZXJ2aWV3KSxcbiAqIGNoYW5nZWQgd2l0aCBFZGl0LiBXaGlsZSBlZGl0aW5nIHRoZSB0aWxlcyBhcmUgaW5lcnQ6IG5vdGhpbmcgaXMgc2VudCB0byB0aGUgcHJpbnRlci5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTWFjaGluZUZhdWx0QmFyLCBQbGF0ZUNsZWFyQmFyIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE92ZXJ2aWV3IGV4dGVuZHMgTWl4aW5zKERldkd1YXJkTWl4aW4pIHtcbiAgbGF5b3V0OiBPdmVydmlld0xheW91dCA9IGRlZmF1bHRMYXlvdXQob3ZlcnZpZXdUaWxlcylcbiAgZHJhZnQ6IE92ZXJ2aWV3TGF5b3V0IHwgbnVsbCA9IG51bGxcbiAgZHJhZzogRHJhZyB8IG51bGwgPSBudWxsXG4gIC8qKiBCZWxvdyAxMTAwIHB4ICh0YWJsZXQgYW5kIHBob25lKSB0aWxlcyBjYW4gYmUgbW92ZWQgYW5kIGhpZGRlbiBidXQgbm90IHJlc2l6ZWQ6IHNpemVzIGFyZSB0aGUgZGVza3RvcCBncmlkLiAqL1xuICBuYXJyb3cgPSBmYWxzZVxuICAvKiogQSBsYXlvdXQgc2F2ZWQgYmVmb3JlIHRoZSBJLTU0MiByb3cgZXhpc3RlZCB3YXMgc2V0IGFzaWRlOyB0aGUgbmV3IGRlZmF1bHQgc2hvd3MgdW50aWwgaXQgaXMga2VwdCBvciBlZGl0ZWQuICovXG4gIG1pZ3JhdGVkID0gZmFsc2VcbiAgc3RhdHVzID0gJydcbiAgcHJpdmF0ZSBuYXJyb3dRdWVyeTogTWVkaWFRdWVyeUxpc3QgfCBudWxsID0gbnVsbFxuICAvKiogV2hlcmUgZWFjaCB0aWxlIHdhcyBiZWZvcmUgdGhlIGxheW91dCBjaGFuZ2VkLCBzbyBpdCBjYW4gZ2xpZGUgdG8gd2hlcmUgaXQgaXMgbm93LiAqL1xuICBwcml2YXRlIHJlY3RzID0gbmV3IE1hcDxzdHJpbmcsIERPTVJlY3Q+KClcbiAgcHJpdmF0ZSBzaGFwZSA9ICcnXG4gIHNoZWV0ID0gZmFsc2VcbiAgcXVlcnkgPSAnJ1xuICBjYXRlZ29yeTogV2lkZ2V0Q2F0ZWdvcnkgfCBudWxsID0gbnVsbFxuICBwaWNrZWQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICByZWFkb25seSBjYXRlZ29yaWVzID0gd2lkZ2V0Q2F0ZWdvcmllc1xuICBwcml2YXRlIHN0b3BEcmFnOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG4gIC8qKiBUaGUgd2lkZ2V0cyB0aGlzIHByaW50ZXIgaGFzOiBhIE11b24gcHJpbnRlciBoYXMgWiBvZmZzZXQgb25seSBpbiBkZXZlbG9wZXIgbW9kZS4gKi9cbiAgZ2V0IGRlZnMgKCk6IE92ZXJ2aWV3VGlsZURlZltdIHtcbiAgICByZXR1cm4gd2lkZ2V0c0ZvcihvdmVydmlld1RpbGVzLCB0cmVhdEFzTXVvbih0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvaXNNdW9uUHJpbnRlciddKSAmJiB0aGlzLmRldk9ubHlMb2NrZWQpXG4gIH1cblxuICBnZXQgZWRpdGluZyAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmRyYWZ0ICE9PSBudWxsIH1cblxuICAvKiogQSBkaWZmZXJlbnQgcHJpbnRlciBvciBhY2NvdW50IHN0YXJ0cyBldmVyeSB0aWxlIGFmcmVzaCwgc28gbm90aGluZyBoYWxmLXR5cGVkIGNyb3NzZXMgb3Zlci4gKi9cbiAgZ2V0IGNvbnRleHRLZXkgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmx9fCR7Y2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgPz8gJyd9fCR7Y2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyAnJ318JHt0aGlzLiRyb3V0ZT8ucGFyYW1zPy5wcmludGVyID8/ICcnfWBcbiAgfVxuXG4gIGdldCBjb250ZXh0ICgpOiBMYXlvdXRDb250ZXh0IHtcbiAgICByZXR1cm4geyBhY2NvdW50SWQ6IGNsb3VkU3RhdGUuYWNjb3VudD8uaWQgPz8gbnVsbCwgcHJpbnRlcklkOiBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCA/PyB0aGlzLiRyb3V0ZT8ucGFyYW1zPy5wcmludGVyID8/IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwgPz8gbnVsbCB9XG4gIH1cblxuICAvKiogV2hhdCB0aGlzIHByaW50ZXIncyBzZXR0aW5ncyBob2xkLCB3aGljaCBmaWxscyBpbiBhZnRlciB0aGUgcGFnZSBvcGVucy4gKi9cbiAgZ2V0IHNhdmVkTGF5b3V0cyAoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncz8ub3ZlcnZpZXc/LmxheW91dHNcbiAgfVxuXG4gIGdldCBjdXJyZW50ICgpOiBPdmVydmlld0xheW91dCB7IHJldHVybiB0aGlzLmRyYWZ0ID8/IHRoaXMubGF5b3V0IH1cblxuICBnZXQgdGlsZXMgKCk6IERyYXduVGlsZVtdIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50LnRpbGVzLmZsYXRNYXAocCA9PiB7XG4gICAgICBjb25zdCBkZWYgPSB0aGlzLmRlZnMuZmluZChkID0+IGQuaWQgPT09IHAuaWQpXG4gICAgICByZXR1cm4gZGVmID8gW3sgLi4uZGVmLCAuLi5wLCBzaXplS2V5OiBzaXplS2V5T2YoZGVmLCBwKSA/PyBkZWYuc2l6ZSB9XSA6IFtdXG4gICAgfSlcbiAgfVxuXG4gIGdldCBzaG93bldpZGdldHMgKCk6IE92ZXJ2aWV3VGlsZURlZltdIHsgcmV0dXJuIHNlYXJjaFdpZGdldHModGhpcy5kZWZzLCB0aGlzLnF1ZXJ5LCB0aGlzLmNhdGVnb3J5KSBhcyBPdmVydmlld1RpbGVEZWZbXSB9XG5cbiAgaXNPbiAoaWQ6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jdXJyZW50LnRpbGVzLnNvbWUodCA9PiB0LmlkID09PSBpZCkgfVxuXG4gIHNpemVGb3IgKHc6IE92ZXJ2aWV3VGlsZURlZik6IHN0cmluZyB7IHJldHVybiB0aGlzLnBpY2tlZFt3LmlkXSA/PyB3LnNpemUgfVxuXG4gIHBpY2sgKGlkOiBzdHJpbmcsIGtleTogc3RyaW5nKSB7IHRoaXMuJHNldCh0aGlzLnBpY2tlZCwgaWQsIGtleSkgfVxuXG4gIG9wZW5TaGVldCAoKSB7IHRoaXMucXVlcnkgPSAnJzsgdGhpcy5jYXRlZ29yeSA9IG51bGw7IHRoaXMucGlja2VkID0ge307IHRoaXMuc2hlZXQgPSB0cnVlIH1cblxuICAvKipcbiAgICogU3ByaW5ncyBlYWNoIHRpbGUgZnJvbSB3aGVyZSBpdCB3YXMgdG8gd2hlcmUgaXQgaXM6IG1vdmVkLCByZXNpemVkLCBhZGRlZFxuICAgKiBvciBwdXQgYXdheSwgYW5kIHRoZSBvdGhlcnMgbWFraW5nIHJvb20gd2hpbGUgb25lIGlzIGRyYWdnZWQuIE9ubHlcbiAgICogdHJhbnNmb3JtcyBhcmUgYW5pbWF0ZWQ7IGVhY2ggdGlsZSBpcyBtZWFzdXJlZCBvbmNlIGJlZm9yZSBhbmQgb25jZSBhZnRlci5cbiAgICovXG4gIEBXYXRjaCgnY3VycmVudCcpXG4gIGdsaWRlICgpIHtcbiAgICAvLyBBIG5ldyBvYmplY3Qgd2l0aCB0aGUgc2FtZSB0aWxlcyBpcyBub3QgYSBtb3ZlOiBzdGFydGluZyBhZ2FpbiBmcm9tIG1pZC1zcHJpbmcgd291bGQgbmV2ZXIgbGV0IG9uZSBzZXR0bGUuXG4gICAgY29uc3Qgc2hhcGUgPSB0aGlzLmN1cnJlbnQudGlsZXMubWFwKHQgPT4gYCR7dC5pZH06JHt0LnNwYW59OiR7dC5yb3dzfWApLmpvaW4oJ3wnKVxuICAgIGlmIChzaGFwZSA9PT0gdGhpcy5zaGFwZSkgcmV0dXJuXG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gICAgLy8gT25seSB3aGF0IHNvbWVvbmUgZG9lcyBpbiBFZGl0IG1vdmVzIHdpdGggYSBzcHJpbmc7IHRoZSBwYWdlIGxvYWRpbmcgb3IgYSBzYXZlZCBsYXlvdXQgYXJyaXZpbmcganVzdCBkcmF3cy5cbiAgICBpZiAocmVkdWNlZE1vdGlvbigpIHx8ICF0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIC8vIFVzZXIgd2F0Y2hlcnMgcnVuIGJlZm9yZSB0aGUgcmUtcmVuZGVyLCBzbyB0aGlzIGlzIHN0aWxsIHRoZSBvbGQgbGF5b3V0IChtaWQtc3ByaW5nIGlmIG9uZSBpcyBydW5uaW5nKS5cbiAgICBjb25zdCBiZWZvcmUgPSBuZXcgTWFwPHN0cmluZywgRE9NUmVjdD4oKVxuICAgIGZvciAoY29uc3QgdCBvZiB0aGlzLmN1cnJlbnQudGlsZXMpIHtcbiAgICAgIGNvbnN0IGVsID0gdGhpcy5jZWxsRWwodC5pZClcbiAgICAgIGlmIChlbCkgYmVmb3JlLnNldCh0LmlkLCBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSlcbiAgICB9XG4gICAgZm9yIChjb25zdCBbaWQsIHJlY3RdIG9mIHRoaXMucmVjdHMpIGlmICghYmVmb3JlLmhhcyhpZCkpIGJlZm9yZS5zZXQoaWQsIHJlY3QpXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgY29uc3QgY3VydmUgPSBzcHJpbmdDdXJ2ZSgpXG4gICAgICBjb25zdCBkcmFnZ2VkID0gdGhpcy5kcmFnPy5raW5kID09PSAnbW92ZScgPyB0aGlzLmRyYWcuaWQgOiBudWxsXG4gICAgICBjb25zdCBtb3ZlczogQXJyYXk8W0hUTUxFbGVtZW50LCBLZXlmcmFtZVtdXT4gPSBbXVxuICAgICAgZm9yIChjb25zdCB0IG9mIHRoaXMuY3VycmVudC50aWxlcykge1xuICAgICAgICBjb25zdCBlbCA9IHRoaXMuY2VsbEVsKHQuaWQpXG4gICAgICAgIGNvbnN0IHdhcyA9IGJlZm9yZS5nZXQodC5pZClcbiAgICAgICAgaWYgKCFlbCB8fCAhd2FzIHx8IHQuaWQgPT09IGRyYWdnZWQgfHwgdHlwZW9mIGVsLmFuaW1hdGUgIT09ICdmdW5jdGlvbicpIGNvbnRpbnVlXG4gICAgICAgIGVsLmdldEFuaW1hdGlvbnM/LigpLmZvckVhY2goYSA9PiBhLmNhbmNlbCgpKVxuICAgICAgICBjb25zdCBub3cgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBpZiAoIW5vdy53aWR0aCB8fCAhbm93LmhlaWdodCkgY29udGludWVcbiAgICAgICAgY29uc3QgZnJvbSA9IHsgZHg6IHdhcy5sZWZ0IC0gbm93LmxlZnQsIGR5OiB3YXMudG9wIC0gbm93LnRvcCwgc3g6IHdhcy53aWR0aCAvIG5vdy53aWR0aCwgc3k6IHdhcy5oZWlnaHQgLyBub3cuaGVpZ2h0IH1cbiAgICAgICAgaWYgKE1hdGguYWJzKGZyb20uZHgpIDwgMSAmJiBNYXRoLmFicyhmcm9tLmR5KSA8IDEgJiYgTWF0aC5hYnMoZnJvbS5zeCAtIDEpIDwgMC4wMSAmJiBNYXRoLmFicyhmcm9tLnN5IC0gMSkgPCAwLjAxKSBjb250aW51ZVxuICAgICAgICBtb3Zlcy5wdXNoKFtlbCwgc3ByaW5nS2V5ZnJhbWVzKGZyb20sIGN1cnZlKV0pXG4gICAgICB9XG4gICAgICAvLyBNZWFzdXJlIGV2ZXJ5dGhpbmcgZmlyc3QsIHRoZW4gc3RhcnQgZXZlcnkgc3ByaW5nLCBzbyB0aGUgYnJvd3NlciBsYXlzIG91dCBvbmNlLlxuICAgICAgZm9yIChjb25zdCBbZWwsIGZyYW1lc10gb2YgbW92ZXMpIGVsLmFuaW1hdGUoZnJhbWVzLCB7IGlkOiBTUFJJTkcsIGR1cmF0aW9uOiBjdXJ2ZS5kdXJhdGlvbiwgZWFzaW5nOiAnbGluZWFyJyB9KVxuICAgICAgdGhpcy5yZWN0cyA9IGJlZm9yZVxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGNlbGxFbCAoaWQ6IHN0cmluZyk6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gKHRoaXMuJHJlZnNbYGNlbGwtJHtpZH1gXSBhcyBIVE1MRWxlbWVudFtdIHwgdW5kZWZpbmVkKT8uWzBdXG4gIH1cblxuICBAV2F0Y2goJ2NvbnRleHRLZXknKVxuICBAV2F0Y2goJ3NhdmVkTGF5b3V0cycpXG4gIEBXYXRjaCgnZGVmcycpXG4gIGxvYWQgKCkge1xuICAgIGlmICh0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIHRoaXMubGF5b3V0ID0gbG9hZExheW91dCh0aGlzLmNvbnRleHQsIHRoaXMuc2F2ZWRMYXlvdXRzLCBsb2NhbFN0b3JhZ2UsIHRoaXMuZGVmcylcbiAgICB0aGlzLm1pZ3JhdGVkID0gc3RhbGVMYXlvdXQodGhpcy5jb250ZXh0LCB0aGlzLnNhdmVkTGF5b3V0cywgbG9jYWxTdG9yYWdlLCB0aGlzLmRlZnMpXG4gIH1cblxuICBjcmVhdGVkICgpIHtcbiAgICB0aGlzLmxvYWQoKVxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cubWF0Y2hNZWRpYSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5uYXJyb3dRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKCcobWF4LXdpZHRoOiAxMDk5cHgpJylcbiAgICAgIHRoaXMubmFycm93ID0gdGhpcy5uYXJyb3dRdWVyeS5tYXRjaGVzXG4gICAgICB0aGlzLm5hcnJvd1F1ZXJ5LmFkZEV2ZW50TGlzdGVuZXI/LignY2hhbmdlJywgdGhpcy5vbk5hcnJvdylcbiAgICB9XG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLnN0b3BEcmFnPy4oKVxuICAgIHRoaXMubmFycm93UXVlcnk/LnJlbW92ZUV2ZW50TGlzdGVuZXI/LignY2hhbmdlJywgdGhpcy5vbk5hcnJvdylcbiAgfVxuXG4gIG9uTmFycm93IChlOiBNZWRpYVF1ZXJ5TGlzdEV2ZW50KSB7IHRoaXMubmFycm93ID0gZS5tYXRjaGVzIH1cblxuICBjZWxsU3R5bGUgKHRpbGU6IERyYXduVGlsZSk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICAgIC8vIEEgdGlsZSBsZWZ0IGF0IGl0cyBvd24gd2lkdGgga2VlcHMgaXRzIG93biB0YWJsZXQgd2lkdGg7IGEgcmVzaXplZCBvbmUgdGFrZXMgaGFsZiBvciB0aGUgd2hvbGUgcm93LlxuICAgIGNvbnN0IHRhYmxldCA9IHRpbGUuc3BhbiA+IDYgPyAxMiA6IDZcbiAgICAvLyBPbiBhIHBob25lIGEgc21hbGwgd2lkZ2V0IHNpdHMgdHdvIHRvIGEgcm93OyBhbnl0aGluZyB3aWRlciBoYXMgYSByb3cgb2YgaXRzIG93bi5cbiAgICByZXR1cm4geyAnLS1zcGFuJzogU3RyaW5nKHRpbGUuc3BhbiksICctLXJvd3MnOiBTdHJpbmcodGlsZS5yb3dzKSwgJy0tdGFibGV0JzogU3RyaW5nKHRhYmxldCksICctLXBob25lJzogU3RyaW5nKHRpbGUuc3BhbiA8PSAzICYmICFbJ21vZGUnLCAncG9zaXRpb24nXS5pbmNsdWRlcyh0aWxlLmlkKSA/IDEgOiAyKSB9XG4gIH1cblxuICB0aXRsZU9mIChpZDogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZGVmcy5maW5kKGQgPT4gZC5pZCA9PT0gaWQpPy50aXRsZSA/PyBpZCB9XG5cbiAgLyogRWRpdCBtb2RlICovXG5cbiAgLyoqIFdyaXRlcyB0aGUgbmV3IGRlZmF1bHQgYXMgdGhpcyBwZXJzb24ncyBvd24sIHNvIHRoZSBub3RpY2UgZ29lcyBhbmQgdGhlIGxheW91dCBzdGF5cy4gKi9cbiAga2VlcE5ldyAoKSB7XG4gICAgY29uc3QgcmVjb3JkID0gc2F2ZUxheW91dCh0aGlzLmNvbnRleHQsIHRoaXMubGF5b3V0LCBsb2NhbFN0b3JhZ2UpXG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywge1xuICAgICAgcGF0aDogYHVpU2V0dGluZ3Mub3ZlcnZpZXcubGF5b3V0cy4ke3NlcnZlckxheW91dEtleSh0aGlzLmNvbnRleHQuYWNjb3VudElkLCB0aGlzLmNvbnRleHQucHJpbnRlcklkKX1gLFxuICAgICAgdmFsdWU6IHJlY29yZCxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gICAgdGhpcy5taWdyYXRlZCA9IGZhbHNlXG4gIH1cblxuICBzdGFydEVkaXQgKCkge1xuICAgIHRoaXMuZHJhZnQgPSB7IHRpbGVzOiB0aGlzLmxheW91dC50aWxlcy5tYXAodCA9PiAoeyAuLi50IH0pKSwgaGlkZGVuOiBbLi4udGhpcy5sYXlvdXQuaGlkZGVuXSB9XG4gICAgdGhpcy5zdGF0dXMgPSAnRWRpdGluZyB0aGUgT3ZlcnZpZXcuJ1xuICB9XG5cbiAgcmVzZXQgKCkge1xuICAgIGlmICghdGhpcy5kcmFmdCkgcmV0dXJuXG4gICAgdGhpcy5kcmFmdCA9IGRlZmF1bHRMYXlvdXQodGhpcy5kZWZzKVxuICAgIHRoaXMuc3RhdHVzID0gJ0V2ZXJ5IHdpZGdldCBpcyBiYWNrIHdoZXJlIGl0IHN0YXJ0ZWQuIENob29zZSBEb25lIHRvIGtlZXAgaXQuJ1xuICAgIHRoaXMuc2hlZXQgPSBmYWxzZVxuICB9XG5cbiAgZG9uZSAoKSB7XG4gICAgY29uc3QgZHJhZnQgPSB0aGlzLmRyYWZ0XG4gICAgaWYgKCFkcmFmdCkgcmV0dXJuXG4gICAgdGhpcy5zdG9wRHJhZz8uKClcbiAgICB0aGlzLnNoZWV0ID0gZmFsc2VcbiAgICBpZiAoSlNPTi5zdHJpbmdpZnkoZHJhZnQpICE9PSBKU09OLnN0cmluZ2lmeSh0aGlzLmxheW91dCkpIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IHNhdmVMYXlvdXQodGhpcy5jb250ZXh0LCBkcmFmdCwgbG9jYWxTdG9yYWdlKVxuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywge1xuICAgICAgICAvLyBPbmx5IHRoaXMgcGVyc29uJ3Mga2V5IG9uIHRoaXMgcHJpbnRlciwgbmV2ZXIgdGhlIHdob2xlIG1hcDogYW5vdGhlclxuICAgICAgICAvLyBwZXJzb24ncyB0YWIgc2F2aW5nIGZyb20gYW4gb2xkZXIgY29weSBtdXN0IG5vdCB3aXBlIHRoaXMgbGF5b3V0LlxuICAgICAgICBwYXRoOiBgdWlTZXR0aW5ncy5vdmVydmlldy5sYXlvdXRzLiR7c2VydmVyTGF5b3V0S2V5KHRoaXMuY29udGV4dC5hY2NvdW50SWQsIHRoaXMuY29udGV4dC5wcmludGVySWQpfWAsXG4gICAgICAgIHZhbHVlOiByZWNvcmQsXG4gICAgICAgIHNlcnZlcjogdHJ1ZVxuICAgICAgfSlcbiAgICAgIHRoaXMubGF5b3V0ID0geyB0aWxlczogcmVjb3JkLnRpbGVzLCBoaWRkZW46IHJlY29yZC5oaWRkZW4gfVxuICAgIH1cbiAgICB0aGlzLmRyYWZ0ID0gbnVsbFxuICAgIHRoaXMubWlncmF0ZWQgPSBmYWxzZVxuICAgIHRoaXMuc3RhdHVzID0gJ092ZXJ2aWV3IHNhdmVkLidcbiAgfVxuXG4gIC8qKiBTdG9wcyBwcmVzc2VzLCB0eXBpbmcgYW5kIGZvcm0gY2hhbmdlcyBmcm9tIHJlYWNoaW5nIGEgdGlsZSB3aGlsZSB0aGUgcGFnZSBpcyBiZWluZyBlZGl0ZWQuICovXG4gIHN0b3BXaGlsZUVkaXRpbmcgKGU6IEV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfVxuXG4gIHJlbW92ZSAoaWQ6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5kcmFmdCkgcmV0dXJuXG4gICAgdGhpcy5kcmFmdCA9IHJlbW92ZVRpbGUodGhpcy5kcmFmdCwgaWQpXG4gICAgdGhpcy5zdGF0dXMgPSBgJHt0aGlzLnRpdGxlT2YoaWQpfSBwdXQgYXdheS5gXG4gIH1cblxuICBhZGQgKGlkOiBzdHJpbmcsIGF0PzogbnVtYmVyLCBzaXplS2V5Pzogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLmRyYWZ0KSByZXR1cm5cbiAgICB0aGlzLmRyYWZ0ID0gYWRkVGlsZSh0aGlzLmRyYWZ0LCBpZCwgdGhpcy5kZWZzLCBhdCwgc2l6ZUtleSwgMTIpXG4gICAgY29uc3QgdCA9IHRoaXMuZHJhZnQudGlsZXMuZmluZCh4ID0+IHguaWQgPT09IGlkKVxuICAgIHRoaXMuc3RhdHVzID0gYCR7dGhpcy50aXRsZU9mKGlkKX0gYWRkZWQke3QgPyBgLCAke3Quc3Bhbn0gY29sdW1ucyB3aWRlIGFuZCAke3Qucm93c30gJHt0LnJvd3MgPT09IDEgPyAncm93JyA6ICdyb3dzJ30gdGFsbGAgOiAnJ30uYFxuICB9XG5cbiAgYWRkV2lkZ2V0IChpZDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVmID0gdGhpcy5kZWZzLmZpbmQoZCA9PiBkLmlkID09PSBpZClcbiAgICBpZiAoIWRlZikgcmV0dXJuXG4gICAgdGhpcy5hZGQoaWQsIHVuZGVmaW5lZCwgdGhpcy5zaXplRm9yKGRlZikpXG4gIH1cblxuICBncmlwTGFiZWwgKHRpbGU6IERyYXduVGlsZSk6IHN0cmluZyB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5jdXJyZW50LnRpbGVzLmZpbmRJbmRleCh0ID0+IHQuaWQgPT09IHRpbGUuaWQpICsgMVxuICAgIHJldHVybiBgTW92ZSAke3RpbGUudGl0bGV9LCBwbGFjZSAke3Bvc30gb2YgJHt0aGlzLmN1cnJlbnQudGlsZXMubGVuZ3RofS4gQXJyb3cga2V5cyBtb3ZlIGl0JHt0aGlzLm5hcnJvdyA/ICcnIDogJywgU2hpZnQgYW5kIGFycm93IGtleXMgcmVzaXplIGl0J30uYFxuICB9XG5cbiAgZ3JpcEtleSAoZTogS2V5Ym9hcmRFdmVudCwgaWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGtleXMgPSBbJ0Fycm93TGVmdCcsICdBcnJvd1JpZ2h0JywgJ0Fycm93VXAnLCAnQXJyb3dEb3duJ11cbiAgICBpZiAoIXRoaXMuZHJhZnQgfHwgIWtleXMuaW5jbHVkZXMoZS5rZXkpKSByZXR1cm5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBiYWNrID0gZS5rZXkgPT09ICdBcnJvd0xlZnQnIHx8IGUua2V5ID09PSAnQXJyb3dVcCdcbiAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgaWYgKHRoaXMubmFycm93KSByZXR1cm5cbiAgICAgIGNvbnN0IHN0ZXAgPSBiYWNrID8gLTEgOiAxXG4gICAgICBjb25zdCBob3Jpem9udGFsID0gZS5rZXkgPT09ICdBcnJvd0xlZnQnIHx8IGUua2V5ID09PSAnQXJyb3dSaWdodCdcbiAgICAgIHRoaXMuZHJhZnQgPSBudWRnZVNpemUodGhpcy5kcmFmdCwgaWQsIGhvcml6b250YWwgPyBzdGVwIDogMCwgaG9yaXpvbnRhbCA/IDAgOiBzdGVwLCB0aGlzLmRlZnMpXG4gICAgICBjb25zdCB0ID0gdGhpcy5kcmFmdC50aWxlcy5maW5kKHggPT4geC5pZCA9PT0gaWQpXG4gICAgICB0aGlzLnN0YXR1cyA9IHQgPyBgJHt0aGlzLnRpdGxlT2YoaWQpfSBpcyAke3Quc3Bhbn0gY29sdW1ucyB3aWRlIGFuZCAke3Qucm93c30gJHt0LnJvd3MgPT09IDEgPyAncm93JyA6ICdyb3dzJ30gdGFsbC5gIDogJydcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmFmdCA9IG1vdmVCeSh0aGlzLmRyYWZ0LCBpZCwgYmFjayA/IC0xIDogMSlcbiAgICAgIHRoaXMuc3RhdHVzID0gYCR7dGhpcy50aXRsZU9mKGlkKX0gbW92ZWQgdG8gcGxhY2UgJHt0aGlzLmRyYWZ0LnRpbGVzLmZpbmRJbmRleCh0ID0+IHQuaWQgPT09IGlkKSArIDF9IG9mICR7dGhpcy5kcmFmdC50aWxlcy5sZW5ndGh9LmBcbiAgICB9XG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gKHRoaXMuJHJlZnNbYGNlbGwtJHtpZH1gXSBhcyBIVE1MRWxlbWVudFtdIHwgdW5kZWZpbmVkKT8uWzBdPy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignW2RhdGEtdGlkPVwidGlsZS1ncmlwXCJdJyk/LmZvY3VzKCkpXG4gIH1cblxuICAvKiogRWFjaCB0aWxlJ3Mgc2xvdCBvbiBzY3JlZW4sIGluIGxheW91dCBvcmRlci4gU2xvdHMsIG5vdCBkcmF3biBib3hlczogYSB0aWxlIHN0aWxsIHNwcmluZ2luZyBpcyB3aGVyZSBpdCBpcyBnb2luZy4gKi9cbiAgcHJpdmF0ZSBzbG90cyAoKTogU2xvdFtdIHtcbiAgICBjb25zdCBvdXQ6IFNsb3RbXSA9IFtdXG4gICAgZm9yIChjb25zdCB0IG9mIHRoaXMuY3VycmVudC50aWxlcykge1xuICAgICAgY29uc3QgZWwgPSB0aGlzLmNlbGxFbCh0LmlkKVxuICAgICAgY29uc3QgcGFyZW50ID0gZWw/Lm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWRcbiAgICAgIGlmICghZWwgfHwgIXBhcmVudCkgY29udGludWVcbiAgICAgIGNvbnN0IHAgPSBwYXJlbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIG91dC5wdXNoKHsgaWQ6IHQuaWQsIGxlZnQ6IHAubGVmdCArIHBhcmVudC5jbGllbnRMZWZ0ICsgZWwub2Zmc2V0TGVmdCwgdG9wOiBwLnRvcCArIHBhcmVudC5jbGllbnRUb3AgKyBlbC5vZmZzZXRUb3AsIHdpZHRoOiBlbC5vZmZzZXRXaWR0aCwgaGVpZ2h0OiBlbC5vZmZzZXRIZWlnaHQgfSlcbiAgICB9XG4gICAgcmV0dXJuIG91dFxuICB9XG5cbiAgLyoqIFRoZSB0aWxlIHdob3NlIHNsb3QgaXMgdW5kZXIgdGhlIHBvaW50LiAqL1xuICBwcml2YXRlIGNlbGxBdCAoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5zbG90cygpLmZpbmQocyA9PiB4ID49IHMubGVmdCAmJiB4IDwgcy5sZWZ0ICsgcy53aWR0aCAmJiB5ID49IHMudG9wICYmIHkgPCBzLnRvcCArIHMuaGVpZ2h0KT8uaWQgPz8gbnVsbFxuICB9XG5cbiAgLyoqIEZvbGxvd3MgdGhlIHBvaW50ZXIgdW50aWwgaXQgbGlmdHMsIGNhbGxpbmcgYmFjayB3aXRoIGVhY2ggbW92ZSBhbmQgdGhlIGZpbmFsIHBvc2l0aW9uLiAqL1xuICBwcml2YXRlIHRyYWNrIChlOiBQb2ludGVyRXZlbnQsIG9uTW92ZTogKGU6IFBvaW50ZXJFdmVudCkgPT4gdm9pZCwgb25FbmQ6IChlOiBQb2ludGVyRXZlbnQsIGNhbmNlbGxlZDogYm9vbGVhbikgPT4gdm9pZCkge1xuICAgIHRoaXMuc3RvcERyYWc/LigpXG4gICAgY29uc3QgbW92ZSA9IChldjogUG9pbnRlckV2ZW50KSA9PiB7IGlmIChldi5wb2ludGVySWQgPT09IGUucG9pbnRlcklkKSBvbk1vdmUoZXYpIH1cbiAgICBjb25zdCBlbmQgPSAoZXY6IFBvaW50ZXJFdmVudCkgPT4geyBpZiAoZXYucG9pbnRlcklkID09PSBlLnBvaW50ZXJJZCkgeyBzdG9wKCk7IG9uRW5kKGV2LCBldi50eXBlID09PSAncG9pbnRlcmNhbmNlbCcpIH0gfVxuICAgIGNvbnN0IHN0b3AgPSAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBtb3ZlKVxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGVuZClcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgZW5kKVxuICAgICAgdGhpcy5zdG9wRHJhZyA9IG51bGxcbiAgICB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgbW92ZSlcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgZW5kKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgZW5kKVxuICAgIHRoaXMuc3RvcERyYWcgPSAoKSA9PiB7IHN0b3AoKTsgdGhpcy5kcmFnID0gbnVsbCB9XG4gIH1cblxuICBwcml2YXRlIGVkZ2VTY3JvbGwgKHk6IG51bWJlcikge1xuICAgIGlmICh0eXBlb2Ygd2luZG93LnNjcm9sbEJ5ICE9PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICBpZiAoeSA8IDcwKSB3aW5kb3cuc2Nyb2xsQnkoMCwgLTE4KVxuICAgIGVsc2UgaWYgKHkgPiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA3MCkgd2luZG93LnNjcm9sbEJ5KDAsIDE4KVxuICB9XG5cbiAgLyoqXG4gICAqIFBpY2tzIGEgdGlsZSB1cDogaXQgZm9sbG93cyB0aGUgcG9pbnRlciwgYW5kIHRoZSBvdGhlcnMgbW92ZSBvdXQgb2YgdGhlXG4gICAqIHdheSBhcyBpdCBwYXNzZXMgb3ZlciB0aGVtLiBPbiByZWxlYXNlIGl0IHNwcmluZ3MgaW50byB0aGUgZ2FwIGl0IG1hZGUuXG4gICAqL1xuICBzdGFydE1vdmUgKGU6IFBvaW50ZXJFdmVudCwgaWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGVsID0gdGhpcy5jZWxsRWwoaWQpXG4gICAgaWYgKCF0aGlzLmRyYWZ0IHx8ICFlbCB8fCAoZS5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJyAmJiBlLmJ1dHRvbiAhPT0gMCkpIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIDsoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbCk/LnNldFBvaW50ZXJDYXB0dXJlPy4oZS5wb2ludGVySWQpXG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmRyYWZ0XG4gICAgY29uc3QgZnJvbSA9IHsgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgKyB3aW5kb3cuc2Nyb2xsWSwgbGVmdDogZWwub2Zmc2V0TGVmdCwgdG9wOiBlbC5vZmZzZXRUb3AgfVxuICAgIGxldCBsYXN0OiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICAgIGxldCBzaGlmdCA9IHsgeDogMCwgeTogMCB9XG4gICAgLy8gV2hlcmUgdGhlIHRpbGUgaXMgZHJhd246IHVuZGVyIHRoZSBwb2ludGVyLCB3aGVyZXZlciBpdHMgc2xvdCBub3cgaXMgKG9mZnNldHMgaWdub3JlIHRyYW5zZm9ybXMpLlxuICAgIGNvbnN0IGZvbGxvdyA9ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgICAgc2hpZnQgPSB7IHg6IHggLSBmcm9tLnggLSAoZWwub2Zmc2V0TGVmdCAtIGZyb20ubGVmdCksIHk6IHkgKyB3aW5kb3cuc2Nyb2xsWSAtIGZyb20ueSAtIChlbC5vZmZzZXRUb3AgLSBmcm9tLnRvcCkgfVxuICAgICAgZWwuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3NoaWZ0Lnh9cHgsICR7c2hpZnQueX1weClgXG4gICAgfVxuICAgIHRoaXMuZHJhZyA9IHsga2luZDogJ21vdmUnLCBpZCwgb3ZlcjogbnVsbCwgeDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFkgfVxuICAgIHRoaXMudHJhY2soZSwgZXYgPT4ge1xuICAgICAgdGhpcy5lZGdlU2Nyb2xsKGV2LmNsaWVudFkpXG4gICAgICBjb25zdCBvdmVyID0gdGhpcy5jZWxsQXQoZXYuY2xpZW50WCwgZXYuY2xpZW50WSlcbiAgICAgIHRoaXMuZHJhZyA9IHsga2luZDogJ21vdmUnLCBpZCwgb3Zlcjogb3ZlciA9PT0gaWQgPyBudWxsIDogb3ZlciwgeDogZXYuY2xpZW50WCwgeTogZXYuY2xpZW50WSB9XG4gICAgICAvLyBBIHRpbGUgc3RpbGwgc3ByaW5naW5nIHBhc3QgdGhlIHBvaW50ZXIgaXMgdGhlIG9uZSBqdXN0IHBhc3NlZDogaWdub3JlIGl0IHVudGlsIHRoZSBwb2ludGVyIGZpbmRzIGFub3RoZXIuXG4gICAgICBpZiAodGhpcy5kcmFmdCAmJiBvdmVyICYmIG92ZXIgIT09IGlkICYmIG92ZXIgIT09IGxhc3QpIHtcbiAgICAgICAgY29uc3QgdG8gPSB0aGlzLmRyYWZ0LnRpbGVzLmZpbmRJbmRleCh0ID0+IHQuaWQgPT09IG92ZXIpXG4gICAgICAgIGlmICh0byA+PSAwKSB0aGlzLmRyYWZ0ID0gbW92ZVRpbGUodGhpcy5kcmFmdCwgaWQsIHRvKVxuICAgICAgICBsYXN0ID0gb3ZlclxuICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYWZ0ICYmICFvdmVyKSB7XG4gICAgICAgIC8vIE9uIG5vIHRpbGU6IHRoZSBlbXB0eSBlbmQgb2YgYSByb3csIG9yIHBhc3QgdGhlIGxhc3Qgb25lLiBBbnkgcm93IHRha2VzIGl0IChLQU4tMTk1OCkuXG4gICAgICAgIGNvbnN0IHRvID0gZHJvcEluZGV4KHRoaXMuc2xvdHMoKSwgaWQsIGV2LmNsaWVudFgsIGV2LmNsaWVudFkpXG4gICAgICAgIGNvbnN0IGtleSA9IHRvID09PSBudWxsID8gbnVsbCA6IGBnYXA6JHt0b31gXG4gICAgICAgIGlmICh0byAhPT0gbnVsbCAmJiBrZXkgIT09IGxhc3QgJiYgdG8gIT09IHRoaXMuZHJhZnQudGlsZXMuZmluZEluZGV4KHQgPT4gdC5pZCA9PT0gaWQpKSB0aGlzLmRyYWZ0ID0gbW92ZVRpbGUodGhpcy5kcmFmdCwgaWQsIHRvKVxuICAgICAgICBpZiAoa2V5KSBsYXN0ID0ga2V5XG4gICAgICB9XG4gICAgICBmb2xsb3coZXYuY2xpZW50WCwgZXYuY2xpZW50WSlcbiAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHsgaWYgKHRoaXMuZHJhZz8ua2luZCA9PT0gJ21vdmUnICYmIHRoaXMuZHJhZy5pZCA9PT0gaWQpIGZvbGxvdyhldi5jbGllbnRYLCBldi5jbGllbnRZKSB9KVxuICAgIH0sIChfZXYsIGNhbmNlbGxlZCkgPT4ge1xuICAgICAgaWYgKGNhbmNlbGxlZCkgdGhpcy5kcmFmdCA9IHN0YXJ0XG4gICAgICBjb25zdCBhdCA9IHRoaXMuZHJhZnQ/LnRpbGVzLmZpbmRJbmRleCh0ID0+IHQuaWQgPT09IGlkKSA/PyAtMVxuICAgICAgaWYgKCFjYW5jZWxsZWQgJiYgdGhpcy5kcmFmdCAmJiBhdCAhPT0gc3RhcnQudGlsZXMuZmluZEluZGV4KHQgPT4gdC5pZCA9PT0gaWQpKSB0aGlzLnN0YXR1cyA9IGAke3RoaXMudGl0bGVPZihpZCl9IG1vdmVkIHRvIHBsYWNlICR7YXQgKyAxfSBvZiAke3RoaXMuZHJhZnQudGlsZXMubGVuZ3RofS5gXG4gICAgICB0aGlzLmRyYWcgPSBudWxsXG4gICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vdyA9IHNoaWZ0XG4gICAgICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9ICcnXG4gICAgICAgIGlmIChyZWR1Y2VkTW90aW9uKCkgfHwgdHlwZW9mIGVsLmFuaW1hdGUgIT09ICdmdW5jdGlvbicgfHwgKE1hdGguYWJzKG5vdy54KSA8IDEgJiYgTWF0aC5hYnMobm93LnkpIDwgMSkpIHJldHVyblxuICAgICAgICBlbC5hbmltYXRlKHNwcmluZ0tleWZyYW1lcyh7IGR4OiBub3cueCwgZHk6IG5vdy55LCBzeDogMSwgc3k6IDEgfSksIHsgaWQ6IFNQUklORywgZHVyYXRpb246IHNwcmluZ0N1cnZlKCkuZHVyYXRpb24sIGVhc2luZzogJ2xpbmVhcicgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKiBEcmFnZ2luZyB0aGUgY29ybmVyIHJlc2l6ZXMgaW4gd2hvbGUgZ3JpZCBzdGVwcywgdGhlbiBzbmFwcyB0byB0aGUgbmVhcmVzdCBzaXplIHRoZSB3aWRnZXQgb2ZmZXJzLiAqL1xuICBzdGFydFJlc2l6ZSAoZTogUG9pbnRlckV2ZW50LCBpZDogc3RyaW5nKSB7XG4gICAgY29uc3QgZ3JpZCA9IHRoaXMuJHJlZnMuZ3JpZCBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZFxuICAgIGNvbnN0IGNlbGwgPSAodGhpcy4kcmVmc1tgY2VsbC0ke2lkfWBdIGFzIEhUTUxFbGVtZW50W10gfCB1bmRlZmluZWQpPy5bMF1cbiAgICBjb25zdCBmcm9tID0gdGhpcy5kcmFmdD8udGlsZXMuZmluZCh0ID0+IHQuaWQgPT09IGlkKVxuICAgIGlmICghdGhpcy5kcmFmdCB8fCAhZ3JpZCB8fCAhY2VsbCB8fCAhZnJvbSB8fCAoZS5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJyAmJiBlLmJ1dHRvbiAhPT0gMCkpIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIDsoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbCk/LnNldFBvaW50ZXJDYXB0dXJlPy4oZS5wb2ludGVySWQpXG4gICAgY29uc3QgYmFzZSA9IHRoaXMuZHJhZnRcbiAgICBjb25zdCBjb2x1bW4gPSAoZ3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCArIEdSSURfR0FQKSAvIDEyXG4gICAgY29uc3Qgcm93ID0gKGNlbGwub2Zmc2V0SGVpZ2h0ICsgR1JJRF9HQVApIC8gZnJvbS5yb3dzXG4gICAgdGhpcy50cmFjayhlLCBldiA9PiB7XG4gICAgICBpZiAoIWNvbHVtbiB8fCAhcm93KSByZXR1cm5cbiAgICAgIHRoaXMuZWRnZVNjcm9sbChldi5jbGllbnRZKVxuICAgICAgdGhpcy5kcmFmdCA9IHJlc2l6ZVRpbGUoYmFzZSwgaWQsIGZyb20uc3BhbiArIE1hdGgucm91bmQoKGV2LmNsaWVudFggLSBlLmNsaWVudFgpIC8gY29sdW1uKSwgZnJvbS5yb3dzICsgTWF0aC5yb3VuZCgoZXYuY2xpZW50WSAtIGUuY2xpZW50WSkgLyByb3cpLCB0aGlzLmRlZnMpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgY29uc3QgdCA9IHRoaXMuZHJhZnQ/LnRpbGVzLmZpbmQoeCA9PiB4LmlkID09PSBpZClcbiAgICAgIGlmICh0KSB0aGlzLnN0YXR1cyA9IGAke3RoaXMudGl0bGVPZihpZCl9IGlzICR7dC5zcGFufSBjb2x1bW5zIHdpZGUgYW5kICR7dC5yb3dzfSAke3Qucm93cyA9PT0gMSA/ICdyb3cnIDogJ3Jvd3MnfSB0YWxsLmBcbiAgICB9KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuLm92ZXJ2aWV3IHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiAxNnB4OyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyB9XG4ub3ZlcnZpZXdfX2hlYWQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IGdhcDogMTJweDsgbWluLWhlaWdodDogNDRweDsgfVxuLm92ZXJ2aWV3X190aXRsZSB7IG1hcmdpbjogMDsgZm9udC1zaXplOiAyMHB4OyBmb250LXdlaWdodDogNjAwOyB9XG4ub3ZlcnZpZXdfX2FjdGlvbnMgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDhweDsgfVxuLm92ZXJ2aWV3X19idG4ge1xuICBtaW4taGVpZ2h0OiA0MHB4OyBwYWRkaW5nOiAwIDE4cHg7IGJvcmRlci1yYWRpdXM6IDk5OXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IGZvbnQ6IGluaGVyaXQ7IGZvbnQtc2l6ZTogMTRweDsgZm9udC13ZWlnaHQ6IDYwMDsgY3Vyc29yOiBwb2ludGVyO1xuICAmOmhvdmVyIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtMiwgdmFyKC0tbTNkLWZpbGwpKTsgfVxuICAmOmZvY3VzLXZpc2libGUgeyBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWZvY3VzLXJpbmcsIHZhcigtLW0zZC1hY2NlbnQpKTsgb3V0bGluZS1vZmZzZXQ6IDJweDsgfVxuICAmLS1wcmltYXJ5IHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7IGNvbG9yOiB2YXIoLS1tM2Qtb24tYWNjZW50LCAjMDAyMDFlKTsgJjpob3ZlciB7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpOyBmaWx0ZXI6IGJyaWdodG5lc3MoMS4wNik7IH0gfVxufVxuXG4ub3ZlcnZpZXdfX25vdGljZSB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBnYXA6IDEwcHggMTZweDsgbWFyZ2luOiAwOyBwYWRkaW5nOiAxMnB4IDE2cHg7IGJvcmRlci1yYWRpdXM6IDE4cHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCwgdmFyKC0tbTNkLWZpbGwpKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgZm9udC1zaXplOiAxNHB4OyB9XG4ub3ZlcnZpZXdfX2hpbnQgeyBtYXJnaW46IDA7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTNweDsgfVxuLm92ZXJ2aWV3X19jaGlwIHtcbiAgbWluLWhlaWdodDogMzZweDsgcGFkZGluZzogMCAxNHB4OyBib3JkZXItcmFkaXVzOiA5OTlweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyBmb250OiBpbmhlcml0OyBmb250LXNpemU6IDEzLjVweDsgZm9udC13ZWlnaHQ6IDYwMDsgY3Vyc29yOiBwb2ludGVyO1xuICAmLS1vbiB7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCwgdmFyKC0tbTNkLWZpbGwpKTsgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpOyB9XG4gICY6Zm9jdXMtdmlzaWJsZSB7IG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtZm9jdXMtcmluZywgdmFyKC0tbTNkLWFjY2VudCkpOyBvdXRsaW5lLW9mZnNldDogMnB4OyB9XG59XG4ub3ZlcnZpZXdfX3NoZWV0IHsgcG9zaXRpb246IGZpeGVkOyBpbnNldDogMDsgei1pbmRleDogNTA7IGRpc3BsYXk6IGdyaWQ7IHBsYWNlLWl0ZW1zOiBjZW50ZXI7IHBhZGRpbmc6IDE2cHg7IGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC40NSk7IH1cbi5vdmVydmlld19fc2hlZXQtY2FyZCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMTJweDsgd2lkdGg6IG1pbig3NjBweCwgMTAwJSk7IG1heC1oZWlnaHQ6IDg2dmg7IHBhZGRpbmc6IDE4cHg7IGJvcmRlci1yYWRpdXM6IDI2cHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgYm94LXNoYWRvdzogdmFyKC0tbTNkLXNoYWRvdy1mbG9hdCksIGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyk7IG92ZXJmbG93OiBoaWRkZW47IH1cbi5vdmVydmlld19fc2hlZXQtaGVhZCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgYiB7IGZvbnQtc2l6ZTogMTdweDsgZm9udC13ZWlnaHQ6IDYwMDsgfSB9XG4ub3ZlcnZpZXdfX3NlYXJjaCB7IG1pbi1oZWlnaHQ6IDQwcHg7IHBhZGRpbmc6IDAgMTRweDsgYm9yZGVyLXJhZGl1czogMTJweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyBmb250OiBpbmhlcml0OyBmb250LXNpemU6IDE0cHg7IH1cbi5vdmVydmlld19fY2F0cyB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgZ2FwOiA4cHg7IH1cbi5vdmVydmlld19fY2FyZHMgeyBkaXNwbGF5OiBncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCBtaW5tYXgoMCwgMWZyKSk7IGdhcDogMTBweDsgbWFyZ2luOiAwOyBwYWRkaW5nOiAwOyBsaXN0LXN0eWxlOiBub25lOyBvdmVyZmxvdy15OiBhdXRvOyB9XG4ub3ZlcnZpZXdfX2NhcmQgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDZweDsgcGFkZGluZzogMTJweCAxNHB4OyBib3JkZXItcmFkaXVzOiAxOHB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7IH1cbi5vdmVydmlld19fY2FyZCBwIHsgbWFyZ2luOiAwOyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXNpemU6IDEyLjVweDsgfVxuLm92ZXJ2aWV3X19jYXJkLXRvcCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBiYXNlbGluZTsgZ2FwOiA4cHg7IGIgeyBmb250LXNpemU6IDE1cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IH0gfVxuLm92ZXJ2aWV3X19jYXJkLWNhdCB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyBmb250LXNpemU6IDEycHg7IH1cbi5vdmVydmlld19fcG0geyBkaXNwbGF5OiBncmlkOyBwbGFjZS1pdGVtczogY2VudGVyOyB3aWR0aDogMzJweDsgaGVpZ2h0OiAzMnB4OyBtYXJnaW4tbGVmdDogYXV0bzsgcGFkZGluZzogMDsgYm9yZGVyOiAwOyBib3JkZXItcmFkaXVzOiA5OTlweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtMik7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQ6IGluaGVyaXQ7IGZvbnQtc2l6ZTogMjBweDsgbGluZS1oZWlnaHQ6IDE7IGN1cnNvcjogcG9pbnRlcjsgfVxuLm92ZXJ2aWV3X19wbTpob3ZlciB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IH1cbi5vdmVydmlld19fcG06Zm9jdXMtdmlzaWJsZSB7IG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtYWNjZW50KTsgb3V0bGluZS1vZmZzZXQ6IDJweDsgfVxuLm92ZXJ2aWV3X19jYXJkLWFjdCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgZ2FwOiA4cHg7IG1hcmdpbi10b3A6IGF1dG87IH1cbi5vdmVydmlld19fc2l6ZXMgeyBkaXNwbGF5OiBpbmxpbmUtZmxleDsgZ2FwOiA0cHg7IH1cbi5vdmVydmlld19fc2l6ZSB7XG4gIG1pbi13aWR0aDogMzZweDsgbWluLWhlaWdodDogMzZweDsgYm9yZGVyLXJhZGl1czogMTBweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtMiwgdmFyKC0tbTNkLXN1cmZhY2UpKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgZm9udDogaW5oZXJpdDsgZm9udC1zaXplOiAxM3B4OyBmb250LXdlaWdodDogNjAwOyBjdXJzb3I6IHBvaW50ZXI7XG4gICYtLW9uIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7IGNvbG9yOiB2YXIoLS1tM2Qtb24tYWNjZW50LCAjMDAyMDFlKTsgfVxufVxuLm92ZXJ2aWV3X19ub25lIHsgZ3JpZC1jb2x1bW46IDEgLyAtMTsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgdGV4dC1hbGlnbjogY2VudGVyOyB9XG5AbWVkaWEgKG1heC13aWR0aDogNTk5cHgpIHtcbiAgLyogVGhlIHRhYiBiYXIgc2l0cyBhYm92ZSB0aGUgcGFnZSdzIGxheWVyLCBzbyB0aGUgc2hlZXQgc3RvcHMgYWJvdmUgaXQgcmF0aGVyIHRoYW4gdW5kZXIgaXQuICovXG4gIC5vdmVydmlld19fc2hlZXQgeyBwbGFjZS1pdGVtczogZW5kIGNlbnRlcjsgcGFkZGluZzogMCAwIGNhbGMoNzZweCArIGVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKSk7IH1cbiAgLm92ZXJ2aWV3X19zaGVldC1jYXJkIHsgd2lkdGg6IDEwMCU7IG1heC1oZWlnaHQ6IGNhbGMoODZ2aCAtIDc2cHgpOyBib3JkZXItcmFkaXVzOiAyNnB4OyB9XG4gIC5vdmVydmlld19fY2FyZHMgeyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IG1pbm1heCgwLCAxZnIpOyB9XG59XG5cbi5vdmVydmlld19fZ3JpZCB7IGRpc3BsYXk6IGdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDEyLCBtaW5tYXgoMCwgMWZyKSk7IGdhcDogMTZweDsgYWxpZ24taXRlbXM6IHN0cmV0Y2g7IH1cbi5vdmVydmlld19fY2VsbCB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgZGlzcGxheTogZmxleDsgZ3JpZC1jb2x1bW46IHNwYW4gdmFyKC0tc3Bhbik7IGdyaWQtcm93OiBzcGFuIHZhcigtLXJvd3MpOyBtaW4td2lkdGg6IDA7IH1cbi8qIE5vcm1hbGx5IHRoZSB3cmFwcGVyIHRha2VzIG5vIHBhcnQgaW4gbGF5b3V0OiB0aGUgdGlsZSBpcyB0aGUgY2VsbCdzIG9ubHkgY2hpbGQsIGFzIGl0IGFsd2F5cyB3YXMuICovXG4ub3ZlcnZpZXdfX2JvZHkgeyBkaXNwbGF5OiBjb250ZW50czsgfVxuLm92ZXJ2aWV3X19ib2R5ID4gKiB7IGZsZXg6IDEgMSBhdXRvOyBtaW4td2lkdGg6IDA7IH1cbi5vdmVydmlld19fZW1wdHkgeyBncmlkLWNvbHVtbjogMSAvIC0xOyBtYXJnaW46IDA7IHBhZGRpbmc6IDI0cHg7IGJvcmRlci1yYWRpdXM6IDIycHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgdGV4dC1hbGlnbjogY2VudGVyOyB9XG5cbi8qIEVkaXQgbW9kZTogdGhlIHRpbGUgaXMgYSBwaWN0dXJlIHdpdGggaGFuZGxlcyBvbiBpdC4gKi9cbi5vdmVydmlldy0tZWRpdCAub3ZlcnZpZXdfX2JvZHkgeyBkaXNwbGF5OiBmbGV4OyBmbGV4OiAxIDEgYXV0bzsgbWluLXdpZHRoOiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgdXNlci1zZWxlY3Q6IG5vbmU7IH1cbi5vdmVydmlldy0tZWRpdCAub3ZlcnZpZXdfX2JvZHkgOmRlZXAoLnRtKSB7IHZpc2liaWxpdHk6IGhpZGRlbjsgfVxuLm92ZXJ2aWV3LS1lZGl0IC5vdmVydmlld19fYm9keSA6ZGVlcCgub3RfX2hlYWQpIHsgcGFkZGluZy1sZWZ0OiAzMHB4OyB9XG4vKiBUaGUgM0QgdmlldydzIG93biBjb3JuZXIgcGllY2VzIHN0ZXAgYXNpZGUgZm9yIHRoZSBncmlwIGFuZCB0aGUgcmVtb3ZlIGJ1dHRvbi4gKi9cbi5vdmVydmlldy0tZWRpdCAub3ZlcnZpZXdfX2JvZHkgOmRlZXAoLm92LXN0YWdlX19iYWRnZSkgeyBsZWZ0OiA1MHB4OyB9XG4ub3ZlcnZpZXctLWVkaXQgLm92ZXJ2aWV3X19ib2R5IDpkZWVwKC5zdF9fc2VnKSB7IHJpZ2h0OiA1MHB4OyB9XG4ub3ZlcnZpZXctLWVkaXQgLm92ZXJ2aWV3X19jZWxsOjphZnRlciB7XG4gIGNvbnRlbnQ6ICcnOyBwb3NpdGlvbjogYWJzb2x1dGU7IGluc2V0OiAwOyB6LWluZGV4OiA0OyBib3JkZXItcmFkaXVzOiAyMnB4OyBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMS41cHggY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1hY2NlbnQpIDU1JSwgdHJhbnNwYXJlbnQpO1xufVxuLyogQSBib3ggc2hhZG93LCBub3QgYSBmaWx0ZXI6IGEgZmlsdGVyIHJlLWRyYXdzIHRoZSB3aG9sZSB0aWxlICh0aGUgM0QgdmlldyB0b28pIG9uIGV2ZXJ5IHBvaW50ZXIgbW92ZS4gKi9cbi5vdmVydmlld19fY2VsbC0tbW92aW5nIHsgei1pbmRleDogNjsgcG9pbnRlci1ldmVudHM6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDIycHg7IGJveC1zaGFkb3c6IDAgMTRweCAyOHB4IHJnYigwIDAgMCAvIDIyJSk7IH1cbi5vdmVydmlld19fY2VsbC0tb3Zlcjo6YWZ0ZXIgeyBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAzcHggdmFyKC0tbTNkLWFjY2VudCkgIWltcG9ydGFudDsgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1hY2NlbnQpIDEwJSwgdHJhbnNwYXJlbnQpOyB9XG4ub3ZlcnZpZXdfX2dyaXAge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTRweDsgbGVmdDogMTJweDsgei1pbmRleDogNTsgZGlzcGxheTogZ3JpZDsgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMiwgNHB4KTsgZ2FwOiAzcHg7IHBhZGRpbmc6IDZweCA1cHg7IGJvcmRlci1yYWRpdXM6IDhweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpOyBjdXJzb3I6IGdyYWI7IHRvdWNoLWFjdGlvbjogbm9uZTtcbiAgaSB7IHdpZHRoOiA0cHg7IGhlaWdodDogNHB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuICAmOmhvdmVyLCAmOmZvY3VzLXZpc2libGUgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQsIHZhcigtLW0zZC1maWxsLTIpKTsgfVxuICAmOmZvY3VzLXZpc2libGUgeyBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWZvY3VzLXJpbmcsIHZhcigtLW0zZC1hY2NlbnQpKTsgb3V0bGluZS1vZmZzZXQ6IDJweDsgfVxufVxuLm92ZXJ2aWV3X19yZW1vdmUge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTJweDsgcmlnaHQ6IDEycHg7IHotaW5kZXg6IDU7IGRpc3BsYXk6IGdyaWQ7IHBsYWNlLWl0ZW1zOiBjZW50ZXI7IHdpZHRoOiAzMHB4OyBoZWlnaHQ6IDMwcHg7IGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyBmb250LXNpemU6IDIwcHg7IGxpbmUtaGVpZ2h0OiAxOyBjdXJzb3I6IHBvaW50ZXI7XG4gICY6aG92ZXIgeyBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMTglLCB0cmFuc3BhcmVudCk7IGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTsgfVxuICAmOmZvY3VzLXZpc2libGUgeyBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWZvY3VzLXJpbmcsIHZhcigtLW0zZC1hY2NlbnQpKTsgb3V0bGluZS1vZmZzZXQ6IDJweDsgfVxufVxuLm92ZXJ2aWV3X19yZXNpemUge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7IHJpZ2h0OiA4cHg7IGJvdHRvbTogOHB4OyB6LWluZGV4OiA1OyB3aWR0aDogMjJweDsgaGVpZ2h0OiAyMnB4OyBib3JkZXItcmFkaXVzOiA2cHg7IGN1cnNvcjogbndzZS1yZXNpemU7IHRvdWNoLWFjdGlvbjogbm9uZTtcbiAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgdHJhbnNwYXJlbnQgMCA0OCUsIHZhcigtLW0zZC1hY2NlbnQpIDQ4JSA1NiUsIHRyYW5zcGFyZW50IDU2JSA2NiUsIHZhcigtLW0zZC1hY2NlbnQpIDY2JSA3NCUsIHRyYW5zcGFyZW50IDc0JSk7XG59XG4ub3ZlcnZpZXdfX3NyIHsgcG9zaXRpb246IGFic29sdXRlOyB3aWR0aDogMXB4OyBoZWlnaHQ6IDFweDsgbWFyZ2luOiAtMXB4OyBwYWRkaW5nOiAwOyBvdmVyZmxvdzogaGlkZGVuOyBjbGlwOiByZWN0KDAgMCAwIDApOyB3aGl0ZS1zcGFjZTogbm93cmFwOyBib3JkZXI6IDA7IH1cblxuQG1lZGlhIChtYXgtd2lkdGg6IDEwOTlweCkge1xuICAub3ZlcnZpZXdfX2NlbGwgeyBncmlkLWNvbHVtbjogc3BhbiB2YXIoLS10YWJsZXQpOyBncmlkLXJvdzogYXV0bzsgfVxufVxuQG1lZGlhIChtYXgtd2lkdGg6IDU5OXB4KSB7XG4gIC5vdmVydmlld19fZ3JpZCB7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDIsIG1pbm1heCgwLCAxZnIpKTsgZ2FwOiAxMnB4OyB9XG4gIC5vdmVydmlld19fY2VsbCB7IGdyaWQtY29sdW1uOiBzcGFuIHZhcigtLXBob25lKTsgfVxufVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy92aWV3cy9PdmVydmlldy52dWUifQ==