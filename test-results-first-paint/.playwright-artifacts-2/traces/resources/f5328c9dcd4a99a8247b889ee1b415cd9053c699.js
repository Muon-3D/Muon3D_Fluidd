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
import { Component, Mixins, Ref, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
import FilesMixin from "/src/mixins/files.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { Globals } from "/src/globals.ts";
import { commandHelp, entryKind, explain, filterEntries, suggestions } from "/src/services/console/model.ts";
import TonePill from "/src/components/printers/TonePill.vue";
import ConsoleMacros from "/src/components/console/ConsoleMacros.vue";
import { consoleView } from "/src/services/console/view.ts";
import { arrowIsHistory, enterAction, MAX_LINE_ROWS } from "/src/services/console/keys.ts";
import { chipText, consoleConfig, quickCommandsFor, accountQuickKey } from "/src/services/console/settings.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
const QUICK_RULES = {
  G28: { moves: true, homed: false },
  BED_MESH_CALIBRATE: { moves: true, homed: true }
};
const firstWord = (command) => command.trim().split(/\s/)[0]?.toUpperCase() ?? "";
let Console = class extends Mixins(ControlMixin, FilesMixin, BrowserMixin) {
  scroller;
  get filter() {
    return consoleView.filter;
  }
  set filter(value) {
    consoleView.filter = value;
  }
  find = "";
  command = "";
  onCommandChange() {
    this.fit();
  }
  open = false;
  picked = -1;
  /** Where ↑ has got to in the history; -1 is the line being typed. */
  back = -1;
  paused = false;
  get entries() {
    return this.$store.getters["console/getConsoleEntries"] ?? [];
  }
  get knownCommands() {
    return this.$store.getters["console/getAllKnownCommands"] ?? {};
  }
  /** Settings › Console. */
  get prefs() {
    return consoleConfig(this.$store.state.config.uiSettings.console);
  }
  /** Newest at the top (Settings › Console › Newest at). */
  get flipped() {
    return !!this.$store.state.config.uiSettings.general?.flipConsoleLayout;
  }
  get shown() {
    const lines = filterEntries(this.entries.slice(-this.prefs.linesKept), this.filter, this.find).map((e, i) => {
      const kind = entryKind(e);
      return {
        key: `${e.id ?? "n"}-${e.time ?? 0}-${i}`,
        kind,
        time: e.time ? this.$filters.formatTimeWithSeconds(e.time * 1e3) : "",
        html: this.linked(e, kind),
        why: kind === "error" || kind === "warning" ? explain(e.message) : null
      };
    });
    return this.flipped ? lines.reverse() : lines;
  }
  /** Commands Klipper knows, in a reply, become links that put them in the line, as Fluidd's console does. */
  linked(e, kind) {
    if (kind === "command") return `${Globals.CONSOLE_SEND_PREFIX}<a class="cons__cmd">${e.message}</a>`;
    return e.message.replace(/\b([A-Z][A-Z0-9_]{2,})\b/g, (match, word) => word in this.knownCommands ? `<a class="cons__cmd">${word}</a>` : match);
  }
  onLineClick(event) {
    const target = event.target;
    if (target.tagName !== "A") return;
    this.command = (target.textContent ?? "").trim();
    this.open = false;
    this.$refs.input.focus();
  }
  // -- the log's scrolling ------------------------------------------------------
  mounted() {
    this.scroller.$el.addEventListener("scroll", this.onScroll);
    this.$nextTick(() => this.toLatest(true));
  }
  beforeDestroy() {
    this.scroller.$el.removeEventListener("scroll", this.onScroll);
  }
  /** Scrolled up to read, the log stays put; at the bottom, it follows. */
  onScroll() {
    const el = this.scroller.$el;
    this.paused = this.flipped ? el.scrollTop > 4 : el.scrollHeight - el.scrollTop - el.clientHeight > 4;
  }
  onShown() {
    this.$nextTick(() => this.toLatest());
  }
  toLatest(force = false) {
    if (this.paused && !force) return;
    if (this.flipped) {
      if (this.scroller) this.scroller.$el.scrollTop = 0;
    } else this.scroller?.scrollToBottom();
    if (force) this.paused = false;
  }
  // -- the bar ------------------------------------------------------------------------
  get hideTempWaits() {
    return !!this.$store.state.config.uiSettings.general.hideTempWaits;
  }
  set hideTempWaits(value) {
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.hideTempWaits", value, server: true });
  }
  downloadLog() {
    this.downloadFile("klippy.log", "logs");
  }
  // -- the line ---------------------------------------------------------------------
  /** Sent commands, newest first, as Fluidd keeps them (repeats included, so they can be counted). */
  get history() {
    return this.$store.state.console.commandHistory ?? [];
  }
  get uniqueHistory() {
    return [...new Set(this.history)];
  }
  get list() {
    return this.prefs.suggest ? suggestions(this.command, this.knownCommands, this.history) : [];
  }
  get typedCommand() {
    return this.command.trim().split(/\s/)[0]?.toUpperCase() ?? "";
  }
  get help() {
    return commandHelp(this.command, this.knownCommands);
  }
  take(s) {
    this.command = s.from === "command" ? `${s.text} ` : s.text;
    this.open = false;
    this.picked = -1;
  }
  onKey(event) {
    const listing = this.open && this.list.length > 0;
    switch (event.key) {
      case "Tab":
        if (!listing) return;
        this.take(this.list[Math.max(0, this.picked)]);
        break;
      case "ArrowDown":
        if (!listing && !this.caretOnEdge("down")) return;
        if (listing) this.picked = Math.min(this.list.length - 1, this.picked + 1);
        else this.recall(-1);
        break;
      case "ArrowUp":
        if (!listing && !this.caretOnEdge("up")) return;
        if (listing && this.picked > 0) this.picked--;
        else if (listing && this.picked === 0) this.picked = -1;
        else this.recall(1);
        break;
      case "Enter":
        if (listing && this.picked >= 0 && !event.shiftKey) this.take(this.list[this.picked]);
        else if (enterAction(event, this.prefs.enterSends) === "send") this.send();
        else return;
        break;
      case "Escape":
        if (!listing) return;
        this.open = false;
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  /** ↑ and ↓ recall history only from the first or last line of what is typed. */
  caretOnEdge(direction) {
    const el = this.$refs.input;
    if (!el) return true;
    return arrowIsHistory(direction, this.command, el.selectionStart, el.selectionEnd);
  }
  /** Grows the line to fit what is typed, up to MAX_LINE_ROWS, then it scrolls. */
  fit() {
    this.$nextTick(() => {
      const el = this.$refs.input;
      if (!el) return;
      el.style.height = "auto";
      const line = parseFloat(getComputedStyle(el).lineHeight) || 21;
      el.style.height = `${Math.min(el.scrollHeight, line * MAX_LINE_ROWS)}px`;
    });
  }
  /** ↑ goes back through what was sent, ↓ forward again, to an empty line. */
  recall(by) {
    const next = Math.max(-1, Math.min(this.uniqueHistory.length - 1, this.back + by));
    this.back = next;
    this.command = next < 0 ? "" : this.uniqueHistory[next];
    this.open = false;
  }
  // -- the side tiles -----------------------------------------------------------
  /** This person's chips on this printer (Settings › Console). */
  get quick() {
    const key = accountQuickKey(cloudState);
    return key ? quickCommandsFor(this.prefs, key) : [];
  }
  get quickSettingsTo() {
    return `${scopedPath("/settings", activeSlug())}#console`;
  }
  chipLabel = chipText;
  /** Why the chips are greyed out, said once under them. */
  get quickNote() {
    if (!this.quick.length) return "";
    if (!this.commandControlAvailable) return "You can't send commands to this printer, so the quick commands are off. Who may type is set in People and access.";
    return "";
  }
  get keysLine() {
    return [this.prefs.suggest ? "Tab completes" : "", "\u2191 history", this.prefs.enterSends ? "Enter sends \xB7 Shift Enter adds a line" : "Enter adds a line \xB7 Ctrl Enter sends"].filter(Boolean).join(" \xB7 ");
  }
  /** A chip set to "Put it in the input" fills the line to be edited; the rest send. */
  tapQuick(q) {
    if (q.send) {
      this.sendNow(q.command);
      return;
    }
    this.command = q.command;
    this.open = false;
    this.$nextTick(() => this.$refs.input?.focus());
  }
  get klippyTone() {
    if (!this.socketConnected) return this.socketConnecting ? "warn" : "off";
    if (!this.klippyConnected) return "off";
    return this.klippyReady ? "ok" : "warn";
  }
  get klippyLabel() {
    if (!this.socketConnected) return this.socketConnecting ? "Reconnecting\u2026" : "Offline";
    if (!this.klippyConnected) return "Klipper not connected";
    return this.klippyReady ? "Klipper ready" : "Klipper not ready";
  }
  get hotendReading() {
    return this.$store.state.printer.printer.extruder ?? {};
  }
  get bedReading() {
    return this.$store.state.printer.printer.heater_bed ?? {};
  }
  reading(h) {
    if (typeof h.temperature !== "number") return "\u2013";
    return `${h.temperature.toFixed(1)}\xB0 / ${Math.round(h.target ?? 0)}`;
  }
  /** Why a chip can't be tapped now, or '' when it can. FIRMWARE_RESTART follows the restart rule, since it is how a stopped Klipper is recovered. */
  chipRefusal(chip) {
    const word = firstWord(chip.command);
    const q = QUICK_RULES[word] ?? { moves: false, homed: false };
    if (!chip.send) return this.commandControlAvailable ? "" : "You can only send when you can control this printer";
    if (word === "FIRMWARE_RESTART") return this.restartRefusal ? "Not now. The printer must be connected, under your control, and idle." : "";
    if (!this.controlReady) return "You can only send when Klipper is ready and you can control this printer";
    if (q.moves && this.busy) return "Not while the printer is busy";
    if (q.homed && !this.isHomed("XYZ")) return "Home the printer first";
    return "";
  }
  chipOff(q) {
    return !!this.chipRefusal(q);
  }
  chipTitle(q) {
    return this.chipRefusal(q) || q.command;
  }
  /** A tap on a chip goes the way a typed line does: same checks, same restart confirm. */
  async sendNow(gcode) {
    if (!await this.sendTypedGcode(gcode)) return;
    this.$store.dispatch("console/onUpdateCommandHistory", [gcode, ...this.history].slice(0, this.prefs.historyCount));
    this.toLatest(true);
  }
  /** A macro with no values runs; one that needs values goes in the line to be filled in. */
  onMacro(macro) {
    if (!macro.params.length) {
      this.sendNow(macro.name);
      return;
    }
    this.command = `${macro.name} `;
    this.open = false;
    this.$nextTick(() => this.$refs.input?.focus());
  }
  async send() {
    const gcode = this.command.trim();
    if (!await this.sendTypedGcode(gcode)) return;
    this.$store.dispatch("console/onUpdateCommandHistory", [gcode, ...this.history].slice(0, this.prefs.historyCount));
    this.command = "";
    this.back = -1;
    this.open = false;
    this.toLatest(true);
  }
};
__decorateClass([
  Ref("scroller")
], Console.prototype, "scroller", 2);
__decorateClass([
  Watch("command")
], Console.prototype, "onCommandChange", 1);
__decorateClass([
  Watch("shown")
], Console.prototype, "onShown", 1);
Console = __decorateClass([
  Component({ components: { TonePill, ConsoleMacros } })
], Console);
const _sfc_main = Console;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "cons", class: { "cons--phone": _vm.isMobileViewport }, attrs: { "data-tid": "console-page" } }, [_c("section", { staticClass: "cons__output", attrs: { "data-tid": "console-output" } }, [_c("header", { staticClass: "cons__head" }, [_c("h2", [_c(__unplugin_components_0, { attrs: { "name": "console" } }), _vm._v(" Output")], 1), _c("span", { staticClass: "cons__head-r" }, [_c("tone-pill", { attrs: { "tone": _vm.klippyTone } }, [_vm._v(_vm._s(_vm.klippyLabel))])], 1)]), _c("div", { staticClass: "cons__bar" }, [_c("label", { staticClass: "cons__find" }, [_c(__unplugin_components_1, { attrs: { "name": "search", "small": "" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.find, expression: "find" }], attrs: { "type": "search", "placeholder": "Find in log", "aria-label": "Find in log", "data-tid": "console-find" }, domProps: { "value": _vm.find }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.find = $event.target.value;
  } } })], 1), _c("button", { staticClass: "cons__chip", class: { "cons__chip--on": _vm.hideTempWaits }, attrs: { "type": "button", "aria-pressed": _vm.hideTempWaits ? "true" : "false", "title": "Hide the temperature lines Klipper prints while it waits to heat" }, on: { "click": function($event) {
    _vm.hideTempWaits = !_vm.hideTempWaits;
  } } }, [_vm._v(" Hide heating lines ")]), !_vm.isMobileViewport ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "title": "Download Klipper's full log from the printer" }, on: { "click": _vm.downloadLog } }, [_c(__unplugin_components_2, { attrs: { "name": "download", "small": "" } }), _vm._v(" klippy.log ")], 1) : _vm._e()]), _c("div", { staticClass: "cons__log", class: [`cons__log--${_vm.prefs.textSize}`, { "cons__log--nowrap": !_vm.prefs.wrap }], attrs: { "data-tid": "console-log", "aria-live": "polite" } }, [_c("dynamic-scroller", { ref: "scroller", staticClass: "cons__scroller", attrs: { "items": _vm.shown, "min-item-size": 22, "key-field": "key", "buffer": 600 }, on: { "resize": function($event) {
    return _vm.toLatest();
  } }, scopedSlots: _vm._u([{ key: "default", fn: function({ item, index, active }) {
    return [_c("dynamic-scroller-item", { attrs: { "item": item, "active": active, "size-dependencies": [item.html, item.why], "data-index": index } }, [_c("div", { staticClass: "cons__line", class: [`cons__line--${item.kind}`, { "cons__line--notime": !_vm.prefs.timestamps }] }, [_vm.prefs.timestamps ? _c("time", [_vm._v(_vm._s(item.time))]) : _vm._e(), _c("span", { staticClass: "cons__msg", domProps: { "innerHTML": _vm._s(item.html) }, on: { "click": _vm.onLineClick } }), item.why ? _c("span", { staticClass: "cons__why" }, [_vm._v("What this means: " + _vm._s(item.why))]) : _vm._e()])])];
  } }]) }), !_vm.shown.length ? _c("p", { staticClass: "cons__empty" }, [_vm._v(" " + _vm._s(_vm.find ? `Nothing in the log matches "${_vm.find}".` : _vm.filter === "all" ? "Nothing yet." : `No ${_vm.filter} in the log.`) + " ")]) : _vm._e(), _vm.paused ? _c("button", { staticClass: "cons__latest", attrs: { "type": "button" }, on: { "click": function($event) {
    return _vm.toLatest(true);
  } } }, [_vm._v(" Latest "), _c(__unplugin_components_3, { attrs: { "name": _vm.flipped ? "chevronUp" : "chevronDown", "small": "" } })], 1) : _vm._e()], 1), _c("div", { staticClass: "cons__input" }, [_vm.quick.length ? _c("div", { staticClass: "cons__chips", attrs: { "role": "toolbar", "aria-label": "Quick commands", "data-tid": "console-quick" } }, [_vm._l(_vm.quick, function(q) {
    return _c("button", { key: q.id, staticClass: "cons__quick", attrs: { "type": "button", "disabled": _vm.chipOff(q), "title": _vm.chipTitle(q), "data-tid": `console-quick-${q.command}` }, on: { "click": function($event) {
      return _vm.tapQuick(q);
    } } }, [_vm._v(" " + _vm._s(_vm.chipLabel(q)) + " ")]);
  }), _c("router-link", { staticClass: "cons__quick cons__quick--edit", attrs: { "to": _vm.quickSettingsTo, "aria-label": "Edit the quick commands", "title": "Edit the quick commands" } }, [_c(__unplugin_components_4, { attrs: { "name": "settings", "small": "" } })], 1)], 2) : _vm._e(), _vm.quickNote ? _c("p", { staticClass: "cons__help", attrs: { "data-tid": "console-quick-note" } }, [_vm._v(" " + _vm._s(_vm.quickNote) + " ")]) : _vm._e(), _vm.commandRefusal ? _c("p", { staticClass: "cons__help", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.commandRefusal) + " ")]) : _vm._e(), _vm.help && !(_vm.open && _vm.list.length) ? _c("p", { staticClass: "cons__help" }, [_c("code", [_vm._v(_vm._s(_vm.typedCommand))]), _vm._v(" " + _vm._s(_vm.help) + " ")]) : _vm._e(), _c("div", { staticClass: "cons__field" }, [_vm.open && _vm.list.length ? _c("ul", { staticClass: "cons__suggest", attrs: { "role": "listbox", "aria-label": "Suggestions", "data-tid": "console-suggestions" } }, _vm._l(_vm.list, function(s, i) {
    return _c("li", { key: `${s.from}-${s.text}`, staticClass: "cons__option", class: { "cons__option--on": i === _vm.picked }, attrs: { "role": "option", "aria-selected": i === _vm.picked ? "true" : "false" }, on: { "mousedown": function($event) {
      $event.preventDefault();
      return _vm.take(s);
    } } }, [_c("code", [_vm._v(_vm._s(s.text))]), _c("span", [_vm._v(_vm._s(s.hint))])]);
  }), 0) : _vm._e(), _c("form", { staticClass: "cons__send", on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.send.apply(null, arguments);
  } } }, [_c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v("\u203A")]), _c("textarea", { directives: [{ name: "model", rawName: "v-model", value: _vm.command, expression: "command" }], ref: "input", staticClass: "cons__line", attrs: { "rows": "1", "spellcheck": "false", "autocomplete": "off", "disabled": !_vm.klippyConnected, "placeholder": "G-code, or a command name\u2026", "aria-label": "Send G-code", "data-tid": "console-input" }, domProps: { "value": _vm.command }, on: { "input": [function($event) {
    if ($event.target.composing) return;
    _vm.command = $event.target.value;
  }, function($event) {
    _vm.open = true;
    _vm.picked = -1;
  }], "keydown": _vm.onKey, "blur": function($event) {
    _vm.open = false;
  } } }), _vm._v(" "), !_vm.isMobileViewport ? _c("span", { staticClass: "cons__hint", attrs: { "aria-hidden": "true" } }, [_vm._v("\u2191 history")]) : _vm._e(), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "disabled": !_vm.klippyConnected || !_vm.command.trim() } }, [_vm._v(" Send ")])])]), _c("p", { staticClass: "cons__keys" }, [_vm._v(" " + _vm._s(_vm.keysLine) + " ")])])]), !_vm.isMobileViewport ? _c("div", { staticClass: "cons__side" }, [!_vm.isMobileViewport ? _c("console-macros", { attrs: { "locked": !_vm.controlReady, "busy": _vm.busy }, on: { "run": _vm.onMacro } }) : _vm._e(), !_vm.isMobileViewport ? _c("section", { staticClass: "cons__tile", attrs: { "data-tid": "console-now" } }, [_c("header", { staticClass: "cons__head" }, [_c("h2", [_c(__unplugin_components_5, { attrs: { "name": "thermometer" } }), _vm._v(" Now")], 1)]), _c("dl", { staticClass: "cons__now" }, [_c("dt", [_vm._v("Hotend")]), _c("dd", [_vm._v(_vm._s(_vm.reading(_vm.hotendReading)))]), _c("dt", [_vm._v("Bed")]), _c("dd", [_vm._v(_vm._s(_vm.reading(_vm.bedReading)))])])]) : _vm._e()], 1) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Console.vue?vue&type=style&index=0&scoped=9365bfd2&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9365bfd2",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Console.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQWtRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNBO0FBRUE7QUFrQkE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLFlBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsaUJBQ0E7QUFBQSxZQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxpQkFDQTtBQUFBLFlBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBcFNBO0FBQUEsRUFEQTtBQUFBLEdBREEsUUFFQTtBQVNBO0FBQUEsRUFEQTtBQUFBLEdBVkEsUUFXQTtBQXdFQTtBQUFBLEVBREE7QUFBQSxHQWxGQSxRQW1GQTtBQW5GQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb25zb2xlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cImNvbnNcIlxuICAgIDpjbGFzcz1cInsgJ2NvbnMtLXBob25lJzogaXNNb2JpbGVWaWV3cG9ydCB9XCJcbiAgICBkYXRhLXRpZD1cImNvbnNvbGUtcGFnZVwiXG4gID5cbiAgICA8c2VjdGlvblxuICAgICAgY2xhc3M9XCJjb25zX19vdXRwdXRcIlxuICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLW91dHB1dFwiXG4gICAgPlxuICAgICAgPGhlYWRlciBjbGFzcz1cImNvbnNfX2hlYWRcIj5cbiAgICAgICAgPGgyPjxmcmFtZS1pY29uIG5hbWU9XCJjb25zb2xlXCIgLz4gT3V0cHV0PC9oMj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjb25zX19oZWFkLXJcIj5cbiAgICAgICAgICA8dG9uZS1waWxsIDp0b25lPVwia2xpcHB5VG9uZVwiPnt7IGtsaXBweUxhYmVsIH19PC90b25lLXBpbGw+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvaGVhZGVyPlxuICAgICAgPGRpdiBjbGFzcz1cImNvbnNfX2JhclwiPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJjb25zX19maW5kXCI+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJzZWFyY2hcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgdi1tb2RlbD1cImZpbmRcIlxuICAgICAgICAgICAgdHlwZT1cInNlYXJjaFwiXG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkZpbmQgaW4gbG9nXCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJGaW5kIGluIGxvZ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImNvbnNvbGUtZmluZFwiXG4gICAgICAgICAgPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjb25zX19jaGlwXCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdjb25zX19jaGlwLS1vbic6IGhpZGVUZW1wV2FpdHMgfVwiXG4gICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImhpZGVUZW1wV2FpdHMgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICB0aXRsZT1cIkhpZGUgdGhlIHRlbXBlcmF0dXJlIGxpbmVzIEtsaXBwZXIgcHJpbnRzIHdoaWxlIGl0IHdhaXRzIHRvIGhlYXRcIlxuICAgICAgICAgIEBjbGljaz1cImhpZGVUZW1wV2FpdHMgPSAhaGlkZVRlbXBXYWl0c1wiXG4gICAgICAgID5cbiAgICAgICAgICBIaWRlIGhlYXRpbmcgbGluZXNcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWlmPVwiIWlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgdGl0bGU9XCJEb3dubG9hZCBLbGlwcGVyJ3MgZnVsbCBsb2cgZnJvbSB0aGUgcHJpbnRlclwiXG4gICAgICAgICAgQGNsaWNrPVwiZG93bmxvYWRMb2dcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJkb3dubG9hZFwiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgICAga2xpcHB5LmxvZ1xuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwiY29uc19fbG9nXCJcbiAgICAgICAgOmNsYXNzPVwiW2Bjb25zX19sb2ctLSR7cHJlZnMudGV4dFNpemV9YCwgeyAnY29uc19fbG9nLS1ub3dyYXAnOiAhcHJlZnMud3JhcCB9XVwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1sb2dcIlxuICAgICAgICBhcmlhLWxpdmU9XCJwb2xpdGVcIlxuICAgICAgPlxuICAgICAgICA8ZHluYW1pYy1zY3JvbGxlclxuICAgICAgICAgIHJlZj1cInNjcm9sbGVyXCJcbiAgICAgICAgICA6aXRlbXM9XCJzaG93blwiXG4gICAgICAgICAgOm1pbi1pdGVtLXNpemU9XCIyMlwiXG4gICAgICAgICAga2V5LWZpZWxkPVwia2V5XCJcbiAgICAgICAgICBjbGFzcz1cImNvbnNfX3Njcm9sbGVyXCJcbiAgICAgICAgICA6YnVmZmVyPVwiNjAwXCJcbiAgICAgICAgICBAcmVzaXplPVwidG9MYXRlc3QoKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8dGVtcGxhdGUgI2RlZmF1bHQ9XCJ7IGl0ZW0sIGluZGV4LCBhY3RpdmUgfVwiPlxuICAgICAgICAgICAgPGR5bmFtaWMtc2Nyb2xsZXItaXRlbVxuICAgICAgICAgICAgICA6aXRlbT1cIml0ZW1cIlxuICAgICAgICAgICAgICA6YWN0aXZlPVwiYWN0aXZlXCJcbiAgICAgICAgICAgICAgOnNpemUtZGVwZW5kZW5jaWVzPVwiW2l0ZW0uaHRtbCwgaXRlbS53aHldXCJcbiAgICAgICAgICAgICAgOmRhdGEtaW5kZXg9XCJpbmRleFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzcz1cImNvbnNfX2xpbmVcIlxuICAgICAgICAgICAgICAgIDpjbGFzcz1cIltgY29uc19fbGluZS0tJHtpdGVtLmtpbmR9YCwgeyAnY29uc19fbGluZS0tbm90aW1lJzogIXByZWZzLnRpbWVzdGFtcHMgfV1cIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHRpbWUgdi1pZj1cInByZWZzLnRpbWVzdGFtcHNcIj57eyBpdGVtLnRpbWUgfX08L3RpbWU+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY29uc19fbXNnXCJcbiAgICAgICAgICAgICAgICAgIEBjbGljaz1cIm9uTGluZUNsaWNrXCJcbiAgICAgICAgICAgICAgICAgIHYtaHRtbD1cIml0ZW0uaHRtbFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgdi1pZj1cIml0ZW0ud2h5XCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY29uc19fd2h5XCJcbiAgICAgICAgICAgICAgICA+V2hhdCB0aGlzIG1lYW5zOiB7eyBpdGVtLndoeSB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2R5bmFtaWMtc2Nyb2xsZXItaXRlbT5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8L2R5bmFtaWMtc2Nyb2xsZXI+XG4gICAgICAgIDxwXG4gICAgICAgICAgdi1pZj1cIiFzaG93bi5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwiY29uc19fZW1wdHlcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgZmluZCA/IGBOb3RoaW5nIGluIHRoZSBsb2cgbWF0Y2hlcyBcIiR7ZmluZH1cIi5gIDogZmlsdGVyID09PSAnYWxsJyA/ICdOb3RoaW5nIHlldC4nIDogYE5vICR7ZmlsdGVyfSBpbiB0aGUgbG9nLmAgfX1cbiAgICAgICAgPC9wPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1pZj1cInBhdXNlZFwiXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjb25zX19sYXRlc3RcIlxuICAgICAgICAgIEBjbGljaz1cInRvTGF0ZXN0KHRydWUpXCJcbiAgICAgICAgPlxuICAgICAgICAgIExhdGVzdFxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICA6bmFtZT1cImZsaXBwZWQgPyAnY2hldnJvblVwJyA6ICdjaGV2cm9uRG93bidcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY29uc19faW5wdXRcIj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJxdWljay5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwiY29uc19fY2hpcHNcIlxuICAgICAgICAgIHJvbGU9XCJ0b29sYmFyXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiUXVpY2sgY29tbWFuZHNcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1xdWlja1wiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cInEgaW4gcXVpY2tcIlxuICAgICAgICAgICAgOmtleT1cInEuaWRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNvbnNfX3F1aWNrXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImNoaXBPZmYocSlcIlxuICAgICAgICAgICAgOnRpdGxlPVwiY2hpcFRpdGxlKHEpXCJcbiAgICAgICAgICAgIDpkYXRhLXRpZD1cImBjb25zb2xlLXF1aWNrLSR7cS5jb21tYW5kfWBcIlxuICAgICAgICAgICAgQGNsaWNrPVwidGFwUXVpY2socSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGNoaXBMYWJlbChxKSB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgICAgOnRvPVwicXVpY2tTZXR0aW5nc1RvXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY29uc19fcXVpY2sgY29uc19fcXVpY2stLWVkaXRcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkVkaXQgdGhlIHF1aWNrIGNvbW1hbmRzXCJcbiAgICAgICAgICAgIHRpdGxlPVwiRWRpdCB0aGUgcXVpY2sgY29tbWFuZHNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJzZXR0aW5nc1wiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJxdWlja05vdGVcIlxuICAgICAgICAgIGNsYXNzPVwiY29uc19faGVscFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJjb25zb2xlLXF1aWNrLW5vdGVcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgcXVpY2tOb3RlIH19XG4gICAgICAgIDwvcD5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwiY29tbWFuZFJlZnVzYWxcIlxuICAgICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgICAgY2xhc3M9XCJjb25zX19oZWxwXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IGNvbW1hbmRSZWZ1c2FsIH19XG4gICAgICAgIDwvcD5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwiaGVscCAmJiAhKG9wZW4gJiYgbGlzdC5sZW5ndGgpXCJcbiAgICAgICAgICBjbGFzcz1cImNvbnNfX2hlbHBcIlxuICAgICAgICA+XG4gICAgICAgICAgPGNvZGU+e3sgdHlwZWRDb21tYW5kIH19PC9jb2RlPiB7eyBoZWxwIH19XG4gICAgICAgIDwvcD5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNvbnNfX2ZpZWxkXCI+XG4gICAgICAgICAgPHVsXG4gICAgICAgICAgICB2LWlmPVwib3BlbiAmJiBsaXN0Lmxlbmd0aFwiXG4gICAgICAgICAgICBjbGFzcz1cImNvbnNfX3N1Z2dlc3RcIlxuICAgICAgICAgICAgcm9sZT1cImxpc3Rib3hcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIlN1Z2dlc3Rpb25zXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1zdWdnZXN0aW9uc1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGxpXG4gICAgICAgICAgICAgIHYtZm9yPVwiKHMsIGkpIGluIGxpc3RcIlxuICAgICAgICAgICAgICA6a2V5PVwiYCR7cy5mcm9tfS0ke3MudGV4dH1gXCJcbiAgICAgICAgICAgICAgcm9sZT1cIm9wdGlvblwiXG4gICAgICAgICAgICAgIDphcmlhLXNlbGVjdGVkPVwiaSA9PT0gcGlja2VkID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY29uc19fb3B0aW9uXCJcbiAgICAgICAgICAgICAgOmNsYXNzPVwieyAnY29uc19fb3B0aW9uLS1vbic6IGkgPT09IHBpY2tlZCB9XCJcbiAgICAgICAgICAgICAgQG1vdXNlZG93bi5wcmV2ZW50PVwidGFrZShzKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxjb2RlPnt7IHMudGV4dCB9fTwvY29kZT5cbiAgICAgICAgICAgICAgPHNwYW4+e3sgcy5oaW50IH19PC9zcGFuPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDxmb3JtXG4gICAgICAgICAgICBjbGFzcz1cImNvbnNfX3NlbmRcIlxuICAgICAgICAgICAgQHN1Ym1pdC5wcmV2ZW50PVwic2VuZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gYXJpYS1oaWRkZW49XCJ0cnVlXCI+4oC6PC9zcGFuPlxuICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgIHJlZj1cImlucHV0XCJcbiAgICAgICAgICAgICAgdi1tb2RlbD1cImNvbW1hbmRcIlxuICAgICAgICAgICAgICByb3dzPVwiMVwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY29uc19fbGluZVwiXG4gICAgICAgICAgICAgIHNwZWxsY2hlY2s9XCJmYWxzZVwiXG4gICAgICAgICAgICAgIGF1dG9jb21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFrbGlwcHlDb25uZWN0ZWRcIlxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkctY29kZSwgb3IgYSBjb21tYW5kIG5hbWXigKZcIlxuICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiU2VuZCBHLWNvZGVcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImNvbnNvbGUtaW5wdXRcIlxuICAgICAgICAgICAgICBAaW5wdXQ9XCJvcGVuID0gdHJ1ZTsgcGlja2VkID0gLTFcIlxuICAgICAgICAgICAgICBAa2V5ZG93bj1cIm9uS2V5XCJcbiAgICAgICAgICAgICAgQGJsdXI9XCJvcGVuID0gZmFsc2VcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIHYtaWY9XCIhaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY29uc19faGludFwiXG4gICAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgICAgICA+4oaRIGhpc3Rvcnk8L3NwYW4+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFrbGlwcHlDb25uZWN0ZWQgfHwgIWNvbW1hbmQudHJpbSgpXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgU2VuZFxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHAgY2xhc3M9XCJjb25zX19rZXlzXCI+XG4gICAgICAgICAge3sga2V5c0xpbmUgfX1cbiAgICAgICAgPC9wPlxuICAgICAgPC9kaXY+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgIGNsYXNzPVwiY29uc19fc2lkZVwiXG4gICAgPlxuICAgICAgPGNvbnNvbGUtbWFjcm9zXG4gICAgICAgIHYtaWY9XCIhaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgIDpsb2NrZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgOmJ1c3k9XCJidXN5XCJcbiAgICAgICAgQHJ1bj1cIm9uTWFjcm9cIlxuICAgICAgLz5cbiAgICAgIDxzZWN0aW9uXG4gICAgICAgIHYtaWY9XCIhaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgIGNsYXNzPVwiY29uc19fdGlsZVwiXG4gICAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1ub3dcIlxuICAgICAgPlxuICAgICAgICA8aGVhZGVyIGNsYXNzPVwiY29uc19faGVhZFwiPlxuICAgICAgICAgIDxoMj48ZnJhbWUtaWNvbiBuYW1lPVwidGhlcm1vbWV0ZXJcIiAvPiBOb3c8L2gyPlxuICAgICAgICA8L2hlYWRlcj5cbiAgICAgICAgPGRsIGNsYXNzPVwiY29uc19fbm93XCI+XG4gICAgICAgICAgPGR0PkhvdGVuZDwvZHQ+XG4gICAgICAgICAgPGRkPnt7IHJlYWRpbmcoaG90ZW5kUmVhZGluZykgfX08L2RkPlxuICAgICAgICAgIDxkdD5CZWQ8L2R0PlxuICAgICAgICAgIDxkZD57eyByZWFkaW5nKGJlZFJlYWRpbmcpIH19PC9kZD5cbiAgICAgICAgPC9kbD5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFJlZiwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiBmcm9tICdAL21peGlucy9jb250cm9sJ1xuaW1wb3J0IEZpbGVzTWl4aW4gZnJvbSAnQC9taXhpbnMvZmlsZXMnXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgeyBHbG9iYWxzIH0gZnJvbSAnQC9nbG9iYWxzJ1xuaW1wb3J0IHR5cGUgeyBDb25zb2xlRW50cnksIEdjb2RlSGVscCB9IGZyb20gJ0Avc3RvcmUvY29uc29sZS90eXBlcydcbmltcG9ydCB7IGNvbW1hbmRIZWxwLCBlbnRyeUtpbmQsIGV4cGxhaW4sIGZpbHRlckVudHJpZXMsIHN1Z2dlc3Rpb25zLCB0eXBlIExvZ0ZpbHRlciwgdHlwZSBTdWdnZXN0aW9uIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb25zb2xlL21vZGVsJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9Ub25lUGlsbC52dWUnXG5pbXBvcnQgQ29uc29sZU1hY3JvcyBmcm9tICdAL2NvbXBvbmVudHMvY29uc29sZS9Db25zb2xlTWFjcm9zLnZ1ZSdcbmltcG9ydCB7IGNvbnNvbGVWaWV3IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb25zb2xlL3ZpZXcnXG5pbXBvcnQgeyBhcnJvd0lzSGlzdG9yeSwgZW50ZXJBY3Rpb24sIE1BWF9MSU5FX1JPV1MgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnNvbGUva2V5cydcbmltcG9ydCB0eXBlIHsgU2hvd25NYWNybyB9IGZyb20gJ0AvbWl4aW5zL21hY3JvcydcbmltcG9ydCB7IGNoaXBUZXh0LCBjb25zb2xlQ29uZmlnLCBxdWlja0NvbW1hbmRzRm9yLCBhY2NvdW50UXVpY2tLZXksIHR5cGUgQ29uc29sZUNvbmZpZywgdHlwZSBRdWlja0NvbW1hbmQgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnNvbGUvc2V0dGluZ3MnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IHNjb3BlZFBhdGggfSBmcm9tICdAL3JvdXRlci9wcmludGVyUGFnZVBhdGhzJ1xuXG4vKiogUXVpY2sgY29tbWFuZHMgdGhhdCBuZWVkIG1vcmUgdGhhbiBhIHJlYWR5IHByaW50ZXI6IGBtb3Zlc2Agb25lcyBhbiBpZGxlIG9uZTsgYGhvbWVkYCBvbmVzIGV2ZXJ5IGF4aXMgaG9tZWQgdG9vLiAqL1xuY29uc3QgUVVJQ0tfUlVMRVM6IFJlY29yZDxzdHJpbmcsIHsgbW92ZXM6IGJvb2xlYW4sIGhvbWVkOiBib29sZWFuIH0+ID0ge1xuICBHMjg6IHsgbW92ZXM6IHRydWUsIGhvbWVkOiBmYWxzZSB9LFxuICBCRURfTUVTSF9DQUxJQlJBVEU6IHsgbW92ZXM6IHRydWUsIGhvbWVkOiB0cnVlIH1cbn1cblxuY29uc3QgZmlyc3RXb3JkID0gKGNvbW1hbmQ6IHN0cmluZykgPT4gY29tbWFuZC50cmltKCkuc3BsaXQoL1xccy8pWzBdPy50b1VwcGVyQ2FzZSgpID8/ICcnXG5cbmludGVyZmFjZSBMaW5lIHtcbiAga2V5OiBzdHJpbmc7XG4gIGtpbmQ6IHN0cmluZztcbiAgdGltZTogc3RyaW5nO1xuICBodG1sOiBzdHJpbmc7XG4gIHdoeTogc3RyaW5nIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBDb25zb2xlIChUb29scyk6IHRoZSBwcmludGVyJ3MgbG9nLCBmaWx0ZXJlZCB0byBjb21tYW5kcywgd2FybmluZ3Mgb3JcbiAqIGVycm9ycyBhbmQgc2VhcmNoZWQsIHdpdGggYSBwbGFpbiBzZW50ZW5jZSB1bmRlciB0aGUgZXJyb3JzIHBlb3BsZVxuICogbWVldCBtb3N0OyBhIGxpbmUgdG8gc2VuZCBHLWNvZGUgdGhhdCBzdWdnZXN0cyB3aGF0IHlvdSd2ZSBzZW50IGJlZm9yZVxuICogYW5kIEtsaXBwZXIncyBjb21tYW5kcyB3aXRoIHRoZWlyIGhlbHAuIEEgY29tbWFuZCBpbiB0aGUgbG9nLCBjbGlja2VkLFxuICogZ29lcyBpbnRvIHRoZSBsaW5lLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUb25lUGlsbCwgQ29uc29sZU1hY3JvcyB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25zb2xlIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbiwgRmlsZXNNaXhpbiwgQnJvd3Nlck1peGluKSB7XG4gIEBSZWYoJ3Njcm9sbGVyJylcbiAgcmVhZG9ubHkgc2Nyb2xsZXIhOiB7ICRlbDogSFRNTEVsZW1lbnQsIHNjcm9sbFRvQm90dG9tOiAoKSA9PiB2b2lkIH1cblxuICBnZXQgZmlsdGVyICgpOiBMb2dGaWx0ZXIgeyByZXR1cm4gY29uc29sZVZpZXcuZmlsdGVyIH1cbiAgc2V0IGZpbHRlciAodmFsdWU6IExvZ0ZpbHRlcikgeyBjb25zb2xlVmlldy5maWx0ZXIgPSB2YWx1ZSB9XG5cbiAgZmluZCA9ICcnXG4gIGNvbW1hbmQgPSAnJ1xuXG4gIEBXYXRjaCgnY29tbWFuZCcpXG4gIG9uQ29tbWFuZENoYW5nZSAoKSB7IHRoaXMuZml0KCkgfVxuXG4gIG9wZW4gPSBmYWxzZVxuICBwaWNrZWQgPSAtMVxuICAvKiogV2hlcmUg4oaRIGhhcyBnb3QgdG8gaW4gdGhlIGhpc3Rvcnk7IC0xIGlzIHRoZSBsaW5lIGJlaW5nIHR5cGVkLiAqL1xuICBiYWNrID0gLTFcbiAgcGF1c2VkID0gZmFsc2VcblxuICBnZXQgZW50cmllcyAoKTogQ29uc29sZUVudHJ5W10ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uc29sZS9nZXRDb25zb2xlRW50cmllcyddIGFzIENvbnNvbGVFbnRyeVtdKSA/PyBbXVxuICB9XG5cbiAgZ2V0IGtub3duQ29tbWFuZHMgKCk6IEdjb2RlSGVscCB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25zb2xlL2dldEFsbEtub3duQ29tbWFuZHMnXSBhcyBHY29kZUhlbHApID8/IHt9XG4gIH1cblxuICAvKiogU2V0dGluZ3Mg4oC6IENvbnNvbGUuICovXG4gIGdldCBwcmVmcyAoKTogQ29uc29sZUNvbmZpZyB7XG4gICAgcmV0dXJuIGNvbnNvbGVDb25maWcodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuY29uc29sZSlcbiAgfVxuXG4gIC8qKiBOZXdlc3QgYXQgdGhlIHRvcCAoU2V0dGluZ3Mg4oC6IENvbnNvbGUg4oC6IE5ld2VzdCBhdCkuICovXG4gIGdldCBmbGlwcGVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsPy5mbGlwQ29uc29sZUxheW91dFxuICB9XG5cbiAgZ2V0IHNob3duICgpOiBMaW5lW10ge1xuICAgIGNvbnN0IGxpbmVzID0gZmlsdGVyRW50cmllcyh0aGlzLmVudHJpZXMuc2xpY2UoLXRoaXMucHJlZnMubGluZXNLZXB0KSwgdGhpcy5maWx0ZXIsIHRoaXMuZmluZCkubWFwKChlLCBpKSA9PiB7XG4gICAgICBjb25zdCBraW5kID0gZW50cnlLaW5kKGUpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGAke2UuaWQgPz8gJ24nfS0ke2UudGltZSA/PyAwfS0ke2l9YCxcbiAgICAgICAga2luZCxcbiAgICAgICAgdGltZTogZS50aW1lID8gdGhpcy4kZmlsdGVycy5mb3JtYXRUaW1lV2l0aFNlY29uZHMoZS50aW1lICogMTAwMCkgOiAnJyxcbiAgICAgICAgaHRtbDogdGhpcy5saW5rZWQoZSwga2luZCksXG4gICAgICAgIHdoeToga2luZCA9PT0gJ2Vycm9yJyB8fCBraW5kID09PSAnd2FybmluZycgPyBleHBsYWluKGUubWVzc2FnZSkgOiBudWxsXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gdGhpcy5mbGlwcGVkID8gbGluZXMucmV2ZXJzZSgpIDogbGluZXNcbiAgfVxuXG4gIC8qKiBDb21tYW5kcyBLbGlwcGVyIGtub3dzLCBpbiBhIHJlcGx5LCBiZWNvbWUgbGlua3MgdGhhdCBwdXQgdGhlbSBpbiB0aGUgbGluZSwgYXMgRmx1aWRkJ3MgY29uc29sZSBkb2VzLiAqL1xuICBsaW5rZWQgKGU6IENvbnNvbGVFbnRyeSwga2luZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoa2luZCA9PT0gJ2NvbW1hbmQnKSByZXR1cm4gYCR7R2xvYmFscy5DT05TT0xFX1NFTkRfUFJFRklYfTxhIGNsYXNzPVwiY29uc19fY21kXCI+JHtlLm1lc3NhZ2V9PC9hPmBcbiAgICByZXR1cm4gZS5tZXNzYWdlLnJlcGxhY2UoL1xcYihbQS1aXVtBLVowLTlfXXsyLH0pXFxiL2csIChtYXRjaCwgd29yZDogc3RyaW5nKSA9PiAod29yZCBpbiB0aGlzLmtub3duQ29tbWFuZHMgPyBgPGEgY2xhc3M9XCJjb25zX19jbWRcIj4ke3dvcmR9PC9hPmAgOiBtYXRjaCkpXG4gIH1cblxuICBvbkxpbmVDbGljayAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnRcbiAgICBpZiAodGFyZ2V0LnRhZ05hbWUgIT09ICdBJykgcmV0dXJuXG4gICAgdGhpcy5jb21tYW5kID0gKHRhcmdldC50ZXh0Q29udGVudCA/PyAnJykudHJpbSgpXG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgKHRoaXMuJHJlZnMuaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuZm9jdXMoKVxuICB9XG5cbiAgLy8gLS0gdGhlIGxvZydzIHNjcm9sbGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLiRlbC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKVxuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHRoaXMudG9MYXRlc3QodHJ1ZSkpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLiRlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKVxuICB9XG5cbiAgLyoqIFNjcm9sbGVkIHVwIHRvIHJlYWQsIHRoZSBsb2cgc3RheXMgcHV0OyBhdCB0aGUgYm90dG9tLCBpdCBmb2xsb3dzLiAqL1xuICBvblNjcm9sbCAoKSB7XG4gICAgY29uc3QgZWwgPSB0aGlzLnNjcm9sbGVyLiRlbFxuICAgIHRoaXMucGF1c2VkID0gdGhpcy5mbGlwcGVkID8gZWwuc2Nyb2xsVG9wID4gNCA6IGVsLnNjcm9sbEhlaWdodCAtIGVsLnNjcm9sbFRvcCAtIGVsLmNsaWVudEhlaWdodCA+IDRcbiAgfVxuXG4gIEBXYXRjaCgnc2hvd24nKVxuICBvblNob3duICgpIHtcbiAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB0aGlzLnRvTGF0ZXN0KCkpXG4gIH1cblxuICB0b0xhdGVzdCAoZm9yY2UgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLnBhdXNlZCAmJiAhZm9yY2UpIHJldHVyblxuICAgIGlmICh0aGlzLmZsaXBwZWQpIHtcbiAgICAgIGlmICh0aGlzLnNjcm9sbGVyKSB0aGlzLnNjcm9sbGVyLiRlbC5zY3JvbGxUb3AgPSAwXG4gICAgfSBlbHNlIHRoaXMuc2Nyb2xsZXI/LnNjcm9sbFRvQm90dG9tKClcbiAgICBpZiAoZm9yY2UpIHRoaXMucGF1c2VkID0gZmFsc2VcbiAgfVxuXG4gIC8vIC0tIHRoZSBiYXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0IGhpZGVUZW1wV2FpdHMgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuaGlkZVRlbXBXYWl0c1xuICB9XG5cbiAgc2V0IGhpZGVUZW1wV2FpdHMgKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywgeyBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLmhpZGVUZW1wV2FpdHMnLCB2YWx1ZSwgc2VydmVyOiB0cnVlIH0pXG4gIH1cblxuICBkb3dubG9hZExvZyAoKSB7XG4gICAgdGhpcy5kb3dubG9hZEZpbGUoJ2tsaXBweS5sb2cnLCAnbG9ncycpXG4gIH1cblxuICAvLyAtLSB0aGUgbGluZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogU2VudCBjb21tYW5kcywgbmV3ZXN0IGZpcnN0LCBhcyBGbHVpZGQga2VlcHMgdGhlbSAocmVwZWF0cyBpbmNsdWRlZCwgc28gdGhleSBjYW4gYmUgY291bnRlZCkuICovXG4gIGdldCBoaXN0b3J5ICgpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5zdGF0ZS5jb25zb2xlLmNvbW1hbmRIaXN0b3J5IGFzIHN0cmluZ1tdKSA/PyBbXVxuICB9XG5cbiAgZ2V0IHVuaXF1ZUhpc3RvcnkgKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gWy4uLm5ldyBTZXQodGhpcy5oaXN0b3J5KV1cbiAgfVxuXG4gIGdldCBsaXN0ICgpOiBTdWdnZXN0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLnByZWZzLnN1Z2dlc3QgPyBzdWdnZXN0aW9ucyh0aGlzLmNvbW1hbmQsIHRoaXMua25vd25Db21tYW5kcywgdGhpcy5oaXN0b3J5KSA6IFtdXG4gIH1cblxuICBnZXQgdHlwZWRDb21tYW5kICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNvbW1hbmQudHJpbSgpLnNwbGl0KC9cXHMvKVswXT8udG9VcHBlckNhc2UoKSA/PyAnJ1xuICB9XG5cbiAgZ2V0IGhlbHAgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBjb21tYW5kSGVscCh0aGlzLmNvbW1hbmQsIHRoaXMua25vd25Db21tYW5kcylcbiAgfVxuXG4gIHRha2UgKHM6IFN1Z2dlc3Rpb24pIHtcbiAgICB0aGlzLmNvbW1hbmQgPSBzLmZyb20gPT09ICdjb21tYW5kJyA/IGAke3MudGV4dH0gYCA6IHMudGV4dFxuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgdGhpcy5waWNrZWQgPSAtMVxuICB9XG5cbiAgb25LZXkgKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgY29uc3QgbGlzdGluZyA9IHRoaXMub3BlbiAmJiB0aGlzLmxpc3QubGVuZ3RoID4gMFxuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlICdUYWInOlxuICAgICAgICBpZiAoIWxpc3RpbmcpIHJldHVyblxuICAgICAgICB0aGlzLnRha2UodGhpcy5saXN0W01hdGgubWF4KDAsIHRoaXMucGlja2VkKV0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdBcnJvd0Rvd24nOlxuICAgICAgICBpZiAoIWxpc3RpbmcgJiYgIXRoaXMuY2FyZXRPbkVkZ2UoJ2Rvd24nKSkgcmV0dXJuXG4gICAgICAgIGlmIChsaXN0aW5nKSB0aGlzLnBpY2tlZCA9IE1hdGgubWluKHRoaXMubGlzdC5sZW5ndGggLSAxLCB0aGlzLnBpY2tlZCArIDEpXG4gICAgICAgIGVsc2UgdGhpcy5yZWNhbGwoLTEpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdBcnJvd1VwJzpcbiAgICAgICAgaWYgKCFsaXN0aW5nICYmICF0aGlzLmNhcmV0T25FZGdlKCd1cCcpKSByZXR1cm5cbiAgICAgICAgaWYgKGxpc3RpbmcgJiYgdGhpcy5waWNrZWQgPiAwKSB0aGlzLnBpY2tlZC0tXG4gICAgICAgIGVsc2UgaWYgKGxpc3RpbmcgJiYgdGhpcy5waWNrZWQgPT09IDApIHRoaXMucGlja2VkID0gLTFcbiAgICAgICAgZWxzZSB0aGlzLnJlY2FsbCgxKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnRW50ZXInOlxuICAgICAgICBpZiAobGlzdGluZyAmJiB0aGlzLnBpY2tlZCA+PSAwICYmICFldmVudC5zaGlmdEtleSkgdGhpcy50YWtlKHRoaXMubGlzdFt0aGlzLnBpY2tlZF0pXG4gICAgICAgIGVsc2UgaWYgKGVudGVyQWN0aW9uKGV2ZW50LCB0aGlzLnByZWZzLmVudGVyU2VuZHMpID09PSAnc2VuZCcpIHRoaXMuc2VuZCgpXG4gICAgICAgIGVsc2UgcmV0dXJuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdFc2NhcGUnOlxuICAgICAgICBpZiAoIWxpc3RpbmcpIHJldHVyblxuICAgICAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgfVxuXG4gIC8qKiDihpEgYW5kIOKGkyByZWNhbGwgaGlzdG9yeSBvbmx5IGZyb20gdGhlIGZpcnN0IG9yIGxhc3QgbGluZSBvZiB3aGF0IGlzIHR5cGVkLiAqL1xuICBjYXJldE9uRWRnZSAoZGlyZWN0aW9uOiAndXAnIHwgJ2Rvd24nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZWwgPSB0aGlzLiRyZWZzLmlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQgfCB1bmRlZmluZWRcbiAgICBpZiAoIWVsKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBhcnJvd0lzSGlzdG9yeShkaXJlY3Rpb24sIHRoaXMuY29tbWFuZCwgZWwuc2VsZWN0aW9uU3RhcnQsIGVsLnNlbGVjdGlvbkVuZClcbiAgfVxuXG4gIC8qKiBHcm93cyB0aGUgbGluZSB0byBmaXQgd2hhdCBpcyB0eXBlZCwgdXAgdG8gTUFYX0xJTkVfUk9XUywgdGhlbiBpdCBzY3JvbGxzLiAqL1xuICBmaXQgKCkge1xuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgIGNvbnN0IGVsID0gdGhpcy4kcmVmcy5pbnB1dCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgdW5kZWZpbmVkXG4gICAgICBpZiAoIWVsKSByZXR1cm5cbiAgICAgIGVsLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgY29uc3QgbGluZSA9IHBhcnNlRmxvYXQoZ2V0Q29tcHV0ZWRTdHlsZShlbCkubGluZUhlaWdodCkgfHwgMjFcbiAgICAgIGVsLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKGVsLnNjcm9sbEhlaWdodCwgbGluZSAqIE1BWF9MSU5FX1JPV1MpfXB4YFxuICAgIH0pXG4gIH1cblxuICAvKiog4oaRIGdvZXMgYmFjayB0aHJvdWdoIHdoYXQgd2FzIHNlbnQsIOKGkyBmb3J3YXJkIGFnYWluLCB0byBhbiBlbXB0eSBsaW5lLiAqL1xuICByZWNhbGwgKGJ5OiBudW1iZXIpIHtcbiAgICBjb25zdCBuZXh0ID0gTWF0aC5tYXgoLTEsIE1hdGgubWluKHRoaXMudW5pcXVlSGlzdG9yeS5sZW5ndGggLSAxLCB0aGlzLmJhY2sgKyBieSkpXG4gICAgdGhpcy5iYWNrID0gbmV4dFxuICAgIHRoaXMuY29tbWFuZCA9IG5leHQgPCAwID8gJycgOiB0aGlzLnVuaXF1ZUhpc3RvcnlbbmV4dF1cbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICB9XG5cbiAgLy8gLS0gdGhlIHNpZGUgdGlsZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogVGhpcyBwZXJzb24ncyBjaGlwcyBvbiB0aGlzIHByaW50ZXIgKFNldHRpbmdzIOKAuiBDb25zb2xlKS4gKi9cbiAgZ2V0IHF1aWNrICgpOiBRdWlja0NvbW1hbmRbXSB7XG4gICAgY29uc3Qga2V5ID0gYWNjb3VudFF1aWNrS2V5KGNsb3VkU3RhdGUpXG4gICAgcmV0dXJuIGtleSA/IHF1aWNrQ29tbWFuZHNGb3IodGhpcy5wcmVmcywga2V5KSA6IFtdXG4gIH1cblxuICBnZXQgcXVpY2tTZXR0aW5nc1RvICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpfSNjb25zb2xlYFxuICB9XG5cbiAgcmVhZG9ubHkgY2hpcExhYmVsID0gY2hpcFRleHRcblxuICAvKiogV2h5IHRoZSBjaGlwcyBhcmUgZ3JleWVkIG91dCwgc2FpZCBvbmNlIHVuZGVyIHRoZW0uICovXG4gIGdldCBxdWlja05vdGUgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnF1aWNrLmxlbmd0aCkgcmV0dXJuICcnXG4gICAgaWYgKCF0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlKSByZXR1cm4gXCJZb3UgY2FuJ3Qgc2VuZCBjb21tYW5kcyB0byB0aGlzIHByaW50ZXIsIHNvIHRoZSBxdWljayBjb21tYW5kcyBhcmUgb2ZmLiBXaG8gbWF5IHR5cGUgaXMgc2V0IGluIFBlb3BsZSBhbmQgYWNjZXNzLlwiXG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBnZXQga2V5c0xpbmUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFt0aGlzLnByZWZzLnN1Z2dlc3QgPyAnVGFiIGNvbXBsZXRlcycgOiAnJywgJ+KGkSBoaXN0b3J5JywgdGhpcy5wcmVmcy5lbnRlclNlbmRzID8gJ0VudGVyIHNlbmRzIMK3IFNoaWZ0IEVudGVyIGFkZHMgYSBsaW5lJyA6ICdFbnRlciBhZGRzIGEgbGluZSDCtyBDdHJsIEVudGVyIHNlbmRzJ10uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyDCtyAnKVxuICB9XG5cbiAgLyoqIEEgY2hpcCBzZXQgdG8gXCJQdXQgaXQgaW4gdGhlIGlucHV0XCIgZmlsbHMgdGhlIGxpbmUgdG8gYmUgZWRpdGVkOyB0aGUgcmVzdCBzZW5kLiAqL1xuICB0YXBRdWljayAocTogUXVpY2tDb21tYW5kKSB7XG4gICAgaWYgKHEuc2VuZCkgeyB0aGlzLnNlbmROb3cocS5jb21tYW5kKTsgcmV0dXJuIH1cbiAgICB0aGlzLmNvbW1hbmQgPSBxLmNvbW1hbmRcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+ICh0aGlzLiRyZWZzLmlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQgfCB1bmRlZmluZWQpPy5mb2N1cygpKVxuICB9XG5cbiAgZ2V0IGtsaXBweVRvbmUgKCk6ICdvaycgfCAnd2FybicgfCAnZXJyJyB8ICdvZmYnIHtcbiAgICBpZiAoIXRoaXMuc29ja2V0Q29ubmVjdGVkKSByZXR1cm4gdGhpcy5zb2NrZXRDb25uZWN0aW5nID8gJ3dhcm4nIDogJ29mZidcbiAgICBpZiAoIXRoaXMua2xpcHB5Q29ubmVjdGVkKSByZXR1cm4gJ29mZidcbiAgICByZXR1cm4gdGhpcy5rbGlwcHlSZWFkeSA/ICdvaycgOiAnd2FybidcbiAgfVxuXG4gIGdldCBrbGlwcHlMYWJlbCAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuc29ja2V0Q29ubmVjdGVkKSByZXR1cm4gdGhpcy5zb2NrZXRDb25uZWN0aW5nID8gJ1JlY29ubmVjdGluZ+KApicgOiAnT2ZmbGluZSdcbiAgICBpZiAoIXRoaXMua2xpcHB5Q29ubmVjdGVkKSByZXR1cm4gJ0tsaXBwZXIgbm90IGNvbm5lY3RlZCdcbiAgICByZXR1cm4gdGhpcy5rbGlwcHlSZWFkeSA/ICdLbGlwcGVyIHJlYWR5JyA6ICdLbGlwcGVyIG5vdCByZWFkeSdcbiAgfVxuXG4gIGdldCBob3RlbmRSZWFkaW5nICgpOiB7IHRlbXBlcmF0dXJlPzogbnVtYmVyLCB0YXJnZXQ/OiBudW1iZXIgfSB7IHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZXh0cnVkZXIgPz8ge30gfVxuICBnZXQgYmVkUmVhZGluZyAoKTogeyB0ZW1wZXJhdHVyZT86IG51bWJlciwgdGFyZ2V0PzogbnVtYmVyIH0geyByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmhlYXRlcl9iZWQgPz8ge30gfVxuXG4gIHJlYWRpbmcgKGg6IHsgdGVtcGVyYXR1cmU/OiBudW1iZXIsIHRhcmdldD86IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIGgudGVtcGVyYXR1cmUgIT09ICdudW1iZXInKSByZXR1cm4gJ+KAkydcbiAgICByZXR1cm4gYCR7aC50ZW1wZXJhdHVyZS50b0ZpeGVkKDEpfcKwIC8gJHtNYXRoLnJvdW5kKGgudGFyZ2V0ID8/IDApfWBcbiAgfVxuXG4gIC8qKiBXaHkgYSBjaGlwIGNhbid0IGJlIHRhcHBlZCBub3csIG9yICcnIHdoZW4gaXQgY2FuLiBGSVJNV0FSRV9SRVNUQVJUIGZvbGxvd3MgdGhlIHJlc3RhcnQgcnVsZSwgc2luY2UgaXQgaXMgaG93IGEgc3RvcHBlZCBLbGlwcGVyIGlzIHJlY292ZXJlZC4gKi9cbiAgY2hpcFJlZnVzYWwgKGNoaXA6IFF1aWNrQ29tbWFuZCk6IHN0cmluZyB7XG4gICAgY29uc3Qgd29yZCA9IGZpcnN0V29yZChjaGlwLmNvbW1hbmQpXG4gICAgY29uc3QgcSA9IFFVSUNLX1JVTEVTW3dvcmRdID8/IHsgbW92ZXM6IGZhbHNlLCBob21lZDogZmFsc2UgfVxuICAgIGlmICghY2hpcC5zZW5kKSByZXR1cm4gdGhpcy5jb21tYW5kQ29udHJvbEF2YWlsYWJsZSA/ICcnIDogJ1lvdSBjYW4gb25seSBzZW5kIHdoZW4geW91IGNhbiBjb250cm9sIHRoaXMgcHJpbnRlcidcbiAgICBpZiAod29yZCA9PT0gJ0ZJUk1XQVJFX1JFU1RBUlQnKSByZXR1cm4gdGhpcy5yZXN0YXJ0UmVmdXNhbCA/ICdOb3Qgbm93LiBUaGUgcHJpbnRlciBtdXN0IGJlIGNvbm5lY3RlZCwgdW5kZXIgeW91ciBjb250cm9sLCBhbmQgaWRsZS4nIDogJydcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm4gJ1lvdSBjYW4gb25seSBzZW5kIHdoZW4gS2xpcHBlciBpcyByZWFkeSBhbmQgeW91IGNhbiBjb250cm9sIHRoaXMgcHJpbnRlcidcbiAgICBpZiAocS5tb3ZlcyAmJiB0aGlzLmJ1c3kpIHJldHVybiAnTm90IHdoaWxlIHRoZSBwcmludGVyIGlzIGJ1c3knXG4gICAgaWYgKHEuaG9tZWQgJiYgIXRoaXMuaXNIb21lZCgnWFlaJykpIHJldHVybiAnSG9tZSB0aGUgcHJpbnRlciBmaXJzdCdcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGNoaXBPZmYgKHE6IFF1aWNrQ29tbWFuZCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuY2hpcFJlZnVzYWwocSlcbiAgfVxuXG4gIGNoaXBUaXRsZSAocTogUXVpY2tDb21tYW5kKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jaGlwUmVmdXNhbChxKSB8fCBxLmNvbW1hbmRcbiAgfVxuXG4gIC8qKiBBIHRhcCBvbiBhIGNoaXAgZ29lcyB0aGUgd2F5IGEgdHlwZWQgbGluZSBkb2VzOiBzYW1lIGNoZWNrcywgc2FtZSByZXN0YXJ0IGNvbmZpcm0uICovXG4gIGFzeW5jIHNlbmROb3cgKGdjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIWF3YWl0IHRoaXMuc2VuZFR5cGVkR2NvZGUoZ2NvZGUpKSByZXR1cm5cbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uc29sZS9vblVwZGF0ZUNvbW1hbmRIaXN0b3J5JywgW2djb2RlLCAuLi50aGlzLmhpc3RvcnldLnNsaWNlKDAsIHRoaXMucHJlZnMuaGlzdG9yeUNvdW50KSlcbiAgICB0aGlzLnRvTGF0ZXN0KHRydWUpXG4gIH1cblxuICAvKiogQSBtYWNybyB3aXRoIG5vIHZhbHVlcyBydW5zOyBvbmUgdGhhdCBuZWVkcyB2YWx1ZXMgZ29lcyBpbiB0aGUgbGluZSB0byBiZSBmaWxsZWQgaW4uICovXG4gIG9uTWFjcm8gKG1hY3JvOiBTaG93bk1hY3JvKSB7XG4gICAgaWYgKCFtYWNyby5wYXJhbXMubGVuZ3RoKSB7IHRoaXMuc2VuZE5vdyhtYWNyby5uYW1lKTsgcmV0dXJuIH1cbiAgICB0aGlzLmNvbW1hbmQgPSBgJHttYWNyby5uYW1lfSBgXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICB0aGlzLiRuZXh0VGljaygoKSA9PiAodGhpcy4kcmVmcy5pbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgdW5kZWZpbmVkKT8uZm9jdXMoKSlcbiAgfVxuXG4gIGFzeW5jIHNlbmQgKCkge1xuICAgIGNvbnN0IGdjb2RlID0gdGhpcy5jb21tYW5kLnRyaW0oKVxuICAgIGlmICghYXdhaXQgdGhpcy5zZW5kVHlwZWRHY29kZShnY29kZSkpIHJldHVyblxuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25zb2xlL29uVXBkYXRlQ29tbWFuZEhpc3RvcnknLCBbZ2NvZGUsIC4uLnRoaXMuaGlzdG9yeV0uc2xpY2UoMCwgdGhpcy5wcmVmcy5oaXN0b3J5Q291bnQpKVxuICAgIHRoaXMuY29tbWFuZCA9ICcnXG4gICAgdGhpcy5iYWNrID0gLTFcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIHRoaXMudG9MYXRlc3QodHJ1ZSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLy8gT3V0cHV0IGFuZCBpdHMgbGluZSB0byBzZW5kIGZyb20gYXJlIG9uZSB0aWxlOyBxdWljayBjb21tYW5kcywgbWFjcm9zIGFuZCB0aGUgcmVhZGluZ3Mgc2l0IGJlc2lkZSBpdC5cbiAgLmNvbnMge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMmZyKSBtaW5tYXgoMCwgMWZyKTtcbiAgICBnYXA6IDE2cHg7XG4gICAgYWxpZ24taXRlbXM6IHN0YXJ0O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5jb25zX19vdXRwdXQsXG4gIC5jb25zX190aWxlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICB9XG5cbiAgLmNvbnNfX291dHB1dCB7XG4gICAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjYwcHgpO1xuICAgIGhlaWdodDogY2FsYygxMDBzdmggLSAyNjBweCk7XG4gICAgbWluLWhlaWdodDogNDYwcHg7XG4gIH1cblxuICAuY29uc19fdGlsZSB7XG4gICAgcGFkZGluZzogMThweDtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAuY29uc19fc2lkZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTZweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuY29uc19faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEwcHg7XG5cbiAgICBoMiB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIGdhcDogMTBweDtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgfVxuICB9XG5cbiAgLmNvbnNfX291dHB1dCA+IC5jb25zX19oZWFkIHtcbiAgICBwYWRkaW5nOiAxNnB4IDE4cHggMDtcbiAgfVxuXG4gIC5jb25zX19iYXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICAgIHBhZGRpbmc6IDEwcHggMThweCAwO1xuICB9XG5cbiAgLmNvbnNfX2ZpbmQge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgZmxleDogMSAxIDE4MHB4O1xuICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICBpbnB1dCB7XG4gICAgICBmbGV4OiAxIDEgMDtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIGJvcmRlcjogMDtcbiAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250OiBpbmhlcml0O1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgIH1cbiAgfVxuXG4gIC5jb25zX19jaGlwIHtcbiAgICBoZWlnaHQ6IDMycHg7XG4gICAgcGFkZGluZzogMCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuY29uc19fY2hpcC0tb24ge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMTI4LCAyMTQsIDIwOSwgMC4xNCk7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHJnYmEoMTI4LCAyMTQsIDIwOSwgMC41KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuY29uc19fbG9nIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgZmxleDogMSAxIDA7XG4gICAgbWluLWhlaWdodDogMTYwcHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgfVxuXG4gIC5jb25zX19zY3JvbGxlciB7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIHBhZGRpbmc6IDhweCAxOHB4IDEycHg7XG4gIH1cblxuICAuY29uc19fbGluZSB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IGF1dG8gbWlubWF4KDAsIDFmcik7XG4gICAgY29sdW1uLWdhcDogMTRweDtcbiAgICBwYWRkaW5nOiAycHggMDtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubywgbW9ub3NwYWNlKTtcbiAgICBmb250LXNpemU6IDEyLjVweDtcbiAgICBsaW5lLWhlaWdodDogMS42O1xuXG4gICAgdGltZSB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgfVxuICB9XG5cbiAgLmNvbnNfX2xpbmUtLW5vdGltZSB7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMWZyKTtcblxuICAgIC5jb25zX193aHkgeyBncmlkLWNvbHVtbjogMTsgfVxuICB9XG5cbiAgLy8gU2V0dGluZ3Mg4oC6IENvbnNvbGUg4oC6IFRleHQgc2l6ZS5cbiAgLmNvbnNfX2xvZy0tbm93cmFwIC5jb25zX19tc2cge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5jb25zX19sb2ctLXNtIC5jb25zX19saW5lIHsgZm9udC1zaXplOiAxMXB4OyB9XG4gIC5jb25zX19sb2ctLWxnIC5jb25zX19saW5lIHsgZm9udC1zaXplOiAxNC41cHg7IH1cblxuICAuY29uc19fbXNnIHtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbiAgICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG5cbiAgICA6ZGVlcCguY29uc19fY21kKSB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgfVxuICB9XG5cbiAgLmNvbnNfX2xpbmUtLWNvbW1hbmQgLmNvbnNfX21zZyB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICB9XG5cbiAgLmNvbnNfX2xpbmUtLWVycm9yIC5jb25zX19tc2cge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTtcbiAgfVxuXG4gIC5jb25zX19saW5lLS13YXJuaW5nIC5jb25zX19tc2cge1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZywgI2ZmOWYwYSk7XG4gIH1cblxuICAuY29uc19fd2h5IHtcbiAgICBncmlkLWNvbHVtbjogMjtcbiAgICBtYXJnaW46IDRweCAwIDZweDtcbiAgICBwYWRkaW5nOiA4cHggMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LXNhbnMsIGluaGVyaXQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBsaW5lLWhlaWdodDogMS40NTtcbiAgfVxuXG4gIC5jb25zX19lbXB0eSB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHRvcDogMTZweDtcbiAgICBsZWZ0OiAxOHB4O1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5jb25zX19sYXRlc3Qge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICByaWdodDogMTZweDtcbiAgICBib3R0b206IDE0cHg7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDZweDtcbiAgICBoZWlnaHQ6IDM0cHg7XG4gICAgcGFkZGluZzogMCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGJveC1zaGFkb3c6IHZhcigtLW0zZC1zaGFkb3ctZmxvYXQsIDAgNHB4IDE2cHggcmdiKDAgMCAwIC8gNDAlKSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC8vIFRoZSBsaW5lIHRvIHNlbmQgZnJvbSBzdGF5cyBhdCB0aGUgZm9vdCBvZiB0aGUgdGlsZS5cbiAgLmNvbnNfX2lucHV0IHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogNnB4O1xuICAgIHBhZGRpbmc6IDEycHg7XG4gICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICB9XG5cbiAgLmNvbnNfX2ZpZWxkIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIH1cblxuICAuY29uc19fc3VnZ2VzdCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHJpZ2h0OiAwO1xuICAgIGJvdHRvbTogY2FsYygxMDAlICsgNnB4KTtcbiAgICBsZWZ0OiAwO1xuICAgIHotaW5kZXg6IDM7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGJveC1zaGFkb3c6IHZhcigtLW0zZC1zaGFkb3ctZmxvYXQsIDAgOHB4IDI0cHggcmdiKDAgMCAwIC8gNDUlKSk7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgfVxuXG4gIC5jb25zX19vcHRpb24ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lO1xuICAgIGdhcDogMTRweDtcbiAgICBwYWRkaW5nOiA3cHggMTBweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcblxuICAgIGNvZGUge1xuICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIH1cblxuICAgIHNwYW4ge1xuICAgICAgZmxleDogbm9uZTtcbiAgICAgIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICB9XG4gIH1cblxuICAuY29uc19fb3B0aW9uLS1vbiB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgxMjgsIDIxNCwgMjA5LCAwLjEyKTtcbiAgfVxuXG4gIC5jb25zX19oZWxwIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG5cbiAgICBjb2RlIHtcbiAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLmNvbnNfX3NlbmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gICAgcGFkZGluZzogNHB4IDRweCA0cHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vLCBtb25vc3BhY2UpO1xuXG4gICAgdGV4dGFyZWEge1xuICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICBtaW4td2lkdGg6IDA7XG4gICAgICBwYWRkaW5nOiA5cHggMDtcbiAgICAgIGJvcmRlcjogMDtcbiAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250OiBpbmhlcml0O1xuICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgbGluZS1oZWlnaHQ6IDEuNTtcbiAgICAgIHJlc2l6ZTogbm9uZTtcbiAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgfVxuXG4gICAgaW5wdXQge1xuICAgICAgZmxleDogMSAxIGF1dG87XG4gICAgICBtaW4td2lkdGg6IDA7XG4gICAgICBoZWlnaHQ6IDQwcHg7XG4gICAgICBib3JkZXI6IDA7XG4gICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udDogaW5oZXJpdDtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB9XG4gIH1cblxuICAuY29uc19faGludCB7XG4gICAgZmxleDogbm9uZTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAvLyBUaGUgcmluZyBnb2VzIHJvdW5kIHRoZSB3ZWxsLCBub3QgdGhlIHRleHQgYm94IGluIGl0LlxuICAuY29uc19fc2VuZCBpbnB1dDpmb2N1cy12aXNpYmxlLFxuICAuY29uc19fc2VuZCB0ZXh0YXJlYTpmb2N1cy12aXNpYmxlLFxuICAuY29uc19fZmluZCBpbnB1dDpmb2N1cy12aXNpYmxlIHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG5cbiAgLmNvbnNfX3NlbmQ6Zm9jdXMtd2l0aGluLFxuICAuY29uc19fZmluZDpmb2N1cy13aXRoaW4ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDJweCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5jb25zX19rZXlzIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLmNvbnNfX2NoaXBzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDhweDtcbiAgfVxuXG4gIC5jb25zX19xdWljayB7XG4gICAgcGFkZGluZzogN3B4IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vLCBtb25vc3BhY2UpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcblxuICAgICY6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ1OyB9XG4gIH1cblxuICAuY29uc19fcXVpY2stLWVkaXQge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIH1cblxuICAuY29uc19fbm90ZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmNvbnNfX25vdyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICBkZCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIEBtZWRpYSAobWF4LXdpZHRoOiAxMDIzcHgpIHtcbiAgICAuY29ucyB7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IG1pbm1heCgwLCAxZnIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEEgcGhvbmU6IHRoZSBvdXRwdXQgZmlyc3QsIHRoZSBxdWljayBjb21tYW5kcyB1bmRlciBpdCwgdGhlIGxpbmUgdG8gc2VuZCBhbHdheXMgaW4gdmlldy5cbiAgLmNvbnMtLXBob25lIHtcbiAgICAuY29uc19fb3V0cHV0IHtcbiAgICAgIGhlaWdodDogY2FsYygxMDBzdmggLSAzMzBweCk7XG4gICAgICBtaW4taGVpZ2h0OiAzODBweDtcbiAgICB9XG5cbiAgICAuY29uc19fc2Nyb2xsZXIge1xuICAgICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgfVxuXG4gICAgLmNvbnNfX2xvZy0tbWQgLmNvbnNfX2xpbmUge1xuICAgICAgZm9udC1zaXplOiAxMS41cHg7XG4gICAgfVxuXG4gICAgLmNvbnNfX2tleXMge1xuICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvdmlld3MvQ29uc29sZS52dWUifQ==