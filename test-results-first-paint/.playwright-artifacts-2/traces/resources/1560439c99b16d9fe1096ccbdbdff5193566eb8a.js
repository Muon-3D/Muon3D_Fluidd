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
import OverviewMixin from "/src/mixins/overview.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { printerTransportBinding } from "/src/services/managed-session/httpTransportBinding.ts";
import { httpClientActions } from "/src/api/httpClientActions.ts";
import { databasePart, expectedCaughtUp, firstLayerAllowed, missingDatabaseKey, nudgeBudget, nudgeFits, readNudgeEntry } from "/src/services/overview/nudges.ts";
class NudgeTargetChanged extends Error {
}
let FirstLayerNudges = class extends Mixins(OverviewMixin) {
  captured = "";
  baseline = null;
  refusal = "";
  pending = false;
  deviceId = `${Date.now()}-${Math.random()}`;
  get managedPrinter() {
    return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.printers.find((p) => p.id === cloudState.activePrinterId) : void 0;
  }
  get knownM1() {
    return ["M1", "Muon3D M1"].includes(this.managedPrinter?.model ?? "");
  }
  get identity() {
    const job = this.currentJob;
    return this.managedPrinter && job?.job_id ? `${this.managedPrinter.id}/${job.job_id}` : "";
  }
  get currentJob() {
    return this.$store.state.history?.jobs?.find((j) => j.status === "in_progress" && j.filename === this.jobFile && !j.end_time);
  }
  get context() {
    return `${this.panelTarget}|${this.identity}`;
  }
  get databaseKey() {
    const [printerId = "", jobId = ""] = this.identity.split("/");
    return `firstLayerNudges.${databasePart(printerId)}.${databasePart(jobId)}`;
  }
  get databaseTarget() {
    return {
      printerId: this.managedPrinter?.id ?? "",
      accountId: cloudState.account?.id ?? "",
      route: `${this.$store.state.config.apiUrl}|${this.$route?.params?.printer ?? ""}`,
      context: this.context,
      databaseKey: this.databaseKey
    };
  }
  get earlyLayer() {
    const layer = this.printStats.info?.current_layer;
    return Number.isInteger(layer) && layer >= 1 && layer <= 3;
  }
  get reportedOffset() {
    const origin = this.$store.state.printer.printer.gcode_move?.homing_origin;
    return Array.isArray(origin) && origin.length >= 3 && typeof origin[2] === "number" && Number.isFinite(origin[2]) ? origin[2] : NaN;
  }
  get budget() {
    return this.baseline === null ? null : nudgeBudget(this.reportedOffset, this.baseline);
  }
  get lockingAvailable() {
    return typeof navigator.locks?.request === "function";
  }
  get canNudge() {
    return !this.pending && this.allowedNow;
  }
  get firmwareNudgeAvailable() {
    return !!this.$store.getters["printer/getAvailableCommands"]?.FIRST_LAYER_NUDGE;
  }
  get allowedNow() {
    return this.isAllowedNow();
  }
  isAllowedNow() {
    const commands = this.$store.getters["printer/getAvailableCommands"];
    const roleAllowsControl = !isManagedApiUrl(this.$store.state.config.apiUrl) || this.managedPrinter?.role === "operator";
    return this.lockingAvailable && this.captured === this.context && firstLayerAllowed({ m1: this.knownM1, identity: this.identity, layer: this.printStats.info?.current_layer ?? NaN, printing: this.printerPrinting && !this.printerPaused && this.$store.state.printer.printer.pause_resume?.is_paused !== true, ready: roleAllowsControl && this.controlReady && !!(commands?.FIRST_LAYER_NUDGE || commands?.SET_GCODE_OFFSET), homed: this.isHomed("Z"), waiting: this.hasWait(this.$waits.onZAdjust) });
  }
  canMove(by) {
    return Number.isFinite(this.reportedOffset) && (this.baseline === null || nudgeFits(this.reportedOffset, this.baseline, by));
  }
  bind() {
    this.captured = this.context;
    this.baseline = null;
    this.refusal = "";
    if (!this.pending) this.refreshBaseline();
  }
  targetMatches(target) {
    const current = this.databaseTarget;
    return target.printerId === current.printerId && target.accountId === current.accountId && target.route === current.route && target.context === current.context && target.databaseKey === current.databaseKey;
  }
  assertDatabaseTarget(target) {
    if (!this.targetMatches(target) || !this.isAllowedNow()) throw new NudgeTargetChanged();
  }
  async readSharedEntry(target) {
    try {
      this.assertDatabaseTarget(target);
      const response = await httpClientActions.serverDatabaseItemGet("fluidd", { params: { key: target.databaseKey } });
      return readNudgeEntry(response.data.result.value);
    } catch (error) {
      if (missingDatabaseKey(error)) return void 0;
      throw error;
    }
  }
  entryMatches(entry) {
    return entry.start_time === this.currentJob?.start_time && entry.filename === this.currentJob?.filename;
  }
  async pruneAndWrite(target, entry) {
    const printerKey = target.databaseKey.split(".").slice(0, 2).join(".");
    let values = {};
    try {
      this.assertDatabaseTarget(target);
      const response = await httpClientActions.serverDatabaseItemGet("fluidd", { params: { key: printerKey } });
      values = response.data.result.value ?? {};
    } catch (error) {
      if (!missingDatabaseKey(error)) throw error;
    }
    const active = new Set((this.$store.state.history?.jobs ?? []).filter((job) => job.status === "in_progress" && !job.end_time).map((job) => databasePart(String(job.job_id))));
    for (const jobId of Object.keys(values)) {
      if (!active.has(jobId)) {
        this.assertDatabaseTarget(target);
        await httpClientActions.serverDatabaseItemDelete("fluidd", `${printerKey}.${jobId}`);
      }
    }
    this.assertDatabaseTarget(target);
    await httpClientActions.serverDatabaseItemPost("fluidd", target.databaseKey, entry);
  }
  async refreshBaseline() {
    if (!this.identity) return;
    const context = this.context;
    const target = this.databaseTarget;
    try {
      const entry = await this.readSharedEntry(target);
      if (context === this.context && entry && this.entryMatches(entry)) this.baseline = entry.baseline;
    } catch {
    }
  }
  async nudge(by) {
    if (!this.canNudge || ![-0.01, 0.01].includes(by)) return;
    const context = this.context;
    const target = this.databaseTarget;
    const execute = async () => {
      if (context !== this.context || !this.isAllowedNow()) return;
      const before = this.reportedOffset;
      if (!Number.isFinite(before)) {
        this.refusal = "No adjustment sent. The printer Z offset is unknown.";
        return;
      }
      try {
        let entry = await this.readSharedEntry(target);
        if (entry === null) {
          this.refusal = "No adjustment sent. The shared baseline is unknown.";
          return;
        }
        if (entry === void 0) {
          const job = this.currentJob;
          if (!job || !Number.isFinite(job.start_time)) {
            this.refusal = "No adjustment sent. The print identity is unknown.";
            return;
          }
          await this.pruneAndWrite(target, { baseline: before, start_time: job.start_time, filename: job.filename });
          entry = await this.readSharedEntry(target);
          if (!entry || !this.entryMatches(entry) || Math.abs(entry.baseline - before) > 1e-8) {
            this.refusal = "No adjustment sent. The shared baseline did not agree after saving.";
            return;
          }
        }
        if (!this.entryMatches(entry)) {
          this.refusal = "No adjustment sent. The shared baseline belongs to a different print.";
          return;
        }
        this.baseline = entry.baseline;
        if (context !== this.context || !this.isAllowedNow()) return;
        if (entry.pending && entry.expected !== void 0 && !expectedCaughtUp(this.reportedOffset, entry.expected, entry.pending.from, entry.pending.step) && Date.now() - entry.pending.created <= 5e3) {
          this.refusal = "No adjustment sent. A shared nudge is still awaiting printer confirmation.";
          return;
        }
        if (entry.pending) {
          const printerMoved = Math.abs(this.reportedOffset - entry.pending.from) > 1e-8;
          entry = { ...entry, expected: printerMoved || entry.expected === void 0 ? this.reportedOffset : entry.expected };
          delete entry.pending;
          await this.pruneAndWrite(target, entry);
          if (context !== this.context || !this.isAllowedNow()) return;
        }
        const effectiveOffset = entry.expected === void 0 ? this.reportedOffset : Math.abs(entry.expected - entry.baseline) > Math.abs(this.reportedOffset - entry.baseline) ? entry.expected : this.reportedOffset;
        if (!nudgeFits(effectiveOffset, entry.baseline, by)) {
          this.refusal = "No adjustment sent. The shared 0.10 mm allowance would be exceeded.";
          return;
        }
        const nonce = `${Date.now()}-${Math.random()}`;
        const reserved = { ...entry, expected: effectiveOffset + by, pending: { created: Date.now(), from: this.reportedOffset, step: by, device: this.deviceId, nonce } };
        await this.pruneAndWrite(target, reserved);
        const confirmed = await this.readSharedEntry(target);
        if (!this.targetMatches(target) || context !== this.context || !this.isAllowedNow() || !confirmed || !this.entryMatches(confirmed) || confirmed.expected !== reserved.expected || confirmed.pending?.device !== this.deviceId || confirmed.pending?.nonce !== nonce || confirmed.pending?.from !== this.reportedOffset) {
          this.refusal = "No adjustment sent. The shared nudge reservation was not confirmed.";
          return;
        }
      } catch {
        this.refusal = "No adjustment sent. The shared nudge database is unavailable.";
        return;
      }
      this.refusal = "";
      if (!this.targetMatches(target) || !this.isAllowedNow()) return;
      if (this.firmwareNudgeAvailable) this.sendGcode(`FIRST_LAYER_NUDGE DIRECTION=${by < 0 ? "CLOSER" : "FURTHER"}`, this.$waits.onZAdjust);
      else this.adjustZ(by);
    };
    this.pending = true;
    try {
      await navigator.locks.request(`muon-first-layer:${this.identity}`, execute);
    } catch {
      this.refusal = "No adjustment sent. The nudge allowance could not be locked.";
    } finally {
      this.pending = false;
    }
  }
};
__decorateClass([
  Watch("context", { immediate: true })
], FirstLayerNudges.prototype, "bind", 1);
FirstLayerNudges = __decorateClass([
  Component
], FirstLayerNudges);
const _sfc_main = FirstLayerNudges;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.knownM1 && _vm.identity && _vm.earlyLayer ? _c("div", { staticClass: "first-layer-nudges" }, [_c("b", [_vm._v("First layer height")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.canNudge || !_vm.canMove(-0.01) }, on: { "click": function($event) {
    return _vm.nudge(-0.01);
  } } }, [_vm._v(" Nozzle closer \xB7 0.01 mm ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.canNudge || !_vm.canMove(0.01) }, on: { "click": function($event) {
    return _vm.nudge(0.01);
  } } }, [_vm._v(" Nozzle further \xB7 0.01 mm ")]), _vm.budget ? _c("p", [_vm._v(" " + _vm._s(_vm.budget.total > 0 ? "+" : "") + _vm._s(_vm.budget.total.toFixed(2)) + " mm from the start of this print \xB7 " + _vm._s(_vm.budget.remaining.toFixed(2)) + " mm remaining. ")]) : _c("p", [_vm._v(" Shared nudge allowance is loading or unavailable. No adjustment sent. ")]), !_vm.lockingAvailable ? _c("p", { attrs: { "role": "status" } }, [_vm._v(" Nudges are unavailable in this browser. ")]) : _vm._e(), _vm.refusal ? _c("p", { attrs: { "role": "status" } }, [_vm._v(" " + _vm._s(_vm.refusal) + " ")]) : _vm._e(), _c("small", [_vm._v("Layers 1\u20133 only. " + _vm._s(_vm.firmwareNudgeAvailable ? "The printer enforces the limit." : "Shared limit, best effort: this printer doesn't enforce one yet.") + " These nudges are not saved as calibration.")])]) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/overview/FirstLayerNudges.vue?vue&type=style&index=0&scoped=4bb8317e&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "4bb8317e",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/overview/FirstLayerNudges.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQUE7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsUUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLFFBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQSxRQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUE7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQ0E7QUE1SEE7QUFBQSxFQURBO0FBQUEsR0F6REEsaUJBMERBO0FBMURBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkZpcnN0TGF5ZXJOdWRnZXMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIHYtaWY9XCJrbm93bk0xICYmIGlkZW50aXR5ICYmIGVhcmx5TGF5ZXJcIlxuICAgIGNsYXNzPVwiZmlyc3QtbGF5ZXItbnVkZ2VzXCJcbiAgPlxuICAgIDxiPkZpcnN0IGxheWVyIGhlaWdodDwvYj5cbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICA6ZGlzYWJsZWQ9XCIhY2FuTnVkZ2UgfHwgIWNhbk1vdmUoLTAuMDEpXCJcbiAgICAgIEBjbGljaz1cIm51ZGdlKC0wLjAxKVwiXG4gICAgPlxuICAgICAgTm96emxlIGNsb3NlciDCtyAwLjAxIG1tXG4gICAgPC9idXR0b24+XG4gICAgPGJ1dHRvblxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgOmRpc2FibGVkPVwiIWNhbk51ZGdlIHx8ICFjYW5Nb3ZlKDAuMDEpXCJcbiAgICAgIEBjbGljaz1cIm51ZGdlKDAuMDEpXCJcbiAgICA+XG4gICAgICBOb3p6bGUgZnVydGhlciDCtyAwLjAxIG1tXG4gICAgPC9idXR0b24+XG4gICAgPHAgdi1pZj1cImJ1ZGdldFwiPlxuICAgICAge3sgYnVkZ2V0LnRvdGFsID4gMCA/ICcrJyA6ICcnIH19e3sgYnVkZ2V0LnRvdGFsLnRvRml4ZWQoMikgfX0gbW0gZnJvbSB0aGUgc3RhcnQgb2YgdGhpcyBwcmludCDCtyB7eyBidWRnZXQucmVtYWluaW5nLnRvRml4ZWQoMikgfX0gbW0gcmVtYWluaW5nLlxuICAgIDwvcD5cbiAgICA8cCB2LWVsc2U+XG4gICAgICBTaGFyZWQgbnVkZ2UgYWxsb3dhbmNlIGlzIGxvYWRpbmcgb3IgdW5hdmFpbGFibGUuIE5vIGFkanVzdG1lbnQgc2VudC5cbiAgICA8L3A+XG4gICAgPHBcbiAgICAgIHYtaWY9XCIhbG9ja2luZ0F2YWlsYWJsZVwiXG4gICAgICByb2xlPVwic3RhdHVzXCJcbiAgICA+XG4gICAgICBOdWRnZXMgYXJlIHVuYXZhaWxhYmxlIGluIHRoaXMgYnJvd3Nlci5cbiAgICA8L3A+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJyZWZ1c2FsXCJcbiAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgID5cbiAgICAgIHt7IHJlZnVzYWwgfX1cbiAgICA8L3A+XG4gICAgPHNtYWxsPkxheWVycyAx4oCTMyBvbmx5LiB7eyBmaXJtd2FyZU51ZGdlQXZhaWxhYmxlID8gJ1RoZSBwcmludGVyIGVuZm9yY2VzIHRoZSBsaW1pdC4nIDogXCJTaGFyZWQgbGltaXQsIGJlc3QgZWZmb3J0OiB0aGlzIHByaW50ZXIgZG9lc24ndCBlbmZvcmNlIG9uZSB5ZXQuXCIgfX0gVGhlc2UgbnVkZ2VzIGFyZSBub3Qgc2F2ZWQgYXMgY2FsaWJyYXRpb24uPC9zbWFsbD5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgT3ZlcnZpZXdNaXhpbiBmcm9tICdAL21peGlucy9vdmVydmlldydcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgcHJpbnRlclRyYW5zcG9ydEJpbmRpbmcgfSBmcm9tICdAL3NlcnZpY2VzL21hbmFnZWQtc2Vzc2lvbi9odHRwVHJhbnNwb3J0QmluZGluZydcbmltcG9ydCB7IGh0dHBDbGllbnRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvaHR0cENsaWVudEFjdGlvbnMnXG5pbXBvcnQgeyBkYXRhYmFzZVBhcnQsIGV4cGVjdGVkQ2F1Z2h0VXAsIGZpcnN0TGF5ZXJBbGxvd2VkLCBtaXNzaW5nRGF0YWJhc2VLZXksIG51ZGdlQnVkZ2V0LCBudWRnZUZpdHMsIHJlYWROdWRnZUVudHJ5IH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy9udWRnZXMnXG5pbXBvcnQgdHlwZSB7IE51ZGdlRGF0YWJhc2VUYXJnZXQsIE51ZGdlRW50cnkgfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L251ZGdlcydcbmltcG9ydCB0eXBlIHsgSGlzdG9yeUl0ZW0gfSBmcm9tICdAL3N0b3JlL2hpc3RvcnkvdHlwZXMnXG5cbmNsYXNzIE51ZGdlVGFyZ2V0Q2hhbmdlZCBleHRlbmRzIEVycm9yIHt9XG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaXJzdExheWVyTnVkZ2VzIGV4dGVuZHMgTWl4aW5zKE92ZXJ2aWV3TWl4aW4pIHtcbiAgY2FwdHVyZWQgPSAnJ1xuICBiYXNlbGluZTogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgcmVmdXNhbCA9ICcnXG4gIHBlbmRpbmcgPSBmYWxzZVxuICByZWFkb25seSBkZXZpY2VJZCA9IGAke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKX1gXG4gIGdldCBtYW5hZ2VkUHJpbnRlciAoKSB7IHJldHVybiBpc01hbmFnZWRBcGlVcmwodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybCkgJiYgcHJpbnRlclRyYW5zcG9ydEJpbmRpbmcucmVtb3RlID8gY2xvdWRTdGF0ZS5wcmludGVycy5maW5kKHAgPT4gcC5pZCA9PT0gY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQpIDogdW5kZWZpbmVkIH1cbiAgZ2V0IGtub3duTTEgKCk6IGJvb2xlYW4geyByZXR1cm4gWydNMScsICdNdW9uM0QgTTEnXS5pbmNsdWRlcyh0aGlzLm1hbmFnZWRQcmludGVyPy5tb2RlbCA/PyAnJykgfVxuICBnZXQgaWRlbnRpdHkgKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgam9iID0gdGhpcy5jdXJyZW50Sm9iXG4gICAgcmV0dXJuIHRoaXMubWFuYWdlZFByaW50ZXIgJiYgam9iPy5qb2JfaWQgPyBgJHt0aGlzLm1hbmFnZWRQcmludGVyLmlkfS8ke2pvYi5qb2JfaWR9YCA6ICcnXG4gIH1cblxuICBnZXQgY3VycmVudEpvYiAoKTogSGlzdG9yeUl0ZW0gfCB1bmRlZmluZWQgeyByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuaGlzdG9yeT8uam9icz8uZmluZCgoajogSGlzdG9yeUl0ZW0pID0+IGouc3RhdHVzID09PSAnaW5fcHJvZ3Jlc3MnICYmIGouZmlsZW5hbWUgPT09IHRoaXMuam9iRmlsZSAmJiAhai5lbmRfdGltZSkgfVxuXG4gIGdldCBjb250ZXh0ICgpOiBzdHJpbmcgeyByZXR1cm4gYCR7dGhpcy5wYW5lbFRhcmdldH18JHt0aGlzLmlkZW50aXR5fWAgfVxuICBnZXQgZGF0YWJhc2VLZXkgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgW3ByaW50ZXJJZCA9ICcnLCBqb2JJZCA9ICcnXSA9IHRoaXMuaWRlbnRpdHkuc3BsaXQoJy8nKVxuICAgIHJldHVybiBgZmlyc3RMYXllck51ZGdlcy4ke2RhdGFiYXNlUGFydChwcmludGVySWQpfS4ke2RhdGFiYXNlUGFydChqb2JJZCl9YFxuICB9XG5cbiAgZ2V0IGRhdGFiYXNlVGFyZ2V0ICgpOiBOdWRnZURhdGFiYXNlVGFyZ2V0IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJpbnRlcklkOiB0aGlzLm1hbmFnZWRQcmludGVyPy5pZCA/PyAnJyxcbiAgICAgIGFjY291bnRJZDogY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyAnJyxcbiAgICAgIHJvdXRlOiBgJHt0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsfXwke3RoaXMuJHJvdXRlPy5wYXJhbXM/LnByaW50ZXIgPz8gJyd9YCxcbiAgICAgIGNvbnRleHQ6IHRoaXMuY29udGV4dCxcbiAgICAgIGRhdGFiYXNlS2V5OiB0aGlzLmRhdGFiYXNlS2V5XG4gICAgfVxuICB9XG5cbiAgZ2V0IGVhcmx5TGF5ZXIgKCk6IGJvb2xlYW4geyBjb25zdCBsYXllciA9IHRoaXMucHJpbnRTdGF0cy5pbmZvPy5jdXJyZW50X2xheWVyOyByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcihsYXllcikgJiYgbGF5ZXIgPj0gMSAmJiBsYXllciA8PSAzIH1cbiAgZ2V0IHJlcG9ydGVkT2Zmc2V0ICgpOiBudW1iZXIge1xuICAgIGNvbnN0IG9yaWdpbiA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5nY29kZV9tb3ZlPy5ob21pbmdfb3JpZ2luXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkob3JpZ2luKSAmJiBvcmlnaW4ubGVuZ3RoID49IDMgJiYgdHlwZW9mIG9yaWdpblsyXSA9PT0gJ251bWJlcicgJiYgTnVtYmVyLmlzRmluaXRlKG9yaWdpblsyXSkgPyBvcmlnaW5bMl0gOiBOYU5cbiAgfVxuXG4gIGdldCBidWRnZXQgKCkgeyByZXR1cm4gdGhpcy5iYXNlbGluZSA9PT0gbnVsbCA/IG51bGwgOiBudWRnZUJ1ZGdldCh0aGlzLnJlcG9ydGVkT2Zmc2V0LCB0aGlzLmJhc2VsaW5lKSB9XG4gIGdldCBsb2NraW5nQXZhaWxhYmxlICgpOiBib29sZWFuIHsgcmV0dXJuIHR5cGVvZiBuYXZpZ2F0b3IubG9ja3M/LnJlcXVlc3QgPT09ICdmdW5jdGlvbicgfVxuICBnZXQgY2FuTnVkZ2UgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5wZW5kaW5nICYmIHRoaXMuYWxsb3dlZE5vd1xuICB9XG5cbiAgZ2V0IGZpcm13YXJlTnVkZ2VBdmFpbGFibGUgKCk6IGJvb2xlYW4geyByZXR1cm4gISF0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEF2YWlsYWJsZUNvbW1hbmRzJ10/LkZJUlNUX0xBWUVSX05VREdFIH1cblxuICBnZXQgYWxsb3dlZE5vdyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNBbGxvd2VkTm93KClcbiAgfVxuXG4gIGlzQWxsb3dlZE5vdyAoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgY29tbWFuZHMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEF2YWlsYWJsZUNvbW1hbmRzJ11cbiAgICBjb25zdCByb2xlQWxsb3dzQ29udHJvbCA9ICFpc01hbmFnZWRBcGlVcmwodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybCkgfHwgdGhpcy5tYW5hZ2VkUHJpbnRlcj8ucm9sZSA9PT0gJ29wZXJhdG9yJ1xuICAgIHJldHVybiB0aGlzLmxvY2tpbmdBdmFpbGFibGUgJiYgdGhpcy5jYXB0dXJlZCA9PT0gdGhpcy5jb250ZXh0ICYmIGZpcnN0TGF5ZXJBbGxvd2VkKHsgbTE6IHRoaXMua25vd25NMSwgaWRlbnRpdHk6IHRoaXMuaWRlbnRpdHksIGxheWVyOiB0aGlzLnByaW50U3RhdHMuaW5mbz8uY3VycmVudF9sYXllciA/PyBOYU4sIHByaW50aW5nOiB0aGlzLnByaW50ZXJQcmludGluZyAmJiAhdGhpcy5wcmludGVyUGF1c2VkICYmIHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wYXVzZV9yZXN1bWU/LmlzX3BhdXNlZCAhPT0gdHJ1ZSwgcmVhZHk6IHJvbGVBbGxvd3NDb250cm9sICYmIHRoaXMuY29udHJvbFJlYWR5ICYmICEhKGNvbW1hbmRzPy5GSVJTVF9MQVlFUl9OVURHRSB8fCBjb21tYW5kcz8uU0VUX0dDT0RFX09GRlNFVCksIGhvbWVkOiB0aGlzLmlzSG9tZWQoJ1onKSwgd2FpdGluZzogdGhpcy5oYXNXYWl0KHRoaXMuJHdhaXRzLm9uWkFkanVzdCkgfSlcbiAgfVxuXG4gIGNhbk1vdmUgKGJ5OiBudW1iZXIpOiBib29sZWFuIHsgcmV0dXJuIE51bWJlci5pc0Zpbml0ZSh0aGlzLnJlcG9ydGVkT2Zmc2V0KSAmJiAodGhpcy5iYXNlbGluZSA9PT0gbnVsbCB8fCBudWRnZUZpdHModGhpcy5yZXBvcnRlZE9mZnNldCwgdGhpcy5iYXNlbGluZSwgYnkpKSB9XG5cbiAgQFdhdGNoKCdjb250ZXh0JywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgYmluZCAoKSB7XG4gICAgdGhpcy5jYXB0dXJlZCA9IHRoaXMuY29udGV4dDsgdGhpcy5iYXNlbGluZSA9IG51bGw7IHRoaXMucmVmdXNhbCA9ICcnXG4gICAgLy8gQSBzZWxlY3Rpb24gY2hhbmdlIGR1cmluZyBhIG51ZGdlIG11c3Qgb25seSBhYm9ydCB0aGF0IHNlcXVlbmNlOyBkbyBub3RcbiAgICAvLyBzdGFydCBhIGJhY2tncm91bmQgZGF0YWJhc2UgcmVhZCBhZ2FpbnN0IHRoZSBuZXdseSBzZWxlY3RlZCB0YXJnZXQuXG4gICAgaWYgKCF0aGlzLnBlbmRpbmcpIHRoaXMucmVmcmVzaEJhc2VsaW5lKClcbiAgfVxuXG4gIHRhcmdldE1hdGNoZXMgKHRhcmdldDogTnVkZ2VEYXRhYmFzZVRhcmdldCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmRhdGFiYXNlVGFyZ2V0XG4gICAgcmV0dXJuIHRhcmdldC5wcmludGVySWQgPT09IGN1cnJlbnQucHJpbnRlcklkICYmIHRhcmdldC5hY2NvdW50SWQgPT09IGN1cnJlbnQuYWNjb3VudElkICYmIHRhcmdldC5yb3V0ZSA9PT0gY3VycmVudC5yb3V0ZSAmJiB0YXJnZXQuY29udGV4dCA9PT0gY3VycmVudC5jb250ZXh0ICYmIHRhcmdldC5kYXRhYmFzZUtleSA9PT0gY3VycmVudC5kYXRhYmFzZUtleVxuICB9XG5cbiAgYXNzZXJ0RGF0YWJhc2VUYXJnZXQgKHRhcmdldDogTnVkZ2VEYXRhYmFzZVRhcmdldCk6IHZvaWQge1xuICAgIGlmICghdGhpcy50YXJnZXRNYXRjaGVzKHRhcmdldCkgfHwgIXRoaXMuaXNBbGxvd2VkTm93KCkpIHRocm93IG5ldyBOdWRnZVRhcmdldENoYW5nZWQoKVxuICB9XG5cbiAgYXN5bmMgcmVhZFNoYXJlZEVudHJ5ICh0YXJnZXQ6IE51ZGdlRGF0YWJhc2VUYXJnZXQpOiBQcm9taXNlPE51ZGdlRW50cnkgfCBudWxsIHwgdW5kZWZpbmVkPiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuYXNzZXJ0RGF0YWJhc2VUYXJnZXQodGFyZ2V0KVxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBodHRwQ2xpZW50QWN0aW9ucy5zZXJ2ZXJEYXRhYmFzZUl0ZW1HZXQ8dW5rbm93bj4oJ2ZsdWlkZCcsIHsgcGFyYW1zOiB7IGtleTogdGFyZ2V0LmRhdGFiYXNlS2V5IH0gfSlcbiAgICAgIHJldHVybiByZWFkTnVkZ2VFbnRyeShyZXNwb25zZS5kYXRhLnJlc3VsdC52YWx1ZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKG1pc3NpbmdEYXRhYmFzZUtleShlcnJvcikpIHJldHVybiB1bmRlZmluZWRcbiAgICAgIHRocm93IGVycm9yXG4gICAgfVxuICB9XG5cbiAgZW50cnlNYXRjaGVzIChlbnRyeTogTnVkZ2VFbnRyeSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlbnRyeS5zdGFydF90aW1lID09PSB0aGlzLmN1cnJlbnRKb2I/LnN0YXJ0X3RpbWUgJiYgZW50cnkuZmlsZW5hbWUgPT09IHRoaXMuY3VycmVudEpvYj8uZmlsZW5hbWVcbiAgfVxuXG4gIGFzeW5jIHBydW5lQW5kV3JpdGUgKHRhcmdldDogTnVkZ2VEYXRhYmFzZVRhcmdldCwgZW50cnk6IE51ZGdlRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwcmludGVyS2V5ID0gdGFyZ2V0LmRhdGFiYXNlS2V5LnNwbGl0KCcuJykuc2xpY2UoMCwgMikuam9pbignLicpXG4gICAgbGV0IHZhbHVlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fVxuICAgIHRyeSB7XG4gICAgICB0aGlzLmFzc2VydERhdGFiYXNlVGFyZ2V0KHRhcmdldClcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyRGF0YWJhc2VJdGVtR2V0PFJlY29yZDxzdHJpbmcsIHVua25vd24+PignZmx1aWRkJywgeyBwYXJhbXM6IHsga2V5OiBwcmludGVyS2V5IH0gfSlcbiAgICAgIHZhbHVlcyA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnZhbHVlID8/IHt9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmICghbWlzc2luZ0RhdGFiYXNlS2V5KGVycm9yKSkgdGhyb3cgZXJyb3JcbiAgICB9XG4gICAgY29uc3QgYWN0aXZlID0gbmV3IFNldCgodGhpcy4kc3RvcmUuc3RhdGUuaGlzdG9yeT8uam9icyA/PyBbXSkuZmlsdGVyKChqb2I6IEhpc3RvcnlJdGVtKSA9PiBqb2Iuc3RhdHVzID09PSAnaW5fcHJvZ3Jlc3MnICYmICFqb2IuZW5kX3RpbWUpLm1hcCgoam9iOiBIaXN0b3J5SXRlbSkgPT4gZGF0YWJhc2VQYXJ0KFN0cmluZyhqb2Iuam9iX2lkKSkpKVxuICAgIGZvciAoY29uc3Qgam9iSWQgb2YgT2JqZWN0LmtleXModmFsdWVzKSkge1xuICAgICAgaWYgKCFhY3RpdmUuaGFzKGpvYklkKSkge1xuICAgICAgICB0aGlzLmFzc2VydERhdGFiYXNlVGFyZ2V0KHRhcmdldClcbiAgICAgICAgYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyRGF0YWJhc2VJdGVtRGVsZXRlKCdmbHVpZGQnLCBgJHtwcmludGVyS2V5fS4ke2pvYklkfWApXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYXNzZXJ0RGF0YWJhc2VUYXJnZXQodGFyZ2V0KVxuICAgIGF3YWl0IGh0dHBDbGllbnRBY3Rpb25zLnNlcnZlckRhdGFiYXNlSXRlbVBvc3QoJ2ZsdWlkZCcsIHRhcmdldC5kYXRhYmFzZUtleSwgZW50cnkpXG4gIH1cblxuICBhc3luYyByZWZyZXNoQmFzZWxpbmUgKCkge1xuICAgIGlmICghdGhpcy5pZGVudGl0eSkgcmV0dXJuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dFxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZGF0YWJhc2VUYXJnZXRcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cnkgPSBhd2FpdCB0aGlzLnJlYWRTaGFyZWRFbnRyeSh0YXJnZXQpXG4gICAgICBpZiAoY29udGV4dCA9PT0gdGhpcy5jb250ZXh0ICYmIGVudHJ5ICYmIHRoaXMuZW50cnlNYXRjaGVzKGVudHJ5KSkgdGhpcy5iYXNlbGluZSA9IGVudHJ5LmJhc2VsaW5lXG4gICAgfSBjYXRjaCB7IC8qIEEgc2VuZCB3aWxsIHJldHJ5IGFuZCBzaG93IGFuIGV4cGxpY2l0IHJlZnVzYWwuICovIH1cbiAgfVxuXG4gIGFzeW5jIG51ZGdlIChieTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmNhbk51ZGdlIHx8ICFbLTAuMDEsIDAuMDFdLmluY2x1ZGVzKGJ5KSkgcmV0dXJuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dFxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZGF0YWJhc2VUYXJnZXRcbiAgICBjb25zdCBleGVjdXRlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gV2ViIExvY2tzIGNhbiB3YWl0OiBjaGVjayB0aGUgYWN0dWFsIHByaW50ZXIvbGF5ZXIgYWdhaW4gaW5zaWRlIHRoZSBsb2NrLlxuICAgICAgaWYgKGNvbnRleHQgIT09IHRoaXMuY29udGV4dCB8fCAhdGhpcy5pc0FsbG93ZWROb3coKSkgcmV0dXJuXG4gICAgICBjb25zdCBiZWZvcmUgPSB0aGlzLnJlcG9ydGVkT2Zmc2V0XG4gICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShiZWZvcmUpKSB7IHRoaXMucmVmdXNhbCA9ICdObyBhZGp1c3RtZW50IHNlbnQuIFRoZSBwcmludGVyIFogb2Zmc2V0IGlzIHVua25vd24uJzsgcmV0dXJuIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCBlbnRyeSA9IGF3YWl0IHRoaXMucmVhZFNoYXJlZEVudHJ5KHRhcmdldClcbiAgICAgICAgaWYgKGVudHJ5ID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5yZWZ1c2FsID0gJ05vIGFkanVzdG1lbnQgc2VudC4gVGhlIHNoYXJlZCBiYXNlbGluZSBpcyB1bmtub3duLic7IHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChlbnRyeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3Qgam9iID0gdGhpcy5jdXJyZW50Sm9iXG4gICAgICAgICAgaWYgKCFqb2IgfHwgIU51bWJlci5pc0Zpbml0ZShqb2Iuc3RhcnRfdGltZSkpIHsgdGhpcy5yZWZ1c2FsID0gJ05vIGFkanVzdG1lbnQgc2VudC4gVGhlIHByaW50IGlkZW50aXR5IGlzIHVua25vd24uJzsgcmV0dXJuIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBydW5lQW5kV3JpdGUodGFyZ2V0LCB7IGJhc2VsaW5lOiBiZWZvcmUsIHN0YXJ0X3RpbWU6IGpvYi5zdGFydF90aW1lLCBmaWxlbmFtZTogam9iLmZpbGVuYW1lIH0pXG4gICAgICAgICAgZW50cnkgPSBhd2FpdCB0aGlzLnJlYWRTaGFyZWRFbnRyeSh0YXJnZXQpXG4gICAgICAgICAgaWYgKCFlbnRyeSB8fCAhdGhpcy5lbnRyeU1hdGNoZXMoZW50cnkpIHx8IE1hdGguYWJzKGVudHJ5LmJhc2VsaW5lIC0gYmVmb3JlKSA+IDFlLTgpIHtcbiAgICAgICAgICAgIHRoaXMucmVmdXNhbCA9ICdObyBhZGp1c3RtZW50IHNlbnQuIFRoZSBzaGFyZWQgYmFzZWxpbmUgZGlkIG5vdCBhZ3JlZSBhZnRlciBzYXZpbmcuJzsgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5lbnRyeU1hdGNoZXMoZW50cnkpKSB7IHRoaXMucmVmdXNhbCA9ICdObyBhZGp1c3RtZW50IHNlbnQuIFRoZSBzaGFyZWQgYmFzZWxpbmUgYmVsb25ncyB0byBhIGRpZmZlcmVudCBwcmludC4nOyByZXR1cm4gfVxuICAgICAgICB0aGlzLmJhc2VsaW5lID0gZW50cnkuYmFzZWxpbmVcbiAgICAgICAgLy8gRGF0YWJhc2UgSS9PIGFuZCBXZWIgTG9ja3MgY2FuIHdhaXQuIFJlY2hlY2sgYXV0aG9yaXR5LCBwcmludCBjb250ZXh0LFxuICAgICAgICAvLyBwZW5kaW5nIGFkanVzdG1lbnQsIGN1cnJlbnQgcHJpbnRlciBvZmZzZXQgYW5kIGNhcCBpbW1lZGlhdGVseSBiZWZvcmUgc2VuZC5cbiAgICAgICAgaWYgKGNvbnRleHQgIT09IHRoaXMuY29udGV4dCB8fCAhdGhpcy5pc0FsbG93ZWROb3coKSkgcmV0dXJuXG4gICAgICAgIGlmIChlbnRyeS5wZW5kaW5nICYmIGVudHJ5LmV4cGVjdGVkICE9PSB1bmRlZmluZWQgJiYgIWV4cGVjdGVkQ2F1Z2h0VXAodGhpcy5yZXBvcnRlZE9mZnNldCwgZW50cnkuZXhwZWN0ZWQsIGVudHJ5LnBlbmRpbmcuZnJvbSwgZW50cnkucGVuZGluZy5zdGVwKSAmJiBEYXRlLm5vdygpIC0gZW50cnkucGVuZGluZy5jcmVhdGVkIDw9IDUwMDApIHtcbiAgICAgICAgICB0aGlzLnJlZnVzYWwgPSAnTm8gYWRqdXN0bWVudCBzZW50LiBBIHNoYXJlZCBudWRnZSBpcyBzdGlsbCBhd2FpdGluZyBwcmludGVyIGNvbmZpcm1hdGlvbi4nOyByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAoZW50cnkucGVuZGluZykge1xuICAgICAgICAgIGNvbnN0IHByaW50ZXJNb3ZlZCA9IE1hdGguYWJzKHRoaXMucmVwb3J0ZWRPZmZzZXQgLSBlbnRyeS5wZW5kaW5nLmZyb20pID4gMWUtOFxuICAgICAgICAgIGVudHJ5ID0geyAuLi5lbnRyeSwgZXhwZWN0ZWQ6IHByaW50ZXJNb3ZlZCB8fCBlbnRyeS5leHBlY3RlZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5yZXBvcnRlZE9mZnNldCA6IGVudHJ5LmV4cGVjdGVkIH1cbiAgICAgICAgICBkZWxldGUgZW50cnkucGVuZGluZ1xuICAgICAgICAgIGF3YWl0IHRoaXMucHJ1bmVBbmRXcml0ZSh0YXJnZXQsIGVudHJ5KVxuICAgICAgICAgIGlmIChjb250ZXh0ICE9PSB0aGlzLmNvbnRleHQgfHwgIXRoaXMuaXNBbGxvd2VkTm93KCkpIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVmZmVjdGl2ZU9mZnNldCA9IGVudHJ5LmV4cGVjdGVkID09PSB1bmRlZmluZWQgPyB0aGlzLnJlcG9ydGVkT2Zmc2V0IDogTWF0aC5hYnMoZW50cnkuZXhwZWN0ZWQgLSBlbnRyeS5iYXNlbGluZSkgPiBNYXRoLmFicyh0aGlzLnJlcG9ydGVkT2Zmc2V0IC0gZW50cnkuYmFzZWxpbmUpID8gZW50cnkuZXhwZWN0ZWQgOiB0aGlzLnJlcG9ydGVkT2Zmc2V0XG4gICAgICAgIGlmICghbnVkZ2VGaXRzKGVmZmVjdGl2ZU9mZnNldCwgZW50cnkuYmFzZWxpbmUsIGJ5KSkge1xuICAgICAgICAgIHRoaXMucmVmdXNhbCA9ICdObyBhZGp1c3RtZW50IHNlbnQuIFRoZSBzaGFyZWQgMC4xMCBtbSBhbGxvd2FuY2Ugd291bGQgYmUgZXhjZWVkZWQuJzsgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9uY2UgPSBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCl9YFxuICAgICAgICBjb25zdCByZXNlcnZlZDogTnVkZ2VFbnRyeSA9IHsgLi4uZW50cnksIGV4cGVjdGVkOiBlZmZlY3RpdmVPZmZzZXQgKyBieSwgcGVuZGluZzogeyBjcmVhdGVkOiBEYXRlLm5vdygpLCBmcm9tOiB0aGlzLnJlcG9ydGVkT2Zmc2V0LCBzdGVwOiBieSwgZGV2aWNlOiB0aGlzLmRldmljZUlkLCBub25jZSB9IH1cbiAgICAgICAgYXdhaXQgdGhpcy5wcnVuZUFuZFdyaXRlKHRhcmdldCwgcmVzZXJ2ZWQpXG4gICAgICAgIGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMucmVhZFNoYXJlZEVudHJ5KHRhcmdldClcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldE1hdGNoZXModGFyZ2V0KSB8fCBjb250ZXh0ICE9PSB0aGlzLmNvbnRleHQgfHwgIXRoaXMuaXNBbGxvd2VkTm93KCkgfHwgIWNvbmZpcm1lZCB8fCAhdGhpcy5lbnRyeU1hdGNoZXMoY29uZmlybWVkKSB8fCBjb25maXJtZWQuZXhwZWN0ZWQgIT09IHJlc2VydmVkLmV4cGVjdGVkIHx8IGNvbmZpcm1lZC5wZW5kaW5nPy5kZXZpY2UgIT09IHRoaXMuZGV2aWNlSWQgfHwgY29uZmlybWVkLnBlbmRpbmc/Lm5vbmNlICE9PSBub25jZSB8fCBjb25maXJtZWQucGVuZGluZz8uZnJvbSAhPT0gdGhpcy5yZXBvcnRlZE9mZnNldCkge1xuICAgICAgICAgIHRoaXMucmVmdXNhbCA9ICdObyBhZGp1c3RtZW50IHNlbnQuIFRoZSBzaGFyZWQgbnVkZ2UgcmVzZXJ2YXRpb24gd2FzIG5vdCBjb25maXJtZWQuJzsgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICB0aGlzLnJlZnVzYWwgPSAnTm8gYWRqdXN0bWVudCBzZW50LiBUaGUgc2hhcmVkIG51ZGdlIGRhdGFiYXNlIGlzIHVuYXZhaWxhYmxlLic7IHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5yZWZ1c2FsID0gJydcbiAgICAgIGlmICghdGhpcy50YXJnZXRNYXRjaGVzKHRhcmdldCkgfHwgIXRoaXMuaXNBbGxvd2VkTm93KCkpIHJldHVyblxuICAgICAgaWYgKHRoaXMuZmlybXdhcmVOdWRnZUF2YWlsYWJsZSkgdGhpcy5zZW5kR2NvZGUoYEZJUlNUX0xBWUVSX05VREdFIERJUkVDVElPTj0ke2J5IDwgMCA/ICdDTE9TRVInIDogJ0ZVUlRIRVInfWAsIHRoaXMuJHdhaXRzLm9uWkFkanVzdClcbiAgICAgIGVsc2UgdGhpcy5hZGp1c3RaKGJ5KVxuICAgIH1cbiAgICB0aGlzLnBlbmRpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5sb2Nrcy5yZXF1ZXN0KGBtdW9uLWZpcnN0LWxheWVyOiR7dGhpcy5pZGVudGl0eX1gLCBleGVjdXRlKVxuICAgIH0gY2F0Y2ggeyB0aGlzLnJlZnVzYWwgPSAnTm8gYWRqdXN0bWVudCBzZW50LiBUaGUgbnVkZ2UgYWxsb3dhbmNlIGNvdWxkIG5vdCBiZSBsb2NrZWQuJyB9IGZpbmFsbHkgeyB0aGlzLnBlbmRpbmcgPSBmYWxzZSB9XG4gIH1cbn1cbjwvc2NyaXB0PlxuPHN0eWxlIHNjb3BlZD5cbi5maXJzdC1sYXllci1udWRnZXMgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LXdyYXA6IHdyYXA7IGdhcDogOHB4OyBhbGlnbi1pdGVtczogY2VudGVyOyBwYWRkaW5nLXRvcDogMTJweDsgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpOyB9XG4uZmlyc3QtbGF5ZXItbnVkZ2VzIHAsIC5maXJzdC1sYXllci1udWRnZXMgc21hbGwgeyBmbGV4LWJhc2lzOiAxMDAlOyBtYXJnaW46IDA7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvb3ZlcnZpZXcvRmlyc3RMYXllck51ZGdlcy52dWUifQ==