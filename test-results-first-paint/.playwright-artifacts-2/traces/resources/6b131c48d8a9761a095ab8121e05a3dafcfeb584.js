/* unplugin-vue-components disabled */import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VDialog as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import BrowserMixin from "/src/mixins/browser.ts";
import TypedCommandsMixin from "/src/mixins/typed-commands.ts";
import { EventBus } from "/src/eventBus.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { visibleMacros } from "/src/util/visible-macros.ts";
import { highlight, rankCommands } from "/src/services/command-bar/rank.ts";
import { ACCOUNT_KEY, ALL_PRINTERS_KEY, LIBRARY_KEY, visiblePages, visibleSections } from "/src/router/printerSections.ts";
import { accountSections } from "/src/services/account/model.ts";
import { activeSlug, foreignRecordForSlug, knownPrinters, printerHomePath, printerPath, samePageFor } from "/src/services/printer-pages/index.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { bluetoothCarrying } from "/src/services/muon-ble/link.ts";
import { savedName } from "/src/services/muon-cloud/directory.ts";
import { jobName } from "/src/services/printers-page/model.ts";
import { plateCheckNeeded } from "/src/services/jobs/plate.ts";
import { plateNoticeFor } from "/src/services/plate/ask.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import { presetCommands, presetSummary } from "/src/util/temperature-preset.ts";
const MAX_JOBS = 300;
let CommandBar = class extends Mixins(FrameMixin, BrowserMixin, TypedCommandsMixin) {
  open = false;
  query = "";
  selected = 0;
  created() {
    window.addEventListener("keydown", this.onKey, false);
    EventBus.bus.$on("command-bar", this.show);
  }
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKey);
    EventBus.bus.$off("command-bar", this.show);
  }
  /** Ctrl K or ⌘ K opens it from anywhere, even from a text box, unless shortcuts are off. */
  onKey(event) {
    if (!this.keysOn) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (this.open) this.open = false;
      else this.show();
    }
  }
  show() {
    this.commandRefusal = "";
    this.query = "";
    this.selected = 0;
    this.open = true;
    if (this.inPrinter && !this.$store.getters["files/getRootFiles"]("gcodes")) {
      SocketActions.serverFilesListRoot("gcodes");
    }
    this.$nextTick(() => setTimeout(() => this.$refs.input?.focus(), 50));
  }
  onQuery() {
    this.selected = 0;
  }
  get keysOn() {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts;
  }
  get inPrinter() {
    return !this.sectionContext.foreign && !!activeSlug() && this.socketConnected && this.authenticated;
  }
  /** Commands belong to the selected printer and to the account that selected it. */
  paletteTarget() {
    return JSON.stringify([
      this.$store.state.config.apiUrl,
      cloudState.activePrinterId ?? "",
      this.$route?.params?.printer ?? "",
      cloudState.account?.id ?? ""
    ]);
  }
  get printerName() {
    return this.inPrinter ? printerNameParts(this.$store.getters["config/getDisplayName"]).name : null;
  }
  get gcode() {
    const q = this.query.trimStart();
    return q.startsWith(">") ? q.slice(1).trim() : null;
  }
  get results() {
    if (this.gcode !== null) return this.gcodeCommands;
    return rankCommands(this.commands, this.query);
  }
  segmentsOf(command) {
    return highlight(command.label, this.gcode !== null ? "" : this.query);
  }
  move(by) {
    const n = this.results.length;
    if (!n) return;
    this.selected = (this.selected + by + n) % n;
    this.$nextTick(() => {
      const row = this.$refs.list?.querySelector(".command-bar__row--on");
      row?.scrollIntoView({ block: "nearest" });
    });
  }
  async runAt(i) {
    const command = this.results[i];
    if (!command) return;
    if (await command.run() !== false) this.open = false;
  }
  go(path) {
    if (this.$route.fullPath !== path) this.$router.push(path).catch(() => {
    });
  }
  // -- the commands ----------------------------------------------------------
  get gcodeCommands() {
    const gcode = this.gcode ?? "";
    if (!this.inPrinter || !this.commandControlAvailable) return [];
    if (!gcode) return [];
    return [{
      id: "send-gcode",
      group: "Do",
      label: `Send ${gcode}`,
      hint: this.printerName ?? void 0,
      icon: "console",
      verb: "Send",
      run: () => this.sendTypedGcode(gcode)
    }];
  }
  get commands() {
    return [...this.doCommands, ...this.jobCommands, ...this.macroCommands, ...this.goCommands, ...this.printerCommands];
  }
  get doCommands() {
    const list = [];
    const on = this.printerName ? ` on ${this.printerName}` : "";
    const target = this.paletteTarget();
    if (this.inPrinter && this.commandControlAvailable && this.klippyReady) {
      if (this.printerPrinting) {
        list.push({ id: "pause", group: "Do", label: "Pause the print", keys: ["Shift", "P"], icon: "jobs", suggested: true, run: () => this.runPaletteCommand(target, () => this.pausePrint(), () => this.printerPrinting) });
      }
      if (this.printerPaused) {
        list.push({ id: "resume", group: "Do", label: "Resume the print", keys: ["Shift", "P"], icon: "jobs", suggested: true, run: () => this.runPaletteCommand(target, () => this.resumePrint(), () => this.printerPaused) });
      }
      if (this.printerPrinting || this.printerPaused) {
        list.push({ id: "cancel", group: "Do", label: "Stop the print", words: "cancel abort", keys: ["Shift", "C"], icon: "x", run: () => this.cancelPalettePrint(target) });
      } else if (!this.printerBusy) {
        list.push({ id: "home", group: "Do", label: `Home all${on}`, words: "axes g28", keys: ["Shift", "H"], icon: "control", suggested: true, run: () => this.runPaletteCommand(target, () => this.homeAll(), () => !this.printerBusy) });
      }
      const presets = this.$store.getters["config/getTempPresets"] ?? [];
      presets.forEach((preset, i) => list.push({
        id: `preheat-${preset.id}`,
        group: "Do",
        label: `Preheat ${preset.name}${on}`,
        hint: presetSummary(preset) || void 0,
        words: "heat temperature warm material",
        icon: "control",
        suggested: i === 0 && !this.printerPrinting,
        run: () => presetCommands(preset).forEach((g) => this.runPaletteCommand(target, () => this.sendGcode(g)))
      }));
      list.push({
        id: "cool-down",
        group: "Do",
        label: `Cool down${on}`,
        words: "heaters off turn_off_heaters cold",
        icon: "control",
        run: () => this.coolDown(target)
      });
    }
    if (this.inPrinter && !this.restartRefusal) {
      list.push({ id: "restart-klipper", group: "Do", label: "Restart Klipper", words: "restart reload config", icon: "refresh", run: () => this.restartCommand(false) });
      list.push({ id: "firmware-restart", group: "Do", label: "Firmware restart", words: "firmware_restart mcu", icon: "refresh", run: () => this.restartCommand(true) });
    }
    if (this.inPrinter && this.commandControlAvailable) {
      list.push({ id: "estop", group: "Do", label: "Emergency stop", words: "estop e-stop halt", keys: ["Ctrl", "Shift", "E"], icon: "estop", run: () => this.paletteEmergencyStop(target) });
      if (!this.restartRefusal) {
        list.push({ id: "reboot", group: "Do", label: "Restart the printer's computer", words: "reboot host power", icon: "power", run: () => this.hostCommand("reboot", target) });
        list.push({ id: "shutdown", group: "Do", label: "Shut down the printer's computer", words: "shutdown host power off", icon: "power", run: () => this.hostCommand("shutdown", target) });
      }
    }
    list.push({ id: "keys", group: "Do", label: "Keyboard shortcuts", words: "keys cheat sheet help", keys: ["?"], icon: "keyboard", run: () => {
      EventBus.bus.$emit("keyboard-shortcuts");
    } });
    return list;
  }
  runPaletteCommand(target, send, available = () => true, klipperRequired = true) {
    this.commandRefusal = target !== this.paletteTarget() ? "Not sent. The selected printer changed. Try again." : !this.inPrinter || !this.commandControlAvailable ? "Not sent. Connect to a printer you can control first." : klipperRequired && (!this.klippyConnected || !this.klippyReady) ? "Not sent. Klipper is not ready." : !available() ? "Not sent. The printer state changed. Try again." : "";
    if (this.commandRefusal) return false;
    send();
    return true;
  }
  async cancelPalettePrint(target) {
    const ok = await this.$confirm(
      "The print stops and can't be picked up again. What has printed stays on the plate: take it off before the next print.",
      { title: "Cancel this print?", buttonTrueText: "Cancel the print", buttonFalseText: "Keep printing", danger: true }
    );
    if (!ok) return false;
    return this.runPaletteCommand(target, () => {
      SocketActions.printerPrintCancel();
      this.addConsoleEntry("CANCEL_PRINT");
    }, () => this.printerPrinting || this.printerPaused);
  }
  async coolDown(target) {
    if (this.printerPrinting && !await this.$confirm("The printer is printing. With the heaters off, the print will most likely fail.", { title: "Turn the heaters off?", buttonTrueText: "Turn them off", buttonFalseText: "Leave them on", danger: true })) return false;
    return this.runPaletteCommand(target, () => this.sendGcode("TURN_OFF_HEATERS"));
  }
  async paletteEmergencyStop(target) {
    const confirmOnEstop = this.$store.state.config.uiSettings.general.confirmOnEstop;
    if (confirmOnEstop && !await this.$confirm(
      "Everything stops at once: the print, the heaters and the motors. The printer then has to restart before it can do anything else.",
      { title: "Stop the printer now?", buttonTrueText: "Stop now", buttonFalseText: "Keep going", danger: true }
    )) return false;
    return this.runPaletteCommand(target, () => SocketActions.printerEmergencyStop(), () => true, false);
  }
  async restartCommand(firmware) {
    const target = this.paletteTarget();
    if (!await this.confirmCommandRestart()) return false;
    if (target !== this.paletteTarget()) {
      this.commandRefusal = "Not sent. The selected printer changed. Try again.";
      return false;
    }
    if (firmware) SocketActions.printerFirmwareRestart();
    else SocketActions.printerRestart();
    return true;
  }
  async hostCommand(what, target = this.paletteTarget()) {
    this.commandRefusal = this.restartRefusal;
    if (this.commandRefusal) return false;
    const reboot = what === "reboot";
    const ok = await this.$confirm(
      reboot ? "The printer is out of reach for a minute or two while it restarts." : "It stays off until it is switched off and on again at the printer.",
      {
        title: reboot ? "Restart the printer's computer?" : "Shut down the printer's computer?",
        buttonTrueText: reboot ? "Restart" : "Shut down",
        danger: true
      }
    );
    if (!ok) return false;
    this.commandRefusal = target !== this.paletteTarget() ? "Not sent. The selected printer changed. Try again." : this.restartRefusal;
    if (this.commandRefusal) return false;
    if (reboot) SocketActions.machineReboot();
    else SocketActions.machineShutdown();
    return true;
  }
  get jobCommands() {
    if (!this.inPrinter || !this.commandControlAvailable || !this.klippyReady || this.printerBusy) return [];
    const target = this.paletteTarget();
    const files = this.$store.getters["files/getRootFiles"]("gcodes") ?? [];
    return [...files].filter((f) => /\.(gcode|g|gco|bgcode)$/i.test(f.path) && !f.path.split("/").some((part) => part.startsWith("."))).sort((a, b) => b.modified - a.modified).slice(0, MAX_JOBS).map((f) => {
      const folder = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) : "";
      return {
        id: `job-${f.path}`,
        group: "Jobs",
        label: jobName(f.path) ?? f.path,
        hint: folder || void 0,
        words: "print",
        verb: "Print",
        icon: "jobs",
        run: () => this.printJob(f.path, target)
      };
    });
  }
  async printJob(path, target = this.paletteTarget()) {
    const name = jobName(path) ?? path;
    const printer = this.printerName ?? "The printer";
    const ok = await this.$confirm(`${printer} heats up, homes and starts printing.`, {
      title: `Print ${name} on ${this.printerName ?? "this printer"}?`,
      buttonTrueText: "Print now",
      plateCheck: plateCheckNeeded(this.$store.state.history?.jobs),
      plateNotice: plateNoticeFor(this.$store.state)
    });
    if (!ok) return;
    const idle = () => !this.printerBusy;
    if (!this.runPaletteCommand(target, () => {
    }, idle)) return false;
    const spoolman = this.$store.getters["spoolman/getAvailable"] && this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog;
    if (spoolman) {
      this.$store.commit("spoolman/setDialogState", { show: true, filename: path });
      return;
    }
    return this.runPaletteCommand(target, () => {
      SocketActions.printerPrintStart(path);
      this.go(printerHomePath());
    }, idle);
  }
  get macroCommands() {
    if (!this.inPrinter || !this.commandControlAvailable || !this.klippyReady) return [];
    const target = this.paletteTarget();
    const macros = visibleMacros(this.$store.getters["macros/getVisibleMacros"]);
    return macros.map((m) => ({
      id: `macro-${m.name}`,
      group: "Quick commands",
      label: m.name.toUpperCase(),
      hint: m.config?.description && m.config.description !== "G-Code macro" ? m.config.description : void 0,
      words: "macro run",
      verb: "Run",
      icon: "console",
      run: () => this.runPaletteCommand(target, () => this.sendGcode(m.name.toUpperCase()))
    }));
  }
  get goCommands() {
    const list = [{
      id: "go-printers",
      group: "Go to",
      label: "All printers",
      words: "home fleet printers",
      keys: ["G", ALL_PRINTERS_KEY.toUpperCase()],
      icon: "printers",
      suggested: !this.printerFrame,
      run: () => this.go("/")
    }, {
      id: "go-library",
      group: "Go to",
      label: "Library",
      words: "library saved prints projects",
      keys: ["G", LIBRARY_KEY.toUpperCase()],
      icon: "library",
      run: () => this.go("/library")
    }, ...this.accountCommands];
    if (!activeSlug() && !this.sectionContext.foreign) return list;
    for (const section of visibleSections(this.sectionContext)) {
      list.push({
        id: `go-${section.id}`,
        group: "Go to",
        label: section.label,
        words: [section.group === "tools" ? "tools" : "", ...section.pages.map((p) => p.label)].join(" "),
        keys: ["G", section.key.toUpperCase()],
        icon: section.icon,
        suggested: section.id === "jobs" || section.id === "overview",
        run: () => this.go(this.sectionTo(section))
      });
      for (const page of visiblePages(section, this.sectionContext).slice(1)) {
        list.push({
          id: `go-${section.id}-${page.path}`,
          group: "Go to",
          label: `${section.label} \u203A ${page.label}`,
          icon: section.icon,
          run: () => this.go(this.pageTo(page))
        });
      }
    }
    return list;
  }
  /** Your account and its sections (KAN-532): G A, then each by name. */
  get accountCommands() {
    if (!cloudState.account) return [];
    return accountSections().map((section) => section.id === "overview" ? {
      id: "go-account",
      group: "Go to",
      label: "Account",
      words: "account profile me sign out",
      keys: ["G", ACCOUNT_KEY.toUpperCase()],
      icon: "user",
      run: () => this.go("/account")
    } : {
      id: `go-account-${section.id}`,
      group: "Go to",
      label: `Account \u203A ${section.label}`,
      words: "account",
      icon: section.icon,
      run: () => this.go(`/account/${section.id}`)
    });
  }
  /** Each printer this browser knows, once; on a printer's page, the same page of the other. */
  get printerCommands() {
    const seen = /* @__PURE__ */ new Set();
    const current = this.sectionContext.foreign ? this.$route.params.printer : activeSlug();
    const list = [];
    for (const target of knownPrinters()) {
      if (seen.has(target.slug)) continue;
      seen.add(target.slug);
      const raw = target.kind === "local" ? savedName(target.instance) : target.kind === "cloud" ? cloudState.printers.find((p) => p.id === target.printerId)?.name ?? target.slug : foreignRecordForSlug(target.slug)?.name ?? target.slug;
      const parts = printerNameParts(raw);
      const here = target.slug === current;
      list.push({
        id: `printer-${target.slug}`,
        group: "Printers",
        label: parts.name,
        hint: [parts.suffix, here ? "open now" : target.kind === "cloud" ? bluetoothCarrying(target.printerId) ? "via Bluetooth" : "through Muon3D" : null].filter(Boolean).join(" \xB7 ") || void 0,
        words: `${target.slug} printer switch`,
        verb: "Open",
        icon: "printers",
        suggested: !here && list.length < 3,
        run: () => this.go(this.printerFrame ? samePageFor(this.$route, target.slug) : printerPath(target.slug))
      });
    }
    return list;
  }
};
__decorateClass([
  Watch("query")
], CommandBar.prototype, "onQuery", 1);
CommandBar = __decorateClass([
  Component({})
], CommandBar);
const _sfc_main = CommandBar;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "max-width": "660", "fullscreen": _vm.isMobileViewport, "content-class": "command-bar__dialog" }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    _vm.open = false;
  } }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c("div", { staticClass: "command-bar", attrs: { "data-tid": "command-bar" } }, [_c("div", { staticClass: "command-bar__field" }, [_c(__unplugin_components_1, { attrs: { "name": "search" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.query, expression: "query" }], ref: "input", attrs: { "type": "text", "placeholder": "Search or run a command", "aria-label": "Search or run a command", "autocomplete": "off", "spellcheck": "false" }, domProps: { "value": _vm.query }, on: { "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "down", 40, $event.key, ["Down", "ArrowDown"])) return null;
    $event.preventDefault();
    return _vm.move(1);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "up", 38, $event.key, ["Up", "ArrowUp"])) return null;
    $event.preventDefault();
    return _vm.move(-1);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    $event.preventDefault();
    return _vm.runAt(_vm.selected);
  }], "input": function($event) {
    if ($event.target.composing) return;
    _vm.query = $event.target.value;
  } } }), _vm.printerName ? _c("span", { staticClass: "command-bar__chip" }, [_vm._v(_vm._s(_vm.printerName))]) : _vm._e(), _c("button", { staticClass: "command-bar__close", attrs: { "type": "button", "aria-label": "Close" }, on: { "click": function($event) {
    _vm.open = false;
  } } }, [!_vm.isMobileViewport ? _c("kbd", [_vm._v("Esc")]) : _c(__unplugin_components_2, { attrs: { "name": "x" } })], 1)], 1), _vm.commandRefusal ? _c("p", { staticClass: "command-bar__empty", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.commandRefusal) + " ")]) : _vm._e(), _c("div", { ref: "list", staticClass: "command-bar__list", attrs: { "role": "listbox", "aria-label": "Commands" } }, [_vm._l(_vm.results, function(command, i) {
    return [i === 0 || _vm.results[i - 1].group !== command.group ? _c("div", { key: `${command.group}-head`, staticClass: "command-bar__group" }, [_vm._v(" " + _vm._s(command.group) + " ")]) : _vm._e(), _c("button", { key: command.id, staticClass: "command-bar__row", class: { "command-bar__row--on": i === _vm.selected }, attrs: { "type": "button", "role": "option", "aria-selected": i === _vm.selected ? "true" : "false", "data-tid": `command-${command.id}` }, on: { "mousemove": function($event) {
      _vm.selected = i;
    }, "click": function($event) {
      return _vm.runAt(i);
    } } }, [_c("span", { staticClass: "command-bar__icon" }, [_c(__unplugin_components_3, { attrs: { "name": command.icon || "chevronRight", "small": "" } })], 1), _c("span", { staticClass: "command-bar__label" }, [_vm._l(_vm.segmentsOf(command), function(segment, s) {
      return [segment.match ? _c("b", { key: s }, [_vm._v(_vm._s(segment.text))]) : [_vm._v(_vm._s(segment.text))]];
    }), command.hint ? _c("span", { staticClass: "command-bar__hint" }, [_vm._v(" \xB7 " + _vm._s(command.hint))]) : _vm._e()], 2), _c("span", { staticClass: "command-bar__right" }, [command.keys && _vm.keysOn && !_vm.isMobileViewport ? _vm._l(command.keys, function(key) {
      return _c("kbd", { key }, [_vm._v(_vm._s(key))]);
    }) : command.verb ? _c("span", { staticClass: "command-bar__verb" }, [_vm._v(_vm._s(command.verb))]) : _vm._e()], 2)])];
  }), !_vm.results.length ? _c("p", { staticClass: "command-bar__empty" }, [_vm._v(' Nothing matches "' + _vm._s(_vm.query) + '". ')]) : _vm._e()], 2), !_vm.isMobileViewport ? _c("div", { staticClass: "command-bar__foot" }, [_c("span", [_c("kbd", [_vm._v("\u2191")]), _c("kbd", [_vm._v("\u2193")]), _vm._v(" move")]), _c("span", [_c("kbd", [_vm._v("Enter")]), _vm._v(" run")]), _c("span", { staticClass: "command-bar__grow" }), _vm.inPrinter && _vm.commandControlAvailable ? _c("span", [_vm._v("Start with "), _c("kbd", [_vm._v(">")]), _vm._v(" to send G-code")]) : _vm._e()]) : _vm._e()])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/CommandBar.vue?vue&type=style&index=0&scoped=99ac5e6b&lang.scss";
