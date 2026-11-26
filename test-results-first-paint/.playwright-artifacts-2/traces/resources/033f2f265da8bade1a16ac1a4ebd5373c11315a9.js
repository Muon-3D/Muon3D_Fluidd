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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
import DevGuardMixin from "/src/mixins/dev-guard.ts";
import { Waits } from "/src/globals.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { running } from "/src/services/maintenance/running.ts";
import { plateCheckNeeded } from "/src/services/jobs/plate.ts";
import { meshFigures } from "/src/services/maintenance/heatmap.ts";
import {
  checkCommand,
  checkProduced,
  checkStatus,
  touchesPlate,
  meshSummary,
  probeCount
} from "/src/services/maintenance/model.ts";
import {
  choosePlan,
  homingTouches,
  liveGrid,
  meshLayout,
  meshPoints,
  meshProgress,
  parseProbeLine,
  planFrom,
  planFromSettings
} from "/src/services/maintenance/live-probe.ts";
const AUTO_GAP_S = 90;
const CHECKS = [
  {
    id: "bedMesh",
    title: "Bed mesh calibrate",
    description: "Measures the plate at a grid of points.",
    icon: "mesh",
    action: "Run",
    wait: Waits.onMeshCalibrate,
    confirm: () => "It homes, then touches the plate at every point of the mesh. Keep the plate on and the nozzle clean."
  },
  {
    id: "firstLayer",
    title: "First layer height",
    description: "How close the nozzle starts to the plate. Too high and prints don't stick; too low and they scrape.",
    icon: "firstLayer",
    action: "Check",
    wait: Waits.onProbeCalibrate,
    confirm: () => "It homes and brings the nozzle down to the plate, then you lower it until a sheet of paper just drags under it."
  },
  {
    id: "shaper",
    title: "Resonance test",
    description: "Lets it print fast without ripples. Run it again after moving the printer to a new table.",
    icon: "pulse",
    action: "Run",
    wait: Waits.onShaperCalibrate,
    confirm: () => "It homes, then shakes the toolhead to measure how the printer rings. It's loud for a few minutes."
  },
  {
    id: "pid",
    title: "Heater tuning",
    description: "Keeps the nozzle steady at its temperature.",
    icon: "thermometer",
    action: "Run",
    wait: Waits.onPidCalibrate,
    confirm: (nozzle, gcode) => gcode.startsWith("PID_CALIBRATE") ? `It heats the nozzle to ${nozzle}°C and lets it cool a few times. Don't touch the nozzle while it runs.` : "It heats the nozzle and lets it cool a few times, the printer's own way. Don't touch the nozzle while it runs."
  }
];
let MaintenanceMixin = class extends Mixins(ControlMixin, DevGuardMixin) {
  get maintenanceTarget() {
    return this.panelTarget;
  }
  get gcodeCommands() {
    return this.$store.state.printer.printer.gcode?.commands ?? this.$store.getters["printer/getAvailableCommands"] ?? {};
  }
  get lastRun() {
    return this.$store.state.config.uiSettings.maintenance?.lastRun ?? {};
  }
  /** The nozzle temperature heater tuning uses: the material set now, else PLA's, else 215°C. */
  get tuneTemperature() {
    const pla = this.materials.find((m) => /^pla\b/i.test(m.name));
    return Math.round(this.material?.nozzle ?? pla?.nozzle ?? 215);
  }
  get checks() {
    const now = Date.now();
    const context = { commands: this.gcodeCommands, homed: this.allHomed, nozzleTarget: this.tuneTemperature, pidFallback: !this.devOnlyLocked };
    return CHECKS.map((info) => ({
      id: info.id,
      title: info.title,
      description: info.description,
      icon: info.icon,
      action: info.action,
      wait: info.wait,
      status: checkStatus(info.id, this.lastRun[info.id], now),
      gcode: checkCommand(info.id, context),
      confirm: info.confirm(this.tuneTemperature, checkCommand(info.id, context) ?? "")
    })).filter((row) => row.gcode !== null || row.id === "shaper" && !!this.$store.state.printer.printer.configfile?.settings?.input_shaper);
  }
  get dueCount() {
    return this.checks.filter((c) => c.status.due).length;
  }
  /** The check running now: its wait is up, or the paper test is open. */
  get runningId() {
    const row = this.checks.find((c) => this.hasWait(c.wait));
    if (row) return row.id;
    return this.isManualProbeActive ? "firstLayer" : null;
  }
  /** Why no check can start now, or '' when one can. */
  get checksBlocked() {
    if (!this.controlReady) return this.controlLock;
    if (!this.klippyReady) return "The printer isn't ready.";
    if (this.printerBusy || this.printerState === "loading") return "Wait until the printer is idle.";
    if (this.runningId) return "Another check is running.";
    return "";
  }
  get evidence() {
    return {
      mesh: JSON.stringify(this.$store.state.printer.printer.bed_mesh?.probed_matrix ?? []),
      pending: this.$store.getters["printer/getSaveConfigPendingItems"] ?? {}
    };
  }
  async runCheck(row) {
    if (!row.gcode || this.checksBlocked) return;
    const target = this.maintenanceTarget;
    const plateCheck = touchesPlate(row.id) && plateCheckNeeded(this.$store.state.history?.jobs);
    const ok = await this.$confirm(row.confirm, { title: row.title, buttonTrueText: "Start", plateCheck });
    if (!ok || target !== this.maintenanceTarget || this.checksBlocked || this.checks.find((c) => c.id === row.id)?.gcode !== row.gcode) return;
    running.check = { id: row.id, printer: activeSlug(), target, startedAt: Date.now(), before: this.evidence, homeFirst: /(^|\n)G28\b/.test(row.gcode) };
    this.sendGcode(row.gcode, row.wait);
  }
  /** Records the running check once Klipper has its result. */
  recordIfDone() {
    const check = running.check;
    if (!check || check.printer !== activeSlug() || check.target !== this.maintenanceTarget) return;
    if (!checkProduced(check.id, check.before, this.evidence)) return;
    running.check = null;
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.maintenance.lastRun",
      value: { ...this.lastRun, [check.id]: Date.now() },
      server: true
    });
  }
  get mesh() {
    return this.$store.state.printer.printer.bed_mesh?.probed_matrix ?? [];
  }
  get meshSummary() {
    return meshSummary(this.mesh);
  }
  /**
   * Whether the printer holds a measured mesh. Klipper reports a cleared or
   * never-loaded mesh as `[[]]` (one empty row), so this asks for a value, not a length.
   */
  get meshMeasured() {
    return meshFigures(this.mesh) !== null;
  }
  /** Whether a mesh is loaded, so moves follow it. */
  get meshInUse() {
    return !!this.$store.state.printer.printer.bed_mesh?.profile_name;
  }
  /** The mesh's points across and deep, from the printer's settings. */
  get meshSize() {
    const settings = this.$store.state.printer.printer.configfile?.settings?.bed_mesh;
    return probeCount(settings?.probe_count) ?? (this.meshMeasured ? [this.mesh[0].length, this.mesh.length] : null);
  }
  get measuring() {
    return this.hasWait(Waits.onMeshCalibrate);
  }
  /**
   * The plate touches of the measurement under way: since Level the bed was
   * pressed here, or, for one the printer began by itself (a print's start,
   * a macro, the console), since the run of touches it is in began, while
   * the printer is still busy.
   */
  get probeTouches() {
    const entries = this.$store.state.console.console;
    const check = running.check;
    if (this.measuring && check && check.id === "bedMesh") {
      const since = Math.floor(check.startedAt / 1e3) - 1;
      return entries.filter((e) => (e.time ?? 0) >= since).map((e) => parseProbeLine(e.message, e.time ?? 0)).filter((t) => t !== null);
    }
    if (this.$store.state.printer.printer.idle_timeout?.state !== "Printing") return [];
    const touches = [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const touch = parseProbeLine(entries[i].message, entries[i].time ?? 0);
      if (!touch) continue;
      if (touches.length && touches[0].time - touch.time > AUTO_GAP_S) break;
      touches.unshift(touch);
    }
    const now = Date.now() / 1e3;
    return touches.length && now - touches[touches.length - 1].time <= AUTO_GAP_S ? touches : [];
  }
  /** The bed measurement under way, or null: what it is doing, and the grid so far. */
  get meshRun() {
    const touches = this.probeTouches;
    if (!this.measuring && !touches.some((t) => t.kind === "touch")) return null;
    const points = meshPoints(touches);
    const settings = this.$store.state.printer.printer.configfile?.settings?.bed_mesh;
    const plan = choosePlan(points, [
      planFrom(this.$store.state.printer.printer["gcode_macro _BED_MESH_PLAN"]?.points),
      planFromSettings(settings?.mesh_min, settings?.mesh_max, probeCount(settings?.probe_count))
    ]);
    const layout = meshLayout(plan ? plan.map(([x, y]) => ({ x, y })) : points);
    const bed = this.$store.state.printer.printer.heater_bed;
    return {
      points,
      grid: liveGrid(points, layout),
      touches,
      progress: meshProgress({
        points,
        total: plan ? plan.length : null,
        homingTouches: homingTouches(touches),
        homedAtStart: !(running.check?.homeFirst ?? !this.allHomed),
        bed: bed ? { temperature: bed.temperature, target: bed.target } : null
      })
    };
  }
  /** Lifetime printing hours, from the print history. */
  get printHours() {
    if (!this.$store.getters["server/componentSupport"]("history")) return null;
    const seconds = this.$store.getters["history/getRollUp"]?.total_print_time;
    return seconds === void 0 ? null : Math.round(seconds / 3600);
  }
  /** Prints on this printer's record, from the print history. */
  get printCount() {
    if (!this.$store.getters["server/componentSupport"]("history")) return null;
    const jobs = this.$store.getters["history/getRollUp"]?.total_jobs;
    return typeof jobs === "number" ? jobs : null;
  }
  get saveConfigPending() {
    return this.$store.getters["printer/getSaveConfigPending"];
  }
  /** Why Save can't run now, or '' when it can: SAVE_CONFIG restarts Klipper, which ends a print, paused or not. */
  get saveBlocked() {
    if (!this.controlReady) return this.controlLock;
    if (this.restartRefusal) return this.restartRefusal;
    if (this.printerPrinting || this.printerPaused) return "Not while printing.";
    if (this.hasWait(this.$waits.onSaveConfig)) return "Saving…";
    return "";
  }
  async saveResults() {
    if (!this.saveConfigPending || this.saveBlocked) return;
    if (await this.confirmCommandRestart("save") && this.saveConfigPending && !this.saveBlocked) this.sendGcode("SAVE_CONFIG", this.$waits.onSaveConfig);
  }
};
MaintenanceMixin = __decorateClass([
  Component({})
], MaintenanceMixin);
export {
  MaintenanceMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW50ZW5hbmNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBDb250cm9sTWl4aW4gZnJvbSAnLi9jb250cm9sJ1xuaW1wb3J0IERldkd1YXJkTWl4aW4gZnJvbSAnLi9kZXYtZ3VhcmQnXG5pbXBvcnQgeyBXYWl0cyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBydW5uaW5nIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9ydW5uaW5nJ1xuaW1wb3J0IHsgcGxhdGVDaGVja05lZWRlZCB9IGZyb20gJ0Avc2VydmljZXMvam9icy9wbGF0ZSdcbmltcG9ydCB7IG1lc2hGaWd1cmVzIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9oZWF0bWFwJ1xuaW1wb3J0IHtcbiAgY2hlY2tDb21tYW5kLFxuICBjaGVja1Byb2R1Y2VkLFxuICBjaGVja1N0YXR1cyxcbiAgdG91Y2hlc1BsYXRlLFxuICBtZXNoU3VtbWFyeSxcbiAgcHJvYmVDb3VudCxcbiAgdHlwZSBDaGVja0V2aWRlbmNlLFxuICB0eXBlIENoZWNrSWQsXG4gIHR5cGUgQ2hlY2tTdGF0dXMsXG4gIHR5cGUgTWVzaFN1bW1hcnlcbn0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9tb2RlbCdcbmltcG9ydCB0eXBlIHsgQ29uc29sZUVudHJ5IH0gZnJvbSAnQC9zdG9yZS9jb25zb2xlL3R5cGVzJ1xuaW1wb3J0IHtcbiAgY2hvb3NlUGxhbixcbiAgaG9taW5nVG91Y2hlcyxcbiAgbGl2ZUdyaWQsXG4gIG1lc2hMYXlvdXQsXG4gIG1lc2hQb2ludHMsXG4gIG1lc2hQcm9ncmVzcyxcbiAgcGFyc2VQcm9iZUxpbmUsXG4gIHBsYW5Gcm9tLFxuICBwbGFuRnJvbVNldHRpbmdzLFxuICB0eXBlIE1lc2hQb2ludCxcbiAgdHlwZSBNZXNoUHJvZ3Jlc3MsXG4gIHR5cGUgUHJvYmVUb3VjaFxufSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL2xpdmUtcHJvYmUnXG5cbi8qKiBBIGJlZCBtZWFzdXJlbWVudCB1bmRlciB3YXksIGFzIGZhciBhcyBpdCBoYXMgZ290LiAqL1xuZXhwb3J0IGludGVyZmFjZSBNZXNoUnVuIHtcbiAgcG9pbnRzOiBNZXNoUG9pbnRbXTtcbiAgLyoqIFJvd3MgYnkgWSBhc2NlbmRpbmcsIGNlbGxzIGJ5IFggYXNjZW5kaW5nOyBudWxsIHdoZXJlIG5vdCB0b3VjaGVkIHlldC4gKi9cbiAgZ3JpZDogQXJyYXk8QXJyYXk8bnVtYmVyIHwgbnVsbD4+O1xuICBwcm9ncmVzczogTWVzaFByb2dyZXNzO1xuICAvKiogRXZlcnkgdG91Y2ggb2YgdGhlIHBsYXRlIHNvIGZhciwgaG9taW5nIGluY2x1ZGVkLCBmb3IgdGhlIGxpdmUgTTEuICovXG4gIHRvdWNoZXM6IFByb2JlVG91Y2hbXTtcbn1cblxuLyoqIEEgcGF1c2UgYmV0d2VlbiB0b3VjaGVzIGxvbmdlciB0aGFuIHRoaXMgZW5kcyBhIG1lYXN1cmVtZW50IHRoZSBwcmludGVyIGJlZ2FuIGJ5IGl0c2VsZi4gKi9cbmNvbnN0IEFVVE9fR0FQX1MgPSA5MFxuXG5leHBvcnQgaW50ZXJmYWNlIENoZWNrUm93IHtcbiAgaWQ6IENoZWNrSWQ7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGljb246IHN0cmluZztcbiAgc3RhdHVzOiBDaGVja1N0YXR1cztcbiAgLyoqIFdoYXQgdGhlIGJ1dHRvbiBzYXlzOiBSdW4sIG9yIENoZWNrIGZvciB0aGUgb25lIHlvdSBhZGp1c3QgYnkgaGFuZC4gKi9cbiAgYWN0aW9uOiBzdHJpbmc7XG4gIC8qKiBUaGUgRy1jb2RlLCBvciBudWxsIHdoZW4gdGhlIHByaW50ZXIgY2FuJ3QgcnVuIHRoZSBjaGVjay4gKi9cbiAgZ2NvZGU6IHN0cmluZyB8IG51bGw7XG4gIHdhaXQ6IHN0cmluZztcbiAgLyoqIFdoYXQgdGhlIGNvbmZpcm1hdGlvbiBzYXlzIGJlZm9yZSBpdCBzdGFydHMuICovXG4gIGNvbmZpcm06IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENoZWNrSW5mbyB7XG4gIGlkOiBDaGVja0lkO1xuICB0aXRsZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBpY29uOiBzdHJpbmc7XG4gIGFjdGlvbjogc3RyaW5nO1xuICB3YWl0OiBzdHJpbmc7XG4gIC8qKiBXaGF0IHRvIHNheSBiZWZvcmUgaXQgc3RhcnRzOyBgZ2NvZGVgIGlzIHdoYXQgd2lsbCBydW4uICovXG4gIGNvbmZpcm06IChub3p6bGU6IG51bWJlciwgZ2NvZGU6IHN0cmluZykgPT4gc3RyaW5nO1xufVxuXG5jb25zdCBDSEVDS1M6IENoZWNrSW5mb1tdID0gW1xuICB7XG4gICAgaWQ6ICdiZWRNZXNoJyxcbiAgICB0aXRsZTogJ0JlZCBtZXNoIGNhbGlicmF0ZScsXG4gICAgZGVzY3JpcHRpb246ICdNZWFzdXJlcyB0aGUgcGxhdGUgYXQgYSBncmlkIG9mIHBvaW50cy4nLFxuICAgIGljb246ICdtZXNoJyxcbiAgICBhY3Rpb246ICdSdW4nLFxuICAgIHdhaXQ6IFdhaXRzLm9uTWVzaENhbGlicmF0ZSxcbiAgICBjb25maXJtOiAoKSA9PiAnSXQgaG9tZXMsIHRoZW4gdG91Y2hlcyB0aGUgcGxhdGUgYXQgZXZlcnkgcG9pbnQgb2YgdGhlIG1lc2guIEtlZXAgdGhlIHBsYXRlIG9uIGFuZCB0aGUgbm96emxlIGNsZWFuLidcbiAgfSxcbiAge1xuICAgIGlkOiAnZmlyc3RMYXllcicsXG4gICAgdGl0bGU6ICdGaXJzdCBsYXllciBoZWlnaHQnLFxuICAgIGRlc2NyaXB0aW9uOiBcIkhvdyBjbG9zZSB0aGUgbm96emxlIHN0YXJ0cyB0byB0aGUgcGxhdGUuIFRvbyBoaWdoIGFuZCBwcmludHMgZG9uJ3Qgc3RpY2s7IHRvbyBsb3cgYW5kIHRoZXkgc2NyYXBlLlwiLFxuICAgIGljb246ICdmaXJzdExheWVyJyxcbiAgICBhY3Rpb246ICdDaGVjaycsXG4gICAgd2FpdDogV2FpdHMub25Qcm9iZUNhbGlicmF0ZSxcbiAgICBjb25maXJtOiAoKSA9PiAnSXQgaG9tZXMgYW5kIGJyaW5ncyB0aGUgbm96emxlIGRvd24gdG8gdGhlIHBsYXRlLCB0aGVuIHlvdSBsb3dlciBpdCB1bnRpbCBhIHNoZWV0IG9mIHBhcGVyIGp1c3QgZHJhZ3MgdW5kZXIgaXQuJ1xuICB9LFxuICB7XG4gICAgaWQ6ICdzaGFwZXInLFxuICAgIHRpdGxlOiAnUmVzb25hbmNlIHRlc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnTGV0cyBpdCBwcmludCBmYXN0IHdpdGhvdXQgcmlwcGxlcy4gUnVuIGl0IGFnYWluIGFmdGVyIG1vdmluZyB0aGUgcHJpbnRlciB0byBhIG5ldyB0YWJsZS4nLFxuICAgIGljb246ICdwdWxzZScsXG4gICAgYWN0aW9uOiAnUnVuJyxcbiAgICB3YWl0OiBXYWl0cy5vblNoYXBlckNhbGlicmF0ZSxcbiAgICBjb25maXJtOiAoKSA9PiBcIkl0IGhvbWVzLCB0aGVuIHNoYWtlcyB0aGUgdG9vbGhlYWQgdG8gbWVhc3VyZSBob3cgdGhlIHByaW50ZXIgcmluZ3MuIEl0J3MgbG91ZCBmb3IgYSBmZXcgbWludXRlcy5cIlxuICB9LFxuICB7XG4gICAgaWQ6ICdwaWQnLFxuICAgIHRpdGxlOiAnSGVhdGVyIHR1bmluZycsXG4gICAgZGVzY3JpcHRpb246ICdLZWVwcyB0aGUgbm96emxlIHN0ZWFkeSBhdCBpdHMgdGVtcGVyYXR1cmUuJyxcbiAgICBpY29uOiAndGhlcm1vbWV0ZXInLFxuICAgIGFjdGlvbjogJ1J1bicsXG4gICAgd2FpdDogV2FpdHMub25QaWRDYWxpYnJhdGUsXG4gICAgY29uZmlybTogKG5venpsZSwgZ2NvZGUpID0+IGdjb2RlLnN0YXJ0c1dpdGgoJ1BJRF9DQUxJQlJBVEUnKVxuICAgICAgPyBgSXQgaGVhdHMgdGhlIG5venpsZSB0byAke25venpsZX3CsEMgYW5kIGxldHMgaXQgY29vbCBhIGZldyB0aW1lcy4gRG9uJ3QgdG91Y2ggdGhlIG5venpsZSB3aGlsZSBpdCBydW5zLmBcbiAgICAgIDogXCJJdCBoZWF0cyB0aGUgbm96emxlIGFuZCBsZXRzIGl0IGNvb2wgYSBmZXcgdGltZXMsIHRoZSBwcmludGVyJ3Mgb3duIHdheS4gRG9uJ3QgdG91Y2ggdGhlIG5venpsZSB3aGlsZSBpdCBydW5zLlwiXG4gIH1cbl1cblxuLyoqXG4gKiBNYWludGVuYW5jZSdzIHN0YXRlOiBlYWNoIGNoZWNrLCB3aGVuIGl0IGxhc3QgcmFuIGhlcmUgYW5kIHdoZXRoZXIgaXQnc1xuICogZHVlLCBydW5uaW5nIG9uZSwgYW5kIHRoZSBiZWQgbWVzaC4gQSBydW4gY291bnRzIG9uY2UgS2xpcHBlciBoYXMgaXRzXG4gKiByZXN1bHQgKGEgbmV3IG1lc2gsIG9yIGEgc2V0dGluZyB3YWl0aW5nIHRvIGJlIHNhdmVkKSwgc28gYSBjaGVjayBzdG9wcGVkXG4gKiBoYWxmd2F5IGlzbid0IHJlY29yZGVkIGFzIGRvbmUuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZU1peGluIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbiwgRGV2R3VhcmRNaXhpbikge1xuICBnZXQgbWFpbnRlbmFuY2VUYXJnZXQgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnBhbmVsVGFyZ2V0IH1cblxuICBnZXQgZ2NvZGVDb21tYW5kcyAoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmdjb2RlPy5jb21tYW5kcyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCkgPz9cbiAgICAgICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEF2YWlsYWJsZUNvbW1hbmRzJ10gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID8/IHt9XG4gIH1cblxuICBnZXQgbGFzdFJ1biAoKTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLm1haW50ZW5hbmNlPy5sYXN0UnVuID8/IHt9XG4gIH1cblxuICAvKiogVGhlIG5venpsZSB0ZW1wZXJhdHVyZSBoZWF0ZXIgdHVuaW5nIHVzZXM6IHRoZSBtYXRlcmlhbCBzZXQgbm93LCBlbHNlIFBMQSdzLCBlbHNlIDIxNcKwQy4gKi9cbiAgZ2V0IHR1bmVUZW1wZXJhdHVyZSAoKTogbnVtYmVyIHtcbiAgICBjb25zdCBwbGEgPSB0aGlzLm1hdGVyaWFscy5maW5kKG0gPT4gL15wbGFcXGIvaS50ZXN0KG0ubmFtZSkpXG4gICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5tYXRlcmlhbD8ubm96emxlID8/IHBsYT8ubm96emxlID8/IDIxNSlcbiAgfVxuXG4gIGdldCBjaGVja3MgKCk6IENoZWNrUm93W10ge1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcbiAgICBjb25zdCBjb250ZXh0ID0geyBjb21tYW5kczogdGhpcy5nY29kZUNvbW1hbmRzLCBob21lZDogdGhpcy5hbGxIb21lZCwgbm96emxlVGFyZ2V0OiB0aGlzLnR1bmVUZW1wZXJhdHVyZSwgcGlkRmFsbGJhY2s6ICF0aGlzLmRldk9ubHlMb2NrZWQgfVxuICAgIHJldHVybiBDSEVDS1NcbiAgICAgIC5tYXAoaW5mbyA9PiAoe1xuICAgICAgICBpZDogaW5mby5pZCxcbiAgICAgICAgdGl0bGU6IGluZm8udGl0bGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBpbmZvLmRlc2NyaXB0aW9uLFxuICAgICAgICBpY29uOiBpbmZvLmljb24sXG4gICAgICAgIGFjdGlvbjogaW5mby5hY3Rpb24sXG4gICAgICAgIHdhaXQ6IGluZm8ud2FpdCxcbiAgICAgICAgc3RhdHVzOiBjaGVja1N0YXR1cyhpbmZvLmlkLCB0aGlzLmxhc3RSdW5baW5mby5pZF0sIG5vdyksXG4gICAgICAgIGdjb2RlOiBjaGVja0NvbW1hbmQoaW5mby5pZCwgY29udGV4dCksXG4gICAgICAgIGNvbmZpcm06IGluZm8uY29uZmlybSh0aGlzLnR1bmVUZW1wZXJhdHVyZSwgY2hlY2tDb21tYW5kKGluZm8uaWQsIGNvbnRleHQpID8/ICcnKVxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKHJvdyA9PiByb3cuZ2NvZGUgIT09IG51bGwgfHwgKHJvdy5pZCA9PT0gJ3NoYXBlcicgJiYgISF0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZT8uc2V0dGluZ3M/LmlucHV0X3NoYXBlcikpXG4gIH1cblxuICBnZXQgZHVlQ291bnQgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2tzLmZpbHRlcihjID0+IGMuc3RhdHVzLmR1ZSkubGVuZ3RoXG4gIH1cblxuICAvKiogVGhlIGNoZWNrIHJ1bm5pbmcgbm93OiBpdHMgd2FpdCBpcyB1cCwgb3IgdGhlIHBhcGVyIHRlc3QgaXMgb3Blbi4gKi9cbiAgZ2V0IHJ1bm5pbmdJZCAoKTogQ2hlY2tJZCB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuY2hlY2tzLmZpbmQoYyA9PiB0aGlzLmhhc1dhaXQoYy53YWl0KSlcbiAgICBpZiAocm93KSByZXR1cm4gcm93LmlkXG4gICAgcmV0dXJuIHRoaXMuaXNNYW51YWxQcm9iZUFjdGl2ZSA/ICdmaXJzdExheWVyJyA6IG51bGxcbiAgfVxuXG4gIC8qKiBXaHkgbm8gY2hlY2sgY2FuIHN0YXJ0IG5vdywgb3IgJycgd2hlbiBvbmUgY2FuLiAqL1xuICBnZXQgY2hlY2tzQmxvY2tlZCAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICAgIGlmICghdGhpcy5rbGlwcHlSZWFkeSkgcmV0dXJuICdUaGUgcHJpbnRlciBpc25cXCd0IHJlYWR5LidcbiAgICBpZiAodGhpcy5wcmludGVyQnVzeSB8fCB0aGlzLnByaW50ZXJTdGF0ZSA9PT0gJ2xvYWRpbmcnKSByZXR1cm4gJ1dhaXQgdW50aWwgdGhlIHByaW50ZXIgaXMgaWRsZS4nXG4gICAgaWYgKHRoaXMucnVubmluZ0lkKSByZXR1cm4gJ0Fub3RoZXIgY2hlY2sgaXMgcnVubmluZy4nXG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBnZXQgZXZpZGVuY2UgKCk6IENoZWNrRXZpZGVuY2Uge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNoOiBKU09OLnN0cmluZ2lmeSh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuYmVkX21lc2g/LnByb2JlZF9tYXRyaXggPz8gW10pLFxuICAgICAgcGVuZGluZzogKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0U2F2ZUNvbmZpZ1BlbmRpbmdJdGVtcyddIGFzIENoZWNrRXZpZGVuY2VbJ3BlbmRpbmcnXSkgPz8ge31cbiAgICB9XG4gIH1cblxuICBhc3luYyBydW5DaGVjayAocm93OiBDaGVja1Jvdykge1xuICAgIGlmICghcm93Lmdjb2RlIHx8IHRoaXMuY2hlY2tzQmxvY2tlZCkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5tYWludGVuYW5jZVRhcmdldFxuICAgIC8vIExldmVsbGluZyBhbmQgZmlyc3QgbGF5ZXIgaGVpZ2h0IGRyaXZlIHRoZSBub3p6bGUgb250byB0aGUgcGxhdGU6IHRoZSBwbGF0ZSBjaGVjayBmaXJzdCwgYXMgZm9yIGEgcHJpbnQuXG4gICAgY29uc3QgcGxhdGVDaGVjayA9IHRvdWNoZXNQbGF0ZShyb3cuaWQpICYmIHBsYXRlQ2hlY2tOZWVkZWQodGhpcy4kc3RvcmUuc3RhdGUuaGlzdG9yeT8uam9icylcbiAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0ocm93LmNvbmZpcm0sIHsgdGl0bGU6IHJvdy50aXRsZSwgYnV0dG9uVHJ1ZVRleHQ6ICdTdGFydCcsIHBsYXRlQ2hlY2sgfSlcbiAgICAvLyBBc2tlZCBhZ2FpbjogYSBwcmludCBtYXkgaGF2ZSBzdGFydGVkIGZyb20gZWxzZXdoZXJlIHdoaWxlIHRoZSBxdWVzdGlvbiB3YXMgb3Blbi5cbiAgICBpZiAoIW9rIHx8IHRhcmdldCAhPT0gdGhpcy5tYWludGVuYW5jZVRhcmdldCB8fCB0aGlzLmNoZWNrc0Jsb2NrZWQgfHwgdGhpcy5jaGVja3MuZmluZChjID0+IGMuaWQgPT09IHJvdy5pZCk/Lmdjb2RlICE9PSByb3cuZ2NvZGUpIHJldHVyblxuICAgIHJ1bm5pbmcuY2hlY2sgPSB7IGlkOiByb3cuaWQsIHByaW50ZXI6IGFjdGl2ZVNsdWcoKSwgdGFyZ2V0LCBzdGFydGVkQXQ6IERhdGUubm93KCksIGJlZm9yZTogdGhpcy5ldmlkZW5jZSwgaG9tZUZpcnN0OiAvKF58XFxuKUcyOFxcYi8udGVzdChyb3cuZ2NvZGUpIH1cbiAgICB0aGlzLnNlbmRHY29kZShyb3cuZ2NvZGUsIHJvdy53YWl0KVxuICB9XG5cbiAgLyoqIFJlY29yZHMgdGhlIHJ1bm5pbmcgY2hlY2sgb25jZSBLbGlwcGVyIGhhcyBpdHMgcmVzdWx0LiAqL1xuICByZWNvcmRJZkRvbmUgKCkge1xuICAgIGNvbnN0IGNoZWNrID0gcnVubmluZy5jaGVja1xuICAgIGlmICghY2hlY2sgfHwgY2hlY2sucHJpbnRlciAhPT0gYWN0aXZlU2x1ZygpIHx8IGNoZWNrLnRhcmdldCAhPT0gdGhpcy5tYWludGVuYW5jZVRhcmdldCkgcmV0dXJuXG4gICAgaWYgKCFjaGVja1Byb2R1Y2VkKGNoZWNrLmlkLCBjaGVjay5iZWZvcmUsIHRoaXMuZXZpZGVuY2UpKSByZXR1cm5cbiAgICBydW5uaW5nLmNoZWNrID0gbnVsbFxuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLm1haW50ZW5hbmNlLmxhc3RSdW4nLFxuICAgICAgdmFsdWU6IHsgLi4udGhpcy5sYXN0UnVuLCBbY2hlY2suaWRdOiBEYXRlLm5vdygpIH0sXG4gICAgICBzZXJ2ZXI6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgZ2V0IG1lc2ggKCk6IG51bWJlcltdW10ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmJlZF9tZXNoPy5wcm9iZWRfbWF0cml4IGFzIG51bWJlcltdW10gfCB1bmRlZmluZWQpID8/IFtdXG4gIH1cblxuICBnZXQgbWVzaFN1bW1hcnkgKCk6IE1lc2hTdW1tYXJ5IHwgbnVsbCB7XG4gICAgcmV0dXJuIG1lc2hTdW1tYXJ5KHRoaXMubWVzaClcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBwcmludGVyIGhvbGRzIGEgbWVhc3VyZWQgbWVzaC4gS2xpcHBlciByZXBvcnRzIGEgY2xlYXJlZCBvclxuICAgKiBuZXZlci1sb2FkZWQgbWVzaCBhcyBgW1tdXWAgKG9uZSBlbXB0eSByb3cpLCBzbyB0aGlzIGFza3MgZm9yIGEgdmFsdWUsIG5vdCBhIGxlbmd0aC5cbiAgICovXG4gIGdldCBtZXNoTWVhc3VyZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBtZXNoRmlndXJlcyh0aGlzLm1lc2gpICE9PSBudWxsXG4gIH1cblxuICAvKiogV2hldGhlciBhIG1lc2ggaXMgbG9hZGVkLCBzbyBtb3ZlcyBmb2xsb3cgaXQuICovXG4gIGdldCBtZXNoSW5Vc2UgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5iZWRfbWVzaD8ucHJvZmlsZV9uYW1lXG4gIH1cblxuICAvKiogVGhlIG1lc2gncyBwb2ludHMgYWNyb3NzIGFuZCBkZWVwLCBmcm9tIHRoZSBwcmludGVyJ3Mgc2V0dGluZ3MuICovXG4gIGdldCBtZXNoU2l6ZSAoKTogW251bWJlciwgbnVtYmVyXSB8IG51bGwge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGU/LnNldHRpbmdzPy5iZWRfbWVzaFxuICAgIHJldHVybiBwcm9iZUNvdW50KHNldHRpbmdzPy5wcm9iZV9jb3VudCkgPz9cbiAgICAgICh0aGlzLm1lc2hNZWFzdXJlZCA/IFt0aGlzLm1lc2hbMF0ubGVuZ3RoLCB0aGlzLm1lc2gubGVuZ3RoXSA6IG51bGwpXG4gIH1cblxuICBnZXQgbWVhc3VyaW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXNXYWl0KFdhaXRzLm9uTWVzaENhbGlicmF0ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcGxhdGUgdG91Y2hlcyBvZiB0aGUgbWVhc3VyZW1lbnQgdW5kZXIgd2F5OiBzaW5jZSBMZXZlbCB0aGUgYmVkIHdhc1xuICAgKiBwcmVzc2VkIGhlcmUsIG9yLCBmb3Igb25lIHRoZSBwcmludGVyIGJlZ2FuIGJ5IGl0c2VsZiAoYSBwcmludCdzIHN0YXJ0LFxuICAgKiBhIG1hY3JvLCB0aGUgY29uc29sZSksIHNpbmNlIHRoZSBydW4gb2YgdG91Y2hlcyBpdCBpcyBpbiBiZWdhbiwgd2hpbGVcbiAgICogdGhlIHByaW50ZXIgaXMgc3RpbGwgYnVzeS5cbiAgICovXG4gIGdldCBwcm9iZVRvdWNoZXMgKCk6IFByb2JlVG91Y2hbXSB7XG4gICAgY29uc3QgZW50cmllcyA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29uc29sZSBhcyBDb25zb2xlRW50cnlbXVxuICAgIGNvbnN0IGNoZWNrID0gcnVubmluZy5jaGVja1xuICAgIGlmICh0aGlzLm1lYXN1cmluZyAmJiBjaGVjayAmJiBjaGVjay5pZCA9PT0gJ2JlZE1lc2gnKSB7XG4gICAgICBjb25zdCBzaW5jZSA9IE1hdGguZmxvb3IoY2hlY2suc3RhcnRlZEF0IC8gMTAwMCkgLSAxXG4gICAgICByZXR1cm4gZW50cmllc1xuICAgICAgICAuZmlsdGVyKGUgPT4gKGUudGltZSA/PyAwKSA+PSBzaW5jZSlcbiAgICAgICAgLm1hcChlID0+IHBhcnNlUHJvYmVMaW5lKGUubWVzc2FnZSwgZS50aW1lID8/IDApKVxuICAgICAgICAuZmlsdGVyKCh0KTogdCBpcyBQcm9iZVRvdWNoID0+IHQgIT09IG51bGwpXG4gICAgfVxuICAgIGlmICh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuaWRsZV90aW1lb3V0Py5zdGF0ZSAhPT0gJ1ByaW50aW5nJykgcmV0dXJuIFtdXG4gICAgY29uc3QgdG91Y2hlczogUHJvYmVUb3VjaFtdID0gW11cbiAgICBmb3IgKGxldCBpID0gZW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgdG91Y2ggPSBwYXJzZVByb2JlTGluZShlbnRyaWVzW2ldLm1lc3NhZ2UsIGVudHJpZXNbaV0udGltZSA/PyAwKVxuICAgICAgaWYgKCF0b3VjaCkgY29udGludWVcbiAgICAgIGlmICh0b3VjaGVzLmxlbmd0aCAmJiB0b3VjaGVzWzBdLnRpbWUgLSB0b3VjaC50aW1lID4gQVVUT19HQVBfUykgYnJlYWtcbiAgICAgIHRvdWNoZXMudW5zaGlmdCh0b3VjaClcbiAgICB9XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKSAvIDEwMDBcbiAgICByZXR1cm4gdG91Y2hlcy5sZW5ndGggJiYgbm93IC0gdG91Y2hlc1t0b3VjaGVzLmxlbmd0aCAtIDFdLnRpbWUgPD0gQVVUT19HQVBfUyA/IHRvdWNoZXMgOiBbXVxuICB9XG5cbiAgLyoqIFRoZSBiZWQgbWVhc3VyZW1lbnQgdW5kZXIgd2F5LCBvciBudWxsOiB3aGF0IGl0IGlzIGRvaW5nLCBhbmQgdGhlIGdyaWQgc28gZmFyLiAqL1xuICBnZXQgbWVzaFJ1biAoKTogTWVzaFJ1biB8IG51bGwge1xuICAgIGNvbnN0IHRvdWNoZXMgPSB0aGlzLnByb2JlVG91Y2hlc1xuICAgIGlmICghdGhpcy5tZWFzdXJpbmcgJiYgIXRvdWNoZXMuc29tZSh0ID0+IHQua2luZCA9PT0gJ3RvdWNoJykpIHJldHVybiBudWxsXG4gICAgY29uc3QgcG9pbnRzID0gbWVzaFBvaW50cyh0b3VjaGVzKVxuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGU/LnNldHRpbmdzPy5iZWRfbWVzaFxuICAgIGNvbnN0IHBsYW4gPSBjaG9vc2VQbGFuKHBvaW50cywgW1xuICAgICAgcGxhbkZyb20odGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyWydnY29kZV9tYWNybyBfQkVEX01FU0hfUExBTiddPy5wb2ludHMpLFxuICAgICAgcGxhbkZyb21TZXR0aW5ncyhzZXR0aW5ncz8ubWVzaF9taW4sIHNldHRpbmdzPy5tZXNoX21heCwgcHJvYmVDb3VudChzZXR0aW5ncz8ucHJvYmVfY291bnQpKVxuICAgIF0pXG4gICAgY29uc3QgbGF5b3V0ID0gbWVzaExheW91dChwbGFuID8gcGxhbi5tYXAoKFt4LCB5XSkgPT4gKHsgeCwgeSB9KSkgOiBwb2ludHMpXG4gICAgY29uc3QgYmVkID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmhlYXRlcl9iZWRcbiAgICByZXR1cm4ge1xuICAgICAgcG9pbnRzLFxuICAgICAgZ3JpZDogbGl2ZUdyaWQocG9pbnRzLCBsYXlvdXQpLFxuICAgICAgdG91Y2hlcyxcbiAgICAgIHByb2dyZXNzOiBtZXNoUHJvZ3Jlc3Moe1xuICAgICAgICBwb2ludHMsXG4gICAgICAgIHRvdGFsOiBwbGFuID8gcGxhbi5sZW5ndGggOiBudWxsLFxuICAgICAgICBob21pbmdUb3VjaGVzOiBob21pbmdUb3VjaGVzKHRvdWNoZXMpLFxuICAgICAgICBob21lZEF0U3RhcnQ6ICEocnVubmluZy5jaGVjaz8uaG9tZUZpcnN0ID8/ICF0aGlzLmFsbEhvbWVkKSxcbiAgICAgICAgYmVkOiBiZWQgPyB7IHRlbXBlcmF0dXJlOiBiZWQudGVtcGVyYXR1cmUsIHRhcmdldDogYmVkLnRhcmdldCB9IDogbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvKiogTGlmZXRpbWUgcHJpbnRpbmcgaG91cnMsIGZyb20gdGhlIHByaW50IGhpc3RvcnkuICovXG4gIGdldCBwcmludEhvdXJzICgpOiBudW1iZXIgfCBudWxsIHtcbiAgICBpZiAoIXRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9jb21wb25lbnRTdXBwb3J0J10oJ2hpc3RvcnknKSkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBzZWNvbmRzID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snaGlzdG9yeS9nZXRSb2xsVXAnXT8udG90YWxfcHJpbnRfdGltZSBhcyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICByZXR1cm4gc2Vjb25kcyA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IE1hdGgucm91bmQoc2Vjb25kcyAvIDM2MDApXG4gIH1cblxuICAvKiogUHJpbnRzIG9uIHRoaXMgcHJpbnRlcidzIHJlY29yZCwgZnJvbSB0aGUgcHJpbnQgaGlzdG9yeS4gKi9cbiAgZ2V0IHByaW50Q291bnQgKCk6IG51bWJlciB8IG51bGwge1xuICAgIGlmICghdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2NvbXBvbmVudFN1cHBvcnQnXSgnaGlzdG9yeScpKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGpvYnMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydoaXN0b3J5L2dldFJvbGxVcCddPy50b3RhbF9qb2JzIGFzIG51bWJlciB8IHVuZGVmaW5lZFxuICAgIHJldHVybiB0eXBlb2Ygam9icyA9PT0gJ251bWJlcicgPyBqb2JzIDogbnVsbFxuICB9XG5cbiAgZ2V0IHNhdmVDb25maWdQZW5kaW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRTYXZlQ29uZmlnUGVuZGluZyddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIC8qKiBXaHkgU2F2ZSBjYW4ndCBydW4gbm93LCBvciAnJyB3aGVuIGl0IGNhbjogU0FWRV9DT05GSUcgcmVzdGFydHMgS2xpcHBlciwgd2hpY2ggZW5kcyBhIHByaW50LCBwYXVzZWQgb3Igbm90LiAqL1xuICBnZXQgc2F2ZUJsb2NrZWQgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIHRoaXMuY29udHJvbExvY2tcbiAgICBpZiAodGhpcy5yZXN0YXJ0UmVmdXNhbCkgcmV0dXJuIHRoaXMucmVzdGFydFJlZnVzYWxcbiAgICBpZiAodGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkKSByZXR1cm4gJ05vdCB3aGlsZSBwcmludGluZy4nXG4gICAgaWYgKHRoaXMuaGFzV2FpdCh0aGlzLiR3YWl0cy5vblNhdmVDb25maWcpKSByZXR1cm4gJ1NhdmluZ+KApidcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGFzeW5jIHNhdmVSZXN1bHRzICgpIHtcbiAgICBpZiAoIXRoaXMuc2F2ZUNvbmZpZ1BlbmRpbmcgfHwgdGhpcy5zYXZlQmxvY2tlZCkgcmV0dXJuXG4gICAgaWYgKGF3YWl0IHRoaXMuY29uZmlybUNvbW1hbmRSZXN0YXJ0KCdzYXZlJykgJiYgdGhpcy5zYXZlQ29uZmlnUGVuZGluZyAmJiAhdGhpcy5zYXZlQmxvY2tlZCkgdGhpcy5zZW5kR2NvZGUoJ1NBVkVfQ09ORklHJywgdGhpcy4kd2FpdHMub25TYXZlQ29uZmlnKVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLFdBQVcsY0FBYztBQUNsQyxPQUFPLGtCQUFrQjtBQUN6QixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLGFBQWE7QUFDdEIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsbUJBQW1CO0FBQzVCO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FLSztBQUVQO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FJSztBQWFQLE1BQU0sYUFBYTtBQTRCbkIsTUFBTSxT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