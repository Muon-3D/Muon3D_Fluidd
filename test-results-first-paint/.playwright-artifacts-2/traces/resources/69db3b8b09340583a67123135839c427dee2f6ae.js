/* unplugin-vue-components disabled */import __unplugin_components_6 from "/src/components/ui/PrinterThumb.vue";
import { VProgressCircular as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import { Component, Mixins, Prop, VModel, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { Globals } from "/src/globals.ts";
import axios from "/.vite-e2e/4291/deps/axios.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { Debounce } from "/.vite-e2e/4291/deps/vue-debounce-decorator.js?v=9b9fafc7";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import webSocketWrapper from "/src/util/web-socket-wrapper.ts";
import { escapeHtml, pageBlocksPrinter, printerPageUrl } from "/src/util/page-blocks-printer.ts";
import { discoveryState, instanceFor, pageBlocksLanIpv4, probeAddress } from "/src/services/muon-cloud/discovery.ts";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
import PrinterThumb from "/src/components/ui/PrinterThumb.vue";
import { requestOctoPrintKey } from "/src/services/foreign-printers/appkeys.ts";
import { FOREIGN_BRANDS, foreignBrand } from "/src/services/foreign-printers/brands.ts";
import { lanFetch } from "/src/services/muon-cloud/discovery.ts";
import { blocksForeignHttp } from "/src/util/browser-family.ts";
import { localHost } from "/src/services/foreign-printers/address.ts";
import { v4 as uuidv4 } from "/.vite-e2e/4291/deps/uuid.js?v=9b9fafc7";
export function plainProbeError(raw) {
  if (/timed out/i.test(raw)) return "The printer did not answer in time. Check it is switched on and on this network, then try again.";
  const status = /HTTP (\d{3})/.exec(raw)?.[1];
  if (status === "401" || status === "403") return "The printer wants a key. Enter its API key above, then check again.";
  if (status) return "Something answered, but not as this kind of printer does. Check the address and the brand, then try again.";
  return "Could not reach the printer. Check the address matches the one on its screen, then try again.";
}
let AddInstanceDialog = class extends Mixins(StateMixin) {
  open;
  found;
  searching;
  valid = true;
  verifying = false;
  verified = false;
  outcome = "idle";
  /** What failed, as the browser said it. */
  error = null;
  /** A note with a way round (a link), its values escaped. */
  note = null;
  /** The Muon3D printer that answered for what was typed, by IP address or by name. */
  resolved = null;
  url = "";
  selectedKind = "m1";
  foreignHost = "";
  foreignName = "";
  foreignModel = "";
  formFactor = "bed-slinger";
  apiKey = "";
  rememberCredentials = false;
  probing = false;
  foreignVerified = false;
  probeMessage = "";
  /** What the browser or printer said, for a small Details line. */
  probeDetail = "";
  appKeyMessage = "";
  abortController = void 0;
  mounted() {
    this.$nextTick(() => this.$refs.input?.focus());
  }
  get brandChoices() {
    return [{ kind: "m1", label: "Muon3D M1", via: "direct" }, ...FOREIGN_BRANDS];
  }
  get selectedBrand() {
    return this.selectedKind === "m1" ? null : foreignBrand(this.selectedKind);
  }
  get mixedContentWarning() {
    return blocksForeignHttp() && pageBlocksPrinter(`http://${this.foreignHost}`);
  }
  get currentOrigin() {
    return location.origin;
  }
  get canRememberCredentials() {
    return !!crypto.subtle;
  }
  invalidateForeignProbe() {
    this.foreignVerified = false;
    this.probeMessage = "";
    this.probeDetail = "";
  }
  selectBrand(kind) {
    this.selectedKind = kind;
    this.foreignVerified = false;
    this.probeMessage = "";
    this.apiKey = "";
    this.rememberCredentials = false;
    this.appKeyMessage = "";
    if (kind !== "m1") {
      const brand = foreignBrand(kind);
      this.foreignModel = brand.model ?? "";
      this.foreignName = brand.model || brand.label;
      this.formFactor = brand.formFactor;
    }
  }
  async probeForeign() {
    if (!this.selectedBrand || this.selectedBrand.via !== "direct") return;
    this.probing = true;
    this.foreignVerified = false;
    this.probeMessage = "";
    this.probeDetail = "";
    const address = this.foreignHost.trim();
    const kind = this.selectedKind;
    const key = this.apiKey;
    const current = () => this.selectedKind === kind && this.foreignHost.trim() === address && this.apiKey === key;
    const timeout = (promise) => Promise.race([
      promise,
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error("Check timed out")), 5e3))
    ]);
    try {
      const host = localHost(address);
      if (kind === "moonraker") {
        const headers = key ? { "X-Api-Key": key } : void 0;
        const response = await timeout(lanFetch(`http://${host}/server/info`, { headers, cache: "no-store", redirect: "error" }));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
      } else if (kind === "octoprint") {
        const headers = key ? { "X-Api-Key": key } : void 0;
        const response = await timeout(lanFetch(`http://${host}/api/version`, { headers, cache: "no-store", redirect: "error" }));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
      } else {
        await timeout(new Promise((resolve, reject) => {
          const creality = kind === "creality";
          const hostname = new URL(`http://${host}`).hostname;
          const socket = new WebSocket(creality ? `ws://${hostname}:9999` : `ws://${hostname}:3030/websocket`, creality ? "wsslicer" : void 0);
          const timer = setTimeout(() => {
            socket.close();
            reject(new Error("Check timed out"));
          }, 5e3);
          socket.onopen = () => {
            if (creality) socket.send(JSON.stringify({ method: "get", params: { ReqPrinterPara: 1 } }));
            else socket.send(JSON.stringify({ Id: "", Data: { Cmd: 1, Data: {}, RequestID: uuidv4().replace(/-/g, ""), MainboardID: "", TimeStamp: Math.floor(Date.now() / 1e3), From: 1 }, Topic: "sdcp/request/" }));
          };
          socket.onmessage = (event) => {
            if (!creality) {
              try {
                if (!JSON.parse(event.data).MainboardID) return;
              } catch {
                return;
              }
            }
            clearTimeout(timer);
            socket.close();
            resolve();
          };
          socket.onerror = () => {
            clearTimeout(timer);
            socket.close();
            reject(new Error("Could not reach the printer"));
          };
        }));
      }
      if (!current()) return;
      this.foreignVerified = true;
      this.probeMessage = "Printer found.";
    } catch (error) {
      if (current()) {
        const raw = error instanceof Error ? error.message : String(error);
        this.probeMessage = plainProbeError(raw);
        this.probeDetail = raw;
      }
    } finally {
      this.probing = false;
    }
  }
  async askOctoPrintForKey() {
    const address = this.foreignHost.trim();
    try {
      const host = localHost(address);
      const key = await requestOctoPrintKey(host, { fetch: lanFetch }, {
        onPending: () => {
          this.appKeyMessage = "Approve in OctoPrint.";
        }
      });
      if (this.selectedKind !== "octoprint" || this.foreignHost.trim() !== address) return;
      if (key === null) {
        this.appKeyMessage = "App keys are not available here. Enter an API key above.";
        return;
      }
      this.apiKey = key;
      this.appKeyMessage = "API key approved.";
    } catch (error) {
      this.appKeyMessage = error instanceof Error && error.message === "denied" ? "The key request was denied or timed out." : error instanceof Error ? error.message : "Could not request an API key.";
    }
  }
  async copyMoonrakerSetup() {
    await navigator.clipboard?.writeText(`[authorization]
cors_domains:
  ${location.origin}`);
  }
  async saveForeignPrinter() {
    if (!this.selectedBrand || !this.foreignVerified) return;
    const { saveForeign } = await import("/src/services/foreign-printers/store.ts");
    await saveForeign({
      kind: this.selectedKind,
      name: this.foreignName || this.foreignModel || this.selectedBrand.label,
      model: this.foreignModel || void 0,
      host: this.foreignHost,
      via: "direct",
      formFactor: this.formFactor
    }, this.apiKey ? { apiKey: this.apiKey } : null, { remember: this.rememberCredentials });
    const live = await import("/src/services/foreign-printers/live.ts");
    await live.refreshForeign();
    await live.connectAll();
    this.open = false;
    this.$emit("saved");
  }
  /**
   * Validates a URL
   */
  validUrl(url) {
    try {
      this.$filters.getApiUrls(url);
    } catch {
      return false;
    }
    return true;
  }
  get hosted() {
    return this.$store.state.config.hostConfig.hosted;
  }
  /** What was typed, without a scheme or a trailing slash, for the status line. */
  get typed() {
    return this.url.trim().replace(/^[a-z]+:\/\//i, "").replace(/\/+$/, "");
  }
  get tone() {
    switch (this.outcome) {
      case "muon":
        return "ok";
      case "locked":
      case "klipper":
      case "blocked":
        return "warn";
      case "cors":
      case "unreachable":
      case "not-printer":
      case "invalid":
        return "err";
      default:
        return "off";
    }
  }
  get statusIcon() {
    switch (this.outcome) {
      case "muon":
        return "check";
      case "locked":
        return "lock";
      default:
        return "alert";
    }
  }
  get status() {
    const name = this.resolved?.name;
    switch (this.outcome) {
      case "checking":
        return { title: `Looking for ${this.typed}\u2026` };
      case "invalid":
        return { title: "That isn't an address", detail: "Type a name such as muon-boxwood-367a.local, or an IP address such as 192.168.1.20." };
      case "muon":
        return { title: `Found ${name}`, detail: `At ${this.resolved?.host}. Add it to see it here with your other printers.` };
      case "locked":
        return { title: `${name ?? "This printer"} wants you to sign in`, detail: "Add it, then sign in on its page." };
      case "klipper":
        return { title: "A printer answered, but it isn't a Muon printer", detail: "Set it up as Klipper to keep it in Other printers, with its own controls." };
      case "cors":
        return { title: "It answered, but won't let this page in", html: this.note ?? void 0 };
      case "blocked":
        return { title: "This browser didn't let the check through", html: this.note ?? void 0 };
      case "unreachable":
        return {
          title: `Nothing answered at ${this.typed}`,
          detail: "Check the printer is switched on, that it's on the same network as this device, and that the address matches the one on its screen."
        };
      case "not-printer":
        return { title: "Something answered, but it isn't a printer", detail: "Check the address matches the one on the printer's screen." };
      default:
        return null;
    }
  }
  /** The check can be asked again where asking again could change the answer. */
  get canRetry() {
    return this.outcome === "unreachable" || this.outcome === "not-printer" || this.outcome === "cors";
  }
  /** Why Add is off, and what to do instead, while it is. */
  get addHint() {
    if (this.verified) {
      return this.outcome === "locked" ? "Not your printer? Add it and sign in on its page, or ask its owner to share it with you. You can also open its page without adding it." : "";
    }
    switch (this.outcome) {
      case "idle":
        return "Add turns on once a printer answers at the address. Type its name or address above.";
      case "checking":
        return "Add turns on when the check finishes.";
      case "invalid":
        return "Add is off because that isn't an address. Fix it above.";
      case "blocked":
        return "Add is off because this browser stopped the check. Open the printer's own page instead, using the link above.";
      default:
        return "Add is off because no printer was found there. Try again, check the address, or ask the printer's owner for it.";
    }
  }
  get addLabel() {
    if (this.outcome === "klipper") return "Set up as Klipper";
    if ((this.outcome === "muon" || this.outcome === "locked") && this.resolved) return `Add ${this.resolved.name}`;
    return "Add printer";
  }
  onUrlChange(value, oldVal) {
    if (value === oldVal) return;
    this.abortController?.abort();
    this.verified = false;
    this.resolved = null;
    this.error = null;
    this.note = null;
    this.outcome = value.trim() ? "checking" : "idle";
    this.verifying = !!value.trim();
    this.handleUrlChange(value);
  }
  handleUrlChange(value) {
    return this.runCheck(value);
  }
  /** Asks the same check again, now: the answer may have changed (the printer was switched on, the network came back). */
  retry() {
    this.abortController?.abort();
    return this.runCheck(this.url);
  }
  async runCheck(value) {
    if (value !== this.url || !value.trim()) return;
    this.valid = this.validUrl(value);
    if (!this.valid) {
      this.verifying = false;
      this.outcome = "invalid";
      return;
    }
    this.verified = false;
    this.error = null;
    this.note = null;
    this.verifying = true;
    this.outcome = "checking";
    this.resolved = null;
    const printer = await probeAddress(value);
    if (value !== this.url) return;
    if (printer) {
      this.resolved = printer;
      this.verified = true;
      this.verifying = false;
      this.outcome = printer.health?.state === "locked" ? "locked" : "muon";
      return;
    }
    const { apiUrl, socketUrl } = this.$filters.getApiUrls(value);
    this.abortController?.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const request = await axios.get(`${apiUrl}/server/info?t=${Date.now()}`, {
      timeout: Globals.NETWORK_REQUEST_TIMEOUT,
      signal
    }).then(() => {
      this.verified = true;
      this.verifying = false;
      this.outcome = "klipper";
      return "ok";
    }).catch((e) => {
      if (axios.isCancel(e)) {
        return "ok";
      } else if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          this.verified = true;
          this.verifying = false;
          this.outcome = "locked";
          return "ok";
        }
        if (e.request && !e.response) return e.message;
      }
      this.error = e instanceof Error ? e.message : String(e);
      this.verifying = false;
      this.outcome = "not-printer";
      return "ok";
    });
    if (value !== this.url) return;
    if (request !== "ok") {
      if (this.hosted) {
        await webSocketWrapper(socketUrl, signal).then(() => {
          if (value !== this.url) return;
          this.verified = true;
          this.outcome = "klipper";
        }).catch((e) => {
          consola.debug("Network Error", e, request);
          return this.onUnreachable(apiUrl, request);
        }).finally(() => {
          if (value === this.url) this.verifying = false;
        });
      } else {
        await fetch(`${apiUrl}/server/info`, { signal, mode: "no-cors", cache: "no-cache" }).then(() => {
          if (value !== this.url) return;
          this.error = this.$t("app.endpoint.error.cors_error").toString();
          this.note = this.$t("app.endpoint.error.cors_note", {
            url: Globals.DOCS_MULTIPLE_INSTANCES
          }).toString();
          this.outcome = "cors";
        }).catch((e) => {
          consola.debug("Network Error", e, request);
          return this.onUnreachable(apiUrl, request);
        }).finally(() => {
          if (value === this.url) this.verifying = false;
        });
      }
    }
  }
  /**
   * An address this page could not reach at all. From control.muon3d.com (HTTPS)
   * to a plain-HTTP printer that is usually the browser blocking mixed
   * content, not a wrong address, so say so and link the printer's own page
   * rather than asking whether the address is correct.
   */
  async onUnreachable(apiUrl, request) {
    const typed = this.url;
    const blocked = /^http:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?\/?$/.test(apiUrl) && await pageBlocksLanIpv4();
    if (this.url !== typed) return;
    this.verifying = false;
    if (blocked) {
      const ownUrl = discoveryState.blockedByPage?.ownUrl;
      this.error = null;
      this.note = this.$t("app.endpoint.error.blocked_ip_from_name", { host: escapeHtml(location.host) }) + (ownUrl ? " " + this.$t("app.endpoint.error.blocked_ip_from_name_way_round", { url: escapeHtml(ownUrl) }) : "");
      this.outcome = "blocked";
      return;
    }
    if (pageBlocksPrinter(apiUrl)) {
      this.error = null;
      this.note = this.$t("app.endpoint.error.blocked_by_page", {
        host: escapeHtml(location.host),
        url: escapeHtml(printerPageUrl(apiUrl))
      }).toString();
      this.outcome = "blocked";
      return;
    }
    this.error = request;
    this.note = null;
    this.outcome = "unreachable";
  }
  submit() {
    if (this.verified) this.addInstance();
  }
  addInstance() {
    if (!this.verified) return;
    const apiConfig = this.resolved ? instanceFor(this.resolved) : this.$filters.getApiUrls(this.url);
    if (this.outcome === "klipper") {
      this.selectBrand("moonraker");
      this.foreignHost = new URL(apiConfig.apiUrl).host;
      return;
    }
    this.open = false;
    this.$emit("resolve", apiConfig);
  }
  /** One found on this network: the page opens it, as its own card would. */
  pick(choice) {
    this.open = false;
    this.$emit("pick", choice.key);
  }
};
__decorateClass([
  VModel({ type: Boolean })
], AddInstanceDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], AddInstanceDialog.prototype, "found", 2);
__decorateClass([
  Prop({ type: Boolean })
], AddInstanceDialog.prototype, "searching", 2);
__decorateClass([
  Watch("foreignHost"),
  Watch("apiKey")
], AddInstanceDialog.prototype, "invalidateForeignProbe", 1);
__decorateClass([
  Watch("url")
], AddInstanceDialog.prototype, "onUrlChange", 1);
__decorateClass([
  Debounce(750)
], AddInstanceDialog.prototype, "handleUrlChange", 1);
AddInstanceDialog = __decorateClass([
  Component({ components: { M3Dialog, PrinterThumb } })
], AddInstanceDialog);
const _sfc_main = AddInstanceDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "eyebrow": "Printers", "title": "Add a printer", "focus-title": false, "max-width": "500", "content-class": "add-printer", "data-tid": "add-printer-dialog" }, on: { "close": function($event) {
    _vm.open = false;
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_vm.selectedKind === "m1" ? _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "add-printer-cancel" }, on: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" Cancel ")]) : _vm._e(), _vm.selectedKind === "m1" ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.verified, "data-tid": "add-printer-add" }, on: { "click": _vm.addInstance } }, [_vm._v(" " + _vm._s(_vm.addLabel) + " ")]) : _vm.selectedBrand?.via === "direct" ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.foreignVerified }, on: { "click": _vm.saveForeignPrinter } }, [_vm._v(" Add printer ")]) : _vm._e()];
  }, proxy: true }]) }, [_c("nav", { staticClass: "aid__brands", attrs: { "aria-label": "Printer brand" } }, _vm._l(_vm.brandChoices, function(brand) {
    return _c("button", { key: brand.kind, staticClass: "aid__brand", class: { "aid__brand--selected": _vm.selectedKind === brand.kind }, attrs: { "type": "button" }, on: { "click": function($event) {
      return _vm.selectBrand(brand.kind);
    } } }, [_vm._v(" " + _vm._s(brand.label) + " "), brand.via === "m1" ? _c("small", [_vm._v("needs an M1 on this network")]) : _vm._e()]);
  }), 0), _vm.selectedKind === "m1" ? _c("section", [_c("p", { staticClass: "m3-dlg__text" }, [_vm._v(" Type the name on the printer's screen, or its IP address. ")]), _c("form", { staticClass: "m3-field", attrs: { "autocomplete": "off" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.submit.apply(null, arguments);
  } } }, [_c("label", { staticClass: "m3-field__box m3-field__box--mono", class: `m3-field__box--${_vm.tone}` }, [_c(__unplugin_components_1, { attrs: { "name": "search", "small": "" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.url, expression: "url" }], ref: "input", attrs: { "type": "text", "inputmode": "url", "autocapitalize": "off", "spellcheck": "false", "placeholder": "muon-boxwood-367a.local", "aria-label": "The printer's name or IP address", "data-tid": "add-printer-address" }, domProps: { "value": _vm.url }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.url = $event.target.value;
  } } })], 1), _c("span", { staticClass: "m3-dlg__note" }, [_vm._v(" Such as "), _c("span", { staticClass: "aid__mono" }, [_vm._v("muon-boxwood-367a.local")]), _vm._v(" or "), _c("span", { staticClass: "aid__mono" }, [_vm._v("192.168.1.20")])])]), _vm.status ? _c("div", { staticClass: "aid__status", class: `aid__status--${_vm.tone}`, attrs: { "role": "status", "aria-live": "polite", "data-tid": "add-printer-status" } }, [_c("span", { staticClass: "aid__status-icon" }, [_vm.outcome === "checking" ? _c(__unplugin_components_2, { attrs: { "indeterminate": "", "size": "16", "width": "2" } }) : _c(__unplugin_components_3, { attrs: { "name": _vm.statusIcon, "small": "" } })], 1), _c("div", { staticClass: "aid__status-text" }, [_c("b", [_vm._v(_vm._s(_vm.status.title))]), _vm.status.html ? _c("span", { domProps: { "innerHTML": _vm._s(_vm.status.html) } }) : _vm.status.detail ? _c("span", [_vm._v(_vm._s(_vm.status.detail))]) : _vm._e(), _vm.canRetry ? _c("span", { staticClass: "aid__retry-row" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "add-printer-retry" }, on: { "click": _vm.retry } }, [_vm._v(" Try again ")])]) : _vm._e()])]) : _vm._e(), _vm.addHint ? _c("p", { staticClass: "m3-dlg__note aid__why", attrs: { "data-tid": "add-printer-why" } }, [_vm._v(" " + _vm._s(_vm.addHint) + " ")]) : _vm._e(), _vm.found.length || _vm.searching ? _c("section", { staticClass: "aid__found", attrs: { "data-tid": "add-printer-found" } }, [_c("h3", { staticClass: "aid__found-head" }, [_c(__unplugin_components_4, { attrs: { "name": "wifi", "small": "" } }), _vm._v(" Found on this network "), _vm.searching ? _c(__unplugin_components_5, { attrs: { "indeterminate": "", "size": "11", "width": "2" } }) : _vm._e()], 1), _vm._l(_vm.found, function(f) {
    return _c("button", { key: f.key, staticClass: "aid__choice", attrs: { "type": "button", "data-tid": `add-printer-found-${f.key}` }, on: { "click": function($event) {
      return _vm.pick(f);
    } } }, [_c(__unplugin_components_6, { attrs: { "size": 40 } }), _c("span", { staticClass: "aid__choice-text" }, [_c("b", [_vm._v(_vm._s(f.name))]), _c("span", [_vm._v(_vm._s(f.detail))])]), _c("span", { staticClass: "aid__choice-go" }, [_vm._v("Add")])], 1);
  }), !_vm.found.length ? _c("p", { staticClass: "m3-dlg__note" }, [_vm._v(" Looking for printers on this network\u2026 ")]) : _vm._e()], 2) : _vm._e()]) : _vm.selectedBrand?.via === "m1" ? _c("section", { staticClass: "aid__bridge" }, [_c("p", [_vm._v(_vm._s(_vm.selectedBrand.label) + " needs an M1 bridge on this network.")]), _c("ol", _vm._l(_vm.selectedBrand.steps, function(step) {
    return _c("li", { key: step }, [_vm._v(" " + _vm._s(step) + " ")]);
  }), 0), _vm.selectedBrand.docs ? _c("a", { attrs: { "href": _vm.selectedBrand.docs, "target": "_blank", "rel": "noopener" } }, [_vm._v("Open the manufacturer's setup guide")]) : _vm._e(), _c("p", { staticClass: "m3-dlg__note" }, [_vm._v(" The bridge is a Muon3D M1 that is already set up. No M1 yet? Add one first, then come back to this brand. ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "add-printer-bridge-m1" }, on: { "click": function($event) {
    return _vm.selectBrand("m1");
  } } }, [_vm._v(" Add your M1 first ")])]) : _vm.selectedBrand ? _c("section", { staticClass: "aid__foreign" }, [_vm.mixedContentWarning ? _c("p", { staticClass: "aid__warning" }, [_vm._v(" Firefox and Safari block this page (https) from talking to a printer on plain http \u2014 that's mixed content. Chrome can reach printers on your network: open Control in Chrome. ")]) : _vm._e(), _c("p", { staticClass: "m3-dlg__text" }, [_vm._v(" " + _vm._s(_vm.selectedBrand.label) + " stays on this network and in this browser. ")]), _c("p", { staticClass: "m3-dlg__note" }, [_vm._v(" In Chrome on a computer or Android, allow local network access when asked. ")]), _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-dlg__note" }, [_vm._v("Printer address")]), _c("input", { directives: [{ name: "model", rawName: "v-model.trim", value: _vm.foreignHost, expression: "foreignHost", modifiers: { "trim": true } }], staticClass: "aid__input", attrs: { "placeholder": "192.168.1.20", "autocomplete": "off" }, domProps: { "value": _vm.foreignHost }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.foreignHost = $event.target.value.trim();
  }, "blur": function($event) {
    return _vm.$forceUpdate();
  } } })]), _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-dlg__note" }, [_vm._v("Name")]), _c("input", { directives: [{ name: "model", rawName: "v-model.trim", value: _vm.foreignName, expression: "foreignName", modifiers: { "trim": true } }], staticClass: "aid__input", attrs: { "placeholder": _vm.selectedBrand.model || _vm.selectedBrand.label }, domProps: { "value": _vm.foreignName }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.foreignName = $event.target.value.trim();
  }, "blur": function($event) {
    return _vm.$forceUpdate();
  } } })]), _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-dlg__note" }, [_vm._v("Model")]), _c("input", { directives: [{ name: "model", rawName: "v-model.trim", value: _vm.foreignModel, expression: "foreignModel", modifiers: { "trim": true } }], staticClass: "aid__input", attrs: { "placeholder": _vm.selectedBrand.model || "Model" }, domProps: { "value": _vm.foreignModel }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.foreignModel = $event.target.value.trim();
  }, "blur": function($event) {
    return _vm.$forceUpdate();
  } } })]), _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-dlg__note" }, [_vm._v("Form factor")]), _c("select", { directives: [{ name: "model", rawName: "v-model", value: _vm.formFactor, expression: "formFactor" }], staticClass: "aid__input", on: { "change": function($event) {
    var $$selectedVal = Array.prototype.filter.call($event.target.options, function(o) {
      return o.selected;
    }).map(function(o) {
      var val = "_value" in o ? o._value : o.value;
      return val;
    });
    _vm.formFactor = $event.target.multiple ? $$selectedVal : $$selectedVal[0];
  } } }, [_c("option", { attrs: { "value": "enclosed" } }, [_vm._v("Enclosed")]), _c("option", { attrs: { "value": "open-frame" } }, [_vm._v("Open frame")]), _c("option", { attrs: { "value": "bed-slinger" } }, [_vm._v("Bed slinger")])])]), _vm.selectedKind === "moonraker" || _vm.selectedKind === "octoprint" ? _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-dlg__note" }, [_vm._v(_vm._s(_vm.selectedKind === "octoprint" ? "Application key" : "API key (optional)"))]), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.apiKey, expression: "apiKey" }], staticClass: "aid__input", attrs: { "type": "password", "autocomplete": "off" }, domProps: { "value": _vm.apiKey }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.apiKey = $event.target.value;
  } } })]) : _vm._e(), _vm.selectedKind === "octoprint" ? _c("div", { staticClass: "aid__steps" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": _vm.askOctoPrintForKey } }, [_vm._v(" Ask OctoPrint for a key ")]), _c("span", [_vm._v(_vm._s(_vm.appKeyMessage))])]) : _vm._e(), _vm.selectedKind === "moonraker" || _vm.selectedKind === "octoprint" ? _c("label", { staticClass: "aid__remember" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.rememberCredentials, expression: "rememberCredentials" }], attrs: { "disabled": !_vm.canRememberCredentials, "type": "checkbox" }, domProps: { "checked": Array.isArray(_vm.rememberCredentials) ? _vm._i(_vm.rememberCredentials, null) > -1 : _vm.rememberCredentials }, on: { "change": function($event) {
    var $$a = _vm.rememberCredentials, $$el = $event.target, $$c = $$el.checked ? true : false;
    if (Array.isArray($$a)) {
      var $$v = null, $$i = _vm._i($$a, $$v);
      if ($$el.checked) {
        $$i < 0 && (_vm.rememberCredentials = $$a.concat([$$v]));
      } else {
        $$i > -1 && (_vm.rememberCredentials = $$a.slice(0, $$i).concat($$a.slice($$i + 1)));
      }
    } else {
      _vm.rememberCredentials = $$c;
    }
  } } }), _vm._v(" Remember on this device ")]) : _vm._e(), !_vm.canRememberCredentials && (_vm.selectedKind === "moonraker" || _vm.selectedKind === "octoprint") ? _c("p", { staticClass: "m3-dlg__note" }, [_vm._v(" To remember this key, open Control over HTTPS in Chrome. Here, it lasts for this session. ")]) : _vm._e(), _vm.probeMessage ? _c("p", { staticClass: "m3-dlg__note", attrs: { "role": "status", "data-tid": "add-printer-probe" } }, [_vm._v(" " + _vm._s(_vm.probeMessage) + " ")]) : _vm._e(), _vm.probeDetail ? _c("details", { staticClass: "m3-dlg__note aid__details" }, [_c("summary", [_vm._v("Details")]), _c("code", [_vm._v(_vm._s(_vm.probeDetail))])]) : _vm._e(), _vm.selectedKind === "moonraker" ? _c("div", { staticClass: "aid__setup" }, [_c("p", [_vm._v("Allow this browser in Moonraker:")]), _c("pre", [_vm._v("[authorization]\ncors_domains:\n        " + _vm._s(_vm.currentOrigin))]), _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": _vm.copyMoonrakerSetup } }, [_vm._v(" Copy ")]), _c("p", [_vm._v("Restart Moonraker.")])]) : _vm._e(), _vm.selectedBrand.steps.length ? _c("p", { staticClass: "m3-dlg__note" }, [_vm._v(" " + _vm._s(_vm.selectedBrand.steps.join(" ")) + " ")]) : _vm._e(), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": _vm.probing || !_vm.foreignHost.trim() }, on: { "click": _vm.probeForeign } }, [_vm._v(" " + _vm._s(_vm.probing ? "Checking\u2026" : "Check printer") + " ")]), !_vm.foreignVerified ? _c("p", { staticClass: "m3-dlg__note aid__why", attrs: { "data-tid": "add-printer-foreign-why" } }, [_vm._v(" " + _vm._s(_vm.foreignHost.trim() ? "Add printer turns on once Check printer finds it." : "Type the address above, then press Check printer.") + " ")]) : _vm._e()]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/common/AddInstanceDialog.vue?vue&type=style&index=0&scoped=20fd1f40&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "20fd1f40",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/AddInstanceDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQXNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVVBO0FBQUEsRUFFQTtBQUFBLEVBSUE7QUFBQSxFQUlBO0FBQUE7RUFHQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUE7O0FBS0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7OztFQUdBO0FBQUE7QUFBQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFBQSxnQkFDQTtBQUFBLFVBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0Esa0ZBQ0EsNkNBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQSx5Q0FDQSwySUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBOztBQUtBOzs7QUFXQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQSxHQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBLEdBQ0E7QUFFQTtBQUNBO0FBQUEsTUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBR0E7QUFBQSxNQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBOztBQUtBO0FBQ0E7QUFDQSxrREFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLFFBQ0EsR0FDQTtBQUVBO0FBQ0E7QUFBQSxRQUNBLEdBQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUNBLDZGQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0E7QUFDQTtBQUFBLFFBQ0EsR0FDQTtBQUVBO0FBQ0E7QUFBQSxRQUNBLEdBQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkdBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBL2RBO0FBQUEsRUFEQTtBQUFBLEdBREEsa0JBRUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQUxBLGtCQU1BO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FUQSxrQkFVQTtBQWtEQTtBQUFBO0VBREE7QUFBQSxHQTNEQSxrQkE0REE7QUFtT0E7QUFBQSxFQURBO0FBQUEsR0E5UkEsa0JBK1JBO0FBYUE7QUFBQTtHQTVTQSxrQkE0U0E7QUE1U0E7QUFBQTtBQUFBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBZGRJbnN0YW5jZURpYWxvZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8bTMtZGlhbG9nXG4gICAgOnZhbHVlPVwib3BlblwiXG4gICAgZXllYnJvdz1cIlByaW50ZXJzXCJcbiAgICB0aXRsZT1cIkFkZCBhIHByaW50ZXJcIlxuICAgIDpmb2N1cy10aXRsZT1cImZhbHNlXCJcbiAgICBtYXgtd2lkdGg9XCI1MDBcIlxuICAgIGNvbnRlbnQtY2xhc3M9XCJhZGQtcHJpbnRlclwiXG4gICAgZGF0YS10aWQ9XCJhZGQtcHJpbnRlci1kaWFsb2dcIlxuICAgIEBjbG9zZT1cIm9wZW4gPSBmYWxzZVwiXG4gID5cbiAgICA8bmF2XG4gICAgICBjbGFzcz1cImFpZF9fYnJhbmRzXCJcbiAgICAgIGFyaWEtbGFiZWw9XCJQcmludGVyIGJyYW5kXCJcbiAgICA+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtZm9yPVwiYnJhbmQgaW4gYnJhbmRDaG9pY2VzXCJcbiAgICAgICAgOmtleT1cImJyYW5kLmtpbmRcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJhaWRfX2JyYW5kXCJcbiAgICAgICAgOmNsYXNzPVwieyAnYWlkX19icmFuZC0tc2VsZWN0ZWQnOiBzZWxlY3RlZEtpbmQgPT09IGJyYW5kLmtpbmQgfVwiXG4gICAgICAgIEBjbGljaz1cInNlbGVjdEJyYW5kKGJyYW5kLmtpbmQpXCJcbiAgICAgID5cbiAgICAgICAge3sgYnJhbmQubGFiZWwgfX1cbiAgICAgICAgPHNtYWxsIHYtaWY9XCJicmFuZC52aWEgPT09ICdtMSdcIj5uZWVkcyBhbiBNMSBvbiB0aGlzIG5ldHdvcms8L3NtYWxsPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9uYXY+XG5cbiAgICA8c2VjdGlvbiB2LWlmPVwic2VsZWN0ZWRLaW5kID09PSAnbTEnXCI+XG4gICAgICA8cCBjbGFzcz1cIm0zLWRsZ19fdGV4dFwiPlxuICAgICAgICBUeXBlIHRoZSBuYW1lIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuLCBvciBpdHMgSVAgYWRkcmVzcy5cbiAgICAgIDwvcD5cblxuICAgICAgPGZvcm1cbiAgICAgICAgY2xhc3M9XCJtMy1maWVsZFwiXG4gICAgICAgIGF1dG9jb21wbGV0ZT1cIm9mZlwiXG4gICAgICAgIEBzdWJtaXQucHJldmVudD1cInN1Ym1pdFwiXG4gICAgICA+XG4gICAgICAgIDxsYWJlbFxuICAgICAgICAgIGNsYXNzPVwibTMtZmllbGRfX2JveCBtMy1maWVsZF9fYm94LS1tb25vXCJcbiAgICAgICAgICA6Y2xhc3M9XCJgbTMtZmllbGRfX2JveC0tJHt0b25lfWBcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJzZWFyY2hcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgcmVmPVwiaW5wdXRcIlxuICAgICAgICAgICAgdi1tb2RlbD1cInVybFwiXG4gICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICBpbnB1dG1vZGU9XCJ1cmxcIlxuICAgICAgICAgICAgYXV0b2NhcGl0YWxpemU9XCJvZmZcIlxuICAgICAgICAgICAgc3BlbGxjaGVjaz1cImZhbHNlXCJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwibXVvbi1ib3h3b29kLTM2N2EubG9jYWxcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIlRoZSBwcmludGVyJ3MgbmFtZSBvciBJUCBhZGRyZXNzXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItYWRkcmVzc1wiXG4gICAgICAgICAgPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm0zLWRsZ19fbm90ZVwiPlxuICAgICAgICAgIFN1Y2ggYXMgPHNwYW4gY2xhc3M9XCJhaWRfX21vbm9cIj5tdW9uLWJveHdvb2QtMzY3YS5sb2NhbDwvc3Bhbj4gb3IgPHNwYW4gY2xhc3M9XCJhaWRfX21vbm9cIj4xOTIuMTY4LjEuMjA8L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvZm9ybT5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwic3RhdHVzXCJcbiAgICAgICAgY2xhc3M9XCJhaWRfX3N0YXR1c1wiXG4gICAgICAgIDpjbGFzcz1cImBhaWRfX3N0YXR1cy0tJHt0b25lfWBcIlxuICAgICAgICByb2xlPVwic3RhdHVzXCJcbiAgICAgICAgYXJpYS1saXZlPVwicG9saXRlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJhZGQtcHJpbnRlci1zdGF0dXNcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImFpZF9fc3RhdHVzLWljb25cIj5cbiAgICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgICAgdi1pZj1cIm91dGNvbWUgPT09ICdjaGVja2luZydcIlxuICAgICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgICAgc2l6ZT1cIjE2XCJcbiAgICAgICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICA6bmFtZT1cInN0YXR1c0ljb25cIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJhaWRfX3N0YXR1cy10ZXh0XCI+XG4gICAgICAgICAgPGI+e3sgc3RhdHVzLnRpdGxlIH19PC9iPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICB2LWlmPVwic3RhdHVzLmh0bWxcIlxuICAgICAgICAgICAgdi1odG1sPVwic3RhdHVzLmh0bWxcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHNwYW4gdi1lbHNlLWlmPVwic3RhdHVzLmRldGFpbFwiPnt7IHN0YXR1cy5kZXRhaWwgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIHYtaWY9XCJjYW5SZXRyeVwiXG4gICAgICAgICAgICBjbGFzcz1cImFpZF9fcmV0cnktcm93XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImFkZC1wcmludGVyLXJldHJ5XCJcbiAgICAgICAgICAgICAgQGNsaWNrPVwicmV0cnlcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBUcnkgYWdhaW5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cImFkZEhpbnRcIlxuICAgICAgICBjbGFzcz1cIm0zLWRsZ19fbm90ZSBhaWRfX3doeVwiXG4gICAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItd2h5XCJcbiAgICAgID5cbiAgICAgICAge3sgYWRkSGludCB9fVxuICAgICAgPC9wPlxuXG4gICAgICA8c2VjdGlvblxuICAgICAgICB2LWlmPVwiZm91bmQubGVuZ3RoIHx8IHNlYXJjaGluZ1wiXG4gICAgICAgIGNsYXNzPVwiYWlkX19mb3VuZFwiXG4gICAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItZm91bmRcIlxuICAgICAgPlxuICAgICAgICA8aDMgY2xhc3M9XCJhaWRfX2ZvdW5kLWhlYWRcIj5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cIndpZmlcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIEZvdW5kIG9uIHRoaXMgbmV0d29ya1xuICAgICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgICAgICB2LWlmPVwic2VhcmNoaW5nXCJcbiAgICAgICAgICAgIGluZGV0ZXJtaW5hdGVcbiAgICAgICAgICAgIHNpemU9XCIxMVwiXG4gICAgICAgICAgICB3aWR0aD1cIjJcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvaDM+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cImYgaW4gZm91bmRcIlxuICAgICAgICAgIDprZXk9XCJmLmtleVwiXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJhaWRfX2Nob2ljZVwiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYGFkZC1wcmludGVyLWZvdW5kLSR7Zi5rZXl9YFwiXG4gICAgICAgICAgQGNsaWNrPVwicGljayhmKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8cHJpbnRlci10aHVtYiA6c2l6ZT1cIjQwXCIgLz5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImFpZF9fY2hvaWNlLXRleHRcIj5cbiAgICAgICAgICAgIDxiPnt7IGYubmFtZSB9fTwvYj5cbiAgICAgICAgICAgIDxzcGFuPnt7IGYuZGV0YWlsIH19PC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImFpZF9fY2hvaWNlLWdvXCI+QWRkPC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwiIWZvdW5kLmxlbmd0aFwiXG4gICAgICAgICAgY2xhc3M9XCJtMy1kbGdfX25vdGVcIlxuICAgICAgICA+XG4gICAgICAgICAgTG9va2luZyBmb3IgcHJpbnRlcnMgb24gdGhpcyBuZXR3b3Jr4oCmXG4gICAgICAgIDwvcD5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8c2VjdGlvblxuICAgICAgdi1lbHNlLWlmPVwic2VsZWN0ZWRCcmFuZD8udmlhID09PSAnbTEnXCJcbiAgICAgIGNsYXNzPVwiYWlkX19icmlkZ2VcIlxuICAgID5cbiAgICAgIDxwPnt7IHNlbGVjdGVkQnJhbmQubGFiZWwgfX0gbmVlZHMgYW4gTTEgYnJpZGdlIG9uIHRoaXMgbmV0d29yay48L3A+XG4gICAgICA8b2w+XG4gICAgICAgIDxsaVxuICAgICAgICAgIHYtZm9yPVwic3RlcCBpbiBzZWxlY3RlZEJyYW5kLnN0ZXBzXCJcbiAgICAgICAgICA6a2V5PVwic3RlcFwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBzdGVwIH19XG4gICAgICAgIDwvbGk+XG4gICAgICA8L29sPlxuICAgICAgPGFcbiAgICAgICAgdi1pZj1cInNlbGVjdGVkQnJhbmQuZG9jc1wiXG4gICAgICAgIDpocmVmPVwic2VsZWN0ZWRCcmFuZC5kb2NzXCJcbiAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgcmVsPVwibm9vcGVuZXJcIlxuICAgICAgPk9wZW4gdGhlIG1hbnVmYWN0dXJlcidzIHNldHVwIGd1aWRlPC9hPlxuICAgICAgPHAgY2xhc3M9XCJtMy1kbGdfX25vdGVcIj5cbiAgICAgICAgVGhlIGJyaWRnZSBpcyBhIE11b24zRCBNMSB0aGF0IGlzIGFscmVhZHkgc2V0IHVwLiBObyBNMSB5ZXQ/IEFkZCBvbmUgZmlyc3QsIHRoZW4gY29tZSBiYWNrIHRvIHRoaXMgYnJhbmQuXG4gICAgICA8L3A+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItYnJpZGdlLW0xXCJcbiAgICAgICAgQGNsaWNrPVwic2VsZWN0QnJhbmQoJ20xJylcIlxuICAgICAgPlxuICAgICAgICBBZGQgeW91ciBNMSBmaXJzdFxuICAgICAgPC9idXR0b24+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPHNlY3Rpb25cbiAgICAgIHYtZWxzZS1pZj1cInNlbGVjdGVkQnJhbmRcIlxuICAgICAgY2xhc3M9XCJhaWRfX2ZvcmVpZ25cIlxuICAgID5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJtaXhlZENvbnRlbnRXYXJuaW5nXCJcbiAgICAgICAgY2xhc3M9XCJhaWRfX3dhcm5pbmdcIlxuICAgICAgPlxuICAgICAgICBGaXJlZm94IGFuZCBTYWZhcmkgYmxvY2sgdGhpcyBwYWdlIChodHRwcykgZnJvbSB0YWxraW5nIHRvIGEgcHJpbnRlciBvbiBwbGFpbiBodHRwIOKAlCB0aGF0J3MgbWl4ZWQgY29udGVudC4gQ2hyb21lIGNhbiByZWFjaCBwcmludGVycyBvbiB5b3VyIG5ldHdvcms6IG9wZW4gQ29udHJvbCBpbiBDaHJvbWUuXG4gICAgICA8L3A+XG4gICAgICA8cCBjbGFzcz1cIm0zLWRsZ19fdGV4dFwiPlxuICAgICAgICB7eyBzZWxlY3RlZEJyYW5kLmxhYmVsIH19IHN0YXlzIG9uIHRoaXMgbmV0d29yayBhbmQgaW4gdGhpcyBicm93c2VyLlxuICAgICAgPC9wPlxuICAgICAgPHAgY2xhc3M9XCJtMy1kbGdfX25vdGVcIj5cbiAgICAgICAgSW4gQ2hyb21lIG9uIGEgY29tcHV0ZXIgb3IgQW5kcm9pZCwgYWxsb3cgbG9jYWwgbmV0d29yayBhY2Nlc3Mgd2hlbiBhc2tlZC5cbiAgICAgIDwvcD5cbiAgICAgIDxsYWJlbCBjbGFzcz1cIm0zLWZpZWxkXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibTMtZGxnX19ub3RlXCI+UHJpbnRlciBhZGRyZXNzPC9zcGFuPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICB2LW1vZGVsLnRyaW09XCJmb3JlaWduSG9zdFwiXG4gICAgICAgICAgY2xhc3M9XCJhaWRfX2lucHV0XCJcbiAgICAgICAgICBwbGFjZWhvbGRlcj1cIjE5Mi4xNjguMS4yMFwiXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgPlxuICAgICAgPC9sYWJlbD5cbiAgICAgIDxsYWJlbCBjbGFzcz1cIm0zLWZpZWxkXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibTMtZGxnX19ub3RlXCI+TmFtZTwvc3Bhbj5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdi1tb2RlbC50cmltPVwiZm9yZWlnbk5hbWVcIlxuICAgICAgICAgIGNsYXNzPVwiYWlkX19pbnB1dFwiXG4gICAgICAgICAgOnBsYWNlaG9sZGVyPVwic2VsZWN0ZWRCcmFuZC5tb2RlbCB8fCBzZWxlY3RlZEJyYW5kLmxhYmVsXCJcbiAgICAgICAgPlxuICAgICAgPC9sYWJlbD5cbiAgICAgIDxsYWJlbCBjbGFzcz1cIm0zLWZpZWxkXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibTMtZGxnX19ub3RlXCI+TW9kZWw8L3NwYW4+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIHYtbW9kZWwudHJpbT1cImZvcmVpZ25Nb2RlbFwiXG4gICAgICAgICAgY2xhc3M9XCJhaWRfX2lucHV0XCJcbiAgICAgICAgICA6cGxhY2Vob2xkZXI9XCJzZWxlY3RlZEJyYW5kLm1vZGVsIHx8ICdNb2RlbCdcIlxuICAgICAgICA+XG4gICAgICA8L2xhYmVsPlxuICAgICAgPGxhYmVsIGNsYXNzPVwibTMtZmllbGRcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1kbGdfX25vdGVcIj5Gb3JtIGZhY3Rvcjwvc3Bhbj5cbiAgICAgICAgPHNlbGVjdFxuICAgICAgICAgIHYtbW9kZWw9XCJmb3JtRmFjdG9yXCJcbiAgICAgICAgICBjbGFzcz1cImFpZF9faW5wdXRcIlxuICAgICAgICA+XG4gICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImVuY2xvc2VkXCI+RW5jbG9zZWQ8L29wdGlvbj5cbiAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwib3Blbi1mcmFtZVwiPk9wZW4gZnJhbWU8L29wdGlvbj5cbiAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYmVkLXNsaW5nZXJcIj5CZWQgc2xpbmdlcjwvb3B0aW9uPlxuICAgICAgICA8L3NlbGVjdD5cbiAgICAgIDwvbGFiZWw+XG4gICAgICA8bGFiZWxcbiAgICAgICAgdi1pZj1cInNlbGVjdGVkS2luZCA9PT0gJ21vb25yYWtlcicgfHwgc2VsZWN0ZWRLaW5kID09PSAnb2N0b3ByaW50J1wiXG4gICAgICAgIGNsYXNzPVwibTMtZmllbGRcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm0zLWRsZ19fbm90ZVwiPnt7IHNlbGVjdGVkS2luZCA9PT0gJ29jdG9wcmludCcgPyAnQXBwbGljYXRpb24ga2V5JyA6ICdBUEkga2V5IChvcHRpb25hbCknIH19PC9zcGFuPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICB2LW1vZGVsPVwiYXBpS2V5XCJcbiAgICAgICAgICBjbGFzcz1cImFpZF9faW5wdXRcIlxuICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgPlxuICAgICAgPC9sYWJlbD5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cInNlbGVjdGVkS2luZCA9PT0gJ29jdG9wcmludCdcIlxuICAgICAgICBjbGFzcz1cImFpZF9fc3RlcHNcIlxuICAgICAgPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgICBAY2xpY2s9XCJhc2tPY3RvUHJpbnRGb3JLZXlcIlxuICAgICAgICA+XG4gICAgICAgICAgQXNrIE9jdG9QcmludCBmb3IgYSBrZXlcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxzcGFuPnt7IGFwcEtleU1lc3NhZ2UgfX08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxsYWJlbFxuICAgICAgICB2LWlmPVwic2VsZWN0ZWRLaW5kID09PSAnbW9vbnJha2VyJyB8fCBzZWxlY3RlZEtpbmQgPT09ICdvY3RvcHJpbnQnXCJcbiAgICAgICAgY2xhc3M9XCJhaWRfX3JlbWVtYmVyXCJcbiAgICAgID5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdi1tb2RlbD1cInJlbWVtYmVyQ3JlZGVudGlhbHNcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5SZW1lbWJlckNyZWRlbnRpYWxzXCJcbiAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICA+XG4gICAgICAgIFJlbWVtYmVyIG9uIHRoaXMgZGV2aWNlXG4gICAgICA8L2xhYmVsPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIiFjYW5SZW1lbWJlckNyZWRlbnRpYWxzICYmIChzZWxlY3RlZEtpbmQgPT09ICdtb29ucmFrZXInIHx8IHNlbGVjdGVkS2luZCA9PT0gJ29jdG9wcmludCcpXCJcbiAgICAgICAgY2xhc3M9XCJtMy1kbGdfX25vdGVcIlxuICAgICAgPlxuICAgICAgICBUbyByZW1lbWJlciB0aGlzIGtleSwgb3BlbiBDb250cm9sIG92ZXIgSFRUUFMgaW4gQ2hyb21lLiBIZXJlLCBpdCBsYXN0cyBmb3IgdGhpcyBzZXNzaW9uLlxuICAgICAgPC9wPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cInByb2JlTWVzc2FnZVwiXG4gICAgICAgIGNsYXNzPVwibTMtZGxnX19ub3RlXCJcbiAgICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItcHJvYmVcIlxuICAgICAgPlxuICAgICAgICB7eyBwcm9iZU1lc3NhZ2UgfX1cbiAgICAgIDwvcD5cbiAgICAgIDxkZXRhaWxzXG4gICAgICAgIHYtaWY9XCJwcm9iZURldGFpbFwiXG4gICAgICAgIGNsYXNzPVwibTMtZGxnX19ub3RlIGFpZF9fZGV0YWlsc1wiXG4gICAgICA+XG4gICAgICAgIDxzdW1tYXJ5PkRldGFpbHM8L3N1bW1hcnk+XG4gICAgICAgIDxjb2RlPnt7IHByb2JlRGV0YWlsIH19PC9jb2RlPlxuICAgICAgPC9kZXRhaWxzPlxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwic2VsZWN0ZWRLaW5kID09PSAnbW9vbnJha2VyJ1wiXG4gICAgICAgIGNsYXNzPVwiYWlkX19zZXR1cFwiXG4gICAgICA+XG4gICAgICAgIDxwPkFsbG93IHRoaXMgYnJvd3NlciBpbiBNb29ucmFrZXI6PC9wPlxuICAgICAgICA8cHJlPlthdXRob3JpemF0aW9uXVxuY29yc19kb21haW5zOlxuICAgICAgICB7eyBjdXJyZW50T3JpZ2luIH19PC9wcmU+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgIEBjbGljaz1cImNvcHlNb29ucmFrZXJTZXR1cFwiXG4gICAgICAgID5cbiAgICAgICAgICBDb3B5XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8cD5SZXN0YXJ0IE1vb25yYWtlci48L3A+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJzZWxlY3RlZEJyYW5kLnN0ZXBzLmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwibTMtZGxnX19ub3RlXCJcbiAgICAgID5cbiAgICAgICAge3sgc2VsZWN0ZWRCcmFuZC5zdGVwcy5qb2luKCcgJykgfX1cbiAgICAgIDwvcD5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgOmRpc2FibGVkPVwicHJvYmluZyB8fCAhZm9yZWlnbkhvc3QudHJpbSgpXCJcbiAgICAgICAgQGNsaWNrPVwicHJvYmVGb3JlaWduXCJcbiAgICAgID5cbiAgICAgICAge3sgcHJvYmluZyA/ICdDaGVja2luZ+KApicgOiAnQ2hlY2sgcHJpbnRlcicgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cIiFmb3JlaWduVmVyaWZpZWRcIlxuICAgICAgICBjbGFzcz1cIm0zLWRsZ19fbm90ZSBhaWRfX3doeVwiXG4gICAgICAgIGRhdGEtdGlkPVwiYWRkLXByaW50ZXItZm9yZWlnbi13aHlcIlxuICAgICAgPlxuICAgICAgICB7eyBmb3JlaWduSG9zdC50cmltKCkgPyAnQWRkIHByaW50ZXIgdHVybnMgb24gb25jZSBDaGVjayBwcmludGVyIGZpbmRzIGl0LicgOiAnVHlwZSB0aGUgYWRkcmVzcyBhYm92ZSwgdGhlbiBwcmVzcyBDaGVjayBwcmludGVyLicgfX1cbiAgICAgIDwvcD5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8dGVtcGxhdGUgI2FjdGlvbnM+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtaWY9XCJzZWxlY3RlZEtpbmQgPT09ICdtMSdcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJhZGQtcHJpbnRlci1jYW5jZWxcIlxuICAgICAgICBAY2xpY2s9XCJvcGVuID0gZmFsc2VcIlxuICAgICAgPlxuICAgICAgICBDYW5jZWxcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWlmPVwic2VsZWN0ZWRLaW5kID09PSAnbTEnXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgOmRpc2FibGVkPVwiIXZlcmlmaWVkXCJcbiAgICAgICAgZGF0YS10aWQ9XCJhZGQtcHJpbnRlci1hZGRcIlxuICAgICAgICBAY2xpY2s9XCJhZGRJbnN0YW5jZVwiXG4gICAgICA+XG4gICAgICAgIHt7IGFkZExhYmVsIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1lbHNlLWlmPVwic2VsZWN0ZWRCcmFuZD8udmlhID09PSAnZGlyZWN0J1wiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFmb3JlaWduVmVyaWZpZWRcIlxuICAgICAgICBAY2xpY2s9XCJzYXZlRm9yZWlnblByaW50ZXJcIlxuICAgICAgPlxuICAgICAgICBBZGQgcHJpbnRlclxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9tMy1kaWFsb2c+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AsIFZNb2RlbCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcydcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHsgRGVib3VuY2UgfSBmcm9tICd2dWUtZGVib3VuY2UtZGVjb3JhdG9yJ1xuaW1wb3J0IHsgY29uc29sYSB9IGZyb20gJ2NvbnNvbGEnXG5pbXBvcnQgd2ViU29ja2V0V3JhcHBlciBmcm9tICdAL3V0aWwvd2ViLXNvY2tldC13cmFwcGVyJ1xuaW1wb3J0IHsgZXNjYXBlSHRtbCwgcGFnZUJsb2Nrc1ByaW50ZXIsIHByaW50ZXJQYWdlVXJsIH0gZnJvbSAnQC91dGlsL3BhZ2UtYmxvY2tzLXByaW50ZXInXG5pbXBvcnQgeyBkaXNjb3ZlcnlTdGF0ZSwgaW5zdGFuY2VGb3IsIHBhZ2VCbG9ja3NMYW5JcHY0LCBwcm9iZUFkZHJlc3MsIHR5cGUgTGFuUHJpbnRlciB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXNjb3ZlcnknXG5pbXBvcnQgTTNEaWFsb2cgZnJvbSAnQC9jb21wb25lbnRzL3VpL00zRGlhbG9nLnZ1ZSdcbmltcG9ydCBQcmludGVyVGh1bWIgZnJvbSAnQC9jb21wb25lbnRzL3VpL1ByaW50ZXJUaHVtYi52dWUnXG5pbXBvcnQgeyByZXF1ZXN0T2N0b1ByaW50S2V5IH0gZnJvbSAnQC9zZXJ2aWNlcy9mb3JlaWduLXByaW50ZXJzL2FwcGtleXMnXG5pbXBvcnQgeyBGT1JFSUdOX0JSQU5EUywgZm9yZWlnbkJyYW5kIH0gZnJvbSAnQC9zZXJ2aWNlcy9mb3JlaWduLXByaW50ZXJzL2JyYW5kcydcbmltcG9ydCB0eXBlIHsgRm9yZWlnbktpbmQsIEZvcm1GYWN0b3IgfSBmcm9tICdAL3NlcnZpY2VzL2ZvcmVpZ24tcHJpbnRlcnMvdHlwZXMnXG5pbXBvcnQgeyBsYW5GZXRjaCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXNjb3ZlcnknXG5pbXBvcnQgeyBibG9ja3NGb3JlaWduSHR0cCB9IGZyb20gJ0AvdXRpbC9icm93c2VyLWZhbWlseSdcbmltcG9ydCB7IGxvY2FsSG9zdCB9IGZyb20gJ0Avc2VydmljZXMvZm9yZWlnbi1wcmludGVycy9hZGRyZXNzJ1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCdcblxuLyoqIEEgcHJpbnRlciBmb3VuZCBvbiB0aGlzIG5ldHdvcmsgdGhhdCBpc24ndCBzYXZlZCB5ZXQ6IG9uZSB0YXAgYWRkcyBpdC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm91bmRDaG9pY2Uge1xuICBrZXk6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBkZXRhaWw6IHN0cmluZztcbn1cblxuLyoqXG4gKiBXaGF0IHRoZSBjaGVjayBvZiBhIHR5cGVkIGFkZHJlc3MgZm91bmQ6XG4gKiAtIGBtdW9uYDogYSBNdW9uIHByaW50ZXIgYW5zd2VyZWQsIGFuZCBzYWlkIHdobyBpdCBpcy5cbiAqIC0gYGxvY2tlZGA6IGEgcHJpbnRlciBhbnN3ZXJlZCwgYW5kIHdhbnRzIGEgc2lnbi1pbi5cbiAqIC0gYGtsaXBwZXJgOiBhIHByaW50ZXIgYW5zd2VyZWQsIGJ1dCBub3QgYSBNdW9uIG9uZS5cbiAqIC0gYGNvcnNgOiBzb21ldGhpbmcgYW5zd2VyZWQsIGJ1dCB3b24ndCBsZXQgdGhpcyBwYWdlIHRhbGsgdG8gaXQuXG4gKiAtIGBibG9ja2VkYDogdGhpcyBicm93c2VyIHN0b3BwZWQgdGhlIGNoZWNrIGJlZm9yZSBpdCBsZWZ0LlxuICogLSBgdW5yZWFjaGFibGVgOiBub3RoaW5nIGFuc3dlcmVkLlxuICogLSBgbm90LXByaW50ZXJgOiBzb21ldGhpbmcgYW5zd2VyZWQsIGJ1dCBpc24ndCBhIHByaW50ZXIuXG4gKi9cbmV4cG9ydCB0eXBlIEFkZE91dGNvbWUgPSAnaWRsZScgfCAnY2hlY2tpbmcnIHwgJ2ludmFsaWQnIHwgJ211b24nIHwgJ2xvY2tlZCcgfCAna2xpcHBlcicgfCAnY29ycycgfCAnYmxvY2tlZCcgfCAndW5yZWFjaGFibGUnIHwgJ25vdC1wcmludGVyJ1xuXG4vKiogV2hhdCBhIGZhaWxlZCBjaGVjayBvZiBhIHByaW50ZXIncyBhZGRyZXNzIG1lYW5zLCBpbiBhIHNlbnRlbmNlLiBUaGUgcmF3IHRleHQgc3RheXMgYmVoaW5kIERldGFpbHMuICovXG5leHBvcnQgZnVuY3Rpb24gcGxhaW5Qcm9iZUVycm9yIChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgvdGltZWQgb3V0L2kudGVzdChyYXcpKSByZXR1cm4gJ1RoZSBwcmludGVyIGRpZCBub3QgYW5zd2VyIGluIHRpbWUuIENoZWNrIGl0IGlzIHN3aXRjaGVkIG9uIGFuZCBvbiB0aGlzIG5ldHdvcmssIHRoZW4gdHJ5IGFnYWluLidcbiAgY29uc3Qgc3RhdHVzID0gL0hUVFAgKFxcZHszfSkvLmV4ZWMocmF3KT8uWzFdXG4gIGlmIChzdGF0dXMgPT09ICc0MDEnIHx8IHN0YXR1cyA9PT0gJzQwMycpIHJldHVybiAnVGhlIHByaW50ZXIgd2FudHMgYSBrZXkuIEVudGVyIGl0cyBBUEkga2V5IGFib3ZlLCB0aGVuIGNoZWNrIGFnYWluLidcbiAgaWYgKHN0YXR1cykgcmV0dXJuICdTb21ldGhpbmcgYW5zd2VyZWQsIGJ1dCBub3QgYXMgdGhpcyBraW5kIG9mIHByaW50ZXIgZG9lcy4gQ2hlY2sgdGhlIGFkZHJlc3MgYW5kIHRoZSBicmFuZCwgdGhlbiB0cnkgYWdhaW4uJ1xuICByZXR1cm4gJ0NvdWxkIG5vdCByZWFjaCB0aGUgcHJpbnRlci4gQ2hlY2sgdGhlIGFkZHJlc3MgbWF0Y2hlcyB0aGUgb25lIG9uIGl0cyBzY3JlZW4sIHRoZW4gdHJ5IGFnYWluLidcbn1cblxuLyoqXG4gKiBBZGQgYSBwcmludGVyOiBpdHMgbmFtZSBvciBJUCBhZGRyZXNzLCBjaGVja2VkIGJlZm9yZSBpdCdzIGFkZGVkLCBvciBvbmVcbiAqIGZvdW5kIG9uIHRoaXMgbmV0d29yayBpbiBvbmUgdGFwLiBBIE11b24gcHJpbnRlciBhbnN3ZXJzIGJ5IElQIGFkZHJlc3MsXG4gKiBieSBpdHMgbmFtZSAobXVvbi1ib3h3b29kLTM2N2EpIGFuZCBieSBpdHMgbmFtZSB3aXRoIC5sb2NhbCwgYW5kIHNheXMgd2hvXG4gKiBpdCBpczsgYW55dGhpbmcgZWxzZSBpcyBhc2tlZCBhcyBNb29ucmFrZXIuIFdoYXQgdGhlIGNoZWNrIGZvdW5kIGlzIHNhaWRcbiAqIGluIHBsYWluIHdvcmRzOiBmb3VuZCwgd2FudHMgYSBzaWduLWluLCBub3QgYSBNdW9uIHByaW50ZXIsIG5vdGhpbmcgdGhlcmUsXG4gKiBvciB0aGUgYnJvd3NlciBibG9ja2VkIGl0LlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNM0RpYWxvZywgUHJpbnRlclRodW1iIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFkZEluc3RhbmNlRGlhbG9nIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIC8qKiBQcmludGVycyBmb3VuZCBvbiB0aGlzIG5ldHdvcmsgYW5kIG5vdCBzYXZlZCB5ZXQgKHRoZSBQcmludGVycyBwYWdlIHBhc3NlcyB0aGVtKS4gKi9cbiAgQFByb3AoeyB0eXBlOiBBcnJheSwgZGVmYXVsdDogKCkgPT4gW10gfSlcbiAgcmVhZG9ubHkgZm91bmQhOiBGb3VuZENob2ljZVtdXG5cbiAgLyoqIFRoZSBuZXR3b3JrIGlzIHN0aWxsIGJlaW5nIHNlYXJjaGVkLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgc2VhcmNoaW5nITogYm9vbGVhblxuXG4gIHZhbGlkID0gdHJ1ZVxuICB2ZXJpZnlpbmcgPSBmYWxzZVxuICB2ZXJpZmllZCA9IGZhbHNlXG4gIG91dGNvbWU6IEFkZE91dGNvbWUgPSAnaWRsZSdcbiAgLyoqIFdoYXQgZmFpbGVkLCBhcyB0aGUgYnJvd3NlciBzYWlkIGl0LiAqL1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgLyoqIEEgbm90ZSB3aXRoIGEgd2F5IHJvdW5kIChhIGxpbmspLCBpdHMgdmFsdWVzIGVzY2FwZWQuICovXG4gIG5vdGU6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgTXVvbjNEIHByaW50ZXIgdGhhdCBhbnN3ZXJlZCBmb3Igd2hhdCB3YXMgdHlwZWQsIGJ5IElQIGFkZHJlc3Mgb3IgYnkgbmFtZS4gKi9cbiAgcmVzb2x2ZWQ6IExhblByaW50ZXIgfCBudWxsID0gbnVsbFxuICB1cmwgPSAnJ1xuICBzZWxlY3RlZEtpbmQ6IEZvcmVpZ25LaW5kIHwgJ20xJyA9ICdtMSdcbiAgZm9yZWlnbkhvc3QgPSAnJ1xuICBmb3JlaWduTmFtZSA9ICcnXG4gIGZvcmVpZ25Nb2RlbCA9ICcnXG4gIGZvcm1GYWN0b3I6IEZvcm1GYWN0b3IgPSAnYmVkLXNsaW5nZXInXG4gIGFwaUtleSA9ICcnXG4gIHJlbWVtYmVyQ3JlZGVudGlhbHMgPSBmYWxzZVxuICBwcm9iaW5nID0gZmFsc2VcbiAgZm9yZWlnblZlcmlmaWVkID0gZmFsc2VcbiAgcHJvYmVNZXNzYWdlID0gJydcbiAgLyoqIFdoYXQgdGhlIGJyb3dzZXIgb3IgcHJpbnRlciBzYWlkLCBmb3IgYSBzbWFsbCBEZXRhaWxzIGxpbmUuICovXG4gIHByb2JlRGV0YWlsID0gJydcbiAgYXBwS2V5TWVzc2FnZSA9ICcnXG5cbiAgYWJvcnRDb250cm9sbGVyPzogQWJvcnRDb250cm9sbGVyID0gdW5kZWZpbmVkXG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gKHRoaXMuJHJlZnMuaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCB8IHVuZGVmaW5lZCk/LmZvY3VzKCkpXG4gIH1cblxuICBnZXQgYnJhbmRDaG9pY2VzICgpIHtcbiAgICByZXR1cm4gW3sga2luZDogJ20xJyBhcyBjb25zdCwgbGFiZWw6ICdNdW9uM0QgTTEnLCB2aWE6ICdkaXJlY3QnIGFzIGNvbnN0IH0sIC4uLkZPUkVJR05fQlJBTkRTXVxuICB9XG5cbiAgZ2V0IHNlbGVjdGVkQnJhbmQgKCkge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGVkS2luZCA9PT0gJ20xJyA/IG51bGwgOiBmb3JlaWduQnJhbmQodGhpcy5zZWxlY3RlZEtpbmQpXG4gIH1cblxuICBnZXQgbWl4ZWRDb250ZW50V2FybmluZyAoKSB7XG4gICAgcmV0dXJuIGJsb2Nrc0ZvcmVpZ25IdHRwKCkgJiYgcGFnZUJsb2Nrc1ByaW50ZXIoYGh0dHA6Ly8ke3RoaXMuZm9yZWlnbkhvc3R9YClcbiAgfVxuXG4gIGdldCBjdXJyZW50T3JpZ2luICgpIHsgcmV0dXJuIGxvY2F0aW9uLm9yaWdpbiB9XG4gIGdldCBjYW5SZW1lbWJlckNyZWRlbnRpYWxzICgpIHsgcmV0dXJuICEhY3J5cHRvLnN1YnRsZSB9XG5cbiAgQFdhdGNoKCdmb3JlaWduSG9zdCcpXG4gIEBXYXRjaCgnYXBpS2V5JylcbiAgaW52YWxpZGF0ZUZvcmVpZ25Qcm9iZSAoKSB7XG4gICAgdGhpcy5mb3JlaWduVmVyaWZpZWQgPSBmYWxzZVxuICAgIHRoaXMucHJvYmVNZXNzYWdlID0gJydcbiAgICB0aGlzLnByb2JlRGV0YWlsID0gJydcbiAgfVxuXG4gIHNlbGVjdEJyYW5kIChraW5kOiBGb3JlaWduS2luZCB8ICdtMScpIHtcbiAgICB0aGlzLnNlbGVjdGVkS2luZCA9IGtpbmRcbiAgICB0aGlzLmZvcmVpZ25WZXJpZmllZCA9IGZhbHNlXG4gICAgdGhpcy5wcm9iZU1lc3NhZ2UgPSAnJ1xuICAgIHRoaXMuYXBpS2V5ID0gJydcbiAgICB0aGlzLnJlbWVtYmVyQ3JlZGVudGlhbHMgPSBmYWxzZVxuICAgIHRoaXMuYXBwS2V5TWVzc2FnZSA9ICcnXG4gICAgaWYgKGtpbmQgIT09ICdtMScpIHtcbiAgICAgIGNvbnN0IGJyYW5kID0gZm9yZWlnbkJyYW5kKGtpbmQpXG4gICAgICB0aGlzLmZvcmVpZ25Nb2RlbCA9IGJyYW5kLm1vZGVsID8/ICcnXG4gICAgICB0aGlzLmZvcmVpZ25OYW1lID0gYnJhbmQubW9kZWwgfHwgYnJhbmQubGFiZWxcbiAgICAgIHRoaXMuZm9ybUZhY3RvciA9IGJyYW5kLmZvcm1GYWN0b3JcbiAgICB9XG4gIH1cblxuICBhc3luYyBwcm9iZUZvcmVpZ24gKCkge1xuICAgIGlmICghdGhpcy5zZWxlY3RlZEJyYW5kIHx8IHRoaXMuc2VsZWN0ZWRCcmFuZC52aWEgIT09ICdkaXJlY3QnKSByZXR1cm5cbiAgICB0aGlzLnByb2JpbmcgPSB0cnVlXG4gICAgdGhpcy5mb3JlaWduVmVyaWZpZWQgPSBmYWxzZVxuICAgIHRoaXMucHJvYmVNZXNzYWdlID0gJydcbiAgICB0aGlzLnByb2JlRGV0YWlsID0gJydcbiAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5mb3JlaWduSG9zdC50cmltKClcbiAgICBjb25zdCBraW5kID0gdGhpcy5zZWxlY3RlZEtpbmRcbiAgICBjb25zdCBrZXkgPSB0aGlzLmFwaUtleVxuICAgIGNvbnN0IGN1cnJlbnQgPSAoKSA9PiB0aGlzLnNlbGVjdGVkS2luZCA9PT0ga2luZCAmJiB0aGlzLmZvcmVpZ25Ib3N0LnRyaW0oKSA9PT0gYWRkcmVzcyAmJiB0aGlzLmFwaUtleSA9PT0ga2V5XG4gICAgY29uc3QgdGltZW91dCA9IChwcm9taXNlOiBQcm9taXNlPGFueT4pID0+IFByb21pc2UucmFjZShbXG4gICAgICBwcm9taXNlLFxuICAgICAgbmV3IFByb21pc2UoKF9yZXNvbHZlLCByZWplY3QpID0+IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignQ2hlY2sgdGltZWQgb3V0JykpLCA1MDAwKSlcbiAgICBdKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBob3N0ID0gbG9jYWxIb3N0KGFkZHJlc3MpXG4gICAgICBpZiAoa2luZCA9PT0gJ21vb25yYWtlcicpIHtcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IGtleSA/IHsgJ1gtQXBpLUtleSc6IGtleSB9IDogdW5kZWZpbmVkXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGltZW91dChsYW5GZXRjaChgaHR0cDovLyR7aG9zdH0vc2VydmVyL2luZm9gLCB7IGhlYWRlcnMsIGNhY2hlOiAnbm8tc3RvcmUnLCByZWRpcmVjdDogJ2Vycm9yJyB9KSlcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWApXG4gICAgICAgIGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICAgICAgfSBlbHNlIGlmIChraW5kID09PSAnb2N0b3ByaW50Jykge1xuICAgICAgICBjb25zdCBoZWFkZXJzID0ga2V5ID8geyAnWC1BcGktS2V5Jzoga2V5IH0gOiB1bmRlZmluZWRcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aW1lb3V0KGxhbkZldGNoKGBodHRwOi8vJHtob3N0fS9hcGkvdmVyc2lvbmAsIHsgaGVhZGVycywgY2FjaGU6ICduby1zdG9yZScsIHJlZGlyZWN0OiAnZXJyb3InIH0pKVxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YClcbiAgICAgICAgYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aW1lb3V0KG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBjcmVhbGl0eSA9IGtpbmQgPT09ICdjcmVhbGl0eSdcbiAgICAgICAgICBjb25zdCBob3N0bmFtZSA9IG5ldyBVUkwoYGh0dHA6Ly8ke2hvc3R9YCkuaG9zdG5hbWVcbiAgICAgICAgICBjb25zdCBzb2NrZXQgPSBuZXcgV2ViU29ja2V0KGNyZWFsaXR5ID8gYHdzOi8vJHtob3N0bmFtZX06OTk5OWAgOiBgd3M6Ly8ke2hvc3RuYW1lfTozMDMwL3dlYnNvY2tldGAsIGNyZWFsaXR5ID8gJ3dzc2xpY2VyJyA6IHVuZGVmaW5lZClcbiAgICAgICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4geyBzb2NrZXQuY2xvc2UoKTsgcmVqZWN0KG5ldyBFcnJvcignQ2hlY2sgdGltZWQgb3V0JykpIH0sIDUwMDApXG4gICAgICAgICAgc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjcmVhbGl0eSkgc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBtZXRob2Q6ICdnZXQnLCBwYXJhbXM6IHsgUmVxUHJpbnRlclBhcmE6IDEgfSB9KSlcbiAgICAgICAgICAgIGVsc2Ugc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBJZDogJycsIERhdGE6IHsgQ21kOiAxLCBEYXRhOiB7fSwgUmVxdWVzdElEOiB1dWlkdjQoKS5yZXBsYWNlKC8tL2csICcnKSwgTWFpbmJvYXJkSUQ6ICcnLCBUaW1lU3RhbXA6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLCBGcm9tOiAxIH0sIFRvcGljOiAnc2RjcC9yZXF1ZXN0LycgfSkpXG4gICAgICAgICAgfVxuICAgICAgICAgIHNvY2tldC5vbm1lc3NhZ2UgPSBldmVudCA9PiB7XG4gICAgICAgICAgICBpZiAoIWNyZWFsaXR5KSB7XG4gICAgICAgICAgICAgIHRyeSB7IGlmICghSlNPTi5wYXJzZShldmVudC5kYXRhKS5NYWluYm9hcmRJRCkgcmV0dXJuIH0gY2F0Y2ggeyByZXR1cm4gfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgICAgc29ja2V0LmNsb3NlKClcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBzb2NrZXQub25lcnJvciA9ICgpID0+IHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgc29ja2V0LmNsb3NlKCk7IHJlamVjdChuZXcgRXJyb3IoJ0NvdWxkIG5vdCByZWFjaCB0aGUgcHJpbnRlcicpKSB9XG4gICAgICAgIH0pKVxuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50KCkpIHJldHVyblxuICAgICAgdGhpcy5mb3JlaWduVmVyaWZpZWQgPSB0cnVlXG4gICAgICB0aGlzLnByb2JlTWVzc2FnZSA9ICdQcmludGVyIGZvdW5kLidcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGN1cnJlbnQoKSkge1xuICAgICAgICBjb25zdCByYXcgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgdGhpcy5wcm9iZU1lc3NhZ2UgPSBwbGFpblByb2JlRXJyb3IocmF3KVxuICAgICAgICB0aGlzLnByb2JlRGV0YWlsID0gcmF3XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMucHJvYmluZyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYXNrT2N0b1ByaW50Rm9yS2V5ICgpIHtcbiAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5mb3JlaWduSG9zdC50cmltKClcbiAgICB0cnkge1xuICAgICAgY29uc3QgaG9zdCA9IGxvY2FsSG9zdChhZGRyZXNzKVxuICAgICAgY29uc3Qga2V5ID0gYXdhaXQgcmVxdWVzdE9jdG9QcmludEtleShob3N0LCB7IGZldGNoOiBsYW5GZXRjaCB9LCB7XG4gICAgICAgIG9uUGVuZGluZzogKCkgPT4geyB0aGlzLmFwcEtleU1lc3NhZ2UgPSAnQXBwcm92ZSBpbiBPY3RvUHJpbnQuJyB9XG4gICAgICB9KVxuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRLaW5kICE9PSAnb2N0b3ByaW50JyB8fCB0aGlzLmZvcmVpZ25Ib3N0LnRyaW0oKSAhPT0gYWRkcmVzcykgcmV0dXJuXG4gICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuYXBwS2V5TWVzc2FnZSA9ICdBcHAga2V5cyBhcmUgbm90IGF2YWlsYWJsZSBoZXJlLiBFbnRlciBhbiBBUEkga2V5IGFib3ZlLidcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLmFwaUtleSA9IGtleVxuICAgICAgdGhpcy5hcHBLZXlNZXNzYWdlID0gJ0FQSSBrZXkgYXBwcm92ZWQuJ1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLmFwcEtleU1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm1lc3NhZ2UgPT09ICdkZW5pZWQnXG4gICAgICAgID8gJ1RoZSBrZXkgcmVxdWVzdCB3YXMgZGVuaWVkIG9yIHRpbWVkIG91dC4nXG4gICAgICAgIDogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnQ291bGQgbm90IHJlcXVlc3QgYW4gQVBJIGtleS4nXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY29weU1vb25yYWtlclNldHVwICgpIHtcbiAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkPy53cml0ZVRleHQoYFthdXRob3JpemF0aW9uXVxcbmNvcnNfZG9tYWluczpcXG4gICR7bG9jYXRpb24ub3JpZ2lufWApXG4gIH1cblxuICBhc3luYyBzYXZlRm9yZWlnblByaW50ZXIgKCkge1xuICAgIGlmICghdGhpcy5zZWxlY3RlZEJyYW5kIHx8ICF0aGlzLmZvcmVpZ25WZXJpZmllZCkgcmV0dXJuXG4gICAgY29uc3QgeyBzYXZlRm9yZWlnbiB9ID0gYXdhaXQgaW1wb3J0KCdAL3NlcnZpY2VzL2ZvcmVpZ24tcHJpbnRlcnMvc3RvcmUnKVxuICAgIGF3YWl0IHNhdmVGb3JlaWduKHtcbiAgICAgIGtpbmQ6IHRoaXMuc2VsZWN0ZWRLaW5kIGFzIEZvcmVpZ25LaW5kLFxuICAgICAgbmFtZTogdGhpcy5mb3JlaWduTmFtZSB8fCB0aGlzLmZvcmVpZ25Nb2RlbCB8fCB0aGlzLnNlbGVjdGVkQnJhbmQubGFiZWwsXG4gICAgICBtb2RlbDogdGhpcy5mb3JlaWduTW9kZWwgfHwgdW5kZWZpbmVkLFxuICAgICAgaG9zdDogdGhpcy5mb3JlaWduSG9zdCxcbiAgICAgIHZpYTogJ2RpcmVjdCcsXG4gICAgICBmb3JtRmFjdG9yOiB0aGlzLmZvcm1GYWN0b3JcbiAgICB9LCB0aGlzLmFwaUtleSA/IHsgYXBpS2V5OiB0aGlzLmFwaUtleSB9IDogbnVsbCwgeyByZW1lbWJlcjogdGhpcy5yZW1lbWJlckNyZWRlbnRpYWxzIH0pXG4gICAgY29uc3QgbGl2ZSA9IGF3YWl0IGltcG9ydCgnQC9zZXJ2aWNlcy9mb3JlaWduLXByaW50ZXJzL2xpdmUnKVxuICAgIGF3YWl0IGxpdmUucmVmcmVzaEZvcmVpZ24oKVxuICAgIGF3YWl0IGxpdmUuY29ubmVjdEFsbCgpXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICB0aGlzLiRlbWl0KCdzYXZlZCcpXG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGVzIGEgVVJMXG4gICAqL1xuICB2YWxpZFVybCAodXJsOiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy4kZmlsdGVycy5nZXRBcGlVcmxzKHVybClcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZ2V0IGhvc3RlZCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5ob3N0Q29uZmlnLmhvc3RlZFxuICB9XG5cbiAgLyoqIFdoYXQgd2FzIHR5cGVkLCB3aXRob3V0IGEgc2NoZW1lIG9yIGEgdHJhaWxpbmcgc2xhc2gsIGZvciB0aGUgc3RhdHVzIGxpbmUuICovXG4gIGdldCB0eXBlZCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy51cmwudHJpbSgpLnJlcGxhY2UoL15bYS16XSs6XFwvXFwvL2ksICcnKS5yZXBsYWNlKC9cXC8rJC8sICcnKVxuICB9XG5cbiAgZ2V0IHRvbmUgKCk6ICdvaycgfCAnd2FybicgfCAnZXJyJyB8ICdvZmYnIHtcbiAgICBzd2l0Y2ggKHRoaXMub3V0Y29tZSkge1xuICAgICAgY2FzZSAnbXVvbic6IHJldHVybiAnb2snXG4gICAgICBjYXNlICdsb2NrZWQnOlxuICAgICAgY2FzZSAna2xpcHBlcic6XG4gICAgICBjYXNlICdibG9ja2VkJzogcmV0dXJuICd3YXJuJ1xuICAgICAgY2FzZSAnY29ycyc6XG4gICAgICBjYXNlICd1bnJlYWNoYWJsZSc6XG4gICAgICBjYXNlICdub3QtcHJpbnRlcic6XG4gICAgICBjYXNlICdpbnZhbGlkJzogcmV0dXJuICdlcnInXG4gICAgICBkZWZhdWx0OiByZXR1cm4gJ29mZidcbiAgICB9XG4gIH1cblxuICBnZXQgc3RhdHVzSWNvbiAoKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHRoaXMub3V0Y29tZSkge1xuICAgICAgY2FzZSAnbXVvbic6IHJldHVybiAnY2hlY2snXG4gICAgICBjYXNlICdsb2NrZWQnOiByZXR1cm4gJ2xvY2snXG4gICAgICBkZWZhdWx0OiByZXR1cm4gJ2FsZXJ0J1xuICAgIH1cbiAgfVxuXG4gIGdldCBzdGF0dXMgKCk6IHsgdGl0bGU6IHN0cmluZywgZGV0YWlsPzogc3RyaW5nLCBodG1sPzogc3RyaW5nIH0gfCBudWxsIHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5yZXNvbHZlZD8ubmFtZVxuICAgIHN3aXRjaCAodGhpcy5vdXRjb21lKSB7XG4gICAgICBjYXNlICdjaGVja2luZyc6XG4gICAgICAgIHJldHVybiB7IHRpdGxlOiBgTG9va2luZyBmb3IgJHt0aGlzLnR5cGVkfeKApmAgfVxuICAgICAgY2FzZSAnaW52YWxpZCc6XG4gICAgICAgIHJldHVybiB7IHRpdGxlOiBcIlRoYXQgaXNuJ3QgYW4gYWRkcmVzc1wiLCBkZXRhaWw6ICdUeXBlIGEgbmFtZSBzdWNoIGFzIG11b24tYm94d29vZC0zNjdhLmxvY2FsLCBvciBhbiBJUCBhZGRyZXNzIHN1Y2ggYXMgMTkyLjE2OC4xLjIwLicgfVxuICAgICAgY2FzZSAnbXVvbic6XG4gICAgICAgIHJldHVybiB7IHRpdGxlOiBgRm91bmQgJHtuYW1lfWAsIGRldGFpbDogYEF0ICR7dGhpcy5yZXNvbHZlZD8uaG9zdH0uIEFkZCBpdCB0byBzZWUgaXQgaGVyZSB3aXRoIHlvdXIgb3RoZXIgcHJpbnRlcnMuYCB9XG4gICAgICBjYXNlICdsb2NrZWQnOlxuICAgICAgICByZXR1cm4geyB0aXRsZTogYCR7bmFtZSA/PyAnVGhpcyBwcmludGVyJ30gd2FudHMgeW91IHRvIHNpZ24gaW5gLCBkZXRhaWw6ICdBZGQgaXQsIHRoZW4gc2lnbiBpbiBvbiBpdHMgcGFnZS4nIH1cbiAgICAgIGNhc2UgJ2tsaXBwZXInOlxuICAgICAgICByZXR1cm4geyB0aXRsZTogXCJBIHByaW50ZXIgYW5zd2VyZWQsIGJ1dCBpdCBpc24ndCBhIE11b24gcHJpbnRlclwiLCBkZXRhaWw6ICdTZXQgaXQgdXAgYXMgS2xpcHBlciB0byBrZWVwIGl0IGluIE90aGVyIHByaW50ZXJzLCB3aXRoIGl0cyBvd24gY29udHJvbHMuJyB9XG4gICAgICBjYXNlICdjb3JzJzpcbiAgICAgICAgcmV0dXJuIHsgdGl0bGU6IFwiSXQgYW5zd2VyZWQsIGJ1dCB3b24ndCBsZXQgdGhpcyBwYWdlIGluXCIsIGh0bWw6IHRoaXMubm90ZSA/PyB1bmRlZmluZWQgfVxuICAgICAgY2FzZSAnYmxvY2tlZCc6XG4gICAgICAgIHJldHVybiB7IHRpdGxlOiBcIlRoaXMgYnJvd3NlciBkaWRuJ3QgbGV0IHRoZSBjaGVjayB0aHJvdWdoXCIsIGh0bWw6IHRoaXMubm90ZSA/PyB1bmRlZmluZWQgfVxuICAgICAgY2FzZSAndW5yZWFjaGFibGUnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRpdGxlOiBgTm90aGluZyBhbnN3ZXJlZCBhdCAke3RoaXMudHlwZWR9YCxcbiAgICAgICAgICBkZXRhaWw6IFwiQ2hlY2sgdGhlIHByaW50ZXIgaXMgc3dpdGNoZWQgb24sIHRoYXQgaXQncyBvbiB0aGUgc2FtZSBuZXR3b3JrIGFzIHRoaXMgZGV2aWNlLCBhbmQgdGhhdCB0aGUgYWRkcmVzcyBtYXRjaGVzIHRoZSBvbmUgb24gaXRzIHNjcmVlbi5cIlxuICAgICAgICB9XG4gICAgICBjYXNlICdub3QtcHJpbnRlcic6XG4gICAgICAgIHJldHVybiB7IHRpdGxlOiBcIlNvbWV0aGluZyBhbnN3ZXJlZCwgYnV0IGl0IGlzbid0IGEgcHJpbnRlclwiLCBkZXRhaWw6IFwiQ2hlY2sgdGhlIGFkZHJlc3MgbWF0Y2hlcyB0aGUgb25lIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuLlwiIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSBjaGVjayBjYW4gYmUgYXNrZWQgYWdhaW4gd2hlcmUgYXNraW5nIGFnYWluIGNvdWxkIGNoYW5nZSB0aGUgYW5zd2VyLiAqL1xuICBnZXQgY2FuUmV0cnkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm91dGNvbWUgPT09ICd1bnJlYWNoYWJsZScgfHwgdGhpcy5vdXRjb21lID09PSAnbm90LXByaW50ZXInIHx8IHRoaXMub3V0Y29tZSA9PT0gJ2NvcnMnXG4gIH1cblxuICAvKiogV2h5IEFkZCBpcyBvZmYsIGFuZCB3aGF0IHRvIGRvIGluc3RlYWQsIHdoaWxlIGl0IGlzLiAqL1xuICBnZXQgYWRkSGludCAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy52ZXJpZmllZCkge1xuICAgICAgcmV0dXJuIHRoaXMub3V0Y29tZSA9PT0gJ2xvY2tlZCdcbiAgICAgICAgPyAnTm90IHlvdXIgcHJpbnRlcj8gQWRkIGl0IGFuZCBzaWduIGluIG9uIGl0cyBwYWdlLCBvciBhc2sgaXRzIG93bmVyIHRvIHNoYXJlIGl0IHdpdGggeW91LiBZb3UgY2FuIGFsc28gb3BlbiBpdHMgcGFnZSB3aXRob3V0IGFkZGluZyBpdC4nXG4gICAgICAgIDogJydcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm91dGNvbWUpIHtcbiAgICAgIGNhc2UgJ2lkbGUnOiByZXR1cm4gJ0FkZCB0dXJucyBvbiBvbmNlIGEgcHJpbnRlciBhbnN3ZXJzIGF0IHRoZSBhZGRyZXNzLiBUeXBlIGl0cyBuYW1lIG9yIGFkZHJlc3MgYWJvdmUuJ1xuICAgICAgY2FzZSAnY2hlY2tpbmcnOiByZXR1cm4gJ0FkZCB0dXJucyBvbiB3aGVuIHRoZSBjaGVjayBmaW5pc2hlcy4nXG4gICAgICBjYXNlICdpbnZhbGlkJzogcmV0dXJuIFwiQWRkIGlzIG9mZiBiZWNhdXNlIHRoYXQgaXNuJ3QgYW4gYWRkcmVzcy4gRml4IGl0IGFib3ZlLlwiXG4gICAgICBjYXNlICdibG9ja2VkJzogcmV0dXJuIFwiQWRkIGlzIG9mZiBiZWNhdXNlIHRoaXMgYnJvd3NlciBzdG9wcGVkIHRoZSBjaGVjay4gT3BlbiB0aGUgcHJpbnRlcidzIG93biBwYWdlIGluc3RlYWQsIHVzaW5nIHRoZSBsaW5rIGFib3ZlLlwiXG4gICAgICBkZWZhdWx0OiByZXR1cm4gXCJBZGQgaXMgb2ZmIGJlY2F1c2Ugbm8gcHJpbnRlciB3YXMgZm91bmQgdGhlcmUuIFRyeSBhZ2FpbiwgY2hlY2sgdGhlIGFkZHJlc3MsIG9yIGFzayB0aGUgcHJpbnRlcidzIG93bmVyIGZvciBpdC5cIlxuICAgIH1cbiAgfVxuXG4gIGdldCBhZGRMYWJlbCAoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5vdXRjb21lID09PSAna2xpcHBlcicpIHJldHVybiAnU2V0IHVwIGFzIEtsaXBwZXInXG4gICAgaWYgKCh0aGlzLm91dGNvbWUgPT09ICdtdW9uJyB8fCB0aGlzLm91dGNvbWUgPT09ICdsb2NrZWQnKSAmJiB0aGlzLnJlc29sdmVkKSByZXR1cm4gYEFkZCAke3RoaXMucmVzb2x2ZWQubmFtZX1gXG4gICAgcmV0dXJuICdBZGQgcHJpbnRlcidcbiAgfVxuXG4gIC8vIFdhdGNoIGZvciB1cmwgY2hhbmdlcy4gVmFsaWRpdHkgaXMgY2hlY2tlZCBhZnRlciB0aGUgZGVib3VuY2U6IGEgcGFzdGVkXG4gIC8vIGFkZHJlc3MgdXNlZCB0byByZWFkIGFzIGludmFsaWQgaGVyZSBhbmQgd2FzIG5ldmVyIGNoZWNrZWQuXG4gIEBXYXRjaCgndXJsJylcbiAgb25VcmxDaGFuZ2UgKHZhbHVlOiBzdHJpbmcsIG9sZFZhbDogc3RyaW5nKSB7XG4gICAgaWYgKHZhbHVlID09PSBvbGRWYWwpIHJldHVyblxuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpXG4gICAgdGhpcy52ZXJpZmllZCA9IGZhbHNlXG4gICAgdGhpcy5yZXNvbHZlZCA9IG51bGxcbiAgICB0aGlzLmVycm9yID0gbnVsbFxuICAgIHRoaXMubm90ZSA9IG51bGxcbiAgICB0aGlzLm91dGNvbWUgPSB2YWx1ZS50cmltKCkgPyAnY2hlY2tpbmcnIDogJ2lkbGUnXG4gICAgdGhpcy52ZXJpZnlpbmcgPSAhIXZhbHVlLnRyaW0oKVxuICAgIHRoaXMuaGFuZGxlVXJsQ2hhbmdlKHZhbHVlKVxuICB9XG5cbiAgQERlYm91bmNlKDc1MClcbiAgaGFuZGxlVXJsQ2hhbmdlICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuQ2hlY2sodmFsdWUpXG4gIH1cblxuICAvKiogQXNrcyB0aGUgc2FtZSBjaGVjayBhZ2Fpbiwgbm93OiB0aGUgYW5zd2VyIG1heSBoYXZlIGNoYW5nZWQgKHRoZSBwcmludGVyIHdhcyBzd2l0Y2hlZCBvbiwgdGhlIG5ldHdvcmsgY2FtZSBiYWNrKS4gKi9cbiAgcmV0cnkgKCkge1xuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2hlY2sodGhpcy51cmwpXG4gIH1cblxuICBhc3luYyBydW5DaGVjayAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy51cmwgfHwgIXZhbHVlLnRyaW0oKSkgcmV0dXJuXG4gICAgdGhpcy52YWxpZCA9IHRoaXMudmFsaWRVcmwodmFsdWUpXG4gICAgaWYgKCF0aGlzLnZhbGlkKSB7XG4gICAgICB0aGlzLnZlcmlmeWluZyA9IGZhbHNlXG4gICAgICB0aGlzLm91dGNvbWUgPSAnaW52YWxpZCdcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMudmVyaWZpZWQgPSBmYWxzZVxuICAgIHRoaXMuZXJyb3IgPSBudWxsXG4gICAgdGhpcy5ub3RlID0gbnVsbFxuICAgIHRoaXMudmVyaWZ5aW5nID0gdHJ1ZVxuICAgIHRoaXMub3V0Y29tZSA9ICdjaGVja2luZydcbiAgICB0aGlzLnJlc29sdmVkID0gbnVsbFxuXG4gICAgLy8gQSBNdW9uM0QgcHJpbnRlciBmaXJzdDogaXQgYW5zd2VycyBieSBJUCBhZGRyZXNzLCBieSBpdHMgbmFtZVxuICAgIC8vIChtdW9uLWJveHdvb2QtMzY3YSkgYW5kIGJ5IGl0cyBuYW1lIHdpdGggLmxvY2FsLCBhbmQgc2F5cyB3aG8gaXQgaXMuXG4gICAgY29uc3QgcHJpbnRlciA9IGF3YWl0IHByb2JlQWRkcmVzcyh2YWx1ZSlcbiAgICBpZiAodmFsdWUgIT09IHRoaXMudXJsKSByZXR1cm5cbiAgICBpZiAocHJpbnRlcikge1xuICAgICAgdGhpcy5yZXNvbHZlZCA9IHByaW50ZXJcbiAgICAgIHRoaXMudmVyaWZpZWQgPSB0cnVlXG4gICAgICB0aGlzLnZlcmlmeWluZyA9IGZhbHNlXG4gICAgICB0aGlzLm91dGNvbWUgPSBwcmludGVyLmhlYWx0aD8uc3RhdGUgPT09ICdsb2NrZWQnID8gJ2xvY2tlZCcgOiAnbXVvbidcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgYXBpVXJsLCBzb2NrZXRVcmwgfSA9IHRoaXMuJGZpbHRlcnMuZ2V0QXBpVXJscyh2YWx1ZSlcblxuICAgIC8vIEhhbmRsZSBjYW5jZWxsaW5nIGF4aW9zIHJlcXVlc3RzLlxuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpXG5cbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKVxuXG4gICAgY29uc3QgeyBzaWduYWwgfSA9IHRoaXMuYWJvcnRDb250cm9sbGVyXG5cbiAgICAvLyBTdGFydCBieSBtYWtpbmcgYSBzdGFuZGFyZCByZXF1ZXN0LiBNYXliZSBpdCdzIGdvb2Q/XG4gICAgLy8gQSBwbGFpbiByZXF1ZXN0IG9uIHRoZSBuZXR3b3JrLCBuZXZlciBWdWUuJGh0dHBDbGllbnQ6IHdoaWxlIGEgY2xvdWRcbiAgICAvLyBwcmludGVyIGlzIHNob3duLCB0aGF0IGNsaWVudCB0cmF2ZWxzIG92ZXIgSXJvaCwgc28gdGhlIGNsb3VkIHByaW50ZXJcbiAgICAvLyB3b3VsZCBhbnN3ZXIgZm9yIGFueSBhZGRyZXNzIHR5cGVkIGhlcmUuIEl0IGFsc28gY2FycmllcyB0aGUgY3VycmVudFxuICAgIC8vIHByaW50ZXIncyBzaWduLWluLCB3aGljaCBpcyBub3QgdGhpcyBhZGRyZXNzJ3MgdG8gc2VlLlxuICAgIGNvbnN0IHJlcXVlc3QgPSBhd2FpdCBheGlvcy5nZXQoYCR7YXBpVXJsfS9zZXJ2ZXIvaW5mbz90PSR7RGF0ZS5ub3coKX1gLCB7XG4gICAgICB0aW1lb3V0OiBHbG9iYWxzLk5FVFdPUktfUkVRVUVTVF9USU1FT1VULFxuICAgICAgc2lnbmFsXG4gICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy52ZXJpZmllZCA9IHRydWVcbiAgICAgICAgdGhpcy52ZXJpZnlpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLm91dGNvbWUgPSAna2xpcHBlcidcbiAgICAgICAgcmV0dXJuICdvaydcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgIC8vIENhbmNlbGxlZDogYSBuZXdlciBhZGRyZXNzIGlzIGJlaW5nIGNoZWNrZWQuXG4gICAgICAgIGlmIChheGlvcy5pc0NhbmNlbChlKSkge1xuICAgICAgICAgIHJldHVybiAnb2snXG4gICAgICAgIH0gZWxzZSBpZiAoYXhpb3MuaXNBeGlvc0Vycm9yKGUpKSB7XG4gICAgICAgICAgLy8gQSA0MDE6IGEgcHJpbnRlciwgd2FudGluZyBhIHNpZ24taW4uXG4gICAgICAgICAgaWYgKGUucmVzcG9uc2U/LnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICB0aGlzLnZlcmlmaWVkID0gdHJ1ZVxuICAgICAgICAgICAgdGhpcy52ZXJpZnlpbmcgPSBmYWxzZVxuICAgICAgICAgICAgdGhpcy5vdXRjb21lID0gJ2xvY2tlZCdcbiAgICAgICAgICAgIHJldHVybiAnb2snXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgaXQgZmFpbGVkIHdpdGggYSBuZXR3b3JrIGlzc3VlLi5cbiAgICAgICAgICBpZiAoZS5yZXF1ZXN0ICYmICFlLnJlc3BvbnNlKSByZXR1cm4gZS5tZXNzYWdlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBTb21ldGhpbmcgYW5zd2VyZWQsIGJ1dCBub3QgYXMgYSBwcmludGVyIGRvZXMuXG4gICAgICAgIHRoaXMuZXJyb3IgPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSlcbiAgICAgICAgdGhpcy52ZXJpZnlpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLm91dGNvbWUgPSAnbm90LXByaW50ZXInXG4gICAgICAgIHJldHVybiAnb2snXG4gICAgICB9KVxuXG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLnVybCkgcmV0dXJuXG5cbiAgICAvLyBUaGUgaW5pdGlhbCByZXF1ZXN0IGZhaWxlZCB3aXRoIGEgbmV0d29yayBpc3N1ZS4uXG4gICAgaWYgKHJlcXVlc3QgIT09ICdvaycpIHtcbiAgICAgIGlmICh0aGlzLmhvc3RlZCkge1xuICAgICAgICBhd2FpdCB3ZWJTb2NrZXRXcmFwcGVyKHNvY2tldFVybCwgc2lnbmFsKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIGxpa2VseSBhIGNvcnMgaXNzdWUsIGJ1dCBzb2NrZXQgd29ya2VkXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHRoaXMudXJsKSByZXR1cm5cbiAgICAgICAgICAgIHRoaXMudmVyaWZpZWQgPSB0cnVlXG4gICAgICAgICAgICB0aGlzLm91dGNvbWUgPSAna2xpcHBlcidcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIC8vIGV4dGVybmFsIGhvc3Qgbm90IHJlYWNoYWJsZSAoZmV0Y2ggcmV0dXJucyAnZmFpbGVkIHRvIGZldGNoJylcbiAgICAgICAgICAgIGNvbnNvbGEuZGVidWcoJ05ldHdvcmsgRXJyb3InLCBlLCByZXF1ZXN0KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25VbnJlYWNoYWJsZShhcGlVcmwsIHJlcXVlc3QpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZmluYWxseSgoKSA9PiB7IGlmICh2YWx1ZSA9PT0gdGhpcy51cmwpIHRoaXMudmVyaWZ5aW5nID0gZmFsc2UgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGZldGNoKGAke2FwaVVybH0vc2VydmVyL2luZm9gLCB7IHNpZ25hbCwgbW9kZTogJ25vLWNvcnMnLCBjYWNoZTogJ25vLWNhY2hlJyB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIGxpa2VseSBhIGNvcnMgaXNzdWVcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdGhpcy51cmwpIHJldHVyblxuICAgICAgICAgICAgdGhpcy5lcnJvciA9IHRoaXMuJHQoJ2FwcC5lbmRwb2ludC5lcnJvci5jb3JzX2Vycm9yJykudG9TdHJpbmcoKVxuICAgICAgICAgICAgdGhpcy5ub3RlID0gdGhpcy4kdCgnYXBwLmVuZHBvaW50LmVycm9yLmNvcnNfbm90ZScsIHtcbiAgICAgICAgICAgICAgdXJsOiBHbG9iYWxzLkRPQ1NfTVVMVElQTEVfSU5TVEFOQ0VTXG4gICAgICAgICAgICB9KS50b1N0cmluZygpXG4gICAgICAgICAgICB0aGlzLm91dGNvbWUgPSAnY29ycydcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIC8vIGV4dGVybmFsIGhvc3Qgbm90IHJlYWNoYWJsZSAoZmV0Y2ggcmV0dXJucyAnZmFpbGVkIHRvIGZldGNoJylcbiAgICAgICAgICAgIGNvbnNvbGEuZGVidWcoJ05ldHdvcmsgRXJyb3InLCBlLCByZXF1ZXN0KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25VbnJlYWNoYWJsZShhcGlVcmwsIHJlcXVlc3QpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZmluYWxseSgoKSA9PiB7IGlmICh2YWx1ZSA9PT0gdGhpcy51cmwpIHRoaXMudmVyaWZ5aW5nID0gZmFsc2UgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW4gYWRkcmVzcyB0aGlzIHBhZ2UgY291bGQgbm90IHJlYWNoIGF0IGFsbC4gRnJvbSBjb250cm9sLm11b24zZC5jb20gKEhUVFBTKVxuICAgKiB0byBhIHBsYWluLUhUVFAgcHJpbnRlciB0aGF0IGlzIHVzdWFsbHkgdGhlIGJyb3dzZXIgYmxvY2tpbmcgbWl4ZWRcbiAgICogY29udGVudCwgbm90IGEgd3JvbmcgYWRkcmVzcywgc28gc2F5IHNvIGFuZCBsaW5rIHRoZSBwcmludGVyJ3Mgb3duIHBhZ2VcbiAgICogcmF0aGVyIHRoYW4gYXNraW5nIHdoZXRoZXIgdGhlIGFkZHJlc3MgaXMgY29ycmVjdC5cbiAgICovXG4gIGFzeW5jIG9uVW5yZWFjaGFibGUgKGFwaVVybDogc3RyaW5nLCByZXF1ZXN0OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0eXBlZCA9IHRoaXMudXJsXG4gICAgY29uc3QgYmxvY2tlZCA9IC9eaHR0cDpcXC9cXC9cXGR7MSwzfShcXC5cXGR7MSwzfSl7M30oOlxcZCspP1xcLz8kLy50ZXN0KGFwaVVybCkgJiYgYXdhaXQgcGFnZUJsb2Nrc0xhbklwdjQoKVxuICAgIC8vIFRoZSBmaXJzdCBjaGVjayBjYW4gdGFrZSBzZWNvbmRzLiBJZiB0aGUgYWRkcmVzcyBjaGFuZ2VkIG1lYW53aGlsZSxcbiAgICAvLyB0aGlzIGFuc3dlciBpcyBhYm91dCBvbmUgbm9ib2R5IGlzIGxvb2tpbmcgYXQgYW55IG1vcmUuXG4gICAgaWYgKHRoaXMudXJsICE9PSB0eXBlZCkgcmV0dXJuXG4gICAgdGhpcy52ZXJpZnlpbmcgPSBmYWxzZVxuICAgIGlmIChibG9ja2VkKSB7XG4gICAgICBjb25zdCBvd25VcmwgPSBkaXNjb3ZlcnlTdGF0ZS5ibG9ja2VkQnlQYWdlPy5vd25VcmxcbiAgICAgIHRoaXMuZXJyb3IgPSBudWxsXG4gICAgICB0aGlzLm5vdGUgPSB0aGlzLiR0KCdhcHAuZW5kcG9pbnQuZXJyb3IuYmxvY2tlZF9pcF9mcm9tX25hbWUnLCB7IGhvc3Q6IGVzY2FwZUh0bWwobG9jYXRpb24uaG9zdCkgfSkgK1xuICAgICAgICAob3duVXJsID8gJyAnICsgdGhpcy4kdCgnYXBwLmVuZHBvaW50LmVycm9yLmJsb2NrZWRfaXBfZnJvbV9uYW1lX3dheV9yb3VuZCcsIHsgdXJsOiBlc2NhcGVIdG1sKG93blVybCkgfSkgOiAnJylcbiAgICAgIHRoaXMub3V0Y29tZSA9ICdibG9ja2VkJ1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChwYWdlQmxvY2tzUHJpbnRlcihhcGlVcmwpKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbFxuICAgICAgdGhpcy5ub3RlID0gdGhpcy4kdCgnYXBwLmVuZHBvaW50LmVycm9yLmJsb2NrZWRfYnlfcGFnZScsIHtcbiAgICAgICAgaG9zdDogZXNjYXBlSHRtbChsb2NhdGlvbi5ob3N0KSxcbiAgICAgICAgdXJsOiBlc2NhcGVIdG1sKHByaW50ZXJQYWdlVXJsKGFwaVVybCkpXG4gICAgICB9KS50b1N0cmluZygpXG4gICAgICB0aGlzLm91dGNvbWUgPSAnYmxvY2tlZCdcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmVycm9yID0gcmVxdWVzdFxuICAgIHRoaXMubm90ZSA9IG51bGxcbiAgICB0aGlzLm91dGNvbWUgPSAndW5yZWFjaGFibGUnXG4gIH1cblxuICBzdWJtaXQgKCkge1xuICAgIGlmICh0aGlzLnZlcmlmaWVkKSB0aGlzLmFkZEluc3RhbmNlKClcbiAgfVxuXG4gIGFkZEluc3RhbmNlICgpIHtcbiAgICBpZiAoIXRoaXMudmVyaWZpZWQpIHJldHVyblxuICAgIGNvbnN0IGFwaUNvbmZpZyA9IHRoaXMucmVzb2x2ZWQgPyBpbnN0YW5jZUZvcih0aGlzLnJlc29sdmVkKSA6IHRoaXMuJGZpbHRlcnMuZ2V0QXBpVXJscyh0aGlzLnVybClcbiAgICBpZiAodGhpcy5vdXRjb21lID09PSAna2xpcHBlcicpIHtcbiAgICAgIHRoaXMuc2VsZWN0QnJhbmQoJ21vb25yYWtlcicpXG4gICAgICB0aGlzLmZvcmVpZ25Ib3N0ID0gbmV3IFVSTChhcGlDb25maWcuYXBpVXJsKS5ob3N0XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICB0aGlzLiRlbWl0KCdyZXNvbHZlJywgYXBpQ29uZmlnKVxuICB9XG5cbiAgLyoqIE9uZSBmb3VuZCBvbiB0aGlzIG5ldHdvcms6IHRoZSBwYWdlIG9wZW5zIGl0LCBhcyBpdHMgb3duIGNhcmQgd291bGQuICovXG4gIHBpY2sgKGNob2ljZTogRm91bmRDaG9pY2UpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIHRoaXMuJGVtaXQoJ3BpY2snLCBjaG9pY2Uua2V5KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuYWlkX19yZXRyeS1yb3cgeyBkaXNwbGF5OiBibG9jazsgbWFyZ2luLXRvcDogNnB4OyB9XG4gIC5haWRfX3doeSB7IG1hcmdpbi10b3A6IDEwcHg7IH1cbiAgLmFpZF9fZGV0YWlscyB7IG1hcmdpbi10b3A6IDZweDsgY29kZSB7IGRpc3BsYXk6IGJsb2NrOyBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTsgfSB9XG5cbiAgLmFpZF9fYnJhbmRzIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDIsIG1pbm1heCgwLCAxZnIpKTtcbiAgICBnYXA6IDZweDtcbiAgICBtYXJnaW4tYm90dG9tOiAxNnB4O1xuICB9XG5cbiAgLmFpZF9fYnJhbmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICBwYWRkaW5nOiA5cHggMTFweDtcbiAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgfVxuXG4gIC5haWRfX2JyYW5kLS1zZWxlY3RlZCB7XG4gICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5haWRfX2JyYW5kIHNtYWxsLFxuICAuYWlkX19icmlkZ2UsXG4gIC5haWRfX3N0ZXBzLFxuICAuYWlkX193YXJuaW5nIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5haWRfX2lucHV0IHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBwYWRkaW5nOiAxMHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAuYWlkX19mb3JlaWduLFxuICAuYWlkX19icmlkZ2Uge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAuYWlkX19mb3JlaWduIC5tMy1maWVsZCB7XG4gICAgZ2FwOiA1cHg7XG4gIH1cblxuICAuYWlkX19yZW1lbWJlciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBnYXA6IDhweDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB9XG5cbiAgLmFpZF9fc2V0dXAge1xuICAgIHBhZGRpbmc6IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5haWRfX3NldHVwIHByZSB7XG4gICAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB9XG5cbiAgLmFpZF9fd2FybmluZyB7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5haWRfX21vbm8ge1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgfVxuXG4gIC5haWRfX3N0YXR1cyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMTJweCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAuYWlkX19zdGF0dXMtaWNvbiB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiAyOHB4O1xuICAgIGhlaWdodDogMjhweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAuYWlkX19zdGF0dXMtLW9rIC5haWRfX3N0YXR1cy1pY29uIHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLXN1Y2Nlc3MpIDE4JSwgdHJhbnNwYXJlbnQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtc3VjY2Vzcyk7XG4gIH1cblxuICAuYWlkX19zdGF0dXMtLXdhcm4gLmFpZF9fc3RhdHVzLWljb24ge1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtd2FybmluZykgMTglLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5haWRfX3N0YXR1cy0tZXJyIC5haWRfX3N0YXR1cy1pY29uIHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMTYlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xuICB9XG5cbiAgLmFpZF9fc3RhdHVzLXRleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgcGFkZGluZy10b3A6IDRweDtcbiAgICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcblxuICAgIGIge1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG5cbiAgICBzcGFuIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxuICB9XG5cbiAgLmFpZF9fZm91bmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nLXRvcDogNHB4O1xuICB9XG5cbiAgLmFpZF9fZm91bmQtaGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIG1hcmdpbjogMCAwIDJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLmFpZF9fY2hvaWNlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIHBhZGRpbmc6IDhweCAxMHB4IDhweCA4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuXG4gICAgJjpob3ZlciB7XG4gICAgICBmaWx0ZXI6IGJyaWdodG5lc3MoMS4xKTtcbiAgICB9XG4gIH1cblxuICAuYWlkX19jaG9pY2UtdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi13aWR0aDogMDtcblxuICAgIGIge1xuICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICB9XG4gIH1cblxuICAuYWlkX19jaG9pY2UtZ28ge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgcGFkZGluZzogNnB4IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1vbi1hY2NlbnQsICMwMDIwMWUpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29tbW9uL0FkZEluc3RhbmNlRGlhbG9nLnZ1ZSJ9