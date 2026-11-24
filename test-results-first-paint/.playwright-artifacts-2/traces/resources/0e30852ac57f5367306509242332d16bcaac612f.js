/* unplugin-vue-components disabled */import __unplugin_components_10 from "/src/components/ui/FrameIcon.vue";
import { VDialog as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_8 from "/src/components/ui/FrameIcon.vue";
import { VIcon as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import JobsMixin, {} from "/src/mixins/jobs.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { EventBus } from "/src/eventBus.ts";
import { fileSize, isGcodeFile, isModelFile, jobTitle, parentFolder, queueLabel, readyChecks } from "/src/services/jobs/model.ts";
import { MODEL_ACCEPT } from "/src/services/slicer-bridge/handover.ts";
import { NO_SELECTION, allSelected, clearSelection, clickRow, keepShown, moveCursor, selectAll, someSelected, toggleRow } from "/src/services/jobs/selection.ts";
import { JOBS_COLUMNS, lastPrinted, layerCountOf, listDuration, materialOf, nextColumnSort, sortDirection, sortListRows } from "/src/services/jobs/list.ts";
import { jobsPage, resetJobsPage, setJobsSort } from "/src/services/jobs/page-state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import FileNameDialog from "/src/components/widgets/filesystem/FileNameDialog.vue";
import JobMenu, {} from "/src/components/jobs/JobMenu.vue";
import JobPicture from "/src/components/jobs/JobPicture.vue";
import { retryFailedThumbnails } from "/src/services/jobs/thumbnail.ts";
import TonePill from "/src/components/printers/TonePill.vue";
import UsbBrowser from "/src/components/usb/UsbBrowser.vue";
import { usb, watchUsb } from "/src/services/usb/state.ts";
let Jobs = class extends Mixins(JobsMixin, BrowserMixin) {
  path = "";
  selectedKey = null;
  folderDialog = false;
  renameRow = null;
  moveRows = null;
  dialogTarget = null;
  /** What's selected, File Explorer's way; the header's toolbar acts on it. */
  sel = NO_SELECTION;
  /** Why the folder's listing failed, until it is asked for again. */
  loadError = "";
  unsubscribe = null;
  /** The USB stick's files are open in place of the printer's (KAN-4815). */
  usbOpen = false;
  stopUsbWatch = null;
  listDuration = listDuration;
  fileSize = fileSize;
  lastPrinted = lastPrinted;
  queueLabel = queueLabel;
  get query() {
    return jobsPage.query;
  }
  /** The printer has the USB routes, and a stick is in (or was just ejected), or the person is already looking at it. */
  get usbShown() {
    if (!usb.supported) return false;
    return this.usbOpen || !!usb.status?.sticks.length || !!usb.status?.ejected.length;
  }
  mounted() {
    this.stopUsbWatch = watchUsb();
    this.usbOpen = this.$route?.query?.view === "usb";
    retryFailedThumbnails();
    const saved = this.$store.getters["files/getCurrentPathByRoot"](this.root) ?? "";
    this.openFolder(saved.startsWith(`${this.root}/`) ? saved.slice(this.root.length + 1) : "");
    this.loadFiles();
    this.publish();
    if (typeof this.$store.subscribeAction !== "function") return;
    this.unsubscribe = this.$store.subscribeAction((action) => {
      if (action.type !== "socket/onSocketError") return;
      const error = action.payload;
      const request = error?.__request__;
      if (request?.method !== "server.files.get_directory" || String(request.params?.path ?? "").split("/")[0] !== this.root) return;
      this.loadError = error?.message || "The printer did not answer.";
    });
  }
  retryLoad() {
    this.loadError = "";
    SocketActions.serverFilesGetDirectory(this.root, this.dir);
  }
  beforeDestroy() {
    this.stopUsbWatch?.();
    this.unsubscribe?.();
    resetJobsPage();
    jobsPage.files = 0;
    jobsPage.free = "";
  }
  // -- the folder that's open ------------------------------------------------
  get dir() {
    return this.path ? `${this.root}/${this.path}` : this.root;
  }
  get dirEntries() {
    return this.$store.getters["files/getDirectory"](this.dir) ?? [];
  }
  get dirLoaded() {
    return !!this.$store.getters["files/getDirectory"](this.dir);
  }
  get parent() {
    return parentFolder(this.path);
  }
  get crumbs() {
    const parts = this.path ? this.path.split("/") : [];
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join("/") }));
  }
  /** The file printing, or a folder with it inside, stays where it is. */
  holds(key) {
    const printing = this.busy ? this.jobFile : "";
    return !!printing && (printing === key || printing.startsWith(`${key}/`));
  }
  get printingTitle() {
    return jobTitle(this.jobFile);
  }
  openFolder(path) {
    if (path !== this.path) {
      this.selectedKey = null;
      this.sel = NO_SELECTION;
    }
    this.path = path;
    this.$store.dispatch("files/updateCurrentPathByRoot", { root: this.root, path: this.dir });
    SocketActions.serverFilesGetDirectory(this.root, this.dir);
  }
  /** A folder's G-code count, once Fluidd has listed it. */
  folderCount(key) {
    const listing = this.$store.state.files.pathFiles[`${this.root}/${key}`];
    if (!listing) return "Folder";
    const n = listing.files.filter((f) => isGcodeFile(f.filename)).length;
    return `${n} ${n === 1 ? "file" : "files"}`;
  }
  // -- the list ----------------------------------------------------------------
  get fileRows() {
    return this.dirEntries.filter((e) => e.type === "file" && isGcodeFile(e.filename)).map((f) => {
      const job = this.toJobFile(f);
      const history = f.history;
      return {
        key: job.path,
        kind: "file",
        name: f.filename,
        title: job.title,
        sub: "",
        modified: f.modified,
        time: f.estimated_time,
        size: f.size,
        filament: f.filament_weight_total || void 0,
        layer: f.layer_height || void 0,
        material: materialOf(f.filament_type),
        lastPrinted: history?.start_time ?? job.print_start_time ?? null,
        printed: job.printed,
        printing: job.printing,
        held: job.printing,
        job
      };
    });
  }
  get folderRows() {
    return this.dirEntries.filter((e) => e.type === "directory" && e.name !== "..").map((d) => ({
      key: this.path ? `${this.path}/${d.dirname}` : d.dirname,
      kind: "folder",
      name: d.dirname,
      title: d.dirname,
      sub: "",
      modified: d.modified,
      size: d.size,
      material: "",
      lastPrinted: null,
      printed: false,
      printing: false,
      held: this.holds(this.path ? `${this.path}/${d.dirname}` : d.dirname)
    }));
  }
  get rows() {
    const q = this.query.trim().toLowerCase();
    const all = [...this.folderRows, ...this.fileRows].filter((r) => !q || r.name.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
    return sortListRows(all, jobsPage.sort, jobsPage.reverse);
  }
  get selectedRow() {
    return this.rows.find((r) => r.key === this.selectedKey && r.kind === "file");
  }
  keepSelection(rows) {
    this.sel = keepShown(this.sel, rows.map((r) => r.key));
    if (this.selectedKey && rows.some((r) => r.key === this.selectedKey)) return;
    if (this.isMobileViewport) {
      this.selectedKey = null;
      return;
    }
    const first = rows.find((r) => r.kind === "file" && !r.printing) ?? rows.find((r) => r.kind === "file");
    this.selectedKey = first?.key ?? null;
  }
  onViewport() {
    this.keepSelection(this.rows);
  }
  publish() {
    jobsPage.files = this.fileRows.length;
    jobsPage.free = this.freeSpace ?? "";
    jobsPage.printerName = this.printerName;
  }
  /** The keys of the rows, in the order shown: what ranges and the arrow keys go by. */
  get order() {
    return this.rows.map((r) => r.key);
  }
  get selection() {
    return this.sel.keys;
  }
  onSel(sel) {
    const row = sel.cursor === null ? void 0 : this.rows.find((r) => r.key === sel.cursor);
    if (row?.kind === "file") this.selectedKey = row.key;
  }
  /**
   * A plain click (or tap) selects that row alone. On a phone, a tap on a
   * folder opens it, and a second tap on the file lets go of it, and the
   * Print bar goes.
   */
  pick(row) {
    if (this.isMobileViewport) {
      if (row.kind === "folder") {
        this.openFolder(row.key);
        return;
      }
      if (this.selectedKey === row.key && this.selection.every((k) => k === row.key)) {
        this.sel = NO_SELECTION;
        this.selectedKey = null;
        return;
      }
    }
    this.sel = clickRow(this.sel, this.order, row.key);
    if (row.kind === "file") this.selectedKey = row.key;
  }
  /** File Explorer's click: plain, Ctrl (Cmd on a Mac), Shift, or Ctrl+Shift. */
  onRowClick(row, event) {
    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl && !event.shiftKey) {
      this.pick(row);
      return;
    }
    this.sel = clickRow(this.sel, this.order, row.key, { ctrl, shift: event.shiftKey });
  }
  /** Shift and Ctrl clicks select rows, not the text in them. */
  onRowMouseDown(event) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) event.preventDefault();
  }
  /** A row's checkbox puts it in or takes it out, as a Ctrl-click does. A phone's Print bar stays as it was. */
  onCheck(row) {
    const next = toggleRow(this.sel, this.order, row.key);
    this.sel = this.isMobileViewport ? { ...next, cursor: this.sel.cursor } : next;
  }
  /** A click on the list where there is no row lets go of everything. */
  onListClick(event) {
    const target = event.target;
    if (!target || target.closest('[data-tid="jobs-row"], [data-tid="jobs-head"], button, input, a, nav, [role="menu"]')) return;
    this.stopSelecting();
  }
  /** Enter or a double-click: a folder opens, a file opens its preview. */
  openRow(row) {
    if (!row) return;
    if (row.kind === "folder") {
      this.openFolder(row.key);
      return;
    }
    this.selectedKey = row.key;
    this.preview(row);
  }
  stopSelecting() {
    this.sel = clearSelection(this.sel);
  }
  // -- the columns -------------------------------------------------------------
  columns = JOBS_COLUMNS;
  get sort() {
    return jobsPage.sort;
  }
  get sortDir() {
    return sortDirection(jobsPage.sort, jobsPage.reverse);
  }
  /** A click on a column header orders by it; a second click turns it round. */
  sortBy(column) {
    const next = nextColumnSort(jobsPage, column);
    setJobsSort(next.sort, next.reverse);
  }
  get selectedRows() {
    return this.rows.filter((r) => this.selection.includes(r.key));
  }
  get selectedFiles() {
    return this.selectedRows.filter((r) => r.job);
  }
  /** What can be moved or deleted: not the file printing, nor a folder holding it. */
  get changeable() {
    return this.selectedRows.filter((r) => !this.holds(r.key));
  }
  get queueable() {
    return this.selectedFiles.filter((r) => !this.holds(r.key));
  }
  get heldCount() {
    return this.selectedRows.length - this.changeable.length;
  }
  get allSelected() {
    return allSelected(this.sel, this.order);
  }
  get someSelected() {
    return someSelected(this.sel, this.order);
  }
  toggleAll() {
    this.sel = this.allSelected ? clearSelection(this.sel) : selectAll(this.sel, this.order);
  }
  publishSelection() {
    jobsPage.selected = this.selectedRows.length;
    jobsPage.changeable = this.changeable.length;
    jobsPage.downloadable = this.selectedFiles.length;
    jobsPage.queueable = this.canQueue ? this.queueable.length : 0;
    jobsPage.heldNote = this.heldCount ? `${this.printingTitle || "The file printing"} is printing, so it stays.` : "";
  }
  onMoveTick() {
    this.moveSelected();
  }
  onDownloadTick() {
    this.downloadSelected();
  }
  onDeleteTick() {
    this.deleteSelected();
  }
  onQueueTick() {
    this.queueSelected();
  }
  onClearTick() {
    this.stopSelecting();
  }
  get moveTick() {
    return jobsPage.moveTick;
  }
  get downloadTick() {
    return jobsPage.downloadTick;
  }
  get deleteTick() {
    return jobsPage.deleteTick;
  }
  get queueTick() {
    return jobsPage.queueTick;
  }
  get clearTick() {
    return jobsPage.clearTick;
  }
  async queueSelected() {
    if (!this.controlReady || !this.canQueue) return;
    const paths = this.queueable.map((r) => r.key);
    if (!paths.length) return;
    await SocketActions.serverJobQueuePostJob(paths);
    this.stopSelecting();
  }
  downloadSelected() {
    for (const row of this.selectedFiles) if (row.job) this.downloadJob(row.job);
  }
  moveSelected() {
    this.dialogTarget = this.commandTarget;
    this.moveRows = this.changeable;
  }
  async deleteSelected() {
    if (!this.controlReady) return;
    const rows = this.changeable.filter((r) => !this.holds(r.key));
    if (!rows.length) return;
    if (rows.length === 1) {
      await this.removeRow(rows[0]);
      return;
    }
    const files = rows.filter((r) => r.kind === "file").length;
    const folders = rows.length - files;
    const what = [
      files ? `${files} ${files === 1 ? "file" : "files"}` : "",
      folders ? `${folders} ${folders === 1 ? "folder" : "folders"}` : ""
    ].filter(Boolean).join(" and ");
    const name = rows.length === 1 ? rows[0].name : what;
    const note = folders ? " A folder goes with everything in it." : "";
    const target = this.commandTarget;
    const ok = await this.$confirm(`It's removed from ${this.printerName}.${note} This can't be undone.`, { title: `Delete ${name}?`, buttonTrueText: "Delete", danger: true });
    if (!ok || target !== this.commandTarget || !this.controlReady) return;
    for (const row of rows) {
      if (this.holds(row.key)) continue;
      if (row.kind === "folder") SocketActions.serverFilesDeleteDirectory(`${this.root}/${row.key}`, true);
      else SocketActions.serverFilesDeleteFile(`${this.root}/${row.key}`);
    }
    this.stopSelecting();
  }
  clearSearch() {
    jobsPage.query = "";
  }
  /**
   * File Explorer's keys, only while the list itself has the focus: the
   * arrows (and Home, End) move, with Shift they select the range, Ctrl+A
   * selects all, Space puts the row in or out, Escape lets go.
   */
  onKey(event) {
    if (event.target !== this.$refs.rows) return;
    const order = this.order;
    const mods = { ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey };
    const go = (by, to) => {
      this.sel = moveCursor(this.sel, order, by, mods, to);
      const key = this.sel.cursor;
      if (key === null) return;
      this.$nextTick(() => {
        const rows = Array.from(this.$el.querySelectorAll("[data-key]"));
        rows.find((el) => el.dataset.key === key)?.scrollIntoView?.({ block: "nearest" });
      });
    };
    switch (event.key) {
      case "ArrowDown":
        go(1);
        break;
      case "ArrowUp":
        go(-1);
        break;
      case "Home":
        go(0, 0);
        break;
      case "End":
        go(0, order.length - 1);
        break;
      case "a":
      case "A":
        if (!mods.ctrl || mods.shift) return;
        this.sel = selectAll(this.sel, order);
        break;
      case "Delete":
        if (this.selection.length) this.deleteSelected();
        else if (this.selectedRow) this.removeRow(this.selectedRow);
        break;
      case "Enter":
        this.openRow(this.rows.find((r) => r.key === this.sel.cursor) ?? this.selectedRow);
        break;
      case " ":
        if (this.sel.cursor === null) return;
        this.sel = toggleRow(this.sel, order, this.sel.cursor);
        break;
      case "Escape":
        if (!this.selection.length) return;
        this.stopSelecting();
        break;
      case "Backspace":
        if (this.path) this.openFolder(this.parent);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  // -- the picked file ---------------------------------------------------------
  get stats() {
    const job = this.selectedRow?.job;
    if (!job) return [];
    const f = job.file;
    const layers = layerCountOf(f);
    const material = materialOf(f.filament_type);
    return [
      { label: "Print time", value: listDuration(f.estimated_time) },
      { label: "Material", value: material || "\u2014", dot: !!material },
      { label: "Filament", value: f.filament_weight_total ? `${f.filament_weight_total.toFixed(1)} g` : "\u2014" },
      { label: layers && f.layer_height ? `Layers at ${f.layer_height} mm` : "Layers", value: layers ? String(layers) : "\u2014" }
    ];
  }
  /** What to know before it prints: the checks that aren't fine. */
  get warnings() {
    const job = this.selectedRow?.job;
    if (!job) return [];
    return readyChecks(job.file, job.filename, this.loadedFilament, this.printerName, this.busy).filter((c) => !c.ok && !c.text.endsWith("it can go next in the queue")).map((c) => c.text);
  }
  canStart(row) {
    if (!row.job || !this.controlReady) return false;
    if (row.printing) return false;
    return !this.busy || this.canQueue;
  }
  printLabel(row) {
    if (row.printing) return "Printing now";
    return this.busy && this.canQueue ? "Add to queue" : "Print";
  }
  async printRow(row) {
    if (!row.job || !this.canStart(row)) return;
    await this.printOrQueue(row.job);
  }
  async preview(row) {
    const job = row.job;
    if (!job) return;
    try {
      const response = await this.getGcode(job.file);
      const gcode = response?.data;
      if (!gcode) return;
      this.$router.push({ path: scopedPath("/preview", activeSlug()) }).catch(() => {
      });
      this.$store.dispatch("gcodePreview/loadGcode", { file: job.file, gcode });
    } catch (error) {
      consola.error("[Jobs] preview gcode", error);
    }
  }
  act(action, row) {
    this.dialogTarget = this.commandTarget;
    switch (action) {
      case "print":
        this.printRow(row);
        break;
      case "queue":
        if (row.job) this.addToQueue(row.job);
        break;
      case "preview":
        this.preview(row);
        break;
      case "download":
        if (row.job) this.downloadJob(row.job);
        break;
      case "rename":
        this.renameRow = row;
        break;
      case "move":
        this.moveRows = [row];
        break;
      case "delete":
        this.removeRow(row);
        break;
    }
  }
  // -- changing files ----------------------------------------------------------
  async removeRow(row) {
    if (!this.controlReady || this.holds(row.key)) return;
    if (row.kind === "file" && row.job) {
      await this.removeJob(row.job);
      return;
    }
    const target = this.commandTarget;
    const ok = await this.$confirm(`It's removed from ${this.printerName}. A folder goes with everything in it. This can't be undone.`, { title: `Delete ${row.name}?`, buttonTrueText: "Delete", danger: true });
    if (!ok || target !== this.commandTarget || !this.controlReady || this.holds(row.key)) return;
    SocketActions.serverFilesDeleteDirectory(`${this.root}/${row.key}`, true);
  }
  rename(name) {
    const row = this.renameRow;
    this.renameRow = null;
    if (!row || !this.controlReady || this.dialogTarget !== this.commandTarget || this.holds(row.key)) return;
    const clean = name.trim();
    if (!clean || clean === row.name) return;
    SocketActions.serverFilesMove(`${this.root}/${row.key}`, `${this.dir}/${clean}`);
  }
  /** Where the rows can go: every folder Fluidd has listed, less where they are and the folders being moved. */
  get moveTargets() {
    const rows = this.moveRows;
    if (!rows) return [];
    const known = Object.keys(this.$store.state.files.pathFiles).filter((p) => p === this.root || p.startsWith(`${this.root}/`)).map((p) => p === this.root ? "" : p.slice(this.root.length + 1));
    const here = this.folderRows.map((r) => r.key);
    const moving = rows.filter((r) => r.kind === "folder").map((r) => r.key);
    return [.../* @__PURE__ */ new Set([...known, ...here, this.parent])].filter((f) => f !== this.path && !moving.some((m) => f === m || f.startsWith(`${m}/`))).sort((a, b) => a.localeCompare(b));
  }
  moveInto(folder) {
    const rows = this.moveRows;
    this.moveRows = null;
    if (!rows || !this.controlReady || this.dialogTarget !== this.commandTarget) return;
    for (const row of rows) {
      if (!this.controlReady || this.dialogTarget !== this.commandTarget) return;
      if (this.holds(row.key)) continue;
      SocketActions.serverFilesMove(`${this.root}/${row.key}`, `${this.root}/${folder ? `${folder}/` : ""}${row.name}`);
    }
    this.stopSelecting();
  }
  makeFolder(name) {
    if (!this.controlReady) return;
    const clean = name.trim();
    if (clean) SocketActions.serverFilesPostDirectory(`${this.dir}/${clean}`);
  }
  onCommandTarget() {
    this.selectedKey = null;
    this.renameRow = null;
    this.moveRows = null;
    this.folderDialog = false;
    this.dialogTarget = null;
    this.stopSelecting();
    this.openFolder("");
  }
  onFolderTick() {
    if (this.controlReady) this.folderDialog = true;
  }
  get folderTick() {
    return jobsPage.folderTick;
  }
  // -- upload ------------------------------------------------------------------
  get uploadTick() {
    return jobsPage.uploadTick;
  }
  onUploadTick() {
    this.pickUpload();
  }
  /** The root's own list, and on the G-code root the models Slice opens (KAN-2191). */
  get gcodeAccept() {
    const root = this.$store.getters["files/getRootProperties"](this.root);
    return [...root?.accepts ?? [], ...this.root === "gcodes" ? MODEL_ACCEPT : []].join(",");
  }
  pickUpload() {
    if (!this.controlReady) return;
    this.$refs.upload.click();
  }
  /** Uploads go into the folder that's open; one G-code file on its own is offered to print. */
  async onPicked(event) {
    const input = event.target;
    const picked = [...input.files ?? []];
    input.value = "";
    if (!this.controlReady || !picked.length) return;
    const models = this.root === "gcodes" ? picked.filter((f) => isModelFile(f.name)) : [];
    if (models.length) EventBus.bus.$emit("model-dropped", models);
    const files = picked.filter((f) => !models.includes(f));
    if (!files.length) return;
    const target = this.commandTarget;
    const path = this.path;
    const stillCurrent = () => target === this.commandTarget && this.controlReady;
    const uploaded = await this.uploadFiles(files, path, this.root, false, stillCurrent);
    if (uploaded === false || !stillCurrent()) {
      EventBus.$emit("Stopped: the printer changed", { type: "warning", timeout: 5e3 });
      return;
    }
    const filepath = path ? `${path}/${files[0].name}` : files[0].name;
    if (files.length === 1 && isGcodeFile(files[0].name) && uploaded.includes(filepath)) {
      EventBus.bus.$emit("job-ready", filepath);
    }
  }
  // -- the queue ---------------------------------------------------------------
  fileFor(filename) {
    return this.jobFiles.find((j) => j.path === filename);
  }
  thumbnailOf(filename) {
    return this.fileFor(filename)?.thumbnail ?? "";
  }
  thumbnailKeyOf(filename) {
    return this.fileFor(filename)?.thumbnailKey ?? "";
  }
  titleOf(filename) {
    return jobTitle(filename);
  }
  factsOf(filename) {
    return this.fileFor(filename)?.facts ?? "";
  }
  unqueue(job) {
    if (!this.controlReady) return;
    SocketActions.serverJobQueueDeleteJobs([job.job_id]);
  }
  async clearQueue() {
    if (!this.controlReady) return;
    const target = this.commandTarget;
    const jobs = this.queue.map((j) => j.job_id);
    const ok = await this.$confirm(`The files stay on ${this.printerName}.`, { title: `Take all ${jobs.length} jobs out of the queue?`, buttonTrueText: "Clear the queue", danger: true });
    if (ok && target === this.commandTarget && this.controlReady) SocketActions.serverJobQueueDeleteJobs(jobs);
  }
  startQueue() {
    if (this.controlReady) SocketActions.serverJobQueueStart();
  }
  async moveQueued(job, by) {
    if (!this.controlReady) return;
    const jobs = [...this.queue];
    const from = jobs.findIndex((item) => item.job_id === job.job_id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= jobs.length) return;
    jobs.splice(to, 0, jobs.splice(from, 1)[0]);
    await SocketActions.serverJobQueuePostJob(jobs.map((item) => item.filename), true);
  }
};
__decorateClass([
  Watch("rows")
], Jobs.prototype, "keepSelection", 1);
__decorateClass([
  Watch("isMobileViewport")
], Jobs.prototype, "onViewport", 1);
__decorateClass([
  Watch("fileRows"),
  Watch("freeSpace"),
  Watch("printerName")
], Jobs.prototype, "publish", 1);
__decorateClass([
  Watch("sel")
], Jobs.prototype, "onSel", 1);
__decorateClass([
  Watch("selectedRows", { immediate: true }),
  Watch("canQueue")
], Jobs.prototype, "publishSelection", 1);
__decorateClass([
  Watch("moveTick")
], Jobs.prototype, "onMoveTick", 1);
__decorateClass([
  Watch("downloadTick")
], Jobs.prototype, "onDownloadTick", 1);
__decorateClass([
  Watch("deleteTick")
], Jobs.prototype, "onDeleteTick", 1);
__decorateClass([
  Watch("queueTick")
], Jobs.prototype, "onQueueTick", 1);
__decorateClass([
  Watch("clearTick")
], Jobs.prototype, "onClearTick", 1);
__decorateClass([
  Watch("commandTarget")
], Jobs.prototype, "onCommandTarget", 1);
__decorateClass([
  Watch("folderTick")
], Jobs.prototype, "onFolderTick", 1);
__decorateClass([
  Watch("uploadTick")
], Jobs.prototype, "onUploadTick", 1);
Jobs = __decorateClass([
  Component({ components: { FileNameDialog, JobMenu, JobPicture, TonePill, UsbBrowser } })
], Jobs);
const _sfc_main = Jobs;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "jobs", class: { "jobs--phone": _vm.isMobileViewport }, attrs: { "data-tid": "jobs-page" } }, [_vm.queue.length ? _c("section", { staticClass: "jobs__next", attrs: { "data-tid": "jobs-up-next" } }, [_c("div", { staticClass: "jobs__next-head" }, [_c("h2", [_vm._v("Up next")]), _c("span", { staticClass: "jobs__count" }, [_vm._v(_vm._s(_vm.queue.length))]), _c("span", { staticClass: "jobs__hint" }, [_vm._v("Starts when the plate is lifted off and put back")]), _c("button", { staticClass: "jobs__link", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "jobs-queue-start" }, on: { "click": _vm.startQueue } }, [_vm._v(" Start ")]), _vm.queue.length > 1 ? _c("button", { staticClass: "jobs__link", attrs: { "type": "button", "data-tid": "jobs-queue-clear", "disabled": !_vm.controlReady }, on: { "click": _vm.clearQueue } }, [_vm._v(" Clear ")]) : _vm._e()]), _c("div", { staticClass: "jobs__next-list" }, _vm._l(_vm.queue, function(queued) {
    return _c("div", { key: queued.job_id, staticClass: "jobs__queued" }, [_c("span", { staticClass: "jobs__thumb jobs__thumb--small" }, [_c("job-picture", { attrs: { "src": _vm.thumbnailOf(queued.filename), "thumb-key": _vm.thumbnailKeyOf(queued.filename) } })], 1), _c("span", { staticClass: "jobs__queued-text" }, [_c("b", [_vm._v(_vm._s(_vm.titleOf(queued.filename)))]), _c("span", [_vm._v(_vm._s(_vm.factsOf(queued.filename)))])]), _vm.queue.length > 1 ? _c("button", { staticClass: "jobs__unqueue", attrs: { "type": "button", "disabled": !_vm.controlReady || queued === _vm.queue[0], "aria-label": `Move ${_vm.titleOf(queued.filename)} earlier` }, on: { "click": function($event) {
      return _vm.moveQueued(queued, -1);
    } } }, [_vm._v(" \u2191 ")]) : _vm._e(), _vm.queue.length > 1 ? _c("button", { staticClass: "jobs__unqueue", attrs: { "type": "button", "disabled": !_vm.controlReady || queued === _vm.queue[_vm.queue.length - 1], "aria-label": `Move ${_vm.titleOf(queued.filename)} later` }, on: { "click": function($event) {
      return _vm.moveQueued(queued, 1);
    } } }, [_vm._v(" \u2193 ")]) : _vm._e(), _c("button", { staticClass: "jobs__unqueue", attrs: { "type": "button", "aria-label": `Take ${_vm.titleOf(queued.filename)} out of the queue`, "disabled": !_vm.controlReady }, on: { "click": function($event) {
      return _vm.unqueue(queued);
    } } }, [_c(__unplugin_components_0, { attrs: { "name": "x", "small": "" } })], 1)]);
  }), 0)]) : _vm._e(), !_vm.controlReady ? _c("p", { staticClass: "jobs__readonly", attrs: { "data-tid": "jobs-readonly" } }, [_vm._v(" " + _vm._s(_vm.printerName) + " isn't taking commands right now, so Print, Upload, Rename and Delete are off. You can still look through its files. ")]) : _vm._e(), _vm.usbShown ? _c("nav", { staticClass: "jobs__source", attrs: { "aria-label": "Where the files are", "data-tid": "jobs-source" } }, [_c("button", { attrs: { "type": "button", "aria-pressed": !_vm.usbOpen, "data-tid": "jobs-source-printer" }, on: { "click": function($event) {
    _vm.usbOpen = false;
  } } }, [_vm._v(" " + _vm._s(_vm.printerName) + " ")]), _c("button", { attrs: { "type": "button", "aria-pressed": _vm.usbOpen, "data-tid": "jobs-source-usb" }, on: { "click": function($event) {
    _vm.usbOpen = true;
  } } }, [_vm._v(" USB ")])]) : _vm._e(), _vm.usbOpen && _vm.usbShown ? _c("usb-browser", { attrs: { "control-ready": _vm.controlReady } }) : _c("div", { staticClass: "jobs__grid" }, [_c("section", { staticClass: "jobs__list", attrs: { "data-tid": "jobs-list" }, on: { "click": _vm.onListClick } }, [_vm.path ? _c("nav", { staticClass: "jobs__crumbs", attrs: { "aria-label": "Folder" } }, [_c("button", { attrs: { "type": "button", "data-tid": "jobs-crumb" }, on: { "click": function($event) {
    return _vm.openFolder("");
  } } }, [_vm._v(" gcodes ")]), _vm._l(_vm.crumbs, function(crumb) {
    return [_c("span", { key: `slash-${crumb.path}`, attrs: { "aria-hidden": "true" } }, [_vm._v("/")]), _c("button", { key: crumb.path, attrs: { "type": "button", "data-tid": "jobs-crumb", "disabled": crumb.path === _vm.path }, on: { "click": function($event) {
      return _vm.openFolder(crumb.path);
    } } }, [_vm._v(" " + _vm._s(crumb.name) + " ")])];
  })], 2) : _vm._e(), !_vm.dirLoaded && _vm.loadError ? _c("div", { staticClass: "jobs__empty", attrs: { "role": "alert", "data-tid": "jobs-error" } }, [_c("span", { staticClass: "jobs__empty-icon" }, [_c(__unplugin_components_1, { attrs: { "name": "jobs" } })], 1), _c("b", [_vm._v("Couldn't load the files on " + _vm._s(_vm.printerName))]), _c("span", [_vm._v(_vm._s(_vm.loadError))]), _vm.socketConnected ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "jobs-retry" }, on: { "click": _vm.retryLoad } }, [_vm._v(" Try again ")]) : _vm._e()]) : !_vm.dirLoaded ? _c("div", { staticClass: "jobs__skeleton", attrs: { "data-tid": "jobs-loading", "aria-busy": "true" } }, _vm._l(5, function(n) {
    return _c("div", { key: n, staticClass: "jobs__skeleton-row" });
  }), 0) : !_vm.rows.length ? _c("div", { staticClass: "jobs__empty", attrs: { "data-tid": "jobs-empty" } }, [_c("span", { staticClass: "jobs__empty-icon" }, [_c(__unplugin_components_2, { attrs: { "name": "jobs" } })], 1), _c("b", [_vm._v(_vm._s(_vm.query ? `Nothing matches \u201C${_vm.query}\u201D` : _vm.path ? "This folder is empty" : "No G-code on the printer yet"))]), _c("span", [_vm._v(_vm._s(_vm.query ? "Try another name, or clear the search." : "Upload a file, or slice one in Slice."))]), _vm.query ? _c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": _vm.clearSearch } }, [_vm._v(" Clear search ")]) : _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "jobs-empty-upload" }, on: { "click": _vm.pickUpload } }, [_c(__unplugin_components_3, { attrs: { "name": "upload", "small": "" } }), _vm._v(" Upload a file ")], 1)]) : [_c("div", { staticClass: "jobs__row jobs__row--head", attrs: { "role": "group", "aria-label": "Sort the list", "data-tid": "jobs-head" } }, [_c("span", { staticClass: "jobs__head-name" }, [_c("input", { staticClass: "jobs__box", attrs: { "type": "checkbox", "aria-label": "Select all", "data-tid": "jobs-select-all" }, domProps: { "checked": _vm.allSelected, "indeterminate": _vm.someSelected }, on: { "click": function($event) {
    $event.stopPropagation();
  }, "change": _vm.toggleAll } }), _vm._l(_vm.columns.slice(0, 1), function(col) {
    return _c("button", { key: col.value, staticClass: "jobs__sort", class: { "jobs__sort--on": _vm.sort === col.value }, attrs: { "type": "button", "aria-pressed": _vm.sort === col.value ? "true" : "false", "data-sort": _vm.sort === col.value ? _vm.sortDir : null, "data-tid": `jobs-col-${col.value}` }, on: { "click": function($event) {
      return _vm.sortBy(col.value);
    } } }, [_vm._v(" " + _vm._s(col.label)), _vm.sort === col.value ? _c("span", { staticClass: "jobs__arrow", attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.sortDir === "asc" ? "\u2191" : "\u2193"))]) : _vm._e(), _vm.sort === col.value ? _c("span", { staticClass: "jobs__sr" }, [_vm._v(", sorted " + _vm._s(_vm.sortDir === "asc" ? "ascending" : "descending"))]) : _vm._e()]);
  })], 2), _vm._l(_vm.columns.slice(1), function(col) {
    return _c("button", { key: col.value, staticClass: "jobs__sort", class: { "jobs__sort--on": _vm.sort === col.value }, attrs: { "type": "button", "aria-pressed": _vm.sort === col.value ? "true" : "false", "data-sort": _vm.sort === col.value ? _vm.sortDir : null, "data-tid": `jobs-col-${col.value}` }, on: { "click": function($event) {
      return _vm.sortBy(col.value);
    } } }, [_vm._v(" " + _vm._s(col.label)), _vm.sort === col.value ? _c("span", { staticClass: "jobs__arrow", attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.sortDir === "asc" ? "\u2191" : "\u2193"))]) : _vm._e(), _vm.sort === col.value ? _c("span", { staticClass: "jobs__sr" }, [_vm._v(", sorted " + _vm._s(_vm.sortDir === "asc" ? "ascending" : "descending"))]) : _vm._e()]);
  }), !_vm.isMobileViewport ? _c("span") : _vm._e()], 2), _c("div", { ref: "rows", staticClass: "jobs__rows", attrs: { "role": "listbox", "aria-multiselectable": "true", "tabindex": "0", "aria-label": "Files on the printer", "data-tid": "jobs-rows" }, on: { "keydown": _vm.onKey } }, _vm._l(_vm.rows, function(row) {
    return _c("div", { key: row.key, staticClass: "jobs__row", class: { "jobs__row--sel": _vm.selection.includes(row.key), "jobs__row--cursor": _vm.sel.cursor === row.key, "jobs__row--now": row.printing }, attrs: { "role": "option", "aria-selected": _vm.selection.includes(row.key) ? "true" : "false", "data-key": row.key, "data-tid": "jobs-row" }, on: { "mousedown": _vm.onRowMouseDown, "click": function($event) {
      return _vm.onRowClick(row, $event);
    }, "dblclick": function($event) {
      return _vm.openRow(row);
    } } }, [_c("span", { staticClass: "jobs__name" }, [_c("input", { staticClass: "jobs__box", attrs: { "type": "checkbox", "aria-label": `Select ${row.title}`, "data-tid": "jobs-row-check" }, domProps: { "checked": _vm.selection.includes(row.key) }, on: { "click": function($event) {
      $event.stopPropagation();
    }, "dblclick": function($event) {
      $event.stopPropagation();
    }, "change": function($event) {
      return _vm.onCheck(row);
    } } }), _c("span", { staticClass: "jobs__thumb", class: { "jobs__thumb--folder": row.kind === "folder" } }, [row.kind === "folder" ? _c(__unplugin_components_4, { attrs: { "name": "files" } }) : row.job ? _c("job-picture", { attrs: { "src": row.job.thumbnail, "thumb-key": row.job.thumbnailKey } }) : _vm._e()], 1), _c("span", { staticClass: "jobs__name-text" }, [_c("b", { attrs: { "title": row.name } }, [_vm._v(_vm._s(row.title))]), _vm.isMobileViewport ? [row.kind === "folder" ? _c("span", { staticClass: "jobs__sub" }, [_vm._v(_vm._s(_vm.folderCount(row.key)))]) : _c("span", { staticClass: "jobs__sub" }, [row.material ? _c("i", { staticClass: "jobs__dot" }) : _vm._e(), _vm._v(_vm._s([row.material, row.printing ? _vm.leftText || "Printing now" : _vm.listDuration(row.time), _vm.fileSize(row.size)].filter(Boolean).join(" \xB7 ")) + " ")]), row.printing ? _c("span", { staticClass: "jobs__bar" }, [_c("i", { style: { width: `${Math.min(100, _vm.progress)}%` } })]) : _vm._e()] : row.printing ? _c("span", { staticClass: "jobs__sub" }, [_c("router-link", { staticClass: "jobs__printing-link", attrs: { "to": _vm.pagePath("/"), "data-tid": "jobs-printing-link" }, nativeOn: { "click": function($event) {
      $event.stopPropagation();
    } } }, [_c("tone-pill", { attrs: { "tone": "run" } }, [_vm._v(_vm._s(_vm.printerPaused ? "Paused" : "Printing now") + " \xB7 " + _vm._s(Math.floor(_vm.progress)) + "%")])], 1)], 1) : row.sub ? _c("span", { staticClass: "jobs__sub" }, [_vm._v(_vm._s(row.sub))]) : _vm._e()], 2)]), !_vm.isMobileViewport ? [_c("span", { staticClass: "jobs__cell" }, [row.kind === "file" && row.material ? [_c("i", { staticClass: "jobs__dot" }), _vm._v(_vm._s(row.material))] : _vm._e()], 2), _c("span", { staticClass: "jobs__cell" }, [_vm._v(_vm._s(row.kind === "folder" ? "" : row.printing ? _vm.leftText || "Printing" : _vm.listDuration(row.time)))]), _c("span", { staticClass: "jobs__cell" }, [_vm._v(_vm._s(row.kind === "folder" ? _vm.folderCount(row.key) : _vm.fileSize(row.size)))]), _c("span", { staticClass: "jobs__cell" }, [_vm._v(_vm._s(row.kind === "folder" ? "" : row.printing ? _vm.startedAt ? `Started ${_vm.startedAt}` : "Now" : _vm.lastPrinted(row.lastPrinted, row.printed)))])] : _vm._e(), _c("span", { staticClass: "jobs__end" }, [row.printing && _vm.isMobileViewport ? _c("router-link", { staticClass: "jobs__pct", attrs: { "to": _vm.pagePath("/"), "data-tid": "jobs-printing-link" }, nativeOn: { "click": function($event) {
      $event.stopPropagation();
    } } }, [_vm._v(" " + _vm._s(Math.floor(_vm.progress)) + "% ")]) : _vm._e(), _vm.isMobileViewport && _vm.selectedKey === row.key && row.kind === "file" ? _c(__unplugin_components_5, { staticClass: "jobs__check", attrs: { "name": "check" } }) : _c("job-menu", { attrs: { "kind": row.kind, "label": row.title, "printing": row.held, "queueing": _vm.busy && _vm.canQueue, "locked": !_vm.controlReady }, on: { "action": function($event) {
      return _vm.act($event, row);
    } } })], 1)], 2);
  }), 0)]], 2), !_vm.isMobileViewport && _vm.selectedRow && _vm.selectedRow.job ? _c("aside", { staticClass: "jobs__detail", attrs: { "data-tid": "jobs-detail" } }, [_c("div", { staticClass: "jobs__detail-head" }, [_c(__unplugin_components_6, { attrs: { "name": "files" } }), _c("b", { attrs: { "title": _vm.selectedRow.job.filename } }, [_vm._v(_vm._s(_vm.selectedRow.title))]), _c("job-menu", { attrs: { "kind": "file", "no-print": "", "no-preview": "", "label": _vm.selectedRow.title, "printing": _vm.selectedRow.printing, "locked": !_vm.controlReady }, on: { "action": function($event) {
    return _vm.act($event, _vm.selectedRow);
  } } })], 1), _c("div", { staticClass: "jobs__picture" }, [_c("job-picture", { attrs: { "src": _vm.selectedRow.job.thumbnail, "thumb-key": _vm.selectedRow.job.thumbnailKey, "large": "" } })], 1), _c("p", { staticClass: "jobs__filename" }, [_vm._v(" " + _vm._s(_vm.selectedRow.job.filename) + " ")]), _c("dl", { staticClass: "jobs__stats" }, _vm._l(_vm.stats, function(stat) {
    return _c("div", { key: stat.label }, [_c("dt", [_vm._v(_vm._s(stat.label))]), _c("dd", [stat.dot ? _c("i", { staticClass: "jobs__dot" }) : _vm._e(), _vm._v(_vm._s(stat.value) + " ")])]);
  }), 0), _vm.warnings.length ? _c("ul", { staticClass: "jobs__warnings", attrs: { "data-tid": "jobs-warnings" } }, _vm._l(_vm.warnings, function(warning) {
    return _c("li", { key: warning }, [_c(__unplugin_components_7, { staticClass: "jobs__warning-icon", attrs: { "x-small": "" } }, [_vm._v(" $warning ")]), _vm._v(" " + _vm._s(warning) + " ")], 1);
  }), 0) : _vm._e(), _c("div", { staticClass: "jobs__actions" }, [_c("button", { staticClass: "cbtn cbtn--primary jobs__print", attrs: { "type": "button", "disabled": !_vm.canStart(_vm.selectedRow), "data-tid": "jobs-print" }, on: { "click": function($event) {
    return _vm.printRow(_vm.selectedRow);
  } } }, [_vm._v(" " + _vm._s(_vm.printLabel(_vm.selectedRow)) + " ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "jobs-preview" }, on: { "click": function($event) {
    return _vm.preview(_vm.selectedRow);
  } } }, [_c(__unplugin_components_8, { attrs: { "name": "eye", "small": "" } }), _vm._v(" Preview ")], 1)])]) : _vm._e()]), _vm.isMobileViewport && _vm.selectedRow && _vm.selectedRow.job ? _c("div", { staticClass: "jobs__sticky", attrs: { "data-tid": "jobs-sticky" } }, [_c("button", { staticClass: "cbtn cbtn--primary jobs__print", attrs: { "type": "button", "disabled": !_vm.canStart(_vm.selectedRow), "data-tid": "jobs-print" }, on: { "click": function($event) {
    return _vm.printRow(_vm.selectedRow);
  } } }, [_vm._v(" " + _vm._s(_vm.printLabel(_vm.selectedRow)) + " " + _vm._s(_vm.selectedRow.printing ? "" : _vm.selectedRow.title) + " ")]), _c("job-menu", { attrs: { "kind": "file", "button": "", "no-print": "", "label": _vm.selectedRow.title, "printing": _vm.selectedRow.printing, "queueing": false, "locked": !_vm.controlReady }, on: { "action": function($event) {
    return _vm.act($event, _vm.selectedRow);
  } } })], 1) : _vm._e(), _c("input", { ref: "upload", staticClass: "jobs__upload", attrs: { "type": "file", "multiple": "", "accept": _vm.gcodeAccept, "data-tid": "jobs-upload-input" }, on: { "change": _vm.onPicked } }), _vm.folderDialog ? _c("file-name-dialog", { attrs: { "title": "New folder", "label": `In ${_vm.path ? `${_vm.path}/` : "gcodes/"}`, "name": "" }, on: { "save": _vm.makeFolder }, model: { value: _vm.folderDialog, callback: function($$v) {
    _vm.folderDialog = $$v;
  }, expression: "folderDialog" } }) : _vm._e(), _vm.renameRow ? _c("file-name-dialog", { attrs: { "value": true, "title": _vm.renameRow.kind === "folder" ? "Rename the folder" : "Rename the file", "label": "Name", "name": _vm.renameRow.name }, on: { "input": function($event) {
    _vm.renameRow = null;
  }, "save": _vm.rename } }) : _vm._e(), _c(__unplugin_components_9, { attrs: { "value": !!_vm.moveRows, "max-width": "420" }, on: { "input": function($event) {
    _vm.moveRows = null;
  } } }, [_vm.moveRows ? _c("div", { staticClass: "jobs__move", attrs: { "data-tid": "jobs-move-dialog" } }, [_c("h3", [_vm._v("Move " + _vm._s(_vm.moveRows.length === 1 ? _vm.moveRows[0].title : `${_vm.moveRows.length} items`) + " to")]), _vm._l(_vm.moveTargets, function(folder) {
    return _c("button", { key: folder, staticClass: "jobs__move-to", attrs: { "type": "button" }, on: { "click": function($event) {
      return _vm.moveInto(folder);
    } } }, [_c(__unplugin_components_10, { attrs: { "name": "files", "small": "" } }), _vm._v(" " + _vm._s(folder ? `gcodes/${folder}/` : "gcodes/") + " ")], 1);
  }), !_vm.moveTargets.length ? _c("p", { staticClass: "jobs__note" }, [_vm._v(" No other folder yet. Make one with New folder first. ")]) : _vm._e(), _c("div", { staticClass: "jobs__move-actions" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    _vm.moveRows = null;
  } } }, [_vm._v(" Cancel ")])])], 2) : _vm._e()])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Jobs.vue?vue&type=style&index=0&scoped=ac62e3c5&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ac62e3c5",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Jobs.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBa0NBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBSUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBSUE7QUFDQSwyQkFDQSw0REFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0EsMkJBQ0EseURBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBLHVEQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBTUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUlBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFBQSxVQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUFBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxpQkFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQSxpR0FDQSx3RUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUFBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsTUFDQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBLGlFQUNBLGdFQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUNBLHdGQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUlBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFoaEJBO0FBQUEsRUFEQTtBQUFBLEdBL0tBLEtBZ0xBO0FBWUE7QUFBQSxFQURBO0FBQUEsR0EzTEEsS0E0TEE7QUFRQTtBQUFBLEVBSEE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEdBbk1BLEtBb01BO0FBaUJBO0FBQUEsRUFEQTtBQUFBLEdBcE5BLEtBcU5BO0FBMkhBO0FBQUEsRUFGQTtBQUFBLEVBQ0E7QUFBQSxHQS9VQSxLQWdWQTtBQVNBO0FBQUEsRUFEQTtBQUFBLEdBeFZBLEtBeVZBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0EzVkEsS0E0VkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQTlWQSxLQStWQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBaldBLEtBa1dBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FwV0EsS0FxV0E7QUE2T0E7QUFBQSxFQURBO0FBQUEsR0FqbEJBLEtBa2xCQTtBQVdBO0FBQUEsRUFEQTtBQUFBLEdBNWxCQSxLQTZsQkE7QUFXQTtBQUFBLEVBREE7QUFBQSxHQXZtQkEsS0F3bUJBO0FBeG1CQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJKb2JzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDwhLS0gVGhlIGZpbGVzIG9uIHRoZSBwcmludGVyIGFzIG9uZSBsaXN0LCBhbmQgdGhlIG9uZSB0aGF0J3MgcGlja2VkIGJlc2lkZSBpdC4gLS0+XG4gIDxkaXZcbiAgICBjbGFzcz1cImpvYnNcIlxuICAgIDpjbGFzcz1cInsgJ2pvYnMtLXBob25lJzogaXNNb2JpbGVWaWV3cG9ydCB9XCJcbiAgICBkYXRhLXRpZD1cImpvYnMtcGFnZVwiXG4gID5cbiAgICA8c2VjdGlvblxuICAgICAgdi1pZj1cInF1ZXVlLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cImpvYnNfX25leHRcIlxuICAgICAgZGF0YS10aWQ9XCJqb2JzLXVwLW5leHRcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJqb2JzX19uZXh0LWhlYWRcIj5cbiAgICAgICAgPGgyPlVwIG5leHQ8L2gyPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImpvYnNfX2NvdW50XCI+e3sgcXVldWUubGVuZ3RoIH19PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImpvYnNfX2hpbnRcIj5TdGFydHMgd2hlbiB0aGUgcGxhdGUgaXMgbGlmdGVkIG9mZiBhbmQgcHV0IGJhY2s8L3NwYW4+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnNfX2xpbmtcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1xdWV1ZS1zdGFydFwiXG4gICAgICAgICAgQGNsaWNrPVwic3RhcnRRdWV1ZVwiXG4gICAgICAgID5cbiAgICAgICAgICBTdGFydFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtaWY9XCJxdWV1ZS5sZW5ndGggPiAxXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnNfX2xpbmtcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1xdWV1ZS1jbGVhclwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgQGNsaWNrPVwiY2xlYXJRdWV1ZVwiXG4gICAgICAgID5cbiAgICAgICAgICBDbGVhclxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImpvYnNfX25leHQtbGlzdFwiPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1mb3I9XCJxdWV1ZWQgaW4gcXVldWVcIlxuICAgICAgICAgIDprZXk9XCJxdWV1ZWQuam9iX2lkXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnNfX3F1ZXVlZFwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImpvYnNfX3RodW1iIGpvYnNfX3RodW1iLS1zbWFsbFwiPlxuICAgICAgICAgICAgPGpvYi1waWN0dXJlXG4gICAgICAgICAgICAgIDpzcmM9XCJ0aHVtYm5haWxPZihxdWV1ZWQuZmlsZW5hbWUpXCJcbiAgICAgICAgICAgICAgOnRodW1iLWtleT1cInRodW1ibmFpbEtleU9mKHF1ZXVlZC5maWxlbmFtZSlcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJqb2JzX19xdWV1ZWQtdGV4dFwiPlxuICAgICAgICAgICAgPGI+e3sgdGl0bGVPZihxdWV1ZWQuZmlsZW5hbWUpIH19PC9iPlxuICAgICAgICAgICAgPHNwYW4+e3sgZmFjdHNPZihxdWV1ZWQuZmlsZW5hbWUpIH19PC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWlmPVwicXVldWUubGVuZ3RoID4gMVwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiam9ic19fdW5xdWV1ZVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5IHx8IHF1ZXVlZCA9PT0gcXVldWVbMF1cIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgTW92ZSAke3RpdGxlT2YocXVldWVkLmZpbGVuYW1lKX0gZWFybGllcmBcIlxuICAgICAgICAgICAgQGNsaWNrPVwibW92ZVF1ZXVlZChxdWV1ZWQsIC0xKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAg4oaRXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1pZj1cInF1ZXVlLmxlbmd0aCA+IDFcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImpvYnNfX3VucXVldWVcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeSB8fCBxdWV1ZWQgPT09IHF1ZXVlW3F1ZXVlLmxlbmd0aCAtIDFdXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE1vdmUgJHt0aXRsZU9mKHF1ZXVlZC5maWxlbmFtZSl9IGxhdGVyYFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJtb3ZlUXVldWVkKHF1ZXVlZCwgMSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIOKGk1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJqb2JzX191bnF1ZXVlXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYFRha2UgJHt0aXRsZU9mKHF1ZXVlZC5maWxlbmFtZSl9IG91dCBvZiB0aGUgcXVldWVgXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgICAgQGNsaWNrPVwidW5xdWV1ZShxdWV1ZWQpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICBuYW1lPVwieFwiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxwXG4gICAgICB2LWlmPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICBjbGFzcz1cImpvYnNfX3JlYWRvbmx5XCJcbiAgICAgIGRhdGEtdGlkPVwiam9icy1yZWFkb25seVwiXG4gICAgPlxuICAgICAge3sgcHJpbnRlck5hbWUgfX0gaXNuJ3QgdGFraW5nIGNvbW1hbmRzIHJpZ2h0IG5vdywgc28gUHJpbnQsIFVwbG9hZCwgUmVuYW1lIGFuZCBEZWxldGUgYXJlIG9mZi4gWW91IGNhbiBzdGlsbCBsb29rIHRocm91Z2ggaXRzIGZpbGVzLlxuICAgIDwvcD5cblxuICAgIDxuYXZcbiAgICAgIHYtaWY9XCJ1c2JTaG93blwiXG4gICAgICBjbGFzcz1cImpvYnNfX3NvdXJjZVwiXG4gICAgICBhcmlhLWxhYmVsPVwiV2hlcmUgdGhlIGZpbGVzIGFyZVwiXG4gICAgICBkYXRhLXRpZD1cImpvYnMtc291cmNlXCJcbiAgICA+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICA6YXJpYS1wcmVzc2VkPVwiIXVzYk9wZW5cIlxuICAgICAgICBkYXRhLXRpZD1cImpvYnMtc291cmNlLXByaW50ZXJcIlxuICAgICAgICBAY2xpY2s9XCJ1c2JPcGVuID0gZmFsc2VcIlxuICAgICAgPlxuICAgICAgICB7eyBwcmludGVyTmFtZSB9fVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICA6YXJpYS1wcmVzc2VkPVwidXNiT3BlblwiXG4gICAgICAgIGRhdGEtdGlkPVwiam9icy1zb3VyY2UtdXNiXCJcbiAgICAgICAgQGNsaWNrPVwidXNiT3BlbiA9IHRydWVcIlxuICAgICAgPlxuICAgICAgICBVU0JcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvbmF2PlxuXG4gICAgPHVzYi1icm93c2VyXG4gICAgICB2LWlmPVwidXNiT3BlbiAmJiB1c2JTaG93blwiXG4gICAgICA6Y29udHJvbC1yZWFkeT1cImNvbnRyb2xSZWFkeVwiXG4gICAgLz5cblxuICAgIDxkaXZcbiAgICAgIHYtZWxzZVxuICAgICAgY2xhc3M9XCJqb2JzX19ncmlkXCJcbiAgICA+XG4gICAgICA8c2VjdGlvblxuICAgICAgICBjbGFzcz1cImpvYnNfX2xpc3RcIlxuICAgICAgICBkYXRhLXRpZD1cImpvYnMtbGlzdFwiXG4gICAgICAgIEBjbGljaz1cIm9uTGlzdENsaWNrXCJcbiAgICAgID5cbiAgICAgICAgPG5hdlxuICAgICAgICAgIHYtaWY9XCJwYXRoXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnNfX2NydW1ic1wiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkZvbGRlclwiXG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1jcnVtYlwiXG4gICAgICAgICAgICBAY2xpY2s9XCJvcGVuRm9sZGVyKCcnKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgZ2NvZGVzXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPHRlbXBsYXRlIHYtZm9yPVwiY3J1bWIgaW4gY3J1bWJzXCI+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICA6a2V5PVwiYHNsYXNoLSR7Y3J1bWIucGF0aH1gXCJcbiAgICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgID4vPC9zcGFuPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICA6a2V5PVwiY3J1bWIucGF0aFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtY3J1bWJcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJjcnVtYi5wYXRoID09PSBwYXRoXCJcbiAgICAgICAgICAgICAgQGNsaWNrPVwib3BlbkZvbGRlcihjcnVtYi5wYXRoKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt7IGNydW1iLm5hbWUgfX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvbmF2PlxuXG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWlmPVwiIWRpckxvYWRlZCAmJiBsb2FkRXJyb3JcIlxuICAgICAgICAgIGNsYXNzPVwiam9ic19fZW1wdHlcIlxuICAgICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLWVycm9yXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiam9ic19fZW1wdHktaWNvblwiPjxmcmFtZS1pY29uIG5hbWU9XCJqb2JzXCIgLz48L3NwYW4+XG4gICAgICAgICAgPGI+Q291bGRuJ3QgbG9hZCB0aGUgZmlsZXMgb24ge3sgcHJpbnRlck5hbWUgfX08L2I+XG4gICAgICAgICAgPHNwYW4+e3sgbG9hZEVycm9yIH19PC9zcGFuPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtaWY9XCJzb2NrZXRDb25uZWN0ZWRcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLXJldHJ5XCJcbiAgICAgICAgICAgIEBjbGljaz1cInJldHJ5TG9hZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVHJ5IGFnYWluXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWVsc2UtaWY9XCIhZGlyTG9hZGVkXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnNfX3NrZWxldG9uXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtbG9hZGluZ1wiXG4gICAgICAgICAgYXJpYS1idXN5PVwidHJ1ZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWZvcj1cIm4gaW4gNVwiXG4gICAgICAgICAgICA6a2V5PVwiblwiXG4gICAgICAgICAgICBjbGFzcz1cImpvYnNfX3NrZWxldG9uLXJvd1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtZWxzZS1pZj1cIiFyb3dzLmxlbmd0aFwiXG4gICAgICAgICAgY2xhc3M9XCJqb2JzX19lbXB0eVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLWVtcHR5XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiam9ic19fZW1wdHktaWNvblwiPjxmcmFtZS1pY29uIG5hbWU9XCJqb2JzXCIgLz48L3NwYW4+XG4gICAgICAgICAgPGI+e3sgcXVlcnkgPyBgTm90aGluZyBtYXRjaGVzIOKAnCR7cXVlcnl94oCdYCA6IHBhdGggPyAnVGhpcyBmb2xkZXIgaXMgZW1wdHknIDogJ05vIEctY29kZSBvbiB0aGUgcHJpbnRlciB5ZXQnIH19PC9iPlxuICAgICAgICAgIDxzcGFuPnt7IHF1ZXJ5ID8gJ1RyeSBhbm90aGVyIG5hbWUsIG9yIGNsZWFyIHRoZSBzZWFyY2guJyA6ICdVcGxvYWQgYSBmaWxlLCBvciBzbGljZSBvbmUgaW4gU2xpY2UuJyB9fTwvc3Bhbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWlmPVwicXVlcnlcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgQGNsaWNrPVwiY2xlYXJTZWFyY2hcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENsZWFyIHNlYXJjaFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1lbXB0eS11cGxvYWRcIlxuICAgICAgICAgICAgQGNsaWNrPVwicGlja1VwbG9hZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cInVwbG9hZFwiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgVXBsb2FkIGEgZmlsZVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzPVwiam9ic19fcm93IGpvYnNfX3Jvdy0taGVhZFwiXG4gICAgICAgICAgICByb2xlPVwiZ3JvdXBcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIlNvcnQgdGhlIGxpc3RcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLWhlYWRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiam9ic19faGVhZC1uYW1lXCI+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19ib3hcIlxuICAgICAgICAgICAgICAgIDpjaGVja2VkPVwiYWxsU2VsZWN0ZWRcIlxuICAgICAgICAgICAgICAgIDppbmRldGVybWluYXRlLnByb3A9XCJzb21lU2VsZWN0ZWRcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJTZWxlY3QgYWxsXCJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtc2VsZWN0LWFsbFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrLnN0b3BcbiAgICAgICAgICAgICAgICBAY2hhbmdlPVwidG9nZ2xlQWxsXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1mb3I9XCJjb2wgaW4gY29sdW1ucy5zbGljZSgwLCAxKVwiXG4gICAgICAgICAgICAgICAgOmtleT1cImNvbC52YWx1ZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19zb3J0XCJcbiAgICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdqb2JzX19zb3J0LS1vbic6IHNvcnQgPT09IGNvbC52YWx1ZSB9XCJcbiAgICAgICAgICAgICAgICA6YXJpYS1wcmVzc2VkPVwic29ydCA9PT0gY29sLnZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICAgICAgOmRhdGEtc29ydD1cInNvcnQgPT09IGNvbC52YWx1ZSA/IHNvcnREaXIgOiBudWxsXCJcbiAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgam9icy1jb2wtJHtjb2wudmFsdWV9YFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwic29ydEJ5KGNvbC52YWx1ZSlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge3sgY29sLmxhYmVsIH19PHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtaWY9XCJzb3J0ID09PSBjb2wudmFsdWVcIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19hcnJvd1wiXG4gICAgICAgICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgICAgICAgID57eyBzb3J0RGlyID09PSAnYXNjJyA/ICfihpEnIDogJ+KGkycgfX08L3NwYW4+PHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtaWY9XCJzb3J0ID09PSBjb2wudmFsdWVcIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19zclwiXG4gICAgICAgICAgICAgICAgPiwgc29ydGVkIHt7IHNvcnREaXIgPT09ICdhc2MnID8gJ2FzY2VuZGluZycgOiAnZGVzY2VuZGluZycgfX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB2LWZvcj1cImNvbCBpbiBjb2x1bW5zLnNsaWNlKDEpXCJcbiAgICAgICAgICAgICAgOmtleT1cImNvbC52YWx1ZVwiXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX3NvcnRcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdqb2JzX19zb3J0LS1vbic6IHNvcnQgPT09IGNvbC52YWx1ZSB9XCJcbiAgICAgICAgICAgICAgOmFyaWEtcHJlc3NlZD1cInNvcnQgPT09IGNvbC52YWx1ZSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgICA6ZGF0YS1zb3J0PVwic29ydCA9PT0gY29sLnZhbHVlID8gc29ydERpciA6IG51bGxcIlxuICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgam9icy1jb2wtJHtjb2wudmFsdWV9YFwiXG4gICAgICAgICAgICAgIEBjbGljaz1cInNvcnRCeShjb2wudmFsdWUpXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3sgY29sLmxhYmVsIH19PHNwYW5cbiAgICAgICAgICAgICAgICB2LWlmPVwic29ydCA9PT0gY29sLnZhbHVlXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX2Fycm93XCJcbiAgICAgICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgICAgICA+e3sgc29ydERpciA9PT0gJ2FzYycgPyAn4oaRJyA6ICfihpMnIH19PC9zcGFuPjxzcGFuXG4gICAgICAgICAgICAgICAgdi1pZj1cInNvcnQgPT09IGNvbC52YWx1ZVwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19zclwiXG4gICAgICAgICAgICAgID4sIHNvcnRlZCB7eyBzb3J0RGlyID09PSAnYXNjJyA/ICdhc2NlbmRpbmcnIDogJ2Rlc2NlbmRpbmcnIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8c3BhbiB2LWlmPVwiIWlzTW9iaWxlVmlld3BvcnRcIiAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHJlZj1cInJvd3NcIlxuICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19yb3dzXCJcbiAgICAgICAgICAgIHJvbGU9XCJsaXN0Ym94XCJcbiAgICAgICAgICAgIGFyaWEtbXVsdGlzZWxlY3RhYmxlPVwidHJ1ZVwiXG4gICAgICAgICAgICB0YWJpbmRleD1cIjBcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkZpbGVzIG9uIHRoZSBwcmludGVyXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1yb3dzXCJcbiAgICAgICAgICAgIEBrZXlkb3duPVwib25LZXlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgdi1mb3I9XCJyb3cgaW4gcm93c1wiXG4gICAgICAgICAgICAgIDprZXk9XCJyb3cua2V5XCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19yb3dcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdqb2JzX19yb3ctLXNlbCc6IHNlbGVjdGlvbi5pbmNsdWRlcyhyb3cua2V5KSwgJ2pvYnNfX3Jvdy0tY3Vyc29yJzogc2VsLmN1cnNvciA9PT0gcm93LmtleSwgJ2pvYnNfX3Jvdy0tbm93Jzogcm93LnByaW50aW5nIH1cIlxuICAgICAgICAgICAgICByb2xlPVwib3B0aW9uXCJcbiAgICAgICAgICAgICAgOmFyaWEtc2VsZWN0ZWQ9XCJzZWxlY3Rpb24uaW5jbHVkZXMocm93LmtleSkgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgICAgOmRhdGEta2V5PVwicm93LmtleVwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1yb3dcIlxuICAgICAgICAgICAgICBAbW91c2Vkb3duPVwib25Sb3dNb3VzZURvd25cIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJvblJvd0NsaWNrKHJvdywgJGV2ZW50KVwiXG4gICAgICAgICAgICAgIEBkYmxjbGljaz1cIm9wZW5Sb3cocm93KVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiam9ic19fbmFtZVwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiam9ic19fYm94XCJcbiAgICAgICAgICAgICAgICAgIDpjaGVja2VkPVwic2VsZWN0aW9uLmluY2x1ZGVzKHJvdy5rZXkpXCJcbiAgICAgICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYFNlbGVjdCAke3Jvdy50aXRsZX1gXCJcbiAgICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1yb3ctY2hlY2tcIlxuICAgICAgICAgICAgICAgICAgQGNsaWNrLnN0b3BcbiAgICAgICAgICAgICAgICAgIEBkYmxjbGljay5zdG9wXG4gICAgICAgICAgICAgICAgICBAY2hhbmdlPVwib25DaGVjayhyb3cpXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiam9ic19fdGh1bWJcIlxuICAgICAgICAgICAgICAgICAgOmNsYXNzPVwieyAnam9ic19fdGh1bWItLWZvbGRlcic6IHJvdy5raW5kID09PSAnZm9sZGVyJyB9XCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgICAgICB2LWlmPVwicm93LmtpbmQgPT09ICdmb2xkZXInXCJcbiAgICAgICAgICAgICAgICAgICAgbmFtZT1cImZpbGVzXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8am9iLXBpY3R1cmVcbiAgICAgICAgICAgICAgICAgICAgdi1lbHNlLWlmPVwicm93LmpvYlwiXG4gICAgICAgICAgICAgICAgICAgIDpzcmM9XCJyb3cuam9iLnRodW1ibmFpbFwiXG4gICAgICAgICAgICAgICAgICAgIDp0aHVtYi1rZXk9XCJyb3cuam9iLnRodW1ibmFpbEtleVwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImpvYnNfX25hbWUtdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgPGIgOnRpdGxlPVwicm93Lm5hbWVcIj57eyByb3cudGl0bGUgfX08L2I+XG4gICAgICAgICAgICAgICAgICA8dGVtcGxhdGUgdi1pZj1cImlzTW9iaWxlVmlld3BvcnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICB2LWlmPVwicm93LmtpbmQgPT09ICdmb2xkZXInXCJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX3N1YlwiXG4gICAgICAgICAgICAgICAgICAgID57eyBmb2xkZXJDb3VudChyb3cua2V5KSB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX3N1YlwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8aVxuICAgICAgICAgICAgICAgICAgICAgICAgdi1pZj1cInJvdy5tYXRlcmlhbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX2RvdFwiXG4gICAgICAgICAgICAgICAgICAgICAgLz57eyBbcm93Lm1hdGVyaWFsLCByb3cucHJpbnRpbmcgPyAobGVmdFRleHQgfHwgJ1ByaW50aW5nIG5vdycpIDogbGlzdER1cmF0aW9uKHJvdy50aW1lKSwgZmlsZVNpemUocm93LnNpemUpXS5maWx0ZXIoQm9vbGVhbikuam9pbignIMK3ICcpIH19XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICB2LWlmPVwicm93LnByaW50aW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX2JhclwiXG4gICAgICAgICAgICAgICAgICAgID48aSA6c3R5bGU9XCJ7IHdpZHRoOiBgJHtNYXRoLm1pbigxMDAsIHByb2dyZXNzKX0lYCB9XCIgLz48L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgdi1lbHNlLWlmPVwicm93LnByaW50aW5nXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX19zdWJcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgICAgICAgICAgICAgICA6dG89XCJwYWdlUGF0aCgnLycpXCJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX3ByaW50aW5nLWxpbmtcIlxuICAgICAgICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1wcmludGluZy1saW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICBAY2xpY2submF0aXZlLnN0b3BcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDx0b25lLXBpbGwgdG9uZT1cInJ1blwiPnt7IHByaW50ZXJQYXVzZWQgPyAnUGF1c2VkJyA6ICdQcmludGluZyBub3cnIH19IMK3IHt7IE1hdGguZmxvb3IocHJvZ3Jlc3MpIH19JTwvdG9uZS1waWxsPlxuICAgICAgICAgICAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgdi1lbHNlLWlmPVwicm93LnN1YlwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzPVwiam9ic19fc3ViXCJcbiAgICAgICAgICAgICAgICAgID57eyByb3cuc3ViIH19PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8dGVtcGxhdGUgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJqb2JzX19jZWxsXCI+XG4gICAgICAgICAgICAgICAgICA8dGVtcGxhdGUgdi1pZj1cInJvdy5raW5kID09PSAnZmlsZScgJiYgcm93Lm1hdGVyaWFsXCI+PGkgY2xhc3M9XCJqb2JzX19kb3RcIiAvPnt7IHJvdy5tYXRlcmlhbCB9fTwvdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiam9ic19fY2VsbFwiPnt7IHJvdy5raW5kID09PSAnZm9sZGVyJyA/ICcnIDogcm93LnByaW50aW5nID8gKGxlZnRUZXh0IHx8ICdQcmludGluZycpIDogbGlzdER1cmF0aW9uKHJvdy50aW1lKSB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImpvYnNfX2NlbGxcIj57eyByb3cua2luZCA9PT0gJ2ZvbGRlcicgPyBmb2xkZXJDb3VudChyb3cua2V5KSA6IGZpbGVTaXplKHJvdy5zaXplKSB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImpvYnNfX2NlbGxcIj57eyByb3cua2luZCA9PT0gJ2ZvbGRlcicgPyAnJyA6IHJvdy5wcmludGluZyA/IChzdGFydGVkQXQgPyBgU3RhcnRlZCAke3N0YXJ0ZWRBdH1gIDogJ05vdycpIDogbGFzdFByaW50ZWQocm93Lmxhc3RQcmludGVkLCByb3cucHJpbnRlZCkgfX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiam9ic19fZW5kXCI+XG4gICAgICAgICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICAgICAgICB2LWlmPVwicm93LnByaW50aW5nICYmIGlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICAgICAgICAgICAgOnRvPVwicGFnZVBhdGgoJy8nKVwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX3BjdFwiXG4gICAgICAgICAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtcHJpbnRpbmctbGlua1wiXG4gICAgICAgICAgICAgICAgICBAY2xpY2submF0aXZlLnN0b3BcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7eyBNYXRoLmZsb29yKHByb2dyZXNzKSB9fSVcbiAgICAgICAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgICAgICB2LWlmPVwiaXNNb2JpbGVWaWV3cG9ydCAmJiBzZWxlY3RlZEtleSA9PT0gcm93LmtleSAmJiByb3cua2luZCA9PT0gJ2ZpbGUnXCJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJjaGVja1wiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX2NoZWNrXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxqb2ItbWVudVxuICAgICAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgICAgICA6a2luZD1cInJvdy5raW5kXCJcbiAgICAgICAgICAgICAgICAgIDpsYWJlbD1cInJvdy50aXRsZVwiXG4gICAgICAgICAgICAgICAgICA6cHJpbnRpbmc9XCJyb3cuaGVsZFwiXG4gICAgICAgICAgICAgICAgICA6cXVldWVpbmc9XCJidXN5ICYmIGNhblF1ZXVlXCJcbiAgICAgICAgICAgICAgICAgIDpsb2NrZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICAgICAgICAgIEBhY3Rpb249XCJhY3QoJGV2ZW50LCByb3cpXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgPGFzaWRlXG4gICAgICAgIHYtaWY9XCIhaXNNb2JpbGVWaWV3cG9ydCAmJiBzZWxlY3RlZFJvdyAmJiBzZWxlY3RlZFJvdy5qb2JcIlxuICAgICAgICBjbGFzcz1cImpvYnNfX2RldGFpbFwiXG4gICAgICAgIGRhdGEtdGlkPVwiam9icy1kZXRhaWxcIlxuICAgICAgPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9ic19fZGV0YWlsLWhlYWRcIj5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwiZmlsZXNcIiAvPlxuICAgICAgICAgIDxiIDp0aXRsZT1cInNlbGVjdGVkUm93LmpvYi5maWxlbmFtZVwiPnt7IHNlbGVjdGVkUm93LnRpdGxlIH19PC9iPlxuICAgICAgICAgIDxqb2ItbWVudVxuICAgICAgICAgICAga2luZD1cImZpbGVcIlxuICAgICAgICAgICAgbm8tcHJpbnRcbiAgICAgICAgICAgIG5vLXByZXZpZXdcbiAgICAgICAgICAgIDpsYWJlbD1cInNlbGVjdGVkUm93LnRpdGxlXCJcbiAgICAgICAgICAgIDpwcmludGluZz1cInNlbGVjdGVkUm93LnByaW50aW5nXCJcbiAgICAgICAgICAgIDpsb2NrZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICAgIEBhY3Rpb249XCJhY3QoJGV2ZW50LCBzZWxlY3RlZFJvdylcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9ic19fcGljdHVyZVwiPlxuICAgICAgICAgIDxqb2ItcGljdHVyZVxuICAgICAgICAgICAgOnNyYz1cInNlbGVjdGVkUm93LmpvYi50aHVtYm5haWxcIlxuICAgICAgICAgICAgOnRodW1iLWtleT1cInNlbGVjdGVkUm93LmpvYi50aHVtYm5haWxLZXlcIlxuICAgICAgICAgICAgbGFyZ2VcbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHAgY2xhc3M9XCJqb2JzX19maWxlbmFtZVwiPlxuICAgICAgICAgIHt7IHNlbGVjdGVkUm93LmpvYi5maWxlbmFtZSB9fVxuICAgICAgICA8L3A+XG4gICAgICAgIDxkbCBjbGFzcz1cImpvYnNfX3N0YXRzXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1mb3I9XCJzdGF0IGluIHN0YXRzXCJcbiAgICAgICAgICAgIDprZXk9XCJzdGF0LmxhYmVsXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZHQ+e3sgc3RhdC5sYWJlbCB9fTwvZHQ+XG4gICAgICAgICAgICA8ZGQ+XG4gICAgICAgICAgICAgIDxpXG4gICAgICAgICAgICAgICAgdi1pZj1cInN0YXQuZG90XCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImpvYnNfX2RvdFwiXG4gICAgICAgICAgICAgIC8+e3sgc3RhdC52YWx1ZSB9fVxuICAgICAgICAgICAgPC9kZD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kbD5cbiAgICAgICAgPHVsXG4gICAgICAgICAgdi1pZj1cIndhcm5pbmdzLmxlbmd0aFwiXG4gICAgICAgICAgY2xhc3M9XCJqb2JzX193YXJuaW5nc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLXdhcm5pbmdzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxsaVxuICAgICAgICAgICAgdi1mb3I9XCJ3YXJuaW5nIGluIHdhcm5pbmdzXCJcbiAgICAgICAgICAgIDprZXk9XCJ3YXJuaW5nXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8di1pY29uXG4gICAgICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICAgICAgY2xhc3M9XCJqb2JzX193YXJuaW5nLWljb25cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAkd2FybmluZ1xuICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgICB7eyB3YXJuaW5nIH19XG4gICAgICAgICAgPC9saT5cbiAgICAgICAgPC91bD5cbiAgICAgICAgPGRpdiBjbGFzcz1cImpvYnNfX2FjdGlvbnNcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5IGpvYnNfX3ByaW50XCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5TdGFydChzZWxlY3RlZFJvdylcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLXByaW50XCJcbiAgICAgICAgICAgIEBjbGljaz1cInByaW50Um93KHNlbGVjdGVkUm93KVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgcHJpbnRMYWJlbChzZWxlY3RlZFJvdykgfX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtcHJldmlld1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJwcmV2aWV3KHNlbGVjdGVkUm93KVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cImV5ZVwiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgUHJldmlld1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYXNpZGU+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiaXNNb2JpbGVWaWV3cG9ydCAmJiBzZWxlY3RlZFJvdyAmJiBzZWxlY3RlZFJvdy5qb2JcIlxuICAgICAgY2xhc3M9XCJqb2JzX19zdGlja3lcIlxuICAgICAgZGF0YS10aWQ9XCJqb2JzLXN0aWNreVwiXG4gICAgPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnkgam9ic19fcHJpbnRcIlxuICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuU3RhcnQoc2VsZWN0ZWRSb3cpXCJcbiAgICAgICAgZGF0YS10aWQ9XCJqb2JzLXByaW50XCJcbiAgICAgICAgQGNsaWNrPVwicHJpbnRSb3coc2VsZWN0ZWRSb3cpXCJcbiAgICAgID5cbiAgICAgICAge3sgcHJpbnRMYWJlbChzZWxlY3RlZFJvdykgfX0ge3sgc2VsZWN0ZWRSb3cucHJpbnRpbmcgPyAnJyA6IHNlbGVjdGVkUm93LnRpdGxlIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxqb2ItbWVudVxuICAgICAgICBraW5kPVwiZmlsZVwiXG4gICAgICAgIGJ1dHRvblxuICAgICAgICBuby1wcmludFxuICAgICAgICA6bGFiZWw9XCJzZWxlY3RlZFJvdy50aXRsZVwiXG4gICAgICAgIDpwcmludGluZz1cInNlbGVjdGVkUm93LnByaW50aW5nXCJcbiAgICAgICAgOnF1ZXVlaW5nPVwiZmFsc2VcIlxuICAgICAgICA6bG9ja2VkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgIEBhY3Rpb249XCJhY3QoJGV2ZW50LCBzZWxlY3RlZFJvdylcIlxuICAgICAgLz5cbiAgICA8L2Rpdj5cblxuICAgIDxpbnB1dFxuICAgICAgcmVmPVwidXBsb2FkXCJcbiAgICAgIHR5cGU9XCJmaWxlXCJcbiAgICAgIG11bHRpcGxlXG4gICAgICA6YWNjZXB0PVwiZ2NvZGVBY2NlcHRcIlxuICAgICAgY2xhc3M9XCJqb2JzX191cGxvYWRcIlxuICAgICAgZGF0YS10aWQ9XCJqb2JzLXVwbG9hZC1pbnB1dFwiXG4gICAgICBAY2hhbmdlPVwib25QaWNrZWRcIlxuICAgID5cblxuICAgIDxmaWxlLW5hbWUtZGlhbG9nXG4gICAgICB2LWlmPVwiZm9sZGVyRGlhbG9nXCJcbiAgICAgIHYtbW9kZWw9XCJmb2xkZXJEaWFsb2dcIlxuICAgICAgdGl0bGU9XCJOZXcgZm9sZGVyXCJcbiAgICAgIDpsYWJlbD1cImBJbiAke3BhdGggPyBgJHtwYXRofS9gIDogJ2djb2Rlcy8nfWBcIlxuICAgICAgbmFtZT1cIlwiXG4gICAgICBAc2F2ZT1cIm1ha2VGb2xkZXJcIlxuICAgIC8+XG4gICAgPGZpbGUtbmFtZS1kaWFsb2dcbiAgICAgIHYtaWY9XCJyZW5hbWVSb3dcIlxuICAgICAgOnZhbHVlPVwidHJ1ZVwiXG4gICAgICA6dGl0bGU9XCJyZW5hbWVSb3cua2luZCA9PT0gJ2ZvbGRlcicgPyAnUmVuYW1lIHRoZSBmb2xkZXInIDogJ1JlbmFtZSB0aGUgZmlsZSdcIlxuICAgICAgbGFiZWw9XCJOYW1lXCJcbiAgICAgIDpuYW1lPVwicmVuYW1lUm93Lm5hbWVcIlxuICAgICAgQGlucHV0PVwicmVuYW1lUm93ID0gbnVsbFwiXG4gICAgICBAc2F2ZT1cInJlbmFtZVwiXG4gICAgLz5cblxuICAgIDx2LWRpYWxvZ1xuICAgICAgOnZhbHVlPVwiISFtb3ZlUm93c1wiXG4gICAgICBtYXgtd2lkdGg9XCI0MjBcIlxuICAgICAgQGlucHV0PVwibW92ZVJvd3MgPSBudWxsXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJtb3ZlUm93c1wiXG4gICAgICAgIGNsYXNzPVwiam9ic19fbW92ZVwiXG4gICAgICAgIGRhdGEtdGlkPVwiam9icy1tb3ZlLWRpYWxvZ1wiXG4gICAgICA+XG4gICAgICAgIDxoMz5Nb3ZlIHt7IG1vdmVSb3dzLmxlbmd0aCA9PT0gMSA/IG1vdmVSb3dzWzBdLnRpdGxlIDogYCR7bW92ZVJvd3MubGVuZ3RofSBpdGVtc2AgfX0gdG88L2gzPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1mb3I9XCJmb2xkZXIgaW4gbW92ZVRhcmdldHNcIlxuICAgICAgICAgIDprZXk9XCJmb2xkZXJcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiam9ic19fbW92ZS10b1wiXG4gICAgICAgICAgQGNsaWNrPVwibW92ZUludG8oZm9sZGVyKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cImZpbGVzXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICB7eyBmb2xkZXIgPyBgZ2NvZGVzLyR7Zm9sZGVyfS9gIDogJ2djb2Rlcy8nIH19XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCIhbW92ZVRhcmdldHMubGVuZ3RoXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnNfX25vdGVcIlxuICAgICAgICA+XG4gICAgICAgICAgTm8gb3RoZXIgZm9sZGVyIHlldC4gTWFrZSBvbmUgd2l0aCBOZXcgZm9sZGVyIGZpcnN0LlxuICAgICAgICA8L3A+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb2JzX19tb3ZlLWFjdGlvbnNcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgICBAY2xpY2s9XCJtb3ZlUm93cyA9IG51bGxcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvdi1kaWFsb2c+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgY29uc29sYSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IEpvYnNNaXhpbiwgeyB0eXBlIEpvYkZpbGUgfSBmcm9tICdAL21peGlucy9qb2JzJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgdHlwZSB7IFF1ZXVlZEpvYiB9IGZyb20gJ0Avc3RvcmUvam9iUXVldWUvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEFwcERpcmVjdG9yeSwgQXBwRmlsZVdpdGhNZXRhLCBGaWxlQnJvd3NlckVudHJ5IH0gZnJvbSAnQC9zdG9yZS9maWxlcy90eXBlcydcbmltcG9ydCB7IGZpbGVTaXplLCBpc0djb2RlRmlsZSwgaXNNb2RlbEZpbGUsIGpvYlRpdGxlLCBwYXJlbnRGb2xkZXIsIHF1ZXVlTGFiZWwsIHJlYWR5Q2hlY2tzIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IHsgTU9ERUxfQUNDRVBUIH0gZnJvbSAnQC9zZXJ2aWNlcy9zbGljZXItYnJpZGdlL2hhbmRvdmVyJ1xuaW1wb3J0IHsgTk9fU0VMRUNUSU9OLCBhbGxTZWxlY3RlZCwgY2xlYXJTZWxlY3Rpb24sIGNsaWNrUm93LCBrZWVwU2hvd24sIG1vdmVDdXJzb3IsIHNlbGVjdEFsbCwgc29tZVNlbGVjdGVkLCB0b2dnbGVSb3csIHR5cGUgU2VsZWN0aW9uIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL3NlbGVjdGlvbidcbmltcG9ydCB7IEpPQlNfQ09MVU1OUywgbGFzdFByaW50ZWQsIGxheWVyQ291bnRPZiwgbGlzdER1cmF0aW9uLCBtYXRlcmlhbE9mLCBuZXh0Q29sdW1uU29ydCwgc29ydERpcmVjdGlvbiwgc29ydExpc3RSb3dzLCB0eXBlIEpvYnNTb3J0IH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL2xpc3QnXG5pbXBvcnQgeyBqb2JzUGFnZSwgcmVzZXRKb2JzUGFnZSwgc2V0Sm9ic1NvcnQgfSBmcm9tICdAL3NlcnZpY2VzL2pvYnMvcGFnZS1zdGF0ZSdcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCBGaWxlTmFtZURpYWxvZyBmcm9tICdAL2NvbXBvbmVudHMvd2lkZ2V0cy9maWxlc3lzdGVtL0ZpbGVOYW1lRGlhbG9nLnZ1ZSdcbmltcG9ydCBKb2JNZW51LCB7IHR5cGUgSm9iTWVudUFjdGlvbiB9IGZyb20gJ0AvY29tcG9uZW50cy9qb2JzL0pvYk1lbnUudnVlJ1xuaW1wb3J0IEpvYlBpY3R1cmUgZnJvbSAnQC9jb21wb25lbnRzL2pvYnMvSm9iUGljdHVyZS52dWUnXG5pbXBvcnQgeyByZXRyeUZhaWxlZFRodW1ibmFpbHMgfSBmcm9tICdAL3NlcnZpY2VzL2pvYnMvdGh1bWJuYWlsJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9Ub25lUGlsbC52dWUnXG5pbXBvcnQgVXNiQnJvd3NlciBmcm9tICdAL2NvbXBvbmVudHMvdXNiL1VzYkJyb3dzZXIudnVlJ1xuaW1wb3J0IHsgdXNiLCB3YXRjaFVzYiB9IGZyb20gJ0Avc2VydmljZXMvdXNiL3N0YXRlJ1xuXG4vKiogQSByb3cgb2YgdGhlIGxpc3Q6IGEgZm9sZGVyLCBvciBhIEctY29kZSBmaWxlIGluIHRoZSBmb2xkZXIgdGhhdCdzIG9wZW4uICovXG5pbnRlcmZhY2UgTGlzdFJvdyB7XG4gIC8qKiBJdHMgcGF0aCBpbiBnY29kZXMvLCB3aGljaCBpcyBhbHNvIGl0cyBrZXkuICovXG4gIGtleTogc3RyaW5nO1xuICBraW5kOiAnZm9sZGVyJyB8ICdmaWxlJztcbiAgLyoqIFdoYXQgdGhlIHByaW50ZXIgY2FsbHMgaXQuICovXG4gIG5hbWU6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3ViOiBzdHJpbmc7XG4gIG1vZGlmaWVkOiBudW1iZXI7XG4gIHRpbWU/OiBudW1iZXI7XG4gIHNpemU6IG51bWJlcjtcbiAgZmlsYW1lbnQ/OiBudW1iZXI7XG4gIGxheWVyPzogbnVtYmVyO1xuICBtYXRlcmlhbDogc3RyaW5nO1xuICBsYXN0UHJpbnRlZDogbnVtYmVyIHwgbnVsbDtcbiAgLyoqIEl0IGhhcyBhIHByaW50IG9uIHJlY29yZCwgd2l0aCBvciB3aXRob3V0IGEgdGltZS4gKi9cbiAgcHJpbnRlZDogYm9vbGVhbjtcbiAgcHJpbnRpbmc6IGJvb2xlYW47XG4gIC8qKiBJdCBpcyB0aGUgZmlsZSBwcmludGluZywgb3IgYSBmb2xkZXIgd2l0aCB0aGF0IGZpbGUgaW4gaXQ6IGl0IHN0YXlzIHdoZXJlIGl0IGlzLiAqL1xuICBoZWxkOiBib29sZWFuO1xuICBqb2I/OiBKb2JGaWxlO1xufVxuXG4vKipcbiAqIEpvYnM6IHRoZSBHLWNvZGUgb24gdGhlIHByaW50ZXIgYXMgb25lIGxpc3QgKHRoZSBmaWxlIHRoYXQncyBwcmludGluZ1xuICogcGlubmVkIGZpcnN0KSwgYW5kIGEgdGlsZSBiZXNpZGUgaXQgZm9yIHRoZSBvbmUgdGhhdCdzIHBpY2tlZDogaXRzXG4gKiBwaWN0dXJlLCBpdHMgZmFjdHMsIFByaW50IGFuZCBQcmV2aWV3LiBFdmVyeXRoaW5nIHRoYXQgY2FuIGJlIGRvbmUgdG9cbiAqIGEgZmlsZSBpcyBpbiBpdHMgwrfCt8K3IG1lbnUuIFRoZSBzZWFyY2gsIHRoZSBvcmRlciwgVXBsb2FkIGFuZCB0aGVcbiAqIHBhZ2VzIHRoYXQgdXNlZCB0byBiZSB0YWJzIGFyZSBpbiB0aGUgaGVhZGVyIChKb2JzQWN0aW9ucykuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IEZpbGVOYW1lRGlhbG9nLCBKb2JNZW51LCBKb2JQaWN0dXJlLCBUb25lUGlsbCwgVXNiQnJvd3NlciB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBKb2JzIGV4dGVuZHMgTWl4aW5zKEpvYnNNaXhpbiwgQnJvd3Nlck1peGluKSB7XG4gIHBhdGggPSAnJ1xuICBzZWxlY3RlZEtleTogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgZm9sZGVyRGlhbG9nID0gZmFsc2VcbiAgcmVuYW1lUm93OiBMaXN0Um93IHwgbnVsbCA9IG51bGxcbiAgbW92ZVJvd3M6IExpc3RSb3dbXSB8IG51bGwgPSBudWxsXG4gIGRpYWxvZ1RhcmdldDogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgLyoqIFdoYXQncyBzZWxlY3RlZCwgRmlsZSBFeHBsb3JlcidzIHdheTsgdGhlIGhlYWRlcidzIHRvb2xiYXIgYWN0cyBvbiBpdC4gKi9cbiAgc2VsOiBTZWxlY3Rpb24gPSBOT19TRUxFQ1RJT05cbiAgLyoqIFdoeSB0aGUgZm9sZGVyJ3MgbGlzdGluZyBmYWlsZWQsIHVudGlsIGl0IGlzIGFza2VkIGZvciBhZ2Fpbi4gKi9cbiAgbG9hZEVycm9yID0gJydcbiAgdW5zdWJzY3JpYmU6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgVVNCIHN0aWNrJ3MgZmlsZXMgYXJlIG9wZW4gaW4gcGxhY2Ugb2YgdGhlIHByaW50ZXIncyAoS0FOLTQ4MTUpLiAqL1xuICB1c2JPcGVuID0gZmFsc2VcbiAgc3RvcFVzYldhdGNoOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG4gIHJlYWRvbmx5IGxpc3REdXJhdGlvbiA9IGxpc3REdXJhdGlvblxuICByZWFkb25seSBmaWxlU2l6ZSA9IGZpbGVTaXplXG4gIHJlYWRvbmx5IGxhc3RQcmludGVkID0gbGFzdFByaW50ZWRcbiAgcmVhZG9ubHkgcXVldWVMYWJlbCA9IHF1ZXVlTGFiZWxcblxuICBnZXQgcXVlcnkgKCk6IHN0cmluZyB7IHJldHVybiBqb2JzUGFnZS5xdWVyeSB9XG5cbiAgLyoqIFRoZSBwcmludGVyIGhhcyB0aGUgVVNCIHJvdXRlcywgYW5kIGEgc3RpY2sgaXMgaW4gKG9yIHdhcyBqdXN0IGVqZWN0ZWQpLCBvciB0aGUgcGVyc29uIGlzIGFscmVhZHkgbG9va2luZyBhdCBpdC4gKi9cbiAgZ2V0IHVzYlNob3duICgpOiBib29sZWFuIHtcbiAgICBpZiAoIXVzYi5zdXBwb3J0ZWQpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0aGlzLnVzYk9wZW4gfHwgISF1c2Iuc3RhdHVzPy5zdGlja3MubGVuZ3RoIHx8ICEhdXNiLnN0YXR1cz8uZWplY3RlZC5sZW5ndGhcbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIC8vIEEgcHJpbnRlciB3aXRob3V0IHRoZSBVU0Igcm91dGVzIGFuc3dlcnMgNDA0IGFuZCB0aGUgcGFnZSBuZXZlciBzaG93cyBVU0IuXG4gICAgdGhpcy5zdG9wVXNiV2F0Y2ggPSB3YXRjaFVzYigpXG4gICAgdGhpcy51c2JPcGVuID0gdGhpcy4kcm91dGU/LnF1ZXJ5Py52aWV3ID09PSAndXNiJ1xuICAgIC8vIFBpY3R1cmVzIHRoYXQgZ2F2ZSB1cCB3aGlsZSBKb2JzIHdhcyBsYXN0IG9wZW4gZ2V0IGFub3RoZXIgZ28uXG4gICAgcmV0cnlGYWlsZWRUaHVtYm5haWxzKClcbiAgICBjb25zdCBzYXZlZCA9ICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydmaWxlcy9nZXRDdXJyZW50UGF0aEJ5Um9vdCddKHRoaXMucm9vdCkgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnJ1xuICAgIHRoaXMub3BlbkZvbGRlcihzYXZlZC5zdGFydHNXaXRoKGAke3RoaXMucm9vdH0vYCkgPyBzYXZlZC5zbGljZSh0aGlzLnJvb3QubGVuZ3RoICsgMSkgOiAnJylcbiAgICB0aGlzLmxvYWRGaWxlcygpXG4gICAgdGhpcy5wdWJsaXNoKClcbiAgICAvLyBUaGUgc3RvcmUncyBlcnJvciBhY3Rpb24gY2FycmllcyB0aGUgcmVxdWVzdCwgc28gYSBmYWlsZWQgbGlzdGluZyBzaG93cyBoZXJlLlxuICAgIGlmICh0eXBlb2YgdGhpcy4kc3RvcmUuc3Vic2NyaWJlQWN0aW9uICE9PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICB0aGlzLnVuc3Vic2NyaWJlID0gdGhpcy4kc3RvcmUuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiA9PiB7XG4gICAgICBpZiAoYWN0aW9uLnR5cGUgIT09ICdzb2NrZXQvb25Tb2NrZXRFcnJvcicpIHJldHVyblxuICAgICAgY29uc3QgZXJyb3IgPSBhY3Rpb24ucGF5bG9hZCBhcyB7IG1lc3NhZ2U/OiBzdHJpbmcsIF9fcmVxdWVzdF9fPzogeyBtZXRob2Q/OiBzdHJpbmcsIHBhcmFtcz86IHsgcGF0aD86IHN0cmluZyB9IH0gfSB8IHVuZGVmaW5lZFxuICAgICAgY29uc3QgcmVxdWVzdCA9IGVycm9yPy5fX3JlcXVlc3RfX1xuICAgICAgaWYgKHJlcXVlc3Q/Lm1ldGhvZCAhPT0gJ3NlcnZlci5maWxlcy5nZXRfZGlyZWN0b3J5JyB8fCBTdHJpbmcocmVxdWVzdC5wYXJhbXM/LnBhdGggPz8gJycpLnNwbGl0KCcvJylbMF0gIT09IHRoaXMucm9vdCkgcmV0dXJuXG4gICAgICB0aGlzLmxvYWRFcnJvciA9IGVycm9yPy5tZXNzYWdlIHx8ICdUaGUgcHJpbnRlciBkaWQgbm90IGFuc3dlci4nXG4gICAgfSlcbiAgfVxuXG4gIHJldHJ5TG9hZCAoKSB7XG4gICAgdGhpcy5sb2FkRXJyb3IgPSAnJ1xuICAgIFNvY2tldEFjdGlvbnMuc2VydmVyRmlsZXNHZXREaXJlY3RvcnkodGhpcy5yb290LCB0aGlzLmRpcilcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuc3RvcFVzYldhdGNoPy4oKVxuICAgIHRoaXMudW5zdWJzY3JpYmU/LigpXG4gICAgcmVzZXRKb2JzUGFnZSgpXG4gICAgam9ic1BhZ2UuZmlsZXMgPSAwXG4gICAgam9ic1BhZ2UuZnJlZSA9ICcnXG4gIH1cblxuICAvLyAtLSB0aGUgZm9sZGVyIHRoYXQncyBvcGVuIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBkaXIgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucGF0aCA/IGAke3RoaXMucm9vdH0vJHt0aGlzLnBhdGh9YCA6IHRoaXMucm9vdFxuICB9XG5cbiAgZ2V0IGRpckVudHJpZXMgKCk6IEZpbGVCcm93c2VyRW50cnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydmaWxlcy9nZXREaXJlY3RvcnknXSh0aGlzLmRpcikgYXMgRmlsZUJyb3dzZXJFbnRyeVtdIHwgdW5kZWZpbmVkKSA/PyBbXVxuICB9XG5cbiAgZ2V0IGRpckxvYWRlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy4kc3RvcmUuZ2V0dGVyc1snZmlsZXMvZ2V0RGlyZWN0b3J5J10odGhpcy5kaXIpXG4gIH1cblxuICBnZXQgcGFyZW50ICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXJlbnRGb2xkZXIodGhpcy5wYXRoKVxuICB9XG5cbiAgZ2V0IGNydW1icyAoKTogQXJyYXk8eyBuYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3QgcGFydHMgPSB0aGlzLnBhdGggPyB0aGlzLnBhdGguc3BsaXQoJy8nKSA6IFtdXG4gICAgcmV0dXJuIHBhcnRzLm1hcCgobmFtZSwgaSkgPT4gKHsgbmFtZSwgcGF0aDogcGFydHMuc2xpY2UoMCwgaSArIDEpLmpvaW4oJy8nKSB9KSlcbiAgfVxuXG4gIC8qKiBUaGUgZmlsZSBwcmludGluZywgb3IgYSBmb2xkZXIgd2l0aCBpdCBpbnNpZGUsIHN0YXlzIHdoZXJlIGl0IGlzLiAqL1xuICBob2xkcyAoa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBwcmludGluZyA9IHRoaXMuYnVzeSA/IHRoaXMuam9iRmlsZSA6ICcnXG4gICAgcmV0dXJuICEhcHJpbnRpbmcgJiYgKHByaW50aW5nID09PSBrZXkgfHwgcHJpbnRpbmcuc3RhcnRzV2l0aChgJHtrZXl9L2ApKVxuICB9XG5cbiAgZ2V0IHByaW50aW5nVGl0bGUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGpvYlRpdGxlKHRoaXMuam9iRmlsZSlcbiAgfVxuXG4gIG9wZW5Gb2xkZXIgKHBhdGg6IHN0cmluZykge1xuICAgIGlmIChwYXRoICE9PSB0aGlzLnBhdGgpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRLZXkgPSBudWxsXG4gICAgICB0aGlzLnNlbCA9IE5PX1NFTEVDVElPTlxuICAgIH1cbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgLy8gQSBmaWxlIGRyb3BwZWQgYW55d2hlcmUgb24gdGhlIHBhZ2UgbGFuZHMgaW4gdGhlIGZvbGRlciB0aGF0J3Mgb3Blbi5cbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnZmlsZXMvdXBkYXRlQ3VycmVudFBhdGhCeVJvb3QnLCB7IHJvb3Q6IHRoaXMucm9vdCwgcGF0aDogdGhpcy5kaXIgfSlcbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckZpbGVzR2V0RGlyZWN0b3J5KHRoaXMucm9vdCwgdGhpcy5kaXIpXG4gIH1cblxuICAvKiogQSBmb2xkZXIncyBHLWNvZGUgY291bnQsIG9uY2UgRmx1aWRkIGhhcyBsaXN0ZWQgaXQuICovXG4gIGZvbGRlckNvdW50IChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGlzdGluZyA9ICh0aGlzLiRzdG9yZS5zdGF0ZS5maWxlcy5wYXRoRmlsZXMgYXMgUmVjb3JkPHN0cmluZywgeyBmaWxlczogQXJyYXk8eyBmaWxlbmFtZTogc3RyaW5nIH0+IH0+KVtgJHt0aGlzLnJvb3R9LyR7a2V5fWBdXG4gICAgaWYgKCFsaXN0aW5nKSByZXR1cm4gJ0ZvbGRlcidcbiAgICBjb25zdCBuID0gbGlzdGluZy5maWxlcy5maWx0ZXIoZiA9PiBpc0djb2RlRmlsZShmLmZpbGVuYW1lKSkubGVuZ3RoXG4gICAgcmV0dXJuIGAke259ICR7biA9PT0gMSA/ICdmaWxlJyA6ICdmaWxlcyd9YFxuICB9XG5cbiAgLy8gLS0gdGhlIGxpc3QgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBmaWxlUm93cyAoKTogTGlzdFJvd1tdIHtcbiAgICByZXR1cm4gdGhpcy5kaXJFbnRyaWVzXG4gICAgICAuZmlsdGVyKChlKTogZSBpcyBBcHBGaWxlV2l0aE1ldGEgPT4gZS50eXBlID09PSAnZmlsZScgJiYgaXNHY29kZUZpbGUoZS5maWxlbmFtZSkpXG4gICAgICAubWFwKGYgPT4ge1xuICAgICAgICBjb25zdCBqb2IgPSB0aGlzLnRvSm9iRmlsZShmKVxuICAgICAgICBjb25zdCBoaXN0b3J5ID0gZi5oaXN0b3J5IGFzIHsgc3RhcnRfdGltZT86IG51bWJlciB9IHwgdW5kZWZpbmVkXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAga2V5OiBqb2IucGF0aCxcbiAgICAgICAgICBraW5kOiAnZmlsZScgYXMgY29uc3QsXG4gICAgICAgICAgbmFtZTogZi5maWxlbmFtZSxcbiAgICAgICAgICB0aXRsZTogam9iLnRpdGxlLFxuICAgICAgICAgIHN1YjogJycsXG4gICAgICAgICAgbW9kaWZpZWQ6IGYubW9kaWZpZWQsXG4gICAgICAgICAgdGltZTogZi5lc3RpbWF0ZWRfdGltZSxcbiAgICAgICAgICBzaXplOiBmLnNpemUsXG4gICAgICAgICAgZmlsYW1lbnQ6IGYuZmlsYW1lbnRfd2VpZ2h0X3RvdGFsIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYXllcjogZi5sYXllcl9oZWlnaHQgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIG1hdGVyaWFsOiBtYXRlcmlhbE9mKGYuZmlsYW1lbnRfdHlwZSksXG4gICAgICAgICAgbGFzdFByaW50ZWQ6IGhpc3Rvcnk/LnN0YXJ0X3RpbWUgPz8gam9iLnByaW50X3N0YXJ0X3RpbWUgPz8gbnVsbCxcbiAgICAgICAgICBwcmludGVkOiBqb2IucHJpbnRlZCxcbiAgICAgICAgICBwcmludGluZzogam9iLnByaW50aW5nLFxuICAgICAgICAgIGhlbGQ6IGpvYi5wcmludGluZyxcbiAgICAgICAgICBqb2JcbiAgICAgICAgfVxuICAgICAgfSlcbiAgfVxuXG4gIGdldCBmb2xkZXJSb3dzICgpOiBMaXN0Um93W10ge1xuICAgIHJldHVybiB0aGlzLmRpckVudHJpZXNcbiAgICAgIC5maWx0ZXIoKGUpOiBlIGlzIEFwcERpcmVjdG9yeSA9PiBlLnR5cGUgPT09ICdkaXJlY3RvcnknICYmIGUubmFtZSAhPT0gJy4uJylcbiAgICAgIC5tYXAoZCA9PiAoe1xuICAgICAgICBrZXk6IHRoaXMucGF0aCA/IGAke3RoaXMucGF0aH0vJHtkLmRpcm5hbWV9YCA6IGQuZGlybmFtZSxcbiAgICAgICAga2luZDogJ2ZvbGRlcicgYXMgY29uc3QsXG4gICAgICAgIG5hbWU6IGQuZGlybmFtZSxcbiAgICAgICAgdGl0bGU6IGQuZGlybmFtZSxcbiAgICAgICAgc3ViOiAnJyxcbiAgICAgICAgbW9kaWZpZWQ6IGQubW9kaWZpZWQsXG4gICAgICAgIHNpemU6IGQuc2l6ZSxcbiAgICAgICAgbWF0ZXJpYWw6ICcnLFxuICAgICAgICBsYXN0UHJpbnRlZDogbnVsbCxcbiAgICAgICAgcHJpbnRlZDogZmFsc2UsXG4gICAgICAgIHByaW50aW5nOiBmYWxzZSxcbiAgICAgICAgaGVsZDogdGhpcy5ob2xkcyh0aGlzLnBhdGggPyBgJHt0aGlzLnBhdGh9LyR7ZC5kaXJuYW1lfWAgOiBkLmRpcm5hbWUpXG4gICAgICB9KSlcbiAgfVxuXG4gIGdldCByb3dzICgpOiBMaXN0Um93W10ge1xuICAgIGNvbnN0IHEgPSB0aGlzLnF1ZXJ5LnRyaW0oKS50b0xvd2VyQ2FzZSgpXG4gICAgY29uc3QgYWxsID0gWy4uLnRoaXMuZm9sZGVyUm93cywgLi4udGhpcy5maWxlUm93c11cbiAgICAgIC5maWx0ZXIociA9PiAhcSB8fCByLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSB8fCByLnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkpXG4gICAgcmV0dXJuIHNvcnRMaXN0Um93cyhhbGwsIGpvYnNQYWdlLnNvcnQsIGpvYnNQYWdlLnJldmVyc2UpXG4gIH1cblxuICBnZXQgc2VsZWN0ZWRSb3cgKCk6IExpc3RSb3cgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnJvd3MuZmluZChyID0+IHIua2V5ID09PSB0aGlzLnNlbGVjdGVkS2V5ICYmIHIua2luZCA9PT0gJ2ZpbGUnKVxuICB9XG5cbiAgLyoqIEEgZGVza3RvcCBhbHdheXMgaGFzIGEgZmlsZSBwaWNrZWQsIHNvIHRoZSB0aWxlIGlzIG5ldmVyIGVtcHR5OyBhIHBob25lIHdhaXRzIGZvciBhIHRhcC4gKi9cbiAgQFdhdGNoKCdyb3dzJylcbiAga2VlcFNlbGVjdGlvbiAocm93czogTGlzdFJvd1tdKSB7XG4gICAgdGhpcy5zZWwgPSBrZWVwU2hvd24odGhpcy5zZWwsIHJvd3MubWFwKHIgPT4gci5rZXkpKVxuICAgIGlmICh0aGlzLnNlbGVjdGVkS2V5ICYmIHJvd3Muc29tZShyID0+IHIua2V5ID09PSB0aGlzLnNlbGVjdGVkS2V5KSkgcmV0dXJuXG4gICAgaWYgKHRoaXMuaXNNb2JpbGVWaWV3cG9ydCkge1xuICAgICAgdGhpcy5zZWxlY3RlZEtleSA9IG51bGxcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBmaXJzdCA9IHJvd3MuZmluZChyID0+IHIua2luZCA9PT0gJ2ZpbGUnICYmICFyLnByaW50aW5nKSA/PyByb3dzLmZpbmQociA9PiByLmtpbmQgPT09ICdmaWxlJylcbiAgICB0aGlzLnNlbGVjdGVkS2V5ID0gZmlyc3Q/LmtleSA/PyBudWxsXG4gIH1cblxuICBAV2F0Y2goJ2lzTW9iaWxlVmlld3BvcnQnKVxuICBvblZpZXdwb3J0ICgpIHtcbiAgICB0aGlzLmtlZXBTZWxlY3Rpb24odGhpcy5yb3dzKVxuICB9XG5cbiAgLyoqIFdoYXQgdGhlIGhlYWRlcidzIHNlY29uZCBsaW5lIHNheXMuICovXG4gIEBXYXRjaCgnZmlsZVJvd3MnKVxuICBAV2F0Y2goJ2ZyZWVTcGFjZScpXG4gIEBXYXRjaCgncHJpbnRlck5hbWUnKVxuICBwdWJsaXNoICgpIHtcbiAgICBqb2JzUGFnZS5maWxlcyA9IHRoaXMuZmlsZVJvd3MubGVuZ3RoXG4gICAgam9ic1BhZ2UuZnJlZSA9IHRoaXMuZnJlZVNwYWNlID8/ICcnXG4gICAgam9ic1BhZ2UucHJpbnRlck5hbWUgPSB0aGlzLnByaW50ZXJOYW1lXG4gIH1cblxuICAvKiogVGhlIGtleXMgb2YgdGhlIHJvd3MsIGluIHRoZSBvcmRlciBzaG93bjogd2hhdCByYW5nZXMgYW5kIHRoZSBhcnJvdyBrZXlzIGdvIGJ5LiAqL1xuICBnZXQgb3JkZXIgKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5yb3dzLm1hcChyID0+IHIua2V5KVxuICB9XG5cbiAgZ2V0IHNlbGVjdGlvbiAoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLnNlbC5rZXlzXG4gIH1cblxuICAvKiogVGhlIHRpbGUgc2hvd3MgdGhlIGZpbGUgdGhlIGN1cnNvciBsYXN0IGxhbmRlZCBvbjsgaXQgc3RheXMgcHV0IHdoaWxlIHRoZSBjdXJzb3IgaXMgb24gYSBmb2xkZXIuICovXG4gIEBXYXRjaCgnc2VsJylcbiAgb25TZWwgKHNlbDogU2VsZWN0aW9uKSB7XG4gICAgY29uc3Qgcm93ID0gc2VsLmN1cnNvciA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHRoaXMucm93cy5maW5kKHIgPT4gci5rZXkgPT09IHNlbC5jdXJzb3IpXG4gICAgaWYgKHJvdz8ua2luZCA9PT0gJ2ZpbGUnKSB0aGlzLnNlbGVjdGVkS2V5ID0gcm93LmtleVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcGxhaW4gY2xpY2sgKG9yIHRhcCkgc2VsZWN0cyB0aGF0IHJvdyBhbG9uZS4gT24gYSBwaG9uZSwgYSB0YXAgb24gYVxuICAgKiBmb2xkZXIgb3BlbnMgaXQsIGFuZCBhIHNlY29uZCB0YXAgb24gdGhlIGZpbGUgbGV0cyBnbyBvZiBpdCwgYW5kIHRoZVxuICAgKiBQcmludCBiYXIgZ29lcy5cbiAgICovXG4gIHBpY2sgKHJvdzogTGlzdFJvdykge1xuICAgIGlmICh0aGlzLmlzTW9iaWxlVmlld3BvcnQpIHtcbiAgICAgIGlmIChyb3cua2luZCA9PT0gJ2ZvbGRlcicpIHtcbiAgICAgICAgdGhpcy5vcGVuRm9sZGVyKHJvdy5rZXkpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRLZXkgPT09IHJvdy5rZXkgJiYgdGhpcy5zZWxlY3Rpb24uZXZlcnkoayA9PiBrID09PSByb3cua2V5KSkge1xuICAgICAgICB0aGlzLnNlbCA9IE5PX1NFTEVDVElPTlxuICAgICAgICB0aGlzLnNlbGVjdGVkS2V5ID0gbnVsbFxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zZWwgPSBjbGlja1Jvdyh0aGlzLnNlbCwgdGhpcy5vcmRlciwgcm93LmtleSlcbiAgICBpZiAocm93LmtpbmQgPT09ICdmaWxlJykgdGhpcy5zZWxlY3RlZEtleSA9IHJvdy5rZXlcbiAgfVxuXG4gIC8qKiBGaWxlIEV4cGxvcmVyJ3MgY2xpY2s6IHBsYWluLCBDdHJsIChDbWQgb24gYSBNYWMpLCBTaGlmdCwgb3IgQ3RybCtTaGlmdC4gKi9cbiAgb25Sb3dDbGljayAocm93OiBMaXN0Um93LCBldmVudDogTW91c2VFdmVudCkge1xuICAgIGNvbnN0IGN0cmwgPSBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXlcbiAgICBpZiAoIWN0cmwgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICB0aGlzLnBpY2socm93KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc2VsID0gY2xpY2tSb3codGhpcy5zZWwsIHRoaXMub3JkZXIsIHJvdy5rZXksIHsgY3RybCwgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5IH0pXG4gIH1cblxuICAvKiogU2hpZnQgYW5kIEN0cmwgY2xpY2tzIHNlbGVjdCByb3dzLCBub3QgdGhlIHRleHQgaW4gdGhlbS4gKi9cbiAgb25Sb3dNb3VzZURvd24gKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSkgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICB9XG5cbiAgLyoqIEEgcm93J3MgY2hlY2tib3ggcHV0cyBpdCBpbiBvciB0YWtlcyBpdCBvdXQsIGFzIGEgQ3RybC1jbGljayBkb2VzLiBBIHBob25lJ3MgUHJpbnQgYmFyIHN0YXlzIGFzIGl0IHdhcy4gKi9cbiAgb25DaGVjayAocm93OiBMaXN0Um93KSB7XG4gICAgY29uc3QgbmV4dCA9IHRvZ2dsZVJvdyh0aGlzLnNlbCwgdGhpcy5vcmRlciwgcm93LmtleSlcbiAgICB0aGlzLnNlbCA9IHRoaXMuaXNNb2JpbGVWaWV3cG9ydCA/IHsgLi4ubmV4dCwgY3Vyc29yOiB0aGlzLnNlbC5jdXJzb3IgfSA6IG5leHRcbiAgfVxuXG4gIC8qKiBBIGNsaWNrIG9uIHRoZSBsaXN0IHdoZXJlIHRoZXJlIGlzIG5vIHJvdyBsZXRzIGdvIG9mIGV2ZXJ5dGhpbmcuICovXG4gIG9uTGlzdENsaWNrIChldmVudDogTW91c2VFdmVudCkge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGxcbiAgICBpZiAoIXRhcmdldCB8fCB0YXJnZXQuY2xvc2VzdCgnW2RhdGEtdGlkPVwiam9icy1yb3dcIl0sIFtkYXRhLXRpZD1cImpvYnMtaGVhZFwiXSwgYnV0dG9uLCBpbnB1dCwgYSwgbmF2LCBbcm9sZT1cIm1lbnVcIl0nKSkgcmV0dXJuXG4gICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgfVxuXG4gIC8qKiBFbnRlciBvciBhIGRvdWJsZS1jbGljazogYSBmb2xkZXIgb3BlbnMsIGEgZmlsZSBvcGVucyBpdHMgcHJldmlldy4gKi9cbiAgb3BlblJvdyAocm93OiBMaXN0Um93IHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFyb3cpIHJldHVyblxuICAgIGlmIChyb3cua2luZCA9PT0gJ2ZvbGRlcicpIHtcbiAgICAgIHRoaXMub3BlbkZvbGRlcihyb3cua2V5KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc2VsZWN0ZWRLZXkgPSByb3cua2V5XG4gICAgdGhpcy5wcmV2aWV3KHJvdylcbiAgfVxuXG4gIHN0b3BTZWxlY3RpbmcgKCkge1xuICAgIHRoaXMuc2VsID0gY2xlYXJTZWxlY3Rpb24odGhpcy5zZWwpXG4gIH1cblxuICAvLyAtLSB0aGUgY29sdW1ucyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcmVhZG9ubHkgY29sdW1ucyA9IEpPQlNfQ09MVU1OU1xuXG4gIGdldCBzb3J0ICgpOiBKb2JzU29ydCB7XG4gICAgcmV0dXJuIGpvYnNQYWdlLnNvcnRcbiAgfVxuXG4gIGdldCBzb3J0RGlyICgpOiAnYXNjJyB8ICdkZXNjJyB7XG4gICAgcmV0dXJuIHNvcnREaXJlY3Rpb24oam9ic1BhZ2Uuc29ydCwgam9ic1BhZ2UucmV2ZXJzZSlcbiAgfVxuXG4gIC8qKiBBIGNsaWNrIG9uIGEgY29sdW1uIGhlYWRlciBvcmRlcnMgYnkgaXQ7IGEgc2Vjb25kIGNsaWNrIHR1cm5zIGl0IHJvdW5kLiAqL1xuICBzb3J0QnkgKGNvbHVtbjogSm9ic1NvcnQpIHtcbiAgICBjb25zdCBuZXh0ID0gbmV4dENvbHVtblNvcnQoam9ic1BhZ2UsIGNvbHVtbilcbiAgICBzZXRKb2JzU29ydChuZXh0LnNvcnQsIG5leHQucmV2ZXJzZSlcbiAgfVxuXG4gIGdldCBzZWxlY3RlZFJvd3MgKCk6IExpc3RSb3dbXSB7XG4gICAgcmV0dXJuIHRoaXMucm93cy5maWx0ZXIociA9PiB0aGlzLnNlbGVjdGlvbi5pbmNsdWRlcyhyLmtleSkpXG4gIH1cblxuICBnZXQgc2VsZWN0ZWRGaWxlcyAoKTogTGlzdFJvd1tdIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RlZFJvd3MuZmlsdGVyKHIgPT4gci5qb2IpXG4gIH1cblxuICAvKiogV2hhdCBjYW4gYmUgbW92ZWQgb3IgZGVsZXRlZDogbm90IHRoZSBmaWxlIHByaW50aW5nLCBub3IgYSBmb2xkZXIgaG9sZGluZyBpdC4gKi9cbiAgZ2V0IGNoYW5nZWFibGUgKCk6IExpc3RSb3dbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRSb3dzLmZpbHRlcihyID0+ICF0aGlzLmhvbGRzKHIua2V5KSlcbiAgfVxuXG4gIGdldCBxdWV1ZWFibGUgKCk6IExpc3RSb3dbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRGaWxlcy5maWx0ZXIociA9PiAhdGhpcy5ob2xkcyhyLmtleSkpXG4gIH1cblxuICBnZXQgaGVsZENvdW50ICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGVkUm93cy5sZW5ndGggLSB0aGlzLmNoYW5nZWFibGUubGVuZ3RoXG4gIH1cblxuICBnZXQgYWxsU2VsZWN0ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhbGxTZWxlY3RlZCh0aGlzLnNlbCwgdGhpcy5vcmRlcilcbiAgfVxuXG4gIGdldCBzb21lU2VsZWN0ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzb21lU2VsZWN0ZWQodGhpcy5zZWwsIHRoaXMub3JkZXIpXG4gIH1cblxuICB0b2dnbGVBbGwgKCkge1xuICAgIHRoaXMuc2VsID0gdGhpcy5hbGxTZWxlY3RlZCA/IGNsZWFyU2VsZWN0aW9uKHRoaXMuc2VsKSA6IHNlbGVjdEFsbCh0aGlzLnNlbCwgdGhpcy5vcmRlcilcbiAgfVxuXG4gIC8qKiBXaGF0IHRoZSBoZWFkZXIncyB0b29sYmFyIHNob3dzOiBpdHMgc2VsZWN0aW9uIGFjdGlvbnMgb25seSB3aGlsZSBzb21ldGhpbmcgaXMgc2VsZWN0ZWQuICovXG4gIEBXYXRjaCgnc2VsZWN0ZWRSb3dzJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgQFdhdGNoKCdjYW5RdWV1ZScpXG4gIHB1Ymxpc2hTZWxlY3Rpb24gKCkge1xuICAgIGpvYnNQYWdlLnNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFJvd3MubGVuZ3RoXG4gICAgam9ic1BhZ2UuY2hhbmdlYWJsZSA9IHRoaXMuY2hhbmdlYWJsZS5sZW5ndGhcbiAgICBqb2JzUGFnZS5kb3dubG9hZGFibGUgPSB0aGlzLnNlbGVjdGVkRmlsZXMubGVuZ3RoXG4gICAgam9ic1BhZ2UucXVldWVhYmxlID0gdGhpcy5jYW5RdWV1ZSA/IHRoaXMucXVldWVhYmxlLmxlbmd0aCA6IDBcbiAgICBqb2JzUGFnZS5oZWxkTm90ZSA9IHRoaXMuaGVsZENvdW50ID8gYCR7dGhpcy5wcmludGluZ1RpdGxlIHx8ICdUaGUgZmlsZSBwcmludGluZyd9IGlzIHByaW50aW5nLCBzbyBpdCBzdGF5cy5gIDogJydcbiAgfVxuXG4gIEBXYXRjaCgnbW92ZVRpY2snKVxuICBvbk1vdmVUaWNrICgpIHsgdGhpcy5tb3ZlU2VsZWN0ZWQoKSB9XG5cbiAgQFdhdGNoKCdkb3dubG9hZFRpY2snKVxuICBvbkRvd25sb2FkVGljayAoKSB7IHRoaXMuZG93bmxvYWRTZWxlY3RlZCgpIH1cblxuICBAV2F0Y2goJ2RlbGV0ZVRpY2snKVxuICBvbkRlbGV0ZVRpY2sgKCkgeyB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkgfVxuXG4gIEBXYXRjaCgncXVldWVUaWNrJylcbiAgb25RdWV1ZVRpY2sgKCkgeyB0aGlzLnF1ZXVlU2VsZWN0ZWQoKSB9XG5cbiAgQFdhdGNoKCdjbGVhclRpY2snKVxuICBvbkNsZWFyVGljayAoKSB7IHRoaXMuc3RvcFNlbGVjdGluZygpIH1cblxuICBnZXQgbW92ZVRpY2sgKCk6IG51bWJlciB7IHJldHVybiBqb2JzUGFnZS5tb3ZlVGljayB9XG4gIGdldCBkb3dubG9hZFRpY2sgKCk6IG51bWJlciB7IHJldHVybiBqb2JzUGFnZS5kb3dubG9hZFRpY2sgfVxuICBnZXQgZGVsZXRlVGljayAoKTogbnVtYmVyIHsgcmV0dXJuIGpvYnNQYWdlLmRlbGV0ZVRpY2sgfVxuICBnZXQgcXVldWVUaWNrICgpOiBudW1iZXIgeyByZXR1cm4gam9ic1BhZ2UucXVldWVUaWNrIH1cbiAgZ2V0IGNsZWFyVGljayAoKTogbnVtYmVyIHsgcmV0dXJuIGpvYnNQYWdlLmNsZWFyVGljayB9XG5cbiAgYXN5bmMgcXVldWVTZWxlY3RlZCAoKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSB8fCAhdGhpcy5jYW5RdWV1ZSkgcmV0dXJuXG4gICAgY29uc3QgcGF0aHMgPSB0aGlzLnF1ZXVlYWJsZS5tYXAociA9PiByLmtleSlcbiAgICBpZiAoIXBhdGhzLmxlbmd0aCkgcmV0dXJuXG4gICAgYXdhaXQgU29ja2V0QWN0aW9ucy5zZXJ2ZXJKb2JRdWV1ZVBvc3RKb2IocGF0aHMpXG4gICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgfVxuXG4gIGRvd25sb2FkU2VsZWN0ZWQgKCkge1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMuc2VsZWN0ZWRGaWxlcykgaWYgKHJvdy5qb2IpIHRoaXMuZG93bmxvYWRKb2Iocm93LmpvYilcbiAgfVxuXG4gIG1vdmVTZWxlY3RlZCAoKSB7XG4gICAgdGhpcy5kaWFsb2dUYXJnZXQgPSB0aGlzLmNvbW1hbmRUYXJnZXRcbiAgICB0aGlzLm1vdmVSb3dzID0gdGhpcy5jaGFuZ2VhYmxlXG4gIH1cblxuICBhc3luYyBkZWxldGVTZWxlY3RlZCAoKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuY2hhbmdlYWJsZS5maWx0ZXIociA9PiAhdGhpcy5ob2xkcyhyLmtleSkpXG4gICAgaWYgKCFyb3dzLmxlbmd0aCkgcmV0dXJuXG4gICAgLy8gT25lIHJvdyBhc2tzIGJ5IGl0cyBuYW1lLCBhcyBpdHMgbWVudSdzIERlbGV0ZSBkb2VzOyB0aGUgbGlzdCBsZXRzIGdvIG9mIGl0IG9uY2UgaXQncyBnb25lLlxuICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgYXdhaXQgdGhpcy5yZW1vdmVSb3cocm93c1swXSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBmaWxlcyA9IHJvd3MuZmlsdGVyKHIgPT4gci5raW5kID09PSAnZmlsZScpLmxlbmd0aFxuICAgIGNvbnN0IGZvbGRlcnMgPSByb3dzLmxlbmd0aCAtIGZpbGVzXG4gICAgY29uc3Qgd2hhdCA9IFtcbiAgICAgIGZpbGVzID8gYCR7ZmlsZXN9ICR7ZmlsZXMgPT09IDEgPyAnZmlsZScgOiAnZmlsZXMnfWAgOiAnJyxcbiAgICAgIGZvbGRlcnMgPyBgJHtmb2xkZXJzfSAke2ZvbGRlcnMgPT09IDEgPyAnZm9sZGVyJyA6ICdmb2xkZXJzJ31gIDogJydcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKCcgYW5kICcpXG4gICAgY29uc3QgbmFtZSA9IHJvd3MubGVuZ3RoID09PSAxID8gcm93c1swXS5uYW1lIDogd2hhdFxuICAgIGNvbnN0IG5vdGUgPSBmb2xkZXJzID8gJyBBIGZvbGRlciBnb2VzIHdpdGggZXZlcnl0aGluZyBpbiBpdC4nIDogJydcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmNvbW1hbmRUYXJnZXRcbiAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oYEl0J3MgcmVtb3ZlZCBmcm9tICR7dGhpcy5wcmludGVyTmFtZX0uJHtub3RlfSBUaGlzIGNhbid0IGJlIHVuZG9uZS5gLCB7IHRpdGxlOiBgRGVsZXRlICR7bmFtZX0/YCwgYnV0dG9uVHJ1ZVRleHQ6ICdEZWxldGUnLCBkYW5nZXI6IHRydWUgfSlcbiAgICBpZiAoIW9rIHx8IHRhcmdldCAhPT0gdGhpcy5jb21tYW5kVGFyZ2V0IHx8ICF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgLy8gVGhlIHByaW50IG1heSBoYXZlIHN0YXJ0ZWQgd2hpbGUgdGhlIHF1ZXN0aW9uIHdhcyBvcGVuLlxuICAgICAgaWYgKHRoaXMuaG9sZHMocm93LmtleSkpIGNvbnRpbnVlXG4gICAgICBpZiAocm93LmtpbmQgPT09ICdmb2xkZXInKSBTb2NrZXRBY3Rpb25zLnNlcnZlckZpbGVzRGVsZXRlRGlyZWN0b3J5KGAke3RoaXMucm9vdH0vJHtyb3cua2V5fWAsIHRydWUpXG4gICAgICBlbHNlIFNvY2tldEFjdGlvbnMuc2VydmVyRmlsZXNEZWxldGVGaWxlKGAke3RoaXMucm9vdH0vJHtyb3cua2V5fWApXG4gICAgfVxuICAgIHRoaXMuc3RvcFNlbGVjdGluZygpXG4gIH1cblxuICBjbGVhclNlYXJjaCAoKSB7XG4gICAgam9ic1BhZ2UucXVlcnkgPSAnJ1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbGUgRXhwbG9yZXIncyBrZXlzLCBvbmx5IHdoaWxlIHRoZSBsaXN0IGl0c2VsZiBoYXMgdGhlIGZvY3VzOiB0aGVcbiAgICogYXJyb3dzIChhbmQgSG9tZSwgRW5kKSBtb3ZlLCB3aXRoIFNoaWZ0IHRoZXkgc2VsZWN0IHRoZSByYW5nZSwgQ3RybCtBXG4gICAqIHNlbGVjdHMgYWxsLCBTcGFjZSBwdXRzIHRoZSByb3cgaW4gb3Igb3V0LCBFc2NhcGUgbGV0cyBnby5cbiAgICovXG4gIG9uS2V5IChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIC8vIEtleXMgb24gYSByb3cncyAuLi4gYnV0dG9uLCBhIG1lbnUgb3IgYSBmaWVsZCBiZWxvbmcgdG8gdGhlbTogb25seSB0aGUgbGlzdCBpdHNlbGYgdGFrZXMgdGhlc2UuXG4gICAgaWYgKGV2ZW50LnRhcmdldCAhPT0gdGhpcy4kcmVmcy5yb3dzKSByZXR1cm5cbiAgICBjb25zdCBvcmRlciA9IHRoaXMub3JkZXJcbiAgICBjb25zdCBtb2RzID0geyBjdHJsOiBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXksIHNoaWZ0OiBldmVudC5zaGlmdEtleSB9XG4gICAgY29uc3QgZ28gPSAoYnk6IG51bWJlciwgdG8/OiBudW1iZXIpID0+IHtcbiAgICAgIHRoaXMuc2VsID0gbW92ZUN1cnNvcih0aGlzLnNlbCwgb3JkZXIsIGJ5LCBtb2RzLCB0bylcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMuc2VsLmN1cnNvclxuICAgICAgaWYgKGtleSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJvd3MgPSBBcnJheS5mcm9tKHRoaXMuJGVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KCdbZGF0YS1rZXldJykpXG4gICAgICAgIHJvd3MuZmluZChlbCA9PiBlbC5kYXRhc2V0LmtleSA9PT0ga2V5KT8uc2Nyb2xsSW50b1ZpZXc/Lih7IGJsb2NrOiAnbmVhcmVzdCcgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlICdBcnJvd0Rvd24nOiBnbygxKTsgYnJlYWtcbiAgICAgIGNhc2UgJ0Fycm93VXAnOiBnbygtMSk7IGJyZWFrXG4gICAgICBjYXNlICdIb21lJzogZ28oMCwgMCk7IGJyZWFrXG4gICAgICBjYXNlICdFbmQnOiBnbygwLCBvcmRlci5sZW5ndGggLSAxKTsgYnJlYWtcbiAgICAgIGNhc2UgJ2EnOlxuICAgICAgY2FzZSAnQSc6XG4gICAgICAgIGlmICghbW9kcy5jdHJsIHx8IG1vZHMuc2hpZnQpIHJldHVyblxuICAgICAgICB0aGlzLnNlbCA9IHNlbGVjdEFsbCh0aGlzLnNlbCwgb3JkZXIpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdEZWxldGUnOlxuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubGVuZ3RoKSB0aGlzLmRlbGV0ZVNlbGVjdGVkKClcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZWxlY3RlZFJvdykgdGhpcy5yZW1vdmVSb3codGhpcy5zZWxlY3RlZFJvdylcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0VudGVyJzpcbiAgICAgICAgdGhpcy5vcGVuUm93KHRoaXMucm93cy5maW5kKHIgPT4gci5rZXkgPT09IHRoaXMuc2VsLmN1cnNvcikgPz8gdGhpcy5zZWxlY3RlZFJvdylcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJyAnOlxuICAgICAgICBpZiAodGhpcy5zZWwuY3Vyc29yID09PSBudWxsKSByZXR1cm5cbiAgICAgICAgdGhpcy5zZWwgPSB0b2dnbGVSb3codGhpcy5zZWwsIG9yZGVyLCB0aGlzLnNlbC5jdXJzb3IpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdFc2NhcGUnOlxuICAgICAgICBpZiAoIXRoaXMuc2VsZWN0aW9uLmxlbmd0aCkgcmV0dXJuXG4gICAgICAgIHRoaXMuc3RvcFNlbGVjdGluZygpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdCYWNrc3BhY2UnOlxuICAgICAgICBpZiAodGhpcy5wYXRoKSB0aGlzLm9wZW5Gb2xkZXIodGhpcy5wYXJlbnQpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm5cbiAgICB9XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICB9XG5cbiAgLy8gLS0gdGhlIHBpY2tlZCBmaWxlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBzdGF0cyAoKTogQXJyYXk8eyBsYWJlbDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBkb3Q/OiBib29sZWFuIH0+IHtcbiAgICBjb25zdCBqb2IgPSB0aGlzLnNlbGVjdGVkUm93Py5qb2JcbiAgICBpZiAoIWpvYikgcmV0dXJuIFtdXG4gICAgY29uc3QgZiA9IGpvYi5maWxlXG4gICAgY29uc3QgbGF5ZXJzID0gbGF5ZXJDb3VudE9mKGYpXG4gICAgY29uc3QgbWF0ZXJpYWwgPSBtYXRlcmlhbE9mKGYuZmlsYW1lbnRfdHlwZSlcbiAgICByZXR1cm4gW1xuICAgICAgeyBsYWJlbDogJ1ByaW50IHRpbWUnLCB2YWx1ZTogbGlzdER1cmF0aW9uKGYuZXN0aW1hdGVkX3RpbWUpIH0sXG4gICAgICB7IGxhYmVsOiAnTWF0ZXJpYWwnLCB2YWx1ZTogbWF0ZXJpYWwgfHwgJ+KAlCcsIGRvdDogISFtYXRlcmlhbCB9LFxuICAgICAgeyBsYWJlbDogJ0ZpbGFtZW50JywgdmFsdWU6IGYuZmlsYW1lbnRfd2VpZ2h0X3RvdGFsID8gYCR7Zi5maWxhbWVudF93ZWlnaHRfdG90YWwudG9GaXhlZCgxKX0gZ2AgOiAn4oCUJyB9LFxuICAgICAgeyBsYWJlbDogbGF5ZXJzICYmIGYubGF5ZXJfaGVpZ2h0ID8gYExheWVycyBhdCAke2YubGF5ZXJfaGVpZ2h0fSBtbWAgOiAnTGF5ZXJzJywgdmFsdWU6IGxheWVycyA/IFN0cmluZyhsYXllcnMpIDogJ+KAlCcgfVxuICAgIF1cbiAgfVxuXG4gIC8qKiBXaGF0IHRvIGtub3cgYmVmb3JlIGl0IHByaW50czogdGhlIGNoZWNrcyB0aGF0IGFyZW4ndCBmaW5lLiAqL1xuICBnZXQgd2FybmluZ3MgKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBqb2IgPSB0aGlzLnNlbGVjdGVkUm93Py5qb2JcbiAgICBpZiAoIWpvYikgcmV0dXJuIFtdXG4gICAgcmV0dXJuIHJlYWR5Q2hlY2tzKGpvYi5maWxlLCBqb2IuZmlsZW5hbWUsIHRoaXMubG9hZGVkRmlsYW1lbnQsIHRoaXMucHJpbnRlck5hbWUsIHRoaXMuYnVzeSlcbiAgICAgIC5maWx0ZXIoYyA9PiAhYy5vayAmJiAhYy50ZXh0LmVuZHNXaXRoKCdpdCBjYW4gZ28gbmV4dCBpbiB0aGUgcXVldWUnKSlcbiAgICAgIC5tYXAoYyA9PiBjLnRleHQpXG4gIH1cblxuICBjYW5TdGFydCAocm93OiBMaXN0Um93KTogYm9vbGVhbiB7XG4gICAgaWYgKCFyb3cuam9iIHx8ICF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHJvdy5wcmludGluZykgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuICF0aGlzLmJ1c3kgfHwgdGhpcy5jYW5RdWV1ZVxuICB9XG5cbiAgcHJpbnRMYWJlbCAocm93OiBMaXN0Um93KTogc3RyaW5nIHtcbiAgICBpZiAocm93LnByaW50aW5nKSByZXR1cm4gJ1ByaW50aW5nIG5vdydcbiAgICByZXR1cm4gdGhpcy5idXN5ICYmIHRoaXMuY2FuUXVldWUgPyAnQWRkIHRvIHF1ZXVlJyA6ICdQcmludCdcbiAgfVxuXG4gIGFzeW5jIHByaW50Um93IChyb3c6IExpc3RSb3cpIHtcbiAgICBpZiAoIXJvdy5qb2IgfHwgIXRoaXMuY2FuU3RhcnQocm93KSkgcmV0dXJuXG4gICAgYXdhaXQgdGhpcy5wcmludE9yUXVldWUocm93LmpvYilcbiAgfVxuXG4gIGFzeW5jIHByZXZpZXcgKHJvdzogTGlzdFJvdykge1xuICAgIGNvbnN0IGpvYiA9IHJvdy5qb2JcbiAgICBpZiAoIWpvYikgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRHY29kZShqb2IuZmlsZSlcbiAgICAgIGNvbnN0IGdjb2RlID0gcmVzcG9uc2U/LmRhdGFcbiAgICAgIGlmICghZ2NvZGUpIHJldHVyblxuICAgICAgdGhpcy4kcm91dGVyLnB1c2goeyBwYXRoOiBzY29wZWRQYXRoKCcvcHJldmlldycsIGFjdGl2ZVNsdWcoKSkgfSkuY2F0Y2goKCkgPT4ge30pXG4gICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnZ2NvZGVQcmV2aWV3L2xvYWRHY29kZScsIHsgZmlsZTogam9iLmZpbGUsIGdjb2RlIH0pXG4gICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgIGNvbnNvbGEuZXJyb3IoJ1tKb2JzXSBwcmV2aWV3IGdjb2RlJywgZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgYWN0IChhY3Rpb246IEpvYk1lbnVBY3Rpb24sIHJvdzogTGlzdFJvdykge1xuICAgIHRoaXMuZGlhbG9nVGFyZ2V0ID0gdGhpcy5jb21tYW5kVGFyZ2V0XG4gICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgIGNhc2UgJ3ByaW50JzogdGhpcy5wcmludFJvdyhyb3cpOyBicmVha1xuICAgICAgY2FzZSAncXVldWUnOiBpZiAocm93LmpvYikgdGhpcy5hZGRUb1F1ZXVlKHJvdy5qb2IpOyBicmVha1xuICAgICAgY2FzZSAncHJldmlldyc6IHRoaXMucHJldmlldyhyb3cpOyBicmVha1xuICAgICAgY2FzZSAnZG93bmxvYWQnOiBpZiAocm93LmpvYikgdGhpcy5kb3dubG9hZEpvYihyb3cuam9iKTsgYnJlYWtcbiAgICAgIGNhc2UgJ3JlbmFtZSc6IHRoaXMucmVuYW1lUm93ID0gcm93OyBicmVha1xuICAgICAgY2FzZSAnbW92ZSc6IHRoaXMubW92ZVJvd3MgPSBbcm93XTsgYnJlYWtcbiAgICAgIGNhc2UgJ2RlbGV0ZSc6IHRoaXMucmVtb3ZlUm93KHJvdyk7IGJyZWFrXG4gICAgfVxuICB9XG5cbiAgLy8gLS0gY2hhbmdpbmcgZmlsZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIHJlbW92ZVJvdyAocm93OiBMaXN0Um93KSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSB8fCB0aGlzLmhvbGRzKHJvdy5rZXkpKSByZXR1cm5cbiAgICBpZiAocm93LmtpbmQgPT09ICdmaWxlJyAmJiByb3cuam9iKSB7XG4gICAgICBhd2FpdCB0aGlzLnJlbW92ZUpvYihyb3cuam9iKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuY29tbWFuZFRhcmdldFxuICAgIGNvbnN0IG9rID0gYXdhaXQgdGhpcy4kY29uZmlybShgSXQncyByZW1vdmVkIGZyb20gJHt0aGlzLnByaW50ZXJOYW1lfS4gQSBmb2xkZXIgZ29lcyB3aXRoIGV2ZXJ5dGhpbmcgaW4gaXQuIFRoaXMgY2FuJ3QgYmUgdW5kb25lLmAsIHsgdGl0bGU6IGBEZWxldGUgJHtyb3cubmFtZX0/YCwgYnV0dG9uVHJ1ZVRleHQ6ICdEZWxldGUnLCBkYW5nZXI6IHRydWUgfSlcbiAgICBpZiAoIW9rIHx8IHRhcmdldCAhPT0gdGhpcy5jb21tYW5kVGFyZ2V0IHx8ICF0aGlzLmNvbnRyb2xSZWFkeSB8fCB0aGlzLmhvbGRzKHJvdy5rZXkpKSByZXR1cm5cbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckZpbGVzRGVsZXRlRGlyZWN0b3J5KGAke3RoaXMucm9vdH0vJHtyb3cua2V5fWAsIHRydWUpXG4gIH1cblxuICByZW5hbWUgKG5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMucmVuYW1lUm93XG4gICAgdGhpcy5yZW5hbWVSb3cgPSBudWxsXG4gICAgLy8gQ2hlY2tlZCBhZ2FpbiBub3c6IHRoZSBwcmludCBtYXkgaGF2ZSBzdGFydGVkIHdoaWxlIHRoZSBkaWFsb2cgd2FzIG9wZW4uXG4gICAgaWYgKCFyb3cgfHwgIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuZGlhbG9nVGFyZ2V0ICE9PSB0aGlzLmNvbW1hbmRUYXJnZXQgfHwgdGhpcy5ob2xkcyhyb3cua2V5KSkgcmV0dXJuXG4gICAgY29uc3QgY2xlYW4gPSBuYW1lLnRyaW0oKVxuICAgIGlmICghY2xlYW4gfHwgY2xlYW4gPT09IHJvdy5uYW1lKSByZXR1cm5cbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckZpbGVzTW92ZShgJHt0aGlzLnJvb3R9LyR7cm93LmtleX1gLCBgJHt0aGlzLmRpcn0vJHtjbGVhbn1gKVxuICB9XG5cbiAgLyoqIFdoZXJlIHRoZSByb3dzIGNhbiBnbzogZXZlcnkgZm9sZGVyIEZsdWlkZCBoYXMgbGlzdGVkLCBsZXNzIHdoZXJlIHRoZXkgYXJlIGFuZCB0aGUgZm9sZGVycyBiZWluZyBtb3ZlZC4gKi9cbiAgZ2V0IG1vdmVUYXJnZXRzICgpOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMubW92ZVJvd3NcbiAgICBpZiAoIXJvd3MpIHJldHVybiBbXVxuICAgIGNvbnN0IGtub3duID0gT2JqZWN0LmtleXModGhpcy4kc3RvcmUuc3RhdGUuZmlsZXMucGF0aEZpbGVzIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVxuICAgICAgLmZpbHRlcihwID0+IHAgPT09IHRoaXMucm9vdCB8fCBwLnN0YXJ0c1dpdGgoYCR7dGhpcy5yb290fS9gKSlcbiAgICAgIC5tYXAocCA9PiBwID09PSB0aGlzLnJvb3QgPyAnJyA6IHAuc2xpY2UodGhpcy5yb290Lmxlbmd0aCArIDEpKVxuICAgIGNvbnN0IGhlcmUgPSB0aGlzLmZvbGRlclJvd3MubWFwKHIgPT4gci5rZXkpXG4gICAgY29uc3QgbW92aW5nID0gcm93cy5maWx0ZXIociA9PiByLmtpbmQgPT09ICdmb2xkZXInKS5tYXAociA9PiByLmtleSlcbiAgICByZXR1cm4gWy4uLm5ldyBTZXQoWy4uLmtub3duLCAuLi5oZXJlLCB0aGlzLnBhcmVudF0pXVxuICAgICAgLmZpbHRlcihmID0+IGYgIT09IHRoaXMucGF0aCAmJiAhbW92aW5nLnNvbWUobSA9PiBmID09PSBtIHx8IGYuc3RhcnRzV2l0aChgJHttfS9gKSkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5sb2NhbGVDb21wYXJlKGIpKVxuICB9XG5cbiAgbW92ZUludG8gKGZvbGRlcjogc3RyaW5nKSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMubW92ZVJvd3NcbiAgICB0aGlzLm1vdmVSb3dzID0gbnVsbFxuICAgIGlmICghcm93cyB8fCAhdGhpcy5jb250cm9sUmVhZHkgfHwgdGhpcy5kaWFsb2dUYXJnZXQgIT09IHRoaXMuY29tbWFuZFRhcmdldCkgcmV0dXJuXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgLy8gQ2hlY2tlZCBhZ2FpbiBub3c6IHRoZSBwcmludCBtYXkgaGF2ZSBzdGFydGVkIHdoaWxlIHRoZSBkaWFsb2cgd2FzIG9wZW4uXG4gICAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuZGlhbG9nVGFyZ2V0ICE9PSB0aGlzLmNvbW1hbmRUYXJnZXQpIHJldHVyblxuICAgICAgaWYgKHRoaXMuaG9sZHMocm93LmtleSkpIGNvbnRpbnVlXG4gICAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckZpbGVzTW92ZShgJHt0aGlzLnJvb3R9LyR7cm93LmtleX1gLCBgJHt0aGlzLnJvb3R9LyR7Zm9sZGVyID8gYCR7Zm9sZGVyfS9gIDogJyd9JHtyb3cubmFtZX1gKVxuICAgIH1cbiAgICB0aGlzLnN0b3BTZWxlY3RpbmcoKVxuICB9XG5cbiAgbWFrZUZvbGRlciAobmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgY29uc3QgY2xlYW4gPSBuYW1lLnRyaW0oKVxuICAgIGlmIChjbGVhbikgU29ja2V0QWN0aW9ucy5zZXJ2ZXJGaWxlc1Bvc3REaXJlY3RvcnkoYCR7dGhpcy5kaXJ9LyR7Y2xlYW59YClcbiAgfVxuXG4gIEBXYXRjaCgnY29tbWFuZFRhcmdldCcpXG4gIG9uQ29tbWFuZFRhcmdldCAoKSB7XG4gICAgdGhpcy5zZWxlY3RlZEtleSA9IG51bGxcbiAgICB0aGlzLnJlbmFtZVJvdyA9IG51bGxcbiAgICB0aGlzLm1vdmVSb3dzID0gbnVsbFxuICAgIHRoaXMuZm9sZGVyRGlhbG9nID0gZmFsc2VcbiAgICB0aGlzLmRpYWxvZ1RhcmdldCA9IG51bGxcbiAgICB0aGlzLnN0b3BTZWxlY3RpbmcoKVxuICAgIHRoaXMub3BlbkZvbGRlcignJylcbiAgfVxuXG4gIEBXYXRjaCgnZm9sZGVyVGljaycpXG4gIG9uRm9sZGVyVGljayAoKSB7XG4gICAgaWYgKHRoaXMuY29udHJvbFJlYWR5KSB0aGlzLmZvbGRlckRpYWxvZyA9IHRydWVcbiAgfVxuXG4gIGdldCBmb2xkZXJUaWNrICgpOiBudW1iZXIgeyByZXR1cm4gam9ic1BhZ2UuZm9sZGVyVGljayB9XG5cbiAgLy8gLS0gdXBsb2FkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCB1cGxvYWRUaWNrICgpOiBudW1iZXIgeyByZXR1cm4gam9ic1BhZ2UudXBsb2FkVGljayB9XG5cbiAgQFdhdGNoKCd1cGxvYWRUaWNrJylcbiAgb25VcGxvYWRUaWNrICgpIHtcbiAgICB0aGlzLnBpY2tVcGxvYWQoKVxuICB9XG5cbiAgLyoqIFRoZSByb290J3Mgb3duIGxpc3QsIGFuZCBvbiB0aGUgRy1jb2RlIHJvb3QgdGhlIG1vZGVscyBTbGljZSBvcGVucyAoS0FOLTIxOTEpLiAqL1xuICBnZXQgZ2NvZGVBY2NlcHQgKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ2ZpbGVzL2dldFJvb3RQcm9wZXJ0aWVzJ10odGhpcy5yb290KSBhcyB7IGFjY2VwdHM/OiBzdHJpbmdbXSB9IHwgdW5kZWZpbmVkXG4gICAgcmV0dXJuIFsuLi4ocm9vdD8uYWNjZXB0cyA/PyBbXSksIC4uLih0aGlzLnJvb3QgPT09ICdnY29kZXMnID8gTU9ERUxfQUNDRVBUIDogW10pXS5qb2luKCcsJylcbiAgfVxuXG4gIHBpY2tVcGxvYWQgKCkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgICh0aGlzLiRyZWZzLnVwbG9hZCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jbGljaygpXG4gIH1cblxuICAvKiogVXBsb2FkcyBnbyBpbnRvIHRoZSBmb2xkZXIgdGhhdCdzIG9wZW47IG9uZSBHLWNvZGUgZmlsZSBvbiBpdHMgb3duIGlzIG9mZmVyZWQgdG8gcHJpbnQuICovXG4gIGFzeW5jIG9uUGlja2VkIChldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBpbnB1dCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgY29uc3QgcGlja2VkID0gWy4uLihpbnB1dC5maWxlcyA/PyBbXSldXG4gICAgaW5wdXQudmFsdWUgPSAnJ1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgIXBpY2tlZC5sZW5ndGgpIHJldHVyblxuICAgIC8vIEEgbW9kZWwgaXMgU2xpY2UncyB0byBvcGVuLCBub3QgYSBmaWxlIGZvciB0aGUgcHJpbnRlciwgYXMgYSBkcm9wcGVkIG9uZSBpcy5cbiAgICBjb25zdCBtb2RlbHMgPSB0aGlzLnJvb3QgPT09ICdnY29kZXMnID8gcGlja2VkLmZpbHRlcihmID0+IGlzTW9kZWxGaWxlKGYubmFtZSkpIDogW11cbiAgICBpZiAobW9kZWxzLmxlbmd0aCkgRXZlbnRCdXMuYnVzLiRlbWl0KCdtb2RlbC1kcm9wcGVkJywgbW9kZWxzKVxuICAgIGNvbnN0IGZpbGVzID0gcGlja2VkLmZpbHRlcihmID0+ICFtb2RlbHMuaW5jbHVkZXMoZikpXG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuY29tbWFuZFRhcmdldFxuICAgIGNvbnN0IHBhdGggPSB0aGlzLnBhdGhcbiAgICBjb25zdCBzdGlsbEN1cnJlbnQgPSAoKSA9PiB0YXJnZXQgPT09IHRoaXMuY29tbWFuZFRhcmdldCAmJiB0aGlzLmNvbnRyb2xSZWFkeVxuICAgIGNvbnN0IHVwbG9hZGVkID0gYXdhaXQgdGhpcy51cGxvYWRGaWxlcyhmaWxlcywgcGF0aCwgdGhpcy5yb290LCBmYWxzZSwgc3RpbGxDdXJyZW50KVxuICAgIGlmICh1cGxvYWRlZCA9PT0gZmFsc2UgfHwgIXN0aWxsQ3VycmVudCgpKSB7XG4gICAgICBFdmVudEJ1cy4kZW1pdCgnU3RvcHBlZDogdGhlIHByaW50ZXIgY2hhbmdlZCcsIHsgdHlwZTogJ3dhcm5pbmcnLCB0aW1lb3V0OiA1MDAwIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgZmlsZXBhdGggPSBwYXRoID8gYCR7cGF0aH0vJHtmaWxlc1swXS5uYW1lfWAgOiBmaWxlc1swXS5uYW1lXG4gICAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMSAmJiBpc0djb2RlRmlsZShmaWxlc1swXS5uYW1lKSAmJiB1cGxvYWRlZC5pbmNsdWRlcyhmaWxlcGF0aCkpIHtcbiAgICAgIEV2ZW50QnVzLmJ1cy4kZW1pdCgnam9iLXJlYWR5JywgZmlsZXBhdGgpXG4gICAgfVxuICB9XG5cbiAgLy8gLS0gdGhlIHF1ZXVlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGZpbGVGb3IgKGZpbGVuYW1lOiBzdHJpbmcpOiBKb2JGaWxlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5qb2JGaWxlcy5maW5kKGogPT4gai5wYXRoID09PSBmaWxlbmFtZSlcbiAgfVxuXG4gIHRodW1ibmFpbE9mIChmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5maWxlRm9yKGZpbGVuYW1lKT8udGh1bWJuYWlsID8/ICcnXG4gIH1cblxuICB0aHVtYm5haWxLZXlPZiAoZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZUZvcihmaWxlbmFtZSk/LnRodW1ibmFpbEtleSA/PyAnJ1xuICB9XG5cbiAgdGl0bGVPZiAoZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGpvYlRpdGxlKGZpbGVuYW1lKVxuICB9XG5cbiAgZmFjdHNPZiAoZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZUZvcihmaWxlbmFtZSk/LmZhY3RzID8/ICcnXG4gIH1cblxuICB1bnF1ZXVlIChqb2I6IFF1ZXVlZEpvYikge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgIFNvY2tldEFjdGlvbnMuc2VydmVySm9iUXVldWVEZWxldGVKb2JzKFtqb2Iuam9iX2lkXSlcbiAgfVxuXG4gIGFzeW5jIGNsZWFyUXVldWUgKCkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuY29tbWFuZFRhcmdldFxuICAgIGNvbnN0IGpvYnMgPSB0aGlzLnF1ZXVlLm1hcChqID0+IGouam9iX2lkKVxuICAgIGNvbnN0IG9rID0gYXdhaXQgdGhpcy4kY29uZmlybShgVGhlIGZpbGVzIHN0YXkgb24gJHt0aGlzLnByaW50ZXJOYW1lfS5gLCB7IHRpdGxlOiBgVGFrZSBhbGwgJHtqb2JzLmxlbmd0aH0gam9icyBvdXQgb2YgdGhlIHF1ZXVlP2AsIGJ1dHRvblRydWVUZXh0OiAnQ2xlYXIgdGhlIHF1ZXVlJywgZGFuZ2VyOiB0cnVlIH0pXG4gICAgaWYgKG9rICYmIHRhcmdldCA9PT0gdGhpcy5jb21tYW5kVGFyZ2V0ICYmIHRoaXMuY29udHJvbFJlYWR5KSBTb2NrZXRBY3Rpb25zLnNlcnZlckpvYlF1ZXVlRGVsZXRlSm9icyhqb2JzKVxuICB9XG5cbiAgc3RhcnRRdWV1ZSAoKSB7XG4gICAgaWYgKHRoaXMuY29udHJvbFJlYWR5KSBTb2NrZXRBY3Rpb25zLnNlcnZlckpvYlF1ZXVlU3RhcnQoKVxuICB9XG5cbiAgYXN5bmMgbW92ZVF1ZXVlZCAoam9iOiBRdWV1ZWRKb2IsIGJ5OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm5cbiAgICBjb25zdCBqb2JzID0gWy4uLnRoaXMucXVldWVdXG4gICAgY29uc3QgZnJvbSA9IGpvYnMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5qb2JfaWQgPT09IGpvYi5qb2JfaWQpXG4gICAgY29uc3QgdG8gPSBmcm9tICsgYnlcbiAgICBpZiAoZnJvbSA8IDAgfHwgdG8gPCAwIHx8IHRvID49IGpvYnMubGVuZ3RoKSByZXR1cm5cbiAgICBqb2JzLnNwbGljZSh0bywgMCwgam9icy5zcGxpY2UoZnJvbSwgMSlbMF0pXG4gICAgYXdhaXQgU29ja2V0QWN0aW9ucy5zZXJ2ZXJKb2JRdWV1ZVBvc3RKb2Ioam9icy5tYXAoaXRlbSA9PiBpdGVtLmZpbGVuYW1lKSwgdHJ1ZSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmpvYnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE2cHg7XG4gIH1cblxuICAvLyAtLSBVcCBuZXh0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAuam9ic19fc291cmNlIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xuICAgIHBhZGRpbmc6IDNweDtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7XG5cbiAgICBidXR0b24ge1xuICAgICAgcGFkZGluZzogNnB4IDE2cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuXG4gICAgICAmW2FyaWEtcHJlc3NlZD0ndHJ1ZSddIHtcbiAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC5qb2JzX19uZXh0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMHB4O1xuICAgIHBhZGRpbmc6IDE4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gIH1cblxuICAuam9ic19fbmV4dC1oZWFkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuXG4gICAgaDIge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgZm9udC1zaXplOiAxN3B4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG4gIH1cblxuICAuam9ic19fY291bnQge1xuICAgIHBhZGRpbmc6IDFweCA4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAuam9ic19faGludCB7XG4gICAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLmpvYnNfX2xpbmsge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcblxuICAgICY6ZGlzYWJsZWQge1xuICAgICAgb3BhY2l0eTogMC40NTtcbiAgICB9XG4gIH1cblxuICAuam9ic19fbmV4dC1saXN0IHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjIwcHgsIDFmcikpO1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLmpvYnNfX3F1ZXVlZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgcGFkZGluZzogOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAuam9ic19fcXVldWVkLXRleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBtaW4td2lkdGg6IDA7XG5cbiAgICBiIHtcbiAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIH1cbiAgfVxuXG4gIC5qb2JzX191bnF1ZXVlIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAgIHBhZGRpbmc6IDZweDtcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcblxuICAgICYgKyAmIHtcbiAgICAgIG1hcmdpbi1sZWZ0OiAwO1xuICAgIH1cblxuICAgICY6aG92ZXI6bm90KDpkaXNhYmxlZCkge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB9XG5cbiAgICAmOmRpc2FibGVkIHtcbiAgICAgIG9wYWNpdHk6IDAuNDtcbiAgICB9XG4gIH1cblxuICAuam9ic19fcmVhZG9ubHkge1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAxMnB4IDE2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAvLyAtLSBUaGUgbGlzdCBhbmQgdGhlIHRpbGUgYmVzaWRlIGl0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC5qb2JzX19ncmlkIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KDAsIDJmcikgbWlubWF4KDMwMHB4LCAxZnIpO1xuICAgIGFsaWduLWl0ZW1zOiBzdGFydDtcbiAgICBnYXA6IDE2cHg7XG4gIH1cblxuICAuam9ic19fbGlzdCxcbiAgLmpvYnNfX2RldGFpbCB7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICB9XG5cbiAgLmpvYnNfX2xpc3Qge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gIH1cblxuICAuam9ic19fZGV0YWlsIHtcbiAgICBwb3NpdGlvbjogc3RpY2t5O1xuICAgIHRvcDogODhweDtcbiAgICBwYWRkaW5nOiAxOHB4O1xuICB9XG5cbiAgLmpvYnNfX2NydW1icyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDZweDtcbiAgICBwYWRkaW5nOiAxMHB4IDE4cHg7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuXG4gICAgYnV0dG9uIHtcbiAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIGdhcDogNnB4O1xuICAgICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuXG4gICAgICAmOmRpc2FibGVkIHtcbiAgICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAuam9ic19fZ3JvdyB7XG4gICAgZmxleDogMSAxIGF1dG87XG4gIH1cblxuICAuam9ic19fZGFuZ2VyIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcikgIWltcG9ydGFudDtcbiAgfVxuXG4gIC5qb2JzX19ib3gge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgd2lkdGg6IDE4cHg7XG4gICAgaGVpZ2h0OiAxOHB4O1xuICAgIGFjY2VudC1jb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuam9ic19fcHJpbnRpbmctbGluayB7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICB9XG5cbiAgLmpvYnNfX3JvdyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IG1pbm1heCgwLCAzZnIpIDFmciAxLjNmciAxZnIgMS4zZnIgNDRweDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4taGVpZ2h0OiA2NHB4O1xuICAgIHBhZGRpbmc6IDhweCAxMnB4IDhweCAxOHB4O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICB1c2VyLXNlbGVjdDogbm9uZTtcblxuICAgICYgKyAmIHtcbiAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICB9XG4gIH1cblxuICAuam9ic19fcm93LS1oZWFkIHtcbiAgICBtaW4taGVpZ2h0OiA0NHB4O1xuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGN1cnNvcjogZGVmYXVsdDtcbiAgfVxuXG4gIC5qb2JzX19oZWFkLW5hbWUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLmpvYnNfX3NvcnQge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA0cHg7XG4gICAgbWluLWhlaWdodDogMzJweDtcbiAgICBwYWRkaW5nOiAwIDhweDtcbiAgICBtYXJnaW4tbGVmdDogLThweDtcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgY29sb3I6IGluaGVyaXQ7XG4gICAgZm9udDogaW5oZXJpdDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIGp1c3RpZnktc2VsZjogc3RhcnQ7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB9XG5cbiAgICAmOmZvY3VzLXZpc2libGUge1xuICAgICAgb3V0bGluZTogMnB4IHNvbGlkIHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC5qb2JzX19zb3J0LS1vbiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5qb2JzX19hcnJvdyB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5qb2JzX19zciB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHdpZHRoOiAxcHg7XG4gICAgaGVpZ2h0OiAxcHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBjbGlwOiByZWN0KDAgMCAwIDApO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAuam9ic19fcm93LS1jdXJzb3I6bm90KC5qb2JzX19yb3ctLXNlbCkge1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDNweCAwIDAgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcsIHZhcigtLW0zZC1ib3JkZXIpKTtcbiAgfVxuXG4gIC5qb2JzX19yb3ctLXNlbC5qb2JzX19yb3ctLWN1cnNvciB7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgM3B4IDAgMCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5qb2JzX19yb3ctLW5vdyB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAuam9ic19fcm93LS1zZWwge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gIH1cblxuICAuam9ic19fcm93cyB7XG4gICAgcGFkZGluZy1ib3R0b206IDE2cHg7XG4gIH1cblxuICAuam9ic19fcm93czpmb2N1cy12aXNpYmxlIHtcbiAgICBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgb3V0bGluZS1vZmZzZXQ6IC0ycHg7XG4gIH1cblxuICAuam9ic19fbmFtZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuam9ic19fbmFtZS10ZXh0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAzcHg7XG4gICAgbWluLXdpZHRoOiAwO1xuXG4gICAgYiB7XG4gICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICB9XG4gIH1cblxuICAuam9ic19fc3ViIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5qb2JzX190aHVtYiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDQ0cHg7XG4gICAgaGVpZ2h0OiA0NHB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoMTAwJSAxMDAlIGF0IDUwJSAzNSUsICMyZjMxMzMgMCUsICMxZjIwMjIgNzAlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcblxuICAgIGltZyB7XG4gICAgICB3aWR0aDogOTAlO1xuICAgICAgaGVpZ2h0OiA5MCU7XG4gICAgICBvYmplY3QtZml0OiBjb250YWluO1xuICAgIH1cbiAgfVxuXG4gIC5qb2JzX190aHVtYi0tc21hbGwge1xuICAgIHdpZHRoOiAzNnB4O1xuICAgIGhlaWdodDogMzZweDtcbiAgfVxuXG4gIC5qb2JzX190aHVtYi0tZm9sZGVyIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLmpvYnNfX2NlbGwge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5qb2JzX19kb3Qge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB3aWR0aDogOXB4O1xuICAgIGhlaWdodDogOXB4O1xuICAgIG1hcmdpbi1yaWdodDogNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgdmVydGljYWwtYWxpZ246IC0xcHg7XG4gIH1cblxuICAuam9ic19fZW5kIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDRweDtcbiAgfVxuXG4gIC5qb2JzX19jaGVjayB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICB9XG5cbiAgLmpvYnNfX3BjdCB7XG4gICAgcGFkZGluZzogM3B4IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICAuam9ic19fYmFyIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBoZWlnaHQ6IDRweDtcbiAgICBtYXJnaW4tdG9wOiA0cHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG5cbiAgICBpIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLy8gLS0gVGhlIGRldGFpbCB0aWxlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC5qb2JzX19kZXRhaWwtaGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtYXJnaW4tYm90dG9tOiAxNHB4O1xuXG4gICAgYiB7XG4gICAgICBmbGV4OiAxIDEgMDtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgfVxuICB9XG5cbiAgLmpvYnNfX3BpY3R1cmUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBhc3BlY3QtcmF0aW86IDQgLyAzO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoOTAlIDgwJSBhdCA1MCUgNDUlLCAjMmYzMTMzIDAlLCAjMWIxYzFlIDgwJSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG5cbiAgICBpbWcge1xuICAgICAgd2lkdGg6IDg4JTtcbiAgICAgIGhlaWdodDogODglO1xuICAgICAgb2JqZWN0LWZpdDogY29udGFpbjtcbiAgICB9XG4gIH1cblxuICAuam9ic19fZmlsZW5hbWUge1xuICAgIG1hcmdpbjogMTBweCAwIDA7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLmpvYnNfX3N0YXRzIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmcjtcbiAgICBnYXA6IDEwcHg7XG4gICAgbWFyZ2luOiAxNHB4IDA7XG5cbiAgICBkaXYge1xuICAgICAgcGFkZGluZzogMTBweCAxMnB4O1xuICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIH1cblxuICAgIGRkIHtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgfVxuXG4gICAgZHQge1xuICAgICAgb3JkZXI6IDI7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDQwMDtcbiAgICB9XG5cbiAgICBkaXYge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgfVxuICB9XG5cbiAgLmpvYnNfX3dhcm5pbmctaWNvbiB7XG4gICAgbWFyZ2luLXJpZ2h0OiA2cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmpvYnNfX3dhcm5pbmdzIHtcbiAgICBtYXJnaW46IDAgMCAxNHB4O1xuICAgIHBhZGRpbmc6IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgfVxuXG4gIC5qb2JzX19hY3Rpb25zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGdhcDogMTBweDtcbiAgfVxuXG4gIC5qb2JzX19wcmludCB7XG4gICAgZmxleDogMSAxIGF1dG87XG4gIH1cblxuICAvLyAtLSBFbXB0eSBhbmQgbG9hZGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAuam9ic19fZW1wdHkge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIHBhZGRpbmc6IDQ4cHggMjRweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5cbiAgICBiIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgfVxuICB9XG5cbiAgLmpvYnNfX2VtcHR5LWljb24ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogNTZweDtcbiAgICBoZWlnaHQ6IDU2cHg7XG4gICAgbWFyZ2luLWJvdHRvbTogNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAuam9ic19fc2tlbGV0b24tcm93IHtcbiAgICBoZWlnaHQ6IDY0cHg7XG4gICAgbWFyZ2luOiAwIDE4cHg7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCg5MGRlZywgdHJhbnNwYXJlbnQsIHZhcigtLW0zZC1zdXJmYWNlLTIpLCB0cmFuc3BhcmVudCk7XG4gICAgb3BhY2l0eTogMC42O1xuICB9XG5cbiAgLmpvYnNfX3VwbG9hZCB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgfVxuXG4gIC5qb2JzX19ub3RlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5qb2JzX19tb3ZlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA2cHg7XG4gICAgcGFkZGluZzogMjBweDtcbiAgICBib3JkZXItcmFkaXVzOiAyMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLXNvbGlkLCB2YXIoLS1tM2Qtc3VyZmFjZSkpO1xuXG4gICAgaDMge1xuICAgICAgbWFyZ2luOiAwIDAgOHB4O1xuICAgIH1cbiAgfVxuXG4gIC5qb2JzX19tb3ZlLXRvIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICAgIHBhZGRpbmc6IDEwcHggMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIH1cbiAgfVxuXG4gIC5qb2JzX19tb3ZlLWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBtYXJnaW4tdG9wOiA4cHg7XG4gIH1cblxuICAvLyAtLSBBIHBob25lOiByb3dzLCBhbmQgUHJpbnQgaW4gYSBiYXIgYWJvdmUgdGhlIHRhYiBiYXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC5qb2JzLS1waG9uZSB7XG4gICAgLmpvYnNfX2dyaWQge1xuICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMWZyKTtcbiAgICB9XG5cbiAgICAuam9ic19fcm93IHtcbiAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KDAsIDFmcikgYXV0bztcbiAgICAgIG1pbi1oZWlnaHQ6IDcycHg7XG4gICAgICBwYWRkaW5nOiAxMHB4IDE0cHg7XG4gICAgfVxuXG4gICAgLmpvYnNfX3Jvdy0taGVhZCB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZ2FwOiA0cHggMTRweDtcbiAgICAgIG1pbi1oZWlnaHQ6IDQ4cHg7XG4gICAgICBvdmVyZmxvdy14OiBhdXRvO1xuICAgICAgc2Nyb2xsYmFyLXdpZHRoOiBub25lO1xuICAgIH1cblxuICAgIC5qb2JzX19zb3J0IHtcbiAgICAgIG1pbi1oZWlnaHQ6IDQwcHg7XG4gICAgfVxuXG4gICAgLmpvYnNfX2JveCB7XG4gICAgICB3aWR0aDogMjJweDtcbiAgICAgIGhlaWdodDogMjJweDtcbiAgICB9XG5cbiAgICAuam9ic19fdGh1bWIge1xuICAgICAgd2lkdGg6IDU2cHg7XG4gICAgICBoZWlnaHQ6IDU2cHg7XG4gICAgfVxuICB9XG5cbiAgLmpvYnNfX3N0aWNreSB7XG4gICAgcG9zaXRpb246IHN0aWNreTtcbiAgICBib3R0b206IGNhbGMoNzZweCArIGVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKSk7XG4gICAgei1pbmRleDogNTtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGdhcDogMTBweDtcbiAgICBtYXJnaW46IDAgLThweDtcbiAgICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1nbGFzcy10aGljaywgdmFyKC0tbTNkLXN1cmZhY2UpKTtcbiAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigyMHB4KTtcbiAgICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoMjBweCk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvdmlld3MvSm9icy52dWUifQ==