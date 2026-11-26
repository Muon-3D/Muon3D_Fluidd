/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import FrameMixin from "/src/mixins/frame.ts";
import { remoteRouteLabel } from "/src/services/muon-ble/link.ts";
import { clearHostOff, hostPower } from "/src/services/system/restart.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { pageMatches } from "/src/router/printerSections.ts";
import { SECTION_COMPONENTS, openSettingsSection } from "/src/services/settings/sections.ts";
import ControlActions from "/src/components/control/ControlActions.vue";
import OverviewActions from "/src/components/overview/OverviewActions.vue";
import PrinterPageMenu from "/src/components/overview/PrinterPageMenu.vue";
import MaintenanceActions from "/src/components/maintenance/MaintenanceActions.vue";
import { maintenancePage } from "/src/services/maintenance/page-state.ts";
import { healthSummary } from "/src/services/maintenance/health.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import ConsoleActions from "/src/components/console/ConsoleActions.vue";
import FilesActions from "/src/components/files/FilesActions.vue";
import CameraActions from "/src/components/camera/CameraActions.vue";
import { cameraPage } from "/src/services/camera/page-state.ts";
import JobsActions from "/src/components/jobs/JobsActions.vue";
import TimelapseActions from "/src/components/timelapse/TimelapseActions.vue";
import PreviewActions from "/src/components/gcode-preview/PreviewActions.vue";
import { timelapseSummary } from "/src/services/timelapse/model.ts";
import { fileSize } from "/src/services/jobs/model.ts";
import { activeSlug, foreignRecordForSlug, isForeignSlug } from "/src/services/printer-pages/index.ts";
import ChartsActions from "/src/components/charts/ChartsActions.vue";
import { chartsPage } from "/src/services/charts/page-state.ts";
import { effectiveRange, rangeText } from "/src/services/charts/model.ts";
import { jobsPage } from "/src/services/jobs/page-state.ts";
import TonePill from "/src/components/printers/TonePill.vue";
import PrinterStatusMixin from "/src/mixins/printer-status.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { networkRouteLabel } from "/src/services/hotspot/model.ts";
import { jobName } from "/src/services/printers-page/model.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import { liveForeign } from "/src/services/foreign-printers/live.ts";
import { emptyStatus } from "/src/services/foreign-printers/adapters/base.ts";
import { FOREIGN_STATE_LABELS, FOREIGN_STATE_TONES } from "/src/services/foreign-printers/types.ts";
let AppPageTitle = class extends Mixins(FrameMixin, BrowserMixin, PrinterStatusMixin) {
  get foreignRecord() {
    const slug = this.$route.params.printer;
    return isForeignSlug(slug) ? foreignRecordForSlug(slug) : void 0;
  }
  get foreignStatus() {
    return this.foreignRecord ? liveForeign.status[this.foreignRecord.id] ?? emptyStatus() : null;
  }
  /** Overview is the printer's own page: it is named by the printer, with its state beside it. */
  get overviewHome() {
    return this.currentSection?.id === "overview" && this.currentPage === "/";
  }
  /** Charts, under Overview: the shared time range and Add chart sit in its header. */
  get chartsHome() {
    return this.currentPage === "/diagnostics" && !this.foreignRecord;
  }
  /** Overview is titled with the printer's name: a placeholder until it is known (KAN-2257). */
  get titlePending() {
    return this.overviewHome && !this.foreignRecord && this.nameWaiting;
  }
  get title() {
    if (this.chartsHome) return "Charts";
    if (this.overviewHome) return this.foreignRecord?.name ?? this.shownName;
    if (this.previewPage) return this.previewFile?.filename.replace(/\.g(code)?$/i, "") || "G-code preview";
    if (this.timelapseHome) return "Timelapse";
    if (this.currentSection?.id === "settings") {
      const page = this.currentSection.pages.find((p) => p.path !== "/settings" && this.isOn(p));
      if (page) return page.label;
    }
    if (this.maintenancePages) return this.bedPage ? "Bed" : "Health";
    const section = this.settingsSection;
    if (section && !(section.id === "general" && !this.isMobileViewport)) return section.label;
    return this.currentSection?.label ?? this.$route.name ?? "";
  }
  /** Settings' open section, by the address's anchor: it names the page, as a section's own header does. */
  get settingsSection() {
    if (this.currentSection?.id !== "settings" || this.currentPage !== "/settings") return null;
    const supports = (name) => this.$store.getters["server/componentSupport"](name);
    return openSettingsSection(this.$route.hash, { components: SECTION_COMPONENTS.filter(supports) });
  }
  /** Maintenance's two pages are named for themselves: Health, and Bed with a way back to Health. */
  get maintenancePages() {
    return this.currentSection?.id === "maintenance" && !this.foreignRecord;
  }
  get bedPage() {
    return this.maintenancePages && this.currentPage === "/tune";
  }
  get healthTo() {
    return scopedPath("/maintenance", activeSlug());
  }
  get consoleTo() {
    return scopedPath("/console", activeSlug());
  }
  get addCameraTo() {
    return { path: scopedPath("/settings", activeSlug()), hash: "#camera", query: { add: "1" } };
  }
  get videosTo() {
    return scopedPath("/timelapse", activeSlug());
  }
  get filesTo() {
    return scopedPath("/configure", activeSlug());
  }
  /** Jobs' own page: its header carries the search, the order and Upload, and History and Timelapse sit in its ··· menu. */
  get jobsHome() {
    return this.currentSection?.id === "jobs" && this.currentPage === "/jobs" && !this.foreignRecord;
  }
  /** Timelapse is a page to watch: its header counts the videos and links to its settings. */
  get timelapseHome() {
    return this.currentSection?.id === "jobs" && this.currentPage === "/timelapse" && !this.foreignRecord;
  }
  /** The G-code preview: its header names the file, with a way back to Jobs, Open another and Print this. */
  get previewPage() {
    return this.currentSection?.id === "jobs" && this.currentPage === "/preview" && !this.foreignRecord;
  }
  get jobsPath() {
    return scopedPath("/jobs", activeSlug());
  }
  /** The way back from a page that sits under another: the preview to Jobs, Timelapse to History (Jobs, when the printer keeps no history). */
  get back() {
    if (this.previewPage) return { to: this.jobsPath, label: "Jobs" };
    if (this.timelapseHome) {
      if (this.$store.getters["server/componentSupport"]("history")) return { to: scopedPath("/history", activeSlug()), label: "History" };
      return { to: this.jobsPath, label: "Jobs" };
    }
    return null;
  }
  get previewFile() {
    return this.$store.getters["gcodePreview/getFile"];
  }
  get previewSubtitle() {
    const file = this.previewFile;
    if (!file) return "Load what's printing, or open a file";
    const layers = this.$store.getters["gcodePreview/getLayers"]?.length ?? 0;
    const parts = ["G-code preview"];
    if (file.size) parts.push(fileSize(file.size));
    if (layers) parts.push(`${layers.toLocaleString()} ${layers === 1 ? "layer" : "layers"}`);
    const current = this.$store.state.printer.printer.current_file;
    const running = (this.printerPrinting || this.printerPaused) && !!current?.filename && `${current.path}/${current.filename}` === `${file.path}/${file.filename}`;
    if (running) parts.push("showing the running print");
    return parts.join(" \xB7 ");
  }
  get timelapseSubtitle() {
    const entries = this.$store.getters["files/getDirectory"]("timelapse");
    if (!entries) return "";
    const files = entries.filter((e) => e.type === "file");
    const { videos, bytes } = timelapseSummary(files);
    return `${videos} ${videos === 1 ? "video" : "videos"} \xB7 ${fileSize(bytes)} on ${printerNameParts(this.displayName).name}`;
  }
  get pillTone() {
    if (this.foreignStatus) return FOREIGN_STATE_TONES[this.foreignStatus.state];
    const tones = { ok: "ok", active: "run", warn: "warn", fault: "err", off: "off" };
    return tones[this.statusTone] ?? "off";
  }
  onSocketConnected(connected) {
    if (connected) clearHostOff();
  }
  get pillText() {
    if (this.foreignStatus) return FOREIGN_STATE_LABELS[this.foreignStatus.state];
    if (!this.socketConnected) return hostPower.offAt ? "Off" : this.statusText;
    if (!this.klippyReady) return "Not ready";
    return this.$filters.prettyCase(this.printerState || "ready");
  }
  /** A line under the title, for a page that says what it holds. */
  get subtitle() {
    if (this.jobsHome) {
      const files = jobsPage.files;
      const parts = [`${files} ${files === 1 ? "file" : "files"}${jobsPage.printerName ? ` on ${jobsPage.printerName}` : ""}`];
      if (jobsPage.free) parts.push(jobsPage.free);
      if (this.currentSection && this.pagesOf(this.currentSection).some((p) => p.path === "/history" || p.path === "/timelapse")) {
        parts.push("History and Timelapse are in the \xB7\xB7\xB7 menu");
      }
      return parts.join(" \xB7 ");
    }
    if (this.bedPage) return `Mesh and probe for ${printerNameParts(this.displayName).name} \xB7 Maintenance`;
    if (this.maintenancePages && this.currentPage === "/maintenance" && !this.isMobileViewport) {
      return maintenancePage.rows.length ? healthSummary(printerNameParts(this.displayName).name, maintenancePage.rows, maintenancePage.lastRun, Date.now()) : "What keeps prints coming out right. Each check says when it last ran and whether it's due.";
    }
    if (this.currentSection?.id === "control" && this.currentPage === "/control") {
      const name = printerNameParts(this.displayName).name;
      const file = this.$store.state.printer.printer.print_stats?.filename;
      const head = `Move, heat and feed ${name} by hand`;
      if (this.printerPrinting && file) return `${head} \xB7 printing ${jobName(file)}, so axes are locked while it runs`;
      if (this.printerPaused && file) return `${head} \xB7 ${jobName(file)} is paused, so axes are locked`;
      return head;
    }
    if (this.currentPage === "/lighting") return "The M1 light strips \xB7 Left and Right, 40 LEDs each";
    if (this.currentSection?.id === "console") return "Send G-code and read what Klipper says back";
    if (this.timelapseHome && this.$store.getters["server/componentSupport"]("timelapse")) return this.timelapseSubtitle;
    if (this.previewPage) return this.previewSubtitle;
    if (this.chartsHome) {
      const name = printerNameParts(this.displayName).name;
      if (!this.$store.state.config.uiSettings.general.enableDiagnostics) return `Your own charts, from anything ${name} reports`;
      const range = effectiveRange(chartsPage.range, this.$store.getters["charts/getChartRetention"]);
      return `Live diagnostics for ${name} \xB7 last ${rangeText(range)}`;
    }
    if (this.currentSection?.id === "camera") return cameraPage.subtitle;
    if (this.currentSection?.id === "files") return `${printerNameParts(this.displayName).name}'s config and other files \xB7 tap a file to edit it`;
    if (this.isMobileViewport) return "";
    if (this.overviewHome) {
      if (this.foreignRecord) return "";
      const file = this.$store.state.printer.printer.print_stats?.filename;
      const route = cloudState.activePrinterId ? remoteRouteLabel(cloudState.activePrinterId) : networkRouteLabel();
      if ((this.printerPrinting || this.printerPaused) && file) {
        const duration = this.$store.state.printer.printer.print_stats?.total_duration;
        const started = duration ? new Date(Date.now() - duration * 1e3) : null;
        const at = started ? ` \xB7 started ${String(started.getHours()).padStart(2, "0")}:${String(started.getMinutes()).padStart(2, "0")}` : "";
        return `${jobName(file)}${at}`;
      }
      return route;
    }
    if (this.currentPage === "/settings") {
      const section = this.settingsSection;
      return section && section.id !== "general" ? section.blurb : "How Control looks and behaves on this printer";
    }
    if (this.currentPage === "/history") {
      return `Every print ${printerNameParts(this.displayName).name} has made`;
    }
    return "";
  }
  get tabs() {
    if (!this.currentSection || this.currentSection.id === "settings" || this.jobsHome || this.timelapseHome || this.previewPage || this.maintenancePages) return [];
    return this.pagesOf(this.currentSection);
  }
  isOn(page) {
    return pageMatches(this.currentPage, page.path);
  }
};
__decorateClass([
  Watch("socketConnected")
], AppPageTitle.prototype, "onSocketConnected", 1);
AppPageTitle = __decorateClass([
  Component({ components: { FilesActions, ChartsActions, ConsoleActions, CameraActions, JobsActions, TimelapseActions, PreviewActions, ControlActions, OverviewActions, PrinterPageMenu, MaintenanceActions, TonePill } })
], AppPageTitle);
const _sfc_main = AppPageTitle;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("header", { staticClass: "app-page-header", class: { "app-page-header--phone": _vm.isMobileViewport, "app-page-header--jobs": _vm.jobsHome } }, [_c("div", { staticClass: "app-page-header__row" }, [_c("div", { staticClass: "app-page-header__titles" }, [_c("div", { staticClass: "app-page-header__title-row" }, [_vm.back ? _c("router-link", { staticClass: "app-page-header__back", attrs: { "to": _vm.back.to, "aria-label": `Back to ${_vm.back.label}`, "data-tid": "page-back" } }, [_c(__unplugin_components_0, { attrs: { "name": "chevronLeft" } })], 1) : _vm._e(), _vm.bedPage ? _c("router-link", { staticClass: "app-page-header__back", attrs: { "to": _vm.healthTo, "aria-label": "Back to Health", "data-tid": "bed-back" } }, [_c(__unplugin_components_1, { attrs: { "name": "chevronLeft" } })], 1) : _vm._e(), _c("h1", { staticClass: "app-page-header__title", attrs: { "data-tid": "page-title" } }, [_vm.titlePending ? _c("span", { staticClass: "app-page-header__pending", attrs: { "role": "img", "aria-label": "Finding the printer's name", "data-tid": "page-title-pending" } }) : [_vm._v(" " + _vm._s(_vm.title) + " ")]], 2), _vm.overviewHome ? _c("tone-pill", { attrs: { "tone": _vm.pillTone } }, [_vm._v(" " + _vm._s(_vm.pillText) + " ")]) : _vm._e()], 1), _vm.subtitle ? _c("p", { staticClass: "app-page-header__subtitle" }, [_vm._v(" " + _vm._s(_vm.subtitle) + " ")]) : _vm._e()]), _c("div", { staticClass: "app-page-header__actions" }, [_vm.currentSection && _vm.currentSection.id === "control" && !_vm.isMobileViewport ? _c("control-actions") : _vm._e(), _vm.overviewHome && !_vm.foreignRecord && !_vm.isMobileViewport ? _c("overview-actions") : _vm._e(), _vm.overviewHome && !_vm.foreignRecord ? _c("printer-page-menu") : _vm._e(), _vm.jobsHome ? _c("jobs-actions") : _vm._e(), _vm.timelapseHome ? _c("timelapse-actions") : _vm._e(), _vm.previewPage ? _c("preview-actions") : _vm._e(), _vm.maintenancePages ? _c("maintenance-actions", { attrs: { "page": _vm.bedPage ? "bed" : "health" } }) : _vm._e(), _vm.currentSection && _vm.currentSection.id === "console" ? _c("console-actions") : _vm._e(), _vm.currentSection && _vm.currentSection.id === "files" && _vm.isMobileViewport ? _c("files-actions") : _vm._e(), _vm.currentSection && _vm.currentSection.id === "camera" ? _c("camera-actions") : _vm._e(), _vm.settingsSection && _vm.settingsSection.id === "console" && !_vm.isMobileViewport ? _c("router-link", { staticClass: "cbtn cbtn--ghost", attrs: { "to": _vm.consoleTo, "data-tid": "settings-open-console" } }, [_c(__unplugin_components_2, { attrs: { "name": "console", "small": "" } }), _vm._v(" Open Console ")], 1) : _vm._e(), _vm.settingsSection && _vm.settingsSection.id === "files" && !_vm.isMobileViewport ? _c("router-link", { staticClass: "cbtn cbtn--ghost", attrs: { "to": _vm.filesTo, "data-tid": "settings-open-files" } }, [_c(__unplugin_components_3, { attrs: { "name": "files", "small": "" } }), _vm._v(" Open Files ")], 1) : _vm._e(), _vm.settingsSection && _vm.settingsSection.id === "cameras" && !_vm.isMobileViewport ? _c("router-link", { staticClass: "cbtn cbtn--primary", attrs: { "to": _vm.addCameraTo, "data-tid": "settings-add-camera" } }, [_c(__unplugin_components_4, { attrs: { "name": "plus", "small": "" } }), _vm._v(" Add a camera ")], 1) : _vm._e(), _vm.settingsSection && _vm.settingsSection.id === "timelapse" && !_vm.isMobileViewport ? _c("router-link", { staticClass: "cbtn cbtn--ghost", attrs: { "to": _vm.videosTo, "data-tid": "settings-open-videos" } }, [_c(__unplugin_components_5, { attrs: { "name": "clock", "small": "" } }), _vm._v(" Videos ")], 1) : _vm._e(), _vm.chartsHome ? _c("charts-actions") : _vm._e()], 1)]), _vm.tabs.length > 1 ? _c("nav", { staticClass: "app-page-header__tabs", attrs: { "aria-label": `${_vm.title} pages` } }, _vm._l(_vm.tabs, function(page) {
    return _c("router-link", { key: page.path, staticClass: "app-page-header__tab", class: { "app-page-header__tab--on": _vm.isOn(page) }, attrs: { "to": _vm.pageTo(page), "aria-current": _vm.isOn(page) ? "page" : void 0 } }, [_vm._v(" " + _vm._s(page.label) + " ")]);
  }), 1) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/AppPageTitle.vue?vue&type=style&index=0&scoped=f05952c4&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f05952c4",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppPageTitle.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQTRJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQVFBO0FBQUEsRUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBLGdDQUNBLDZEQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyRkFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQ0Esb0hBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFqRkE7QUFBQSxFQURBO0FBQUEsR0E1SUEsYUE2SUE7QUE3SUE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwUGFnZVRpdGxlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxoZWFkZXJcbiAgICBjbGFzcz1cImFwcC1wYWdlLWhlYWRlclwiXG4gICAgOmNsYXNzPVwieyAnYXBwLXBhZ2UtaGVhZGVyLS1waG9uZSc6IGlzTW9iaWxlVmlld3BvcnQsICdhcHAtcGFnZS1oZWFkZXItLWpvYnMnOiBqb2JzSG9tZSB9XCJcbiAgPlxuICAgIDxkaXYgY2xhc3M9XCJhcHAtcGFnZS1oZWFkZXJfX3Jvd1wiPlxuICAgICAgPGRpdiBjbGFzcz1cImFwcC1wYWdlLWhlYWRlcl9fdGl0bGVzXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcHAtcGFnZS1oZWFkZXJfX3RpdGxlLXJvd1wiPlxuICAgICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgICAgdi1pZj1cImJhY2tcIlxuICAgICAgICAgICAgOnRvPVwiYmFjay50b1wiXG4gICAgICAgICAgICBjbGFzcz1cImFwcC1wYWdlLWhlYWRlcl9fYmFja1wiXG4gICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBCYWNrIHRvICR7YmFjay5sYWJlbH1gXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwicGFnZS1iYWNrXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwiY2hldnJvbkxlZnRcIiAvPlxuICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICB2LWlmPVwiYmVkUGFnZVwiXG4gICAgICAgICAgICA6dG89XCJoZWFsdGhUb1wiXG4gICAgICAgICAgICBjbGFzcz1cImFwcC1wYWdlLWhlYWRlcl9fYmFja1wiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiQmFjayB0byBIZWFsdGhcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJiZWQtYmFja1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImNoZXZyb25MZWZ0XCIgLz5cbiAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgIDxoMVxuICAgICAgICAgICAgY2xhc3M9XCJhcHAtcGFnZS1oZWFkZXJfX3RpdGxlXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwicGFnZS10aXRsZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1pZj1cInRpdGxlUGVuZGluZ1wiXG4gICAgICAgICAgICAgIGNsYXNzPVwiYXBwLXBhZ2UtaGVhZGVyX19wZW5kaW5nXCJcbiAgICAgICAgICAgICAgcm9sZT1cImltZ1wiXG4gICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJGaW5kaW5nIHRoZSBwcmludGVyJ3MgbmFtZVwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwicGFnZS10aXRsZS1wZW5kaW5nXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgICAgICAgICB7eyB0aXRsZSB9fVxuICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDx0b25lLXBpbGxcbiAgICAgICAgICAgIHYtaWY9XCJvdmVydmlld0hvbWVcIlxuICAgICAgICAgICAgOnRvbmU9XCJwaWxsVG9uZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgcGlsbFRleHQgfX1cbiAgICAgICAgICA8L3RvbmUtcGlsbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cInN1YnRpdGxlXCJcbiAgICAgICAgICBjbGFzcz1cImFwcC1wYWdlLWhlYWRlcl9fc3VidGl0bGVcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgc3VidGl0bGUgfX1cbiAgICAgICAgPC9wPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiYXBwLXBhZ2UtaGVhZGVyX19hY3Rpb25zXCI+XG4gICAgICAgIDxjb250cm9sLWFjdGlvbnMgdi1pZj1cImN1cnJlbnRTZWN0aW9uICYmIGN1cnJlbnRTZWN0aW9uLmlkID09PSAnY29udHJvbCcgJiYgIWlzTW9iaWxlVmlld3BvcnRcIiAvPlxuICAgICAgICA8b3ZlcnZpZXctYWN0aW9ucyB2LWlmPVwib3ZlcnZpZXdIb21lICYmICFmb3JlaWduUmVjb3JkICYmICFpc01vYmlsZVZpZXdwb3J0XCIgLz5cbiAgICAgICAgPHByaW50ZXItcGFnZS1tZW51IHYtaWY9XCJvdmVydmlld0hvbWUgJiYgIWZvcmVpZ25SZWNvcmRcIiAvPlxuICAgICAgICA8am9icy1hY3Rpb25zIHYtaWY9XCJqb2JzSG9tZVwiIC8+XG4gICAgICAgIDx0aW1lbGFwc2UtYWN0aW9ucyB2LWlmPVwidGltZWxhcHNlSG9tZVwiIC8+XG4gICAgICAgIDxwcmV2aWV3LWFjdGlvbnMgdi1pZj1cInByZXZpZXdQYWdlXCIgLz5cbiAgICAgICAgPG1haW50ZW5hbmNlLWFjdGlvbnNcbiAgICAgICAgICB2LWlmPVwibWFpbnRlbmFuY2VQYWdlc1wiXG4gICAgICAgICAgOnBhZ2U9XCJiZWRQYWdlID8gJ2JlZCcgOiAnaGVhbHRoJ1wiXG4gICAgICAgIC8+XG4gICAgICAgIDxjb25zb2xlLWFjdGlvbnMgdi1pZj1cImN1cnJlbnRTZWN0aW9uICYmIGN1cnJlbnRTZWN0aW9uLmlkID09PSAnY29uc29sZSdcIiAvPlxuICAgICAgICA8ZmlsZXMtYWN0aW9ucyB2LWlmPVwiY3VycmVudFNlY3Rpb24gJiYgY3VycmVudFNlY3Rpb24uaWQgPT09ICdmaWxlcycgJiYgaXNNb2JpbGVWaWV3cG9ydFwiIC8+XG4gICAgICAgIDxjYW1lcmEtYWN0aW9ucyB2LWlmPVwiY3VycmVudFNlY3Rpb24gJiYgY3VycmVudFNlY3Rpb24uaWQgPT09ICdjYW1lcmEnXCIgLz5cbiAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgdi1pZj1cInNldHRpbmdzU2VjdGlvbiAmJiBzZXR0aW5nc1NlY3Rpb24uaWQgPT09ICdjb25zb2xlJyAmJiAhaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgICAgOnRvPVwiY29uc29sZVRvXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dGluZ3Mtb3Blbi1jb25zb2xlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICBuYW1lPVwiY29uc29sZVwiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgICAgT3BlbiBDb25zb2xlXG4gICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgIHYtaWY9XCJzZXR0aW5nc1NlY3Rpb24gJiYgc2V0dGluZ3NTZWN0aW9uLmlkID09PSAnZmlsZXMnICYmICFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgICAgICA6dG89XCJmaWxlc1RvXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dGluZ3Mtb3Blbi1maWxlc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cImZpbGVzXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICBPcGVuIEZpbGVzXG4gICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgIHYtaWY9XCJzZXR0aW5nc1NlY3Rpb24gJiYgc2V0dGluZ3NTZWN0aW9uLmlkID09PSAnY2FtZXJhcycgJiYgIWlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICAgIDp0bz1cImFkZENhbWVyYVRvXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1hZGQtY2FtZXJhXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgICAgQWRkIGEgY2FtZXJhXG4gICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgIHYtaWY9XCJzZXR0aW5nc1NlY3Rpb24gJiYgc2V0dGluZ3NTZWN0aW9uLmlkID09PSAndGltZWxhcHNlJyAmJiAhaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgICAgOnRvPVwidmlkZW9zVG9cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1vcGVuLXZpZGVvc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cImNsb2NrXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICBWaWRlb3NcbiAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPGNoYXJ0cy1hY3Rpb25zIHYtaWY9XCJjaGFydHNIb21lXCIgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxuYXZcbiAgICAgIHYtaWY9XCJ0YWJzLmxlbmd0aCA+IDFcIlxuICAgICAgY2xhc3M9XCJhcHAtcGFnZS1oZWFkZXJfX3RhYnNcIlxuICAgICAgOmFyaWEtbGFiZWw9XCJgJHt0aXRsZX0gcGFnZXNgXCJcbiAgICA+XG4gICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgdi1mb3I9XCJwYWdlIGluIHRhYnNcIlxuICAgICAgICA6a2V5PVwicGFnZS5wYXRoXCJcbiAgICAgICAgOnRvPVwicGFnZVRvKHBhZ2UpXCJcbiAgICAgICAgY2xhc3M9XCJhcHAtcGFnZS1oZWFkZXJfX3RhYlwiXG4gICAgICAgIDpjbGFzcz1cInsgJ2FwcC1wYWdlLWhlYWRlcl9fdGFiLS1vbic6IGlzT24ocGFnZSkgfVwiXG4gICAgICAgIDphcmlhLWN1cnJlbnQ9XCJpc09uKHBhZ2UpID8gJ3BhZ2UnIDogdW5kZWZpbmVkXCJcbiAgICAgID5cbiAgICAgICAge3sgcGFnZS5sYWJlbCB9fVxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L25hdj5cbiAgPC9oZWFkZXI+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBGcmFtZU1peGluIGZyb20gJ0AvbWl4aW5zL2ZyYW1lJ1xuaW1wb3J0IHsgcmVtb3RlUm91dGVMYWJlbCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IGNsZWFySG9zdE9mZiwgaG9zdFBvd2VyIH0gZnJvbSAnQC9zZXJ2aWNlcy9zeXN0ZW0vcmVzdGFydCdcbmltcG9ydCBCcm93c2VyTWl4aW4gZnJvbSAnQC9taXhpbnMvYnJvd3NlcidcbmltcG9ydCB7IHBhZ2VNYXRjaGVzLCB0eXBlIFNlY3Rpb25QYWdlIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclNlY3Rpb25zJ1xuaW1wb3J0IHsgU0VDVElPTl9DT01QT05FTlRTLCBvcGVuU2V0dGluZ3NTZWN0aW9uLCB0eXBlIFNldHRpbmdzU2VjdGlvbiB9IGZyb20gJ0Avc2VydmljZXMvc2V0dGluZ3Mvc2VjdGlvbnMnXG5pbXBvcnQgQ29udHJvbEFjdGlvbnMgZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbEFjdGlvbnMudnVlJ1xuaW1wb3J0IE92ZXJ2aWV3QWN0aW9ucyBmcm9tICdAL2NvbXBvbmVudHMvb3ZlcnZpZXcvT3ZlcnZpZXdBY3Rpb25zLnZ1ZSdcbmltcG9ydCBQcmludGVyUGFnZU1lbnUgZnJvbSAnQC9jb21wb25lbnRzL292ZXJ2aWV3L1ByaW50ZXJQYWdlTWVudS52dWUnXG5pbXBvcnQgTWFpbnRlbmFuY2VBY3Rpb25zIGZyb20gJ0AvY29tcG9uZW50cy9tYWludGVuYW5jZS9NYWludGVuYW5jZUFjdGlvbnMudnVlJ1xuaW1wb3J0IHsgbWFpbnRlbmFuY2VQYWdlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9wYWdlLXN0YXRlJ1xuaW1wb3J0IHsgaGVhbHRoU3VtbWFyeSB9IGZyb20gJ0Avc2VydmljZXMvbWFpbnRlbmFuY2UvaGVhbHRoJ1xuaW1wb3J0IHsgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5pbXBvcnQgQ29uc29sZUFjdGlvbnMgZnJvbSAnQC9jb21wb25lbnRzL2NvbnNvbGUvQ29uc29sZUFjdGlvbnMudnVlJ1xuaW1wb3J0IEZpbGVzQWN0aW9ucyBmcm9tICdAL2NvbXBvbmVudHMvZmlsZXMvRmlsZXNBY3Rpb25zLnZ1ZSdcbmltcG9ydCBDYW1lcmFBY3Rpb25zIGZyb20gJ0AvY29tcG9uZW50cy9jYW1lcmEvQ2FtZXJhQWN0aW9ucy52dWUnXG5pbXBvcnQgeyBjYW1lcmFQYWdlIH0gZnJvbSAnQC9zZXJ2aWNlcy9jYW1lcmEvcGFnZS1zdGF0ZSdcbmltcG9ydCBKb2JzQWN0aW9ucyBmcm9tICdAL2NvbXBvbmVudHMvam9icy9Kb2JzQWN0aW9ucy52dWUnXG5pbXBvcnQgVGltZWxhcHNlQWN0aW9ucyBmcm9tICdAL2NvbXBvbmVudHMvdGltZWxhcHNlL1RpbWVsYXBzZUFjdGlvbnMudnVlJ1xuaW1wb3J0IFByZXZpZXdBY3Rpb25zIGZyb20gJ0AvY29tcG9uZW50cy9nY29kZS1wcmV2aWV3L1ByZXZpZXdBY3Rpb25zLnZ1ZSdcbmltcG9ydCB7IHRpbWVsYXBzZVN1bW1hcnkgfSBmcm9tICdAL3NlcnZpY2VzL3RpbWVsYXBzZS9tb2RlbCdcbmltcG9ydCB7IGZpbGVTaXplIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZywgZm9yZWlnblJlY29yZEZvclNsdWcsIGlzRm9yZWlnblNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgdHlwZSB7IEFwcEZpbGUsIEZpbGVCcm93c2VyRW50cnkgfSBmcm9tICdAL3N0b3JlL2ZpbGVzL3R5cGVzJ1xuaW1wb3J0IENoYXJ0c0FjdGlvbnMgZnJvbSAnQC9jb21wb25lbnRzL2NoYXJ0cy9DaGFydHNBY3Rpb25zLnZ1ZSdcbmltcG9ydCB7IGNoYXJ0c1BhZ2UgfSBmcm9tICdAL3NlcnZpY2VzL2NoYXJ0cy9wYWdlLXN0YXRlJ1xuaW1wb3J0IHsgZWZmZWN0aXZlUmFuZ2UsIHJhbmdlVGV4dCB9IGZyb20gJ0Avc2VydmljZXMvY2hhcnRzL21vZGVsJ1xuaW1wb3J0IHsgam9ic1BhZ2UgfSBmcm9tICdAL3NlcnZpY2VzL2pvYnMvcGFnZS1zdGF0ZSdcbmltcG9ydCBUb25lUGlsbCBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvVG9uZVBpbGwudnVlJ1xuaW1wb3J0IFByaW50ZXJTdGF0dXNNaXhpbiBmcm9tICdAL21peGlucy9wcmludGVyLXN0YXR1cydcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBuZXR3b3JrUm91dGVMYWJlbCB9IGZyb20gJ0Avc2VydmljZXMvaG90c3BvdC9tb2RlbCdcbmltcG9ydCB7IGpvYk5hbWUgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXJzLXBhZ2UvbW9kZWwnXG5pbXBvcnQgeyBwcmludGVyTmFtZVBhcnRzIH0gZnJvbSAnQC91dGlsL3ByaW50ZXItbmFtZSdcbmltcG9ydCB0eXBlIHsgVGlsZVRvbmUgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXJzLXBhZ2UvbW9kZWwnXG5pbXBvcnQgeyBsaXZlRm9yZWlnbiB9IGZyb20gJ0Avc2VydmljZXMvZm9yZWlnbi1wcmludGVycy9saXZlJ1xuaW1wb3J0IHsgZW1wdHlTdGF0dXMgfSBmcm9tICdAL3NlcnZpY2VzL2ZvcmVpZ24tcHJpbnRlcnMvYWRhcHRlcnMvYmFzZSdcbmltcG9ydCB7IEZPUkVJR05fU1RBVEVfTEFCRUxTLCBGT1JFSUdOX1NUQVRFX1RPTkVTLCB0eXBlIEZvcmVpZ25TdGF0dXMgfSBmcm9tICdAL3NlcnZpY2VzL2ZvcmVpZ24tcHJpbnRlcnMvdHlwZXMnXG5cbi8qKlxuICogQSBwcmludGVyIHBhZ2UncyB0aXRsZSBvbiB0aGUgbGVmdCBhbmQgaXRzIG93biBhY3Rpb25zIG9uIHRoZSByaWdodCxcbiAqIHdpdGggdGhlIHNlY3Rpb24ncyBwYWdlcyBhcyB0YWJzIHVuZGVyIGl0IChKb2JzOiBKb2JzLCBQcmV2aWV3LCBIaXN0b3J5LFxuICogVGltZWxhcHNlKS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgRmlsZXNBY3Rpb25zLCBDaGFydHNBY3Rpb25zLCBDb25zb2xlQWN0aW9ucywgQ2FtZXJhQWN0aW9ucywgSm9ic0FjdGlvbnMsIFRpbWVsYXBzZUFjdGlvbnMsIFByZXZpZXdBY3Rpb25zLCBDb250cm9sQWN0aW9ucywgT3ZlcnZpZXdBY3Rpb25zLCBQcmludGVyUGFnZU1lbnUsIE1haW50ZW5hbmNlQWN0aW9ucywgVG9uZVBpbGwgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwUGFnZVRpdGxlIGV4dGVuZHMgTWl4aW5zKEZyYW1lTWl4aW4sIEJyb3dzZXJNaXhpbiwgUHJpbnRlclN0YXR1c01peGluKSB7XG4gIGdldCBmb3JlaWduUmVjb3JkICgpIHtcbiAgICBjb25zdCBzbHVnID0gdGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXJcbiAgICByZXR1cm4gaXNGb3JlaWduU2x1ZyhzbHVnKSA/IGZvcmVpZ25SZWNvcmRGb3JTbHVnKHNsdWcpIDogdW5kZWZpbmVkXG4gIH1cblxuICBnZXQgZm9yZWlnblN0YXR1cyAoKTogRm9yZWlnblN0YXR1cyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmZvcmVpZ25SZWNvcmRcbiAgICAgID8gbGl2ZUZvcmVpZ24uc3RhdHVzW3RoaXMuZm9yZWlnblJlY29yZC5pZF0gPz8gZW1wdHlTdGF0dXMoKVxuICAgICAgOiBudWxsXG4gIH1cblxuICAvKiogT3ZlcnZpZXcgaXMgdGhlIHByaW50ZXIncyBvd24gcGFnZTogaXQgaXMgbmFtZWQgYnkgdGhlIHByaW50ZXIsIHdpdGggaXRzIHN0YXRlIGJlc2lkZSBpdC4gKi9cbiAgZ2V0IG92ZXJ2aWV3SG9tZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnb3ZlcnZpZXcnICYmIHRoaXMuY3VycmVudFBhZ2UgPT09ICcvJ1xuICB9XG5cbiAgLyoqIENoYXJ0cywgdW5kZXIgT3ZlcnZpZXc6IHRoZSBzaGFyZWQgdGltZSByYW5nZSBhbmQgQWRkIGNoYXJ0IHNpdCBpbiBpdHMgaGVhZGVyLiAqL1xuICBnZXQgY2hhcnRzSG9tZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFBhZ2UgPT09ICcvZGlhZ25vc3RpY3MnICYmICF0aGlzLmZvcmVpZ25SZWNvcmRcbiAgfVxuXG4gIC8qKiBPdmVydmlldyBpcyB0aXRsZWQgd2l0aCB0aGUgcHJpbnRlcidzIG5hbWU6IGEgcGxhY2Vob2xkZXIgdW50aWwgaXQgaXMga25vd24gKEtBTi0yMjU3KS4gKi9cbiAgZ2V0IHRpdGxlUGVuZGluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcnZpZXdIb21lICYmICF0aGlzLmZvcmVpZ25SZWNvcmQgJiYgdGhpcy5uYW1lV2FpdGluZ1xuICB9XG5cbiAgZ2V0IHRpdGxlICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmNoYXJ0c0hvbWUpIHJldHVybiAnQ2hhcnRzJ1xuICAgIGlmICh0aGlzLm92ZXJ2aWV3SG9tZSkgcmV0dXJuIHRoaXMuZm9yZWlnblJlY29yZD8ubmFtZSA/PyB0aGlzLnNob3duTmFtZVxuICAgIGlmICh0aGlzLnByZXZpZXdQYWdlKSByZXR1cm4gdGhpcy5wcmV2aWV3RmlsZT8uZmlsZW5hbWUucmVwbGFjZSgvXFwuZyhjb2RlKT8kL2ksICcnKSB8fCAnRy1jb2RlIHByZXZpZXcnXG4gICAgaWYgKHRoaXMudGltZWxhcHNlSG9tZSkgcmV0dXJuICdUaW1lbGFwc2UnXG4gICAgLy8gU2V0dGluZ3MgbGlzdHMgaXRzIG93biBzZWN0aW9uczsgV2ktRmkgYW5kIFN5c3RlbSBhcmUgbmFtZWQgZm9yIHRoZW1zZWx2ZXMuXG4gICAgaWYgKHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnc2V0dGluZ3MnKSB7XG4gICAgICBjb25zdCBwYWdlID0gdGhpcy5jdXJyZW50U2VjdGlvbi5wYWdlcy5maW5kKHAgPT4gcC5wYXRoICE9PSAnL3NldHRpbmdzJyAmJiB0aGlzLmlzT24ocCkpXG4gICAgICBpZiAocGFnZSkgcmV0dXJuIHBhZ2UubGFiZWxcbiAgICB9XG4gICAgaWYgKHRoaXMubWFpbnRlbmFuY2VQYWdlcykgcmV0dXJuIHRoaXMuYmVkUGFnZSA/ICdCZWQnIDogJ0hlYWx0aCdcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5zZXR0aW5nc1NlY3Rpb25cbiAgICBpZiAoc2VjdGlvbiAmJiAhKHNlY3Rpb24uaWQgPT09ICdnZW5lcmFsJyAmJiAhdGhpcy5pc01vYmlsZVZpZXdwb3J0KSkgcmV0dXJuIHNlY3Rpb24ubGFiZWxcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50U2VjdGlvbj8ubGFiZWwgPz8gdGhpcy4kcm91dGUubmFtZSA/PyAnJ1xuICB9XG5cbiAgLyoqIFNldHRpbmdzJyBvcGVuIHNlY3Rpb24sIGJ5IHRoZSBhZGRyZXNzJ3MgYW5jaG9yOiBpdCBuYW1lcyB0aGUgcGFnZSwgYXMgYSBzZWN0aW9uJ3Mgb3duIGhlYWRlciBkb2VzLiAqL1xuICBnZXQgc2V0dGluZ3NTZWN0aW9uICgpOiBTZXR0aW5nc1NlY3Rpb24gfCBudWxsIHtcbiAgICBpZiAodGhpcy5jdXJyZW50U2VjdGlvbj8uaWQgIT09ICdzZXR0aW5ncycgfHwgdGhpcy5jdXJyZW50UGFnZSAhPT0gJy9zZXR0aW5ncycpIHJldHVybiBudWxsXG4gICAgY29uc3Qgc3VwcG9ydHMgPSAobmFtZTogc3RyaW5nKSA9PiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKG5hbWUpIGFzIGJvb2xlYW5cbiAgICByZXR1cm4gb3BlblNldHRpbmdzU2VjdGlvbih0aGlzLiRyb3V0ZS5oYXNoLCB7IGNvbXBvbmVudHM6IFNFQ1RJT05fQ09NUE9ORU5UUy5maWx0ZXIoc3VwcG9ydHMpIH0pXG4gIH1cblxuICAvKiogTWFpbnRlbmFuY2UncyB0d28gcGFnZXMgYXJlIG5hbWVkIGZvciB0aGVtc2VsdmVzOiBIZWFsdGgsIGFuZCBCZWQgd2l0aCBhIHdheSBiYWNrIHRvIEhlYWx0aC4gKi9cbiAgZ2V0IG1haW50ZW5hbmNlUGFnZXMgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRTZWN0aW9uPy5pZCA9PT0gJ21haW50ZW5hbmNlJyAmJiAhdGhpcy5mb3JlaWduUmVjb3JkXG4gIH1cblxuICBnZXQgYmVkUGFnZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubWFpbnRlbmFuY2VQYWdlcyAmJiB0aGlzLmN1cnJlbnRQYWdlID09PSAnL3R1bmUnXG4gIH1cblxuICBnZXQgaGVhbHRoVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy9tYWludGVuYW5jZScsIGFjdGl2ZVNsdWcoKSlcbiAgfVxuXG4gIGdldCBjb25zb2xlVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy9jb25zb2xlJywgYWN0aXZlU2x1ZygpKVxuICB9XG5cbiAgZ2V0IGFkZENhbWVyYVRvICgpOiB7IHBhdGg6IHN0cmluZywgaGFzaDogc3RyaW5nLCBxdWVyeTogeyBhZGQ6IHN0cmluZyB9IH0ge1xuICAgIHJldHVybiB7IHBhdGg6IHNjb3BlZFBhdGgoJy9zZXR0aW5ncycsIGFjdGl2ZVNsdWcoKSksIGhhc2g6ICcjY2FtZXJhJywgcXVlcnk6IHsgYWRkOiAnMScgfSB9XG4gIH1cblxuICBnZXQgdmlkZW9zVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy90aW1lbGFwc2UnLCBhY3RpdmVTbHVnKCkpXG4gIH1cblxuICBnZXQgZmlsZXNUbyAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2NvcGVkUGF0aCgnL2NvbmZpZ3VyZScsIGFjdGl2ZVNsdWcoKSlcbiAgfVxuXG4gIC8qKiBKb2JzJyBvd24gcGFnZTogaXRzIGhlYWRlciBjYXJyaWVzIHRoZSBzZWFyY2gsIHRoZSBvcmRlciBhbmQgVXBsb2FkLCBhbmQgSGlzdG9yeSBhbmQgVGltZWxhcHNlIHNpdCBpbiBpdHMgwrfCt8K3IG1lbnUuICovXG4gIGdldCBqb2JzSG9tZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnam9icycgJiYgdGhpcy5jdXJyZW50UGFnZSA9PT0gJy9qb2JzJyAmJiAhdGhpcy5mb3JlaWduUmVjb3JkXG4gIH1cblxuICAvKiogVGltZWxhcHNlIGlzIGEgcGFnZSB0byB3YXRjaDogaXRzIGhlYWRlciBjb3VudHMgdGhlIHZpZGVvcyBhbmQgbGlua3MgdG8gaXRzIHNldHRpbmdzLiAqL1xuICBnZXQgdGltZWxhcHNlSG9tZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnam9icycgJiYgdGhpcy5jdXJyZW50UGFnZSA9PT0gJy90aW1lbGFwc2UnICYmICF0aGlzLmZvcmVpZ25SZWNvcmRcbiAgfVxuXG4gIC8qKiBUaGUgRy1jb2RlIHByZXZpZXc6IGl0cyBoZWFkZXIgbmFtZXMgdGhlIGZpbGUsIHdpdGggYSB3YXkgYmFjayB0byBKb2JzLCBPcGVuIGFub3RoZXIgYW5kIFByaW50IHRoaXMuICovXG4gIGdldCBwcmV2aWV3UGFnZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnam9icycgJiYgdGhpcy5jdXJyZW50UGFnZSA9PT0gJy9wcmV2aWV3JyAmJiAhdGhpcy5mb3JlaWduUmVjb3JkXG4gIH1cblxuICBnZXQgam9ic1BhdGggKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy9qb2JzJywgYWN0aXZlU2x1ZygpKVxuICB9XG5cbiAgLyoqIFRoZSB3YXkgYmFjayBmcm9tIGEgcGFnZSB0aGF0IHNpdHMgdW5kZXIgYW5vdGhlcjogdGhlIHByZXZpZXcgdG8gSm9icywgVGltZWxhcHNlIHRvIEhpc3RvcnkgKEpvYnMsIHdoZW4gdGhlIHByaW50ZXIga2VlcHMgbm8gaGlzdG9yeSkuICovXG4gIGdldCBiYWNrICgpOiB7IHRvOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcgfSB8IG51bGwge1xuICAgIGlmICh0aGlzLnByZXZpZXdQYWdlKSByZXR1cm4geyB0bzogdGhpcy5qb2JzUGF0aCwgbGFiZWw6ICdKb2JzJyB9XG4gICAgaWYgKHRoaXMudGltZWxhcHNlSG9tZSkge1xuICAgICAgaWYgKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9jb21wb25lbnRTdXBwb3J0J10oJ2hpc3RvcnknKSkgcmV0dXJuIHsgdG86IHNjb3BlZFBhdGgoJy9oaXN0b3J5JywgYWN0aXZlU2x1ZygpKSwgbGFiZWw6ICdIaXN0b3J5JyB9XG4gICAgICByZXR1cm4geyB0bzogdGhpcy5qb2JzUGF0aCwgbGFiZWw6ICdKb2JzJyB9XG4gICAgfVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBnZXQgcHJldmlld0ZpbGUgKCk6IEFwcEZpbGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydnY29kZVByZXZpZXcvZ2V0RmlsZSddIGFzIEFwcEZpbGUgfCB1bmRlZmluZWRcbiAgfVxuXG4gIGdldCBwcmV2aWV3U3VidGl0bGUgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMucHJldmlld0ZpbGVcbiAgICBpZiAoIWZpbGUpIHJldHVybiBcIkxvYWQgd2hhdCdzIHByaW50aW5nLCBvciBvcGVuIGEgZmlsZVwiXG4gICAgY29uc3QgbGF5ZXJzID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2djb2RlUHJldmlldy9nZXRMYXllcnMnXSBhcyB1bmtub3duW10gfCB1bmRlZmluZWQpPy5sZW5ndGggPz8gMFxuICAgIGNvbnN0IHBhcnRzID0gWydHLWNvZGUgcHJldmlldyddXG4gICAgaWYgKGZpbGUuc2l6ZSkgcGFydHMucHVzaChmaWxlU2l6ZShmaWxlLnNpemUpKVxuICAgIGlmIChsYXllcnMpIHBhcnRzLnB1c2goYCR7bGF5ZXJzLnRvTG9jYWxlU3RyaW5nKCl9ICR7bGF5ZXJzID09PSAxID8gJ2xheWVyJyA6ICdsYXllcnMnfWApXG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5jdXJyZW50X2ZpbGUgYXMgQXBwRmlsZSB8IHVuZGVmaW5lZFxuICAgIGNvbnN0IHJ1bm5pbmcgPSAodGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkKSAmJiAhIWN1cnJlbnQ/LmZpbGVuYW1lICYmXG4gICAgICBgJHtjdXJyZW50LnBhdGh9LyR7Y3VycmVudC5maWxlbmFtZX1gID09PSBgJHtmaWxlLnBhdGh9LyR7ZmlsZS5maWxlbmFtZX1gXG4gICAgaWYgKHJ1bm5pbmcpIHBhcnRzLnB1c2goJ3Nob3dpbmcgdGhlIHJ1bm5pbmcgcHJpbnQnKVxuICAgIHJldHVybiBwYXJ0cy5qb2luKCcgwrcgJylcbiAgfVxuXG4gIGdldCB0aW1lbGFwc2VTdWJ0aXRsZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlbnRyaWVzID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snZmlsZXMvZ2V0RGlyZWN0b3J5J10oJ3RpbWVsYXBzZScpIGFzIEZpbGVCcm93c2VyRW50cnlbXSB8IHVuZGVmaW5lZFxuICAgIGlmICghZW50cmllcykgcmV0dXJuICcnXG4gICAgY29uc3QgZmlsZXMgPSBlbnRyaWVzLmZpbHRlcigoZSk6IGUgaXMgQXBwRmlsZSA9PiBlLnR5cGUgPT09ICdmaWxlJylcbiAgICBjb25zdCB7IHZpZGVvcywgYnl0ZXMgfSA9IHRpbWVsYXBzZVN1bW1hcnkoZmlsZXMpXG4gICAgcmV0dXJuIGAke3ZpZGVvc30gJHt2aWRlb3MgPT09IDEgPyAndmlkZW8nIDogJ3ZpZGVvcyd9IMK3ICR7ZmlsZVNpemUoYnl0ZXMpfSBvbiAke3ByaW50ZXJOYW1lUGFydHModGhpcy5kaXNwbGF5TmFtZSkubmFtZX1gXG4gIH1cblxuICBnZXQgcGlsbFRvbmUgKCk6IFRpbGVUb25lIHtcbiAgICBpZiAodGhpcy5mb3JlaWduU3RhdHVzKSByZXR1cm4gRk9SRUlHTl9TVEFURV9UT05FU1t0aGlzLmZvcmVpZ25TdGF0dXMuc3RhdGVdXG4gICAgY29uc3QgdG9uZXM6IFJlY29yZDxzdHJpbmcsIFRpbGVUb25lPiA9IHsgb2s6ICdvaycsIGFjdGl2ZTogJ3J1bicsIHdhcm46ICd3YXJuJywgZmF1bHQ6ICdlcnInLCBvZmY6ICdvZmYnIH1cbiAgICByZXR1cm4gdG9uZXNbdGhpcy5zdGF0dXNUb25lXSA/PyAnb2ZmJ1xuICB9XG5cbiAgQFdhdGNoKCdzb2NrZXRDb25uZWN0ZWQnKVxuICBvblNvY2tldENvbm5lY3RlZCAoY29ubmVjdGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGNvbm5lY3RlZCkgY2xlYXJIb3N0T2ZmKClcbiAgfVxuXG4gIGdldCBwaWxsVGV4dCAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5mb3JlaWduU3RhdHVzKSByZXR1cm4gRk9SRUlHTl9TVEFURV9MQUJFTFNbdGhpcy5mb3JlaWduU3RhdHVzLnN0YXRlXVxuICAgIC8vIFNodXQgZG93biBmcm9tIFN5c3RlbTogaXQgaXMgb2ZmLCBub3QgbG9zdC5cbiAgICBpZiAoIXRoaXMuc29ja2V0Q29ubmVjdGVkKSByZXR1cm4gaG9zdFBvd2VyLm9mZkF0ID8gJ09mZicgOiB0aGlzLnN0YXR1c1RleHRcbiAgICBpZiAoIXRoaXMua2xpcHB5UmVhZHkpIHJldHVybiAnTm90IHJlYWR5J1xuICAgIHJldHVybiB0aGlzLiRmaWx0ZXJzLnByZXR0eUNhc2UodGhpcy5wcmludGVyU3RhdGUgfHwgJ3JlYWR5JylcbiAgfVxuXG4gIC8qKiBBIGxpbmUgdW5kZXIgdGhlIHRpdGxlLCBmb3IgYSBwYWdlIHRoYXQgc2F5cyB3aGF0IGl0IGhvbGRzLiAqL1xuICBnZXQgc3VidGl0bGUgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuam9ic0hvbWUpIHtcbiAgICAgIGNvbnN0IGZpbGVzID0gam9ic1BhZ2UuZmlsZXNcbiAgICAgIGNvbnN0IHBhcnRzID0gW2Ake2ZpbGVzfSAke2ZpbGVzID09PSAxID8gJ2ZpbGUnIDogJ2ZpbGVzJ30ke2pvYnNQYWdlLnByaW50ZXJOYW1lID8gYCBvbiAke2pvYnNQYWdlLnByaW50ZXJOYW1lfWAgOiAnJ31gXVxuICAgICAgaWYgKGpvYnNQYWdlLmZyZWUpIHBhcnRzLnB1c2goam9ic1BhZ2UuZnJlZSlcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRTZWN0aW9uICYmIHRoaXMucGFnZXNPZih0aGlzLmN1cnJlbnRTZWN0aW9uKS5zb21lKHAgPT4gcC5wYXRoID09PSAnL2hpc3RvcnknIHx8IHAucGF0aCA9PT0gJy90aW1lbGFwc2UnKSkge1xuICAgICAgICBwYXJ0cy5wdXNoKCdIaXN0b3J5IGFuZCBUaW1lbGFwc2UgYXJlIGluIHRoZSDCt8K3wrcgbWVudScpXG4gICAgICB9XG4gICAgICByZXR1cm4gcGFydHMuam9pbignIMK3ICcpXG4gICAgfVxuICAgIGlmICh0aGlzLmJlZFBhZ2UpIHJldHVybiBgTWVzaCBhbmQgcHJvYmUgZm9yICR7cHJpbnRlck5hbWVQYXJ0cyh0aGlzLmRpc3BsYXlOYW1lKS5uYW1lfSDCtyBNYWludGVuYW5jZWBcbiAgICBpZiAodGhpcy5tYWludGVuYW5jZVBhZ2VzICYmIHRoaXMuY3VycmVudFBhZ2UgPT09ICcvbWFpbnRlbmFuY2UnICYmICF0aGlzLmlzTW9iaWxlVmlld3BvcnQpIHtcbiAgICAgIHJldHVybiBtYWludGVuYW5jZVBhZ2Uucm93cy5sZW5ndGhcbiAgICAgICAgPyBoZWFsdGhTdW1tYXJ5KHByaW50ZXJOYW1lUGFydHModGhpcy5kaXNwbGF5TmFtZSkubmFtZSwgbWFpbnRlbmFuY2VQYWdlLnJvd3MsIG1haW50ZW5hbmNlUGFnZS5sYXN0UnVuLCBEYXRlLm5vdygpKVxuICAgICAgICA6IFwiV2hhdCBrZWVwcyBwcmludHMgY29taW5nIG91dCByaWdodC4gRWFjaCBjaGVjayBzYXlzIHdoZW4gaXQgbGFzdCByYW4gYW5kIHdoZXRoZXIgaXQncyBkdWUuXCJcbiAgICB9XG4gICAgaWYgKHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnY29udHJvbCcgJiYgdGhpcy5jdXJyZW50UGFnZSA9PT0gJy9jb250cm9sJykge1xuICAgICAgY29uc3QgbmFtZSA9IHByaW50ZXJOYW1lUGFydHModGhpcy5kaXNwbGF5TmFtZSkubmFtZVxuICAgICAgY29uc3QgZmlsZSA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wcmludF9zdGF0cz8uZmlsZW5hbWUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgICBjb25zdCBoZWFkID0gYE1vdmUsIGhlYXQgYW5kIGZlZWQgJHtuYW1lfSBieSBoYW5kYFxuICAgICAgaWYgKHRoaXMucHJpbnRlclByaW50aW5nICYmIGZpbGUpIHJldHVybiBgJHtoZWFkfSDCtyBwcmludGluZyAke2pvYk5hbWUoZmlsZSl9LCBzbyBheGVzIGFyZSBsb2NrZWQgd2hpbGUgaXQgcnVuc2BcbiAgICAgIGlmICh0aGlzLnByaW50ZXJQYXVzZWQgJiYgZmlsZSkgcmV0dXJuIGAke2hlYWR9IMK3ICR7am9iTmFtZShmaWxlKX0gaXMgcGF1c2VkLCBzbyBheGVzIGFyZSBsb2NrZWRgXG4gICAgICByZXR1cm4gaGVhZFxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJyZW50UGFnZSA9PT0gJy9saWdodGluZycpIHJldHVybiAnVGhlIE0xIGxpZ2h0IHN0cmlwcyDCtyBMZWZ0IGFuZCBSaWdodCwgNDAgTEVEcyBlYWNoJ1xuICAgIGlmICh0aGlzLmN1cnJlbnRTZWN0aW9uPy5pZCA9PT0gJ2NvbnNvbGUnKSByZXR1cm4gJ1NlbmQgRy1jb2RlIGFuZCByZWFkIHdoYXQgS2xpcHBlciBzYXlzIGJhY2snXG4gICAgaWYgKHRoaXMudGltZWxhcHNlSG9tZSAmJiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKCd0aW1lbGFwc2UnKSkgcmV0dXJuIHRoaXMudGltZWxhcHNlU3VidGl0bGVcbiAgICBpZiAodGhpcy5wcmV2aWV3UGFnZSkgcmV0dXJuIHRoaXMucHJldmlld1N1YnRpdGxlXG4gICAgaWYgKHRoaXMuY2hhcnRzSG9tZSkge1xuICAgICAgY29uc3QgbmFtZSA9IHByaW50ZXJOYW1lUGFydHModGhpcy5kaXNwbGF5TmFtZSkubmFtZVxuICAgICAgaWYgKCF0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmVuYWJsZURpYWdub3N0aWNzKSByZXR1cm4gYFlvdXIgb3duIGNoYXJ0cywgZnJvbSBhbnl0aGluZyAke25hbWV9IHJlcG9ydHNgXG4gICAgICBjb25zdCByYW5nZSA9IGVmZmVjdGl2ZVJhbmdlKGNoYXJ0c1BhZ2UucmFuZ2UsIHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NoYXJ0cy9nZXRDaGFydFJldGVudGlvbiddIGFzIG51bWJlcilcbiAgICAgIHJldHVybiBgTGl2ZSBkaWFnbm9zdGljcyBmb3IgJHtuYW1lfSDCtyBsYXN0ICR7cmFuZ2VUZXh0KHJhbmdlKX1gXG4gICAgfVxuICAgIGlmICh0aGlzLmN1cnJlbnRTZWN0aW9uPy5pZCA9PT0gJ2NhbWVyYScpIHJldHVybiBjYW1lcmFQYWdlLnN1YnRpdGxlXG4gICAgaWYgKHRoaXMuY3VycmVudFNlY3Rpb24/LmlkID09PSAnZmlsZXMnKSByZXR1cm4gYCR7cHJpbnRlck5hbWVQYXJ0cyh0aGlzLmRpc3BsYXlOYW1lKS5uYW1lfSdzIGNvbmZpZyBhbmQgb3RoZXIgZmlsZXMgwrcgdGFwIGEgZmlsZSB0byBlZGl0IGl0YFxuICAgIGlmICh0aGlzLmlzTW9iaWxlVmlld3BvcnQpIHJldHVybiAnJ1xuICAgIGlmICh0aGlzLm92ZXJ2aWV3SG9tZSkge1xuICAgICAgaWYgKHRoaXMuZm9yZWlnblJlY29yZCkgcmV0dXJuICcnXG4gICAgICBjb25zdCBmaWxlID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLnByaW50X3N0YXRzPy5maWxlbmFtZSBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgIGNvbnN0IHJvdXRlID0gY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgPyByZW1vdGVSb3V0ZUxhYmVsKGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkKSA6IG5ldHdvcmtSb3V0ZUxhYmVsKClcbiAgICAgIGlmICgodGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkKSAmJiBmaWxlKSB7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLnByaW50X3N0YXRzPy50b3RhbF9kdXJhdGlvbiBhcyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICAgICAgY29uc3Qgc3RhcnRlZCA9IGR1cmF0aW9uID8gbmV3IERhdGUoRGF0ZS5ub3coKSAtIGR1cmF0aW9uICogMTAwMCkgOiBudWxsXG4gICAgICAgIGNvbnN0IGF0ID0gc3RhcnRlZCA/IGAgwrcgc3RhcnRlZCAke1N0cmluZyhzdGFydGVkLmdldEhvdXJzKCkpLnBhZFN0YXJ0KDIsICcwJyl9OiR7U3RyaW5nKHN0YXJ0ZWQuZ2V0TWludXRlcygpKS5wYWRTdGFydCgyLCAnMCcpfWAgOiAnJ1xuICAgICAgICByZXR1cm4gYCR7am9iTmFtZShmaWxlKX0ke2F0fWBcbiAgICAgIH1cbiAgICAgIHJldHVybiByb3V0ZVxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJyZW50UGFnZSA9PT0gJy9zZXR0aW5ncycpIHtcbiAgICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLnNldHRpbmdzU2VjdGlvblxuICAgICAgcmV0dXJuIHNlY3Rpb24gJiYgc2VjdGlvbi5pZCAhPT0gJ2dlbmVyYWwnID8gc2VjdGlvbi5ibHVyYiA6ICdIb3cgQ29udHJvbCBsb29rcyBhbmQgYmVoYXZlcyBvbiB0aGlzIHByaW50ZXInXG4gICAgfVxuICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlID09PSAnL2hpc3RvcnknKSB7XG4gICAgICByZXR1cm4gYEV2ZXJ5IHByaW50ICR7cHJpbnRlck5hbWVQYXJ0cyh0aGlzLmRpc3BsYXlOYW1lKS5uYW1lfSBoYXMgbWFkZWBcbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBnZXQgdGFicyAoKTogU2VjdGlvblBhZ2VbXSB7XG4gICAgLy8gVGltZWxhcHNlIGFuZCB0aGUgcHJldmlldyBhcmUgcGFnZXMgb2YgdGhlaXIgb3duOiB0aGUgcHJldmlldyBnb2VzIGJhY2sgdG8gSm9icywgVGltZWxhcHNlIHRvIEhpc3RvcnksIGFuZCBib3RoIGFyZSBpbiBKb2JzJyDCt8K3wrcgbWVudS5cbiAgICBpZiAoIXRoaXMuY3VycmVudFNlY3Rpb24gfHwgdGhpcy5jdXJyZW50U2VjdGlvbi5pZCA9PT0gJ3NldHRpbmdzJyB8fCB0aGlzLmpvYnNIb21lIHx8IHRoaXMudGltZWxhcHNlSG9tZSB8fCB0aGlzLnByZXZpZXdQYWdlIHx8IHRoaXMubWFpbnRlbmFuY2VQYWdlcykgcmV0dXJuIFtdXG4gICAgcmV0dXJuIHRoaXMucGFnZXNPZih0aGlzLmN1cnJlbnRTZWN0aW9uKVxuICB9XG5cbiAgaXNPbiAocGFnZTogU2VjdGlvblBhZ2UpOiBib29sZWFuIHtcbiAgICByZXR1cm4gcGFnZU1hdGNoZXModGhpcy5jdXJyZW50UGFnZSwgcGFnZS5wYXRoKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAvLyBUaGUgcHJpbnRlcidzIG5hbWUsIHdoaWxlIGl0IGlzbid0IGtub3duOiBhIGRyYXduIGxpbmUgdGhlIGhlaWdodCBvZiB0aGVcbiAgLy8gdGl0bGUsIHdpdGggdGhlIGxvYWRpbmcgc2hlZW4gKHRyYW5zZm9ybSBvbmx5KS5cbiAgLmFwcC1wYWdlLWhlYWRlcl9fcGVuZGluZyB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB3aWR0aDogN2VtO1xuICAgIG1heC13aWR0aDogNjB2dztcbiAgICBoZWlnaHQ6IDAuNjJlbTtcbiAgICBib3JkZXItcmFkaXVzOiAwLjMxZW07XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1maWxsLCByZ2IoMTI4IDEyOCAxMjggLyAyMCUpKTtcblxuICAgICY6OmFmdGVyIHtcbiAgICAgIGNvbnRlbnQ6ICcnO1xuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgaW5zZXQ6IDA7XG4gICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoOTBkZWcsIHRyYW5zcGFyZW50IDIwJSwgcmdiKDI1NSAyNTUgMjU1IC8gMTQlKSA1MCUsIHRyYW5zcGFyZW50IDgwJSk7XG4gICAgICBhbmltYXRpb246IGFwcC1wYWdlLWhlYWRlci1zaGVlbiAxLjRzIHZhcigtLW0zZC1lYXNlLXN0YW5kYXJkLCBlYXNlKSBpbmZpbml0ZTtcbiAgICB9XG4gIH1cblxuICBAa2V5ZnJhbWVzIGFwcC1wYWdlLWhlYWRlci1zaGVlbiB7XG4gICAgZnJvbSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7IH1cbiAgICB0byB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMDAlKTsgfVxuICB9XG5cbiAgLmFwcC1wYWdlLWhlYWRlcl9fYmFjayB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiAzNnB4O1xuICAgIGhlaWdodDogMzZweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmFwcC1wYWdlLWhlYWRlciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTRweDtcbiAgICBwYWRkaW5nOiA0cHggNHB4IDIwcHg7XG4gIH1cblxuICAuYXBwLXBhZ2UtaGVhZGVyX19yb3cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgZ2FwOiAxMnB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5hcHAtcGFnZS1oZWFkZXJfX3RpdGxlcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogNnB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5hcHAtcGFnZS1oZWFkZXJfX3RpdGxlLXJvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuYXBwLXBhZ2UtaGVhZGVyX19iYWNrIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGZsZXg6IG5vbmU7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogNDBweDtcbiAgICBoZWlnaHQ6IDQwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgfVxuXG4gIC5hcHAtcGFnZS1oZWFkZXJfX3N1YnRpdGxlIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAuYXBwLXBhZ2UtaGVhZGVyX190aXRsZSB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtdGl0bGUsIHZhcigtLW0zZC1mb250LXNhbnMpKTtcbiAgICBmb250LXNpemU6IDI4cHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICBsaW5lLWhlaWdodDogMS4xO1xuICAgIGxldHRlci1zcGFjaW5nOiAtMC4wMTVlbTtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLmFwcC1wYWdlLWhlYWRlcl9fYWN0aW9ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAuYXBwLXBhZ2UtaGVhZGVyX190YWJzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGdhcDogMnB4O1xuICAgIGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7XG4gICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgIHBhZGRpbmc6IDNweDtcbiAgICBvdmVyZmxvdy14OiBhdXRvO1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgc2Nyb2xsYmFyLXdpZHRoOiBub25lO1xuICB9XG5cbiAgLmFwcC1wYWdlLWhlYWRlcl9fdGFiIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgaGVpZ2h0OiAzNHB4O1xuICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiA5cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuXG4gICAgJjpob3ZlciB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpICFpbXBvcnRhbnQ7XG4gICAgfVxuICB9XG5cbiAgLmFwcC1wYWdlLWhlYWRlcl9fdGFiLS1vbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtc3Ryb25nLCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZykpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgfVxuXG4gIC8vIEpvYnM6IHRoZSBoZWFkZXIgaG9sZHMgYSB0b29sYmFyLiBPbiBhIGRlc2t0b3AgaXQgc3RheXMgYmVzaWRlIHRoZSB0aXRsZSxcbiAgLy8gc28gcGlja2luZyBhIGZpbGUgbmV2ZXIgbW92ZXMgdGhlIGxpc3Q7IG9uIGEgcGhvbmUgaXQgZ29lcyB1bmRlciB0aGUgdGl0bGUuXG4gIC5hcHAtcGFnZS1oZWFkZXItLWpvYnMgLmFwcC1wYWdlLWhlYWRlcl9fYWN0aW9ucyB7XG4gICAgZmxleDogMSAxIDA7XG4gICAgZmxleC13cmFwOiBub3dyYXA7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuYXBwLXBhZ2UtaGVhZGVyLS1qb2JzOm5vdCguYXBwLXBhZ2UtaGVhZGVyLS1waG9uZSkgLmFwcC1wYWdlLWhlYWRlcl9fc3VidGl0bGUge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5hcHAtcGFnZS1oZWFkZXItLWpvYnMuYXBwLXBhZ2UtaGVhZGVyLS1waG9uZSAuYXBwLXBhZ2UtaGVhZGVyX19yb3cge1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgfVxuXG4gIC5hcHAtcGFnZS1oZWFkZXItLWpvYnMuYXBwLXBhZ2UtaGVhZGVyLS1waG9uZSAuYXBwLXBhZ2UtaGVhZGVyX19hY3Rpb25zIHtcbiAgICBmbGV4LWJhc2lzOiAxMDAlO1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gIH1cblxuICAuYXBwLXBhZ2UtaGVhZGVyLS1waG9uZSB7XG4gICAgZ2FwOiAxMnB4O1xuXG4gICAgLmFwcC1wYWdlLWhlYWRlcl9fcm93IHtcbiAgICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIH1cblxuICAgIHBhZGRpbmc6IDRweCA0cHggMTRweDtcblxuICAgIC5hcHAtcGFnZS1oZWFkZXJfX3RpdGxlIHtcbiAgICAgIGZvbnQtc2l6ZTogMzBweDtcbiAgICB9XG5cbiAgICAuYXBwLXBhZ2UtaGVhZGVyX190YWIge1xuICAgICAgaGVpZ2h0OiAzNnB4O1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9BcHBQYWdlVGl0bGUudnVlIn0=