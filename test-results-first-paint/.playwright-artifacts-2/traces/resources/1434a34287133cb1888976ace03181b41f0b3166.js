/* unplugin-vue-components disabled */import { VDialog as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_6 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
import UsbJobPanel from "/src/components/usb/UsbJobPanel.vue";
import UsbPrinterPicker from "/src/components/usb/UsbPrinterPicker.vue";
import { failureOf, saveBlob, usbCancel, usbCopy, usbDownload, usbEject, usbList, usbPath, usbPrint } from "/src/services/usb/api.ts";
import { dismissJob, refreshUsb, refreshUsbJob, usb } from "/src/services/usb/state.ts";
import { bytesWords, isRunning, percentOf, reasonWords } from "/src/services/usb/words.ts";
const PAGE = 100;
const LARGE_DOWNLOAD = 100 * 1024 * 1024;
const CONFLICTS = [
  { value: "rename", title: "Keep both.", hint: "The new one gets a number added to its name." },
  { value: "skip", title: "Skip it.", hint: "Leave the file that is there." },
  { value: "replace", title: "Overwrite it.", hint: "The file that is there is replaced." }
];
let UsbBrowser = class extends Mixins(BrowserMixin) {
  controlReady;
  usb = usb;
  CONFLICTS = CONFLICTS;
  bytes = bytesWords;
  percent = percentOf;
  stickName = "";
  rel = "";
  entries = [];
  total = 0;
  loading = false;
  loadError = "";
  selected = [];
  notice = "";
  noticeBad = false;
  cancelling = false;
  ejecting = false;
  picker = false;
  conflict = "rename";
  copyAsk = null;
  printAsk = null;
  downloading = null;
  downloadAbort = null;
  /** Which read the list is waiting for, so a slow answer for a folder already left is dropped. */
  ticket = 0;
  get sticks() {
    return usb.status?.sticks ?? [];
  }
  get stick() {
    return this.sticks.find((s) => s.name === this.stickName) ?? this.sticks[0] ?? null;
  }
  get rejected() {
    const r = usb.status?.rejected[0];
    return r ? r.fstype || r.label || r.name : "";
  }
  get justEjected() {
    return usb.status?.ejected[0] ?? null;
  }
  get space() {
    const s = this.stick;
    if (!s || s.freeBytes === null) return "";
    return s.totalBytes ? `${bytesWords(s.freeBytes)} free of ${bytesWords(s.totalBytes)}` : `${bytesWords(s.freeBytes)} free`;
  }
  get crumbs() {
    const parts = this.rel ? this.rel.split("/") : [];
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join("/") }));
  }
  get shownJob() {
    const job = usb.job;
    if (!job || job.id === usb.dismissed) return null;
    return job;
  }
  get running() {
    return isRunning(usb.job);
  }
  get allSelected() {
    return !!this.entries.length && this.entries.every((e) => this.selected.includes(e.rel));
  }
  get downloadable() {
    return this.entries.filter((e) => !e.isDir && this.selected.includes(e.rel));
  }
  /** Print takes exactly one file. */
  get printable() {
    const picked = this.entries.filter((e) => this.selected.includes(e.rel));
    return picked.length === 1 && !picked[0].isDir ? picked[0] : null;
  }
  mounted() {
    this.stickName = this.sticks[0]?.name ?? "";
    if (this.stickName) this.load(true);
  }
  beforeDestroy() {
    this.downloadAbort?.abort();
  }
  onStick(name) {
    if (!name) {
      this.entries = [];
      this.total = 0;
      this.selected = [];
      this.rel = "";
      return;
    }
    this.stickName = name;
    this.rel = "";
    this.selected = [];
    this.load(true);
  }
  onJobState(state, before) {
    if (before && (before === "running" || before === "queued") && state && state !== "running" && state !== "queued") this.load(true);
  }
  say(text, bad = false) {
    this.notice = text;
    this.noticeBad = bad;
  }
  openFolder(path) {
    this.rel = path;
    this.selected = [];
    this.load(true);
  }
  async load(reset) {
    const stick = this.stick;
    if (!stick) return;
    const ticket = ++this.ticket;
    this.loading = true;
    if (reset) {
      this.loadError = "";
      this.entries = [];
      this.total = 0;
    }
    try {
      const page = await usbList(stick.name, this.rel, reset ? 0 : this.entries.length, PAGE);
      if (ticket !== this.ticket) return;
      this.entries = reset ? page.entries : [...this.entries, ...page.entries];
      this.total = Math.max(page.total, this.entries.length);
    } catch (error) {
      if (ticket !== this.ticket) return;
      const { status, message } = failureOf(error);
      this.loadError = status === 404 ? reasonWords("stick_removed") : message || "The printer did not answer.";
      if (status === 404) refreshUsb();
    } finally {
      if (ticket === this.ticket) this.loading = false;
    }
  }
  when(seconds) {
    return seconds ? new Date(seconds * 1e3).toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" }) : "";
  }
  toggle(rel) {
    this.selected = this.selected.includes(rel) ? this.selected.filter((s) => s !== rel) : [...this.selected, rel];
  }
  toggleAll() {
    this.selected = this.allSelected ? [] : this.entries.map((e) => e.rel);
  }
  // -- copy --------------------------------------------------------------------
  askCopy(direction, items, label) {
    this.copyAsk = { direction, items, label };
  }
  async startCopy() {
    const ask = this.copyAsk;
    const stick = this.stick;
    this.copyAsk = null;
    if (!ask || !stick) return;
    this.notice = "";
    try {
      const items = ask.direction === "to_printer" ? ask.items.map((i) => i === "/" ? usbPath(stick.name) : usbPath(stick.name, i)) : ask.items;
      await usbCopy({ direction: ask.direction, stick: stick.name, items, onConflict: this.conflict });
      this.selected = [];
      await refreshUsbJob();
    } catch (error) {
      const { status, reason, message } = failureOf(error);
      if (status === 409) this.say("A copy is already running. Wait for it to finish, or cancel it first.", true);
      else this.say(reasonWords(reason) || message || "The printer could not start the copy.", true);
    }
  }
  async cancelJob() {
    const job = usb.job;
    if (!job) return;
    this.cancelling = true;
    try {
      await usbCancel(job.id);
      await refreshUsbJob();
    } catch (error) {
      this.say(failureOf(error).message || "The printer could not cancel the copy.", true);
    } finally {
      this.cancelling = false;
    }
  }
  dismissJob() {
    dismissJob();
  }
  // -- download, print, eject ----------------------------------------------------
  async download() {
    const stick = this.stick;
    if (!stick) return;
    this.notice = "";
    const files = this.downloadable.slice();
    const big = files.filter((f) => (f.size ?? 0) > LARGE_DOWNLOAD);
    if (big.length) {
      const largest = big.reduce((a, b) => (b.size ?? 0) > (a.size ?? 0) ? b : a);
      const text = big.length === 1 ? `${largest.name} is ${this.bytes(largest.size)}. It downloads into this browser's memory first, which can be slow or fail on a phone. Download it anyway?` : `${big.length} of these files are large (up to ${this.bytes(largest.size)}). They download into this browser's memory first, which can be slow or fail on a phone. Download them anyway?`;
      const sure = await this.$confirm(text, { title: "Large download", buttonTrueText: "Download" });
      if (!sure) return;
    }
    this.downloadAbort = new AbortController();
    try {
      for (const file of files) {
        this.downloading = { name: file.name, loaded: 0, total: file.size };
        const blob = await usbDownload(stick.name, file.rel, {
          signal: this.downloadAbort.signal,
          onProgress: (loaded, total) => {
            this.downloading = { name: file.name, loaded, total: total || file.size };
          }
        });
        saveBlob(blob, file.name);
      }
    } catch (error) {
      if (!this.downloadAbort?.signal.aborted) {
        const { status, message } = failureOf(error);
        this.say(status === 404 ? reasonWords("stick_removed") : `The download failed. ${message}`.trim(), true);
      }
    } finally {
      this.downloading = null;
      this.downloadAbort = null;
    }
  }
  stopDownload() {
    this.downloadAbort?.abort();
  }
  async print() {
    const file = this.printAsk;
    const stick = this.stick;
    this.printAsk = null;
    if (!file || !stick) return;
    try {
      await usbPrint(stick.name, file.rel);
      this.say(`Started printing ${file.name}.`);
      this.$store.dispatch("notifications/pushNotification", { title: "Printing from USB", description: file.name, type: "success", snackbar: true });
    } catch (error) {
      const { status, message } = failureOf(error);
      this.say(status === 409 ? "The printer is busy, so nothing was printed." : status === 404 ? reasonWords("stick_removed") : message || "The printer could not start the print.", true);
    }
  }
  async eject() {
    const stick = this.stick;
    if (!stick || this.running) return;
    this.ejecting = true;
    this.notice = "";
    try {
      await usbEject(stick.name);
      await refreshUsb();
      this.say(`${stick.name} is ejected. Safe to remove.`);
    } catch (error) {
      const { status, reason, message } = failureOf(error);
      this.say(status === 409 || reason === "job_running" ? "A copy is still running. Cancel it or wait for it to finish, then eject." : message || "The printer could not eject the stick.", true);
    } finally {
      this.ejecting = false;
    }
  }
};
__decorateClass([
  Prop({ type: Boolean, default: true })
], UsbBrowser.prototype, "controlReady", 2);
__decorateClass([
  Watch("stick.name")
], UsbBrowser.prototype, "onStick", 1);
__decorateClass([
  Watch("usb.job.state")
], UsbBrowser.prototype, "onJobState", 1);
UsbBrowser = __decorateClass([
  Component({ components: { UsbJobPanel, UsbPrinterPicker } })
], UsbBrowser);
const _sfc_main = UsbBrowser;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "usb", class: { "usb--phone": _vm.isMobileViewport }, attrs: { "data-tid": "usb-view" } }, [_vm.usb.supported === null ? _c("div", { staticClass: "usb__empty", attrs: { "aria-busy": "true", "data-tid": "usb-loading" } }, [_c("span", [_vm._v("Looking for a USB stick\u2026")])]) : [_vm.shownJob ? _c("usb-job-panel", { attrs: { "job": _vm.shownJob, "cancelling": _vm.cancelling }, on: { "cancel": _vm.cancelJob, "dismiss": _vm.dismissJob } }) : _vm._e(), _vm.notice ? _c("p", { staticClass: "usb__notice", class: { "usb__notice--bad": _vm.noticeBad }, attrs: { "role": "status", "data-tid": "usb-notice" } }, [_vm._v(" " + _vm._s(_vm.notice) + " ")]) : _vm._e(), !_vm.stick && _vm.justEjected ? _c("div", { staticClass: "usb__empty", attrs: { "data-tid": "usb-ejected" } }, [_c("span", { staticClass: "usb__empty-icon" }, [_c(__unplugin_components_0, { attrs: { "name": "check" } })], 1), _c("b", [_vm._v("Safe to remove")]), _c("span", [_vm._v(_vm._s(_vm.justEjected.name) + " is ejected. Take it out of the printer. Plug it in again to use it.")])]) : !_vm.stick ? _c("div", { staticClass: "usb__empty", attrs: { "data-tid": "usb-none" } }, [_c("span", { staticClass: "usb__empty-icon" }, [_c(__unplugin_components_1, { attrs: { "name": "files" } })], 1), _c("b", [_vm._v("No USB stick in the printer")]), _vm.rejected ? _c("span", [_vm._v("The stick in the printer can't be read (" + _vm._s(_vm.rejected) + "). Use one formatted as FAT32 or exFAT.")]) : _c("span", [_vm._v("Plug one into the printer's USB port and its files show up here.")])]) : [_c("header", { staticClass: "usb__head" }, [_c("div", { staticClass: "usb__title" }, [_vm.sticks.length > 1 ? _c("select", { directives: [{ name: "model", rawName: "v-model", value: _vm.stickName, expression: "stickName" }], staticClass: "usb__select", attrs: { "aria-label": "USB stick", "data-tid": "usb-stick-select" }, on: { "change": function($event) {
    var $$selectedVal = Array.prototype.filter.call($event.target.options, function(o) {
      return o.selected;
    }).map(function(o) {
      var val = "_value" in o ? o._value : o.value;
      return val;
    });
    _vm.stickName = $event.target.multiple ? $$selectedVal : $$selectedVal[0];
  } } }, _vm._l(_vm.sticks, function(s) {
    return _c("option", { key: s.name, domProps: { "value": s.name } }, [_vm._v(" " + _vm._s(s.name) + " ")]);
  }), 0) : _c("b", { attrs: { "data-tid": "usb-stick-name" } }, [_vm._v(_vm._s(_vm.stick.name))]), _vm.space ? _c("span", { staticClass: "usb__space", attrs: { "data-tid": "usb-space" } }, [_vm._v(_vm._s(_vm.space))]) : _vm._e()]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": _vm.running || _vm.ejecting, "title": _vm.running ? "A copy is running. Cancel it or wait for it to finish." : "", "data-tid": "usb-eject" }, on: { "click": _vm.eject } }, [_vm._v(" " + _vm._s(_vm.ejecting ? "Ejecting\u2026" : "Eject") + " ")])]), _vm.stick.readOnly ? _c("p", { staticClass: "usb__notice", attrs: { "data-tid": "usb-readonly" } }, [_vm._v(" This stick is read-only, so nothing can be copied onto it. You can still print from it and copy its files to the printer. ")]) : _vm._e(), _vm.rel ? _c("nav", { staticClass: "usb__crumbs", attrs: { "aria-label": "Folder" } }, [_c("button", { attrs: { "type": "button", "data-tid": "usb-crumb" }, on: { "click": function($event) {
    return _vm.openFolder("");
  } } }, [_vm._v(" " + _vm._s(_vm.stick.name) + " ")]), _vm._l(_vm.crumbs, function(crumb) {
    return [_c("span", { key: `s-${crumb.path}`, attrs: { "aria-hidden": "true" } }, [_vm._v("/")]), _c("button", { key: crumb.path, attrs: { "type": "button", "data-tid": "usb-crumb", "disabled": crumb.path === _vm.rel }, on: { "click": function($event) {
      return _vm.openFolder(crumb.path);
    } } }, [_vm._v(" " + _vm._s(crumb.name) + " ")])];
  })], 2) : _vm._e(), _c("div", { staticClass: "usb__bar", attrs: { "data-tid": "usb-actions" } }, [_c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.selected.length || _vm.running, "data-tid": "usb-copy-to-printer" }, on: { "click": function($event) {
    _vm.askCopy("to_printer", _vm.selected.slice(), `${_vm.selected.length} selected`);
  } } }, [_c(__unplugin_components_2, { attrs: { "name": "download", "small": "" } }), _vm._v(" Copy to printer" + _vm._s(_vm.selected.length ? ` (${_vm.selected.length})` : "") + " ")], 1), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": _vm.running, "data-tid": "usb-copy-all" }, on: { "click": function($event) {
    return _vm.askCopy("to_printer", ["/"], "everything on the stick");
  } } }, [_vm._v(" Copy all to printer ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": _vm.running || _vm.stick.readOnly || !_vm.controlReady, "data-tid": "usb-copy-from-printer" }, on: { "click": function($event) {
    _vm.picker = true;
  } } }, [_c(__unplugin_components_3, { attrs: { "name": "upload", "small": "" } }), _vm._v(" Copy from printer\u2026 ")], 1), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.downloadable.length || !!_vm.downloading, "data-tid": "usb-download" }, on: { "click": _vm.download } }, [_vm._v(" Download" + _vm._s(_vm.downloadable.length > 1 ? ` (${_vm.downloadable.length})` : "") + " ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.printable || !_vm.controlReady || _vm.running, "data-tid": "usb-print" }, on: { "click": function($event) {
    _vm.printAsk = _vm.printable;
  } } }, [_vm._v(" Print ")])]), _vm.downloading ? _c("div", { staticClass: "usb__download", attrs: { "data-tid": "usb-download-progress" } }, [_c("span", [_vm._v("Downloading " + _vm._s(_vm.downloading.name) + "\u2026 " + _vm._s(_vm.downloading.total ? `${_vm.percent(_vm.downloading.loaded, _vm.downloading.total)}%` : _vm.bytes(_vm.downloading.loaded)))]), _c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "data-tid": "usb-download-cancel" }, on: { "click": _vm.stopDownload } }, [_vm._v(" Cancel ")])]) : _vm._e(), _vm.loadError ? _c("div", { staticClass: "usb__empty", attrs: { "role": "alert", "data-tid": "usb-error" } }, [_c("b", [_vm._v("Couldn't read the stick")]), _c("span", [_vm._v(_vm._s(_vm.loadError))]), _c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    return _vm.load(true);
  } } }, [_vm._v(" Try again ")])]) : _vm.loading && !_vm.entries.length ? _c("div", { staticClass: "usb__empty", attrs: { "aria-busy": "true" } }, [_c("span", [_vm._v("Reading the stick\u2026")])]) : !_vm.entries.length ? _c("div", { staticClass: "usb__empty", attrs: { "data-tid": "usb-empty" } }, [_c("span", { staticClass: "usb__empty-icon" }, [_c(__unplugin_components_4, { attrs: { "name": "files" } })], 1), _c("b", [_vm._v(_vm._s(_vm.rel ? "This folder is empty" : "No G-code on this stick"))]), _c("span", [_vm._v("Only G-code files and the folders they are in are shown.")])]) : [_c("div", { staticClass: "usb__row usb__row--head" }, [_c("label", { staticClass: "usb__check" }, [_c("input", { attrs: { "type": "checkbox", "aria-label": "Select all", "data-tid": "usb-select-all" }, domProps: { "checked": _vm.allSelected }, on: { "change": _vm.toggleAll } })]), _c("span", { staticClass: "usb__name" }, [_vm._v("Name")]), !_vm.isMobileViewport ? _c("span", { staticClass: "usb__when" }, [_vm._v("Modified")]) : _vm._e(), _c("span", { staticClass: "usb__size" }, [_vm._v("Size")])]), _c("ul", { staticClass: "usb__rows", attrs: { "data-tid": "usb-rows" } }, _vm._l(_vm.entries, function(entry) {
    return _c("li", { key: entry.rel, staticClass: "usb__row", class: { "usb__row--on": _vm.selected.includes(entry.rel) }, attrs: { "data-tid": "usb-row", "data-name": entry.name, "data-kind": entry.isDir ? "folder" : "file", "aria-selected": _vm.selected.includes(entry.rel) } }, [_c("label", { staticClass: "usb__check" }, [_c("input", { attrs: { "type": "checkbox", "aria-label": `Select ${entry.name}`, "data-tid": "usb-row-check" }, domProps: { "checked": _vm.selected.includes(entry.rel) }, on: { "change": function($event) {
      return _vm.toggle(entry.rel);
    } } })]), entry.isDir ? _c("button", { staticClass: "usb__name usb__name--folder", attrs: { "type": "button", "data-tid": "usb-open-folder" }, on: { "click": function($event) {
      return _vm.openFolder(entry.rel);
    } } }, [_c(__unplugin_components_5, { attrs: { "name": "files", "small": "" } }), _vm._v(" " + _vm._s(entry.name) + " ")], 1) : _c("span", { staticClass: "usb__name", on: { "click": function($event) {
      return _vm.toggle(entry.rel);
    } } }, [_c(__unplugin_components_6, { attrs: { "name": "jobs", "small": "" } }), _vm._v(" " + _vm._s(entry.name) + " ")], 1), !_vm.isMobileViewport ? _c("span", { staticClass: "usb__when" }, [_vm._v(_vm._s(_vm.when(entry.modified)))]) : _vm._e(), _c("span", { staticClass: "usb__size" }, [_vm._v(_vm._s(entry.isDir ? "" : _vm.bytes(entry.size)))])]);
  }), 0), _vm.entries.length < _vm.total ? _c("button", { staticClass: "cbtn usb__more", attrs: { "type": "button", "disabled": _vm.loading, "data-tid": "usb-more" }, on: { "click": function($event) {
    return _vm.load(false);
  } } }, [_vm._v(" " + _vm._s(_vm.loading ? "Loading\u2026" : `Show more (${_vm.total - _vm.entries.length} left)`) + " ")]) : _vm._e(), _c("p", { staticClass: "usb__count", attrs: { "data-tid": "usb-count" } }, [_vm._v(" Showing " + _vm._s(_vm.entries.length) + " of " + _vm._s(_vm.total) + " ")])]]], _c(__unplugin_components_7, { attrs: { "value": !!_vm.copyAsk, "max-width": "440" }, on: { "input": function($event) {
    _vm.copyAsk = null;
  } } }, [_vm.copyAsk ? _c("div", { staticClass: "usb__dialog", attrs: { "data-tid": "usb-conflict" } }, [_c("b", [_vm._v("Copy " + _vm._s(_vm.copyAsk.label) + " " + _vm._s(_vm.copyAsk.direction === "to_printer" ? "to the printer" : `to ${_vm.stickName}`))]), _c("p", [_vm._v("If a file with the same name is already there:")]), _vm._l(_vm.CONFLICTS, function(choice) {
    return _c("label", { key: choice.value, staticClass: "usb__choice" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.conflict, expression: "conflict" }], attrs: { "type": "radio", "name": "usb-conflict", "data-tid": `usb-conflict-${choice.value}` }, domProps: { "value": choice.value, "checked": _vm._q(_vm.conflict, choice.value) }, on: { "change": function($event) {
      _vm.conflict = choice.value;
    } } }), _c("span", [_c("b", [_vm._v(_vm._s(choice.title))]), _vm._v(" " + _vm._s(choice.hint))])]);
  }), _c("div", { staticClass: "usb__dialog-actions" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.copyAsk = null;
  } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "usb-conflict-confirm" }, on: { "click": _vm.startCopy } }, [_vm._v(" Copy ")])])], 2) : _vm._e()]), _c(__unplugin_components_8, { attrs: { "value": !!_vm.printAsk, "max-width": "420" }, on: { "input": function($event) {
    _vm.printAsk = null;
  } } }, [_vm.printAsk ? _c("div", { staticClass: "usb__dialog", attrs: { "data-tid": "usb-print-confirm" } }, [_c("b", [_vm._v("Print " + _vm._s(_vm.printAsk.name) + "?")]), _c("p", [_vm._v("The printer copies it from the stick to itself first, then starts.")]), _c("div", { staticClass: "usb__dialog-actions" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.printAsk = null;
  } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "usb-print-confirm-go" }, on: { "click": _vm.print } }, [_vm._v(" Print ")])])]) : _vm._e()]), _c("usb-printer-picker", { attrs: { "stick-name": _vm.stickName }, on: { "choose": function($event) {
    return _vm.askCopy("to_usb", $event, $event[0] === "/" ? "everything on the printer" : `${$event.length} selected`);
  } }, model: { value: _vm.picker, callback: function($$v) {
    _vm.picker = $$v;
  }, expression: "picker" } })], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/usb/UsbBrowser.vue?vue&type=style&index=0&scoped=ca8a04b7&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ca8a04b7",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/usb/UsbBrowser.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBR0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNBO0FBU0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUlBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUlBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQSxzQ0FDQSw2SkFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUE7QUFBQTtBQUFBLFFBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExUUE7QUFBQTtBQUFBLEdBREEsV0FDQTtBQXFGQTtBQUFBLEVBREE7QUFBQSxHQXJGQSxXQXNGQTtBQWdCQTtBQUFBLEVBREE7QUFBQSxHQXJHQSxXQXNHQTtBQXRHQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJVc2JCcm93c2VyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJ1c2JcIlxuICAgIDpjbGFzcz1cInsgJ3VzYi0tcGhvbmUnOiBpc01vYmlsZVZpZXdwb3J0IH1cIlxuICAgIGRhdGEtdGlkPVwidXNiLXZpZXdcIlxuICA+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cInVzYi5zdXBwb3J0ZWQgPT09IG51bGxcIlxuICAgICAgY2xhc3M9XCJ1c2JfX2VtcHR5XCJcbiAgICAgIGFyaWEtYnVzeT1cInRydWVcIlxuICAgICAgZGF0YS10aWQ9XCJ1c2ItbG9hZGluZ1wiXG4gICAgPlxuICAgICAgPHNwYW4+TG9va2luZyBmb3IgYSBVU0Igc3RpY2vigKY8L3NwYW4+XG4gICAgPC9kaXY+XG5cbiAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgPHVzYi1qb2ItcGFuZWxcbiAgICAgICAgdi1pZj1cInNob3duSm9iXCJcbiAgICAgICAgOmpvYj1cInNob3duSm9iXCJcbiAgICAgICAgOmNhbmNlbGxpbmc9XCJjYW5jZWxsaW5nXCJcbiAgICAgICAgQGNhbmNlbD1cImNhbmNlbEpvYlwiXG4gICAgICAgIEBkaXNtaXNzPVwiZGlzbWlzc0pvYlwiXG4gICAgICAvPlxuXG4gICAgICA8cFxuICAgICAgICB2LWlmPVwibm90aWNlXCJcbiAgICAgICAgY2xhc3M9XCJ1c2JfX25vdGljZVwiXG4gICAgICAgIDpjbGFzcz1cInsgJ3VzYl9fbm90aWNlLS1iYWQnOiBub3RpY2VCYWQgfVwiXG4gICAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgICBkYXRhLXRpZD1cInVzYi1ub3RpY2VcIlxuICAgICAgPlxuICAgICAgICB7eyBub3RpY2UgfX1cbiAgICAgIDwvcD5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwiIXN0aWNrICYmIGp1c3RFamVjdGVkXCJcbiAgICAgICAgY2xhc3M9XCJ1c2JfX2VtcHR5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJ1c2ItZWplY3RlZFwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwidXNiX19lbXB0eS1pY29uXCI+PGZyYW1lLWljb24gbmFtZT1cImNoZWNrXCIgLz48L3NwYW4+XG4gICAgICAgIDxiPlNhZmUgdG8gcmVtb3ZlPC9iPlxuICAgICAgICA8c3Bhbj57eyBqdXN0RWplY3RlZC5uYW1lIH19IGlzIGVqZWN0ZWQuIFRha2UgaXQgb3V0IG9mIHRoZSBwcmludGVyLiBQbHVnIGl0IGluIGFnYWluIHRvIHVzZSBpdC48L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWVsc2UtaWY9XCIhc3RpY2tcIlxuICAgICAgICBjbGFzcz1cInVzYl9fZW1wdHlcIlxuICAgICAgICBkYXRhLXRpZD1cInVzYi1ub25lXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJ1c2JfX2VtcHR5LWljb25cIj48ZnJhbWUtaWNvbiBuYW1lPVwiZmlsZXNcIiAvPjwvc3Bhbj5cbiAgICAgICAgPGI+Tm8gVVNCIHN0aWNrIGluIHRoZSBwcmludGVyPC9iPlxuICAgICAgICA8c3BhbiB2LWlmPVwicmVqZWN0ZWRcIj5UaGUgc3RpY2sgaW4gdGhlIHByaW50ZXIgY2FuJ3QgYmUgcmVhZCAoe3sgcmVqZWN0ZWQgfX0pLiBVc2Ugb25lIGZvcm1hdHRlZCBhcyBGQVQzMiBvciBleEZBVC48L3NwYW4+XG4gICAgICAgIDxzcGFuIHYtZWxzZT5QbHVnIG9uZSBpbnRvIHRoZSBwcmludGVyJ3MgVVNCIHBvcnQgYW5kIGl0cyBmaWxlcyBzaG93IHVwIGhlcmUuPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgIDxoZWFkZXIgY2xhc3M9XCJ1c2JfX2hlYWRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidXNiX190aXRsZVwiPlxuICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICB2LWlmPVwic3RpY2tzLmxlbmd0aCA+IDFcIlxuICAgICAgICAgICAgICB2LW1vZGVsPVwic3RpY2tOYW1lXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJ1c2JfX3NlbGVjdFwiXG4gICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJVU0Igc3RpY2tcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1zdGljay1zZWxlY3RcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8b3B0aW9uXG4gICAgICAgICAgICAgICAgdi1mb3I9XCJzIGluIHN0aWNrc1wiXG4gICAgICAgICAgICAgICAgOmtleT1cInMubmFtZVwiXG4gICAgICAgICAgICAgICAgOnZhbHVlPVwicy5uYW1lXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt7IHMubmFtZSB9fVxuICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgPGJcbiAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwidXNiLXN0aWNrLW5hbWVcIlxuICAgICAgICAgICAgPnt7IHN0aWNrLm5hbWUgfX08L2I+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwic3BhY2VcIlxuICAgICAgICAgICAgICBjbGFzcz1cInVzYl9fc3BhY2VcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1zcGFjZVwiXG4gICAgICAgICAgICA+e3sgc3BhY2UgfX08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwicnVubmluZyB8fCBlamVjdGluZ1wiXG4gICAgICAgICAgICA6dGl0bGU9XCJydW5uaW5nID8gJ0EgY29weSBpcyBydW5uaW5nLiBDYW5jZWwgaXQgb3Igd2FpdCBmb3IgaXQgdG8gZmluaXNoLicgOiAnJ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1lamVjdFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJlamVjdFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgZWplY3RpbmcgPyAnRWplY3RpbmfigKYnIDogJ0VqZWN0JyB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2hlYWRlcj5cblxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJzdGljay5yZWFkT25seVwiXG4gICAgICAgICAgY2xhc3M9XCJ1c2JfX25vdGljZVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItcmVhZG9ubHlcIlxuICAgICAgICA+XG4gICAgICAgICAgVGhpcyBzdGljayBpcyByZWFkLW9ubHksIHNvIG5vdGhpbmcgY2FuIGJlIGNvcGllZCBvbnRvIGl0LiBZb3UgY2FuIHN0aWxsIHByaW50IGZyb20gaXQgYW5kIGNvcHkgaXRzIGZpbGVzIHRvIHRoZSBwcmludGVyLlxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPG5hdlxuICAgICAgICAgIHYtaWY9XCJyZWxcIlxuICAgICAgICAgIGNsYXNzPVwidXNiX19jcnVtYnNcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJGb2xkZXJcIlxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1jcnVtYlwiXG4gICAgICAgICAgICBAY2xpY2s9XCJvcGVuRm9sZGVyKCcnKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgc3RpY2submFtZSB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWZvcj1cImNydW1iIGluIGNydW1ic1wiPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgOmtleT1cImBzLSR7Y3J1bWIucGF0aH1gXCJcbiAgICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgID4vPC9zcGFuPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICA6a2V5PVwiY3J1bWIucGF0aFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1jcnVtYlwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cImNydW1iLnBhdGggPT09IHJlbFwiXG4gICAgICAgICAgICAgIEBjbGljaz1cIm9wZW5Gb2xkZXIoY3J1bWIucGF0aClcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7eyBjcnVtYi5uYW1lIH19XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8L25hdj5cblxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJ1c2JfX2JhclwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItYWN0aW9uc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFzZWxlY3RlZC5sZW5ndGggfHwgcnVubmluZ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1jb3B5LXRvLXByaW50ZXJcIlxuICAgICAgICAgICAgQGNsaWNrPVwiYXNrQ29weSgndG9fcHJpbnRlcicsIHNlbGVjdGVkLnNsaWNlKCksIGAke3NlbGVjdGVkLmxlbmd0aH0gc2VsZWN0ZWRgKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cImRvd25sb2FkXCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICBDb3B5IHRvIHByaW50ZXJ7eyBzZWxlY3RlZC5sZW5ndGggPyBgICgke3NlbGVjdGVkLmxlbmd0aH0pYCA6ICcnIH19XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwicnVubmluZ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1jb3B5LWFsbFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJhc2tDb3B5KCd0b19wcmludGVyJywgWycvJ10sICdldmVyeXRoaW5nIG9uIHRoZSBzdGljaycpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDb3B5IGFsbCB0byBwcmludGVyXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwicnVubmluZyB8fCBzdGljay5yZWFkT25seSB8fCAhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidXNiLWNvcHktZnJvbS1wcmludGVyXCJcbiAgICAgICAgICAgIEBjbGljaz1cInBpY2tlciA9IHRydWVcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJ1cGxvYWRcIlxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIENvcHkgZnJvbSBwcmludGVy4oCmXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIWRvd25sb2FkYWJsZS5sZW5ndGggfHwgISFkb3dubG9hZGluZ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1kb3dubG9hZFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJkb3dubG9hZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgRG93bmxvYWR7eyBkb3dubG9hZGFibGUubGVuZ3RoID4gMSA/IGAgKCR7ZG93bmxvYWRhYmxlLmxlbmd0aH0pYCA6ICcnIH19XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIXByaW50YWJsZSB8fCAhY29udHJvbFJlYWR5IHx8IHJ1bm5pbmdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItcHJpbnRcIlxuICAgICAgICAgICAgQGNsaWNrPVwicHJpbnRBc2sgPSBwcmludGFibGVcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFByaW50XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWlmPVwiZG93bmxvYWRpbmdcIlxuICAgICAgICAgIGNsYXNzPVwidXNiX19kb3dubG9hZFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItZG93bmxvYWQtcHJvZ3Jlc3NcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4+RG93bmxvYWRpbmcge3sgZG93bmxvYWRpbmcubmFtZSB9feKApiB7eyBkb3dubG9hZGluZy50b3RhbCA/IGAke3BlcmNlbnQoZG93bmxvYWRpbmcubG9hZGVkLCBkb3dubG9hZGluZy50b3RhbCl9JWAgOiBieXRlcyhkb3dubG9hZGluZy5sb2FkZWQpIH19PC9zcGFuPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXNtXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidXNiLWRvd25sb2FkLWNhbmNlbFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJzdG9wRG93bmxvYWRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1pZj1cImxvYWRFcnJvclwiXG4gICAgICAgICAgY2xhc3M9XCJ1c2JfX2VtcHR5XCJcbiAgICAgICAgICByb2xlPVwiYWxlcnRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidXNiLWVycm9yXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxiPkNvdWxkbid0IHJlYWQgdGhlIHN0aWNrPC9iPlxuICAgICAgICAgIDxzcGFuPnt7IGxvYWRFcnJvciB9fTwvc3Bhbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICBAY2xpY2s9XCJsb2FkKHRydWUpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBUcnkgYWdhaW5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtZWxzZS1pZj1cImxvYWRpbmcgJiYgIWVudHJpZXMubGVuZ3RoXCJcbiAgICAgICAgICBjbGFzcz1cInVzYl9fZW1wdHlcIlxuICAgICAgICAgIGFyaWEtYnVzeT1cInRydWVcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4+UmVhZGluZyB0aGUgc3RpY2vigKY8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWVsc2UtaWY9XCIhZW50cmllcy5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwidXNiX19lbXB0eVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItZW1wdHlcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1c2JfX2VtcHR5LWljb25cIj48ZnJhbWUtaWNvbiBuYW1lPVwiZmlsZXNcIiAvPjwvc3Bhbj5cbiAgICAgICAgICA8Yj57eyByZWwgPyAnVGhpcyBmb2xkZXIgaXMgZW1wdHknIDogJ05vIEctY29kZSBvbiB0aGlzIHN0aWNrJyB9fTwvYj5cbiAgICAgICAgICA8c3Bhbj5Pbmx5IEctY29kZSBmaWxlcyBhbmQgdGhlIGZvbGRlcnMgdGhleSBhcmUgaW4gYXJlIHNob3duLjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidXNiX19yb3cgdXNiX19yb3ctLWhlYWRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInVzYl9fY2hlY2tcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICA6Y2hlY2tlZD1cImFsbFNlbGVjdGVkXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiU2VsZWN0IGFsbFwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ1c2Itc2VsZWN0LWFsbFwiXG4gICAgICAgICAgICAgICAgQGNoYW5nZT1cInRvZ2dsZUFsbFwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVzYl9fbmFtZVwiPk5hbWU8L3NwYW4+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwiIWlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICAgICAgICBjbGFzcz1cInVzYl9fd2hlblwiXG4gICAgICAgICAgICA+TW9kaWZpZWQ8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVzYl9fc2l6ZVwiPlNpemU8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHVsXG4gICAgICAgICAgICBjbGFzcz1cInVzYl9fcm93c1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1yb3dzXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8bGlcbiAgICAgICAgICAgICAgdi1mb3I9XCJlbnRyeSBpbiBlbnRyaWVzXCJcbiAgICAgICAgICAgICAgOmtleT1cImVudHJ5LnJlbFwiXG4gICAgICAgICAgICAgIGNsYXNzPVwidXNiX19yb3dcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICd1c2JfX3Jvdy0tb24nOiBzZWxlY3RlZC5pbmNsdWRlcyhlbnRyeS5yZWwpIH1cIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1yb3dcIlxuICAgICAgICAgICAgICA6ZGF0YS1uYW1lPVwiZW50cnkubmFtZVwiXG4gICAgICAgICAgICAgIDpkYXRhLWtpbmQ9XCJlbnRyeS5pc0RpciA/ICdmb2xkZXInIDogJ2ZpbGUnXCJcbiAgICAgICAgICAgICAgOmFyaWEtc2VsZWN0ZWQ9XCJzZWxlY3RlZC5pbmNsdWRlcyhlbnRyeS5yZWwpXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwidXNiX19jaGVja1wiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgIDpjaGVja2VkPVwic2VsZWN0ZWQuaW5jbHVkZXMoZW50cnkucmVsKVwiXG4gICAgICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBTZWxlY3QgJHtlbnRyeS5uYW1lfWBcIlxuICAgICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ1c2Itcm93LWNoZWNrXCJcbiAgICAgICAgICAgICAgICAgIEBjaGFuZ2U9XCJ0b2dnbGUoZW50cnkucmVsKVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1pZj1cImVudHJ5LmlzRGlyXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cInVzYl9fbmFtZSB1c2JfX25hbWUtLWZvbGRlclwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ1c2Itb3Blbi1mb2xkZXJcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cIm9wZW5Gb2xkZXIoZW50cnkucmVsKVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgICAgbmFtZT1cImZpbGVzXCJcbiAgICAgICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICB7eyBlbnRyeS5uYW1lIH19XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgICAgIGNsYXNzPVwidXNiX19uYW1lXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJ0b2dnbGUoZW50cnkucmVsKVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgICAgbmFtZT1cImpvYnNcIlxuICAgICAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIHt7IGVudHJ5Lm5hbWUgfX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIHYtaWY9XCIhaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJ1c2JfX3doZW5cIlxuICAgICAgICAgICAgICA+e3sgd2hlbihlbnRyeS5tb2RpZmllZCkgfX08L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidXNiX19zaXplXCI+e3sgZW50cnkuaXNEaXIgPyAnJyA6IGJ5dGVzKGVudHJ5LnNpemUpIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtaWY9XCJlbnRyaWVzLmxlbmd0aCA8IHRvdGFsXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuIHVzYl9fbW9yZVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJsb2FkaW5nXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidXNiLW1vcmVcIlxuICAgICAgICAgICAgQGNsaWNrPVwibG9hZChmYWxzZSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGxvYWRpbmcgPyAnTG9hZGluZ+KApicgOiBgU2hvdyBtb3JlICgke3RvdGFsIC0gZW50cmllcy5sZW5ndGh9IGxlZnQpYCB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxwXG4gICAgICAgICAgICBjbGFzcz1cInVzYl9fY291bnRcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItY291bnRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFNob3dpbmcge3sgZW50cmllcy5sZW5ndGggfX0gb2Yge3sgdG90YWwgfX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvdGVtcGxhdGU+XG5cbiAgICA8di1kaWFsb2dcbiAgICAgIDp2YWx1ZT1cIiEhY29weUFza1wiXG4gICAgICBtYXgtd2lkdGg9XCI0NDBcIlxuICAgICAgQGlucHV0PVwiY29weUFzayA9IG51bGxcIlxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cImNvcHlBc2tcIlxuICAgICAgICBjbGFzcz1cInVzYl9fZGlhbG9nXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ1c2ItY29uZmxpY3RcIlxuICAgICAgPlxuICAgICAgICA8Yj5Db3B5IHt7IGNvcHlBc2subGFiZWwgfX0ge3sgY29weUFzay5kaXJlY3Rpb24gPT09ICd0b19wcmludGVyJyA/ICd0byB0aGUgcHJpbnRlcicgOiBgdG8gJHtzdGlja05hbWV9YCB9fTwvYj5cbiAgICAgICAgPHA+SWYgYSBmaWxlIHdpdGggdGhlIHNhbWUgbmFtZSBpcyBhbHJlYWR5IHRoZXJlOjwvcD5cbiAgICAgICAgPGxhYmVsXG4gICAgICAgICAgdi1mb3I9XCJjaG9pY2UgaW4gQ09ORkxJQ1RTXCJcbiAgICAgICAgICA6a2V5PVwiY2hvaWNlLnZhbHVlXCJcbiAgICAgICAgICBjbGFzcz1cInVzYl9fY2hvaWNlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgdi1tb2RlbD1cImNvbmZsaWN0XCJcbiAgICAgICAgICAgIHR5cGU9XCJyYWRpb1wiXG4gICAgICAgICAgICBuYW1lPVwidXNiLWNvbmZsaWN0XCJcbiAgICAgICAgICAgIDp2YWx1ZT1cImNob2ljZS52YWx1ZVwiXG4gICAgICAgICAgICA6ZGF0YS10aWQ9XCJgdXNiLWNvbmZsaWN0LSR7Y2hvaWNlLnZhbHVlfWBcIlxuICAgICAgICAgID5cbiAgICAgICAgICA8c3Bhbj48Yj57eyBjaG9pY2UudGl0bGUgfX08L2I+IHt7IGNob2ljZS5oaW50IH19PC9zcGFuPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidXNiX19kaWFsb2ctYWN0aW9uc1wiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICAgIEBjbGljaz1cImNvcHlBc2sgPSBudWxsXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDYW5jZWxcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidXNiLWNvbmZsaWN0LWNvbmZpcm1cIlxuICAgICAgICAgICAgQGNsaWNrPVwic3RhcnRDb3B5XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDb3B5XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC92LWRpYWxvZz5cblxuICAgIDx2LWRpYWxvZ1xuICAgICAgOnZhbHVlPVwiISFwcmludEFza1wiXG4gICAgICBtYXgtd2lkdGg9XCI0MjBcIlxuICAgICAgQGlucHV0PVwicHJpbnRBc2sgPSBudWxsXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJwcmludEFza1wiXG4gICAgICAgIGNsYXNzPVwidXNiX19kaWFsb2dcIlxuICAgICAgICBkYXRhLXRpZD1cInVzYi1wcmludC1jb25maXJtXCJcbiAgICAgID5cbiAgICAgICAgPGI+UHJpbnQge3sgcHJpbnRBc2submFtZSB9fT88L2I+XG4gICAgICAgIDxwPlRoZSBwcmludGVyIGNvcGllcyBpdCBmcm9tIHRoZSBzdGljayB0byBpdHNlbGYgZmlyc3QsIHRoZW4gc3RhcnRzLjwvcD5cbiAgICAgICAgPGRpdiBjbGFzcz1cInVzYl9fZGlhbG9nLWFjdGlvbnNcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICBAY2xpY2s9XCJwcmludEFzayA9IG51bGxcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItcHJpbnQtY29uZmlybS1nb1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJwcmludFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgUHJpbnRcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L3YtZGlhbG9nPlxuXG4gICAgPHVzYi1wcmludGVyLXBpY2tlclxuICAgICAgdi1tb2RlbD1cInBpY2tlclwiXG4gICAgICA6c3RpY2stbmFtZT1cInN0aWNrTmFtZVwiXG4gICAgICBAY2hvb3NlPVwiYXNrQ29weSgndG9fdXNiJywgJGV2ZW50LCAkZXZlbnRbMF0gPT09ICcvJyA/ICdldmVyeXRoaW5nIG9uIHRoZSBwcmludGVyJyA6IGAkeyRldmVudC5sZW5ndGh9IHNlbGVjdGVkYClcIlxuICAgIC8+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IFVzYkpvYlBhbmVsIGZyb20gJy4vVXNiSm9iUGFuZWwudnVlJ1xuaW1wb3J0IFVzYlByaW50ZXJQaWNrZXIgZnJvbSAnLi9Vc2JQcmludGVyUGlja2VyLnZ1ZSdcbmltcG9ydCB7IGZhaWx1cmVPZiwgc2F2ZUJsb2IsIHVzYkNhbmNlbCwgdXNiQ29weSwgdXNiRG93bmxvYWQsIHVzYkVqZWN0LCB1c2JMaXN0LCB1c2JQYXRoLCB1c2JQcmludCB9IGZyb20gJ0Avc2VydmljZXMvdXNiL2FwaSdcbmltcG9ydCB7IGRpc21pc3NKb2IsIHJlZnJlc2hVc2IsIHJlZnJlc2hVc2JKb2IsIHVzYiB9IGZyb20gJ0Avc2VydmljZXMvdXNiL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBVc2JDb25mbGljdCwgVXNiRGlyZWN0aW9uLCBVc2JFbnRyeSwgVXNiSm9iLCBVc2JTdGljayB9IGZyb20gJ0Avc2VydmljZXMvdXNiL3R5cGVzJ1xuaW1wb3J0IHsgYnl0ZXNXb3JkcywgaXNSdW5uaW5nLCBwZXJjZW50T2YsIHJlYXNvbldvcmRzIH0gZnJvbSAnQC9zZXJ2aWNlcy91c2Ivd29yZHMnXG5cbmNvbnN0IFBBR0UgPSAxMDBcblxuLyoqIEFib3ZlIHRoaXMgYSBkb3dubG9hZCBhc2tzIGZpcnN0OiBpdCBpcyBoZWxkIGluIHRoZSBicm93c2VyJ3MgbWVtb3J5IHVudGlsIHNhdmVkLiAqL1xuY29uc3QgTEFSR0VfRE9XTkxPQUQgPSAxMDAgKiAxMDI0ICogMTAyNFxuXG5jb25zdCBDT05GTElDVFM6IEFycmF5PHsgdmFsdWU6IFVzYkNvbmZsaWN0LCB0aXRsZTogc3RyaW5nLCBoaW50OiBzdHJpbmcgfT4gPSBbXG4gIHsgdmFsdWU6ICdyZW5hbWUnLCB0aXRsZTogJ0tlZXAgYm90aC4nLCBoaW50OiAnVGhlIG5ldyBvbmUgZ2V0cyBhIG51bWJlciBhZGRlZCB0byBpdHMgbmFtZS4nIH0sXG4gIHsgdmFsdWU6ICdza2lwJywgdGl0bGU6ICdTa2lwIGl0LicsIGhpbnQ6ICdMZWF2ZSB0aGUgZmlsZSB0aGF0IGlzIHRoZXJlLicgfSxcbiAgeyB2YWx1ZTogJ3JlcGxhY2UnLCB0aXRsZTogJ092ZXJ3cml0ZSBpdC4nLCBoaW50OiAnVGhlIGZpbGUgdGhhdCBpcyB0aGVyZSBpcyByZXBsYWNlZC4nIH1cbl1cblxuLyoqXG4gKiBUaGUgcHJpbnRlcidzIFVTQiBzdGljayBhcyBhIGxpc3QgKEtBTi00ODE0LCBJLTUyMCk6IGJyb3dzZSwgcHJpbnQsIGRvd25sb2FkLFxuICogY29weSB0byBhbmQgZnJvbSB0aGUgcHJpbnRlciAob25lLCBzZXZlcmFsIG9yIGFsbCksIGFuZCBlamVjdC4gRXZlcnl0aGluZ1xuICogZ29lcyB0aHJvdWdoIHRoZSBwcmludGVyJ3MgVVNCIHJvdXRlcyBvdmVyIHRoZSBwYWdlJ3Mgb3duIEhUVFAgY2xpZW50LCBzb1xuICogaXQgd29ya3Mgb3ZlciBhIExBTiwgQmx1ZXRvb3RoIG9yIHRoZSBjbG91ZCBhbGlrZS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVXNiSm9iUGFuZWwsIFVzYlByaW50ZXJQaWNrZXIgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXNiQnJvd3NlciBleHRlbmRzIE1peGlucyhCcm93c2VyTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiB0cnVlIH0pIHJlYWRvbmx5IGNvbnRyb2xSZWFkeSE6IGJvb2xlYW5cblxuICByZWFkb25seSB1c2IgPSB1c2JcbiAgcmVhZG9ubHkgQ09ORkxJQ1RTID0gQ09ORkxJQ1RTXG4gIHJlYWRvbmx5IGJ5dGVzID0gYnl0ZXNXb3Jkc1xuICByZWFkb25seSBwZXJjZW50ID0gcGVyY2VudE9mXG5cbiAgc3RpY2tOYW1lID0gJydcbiAgcmVsID0gJydcbiAgZW50cmllczogVXNiRW50cnlbXSA9IFtdXG4gIHRvdGFsID0gMFxuICBsb2FkaW5nID0gZmFsc2VcbiAgbG9hZEVycm9yID0gJydcbiAgc2VsZWN0ZWQ6IHN0cmluZ1tdID0gW11cbiAgbm90aWNlID0gJydcbiAgbm90aWNlQmFkID0gZmFsc2VcbiAgY2FuY2VsbGluZyA9IGZhbHNlXG4gIGVqZWN0aW5nID0gZmFsc2VcbiAgcGlja2VyID0gZmFsc2VcbiAgY29uZmxpY3Q6IFVzYkNvbmZsaWN0ID0gJ3JlbmFtZSdcbiAgY29weUFzazogeyBkaXJlY3Rpb246IFVzYkRpcmVjdGlvbiwgaXRlbXM6IHN0cmluZ1tdLCBsYWJlbDogc3RyaW5nIH0gfCBudWxsID0gbnVsbFxuICBwcmludEFzazogVXNiRW50cnkgfCBudWxsID0gbnVsbFxuICBkb3dubG9hZGluZzogeyBuYW1lOiBzdHJpbmcsIGxvYWRlZDogbnVtYmVyLCB0b3RhbDogbnVtYmVyIH0gfCBudWxsID0gbnVsbFxuICBkb3dubG9hZEFib3J0OiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbFxuICAvKiogV2hpY2ggcmVhZCB0aGUgbGlzdCBpcyB3YWl0aW5nIGZvciwgc28gYSBzbG93IGFuc3dlciBmb3IgYSBmb2xkZXIgYWxyZWFkeSBsZWZ0IGlzIGRyb3BwZWQuICovXG4gIHRpY2tldCA9IDBcblxuICBnZXQgc3RpY2tzICgpOiBVc2JTdGlja1tdIHsgcmV0dXJuIHVzYi5zdGF0dXM/LnN0aWNrcyA/PyBbXSB9XG5cbiAgZ2V0IHN0aWNrICgpOiBVc2JTdGljayB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnN0aWNrcy5maW5kKHMgPT4gcy5uYW1lID09PSB0aGlzLnN0aWNrTmFtZSkgPz8gdGhpcy5zdGlja3NbMF0gPz8gbnVsbFxuICB9XG5cbiAgZ2V0IHJlamVjdGVkICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHIgPSB1c2Iuc3RhdHVzPy5yZWplY3RlZFswXVxuICAgIHJldHVybiByID8gKHIuZnN0eXBlIHx8IHIubGFiZWwgfHwgci5uYW1lKSA6ICcnXG4gIH1cblxuICBnZXQganVzdEVqZWN0ZWQgKCkge1xuICAgIHJldHVybiB1c2Iuc3RhdHVzPy5lamVjdGVkWzBdID8/IG51bGxcbiAgfVxuXG4gIGdldCBzcGFjZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBzID0gdGhpcy5zdGlja1xuICAgIGlmICghcyB8fCBzLmZyZWVCeXRlcyA9PT0gbnVsbCkgcmV0dXJuICcnXG4gICAgcmV0dXJuIHMudG90YWxCeXRlcyA/IGAke2J5dGVzV29yZHMocy5mcmVlQnl0ZXMpfSBmcmVlIG9mICR7Ynl0ZXNXb3JkcyhzLnRvdGFsQnl0ZXMpfWAgOiBgJHtieXRlc1dvcmRzKHMuZnJlZUJ5dGVzKX0gZnJlZWBcbiAgfVxuXG4gIGdldCBjcnVtYnMgKCk6IEFycmF5PHsgbmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHBhcnRzID0gdGhpcy5yZWwgPyB0aGlzLnJlbC5zcGxpdCgnLycpIDogW11cbiAgICByZXR1cm4gcGFydHMubWFwKChuYW1lLCBpKSA9PiAoeyBuYW1lLCBwYXRoOiBwYXJ0cy5zbGljZSgwLCBpICsgMSkuam9pbignLycpIH0pKVxuICB9XG5cbiAgZ2V0IHNob3duSm9iICgpOiBVc2JKb2IgfCBudWxsIHtcbiAgICBjb25zdCBqb2IgPSB1c2Iuam9iXG4gICAgaWYgKCFqb2IgfHwgam9iLmlkID09PSB1c2IuZGlzbWlzc2VkKSByZXR1cm4gbnVsbFxuICAgIHJldHVybiBqb2JcbiAgfVxuXG4gIGdldCBydW5uaW5nICgpOiBib29sZWFuIHsgcmV0dXJuIGlzUnVubmluZyh1c2Iuam9iKSB9XG5cbiAgZ2V0IGFsbFNlbGVjdGVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmVudHJpZXMubGVuZ3RoICYmIHRoaXMuZW50cmllcy5ldmVyeShlID0+IHRoaXMuc2VsZWN0ZWQuaW5jbHVkZXMoZS5yZWwpKVxuICB9XG5cbiAgZ2V0IGRvd25sb2FkYWJsZSAoKTogVXNiRW50cnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuZW50cmllcy5maWx0ZXIoZSA9PiAhZS5pc0RpciAmJiB0aGlzLnNlbGVjdGVkLmluY2x1ZGVzKGUucmVsKSlcbiAgfVxuXG4gIC8qKiBQcmludCB0YWtlcyBleGFjdGx5IG9uZSBmaWxlLiAqL1xuICBnZXQgcHJpbnRhYmxlICgpOiBVc2JFbnRyeSB8IG51bGwge1xuICAgIGNvbnN0IHBpY2tlZCA9IHRoaXMuZW50cmllcy5maWx0ZXIoZSA9PiB0aGlzLnNlbGVjdGVkLmluY2x1ZGVzKGUucmVsKSlcbiAgICByZXR1cm4gcGlja2VkLmxlbmd0aCA9PT0gMSAmJiAhcGlja2VkWzBdLmlzRGlyID8gcGlja2VkWzBdIDogbnVsbFxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5zdGlja05hbWUgPSB0aGlzLnN0aWNrc1swXT8ubmFtZSA/PyAnJ1xuICAgIGlmICh0aGlzLnN0aWNrTmFtZSkgdGhpcy5sb2FkKHRydWUpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLmRvd25sb2FkQWJvcnQ/LmFib3J0KClcbiAgfVxuXG4gIEBXYXRjaCgnc3RpY2submFtZScpXG4gIG9uU3RpY2sgKG5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhpcy5lbnRyaWVzID0gW11cbiAgICAgIHRoaXMudG90YWwgPSAwXG4gICAgICB0aGlzLnNlbGVjdGVkID0gW11cbiAgICAgIHRoaXMucmVsID0gJydcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnN0aWNrTmFtZSA9IG5hbWVcbiAgICB0aGlzLnJlbCA9ICcnXG4gICAgdGhpcy5zZWxlY3RlZCA9IFtdXG4gICAgdGhpcy5sb2FkKHRydWUpXG4gIH1cblxuICAvKiogQSBjb3B5IG9udG8gdGhlIHN0aWNrIGNoYW5nZXMgd2hhdCBpcyBvbiBpdC4gKi9cbiAgQFdhdGNoKCd1c2Iuam9iLnN0YXRlJylcbiAgb25Kb2JTdGF0ZSAoc3RhdGU6IHN0cmluZyB8IHVuZGVmaW5lZCwgYmVmb3JlOiBzdHJpbmcgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoYmVmb3JlICYmIChiZWZvcmUgPT09ICdydW5uaW5nJyB8fCBiZWZvcmUgPT09ICdxdWV1ZWQnKSAmJiBzdGF0ZSAmJiBzdGF0ZSAhPT0gJ3J1bm5pbmcnICYmIHN0YXRlICE9PSAncXVldWVkJykgdGhpcy5sb2FkKHRydWUpXG4gIH1cblxuICBzYXkgKHRleHQ6IHN0cmluZywgYmFkID0gZmFsc2UpIHtcbiAgICB0aGlzLm5vdGljZSA9IHRleHRcbiAgICB0aGlzLm5vdGljZUJhZCA9IGJhZFxuICB9XG5cbiAgb3BlbkZvbGRlciAocGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5yZWwgPSBwYXRoXG4gICAgdGhpcy5zZWxlY3RlZCA9IFtdXG4gICAgdGhpcy5sb2FkKHRydWUpXG4gIH1cblxuICBhc3luYyBsb2FkIChyZXNldDogYm9vbGVhbikge1xuICAgIGNvbnN0IHN0aWNrID0gdGhpcy5zdGlja1xuICAgIGlmICghc3RpY2spIHJldHVyblxuICAgIGNvbnN0IHRpY2tldCA9ICsrdGhpcy50aWNrZXRcbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlXG4gICAgaWYgKHJlc2V0KSB7IHRoaXMubG9hZEVycm9yID0gJyc7IHRoaXMuZW50cmllcyA9IFtdOyB0aGlzLnRvdGFsID0gMCB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB1c2JMaXN0KHN0aWNrLm5hbWUsIHRoaXMucmVsLCByZXNldCA/IDAgOiB0aGlzLmVudHJpZXMubGVuZ3RoLCBQQUdFKVxuICAgICAgaWYgKHRpY2tldCAhPT0gdGhpcy50aWNrZXQpIHJldHVyblxuICAgICAgdGhpcy5lbnRyaWVzID0gcmVzZXQgPyBwYWdlLmVudHJpZXMgOiBbLi4udGhpcy5lbnRyaWVzLCAuLi5wYWdlLmVudHJpZXNdXG4gICAgICB0aGlzLnRvdGFsID0gTWF0aC5tYXgocGFnZS50b3RhbCwgdGhpcy5lbnRyaWVzLmxlbmd0aClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKHRpY2tldCAhPT0gdGhpcy50aWNrZXQpIHJldHVyblxuICAgICAgY29uc3QgeyBzdGF0dXMsIG1lc3NhZ2UgfSA9IGZhaWx1cmVPZihlcnJvcilcbiAgICAgIHRoaXMubG9hZEVycm9yID0gc3RhdHVzID09PSA0MDQgPyByZWFzb25Xb3Jkcygnc3RpY2tfcmVtb3ZlZCcpIDogKG1lc3NhZ2UgfHwgJ1RoZSBwcmludGVyIGRpZCBub3QgYW5zd2VyLicpXG4gICAgICBpZiAoc3RhdHVzID09PSA0MDQpIHJlZnJlc2hVc2IoKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAodGlja2V0ID09PSB0aGlzLnRpY2tldCkgdGhpcy5sb2FkaW5nID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICB3aGVuIChzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWNvbmRzID8gbmV3IERhdGUoc2Vjb25kcyAqIDEwMDApLnRvTG9jYWxlRGF0ZVN0cmluZyh1bmRlZmluZWQsIHsgZGF5OiAnbnVtZXJpYycsIG1vbnRoOiAnc2hvcnQnLCB5ZWFyOiAnbnVtZXJpYycgfSkgOiAnJ1xuICB9XG5cbiAgdG9nZ2xlIChyZWw6IHN0cmluZykge1xuICAgIHRoaXMuc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkLmluY2x1ZGVzKHJlbCkgPyB0aGlzLnNlbGVjdGVkLmZpbHRlcihzID0+IHMgIT09IHJlbCkgOiBbLi4udGhpcy5zZWxlY3RlZCwgcmVsXVxuICB9XG5cbiAgdG9nZ2xlQWxsICgpIHtcbiAgICB0aGlzLnNlbGVjdGVkID0gdGhpcy5hbGxTZWxlY3RlZCA/IFtdIDogdGhpcy5lbnRyaWVzLm1hcChlID0+IGUucmVsKVxuICB9XG5cbiAgLy8gLS0gY29weSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGFza0NvcHkgKGRpcmVjdGlvbjogVXNiRGlyZWN0aW9uLCBpdGVtczogc3RyaW5nW10sIGxhYmVsOiBzdHJpbmcpIHtcbiAgICB0aGlzLmNvcHlBc2sgPSB7IGRpcmVjdGlvbiwgaXRlbXMsIGxhYmVsIH1cbiAgfVxuXG4gIGFzeW5jIHN0YXJ0Q29weSAoKSB7XG4gICAgY29uc3QgYXNrID0gdGhpcy5jb3B5QXNrXG4gICAgY29uc3Qgc3RpY2sgPSB0aGlzLnN0aWNrXG4gICAgdGhpcy5jb3B5QXNrID0gbnVsbFxuICAgIGlmICghYXNrIHx8ICFzdGljaykgcmV0dXJuXG4gICAgdGhpcy5ub3RpY2UgPSAnJ1xuICAgIHRyeSB7XG4gICAgICAvLyBBUEkgdjEuMjogdGhlIHN0aWNrJ3Mgc2lkZSBpcyBhbHdheXMgdXNiLzxzdGljaz4vPHBhdGg+OyB0aGUgcHJpbnRlcidzIHNpZGUgaXMgcmVsYXRpdmUgdG8gZ2NvZGVzLy5cbiAgICAgIGNvbnN0IGl0ZW1zID0gYXNrLmRpcmVjdGlvbiA9PT0gJ3RvX3ByaW50ZXInID8gYXNrLml0ZW1zLm1hcChpID0+IGkgPT09ICcvJyA/IHVzYlBhdGgoc3RpY2submFtZSkgOiB1c2JQYXRoKHN0aWNrLm5hbWUsIGkpKSA6IGFzay5pdGVtc1xuICAgICAgYXdhaXQgdXNiQ29weSh7IGRpcmVjdGlvbjogYXNrLmRpcmVjdGlvbiwgc3RpY2s6IHN0aWNrLm5hbWUsIGl0ZW1zLCBvbkNvbmZsaWN0OiB0aGlzLmNvbmZsaWN0IH0pXG4gICAgICB0aGlzLnNlbGVjdGVkID0gW11cbiAgICAgIGF3YWl0IHJlZnJlc2hVc2JKb2IoKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCB7IHN0YXR1cywgcmVhc29uLCBtZXNzYWdlIH0gPSBmYWlsdXJlT2YoZXJyb3IpXG4gICAgICBpZiAoc3RhdHVzID09PSA0MDkpIHRoaXMuc2F5KCdBIGNvcHkgaXMgYWxyZWFkeSBydW5uaW5nLiBXYWl0IGZvciBpdCB0byBmaW5pc2gsIG9yIGNhbmNlbCBpdCBmaXJzdC4nLCB0cnVlKVxuICAgICAgZWxzZSB0aGlzLnNheShyZWFzb25Xb3JkcyhyZWFzb24pIHx8IG1lc3NhZ2UgfHwgJ1RoZSBwcmludGVyIGNvdWxkIG5vdCBzdGFydCB0aGUgY29weS4nLCB0cnVlKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNhbmNlbEpvYiAoKSB7XG4gICAgY29uc3Qgam9iID0gdXNiLmpvYlxuICAgIGlmICgham9iKSByZXR1cm5cbiAgICB0aGlzLmNhbmNlbGxpbmcgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHVzYkNhbmNlbChqb2IuaWQpXG4gICAgICBhd2FpdCByZWZyZXNoVXNiSm9iKClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5zYXkoZmFpbHVyZU9mKGVycm9yKS5tZXNzYWdlIHx8ICdUaGUgcHJpbnRlciBjb3VsZCBub3QgY2FuY2VsIHRoZSBjb3B5LicsIHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2FuY2VsbGluZyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgZGlzbWlzc0pvYiAoKSB7XG4gICAgZGlzbWlzc0pvYigpXG4gIH1cblxuICAvLyAtLSBkb3dubG9hZCwgcHJpbnQsIGVqZWN0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBhc3luYyBkb3dubG9hZCAoKSB7XG4gICAgY29uc3Qgc3RpY2sgPSB0aGlzLnN0aWNrXG4gICAgaWYgKCFzdGljaykgcmV0dXJuXG4gICAgdGhpcy5ub3RpY2UgPSAnJ1xuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5kb3dubG9hZGFibGUuc2xpY2UoKVxuICAgIC8vIEEgZG93bmxvYWQgaXMgaGVsZCBpbiB0aGlzIHRhYidzIG1lbW9yeSB1bnRpbCBpdCBpcyBzYXZlZDogYSBiaWcgZmlsZSBjYW4gbWFrZSBhIHBob25lJ3MgYnJvd3NlclxuICAgIC8vIGNsb3NlIHRoZSBwYWdlLCBzbyBhc2sgZmlyc3QgYWJvdmUgTEFSR0VfRE9XTkxPQUQgKEtBTi00ODE1IHJldmlldykuXG4gICAgY29uc3QgYmlnID0gZmlsZXMuZmlsdGVyKGYgPT4gKGYuc2l6ZSA/PyAwKSA+IExBUkdFX0RPV05MT0FEKVxuICAgIGlmIChiaWcubGVuZ3RoKSB7XG4gICAgICBjb25zdCBsYXJnZXN0ID0gYmlnLnJlZHVjZSgoYSwgYikgPT4gKChiLnNpemUgPz8gMCkgPiAoYS5zaXplID8/IDApID8gYiA6IGEpKVxuICAgICAgY29uc3QgdGV4dCA9IGJpZy5sZW5ndGggPT09IDFcbiAgICAgICAgPyBgJHtsYXJnZXN0Lm5hbWV9IGlzICR7dGhpcy5ieXRlcyhsYXJnZXN0LnNpemUpfS4gSXQgZG93bmxvYWRzIGludG8gdGhpcyBicm93c2VyJ3MgbWVtb3J5IGZpcnN0LCB3aGljaCBjYW4gYmUgc2xvdyBvciBmYWlsIG9uIGEgcGhvbmUuIERvd25sb2FkIGl0IGFueXdheT9gXG4gICAgICAgIDogYCR7YmlnLmxlbmd0aH0gb2YgdGhlc2UgZmlsZXMgYXJlIGxhcmdlICh1cCB0byAke3RoaXMuYnl0ZXMobGFyZ2VzdC5zaXplKX0pLiBUaGV5IGRvd25sb2FkIGludG8gdGhpcyBicm93c2VyJ3MgbWVtb3J5IGZpcnN0LCB3aGljaCBjYW4gYmUgc2xvdyBvciBmYWlsIG9uIGEgcGhvbmUuIERvd25sb2FkIHRoZW0gYW55d2F5P2BcbiAgICAgIGNvbnN0IHN1cmUgPSBhd2FpdCB0aGlzLiRjb25maXJtKHRleHQsIHsgdGl0bGU6ICdMYXJnZSBkb3dubG9hZCcsIGJ1dHRvblRydWVUZXh0OiAnRG93bmxvYWQnIH0pXG4gICAgICBpZiAoIXN1cmUpIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmRvd25sb2FkQWJvcnQgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgICB0cnkge1xuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICAgIHRoaXMuZG93bmxvYWRpbmcgPSB7IG5hbWU6IGZpbGUubmFtZSwgbG9hZGVkOiAwLCB0b3RhbDogZmlsZS5zaXplIH1cbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IHVzYkRvd25sb2FkKHN0aWNrLm5hbWUsIGZpbGUucmVsLCB7XG4gICAgICAgICAgc2lnbmFsOiB0aGlzLmRvd25sb2FkQWJvcnQuc2lnbmFsLFxuICAgICAgICAgIG9uUHJvZ3Jlc3M6IChsb2FkZWQsIHRvdGFsKSA9PiB7IHRoaXMuZG93bmxvYWRpbmcgPSB7IG5hbWU6IGZpbGUubmFtZSwgbG9hZGVkLCB0b3RhbDogdG90YWwgfHwgZmlsZS5zaXplIH0gfVxuICAgICAgICB9KVxuICAgICAgICBzYXZlQmxvYihibG9iLCBmaWxlLm5hbWUpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmICghdGhpcy5kb3dubG9hZEFib3J0Py5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICBjb25zdCB7IHN0YXR1cywgbWVzc2FnZSB9ID0gZmFpbHVyZU9mKGVycm9yKVxuICAgICAgICB0aGlzLnNheShzdGF0dXMgPT09IDQwNCA/IHJlYXNvbldvcmRzKCdzdGlja19yZW1vdmVkJykgOiBgVGhlIGRvd25sb2FkIGZhaWxlZC4gJHttZXNzYWdlfWAudHJpbSgpLCB0cnVlKVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmRvd25sb2FkaW5nID0gbnVsbFxuICAgICAgdGhpcy5kb3dubG9hZEFib3J0ID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIHN0b3BEb3dubG9hZCAoKSB7XG4gICAgdGhpcy5kb3dubG9hZEFib3J0Py5hYm9ydCgpXG4gIH1cblxuICBhc3luYyBwcmludCAoKSB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMucHJpbnRBc2tcbiAgICBjb25zdCBzdGljayA9IHRoaXMuc3RpY2tcbiAgICB0aGlzLnByaW50QXNrID0gbnVsbFxuICAgIGlmICghZmlsZSB8fCAhc3RpY2spIHJldHVyblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB1c2JQcmludChzdGljay5uYW1lLCBmaWxlLnJlbClcbiAgICAgIHRoaXMuc2F5KGBTdGFydGVkIHByaW50aW5nICR7ZmlsZS5uYW1lfS5gKVxuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ25vdGlmaWNhdGlvbnMvcHVzaE5vdGlmaWNhdGlvbicsIHsgdGl0bGU6ICdQcmludGluZyBmcm9tIFVTQicsIGRlc2NyaXB0aW9uOiBmaWxlLm5hbWUsIHR5cGU6ICdzdWNjZXNzJywgc25hY2tiYXI6IHRydWUgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgeyBzdGF0dXMsIG1lc3NhZ2UgfSA9IGZhaWx1cmVPZihlcnJvcilcbiAgICAgIHRoaXMuc2F5KHN0YXR1cyA9PT0gNDA5ID8gJ1RoZSBwcmludGVyIGlzIGJ1c3ksIHNvIG5vdGhpbmcgd2FzIHByaW50ZWQuJyA6IHN0YXR1cyA9PT0gNDA0ID8gcmVhc29uV29yZHMoJ3N0aWNrX3JlbW92ZWQnKSA6IChtZXNzYWdlIHx8ICdUaGUgcHJpbnRlciBjb3VsZCBub3Qgc3RhcnQgdGhlIHByaW50LicpLCB0cnVlKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVqZWN0ICgpIHtcbiAgICBjb25zdCBzdGljayA9IHRoaXMuc3RpY2tcbiAgICBpZiAoIXN0aWNrIHx8IHRoaXMucnVubmluZykgcmV0dXJuXG4gICAgdGhpcy5lamVjdGluZyA9IHRydWVcbiAgICB0aGlzLm5vdGljZSA9ICcnXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHVzYkVqZWN0KHN0aWNrLm5hbWUpXG4gICAgICBhd2FpdCByZWZyZXNoVXNiKClcbiAgICAgIHRoaXMuc2F5KGAke3N0aWNrLm5hbWV9IGlzIGVqZWN0ZWQuIFNhZmUgdG8gcmVtb3ZlLmApXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IHsgc3RhdHVzLCByZWFzb24sIG1lc3NhZ2UgfSA9IGZhaWx1cmVPZihlcnJvcilcbiAgICAgIHRoaXMuc2F5KHN0YXR1cyA9PT0gNDA5IHx8IHJlYXNvbiA9PT0gJ2pvYl9ydW5uaW5nJyA/ICdBIGNvcHkgaXMgc3RpbGwgcnVubmluZy4gQ2FuY2VsIGl0IG9yIHdhaXQgZm9yIGl0IHRvIGZpbmlzaCwgdGhlbiBlamVjdC4nIDogKG1lc3NhZ2UgfHwgJ1RoZSBwcmludGVyIGNvdWxkIG5vdCBlamVjdCB0aGUgc3RpY2suJyksIHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuZWplY3RpbmcgPSBmYWxzZVxuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnVzYiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAudXNiX19oZWFkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICB9XG5cbiAgLnVzYl9fdGl0bGUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMTtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lO1xuICAgIGdhcDogNHB4IDEycHg7XG4gICAgbWluLXdpZHRoOiAwO1xuXG4gICAgYiB7XG4gICAgICBmb250LXNpemU6IDE4cHg7XG4gICAgfVxuICB9XG5cbiAgLnVzYl9fc2VsZWN0IHtcbiAgICBwYWRkaW5nOiA0cHggOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgfVxuXG4gIC51c2JfX3NwYWNlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC51c2JfX25vdGljZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDEwcHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcblxuICAgICYtLWJhZCB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXdhcm5pbmcpO1xuICAgIH1cbiAgfVxuXG4gIC51c2JfX2NydW1icyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiA0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE0cHg7XG5cbiAgICBidXR0b246bm90KDpkaXNhYmxlZCkge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC51c2JfX2JhciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAudXNiX19kb3dubG9hZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAudXNiX19lbXB0eSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgcGFkZGluZzogNDBweCAxNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcblxuICAgIGIge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAgIGZvbnQtc2l6ZTogMTdweDtcbiAgICB9XG4gIH1cblxuICAudXNiX19lbXB0eS1pY29uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBwYWRkaW5nOiAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAudXNiX19yb3dzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDA7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgfVxuXG4gIC51c2JfX3JvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtaW4taGVpZ2h0OiA0NHB4O1xuICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuXG4gICAgJi0taGVhZCB7XG4gICAgICBtaW4taGVpZ2h0OiAzMnB4O1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgICBmb250LXNpemU6IDEycHg7XG4gICAgfVxuXG4gICAgJi0tb24ge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtMik7XG4gICAgfVxuXG4gICAgJjpob3Zlcjpub3QoLnVzYl9fcm93LS1oZWFkKSB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICAgIH1cbiAgfVxuXG4gIC51c2JfX2NoZWNrIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDMycHg7XG4gICAgaGVpZ2h0OiAzMnB4O1xuICB9XG5cbiAgLnVzYl9fbmFtZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcblxuICAgICYtLWZvbGRlciB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLnVzYl9fd2hlbiB7XG4gICAgZmxleDogbm9uZTtcbiAgICB3aWR0aDogMTIwcHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAudXNiX19zaXplIHtcbiAgICBmbGV4OiBub25lO1xuICAgIHdpZHRoOiA3MnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICB9XG5cbiAgLnVzYl9fbW9yZSB7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICB9XG5cbiAgLnVzYl9fY291bnQge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB9XG5cbiAgLnVzYl9fZGlhbG9nIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMHB4O1xuICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcblxuICAgIHAge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB9XG4gIH1cblxuICAudXNiX19jaG9pY2Uge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgZ2FwOiAxMHB4O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcblxuICAgIHNwYW4ge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB9XG5cbiAgICBiIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLnVzYl9fZGlhbG9nLWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDhweDtcbiAgfVxuXG4gIC51c2ItLXBob25lIHtcbiAgICAudXNiX19iYXIgLmNidG4ge1xuICAgICAgZmxleDogMSAxIGNhbGMoNTAlIC0gOHB4KTtcbiAgICB9XG5cbiAgICAudXNiX19zaXplIHtcbiAgICAgIHdpZHRoOiA2MHB4O1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3VzYi9Vc2JCcm93c2VyLnZ1ZSJ9