/* unplugin-vue-components disabled */import { VBtn as __unplugin_components_33 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_32 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_31 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_30 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_29 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_28 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_27 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_26 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressLinear as __unplugin_components_25 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_24 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_23 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_22 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_21 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_20 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_19 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_17 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_15 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_14 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_13 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_6 from "/src/components/ui/AppBtn.vue";
import { VTextField as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppBtn.vue";
import { VBtn as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppBtn.vue";
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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { SetupHttpError } from "/src/services/muon-setup/client.ts";
import { pageLanguageFor } from "/src/services/muon-setup/language.ts";
import { screenFor } from "/src/services/muon-setup/screen.ts";
import { frameSteps, previousStep } from "/src/services/muon-setup/steps.ts";
import { setLocal, setupState } from "/src/services/muon-setup/state.ts";
import { joinErrorCopy, validPsk, writeErrorCopy } from "/src/services/muon-setup/wifiCopy.ts";
import SetupStepCard from "/src/components/muon-setup/SetupStepCard.vue";
const READY_TITLES = {
  transport_clips: "Take out the transport clips",
  self_test: "Run the self-test",
  load_filament: "Load filament"
};
const JOIN_PHASES = ["saving", "associating", "authenticating", "dhcp", "internet_check", "update_check"];
let SetupWifiSteps = class extends Vue {
  client;
  overBluetooth;
  networks = [];
  cable = null;
  scanning = false;
  scanError = null;
  selected = null;
  password = "";
  showPassword = false;
  passwordError = null;
  busy = false;
  writeError = null;
  confirmSkip = false;
  languages = [];
  nameDraft = "";
  readyManifest = [];
  remoteChoice = null;
  get state() {
    return setupState.state;
  }
  get screen() {
    return screenFor(setupState.state, setupState.local);
  }
  get name() {
    return this.state?.printer.name ?? "The printer";
  }
  get display() {
    return this.state?.printer.display ?? this.name;
  }
  get network() {
    return this.state?.steps.network ?? {
      status: "pending",
      kind: null,
      ssid: null,
      addresses: [],
      hostname_local: null,
      internet: null,
      error: null,
      region_confirmed: false,
      region_error: null
    };
  }
  get cursor() {
    return this.state?.cursor ?? null;
  }
  get eyebrow() {
    const steps = frameSteps(this.state, this.screen);
    const at = steps.findIndex((step) => step.status === "on");
    return at < 0 ? "" : `Step ${at + 1} of ${steps.length}`;
  }
  /** Where Back goes: the printer's `goto` only takes an earlier done or skipped step. */
  get previous() {
    return previousStep(this.state);
  }
  get selectedNetwork() {
    return this.networks.find((n) => n.ssid === this.selected) ?? null;
  }
  get update() {
    return this.state?.steps.update ?? { status: "pending", current: "", available: null, error: null };
  }
  get updateProgress() {
    const progress = this.state?.op?.kind === "update_install" ? this.state.op.progress : null;
    return typeof progress === "number" ? progress : null;
  }
  get remote() {
    return this.state?.steps.remote ?? { status: "pending", mode: null, link: null, error: null };
  }
  get link() {
    return this.remote.link;
  }
  /** Linking needs the internet and a synced clock (02 §5.9); say so rather than offer it. */
  get cloudBlocked() {
    if (!this.state) return null;
    if (this.state.capabilities.cloud_link === false) return `${this.name} can't link to an account`;
    if (this.network.internet !== true) return `Needs ${this.name} on the internet`;
    if (this.state.clock.synced !== true) return `Waiting for ${this.name}'s clock to set`;
    return null;
  }
  /** The selected option is one the printer can't do right now. */
  get remoteBlocked() {
    return this.remoteChoice === "cloud" && !!this.cloudBlocked;
  }
  get remoteOptions() {
    return [
      {
        mode: "cloud",
        title: "Link to my Muon3D account",
        detail: "See it and print from anywhere",
        disabled: this.cloudBlocked
      },
      {
        mode: "local",
        title: "Only on this network",
        detail: "Nothing leaves your network",
        disabled: null
      }
    ];
  }
  get remoteError() {
    const code = this.remote.error?.code;
    if (code === "no_internet") return `${this.name} needs the internet to link.`;
    if (code === "clock_unsynced") return `${this.name}'s clock isn't set yet. Try again in a moment.`;
    return `${this.name} couldn't start linking. Try again, or skip for now.`;
  }
  get linkSub() {
    const link = this.link;
    if (link?.phase === "code") return "Enter this code on the link page, signed in to your Muon3D account.";
    if (link?.phase === "offer") return `Confirm ${link.account} on ${this.name}'s screen.`;
    if (link?.phase === "linked") return `Linked to ${link.account}.`;
    if (link?.phase === "failed") return "";
    return "Getting a code\u2026";
  }
  get readyItems() {
    const manifest = this.readyManifest;
    const required = new Set(manifest.length ? manifest.filter((i) => i.required).map((i) => i.id) : this.state?.steps.ready.items.map((i) => i.id));
    const running = this.state?.op?.kind === "ready_item" ? this.state.op.item : null;
    return (this.state?.steps.ready.items ?? []).filter((item) => item.status !== "hidden").map((item) => ({
      id: item.id,
      status: item.status,
      title: READY_TITLES[item.id] ?? item.id.replace(/_/g, " "),
      running: running === item.id,
      note: running === item.id ? "Running now" : item.status === "done" ? "Done" : item.status === "skipped" ? "Skipped" : item.status === "failed" ? "Failed: try again at the printer" : required.has(item.id) ? "Needed" : "Optional",
      // Required items always happen; the phone can only skip the optional ones.
      skippable: !required.has(item.id) && item.status === "pending" && running !== item.id
    }));
  }
  get joiningSsid() {
    return this.state?.op?.target ?? this.selected ?? this.network.ssid ?? "the network";
  }
  get checklist() {
    const op = this.state?.op;
    const at = JOIN_PHASES.indexOf(String(op?.phase ?? "saving"));
    const step = (label, phase) => {
      const i = JOIN_PHASES.indexOf(phase);
      return { label, status: at > i ? "done" : at === i ? "now" : "next" };
    };
    const items = [
      step("Password accepted", "authenticating"),
      step("Got an address", "dhcp"),
      step("Checking internet", "internet_check"),
      step("Checking for updates", "update_check")
    ];
    if (op?.kind === "region_apply") items.unshift({ label: "Setting the region", status: "now" });
    return items;
  }
  get joinError() {
    const error = this.network.error;
    if (!error || error.code === "portal_required") return null;
    const ssid = String(error.detail?.ssid ?? this.network.ssid ?? "the network");
    return joinErrorCopy(error, this.name, ssid);
  }
  get regionCountry() {
    return this.state?.region.detected_country ?? null;
  }
  get regionError() {
    const code = this.network.region_error?.code;
    if (code === "region_busy") return "The Wi-Fi radio is busy. Try again in a moment.";
    if (code === "needs_reregistration") return "This printer needs re-registering. Contact support.";
    return "We could not apply that region.";
  }
  onCursor(cursor) {
    if (cursor === "name") this.nameDraft = this.state?.steps.name.value || this.state?.steps.name.derived || "";
    if (cursor === "remote") this.remoteChoice = this.cloudBlocked ? "local" : "cloud";
    this.writeError = null;
  }
  onCloudBlocked(blocked) {
    if (blocked && this.remoteChoice === "cloud") this.remoteChoice = "local";
  }
  onScreen(screen, before) {
    if (screen === "S3" && before !== "S3") this.scan(true);
  }
  created() {
    this.client.options().then((o) => {
      this.languages = (o.languages ?? []).map((l) => l.code);
      this.readyManifest = o.ready_manifest?.items ?? [];
    }).catch(() => {
    });
  }
  countryName(code) {
    if (!code) return "not detected";
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  }
  unusable(n) {
    if (!n.supported || n.security === "wep") return "Not supported";
    if (n.security === "enterprise") return `Enterprise: set it up on ${this.name}'s screen`;
    if (!n.channel_permitted) return `Its channel isn't allowed in ${this.name}'s region: use its screen`;
    return null;
  }
  networkMeta(n) {
    const parts = [`${n.signal}%`, n.band ? `${n.band} GHz` : ""];
    if (this.needsPassword(n)) parts.unshift("Secured");
    if (n.saved) parts.push("Saved");
    return parts.filter(Boolean).join(" \xB7 ");
  }
  needsPassword(n) {
    return !["open", "owe"].includes(n.security);
  }
  async scan(rescan) {
    this.scanning = true;
    this.scanError = null;
    try {
      const result = await this.client.networks(rescan);
      this.networks = result.networks ?? [];
      this.cable = result.ethernet?.carrier ? result.ethernet.address : null;
      if (!result.ok && result.error) this.scanError = `${this.name} couldn't scan for networks. Scan again.`;
    } catch {
      this.scanError = `${this.name} didn't answer the scan. Scan again.`;
    } finally {
      this.scanning = false;
    }
  }
  choose(n) {
    if (this.selected !== n.ssid) {
      this.selected = n.ssid;
      this.password = "";
      this.passwordError = null;
      this.showPassword = false;
    }
    this.writeError = null;
  }
  /** Posts a write, and says why it was refused. Resolves to whether it went through. */
  async write(path, body = {}, opts) {
    if (this.busy) return false;
    this.busy = true;
    this.writeError = null;
    try {
      const result = await this.client.post(path, body, opts);
      if (!result) return true;
      if (result.ok) return true;
      this.writeError = writeErrorCopy(result.error, this.name);
      return false;
    } catch (error) {
      this.writeError = error instanceof SetupHttpError ? `${this.name} refused that: ${error.message}` : String(error?.message ?? error);
      return false;
    } finally {
      this.busy = false;
    }
  }
  async start() {
    this.busy = true;
    try {
      await this.client.postClock();
      if (this.state?.steps.language.status === "pending") {
        const code = pageLanguageFor(this.state, this.languages, navigator.languages ?? [navigator.language], null);
        await this.client.post("language", { code }).catch(() => null);
      }
      const claimed = await this.client.claimDriver();
      if (claimed && !claimed.ok) this.writeError = writeErrorCopy(claimed.error, this.name);
      else setLocal({ droveSetup: true });
    } catch (error) {
      this.writeError = String(error?.message ?? error);
    } finally {
      this.busy = false;
    }
  }
  async join(n) {
    const psk = this.password;
    if (this.needsPassword(n) && !validPsk(psk)) {
      this.passwordError = "A Wi-Fi password is 8 to 63 characters, or 64 hexadecimal digits.";
      return;
    }
    this.passwordError = null;
    const rev = this.state?.rev ?? null;
    const sent = await this.write("network", {
      kind: "wifi",
      ssid: n.ssid,
      hidden: false,
      security: n.security,
      ...this.needsPassword(n) ? { psk } : {},
      region: null,
      eap: null
    });
    if (sent) setLocal({ joinRev: rev });
    this.password = "";
  }
  async useCable() {
    const rev = this.state?.rev ?? null;
    if (await this.write("network", { kind: "ethernet" })) setLocal({ joinRev: rev });
  }
  cancelJoin() {
    return this.write("network/cancel", {}, { rev: false });
  }
  async skipNetwork() {
    if (await this.write("skip", { step: "network" })) this.confirmSkip = false;
  }
  confirmRegion() {
    if (this.regionCountry) return this.write("region", { country: this.regionCountry });
  }
  /** Back to the list, with the same network open and its password field empty. */
  tryAgain() {
    const ssid = this.network.error?.detail?.ssid;
    setLocal({ joinRev: null });
    if (typeof ssid === "string") this.selected = ssid;
    this.showPassword = false;
  }
  chooseAnother() {
    setLocal({ joinRev: null });
    this.selected = null;
    this.showPassword = false;
  }
  acknowledge() {
    setLocal({ joinRev: null });
  }
  goBack() {
    if (this.previous) return this.write("goto", { step: this.previous });
  }
  saveName() {
    const name = this.nameDraft.trim();
    if (name) return this.write("name", { name });
  }
  async installUpdate() {
    const sent = await this.write("update", { action: "install" });
    if (sent) this.$emit("installing");
    return sent;
  }
  updateLater() {
    return this.write("update", { action: "later" });
  }
  chooseRemote(mode) {
    return this.write("remote", { mode });
  }
  /** Back from the code: stop linking, and go back to the choice. */
  cancelLink() {
    return this.write("remote/cancel", {}, { rev: false });
  }
  skipReadyItem(item) {
    return this.write("ready", { action: "skip", item });
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], SetupWifiSteps.prototype, "client", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], SetupWifiSteps.prototype, "overBluetooth", 2);
__decorateClass([
  Watch("cursor", { immediate: true })
], SetupWifiSteps.prototype, "onCursor", 1);
__decorateClass([
  Watch("cloudBlocked")
], SetupWifiSteps.prototype, "onCloudBlocked", 1);
__decorateClass([
  Watch("screen", { immediate: true })
], SetupWifiSteps.prototype, "onScreen", 1);
SetupWifiSteps = __decorateClass([
  Component({ components: { SetupStepCard } })
], SetupWifiSteps);
const _sfc_main = SetupWifiSteps;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "muon-setup-steps" }, [_vm.screen === "S1" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": `Set up ${_vm.display}`, "sub": "About three minutes. Keep this page open until it says you're done." }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_0, { attrs: { "color": "primary", "loading": _vm.busy, "data-tid": "setup-start" }, on: { "click": _vm.start } }, [_vm._v(" Start ")])];
  }, proxy: true }], null, false, 4174733046) }, [_vm.overBluetooth ? _c("p", { staticClass: "muon-setup-steps__lede" }, [_vm._v(" This computer stays on its own network and talks to " + _vm._s(_vm.name) + " over Bluetooth until " + _vm._s(_vm.name) + " is on Wi-Fi too. ")]) : _vm._e(), _c("ol", { staticClass: "muon-setup-steps__plan" }, [_c("li", [_vm._v("Wi-Fi")]), _c("li", [_vm._v("Name and updates")]), _c("li", [_vm._v("Your account, if you want remote access")]), _c("li", [_vm._v("Last steps at the printer")])]), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error" }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e()]) : _vm.screen === "S3" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": "Choose Wi-Fi", "sub": `${_vm.name} uses it to take prints and fetch updates.` }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [!_vm.confirmSkip ? _c(__unplugin_components_1, { attrs: { "text": "", "data-tid": "wifi-skip" }, on: { "click": function($event) {
      _vm.confirmSkip = true;
    } } }, [_vm._v(" Skip for now ")]) : _vm._e(), !_vm.selectedNetwork ? _c(__unplugin_components_2, { attrs: { "color": "primary", "disabled": "", "data-tid": "wifi-connect" } }, [_vm._v(" Connect and continue ")]) : _vm._e()];
  }, proxy: true }]) }, [_c("div", { staticClass: "muon-setup-steps__head" }, [_c("span", { staticClass: "muon-setup-steps__muted" }, [_vm._v(" " + _vm._s(_vm.scanning ? "Looking for networks\u2026" : `${_vm.networks.length} networks nearby`) + " ")]), _c(__unplugin_components_3, { attrs: { "small": "", "text": "", "loading": _vm.scanning, "data-tid": "wifi-scan" }, on: { "click": function($event) {
    return _vm.scan(true);
  } } }, [_vm._v(" Scan again ")])], 1), _vm.cable ? _c("div", { staticClass: "muon-setup-steps__network is-card" }, [_c("span", { staticClass: "muon-setup-steps__network-name" }, [_vm._v("Connected by cable \xB7 " + _vm._s(_vm.cable))]), _c(__unplugin_components_4, { attrs: { "small": "", "text": "", "disabled": _vm.busy, "data-tid": "wifi-cable" }, on: { "click": _vm.useCable } }, [_vm._v(" Use this connection ")])], 1) : _vm._e(), _vm.scanError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "wifi-scan-error" } }, [_vm._v(" " + _vm._s(_vm.scanError) + " ")]) : !_vm.scanning && !_vm.networks.length ? _c("p", { staticClass: "muon-setup-steps__muted", attrs: { "data-tid": "wifi-none" } }, [_vm._v(" " + _vm._s(_vm.name) + " can't see any Wi-Fi networks. Scan again, or move it closer to the router. ")]) : _vm._e(), _vm._l(_vm.networks, function(n) {
    return _c("div", { key: n.ssid, staticClass: "muon-setup-steps__network", class: { "is-open": _vm.selected === n.ssid, "is-disabled": !!_vm.unusable(n) } }, [_c("button", { staticClass: "muon-setup-steps__network-row", attrs: { "type": "button", "disabled": !!_vm.unusable(n) || _vm.busy, "aria-pressed": _vm.selected === n.ssid ? "true" : "false", "data-tid": `wifi-${n.ssid}` }, on: { "click": function($event) {
      return _vm.choose(n);
    } } }, [_c("span", { staticClass: "muon-setup-steps__network-name" }, [_vm._v(_vm._s(n.ssid))]), _c("span", { staticClass: "muon-setup-steps__network-meta" }, [_vm._v(" " + _vm._s(_vm.unusable(n) || _vm.networkMeta(n)) + " ")])]), _vm.selected === n.ssid ? _c("form", { staticClass: "muon-setup-steps__join", on: { "submit": function($event) {
      $event.preventDefault();
      return _vm.join(n);
    } } }, [_vm.needsPassword(n) ? _c(__unplugin_components_5, { attrs: { "type": _vm.showPassword ? "text" : "password", "label": `Password for ${n.ssid}`, "autocomplete": "off", "autocapitalize": "off", "spellcheck": "false", "dense": "", "outlined": "", "hide-details": "auto", "error-messages": _vm.passwordError, "append-icon": _vm.showPassword ? "$eyeOff" : "$eye", "data-tid": "wifi-password" }, on: { "click:append": function($event) {
      _vm.showPassword = !_vm.showPassword;
    } }, model: { value: _vm.password, callback: function($$v) {
      _vm.password = $$v;
    }, expression: "password" } }) : _vm._e(), _c(__unplugin_components_6, { attrs: { "color": "primary", "type": "submit", "loading": _vm.busy, "disabled": _vm.needsPassword(n) && !_vm.password, "data-tid": "wifi-connect" } }, [_vm._v(" Connect and continue ")])], 1) : _vm._e()]);
  }), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "write-error" } }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e(), _vm.confirmSkip ? _c("div", { staticClass: "muon-setup-steps__confirm", attrs: { "data-tid": "wifi-skip-confirm" } }, [_c("p", [_vm._v(_vm._s(_vm.name) + " will stay offline. You can connect it later from its screen.")]), _c(__unplugin_components_7, { attrs: { "small": "", "text": "" }, on: { "click": function($event) {
    _vm.confirmSkip = false;
  } } }, [_vm._v(" Keep Wi-Fi ")]), _c(__unplugin_components_8, { attrs: { "small": "", "text": "", "color": "primary", "loading": _vm.busy, "data-tid": "wifi-skip-yes" }, on: { "click": _vm.skipNetwork } }, [_vm._v(" Skip Wi-Fi ")])], 1) : _vm._e()], 2) : _vm.screen === "S4" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": `Joining ${_vm.joiningSsid}`, "sub": "This takes up to a minute." }, scopedSlots: _vm._u([_vm.state && _vm.state.op && _vm.state.op.kind === "join" ? { key: "footer", fn: function() {
    return [_c(__unplugin_components_9, { attrs: { "text": "", "loading": _vm.busy, "data-tid": "join-cancel" }, on: { "click": _vm.cancelJoin } }, [_vm._v(" Cancel ")])];
  }, proxy: true } : null], null, true) }, [_c("ul", { staticClass: "muon-setup-steps__checklist" }, _vm._l(_vm.checklist, function(item) {
    return _c("li", { key: item.label, class: `is-${item.status}` }, [item.status === "now" ? _c(__unplugin_components_10, { attrs: { "indeterminate": "", "size": "12", "width": "2" } }) : item.status === "done" ? _c(__unplugin_components_11, { attrs: { "x-small": "" } }, [_vm._v(" $check ")]) : _vm._e(), _c("span", [_vm._v(_vm._s(item.label))])], 1);
  }), 0)]) : _vm.screen === "S4r" && _vm.state && _vm.joinError ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": "Wi-Fi didn't connect" }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_12, { attrs: { "text": "", "data-tid": "join-another" }, on: { "click": _vm.chooseAnother } }, [_vm._v(" Choose another network ")]), _c(__unplugin_components_13, { attrs: { "color": "primary", "data-tid": "join-retry" }, on: { "click": _vm.tryAgain } }, [_vm._v(" Try again ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "join-error" } }, [_vm._v(" " + _vm._s(_vm.joinError) + " ")])]) : _vm.screen === "S4r" && _vm.state ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": "Wi-Fi connected" }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [!_vm.network.region_confirmed ? _c(__unplugin_components_14, { attrs: { "color": "primary", "loading": _vm.busy || !!(_vm.state.op && _vm.state.op.kind === "region_apply"), "disabled": !_vm.regionCountry, "data-tid": "region-confirm" }, on: { "click": _vm.confirmRegion } }, [_vm._v(" Confirm ")]) : _c(__unplugin_components_15, { attrs: { "color": "primary", "data-tid": "join-continue" }, on: { "click": _vm.acknowledge } }, [_vm._v(" Continue ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "muon-setup-steps__done", attrs: { "data-tid": "join-done" } }, [_vm._v(" " + _vm._s(_vm.name) + " is on " + _vm._s(_vm.network.ssid || "the network") + " ")]), _c("p", { staticClass: "muon-setup-steps__muted" }, [_vm._v(" " + _vm._s(_vm.network.addresses.join(", "))), _vm.network.hostname_local ? [_vm._v(" \xB7 " + _vm._s(_vm.network.hostname_local) + " ")] : _vm._e()], 2), _vm.network.internet === false ? _c("p", { staticClass: "muon-setup-steps__muted" }, [_vm._v(" No internet. Printing over the network works; updates and remote access are off. ")]) : _vm._e(), _vm.network.internet === "portal" ? _c("p", { staticClass: "muon-setup-steps__error" }, [_vm._v(" " + _vm._s(_vm.network.ssid) + " needs a sign-in page, which a printer can't complete. Printing over this network works, but updates and remote access won't. ")]) : _vm._e(), !_vm.network.region_confirmed ? [_c("p", { staticClass: "muon-setup-steps__region" }, [_vm._v(" Region: "), _c("strong", [_vm._v(_vm._s(_vm.countryName(_vm.regionCountry)))])]), _vm.network.region_error ? _c("p", { staticClass: "muon-setup-steps__error" }, [_vm._v(" " + _vm._s(_vm.regionError) + " ")]) : _vm._e(), _c("p", { staticClass: "muon-setup-steps__muted" }, [_vm._v(" To choose another region, use " + _vm._s(_vm.name) + "'s screen. ")])] : _vm._e()], 2) : _vm.screen === "S5" && _vm.cursor === "name" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": "Name your printer", "sub": "It shows up with this name in Control and on your network." }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_vm.previous ? _c(__unplugin_components_16, { staticClass: "setup-step__back", attrs: { "text": "", "disabled": _vm.busy, "data-tid": "setup-back" }, on: { "click": _vm.goBack } }, [_vm._v(" Back ")]) : _vm._e(), _c(__unplugin_components_17, { attrs: { "color": "primary", "loading": _vm.busy, "disabled": !_vm.nameDraft.trim(), "data-tid": "name-save" }, on: { "click": _vm.saveName } }, [_vm._v(" Continue ")])];
  }, proxy: true }]) }, [_c("form", { on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.saveName.apply(null, arguments);
  } } }, [_c(__unplugin_components_18, { attrs: { "label": "Printer name", "autocomplete": "off", "outlined": "", "dense": "", "hide-details": "auto", "placeholder": _vm.state ? _vm.state.steps.name.derived : "", "data-tid": "name-field" }, model: { value: _vm.nameDraft, callback: function($$v) {
    _vm.nameDraft = $$v;
  }, expression: "nameDraft" } })], 1), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "write-error" } }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e()]) : _vm.screen === "S5" && _vm.cursor === "update" && _vm.state ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": _vm.update.available ? "Update available" : `${_vm.name} is up to date`, "sub": _vm.update.available ? `${_vm.name} runs ${_vm.update.current}. ${_vm.update.available} is ready to install; it takes a few minutes.` : `${_vm.name} runs ${_vm.update.current}.` }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_vm.previous ? _c(__unplugin_components_19, { staticClass: "setup-step__back", attrs: { "text": "", "disabled": _vm.busy, "data-tid": "setup-back" }, on: { "click": _vm.goBack } }, [_vm._v(" Back ")]) : _vm._e(), _vm.update.available ? _c(__unplugin_components_20, { attrs: { "text": "", "disabled": _vm.busy, "data-tid": "update-later" }, on: { "click": _vm.updateLater } }, [_vm._v(" Later ")]) : _vm._e(), _c(__unplugin_components_21, { attrs: { "color": "primary", "loading": _vm.busy, "data-tid": "update-go" }, on: { "click": function($event) {
      _vm.update.available ? _vm.installUpdate() : _vm.updateLater();
    } } }, [_vm._v(" " + _vm._s(_vm.update.available ? "Install update" : "Continue") + " ")])];
  }, proxy: true }]) }, [_vm.overBluetooth && _vm.update.available ? _c("p", { staticClass: "muon-setup-steps__muted", attrs: { "data-tid": "update-ble-warning" } }, [_vm._v(" " + _vm._s(_vm.name) + " restarts to install this, and the Bluetooth link will drop. Setup carries on at the printer, or reconnect once it has restarted. ")]) : _vm._e(), _vm.update.error ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "update-error" } }, [_vm._v(" " + _vm._s(_vm.name) + " couldn't install the update. You can try again, or update later from Settings. ")]) : _vm._e(), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "write-error" } }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e()]) : _vm.screen === "S5" && _vm.state ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": "Your account", "sub": `Link ${_vm.name} to your Muon3D account to watch and print from anywhere.` }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_vm.previous ? _c(__unplugin_components_22, { staticClass: "setup-step__back", attrs: { "text": "", "disabled": _vm.busy, "data-tid": "setup-back" }, on: { "click": _vm.goBack } }, [_vm._v(" Back ")]) : _vm._e(), _c(__unplugin_components_23, { attrs: { "text": "", "disabled": _vm.busy, "data-tid": "remote-skip" }, on: { "click": function($event) {
      return _vm.chooseRemote("later");
    } } }, [_vm._v(" Skip for now ")]), _c(__unplugin_components_24, { attrs: { "color": "primary", "loading": _vm.busy, "disabled": !_vm.remoteChoice || _vm.remoteBlocked, "data-tid": "remote-continue" }, on: { "click": function($event) {
      _vm.remoteChoice && _vm.chooseRemote(_vm.remoteChoice);
    } } }, [_vm._v(" Continue ")])];
  }, proxy: true }]) }, [_c("div", { staticClass: "muon-setup-steps__choices", attrs: { "role": "radiogroup", "aria-label": "Remote access" } }, _vm._l(_vm.remoteOptions, function(option) {
    return _c("button", { key: option.mode, staticClass: "muon-setup-steps__network muon-setup-steps__network-row", class: { "is-open": _vm.remoteChoice === option.mode, "is-disabled": !!option.disabled }, attrs: { "type": "button", "role": "radio", "aria-checked": _vm.remoteChoice === option.mode ? "true" : "false", "disabled": !!option.disabled || _vm.busy, "data-tid": `remote-${option.mode}` }, on: { "click": function($event) {
      _vm.remoteChoice = option.mode;
    } } }, [_c("span", { staticClass: "muon-setup-steps__network-name" }, [_vm._v(_vm._s(option.title))]), _c("span", { staticClass: "muon-setup-steps__network-meta" }, [_vm._v(_vm._s(option.disabled || option.detail))])]);
  }), 0), _vm.remote.error ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "remote-error" } }, [_vm._v(" " + _vm._s(_vm.remoteError) + " ")]) : _vm._e(), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "write-error" } }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e()]) : _vm.screen === "S5u" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": `Updating ${_vm.name}`, "sub": "Keep it switched on. It restarts when it's done, and this page carries on." } }, [_c(__unplugin_components_25, { attrs: { "indeterminate": _vm.updateProgress === null, "value": _vm.updateProgress === null ? 0 : _vm.updateProgress, "rounded": "", "data-tid": "update-progress" } })], 1) : _vm.screen === "S6" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": `Link ${_vm.name} to your account`, "sub": _vm.linkSub }, scopedSlots: _vm._u([{ key: "footer", fn: function() {
    return [_c(__unplugin_components_26, { staticClass: "setup-step__back", attrs: { "text": "", "disabled": _vm.busy, "data-tid": "link-cancel" }, on: { "click": _vm.cancelLink } }, [_vm._v(" Back ")]), _c(__unplugin_components_27, { attrs: { "text": "", "disabled": _vm.busy, "data-tid": "remote-skip" }, on: { "click": function($event) {
      return _vm.chooseRemote("later");
    } } }, [_vm._v(" Skip for now ")]), _vm.link && _vm.link.phase === "failed" ? _c(__unplugin_components_28, { attrs: { "color": "primary", "loading": _vm.busy, "data-tid": "link-retry" }, on: { "click": function($event) {
      return _vm.chooseRemote("cloud");
    } } }, [_vm._v(" Try again ")]) : _vm._e()];
  }, proxy: true }]) }, [_vm.link && _vm.link.phase === "code" ? [_c("p", { staticClass: "muon-setup-steps__code", attrs: { "data-tid": "link-code", "aria-label": `Code ${_vm.link.code.split("").join(" ")}` } }, [_vm._v(" " + _vm._s(_vm.link.code) + " ")]), _c("a", { staticClass: "muon-setup-steps__link", attrs: { "href": _vm.link.url, "target": "_blank", "rel": "noopener", "data-tid": "link-open" } }, [_vm._v("Open the link page")])] : _vm.link && _vm.link.phase === "failed" ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "link-failed" } }, [_vm._v(" Linking didn't finish. Try again, or skip and link " + _vm._s(_vm.name) + " later from Control. ")]) : _c(__unplugin_components_29, { attrs: { "indeterminate": "", "size": "20", "width": "2" } }), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "write-error" } }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e()], 2) : _vm.screen === "S7" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": "First calibration", "sub": `These happen at ${_vm.name}. Follow its screen; this page moves on by itself.` }, scopedSlots: _vm._u([_vm.previous ? { key: "footer", fn: function() {
    return [_c(__unplugin_components_30, { staticClass: "setup-step__back", attrs: { "text": "", "disabled": _vm.busy, "data-tid": "setup-back" }, on: { "click": _vm.goBack } }, [_vm._v(" Back ")])];
  }, proxy: true } : null], null, true) }, [_c("ul", { staticClass: "muon-setup-steps__checklist muon-setup-steps__ready" }, _vm._l(_vm.readyItems, function(item) {
    return _c("li", { key: item.id, class: `is-${item.status}`, attrs: { "data-tid": `ready-${item.id}` } }, [item.running ? _c(__unplugin_components_31, { attrs: { "indeterminate": "", "size": "12", "width": "2" } }) : item.status === "done" ? _c(__unplugin_components_32, { attrs: { "x-small": "" } }, [_vm._v(" $check ")]) : _vm._e(), _c("span", { staticClass: "muon-setup-steps__ready-title" }, [_vm._v(_vm._s(item.title))]), _c("span", { staticClass: "muon-setup-steps__network-meta" }, [_vm._v(_vm._s(item.note))]), item.skippable ? _c(__unplugin_components_33, { attrs: { "x-small": "", "text": "", "disabled": _vm.busy, "data-tid": `ready-skip-${item.id}` }, on: { "click": function($event) {
      return _vm.skipReadyItem(item.id);
    } } }, [_vm._v(" Skip ")]) : _vm._e()], 1);
  }), 0), _vm.writeError ? _c("p", { staticClass: "muon-setup-steps__error", attrs: { "data-tid": "write-error" } }, [_vm._v(" " + _vm._s(_vm.writeError) + " ")]) : _vm._e()]) : _vm.screen === "S8" || _vm.screen === "S10" ? _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": `${_vm.name} is set up`, "sub": "It's ready for its first print." } }, [_vm._t("done")], 2) : _c("setup-step-card", { attrs: { "eyebrow": _vm.eyebrow, "flat": _vm.overBluetooth, "title": `Carry on at ${_vm.name}'s screen`, "sub": _vm.network.addresses.length ? `${_vm.name} is on ${_vm.network.ssid || "the network"}.` : "" } }, [_c("p", { staticClass: "muon-setup-steps__muted" }, [_vm._v(" Someone is setting " + _vm._s(_vm.name) + " up at the printer. This page follows along. ")]), _vm._t("elsewhere")], 2)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-setup/SetupWifiSteps.vue?vue&type=style&index=0&scoped=bab039c0&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "bab039c0",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-setup/SetupWifiSteps.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3c0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFJQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNBO0FBRUE7QUFXQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0EsaURBQ0EsMkNBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSw0QkFDQSxnQkFDQTtBQUFBO0FBQUEsTUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0EsMEJBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQSxHQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0EsMERBQ0EsZ0RBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWxaQTtBQUFBLEVBREE7QUFBQSxHQURBLGVBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLGVBS0E7QUErTEE7QUFBQSxFQURBO0FBQUEsR0FuTUEsZUFvTUE7QUFRQTtBQUFBLEVBREE7QUFBQSxHQTNNQSxlQTRNQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBaE5BLGVBaU5BO0FBak5BO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlNldHVwV2lmaVN0ZXBzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzXCI+XG4gICAgPCEtLSBTMSBTdGFydCAoMDUgwqczKSAtLT5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWlmPVwic2NyZWVuID09PSAnUzEnXCJcbiAgICAgIDpleWVicm93PVwiZXllYnJvd1wiXG4gICAgICA6ZmxhdD1cIm92ZXJCbHVldG9vdGhcIlxuICAgICAgOnRpdGxlPVwiYFNldCB1cCAke2Rpc3BsYXl9YFwiXG4gICAgICBzdWI9XCJBYm91dCB0aHJlZSBtaW51dGVzLiBLZWVwIHRoaXMgcGFnZSBvcGVuIHVudGlsIGl0IHNheXMgeW91J3JlIGRvbmUuXCJcbiAgICA+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwib3ZlckJsdWV0b290aFwiXG4gICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbGVkZVwiXG4gICAgICA+XG4gICAgICAgIFRoaXMgY29tcHV0ZXIgc3RheXMgb24gaXRzIG93biBuZXR3b3JrIGFuZCB0YWxrcyB0byB7eyBuYW1lIH19IG92ZXJcbiAgICAgICAgQmx1ZXRvb3RoIHVudGlsIHt7IG5hbWUgfX0gaXMgb24gV2ktRmkgdG9vLlxuICAgICAgPC9wPlxuICAgICAgPG9sIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fcGxhblwiPlxuICAgICAgICA8bGk+V2ktRmk8L2xpPlxuICAgICAgICA8bGk+TmFtZSBhbmQgdXBkYXRlczwvbGk+XG4gICAgICAgIDxsaT5Zb3VyIGFjY291bnQsIGlmIHlvdSB3YW50IHJlbW90ZSBhY2Nlc3M8L2xpPlxuICAgICAgICA8bGk+TGFzdCBzdGVwcyBhdCB0aGUgcHJpbnRlcjwvbGk+XG4gICAgICA8L29sPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIndyaXRlRXJyb3JcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgd3JpdGVFcnJvciB9fVxuICAgICAgPC9wPlxuICAgICAgPHRlbXBsYXRlICNmb290ZXI+XG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgICA6bG9hZGluZz1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dXAtc3RhcnRcIlxuICAgICAgICAgIEBjbGljaz1cInN0YXJ0XCJcbiAgICAgICAgPlxuICAgICAgICAgIFN0YXJ0XG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8IS0tIFMzIFdpLUZpOiB0aGUgY2hvc2VuIG5ldHdvcmsgb3BlbnMgaXRzIHBhc3N3b3JkIGZpZWxkIGluIHBsYWNlIC0tPlxuICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgIHYtZWxzZS1pZj1cInNjcmVlbiA9PT0gJ1MzJ1wiXG4gICAgICA6ZXllYnJvdz1cImV5ZWJyb3dcIlxuICAgICAgOmZsYXQ9XCJvdmVyQmx1ZXRvb3RoXCJcbiAgICAgIHRpdGxlPVwiQ2hvb3NlIFdpLUZpXCJcbiAgICAgIDpzdWI9XCJgJHtuYW1lfSB1c2VzIGl0IHRvIHRha2UgcHJpbnRzIGFuZCBmZXRjaCB1cGRhdGVzLmBcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19oZWFkXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbXV0ZWRcIj5cbiAgICAgICAgICB7eyBzY2FubmluZyA/ICdMb29raW5nIGZvciBuZXR3b3Jrc+KApicgOiBgJHtuZXR3b3Jrcy5sZW5ndGh9IG5ldHdvcmtzIG5lYXJieWAgfX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICBzbWFsbFxuICAgICAgICAgIHRleHRcbiAgICAgICAgICA6bG9hZGluZz1cInNjYW5uaW5nXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIndpZmktc2NhblwiXG4gICAgICAgICAgQGNsaWNrPVwic2Nhbih0cnVlKVwiXG4gICAgICAgID5cbiAgICAgICAgICBTY2FuIGFnYWluXG4gICAgICAgIDwvdi1idG4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwiY2FibGVcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX25ldHdvcmsgaXMtY2FyZFwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbmV0d29yay1uYW1lXCI+Q29ubmVjdGVkIGJ5IGNhYmxlIMK3IHt7IGNhYmxlIH19PC9zcGFuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICBzbWFsbFxuICAgICAgICAgIHRleHRcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cIndpZmktY2FibGVcIlxuICAgICAgICAgIEBjbGljaz1cInVzZUNhYmxlXCJcbiAgICAgICAgPlxuICAgICAgICAgIFVzZSB0aGlzIGNvbm5lY3Rpb25cbiAgICAgICAgPC92LWJ0bj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8cFxuICAgICAgICB2LWlmPVwic2NhbkVycm9yXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19lcnJvclwiXG4gICAgICAgIGRhdGEtdGlkPVwid2lmaS1zY2FuLWVycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgc2NhbkVycm9yIH19XG4gICAgICA8L3A+XG4gICAgICA8cFxuICAgICAgICB2LWVsc2UtaWY9XCIhc2Nhbm5pbmcgJiYgIW5ldHdvcmtzLmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbXV0ZWRcIlxuICAgICAgICBkYXRhLXRpZD1cIndpZmktbm9uZVwiXG4gICAgICA+XG4gICAgICAgIHt7IG5hbWUgfX0gY2FuJ3Qgc2VlIGFueSBXaS1GaSBuZXR3b3Jrcy4gU2NhbiBhZ2Fpbiwgb3IgbW92ZSBpdCBjbG9zZXIgdG8gdGhlIHJvdXRlci5cbiAgICAgIDwvcD5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWZvcj1cIm4gaW4gbmV0d29ya3NcIlxuICAgICAgICA6a2V5PVwibi5zc2lkXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19uZXR3b3JrXCJcbiAgICAgICAgOmNsYXNzPVwieyAnaXMtb3Blbic6IHNlbGVjdGVkID09PSBuLnNzaWQsICdpcy1kaXNhYmxlZCc6ICEhdW51c2FibGUobikgfVwiXG4gICAgICA+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX25ldHdvcmstcm93XCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhIXVudXNhYmxlKG4pIHx8IGJ1c3lcIlxuICAgICAgICAgIDphcmlhLXByZXNzZWQ9XCJzZWxlY3RlZCA9PT0gbi5zc2lkID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYHdpZmktJHtuLnNzaWR9YFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2hvb3NlKG4pXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbmV0d29yay1uYW1lXCI+e3sgbi5zc2lkIH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbmV0d29yay1tZXRhXCI+XG4gICAgICAgICAgICB7eyB1bnVzYWJsZShuKSB8fCBuZXR3b3JrTWV0YShuKSB9fVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxmb3JtXG4gICAgICAgICAgdi1pZj1cInNlbGVjdGVkID09PSBuLnNzaWRcIlxuICAgICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fam9pblwiXG4gICAgICAgICAgQHN1Ym1pdC5wcmV2ZW50PVwiam9pbihuKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgICB2LWlmPVwibmVlZHNQYXNzd29yZChuKVwiXG4gICAgICAgICAgICB2LW1vZGVsPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgOnR5cGU9XCJzaG93UGFzc3dvcmQgPyAndGV4dCcgOiAncGFzc3dvcmQnXCJcbiAgICAgICAgICAgIDpsYWJlbD1cImBQYXNzd29yZCBmb3IgJHtuLnNzaWR9YFwiXG4gICAgICAgICAgICBhdXRvY29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgYXV0b2NhcGl0YWxpemU9XCJvZmZcIlxuICAgICAgICAgICAgc3BlbGxjaGVjaz1cImZhbHNlXCJcbiAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgaGlkZS1kZXRhaWxzPVwiYXV0b1wiXG4gICAgICAgICAgICA6ZXJyb3ItbWVzc2FnZXM9XCJwYXNzd29yZEVycm9yXCJcbiAgICAgICAgICAgIDphcHBlbmQtaWNvbj1cInNob3dQYXNzd29yZCA/ICckZXllT2ZmJyA6ICckZXllJ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIndpZmktcGFzc3dvcmRcIlxuICAgICAgICAgICAgQGNsaWNrOmFwcGVuZD1cInNob3dQYXNzd29yZCA9ICFzaG93UGFzc3dvcmRcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgIDpsb2FkaW5nPVwiYnVzeVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJuZWVkc1Bhc3N3b3JkKG4pICYmICFwYXNzd29yZFwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIndpZmktY29ubmVjdFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQ29ubmVjdCBhbmQgY29udGludWVcbiAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8cFxuICAgICAgICB2LWlmPVwid3JpdGVFcnJvclwiXG4gICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fZXJyb3JcIlxuICAgICAgICBkYXRhLXRpZD1cIndyaXRlLWVycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgd3JpdGVFcnJvciB9fVxuICAgICAgPC9wPlxuXG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJjb25maXJtU2tpcFwiXG4gICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fY29uZmlybVwiXG4gICAgICAgIGRhdGEtdGlkPVwid2lmaS1za2lwLWNvbmZpcm1cIlxuICAgICAgPlxuICAgICAgICA8cD57eyBuYW1lIH19IHdpbGwgc3RheSBvZmZsaW5lLiBZb3UgY2FuIGNvbm5lY3QgaXQgbGF0ZXIgZnJvbSBpdHMgc2NyZWVuLjwvcD5cbiAgICAgICAgPHYtYnRuXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgQGNsaWNrPVwiY29uZmlybVNraXAgPSBmYWxzZVwiXG4gICAgICAgID5cbiAgICAgICAgICBLZWVwIFdpLUZpXG4gICAgICAgIDwvdi1idG4+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgdGV4dFxuICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgOmxvYWRpbmc9XCJidXN5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cIndpZmktc2tpcC15ZXNcIlxuICAgICAgICAgIEBjbGljaz1cInNraXBOZXR3b3JrXCJcbiAgICAgICAgPlxuICAgICAgICAgIFNraXAgV2ktRmlcbiAgICAgICAgPC92LWJ0bj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgPHYtYnRuXG4gICAgICAgICAgdi1pZj1cIiFjb25maXJtU2tpcFwiXG4gICAgICAgICAgdGV4dFxuICAgICAgICAgIGRhdGEtdGlkPVwid2lmaS1za2lwXCJcbiAgICAgICAgICBAY2xpY2s9XCJjb25maXJtU2tpcCA9IHRydWVcIlxuICAgICAgICA+XG4gICAgICAgICAgU2tpcCBmb3Igbm93XG4gICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwhLS0gT25jZSBhIHJvdyBpcyBvcGVuIGl0cyBvd24gQ29ubmVjdCB0YWtlcyBvdmVyOiBvbmUgdGFiIHN0b3AsIG5vdCB0d28uIC0tPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIHYtaWY9XCIhc2VsZWN0ZWROZXR3b3JrXCJcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIGRpc2FibGVkXG4gICAgICAgICAgZGF0YS10aWQ9XCJ3aWZpLWNvbm5lY3RcIlxuICAgICAgICA+XG4gICAgICAgICAgQ29ubmVjdCBhbmQgY29udGludWVcbiAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L3NldHVwLXN0ZXAtY2FyZD5cblxuICAgIDwhLS0gUzQgSm9pbmluZyAtLT5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2UtaWY9XCJzY3JlZW4gPT09ICdTNCdcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICA6dGl0bGU9XCJgSm9pbmluZyAke2pvaW5pbmdTc2lkfWBcIlxuICAgICAgc3ViPVwiVGhpcyB0YWtlcyB1cCB0byBhIG1pbnV0ZS5cIlxuICAgID5cbiAgICAgIDx1bCBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2NoZWNrbGlzdFwiPlxuICAgICAgICA8bGlcbiAgICAgICAgICB2LWZvcj1cIml0ZW0gaW4gY2hlY2tsaXN0XCJcbiAgICAgICAgICA6a2V5PVwiaXRlbS5sYWJlbFwiXG4gICAgICAgICAgOmNsYXNzPVwiYGlzLSR7aXRlbS5zdGF0dXN9YFwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgICAgdi1pZj1cIml0ZW0uc3RhdHVzID09PSAnbm93J1wiXG4gICAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgICBzaXplPVwiMTJcIlxuICAgICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDx2LWljb25cbiAgICAgICAgICAgIHYtZWxzZS1pZj1cIml0ZW0uc3RhdHVzID09PSAnZG9uZSdcIlxuICAgICAgICAgICAgeC1zbWFsbFxuICAgICAgICAgID5cbiAgICAgICAgICAgICRjaGVja1xuICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgIDxzcGFuPnt7IGl0ZW0ubGFiZWwgfX08L3NwYW4+XG4gICAgICAgIDwvbGk+XG4gICAgICA8L3VsPlxuICAgICAgPHRlbXBsYXRlXG4gICAgICAgIHYtaWY9XCJzdGF0ZSAmJiBzdGF0ZS5vcCAmJiBzdGF0ZS5vcC5raW5kID09PSAnam9pbidcIlxuICAgICAgICAjZm9vdGVyXG4gICAgICA+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHRleHRcbiAgICAgICAgICA6bG9hZGluZz1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9pbi1jYW5jZWxcIlxuICAgICAgICAgIEBjbGljaz1cImNhbmNlbEpvaW5cIlxuICAgICAgICA+XG4gICAgICAgICAgQ2FuY2VsXG4gICAgICAgIDwvdi1idG4+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvc2V0dXAtc3RlcC1jYXJkPlxuXG4gICAgPCEtLSBTNHIgUmVzdWx0OiB0aGUgam9pbiBmYWlsZWQgLS0+XG4gICAgPHNldHVwLXN0ZXAtY2FyZFxuICAgICAgdi1lbHNlLWlmPVwic2NyZWVuID09PSAnUzRyJyAmJiBzdGF0ZSAmJiBqb2luRXJyb3JcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICB0aXRsZT1cIldpLUZpIGRpZG4ndCBjb25uZWN0XCJcbiAgICA+XG4gICAgICA8cFxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgICAgZGF0YS10aWQ9XCJqb2luLWVycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgam9pbkVycm9yIH19XG4gICAgICA8L3A+XG4gICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgPHYtYnRuXG4gICAgICAgICAgdGV4dFxuICAgICAgICAgIGRhdGEtdGlkPVwiam9pbi1hbm90aGVyXCJcbiAgICAgICAgICBAY2xpY2s9XCJjaG9vc2VBbm90aGVyXCJcbiAgICAgICAgPlxuICAgICAgICAgIENob29zZSBhbm90aGVyIG5ldHdvcmtcbiAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9pbi1yZXRyeVwiXG4gICAgICAgICAgQGNsaWNrPVwidHJ5QWdhaW5cIlxuICAgICAgICA+XG4gICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8IS0tIFM0ciBSZXN1bHQ6IGpvaW5lZCwgYW5kIHRoZSByZWdpb24gbGluZSAowqczLjEpIC0tPlxuICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgIHYtZWxzZS1pZj1cInNjcmVlbiA9PT0gJ1M0cicgJiYgc3RhdGVcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICB0aXRsZT1cIldpLUZpIGNvbm5lY3RlZFwiXG4gICAgPlxuICAgICAgPHBcbiAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19kb25lXCJcbiAgICAgICAgZGF0YS10aWQ9XCJqb2luLWRvbmVcIlxuICAgICAgPlxuICAgICAgICB7eyBuYW1lIH19IGlzIG9uIHt7IG5ldHdvcmsuc3NpZCB8fCAndGhlIG5ldHdvcmsnIH19XG4gICAgICA8L3A+XG4gICAgICA8cCBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX211dGVkXCI+XG4gICAgICAgIHt7IG5ldHdvcmsuYWRkcmVzc2VzLmpvaW4oJywgJykgfX08dGVtcGxhdGUgdi1pZj1cIm5ldHdvcmsuaG9zdG5hbWVfbG9jYWxcIj5cbiAgICAgICAgICDCtyB7eyBuZXR3b3JrLmhvc3RuYW1lX2xvY2FsIH19XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L3A+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwibmV0d29yay5pbnRlcm5ldCA9PT0gZmFsc2VcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX211dGVkXCJcbiAgICAgID5cbiAgICAgICAgTm8gaW50ZXJuZXQuIFByaW50aW5nIG92ZXIgdGhlIG5ldHdvcmsgd29ya3M7IHVwZGF0ZXMgYW5kIHJlbW90ZSBhY2Nlc3MgYXJlIG9mZi5cbiAgICAgIDwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJuZXR3b3JrLmludGVybmV0ID09PSAncG9ydGFsJ1wiXG4gICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fZXJyb3JcIlxuICAgICAgPlxuICAgICAgICB7eyBuZXR3b3JrLnNzaWQgfX0gbmVlZHMgYSBzaWduLWluIHBhZ2UsIHdoaWNoIGEgcHJpbnRlciBjYW4ndCBjb21wbGV0ZS4gUHJpbnRpbmcgb3ZlciB0aGlzXG4gICAgICAgIG5ldHdvcmsgd29ya3MsIGJ1dCB1cGRhdGVzIGFuZCByZW1vdGUgYWNjZXNzIHdvbid0LlxuICAgICAgPC9wPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCIhbmV0d29yay5yZWdpb25fY29uZmlybWVkXCI+XG4gICAgICAgIDxwIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fcmVnaW9uXCI+XG4gICAgICAgICAgUmVnaW9uOiA8c3Ryb25nPnt7IGNvdW50cnlOYW1lKHJlZ2lvbkNvdW50cnkpIH19PC9zdHJvbmc+XG4gICAgICAgIDwvcD5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwibmV0d29yay5yZWdpb25fZXJyb3JcIlxuICAgICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fZXJyb3JcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgcmVnaW9uRXJyb3IgfX1cbiAgICAgICAgPC9wPlxuICAgICAgICA8cCBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX211dGVkXCI+XG4gICAgICAgICAgVG8gY2hvb3NlIGFub3RoZXIgcmVnaW9uLCB1c2Uge3sgbmFtZSB9fSdzIHNjcmVlbi5cbiAgICAgICAgPC9wPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDx0ZW1wbGF0ZSAjZm9vdGVyPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIHYtaWY9XCIhbmV0d29yay5yZWdpb25fY29uZmlybWVkXCJcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIDpsb2FkaW5nPVwiYnVzeSB8fCAhIShzdGF0ZS5vcCAmJiBzdGF0ZS5vcC5raW5kID09PSAncmVnaW9uX2FwcGx5JylcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFyZWdpb25Db3VudHJ5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInJlZ2lvbi1jb25maXJtXCJcbiAgICAgICAgICBAY2xpY2s9XCJjb25maXJtUmVnaW9uXCJcbiAgICAgICAgPlxuICAgICAgICAgIENvbmZpcm1cbiAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2luLWNvbnRpbnVlXCJcbiAgICAgICAgICBAY2xpY2s9XCJhY2tub3dsZWRnZVwiXG4gICAgICAgID5cbiAgICAgICAgICBDb250aW51ZVxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvc2V0dXAtc3RlcC1jYXJkPlxuXG4gICAgPCEtLSBTNSBOYW1lIC0tPlxuICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgIHYtZWxzZS1pZj1cInNjcmVlbiA9PT0gJ1M1JyAmJiBjdXJzb3IgPT09ICduYW1lJ1wiXG4gICAgICA6ZXllYnJvdz1cImV5ZWJyb3dcIlxuICAgICAgOmZsYXQ9XCJvdmVyQmx1ZXRvb3RoXCJcbiAgICAgIHRpdGxlPVwiTmFtZSB5b3VyIHByaW50ZXJcIlxuICAgICAgc3ViPVwiSXQgc2hvd3MgdXAgd2l0aCB0aGlzIG5hbWUgaW4gQ29udHJvbCBhbmQgb24geW91ciBuZXR3b3JrLlwiXG4gICAgPlxuICAgICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PVwic2F2ZU5hbWVcIj5cbiAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgIHYtbW9kZWw9XCJuYW1lRHJhZnRcIlxuICAgICAgICAgIGxhYmVsPVwiUHJpbnRlciBuYW1lXCJcbiAgICAgICAgICBhdXRvY29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgZGVuc2VcbiAgICAgICAgICBoaWRlLWRldGFpbHM9XCJhdXRvXCJcbiAgICAgICAgICA6cGxhY2Vob2xkZXI9XCJzdGF0ZSA/IHN0YXRlLnN0ZXBzLm5hbWUuZGVyaXZlZCA6ICcnXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm5hbWUtZmllbGRcIlxuICAgICAgICAvPlxuICAgICAgPC9mb3JtPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIndyaXRlRXJyb3JcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ3cml0ZS1lcnJvclwiXG4gICAgICA+XG4gICAgICAgIHt7IHdyaXRlRXJyb3IgfX1cbiAgICAgIDwvcD5cbiAgICAgIDx0ZW1wbGF0ZSAjZm9vdGVyPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB2LWlmPVwicHJldmlvdXNcIlxuICAgICAgICAgIHRleHRcbiAgICAgICAgICBjbGFzcz1cInNldHVwLXN0ZXBfX2JhY2tcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dXAtYmFja1wiXG4gICAgICAgICAgQGNsaWNrPVwiZ29CYWNrXCJcbiAgICAgICAgPlxuICAgICAgICAgIEJhY2tcbiAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIDpsb2FkaW5nPVwiYnVzeVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIW5hbWVEcmFmdC50cmltKClcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibmFtZS1zYXZlXCJcbiAgICAgICAgICBAY2xpY2s9XCJzYXZlTmFtZVwiXG4gICAgICAgID5cbiAgICAgICAgICBDb250aW51ZVxuICAgICAgICA8L2FwcC1idG4+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvc2V0dXAtc3RlcC1jYXJkPlxuXG4gICAgPCEtLSBTNSBVcGRhdGVzIC0tPlxuICAgIDxzZXR1cC1zdGVwLWNhcmRcbiAgICAgIHYtZWxzZS1pZj1cInNjcmVlbiA9PT0gJ1M1JyAmJiBjdXJzb3IgPT09ICd1cGRhdGUnICYmIHN0YXRlXCJcbiAgICAgIDpleWVicm93PVwiZXllYnJvd1wiXG4gICAgICA6ZmxhdD1cIm92ZXJCbHVldG9vdGhcIlxuICAgICAgOnRpdGxlPVwidXBkYXRlLmF2YWlsYWJsZSA/ICdVcGRhdGUgYXZhaWxhYmxlJyA6IGAke25hbWV9IGlzIHVwIHRvIGRhdGVgXCJcbiAgICAgIDpzdWI9XCJ1cGRhdGUuYXZhaWxhYmxlXG4gICAgICAgID8gYCR7bmFtZX0gcnVucyAke3VwZGF0ZS5jdXJyZW50fS4gJHt1cGRhdGUuYXZhaWxhYmxlfSBpcyByZWFkeSB0byBpbnN0YWxsOyBpdCB0YWtlcyBhIGZldyBtaW51dGVzLmBcbiAgICAgICAgOiBgJHtuYW1lfSBydW5zICR7dXBkYXRlLmN1cnJlbnR9LmBcIlxuICAgID5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJvdmVyQmx1ZXRvb3RoICYmIHVwZGF0ZS5hdmFpbGFibGVcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX211dGVkXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ1cGRhdGUtYmxlLXdhcm5pbmdcIlxuICAgICAgPlxuICAgICAgICB7eyBuYW1lIH19IHJlc3RhcnRzIHRvIGluc3RhbGwgdGhpcywgYW5kIHRoZSBCbHVldG9vdGggbGluayB3aWxsIGRyb3AuIFNldHVwIGNhcnJpZXMgb24gYXQgdGhlXG4gICAgICAgIHByaW50ZXIsIG9yIHJlY29ubmVjdCBvbmNlIGl0IGhhcyByZXN0YXJ0ZWQuXG4gICAgICA8L3A+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwidXBkYXRlLmVycm9yXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19lcnJvclwiXG4gICAgICAgIGRhdGEtdGlkPVwidXBkYXRlLWVycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgbmFtZSB9fSBjb3VsZG4ndCBpbnN0YWxsIHRoZSB1cGRhdGUuIFlvdSBjYW4gdHJ5IGFnYWluLCBvciB1cGRhdGUgbGF0ZXIgZnJvbSBTZXR0aW5ncy5cbiAgICAgIDwvcD5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJ3cml0ZUVycm9yXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19lcnJvclwiXG4gICAgICAgIGRhdGEtdGlkPVwid3JpdGUtZXJyb3JcIlxuICAgICAgPlxuICAgICAgICB7eyB3cml0ZUVycm9yIH19XG4gICAgICA8L3A+XG4gICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgPHYtYnRuXG4gICAgICAgICAgdi1pZj1cInByZXZpb3VzXCJcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgY2xhc3M9XCJzZXR1cC1zdGVwX19iYWNrXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNldHVwLWJhY2tcIlxuICAgICAgICAgIEBjbGljaz1cImdvQmFja1wiXG4gICAgICAgID5cbiAgICAgICAgICBCYWNrXG4gICAgICAgIDwvdi1idG4+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHYtaWY9XCJ1cGRhdGUuYXZhaWxhYmxlXCJcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1cGRhdGUtbGF0ZXJcIlxuICAgICAgICAgIEBjbGljaz1cInVwZGF0ZUxhdGVyXCJcbiAgICAgICAgPlxuICAgICAgICAgIExhdGVyXG4gICAgICAgIDwvdi1idG4+XG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgICA6bG9hZGluZz1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidXBkYXRlLWdvXCJcbiAgICAgICAgICBAY2xpY2s9XCJ1cGRhdGUuYXZhaWxhYmxlID8gaW5zdGFsbFVwZGF0ZSgpIDogdXBkYXRlTGF0ZXIoKVwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyB1cGRhdGUuYXZhaWxhYmxlID8gJ0luc3RhbGwgdXBkYXRlJyA6ICdDb250aW51ZScgfX1cbiAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L3NldHVwLXN0ZXAtY2FyZD5cblxuICAgIDwhLS0gUzUgWW91ciBhY2NvdW50IChyZW1vdGUgYWNjZXNzKSAtLT5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2UtaWY9XCJzY3JlZW4gPT09ICdTNScgJiYgc3RhdGVcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICB0aXRsZT1cIllvdXIgYWNjb3VudFwiXG4gICAgICA6c3ViPVwiYExpbmsgJHtuYW1lfSB0byB5b3VyIE11b24zRCBhY2NvdW50IHRvIHdhdGNoIGFuZCBwcmludCBmcm9tIGFueXdoZXJlLmBcIlxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19jaG9pY2VzXCJcbiAgICAgICAgcm9sZT1cInJhZGlvZ3JvdXBcIlxuICAgICAgICBhcmlhLWxhYmVsPVwiUmVtb3RlIGFjY2Vzc1wiXG4gICAgICA+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cIm9wdGlvbiBpbiByZW1vdGVPcHRpb25zXCJcbiAgICAgICAgICA6a2V5PVwib3B0aW9uLm1vZGVcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIHJvbGU9XCJyYWRpb1wiXG4gICAgICAgICAgY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19uZXR3b3JrIG11b24tc2V0dXAtc3RlcHNfX25ldHdvcmstcm93XCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdpcy1vcGVuJzogcmVtb3RlQ2hvaWNlID09PSBvcHRpb24ubW9kZSwgJ2lzLWRpc2FibGVkJzogISFvcHRpb24uZGlzYWJsZWQgfVwiXG4gICAgICAgICAgOmFyaWEtY2hlY2tlZD1cInJlbW90ZUNob2ljZSA9PT0gb3B0aW9uLm1vZGUgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhIW9wdGlvbi5kaXNhYmxlZCB8fCBidXN5XCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgcmVtb3RlLSR7b3B0aW9uLm1vZGV9YFwiXG4gICAgICAgICAgQGNsaWNrPVwicmVtb3RlQ2hvaWNlID0gb3B0aW9uLm1vZGVcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19uZXR3b3JrLW5hbWVcIj57eyBvcHRpb24udGl0bGUgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtdW9uLXNldHVwLXN0ZXBzX19uZXR3b3JrLW1ldGFcIj57eyBvcHRpb24uZGlzYWJsZWQgfHwgb3B0aW9uLmRldGFpbCB9fTwvc3Bhbj5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJyZW1vdGUuZXJyb3JcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgICAgZGF0YS10aWQ9XCJyZW1vdGUtZXJyb3JcIlxuICAgICAgPlxuICAgICAgICB7eyByZW1vdGVFcnJvciB9fVxuICAgICAgPC9wPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIndyaXRlRXJyb3JcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ3cml0ZS1lcnJvclwiXG4gICAgICA+XG4gICAgICAgIHt7IHdyaXRlRXJyb3IgfX1cbiAgICAgIDwvcD5cbiAgICAgIDx0ZW1wbGF0ZSAjZm9vdGVyPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB2LWlmPVwicHJldmlvdXNcIlxuICAgICAgICAgIHRleHRcbiAgICAgICAgICBjbGFzcz1cInNldHVwLXN0ZXBfX2JhY2tcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dXAtYmFja1wiXG4gICAgICAgICAgQGNsaWNrPVwiZ29CYWNrXCJcbiAgICAgICAgPlxuICAgICAgICAgIEJhY2tcbiAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPHYtYnRuXG4gICAgICAgICAgdGV4dFxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicmVtb3RlLXNraXBcIlxuICAgICAgICAgIEBjbGljaz1cImNob29zZVJlbW90ZSgnbGF0ZXInKVwiXG4gICAgICAgID5cbiAgICAgICAgICBTa2lwIGZvciBub3dcbiAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIDpsb2FkaW5nPVwiYnVzeVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIXJlbW90ZUNob2ljZSB8fCByZW1vdGVCbG9ja2VkXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInJlbW90ZS1jb250aW51ZVwiXG4gICAgICAgICAgQGNsaWNrPVwicmVtb3RlQ2hvaWNlICYmIGNob29zZVJlbW90ZShyZW1vdGVDaG9pY2UpXCJcbiAgICAgICAgPlxuICAgICAgICAgIENvbnRpbnVlXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8IS0tIFM1dSBJbnN0YWxsaW5nIHRoZSB1cGRhdGUgLS0+XG4gICAgPHNldHVwLXN0ZXAtY2FyZFxuICAgICAgdi1lbHNlLWlmPVwic2NyZWVuID09PSAnUzV1J1wiXG4gICAgICA6ZXllYnJvdz1cImV5ZWJyb3dcIlxuICAgICAgOmZsYXQ9XCJvdmVyQmx1ZXRvb3RoXCJcbiAgICAgIDp0aXRsZT1cImBVcGRhdGluZyAke25hbWV9YFwiXG4gICAgICBzdWI9XCJLZWVwIGl0IHN3aXRjaGVkIG9uLiBJdCByZXN0YXJ0cyB3aGVuIGl0J3MgZG9uZSwgYW5kIHRoaXMgcGFnZSBjYXJyaWVzIG9uLlwiXG4gICAgPlxuICAgICAgPHYtcHJvZ3Jlc3MtbGluZWFyXG4gICAgICAgIDppbmRldGVybWluYXRlPVwidXBkYXRlUHJvZ3Jlc3MgPT09IG51bGxcIlxuICAgICAgICA6dmFsdWU9XCJ1cGRhdGVQcm9ncmVzcyA9PT0gbnVsbCA/IDAgOiB1cGRhdGVQcm9ncmVzc1wiXG4gICAgICAgIHJvdW5kZWRcbiAgICAgICAgZGF0YS10aWQ9XCJ1cGRhdGUtcHJvZ3Jlc3NcIlxuICAgICAgLz5cbiAgICA8L3NldHVwLXN0ZXAtY2FyZD5cblxuICAgIDwhLS0gUzYgTGlua2luZyB3aXRoIGEgY29kZSAtLT5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2UtaWY9XCJzY3JlZW4gPT09ICdTNidcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICA6dGl0bGU9XCJgTGluayAke25hbWV9IHRvIHlvdXIgYWNjb3VudGBcIlxuICAgICAgOnN1Yj1cImxpbmtTdWJcIlxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwibGluayAmJiBsaW5rLnBoYXNlID09PSAnY29kZSdcIj5cbiAgICAgICAgPHBcbiAgICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2NvZGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibGluay1jb2RlXCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cImBDb2RlICR7bGluay5jb2RlLnNwbGl0KCcnKS5qb2luKCcgJyl9YFwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBsaW5rLmNvZGUgfX1cbiAgICAgICAgPC9wPlxuICAgICAgICA8YVxuICAgICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbGlua1wiXG4gICAgICAgICAgOmhyZWY9XCJsaW5rLnVybFwiXG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICByZWw9XCJub29wZW5lclwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJsaW5rLW9wZW5cIlxuICAgICAgICA+T3BlbiB0aGUgbGluayBwYWdlPC9hPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDxwXG4gICAgICAgIHYtZWxzZS1pZj1cImxpbmsgJiYgbGluay5waGFzZSA9PT0gJ2ZhaWxlZCdcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgICAgZGF0YS10aWQ9XCJsaW5rLWZhaWxlZFwiXG4gICAgICA+XG4gICAgICAgIExpbmtpbmcgZGlkbid0IGZpbmlzaC4gVHJ5IGFnYWluLCBvciBza2lwIGFuZCBsaW5rIHt7IG5hbWUgfX0gbGF0ZXIgZnJvbSBDb250cm9sLlxuICAgICAgPC9wPlxuICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgdi1lbHNlXG4gICAgICAgIGluZGV0ZXJtaW5hdGVcbiAgICAgICAgc2l6ZT1cIjIwXCJcbiAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgIC8+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwid3JpdGVFcnJvclwiXG4gICAgICAgIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fZXJyb3JcIlxuICAgICAgICBkYXRhLXRpZD1cIndyaXRlLWVycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgd3JpdGVFcnJvciB9fVxuICAgICAgPC9wPlxuICAgICAgPHRlbXBsYXRlICNmb290ZXI+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHRleHRcbiAgICAgICAgICBjbGFzcz1cInNldHVwLXN0ZXBfX2JhY2tcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibGluay1jYW5jZWxcIlxuICAgICAgICAgIEBjbGljaz1cImNhbmNlbExpbmtcIlxuICAgICAgICA+XG4gICAgICAgICAgQmFja1xuICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJyZW1vdGUtc2tpcFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2hvb3NlUmVtb3RlKCdsYXRlcicpXCJcbiAgICAgICAgPlxuICAgICAgICAgIFNraXAgZm9yIG5vd1xuICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIHYtaWY9XCJsaW5rICYmIGxpbmsucGhhc2UgPT09ICdmYWlsZWQnXCJcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIDpsb2FkaW5nPVwiYnVzeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJsaW5rLXJldHJ5XCJcbiAgICAgICAgICBAY2xpY2s9XCJjaG9vc2VSZW1vdGUoJ2Nsb3VkJylcIlxuICAgICAgICA+XG4gICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8IS0tIFM3IEZpcnN0IGNhbGlicmF0aW9uOiBlYWNoIGl0ZW0gaGFwcGVucyBhdCB0aGUgcHJpbnRlciAtLT5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2UtaWY9XCJzY3JlZW4gPT09ICdTNydcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICB0aXRsZT1cIkZpcnN0IGNhbGlicmF0aW9uXCJcbiAgICAgIDpzdWI9XCJgVGhlc2UgaGFwcGVuIGF0ICR7bmFtZX0uIEZvbGxvdyBpdHMgc2NyZWVuOyB0aGlzIHBhZ2UgbW92ZXMgb24gYnkgaXRzZWxmLmBcIlxuICAgID5cbiAgICAgIDx1bCBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2NoZWNrbGlzdCBtdW9uLXNldHVwLXN0ZXBzX19yZWFkeVwiPlxuICAgICAgICA8bGlcbiAgICAgICAgICB2LWZvcj1cIml0ZW0gaW4gcmVhZHlJdGVtc1wiXG4gICAgICAgICAgOmtleT1cIml0ZW0uaWRcIlxuICAgICAgICAgIDpjbGFzcz1cImBpcy0ke2l0ZW0uc3RhdHVzfWBcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImByZWFkeS0ke2l0ZW0uaWR9YFwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgICAgdi1pZj1cIml0ZW0ucnVubmluZ1wiXG4gICAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgICBzaXplPVwiMTJcIlxuICAgICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDx2LWljb25cbiAgICAgICAgICAgIHYtZWxzZS1pZj1cIml0ZW0uc3RhdHVzID09PSAnZG9uZSdcIlxuICAgICAgICAgICAgeC1zbWFsbFxuICAgICAgICAgID5cbiAgICAgICAgICAgICRjaGVja1xuICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fcmVhZHktdGl0bGVcIj57eyBpdGVtLnRpdGxlIH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbmV0d29yay1tZXRhXCI+e3sgaXRlbS5ub3RlIH19PC9zcGFuPlxuICAgICAgICAgIDx2LWJ0blxuICAgICAgICAgICAgdi1pZj1cIml0ZW0uc2tpcHBhYmxlXCJcbiAgICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHJlYWR5LXNraXAtJHtpdGVtLmlkfWBcIlxuICAgICAgICAgICAgQGNsaWNrPVwic2tpcFJlYWR5SXRlbShpdGVtLmlkKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgU2tpcFxuICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwvbGk+XG4gICAgICA8L3VsPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIndyaXRlRXJyb3JcIlxuICAgICAgICBjbGFzcz1cIm11b24tc2V0dXAtc3RlcHNfX2Vycm9yXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ3cml0ZS1lcnJvclwiXG4gICAgICA+XG4gICAgICAgIHt7IHdyaXRlRXJyb3IgfX1cbiAgICAgIDwvcD5cbiAgICAgIDx0ZW1wbGF0ZVxuICAgICAgICB2LWlmPVwicHJldmlvdXNcIlxuICAgICAgICAjZm9vdGVyXG4gICAgICA+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHRleHRcbiAgICAgICAgICBjbGFzcz1cInNldHVwLXN0ZXBfX2JhY2tcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2V0dXAtYmFja1wiXG4gICAgICAgICAgQGNsaWNrPVwiZ29CYWNrXCJcbiAgICAgICAgPlxuICAgICAgICAgIEJhY2tcbiAgICAgICAgPC92LWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG5cbiAgICA8IS0tIFM4LCBTMTA6IGRvbmUgLS0+XG4gICAgPHNldHVwLXN0ZXAtY2FyZFxuICAgICAgdi1lbHNlLWlmPVwic2NyZWVuID09PSAnUzgnIHx8IHNjcmVlbiA9PT0gJ1MxMCdcIlxuICAgICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICAgIDpmbGF0PVwib3ZlckJsdWV0b290aFwiXG4gICAgICA6dGl0bGU9XCJgJHtuYW1lfSBpcyBzZXQgdXBgXCJcbiAgICAgIHN1Yj1cIkl0J3MgcmVhZHkgZm9yIGl0cyBmaXJzdCBwcmludC5cIlxuICAgID5cbiAgICAgIDxzbG90IG5hbWU9XCJkb25lXCIgLz5cbiAgICA8L3NldHVwLXN0ZXAtY2FyZD5cblxuICAgIDwhLS0gUzk6IHRoZSBwcmludGVyJ3Mgc2NyZWVuIGlzIGluIGNoYXJnZS4gVGhlIHBhbmVsIGNhbiBmaW5pc2ggZXZlcnkgc3RlcCBvbiBpdHMgb3duLiAtLT5cbiAgICA8c2V0dXAtc3RlcC1jYXJkXG4gICAgICB2LWVsc2VcbiAgICAgIDpleWVicm93PVwiZXllYnJvd1wiXG4gICAgICA6ZmxhdD1cIm92ZXJCbHVldG9vdGhcIlxuICAgICAgOnRpdGxlPVwiYENhcnJ5IG9uIGF0ICR7bmFtZX0ncyBzY3JlZW5gXCJcbiAgICAgIDpzdWI9XCJuZXR3b3JrLmFkZHJlc3Nlcy5sZW5ndGggPyBgJHtuYW1lfSBpcyBvbiAke25ldHdvcmsuc3NpZCB8fCAndGhlIG5ldHdvcmsnfS5gIDogJydcIlxuICAgID5cbiAgICAgIDxwIGNsYXNzPVwibXVvbi1zZXR1cC1zdGVwc19fbXV0ZWRcIj5cbiAgICAgICAgU29tZW9uZSBpcyBzZXR0aW5nIHt7IG5hbWUgfX0gdXAgYXQgdGhlIHByaW50ZXIuIFRoaXMgcGFnZSBmb2xsb3dzIGFsb25nLlxuICAgICAgPC9wPlxuICAgICAgPHNsb3QgbmFtZT1cImVsc2V3aGVyZVwiIC8+XG4gICAgPC9zZXR1cC1zdGVwLWNhcmQ+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBTZXR1cEh0dHBFcnJvciwgdHlwZSBTZXR1cENsaWVudCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1zZXR1cC9jbGllbnQnXG5pbXBvcnQgeyBwYWdlTGFuZ3VhZ2VGb3IgfSBmcm9tICdAL3NlcnZpY2VzL211b24tc2V0dXAvbGFuZ3VhZ2UnXG5pbXBvcnQgeyBzY3JlZW5Gb3IsIHR5cGUgU2NyZWVuSWQgfSBmcm9tICdAL3NlcnZpY2VzL211b24tc2V0dXAvc2NyZWVuJ1xuaW1wb3J0IHsgZnJhbWVTdGVwcywgcHJldmlvdXNTdGVwIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLXNldHVwL3N0ZXBzJ1xuaW1wb3J0IHsgc2V0TG9jYWwsIHNldHVwU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tc2V0dXAvc3RhdGUnXG5pbXBvcnQgdHlwZSB7IExpbmtTdGF0ZSwgU2V0dXBOZXR3b3JrLCBTZXR1cFJlc3VsdCwgU2V0dXBTdGF0ZSwgU3RlcElkIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLXNldHVwL3R5cGVzJ1xuaW1wb3J0IHsgam9pbkVycm9yQ29weSwgdmFsaWRQc2ssIHdyaXRlRXJyb3JDb3B5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLXNldHVwL3dpZmlDb3B5J1xuaW1wb3J0IFNldHVwU3RlcENhcmQgZnJvbSAnLi9TZXR1cFN0ZXBDYXJkLnZ1ZSdcblxudHlwZSBSZW1vdGVNb2RlID0gJ2xvY2FsJyB8ICdjbG91ZCcgfCAnbGF0ZXInXG5cbmNvbnN0IFJFQURZX1RJVExFUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgdHJhbnNwb3J0X2NsaXBzOiAnVGFrZSBvdXQgdGhlIHRyYW5zcG9ydCBjbGlwcycsXG4gIHNlbGZfdGVzdDogJ1J1biB0aGUgc2VsZi10ZXN0JyxcbiAgbG9hZF9maWxhbWVudDogJ0xvYWQgZmlsYW1lbnQnXG59XG5cbmNvbnN0IEpPSU5fUEhBU0VTID0gWydzYXZpbmcnLCAnYXNzb2NpYXRpbmcnLCAnYXV0aGVudGljYXRpbmcnLCAnZGhjcCcsICdpbnRlcm5ldF9jaGVjaycsICd1cGRhdGVfY2hlY2snXVxuXG4vKipcbiAqIEZpcnN0LXJ1biBzZXR1cCdzIHN0ZXBzICgwNS1waG9uZS1zZXR1cC1wYWdlLm1kIMKnMyksIGVhY2ggaW4gdGhlIHNoYXJlZFxuICogc3RlcCBjYXJkLCBmb3IgYW55IHBhZ2Ugd2l0aCBhIGBTZXR1cENsaWVudGA6IGAvc2V0dXBgIG9uIHRoZSBwcmludGVyJ3NcbiAqIGhvdHNwb3QsIGFuZCBDb250cm9sIHNldHRpbmcgYSBwcmludGVyIHVwIG92ZXIgQmx1ZXRvb3RoLiBXaGljaCBzY3JlZW5cbiAqIHNob3dzIGlzIGBzY3JlZW5Gb3JgJ3MgYW5zd2VyIGFsb25lOyB0aGlzIGNvbXBvbmVudCBrZWVwcyBubyBzdGVwIG9yZGVyLlxuICogU3RlcHMgdGhhdCBuZWVkIHNvbWVvbmUgYXQgdGhlIHByaW50ZXIgKHRoZSBmaXJzdCBjYWxpYnJhdGlvbiwgb3RoZXJcbiAqIG5ldHdvcmssIGVudGVycHJpc2UgV2ktRmkgYW5kIHRoZSByZWdpb24gcGlja2VyKSBzdGF5IG9uIGl0cyBzY3JlZW4uXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFNldHVwU3RlcENhcmQgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0dXBXaWZpU3RlcHMgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgY2xpZW50ITogU2V0dXBDbGllbnRcblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IGZhbHNlIH0pXG4gIHJlYWRvbmx5IG92ZXJCbHVldG9vdGghOiBib29sZWFuXG5cbiAgbmV0d29ya3M6IFNldHVwTmV0d29ya1tdID0gW11cbiAgY2FibGU6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIHNjYW5uaW5nID0gZmFsc2VcbiAgc2NhbkVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBzZWxlY3RlZDogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgcGFzc3dvcmQgPSAnJ1xuICBzaG93UGFzc3dvcmQgPSBmYWxzZVxuICBwYXNzd29yZEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBidXN5ID0gZmFsc2VcbiAgd3JpdGVFcnJvcjogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgY29uZmlybVNraXAgPSBmYWxzZVxuICBsYW5ndWFnZXM6IHN0cmluZ1tdID0gW11cbiAgbmFtZURyYWZ0ID0gJydcbiAgcmVhZHlNYW5pZmVzdDogQXJyYXk8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+ID0gW11cbiAgcmVtb3RlQ2hvaWNlOiBSZW1vdGVNb2RlIHwgbnVsbCA9IG51bGxcblxuICBnZXQgc3RhdGUgKCk6IFNldHVwU3RhdGUgfCBudWxsIHtcbiAgICByZXR1cm4gc2V0dXBTdGF0ZS5zdGF0ZVxuICB9XG5cbiAgZ2V0IHNjcmVlbiAoKTogU2NyZWVuSWQge1xuICAgIHJldHVybiBzY3JlZW5Gb3Ioc2V0dXBTdGF0ZS5zdGF0ZSwgc2V0dXBTdGF0ZS5sb2NhbClcbiAgfVxuXG4gIGdldCBuYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnN0YXRlPy5wcmludGVyLm5hbWUgPz8gJ1RoZSBwcmludGVyJ1xuICB9XG5cbiAgZ2V0IGRpc3BsYXkgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU/LnByaW50ZXIuZGlzcGxheSA/PyB0aGlzLm5hbWVcbiAgfVxuXG4gIGdldCBuZXR3b3JrICgpOiBTZXR1cFN0YXRlWydzdGVwcyddWyduZXR3b3JrJ10ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlPy5zdGVwcy5uZXR3b3JrID8/IHtcbiAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAga2luZDogbnVsbCxcbiAgICAgIHNzaWQ6IG51bGwsXG4gICAgICBhZGRyZXNzZXM6IFtdLFxuICAgICAgaG9zdG5hbWVfbG9jYWw6IG51bGwsXG4gICAgICBpbnRlcm5ldDogbnVsbCxcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgcmVnaW9uX2NvbmZpcm1lZDogZmFsc2UsXG4gICAgICByZWdpb25fZXJyb3I6IG51bGxcbiAgICB9XG4gIH1cblxuICBnZXQgY3Vyc29yICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZT8uY3Vyc29yID8/IG51bGxcbiAgfVxuXG4gIGdldCBleWVicm93ICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHN0ZXBzID0gZnJhbWVTdGVwcyh0aGlzLnN0YXRlLCB0aGlzLnNjcmVlbilcbiAgICBjb25zdCBhdCA9IHN0ZXBzLmZpbmRJbmRleChzdGVwID0+IHN0ZXAuc3RhdHVzID09PSAnb24nKVxuICAgIHJldHVybiBhdCA8IDAgPyAnJyA6IGBTdGVwICR7YXQgKyAxfSBvZiAke3N0ZXBzLmxlbmd0aH1gXG4gIH1cblxuICAvKiogV2hlcmUgQmFjayBnb2VzOiB0aGUgcHJpbnRlcidzIGBnb3RvYCBvbmx5IHRha2VzIGFuIGVhcmxpZXIgZG9uZSBvciBza2lwcGVkIHN0ZXAuICovXG4gIGdldCBwcmV2aW91cyAoKTogU3RlcElkIHwgbnVsbCB7XG4gICAgcmV0dXJuIHByZXZpb3VzU3RlcCh0aGlzLnN0YXRlKVxuICB9XG5cbiAgZ2V0IHNlbGVjdGVkTmV0d29yayAoKTogU2V0dXBOZXR3b3JrIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmV0d29ya3MuZmluZChuID0+IG4uc3NpZCA9PT0gdGhpcy5zZWxlY3RlZCkgPz8gbnVsbFxuICB9XG5cbiAgZ2V0IHVwZGF0ZSAoKTogU2V0dXBTdGF0ZVsnc3RlcHMnXVsndXBkYXRlJ10ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlPy5zdGVwcy51cGRhdGUgPz8geyBzdGF0dXM6ICdwZW5kaW5nJywgY3VycmVudDogJycsIGF2YWlsYWJsZTogbnVsbCwgZXJyb3I6IG51bGwgfVxuICB9XG5cbiAgZ2V0IHVwZGF0ZVByb2dyZXNzICgpOiBudW1iZXIgfCBudWxsIHtcbiAgICBjb25zdCBwcm9ncmVzcyA9IHRoaXMuc3RhdGU/Lm9wPy5raW5kID09PSAndXBkYXRlX2luc3RhbGwnID8gdGhpcy5zdGF0ZS5vcC5wcm9ncmVzcyA6IG51bGxcbiAgICByZXR1cm4gdHlwZW9mIHByb2dyZXNzID09PSAnbnVtYmVyJyA/IHByb2dyZXNzIDogbnVsbFxuICB9XG5cbiAgZ2V0IHJlbW90ZSAoKTogU2V0dXBTdGF0ZVsnc3RlcHMnXVsncmVtb3RlJ10ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlPy5zdGVwcy5yZW1vdGUgPz8geyBzdGF0dXM6ICdwZW5kaW5nJywgbW9kZTogbnVsbCwgbGluazogbnVsbCwgZXJyb3I6IG51bGwgfVxuICB9XG5cbiAgZ2V0IGxpbmsgKCk6IExpbmtTdGF0ZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnJlbW90ZS5saW5rXG4gIH1cblxuICAvKiogTGlua2luZyBuZWVkcyB0aGUgaW50ZXJuZXQgYW5kIGEgc3luY2VkIGNsb2NrICgwMiDCpzUuOSk7IHNheSBzbyByYXRoZXIgdGhhbiBvZmZlciBpdC4gKi9cbiAgZ2V0IGNsb3VkQmxvY2tlZCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLnN0YXRlKSByZXR1cm4gbnVsbFxuICAgIGlmICh0aGlzLnN0YXRlLmNhcGFiaWxpdGllcy5jbG91ZF9saW5rID09PSBmYWxzZSkgcmV0dXJuIGAke3RoaXMubmFtZX0gY2FuJ3QgbGluayB0byBhbiBhY2NvdW50YFxuICAgIGlmICh0aGlzLm5ldHdvcmsuaW50ZXJuZXQgIT09IHRydWUpIHJldHVybiBgTmVlZHMgJHt0aGlzLm5hbWV9IG9uIHRoZSBpbnRlcm5ldGBcbiAgICBpZiAodGhpcy5zdGF0ZS5jbG9jay5zeW5jZWQgIT09IHRydWUpIHJldHVybiBgV2FpdGluZyBmb3IgJHt0aGlzLm5hbWV9J3MgY2xvY2sgdG8gc2V0YFxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvKiogVGhlIHNlbGVjdGVkIG9wdGlvbiBpcyBvbmUgdGhlIHByaW50ZXIgY2FuJ3QgZG8gcmlnaHQgbm93LiAqL1xuICBnZXQgcmVtb3RlQmxvY2tlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3RlQ2hvaWNlID09PSAnY2xvdWQnICYmICEhdGhpcy5jbG91ZEJsb2NrZWRcbiAgfVxuXG4gIGdldCByZW1vdGVPcHRpb25zICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICBtb2RlOiAnY2xvdWQnIGFzIGNvbnN0LFxuICAgICAgICB0aXRsZTogJ0xpbmsgdG8gbXkgTXVvbjNEIGFjY291bnQnLFxuICAgICAgICBkZXRhaWw6ICdTZWUgaXQgYW5kIHByaW50IGZyb20gYW55d2hlcmUnLFxuICAgICAgICBkaXNhYmxlZDogdGhpcy5jbG91ZEJsb2NrZWRcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG1vZGU6ICdsb2NhbCcgYXMgY29uc3QsXG4gICAgICAgIHRpdGxlOiAnT25seSBvbiB0aGlzIG5ldHdvcmsnLFxuICAgICAgICBkZXRhaWw6ICdOb3RoaW5nIGxlYXZlcyB5b3VyIG5ldHdvcmsnLFxuICAgICAgICBkaXNhYmxlZDogbnVsbFxuICAgICAgfVxuICAgIF1cbiAgfVxuXG4gIGdldCByZW1vdGVFcnJvciAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb2RlID0gdGhpcy5yZW1vdGUuZXJyb3I/LmNvZGVcbiAgICBpZiAoY29kZSA9PT0gJ25vX2ludGVybmV0JykgcmV0dXJuIGAke3RoaXMubmFtZX0gbmVlZHMgdGhlIGludGVybmV0IHRvIGxpbmsuYFxuICAgIGlmIChjb2RlID09PSAnY2xvY2tfdW5zeW5jZWQnKSByZXR1cm4gYCR7dGhpcy5uYW1lfSdzIGNsb2NrIGlzbid0IHNldCB5ZXQuIFRyeSBhZ2FpbiBpbiBhIG1vbWVudC5gXG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX0gY291bGRuJ3Qgc3RhcnQgbGlua2luZy4gVHJ5IGFnYWluLCBvciBza2lwIGZvciBub3cuYFxuICB9XG5cbiAgZ2V0IGxpbmtTdWIgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluayA9IHRoaXMubGlua1xuICAgIGlmIChsaW5rPy5waGFzZSA9PT0gJ2NvZGUnKSByZXR1cm4gJ0VudGVyIHRoaXMgY29kZSBvbiB0aGUgbGluayBwYWdlLCBzaWduZWQgaW4gdG8geW91ciBNdW9uM0QgYWNjb3VudC4nXG4gICAgaWYgKGxpbms/LnBoYXNlID09PSAnb2ZmZXInKSByZXR1cm4gYENvbmZpcm0gJHtsaW5rLmFjY291bnR9IG9uICR7dGhpcy5uYW1lfSdzIHNjcmVlbi5gXG4gICAgaWYgKGxpbms/LnBoYXNlID09PSAnbGlua2VkJykgcmV0dXJuIGBMaW5rZWQgdG8gJHtsaW5rLmFjY291bnR9LmBcbiAgICBpZiAobGluaz8ucGhhc2UgPT09ICdmYWlsZWQnKSByZXR1cm4gJydcbiAgICByZXR1cm4gJ0dldHRpbmcgYSBjb2Rl4oCmJ1xuICB9XG5cbiAgZ2V0IHJlYWR5SXRlbXMgKCkge1xuICAgIGNvbnN0IG1hbmlmZXN0ID0gdGhpcy5yZWFkeU1hbmlmZXN0IGFzIEFycmF5PHsgaWQ/OiBzdHJpbmcsIHJlcXVpcmVkPzogYm9vbGVhbiB9PlxuICAgIC8vIFVudGlsIHRoZSBtYW5pZmVzdCBoYXMgbG9hZGVkLCBub3RoaW5nIGNvdW50cyBhcyBvcHRpb25hbC5cbiAgICBjb25zdCByZXF1aXJlZCA9IG5ldyBTZXQobWFuaWZlc3QubGVuZ3RoID8gbWFuaWZlc3QuZmlsdGVyKGkgPT4gaS5yZXF1aXJlZCkubWFwKGkgPT4gaS5pZCkgOiB0aGlzLnN0YXRlPy5zdGVwcy5yZWFkeS5pdGVtcy5tYXAoaSA9PiBpLmlkKSlcbiAgICBjb25zdCBydW5uaW5nID0gdGhpcy5zdGF0ZT8ub3A/LmtpbmQgPT09ICdyZWFkeV9pdGVtJyA/IHRoaXMuc3RhdGUub3AuaXRlbSA6IG51bGxcbiAgICByZXR1cm4gKHRoaXMuc3RhdGU/LnN0ZXBzLnJlYWR5Lml0ZW1zID8/IFtdKVxuICAgICAgLmZpbHRlcihpdGVtID0+IGl0ZW0uc3RhdHVzICE9PSAnaGlkZGVuJylcbiAgICAgIC5tYXAoaXRlbSA9PiAoe1xuICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgc3RhdHVzOiBpdGVtLnN0YXR1cyxcbiAgICAgICAgdGl0bGU6IFJFQURZX1RJVExFU1tpdGVtLmlkXSA/PyBpdGVtLmlkLnJlcGxhY2UoL18vZywgJyAnKSxcbiAgICAgICAgcnVubmluZzogcnVubmluZyA9PT0gaXRlbS5pZCxcbiAgICAgICAgbm90ZTogcnVubmluZyA9PT0gaXRlbS5pZFxuICAgICAgICAgID8gJ1J1bm5pbmcgbm93J1xuICAgICAgICAgIDogaXRlbS5zdGF0dXMgPT09ICdkb25lJyA/ICdEb25lJyA6IGl0ZW0uc3RhdHVzID09PSAnc2tpcHBlZCcgPyAnU2tpcHBlZCcgOiBpdGVtLnN0YXR1cyA9PT0gJ2ZhaWxlZCcgPyAnRmFpbGVkOiB0cnkgYWdhaW4gYXQgdGhlIHByaW50ZXInIDogcmVxdWlyZWQuaGFzKGl0ZW0uaWQpID8gJ05lZWRlZCcgOiAnT3B0aW9uYWwnLFxuICAgICAgICAvLyBSZXF1aXJlZCBpdGVtcyBhbHdheXMgaGFwcGVuOyB0aGUgcGhvbmUgY2FuIG9ubHkgc2tpcCB0aGUgb3B0aW9uYWwgb25lcy5cbiAgICAgICAgc2tpcHBhYmxlOiAhcmVxdWlyZWQuaGFzKGl0ZW0uaWQpICYmIGl0ZW0uc3RhdHVzID09PSAncGVuZGluZycgJiYgcnVubmluZyAhPT0gaXRlbS5pZFxuICAgICAgfSkpXG4gIH1cblxuICBnZXQgam9pbmluZ1NzaWQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU/Lm9wPy50YXJnZXQgPz8gdGhpcy5zZWxlY3RlZCA/PyB0aGlzLm5ldHdvcmsuc3NpZCA/PyAndGhlIG5ldHdvcmsnXG4gIH1cblxuICBnZXQgY2hlY2tsaXN0ICgpIHtcbiAgICBjb25zdCBvcCA9IHRoaXMuc3RhdGU/Lm9wXG4gICAgY29uc3QgYXQgPSBKT0lOX1BIQVNFUy5pbmRleE9mKFN0cmluZyhvcD8ucGhhc2UgPz8gJ3NhdmluZycpKVxuICAgIGNvbnN0IHN0ZXAgPSAobGFiZWw6IHN0cmluZywgcGhhc2U6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgaSA9IEpPSU5fUEhBU0VTLmluZGV4T2YocGhhc2UpXG4gICAgICByZXR1cm4geyBsYWJlbCwgc3RhdHVzOiBhdCA+IGkgPyAnZG9uZScgOiBhdCA9PT0gaSA/ICdub3cnIDogJ25leHQnIH1cbiAgICB9XG4gICAgY29uc3QgaXRlbXMgPSBbXG4gICAgICBzdGVwKCdQYXNzd29yZCBhY2NlcHRlZCcsICdhdXRoZW50aWNhdGluZycpLFxuICAgICAgc3RlcCgnR290IGFuIGFkZHJlc3MnLCAnZGhjcCcpLFxuICAgICAgc3RlcCgnQ2hlY2tpbmcgaW50ZXJuZXQnLCAnaW50ZXJuZXRfY2hlY2snKSxcbiAgICAgIHN0ZXAoJ0NoZWNraW5nIGZvciB1cGRhdGVzJywgJ3VwZGF0ZV9jaGVjaycpXG4gICAgXVxuICAgIGlmIChvcD8ua2luZCA9PT0gJ3JlZ2lvbl9hcHBseScpIGl0ZW1zLnVuc2hpZnQoeyBsYWJlbDogJ1NldHRpbmcgdGhlIHJlZ2lvbicsIHN0YXR1czogJ25vdycgfSlcbiAgICByZXR1cm4gaXRlbXNcbiAgfVxuXG4gIGdldCBqb2luRXJyb3IgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGVycm9yID0gdGhpcy5uZXR3b3JrLmVycm9yXG4gICAgaWYgKCFlcnJvciB8fCBlcnJvci5jb2RlID09PSAncG9ydGFsX3JlcXVpcmVkJykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBzc2lkID0gU3RyaW5nKGVycm9yLmRldGFpbD8uc3NpZCA/PyB0aGlzLm5ldHdvcmsuc3NpZCA/PyAndGhlIG5ldHdvcmsnKVxuICAgIHJldHVybiBqb2luRXJyb3JDb3B5KGVycm9yLCB0aGlzLm5hbWUsIHNzaWQpXG4gIH1cblxuICBnZXQgcmVnaW9uQ291bnRyeSAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU/LnJlZ2lvbi5kZXRlY3RlZF9jb3VudHJ5ID8/IG51bGxcbiAgfVxuXG4gIGdldCByZWdpb25FcnJvciAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb2RlID0gdGhpcy5uZXR3b3JrLnJlZ2lvbl9lcnJvcj8uY29kZVxuICAgIGlmIChjb2RlID09PSAncmVnaW9uX2J1c3knKSByZXR1cm4gJ1RoZSBXaS1GaSByYWRpbyBpcyBidXN5LiBUcnkgYWdhaW4gaW4gYSBtb21lbnQuJ1xuICAgIGlmIChjb2RlID09PSAnbmVlZHNfcmVyZWdpc3RyYXRpb24nKSByZXR1cm4gJ1RoaXMgcHJpbnRlciBuZWVkcyByZS1yZWdpc3RlcmluZy4gQ29udGFjdCBzdXBwb3J0LidcbiAgICByZXR1cm4gJ1dlIGNvdWxkIG5vdCBhcHBseSB0aGF0IHJlZ2lvbi4nXG4gIH1cblxuICBAV2F0Y2goJ2N1cnNvcicsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIG9uQ3Vyc29yIChjdXJzb3I6IHN0cmluZyB8IG51bGwpIHtcbiAgICBpZiAoY3Vyc29yID09PSAnbmFtZScpIHRoaXMubmFtZURyYWZ0ID0gdGhpcy5zdGF0ZT8uc3RlcHMubmFtZS52YWx1ZSB8fCB0aGlzLnN0YXRlPy5zdGVwcy5uYW1lLmRlcml2ZWQgfHwgJydcbiAgICBpZiAoY3Vyc29yID09PSAncmVtb3RlJykgdGhpcy5yZW1vdGVDaG9pY2UgPSB0aGlzLmNsb3VkQmxvY2tlZCA/ICdsb2NhbCcgOiAnY2xvdWQnXG4gICAgdGhpcy53cml0ZUVycm9yID0gbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBpbnRlcm5ldCBvciBjbG9jayB3ZW50IHdoaWxlIFwiTGluayB0byBteSBhY2NvdW50XCIgd2FzIHBpY2tlZDogZmFsbCBiYWNrIHRvIHRoZSBjaG9pY2UgdGhhdCB3b3Jrcy4gKi9cbiAgQFdhdGNoKCdjbG91ZEJsb2NrZWQnKVxuICBvbkNsb3VkQmxvY2tlZCAoYmxvY2tlZDogc3RyaW5nIHwgbnVsbCkge1xuICAgIGlmIChibG9ja2VkICYmIHRoaXMucmVtb3RlQ2hvaWNlID09PSAnY2xvdWQnKSB0aGlzLnJlbW90ZUNob2ljZSA9ICdsb2NhbCdcbiAgfVxuXG4gIEBXYXRjaCgnc2NyZWVuJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25TY3JlZW4gKHNjcmVlbjogU2NyZWVuSWQsIGJlZm9yZT86IFNjcmVlbklkKSB7XG4gICAgaWYgKHNjcmVlbiA9PT0gJ1MzJyAmJiBiZWZvcmUgIT09ICdTMycpIHRoaXMuc2Nhbih0cnVlKVxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgdGhpcy5jbGllbnQub3B0aW9ucygpXG4gICAgICAudGhlbihvID0+IHtcbiAgICAgICAgdGhpcy5sYW5ndWFnZXMgPSAoby5sYW5ndWFnZXMgPz8gW10pLm1hcChsID0+IGwuY29kZSlcbiAgICAgICAgdGhpcy5yZWFkeU1hbmlmZXN0ID0gby5yZWFkeV9tYW5pZmVzdD8uaXRlbXMgPz8gW11cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICBjb3VudHJ5TmFtZSAoY29kZTogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gICAgaWYgKCFjb2RlKSByZXR1cm4gJ25vdCBkZXRlY3RlZCdcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBJbnRsLkRpc3BsYXlOYW1lcyhbJ2VuJ10sIHsgdHlwZTogJ3JlZ2lvbicgfSkub2YoY29kZSkgPz8gY29kZVxuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIGNvZGVcbiAgICB9XG4gIH1cblxuICB1bnVzYWJsZSAobjogU2V0dXBOZXR3b3JrKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCFuLnN1cHBvcnRlZCB8fCBuLnNlY3VyaXR5ID09PSAnd2VwJykgcmV0dXJuICdOb3Qgc3VwcG9ydGVkJ1xuICAgIGlmIChuLnNlY3VyaXR5ID09PSAnZW50ZXJwcmlzZScpIHJldHVybiBgRW50ZXJwcmlzZTogc2V0IGl0IHVwIG9uICR7dGhpcy5uYW1lfSdzIHNjcmVlbmBcbiAgICBpZiAoIW4uY2hhbm5lbF9wZXJtaXR0ZWQpIHJldHVybiBgSXRzIGNoYW5uZWwgaXNuJ3QgYWxsb3dlZCBpbiAke3RoaXMubmFtZX0ncyByZWdpb246IHVzZSBpdHMgc2NyZWVuYFxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBuZXR3b3JrTWV0YSAobjogU2V0dXBOZXR3b3JrKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJ0cyA9IFtgJHtuLnNpZ25hbH0lYCwgbi5iYW5kID8gYCR7bi5iYW5kfSBHSHpgIDogJyddXG4gICAgaWYgKHRoaXMubmVlZHNQYXNzd29yZChuKSkgcGFydHMudW5zaGlmdCgnU2VjdXJlZCcpXG4gICAgaWYgKG4uc2F2ZWQpIHBhcnRzLnB1c2goJ1NhdmVkJylcbiAgICByZXR1cm4gcGFydHMuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyDCtyAnKVxuICB9XG5cbiAgbmVlZHNQYXNzd29yZCAobjogU2V0dXBOZXR3b3JrKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICFbJ29wZW4nLCAnb3dlJ10uaW5jbHVkZXMobi5zZWN1cml0eSlcbiAgfVxuXG4gIGFzeW5jIHNjYW4gKHJlc2NhbjogYm9vbGVhbikge1xuICAgIHRoaXMuc2Nhbm5pbmcgPSB0cnVlXG4gICAgdGhpcy5zY2FuRXJyb3IgPSBudWxsXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2xpZW50Lm5ldHdvcmtzKHJlc2NhbilcbiAgICAgIHRoaXMubmV0d29ya3MgPSByZXN1bHQubmV0d29ya3MgPz8gW11cbiAgICAgIHRoaXMuY2FibGUgPSByZXN1bHQuZXRoZXJuZXQ/LmNhcnJpZXIgPyByZXN1bHQuZXRoZXJuZXQuYWRkcmVzcyA6IG51bGxcbiAgICAgIGlmICghcmVzdWx0Lm9rICYmIHJlc3VsdC5lcnJvcikgdGhpcy5zY2FuRXJyb3IgPSBgJHt0aGlzLm5hbWV9IGNvdWxkbid0IHNjYW4gZm9yIG5ldHdvcmtzLiBTY2FuIGFnYWluLmBcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMuc2NhbkVycm9yID0gYCR7dGhpcy5uYW1lfSBkaWRuJ3QgYW5zd2VyIHRoZSBzY2FuLiBTY2FuIGFnYWluLmBcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5zY2FubmluZyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgY2hvb3NlIChuOiBTZXR1cE5ldHdvcmspIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZCAhPT0gbi5zc2lkKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkID0gbi5zc2lkXG4gICAgICB0aGlzLnBhc3N3b3JkID0gJydcbiAgICAgIHRoaXMucGFzc3dvcmRFcnJvciA9IG51bGxcbiAgICAgIHRoaXMuc2hvd1Bhc3N3b3JkID0gZmFsc2VcbiAgICB9XG4gICAgdGhpcy53cml0ZUVycm9yID0gbnVsbFxuICB9XG5cbiAgLyoqIFBvc3RzIGEgd3JpdGUsIGFuZCBzYXlzIHdoeSBpdCB3YXMgcmVmdXNlZC4gUmVzb2x2ZXMgdG8gd2hldGhlciBpdCB3ZW50IHRocm91Z2guICovXG4gIGFzeW5jIHdyaXRlIChwYXRoOiBzdHJpbmcsIGJvZHk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30sIG9wdHM/OiB7IHJldj86IGJvb2xlYW4gfSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybiBmYWxzZVxuICAgIHRoaXMuYnVzeSA9IHRydWVcbiAgICB0aGlzLndyaXRlRXJyb3IgPSBudWxsXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdDogU2V0dXBSZXN1bHQgfCBudWxsID0gYXdhaXQgdGhpcy5jbGllbnQucG9zdChwYXRoLCBib2R5LCBvcHRzKVxuICAgICAgLy8gTm8gYW5zd2VyOiB0aGUgbmV4dCBzdGF0ZSBzYXlzIHdoYXQgaGFwcGVuZWQuXG4gICAgICBpZiAoIXJlc3VsdCkgcmV0dXJuIHRydWVcbiAgICAgIGlmIChyZXN1bHQub2spIHJldHVybiB0cnVlXG4gICAgICB0aGlzLndyaXRlRXJyb3IgPSB3cml0ZUVycm9yQ29weShyZXN1bHQuZXJyb3IsIHRoaXMubmFtZSlcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLndyaXRlRXJyb3IgPSBlcnJvciBpbnN0YW5jZW9mIFNldHVwSHR0cEVycm9yXG4gICAgICAgID8gYCR7dGhpcy5uYW1lfSByZWZ1c2VkIHRoYXQ6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgIDogU3RyaW5nKChlcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZXJyb3IpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5idXN5ID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBhc3luYyBzdGFydCAoKSB7XG4gICAgdGhpcy5idXN5ID0gdHJ1ZVxuICAgIHRyeSB7XG4gICAgICAvLyBUaGUgY2xvY2sgYW5kIHRpbWUgem9uZSBmaXJzdDogb25seSB0aGlzIHBhZ2Uga25vd3MgdGhlIG93bmVyJ3MgKDAyIMKnNS40KS5cbiAgICAgIGF3YWl0IHRoaXMuY2xpZW50LnBvc3RDbG9jaygpXG4gICAgICBpZiAodGhpcy5zdGF0ZT8uc3RlcHMubGFuZ3VhZ2Uuc3RhdHVzID09PSAncGVuZGluZycpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IHBhZ2VMYW5ndWFnZUZvcih0aGlzLnN0YXRlLCB0aGlzLmxhbmd1YWdlcywgbmF2aWdhdG9yLmxhbmd1YWdlcyA/PyBbbmF2aWdhdG9yLmxhbmd1YWdlXSwgbnVsbClcbiAgICAgICAgYXdhaXQgdGhpcy5jbGllbnQucG9zdCgnbGFuZ3VhZ2UnLCB7IGNvZGUgfSkuY2F0Y2goKCkgPT4gbnVsbClcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNsYWltZWQgPSBhd2FpdCB0aGlzLmNsaWVudC5jbGFpbURyaXZlcigpXG4gICAgICBpZiAoY2xhaW1lZCAmJiAhY2xhaW1lZC5vaykgdGhpcy53cml0ZUVycm9yID0gd3JpdGVFcnJvckNvcHkoY2xhaW1lZC5lcnJvciwgdGhpcy5uYW1lKVxuICAgICAgZWxzZSBzZXRMb2NhbCh7IGRyb3ZlU2V0dXA6IHRydWUgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy53cml0ZUVycm9yID0gU3RyaW5nKChlcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZXJyb3IpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuYnVzeSA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgam9pbiAobjogU2V0dXBOZXR3b3JrKSB7XG4gICAgY29uc3QgcHNrID0gdGhpcy5wYXNzd29yZFxuICAgIGlmICh0aGlzLm5lZWRzUGFzc3dvcmQobikgJiYgIXZhbGlkUHNrKHBzaykpIHtcbiAgICAgIHRoaXMucGFzc3dvcmRFcnJvciA9ICdBIFdpLUZpIHBhc3N3b3JkIGlzIDggdG8gNjMgY2hhcmFjdGVycywgb3IgNjQgaGV4YWRlY2ltYWwgZGlnaXRzLidcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnBhc3N3b3JkRXJyb3IgPSBudWxsXG4gICAgY29uc3QgcmV2ID0gdGhpcy5zdGF0ZT8ucmV2ID8/IG51bGxcbiAgICBjb25zdCBzZW50ID0gYXdhaXQgdGhpcy53cml0ZSgnbmV0d29yaycsIHtcbiAgICAgIGtpbmQ6ICd3aWZpJyxcbiAgICAgIHNzaWQ6IG4uc3NpZCxcbiAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICBzZWN1cml0eTogbi5zZWN1cml0eSxcbiAgICAgIC4uLih0aGlzLm5lZWRzUGFzc3dvcmQobikgPyB7IHBzayB9IDoge30pLFxuICAgICAgcmVnaW9uOiBudWxsLFxuICAgICAgZWFwOiBudWxsXG4gICAgfSlcbiAgICBpZiAoc2VudCkgc2V0TG9jYWwoeyBqb2luUmV2OiByZXYgfSlcbiAgICAvLyBOZXZlciBrZXB0OiB0aGUgcHJpbnRlcidzIE5ldHdvcmtNYW5hZ2VyIGlzIHRoZSBvbmx5IHBsYWNlIGl0IGxpdmVzLlxuICAgIHRoaXMucGFzc3dvcmQgPSAnJ1xuICB9XG5cbiAgYXN5bmMgdXNlQ2FibGUgKCkge1xuICAgIGNvbnN0IHJldiA9IHRoaXMuc3RhdGU/LnJldiA/PyBudWxsXG4gICAgaWYgKGF3YWl0IHRoaXMud3JpdGUoJ25ldHdvcmsnLCB7IGtpbmQ6ICdldGhlcm5ldCcgfSkpIHNldExvY2FsKHsgam9pblJldjogcmV2IH0pXG4gIH1cblxuICBjYW5jZWxKb2luICgpIHtcbiAgICByZXR1cm4gdGhpcy53cml0ZSgnbmV0d29yay9jYW5jZWwnLCB7fSwgeyByZXY6IGZhbHNlIH0pXG4gIH1cblxuICBhc3luYyBza2lwTmV0d29yayAoKSB7XG4gICAgaWYgKGF3YWl0IHRoaXMud3JpdGUoJ3NraXAnLCB7IHN0ZXA6ICduZXR3b3JrJyB9KSkgdGhpcy5jb25maXJtU2tpcCA9IGZhbHNlXG4gIH1cblxuICBjb25maXJtUmVnaW9uICgpIHtcbiAgICBpZiAodGhpcy5yZWdpb25Db3VudHJ5KSByZXR1cm4gdGhpcy53cml0ZSgncmVnaW9uJywgeyBjb3VudHJ5OiB0aGlzLnJlZ2lvbkNvdW50cnkgfSlcbiAgfVxuXG4gIC8qKiBCYWNrIHRvIHRoZSBsaXN0LCB3aXRoIHRoZSBzYW1lIG5ldHdvcmsgb3BlbiBhbmQgaXRzIHBhc3N3b3JkIGZpZWxkIGVtcHR5LiAqL1xuICB0cnlBZ2FpbiAoKSB7XG4gICAgY29uc3Qgc3NpZCA9IHRoaXMubmV0d29yay5lcnJvcj8uZGV0YWlsPy5zc2lkXG4gICAgc2V0TG9jYWwoeyBqb2luUmV2OiBudWxsIH0pXG4gICAgaWYgKHR5cGVvZiBzc2lkID09PSAnc3RyaW5nJykgdGhpcy5zZWxlY3RlZCA9IHNzaWRcbiAgICB0aGlzLnNob3dQYXNzd29yZCA9IGZhbHNlXG4gIH1cblxuICBjaG9vc2VBbm90aGVyICgpIHtcbiAgICBzZXRMb2NhbCh7IGpvaW5SZXY6IG51bGwgfSlcbiAgICB0aGlzLnNlbGVjdGVkID0gbnVsbFxuICAgIHRoaXMuc2hvd1Bhc3N3b3JkID0gZmFsc2VcbiAgfVxuXG4gIGFja25vd2xlZGdlICgpIHtcbiAgICBzZXRMb2NhbCh7IGpvaW5SZXY6IG51bGwgfSlcbiAgfVxuXG4gIGdvQmFjayAoKSB7XG4gICAgaWYgKHRoaXMucHJldmlvdXMpIHJldHVybiB0aGlzLndyaXRlKCdnb3RvJywgeyBzdGVwOiB0aGlzLnByZXZpb3VzIH0pXG4gIH1cblxuICBzYXZlTmFtZSAoKSB7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMubmFtZURyYWZ0LnRyaW0oKVxuICAgIGlmIChuYW1lKSByZXR1cm4gdGhpcy53cml0ZSgnbmFtZScsIHsgbmFtZSB9KVxuICB9XG5cbiAgYXN5bmMgaW5zdGFsbFVwZGF0ZSAoKSB7XG4gICAgY29uc3Qgc2VudCA9IGF3YWl0IHRoaXMud3JpdGUoJ3VwZGF0ZScsIHsgYWN0aW9uOiAnaW5zdGFsbCcgfSlcbiAgICAvLyBJbnN0YWxsIHJlc3RhcnRzIHRoZSBwcmludGVyOiBhIEJsdWV0b290aCBsaW5rIHRoYXQgZHJvcHMgYWZ0ZXIgdGhpcyBpcyBleHBlY3RlZC5cbiAgICBpZiAoc2VudCkgdGhpcy4kZW1pdCgnaW5zdGFsbGluZycpXG4gICAgcmV0dXJuIHNlbnRcbiAgfVxuXG4gIHVwZGF0ZUxhdGVyICgpIHtcbiAgICByZXR1cm4gdGhpcy53cml0ZSgndXBkYXRlJywgeyBhY3Rpb246ICdsYXRlcicgfSlcbiAgfVxuXG4gIGNob29zZVJlbW90ZSAobW9kZTogUmVtb3RlTW9kZSkge1xuICAgIHJldHVybiB0aGlzLndyaXRlKCdyZW1vdGUnLCB7IG1vZGUgfSlcbiAgfVxuXG4gIC8qKiBCYWNrIGZyb20gdGhlIGNvZGU6IHN0b3AgbGlua2luZywgYW5kIGdvIGJhY2sgdG8gdGhlIGNob2ljZS4gKi9cbiAgY2FuY2VsTGluayAoKSB7XG4gICAgcmV0dXJuIHRoaXMud3JpdGUoJ3JlbW90ZS9jYW5jZWwnLCB7fSwgeyByZXY6IGZhbHNlIH0pXG4gIH1cblxuICBza2lwUmVhZHlJdGVtIChpdGVtOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy53cml0ZSgncmVhZHknLCB7IGFjdGlvbjogJ3NraXAnLCBpdGVtIH0pXG4gIH1cbn1cblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5tdW9uLXNldHVwLXN0ZXBzIHtcbiAgJl9fdGl0bGUge1xuICAgIGZvbnQtc2l6ZTogdmFyKC0tbTNkLXRleHQtbGcpO1xuICAgIGZvbnQtd2VpZ2h0OiB2YXIoLS1tM2Qtd2VpZ2h0LXNlbWlib2xkKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIG1hcmdpbjogMCAwIDhweDtcbiAgfVxuXG4gICZfX2xlZGUsXG4gICZfX211dGVkIHtcbiAgICBmb250LXNpemU6IHZhcigtLW0zZC10ZXh0LXNtKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIG1hcmdpbjogMCAwIDEycHg7XG4gIH1cblxuICAmX19lcnJvciB7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC1zbSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIsICNlNTQ4NGQpO1xuICAgIG1hcmdpbjogOHB4IDA7XG4gIH1cblxuICAmX19wbGFuIHtcbiAgICBtYXJnaW46IDAgMCAxNnB4O1xuICAgIHBhZGRpbmctbGVmdDogMjBweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogdmFyKC0tbTNkLXRleHQtc20pO1xuXG4gICAgbGkge1xuICAgICAgbWFyZ2luLWJvdHRvbTogNHB4O1xuICAgIH1cbiAgfVxuXG4gICZfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgbWFyZ2luLWJvdHRvbTogOHB4O1xuICB9XG5cbiAgJl9fbmV0d29yayB7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogdmFyKC0tbTNkLXJhZGl1cy1tZCk7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgbWFyZ2luLWJvdHRvbTogOHB4O1xuXG4gICAgJi5pcy1jYXJkIHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgfVxuXG4gICAgJi5pcy1vcGVuIHtcbiAgICAgIGJvcmRlci1jb2xvcjogdmFyKC0tbTNkLWFjY2VudC1saW5lKTtcbiAgICB9XG5cbiAgICAmLmlzLWRpc2FibGVkIHtcbiAgICAgIG9wYWNpdHk6IDAuNjtcbiAgICB9XG4gIH1cblxuICAmX19uZXR3b3JrLXJvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIHBhZGRpbmc6IDEwcHggMTJweDtcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgIGJvcmRlcjogMDtcbiAgICBjb2xvcjogaW5oZXJpdDtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcblxuICAgICY6ZGlzYWJsZWQge1xuICAgICAgY3Vyc29yOiBkZWZhdWx0O1xuICAgIH1cbiAgfVxuXG4gICZfX25ldHdvcmstbmFtZSB7XG4gICAgZm9udC13ZWlnaHQ6IHZhcigtLW0zZC13ZWlnaHQtbWVkaXVtKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgJl9fbmV0d29yay1tZXRhIHtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubyk7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC14cyk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gICZfX2pvaW4ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogMCAxMnB4IDEycHg7XG4gIH1cblxuICAmX19jb25maXJtIHtcbiAgICBtYXJnaW4tdG9wOiA4cHg7XG4gICAgZm9udC1zaXplOiB2YXIoLS1tM2QtdGV4dC1zbSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gICZfX3NraXAge1xuICAgIG1hcmdpbi10b3A6IDRweDtcbiAgfVxuXG4gICZfX2NoZWNrbGlzdCB7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICBwYWRkaW5nOiAwO1xuICAgIG1hcmdpbjogMCAwIDEycHg7XG5cbiAgICBsaSB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIGdhcDogOHB4O1xuICAgICAgcGFkZGluZzogNHB4IDA7XG4gICAgICBmb250LXNpemU6IHZhcigtLW0zZC10ZXh0LXNtKTtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICAgICYuaXMtZG9uZSxcbiAgICAgICYuaXMtbm93IHtcbiAgICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAmX19yZWdpb24ge1xuICAgIGZvbnQtc2l6ZTogdmFyKC0tbTNkLXRleHQtc20pO1xuICAgIG1hcmdpbjogMTJweCAwIDRweDtcbiAgfVxuXG4gICZfX2FjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogOHB4O1xuICB9XG59XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbXVvbi1zZXR1cC9TZXR1cFdpZmlTdGVwcy52dWUifQ==