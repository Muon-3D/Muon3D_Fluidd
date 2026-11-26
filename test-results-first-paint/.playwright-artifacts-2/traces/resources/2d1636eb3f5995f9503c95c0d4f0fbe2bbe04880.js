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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { reportedNumber } from "/src/services/maintenance/model.ts";
let MaintenanceResult = class extends Vue {
  check;
  get rows() {
    const settings = this.$store.state.printer.printer.configfile?.settings ?? {};
    const pending = this.$store.getters["printer/getSaveConfigPendingItems"] ?? {};
    if (this.check === "firstLayer") {
      const probe = this.$store.getters["printer/getProbe"];
      const name = probe?.name ?? "stepper_z";
      const key = probe ? "z_offset" : "position_endstop";
      const raw = pending[name]?.[key] ?? settings[name]?.[key];
      const value = reportedNumber(raw);
      return value !== null ? [{ label: probe ? "Probe Z offset" : "Z endstop", source: pending[name]?.[key] !== void 0 ? "awaiting save" : "printer.cfg", value: `${value.toFixed(3)} mm` }] : [];
    }
    return Object.keys({ ...settings, ...pending }).filter((name) => /^(extruder\d*|heater_bed|heater_generic .+)$/.test(name)).flatMap((name) => {
      const values = { ...settings[name], ...pending[name] };
      const keys = ["pid_kp", "pid_ki", "pid_kd", "heater_power", "block_heat_capacity"];
      const result = keys.filter((k) => reportedNumber(values[k]) !== null).map((k) => `${{ pid_kp: "Kp", pid_ki: "Ki", pid_kd: "Kd", heater_power: "Power W", block_heat_capacity: "Heat capacity J/K" }[k]} ${Number(values[k])}`);
      return result.length ? [{ label: name === "extruder" ? "Nozzle" : name === "heater_bed" ? "Bed" : name.replace("heater_generic ", ""), source: pending[name] ? "awaiting save" : "printer.cfg", value: result.join(" \xB7 ") }] : [];
    });
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], MaintenanceResult.prototype, "check", 2);
MaintenanceResult = __decorateClass([
  Component
], MaintenanceResult);
const _sfc_main = MaintenanceResult;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("dl", { staticClass: "maintenance-result" }, [_vm._l(_vm.rows, function(row) {
    return _c("div", { key: row.label, staticClass: "crow" }, [_c("dt", { staticClass: "crow__name" }, [_vm._v(" " + _vm._s(row.label) + " "), _c("span", { staticClass: "crow__sub" }, [_vm._v("\xB7 " + _vm._s(row.source))])]), _c("dd", { staticClass: "crow__value" }, [_vm._v(" " + _vm._s(row.value) + " ")])]);
  }), !_vm.rows.length ? _c("p", [_vm._v(" No reported values available. ")]) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MaintenanceResult.vue?vue&type=style&index=0&scoped=2d9a4135&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "2d9a4135",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceResult.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXFCQTtBQUNBO0FBR0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFDQSxrS0FDQTtBQUFBLElBQ0E7QUFDQSxvREFDQSw0RUFDQTtBQUNBO0FBQ0E7QUFDQSw0RUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXpCQTtBQUFBO0FBQUEsR0FEQSxrQkFDQTtBQURBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk1haW50ZW5hbmNlUmVzdWx0LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkbCBjbGFzcz1cIm1haW50ZW5hbmNlLXJlc3VsdFwiPlxuICAgIDxkaXZcbiAgICAgIHYtZm9yPVwicm93IGluIHJvd3NcIlxuICAgICAgOmtleT1cInJvdy5sYWJlbFwiXG4gICAgICBjbGFzcz1cImNyb3dcIlxuICAgID5cbiAgICAgIDxkdCBjbGFzcz1cImNyb3dfX25hbWVcIj5cbiAgICAgICAge3sgcm93LmxhYmVsIH19IDxzcGFuIGNsYXNzPVwiY3Jvd19fc3ViXCI+wrcge3sgcm93LnNvdXJjZSB9fTwvc3Bhbj5cbiAgICAgIDwvZHQ+XG4gICAgICA8ZGQgY2xhc3M9XCJjcm93X192YWx1ZVwiPlxuICAgICAgICB7eyByb3cudmFsdWUgfX1cbiAgICAgIDwvZGQ+XG4gICAgPC9kaXY+XG4gICAgPHAgdi1pZj1cIiFyb3dzLmxlbmd0aFwiPlxuICAgICAgTm8gcmVwb3J0ZWQgdmFsdWVzIGF2YWlsYWJsZS5cbiAgICA8L3A+XG4gIDwvZGw+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgcmVwb3J0ZWROdW1iZXIgfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL21vZGVsJ1xuXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZVJlc3VsdCBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBjaGVjayE6ICdmaXJzdExheWVyJyB8ICdwaWQnXG5cbiAgZ2V0IHJvd3MgKCk6IEFycmF5PHsgbGFiZWw6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGU/LnNldHRpbmdzID8/IHt9XG4gICAgY29uc3QgcGVuZGluZyA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0U2F2ZUNvbmZpZ1BlbmRpbmdJdGVtcyddID8/IHt9XG4gICAgaWYgKHRoaXMuY2hlY2sgPT09ICdmaXJzdExheWVyJykge1xuICAgICAgY29uc3QgcHJvYmUgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByb2JlJ11cbiAgICAgIGNvbnN0IG5hbWUgPSBwcm9iZT8ubmFtZSA/PyAnc3RlcHBlcl96J1xuICAgICAgY29uc3Qga2V5ID0gcHJvYmUgPyAnel9vZmZzZXQnIDogJ3Bvc2l0aW9uX2VuZHN0b3AnXG4gICAgICBjb25zdCByYXcgPSBwZW5kaW5nW25hbWVdPy5ba2V5XSA/PyBzZXR0aW5nc1tuYW1lXT8uW2tleV1cbiAgICAgIGNvbnN0IHZhbHVlID0gcmVwb3J0ZWROdW1iZXIocmF3KVxuICAgICAgcmV0dXJuIHZhbHVlICE9PSBudWxsXG4gICAgICAgID8gW3sgbGFiZWw6IHByb2JlID8gJ1Byb2JlIFogb2Zmc2V0JyA6ICdaIGVuZHN0b3AnLCBzb3VyY2U6IHBlbmRpbmdbbmFtZV0/LltrZXldICE9PSB1bmRlZmluZWQgPyAnYXdhaXRpbmcgc2F2ZScgOiAncHJpbnRlci5jZmcnLCB2YWx1ZTogYCR7dmFsdWUudG9GaXhlZCgzKX0gbW1gIH1dXG4gICAgICAgIDogW11cbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHsgLi4uc2V0dGluZ3MsIC4uLnBlbmRpbmcgfSlcbiAgICAgIC5maWx0ZXIobmFtZSA9PiAvXihleHRydWRlclxcZCp8aGVhdGVyX2JlZHxoZWF0ZXJfZ2VuZXJpYyAuKykkLy50ZXN0KG5hbWUpKVxuICAgICAgLmZsYXRNYXAobmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHsgLi4uc2V0dGluZ3NbbmFtZV0sIC4uLnBlbmRpbmdbbmFtZV0gfVxuICAgICAgICBjb25zdCBrZXlzID0gWydwaWRfa3AnLCAncGlkX2tpJywgJ3BpZF9rZCcsICdoZWF0ZXJfcG93ZXInLCAnYmxvY2tfaGVhdF9jYXBhY2l0eSddXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGtleXMuZmlsdGVyKGsgPT4gcmVwb3J0ZWROdW1iZXIodmFsdWVzW2tdKSAhPT0gbnVsbClcbiAgICAgICAgICAubWFwKGsgPT4gYCR7KHsgcGlkX2twOiAnS3AnLCBwaWRfa2k6ICdLaScsIHBpZF9rZDogJ0tkJywgaGVhdGVyX3Bvd2VyOiAnUG93ZXIgVycsIGJsb2NrX2hlYXRfY2FwYWNpdHk6ICdIZWF0IGNhcGFjaXR5IEovSycgfSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtrXX0gJHtOdW1iZXIodmFsdWVzW2tdKX1gKVxuICAgICAgICByZXR1cm4gcmVzdWx0Lmxlbmd0aCA/IFt7IGxhYmVsOiBuYW1lID09PSAnZXh0cnVkZXInID8gJ05venpsZScgOiBuYW1lID09PSAnaGVhdGVyX2JlZCcgPyAnQmVkJyA6IG5hbWUucmVwbGFjZSgnaGVhdGVyX2dlbmVyaWMgJywgJycpLCBzb3VyY2U6IHBlbmRpbmdbbmFtZV0gPyAnYXdhaXRpbmcgc2F2ZScgOiAncHJpbnRlci5jZmcnLCB2YWx1ZTogcmVzdWx0LmpvaW4oJyDCtyAnKSB9XSA6IFtdXG4gICAgICB9KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIHNjb3BlZD5cbi5tYWludGVuYW5jZS1yZXN1bHQgeyBtYXJnaW46IDhweCAwOyBmb250LXNpemU6IDEzcHg7IH1cbi5tYWludGVuYW5jZS1yZXN1bHQgLmNyb3cgeyBmbGV4LXdyYXA6IHdyYXA7IH1cbi5tYWludGVuYW5jZS1yZXN1bHQgZGQgeyBtYXJnaW46IDA7IGZvbnQtc2l6ZTogMTNweDsgb3ZlcmZsb3ctd3JhcDogYW55d2hlcmU7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tYWludGVuYW5jZS9NYWludGVuYW5jZVJlc3VsdC52dWUifQ==