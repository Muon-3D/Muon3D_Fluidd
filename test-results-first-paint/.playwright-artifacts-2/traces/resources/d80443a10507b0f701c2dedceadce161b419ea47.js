/* unplugin-vue-components disabled */import { VDialog as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_6 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import { VTextField as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VForm as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/common/ProtectedNotice.vue";
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
import { Vue, Component, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { useAuxApi } from "/src/aux_api/useAuxApi.ts";
import { PANEL_ONLY_NOTE, classifyRefusal, fallsBack, hotspotChangeBody, isPanelOnlyRefusal, panelOnlyMessage, refusedHere, routeFor } from "/src/services/wifi/panel-only.ts";
import PermissionRefusalNotice from "/src/components/widgets/wifi/PermissionRefusalNotice.vue";
import QrcodeVue from "/.vite-e2e/4291/deps/qrcode__vue.js?v=9b9fafc7";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import TonePill from "/src/components/printers/TonePill.vue";
import i18n from "/src/plugins/i18n.ts";
import { useHotspotCheck } from "/src/aux_api/useHotspotCheck.ts";
import { EventBus } from "/src/eventBus.ts";
import { moonrakerErrorMessage } from "/src/store/protection/helpers.ts";
import { printerTransportBinding } from "/src/services/managed-session/httpTransportBinding.ts";
import { autoOffIn, connectedFor, dbmLevel, hotspotState } from "/src/services/hotspot/model.ts";
import { startHotspotPoll } from "/src/services/hotspot/poller.ts";
const { onHotspot } = useHotspotCheck();
let HotspotManagerCard = class extends Vue {
  compact;
  formIsValid = false;
  get onHotspot() {
    return onHotspot.value;
  }
  // MuonOS network protection is on and this browser has no identity, so
  // every hotspot request would be refused. The notice says so instead, and
  // polling waits until that changes.
  get locked() {
    return this.$store.getters["protection/isLocked"];
  }
  onLockedChanged(locked) {
    if (!locked) this.fetchConfig();
  }
  // Reached over Iroh: muon-link refuses every Aux request there, reads
  // included, and the owner decided remote callers may not change Wi-Fi
  // (setup spec 07 §3). The card makes no call and says so instead.
  get remote() {
    return printerTransportBinding.remote;
  }
  onRemoteChanged(remote) {
    if (!remote) this.fetchConfig();
  }
  showToggleWarningDialog = false;
  showChangeWarningDialog = false;
  // “Request” methods show the warning dialog instead of immediately doing the thing
  requestToggle() {
    if (onHotspot.value) {
      this.showToggleWarningDialog = true;
    } else {
      this.confirmToggle();
    }
  }
  // “Confirm” methods perform the real action, then hide the dialog
  async confirmToggle() {
    this.showToggleWarningDialog = false;
    await this.changeHotspotState(!this.apState);
  }
  async requestApplyChanges() {
    const form = this.$refs.apForm;
    if (!form || !(form.validate() && this.isDirty)) return;
    if (onHotspot.value) {
      this.showChangeWarningDialog = true;
    } else {
      await this.confirmApply();
    }
  }
  async confirmApply() {
    this.showChangeWarningDialog = false;
    await this.applyChanges();
  }
  auxApi = useAuxApi();
  deviceStatus = null;
  apCredentials = null;
  editing = false;
  applying = false;
  /** The printer's permission store refused the last action (KAN-2457): who may do it, not a panel-only printer. */
  refusal = null;
  takePermissionRefusal(err) {
    const r = classifyRefusal(err);
    if (r.kind !== "permission") return false;
    this.refusal = r;
    return true;
  }
  toggleEditing() {
    this.editing = !this.editing;
    this.resetForm();
  }
  open = false;
  // local form + pristine copy
  form = {
    ssid: "",
    password: "",
    securityEnabled: true
  };
  original = { ...this.form };
  passwordVisible = false;
  statusPollId = null;
  destroyed = false;
  requestedApState = null;
  requestedApStateUntil = 0;
  stopHotspotPoll = null;
  /** Who is on the hotspot, from the shared poll (KAN-4297). */
  get stations() {
    return hotspotState.stations;
  }
  get deviceLine() {
    const n = this.stations?.count ?? 0;
    return n === 0 ? "No devices connected" : `${n} ${n === 1 ? "device" : "devices"} connected`;
  }
  /** The printer sent the list (a printer that predates it sends the count only). */
  get hasClients() {
    return !!this.stations?.clients?.length;
  }
  get autoOffLine() {
    return autoOffIn(this.stations?.autoOffAt ?? null);
  }
  connectedFor(seconds) {
    return connectedFor(seconds);
  }
  dbmLevel(dbm) {
    return dbmLevel(dbm);
  }
  async mounted() {
    this.stopHotspotPoll = startHotspotPoll();
    await this.fetchConfig();
    if (!this.destroyed) {
      this.statusPollId = window.setInterval(() => {
        this.refreshStatus();
      }, 1e3);
    }
  }
  beforeDestroy() {
    this.destroyed = true;
    this.stopHotspotPoll?.();
    this.stopHotspotPoll = null;
    if (this.statusPollId !== null) {
      window.clearInterval(this.statusPollId);
      this.statusPollId = null;
    }
  }
  async fetchConfig() {
    if (this.locked || this.remote) return;
    try {
      const [statusResponse, credentialsResponse] = await Promise.all([
        this.auxApi.ap.wifiStatusWifiApDeviceStatusGet(),
        this.auxApi.ap.apShowCredentialsWifiApShowGet()
      ]);
      this.applyDeviceStatus(statusResponse.data);
      this.apCredentials = credentialsResponse.data;
      this.resetForm();
    } catch (e) {
      console.error("Failed to load hotspot config", e);
      if (e?.response?.status === 403) {
        this.$store.dispatch("protection/onRefused");
      } else {
        EventBus.$emit(`${this.$t("app.wifi.msg.hotspot.load_error")} ${moonrakerErrorMessage(e)}`, { type: "error", timeout: 5e3 });
      }
    }
  }
  async refreshStatus() {
    if (this.locked || this.remote) return;
    try {
      const response = await this.auxApi.ap.wifiStatusWifiApDeviceStatusGet();
      this.applyDeviceStatus(response.data);
    } catch (_) {
    }
  }
  applyDeviceStatus(status) {
    const observedState = status.state === "connected";
    if (this.requestedApState !== null && Date.now() < this.requestedApStateUntil && observedState !== this.requestedApState) return;
    this.requestedApState = null;
    this.deviceStatus = status;
  }
  get isDirty() {
    return this.form.ssid !== this.original.ssid || this.form.securityEnabled !== this.original.securityEnabled || this.form.securityEnabled && this.form.password !== this.original.password;
  }
  resetForm() {
    if (!this.apCredentials) return;
    this.form.ssid = this.apCredentials.ssid;
    this.form.password = "";
    this.passwordVisible = false;
    this.form.securityEnabled = this.apCredentials.security_enabled ?? true;
    this.original = { ...this.form };
  }
  async applyChanges() {
    if (!this.apCredentials) return;
    this.applying = true;
    try {
      const payload = {
        ssid: this.form.ssid,
        password: this.form.securityEnabled ? this.form.password : null
      };
      const route = routeFor("hotspot-edit", refusedHere);
      if (route.kind === "call" && route.path === "/wifi/ap/change") {
        await this.changeAtPrinter();
        this.applying = false;
        this.toggleEditing();
        return;
      }
      try {
        await this.auxApi.ap.apModifyWifiApModifyPost(payload);
      } catch (e) {
        if (!fallsBack(e)) throw e;
        refusedHere.hotspotEdit = true;
        await this.changeAtPrinter();
        this.applying = false;
        this.toggleEditing();
        return;
      }
      await this.fetchConfig();
      await this.changeHotspotState(true);
    } catch (e) {
      console.error("Failed to apply hotspot config", e);
      if (this.takePermissionRefusal(e)) {
        this.applying = false;
        this.toggleEditing();
        return;
      }
      if (e?.response?.status === 403) this.$store.dispatch("protection/onRefused");
      EventBus.$emit(`${this.$t("app.wifi.msg.hotspot.apply_error")} ${moonrakerErrorMessage(e)}`, { type: "error", timeout: 5e3 });
    }
    this.applying = false;
    this.toggleEditing();
  }
  /**
   * POST /wifi/ap/change: the printer's screen asks the person standing there,
   * and the new name or key applies when they confirm. Nothing changes here.
   */
  async changeAtPrinter() {
    const body = hotspotChangeBody(this.form, this.original.ssid);
    if (!body) {
      EventBus.$emit(panelOnlyMessage("make the hotspot open"), { type: "error", timeout: 8e3 });
      return;
    }
    try {
      await this.auxApi.apChange(body);
      EventBus.$emit("Press the knob on the printer to confirm. The hotspot changes when you do.", { type: "primary", timeout: 1e4 });
    } catch (e) {
      if (this.takePermissionRefusal(e)) {
      } else if (isPanelOnlyRefusal(e)) {
        EventBus.$emit(panelOnlyMessage("change the hotspot"), { type: "error", timeout: 8e3 });
      } else {
        EventBus.$emit(`${this.$t("app.wifi.msg.hotspot.apply_error")} ${moonrakerErrorMessage(e)}`, { type: "error", timeout: 5e3 });
      }
    }
  }
  undoChanges() {
    this.resetForm();
    this.toggleEditing();
  }
  onPasswordEdited(newVal) {
    this.form.securityEnabled = !!newVal;
  }
  onSecurityToggled(newVal) {
    if (!newVal) {
      this.form.password = "";
    } else {
      this.$nextTick(() => {
        const pw = this.$refs.passwordInput;
        if (pw && pw.focus) pw.focus();
        else if (pw && pw.$el) {
          const inp = pw.$el.querySelector("input");
          inp && inp.focus();
        }
      });
    }
  }
  get ssidRules() {
    return [
      (v) => !!v || i18n.t("app.general.simple_form.error.required").toString()
    ];
  }
  /**
   * WPA-PSK rule: either
   *  • exactly 64 hex digits, or
   *  • 8–63 printable-ASCII chars (32–126)
   */
  get passwordRules() {
    return [
      (v) => {
        if (!this.form.securityEnabled) return true;
        if (/^[0-9A-Fa-f]{64}$/.test(v)) {
          return true;
        }
        if (v.length < 8) {
          return i18n.t("app.wifi.password.too-short").toString();
        }
        if (v.length > 63) {
          return i18n.t("app.wifi.password.too-long").toString();
        }
        const invalidChars = Array.from(v).filter((ch) => {
          const code = ch.charCodeAt(0);
          return code < 32 || code > 126;
        }).filter((ch, idx, arr) => arr.indexOf(ch) === idx);
        if (invalidChars.length) {
          return i18n.t("app.wifi.password.invalid-character").toString() + ": " + invalidChars.map((c) => {
            const code = c.charCodeAt(0);
            return /\s/.test(c) ? `0x${code.toString(16).padStart(2, "0")}` : `'${c}'`;
          }).join(", ");
        }
        return true;
      }
    ];
  }
  toggling = false;
  panelOnlyNote = PANEL_ONLY_NOTE;
  get hotspotOffIsPanelOnly() {
    return routeFor("hotspot-off", refusedHere).kind === "panel";
  }
  async changeHotspotState(wantsOn) {
    if (!this.apCredentials || this.toggling) return;
    const turnOn = wantsOn !== void 0 ? wantsOn : this.deviceStatus?.state !== "connected";
    this.toggling = true;
    this.requestedApState = turnOn;
    this.requestedApStateUntil = Date.now() + 5e3;
    this.apState = turnOn;
    try {
      if (turnOn) {
        await this.auxApi.ap.apUpWifiApUpPost();
      } else {
        await this.auxApi.ap.apDownWifiApDownPost();
      }
    } catch (e) {
      this.requestedApState = null;
      this.apState = this.deviceStatus?.state === "connected";
      console.error("Hotspot toggle failed", e);
      if (this.takePermissionRefusal(e)) return;
      if (!turnOn && isPanelOnlyRefusal(e)) {
        refusedHere.hotspotOff = true;
        EventBus.$emit(panelOnlyMessage("turn the hotspot off"), { type: "error", timeout: 8e3 });
        return;
      }
      if (turnOn && isPanelOnlyRefusal(e)) {
        EventBus.$emit(panelOnlyMessage("turn the hotspot on"), { type: "error", timeout: 8e3 });
        return;
      }
      if (e?.response?.status === 403) this.$store.dispatch("protection/onRefused");
      EventBus.$emit(`${this.$t("app.wifi.msg.hotspot.toggle_error")} ${moonrakerErrorMessage(e)}`, { type: "error", timeout: 5e3 });
    } finally {
      this.toggling = false;
    }
  }
  // ------------------------------------------------------
  // NEW: local switch state for the v-switch
  apState = false;
  onDeviceStatusChanged(newStatus) {
    this.apState = newStatus?.state === "connected";
  }
  // ------------------------------------------------------
  // A join code only for an open hotspot. A secured hotspot's key, and any
  // code carrying it, appear only on the printer's screen (setup spec 07 S1),
  // so this page never draws one, even when an older Aux returns the key.
  get QrValue() {
    if (!this.apCredentials || this.apCredentials.security_enabled !== false) return "";
    const S = this.apCredentials.ssid.replace(/\\/g, "\\\\").replace(/;/g, "\\;");
    return `WIFI:S:${S};T:nopass;H:false;;`;
  }
  // Where to get the code instead, when this page draws none.
  get printerName() {
    return this.$store.getters["config/getDisplayName"] ?? "";
  }
  delayedEditing = this.editing;
  onEditingChanged(newVal) {
    window.setTimeout(() => {
      this.delayedEditing = newVal;
    }, 100);
  }
  emitDeviceStatus(v) {
    this.$emit("update:device-status", v);
  }
  emitToggling(v) {
    this.$emit("update:toggling", v);
  }
};
__decorateClass([
  Prop({ type: Boolean })
], HotspotManagerCard.prototype, "compact", 2);
__decorateClass([
  Watch("locked")
], HotspotManagerCard.prototype, "onLockedChanged", 1);
__decorateClass([
  Watch("remote")
], HotspotManagerCard.prototype, "onRemoteChanged", 1);
__decorateClass([
  Watch("form.password")
], HotspotManagerCard.prototype, "onPasswordEdited", 1);
__decorateClass([
  Watch("form.securityEnabled")
], HotspotManagerCard.prototype, "onSecurityToggled", 1);
__decorateClass([
  Watch("deviceStatus", { immediate: true })
], HotspotManagerCard.prototype, "onDeviceStatusChanged", 1);
__decorateClass([
  Watch("editing")
], HotspotManagerCard.prototype, "onEditingChanged", 1);
__decorateClass([
  Watch("deviceStatus", { immediate: true })
], HotspotManagerCard.prototype, "emitDeviceStatus", 1);
__decorateClass([
  Watch("toggling", { immediate: true })
], HotspotManagerCard.prototype, "emitToggling", 1);
HotspotManagerCard = __decorateClass([
  Component({
    directives: {
      square: {
        inserted(el) {
          const update = () => {
            el.style.width = el.offsetHeight + "px";
          };
          update();
          window.addEventListener("resize", update);
          if ("ResizeObserver" in window) {
            const ro = new ResizeObserver(update);
            ro.observe(el.parentElement);
            el.__ro__ = ro;
          }
          el.__sq__ = update;
        },
        unbind(el) {
          window.removeEventListener("resize", el.__sq__);
          if (el.__ro__) el.__ro__.disconnect();
        }
      }
    },
    components: {
      QrcodeVue,
      ToggleSwitch,
      TonePill,
      PermissionRefusalNotice
    }
  })
], HotspotManagerCard);
const _sfc_main = HotspotManagerCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "hs", class: { "hs--compact": _vm.compact, "stile stile--6 hs--page": !_vm.compact }, attrs: { "data-tid": "hotspot-card" } }, [_c("header", { staticClass: "hs__head" }, [_c("div", { staticClass: "hs__titles" }, [_c("h2", [!_vm.compact ? _c(__unplugin_components_0, { staticClass: "hs__ico", attrs: { "name": "bolt" } }) : _vm._e(), _vm._v(" Hotspot "), !_vm.compact && !_vm.locked && _vm.stations && _vm.stations.up ? _c("span", { staticClass: "hs__badge", class: { "hs__badge--zero": _vm.stations.count === 0 }, attrs: { "data-tid": "hotspot-badge" } }, [_c("i"), _vm._v(_vm._s(_vm.stations.count) + " connected")]) : _vm._e()], 1), _vm.compact && _vm.deviceStatus && _vm.apCredentials && !_vm.locked && !_vm.remote ? _c("p", [_vm._v(" " + _vm._s(_vm.apState ? "On" : "Off") + " \xB7 " + _vm._s(_vm.apCredentials.ssid) + _vm._s(_vm.apCredentials.security_enabled === false ? " \xB7 open" : "") + " ")]) : _vm._e()]), !_vm.compact && _vm.deviceStatus && _vm.apCredentials && !_vm.locked && !_vm.remote ? _c("tone-pill", { attrs: { "tone": _vm.apState ? "ok" : "off", "dot": _vm.apState, "data-tid": "hotspot-state" } }, [_vm._v(" " + _vm._s(_vm.apState ? "On" : "Off") + " ")]) : _vm._e(), !_vm.remote && _vm.hotspotOffIsPanelOnly && _vm.apState ? _c("span", { staticClass: "hs__note", attrs: { "data-tid": "hotspot-off-panel" } }, [_vm._v(_vm._s(_vm.panelOnlyNote))]) : !_vm.remote ? _c("toggle-switch", { attrs: { "value": _vm.apState, "label": "Hotspot on", "disabled": _vm.locked || !_vm.apCredentials || !_vm.deviceStatus || _vm.toggling, "data-tid": "hotspot-switch" }, on: { "input": function($event) {
    return _vm.requestToggle();
  } } }) : _vm._e()], 1), !_vm.compact && !_vm.locked && !_vm.remote ? _c("p", { staticClass: "hs__note", attrs: { "data-tid": "hotspot-help" } }, [_vm._v(" A network the printer makes itself, for when there is no Wi-Fi. Turning it on drops the current connection. ")]) : _vm._e(), _c(__unplugin_components_1), _c("permission-refusal-notice", { attrs: { "refusal": _vm.refusal }, on: { "dismiss": function($event) {
    _vm.refusal = null;
  } } }), _vm.remote ? _c("p", { staticClass: "hs__note" }, [_vm._v(" " + _vm._s(_vm.$t("app.wifi.remote_read_only")) + " ")]) : _vm._e(), !_vm.locked && !_vm.remote && !_vm.compact ? _c("div", { staticClass: "hs__body", attrs: { "data-tid": "hotspot-body" } }, [!_vm.apCredentials ? _c("p", { staticClass: "hs__note" }, [_vm._v(" Reading the hotspot's settings\u2026 ")]) : _c(__unplugin_components_2, { ref: "apForm", staticClass: "hs__form", attrs: { "disabled": !_vm.editing || _vm.applying, "lazy-validation": "" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.requestApplyChanges.apply(null, arguments);
  } }, model: { value: _vm.formIsValid, callback: function($$v) {
    _vm.formIsValid = $$v;
  }, expression: "formIsValid" } }, [_c(__unplugin_components_3, { attrs: { "label": "Name (SSID)", "outlined": "", "dense": "", "hide-details": "auto", "rules": _vm.ssidRules }, model: { value: _vm.form.ssid, callback: function($$v) {
    _vm.$set(_vm.form, "ssid", $$v);
  }, expression: "form.ssid" } }), _c("div", { staticClass: "hs__row" }, [_c("span", [_vm._v("Needs a password")]), _c("toggle-switch", { attrs: { "value": _vm.form.securityEnabled, "label": "Needs a password", "disabled": !_vm.editing || _vm.applying, "data-tid": "hotspot-secured" }, on: { "input": function($event) {
    _vm.form.securityEnabled = $event;
  } } })], 1), _c(__unplugin_components_4, { ref: "passwordInput", attrs: { "label": _vm.$t("app.general.label.password"), "type": _vm.passwordVisible ? "text" : "password", "append-icon": _vm.passwordVisible ? "$eyeOff" : "$eye", "rules": _vm.passwordRules, "outlined": "", "dense": "", "hide-details": "auto", "disabled": !_vm.form.securityEnabled || !_vm.editing || _vm.applying }, on: { "click:append": function($event) {
    $event.stopPropagation();
    _vm.passwordVisible = !_vm.passwordVisible;
  } }, model: { value: _vm.form.password, callback: function($$v) {
    _vm.$set(_vm.form, "password", $$v);
  }, expression: "form.password" } }), _c("div", { staticClass: "hs__buttons" }, [!_vm.editing ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": _vm.toggling || _vm.applying, "data-tid": "hotspot-edit" }, on: { "click": _vm.toggleEditing } }, [_vm._v(" Change the name or password ")]) : [_c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "disabled": !_vm.isDirty || !_vm.formIsValid || _vm.applying, "data-tid": "hotspot-apply" } }, [_vm._v(" " + _vm._s(_vm.$t("app.wifi.change")) + " ")]), _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "disabled": _vm.applying }, on: { "click": function($event) {
    $event.stopPropagation();
    return _vm.undoChanges.apply(null, arguments);
  } } }, [_vm._v(" " + _vm._s(_vm.isDirty ? "Undo" : "Back") + " ")])]], 2)], 1), _vm.apCredentials && _vm.apState && !_vm.editing ? _c("div", { staticClass: "hs__join" }, [_vm.QrValue ? [_c("qrcode-vue", { staticClass: "hs__qr", attrs: { "value": _vm.QrValue, "size": 120, "render-as": "svg" } }), _c("p", [_vm._v("Scan to join the hotspot.")])] : _c("p", [_vm._v(" " + _vm._s(_vm.$t("app.wifi.hotspot_code_on_printer", { name: _vm.printerName })) + " ")])], 2) : _vm._e()], 1) : _vm._e(), !_vm.compact && !_vm.locked && _vm.stations && _vm.stations.up ? _c("div", { staticClass: "hs__people", attrs: { "data-tid": "hotspot-devices" } }, [_vm.autoOffLine ? _c("p", { staticClass: "hs__autooff", attrs: { "data-tid": "hotspot-auto-off" } }, [_c(__unplugin_components_5, { attrs: { "name": "clock", "small": "" } }), _c("span", [_c("b", [_vm._v(_vm._s(_vm.autoOffLine))]), _vm._v(" when nobody is using it")])], 1) : _vm._e(), !_vm.hasClients ? _c("h3", { staticClass: "hs__empty", attrs: { "data-tid": "hotspot-devices-count" } }, [_vm._v(" " + _vm._s(_vm.deviceLine) + " ")]) : _c("ul", { staticClass: "hs__list", attrs: { "data-tid": "hotspot-clients" } }, [_vm._m(0), _vm._l(_vm.stations.clients, function(c, i) {
    return _c("li", { key: `${c.mac}-${i}`, staticClass: "hs__client", attrs: { "data-tid": "hotspot-client" } }, [_c("span", { staticClass: "hs__dev-ico" }, [_c(__unplugin_components_6, { attrs: { "name": c.name ? "phone" : "help" } })], 1), _c("span", { staticClass: "hs__name" }, [_c("b", { class: { "hs__unnamed": !c.name } }, [_vm._v(_vm._s(c.name || "Unnamed device"))]), c.you ? _c("span", { staticClass: "hs__you", attrs: { "data-tid": "hotspot-client-you" } }, [_vm._v("This device")]) : _vm._e()]), _c("span", { staticClass: "hs__cell hs__mono hs__ip", attrs: { "data-tid": "hotspot-client-ip" } }, [_vm._v(_vm._s(c.ip))]), _c("span", { staticClass: "hs__cell hs__mono hs__mac", attrs: { "data-tid": "hotspot-client-mac" } }, [_vm._v(_vm._s(c.mac))]), _c("span", { staticClass: "hs__cell hs__conn", attrs: { "data-tid": "hotspot-client-connected" } }, [_vm._v(_vm._s(c.connectedSeconds !== null ? `connected ${_vm.connectedFor(c.connectedSeconds)}` : ""))]), _c("span", { staticClass: "hs__cell hs__sig", attrs: { "data-tid": "hotspot-client-signal" } }, [c.signalDbm !== null ? _c("svg", { staticClass: "hs__bars", attrs: { "viewBox": "0 0 20 16", "aria-hidden": "true" } }, _vm._l(4, function(bar) {
      return _c("rect", { key: bar, class: { "hs__bar--on": bar <= _vm.dbmLevel(c.signalDbm) }, attrs: { "x": (bar - 1) * 5, "y": 16 - bar * 4, "width": "3.5", "height": bar * 4, "rx": "1" } });
    }), 0) : _vm._e(), c.signalDbm !== null ? _c("span", [_vm._v(_vm._s(c.signalDbm) + " dBm")]) : _vm._e()])]);
  })], 2)]) : _vm._e(), _c(__unplugin_components_7, { attrs: { "max-width": "420" }, model: { value: _vm.showToggleWarningDialog, callback: function($$v) {
    _vm.showToggleWarningDialog = $$v;
  }, expression: "showToggleWarningDialog" } }, [_c("div", { staticClass: "hs__dialog" }, [_c("h3", [_vm._v(_vm._s(_vm.$t("app.wifi.modal.warning.title")))]), _c("p", [_vm._v(_vm._s(_vm.$t("app.wifi.modal.warning.message")))]), _c("div", { staticClass: "hs__buttons hs__buttons--end" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "disabled": _vm.toggling || _vm.applying }, on: { "click": function($event) {
    _vm.showToggleWarningDialog = false;
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--danger", attrs: { "type": "button", "disabled": _vm.toggling || _vm.applying }, on: { "click": _vm.confirmToggle } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.Proceed")) + " ")])])])]), _c(__unplugin_components_8, { attrs: { "max-width": "420" }, model: { value: _vm.showChangeWarningDialog, callback: function($$v) {
    _vm.showChangeWarningDialog = $$v;
  }, expression: "showChangeWarningDialog" } }, [_c("div", { staticClass: "hs__dialog" }, [_c("h3", [_vm._v(_vm._s(_vm.$t("app.wifi.modal.warning.title")))]), _c("p", [_vm._v(_vm._s(_vm.$t("app.wifi.modal.warning.message")))]), _c("div", { staticClass: "hs__buttons hs__buttons--end" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "disabled": _vm.toggling || _vm.applying }, on: { "click": function($event) {
    _vm.showChangeWarningDialog = false;
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--danger", attrs: { "type": "button", "disabled": _vm.toggling || _vm.applying }, on: { "click": _vm.confirmApply } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.Proceed")) + " ")])])])])], 1);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("li", { staticClass: "hs__client hs__client--head", attrs: { "aria-hidden": "true" } }, [_c("span"), _c("span", [_vm._v("Device")]), _c("span", [_vm._v("IP")]), _c("span", [_vm._v("MAC")]), _c("span", [_vm._v("Connected")]), _c("span", [_vm._v("Signal")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/widgets/wifi/HotspotManagerCard.vue?vue&type=style&index=0&scoped=08937815&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "08937815",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/wifi/HotspotManagerCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtVQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBRUE7QUFxQ0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFLQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBRUE7QUFFQTtBQUFBLElBQ0E7QUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFHQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxJQUdBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBLFFBQ0Esa0NBQ0EsMkNBQ0Esd0NBQ0E7QUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSxXQUNBLHlDQUNBLCtEQUNBLDZCQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBR0E7QUFDQTtBQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0Esc0NBQ0EscUJBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUdBO0FBR0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsTUFFQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUVBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLGlCQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBR0E7QUFDQTtBQUFBLFFBQ0E7QUFHQTtBQUNBO0FBQUEsUUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBR0EsMkNBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQSxHQUVBO0FBQ0E7QUFDQSxtRkFDQTtBQUNBO0FBRUEsa0NBQ0EsNENBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUdBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBR0Esd0NBQ0EsVUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBOWRBO0FBQUE7QUFBQSxHQUZBLG1CQUVBO0FBa0JBO0FBQUEsRUFEQTtBQUFBLEdBbkJBLG1CQW9CQTtBQVlBO0FBQUEsRUFEQTtBQUFBLEdBL0JBLG1CQWdDQTtBQXVSQTtBQUFBLEVBREE7QUFBQSxHQXRUQSxtQkF1VEE7QUFLQTtBQUFBLEVBREE7QUFBQSxHQTNUQSxtQkE0VEE7QUErSEE7QUFBQSxFQURBO0FBQUEsR0ExYkEsbUJBMmJBO0FBcUJBO0FBQUEsRUFEQTtBQUFBLEdBL2NBLG1CQWdkQTtBQVFBO0FBQUEsRUFEQTtBQUFBLEdBdmRBLG1CQXdkQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBNWRBLG1CQTZkQTtBQTdkQTtBQUFBLEVBbkNBO0FBQUEsSUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBRUE7QUFDQTtBQUFBLFVBQ0E7QUFFQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFBQSxVQUNBO0FBRUE7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiSG90c3BvdE1hbmFnZXJDYXJkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJoc1wiXG4gICAgOmNsYXNzPVwieyAnaHMtLWNvbXBhY3QnOiBjb21wYWN0LCAnc3RpbGUgc3RpbGUtLTYgaHMtLXBhZ2UnOiAhY29tcGFjdCB9XCJcbiAgICBkYXRhLXRpZD1cImhvdHNwb3QtY2FyZFwiXG4gID5cbiAgICA8aGVhZGVyIGNsYXNzPVwiaHNfX2hlYWRcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoc19fdGl0bGVzXCI+XG4gICAgICAgIDxoMj5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgdi1pZj1cIiFjb21wYWN0XCJcbiAgICAgICAgICAgIG5hbWU9XCJib2x0XCJcbiAgICAgICAgICAgIGNsYXNzPVwiaHNfX2ljb1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgICBIb3RzcG90XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIHYtaWY9XCIhY29tcGFjdCAmJiAhbG9ja2VkICYmIHN0YXRpb25zICYmIHN0YXRpb25zLnVwXCJcbiAgICAgICAgICAgIGNsYXNzPVwiaHNfX2JhZGdlXCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ2hzX19iYWRnZS0temVybyc6IHN0YXRpb25zLmNvdW50ID09PSAwIH1cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWJhZGdlXCJcbiAgICAgICAgICA+PGkgLz57eyBzdGF0aW9ucy5jb3VudCB9fSBjb25uZWN0ZWQ8L3NwYW4+XG4gICAgICAgIDwvaDI+XG4gICAgICAgIDxwIHYtaWY9XCJjb21wYWN0ICYmIGRldmljZVN0YXR1cyAmJiBhcENyZWRlbnRpYWxzICYmICFsb2NrZWQgJiYgIXJlbW90ZVwiPlxuICAgICAgICAgIHt7IGFwU3RhdGUgPyAnT24nIDogJ09mZicgfX0gwrcge3sgYXBDcmVkZW50aWFscy5zc2lkIH19e3sgYXBDcmVkZW50aWFscy5zZWN1cml0eV9lbmFibGVkID09PSBmYWxzZSA/ICcgwrcgb3BlbicgOiAnJyB9fVxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cbiAgICAgIDx0b25lLXBpbGxcbiAgICAgICAgdi1pZj1cIiFjb21wYWN0ICYmIGRldmljZVN0YXR1cyAmJiBhcENyZWRlbnRpYWxzICYmICFsb2NrZWQgJiYgIXJlbW90ZVwiXG4gICAgICAgIDp0b25lPVwiYXBTdGF0ZSA/ICdvaycgOiAnb2ZmJ1wiXG4gICAgICAgIDpkb3Q9XCJhcFN0YXRlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LXN0YXRlXCJcbiAgICAgID5cbiAgICAgICAge3sgYXBTdGF0ZSA/ICdPbicgOiAnT2ZmJyB9fVxuICAgICAgPC90b25lLXBpbGw+XG4gICAgICA8c3BhblxuICAgICAgICB2LWlmPVwiIXJlbW90ZSAmJiBob3RzcG90T2ZmSXNQYW5lbE9ubHkgJiYgYXBTdGF0ZVwiXG4gICAgICAgIGNsYXNzPVwiaHNfX25vdGVcIlxuICAgICAgICBkYXRhLXRpZD1cImhvdHNwb3Qtb2ZmLXBhbmVsXCJcbiAgICAgID57eyBwYW5lbE9ubHlOb3RlIH19PC9zcGFuPlxuICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgdi1lbHNlLWlmPVwiIXJlbW90ZVwiXG4gICAgICAgIDp2YWx1ZT1cImFwU3RhdGVcIlxuICAgICAgICBsYWJlbD1cIkhvdHNwb3Qgb25cIlxuICAgICAgICA6ZGlzYWJsZWQ9XCJsb2NrZWQgfHwgIWFwQ3JlZGVudGlhbHMgfHwgIWRldmljZVN0YXR1cyB8fCB0b2dnbGluZ1wiXG4gICAgICAgIGRhdGEtdGlkPVwiaG90c3BvdC1zd2l0Y2hcIlxuICAgICAgICBAaW5wdXQ9XCJyZXF1ZXN0VG9nZ2xlKClcIlxuICAgICAgLz5cbiAgICA8L2hlYWRlcj5cblxuICAgIDxwXG4gICAgICB2LWlmPVwiIWNvbXBhY3QgJiYgIWxvY2tlZCAmJiAhcmVtb3RlXCJcbiAgICAgIGNsYXNzPVwiaHNfX25vdGVcIlxuICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWhlbHBcIlxuICAgID5cbiAgICAgIEEgbmV0d29yayB0aGUgcHJpbnRlciBtYWtlcyBpdHNlbGYsIGZvciB3aGVuIHRoZXJlIGlzIG5vIFdpLUZpLiBUdXJuaW5nIGl0IG9uIGRyb3BzIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24uXG4gICAgPC9wPlxuXG4gICAgPHByb3RlY3RlZC1ub3RpY2UgLz5cbiAgICA8cGVybWlzc2lvbi1yZWZ1c2FsLW5vdGljZVxuICAgICAgOnJlZnVzYWw9XCJyZWZ1c2FsXCJcbiAgICAgIEBkaXNtaXNzPVwicmVmdXNhbCA9IG51bGxcIlxuICAgIC8+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJyZW1vdGVcIlxuICAgICAgY2xhc3M9XCJoc19fbm90ZVwiXG4gICAgPlxuICAgICAge3sgJHQoJ2FwcC53aWZpLnJlbW90ZV9yZWFkX29ubHknKSB9fVxuICAgIDwvcD5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCIhbG9ja2VkICYmICFyZW1vdGUgJiYgIWNvbXBhY3RcIlxuICAgICAgY2xhc3M9XCJoc19fYm9keVwiXG4gICAgICBkYXRhLXRpZD1cImhvdHNwb3QtYm9keVwiXG4gICAgPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIiFhcENyZWRlbnRpYWxzXCJcbiAgICAgICAgY2xhc3M9XCJoc19fbm90ZVwiXG4gICAgICA+XG4gICAgICAgIFJlYWRpbmcgdGhlIGhvdHNwb3QncyBzZXR0aW5nc+KAplxuICAgICAgPC9wPlxuICAgICAgPHYtZm9ybVxuICAgICAgICB2LWVsc2VcbiAgICAgICAgcmVmPVwiYXBGb3JtXCJcbiAgICAgICAgdi1tb2RlbD1cImZvcm1Jc1ZhbGlkXCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWVkaXRpbmcgfHwgYXBwbHlpbmdcIlxuICAgICAgICBsYXp5LXZhbGlkYXRpb25cbiAgICAgICAgY2xhc3M9XCJoc19fZm9ybVwiXG4gICAgICAgIEBzdWJtaXQucHJldmVudD1cInJlcXVlc3RBcHBseUNoYW5nZXNcIlxuICAgICAgPlxuICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgdi1tb2RlbD1cImZvcm0uc3NpZFwiXG4gICAgICAgICAgbGFiZWw9XCJOYW1lIChTU0lEKVwiXG4gICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICBkZW5zZVxuICAgICAgICAgIGhpZGUtZGV0YWlscz1cImF1dG9cIlxuICAgICAgICAgIDpydWxlcz1cInNzaWRSdWxlc1wiXG4gICAgICAgIC8+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJoc19fcm93XCI+XG4gICAgICAgICAgPHNwYW4+TmVlZHMgYSBwYXNzd29yZDwvc3Bhbj5cbiAgICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgICAgOnZhbHVlPVwiZm9ybS5zZWN1cml0eUVuYWJsZWRcIlxuICAgICAgICAgICAgbGFiZWw9XCJOZWVkcyBhIHBhc3N3b3JkXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFlZGl0aW5nIHx8IGFwcGx5aW5nXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiaG90c3BvdC1zZWN1cmVkXCJcbiAgICAgICAgICAgIEBpbnB1dD1cImZvcm0uc2VjdXJpdHlFbmFibGVkID0gJGV2ZW50XCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgIHJlZj1cInBhc3N3b3JkSW5wdXRcIlxuICAgICAgICAgIHYtbW9kZWw9XCJmb3JtLnBhc3N3b3JkXCJcbiAgICAgICAgICA6bGFiZWw9XCIkdCgnYXBwLmdlbmVyYWwubGFiZWwucGFzc3dvcmQnKVwiXG4gICAgICAgICAgOnR5cGU9XCJwYXNzd29yZFZpc2libGUgPyAndGV4dCcgOiAncGFzc3dvcmQnXCJcbiAgICAgICAgICA6YXBwZW5kLWljb249XCJwYXNzd29yZFZpc2libGUgPyAnJGV5ZU9mZicgOiAnJGV5ZSdcIlxuICAgICAgICAgIDpydWxlcz1cInBhc3N3b3JkUnVsZXNcIlxuICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgZGVuc2VcbiAgICAgICAgICBoaWRlLWRldGFpbHM9XCJhdXRvXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhZm9ybS5zZWN1cml0eUVuYWJsZWQgfHwgIWVkaXRpbmcgfHwgYXBwbHlpbmdcIlxuICAgICAgICAgIEBjbGljazphcHBlbmQuc3RvcD1cInBhc3N3b3JkVmlzaWJsZSA9ICFwYXNzd29yZFZpc2libGVcIlxuICAgICAgICAvPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaHNfX2J1dHRvbnNcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWlmPVwiIWVkaXRpbmdcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwidG9nZ2xpbmcgfHwgYXBwbHlpbmdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWVkaXRcIlxuICAgICAgICAgICAgQGNsaWNrPVwidG9nZ2xlRWRpdGluZ1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQ2hhbmdlIHRoZSBuYW1lIG9yIHBhc3N3b3JkXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgICAgOmRpc2FibGVkPVwiIWlzRGlydHkgfHwgIWZvcm1Jc1ZhbGlkIHx8IGFwcGx5aW5nXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWFwcGx5XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3sgJHQoJ2FwcC53aWZpLmNoYW5nZScpIH19XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cImFwcGx5aW5nXCJcbiAgICAgICAgICAgICAgQGNsaWNrLnN0b3A9XCJ1bmRvQ2hhbmdlc1wiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt7IGlzRGlydHkgPyAnVW5kbycgOiAnQmFjaycgfX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC92LWZvcm0+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cImFwQ3JlZGVudGlhbHMgJiYgYXBTdGF0ZSAmJiAhZWRpdGluZ1wiXG4gICAgICAgIGNsYXNzPVwiaHNfX2pvaW5cIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgdi1pZj1cIlFyVmFsdWVcIj5cbiAgICAgICAgICA8cXJjb2RlLXZ1ZVxuICAgICAgICAgICAgY2xhc3M9XCJoc19fcXJcIlxuICAgICAgICAgICAgOnZhbHVlPVwiUXJWYWx1ZVwiXG4gICAgICAgICAgICA6c2l6ZT1cIjEyMFwiXG4gICAgICAgICAgICByZW5kZXItYXM9XCJzdmdcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHA+U2NhbiB0byBqb2luIHRoZSBob3RzcG90LjwvcD5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPHAgdi1lbHNlPlxuICAgICAgICAgIHt7ICR0KCdhcHAud2lmaS5ob3RzcG90X2NvZGVfb25fcHJpbnRlcicsIHsgbmFtZTogcHJpbnRlck5hbWUgfSkgfX1cbiAgICAgICAgPC9wPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiIWNvbXBhY3QgJiYgIWxvY2tlZCAmJiBzdGF0aW9ucyAmJiBzdGF0aW9ucy51cFwiXG4gICAgICBjbGFzcz1cImhzX19wZW9wbGVcIlxuICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWRldmljZXNcIlxuICAgID5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJhdXRvT2ZmTGluZVwiXG4gICAgICAgIGNsYXNzPVwiaHNfX2F1dG9vZmZcIlxuICAgICAgICBkYXRhLXRpZD1cImhvdHNwb3QtYXV0by1vZmZcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJjbG9ja1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgPHNwYW4+PGI+e3sgYXV0b09mZkxpbmUgfX08L2I+IHdoZW4gbm9ib2R5IGlzIHVzaW5nIGl0PC9zcGFuPlxuICAgICAgPC9wPlxuICAgICAgPGgzXG4gICAgICAgIHYtaWY9XCIhaGFzQ2xpZW50c1wiXG4gICAgICAgIGNsYXNzPVwiaHNfX2VtcHR5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWRldmljZXMtY291bnRcIlxuICAgICAgPlxuICAgICAgICB7eyBkZXZpY2VMaW5lIH19XG4gICAgICA8L2gzPlxuICAgICAgPHVsXG4gICAgICAgIHYtZWxzZVxuICAgICAgICBjbGFzcz1cImhzX19saXN0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWNsaWVudHNcIlxuICAgICAgPlxuICAgICAgICA8bGlcbiAgICAgICAgICBjbGFzcz1cImhzX19jbGllbnQgaHNfX2NsaWVudC0taGVhZFwiXG4gICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuIC8+XG4gICAgICAgICAgPHNwYW4+RGV2aWNlPC9zcGFuPlxuICAgICAgICAgIDxzcGFuPklQPC9zcGFuPlxuICAgICAgICAgIDxzcGFuPk1BQzwvc3Bhbj5cbiAgICAgICAgICA8c3Bhbj5Db25uZWN0ZWQ8L3NwYW4+XG4gICAgICAgICAgPHNwYW4+U2lnbmFsPC9zcGFuPlxuICAgICAgICA8L2xpPlxuICAgICAgICA8bGlcbiAgICAgICAgICB2LWZvcj1cIihjLCBpKSBpbiBzdGF0aW9ucy5jbGllbnRzXCJcbiAgICAgICAgICA6a2V5PVwiYCR7Yy5tYWN9LSR7aX1gXCJcbiAgICAgICAgICBjbGFzcz1cImhzX19jbGllbnRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiaG90c3BvdC1jbGllbnRcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJoc19fZGV2LWljb1wiPjxmcmFtZS1pY29uIDpuYW1lPVwiYy5uYW1lID8gJ3Bob25lJyA6ICdoZWxwJ1wiIC8+PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaHNfX25hbWVcIj5cbiAgICAgICAgICAgIDxiIDpjbGFzcz1cInsgJ2hzX191bm5hbWVkJzogIWMubmFtZSB9XCI+e3sgYy5uYW1lIHx8ICdVbm5hbWVkIGRldmljZScgfX08L2I+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwiYy55b3VcIlxuICAgICAgICAgICAgICBjbGFzcz1cImhzX195b3VcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImhvdHNwb3QtY2xpZW50LXlvdVwiXG4gICAgICAgICAgICA+VGhpcyBkZXZpY2U8L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzcz1cImhzX19jZWxsIGhzX19tb25vIGhzX19pcFwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImhvdHNwb3QtY2xpZW50LWlwXCJcbiAgICAgICAgICA+e3sgYy5pcCB9fTwvc3Bhbj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJoc19fY2VsbCBoc19fbW9ubyBoc19fbWFjXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiaG90c3BvdC1jbGllbnQtbWFjXCJcbiAgICAgICAgICA+e3sgYy5tYWMgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGNsYXNzPVwiaHNfX2NlbGwgaHNfX2Nvbm5cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWNsaWVudC1jb25uZWN0ZWRcIlxuICAgICAgICAgID57eyBjLmNvbm5lY3RlZFNlY29uZHMgIT09IG51bGwgPyBgY29ubmVjdGVkICR7Y29ubmVjdGVkRm9yKGMuY29ubmVjdGVkU2Vjb25kcyl9YCA6ICcnIH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzcz1cImhzX19jZWxsIGhzX19zaWdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJob3RzcG90LWNsaWVudC1zaWduYWxcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgdi1pZj1cImMuc2lnbmFsRGJtICE9PSBudWxsXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJoc19fYmFyc1wiXG4gICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjAgMTZcIlxuICAgICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8cmVjdFxuICAgICAgICAgICAgICAgIHYtZm9yPVwiYmFyIGluIDRcIlxuICAgICAgICAgICAgICAgIDprZXk9XCJiYXJcIlxuICAgICAgICAgICAgICAgIDp4PVwiKGJhciAtIDEpICogNVwiXG4gICAgICAgICAgICAgICAgOnk9XCIxNiAtIGJhciAqIDRcIlxuICAgICAgICAgICAgICAgIHdpZHRoPVwiMy41XCJcbiAgICAgICAgICAgICAgICA6aGVpZ2h0PVwiYmFyICogNFwiXG4gICAgICAgICAgICAgICAgcng9XCIxXCJcbiAgICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdoc19fYmFyLS1vbic6IGJhciA8PSBkYm1MZXZlbChjLnNpZ25hbERibSkgfVwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIDxzcGFuIHYtaWY9XCJjLnNpZ25hbERibSAhPT0gbnVsbFwiPnt7IGMuc2lnbmFsRGJtIH19IGRCbTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvbGk+XG4gICAgICA8L3VsPlxuICAgIDwvZGl2PlxuXG4gICAgPHYtZGlhbG9nXG4gICAgICB2LW1vZGVsPVwic2hvd1RvZ2dsZVdhcm5pbmdEaWFsb2dcIlxuICAgICAgbWF4LXdpZHRoPVwiNDIwXCJcbiAgICA+XG4gICAgICA8ZGl2IGNsYXNzPVwiaHNfX2RpYWxvZ1wiPlxuICAgICAgICA8aDM+e3sgJHQoJ2FwcC53aWZpLm1vZGFsLndhcm5pbmcudGl0bGUnKSB9fTwvaDM+XG4gICAgICAgIDxwPnt7ICR0KCdhcHAud2lmaS5tb2RhbC53YXJuaW5nLm1lc3NhZ2UnKSB9fTwvcD5cbiAgICAgICAgPGRpdiBjbGFzcz1cImhzX19idXR0b25zIGhzX19idXR0b25zLS1lbmRcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJ0b2dnbGluZyB8fCBhcHBseWluZ1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJzaG93VG9nZ2xlV2FybmluZ0RpYWxvZyA9IGZhbHNlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyAkdCgnYXBwLmdlbmVyYWwuYnRuLmNhbmNlbCcpIH19XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZGFuZ2VyXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInRvZ2dsaW5nIHx8IGFwcGx5aW5nXCJcbiAgICAgICAgICAgIEBjbGljaz1cImNvbmZpcm1Ub2dnbGVcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uUHJvY2VlZCcpIH19XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC92LWRpYWxvZz5cbiAgICA8di1kaWFsb2dcbiAgICAgIHYtbW9kZWw9XCJzaG93Q2hhbmdlV2FybmluZ0RpYWxvZ1wiXG4gICAgICBtYXgtd2lkdGg9XCI0MjBcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJoc19fZGlhbG9nXCI+XG4gICAgICAgIDxoMz57eyAkdCgnYXBwLndpZmkubW9kYWwud2FybmluZy50aXRsZScpIH19PC9oMz5cbiAgICAgICAgPHA+e3sgJHQoJ2FwcC53aWZpLm1vZGFsLndhcm5pbmcubWVzc2FnZScpIH19PC9wPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaHNfX2J1dHRvbnMgaHNfX2J1dHRvbnMtLWVuZFwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInRvZ2dsaW5nIHx8IGFwcGx5aW5nXCJcbiAgICAgICAgICAgIEBjbGljaz1cInNob3dDaGFuZ2VXYXJuaW5nRGlhbG9nID0gZmFsc2VcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uY2FuY2VsJykgfX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1kYW5nZXJcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwidG9nZ2xpbmcgfHwgYXBwbHlpbmdcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY29uZmlybUFwcGx5XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyAkdCgnYXBwLmdlbmVyYWwuYnRuLlByb2NlZWQnKSB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvdi1kaWFsb2c+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBWdWUsIENvbXBvbmVudCwgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgdXNlQXV4QXBpIH0gZnJvbSAnQC9hdXhfYXBpL3VzZUF1eEFwaSdcbmltcG9ydCB7IFBBTkVMX09OTFlfTk9URSwgY2xhc3NpZnlSZWZ1c2FsLCBmYWxsc0JhY2ssIGhvdHNwb3RDaGFuZ2VCb2R5LCBpc1BhbmVsT25seVJlZnVzYWwsIHBhbmVsT25seU1lc3NhZ2UsIHJlZnVzZWRIZXJlLCByb3V0ZUZvciB9IGZyb20gJ0Avc2VydmljZXMvd2lmaS9wYW5lbC1vbmx5J1xuaW1wb3J0IHR5cGUgeyBSZWZ1c2FsS2luZCB9IGZyb20gJ0Avc2VydmljZXMvd2lmaS9wYW5lbC1vbmx5J1xuaW1wb3J0IFBlcm1pc3Npb25SZWZ1c2FsTm90aWNlIGZyb20gJy4vUGVybWlzc2lvblJlZnVzYWxOb3RpY2UudnVlJ1xuaW1wb3J0IHR5cGUgeyBBUENyZWRlbnRpYWxzLCBEZXZpY2UgfSBmcm9tICdAL2F1eF9hcGknXG5pbXBvcnQgUXJjb2RlVnVlIGZyb20gJ3FyY29kZS52dWUnXG5pbXBvcnQgVG9nZ2xlU3dpdGNoIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1RvZ2dsZVN3aXRjaC52dWUnXG5pbXBvcnQgVG9uZVBpbGwgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL1RvbmVQaWxsLnZ1ZSdcbmltcG9ydCBpMThuIGZyb20gJ0AvcGx1Z2lucy9pMThuJ1xuaW1wb3J0IHsgdXNlSG90c3BvdENoZWNrIH0gZnJvbSAnQC9hdXhfYXBpL3VzZUhvdHNwb3RDaGVjaydcbmltcG9ydCB0eXBlIHsgVkZvcm0gfSBmcm9tICdAL3R5cGVzJ1xuaW1wb3J0IHsgRXZlbnRCdXMgfSBmcm9tICdAL2V2ZW50QnVzJ1xuaW1wb3J0IHsgbW9vbnJha2VyRXJyb3JNZXNzYWdlIH0gZnJvbSAnQC9zdG9yZS9wcm90ZWN0aW9uL2hlbHBlcnMnXG5pbXBvcnQgeyBwcmludGVyVHJhbnNwb3J0QmluZGluZyB9IGZyb20gJ0Avc2VydmljZXMvbWFuYWdlZC1zZXNzaW9uL2h0dHBUcmFuc3BvcnRCaW5kaW5nJ1xuaW1wb3J0IHsgYXV0b09mZkluLCBjb25uZWN0ZWRGb3IsIGRibUxldmVsLCBob3RzcG90U3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL2hvdHNwb3QvbW9kZWwnXG5pbXBvcnQgdHlwZSB7IEhvdHNwb3RTdGF0aW9ucyB9IGZyb20gJ0Avc2VydmljZXMvaG90c3BvdC9tb2RlbCdcbmltcG9ydCB7IHN0YXJ0SG90c3BvdFBvbGwgfSBmcm9tICdAL3NlcnZpY2VzL2hvdHNwb3QvcG9sbGVyJ1xuXG5jb25zdCB7IG9uSG90c3BvdCB9ID0gdXNlSG90c3BvdENoZWNrKClcblxuQENvbXBvbmVudCh7XG4gIGRpcmVjdGl2ZXM6IHtcbiAgICBzcXVhcmU6IHtcbiAgICAgIGluc2VydGVkIChlbDogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgLy8gbWVhc3VyZSDihpIgYXBwbHlcbiAgICAgICAgY29uc3QgdXBkYXRlID0gKCkgPT4ge1xuICAgICAgICAgIGVsLnN0eWxlLndpZHRoID0gZWwub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xuICAgICAgICB9XG4gICAgICAgIC8vIHJ1biBvbmNlXG4gICAgICAgIHVwZGF0ZSgpXG4gICAgICAgIC8vIG9uIHdpbmRvdyByZXNpemVcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZSlcbiAgICAgICAgLy8gb24gcGFyZW50LWNvbnRlbnQgcmVzaXplIChlLmcuIHJpZ2h0IGNhcmQgY2hhbmdlcyBoZWlnaHQpXG4gICAgICAgIGlmICgnUmVzaXplT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuICAgICAgICAgIGNvbnN0IHJvID0gbmV3IFJlc2l6ZU9ic2VydmVyKHVwZGF0ZSlcbiAgICAgICAgICByby5vYnNlcnZlKGVsLnBhcmVudEVsZW1lbnQhKVxuICAgICAgICAgIC8vIHN0YXNoIHNvIHdlIGNhbiBkaXNjb25uZWN0IGxhdGVyXG4gICAgICAgICAgOyAoZWwgYXMgYW55KS5fX3JvX18gPSByb1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0YXNoIHRoZSBsaXN0ZW5lciBzbyB3ZSBjYW4gY2xlYW4gdXBcbiAgICAgICAgKGVsIGFzIGFueSkuX19zcV9fID0gdXBkYXRlXG4gICAgICB9LFxuICAgICAgdW5iaW5kIChlbDogYW55KSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBlbC5fX3NxX18pXG4gICAgICAgIGlmIChlbC5fX3JvX18pIGVsLl9fcm9fXy5kaXNjb25uZWN0KClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGNvbXBvbmVudHM6IHtcbiAgICBRcmNvZGVWdWUsXG4gICAgVG9nZ2xlU3dpdGNoLFxuICAgIFRvbmVQaWxsLFxuICAgIFBlcm1pc3Npb25SZWZ1c2FsTm90aWNlXG4gIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIb3RzcG90TWFuYWdlckNhcmQgZXh0ZW5kcyBWdWUge1xuICAvKiogVGhlIHJhaWwncyBxdWljayBtZW51OiBvbiBvciBvZmYgYW5kIGl0cyBuYW1lLCB3aXRob3V0IHRoZSBmb3JtLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgY29tcGFjdD86IGJvb2xlYW5cblxuICBmb3JtSXNWYWxpZDogYm9vbGVhbiA9IGZhbHNlXG5cbiAgZ2V0IG9uSG90c3BvdCAoKSB7XG4gICAgcmV0dXJuIG9uSG90c3BvdC52YWx1ZVxuICB9XG5cbiAgLy8gTXVvbk9TIG5ldHdvcmsgcHJvdGVjdGlvbiBpcyBvbiBhbmQgdGhpcyBicm93c2VyIGhhcyBubyBpZGVudGl0eSwgc29cbiAgLy8gZXZlcnkgaG90c3BvdCByZXF1ZXN0IHdvdWxkIGJlIHJlZnVzZWQuIFRoZSBub3RpY2Ugc2F5cyBzbyBpbnN0ZWFkLCBhbmRcbiAgLy8gcG9sbGluZyB3YWl0cyB1bnRpbCB0aGF0IGNoYW5nZXMuXG4gIGdldCBsb2NrZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcm90ZWN0aW9uL2lzTG9ja2VkJ11cbiAgfVxuXG4gIC8vIFByb3RlY3Rpb24gY2FtZSBvZmYgd2hpbGUgdGhpcyBjYXJkIHdhcyBvcGVuLiBUaGUgY29uZmlnIGl0IHNraXBwZWRcbiAgLy8gd2hpbGUgbG9ja2VkIGlzIGxvYWRlZCBub3c7IHRoZSBzdGF0dXMgcG9sbCBvbmx5IGV2ZXIgcmVhZHMgdGhlIHN0YXRlLlxuICBAV2F0Y2goJ2xvY2tlZCcpXG4gIG9uTG9ja2VkQ2hhbmdlZCAobG9ja2VkOiBib29sZWFuKSB7XG4gICAgaWYgKCFsb2NrZWQpIHRoaXMuZmV0Y2hDb25maWcoKVxuICB9XG5cbiAgLy8gUmVhY2hlZCBvdmVyIElyb2g6IG11b24tbGluayByZWZ1c2VzIGV2ZXJ5IEF1eCByZXF1ZXN0IHRoZXJlLCByZWFkc1xuICAvLyBpbmNsdWRlZCwgYW5kIHRoZSBvd25lciBkZWNpZGVkIHJlbW90ZSBjYWxsZXJzIG1heSBub3QgY2hhbmdlIFdpLUZpXG4gIC8vIChzZXR1cCBzcGVjIDA3IMKnMykuIFRoZSBjYXJkIG1ha2VzIG5vIGNhbGwgYW5kIHNheXMgc28gaW5zdGVhZC5cbiAgZ2V0IHJlbW90ZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHByaW50ZXJUcmFuc3BvcnRCaW5kaW5nLnJlbW90ZVxuICB9XG5cbiAgQFdhdGNoKCdyZW1vdGUnKVxuICBvblJlbW90ZUNoYW5nZWQgKHJlbW90ZTogYm9vbGVhbikge1xuICAgIGlmICghcmVtb3RlKSB0aGlzLmZldGNoQ29uZmlnKClcbiAgfVxuXG4gIHNob3dUb2dnbGVXYXJuaW5nRGlhbG9nOiBib29sZWFuID0gZmFsc2VcbiAgc2hvd0NoYW5nZVdhcm5pbmdEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZVxuXG4gIC8vIOKAnFJlcXVlc3TigJ0gbWV0aG9kcyBzaG93IHRoZSB3YXJuaW5nIGRpYWxvZyBpbnN0ZWFkIG9mIGltbWVkaWF0ZWx5IGRvaW5nIHRoZSB0aGluZ1xuICByZXF1ZXN0VG9nZ2xlICgpIHtcbiAgICBpZiAob25Ib3RzcG90LnZhbHVlKSB7XG4gICAgICB0aGlzLnNob3dUb2dnbGVXYXJuaW5nRGlhbG9nID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBub3Qgb24gaG90c3BvdCwganVzdCB0b2dnbGUgaW1tZWRpYXRlbHlcbiAgICAgIHRoaXMuY29uZmlybVRvZ2dsZSgpXG4gICAgfVxuICB9XG5cbiAgLy8g4oCcQ29uZmlybeKAnSBtZXRob2RzIHBlcmZvcm0gdGhlIHJlYWwgYWN0aW9uLCB0aGVuIGhpZGUgdGhlIGRpYWxvZ1xuICBhc3luYyBjb25maXJtVG9nZ2xlICgpIHtcbiAgICB0aGlzLnNob3dUb2dnbGVXYXJuaW5nRGlhbG9nID0gZmFsc2VcbiAgICBhd2FpdCB0aGlzLmNoYW5nZUhvdHNwb3RTdGF0ZSghdGhpcy5hcFN0YXRlKVxuICB9XG5cbiAgYXN5bmMgcmVxdWVzdEFwcGx5Q2hhbmdlcyAoKSB7XG4gICAgLy8gdHJpZ2dlciBWdWV0aWZ54oCZcyB2YWxpZGF0aW9uIFVJXG4gICAgY29uc3QgZm9ybSA9IHRoaXMuJHJlZnMuYXBGb3JtIGFzIFZGb3JtXG4gICAgaWYgKCFmb3JtIHx8ICEoZm9ybS52YWxpZGF0ZSgpICYmIHRoaXMuaXNEaXJ0eSkpIHJldHVyblxuXG4gICAgaWYgKG9uSG90c3BvdC52YWx1ZSkge1xuICAgICAgLy8gaWYgd2UgYXJlIG9uIGhvdHNwb3QsIHNob3cgdGhlIHdhcm5pbmcgZGlhbG9nXG4gICAgICB0aGlzLnNob3dDaGFuZ2VXYXJuaW5nRGlhbG9nID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBub3Qgb24gaG90c3BvdCwgYXBwbHkgY2hhbmdlcyBpbW1lZGlhdGVseVxuICAgICAgYXdhaXQgdGhpcy5jb25maXJtQXBwbHkoKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNvbmZpcm1BcHBseSAoKSB7XG4gICAgdGhpcy5zaG93Q2hhbmdlV2FybmluZ0RpYWxvZyA9IGZhbHNlXG4gICAgYXdhaXQgdGhpcy5hcHBseUNoYW5nZXMoKVxuICB9XG5cbiAgcHJpdmF0ZSBhdXhBcGkgPSB1c2VBdXhBcGkoKVxuXG4gIGRldmljZVN0YXR1czogRGV2aWNlIHwgbnVsbCA9IG51bGxcbiAgYXBDcmVkZW50aWFsczogQVBDcmVkZW50aWFscyB8IG51bGwgPSBudWxsXG5cbiAgZWRpdGluZyA9IGZhbHNlXG4gIGFwcGx5aW5nID0gZmFsc2VcblxuICAvKiogVGhlIHByaW50ZXIncyBwZXJtaXNzaW9uIHN0b3JlIHJlZnVzZWQgdGhlIGxhc3QgYWN0aW9uIChLQU4tMjQ1Nyk6IHdobyBtYXkgZG8gaXQsIG5vdCBhIHBhbmVsLW9ubHkgcHJpbnRlci4gKi9cbiAgcmVmdXNhbDogRXh0cmFjdDxSZWZ1c2FsS2luZCwgeyBraW5kOiAncGVybWlzc2lvbicgfT4gfCBudWxsID0gbnVsbFxuXG4gIHByaXZhdGUgdGFrZVBlcm1pc3Npb25SZWZ1c2FsIChlcnI6IHVua25vd24pOiBib29sZWFuIHtcbiAgICBjb25zdCByID0gY2xhc3NpZnlSZWZ1c2FsKGVycilcbiAgICBpZiAoci5raW5kICE9PSAncGVybWlzc2lvbicpIHJldHVybiBmYWxzZVxuICAgIHRoaXMucmVmdXNhbCA9IHJcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgdG9nZ2xlRWRpdGluZyAoKSB7XG4gICAgdGhpcy5lZGl0aW5nID0gIXRoaXMuZWRpdGluZ1xuICAgIHRoaXMucmVzZXRGb3JtKClcbiAgfVxuXG4gIG9wZW46IGJvb2xlYW4gPSBmYWxzZVxuXG4gIC8vIGxvY2FsIGZvcm0gKyBwcmlzdGluZSBjb3B5XG4gIGZvcm0gPSB7XG4gICAgc3NpZDogJycsXG4gICAgcGFzc3dvcmQ6ICcnLFxuICAgIHNlY3VyaXR5RW5hYmxlZDogdHJ1ZVxuICB9XG5cbiAgcHJpdmF0ZSBvcmlnaW5hbCA9IHsgLi4udGhpcy5mb3JtIH1cblxuICBwYXNzd29yZFZpc2libGUgPSBmYWxzZVxuICBwcml2YXRlIHN0YXR1c1BvbGxJZDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSBkZXN0cm95ZWQgPSBmYWxzZVxuICBwcml2YXRlIHJlcXVlc3RlZEFwU3RhdGU6IGJvb2xlYW4gfCBudWxsID0gbnVsbFxuICBwcml2YXRlIHJlcXVlc3RlZEFwU3RhdGVVbnRpbCA9IDBcblxuICBwcml2YXRlIHN0b3BIb3RzcG90UG9sbDogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcblxuICAvKiogV2hvIGlzIG9uIHRoZSBob3RzcG90LCBmcm9tIHRoZSBzaGFyZWQgcG9sbCAoS0FOLTQyOTcpLiAqL1xuICBnZXQgc3RhdGlvbnMgKCk6IEhvdHNwb3RTdGF0aW9ucyB8IG51bGwge1xuICAgIHJldHVybiBob3RzcG90U3RhdGUuc3RhdGlvbnNcbiAgfVxuXG4gIGdldCBkZXZpY2VMaW5lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG4gPSB0aGlzLnN0YXRpb25zPy5jb3VudCA/PyAwXG4gICAgcmV0dXJuIG4gPT09IDAgPyAnTm8gZGV2aWNlcyBjb25uZWN0ZWQnIDogYCR7bn0gJHtuID09PSAxID8gJ2RldmljZScgOiAnZGV2aWNlcyd9IGNvbm5lY3RlZGBcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlciBzZW50IHRoZSBsaXN0IChhIHByaW50ZXIgdGhhdCBwcmVkYXRlcyBpdCBzZW5kcyB0aGUgY291bnQgb25seSkuICovXG4gIGdldCBoYXNDbGllbnRzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLnN0YXRpb25zPy5jbGllbnRzPy5sZW5ndGhcbiAgfVxuXG4gIGdldCBhdXRvT2ZmTGluZSAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIGF1dG9PZmZJbih0aGlzLnN0YXRpb25zPy5hdXRvT2ZmQXQgPz8gbnVsbClcbiAgfVxuXG4gIGNvbm5lY3RlZEZvciAoc2Vjb25kczogbnVtYmVyIHwgbnVsbCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNvbm5lY3RlZEZvcihzZWNvbmRzKVxuICB9XG5cbiAgZGJtTGV2ZWwgKGRibTogbnVtYmVyIHwgbnVsbCk6IG51bWJlciB7XG4gICAgcmV0dXJuIGRibUxldmVsKGRibSlcbiAgfVxuXG4gIGFzeW5jIG1vdW50ZWQgKCkge1xuICAgIHRoaXMuc3RvcEhvdHNwb3RQb2xsID0gc3RhcnRIb3RzcG90UG9sbCgpXG4gICAgYXdhaXQgdGhpcy5mZXRjaENvbmZpZygpXG4gICAgaWYgKCF0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgdGhpcy5zdGF0dXNQb2xsSWQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlZnJlc2hTdGF0dXMoKVxuICAgICAgfSwgMTAwMClcbiAgICB9XG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWVcbiAgICB0aGlzLnN0b3BIb3RzcG90UG9sbD8uKClcbiAgICB0aGlzLnN0b3BIb3RzcG90UG9sbCA9IG51bGxcbiAgICBpZiAodGhpcy5zdGF0dXNQb2xsSWQgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuc3RhdHVzUG9sbElkKVxuICAgICAgdGhpcy5zdGF0dXNQb2xsSWQgPSBudWxsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaENvbmZpZyAoKSB7XG4gICAgaWYgKHRoaXMubG9ja2VkIHx8IHRoaXMucmVtb3RlKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgY29uc3QgW3N0YXR1c1Jlc3BvbnNlLCBjcmVkZW50aWFsc1Jlc3BvbnNlXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgdGhpcy5hdXhBcGkuYXAud2lmaVN0YXR1c1dpZmlBcERldmljZVN0YXR1c0dldCgpLFxuICAgICAgICB0aGlzLmF1eEFwaS5hcC5hcFNob3dDcmVkZW50aWFsc1dpZmlBcFNob3dHZXQoKVxuICAgICAgXSlcbiAgICAgIHRoaXMuYXBwbHlEZXZpY2VTdGF0dXMoc3RhdHVzUmVzcG9uc2UuZGF0YSlcbiAgICAgIHRoaXMuYXBDcmVkZW50aWFscyA9IGNyZWRlbnRpYWxzUmVzcG9uc2UuZGF0YVxuICAgICAgdGhpcy5yZXNldEZvcm0oKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGhvdHNwb3QgY29uZmlnJywgZSlcbiAgICAgIGlmICgoZSBhcyBhbnkpPy5yZXNwb25zZT8uc3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgLy8gQSBsb2FkIG5vYm9keSBhc2tlZCBmb3IsIHJlZnVzZWQgYnkgbmV0d29yayBwcm90ZWN0aW9uLiBUaGUgY2FyZFxuICAgICAgICAvLyBzYXlzIHNvIG9uY2UgdGhlIGxldmVsIGFycml2ZXM7IGEgdG9hc3Qgd291bGQgb25seSByZXBlYXQgaXQuXG4gICAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdwcm90ZWN0aW9uL29uUmVmdXNlZCcpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBFdmVudEJ1cy4kZW1pdChgJHt0aGlzLiR0KCdhcHAud2lmaS5tc2cuaG90c3BvdC5sb2FkX2Vycm9yJyl9ICR7bW9vbnJha2VyRXJyb3JNZXNzYWdlKGUpfWAsIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogNTAwMCB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaFN0YXR1cyAoKSB7XG4gICAgaWYgKHRoaXMubG9ja2VkIHx8IHRoaXMucmVtb3RlKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmF1eEFwaS5hcC53aWZpU3RhdHVzV2lmaUFwRGV2aWNlU3RhdHVzR2V0KClcbiAgICAgIHRoaXMuYXBwbHlEZXZpY2VTdGF0dXMocmVzcG9uc2UuZGF0YSlcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAvLyBEcm9wcGluZyB0aGUgaG90c3BvdCBjYW4gYnJpZWZseSBkcm9wIEZsdWlkZCdzIHJlcXVlc3QgdHJhbnNwb3J0IHRvby5cbiAgICAgIC8vIEEgbGF0ZXIgcG9sbCByZWNvbmNpbGVzIHdoZW4gdGhlIHByaW50ZXIgaXMgcmVhY2hhYmxlIGFnYWluLlxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlEZXZpY2VTdGF0dXMgKHN0YXR1czogRGV2aWNlKSB7XG4gICAgY29uc3Qgb2JzZXJ2ZWRTdGF0ZSA9IHN0YXR1cy5zdGF0ZSA9PT0gJ2Nvbm5lY3RlZCdcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlcXVlc3RlZEFwU3RhdGUgIT09IG51bGwgJiZcbiAgICAgIERhdGUubm93KCkgPCB0aGlzLnJlcXVlc3RlZEFwU3RhdGVVbnRpbCAmJlxuICAgICAgb2JzZXJ2ZWRTdGF0ZSAhPT0gdGhpcy5yZXF1ZXN0ZWRBcFN0YXRlXG4gICAgKSByZXR1cm5cblxuICAgIHRoaXMucmVxdWVzdGVkQXBTdGF0ZSA9IG51bGxcbiAgICB0aGlzLmRldmljZVN0YXR1cyA9IHN0YXR1c1xuICB9XG5cbiAgZ2V0IGlzRGlydHkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLmZvcm0uc3NpZCAhPT0gdGhpcy5vcmlnaW5hbC5zc2lkIHx8XG4gICAgICB0aGlzLmZvcm0uc2VjdXJpdHlFbmFibGVkICE9PSB0aGlzLm9yaWdpbmFsLnNlY3VyaXR5RW5hYmxlZCB8fFxuICAgICAgKHRoaXMuZm9ybS5zZWN1cml0eUVuYWJsZWQgJiZcbiAgICAgICAgdGhpcy5mb3JtLnBhc3N3b3JkICE9PSB0aGlzLm9yaWdpbmFsLnBhc3N3b3JkKVxuICAgIClcbiAgfVxuXG4gIHByaXZhdGUgcmVzZXRGb3JtICgpIHtcbiAgICBpZiAoIXRoaXMuYXBDcmVkZW50aWFscykgcmV0dXJuXG4gICAgdGhpcy5mb3JtLnNzaWQgPSB0aGlzLmFwQ3JlZGVudGlhbHMuc3NpZFxuICAgIC8vIE5ldmVyIHNob3cgYSBrZXksIGV2ZW4gb25lIGFuIG9sZGVyIEF1eCByZXR1cm5zOiAwNyBTMSBrZWVwcyBpdCBvbiB0aGVcbiAgICAvLyBwcmludGVyJ3Mgc2NyZWVuLiBBIG5ldyBrZXkgY2FuIHN0aWxsIGJlIHR5cGVkIGhlcmUuXG4gICAgdGhpcy5mb3JtLnBhc3N3b3JkID0gJydcbiAgICB0aGlzLnBhc3N3b3JkVmlzaWJsZSA9IGZhbHNlXG4gICAgLy8gT2xkZXIgQXV4IHZlcnNpb25zIGRvIG5vdCBleHBvc2UgdGhlIHNhZmUgYm9vbGVhbi4gS2VlcCB0aGUgc2VjdXJlXG4gICAgLy8gZmFsbGJhY2sgdW50aWwgdGhlIG1hdGNoaW5nIE9TIHVwZGF0ZSByZWFjaGVzIHRoZSBwcmludGVyLlxuICAgIHRoaXMuZm9ybS5zZWN1cml0eUVuYWJsZWQgPSB0aGlzLmFwQ3JlZGVudGlhbHMuc2VjdXJpdHlfZW5hYmxlZCA/PyB0cnVlXG4gICAgdGhpcy5vcmlnaW5hbCA9IHsgLi4udGhpcy5mb3JtIH1cbiAgfVxuXG4gIGFzeW5jIGFwcGx5Q2hhbmdlcyAoKSB7XG4gICAgaWYgKCF0aGlzLmFwQ3JlZGVudGlhbHMpIHJldHVyblxuICAgIHRoaXMuYXBwbHlpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBheWxvYWQ6IEFQQ3JlZGVudGlhbHMgPSB7XG4gICAgICAgIHNzaWQ6IHRoaXMuZm9ybS5zc2lkLFxuICAgICAgICBwYXNzd29yZDogdGhpcy5mb3JtLnNlY3VyaXR5RW5hYmxlZFxuICAgICAgICAgID8gdGhpcy5mb3JtLnBhc3N3b3JkXG4gICAgICAgICAgOiBudWxsXG4gICAgICB9XG4gICAgICBjb25zdCByb3V0ZSA9IHJvdXRlRm9yKCdob3RzcG90LWVkaXQnLCByZWZ1c2VkSGVyZSlcbiAgICAgIGlmIChyb3V0ZS5raW5kID09PSAnY2FsbCcgJiYgcm91dGUucGF0aCA9PT0gJy93aWZpL2FwL2NoYW5nZScpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGFuZ2VBdFByaW50ZXIoKVxuICAgICAgICB0aGlzLmFwcGx5aW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy50b2dnbGVFZGl0aW5nKClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmF1eEFwaS5hcC5hcE1vZGlmeVdpZmlBcE1vZGlmeVBvc3QocGF5bG9hZClcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gQSBwcmludGVyIHdpdGggTXVvbk9TICM0OTIgbGV0cyBvbmx5IGl0cyBvd24gc2NyZWVuIHVzZSAvd2lmaS9hcC9tb2RpZnkuXG4gICAgICAgIC8vIEFuIG9sZGVyIG9uZSBhbnN3ZXJzIGl0OyB0aGlzIHJ1bnMgb25seSBvbiBhIDQwMyBvciA0MDQuXG4gICAgICAgIGlmICghZmFsbHNCYWNrKGUpKSB0aHJvdyBlXG4gICAgICAgIHJlZnVzZWRIZXJlLmhvdHNwb3RFZGl0ID0gdHJ1ZVxuICAgICAgICBhd2FpdCB0aGlzLmNoYW5nZUF0UHJpbnRlcigpXG4gICAgICAgIHRoaXMuYXBwbHlpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLnRvZ2dsZUVkaXRpbmcoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIG9uIHN1Y2Nlc3MsIGNvbW1pdCBuZXcg4oCcb3JpZ2luYWzigJ0gc25hcHNob3RcbiAgICAgIC8vIHRoaXMub3JpZ2luYWwgPSB7IC4uLnRoaXMuZm9ybSB9XG4gICAgICBhd2FpdCB0aGlzLmZldGNoQ29uZmlnKCkgLy8gcmUtZmV0Y2ggdG8gZ2V0IHRoZSBsYXRlc3QgY29uZmlnXG4gICAgICAvLyBSZS1hY3RpdmF0ZSBvbmNlIHNvIE5ldHdvcmtNYW5hZ2VyIGFwcGxpZXMgdGhlIHNhdmVkIHByb2ZpbGUuIFRoaXMgaXNcbiAgICAgIC8vIGFsc28gdGhlIG9ubHkgYWN0aXZhdGlvbiByZXF1ZXN0IHdoZW4gdGhlIGhvdHNwb3Qgd2FzIHByZXZpb3VzbHkgb2ZmLlxuICAgICAgYXdhaXQgdGhpcy5jaGFuZ2VIb3RzcG90U3RhdGUodHJ1ZSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gYXBwbHkgaG90c3BvdCBjb25maWcnLCBlKVxuICAgICAgaWYgKHRoaXMudGFrZVBlcm1pc3Npb25SZWZ1c2FsKGUpKSB7XG4gICAgICAgIHRoaXMuYXBwbHlpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLnRvZ2dsZUVkaXRpbmcoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmICgoZSBhcyBhbnkpPy5yZXNwb25zZT8uc3RhdHVzID09PSA0MDMpIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdwcm90ZWN0aW9uL29uUmVmdXNlZCcpXG4gICAgICBFdmVudEJ1cy4kZW1pdChgJHt0aGlzLiR0KCdhcHAud2lmaS5tc2cuaG90c3BvdC5hcHBseV9lcnJvcicpfSAke21vb25yYWtlckVycm9yTWVzc2FnZShlKX1gLCB7IHR5cGU6ICdlcnJvcicsIHRpbWVvdXQ6IDUwMDAgfSlcbiAgICB9XG4gICAgdGhpcy5hcHBseWluZyA9IGZhbHNlXG4gICAgdGhpcy50b2dnbGVFZGl0aW5nKCkgLy8gY2xvc2UgdGhlIGZvcm1cbiAgfVxuXG4gIC8qKlxuICAgKiBQT1NUIC93aWZpL2FwL2NoYW5nZTogdGhlIHByaW50ZXIncyBzY3JlZW4gYXNrcyB0aGUgcGVyc29uIHN0YW5kaW5nIHRoZXJlLFxuICAgKiBhbmQgdGhlIG5ldyBuYW1lIG9yIGtleSBhcHBsaWVzIHdoZW4gdGhleSBjb25maXJtLiBOb3RoaW5nIGNoYW5nZXMgaGVyZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY2hhbmdlQXRQcmludGVyICgpIHtcbiAgICBjb25zdCBib2R5ID0gaG90c3BvdENoYW5nZUJvZHkodGhpcy5mb3JtLCB0aGlzLm9yaWdpbmFsLnNzaWQpXG4gICAgaWYgKCFib2R5KSB7XG4gICAgICAvLyAvd2lmaS9hcC9jaGFuZ2UgY2Fubm90IG1ha2UgYSBob3RzcG90IG9wZW4uXG4gICAgICBFdmVudEJ1cy4kZW1pdChwYW5lbE9ubHlNZXNzYWdlKCdtYWtlIHRoZSBob3RzcG90IG9wZW4nKSwgeyB0eXBlOiAnZXJyb3InLCB0aW1lb3V0OiA4MDAwIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYXV4QXBpLmFwQ2hhbmdlKGJvZHkpXG4gICAgICBFdmVudEJ1cy4kZW1pdCgnUHJlc3MgdGhlIGtub2Igb24gdGhlIHByaW50ZXIgdG8gY29uZmlybS4gVGhlIGhvdHNwb3QgY2hhbmdlcyB3aGVuIHlvdSBkby4nLCB7IHR5cGU6ICdwcmltYXJ5JywgdGltZW91dDogMTAwMDAgfSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAodGhpcy50YWtlUGVybWlzc2lvblJlZnVzYWwoZSkpIHtcbiAgICAgICAgLy8gVGhlIHN0b3JlIHJlZnVzZWQgdGhpcyBjYWxsZXI7IHRoZSBub3RpY2Ugc2F5cyB3aG8gbWF5LlxuICAgICAgfSBlbHNlIGlmIChpc1BhbmVsT25seVJlZnVzYWwoZSkpIHtcbiAgICAgICAgRXZlbnRCdXMuJGVtaXQocGFuZWxPbmx5TWVzc2FnZSgnY2hhbmdlIHRoZSBob3RzcG90JyksIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogODAwMCB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgRXZlbnRCdXMuJGVtaXQoYCR7dGhpcy4kdCgnYXBwLndpZmkubXNnLmhvdHNwb3QuYXBwbHlfZXJyb3InKX0gJHttb29ucmFrZXJFcnJvck1lc3NhZ2UoZSl9YCwgeyB0eXBlOiAnZXJyb3InLCB0aW1lb3V0OiA1MDAwIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdW5kb0NoYW5nZXMgKCkge1xuICAgIHRoaXMucmVzZXRGb3JtKClcbiAgICB0aGlzLnRvZ2dsZUVkaXRpbmcoKVxuICB9XG5cbiAgLy8g4oCU4oCUIGtlZXAgc3dpdGNoIOKGlCBwYXNzd29yZCBpbiBzeW5jIOKAlOKAlFxuICBAV2F0Y2goJ2Zvcm0ucGFzc3dvcmQnKVxuICBwcml2YXRlIG9uUGFzc3dvcmRFZGl0ZWQgKG5ld1ZhbDogc3RyaW5nKSB7XG4gICAgdGhpcy5mb3JtLnNlY3VyaXR5RW5hYmxlZCA9ICEhbmV3VmFsXG4gIH1cblxuICBAV2F0Y2goJ2Zvcm0uc2VjdXJpdHlFbmFibGVkJylcbiAgcHJpdmF0ZSBvblNlY3VyaXR5VG9nZ2xlZCAobmV3VmFsOiBib29sZWFuKSB7XG4gICAgaWYgKCFuZXdWYWwpIHtcbiAgICAgIC8vIHN3aXRjaGluZyBzZWN1cml0eSBvZmYgd2lwZXMgdGhlIHBhc3N3b3JkXG4gICAgICB0aGlzLmZvcm0ucGFzc3dvcmQgPSAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzd2l0Y2hpbmcgb24g4oaSIGZvY3VzIHRoZSBwYXNzd29yZCBmaWVsZFxuICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBwdyA9IHRoaXMuJHJlZnMucGFzc3dvcmRJbnB1dCBhcyBhbnlcbiAgICAgICAgaWYgKHB3ICYmIHB3LmZvY3VzKSBwdy5mb2N1cygpXG4gICAgICAgIGVsc2UgaWYgKHB3ICYmIHB3LiRlbCkge1xuICAgICAgICAgIGNvbnN0IGlucCA9IHB3LiRlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpXG4gICAgICAgICAgaW5wICYmIGlucC5mb2N1cygpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGdldCBzc2lkUnVsZXMgKCk6IEFycmF5PCh2OiBzdHJpbmcpID0+IHRydWUgfCBzdHJpbmc+IHtcbiAgICByZXR1cm4gW1xuICAgICAgKHY6IHN0cmluZykgPT4gISF2IHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IucmVxdWlyZWQnKS50b1N0cmluZygpXG4gICAgXVxuICB9XG5cbiAgLyoqXG4gICAqIFdQQS1QU0sgcnVsZTogZWl0aGVyXG4gICAqICDigKIgZXhhY3RseSA2NCBoZXggZGlnaXRzLCBvclxuICAgKiAg4oCiIDjigJM2MyBwcmludGFibGUtQVNDSUkgY2hhcnMgKDMy4oCTMTI2KVxuICAgKi9cbiAgcHVibGljIGdldCBwYXNzd29yZFJ1bGVzICgpOiBBcnJheTwodjogc3RyaW5nKSA9PiB0cnVlIHwgc3RyaW5nPiB7XG4gICAgcmV0dXJuIFtcbiAgICAgICh2OiBzdHJpbmcpOiB0cnVlIHwgc3RyaW5nID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcm0uc2VjdXJpdHlFbmFibGVkKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIC8vIDEpIGFsbG93IGV4YWN0bHkgNjQgaGV4IGRpZ2l0c1xuICAgICAgICBpZiAoL15bMC05QS1GYS1mXXs2NH0kLy50ZXN0KHYpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIpIGVuZm9yY2UgbGVuZ3RoXG4gICAgICAgIGlmICh2Lmxlbmd0aCA8IDgpIHtcbiAgICAgICAgICByZXR1cm4gaTE4bi50KCdhcHAud2lmaS5wYXNzd29yZC50b28tc2hvcnQnKS50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYubGVuZ3RoID4gNjMpIHtcbiAgICAgICAgICByZXR1cm4gaTE4bi50KCdhcHAud2lmaS5wYXNzd29yZC50b28tbG9uZycpLnRvU3RyaW5nKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDMpIGNhdGNoIGFueSBub24tcHJpbnRhYmxlLUFTQ0lJIGNoYXJzXG4gICAgICAgIGNvbnN0IGludmFsaWRDaGFycyA9IEFycmF5LmZyb20odilcbiAgICAgICAgICAuZmlsdGVyKGNoID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBjaC5jaGFyQ29kZUF0KDApXG4gICAgICAgICAgICByZXR1cm4gY29kZSA8IDMyIHx8IGNvZGUgPiAxMjZcbiAgICAgICAgICB9KVxuICAgICAgICAgIC8vIGRlZHVwZSBzYW1lIGNoYXJhY3RlciBpbiB0aGUgbGlzdFxuICAgICAgICAgIC5maWx0ZXIoKGNoLCBpZHgsIGFycikgPT4gYXJyLmluZGV4T2YoY2gpID09PSBpZHgpXG4gICAgICAgIGlmIChpbnZhbGlkQ2hhcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIGkxOG4udCgnYXBwLndpZmkucGFzc3dvcmQuaW52YWxpZC1jaGFyYWN0ZXInKS50b1N0cmluZygpICsgJzogJyArXG4gICAgICAgICAgICBpbnZhbGlkQ2hhcnMubWFwKGMgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjb2RlID0gYy5jaGFyQ29kZUF0KDApXG4gICAgICAgICAgICAgIC8vIHNob3cgZWl0aGVyIHRoZSBsaXRlcmFsIG9yIGl0cyBoZXggY29kZSBpZiB3aGl0ZXNwYWNlXG4gICAgICAgICAgICAgIHJldHVybiAvXFxzLy50ZXN0KGMpXG4gICAgICAgICAgICAgICAgPyBgMHgke2NvZGUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJyl9YFxuICAgICAgICAgICAgICAgIDogYCcke2N9J2BcbiAgICAgICAgICAgIH0pLmpvaW4oJywgJylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdlIG1hZGUgaXQgaGVyZSwgaXQncyB2YWxpZCBBU0NJSSAmIGxlbmd0aFxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIF1cbiAgfVxuXG4gIHRvZ2dsaW5nOiBib29sZWFuID0gZmFsc2VcblxuICByZWFkb25seSBwYW5lbE9ubHlOb3RlID0gUEFORUxfT05MWV9OT1RFXG5cbiAgZ2V0IGhvdHNwb3RPZmZJc1BhbmVsT25seSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHJvdXRlRm9yKCdob3RzcG90LW9mZicsIHJlZnVzZWRIZXJlKS5raW5kID09PSAncGFuZWwnXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNoYW5nZUhvdHNwb3RTdGF0ZSAod2FudHNPbj86IGJvb2xlYW4pIHtcbiAgICAvLyBndWFyZDogbmVlZCBjcmVkZW50aWFscyBhbmQgbm90IGFscmVhZHkgdG9nZ2xpbmdcbiAgICBpZiAoIXRoaXMuYXBDcmVkZW50aWFscyB8fCB0aGlzLnRvZ2dsaW5nKSByZXR1cm5cblxuICAgIC8vIGRldGVybWluZSBkZXNpcmVkIHN0YXRlXG4gICAgY29uc3QgdHVybk9uID0gd2FudHNPbiAhPT0gdW5kZWZpbmVkXG4gICAgICA/IHdhbnRzT25cbiAgICAgIDogdGhpcy5kZXZpY2VTdGF0dXM/LnN0YXRlICE9PSAnY29ubmVjdGVkJ1xuXG4gICAgdGhpcy50b2dnbGluZyA9IHRydWVcbiAgICB0aGlzLnJlcXVlc3RlZEFwU3RhdGUgPSB0dXJuT25cbiAgICB0aGlzLnJlcXVlc3RlZEFwU3RhdGVVbnRpbCA9IERhdGUubm93KCkgKyA1MDAwXG4gICAgdGhpcy5hcFN0YXRlID0gdHVybk9uXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0dXJuT24pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5hdXhBcGkuYXAuYXBVcFdpZmlBcFVwUG9zdCgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmF1eEFwaS5hcC5hcERvd25XaWZpQXBEb3duUG9zdCgpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5yZXF1ZXN0ZWRBcFN0YXRlID0gbnVsbFxuICAgICAgdGhpcy5hcFN0YXRlID0gdGhpcy5kZXZpY2VTdGF0dXM/LnN0YXRlID09PSAnY29ubmVjdGVkJ1xuICAgICAgY29uc29sZS5lcnJvcignSG90c3BvdCB0b2dnbGUgZmFpbGVkJywgZSlcbiAgICAgIGlmICh0aGlzLnRha2VQZXJtaXNzaW9uUmVmdXNhbChlKSkgcmV0dXJuXG4gICAgICBpZiAoIXR1cm5PbiAmJiBpc1BhbmVsT25seVJlZnVzYWwoZSkpIHtcbiAgICAgICAgLy8gVHVybmluZyB0aGUgaG90c3BvdCBvZmYgaGFzIG5vIG9wZW4gcm91dGU6IGl0IGlzIHRoZSBwcmludGVyJ3Mgc2NyZWVuIG5vdy5cbiAgICAgICAgcmVmdXNlZEhlcmUuaG90c3BvdE9mZiA9IHRydWVcbiAgICAgICAgRXZlbnRCdXMuJGVtaXQocGFuZWxPbmx5TWVzc2FnZSgndHVybiB0aGUgaG90c3BvdCBvZmYnKSwgeyB0eXBlOiAnZXJyb3InLCB0aW1lb3V0OiA4MDAwIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKHR1cm5PbiAmJiBpc1BhbmVsT25seVJlZnVzYWwoZSkpIHtcbiAgICAgICAgLy8gQW4gb3duZXIgY2FuIHR1cm4gQVVYX05FVFdPUktfU1RSSUNUIG9uLCBhbmQgdGhlbiAvd2lmaS9hcC91cCBpcyByZWZ1c2VkIHRvby5cbiAgICAgICAgRXZlbnRCdXMuJGVtaXQocGFuZWxPbmx5TWVzc2FnZSgndHVybiB0aGUgaG90c3BvdCBvbicpLCB7IHR5cGU6ICdlcnJvcicsIHRpbWVvdXQ6IDgwMDAgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBpZiAoKGUgYXMgYW55KT8ucmVzcG9uc2U/LnN0YXR1cyA9PT0gNDAzKSB0aGlzLiRzdG9yZS5kaXNwYXRjaCgncHJvdGVjdGlvbi9vblJlZnVzZWQnKVxuICAgICAgRXZlbnRCdXMuJGVtaXQoYCR7dGhpcy4kdCgnYXBwLndpZmkubXNnLmhvdHNwb3QudG9nZ2xlX2Vycm9yJyl9ICR7bW9vbnJha2VyRXJyb3JNZXNzYWdlKGUpfWAsIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogNTAwMCB9KVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnRvZ2dsaW5nID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gTkVXOiBsb2NhbCBzd2l0Y2ggc3RhdGUgZm9yIHRoZSB2LXN3aXRjaFxuICBhcFN0YXRlOiBib29sZWFuID0gZmFsc2VcblxuICAvLyBTeW5jIHN3aXRjaCDihpIgZGV2aWNlU3RhdHVzIHdoZW5ldmVyIHdlIHJlLWZldGNoXG4gIEBXYXRjaCgnZGV2aWNlU3RhdHVzJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgcHJpdmF0ZSBvbkRldmljZVN0YXR1c0NoYW5nZWQgKG5ld1N0YXR1czogRGV2aWNlIHwgbnVsbCkge1xuICAgIHRoaXMuYXBTdGF0ZSA9IG5ld1N0YXR1cz8uc3RhdGUgPT09ICdjb25uZWN0ZWQnXG4gIH1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQSBqb2luIGNvZGUgb25seSBmb3IgYW4gb3BlbiBob3RzcG90LiBBIHNlY3VyZWQgaG90c3BvdCdzIGtleSwgYW5kIGFueVxuICAvLyBjb2RlIGNhcnJ5aW5nIGl0LCBhcHBlYXIgb25seSBvbiB0aGUgcHJpbnRlcidzIHNjcmVlbiAoc2V0dXAgc3BlYyAwNyBTMSksXG4gIC8vIHNvIHRoaXMgcGFnZSBuZXZlciBkcmF3cyBvbmUsIGV2ZW4gd2hlbiBhbiBvbGRlciBBdXggcmV0dXJucyB0aGUga2V5LlxuICBnZXQgUXJWYWx1ZSAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuYXBDcmVkZW50aWFscyB8fCB0aGlzLmFwQ3JlZGVudGlhbHMuc2VjdXJpdHlfZW5hYmxlZCAhPT0gZmFsc2UpIHJldHVybiAnJ1xuICAgIGNvbnN0IFMgPSB0aGlzLmFwQ3JlZGVudGlhbHMuc3NpZC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpLnJlcGxhY2UoLzsvZywgJ1xcXFw7JylcbiAgICByZXR1cm4gYFdJRkk6Uzoke1N9O1Q6bm9wYXNzO0g6ZmFsc2U7O2BcbiAgfVxuXG4gIC8vIFdoZXJlIHRvIGdldCB0aGUgY29kZSBpbnN0ZWFkLCB3aGVuIHRoaXMgcGFnZSBkcmF3cyBub25lLlxuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXREaXNwbGF5TmFtZSddID8/ICcnXG4gIH1cblxuICBkZWxheWVkRWRpdGluZzogYm9vbGVhbiA9IHRoaXMuZWRpdGluZ1xuICBAV2F0Y2goJ2VkaXRpbmcnKVxuICBvbkVkaXRpbmdDaGFuZ2VkIChuZXdWYWw6IGJvb2xlYW4pIHtcbiAgICAvLyBzZXQgYSBuZXcgb25lXG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5kZWxheWVkRWRpdGluZyA9IG5ld1ZhbFxuICAgIH0sIDEwMClcbiAgfVxuXG4gICAgQFdhdGNoKCdkZXZpY2VTdGF0dXMnLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICBlbWl0RGV2aWNlU3RhdHVzICh2OiBEZXZpY2V8bnVsbCkge1xuICAgIHRoaXMuJGVtaXQoJ3VwZGF0ZTpkZXZpY2Utc3RhdHVzJywgdilcbiAgfVxuXG4gIEBXYXRjaCgndG9nZ2xpbmcnLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICAgIGVtaXRUb2dnbGluZyAodjogYm9vbGVhbikge1xuICAgICAgdGhpcy4kZW1pdCgndXBkYXRlOnRvZ2dsaW5nJywgdilcbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuaHMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE2cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5ocy0tcGFnZSB7XG4gICAgcGFkZGluZzogMThweDtcbiAgICBnYXA6IDE0cHg7XG4gIH1cblxuICAuaHNfX2hlYWQge1xuICAgIC5oc19fdGl0bGVzIGgyIHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgZ2FwOiAxMHB4O1xuICAgIH1cbiAgfVxuXG4gIC5oc19faWNvIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLmhzLS1jb21wYWN0IHtcbiAgICBnYXA6IDZweDtcbiAgICBwYWRkaW5nOiA0cHggMDtcbiAgICBib3JkZXItcmFkaXVzOiAwO1xuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXG4gICAgLmhzX190aXRsZXMgaDIge1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgIH1cbiAgfVxuXG4gIC5oc19faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAuaHNfX3RpdGxlcyB7XG4gICAgbWluLXdpZHRoOiAwO1xuXG4gICAgaDIge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgZm9udC1zaXplOiAxN3B4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG5cbiAgICBwIHtcbiAgICAgIG1hcmdpbjogMnB4IDAgMDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxuICB9XG5cbiAgLmhzX19ub3RlIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAuaHNfX2JhZGdlIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIGhlaWdodDogMjRweDtcbiAgICBwYWRkaW5nOiAwIDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1zdWNjZXNzKSAxNiUsIHRyYW5zcGFyZW50KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuXG4gICAgaSB7XG4gICAgICB3aWR0aDogNnB4O1xuICAgICAgaGVpZ2h0OiA2cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICBiYWNrZ3JvdW5kOiBjdXJyZW50Y29sb3I7XG4gICAgfVxuICB9XG5cbiAgLmhzX19iYWRnZS0temVybyB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwsIHZhcigtLW0zZC1zdXJmYWNlLTIpKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLmhzX19wZW9wbGUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAuaHNfX2F1dG9vZmYge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG5cbiAgICBiIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgIH1cblxuICAgIC5mcmFtZS1pY29uIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7XG4gICAgfVxuICB9XG5cbiAgLmhzX19lbXB0eSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNTAwO1xuICB9XG5cbiAgLmhzX19saXN0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDA7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgfVxuXG4gIC5oc19fY2xpZW50IHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMzZweCBtaW5tYXgoMCwgMS41ZnIpIG1pbm1heCgwLCAxZnIpIG1pbm1heCgwLCAxLjNmcikgMTE4cHggbWlubWF4KDAsIDFmcik7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWluLWhlaWdodDogNTZweDtcbiAgICBwYWRkaW5nOiA4cHggMDtcbiAgICBmb250LXNpemU6IDE0cHg7XG5cbiAgICAmICsgJiB7XG4gICAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgfVxuICB9XG5cbiAgLmhzX19jbGllbnQtLWhlYWQge1xuICAgIG1pbi1oZWlnaHQ6IDI0cHg7XG4gICAgcGFkZGluZzogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDZlbTtcbiAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuXG4gICAgJiArICYge1xuICAgICAgYm9yZGVyLXRvcDogMDtcbiAgICB9XG5cbiAgICAmICsgLmhzX19jbGllbnQge1xuICAgICAgYm9yZGVyLXRvcDogMDtcbiAgICB9XG4gIH1cblxuICAuaHNfX2Rldi1pY28ge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDM2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLmhzX19uYW1lIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNHB4IDhweDtcbiAgICBtaW4td2lkdGg6IDA7XG5cbiAgICBiIHtcbiAgICAgIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICAgICAgZm9udC1zaXplOiAxNXB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG4gIH1cblxuICAuaHNfX3VubmFtZWQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC13ZWlnaHQ6IDUwMCAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmhzX195b3Uge1xuICAgIHBhZGRpbmc6IDJweCA4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAuaHNfX2NlbGwge1xuICAgIG1pbi13aWR0aDogMDtcbiAgICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5oc19fbW9ubyB7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5oc19fc2lnIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5oc19fYmFycyB7XG4gICAgZmxleDogbm9uZTtcbiAgICB3aWR0aDogMjBweDtcbiAgICBoZWlnaHQ6IDE2cHg7XG5cbiAgICByZWN0IHtcbiAgICAgIGZpbGw6IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTtcbiAgICB9XG5cbiAgICAuaHNfX2Jhci0tb24ge1xuICAgICAgZmlsbDogdmFyKC0tbTNkLXRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE9uIGEgcGhvbmUgYSBkZXZpY2UgaXMgYSBjYXJkIG9mIHRocmVlIHNob3J0IGxpbmVzLCBub3QgYSB0YWJsZS5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDc2MHB4KSB7XG4gICAgLmhzX19jbGllbnQtLWhlYWQge1xuICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG5cbiAgICAuaHNfX2NsaWVudCB7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDM2cHggMWZyIGF1dG87XG4gICAgICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgICAgICAnaWNvIG5hbWUgbmFtZSdcbiAgICAgICAgJy4gaXAgbWFjJ1xuICAgICAgICAnLiBjb25uIHNpZyc7XG4gICAgICBnYXA6IDRweCAxMnB4O1xuICAgICAgcGFkZGluZzogMTJweCAwO1xuICAgIH1cblxuICAgIC5oc19fZGV2LWljbyB7IGdyaWQtYXJlYTogaWNvOyBhbGlnbi1zZWxmOiBzdGFydDsgfVxuICAgIC5oc19fbmFtZSB7IGdyaWQtYXJlYTogbmFtZTsgfVxuICAgIC5oc19faXAgeyBncmlkLWFyZWE6IGlwOyB9XG4gICAgLmhzX19tYWMgeyBncmlkLWFyZWE6IG1hYzsgdGV4dC1hbGlnbjogcmlnaHQ7IH1cbiAgICAuaHNfX2Nvbm4geyBncmlkLWFyZWE6IGNvbm47IH1cbiAgICAuaHNfX3NpZyB7IGdyaWQtYXJlYTogc2lnOyBqdXN0aWZ5LXNlbGY6IGVuZDsgfVxuICB9XG5cbiAgLmhzX19ib2R5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDIwcHg7XG4gIH1cblxuICAuaHNfX2Zvcm0ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMSAxIDI4MHB4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMnB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5oc19fcm93IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogMTJweDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAuaHNfX2J1dHRvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLmhzX19idXR0b25zLS1lbmQge1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gIH1cblxuICAuaHNfX2pvaW4ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMCAxIDE4MHB4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5oc19fcXIge1xuICAgIHBhZGRpbmc6IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGJhY2tncm91bmQ6ICNmZmY7XG4gICAgbGluZS1oZWlnaHQ6IDA7XG4gIH1cblxuICAuaHNfX2RpYWxvZyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTJweDtcbiAgICBwYWRkaW5nOiAyMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG5cbiAgICBoMyB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBmb250LXNpemU6IDE4cHg7XG4gICAgfVxuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvd2lmaS9Ib3RzcG90TWFuYWdlckNhcmQudnVlIn0=