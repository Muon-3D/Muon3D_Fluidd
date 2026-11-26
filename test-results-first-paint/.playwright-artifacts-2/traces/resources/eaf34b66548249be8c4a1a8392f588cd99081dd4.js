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
import ControlMixin from "/src/mixins/control.ts";
import { NO_MATERIAL_LOADED } from "/src/services/jobs/model.ts";
import FilesMixin from "/src/mixins/files.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { jobName } from "/src/services/printers-page/model.ts";
import { plateCheckNeeded } from "/src/services/jobs/plate.ts";
import { plateNoticeFor } from "/src/services/plate/ask.ts";
import { filamentFact, heaterTile, longDuration, spoolFact } from "/src/services/overview/model.ts";
import { activeSlug, printerHomePath } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import getFilePaths from "/src/util/get-file-paths.ts";
import { shortDuration } from "/src/util/short-duration.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
let OverviewMixin = class extends Mixins(ControlMixin, FilesMixin) {
  size;
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  get printStats() {
    return this.$store.state.printer.printer.print_stats ?? {};
  }
  get currentFile() {
    return this.$store.state.printer.printer.current_file ?? {};
  }
  get jobFile() {
    return this.printStats.filename || "";
  }
  get activePrintJob() {
    return this.$store.state.history?.jobs?.find((job) => job.status === "in_progress" && job.filename === this.jobFile && !job.end_time);
  }
  get jobName() {
    return jobName(this.jobFile) ?? "";
  }
  get progress() {
    return this.$store.getters["printer/getPrintProgress"] * 100;
  }
  get secondsLeft() {
    if (!this.printerPrinting) return null;
    const estimates = this.$store.getters["printer/getTimeEstimates"];
    const left = (estimates.eta - Date.now()) / 1e3;
    return left > 0 ? left : null;
  }
  get leftText() {
    return this.secondsLeft ? `${shortDuration(this.secondsLeft)} left` : null;
  }
  get doneAt() {
    if (!this.secondsLeft) return null;
    const at = new Date(Date.now() + this.secondsLeft * 1e3);
    return `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  }
  get startedAt() {
    const duration = this.printStats.total_duration;
    if (!duration || !this.jobFile) return null;
    const at = new Date(Date.now() - duration * 1e3);
    return `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  }
  get layer() {
    return this.$store.getters["printer/getPrintLayer"] || null;
  }
  get layers() {
    return this.$store.getters["printer/getPrintLayers"] || null;
  }
  get layerFact() {
    if (!this.layer || !this.layers) return null;
    return `${this.layer} of ${this.layers} · ${this.position[2].toFixed(1)} mm`;
  }
  get filamentFact() {
    const used = this.printStats.filament_used ?? 0;
    const total = this.currentFile.filament_total ?? null;
    const grams = this.currentFile.filament_weight_total ?? null;
    return filamentFact(used, total, grams);
  }
  /**
   * The spool on the printer while it prints: what someone said is loaded,
   * else what the file was sliced for. The filament tile gives way to Speed
   * while printing, so this is where it shows (14 Oct 2026: "no spool
   * attached even though it's printing").
   */
  get spoolFact() {
    const fact = spoolFact(this.loadedMaterial?.name ?? null, this.loadedColour, this.printingWith);
    return fact === NO_MATERIAL_LOADED && this.filamentSensed ? "Filament loaded" : fact;
  }
  get runningFor() {
    const d = this.printStats.print_duration;
    return d ? longDuration(d) : null;
  }
  get slicerSaid() {
    const t = this.currentFile.estimated_time;
    return t ? `${longDuration(t)} total` : null;
  }
  /** The part's own picture, from its G-code. */
  get jobThumbnail() {
    const f = this.currentFile;
    if (!f?.thumbnails?.length) return null;
    return this.getThumbUrl(f, "gcodes", f.path, true, f.modified) || null;
  }
  get nozzleTile() {
    return this.nozzle ? heaterTile(this.nozzle.temperature, this.nozzle.target) : null;
  }
  get bedTile() {
    return this.bed ? heaterTile(this.bed.temperature, this.bed.target) : null;
  }
  get queue() {
    return this.$store.getters["jobQueue/getQueuedJobs"] ?? [];
  }
  get recentJobs() {
    const history = this.$store.getters["history/getUniqueHistory"](3) ?? [];
    return history.map((job) => {
      const meta = job.metadata;
      const facts = [];
      if (meta?.estimated_time) facts.push(shortDuration(meta.estimated_time));
      if (meta?.filament_weight_total) facts.push(`${Math.round(meta.filament_weight_total)} g${meta.filament_type ? ` ${meta.filament_type}` : ""}`);
      facts.push(this.whenPrinted(job));
      return {
        filename: job.filename,
        name: jobName(job.filename) ?? job.filename,
        thumbnail: meta ? this.getThumbUrl(meta, "gcodes", getFilePaths(job.filename, "gcodes").path, false, meta.modified) : "",
        facts: facts.join(" · ")
      };
    });
  }
  whenPrinted(job) {
    const days = Math.floor((Date.now() / 1e3 - job.start_time) / 86400);
    if (days < 1) return "printed today";
    if (days < 2) return "printed yesterday";
    return `printed ${days} days ago`;
  }
  /** The "Film it" switch on the print sheet, when the printer can film (moonraker-timelapse): what its settings say now. */
  get filmChoice() {
    if (!this.$store.getters["server/componentSupport"]("timelapse")) return void 0;
    const settings = this.$store.getters["timelapse/getSettings"] ?? {};
    if (typeof settings.enabled !== "boolean") return void 0;
    return {
      on: settings.enabled,
      line: settings.mode === "hyperlapse" ? "Every few seconds" : "Each layer",
      set: (on) => SocketActions.machineTimelapseSetSettings({ enabled: on })
    };
  }
  pagePath(page) {
    return scopedPath(page, activeSlug());
  }
  async printAgain(filename) {
    if (!this.controlReady || this.busy) return;
    const target = this.panelTarget;
    const name = jobName(filename) ?? filename;
    const ok = await this.$confirm(`${this.printerName} heats up, homes and starts printing.`, {
      title: `Print ${name} on ${this.printerName}?`,
      buttonTrueText: "Print now",
      plateCheck: plateCheckNeeded(this.$store.state.history?.jobs),
      plateNotice: plateNoticeFor(this.$store.state),
      film: this.filmChoice
    });
    if (!ok || target !== this.panelTarget || !this.controlReady || this.busy) return;
    const spoolman = this.$store.getters["spoolman/getAvailable"] && this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog;
    if (spoolman) {
      this.$store.commit("spoolman/setDialogState", { show: true, filename });
      return;
    }
    SocketActions.printerPrintStart(filename);
    if (this.$route.path !== printerHomePath()) this.$router.push(printerHomePath()).catch(() => {
    });
  }
};
__decorateClass([
  Prop({ type: String, default: "M" })
], OverviewMixin.prototype, "size", 2);
OverviewMixin = __decorateClass([
  Component
], OverviewMixin);
export {
  OverviewMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm92ZXJ2aWV3LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBDb250cm9sTWl4aW4gZnJvbSAnLi9jb250cm9sJ1xuaW1wb3J0IHsgTk9fTUFURVJJQUxfTE9BREVEIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IEZpbGVzTWl4aW4gZnJvbSAnLi9maWxlcydcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHR5cGUgeyBUaW1lRXN0aW1hdGVzIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBIaXN0b3J5SXRlbSB9IGZyb20gJ0Avc3RvcmUvaGlzdG9yeS90eXBlcydcbmltcG9ydCB0eXBlIHsgUXVldWVkSm9iIH0gZnJvbSAnQC9zdG9yZS9qb2JRdWV1ZS90eXBlcydcbmltcG9ydCB7IGpvYk5hbWUgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXJzLXBhZ2UvbW9kZWwnXG5pbXBvcnQgeyBwbGF0ZUNoZWNrTmVlZGVkIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL3BsYXRlJ1xuaW1wb3J0IHsgcGxhdGVOb3RpY2VGb3IgfSBmcm9tICdAL3NlcnZpY2VzL3BsYXRlL2FzaydcbmltcG9ydCB7IGZpbGFtZW50RmFjdCwgaGVhdGVyVGlsZSwgbG9uZ0R1cmF0aW9uLCBzcG9vbEZhY3QsIHR5cGUgSGVhdGVyVGlsZSB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvbW9kZWwnXG5pbXBvcnQgeyBhY3RpdmVTbHVnLCBwcmludGVySG9tZVBhdGggfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCBnZXRGaWxlUGF0aHMgZnJvbSAnQC91dGlsL2dldC1maWxlLXBhdGhzJ1xuaW1wb3J0IHsgc2hvcnREdXJhdGlvbiB9IGZyb20gJ0AvdXRpbC9zaG9ydC1kdXJhdGlvbidcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMgfSBmcm9tICdAL3V0aWwvcHJpbnRlci1uYW1lJ1xuXG4vKiogQSByZWNlbnQgam9iLCB0byBwcmludCBhZ2FpbiBmcm9tIE92ZXJ2aWV3LiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZWNlbnRKb2Ige1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHRodW1ibmFpbDogc3RyaW5nO1xuICBmYWN0czogc3RyaW5nO1xufVxuXG4vKipcbiAqIFdoYXQgT3ZlcnZpZXcncyBwYW5lbHMgc2hhcmU6IHRoZSBwcmludCBydW5uaW5nIG5vdyBhbmQgaXRzIGZhY3RzLCB0aGVcbiAqIGhlYXRlcnMgYXMgdGlsZXMsIHRoZSBxdWV1ZSwgcmVjZW50IGpvYnMsIGFuZCB0aGUgbGlua3MgdG8gQ29udHJvbCBhbmRcbiAqIEpvYnMuIFRoZSBjb21tYW5kcyBhcmUgQ29udHJvbCdzLlxuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPdmVydmlld01peGluIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbiwgRmlsZXNNaXhpbikge1xuICAvKiogVGhlIHdpZGdldCdzIHNpemUgb24gdGhlIE92ZXJ2aWV3OiBTLCBNIG9yIEwuIEVhY2ggZHJhd3MgYSBkaWZmZXJlbnQgYW1vdW50LCBub3QgdGhlIHNhbWUgdGhpbmcgc2NhbGVkLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ00nIH0pIHJlYWRvbmx5IHNpemUhOiAnUycgfCAnTScgfCAnTCdcblxuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKS5uYW1lXG4gIH1cblxuICBnZXQgcHJpbnRTdGF0cyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wcmludF9zdGF0cyA/PyB7fVxuICB9XG5cbiAgZ2V0IGN1cnJlbnRGaWxlICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmN1cnJlbnRfZmlsZSA/PyB7fVxuICB9XG5cbiAgZ2V0IGpvYkZpbGUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh0aGlzLnByaW50U3RhdHMuZmlsZW5hbWUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSB8fCAnJ1xuICB9XG5cbiAgZ2V0IGFjdGl2ZVByaW50Sm9iICgpOiBIaXN0b3J5SXRlbSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmhpc3Rvcnk/LmpvYnM/LmZpbmQoKGpvYjogSGlzdG9yeUl0ZW0pID0+IGpvYi5zdGF0dXMgPT09ICdpbl9wcm9ncmVzcycgJiYgam9iLmZpbGVuYW1lID09PSB0aGlzLmpvYkZpbGUgJiYgIWpvYi5lbmRfdGltZSlcbiAgfVxuXG4gIGdldCBqb2JOYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBqb2JOYW1lKHRoaXMuam9iRmlsZSkgPz8gJydcbiAgfVxuXG4gIGdldCBwcm9ncmVzcyAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRQcm9ncmVzcyddIGFzIG51bWJlcikgKiAxMDBcbiAgfVxuXG4gIGdldCBzZWNvbmRzTGVmdCAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLnByaW50ZXJQcmludGluZykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBlc3RpbWF0ZXMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFRpbWVFc3RpbWF0ZXMnXSBhcyBUaW1lRXN0aW1hdGVzXG4gICAgY29uc3QgbGVmdCA9IChlc3RpbWF0ZXMuZXRhIC0gRGF0ZS5ub3coKSkgLyAxMDAwXG4gICAgcmV0dXJuIGxlZnQgPiAwID8gbGVmdCA6IG51bGxcbiAgfVxuXG4gIGdldCBsZWZ0VGV4dCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc2Vjb25kc0xlZnQgPyBgJHtzaG9ydER1cmF0aW9uKHRoaXMuc2Vjb25kc0xlZnQpfSBsZWZ0YCA6IG51bGxcbiAgfVxuXG4gIGdldCBkb25lQXQgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICghdGhpcy5zZWNvbmRzTGVmdCkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBhdCA9IG5ldyBEYXRlKERhdGUubm93KCkgKyB0aGlzLnNlY29uZHNMZWZ0ICogMTAwMClcbiAgICByZXR1cm4gYCR7U3RyaW5nKGF0LmdldEhvdXJzKCkpLnBhZFN0YXJ0KDIsICcwJyl9OiR7U3RyaW5nKGF0LmdldE1pbnV0ZXMoKSkucGFkU3RhcnQoMiwgJzAnKX1gXG4gIH1cblxuICBnZXQgc3RhcnRlZEF0ICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBkdXJhdGlvbiA9IHRoaXMucHJpbnRTdGF0cy50b3RhbF9kdXJhdGlvbiBhcyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICBpZiAoIWR1cmF0aW9uIHx8ICF0aGlzLmpvYkZpbGUpIHJldHVybiBudWxsXG4gICAgY29uc3QgYXQgPSBuZXcgRGF0ZShEYXRlLm5vdygpIC0gZHVyYXRpb24gKiAxMDAwKVxuICAgIHJldHVybiBgJHtTdHJpbmcoYXQuZ2V0SG91cnMoKSkucGFkU3RhcnQoMiwgJzAnKX06JHtTdHJpbmcoYXQuZ2V0TWludXRlcygpKS5wYWRTdGFydCgyLCAnMCcpfWBcbiAgfVxuXG4gIGdldCBsYXllciAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByaW50TGF5ZXInXSBhcyBudW1iZXIpIHx8IG51bGxcbiAgfVxuXG4gIGdldCBsYXllcnMgKCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludExheWVycyddIGFzIG51bWJlcikgfHwgbnVsbFxuICB9XG5cbiAgZ2V0IGxheWVyRmFjdCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLmxheWVyIHx8ICF0aGlzLmxheWVycykgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gYCR7dGhpcy5sYXllcn0gb2YgJHt0aGlzLmxheWVyc30gwrcgJHt0aGlzLnBvc2l0aW9uWzJdLnRvRml4ZWQoMSl9IG1tYFxuICB9XG5cbiAgZ2V0IGZpbGFtZW50RmFjdCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgdXNlZCA9ICh0aGlzLnByaW50U3RhdHMuZmlsYW1lbnRfdXNlZCBhcyBudW1iZXIgfCB1bmRlZmluZWQpID8/IDBcbiAgICBjb25zdCB0b3RhbCA9ICh0aGlzLmN1cnJlbnRGaWxlLmZpbGFtZW50X3RvdGFsIGFzIG51bWJlciB8IHVuZGVmaW5lZCkgPz8gbnVsbFxuICAgIGNvbnN0IGdyYW1zID0gKHRoaXMuY3VycmVudEZpbGUuZmlsYW1lbnRfd2VpZ2h0X3RvdGFsIGFzIG51bWJlciB8IHVuZGVmaW5lZCkgPz8gbnVsbFxuICAgIHJldHVybiBmaWxhbWVudEZhY3QodXNlZCwgdG90YWwsIGdyYW1zKVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzcG9vbCBvbiB0aGUgcHJpbnRlciB3aGlsZSBpdCBwcmludHM6IHdoYXQgc29tZW9uZSBzYWlkIGlzIGxvYWRlZCxcbiAgICogZWxzZSB3aGF0IHRoZSBmaWxlIHdhcyBzbGljZWQgZm9yLiBUaGUgZmlsYW1lbnQgdGlsZSBnaXZlcyB3YXkgdG8gU3BlZWRcbiAgICogd2hpbGUgcHJpbnRpbmcsIHNvIHRoaXMgaXMgd2hlcmUgaXQgc2hvd3MgKDE0IE9jdCAyMDI2OiBcIm5vIHNwb29sXG4gICAqIGF0dGFjaGVkIGV2ZW4gdGhvdWdoIGl0J3MgcHJpbnRpbmdcIikuXG4gICAqL1xuICBnZXQgc3Bvb2xGYWN0ICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZhY3QgPSBzcG9vbEZhY3QodGhpcy5sb2FkZWRNYXRlcmlhbD8ubmFtZSA/PyBudWxsLCB0aGlzLmxvYWRlZENvbG91ciwgdGhpcy5wcmludGluZ1dpdGgpXG4gICAgcmV0dXJuIGZhY3QgPT09IE5PX01BVEVSSUFMX0xPQURFRCAmJiB0aGlzLmZpbGFtZW50U2Vuc2VkID8gJ0ZpbGFtZW50IGxvYWRlZCcgOiBmYWN0XG4gIH1cblxuICBnZXQgcnVubmluZ0ZvciAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgZCA9IHRoaXMucHJpbnRTdGF0cy5wcmludF9kdXJhdGlvbiBhcyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICByZXR1cm4gZCA/IGxvbmdEdXJhdGlvbihkKSA6IG51bGxcbiAgfVxuXG4gIGdldCBzbGljZXJTYWlkICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCB0ID0gdGhpcy5jdXJyZW50RmlsZS5lc3RpbWF0ZWRfdGltZSBhcyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICByZXR1cm4gdCA/IGAke2xvbmdEdXJhdGlvbih0KX0gdG90YWxgIDogbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBwYXJ0J3Mgb3duIHBpY3R1cmUsIGZyb20gaXRzIEctY29kZS4gKi9cbiAgZ2V0IGpvYlRodW1ibmFpbCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgZiA9IHRoaXMuY3VycmVudEZpbGVcbiAgICBpZiAoIWY/LnRodW1ibmFpbHM/Lmxlbmd0aCkgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gdGhpcy5nZXRUaHVtYlVybChmLCAnZ2NvZGVzJywgZi5wYXRoLCB0cnVlLCBmLm1vZGlmaWVkKSB8fCBudWxsXG4gIH1cblxuICBnZXQgbm96emxlVGlsZSAoKTogSGVhdGVyVGlsZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLm5venpsZSA/IGhlYXRlclRpbGUodGhpcy5ub3p6bGUudGVtcGVyYXR1cmUsIHRoaXMubm96emxlLnRhcmdldCkgOiBudWxsXG4gIH1cblxuICBnZXQgYmVkVGlsZSAoKTogSGVhdGVyVGlsZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmJlZCA/IGhlYXRlclRpbGUodGhpcy5iZWQudGVtcGVyYXR1cmUsIHRoaXMuYmVkLnRhcmdldCkgOiBudWxsXG4gIH1cblxuICBnZXQgcXVldWUgKCk6IFF1ZXVlZEpvYltdIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2pvYlF1ZXVlL2dldFF1ZXVlZEpvYnMnXSBhcyBRdWV1ZWRKb2JbXSkgPz8gW11cbiAgfVxuXG4gIGdldCByZWNlbnRKb2JzICgpOiBSZWNlbnRKb2JbXSB7XG4gICAgY29uc3QgaGlzdG9yeSA9ICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydoaXN0b3J5L2dldFVuaXF1ZUhpc3RvcnknXSgzKSBhcyBIaXN0b3J5SXRlbVtdKSA/PyBbXVxuICAgIHJldHVybiBoaXN0b3J5Lm1hcChqb2IgPT4ge1xuICAgICAgY29uc3QgbWV0YSA9IGpvYi5tZXRhZGF0YVxuICAgICAgY29uc3QgZmFjdHM6IHN0cmluZ1tdID0gW11cbiAgICAgIGlmIChtZXRhPy5lc3RpbWF0ZWRfdGltZSkgZmFjdHMucHVzaChzaG9ydER1cmF0aW9uKG1ldGEuZXN0aW1hdGVkX3RpbWUpKVxuICAgICAgaWYgKG1ldGE/LmZpbGFtZW50X3dlaWdodF90b3RhbCkgZmFjdHMucHVzaChgJHtNYXRoLnJvdW5kKG1ldGEuZmlsYW1lbnRfd2VpZ2h0X3RvdGFsKX0gZyR7bWV0YS5maWxhbWVudF90eXBlID8gYCAke21ldGEuZmlsYW1lbnRfdHlwZX1gIDogJyd9YClcbiAgICAgIGZhY3RzLnB1c2godGhpcy53aGVuUHJpbnRlZChqb2IpKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZW5hbWU6IGpvYi5maWxlbmFtZSxcbiAgICAgICAgbmFtZTogam9iTmFtZShqb2IuZmlsZW5hbWUpID8/IGpvYi5maWxlbmFtZSxcbiAgICAgICAgdGh1bWJuYWlsOiBtZXRhID8gdGhpcy5nZXRUaHVtYlVybChtZXRhLCAnZ2NvZGVzJywgZ2V0RmlsZVBhdGhzKGpvYi5maWxlbmFtZSwgJ2djb2RlcycpLnBhdGgsIGZhbHNlLCAobWV0YSBhcyB7IG1vZGlmaWVkPzogbnVtYmVyIH0pLm1vZGlmaWVkKSA6ICcnLFxuICAgICAgICBmYWN0czogZmFjdHMuam9pbignIMK3ICcpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHdoZW5QcmludGVkIChqb2I6IEhpc3RvcnlJdGVtKTogc3RyaW5nIHtcbiAgICBjb25zdCBkYXlzID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAvIDEwMDAgLSBqb2Iuc3RhcnRfdGltZSkgLyA4NjQwMClcbiAgICBpZiAoZGF5cyA8IDEpIHJldHVybiAncHJpbnRlZCB0b2RheSdcbiAgICBpZiAoZGF5cyA8IDIpIHJldHVybiAncHJpbnRlZCB5ZXN0ZXJkYXknXG4gICAgcmV0dXJuIGBwcmludGVkICR7ZGF5c30gZGF5cyBhZ29gXG4gIH1cblxuICAvKiogVGhlIFwiRmlsbSBpdFwiIHN3aXRjaCBvbiB0aGUgcHJpbnQgc2hlZXQsIHdoZW4gdGhlIHByaW50ZXIgY2FuIGZpbG0gKG1vb25yYWtlci10aW1lbGFwc2UpOiB3aGF0IGl0cyBzZXR0aW5ncyBzYXkgbm93LiAqL1xuICBnZXQgZmlsbUNob2ljZSAoKSB7XG4gICAgaWYgKCF0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKCd0aW1lbGFwc2UnKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIGNvbnN0IHNldHRpbmdzID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3RpbWVsYXBzZS9nZXRTZXR0aW5ncyddID8/IHt9KSBhcyB7IGVuYWJsZWQ/OiBib29sZWFuLCBtb2RlPzogc3RyaW5nIH1cbiAgICBpZiAodHlwZW9mIHNldHRpbmdzLmVuYWJsZWQgIT09ICdib29sZWFuJykgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB7XG4gICAgICBvbjogc2V0dGluZ3MuZW5hYmxlZCxcbiAgICAgIGxpbmU6IHNldHRpbmdzLm1vZGUgPT09ICdoeXBlcmxhcHNlJyA/ICdFdmVyeSBmZXcgc2Vjb25kcycgOiAnRWFjaCBsYXllcicsXG4gICAgICBzZXQ6IChvbjogYm9vbGVhbikgPT4gU29ja2V0QWN0aW9ucy5tYWNoaW5lVGltZWxhcHNlU2V0U2V0dGluZ3MoeyBlbmFibGVkOiBvbiB9KVxuICAgIH1cbiAgfVxuXG4gIHBhZ2VQYXRoIChwYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBzY29wZWRQYXRoKHBhZ2UsIGFjdGl2ZVNsdWcoKSlcbiAgfVxuXG4gIGFzeW5jIHByaW50QWdhaW4gKGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuYnVzeSkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5wYW5lbFRhcmdldFxuICAgIGNvbnN0IG5hbWUgPSBqb2JOYW1lKGZpbGVuYW1lKSA/PyBmaWxlbmFtZVxuICAgIGNvbnN0IG9rID0gYXdhaXQgdGhpcy4kY29uZmlybShgJHt0aGlzLnByaW50ZXJOYW1lfSBoZWF0cyB1cCwgaG9tZXMgYW5kIHN0YXJ0cyBwcmludGluZy5gLCB7XG4gICAgICB0aXRsZTogYFByaW50ICR7bmFtZX0gb24gJHt0aGlzLnByaW50ZXJOYW1lfT9gLFxuICAgICAgYnV0dG9uVHJ1ZVRleHQ6ICdQcmludCBub3cnLFxuICAgICAgcGxhdGVDaGVjazogcGxhdGVDaGVja05lZWRlZCh0aGlzLiRzdG9yZS5zdGF0ZS5oaXN0b3J5Py5qb2JzKSxcbiAgICAgIHBsYXRlTm90aWNlOiBwbGF0ZU5vdGljZUZvcih0aGlzLiRzdG9yZS5zdGF0ZSksXG4gICAgICBmaWxtOiB0aGlzLmZpbG1DaG9pY2VcbiAgICB9KVxuICAgIGlmICghb2sgfHwgdGFyZ2V0ICE9PSB0aGlzLnBhbmVsVGFyZ2V0IHx8ICF0aGlzLmNvbnRyb2xSZWFkeSB8fCB0aGlzLmJ1c3kpIHJldHVyblxuICAgIGNvbnN0IHNwb29sbWFuID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snc3Bvb2xtYW4vZ2V0QXZhaWxhYmxlJ10gJiYgdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4uYXV0b1Nwb29sU2VsZWN0aW9uRGlhbG9nXG4gICAgaWYgKHNwb29sbWFuKSB7XG4gICAgICB0aGlzLiRzdG9yZS5jb21taXQoJ3Nwb29sbWFuL3NldERpYWxvZ1N0YXRlJywgeyBzaG93OiB0cnVlLCBmaWxlbmFtZSB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIFNvY2tldEFjdGlvbnMucHJpbnRlclByaW50U3RhcnQoZmlsZW5hbWUpXG4gICAgaWYgKHRoaXMuJHJvdXRlLnBhdGggIT09IHByaW50ZXJIb21lUGF0aCgpKSB0aGlzLiRyb3V0ZXIucHVzaChwcmludGVySG9tZVBhdGgoKSkuY2F0Y2goKCkgPT4ge30pXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLFNBQVMsV0FBVyxRQUFRLFlBQVk7QUFDeEMsT0FBTyxrQkFBa0I7QUFDekIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxxQkFBcUI7QUFJOUIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsY0FBYyxZQUFZLGNBQWMsaUJBQWtDO0FBQ25GLFNBQVMsWUFBWSx1QkFBdUI7QUFDNUMsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx3QkFBd0I7QUFnQmpDLElBQXFCLGdCQUFyQixjQUEyQyxPQUFPLGNBQWMsVUFBVSxFQUFFO0FBQUEsRUFFM0I7QUFBQSxFQUUvQyxJQUFJLGNBQXVCO0FBQ3pCLFdBQU8saUJBQWlCLEtBQUssT0FBTyxRQUFRLHVCQUF1QixDQUFXLEVBQUU7QUFBQSxFQUNsRjtBQUFBLEVBRUEsSUFBSSxh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