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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { createGraph } from "/src/services/charts/engine.ts";
import { buildGraphOption } from "/src/services/charts/graph-option.ts";
import { SeriesRing } from "/src/services/charts/ring.ts";
import { discoverSeries, GROUP_ORDER, isSeriesOn } from "/src/services/charts/series.ts";
const TICK_MS = 1e3;
const live = /* @__PURE__ */ new WeakMap();
let ThermalGraph = class extends Vue {
  windowSeconds;
  events;
  height;
  phone;
  /** Changes only when the printer gains or loses a heater, sensor or fan. */
  defs = [];
  expanded = false;
  get selected() {
    return this.$store.getters["charts/getSelectedLegends"] ?? {};
  }
  get dark() {
    return !!this.$store.state.config?.uiSettings?.theme?.isDark;
  }
  /** The lines on, until "N more" is opened: then every line the printer has. */
  get chips() {
    if (this.expanded) return this.defs;
    return this.defs.filter((d) => isSeriesOn(d, this.selected));
  }
  /** The legend by part of the printer, in the graph's own order. */
  get groups() {
    return GROUP_ORDER.map((name) => ({ name, chips: this.chips.filter((d) => d.group === name) })).filter((g) => g.chips.length);
  }
  get extra() {
    return this.defs.length - this.chips.length;
  }
  clock(at) {
    return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  isOn(def) {
    return isSeriesOn(def, this.selected);
  }
  toggle(def) {
    this.$store.dispatch("charts/saveSelectedLegends", { ...this.selected, [def.key]: !this.isOn(def) });
  }
  created() {
    const retention = Number(this.$store.getters["charts/getChartRetention"]) || 1200;
    const state = { ring: new SeriesRing(Math.ceil(retention) + 60), handle: null, timer: null, unsubscribe: null, resizer: null, observer: null, inView: true, destroyed: false, pending: null, signature: "" };
    live.set(this, state);
    state.ring.seed(this.$store.getters["charts/getChartData"] ?? []);
    state.unsubscribe = this.$store.subscribe((mutation) => {
      if (mutation.type === "charts/setChartEntry") {
        if (mutation.payload?.type === "chart") state.ring.push(mutation.payload.data);
      } else if (mutation.type === "charts/setChartStore") state.ring.seed(mutation.payload ?? []);
      else if (mutation.type === "charts/setReset") state.ring.clear();
    });
    this.refreshDefs();
  }
  mounted() {
    const state = live.get(this);
    createGraph(this.$refs.plot).then((handle) => {
      if (state.destroyed) {
        handle.dispose();
        return;
      }
      state.handle = handle;
      this.draw();
    }).catch(() => {
    });
    state.timer = window.setInterval(() => this.tick(), TICK_MS);
    document.addEventListener("visibilitychange", this.onVisibility);
    if (typeof IntersectionObserver !== "undefined") {
      state.observer = new IntersectionObserver((entries) => {
        const was = this.shouldDraw();
        state.inView = entries[entries.length - 1]?.isIntersecting !== false;
        if (!was && this.shouldDraw()) this.tick();
      });
      state.observer.observe(this.$el);
    }
    if (typeof ResizeObserver !== "undefined") {
      state.resizer = new ResizeObserver(() => {
        state.handle?.resize();
        this.scheduleDraw();
      });
      state.resizer.observe(this.$refs.plot);
    }
    this.paintValues();
  }
  updated() {
    this.paintValues();
  }
  beforeDestroy() {
    const state = live.get(this);
    if (!state) return;
    state.destroyed = true;
    if (state.timer !== null) window.clearInterval(state.timer);
    if (state.pending !== null) window.clearTimeout(state.pending);
    state.unsubscribe?.();
    state.resizer?.disconnect();
    state.observer?.disconnect();
    state.handle?.dispose();
    document.removeEventListener("visibilitychange", this.onVisibility);
    live.delete(this);
  }
  scheduleDraw() {
    const state = live.get(this);
    if (!state || state.pending !== null) return;
    state.pending = window.setTimeout(() => {
      state.pending = null;
      this.draw();
    }, 0);
  }
  shouldDraw() {
    return document.visibilityState !== "hidden" && live.get(this)?.inView !== false;
  }
  onVisibility() {
    if (this.shouldDraw()) this.tick();
  }
  /** Once a second: look for new objects, refresh the numbers, redraw. */
  tick() {
    if (!this.shouldDraw()) return;
    this.refreshDefs();
    this.paintValues();
    this.draw();
  }
  /** Replaces the series list only when the printer's objects actually changed. */
  refreshDefs() {
    const state = live.get(this);
    if (!state) return;
    const next = discoverSeries(this.$store.state.printer.printer);
    const signature = next.map((d) => d.key).join("|");
    if (signature === state.signature) return;
    state.signature = signature;
    this.defs = Object.freeze(next);
  }
  draw() {
    const state = live.get(this);
    if (!state?.handle || !this.shouldDraw()) return;
    const to = Date.now();
    const from = to - this.windowSeconds * 1e3;
    const width = Math.max(120, this.$refs.plot.clientWidth || 600);
    const lines = [];
    for (const def of this.defs) {
      if (!this.isOn(def)) continue;
      const line = { def, points: state.ring.extract(def.key, from, to, width, def.scale) };
      if (def.targetKey) line.targetPoints = state.ring.extract(def.targetKey, from, to, width).filter((p) => p[1] > 0);
      lines.push(line);
    }
    state.handle.setOption(buildGraphOption({ lines, from, to, dark: this.dark, markers: this.events, phone: this.phone }));
  }
  /** Writes the current numbers into the legend directly, so a reading never re-renders the component. */
  paintValues() {
    const printer = this.$store.state.printer.printer;
    const cells = this.$el?.querySelectorAll?.("[data-val]");
    if (!cells) return;
    const byKey = new Map(this.defs.map((d) => [d.key, d]));
    cells.forEach((cell) => {
      const def = byKey.get(cell.getAttribute("data-val") ?? "");
      if (!def) return;
      const object = printer[def.object];
      const value = object?.[def.field];
      let text = "";
      if (typeof value === "number" && Number.isFinite(value)) {
        if (def.unit === "%") text = `${Math.round(value * def.scale)}%`;
        else {
          text = `${value.toFixed(1)}\xB0`;
          const target = def.targetKey ? object?.target : void 0;
          if (typeof target === "number" && target > 0) text += ` / ${Math.round(target)}\xB0`;
        }
      }
      if (cell.textContent !== text) cell.textContent = text;
    });
  }
};
__decorateClass([
  Prop({ type: Number, default: 1200 })
], ThermalGraph.prototype, "windowSeconds", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], ThermalGraph.prototype, "events", 2);
__decorateClass([
  Prop({ type: Number, default: 220 })
], ThermalGraph.prototype, "height", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], ThermalGraph.prototype, "phone", 2);
__decorateClass([
  Watch("windowSeconds"),
  Watch("events"),
  Watch("selected"),
  Watch("dark"),
  Watch("defs"),
  Watch("phone")
], ThermalGraph.prototype, "scheduleDraw", 1);
ThermalGraph = __decorateClass([
  Component({ name: "ThermalGraph" })
], ThermalGraph);
const _sfc_main = ThermalGraph;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "tg", attrs: { "data-tid": "thermal-graph" } }, [_c("div", { ref: "plot", staticClass: "tg__plot", style: { height: `${_vm.height}px` }, attrs: { "role": "img", "aria-label": "Temperature history. Hover or touch the graph for exact readings." } }), _c("div", { staticClass: "tg__legend", attrs: { "role": "group", "aria-label": "Temperature series" } }, [_vm._l(_vm.groups, function(g) {
    return _c("div", { key: g.name, staticClass: "tg__group", attrs: { "data-group": g.name } }, [_c("span", { staticClass: "tg__group-name" }, [_vm._v(_vm._s(g.name))]), _vm._l(g.chips, function(s) {
      return _c("button", { key: s.key, staticClass: "tg__chip", class: { off: !_vm.isOn(s) }, attrs: { "type": "button", "data-legend": s.key, "aria-pressed": _vm.isOn(s) ? "true" : "false", "title": `${s.group}: ${_vm.isOn(s) ? "click to hide" : "click to show"}` }, on: { "click": function($event) {
        return _vm.toggle(s);
      } } }, [_c("i", { staticClass: "tg__swatch", class: { dotted: s.kind !== "temp" }, style: { "--tg-color": s.color } }), _c("span", { staticClass: "tg__name" }, [_vm._v(_vm._s(s.label))]), _c("span", { staticClass: "tg__val", attrs: { "data-val": s.key } })]);
    })], 2);
  }), _vm.extra > 0 || _vm.expanded ? _c("button", { staticClass: "tg__more", attrs: { "type": "button", "data-tid": "legend-more", "aria-expanded": _vm.expanded ? "true" : "false" }, on: { "click": function($event) {
    _vm.expanded = !_vm.expanded;
  } } }, [_vm._v(" " + _vm._s(_vm.expanded ? "Fewer" : `${_vm.extra} more`) + " ")]) : _vm._e()], 2), _vm.events.length ? _c("details", { staticClass: "tg__events" }, [_c("summary", [_vm._v("Observed markers (" + _vm._s(_vm.events.length) + ")")]), _c("ul", _vm._l(_vm.events, function(event, index) {
    return _c("li", { key: index, attrs: { "data-event": event.label } }, [_vm._v(" " + _vm._s(_vm.clock(event.at)) + " \uFFFD " + _vm._s(event.label) + " ")]);
  }), 0)]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/charts/ThermalGraph.vue?vue&type=style&index=0&scoped=3d994ef7&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3d994ef7",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/charts/ThermalGraph.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFtQkE7QUFRQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0EsdUJBQ0EsNkVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUEsZUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBUUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsYUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBcEtBO0FBQUE7QUFBQSxHQURBLGFBQ0E7QUFDQTtBQUFBO0FBQUEsR0FGQSxhQUVBO0FBQ0E7QUFBQTtBQUFBLEdBSEEsYUFHQTtBQUNBO0FBQUE7QUFBQSxHQUpBLGFBSUE7QUEwRkE7QUFBQSxFQU5BO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxHQTdGQSxhQThGQTtBQTlGQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJUaGVybWFsR3JhcGgudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwidGdcIlxuICAgIGRhdGEtdGlkPVwidGhlcm1hbC1ncmFwaFwiXG4gID5cbiAgICA8ZGl2XG4gICAgICByZWY9XCJwbG90XCJcbiAgICAgIGNsYXNzPVwidGdfX3Bsb3RcIlxuICAgICAgOnN0eWxlPVwieyBoZWlnaHQ6IGAke2hlaWdodH1weGAgfVwiXG4gICAgICByb2xlPVwiaW1nXCJcbiAgICAgIGFyaWEtbGFiZWw9XCJUZW1wZXJhdHVyZSBoaXN0b3J5LiBIb3ZlciBvciB0b3VjaCB0aGUgZ3JhcGggZm9yIGV4YWN0IHJlYWRpbmdzLlwiXG4gICAgLz5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cInRnX19sZWdlbmRcIlxuICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgIGFyaWEtbGFiZWw9XCJUZW1wZXJhdHVyZSBzZXJpZXNcIlxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJnIGluIGdyb3Vwc1wiXG4gICAgICAgIDprZXk9XCJnLm5hbWVcIlxuICAgICAgICBjbGFzcz1cInRnX19ncm91cFwiXG4gICAgICAgIDpkYXRhLWdyb3VwPVwiZy5uYW1lXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJ0Z19fZ3JvdXAtbmFtZVwiPnt7IGcubmFtZSB9fTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtZm9yPVwicyBpbiBnLmNoaXBzXCJcbiAgICAgICAgICA6a2V5PVwicy5rZXlcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwidGdfX2NoaXBcIlxuICAgICAgICAgIDpjbGFzcz1cInsgb2ZmOiAhaXNPbihzKSB9XCJcbiAgICAgICAgICA6ZGF0YS1sZWdlbmQ9XCJzLmtleVwiXG4gICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImlzT24ocykgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICA6dGl0bGU9XCJgJHtzLmdyb3VwfTogJHtpc09uKHMpID8gJ2NsaWNrIHRvIGhpZGUnIDogJ2NsaWNrIHRvIHNob3cnfWBcIlxuICAgICAgICAgIEBjbGljaz1cInRvZ2dsZShzKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8aVxuICAgICAgICAgICAgY2xhc3M9XCJ0Z19fc3dhdGNoXCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgZG90dGVkOiBzLmtpbmQgIT09ICd0ZW1wJyB9XCJcbiAgICAgICAgICAgIDpzdHlsZT1cInsgJy0tdGctY29sb3InOiBzLmNvbG9yIH1cIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0Z19fbmFtZVwiPnt7IHMubGFiZWwgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGNsYXNzPVwidGdfX3ZhbFwiXG4gICAgICAgICAgICA6ZGF0YS12YWw9XCJzLmtleVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cImV4dHJhID4gMCB8fCBleHBhbmRlZFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cInRnX19tb3JlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJsZWdlbmQtbW9yZVwiXG4gICAgICAgIDphcmlhLWV4cGFuZGVkPVwiZXhwYW5kZWQgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgQGNsaWNrPVwiZXhwYW5kZWQgPSAhZXhwYW5kZWRcIlxuICAgICAgPlxuICAgICAgICB7eyBleHBhbmRlZCA/ICdGZXdlcicgOiBgJHtleHRyYX0gbW9yZWAgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkZXRhaWxzXG4gICAgICB2LWlmPVwiZXZlbnRzLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cInRnX19ldmVudHNcIlxuICAgID5cbiAgICAgIDxzdW1tYXJ5Pk9ic2VydmVkIG1hcmtlcnMgKHt7IGV2ZW50cy5sZW5ndGggfX0pPC9zdW1tYXJ5PlxuICAgICAgPHVsPlxuICAgICAgICA8bGlcbiAgICAgICAgICB2LWZvcj1cIihldmVudCwgaW5kZXgpIGluIGV2ZW50c1wiXG4gICAgICAgICAgOmtleT1cImluZGV4XCJcbiAgICAgICAgICA6ZGF0YS1ldmVudD1cImV2ZW50LmxhYmVsXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IGNsb2NrKGV2ZW50LmF0KSB9fSDvv70ge3sgZXZlbnQubGFiZWwgfX1cbiAgICAgICAgPC9saT5cbiAgICAgIDwvdWw+XG4gICAgPC9kZXRhaWxzPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgY3JlYXRlR3JhcGgsIHR5cGUgR3JhcGhIYW5kbGUgfSBmcm9tICdAL3NlcnZpY2VzL2NoYXJ0cy9lbmdpbmUnXG5pbXBvcnQgeyBidWlsZEdyYXBoT3B0aW9uLCB0eXBlIEdyYXBoTGluZSB9IGZyb20gJ0Avc2VydmljZXMvY2hhcnRzL2dyYXBoLW9wdGlvbidcbmltcG9ydCB7IFNlcmllc1JpbmcgfSBmcm9tICdAL3NlcnZpY2VzL2NoYXJ0cy9yaW5nJ1xuaW1wb3J0IHsgZGlzY292ZXJTZXJpZXMsIEdST1VQX09SREVSLCBpc1Nlcmllc09uLCB0eXBlIFNlcmllc0RlZiwgdHlwZSBTZXJpZXNTZWxlY3Rpb24gfSBmcm9tICdAL3NlcnZpY2VzL2NoYXJ0cy9zZXJpZXMnXG5cbi8qKiBUaGUgZ3JhcGggcmVkcmF3cyBhbmQgdGhlIGxlZ2VuZCByZWZyZXNoZXMgdGhpcyBvZnRlbiwgaG93ZXZlciBmYXN0IEtsaXBwZXIgcmVwb3J0cy4gKi9cbmNvbnN0IFRJQ0tfTVMgPSAxMDAwXG5cbmludGVyZmFjZSBMaXZlIHtcbiAgcmluZzogU2VyaWVzUmluZ1xuICBoYW5kbGU6IEdyYXBoSGFuZGxlIHwgbnVsbFxuICB0aW1lcjogbnVtYmVyIHwgbnVsbFxuICB1bnN1YnNjcmliZTogKCgpID0+IHZvaWQpIHwgbnVsbFxuICByZXNpemVyOiBSZXNpemVPYnNlcnZlciB8IG51bGxcbiAgb2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyIHwgbnVsbFxuICBpblZpZXc6IGJvb2xlYW5cbiAgZGVzdHJveWVkOiBib29sZWFuXG4gIHBlbmRpbmc6IG51bWJlciB8IG51bGxcbiAgc2lnbmF0dXJlOiBzdHJpbmdcbn1cblxuLyoqXG4gKiBFdmVyeXRoaW5nIHRoYXQgY2hhbmdlcyBldmVyeSBzZWNvbmQgbGl2ZXMgaGVyZSwgb3V0c2lkZSBWdWUncyByZWFjdGl2aXR5LCBzb1xuICogYSBzdGF0dXMgdXBkYXRlLCBhIG5ldyBzYW1wbGUgb3IgYSByZWRyYXcgbmV2ZXIgcmUtcmVuZGVycyB0aGUgY29tcG9uZW50LlxuICovXG5jb25zdCBsaXZlID0gbmV3IFdlYWtNYXA8VnVlLCBMaXZlPigpXG5cbi8qKlxuICogVGhlIHRlbXBlcmF0dXJlIGdyYXBoOiBhIGNhbnZhcyBsaW5lIGNoYXJ0IG9mIGV2ZXJ5IGhlYXRlciwgc2Vuc29yIGFuZCBmYW4gdGhlXG4gKiBwcmludGVyIHJlcG9ydHMsIHdpdGggYSBsZWdlbmQgdGhhdCBzaG93cyBlYWNoIG9uZSdzIGN1cnJlbnQgYW5kIHRhcmdldCB2YWx1ZVxuICogYW5kIGxldHMgcGVvcGxlIGhpZGUgb3Igc2hvdyBpdC4gQ2hvaWNlcyBhcmUgcmVtZW1iZXJlZCB3aXRoIHRoZSBjaGFydCBzZXR0aW5ncy5cbiAqL1xuQENvbXBvbmVudCh7IG5hbWU6ICdUaGVybWFsR3JhcGgnIH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaGVybWFsR3JhcGggZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMTIwMCB9KSByZWFkb25seSB3aW5kb3dTZWNvbmRzITogbnVtYmVyXG4gIEBQcm9wKHsgdHlwZTogQXJyYXksIGRlZmF1bHQ6ICgpID0+IFtdIH0pIHJlYWRvbmx5IGV2ZW50cyE6IEFycmF5PHsgYXQ6IG51bWJlciwgbGFiZWw6IHN0cmluZyB9PlxuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMjIwIH0pIHJlYWRvbmx5IGhlaWdodCE6IG51bWJlclxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IGZhbHNlIH0pIHJlYWRvbmx5IHBob25lITogYm9vbGVhblxuXG4gIC8qKiBDaGFuZ2VzIG9ubHkgd2hlbiB0aGUgcHJpbnRlciBnYWlucyBvciBsb3NlcyBhIGhlYXRlciwgc2Vuc29yIG9yIGZhbi4gKi9cbiAgZGVmczogU2VyaWVzRGVmW10gPSBbXVxuICBleHBhbmRlZCA9IGZhbHNlXG5cbiAgZ2V0IHNlbGVjdGVkICgpOiBTZXJpZXNTZWxlY3Rpb24geyByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NoYXJ0cy9nZXRTZWxlY3RlZExlZ2VuZHMnXSA/PyB7fSkgYXMgU2VyaWVzU2VsZWN0aW9uIH1cbiAgZ2V0IGRhcmsgKCk6IGJvb2xlYW4geyByZXR1cm4gISF0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWc/LnVpU2V0dGluZ3M/LnRoZW1lPy5pc0RhcmsgfVxuXG4gIC8qKiBUaGUgbGluZXMgb24sIHVudGlsIFwiTiBtb3JlXCIgaXMgb3BlbmVkOiB0aGVuIGV2ZXJ5IGxpbmUgdGhlIHByaW50ZXIgaGFzLiAqL1xuICBnZXQgY2hpcHMgKCk6IFNlcmllc0RlZltdIHtcbiAgICBpZiAodGhpcy5leHBhbmRlZCkgcmV0dXJuIHRoaXMuZGVmc1xuICAgIHJldHVybiB0aGlzLmRlZnMuZmlsdGVyKGQgPT4gaXNTZXJpZXNPbihkLCB0aGlzLnNlbGVjdGVkKSlcbiAgfVxuXG4gIC8qKiBUaGUgbGVnZW5kIGJ5IHBhcnQgb2YgdGhlIHByaW50ZXIsIGluIHRoZSBncmFwaCdzIG93biBvcmRlci4gKi9cbiAgZ2V0IGdyb3VwcyAoKTogQXJyYXk8eyBuYW1lOiBzdHJpbmcsIGNoaXBzOiBTZXJpZXNEZWZbXSB9PiB7XG4gICAgcmV0dXJuIEdST1VQX09SREVSXG4gICAgICAubWFwKG5hbWUgPT4gKHsgbmFtZSwgY2hpcHM6IHRoaXMuY2hpcHMuZmlsdGVyKGQgPT4gZC5ncm91cCA9PT0gbmFtZSkgfSkpXG4gICAgICAuZmlsdGVyKGcgPT4gZy5jaGlwcy5sZW5ndGgpXG4gIH1cblxuICBnZXQgZXh0cmEgKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmRlZnMubGVuZ3RoIC0gdGhpcy5jaGlwcy5sZW5ndGggfVxuXG4gIGNsb2NrIChhdDogbnVtYmVyKTogc3RyaW5nIHsgcmV0dXJuIG5ldyBEYXRlKGF0KS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0Jywgc2Vjb25kOiAnMi1kaWdpdCcgfSkgfVxuXG4gIGlzT24gKGRlZjogU2VyaWVzRGVmKTogYm9vbGVhbiB7IHJldHVybiBpc1Nlcmllc09uKGRlZiwgdGhpcy5zZWxlY3RlZCkgfVxuXG4gIHRvZ2dsZSAoZGVmOiBTZXJpZXNEZWYpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY2hhcnRzL3NhdmVTZWxlY3RlZExlZ2VuZHMnLCB7IC4uLnRoaXMuc2VsZWN0ZWQsIFtkZWYua2V5XTogIXRoaXMuaXNPbihkZWYpIH0pXG4gIH1cblxuICBjcmVhdGVkICgpIHtcbiAgICBjb25zdCByZXRlbnRpb24gPSBOdW1iZXIodGhpcy4kc3RvcmUuZ2V0dGVyc1snY2hhcnRzL2dldENoYXJ0UmV0ZW50aW9uJ10pIHx8IDEyMDBcbiAgICBjb25zdCBzdGF0ZTogTGl2ZSA9IHsgcmluZzogbmV3IFNlcmllc1JpbmcoTWF0aC5jZWlsKHJldGVudGlvbikgKyA2MCksIGhhbmRsZTogbnVsbCwgdGltZXI6IG51bGwsIHVuc3Vic2NyaWJlOiBudWxsLCByZXNpemVyOiBudWxsLCBvYnNlcnZlcjogbnVsbCwgaW5WaWV3OiB0cnVlLCBkZXN0cm95ZWQ6IGZhbHNlLCBwZW5kaW5nOiBudWxsLCBzaWduYXR1cmU6ICcnIH1cbiAgICBsaXZlLnNldCh0aGlzLCBzdGF0ZSlcbiAgICBzdGF0ZS5yaW5nLnNlZWQodGhpcy4kc3RvcmUuZ2V0dGVyc1snY2hhcnRzL2dldENoYXJ0RGF0YSddID8/IFtdKVxuICAgIHN0YXRlLnVuc3Vic2NyaWJlID0gdGhpcy4kc3RvcmUuc3Vic2NyaWJlKChtdXRhdGlvbjogeyB0eXBlOiBzdHJpbmcsIHBheWxvYWQ6IGFueSB9KSA9PiB7XG4gICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2NoYXJ0cy9zZXRDaGFydEVudHJ5JykgeyBpZiAobXV0YXRpb24ucGF5bG9hZD8udHlwZSA9PT0gJ2NoYXJ0Jykgc3RhdGUucmluZy5wdXNoKG11dGF0aW9uLnBheWxvYWQuZGF0YSkgfSBlbHNlIGlmIChtdXRhdGlvbi50eXBlID09PSAnY2hhcnRzL3NldENoYXJ0U3RvcmUnKSBzdGF0ZS5yaW5nLnNlZWQobXV0YXRpb24ucGF5bG9hZCA/PyBbXSlcbiAgICAgIGVsc2UgaWYgKG11dGF0aW9uLnR5cGUgPT09ICdjaGFydHMvc2V0UmVzZXQnKSBzdGF0ZS5yaW5nLmNsZWFyKClcbiAgICB9KVxuICAgIHRoaXMucmVmcmVzaERlZnMoKVxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgY29uc3Qgc3RhdGUgPSBsaXZlLmdldCh0aGlzKSFcbiAgICBjcmVhdGVHcmFwaCh0aGlzLiRyZWZzLnBsb3QgYXMgSFRNTEVsZW1lbnQpLnRoZW4oaGFuZGxlID0+IHtcbiAgICAgIGlmIChzdGF0ZS5kZXN0cm95ZWQpIHsgaGFuZGxlLmRpc3Bvc2UoKTsgcmV0dXJuIH1cbiAgICAgIHN0YXRlLmhhbmRsZSA9IGhhbmRsZVxuICAgICAgdGhpcy5kcmF3KClcbiAgICB9KS5jYXRjaCgoKSA9PiB7IC8qIE5vIGNhbnZhcyAoYW4gb2xkIGJyb3dzZXIpOiB0aGUgbGVnZW5kIHN0aWxsIHdvcmtzLiAqLyB9KVxuICAgIHN0YXRlLnRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHRoaXMudGljaygpLCBUSUNLX01TKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLm9uVmlzaWJpbGl0eSlcbiAgICBpZiAodHlwZW9mIEludGVyc2VjdGlvbk9ic2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgc3RhdGUub2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgICAgIGNvbnN0IHdhcyA9IHRoaXMuc2hvdWxkRHJhdygpXG4gICAgICAgIHN0YXRlLmluVmlldyA9IGVudHJpZXNbZW50cmllcy5sZW5ndGggLSAxXT8uaXNJbnRlcnNlY3RpbmcgIT09IGZhbHNlXG4gICAgICAgIGlmICghd2FzICYmIHRoaXMuc2hvdWxkRHJhdygpKSB0aGlzLnRpY2soKVxuICAgICAgfSlcbiAgICAgIHN0YXRlLm9ic2VydmVyLm9ic2VydmUodGhpcy4kZWwpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBzdGF0ZS5yZXNpemVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHsgc3RhdGUuaGFuZGxlPy5yZXNpemUoKTsgdGhpcy5zY2hlZHVsZURyYXcoKSB9KVxuICAgICAgc3RhdGUucmVzaXplci5vYnNlcnZlKHRoaXMuJHJlZnMucGxvdCBhcyBIVE1MRWxlbWVudClcbiAgICB9XG4gICAgdGhpcy5wYWludFZhbHVlcygpXG4gIH1cblxuICB1cGRhdGVkICgpIHsgdGhpcy5wYWludFZhbHVlcygpIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IGxpdmUuZ2V0KHRoaXMpXG4gICAgaWYgKCFzdGF0ZSkgcmV0dXJuXG4gICAgc3RhdGUuZGVzdHJveWVkID0gdHJ1ZVxuICAgIGlmIChzdGF0ZS50aW1lciAhPT0gbnVsbCkgd2luZG93LmNsZWFySW50ZXJ2YWwoc3RhdGUudGltZXIpXG4gICAgaWYgKHN0YXRlLnBlbmRpbmcgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQoc3RhdGUucGVuZGluZylcbiAgICBzdGF0ZS51bnN1YnNjcmliZT8uKClcbiAgICBzdGF0ZS5yZXNpemVyPy5kaXNjb25uZWN0KClcbiAgICBzdGF0ZS5vYnNlcnZlcj8uZGlzY29ubmVjdCgpXG4gICAgc3RhdGUuaGFuZGxlPy5kaXNwb3NlKClcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5vblZpc2liaWxpdHkpXG4gICAgbGl2ZS5kZWxldGUodGhpcylcbiAgfVxuXG4gIEBXYXRjaCgnd2luZG93U2Vjb25kcycpXG4gIEBXYXRjaCgnZXZlbnRzJylcbiAgQFdhdGNoKCdzZWxlY3RlZCcpXG4gIEBXYXRjaCgnZGFyaycpXG4gIEBXYXRjaCgnZGVmcycpXG4gIEBXYXRjaCgncGhvbmUnKVxuICBzY2hlZHVsZURyYXcgKCkge1xuICAgIGNvbnN0IHN0YXRlID0gbGl2ZS5nZXQodGhpcylcbiAgICBpZiAoIXN0YXRlIHx8IHN0YXRlLnBlbmRpbmcgIT09IG51bGwpIHJldHVyblxuICAgIHN0YXRlLnBlbmRpbmcgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7IHN0YXRlLnBlbmRpbmcgPSBudWxsOyB0aGlzLmRyYXcoKSB9LCAwKVxuICB9XG5cbiAgc2hvdWxkRHJhdyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSAhPT0gJ2hpZGRlbicgJiYgbGl2ZS5nZXQodGhpcyk/LmluVmlldyAhPT0gZmFsc2VcbiAgfVxuXG4gIG9uVmlzaWJpbGl0eSAoKSB7IGlmICh0aGlzLnNob3VsZERyYXcoKSkgdGhpcy50aWNrKCkgfVxuXG4gIC8qKiBPbmNlIGEgc2Vjb25kOiBsb29rIGZvciBuZXcgb2JqZWN0cywgcmVmcmVzaCB0aGUgbnVtYmVycywgcmVkcmF3LiAqL1xuICB0aWNrICgpIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkRHJhdygpKSByZXR1cm5cbiAgICB0aGlzLnJlZnJlc2hEZWZzKClcbiAgICB0aGlzLnBhaW50VmFsdWVzKClcbiAgICB0aGlzLmRyYXcoKVxuICB9XG5cbiAgLyoqIFJlcGxhY2VzIHRoZSBzZXJpZXMgbGlzdCBvbmx5IHdoZW4gdGhlIHByaW50ZXIncyBvYmplY3RzIGFjdHVhbGx5IGNoYW5nZWQuICovXG4gIHJlZnJlc2hEZWZzICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IGxpdmUuZ2V0KHRoaXMpXG4gICAgaWYgKCFzdGF0ZSkgcmV0dXJuXG4gICAgY29uc3QgbmV4dCA9IGRpc2NvdmVyU2VyaWVzKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlcilcbiAgICBjb25zdCBzaWduYXR1cmUgPSBuZXh0Lm1hcChkID0+IGQua2V5KS5qb2luKCd8JylcbiAgICBpZiAoc2lnbmF0dXJlID09PSBzdGF0ZS5zaWduYXR1cmUpIHJldHVyblxuICAgIHN0YXRlLnNpZ25hdHVyZSA9IHNpZ25hdHVyZVxuICAgIHRoaXMuZGVmcyA9IE9iamVjdC5mcmVlemUobmV4dCkgYXMgU2VyaWVzRGVmW11cbiAgfVxuXG4gIGRyYXcgKCkge1xuICAgIGNvbnN0IHN0YXRlID0gbGl2ZS5nZXQodGhpcylcbiAgICBpZiAoIXN0YXRlPy5oYW5kbGUgfHwgIXRoaXMuc2hvdWxkRHJhdygpKSByZXR1cm5cbiAgICBjb25zdCB0byA9IERhdGUubm93KClcbiAgICBjb25zdCBmcm9tID0gdG8gLSB0aGlzLndpbmRvd1NlY29uZHMgKiAxMDAwXG4gICAgY29uc3Qgd2lkdGggPSBNYXRoLm1heCgxMjAsICh0aGlzLiRyZWZzLnBsb3QgYXMgSFRNTEVsZW1lbnQpLmNsaWVudFdpZHRoIHx8IDYwMClcbiAgICBjb25zdCBsaW5lczogR3JhcGhMaW5lW10gPSBbXVxuICAgIGZvciAoY29uc3QgZGVmIG9mIHRoaXMuZGVmcykge1xuICAgICAgaWYgKCF0aGlzLmlzT24oZGVmKSkgY29udGludWVcbiAgICAgIGNvbnN0IGxpbmU6IEdyYXBoTGluZSA9IHsgZGVmLCBwb2ludHM6IHN0YXRlLnJpbmcuZXh0cmFjdChkZWYua2V5LCBmcm9tLCB0bywgd2lkdGgsIGRlZi5zY2FsZSkgfVxuICAgICAgLy8gQSBoZWF0ZXIgdGhhdCBpcyBvZmYgaGFzIGEgdGFyZ2V0IG9mIDA7IGRyYXdpbmcgdGhhdCB3b3VsZCBvbmx5IGh1ZyB0aGUgZmxvb3IuXG4gICAgICBpZiAoZGVmLnRhcmdldEtleSkgbGluZS50YXJnZXRQb2ludHMgPSBzdGF0ZS5yaW5nLmV4dHJhY3QoZGVmLnRhcmdldEtleSwgZnJvbSwgdG8sIHdpZHRoKS5maWx0ZXIocCA9PiBwWzFdID4gMClcbiAgICAgIGxpbmVzLnB1c2gobGluZSlcbiAgICB9XG4gICAgc3RhdGUuaGFuZGxlLnNldE9wdGlvbihidWlsZEdyYXBoT3B0aW9uKHsgbGluZXMsIGZyb20sIHRvLCBkYXJrOiB0aGlzLmRhcmssIG1hcmtlcnM6IHRoaXMuZXZlbnRzLCBwaG9uZTogdGhpcy5waG9uZSB9KSlcbiAgfVxuXG4gIC8qKiBXcml0ZXMgdGhlIGN1cnJlbnQgbnVtYmVycyBpbnRvIHRoZSBsZWdlbmQgZGlyZWN0bHksIHNvIGEgcmVhZGluZyBuZXZlciByZS1yZW5kZXJzIHRoZSBjb21wb25lbnQuICovXG4gIHBhaW50VmFsdWVzICgpIHtcbiAgICBjb25zdCBwcmludGVyID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgY29uc3QgY2VsbHMgPSB0aGlzLiRlbD8ucXVlcnlTZWxlY3RvckFsbD8uKCdbZGF0YS12YWxdJylcbiAgICBpZiAoIWNlbGxzKSByZXR1cm5cbiAgICBjb25zdCBieUtleSA9IG5ldyBNYXAodGhpcy5kZWZzLm1hcChkID0+IFtkLmtleSwgZF0pKVxuICAgIGNlbGxzLmZvckVhY2goY2VsbCA9PiB7XG4gICAgICBjb25zdCBkZWYgPSBieUtleS5nZXQoY2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJykgPz8gJycpXG4gICAgICBpZiAoIWRlZikgcmV0dXJuXG4gICAgICBjb25zdCBvYmplY3QgPSBwcmludGVyW2RlZi5vYmplY3RdXG4gICAgICBjb25zdCB2YWx1ZSA9IG9iamVjdD8uW2RlZi5maWVsZF1cbiAgICAgIGxldCB0ZXh0ID0gJydcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKGRlZi51bml0ID09PSAnJScpIHRleHQgPSBgJHtNYXRoLnJvdW5kKHZhbHVlICogZGVmLnNjYWxlKX0lYFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0ZXh0ID0gYCR7dmFsdWUudG9GaXhlZCgxKX3CsGBcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBkZWYudGFyZ2V0S2V5ID8gb2JqZWN0Py50YXJnZXQgOiB1bmRlZmluZWRcbiAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ251bWJlcicgJiYgdGFyZ2V0ID4gMCkgdGV4dCArPSBgIC8gJHtNYXRoLnJvdW5kKHRhcmdldCl9wrBgXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChjZWxsLnRleHRDb250ZW50ICE9PSB0ZXh0KSBjZWxsLnRleHRDb250ZW50ID0gdGV4dFxuICAgIH0pXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC50Z19fcGxvdCB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgbWluLWhlaWdodDogMTIwcHg7XG4gIH1cblxuICAudGdfX2xlZ2VuZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiA0cHggMThweDtcbiAgICBtYXJnaW4tdG9wOiA2cHg7XG4gIH1cblxuICAudGdfX2dyb3VwIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMnB4IDE0cHg7XG4gIH1cblxuICAudGdfX2dyb3VwLW5hbWUge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjA2ZW07XG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgfVxuXG4gIC50Z19fY2hpcCxcbiAgLnRnX19tb3JlIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIHBhZGRpbmc6IDRweCAwO1xuICAgIGJvcmRlcjogMDtcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udDogaW5oZXJpdDtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICB9XG5cbiAgLnRnX19jaGlwOmhvdmVyLFxuICAudGdfX21vcmU6aG92ZXIge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAudGdfX2NoaXAub2ZmIHtcbiAgICBvcGFjaXR5OiAwLjQ1O1xuICAgIHRleHQtZGVjb3JhdGlvbjogbGluZS10aHJvdWdoO1xuICB9XG5cbiAgLnRnX19zd2F0Y2gge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB3aWR0aDogMTRweDtcbiAgICBoZWlnaHQ6IDA7XG4gICAgYm9yZGVyLXRvcDogM3B4IHNvbGlkIHZhcigtLXRnLWNvbG9yKTtcbiAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gIH1cblxuICAudGdfX3N3YXRjaC5kb3R0ZWQge1xuICAgIGJvcmRlci10b3Atc3R5bGU6IGRvdHRlZDtcbiAgfVxuXG4gIC50Z19fbmFtZSB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC50Z19fdmFsIHtcbiAgICBtaW4td2lkdGg6IDMuMmVtO1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAudGdfX21vcmUge1xuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICB9XG5cbiAgLnRnX19ldmVudHMge1xuICAgIG1hcmdpbi10b3A6IDZweDtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC50Z19fZXZlbnRzIHVsIHtcbiAgICBtYXJnaW46IDRweCAwIDA7XG4gICAgcGFkZGluZy1sZWZ0OiAxOHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY2hhcnRzL1RoZXJtYWxHcmFwaC52dWUifQ==