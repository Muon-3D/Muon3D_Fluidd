/* unplugin-vue-components disabled */import __unplugin_components_7 from "/src/components/ui/M3Dialog.vue";
import { VCombobox as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSelect as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VAutocomplete as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSelect as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSelect as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins, Ref } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { SupportedLocales, DateFormats } from "/src/globals.ts";
import { httpClientActions } from "/src/api/httpClientActions.ts";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { printerNameParts } from "/src/util/printer-name.ts";
import { cloneDeep, merge } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import { readFileAsTextAsync } from "/src/util/file-system-entry.ts";
import { EventBus } from "/src/eventBus.ts";
import { isFluiddContent, toFluiddContent } from "/src/util/fluidd-content.ts";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { slugify } from "/src/services/printer-pages/slug.ts";
import {
  ACCENTS,
  accentFor,
  copyFileName,
  etaChoiceOf,
  etaStoredFor,
  modelLine,
  progressChoiceOf,
  progressStoredFor,
  restoreChanges,
  serialFromIdentity,
  systemPrefersDark,
  themeModeOf
} from "/src/services/settings/general.ts";
let GeneralSettings = class extends Mixins(StateMixin) {
  accents = ACCENTS;
  serial = null;
  restore = null;
  restoring = false;
  modeOptions = [
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "auto", label: "Auto" }
  ];
  timeOptions = [
    { value: "hours24", label: "24-hour" },
    { value: "hours12", label: "12-hour" }
  ];
  progressOptions = [
    { value: "file", label: "File" },
    { value: "layers", label: "Layers" },
    { value: "slicer", label: "Slicer" }
  ];
  etaOptions = [
    { value: "slicer", label: "Slicer" },
    { value: "file", label: "File" },
    { value: "average", label: "Average" }
  ];
  instanceNameElement;
  uploadSettingsFile;
  mounted() {
    this.loadSerial();
    this.loadZone();
  }
  zone = null;
  zoneShown = false;
  zoneError = "";
  zoneSaving = false;
  zoneKey = 0;
  get zones() {
    let all = [];
    try {
      all = Intl.supportedValuesOf?.("timeZone") ?? [];
    } catch {
    }
    if (!all.includes("UTC")) all = ["UTC", ...all];
    return this.zone && !all.includes(this.zone) ? [this.zone, ...all] : all;
  }
  /** A printer without the route (404) shows no row at all, not a broken one. */
  async loadZone() {
    if (this.$store.getters["server/isMuonPrinter"] !== true) return;
    try {
      const response = await httpClientActions.serverMuonTimezoneGet();
      const data = response.data;
      const zone = data?.result?.zone ?? data?.zone;
      this.zone = typeof zone === "string" ? zone : null;
      this.zoneShown = true;
    } catch {
      this.zoneShown = false;
    }
  }
  async setZone(value) {
    this.zoneError = "";
    this.zoneSaving = true;
    try {
      await httpClientActions.serverMuonTimezonePost(value);
      this.zone = value;
    } catch (e) {
      const res = e.response;
      if (res?.status === 404) {
        this.zoneShown = false;
        return;
      }
      const data = res?.data;
      const why = typeof data === "string" ? data : typeof data?.error === "string" ? data.error : data?.error?.message;
      this.zoneError = `${this.printerName} did not accept that time zone${why ? `: ${why.replace(/\.$/, "")}.` : "."} Nothing changed.`;
      this.zoneKey++;
    } finally {
      this.zoneSaving = false;
    }
  }
  async loadSerial() {
    if (!this.$store.getters["server/isMuonPrinter"]) return;
    try {
      const response = await httpClientActions.serverMuonIdentityGet();
      this.serial = serialFromIdentity(response.data);
    } catch {
      this.serial = null;
    }
  }
  get general() {
    return this.$store.state.config.uiSettings.general;
  }
  get theme() {
    return this.$store.state.config.uiSettings.theme;
  }
  savePersonal(path, value) {
    return this.$store.dispatch("config/savePersonal", { path, value });
  }
  saveGeneral(key, value) {
    return this.$store.dispatch("config/saveByPath", { path: `uiSettings.general.${key}`, value, server: true });
  }
  get instanceName() {
    return this.general.instanceName;
  }
  /** The printer as the top bar names it. */
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"] ?? "").name || "this printer";
  }
  nameKey = 0;
  nameError = "";
  renaming = false;
  /**
   * On a Muon printer the name is the printer's own (its identity, which the
   * panel, the phone app and every other Control read), so it is written
   * there first; Control's own label follows once the printer has it. If the
   * printer refuses, nothing changes and the refusal is shown here.
   */
  async setInstanceName(value) {
    if (!this.instanceNameElement.valid) return;
    const name = value.trim();
    this.nameError = "";
    if (this.$store.getters["server/isMuonPrinter"] === true) {
      this.renaming = true;
      try {
        await httpClientActions.serverMuonIdentityNamePost(name);
      } catch (e) {
        const data = e.response?.data;
        const why = typeof data === "string" ? data : typeof data?.error === "string" ? data.error : data?.error?.message;
        this.nameError = `${this.printerName} did not accept the new name${why ? `: ${why.replace(/\.$/, "")}.` : "."} Nothing changed.`;
        this.nameKey++;
        return;
      } finally {
        this.renaming = false;
      }
    }
    this.$store.dispatch("config/updateInstance", name);
  }
  get model() {
    return modelLine(this.$store.getters["server/isMuonPrinter"], this.serial);
  }
  get settingsPath() {
    return scopedPath("/settings", activeSlug());
  }
  get accentOn() {
    return accentFor(this.theme.color)?.color ?? null;
  }
  setAccent(color) {
    this.savePersonal("theme.color", color);
  }
  get mode() {
    return themeModeOf(this.theme);
  }
  async setMode(mode) {
    await this.savePersonal("theme.mode", mode);
    await this.savePersonal("theme.isDark", mode === "auto" ? systemPrefersDark() : mode === "dark");
  }
  get locale() {
    return this.general.locale;
  }
  get supportedLocales() {
    return [
      { name: "Same as this device", code: "default" },
      ...SupportedLocales
    ];
  }
  setLocale(value) {
    this.$store.dispatch("config/onLocaleChange", value);
  }
  get dateFormat() {
    return this.general.dateFormat;
  }
  set dateFormat(value) {
    this.saveGeneral("dateFormat", value);
  }
  get availableDateFormats() {
    const date = /* @__PURE__ */ new Date();
    return Object.entries(DateFormats).map(([key, entry]) => ({
      value: key,
      text: `${date.toLocaleDateString(entry.locales ?? this.$filters.getAllLocales(), entry.options)}${entry.suffix ?? ""}`
    }));
  }
  get timeFormat() {
    return this.general.timeFormat;
  }
  set timeFormat(value) {
    this.saveGeneral("timeFormat", value);
  }
  /** ISO times are 24-hour too: it stays ISO until someone picks. */
  get timeChoice() {
    return this.timeFormat === "hours12" ? "hours12" : "hours24";
  }
  get enableKeyboardShortcuts() {
    return this.general.enableKeyboardShortcuts;
  }
  set enableKeyboardShortcuts(value) {
    this.saveGeneral("enableKeyboardShortcuts", value);
  }
  get confirmOnEstop() {
    return !!this.general.confirmOnEstop;
  }
  async setConfirmOnEstop(value) {
    if (value) {
      const sure = await this.$confirm(
        `Every emergency stop you start on ${this.printerName} will ask first, so it takes a second press. Anyone else here keeps their own setting.`,
        { title: "E-STOP will need two presses", buttonTrueText: "Ask first", buttonFalseText: "Keep one press" }
      );
      if (!sure) return;
    }
    this.savePersonal("general.confirmOnEstop", value);
  }
  get confirmOnSaveConfigAndRestart() {
    return !!this.general.confirmOnSaveConfigAndRestart;
  }
  get confirmOnPowerDeviceChange() {
    return !!this.general.confirmOnPowerDeviceChange;
  }
  get showUploadAndPrint() {
    return !!this.general.showUploadAndPrint;
  }
  get hasPowerDevices() {
    return (this.$store.getters["power/getDevices"] ?? []).length > 0;
  }
  get progressChoice() {
    return progressChoiceOf(this.general.printProgressCalculation);
  }
  setProgress(choice) {
    this.saveGeneral("printProgressCalculation", progressStoredFor(choice));
  }
  get etaChoice() {
    return etaChoiceOf(this.general.printEtaCalculation);
  }
  setEta(choice) {
    this.saveGeneral("printEtaCalculation", etaStoredFor(choice));
  }
  get topNavPowerToggle() {
    return this.general.topNavPowerToggle;
  }
  set topNavPowerToggle(value) {
    this.saveGeneral("topNavPowerToggle", value);
  }
  get powerDevicesList() {
    const devices = this.$store.getters["power/getDevices"] ?? [];
    const deviceEntries = devices.length ? [
      { header: "Moonraker" },
      ...devices.map((device) => ({ text: device.device, value: device.device }))
    ] : [];
    const pins = this.$store.getters["printer/getPins"] ?? [];
    const pinEntries = pins.length ? [
      { header: "Klipper" },
      ...pins.map((outputPin) => ({ text: outputPin.prettyName, value: `${outputPin.name}:klipper` }))
    ] : [];
    return [
      ...deviceEntries,
      ...pinEntries
    ];
  }
  get sectionsToIgnorePendingConfigurationChanges() {
    return this.general.sectionsToIgnorePendingConfigurationChanges;
  }
  set sectionsToIgnorePendingConfigurationChanges(value) {
    this.saveGeneral("sectionsToIgnorePendingConfigurationChanges", [...new Set(value)].sort((a, b) => a.localeCompare(b)));
  }
  get enableDiagnostics() {
    return this.general.enableDiagnostics;
  }
  set enableDiagnostics(value) {
    this.saveGeneral("enableDiagnostics", value);
  }
  async currentSettings() {
    const response = await httpClientActions.serverDatabaseItemGet("fluidd");
    const value = response.data?.result?.value;
    return value && typeof value === "object" ? value : null;
  }
  /** What is in effect now: the saved settings over the defaults this page shows. */
  async diffBase() {
    const saved = await this.currentSettings() ?? {};
    return { ...saved, uiSettings: merge(cloneDeep(this.$store.state.config.uiSettings), saved.uiSettings ?? {}) };
  }
  async handleBackupSettings() {
    try {
      const data = await this.currentSettings();
      if (data) {
        const backupDataAsString = JSON.stringify(toFluiddContent("settings-backup", data));
        const link = document.createElement("a");
        link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(backupDataAsString)}`;
        link.download = copyFileName(slugify(this.printerName));
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      consola.error("[Settings] backup failed", e);
      EventBus.$emit(this.$t("app.general.msg.fluidd_settings_backup_failed").toString(), { type: "error" });
    }
  }
  async handleRestoreSettings() {
    try {
      const file = this.uploadSettingsFile?.files?.length === 1 ? this.uploadSettingsFile.files[0] : null;
      if (!file) return;
      const backupDataAsString = await readFileAsTextAsync(file);
      if (!backupDataAsString) return;
      const backupData = JSON.parse(backupDataAsString);
      if (!isFluiddContent("settings-backup", backupData) || !backupData.data || typeof backupData.data !== "object") {
        EventBus.$emit(this.$t("app.general.msg.not_valid_fluidd_backup_file").toString(), { type: "error" });
        return;
      }
      const data = backupData.data;
      const ui = data.uiSettings;
      const from = typeof ui?.general?.instanceName === "string" ? ui.general.instanceName : null;
      this.restore = {
        fileName: file.name,
        from,
        data,
        changes: restoreChanges(await this.diffBase(), data)
      };
    } catch (e) {
      consola.error("[Settings] restore failed", e);
      EventBus.$emit(this.$t("app.general.msg.fluidd_settings_restore_failed").toString(), { type: "error" });
    } finally {
      this.uploadSettingsFile.value = "";
    }
  }
  cancelRestore() {
    if (!this.restoring) this.restore = null;
  }
  async applyRestore() {
    if (!this.restore) return;
    this.restoring = true;
    try {
      for (const key in this.restore.data) {
        await httpClientActions.serverDatabaseItemPost("fluidd", key, this.restore.data[key]);
      }
      window.location.reload();
    } catch (e) {
      consola.error("[Settings] restore failed", e);
      this.restoring = false;
      EventBus.$emit(this.$t("app.general.msg.fluidd_settings_restore_failed").toString(), { type: "error" });
    }
  }
};
__decorateClass([
  Ref("instanceName")
], GeneralSettings.prototype, "instanceNameElement", 2);
__decorateClass([
  Ref("uploadSettingsFile")
], GeneralSettings.prototype, "uploadSettingsFile", 2);
GeneralSettings = __decorateClass([
  Component({
    components: { ToggleSwitch, SegPicker, M3Dialog }
  })
], GeneralSettings);
const _sfc_main = GeneralSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs", attrs: { "id": "general", "data-tid": "general-settings" } }, [_c("h2", { staticClass: "gs__gt" }, [_vm._v(" This printer ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_vm._m(0), _c("div", { staticClass: "gs__ctl gs__ctl--wide" }, [_c(__unplugin_components_0, { key: _vm.nameKey, ref: "instanceName", attrs: { "outlined": "", "dense": "", "single-line": "", "hide-details": "auto", "rules": [_vm.$rules.required], "error-messages": _vm.nameError, "disabled": _vm.renaming, "value": _vm.instanceName, "default-value": _vm.$globals.APP_NAME, "aria-label": "Name", "data-tid": "setting-name" }, on: { "change": _vm.setInstanceName } })], 1)]), _c("div", { staticClass: "gs__row" }, [_vm._m(1), _c("span", { staticClass: "gs__v", attrs: { "data-tid": "setting-model" } }, [_vm._v(_vm._s(_vm.model))])])]), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" Look ")]), _c("div", { staticClass: "gs__list", attrs: { "id": "theme", "data-tid": "theme-settings" } }, [_c("div", { staticClass: "gs__row" }, [_vm._m(2), _c("div", { staticClass: "gs__swatches", attrs: { "role": "radiogroup", "aria-label": "Accent colour" } }, _vm._l(_vm.accents, function(accent) {
    return _c("button", { key: accent.color, staticClass: "gs__swatch", class: { "gs__swatch--on": _vm.accentOn === accent.color }, style: { background: accent.color }, attrs: { "type": "button", "role": "radio", "aria-label": accent.name, "aria-checked": _vm.accentOn === accent.color ? "true" : "false", "data-tid": `accent-${accent.name.toLowerCase()}` }, on: { "click": function($event) {
      return _vm.setAccent(accent.color);
    } } });
  }), 0)]), _c("div", { staticClass: "gs__row" }, [_vm._m(3), _c("seg-picker", { attrs: { "options": _vm.modeOptions, "value": _vm.mode, "label": "Light or dark", "data-tid": "setting-theme-mode" }, on: { "input": _vm.setMode } })], 1)]), _c("p", { staticClass: "gs__gh" }, [_vm._v(" These are yours on this printer: someone else on " + _vm._s(_vm.printerName) + " keeps their own. ")]), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" Language and time ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_vm._m(4), _c("div", { staticClass: "gs__ctl gs__ctl--wide" }, [_c(__unplugin_components_1, { attrs: { "outlined": "", "dense": "", "hide-details": "", "item-value": "code", "item-text": "name", "aria-label": "Language", "items": _vm.supportedLocales, "value": _vm.locale }, on: { "change": _vm.setLocale } })], 1)]), _c("div", { staticClass: "gs__row" }, [_vm._m(5), _c("div", { staticClass: "gs__ctl gs__ctl--wide" }, [_c(__unplugin_components_2, { attrs: { "outlined": "", "dense": "", "hide-details": "", "aria-label": "Dates", "items": _vm.availableDateFormats }, model: { value: _vm.dateFormat, callback: function($$v) {
    _vm.dateFormat = $$v;
  }, expression: "dateFormat" } })], 1)]), _c("div", { staticClass: "gs__row" }, [_vm._m(6), _c("seg-picker", { attrs: { "options": _vm.timeOptions, "value": _vm.timeChoice, "label": "Times", "data-tid": "setting-times" }, on: { "input": function($event) {
    _vm.timeFormat = String($event);
  } } })], 1), _vm.zoneShown ? _c("div", { staticClass: "gs__row", attrs: { "data-tid": "setting-timezone" } }, [_vm._m(7), _c("div", { staticClass: "gs__ctl gs__ctl--wide" }, [_c(__unplugin_components_3, { key: _vm.zoneKey, attrs: { "outlined": "", "dense": "", "hide-details": "auto", "aria-label": "Time zone", "data-tid": "setting-timezone-select", "items": _vm.zones, "value": _vm.zone, "disabled": _vm.zoneSaving, "error-messages": _vm.zoneError }, on: { "change": _vm.setZone } })], 1)]) : _vm._e()]), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" Ask before ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Emergency stop ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Off: one press stops " + _vm._s(_vm.printerName) + " at once. On: it asks first. ")])]), _c("toggle-switch", { attrs: { "value": _vm.confirmOnEstop, "label": "Emergency stop" }, on: { "input": _vm.setConfirmOnEstop } })], 1), _c("div", { staticClass: "gs__row" }, [_vm._m(8), _c("toggle-switch", { attrs: { "value": _vm.confirmOnSaveConfigAndRestart, "label": "Saving the configuration" }, on: { "input": function($event) {
    return _vm.savePersonal("general.confirmOnSaveConfigAndRestart", $event);
  } } })], 1), _vm.hasPowerDevices ? _c("div", { staticClass: "gs__row", attrs: { "data-tid": "setting-ask-power" } }, [_vm._m(9), _c("toggle-switch", { attrs: { "value": _vm.confirmOnPowerDeviceChange, "label": "Turning off a power switch" }, on: { "input": function($event) {
    return _vm.savePersonal("general.confirmOnPowerDeviceChange", $event);
  } } })], 1) : _vm._e(), _c("div", { staticClass: "gs__row" }, [_vm._m(10), _c("toggle-switch", { attrs: { "value": _vm.showUploadAndPrint, "label": "Printing straight after upload" }, on: { "input": function($event) {
    return _vm.savePersonal("general.showUploadAndPrint", $event);
  } } })], 1)]), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" Overview and the top bar ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_vm._m(11), _c("seg-picker", { attrs: { "options": _vm.progressOptions, "value": _vm.progressChoice, "label": "Progress is measured by", "data-tid": "setting-progress" }, on: { "input": _vm.setProgress } })], 1), _c("div", { staticClass: "gs__row" }, [_vm._m(12), _c("seg-picker", { attrs: { "options": _vm.etaOptions, "value": _vm.etaChoice, "label": "Time left comes from", "data-tid": "setting-eta" }, on: { "input": _vm.setEta } })], 1), _vm.powerDevicesList.length ? _c("div", { staticClass: "gs__row" }, [_vm._m(13), _c("div", { staticClass: "gs__ctl gs__ctl--wide" }, [_c(__unplugin_components_4, { attrs: { "outlined": "", "dense": "", "hide-details": "", "aria-label": "Power switch in the printer chip", "items": [{ text: "None", value: null }, ..._vm.powerDevicesList] }, model: { value: _vm.topNavPowerToggle, callback: function($$v) {
    _vm.topNavPowerToggle = $$v;
  }, expression: "topNavPowerToggle" } })], 1)]) : _vm._e()]), _c("router-link", { staticClass: "gs__xl", attrs: { "to": { path: _vm.settingsPath, hash: "#gcodePreview" }, "data-tid": "setting-link-gcode-preview" } }, [_c(__unplugin_components_5, { staticClass: "gs__xl-ic", attrs: { "small": "" } }, [_vm._v(" $printer3d ")]), _c("span", { staticClass: "gs__grow" }, [_vm._v("The "), _c("b", [_vm._v("3D printer model")]), _vm._v(" and the "), _c("b", [_vm._v("camera on Overview")]), _vm._v(" are set in G-code preview and 3D.")]), _c("span", { staticClass: "gs__go" }, [_vm._v("Open \u203A")])], 1), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" Keyboard ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_vm._m(14), _c("toggle-switch", { attrs: { "value": _vm.enableKeyboardShortcuts, "label": "Shortcuts" }, on: { "input": function($event) {
    _vm.enableKeyboardShortcuts = $event;
  } } })], 1)]), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" These settings ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Save a copy ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" All of your Control settings for " + _vm._s(_vm.printerName) + ", as one file. ")])]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "settings-save-copy" }, on: { "click": _vm.handleBackupSettings } }, [_vm._v(" Save ")])]), _c("div", { staticClass: "gs__row" }, [_vm._m(15), _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "settings-restore-copy" }, on: { "click": function($event) {
    return _vm.uploadSettingsFile.click();
  } } }, [_vm._v(" Choose file\u2026 ")])])]), _c("h2", { staticClass: "gs__gt" }, [_vm._v(" More ")]), _c("div", { staticClass: "gs__list" }, [_c("div", { staticClass: "gs__row" }, [_vm._m(16), _c("div", { staticClass: "gs__ctl gs__ctl--wide" }, [_c(__unplugin_components_6, { attrs: { "items": ["bed_mesh default", "bed_tilt"], "multiple": "", "small-chips": "", "deletable-chips": "", "outlined": "", "dense": "", "hide-details": "", "append-icon": "", "aria-label": "Changes not to list" }, model: { value: _vm.sectionsToIgnorePendingConfigurationChanges, callback: function($$v) {
    _vm.sectionsToIgnorePendingConfigurationChanges = $$v;
  }, expression: "sectionsToIgnorePendingConfigurationChanges" } })], 1)]), _c("div", { staticClass: "gs__row" }, [_vm._m(17), _c("toggle-switch", { attrs: { "value": _vm.enableDiagnostics, "label": "Charts page" }, on: { "input": function($event) {
    _vm.enableDiagnostics = $event;
  } } })], 1)]), _c("input", { ref: "uploadSettingsFile", staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".json", "data-tid": "settings-restore-file" }, on: { "change": _vm.handleRestoreSettings } }), _c(__unplugin_components_7, { attrs: { "value": !!_vm.restore, "eyebrow": "Restore", "title": "Restore these settings?", "max-width": "460", "data-tid": "settings-restore-dialog" }, on: { "input": function($event) {
    !$event && _vm.cancelRestore();
  }, "close": _vm.cancelRestore }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "settings-restore-cancel" }, on: { "click": _vm.cancelRestore } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": _vm.restoring, "data-tid": "settings-restore-apply" }, on: { "click": _vm.applyRestore } }, [_vm._v(" Restore ")])];
  }, proxy: true }]) }, [_vm.restore ? [_c("p", { staticClass: "gs__sub" }, [_vm._v(" " + _vm._s(_vm.restore.fileName)), _vm.restore.from ? [_vm._v(" \xB7 saved from " + _vm._s(_vm.restore.from) + " ")] : _vm._e()], 2), _vm.restore.from && _vm.restore.from !== _vm.instanceName ? _c("p", { staticClass: "gs__warn", attrs: { "data-tid": "settings-restore-other" } }, [_vm._v(" This copy is from " + _vm._s(_vm.restore.from) + ", not " + _vm._s(_vm.printerName) + ". It can still be restored here. ")]) : _vm._e(), _c("div", { staticClass: "gs__list gs__list--sheet" }, [_vm._l(_vm.restore.changes, function(change) {
    return _c("div", { key: change.label, staticClass: "gs__row", attrs: { "data-tid": "settings-restore-change" } }, [_c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" " + _vm._s(change.label) + " ")])]), _c("span", { staticClass: "gs__v" }, [_vm._v(_vm._s(change.value))])]);
  }), _c("div", { staticClass: "gs__row" }, [_c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" " + _vm._s(_vm.restore.changes.length ? "Everything else" : "Everything") + " ")])]), _c("span", { staticClass: "gs__v" }, [_vm._v("Same")])])], 2)] : _vm._e()], 2)], 1);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Name ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Shown in the top bar, on the printer's screen and to everyone it's shared with. Changing it here renames the printer itself, over any route. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Model ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Read from the printer. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Accent colour ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Buttons, switches and highlights. Glass is the only look. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Light or dark ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Auto follows this device. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Language ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Dates ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Times ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Time zone ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" The printer's own clock, used for its screen and job times. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Saving the configuration ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Saving restarts the firmware, so it asks. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Turning off a power switch ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" It asks before one of the printer's power switches turns off, or on. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Printing straight after upload ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" On: Upload & print is in the top bar, and checks the plate before it starts. Off: there's only Upload. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Progress is measured by ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" File position is steady; layers jump. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Time left comes from ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Power switch in the printer chip ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Shortcuts ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" G then a letter to jump to a page; Ctrl K to search. Hold ? to see them all. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Restore from a copy ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Shows what will change before it does. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Changes not to list ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Sections whose saved results Save doesn't show, such as the bed mesh. ")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "gs__grow" }, [_c("div", { staticClass: "gs__t" }, [_vm._v(" Charts page ")]), _c("div", { staticClass: "gs__s" }, [_vm._v(" Records how busy each board is, for Charts. Uses a little more of the printer. ")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/GeneralSettings.vue?vue&type=style&index=0&scoped=3c40fcfe&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3c40fcfe",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/GeneralSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK2dCQTtBQUNBO0FBRUE7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE9BRUE7QUFZQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUEsdUNBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQSwyQ0FDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQSxJQUNBO0FBRUE7QUFDQSxxQ0FDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQSxJQUNBO0FBRUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBRUE7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFFQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBcFlBO0FBQUEsRUFEQTtBQUFBLEdBN0JBLGdCQThCQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBaENBLGdCQWlDQTtBQWpDQTtBQUFBLEVBSEE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkdlbmVyYWxTZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgaWQ9XCJnZW5lcmFsXCJcbiAgICBjbGFzcz1cImdzXCJcbiAgICBkYXRhLXRpZD1cImdlbmVyYWwtc2V0dGluZ3NcIlxuICA+XG4gICAgPGgyIGNsYXNzPVwiZ3NfX2d0XCI+XG4gICAgICBUaGlzIHByaW50ZXJcbiAgICA8L2gyPlxuICAgIDxkaXYgY2xhc3M9XCJnc19fbGlzdFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImdzX19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBOYW1lXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX19zXCI+XG4gICAgICAgICAgICBTaG93biBpbiB0aGUgdG9wIGJhciwgb24gdGhlIHByaW50ZXIncyBzY3JlZW4gYW5kIHRvIGV2ZXJ5b25lIGl0J3Mgc2hhcmVkIHdpdGguIENoYW5naW5nIGl0IGhlcmUgcmVuYW1lcyB0aGUgcHJpbnRlciBpdHNlbGYsIG92ZXIgYW55IHJvdXRlLlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19jdGwgZ3NfX2N0bC0td2lkZVwiPlxuICAgICAgICAgIDx2LXRleHQtZmllbGRcbiAgICAgICAgICAgIHJlZj1cImluc3RhbmNlTmFtZVwiXG4gICAgICAgICAgICA6a2V5PVwibmFtZUtleVwiXG4gICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgIHNpbmdsZS1saW5lXG4gICAgICAgICAgICBoaWRlLWRldGFpbHM9XCJhdXRvXCJcbiAgICAgICAgICAgIDpydWxlcz1cIlskcnVsZXMucmVxdWlyZWRdXCJcbiAgICAgICAgICAgIDplcnJvci1tZXNzYWdlcz1cIm5hbWVFcnJvclwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJyZW5hbWluZ1wiXG4gICAgICAgICAgICA6dmFsdWU9XCJpbnN0YW5jZU5hbWVcIlxuICAgICAgICAgICAgOmRlZmF1bHQtdmFsdWU9XCIkZ2xvYmFscy5BUFBfTkFNRVwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiTmFtZVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmctbmFtZVwiXG4gICAgICAgICAgICBAY2hhbmdlPVwic2V0SW5zdGFuY2VOYW1lXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdzX19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBNb2RlbFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fc1wiPlxuICAgICAgICAgICAgUmVhZCBmcm9tIHRoZSBwcmludGVyLlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBjbGFzcz1cImdzX192XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmctbW9kZWxcIlxuICAgICAgICA+e3sgbW9kZWwgfX08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxoMiBjbGFzcz1cImdzX19ndFwiPlxuICAgICAgTG9va1xuICAgIDwvaDI+XG4gICAgPGRpdlxuICAgICAgaWQ9XCJ0aGVtZVwiXG4gICAgICBjbGFzcz1cImdzX19saXN0XCJcbiAgICAgIGRhdGEtdGlkPVwidGhlbWUtc2V0dGluZ3NcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJnc19fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgQWNjZW50IGNvbG91clxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fc1wiPlxuICAgICAgICAgICAgQnV0dG9ucywgc3dpdGNoZXMgYW5kIGhpZ2hsaWdodHMuIEdsYXNzIGlzIHRoZSBvbmx5IGxvb2suXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJnc19fc3dhdGNoZXNcIlxuICAgICAgICAgIHJvbGU9XCJyYWRpb2dyb3VwXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiQWNjZW50IGNvbG91clwiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cImFjY2VudCBpbiBhY2NlbnRzXCJcbiAgICAgICAgICAgIDprZXk9XCJhY2NlbnQuY29sb3JcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICByb2xlPVwicmFkaW9cIlxuICAgICAgICAgICAgY2xhc3M9XCJnc19fc3dhdGNoXCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ2dzX19zd2F0Y2gtLW9uJzogYWNjZW50T24gPT09IGFjY2VudC5jb2xvciB9XCJcbiAgICAgICAgICAgIDpzdHlsZT1cInsgYmFja2dyb3VuZDogYWNjZW50LmNvbG9yIH1cIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJhY2NlbnQubmFtZVwiXG4gICAgICAgICAgICA6YXJpYS1jaGVja2VkPVwiYWNjZW50T24gPT09IGFjY2VudC5jb2xvciA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYGFjY2VudC0ke2FjY2VudC5uYW1lLnRvTG93ZXJDYXNlKCl9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJzZXRBY2NlbnQoYWNjZW50LmNvbG9yKVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJnc19fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgTGlnaHQgb3IgZGFya1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fc1wiPlxuICAgICAgICAgICAgQXV0byBmb2xsb3dzIHRoaXMgZGV2aWNlLlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNlZy1waWNrZXJcbiAgICAgICAgICA6b3B0aW9ucz1cIm1vZGVPcHRpb25zXCJcbiAgICAgICAgICA6dmFsdWU9XCJtb2RlXCJcbiAgICAgICAgICBsYWJlbD1cIkxpZ2h0IG9yIGRhcmtcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dGluZy10aGVtZS1tb2RlXCJcbiAgICAgICAgICBAaW5wdXQ9XCJzZXRNb2RlXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxwIGNsYXNzPVwiZ3NfX2doXCI+XG4gICAgICBUaGVzZSBhcmUgeW91cnMgb24gdGhpcyBwcmludGVyOiBzb21lb25lIGVsc2Ugb24ge3sgcHJpbnRlck5hbWUgfX0ga2VlcHMgdGhlaXIgb3duLlxuICAgIDwvcD5cblxuICAgIDxoMiBjbGFzcz1cImdzX19ndFwiPlxuICAgICAgTGFuZ3VhZ2UgYW5kIHRpbWVcbiAgICA8L2gyPlxuICAgIDxkaXYgY2xhc3M9XCJnc19fbGlzdFwiPlxuICAgICAgPGRpdiBjbGFzcz1cImdzX19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBMYW5ndWFnZVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19jdGwgZ3NfX2N0bC0td2lkZVwiPlxuICAgICAgICAgIDx2LXNlbGVjdFxuICAgICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgICAgIGl0ZW0tdmFsdWU9XCJjb2RlXCJcbiAgICAgICAgICAgIGl0ZW0tdGV4dD1cIm5hbWVcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkxhbmd1YWdlXCJcbiAgICAgICAgICAgIDppdGVtcz1cInN1cHBvcnRlZExvY2FsZXNcIlxuICAgICAgICAgICAgOnZhbHVlPVwibG9jYWxlXCJcbiAgICAgICAgICAgIEBjaGFuZ2U9XCJzZXRMb2NhbGVcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX2dyb3dcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3RcIj5cbiAgICAgICAgICAgIERhdGVzXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX2N0bCBnc19fY3RsLS13aWRlXCI+XG4gICAgICAgICAgPHYtc2VsZWN0XG4gICAgICAgICAgICB2LW1vZGVsPVwiZGF0ZUZvcm1hdFwiXG4gICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkRhdGVzXCJcbiAgICAgICAgICAgIDppdGVtcz1cImF2YWlsYWJsZURhdGVGb3JtYXRzXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdzX19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBUaW1lc1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNlZy1waWNrZXJcbiAgICAgICAgICA6b3B0aW9ucz1cInRpbWVPcHRpb25zXCJcbiAgICAgICAgICA6dmFsdWU9XCJ0aW1lQ2hvaWNlXCJcbiAgICAgICAgICBsYWJlbD1cIlRpbWVzXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmctdGltZXNcIlxuICAgICAgICAgIEBpbnB1dD1cInRpbWVGb3JtYXQgPSBTdHJpbmcoJGV2ZW50KVwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cInpvbmVTaG93blwiXG4gICAgICAgIGNsYXNzPVwiZ3NfX3Jvd1wiXG4gICAgICAgIGRhdGEtdGlkPVwic2V0dGluZy10aW1lem9uZVwiXG4gICAgICA+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgVGltZSB6b25lXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX19zXCI+XG4gICAgICAgICAgICBUaGUgcHJpbnRlcidzIG93biBjbG9jaywgdXNlZCBmb3IgaXRzIHNjcmVlbiBhbmQgam9iIHRpbWVzLlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19jdGwgZ3NfX2N0bC0td2lkZVwiPlxuICAgICAgICAgIDx2LWF1dG9jb21wbGV0ZVxuICAgICAgICAgICAgOmtleT1cInpvbmVLZXlcIlxuICAgICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICBoaWRlLWRldGFpbHM9XCJhdXRvXCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJUaW1lIHpvbmVcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5nLXRpbWV6b25lLXNlbGVjdFwiXG4gICAgICAgICAgICA6aXRlbXM9XCJ6b25lc1wiXG4gICAgICAgICAgICA6dmFsdWU9XCJ6b25lXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInpvbmVTYXZpbmdcIlxuICAgICAgICAgICAgOmVycm9yLW1lc3NhZ2VzPVwiem9uZUVycm9yXCJcbiAgICAgICAgICAgIEBjaGFuZ2U9XCJzZXRab25lXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPGgyIGNsYXNzPVwiZ3NfX2d0XCI+XG4gICAgICBBc2sgYmVmb3JlXG4gICAgPC9oMj5cbiAgICA8ZGl2IGNsYXNzPVwiZ3NfX2xpc3RcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJnc19fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgRW1lcmdlbmN5IHN0b3BcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3NcIj5cbiAgICAgICAgICAgIE9mZjogb25lIHByZXNzIHN0b3BzIHt7IHByaW50ZXJOYW1lIH19IGF0IG9uY2UuIE9uOiBpdCBhc2tzIGZpcnN0LlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICA6dmFsdWU9XCJjb25maXJtT25Fc3RvcFwiXG4gICAgICAgICAgbGFiZWw9XCJFbWVyZ2VuY3kgc3RvcFwiXG4gICAgICAgICAgQGlucHV0PVwic2V0Q29uZmlybU9uRXN0b3BcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX2dyb3dcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3RcIj5cbiAgICAgICAgICAgIFNhdmluZyB0aGUgY29uZmlndXJhdGlvblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fc1wiPlxuICAgICAgICAgICAgU2F2aW5nIHJlc3RhcnRzIHRoZSBmaXJtd2FyZSwgc28gaXQgYXNrcy5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgOnZhbHVlPVwiY29uZmlybU9uU2F2ZUNvbmZpZ0FuZFJlc3RhcnRcIlxuICAgICAgICAgIGxhYmVsPVwiU2F2aW5nIHRoZSBjb25maWd1cmF0aW9uXCJcbiAgICAgICAgICBAaW5wdXQ9XCJzYXZlUGVyc29uYWwoJ2dlbmVyYWwuY29uZmlybU9uU2F2ZUNvbmZpZ0FuZFJlc3RhcnQnLCAkZXZlbnQpXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwiaGFzUG93ZXJEZXZpY2VzXCJcbiAgICAgICAgY2xhc3M9XCJnc19fcm93XCJcbiAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5nLWFzay1wb3dlclwiXG4gICAgICA+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgVHVybmluZyBvZmYgYSBwb3dlciBzd2l0Y2hcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3NcIj5cbiAgICAgICAgICAgIEl0IGFza3MgYmVmb3JlIG9uZSBvZiB0aGUgcHJpbnRlcidzIHBvd2VyIHN3aXRjaGVzIHR1cm5zIG9mZiwgb3Igb24uXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgIDp2YWx1ZT1cImNvbmZpcm1PblBvd2VyRGV2aWNlQ2hhbmdlXCJcbiAgICAgICAgICBsYWJlbD1cIlR1cm5pbmcgb2ZmIGEgcG93ZXIgc3dpdGNoXCJcbiAgICAgICAgICBAaW5wdXQ9XCJzYXZlUGVyc29uYWwoJ2dlbmVyYWwuY29uZmlybU9uUG93ZXJEZXZpY2VDaGFuZ2UnLCAkZXZlbnQpXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdzX19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBQcmludGluZyBzdHJhaWdodCBhZnRlciB1cGxvYWRcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3NcIj5cbiAgICAgICAgICAgIE9uOiBVcGxvYWQgJmFtcDsgcHJpbnQgaXMgaW4gdGhlIHRvcCBiYXIsIGFuZCBjaGVja3MgdGhlIHBsYXRlIGJlZm9yZSBpdCBzdGFydHMuIE9mZjogdGhlcmUncyBvbmx5IFVwbG9hZC5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgOnZhbHVlPVwic2hvd1VwbG9hZEFuZFByaW50XCJcbiAgICAgICAgICBsYWJlbD1cIlByaW50aW5nIHN0cmFpZ2h0IGFmdGVyIHVwbG9hZFwiXG4gICAgICAgICAgQGlucHV0PVwic2F2ZVBlcnNvbmFsKCdnZW5lcmFsLnNob3dVcGxvYWRBbmRQcmludCcsICRldmVudClcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8aDIgY2xhc3M9XCJnc19fZ3RcIj5cbiAgICAgIE92ZXJ2aWV3IGFuZCB0aGUgdG9wIGJhclxuICAgIDwvaDI+XG4gICAgPGRpdiBjbGFzcz1cImdzX19saXN0XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX2dyb3dcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3RcIj5cbiAgICAgICAgICAgIFByb2dyZXNzIGlzIG1lYXN1cmVkIGJ5XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX19zXCI+XG4gICAgICAgICAgICBGaWxlIHBvc2l0aW9uIGlzIHN0ZWFkeTsgbGF5ZXJzIGp1bXAuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8c2VnLXBpY2tlclxuICAgICAgICAgIDpvcHRpb25zPVwicHJvZ3Jlc3NPcHRpb25zXCJcbiAgICAgICAgICA6dmFsdWU9XCJwcm9ncmVzc0Nob2ljZVwiXG4gICAgICAgICAgbGFiZWw9XCJQcm9ncmVzcyBpcyBtZWFzdXJlZCBieVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5nLXByb2dyZXNzXCJcbiAgICAgICAgICBAaW5wdXQ9XCJzZXRQcm9ncmVzc1wiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJnc19fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgVGltZSBsZWZ0IGNvbWVzIGZyb21cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgOm9wdGlvbnM9XCJldGFPcHRpb25zXCJcbiAgICAgICAgICA6dmFsdWU9XCJldGFDaG9pY2VcIlxuICAgICAgICAgIGxhYmVsPVwiVGltZSBsZWZ0IGNvbWVzIGZyb21cIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dGluZy1ldGFcIlxuICAgICAgICAgIEBpbnB1dD1cInNldEV0YVwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cInBvd2VyRGV2aWNlc0xpc3QubGVuZ3RoXCJcbiAgICAgICAgY2xhc3M9XCJnc19fcm93XCJcbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBQb3dlciBzd2l0Y2ggaW4gdGhlIHByaW50ZXIgY2hpcFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19jdGwgZ3NfX2N0bC0td2lkZVwiPlxuICAgICAgICAgIDx2LXNlbGVjdFxuICAgICAgICAgICAgdi1tb2RlbD1cInRvcE5hdlBvd2VyVG9nZ2xlXCJcbiAgICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgICBkZW5zZVxuICAgICAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiUG93ZXIgc3dpdGNoIGluIHRoZSBwcmludGVyIGNoaXBcIlxuICAgICAgICAgICAgOml0ZW1zPVwiW3sgdGV4dDogJ05vbmUnLCB2YWx1ZTogbnVsbCB9LCAuLi5wb3dlckRldmljZXNMaXN0XVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8cm91dGVyLWxpbmtcbiAgICAgIGNsYXNzPVwiZ3NfX3hsXCJcbiAgICAgIDp0bz1cInsgcGF0aDogc2V0dGluZ3NQYXRoLCBoYXNoOiAnI2djb2RlUHJldmlldycgfVwiXG4gICAgICBkYXRhLXRpZD1cInNldHRpbmctbGluay1nY29kZS1wcmV2aWV3XCJcbiAgICA+XG4gICAgICA8di1pY29uXG4gICAgICAgIHNtYWxsXG4gICAgICAgIGNsYXNzPVwiZ3NfX3hsLWljXCJcbiAgICAgID5cbiAgICAgICAgJHByaW50ZXIzZFxuICAgICAgPC92LWljb24+XG4gICAgICA8c3BhbiBjbGFzcz1cImdzX19ncm93XCI+VGhlIDxiPjNEIHByaW50ZXIgbW9kZWw8L2I+IGFuZCB0aGUgPGI+Y2FtZXJhIG9uIE92ZXJ2aWV3PC9iPiBhcmUgc2V0IGluIEctY29kZSBwcmV2aWV3IGFuZCAzRC48L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cImdzX19nb1wiPk9wZW4g4oC6PC9zcGFuPlxuICAgIDwvcm91dGVyLWxpbms+XG5cbiAgICA8aDIgY2xhc3M9XCJnc19fZ3RcIj5cbiAgICAgIEtleWJvYXJkXG4gICAgPC9oMj5cbiAgICA8ZGl2IGNsYXNzPVwiZ3NfX2xpc3RcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJnc19fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgU2hvcnRjdXRzXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX19zXCI+XG4gICAgICAgICAgICBHIHRoZW4gYSBsZXR0ZXIgdG8ganVtcCB0byBhIHBhZ2U7IEN0cmwgSyB0byBzZWFyY2guIEhvbGQgPyB0byBzZWUgdGhlbSBhbGwuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgIDp2YWx1ZT1cImVuYWJsZUtleWJvYXJkU2hvcnRjdXRzXCJcbiAgICAgICAgICBsYWJlbD1cIlNob3J0Y3V0c1wiXG4gICAgICAgICAgQGlucHV0PVwiZW5hYmxlS2V5Ym9hcmRTaG9ydGN1dHMgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8aDIgY2xhc3M9XCJnc19fZ3RcIj5cbiAgICAgIFRoZXNlIHNldHRpbmdzXG4gICAgPC9oMj5cbiAgICA8ZGl2IGNsYXNzPVwiZ3NfX2xpc3RcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJnc19fcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fZ3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgU2F2ZSBhIGNvcHlcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3NcIj5cbiAgICAgICAgICAgIEFsbCBvZiB5b3VyIENvbnRyb2wgc2V0dGluZ3MgZm9yIHt7IHByaW50ZXJOYW1lIH19LCBhcyBvbmUgZmlsZS5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dGluZ3Mtc2F2ZS1jb3B5XCJcbiAgICAgICAgICBAY2xpY2s9XCJoYW5kbGVCYWNrdXBTZXR0aW5nc1wiXG4gICAgICAgID5cbiAgICAgICAgICBTYXZlXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX2dyb3dcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3RcIj5cbiAgICAgICAgICAgIFJlc3RvcmUgZnJvbSBhIGNvcHlcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3NcIj5cbiAgICAgICAgICAgIFNob3dzIHdoYXQgd2lsbCBjaGFuZ2UgYmVmb3JlIGl0IGRvZXMuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmdzLXJlc3RvcmUtY29weVwiXG4gICAgICAgICAgQGNsaWNrPVwidXBsb2FkU2V0dGluZ3NGaWxlLmNsaWNrKClcIlxuICAgICAgICA+XG4gICAgICAgICAgQ2hvb3NlIGZpbGXigKZcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxoMiBjbGFzcz1cImdzX19ndFwiPlxuICAgICAgTW9yZVxuICAgIDwvaDI+XG4gICAgPGRpdiBjbGFzcz1cImdzX19saXN0XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX2dyb3dcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3RcIj5cbiAgICAgICAgICAgIENoYW5nZXMgbm90IHRvIGxpc3RcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3NcIj5cbiAgICAgICAgICAgIFNlY3Rpb25zIHdob3NlIHNhdmVkIHJlc3VsdHMgU2F2ZSBkb2Vzbid0IHNob3csIHN1Y2ggYXMgdGhlIGJlZCBtZXNoLlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19jdGwgZ3NfX2N0bC0td2lkZVwiPlxuICAgICAgICAgIDx2LWNvbWJvYm94XG4gICAgICAgICAgICB2LW1vZGVsPVwic2VjdGlvbnNUb0lnbm9yZVBlbmRpbmdDb25maWd1cmF0aW9uQ2hhbmdlc1wiXG4gICAgICAgICAgICA6aXRlbXM9XCJbJ2JlZF9tZXNoIGRlZmF1bHQnLCAnYmVkX3RpbHQnXVwiXG4gICAgICAgICAgICBtdWx0aXBsZVxuICAgICAgICAgICAgc21hbGwtY2hpcHNcbiAgICAgICAgICAgIGRlbGV0YWJsZS1jaGlwc1xuICAgICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgICAgIGFwcGVuZC1pY29uPVwiXCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJDaGFuZ2VzIG5vdCB0byBsaXN0XCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdzX19yb3dcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImdzX190XCI+XG4gICAgICAgICAgICBDaGFydHMgcGFnZVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fc1wiPlxuICAgICAgICAgICAgUmVjb3JkcyBob3cgYnVzeSBlYWNoIGJvYXJkIGlzLCBmb3IgQ2hhcnRzLiBVc2VzIGEgbGl0dGxlIG1vcmUgb2YgdGhlIHByaW50ZXIuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgIDp2YWx1ZT1cImVuYWJsZURpYWdub3N0aWNzXCJcbiAgICAgICAgICBsYWJlbD1cIkNoYXJ0cyBwYWdlXCJcbiAgICAgICAgICBAaW5wdXQ9XCJlbmFibGVEaWFnbm9zdGljcyA9ICRldmVudFwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxpbnB1dFxuICAgICAgcmVmPVwidXBsb2FkU2V0dGluZ3NGaWxlXCJcbiAgICAgIHR5cGU9XCJmaWxlXCJcbiAgICAgIGFjY2VwdD1cIi5qc29uXCJcbiAgICAgIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiXG4gICAgICBkYXRhLXRpZD1cInNldHRpbmdzLXJlc3RvcmUtZmlsZVwiXG4gICAgICBAY2hhbmdlPVwiaGFuZGxlUmVzdG9yZVNldHRpbmdzXCJcbiAgICA+XG5cbiAgICA8bTMtZGlhbG9nXG4gICAgICA6dmFsdWU9XCIhIXJlc3RvcmVcIlxuICAgICAgZXllYnJvdz1cIlJlc3RvcmVcIlxuICAgICAgdGl0bGU9XCJSZXN0b3JlIHRoZXNlIHNldHRpbmdzP1wiXG4gICAgICBtYXgtd2lkdGg9XCI0NjBcIlxuICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1yZXN0b3JlLWRpYWxvZ1wiXG4gICAgICBAaW5wdXQ9XCIhJGV2ZW50ICYmIGNhbmNlbFJlc3RvcmUoKVwiXG4gICAgICBAY2xvc2U9XCJjYW5jZWxSZXN0b3JlXCJcbiAgICA+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInJlc3RvcmVcIj5cbiAgICAgICAgPHAgY2xhc3M9XCJnc19fc3ViXCI+XG4gICAgICAgICAge3sgcmVzdG9yZS5maWxlTmFtZSB9fTx0ZW1wbGF0ZSB2LWlmPVwicmVzdG9yZS5mcm9tXCI+XG4gICAgICAgICAgICDCtyBzYXZlZCBmcm9tIHt7IHJlc3RvcmUuZnJvbSB9fVxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvcD5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwicmVzdG9yZS5mcm9tICYmIHJlc3RvcmUuZnJvbSAhPT0gaW5zdGFuY2VOYW1lXCJcbiAgICAgICAgICBjbGFzcz1cImdzX193YXJuXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmdzLXJlc3RvcmUtb3RoZXJcIlxuICAgICAgICA+XG4gICAgICAgICAgVGhpcyBjb3B5IGlzIGZyb20ge3sgcmVzdG9yZS5mcm9tIH19LCBub3Qge3sgcHJpbnRlck5hbWUgfX0uIEl0IGNhbiBzdGlsbCBiZSByZXN0b3JlZCBoZXJlLlxuICAgICAgICA8L3A+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJnc19fbGlzdCBnc19fbGlzdC0tc2hlZXRcIj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWZvcj1cImNoYW5nZSBpbiByZXN0b3JlLmNoYW5nZXNcIlxuICAgICAgICAgICAgOmtleT1cImNoYW5nZS5sYWJlbFwiXG4gICAgICAgICAgICBjbGFzcz1cImdzX19yb3dcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1yZXN0b3JlLWNoYW5nZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgICAgIHt7IGNoYW5nZS5sYWJlbCB9fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJnc19fdlwiPnt7IGNoYW5nZS52YWx1ZSB9fTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3NfX3Jvd1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdzX19ncm93XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJnc19fdFwiPlxuICAgICAgICAgICAgICAgIHt7IHJlc3RvcmUuY2hhbmdlcy5sZW5ndGggPyAnRXZlcnl0aGluZyBlbHNlJyA6ICdFdmVyeXRoaW5nJyB9fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJnc19fdlwiPlNhbWU8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1yZXN0b3JlLWNhbmNlbFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2FuY2VsUmVzdG9yZVwiXG4gICAgICAgID5cbiAgICAgICAgICBDYW5jZWxcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cInJlc3RvcmluZ1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1yZXN0b3JlLWFwcGx5XCJcbiAgICAgICAgICBAY2xpY2s9XCJhcHBseVJlc3RvcmVcIlxuICAgICAgICA+XG4gICAgICAgICAgUmVzdG9yZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9tMy1kaWFsb2c+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBSZWYgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFN0YXRlTWl4aW4gZnJvbSAnQC9taXhpbnMvc3RhdGUnXG5pbXBvcnQgdHlwZSB7IFZJbnB1dCB9IGZyb20gJ0AvdHlwZXMnXG5pbXBvcnQgeyBTdXBwb3J0ZWRMb2NhbGVzLCBEYXRlRm9ybWF0cyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB0eXBlIHsgT3V0cHV0UGluIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBEZXZpY2UgfSBmcm9tICdAL3N0b3JlL3Bvd2VyL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBQcmludEV0YUNhbGN1bGF0aW9uLCBQcmludFByb2dyZXNzQ2FsY3VsYXRpb24sIFRoZW1lQ29uZmlnLCBUaGVtZU1vZGUgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7IGh0dHBDbGllbnRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvaHR0cENsaWVudEFjdGlvbnMnXG5pbXBvcnQgY29uc29sYSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHsgcHJpbnRlck5hbWVQYXJ0cyB9IGZyb20gJ0AvdXRpbC9wcmludGVyLW5hbWUnXG5pbXBvcnQgeyBjbG9uZURlZXAsIG1lcmdlIH0gZnJvbSAnbG9kYXNoLWVzJ1xuaW1wb3J0IHsgcmVhZEZpbGVBc1RleHRBc3luYyB9IGZyb20gJ0AvdXRpbC9maWxlLXN5c3RlbS1lbnRyeSdcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcbmltcG9ydCB7IGlzRmx1aWRkQ29udGVudCwgdG9GbHVpZGRDb250ZW50IH0gZnJvbSAnQC91dGlsL2ZsdWlkZC1jb250ZW50J1xuaW1wb3J0IFRvZ2dsZVN3aXRjaCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Ub2dnbGVTd2l0Y2gudnVlJ1xuaW1wb3J0IFNlZ1BpY2tlciwgeyB0eXBlIFNlZ09wdGlvbiB9IGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1NlZ1BpY2tlci52dWUnXG5pbXBvcnQgTTNEaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL3VpL00zRGlhbG9nLnZ1ZSdcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IHNsdWdpZnkgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMvc2x1ZydcbmltcG9ydCB7XG4gIEFDQ0VOVFMsIGFjY2VudEZvciwgY29weUZpbGVOYW1lLCBldGFDaG9pY2VPZiwgZXRhU3RvcmVkRm9yLCBtb2RlbExpbmUsIHByb2dyZXNzQ2hvaWNlT2YsIHByb2dyZXNzU3RvcmVkRm9yLFxuICByZXN0b3JlQ2hhbmdlcywgc2VyaWFsRnJvbUlkZW50aXR5LCBzeXN0ZW1QcmVmZXJzRGFyaywgdGhlbWVNb2RlT2YsXG4gIHR5cGUgRXRhQ2hvaWNlLCB0eXBlIFByb2dyZXNzQ2hvaWNlLCB0eXBlIFJlc3RvcmVDaGFuZ2Vcbn0gZnJvbSAnQC9zZXJ2aWNlcy9zZXR0aW5ncy9nZW5lcmFsJ1xuXG5pbnRlcmZhY2UgUGVuZGluZ1Jlc3RvcmUge1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmcm9tOiBzdHJpbmcgfCBudWxsO1xuICBkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgY2hhbmdlczogUmVzdG9yZUNoYW5nZVtdO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgY29tcG9uZW50czogeyBUb2dnbGVTd2l0Y2gsIFNlZ1BpY2tlciwgTTNEaWFsb2cgfVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlbmVyYWxTZXR0aW5ncyBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluKSB7XG4gIGFjY2VudHMgPSBBQ0NFTlRTXG4gIHNlcmlhbDogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgcmVzdG9yZTogUGVuZGluZ1Jlc3RvcmUgfCBudWxsID0gbnVsbFxuICByZXN0b3JpbmcgPSBmYWxzZVxuXG4gIG1vZGVPcHRpb25zOiBTZWdPcHRpb25bXSA9IFtcbiAgICB7IHZhbHVlOiAnZGFyaycsIGxhYmVsOiAnRGFyaycgfSxcbiAgICB7IHZhbHVlOiAnbGlnaHQnLCBsYWJlbDogJ0xpZ2h0JyB9LFxuICAgIHsgdmFsdWU6ICdhdXRvJywgbGFiZWw6ICdBdXRvJyB9XG4gIF1cblxuICB0aW1lT3B0aW9uczogU2VnT3B0aW9uW10gPSBbXG4gICAgeyB2YWx1ZTogJ2hvdXJzMjQnLCBsYWJlbDogJzI0LWhvdXInIH0sXG4gICAgeyB2YWx1ZTogJ2hvdXJzMTInLCBsYWJlbDogJzEyLWhvdXInIH1cbiAgXVxuXG4gIHByb2dyZXNzT3B0aW9uczogU2VnT3B0aW9uW10gPSBbXG4gICAgeyB2YWx1ZTogJ2ZpbGUnLCBsYWJlbDogJ0ZpbGUnIH0sXG4gICAgeyB2YWx1ZTogJ2xheWVycycsIGxhYmVsOiAnTGF5ZXJzJyB9LFxuICAgIHsgdmFsdWU6ICdzbGljZXInLCBsYWJlbDogJ1NsaWNlcicgfVxuICBdXG5cbiAgZXRhT3B0aW9uczogU2VnT3B0aW9uW10gPSBbXG4gICAgeyB2YWx1ZTogJ3NsaWNlcicsIGxhYmVsOiAnU2xpY2VyJyB9LFxuICAgIHsgdmFsdWU6ICdmaWxlJywgbGFiZWw6ICdGaWxlJyB9LFxuICAgIHsgdmFsdWU6ICdhdmVyYWdlJywgbGFiZWw6ICdBdmVyYWdlJyB9XG4gIF1cblxuICBAUmVmKCdpbnN0YW5jZU5hbWUnKVxuICByZWFkb25seSBpbnN0YW5jZU5hbWVFbGVtZW50ITogVklucHV0XG5cbiAgQFJlZigndXBsb2FkU2V0dGluZ3NGaWxlJylcbiAgcmVhZG9ubHkgdXBsb2FkU2V0dGluZ3NGaWxlITogSFRNTElucHV0RWxlbWVudFxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMubG9hZFNlcmlhbCgpXG4gICAgdGhpcy5sb2FkWm9uZSgpXG4gIH1cblxuICB6b25lOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICB6b25lU2hvd24gPSBmYWxzZVxuICB6b25lRXJyb3IgPSAnJ1xuICB6b25lU2F2aW5nID0gZmFsc2VcbiAgem9uZUtleSA9IDBcblxuICBnZXQgem9uZXMgKCk6IHN0cmluZ1tdIHtcbiAgICBsZXQgYWxsOiBzdHJpbmdbXSA9IFtdXG4gICAgdHJ5IHtcbiAgICAgIGFsbCA9IChJbnRsIGFzIHVua25vd24gYXMgeyBzdXBwb3J0ZWRWYWx1ZXNPZj86IChrOiBzdHJpbmcpID0+IHN0cmluZ1tdIH0pLnN1cHBvcnRlZFZhbHVlc09mPy4oJ3RpbWVab25lJykgPz8gW11cbiAgICB9IGNhdGNoIHsgLyogbm8gSW50bCB6b25lIGxpc3QgKi8gfVxuICAgIGlmICghYWxsLmluY2x1ZGVzKCdVVEMnKSkgYWxsID0gWydVVEMnLCAuLi5hbGxdXG4gICAgcmV0dXJuIHRoaXMuem9uZSAmJiAhYWxsLmluY2x1ZGVzKHRoaXMuem9uZSkgPyBbdGhpcy56b25lLCAuLi5hbGxdIDogYWxsXG4gIH1cblxuICAvKiogQSBwcmludGVyIHdpdGhvdXQgdGhlIHJvdXRlICg0MDQpIHNob3dzIG5vIHJvdyBhdCBhbGwsIG5vdCBhIGJyb2tlbiBvbmUuICovXG4gIGFzeW5jIGxvYWRab25lICgpIHtcbiAgICBpZiAodGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2lzTXVvblByaW50ZXInXSAhPT0gdHJ1ZSkgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyTXVvblRpbWV6b25lR2V0KClcbiAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5kYXRhIGFzIHsgem9uZT86IHVua25vd24sIHJlc3VsdD86IHsgem9uZT86IHVua25vd24gfSB9XG4gICAgICBjb25zdCB6b25lID0gZGF0YT8ucmVzdWx0Py56b25lID8/IGRhdGE/LnpvbmVcbiAgICAgIHRoaXMuem9uZSA9IHR5cGVvZiB6b25lID09PSAnc3RyaW5nJyA/IHpvbmUgOiBudWxsXG4gICAgICB0aGlzLnpvbmVTaG93biA9IHRydWVcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMuem9uZVNob3duID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBhc3luYyBzZXRab25lICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy56b25lRXJyb3IgPSAnJ1xuICAgIHRoaXMuem9uZVNhdmluZyA9IHRydWVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyTXVvblRpbWV6b25lUG9zdCh2YWx1ZSlcbiAgICAgIHRoaXMuem9uZSA9IHZhbHVlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgcmVzID0gKGUgYXMgeyByZXNwb25zZT86IHsgc3RhdHVzPzogbnVtYmVyLCBkYXRhPzogdW5rbm93biB9IH0pLnJlc3BvbnNlXG4gICAgICBpZiAocmVzPy5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICB0aGlzLnpvbmVTaG93biA9IGZhbHNlXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgZGF0YSA9IHJlcz8uZGF0YSBhcyB7IGVycm9yPzogc3RyaW5nIHwgeyBtZXNzYWdlPzogc3RyaW5nIH0gfSB8IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgY29uc3Qgd2h5ID0gdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnID8gZGF0YSA6IHR5cGVvZiBkYXRhPy5lcnJvciA9PT0gJ3N0cmluZycgPyBkYXRhLmVycm9yIDogZGF0YT8uZXJyb3I/Lm1lc3NhZ2VcbiAgICAgIHRoaXMuem9uZUVycm9yID0gYCR7dGhpcy5wcmludGVyTmFtZX0gZGlkIG5vdCBhY2NlcHQgdGhhdCB0aW1lIHpvbmUke3doeSA/IGA6ICR7d2h5LnJlcGxhY2UoL1xcLiQvLCAnJyl9LmAgOiAnLid9IE5vdGhpbmcgY2hhbmdlZC5gXG4gICAgICB0aGlzLnpvbmVLZXkrK1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnpvbmVTYXZpbmcgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXJpYWwgKCkge1xuICAgIGlmICghdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2lzTXVvblByaW50ZXInXSkgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyTXVvbklkZW50aXR5R2V0KClcbiAgICAgIHRoaXMuc2VyaWFsID0gc2VyaWFsRnJvbUlkZW50aXR5KHJlc3BvbnNlLmRhdGEpXG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLnNlcmlhbCA9IG51bGxcbiAgICB9XG4gIH1cblxuICBnZXQgZ2VuZXJhbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWxcbiAgfVxuXG4gIGdldCB0aGVtZSAoKTogVGhlbWVDb25maWcge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy50aGVtZVxuICB9XG5cbiAgc2F2ZVBlcnNvbmFsIChwYXRoOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZVBlcnNvbmFsJywgeyBwYXRoLCB2YWx1ZSB9KVxuICB9XG5cbiAgc2F2ZUdlbmVyYWwgKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7IHBhdGg6IGB1aVNldHRpbmdzLmdlbmVyYWwuJHtrZXl9YCwgdmFsdWUsIHNlcnZlcjogdHJ1ZSB9KVxuICB9XG5cbiAgZ2V0IGluc3RhbmNlTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5nZW5lcmFsLmluc3RhbmNlTmFtZVxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIGFzIHRoZSB0b3AgYmFyIG5hbWVzIGl0LiAqL1xuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nID8/ICcnKS5uYW1lIHx8ICd0aGlzIHByaW50ZXInXG4gIH1cblxuICBuYW1lS2V5ID0gMFxuICBuYW1lRXJyb3IgPSAnJ1xuICByZW5hbWluZyA9IGZhbHNlXG5cbiAgLyoqXG4gICAqIE9uIGEgTXVvbiBwcmludGVyIHRoZSBuYW1lIGlzIHRoZSBwcmludGVyJ3Mgb3duIChpdHMgaWRlbnRpdHksIHdoaWNoIHRoZVxuICAgKiBwYW5lbCwgdGhlIHBob25lIGFwcCBhbmQgZXZlcnkgb3RoZXIgQ29udHJvbCByZWFkKSwgc28gaXQgaXMgd3JpdHRlblxuICAgKiB0aGVyZSBmaXJzdDsgQ29udHJvbCdzIG93biBsYWJlbCBmb2xsb3dzIG9uY2UgdGhlIHByaW50ZXIgaGFzIGl0LiBJZiB0aGVcbiAgICogcHJpbnRlciByZWZ1c2VzLCBub3RoaW5nIGNoYW5nZXMgYW5kIHRoZSByZWZ1c2FsIGlzIHNob3duIGhlcmUuXG4gICAqL1xuICBhc3luYyBzZXRJbnN0YW5jZU5hbWUgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRoaXMuaW5zdGFuY2VOYW1lRWxlbWVudC52YWxpZCkgcmV0dXJuXG4gICAgY29uc3QgbmFtZSA9IHZhbHVlLnRyaW0oKVxuICAgIHRoaXMubmFtZUVycm9yID0gJydcbiAgICBpZiAodGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2lzTXVvblByaW50ZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5yZW5hbWluZyA9IHRydWVcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGh0dHBDbGllbnRBY3Rpb25zLnNlcnZlck11b25JZGVudGl0eU5hbWVQb3N0KG5hbWUpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSAoZSBhcyB7IHJlc3BvbnNlPzogeyBzdGF0dXM/OiBudW1iZXIsIGRhdGE/OiB1bmtub3duIH0gfSkucmVzcG9uc2U/LmRhdGEgYXMgeyBlcnJvcj86IHN0cmluZyB8IHsgbWVzc2FnZT86IHN0cmluZyB9IH0gfCBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgICAgY29uc3Qgd2h5ID0gdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnID8gZGF0YSA6IHR5cGVvZiBkYXRhPy5lcnJvciA9PT0gJ3N0cmluZycgPyBkYXRhLmVycm9yIDogZGF0YT8uZXJyb3I/Lm1lc3NhZ2VcbiAgICAgICAgdGhpcy5uYW1lRXJyb3IgPSBgJHt0aGlzLnByaW50ZXJOYW1lfSBkaWQgbm90IGFjY2VwdCB0aGUgbmV3IG5hbWUke3doeSA/IGA6ICR7d2h5LnJlcGxhY2UoL1xcLiQvLCAnJyl9LmAgOiAnLid9IE5vdGhpbmcgY2hhbmdlZC5gXG4gICAgICAgIHRoaXMubmFtZUtleSsrXG4gICAgICAgIHJldHVyblxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdGhpcy5yZW5hbWluZyA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvdXBkYXRlSW5zdGFuY2UnLCBuYW1lKVxuICB9XG5cbiAgZ2V0IG1vZGVsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBtb2RlbExpbmUodGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2lzTXVvblByaW50ZXInXSBhcyBib29sZWFuIHwgbnVsbCwgdGhpcy5zZXJpYWwpXG4gIH1cblxuICBnZXQgc2V0dGluZ3NQYXRoICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpXG4gIH1cblxuICBnZXQgYWNjZW50T24gKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBhY2NlbnRGb3IodGhpcy50aGVtZS5jb2xvcik/LmNvbG9yID8/IG51bGxcbiAgfVxuXG4gIHNldEFjY2VudCAoY29sb3I6IHN0cmluZykge1xuICAgIHRoaXMuc2F2ZVBlcnNvbmFsKCd0aGVtZS5jb2xvcicsIGNvbG9yKVxuICB9XG5cbiAgZ2V0IG1vZGUgKCk6IFRoZW1lTW9kZSB7XG4gICAgcmV0dXJuIHRoZW1lTW9kZU9mKHRoaXMudGhlbWUpXG4gIH1cblxuICBhc3luYyBzZXRNb2RlIChtb2RlOiBUaGVtZU1vZGUpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVQZXJzb25hbCgndGhlbWUubW9kZScsIG1vZGUpXG4gICAgYXdhaXQgdGhpcy5zYXZlUGVyc29uYWwoJ3RoZW1lLmlzRGFyaycsIG1vZGUgPT09ICdhdXRvJyA/IHN5c3RlbVByZWZlcnNEYXJrKCkgOiBtb2RlID09PSAnZGFyaycpXG4gIH1cblxuICBnZXQgbG9jYWxlICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZW5lcmFsLmxvY2FsZVxuICB9XG5cbiAgZ2V0IHN1cHBvcnRlZExvY2FsZXMgKCkge1xuICAgIHJldHVybiBbXG4gICAgICB7IG5hbWU6ICdTYW1lIGFzIHRoaXMgZGV2aWNlJywgY29kZTogJ2RlZmF1bHQnIH0sXG4gICAgICAuLi5TdXBwb3J0ZWRMb2NhbGVzXG4gICAgXVxuICB9XG5cbiAgc2V0TG9jYWxlICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9vbkxvY2FsZUNoYW5nZScsIHZhbHVlKVxuICB9XG5cbiAgZ2V0IGRhdGVGb3JtYXQgKCkge1xuICAgIHJldHVybiB0aGlzLmdlbmVyYWwuZGF0ZUZvcm1hdFxuICB9XG5cbiAgc2V0IGRhdGVGb3JtYXQgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNhdmVHZW5lcmFsKCdkYXRlRm9ybWF0JywgdmFsdWUpXG4gIH1cblxuICBnZXQgYXZhaWxhYmxlRGF0ZUZvcm1hdHMgKCkge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpXG5cbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoRGF0ZUZvcm1hdHMpXG4gICAgICAubWFwKChba2V5LCBlbnRyeV0pID0+ICh7XG4gICAgICAgIHZhbHVlOiBrZXksXG4gICAgICAgIHRleHQ6IGAke2RhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKGVudHJ5LmxvY2FsZXMgPz8gdGhpcy4kZmlsdGVycy5nZXRBbGxMb2NhbGVzKCksIGVudHJ5Lm9wdGlvbnMpfSR7ZW50cnkuc3VmZml4ID8/ICcnfWBcbiAgICAgIH0pKVxuICB9XG5cbiAgZ2V0IHRpbWVGb3JtYXQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhbC50aW1lRm9ybWF0XG4gIH1cblxuICBzZXQgdGltZUZvcm1hdCAodmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuc2F2ZUdlbmVyYWwoJ3RpbWVGb3JtYXQnLCB2YWx1ZSlcbiAgfVxuXG4gIC8qKiBJU08gdGltZXMgYXJlIDI0LWhvdXIgdG9vOiBpdCBzdGF5cyBJU08gdW50aWwgc29tZW9uZSBwaWNrcy4gKi9cbiAgZ2V0IHRpbWVDaG9pY2UgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudGltZUZvcm1hdCA9PT0gJ2hvdXJzMTInID8gJ2hvdXJzMTInIDogJ2hvdXJzMjQnXG4gIH1cblxuICBnZXQgZW5hYmxlS2V5Ym9hcmRTaG9ydGN1dHMgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdlbmVyYWwuZW5hYmxlS2V5Ym9hcmRTaG9ydGN1dHNcbiAgfVxuXG4gIHNldCBlbmFibGVLZXlib2FyZFNob3J0Y3V0cyAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNhdmVHZW5lcmFsKCdlbmFibGVLZXlib2FyZFNob3J0Y3V0cycsIHZhbHVlKVxuICB9XG5cbiAgZ2V0IGNvbmZpcm1PbkVzdG9wICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdlbmVyYWwuY29uZmlybU9uRXN0b3BcbiAgfVxuXG4gIGFzeW5jIHNldENvbmZpcm1PbkVzdG9wICh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc3Qgc3VyZSA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICAgIGBFdmVyeSBlbWVyZ2VuY3kgc3RvcCB5b3Ugc3RhcnQgb24gJHt0aGlzLnByaW50ZXJOYW1lfSB3aWxsIGFzayBmaXJzdCwgc28gaXQgdGFrZXMgYSBzZWNvbmQgcHJlc3MuIEFueW9uZSBlbHNlIGhlcmUga2VlcHMgdGhlaXIgb3duIHNldHRpbmcuYCxcbiAgICAgICAgeyB0aXRsZTogJ0UtU1RPUCB3aWxsIG5lZWQgdHdvIHByZXNzZXMnLCBidXR0b25UcnVlVGV4dDogJ0FzayBmaXJzdCcsIGJ1dHRvbkZhbHNlVGV4dDogJ0tlZXAgb25lIHByZXNzJyB9XG4gICAgICApXG4gICAgICBpZiAoIXN1cmUpIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnNhdmVQZXJzb25hbCgnZ2VuZXJhbC5jb25maXJtT25Fc3RvcCcsIHZhbHVlKVxuICB9XG5cbiAgZ2V0IGNvbmZpcm1PblNhdmVDb25maWdBbmRSZXN0YXJ0ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdlbmVyYWwuY29uZmlybU9uU2F2ZUNvbmZpZ0FuZFJlc3RhcnRcbiAgfVxuXG4gIGdldCBjb25maXJtT25Qb3dlckRldmljZUNoYW5nZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5nZW5lcmFsLmNvbmZpcm1PblBvd2VyRGV2aWNlQ2hhbmdlXG4gIH1cblxuICBnZXQgc2hvd1VwbG9hZEFuZFByaW50ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdlbmVyYWwuc2hvd1VwbG9hZEFuZFByaW50XG4gIH1cblxuICBnZXQgaGFzUG93ZXJEZXZpY2VzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwb3dlci9nZXREZXZpY2VzJ10gYXMgRGV2aWNlW10gfCB1bmRlZmluZWQpID8/IFtdKS5sZW5ndGggPiAwXG4gIH1cblxuICBnZXQgcHJvZ3Jlc3NDaG9pY2UgKCk6IFByb2dyZXNzQ2hvaWNlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHByb2dyZXNzQ2hvaWNlT2YodGhpcy5nZW5lcmFsLnByaW50UHJvZ3Jlc3NDYWxjdWxhdGlvbiBhcyBQcmludFByb2dyZXNzQ2FsY3VsYXRpb25bXSlcbiAgfVxuXG4gIHNldFByb2dyZXNzIChjaG9pY2U6IFByb2dyZXNzQ2hvaWNlKSB7XG4gICAgdGhpcy5zYXZlR2VuZXJhbCgncHJpbnRQcm9ncmVzc0NhbGN1bGF0aW9uJywgcHJvZ3Jlc3NTdG9yZWRGb3IoY2hvaWNlKSlcbiAgfVxuXG4gIGdldCBldGFDaG9pY2UgKCk6IEV0YUNob2ljZSB8IG51bGwge1xuICAgIHJldHVybiBldGFDaG9pY2VPZih0aGlzLmdlbmVyYWwucHJpbnRFdGFDYWxjdWxhdGlvbiBhcyBQcmludEV0YUNhbGN1bGF0aW9uW10pXG4gIH1cblxuICBzZXRFdGEgKGNob2ljZTogRXRhQ2hvaWNlKSB7XG4gICAgdGhpcy5zYXZlR2VuZXJhbCgncHJpbnRFdGFDYWxjdWxhdGlvbicsIGV0YVN0b3JlZEZvcihjaG9pY2UpKVxuICB9XG5cbiAgZ2V0IHRvcE5hdlBvd2VyVG9nZ2xlICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZW5lcmFsLnRvcE5hdlBvd2VyVG9nZ2xlXG4gIH1cblxuICBzZXQgdG9wTmF2UG93ZXJUb2dnbGUgKHZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgdGhpcy5zYXZlR2VuZXJhbCgndG9wTmF2UG93ZXJUb2dnbGUnLCB2YWx1ZSlcbiAgfVxuXG4gIGdldCBwb3dlckRldmljZXNMaXN0ICgpIHtcbiAgICBjb25zdCBkZXZpY2VzID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Bvd2VyL2dldERldmljZXMnXSBhcyBEZXZpY2VbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgICBjb25zdCBkZXZpY2VFbnRyaWVzID0gZGV2aWNlcy5sZW5ndGhcbiAgICAgID8gW1xuICAgICAgICAgIHsgaGVhZGVyOiAnTW9vbnJha2VyJyB9LFxuICAgICAgICAgIC4uLmRldmljZXMubWFwKGRldmljZSA9PiAoeyB0ZXh0OiBkZXZpY2UuZGV2aWNlLCB2YWx1ZTogZGV2aWNlLmRldmljZSB9KSlcbiAgICAgICAgXVxuICAgICAgOiBbXVxuXG4gICAgY29uc3QgcGlucyA9ICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFBpbnMnXSBhcyBPdXRwdXRQaW5bXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgICBjb25zdCBwaW5FbnRyaWVzID0gcGlucy5sZW5ndGhcbiAgICAgID8gW1xuICAgICAgICAgIHsgaGVhZGVyOiAnS2xpcHBlcicgfSxcbiAgICAgICAgICAuLi5waW5zLm1hcChvdXRwdXRQaW4gPT4gKHsgdGV4dDogb3V0cHV0UGluLnByZXR0eU5hbWUsIHZhbHVlOiBgJHtvdXRwdXRQaW4ubmFtZX06a2xpcHBlcmAgfSkpXG4gICAgICAgIF1cbiAgICAgIDogW11cblxuICAgIHJldHVybiBbXG4gICAgICAuLi5kZXZpY2VFbnRyaWVzLFxuICAgICAgLi4ucGluRW50cmllc1xuICAgIF1cbiAgfVxuXG4gIGdldCBzZWN0aW9uc1RvSWdub3JlUGVuZGluZ0NvbmZpZ3VyYXRpb25DaGFuZ2VzICgpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhbC5zZWN0aW9uc1RvSWdub3JlUGVuZGluZ0NvbmZpZ3VyYXRpb25DaGFuZ2VzIGFzIHN0cmluZ1tdXG4gIH1cblxuICBzZXQgc2VjdGlvbnNUb0lnbm9yZVBlbmRpbmdDb25maWd1cmF0aW9uQ2hhbmdlcyAodmFsdWU6IHN0cmluZ1tdKSB7XG4gICAgdGhpcy5zYXZlR2VuZXJhbCgnc2VjdGlvbnNUb0lnbm9yZVBlbmRpbmdDb25maWd1cmF0aW9uQ2hhbmdlcycsIFsuLi5uZXcgU2V0KHZhbHVlKV0uc29ydCgoYSwgYikgPT4gYS5sb2NhbGVDb21wYXJlKGIpKSlcbiAgfVxuXG4gIGdldCBlbmFibGVEaWFnbm9zdGljcyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhbC5lbmFibGVEaWFnbm9zdGljc1xuICB9XG5cbiAgc2V0IGVuYWJsZURpYWdub3N0aWNzICh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2F2ZUdlbmVyYWwoJ2VuYWJsZURpYWdub3N0aWNzJywgdmFsdWUpXG4gIH1cblxuICBhc3luYyBjdXJyZW50U2V0dGluZ3MgKCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBodHRwQ2xpZW50QWN0aW9ucy5zZXJ2ZXJEYXRhYmFzZUl0ZW1HZXQoJ2ZsdWlkZCcpXG4gICAgY29uc3QgdmFsdWUgPSByZXNwb25zZS5kYXRhPy5yZXN1bHQ/LnZhbHVlXG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA6IG51bGxcbiAgfVxuXG4gIC8qKiBXaGF0IGlzIGluIGVmZmVjdCBub3c6IHRoZSBzYXZlZCBzZXR0aW5ncyBvdmVyIHRoZSBkZWZhdWx0cyB0aGlzIHBhZ2Ugc2hvd3MuICovXG4gIGFzeW5jIGRpZmZCYXNlICgpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmN1cnJlbnRTZXR0aW5ncygpID8/IHt9XG4gICAgcmV0dXJuIHsgLi4uc2F2ZWQsIHVpU2V0dGluZ3M6IG1lcmdlKGNsb25lRGVlcCh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncyksIChzYXZlZC51aVNldHRpbmdzIGFzIG9iamVjdCB8IHVuZGVmaW5lZCkgPz8ge30pIH1cbiAgfVxuXG4gIGFzeW5jIGhhbmRsZUJhY2t1cFNldHRpbmdzICgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY3VycmVudFNldHRpbmdzKClcblxuICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgY29uc3QgYmFja3VwRGF0YUFzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodG9GbHVpZGRDb250ZW50KCdzZXR0aW5ncy1iYWNrdXAnLCBkYXRhKSlcbiAgICAgICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuXG4gICAgICAgIGxpbmsuaHJlZiA9IGBkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwke2VuY29kZVVSSUNvbXBvbmVudChiYWNrdXBEYXRhQXNTdHJpbmcpfWBcbiAgICAgICAgbGluay5kb3dubG9hZCA9IGNvcHlGaWxlTmFtZShzbHVnaWZ5KHRoaXMucHJpbnRlck5hbWUpKVxuICAgICAgICBsaW5rLnRhcmdldCA9ICdfYmxhbmsnXG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rKVxuICAgICAgICBsaW5rLmNsaWNrKClcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsaW5rKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGEuZXJyb3IoJ1tTZXR0aW5nc10gYmFja3VwIGZhaWxlZCcsIGUpXG5cbiAgICAgIEV2ZW50QnVzLiRlbWl0KHRoaXMuJHQoJ2FwcC5nZW5lcmFsLm1zZy5mbHVpZGRfc2V0dGluZ3NfYmFja3VwX2ZhaWxlZCcpLnRvU3RyaW5nKCksIHsgdHlwZTogJ2Vycm9yJyB9KVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGhhbmRsZVJlc3RvcmVTZXR0aW5ncyAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLnVwbG9hZFNldHRpbmdzRmlsZT8uZmlsZXM/Lmxlbmd0aCA9PT0gMSA/IHRoaXMudXBsb2FkU2V0dGluZ3NGaWxlLmZpbGVzWzBdIDogbnVsbFxuICAgICAgaWYgKCFmaWxlKSByZXR1cm5cblxuICAgICAgY29uc3QgYmFja3VwRGF0YUFzU3RyaW5nID0gYXdhaXQgcmVhZEZpbGVBc1RleHRBc3luYyhmaWxlKVxuICAgICAgaWYgKCFiYWNrdXBEYXRhQXNTdHJpbmcpIHJldHVyblxuXG4gICAgICBjb25zdCBiYWNrdXBEYXRhID0gSlNPTi5wYXJzZShiYWNrdXBEYXRhQXNTdHJpbmcpXG5cbiAgICAgIGlmICghaXNGbHVpZGRDb250ZW50PFJlY29yZDxzdHJpbmcsIHVua25vd24+Pignc2V0dGluZ3MtYmFja3VwJywgYmFja3VwRGF0YSkgfHwgIWJhY2t1cERhdGEuZGF0YSB8fCB0eXBlb2YgYmFja3VwRGF0YS5kYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBFdmVudEJ1cy4kZW1pdCh0aGlzLiR0KCdhcHAuZ2VuZXJhbC5tc2cubm90X3ZhbGlkX2ZsdWlkZF9iYWNrdXBfZmlsZScpLnRvU3RyaW5nKCksIHsgdHlwZTogJ2Vycm9yJyB9KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YSA9IGJhY2t1cERhdGEuZGF0YVxuICAgICAgY29uc3QgdWkgPSBkYXRhLnVpU2V0dGluZ3MgYXMgeyBnZW5lcmFsPzogeyBpbnN0YW5jZU5hbWU/OiB1bmtub3duIH0gfSB8IHVuZGVmaW5lZFxuICAgICAgY29uc3QgZnJvbSA9IHR5cGVvZiB1aT8uZ2VuZXJhbD8uaW5zdGFuY2VOYW1lID09PSAnc3RyaW5nJyA/IHVpLmdlbmVyYWwuaW5zdGFuY2VOYW1lIDogbnVsbFxuXG4gICAgICB0aGlzLnJlc3RvcmUgPSB7XG4gICAgICAgIGZpbGVOYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgIGZyb20sXG4gICAgICAgIGRhdGEsXG4gICAgICAgIGNoYW5nZXM6IHJlc3RvcmVDaGFuZ2VzKGF3YWl0IHRoaXMuZGlmZkJhc2UoKSwgZGF0YSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xhLmVycm9yKCdbU2V0dGluZ3NdIHJlc3RvcmUgZmFpbGVkJywgZSlcblxuICAgICAgRXZlbnRCdXMuJGVtaXQodGhpcy4kdCgnYXBwLmdlbmVyYWwubXNnLmZsdWlkZF9zZXR0aW5nc19yZXN0b3JlX2ZhaWxlZCcpLnRvU3RyaW5nKCksIHsgdHlwZTogJ2Vycm9yJyB9KVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnVwbG9hZFNldHRpbmdzRmlsZS52YWx1ZSA9ICcnXG4gICAgfVxuICB9XG5cbiAgY2FuY2VsUmVzdG9yZSAoKSB7XG4gICAgaWYgKCF0aGlzLnJlc3RvcmluZykgdGhpcy5yZXN0b3JlID0gbnVsbFxuICB9XG5cbiAgYXN5bmMgYXBwbHlSZXN0b3JlICgpIHtcbiAgICBpZiAoIXRoaXMucmVzdG9yZSkgcmV0dXJuXG4gICAgdGhpcy5yZXN0b3JpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMucmVzdG9yZS5kYXRhKSB7XG4gICAgICAgIGF3YWl0IGh0dHBDbGllbnRBY3Rpb25zLnNlcnZlckRhdGFiYXNlSXRlbVBvc3QoJ2ZsdWlkZCcsIGtleSwgdGhpcy5yZXN0b3JlLmRhdGFba2V5XSlcbiAgICAgIH1cblxuICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sYS5lcnJvcignW1NldHRpbmdzXSByZXN0b3JlIGZhaWxlZCcsIGUpXG4gICAgICB0aGlzLnJlc3RvcmluZyA9IGZhbHNlXG5cbiAgICAgIEV2ZW50QnVzLiRlbWl0KHRoaXMuJHQoJ2FwcC5nZW5lcmFsLm1zZy5mbHVpZGRfc2V0dGluZ3NfcmVzdG9yZV9mYWlsZWQnKS50b1N0cmluZygpLCB7IHR5cGU6ICdlcnJvcicgfSlcbiAgICB9XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5ncyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAuZ3NfX2d0IHtcbiAgICBtYXJnaW46IDIycHggMTZweCA4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4wMmVtO1xuXG4gICAgJjpmaXJzdC1jaGlsZCB7XG4gICAgICBtYXJnaW4tdG9wOiAwO1xuICAgIH1cbiAgfVxuXG4gIC5nc19fbGlzdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIHBhZGRpbmc6IDAgMThweDtcbiAgICBib3JkZXItcmFkaXVzOiAyMHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgfVxuXG4gIC5nc19fbGlzdC0tc2hlZXQge1xuICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAuZ3NfX3JvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTRweDtcbiAgICBtaW4taGVpZ2h0OiA1NnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMDtcblxuICAgICYgKyAmIHtcbiAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICB9XG4gIH1cblxuICAuZ3NfX2dyb3cge1xuICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5nc19fdCB7XG4gICAgZm9udC1zaXplOiAxNXB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAuZ3NfX3Mge1xuICAgIG1hcmdpbi10b3A6IDJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5nc19fdiB7XG4gICAgZmxleDogbm9uZTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgfVxuXG4gIC5nc19fY3RsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDAgMCBhdXRvO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIH1cblxuICAuZ3NfX2N0bC0td2lkZSB7XG4gICAgZmxleDogMCAxIDMwMHB4O1xuICAgIHdpZHRoOiAzMDBweDtcbiAgfVxuXG4gIC5nc19fc3dhdGNoZXMge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgZ2FwOiAxMHB4O1xuICB9XG5cbiAgLmdzX19zd2F0Y2gge1xuICAgIHdpZHRoOiAyOHB4O1xuICAgIGhlaWdodDogMjhweDtcbiAgICBib3JkZXI6IDA7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggcmdiYSgwLCAwLCAwLCAwLjE1KTtcblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLXRleHQpO1xuICAgICAgb3V0bGluZS1vZmZzZXQ6IDJweDtcbiAgICB9XG4gIH1cblxuICAuZ3NfX3N3YXRjaC0tb24ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDJweCB2YXIoLS1tM2Qtc3VyZmFjZSksIDAgMCAwIDRweCB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAuZ3NfX2doIHtcbiAgICBtYXJnaW46IDhweCAxNnB4IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuZ3NfX3hsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIG1hcmdpbi10b3A6IDEycHg7XG4gICAgcGFkZGluZzogMTRweCAxOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICB9XG5cbiAgLmdzX194bC1pYyB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmdzX19nbyB7XG4gICAgZmxleDogbm9uZTtcbiAgICBjb2xvcjogdmFyKC0tdi1wcmltYXJ5LWJhc2UpO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAuZ3NfX3N1YiB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmdzX193YXJuIHtcbiAgICBtYXJnaW46IDhweCAwIDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICBAbWVkaWEgKG1heC13aWR0aDogNzYwcHgpIHtcbiAgICAuZ3NfX3JvdyB7XG4gICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgfVxuXG4gICAgLmdzX19jdGwtLXdpZGUge1xuICAgICAgZmxleDogMSAxIDEwMCU7XG4gICAgICB3aWR0aDogYXV0bztcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9HZW5lcmFsU2V0dGluZ3MudnVlIn0=