import "/src/components/layout/CommandBar.vue?vue&type=style&index=1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "99ac5e6b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/CommandBar.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFtSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQVFBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUE7QUFBQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSw0REFDQSx1REFDQSxtREFDQSwwREFDQSxrRUFDQSxvQ0FDQSxlQUNBLG9EQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsUUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQ0Esa0hBQ0Esd0NBQ0EsbUJBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQSwwRUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBLElBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUNBLDZCQUNBLDBCQUNBLGtGQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTVXQTtBQUFBLEVBREE7QUFBQSxHQXJDQSxXQXNDQTtBQXRDQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb21tYW5kQmFyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWRpYWxvZ1xuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICBtYXgtd2lkdGg9XCI2NjBcIlxuICAgIDpmdWxsc2NyZWVuPVwiaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgY29udGVudC1jbGFzcz1cImNvbW1hbmQtYmFyX19kaWFsb2dcIlxuICAgIEBrZXlkb3duLmVzYz1cIm9wZW4gPSBmYWxzZVwiXG4gID5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cImNvbW1hbmQtYmFyXCJcbiAgICAgIGRhdGEtdGlkPVwiY29tbWFuZC1iYXJcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb21tYW5kLWJhcl9fZmllbGRcIj5cbiAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInNlYXJjaFwiIC8+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIHJlZj1cImlucHV0XCJcbiAgICAgICAgICB2LW1vZGVsPVwicXVlcnlcIlxuICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBvciBydW4gYSBjb21tYW5kXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiU2VhcmNoIG9yIHJ1biBhIGNvbW1hbmRcIlxuICAgICAgICAgIGF1dG9jb21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgc3BlbGxjaGVjaz1cImZhbHNlXCJcbiAgICAgICAgICBAa2V5ZG93bi5kb3duLnByZXZlbnQ9XCJtb3ZlKDEpXCJcbiAgICAgICAgICBAa2V5ZG93bi51cC5wcmV2ZW50PVwibW92ZSgtMSlcIlxuICAgICAgICAgIEBrZXlkb3duLmVudGVyLnByZXZlbnQ9XCJydW5BdChzZWxlY3RlZClcIlxuICAgICAgICA+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cInByaW50ZXJOYW1lXCJcbiAgICAgICAgICBjbGFzcz1cImNvbW1hbmQtYmFyX19jaGlwXCJcbiAgICAgICAgPnt7IHByaW50ZXJOYW1lIH19PC9zcGFuPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjb21tYW5kLWJhcl9fY2xvc2VcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJDbG9zZVwiXG4gICAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxrYmQgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCI+RXNjPC9rYmQ+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgbmFtZT1cInhcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJjb21tYW5kUmVmdXNhbFwiXG4gICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgIGNsYXNzPVwiY29tbWFuZC1iYXJfX2VtcHR5XCJcbiAgICAgID5cbiAgICAgICAge3sgY29tbWFuZFJlZnVzYWwgfX1cbiAgICAgIDwvcD5cbiAgICAgIDxkaXZcbiAgICAgICAgcmVmPVwibGlzdFwiXG4gICAgICAgIGNsYXNzPVwiY29tbWFuZC1iYXJfX2xpc3RcIlxuICAgICAgICByb2xlPVwibGlzdGJveFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJDb21tYW5kc1wiXG4gICAgICA+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWZvcj1cIihjb21tYW5kLCBpKSBpbiByZXN1bHRzXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1pZj1cImkgPT09IDAgfHwgcmVzdWx0c1tpIC0gMV0uZ3JvdXAgIT09IGNvbW1hbmQuZ3JvdXBcIlxuICAgICAgICAgICAgOmtleT1cImAke2NvbW1hbmQuZ3JvdXB9LWhlYWRgXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY29tbWFuZC1iYXJfX2dyb3VwXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyBjb21tYW5kLmdyb3VwIH19XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgOmtleT1cImNvbW1hbmQuaWRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICByb2xlPVwib3B0aW9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY29tbWFuZC1iYXJfX3Jvd1wiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdjb21tYW5kLWJhcl9fcm93LS1vbic6IGkgPT09IHNlbGVjdGVkIH1cIlxuICAgICAgICAgICAgOmFyaWEtc2VsZWN0ZWQ9XCJpID09PSBzZWxlY3RlZCA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYGNvbW1hbmQtJHtjb21tYW5kLmlkfWBcIlxuICAgICAgICAgICAgQG1vdXNlbW92ZT1cInNlbGVjdGVkID0gaVwiXG4gICAgICAgICAgICBAY2xpY2s9XCJydW5BdChpKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjb21tYW5kLWJhcl9faWNvblwiPlxuICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgIDpuYW1lPVwiY29tbWFuZC5pY29uIHx8ICdjaGV2cm9uUmlnaHQnXCJcbiAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjb21tYW5kLWJhcl9fbGFiZWxcIj5cbiAgICAgICAgICAgICAgPHRlbXBsYXRlIHYtZm9yPVwiKHNlZ21lbnQsIHMpIGluIHNlZ21lbnRzT2YoY29tbWFuZClcIj5cbiAgICAgICAgICAgICAgICA8YlxuICAgICAgICAgICAgICAgICAgdi1pZj1cInNlZ21lbnQubWF0Y2hcIlxuICAgICAgICAgICAgICAgICAgOmtleT1cInNcIlxuICAgICAgICAgICAgICAgID57eyBzZWdtZW50LnRleHQgfX08L2I+XG4gICAgICAgICAgICAgICAgPHRlbXBsYXRlIHYtZWxzZT57eyBzZWdtZW50LnRleHQgfX08L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIHYtaWY9XCJjb21tYW5kLmhpbnRcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwiY29tbWFuZC1iYXJfX2hpbnRcIlxuICAgICAgICAgICAgICA+IMK3IHt7IGNvbW1hbmQuaGludCB9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY29tbWFuZC1iYXJfX3JpZ2h0XCI+XG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiY29tbWFuZC5rZXlzICYmIGtleXNPbiAmJiAhaXNNb2JpbGVWaWV3cG9ydFwiPlxuICAgICAgICAgICAgICAgIDxrYmRcbiAgICAgICAgICAgICAgICAgIHYtZm9yPVwia2V5IGluIGNvbW1hbmQua2V5c1wiXG4gICAgICAgICAgICAgICAgICA6a2V5PVwia2V5XCJcbiAgICAgICAgICAgICAgICA+e3sga2V5IH19PC9rYmQ+XG4gICAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgdi1lbHNlLWlmPVwiY29tbWFuZC52ZXJiXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImNvbW1hbmQtYmFyX192ZXJiXCJcbiAgICAgICAgICAgICAgPnt7IGNvbW1hbmQudmVyYiB9fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwiIXJlc3VsdHMubGVuZ3RoXCJcbiAgICAgICAgICBjbGFzcz1cImNvbW1hbmQtYmFyX19lbXB0eVwiXG4gICAgICAgID5cbiAgICAgICAgICBOb3RoaW5nIG1hdGNoZXMgXCJ7eyBxdWVyeSB9fVwiLlxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwiIWlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICBjbGFzcz1cImNvbW1hbmQtYmFyX19mb290XCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4+PGtiZD7ihpE8L2tiZD48a2JkPuKGkzwva2JkPiBtb3ZlPC9zcGFuPlxuICAgICAgICA8c3Bhbj48a2JkPkVudGVyPC9rYmQ+IHJ1bjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjb21tYW5kLWJhcl9fZ3Jvd1wiIC8+XG4gICAgICAgIDxzcGFuIHYtaWY9XCJpblByaW50ZXIgJiYgY29tbWFuZENvbnRyb2xBdmFpbGFibGVcIj5TdGFydCB3aXRoIDxrYmQ+Jmd0Ozwva2JkPiB0byBzZW5kIEctY29kZTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L3YtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgRnJhbWVNaXhpbiBmcm9tICdAL21peGlucy9mcmFtZSdcbmltcG9ydCBCcm93c2VyTWl4aW4gZnJvbSAnQC9taXhpbnMvYnJvd3NlcidcbmltcG9ydCBUeXBlZENvbW1hbmRzTWl4aW4gZnJvbSAnQC9taXhpbnMvdHlwZWQtY29tbWFuZHMnXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgeyBTb2NrZXRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvc29ja2V0QWN0aW9ucydcbmltcG9ydCB0eXBlIHsgVGVtcGVyYXR1cmVQcmVzZXQgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7IHZpc2libGVNYWNyb3MsIHR5cGUgTWFjcm9Hcm91cCB9IGZyb20gJ0AvdXRpbC92aXNpYmxlLW1hY3JvcydcbmltcG9ydCB0eXBlIHsgTW9vbnJha2VyUm9vdEZpbGUgfSBmcm9tICdAL3N0b3JlL2ZpbGVzL3R5cGVzJ1xuaW1wb3J0IHsgaGlnaGxpZ2h0LCByYW5rQ29tbWFuZHMsIHR5cGUgQ29tbWFuZCwgdHlwZSBTZWdtZW50IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb21tYW5kLWJhci9yYW5rJ1xuaW1wb3J0IHsgQUNDT1VOVF9LRVksIEFMTF9QUklOVEVSU19LRVksIExJQlJBUllfS0VZLCB2aXNpYmxlUGFnZXMsIHZpc2libGVTZWN0aW9ucyB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJTZWN0aW9ucydcbmltcG9ydCB7IGFjY291bnRTZWN0aW9ucyB9IGZyb20gJ0Avc2VydmljZXMvYWNjb3VudC9tb2RlbCdcbmltcG9ydCB7IGFjdGl2ZVNsdWcsIGZvcmVpZ25SZWNvcmRGb3JTbHVnLCBrbm93blByaW50ZXJzLCBwcmludGVySG9tZVBhdGgsIHByaW50ZXJQYXRoLCBzYW1lUGFnZUZvciB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBibHVldG9vdGhDYXJyeWluZyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IHNhdmVkTmFtZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXJlY3RvcnknXG5pbXBvcnQgeyBqb2JOYW1lIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL21vZGVsJ1xuaW1wb3J0IHsgcGxhdGVDaGVja05lZWRlZCB9IGZyb20gJ0Avc2VydmljZXMvam9icy9wbGF0ZSdcbmltcG9ydCB7IHBsYXRlTm90aWNlRm9yIH0gZnJvbSAnQC9zZXJ2aWNlcy9wbGF0ZS9hc2snXG5pbXBvcnQgeyBwcmludGVyTmFtZVBhcnRzIH0gZnJvbSAnQC91dGlsL3ByaW50ZXItbmFtZSdcbmltcG9ydCB7IHByZXNldENvbW1hbmRzLCBwcmVzZXRTdW1tYXJ5IH0gZnJvbSAnQC91dGlsL3RlbXBlcmF0dXJlLXByZXNldCdcblxuLyoqIEVub3VnaCBHLWNvZGUgZmlsZXMgdG8gZmluZCBvbmUgYnkgbmFtZSwgd2l0aG91dCBsaXN0aW5nIGEgd2hvbGUgYXJjaGl2ZS4gKi9cbmNvbnN0IE1BWF9KT0JTID0gMzAwXG5cbi8qKlxuICogU2VhcmNoIG9yIHJ1biBhIGNvbW1hbmQgKEN0cmwgSyk6IHByaW50ZXJzLCBwYWdlcywgam9icywgbWFjcm9zIGFuZCB0aGVcbiAqIHByaW50ZXIncyBvd24gYWN0aW9ucywgaW4gb25lIGJveC4gQSBsaW5lIHN0YXJ0aW5nIHdpdGggPlxuICogaXMgc2VudCBhcyBHLWNvZGUuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21tYW5kQmFyIGV4dGVuZHMgTWl4aW5zKEZyYW1lTWl4aW4sIEJyb3dzZXJNaXhpbiwgVHlwZWRDb21tYW5kc01peGluKSB7XG4gIG9wZW4gPSBmYWxzZVxuICBxdWVyeSA9ICcnXG4gIHNlbGVjdGVkID0gMFxuXG4gIGNyZWF0ZWQgKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleSwgZmFsc2UpXG4gICAgRXZlbnRCdXMuYnVzLiRvbignY29tbWFuZC1iYXInLCB0aGlzLnNob3cpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXkpXG4gICAgRXZlbnRCdXMuYnVzLiRvZmYoJ2NvbW1hbmQtYmFyJywgdGhpcy5zaG93KVxuICB9XG5cbiAgLyoqIEN0cmwgSyBvciDijJggSyBvcGVucyBpdCBmcm9tIGFueXdoZXJlLCBldmVuIGZyb20gYSB0ZXh0IGJveCwgdW5sZXNzIHNob3J0Y3V0cyBhcmUgb2ZmLiAqL1xuICBvbktleSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoIXRoaXMua2V5c09uKSByZXR1cm5cbiAgICBpZiAoKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSkgJiYgIWV2ZW50LmFsdEtleSAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQua2V5LnRvTG93ZXJDYXNlKCkgPT09ICdrJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgaWYgKHRoaXMub3BlbikgdGhpcy5vcGVuID0gZmFsc2VcbiAgICAgIGVsc2UgdGhpcy5zaG93KClcbiAgICB9XG4gIH1cblxuICBzaG93ICgpIHtcbiAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gJydcbiAgICB0aGlzLnF1ZXJ5ID0gJydcbiAgICB0aGlzLnNlbGVjdGVkID0gMFxuICAgIHRoaXMub3BlbiA9IHRydWVcbiAgICAvLyBUaGUgam9iIGxpc3QgbG9hZHMgd2l0aCBKb2JzOyB0aGUgY29tbWFuZCBiYXIgYXNrcyBmb3IgaXQgd2hlbiBpdCBoYXNuJ3QuXG4gICAgaWYgKHRoaXMuaW5QcmludGVyICYmICF0aGlzLiRzdG9yZS5nZXR0ZXJzWydmaWxlcy9nZXRSb290RmlsZXMnXSgnZ2NvZGVzJykpIHtcbiAgICAgIFNvY2tldEFjdGlvbnMuc2VydmVyRmlsZXNMaXN0Um9vdCgnZ2NvZGVzJylcbiAgICB9XG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gc2V0VGltZW91dCgoKSA9PiAodGhpcy4kcmVmcy5pbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgdW5kZWZpbmVkKT8uZm9jdXMoKSwgNTApKVxuICB9XG5cbiAgQFdhdGNoKCdxdWVyeScpXG4gIG9uUXVlcnkgKCkge1xuICAgIHRoaXMuc2VsZWN0ZWQgPSAwXG4gIH1cblxuICBnZXQga2V5c09uICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVLZXlib2FyZFNob3J0Y3V0c1xuICB9XG5cbiAgZ2V0IGluUHJpbnRlciAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLnNlY3Rpb25Db250ZXh0LmZvcmVpZ24gJiYgISFhY3RpdmVTbHVnKCkgJiYgdGhpcy5zb2NrZXRDb25uZWN0ZWQgJiYgdGhpcy5hdXRoZW50aWNhdGVkXG4gIH1cblxuICAvKiogQ29tbWFuZHMgYmVsb25nIHRvIHRoZSBzZWxlY3RlZCBwcmludGVyIGFuZCB0byB0aGUgYWNjb3VudCB0aGF0IHNlbGVjdGVkIGl0LiAqL1xuICBwYWxldHRlVGFyZ2V0ICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShbXG4gICAgICB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsLFxuICAgICAgY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgPz8gJycsXG4gICAgICB0aGlzLiRyb3V0ZT8ucGFyYW1zPy5wcmludGVyID8/ICcnLFxuICAgICAgY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyAnJ1xuICAgIF0pXG4gIH1cblxuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmluUHJpbnRlciA/IHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKS5uYW1lIDogbnVsbFxuICB9XG5cbiAgZ2V0IGdjb2RlICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBxID0gdGhpcy5xdWVyeS50cmltU3RhcnQoKVxuICAgIHJldHVybiBxLnN0YXJ0c1dpdGgoJz4nKSA/IHEuc2xpY2UoMSkudHJpbSgpIDogbnVsbFxuICB9XG5cbiAgZ2V0IHJlc3VsdHMgKCk6IENvbW1hbmRbXSB7XG4gICAgaWYgKHRoaXMuZ2NvZGUgIT09IG51bGwpIHJldHVybiB0aGlzLmdjb2RlQ29tbWFuZHNcbiAgICByZXR1cm4gcmFua0NvbW1hbmRzKHRoaXMuY29tbWFuZHMsIHRoaXMucXVlcnkpXG4gIH1cblxuICBzZWdtZW50c09mIChjb21tYW5kOiBDb21tYW5kKTogU2VnbWVudFtdIHtcbiAgICByZXR1cm4gaGlnaGxpZ2h0KGNvbW1hbmQubGFiZWwsIHRoaXMuZ2NvZGUgIT09IG51bGwgPyAnJyA6IHRoaXMucXVlcnkpXG4gIH1cblxuICBtb3ZlIChieTogbnVtYmVyKSB7XG4gICAgY29uc3QgbiA9IHRoaXMucmVzdWx0cy5sZW5ndGhcbiAgICBpZiAoIW4pIHJldHVyblxuICAgIHRoaXMuc2VsZWN0ZWQgPSAodGhpcy5zZWxlY3RlZCArIGJ5ICsgbikgJSBuXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gKHRoaXMuJHJlZnMubGlzdCBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCk/LnF1ZXJ5U2VsZWN0b3IoJy5jb21tYW5kLWJhcl9fcm93LS1vbicpXG4gICAgICByb3c/LnNjcm9sbEludG9WaWV3KHsgYmxvY2s6ICduZWFyZXN0JyB9KVxuICAgIH0pXG4gIH1cblxuICBhc3luYyBydW5BdCAoaTogbnVtYmVyKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IHRoaXMucmVzdWx0c1tpXVxuICAgIGlmICghY29tbWFuZCkgcmV0dXJuXG4gICAgaWYgKGF3YWl0IGNvbW1hbmQucnVuKCkgIT09IGZhbHNlKSB0aGlzLm9wZW4gPSBmYWxzZVxuICB9XG5cbiAgZ28gKHBhdGg6IHN0cmluZykge1xuICAgIGlmICh0aGlzLiRyb3V0ZS5mdWxsUGF0aCAhPT0gcGF0aCkgdGhpcy4kcm91dGVyLnB1c2gocGF0aCkuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICAvLyAtLSB0aGUgY29tbWFuZHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBnY29kZUNvbW1hbmRzICgpOiBDb21tYW5kW10ge1xuICAgIGNvbnN0IGdjb2RlID0gdGhpcy5nY29kZSA/PyAnJ1xuICAgIGlmICghdGhpcy5pblByaW50ZXIgfHwgIXRoaXMuY29tbWFuZENvbnRyb2xBdmFpbGFibGUpIHJldHVybiBbXVxuICAgIGlmICghZ2NvZGUpIHJldHVybiBbXVxuICAgIHJldHVybiBbe1xuICAgICAgaWQ6ICdzZW5kLWdjb2RlJyxcbiAgICAgIGdyb3VwOiAnRG8nLFxuICAgICAgbGFiZWw6IGBTZW5kICR7Z2NvZGV9YCxcbiAgICAgIGhpbnQ6IHRoaXMucHJpbnRlck5hbWUgPz8gdW5kZWZpbmVkLFxuICAgICAgaWNvbjogJ2NvbnNvbGUnLFxuICAgICAgdmVyYjogJ1NlbmQnLFxuICAgICAgcnVuOiAoKSA9PiB0aGlzLnNlbmRUeXBlZEdjb2RlKGdjb2RlKVxuICAgIH1dXG4gIH1cblxuICBnZXQgY29tbWFuZHMgKCk6IENvbW1hbmRbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmRvQ29tbWFuZHMsIC4uLnRoaXMuam9iQ29tbWFuZHMsIC4uLnRoaXMubWFjcm9Db21tYW5kcywgLi4udGhpcy5nb0NvbW1hbmRzLCAuLi50aGlzLnByaW50ZXJDb21tYW5kc11cbiAgfVxuXG4gIGdldCBkb0NvbW1hbmRzICgpOiBDb21tYW5kW10ge1xuICAgIGNvbnN0IGxpc3Q6IENvbW1hbmRbXSA9IFtdXG4gICAgY29uc3Qgb24gPSB0aGlzLnByaW50ZXJOYW1lID8gYCBvbiAke3RoaXMucHJpbnRlck5hbWV9YCA6ICcnXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5wYWxldHRlVGFyZ2V0KClcbiAgICBpZiAodGhpcy5pblByaW50ZXIgJiYgdGhpcy5jb21tYW5kQ29udHJvbEF2YWlsYWJsZSAmJiB0aGlzLmtsaXBweVJlYWR5KSB7XG4gICAgICBpZiAodGhpcy5wcmludGVyUHJpbnRpbmcpIHtcbiAgICAgICAgbGlzdC5wdXNoKHsgaWQ6ICdwYXVzZScsIGdyb3VwOiAnRG8nLCBsYWJlbDogJ1BhdXNlIHRoZSBwcmludCcsIGtleXM6IFsnU2hpZnQnLCAnUCddLCBpY29uOiAnam9icycsIHN1Z2dlc3RlZDogdHJ1ZSwgcnVuOiAoKSA9PiB0aGlzLnJ1blBhbGV0dGVDb21tYW5kKHRhcmdldCwgKCkgPT4gdGhpcy5wYXVzZVByaW50KCksICgpID0+IHRoaXMucHJpbnRlclByaW50aW5nKSB9KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMucHJpbnRlclBhdXNlZCkge1xuICAgICAgICBsaXN0LnB1c2goeyBpZDogJ3Jlc3VtZScsIGdyb3VwOiAnRG8nLCBsYWJlbDogJ1Jlc3VtZSB0aGUgcHJpbnQnLCBrZXlzOiBbJ1NoaWZ0JywgJ1AnXSwgaWNvbjogJ2pvYnMnLCBzdWdnZXN0ZWQ6IHRydWUsIHJ1bjogKCkgPT4gdGhpcy5ydW5QYWxldHRlQ29tbWFuZCh0YXJnZXQsICgpID0+IHRoaXMucmVzdW1lUHJpbnQoKSwgKCkgPT4gdGhpcy5wcmludGVyUGF1c2VkKSB9KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMucHJpbnRlclByaW50aW5nIHx8IHRoaXMucHJpbnRlclBhdXNlZCkge1xuICAgICAgICBsaXN0LnB1c2goeyBpZDogJ2NhbmNlbCcsIGdyb3VwOiAnRG8nLCBsYWJlbDogJ1N0b3AgdGhlIHByaW50Jywgd29yZHM6ICdjYW5jZWwgYWJvcnQnLCBrZXlzOiBbJ1NoaWZ0JywgJ0MnXSwgaWNvbjogJ3gnLCBydW46ICgpID0+IHRoaXMuY2FuY2VsUGFsZXR0ZVByaW50KHRhcmdldCkgfSlcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMucHJpbnRlckJ1c3kpIHtcbiAgICAgICAgbGlzdC5wdXNoKHsgaWQ6ICdob21lJywgZ3JvdXA6ICdEbycsIGxhYmVsOiBgSG9tZSBhbGwke29ufWAsIHdvcmRzOiAnYXhlcyBnMjgnLCBrZXlzOiBbJ1NoaWZ0JywgJ0gnXSwgaWNvbjogJ2NvbnRyb2wnLCBzdWdnZXN0ZWQ6IHRydWUsIHJ1bjogKCkgPT4gdGhpcy5ydW5QYWxldHRlQ29tbWFuZCh0YXJnZXQsICgpID0+IHRoaXMuaG9tZUFsbCgpLCAoKSA9PiAhdGhpcy5wcmludGVyQnVzeSkgfSlcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByZXNldHMgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldFRlbXBQcmVzZXRzJ10gYXMgVGVtcGVyYXR1cmVQcmVzZXRbXSkgPz8gW11cbiAgICAgIHByZXNldHMuZm9yRWFjaCgocHJlc2V0LCBpKSA9PiBsaXN0LnB1c2goe1xuICAgICAgICBpZDogYHByZWhlYXQtJHtwcmVzZXQuaWR9YCxcbiAgICAgICAgZ3JvdXA6ICdEbycsXG4gICAgICAgIGxhYmVsOiBgUHJlaGVhdCAke3ByZXNldC5uYW1lfSR7b259YCxcbiAgICAgICAgaGludDogcHJlc2V0U3VtbWFyeShwcmVzZXQpIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgd29yZHM6ICdoZWF0IHRlbXBlcmF0dXJlIHdhcm0gbWF0ZXJpYWwnLFxuICAgICAgICBpY29uOiAnY29udHJvbCcsXG4gICAgICAgIHN1Z2dlc3RlZDogaSA9PT0gMCAmJiAhdGhpcy5wcmludGVyUHJpbnRpbmcsXG4gICAgICAgIHJ1bjogKCkgPT4gcHJlc2V0Q29tbWFuZHMocHJlc2V0KS5mb3JFYWNoKGcgPT4gdGhpcy5ydW5QYWxldHRlQ29tbWFuZCh0YXJnZXQsICgpID0+IHRoaXMuc2VuZEdjb2RlKGcpKSlcbiAgICAgIH0pKVxuICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgaWQ6ICdjb29sLWRvd24nLFxuICAgICAgICBncm91cDogJ0RvJyxcbiAgICAgICAgbGFiZWw6IGBDb29sIGRvd24ke29ufWAsXG4gICAgICAgIHdvcmRzOiAnaGVhdGVycyBvZmYgdHVybl9vZmZfaGVhdGVycyBjb2xkJyxcbiAgICAgICAgaWNvbjogJ2NvbnRyb2wnLFxuICAgICAgICBydW46ICgpID0+IHRoaXMuY29vbERvd24odGFyZ2V0KVxuICAgICAgfSlcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5QcmludGVyICYmICF0aGlzLnJlc3RhcnRSZWZ1c2FsKSB7XG4gICAgICBsaXN0LnB1c2goeyBpZDogJ3Jlc3RhcnQta2xpcHBlcicsIGdyb3VwOiAnRG8nLCBsYWJlbDogJ1Jlc3RhcnQgS2xpcHBlcicsIHdvcmRzOiAncmVzdGFydCByZWxvYWQgY29uZmlnJywgaWNvbjogJ3JlZnJlc2gnLCBydW46ICgpID0+IHRoaXMucmVzdGFydENvbW1hbmQoZmFsc2UpIH0pXG4gICAgICBsaXN0LnB1c2goeyBpZDogJ2Zpcm13YXJlLXJlc3RhcnQnLCBncm91cDogJ0RvJywgbGFiZWw6ICdGaXJtd2FyZSByZXN0YXJ0Jywgd29yZHM6ICdmaXJtd2FyZV9yZXN0YXJ0IG1jdScsIGljb246ICdyZWZyZXNoJywgcnVuOiAoKSA9PiB0aGlzLnJlc3RhcnRDb21tYW5kKHRydWUpIH0pXG4gICAgfVxuICAgIGlmICh0aGlzLmluUHJpbnRlciAmJiB0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlKSB7XG4gICAgICBsaXN0LnB1c2goeyBpZDogJ2VzdG9wJywgZ3JvdXA6ICdEbycsIGxhYmVsOiAnRW1lcmdlbmN5IHN0b3AnLCB3b3JkczogJ2VzdG9wIGUtc3RvcCBoYWx0Jywga2V5czogWydDdHJsJywgJ1NoaWZ0JywgJ0UnXSwgaWNvbjogJ2VzdG9wJywgcnVuOiAoKSA9PiB0aGlzLnBhbGV0dGVFbWVyZ2VuY3lTdG9wKHRhcmdldCkgfSlcbiAgICAgIGlmICghdGhpcy5yZXN0YXJ0UmVmdXNhbCkge1xuICAgICAgICBsaXN0LnB1c2goeyBpZDogJ3JlYm9vdCcsIGdyb3VwOiAnRG8nLCBsYWJlbDogXCJSZXN0YXJ0IHRoZSBwcmludGVyJ3MgY29tcHV0ZXJcIiwgd29yZHM6ICdyZWJvb3QgaG9zdCBwb3dlcicsIGljb246ICdwb3dlcicsIHJ1bjogKCkgPT4gdGhpcy5ob3N0Q29tbWFuZCgncmVib290JywgdGFyZ2V0KSB9KVxuICAgICAgICBsaXN0LnB1c2goeyBpZDogJ3NodXRkb3duJywgZ3JvdXA6ICdEbycsIGxhYmVsOiBcIlNodXQgZG93biB0aGUgcHJpbnRlcidzIGNvbXB1dGVyXCIsIHdvcmRzOiAnc2h1dGRvd24gaG9zdCBwb3dlciBvZmYnLCBpY29uOiAncG93ZXInLCBydW46ICgpID0+IHRoaXMuaG9zdENvbW1hbmQoJ3NodXRkb3duJywgdGFyZ2V0KSB9KVxuICAgICAgfVxuICAgIH1cbiAgICBsaXN0LnB1c2goeyBpZDogJ2tleXMnLCBncm91cDogJ0RvJywgbGFiZWw6ICdLZXlib2FyZCBzaG9ydGN1dHMnLCB3b3JkczogJ2tleXMgY2hlYXQgc2hlZXQgaGVscCcsIGtleXM6IFsnPyddLCBpY29uOiAna2V5Ym9hcmQnLCBydW46ICgpID0+IHsgRXZlbnRCdXMuYnVzLiRlbWl0KCdrZXlib2FyZC1zaG9ydGN1dHMnKSB9IH0pXG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuXG4gIHJ1blBhbGV0dGVDb21tYW5kICh0YXJnZXQ6IHN0cmluZywgc2VuZDogKCkgPT4gdm9pZCwgYXZhaWxhYmxlOiAoKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZSwga2xpcHBlclJlcXVpcmVkID0gdHJ1ZSk6IGJvb2xlYW4ge1xuICAgIHRoaXMuY29tbWFuZFJlZnVzYWwgPSB0YXJnZXQgIT09IHRoaXMucGFsZXR0ZVRhcmdldCgpXG4gICAgICA/ICdOb3Qgc2VudC4gVGhlIHNlbGVjdGVkIHByaW50ZXIgY2hhbmdlZC4gVHJ5IGFnYWluLidcbiAgICAgIDogIXRoaXMuaW5QcmludGVyIHx8ICF0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlXG4gICAgICAgICAgPyAnTm90IHNlbnQuIENvbm5lY3QgdG8gYSBwcmludGVyIHlvdSBjYW4gY29udHJvbCBmaXJzdC4nXG4gICAgICAgICAgOiBrbGlwcGVyUmVxdWlyZWQgJiYgKCF0aGlzLmtsaXBweUNvbm5lY3RlZCB8fCAhdGhpcy5rbGlwcHlSZWFkeSlcbiAgICAgICAgICAgID8gJ05vdCBzZW50LiBLbGlwcGVyIGlzIG5vdCByZWFkeS4nXG4gICAgICAgICAgICA6ICFhdmFpbGFibGUoKVxuICAgICAgICAgICAgICAgID8gJ05vdCBzZW50LiBUaGUgcHJpbnRlciBzdGF0ZSBjaGFuZ2VkLiBUcnkgYWdhaW4uJ1xuICAgICAgICAgICAgICAgIDogJydcbiAgICBpZiAodGhpcy5jb21tYW5kUmVmdXNhbCkgcmV0dXJuIGZhbHNlXG4gICAgc2VuZCgpXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGFzeW5jIGNhbmNlbFBhbGV0dGVQcmludCAodGFyZ2V0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICBcIlRoZSBwcmludCBzdG9wcyBhbmQgY2FuJ3QgYmUgcGlja2VkIHVwIGFnYWluLiBXaGF0IGhhcyBwcmludGVkIHN0YXlzIG9uIHRoZSBwbGF0ZTogdGFrZSBpdCBvZmYgYmVmb3JlIHRoZSBuZXh0IHByaW50LlwiLFxuICAgICAgeyB0aXRsZTogJ0NhbmNlbCB0aGlzIHByaW50PycsIGJ1dHRvblRydWVUZXh0OiAnQ2FuY2VsIHRoZSBwcmludCcsIGJ1dHRvbkZhbHNlVGV4dDogJ0tlZXAgcHJpbnRpbmcnLCBkYW5nZXI6IHRydWUgfVxuICAgIClcbiAgICBpZiAoIW9rKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdGhpcy5ydW5QYWxldHRlQ29tbWFuZCh0YXJnZXQsICgpID0+IHtcbiAgICAgIFNvY2tldEFjdGlvbnMucHJpbnRlclByaW50Q2FuY2VsKClcbiAgICAgIHRoaXMuYWRkQ29uc29sZUVudHJ5KCdDQU5DRUxfUFJJTlQnKVxuICAgIH0sICgpID0+IHRoaXMucHJpbnRlclByaW50aW5nIHx8IHRoaXMucHJpbnRlclBhdXNlZClcbiAgfVxuXG4gIGFzeW5jIGNvb2xEb3duICh0YXJnZXQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLnByaW50ZXJQcmludGluZyAmJiAhKGF3YWl0IHRoaXMuJGNvbmZpcm0oJ1RoZSBwcmludGVyIGlzIHByaW50aW5nLiBXaXRoIHRoZSBoZWF0ZXJzIG9mZiwgdGhlIHByaW50IHdpbGwgbW9zdCBsaWtlbHkgZmFpbC4nLCB7IHRpdGxlOiAnVHVybiB0aGUgaGVhdGVycyBvZmY/JywgYnV0dG9uVHJ1ZVRleHQ6ICdUdXJuIHRoZW0gb2ZmJywgYnV0dG9uRmFsc2VUZXh0OiAnTGVhdmUgdGhlbSBvbicsIGRhbmdlcjogdHJ1ZSB9KSkpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0aGlzLnJ1blBhbGV0dGVDb21tYW5kKHRhcmdldCwgKCkgPT4gdGhpcy5zZW5kR2NvZGUoJ1RVUk5fT0ZGX0hFQVRFUlMnKSlcbiAgfVxuXG4gIGFzeW5jIHBhbGV0dGVFbWVyZ2VuY3lTdG9wICh0YXJnZXQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGNvbmZpcm1PbkVzdG9wID0gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5jb25maXJtT25Fc3RvcFxuICAgIGlmIChjb25maXJtT25Fc3RvcCAmJiAhKGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICAnRXZlcnl0aGluZyBzdG9wcyBhdCBvbmNlOiB0aGUgcHJpbnQsIHRoZSBoZWF0ZXJzIGFuZCB0aGUgbW90b3JzLiBUaGUgcHJpbnRlciB0aGVuIGhhcyB0byByZXN0YXJ0IGJlZm9yZSBpdCBjYW4gZG8gYW55dGhpbmcgZWxzZS4nLFxuICAgICAgeyB0aXRsZTogJ1N0b3AgdGhlIHByaW50ZXIgbm93PycsIGJ1dHRvblRydWVUZXh0OiAnU3RvcCBub3cnLCBidXR0b25GYWxzZVRleHQ6ICdLZWVwIGdvaW5nJywgZGFuZ2VyOiB0cnVlIH1cbiAgICApKSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIHRoaXMucnVuUGFsZXR0ZUNvbW1hbmQodGFyZ2V0LCAoKSA9PiBTb2NrZXRBY3Rpb25zLnByaW50ZXJFbWVyZ2VuY3lTdG9wKCksICgpID0+IHRydWUsIGZhbHNlKVxuICB9XG5cbiAgYXN5bmMgcmVzdGFydENvbW1hbmQgKGZpcm13YXJlOiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5wYWxldHRlVGFyZ2V0KClcbiAgICBpZiAoIWF3YWl0IHRoaXMuY29uZmlybUNvbW1hbmRSZXN0YXJ0KCkpIHJldHVybiBmYWxzZVxuICAgIGlmICh0YXJnZXQgIT09IHRoaXMucGFsZXR0ZVRhcmdldCgpKSB7XG4gICAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gJ05vdCBzZW50LiBUaGUgc2VsZWN0ZWQgcHJpbnRlciBjaGFuZ2VkLiBUcnkgYWdhaW4uJ1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIC8vIFNlbmQgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpbmFsIGNoZWNrLiBNb29ucmFrZXIncyBsaWZlY3ljbGUgbm90aWZpY2F0aW9ucyByZXNldCB0aGUgVUkuXG4gICAgaWYgKGZpcm13YXJlKSBTb2NrZXRBY3Rpb25zLnByaW50ZXJGaXJtd2FyZVJlc3RhcnQoKVxuICAgIGVsc2UgU29ja2V0QWN0aW9ucy5wcmludGVyUmVzdGFydCgpXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGFzeW5jIGhvc3RDb21tYW5kICh3aGF0OiAncmVib290JyB8ICdzaHV0ZG93bicsIHRhcmdldCA9IHRoaXMucGFsZXR0ZVRhcmdldCgpKSB7XG4gICAgdGhpcy5jb21tYW5kUmVmdXNhbCA9IHRoaXMucmVzdGFydFJlZnVzYWxcbiAgICBpZiAodGhpcy5jb21tYW5kUmVmdXNhbCkgcmV0dXJuIGZhbHNlXG4gICAgY29uc3QgcmVib290ID0gd2hhdCA9PT0gJ3JlYm9vdCdcbiAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICByZWJvb3QgPyAnVGhlIHByaW50ZXIgaXMgb3V0IG9mIHJlYWNoIGZvciBhIG1pbnV0ZSBvciB0d28gd2hpbGUgaXQgcmVzdGFydHMuJyA6ICdJdCBzdGF5cyBvZmYgdW50aWwgaXQgaXMgc3dpdGNoZWQgb2ZmIGFuZCBvbiBhZ2FpbiBhdCB0aGUgcHJpbnRlci4nLFxuICAgICAge1xuICAgICAgICB0aXRsZTogcmVib290ID8gXCJSZXN0YXJ0IHRoZSBwcmludGVyJ3MgY29tcHV0ZXI/XCIgOiBcIlNodXQgZG93biB0aGUgcHJpbnRlcidzIGNvbXB1dGVyP1wiLFxuICAgICAgICBidXR0b25UcnVlVGV4dDogcmVib290ID8gJ1Jlc3RhcnQnIDogJ1NodXQgZG93bicsXG4gICAgICAgIGRhbmdlcjogdHJ1ZVxuICAgICAgfVxuICAgIClcbiAgICBpZiAoIW9rKSByZXR1cm4gZmFsc2VcbiAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gdGFyZ2V0ICE9PSB0aGlzLnBhbGV0dGVUYXJnZXQoKSA/ICdOb3Qgc2VudC4gVGhlIHNlbGVjdGVkIHByaW50ZXIgY2hhbmdlZC4gVHJ5IGFnYWluLicgOiB0aGlzLnJlc3RhcnRSZWZ1c2FsXG4gICAgaWYgKHRoaXMuY29tbWFuZFJlZnVzYWwpIHJldHVybiBmYWxzZVxuICAgIGlmIChyZWJvb3QpIFNvY2tldEFjdGlvbnMubWFjaGluZVJlYm9vdCgpXG4gICAgZWxzZSBTb2NrZXRBY3Rpb25zLm1hY2hpbmVTaHV0ZG93bigpXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGdldCBqb2JDb21tYW5kcyAoKTogQ29tbWFuZFtdIHtcbiAgICBpZiAoIXRoaXMuaW5QcmludGVyIHx8ICF0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlIHx8ICF0aGlzLmtsaXBweVJlYWR5IHx8IHRoaXMucHJpbnRlckJ1c3kpIHJldHVybiBbXVxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucGFsZXR0ZVRhcmdldCgpXG4gICAgY29uc3QgZmlsZXMgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1snZmlsZXMvZ2V0Um9vdEZpbGVzJ10oJ2djb2RlcycpIGFzIE1vb25yYWtlclJvb3RGaWxlW10gfCB1bmRlZmluZWQpID8/IFtdXG4gICAgcmV0dXJuIFsuLi5maWxlc11cbiAgICAgIC5maWx0ZXIoZiA9PiAvXFwuKGdjb2RlfGd8Z2NvfGJnY29kZSkkL2kudGVzdChmLnBhdGgpICYmICFmLnBhdGguc3BsaXQoJy8nKS5zb21lKHBhcnQgPT4gcGFydC5zdGFydHNXaXRoKCcuJykpKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGIubW9kaWZpZWQgLSBhLm1vZGlmaWVkKVxuICAgICAgLnNsaWNlKDAsIE1BWF9KT0JTKVxuICAgICAgLm1hcChmID0+IHtcbiAgICAgICAgY29uc3QgZm9sZGVyID0gZi5wYXRoLmluY2x1ZGVzKCcvJykgPyBmLnBhdGguc2xpY2UoMCwgZi5wYXRoLmxhc3RJbmRleE9mKCcvJykpIDogJydcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogYGpvYi0ke2YucGF0aH1gLFxuICAgICAgICAgIGdyb3VwOiAnSm9icycgYXMgY29uc3QsXG4gICAgICAgICAgbGFiZWw6IGpvYk5hbWUoZi5wYXRoKSA/PyBmLnBhdGgsXG4gICAgICAgICAgaGludDogZm9sZGVyIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICB3b3JkczogJ3ByaW50JyxcbiAgICAgICAgICB2ZXJiOiAnUHJpbnQnLFxuICAgICAgICAgIGljb246ICdqb2JzJyxcbiAgICAgICAgICBydW46ICgpID0+IHRoaXMucHJpbnRKb2IoZi5wYXRoLCB0YXJnZXQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gIH1cblxuICBhc3luYyBwcmludEpvYiAocGF0aDogc3RyaW5nLCB0YXJnZXQgPSB0aGlzLnBhbGV0dGVUYXJnZXQoKSkge1xuICAgIGNvbnN0IG5hbWUgPSBqb2JOYW1lKHBhdGgpID8/IHBhdGhcbiAgICBjb25zdCBwcmludGVyID0gdGhpcy5wcmludGVyTmFtZSA/PyAnVGhlIHByaW50ZXInXG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLiRjb25maXJtKGAke3ByaW50ZXJ9IGhlYXRzIHVwLCBob21lcyBhbmQgc3RhcnRzIHByaW50aW5nLmAsIHtcbiAgICAgIHRpdGxlOiBgUHJpbnQgJHtuYW1lfSBvbiAke3RoaXMucHJpbnRlck5hbWUgPz8gJ3RoaXMgcHJpbnRlcid9P2AsXG4gICAgICBidXR0b25UcnVlVGV4dDogJ1ByaW50IG5vdycsXG4gICAgICBwbGF0ZUNoZWNrOiBwbGF0ZUNoZWNrTmVlZGVkKHRoaXMuJHN0b3JlLnN0YXRlLmhpc3Rvcnk/LmpvYnMpLFxuICAgICAgcGxhdGVOb3RpY2U6IHBsYXRlTm90aWNlRm9yKHRoaXMuJHN0b3JlLnN0YXRlKVxuICAgIH0pXG4gICAgaWYgKCFvaykgcmV0dXJuXG4gICAgY29uc3QgaWRsZSA9ICgpID0+ICF0aGlzLnByaW50ZXJCdXN5XG4gICAgaWYgKCF0aGlzLnJ1blBhbGV0dGVDb21tYW5kKHRhcmdldCwgKCkgPT4ge30sIGlkbGUpKSByZXR1cm4gZmFsc2VcbiAgICBjb25zdCBzcG9vbG1hbiA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Nwb29sbWFuL2dldEF2YWlsYWJsZSddICYmIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLnNwb29sbWFuLmF1dG9TcG9vbFNlbGVjdGlvbkRpYWxvZ1xuICAgIGlmIChzcG9vbG1hbikge1xuICAgICAgdGhpcy4kc3RvcmUuY29tbWl0KCdzcG9vbG1hbi9zZXREaWFsb2dTdGF0ZScsIHsgc2hvdzogdHJ1ZSwgZmlsZW5hbWU6IHBhdGggfSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ydW5QYWxldHRlQ29tbWFuZCh0YXJnZXQsICgpID0+IHtcbiAgICAgIFNvY2tldEFjdGlvbnMucHJpbnRlclByaW50U3RhcnQocGF0aClcbiAgICAgIHRoaXMuZ28ocHJpbnRlckhvbWVQYXRoKCkpXG4gICAgfSwgaWRsZSlcbiAgfVxuXG4gIGdldCBtYWNyb0NvbW1hbmRzICgpOiBDb21tYW5kW10ge1xuICAgIGlmICghdGhpcy5pblByaW50ZXIgfHwgIXRoaXMuY29tbWFuZENvbnRyb2xBdmFpbGFibGUgfHwgIXRoaXMua2xpcHB5UmVhZHkpIHJldHVybiBbXVxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucGFsZXR0ZVRhcmdldCgpXG4gICAgY29uc3QgbWFjcm9zID0gdmlzaWJsZU1hY3Jvcyh0aGlzLiRzdG9yZS5nZXR0ZXJzWydtYWNyb3MvZ2V0VmlzaWJsZU1hY3JvcyddIGFzIE1hY3JvR3JvdXBbXSlcbiAgICByZXR1cm4gbWFjcm9zLm1hcChtID0+ICh7XG4gICAgICBpZDogYG1hY3JvLSR7bS5uYW1lfWAsXG4gICAgICBncm91cDogJ1F1aWNrIGNvbW1hbmRzJyBhcyBjb25zdCxcbiAgICAgIGxhYmVsOiBtLm5hbWUudG9VcHBlckNhc2UoKSxcbiAgICAgIGhpbnQ6IG0uY29uZmlnPy5kZXNjcmlwdGlvbiAmJiBtLmNvbmZpZy5kZXNjcmlwdGlvbiAhPT0gJ0ctQ29kZSBtYWNybycgPyBtLmNvbmZpZy5kZXNjcmlwdGlvbiA6IHVuZGVmaW5lZCxcbiAgICAgIHdvcmRzOiAnbWFjcm8gcnVuJyxcbiAgICAgIHZlcmI6ICdSdW4nLFxuICAgICAgaWNvbjogJ2NvbnNvbGUnLFxuICAgICAgcnVuOiAoKSA9PiB0aGlzLnJ1blBhbGV0dGVDb21tYW5kKHRhcmdldCwgKCkgPT4gdGhpcy5zZW5kR2NvZGUobS5uYW1lLnRvVXBwZXJDYXNlKCkpKVxuICAgIH0pKVxuICB9XG5cbiAgZ2V0IGdvQ29tbWFuZHMgKCk6IENvbW1hbmRbXSB7XG4gICAgY29uc3QgbGlzdDogQ29tbWFuZFtdID0gW3tcbiAgICAgIGlkOiAnZ28tcHJpbnRlcnMnLFxuICAgICAgZ3JvdXA6ICdHbyB0bycsXG4gICAgICBsYWJlbDogJ0FsbCBwcmludGVycycsXG4gICAgICB3b3JkczogJ2hvbWUgZmxlZXQgcHJpbnRlcnMnLFxuICAgICAga2V5czogWydHJywgQUxMX1BSSU5URVJTX0tFWS50b1VwcGVyQ2FzZSgpXSxcbiAgICAgIGljb246ICdwcmludGVycycsXG4gICAgICBzdWdnZXN0ZWQ6ICF0aGlzLnByaW50ZXJGcmFtZSxcbiAgICAgIHJ1bjogKCkgPT4gdGhpcy5nbygnLycpXG4gICAgfSwge1xuICAgICAgaWQ6ICdnby1saWJyYXJ5JyxcbiAgICAgIGdyb3VwOiAnR28gdG8nLFxuICAgICAgbGFiZWw6ICdMaWJyYXJ5JyxcbiAgICAgIHdvcmRzOiAnbGlicmFyeSBzYXZlZCBwcmludHMgcHJvamVjdHMnLFxuICAgICAga2V5czogWydHJywgTElCUkFSWV9LRVkudG9VcHBlckNhc2UoKV0sXG4gICAgICBpY29uOiAnbGlicmFyeScsXG4gICAgICBydW46ICgpID0+IHRoaXMuZ28oJy9saWJyYXJ5JylcbiAgICB9LCAuLi50aGlzLmFjY291bnRDb21tYW5kc11cbiAgICBpZiAoIWFjdGl2ZVNsdWcoKSAmJiAhdGhpcy5zZWN0aW9uQ29udGV4dC5mb3JlaWduKSByZXR1cm4gbGlzdFxuICAgIGZvciAoY29uc3Qgc2VjdGlvbiBvZiB2aXNpYmxlU2VjdGlvbnModGhpcy5zZWN0aW9uQ29udGV4dCkpIHtcbiAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgIGlkOiBgZ28tJHtzZWN0aW9uLmlkfWAsXG4gICAgICAgIGdyb3VwOiAnR28gdG8nLFxuICAgICAgICBsYWJlbDogc2VjdGlvbi5sYWJlbCxcbiAgICAgICAgd29yZHM6IFtzZWN0aW9uLmdyb3VwID09PSAndG9vbHMnID8gJ3Rvb2xzJyA6ICcnLCAuLi5zZWN0aW9uLnBhZ2VzLm1hcChwID0+IHAubGFiZWwpXS5qb2luKCcgJyksXG4gICAgICAgIGtleXM6IFsnRycsIHNlY3Rpb24ua2V5LnRvVXBwZXJDYXNlKCldLFxuICAgICAgICBpY29uOiBzZWN0aW9uLmljb24sXG4gICAgICAgIHN1Z2dlc3RlZDogc2VjdGlvbi5pZCA9PT0gJ2pvYnMnIHx8IHNlY3Rpb24uaWQgPT09ICdvdmVydmlldycsXG4gICAgICAgIHJ1bjogKCkgPT4gdGhpcy5nbyh0aGlzLnNlY3Rpb25UbyhzZWN0aW9uKSlcbiAgICAgIH0pXG4gICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgdmlzaWJsZVBhZ2VzKHNlY3Rpb24sIHRoaXMuc2VjdGlvbkNvbnRleHQpLnNsaWNlKDEpKSB7XG4gICAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgICAgaWQ6IGBnby0ke3NlY3Rpb24uaWR9LSR7cGFnZS5wYXRofWAsXG4gICAgICAgICAgZ3JvdXA6ICdHbyB0bycsXG4gICAgICAgICAgbGFiZWw6IGAke3NlY3Rpb24ubGFiZWx9IOKAuiAke3BhZ2UubGFiZWx9YCxcbiAgICAgICAgICBpY29uOiBzZWN0aW9uLmljb24sXG4gICAgICAgICAgcnVuOiAoKSA9PiB0aGlzLmdvKHRoaXMucGFnZVRvKHBhZ2UpKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGlzdFxuICB9XG5cbiAgLyoqIFlvdXIgYWNjb3VudCBhbmQgaXRzIHNlY3Rpb25zIChLQU4tNTMyKTogRyBBLCB0aGVuIGVhY2ggYnkgbmFtZS4gKi9cbiAgZ2V0IGFjY291bnRDb21tYW5kcyAoKTogQ29tbWFuZFtdIHtcbiAgICBpZiAoIWNsb3VkU3RhdGUuYWNjb3VudCkgcmV0dXJuIFtdXG4gICAgcmV0dXJuIGFjY291bnRTZWN0aW9ucygpLm1hcChzZWN0aW9uID0+IHNlY3Rpb24uaWQgPT09ICdvdmVydmlldydcbiAgICAgID8ge1xuICAgICAgICAgIGlkOiAnZ28tYWNjb3VudCcsXG4gICAgICAgICAgZ3JvdXA6ICdHbyB0bycgYXMgY29uc3QsXG4gICAgICAgICAgbGFiZWw6ICdBY2NvdW50JyxcbiAgICAgICAgICB3b3JkczogJ2FjY291bnQgcHJvZmlsZSBtZSBzaWduIG91dCcsXG4gICAgICAgICAga2V5czogWydHJywgQUNDT1VOVF9LRVkudG9VcHBlckNhc2UoKV0sXG4gICAgICAgICAgaWNvbjogJ3VzZXInLFxuICAgICAgICAgIHJ1bjogKCkgPT4gdGhpcy5nbygnL2FjY291bnQnKVxuICAgICAgICB9XG4gICAgICA6IHtcbiAgICAgICAgICBpZDogYGdvLWFjY291bnQtJHtzZWN0aW9uLmlkfWAsXG4gICAgICAgICAgZ3JvdXA6ICdHbyB0bycgYXMgY29uc3QsXG4gICAgICAgICAgbGFiZWw6IGBBY2NvdW50IOKAuiAke3NlY3Rpb24ubGFiZWx9YCxcbiAgICAgICAgICB3b3JkczogJ2FjY291bnQnLFxuICAgICAgICAgIGljb246IHNlY3Rpb24uaWNvbixcbiAgICAgICAgICBydW46ICgpID0+IHRoaXMuZ28oYC9hY2NvdW50LyR7c2VjdGlvbi5pZH1gKVxuICAgICAgICB9KVxuICB9XG5cbiAgLyoqIEVhY2ggcHJpbnRlciB0aGlzIGJyb3dzZXIga25vd3MsIG9uY2U7IG9uIGEgcHJpbnRlcidzIHBhZ2UsIHRoZSBzYW1lIHBhZ2Ugb2YgdGhlIG90aGVyLiAqL1xuICBnZXQgcHJpbnRlckNvbW1hbmRzICgpOiBDb21tYW5kW10ge1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnNlY3Rpb25Db250ZXh0LmZvcmVpZ24gPyB0aGlzLiRyb3V0ZS5wYXJhbXMucHJpbnRlciA6IGFjdGl2ZVNsdWcoKVxuICAgIGNvbnN0IGxpc3Q6IENvbW1hbmRbXSA9IFtdXG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2Yga25vd25QcmludGVycygpKSB7XG4gICAgICBpZiAoc2Vlbi5oYXModGFyZ2V0LnNsdWcpKSBjb250aW51ZVxuICAgICAgc2Vlbi5hZGQodGFyZ2V0LnNsdWcpXG4gICAgICBjb25zdCByYXcgPSB0YXJnZXQua2luZCA9PT0gJ2xvY2FsJ1xuICAgICAgICA/IHNhdmVkTmFtZSh0YXJnZXQuaW5zdGFuY2UpXG4gICAgICAgIDogdGFyZ2V0LmtpbmQgPT09ICdjbG91ZCdcbiAgICAgICAgICA/IGNsb3VkU3RhdGUucHJpbnRlcnMuZmluZChwID0+IHAuaWQgPT09IHRhcmdldC5wcmludGVySWQpPy5uYW1lID8/IHRhcmdldC5zbHVnXG4gICAgICAgICAgOiBmb3JlaWduUmVjb3JkRm9yU2x1Zyh0YXJnZXQuc2x1Zyk/Lm5hbWUgPz8gdGFyZ2V0LnNsdWdcbiAgICAgIGNvbnN0IHBhcnRzID0gcHJpbnRlck5hbWVQYXJ0cyhyYXcpXG4gICAgICBjb25zdCBoZXJlID0gdGFyZ2V0LnNsdWcgPT09IGN1cnJlbnRcbiAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgIGlkOiBgcHJpbnRlci0ke3RhcmdldC5zbHVnfWAsXG4gICAgICAgIGdyb3VwOiAnUHJpbnRlcnMnLFxuICAgICAgICBsYWJlbDogcGFydHMubmFtZSxcbiAgICAgICAgaGludDogW3BhcnRzLnN1ZmZpeCwgaGVyZSA/ICdvcGVuIG5vdycgOiB0YXJnZXQua2luZCA9PT0gJ2Nsb3VkJyA/IChibHVldG9vdGhDYXJyeWluZyh0YXJnZXQucHJpbnRlcklkKSA/ICd2aWEgQmx1ZXRvb3RoJyA6ICd0aHJvdWdoIE11b24zRCcpIDogbnVsbF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyDCtyAnKSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHdvcmRzOiBgJHt0YXJnZXQuc2x1Z30gcHJpbnRlciBzd2l0Y2hgLFxuICAgICAgICB2ZXJiOiAnT3BlbicsXG4gICAgICAgIGljb246ICdwcmludGVycycsXG4gICAgICAgIHN1Z2dlc3RlZDogIWhlcmUgJiYgbGlzdC5sZW5ndGggPCAzLFxuICAgICAgICBydW46ICgpID0+IHRoaXMuZ28odGhpcy5wcmludGVyRnJhbWUgPyBzYW1lUGFnZUZvcih0aGlzLiRyb3V0ZSwgdGFyZ2V0LnNsdWcpIDogcHJpbnRlclBhdGgodGFyZ2V0LnNsdWcpKVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGxpc3RcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmNvbW1hbmQtYmFyIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWF4LWhlaWdodDogbWluKDY0MHB4LCBjYWxjKDEwMHZoIC0gMTIwcHgpKTtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgYm94LXNoYWRvdzogdmFyKC0tbTNkLXNoYWRvdy1mbG9hdCksIGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgfVxuXG4gIDpkZWVwKC5jb21tYW5kLWJhcl9fZGlhbG9nLnYtZGlhbG9nLS1mdWxsc2NyZWVuKSAuY29tbWFuZC1iYXIge1xuICAgIG1heC1oZWlnaHQ6IDEwMHZoO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBib3JkZXItcmFkaXVzOiAwO1xuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19maWVsZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIHBhZGRpbmc6IDE4cHggMThweCAxNHB4IDIwcHg7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICBpbnB1dCB7XG4gICAgICBmbGV4OiAxIDEgMDtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIGJvcmRlcjogMDtcbiAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250OiBpbmhlcml0O1xuICAgICAgZm9udC1zaXplOiAyMHB4O1xuXG4gICAgICAvLyBUaGUgZmllbGQgaXMgdGhlIHdob2xlIGJhcjsgYSByaW5nIHJvdW5kIHRoZSB0ZXh0IGJveCBtYXJrcyBub3RoaW5nLlxuICAgICAgJjpmb2N1cy12aXNpYmxlIHtcbiAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAuY29tbWFuZC1iYXJfX2NoaXAge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgaGVpZ2h0OiAyOHB4O1xuICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNTAwO1xuICAgIGxpbmUtaGVpZ2h0OiAyOHB4O1xuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19jbG9zZSB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIG1pbi13aWR0aDogMzJweDtcbiAgICBoZWlnaHQ6IDMycHg7XG4gICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAuY29tbWFuZC1iYXJfX2xpc3Qge1xuICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIHBhZGRpbmc6IDhweCAxMHB4IDEwcHg7XG4gICAgb3ZlcmZsb3cteTogYXV0bztcbiAgfVxuXG4gIC5jb21tYW5kLWJhcl9fZ3JvdXAge1xuICAgIHBhZGRpbmc6IDEycHggMTJweCA2cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubyk7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMTJlbTtcbiAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19yb3cge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAzMnB4IG1pbm1heCgwLCAxZnIpIGF1dG87XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgbWluLWhlaWdodDogNDhweDtcbiAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19yb3ctLW9uIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5jb21tYW5kLWJhcl9faWNvbiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiAzMnB4O1xuICAgIGhlaWdodDogMzJweDtcbiAgICBib3JkZXItcmFkaXVzOiA5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC5jb21tYW5kLWJhcl9fcm93LS1vbiAuY29tbWFuZC1iYXJfX2ljb24ge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19sYWJlbCB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuXG4gICAgYiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgICBmb250LXdlaWdodDogNzAwO1xuICAgIH1cbiAgfVxuXG4gIC5jb21tYW5kLWJhcl9faGludCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuY29tbWFuZC1iYXJfX3JpZ2h0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA0cHg7XG5cbiAgICBrYmQge1xuICAgICAgbWluLXdpZHRoOiAyMnB4O1xuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIH1cbiAgfVxuXG4gIC5jb21tYW5kLWJhcl9fdmVyYiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19lbXB0eSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDI0cHggMTJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgfVxuXG4gIC5jb21tYW5kLWJhcl9fZm9vdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxNnB4O1xuICAgIHBhZGRpbmc6IDEycHggMjBweDtcbiAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG5cbiAgICBrYmQgKyBrYmQge1xuICAgICAgbWFyZ2luLWxlZnQ6IDJweDtcbiAgICB9XG5cbiAgICBrYmQge1xuICAgICAgbWFyZ2luLXJpZ2h0OiA0cHg7XG4gICAgfVxuICB9XG5cbiAgLmNvbW1hbmQtYmFyX19ncm93IHtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgfVxuPC9zdHlsZT5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC52LWRpYWxvZy5jb21tYW5kLWJhcl9fZGlhbG9nOm5vdCgudi1kaWFsb2ctLWZ1bGxzY3JlZW4pIHtcbiAgICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xuICAgIG1hcmdpbi10b3A6IDEydmg7XG4gICAgb3ZlcmZsb3c6IHZpc2libGU7XG4gICAgYm94LXNoYWRvdzogbm9uZTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9Db21tYW5kQmFyLnZ1ZSJ9