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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import BedMeshChart from "/src/components/widgets/bedmesh/BedMeshChart.vue";
let BedSurface = class extends Mixins(StateMixin, BrowserMixin) {
  bare;
  get mesh() {
    return this.$store.getters["mesh/getCurrentMeshData"];
  }
  get matrix() {
    return this.$store.state.mesh.matrix;
  }
  setMatrix(value) {
    this.$store.dispatch("mesh/onMatrix", value);
  }
  get matrixOptions() {
    return [{ value: "probed_matrix", label: "Probed" }, { value: "mesh_matrix", label: "Smoothed" }];
  }
  get scale() {
    return this.$store.state.mesh.scale;
  }
  get boxScale() {
    return this.$store.state.mesh.boxScale;
  }
  get wireframe() {
    return this.$store.state.mesh.wireframe;
  }
  get flatSurface() {
    return this.$store.state.mesh.flatSurface;
  }
  get loaded() {
    return !!this.mesh?.[this.matrix]?.coordinates?.length;
  }
  get profileName() {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? "";
  }
  get range() {
    return this.mesh?.[this.matrix]?.range ?? 0;
  }
  // The chart's settings, as Fluidd's own bed mesh panel builds them.
  get options() {
    const current = this.mesh[this.matrix];
    const mapScale = this.scale / 2;
    const zMin = this.scale === 0 ? current.min : -Math.abs(mapScale - current.min);
    const zMax = this.scale === 0 ? current.max : mapScale + current.max;
    const half = this.boxScale / 2;
    const pad = Math.max(0.01, (current.max - current.min) * 0.1);
    const selected = Object.fromEntries(this.series.map((s) => [s.name, !s.name.endsWith("_flat") || this.flatSurface && s.name.startsWith(this.matrix)]));
    return {
      legend: { show: false, selected },
      visualMap: { min: zMin, max: zMax, dimension: 2, seriesIndex: 0 },
      // Exaggerated, the height axis spans this mesh alone, so a bed within a tenth of a millimetre still shows its shape.
      zAxis3D: this.scale === 0 ? { min: Math.floor((current.min - pad) * 1e3) / 1e3, max: Math.ceil((current.max + pad) * 1e3) / 1e3 } : { min: -Math.abs(current.mid - half), max: current.mid + half }
    };
  }
  get series() {
    return [
      {
        type: "surface",
        name: this.matrix,
        shading: "color",
        wireframe: { show: this.wireframe },
        data: this.mesh[this.matrix].coordinates,
        dataShape: this.mesh[this.matrix].dimensions
      },
      this.flat("probed_matrix_flat"),
      this.flat("mesh_matrix_flat")
    ];
  }
  flat(name) {
    return {
      type: "surface",
      name,
      itemStyle: { color: [0.5, 0.5, 0.5, 0.25] },
      wireframe: { show: this.wireframe, lineStyle: { opacity: 0.25, width: 1, color: "#ffffff" } },
      data: this.mesh[name].coordinates,
      dataShape: this.mesh[name].dimensions
    };
  }
};
__decorateClass([
  Prop({ type: Boolean })
], BedSurface.prototype, "bare", 2);
BedSurface = __decorateClass([
  Component({ components: { ControlCard, SegPicker, BedMeshChart } })
], BedSurface);
const _sfc_main = BedSurface;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(_vm.bare ? "div" : "control-card", _vm._b({ tag: "component", staticClass: "bsurf", attrs: { "data-tid": "bed-surface" } }, "component", _vm.bare ? {} : { title: "Surface" }, false), [_vm.loaded ? _c("p", { staticClass: "bsurf__range" }, [_vm._v(" " + _vm._s(_vm.profileName) + " \xB7 " + _vm._s(_vm.range.toFixed(3)) + " mm high to low ")]) : _vm._e(), _vm.loaded ? _c("bed-mesh-chart", { staticClass: "bsurf__chart", attrs: { "options": _vm.options, "data": _vm.series, "height": _vm.isMobileViewport ? "300px" : "480px" } }) : _c("div", { staticClass: "bsurf__none" }, [_c(__unplugin_components_0, { attrs: { "name": "mesh" } }), _c("p", [_vm._v("No mesh loaded. Measure the bed, or load a saved profile.")])], 1), _vm.loaded ? _c("div", { staticClass: "bsurf__chips", attrs: { "role": "group", "aria-label": "Show" } }, [_c("seg-picker", { attrs: { "options": _vm.matrixOptions, "value": _vm.matrix, "label": "Heights" }, on: { "input": _vm.setMatrix } }), _c("button", { staticClass: "bsurf__chip", class: { "bsurf__chip--on": _vm.flatSurface }, attrs: { "type": "button", "aria-pressed": _vm.flatSurface ? "true" : "false" }, on: { "click": function($event) {
    return _vm.$store.dispatch("mesh/onFlatSurface", !_vm.flatSurface);
  } } }, [_vm._v(" Flat plane ")]), _c("button", { staticClass: "bsurf__chip", class: { "bsurf__chip--on": _vm.wireframe }, attrs: { "type": "button", "aria-pressed": _vm.wireframe ? "true" : "false" }, on: { "click": function($event) {
    return _vm.$store.dispatch("mesh/onWireframe", !_vm.wireframe);
  } } }, [_vm._v(" Wireframe ")]), _c("button", { staticClass: "bsurf__chip", class: { "bsurf__chip--on": _vm.scale === 0 }, attrs: { "type": "button", "aria-pressed": _vm.scale === 0 ? "true" : "false", "title": "Heights and colours stretched over this mesh's own range, so small differences show" }, on: { "click": function($event) {
    return _vm.$store.dispatch("mesh/onScale", _vm.scale === 0 ? 0.2 : 0);
  } } }, [_vm._v(" Exaggerate ")])], 1) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/BedSurface.vue?vue&type=style&index=0&scoped=441a87ca&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "441a87ca",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/BedSurface.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUEwRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBUUE7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUEsNEJBQ0Esd0dBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExRkE7QUFBQSxFQURBO0FBQUEsR0FGQSxXQUdBO0FBSEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQmVkU3VyZmFjZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8Y29tcG9uZW50XG4gICAgOmlzPVwiYmFyZSA/ICdkaXYnIDogJ2NvbnRyb2wtY2FyZCdcIlxuICAgIGNsYXNzPVwiYnN1cmZcIlxuICAgIHYtYmluZD1cImJhcmUgPyB7fSA6IHsgdGl0bGU6ICdTdXJmYWNlJyB9XCJcbiAgICBkYXRhLXRpZD1cImJlZC1zdXJmYWNlXCJcbiAgPlxuICAgIDxwXG4gICAgICB2LWlmPVwibG9hZGVkXCJcbiAgICAgIGNsYXNzPVwiYnN1cmZfX3JhbmdlXCJcbiAgICA+XG4gICAgICB7eyBwcm9maWxlTmFtZSB9fSDCtyB7eyByYW5nZS50b0ZpeGVkKDMpIH19IG1tIGhpZ2ggdG8gbG93XG4gICAgPC9wPlxuXG4gICAgPGJlZC1tZXNoLWNoYXJ0XG4gICAgICB2LWlmPVwibG9hZGVkXCJcbiAgICAgIGNsYXNzPVwiYnN1cmZfX2NoYXJ0XCJcbiAgICAgIDpvcHRpb25zPVwib3B0aW9uc1wiXG4gICAgICA6ZGF0YT1cInNlcmllc1wiXG4gICAgICA6aGVpZ2h0PVwiaXNNb2JpbGVWaWV3cG9ydCA/ICczMDBweCcgOiAnNDgwcHgnXCJcbiAgICAvPlxuICAgIDxkaXZcbiAgICAgIHYtZWxzZVxuICAgICAgY2xhc3M9XCJic3VyZl9fbm9uZVwiXG4gICAgPlxuICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1lc2hcIiAvPlxuICAgICAgPHA+Tm8gbWVzaCBsb2FkZWQuIE1lYXN1cmUgdGhlIGJlZCwgb3IgbG9hZCBhIHNhdmVkIHByb2ZpbGUuPC9wPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cImxvYWRlZFwiXG4gICAgICBjbGFzcz1cImJzdXJmX19jaGlwc1wiXG4gICAgICByb2xlPVwiZ3JvdXBcIlxuICAgICAgYXJpYS1sYWJlbD1cIlNob3dcIlxuICAgID5cbiAgICAgIDxzZWctcGlja2VyXG4gICAgICAgIDpvcHRpb25zPVwibWF0cml4T3B0aW9uc1wiXG4gICAgICAgIDp2YWx1ZT1cIm1hdHJpeFwiXG4gICAgICAgIGxhYmVsPVwiSGVpZ2h0c1wiXG4gICAgICAgIEBpbnB1dD1cInNldE1hdHJpeFwiXG4gICAgICAvPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJic3VyZl9fY2hpcFwiXG4gICAgICAgIDpjbGFzcz1cInsgJ2JzdXJmX19jaGlwLS1vbic6IGZsYXRTdXJmYWNlIH1cIlxuICAgICAgICA6YXJpYS1wcmVzc2VkPVwiZmxhdFN1cmZhY2UgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgQGNsaWNrPVwiJHN0b3JlLmRpc3BhdGNoKCdtZXNoL29uRmxhdFN1cmZhY2UnLCAhZmxhdFN1cmZhY2UpXCJcbiAgICAgID5cbiAgICAgICAgRmxhdCBwbGFuZVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJzdXJmX19jaGlwXCJcbiAgICAgICAgOmNsYXNzPVwieyAnYnN1cmZfX2NoaXAtLW9uJzogd2lyZWZyYW1lIH1cIlxuICAgICAgICA6YXJpYS1wcmVzc2VkPVwid2lyZWZyYW1lID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgIEBjbGljaz1cIiRzdG9yZS5kaXNwYXRjaCgnbWVzaC9vbldpcmVmcmFtZScsICF3aXJlZnJhbWUpXCJcbiAgICAgID5cbiAgICAgICAgV2lyZWZyYW1lXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiYnN1cmZfX2NoaXBcIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdic3VyZl9fY2hpcC0tb24nOiBzY2FsZSA9PT0gMCB9XCJcbiAgICAgICAgOmFyaWEtcHJlc3NlZD1cInNjYWxlID09PSAwID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgIHRpdGxlPVwiSGVpZ2h0cyBhbmQgY29sb3VycyBzdHJldGNoZWQgb3ZlciB0aGlzIG1lc2gncyBvd24gcmFuZ2UsIHNvIHNtYWxsIGRpZmZlcmVuY2VzIHNob3dcIlxuICAgICAgICBAY2xpY2s9XCIkc3RvcmUuZGlzcGF0Y2goJ21lc2gvb25TY2FsZScsIHNjYWxlID09PSAwID8gMC4yIDogMClcIlxuICAgICAgPlxuICAgICAgICBFeGFnZ2VyYXRlXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgPC9jb21wb25lbnQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFN0YXRlTWl4aW4gZnJvbSAnQC9taXhpbnMvc3RhdGUnXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgdHlwZSB7IEFwcE1lc2hlcywgTWF0cml4VHlwZSB9IGZyb20gJ0Avc3RvcmUvbWVzaC90eXBlcydcbmltcG9ydCBDb250cm9sQ2FyZCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sQ2FyZC52dWUnXG5pbXBvcnQgU2VnUGlja2VyLCB7IHR5cGUgU2VnT3B0aW9uIH0gZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvU2VnUGlja2VyLnZ1ZSdcbmltcG9ydCBCZWRNZXNoQ2hhcnQgZnJvbSAnQC9jb21wb25lbnRzL3dpZGdldHMvYmVkbWVzaC9CZWRNZXNoQ2hhcnQudnVlJ1xuXG4vKipcbiAqIFRoZSBiZWQgYXMgYSAzRCBzdXJmYWNlOiB0aGUgcHJvYmVkIHBvaW50cyBvciB0aGUgc21vb3RoZWQgbWVzaFxuICogS2xpcHBlciBtb3ZlcyBieSwgd2l0aCBhIGZsYXQgcGxhbmUgdG8ganVkZ2UgaXQgYWdhaW5zdC4gVGhlIGNoYXJ0IGlzXG4gKiBGbHVpZGQnczsgaXRzIHNjYWxpbmcgZm9sbG93cyB0aGUgc2FtZSBzZXR0aW5ncyBhcyBpdHMgb3duIHBhbmVsLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBDb250cm9sQ2FyZCwgU2VnUGlja2VyLCBCZWRNZXNoQ2hhcnQgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmVkU3VyZmFjZSBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluLCBCcm93c2VyTWl4aW4pIHtcbiAgLyoqIFdpdGhvdXQgaXRzIG93biBjYXJkLCBmb3IgYSB0aWxlIHRoYXQgYWxyZWFkeSBpcyBvbmUuICovXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBiYXJlPzogYm9vbGVhblxuXG4gIGdldCBtZXNoICgpOiBBcHBNZXNoZXMge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydtZXNoL2dldEN1cnJlbnRNZXNoRGF0YSddIGFzIEFwcE1lc2hlc1xuICB9XG5cbiAgZ2V0IG1hdHJpeCAoKTogTWF0cml4VHlwZSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLm1lc2gubWF0cml4XG4gIH1cblxuICBzZXRNYXRyaXggKHZhbHVlOiBNYXRyaXhUeXBlKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ21lc2gvb25NYXRyaXgnLCB2YWx1ZSlcbiAgfVxuXG4gIGdldCBtYXRyaXhPcHRpb25zICgpOiBTZWdPcHRpb25bXSB7XG4gICAgcmV0dXJuIFt7IHZhbHVlOiAncHJvYmVkX21hdHJpeCcsIGxhYmVsOiAnUHJvYmVkJyB9LCB7IHZhbHVlOiAnbWVzaF9tYXRyaXgnLCBsYWJlbDogJ1Ntb290aGVkJyB9XVxuICB9XG5cbiAgZ2V0IHNjYWxlICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5tZXNoLnNjYWxlXG4gIH1cblxuICBnZXQgYm94U2NhbGUgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLm1lc2guYm94U2NhbGVcbiAgfVxuXG4gIGdldCB3aXJlZnJhbWUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5tZXNoLndpcmVmcmFtZVxuICB9XG5cbiAgZ2V0IGZsYXRTdXJmYWNlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUubWVzaC5mbGF0U3VyZmFjZVxuICB9XG5cbiAgZ2V0IGxvYWRlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5tZXNoPy5bdGhpcy5tYXRyaXhdPy5jb29yZGluYXRlcz8ubGVuZ3RoXG4gIH1cblxuICBnZXQgcHJvZmlsZU5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5iZWRfbWVzaD8ucHJvZmlsZV9uYW1lID8/ICcnXG4gIH1cblxuICBnZXQgcmFuZ2UgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubWVzaD8uW3RoaXMubWF0cml4XT8ucmFuZ2UgPz8gMFxuICB9XG5cbiAgLy8gVGhlIGNoYXJ0J3Mgc2V0dGluZ3MsIGFzIEZsdWlkZCdzIG93biBiZWQgbWVzaCBwYW5lbCBidWlsZHMgdGhlbS5cbiAgZ2V0IG9wdGlvbnMgKCkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLm1lc2hbdGhpcy5tYXRyaXhdXG4gICAgY29uc3QgbWFwU2NhbGUgPSB0aGlzLnNjYWxlIC8gMlxuICAgIGNvbnN0IHpNaW4gPSB0aGlzLnNjYWxlID09PSAwID8gY3VycmVudC5taW4gOiAtTWF0aC5hYnMobWFwU2NhbGUgLSBjdXJyZW50Lm1pbilcbiAgICBjb25zdCB6TWF4ID0gdGhpcy5zY2FsZSA9PT0gMCA/IGN1cnJlbnQubWF4IDogbWFwU2NhbGUgKyBjdXJyZW50Lm1heFxuICAgIGNvbnN0IGhhbGYgPSB0aGlzLmJveFNjYWxlIC8gMlxuICAgIGNvbnN0IHBhZCA9IE1hdGgubWF4KDAuMDEsIChjdXJyZW50Lm1heCAtIGN1cnJlbnQubWluKSAqIDAuMSlcbiAgICBjb25zdCBzZWxlY3RlZCA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnNlcmllcy5tYXAocyA9PiBbcy5uYW1lLCAhcy5uYW1lLmVuZHNXaXRoKCdfZmxhdCcpIHx8ICh0aGlzLmZsYXRTdXJmYWNlICYmIHMubmFtZS5zdGFydHNXaXRoKHRoaXMubWF0cml4KSldKSlcbiAgICByZXR1cm4ge1xuICAgICAgbGVnZW5kOiB7IHNob3c6IGZhbHNlLCBzZWxlY3RlZCB9LFxuICAgICAgdmlzdWFsTWFwOiB7IG1pbjogek1pbiwgbWF4OiB6TWF4LCBkaW1lbnNpb246IDIsIHNlcmllc0luZGV4OiAwIH0sXG4gICAgICAvLyBFeGFnZ2VyYXRlZCwgdGhlIGhlaWdodCBheGlzIHNwYW5zIHRoaXMgbWVzaCBhbG9uZSwgc28gYSBiZWQgd2l0aGluIGEgdGVudGggb2YgYSBtaWxsaW1ldHJlIHN0aWxsIHNob3dzIGl0cyBzaGFwZS5cbiAgICAgIHpBeGlzM0Q6IHRoaXMuc2NhbGUgPT09IDBcbiAgICAgICAgPyB7IG1pbjogTWF0aC5mbG9vcigoY3VycmVudC5taW4gLSBwYWQpICogMTAwMCkgLyAxMDAwLCBtYXg6IE1hdGguY2VpbCgoY3VycmVudC5tYXggKyBwYWQpICogMTAwMCkgLyAxMDAwIH1cbiAgICAgICAgOiB7IG1pbjogLU1hdGguYWJzKGN1cnJlbnQubWlkIC0gaGFsZiksIG1heDogY3VycmVudC5taWQgKyBoYWxmIH1cbiAgICB9XG4gIH1cblxuICBnZXQgc2VyaWVzICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnc3VyZmFjZScsXG4gICAgICAgIG5hbWU6IHRoaXMubWF0cml4LFxuICAgICAgICBzaGFkaW5nOiAnY29sb3InLFxuICAgICAgICB3aXJlZnJhbWU6IHsgc2hvdzogdGhpcy53aXJlZnJhbWUgfSxcbiAgICAgICAgZGF0YTogdGhpcy5tZXNoW3RoaXMubWF0cml4XS5jb29yZGluYXRlcyxcbiAgICAgICAgZGF0YVNoYXBlOiB0aGlzLm1lc2hbdGhpcy5tYXRyaXhdLmRpbWVuc2lvbnNcbiAgICAgIH0sXG4gICAgICB0aGlzLmZsYXQoJ3Byb2JlZF9tYXRyaXhfZmxhdCcpLFxuICAgICAgdGhpcy5mbGF0KCdtZXNoX21hdHJpeF9mbGF0JylcbiAgICBdXG4gIH1cblxuICBmbGF0IChuYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ3N1cmZhY2UnLFxuICAgICAgbmFtZSxcbiAgICAgIGl0ZW1TdHlsZTogeyBjb2xvcjogWzAuNSwgMC41LCAwLjUsIDAuMjVdIH0sXG4gICAgICB3aXJlZnJhbWU6IHsgc2hvdzogdGhpcy53aXJlZnJhbWUsIGxpbmVTdHlsZTogeyBvcGFjaXR5OiAwLjI1LCB3aWR0aDogMSwgY29sb3I6ICcjZmZmZmZmJyB9IH0sXG4gICAgICBkYXRhOiB0aGlzLm1lc2hbbmFtZV0uY29vcmRpbmF0ZXMsXG4gICAgICBkYXRhU2hhcGU6IHRoaXMubWVzaFtuYW1lXS5kaW1lbnNpb25zXG4gICAgfVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuYnN1cmYge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE2cHg7XG4gIH1cblxuICAuYnN1cmZfX3JhbmdlIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuYnN1cmZfX2NoYXJ0IHtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuYnN1cmZfX25vbmUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtaW4taGVpZ2h0OiAyNjBweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcblxuICAgIHAge1xuICAgICAgbWFyZ2luOiAwO1xuICAgIH1cbiAgfVxuXG4gIC5ic3VyZl9fY2hpcHMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAuYnN1cmZfX2NoaXAge1xuICAgIGhlaWdodDogMzJweDtcbiAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5ic3VyZl9fY2hpcC0tb24ge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMTI4LCAyMTQsIDIwOSwgMC4xNCk7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHJnYmEoMTI4LCAyMTQsIDIwOSwgMC41KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tYWludGVuYW5jZS9CZWRTdXJmYWNlLnZ1ZSJ9