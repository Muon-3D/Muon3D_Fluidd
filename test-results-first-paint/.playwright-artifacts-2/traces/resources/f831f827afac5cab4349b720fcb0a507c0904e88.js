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
import DevGuardMixin from "/src/mixins/dev-guard.ts";
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import TileDialog from "/src/components/widgets/overview/tiles/TileDialog.vue";
import RangeSlider from "/src/components/control/RangeSlider.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
let FansTile = class extends Mixins(OverviewMixin, DevGuardMixin) {
  open = false;
  dialog = false;
  closeOnSwitch() {
    this.open = false;
    this.dialog = false;
  }
  get lead() {
    return this.partFan ?? this.fans[0] ?? null;
  }
  get headline() {
    return this.lead ? `${this.fanValue(this.lead)}%` : "\u2014";
  }
  get headlineLabel() {
    return this.lead === this.partFan ? "part" : this.lead?.prettyName || "";
  }
  /** The rest, in words: a fan we can set by its percentage, one the printer runs by itself on or off. */
  get others() {
    return this.fans.filter((f) => f !== this.lead).slice(0, 3).map((f) => {
      const name = f.prettyName || f.name;
      const value = this.fanValue(f);
      return f.controllable ? `${name} ${value}%` : `${name} ${value ? "on" : "off"}`;
    }).join(" \xB7 ") || "No other fans";
  }
  get sliders() {
    if (this.devOnlyLocked) return [];
    return this.fans.filter((f) => f.controllable && (f.type === "fan" || f.type === "fan_generic"));
  }
  get powerDevices() {
    if (!this.$store.getters["server/componentSupport"]?.("power")) return [];
    return this.$store.getters["power/getDevices"] ?? [];
  }
  percentText(value) {
    return `${value} percent`;
  }
  toggle() {
    if (this.fans.length) this.open = !this.open;
  }
  get menu() {
    const items = [{ id: "all", label: "All fans and outputs\u2026", action: () => {
      this.dialog = true;
    } }];
    if (this.powerDevices.length) items.push({ id: "power", label: "Power devices\u2026", to: this.pagePath("/system") });
    return items;
  }
};
__decorateClass([
  Watch("panelTarget")
], FansTile.prototype, "closeOnSwitch", 1);
FansTile = __decorateClass([
  Component({ components: { TileShell, TileDialog, RangeSlider, ToggleSwitch, ControlFans: () => import("/src/components/control/ControlFans.vue") } })
], FansTile);
const _sfc_main = FansTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { staticClass: "fa", attrs: { "tile": "fans", "title": "Fans", "icon": "fan", "menu": _vm.menu, "open": _vm.open, "locked": !_vm.fans.length }, on: { "toggle": _vm.toggle }, scopedSlots: _vm._u([{ key: "popover", fn: function() {
    return [_c("div", { key: _vm.panelTarget, staticClass: "fa__pop" }, [_vm._l(_vm.sliders, function(fan) {
      return _c("div", { key: fan.name, staticClass: "fa__row" }, [_c("span", { staticClass: "fa__name" }, [_vm._v(_vm._s(fan.prettyName || fan.name))]), _c("range-slider", { staticClass: "fa__slider", attrs: { "value": _vm.fanValue(fan), "label": fan.prettyName || fan.name, "value-text-formatter": _vm.percentText, "disabled": !_vm.controlReady }, on: { "change": function($event) {
        return _vm.setFan(fan, $event);
      } } }), _c("b", { staticClass: "fa__pct" }, [_vm._v(_vm._s(_vm.fanValue(fan)) + "%")])], 1);
    }), _vm.hasLights ? _c("div", { staticClass: "fa__row" }, [_c("span", { staticClass: "fa__name" }, [_vm._v("Lights")]), _c("toggle-switch", { attrs: { "value": _vm.lightsValue > 0, "label": "Lights", "disabled": !_vm.controlReady }, on: { "input": _vm.setLights } })], 1) : _vm._e(), !_vm.sliders.length ? _c("p", { staticClass: "ot__note" }, [_vm._v(" " + _vm._s(_vm.devOnlyLocked ? "Pick Quiet, Normal or Turbo in Print mode." : "The fans here are run by the printer itself.") + " ")]) : _vm.busy ? _c("p", { staticClass: "ot__note" }, [_vm._v(" The print sets the part fan as it goes. A change here lasts until its next fan command. ")]) : _vm._e()], 2)];
  }, proxy: true }]) }, [_vm.fans.length ? [_c("span", { staticClass: "ot__value", attrs: { "data-tid": "fan-value" } }, [_vm._v(_vm._s(_vm.headline)), _c("small", [_vm._v(_vm._s(_vm.headlineLabel))])]), _vm.size !== "S" ? _c("span", { staticClass: "ot__sub" }, [_vm._v(_vm._s(_vm.others))]) : _vm._e()] : [_c("span", { staticClass: "ot__value" }, [_vm._v("\u2014")]), _c("span", { staticClass: "ot__sub" }, [_vm._v("No fans reported")])], _c("tile-dialog", { attrs: { "value": _vm.dialog, "title": "All fans and outputs", "max-width": "720" }, on: { "close": function($event) {
    _vm.dialog = false;
  } } }, [_c("control-fans")], 1)], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/FansTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/FansTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXNGQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQVFBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQW5DQTtBQUFBLEVBREE7QUFBQSxHQUpBLFNBS0E7QUFMQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJGYW5zVGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dGlsZS1zaGVsbFxuICAgIHRpbGU9XCJmYW5zXCJcbiAgICB0aXRsZT1cIkZhbnNcIlxuICAgIGljb249XCJmYW5cIlxuICAgIDptZW51PVwibWVudVwiXG4gICAgOm9wZW49XCJvcGVuXCJcbiAgICA6bG9ja2VkPVwiIWZhbnMubGVuZ3RoXCJcbiAgICBjbGFzcz1cImZhXCJcbiAgICBAdG9nZ2xlPVwidG9nZ2xlXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSB2LWlmPVwiZmFucy5sZW5ndGhcIj5cbiAgICAgIDxzcGFuXG4gICAgICAgIGNsYXNzPVwib3RfX3ZhbHVlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJmYW4tdmFsdWVcIlxuICAgICAgPnt7IGhlYWRsaW5lIH19PHNtYWxsPnt7IGhlYWRsaW5lTGFiZWwgfX08L3NtYWxsPjwvc3Bhbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtaWY9XCJzaXplICE9PSAnUydcIlxuICAgICAgICBjbGFzcz1cIm90X19zdWJcIlxuICAgICAgPnt7IG90aGVycyB9fTwvc3Bhbj5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICA8c3BhbiBjbGFzcz1cIm90X192YWx1ZVwiPuKAlDwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwib3RfX3N1YlwiPk5vIGZhbnMgcmVwb3J0ZWQ8L3NwYW4+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDx0ZW1wbGF0ZSAjcG9wb3Zlcj5cbiAgICAgIDxkaXZcbiAgICAgICAgOmtleT1cInBhbmVsVGFyZ2V0XCJcbiAgICAgICAgY2xhc3M9XCJmYV9fcG9wXCJcbiAgICAgID5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtZm9yPVwiZmFuIGluIHNsaWRlcnNcIlxuICAgICAgICAgIDprZXk9XCJmYW4ubmFtZVwiXG4gICAgICAgICAgY2xhc3M9XCJmYV9fcm93XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZmFfX25hbWVcIj57eyBmYW4ucHJldHR5TmFtZSB8fCBmYW4ubmFtZSB9fTwvc3Bhbj5cbiAgICAgICAgICA8cmFuZ2Utc2xpZGVyXG4gICAgICAgICAgICBjbGFzcz1cImZhX19zbGlkZXJcIlxuICAgICAgICAgICAgOnZhbHVlPVwiZmFuVmFsdWUoZmFuKVwiXG4gICAgICAgICAgICA6bGFiZWw9XCJmYW4ucHJldHR5TmFtZSB8fCBmYW4ubmFtZVwiXG4gICAgICAgICAgICA6dmFsdWUtdGV4dC1mb3JtYXR0ZXI9XCJwZXJjZW50VGV4dFwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICAgIEBjaGFuZ2U9XCJzZXRGYW4oZmFuLCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxiIGNsYXNzPVwiZmFfX3BjdFwiPnt7IGZhblZhbHVlKGZhbikgfX0lPC9iPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJoYXNMaWdodHNcIlxuICAgICAgICAgIGNsYXNzPVwiZmFfX3Jvd1wiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImZhX19uYW1lXCI+TGlnaHRzPC9zcGFuPlxuICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICA6dmFsdWU9XCJsaWdodHNWYWx1ZSA+IDBcIlxuICAgICAgICAgICAgbGFiZWw9XCJMaWdodHNcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgICBAaW5wdXQ9XCJzZXRMaWdodHNcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCIhc2xpZGVycy5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwib3RfX25vdGVcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgZGV2T25seUxvY2tlZCA/ICdQaWNrIFF1aWV0LCBOb3JtYWwgb3IgVHVyYm8gaW4gUHJpbnQgbW9kZS4nIDogJ1RoZSBmYW5zIGhlcmUgYXJlIHJ1biBieSB0aGUgcHJpbnRlciBpdHNlbGYuJyB9fVxuICAgICAgICA8L3A+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1lbHNlLWlmPVwiYnVzeVwiXG4gICAgICAgICAgY2xhc3M9XCJvdF9fbm90ZVwiXG4gICAgICAgID5cbiAgICAgICAgICBUaGUgcHJpbnQgc2V0cyB0aGUgcGFydCBmYW4gYXMgaXQgZ29lcy4gQSBjaGFuZ2UgaGVyZSBsYXN0cyB1bnRpbCBpdHMgbmV4dCBmYW4gY29tbWFuZC5cbiAgICAgICAgPC9wPlxuICAgICAgPC9kaXY+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDx0aWxlLWRpYWxvZ1xuICAgICAgOnZhbHVlPVwiZGlhbG9nXCJcbiAgICAgIHRpdGxlPVwiQWxsIGZhbnMgYW5kIG91dHB1dHNcIlxuICAgICAgbWF4LXdpZHRoPVwiNzIwXCJcbiAgICAgIEBjbG9zZT1cImRpYWxvZyA9IGZhbHNlXCJcbiAgICA+XG4gICAgICA8Y29udHJvbC1mYW5zIC8+XG4gICAgPC90aWxlLWRpYWxvZz5cbiAgPC90aWxlLXNoZWxsPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCBEZXZHdWFyZE1peGluIGZyb20gJ0AvbWl4aW5zL2Rldi1ndWFyZCdcbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgT3ZlcnZpZXdNaXhpbiBmcm9tICdAL21peGlucy9vdmVydmlldydcbmltcG9ydCB0eXBlIHsgVGlsZU1lbnVJdGVtIH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy90aWxlcydcbmltcG9ydCB0eXBlIHsgRmFuIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuaW1wb3J0IFRpbGVTaGVsbCBmcm9tICcuL1RpbGVTaGVsbC52dWUnXG5pbXBvcnQgVGlsZURpYWxvZyBmcm9tICcuL1RpbGVEaWFsb2cudnVlJ1xuaW1wb3J0IFJhbmdlU2xpZGVyIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1JhbmdlU2xpZGVyLnZ1ZSdcbmltcG9ydCBUb2dnbGVTd2l0Y2ggZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvVG9nZ2xlU3dpdGNoLnZ1ZSdcblxuLyoqXG4gKiBUaGUgcGFydCBmYW4gYXMgb25lIG51bWJlciwgdGhlIG90aGVycyBpbiBhIGxpbmUuIFRhcHBpbmcgb3BlbnMgYSBzbGlkZXJcbiAqIGZvciBlYWNoIGZhbiB0aGUgcHJpbnRlciBsZXRzIHVzIHNldCwgYW5kIHRoZSBsaWdodHMuIEV2ZXJ5IGZhbiBhbmRcbiAqIG91dHB1dCwgYW5kIHRoZSBwb3dlciBkZXZpY2VzLCBhcmUgYmVoaW5kIHRoZSB0aHJlZSBkb3RzLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUaWxlU2hlbGwsIFRpbGVEaWFsb2csIFJhbmdlU2xpZGVyLCBUb2dnbGVTd2l0Y2gsIENvbnRyb2xGYW5zOiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9jb250cm9sL0NvbnRyb2xGYW5zLnZ1ZScpIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZhbnNUaWxlIGV4dGVuZHMgTWl4aW5zKE92ZXJ2aWV3TWl4aW4sIERldkd1YXJkTWl4aW4pIHtcbiAgb3BlbiA9IGZhbHNlXG4gIGRpYWxvZyA9IGZhbHNlXG5cbiAgQFdhdGNoKCdwYW5lbFRhcmdldCcpXG4gIGNsb3NlT25Td2l0Y2ggKCkgeyB0aGlzLm9wZW4gPSBmYWxzZTsgdGhpcy5kaWFsb2cgPSBmYWxzZSB9XG5cbiAgZ2V0IGxlYWQgKCk6IEZhbiB8IG51bGwgeyByZXR1cm4gdGhpcy5wYXJ0RmFuID8/IHRoaXMuZmFuc1swXSA/PyBudWxsIH1cbiAgZ2V0IGhlYWRsaW5lICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5sZWFkID8gYCR7dGhpcy5mYW5WYWx1ZSh0aGlzLmxlYWQpfSVgIDogJ+KAlCcgfVxuICBnZXQgaGVhZGxpbmVMYWJlbCAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMubGVhZCA9PT0gdGhpcy5wYXJ0RmFuID8gJ3BhcnQnIDogKHRoaXMubGVhZD8ucHJldHR5TmFtZSB8fCAnJykgfVxuXG4gIC8qKiBUaGUgcmVzdCwgaW4gd29yZHM6IGEgZmFuIHdlIGNhbiBzZXQgYnkgaXRzIHBlcmNlbnRhZ2UsIG9uZSB0aGUgcHJpbnRlciBydW5zIGJ5IGl0c2VsZiBvbiBvciBvZmYuICovXG4gIGdldCBvdGhlcnMgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmFucy5maWx0ZXIoZiA9PiBmICE9PSB0aGlzLmxlYWQpLnNsaWNlKDAsIDMpLm1hcChmID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBmLnByZXR0eU5hbWUgfHwgZi5uYW1lXG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZmFuVmFsdWUoZilcbiAgICAgIHJldHVybiBmLmNvbnRyb2xsYWJsZSA/IGAke25hbWV9ICR7dmFsdWV9JWAgOiBgJHtuYW1lfSAke3ZhbHVlID8gJ29uJyA6ICdvZmYnfWBcbiAgICB9KS5qb2luKCcgwrcgJykgfHwgJ05vIG90aGVyIGZhbnMnXG4gIH1cblxuICBnZXQgc2xpZGVycyAoKTogRmFuW10ge1xuICAgIC8vIFJhdyBwZXJjZW50YWdlIHNsaWRlcnMgYXJlIGRldmVsb3Blci1tb2RlIG9ubHk7IFByaW50IG1vZGUgKFF1aWV0LCBOb3JtYWwsIFR1cmJvKSBpcyB0aGUgZXZlcnlkYXkgY29udHJvbC5cbiAgICBpZiAodGhpcy5kZXZPbmx5TG9ja2VkKSByZXR1cm4gW11cbiAgICByZXR1cm4gdGhpcy5mYW5zLmZpbHRlcihmID0+IGYuY29udHJvbGxhYmxlICYmIChmLnR5cGUgPT09ICdmYW4nIHx8IGYudHlwZSA9PT0gJ2Zhbl9nZW5lcmljJykpXG4gIH1cblxuICBnZXQgcG93ZXJEZXZpY2VzICgpOiB1bmtub3duW10ge1xuICAgIGlmICghdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2NvbXBvbmVudFN1cHBvcnQnXT8uKCdwb3dlcicpKSByZXR1cm4gW11cbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Bvd2VyL2dldERldmljZXMnXSBhcyB1bmtub3duW10pID8/IFtdXG4gIH1cblxuICBwZXJjZW50VGV4dCAodmFsdWU6IG51bWJlcik6IHN0cmluZyB7IHJldHVybiBgJHt2YWx1ZX0gcGVyY2VudGAgfVxuXG4gIHRvZ2dsZSAoKSB7IGlmICh0aGlzLmZhbnMubGVuZ3RoKSB0aGlzLm9wZW4gPSAhdGhpcy5vcGVuIH1cblxuICBnZXQgbWVudSAoKTogVGlsZU1lbnVJdGVtW10ge1xuICAgIGNvbnN0IGl0ZW1zOiBUaWxlTWVudUl0ZW1bXSA9IFt7IGlkOiAnYWxsJywgbGFiZWw6ICdBbGwgZmFucyBhbmQgb3V0cHV0c+KApicsIGFjdGlvbjogKCkgPT4geyB0aGlzLmRpYWxvZyA9IHRydWUgfSB9XVxuICAgIGlmICh0aGlzLnBvd2VyRGV2aWNlcy5sZW5ndGgpIGl0ZW1zLnB1c2goeyBpZDogJ3Bvd2VyJywgbGFiZWw6ICdQb3dlciBkZXZpY2Vz4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy9zeXN0ZW0nKSB9KVxuICAgIHJldHVybiBpdGVtc1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4uZmFfX3BvcCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMTJweDsgfVxuLmZhX19yb3cgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDEycHg7IH1cbi5mYV9fbmFtZSB7IGZsZXg6IDAgMCA5MHB4OyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA1MDA7IH1cbi5mYV9fc2xpZGVyIHsgZmxleDogMSAxIGF1dG87IH1cbi5mYV9fcGN0IHsgbWluLXdpZHRoOiA0MHB4OyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtczsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvb3ZlcnZpZXcvdGlsZXMvRmFuc1RpbGUudnVlIn0=