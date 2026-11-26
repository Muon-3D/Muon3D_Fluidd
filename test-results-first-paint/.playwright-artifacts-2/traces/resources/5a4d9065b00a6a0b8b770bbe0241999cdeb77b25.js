/* unplugin-vue-components disabled */import { VDialog as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { useAuxApi } from "/src/aux_api/useAuxApi.ts";
import { devModeState, refreshDevMode } from "/src/services/dev-mode/state.ts";
import {
  requestChange,
  completeChange,
  readAnswer,
  watchState,
  confirmationRequired,
  whoMayAsk,
  whyNot,
  DevModeRefused
} from "/src/services/dev-mode/request.ts";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
const CONSENT_POLL_MS = 1500;
const DEFAULT_WAIT_SECONDS = 120;
const TIMED_OUT = "Nobody confirmed on the printer's screen in time. Nothing changed.";
const DECLINED = "It was declined on the printer's screen. Nothing changed.";
let DeveloperModeSettings = class extends Vue {
  api = useAuxApi().devMode;
  state = devModeState;
  /** Who may ask, as the printer said; null until it has. */
  asking = null;
  askingError = "";
  changeDialog = false;
  /** What the open dialog is about: true turns it on, false turns it off. */
  target = false;
  accepted = false;
  loading = false;
  /** The change waiting on the printer's screen. */
  pending = null;
  consentInstruction = "";
  secondsRemaining = 0;
  awaiting = false;
  errorMessage = "";
  /** The SSH address was just copied. */
  copied = false;
  pollTimer = null;
  countdownTimer = null;
  /** Asks in a row the printer didn't answer. */
  pollFailures = 0;
  /** A read of the printer's answer is on its way: a slow link must not stack another behind it. */
  reading = false;
  mounted() {
    refreshDevMode();
    this.refreshAsking();
  }
  beforeDestroy() {
    this.stopWaiting();
  }
  get busy() {
    return this.loading || this.awaiting;
  }
  get mayAsk() {
    return this.asking?.mayAsk === true;
  }
  /** Why there is no switch, when there isn't one. */
  get notAsking() {
    if (this.state.enabled === null) return "";
    if (this.askingError) return this.askingError;
    return whyNot(this.asking) ?? "";
  }
  get stateLine() {
    if (this.state.enabled === null) return "Asking the printer\u2026";
    return this.state.enabled ? "On" : "Off";
  }
  /**
   * An admin build: the printer says turning developer mode on needs no
   * warranty release (its guard is disarmed). Anything else, including an
   * answer that isn't there, counts as a release build, which fails closed:
   * the warranty line is shown and the SSH address is not.
   */
  get adminBuild() {
    return this.state.canManage === true && this.state.guardArmed === false && this.state.otpArmed !== true;
  }
  /** What developer mode is and what it changes. */
  get whatLine() {
    if (this.state.enabled) {
      return "The printer is running your copy of its configuration and macros. You can edit them and its files. The Muon3D defaults stay as they are beside your copy.";
    }
    return "Developer mode lets you change this printer's own configuration and macros, and edit its files. The Muon3D defaults stay as they are beside your copy.";
  }
  /** Release builds only: the warranty. */
  get warrantyLine() {
    return this.state.enabled ? "The warranty ended when you first turned this on." : "The first time you turn it on, the warranty ends, even if you turn it off again.";
  }
  get offLine() {
    return this.state.enabled ? "Turn it off with the switch to go back to the Muon3D defaults. Your copy is kept for next time." : "Once it is on, you can turn it off any time with the switch. The printer then goes back to the Muon3D defaults, and your copy is kept.";
  }
  /**
   * The SSH address, on an admin build with developer mode on, and nowhere
   * else. Empty (so no row) unless the printer has said it is an admin build
   * AND given its own name.
   */
  get sshAddress() {
    if (!this.adminBuild || this.state.enabled !== true) return "";
    const host = (this.$store?.state?.printer?.printer?.info?.hostname ?? "").trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(host)) return "";
    return `ssh root@${host}.local`;
  }
  async copySsh() {
    try {
      await navigator.clipboard.writeText(this.sshAddress);
      this.copied = true;
      window.setTimeout(() => {
        this.copied = false;
      }, 1500);
    } catch (err) {
      consola.debug("Could not copy the SSH address:", err);
    }
  }
  /** The printer's own words for a failure, in preference to ours. */
  describe(err) {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail.message === "string") return detail.message;
    const message = err?.message;
    return typeof message === "string" ? message : String(err);
  }
  /** An older MuonOS has developer mode, but not the owner-confirmation route. */
  missingOwnerConfirmation(err) {
    const status = err?.status ?? err?.response?.status;
    return status === 404 || status === 501;
  }
  /** Asks the printer who may ask, and for the waiver turning on agrees to. Asks nothing of its screen. */
  async refreshAsking() {
    try {
      this.asking = await whoMayAsk();
      this.askingError = "";
    } catch (err) {
      consola.debug("Cannot ask this printer for a developer-mode change:", err);
      this.asking = null;
      this.askingError = this.describe(err);
    }
  }
  toggle() {
    if (!this.mayAsk || this.busy || this.state.enabled === null) return;
    this.errorMessage = "";
    this.accepted = false;
    this.target = !this.state.enabled;
    this.changeDialog = true;
  }
  /** The first release of the warranty: the terms are read and accepted before asking. */
  get firstRelease() {
    return this.target && !this.state.everEnabled;
  }
  /** The printer's own terms, when it sends them; Control's wording otherwise. */
  get waiverText() {
    return this.asking?.waiver?.text ?? "";
  }
  closeDialogs() {
    this.stopWaiting();
    this.changeDialog = false;
    this.errorMessage = "";
  }
  stopWaiting() {
    if (this.pollTimer !== null) window.clearInterval(this.pollTimer);
    if (this.countdownTimer !== null) window.clearInterval(this.countdownTimer);
    this.pollTimer = null;
    this.countdownTimer = null;
    this.awaiting = false;
    this.pending = null;
  }
  confirmChange() {
    if (this.firstRelease && !this.accepted) return Promise.resolve();
    return this.ask(this.target);
  }
  /**
   * Puts the question (turn it off) on the printer's screen, then waits for
   * its answer.
   * Nothing changes until the person there confirms it and this browser
   * completes it; a request nobody answers just expires.
   */
  async ask(enabled) {
    this.errorMessage = "";
    this.loading = true;
    let asked;
    try {
      asked = await requestChange(enabled);
    } catch (err) {
      this.loading = false;
      if (this.missingOwnerConfirmation(err)) {
        this.errorMessage = "This printer software does not support owner confirmation yet. Developer mode was not changed.";
      } else {
        await this.refused(err);
      }
      return;
    }
    if (asked.kind === "applied") {
      await this.checkApplied(enabled, asked.enabled);
      this.loading = false;
      return;
    }
    this.loading = false;
    if (asked.kind === "waiting") {
      this.pending = { challengeId: "", enabled };
      this.consentInstruction = "";
      this.secondsRemaining = DEFAULT_WAIT_SECONDS;
    } else {
      const challenge = asked.challenge;
      this.pending = { challengeId: challenge.challengeId, enabled, waiverVersion: (challenge.waiver ?? this.asking?.waiver)?.version };
      this.consentInstruction = challenge.instruction;
      this.secondsRemaining = Math.max(0, Math.round(challenge.expiresInSeconds));
    }
    this.awaiting = true;
    this.pollFailures = 0;
    this.countdownTimer = window.setInterval(() => {
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1);
      if (this.secondsRemaining === 0) {
        this.stopWaiting();
        this.errorMessage = TIMED_OUT;
      }
    }, 1e3);
    this.pollTimer = window.setInterval(() => {
      this.pollConsent().catch(() => void 0);
    }, CONSENT_POLL_MS);
  }
  /**
   * Asks whether the printer's screen was answered. Turned down there ends
   * the wait; a printer that stops answering is said so after a few tries
   * rather than waited on in silence.
   */
  async pollConsent() {
    const pending = this.pending;
    if (!pending || this.loading || this.reading) return;
    let answer;
    this.reading = true;
    try {
      answer = pending.challengeId ? await readAnswer(pending.challengeId, pending.enabled) : await watchState(pending.enabled);
      this.pollFailures = 0;
    } catch (err) {
      this.pollFailures++;
      if (this.pollFailures >= 4) this.errorMessage = `The printer isn't saying whether its screen was answered: ${this.describe(err)}`;
      return;
    } finally {
      this.reading = false;
    }
    if (answer.refused) {
      this.stopWaiting();
      this.errorMessage = DECLINED;
      return;
    }
    if (!answer.confirmed) return;
    if (answer.applied) {
      this.stopWaiting();
      this.changeDialog = false;
      await refreshDevMode();
      return;
    }
    this.loading = true;
    try {
      await completeChange({
        enabled: pending.enabled,
        challengeId: pending.challengeId,
        waiverVersion: pending.waiverVersion
      });
      this.stopWaiting();
      this.changeDialog = false;
    } catch (err) {
      if (confirmationRequired(err)) {
        this.loading = false;
        return;
      }
      this.stopWaiting();
      await this.refused(err);
    } finally {
      this.loading = false;
      await refreshDevMode();
    }
  }
  /** The printer took the change at once: show it when its reply, or a re-read of the state, says so. */
  async checkApplied(enabled, replied) {
    const state = await refreshDevMode();
    if (replied === enabled || state === enabled) {
      this.changeDialog = false;
    } else {
      this.errorMessage = "Couldn't confirm the printer made the change. Nothing changed.";
    }
  }
  /** Says why the printer refused, and catches up with what it said. */
  async refused(err) {
    this.errorMessage = this.describe(err);
    if (!(err instanceof DevModeRefused)) return;
    if (err.code === "no_change") {
      await refreshDevMode();
      this.changeDialog = false;
    } else if (err.code === "owner_required" || err.code === "owner_unknown") {
      await this.refreshAsking();
    } else if (err.code === "panel_only") {
      this.errorMessage = "This printer's software only takes this at its own screen: System, then Protection, then Developer mode. Control can't do it for it yet.";
    }
  }
  async restoreDefaults() {
    const ok = await this.$confirm("Your copy of the configuration is backed up, then replaced with the Muon3D defaults, and Klipper restarts.", {
      title: "Start again from the defaults?",
      buttonTrueText: "Back up and replace",
      danger: true
    });
    if (!ok) return;
    this.loading = true;
    try {
      await this.api.refreshDevModeConfigDevModeRefreshPost();
    } catch (err) {
      this.notify("Start again from the defaults", err);
    } finally {
      this.loading = false;
    }
  }
  async backupConfig() {
    this.loading = true;
    try {
      await this.api.manualBackupDevModeBackupPost();
      this.$store.dispatch("notifications/pushNotification", { title: "Config backed up", description: "In the config folder, under backups.", type: "success" });
    } catch (err) {
      this.notify("Back up the config", err);
    } finally {
      this.loading = false;
    }
  }
  notify(title, err) {
    this.$store.dispatch("notifications/pushNotification", { title, description: this.describe(err), type: "error" });
  }
};
DeveloperModeSettings = __decorateClass([
  Component({ components: { ToggleSwitch } })
], DeveloperModeSettings);
const _sfc_main = DeveloperModeSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "devm", attrs: { "id": "developer", "data-tid": "developer-mode" } }, [_c("div", { staticClass: "devm__card", attrs: { "data-tid": "developer-mode-card" } }, [_c("header", { staticClass: "devm__head" }, [_c("div", { staticClass: "devm__titles" }, [_c("h2", [_vm._v("Developer mode")]), _c("p", { class: { "devm__state--on": _vm.state.enabled === true }, attrs: { "data-tid": "developer-mode-state" } }, [_vm._v(" " + _vm._s(_vm.stateLine) + " ")])]), _vm.mayAsk && _vm.state.enabled !== null ? _c("toggle-switch", { attrs: { "value": !!_vm.state.enabled, "label": "Developer mode", "disabled": _vm.state.enabled === null || _vm.busy, "data-tid": "developer-mode-switch" }, on: { "input": _vm.toggle } }) : _vm._e()], 1), _vm.state.enabled !== null ? [_c("p", { staticClass: "devm__text", attrs: { "data-tid": "developer-mode-what" } }, [_vm._v(" " + _vm._s(_vm.whatLine) + " ")]), _vm.sshAddress ? _c("div", { staticClass: "devm__ssh", attrs: { "data-tid": "developer-mode-ssh" } }, [_c("div", { staticClass: "devm__ssh-text" }, [_c("span", [_vm._v("SSH address")]), _c("code", { attrs: { "data-tid": "developer-mode-ssh-address" } }, [_vm._v(_vm._s(_vm.sshAddress))])]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "developer-mode-ssh-copy" }, on: { "click": _vm.copySsh } }, [_vm._v(" " + _vm._s(_vm.copied ? "Copied" : "Copy") + " ")])]) : _vm._e(), !_vm.adminBuild ? _c("p", { staticClass: "devm__warranty", attrs: { "data-tid": "developer-mode-warranty" } }, [_c(__unplugin_components_0, { attrs: { "name": "alert", "small": "" } }), _c("span", [_vm._v(_vm._s(_vm.warrantyLine))])], 1) : _vm._e(), _vm.mayAsk ? _c("p", { staticClass: "devm__text", attrs: { "data-tid": "developer-mode-off-how" } }, [_vm._v(" " + _vm._s(_vm.offLine) + " ")]) : _vm.notAsking ? _c("p", { staticClass: "devm__note", attrs: { "data-tid": "developer-mode-who" } }, [_vm._v(" " + _vm._s(_vm.notAsking) + " ")]) : _vm._e(), _vm.state.enabled ? _c("div", { staticClass: "devm__actions", attrs: { "data-tid": "developer-mode-while-on" } }, [_c("button", { staticClass: "cbtn devm__small", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "developer-backup" }, on: { "click": _vm.backupConfig } }, [_vm._v(" Back up the configuration ")]), _c("button", { staticClass: "cbtn devm__small", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "developer-reset" }, on: { "click": _vm.restoreDefaults } }, [_vm._v(" Start again from the Muon3D defaults ")])]) : _vm._e()] : _vm._e()], 2), _c(__unplugin_components_1, { attrs: { "max-width": "480", "persistent": _vm.awaiting }, model: { value: _vm.changeDialog, callback: function($$v) {
    _vm.changeDialog = $$v;
  }, expression: "changeDialog" } }, [_c("div", { staticClass: "devm__dialog", attrs: { "data-tid": _vm.target ? "developer-enable-dialog" : "developer-disable-dialog" } }, [_c("h3", [_vm._v(_vm._s(_vm.target ? "Turn on developer mode" : "Turn off developer mode"))]), _vm.target ? [_vm.firstRelease ? [_c("p", { attrs: { "data-tid": "developer-terms" } }, [_vm._v(" " + _vm._s(_vm.waiverText || _vm.$t("app.general.dev_mode.modal-1")) + " ")]), !_vm.waiverText ? [_c("p", [_vm._v(_vm._s(_vm.$t("app.general.dev_mode.modal-2")))]), _c("p", [_vm._v(_vm._s(_vm.$t("app.general.dev_mode.modal-3")))])] : _vm._e(), _c("label", { staticClass: "devm__accept" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.accepted, expression: "accepted" }], attrs: { "type": "checkbox", "disabled": _vm.busy, "data-tid": "developer-accept" }, domProps: { "checked": Array.isArray(_vm.accepted) ? _vm._i(_vm.accepted, null) > -1 : _vm.accepted }, on: { "change": function($event) {
    var $$a = _vm.accepted, $$el = $event.target, $$c = $$el.checked ? true : false;
    if (Array.isArray($$a)) {
      var $$v = null, $$i = _vm._i($$a, $$v);
      if ($$el.checked) {
        $$i < 0 && (_vm.accepted = $$a.concat([$$v]));
      } else {
        $$i > -1 && (_vm.accepted = $$a.slice(0, $$i).concat($$a.slice($$i + 1)));
      }
    } else {
      _vm.accepted = $$c;
    }
  } } }), _c("span", [_vm._v(_vm._s(_vm.$t("app.general.dev_mode.modal-checkbox-message")))])])] : _c("p", [_vm._v(" Your copy of the configuration comes back, and the printer runs it. ")])] : [_c("p", [_vm._v(_vm._s(_vm.$t("app.general.dev_mode.disable-modal-1")))]), _c("p", [_vm._v(_vm._s(_vm.$t("app.general.dev_mode.disable-modal-2")))])], _vm.awaiting ? _c("div", { staticClass: "devm__press", attrs: { "data-tid": "developer-press-knob" } }, [_c("span", { staticClass: "devm__pulse" }), _c("div", [_vm.target && _vm.firstRelease ? _c("b", [_vm._v("Sign the warranty release on the printer's screen to turn on developer mode for the first time.")]) : _c("b", [_vm._v("Confirm on the printer's screen")]), _vm.consentInstruction ? _c("span", [_vm._v(_vm._s(_vm.consentInstruction))]) : _vm._e(), _c("span", [_vm._v(_vm._s(_vm.$t("app.general.dev_mode.consent-expires", { seconds: _vm.secondsRemaining })))])])]) : _vm._e(), _vm.errorMessage ? _c("p", { staticClass: "devm__error", attrs: { "data-tid": "developer-error" } }, [_vm._v(" " + _vm._s(_vm.errorMessage) + " ")]) : _vm._e(), _c("div", { staticClass: "devm__buttons" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "disabled": _vm.loading }, on: { "click": _vm.closeDialogs } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": _vm.loading || _vm.awaiting || _vm.target && _vm.firstRelease && !_vm.accepted, "data-tid": "developer-confirm" }, on: { "click": _vm.confirmChange } }, [_vm._v(" " + _vm._s(_vm.target ? "Turn on" : "Turn off") + " ")])])], 2)])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/DeveloperModeSettings.vue?vue&type=style&index=0&scoped=ac74fb84&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ac74fb84",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/DeveloperModeSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBaU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BRUE7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBa0JBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBLGdDQUNBLHNEQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSxnQ0FDQSxvR0FDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0Esa0NBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FDQSx5REFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBclZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkRldmVsb3Blck1vZGVTZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvblxuICAgIGlkPVwiZGV2ZWxvcGVyXCJcbiAgICBjbGFzcz1cImRldm1cIlxuICAgIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLW1vZGVcIlxuICA+XG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJkZXZtX19jYXJkXCJcbiAgICAgIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLW1vZGUtY2FyZFwiXG4gICAgPlxuICAgICAgPGhlYWRlciBjbGFzcz1cImRldm1fX2hlYWRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImRldm1fX3RpdGxlc1wiPlxuICAgICAgICAgIDxoMj5EZXZlbG9wZXIgbW9kZTwvaDI+XG4gICAgICAgICAgPHBcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ2Rldm1fX3N0YXRlLS1vbic6IHN0YXRlLmVuYWJsZWQgPT09IHRydWUgfVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1tb2RlLXN0YXRlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyBzdGF0ZUxpbmUgfX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgIHYtaWY9XCJtYXlBc2sgJiYgc3RhdGUuZW5hYmxlZCAhPT0gbnVsbFwiXG4gICAgICAgICAgOnZhbHVlPVwiISFzdGF0ZS5lbmFibGVkXCJcbiAgICAgICAgICBsYWJlbD1cIkRldmVsb3BlciBtb2RlXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJzdGF0ZS5lbmFibGVkID09PSBudWxsIHx8IGJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLW1vZGUtc3dpdGNoXCJcbiAgICAgICAgICBAaW5wdXQ9XCJ0b2dnbGVcIlxuICAgICAgICAvPlxuICAgICAgPC9oZWFkZXI+XG5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic3RhdGUuZW5hYmxlZCAhPT0gbnVsbFwiPlxuICAgICAgICA8cFxuICAgICAgICAgIGNsYXNzPVwiZGV2bV9fdGV4dFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJkZXZlbG9wZXItbW9kZS13aGF0XCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHdoYXRMaW5lIH19XG4gICAgICAgIDwvcD5cblxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cInNzaEFkZHJlc3NcIlxuICAgICAgICAgIGNsYXNzPVwiZGV2bV9fc3NoXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1tb2RlLXNzaFwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGV2bV9fc3NoLXRleHRcIj5cbiAgICAgICAgICAgIDxzcGFuPlNTSCBhZGRyZXNzPC9zcGFuPlxuICAgICAgICAgICAgPGNvZGUgZGF0YS10aWQ9XCJkZXZlbG9wZXItbW9kZS1zc2gtYWRkcmVzc1wiPnt7IHNzaEFkZHJlc3MgfX08L2NvZGU+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1tb2RlLXNzaC1jb3B5XCJcbiAgICAgICAgICAgIEBjbGljaz1cImNvcHlTc2hcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGNvcGllZCA/ICdDb3BpZWQnIDogJ0NvcHknIH19XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cIiFhZG1pbkJ1aWxkXCJcbiAgICAgICAgICBjbGFzcz1cImRldm1fX3dhcnJhbnR5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1tb2RlLXdhcnJhbnR5XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICBuYW1lPVwiYWxlcnRcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxzcGFuPnt7IHdhcnJhbnR5TGluZSB9fTwvc3Bhbj5cbiAgICAgICAgPC9wPlxuXG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cIm1heUFza1wiXG4gICAgICAgICAgY2xhc3M9XCJkZXZtX190ZXh0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1tb2RlLW9mZi1ob3dcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgb2ZmTGluZSB9fVxuICAgICAgICA8L3A+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1lbHNlLWlmPVwibm90QXNraW5nXCJcbiAgICAgICAgICBjbGFzcz1cImRldm1fX25vdGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLW1vZGUtd2hvXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IG5vdEFza2luZyB9fVxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJzdGF0ZS5lbmFibGVkXCJcbiAgICAgICAgICBjbGFzcz1cImRldm1fX2FjdGlvbnNcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLW1vZGUtd2hpbGUtb25cIlxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gZGV2bV9fc21hbGxcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1iYWNrdXBcIlxuICAgICAgICAgICAgQGNsaWNrPVwiYmFja3VwQ29uZmlnXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBCYWNrIHVwIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gZGV2bV9fc21hbGxcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1yZXNldFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJyZXN0b3JlRGVmYXVsdHNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFN0YXJ0IGFnYWluIGZyb20gdGhlIE11b24zRCBkZWZhdWx0c1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG5cbiAgICA8di1kaWFsb2dcbiAgICAgIHYtbW9kZWw9XCJjaGFuZ2VEaWFsb2dcIlxuICAgICAgbWF4LXdpZHRoPVwiNDgwXCJcbiAgICAgIDpwZXJzaXN0ZW50PVwiYXdhaXRpbmdcIlxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3M9XCJkZXZtX19kaWFsb2dcIlxuICAgICAgICA6ZGF0YS10aWQ9XCJ0YXJnZXQgPyAnZGV2ZWxvcGVyLWVuYWJsZS1kaWFsb2cnIDogJ2RldmVsb3Blci1kaXNhYmxlLWRpYWxvZydcIlxuICAgICAgPlxuICAgICAgICA8aDM+e3sgdGFyZ2V0ID8gJ1R1cm4gb24gZGV2ZWxvcGVyIG1vZGUnIDogJ1R1cm4gb2ZmIGRldmVsb3BlciBtb2RlJyB9fTwvaDM+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwidGFyZ2V0XCI+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCJmaXJzdFJlbGVhc2VcIj5cbiAgICAgICAgICAgIDxwIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLXRlcm1zXCI+XG4gICAgICAgICAgICAgIHt7IHdhaXZlclRleHQgfHwgJHQoJ2FwcC5nZW5lcmFsLmRldl9tb2RlLm1vZGFsLTEnKSB9fVxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCIhd2FpdmVyVGV4dFwiPlxuICAgICAgICAgICAgICA8cD57eyAkdCgnYXBwLmdlbmVyYWwuZGV2X21vZGUubW9kYWwtMicpIH19PC9wPlxuICAgICAgICAgICAgICA8cD57eyAkdCgnYXBwLmdlbmVyYWwuZGV2X21vZGUubW9kYWwtMycpIH19PC9wPlxuICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cImRldm1fX2FjY2VwdFwiPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB2LW1vZGVsPVwiYWNjZXB0ZWRcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJkZXZlbG9wZXItYWNjZXB0XCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8c3Bhbj57eyAkdCgnYXBwLmdlbmVyYWwuZGV2X21vZGUubW9kYWwtY2hlY2tib3gtbWVzc2FnZScpIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgIDxwIHYtZWxzZT5cbiAgICAgICAgICAgIFlvdXIgY29weSBvZiB0aGUgY29uZmlndXJhdGlvbiBjb21lcyBiYWNrLCBhbmQgdGhlIHByaW50ZXIgcnVucyBpdC5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgICAgPHA+e3sgJHQoJ2FwcC5nZW5lcmFsLmRldl9tb2RlLmRpc2FibGUtbW9kYWwtMScpIH19PC9wPlxuICAgICAgICAgIDxwPnt7ICR0KCdhcHAuZ2VuZXJhbC5kZXZfbW9kZS5kaXNhYmxlLW1vZGFsLTInKSB9fTwvcD5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJhd2FpdGluZ1wiXG4gICAgICAgICAgY2xhc3M9XCJkZXZtX19wcmVzc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJkZXZlbG9wZXItcHJlc3Mta25vYlwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImRldm1fX3B1bHNlXCIgLz5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGIgdi1pZj1cInRhcmdldCAmJiBmaXJzdFJlbGVhc2VcIj5TaWduIHRoZSB3YXJyYW50eSByZWxlYXNlIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuIHRvIHR1cm4gb24gZGV2ZWxvcGVyIG1vZGUgZm9yIHRoZSBmaXJzdCB0aW1lLjwvYj5cbiAgICAgICAgICAgIDxiIHYtZWxzZT5Db25maXJtIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuPC9iPlxuICAgICAgICAgICAgPHNwYW4gdi1pZj1cImNvbnNlbnRJbnN0cnVjdGlvblwiPnt7IGNvbnNlbnRJbnN0cnVjdGlvbiB9fTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPnt7ICR0KCdhcHAuZ2VuZXJhbC5kZXZfbW9kZS5jb25zZW50LWV4cGlyZXMnLCB7IHNlY29uZHM6IHNlY29uZHNSZW1haW5pbmcgfSkgfX08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJlcnJvck1lc3NhZ2VcIlxuICAgICAgICAgIGNsYXNzPVwiZGV2bV9fZXJyb3JcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZGV2ZWxvcGVyLWVycm9yXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IGVycm9yTWVzc2FnZSB9fVxuICAgICAgICA8L3A+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkZXZtX19idXR0b25zXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwibG9hZGluZ1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJjbG9zZURpYWxvZ3NcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uY2FuY2VsJykgfX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImxvYWRpbmcgfHwgYXdhaXRpbmcgfHwgKHRhcmdldCAmJiBmaXJzdFJlbGVhc2UgJiYgIWFjY2VwdGVkKVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImRldmVsb3Blci1jb25maXJtXCJcbiAgICAgICAgICAgIEBjbGljaz1cImNvbmZpcm1DaGFuZ2VcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IHRhcmdldCA/ICdUdXJuIG9uJyA6ICdUdXJuIG9mZicgfX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L3YtZGlhbG9nPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IGNvbnNvbGEgZnJvbSAnY29uc29sYSdcbmltcG9ydCB7IHVzZUF1eEFwaSB9IGZyb20gJ0AvYXV4X2FwaS91c2VBdXhBcGknXG5pbXBvcnQgeyBkZXZNb2RlU3RhdGUsIHJlZnJlc2hEZXZNb2RlIH0gZnJvbSAnQC9zZXJ2aWNlcy9kZXYtbW9kZS9zdGF0ZSdcbmltcG9ydCB7XG4gIHJlcXVlc3RDaGFuZ2UsXG4gIGNvbXBsZXRlQ2hhbmdlLFxuICByZWFkQW5zd2VyLFxuICB3YXRjaFN0YXRlLFxuICBjb25maXJtYXRpb25SZXF1aXJlZCxcbiAgd2hvTWF5QXNrLFxuICB3aHlOb3QsXG4gIERldk1vZGVSZWZ1c2VkLFxuICB0eXBlIERldk1vZGVBc2tpbmdcbn0gZnJvbSAnQC9zZXJ2aWNlcy9kZXYtbW9kZS9yZXF1ZXN0J1xuaW1wb3J0IFRvZ2dsZVN3aXRjaCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Ub2dnbGVTd2l0Y2gudnVlJ1xuXG4vKiogSG93IG9mdGVuIHRoZSBicm93c2VyIGFza3Mgd2hldGhlciB0aGUgcHJpbnRlcidzIHNjcmVlbiBoYXMgYmVlbiBhbnN3ZXJlZC4gKi9cbmNvbnN0IENPTlNFTlRfUE9MTF9NUyA9IDE1MDBcbmNvbnN0IERFRkFVTFRfV0FJVF9TRUNPTkRTID0gMTIwXG5jb25zdCBUSU1FRF9PVVQgPSBcIk5vYm9keSBjb25maXJtZWQgb24gdGhlIHByaW50ZXIncyBzY3JlZW4gaW4gdGltZS4gTm90aGluZyBjaGFuZ2VkLlwiXG5jb25zdCBERUNMSU5FRCA9IFwiSXQgd2FzIGRlY2xpbmVkIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuLiBOb3RoaW5nIGNoYW5nZWQuXCJcblxuLyoqXG4gKiBTZXR0aW5ncyDigLogRGV2ZWxvcGVyIG1vZGU6IHdoZXRoZXIgaXQncyBvbiwgYSB3YXkgb3V0LCBhbmQgd2hldGhlciB0dXJuaW5nXG4gKiBpdCBvbiBlbmRzIHRoZSB3YXJyYW50eSAocmVsZWFzZSBidWlsZHMpLCBhbmQsIG9uIGFuIGFkbWluIGJ1aWxkIG9ubHksIHRoZVxuICogU1NIIGFkZHJlc3MuIFdpdGggaXQgb246IGJhY2sgdXAgdGhlIGNvbmZpZyBvciBzdGFydCBhZ2FpbiBmcm9tIHRoZSBkZWZhdWx0cy5cbiAqXG4gKiBCb3RoIHdheXMgYXJlIGRvbmUgZnJvbSBoZXJlLCBvdmVyIGFueSByb3V0ZSAoS0FOLTM2MDQsIEtBTi00NzcyKSwgdGhyb3VnaFxuICogTW9vbnJha2VyJ3MgcmVxdWVzdCByb3V0ZSAoc2VydmljZXMvZGV2LW1vZGUvcmVxdWVzdCkuIE9ubHkgdGhlIEZJUlNUXG4gKiByZWxlYXNlIG9mIHRoZSB3YXJyYW50eSBpcyBzaWduZWQgb24gdGhlIHByaW50ZXIncyBzY3JlZW4gKEphY2ssIDE5IE5vdik6XG4gKiBDb250cm9sIHJlYWRzIHRoZSB0ZXJtcywgdGFrZXMgdGhlIGFjY2VwdGFuY2UsIHRoZW4gc2hvd3MgXCJTaWduIHRoZSB3YXJyYW50eVxuICogcmVsZWFzZSBvbiB0aGUgcHJpbnRlcidzIHNjcmVlblwiIHdpdGggYSBjb3VudGRvd24sIGFuZCBzaG93cyBub3RoaW5nIGNoYW5nZWRcbiAqIHVudGlsIHRoZSBwcmludGVyIHNheXMgY29uZmlybWVkIG9yIGEgcmUtcmVhZCBvZiB0aGUgc3RhdGUgc2hvd3MgaXQuIEV2ZXJ5XG4gKiBsYXRlciBzd2l0Y2gsIG9uIG9yIG9mZiwgaXMgZGlyZWN0IChhZG1pbiBidWlsZHMgYWx3YXlzIGFyZSkuIEEgNDI4IG1lYW5zIHRoZVxuICogcmVsZWFzZSBtdXN0IGJlIHNpZ25lZCBmaXJzdCBhbmQgc3RhcnRzIHRoYXQgd2FpdC4gT24gYW4gT3BlbiBwcmludGVyIGFueW9uZVxuICogbWF5IGFzazsgb24gYSBQcm90ZWN0ZWQgb25lIHRoZSBzd2l0Y2ggaXMgdGhlIG93bmVyJ3MgYWxvbmUuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRvZ2dsZVN3aXRjaCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZlbG9wZXJNb2RlU2V0dGluZ3MgZXh0ZW5kcyBWdWUge1xuICBhcGkgPSB1c2VBdXhBcGkoKS5kZXZNb2RlXG4gIHN0YXRlID0gZGV2TW9kZVN0YXRlXG5cbiAgLyoqIFdobyBtYXkgYXNrLCBhcyB0aGUgcHJpbnRlciBzYWlkOyBudWxsIHVudGlsIGl0IGhhcy4gKi9cbiAgYXNraW5nOiBEZXZNb2RlQXNraW5nIHwgbnVsbCA9IG51bGxcbiAgYXNraW5nRXJyb3IgPSAnJ1xuICBjaGFuZ2VEaWFsb2cgPSBmYWxzZVxuICAvKiogV2hhdCB0aGUgb3BlbiBkaWFsb2cgaXMgYWJvdXQ6IHRydWUgdHVybnMgaXQgb24sIGZhbHNlIHR1cm5zIGl0IG9mZi4gKi9cbiAgdGFyZ2V0ID0gZmFsc2VcbiAgYWNjZXB0ZWQgPSBmYWxzZVxuICBsb2FkaW5nID0gZmFsc2VcbiAgLyoqIFRoZSBjaGFuZ2Ugd2FpdGluZyBvbiB0aGUgcHJpbnRlcidzIHNjcmVlbi4gKi9cbiAgcGVuZGluZzogeyBjaGFsbGVuZ2VJZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuLCB3YWl2ZXJWZXJzaW9uPzogc3RyaW5nIH0gfCBudWxsID0gbnVsbFxuICBjb25zZW50SW5zdHJ1Y3Rpb24gPSAnJ1xuICBzZWNvbmRzUmVtYWluaW5nID0gMFxuICBhd2FpdGluZyA9IGZhbHNlXG4gIGVycm9yTWVzc2FnZSA9ICcnXG4gIC8qKiBUaGUgU1NIIGFkZHJlc3Mgd2FzIGp1c3QgY29waWVkLiAqL1xuICBjb3BpZWQgPSBmYWxzZVxuICBwb2xsVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsXG4gIGNvdW50ZG93blRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbFxuICAvKiogQXNrcyBpbiBhIHJvdyB0aGUgcHJpbnRlciBkaWRuJ3QgYW5zd2VyLiAqL1xuICBwb2xsRmFpbHVyZXMgPSAwXG4gIC8qKiBBIHJlYWQgb2YgdGhlIHByaW50ZXIncyBhbnN3ZXIgaXMgb24gaXRzIHdheTogYSBzbG93IGxpbmsgbXVzdCBub3Qgc3RhY2sgYW5vdGhlciBiZWhpbmQgaXQuICovXG4gIHJlYWRpbmcgPSBmYWxzZVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHJlZnJlc2hEZXZNb2RlKClcbiAgICB0aGlzLnJlZnJlc2hBc2tpbmcoKVxuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgdGhpcy5zdG9wV2FpdGluZygpXG4gIH1cblxuICBnZXQgYnVzeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubG9hZGluZyB8fCB0aGlzLmF3YWl0aW5nXG4gIH1cblxuICBnZXQgbWF5QXNrICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hc2tpbmc/Lm1heUFzayA9PT0gdHJ1ZVxuICB9XG5cbiAgLyoqIFdoeSB0aGVyZSBpcyBubyBzd2l0Y2gsIHdoZW4gdGhlcmUgaXNuJ3Qgb25lLiAqL1xuICBnZXQgbm90QXNraW5nICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnN0YXRlLmVuYWJsZWQgPT09IG51bGwpIHJldHVybiAnJ1xuICAgIGlmICh0aGlzLmFza2luZ0Vycm9yKSByZXR1cm4gdGhpcy5hc2tpbmdFcnJvclxuICAgIHJldHVybiB3aHlOb3QodGhpcy5hc2tpbmcpID8/ICcnXG4gIH1cblxuICBnZXQgc3RhdGVMaW5lICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnN0YXRlLmVuYWJsZWQgPT09IG51bGwpIHJldHVybiAnQXNraW5nIHRoZSBwcmludGVy4oCmJ1xuICAgIHJldHVybiB0aGlzLnN0YXRlLmVuYWJsZWQgPyAnT24nIDogJ09mZidcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBhZG1pbiBidWlsZDogdGhlIHByaW50ZXIgc2F5cyB0dXJuaW5nIGRldmVsb3BlciBtb2RlIG9uIG5lZWRzIG5vXG4gICAqIHdhcnJhbnR5IHJlbGVhc2UgKGl0cyBndWFyZCBpcyBkaXNhcm1lZCkuIEFueXRoaW5nIGVsc2UsIGluY2x1ZGluZyBhblxuICAgKiBhbnN3ZXIgdGhhdCBpc24ndCB0aGVyZSwgY291bnRzIGFzIGEgcmVsZWFzZSBidWlsZCwgd2hpY2ggZmFpbHMgY2xvc2VkOlxuICAgKiB0aGUgd2FycmFudHkgbGluZSBpcyBzaG93biBhbmQgdGhlIFNTSCBhZGRyZXNzIGlzIG5vdC5cbiAgICovXG4gIGdldCBhZG1pbkJ1aWxkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5jYW5NYW5hZ2UgPT09IHRydWUgJiYgdGhpcy5zdGF0ZS5ndWFyZEFybWVkID09PSBmYWxzZSAmJiB0aGlzLnN0YXRlLm90cEFybWVkICE9PSB0cnVlXG4gIH1cblxuICAvKiogV2hhdCBkZXZlbG9wZXIgbW9kZSBpcyBhbmQgd2hhdCBpdCBjaGFuZ2VzLiAqL1xuICBnZXQgd2hhdExpbmUgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuc3RhdGUuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuICdUaGUgcHJpbnRlciBpcyBydW5uaW5nIHlvdXIgY29weSBvZiBpdHMgY29uZmlndXJhdGlvbiBhbmQgbWFjcm9zLiBZb3UgY2FuIGVkaXQgdGhlbSBhbmQgaXRzIGZpbGVzLiBUaGUgTXVvbjNEIGRlZmF1bHRzIHN0YXkgYXMgdGhleSBhcmUgYmVzaWRlIHlvdXIgY29weS4nXG4gICAgfVxuICAgIHJldHVybiBcIkRldmVsb3BlciBtb2RlIGxldHMgeW91IGNoYW5nZSB0aGlzIHByaW50ZXIncyBvd24gY29uZmlndXJhdGlvbiBhbmQgbWFjcm9zLCBhbmQgZWRpdCBpdHMgZmlsZXMuIFRoZSBNdW9uM0QgZGVmYXVsdHMgc3RheSBhcyB0aGV5IGFyZSBiZXNpZGUgeW91ciBjb3B5LlwiXG4gIH1cblxuICAvKiogUmVsZWFzZSBidWlsZHMgb25seTogdGhlIHdhcnJhbnR5LiAqL1xuICBnZXQgd2FycmFudHlMaW5lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLmVuYWJsZWRcbiAgICAgID8gJ1RoZSB3YXJyYW50eSBlbmRlZCB3aGVuIHlvdSBmaXJzdCB0dXJuZWQgdGhpcyBvbi4nXG4gICAgICA6ICdUaGUgZmlyc3QgdGltZSB5b3UgdHVybiBpdCBvbiwgdGhlIHdhcnJhbnR5IGVuZHMsIGV2ZW4gaWYgeW91IHR1cm4gaXQgb2ZmIGFnYWluLidcbiAgfVxuXG4gIGdldCBvZmZMaW5lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLmVuYWJsZWRcbiAgICAgID8gJ1R1cm4gaXQgb2ZmIHdpdGggdGhlIHN3aXRjaCB0byBnbyBiYWNrIHRvIHRoZSBNdW9uM0QgZGVmYXVsdHMuIFlvdXIgY29weSBpcyBrZXB0IGZvciBuZXh0IHRpbWUuJ1xuICAgICAgOiAnT25jZSBpdCBpcyBvbiwgeW91IGNhbiB0dXJuIGl0IG9mZiBhbnkgdGltZSB3aXRoIHRoZSBzd2l0Y2guIFRoZSBwcmludGVyIHRoZW4gZ29lcyBiYWNrIHRvIHRoZSBNdW9uM0QgZGVmYXVsdHMsIGFuZCB5b3VyIGNvcHkgaXMga2VwdC4nXG4gIH1cblxuICAvKipcbiAgICogVGhlIFNTSCBhZGRyZXNzLCBvbiBhbiBhZG1pbiBidWlsZCB3aXRoIGRldmVsb3BlciBtb2RlIG9uLCBhbmQgbm93aGVyZVxuICAgKiBlbHNlLiBFbXB0eSAoc28gbm8gcm93KSB1bmxlc3MgdGhlIHByaW50ZXIgaGFzIHNhaWQgaXQgaXMgYW4gYWRtaW4gYnVpbGRcbiAgICogQU5EIGdpdmVuIGl0cyBvd24gbmFtZS5cbiAgICovXG4gIGdldCBzc2hBZGRyZXNzICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5hZG1pbkJ1aWxkIHx8IHRoaXMuc3RhdGUuZW5hYmxlZCAhPT0gdHJ1ZSkgcmV0dXJuICcnXG4gICAgY29uc3QgaG9zdCA9ICgodGhpcy4kc3RvcmU/LnN0YXRlPy5wcmludGVyPy5wcmludGVyPy5pbmZvPy5ob3N0bmFtZSBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKS50cmltKClcbiAgICBpZiAoIS9eW2EtejAtOV1bYS16MC05LV0qJC9pLnRlc3QoaG9zdCkpIHJldHVybiAnJ1xuICAgIHJldHVybiBgc3NoIHJvb3RAJHtob3N0fS5sb2NhbGBcbiAgfVxuXG4gIGFzeW5jIGNvcHlTc2ggKCkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0aGlzLnNzaEFkZHJlc3MpXG4gICAgICB0aGlzLmNvcGllZCA9IHRydWVcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5jb3BpZWQgPSBmYWxzZSB9LCAxNTAwKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sYS5kZWJ1ZygnQ291bGQgbm90IGNvcHkgdGhlIFNTSCBhZGRyZXNzOicsIGVycilcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHByaW50ZXIncyBvd24gd29yZHMgZm9yIGEgZmFpbHVyZSwgaW4gcHJlZmVyZW5jZSB0byBvdXJzLiAqL1xuICBkZXNjcmliZSAoZXJyOiB1bmtub3duKTogc3RyaW5nIHtcbiAgICBjb25zdCBkZXRhaWwgPSAoZXJyIGFzIHsgcmVzcG9uc2U/OiB7IGRhdGE/OiB7IGRldGFpbD86IHVua25vd24gfSB9IH0pPy5yZXNwb25zZT8uZGF0YT8uZGV0YWlsXG4gICAgaWYgKHR5cGVvZiBkZXRhaWwgPT09ICdzdHJpbmcnKSByZXR1cm4gZGV0YWlsXG4gICAgaWYgKGRldGFpbCAmJiB0eXBlb2YgKGRldGFpbCBhcyB7IG1lc3NhZ2U/OiB1bmtub3duIH0pLm1lc3NhZ2UgPT09ICdzdHJpbmcnKSByZXR1cm4gKGRldGFpbCBhcyB7IG1lc3NhZ2U6IHN0cmluZyB9KS5tZXNzYWdlXG4gICAgY29uc3QgbWVzc2FnZSA9IChlcnIgYXMgeyBtZXNzYWdlPzogdW5rbm93biB9KT8ubWVzc2FnZVxuICAgIHJldHVybiB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycgPyBtZXNzYWdlIDogU3RyaW5nKGVycilcbiAgfVxuXG4gIC8qKiBBbiBvbGRlciBNdW9uT1MgaGFzIGRldmVsb3BlciBtb2RlLCBidXQgbm90IHRoZSBvd25lci1jb25maXJtYXRpb24gcm91dGUuICovXG4gIG1pc3NpbmdPd25lckNvbmZpcm1hdGlvbiAoZXJyOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3RhdHVzID0gKGVyciBhcyB7IHN0YXR1cz86IHVua25vd24sIHJlc3BvbnNlPzogeyBzdGF0dXM/OiB1bmtub3duIH0gfSk/LnN0YXR1cyA/P1xuICAgICAgKGVyciBhcyB7IHJlc3BvbnNlPzogeyBzdGF0dXM/OiB1bmtub3duIH0gfSk/LnJlc3BvbnNlPy5zdGF0dXNcbiAgICByZXR1cm4gc3RhdHVzID09PSA0MDQgfHwgc3RhdHVzID09PSA1MDFcbiAgfVxuXG4gIC8qKiBBc2tzIHRoZSBwcmludGVyIHdobyBtYXkgYXNrLCBhbmQgZm9yIHRoZSB3YWl2ZXIgdHVybmluZyBvbiBhZ3JlZXMgdG8uIEFza3Mgbm90aGluZyBvZiBpdHMgc2NyZWVuLiAqL1xuICBhc3luYyByZWZyZXNoQXNraW5nICgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5hc2tpbmcgPSBhd2FpdCB3aG9NYXlBc2soKVxuICAgICAgdGhpcy5hc2tpbmdFcnJvciA9ICcnXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xhLmRlYnVnKCdDYW5ub3QgYXNrIHRoaXMgcHJpbnRlciBmb3IgYSBkZXZlbG9wZXItbW9kZSBjaGFuZ2U6JywgZXJyKVxuICAgICAgdGhpcy5hc2tpbmcgPSBudWxsXG4gICAgICB0aGlzLmFza2luZ0Vycm9yID0gdGhpcy5kZXNjcmliZShlcnIpXG4gICAgfVxuICB9XG5cbiAgdG9nZ2xlICgpIHtcbiAgICBpZiAoIXRoaXMubWF5QXNrIHx8IHRoaXMuYnVzeSB8fCB0aGlzLnN0YXRlLmVuYWJsZWQgPT09IG51bGwpIHJldHVyblxuICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gJydcbiAgICB0aGlzLmFjY2VwdGVkID0gZmFsc2VcbiAgICB0aGlzLnRhcmdldCA9ICF0aGlzLnN0YXRlLmVuYWJsZWRcbiAgICB0aGlzLmNoYW5nZURpYWxvZyA9IHRydWVcbiAgfVxuXG4gIC8qKiBUaGUgZmlyc3QgcmVsZWFzZSBvZiB0aGUgd2FycmFudHk6IHRoZSB0ZXJtcyBhcmUgcmVhZCBhbmQgYWNjZXB0ZWQgYmVmb3JlIGFza2luZy4gKi9cbiAgZ2V0IGZpcnN0UmVsZWFzZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMudGFyZ2V0ICYmICF0aGlzLnN0YXRlLmV2ZXJFbmFibGVkXG4gIH1cblxuICAvKiogVGhlIHByaW50ZXIncyBvd24gdGVybXMsIHdoZW4gaXQgc2VuZHMgdGhlbTsgQ29udHJvbCdzIHdvcmRpbmcgb3RoZXJ3aXNlLiAqL1xuICBnZXQgd2FpdmVyVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5hc2tpbmc/LndhaXZlcj8udGV4dCA/PyAnJ1xuICB9XG5cbiAgY2xvc2VEaWFsb2dzICgpIHtcbiAgICB0aGlzLnN0b3BXYWl0aW5nKClcbiAgICB0aGlzLmNoYW5nZURpYWxvZyA9IGZhbHNlXG4gICAgdGhpcy5lcnJvck1lc3NhZ2UgPSAnJ1xuICB9XG5cbiAgc3RvcFdhaXRpbmcgKCkge1xuICAgIGlmICh0aGlzLnBvbGxUaW1lciAhPT0gbnVsbCkgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5wb2xsVGltZXIpXG4gICAgaWYgKHRoaXMuY291bnRkb3duVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuY291bnRkb3duVGltZXIpXG4gICAgdGhpcy5wb2xsVGltZXIgPSBudWxsXG4gICAgdGhpcy5jb3VudGRvd25UaW1lciA9IG51bGxcbiAgICB0aGlzLmF3YWl0aW5nID0gZmFsc2VcbiAgICB0aGlzLnBlbmRpbmcgPSBudWxsXG4gIH1cblxuICBjb25maXJtQ2hhbmdlICgpIHtcbiAgICBpZiAodGhpcy5maXJzdFJlbGVhc2UgJiYgIXRoaXMuYWNjZXB0ZWQpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIHJldHVybiB0aGlzLmFzayh0aGlzLnRhcmdldClcbiAgfVxuXG4gIC8qKlxuICAgKiBQdXRzIHRoZSBxdWVzdGlvbiAodHVybiBpdCBvZmYpIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuLCB0aGVuIHdhaXRzIGZvclxuICAgKiBpdHMgYW5zd2VyLlxuICAgKiBOb3RoaW5nIGNoYW5nZXMgdW50aWwgdGhlIHBlcnNvbiB0aGVyZSBjb25maXJtcyBpdCBhbmQgdGhpcyBicm93c2VyXG4gICAqIGNvbXBsZXRlcyBpdDsgYSByZXF1ZXN0IG5vYm9keSBhbnN3ZXJzIGp1c3QgZXhwaXJlcy5cbiAgICovXG4gIGFzeW5jIGFzayAoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gJydcbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlXG4gICAgbGV0IGFza2VkXG4gICAgdHJ5IHtcbiAgICAgIGFza2VkID0gYXdhaXQgcmVxdWVzdENoYW5nZShlbmFibGVkKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2VcbiAgICAgIGlmICh0aGlzLm1pc3NpbmdPd25lckNvbmZpcm1hdGlvbihlcnIpKSB7XG4gICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gJ1RoaXMgcHJpbnRlciBzb2Z0d2FyZSBkb2VzIG5vdCBzdXBwb3J0IG93bmVyIGNvbmZpcm1hdGlvbiB5ZXQuIERldmVsb3BlciBtb2RlIHdhcyBub3QgY2hhbmdlZC4nXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnJlZnVzZWQoZXJyKVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChhc2tlZC5raW5kID09PSAnYXBwbGllZCcpIHtcbiAgICAgIC8vIEFuIG9sZGVyIGFkbWluIGJ1aWxkIHRoYXQgdGFrZXMgaXQgYWxvbmU6IGJlbGlldmUgaXQgb25seSB3aGVuIHRoZSBzdGF0ZSByZWFkcyBhcyBhc2tlZC5cbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tBcHBsaWVkKGVuYWJsZWQsIGFza2VkLmVuYWJsZWQpXG4gICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMubG9hZGluZyA9IGZhbHNlXG4gICAgaWYgKGFza2VkLmtpbmQgPT09ICd3YWl0aW5nJykge1xuICAgICAgLy8gNDI4OiB0aGUgcHJpbnRlciB3YW50cyBpdHMgc2NyZWVuLCBhbmQgbmFtZWQgbm8gY2hhbGxlbmdlLiBXYXRjaCB0aGUgc3RhdGUuXG4gICAgICB0aGlzLnBlbmRpbmcgPSB7IGNoYWxsZW5nZUlkOiAnJywgZW5hYmxlZCB9XG4gICAgICB0aGlzLmNvbnNlbnRJbnN0cnVjdGlvbiA9ICcnXG4gICAgICB0aGlzLnNlY29uZHNSZW1haW5pbmcgPSBERUZBVUxUX1dBSVRfU0VDT05EU1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjaGFsbGVuZ2UgPSBhc2tlZC5jaGFsbGVuZ2VcbiAgICAgIHRoaXMucGVuZGluZyA9IHsgY2hhbGxlbmdlSWQ6IGNoYWxsZW5nZS5jaGFsbGVuZ2VJZCwgZW5hYmxlZCwgd2FpdmVyVmVyc2lvbjogKGNoYWxsZW5nZS53YWl2ZXIgPz8gdGhpcy5hc2tpbmc/LndhaXZlcik/LnZlcnNpb24gfVxuICAgICAgdGhpcy5jb25zZW50SW5zdHJ1Y3Rpb24gPSBjaGFsbGVuZ2UuaW5zdHJ1Y3Rpb25cbiAgICAgIHRoaXMuc2Vjb25kc1JlbWFpbmluZyA9IE1hdGgubWF4KDAsIE1hdGgucm91bmQoY2hhbGxlbmdlLmV4cGlyZXNJblNlY29uZHMpKVxuICAgIH1cbiAgICB0aGlzLmF3YWl0aW5nID0gdHJ1ZVxuICAgIHRoaXMucG9sbEZhaWx1cmVzID0gMFxuICAgIHRoaXMuY291bnRkb3duVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy5zZWNvbmRzUmVtYWluaW5nID0gTWF0aC5tYXgoMCwgdGhpcy5zZWNvbmRzUmVtYWluaW5nIC0gMSlcbiAgICAgIGlmICh0aGlzLnNlY29uZHNSZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgdGhpcy5zdG9wV2FpdGluZygpXG4gICAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gVElNRURfT1VUXG4gICAgICB9XG4gICAgfSwgMTAwMClcbiAgICB0aGlzLnBvbGxUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7IHRoaXMucG9sbENvbnNlbnQoKS5jYXRjaCgoKSA9PiB1bmRlZmluZWQpIH0sIENPTlNFTlRfUE9MTF9NUylcbiAgfVxuXG4gIC8qKlxuICAgKiBBc2tzIHdoZXRoZXIgdGhlIHByaW50ZXIncyBzY3JlZW4gd2FzIGFuc3dlcmVkLiBUdXJuZWQgZG93biB0aGVyZSBlbmRzXG4gICAqIHRoZSB3YWl0OyBhIHByaW50ZXIgdGhhdCBzdG9wcyBhbnN3ZXJpbmcgaXMgc2FpZCBzbyBhZnRlciBhIGZldyB0cmllc1xuICAgKiByYXRoZXIgdGhhbiB3YWl0ZWQgb24gaW4gc2lsZW5jZS5cbiAgICovXG4gIGFzeW5jIHBvbGxDb25zZW50ICgpIHtcbiAgICBjb25zdCBwZW5kaW5nID0gdGhpcy5wZW5kaW5nXG4gICAgaWYgKCFwZW5kaW5nIHx8IHRoaXMubG9hZGluZyB8fCB0aGlzLnJlYWRpbmcpIHJldHVyblxuICAgIGxldCBhbnN3ZXJcbiAgICB0aGlzLnJlYWRpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGFuc3dlciA9IHBlbmRpbmcuY2hhbGxlbmdlSWRcbiAgICAgICAgPyBhd2FpdCByZWFkQW5zd2VyKHBlbmRpbmcuY2hhbGxlbmdlSWQsIHBlbmRpbmcuZW5hYmxlZClcbiAgICAgICAgOiBhd2FpdCB3YXRjaFN0YXRlKHBlbmRpbmcuZW5hYmxlZClcbiAgICAgIHRoaXMucG9sbEZhaWx1cmVzID0gMFxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5wb2xsRmFpbHVyZXMrK1xuICAgICAgaWYgKHRoaXMucG9sbEZhaWx1cmVzID49IDQpIHRoaXMuZXJyb3JNZXNzYWdlID0gYFRoZSBwcmludGVyIGlzbid0IHNheWluZyB3aGV0aGVyIGl0cyBzY3JlZW4gd2FzIGFuc3dlcmVkOiAke3RoaXMuZGVzY3JpYmUoZXJyKX1gXG4gICAgICByZXR1cm5cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5yZWFkaW5nID0gZmFsc2VcbiAgICB9XG4gICAgaWYgKGFuc3dlci5yZWZ1c2VkKSB7XG4gICAgICB0aGlzLnN0b3BXYWl0aW5nKClcbiAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gREVDTElORURcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIWFuc3dlci5jb25maXJtZWQpIHJldHVyblxuICAgIGlmIChhbnN3ZXIuYXBwbGllZCkge1xuICAgICAgLy8gVGhlIHByaW50ZXIgbWFkZSB0aGUgY2hhbmdlIGl0c2VsZjogaXQgaXMgZG9uZSwgYW5kIGFza2luZyBhZ2FpbiB3b3VsZCBvcGVuIGEgc2Vjb25kIHJlcXVlc3QuXG4gICAgICB0aGlzLnN0b3BXYWl0aW5nKClcbiAgICAgIHRoaXMuY2hhbmdlRGlhbG9nID0gZmFsc2VcbiAgICAgIGF3YWl0IHJlZnJlc2hEZXZNb2RlKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGNvbXBsZXRlQ2hhbmdlKHtcbiAgICAgICAgZW5hYmxlZDogcGVuZGluZy5lbmFibGVkLFxuICAgICAgICBjaGFsbGVuZ2VJZDogcGVuZGluZy5jaGFsbGVuZ2VJZCxcbiAgICAgICAgd2FpdmVyVmVyc2lvbjogcGVuZGluZy53YWl2ZXJWZXJzaW9uXG4gICAgICB9KVxuICAgICAgdGhpcy5zdG9wV2FpdGluZygpXG4gICAgICB0aGlzLmNoYW5nZURpYWxvZyA9IGZhbHNlXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBOb3QgY29uZmlybWVkIHlldCBhZnRlciBhbGwgKDQyOCk6IGtlZXAgd2FpdGluZyByYXRoZXIgdGhhbiBzYXlpbmcgYW55dGhpbmcgd2VudCB3cm9uZy5cbiAgICAgIGlmIChjb25maXJtYXRpb25SZXF1aXJlZChlcnIpKSB7XG4gICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5zdG9wV2FpdGluZygpXG4gICAgICBhd2FpdCB0aGlzLnJlZnVzZWQoZXJyKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZVxuICAgICAgYXdhaXQgcmVmcmVzaERldk1vZGUoKVxuICAgIH1cbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlciB0b29rIHRoZSBjaGFuZ2UgYXQgb25jZTogc2hvdyBpdCB3aGVuIGl0cyByZXBseSwgb3IgYSByZS1yZWFkIG9mIHRoZSBzdGF0ZSwgc2F5cyBzby4gKi9cbiAgYXN5bmMgY2hlY2tBcHBsaWVkIChlbmFibGVkOiBib29sZWFuLCByZXBsaWVkOiBib29sZWFuKSB7XG4gICAgY29uc3Qgc3RhdGUgPSBhd2FpdCByZWZyZXNoRGV2TW9kZSgpXG4gICAgaWYgKHJlcGxpZWQgPT09IGVuYWJsZWQgfHwgc3RhdGUgPT09IGVuYWJsZWQpIHtcbiAgICAgIHRoaXMuY2hhbmdlRGlhbG9nID0gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSBcIkNvdWxkbid0IGNvbmZpcm0gdGhlIHByaW50ZXIgbWFkZSB0aGUgY2hhbmdlLiBOb3RoaW5nIGNoYW5nZWQuXCJcbiAgICB9XG4gIH1cblxuICAvKiogU2F5cyB3aHkgdGhlIHByaW50ZXIgcmVmdXNlZCwgYW5kIGNhdGNoZXMgdXAgd2l0aCB3aGF0IGl0IHNhaWQuICovXG4gIGFzeW5jIHJlZnVzZWQgKGVycjogdW5rbm93bikge1xuICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gdGhpcy5kZXNjcmliZShlcnIpXG4gICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRGV2TW9kZVJlZnVzZWQpKSByZXR1cm5cbiAgICBpZiAoZXJyLmNvZGUgPT09ICdub19jaGFuZ2UnKSB7XG4gICAgICBhd2FpdCByZWZyZXNoRGV2TW9kZSgpXG4gICAgICB0aGlzLmNoYW5nZURpYWxvZyA9IGZhbHNlXG4gICAgfSBlbHNlIGlmIChlcnIuY29kZSA9PT0gJ293bmVyX3JlcXVpcmVkJyB8fCBlcnIuY29kZSA9PT0gJ293bmVyX3Vua25vd24nKSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBc2tpbmcoKVxuICAgIH0gZWxzZSBpZiAoZXJyLmNvZGUgPT09ICdwYW5lbF9vbmx5Jykge1xuICAgICAgLy8gQW4gb2xkZXIgTXVvbk9TIHRoYXQgd2FudHMgdGhpcyBjaGFuZ2UgbWFkZSBhdCBpdHMgb3duIHNjcmVlbiAoS0FOLTE3MzkpLlxuICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSBcIlRoaXMgcHJpbnRlcidzIHNvZnR3YXJlIG9ubHkgdGFrZXMgdGhpcyBhdCBpdHMgb3duIHNjcmVlbjogU3lzdGVtLCB0aGVuIFByb3RlY3Rpb24sIHRoZW4gRGV2ZWxvcGVyIG1vZGUuIENvbnRyb2wgY2FuJ3QgZG8gaXQgZm9yIGl0IHlldC5cIlxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlc3RvcmVEZWZhdWx0cyAoKSB7XG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLiRjb25maXJtKCdZb3VyIGNvcHkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gaXMgYmFja2VkIHVwLCB0aGVuIHJlcGxhY2VkIHdpdGggdGhlIE11b24zRCBkZWZhdWx0cywgYW5kIEtsaXBwZXIgcmVzdGFydHMuJywge1xuICAgICAgdGl0bGU6ICdTdGFydCBhZ2FpbiBmcm9tIHRoZSBkZWZhdWx0cz8nLFxuICAgICAgYnV0dG9uVHJ1ZVRleHQ6ICdCYWNrIHVwIGFuZCByZXBsYWNlJyxcbiAgICAgIGRhbmdlcjogdHJ1ZVxuICAgIH0pXG4gICAgaWYgKCFvaykgcmV0dXJuXG4gICAgdGhpcy5sb2FkaW5nID0gdHJ1ZVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmFwaS5yZWZyZXNoRGV2TW9kZUNvbmZpZ0Rldk1vZGVSZWZyZXNoUG9zdCgpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLm5vdGlmeSgnU3RhcnQgYWdhaW4gZnJvbSB0aGUgZGVmYXVsdHMnLCBlcnIpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYmFja3VwQ29uZmlnICgpIHtcbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYXBpLm1hbnVhbEJhY2t1cERldk1vZGVCYWNrdXBQb3N0KClcbiAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdub3RpZmljYXRpb25zL3B1c2hOb3RpZmljYXRpb24nLCB7IHRpdGxlOiAnQ29uZmlnIGJhY2tlZCB1cCcsIGRlc2NyaXB0aW9uOiAnSW4gdGhlIGNvbmZpZyBmb2xkZXIsIHVuZGVyIGJhY2t1cHMuJywgdHlwZTogJ3N1Y2Nlc3MnIH0pXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLm5vdGlmeSgnQmFjayB1cCB0aGUgY29uZmlnJywgZXJyKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIG5vdGlmeSAodGl0bGU6IHN0cmluZywgZXJyOiB1bmtub3duKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ25vdGlmaWNhdGlvbnMvcHVzaE5vdGlmaWNhdGlvbicsIHsgdGl0bGUsIGRlc2NyaXB0aW9uOiB0aGlzLmRlc2NyaWJlKGVyciksIHR5cGU6ICdlcnJvcicgfSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmRldm0ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE0cHg7XG4gICAgcGFkZGluZzogMjBweDtcbiAgICBib3JkZXItcmFkaXVzOiAyMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgLmRldm1fX2NhcmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxOHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICB9XG5cbiAgLmRldm1fX3dhcnJhbnR5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIGdhcDogOHB4O1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAxMHB4IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nLCAjZTg5NjNjKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuZGV2bV9faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAuZGV2bV9fdGl0bGVzIHtcbiAgICBoMiB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBmb250LXNpemU6IDE3cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgIH1cblxuICAgIHAge1xuICAgICAgbWFyZ2luOiAycHggMCAwO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cblxuICAuZGV2bV9fc3RhdGUtLW9uIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MsICM1N2MwOGEpICFpbXBvcnRhbnQ7XG4gIH1cblxuICAuZGV2bV9faGVhZCA6ZGVlcCgudG9nZ2xlLS1vbikge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdWNjZXNzKTtcbiAgfVxuXG4gIC5kZXZtX19zbWFsbCB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuICAgIG1pbi1oZWlnaHQ6IDA7XG4gICAgcGFkZGluZzogN3B4IDE0cHg7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmRldm1fX3NzaCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgcGFkZGluZzogMTBweCAxMHB4IDEwcHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgfVxuXG4gIC5kZXZtX19zc2gtdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAycHg7XG4gICAgbWluLXdpZHRoOiAwO1xuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIH1cblxuICAgIGNvZGUge1xuICAgICAgb3ZlcmZsb3ctd3JhcDogYW55d2hlcmU7XG4gICAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgdWktbW9ub3NwYWNlLCBtb25vc3BhY2UpO1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgIH1cbiAgfVxuXG4gIC5kZXZtX19zc2ggLmNidG4ge1xuICAgIGZsZXg6IG5vbmU7XG4gIH1cblxuICAuZGV2bV9fdGV4dCxcbiAgLmRldm1fX25vdGUge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5kZXZtX19hY2NlcHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgZ2FwOiAxMHB4O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5kZXZtX19hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDhweDtcbiAgfVxuXG4gIC5kZXZtX19kaWFsb2cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMjJweDtcbiAgICBib3JkZXItcmFkaXVzOiAyMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuXG4gICAgaDMge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgZm9udC1zaXplOiAxOHB4O1xuICAgIH1cblxuICAgIHAge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB9XG4gIH1cblxuICAuZGV2bV9fcHJlc3Mge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuXG4gICAgZGl2IHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIH1cblxuICAgIHNwYW4ge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cblxuICAuZGV2bV9fcHVsc2Uge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgd2lkdGg6IDE0cHg7XG4gICAgaGVpZ2h0OiAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBhbmltYXRpb246IGRldm0tcHVsc2UgMS4ycyBlYXNlLWluLW91dCBpbmZpbml0ZTtcbiAgfVxuXG4gIEBrZXlmcmFtZXMgZGV2bS1wdWxzZSB7XG4gICAgNTAlIHsgYm94LXNoYWRvdzogMCAwIDAgOHB4IHJnYigxMjggMjE0IDIwOSAvIDAlKTsgb3BhY2l0eTogMC41OyB9XG4gIH1cblxuICAuZGV2bV9fZXJyb3Ige1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmRldm1fX2J1dHRvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDhweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL0RldmVsb3Blck1vZGVTZXR0aW5ncy52dWUifQ==