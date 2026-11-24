/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import M3Dialog from "/src/components/ui/M3Dialog.vue";
import LockedRow from "/src/components/settings/gates/LockedRow.vue";
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import MaterialLibraryMixin from "/src/mixins/material-library.ts";
import { FILAMENT_COLOURS } from "/src/services/control/model.ts";
import { DEFAULT_MATERIALS, isDefaultMaterial } from "/src/store/config/default-materials.ts";
import { materialLibrary } from "/src/services/materials/library.ts";
import { samePin } from "/src/services/materials/pins.ts";
let sheets = 0;
const TYPES = ["PLA", "PETG", "ABS", "ASA", "TPU", "PA", "PC", "CF/GF", "Other"];
let PresetDialog = class extends Mixins(MuonGatesMixin, MaterialLibraryMixin) {
  value;
  preset;
  formId = `psheet-${++sheets}`;
  types = TYPES;
  colours = FILAMENT_COLOURS;
  draft = { id: -1, name: "", gcode: "", values: {} };
  fan = 100;
  tried = false;
  created() {
    this.draft = this.copy(this.preset);
    this.fan = this.preset.partFan ?? 100;
  }
  copy(preset) {
    const draft = JSON.parse(JSON.stringify(preset));
    draft.values = draft.values ?? {};
    for (const key of ["extruder", "heater_bed"]) {
      if (key === "heater_bed" && !this.hasHeater(key)) continue;
      if (!draft.values[key]) draft.values[key] = { value: 0, type: "heater", active: true };
    }
    draft.gcode = draft.gcode ?? "";
    draft.type = draft.type ?? (TYPES.includes(draft.name.toUpperCase()) ? draft.name.toUpperCase() : void 0);
    return draft;
  }
  hasHeater(name) {
    const heaters = this.$store.getters["printer/getHeaters"] ?? [];
    return !heaters.length || heaters.some((h) => h.name === name);
  }
  get isNew() {
    return this.preset.id === -1;
  }
  get isDefault() {
    return !this.isNew && isDefaultMaterial(this.preset);
  }
  get eyebrow() {
    if (this.isDefault) return `On ${this.printerLabel} \xB7 always there`;
    return this.isNew ? "Make my own" : "Your preset";
  }
  get canDelete() {
    return !this.isNew && !this.isDefault;
  }
  get canReset() {
    return !!this.draft.libraryId || this.isDefault;
  }
  /** On a Muon printer (or while that is still unknown) G-code is developer mode only. */
  get gcodeLocked() {
    return this.isMuonPrinter !== false && !this.devModeEnabled;
  }
  maxTemp(section) {
    const max = Number(this.$store.state.printer?.printer?.configfile?.settings?.[section]?.max_temp);
    return Number.isFinite(max) && max > 0 ? max : null;
  }
  get heaterRows() {
    return Object.keys(this.draft.values).filter((key) => this.draft.values[key].type === "heater").sort((a, b) => a === "extruder" ? -1 : b === "extruder" ? 1 : a === "heater_bed" ? -1 : b === "heater_bed" ? 1 : a.localeCompare(b)).map((key) => ({
      key,
      tid: key === "extruder" ? "nozzle" : key === "heater_bed" ? "plate" : key.replace(/\s+/g, "-"),
      label: key === "extruder" ? "Nozzle" : key === "heater_bed" ? "Plate" : key.replace(/^heater_generic /, ""),
      maker: (key === "extruder" ? this.draft.maker?.nozzle : key === "heater_bed" ? this.draft.maker?.bed : null) ?? null,
      limit: this.maxTemp(key)
    }));
  }
  limitError(h) {
    const v = this.draft.values[h.key].value;
    const empty = v === "" || v === null || !Number.isFinite(Number(v)) || Number(v) < 0 || h.key === "extruder" && Number(v) === 0;
    if (empty) return this.tried ? `${h.label}: enter a temperature` : "";
    if (h.limit !== null && Number(v) > h.limit) return `${this.printerLabel}'s ${h.label.toLowerCase()} tops out at ${h.limit}\xB0C.`;
    return "";
  }
  get fanError() {
    const v = Number(this.fan);
    return this.fan === "" || !Number.isFinite(v) || v < 0 || v > 100 ? "The part fan runs from 0 to 100%." : "";
  }
  get nameError() {
    const name = this.draft.name.trim();
    if (!name) return "";
    const clash = this.printerPresets.some((p) => String(p.id) !== String(this.preset.id) && samePin(p.name, name));
    return clash ? `${this.printerLabel} already has a material called ${name}.` : "";
  }
  get valid() {
    const filled = this.heaterRows.every((h) => {
      const v = this.draft.values[h.key].value;
      return v !== "" && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0 && !(h.key === "extruder" && Number(v) === 0);
    });
    return filled && !!this.draft.name.trim() && !this.nameError && !this.fanError && this.heaterRows.every((h) => !this.limitError(h));
  }
  sameColour(colour) {
    return (this.draft.colour ?? "").toLowerCase() === colour.toLowerCase();
  }
  async resetToTheirs() {
    const fallback = DEFAULT_MATERIALS.find((m) => samePin(m.name, this.preset.name));
    let nozzle = fallback?.nozzle;
    let bed = fallback?.bed;
    let fan = fallback?.fan;
    if (this.draft.libraryId) {
      try {
        const entry = (await materialLibrary.load()).find((e) => e.id === this.draft.libraryId);
        if (entry) ({ nozzle, bed, fan } = { nozzle: entry.nozzle.default, bed: entry.bed.default, fan: entry.fan });
      } catch {
      }
    }
    if (nozzle !== void 0 && this.draft.values.extruder) this.draft.values.extruder.value = nozzle;
    if (bed !== void 0 && this.draft.values.heater_bed) this.draft.values.heater_bed.value = bed;
    if (fan !== void 0) this.fan = fan;
  }
  close() {
    this.$emit("input", false);
  }
  async save() {
    this.tried = true;
    if (!this.valid) return;
    const preset = {
      ...this.draft,
      name: this.draft.name.trim(),
      partFan: Math.round(Number(this.fan)),
      origin: this.isDefault ? "default" : "own"
    };
    for (const key of Object.keys(preset.values)) preset.values[key].value = Math.round(Number(preset.values[key].value));
    if (!preset.gcode) delete preset.gcode;
    await this.savePreset(preset, this.isNew ? void 0 : this.preset.name);
    this.$emit("saved", preset);
    this.close();
  }
  async remove() {
    const ok = await this.$confirm(`${this.preset.name} is removed from ${this.printerLabel} and from the filament picker.`, {
      title: `Delete ${this.preset.name}?`,
      buttonTrueText: "Delete",
      danger: true
    });
    if (!ok) return;
    await this.deletePreset(this.preset);
    this.close();
  }
};
__decorateClass([
  Prop({ type: Boolean, required: true })
], PresetDialog.prototype, "value", 2);
__decorateClass([
  Prop({ type: Object, required: true })
], PresetDialog.prototype, "preset", 2);
PresetDialog = __decorateClass([
  Component({ components: { M3Dialog, LockedRow } })
], PresetDialog);
const _sfc_main = PresetDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "eyebrow": _vm.eyebrow, "title": _vm.draft.name || "New material", "max-width": "480", "data-tid": "preset-sheet" }, on: { "close": _vm.close }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_vm.canDelete ? _c("button", { staticClass: "cbtn cbtn--danger", attrs: { "type": "button", "data-tid": "preset-delete" }, on: { "click": _vm.remove } }, [_vm._v(" Delete ")]) : _vm._e(), _c("span", { staticClass: "m3-dlg__grow" }), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "form": _vm.formId, "data-tid": "preset-save" } }, [_vm._v(" Save ")])];
  }, proxy: true }]) }, [_c("form", { staticClass: "psheet", attrs: { "id": _vm.formId, "novalidate": "" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.save.apply(null, arguments);
  } } }, [_c("label", { staticClass: "psheet__field" }, [_c("span", { staticClass: "psheet__label" }, [_vm._v("Name")]), _c("input", { directives: [{ name: "model", rawName: "v-model.trim", value: _vm.draft.name, expression: "draft.name", modifiers: { "trim": true } }], staticClass: "psheet__input", attrs: { "type": "text", "autocomplete": "off", "readonly": _vm.isDefault, "data-tid": "preset-name" }, domProps: { "value": _vm.draft.name }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.draft, "name", $event.target.value.trim());
  }, "blur": function($event) {
    return _vm.$forceUpdate();
  } } })]), _vm.nameError || _vm.tried && !_vm.draft.name.trim() ? _c("p", { staticClass: "psheet__error", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.nameError || "Give it a name") + " ")]) : _vm._e(), _vm.draft.source ? _c("p", { staticClass: "psheet__source", attrs: { "data-tid": "preset-source" } }, [_vm._v(" From " + _vm._s(_vm.draft.source)), _vm.canReset ? [_vm._v(" \xB7 "), _c("button", { staticClass: "psheet__link", attrs: { "type": "button", "data-tid": "preset-reset" }, on: { "click": _vm.resetToTheirs } }, [_vm._v(" Reset to theirs ")])] : _vm._e()], 2) : _vm._e(), _c("div", { staticClass: "psheet__group" }, [_c("span", { staticClass: "psheet__label" }, [_vm._v("Type and colour")]), _c("div", { staticClass: "psheet__types", attrs: { "role": "radiogroup", "aria-label": "Type" } }, _vm._l(_vm.types, function(t) {
    return _c("button", { key: t, staticClass: "psheet__type", attrs: { "type": "button", "role": "radio", "aria-checked": _vm.draft.type === t ? "true" : "false", "data-tid": `preset-type-${t}` }, on: { "click": function($event) {
      _vm.draft.type = t;
    } } }, [_vm._v(" " + _vm._s(t) + " ")]);
  }), 0), _c("div", { staticClass: "psheet__colours", attrs: { "role": "radiogroup", "aria-label": "Colour" } }, _vm._l(_vm.colours, function(c) {
    return _c("button", { key: c.colour, staticClass: "psheet__colour", style: { background: c.colour }, attrs: { "type": "button", "role": "radio", "aria-label": c.name, "title": c.name, "aria-checked": _vm.sameColour(c.colour) ? "true" : "false" }, on: { "click": function($event) {
      _vm.draft.colour = c.colour;
    } } });
  }), 0)]), _vm._l(_vm.heaterRows, function(h) {
    return _c("div", { key: h.key, staticClass: "psheet__temp" }, [_c("label", { staticClass: "psheet__temp-label", attrs: { "for": `${_vm.formId}-${h.key}` } }, [_c("b", [_vm._v(_vm._s(h.label))]), h.maker ? _c("span", [_vm._v("Maker says " + _vm._s(h.maker[0]) + "\u2013" + _vm._s(h.maker[1]) + "\xB0")]) : _vm._e()]), _c("span", { staticClass: "psheet__num" }, [_c("input", { directives: [{ name: "model", rawName: "v-model.number", value: _vm.draft.values[h.key].value, expression: "draft.values[h.key].value", modifiers: { "number": true } }], staticClass: "psheet__input", attrs: { "id": `${_vm.formId}-${h.key}`, "type": "number", "inputmode": "numeric", "min": "0", "max": h.limit || void 0, "aria-invalid": _vm.limitError(h) ? "true" : "false", "data-tid": `preset-temp-${h.tid}` }, domProps: { "value": _vm.draft.values[h.key].value }, on: { "input": function($event) {
      if ($event.target.composing) return;
      _vm.$set(_vm.draft.values[h.key], "value", _vm._n($event.target.value));
    }, "blur": function($event) {
      return _vm.$forceUpdate();
    } } }), _c("span", { staticClass: "psheet__unit" }, [_vm._v("\xB0C")])]), _vm.limitError(h) ? _c("p", { staticClass: "psheet__error", attrs: { "role": "alert", "data-tid": `preset-limit-${h.tid}` } }, [_vm._v(" " + _vm._s(_vm.limitError(h)) + " ")]) : _vm._e()]);
  }), _c("div", { staticClass: "psheet__temp" }, [_c("label", { staticClass: "psheet__temp-label", attrs: { "for": `${_vm.formId}-fan` } }, [_c("b", [_vm._v("Part fan")])]), _c("span", { staticClass: "psheet__num" }, [_c("input", { directives: [{ name: "model", rawName: "v-model.number", value: _vm.fan, expression: "fan", modifiers: { "number": true } }], staticClass: "psheet__input", attrs: { "id": `${_vm.formId}-fan`, "type": "number", "inputmode": "numeric", "min": "0", "max": "100", "aria-invalid": _vm.fanError ? "true" : "false", "data-tid": "preset-fan" }, domProps: { "value": _vm.fan }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.fan = _vm._n($event.target.value);
  }, "blur": function($event) {
    return _vm.$forceUpdate();
  } } }), _c("span", { staticClass: "psheet__unit", attrs: { "data-tid": "preset-fan-unit" } }, [_vm._v("%")])]), _vm.fanError ? _c("p", { staticClass: "psheet__error", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.fanError) + " ")]) : _vm._e()]), _vm.gcodeLocked ? _c("locked-row", { attrs: { "label": "G-code when chosen", "lock": "developer-mode", "reason-text": "Developer mode only on Muon printers", "data-tid": "preset-gcode-locked" } }) : _c("label", { staticClass: "psheet__field" }, [_c("span", { staticClass: "psheet__label" }, [_vm._v("G-code when chosen")]), _c("textarea", { directives: [{ name: "model", rawName: "v-model", value: _vm.draft.gcode, expression: "draft.gcode" }], staticClass: "psheet__input psheet__gcode", attrs: { "rows": "3", "spellcheck": "false", "data-tid": "preset-gcode" }, domProps: { "value": _vm.draft.gcode }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.draft, "gcode", $event.target.value);
  } } })])], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/presets/PresetDialog.vue?vue&type=style&index=0&scoped=a5e71f41&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "a5e71f41",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/presets/PresetDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUE4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBVUE7QUFFQTtBQVVBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSwwQ0FDQSwwREFDQSxxSUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFFQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTlKQTtBQUFBLEVBREE7QUFBQSxHQURBLGFBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLGFBS0E7QUFMQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmVzZXREaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPG0zLWRpYWxvZ1xuICAgIDp2YWx1ZT1cInZhbHVlXCJcbiAgICA6ZXllYnJvdz1cImV5ZWJyb3dcIlxuICAgIDp0aXRsZT1cImRyYWZ0Lm5hbWUgfHwgJ05ldyBtYXRlcmlhbCdcIlxuICAgIG1heC13aWR0aD1cIjQ4MFwiXG4gICAgZGF0YS10aWQ9XCJwcmVzZXQtc2hlZXRcIlxuICAgIEBjbG9zZT1cImNsb3NlXCJcbiAgPlxuICAgIDxmb3JtXG4gICAgICA6aWQ9XCJmb3JtSWRcIlxuICAgICAgY2xhc3M9XCJwc2hlZXRcIlxuICAgICAgbm92YWxpZGF0ZVxuICAgICAgQHN1Ym1pdC5wcmV2ZW50PVwic2F2ZVwiXG4gICAgPlxuICAgICAgPGxhYmVsIGNsYXNzPVwicHNoZWV0X19maWVsZFwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInBzaGVldF9fbGFiZWxcIj5OYW1lPC9zcGFuPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICB2LW1vZGVsLnRyaW09XCJkcmFmdC5uYW1lXCJcbiAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgY2xhc3M9XCJwc2hlZXRfX2lucHV0XCJcbiAgICAgICAgICBhdXRvY29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgIDpyZWFkb25seT1cImlzRGVmYXVsdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwcmVzZXQtbmFtZVwiXG4gICAgICAgID5cbiAgICAgIDwvbGFiZWw+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwibmFtZUVycm9yIHx8ICh0cmllZCAmJiAhZHJhZnQubmFtZS50cmltKCkpXCJcbiAgICAgICAgY2xhc3M9XCJwc2hlZXRfX2Vycm9yXCJcbiAgICAgICAgcm9sZT1cImFsZXJ0XCJcbiAgICAgID5cbiAgICAgICAge3sgbmFtZUVycm9yIHx8ICdHaXZlIGl0IGEgbmFtZScgfX1cbiAgICAgIDwvcD5cblxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cImRyYWZ0LnNvdXJjZVwiXG4gICAgICAgIGNsYXNzPVwicHNoZWV0X19zb3VyY2VcIlxuICAgICAgICBkYXRhLXRpZD1cInByZXNldC1zb3VyY2VcIlxuICAgICAgPlxuICAgICAgICBGcm9tIHt7IGRyYWZ0LnNvdXJjZSB9fTx0ZW1wbGF0ZSB2LWlmPVwiY2FuUmVzZXRcIj5cbiAgICAgICAgICDCtyA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwicHNoZWV0X19saW5rXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwicHJlc2V0LXJlc2V0XCJcbiAgICAgICAgICAgIEBjbGljaz1cInJlc2V0VG9UaGVpcnNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFJlc2V0IHRvIHRoZWlyc1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgPC9wPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwicHNoZWV0X19ncm91cFwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInBzaGVldF9fbGFiZWxcIj5UeXBlIGFuZCBjb2xvdXI8L3NwYW4+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cInBzaGVldF9fdHlwZXNcIlxuICAgICAgICAgIHJvbGU9XCJyYWRpb2dyb3VwXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiVHlwZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cInQgaW4gdHlwZXNcIlxuICAgICAgICAgICAgOmtleT1cInRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICByb2xlPVwicmFkaW9cIlxuICAgICAgICAgICAgY2xhc3M9XCJwc2hlZXRfX3R5cGVcIlxuICAgICAgICAgICAgOmFyaWEtY2hlY2tlZD1cImRyYWZ0LnR5cGUgPT09IHQgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgIDpkYXRhLXRpZD1cImBwcmVzZXQtdHlwZS0ke3R9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJkcmFmdC50eXBlID0gdFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgdCB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwicHNoZWV0X19jb2xvdXJzXCJcbiAgICAgICAgICByb2xlPVwicmFkaW9ncm91cFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkNvbG91clwiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cImMgaW4gY29sb3Vyc1wiXG4gICAgICAgICAgICA6a2V5PVwiYy5jb2xvdXJcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICByb2xlPVwicmFkaW9cIlxuICAgICAgICAgICAgY2xhc3M9XCJwc2hlZXRfX2NvbG91clwiXG4gICAgICAgICAgICA6c3R5bGU9XCJ7IGJhY2tncm91bmQ6IGMuY29sb3VyIH1cIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJjLm5hbWVcIlxuICAgICAgICAgICAgOnRpdGxlPVwiYy5uYW1lXCJcbiAgICAgICAgICAgIDphcmlhLWNoZWNrZWQ9XCJzYW1lQ29sb3VyKGMuY29sb3VyKSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgQGNsaWNrPVwiZHJhZnQuY29sb3VyID0gYy5jb2xvdXJcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJoIGluIGhlYXRlclJvd3NcIlxuICAgICAgICA6a2V5PVwiaC5rZXlcIlxuICAgICAgICBjbGFzcz1cInBzaGVldF9fdGVtcFwiXG4gICAgICA+XG4gICAgICAgIDxsYWJlbFxuICAgICAgICAgIGNsYXNzPVwicHNoZWV0X190ZW1wLWxhYmVsXCJcbiAgICAgICAgICA6Zm9yPVwiYCR7Zm9ybUlkfS0ke2gua2V5fWBcIlxuICAgICAgICA+XG4gICAgICAgICAgPGI+e3sgaC5sYWJlbCB9fTwvYj5cbiAgICAgICAgICA8c3BhbiB2LWlmPVwiaC5tYWtlclwiPk1ha2VyIHNheXMge3sgaC5tYWtlclswXSB9feKAk3t7IGgubWFrZXJbMV0gfX3CsDwvc3Bhbj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJwc2hlZXRfX251bVwiPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgOmlkPVwiYCR7Zm9ybUlkfS0ke2gua2V5fWBcIlxuICAgICAgICAgICAgdi1tb2RlbC5udW1iZXI9XCJkcmFmdC52YWx1ZXNbaC5rZXldLnZhbHVlXCJcbiAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgaW5wdXRtb2RlPVwibnVtZXJpY1wiXG4gICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgIDptYXg9XCJoLmxpbWl0IHx8IHVuZGVmaW5lZFwiXG4gICAgICAgICAgICBjbGFzcz1cInBzaGVldF9faW5wdXRcIlxuICAgICAgICAgICAgOmFyaWEtaW52YWxpZD1cImxpbWl0RXJyb3IoaCkgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgIDpkYXRhLXRpZD1cImBwcmVzZXQtdGVtcC0ke2gudGlkfWBcIlxuICAgICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBzaGVldF9fdW5pdFwiPsKwQzwvc3Bhbj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJsaW1pdEVycm9yKGgpXCJcbiAgICAgICAgICBjbGFzcz1cInBzaGVldF9fZXJyb3JcIlxuICAgICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYHByZXNldC1saW1pdC0ke2gudGlkfWBcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgbGltaXRFcnJvcihoKSB9fVxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cInBzaGVldF9fdGVtcFwiPlxuICAgICAgICA8bGFiZWxcbiAgICAgICAgICBjbGFzcz1cInBzaGVldF9fdGVtcC1sYWJlbFwiXG4gICAgICAgICAgOmZvcj1cImAke2Zvcm1JZH0tZmFuYFwiXG4gICAgICAgID5cbiAgICAgICAgICA8Yj5QYXJ0IGZhbjwvYj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJwc2hlZXRfX251bVwiPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgOmlkPVwiYCR7Zm9ybUlkfS1mYW5gXCJcbiAgICAgICAgICAgIHYtbW9kZWwubnVtYmVyPVwiZmFuXCJcbiAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgaW5wdXRtb2RlPVwibnVtZXJpY1wiXG4gICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgIG1heD1cIjEwMFwiXG4gICAgICAgICAgICBjbGFzcz1cInBzaGVldF9faW5wdXRcIlxuICAgICAgICAgICAgOmFyaWEtaW52YWxpZD1cImZhbkVycm9yID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInByZXNldC1mYW5cIlxuICAgICAgICAgID5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJwc2hlZXRfX3VuaXRcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJwcmVzZXQtZmFuLXVuaXRcIlxuICAgICAgICAgID4lPC9zcGFuPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cImZhbkVycm9yXCJcbiAgICAgICAgICBjbGFzcz1cInBzaGVldF9fZXJyb3JcIlxuICAgICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBmYW5FcnJvciB9fVxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGxvY2tlZC1yb3dcbiAgICAgICAgdi1pZj1cImdjb2RlTG9ja2VkXCJcbiAgICAgICAgbGFiZWw9XCJHLWNvZGUgd2hlbiBjaG9zZW5cIlxuICAgICAgICBsb2NrPVwiZGV2ZWxvcGVyLW1vZGVcIlxuICAgICAgICByZWFzb24tdGV4dD1cIkRldmVsb3BlciBtb2RlIG9ubHkgb24gTXVvbiBwcmludGVyc1wiXG4gICAgICAgIGRhdGEtdGlkPVwicHJlc2V0LWdjb2RlLWxvY2tlZFwiXG4gICAgICAvPlxuICAgICAgPGxhYmVsXG4gICAgICAgIHYtZWxzZVxuICAgICAgICBjbGFzcz1cInBzaGVldF9fZmllbGRcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInBzaGVldF9fbGFiZWxcIj5HLWNvZGUgd2hlbiBjaG9zZW48L3NwYW4+XG4gICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgIHYtbW9kZWw9XCJkcmFmdC5nY29kZVwiXG4gICAgICAgICAgY2xhc3M9XCJwc2hlZXRfX2lucHV0IHBzaGVldF9fZ2NvZGVcIlxuICAgICAgICAgIHJvd3M9XCIzXCJcbiAgICAgICAgICBzcGVsbGNoZWNrPVwiZmFsc2VcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicHJlc2V0LWdjb2RlXCJcbiAgICAgICAgLz5cbiAgICAgIDwvbGFiZWw+XG4gICAgPC9mb3JtPlxuXG4gICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWlmPVwiY2FuRGVsZXRlXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1kYW5nZXJcIlxuICAgICAgICBkYXRhLXRpZD1cInByZXNldC1kZWxldGVcIlxuICAgICAgICBAY2xpY2s9XCJyZW1vdmVcIlxuICAgICAgPlxuICAgICAgICBEZWxldGVcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHNwYW4gY2xhc3M9XCJtMy1kbGdfX2dyb3dcIiAvPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICA6Zm9ybT1cImZvcm1JZFwiXG4gICAgICAgIGRhdGEtdGlkPVwicHJlc2V0LXNhdmVcIlxuICAgICAgPlxuICAgICAgICBTYXZlXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L20zLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTTNEaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL3VpL00zRGlhbG9nLnZ1ZSdcbmltcG9ydCBMb2NrZWRSb3cgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL2dhdGVzL0xvY2tlZFJvdy52dWUnXG5pbXBvcnQgTXVvbkdhdGVzTWl4aW4gZnJvbSAnQC9taXhpbnMvbXVvbi1nYXRlcydcbmltcG9ydCBNYXRlcmlhbExpYnJhcnlNaXhpbiBmcm9tICdAL21peGlucy9tYXRlcmlhbC1saWJyYXJ5J1xuaW1wb3J0IHR5cGUgeyBUZW1wZXJhdHVyZVByZXNldCB9IGZyb20gJ0Avc3RvcmUvY29uZmlnL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBIZWF0ZXIgfSBmcm9tICdAL3N0b3JlL3ByaW50ZXIvdHlwZXMnXG5pbXBvcnQgeyBGSUxBTUVOVF9DT0xPVVJTIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL21vZGVsJ1xuaW1wb3J0IHsgREVGQVVMVF9NQVRFUklBTFMsIGlzRGVmYXVsdE1hdGVyaWFsIH0gZnJvbSAnQC9zdG9yZS9jb25maWcvZGVmYXVsdC1tYXRlcmlhbHMnXG5pbXBvcnQgeyBtYXRlcmlhbExpYnJhcnkgfSBmcm9tICdAL3NlcnZpY2VzL21hdGVyaWFscy9saWJyYXJ5J1xuaW1wb3J0IHsgc2FtZVBpbiB9IGZyb20gJ0Avc2VydmljZXMvbWF0ZXJpYWxzL3BpbnMnXG5cbmludGVyZmFjZSBIZWF0ZXJSb3cge1xuICBrZXk6IHN0cmluZztcbiAgdGlkOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIG1ha2VyOiBbbnVtYmVyLCBudW1iZXJdIHwgbnVsbDtcbiAgbGltaXQ6IG51bWJlciB8IG51bGw7XG59XG5cbmxldCBzaGVldHMgPSAwXG5cbmNvbnN0IFRZUEVTID0gWydQTEEnLCAnUEVURycsICdBQlMnLCAnQVNBJywgJ1RQVScsICdQQScsICdQQycsICdDRi9HRicsICdPdGhlciddXG5cbi8qKlxuICogQSBtYXRlcmlhbCdzIG93biBzaGVldCAoU2V0dGluZ3Mg4oC6IE1hdGVyaWFscywgZnJhbWUgMik6IGl0cyBuYW1lLCB3aGVyZSBpdFxuICogY2FtZSBmcm9tLCB0eXBlIGFuZCBjb2xvdXIsIG5venpsZSBhbmQgcGxhdGUgYWdhaW5zdCB0aGUgbWFrZXIncyByYW5nZSxcbiAqIHRoZSBwYXJ0IGZhbiBpbiAlLCBhbmQgdGhlIEctY29kZSBpdCBzZW5kcyB3aGVuIGNob3Nlbi4gVGVtcGVyYXR1cmVzIGFib3ZlXG4gKiB0aGUgcHJpbnRlcidzIG93biBtYXhfdGVtcCBhcmUgcmVmdXNlZCB3aXRoIHRoZSBsaW1pdCBzaG93bi4gUmF3IEctY29kZVxuICogY2FuIG1vdmUgb3IgaGVhdCBhbnl0aGluZywgc28gb24gYSBNdW9uIHByaW50ZXIgaXQgaXMgZGV2ZWxvcGVyIG1vZGUgb25seS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTTNEaWFsb2csIExvY2tlZFJvdyB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmVzZXREaWFsb2cgZXh0ZW5kcyBNaXhpbnMoTXVvbkdhdGVzTWl4aW4sIE1hdGVyaWFsTGlicmFyeU1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgdmFsdWUhOiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHByZXNldCE6IFRlbXBlcmF0dXJlUHJlc2V0XG5cbiAgZm9ybUlkID0gYHBzaGVldC0keysrc2hlZXRzfWBcbiAgdHlwZXMgPSBUWVBFU1xuICBjb2xvdXJzID0gRklMQU1FTlRfQ09MT1VSU1xuICBkcmFmdDogVGVtcGVyYXR1cmVQcmVzZXQgPSB7IGlkOiAtMSwgbmFtZTogJycsIGdjb2RlOiAnJywgdmFsdWVzOiB7fSB9XG4gIGZhbjogbnVtYmVyIHwgJycgPSAxMDBcbiAgdHJpZWQgPSBmYWxzZVxuXG4gIGNyZWF0ZWQgKCkge1xuICAgIHRoaXMuZHJhZnQgPSB0aGlzLmNvcHkodGhpcy5wcmVzZXQpXG4gICAgdGhpcy5mYW4gPSB0aGlzLnByZXNldC5wYXJ0RmFuID8/IDEwMFxuICB9XG5cbiAgY29weSAocHJlc2V0OiBUZW1wZXJhdHVyZVByZXNldCk6IFRlbXBlcmF0dXJlUHJlc2V0IHtcbiAgICBjb25zdCBkcmFmdDogVGVtcGVyYXR1cmVQcmVzZXQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHByZXNldCkpXG4gICAgZHJhZnQudmFsdWVzID0gZHJhZnQudmFsdWVzID8/IHt9XG4gICAgZm9yIChjb25zdCBrZXkgb2YgWydleHRydWRlcicsICdoZWF0ZXJfYmVkJ10pIHtcbiAgICAgIGlmIChrZXkgPT09ICdoZWF0ZXJfYmVkJyAmJiAhdGhpcy5oYXNIZWF0ZXIoa2V5KSkgY29udGludWVcbiAgICAgIGlmICghZHJhZnQudmFsdWVzW2tleV0pIGRyYWZ0LnZhbHVlc1trZXldID0geyB2YWx1ZTogMCwgdHlwZTogJ2hlYXRlcicsIGFjdGl2ZTogdHJ1ZSB9XG4gICAgfVxuICAgIGRyYWZ0Lmdjb2RlID0gZHJhZnQuZ2NvZGUgPz8gJydcbiAgICBkcmFmdC50eXBlID0gZHJhZnQudHlwZSA/PyAoVFlQRVMuaW5jbHVkZXMoZHJhZnQubmFtZS50b1VwcGVyQ2FzZSgpKSA/IGRyYWZ0Lm5hbWUudG9VcHBlckNhc2UoKSA6IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZHJhZnRcbiAgfVxuXG4gIGhhc0hlYXRlciAobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaGVhdGVycyA9ICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEhlYXRlcnMnXSBhcyBIZWF0ZXJbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgICByZXR1cm4gIWhlYXRlcnMubGVuZ3RoIHx8IGhlYXRlcnMuc29tZShoID0+IGgubmFtZSA9PT0gbmFtZSlcbiAgfVxuXG4gIGdldCBpc05ldyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucHJlc2V0LmlkID09PSAtMVxuICB9XG5cbiAgZ2V0IGlzRGVmYXVsdCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLmlzTmV3ICYmIGlzRGVmYXVsdE1hdGVyaWFsKHRoaXMucHJlc2V0KVxuICB9XG5cbiAgZ2V0IGV5ZWJyb3cgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuaXNEZWZhdWx0KSByZXR1cm4gYE9uICR7dGhpcy5wcmludGVyTGFiZWx9IMK3IGFsd2F5cyB0aGVyZWBcbiAgICByZXR1cm4gdGhpcy5pc05ldyA/ICdNYWtlIG15IG93bicgOiAnWW91ciBwcmVzZXQnXG4gIH1cblxuICBnZXQgY2FuRGVsZXRlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuaXNOZXcgJiYgIXRoaXMuaXNEZWZhdWx0XG4gIH1cblxuICBnZXQgY2FuUmVzZXQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZHJhZnQubGlicmFyeUlkIHx8IHRoaXMuaXNEZWZhdWx0XG4gIH1cblxuICAvKiogT24gYSBNdW9uIHByaW50ZXIgKG9yIHdoaWxlIHRoYXQgaXMgc3RpbGwgdW5rbm93bikgRy1jb2RlIGlzIGRldmVsb3BlciBtb2RlIG9ubHkuICovXG4gIGdldCBnY29kZUxvY2tlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNNdW9uUHJpbnRlciAhPT0gZmFsc2UgJiYgIXRoaXMuZGV2TW9kZUVuYWJsZWRcbiAgfVxuXG4gIG1heFRlbXAgKHNlY3Rpb246IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICAgIGNvbnN0IG1heCA9IE51bWJlcih0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyPy5wcmludGVyPy5jb25maWdmaWxlPy5zZXR0aW5ncz8uW3NlY3Rpb25dPy5tYXhfdGVtcClcbiAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKG1heCkgJiYgbWF4ID4gMCA/IG1heCA6IG51bGxcbiAgfVxuXG4gIGdldCBoZWF0ZXJSb3dzICgpOiBIZWF0ZXJSb3dbXSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZHJhZnQudmFsdWVzKVxuICAgICAgLmZpbHRlcihrZXkgPT4gdGhpcy5kcmFmdC52YWx1ZXNba2V5XS50eXBlID09PSAnaGVhdGVyJylcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYSA9PT0gJ2V4dHJ1ZGVyJyA/IC0xIDogYiA9PT0gJ2V4dHJ1ZGVyJyA/IDEgOiBhID09PSAnaGVhdGVyX2JlZCcgPyAtMSA6IGIgPT09ICdoZWF0ZXJfYmVkJyA/IDEgOiBhLmxvY2FsZUNvbXBhcmUoYikpKVxuICAgICAgLm1hcChrZXkgPT4gKHtcbiAgICAgICAga2V5LFxuICAgICAgICB0aWQ6IGtleSA9PT0gJ2V4dHJ1ZGVyJyA/ICdub3p6bGUnIDoga2V5ID09PSAnaGVhdGVyX2JlZCcgPyAncGxhdGUnIDoga2V5LnJlcGxhY2UoL1xccysvZywgJy0nKSxcbiAgICAgICAgbGFiZWw6IGtleSA9PT0gJ2V4dHJ1ZGVyJyA/ICdOb3p6bGUnIDoga2V5ID09PSAnaGVhdGVyX2JlZCcgPyAnUGxhdGUnIDoga2V5LnJlcGxhY2UoL15oZWF0ZXJfZ2VuZXJpYyAvLCAnJyksXG4gICAgICAgIG1ha2VyOiAoa2V5ID09PSAnZXh0cnVkZXInID8gdGhpcy5kcmFmdC5tYWtlcj8ubm96emxlIDoga2V5ID09PSAnaGVhdGVyX2JlZCcgPyB0aGlzLmRyYWZ0Lm1ha2VyPy5iZWQgOiBudWxsKSA/PyBudWxsLFxuICAgICAgICBsaW1pdDogdGhpcy5tYXhUZW1wKGtleSlcbiAgICAgIH0pKVxuICB9XG5cbiAgbGltaXRFcnJvciAoaDogSGVhdGVyUm93KTogc3RyaW5nIHtcbiAgICBjb25zdCB2ID0gdGhpcy5kcmFmdC52YWx1ZXNbaC5rZXldLnZhbHVlIGFzIG51bWJlciB8IHN0cmluZ1xuICAgIGNvbnN0IGVtcHR5ID0gdiA9PT0gJycgfHwgdiA9PT0gbnVsbCB8fCAhTnVtYmVyLmlzRmluaXRlKE51bWJlcih2KSkgfHwgTnVtYmVyKHYpIDwgMCB8fCAoaC5rZXkgPT09ICdleHRydWRlcicgJiYgTnVtYmVyKHYpID09PSAwKVxuICAgIGlmIChlbXB0eSkgcmV0dXJuIHRoaXMudHJpZWQgPyBgJHtoLmxhYmVsfTogZW50ZXIgYSB0ZW1wZXJhdHVyZWAgOiAnJ1xuICAgIGlmIChoLmxpbWl0ICE9PSBudWxsICYmIE51bWJlcih2KSA+IGgubGltaXQpIHJldHVybiBgJHt0aGlzLnByaW50ZXJMYWJlbH0ncyAke2gubGFiZWwudG9Mb3dlckNhc2UoKX0gdG9wcyBvdXQgYXQgJHtoLmxpbWl0fcKwQy5gXG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBnZXQgZmFuRXJyb3IgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgdiA9IE51bWJlcih0aGlzLmZhbilcbiAgICByZXR1cm4gdGhpcy5mYW4gPT09ICcnIHx8ICFOdW1iZXIuaXNGaW5pdGUodikgfHwgdiA8IDAgfHwgdiA+IDEwMCA/ICdUaGUgcGFydCBmYW4gcnVucyBmcm9tIDAgdG8gMTAwJS4nIDogJydcbiAgfVxuXG4gIGdldCBuYW1lRXJyb3IgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMuZHJhZnQubmFtZS50cmltKClcbiAgICBpZiAoIW5hbWUpIHJldHVybiAnJ1xuICAgIGNvbnN0IGNsYXNoID0gdGhpcy5wcmludGVyUHJlc2V0cy5zb21lKHAgPT4gU3RyaW5nKHAuaWQpICE9PSBTdHJpbmcodGhpcy5wcmVzZXQuaWQpICYmIHNhbWVQaW4ocC5uYW1lLCBuYW1lKSlcbiAgICByZXR1cm4gY2xhc2ggPyBgJHt0aGlzLnByaW50ZXJMYWJlbH0gYWxyZWFkeSBoYXMgYSBtYXRlcmlhbCBjYWxsZWQgJHtuYW1lfS5gIDogJydcbiAgfVxuXG4gIGdldCB2YWxpZCAoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmlsbGVkID0gdGhpcy5oZWF0ZXJSb3dzLmV2ZXJ5KGggPT4ge1xuICAgICAgY29uc3QgdiA9IHRoaXMuZHJhZnQudmFsdWVzW2gua2V5XS52YWx1ZSBhcyBudW1iZXIgfCBzdHJpbmdcbiAgICAgIHJldHVybiB2ICE9PSAnJyAmJiB2ICE9PSBudWxsICYmIE51bWJlci5pc0Zpbml0ZShOdW1iZXIodikpICYmIE51bWJlcih2KSA+PSAwICYmICEoaC5rZXkgPT09ICdleHRydWRlcicgJiYgTnVtYmVyKHYpID09PSAwKVxuICAgIH0pXG4gICAgcmV0dXJuIGZpbGxlZCAmJiAhIXRoaXMuZHJhZnQubmFtZS50cmltKCkgJiYgIXRoaXMubmFtZUVycm9yICYmICF0aGlzLmZhbkVycm9yICYmIHRoaXMuaGVhdGVyUm93cy5ldmVyeShoID0+ICF0aGlzLmxpbWl0RXJyb3IoaCkpXG4gIH1cblxuICBzYW1lQ29sb3VyIChjb2xvdXI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5kcmFmdC5jb2xvdXIgPz8gJycpLnRvTG93ZXJDYXNlKCkgPT09IGNvbG91ci50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBhc3luYyByZXNldFRvVGhlaXJzICgpIHtcbiAgICBjb25zdCBmYWxsYmFjayA9IERFRkFVTFRfTUFURVJJQUxTLmZpbmQobSA9PiBzYW1lUGluKG0ubmFtZSwgdGhpcy5wcmVzZXQubmFtZSkpXG4gICAgbGV0IG5venpsZSA9IGZhbGxiYWNrPy5ub3p6bGVcbiAgICBsZXQgYmVkID0gZmFsbGJhY2s/LmJlZFxuICAgIGxldCBmYW4gPSBmYWxsYmFjaz8uZmFuXG4gICAgaWYgKHRoaXMuZHJhZnQubGlicmFyeUlkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBlbnRyeSA9IChhd2FpdCBtYXRlcmlhbExpYnJhcnkubG9hZCgpKS5maW5kKGUgPT4gZS5pZCA9PT0gdGhpcy5kcmFmdC5saWJyYXJ5SWQpXG4gICAgICAgIGlmIChlbnRyeSkgKHsgbm96emxlLCBiZWQsIGZhbiB9ID0geyBub3p6bGU6IGVudHJ5Lm5venpsZS5kZWZhdWx0LCBiZWQ6IGVudHJ5LmJlZC5kZWZhdWx0LCBmYW46IGVudHJ5LmZhbiB9KVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIE9mZmxpbmU6IGtlZXAgd2hhdCB0aGUgcHJpbnRlciBoYXMuXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChub3p6bGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRyYWZ0LnZhbHVlcy5leHRydWRlcikgdGhpcy5kcmFmdC52YWx1ZXMuZXh0cnVkZXIudmFsdWUgPSBub3p6bGVcbiAgICBpZiAoYmVkICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kcmFmdC52YWx1ZXMuaGVhdGVyX2JlZCkgdGhpcy5kcmFmdC52YWx1ZXMuaGVhdGVyX2JlZC52YWx1ZSA9IGJlZFxuICAgIGlmIChmYW4gIT09IHVuZGVmaW5lZCkgdGhpcy5mYW4gPSBmYW5cbiAgfVxuXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLiRlbWl0KCdpbnB1dCcsIGZhbHNlKVxuICB9XG5cbiAgYXN5bmMgc2F2ZSAoKSB7XG4gICAgdGhpcy50cmllZCA9IHRydWVcbiAgICBpZiAoIXRoaXMudmFsaWQpIHJldHVyblxuICAgIGNvbnN0IHByZXNldDogVGVtcGVyYXR1cmVQcmVzZXQgPSB7XG4gICAgICAuLi50aGlzLmRyYWZ0LFxuICAgICAgbmFtZTogdGhpcy5kcmFmdC5uYW1lLnRyaW0oKSxcbiAgICAgIHBhcnRGYW46IE1hdGgucm91bmQoTnVtYmVyKHRoaXMuZmFuKSksXG4gICAgICBvcmlnaW46IHRoaXMuaXNEZWZhdWx0ID8gJ2RlZmF1bHQnIDogJ293bidcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocHJlc2V0LnZhbHVlcykpIHByZXNldC52YWx1ZXNba2V5XS52YWx1ZSA9IE1hdGgucm91bmQoTnVtYmVyKHByZXNldC52YWx1ZXNba2V5XS52YWx1ZSkpXG4gICAgaWYgKCFwcmVzZXQuZ2NvZGUpIGRlbGV0ZSBwcmVzZXQuZ2NvZGVcbiAgICBhd2FpdCB0aGlzLnNhdmVQcmVzZXQocHJlc2V0LCB0aGlzLmlzTmV3ID8gdW5kZWZpbmVkIDogdGhpcy5wcmVzZXQubmFtZSlcbiAgICB0aGlzLiRlbWl0KCdzYXZlZCcsIHByZXNldClcbiAgICB0aGlzLmNsb3NlKClcbiAgfVxuXG4gIGFzeW5jIHJlbW92ZSAoKSB7XG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLiRjb25maXJtKGAke3RoaXMucHJlc2V0Lm5hbWV9IGlzIHJlbW92ZWQgZnJvbSAke3RoaXMucHJpbnRlckxhYmVsfSBhbmQgZnJvbSB0aGUgZmlsYW1lbnQgcGlja2VyLmAsIHtcbiAgICAgIHRpdGxlOiBgRGVsZXRlICR7dGhpcy5wcmVzZXQubmFtZX0/YCxcbiAgICAgIGJ1dHRvblRydWVUZXh0OiAnRGVsZXRlJyxcbiAgICAgIGRhbmdlcjogdHJ1ZVxuICAgIH0pXG4gICAgaWYgKCFvaykgcmV0dXJuXG4gICAgYXdhaXQgdGhpcy5kZWxldGVQcmVzZXQodGhpcy5wcmVzZXQpXG4gICAgdGhpcy5jbG9zZSgpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5wc2hlZXQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE0cHg7XG4gIH1cblxuICAucHNoZWV0X19maWVsZCxcbiAgLnBzaGVldF9fZ3JvdXAge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDZweDtcbiAgfVxuXG4gIC5wc2hlZXRfX2xhYmVsIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLnBzaGVldF9faW5wdXQge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIG1pbi1oZWlnaHQ6IDQwcHg7XG4gICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQ6IGluaGVyaXQ7XG5cbiAgICAmW2FyaWEtaW52YWxpZD1cInRydWVcIl0ge1xuICAgICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTtcbiAgICB9XG4gIH1cblxuICAucHNoZWV0X19nY29kZSB7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8sIG1vbm9zcGFjZSk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLnBzaGVldF9fc291cmNlIHtcbiAgICBtYXJnaW46IC02cHggMCAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLnBzaGVldF9fbGluayB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAucHNoZWV0X190eXBlcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiA2cHg7XG4gIH1cblxuICAucHNoZWV0X190eXBlIHtcbiAgICBtaW4taGVpZ2h0OiAzMnB4O1xuICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1tM2QtcmFkaXVzLXBpbGwpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuXG4gICAgJlthcmlhLWNoZWNrZWQ9XCJ0cnVlXCJdIHtcbiAgICAgIGJvcmRlci1jb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuICB9XG5cbiAgLnBzaGVldF9fY29sb3VycyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgyOHB4LCAxZnIpKTtcbiAgICBnYXA6IDZweDtcbiAgfVxuXG4gIC5wc2hlZXRfX2NvbG91ciB7XG4gICAgYXNwZWN0LXJhdGlvOiAxO1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuXG4gICAgJlthcmlhLWNoZWNrZWQ9XCJ0cnVlXCJdIHtcbiAgICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyksIDAgMCAwIDJweCB2YXIoLS1tM2Qtc3VyZmFjZSksIDAgMCAwIDRweCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICB9XG4gIH1cblxuICAucHNoZWV0X190ZW1wIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDEyMHB4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA0cHggMTJweDtcblxuICAgIC5wc2hlZXRfX2Vycm9yIHtcbiAgICAgIGdyaWQtY29sdW1uOiAxIC8gLTE7XG4gICAgfVxuICB9XG5cbiAgLnBzaGVldF9fdGVtcC1sYWJlbCB7XG4gICAgYiB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5wc2hlZXRfX251bSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuXG4gICAgLnBzaGVldF9faW5wdXQge1xuICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLnBzaGVldF9fdW5pdCB7XG4gICAgZmxleDogbm9uZTtcbiAgICBtaW4td2lkdGg6IDIycHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAucHNoZWV0X19lcnJvciB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9wcmVzZXRzL1ByZXNldERpYWxvZy52dWUifQ==