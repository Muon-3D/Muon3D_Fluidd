/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
import { findFilamentMacro } from "/src/services/quick-actions/model.ts";
import { PanelBridge } from "/src/services/panel-embed/bridge.ts";
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { httpClientActions } from "/src/api/httpClientActions.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { loadPanelBundle } from "/src/services/panel-embed/bundle.ts";
import { NOTIFY_ACTIONS, PANEL_NAVIGATE_PATH, PANEL_STATE_PATH, gcodeRefusal, refusalNote } from "/src/services/panel-embed/allow.ts";
import { KnobWheel } from "/src/services/m1-3d/knob.ts";
const FLY_MS = 380;
const BEZEL_PX = 340;
const STRIP_PX = 64;
function panelBundle(key, onProgress) {
  return loadPanelBundle((url, request) => Vue.$httpClient.get(url, {
    responseType: "text",
    transformResponse: [(v) => v],
    validateStatus: () => true,
    headers: request.headers,
    onDownloadProgress: (e) => request.onProgress(e.loaded, e.total ?? 0)
  }), key, onProgress);
}
const bridges = /* @__PURE__ */ new WeakMap();
let M1Screen = class extends Mixins(ControlMixin) {
  from;
  reducedMotion;
  viewer;
  /** The screen's disc as the camera will have it once it has flown in: centre and radius in the stage's pixels. */
  ring = null;
  /** 'in' before the zoom starts, 'open', then 'out' while it flies back. */
  phase = "in";
  /** /panel/ is served here: null until known. */
  served = null;
  /** The printer did not answer over this route: neither the screen nor "needs an update" can be said. */
  unreachable = false;
  flyTimer = 0;
  flight = {};
  stopActions = null;
  refusedLast = false;
  refusedText = "";
  /** The printer publishes its panel state (live screen): null until known, false on an older image (the screen stays independent). */
  liveSupported = null;
  get printerName() {
    return this.$store.getters["config/getDisplayName"] || "the printer";
  }
  /** The zoom's start (and end): the screen on the model, small, as an offset from the stage's middle. */
  flyFrom() {
    const el = this.$el;
    const ms = `${this.reducedMotion ? 0 : FLY_MS}ms`;
    const strip = el.querySelector(".m1-screen__strip");
    const top = strip ? strip.offsetTop + strip.offsetHeight + 8 : STRIP_PX;
    const fit = Math.min(1, (el.clientHeight - top - 12) / BEZEL_PX, (el.clientWidth - 24) / BEZEL_PX);
    const style = {
      "--fly-ms": ms,
      "--fit": `${Math.max(0.4, fit).toFixed(3)}`,
      "--drop": `${Math.max(0, Math.round((top - 12) / 2))}px`
    };
    if (!this.from) return style;
    const dx = Math.round(this.from.x - el.clientWidth / 2);
    const dy = Math.round(this.from.y - el.clientHeight / 2);
    return { ...style, "--fly-x": `${dx}px`, "--fly-y": `${dy}px` };
  }
  get ringStyle() {
    const r = this.ring;
    if (!r) return {};
    return { "--ring-x": `${Math.round(r.x)}px`, "--ring-y": `${Math.round(r.y)}px`, "--ring-d": `${Math.round(r.r * 2)}px`, "--ring-k": `${(r.r * 2 / 480).toFixed(4)}` };
  }
  knobWheel = new KnobWheel();
  /** A scroll on the strip or the stage around the screen turns the model's knob (the picture only); the embedded screen's own scroll is its own. */
  onWheel(e) {
    if (!this.ring) return;
    e.preventDefault();
    const detents = this.knobWheel.turn(e.deltaY, e.deltaMode);
    if (detents) this.$emit("turn", detents);
  }
  async mounted() {
    document.addEventListener("keydown", this.onKey);
    this.ring = this.viewer?.screenCircle() ?? null;
    this.flight = this.flyFrom();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.phase === "in") this.phase = "open";
    }));
    this.loading = true;
    const bundle = await panelBundle(this.printerKey, (loaded, total) => {
      this.loadPercent = total > 0 ? Math.min(100, Math.round(loaded / total * 100)) : null;
    });
    this.loading = false;
    if (this.phase === "out" || this._isDestroyed) return;
    this.served = bundle.state === "unknown" ? null : bundle.state === "yes";
    this.unreachable = bundle.state === "unknown";
    if (bundle.state === "yes") {
      this.html = bundle.html;
      this.$nextTick(() => this.connect());
    }
  }
  /** Which printer this is, from what Control holds (its address, and the printer id on a managed route), never from what a printer says. */
  get printerKey() {
    const id = cloudState.activePrinterId;
    return id ? `${this.$store.state.config.apiUrl ?? ""}|${id}` : null;
  }
  /** The screen's page, fetched from the printer. */
  html = "";
  /** While the page comes over the route (a Bluetooth link takes a while). */
  loading = false;
  /** How much of it has come, 0 to 100, or null when the route can't say. */
  loadPercent = null;
  /** Esc, Done or a click outside: fly back out to the model, then close. */
  close() {
    if (this.phase === "out") return;
    this.phase = "out";
    clearTimeout(this.flyTimer);
    this.flyTimer = window.setTimeout(() => this.$emit("close"), this.reducedMotion ? 0 : FLY_MS);
  }
  /** The note in the strip: what was refused, and why. It stays until it is clicked away or the screen is left, so it can be read. */
  say(text) {
    this.refusedText = text;
    this.refusedLast = true;
  }
  /** The bridge to the framed screen, on Control's connection, after the allowlist. */
  connect() {
    const frame = this.$refs.frame;
    if (!frame) return;
    bridges.set(this, new PanelBridge(frame, {
      rpc: async (method, params) => {
        const why = this.rpcRefusal(method, params);
        if (why) {
          this.say(why);
          throw new Error(why);
        }
        const result = await this.$socket.emit(method, { params });
        if (result === void 0) throw new Error("The printer refused that.");
        return result;
      },
      auxGet: async (path) => (await httpClientActions.get(`/server/aux${path}`)).data,
      status: () => this.$store.state.printer.printer,
      connectionId: () => this.$store.state.socket.connectionId ?? null,
      verb: (v) => {
        const why = this.runVerb(v);
        if (why) this.say(why);
        return why;
      },
      // The printer's live panel state, over the same route as everything else: any status comes back as data.
      panelGet: async () => {
        const r = await httpClientActions.get(PANEL_STATE_PATH, { validateStatus: () => true });
        return { status: r.status, body: r.data };
      },
      panelPost: async (body) => {
        const r = await httpClientActions.post(PANEL_NAVIGATE_PATH, body, { validateStatus: () => true });
        return { status: r.status, body: r.data };
      }
    }, {
      onRefused: (what) => this.say(refusalNote(what)),
      onSupport: (supported) => {
        this.liveSupported = supported;
      }
    }));
    if (this.wsDown) bridges.get(this)?.setPolling(true);
    this.stopActions = this.$store.subscribeAction((action) => {
      const bridge = bridges.get(this);
      if (!bridge) return;
      if (action.type === "socket/notifyMuonPanelState") {
        bridge.panelNotify(action.payload);
      } else if (action.type === "printer/onFastNotifyStatusUpdate") {
        const { key, payload } = action.payload;
        bridge.notify("notify_status_update", [{ [key]: payload }]);
      } else if (action.type in NOTIFY_ACTIONS) {
        bridge.notify(NOTIFY_ACTIONS[action.type], [action.payload]);
      }
    });
  }
  beforeDestroy() {
    clearTimeout(this.flyTimer);
    document.removeEventListener("keydown", this.onKey);
    this.stopActions?.();
    bridges.get(this)?.dispose();
    bridges.delete(this);
  }
  onConnectionChange() {
    this.$emit("close");
  }
  /** The websocket is down or has gone quiet: the one time the panel state is polled (2 s). Back up: one re-read, then pushes only. */
  get wsDown() {
    const s = this.$store.state.socket;
    return !s.open || !!s.stalled;
  }
  onWsDown(down) {
    const bridge = bridges.get(this);
    if (!bridge) return;
    bridge.setPolling(down);
    if (!down) bridge.syncPanel().catch(() => void 0);
  }
  get connectionKey() {
    const s = this.$store.state.socket;
    return `${this.$store.state.config.apiUrl ?? ""}|${s.connectionId ?? ""}|${s.open ? 1 : 0}|${this.$store.state.printer.printer.webhooks?.state ?? ""}`;
  }
  /**
   * A verb from the screen, run as Control's own buttons run it: a jog by
   * moveBy (the no-go planner and the hand-move wait), home, a heater target
   * by setHeater (inside its limits), load and unload as the Filament card
   * runs them. Only while the printer is idle and Control can act; '' when
   * it was sent, else why not.
   */
  runVerb(v) {
    if (!this.controlReady) return this.controlLock;
    if (this.busy) return "Not while the printer is busy.";
    switch (v.verb) {
      case "jog": {
        if (!this.isHomed(v.axis)) return "Home the printer first.";
        const wait = this.handMoveWait();
        if (wait) return wait;
        this.moveBy(v.axis, v.by);
        return "";
      }
      case "home":
        this.home(v.axes);
        return "";
      case "heat": {
        const heater = v.heater === "extruder" ? this.nozzle : this.bed;
        if (!heater) return "That heater is not on this printer.";
        const why = this.heatRefusal(heater.name, v.target);
        if (why) return why;
        this.setHeater(heater, v.target);
        return "";
      }
      case "fan": {
        const fan = v.fan === "part" ? this.partFan : this.fans.find((f) => f.type === "fan_generic" && f.name === v.fan);
        if (!fan) return "That fan is not on this printer.";
        this.setFan(fan, v.percent);
        return "";
      }
      case "filament": {
        const macros = (this.$store.getters["macros/getMacros"] ?? []).filter((m) => typeof m.name === "string");
        const macro = v.action === "load" ? findFilamentMacro(macros, "load_filament", "filament_load") : findFilamentMacro(macros, "unload_filament", "filament_unload");
        if (!macro) return "This printer has no macro for that.";
        const temp = this.material?.nozzle ?? this.loadedMaterial?.nozzle ?? null;
        this.sendGcode(macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name);
        return "";
      }
    }
  }
  /**
   * Why a forwarded print call isn't sent, '' when it is: the same gates as
   * Control's own buttons, as runVerb applies them. E-stop mirrors Control's
   * E-STOP button (AppBar estopReady): signed in, connected, Klipper ready.
   * Reads pass.
   */
  rpcRefusal(method, params) {
    switch (method) {
      case "printer.emergency_stop":
        return this.authenticated && this.socketConnected && this.klippyReady ? "" : this.controlLock || this.notReadyReason;
      case "printer.gcode.script":
        if (!this.controlReady) return this.controlLock;
        return this.busy ? "Not while the printer is busy." : gcodeRefusal(params?.script);
      case "server.job_queue.post_job":
      case "server.job_queue.start":
      case "server.job_queue.pause":
      case "server.job_queue.jump":
        return this.controlReady ? "" : this.controlLock;
      case "printer.print.start":
        if (!this.controlReady) return this.controlLock;
        return this.busy ? "Not while the printer is busy." : "";
      case "printer.print.pause":
        if (!this.controlReady) return this.controlLock;
        return this.printerPrinting ? "" : "The printer is not printing.";
      case "printer.print.resume":
        if (!this.controlReady) return this.controlLock;
        return this.printerPaused ? "" : "The print is not paused.";
      case "printer.print.cancel":
        if (!this.controlReady) return this.controlLock;
        return this.printerPrinting || this.printerPaused ? "" : "There is no print to cancel.";
      default:
        return "";
    }
  }
  /**
   * A heat target from the screen: refused (never clamped) above the heater's
   * max_temp, which is read live from the printer's config, and refused when
   * that is not known. '' when it may go.
   */
  heatRefusal(heater, target) {
    const settings = this.$store.state.printer.printer.configfile?.settings ?? {};
    const max = Number(settings[heater]?.max_temp);
    if (!Number.isFinite(max) || max <= 0) return "This printer has not said how hot that heater may go.";
    if (!Number.isFinite(target) || target < 0) return "That is not a temperature this heater can be set to.";
    if (target > max) return "That is hotter than this heater goes.";
    return "";
  }
  onKey(e) {
    if (e.key === "Escape") this.close();
  }
};
__decorateClass([
  Prop({ type: Object, default: null })
], M1Screen.prototype, "from", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], M1Screen.prototype, "reducedMotion", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], M1Screen.prototype, "viewer", 2);
__decorateClass([
  Watch("connectionKey")
], M1Screen.prototype, "onConnectionChange", 1);
__decorateClass([
  Watch("wsDown")
], M1Screen.prototype, "onWsDown", 1);
M1Screen = __decorateClass([
  Component
], M1Screen);
const _sfc_main = M1Screen;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m1-screen", class: [`m1-screen--${_vm.phase}`, { "m1-screen--camera": !!_vm.ring }], style: { ..._vm.flight, ..._vm.ringStyle }, attrs: { "data-tid": "m1-screen", "data-phase": _vm.phase, "data-camera": _vm.ring ? "on" : "off" }, on: { "click": function($event) {
    if ($event.target !== $event.currentTarget) return null;
    return _vm.close.apply(null, arguments);
  }, "wheel": _vm.onWheel } }, [_c("div", { staticClass: "m1-screen__strip" }, [_vm._m(0), _c("span", { staticClass: "m1-screen__what" }, [_vm._v("Using " + _vm._s(_vm.printerName) + "'s screen")]), _vm.liveSupported === false ? _c("span", { staticClass: "m1-screen__livenote", attrs: { "data-tid": "m1-screen-live-note" } }, [_vm._v("Live screen needs a printer update.")]) : _vm._e(), _c("span", { staticClass: "m1-screen__hint" }, [_vm._v("Esc or click outside to leave")]), _c("button", { staticClass: "m1-screen__done", attrs: { "type": "button", "data-tid": "m1-screen-done" }, on: { "click": _vm.close } }, [_vm._v(" Exit ")])]), _c("div", { staticClass: "m1-screen__bezel" }, [_vm.served === false ? _c("p", { staticClass: "m1-screen__empty", attrs: { "data-tid": "m1-screen-empty" } }, [_vm._v(" Your printer needs an update to show its screen here ")]) : _vm.unreachable ? _c("p", { staticClass: "m1-screen__empty", attrs: { "data-tid": "m1-screen-unreachable" } }, [_vm._v(" The printer's screen can't be reached over this connection right now ")]) : _vm.loading ? _c("div", { staticClass: "m1-screen__empty", attrs: { "data-tid": "m1-screen-loading", "role": "status" } }, [_c("p", [_vm._v("Loading the printer's screen" + _vm._s(_vm.loadPercent === null ? "" : ` (${_vm.loadPercent}%)`))]), _c("progress", { staticClass: "m1-screen__progress", attrs: { "data-tid": "m1-screen-progress", "max": "100" }, domProps: { "value": _vm.loadPercent === null ? void 0 : _vm.loadPercent } })]) : _vm.served && _vm.html ? _c("iframe", { ref: "frame", staticClass: "m1-screen__frame", attrs: { "srcdoc": _vm.html, "sandbox": "allow-scripts", "title": "The printer's screen", "data-tid": "m1-screen-frame", "referrerpolicy": "no-referrer" } }) : _vm._e()]), _vm.refusedLast ? _c("button", { staticClass: "m1-screen__note", attrs: { "type": "button", "role": "status", "title": "Dismiss", "data-tid": "m1-screen-refused" }, on: { "click": function($event) {
    _vm.refusedLast = false;
  } } }, [_vm._v(" " + _vm._s(_vm.refusedText) + " ")]) : _vm._e()]);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", { staticClass: "m1-screen__live" }, [_c("span", { staticClass: "m1-screen__dot" }), _vm._v("Live")]);
}];
_sfc_render._withStripped = true;
import "/src/components/m1/M1Screen.vue?vue&type=style&index=0&scoped=dc07bdd9&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "dc07bdd9",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/m1/M1Screen.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9GQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBRUE7QUFDQTtBQU1BO0FBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQUdBO0FBZUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBUUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsSUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0EsNENBQ0EsOERBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTVTQTtBQUFBLEVBREE7QUFBQSxHQUZBLFNBR0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUxBLFNBTUE7QUFRQTtBQUFBLEVBREE7QUFBQSxHQWJBLFNBY0E7QUFzS0E7QUFBQSxFQURBO0FBQUEsR0FuTEEsU0FvTEE7QUFXQTtBQUFBLEVBREE7QUFBQSxHQTlMQSxTQStMQTtBQS9MQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNMVNjcmVlbi52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJtMS1zY3JlZW5cIlxuICAgIDpjbGFzcz1cIltgbTEtc2NyZWVuLS0ke3BoYXNlfWAsIHsgJ20xLXNjcmVlbi0tY2FtZXJhJzogISFyaW5nIH1dXCJcbiAgICBkYXRhLXRpZD1cIm0xLXNjcmVlblwiXG4gICAgOmRhdGEtcGhhc2U9XCJwaGFzZVwiXG4gICAgOmRhdGEtY2FtZXJhPVwicmluZyA/ICdvbicgOiAnb2ZmJ1wiXG4gICAgOnN0eWxlPVwieyAuLi5mbGlnaHQsIC4uLnJpbmdTdHlsZSB9XCJcbiAgICBAY2xpY2suc2VsZj1cImNsb3NlXCJcbiAgICBAd2hlZWw9XCJvbldoZWVsXCJcbiAgPlxuICAgIDxkaXYgY2xhc3M9XCJtMS1zY3JlZW5fX3N0cmlwXCI+XG4gICAgICA8c3BhbiBjbGFzcz1cIm0xLXNjcmVlbl9fbGl2ZVwiPjxzcGFuIGNsYXNzPVwibTEtc2NyZWVuX19kb3RcIiAvPkxpdmU8L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cIm0xLXNjcmVlbl9fd2hhdFwiPlVzaW5nIHt7IHByaW50ZXJOYW1lIH19J3Mgc2NyZWVuPC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cImxpdmVTdXBwb3J0ZWQgPT09IGZhbHNlXCJcbiAgICAgICAgY2xhc3M9XCJtMS1zY3JlZW5fX2xpdmVub3RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJtMS1zY3JlZW4tbGl2ZS1ub3RlXCJcbiAgICAgID5MaXZlIHNjcmVlbiBuZWVkcyBhIHByaW50ZXIgdXBkYXRlLjwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwibTEtc2NyZWVuX19oaW50XCI+RXNjIG9yIGNsaWNrIG91dHNpZGUgdG8gbGVhdmU8L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cIm0xLXNjcmVlbl9fZG9uZVwiXG4gICAgICAgIGRhdGEtdGlkPVwibTEtc2NyZWVuLWRvbmVcIlxuICAgICAgICBAY2xpY2s9XCJjbG9zZVwiXG4gICAgICA+XG4gICAgICAgIEV4aXRcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJtMS1zY3JlZW5fX2JlemVsXCI+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwic2VydmVkID09PSBmYWxzZVwiXG4gICAgICAgIGNsYXNzPVwibTEtc2NyZWVuX19lbXB0eVwiXG4gICAgICAgIGRhdGEtdGlkPVwibTEtc2NyZWVuLWVtcHR5XCJcbiAgICAgID5cbiAgICAgICAgWW91ciBwcmludGVyIG5lZWRzIGFuIHVwZGF0ZSB0byBzaG93IGl0cyBzY3JlZW4gaGVyZVxuICAgICAgPC9wPlxuICAgICAgPHBcbiAgICAgICAgdi1lbHNlLWlmPVwidW5yZWFjaGFibGVcIlxuICAgICAgICBjbGFzcz1cIm0xLXNjcmVlbl9fZW1wdHlcIlxuICAgICAgICBkYXRhLXRpZD1cIm0xLXNjcmVlbi11bnJlYWNoYWJsZVwiXG4gICAgICA+XG4gICAgICAgIFRoZSBwcmludGVyJ3Mgc2NyZWVuIGNhbid0IGJlIHJlYWNoZWQgb3ZlciB0aGlzIGNvbm5lY3Rpb24gcmlnaHQgbm93XG4gICAgICA8L3A+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZWxzZS1pZj1cImxvYWRpbmdcIlxuICAgICAgICBjbGFzcz1cIm0xLXNjcmVlbl9fZW1wdHlcIlxuICAgICAgICBkYXRhLXRpZD1cIm0xLXNjcmVlbi1sb2FkaW5nXCJcbiAgICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICA+XG4gICAgICAgIDxwPkxvYWRpbmcgdGhlIHByaW50ZXIncyBzY3JlZW57eyBsb2FkUGVyY2VudCA9PT0gbnVsbCA/ICcnIDogYCAoJHtsb2FkUGVyY2VudH0lKWAgfX08L3A+XG4gICAgICAgIDxwcm9ncmVzc1xuICAgICAgICAgIGNsYXNzPVwibTEtc2NyZWVuX19wcm9ncmVzc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJtMS1zY3JlZW4tcHJvZ3Jlc3NcIlxuICAgICAgICAgIG1heD1cIjEwMFwiXG4gICAgICAgICAgOnZhbHVlPVwibG9hZFBlcmNlbnQgPT09IG51bGwgPyB1bmRlZmluZWQgOiBsb2FkUGVyY2VudFwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxpZnJhbWVcbiAgICAgICAgdi1lbHNlLWlmPVwic2VydmVkICYmIGh0bWxcIlxuICAgICAgICByZWY9XCJmcmFtZVwiXG4gICAgICAgIGNsYXNzPVwibTEtc2NyZWVuX19mcmFtZVwiXG4gICAgICAgIDpzcmNkb2M9XCJodG1sXCJcbiAgICAgICAgc2FuZGJveD1cImFsbG93LXNjcmlwdHNcIlxuICAgICAgICB0aXRsZT1cIlRoZSBwcmludGVyJ3Mgc2NyZWVuXCJcbiAgICAgICAgZGF0YS10aWQ9XCJtMS1zY3JlZW4tZnJhbWVcIlxuICAgICAgICByZWZlcnJlcnBvbGljeT1cIm5vLXJlZmVycmVyXCJcbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gICAgPGJ1dHRvblxuICAgICAgdi1pZj1cInJlZnVzZWRMYXN0XCJcbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3M9XCJtMS1zY3JlZW5fX25vdGVcIlxuICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICB0aXRsZT1cIkRpc21pc3NcIlxuICAgICAgZGF0YS10aWQ9XCJtMS1zY3JlZW4tcmVmdXNlZFwiXG4gICAgICBAY2xpY2s9XCJyZWZ1c2VkTGFzdCA9IGZhbHNlXCJcbiAgICA+XG4gICAgICB7eyByZWZ1c2VkVGV4dCB9fVxuICAgIDwvYnV0dG9uPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiBmcm9tICdAL21peGlucy9jb250cm9sJ1xuaW1wb3J0IHsgZmluZEZpbGFtZW50TWFjcm8gfSBmcm9tICdAL3NlcnZpY2VzL3F1aWNrLWFjdGlvbnMvbW9kZWwnXG5pbXBvcnQgdHlwZSB7IE1hY3JvIH0gZnJvbSAnQC9zdG9yZS9tYWNyb3MvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFZlcmIgfSBmcm9tICdAL3NlcnZpY2VzL3BhbmVsLWVtYmVkL3Byb3RvY29sJ1xuaW1wb3J0IHsgUGFuZWxCcmlkZ2UgfSBmcm9tICdAL3NlcnZpY2VzL3BhbmVsLWVtYmVkL2JyaWRnZSdcbmltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IHsgaHR0cENsaWVudEFjdGlvbnMgfSBmcm9tICdAL2FwaS9odHRwQ2xpZW50QWN0aW9ucydcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBsb2FkUGFuZWxCdW5kbGUsIHR5cGUgUGFuZWxCdW5kbGUgfSBmcm9tICdAL3NlcnZpY2VzL3BhbmVsLWVtYmVkL2J1bmRsZSdcbmltcG9ydCB7IE5PVElGWV9BQ1RJT05TLCBQQU5FTF9OQVZJR0FURV9QQVRILCBQQU5FTF9TVEFURV9QQVRILCBnY29kZVJlZnVzYWwsIHJlZnVzYWxOb3RlIH0gZnJvbSAnQC9zZXJ2aWNlcy9wYW5lbC1lbWJlZC9hbGxvdydcbmltcG9ydCB7IEtub2JXaGVlbCB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2Qva25vYidcblxuLyoqIFRoZSB6b29tIGluIGZyb20gdGhlIG1vZGVsJ3Mgc2NyZWVuLCBhbmQgYmFjayBvdXQgdG8gaXQsIG1zLiAqL1xuY29uc3QgRkxZX01TID0gMzgwXG4vKiogVGhlIGJlemVsJ3MgZHJhd24gc2l6ZSwgYW5kIHRoZSByb29tIHRoZSB0b3Agc3RyaXAgdGFrZXMsIHB4LiAqL1xuY29uc3QgQkVaRUxfUFggPSAzNDBcbmNvbnN0IFNUUklQX1BYID0gNjRcblxuLyoqXG4gKiBUaGUgcHJpbnRlcidzIHNjcmVlbiwgYXNrZWQgb2YgdGhlIHByaW50ZXIgaXRzZWxmIG92ZXIgdGhlIHJvdXRlIENvbnRyb2wgdXNlcyBmb3IgaXQgKExBTiwgQmx1ZXRvb3RoLCByZWxheSksIG5ldmVyIG9mXG4gKiB0aGlzIHBhZ2UncyBvcmlnaW46IGhvc3RlZCBDb250cm9sIHNlcnZlcyBubyAvcGFuZWwvLiBLZXB0IGJ5IEVUYWcsIHNvIGEgMzA0IGNvc3RzIG5vIGJ1bmRsZS5cbiAqL1xuZnVuY3Rpb24gcGFuZWxCdW5kbGUgKGtleTogc3RyaW5nIHwgbnVsbCwgb25Qcm9ncmVzczogKGxvYWRlZDogbnVtYmVyLCB0b3RhbDogbnVtYmVyKSA9PiB2b2lkKTogUHJvbWlzZTxQYW5lbEJ1bmRsZT4ge1xuICByZXR1cm4gbG9hZFBhbmVsQnVuZGxlKCh1cmwsIHJlcXVlc3QpID0+IFZ1ZS4kaHR0cENsaWVudC5nZXQodXJsLCB7XG4gICAgcmVzcG9uc2VUeXBlOiAndGV4dCcsXG4gICAgdHJhbnNmb3JtUmVzcG9uc2U6IFt2ID0+IHZdLFxuICAgIHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlLFxuICAgIGhlYWRlcnM6IHJlcXVlc3QuaGVhZGVycyxcbiAgICBvbkRvd25sb2FkUHJvZ3Jlc3M6IGUgPT4gcmVxdWVzdC5vblByb2dyZXNzKGUubG9hZGVkLCBlLnRvdGFsID8/IDApXG4gIH0pLCBrZXksIG9uUHJvZ3Jlc3MpXG59XG5cbi8qKiBFYWNoIHZpZXcncyBicmlkZ2UsIGtlcHQgb3V0IG9mIFZ1ZSdzIHJlYWNoOiBWdWUgbXVzdCBub3Qgd2FsayBpdCBvciBpdHMgcG9ydC4gKi9cbmNvbnN0IGJyaWRnZXMgPSBuZXcgV2Vha01hcDxvYmplY3QsIFBhbmVsQnJpZGdlPigpXG5cbi8qKlxuICogVGhlIHByaW50ZXIncyBvd24gc2NyZWVuLCB1c2VkIGZyb20gQ29udHJvbCAoU0NSRUVOLVBMQU4ubWQsIEphY2sgNiBOb3YpOlxuICogTXVvblVJJ3MgZW1iZWQgYnVpbGQgYXQgL3BhbmVsLywgZnJhbWVkIG9uIENvbnRyb2wncyBvd24gb3JpZ2luLCB3aXRoIG5vXG4gKiBuZXR3b3JrIG9mIGl0cyBvd24uIEV2ZXJ5dGhpbmcgaXQgYXNrcyBnb2VzIHRocm91Z2ggUGFuZWxCcmlkZ2Ugb25cbiAqIENvbnRyb2wncyBjb25uZWN0aW9uLCBhZnRlciB0aGUgYWxsb3dsaXN0OyBhbnl0aGluZyBtZWFudCB0byBiZSBkb25lIG9uIHRoZVxuICogcHJpbnRlciBpdHNlbGYgaXMgcmVmdXNlZCB0aGVyZSBhbmQgdGFnZ2VkIFwiQ29uZmlybSBvbiB0aGUgcHJpbnRlclwiIGluIHRoZVxuICogc2NyZWVuLiBUaGUga25vYiBpcyB0aGUgbW91c2Ugd2hlZWwgYW5kIGEgY2xpY2ssIGluc2lkZSB0aGUgZnJhbWUuXG4gKlxuICogSXQgb3BlbnMgYnkgem9vbWluZyBpbiBmcm9tIHdoZXJlIHRoZSBzY3JlZW4gaXMgb24gdGhlIG1vZGVsLCBhbmQgRXNjLFxuICogRG9uZSBvciBhIGNsaWNrIG91dHNpZGUgZmx5IGl0IGJhY2sgb3V0IHRoZXJlLiBXaXRob3V0IGEgL3BhbmVsLyBidWlsZCBpdFxuICogc2F5cyBzbywgYW5kIG5vdGhpbmcgaXMgZnJhbWVkIG9yIGJyaWRnZWQuXG4gKi9cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE0xU2NyZWVuIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbikge1xuICAvKiogV2hlcmUgdGhlIG1vZGVsJ3Mgc2NyZWVuIGlzIG9uIHRoZSBzdGFnZSwgdG8gZmx5IGluIGZyb20gYW5kIGJhY2sgb3V0IHRvLiAqL1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSBmcm9tITogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9IHwgbnVsbFxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogZmFsc2UgfSlcbiAgcmVhZG9ubHkgcmVkdWNlZE1vdGlvbiE6IGJvb2xlYW5cblxuICAvKipcbiAgICogVGhlIGxpdmUgdmlld2VyIHdoaWxlIHRoZSBjYW1lcmEgaXMgZmx5aW5nIGluIHRvIHRoZSBzY3JlZW4sIG51bGwgd2hlbiBpdCBpcyBub3QgKHJlZHVjZWQgbW90aW9uLCBvciBhIG1vZGVsIHdpdGggbm9cbiAgICogc2NyZWVuKTogdGhlbiB0aGUgem9vbSBpcyB0aGlzIG92ZXJsYXkncyBvd24sIG92ZXIgYSBkaW1tZWQgc3RhZ2UuIFdpdGggdGhlIGNhbWVyYSwgdGhlIGZyYW1lZCBzY3JlZW4gaXMgdGhlIDNEIG1vZGVsJ3NcbiAgICogb3duLCB0b3AtZG93biwgYW5kIHRoZSBsaXZlIHNjcmVlbiBzaXRzIGV4YWN0bHkgb24gaXRzIGRpc2MsIHdpdGggdGhlIG1vZGVsJ3Mga25vYiBiZXNpZGUgaXQgKEphY2ssIDExIE5vdikuXG4gICAqL1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSB2aWV3ZXIhOiB7IHNjcmVlbkNpcmNsZTogKCkgPT4geyB4OiBudW1iZXIsIHk6IG51bWJlciwgcjogbnVtYmVyIH0gfCBudWxsIH0gfCBudWxsXG5cbiAgLyoqIFRoZSBzY3JlZW4ncyBkaXNjIGFzIHRoZSBjYW1lcmEgd2lsbCBoYXZlIGl0IG9uY2UgaXQgaGFzIGZsb3duIGluOiBjZW50cmUgYW5kIHJhZGl1cyBpbiB0aGUgc3RhZ2UncyBwaXhlbHMuICovXG4gIHJpbmc6IHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHI6IG51bWJlciB9IHwgbnVsbCA9IG51bGxcblxuICAvKiogJ2luJyBiZWZvcmUgdGhlIHpvb20gc3RhcnRzLCAnb3BlbicsIHRoZW4gJ291dCcgd2hpbGUgaXQgZmxpZXMgYmFjay4gKi9cbiAgcGhhc2U6ICdpbicgfCAnb3BlbicgfCAnb3V0JyA9ICdpbidcbiAgLyoqIC9wYW5lbC8gaXMgc2VydmVkIGhlcmU6IG51bGwgdW50aWwga25vd24uICovXG4gIHNlcnZlZDogYm9vbGVhbiB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgcHJpbnRlciBkaWQgbm90IGFuc3dlciBvdmVyIHRoaXMgcm91dGU6IG5laXRoZXIgdGhlIHNjcmVlbiBub3IgXCJuZWVkcyBhbiB1cGRhdGVcIiBjYW4gYmUgc2FpZC4gKi9cbiAgdW5yZWFjaGFibGUgPSBmYWxzZVxuICBmbHlUaW1lciA9IDBcbiAgZmxpZ2h0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbiAgc3RvcEFjdGlvbnM6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG4gIHJlZnVzZWRMYXN0ID0gZmFsc2VcbiAgcmVmdXNlZFRleHQgPSAnJ1xuICAvKiogVGhlIHByaW50ZXIgcHVibGlzaGVzIGl0cyBwYW5lbCBzdGF0ZSAobGl2ZSBzY3JlZW4pOiBudWxsIHVudGlsIGtub3duLCBmYWxzZSBvbiBhbiBvbGRlciBpbWFnZSAodGhlIHNjcmVlbiBzdGF5cyBpbmRlcGVuZGVudCkuICovXG4gIGxpdmVTdXBwb3J0ZWQ6IGJvb2xlYW4gfCBudWxsID0gbnVsbFxuXG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXREaXNwbGF5TmFtZSddIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgfHwgJ3RoZSBwcmludGVyJ1xuICB9XG5cbiAgLyoqIFRoZSB6b29tJ3Mgc3RhcnQgKGFuZCBlbmQpOiB0aGUgc2NyZWVuIG9uIHRoZSBtb2RlbCwgc21hbGwsIGFzIGFuIG9mZnNldCBmcm9tIHRoZSBzdGFnZSdzIG1pZGRsZS4gKi9cbiAgZmx5RnJvbSAoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgY29uc3QgZWwgPSB0aGlzLiRlbCBhcyBIVE1MRWxlbWVudFxuICAgIGNvbnN0IG1zID0gYCR7dGhpcy5yZWR1Y2VkTW90aW9uID8gMCA6IEZMWV9NU31tc2BcbiAgICAvLyBTbWFsbCBzdGFnZXMgKGEgcGhvbmUpIGRyYXcgdGhlIGJlemVsIHNtYWxsZXIsIGluIHRoZSByb29tIHVuZGVyIHRoZSBzdHJpcCB3aXRoIERvbmUuXG4gICAgY29uc3Qgc3RyaXAgPSBlbC5xdWVyeVNlbGVjdG9yKCcubTEtc2NyZWVuX19zdHJpcCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuICAgIGNvbnN0IHRvcCA9IHN0cmlwID8gc3RyaXAub2Zmc2V0VG9wICsgc3RyaXAub2Zmc2V0SGVpZ2h0ICsgOCA6IFNUUklQX1BYXG4gICAgY29uc3QgZml0ID0gTWF0aC5taW4oMSwgKGVsLmNsaWVudEhlaWdodCAtIHRvcCAtIDEyKSAvIEJFWkVMX1BYLCAoZWwuY2xpZW50V2lkdGggLSAyNCkgLyBCRVpFTF9QWClcbiAgICBjb25zdCBzdHlsZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICctLWZseS1tcyc6IG1zLFxuICAgICAgJy0tZml0JzogYCR7TWF0aC5tYXgoMC40LCBmaXQpLnRvRml4ZWQoMyl9YCxcbiAgICAgICctLWRyb3AnOiBgJHtNYXRoLm1heCgwLCBNYXRoLnJvdW5kKCh0b3AgLSAxMikgLyAyKSl9cHhgXG4gICAgfVxuICAgIGlmICghdGhpcy5mcm9tKSByZXR1cm4gc3R5bGVcbiAgICBjb25zdCBkeCA9IE1hdGgucm91bmQodGhpcy5mcm9tLnggLSBlbC5jbGllbnRXaWR0aCAvIDIpXG4gICAgY29uc3QgZHkgPSBNYXRoLnJvdW5kKHRoaXMuZnJvbS55IC0gZWwuY2xpZW50SGVpZ2h0IC8gMilcbiAgICByZXR1cm4geyAuLi5zdHlsZSwgJy0tZmx5LXgnOiBgJHtkeH1weGAsICctLWZseS15JzogYCR7ZHl9cHhgIH1cbiAgfVxuXG4gIGdldCByaW5nU3R5bGUgKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICAgIGNvbnN0IHIgPSB0aGlzLnJpbmdcbiAgICBpZiAoIXIpIHJldHVybiB7fVxuICAgIHJldHVybiB7ICctLXJpbmcteCc6IGAke01hdGgucm91bmQoci54KX1weGAsICctLXJpbmcteSc6IGAke01hdGgucm91bmQoci55KX1weGAsICctLXJpbmctZCc6IGAke01hdGgucm91bmQoci5yICogMil9cHhgLCAnLS1yaW5nLWsnOiBgJHsoci5yICogMiAvIDQ4MCkudG9GaXhlZCg0KX1gIH1cbiAgfVxuXG4gIHJlYWRvbmx5IGtub2JXaGVlbCA9IG5ldyBLbm9iV2hlZWwoKVxuXG4gIC8qKiBBIHNjcm9sbCBvbiB0aGUgc3RyaXAgb3IgdGhlIHN0YWdlIGFyb3VuZCB0aGUgc2NyZWVuIHR1cm5zIHRoZSBtb2RlbCdzIGtub2IgKHRoZSBwaWN0dXJlIG9ubHkpOyB0aGUgZW1iZWRkZWQgc2NyZWVuJ3Mgb3duIHNjcm9sbCBpcyBpdHMgb3duLiAqL1xuICBvbldoZWVsIChlOiBXaGVlbEV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLnJpbmcpIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGRldGVudHMgPSB0aGlzLmtub2JXaGVlbC50dXJuKGUuZGVsdGFZLCBlLmRlbHRhTW9kZSlcbiAgICBpZiAoZGV0ZW50cykgdGhpcy4kZW1pdCgndHVybicsIGRldGVudHMpXG4gIH1cblxuICBhc3luYyBtb3VudGVkICgpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleSlcbiAgICB0aGlzLnJpbmcgPSB0aGlzLnZpZXdlcj8uc2NyZWVuQ2lyY2xlKCkgPz8gbnVsbFxuICAgIHRoaXMuZmxpZ2h0ID0gdGhpcy5mbHlGcm9tKClcbiAgICAvLyBUaGUgbmV4dCBmcmFtZSwgc28gdGhlIHpvb20gc3RhcnRzIGZyb20gdGhlIHNjcmVlbiBvbiB0aGUgbW9kZWwuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5waGFzZSA9PT0gJ2luJykgdGhpcy5waGFzZSA9ICdvcGVuJ1xuICAgIH0pKVxuICAgIHRoaXMubG9hZGluZyA9IHRydWVcbiAgICBjb25zdCBidW5kbGUgPSBhd2FpdCBwYW5lbEJ1bmRsZSh0aGlzLnByaW50ZXJLZXksIChsb2FkZWQsIHRvdGFsKSA9PiB7IHRoaXMubG9hZFBlcmNlbnQgPSB0b3RhbCA+IDAgPyBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQobG9hZGVkIC8gdG90YWwgKiAxMDApKSA6IG51bGwgfSlcbiAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZVxuICAgIGlmICh0aGlzLnBoYXNlID09PSAnb3V0JyB8fCAodGhpcyBhcyB1bmtub3duIGFzIHsgX2lzRGVzdHJveWVkPzogYm9vbGVhbiB9KS5faXNEZXN0cm95ZWQpIHJldHVyblxuICAgIHRoaXMuc2VydmVkID0gYnVuZGxlLnN0YXRlID09PSAndW5rbm93bicgPyBudWxsIDogYnVuZGxlLnN0YXRlID09PSAneWVzJ1xuICAgIHRoaXMudW5yZWFjaGFibGUgPSBidW5kbGUuc3RhdGUgPT09ICd1bmtub3duJ1xuICAgIGlmIChidW5kbGUuc3RhdGUgPT09ICd5ZXMnKSB7XG4gICAgICB0aGlzLmh0bWwgPSBidW5kbGUuaHRtbFxuICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gdGhpcy5jb25uZWN0KCkpXG4gICAgfVxuICB9XG5cbiAgLyoqIFdoaWNoIHByaW50ZXIgdGhpcyBpcywgZnJvbSB3aGF0IENvbnRyb2wgaG9sZHMgKGl0cyBhZGRyZXNzLCBhbmQgdGhlIHByaW50ZXIgaWQgb24gYSBtYW5hZ2VkIHJvdXRlKSwgbmV2ZXIgZnJvbSB3aGF0IGEgcHJpbnRlciBzYXlzLiAqL1xuICBnZXQgcHJpbnRlcktleSAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgLy8gT25seSBhIHByaW50ZXIgaWQgQ29udHJvbCBpdHNlbGYgaG9sZHMgY291bnRzOyBvbiB0aGUgTEFOIHRoZXJlIGlzIG5vbmUsIHNvIG5vdGhpbmcgaXMga2VwdCBmb3IgaXQuXG4gICAgY29uc3QgaWQgPSBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZFxuICAgIHJldHVybiBpZCA/IGAke3RoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwgPz8gJyd9fCR7aWR9YCA6IG51bGxcbiAgfVxuXG4gIC8qKiBUaGUgc2NyZWVuJ3MgcGFnZSwgZmV0Y2hlZCBmcm9tIHRoZSBwcmludGVyLiAqL1xuICBodG1sID0gJydcbiAgLyoqIFdoaWxlIHRoZSBwYWdlIGNvbWVzIG92ZXIgdGhlIHJvdXRlIChhIEJsdWV0b290aCBsaW5rIHRha2VzIGEgd2hpbGUpLiAqL1xuICBsb2FkaW5nID0gZmFsc2VcbiAgLyoqIEhvdyBtdWNoIG9mIGl0IGhhcyBjb21lLCAwIHRvIDEwMCwgb3IgbnVsbCB3aGVuIHRoZSByb3V0ZSBjYW4ndCBzYXkuICovXG4gIGxvYWRQZXJjZW50OiBudW1iZXIgfCBudWxsID0gbnVsbFxuXG4gIC8qKiBFc2MsIERvbmUgb3IgYSBjbGljayBvdXRzaWRlOiBmbHkgYmFjayBvdXQgdG8gdGhlIG1vZGVsLCB0aGVuIGNsb3NlLiAqL1xuICBjbG9zZSAoKSB7XG4gICAgaWYgKHRoaXMucGhhc2UgPT09ICdvdXQnKSByZXR1cm5cbiAgICB0aGlzLnBoYXNlID0gJ291dCdcbiAgICBjbGVhclRpbWVvdXQodGhpcy5mbHlUaW1lcilcbiAgICB0aGlzLmZseVRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy4kZW1pdCgnY2xvc2UnKSwgdGhpcy5yZWR1Y2VkTW90aW9uID8gMCA6IEZMWV9NUylcbiAgfVxuXG4gIC8qKiBUaGUgbm90ZSBpbiB0aGUgc3RyaXA6IHdoYXQgd2FzIHJlZnVzZWQsIGFuZCB3aHkuIEl0IHN0YXlzIHVudGlsIGl0IGlzIGNsaWNrZWQgYXdheSBvciB0aGUgc2NyZWVuIGlzIGxlZnQsIHNvIGl0IGNhbiBiZSByZWFkLiAqL1xuICBzYXkgKHRleHQ6IHN0cmluZykge1xuICAgIHRoaXMucmVmdXNlZFRleHQgPSB0ZXh0XG4gICAgdGhpcy5yZWZ1c2VkTGFzdCA9IHRydWVcbiAgfVxuXG4gIC8qKiBUaGUgYnJpZGdlIHRvIHRoZSBmcmFtZWQgc2NyZWVuLCBvbiBDb250cm9sJ3MgY29ubmVjdGlvbiwgYWZ0ZXIgdGhlIGFsbG93bGlzdC4gKi9cbiAgY29ubmVjdCAoKSB7XG4gICAgY29uc3QgZnJhbWUgPSB0aGlzLiRyZWZzLmZyYW1lIGFzIEhUTUxJRnJhbWVFbGVtZW50IHwgdW5kZWZpbmVkXG4gICAgaWYgKCFmcmFtZSkgcmV0dXJuXG4gICAgYnJpZGdlcy5zZXQodGhpcywgbmV3IFBhbmVsQnJpZGdlKGZyYW1lLCB7XG4gICAgICBycGM6IGFzeW5jIChtZXRob2QsIHBhcmFtcykgPT4ge1xuICAgICAgICBjb25zdCB3aHkgPSB0aGlzLnJwY1JlZnVzYWwobWV0aG9kLCBwYXJhbXMpXG4gICAgICAgIGlmICh3aHkpIHsgdGhpcy5zYXkod2h5KTsgdGhyb3cgbmV3IEVycm9yKHdoeSkgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLiRzb2NrZXQuZW1pdChtZXRob2QsIHsgcGFyYW1zIH0pXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJpbnRlciByZWZ1c2VkIHRoYXQuJylcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgfSxcbiAgICAgIGF1eEdldDogYXN5bmMgcGF0aCA9PiAoYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuZ2V0KGAvc2VydmVyL2F1eCR7cGF0aH1gKSkuZGF0YSxcbiAgICAgIHN0YXR1czogKCkgPT4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgY29ubmVjdGlvbklkOiAoKSA9PiAodGhpcy4kc3RvcmUuc3RhdGUuc29ja2V0LmNvbm5lY3Rpb25JZCBhcyBudW1iZXIgfCBudWxsKSA/PyBudWxsLFxuICAgICAgdmVyYjogdiA9PiB7XG4gICAgICAgIGNvbnN0IHdoeSA9IHRoaXMucnVuVmVyYih2KVxuICAgICAgICBpZiAod2h5KSB0aGlzLnNheSh3aHkpXG4gICAgICAgIHJldHVybiB3aHlcbiAgICAgIH0sXG4gICAgICAvLyBUaGUgcHJpbnRlcidzIGxpdmUgcGFuZWwgc3RhdGUsIG92ZXIgdGhlIHNhbWUgcm91dGUgYXMgZXZlcnl0aGluZyBlbHNlOiBhbnkgc3RhdHVzIGNvbWVzIGJhY2sgYXMgZGF0YS5cbiAgICAgIHBhbmVsR2V0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSBhd2FpdCBodHRwQ2xpZW50QWN0aW9ucy5nZXQoUEFORUxfU1RBVEVfUEFUSCwgeyB2YWxpZGF0ZVN0YXR1czogKCkgPT4gdHJ1ZSB9KVxuICAgICAgICByZXR1cm4geyBzdGF0dXM6IHIuc3RhdHVzLCBib2R5OiByLmRhdGEgfVxuICAgICAgfSxcbiAgICAgIHBhbmVsUG9zdDogYXN5bmMgYm9keSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSBhd2FpdCBodHRwQ2xpZW50QWN0aW9ucy5wb3N0KFBBTkVMX05BVklHQVRFX1BBVEgsIGJvZHksIHsgdmFsaWRhdGVTdGF0dXM6ICgpID0+IHRydWUgfSlcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiByLnN0YXR1cywgYm9keTogci5kYXRhIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBvblJlZnVzZWQ6IHdoYXQgPT4gdGhpcy5zYXkocmVmdXNhbE5vdGUod2hhdCkpLFxuICAgICAgb25TdXBwb3J0OiBzdXBwb3J0ZWQgPT4geyB0aGlzLmxpdmVTdXBwb3J0ZWQgPSBzdXBwb3J0ZWQgfVxuICAgIH0pKVxuICAgIC8vIE9ubHkgdGhlIHdlYnNvY2tldCdzIG93biBwdXNoIHdoaWxlIGl0IHdvcmtzOyBhIHN0YXRlIHBvbGwgb25seSB3aGlsZSBpdCBpcyBkb3duIG9yIHNpbGVudC5cbiAgICBpZiAodGhpcy53c0Rvd24pIGJyaWRnZXMuZ2V0KHRoaXMpPy5zZXRQb2xsaW5nKHRydWUpXG4gICAgLy8gTW9vbnJha2VyJ3Mgbm90aWZpY2F0aW9ucywgYXMgQ29udHJvbCdzIHNvY2tldCBwYXNzZXMgdGhlbSB0byB0aGUgc3RvcmUsIHBhc3NlZCBvbi5cbiAgICB0aGlzLnN0b3BBY3Rpb25zID0gdGhpcy4kc3RvcmUuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiA9PiB7XG4gICAgICBjb25zdCBicmlkZ2UgPSBicmlkZ2VzLmdldCh0aGlzKVxuICAgICAgaWYgKCFicmlkZ2UpIHJldHVyblxuICAgICAgaWYgKGFjdGlvbi50eXBlID09PSAnc29ja2V0L25vdGlmeU11b25QYW5lbFN0YXRlJykge1xuICAgICAgICBicmlkZ2UucGFuZWxOb3RpZnkoYWN0aW9uLnBheWxvYWQpXG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbi50eXBlID09PSAncHJpbnRlci9vbkZhc3ROb3RpZnlTdGF0dXNVcGRhdGUnKSB7XG4gICAgICAgIGNvbnN0IHsga2V5LCBwYXlsb2FkIH0gPSBhY3Rpb24ucGF5bG9hZCBhcyB7IGtleTogc3RyaW5nLCBwYXlsb2FkOiB1bmtub3duIH1cbiAgICAgICAgYnJpZGdlLm5vdGlmeSgnbm90aWZ5X3N0YXR1c191cGRhdGUnLCBbeyBba2V5XTogcGF5bG9hZCB9XSlcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uLnR5cGUgaW4gTk9USUZZX0FDVElPTlMpIHtcbiAgICAgICAgYnJpZGdlLm5vdGlmeShOT1RJRllfQUNUSU9OU1thY3Rpb24udHlwZV0sIFthY3Rpb24ucGF5bG9hZF0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmZseVRpbWVyKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5KVxuICAgIHRoaXMuc3RvcEFjdGlvbnM/LigpXG4gICAgYnJpZGdlcy5nZXQodGhpcyk/LmRpc3Bvc2UoKVxuICAgIGJyaWRnZXMuZGVsZXRlKHRoaXMpXG4gIH1cblxuICAvKiogQW5vdGhlciBwcmludGVyLCBvciBLbGlwcHkgZ29uZTogdGhlIHNjcmVlbiB3YXMgdGhpcyBwcmludGVyJ3MsIHNvIGl0IGNsb3Nlcy4gKi9cbiAgQFdhdGNoKCdjb25uZWN0aW9uS2V5JylcbiAgb25Db25uZWN0aW9uQ2hhbmdlICgpIHtcbiAgICB0aGlzLiRlbWl0KCdjbG9zZScpXG4gIH1cblxuICAvKiogVGhlIHdlYnNvY2tldCBpcyBkb3duIG9yIGhhcyBnb25lIHF1aWV0OiB0aGUgb25lIHRpbWUgdGhlIHBhbmVsIHN0YXRlIGlzIHBvbGxlZCAoMiBzKS4gQmFjayB1cDogb25lIHJlLXJlYWQsIHRoZW4gcHVzaGVzIG9ubHkuICovXG4gIGdldCB3c0Rvd24gKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHMgPSB0aGlzLiRzdG9yZS5zdGF0ZS5zb2NrZXRcbiAgICByZXR1cm4gIXMub3BlbiB8fCAhIXMuc3RhbGxlZFxuICB9XG5cbiAgQFdhdGNoKCd3c0Rvd24nKVxuICBvbldzRG93biAoZG93bjogYm9vbGVhbikge1xuICAgIGNvbnN0IGJyaWRnZSA9IGJyaWRnZXMuZ2V0KHRoaXMpXG4gICAgaWYgKCFicmlkZ2UpIHJldHVyblxuICAgIGJyaWRnZS5zZXRQb2xsaW5nKGRvd24pXG4gICAgaWYgKCFkb3duKSBicmlkZ2Uuc3luY1BhbmVsKCkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKVxuICB9XG5cbiAgZ2V0IGNvbm5lY3Rpb25LZXkgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcyA9IHRoaXMuJHN0b3JlLnN0YXRlLnNvY2tldFxuICAgIHJldHVybiBgJHt0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsID8/ICcnfXwke3MuY29ubmVjdGlvbklkID8/ICcnfXwke3Mub3BlbiA/IDEgOiAwfXwke3RoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci53ZWJob29rcz8uc3RhdGUgPz8gJyd9YFxuICB9XG5cbiAgLyoqXG4gICAqIEEgdmVyYiBmcm9tIHRoZSBzY3JlZW4sIHJ1biBhcyBDb250cm9sJ3Mgb3duIGJ1dHRvbnMgcnVuIGl0OiBhIGpvZyBieVxuICAgKiBtb3ZlQnkgKHRoZSBuby1nbyBwbGFubmVyIGFuZCB0aGUgaGFuZC1tb3ZlIHdhaXQpLCBob21lLCBhIGhlYXRlciB0YXJnZXRcbiAgICogYnkgc2V0SGVhdGVyIChpbnNpZGUgaXRzIGxpbWl0cyksIGxvYWQgYW5kIHVubG9hZCBhcyB0aGUgRmlsYW1lbnQgY2FyZFxuICAgKiBydW5zIHRoZW0uIE9ubHkgd2hpbGUgdGhlIHByaW50ZXIgaXMgaWRsZSBhbmQgQ29udHJvbCBjYW4gYWN0OyAnJyB3aGVuXG4gICAqIGl0IHdhcyBzZW50LCBlbHNlIHdoeSBub3QuXG4gICAqL1xuICBydW5WZXJiICh2OiBWZXJiKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybiAnTm90IHdoaWxlIHRoZSBwcmludGVyIGlzIGJ1c3kuJ1xuICAgIHN3aXRjaCAodi52ZXJiKSB7XG4gICAgICBjYXNlICdqb2cnOiB7XG4gICAgICAgIGlmICghdGhpcy5pc0hvbWVkKHYuYXhpcykpIHJldHVybiAnSG9tZSB0aGUgcHJpbnRlciBmaXJzdC4nXG4gICAgICAgIGNvbnN0IHdhaXQgPSB0aGlzLmhhbmRNb3ZlV2FpdCgpXG4gICAgICAgIGlmICh3YWl0KSByZXR1cm4gd2FpdFxuICAgICAgICB0aGlzLm1vdmVCeSh2LmF4aXMsIHYuYnkpXG4gICAgICAgIHJldHVybiAnJ1xuICAgICAgfVxuICAgICAgY2FzZSAnaG9tZSc6XG4gICAgICAgIHRoaXMuaG9tZSh2LmF4ZXMpXG4gICAgICAgIHJldHVybiAnJ1xuICAgICAgY2FzZSAnaGVhdCc6IHtcbiAgICAgICAgY29uc3QgaGVhdGVyID0gdi5oZWF0ZXIgPT09ICdleHRydWRlcicgPyB0aGlzLm5venpsZSA6IHRoaXMuYmVkXG4gICAgICAgIGlmICghaGVhdGVyKSByZXR1cm4gJ1RoYXQgaGVhdGVyIGlzIG5vdCBvbiB0aGlzIHByaW50ZXIuJ1xuICAgICAgICBjb25zdCB3aHkgPSB0aGlzLmhlYXRSZWZ1c2FsKGhlYXRlci5uYW1lLCB2LnRhcmdldClcbiAgICAgICAgaWYgKHdoeSkgcmV0dXJuIHdoeVxuICAgICAgICB0aGlzLnNldEhlYXRlcihoZWF0ZXIsIHYudGFyZ2V0KVxuICAgICAgICByZXR1cm4gJydcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2Zhbic6IHtcbiAgICAgICAgY29uc3QgZmFuID0gdi5mYW4gPT09ICdwYXJ0JyA/IHRoaXMucGFydEZhbiA6IHRoaXMuZmFucy5maW5kKGYgPT4gZi50eXBlID09PSAnZmFuX2dlbmVyaWMnICYmIGYubmFtZSA9PT0gdi5mYW4pXG4gICAgICAgIGlmICghZmFuKSByZXR1cm4gJ1RoYXQgZmFuIGlzIG5vdCBvbiB0aGlzIHByaW50ZXIuJ1xuICAgICAgICB0aGlzLnNldEZhbihmYW4sIHYucGVyY2VudClcbiAgICAgICAgcmV0dXJuICcnXG4gICAgICB9XG4gICAgICBjYXNlICdmaWxhbWVudCc6IHtcbiAgICAgICAgY29uc3QgbWFjcm9zID0gKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydtYWNyb3MvZ2V0TWFjcm9zJ10gYXMgTWFjcm9bXSkgPz8gW10pLmZpbHRlcihtID0+IHR5cGVvZiBtLm5hbWUgPT09ICdzdHJpbmcnKVxuICAgICAgICBjb25zdCBtYWNybyA9IHYuYWN0aW9uID09PSAnbG9hZCdcbiAgICAgICAgICA/IGZpbmRGaWxhbWVudE1hY3JvKG1hY3JvcywgJ2xvYWRfZmlsYW1lbnQnLCAnZmlsYW1lbnRfbG9hZCcpXG4gICAgICAgICAgOiBmaW5kRmlsYW1lbnRNYWNybyhtYWNyb3MsICd1bmxvYWRfZmlsYW1lbnQnLCAnZmlsYW1lbnRfdW5sb2FkJylcbiAgICAgICAgaWYgKCFtYWNybykgcmV0dXJuICdUaGlzIHByaW50ZXIgaGFzIG5vIG1hY3JvIGZvciB0aGF0LidcbiAgICAgICAgY29uc3QgdGVtcCA9IHRoaXMubWF0ZXJpYWw/Lm5venpsZSA/PyB0aGlzLmxvYWRlZE1hdGVyaWFsPy5ub3p6bGUgPz8gbnVsbFxuICAgICAgICB0aGlzLnNlbmRHY29kZShtYWNyby50YWtlc1RlbXAgJiYgdGVtcCA/IGAke21hY3JvLm5hbWV9IFRFTVA9JHt0ZW1wfWAgOiBtYWNyby5uYW1lKVxuICAgICAgICByZXR1cm4gJydcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2h5IGEgZm9yd2FyZGVkIHByaW50IGNhbGwgaXNuJ3Qgc2VudCwgJycgd2hlbiBpdCBpczogdGhlIHNhbWUgZ2F0ZXMgYXNcbiAgICogQ29udHJvbCdzIG93biBidXR0b25zLCBhcyBydW5WZXJiIGFwcGxpZXMgdGhlbS4gRS1zdG9wIG1pcnJvcnMgQ29udHJvbCdzXG4gICAqIEUtU1RPUCBidXR0b24gKEFwcEJhciBlc3RvcFJlYWR5KTogc2lnbmVkIGluLCBjb25uZWN0ZWQsIEtsaXBwZXIgcmVhZHkuXG4gICAqIFJlYWRzIHBhc3MuXG4gICAqL1xuICBycGNSZWZ1c2FsIChtZXRob2Q6IHN0cmluZywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBzdHJpbmcge1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICBjYXNlICdwcmludGVyLmVtZXJnZW5jeV9zdG9wJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlZCAmJiB0aGlzLnNvY2tldENvbm5lY3RlZCAmJiB0aGlzLmtsaXBweVJlYWR5ID8gJycgOiB0aGlzLmNvbnRyb2xMb2NrIHx8IHRoaXMubm90UmVhZHlSZWFzb25cbiAgICAgIGNhc2UgJ3ByaW50ZXIuZ2NvZGUuc2NyaXB0JzpcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIHRoaXMuY29udHJvbExvY2tcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVzeSA/ICdOb3Qgd2hpbGUgdGhlIHByaW50ZXIgaXMgYnVzeS4nIDogZ2NvZGVSZWZ1c2FsKHBhcmFtcz8uc2NyaXB0KVxuICAgICAgY2FzZSAnc2VydmVyLmpvYl9xdWV1ZS5wb3N0X2pvYic6XG4gICAgICBjYXNlICdzZXJ2ZXIuam9iX3F1ZXVlLnN0YXJ0JzpcbiAgICAgIGNhc2UgJ3NlcnZlci5qb2JfcXVldWUucGF1c2UnOlxuICAgICAgY2FzZSAnc2VydmVyLmpvYl9xdWV1ZS5qdW1wJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbFJlYWR5ID8gJycgOiB0aGlzLmNvbnRyb2xMb2NrXG4gICAgICBjYXNlICdwcmludGVyLnByaW50LnN0YXJ0JzpcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIHRoaXMuY29udHJvbExvY2tcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVzeSA/ICdOb3Qgd2hpbGUgdGhlIHByaW50ZXIgaXMgYnVzeS4nIDogJydcbiAgICAgIGNhc2UgJ3ByaW50ZXIucHJpbnQucGF1c2UnOlxuICAgICAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICAgICAgICByZXR1cm4gdGhpcy5wcmludGVyUHJpbnRpbmcgPyAnJyA6ICdUaGUgcHJpbnRlciBpcyBub3QgcHJpbnRpbmcuJ1xuICAgICAgY2FzZSAncHJpbnRlci5wcmludC5yZXN1bWUnOlxuICAgICAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICAgICAgICByZXR1cm4gdGhpcy5wcmludGVyUGF1c2VkID8gJycgOiAnVGhlIHByaW50IGlzIG5vdCBwYXVzZWQuJ1xuICAgICAgY2FzZSAncHJpbnRlci5wcmludC5jYW5jZWwnOlxuICAgICAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICAgICAgICByZXR1cm4gdGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkID8gJycgOiAnVGhlcmUgaXMgbm8gcHJpbnQgdG8gY2FuY2VsLidcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBIGhlYXQgdGFyZ2V0IGZyb20gdGhlIHNjcmVlbjogcmVmdXNlZCAobmV2ZXIgY2xhbXBlZCkgYWJvdmUgdGhlIGhlYXRlcidzXG4gICAqIG1heF90ZW1wLCB3aGljaCBpcyByZWFkIGxpdmUgZnJvbSB0aGUgcHJpbnRlcidzIGNvbmZpZywgYW5kIHJlZnVzZWQgd2hlblxuICAgKiB0aGF0IGlzIG5vdCBrbm93bi4gJycgd2hlbiBpdCBtYXkgZ28uXG4gICAqL1xuICBoZWF0UmVmdXNhbCAoaGVhdGVyOiBzdHJpbmcsIHRhcmdldDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9ICh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZT8uc2V0dGluZ3MgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHsgbWF4X3RlbXA/OiB1bmtub3duIH0gfCB1bmRlZmluZWQ+XG4gICAgY29uc3QgbWF4ID0gTnVtYmVyKHNldHRpbmdzW2hlYXRlcl0/Lm1heF90ZW1wKVxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKG1heCkgfHwgbWF4IDw9IDApIHJldHVybiAnVGhpcyBwcmludGVyIGhhcyBub3Qgc2FpZCBob3cgaG90IHRoYXQgaGVhdGVyIG1heSBnby4nXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodGFyZ2V0KSB8fCB0YXJnZXQgPCAwKSByZXR1cm4gJ1RoYXQgaXMgbm90IGEgdGVtcGVyYXR1cmUgdGhpcyBoZWF0ZXIgY2FuIGJlIHNldCB0by4nXG4gICAgaWYgKHRhcmdldCA+IG1heCkgcmV0dXJuICdUaGF0IGlzIGhvdHRlciB0aGFuIHRoaXMgaGVhdGVyIGdvZXMuJ1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgb25LZXkgKGU6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB0aGlzLmNsb3NlKClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm0xLXNjcmVlbiB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGluc2V0OiAwO1xuICAgIHotaW5kZXg6IDU7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBwbGFjZS1pdGVtczogY2VudGVyO1xuICAgIGJhY2tncm91bmQ6IHJnYigwIDAgMCAvIDU1JSk7XG4gICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDZweCk7XG4gICAgcG9pbnRlci1ldmVudHM6IGF1dG87XG4gICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZCB2YXIoLS1mbHktbXMsIDM4MG1zKSBlYXNlLCBiYWNrZHJvcC1maWx0ZXIgdmFyKC0tZmx5LW1zLCAzODBtcykgZWFzZTtcbiAgfVxuXG4gIC8qIFpvb21pbmcgaW4gZnJvbSB0aGUgbW9kZWwncyBzY3JlZW4sIGFuZCBiYWNrIG91dCB0byBpdC4gKi9cbiAgLm0xLXNjcmVlbl9fYmV6ZWwsXG4gIC5tMS1zY3JlZW5fX3N0cmlwIHtcbiAgICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gdmFyKC0tZmx5LW1zLCAzODBtcykgY3ViaWMtYmV6aWVyKDAuMiwgMC44LCAwLjIsIDEpLCBvcGFjaXR5IHZhcigtLWZseS1tcywgMzgwbXMpIGVhc2U7XG4gIH1cblxuICAubTEtc2NyZWVuLS1pbixcbiAgLm0xLXNjcmVlbi0tb3V0IHtcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMCAwIDAgLyAwJSk7XG4gICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDApO1xuXG4gICAgLm0xLXNjcmVlbl9fYmV6ZWwge1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUodmFyKC0tZmx5LXgsIDApLCB2YXIoLS1mbHkteSwgMCkpIHNjYWxlKGNhbGMoMC4xNCAqIHZhcigtLWZpdCwgMSkpKTtcbiAgICAgIG9wYWNpdHk6IDAuNDtcbiAgICB9XG5cbiAgICAubTEtc2NyZWVuX19zdHJpcCB7XG4gICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLThweCk7XG4gICAgICBvcGFjaXR5OiAwO1xuICAgIH1cbiAgfVxuXG4gIC5tMS1zY3JlZW5fX2VtcHR5IHtcbiAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgIG1hcmdpbjogMDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgY29sb3I6ICMzYTNhM2M7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG5cbiAgICBwIHsgbWFyZ2luOiAwIDAgMTBweDsgfVxuICB9XG5cbiAgLm0xLXNjcmVlbl9fcHJvZ3Jlc3Mge1xuICAgIHdpZHRoOiAxODBweDtcbiAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiA4cHg7XG4gICAgYWNjZW50LWNvbG9yOiAjMGE2Yzc0O1xuICB9XG5cbiAgLm0xLXNjcmVlbl9fc3RyaXAge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDEycHg7XG4gICAgbGVmdDogMTJweDtcbiAgICByaWdodDogMTJweDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICAgIHotaW5kZXg6IDE7XG4gICAgcGFkZGluZzogOHB4IDEwcHggOHB4IDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMzYgMzYgNDAgLyA4MiUpO1xuICAgIGNvbG9yOiAjZjVmNWY3O1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5tMS1zY3JlZW5fX2xpdmUge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgY29sb3I6IHJnYig0OCAyMDkgODgpO1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICAubTEtc2NyZWVuX19kb3Qge1xuICAgIHdpZHRoOiA3cHg7XG4gICAgaGVpZ2h0OiA3cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IGN1cnJlbnRDb2xvcjtcbiAgfVxuXG4gIC5tMS1zY3JlZW5fX3doYXQge1xuICAgIGZsZXg6IDE7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5tMS1zY3JlZW5fX2hpbnQge1xuICAgIGNvbG9yOiAjOTg5ODlkO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuXG4gICAgQG1lZGlhIChtYXgtd2lkdGg6IDYwMHB4KSB7XG4gICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cbiAgfVxuXG4gIC5tMS1zY3JlZW5fX2xpdmVub3RlIHtcbiAgICBjb2xvcjogI2ZmZDYwYTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAubTEtc2NyZWVuX19kb25lIHtcbiAgICBoZWlnaHQ6IDMwcHg7XG4gICAgcGFkZGluZzogMCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHJnYigxMTggMTE4IDEyOCAvIDI0JSk7XG4gICAgY29sb3I6ICNmNWY1Zjc7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC8qIFRoZSBwYW5lbCBpcyBhIDQ4MCBweCBjaXJjbGU7IGRyYXduIGF0IDMwMCBweCBpbiBhIGxpZ2h0IGJlemVsIGxpa2UgdGhlIE0xJ3MuICovXG4gIC5tMS1zY3JlZW5fX2JlemVsIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgd2lkdGg6IDM0MHB4O1xuICAgIGhlaWdodDogMzQwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudChjaXJjbGUgYXQgNTAlIDQwJSwgI2U5ZTllYSwgIzljOWNhMCk7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBwbGFjZS1pdGVtczogY2VudGVyO1xuICAgIGJveC1zaGFkb3c6IDAgMzBweCA2MHB4IHJnYigwIDAgMCAvIDYwJSk7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKHZhcigtLWRyb3AsIDApKSBzY2FsZSh2YXIoLS1maXQsIDEpKTtcbiAgfVxuXG4gIC5tMS1zY3JlZW5fX2ZyYW1lIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgbGVmdDogNTAlO1xuICAgIHRvcDogNTAlO1xuICAgIHdpZHRoOiA0ODBweDtcbiAgICBoZWlnaHQ6IDQ4MHB4O1xuICAgIG1hcmdpbjogLTI0MHB4IDAgMCAtMjQwcHg7XG4gICAgYm9yZGVyOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuNjI1KTtcbiAgICBiYWNrZ3JvdW5kOiAjMDAwO1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDNweCAjMjIyLCAwIDAgMCA1cHggcmdiKDEyOCAyMTQgMjA5IC8gNTUlKTtcbiAgfVxuXG4gIC8qXG4gICAqIFRoZSBjYW1lcmEgaGFzIGZsb3duIGluIHRvIHRoZSBtb2RlbCdzIG93biBzY3JlZW4sIHN0cmFpZ2h0IGRvd246IHRoZSBzdGFnZSBpcyBsZWZ0IGNsZWFyICh0aGUgbW9kZWwncyBzY3JlZW4gYW5kIGl0c1xuICAgKiBrbm9iIGFyZSB3aGF0IGlzIGZyYW1lZCwgYW5kIGEgc2Nyb2xsIG9yIGEgY2xpY2sgdGhlcmUgZ29lcyB0byB0aGUga25vYiksIGFuZCB0aGUgbGl2ZSBzY3JlZW4gc2l0cyBvbiB0aGUgZGlzYy4gSXRcbiAgICogZmFkZXMgaW4gYXMgdGhlIGNhbWVyYSBhcnJpdmVzLCBhbmQgZ29lcyBhdCBvbmNlIG9uIHRoZSB3YXkgb3V0LlxuICAgKi9cbiAgLm0xLXNjcmVlbi0tY2FtZXJhIHtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICBiYWNrZHJvcC1maWx0ZXI6IG5vbmU7XG5cbiAgICAubTEtc2NyZWVuX19zdHJpcCxcbiAgICAubTEtc2NyZWVuX19iZXplbCxcbiAgICAubTEtc2NyZWVuX19ub3RlIHtcbiAgICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuICAgIH1cblxuICAgIC5tMS1zY3JlZW5fX2JlemVsIHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIGxlZnQ6IGNhbGModmFyKC0tcmluZy14KSAtIHZhcigtLXJpbmctZCkgLyAyKTtcbiAgICAgIHRvcDogY2FsYyh2YXIoLS1yaW5nLXkpIC0gdmFyKC0tcmluZy1kKSAvIDIpO1xuICAgICAgd2lkdGg6IHZhcigtLXJpbmctZCk7XG4gICAgICBoZWlnaHQ6IHZhcigtLXJpbmctZCk7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgICB0cmFuc2Zvcm06IG5vbmU7XG4gICAgICBvcGFjaXR5OiAxO1xuICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSBjYWxjKHZhcigtLWZseS1tcywgMzgwbXMpICogMC40NSkgZWFzZSBjYWxjKHZhcigtLWZseS1tcywgMzgwbXMpICogMC41NSk7XG4gICAgfVxuXG4gICAgLm0xLXNjcmVlbl9fZnJhbWUge1xuICAgICAgdHJhbnNmb3JtOiBzY2FsZSh2YXIoLS1yaW5nLWspKTtcbiAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2IoMTI4IDIxNCAyMDkgLyA0MCUpO1xuICAgIH1cblxuICAgICYubTEtc2NyZWVuLS1pbiAubTEtc2NyZWVuX19iZXplbCB7XG4gICAgICBvcGFjaXR5OiAwO1xuICAgICAgdHJhbnNmb3JtOiBub25lO1xuICAgIH1cblxuICAgICYubTEtc2NyZWVuLS1vdXQgLm0xLXNjcmVlbl9fYmV6ZWwge1xuICAgICAgb3BhY2l0eTogMDtcbiAgICAgIHRyYW5zZm9ybTogbm9uZTtcbiAgICAgIHRyYW5zaXRpb24tZGVsYXk6IDBzO1xuICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMC4xMnM7XG4gICAgfVxuICB9XG5cbiAgLm0xLXNjcmVlbl9fbm90ZSB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGJvdHRvbTogMTZweDtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogNnB4IDEycHg7XG4gICAgYm9yZGVyOiAwO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMzYgMzYgNDAgLyA4NiUpO1xuICAgIGNvbG9yOiAjZmZjNDhhO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL20xL00xU2NyZWVuLnZ1ZSJ9