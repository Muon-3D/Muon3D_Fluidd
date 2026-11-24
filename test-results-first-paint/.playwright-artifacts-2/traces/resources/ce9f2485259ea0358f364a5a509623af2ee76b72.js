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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import { bedMiddle, parseProbeAccuracy, probeAccuracyScript, probeVerdict } from "/src/services/maintenance/model.ts";
import { meshSpan, readNoGo } from "/src/services/control/safe-move.ts";
import { EventBus } from "/src/eventBus.ts";
import { plateCheckNeeded } from "/src/services/jobs/plate.ts";
let ProbeAccuracyMixin = class extends Mixins(MaintenanceMixin) {
  /** The newest PROBE_ACCURACY result in the console, and when it came. */
  get latest() {
    const entries = this.$store.state.console.console ?? [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const result = parseProbeAccuracy(entries[i].message ?? "");
      if (result) return { result, time: entries[i].time ?? 0 };
    }
    return null;
  }
  get accuracy() {
    return this.latest?.result ?? null;
  }
  get verdict() {
    return probeVerdict(this.accuracy?.stddev ?? 0);
  }
  get accuracyWhen() {
    const t = this.latest?.time;
    if (!t) return "";
    const d = new Date(t * 1e3);
    return `· ${d.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit" })}`;
  }
  micron(mm) {
    return `${Math.round(mm * 1e3)} µm`;
  }
  get checking() {
    return this.hasWait(this.$waits.onProbeAccuracy);
  }
  get canCheck() {
    return "PROBE_ACCURACY" in this.gcodeCommands && !this.checksBlocked && !this.checking;
  }
  get middle() {
    const mesh = this.$store.state.printer.printer.configfile?.settings?.bed_mesh;
    return bedMiddle(mesh?.mesh_min, mesh?.mesh_max, this.axisMin, this.axisMax);
  }
  async checkAccuracy() {
    if (!this.canCheck) return;
    const target = this.maintenanceTarget;
    const [x, y] = this.middle;
    const ok = await this.$confirm(
      `${this.allHomed ? "The head" : "It homes, then the head"} goes to the middle of the bed (X${x} Y${y}) and probes there ten times. Keep the plate on and the nozzle clean.`,
      // It touches the middle of the plate ten times: the plate check first, as for a print.
      { title: "Probe accuracy", buttonTrueText: "Start", plateCheck: plateCheckNeeded(this.$store.state.history?.jobs) }
    );
    if (!ok || target !== this.maintenanceTarget || !this.canCheck) return;
    const settings = this.$store.state.printer.printer.configfile?.settings;
    const noGo = settings && Object.keys(settings).length ? readNoGo(settings.bed_mesh) : "invalid";
    if (noGo === "invalid") {
      EventBus.$emit("The printer’s notch could not be read, so the probe check will not move the head. Check [bed_mesh] in printer.cfg.", { type: "warning" });
      return;
    }
    let lift;
    if (noGo && !Number.isFinite(noGo.traverseZ)) {
      EventBus.$emit("The printer’s notch height (no_go_traverse_z) could not be read, so the probe check will not move the head. Check [bed_mesh] in printer.cfg.", { type: "warning" });
      return;
    }
    if (noGo) {
      if (!this.allHomed) {
        EventBus.$emit("Home the printer first: the way to the middle of the bed passes the notch.", { type: "warning" });
        return;
      }
      const printer = this.$store.state.printer.printer;
      const toolZ = Number(printer.toolhead?.position?.[2]);
      const gcodeZ = Number(printer.gcode_move?.gcode_position?.[2]);
      if (!Number.isFinite(toolZ) || !Number.isFinite(gcodeZ)) return;
      const clear = noGo.traverseZ + meshSpan(printer.bed_mesh);
      if (toolZ < clear) lift = Math.round((clear - (toolZ - gcodeZ)) * 1e3) / 1e3;
    }
    this.sendGcode(probeAccuracyScript(this.allHomed, this.middle, lift), this.$waits.onProbeAccuracy);
  }
};
ProbeAccuracyMixin = __decorateClass([
  Component({})
], ProbeAccuracyMixin);
export {
  ProbeAccuracyMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb2JlLWFjY3VyYWN5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNYWludGVuYW5jZU1peGluIGZyb20gJy4vbWFpbnRlbmFuY2UnXG5pbXBvcnQgdHlwZSB7IENvbnNvbGVFbnRyeSB9IGZyb20gJ0Avc3RvcmUvY29uc29sZS90eXBlcydcbmltcG9ydCB7IGJlZE1pZGRsZSwgcGFyc2VQcm9iZUFjY3VyYWN5LCBwcm9iZUFjY3VyYWN5U2NyaXB0LCBwcm9iZVZlcmRpY3QsIHR5cGUgUHJvYmVBY2N1cmFjeSB9IGZyb20gJ0Avc2VydmljZXMvbWFpbnRlbmFuY2UvbW9kZWwnXG5pbXBvcnQgeyBtZXNoU3BhbiwgcmVhZE5vR28gfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvc2FmZS1tb3ZlJ1xuaW1wb3J0IHsgRXZlbnRCdXMgfSBmcm9tICdAL2V2ZW50QnVzJ1xuaW1wb3J0IHsgcGxhdGVDaGVja05lZWRlZCB9IGZyb20gJ0Avc2VydmljZXMvam9icy9wbGF0ZSdcblxuLyoqXG4gKiBQcm9iZSBhY2N1cmFjeTogdGVuIHByb2JlcyBpbiB0aGUgbWlkZGxlIG9mIHRoZSBiZWQsIGFuZCBob3cgcmVwZWF0YWJsZSB0aGVcbiAqIGhlaWdodHMgYXJlLiBUaGUgcmVzdWx0IGNvbWVzIGZyb20gS2xpcHBlcidzIG93biBsaW5lIGluIHRoZSBjb25zb2xlLiBVc2VkXG4gKiBieSB0aGUgUHJvYmUgdGlsZSBvbiBCZWQgYW5kIGJ5IENhbGlicmF0aW9uIG9uIEhlYWx0aCwgc28gYm90aCBhc2sgdGhlIHNhbWVcbiAqIGNvbmZpcm1hdGlvbiBhbmQgZ28gdG8gdGhlIG1pZGRsZSBvZiB0aGUgYmVkIGJ5IHRoZSBzYW1lIG5vLWdvLWF3YXJlIHBhdGguXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9iZUFjY3VyYWN5TWl4aW4gZXh0ZW5kcyBNaXhpbnMoTWFpbnRlbmFuY2VNaXhpbikge1xuICAvKiogVGhlIG5ld2VzdCBQUk9CRV9BQ0NVUkFDWSByZXN1bHQgaW4gdGhlIGNvbnNvbGUsIGFuZCB3aGVuIGl0IGNhbWUuICovXG4gIGdldCBsYXRlc3QgKCk6IHsgcmVzdWx0OiBQcm9iZUFjY3VyYWN5LCB0aW1lOiBudW1iZXIgfSB8IG51bGwge1xuICAgIGNvbnN0IGVudHJpZXMgPSAodGhpcy4kc3RvcmUuc3RhdGUuY29uc29sZS5jb25zb2xlIGFzIENvbnNvbGVFbnRyeVtdIHwgdW5kZWZpbmVkKSA/PyBbXVxuICAgIGZvciAobGV0IGkgPSBlbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZVByb2JlQWNjdXJhY3koZW50cmllc1tpXS5tZXNzYWdlID8/ICcnKVxuICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHsgcmVzdWx0LCB0aW1lOiBlbnRyaWVzW2ldLnRpbWUgPz8gMCB9XG4gICAgfVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBnZXQgYWNjdXJhY3kgKCk6IFByb2JlQWNjdXJhY3kgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5sYXRlc3Q/LnJlc3VsdCA/PyBudWxsXG4gIH1cblxuICBnZXQgdmVyZGljdCAoKSB7XG4gICAgcmV0dXJuIHByb2JlVmVyZGljdCh0aGlzLmFjY3VyYWN5Py5zdGRkZXYgPz8gMClcbiAgfVxuXG4gIGdldCBhY2N1cmFjeVdoZW4gKCk6IHN0cmluZyB7XG4gICAgY29uc3QgdCA9IHRoaXMubGF0ZXN0Py50aW1lXG4gICAgaWYgKCF0KSByZXR1cm4gJydcbiAgICBjb25zdCBkID0gbmV3IERhdGUodCAqIDEwMDApXG4gICAgcmV0dXJuIGDCtyAke2QudG9Mb2NhbGVUaW1lU3RyaW5nKHVuZGVmaW5lZCwgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pfWBcbiAgfVxuXG4gIG1pY3JvbiAobW06IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke01hdGgucm91bmQobW0gKiAxMDAwKX0gwrVtYFxuICB9XG5cbiAgZ2V0IGNoZWNraW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXNXYWl0KHRoaXMuJHdhaXRzLm9uUHJvYmVBY2N1cmFjeSlcbiAgfVxuXG4gIGdldCBjYW5DaGVjayAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICdQUk9CRV9BQ0NVUkFDWScgaW4gdGhpcy5nY29kZUNvbW1hbmRzICYmICF0aGlzLmNoZWNrc0Jsb2NrZWQgJiYgIXRoaXMuY2hlY2tpbmdcbiAgfVxuXG4gIGdldCBtaWRkbGUgKCk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIGNvbnN0IG1lc2ggPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZT8uc2V0dGluZ3M/LmJlZF9tZXNoXG4gICAgcmV0dXJuIGJlZE1pZGRsZShtZXNoPy5tZXNoX21pbiwgbWVzaD8ubWVzaF9tYXgsIHRoaXMuYXhpc01pbiwgdGhpcy5heGlzTWF4KVxuICB9XG5cbiAgYXN5bmMgY2hlY2tBY2N1cmFjeSAoKSB7XG4gICAgaWYgKCF0aGlzLmNhbkNoZWNrKSByZXR1cm5cbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLm1haW50ZW5hbmNlVGFyZ2V0XG4gICAgY29uc3QgW3gsIHldID0gdGhpcy5taWRkbGVcbiAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICBgJHt0aGlzLmFsbEhvbWVkID8gJ1RoZSBoZWFkJyA6ICdJdCBob21lcywgdGhlbiB0aGUgaGVhZCd9IGdvZXMgdG8gdGhlIG1pZGRsZSBvZiB0aGUgYmVkIChYJHt4fSBZJHt5fSkgYW5kIHByb2JlcyB0aGVyZSB0ZW4gdGltZXMuIEtlZXAgdGhlIHBsYXRlIG9uIGFuZCB0aGUgbm96emxlIGNsZWFuLmAsXG4gICAgICAvLyBJdCB0b3VjaGVzIHRoZSBtaWRkbGUgb2YgdGhlIHBsYXRlIHRlbiB0aW1lczogdGhlIHBsYXRlIGNoZWNrIGZpcnN0LCBhcyBmb3IgYSBwcmludC5cbiAgICAgIHsgdGl0bGU6ICdQcm9iZSBhY2N1cmFjeScsIGJ1dHRvblRydWVUZXh0OiAnU3RhcnQnLCBwbGF0ZUNoZWNrOiBwbGF0ZUNoZWNrTmVlZGVkKHRoaXMuJHN0b3JlLnN0YXRlLmhpc3Rvcnk/LmpvYnMpIH1cbiAgICApXG4gICAgaWYgKCFvayB8fCB0YXJnZXQgIT09IHRoaXMubWFpbnRlbmFuY2VUYXJnZXQgfHwgIXRoaXMuY2FuQ2hlY2spIHJldHVyblxuICAgIC8vIENvbmZpZyBub3QgbG9hZGVkIHlldCBjb3VudHMgYXMgdW5yZWFkYWJsZSwgYXMgZm9yIGV2ZXJ5IGhhbmQgbW92ZS5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5jb25maWdmaWxlPy5zZXR0aW5nc1xuICAgIGNvbnN0IG5vR28gPSBzZXR0aW5ncyAmJiBPYmplY3Qua2V5cyhzZXR0aW5ncykubGVuZ3RoID8gcmVhZE5vR28oc2V0dGluZ3MuYmVkX21lc2gpIDogJ2ludmFsaWQnXG4gICAgaWYgKG5vR28gPT09ICdpbnZhbGlkJykge1xuICAgICAgRXZlbnRCdXMuJGVtaXQoJ1RoZSBwcmludGVy4oCZcyBub3RjaCBjb3VsZCBub3QgYmUgcmVhZCwgc28gdGhlIHByb2JlIGNoZWNrIHdpbGwgbm90IG1vdmUgdGhlIGhlYWQuIENoZWNrIFtiZWRfbWVzaF0gaW4gcHJpbnRlci5jZmcuJywgeyB0eXBlOiAnd2FybmluZycgfSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBsZXQgbGlmdDogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgaWYgKG5vR28gJiYgIU51bWJlci5pc0Zpbml0ZShub0dvLnRyYXZlcnNlWikpIHtcbiAgICAgIC8vIEEgbm90Y2ggd2l0aCBubyBoZWlnaHQgKG5vX2dvX3RyYXZlcnNlX3ogbWlzc2luZyBvciBub3QgYWJvdmUgMCk6IHRoZXJlIGlzIG5vIHNhZmUgaGVpZ2h0IHRvIGNyb3NzIGl0IGF0LlxuICAgICAgRXZlbnRCdXMuJGVtaXQoJ1RoZSBwcmludGVy4oCZcyBub3RjaCBoZWlnaHQgKG5vX2dvX3RyYXZlcnNlX3opIGNvdWxkIG5vdCBiZSByZWFkLCBzbyB0aGUgcHJvYmUgY2hlY2sgd2lsbCBub3QgbW92ZSB0aGUgaGVhZC4gQ2hlY2sgW2JlZF9tZXNoXSBpbiBwcmludGVyLmNmZy4nLCB7IHR5cGU6ICd3YXJuaW5nJyB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChub0dvKSB7XG4gICAgICAvLyBXaGVyZSBob21pbmcgbGVhdmVzIHRoZSBoZWFkIGlzbid0IGtub3duIGhlcmUsIHNvIHdpdGggbm8tZ28gcmVnaW9uc1xuICAgICAgLy8gdGhlIGNoZWNrIHN0YXJ0cyBmcm9tIGEgaG9tZWQgaGVhZCB3aG9zZSBoZWlnaHQgaXMga25vd24uXG4gICAgICBpZiAoIXRoaXMuYWxsSG9tZWQpIHtcbiAgICAgICAgRXZlbnRCdXMuJGVtaXQoJ0hvbWUgdGhlIHByaW50ZXIgZmlyc3Q6IHRoZSB3YXkgdG8gdGhlIG1pZGRsZSBvZiB0aGUgYmVkIHBhc3NlcyB0aGUgbm90Y2guJywgeyB0eXBlOiAnd2FybmluZycgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICAvLyBMaWZ0IG9ubHkgaWYgdGhlIGhlYWQgaXMgYmVsb3cgdGhlIGNyb3NzaW5nIGhlaWdodCAobmV2ZXIgbG93ZXIgaXQgb250b1xuICAgICAgLy8gd2hhdGV2ZXIgaXMgb24gdGhlIHBsYXRlKSwgc2VudCBpbiBHLWNvZGUgY29vcmRpbmF0ZXMuXG4gICAgICBjb25zdCBwcmludGVyID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgICBjb25zdCB0b29sWiA9IE51bWJlcihwcmludGVyLnRvb2xoZWFkPy5wb3NpdGlvbj8uWzJdKVxuICAgICAgY29uc3QgZ2NvZGVaID0gTnVtYmVyKHByaW50ZXIuZ2NvZGVfbW92ZT8uZ2NvZGVfcG9zaXRpb24/LlsyXSlcbiAgICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHRvb2xaKSB8fCAhTnVtYmVyLmlzRmluaXRlKGdjb2RlWikpIHJldHVyblxuICAgICAgY29uc3QgY2xlYXIgPSBub0dvLnRyYXZlcnNlWiArIG1lc2hTcGFuKHByaW50ZXIuYmVkX21lc2gpXG4gICAgICBpZiAodG9vbFogPCBjbGVhcikgbGlmdCA9IE1hdGgucm91bmQoKGNsZWFyIC0gKHRvb2xaIC0gZ2NvZGVaKSkgKiAxMDAwKSAvIDEwMDBcbiAgICB9XG4gICAgdGhpcy5zZW5kR2NvZGUocHJvYmVBY2N1cmFjeVNjcmlwdCh0aGlzLmFsbEhvbWVkLCB0aGlzLm1pZGRsZSwgbGlmdCksIHRoaXMuJHdhaXRzLm9uUHJvYmVBY2N1cmFjeSlcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLGNBQWM7QUFDbEMsT0FBTyxzQkFBc0I7QUFFN0IsU0FBUyxXQUFXLG9CQUFvQixxQkFBcUIsb0JBQXdDO0FBQ3JHLFNBQVMsVUFBVSxnQkFBZ0I7QUFDbkMsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyx3QkFBd0I7QUFTakMsSUFBcUIscUJBQXJCLGNBQWdELE9BQU8sZ0JBQWdCLEVBQUU7QUFBQTtBQUFBLEVBRXZFLElBQUksU0FBMEQ7QUFDNUQsVUFBTSxVQUFXLEtBQUssT0FBTyxNQUFNLFFBQVEsV0FBMEMsQ0FBQztBQUN0RixhQUFTLElBQUksUUFBUSxTQUFTLEdBQUcsS0FBSyxHQUFHLEtBQUs7QUFDNUMsWUFBTSxTQUFTLG1CQUFtQixRQUFRLENBQUMsRUFBRSxXQUFXLEVBQUU7QUFDMUQsVUFBSSxPQUFRLFFBQU8sRUFBRSxRQUFRLE1BQU0sUUFBUSxDQUFDLEVBQUUsUUFBUSxFQUFFO0FBQUEsSUFDMUQ7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsSUFBSSxXQUFrQztBQUNwQyxXQUFPLEtBQUssUUFBUSxVQUFVO0FBQUEsRUFDaEM7QUFBQSxFQUVBLElBQUksVUFBVztBQUNi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