/* unplugin-vue-components disabled */import __unplugin_components_6 from "/src/components/ui/FrameIcon.vue";
import { VDialog as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import TypedCommandsMixin from "/src/mixins/typed-commands.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { ACTIVE_PHASES, bannerVisible, commitPending, isStaged, stagedUnverified, versionLabel } from "/src/services/updates/model.ts";
import { currentOutcome, installStarted, poll, updateWatch } from "/src/services/updates/watch.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import TaskFold from "/src/components/control/TaskFold.vue";
import FrameIcon from "/src/components/ui/FrameIcon.vue";
import LockedRow from "/src/components/settings/gates/LockedRow.vue";
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import { afterPrint, cancelAfterPrint, loadAfterPrint, otaComponent, queueAfterPrint } from "/src/services/updates/after-print.ts";
import { historyLine, loadHistory, printerHistory, updateHistory } from "/src/services/updates/history.ts";
import {
  AUTO_INSTALL_PATH,
  AUTO_OFF_TEXT,
  AUTO_ON_TEXT,
  KNOB_TEXT,
  PRESENCE_PATH,
  STAGED_TEXT,
  anyHot,
  flagOf,
  needsKnob,
  restartBlocked,
  stagedReady
} from "/src/services/updates/policy.ts";
import { classifyRefusal, isPanelOnlyRefusal, panelOnlyMessage, permissionMessage } from "/src/services/wifi/panel-only.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
let SoftwareSettings = class extends Mixins(TypedCommandsMixin, MuonGatesMixin) {
  checking = false;
  otherSoftwareOpen = false;
  installRefusal = "";
  autoInstall = null;
  presence = null;
  policyLoaded = false;
  policyNote = "";
  saving = "";
  installDialog = false;
  when = null;
  pending = null;
  mounted() {
    poll();
    this.loadPolicy();
    this.loadKept();
  }
  loadKept() {
    loadAfterPrint(this.watchedPrinter);
    loadHistory(this.watchedPrinter);
  }
  get watchedPrinter() {
    return updateWatch.printer;
  }
  // -- the hero ---------------------------------------------------------------
  get heroIcon() {
    if (this.chip.tone === "ok") return "check";
    if (this.outcomeText) return "alert";
    return "download";
  }
  /** "MuonOS 6 November 2026": the one ready, else the one it has. */
  get heroTitle() {
    const v = this.available ? this.status?.target_version : this.status?.current_version;
    return v ? `MuonOS ${versionLabel(v).text.split(" \xB7 ")[0]}` : "MuonOS";
  }
  get heroSub() {
    if (!this.status) return "The printer's system, Klipper, its screen and Control, updated together.";
    const have = versionLabel(this.status.current_version).text.split(" \xB7 ")[0];
    return this.available ? `You have ${have} \xB7 checked ${this.checkedText}` : `Up to date \xB7 checked ${this.checkedText}`;
  }
  get notesTeaser() {
    const notes = (this.status?.release_notes ?? "").replace(/\s+/g, " ").trim();
    return notes.length > 110 ? `${notes.slice(0, 107)}\u2026` : notes;
  }
  // -- install now or after this print ------------------------------------------
  get queued() {
    return afterPrint.printer === this.watchedPrinter ? afterPrint.queued : null;
  }
  get queuedText() {
    const file = this.queued?.file ? ` (${this.queued.file.replace(/\.gcode$/i, "")})` : "";
    return `Installs after this print${file}. ${this.printerName} keeps printing until then.`;
  }
  get printFile() {
    return this.$store.state.printer?.printer?.print_stats?.filename || null;
  }
  /** Install… opens: everything but "printing", which offers "after this print" instead. */
  get askBlocked() {
    if (this.printerBusy && this.available && this.commandControlAvailable && this.klippyConnected && !this.active) return "";
    return this.installBlocked;
  }
  get canAskInstall() {
    return this.available && !this.askBlocked;
  }
  get whenOptions() {
    const busy = this.printerBusy;
    return [
      { value: "now", label: "Install now", line: "Starts writing the update now.", why: busy ? "Not while printing." : "" },
      { value: "after", label: "Install after this print", line: this.printFile ? `When ${this.printFile.replace(/\.gcode$/i, "")} ends.` : "When the print ends.", why: busy ? "" : "Nothing is printing." }
    ];
  }
  snapshot() {
    return { target: this.commandTarget, component: this.otaKey, from: this.status?.current_version ?? null, to: this.status?.target_version ?? null };
  }
  openInstall() {
    this.installRefusal = this.askBlocked;
    if (!this.canAskInstall) return;
    this.pending = this.snapshot();
    this.when = this.printerBusy ? "after" : "now";
    this.installDialog = true;
  }
  async confirmWhen() {
    const pending = this.pending;
    const when = this.when;
    this.installDialog = false;
    if (!pending || !when) return;
    if (when === "now") await this.install(pending);
    else this.queueInstall(pending);
  }
  /** "After this print": kept until the print is over, then App sends it (services/updates/after-print). */
  queueInstall(pending) {
    this.installRefusal = "";
    if (pending.target !== this.commandTarget) this.installRefusal = "Not kept. The selected printer or account changed. Try again.";
    else if (pending.to !== (this.status?.target_version ?? null)) this.installRefusal = "Not kept. The available version changed. Check again.";
    else if (!this.printerBusy) this.installRefusal = "The print has ended: install it now instead.";
    else if (this.askBlocked) this.installRefusal = `Not kept. ${this.askBlocked}`;
    if (this.installRefusal) return;
    queueAfterPrint(this.watchedPrinter, { from: pending.from, to: pending.to, file: this.printFile, at: Date.now() });
  }
  cancelQueued() {
    cancelAfterPrint();
  }
  // -- history ------------------------------------------------------------------
  get history() {
    return printerHistory(this.status) ?? (updateHistory.printer === this.watchedPrinter ? updateHistory.entries : []);
  }
  entryVersion(entry) {
    return entry.version ? versionLabel(entry.version).text.split(" \xB7 ")[0] : "An update";
  }
  entryLine(entry) {
    const date = new Date(entry.at).toLocaleDateString(void 0, { day: "numeric", month: "short" });
    return `${historyLine(entry, this.printerName)} \xB7 ${date}`;
  }
  /** On a Muon printer the parts are updated together; one at a time is for developer mode. */
  get othersLocked() {
    return this.isMuonPrinter === true && !this.devModeEnabled;
  }
  async loadPolicy() {
    const get = async (url) => {
      try {
        const r = await this.$httpClient.get(url, { validateStatus: () => true });
        return r.status >= 200 && r.status < 300 ? r.data : null;
      } catch {
        return null;
      }
    };
    const [auto, presence] = await Promise.all([get(AUTO_INSTALL_PATH), get(PRESENCE_PATH)]);
    const status = this.status;
    this.autoInstall = flagOf(auto, "enabled") ?? (typeof status?.auto_install === "boolean" ? status.auto_install : null);
    this.presence = flagOf(presence, "required") ?? (typeof status?.install_presence_required === "boolean" ? status.install_presence_required : null);
    this.policyLoaded = true;
  }
  get autoText() {
    return this.autoInstall ? AUTO_ON_TEXT : AUTO_OFF_TEXT;
  }
  /** Send the owner's choice; the printer keeps what it accepts and refuses the rest. */
  async setFlag(which, value) {
    if (this.saving) return;
    this.saving = which;
    this.policyNote = "";
    const url = which === "auto" ? AUTO_INSTALL_PATH : PRESENCE_PATH;
    const body = which === "auto" ? { enabled: value } : { required: value };
    try {
      const r = await this.$httpClient.post(url, body, { validateStatus: () => true });
      if (r.status === 202 || needsKnob(r.data)) {
        this.policyNote = `${KNOB_TEXT}. The setting changes when you do.`;
      } else if (r.status >= 200 && r.status < 300) {
        const kept = flagOf(r.data, which === "auto" ? "enabled" : "required") ?? value;
        if (which === "auto") this.autoInstall = kept;
        else this.presence = kept;
      } else if (isPanelOnlyRefusal({ response: r })) {
        this.policyNote = panelOnlyMessage("change how it updates");
      } else if (classifyRefusal({ response: r }).kind === "permission") {
        this.policyNote = permissionMessage(classifyRefusal({ response: r }), !!cloudState.account);
      } else {
        this.policyNote = "The printer didn't take that change. Try again.";
      }
    } catch {
      this.policyNote = "The printer didn't answer. Try again.";
    } finally {
      this.saving = "";
    }
  }
  /** Staged, checked, and the printer installs it on its next restart. */
  get restartReady() {
    return !!this.autoInstall && this.available && stagedReady(this.status);
  }
  get stagedText() {
    return STAGED_TEXT;
  }
  get hot() {
    return anyHot(this.$store.getters["printer/getHeaters"] ?? []);
  }
  get restartWhy() {
    return restartBlocked({
      status: this.status,
      canControl: this.commandControlAvailable,
      klippyConnected: this.klippyConnected,
      printerState: this.printerState,
      hot: this.hot,
      active: this.active
    });
  }
  async restartToUpdate() {
    this.installRefusal = this.restartWhy;
    if (!this.restartReady || this.restartWhy) return;
    const target = this.commandTarget;
    const component = this.otaKey;
    const fromVersion = this.status?.current_version ?? null;
    const toVersion = this.status?.target_version ?? null;
    const ok = await this.$confirm(
      `${this.printerName} restarts into the new version now, which takes a few minutes. Don't turn it off until it is back.`,
      { title: "Restart now to update?", buttonTrueText: "Restart", buttonFalseText: "Not now" }
    );
    if (!ok) return;
    if (target !== this.commandTarget) this.installRefusal = "Not sent. The selected printer or account changed. Try again.";
    else if (component !== this.otaKey) this.installRefusal = "Not sent. The update component changed. Check again.";
    else if (toVersion !== (this.status?.target_version ?? null)) this.installRefusal = "Not sent. The staged update changed. Check again.";
    else if (!this.restartReady || this.restartWhy) this.installRefusal = `Not sent. ${this.restartWhy || "The update is no longer staged."}`;
    if (this.installRefusal) return;
    SocketActions.machineUpdateClient(component);
    installStarted(fromVersion, toVersion);
    if (this.presence) this.installRefusal = `${KNOB_TEXT}. The printer restarts when you do.`;
    this.$router.push(this.updatingTo).catch(() => void 0);
  }
  get accessTo() {
    return `${scopedPath("/settings", activeSlug())}#access`;
  }
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  get status() {
    return updateWatch.status;
  }
  get locked() {
    return this.$store.getters["protection/isLocked"];
  }
  get unavailableText() {
    if (this.locked) return "Network protection is on, so updates are only managed from the printer's panel or a device paired with it.";
    return "Asking the printer\u2026";
  }
  /** What was remembered, but an install "under way" only if the printer has confirmed it in this page and it is within its time: a stale entry never blocks or badges anything. */
  get remembered() {
    const r = updateWatch.remembered;
    if (r && ACTIVE_PHASES.includes(r.phase) && !bannerVisible(r, updateWatch.now, !!updateWatch.answered)) return null;
    return r;
  }
  get active() {
    return !!this.remembered && ACTIVE_PHASES.includes(this.remembered.phase);
  }
  get progress() {
    const p = this.remembered?.progress ?? this.status?.progress ?? null;
    return typeof p === "number" ? Math.round(Math.max(0, Math.min(100, p))) : null;
  }
  get available() {
    return !!this.status?.update_available && !!this.status.target_version && this.status.target_version !== this.status.current_version;
  }
  get installed() {
    return versionLabel(this.status?.current_version).text;
  }
  get availableText() {
    return versionLabel(this.status?.target_version).text;
  }
  get checkedText() {
    const at = this.status?.last_checked ? Date.parse(this.status.last_checked) : NaN;
    if (!Number.isFinite(at)) return "not yet";
    const minutes = Math.round((Date.now() - at) / 6e4);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
  }
  get chip() {
    if (!this.status) return { text: "\u2026", tone: "muted" };
    const phase = this.remembered?.phase;
    if (phase === "installing") return { text: this.progress !== null ? `Updating \xB7 ${this.progress}%` : "Updating", tone: "busy" };
    if (phase === "preparing") return { text: "Starting the update", tone: "busy" };
    if (phase === "rebooting") return { text: "Restarting", tone: "busy" };
    if (phase === "verifying" || commitPending(this.status)) return { text: "Checking the update", tone: "busy" };
    if (this.restartReady) return { text: STAGED_TEXT, tone: "warn" };
    if (isStaged(this.status)) return { text: "Update ready to install", tone: "warn" };
    if (this.available) return { text: "Update ready", tone: "warn" };
    return { text: "Up to date", tone: "ok" };
  }
  get outcomeText() {
    const o = currentOutcome();
    const message = this.status?.session?.error?.message;
    if (o === "rolled_back") return `The last update didn't complete, so the printer went back to the version it had.${message ? ` ${message}` : ""}`;
    if (o === "failed") return `The last update didn't install; nothing changed.${message ? ` ${message}` : ""}`;
    if (this.status?.state === "failed" && this.status.error) return this.status.error;
    return "";
  }
  get installBlocked() {
    if (!this.commandControlAvailable) return "Connect to a printer you can control first.";
    if (!this.klippyConnected) return "Klipper is not connected.";
    if (this.printerBusy) return "Not while printing.";
    if (this.active) return "An update is already under way.";
    if (commitPending(this.status)) return "The printer is still checking the last update.";
    if (stagedUnverified(this.status)) return "An update is staged, but it can't be checked from here yet. Install it from the printer's screen.";
    return "";
  }
  get canInstall() {
    return this.available && !this.installBlocked && this.klippyConnected;
  }
  get updatingTo() {
    return scopedPath("/updating", activeSlug());
  }
  /** The updater's name for MuonOS: the component of type ota. */
  get otaKey() {
    return otaComponent(this.$store.state.version.version_info);
  }
  /** Install now. From the Install dialog its snapshot is the confirmation; called alone, it asks first. */
  async install(asked) {
    this.installRefusal = this.installBlocked;
    if (!this.canInstall) return;
    this.installRefusal = "";
    const { target, component, from: fromVersion, to: toVersion } = asked ?? this.snapshot();
    if (!asked) {
      const ok = await this.$confirm(
        `${this.printerName} writes the new version while it keeps working, then restarts into it, which takes a few minutes. Don't turn it off until it is back.`,
        { title: "Install the update now?", buttonTrueText: "Install", buttonFalseText: "Not now" }
      );
      if (!ok) return;
    }
    if (target !== this.commandTarget) this.installRefusal = "Not sent. The selected printer or account changed. Try again.";
    else if (component !== this.otaKey) this.installRefusal = "Not sent. The update component changed. Check again.";
    else if (fromVersion !== (this.status?.current_version ?? null) || toVersion !== (this.status?.target_version ?? null)) this.installRefusal = "Not sent. The available version changed. Check again.";
    else if (!this.available || this.installBlocked) this.installRefusal = `Not sent. ${this.installBlocked || "The update is no longer available."}`;
    if (this.installRefusal) return;
    SocketActions.machineUpdateClient(component);
    installStarted(fromVersion, toVersion);
    this.$router.push(this.updatingTo).catch(() => void 0);
  }
  async check() {
    this.checking = true;
    try {
      SocketActions.machineUpdateRefresh(this.otaKey);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      await poll();
    } finally {
      this.checking = false;
    }
  }
  get enableNotifications() {
    return this.$store.state.config.uiSettings.general.enableVersionNotifications;
  }
  set enableNotifications(value) {
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.enableVersionNotifications", value, server: true });
  }
  get busy() {
    return !!this.$store.state.version.busy;
  }
  get otherUpdateBlocked() {
    if (!this.commandControlAvailable) return "Connect to a printer you can control first.";
    if (!this.klippyConnected) return "Klipper is not connected.";
    if (this.printerBusy) return "Not while printing.";
    return "";
  }
  /** Everything else the updater lists: the OS packages and any other client. */
  get others() {
    const info = this.$store.state.version.version_info ?? {};
    const hasUpdate = this.$store.getters["version/hasUpdate"];
    return Object.entries(info).filter(([, c]) => c.configured_type !== "ota").map(([key, c]) => {
      const update = hasUpdate(key);
      if (key === "system") {
        const n = Number(c.package_count ?? 0);
        return { key, title: "The system's packages", text: n ? `${n} to update` : "Up to date", update };
      }
      const version = String(c.version ?? c.full_version_string ?? "");
      const remote = String(c.remote_version ?? "");
      return { key, title: key, text: update ? `${version} \u2192 ${remote}` : version || "Up to date", update };
    });
  }
  async updateOther(key) {
    if (this.otherUpdateBlocked) return;
    const target = this.commandTarget;
    const ok = await this.$confirm("The printer must be idle. It may restart after this component is updated.", {
      title: `Update ${key}?`,
      buttonTrueText: "Update",
      buttonFalseText: "Not now"
    });
    if (!ok || target !== this.commandTarget || this.otherUpdateBlocked) return;
    this.$store.dispatch("version/onUpdateStatus", { busy: true });
    if (key === "system") SocketActions.machineUpdateSystem();
    else SocketActions.machineUpdateClient(key);
  }
};
__decorateClass([
  Watch("watchedPrinter")
], SoftwareSettings.prototype, "loadKept", 1);
SoftwareSettings = __decorateClass([
  Component({ components: { ToggleSwitch, TaskFold, FrameIcon, LockedRow } })
], SoftwareSettings);
const _sfc_main = SoftwareSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "soft", attrs: { "id": "versions", "data-tid": "software-settings" } }, [_c("section", { staticClass: "soft__panel soft__hero", attrs: { "data-tid": "software-hero" } }, [_c("header", { staticClass: "soft__head" }, [_c("span", { staticClass: "soft__hero-ico", class: `soft__hero-ico--${_vm.chip.tone}` }, [_c(__unplugin_components_0, { attrs: { "name": _vm.heroIcon } })], 1), _c("div", { staticClass: "soft__titles" }, [_c("span", { staticClass: "soft__eyebrow", class: `soft__chip--${_vm.chip.tone}`, attrs: { "data-tid": "software-state" } }, [_vm._v(_vm._s(_vm.chip.text))]), _c("h2", { attrs: { "data-tid": "software-hero-title" } }, [_vm._v(" " + _vm._s(_vm.heroTitle) + " ")]), _c("p", { attrs: { "data-tid": "software-hero-sub" } }, [_vm._v(" " + _vm._s(_vm.heroSub) + " ")])]), _c("button", { staticClass: "cbtn cbtn--sm soft__check", attrs: { "type": "button", "disabled": _vm.checking || _vm.active, "data-tid": "software-check" }, on: { "click": _vm.check } }, [_c(__unplugin_components_1, { attrs: { "name": "refresh", "small": "" } }), _vm._v(" " + _vm._s(_vm.checking ? "Checking\u2026" : "Check now") + " ")], 1)]), !_vm.status ? _c("p", { staticClass: "soft__note" }, [_vm._v(" " + _vm._s(_vm.unavailableText) + " ")]) : [_vm.active ? _c("div", { staticClass: "soft__progress", attrs: { "data-tid": "software-progress" } }, [_c("span", { staticClass: "soft__bar" }, [_c("i", { style: { width: `${_vm.progress ?? 0}%` } })]), _c("router-link", { staticClass: "soft__link", attrs: { "to": _vm.updatingTo } }, [_vm._v(" See progress ")])], 1) : _vm._e(), _vm.outcomeText ? _c("p", { staticClass: "soft__note soft__note--warn", attrs: { "data-tid": "software-outcome" } }, [_vm._v(" " + _vm._s(_vm.outcomeText) + " ")]) : _vm._e(), _vm.available && _vm.status.release_notes ? _c("details", { staticClass: "soft__notes", attrs: { "data-tid": "software-whats-new" } }, [_c("summary", [_c("b", [_vm._v("What's new")]), _c("span", [_vm._v(_vm._s(_vm.notesTeaser))])]), _c("p", [_vm._v(_vm._s(_vm.status.release_notes))])]) : _vm._e(), _vm.restartReady ? _c("p", { staticClass: "soft__note", attrs: { "data-tid": "software-staged" } }, [_vm._v(" " + _vm._s(_vm.stagedText) + " ")]) : _vm.available ? _c("p", { staticClass: "soft__note", attrs: { "data-tid": "software-how-long" } }, [_vm._v(" Writing the update takes 10 to 40 minutes over Wi-Fi while " + _vm._s(_vm.printerName) + " keeps working; then it restarts for a few minutes. Not while printing. ")]) : _vm._e(), _vm.queued ? _c("div", { staticClass: "soft__queued", attrs: { "data-tid": "software-queued" } }, [_c(__unplugin_components_2, { attrs: { "name": "clock", "small": "" } }), _c("span", [_vm._v(_vm._s(_vm.queuedText))]), _c("button", { staticClass: "cbtn cbtn--sm cbtn--ghost", attrs: { "type": "button", "data-tid": "software-queued-cancel" }, on: { "click": _vm.cancelQueued } }, [_vm._v(" Cancel ")])], 1) : _vm._e(), !_vm.active && (_vm.restartReady || _vm.available && !_vm.queued) ? _c("div", { staticClass: "soft__actions" }, [_vm.restartReady ? _c("button", { staticClass: "cbtn cbtn--primary soft__go", attrs: { "type": "button", "disabled": !!_vm.restartWhy, "title": _vm.restartWhy, "data-tid": "software-restart" }, on: { "click": _vm.restartToUpdate } }, [_vm._v(" Restart now to update ")]) : _vm.mayDo("update_install") ? _c("button", { staticClass: "cbtn cbtn--primary soft__go", attrs: { "type": "button", "disabled": !_vm.canAskInstall, "title": _vm.askBlocked, "data-tid": "software-install" }, on: { "click": _vm.openInstall } }, [_vm._v(" Install\u2026 ")]) : _vm._e(), _vm.restartReady && _vm.restartWhy ? _c("span", { staticClass: "soft__why", attrs: { "data-tid": "software-restart-why" } }, [_vm._v(_vm._s(_vm.restartWhy))]) : !_vm.restartReady && _vm.askBlocked ? _c("span", { staticClass: "soft__why", attrs: { "data-tid": "software-install-why" } }, [_vm._v(_vm._s(_vm.askBlocked))]) : _vm._e()]) : _vm._e(), _vm.installRefusal ? _c("p", { staticClass: "soft__note soft__note--warn", attrs: { "data-tid": "software-install-refusal" } }, [_vm._v(" " + _vm._s(_vm.installRefusal) + " ")]) : _vm._e()]], 2), _c("h3", { staticClass: "soft__section" }, [_vm._v(" How updates arrive ")]), _c("section", { staticClass: "soft__panel", attrs: { "data-tid": "software-policy" } }, [_vm.autoInstall !== null ? [_c("div", { staticClass: "soft__row" }, [_c("div", { staticClass: "soft__titles" }, [_c("h3", [_vm._v("Automatic updates")]), _c("p", { attrs: { "data-tid": "software-auto-text" } }, [_vm._v(" " + _vm._s(_vm.autoText) + " ")])]), _c("toggle-switch", { attrs: { "value": _vm.autoInstall, "disabled": _vm.saving !== "", "label": "Automatic updates", "data-tid": "software-auto" }, on: { "input": function($event) {
    return _vm.setFlag("auto", $event);
  } } })], 1), _vm.presence !== null ? _c("div", { staticClass: "soft__row" }, [_vm._m(0), _c("toggle-switch", { attrs: { "value": _vm.presence, "disabled": _vm.saving !== "", "label": "Confirm on the printer before installing", "data-tid": "software-presence" }, on: { "input": function($event) {
    return _vm.setFlag("presence", $event);
  } } })], 1) : _vm._e(), _vm.policyNote ? _c("p", { staticClass: "soft__note soft__note--warn", attrs: { "data-tid": "software-policy-note" } }, [_vm._v(" " + _vm._s(_vm.policyNote) + " ")]) : _vm._e()] : _c("p", { staticClass: "soft__note", attrs: { "data-tid": "software-policy-unknown" } }, [_vm._v(" " + _vm._s(_vm.policyLoaded ? "This printer doesn't report its update settings yet." : "Asking the printer\u2026") + " ")]), _c("div", { staticClass: "soft__row" }, [_vm._m(1), _c("toggle-switch", { attrs: { "value": _vm.enableNotifications, "label": "Tell me when an update is ready" }, on: { "input": function($event) {
    _vm.enableNotifications = $event;
  } } })], 1), _vm._m(2)], 2), _c("h3", { staticClass: "soft__section" }, [_vm._v(" History ")]), _c("section", { staticClass: "soft__panel", attrs: { "data-tid": "software-history" } }, [_vm._l(_vm.history, function(entry, i) {
    return _c("div", { key: `${entry.at}-${i}`, staticClass: "soft__row soft__hist", attrs: { "data-outcome": entry.outcome, "data-tid": "software-history-row" } }, [_c("span", { staticClass: "soft__hist-ico", class: `soft__hist-ico--${entry.outcome}` }, [_c(__unplugin_components_3, { attrs: { "name": entry.outcome === "updated" ? "check" : "refresh", "small": "" } })], 1), _c("div", { staticClass: "soft__titles" }, [_c("h3", [_vm._v(_vm._s(_vm.entryVersion(entry)))]), _c("p", [_vm._v(_vm._s(_vm.entryLine(entry)))])])]);
  }), !_vm.history.length ? _c("p", { staticClass: "soft__note", attrs: { "data-tid": "software-history-empty" } }, [_vm._v(" " + _vm._s(_vm.installed !== "unknown" ? `On ${_vm.installed}. Updates installed from here are listed here.` : "Updates installed from here are listed here.") + " ")]) : _vm._e()], 2), _vm.others.length ? [_c("h3", { staticClass: "soft__section" }, [_vm._v(" Developer mode only ")]), _vm.othersLocked ? _c("locked-row", { attrs: { "label": "Other software", "reason-text": "Update Klipper, Moonraker or system packages on their own. On a Muon printer this can break the matched set.", "data-tid": "software-others-locked" } }) : _c("task-fold", { staticClass: "soft__panel", attrs: { "fold-id": "settings-other-software", "title": "Other software", "summary": "What else this printer's updater looks after", "data-tid": "software-others" }, model: { value: _vm.otherSoftwareOpen, callback: function($$v) {
    _vm.otherSoftwareOpen = $$v;
  }, expression: "otherSoftwareOpen" } }, _vm._l(_vm.others, function(c) {
    return _c("div", { key: c.key, staticClass: "soft__row" }, [_c("div", { staticClass: "soft__titles" }, [_c("h3", [_vm._v(_vm._s(c.title))]), _c("p", [_vm._v(_vm._s(c.text))])]), c.update ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": _vm.busy || !!_vm.otherUpdateBlocked, "title": _vm.otherUpdateBlocked }, on: { "click": function($event) {
      return _vm.updateOther(c.key);
    } } }, [_vm._v(" Update ")]) : _vm._e()]);
  }), 0)] : _vm._e(), _c("router-link", { staticClass: "soft__link", attrs: { "to": _vm.accessTo, "data-tid": "software-access-link" } }, [_c(__unplugin_components_4, { attrs: { "name": "user", "small": "" } }), _c("span", [_c("b", [_vm._v("Who may install updates")]), _vm._v(", and from where, is in People and access.")]), _c("span", { staticClass: "soft__link-go" }, [_vm._v("People and access \u203A")])], 1), _c(__unplugin_components_5, { attrs: { "max-width": "460" }, model: { value: _vm.installDialog, callback: function($$v) {
    _vm.installDialog = $$v;
  }, expression: "installDialog" } }, [_vm.installDialog ? _c("div", { staticClass: "soft__dialog", attrs: { "data-tid": "software-install-dialog" } }, [_c("h3", [_vm._v("Install " + _vm._s(_vm.heroTitle) + "?")]), _c("p", [_vm._v(_vm._s(_vm.printerName) + ' restarts at the end, for about 3 minutes. Everyone using it sees "Updating".')]), _c("div", { staticClass: "soft__when", attrs: { "role": "radiogroup", "aria-label": "When to install" } }, _vm._l(_vm.whenOptions, function(w) {
    return _c("button", { key: w.value, staticClass: "soft__when-row", attrs: { "type": "button", "role": "radio", "aria-checked": _vm.when === w.value, "disabled": !!w.why, "data-tid": `software-install-${w.value}` }, on: { "click": function($event) {
      _vm.when = w.value;
    } } }, [_c("span", { staticClass: "soft__titles" }, [_c("b", [_vm._v(_vm._s(w.label))]), _c("small", [_vm._v(_vm._s(w.why || w.line))])]), _c("span", { staticClass: "soft__tick" }, [_vm.when === w.value ? _c(__unplugin_components_6, { attrs: { "name": "check", "small": "" } }) : _vm._e()], 1)]);
  }), 0), _c("div", { staticClass: "soft__dialog-buttons" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "software-install-cancel" }, on: { "click": function($event) {
    _vm.installDialog = false;
  } } }, [_vm._v(" Not now ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.when, "data-tid": "software-install-go" }, on: { "click": _vm.confirmWhen } }, [_vm._v(" Install ")])])]) : _vm._e()])], 2);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "soft__titles" }, [_c("h3", [_vm._v("Confirm on the printer before installing")]), _c("p", [_vm._v("Someone presses the knob on the printer before a new version installs.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "soft__titles" }, [_c("h3", [_vm._v("Tell me when one is ready")]), _c("p", [_vm._v("A notice in the bell at the top.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "soft__row", attrs: { "data-tid": "software-channel" } }, [_c("div", { staticClass: "soft__titles" }, [_c("h3", [_vm._v("Channel")]), _c("p", [_vm._v("Stable. A Beta channel comes here when there is one.")])]), _c("span", { staticClass: "soft__value" }, [_vm._v("Stable")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/SoftwareSettings.vue?vue&type=style&index=0&scoped=cf71a4da&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "cf71a4da",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/SoftwareSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE9BQ0E7QUFDQTtBQUNBO0FBZ0NBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxhQUNBO0FBQUEsYUFDQTtBQUFBLGFBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBSUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLFlBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLGFBQ0E7QUFBQSxhQUNBO0FBQUEsYUFDQTtBQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsYUFDQTtBQUFBLGFBQ0E7QUFBQSxhQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQ0EsK0NBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsRUFDQTtBQUNBO0FBelpBO0FBQUEsRUFEQTtBQUFBLEdBbkJBLGlCQW9CQTtBQXBCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJTb2Z0d2FyZVNldHRpbmdzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBpZD1cInZlcnNpb25zXCJcbiAgICBjbGFzcz1cInNvZnRcIlxuICAgIGRhdGEtdGlkPVwic29mdHdhcmUtc2V0dGluZ3NcIlxuICA+XG4gICAgPHNlY3Rpb25cbiAgICAgIGNsYXNzPVwic29mdF9fcGFuZWwgc29mdF9faGVyb1wiXG4gICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWhlcm9cIlxuICAgID5cbiAgICAgIDxoZWFkZXIgY2xhc3M9XCJzb2Z0X19oZWFkXCI+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgY2xhc3M9XCJzb2Z0X19oZXJvLWljb1wiXG4gICAgICAgICAgOmNsYXNzPVwiYHNvZnRfX2hlcm8taWNvLS0ke2NoaXAudG9uZX1gXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIDpuYW1lPVwiaGVyb0ljb25cIiAvPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzb2Z0X190aXRsZXNcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJzb2Z0X19leWVicm93XCJcbiAgICAgICAgICAgIDpjbGFzcz1cImBzb2Z0X19jaGlwLS0ke2NoaXAudG9uZX1gXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtc3RhdGVcIlxuICAgICAgICAgID57eyBjaGlwLnRleHQgfX08L3NwYW4+XG4gICAgICAgICAgPGgyIGRhdGEtdGlkPVwic29mdHdhcmUtaGVyby10aXRsZVwiPlxuICAgICAgICAgICAge3sgaGVyb1RpdGxlIH19XG4gICAgICAgICAgPC9oMj5cbiAgICAgICAgICA8cCBkYXRhLXRpZD1cInNvZnR3YXJlLWhlcm8tc3ViXCI+XG4gICAgICAgICAgICB7eyBoZXJvU3ViIH19XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1zbSBzb2Z0X19jaGVja1wiXG4gICAgICAgICAgOmRpc2FibGVkPVwiY2hlY2tpbmcgfHwgYWN0aXZlXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWNoZWNrXCJcbiAgICAgICAgICBAY2xpY2s9XCJjaGVja1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cInJlZnJlc2hcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIHt7IGNoZWNraW5nID8gJ0NoZWNraW5n4oCmJyA6ICdDaGVjayBub3cnIH19XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9oZWFkZXI+XG5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCIhc3RhdHVzXCJcbiAgICAgICAgY2xhc3M9XCJzb2Z0X19ub3RlXCJcbiAgICAgID5cbiAgICAgICAge3sgdW5hdmFpbGFibGVUZXh0IH19XG4gICAgICA8L3A+XG5cbiAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWlmPVwiYWN0aXZlXCJcbiAgICAgICAgICBjbGFzcz1cInNvZnRfX3Byb2dyZXNzXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLXByb2dyZXNzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwic29mdF9fYmFyXCI+PGkgOnN0eWxlPVwieyB3aWR0aDogYCR7cHJvZ3Jlc3MgPz8gMH0lYCB9XCIgLz48L3NwYW4+XG4gICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICA6dG89XCJ1cGRhdGluZ1RvXCJcbiAgICAgICAgICAgIGNsYXNzPVwic29mdF9fbGlua1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgU2VlIHByb2dyZXNzXG4gICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwib3V0Y29tZVRleHRcIlxuICAgICAgICAgIGNsYXNzPVwic29mdF9fbm90ZSBzb2Z0X19ub3RlLS13YXJuXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLW91dGNvbWVcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgb3V0Y29tZVRleHQgfX1cbiAgICAgICAgPC9wPlxuXG4gICAgICAgIDxkZXRhaWxzXG4gICAgICAgICAgdi1pZj1cImF2YWlsYWJsZSAmJiBzdGF0dXMucmVsZWFzZV9ub3Rlc1wiXG4gICAgICAgICAgY2xhc3M9XCJzb2Z0X19ub3Rlc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzb2Z0d2FyZS13aGF0cy1uZXdcIlxuICAgICAgICA+XG4gICAgICAgICAgPHN1bW1hcnk+XG4gICAgICAgICAgICA8Yj5XaGF0J3MgbmV3PC9iPlxuICAgICAgICAgICAgPHNwYW4+e3sgbm90ZXNUZWFzZXIgfX08L3NwYW4+XG4gICAgICAgICAgPC9zdW1tYXJ5PlxuICAgICAgICAgIDxwPnt7IHN0YXR1cy5yZWxlYXNlX25vdGVzIH19PC9wPlxuICAgICAgICA8L2RldGFpbHM+XG5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwicmVzdGFydFJlYWR5XCJcbiAgICAgICAgICBjbGFzcz1cInNvZnRfX25vdGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtc3RhZ2VkXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHN0YWdlZFRleHQgfX1cbiAgICAgICAgPC9wPlxuXG4gICAgICAgIDxwXG4gICAgICAgICAgdi1lbHNlLWlmPVwiYXZhaWxhYmxlXCJcbiAgICAgICAgICBjbGFzcz1cInNvZnRfX25vdGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtaG93LWxvbmdcIlxuICAgICAgICA+XG4gICAgICAgICAgV3JpdGluZyB0aGUgdXBkYXRlIHRha2VzIDEwIHRvIDQwIG1pbnV0ZXMgb3ZlciBXaS1GaSB3aGlsZSB7eyBwcmludGVyTmFtZSB9fSBrZWVwcyB3b3JraW5nOyB0aGVuIGl0IHJlc3RhcnRzIGZvciBhIGZldyBtaW51dGVzLiBOb3Qgd2hpbGUgcHJpbnRpbmcuXG4gICAgICAgIDwvcD5cblxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cInF1ZXVlZFwiXG4gICAgICAgICAgY2xhc3M9XCJzb2Z0X19xdWV1ZWRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtcXVldWVkXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICBuYW1lPVwiY2xvY2tcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxzcGFuPnt7IHF1ZXVlZFRleHQgfX08L3NwYW4+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tc20gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzb2Z0d2FyZS1xdWV1ZWQtY2FuY2VsXCJcbiAgICAgICAgICAgIEBjbGljaz1cImNhbmNlbFF1ZXVlZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQ2FuY2VsXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWlmPVwiIWFjdGl2ZSAmJiAocmVzdGFydFJlYWR5IHx8IChhdmFpbGFibGUgJiYgIXF1ZXVlZCkpXCJcbiAgICAgICAgICBjbGFzcz1cInNvZnRfX2FjdGlvbnNcIlxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1pZj1cInJlc3RhcnRSZWFkeVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5IHNvZnRfX2dvXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiEhcmVzdGFydFdoeVwiXG4gICAgICAgICAgICA6dGl0bGU9XCJyZXN0YXJ0V2h5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtcmVzdGFydFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJyZXN0YXJ0VG9VcGRhdGVcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFJlc3RhcnQgbm93IHRvIHVwZGF0ZVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtZWxzZS1pZj1cIm1heURvKCd1cGRhdGVfaW5zdGFsbCcpXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnkgc29mdF9fZ29cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNhbkFza0luc3RhbGxcIlxuICAgICAgICAgICAgOnRpdGxlPVwiYXNrQmxvY2tlZFwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWluc3RhbGxcIlxuICAgICAgICAgICAgQGNsaWNrPVwib3Blbkluc3RhbGxcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIEluc3RhbGzigKZcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgdi1pZj1cInJlc3RhcnRSZWFkeSAmJiByZXN0YXJ0V2h5XCJcbiAgICAgICAgICAgIGNsYXNzPVwic29mdF9fd2h5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtcmVzdGFydC13aHlcIlxuICAgICAgICAgID57eyByZXN0YXJ0V2h5IH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICB2LWVsc2UtaWY9XCIhcmVzdGFydFJlYWR5ICYmIGFza0Jsb2NrZWRcIlxuICAgICAgICAgICAgY2xhc3M9XCJzb2Z0X193aHlcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzb2Z0d2FyZS1pbnN0YWxsLXdoeVwiXG4gICAgICAgICAgPnt7IGFza0Jsb2NrZWQgfX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJpbnN0YWxsUmVmdXNhbFwiXG4gICAgICAgICAgY2xhc3M9XCJzb2Z0X19ub3RlIHNvZnRfX25vdGUtLXdhcm5cIlxuICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtaW5zdGFsbC1yZWZ1c2FsXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IGluc3RhbGxSZWZ1c2FsIH19XG4gICAgICAgIDwvcD5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPGgzIGNsYXNzPVwic29mdF9fc2VjdGlvblwiPlxuICAgICAgSG93IHVwZGF0ZXMgYXJyaXZlXG4gICAgPC9oMz5cbiAgICA8c2VjdGlvblxuICAgICAgY2xhc3M9XCJzb2Z0X19wYW5lbFwiXG4gICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLXBvbGljeVwiXG4gICAgPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCJhdXRvSW5zdGFsbCAhPT0gbnVsbFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic29mdF9fcm93XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInNvZnRfX3RpdGxlc1wiPlxuICAgICAgICAgICAgPGgzPkF1dG9tYXRpYyB1cGRhdGVzPC9oMz5cbiAgICAgICAgICAgIDxwIGRhdGEtdGlkPVwic29mdHdhcmUtYXV0by10ZXh0XCI+XG4gICAgICAgICAgICAgIHt7IGF1dG9UZXh0IH19XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICAgIDp2YWx1ZT1cImF1dG9JbnN0YWxsXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInNhdmluZyAhPT0gJydcIlxuICAgICAgICAgICAgbGFiZWw9XCJBdXRvbWF0aWMgdXBkYXRlc1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWF1dG9cIlxuICAgICAgICAgICAgQGlucHV0PVwic2V0RmxhZygnYXV0bycsICRldmVudClcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cInByZXNlbmNlICE9PSBudWxsXCJcbiAgICAgICAgICBjbGFzcz1cInNvZnRfX3Jvd1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic29mdF9fdGl0bGVzXCI+XG4gICAgICAgICAgICA8aDM+Q29uZmlybSBvbiB0aGUgcHJpbnRlciBiZWZvcmUgaW5zdGFsbGluZzwvaDM+XG4gICAgICAgICAgICA8cD5Tb21lb25lIHByZXNzZXMgdGhlIGtub2Igb24gdGhlIHByaW50ZXIgYmVmb3JlIGEgbmV3IHZlcnNpb24gaW5zdGFsbHMuPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICA6dmFsdWU9XCJwcmVzZW5jZVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJzYXZpbmcgIT09ICcnXCJcbiAgICAgICAgICAgIGxhYmVsPVwiQ29uZmlybSBvbiB0aGUgcHJpbnRlciBiZWZvcmUgaW5zdGFsbGluZ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLXByZXNlbmNlXCJcbiAgICAgICAgICAgIEBpbnB1dD1cInNldEZsYWcoJ3ByZXNlbmNlJywgJGV2ZW50KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cInBvbGljeU5vdGVcIlxuICAgICAgICAgIGNsYXNzPVwic29mdF9fbm90ZSBzb2Z0X19ub3RlLS13YXJuXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLXBvbGljeS1ub3RlXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHBvbGljeU5vdGUgfX1cbiAgICAgICAgPC9wPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDxwXG4gICAgICAgIHYtZWxzZVxuICAgICAgICBjbGFzcz1cInNvZnRfX25vdGVcIlxuICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLXBvbGljeS11bmtub3duXCJcbiAgICAgID5cbiAgICAgICAge3sgcG9saWN5TG9hZGVkID8gXCJUaGlzIHByaW50ZXIgZG9lc24ndCByZXBvcnQgaXRzIHVwZGF0ZSBzZXR0aW5ncyB5ZXQuXCIgOiAnQXNraW5nIHRoZSBwcmludGVy4oCmJyB9fVxuICAgICAgPC9wPlxuICAgICAgPGRpdiBjbGFzcz1cInNvZnRfX3Jvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic29mdF9fdGl0bGVzXCI+XG4gICAgICAgICAgPGgzPlRlbGwgbWUgd2hlbiBvbmUgaXMgcmVhZHk8L2gzPlxuICAgICAgICAgIDxwPkEgbm90aWNlIGluIHRoZSBiZWxsIGF0IHRoZSB0b3AuPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICA6dmFsdWU9XCJlbmFibGVOb3RpZmljYXRpb25zXCJcbiAgICAgICAgICBsYWJlbD1cIlRlbGwgbWUgd2hlbiBhbiB1cGRhdGUgaXMgcmVhZHlcIlxuICAgICAgICAgIEBpbnB1dD1cImVuYWJsZU5vdGlmaWNhdGlvbnMgPSAkZXZlbnRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwic29mdF9fcm93XCJcbiAgICAgICAgZGF0YS10aWQ9XCJzb2Z0d2FyZS1jaGFubmVsXCJcbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNvZnRfX3RpdGxlc1wiPlxuICAgICAgICAgIDxoMz5DaGFubmVsPC9oMz5cbiAgICAgICAgICA8cD5TdGFibGUuIEEgQmV0YSBjaGFubmVsIGNvbWVzIGhlcmUgd2hlbiB0aGVyZSBpcyBvbmUuPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzb2Z0X192YWx1ZVwiPlN0YWJsZTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxoMyBjbGFzcz1cInNvZnRfX3NlY3Rpb25cIj5cbiAgICAgIEhpc3RvcnlcbiAgICA8L2gzPlxuICAgIDxzZWN0aW9uXG4gICAgICBjbGFzcz1cInNvZnRfX3BhbmVsXCJcbiAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtaGlzdG9yeVwiXG4gICAgPlxuICAgICAgPGRpdlxuICAgICAgICB2LWZvcj1cIihlbnRyeSwgaSkgaW4gaGlzdG9yeVwiXG4gICAgICAgIDprZXk9XCJgJHtlbnRyeS5hdH0tJHtpfWBcIlxuICAgICAgICBjbGFzcz1cInNvZnRfX3JvdyBzb2Z0X19oaXN0XCJcbiAgICAgICAgOmRhdGEtb3V0Y29tZT1cImVudHJ5Lm91dGNvbWVcIlxuICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWhpc3Rvcnktcm93XCJcbiAgICAgID5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBjbGFzcz1cInNvZnRfX2hpc3QtaWNvXCJcbiAgICAgICAgICA6Y2xhc3M9XCJgc29mdF9faGlzdC1pY28tLSR7ZW50cnkub3V0Y29tZX1gXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICA6bmFtZT1cImVudHJ5Lm91dGNvbWUgPT09ICd1cGRhdGVkJyA/ICdjaGVjaycgOiAncmVmcmVzaCdcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzb2Z0X190aXRsZXNcIj5cbiAgICAgICAgICA8aDM+e3sgZW50cnlWZXJzaW9uKGVudHJ5KSB9fTwvaDM+XG4gICAgICAgICAgPHA+e3sgZW50cnlMaW5lKGVudHJ5KSB9fTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCIhaGlzdG9yeS5sZW5ndGhcIlxuICAgICAgICBjbGFzcz1cInNvZnRfX25vdGVcIlxuICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWhpc3RvcnktZW1wdHlcIlxuICAgICAgPlxuICAgICAgICB7eyBpbnN0YWxsZWQgIT09ICd1bmtub3duJyA/IGBPbiAke2luc3RhbGxlZH0uIFVwZGF0ZXMgaW5zdGFsbGVkIGZyb20gaGVyZSBhcmUgbGlzdGVkIGhlcmUuYCA6ICdVcGRhdGVzIGluc3RhbGxlZCBmcm9tIGhlcmUgYXJlIGxpc3RlZCBoZXJlLicgfX1cbiAgICAgIDwvcD5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8dGVtcGxhdGUgdi1pZj1cIm90aGVycy5sZW5ndGhcIj5cbiAgICAgIDxoMyBjbGFzcz1cInNvZnRfX3NlY3Rpb25cIj5cbiAgICAgICAgRGV2ZWxvcGVyIG1vZGUgb25seVxuICAgICAgPC9oMz5cbiAgICAgIDxsb2NrZWQtcm93XG4gICAgICAgIHYtaWY9XCJvdGhlcnNMb2NrZWRcIlxuICAgICAgICBsYWJlbD1cIk90aGVyIHNvZnR3YXJlXCJcbiAgICAgICAgcmVhc29uLXRleHQ9XCJVcGRhdGUgS2xpcHBlciwgTW9vbnJha2VyIG9yIHN5c3RlbSBwYWNrYWdlcyBvbiB0aGVpciBvd24uIE9uIGEgTXVvbiBwcmludGVyIHRoaXMgY2FuIGJyZWFrIHRoZSBtYXRjaGVkIHNldC5cIlxuICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLW90aGVycy1sb2NrZWRcIlxuICAgICAgLz5cbiAgICAgIDx0YXNrLWZvbGRcbiAgICAgICAgdi1lbHNlXG4gICAgICAgIHYtbW9kZWw9XCJvdGhlclNvZnR3YXJlT3BlblwiXG4gICAgICAgIGZvbGQtaWQ9XCJzZXR0aW5ncy1vdGhlci1zb2Z0d2FyZVwiXG4gICAgICAgIHRpdGxlPVwiT3RoZXIgc29mdHdhcmVcIlxuICAgICAgICBzdW1tYXJ5PVwiV2hhdCBlbHNlIHRoaXMgcHJpbnRlcidzIHVwZGF0ZXIgbG9va3MgYWZ0ZXJcIlxuICAgICAgICBjbGFzcz1cInNvZnRfX3BhbmVsXCJcbiAgICAgICAgZGF0YS10aWQ9XCJzb2Z0d2FyZS1vdGhlcnNcIlxuICAgICAgPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1mb3I9XCJjIGluIG90aGVyc1wiXG4gICAgICAgICAgOmtleT1cImMua2V5XCJcbiAgICAgICAgICBjbGFzcz1cInNvZnRfX3Jvd1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic29mdF9fdGl0bGVzXCI+XG4gICAgICAgICAgICA8aDM+e3sgYy50aXRsZSB9fTwvaDM+XG4gICAgICAgICAgICA8cD57eyBjLnRleHQgfX08L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1pZj1cImMudXBkYXRlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3kgfHwgISFvdGhlclVwZGF0ZUJsb2NrZWRcIlxuICAgICAgICAgICAgOnRpdGxlPVwib3RoZXJVcGRhdGVCbG9ja2VkXCJcbiAgICAgICAgICAgIEBjbGljaz1cInVwZGF0ZU90aGVyKGMua2V5KVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVXBkYXRlXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90YXNrLWZvbGQ+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDxyb3V0ZXItbGlua1xuICAgICAgOnRvPVwiYWNjZXNzVG9cIlxuICAgICAgY2xhc3M9XCJzb2Z0X19saW5rXCJcbiAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtYWNjZXNzLWxpbmtcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgIG5hbWU9XCJ1c2VyXCJcbiAgICAgICAgc21hbGxcbiAgICAgIC8+XG4gICAgICA8c3Bhbj48Yj5XaG8gbWF5IGluc3RhbGwgdXBkYXRlczwvYj4sIGFuZCBmcm9tIHdoZXJlLCBpcyBpbiBQZW9wbGUgYW5kIGFjY2Vzcy48L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cInNvZnRfX2xpbmstZ29cIj5QZW9wbGUgYW5kIGFjY2VzcyDigLo8L3NwYW4+XG4gICAgPC9yb3V0ZXItbGluaz5cblxuICAgIDx2LWRpYWxvZ1xuICAgICAgdi1tb2RlbD1cImluc3RhbGxEaWFsb2dcIlxuICAgICAgbWF4LXdpZHRoPVwiNDYwXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJpbnN0YWxsRGlhbG9nXCJcbiAgICAgICAgY2xhc3M9XCJzb2Z0X19kaWFsb2dcIlxuICAgICAgICBkYXRhLXRpZD1cInNvZnR3YXJlLWluc3RhbGwtZGlhbG9nXCJcbiAgICAgID5cbiAgICAgICAgPGgzPkluc3RhbGwge3sgaGVyb1RpdGxlIH19PzwvaDM+XG4gICAgICAgIDxwPnt7IHByaW50ZXJOYW1lIH19IHJlc3RhcnRzIGF0IHRoZSBlbmQsIGZvciBhYm91dCAzIG1pbnV0ZXMuIEV2ZXJ5b25lIHVzaW5nIGl0IHNlZXMgXCJVcGRhdGluZ1wiLjwvcD5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwic29mdF9fd2hlblwiXG4gICAgICAgICAgcm9sZT1cInJhZGlvZ3JvdXBcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJXaGVuIHRvIGluc3RhbGxcIlxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1mb3I9XCJ3IGluIHdoZW5PcHRpb25zXCJcbiAgICAgICAgICAgIDprZXk9XCJ3LnZhbHVlXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgcm9sZT1cInJhZGlvXCJcbiAgICAgICAgICAgIGNsYXNzPVwic29mdF9fd2hlbi1yb3dcIlxuICAgICAgICAgICAgOmFyaWEtY2hlY2tlZD1cIndoZW4gPT09IHcudmFsdWVcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiISF3LndoeVwiXG4gICAgICAgICAgICA6ZGF0YS10aWQ9XCJgc29mdHdhcmUtaW5zdGFsbC0ke3cudmFsdWV9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJ3aGVuID0gdy52YWx1ZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzb2Z0X190aXRsZXNcIj5cbiAgICAgICAgICAgICAgPGI+e3sgdy5sYWJlbCB9fTwvYj5cbiAgICAgICAgICAgICAgPHNtYWxsPnt7IHcud2h5IHx8IHcubGluZSB9fTwvc21hbGw+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNvZnRfX3RpY2tcIj5cbiAgICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgICB2LWlmPVwid2hlbiA9PT0gdy52YWx1ZVwiXG4gICAgICAgICAgICAgICAgbmFtZT1cImNoZWNrXCJcbiAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNvZnRfX2RpYWxvZy1idXR0b25zXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzb2Z0d2FyZS1pbnN0YWxsLWNhbmNlbFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJpbnN0YWxsRGlhbG9nID0gZmFsc2VcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIE5vdCBub3dcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiF3aGVuXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic29mdHdhcmUtaW5zdGFsbC1nb1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJjb25maXJtV2hlblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgSW5zdGFsbFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvdi1kaWFsb2c+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVHlwZWRDb21tYW5kc01peGluIGZyb20gJ0AvbWl4aW5zL3R5cGVkLWNvbW1hbmRzJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgeyBBQ1RJVkVfUEhBU0VTLCBiYW5uZXJWaXNpYmxlLCBjb21taXRQZW5kaW5nLCBpc1N0YWdlZCwgc3RhZ2VkVW52ZXJpZmllZCwgdmVyc2lvbkxhYmVsIH0gZnJvbSAnQC9zZXJ2aWNlcy91cGRhdGVzL21vZGVsJ1xuaW1wb3J0IHsgY3VycmVudE91dGNvbWUsIGluc3RhbGxTdGFydGVkLCBwb2xsLCB1cGRhdGVXYXRjaCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy93YXRjaCdcbmltcG9ydCB7IHNjb3BlZFBhdGggfSBmcm9tICdAL3JvdXRlci9wcmludGVyUGFnZVBhdGhzJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMgfSBmcm9tICdAL3V0aWwvcHJpbnRlci1uYW1lJ1xuaW1wb3J0IFRvZ2dsZVN3aXRjaCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Ub2dnbGVTd2l0Y2gudnVlJ1xuaW1wb3J0IFRhc2tGb2xkIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1Rhc2tGb2xkLnZ1ZSdcbmltcG9ydCBGcmFtZUljb24gZnJvbSAnQC9jb21wb25lbnRzL3VpL0ZyYW1lSWNvbi52dWUnXG5pbXBvcnQgTG9ja2VkUm93IGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9nYXRlcy9Mb2NrZWRSb3cudnVlJ1xuaW1wb3J0IE11b25HYXRlc01peGluIGZyb20gJ0AvbWl4aW5zL211b24tZ2F0ZXMnXG5pbXBvcnQgeyBhZnRlclByaW50LCBjYW5jZWxBZnRlclByaW50LCBsb2FkQWZ0ZXJQcmludCwgb3RhQ29tcG9uZW50LCBxdWV1ZUFmdGVyUHJpbnQsIHR5cGUgUXVldWVkSW5zdGFsbCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9hZnRlci1wcmludCdcbmltcG9ydCB7IGhpc3RvcnlMaW5lLCBsb2FkSGlzdG9yeSwgcHJpbnRlckhpc3RvcnksIHVwZGF0ZUhpc3RvcnksIHR5cGUgSGlzdG9yeUVudHJ5IH0gZnJvbSAnQC9zZXJ2aWNlcy91cGRhdGVzL2hpc3RvcnknXG5pbXBvcnQge1xuICBBVVRPX0lOU1RBTExfUEFUSCwgQVVUT19PRkZfVEVYVCwgQVVUT19PTl9URVhULCBLTk9CX1RFWFQsIFBSRVNFTkNFX1BBVEgsIFNUQUdFRF9URVhULFxuICBhbnlIb3QsIGZsYWdPZiwgbmVlZHNLbm9iLCByZXN0YXJ0QmxvY2tlZCwgc3RhZ2VkUmVhZHksIHR5cGUgUG9saWN5U3RhdHVzXG59IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9wb2xpY3knXG5pbXBvcnQgeyBjbGFzc2lmeVJlZnVzYWwsIGlzUGFuZWxPbmx5UmVmdXNhbCwgcGFuZWxPbmx5TWVzc2FnZSwgcGVybWlzc2lvbk1lc3NhZ2UgfSBmcm9tICdAL3NlcnZpY2VzL3dpZmkvcGFuZWwtb25seSdcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgdHlwZSB7IEhlYXRlciB9IGZyb20gJ0Avc3RvcmUvcHJpbnRlci90eXBlcydcblxuaW50ZXJmYWNlIEluc3RhbGxTbmFwc2hvdCB7XG4gIHRhcmdldDogdW5rbm93bjtcbiAgY29tcG9uZW50OiBzdHJpbmc7XG4gIGZyb206IHN0cmluZyB8IG51bGw7XG4gIHRvOiBzdHJpbmcgfCBudWxsO1xufVxuXG50eXBlIFdoZW4gPSAnbm93JyB8ICdhZnRlcidcblxuaW50ZXJmYWNlIE90aGVyQ29tcG9uZW50IHtcbiAga2V5OiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgdXBkYXRlOiBib29sZWFuO1xufVxuXG4vKipcbiAqIFNldHRpbmdzIOKAuiBVcGRhdGVzOiB0aGUgcHJpbnRlcidzIG93biBzb2Z0d2FyZSAoTXVvbk9TKSBhcyB0aGUgcHJpbnRlcidzXG4gKiBBdXggQVBJIHJlcG9ydHMgaXQ6IHdoYXQncyBpbnN0YWxsZWQsIHdoYXQncyByZWFkeSwgd2hlbiBpdCBsYXN0IGxvb2tlZCxcbiAqIGFuZCBJbnN0YWxsLCB3aGljaCBvcGVucyB0aGUgVXBkYXRpbmcgcGFnZS4gTW9vbnJha2VyJ3MgdXBkYXRlIHJvdyBmb3JcbiAqIE11b25PUyBzaG93cyBcIj9cIiBmb3IgaXRzIHZlcnNpb25zIChPdGFEZXBsb3kpLCBzbyB0aGlzIHJlYWRzIHRoZSBBdXggQVBJLlxuICogV2hhdGV2ZXIgZWxzZSB0aGUgdXBkYXRlciBsb29rcyBhZnRlciBpcyBhdmFpbGFibGUgaW4gYSBuZWFyYnkgZm9sZC5cbiAqXG4gKiBBdXRvbWF0aWMgdXBkYXRlcyAoS0FOLTE5MjUpOiBuZXcgdmVyc2lvbnMgYWx3YXlzIGRvd25sb2FkIGluIHRoZVxuICogYmFja2dyb3VuZDsgd2l0aCB0aGUgc3dpdGNoIG9uLCB0aGUgcHJpbnRlciBpbnN0YWxscyBhIHN0YWdlZCBvbmUgdGhlIG5leHRcbiAqIHRpbWUgaXQgcmVzdGFydHMsIGFuZCBcIlJlc3RhcnQgbm93IHRvIHVwZGF0ZVwiIGRvZXMgdGhhdCBub3cuIENvbnRyb2wgbmV2ZXJcbiAqIHJlc3RhcnRzIHRoZSBwcmludGVyIG9uIGl0cyBvd24uXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRvZ2dsZVN3aXRjaCwgVGFza0ZvbGQsIEZyYW1lSWNvbiwgTG9ja2VkUm93IH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvZnR3YXJlU2V0dGluZ3MgZXh0ZW5kcyBNaXhpbnMoVHlwZWRDb21tYW5kc01peGluLCBNdW9uR2F0ZXNNaXhpbikge1xuICBjaGVja2luZyA9IGZhbHNlXG4gIG90aGVyU29mdHdhcmVPcGVuID0gZmFsc2VcbiAgaW5zdGFsbFJlZnVzYWwgPSAnJ1xuICBhdXRvSW5zdGFsbDogYm9vbGVhbiB8IG51bGwgPSBudWxsXG4gIHByZXNlbmNlOiBib29sZWFuIHwgbnVsbCA9IG51bGxcbiAgcG9saWN5TG9hZGVkID0gZmFsc2VcbiAgcG9saWN5Tm90ZSA9ICcnXG4gIHNhdmluZyA9ICcnXG4gIGluc3RhbGxEaWFsb2cgPSBmYWxzZVxuICB3aGVuOiBXaGVuIHwgbnVsbCA9IG51bGxcbiAgcGVuZGluZzogSW5zdGFsbFNuYXBzaG90IHwgbnVsbCA9IG51bGxcblxuICBtb3VudGVkICgpIHtcbiAgICBwb2xsKClcbiAgICB0aGlzLmxvYWRQb2xpY3koKVxuICAgIHRoaXMubG9hZEtlcHQoKVxuICB9XG5cbiAgQFdhdGNoKCd3YXRjaGVkUHJpbnRlcicpXG4gIGxvYWRLZXB0ICgpIHtcbiAgICBsb2FkQWZ0ZXJQcmludCh0aGlzLndhdGNoZWRQcmludGVyKVxuICAgIGxvYWRIaXN0b3J5KHRoaXMud2F0Y2hlZFByaW50ZXIpXG4gIH1cblxuICBnZXQgd2F0Y2hlZFByaW50ZXIgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHVwZGF0ZVdhdGNoLnByaW50ZXJcbiAgfVxuXG4gIC8vIC0tIHRoZSBoZXJvIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBoZXJvSWNvbiAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5jaGlwLnRvbmUgPT09ICdvaycpIHJldHVybiAnY2hlY2snXG4gICAgaWYgKHRoaXMub3V0Y29tZVRleHQpIHJldHVybiAnYWxlcnQnXG4gICAgcmV0dXJuICdkb3dubG9hZCdcbiAgfVxuXG4gIC8qKiBcIk11b25PUyA2IE5vdmVtYmVyIDIwMjZcIjogdGhlIG9uZSByZWFkeSwgZWxzZSB0aGUgb25lIGl0IGhhcy4gKi9cbiAgZ2V0IGhlcm9UaXRsZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCB2ID0gdGhpcy5hdmFpbGFibGUgPyB0aGlzLnN0YXR1cz8udGFyZ2V0X3ZlcnNpb24gOiB0aGlzLnN0YXR1cz8uY3VycmVudF92ZXJzaW9uXG4gICAgcmV0dXJuIHYgPyBgTXVvbk9TICR7dmVyc2lvbkxhYmVsKHYpLnRleHQuc3BsaXQoJyDCtyAnKVswXX1gIDogJ011b25PUydcbiAgfVxuXG4gIGdldCBoZXJvU3ViICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zdGF0dXMpIHJldHVybiBcIlRoZSBwcmludGVyJ3Mgc3lzdGVtLCBLbGlwcGVyLCBpdHMgc2NyZWVuIGFuZCBDb250cm9sLCB1cGRhdGVkIHRvZ2V0aGVyLlwiXG4gICAgY29uc3QgaGF2ZSA9IHZlcnNpb25MYWJlbCh0aGlzLnN0YXR1cy5jdXJyZW50X3ZlcnNpb24pLnRleHQuc3BsaXQoJyDCtyAnKVswXVxuICAgIHJldHVybiB0aGlzLmF2YWlsYWJsZSA/IGBZb3UgaGF2ZSAke2hhdmV9IMK3IGNoZWNrZWQgJHt0aGlzLmNoZWNrZWRUZXh0fWAgOiBgVXAgdG8gZGF0ZSDCtyBjaGVja2VkICR7dGhpcy5jaGVja2VkVGV4dH1gXG4gIH1cblxuICBnZXQgbm90ZXNUZWFzZXIgKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm90ZXMgPSAodGhpcy5zdGF0dXM/LnJlbGVhc2Vfbm90ZXMgPz8gJycpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKClcbiAgICByZXR1cm4gbm90ZXMubGVuZ3RoID4gMTEwID8gYCR7bm90ZXMuc2xpY2UoMCwgMTA3KX3igKZgIDogbm90ZXNcbiAgfVxuXG4gIC8vIC0tIGluc3RhbGwgbm93IG9yIGFmdGVyIHRoaXMgcHJpbnQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0IHF1ZXVlZCAoKTogUXVldWVkSW5zdGFsbCB8IG51bGwge1xuICAgIHJldHVybiBhZnRlclByaW50LnByaW50ZXIgPT09IHRoaXMud2F0Y2hlZFByaW50ZXIgPyBhZnRlclByaW50LnF1ZXVlZCA6IG51bGxcbiAgfVxuXG4gIGdldCBxdWV1ZWRUZXh0ICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLnF1ZXVlZD8uZmlsZSA/IGAgKCR7dGhpcy5xdWV1ZWQuZmlsZS5yZXBsYWNlKC9cXC5nY29kZSQvaSwgJycpfSlgIDogJydcbiAgICByZXR1cm4gYEluc3RhbGxzIGFmdGVyIHRoaXMgcHJpbnQke2ZpbGV9LiAke3RoaXMucHJpbnRlck5hbWV9IGtlZXBzIHByaW50aW5nIHVudGlsIHRoZW4uYFxuICB9XG5cbiAgZ2V0IHByaW50RmlsZSAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXI/LnByaW50ZXI/LnByaW50X3N0YXRzPy5maWxlbmFtZSB8fCBudWxsXG4gIH1cblxuICAvKiogSW5zdGFsbOKApiBvcGVuczogZXZlcnl0aGluZyBidXQgXCJwcmludGluZ1wiLCB3aGljaCBvZmZlcnMgXCJhZnRlciB0aGlzIHByaW50XCIgaW5zdGVhZC4gKi9cbiAgZ2V0IGFza0Jsb2NrZWQgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMucHJpbnRlckJ1c3kgJiYgdGhpcy5hdmFpbGFibGUgJiYgdGhpcy5jb21tYW5kQ29udHJvbEF2YWlsYWJsZSAmJiB0aGlzLmtsaXBweUNvbm5lY3RlZCAmJiAhdGhpcy5hY3RpdmUpIHJldHVybiAnJ1xuICAgIHJldHVybiB0aGlzLmluc3RhbGxCbG9ja2VkXG4gIH1cblxuICBnZXQgY2FuQXNrSW5zdGFsbCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYXZhaWxhYmxlICYmICF0aGlzLmFza0Jsb2NrZWRcbiAgfVxuXG4gIGdldCB3aGVuT3B0aW9ucyAoKTogQXJyYXk8eyB2YWx1ZTogV2hlbiwgbGFiZWw6IHN0cmluZywgbGluZTogc3RyaW5nLCB3aHk6IHN0cmluZyB9PiB7XG4gICAgY29uc3QgYnVzeSA9IHRoaXMucHJpbnRlckJ1c3lcbiAgICByZXR1cm4gW1xuICAgICAgeyB2YWx1ZTogJ25vdycsIGxhYmVsOiAnSW5zdGFsbCBub3cnLCBsaW5lOiAnU3RhcnRzIHdyaXRpbmcgdGhlIHVwZGF0ZSBub3cuJywgd2h5OiBidXN5ID8gJ05vdCB3aGlsZSBwcmludGluZy4nIDogJycgfSxcbiAgICAgIHsgdmFsdWU6ICdhZnRlcicsIGxhYmVsOiAnSW5zdGFsbCBhZnRlciB0aGlzIHByaW50JywgbGluZTogdGhpcy5wcmludEZpbGUgPyBgV2hlbiAke3RoaXMucHJpbnRGaWxlLnJlcGxhY2UoL1xcLmdjb2RlJC9pLCAnJyl9IGVuZHMuYCA6ICdXaGVuIHRoZSBwcmludCBlbmRzLicsIHdoeTogYnVzeSA/ICcnIDogJ05vdGhpbmcgaXMgcHJpbnRpbmcuJyB9XG4gICAgXVxuICB9XG5cbiAgc25hcHNob3QgKCk6IEluc3RhbGxTbmFwc2hvdCB7XG4gICAgcmV0dXJuIHsgdGFyZ2V0OiB0aGlzLmNvbW1hbmRUYXJnZXQsIGNvbXBvbmVudDogdGhpcy5vdGFLZXksIGZyb206IHRoaXMuc3RhdHVzPy5jdXJyZW50X3ZlcnNpb24gPz8gbnVsbCwgdG86IHRoaXMuc3RhdHVzPy50YXJnZXRfdmVyc2lvbiA/PyBudWxsIH1cbiAgfVxuXG4gIG9wZW5JbnN0YWxsICgpIHtcbiAgICB0aGlzLmluc3RhbGxSZWZ1c2FsID0gdGhpcy5hc2tCbG9ja2VkXG4gICAgaWYgKCF0aGlzLmNhbkFza0luc3RhbGwpIHJldHVyblxuICAgIHRoaXMucGVuZGluZyA9IHRoaXMuc25hcHNob3QoKVxuICAgIHRoaXMud2hlbiA9IHRoaXMucHJpbnRlckJ1c3kgPyAnYWZ0ZXInIDogJ25vdydcbiAgICB0aGlzLmluc3RhbGxEaWFsb2cgPSB0cnVlXG4gIH1cblxuICBhc3luYyBjb25maXJtV2hlbiAoKSB7XG4gICAgY29uc3QgcGVuZGluZyA9IHRoaXMucGVuZGluZ1xuICAgIGNvbnN0IHdoZW4gPSB0aGlzLndoZW5cbiAgICB0aGlzLmluc3RhbGxEaWFsb2cgPSBmYWxzZVxuICAgIGlmICghcGVuZGluZyB8fCAhd2hlbikgcmV0dXJuXG4gICAgaWYgKHdoZW4gPT09ICdub3cnKSBhd2FpdCB0aGlzLmluc3RhbGwocGVuZGluZylcbiAgICBlbHNlIHRoaXMucXVldWVJbnN0YWxsKHBlbmRpbmcpXG4gIH1cblxuICAvKiogXCJBZnRlciB0aGlzIHByaW50XCI6IGtlcHQgdW50aWwgdGhlIHByaW50IGlzIG92ZXIsIHRoZW4gQXBwIHNlbmRzIGl0IChzZXJ2aWNlcy91cGRhdGVzL2FmdGVyLXByaW50KS4gKi9cbiAgcXVldWVJbnN0YWxsIChwZW5kaW5nOiBJbnN0YWxsU25hcHNob3QpIHtcbiAgICB0aGlzLmluc3RhbGxSZWZ1c2FsID0gJydcbiAgICBpZiAocGVuZGluZy50YXJnZXQgIT09IHRoaXMuY29tbWFuZFRhcmdldCkgdGhpcy5pbnN0YWxsUmVmdXNhbCA9ICdOb3Qga2VwdC4gVGhlIHNlbGVjdGVkIHByaW50ZXIgb3IgYWNjb3VudCBjaGFuZ2VkLiBUcnkgYWdhaW4uJ1xuICAgIGVsc2UgaWYgKHBlbmRpbmcudG8gIT09ICh0aGlzLnN0YXR1cz8udGFyZ2V0X3ZlcnNpb24gPz8gbnVsbCkpIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSAnTm90IGtlcHQuIFRoZSBhdmFpbGFibGUgdmVyc2lvbiBjaGFuZ2VkLiBDaGVjayBhZ2Fpbi4nXG4gICAgZWxzZSBpZiAoIXRoaXMucHJpbnRlckJ1c3kpIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSAnVGhlIHByaW50IGhhcyBlbmRlZDogaW5zdGFsbCBpdCBub3cgaW5zdGVhZC4nXG4gICAgZWxzZSBpZiAodGhpcy5hc2tCbG9ja2VkKSB0aGlzLmluc3RhbGxSZWZ1c2FsID0gYE5vdCBrZXB0LiAke3RoaXMuYXNrQmxvY2tlZH1gXG4gICAgaWYgKHRoaXMuaW5zdGFsbFJlZnVzYWwpIHJldHVyblxuICAgIHF1ZXVlQWZ0ZXJQcmludCh0aGlzLndhdGNoZWRQcmludGVyLCB7IGZyb206IHBlbmRpbmcuZnJvbSwgdG86IHBlbmRpbmcudG8sIGZpbGU6IHRoaXMucHJpbnRGaWxlLCBhdDogRGF0ZS5ub3coKSB9KVxuICB9XG5cbiAgY2FuY2VsUXVldWVkICgpIHtcbiAgICBjYW5jZWxBZnRlclByaW50KClcbiAgfVxuXG4gIC8vIC0tIGhpc3RvcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0IGhpc3RvcnkgKCk6IEhpc3RvcnlFbnRyeVtdIHtcbiAgICByZXR1cm4gcHJpbnRlckhpc3RvcnkodGhpcy5zdGF0dXMpID8/ICh1cGRhdGVIaXN0b3J5LnByaW50ZXIgPT09IHRoaXMud2F0Y2hlZFByaW50ZXIgPyB1cGRhdGVIaXN0b3J5LmVudHJpZXMgOiBbXSlcbiAgfVxuXG4gIGVudHJ5VmVyc2lvbiAoZW50cnk6IEhpc3RvcnlFbnRyeSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGVudHJ5LnZlcnNpb24gPyB2ZXJzaW9uTGFiZWwoZW50cnkudmVyc2lvbikudGV4dC5zcGxpdCgnIMK3ICcpWzBdIDogJ0FuIHVwZGF0ZSdcbiAgfVxuXG4gIGVudHJ5TGluZSAoZW50cnk6IEhpc3RvcnlFbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKGVudHJ5LmF0KS50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IGRheTogJ251bWVyaWMnLCBtb250aDogJ3Nob3J0JyB9KVxuICAgIHJldHVybiBgJHtoaXN0b3J5TGluZShlbnRyeSwgdGhpcy5wcmludGVyTmFtZSl9IMK3ICR7ZGF0ZX1gXG4gIH1cblxuICAvKiogT24gYSBNdW9uIHByaW50ZXIgdGhlIHBhcnRzIGFyZSB1cGRhdGVkIHRvZ2V0aGVyOyBvbmUgYXQgYSB0aW1lIGlzIGZvciBkZXZlbG9wZXIgbW9kZS4gKi9cbiAgZ2V0IG90aGVyc0xvY2tlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNNdW9uUHJpbnRlciA9PT0gdHJ1ZSAmJiAhdGhpcy5kZXZNb2RlRW5hYmxlZFxuICB9XG5cbiAgYXN5bmMgbG9hZFBvbGljeSAoKSB7XG4gICAgY29uc3QgZ2V0ID0gYXN5bmMgKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByID0gYXdhaXQgdGhpcy4kaHR0cENsaWVudC5nZXQodXJsLCB7IHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlIH0pXG4gICAgICAgIHJldHVybiByLnN0YXR1cyA+PSAyMDAgJiYgci5zdGF0dXMgPCAzMDAgPyByLmRhdGEgOiBudWxsXG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgW2F1dG8sIHByZXNlbmNlXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXQoQVVUT19JTlNUQUxMX1BBVEgpLCBnZXQoUFJFU0VOQ0VfUEFUSCldKVxuICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc3RhdHVzIGFzIFBvbGljeVN0YXR1cyB8IG51bGxcbiAgICB0aGlzLmF1dG9JbnN0YWxsID0gZmxhZ09mKGF1dG8sICdlbmFibGVkJykgPz8gKHR5cGVvZiBzdGF0dXM/LmF1dG9faW5zdGFsbCA9PT0gJ2Jvb2xlYW4nID8gc3RhdHVzLmF1dG9faW5zdGFsbCA6IG51bGwpXG4gICAgdGhpcy5wcmVzZW5jZSA9IGZsYWdPZihwcmVzZW5jZSwgJ3JlcXVpcmVkJykgPz8gKHR5cGVvZiBzdGF0dXM/Lmluc3RhbGxfcHJlc2VuY2VfcmVxdWlyZWQgPT09ICdib29sZWFuJyA/IHN0YXR1cy5pbnN0YWxsX3ByZXNlbmNlX3JlcXVpcmVkIDogbnVsbClcbiAgICB0aGlzLnBvbGljeUxvYWRlZCA9IHRydWVcbiAgfVxuXG4gIGdldCBhdXRvVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5hdXRvSW5zdGFsbCA/IEFVVE9fT05fVEVYVCA6IEFVVE9fT0ZGX1RFWFRcbiAgfVxuXG4gIC8qKiBTZW5kIHRoZSBvd25lcidzIGNob2ljZTsgdGhlIHByaW50ZXIga2VlcHMgd2hhdCBpdCBhY2NlcHRzIGFuZCByZWZ1c2VzIHRoZSByZXN0LiAqL1xuICBhc3luYyBzZXRGbGFnICh3aGljaDogJ2F1dG8nIHwgJ3ByZXNlbmNlJywgdmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5zYXZpbmcpIHJldHVyblxuICAgIHRoaXMuc2F2aW5nID0gd2hpY2hcbiAgICB0aGlzLnBvbGljeU5vdGUgPSAnJ1xuICAgIGNvbnN0IHVybCA9IHdoaWNoID09PSAnYXV0bycgPyBBVVRPX0lOU1RBTExfUEFUSCA6IFBSRVNFTkNFX1BBVEhcbiAgICBjb25zdCBib2R5ID0gd2hpY2ggPT09ICdhdXRvJyA/IHsgZW5hYmxlZDogdmFsdWUgfSA6IHsgcmVxdWlyZWQ6IHZhbHVlIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IHRoaXMuJGh0dHBDbGllbnQucG9zdCh1cmwsIGJvZHksIHsgdmFsaWRhdGVTdGF0dXM6ICgpID0+IHRydWUgfSlcbiAgICAgIGlmIChyLnN0YXR1cyA9PT0gMjAyIHx8IG5lZWRzS25vYihyLmRhdGEpKSB7XG4gICAgICAgIHRoaXMucG9saWN5Tm90ZSA9IGAke0tOT0JfVEVYVH0uIFRoZSBzZXR0aW5nIGNoYW5nZXMgd2hlbiB5b3UgZG8uYFxuICAgICAgfSBlbHNlIGlmIChyLnN0YXR1cyA+PSAyMDAgJiYgci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgY29uc3Qga2VwdCA9IGZsYWdPZihyLmRhdGEsIHdoaWNoID09PSAnYXV0bycgPyAnZW5hYmxlZCcgOiAncmVxdWlyZWQnKSA/PyB2YWx1ZVxuICAgICAgICBpZiAod2hpY2ggPT09ICdhdXRvJykgdGhpcy5hdXRvSW5zdGFsbCA9IGtlcHRcbiAgICAgICAgZWxzZSB0aGlzLnByZXNlbmNlID0ga2VwdFxuICAgICAgfSBlbHNlIGlmIChpc1BhbmVsT25seVJlZnVzYWwoeyByZXNwb25zZTogciB9KSkge1xuICAgICAgICB0aGlzLnBvbGljeU5vdGUgPSBwYW5lbE9ubHlNZXNzYWdlKCdjaGFuZ2UgaG93IGl0IHVwZGF0ZXMnKVxuICAgICAgfSBlbHNlIGlmIChjbGFzc2lmeVJlZnVzYWwoeyByZXNwb25zZTogciB9KS5raW5kID09PSAncGVybWlzc2lvbicpIHtcbiAgICAgICAgdGhpcy5wb2xpY3lOb3RlID0gcGVybWlzc2lvbk1lc3NhZ2UoY2xhc3NpZnlSZWZ1c2FsKHsgcmVzcG9uc2U6IHIgfSkgYXMgRXh0cmFjdDxSZXR1cm5UeXBlPHR5cGVvZiBjbGFzc2lmeVJlZnVzYWw+LCB7IGtpbmQ6ICdwZXJtaXNzaW9uJyB9PiwgISFjbG91ZFN0YXRlLmFjY291bnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBvbGljeU5vdGUgPSBcIlRoZSBwcmludGVyIGRpZG4ndCB0YWtlIHRoYXQgY2hhbmdlLiBUcnkgYWdhaW4uXCJcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMucG9saWN5Tm90ZSA9IFwiVGhlIHByaW50ZXIgZGlkbid0IGFuc3dlci4gVHJ5IGFnYWluLlwiXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuc2F2aW5nID0gJydcbiAgICB9XG4gIH1cblxuICAvKiogU3RhZ2VkLCBjaGVja2VkLCBhbmQgdGhlIHByaW50ZXIgaW5zdGFsbHMgaXQgb24gaXRzIG5leHQgcmVzdGFydC4gKi9cbiAgZ2V0IHJlc3RhcnRSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5hdXRvSW5zdGFsbCAmJiB0aGlzLmF2YWlsYWJsZSAmJiBzdGFnZWRSZWFkeSh0aGlzLnN0YXR1cylcbiAgfVxuXG4gIGdldCBzdGFnZWRUZXh0ICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBTVEFHRURfVEVYVFxuICB9XG5cbiAgZ2V0IGhvdCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGFueUhvdCgodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRIZWF0ZXJzJ10gYXMgSGVhdGVyW10pID8/IFtdKVxuICB9XG5cbiAgZ2V0IHJlc3RhcnRXaHkgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJlc3RhcnRCbG9ja2VkKHtcbiAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICBjYW5Db250cm9sOiB0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlLFxuICAgICAga2xpcHB5Q29ubmVjdGVkOiB0aGlzLmtsaXBweUNvbm5lY3RlZCxcbiAgICAgIHByaW50ZXJTdGF0ZTogdGhpcy5wcmludGVyU3RhdGUsXG4gICAgICBob3Q6IHRoaXMuaG90LFxuICAgICAgYWN0aXZlOiB0aGlzLmFjdGl2ZVxuICAgIH0pXG4gIH1cblxuICBhc3luYyByZXN0YXJ0VG9VcGRhdGUgKCkge1xuICAgIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSB0aGlzLnJlc3RhcnRXaHlcbiAgICBpZiAoIXRoaXMucmVzdGFydFJlYWR5IHx8IHRoaXMucmVzdGFydFdoeSkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5jb21tYW5kVGFyZ2V0XG4gICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5vdGFLZXlcbiAgICBjb25zdCBmcm9tVmVyc2lvbiA9IHRoaXMuc3RhdHVzPy5jdXJyZW50X3ZlcnNpb24gPz8gbnVsbFxuICAgIGNvbnN0IHRvVmVyc2lvbiA9IHRoaXMuc3RhdHVzPy50YXJnZXRfdmVyc2lvbiA/PyBudWxsXG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLiRjb25maXJtKFxuICAgICAgYCR7dGhpcy5wcmludGVyTmFtZX0gcmVzdGFydHMgaW50byB0aGUgbmV3IHZlcnNpb24gbm93LCB3aGljaCB0YWtlcyBhIGZldyBtaW51dGVzLiBEb24ndCB0dXJuIGl0IG9mZiB1bnRpbCBpdCBpcyBiYWNrLmAsXG4gICAgICB7IHRpdGxlOiAnUmVzdGFydCBub3cgdG8gdXBkYXRlPycsIGJ1dHRvblRydWVUZXh0OiAnUmVzdGFydCcsIGJ1dHRvbkZhbHNlVGV4dDogJ05vdCBub3cnIH1cbiAgICApXG4gICAgaWYgKCFvaykgcmV0dXJuXG4gICAgaWYgKHRhcmdldCAhPT0gdGhpcy5jb21tYW5kVGFyZ2V0KSB0aGlzLmluc3RhbGxSZWZ1c2FsID0gJ05vdCBzZW50LiBUaGUgc2VsZWN0ZWQgcHJpbnRlciBvciBhY2NvdW50IGNoYW5nZWQuIFRyeSBhZ2Fpbi4nXG4gICAgZWxzZSBpZiAoY29tcG9uZW50ICE9PSB0aGlzLm90YUtleSkgdGhpcy5pbnN0YWxsUmVmdXNhbCA9ICdOb3Qgc2VudC4gVGhlIHVwZGF0ZSBjb21wb25lbnQgY2hhbmdlZC4gQ2hlY2sgYWdhaW4uJ1xuICAgIGVsc2UgaWYgKHRvVmVyc2lvbiAhPT0gKHRoaXMuc3RhdHVzPy50YXJnZXRfdmVyc2lvbiA/PyBudWxsKSkgdGhpcy5pbnN0YWxsUmVmdXNhbCA9ICdOb3Qgc2VudC4gVGhlIHN0YWdlZCB1cGRhdGUgY2hhbmdlZC4gQ2hlY2sgYWdhaW4uJ1xuICAgIGVsc2UgaWYgKCF0aGlzLnJlc3RhcnRSZWFkeSB8fCB0aGlzLnJlc3RhcnRXaHkpIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSBgTm90IHNlbnQuICR7dGhpcy5yZXN0YXJ0V2h5IHx8ICdUaGUgdXBkYXRlIGlzIG5vIGxvbmdlciBzdGFnZWQuJ31gXG4gICAgaWYgKHRoaXMuaW5zdGFsbFJlZnVzYWwpIHJldHVyblxuICAgIC8vIFRoZSBwcmludGVyJ3Mgb3duIGluc3RhbGwgcm91dGU6IGl0IGFjdGl2YXRlcyB0aGUgc3RhZ2VkIHNsb3QgYW5kXG4gICAgLy8gcmVzdGFydHMsIGFuZCBrZWVwcyBpdHMgcHJlc2VuY2UgZ2F0ZSAoYSBrbm9iIHByZXNzKSB3aGVuIHRoYXQgaXMgb24uXG4gICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lVXBkYXRlQ2xpZW50KGNvbXBvbmVudClcbiAgICBpbnN0YWxsU3RhcnRlZChmcm9tVmVyc2lvbiwgdG9WZXJzaW9uKVxuICAgIGlmICh0aGlzLnByZXNlbmNlKSB0aGlzLmluc3RhbGxSZWZ1c2FsID0gYCR7S05PQl9URVhUfS4gVGhlIHByaW50ZXIgcmVzdGFydHMgd2hlbiB5b3UgZG8uYFxuICAgIHRoaXMuJHJvdXRlci5wdXNoKHRoaXMudXBkYXRpbmdUbykuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKVxuICB9XG5cbiAgZ2V0IGFjY2Vzc1RvICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpfSNhY2Nlc3NgXG4gIH1cblxuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKS5uYW1lXG4gIH1cblxuICBnZXQgc3RhdHVzICgpIHtcbiAgICByZXR1cm4gdXBkYXRlV2F0Y2guc3RhdHVzXG4gIH1cblxuICBnZXQgbG9ja2VkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJvdGVjdGlvbi9pc0xvY2tlZCddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIGdldCB1bmF2YWlsYWJsZVRleHQgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubG9ja2VkKSByZXR1cm4gJ05ldHdvcmsgcHJvdGVjdGlvbiBpcyBvbiwgc28gdXBkYXRlcyBhcmUgb25seSBtYW5hZ2VkIGZyb20gdGhlIHByaW50ZXJcXCdzIHBhbmVsIG9yIGEgZGV2aWNlIHBhaXJlZCB3aXRoIGl0LidcbiAgICByZXR1cm4gJ0Fza2luZyB0aGUgcHJpbnRlcuKApidcbiAgfVxuXG4gIC8qKiBXaGF0IHdhcyByZW1lbWJlcmVkLCBidXQgYW4gaW5zdGFsbCBcInVuZGVyIHdheVwiIG9ubHkgaWYgdGhlIHByaW50ZXIgaGFzIGNvbmZpcm1lZCBpdCBpbiB0aGlzIHBhZ2UgYW5kIGl0IGlzIHdpdGhpbiBpdHMgdGltZTogYSBzdGFsZSBlbnRyeSBuZXZlciBibG9ja3Mgb3IgYmFkZ2VzIGFueXRoaW5nLiAqL1xuICBnZXQgcmVtZW1iZXJlZCAoKSB7XG4gICAgY29uc3QgciA9IHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWRcbiAgICBpZiAociAmJiBBQ1RJVkVfUEhBU0VTLmluY2x1ZGVzKHIucGhhc2UpICYmICFiYW5uZXJWaXNpYmxlKHIsIHVwZGF0ZVdhdGNoLm5vdywgISF1cGRhdGVXYXRjaC5hbnN3ZXJlZCkpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIHJcbiAgfVxuXG4gIGdldCBhY3RpdmUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMucmVtZW1iZXJlZCAmJiBBQ1RJVkVfUEhBU0VTLmluY2x1ZGVzKHRoaXMucmVtZW1iZXJlZC5waGFzZSlcbiAgfVxuXG4gIGdldCBwcm9ncmVzcyAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3QgcCA9IHRoaXMucmVtZW1iZXJlZD8ucHJvZ3Jlc3MgPz8gdGhpcy5zdGF0dXM/LnByb2dyZXNzID8/IG51bGxcbiAgICByZXR1cm4gdHlwZW9mIHAgPT09ICdudW1iZXInID8gTWF0aC5yb3VuZChNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHApKSkgOiBudWxsXG4gIH1cblxuICBnZXQgYXZhaWxhYmxlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLnN0YXR1cz8udXBkYXRlX2F2YWlsYWJsZSAmJiAhIXRoaXMuc3RhdHVzLnRhcmdldF92ZXJzaW9uICYmIHRoaXMuc3RhdHVzLnRhcmdldF92ZXJzaW9uICE9PSB0aGlzLnN0YXR1cy5jdXJyZW50X3ZlcnNpb25cbiAgfVxuXG4gIGdldCBpbnN0YWxsZWQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZlcnNpb25MYWJlbCh0aGlzLnN0YXR1cz8uY3VycmVudF92ZXJzaW9uKS50ZXh0XG4gIH1cblxuICBnZXQgYXZhaWxhYmxlVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmVyc2lvbkxhYmVsKHRoaXMuc3RhdHVzPy50YXJnZXRfdmVyc2lvbikudGV4dFxuICB9XG5cbiAgZ2V0IGNoZWNrZWRUZXh0ICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGF0ID0gdGhpcy5zdGF0dXM/Lmxhc3RfY2hlY2tlZCA/IERhdGUucGFyc2UodGhpcy5zdGF0dXMubGFzdF9jaGVja2VkKSA6IE5hTlxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGF0KSkgcmV0dXJuICdub3QgeWV0J1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLnJvdW5kKChEYXRlLm5vdygpIC0gYXQpIC8gNjAwMDApXG4gICAgaWYgKG1pbnV0ZXMgPCAxKSByZXR1cm4gJ2p1c3Qgbm93J1xuICAgIGlmIChtaW51dGVzIDwgNjApIHJldHVybiBgJHttaW51dGVzfSBtaW4gYWdvYFxuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5yb3VuZChtaW51dGVzIC8gNjApXG4gICAgcmV0dXJuIGhvdXJzIDwgNDggPyBgJHtob3Vyc30gaCBhZ29gIDogYCR7TWF0aC5yb3VuZChob3VycyAvIDI0KX0gZGF5cyBhZ29gXG4gIH1cblxuICBnZXQgY2hpcCAoKTogeyB0ZXh0OiBzdHJpbmcsIHRvbmU6IHN0cmluZyB9IHtcbiAgICBpZiAoIXRoaXMuc3RhdHVzKSByZXR1cm4geyB0ZXh0OiAn4oCmJywgdG9uZTogJ211dGVkJyB9XG4gICAgY29uc3QgcGhhc2UgPSB0aGlzLnJlbWVtYmVyZWQ/LnBoYXNlXG4gICAgaWYgKHBoYXNlID09PSAnaW5zdGFsbGluZycpIHJldHVybiB7IHRleHQ6IHRoaXMucHJvZ3Jlc3MgIT09IG51bGwgPyBgVXBkYXRpbmcgwrcgJHt0aGlzLnByb2dyZXNzfSVgIDogJ1VwZGF0aW5nJywgdG9uZTogJ2J1c3knIH1cbiAgICBpZiAocGhhc2UgPT09ICdwcmVwYXJpbmcnKSByZXR1cm4geyB0ZXh0OiAnU3RhcnRpbmcgdGhlIHVwZGF0ZScsIHRvbmU6ICdidXN5JyB9XG4gICAgaWYgKHBoYXNlID09PSAncmVib290aW5nJykgcmV0dXJuIHsgdGV4dDogJ1Jlc3RhcnRpbmcnLCB0b25lOiAnYnVzeScgfVxuICAgIGlmIChwaGFzZSA9PT0gJ3ZlcmlmeWluZycgfHwgY29tbWl0UGVuZGluZyh0aGlzLnN0YXR1cyBhcyBuZXZlcikpIHJldHVybiB7IHRleHQ6ICdDaGVja2luZyB0aGUgdXBkYXRlJywgdG9uZTogJ2J1c3knIH1cbiAgICAvLyBTdGFnZWQgb24gdGhlIHNwYXJlIHNsb3QgYW5kIHdhaXRpbmcgZm9yIGEgcGVyc29uOiBhIHF1aWV0IGJhZGdlLCBuZXZlciBcImNoZWNraW5nXCIuXG4gICAgaWYgKHRoaXMucmVzdGFydFJlYWR5KSByZXR1cm4geyB0ZXh0OiBTVEFHRURfVEVYVCwgdG9uZTogJ3dhcm4nIH1cbiAgICBpZiAoaXNTdGFnZWQodGhpcy5zdGF0dXMgYXMgbmV2ZXIpKSByZXR1cm4geyB0ZXh0OiAnVXBkYXRlIHJlYWR5IHRvIGluc3RhbGwnLCB0b25lOiAnd2FybicgfVxuICAgIGlmICh0aGlzLmF2YWlsYWJsZSkgcmV0dXJuIHsgdGV4dDogJ1VwZGF0ZSByZWFkeScsIHRvbmU6ICd3YXJuJyB9XG4gICAgcmV0dXJuIHsgdGV4dDogJ1VwIHRvIGRhdGUnLCB0b25lOiAnb2snIH1cbiAgfVxuXG4gIGdldCBvdXRjb21lVGV4dCAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBvID0gY3VycmVudE91dGNvbWUoKVxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLnN0YXR1cz8uc2Vzc2lvbj8uZXJyb3I/Lm1lc3NhZ2VcbiAgICBpZiAobyA9PT0gJ3JvbGxlZF9iYWNrJykgcmV0dXJuIGBUaGUgbGFzdCB1cGRhdGUgZGlkbid0IGNvbXBsZXRlLCBzbyB0aGUgcHJpbnRlciB3ZW50IGJhY2sgdG8gdGhlIHZlcnNpb24gaXQgaGFkLiR7bWVzc2FnZSA/IGAgJHttZXNzYWdlfWAgOiAnJ31gXG4gICAgaWYgKG8gPT09ICdmYWlsZWQnKSByZXR1cm4gYFRoZSBsYXN0IHVwZGF0ZSBkaWRuJ3QgaW5zdGFsbDsgbm90aGluZyBjaGFuZ2VkLiR7bWVzc2FnZSA/IGAgJHttZXNzYWdlfWAgOiAnJ31gXG4gICAgaWYgKHRoaXMuc3RhdHVzPy5zdGF0ZSA9PT0gJ2ZhaWxlZCcgJiYgdGhpcy5zdGF0dXMuZXJyb3IpIHJldHVybiB0aGlzLnN0YXR1cy5lcnJvclxuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgZ2V0IGluc3RhbGxCbG9ja2VkICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5jb21tYW5kQ29udHJvbEF2YWlsYWJsZSkgcmV0dXJuICdDb25uZWN0IHRvIGEgcHJpbnRlciB5b3UgY2FuIGNvbnRyb2wgZmlyc3QuJ1xuICAgIGlmICghdGhpcy5rbGlwcHlDb25uZWN0ZWQpIHJldHVybiAnS2xpcHBlciBpcyBub3QgY29ubmVjdGVkLidcbiAgICBpZiAodGhpcy5wcmludGVyQnVzeSkgcmV0dXJuICdOb3Qgd2hpbGUgcHJpbnRpbmcuJ1xuICAgIGlmICh0aGlzLmFjdGl2ZSkgcmV0dXJuICdBbiB1cGRhdGUgaXMgYWxyZWFkeSB1bmRlciB3YXkuJ1xuICAgIGlmIChjb21taXRQZW5kaW5nKHRoaXMuc3RhdHVzIGFzIG5ldmVyKSkgcmV0dXJuICdUaGUgcHJpbnRlciBpcyBzdGlsbCBjaGVja2luZyB0aGUgbGFzdCB1cGRhdGUuJ1xuICAgIC8vIFRoZSBzdGFnZWQgcmVjb3JkIGNhbm5vdCBwcm92ZSB0aGUgc3BhcmUgc2xvdCBzdGlsbCBob2xkcyB0aGF0IHZlcnNpb24gKGVtcHR5IHNsb3QgZmluZ2VycHJpbnQsIEtBTi0xMzY0KS5cbiAgICBpZiAoc3RhZ2VkVW52ZXJpZmllZCh0aGlzLnN0YXR1cyBhcyBuZXZlcikpIHJldHVybiBcIkFuIHVwZGF0ZSBpcyBzdGFnZWQsIGJ1dCBpdCBjYW4ndCBiZSBjaGVja2VkIGZyb20gaGVyZSB5ZXQuIEluc3RhbGwgaXQgZnJvbSB0aGUgcHJpbnRlcidzIHNjcmVlbi5cIlxuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgZ2V0IGNhbkluc3RhbGwgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmF2YWlsYWJsZSAmJiAhdGhpcy5pbnN0YWxsQmxvY2tlZCAmJiB0aGlzLmtsaXBweUNvbm5lY3RlZFxuICB9XG5cbiAgZ2V0IHVwZGF0aW5nVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy91cGRhdGluZycsIGFjdGl2ZVNsdWcoKSlcbiAgfVxuXG4gIC8qKiBUaGUgdXBkYXRlcidzIG5hbWUgZm9yIE11b25PUzogdGhlIGNvbXBvbmVudCBvZiB0eXBlIG90YS4gKi9cbiAgZ2V0IG90YUtleSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gb3RhQ29tcG9uZW50KHRoaXMuJHN0b3JlLnN0YXRlLnZlcnNpb24udmVyc2lvbl9pbmZvKVxuICB9XG5cbiAgLyoqIEluc3RhbGwgbm93LiBGcm9tIHRoZSBJbnN0YWxsIGRpYWxvZyBpdHMgc25hcHNob3QgaXMgdGhlIGNvbmZpcm1hdGlvbjsgY2FsbGVkIGFsb25lLCBpdCBhc2tzIGZpcnN0LiAqL1xuICBhc3luYyBpbnN0YWxsIChhc2tlZD86IEluc3RhbGxTbmFwc2hvdCkge1xuICAgIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSB0aGlzLmluc3RhbGxCbG9ja2VkXG4gICAgaWYgKCF0aGlzLmNhbkluc3RhbGwpIHJldHVyblxuICAgIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSAnJ1xuICAgIGNvbnN0IHsgdGFyZ2V0LCBjb21wb25lbnQsIGZyb206IGZyb21WZXJzaW9uLCB0bzogdG9WZXJzaW9uIH0gPSBhc2tlZCA/PyB0aGlzLnNuYXBzaG90KClcbiAgICBpZiAoIWFza2VkKSB7XG4gICAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICAgIGAke3RoaXMucHJpbnRlck5hbWV9IHdyaXRlcyB0aGUgbmV3IHZlcnNpb24gd2hpbGUgaXQga2VlcHMgd29ya2luZywgdGhlbiByZXN0YXJ0cyBpbnRvIGl0LCB3aGljaCB0YWtlcyBhIGZldyBtaW51dGVzLiBEb24ndCB0dXJuIGl0IG9mZiB1bnRpbCBpdCBpcyBiYWNrLmAsXG4gICAgICAgIHsgdGl0bGU6ICdJbnN0YWxsIHRoZSB1cGRhdGUgbm93PycsIGJ1dHRvblRydWVUZXh0OiAnSW5zdGFsbCcsIGJ1dHRvbkZhbHNlVGV4dDogJ05vdCBub3cnIH1cbiAgICAgIClcbiAgICAgIGlmICghb2spIHJldHVyblxuICAgIH1cbiAgICBpZiAodGFyZ2V0ICE9PSB0aGlzLmNvbW1hbmRUYXJnZXQpIHRoaXMuaW5zdGFsbFJlZnVzYWwgPSAnTm90IHNlbnQuIFRoZSBzZWxlY3RlZCBwcmludGVyIG9yIGFjY291bnQgY2hhbmdlZC4gVHJ5IGFnYWluLidcbiAgICBlbHNlIGlmIChjb21wb25lbnQgIT09IHRoaXMub3RhS2V5KSB0aGlzLmluc3RhbGxSZWZ1c2FsID0gJ05vdCBzZW50LiBUaGUgdXBkYXRlIGNvbXBvbmVudCBjaGFuZ2VkLiBDaGVjayBhZ2Fpbi4nXG4gICAgZWxzZSBpZiAoZnJvbVZlcnNpb24gIT09ICh0aGlzLnN0YXR1cz8uY3VycmVudF92ZXJzaW9uID8/IG51bGwpIHx8IHRvVmVyc2lvbiAhPT0gKHRoaXMuc3RhdHVzPy50YXJnZXRfdmVyc2lvbiA/PyBudWxsKSkgdGhpcy5pbnN0YWxsUmVmdXNhbCA9ICdOb3Qgc2VudC4gVGhlIGF2YWlsYWJsZSB2ZXJzaW9uIGNoYW5nZWQuIENoZWNrIGFnYWluLidcbiAgICBlbHNlIGlmICghdGhpcy5hdmFpbGFibGUgfHwgdGhpcy5pbnN0YWxsQmxvY2tlZCkgdGhpcy5pbnN0YWxsUmVmdXNhbCA9IGBOb3Qgc2VudC4gJHt0aGlzLmluc3RhbGxCbG9ja2VkIHx8ICdUaGUgdXBkYXRlIGlzIG5vIGxvbmdlciBhdmFpbGFibGUuJ31gXG4gICAgaWYgKHRoaXMuaW5zdGFsbFJlZnVzYWwpIHJldHVyblxuICAgIFNvY2tldEFjdGlvbnMubWFjaGluZVVwZGF0ZUNsaWVudChjb21wb25lbnQpXG4gICAgaW5zdGFsbFN0YXJ0ZWQoZnJvbVZlcnNpb24sIHRvVmVyc2lvbilcbiAgICB0aGlzLiRyb3V0ZXIucHVzaCh0aGlzLnVwZGF0aW5nVG8pLmNhdGNoKCgpID0+IHVuZGVmaW5lZClcbiAgfVxuXG4gIGFzeW5jIGNoZWNrICgpIHtcbiAgICB0aGlzLmNoZWNraW5nID0gdHJ1ZVxuICAgIHRyeSB7XG4gICAgICBTb2NrZXRBY3Rpb25zLm1hY2hpbmVVcGRhdGVSZWZyZXNoKHRoaXMub3RhS2V5KVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDMwMDApKVxuICAgICAgYXdhaXQgcG9sbCgpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2hlY2tpbmcgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIGdldCBlbmFibGVOb3RpZmljYXRpb25zICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVWZXJzaW9uTm90aWZpY2F0aW9uc1xuICB9XG5cbiAgc2V0IGVuYWJsZU5vdGlmaWNhdGlvbnMgKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywgeyBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLmVuYWJsZVZlcnNpb25Ob3RpZmljYXRpb25zJywgdmFsdWUsIHNlcnZlcjogdHJ1ZSB9KVxuICB9XG5cbiAgZ2V0IGJ1c3kgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuJHN0b3JlLnN0YXRlLnZlcnNpb24uYnVzeVxuICB9XG5cbiAgZ2V0IG90aGVyVXBkYXRlQmxvY2tlZCAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuY29tbWFuZENvbnRyb2xBdmFpbGFibGUpIHJldHVybiAnQ29ubmVjdCB0byBhIHByaW50ZXIgeW91IGNhbiBjb250cm9sIGZpcnN0LidcbiAgICBpZiAoIXRoaXMua2xpcHB5Q29ubmVjdGVkKSByZXR1cm4gJ0tsaXBwZXIgaXMgbm90IGNvbm5lY3RlZC4nXG4gICAgaWYgKHRoaXMucHJpbnRlckJ1c3kpIHJldHVybiAnTm90IHdoaWxlIHByaW50aW5nLidcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8qKiBFdmVyeXRoaW5nIGVsc2UgdGhlIHVwZGF0ZXIgbGlzdHM6IHRoZSBPUyBwYWNrYWdlcyBhbmQgYW55IG90aGVyIGNsaWVudC4gKi9cbiAgZ2V0IG90aGVycyAoKTogT3RoZXJDb21wb25lbnRbXSB7XG4gICAgY29uc3QgaW5mbyA9ICh0aGlzLiRzdG9yZS5zdGF0ZS52ZXJzaW9uLnZlcnNpb25faW5mbyA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgdW5rbm93bj4+XG4gICAgY29uc3QgaGFzVXBkYXRlID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1sndmVyc2lvbi9oYXNVcGRhdGUnXSBhcyAoa2V5OiBzdHJpbmcpID0+IGJvb2xlYW5cbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaW5mbylcbiAgICAgIC5maWx0ZXIoKFssIGNdKSA9PiBjLmNvbmZpZ3VyZWRfdHlwZSAhPT0gJ290YScpXG4gICAgICAubWFwKChba2V5LCBjXSkgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGUgPSBoYXNVcGRhdGUoa2V5KVxuICAgICAgICBpZiAoa2V5ID09PSAnc3lzdGVtJykge1xuICAgICAgICAgIGNvbnN0IG4gPSBOdW1iZXIoYy5wYWNrYWdlX2NvdW50ID8/IDApXG4gICAgICAgICAgcmV0dXJuIHsga2V5LCB0aXRsZTogJ1RoZSBzeXN0ZW1cXCdzIHBhY2thZ2VzJywgdGV4dDogbiA/IGAke259IHRvIHVwZGF0ZWAgOiAnVXAgdG8gZGF0ZScsIHVwZGF0ZSB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IFN0cmluZyhjLnZlcnNpb24gPz8gYy5mdWxsX3ZlcnNpb25fc3RyaW5nID8/ICcnKVxuICAgICAgICBjb25zdCByZW1vdGUgPSBTdHJpbmcoYy5yZW1vdGVfdmVyc2lvbiA/PyAnJylcbiAgICAgICAgcmV0dXJuIHsga2V5LCB0aXRsZToga2V5LCB0ZXh0OiB1cGRhdGUgPyBgJHt2ZXJzaW9ufSDihpIgJHtyZW1vdGV9YCA6IHZlcnNpb24gfHwgJ1VwIHRvIGRhdGUnLCB1cGRhdGUgfVxuICAgICAgfSlcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZU90aGVyIChrZXk6IHN0cmluZykge1xuICAgIGlmICh0aGlzLm90aGVyVXBkYXRlQmxvY2tlZCkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5jb21tYW5kVGFyZ2V0XG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLiRjb25maXJtKCdUaGUgcHJpbnRlciBtdXN0IGJlIGlkbGUuIEl0IG1heSByZXN0YXJ0IGFmdGVyIHRoaXMgY29tcG9uZW50IGlzIHVwZGF0ZWQuJywge1xuICAgICAgdGl0bGU6IGBVcGRhdGUgJHtrZXl9P2AsIGJ1dHRvblRydWVUZXh0OiAnVXBkYXRlJywgYnV0dG9uRmFsc2VUZXh0OiAnTm90IG5vdydcbiAgICB9KVxuICAgIGlmICghb2sgfHwgdGFyZ2V0ICE9PSB0aGlzLmNvbW1hbmRUYXJnZXQgfHwgdGhpcy5vdGhlclVwZGF0ZUJsb2NrZWQpIHJldHVyblxuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCd2ZXJzaW9uL29uVXBkYXRlU3RhdHVzJywgeyBidXN5OiB0cnVlIH0pXG4gICAgaWYgKGtleSA9PT0gJ3N5c3RlbScpIFNvY2tldEFjdGlvbnMubWFjaGluZVVwZGF0ZVN5c3RlbSgpXG4gICAgZWxzZSBTb2NrZXRBY3Rpb25zLm1hY2hpbmVVcGRhdGVDbGllbnQoa2V5KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuc29mdF9fbGluayB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBwYWRkaW5nOiAxNHB4IDE4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMThweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuXG4gICAgLnNvZnRfX2xpbmstZ28ge1xuICAgICAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCwgIzdmZDZjZik7XG4gICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIH1cbiAgfVxuXG4gIC5zb2Z0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxNnB4O1xuICB9XG5cbiAgLnNvZnRfX3BhbmVsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxNHB4O1xuICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5zb2Z0X19oZWFkLFxuICAuc29mdF9fcm93IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogMTJweDtcbiAgfVxuXG4gIC5zb2Z0X19yb3cgKyAuc29mdF9fcm93IHtcbiAgICBwYWRkaW5nLXRvcDogMTJweDtcbiAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gIH1cblxuICAuc29mdF9fdGl0bGVzIHtcbiAgICBtaW4td2lkdGg6IDA7XG5cbiAgICBoMiB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBmb250LXNpemU6IDE3cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgIH1cblxuICAgIGgzIHtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDJweCAwIDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5zb2Z0X19jaGlwIHtcbiAgICBmbGV4OiBub25lO1xuICAgIHBhZGRpbmc6IDRweCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLnNvZnRfX2NoaXAtLW9rIHsgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzLCAjNTdjMDhhKTsgfVxuICAuc29mdF9fY2hpcC0td2FybiB7IGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZywgI2U4OTYzYyk7IH1cbiAgLnNvZnRfX2NoaXAtLWJ1c3kgeyBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7IH1cbiAgLnNvZnRfX2NoaXAtLW11dGVkIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IH1cblxuICAuc29mdF9fZmFjdHMge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maXQsIG1pbm1heCgxODBweCwgMWZyKSk7XG4gICAgZ2FwOiAxMHB4O1xuICAgIG1hcmdpbjogMDtcblxuICAgIGRpdiB7XG4gICAgICBwYWRkaW5nOiAxMHB4IDEycHg7XG4gICAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgfVxuXG4gICAgZHQge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICB9XG5cbiAgICBkZCB7XG4gICAgICBtYXJnaW46IDJweCAwIDA7XG4gICAgICBmb250LXNpemU6IDE1cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgIH1cbiAgfVxuXG4gIC5zb2Z0X19wcm9ncmVzcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgfVxuXG4gIC5zb2Z0X19iYXIge1xuICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIGhlaWdodDogOHB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG5cbiAgICBpIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC42cyB2YXIoLS1tM2QtZWFzZSwgZWFzZSk7XG4gICAgfVxuICB9XG5cbiAgLnNvZnRfX2xpbmsge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgfVxuXG4gIC5zb2Z0X19ub3RlIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAuc29mdF9fbm90ZS0td2FybiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nLCAjZTg5NjNjKTtcbiAgfVxuXG4gIC5zb2Z0X19ub3RlcyB7XG4gICAgcGFkZGluZzogMTBweCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuXG4gICAgc3VtbWFyeSB7XG4gICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgIH1cblxuICAgIHAge1xuICAgICAgbWFyZ2luOiA4cHggMCAwO1xuICAgICAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICAgIH1cbiAgfVxuXG4gIC5zb2Z0X19hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLnNvZnRfX3doeSB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG4gIC5zb2Z0X19zZWN0aW9uIHtcbiAgICBtYXJnaW46IDZweCA0cHggLTZweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjA4ZW07XG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgfVxuXG4gIC5zb2Z0X19oZXJvIC5zb2Z0X19oZWFkIHtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gIH1cblxuICAuc29mdF9faGVybyAuc29mdF9fdGl0bGVzIHtcbiAgICBmbGV4OiAxIDEgYXV0bztcblxuICAgIGgyIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICB9XG4gIH1cblxuICAuc29mdF9faGVyby1pY28ge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogNDRweDtcbiAgICBoZWlnaHQ6IDQ0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuc29mdF9faGVyby1pY28tLW9rIHsgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzLCAjNTdjMDhhKTsgfVxuXG4gIC5zb2Z0X19leWVicm93IHtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4wOGVtO1xuICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIH1cblxuICAuc29mdF9fY2hlY2sge1xuICAgIGZsZXg6IG5vbmU7XG4gIH1cblxuICAuc29mdF9fZ28ge1xuICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIG1pbi1oZWlnaHQ6IDQ0cHg7XG4gIH1cblxuICAuc29mdF9fdmFsdWUge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAuc29mdF9fcXVldWVkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICAgIHBhZGRpbmc6IDEwcHggMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcblxuICAgIHNwYW4ge1xuICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgfVxuICB9XG5cbiAgLnNvZnRfX2hpc3Qge1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgfVxuXG4gIC5zb2Z0X19oaXN0LWljbyB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiAzMnB4O1xuICAgIGhlaWdodDogMzJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtc3VjY2VzcywgIzU3YzA4YSk7XG4gIH1cblxuICAuc29mdF9faGlzdC1pY28tLXJvbGxlZF9iYWNrLFxuICAuc29mdF9faGlzdC1pY28tLWZhaWxlZCB7IGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZywgI2U4OTYzYyk7IH1cblxuICAuc29mdF9fZGlhbG9nIHtcbiAgICBwYWRkaW5nOiAyMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG5cbiAgICBoMyB7XG4gICAgICBtYXJnaW46IDAgMCA2cHg7XG4gICAgICBmb250LXNpemU6IDE5cHg7XG4gICAgfVxuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDAgMCAxNHB4O1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB9XG4gIH1cblxuICAuc29mdF9fd2hlbiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5zb2Z0X193aGVuLXJvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWluLWhlaWdodDogNTZweDtcbiAgICBwYWRkaW5nOiAxMHB4IDE0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuXG4gICAgJiArICYge1xuICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIH1cblxuICAgIHNtYWxsIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICB9XG5cbiAgICAmOmRpc2FibGVkIHtcbiAgICAgIG9wYWNpdHk6IDAuNTU7XG4gICAgfVxuICB9XG5cbiAgLnNvZnRfX3RpY2sge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDIycHg7XG4gICAgaGVpZ2h0OiAyMnB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuc29mdF9fZGlhbG9nLWJ1dHRvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZ2FwOiAxMHB4O1xuICAgIG1hcmdpbi10b3A6IDE2cHg7XG5cbiAgICAuY2J0biB7XG4gICAgICBtaW4taGVpZ2h0OiA0NHB4O1xuICAgIH1cblxuICAgIC5jYnRuLS1wcmltYXJ5IHtcbiAgICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL1NvZnR3YXJlU2V0dGluZ3MudnVlIn0=