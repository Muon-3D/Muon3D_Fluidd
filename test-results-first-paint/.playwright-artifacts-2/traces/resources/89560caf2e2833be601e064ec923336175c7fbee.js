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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import PrinterStage from "/src/components/printers/PrinterStage.vue";
import M1Parts from "/src/components/m1/M1Parts.vue";
import { Waits } from "/src/globals.ts";
import { claimLiveView } from "/src/services/m1-3d/live-slot.ts";
import { built, canDrawWebgl, loadViewer, newCanvas, park, prebuild, takeParked, viewerKey } from "/src/services/m1-3d/parked.ts";
import { liveSyncFor } from "/src/services/m1-3d/live-sync.ts";
import { fansFrom, liveAccessories, sameAccessories } from "/src/services/m1-3d/accessories.ts";
import { plateTaps, screenFrom } from "/src/services/m1-3d/live-state.ts";
import { motionPathFrom } from "/src/services/m1-3d/motion.ts";
import { modelPose, samePose } from "/src/services/m1-3d/pose.ts";
import { partColour, segmentsDone, toolpathFrom, toolpathFromGcode } from "/src/services/m1-3d/toolpath.ts";
import { modelAnimates, modelDetail, modelGlass } from "/src/services/m1-3d/render-options.ts";
import { modelSettings } from "/src/services/m1-3d/device-settings.ts";
import { httpClientActions } from "/src/api/httpClientActions.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { bannerVisible } from "/src/services/updates/model.ts";
import { updateWatch } from "/src/services/updates/watch.ts";
import { afterFirstPaint } from "/src/services/startup/idle.ts";
const playingByView = /* @__PURE__ */ new WeakMap();
const AUTO_LOAD_BYTES = 16 * 1024 * 1024;
const PART_ONLY_BYTES = 96 * 1024 * 1024;
const MAX_FOLLOWED_MOVES = 2e6;
const TAP_LINGER_MS = 6e4;
const PART_STATES = ["printing", "paused", "complete", "cancelled", "error"];
let M1Live = class extends Mixins(MaintenanceMixin) {
  state;
  shift;
  parts;
  /** Whether this view holds the live M1 and has a canvas for it. */
  live = false;
  /** Whether the model has drawn, so the picture can go. */
  shown = false;
  viewer = null;
  canvas = null;
  giveBack = null;
  visible = false;
  observer = null;
  stopReports = null;
  reducedMotionQuery = null;
  reducedMotionListener = null;
  lastAccessories = null;
  /** The system's prefers-reduced-motion, the animations' default. */
  reducedMotion = false;
  /** What the viewer on the stage was built with (see viewerKey). */
  heldKey = "";
  /** The print drawn, built from the preview once per file; frozen, so Vue leaves it alone. */
  printPath = null;
  /** The same file as moves to follow the head along; frozen too. */
  motionPath = null;
  printPathFor = "";
  loadingFor = "";
  /** A job whose part was read straight from its file, too big for the preview. */
  partOnlyFor = "";
  /** The last pose and report passed on, so an unchanged one draws nothing. */
  lastPose = null;
  lastReport = "";
  /** The marks on the plate, kept a while after the touching ends. */
  tapsShown = [];
  tapsTimer = 0;
  /** Set on destroy so an idle callback still owed does nothing (KAN-525). */
  gone = false;
  /** Set once the view has been seen and the app has painted; nothing loads the viewer before. */
  armed = false;
  /** This printer's sync, which outlives the view. Not data: Vue mustn't walk it. */
  sync() {
    return liveSyncFor(activeSlug() ?? this.$store.state.config.apiUrl ?? "");
  }
  /** Settings › G-code preview and 3D › Show the 3D printer; off, the stage shows its picture. */
  get showModel() {
    return modelSettings.show;
  }
  get viewerSettings() {
    return {
      detail: modelDetail(modelSettings.detail),
      glass: modelGlass(modelSettings.glass),
      animate: modelAnimates(modelSettings.animations, this.reducedMotion)
    };
  }
  /** The print so far on the model's plate, unless Settings turned that off. */
  get shownPrintPath() {
    return modelSettings.printGrowing ? this.printPath : null;
  }
  onShownPrintPath() {
    this.viewer?.setPrint(this.shownPrintPath, this.partColour);
  }
  onViewerSettings(settings) {
    this.sync().accessories.reducedMotion = !settings.animate;
    this.viewer?.wake();
  }
  onShowModel(show) {
    if (show) this.wake();
    else this.stop();
  }
  get pose() {
    return modelPose({
      position: this.position,
      homed: this.homedAxes,
      lights: this.hasLights && this.lightsValue > 0,
      progress: this.$store.getters["printer/getPrintProgress"] * 100
    });
  }
  get printState() {
    return this.$store.state.printer.printer.print_stats?.state ?? "";
  }
  /**
   * The fans as the printer reports them. The accurate model has no fan to
   * turn (the deck fan is part of the base's one mesh, and there is no part
   * fan), so they are only marked on the stage's element.
   */
  get fanFacts() {
    return fansFrom(this.$store.state.printer.printer);
  }
  /**
   * The plate, toolhead, Z column and filament the model shows: from Harry's
   * printer-state machine (Klipper's m1_machine) when the printer runs it,
   * else from each sensor (accessories.ts). Null until the printer's first
   * status has arrived (see liveAccessories).
   */
  get accessories() {
    return liveAccessories(
      this.$store.state.printer.printer,
      this.$store.state.console.promptDialog,
      this.$store.state.socket.acceptingNotifications === true
    );
  }
  mounted() {
    this.sync().setPose(this.pose);
    this.reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    this.reducedMotion = this.reducedMotionQuery?.matches ?? false;
    this.sync().accessories.reducedMotion = !this.viewerSettings.animate;
    this.reducedMotionListener = (event) => {
      this.reducedMotion = event.matches;
      this.viewer?.wake();
    };
    if (this.reducedMotionQuery?.addEventListener) {
      this.reducedMotionQuery.addEventListener("change", this.reducedMotionListener);
    } else {
      this.reducedMotionQuery?.addListener?.(this.reducedMotionListener);
    }
    this.stopReports = this.$store.subscribeAction({
      after: (action) => {
        if (action.type === "printer/onFastNotifyStatusUpdate" && action.payload?.key === "motion_report") this.report();
      }
    });
    if (typeof IntersectionObserver === "undefined") return;
    this.observer = new IntersectionObserver((entries) => {
      this.visible = entries.some((e) => e.isIntersecting);
      if (this.visible && !this.armed) {
        afterFirstPaint(() => {
          if (this.gone || !canDrawWebgl()) return;
          this.armed = true;
          prebuild();
          this.wake();
        });
      }
      this.wake();
    });
    this.observer.observe(this.$el);
    document.addEventListener("visibilitychange", this.wake);
  }
  beforeDestroy() {
    this.gone = true;
    this.stopReports?.();
    if (this.reducedMotionListener) {
      if (this.reducedMotionQuery?.removeEventListener) {
        this.reducedMotionQuery.removeEventListener("change", this.reducedMotionListener);
      } else {
        this.reducedMotionQuery?.removeListener?.(this.reducedMotionListener);
      }
    }
    this.reducedMotionQuery = null;
    this.reducedMotionListener = null;
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.wake);
    clearTimeout(this.tapsTimer);
    this.stop();
  }
  /** Starts the live M1 when it can show (on screen, the printer there), and draws only while it shows. */
  wake() {
    if (!this.armed) return;
    const showing = this.visible && this.showModel && this.state !== "offline" && !document.hidden;
    this.viewer?.setActive(showing);
    if (showing && !this.live) this.start();
  }
  async start() {
    if (!this.armed || !this.showModel) return;
    this.live = true;
    this.giveBack = claimLiveView(() => this.stop());
    try {
      await built();
      let held = takeParked();
      if (!held) {
        const { createViewer } = await loadViewer();
        await this.$nextTick();
        if (!this.live || !this.$refs.slot) return;
        const canvas2 = newCanvas();
        this.$refs.slot.appendChild(canvas2);
        held = { viewer: createViewer(canvas2), canvas: canvas2, key: viewerKey() };
      } else {
        await this.$nextTick();
        const slot = this.$refs.slot;
        if (!this.live || !slot) {
          park(held);
          return;
        }
        slot.appendChild(held.canvas);
      }
      const { viewer, canvas } = held;
      this.canvas = canvas;
      this.heldKey = held.key;
      viewer.setActive(true);
      viewer.restyle();
      viewer.onFrame = () => {
        this.shown = true;
        viewer.onFrame = null;
      };
      viewer.setShift(this.shift);
      viewer.onDraw = (drawn) => this.markDrawn(drawn);
      this.viewer = viewer;
      this.sync().setPose(this.pose);
      this.lastReport = "";
      this.report();
      viewer.follow(this.sync());
      this.onPrintFile();
      this.onScreen(this.screen);
      this.onLeds();
      viewer.setTaps(this.tapsShown);
    } catch (e) {
      console.warn("[m1] the live M1 could not start; showing its picture", e);
      this.stop();
    }
  }
  /** Lets the live M1 go, parking it for the next view. */
  stop() {
    const viewer = this.viewer;
    const canvas = this.canvas;
    if (viewer) viewer.onDraw = null;
    this.viewer = null;
    this.canvas = null;
    this.live = false;
    this.shown = false;
    this.giveBack?.();
    this.giveBack = null;
    if (viewer && canvas) park({ viewer, canvas, key: this.heldKey });
  }
  /**
   * Marks what the model drew on the stage's element (data-model,
   * data-plate, data-toolhead, data-column, data-filament, and data-spool and
   * data-plug, on or off): the state once a clip ends, the clip's name while it plays. data-played lists the last
   * clips started ("part:clip", newest last), so a test can see a clip ran
   * even when a slow renderer draws none of its frames. Written straight to
   * the element, not through Vue, since it runs every frame.
   */
  markDrawn({ model, accessories: a, spool, plug, colour, seeThrough, phi, nozzle, knob, strand }) {
    const el = this.$el;
    if (!el?.dataset) return;
    const marks = { model, spool: spool ? "on" : "off", plug: plug ? "on" : "off" };
    marks.filamentColour = colour === null ? "" : `#${colour.toString(16).padStart(6, "0")}`;
    marks.plateSee = seeThrough === null ? "" : seeThrough.toFixed(2);
    marks.cameraPhi = phi.toFixed(3);
    marks.nozzle = nozzle ? `${nozzle.x},${nozzle.y}` : "";
    marks.knob = knob ? knob.angle.toFixed(2) : "";
    marks.knobPushed = knob?.pushed ? "on" : "off";
    marks.knobAt = knob ? `${knob.x},${knob.y}` : "";
    marks.knobRim = knob ? `${knob.rim.x},${knob.rim.y}` : "";
    marks.knobPresses = knob ? String(knob.presses) : "";
    marks.knobPeak = knob ? knob.peak.toFixed(2) : "";
    marks.knobArc = knob ? String(knob.arc) : "";
    marks.strandEnd = strand ? `${strand.x},${strand.y}` : "";
    marks.strandHole = strand ? `${strand.hole.x},${strand.hole.y}` : "";
    if (a) {
      marks.plate = a.plate.clip ?? (a.plate.on ? "on" : "off");
      marks.toolhead = a.tube.clip ?? (a.tube.attached ? a.tube.unlocking ? "unlocking" : "connected" : "disconnected");
      marks.column = a.column.clip ?? a.column.state;
      marks.filament = a.filament.clip ?? (a.filament.loaded ? "loaded" : "empty");
    }
    const clips = a ? { plate: a.plate.clip, toolhead: a.tube.clip, column: a.column.clip, filament: a.filament.clip } : {};
    for (const [part, clip] of Object.entries(clips)) {
      if (!clip || this.playing[part] === clip) continue;
      this.playing[part] = clip;
      const played = (el.dataset.played ?? "").split(" ").filter(Boolean);
      played.push(`${part}:${clip}`);
      el.dataset.played = played.slice(-24).join(" ");
    }
    for (const [part, clip] of Object.entries(clips)) if (!clip) delete this.playing[part];
    for (const [key, value] of Object.entries(marks)) {
      if (el.dataset[key] !== value) el.dataset[key] = value;
    }
  }
  /** The clip each part is playing now, so a clip is listed in data-played once per start. Kept out of Vue. */
  get playing() {
    let p = playingByView.get(this);
    if (!p) playingByView.set(this, p = {});
    return p;
  }
  onPose(pose) {
    if (samePose(this.lastPose, pose)) return;
    this.lastPose = pose;
    this.sync().setPose(pose);
    this.viewer?.wake();
  }
  onAccessories(a) {
    if (!a || sameAccessories(this.lastAccessories, a)) return;
    this.lastAccessories = a;
    this.sync().accessories.reducedMotion = !this.viewerSettings.animate;
    this.sync().setAccessories(a, performance.now(), !!this.printPath);
    this.viewer?.wake();
  }
  /** A motion report: where the head is now, how fast it and the filament are going. */
  report() {
    const printer = this.$store.state.printer.printer;
    const motion = printer.motion_report;
    const live = motion?.live_position;
    if (!Array.isArray(live) || live.length < 3) return;
    const velocity = motion.live_velocity ?? 0;
    const extruderVelocity = motion.live_extruder_velocity ?? 0;
    const key = `${live[0]},${live[1]},${live[2]},${velocity},${extruderVelocity}`;
    if (key === this.lastReport) return;
    this.lastReport = key;
    const end = printer.toolhead?.position;
    this.sync().observe({
      at: performance.now(),
      live: [live[0], live[1], live[2]],
      velocity,
      extruderVelocity,
      target: Array.isArray(end) && end.length >= 3 ? [end[0], end[1], end[2]] : [live[0], live[1], live[2]],
      speedFactor: printer.gcode_move?.speed_factor ?? 1,
      filePosition: this.printState === "printing" ? printer.virtual_sdcard?.file_position ?? null : null
    });
    this.viewer?.wake();
  }
  // -- the print -------------------------------------------------------------
  /** The job's file, from the G-code root, while its part is on the plate. */
  get jobPath() {
    if (!PART_STATES.includes(this.printState)) return "";
    return this.$store.state.printer.printer.print_stats?.filename ?? "";
  }
  /** The file Fluidd's G-code preview holds, parsed. */
  get previewPath() {
    if (this.$store.state.gcodePreview.parserWorker) return "";
    const file = this.$store.getters["gcodePreview/getFile"];
    if (!file) return "";
    return file.path ? `${file.path}/${file.filename}` : file.filename;
  }
  get filePosition() {
    return this.$store.state.printer.printer.virtual_sdcard?.file_position ?? 0;
  }
  onPrintFile() {
    if (!this.jobPath) {
      this.printPath = null;
      this.motionPath = null;
      this.printPathFor = "";
      this.partOnlyFor = "";
    } else if (this.previewPath === this.jobPath && this.printPathFor !== this.jobPath) {
      const moves = this.$store.getters["gcodePreview/getMoves"];
      this.printPath = Object.freeze(toolpathFrom(moves));
      this.motionPath = moves.length <= MAX_FOLLOWED_MOVES ? Object.freeze(motionPathFrom(moves)) : null;
      this.printPathFor = this.jobPath;
    } else if (this.previewPath !== this.jobPath) {
      this.loadJob();
    }
    this.drawPrint();
  }
  /**
   * Fetches the job's file into the preview, quietly: while it prints, on
   * this network, a file under 16 MB, nothing parsing. A finished part is
   * drawn only from a preview that already holds it, so opening the
   * overview after a print doesn't download the file again.
   */
  async loadJob() {
    const file = this.$store.state.printer.printer.current_file;
    const job = this.jobPath;
    if (!this.live || !job || this.loadingFor === job || this.partOnlyFor === job) return;
    if (this.printState !== "printing" && this.printState !== "paused") return;
    if (!file?.filename || !file.size) return;
    const intoPreview = file.size <= AUTO_LOAD_BYTES;
    if (intoPreview && this.$store.state.gcodePreview.parserWorker) return;
    if (!intoPreview && file.size > (cloudState.activePrinterId ? PART_ONLY_BYTES / 3 : PART_ONLY_BYTES)) return;
    this.loadingFor = job;
    try {
      if (!intoPreview) {
        await this.loadPartOnly(job);
        return;
      }
      const response = await httpClientActions.serverFilesGet(`gcodes/${job}`, { responseType: "text", transformResponse: [(v) => v] });
      if (this.jobPath !== job || !response?.data) return;
      if (this.$store.state.gcodePreview.parserWorker || this.previewPath === job) return;
      const appFile = { ...file, path: file.path ?? job.split("/").slice(0, -1).join("/") };
      this.$store.dispatch("gcodePreview/loadGcode", { file: appFile, gcode: response.data });
    } catch (e) {
      console.warn("[m1] the print could not be fetched; the stage goes on without it", e);
    } finally {
      if (this.loadingFor === job) this.loadingFor = "";
    }
  }
  /** Reads a file too big for the preview, for the part alone: the head then follows the reports only. */
  async loadPartOnly(job) {
    const response = await httpClientActions.serverFilesGet(`gcodes/${job}`, { responseType: "arraybuffer" });
    if (this.jobPath !== job || !response?.data) return;
    this.printPath = Object.freeze(toolpathFromGcode(new Uint8Array(response.data)));
    this.motionPath = null;
    this.printPathFor = job;
    this.partOnlyFor = job;
    this.drawPrint();
  }
  /** The job's file once its metadata has come: a print that starts gets it a moment after its name. */
  get jobFileKnown() {
    const file = this.$store.state.printer.printer.current_file;
    return file?.filename && file.size ? `${file.filename}:${file.size}` : "";
  }
  onJobFileKnown(known) {
    if (known) this.onPrintFile();
  }
  /**
   * The filament's colour: the one set for what's loaded (Overview, Control
   * or the slicer, kept on the printer as muon_material_colour), since that is
   * what is in the nozzle; else the file's slicer settings.
   */
  get partColour() {
    if (this.loadedColour) return parseInt(this.loadedColour.slice(1), 16);
    const metadata = this.$store.state.printer.printer.current_file;
    return partColour(metadata?.filament_colors ?? metadata?.filament_colour);
  }
  onPartColour() {
    this.drawPrint();
  }
  drawPrint() {
    this.sync().setPath(this.printState === "complete" ? null : this.motionPath);
    this.onFilePosition();
    this.viewer?.setPrint(this.shownPrintPath, this.partColour);
  }
  onFilePosition() {
    if (this.sync().setFileDone(this.printPath ? segmentsDone(this.printPath, this.filePosition) : 0)) this.viewer?.wake();
  }
  onPrintState(now, before) {
    if (now === "printing" && before !== "paused") {
      this.sync().trace.clear();
      this.sync().newPrint();
    }
    this.drawPrint();
  }
  // -- the screen, the strips and the plate's touches -------------------------
  get screen() {
    const printer = this.$store.state.printer.printer;
    const phase = this.meshRun?.progress.phase;
    const remembered = updateWatch.remembered;
    return screenFrom({
      printState: this.printState,
      updating: bannerVisible(remembered, updateWatch.now, !!updateWatch.answered),
      homing: this.hasWait([Waits.onHomeAll, Waits.onHomeXY, Waits.onHomeX, Waits.onHomeY, Waits.onHomeZ]) || phase === "homing",
      probing: this.measuring || phase === "measuring",
      progress: this.$store.getters["printer/getPrintProgress"],
      nozzle: printer.extruder ?? null,
      bed: printer.heater_bed ?? null,
      filename: printer.print_stats?.filename ?? "",
      connected: !!this.$store.state.socket.open
    });
  }
  onScreen(screen) {
    this.viewer?.setScreen(screen);
  }
  /** The strips' pixels: Klipper's color_data for the M1's two neopixel chains. */
  get leds() {
    const printer = this.$store.state.printer.printer;
    const strip = (name) => printer[`neopixel ${name}`]?.color_data ?? null;
    return [strip("Left"), strip("Right")];
  }
  onLeds() {
    this.viewer?.setLeds(...this.leds);
  }
  get liveTaps() {
    return plateTaps(this.probeTouches);
  }
  onLiveTaps(taps) {
    clearTimeout(this.tapsTimer);
    if (taps.length) {
      this.tapsShown = taps;
      this.viewer?.setTaps(taps);
    } else if (this.tapsShown.length) {
      this.tapsTimer = window.setTimeout(() => {
        this.tapsShown = [];
        this.viewer?.setTaps([]);
      }, TAP_LINGER_MS);
    }
  }
  get dark() {
    return this.$vuetify.theme.dark;
  }
  async onDark() {
    await this.$nextTick();
    this.viewer?.restyle();
  }
  onShift(share) {
    this.viewer?.setShift(share);
  }
  onState(state) {
    if (state === "offline") this.stop();
    else this.wake();
  }
};
__decorateClass([
  Prop({ type: String, default: "idle" })
], M1Live.prototype, "state", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], M1Live.prototype, "shift", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], M1Live.prototype, "parts", 2);
__decorateClass([
  Watch("shownPrintPath")
], M1Live.prototype, "onShownPrintPath", 1);
__decorateClass([
  Watch("viewerSettings")
], M1Live.prototype, "onViewerSettings", 1);
__decorateClass([
  Watch("showModel")
], M1Live.prototype, "onShowModel", 1);
__decorateClass([
  Watch("pose")
], M1Live.prototype, "onPose", 1);
__decorateClass([
  Watch("accessories", { immediate: true })
], M1Live.prototype, "onAccessories", 1);
__decorateClass([
  Watch("jobPath", { immediate: true }),
  Watch("previewPath")
], M1Live.prototype, "onPrintFile", 1);
__decorateClass([
  Watch("jobFileKnown")
], M1Live.prototype, "onJobFileKnown", 1);
__decorateClass([
  Watch("partColour")
], M1Live.prototype, "onPartColour", 1);
__decorateClass([
  Watch("filePosition")
], M1Live.prototype, "onFilePosition", 1);
__decorateClass([
  Watch("printState")
], M1Live.prototype, "onPrintState", 1);
__decorateClass([
  Watch("screen")
], M1Live.prototype, "onScreen", 1);
__decorateClass([
  Watch("leds")
], M1Live.prototype, "onLeds", 1);
__decorateClass([
  Watch("liveTaps")
], M1Live.prototype, "onLiveTaps", 1);
__decorateClass([
  Watch("dark")
], M1Live.prototype, "onDark", 1);
__decorateClass([
  Watch("shift")
], M1Live.prototype, "onShift", 1);
__decorateClass([
  Watch("state")
], M1Live.prototype, "onState", 1);
M1Live = __decorateClass([
  Component({ components: { PrinterStage, M1Parts } })
], M1Live);
const _sfc_main = M1Live;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("printer-stage", { staticClass: "m1-live", class: { "m1-live--on": _vm.shown, "m1-live--still": !_vm.viewerSettings.animate }, attrs: { "state": _vm.state, "data-tid": "m1-live", "data-live": _vm.shown ? "on" : "off", "data-state-source": _vm.accessories ? _vm.accessories.source : void 0, "data-fan-fault": _vm.fanFacts.fault ? "yes" : "no", "data-part-fan": Math.round(_vm.fanFacts.partSpeed * 100), "data-show-model": _vm.showModel ? "on" : "off", "data-detail": _vm.viewerSettings.detail, "data-glass": _vm.viewerSettings.glass, "data-animations": _vm.viewerSettings.animate ? "on" : "off" } }, [_vm.live ? _c("div", { ref: "slot", staticClass: "m1-live__slot", attrs: { "title": _vm.shown ? "Drag to turn it; double-click to put it back" : void 0, "aria-hidden": "true" } }) : _vm._e(), _vm.parts && _vm.shown ? _c("m1-parts", { attrs: { "viewer": _vm.viewer, "canvas": _vm.canvas, "stage-state": _vm.state }, on: { "select": function($event) {
    return _vm.$emit("select-part", $event);
  } } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/m1/M1Live.vue?vue&type=style&index=0&scoped=bda34f76&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "bda34f76",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/m1/M1Live.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUdBO0FBTUE7QUFFQTtBQUVBO0FBRUE7QUFzQkE7QUFBQSxFQUVBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsUUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFBQSxVQUFBO0FBQ0Esb0NBQUFBLE9BQUE7QUFDQSxzQ0FBQUEsT0FBQSxXQUFBQSxTQUFBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFLQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBSUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExakJBO0FBQUEsRUFEQTtBQUFBLEdBREEsT0FFQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBTEEsT0FNQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBVEEsT0FVQTtBQW1FQTtBQUFBLEVBREE7QUFBQSxHQTVFQSxPQTZFQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBakZBLE9Ba0ZBO0FBTUE7QUFBQSxFQURBO0FBQUEsR0F2RkEsT0F3RkE7QUFxT0E7QUFBQSxFQURBO0FBQUEsR0E1VEEsT0E2VEE7QUFRQTtBQUFBLEVBREE7QUFBQSxHQXBVQSxPQXFVQTtBQXVEQTtBQUFBLEVBRkE7QUFBQSxFQUNBO0FBQUEsR0EzWEEsT0E0WEE7QUF5RUE7QUFBQSxFQURBO0FBQUEsR0FwY0EsT0FxY0E7QUFnQkE7QUFBQSxFQURBO0FBQUEsR0FwZEEsT0FxZEE7QUFZQTtBQUFBLEVBREE7QUFBQSxHQWhlQSxPQWllQTtBQU9BO0FBQUEsRUFEQTtBQUFBLEdBdmVBLE9Bd2VBO0FBNEJBO0FBQUEsRUFEQTtBQUFBLEdBbmdCQSxPQW9nQkE7QUFZQTtBQUFBLEVBREE7QUFBQSxHQS9nQkEsT0FnaEJBO0FBVUE7QUFBQSxFQURBO0FBQUEsR0F6aEJBLE9BMGhCQTtBQW1CQTtBQUFBLEVBREE7QUFBQSxHQTVpQkEsT0E2aUJBO0FBTUE7QUFBQSxFQURBO0FBQUEsR0FsakJBLE9BbWpCQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBdmpCQSxPQXdqQkE7QUF4akJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6WyJjYW52YXMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTTFMaXZlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxwcmludGVyLXN0YWdlXG4gICAgY2xhc3M9XCJtMS1saXZlXCJcbiAgICA6Y2xhc3M9XCJ7ICdtMS1saXZlLS1vbic6IHNob3duLCAnbTEtbGl2ZS0tc3RpbGwnOiAhdmlld2VyU2V0dGluZ3MuYW5pbWF0ZSB9XCJcbiAgICA6c3RhdGU9XCJzdGF0ZVwiXG4gICAgZGF0YS10aWQ9XCJtMS1saXZlXCJcbiAgICA6ZGF0YS1saXZlPVwic2hvd24gPyAnb24nIDogJ29mZidcIlxuICAgIDpkYXRhLXN0YXRlLXNvdXJjZT1cImFjY2Vzc29yaWVzID8gYWNjZXNzb3JpZXMuc291cmNlIDogdW5kZWZpbmVkXCJcbiAgICA6ZGF0YS1mYW4tZmF1bHQ9XCJmYW5GYWN0cy5mYXVsdCA/ICd5ZXMnIDogJ25vJ1wiXG4gICAgOmRhdGEtcGFydC1mYW49XCJNYXRoLnJvdW5kKGZhbkZhY3RzLnBhcnRTcGVlZCAqIDEwMClcIlxuICAgIDpkYXRhLXNob3ctbW9kZWw9XCJzaG93TW9kZWwgPyAnb24nIDogJ29mZidcIlxuICAgIDpkYXRhLWRldGFpbD1cInZpZXdlclNldHRpbmdzLmRldGFpbFwiXG4gICAgOmRhdGEtZ2xhc3M9XCJ2aWV3ZXJTZXR0aW5ncy5nbGFzc1wiXG4gICAgOmRhdGEtYW5pbWF0aW9ucz1cInZpZXdlclNldHRpbmdzLmFuaW1hdGUgPyAnb24nIDogJ29mZidcIlxuICA+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cImxpdmVcIlxuICAgICAgcmVmPVwic2xvdFwiXG4gICAgICBjbGFzcz1cIm0xLWxpdmVfX3Nsb3RcIlxuICAgICAgOnRpdGxlPVwic2hvd24gPyAnRHJhZyB0byB0dXJuIGl0OyBkb3VibGUtY2xpY2sgdG8gcHV0IGl0IGJhY2snIDogdW5kZWZpbmVkXCJcbiAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgLz5cbiAgICA8bTEtcGFydHNcbiAgICAgIHYtaWY9XCJwYXJ0cyAmJiBzaG93blwiXG4gICAgICA6dmlld2VyPVwidmlld2VyXCJcbiAgICAgIDpjYW52YXM9XCJjYW52YXNcIlxuICAgICAgOnN0YWdlLXN0YXRlPVwic3RhdGVcIlxuICAgICAgQHNlbGVjdD1cIiRlbWl0KCdzZWxlY3QtcGFydCcsICRldmVudClcIlxuICAgIC8+XG4gIDwvcHJpbnRlci1zdGFnZT5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFpbnRlbmFuY2UnXG5pbXBvcnQgUHJpbnRlclN0YWdlIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9QcmludGVyU3RhZ2UudnVlJ1xuaW1wb3J0IE0xUGFydHMgZnJvbSAnLi9NMVBhcnRzLnZ1ZSdcbmltcG9ydCB7IFdhaXRzIH0gZnJvbSAnQC9nbG9iYWxzJ1xuaW1wb3J0IHsgY2xhaW1MaXZlVmlldyB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvbGl2ZS1zbG90J1xuaW1wb3J0IHsgYnVpbHQsIGNhbkRyYXdXZWJnbCwgbG9hZFZpZXdlciwgbmV3Q2FudmFzLCBwYXJrLCBwcmVidWlsZCwgdGFrZVBhcmtlZCwgdmlld2VyS2V5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tMS0zZC9wYXJrZWQnXG5pbXBvcnQgeyBsaXZlU3luY0ZvciwgdHlwZSBMaXZlU3luYyB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvbGl2ZS1zeW5jJ1xuaW1wb3J0IHsgZmFuc0Zyb20sIGxpdmVBY2Nlc3Nvcmllcywgc2FtZUFjY2Vzc29yaWVzLCB0eXBlIEFjY2Vzc29yaWVzLCB0eXBlIEZhbkZhY3RzIH0gZnJvbSAnQC9zZXJ2aWNlcy9tMS0zZC9hY2Nlc3NvcmllcydcbmltcG9ydCB7IHBsYXRlVGFwcywgc2NyZWVuRnJvbSwgdHlwZSBMZWRTdHJpcCwgdHlwZSBQbGF0ZVRhcCwgdHlwZSBTY3JlZW5TdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvbGl2ZS1zdGF0ZSdcbmltcG9ydCB7IG1vdGlvblBhdGhGcm9tLCB0eXBlIE1vdGlvblBhdGggfSBmcm9tICdAL3NlcnZpY2VzL20xLTNkL21vdGlvbidcbmltcG9ydCB7IG1vZGVsUG9zZSwgc2FtZVBvc2UsIHR5cGUgTW9kZWxQb3NlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tMS0zZC9wb3NlJ1xuaW1wb3J0IHsgcGFydENvbG91ciwgc2VnbWVudHNEb25lLCB0b29scGF0aEZyb20sIHRvb2xwYXRoRnJvbUdjb2RlLCB0eXBlIFRvb2xwYXRoIH0gZnJvbSAnQC9zZXJ2aWNlcy9tMS0zZC90b29scGF0aCdcbmltcG9ydCB0eXBlIHsgRHJhd25TdGF0ZSwgTTFWaWV3ZXIgfSBmcm9tICdAL3NlcnZpY2VzL20xLTNkL3ZpZXdlcidcbmltcG9ydCB7IG1vZGVsQW5pbWF0ZXMsIG1vZGVsRGV0YWlsLCBtb2RlbEdsYXNzLCB0eXBlIE1vZGVsRGV0YWlsLCB0eXBlIE1vZGVsR2xhc3MgfSBmcm9tICdAL3NlcnZpY2VzL20xLTNkL3JlbmRlci1vcHRpb25zJ1xuaW1wb3J0IHsgbW9kZWxTZXR0aW5ncyB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvZGV2aWNlLXNldHRpbmdzJ1xuaW1wb3J0IHR5cGUgeyBUaHVtYlN0YXRlIH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL1ByaW50ZXJUaHVtYi52dWUnXG5pbXBvcnQgdHlwZSB7IE1vdmUgfSBmcm9tICdAL3N0b3JlL2djb2RlUHJldmlldy90eXBlcydcbmltcG9ydCB7IGh0dHBDbGllbnRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvaHR0cENsaWVudEFjdGlvbnMnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IGJhbm5lclZpc2libGUgfSBmcm9tICdAL3NlcnZpY2VzL3VwZGF0ZXMvbW9kZWwnXG5pbXBvcnQgeyB1cGRhdGVXYXRjaCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy93YXRjaCdcbmltcG9ydCB7IGFmdGVyRmlyc3RQYWludCB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9pZGxlJ1xuXG4vKiogUGVyIHZpZXc6IHRoZSBjbGlwIGVhY2ggcGFydCBpcyBwbGF5aW5nIChNMUxpdmUubWFya0RyYXduKS4gKi9cbmNvbnN0IHBsYXlpbmdCeVZpZXcgPSBuZXcgV2Vha01hcDxvYmplY3QsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+KClcblxuLyoqIFRoZSBiaWdnZXN0IGZpbGUgdGhlIHN0YWdlIGxvYWRzIGludG8gdGhlIEctY29kZSBwcmV2aWV3IGJ5IGl0c2VsZiAodGhlIHByZXZpZXcga2VlcHMgZXZlcnkgbW92ZSBhcyBhbiBvYmplY3QpLiAqL1xuY29uc3QgQVVUT19MT0FEX0JZVEVTID0gMTYgKiAxMDI0ICogMTAyNFxuLyoqXG4gKiBCaWdnZXIgZmlsZXMgYXJlIHJlYWQgZm9yIHRoZSBwYXJ0IGFsb25lIChgdG9vbHBhdGhGcm9tR2NvZGVgKSwgdXAgdG9cbiAqIHRoaXMgb24gdGhpcyBuZXR3b3JrIGFuZCBhIHRoaXJkIG9mIGl0IHRocm91Z2ggTXVvbjNEOiB3aXRob3V0IHRoZSBmaWxlXG4gKiB0aGUgc3RhZ2UgY291bGQgb25seSBsYXkgdGhlIHBhcnQgZnJvbSB0aGUgbW9tZW50IGl0IG9wZW5lZC5cbiAqL1xuY29uc3QgUEFSVF9PTkxZX0JZVEVTID0gOTYgKiAxMDI0ICogMTAyNFxuLyoqIFBhc3QgdGhpcyBtYW55IG1vdmVzIHRoZSBoZWFkIGlzbid0IGZvbGxvd2VkIGFsb25nIHRoZSBmaWxlICh0aGUgcGF0aCB3b3VsZCBjb3N0IGEgcGhvbmUgdG9vIG11Y2gpOyB0aGUgcGFydCBpcyBzdGlsbCBkcmF3bi4gKi9cbmNvbnN0IE1BWF9GT0xMT1dFRF9NT1ZFUyA9IDJfMDAwXzAwMFxuLyoqIE1hcmtzIG9mIHRoZSBwbGF0ZSdzIHRvdWNoZXMgc3RheSB0aGlzIGxvbmcgYWZ0ZXIgdGhlIHByaW50ZXIgc3RvcHMgdG91Y2hpbmcgaXQuICovXG5jb25zdCBUQVBfTElOR0VSX01TID0gNjBfMDAwXG4vKiogQSBwcmludCdzIHBhcnQgc3RheXMgZHJhd24gaW4gdGhlc2Ugc3RhdGVzIHRvbzogaXQgaXMgc3RpbGwgb24gdGhlIHBsYXRlLiAqL1xuY29uc3QgUEFSVF9TVEFURVMgPSBbJ3ByaW50aW5nJywgJ3BhdXNlZCcsICdjb21wbGV0ZScsICdjYW5jZWxsZWQnLCAnZXJyb3InXVxuXG4vKipcbiAqIFRoZSBNMSBvbiBpdHMgc3RhZ2UsIGxpdmU6IHRoZSBwaG90b3JlYWwgbW9kZWwgaW4gc3RlcCB3aXRoIHRoZSBwcmludGVyLlxuICogVGhlIGhlYWQgYW5kIHRoZSBiZWQgbW92ZSBhcyB0aGUgcHJpbnRlcidzIG93biBtb3Rpb24gcmVwb3J0cyBzYXksIGZvdXJcbiAqIHRpbWVzIGEgc2Vjb25kLCBhbmQgYmV0d2VlbiByZXBvcnRzIGFzIHRoZSBmaWxlIGJlaW5nIHByaW50ZWQgKG9yIHRoZVxuICogd2F5IHRoZSBoZWFkIHdhcyBnb2luZykgc2F5cyB0aGV5IG11c3QgKGxpdmUtc3luYy50cyksIHNvIHRoZSBtb2RlbCBtb3Zlc1xuICogc21vb3RobHkgYW5kIHdoZXJlIHRoZSBwcmludGVyIGlzLiBUaGUgcGFydCBncm93cyB1bmRlciB0aGUgbm96emxlOyBhXG4gKiBwdXJnZSBvciBhIG1hY3JvJ3MgZXh0cnVzaW9uIGxlYXZlcyBpdHMgbGluZTsgZWFjaCB0b3VjaCBvZiB0aGUgcGxhdGVcbiAqIGxlYXZlcyBhIG1hcmsgY29sb3VyZWQgYnkgdGhlIGhlaWdodCBpdCBmb3VuZDsgdGhlIExFRCBzdHJpcHMgc2hvdyB0aGVpclxuICogcGl4ZWxzOyBhbmQgdGhlIGJhc2UncyBzY3JlZW4gc2hvd3Mgd2hhdCB0aGUgcHJpbnRlcidzIHBhbmVsIHNob3dzLlxuICpcbiAqIFRoZSBwYXJ0IGNvbWVzIGZyb20gdGhlIGpvYidzIGZpbGUsIGZyb20gaXRzIGZpcnN0IGJ5dGUsIHNvIGEgcHJpbnRcbiAqIG9wZW5lZCBwYXJ0LXdheSB0aHJvdWdoIHNob3dzIGFsbCB0aGF0IGlzIGFscmVhZHkgcHJpbnRlZC4gV2hpbGVcbiAqIHByaW50aW5nLCB0aGUgc3RhZ2UgbG9hZHMgYSBmaWxlIHVuZGVyIDE2IE1CIGludG8gRmx1aWRkJ3MgRy1jb2RlXG4gKiBwcmV2aWV3IChvbiB0aGlzIG5ldHdvcmsgb3IgdGhyb3VnaCBNdW9uM0QpLCBhbmQgcmVhZHMgYSBiaWdnZXIgb25lIGZvclxuICogdGhlIHBhcnQgYWxvbmU7IHRoZSByZXBvcnRzIGxheSB0aGUgcGFydCBvbmx5IHVudGlsIHRoZSBmaWxlIGlzIGluLiBUaGVcbiAqIHByb2R1Y3Qgc2hvdCBzaG93cyB1bnRpbCB0aGUgbW9kZWwgaGFzIGRyYXduLCBhbmQgc3RheXMgd2hlbiB0aGUgYnJvd3NlclxuICogY2FuJ3QgZHJhdyBpdCwgd2hlbiBhbm90aGVyIGxpdmUgTTEgaXMgb24gc2NyZWVuLCBvciB3aGlsZSB0aGlzIG9uZSBpc1xuICogc2Nyb2xsZWQgYXdheS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgUHJpbnRlclN0YWdlLCBNMVBhcnRzIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE0xTGl2ZSBleHRlbmRzIE1peGlucyhNYWludGVuYW5jZU1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnaWRsZScgfSlcbiAgcmVhZG9ubHkgc3RhdGUhOiBUaHVtYlN0YXRlXG5cbiAgLyoqIE1vdmVzIHRoZSBtYWNoaW5lIGxlZnQgYnkgdGhpcyBzaGFyZSBvZiB0aGUgc3RhZ2UsIHRvIGNsZWFyIGEgY2FyZCBvbiB0aGUgcmlnaHQuICovXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0pXG4gIHJlYWRvbmx5IHNoaWZ0ITogbnVtYmVyXG5cbiAgLyoqIExldHMgYSBwZXJzb24gcG9pbnQgYXQgdGhlIHBsYXRlLCB0b29saGVhZCwgZmlsYW1lbnQgYW5kIHNjcmVlbiAoTTFQYXJ0cyk7IHRoZSBPdmVydmlldyB0dXJucyBpdCBvbi4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9KVxuICByZWFkb25seSBwYXJ0cyE6IGJvb2xlYW5cblxuICAvKiogV2hldGhlciB0aGlzIHZpZXcgaG9sZHMgdGhlIGxpdmUgTTEgYW5kIGhhcyBhIGNhbnZhcyBmb3IgaXQuICovXG4gIGxpdmUgPSBmYWxzZVxuICAvKiogV2hldGhlciB0aGUgbW9kZWwgaGFzIGRyYXduLCBzbyB0aGUgcGljdHVyZSBjYW4gZ28uICovXG4gIHNob3duID0gZmFsc2VcblxuICB2aWV3ZXI6IE0xVmlld2VyIHwgbnVsbCA9IG51bGxcbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IG51bGwgPSBudWxsXG4gIGdpdmVCYWNrOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuICB2aXNpYmxlID0gZmFsc2VcbiAgb2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyIHwgbnVsbCA9IG51bGxcbiAgc3RvcFJlcG9ydHM6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG4gIHJlZHVjZWRNb3Rpb25RdWVyeTogTWVkaWFRdWVyeUxpc3QgfCBudWxsID0gbnVsbFxuICByZWR1Y2VkTW90aW9uTGlzdGVuZXI6ICgoZXZlbnQ6IE1lZGlhUXVlcnlMaXN0RXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcbiAgbGFzdEFjY2Vzc29yaWVzOiBBY2Nlc3NvcmllcyB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgc3lzdGVtJ3MgcHJlZmVycy1yZWR1Y2VkLW1vdGlvbiwgdGhlIGFuaW1hdGlvbnMnIGRlZmF1bHQuICovXG4gIHJlZHVjZWRNb3Rpb24gPSBmYWxzZVxuICAvKiogV2hhdCB0aGUgdmlld2VyIG9uIHRoZSBzdGFnZSB3YXMgYnVpbHQgd2l0aCAoc2VlIHZpZXdlcktleSkuICovXG4gIGhlbGRLZXkgPSAnJ1xuXG4gIC8qKiBUaGUgcHJpbnQgZHJhd24sIGJ1aWx0IGZyb20gdGhlIHByZXZpZXcgb25jZSBwZXIgZmlsZTsgZnJvemVuLCBzbyBWdWUgbGVhdmVzIGl0IGFsb25lLiAqL1xuICBwcmludFBhdGg6IFJlYWRvbmx5PFRvb2xwYXRoPiB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgc2FtZSBmaWxlIGFzIG1vdmVzIHRvIGZvbGxvdyB0aGUgaGVhZCBhbG9uZzsgZnJvemVuIHRvby4gKi9cbiAgbW90aW9uUGF0aDogUmVhZG9ubHk8TW90aW9uUGF0aD4gfCBudWxsID0gbnVsbFxuICBwcmludFBhdGhGb3IgPSAnJ1xuICBsb2FkaW5nRm9yID0gJydcbiAgLyoqIEEgam9iIHdob3NlIHBhcnQgd2FzIHJlYWQgc3RyYWlnaHQgZnJvbSBpdHMgZmlsZSwgdG9vIGJpZyBmb3IgdGhlIHByZXZpZXcuICovXG4gIHBhcnRPbmx5Rm9yID0gJydcblxuICAvKiogVGhlIGxhc3QgcG9zZSBhbmQgcmVwb3J0IHBhc3NlZCBvbiwgc28gYW4gdW5jaGFuZ2VkIG9uZSBkcmF3cyBub3RoaW5nLiAqL1xuICBsYXN0UG9zZTogTW9kZWxQb3NlIHwgbnVsbCA9IG51bGxcbiAgbGFzdFJlcG9ydCA9ICcnXG5cbiAgLyoqIFRoZSBtYXJrcyBvbiB0aGUgcGxhdGUsIGtlcHQgYSB3aGlsZSBhZnRlciB0aGUgdG91Y2hpbmcgZW5kcy4gKi9cbiAgdGFwc1Nob3duOiBQbGF0ZVRhcFtdID0gW11cbiAgdGFwc1RpbWVyID0gMFxuXG4gIC8qKiBTZXQgb24gZGVzdHJveSBzbyBhbiBpZGxlIGNhbGxiYWNrIHN0aWxsIG93ZWQgZG9lcyBub3RoaW5nIChLQU4tNTI1KS4gKi9cbiAgZ29uZSA9IGZhbHNlXG4gIC8qKiBTZXQgb25jZSB0aGUgdmlldyBoYXMgYmVlbiBzZWVuIGFuZCB0aGUgYXBwIGhhcyBwYWludGVkOyBub3RoaW5nIGxvYWRzIHRoZSB2aWV3ZXIgYmVmb3JlLiAqL1xuICBhcm1lZCA9IGZhbHNlXG5cbiAgLyoqIFRoaXMgcHJpbnRlcidzIHN5bmMsIHdoaWNoIG91dGxpdmVzIHRoZSB2aWV3LiBOb3QgZGF0YTogVnVlIG11c3RuJ3Qgd2FsayBpdC4gKi9cbiAgc3luYyAoKTogTGl2ZVN5bmMge1xuICAgIHJldHVybiBsaXZlU3luY0ZvcihhY3RpdmVTbHVnKCkgPz8gKHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwgYXMgc3RyaW5nKSA/PyAnJylcbiAgfVxuXG4gIC8qKiBTZXR0aW5ncyDigLogRy1jb2RlIHByZXZpZXcgYW5kIDNEIOKAuiBTaG93IHRoZSAzRCBwcmludGVyOyBvZmYsIHRoZSBzdGFnZSBzaG93cyBpdHMgcGljdHVyZS4gKi9cbiAgZ2V0IHNob3dNb2RlbCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG1vZGVsU2V0dGluZ3Muc2hvd1xuICB9XG5cbiAgZ2V0IHZpZXdlclNldHRpbmdzICgpOiB7IGRldGFpbDogTW9kZWxEZXRhaWwsIGdsYXNzOiBNb2RlbEdsYXNzLCBhbmltYXRlOiBib29sZWFuIH0ge1xuICAgIHJldHVybiB7XG4gICAgICBkZXRhaWw6IG1vZGVsRGV0YWlsKG1vZGVsU2V0dGluZ3MuZGV0YWlsKSxcbiAgICAgIGdsYXNzOiBtb2RlbEdsYXNzKG1vZGVsU2V0dGluZ3MuZ2xhc3MpLFxuICAgICAgYW5pbWF0ZTogbW9kZWxBbmltYXRlcyhtb2RlbFNldHRpbmdzLmFuaW1hdGlvbnMsIHRoaXMucmVkdWNlZE1vdGlvbilcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHByaW50IHNvIGZhciBvbiB0aGUgbW9kZWwncyBwbGF0ZSwgdW5sZXNzIFNldHRpbmdzIHR1cm5lZCB0aGF0IG9mZi4gKi9cbiAgZ2V0IHNob3duUHJpbnRQYXRoICgpOiBSZWFkb25seTxUb29scGF0aD4gfCBudWxsIHtcbiAgICByZXR1cm4gbW9kZWxTZXR0aW5ncy5wcmludEdyb3dpbmcgPyB0aGlzLnByaW50UGF0aCA6IG51bGxcbiAgfVxuXG4gIEBXYXRjaCgnc2hvd25QcmludFBhdGgnKVxuICBvblNob3duUHJpbnRQYXRoICgpIHtcbiAgICB0aGlzLnZpZXdlcj8uc2V0UHJpbnQodGhpcy5zaG93blByaW50UGF0aCwgdGhpcy5wYXJ0Q29sb3VyKVxuICB9XG5cbiAgQFdhdGNoKCd2aWV3ZXJTZXR0aW5ncycpXG4gIG9uVmlld2VyU2V0dGluZ3MgKHNldHRpbmdzOiB7IGFuaW1hdGU6IGJvb2xlYW4gfSkge1xuICAgIHRoaXMuc3luYygpLmFjY2Vzc29yaWVzLnJlZHVjZWRNb3Rpb24gPSAhc2V0dGluZ3MuYW5pbWF0ZVxuICAgIHRoaXMudmlld2VyPy53YWtlKClcbiAgfVxuXG4gIEBXYXRjaCgnc2hvd01vZGVsJylcbiAgb25TaG93TW9kZWwgKHNob3c6IGJvb2xlYW4pIHtcbiAgICBpZiAoc2hvdykgdGhpcy53YWtlKClcbiAgICBlbHNlIHRoaXMuc3RvcCgpXG4gIH1cblxuICBnZXQgcG9zZSAoKTogTW9kZWxQb3NlIHtcbiAgICByZXR1cm4gbW9kZWxQb3NlKHtcbiAgICAgIHBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgaG9tZWQ6IHRoaXMuaG9tZWRBeGVzLFxuICAgICAgbGlnaHRzOiB0aGlzLmhhc0xpZ2h0cyAmJiB0aGlzLmxpZ2h0c1ZhbHVlID4gMCxcbiAgICAgIHByb2dyZXNzOiAodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludFByb2dyZXNzJ10gYXMgbnVtYmVyKSAqIDEwMFxuICAgIH0pXG4gIH1cblxuICBnZXQgcHJpbnRTdGF0ZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wcmludF9zdGF0cz8uc3RhdGUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnJ1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBmYW5zIGFzIHRoZSBwcmludGVyIHJlcG9ydHMgdGhlbS4gVGhlIGFjY3VyYXRlIG1vZGVsIGhhcyBubyBmYW4gdG9cbiAgICogdHVybiAodGhlIGRlY2sgZmFuIGlzIHBhcnQgb2YgdGhlIGJhc2UncyBvbmUgbWVzaCwgYW5kIHRoZXJlIGlzIG5vIHBhcnRcbiAgICogZmFuKSwgc28gdGhleSBhcmUgb25seSBtYXJrZWQgb24gdGhlIHN0YWdlJ3MgZWxlbWVudC5cbiAgICovXG4gIGdldCBmYW5GYWN0cyAoKTogRmFuRmFjdHMge1xuICAgIHJldHVybiBmYW5zRnJvbSh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIpXG4gIH1cblxuICAvKipcbiAgICogVGhlIHBsYXRlLCB0b29saGVhZCwgWiBjb2x1bW4gYW5kIGZpbGFtZW50IHRoZSBtb2RlbCBzaG93czogZnJvbSBIYXJyeSdzXG4gICAqIHByaW50ZXItc3RhdGUgbWFjaGluZSAoS2xpcHBlcidzIG0xX21hY2hpbmUpIHdoZW4gdGhlIHByaW50ZXIgcnVucyBpdCxcbiAgICogZWxzZSBmcm9tIGVhY2ggc2Vuc29yIChhY2Nlc3Nvcmllcy50cykuIE51bGwgdW50aWwgdGhlIHByaW50ZXIncyBmaXJzdFxuICAgKiBzdGF0dXMgaGFzIGFycml2ZWQgKHNlZSBsaXZlQWNjZXNzb3JpZXMpLlxuICAgKi9cbiAgZ2V0IGFjY2Vzc29yaWVzICgpOiBBY2Nlc3NvcmllcyB8IG51bGwge1xuICAgIHJldHVybiBsaXZlQWNjZXNzb3JpZXMoXG4gICAgICB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIsXG4gICAgICB0aGlzLiRzdG9yZS5zdGF0ZS5jb25zb2xlLnByb21wdERpYWxvZyxcbiAgICAgIHRoaXMuJHN0b3JlLnN0YXRlLnNvY2tldC5hY2NlcHRpbmdOb3RpZmljYXRpb25zID09PSB0cnVlXG4gICAgKVxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5zeW5jKCkuc2V0UG9zZSh0aGlzLnBvc2UpXG4gICAgdGhpcy5yZWR1Y2VkTW90aW9uUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYT8uKCcocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKScpID8/IG51bGxcbiAgICB0aGlzLnJlZHVjZWRNb3Rpb24gPSB0aGlzLnJlZHVjZWRNb3Rpb25RdWVyeT8ubWF0Y2hlcyA/PyBmYWxzZVxuICAgIHRoaXMuc3luYygpLmFjY2Vzc29yaWVzLnJlZHVjZWRNb3Rpb24gPSAhdGhpcy52aWV3ZXJTZXR0aW5ncy5hbmltYXRlXG4gICAgdGhpcy5yZWR1Y2VkTW90aW9uTGlzdGVuZXIgPSBldmVudCA9PiB7XG4gICAgICB0aGlzLnJlZHVjZWRNb3Rpb24gPSBldmVudC5tYXRjaGVzXG4gICAgICB0aGlzLnZpZXdlcj8ud2FrZSgpXG4gICAgfVxuICAgIGlmICh0aGlzLnJlZHVjZWRNb3Rpb25RdWVyeT8uYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgdGhpcy5yZWR1Y2VkTW90aW9uUXVlcnkuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5yZWR1Y2VkTW90aW9uTGlzdGVuZXIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVkdWNlZE1vdGlvblF1ZXJ5Py5hZGRMaXN0ZW5lcj8uKHRoaXMucmVkdWNlZE1vdGlvbkxpc3RlbmVyKVxuICAgIH1cbiAgICB0aGlzLnN0b3BSZXBvcnRzID0gdGhpcy4kc3RvcmUuc3Vic2NyaWJlQWN0aW9uKHtcbiAgICAgIGFmdGVyOiBhY3Rpb24gPT4ge1xuICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdwcmludGVyL29uRmFzdE5vdGlmeVN0YXR1c1VwZGF0ZScgJiYgYWN0aW9uLnBheWxvYWQ/LmtleSA9PT0gJ21vdGlvbl9yZXBvcnQnKSB0aGlzLnJlcG9ydCgpXG4gICAgICB9XG4gICAgfSlcbiAgICBpZiAodHlwZW9mIEludGVyc2VjdGlvbk9ic2VydmVyID09PSAndW5kZWZpbmVkJykgcmV0dXJuXG4gICAgLy8gVGhlIG9ic2VydmVyIGlzIGNoZWFwIGFuZCBzdGFydHMgYXQgb25jZTsgdGhlIHZpZXdlciBidWlsZCB3YWl0cyBmb3JcbiAgICAvLyB0aGUgdmlldydzIGZpcnN0IGludGVyc2VjdCBBTkQgdGhlIGFwcCdzIGZpcnN0IHBhaW50IOKAlCBidWlsZGluZyBpdFxuICAgIC8vIGVhcmxpZXIgY29zdCBzZWNvbmRzIG9uIHRoZSBmcmFtZSB0aGUgb3ZlcnZpZXcgZmlyc3QgZHJhd3MgKEtBTi01MjUpLlxuICAgIC8vIGNhbkRyYXdXZWJnbCBpcyBwYXJ0IG9mIHRoYXQgY29zdCB0b286IGl0IG1ha2VzIGEgV2ViR0wgY29udGV4dCwgYW5kXG4gICAgLy8gdGhhdCBzdGFsbHMgdGhlIGZyYW1lIGl0IHJ1bnMgaW4sIHNvIGl0IHdhaXRzIGhlcmUgYXMgd2VsbC5cbiAgICB0aGlzLm9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgICAgdGhpcy52aXNpYmxlID0gZW50cmllcy5zb21lKGUgPT4gZS5pc0ludGVyc2VjdGluZylcbiAgICAgIGlmICh0aGlzLnZpc2libGUgJiYgIXRoaXMuYXJtZWQpIHtcbiAgICAgICAgYWZ0ZXJGaXJzdFBhaW50KCgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5nb25lIHx8ICFjYW5EcmF3V2ViZ2woKSkgcmV0dXJuXG4gICAgICAgICAgdGhpcy5hcm1lZCA9IHRydWVcbiAgICAgICAgICBwcmVidWlsZCgpXG4gICAgICAgICAgdGhpcy53YWtlKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHRoaXMud2FrZSgpXG4gICAgfSlcbiAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUodGhpcy4kZWwpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMud2FrZSlcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuZ29uZSA9IHRydWVcbiAgICB0aGlzLnN0b3BSZXBvcnRzPy4oKVxuICAgIGlmICh0aGlzLnJlZHVjZWRNb3Rpb25MaXN0ZW5lcikge1xuICAgICAgaWYgKHRoaXMucmVkdWNlZE1vdGlvblF1ZXJ5Py5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMucmVkdWNlZE1vdGlvblF1ZXJ5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMucmVkdWNlZE1vdGlvbkxpc3RlbmVyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZWR1Y2VkTW90aW9uUXVlcnk/LnJlbW92ZUxpc3RlbmVyPy4odGhpcy5yZWR1Y2VkTW90aW9uTGlzdGVuZXIpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVkdWNlZE1vdGlvblF1ZXJ5ID0gbnVsbFxuICAgIHRoaXMucmVkdWNlZE1vdGlvbkxpc3RlbmVyID0gbnVsbFxuICAgIHRoaXMub2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLndha2UpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGFwc1RpbWVyKVxuICAgIHRoaXMuc3RvcCgpXG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBsaXZlIE0xIHdoZW4gaXQgY2FuIHNob3cgKG9uIHNjcmVlbiwgdGhlIHByaW50ZXIgdGhlcmUpLCBhbmQgZHJhd3Mgb25seSB3aGlsZSBpdCBzaG93cy4gKi9cbiAgd2FrZSAoKSB7XG4gICAgaWYgKCF0aGlzLmFybWVkKSByZXR1cm5cbiAgICBjb25zdCBzaG93aW5nID0gdGhpcy52aXNpYmxlICYmIHRoaXMuc2hvd01vZGVsICYmIHRoaXMuc3RhdGUgIT09ICdvZmZsaW5lJyAmJiAhZG9jdW1lbnQuaGlkZGVuXG4gICAgdGhpcy52aWV3ZXI/LnNldEFjdGl2ZShzaG93aW5nKVxuICAgIGlmIChzaG93aW5nICYmICF0aGlzLmxpdmUpIHRoaXMuc3RhcnQoKVxuICB9XG5cbiAgYXN5bmMgc3RhcnQgKCkge1xuICAgIGlmICghdGhpcy5hcm1lZCB8fCAhdGhpcy5zaG93TW9kZWwpIHJldHVyblxuICAgIHRoaXMubGl2ZSA9IHRydWVcbiAgICB0aGlzLmdpdmVCYWNrID0gY2xhaW1MaXZlVmlldygoKSA9PiB0aGlzLnN0b3AoKSlcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYnVpbHQoKVxuICAgICAgbGV0IGhlbGQgPSB0YWtlUGFya2VkKClcbiAgICAgIGlmICghaGVsZCkge1xuICAgICAgICBjb25zdCB7IGNyZWF0ZVZpZXdlciB9ID0gYXdhaXQgbG9hZFZpZXdlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJG5leHRUaWNrKClcbiAgICAgICAgaWYgKCF0aGlzLmxpdmUgfHwgIXRoaXMuJHJlZnMuc2xvdCkgcmV0dXJuXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IG5ld0NhbnZhcygpXG4gICAgICAgIDsodGhpcy4kcmVmcy5zbG90IGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChjYW52YXMpXG4gICAgICAgIGhlbGQgPSB7IHZpZXdlcjogY3JlYXRlVmlld2VyKGNhbnZhcyksIGNhbnZhcywga2V5OiB2aWV3ZXJLZXkoKSB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLiRuZXh0VGljaygpXG4gICAgICAgIGNvbnN0IHNsb3QgPSB0aGlzLiRyZWZzLnNsb3QgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWRcbiAgICAgICAgaWYgKCF0aGlzLmxpdmUgfHwgIXNsb3QpIHtcbiAgICAgICAgICBwYXJrKGhlbGQpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgc2xvdC5hcHBlbmRDaGlsZChoZWxkLmNhbnZhcylcbiAgICAgIH1cbiAgICAgIGNvbnN0IHsgdmlld2VyLCBjYW52YXMgfSA9IGhlbGRcbiAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzXG4gICAgICB0aGlzLmhlbGRLZXkgPSBoZWxkLmtleVxuICAgICAgdmlld2VyLnNldEFjdGl2ZSh0cnVlKVxuICAgICAgdmlld2VyLnJlc3R5bGUoKVxuICAgICAgdmlld2VyLm9uRnJhbWUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd24gPSB0cnVlXG4gICAgICAgIHZpZXdlci5vbkZyYW1lID0gbnVsbFxuICAgICAgfVxuICAgICAgdmlld2VyLnNldFNoaWZ0KHRoaXMuc2hpZnQpXG4gICAgICB2aWV3ZXIub25EcmF3ID0gZHJhd24gPT4gdGhpcy5tYXJrRHJhd24oZHJhd24pXG4gICAgICB0aGlzLnZpZXdlciA9IHZpZXdlclxuICAgICAgdGhpcy5zeW5jKCkuc2V0UG9zZSh0aGlzLnBvc2UpXG4gICAgICB0aGlzLmxhc3RSZXBvcnQgPSAnJ1xuICAgICAgdGhpcy5yZXBvcnQoKVxuICAgICAgdmlld2VyLmZvbGxvdyh0aGlzLnN5bmMoKSlcbiAgICAgIHRoaXMub25QcmludEZpbGUoKVxuICAgICAgdGhpcy5vblNjcmVlbih0aGlzLnNjcmVlbilcbiAgICAgIHRoaXMub25MZWRzKClcbiAgICAgIHZpZXdlci5zZXRUYXBzKHRoaXMudGFwc1Nob3duKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignW20xXSB0aGUgbGl2ZSBNMSBjb3VsZCBub3Qgc3RhcnQ7IHNob3dpbmcgaXRzIHBpY3R1cmUnLCBlKVxuICAgICAgdGhpcy5zdG9wKClcbiAgICB9XG4gIH1cblxuICAvKiogTGV0cyB0aGUgbGl2ZSBNMSBnbywgcGFya2luZyBpdCBmb3IgdGhlIG5leHQgdmlldy4gKi9cbiAgc3RvcCAoKSB7XG4gICAgY29uc3Qgdmlld2VyID0gdGhpcy52aWV3ZXJcbiAgICBjb25zdCBjYW52YXMgPSB0aGlzLmNhbnZhc1xuICAgIGlmICh2aWV3ZXIpIHZpZXdlci5vbkRyYXcgPSBudWxsXG4gICAgdGhpcy52aWV3ZXIgPSBudWxsXG4gICAgdGhpcy5jYW52YXMgPSBudWxsXG4gICAgdGhpcy5saXZlID0gZmFsc2VcbiAgICB0aGlzLnNob3duID0gZmFsc2VcbiAgICB0aGlzLmdpdmVCYWNrPy4oKVxuICAgIHRoaXMuZ2l2ZUJhY2sgPSBudWxsXG4gICAgaWYgKHZpZXdlciAmJiBjYW52YXMpIHBhcmsoeyB2aWV3ZXIsIGNhbnZhcywga2V5OiB0aGlzLmhlbGRLZXkgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB3aGF0IHRoZSBtb2RlbCBkcmV3IG9uIHRoZSBzdGFnZSdzIGVsZW1lbnQgKGRhdGEtbW9kZWwsXG4gICAqIGRhdGEtcGxhdGUsIGRhdGEtdG9vbGhlYWQsIGRhdGEtY29sdW1uLCBkYXRhLWZpbGFtZW50LCBhbmQgZGF0YS1zcG9vbCBhbmRcbiAgICogZGF0YS1wbHVnLCBvbiBvciBvZmYpOiB0aGUgc3RhdGUgb25jZSBhIGNsaXAgZW5kcywgdGhlIGNsaXAncyBuYW1lIHdoaWxlIGl0IHBsYXlzLiBkYXRhLXBsYXllZCBsaXN0cyB0aGUgbGFzdFxuICAgKiBjbGlwcyBzdGFydGVkIChcInBhcnQ6Y2xpcFwiLCBuZXdlc3QgbGFzdCksIHNvIGEgdGVzdCBjYW4gc2VlIGEgY2xpcCByYW5cbiAgICogZXZlbiB3aGVuIGEgc2xvdyByZW5kZXJlciBkcmF3cyBub25lIG9mIGl0cyBmcmFtZXMuIFdyaXR0ZW4gc3RyYWlnaHQgdG9cbiAgICogdGhlIGVsZW1lbnQsIG5vdCB0aHJvdWdoIFZ1ZSwgc2luY2UgaXQgcnVucyBldmVyeSBmcmFtZS5cbiAgICovXG4gIG1hcmtEcmF3biAoeyBtb2RlbCwgYWNjZXNzb3JpZXM6IGEsIHNwb29sLCBwbHVnLCBjb2xvdXIsIHNlZVRocm91Z2gsIHBoaSwgbm96emxlLCBrbm9iLCBzdHJhbmQgfTogRHJhd25TdGF0ZSkge1xuICAgIGNvbnN0IGVsID0gdGhpcy4kZWwgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWRcbiAgICBpZiAoIWVsPy5kYXRhc2V0KSByZXR1cm5cbiAgICBjb25zdCBtYXJrczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgbW9kZWwsIHNwb29sOiBzcG9vbCA/ICdvbicgOiAnb2ZmJywgcGx1ZzogcGx1ZyA/ICdvbicgOiAnb2ZmJyB9XG4gICAgLy8gV2hlcmUgdGhlIG5venpsZSBpcyBkcmF3biAocHggZnJvbSB0aGUgY2FudmFzJ3MgdG9wIGxlZnQpIGFuZCBob3cgdGhlIGtub2Igc2l0czogZm9yIHRlc3RzLCB3cml0dGVuIG9ubHkgd2hlbiB0aGV5IGNoYW5nZS5cbiAgICBtYXJrcy5maWxhbWVudENvbG91ciA9IGNvbG91ciA9PT0gbnVsbCA/ICcnIDogYCMke2NvbG91ci50b1N0cmluZygxNikucGFkU3RhcnQoNiwgJzAnKX1gXG4gICAgbWFya3MucGxhdGVTZWUgPSBzZWVUaHJvdWdoID09PSBudWxsID8gJycgOiBzZWVUaHJvdWdoLnRvRml4ZWQoMilcbiAgICBtYXJrcy5jYW1lcmFQaGkgPSBwaGkudG9GaXhlZCgzKVxuICAgIG1hcmtzLm5venpsZSA9IG5venpsZSA/IGAke25venpsZS54fSwke25venpsZS55fWAgOiAnJ1xuICAgIG1hcmtzLmtub2IgPSBrbm9iID8ga25vYi5hbmdsZS50b0ZpeGVkKDIpIDogJydcbiAgICBtYXJrcy5rbm9iUHVzaGVkID0ga25vYj8ucHVzaGVkID8gJ29uJyA6ICdvZmYnXG4gICAgbWFya3Mua25vYkF0ID0ga25vYiA/IGAke2tub2IueH0sJHtrbm9iLnl9YCA6ICcnXG4gICAgLy8gVGhlIGtub2IncyByaW0gKHRoZSBwYXJ0IG9mIGl0IG91dHNpZGUgdGhlIHNjcmVlbidzIGRpc2MpLCBob3cgb2Z0ZW4gaXQgd2FzIHByZXNzZWQsIHRoZSBkZWVwZXN0IGl0IGhhcyBnb25lIGluIChtbSkgYW5kIGhvdyBtdWNoIG9mIGEgdHVybiB0aGUgZHJhd24gd2hlZWwgY292ZXJzLlxuICAgIG1hcmtzLmtub2JSaW0gPSBrbm9iID8gYCR7a25vYi5yaW0ueH0sJHtrbm9iLnJpbS55fWAgOiAnJ1xuICAgIG1hcmtzLmtub2JQcmVzc2VzID0ga25vYiA/IFN0cmluZyhrbm9iLnByZXNzZXMpIDogJydcbiAgICBtYXJrcy5rbm9iUGVhayA9IGtub2IgPyBrbm9iLnBlYWsudG9GaXhlZCgyKSA6ICcnXG4gICAgbWFya3Mua25vYkFyYyA9IGtub2IgPyBTdHJpbmcoa25vYi5hcmMpIDogJydcbiAgICAvLyBXaGVyZSB0aGUgZmlsYW1lbnQncyBlbmQgaXMgZHJhd24gYW5kIHRoZSBob2xlIGluIHRoZSB3YWxsIGl0IGdvZXMgaW50by5cbiAgICBtYXJrcy5zdHJhbmRFbmQgPSBzdHJhbmQgPyBgJHtzdHJhbmQueH0sJHtzdHJhbmQueX1gIDogJydcbiAgICBtYXJrcy5zdHJhbmRIb2xlID0gc3RyYW5kID8gYCR7c3RyYW5kLmhvbGUueH0sJHtzdHJhbmQuaG9sZS55fWAgOiAnJ1xuICAgIGlmIChhKSB7XG4gICAgICBtYXJrcy5wbGF0ZSA9IGEucGxhdGUuY2xpcCA/PyAoYS5wbGF0ZS5vbiA/ICdvbicgOiAnb2ZmJylcbiAgICAgIG1hcmtzLnRvb2xoZWFkID0gYS50dWJlLmNsaXAgPz8gKGEudHViZS5hdHRhY2hlZCA/IChhLnR1YmUudW5sb2NraW5nID8gJ3VubG9ja2luZycgOiAnY29ubmVjdGVkJykgOiAnZGlzY29ubmVjdGVkJylcbiAgICAgIG1hcmtzLmNvbHVtbiA9IGEuY29sdW1uLmNsaXAgPz8gYS5jb2x1bW4uc3RhdGVcbiAgICAgIG1hcmtzLmZpbGFtZW50ID0gYS5maWxhbWVudC5jbGlwID8/IChhLmZpbGFtZW50LmxvYWRlZCA/ICdsb2FkZWQnIDogJ2VtcHR5JylcbiAgICB9XG4gICAgY29uc3QgY2xpcHMgPSBhID8geyBwbGF0ZTogYS5wbGF0ZS5jbGlwLCB0b29saGVhZDogYS50dWJlLmNsaXAsIGNvbHVtbjogYS5jb2x1bW4uY2xpcCwgZmlsYW1lbnQ6IGEuZmlsYW1lbnQuY2xpcCB9IDoge31cbiAgICBmb3IgKGNvbnN0IFtwYXJ0LCBjbGlwXSBvZiBPYmplY3QuZW50cmllcyhjbGlwcykpIHtcbiAgICAgIGlmICghY2xpcCB8fCB0aGlzLnBsYXlpbmdbcGFydF0gPT09IGNsaXApIGNvbnRpbnVlXG4gICAgICB0aGlzLnBsYXlpbmdbcGFydF0gPSBjbGlwXG4gICAgICBjb25zdCBwbGF5ZWQgPSAoZWwuZGF0YXNldC5wbGF5ZWQgPz8gJycpLnNwbGl0KCcgJykuZmlsdGVyKEJvb2xlYW4pXG4gICAgICBwbGF5ZWQucHVzaChgJHtwYXJ0fToke2NsaXB9YClcbiAgICAgIGVsLmRhdGFzZXQucGxheWVkID0gcGxheWVkLnNsaWNlKC0yNCkuam9pbignICcpXG4gICAgfVxuICAgIGZvciAoY29uc3QgW3BhcnQsIGNsaXBdIG9mIE9iamVjdC5lbnRyaWVzKGNsaXBzKSkgaWYgKCFjbGlwKSBkZWxldGUgdGhpcy5wbGF5aW5nW3BhcnRdXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMobWFya3MpKSB7XG4gICAgICBpZiAoZWwuZGF0YXNldFtrZXldICE9PSB2YWx1ZSkgZWwuZGF0YXNldFtrZXldID0gdmFsdWVcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIGNsaXAgZWFjaCBwYXJ0IGlzIHBsYXlpbmcgbm93LCBzbyBhIGNsaXAgaXMgbGlzdGVkIGluIGRhdGEtcGxheWVkIG9uY2UgcGVyIHN0YXJ0LiBLZXB0IG91dCBvZiBWdWUuICovXG4gIGdldCBwbGF5aW5nICgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgICBsZXQgcCA9IHBsYXlpbmdCeVZpZXcuZ2V0KHRoaXMpXG4gICAgaWYgKCFwKSBwbGF5aW5nQnlWaWV3LnNldCh0aGlzLCBwID0ge30pXG4gICAgcmV0dXJuIHBcbiAgfVxuXG4gIC8vIC0tIHdoZXJlIHRoZSBoZWFkIGFuZCB0aGUgYmVkIGFyZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgQFdhdGNoKCdwb3NlJylcbiAgb25Qb3NlIChwb3NlOiBNb2RlbFBvc2UpIHtcbiAgICBpZiAoc2FtZVBvc2UodGhpcy5sYXN0UG9zZSwgcG9zZSkpIHJldHVyblxuICAgIHRoaXMubGFzdFBvc2UgPSBwb3NlXG4gICAgdGhpcy5zeW5jKCkuc2V0UG9zZShwb3NlKVxuICAgIHRoaXMudmlld2VyPy53YWtlKClcbiAgfVxuXG4gIEBXYXRjaCgnYWNjZXNzb3JpZXMnLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICBvbkFjY2Vzc29yaWVzIChhOiBBY2Nlc3NvcmllcyB8IG51bGwpIHtcbiAgICBpZiAoIWEgfHwgc2FtZUFjY2Vzc29yaWVzKHRoaXMubGFzdEFjY2Vzc29yaWVzLCBhKSkgcmV0dXJuXG4gICAgdGhpcy5sYXN0QWNjZXNzb3JpZXMgPSBhXG4gICAgdGhpcy5zeW5jKCkuYWNjZXNzb3JpZXMucmVkdWNlZE1vdGlvbiA9ICF0aGlzLnZpZXdlclNldHRpbmdzLmFuaW1hdGVcbiAgICB0aGlzLnN5bmMoKS5zZXRBY2Nlc3NvcmllcyhhLCBwZXJmb3JtYW5jZS5ub3coKSwgISF0aGlzLnByaW50UGF0aClcbiAgICB0aGlzLnZpZXdlcj8ud2FrZSgpXG4gIH1cblxuICAvKiogQSBtb3Rpb24gcmVwb3J0OiB3aGVyZSB0aGUgaGVhZCBpcyBub3csIGhvdyBmYXN0IGl0IGFuZCB0aGUgZmlsYW1lbnQgYXJlIGdvaW5nLiAqL1xuICByZXBvcnQgKCkge1xuICAgIGNvbnN0IHByaW50ZXIgPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXJcbiAgICBjb25zdCBtb3Rpb24gPSBwcmludGVyLm1vdGlvbl9yZXBvcnRcbiAgICBjb25zdCBsaXZlID0gbW90aW9uPy5saXZlX3Bvc2l0aW9uIGFzIG51bWJlcltdIHwgdW5kZWZpbmVkXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGxpdmUpIHx8IGxpdmUubGVuZ3RoIDwgMykgcmV0dXJuXG4gICAgY29uc3QgdmVsb2NpdHkgPSAobW90aW9uLmxpdmVfdmVsb2NpdHkgYXMgbnVtYmVyIHwgdW5kZWZpbmVkKSA/PyAwXG4gICAgY29uc3QgZXh0cnVkZXJWZWxvY2l0eSA9IChtb3Rpb24ubGl2ZV9leHRydWRlcl92ZWxvY2l0eSBhcyBudW1iZXIgfCB1bmRlZmluZWQpID8/IDBcbiAgICBjb25zdCBrZXkgPSBgJHtsaXZlWzBdfSwke2xpdmVbMV19LCR7bGl2ZVsyXX0sJHt2ZWxvY2l0eX0sJHtleHRydWRlclZlbG9jaXR5fWBcbiAgICBpZiAoa2V5ID09PSB0aGlzLmxhc3RSZXBvcnQpIHJldHVyblxuICAgIHRoaXMubGFzdFJlcG9ydCA9IGtleVxuICAgIGNvbnN0IGVuZCA9IHByaW50ZXIudG9vbGhlYWQ/LnBvc2l0aW9uIGFzIG51bWJlcltdIHwgdW5kZWZpbmVkXG4gICAgdGhpcy5zeW5jKCkub2JzZXJ2ZSh7XG4gICAgICBhdDogcGVyZm9ybWFuY2Uubm93KCksXG4gICAgICBsaXZlOiBbbGl2ZVswXSwgbGl2ZVsxXSwgbGl2ZVsyXV0sXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGV4dHJ1ZGVyVmVsb2NpdHksXG4gICAgICB0YXJnZXQ6IEFycmF5LmlzQXJyYXkoZW5kKSAmJiBlbmQubGVuZ3RoID49IDMgPyBbZW5kWzBdLCBlbmRbMV0sIGVuZFsyXV0gOiBbbGl2ZVswXSwgbGl2ZVsxXSwgbGl2ZVsyXV0sXG4gICAgICBzcGVlZEZhY3RvcjogKHByaW50ZXIuZ2NvZGVfbW92ZT8uc3BlZWRfZmFjdG9yIGFzIG51bWJlciB8IHVuZGVmaW5lZCkgPz8gMSxcbiAgICAgIGZpbGVQb3NpdGlvbjogdGhpcy5wcmludFN0YXRlID09PSAncHJpbnRpbmcnID8gKHByaW50ZXIudmlydHVhbF9zZGNhcmQ/LmZpbGVfcG9zaXRpb24gYXMgbnVtYmVyIHwgdW5kZWZpbmVkKSA/PyBudWxsIDogbnVsbFxuICAgIH0pXG4gICAgdGhpcy52aWV3ZXI/Lndha2UoKVxuICB9XG5cbiAgLy8gLS0gdGhlIHByaW50IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogVGhlIGpvYidzIGZpbGUsIGZyb20gdGhlIEctY29kZSByb290LCB3aGlsZSBpdHMgcGFydCBpcyBvbiB0aGUgcGxhdGUuICovXG4gIGdldCBqb2JQYXRoICgpOiBzdHJpbmcge1xuICAgIGlmICghUEFSVF9TVEFURVMuaW5jbHVkZXModGhpcy5wcmludFN0YXRlKSkgcmV0dXJuICcnXG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIucHJpbnRfc3RhdHM/LmZpbGVuYW1lIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgPz8gJydcbiAgfVxuXG4gIC8qKiBUaGUgZmlsZSBGbHVpZGQncyBHLWNvZGUgcHJldmlldyBob2xkcywgcGFyc2VkLiAqL1xuICBnZXQgcHJldmlld1BhdGggKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuJHN0b3JlLnN0YXRlLmdjb2RlUHJldmlldy5wYXJzZXJXb3JrZXIpIHJldHVybiAnJ1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydnY29kZVByZXZpZXcvZ2V0RmlsZSddIGFzIHsgZmlsZW5hbWU6IHN0cmluZywgcGF0aD86IHN0cmluZyB9IHwgdW5kZWZpbmVkXG4gICAgaWYgKCFmaWxlKSByZXR1cm4gJydcbiAgICByZXR1cm4gZmlsZS5wYXRoID8gYCR7ZmlsZS5wYXRofS8ke2ZpbGUuZmlsZW5hbWV9YCA6IGZpbGUuZmlsZW5hbWVcbiAgfVxuXG4gIGdldCBmaWxlUG9zaXRpb24gKCk6IG51bWJlciB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIudmlydHVhbF9zZGNhcmQ/LmZpbGVfcG9zaXRpb24gYXMgbnVtYmVyIHwgdW5kZWZpbmVkKSA/PyAwXG4gIH1cblxuICAvKiogQnVpbGRzIHRoZSBqb2IncyBwcmludCBvbmNlIHRoZSBwcmV2aWV3IGhvbGRzIGl0cyBmaWxlLCBhbmQgYXNrcyBmb3IgdGhlIGZpbGUgd2hlbiBpdCBjYW4uICovXG4gIEBXYXRjaCgnam9iUGF0aCcsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIEBXYXRjaCgncHJldmlld1BhdGgnKVxuICBvblByaW50RmlsZSAoKSB7XG4gICAgaWYgKCF0aGlzLmpvYlBhdGgpIHtcbiAgICAgIHRoaXMucHJpbnRQYXRoID0gbnVsbFxuICAgICAgdGhpcy5tb3Rpb25QYXRoID0gbnVsbFxuICAgICAgdGhpcy5wcmludFBhdGhGb3IgPSAnJ1xuICAgICAgdGhpcy5wYXJ0T25seUZvciA9ICcnXG4gICAgfSBlbHNlIGlmICh0aGlzLnByZXZpZXdQYXRoID09PSB0aGlzLmpvYlBhdGggJiYgdGhpcy5wcmludFBhdGhGb3IgIT09IHRoaXMuam9iUGF0aCkge1xuICAgICAgY29uc3QgbW92ZXMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydnY29kZVByZXZpZXcvZ2V0TW92ZXMnXSBhcyBNb3ZlW11cbiAgICAgIHRoaXMucHJpbnRQYXRoID0gT2JqZWN0LmZyZWV6ZSh0b29scGF0aEZyb20obW92ZXMpKVxuICAgICAgdGhpcy5tb3Rpb25QYXRoID0gbW92ZXMubGVuZ3RoIDw9IE1BWF9GT0xMT1dFRF9NT1ZFUyA/IE9iamVjdC5mcmVlemUobW90aW9uUGF0aEZyb20obW92ZXMpKSA6IG51bGxcbiAgICAgIHRoaXMucHJpbnRQYXRoRm9yID0gdGhpcy5qb2JQYXRoXG4gICAgfSBlbHNlIGlmICh0aGlzLnByZXZpZXdQYXRoICE9PSB0aGlzLmpvYlBhdGgpIHtcbiAgICAgIHRoaXMubG9hZEpvYigpXG4gICAgfVxuICAgIHRoaXMuZHJhd1ByaW50KClcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBqb2IncyBmaWxlIGludG8gdGhlIHByZXZpZXcsIHF1aWV0bHk6IHdoaWxlIGl0IHByaW50cywgb25cbiAgICogdGhpcyBuZXR3b3JrLCBhIGZpbGUgdW5kZXIgMTYgTUIsIG5vdGhpbmcgcGFyc2luZy4gQSBmaW5pc2hlZCBwYXJ0IGlzXG4gICAqIGRyYXduIG9ubHkgZnJvbSBhIHByZXZpZXcgdGhhdCBhbHJlYWR5IGhvbGRzIGl0LCBzbyBvcGVuaW5nIHRoZVxuICAgKiBvdmVydmlldyBhZnRlciBhIHByaW50IGRvZXNuJ3QgZG93bmxvYWQgdGhlIGZpbGUgYWdhaW4uXG4gICAqL1xuICBhc3luYyBsb2FkSm9iICgpIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmN1cnJlbnRfZmlsZSBhcyB7IGZpbGVuYW1lPzogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBzaXplPzogbnVtYmVyIH0gfCB1bmRlZmluZWRcbiAgICBjb25zdCBqb2IgPSB0aGlzLmpvYlBhdGhcbiAgICBpZiAoIXRoaXMubGl2ZSB8fCAham9iIHx8IHRoaXMubG9hZGluZ0ZvciA9PT0gam9iIHx8IHRoaXMucGFydE9ubHlGb3IgPT09IGpvYikgcmV0dXJuXG4gICAgaWYgKHRoaXMucHJpbnRTdGF0ZSAhPT0gJ3ByaW50aW5nJyAmJiB0aGlzLnByaW50U3RhdGUgIT09ICdwYXVzZWQnKSByZXR1cm5cbiAgICBpZiAoIWZpbGU/LmZpbGVuYW1lIHx8ICFmaWxlLnNpemUpIHJldHVyblxuICAgIGNvbnN0IGludG9QcmV2aWV3ID0gZmlsZS5zaXplIDw9IEFVVE9fTE9BRF9CWVRFU1xuICAgIC8vIFRoZSBwcmV2aWV3IGlzIGJ1c3kgd2l0aCBhbm90aGVyIGZpbGU6IG9uUHJpbnRGaWxlIHRyaWVzIGFnYWluIHdoZW4gaXQgZW5kcy5cbiAgICBpZiAoaW50b1ByZXZpZXcgJiYgdGhpcy4kc3RvcmUuc3RhdGUuZ2NvZGVQcmV2aWV3LnBhcnNlcldvcmtlcikgcmV0dXJuXG4gICAgaWYgKCFpbnRvUHJldmlldyAmJiBmaWxlLnNpemUgPiAoY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgPyBQQVJUX09OTFlfQllURVMgLyAzIDogUEFSVF9PTkxZX0JZVEVTKSkgcmV0dXJuXG4gICAgdGhpcy5sb2FkaW5nRm9yID0gam9iXG4gICAgdHJ5IHtcbiAgICAgIGlmICghaW50b1ByZXZpZXcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkUGFydE9ubHkoam9iKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyRmlsZXNHZXQ8c3RyaW5nPihgZ2NvZGVzLyR7am9ifWAsIHsgcmVzcG9uc2VUeXBlOiAndGV4dCcsIHRyYW5zZm9ybVJlc3BvbnNlOiBbdiA9PiB2XSB9KVxuICAgICAgaWYgKHRoaXMuam9iUGF0aCAhPT0gam9iIHx8ICFyZXNwb25zZT8uZGF0YSkgcmV0dXJuXG4gICAgICAvLyBBc2tlZCBhZ2FpbiBhZnRlciB0aGUgZG93bmxvYWQ6IGFub3RoZXIgcHJldmlldyBtYXkgaGF2ZSBiZWd1blxuICAgICAgLy8gcGFyc2luZyBtZWFud2hpbGUgKG9uUHJpbnRGaWxlIHRyaWVzIGFnYWluIHdoZW4gaXQgZW5kcyksIG9yIHRoZVxuICAgICAgLy8gcHJldmlldyBtYXkgaG9sZCB0aGlzIGZpbGUgYWxyZWFkeS5cbiAgICAgIGlmICh0aGlzLiRzdG9yZS5zdGF0ZS5nY29kZVByZXZpZXcucGFyc2VyV29ya2VyIHx8IHRoaXMucHJldmlld1BhdGggPT09IGpvYikgcmV0dXJuXG4gICAgICBjb25zdCBhcHBGaWxlID0geyAuLi5maWxlLCBwYXRoOiBmaWxlLnBhdGggPz8gam9iLnNwbGl0KCcvJykuc2xpY2UoMCwgLTEpLmpvaW4oJy8nKSB9XG4gICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnZ2NvZGVQcmV2aWV3L2xvYWRHY29kZScsIHsgZmlsZTogYXBwRmlsZSwgZ2NvZGU6IHJlc3BvbnNlLmRhdGEgfSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1ttMV0gdGhlIHByaW50IGNvdWxkIG5vdCBiZSBmZXRjaGVkOyB0aGUgc3RhZ2UgZ29lcyBvbiB3aXRob3V0IGl0JywgZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gT25seSBhIHJlcXVlc3QgaW4gZmxpZ2h0IGhvbGRzIHRoZSBqb2IgYmFjazsgYSBmYWlsZWQgb3Igc3RhbGUgb25lIGxldHMgdGhlIG5leHQgdHJ5IGdvLlxuICAgICAgaWYgKHRoaXMubG9hZGluZ0ZvciA9PT0gam9iKSB0aGlzLmxvYWRpbmdGb3IgPSAnJ1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWFkcyBhIGZpbGUgdG9vIGJpZyBmb3IgdGhlIHByZXZpZXcsIGZvciB0aGUgcGFydCBhbG9uZTogdGhlIGhlYWQgdGhlbiBmb2xsb3dzIHRoZSByZXBvcnRzIG9ubHkuICovXG4gIGFzeW5jIGxvYWRQYXJ0T25seSAoam9iOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGh0dHBDbGllbnRBY3Rpb25zLnNlcnZlckZpbGVzR2V0PEFycmF5QnVmZmVyPihgZ2NvZGVzLyR7am9ifWAsIHsgcmVzcG9uc2VUeXBlOiAnYXJyYXlidWZmZXInIH0pXG4gICAgaWYgKHRoaXMuam9iUGF0aCAhPT0gam9iIHx8ICFyZXNwb25zZT8uZGF0YSkgcmV0dXJuXG4gICAgdGhpcy5wcmludFBhdGggPSBPYmplY3QuZnJlZXplKHRvb2xwYXRoRnJvbUdjb2RlKG5ldyBVaW50OEFycmF5KHJlc3BvbnNlLmRhdGEpKSlcbiAgICB0aGlzLm1vdGlvblBhdGggPSBudWxsXG4gICAgdGhpcy5wcmludFBhdGhGb3IgPSBqb2JcbiAgICB0aGlzLnBhcnRPbmx5Rm9yID0gam9iXG4gICAgdGhpcy5kcmF3UHJpbnQoKVxuICB9XG5cbiAgLyoqIFRoZSBqb2IncyBmaWxlIG9uY2UgaXRzIG1ldGFkYXRhIGhhcyBjb21lOiBhIHByaW50IHRoYXQgc3RhcnRzIGdldHMgaXQgYSBtb21lbnQgYWZ0ZXIgaXRzIG5hbWUuICovXG4gIGdldCBqb2JGaWxlS25vd24gKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5jdXJyZW50X2ZpbGUgYXMgeyBmaWxlbmFtZT86IHN0cmluZywgc2l6ZT86IG51bWJlciB9IHwgdW5kZWZpbmVkXG4gICAgcmV0dXJuIGZpbGU/LmZpbGVuYW1lICYmIGZpbGUuc2l6ZSA/IGAke2ZpbGUuZmlsZW5hbWV9OiR7ZmlsZS5zaXplfWAgOiAnJ1xuICB9XG5cbiAgQFdhdGNoKCdqb2JGaWxlS25vd24nKVxuICBvbkpvYkZpbGVLbm93biAoa25vd246IHN0cmluZykge1xuICAgIGlmIChrbm93bikgdGhpcy5vblByaW50RmlsZSgpXG4gIH1cblxuICAvKipcbiAgICogVGhlIGZpbGFtZW50J3MgY29sb3VyOiB0aGUgb25lIHNldCBmb3Igd2hhdCdzIGxvYWRlZCAoT3ZlcnZpZXcsIENvbnRyb2xcbiAgICogb3IgdGhlIHNsaWNlciwga2VwdCBvbiB0aGUgcHJpbnRlciBhcyBtdW9uX21hdGVyaWFsX2NvbG91ciksIHNpbmNlIHRoYXQgaXNcbiAgICogd2hhdCBpcyBpbiB0aGUgbm96emxlOyBlbHNlIHRoZSBmaWxlJ3Mgc2xpY2VyIHNldHRpbmdzLlxuICAgKi9cbiAgZ2V0IHBhcnRDb2xvdXIgKCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMubG9hZGVkQ29sb3VyKSByZXR1cm4gcGFyc2VJbnQodGhpcy5sb2FkZWRDb2xvdXIuc2xpY2UoMSksIDE2KVxuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmN1cnJlbnRfZmlsZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZFxuICAgIHJldHVybiBwYXJ0Q29sb3VyKG1ldGFkYXRhPy5maWxhbWVudF9jb2xvcnMgPz8gbWV0YWRhdGE/LmZpbGFtZW50X2NvbG91cilcbiAgfVxuXG4gIEBXYXRjaCgncGFydENvbG91cicpXG4gIG9uUGFydENvbG91ciAoKSB7XG4gICAgdGhpcy5kcmF3UHJpbnQoKVxuICB9XG5cbiAgZHJhd1ByaW50ICgpIHtcbiAgICAvLyBBIGZpbmlzaGVkIHByaW50IGlzIGZvbGxvd2VkIG5vIGxvbmdlcjogYWxsIG9mIGl0IGlzIG9uIHRoZSBwbGF0ZS5cbiAgICB0aGlzLnN5bmMoKS5zZXRQYXRoKHRoaXMucHJpbnRTdGF0ZSA9PT0gJ2NvbXBsZXRlJyA/IG51bGwgOiB0aGlzLm1vdGlvblBhdGgpXG4gICAgdGhpcy5vbkZpbGVQb3NpdGlvbigpXG4gICAgdGhpcy52aWV3ZXI/LnNldFByaW50KHRoaXMuc2hvd25QcmludFBhdGgsIHRoaXMucGFydENvbG91cilcbiAgfVxuXG4gIEBXYXRjaCgnZmlsZVBvc2l0aW9uJylcbiAgb25GaWxlUG9zaXRpb24gKCkge1xuICAgIC8vIE9ubHkgYSBjaGFuZ2VkIGNvdW50IGNoYW5nZXMgdGhlIHBpY3R1cmU6IGEgc3RhdHVzIHVwZGF0ZSB0aGF0IGxlYXZlcyBpdCBhbG9uZSBhc2tzIGZvciBubyBmcmFtZSAoYSBmcmFtZSBjb3N0cyBzZWNvbmRzIG9uIGEgQ1BVLW9ubHkgR0wpLlxuICAgIGlmICh0aGlzLnN5bmMoKS5zZXRGaWxlRG9uZSh0aGlzLnByaW50UGF0aCA/IHNlZ21lbnRzRG9uZSh0aGlzLnByaW50UGF0aCwgdGhpcy5maWxlUG9zaXRpb24pIDogMCkpIHRoaXMudmlld2VyPy53YWtlKClcbiAgfVxuXG4gIC8qKiBBIG5ldyBwcmludCBjbGVhcnMgd2hhdCB0aGUgbGFzdCBvbmUgbGVmdCBvbiB0aGUgcGxhdGU7IGEgcmVzdW1lIGRvZXNuJ3QuICovXG4gIEBXYXRjaCgncHJpbnRTdGF0ZScpXG4gIG9uUHJpbnRTdGF0ZSAobm93OiBzdHJpbmcsIGJlZm9yZTogc3RyaW5nKSB7XG4gICAgaWYgKG5vdyA9PT0gJ3ByaW50aW5nJyAmJiBiZWZvcmUgIT09ICdwYXVzZWQnKSB7XG4gICAgICB0aGlzLnN5bmMoKS50cmFjZS5jbGVhcigpXG4gICAgICB0aGlzLnN5bmMoKS5uZXdQcmludCgpXG4gICAgfVxuICAgIHRoaXMuZHJhd1ByaW50KClcbiAgfVxuXG4gIC8vIC0tIHRoZSBzY3JlZW4sIHRoZSBzdHJpcHMgYW5kIHRoZSBwbGF0ZSdzIHRvdWNoZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBzY3JlZW4gKCk6IFNjcmVlblN0YXRlIHtcbiAgICBjb25zdCBwcmludGVyID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgY29uc3QgcGhhc2UgPSB0aGlzLm1lc2hSdW4/LnByb2dyZXNzLnBoYXNlXG4gICAgY29uc3QgcmVtZW1iZXJlZCA9IHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWRcbiAgICByZXR1cm4gc2NyZWVuRnJvbSh7XG4gICAgICBwcmludFN0YXRlOiB0aGlzLnByaW50U3RhdGUsXG4gICAgICB1cGRhdGluZzogYmFubmVyVmlzaWJsZShyZW1lbWJlcmVkLCB1cGRhdGVXYXRjaC5ub3csICEhdXBkYXRlV2F0Y2guYW5zd2VyZWQpLFxuICAgICAgaG9taW5nOiB0aGlzLmhhc1dhaXQoW1dhaXRzLm9uSG9tZUFsbCwgV2FpdHMub25Ib21lWFksIFdhaXRzLm9uSG9tZVgsIFdhaXRzLm9uSG9tZVksIFdhaXRzLm9uSG9tZVpdKSB8fCBwaGFzZSA9PT0gJ2hvbWluZycsXG4gICAgICBwcm9iaW5nOiB0aGlzLm1lYXN1cmluZyB8fCBwaGFzZSA9PT0gJ21lYXN1cmluZycsXG4gICAgICBwcm9ncmVzczogdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludFByb2dyZXNzJ10gYXMgbnVtYmVyLFxuICAgICAgbm96emxlOiBwcmludGVyLmV4dHJ1ZGVyID8/IG51bGwsXG4gICAgICBiZWQ6IHByaW50ZXIuaGVhdGVyX2JlZCA/PyBudWxsLFxuICAgICAgZmlsZW5hbWU6IChwcmludGVyLnByaW50X3N0YXRzPy5maWxlbmFtZSBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnLFxuICAgICAgY29ubmVjdGVkOiAhIXRoaXMuJHN0b3JlLnN0YXRlLnNvY2tldC5vcGVuXG4gICAgfSlcbiAgfVxuXG4gIEBXYXRjaCgnc2NyZWVuJylcbiAgb25TY3JlZW4gKHNjcmVlbjogU2NyZWVuU3RhdGUpIHtcbiAgICB0aGlzLnZpZXdlcj8uc2V0U2NyZWVuKHNjcmVlbilcbiAgfVxuXG4gIC8qKiBUaGUgc3RyaXBzJyBwaXhlbHM6IEtsaXBwZXIncyBjb2xvcl9kYXRhIGZvciB0aGUgTTEncyB0d28gbmVvcGl4ZWwgY2hhaW5zLiAqL1xuICBnZXQgbGVkcyAoKTogW0xlZFN0cmlwLCBMZWRTdHJpcF0ge1xuICAgIGNvbnN0IHByaW50ZXIgPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXJcbiAgICBjb25zdCBzdHJpcCA9IChuYW1lOiBzdHJpbmcpID0+IChwcmludGVyW2BuZW9waXhlbCAke25hbWV9YF0/LmNvbG9yX2RhdGEgYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZCkgPz8gbnVsbFxuICAgIHJldHVybiBbc3RyaXAoJ0xlZnQnKSwgc3RyaXAoJ1JpZ2h0JyldXG4gIH1cblxuICBAV2F0Y2goJ2xlZHMnKVxuICBvbkxlZHMgKCkge1xuICAgIHRoaXMudmlld2VyPy5zZXRMZWRzKC4uLnRoaXMubGVkcylcbiAgfVxuXG4gIGdldCBsaXZlVGFwcyAoKTogUGxhdGVUYXBbXSB7XG4gICAgcmV0dXJuIHBsYXRlVGFwcyh0aGlzLnByb2JlVG91Y2hlcylcbiAgfVxuXG4gIC8qKiBTaG93cyB0aGUgdG91Y2hlcyBhcyB0aGV5IGNvbWUsIGFuZCBrZWVwcyB0aGUgbGFzdCBmb3IgYSB3aGlsZSBvbmNlIHRoZXkgc3RvcC4gKi9cbiAgQFdhdGNoKCdsaXZlVGFwcycpXG4gIG9uTGl2ZVRhcHMgKHRhcHM6IFBsYXRlVGFwW10pIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50YXBzVGltZXIpXG4gICAgaWYgKHRhcHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnRhcHNTaG93biA9IHRhcHNcbiAgICAgIHRoaXMudmlld2VyPy5zZXRUYXBzKHRhcHMpXG4gICAgfSBlbHNlIGlmICh0aGlzLnRhcHNTaG93bi5sZW5ndGgpIHtcbiAgICAgIHRoaXMudGFwc1RpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnRhcHNTaG93biA9IFtdXG4gICAgICAgIHRoaXMudmlld2VyPy5zZXRUYXBzKFtdKVxuICAgICAgfSwgVEFQX0xJTkdFUl9NUylcbiAgICB9XG4gIH1cblxuICBnZXQgZGFyayAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHZ1ZXRpZnkudGhlbWUuZGFya1xuICB9XG5cbiAgLyoqIFRoZSBzdGFnZSB0YWtlcyB0aGUgdGhlbWUncyBjb2xvdXJzLiAqL1xuICBAV2F0Y2goJ2RhcmsnKVxuICBhc3luYyBvbkRhcmsgKCkge1xuICAgIGF3YWl0IHRoaXMuJG5leHRUaWNrKClcbiAgICB0aGlzLnZpZXdlcj8ucmVzdHlsZSgpXG4gIH1cblxuICBAV2F0Y2goJ3NoaWZ0JylcbiAgb25TaGlmdCAoc2hhcmU6IG51bWJlcikge1xuICAgIHRoaXMudmlld2VyPy5zZXRTaGlmdChzaGFyZSlcbiAgfVxuXG4gIEBXYXRjaCgnc3RhdGUnKVxuICBvblN0YXRlIChzdGF0ZTogVGh1bWJTdGF0ZSkge1xuICAgIGlmIChzdGF0ZSA9PT0gJ29mZmxpbmUnKSB0aGlzLnN0b3AoKVxuICAgIGVsc2UgdGhpcy53YWtlKClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm0xLWxpdmVfX3Nsb3Qge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBpbnNldDogMDtcbiAgfVxuXG4gIC8qIFRoZSBjYW52YXMgaXMgbWFkZSBpbiBjb2RlIChhbmQga2VwdCBiZXR3ZWVuIHZpZXdzKSwgc28gaXQgaGFzIG5vIHNjb3BlIG9mIGl0cyBvd24uICovXG4gIC5tMS1saXZlIDpkZWVwKC5tMS1saXZlX19jYW52YXMpIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaW5zZXQ6IDA7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjRzIGVhc2U7XG4gICAgY3Vyc29yOiBncmFiO1xuICAgIHRvdWNoLWFjdGlvbjogcGFuLXk7XG5cbiAgICAmOmFjdGl2ZSB7XG4gICAgICBjdXJzb3I6IGdyYWJiaW5nO1xuICAgIH1cbiAgfVxuXG4gIC8qIFRoZSBwbGFjZSBvZiB0aGUgaGVhZCBvciBiZWQgaXNuJ3Qga25vd24gKG5vdCBob21lZCk6IHRoZXkgc2l0IHdoZXJlIHRoZXkgd2VyZSBsYXN0IGRyYXduLCBmYWRlZCBhIGxpdHRsZS4gKi9cbiAgLm0xLWxpdmUgOmRlZXAoLm0xLWxpdmVfX2NhbnZhc1tkYXRhLXBsYWNlPSd1bmtub3duJ10pIHtcbiAgICBvcGFjaXR5OiAwLjcyO1xuICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC40cyBlYXNlO1xuICB9XG5cbiAgLm0xLWxpdmUtLXN0aWxsIDpkZWVwKC5tMS1saXZlX19jYW52YXMpIHtcbiAgICB0cmFuc2l0aW9uOiBub25lO1xuICB9XG5cbiAgLm0xLWxpdmUtLW9uIHtcbiAgICA6ZGVlcCgubTEtbGl2ZV9fY2FudmFzKSB7XG4gICAgICBvcGFjaXR5OiAxO1xuICAgIH1cblxuICAgIDpkZWVwKC5wcmludGVyLXN0YWdlX19tMSkge1xuICAgICAgb3BhY2l0eTogMDtcbiAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC40cyBlYXNlO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL20xL00xTGl2ZS52dWUifQ==