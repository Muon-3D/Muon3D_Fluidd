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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import CanManageAccess from "/src/components/settings/gates/CanManageAccess.vue";
import LockedRow from "/src/components/settings/gates/LockedRow.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import { couldHaveSecureAddress, setSwitchesAutomatically, switchesAutomatically } from "/src/services/secure-origin/index.ts";
import {
  changeOutcome,
  outcomeNote,
  parsePermissions,
  permissionsPath,
  switchOutcome,
  switchPath,
  valueLabel
} from "/src/services/permissions/api.ts";
import { PRESETS, currentPreset, planFor, presetLabel } from "/src/services/permissions/presets.ts";
import { keep } from "/src/services/gates/state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
let SecuritySettings = class extends Mixins(MuonGatesMixin) {
  knobs = null;
  switches = [];
  claimed = null;
  loaded = false;
  saving = "";
  notes = {};
  valueLabel = valueLabel;
  presets = PRESETS;
  presetNote = "";
  /** This browser's choice, not the printer's: it means nothing on a page the console serves. */
  printerPage = couldHaveSecureAddress();
  autoSwitch = switchesAutomatically();
  onAutoSwitch(on) {
    setSwitchesAutomatically(on);
    this.autoSwitch = switchesAutomatically();
  }
  /**
   * What the printer reports as its defaults, in a sentence: said only when
   * the settings that report one agree (train 12 printers report
   * owner_and_shared, train 13 anyone); mixed or missing says nothing.
   */
  get defaultsLine() {
    const defaults = this.rows.map((k) => k.defaultValue).filter((d) => !!d);
    if (!defaults.length || new Set(defaults).size !== 1) return "";
    return defaults[0] === "anyone" ? "Anyone may do each of these by default." : `${valueLabel(defaults[0])} by default.`;
  }
  /** Which preset the printer's settings are, worked out from them each time. */
  get presetNow() {
    return currentPreset(this.knobs);
  }
  get presetWords() {
    return this.presetNow ? presetLabel(this.presetNow) : "";
  }
  get presetBlurb() {
    if (this.presetNow === "custom") return "The settings below are not one of the three presets.";
    return PRESETS.find((p) => p.id === this.presetNow)?.blurb ?? "";
  }
  /**
   * Sets every setting the preset names that differs, one after another, then
   * reads the printer's list again: what it kept is what shows. A setting the
   * printer needs a knob press for, or refuses, is said below.
   */
  async applyPreset(id) {
    if (this.saving || !this.knobs) return;
    const plan = planFor(id, this.knobs);
    this.presetNote = "";
    if (!plan.length) return;
    this.saving = "preset";
    const notes = [];
    try {
      for (const change of plan) {
        const r = await this.$httpClient.post(permissionsPath(this.managed), change, { validateStatus: () => true });
        const o = changeOutcome(r.status, r.data);
        if (o.kind === "knob" || o.kind === "refused") {
          const label = this.knobs.find((k) => k.id === change.id)?.label ?? change.id;
          notes.push(`${label}: ${outcomeNote(o)}`);
        }
      }
    } catch {
      notes.push("The printer didn't answer. Try again.");
    } finally {
      this.saving = "";
      await this.load();
      this.presetNote = notes.join(" ");
    }
  }
  get claimedLine() {
    const head = this.claimed ? "A claimed printer" : "An open printer";
    return `${this.defaultsLine ? `${head}: ${this.defaultsLine}` : `${head}.`} The owner can restrict each one.`;
  }
  mounted() {
    if (this.isMuonPrinter === true) this.load();
  }
  onMuon(muon) {
    if (muon === true && !this.loaded) this.load();
  }
  get managed() {
    return isManagedApiUrl(this.$store.state.config.apiUrl);
  }
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  /** The settings a session may change or look at, in the printer's order; the fixed ones are under "Confirmed at the printer". */
  get rows() {
    return (this.knobs || []).filter((k) => !k.fixed);
  }
  get fixedRows() {
    return (this.knobs || []).filter((k) => k.fixed);
  }
  defaultLine(k) {
    const base = k.defaultValue === "anyone" ? "Open by default." : `Default: ${valueLabel(k.defaultValue)}.`;
    return k.value === k.defaultValue ? base : `${base} Now set to ${valueLabel(k.value)}.`;
  }
  async load() {
    try {
      const r = await this.$httpClient.get(permissionsPath(this.managed), { validateStatus: () => true });
      const list = r.status >= 200 && r.status < 300 ? parsePermissions(r.data) : null;
      this.knobs = list ? list.knobs : null;
      this.switches = list ? list.switches : [];
      this.claimed = list ? list.claimed : null;
      const key = activeSlug();
      if (key !== null && list) keep("perms", key, Object.fromEntries(list.knobs.map((k) => [k.id, k.value])));
    } catch {
      this.knobs = null;
    } finally {
      this.loaded = true;
    }
  }
  reasonFor(k) {
    if (k.generic) return "Shown as the printer reports it. Change it at the printer.";
    if (k.readOnly) return "You can't change this one.";
    if (this.canManageAccess === false) return "Only the printer's owner can change this.";
    return "Checking whether you can change this\u2026";
  }
  switchReason(sw) {
    if (sw.readOnly || this.canManageAccess === false) return "Only the printer's owner can change this.";
    return "Checking whether you can change this\u2026";
  }
  onSelect(k, e) {
    this.change(k, e.target.value);
  }
  async change(k, value) {
    if (this.saving || value === k.value) return;
    this.saving = k.id;
    this.$set(this.notes, k.id, "");
    try {
      const r = await this.$httpClient.post(permissionsPath(this.managed), { id: k.id, value }, { validateStatus: () => true });
      const o = changeOutcome(r.status, r.data);
      if (o.kind === "applied" && o.knob?.id === k.id) {
        const kept = { ...o.knob, defaultValue: k.defaultValue };
        this.knobs = (this.knobs ?? []).map((x) => x.id === k.id ? kept : x);
      } else if (o.kind === "applied") {
        await this.load();
      } else {
        this.$set(this.notes, k.id, outcomeNote(o));
      }
    } catch {
      this.$set(this.notes, k.id, "The printer didn't answer. Try again.");
    } finally {
      this.saving = "";
      this.knobs = this.knobs ? [...this.knobs] : null;
    }
  }
  async onSwitch(sw, value) {
    if (this.saving || value === sw.value) return;
    const key = `switch:${sw.id}`;
    this.saving = key;
    this.$set(this.notes, key, "");
    try {
      const r = await this.$httpClient.post(switchPath(this.managed), { id: sw.id, value }, { validateStatus: () => true });
      const o = switchOutcome(r.status, r.data);
      if (o.kind === "switch" && o.value?.id === sw.id) {
        const kept = o.value;
        this.switches = this.switches.map((x) => x.id === sw.id ? { ...kept, defaultValue: kept.defaultValue ?? x.defaultValue } : x);
      } else if (o.kind === "switch") {
        await this.load();
      } else {
        this.$set(this.notes, key, outcomeNote(o));
      }
    } catch {
      this.$set(this.notes, key, "The printer didn't answer. Try again.");
    } finally {
      this.saving = "";
      this.switches = [...this.switches];
    }
  }
};
__decorateClass([
  Watch("isMuonPrinter")
], SecuritySettings.prototype, "onMuon", 1);
SecuritySettings = __decorateClass([
  Component({ components: { CanManageAccess, LockedRow, ToggleSwitch } })
], SecuritySettings);
const _sfc_main = SecuritySettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.isMuonPrinter === true ? _c("section", { staticClass: "sec", attrs: { "id": "security", "data-tid": "security-settings" } }, [_c("header", { staticClass: "sec__head" }, [_c("h2", [_vm._v("Who can do what")]), _c("p", [_vm._v(_vm._s(_vm.printerName) + " decides each of these for every phone and computer, and keeps to it.")]), _vm.claimed !== null ? _c("p", { staticClass: "sec__claimed", attrs: { "data-tid": "security-claimed" } }, [_vm._v(" " + _vm._s(_vm.claimedLine) + " ")]) : _vm._e()]), _vm.presetNow !== null ? _c("div", { staticClass: "sec__presets", attrs: { "data-tid": "security-presets" } }, [_c("div", { staticClass: "sec__titles" }, [_c("h3", [_vm._v("How open this printer is")]), _c("p", { attrs: { "data-tid": "security-preset-current" } }, [_vm._v(" " + _vm._s(_vm.presetWords) + " ")]), _vm.presetBlurb ? _c("p", { attrs: { "data-tid": "security-preset-blurb" } }, [_vm._v(" " + _vm._s(_vm.presetBlurb) + " ")]) : _vm._e()]), _c("can-manage-access", [_c("span", { staticClass: "sec__seg", attrs: { "role": "group", "aria-label": "Open, Protected or Locked-down" } }, _vm._l(_vm.presets, function(p) {
    return _c("button", { key: p.id, class: { "sec__seg--on": _vm.presetNow === p.id }, attrs: { "type": "button", "aria-pressed": _vm.presetNow === p.id ? "true" : "false", "disabled": _vm.saving !== "", "data-tid": `security-preset-${p.id}` }, on: { "click": function($event) {
      return _vm.applyPreset(p.id);
    } } }, [_vm._v(_vm._s(p.label))]);
  }), 0)]), _vm.presetNote ? _c("p", { staticClass: "sec__note sec__note--warn", attrs: { "data-tid": "security-preset-note" } }, [_vm._v(" " + _vm._s(_vm.presetNote) + " ")]) : _vm._e()], 1) : _vm._e(), _vm.printerPage ? _c("div", { staticClass: "sec__row", attrs: { "data-tid": "security-auto-switch" } }, [_vm._m(0), _c("toggle-switch", { attrs: { "value": _vm.autoSwitch, "label": "Switch to the secure address automatically" }, on: { "input": _vm.onAutoSwitch } })], 1) : _vm._e(), _vm.knobs === null ? _c("p", { staticClass: "sec__note", attrs: { "data-tid": "security-unknown" } }, [_vm._v(" " + _vm._s(_vm.loaded ? "This printer doesn't report its security settings yet." : "Asking the printer\u2026") + " ")]) : _vm._e(), _vm._l(_vm.rows, function(k) {
    return _c("div", { key: k.id, staticClass: "sec__row", attrs: { "data-tid": "security-row", "data-knob": k.id } }, [_c("div", { staticClass: "sec__titles" }, [_c("h3", { attrs: { "data-tid": "security-label" } }, [_vm._v(" " + _vm._s(k.label) + " ")]), k.description ? _c("p", [_vm._v(" " + _vm._s(k.description) + " ")]) : _vm._e(), k.defaultValue ? _c("p", { staticClass: "sec__default", class: { "sec__default--changed": k.value !== k.defaultValue }, attrs: { "data-tid": "security-default" } }, [_vm._v(" " + _vm._s(_vm.defaultLine(k)) + " ")]) : _vm._e()]), !k.readOnly ? _c("can-manage-access", [_c("select", { staticClass: "sec__select", attrs: { "aria-label": k.label, "disabled": _vm.saving !== "", "data-tid": "security-value" }, domProps: { "value": k.value }, on: { "change": function($event) {
      return _vm.onSelect(k, $event);
    } } }, _vm._l(k.values, function(v) {
      return _c("option", { key: v, domProps: { "value": v } }, [_vm._v(" " + _vm._s(_vm.valueLabel(v)) + " ")]);
    }), 0)]) : _vm._e(), k.readOnly || _vm.canManageAccess !== true ? _c("locked-row", { attrs: { "lock": "muon", "label": _vm.valueLabel(k.value), "reason-text": _vm.reasonFor(k) } }) : _vm._e(), _vm.notes[k.id] ? _c("p", { staticClass: "sec__note sec__note--warn", attrs: { "data-tid": "security-note" } }, [_vm._v(" " + _vm._s(_vm.notes[k.id]) + " ")]) : _vm._e()], 1);
  }), _vm.switches.length ? _c("div", { staticClass: "sec__block", attrs: { "data-tid": "security-switches" } }, [_c("h3", [_vm._v("Switches")]), _vm._l(_vm.switches, function(sw) {
    return _c("div", { key: sw.id, staticClass: "sec__row", attrs: { "data-tid": "security-switch-row", "data-switch": sw.id } }, [_c("div", { staticClass: "sec__titles" }, [_c("h3", [_vm._v(_vm._s(sw.label))]), sw.description ? _c("p", [_vm._v(" " + _vm._s(sw.description) + " ")]) : _vm._e(), sw.defaultValue !== null ? _c("p", { staticClass: "sec__default", attrs: { "data-tid": "security-switch-default" } }, [_vm._v(" " + _vm._s(sw.defaultValue ? "On by default." : "Off by default.") + " ")]) : _vm._e()]), !sw.readOnly ? _c("can-manage-access", [_c("toggle-switch", { attrs: { "value": sw.value, "label": sw.label, "disabled": _vm.saving !== "" }, on: { "input": function($event) {
      return _vm.onSwitch(sw, $event);
    } } })], 1) : _vm._e(), sw.readOnly || _vm.canManageAccess !== true ? _c("locked-row", { attrs: { "lock": "muon", "label": sw.value ? "On" : "Off", "reason-text": _vm.switchReason(sw) } }) : _vm._e(), _vm.notes[`switch:${sw.id}`] ? _c("p", { staticClass: "sec__note sec__note--warn", attrs: { "data-tid": "security-note" } }, [_vm._v(" " + _vm._s(_vm.notes[`switch:${sw.id}`]) + " ")]) : _vm._e()], 1);
  })], 2) : _vm._e(), _vm.fixedRows.length ? _c("div", { staticClass: "sec__block", attrs: { "data-tid": "security-printer-only" } }, [_c("h3", [_vm._v("Confirmed at the printer")]), _c("p", [_vm._v("These need the person at the printer to confirm on its screen, whoever asks and whatever route they use.")]), _vm._l(_vm.fixedRows, function(k) {
    return _c("div", { key: k.id, staticClass: "sec__row", attrs: { "data-tid": "security-printer-only-row", "data-knob": k.id } }, [_c("div", { staticClass: "sec__titles" }, [_c("h3", [_vm._v(_vm._s(k.label))]), k.description ? _c("p", [_vm._v(" " + _vm._s(k.description) + " ")]) : _vm._e()]), _c("locked-row", { attrs: { "lock": "muon", "label": "Confirmed at the printer", "reason-text": "Confirmed on the printer's screen." } })], 1);
  })], 2) : _vm._e(), _vm.knobs !== null ? _c("p", { staticClass: "sec__note", attrs: { "data-tid": "security-reset" } }, [_vm._v(" Reset to the defaults at the printer's screen. ")]) : _vm._e()], 2) : _vm._e();
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "sec__titles" }, [_c("h3", [_vm._v("Switch to the secure address automatically")]), _c("p", [_vm._v("On this browser. When this printer has a secure address that works here, Control opens it by itself.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/SecuritySettings.vue?vue&type=style&index=0&scoped=2b68ea5f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "2b68ea5f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/SecuritySettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXdPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsT0FFQTtBQUNBO0FBQ0E7QUFDQTtBQVlBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBRUE7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBRUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEzR0E7QUFBQSxFQURBO0FBQUEsR0FwRkEsaUJBcUZBO0FBckZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlNlY3VyaXR5U2V0dGluZ3MudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNlY3Rpb25cbiAgICB2LWlmPVwiaXNNdW9uUHJpbnRlciA9PT0gdHJ1ZVwiXG4gICAgaWQ9XCJzZWN1cml0eVwiXG4gICAgY2xhc3M9XCJzZWNcIlxuICAgIGRhdGEtdGlkPVwic2VjdXJpdHktc2V0dGluZ3NcIlxuICA+XG4gICAgPGhlYWRlciBjbGFzcz1cInNlY19faGVhZFwiPlxuICAgICAgPGgyPldobyBjYW4gZG8gd2hhdDwvaDI+XG4gICAgICA8cD57eyBwcmludGVyTmFtZSB9fSBkZWNpZGVzIGVhY2ggb2YgdGhlc2UgZm9yIGV2ZXJ5IHBob25lIGFuZCBjb21wdXRlciwgYW5kIGtlZXBzIHRvIGl0LjwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJjbGFpbWVkICE9PSBudWxsXCJcbiAgICAgICAgY2xhc3M9XCJzZWNfX2NsYWltZWRcIlxuICAgICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LWNsYWltZWRcIlxuICAgICAgPlxuICAgICAgICB7eyBjbGFpbWVkTGluZSB9fVxuICAgICAgPC9wPlxuICAgIDwvaGVhZGVyPlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cInByZXNldE5vdyAhPT0gbnVsbFwiXG4gICAgICBjbGFzcz1cInNlY19fcHJlc2V0c1wiXG4gICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LXByZXNldHNcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJzZWNfX3RpdGxlc1wiPlxuICAgICAgICA8aDM+SG93IG9wZW4gdGhpcyBwcmludGVyIGlzPC9oMz5cbiAgICAgICAgPHAgZGF0YS10aWQ9XCJzZWN1cml0eS1wcmVzZXQtY3VycmVudFwiPlxuICAgICAgICAgIHt7IHByZXNldFdvcmRzIH19XG4gICAgICAgIDwvcD5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwicHJlc2V0Qmx1cmJcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2VjdXJpdHktcHJlc2V0LWJsdXJiXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHByZXNldEJsdXJiIH19XG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGNhbi1tYW5hZ2UtYWNjZXNzPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzPVwic2VjX19zZWdcIlxuICAgICAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIk9wZW4sIFByb3RlY3RlZCBvciBMb2NrZWQtZG93blwiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cInAgaW4gcHJlc2V0c1wiXG4gICAgICAgICAgICA6a2V5PVwicC5pZFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ3NlY19fc2VnLS1vbic6IHByZXNldE5vdyA9PT0gcC5pZCB9XCJcbiAgICAgICAgICAgIDphcmlhLXByZXNzZWQ9XCJwcmVzZXROb3cgPT09IHAuaWQgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInNhdmluZyAhPT0gJydcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHNlY3VyaXR5LXByZXNldC0ke3AuaWR9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJhcHBseVByZXNldChwLmlkKVwiXG4gICAgICAgICAgPnt7IHAubGFiZWwgfX08L2J1dHRvbj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9jYW4tbWFuYWdlLWFjY2Vzcz5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJwcmVzZXROb3RlXCJcbiAgICAgICAgY2xhc3M9XCJzZWNfX25vdGUgc2VjX19ub3RlLS13YXJuXCJcbiAgICAgICAgZGF0YS10aWQ9XCJzZWN1cml0eS1wcmVzZXQtbm90ZVwiXG4gICAgICA+XG4gICAgICAgIHt7IHByZXNldE5vdGUgfX1cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJwcmludGVyUGFnZVwiXG4gICAgICBjbGFzcz1cInNlY19fcm93XCJcbiAgICAgIGRhdGEtdGlkPVwic2VjdXJpdHktYXV0by1zd2l0Y2hcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJzZWNfX3RpdGxlc1wiPlxuICAgICAgICA8aDM+U3dpdGNoIHRvIHRoZSBzZWN1cmUgYWRkcmVzcyBhdXRvbWF0aWNhbGx5PC9oMz5cbiAgICAgICAgPHA+T24gdGhpcyBicm93c2VyLiBXaGVuIHRoaXMgcHJpbnRlciBoYXMgYSBzZWN1cmUgYWRkcmVzcyB0aGF0IHdvcmtzIGhlcmUsIENvbnRyb2wgb3BlbnMgaXQgYnkgaXRzZWxmLjwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgOnZhbHVlPVwiYXV0b1N3aXRjaFwiXG4gICAgICAgIGxhYmVsPVwiU3dpdGNoIHRvIHRoZSBzZWN1cmUgYWRkcmVzcyBhdXRvbWF0aWNhbGx5XCJcbiAgICAgICAgQGlucHV0PVwib25BdXRvU3dpdGNoXCJcbiAgICAgIC8+XG4gICAgPC9kaXY+XG5cbiAgICA8cFxuICAgICAgdi1pZj1cImtub2JzID09PSBudWxsXCJcbiAgICAgIGNsYXNzPVwic2VjX19ub3RlXCJcbiAgICAgIGRhdGEtdGlkPVwic2VjdXJpdHktdW5rbm93blwiXG4gICAgPlxuICAgICAge3sgbG9hZGVkID8gXCJUaGlzIHByaW50ZXIgZG9lc24ndCByZXBvcnQgaXRzIHNlY3VyaXR5IHNldHRpbmdzIHlldC5cIiA6ICdBc2tpbmcgdGhlIHByaW50ZXLigKYnIH19XG4gICAgPC9wPlxuXG4gICAgPGRpdlxuICAgICAgdi1mb3I9XCJrIGluIHJvd3NcIlxuICAgICAgOmtleT1cImsuaWRcIlxuICAgICAgY2xhc3M9XCJzZWNfX3Jvd1wiXG4gICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LXJvd1wiXG4gICAgICA6ZGF0YS1rbm9iPVwiay5pZFwiXG4gICAgPlxuICAgICAgPGRpdiBjbGFzcz1cInNlY19fdGl0bGVzXCI+XG4gICAgICAgIDxoMyBkYXRhLXRpZD1cInNlY3VyaXR5LWxhYmVsXCI+XG4gICAgICAgICAge3sgay5sYWJlbCB9fVxuICAgICAgICA8L2gzPlxuICAgICAgICA8cCB2LWlmPVwiay5kZXNjcmlwdGlvblwiPlxuICAgICAgICAgIHt7IGsuZGVzY3JpcHRpb24gfX1cbiAgICAgICAgPC9wPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJrLmRlZmF1bHRWYWx1ZVwiXG4gICAgICAgICAgY2xhc3M9XCJzZWNfX2RlZmF1bHRcIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ3NlY19fZGVmYXVsdC0tY2hhbmdlZCc6IGsudmFsdWUgIT09IGsuZGVmYXVsdFZhbHVlIH1cIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2VjdXJpdHktZGVmYXVsdFwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBkZWZhdWx0TGluZShrKSB9fVxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxjYW4tbWFuYWdlLWFjY2VzcyB2LWlmPVwiIWsucmVhZE9ubHlcIj5cbiAgICAgICAgPHNlbGVjdFxuICAgICAgICAgIGNsYXNzPVwic2VjX19zZWxlY3RcIlxuICAgICAgICAgIDp2YWx1ZT1cImsudmFsdWVcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiay5sYWJlbFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwic2F2aW5nICE9PSAnJ1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzZWN1cml0eS12YWx1ZVwiXG4gICAgICAgICAgQGNoYW5nZT1cIm9uU2VsZWN0KGssICRldmVudClcIlxuICAgICAgICA+XG4gICAgICAgICAgPG9wdGlvblxuICAgICAgICAgICAgdi1mb3I9XCJ2IGluIGsudmFsdWVzXCJcbiAgICAgICAgICAgIDprZXk9XCJ2XCJcbiAgICAgICAgICAgIDp2YWx1ZT1cInZcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IHZhbHVlTGFiZWwodikgfX1cbiAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgPC9zZWxlY3Q+XG4gICAgICA8L2Nhbi1tYW5hZ2UtYWNjZXNzPlxuICAgICAgPGxvY2tlZC1yb3dcbiAgICAgICAgdi1pZj1cImsucmVhZE9ubHkgfHwgY2FuTWFuYWdlQWNjZXNzICE9PSB0cnVlXCJcbiAgICAgICAgbG9jaz1cIm11b25cIlxuICAgICAgICA6bGFiZWw9XCJ2YWx1ZUxhYmVsKGsudmFsdWUpXCJcbiAgICAgICAgOnJlYXNvbi10ZXh0PVwicmVhc29uRm9yKGspXCJcbiAgICAgIC8+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwibm90ZXNbay5pZF1cIlxuICAgICAgICBjbGFzcz1cInNlY19fbm90ZSBzZWNfX25vdGUtLXdhcm5cIlxuICAgICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LW5vdGVcIlxuICAgICAgPlxuICAgICAgICB7eyBub3Rlc1trLmlkXSB9fVxuICAgICAgPC9wPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cInN3aXRjaGVzLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cInNlY19fYmxvY2tcIlxuICAgICAgZGF0YS10aWQ9XCJzZWN1cml0eS1zd2l0Y2hlc1wiXG4gICAgPlxuICAgICAgPGgzPlN3aXRjaGVzPC9oMz5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJzdyBpbiBzd2l0Y2hlc1wiXG4gICAgICAgIDprZXk9XCJzdy5pZFwiXG4gICAgICAgIGNsYXNzPVwic2VjX19yb3dcIlxuICAgICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LXN3aXRjaC1yb3dcIlxuICAgICAgICA6ZGF0YS1zd2l0Y2g9XCJzdy5pZFwiXG4gICAgICA+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzZWNfX3RpdGxlc1wiPlxuICAgICAgICAgIDxoMz57eyBzdy5sYWJlbCB9fTwvaDM+XG4gICAgICAgICAgPHAgdi1pZj1cInN3LmRlc2NyaXB0aW9uXCI+XG4gICAgICAgICAgICB7eyBzdy5kZXNjcmlwdGlvbiB9fVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8cFxuICAgICAgICAgICAgdi1pZj1cInN3LmRlZmF1bHRWYWx1ZSAhPT0gbnVsbFwiXG4gICAgICAgICAgICBjbGFzcz1cInNlY19fZGVmYXVsdFwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LXN3aXRjaC1kZWZhdWx0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyBzdy5kZWZhdWx0VmFsdWUgPyAnT24gYnkgZGVmYXVsdC4nIDogJ09mZiBieSBkZWZhdWx0LicgfX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Y2FuLW1hbmFnZS1hY2Nlc3Mgdi1pZj1cIiFzdy5yZWFkT25seVwiPlxuICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICA6dmFsdWU9XCJzdy52YWx1ZVwiXG4gICAgICAgICAgICA6bGFiZWw9XCJzdy5sYWJlbFwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJzYXZpbmcgIT09ICcnXCJcbiAgICAgICAgICAgIEBpbnB1dD1cIm9uU3dpdGNoKHN3LCAkZXZlbnQpXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Nhbi1tYW5hZ2UtYWNjZXNzPlxuICAgICAgICA8bG9ja2VkLXJvd1xuICAgICAgICAgIHYtaWY9XCJzdy5yZWFkT25seSB8fCBjYW5NYW5hZ2VBY2Nlc3MgIT09IHRydWVcIlxuICAgICAgICAgIGxvY2s9XCJtdW9uXCJcbiAgICAgICAgICA6bGFiZWw9XCJzdy52YWx1ZSA/ICdPbicgOiAnT2ZmJ1wiXG4gICAgICAgICAgOnJlYXNvbi10ZXh0PVwic3dpdGNoUmVhc29uKHN3KVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cIm5vdGVzW2Bzd2l0Y2g6JHtzdy5pZH1gXVwiXG4gICAgICAgICAgY2xhc3M9XCJzZWNfX25vdGUgc2VjX19ub3RlLS13YXJuXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LW5vdGVcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgbm90ZXNbYHN3aXRjaDoke3N3LmlkfWBdIH19XG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cImZpeGVkUm93cy5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJzZWNfX2Jsb2NrXCJcbiAgICAgIGRhdGEtdGlkPVwic2VjdXJpdHktcHJpbnRlci1vbmx5XCJcbiAgICA+XG4gICAgICA8aDM+Q29uZmlybWVkIGF0IHRoZSBwcmludGVyPC9oMz5cbiAgICAgIDxwPlRoZXNlIG5lZWQgdGhlIHBlcnNvbiBhdCB0aGUgcHJpbnRlciB0byBjb25maXJtIG9uIGl0cyBzY3JlZW4sIHdob2V2ZXIgYXNrcyBhbmQgd2hhdGV2ZXIgcm91dGUgdGhleSB1c2UuPC9wPlxuICAgICAgPGRpdlxuICAgICAgICB2LWZvcj1cImsgaW4gZml4ZWRSb3dzXCJcbiAgICAgICAgOmtleT1cImsuaWRcIlxuICAgICAgICBjbGFzcz1cInNlY19fcm93XCJcbiAgICAgICAgZGF0YS10aWQ9XCJzZWN1cml0eS1wcmludGVyLW9ubHktcm93XCJcbiAgICAgICAgOmRhdGEta25vYj1cImsuaWRcIlxuICAgICAgPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2VjX190aXRsZXNcIj5cbiAgICAgICAgICA8aDM+e3sgay5sYWJlbCB9fTwvaDM+XG4gICAgICAgICAgPHAgdi1pZj1cImsuZGVzY3JpcHRpb25cIj5cbiAgICAgICAgICAgIHt7IGsuZGVzY3JpcHRpb24gfX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bG9ja2VkLXJvd1xuICAgICAgICAgIGxvY2s9XCJtdW9uXCJcbiAgICAgICAgICBsYWJlbD1cIkNvbmZpcm1lZCBhdCB0aGUgcHJpbnRlclwiXG4gICAgICAgICAgcmVhc29uLXRleHQ9XCJDb25maXJtZWQgb24gdGhlIHByaW50ZXIncyBzY3JlZW4uXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCJrbm9icyAhPT0gbnVsbFwiXG4gICAgICBjbGFzcz1cInNlY19fbm90ZVwiXG4gICAgICBkYXRhLXRpZD1cInNlY3VyaXR5LXJlc2V0XCJcbiAgICA+XG4gICAgICBSZXNldCB0byB0aGUgZGVmYXVsdHMgYXQgdGhlIHByaW50ZXIncyBzY3JlZW4uXG4gICAgPC9wPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNdW9uR2F0ZXNNaXhpbiBmcm9tICdAL21peGlucy9tdW9uLWdhdGVzJ1xuaW1wb3J0IENhbk1hbmFnZUFjY2VzcyBmcm9tICdAL2NvbXBvbmVudHMvc2V0dGluZ3MvZ2F0ZXMvQ2FuTWFuYWdlQWNjZXNzLnZ1ZSdcbmltcG9ydCBMb2NrZWRSb3cgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL2dhdGVzL0xvY2tlZFJvdy52dWUnXG5pbXBvcnQgVG9nZ2xlU3dpdGNoIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1RvZ2dsZVN3aXRjaC52dWUnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgcHJpbnRlck5hbWVQYXJ0cyB9IGZyb20gJ0AvdXRpbC9wcmludGVyLW5hbWUnXG5pbXBvcnQgeyBjb3VsZEhhdmVTZWN1cmVBZGRyZXNzLCBzZXRTd2l0Y2hlc0F1dG9tYXRpY2FsbHksIHN3aXRjaGVzQXV0b21hdGljYWxseSB9IGZyb20gJ0Avc2VydmljZXMvc2VjdXJlLW9yaWdpbidcbmltcG9ydCB7XG4gIGNoYW5nZU91dGNvbWUsIG91dGNvbWVOb3RlLCBwYXJzZVBlcm1pc3Npb25zLCBwZXJtaXNzaW9uc1BhdGgsIHN3aXRjaE91dGNvbWUsIHN3aXRjaFBhdGgsIHZhbHVlTGFiZWwsXG4gIHR5cGUgUGVybWlzc2lvbktub2IsIHR5cGUgUGVybWlzc2lvblN3aXRjaFxufSBmcm9tICdAL3NlcnZpY2VzL3Blcm1pc3Npb25zL2FwaSdcbmltcG9ydCB7IFBSRVNFVFMsIGN1cnJlbnRQcmVzZXQsIHBsYW5Gb3IsIHByZXNldExhYmVsLCB0eXBlIFByZXNldElkIH0gZnJvbSAnQC9zZXJ2aWNlcy9wZXJtaXNzaW9ucy9wcmVzZXRzJ1xuaW1wb3J0IHsga2VlcCB9IGZyb20gJ0Avc2VydmljZXMvZ2F0ZXMvc3RhdGUnXG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuXG4vKipcbiAqIFNldHRpbmdzID4gU2VjdXJpdHkgKEtBTi0xOTI2LCBLQU4tMjE4OSk6IG9uZSByb3cgZm9yIGVhY2ggc2V0dGluZyB0aGVcbiAqIHByaW50ZXIgcmVwb3J0cywgbmV2ZXIgYSBsaXN0IGtlcHQgaGVyZSwgc28gYSBuZXcgb25lIHNob3dzIGFzIHRoZSBwcmludGVyXG4gKiBuYW1lcyBpdC4gQSByb3cgdGhlIHByaW50ZXIgcmVwb3J0cyBhcyByZWFkLW9ubHkgZm9yIHRoaXMgc2Vzc2lvbiwgb3IgYXNcbiAqIGZpeGVkLCBoYXMgbm8gY29udHJvbDsgb25seSBhIGNsaWVudCB0aGUgcHJpbnRlciBsZXRzIG1hbmFnZSBhY2Nlc3NcbiAqIChjYW5NYW5hZ2VBY2Nlc3MpIGdldHMgb25lIG9uIHRoZSBvdGhlcnMuIFRoZSBwcmludGVyIGVuZm9yY2VzIGV2ZXJ5IHZhbHVlO1xuICogdGhpcyBwYWdlIG9ubHkgc2hvd3MgaXQgYW5kIGFza3MuIE92ZXIgYSBtYW5hZ2VkIHNlc3Npb24gdGhlIHNhbWUgcm91dGVzXG4gKiBhcmUgdW5kZXIgL211b24tbGluay8uXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENhbk1hbmFnZUFjY2VzcywgTG9ja2VkUm93LCBUb2dnbGVTd2l0Y2ggfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VjdXJpdHlTZXR0aW5ncyBleHRlbmRzIE1peGlucyhNdW9uR2F0ZXNNaXhpbikge1xuICBrbm9iczogUGVybWlzc2lvbktub2JbXSB8IG51bGwgPSBudWxsXG4gIHN3aXRjaGVzOiBQZXJtaXNzaW9uU3dpdGNoW10gPSBbXVxuICBjbGFpbWVkOiBib29sZWFuIHwgbnVsbCA9IG51bGxcbiAgbG9hZGVkID0gZmFsc2VcbiAgc2F2aW5nID0gJydcbiAgbm90ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICByZWFkb25seSB2YWx1ZUxhYmVsID0gdmFsdWVMYWJlbFxuICByZWFkb25seSBwcmVzZXRzID0gUFJFU0VUU1xuICBwcmVzZXROb3RlID0gJydcbiAgLyoqIFRoaXMgYnJvd3NlcidzIGNob2ljZSwgbm90IHRoZSBwcmludGVyJ3M6IGl0IG1lYW5zIG5vdGhpbmcgb24gYSBwYWdlIHRoZSBjb25zb2xlIHNlcnZlcy4gKi9cbiAgcHJpbnRlclBhZ2UgPSBjb3VsZEhhdmVTZWN1cmVBZGRyZXNzKClcbiAgYXV0b1N3aXRjaCA9IHN3aXRjaGVzQXV0b21hdGljYWxseSgpXG5cbiAgb25BdXRvU3dpdGNoIChvbjogYm9vbGVhbikge1xuICAgIHNldFN3aXRjaGVzQXV0b21hdGljYWxseShvbilcbiAgICB0aGlzLmF1dG9Td2l0Y2ggPSBzd2l0Y2hlc0F1dG9tYXRpY2FsbHkoKVxuICB9XG5cbiAgLyoqXG4gICAqIFdoYXQgdGhlIHByaW50ZXIgcmVwb3J0cyBhcyBpdHMgZGVmYXVsdHMsIGluIGEgc2VudGVuY2U6IHNhaWQgb25seSB3aGVuXG4gICAqIHRoZSBzZXR0aW5ncyB0aGF0IHJlcG9ydCBvbmUgYWdyZWUgKHRyYWluIDEyIHByaW50ZXJzIHJlcG9ydFxuICAgKiBvd25lcl9hbmRfc2hhcmVkLCB0cmFpbiAxMyBhbnlvbmUpOyBtaXhlZCBvciBtaXNzaW5nIHNheXMgbm90aGluZy5cbiAgICovXG4gIGdldCBkZWZhdWx0c0xpbmUgKCk6IHN0cmluZyB7XG4gICAgLy8gQSBzZXR0aW5nIHRoYXQgcmVwb3J0cyBubyBkZWZhdWx0IChvbmUgQ29udHJvbCBkb2Vzbid0IGtub3cpIHNheXMgbm90aGluZyBlaXRoZXIgd2F5LlxuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5yb3dzLm1hcChrID0+IGsuZGVmYXVsdFZhbHVlKS5maWx0ZXIoZCA9PiAhIWQpXG4gICAgaWYgKCFkZWZhdWx0cy5sZW5ndGggfHwgbmV3IFNldChkZWZhdWx0cykuc2l6ZSAhPT0gMSkgcmV0dXJuICcnXG4gICAgcmV0dXJuIGRlZmF1bHRzWzBdID09PSAnYW55b25lJyA/ICdBbnlvbmUgbWF5IGRvIGVhY2ggb2YgdGhlc2UgYnkgZGVmYXVsdC4nIDogYCR7dmFsdWVMYWJlbChkZWZhdWx0c1swXSl9IGJ5IGRlZmF1bHQuYFxuICB9XG5cbiAgLyoqIFdoaWNoIHByZXNldCB0aGUgcHJpbnRlcidzIHNldHRpbmdzIGFyZSwgd29ya2VkIG91dCBmcm9tIHRoZW0gZWFjaCB0aW1lLiAqL1xuICBnZXQgcHJlc2V0Tm93ICgpIHtcbiAgICByZXR1cm4gY3VycmVudFByZXNldCh0aGlzLmtub2JzKVxuICB9XG5cbiAgZ2V0IHByZXNldFdvcmRzICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnByZXNldE5vdyA/IHByZXNldExhYmVsKHRoaXMucHJlc2V0Tm93KSA6ICcnXG4gIH1cblxuICBnZXQgcHJlc2V0Qmx1cmIgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMucHJlc2V0Tm93ID09PSAnY3VzdG9tJykgcmV0dXJuICdUaGUgc2V0dGluZ3MgYmVsb3cgYXJlIG5vdCBvbmUgb2YgdGhlIHRocmVlIHByZXNldHMuJ1xuICAgIHJldHVybiBQUkVTRVRTLmZpbmQocCA9PiBwLmlkID09PSB0aGlzLnByZXNldE5vdyk/LmJsdXJiID8/ICcnXG4gIH1cblxuICAvKipcbiAgICogU2V0cyBldmVyeSBzZXR0aW5nIHRoZSBwcmVzZXQgbmFtZXMgdGhhdCBkaWZmZXJzLCBvbmUgYWZ0ZXIgYW5vdGhlciwgdGhlblxuICAgKiByZWFkcyB0aGUgcHJpbnRlcidzIGxpc3QgYWdhaW46IHdoYXQgaXQga2VwdCBpcyB3aGF0IHNob3dzLiBBIHNldHRpbmcgdGhlXG4gICAqIHByaW50ZXIgbmVlZHMgYSBrbm9iIHByZXNzIGZvciwgb3IgcmVmdXNlcywgaXMgc2FpZCBiZWxvdy5cbiAgICovXG4gIGFzeW5jIGFwcGx5UHJlc2V0IChpZDogUHJlc2V0SWQpIHtcbiAgICBpZiAodGhpcy5zYXZpbmcgfHwgIXRoaXMua25vYnMpIHJldHVyblxuICAgIGNvbnN0IHBsYW4gPSBwbGFuRm9yKGlkLCB0aGlzLmtub2JzKVxuICAgIHRoaXMucHJlc2V0Tm90ZSA9ICcnXG4gICAgaWYgKCFwbGFuLmxlbmd0aCkgcmV0dXJuXG4gICAgdGhpcy5zYXZpbmcgPSAncHJlc2V0J1xuICAgIGNvbnN0IG5vdGVzOiBzdHJpbmdbXSA9IFtdXG4gICAgdHJ5IHtcbiAgICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIHBsYW4pIHtcbiAgICAgICAgY29uc3QgciA9IGF3YWl0IHRoaXMuJGh0dHBDbGllbnQucG9zdChwZXJtaXNzaW9uc1BhdGgodGhpcy5tYW5hZ2VkKSwgY2hhbmdlLCB7IHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlIH0pXG4gICAgICAgIGNvbnN0IG8gPSBjaGFuZ2VPdXRjb21lKHIuc3RhdHVzLCByLmRhdGEpXG4gICAgICAgIGlmIChvLmtpbmQgPT09ICdrbm9iJyB8fCBvLmtpbmQgPT09ICdyZWZ1c2VkJykge1xuICAgICAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5rbm9icy5maW5kKGsgPT4gay5pZCA9PT0gY2hhbmdlLmlkKT8ubGFiZWwgPz8gY2hhbmdlLmlkXG4gICAgICAgICAgbm90ZXMucHVzaChgJHtsYWJlbH06ICR7b3V0Y29tZU5vdGUobyl9YClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgbm90ZXMucHVzaChcIlRoZSBwcmludGVyIGRpZG4ndCBhbnN3ZXIuIFRyeSBhZ2Fpbi5cIilcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5zYXZpbmcgPSAnJ1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKClcbiAgICAgIHRoaXMucHJlc2V0Tm90ZSA9IG5vdGVzLmpvaW4oJyAnKVxuICAgIH1cbiAgfVxuXG4gIGdldCBjbGFpbWVkTGluZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBoZWFkID0gdGhpcy5jbGFpbWVkID8gJ0EgY2xhaW1lZCBwcmludGVyJyA6ICdBbiBvcGVuIHByaW50ZXInXG4gICAgcmV0dXJuIGAke3RoaXMuZGVmYXVsdHNMaW5lID8gYCR7aGVhZH06ICR7dGhpcy5kZWZhdWx0c0xpbmV9YCA6IGAke2hlYWR9LmB9IFRoZSBvd25lciBjYW4gcmVzdHJpY3QgZWFjaCBvbmUuYFxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgaWYgKHRoaXMuaXNNdW9uUHJpbnRlciA9PT0gdHJ1ZSkgdGhpcy5sb2FkKClcbiAgfVxuXG4gIEBXYXRjaCgnaXNNdW9uUHJpbnRlcicpXG4gIG9uTXVvbiAobXVvbjogYm9vbGVhbiB8IG51bGwpIHtcbiAgICBpZiAobXVvbiA9PT0gdHJ1ZSAmJiAhdGhpcy5sb2FkZWQpIHRoaXMubG9hZCgpXG4gIH1cblxuICBnZXQgbWFuYWdlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTWFuYWdlZEFwaVVybCh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsIGFzIHN0cmluZyB8IG51bGwpXG4gIH1cblxuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKS5uYW1lXG4gIH1cblxuICAvKiogVGhlIHNldHRpbmdzIGEgc2Vzc2lvbiBtYXkgY2hhbmdlIG9yIGxvb2sgYXQsIGluIHRoZSBwcmludGVyJ3Mgb3JkZXI7IHRoZSBmaXhlZCBvbmVzIGFyZSB1bmRlciBcIkNvbmZpcm1lZCBhdCB0aGUgcHJpbnRlclwiLiAqL1xuICBnZXQgcm93cyAoKTogUGVybWlzc2lvbktub2JbXSB7XG4gICAgcmV0dXJuICh0aGlzLmtub2JzIHx8IFtdKS5maWx0ZXIoayA9PiAhay5maXhlZClcbiAgfVxuXG4gIGdldCBmaXhlZFJvd3MgKCk6IFBlcm1pc3Npb25Lbm9iW10ge1xuICAgIHJldHVybiAodGhpcy5rbm9icyB8fCBbXSkuZmlsdGVyKGsgPT4gay5maXhlZClcbiAgfVxuXG4gIGRlZmF1bHRMaW5lIChrOiBQZXJtaXNzaW9uS25vYik6IHN0cmluZyB7XG4gICAgY29uc3QgYmFzZSA9IGsuZGVmYXVsdFZhbHVlID09PSAnYW55b25lJyA/ICdPcGVuIGJ5IGRlZmF1bHQuJyA6IGBEZWZhdWx0OiAke3ZhbHVlTGFiZWwoay5kZWZhdWx0VmFsdWUpfS5gXG4gICAgcmV0dXJuIGsudmFsdWUgPT09IGsuZGVmYXVsdFZhbHVlID8gYmFzZSA6IGAke2Jhc2V9IE5vdyBzZXQgdG8gJHt2YWx1ZUxhYmVsKGsudmFsdWUpfS5gXG4gIH1cblxuICBhc3luYyBsb2FkICgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IHRoaXMuJGh0dHBDbGllbnQuZ2V0KHBlcm1pc3Npb25zUGF0aCh0aGlzLm1hbmFnZWQpLCB7IHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlIH0pXG4gICAgICBjb25zdCBsaXN0ID0gci5zdGF0dXMgPj0gMjAwICYmIHIuc3RhdHVzIDwgMzAwID8gcGFyc2VQZXJtaXNzaW9ucyhyLmRhdGEpIDogbnVsbFxuICAgICAgdGhpcy5rbm9icyA9IGxpc3QgPyBsaXN0Lmtub2JzIDogbnVsbFxuICAgICAgdGhpcy5zd2l0Y2hlcyA9IGxpc3QgPyBsaXN0LnN3aXRjaGVzIDogW11cbiAgICAgIHRoaXMuY2xhaW1lZCA9IGxpc3QgPyBsaXN0LmNsYWltZWQgOiBudWxsXG4gICAgICAvLyBUaGUgcmVzdCBvZiBDb250cm9sIGhpZGVzIHdoYXQgYSBub24tb3duZXIgbWF5IG5vdCBkbyBmcm9tIHRoZXNlIHNhbWUgdmFsdWVzLlxuICAgICAgY29uc3Qga2V5ID0gYWN0aXZlU2x1ZygpXG4gICAgICBpZiAoa2V5ICE9PSBudWxsICYmIGxpc3QpIGtlZXAoJ3Blcm1zJywga2V5LCBPYmplY3QuZnJvbUVudHJpZXMobGlzdC5rbm9icy5tYXAoayA9PiBbay5pZCwgay52YWx1ZV0pKSlcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMua25vYnMgPSBudWxsXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubG9hZGVkID0gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHJlYXNvbkZvciAoazogUGVybWlzc2lvbktub2IpOiBzdHJpbmcge1xuICAgIGlmIChrLmdlbmVyaWMpIHJldHVybiAnU2hvd24gYXMgdGhlIHByaW50ZXIgcmVwb3J0cyBpdC4gQ2hhbmdlIGl0IGF0IHRoZSBwcmludGVyLidcbiAgICBpZiAoay5yZWFkT25seSkgcmV0dXJuIFwiWW91IGNhbid0IGNoYW5nZSB0aGlzIG9uZS5cIlxuICAgIGlmICh0aGlzLmNhbk1hbmFnZUFjY2VzcyA9PT0gZmFsc2UpIHJldHVybiBcIk9ubHkgdGhlIHByaW50ZXIncyBvd25lciBjYW4gY2hhbmdlIHRoaXMuXCJcbiAgICByZXR1cm4gJ0NoZWNraW5nIHdoZXRoZXIgeW91IGNhbiBjaGFuZ2UgdGhpc+KApidcbiAgfVxuXG4gIHN3aXRjaFJlYXNvbiAoc3c6IFBlcm1pc3Npb25Td2l0Y2gpOiBzdHJpbmcge1xuICAgIGlmIChzdy5yZWFkT25seSB8fCB0aGlzLmNhbk1hbmFnZUFjY2VzcyA9PT0gZmFsc2UpIHJldHVybiBcIk9ubHkgdGhlIHByaW50ZXIncyBvd25lciBjYW4gY2hhbmdlIHRoaXMuXCJcbiAgICByZXR1cm4gJ0NoZWNraW5nIHdoZXRoZXIgeW91IGNhbiBjaGFuZ2UgdGhpc+KApidcbiAgfVxuXG4gIG9uU2VsZWN0IChrOiBQZXJtaXNzaW9uS25vYiwgZTogRXZlbnQpIHtcbiAgICB0aGlzLmNoYW5nZShrLCAoZS50YXJnZXQgYXMgSFRNTFNlbGVjdEVsZW1lbnQpLnZhbHVlKVxuICB9XG5cbiAgYXN5bmMgY2hhbmdlIChrOiBQZXJtaXNzaW9uS25vYiwgdmFsdWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLnNhdmluZyB8fCB2YWx1ZSA9PT0gay52YWx1ZSkgcmV0dXJuXG4gICAgdGhpcy5zYXZpbmcgPSBrLmlkXG4gICAgdGhpcy4kc2V0KHRoaXMubm90ZXMsIGsuaWQsICcnKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgdGhpcy4kaHR0cENsaWVudC5wb3N0KHBlcm1pc3Npb25zUGF0aCh0aGlzLm1hbmFnZWQpLCB7IGlkOiBrLmlkLCB2YWx1ZSB9LCB7IHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlIH0pXG4gICAgICBjb25zdCBvID0gY2hhbmdlT3V0Y29tZShyLnN0YXR1cywgci5kYXRhKVxuICAgICAgaWYgKG8ua2luZCA9PT0gJ2FwcGxpZWQnICYmIG8ua25vYj8uaWQgPT09IGsuaWQpIHtcbiAgICAgICAgY29uc3Qga2VwdCA9IHsgLi4uby5rbm9iLCBkZWZhdWx0VmFsdWU6IGsuZGVmYXVsdFZhbHVlIH1cbiAgICAgICAgdGhpcy5rbm9icyA9ICh0aGlzLmtub2JzID8/IFtdKS5tYXAoeCA9PiAoeC5pZCA9PT0gay5pZCA/IGtlcHQgOiB4KSlcbiAgICAgIH0gZWxzZSBpZiAoby5raW5kID09PSAnYXBwbGllZCcpIHtcbiAgICAgICAgLy8gVGFrZW4sIGJ1dCB0aGUgYW5zd2VyIGRvZXNuJ3Qgc2F5IHdoYXQgaXQgaXMgbm93OiB0aGUgcHJpbnRlcidzIGxpc3QgaXMgdGhlIHRydXRoLlxuICAgICAgICBhd2FpdCB0aGlzLmxvYWQoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kc2V0KHRoaXMubm90ZXMsIGsuaWQsIG91dGNvbWVOb3RlKG8pKVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy4kc2V0KHRoaXMubm90ZXMsIGsuaWQsIFwiVGhlIHByaW50ZXIgZGlkbid0IGFuc3dlci4gVHJ5IGFnYWluLlwiKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnNhdmluZyA9ICcnXG4gICAgICAvLyBBIHJlZnVzZWQgY2hhbmdlIGxlYXZlcyB0aGUgc2VsZWN0IHNob3dpbmcgd2hhdCB0aGUgcHJpbnRlciBrZXB0LlxuICAgICAgdGhpcy5rbm9icyA9IHRoaXMua25vYnMgPyBbLi4udGhpcy5rbm9ic10gOiBudWxsXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgb25Td2l0Y2ggKHN3OiBQZXJtaXNzaW9uU3dpdGNoLCB2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLnNhdmluZyB8fCB2YWx1ZSA9PT0gc3cudmFsdWUpIHJldHVyblxuICAgIGNvbnN0IGtleSA9IGBzd2l0Y2g6JHtzdy5pZH1gXG4gICAgdGhpcy5zYXZpbmcgPSBrZXlcbiAgICB0aGlzLiRzZXQodGhpcy5ub3Rlcywga2V5LCAnJylcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IHRoaXMuJGh0dHBDbGllbnQucG9zdChzd2l0Y2hQYXRoKHRoaXMubWFuYWdlZCksIHsgaWQ6IHN3LmlkLCB2YWx1ZSB9LCB7IHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlIH0pXG4gICAgICBjb25zdCBvID0gc3dpdGNoT3V0Y29tZShyLnN0YXR1cywgci5kYXRhKVxuICAgICAgaWYgKG8ua2luZCA9PT0gJ3N3aXRjaCcgJiYgby52YWx1ZT8uaWQgPT09IHN3LmlkKSB7XG4gICAgICAgIGNvbnN0IGtlcHQgPSBvLnZhbHVlXG4gICAgICAgIHRoaXMuc3dpdGNoZXMgPSB0aGlzLnN3aXRjaGVzLm1hcCh4ID0+ICh4LmlkID09PSBzdy5pZCA/IHsgLi4ua2VwdCwgZGVmYXVsdFZhbHVlOiBrZXB0LmRlZmF1bHRWYWx1ZSA/PyB4LmRlZmF1bHRWYWx1ZSB9IDogeCkpXG4gICAgICB9IGVsc2UgaWYgKG8ua2luZCA9PT0gJ3N3aXRjaCcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJHNldCh0aGlzLm5vdGVzLCBrZXksIG91dGNvbWVOb3RlKG8pKVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy4kc2V0KHRoaXMubm90ZXMsIGtleSwgXCJUaGUgcHJpbnRlciBkaWRuJ3QgYW5zd2VyLiBUcnkgYWdhaW4uXCIpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuc2F2aW5nID0gJydcbiAgICAgIHRoaXMuc3dpdGNoZXMgPSBbLi4udGhpcy5zd2l0Y2hlc11cbiAgICB9XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5zZWMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE0cHg7XG4gICAgcGFkZGluZzogMjBweDtcbiAgICBib3JkZXItcmFkaXVzOiAyMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgLnNlY19faGVhZCB7XG4gICAgaDIge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgZm9udC1zaXplOiAxN3B4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG5cbiAgICBwIHtcbiAgICAgIG1hcmdpbjogMnB4IDAgMDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxuICB9XG5cbiAgLnNlY19fcHJlc2V0cyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgZ2FwOiA4cHggMTJweDtcbiAgICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5zZWNfX3NlZyB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcblxuICAgIGJ1dHRvbiB7XG4gICAgICBtaW4taGVpZ2h0OiA0MHB4O1xuICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgYm9yZGVyOiAwO1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgY3Vyc29yOiBwb2ludGVyO1xuXG4gICAgICAmICsgYnV0dG9uIHtcbiAgICAgICAgYm9yZGVyLWxlZnQ6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyk7XG4gICAgICB9XG5cbiAgICAgICY6ZGlzYWJsZWQge1xuICAgICAgICBvcGFjaXR5OiAwLjY7XG4gICAgICAgIGN1cnNvcjogZGVmYXVsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAuc2VjX19zZWctLW9uIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LCAjM2I4MmY2KSAhaW1wb3J0YW50O1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtb24tYWNjZW50LCAjZmZmKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLnNlY19fcm93IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDhweCAxMnB4O1xuICAgIHBhZGRpbmctdG9wOiAxMnB4O1xuICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgfVxuXG4gIC5zZWNfX3RpdGxlcyB7XG4gICAgZmxleDogMSAxIDIyMHB4O1xuICAgIG1pbi13aWR0aDogMDtcblxuICAgIGgzIHtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDJweCAwIDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5zZWNfX3NlbGVjdCB7XG4gICAgbWluLWhlaWdodDogNDBweDtcbiAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgcGFkZGluZzogMCAxMnB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLnNlY19fZGVmYXVsdCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAuc2VjX19kZWZhdWx0LS1jaGFuZ2VkIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXdhcm5pbmcsICNlODk2M2MpO1xuICB9XG5cbiAgLnNlY19fYmxvY2sge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDRweDtcbiAgICBwYWRkaW5nLXRvcDogMTRweDtcbiAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG5cbiAgICA+IGgzIHtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgPiBwIHtcbiAgICAgIG1hcmdpbjogMCAwIDZweDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxuICB9XG5cbiAgLnNlY19fbm90ZSB7XG4gICAgZmxleDogMSAxIDEwMCU7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLnNlY19fbm90ZS0td2FybiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nLCAjZTg5NjNjKTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL1NlY3VyaXR5U2V0dGluZ3MudnVlIn0=