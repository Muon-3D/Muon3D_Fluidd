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
import TypedCommandsMixin from "/src/mixins/typed-commands.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import ToolheadMixin from "/src/mixins/toolhead.ts";
import {
  clampTo,
  fanCommand,
  fanPercent,
  fileFilament,
  filamentSensed,
  lightsOutput,
  loadedChoice,
  materialChoices,
  materialInUse,
  materialsFrom,
  pinCommand,
  pinPercent,
  normaliseColour,
  saveMaterialColourCommand,
  saveMaterialCommand,
  savedMaterialColour,
  savedMaterialName,
  hotendLimitReason
} from "/src/services/control/model.ts";
import { presetCommands } from "/src/util/temperature-preset.ts";
import { zAdjustCommand } from "/src/services/control/z-adjust.ts";
import { endOwnMotion, handMoveSettling, headStatus, lockHandMove, noteOwnMotion, ownMotionActive, releaseHandMove, scriptsInFlight, meshSpan, planMove, readNoGo } from "/src/services/control/safe-move.ts";
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
import { fastPercent, materialMaxFlow, peakFlow, speedChoices } from "/src/services/control/speed.ts";
const motionClock = Vue.observable({ epoch: 0 });
let motionTimer = null;
const peakFlows = /* @__PURE__ */ new WeakMap();
const limitSetting = {
  VELOCITY: "max_velocity",
  ACCEL: "max_accel",
  SQUARE_CORNER_VELOCITY: "square_corner_velocity",
  MINIMUM_CRUISE_RATIO: "minimum_cruise_ratio",
  ACCEL_TO_DECEL: "max_accel_to_decel"
};
export const NOZZLE_FLOOR = 170;
export const BED_FLOOR = 40;
let ControlMixin = class extends Mixins(TypedCommandsMixin, ToolheadMixin) {
  get controlReady() {
    return this.commandControlAvailable && this.klippyReady && this.klippyConnected;
  }
  adjustZ(by) {
    if (!this.controlReady || !this.isHomed("Z") || this.hasWait(this.$waits.onZAdjust)) return;
    if (!this.busy && by < 0) {
      const wait = this.handMoveWait();
      if (wait) {
        this.refuseMove(wait);
        return;
      }
    }
    const command = zAdjustCommand(by, true);
    if (command) this.sendGcode(command, this.$waits.onZAdjust);
  }
  get panelTarget() {
    return `${this.commandTarget}|${cloudState.account?.id ?? ""}`;
  }
  get controlLock() {
    if (!this.commandControlAvailable) return "Connect to a printer you can control first.";
    return this.controlReady ? "" : this.notReadyReason;
  }
  /** Printing or paused: moves, extrusion and motors are left alone. */
  /** Why the controls are locked when Klipper isn't ready: the connection, when that is what's gone. */
  get notReadyReason() {
    return this.socketConnected ? "Klipper is not ready" : "Not connected to the printer";
  }
  /**
   * Whether this is a Muon printer (an M1), from the gate primitive
   * `server/isMuonPrinter` (#296): true, false, or null until server.info
   * has answered. Named apart from MuonGatesMixin's isMuonPrinter so the
   * two mixins can sit together.
   */
  get muonPrinter() {
    const v = this.$store.getters["server/isMuonPrinter"];
    return v === void 0 ? null : v;
  }
  /**
   * A real print is running or paused, by print_stats (Klipper's own record
   * of a print), not by idle_timeout, which reads Printing for ANY G-code,
   * a jog included (KAN-2120). Only this says "printing" to the person.
   */
  get printLocked() {
    const state = String(this.$store.state.printer.printer.print_stats?.state ?? "").toLowerCase();
    return state === "printing" || state === "paused" || this.printerPrinting || this.printerPaused;
  }
  /**
   * The printer is busy with this page's own hand move (a jog, the trackpad,
   * Go to) and nothing else: KAN-2120. Moving stays open then, so a new
   * target is planned from the commanded end position and queued behind it.
   */
  get busyWithOwnMove() {
    const seen = motionClock.epoch >= 0;
    const commanded = this.$store.state.printer.printer.gcode_move?.gcode_position;
    return seen && !this.printLocked && this.printerState === "busy" && ownMotionActive(this.panelTarget, Date.now(), commanded);
  }
  /**
   * Moves, extrusion and motors are left alone: a real print, or the printer
   * busy with something that isn't this page's own hand move (homing, a
   * macro, another client). See printLocked and busyWithOwnMove.
   */
  get busy() {
    return this.printLocked || this.printerState === "busy" && !this.busyWithOwnMove;
  }
  onPrinterStateForOwnMove(now, before) {
    if (before === "busy" && now !== "busy") {
      endOwnMotion();
      motionClock.epoch++;
    }
  }
  /** Why moving is locked, in words: "printing" only for a real print. '' when it isn't. */
  get moveLockReason() {
    if (this.printLocked) return "Not while printing.";
    if (this.busy) return "The printer is busy. Moving comes back when it finishes.";
    return "";
  }
  get toolhead() {
    return this.$store.state.printer.printer.toolhead ?? {};
  }
  get position() {
    return this.toolhead.position ?? [0, 0, 0, 0];
  }
  get axisMin() {
    return this.toolhead.axis_minimum ?? [0, 0, 0];
  }
  get axisMax() {
    return this.toolhead.axis_maximum ?? [200, 200, 200];
  }
  get homedAxes() {
    return (this.toolhead.homed_axes ?? "").toUpperCase();
  }
  get xySpeed() {
    return this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed;
  }
  get zSpeed() {
    return this.$store.state.config.uiSettings.general.defaultToolheadZSpeed;
  }
  // -- heat ------------------------------------------------------------------
  get heaters() {
    return this.$store.getters["printer/getHeaters"] ?? [];
  }
  get nozzle() {
    return this.heaters.find((h) => h.name === "extruder") ?? null;
  }
  get bed() {
    return this.heaters.find((h) => h.name === "heater_bed") ?? null;
  }
  get chamber() {
    const sensors = this.$store.getters["printer/getSensors"] ?? [];
    return sensors.find((s) => /chamber/i.test(s.name)) ?? null;
  }
  get presets() {
    return this.$store.getters["config/getTempPresets"] ?? [];
  }
  get materials() {
    return materialsFrom(this.presets);
  }
  get material() {
    return materialInUse(this.materials, this.nozzle?.target ?? 0, this.bed?.target ?? 0);
  }
  get materialChoices() {
    return materialChoices(this.materials);
  }
  /** Whether the printer can remember the material itself (Klipper's [save_variables]; the M1 has it). */
  get savesMaterial() {
    return "save_variables" in this.$store.state.printer.printer;
  }
  /**
   * The material loaded: the one the printer remembers (the panel and this
   * page set the same save_variables muon_material), else, on a printer
   * that can't remember one, the one set here.
   */
  get loadedMaterial() {
    const name = this.savesMaterial ? savedMaterialName(this.$store.state.printer.printer.save_variables?.variables) : this.$store.state.config.uiSettings.general.loadedMaterial;
    const choice = loadedChoice(this.materialChoices, name);
    const colour = this.loadedColour;
    return choice && colour ? { ...choice, colour } : choice;
  }
  /**
   * Whether filament is in the printer, from a trustworthy filament sensor
   * (a switch sensor, switched on; see filamentSensed): null when none
   * reports, where only what someone said is loaded can tell.
   */
  get filamentSensed() {
    return filamentSensed(this.$store.state.printer.printer);
  }
  /**
   * Whether the printer has a material loaded, and which: the filament sensor
   * says whether there is any, the recorded material says which. With no
   * sensor reporting, a recorded material is what there is to go on. A
   * material chosen as a preset (the heater targets) says nothing about this.
   */
  get loadedFilament() {
    const name = this.loadedMaterial?.name ?? null;
    const sensed = this.filamentSensed;
    return { loaded: sensed ?? !!name, name };
  }
  /**
   * While a print runs and nobody has said what's loaded: what its file was
   * sliced for, which is what is feeding now. Shown as that, never saved as
   * the loaded record (14 Oct: Walnut printing showed "Not set").
   */
  get printingWith() {
    if (this.loadedMaterial || !(this.printerPrinting || this.printerPaused)) return null;
    return fileFilament(this.$store.state.printer.printer.current_file);
  }
  /**
   * The loaded filament's colour, when someone has said it: the printer's
   * save_variables muon_material_colour (set here, on Control and from the
   * slicer), else, on a printer that can't remember one, the one set here.
   * Null when nobody has: a material's swatch is not its colour.
   */
  get loadedColour() {
    return this.savesMaterial ? savedMaterialColour(this.$store.state.printer.printer.save_variables?.variables) : normaliseColour(this.$store.state.config.uiSettings.general.loadedMaterialColour);
  }
  setLoadedMaterial(choice) {
    if (this.savesMaterial) {
      this.sendGcode(saveMaterialCommand(choice.name));
    } else {
      this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.loadedMaterial", value: choice.name, server: true });
    }
  }
  setLoadedColour(colour) {
    const hex = normaliseColour(colour);
    if (!hex) return;
    if (this.savesMaterial) {
      this.sendGcode(saveMaterialColourCommand(hex));
    } else {
      this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.loadedMaterialColour", value: hex, server: true });
    }
  }
  /** The extruder's hard limit, from printer.cfg, or null when the printer didn't say. */
  get extruderMaxTemp() {
    const max = Number(this.$store.state.printer?.printer?.configfile?.settings?.extruder?.max_temp);
    return Number.isFinite(max) && max > 0 ? max : null;
  }
  /** Tells the person why nothing was sent, when the material is hotter than the hotend can go. True if it is. */
  refuseTooHot(name, nozzle) {
    const reason = hotendLimitReason(name, nozzle, this.extruderMaxTemp);
    if (!reason) return false;
    EventBus.$emit(reason, { type: "error", timeout: 8e3 });
    return true;
  }
  /** Heats for a material: as its preset says when it has one, else to its temperatures. */
  heatFor(choice) {
    if (!this.controlReady) return;
    if (this.refuseTooHot(choice.name, choice.nozzle)) return;
    const preset = choice.presetId === null ? void 0 : this.presets.find((p) => p.id === choice.presetId);
    if (preset) {
      presetCommands(preset).forEach((g) => this.sendGcode(g));
      return;
    }
    if (choice.nozzle !== null) this.setHeater(this.nozzle, choice.nozzle);
    if (choice.bed !== null) this.setHeater(this.bed, choice.bed);
  }
  setHeater(heater, target) {
    const current = this.heaters.find((h) => h.name === heater?.name);
    if (!this.controlReady || !current || !Number.isFinite(target) || target < 0 || target > (current.maxTemp ?? 300)) return;
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${current.name} TARGET=${Math.round(target)}`);
  }
  applyMaterial(material) {
    if (!this.controlReady) return;
    if (this.refuseTooHot(material.name, material.nozzle)) return;
    const preset = this.presets.find((p) => p.id === material.id);
    if (preset) presetCommands(preset).forEach((g) => this.sendGcode(g));
  }
  async coolDown() {
    if (!this.controlReady) return;
    const target = this.panelTarget;
    if (this.busy) {
      const ok = await this.$confirm("The printer is busy. With the heaters off, what it is doing now will most likely fail.", {
        title: "Turn the heaters off?",
        buttonTrueText: "Turn them off",
        buttonFalseText: "Leave them on",
        danger: true
      });
      if (!ok) return;
    }
    if (this.controlReady && target === this.panelTarget) this.sendGcode("TURN_OFF_HEATERS");
  }
  // -- move ------------------------------------------------------------------
  isHomed(axes) {
    return axes.toUpperCase().split("").every((a) => this.homedAxes.includes(a));
  }
  /**
   * On a Muon printer (or one not known yet) a Z saved reversed moves the
   * normal way: reversing the M1's plate only crashed it. Another printer may
   * need any axis reversed.
   */
  inverted(axis) {
    if (axis.toLowerCase() === "z" && this.$store.getters["server/isMuonPrinter"] !== false) return false;
    return !!this.$store.state.config.uiSettings.general.axis?.[axis.toLowerCase()]?.inverted;
  }
  /**
   * The no-go regions this printer declares in [bed_mesh], read live. Until
   * the printer's config has loaded at all, the regions are unknown: treated
   * as unreadable, so only raising the head is allowed.
   */
  get noGo() {
    const settings = this.$store.state.printer.printer.configfile?.settings;
    if (!settings || !Object.keys(settings).length) return "invalid";
    return readNoGo(settings.bed_mesh);
  }
  /**
   * Toolhead minus G-code position, per axis: the mesh and G-code offsets now
   * in force. Planning is done in toolhead (real) coordinates; a move is sent
   * in G-code coordinates, so a planned place is sent minus this. Null when
   * the G-code position isn't known.
   */
  get gcodeOffset() {
    const gcode = this.$store.state.printer.printer.gcode_move?.gcode_position;
    if (!Array.isArray(gcode)) return null;
    const d = [0, 1, 2].map((i) => Number(this.position[i]) - Number(gcode[i]));
    return d.every(Number.isFinite) ? d : null;
  }
  /**
   * Why a hand move must wait, or '' if it can go: the head position isn't
   * this connection's yet, a G-code script is still running (a move sent now
   * would run from wherever it leaves the head), or the last hand move hasn't
   * been reported. Read fresh, never cached.
   *
   * On every printer, not only one with no-go regions (KAN-1745): a jog is a
   * relative move, and one planned from a position that lags can be refused
   * by Klipper ("Move out of range"), which aborts the script before its
   * RESTORE_GCODE_STATE and leaves the printer in G91 for the console and
   * macros after it. Waiting for the last move to land keeps every jog inside
   * the limits it was clamped to.
   */
  handMoveWait() {
    if (!headStatus.fresh) return "Wait for the printer to report where the head is.";
    if (scriptsInFlight.count > 0) return "Wait for the printer to finish what it is doing.";
    if (handMoveSettling(this.$store.state.printer.printer.gcode_move?.gcode_position, this.panelTarget)) return "Wait for the head to finish moving.";
    return "";
  }
  onControlReadyForHandMove(ready) {
    if (!ready) {
      releaseHandMove();
      if (!this.klippyReady || !this.klippyConnected) headStatus.fresh = false;
    }
  }
  /**
   * Plan a move to `realTo` (toolhead coordinates) against the bed's no-go
   * regions. Steps come back in G-code coordinates, ready to send.
   */
  planHandMove(realTo) {
    const noGo = this.noGo;
    const limits = { min: this.axisMin.slice(0, 3), max: this.axisMax.slice(0, 3) };
    const from = { x: Number(this.position[0]), y: Number(this.position[1]), z: Number(this.position[2]) };
    const to = { x: realTo[0], y: realTo[1], z: realTo[2] };
    if (noGo === null) return planMove(from, to, null, limits);
    const offset = this.gcodeOffset;
    if (!offset) return { ok: false, reason: "The head position is not known." };
    const plan = planMove(from, to, noGo, limits, meshSpan(this.$store.state.printer.printer.bed_mesh), this.isHomed("Z"), this.isHomed("XY"));
    if (!plan.ok) return plan;
    const toGcode = (p) => {
      const out = {};
      ["X", "Y", "Z"].forEach((a, i) => {
        if (p[a] !== void 0) out[a] = Math.round((p[a] - offset[i]) * 1e3) / 1e3;
      });
      return out;
    };
    return { ...plan, steps: plan.steps.map(toGcode) };
  }
  refuseMove(reason) {
    EventBus.$emit(reason, { type: "warning" });
  }
  /** Make the next hand move wait for this one to land (on every printer: see handMoveWait). */
  markHandMove(realTo) {
    const offset = this.gcodeOffset;
    if (!offset) return;
    const now = Date.now();
    const travel = this.travelMs(realTo);
    const target = realTo.slice(0, 3).map((v, i) => Math.round((v - offset[i]) * 1e3) / 1e3);
    lockHandMove(target, this.panelTarget, now, travel);
    const from = this.$store.state.printer.printer.gcode_move?.gcode_position?.slice(0, 3);
    const ms = noteOwnMotion(this.panelTarget, now, travel, this.printerState !== "busy", target, from);
    motionClock.epoch++;
    if (ms > 0) {
      if (motionTimer !== null) clearTimeout(motionTimer);
      motionTimer = setTimeout(() => {
        motionTimer = null;
        motionClock.epoch++;
      }, ms + 20);
    }
  }
  /**
   * About how long a hand move to `realTo` takes, ms: across at the head's
   * speed, up and down at the plate's, counting a lift to the notch's
   * traverse height and back when the plan lifts.
   */
  travelMs(realTo) {
    const p = [0, 1, 2].map((i) => Number(this.position[i]));
    const xy = Math.hypot(realTo[0] - p[0], realTo[1] - p[1]);
    let z = Math.abs(realTo[2] - p[2]);
    const noGo = this.noGo;
    if (noGo && noGo !== "invalid") {
      const plan = this.planHandMove([realTo[0], realTo[1], realTo[2]]);
      if (plan.ok && plan.lifted) {
        const over = Number(plan.steps[0].Z) + (this.gcodeOffset ?? [0, 0, 0])[2];
        z = Math.abs(over - p[2]) + Math.abs(over - realTo[2]);
      }
    }
    const ms = (xy / this.xySpeed + z / this.zSpeed) * 1e3;
    return Number.isFinite(ms) ? ms : 0;
  }
  /** Send a planned move: lift, across, down, as one absolute script. */
  sendPlannedMoves(steps) {
    const line = (p) => {
      const words = ["X", "Y", "Z"].filter((a) => p[a] !== void 0).map((a) => `${a}${p[a]}`);
      const rate = p.Z !== void 0 ? this.zSpeed : this.xySpeed;
      return `G1 ${words.join(" ")} F${rate * 60}`;
    };
    this.sendGcode(["SAVE_GCODE_STATE NAME=_ui_movement", "G90", ...steps.map(line), "RESTORE_GCODE_STATE NAME=_ui_movement"].join("\n"));
  }
  /** A step along one axis, cut short at the machine's limits, kept out of the bed's no-go regions. */
  moveBy(axis, distance) {
    if (!this.controlReady || this.busy || !this.isHomed(axis) || !Number.isFinite(distance)) return;
    if (![this.xySpeed, this.zSpeed].every((v) => Number.isFinite(v) && v > 0)) return;
    const wait = this.handMoveWait();
    if (wait) {
      this.refuseMove(wait);
      return;
    }
    const i = "XYZ".indexOf(axis);
    const signed = this.inverted(axis) ? -distance : distance;
    const target = clampTo(this.position[i] + signed, this.axisMin[i], this.axisMax[i]);
    const by = Math.round((target - this.position[i]) * 1e3) / 1e3;
    if (!by) return;
    const realTo = [0, 1, 2].map((j) => Number(this.position[j]));
    realTo[i] = target;
    const plan = this.planHandMove(realTo);
    if (!plan.ok) {
      this.refuseMove(plan.reason);
      return;
    }
    if (plan.lifted) this.sendPlannedMoves(plan.steps);
    else this.sendMoveGcode(`${axis}${by}`, axis === "Z" ? this.zSpeed : this.xySpeed);
    this.markHandMove(realTo);
  }
  /**
   * A diagonal step: X and Y at once, cut short at the machine's limits.
   * Sent through moveTo, so it gets the same checks as every hand move
   * (homed, not printing, the hand-move wait and the no-go planner).
   */
  moveByXY(dx, dy) {
    if (!this.controlReady || this.busy || !this.isHomed("XY") || !Number.isFinite(dx) || !Number.isFinite(dy)) return false;
    if (![this.xySpeed, this.zSpeed].every((v) => Number.isFinite(v) && v > 0)) return false;
    const wait = this.handMoveWait();
    if (wait) {
      this.refuseMove(wait);
      return false;
    }
    const realTo = [0, 1, 2].map((j) => Number(this.position[j]));
    const by = [0, 0];
    ["X", "Y"].forEach((axis, i) => {
      const d = axis === "X" ? dx : dy;
      const signed = this.inverted(axis) ? -d : d;
      const target = clampTo(this.position[i] + signed, this.axisMin[i], this.axisMax[i]);
      by[i] = Math.round((target - this.position[i]) * 1e3) / 1e3;
      realTo[i] = target;
    });
    if (!by[0] && !by[1]) return false;
    const plan = this.planHandMove(realTo);
    if (!plan.ok) {
      this.refuseMove(plan.reason);
      return false;
    }
    if (plan.lifted) this.sendPlannedMoves(plan.steps);
    else this.sendMoveGcode(["X", "Y"].filter((_, i) => by[i]).map((a) => `${a}${by["XY".indexOf(a)]}`).join(" "), this.xySpeed);
    this.markHandMove(realTo);
    return true;
  }
  /**
   * Why a move to a place in G-code coordinates would be refused now, or ''
   * when moveTo would send it: the same gates and the same plan as moveTo,
   * in words, not counting the hand-move wait. A live drag stops on it.
   */
  moveRefusal(place) {
    if (!this.controlReady) return this.controlLock || "Not connected to the printer";
    if (this.printLocked) return "Not while printing: moving the head would ruin the print.";
    if (this.busy) return "Wait for the printer to finish what it is doing.";
    if (![this.xySpeed, this.zSpeed].every((v) => Number.isFinite(v) && v > 0)) return "Set the jog speeds in Settings first.";
    const axes = ["X", "Y", "Z"].filter((a) => place[a] !== void 0);
    if (!axes.length) return "Nothing to move.";
    for (const axis of axes) {
      const i = "XYZ".indexOf(axis);
      const value = place[axis];
      if (!this.isHomed(axis)) return `Home ${axis} first.`;
      if (!Number.isFinite(value) || value < this.axisMin[i] || value > this.axisMax[i]) return "That spot is outside the machine.";
    }
    const offset = this.gcodeOffset ?? [0, 0, 0];
    const realTo = ["X", "Y", "Z"].map((a, i) => place[a] !== void 0 ? place[a] + offset[i] : Number(this.position[i]));
    const plan = this.planHandMove(realTo);
    return plan.ok ? "" : plan.reason;
  }
  /** To a place given in G-code coordinates, inside the machine and out of the bed's no-go regions. True when it was sent. */
  moveTo(place) {
    if (!this.controlReady || this.busy || ![this.xySpeed, this.zSpeed].every((v) => Number.isFinite(v) && v > 0)) return false;
    const parts = [];
    let rate = this.xySpeed;
    for (const axis of ["X", "Y", "Z"]) {
      const value = place[axis];
      if (value === void 0) continue;
      const i = "XYZ".indexOf(axis);
      if (!this.isHomed(axis) || !Number.isFinite(value) || value < this.axisMin[i] || value > this.axisMax[i]) return false;
      parts.push(`${axis}${value}`);
      if (axis === "Z") rate = Math.min(rate, this.zSpeed);
    }
    if (!parts.length) return false;
    const wait = this.handMoveWait();
    if (wait) {
      this.refuseMove(wait);
      return false;
    }
    const offset = this.gcodeOffset ?? [0, 0, 0];
    const realTo = ["X", "Y", "Z"].map((a, i) => place[a] !== void 0 ? place[a] + offset[i] : Number(this.position[i]));
    const plan = this.planHandMove(realTo);
    if (!plan.ok) {
      this.refuseMove(plan.reason);
      return false;
    }
    if (plan.lifted) this.sendPlannedMoves(plan.steps);
    else this.sendMoveGcode(parts.join(" "), rate, true);
    this.markHandMove(realTo);
    return true;
  }
  homeWait(axes = "") {
    if (axes === "XY") return this.$waits.onHomeXY;
    if (axes === "Z") return this.$waits.onHomeZ;
    return this.$waits.onHomeAll;
  }
  home(axes = "") {
    if (!this.controlReady || this.busy) return;
    this.sendGcode(axes ? `G28 ${axes.split("").join(" ")}` : "G28", this.homeWait(axes));
  }
  homing(axes = "") {
    return this.hasWait(this.homeWait(axes));
  }
  motorsOff() {
    if (!this.controlReady || this.busy) return;
    this.sendGcode("M84");
  }
  // -- speed and tuning ------------------------------------------------------
  get gcodeMove() {
    return this.$store.state.printer.printer.gcode_move ?? {};
  }
  get speedFactor() {
    return Math.round((this.gcodeMove.speed_factor ?? 1) * 100);
  }
  get flowFactor() {
    return Math.round((this.gcodeMove.extrude_factor ?? 1) * 100);
  }
  setSpeed(percent) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 1 || percent > 500) return;
    this.sendGcode(`M220 S${Math.round(percent)}`);
  }
  /** The moves of the file being printed, when the G-code preview holds it. */
  get printMoves() {
    const printing = this.$store.state.printer.printer.print_stats?.filename ?? "";
    const file = this.$store.getters["gcodePreview/getFile"];
    if (!printing || !file || this.$store.state.gcodePreview.parserWorker) return null;
    const path = file.path ? `${file.path}/${file.filename}` : file.filename;
    return path === printing ? this.$store.getters["gcodePreview/getMoves"] : null;
  }
  /**
   * Slow, Normal and Fast for the print running (services/control/speed.ts):
   * Fast is as much faster as the nozzle can melt this filament for this
   * print, or a quarter when the print's flow isn't known.
   */
  get speedChoices() {
    const moves = this.printMoves;
    let peak = null;
    if (moves) {
      if (!peakFlows.has(moves)) {
        const diameter = Number(this.$store.state.printer.printer.configfile?.settings?.extruder?.filament_diameter) || 1.75;
        peakFlows.set(moves, peakFlow(moves, diameter));
      }
      peak = peakFlows.get(moves) ?? null;
    }
    const metadata = this.$store.state.printer.printer.current_file;
    const maxFlow = this.$store.state.gcodePreview.maxFlow ?? materialMaxFlow(metadata?.filament_type) ?? materialMaxFlow(this.loadedMaterial?.name);
    return speedChoices(fastPercent(peak, maxFlow), peak !== null && maxFlow !== null);
  }
  /** "Slow", "Normal", "Fast", or "110%" for anything else. */
  get speedLabel() {
    return this.speedChoices.find((c) => c.percent === this.speedFactor)?.label ?? `${this.speedFactor}%`;
  }
  setFlow(percent) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 1 || percent > 300) return;
    this.sendGcode(`M221 S${Math.round(percent)}`);
  }
  get pressureAdvance() {
    return this.activeExtruder?.pressure_advance ?? null;
  }
  setPressureAdvance(value) {
    if (!this.controlReady || !Number.isFinite(value) || value < 0 || value > 2) return;
    this.sendGcode(`SET_PRESSURE_ADVANCE ADVANCE=${value}`);
  }
  /** Configured ceiling. Live status is a current value, never authority for a new limit. */
  limitMaximum(key) {
    const setting = this.$store.state.printer.printer.configfile?.settings?.printer?.[limitSetting[key]];
    const parsed = typeof setting === "number" || typeof setting === "string" && setting.trim() !== "" ? Number(setting) : Number.NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return key === "MINIMUM_CRUISE_RATIO" ? Math.min(parsed, 1) : parsed;
  }
  /** Velocity, acceleration, square corner velocity and the cruise ratio, until a restart. */
  setLimit(key, value) {
    const maximum = this.limitMaximum(key);
    if (!this.controlReady || maximum === null || !Number.isFinite(value) || value < 0 || value > maximum || ["VELOCITY", "ACCEL"].includes(key) && value <= 0) return;
    this.sendGcode(`SET_VELOCITY_LIMIT ${key}=${value}`);
  }
  // -- fans and lights -------------------------------------------------------
  get fans() {
    return this.$store.getters["printer/getAllFans"] ?? [];
  }
  get partFan() {
    return this.fans.find((f) => f.type === "fan") ?? null;
  }
  fanValue(fan) {
    return fanPercent(fan);
  }
  setFan(fan, percent) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 0 || percent > 100) return;
    const gcode = fanCommand(fan, percent);
    if (gcode) this.sendGcode(gcode);
  }
  get lightsPin() {
    return lightsOutput(this.$store.getters["printer/getPins"] ?? []);
  }
  get lightsLed() {
    return this.lightsPin ? null : lightsOutput(this.$store.getters["printer/getAllLeds"] ?? []);
  }
  get hasLights() {
    return !!this.lightsPin || !!this.lightsLed;
  }
  /** The lights, 0 to 100. */
  get lightsValue() {
    if (this.lightsPin) return pinPercent(this.lightsPin.value);
    const data = this.lightsLed?.color_data?.[0] ?? [];
    return Math.round(Math.max(0, ...data) * 100);
  }
  setLights(value) {
    if (!this.controlReady || typeof value === "number" && (!Number.isFinite(value) || value < 0 || value > 100)) return;
    const percent = typeof value === "boolean" ? value ? 100 : 0 : value;
    if (this.lightsPin) {
      this.sendGcode(pinCommand(this.lightsPin, this.lightsPin.pwm ? percent : percent > 0));
    } else if (this.lightsLed) {
      const v = Math.round(percent) / 100;
      this.sendGcode(`SET_LED LED=${this.lightsLed.name} RED=${v} GREEN=${v} BLUE=${v} WHITE=${v}`);
    }
  }
};
__decorateClass([
  Watch("printerState")
], ControlMixin.prototype, "onPrinterStateForOwnMove", 1);
__decorateClass([
  Watch("controlReady")
], ControlMixin.prototype, "onControlReadyForHandMove", 1);
ControlMixin = __decorateClass([
  Component
], ControlMixin);
export {
  ControlMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2wudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBUeXBlZENvbW1hbmRzTWl4aW4gZnJvbSAnLi90eXBlZC1jb21tYW5kcydcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgVG9vbGhlYWRNaXhpbiBmcm9tICcuL3Rvb2xoZWFkJ1xuaW1wb3J0IHR5cGUgeyBUZW1wZXJhdHVyZVByZXNldCB9IGZyb20gJ0Avc3RvcmUvY29uZmlnL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBGYW4sIEhlYXRlciwgTGVkLCBPdXRwdXRQaW4sIFNlbnNvciB9IGZyb20gJ0Avc3RvcmUvcHJpbnRlci90eXBlcydcbmltcG9ydCB7XG4gIGNsYW1wVG8sXG4gIGZhbkNvbW1hbmQsXG4gIGZhblBlcmNlbnQsXG4gIGZpbGVGaWxhbWVudCxcbiAgZmlsYW1lbnRTZW5zZWQsXG4gIGxpZ2h0c091dHB1dCxcbiAgbG9hZGVkQ2hvaWNlLFxuICBtYXRlcmlhbENob2ljZXMsXG4gIG1hdGVyaWFsSW5Vc2UsXG4gIG1hdGVyaWFsc0Zyb20sXG4gIHBpbkNvbW1hbmQsXG4gIHBpblBlcmNlbnQsXG4gIG5vcm1hbGlzZUNvbG91cixcbiAgc2F2ZU1hdGVyaWFsQ29sb3VyQ29tbWFuZCxcbiAgc2F2ZU1hdGVyaWFsQ29tbWFuZCxcbiAgc2F2ZWRNYXRlcmlhbENvbG91cixcbiAgc2F2ZWRNYXRlcmlhbE5hbWUsXG4gIHR5cGUgTWF0ZXJpYWwsXG4gIGhvdGVuZExpbWl0UmVhc29uLFxuICB0eXBlIE1hdGVyaWFsQ2hvaWNlXG59IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9tb2RlbCdcbmltcG9ydCB7IHByZXNldENvbW1hbmRzIH0gZnJvbSAnQC91dGlsL3RlbXBlcmF0dXJlLXByZXNldCdcbmltcG9ydCB7IHpBZGp1c3RDb21tYW5kIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3otYWRqdXN0J1xuaW1wb3J0IHsgZW5kT3duTW90aW9uLCBoYW5kTW92ZVNldHRsaW5nLCBoZWFkU3RhdHVzLCBsb2NrSGFuZE1vdmUsIG5vdGVPd25Nb3Rpb24sIG93bk1vdGlvbkFjdGl2ZSwgcmVsZWFzZUhhbmRNb3ZlLCBzY3JpcHRzSW5GbGlnaHQsIG1lc2hTcGFuLCBwbGFuTW92ZSwgcmVhZE5vR28sIHR5cGUgTW92ZVBsYW4sIHR5cGUgTm9Hb0NvbmZpZywgdHlwZSBQbGFjZSB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9zYWZlLW1vdmUnXG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcbmltcG9ydCB0eXBlIHsgTG9hZGVkRmlsYW1lbnQgfSBmcm9tICdAL3NlcnZpY2VzL2pvYnMvbW9kZWwnXG5pbXBvcnQgeyBmYXN0UGVyY2VudCwgbWF0ZXJpYWxNYXhGbG93LCBwZWFrRmxvdywgc3BlZWRDaG9pY2VzLCB0eXBlIFNwZWVkQ2hvaWNlIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3NwZWVkJ1xuaW1wb3J0IHR5cGUgeyBNb3ZlIH0gZnJvbSAnQC9zdG9yZS9nY29kZVByZXZpZXcvdHlwZXMnXG5cbi8qKlxuICogVGlja3Mgd2hlbiBhIGhhbmQgbW92ZSBzdGFydHMgYW5kIHdoZW4gaXRzIG93bi1tb3Rpb24gd2luZG93IGVuZHNcbiAqIChzYWZlLW1vdmUncyBvd25Nb3Rpb24pLCBzbyBgYnVzeWAgaXMgd29ya2VkIG91dCBhZ2FpbiBhdCBib3RoIG1vbWVudHMuXG4gKi9cbmNvbnN0IG1vdGlvbkNsb2NrID0gVnVlLm9ic2VydmFibGUoeyBlcG9jaDogMCB9KVxubGV0IG1vdGlvblRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsXG5cbi8qKiBBIHByaW50J3MgcGVhayBmbG93LCB3b3JrZWQgb3V0IG9uY2UgcGVyIHBhcnNlZCBmaWxlLCBob3dldmVyIG1hbnkgcGFuZWxzIGFzay4gKi9cbmNvbnN0IHBlYWtGbG93cyA9IG5ldyBXZWFrTWFwPHJlYWRvbmx5IE1vdmVbXSwgbnVtYmVyIHwgbnVsbD4oKVxuXG50eXBlIEF4aXMgPSAnWCcgfCAnWScgfCAnWidcbmV4cG9ydCB0eXBlIExpbWl0S2V5ID0gJ1ZFTE9DSVRZJyB8ICdBQ0NFTCcgfCAnU1FVQVJFX0NPUk5FUl9WRUxPQ0lUWScgfCAnTUlOSU1VTV9DUlVJU0VfUkFUSU8nIHwgJ0FDQ0VMX1RPX0RFQ0VMJ1xuXG5jb25zdCBsaW1pdFNldHRpbmc6IFJlY29yZDxMaW1pdEtleSwgc3RyaW5nPiA9IHtcbiAgVkVMT0NJVFk6ICdtYXhfdmVsb2NpdHknLFxuICBBQ0NFTDogJ21heF9hY2NlbCcsXG4gIFNRVUFSRV9DT1JORVJfVkVMT0NJVFk6ICdzcXVhcmVfY29ybmVyX3ZlbG9jaXR5JyxcbiAgTUlOSU1VTV9DUlVJU0VfUkFUSU86ICdtaW5pbXVtX2NydWlzZV9yYXRpbycsXG4gIEFDQ0VMX1RPX0RFQ0VMOiAnbWF4X2FjY2VsX3RvX2RlY2VsJ1xufVxuXG4vKiogVGhlIGhlYXQgYmVsb3cgd2hpY2ggYSBub3p6bGUncyDiiJIgZ29lcyB0byBPZmYgYW5kIGl0cyArIHN0YXJ0cy4gKi9cbmV4cG9ydCBjb25zdCBOT1paTEVfRkxPT1IgPSAxNzBcbmV4cG9ydCBjb25zdCBCRURfRkxPT1IgPSA0MFxuXG4vKipcbiAqIFdoYXQgQ29udHJvbCdzIHBhbmVscyBzaGFyZTogdGhlIHByaW50ZXIncyBwb3NpdGlvbiwgaGVhdGVycywgZmFucyBhbmRcbiAqIGxpZ2h0cywgYXMgdmFsdWVzLCBhbmQgdGhlIGNvbW1hbmRzIHRoYXQgY2hhbmdlIHRoZW0uIEVhY2ggY29tbWFuZCBpc1xuICogdGhlIEctY29kZSBGbHVpZGQncyBvd24gY2FyZHMgc2VuZCwgc28gQ29udHJvbCBhbmQgdGhlIGNhcmRzIGFncmVlLlxuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sTWl4aW4gZXh0ZW5kcyBNaXhpbnMoVHlwZWRDb21tYW5kc01peGluLCBUb29saGVhZE1peGluKSB7XG4gIGdldCBjb250cm9sUmVhZHkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlICYmIHRoaXMua2xpcHB5UmVhZHkgJiYgdGhpcy5rbGlwcHlDb25uZWN0ZWRcbiAgfVxuXG4gIGFkanVzdFogKGJ5OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8ICF0aGlzLmlzSG9tZWQoJ1onKSB8fCB0aGlzLmhhc1dhaXQodGhpcy4kd2FpdHMub25aQWRqdXN0KSkgcmV0dXJuXG4gICAgLy8gSWRsZSwgYSBudWRnZSBjbG9zZXIgbW92ZXMgdGhlIGhlYWQgKE1PVkU9MSk6IG5vdCB3aGlsZSBhIGhhbmQgbW92ZSBvciBhXG4gICAgLy8gc2NyaXB0IGlzIHN0aWxsIGluIGZsaWdodCwgb3IgaXQgcnVucyBmcm9tIHdoZXJlIHRoZXkgbGVhdmUgdGhlIGhlYWQgKEtBTi0xNzQ1KS5cbiAgICBpZiAoIXRoaXMuYnVzeSAmJiBieSA8IDApIHtcbiAgICAgIGNvbnN0IHdhaXQgPSB0aGlzLmhhbmRNb3ZlV2FpdCgpXG4gICAgICBpZiAod2FpdCkgeyB0aGlzLnJlZnVzZU1vdmUod2FpdCk7IHJldHVybiB9XG4gICAgfVxuICAgIGNvbnN0IGNvbW1hbmQgPSB6QWRqdXN0Q29tbWFuZChieSwgdHJ1ZSlcbiAgICBpZiAoY29tbWFuZCkgdGhpcy5zZW5kR2NvZGUoY29tbWFuZCwgdGhpcy4kd2FpdHMub25aQWRqdXN0KVxuICB9XG5cbiAgZ2V0IHBhbmVsVGFyZ2V0ICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLmNvbW1hbmRUYXJnZXR9fCR7Y2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyAnJ31gXG4gIH1cblxuICBnZXQgY29udHJvbExvY2sgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlKSByZXR1cm4gJ0Nvbm5lY3QgdG8gYSBwcmludGVyIHlvdSBjYW4gY29udHJvbCBmaXJzdC4nXG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFJlYWR5ID8gJycgOiB0aGlzLm5vdFJlYWR5UmVhc29uXG4gIH1cblxuICAvKiogUHJpbnRpbmcgb3IgcGF1c2VkOiBtb3ZlcywgZXh0cnVzaW9uIGFuZCBtb3RvcnMgYXJlIGxlZnQgYWxvbmUuICovXG4gIC8qKiBXaHkgdGhlIGNvbnRyb2xzIGFyZSBsb2NrZWQgd2hlbiBLbGlwcGVyIGlzbid0IHJlYWR5OiB0aGUgY29ubmVjdGlvbiwgd2hlbiB0aGF0IGlzIHdoYXQncyBnb25lLiAqL1xuICBnZXQgbm90UmVhZHlSZWFzb24gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0Q29ubmVjdGVkID8gJ0tsaXBwZXIgaXMgbm90IHJlYWR5JyA6ICdOb3QgY29ubmVjdGVkIHRvIHRoZSBwcmludGVyJ1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBpcyBhIE11b24gcHJpbnRlciAoYW4gTTEpLCBmcm9tIHRoZSBnYXRlIHByaW1pdGl2ZVxuICAgKiBgc2VydmVyL2lzTXVvblByaW50ZXJgICgjMjk2KTogdHJ1ZSwgZmFsc2UsIG9yIG51bGwgdW50aWwgc2VydmVyLmluZm9cbiAgICogaGFzIGFuc3dlcmVkLiBOYW1lZCBhcGFydCBmcm9tIE11b25HYXRlc01peGluJ3MgaXNNdW9uUHJpbnRlciBzbyB0aGVcbiAgICogdHdvIG1peGlucyBjYW4gc2l0IHRvZ2V0aGVyLlxuICAgKi9cbiAgZ2V0IG11b25QcmludGVyICgpOiBib29sZWFuIHwgbnVsbCB7XG4gICAgY29uc3QgdiA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9pc011b25QcmludGVyJ10gYXMgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWRcbiAgICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHZcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlYWwgcHJpbnQgaXMgcnVubmluZyBvciBwYXVzZWQsIGJ5IHByaW50X3N0YXRzIChLbGlwcGVyJ3Mgb3duIHJlY29yZFxuICAgKiBvZiBhIHByaW50KSwgbm90IGJ5IGlkbGVfdGltZW91dCwgd2hpY2ggcmVhZHMgUHJpbnRpbmcgZm9yIEFOWSBHLWNvZGUsXG4gICAqIGEgam9nIGluY2x1ZGVkIChLQU4tMjEyMCkuIE9ubHkgdGhpcyBzYXlzIFwicHJpbnRpbmdcIiB0byB0aGUgcGVyc29uLlxuICAgKi9cbiAgZ2V0IHByaW50TG9ja2VkICgpOiBib29sZWFuIHtcbiAgICBjb25zdCBzdGF0ZSA9IFN0cmluZyh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIucHJpbnRfc3RhdHM/LnN0YXRlID8/ICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgcmV0dXJuIHN0YXRlID09PSAncHJpbnRpbmcnIHx8IHN0YXRlID09PSAncGF1c2VkJyB8fCB0aGlzLnByaW50ZXJQcmludGluZyB8fCB0aGlzLnByaW50ZXJQYXVzZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcHJpbnRlciBpcyBidXN5IHdpdGggdGhpcyBwYWdlJ3Mgb3duIGhhbmQgbW92ZSAoYSBqb2csIHRoZSB0cmFja3BhZCxcbiAgICogR28gdG8pIGFuZCBub3RoaW5nIGVsc2U6IEtBTi0yMTIwLiBNb3Zpbmcgc3RheXMgb3BlbiB0aGVuLCBzbyBhIG5ld1xuICAgKiB0YXJnZXQgaXMgcGxhbm5lZCBmcm9tIHRoZSBjb21tYW5kZWQgZW5kIHBvc2l0aW9uIGFuZCBxdWV1ZWQgYmVoaW5kIGl0LlxuICAgKi9cbiAgZ2V0IGJ1c3lXaXRoT3duTW92ZSAoKTogYm9vbGVhbiB7XG4gICAgLy8gUmVhZCBzbyB0aGlzIGlzIHdvcmtlZCBvdXQgYWdhaW4gd2hlbiB0aGUgbW92ZSdzIHdpbmRvdyBlbmRzICh0aGUgd2luZG93IGl0c2VsZiBpc24ndCByZWFjdGl2ZSkuXG4gICAgY29uc3Qgc2VlbiA9IG1vdGlvbkNsb2NrLmVwb2NoID49IDBcbiAgICBjb25zdCBjb21tYW5kZWQgPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZ2NvZGVfbW92ZT8uZ2NvZGVfcG9zaXRpb24gYXMgbnVtYmVyW10gfCB1bmRlZmluZWRcbiAgICByZXR1cm4gc2VlbiAmJiAhdGhpcy5wcmludExvY2tlZCAmJiB0aGlzLnByaW50ZXJTdGF0ZSA9PT0gJ2J1c3knICYmIG93bk1vdGlvbkFjdGl2ZSh0aGlzLnBhbmVsVGFyZ2V0LCBEYXRlLm5vdygpLCBjb21tYW5kZWQpXG4gIH1cblxuICAvKipcbiAgICogTW92ZXMsIGV4dHJ1c2lvbiBhbmQgbW90b3JzIGFyZSBsZWZ0IGFsb25lOiBhIHJlYWwgcHJpbnQsIG9yIHRoZSBwcmludGVyXG4gICAqIGJ1c3kgd2l0aCBzb21ldGhpbmcgdGhhdCBpc24ndCB0aGlzIHBhZ2UncyBvd24gaGFuZCBtb3ZlIChob21pbmcsIGFcbiAgICogbWFjcm8sIGFub3RoZXIgY2xpZW50KS4gU2VlIHByaW50TG9ja2VkIGFuZCBidXN5V2l0aE93bk1vdmUuXG4gICAqL1xuICBnZXQgYnVzeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRMb2NrZWQgfHwgKHRoaXMucHJpbnRlclN0YXRlID09PSAnYnVzeScgJiYgIXRoaXMuYnVzeVdpdGhPd25Nb3ZlKVxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIHN0b3BwZWQgYmVpbmcgYnVzeTogdGhlIG93bi1tb3ZlIHdpbmRvdyBlbmRzLCBzbyB0aGUgbmV4dCBidXN5IChhIG1hY3JvIGZyb20gYW55d2hlcmUpIGxvY2tzIG1vdmluZy4gKi9cbiAgQFdhdGNoKCdwcmludGVyU3RhdGUnKVxuICBvblByaW50ZXJTdGF0ZUZvck93bk1vdmUgKG5vdzogc3RyaW5nLCBiZWZvcmU6IHN0cmluZykge1xuICAgIGlmIChiZWZvcmUgPT09ICdidXN5JyAmJiBub3cgIT09ICdidXN5Jykge1xuICAgICAgZW5kT3duTW90aW9uKClcbiAgICAgIG1vdGlvbkNsb2NrLmVwb2NoKytcbiAgICB9XG4gIH1cblxuICAvKiogV2h5IG1vdmluZyBpcyBsb2NrZWQsIGluIHdvcmRzOiBcInByaW50aW5nXCIgb25seSBmb3IgYSByZWFsIHByaW50LiAnJyB3aGVuIGl0IGlzbid0LiAqL1xuICBnZXQgbW92ZUxvY2tSZWFzb24gKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMucHJpbnRMb2NrZWQpIHJldHVybiAnTm90IHdoaWxlIHByaW50aW5nLidcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm4gJ1RoZSBwcmludGVyIGlzIGJ1c3kuIE1vdmluZyBjb21lcyBiYWNrIHdoZW4gaXQgZmluaXNoZXMuJ1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgZ2V0IHRvb2xoZWFkICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLnRvb2xoZWFkID8/IHt9XG4gIH1cblxuICBnZXQgcG9zaXRpb24gKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gKHRoaXMudG9vbGhlYWQucG9zaXRpb24gYXMgbnVtYmVyW10gfCB1bmRlZmluZWQpID8/IFswLCAwLCAwLCAwXVxuICB9XG5cbiAgZ2V0IGF4aXNNaW4gKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gKHRoaXMudG9vbGhlYWQuYXhpc19taW5pbXVtIGFzIG51bWJlcltdIHwgdW5kZWZpbmVkKSA/PyBbMCwgMCwgMF1cbiAgfVxuXG4gIGdldCBheGlzTWF4ICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuICh0aGlzLnRvb2xoZWFkLmF4aXNfbWF4aW11bSBhcyBudW1iZXJbXSB8IHVuZGVmaW5lZCkgPz8gWzIwMCwgMjAwLCAyMDBdXG4gIH1cblxuICBnZXQgaG9tZWRBeGVzICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAoKHRoaXMudG9vbGhlYWQuaG9tZWRfYXhlcyBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKS50b1VwcGVyQ2FzZSgpXG4gIH1cblxuICBnZXQgeHlTcGVlZCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5kZWZhdWx0VG9vbGhlYWRYWVNwZWVkIGFzIG51bWJlclxuICB9XG5cbiAgZ2V0IHpTcGVlZCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5kZWZhdWx0VG9vbGhlYWRaU3BlZWQgYXMgbnVtYmVyXG4gIH1cblxuICAvLyAtLSBoZWF0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBoZWF0ZXJzICgpOiBIZWF0ZXJbXSB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEhlYXRlcnMnXSBhcyBIZWF0ZXJbXSkgPz8gW11cbiAgfVxuXG4gIGdldCBub3p6bGUgKCk6IEhlYXRlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmhlYXRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gJ2V4dHJ1ZGVyJykgPz8gbnVsbFxuICB9XG5cbiAgZ2V0IGJlZCAoKTogSGVhdGVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaGVhdGVycy5maW5kKGggPT4gaC5uYW1lID09PSAnaGVhdGVyX2JlZCcpID8/IG51bGxcbiAgfVxuXG4gIGdldCBjaGFtYmVyICgpOiBTZW5zb3IgfCBudWxsIHtcbiAgICBjb25zdCBzZW5zb3JzID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0U2Vuc29ycyddIGFzIFNlbnNvcltdKSA/PyBbXVxuICAgIHJldHVybiBzZW5zb3JzLmZpbmQocyA9PiAvY2hhbWJlci9pLnRlc3Qocy5uYW1lKSkgPz8gbnVsbFxuICB9XG5cbiAgZ2V0IHByZXNldHMgKCk6IFRlbXBlcmF0dXJlUHJlc2V0W10ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldFRlbXBQcmVzZXRzJ10gYXMgVGVtcGVyYXR1cmVQcmVzZXRbXSkgPz8gW11cbiAgfVxuXG4gIGdldCBtYXRlcmlhbHMgKCk6IE1hdGVyaWFsW10ge1xuICAgIHJldHVybiBtYXRlcmlhbHNGcm9tKHRoaXMucHJlc2V0cylcbiAgfVxuXG4gIGdldCBtYXRlcmlhbCAoKTogTWF0ZXJpYWwgfCBudWxsIHtcbiAgICByZXR1cm4gbWF0ZXJpYWxJblVzZSh0aGlzLm1hdGVyaWFscywgdGhpcy5ub3p6bGU/LnRhcmdldCA/PyAwLCB0aGlzLmJlZD8udGFyZ2V0ID8/IDApXG4gIH1cblxuICBnZXQgbWF0ZXJpYWxDaG9pY2VzICgpOiBNYXRlcmlhbENob2ljZVtdIHtcbiAgICByZXR1cm4gbWF0ZXJpYWxDaG9pY2VzKHRoaXMubWF0ZXJpYWxzKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHByaW50ZXIgY2FuIHJlbWVtYmVyIHRoZSBtYXRlcmlhbCBpdHNlbGYgKEtsaXBwZXIncyBbc2F2ZV92YXJpYWJsZXNdOyB0aGUgTTEgaGFzIGl0KS4gKi9cbiAgZ2V0IHNhdmVzTWF0ZXJpYWwgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAnc2F2ZV92YXJpYWJsZXMnIGluIHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlclxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBtYXRlcmlhbCBsb2FkZWQ6IHRoZSBvbmUgdGhlIHByaW50ZXIgcmVtZW1iZXJzICh0aGUgcGFuZWwgYW5kIHRoaXNcbiAgICogcGFnZSBzZXQgdGhlIHNhbWUgc2F2ZV92YXJpYWJsZXMgbXVvbl9tYXRlcmlhbCksIGVsc2UsIG9uIGEgcHJpbnRlclxuICAgKiB0aGF0IGNhbid0IHJlbWVtYmVyIG9uZSwgdGhlIG9uZSBzZXQgaGVyZS5cbiAgICovXG4gIGdldCBsb2FkZWRNYXRlcmlhbCAoKTogTWF0ZXJpYWxDaG9pY2UgfCBudWxsIHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5zYXZlc01hdGVyaWFsXG4gICAgICA/IHNhdmVkTWF0ZXJpYWxOYW1lKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5zYXZlX3ZhcmlhYmxlcz8udmFyaWFibGVzKVxuICAgICAgOiAodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5sb2FkZWRNYXRlcmlhbCBhcyBzdHJpbmcgfCBudWxsKVxuICAgIGNvbnN0IGNob2ljZSA9IGxvYWRlZENob2ljZSh0aGlzLm1hdGVyaWFsQ2hvaWNlcywgbmFtZSlcbiAgICBjb25zdCBjb2xvdXIgPSB0aGlzLmxvYWRlZENvbG91clxuICAgIHJldHVybiBjaG9pY2UgJiYgY29sb3VyID8geyAuLi5jaG9pY2UsIGNvbG91ciB9IDogY2hvaWNlXG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBmaWxhbWVudCBpcyBpbiB0aGUgcHJpbnRlciwgZnJvbSBhIHRydXN0d29ydGh5IGZpbGFtZW50IHNlbnNvclxuICAgKiAoYSBzd2l0Y2ggc2Vuc29yLCBzd2l0Y2hlZCBvbjsgc2VlIGZpbGFtZW50U2Vuc2VkKTogbnVsbCB3aGVuIG5vbmVcbiAgICogcmVwb3J0cywgd2hlcmUgb25seSB3aGF0IHNvbWVvbmUgc2FpZCBpcyBsb2FkZWQgY2FuIHRlbGwuXG4gICAqL1xuICBnZXQgZmlsYW1lbnRTZW5zZWQgKCk6IGJvb2xlYW4gfCBudWxsIHtcbiAgICByZXR1cm4gZmlsYW1lbnRTZW5zZWQodGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyKVxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHByaW50ZXIgaGFzIGEgbWF0ZXJpYWwgbG9hZGVkLCBhbmQgd2hpY2g6IHRoZSBmaWxhbWVudCBzZW5zb3JcbiAgICogc2F5cyB3aGV0aGVyIHRoZXJlIGlzIGFueSwgdGhlIHJlY29yZGVkIG1hdGVyaWFsIHNheXMgd2hpY2guIFdpdGggbm9cbiAgICogc2Vuc29yIHJlcG9ydGluZywgYSByZWNvcmRlZCBtYXRlcmlhbCBpcyB3aGF0IHRoZXJlIGlzIHRvIGdvIG9uLiBBXG4gICAqIG1hdGVyaWFsIGNob3NlbiBhcyBhIHByZXNldCAodGhlIGhlYXRlciB0YXJnZXRzKSBzYXlzIG5vdGhpbmcgYWJvdXQgdGhpcy5cbiAgICovXG4gIGdldCBsb2FkZWRGaWxhbWVudCAoKTogTG9hZGVkRmlsYW1lbnQge1xuICAgIGNvbnN0IG5hbWUgPSB0aGlzLmxvYWRlZE1hdGVyaWFsPy5uYW1lID8/IG51bGxcbiAgICBjb25zdCBzZW5zZWQgPSB0aGlzLmZpbGFtZW50U2Vuc2VkXG4gICAgcmV0dXJuIHsgbG9hZGVkOiBzZW5zZWQgPz8gISFuYW1lLCBuYW1lIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGlsZSBhIHByaW50IHJ1bnMgYW5kIG5vYm9keSBoYXMgc2FpZCB3aGF0J3MgbG9hZGVkOiB3aGF0IGl0cyBmaWxlIHdhc1xuICAgKiBzbGljZWQgZm9yLCB3aGljaCBpcyB3aGF0IGlzIGZlZWRpbmcgbm93LiBTaG93biBhcyB0aGF0LCBuZXZlciBzYXZlZCBhc1xuICAgKiB0aGUgbG9hZGVkIHJlY29yZCAoMTQgT2N0OiBXYWxudXQgcHJpbnRpbmcgc2hvd2VkIFwiTm90IHNldFwiKS5cbiAgICovXG4gIGdldCBwcmludGluZ1dpdGggKCk6IHsgbmFtZTogc3RyaW5nLCBjb2xvdXI6IHN0cmluZyB8IG51bGwgfSB8IG51bGwge1xuICAgIGlmICh0aGlzLmxvYWRlZE1hdGVyaWFsIHx8ICEodGhpcy5wcmludGVyUHJpbnRpbmcgfHwgdGhpcy5wcmludGVyUGF1c2VkKSkgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gZmlsZUZpbGFtZW50KHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5jdXJyZW50X2ZpbGUpXG4gIH1cblxuICAvKipcbiAgICogVGhlIGxvYWRlZCBmaWxhbWVudCdzIGNvbG91ciwgd2hlbiBzb21lb25lIGhhcyBzYWlkIGl0OiB0aGUgcHJpbnRlcidzXG4gICAqIHNhdmVfdmFyaWFibGVzIG11b25fbWF0ZXJpYWxfY29sb3VyIChzZXQgaGVyZSwgb24gQ29udHJvbCBhbmQgZnJvbSB0aGVcbiAgICogc2xpY2VyKSwgZWxzZSwgb24gYSBwcmludGVyIHRoYXQgY2FuJ3QgcmVtZW1iZXIgb25lLCB0aGUgb25lIHNldCBoZXJlLlxuICAgKiBOdWxsIHdoZW4gbm9ib2R5IGhhczogYSBtYXRlcmlhbCdzIHN3YXRjaCBpcyBub3QgaXRzIGNvbG91ci5cbiAgICovXG4gIGdldCBsb2FkZWRDb2xvdXIgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnNhdmVzTWF0ZXJpYWxcbiAgICAgID8gc2F2ZWRNYXRlcmlhbENvbG91cih0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuc2F2ZV92YXJpYWJsZXM/LnZhcmlhYmxlcylcbiAgICAgIDogbm9ybWFsaXNlQ29sb3VyKHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwubG9hZGVkTWF0ZXJpYWxDb2xvdXIpXG4gIH1cblxuICBzZXRMb2FkZWRNYXRlcmlhbCAoY2hvaWNlOiBNYXRlcmlhbENob2ljZSkge1xuICAgIGlmICh0aGlzLnNhdmVzTWF0ZXJpYWwpIHtcbiAgICAgIHRoaXMuc2VuZEdjb2RlKHNhdmVNYXRlcmlhbENvbW1hbmQoY2hvaWNlLm5hbWUpKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7IHBhdGg6ICd1aVNldHRpbmdzLmdlbmVyYWwubG9hZGVkTWF0ZXJpYWwnLCB2YWx1ZTogY2hvaWNlLm5hbWUsIHNlcnZlcjogdHJ1ZSB9KVxuICAgIH1cbiAgfVxuXG4gIHNldExvYWRlZENvbG91ciAoY29sb3VyOiBzdHJpbmcpIHtcbiAgICBjb25zdCBoZXggPSBub3JtYWxpc2VDb2xvdXIoY29sb3VyKVxuICAgIGlmICghaGV4KSByZXR1cm5cbiAgICBpZiAodGhpcy5zYXZlc01hdGVyaWFsKSB7XG4gICAgICB0aGlzLnNlbmRHY29kZShzYXZlTWF0ZXJpYWxDb2xvdXJDb21tYW5kKGhleCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHsgcGF0aDogJ3VpU2V0dGluZ3MuZ2VuZXJhbC5sb2FkZWRNYXRlcmlhbENvbG91cicsIHZhbHVlOiBoZXgsIHNlcnZlcjogdHJ1ZSB9KVxuICAgIH1cbiAgfVxuXG4gIC8qKiBUaGUgZXh0cnVkZXIncyBoYXJkIGxpbWl0LCBmcm9tIHByaW50ZXIuY2ZnLCBvciBudWxsIHdoZW4gdGhlIHByaW50ZXIgZGlkbid0IHNheS4gKi9cbiAgZ2V0IGV4dHJ1ZGVyTWF4VGVtcCAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3QgbWF4ID0gTnVtYmVyKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXI/LnByaW50ZXI/LmNvbmZpZ2ZpbGU/LnNldHRpbmdzPy5leHRydWRlcj8ubWF4X3RlbXApXG4gICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShtYXgpICYmIG1heCA+IDAgPyBtYXggOiBudWxsXG4gIH1cblxuICAvKiogVGVsbHMgdGhlIHBlcnNvbiB3aHkgbm90aGluZyB3YXMgc2VudCwgd2hlbiB0aGUgbWF0ZXJpYWwgaXMgaG90dGVyIHRoYW4gdGhlIGhvdGVuZCBjYW4gZ28uIFRydWUgaWYgaXQgaXMuICovXG4gIHJlZnVzZVRvb0hvdCAobmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBub3p6bGU6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWFzb24gPSBob3RlbmRMaW1pdFJlYXNvbihuYW1lLCBub3p6bGUsIHRoaXMuZXh0cnVkZXJNYXhUZW1wKVxuICAgIGlmICghcmVhc29uKSByZXR1cm4gZmFsc2VcbiAgICBFdmVudEJ1cy4kZW1pdChyZWFzb24sIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogODAwMCB9KVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvKiogSGVhdHMgZm9yIGEgbWF0ZXJpYWw6IGFzIGl0cyBwcmVzZXQgc2F5cyB3aGVuIGl0IGhhcyBvbmUsIGVsc2UgdG8gaXRzIHRlbXBlcmF0dXJlcy4gKi9cbiAgaGVhdEZvciAoY2hvaWNlOiBNYXRlcmlhbENob2ljZSkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgIGlmICh0aGlzLnJlZnVzZVRvb0hvdChjaG9pY2UubmFtZSwgY2hvaWNlLm5venpsZSkpIHJldHVyblxuICAgIGNvbnN0IHByZXNldCA9IGNob2ljZS5wcmVzZXRJZCA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHRoaXMucHJlc2V0cy5maW5kKHAgPT4gcC5pZCA9PT0gY2hvaWNlLnByZXNldElkKVxuICAgIGlmIChwcmVzZXQpIHtcbiAgICAgIHByZXNldENvbW1hbmRzKHByZXNldCkuZm9yRWFjaChnID0+IHRoaXMuc2VuZEdjb2RlKGcpKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChjaG9pY2Uubm96emxlICE9PSBudWxsKSB0aGlzLnNldEhlYXRlcih0aGlzLm5venpsZSwgY2hvaWNlLm5venpsZSlcbiAgICBpZiAoY2hvaWNlLmJlZCAhPT0gbnVsbCkgdGhpcy5zZXRIZWF0ZXIodGhpcy5iZWQsIGNob2ljZS5iZWQpXG4gIH1cblxuICBzZXRIZWF0ZXIgKGhlYXRlcjogSGVhdGVyIHwgbnVsbCwgdGFyZ2V0OiBudW1iZXIpIHtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5oZWF0ZXJzLmZpbmQoaCA9PiBoLm5hbWUgPT09IGhlYXRlcj8ubmFtZSlcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8ICFjdXJyZW50IHx8ICFOdW1iZXIuaXNGaW5pdGUodGFyZ2V0KSB8fCB0YXJnZXQgPCAwIHx8IHRhcmdldCA+IChjdXJyZW50Lm1heFRlbXAgPz8gMzAwKSkgcmV0dXJuXG4gICAgdGhpcy5zZW5kR2NvZGUoYFNFVF9IRUFURVJfVEVNUEVSQVRVUkUgSEVBVEVSPSR7Y3VycmVudC5uYW1lfSBUQVJHRVQ9JHtNYXRoLnJvdW5kKHRhcmdldCl9YClcbiAgfVxuXG4gIGFwcGx5TWF0ZXJpYWwgKG1hdGVyaWFsOiBNYXRlcmlhbCkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgIGlmICh0aGlzLnJlZnVzZVRvb0hvdChtYXRlcmlhbC5uYW1lLCBtYXRlcmlhbC5ub3p6bGUpKSByZXR1cm5cbiAgICBjb25zdCBwcmVzZXQgPSB0aGlzLnByZXNldHMuZmluZChwID0+IHAuaWQgPT09IG1hdGVyaWFsLmlkKVxuICAgIGlmIChwcmVzZXQpIHByZXNldENvbW1hbmRzKHByZXNldCkuZm9yRWFjaChnID0+IHRoaXMuc2VuZEdjb2RlKGcpKVxuICB9XG5cbiAgYXN5bmMgY29vbERvd24gKCkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucGFuZWxUYXJnZXRcbiAgICBpZiAodGhpcy5idXN5KSB7XG4gICAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oJ1RoZSBwcmludGVyIGlzIGJ1c3kuIFdpdGggdGhlIGhlYXRlcnMgb2ZmLCB3aGF0IGl0IGlzIGRvaW5nIG5vdyB3aWxsIG1vc3QgbGlrZWx5IGZhaWwuJywge1xuICAgICAgICB0aXRsZTogJ1R1cm4gdGhlIGhlYXRlcnMgb2ZmPycsXG4gICAgICAgIGJ1dHRvblRydWVUZXh0OiAnVHVybiB0aGVtIG9mZicsXG4gICAgICAgIGJ1dHRvbkZhbHNlVGV4dDogJ0xlYXZlIHRoZW0gb24nLFxuICAgICAgICBkYW5nZXI6IHRydWVcbiAgICAgIH0pXG4gICAgICBpZiAoIW9rKSByZXR1cm5cbiAgICB9XG4gICAgaWYgKHRoaXMuY29udHJvbFJlYWR5ICYmIHRhcmdldCA9PT0gdGhpcy5wYW5lbFRhcmdldCkgdGhpcy5zZW5kR2NvZGUoJ1RVUk5fT0ZGX0hFQVRFUlMnKVxuICB9XG5cbiAgLy8gLS0gbW92ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBpc0hvbWVkIChheGVzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXhlcy50b1VwcGVyQ2FzZSgpLnNwbGl0KCcnKS5ldmVyeShhID0+IHRoaXMuaG9tZWRBeGVzLmluY2x1ZGVzKGEpKVxuICB9XG5cbiAgLyoqXG4gICAqIE9uIGEgTXVvbiBwcmludGVyIChvciBvbmUgbm90IGtub3duIHlldCkgYSBaIHNhdmVkIHJldmVyc2VkIG1vdmVzIHRoZVxuICAgKiBub3JtYWwgd2F5OiByZXZlcnNpbmcgdGhlIE0xJ3MgcGxhdGUgb25seSBjcmFzaGVkIGl0LiBBbm90aGVyIHByaW50ZXIgbWF5XG4gICAqIG5lZWQgYW55IGF4aXMgcmV2ZXJzZWQuXG4gICAqL1xuICBpbnZlcnRlZCAoYXhpczogQXhpcyk6IGJvb2xlYW4ge1xuICAgIGlmIChheGlzLnRvTG93ZXJDYXNlKCkgPT09ICd6JyAmJiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvaXNNdW9uUHJpbnRlciddICE9PSBmYWxzZSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuICEhdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5heGlzPy5bYXhpcy50b0xvd2VyQ2FzZSgpXT8uaW52ZXJ0ZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbm8tZ28gcmVnaW9ucyB0aGlzIHByaW50ZXIgZGVjbGFyZXMgaW4gW2JlZF9tZXNoXSwgcmVhZCBsaXZlLiBVbnRpbFxuICAgKiB0aGUgcHJpbnRlcidzIGNvbmZpZyBoYXMgbG9hZGVkIGF0IGFsbCwgdGhlIHJlZ2lvbnMgYXJlIHVua25vd246IHRyZWF0ZWRcbiAgICogYXMgdW5yZWFkYWJsZSwgc28gb25seSByYWlzaW5nIHRoZSBoZWFkIGlzIGFsbG93ZWQuXG4gICAqL1xuICBnZXQgbm9HbyAoKTogTm9Hb0NvbmZpZyB8IG51bGwgfCAnaW52YWxpZCcge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGU/LnNldHRpbmdzXG4gICAgaWYgKCFzZXR0aW5ncyB8fCAhT2JqZWN0LmtleXMoc2V0dGluZ3MpLmxlbmd0aCkgcmV0dXJuICdpbnZhbGlkJ1xuICAgIHJldHVybiByZWFkTm9HbyhzZXR0aW5ncy5iZWRfbWVzaClcbiAgfVxuXG4gIC8qKlxuICAgKiBUb29saGVhZCBtaW51cyBHLWNvZGUgcG9zaXRpb24sIHBlciBheGlzOiB0aGUgbWVzaCBhbmQgRy1jb2RlIG9mZnNldHMgbm93XG4gICAqIGluIGZvcmNlLiBQbGFubmluZyBpcyBkb25lIGluIHRvb2xoZWFkIChyZWFsKSBjb29yZGluYXRlczsgYSBtb3ZlIGlzIHNlbnRcbiAgICogaW4gRy1jb2RlIGNvb3JkaW5hdGVzLCBzbyBhIHBsYW5uZWQgcGxhY2UgaXMgc2VudCBtaW51cyB0aGlzLiBOdWxsIHdoZW5cbiAgICogdGhlIEctY29kZSBwb3NpdGlvbiBpc24ndCBrbm93bi5cbiAgICovXG4gIGdldCBnY29kZU9mZnNldCAoKTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdIHwgbnVsbCB7XG4gICAgY29uc3QgZ2NvZGUgPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZ2NvZGVfbW92ZT8uZ2NvZGVfcG9zaXRpb24gYXMgbnVtYmVyW10gfCB1bmRlZmluZWRcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZ2NvZGUpKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGQgPSBbMCwgMSwgMl0ubWFwKGkgPT4gTnVtYmVyKHRoaXMucG9zaXRpb25baV0pIC0gTnVtYmVyKGdjb2RlW2ldKSlcbiAgICByZXR1cm4gZC5ldmVyeShOdW1iZXIuaXNGaW5pdGUpID8gZCBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gOiBudWxsXG4gIH1cblxuICAvKipcbiAgICogV2h5IGEgaGFuZCBtb3ZlIG11c3Qgd2FpdCwgb3IgJycgaWYgaXQgY2FuIGdvOiB0aGUgaGVhZCBwb3NpdGlvbiBpc24ndFxuICAgKiB0aGlzIGNvbm5lY3Rpb24ncyB5ZXQsIGEgRy1jb2RlIHNjcmlwdCBpcyBzdGlsbCBydW5uaW5nIChhIG1vdmUgc2VudCBub3dcbiAgICogd291bGQgcnVuIGZyb20gd2hlcmV2ZXIgaXQgbGVhdmVzIHRoZSBoZWFkKSwgb3IgdGhlIGxhc3QgaGFuZCBtb3ZlIGhhc24ndFxuICAgKiBiZWVuIHJlcG9ydGVkLiBSZWFkIGZyZXNoLCBuZXZlciBjYWNoZWQuXG4gICAqXG4gICAqIE9uIGV2ZXJ5IHByaW50ZXIsIG5vdCBvbmx5IG9uZSB3aXRoIG5vLWdvIHJlZ2lvbnMgKEtBTi0xNzQ1KTogYSBqb2cgaXMgYVxuICAgKiByZWxhdGl2ZSBtb3ZlLCBhbmQgb25lIHBsYW5uZWQgZnJvbSBhIHBvc2l0aW9uIHRoYXQgbGFncyBjYW4gYmUgcmVmdXNlZFxuICAgKiBieSBLbGlwcGVyIChcIk1vdmUgb3V0IG9mIHJhbmdlXCIpLCB3aGljaCBhYm9ydHMgdGhlIHNjcmlwdCBiZWZvcmUgaXRzXG4gICAqIFJFU1RPUkVfR0NPREVfU1RBVEUgYW5kIGxlYXZlcyB0aGUgcHJpbnRlciBpbiBHOTEgZm9yIHRoZSBjb25zb2xlIGFuZFxuICAgKiBtYWNyb3MgYWZ0ZXIgaXQuIFdhaXRpbmcgZm9yIHRoZSBsYXN0IG1vdmUgdG8gbGFuZCBrZWVwcyBldmVyeSBqb2cgaW5zaWRlXG4gICAqIHRoZSBsaW1pdHMgaXQgd2FzIGNsYW1wZWQgdG8uXG4gICAqL1xuICBoYW5kTW92ZVdhaXQgKCk6IHN0cmluZyB7XG4gICAgaWYgKCFoZWFkU3RhdHVzLmZyZXNoKSByZXR1cm4gJ1dhaXQgZm9yIHRoZSBwcmludGVyIHRvIHJlcG9ydCB3aGVyZSB0aGUgaGVhZCBpcy4nXG4gICAgaWYgKHNjcmlwdHNJbkZsaWdodC5jb3VudCA+IDApIHJldHVybiAnV2FpdCBmb3IgdGhlIHByaW50ZXIgdG8gZmluaXNoIHdoYXQgaXQgaXMgZG9pbmcuJ1xuICAgIGlmIChoYW5kTW92ZVNldHRsaW5nKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5nY29kZV9tb3ZlPy5nY29kZV9wb3NpdGlvbiwgdGhpcy5wYW5lbFRhcmdldCkpIHJldHVybiAnV2FpdCBmb3IgdGhlIGhlYWQgdG8gZmluaXNoIG1vdmluZy4nXG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvKiogTG9zaW5nIGNvbnRyb2wgKGRpc2Nvbm5lY3QsIEtsaXBweSBub3QgcmVhZHksIHNpZ24tb3V0KSBlbmRzIGFueSB3YWl0OiB0aGUgbmV4dCBtb3ZlIHBsYW5zIGFmcmVzaC4gKi9cbiAgQFdhdGNoKCdjb250cm9sUmVhZHknKVxuICBvbkNvbnRyb2xSZWFkeUZvckhhbmRNb3ZlIChyZWFkeTogYm9vbGVhbikge1xuICAgIGlmICghcmVhZHkpIHtcbiAgICAgIHJlbGVhc2VIYW5kTW92ZSgpXG4gICAgICAvLyBLbGlwcHkgZ29uZSAocmVzdGFydCwgc2h1dGRvd24sIGRpc2Nvbm5lY3QpOiBpdCBpcyBzdWJzY3JpYmVkIGFmcmVzaFxuICAgICAgLy8gd2hlbiBpdCBjb21lcyBiYWNrLCBzbyB3YWl0IGZvciB0aGF0IHN0YXR1cyBiZWZvcmUgcGxhbm5pbmcuIChMb3NpbmdcbiAgICAgIC8vIGNvbnRyb2wgZm9yIG90aGVyIHJlYXNvbnMga2VlcHMgdGhlIHNhbWUgc3Vic2NyaXB0aW9uLilcbiAgICAgIGlmICghdGhpcy5rbGlwcHlSZWFkeSB8fCAhdGhpcy5rbGlwcHlDb25uZWN0ZWQpIGhlYWRTdGF0dXMuZnJlc2ggPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQbGFuIGEgbW92ZSB0byBgcmVhbFRvYCAodG9vbGhlYWQgY29vcmRpbmF0ZXMpIGFnYWluc3QgdGhlIGJlZCdzIG5vLWdvXG4gICAqIHJlZ2lvbnMuIFN0ZXBzIGNvbWUgYmFjayBpbiBHLWNvZGUgY29vcmRpbmF0ZXMsIHJlYWR5IHRvIHNlbmQuXG4gICAqL1xuICBwbGFuSGFuZE1vdmUgKHJlYWxUbzogW251bWJlciwgbnVtYmVyLCBudW1iZXJdKTogTW92ZVBsYW4ge1xuICAgIGNvbnN0IG5vR28gPSB0aGlzLm5vR29cbiAgICBjb25zdCBsaW1pdHMgPSB7IG1pbjogdGhpcy5heGlzTWluLnNsaWNlKDAsIDMpIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgbWF4OiB0aGlzLmF4aXNNYXguc2xpY2UoMCwgMykgYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdIH1cbiAgICBjb25zdCBmcm9tID0geyB4OiBOdW1iZXIodGhpcy5wb3NpdGlvblswXSksIHk6IE51bWJlcih0aGlzLnBvc2l0aW9uWzFdKSwgejogTnVtYmVyKHRoaXMucG9zaXRpb25bMl0pIH1cbiAgICBjb25zdCB0byA9IHsgeDogcmVhbFRvWzBdLCB5OiByZWFsVG9bMV0sIHo6IHJlYWxUb1syXSB9XG4gICAgaWYgKG5vR28gPT09IG51bGwpIHJldHVybiBwbGFuTW92ZShmcm9tLCB0bywgbnVsbCwgbGltaXRzKVxuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZ2NvZGVPZmZzZXRcbiAgICBpZiAoIW9mZnNldCkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdUaGUgaGVhZCBwb3NpdGlvbiBpcyBub3Qga25vd24uJyB9XG4gICAgY29uc3QgcGxhbiA9IHBsYW5Nb3ZlKGZyb20sIHRvLCBub0dvLCBsaW1pdHMsIG1lc2hTcGFuKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5iZWRfbWVzaCksIHRoaXMuaXNIb21lZCgnWicpLCB0aGlzLmlzSG9tZWQoJ1hZJykpXG4gICAgaWYgKCFwbGFuLm9rKSByZXR1cm4gcGxhblxuICAgIGNvbnN0IHRvR2NvZGUgPSAocDogUGxhY2UpOiBQbGFjZSA9PiB7XG4gICAgICBjb25zdCBvdXQ6IFBsYWNlID0ge31cbiAgICAgIDsoWydYJywgJ1knLCAnWiddIGFzIEF4aXNbXSkuZm9yRWFjaCgoYSwgaSkgPT4geyBpZiAocFthXSAhPT0gdW5kZWZpbmVkKSBvdXRbYV0gPSBNYXRoLnJvdW5kKChwW2FdIGFzIG51bWJlciAtIG9mZnNldFtpXSkgKiAxMDAwKSAvIDEwMDAgfSlcbiAgICAgIHJldHVybiBvdXRcbiAgICB9XG4gICAgcmV0dXJuIHsgLi4ucGxhbiwgc3RlcHM6IHBsYW4uc3RlcHMubWFwKHRvR2NvZGUpIH1cbiAgfVxuXG4gIHJlZnVzZU1vdmUgKHJlYXNvbjogc3RyaW5nKSB7XG4gICAgRXZlbnRCdXMuJGVtaXQocmVhc29uLCB7IHR5cGU6ICd3YXJuaW5nJyB9KVxuICB9XG5cbiAgLyoqIE1ha2UgdGhlIG5leHQgaGFuZCBtb3ZlIHdhaXQgZm9yIHRoaXMgb25lIHRvIGxhbmQgKG9uIGV2ZXJ5IHByaW50ZXI6IHNlZSBoYW5kTW92ZVdhaXQpLiAqL1xuICBtYXJrSGFuZE1vdmUgKHJlYWxUbzogbnVtYmVyW10pIHtcbiAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmdjb2RlT2Zmc2V0XG4gICAgaWYgKCFvZmZzZXQpIHJldHVyblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcbiAgICBjb25zdCB0cmF2ZWwgPSB0aGlzLnRyYXZlbE1zKHJlYWxUbylcbiAgICBjb25zdCB0YXJnZXQgPSByZWFsVG8uc2xpY2UoMCwgMykubWFwKCh2LCBpKSA9PiBNYXRoLnJvdW5kKCh2IC0gb2Zmc2V0W2ldKSAqIDEwMDApIC8gMTAwMClcbiAgICBsb2NrSGFuZE1vdmUodGFyZ2V0LCB0aGlzLnBhbmVsVGFyZ2V0LCBub3csIHRyYXZlbClcbiAgICAvLyBPbmx5IGEgbW92ZSBzZW50IHdoaWxlIHRoZSBwcmludGVyIHdhc24ndCBidXN5IG9wZW5zIHRoZSBvd24tbW92ZSB3aW5kb3c7IG9uZSBzZW50IG1pZC1tb3ZlIG5ldmVyIGV4dGVuZHMgaXRcbiAgICAvLyAoaXQgb25seSBtb3ZlcyB0aGUgd2luZG93J3MgdGFyZ2V0LCBzbyB0aGUgcHJpbnRlciBoZWFkaW5nIHRoZXJlIHN0aWxsIGNvdW50cyBhcyB0aGlzIHBhZ2UncyBtb3ZlKS5cbiAgICBjb25zdCBmcm9tID0gKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5nY29kZV9tb3ZlPy5nY29kZV9wb3NpdGlvbiBhcyBudW1iZXJbXSB8IHVuZGVmaW5lZCk/LnNsaWNlKDAsIDMpXG4gICAgY29uc3QgbXMgPSBub3RlT3duTW90aW9uKHRoaXMucGFuZWxUYXJnZXQsIG5vdywgdHJhdmVsLCB0aGlzLnByaW50ZXJTdGF0ZSAhPT0gJ2J1c3knLCB0YXJnZXQsIGZyb20pXG4gICAgbW90aW9uQ2xvY2suZXBvY2grK1xuICAgIGlmIChtcyA+IDApIHtcbiAgICAgIGlmIChtb3Rpb25UaW1lciAhPT0gbnVsbCkgY2xlYXJUaW1lb3V0KG1vdGlvblRpbWVyKVxuICAgICAgbW90aW9uVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHsgbW90aW9uVGltZXIgPSBudWxsOyBtb3Rpb25DbG9jay5lcG9jaCsrIH0sIG1zICsgMjApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFib3V0IGhvdyBsb25nIGEgaGFuZCBtb3ZlIHRvIGByZWFsVG9gIHRha2VzLCBtczogYWNyb3NzIGF0IHRoZSBoZWFkJ3NcbiAgICogc3BlZWQsIHVwIGFuZCBkb3duIGF0IHRoZSBwbGF0ZSdzLCBjb3VudGluZyBhIGxpZnQgdG8gdGhlIG5vdGNoJ3NcbiAgICogdHJhdmVyc2UgaGVpZ2h0IGFuZCBiYWNrIHdoZW4gdGhlIHBsYW4gbGlmdHMuXG4gICAqL1xuICB0cmF2ZWxNcyAocmVhbFRvOiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgY29uc3QgcCA9IFswLCAxLCAyXS5tYXAoaSA9PiBOdW1iZXIodGhpcy5wb3NpdGlvbltpXSkpXG4gICAgY29uc3QgeHkgPSBNYXRoLmh5cG90KHJlYWxUb1swXSAtIHBbMF0sIHJlYWxUb1sxXSAtIHBbMV0pXG4gICAgbGV0IHogPSBNYXRoLmFicyhyZWFsVG9bMl0gLSBwWzJdKVxuICAgIGNvbnN0IG5vR28gPSB0aGlzLm5vR29cbiAgICBpZiAobm9HbyAmJiBub0dvICE9PSAnaW52YWxpZCcpIHtcbiAgICAgIGNvbnN0IHBsYW4gPSB0aGlzLnBsYW5IYW5kTW92ZShbcmVhbFRvWzBdLCByZWFsVG9bMV0sIHJlYWxUb1syXV0pXG4gICAgICBpZiAocGxhbi5vayAmJiBwbGFuLmxpZnRlZCkge1xuICAgICAgICBjb25zdCBvdmVyID0gTnVtYmVyKHBsYW4uc3RlcHNbMF0uWikgKyAodGhpcy5nY29kZU9mZnNldCA/PyBbMCwgMCwgMF0pWzJdXG4gICAgICAgIHogPSBNYXRoLmFicyhvdmVyIC0gcFsyXSkgKyBNYXRoLmFicyhvdmVyIC0gcmVhbFRvWzJdKVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBtcyA9ICh4eSAvIHRoaXMueHlTcGVlZCArIHogLyB0aGlzLnpTcGVlZCkgKiAxMDAwXG4gICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShtcykgPyBtcyA6IDBcbiAgfVxuXG4gIC8qKiBTZW5kIGEgcGxhbm5lZCBtb3ZlOiBsaWZ0LCBhY3Jvc3MsIGRvd24sIGFzIG9uZSBhYnNvbHV0ZSBzY3JpcHQuICovXG4gIHNlbmRQbGFubmVkTW92ZXMgKHN0ZXBzOiBQbGFjZVtdKSB7XG4gICAgY29uc3QgbGluZSA9IChwOiBQbGFjZSkgPT4ge1xuICAgICAgY29uc3Qgd29yZHMgPSAoWydYJywgJ1knLCAnWiddIGFzIEF4aXNbXSkuZmlsdGVyKGEgPT4gcFthXSAhPT0gdW5kZWZpbmVkKS5tYXAoYSA9PiBgJHthfSR7cFthXX1gKVxuICAgICAgY29uc3QgcmF0ZSA9IHAuWiAhPT0gdW5kZWZpbmVkID8gdGhpcy56U3BlZWQgOiB0aGlzLnh5U3BlZWRcbiAgICAgIHJldHVybiBgRzEgJHt3b3Jkcy5qb2luKCcgJyl9IEYke3JhdGUgKiA2MH1gXG4gICAgfVxuICAgIHRoaXMuc2VuZEdjb2RlKFsnU0FWRV9HQ09ERV9TVEFURSBOQU1FPV91aV9tb3ZlbWVudCcsICdHOTAnLCAuLi5zdGVwcy5tYXAobGluZSksICdSRVNUT1JFX0dDT0RFX1NUQVRFIE5BTUU9X3VpX21vdmVtZW50J10uam9pbignXFxuJykpXG4gIH1cblxuICAvKiogQSBzdGVwIGFsb25nIG9uZSBheGlzLCBjdXQgc2hvcnQgYXQgdGhlIG1hY2hpbmUncyBsaW1pdHMsIGtlcHQgb3V0IG9mIHRoZSBiZWQncyBuby1nbyByZWdpb25zLiAqL1xuICBtb3ZlQnkgKGF4aXM6IEF4aXMsIGRpc3RhbmNlOiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuYnVzeSB8fCAhdGhpcy5pc0hvbWVkKGF4aXMpIHx8ICFOdW1iZXIuaXNGaW5pdGUoZGlzdGFuY2UpKSByZXR1cm5cbiAgICBpZiAoIVt0aGlzLnh5U3BlZWQsIHRoaXMuelNwZWVkXS5ldmVyeSh2ID0+IE51bWJlci5pc0Zpbml0ZSh2KSAmJiB2ID4gMCkpIHJldHVyblxuICAgIGNvbnN0IHdhaXQgPSB0aGlzLmhhbmRNb3ZlV2FpdCgpXG4gICAgaWYgKHdhaXQpIHsgdGhpcy5yZWZ1c2VNb3ZlKHdhaXQpOyByZXR1cm4gfVxuICAgIGNvbnN0IGkgPSAnWFlaJy5pbmRleE9mKGF4aXMpXG4gICAgY29uc3Qgc2lnbmVkID0gdGhpcy5pbnZlcnRlZChheGlzKSA/IC1kaXN0YW5jZSA6IGRpc3RhbmNlXG4gICAgY29uc3QgdGFyZ2V0ID0gY2xhbXBUbyh0aGlzLnBvc2l0aW9uW2ldICsgc2lnbmVkLCB0aGlzLmF4aXNNaW5baV0sIHRoaXMuYXhpc01heFtpXSlcbiAgICBjb25zdCBieSA9IE1hdGgucm91bmQoKHRhcmdldCAtIHRoaXMucG9zaXRpb25baV0pICogMTAwMCkgLyAxMDAwXG4gICAgaWYgKCFieSkgcmV0dXJuXG4gICAgY29uc3QgcmVhbFRvID0gWzAsIDEsIDJdLm1hcChqID0+IE51bWJlcih0aGlzLnBvc2l0aW9uW2pdKSkgYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgcmVhbFRvW2ldID0gdGFyZ2V0XG4gICAgY29uc3QgcGxhbiA9IHRoaXMucGxhbkhhbmRNb3ZlKHJlYWxUbylcbiAgICBpZiAoIXBsYW4ub2spIHsgdGhpcy5yZWZ1c2VNb3ZlKHBsYW4ucmVhc29uKTsgcmV0dXJuIH1cbiAgICBpZiAocGxhbi5saWZ0ZWQpIHRoaXMuc2VuZFBsYW5uZWRNb3ZlcyhwbGFuLnN0ZXBzKVxuICAgIGVsc2UgdGhpcy5zZW5kTW92ZUdjb2RlKGAke2F4aXN9JHtieX1gLCBheGlzID09PSAnWicgPyB0aGlzLnpTcGVlZCA6IHRoaXMueHlTcGVlZClcbiAgICB0aGlzLm1hcmtIYW5kTW92ZShyZWFsVG8pXG4gIH1cblxuICAvKipcbiAgICogQSBkaWFnb25hbCBzdGVwOiBYIGFuZCBZIGF0IG9uY2UsIGN1dCBzaG9ydCBhdCB0aGUgbWFjaGluZSdzIGxpbWl0cy5cbiAgICogU2VudCB0aHJvdWdoIG1vdmVUbywgc28gaXQgZ2V0cyB0aGUgc2FtZSBjaGVja3MgYXMgZXZlcnkgaGFuZCBtb3ZlXG4gICAqIChob21lZCwgbm90IHByaW50aW5nLCB0aGUgaGFuZC1tb3ZlIHdhaXQgYW5kIHRoZSBuby1nbyBwbGFubmVyKS5cbiAgICovXG4gIG1vdmVCeVhZIChkeDogbnVtYmVyLCBkeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSB8fCB0aGlzLmJ1c3kgfHwgIXRoaXMuaXNIb21lZCgnWFknKSB8fCAhTnVtYmVyLmlzRmluaXRlKGR4KSB8fCAhTnVtYmVyLmlzRmluaXRlKGR5KSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFbdGhpcy54eVNwZWVkLCB0aGlzLnpTcGVlZF0uZXZlcnkodiA9PiBOdW1iZXIuaXNGaW5pdGUodikgJiYgdiA+IDApKSByZXR1cm4gZmFsc2VcbiAgICBjb25zdCB3YWl0ID0gdGhpcy5oYW5kTW92ZVdhaXQoKVxuICAgIGlmICh3YWl0KSB7IHRoaXMucmVmdXNlTW92ZSh3YWl0KTsgcmV0dXJuIGZhbHNlIH1cbiAgICAvLyBQbGFubmVkIGZyb20gdGhlIHRvb2xoZWFkIChjb21tYW5kZWQpIHBvc2l0aW9uIGFuZCBzZW50IGFzIGEgcmVsYXRpdmVcbiAgICAvLyBzdGVwLCBhcyBtb3ZlQnkgZG9lcywgc28gYSBwb3NpdGlvbiB0aGF0IGxhZ3MgY2FuJ3Qgc3dhbGxvdyBhIHN0ZXAuXG4gICAgY29uc3QgcmVhbFRvID0gWzAsIDEsIDJdLm1hcChqID0+IE51bWJlcih0aGlzLnBvc2l0aW9uW2pdKSkgYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgY29uc3QgYnk6IG51bWJlcltdID0gWzAsIDBdXG4gICAgOyhbJ1gnLCAnWSddIGFzIEF4aXNbXSkuZm9yRWFjaCgoYXhpcywgaSkgPT4ge1xuICAgICAgY29uc3QgZCA9IGF4aXMgPT09ICdYJyA/IGR4IDogZHlcbiAgICAgIGNvbnN0IHNpZ25lZCA9IHRoaXMuaW52ZXJ0ZWQoYXhpcykgPyAtZCA6IGRcbiAgICAgIGNvbnN0IHRhcmdldCA9IGNsYW1wVG8odGhpcy5wb3NpdGlvbltpXSArIHNpZ25lZCwgdGhpcy5heGlzTWluW2ldLCB0aGlzLmF4aXNNYXhbaV0pXG4gICAgICBieVtpXSA9IE1hdGgucm91bmQoKHRhcmdldCAtIHRoaXMucG9zaXRpb25baV0pICogMTAwMCkgLyAxMDAwXG4gICAgICByZWFsVG9baV0gPSB0YXJnZXRcbiAgICB9KVxuICAgIGlmICghYnlbMF0gJiYgIWJ5WzFdKSByZXR1cm4gZmFsc2VcbiAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFuSGFuZE1vdmUocmVhbFRvKVxuICAgIGlmICghcGxhbi5vaykgeyB0aGlzLnJlZnVzZU1vdmUocGxhbi5yZWFzb24pOyByZXR1cm4gZmFsc2UgfVxuICAgIGlmIChwbGFuLmxpZnRlZCkgdGhpcy5zZW5kUGxhbm5lZE1vdmVzKHBsYW4uc3RlcHMpXG4gICAgZWxzZSB0aGlzLnNlbmRNb3ZlR2NvZGUoWydYJywgJ1knXS5maWx0ZXIoKF8sIGkpID0+IGJ5W2ldKS5tYXAoYSA9PiBgJHthfSR7YnlbJ1hZJy5pbmRleE9mKGEpXX1gKS5qb2luKCcgJyksIHRoaXMueHlTcGVlZClcbiAgICB0aGlzLm1hcmtIYW5kTW92ZShyZWFsVG8pXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBXaHkgYSBtb3ZlIHRvIGEgcGxhY2UgaW4gRy1jb2RlIGNvb3JkaW5hdGVzIHdvdWxkIGJlIHJlZnVzZWQgbm93LCBvciAnJ1xuICAgKiB3aGVuIG1vdmVUbyB3b3VsZCBzZW5kIGl0OiB0aGUgc2FtZSBnYXRlcyBhbmQgdGhlIHNhbWUgcGxhbiBhcyBtb3ZlVG8sXG4gICAqIGluIHdvcmRzLCBub3QgY291bnRpbmcgdGhlIGhhbmQtbW92ZSB3YWl0LiBBIGxpdmUgZHJhZyBzdG9wcyBvbiBpdC5cbiAgICovXG4gIG1vdmVSZWZ1c2FsIChwbGFjZTogeyBYPzogbnVtYmVyLCBZPzogbnVtYmVyLCBaPzogbnVtYmVyIH0pOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVybiB0aGlzLmNvbnRyb2xMb2NrIHx8ICdOb3QgY29ubmVjdGVkIHRvIHRoZSBwcmludGVyJ1xuICAgIGlmICh0aGlzLnByaW50TG9ja2VkKSByZXR1cm4gJ05vdCB3aGlsZSBwcmludGluZzogbW92aW5nIHRoZSBoZWFkIHdvdWxkIHJ1aW4gdGhlIHByaW50LidcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm4gJ1dhaXQgZm9yIHRoZSBwcmludGVyIHRvIGZpbmlzaCB3aGF0IGl0IGlzIGRvaW5nLidcbiAgICBpZiAoIVt0aGlzLnh5U3BlZWQsIHRoaXMuelNwZWVkXS5ldmVyeSh2ID0+IE51bWJlci5pc0Zpbml0ZSh2KSAmJiB2ID4gMCkpIHJldHVybiAnU2V0IHRoZSBqb2cgc3BlZWRzIGluIFNldHRpbmdzIGZpcnN0LidcbiAgICBjb25zdCBheGVzID0gKFsnWCcsICdZJywgJ1onXSBhcyBBeGlzW10pLmZpbHRlcihhID0+IHBsYWNlW2FdICE9PSB1bmRlZmluZWQpXG4gICAgaWYgKCFheGVzLmxlbmd0aCkgcmV0dXJuICdOb3RoaW5nIHRvIG1vdmUuJ1xuICAgIGZvciAoY29uc3QgYXhpcyBvZiBheGVzKSB7XG4gICAgICBjb25zdCBpID0gJ1hZWicuaW5kZXhPZihheGlzKVxuICAgICAgY29uc3QgdmFsdWUgPSBwbGFjZVtheGlzXSBhcyBudW1iZXJcbiAgICAgIGlmICghdGhpcy5pc0hvbWVkKGF4aXMpKSByZXR1cm4gYEhvbWUgJHtheGlzfSBmaXJzdC5gXG4gICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgfHwgdmFsdWUgPCB0aGlzLmF4aXNNaW5baV0gfHwgdmFsdWUgPiB0aGlzLmF4aXNNYXhbaV0pIHJldHVybiAnVGhhdCBzcG90IGlzIG91dHNpZGUgdGhlIG1hY2hpbmUuJ1xuICAgIH1cbiAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmdjb2RlT2Zmc2V0ID8/IFswLCAwLCAwXVxuICAgIGNvbnN0IHJlYWxUbyA9IChbJ1gnLCAnWScsICdaJ10gYXMgQXhpc1tdKS5tYXAoKGEsIGkpID0+IHBsYWNlW2FdICE9PSB1bmRlZmluZWQgPyAocGxhY2VbYV0gYXMgbnVtYmVyKSArIG9mZnNldFtpXSA6IE51bWJlcih0aGlzLnBvc2l0aW9uW2ldKSkgYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgY29uc3QgcGxhbiA9IHRoaXMucGxhbkhhbmRNb3ZlKHJlYWxUbylcbiAgICByZXR1cm4gcGxhbi5vayA/ICcnIDogcGxhbi5yZWFzb25cbiAgfVxuXG4gIC8qKiBUbyBhIHBsYWNlIGdpdmVuIGluIEctY29kZSBjb29yZGluYXRlcywgaW5zaWRlIHRoZSBtYWNoaW5lIGFuZCBvdXQgb2YgdGhlIGJlZCdzIG5vLWdvIHJlZ2lvbnMuIFRydWUgd2hlbiBpdCB3YXMgc2VudC4gKi9cbiAgbW92ZVRvIChwbGFjZTogeyBYPzogbnVtYmVyLCBZPzogbnVtYmVyLCBaPzogbnVtYmVyIH0pOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuYnVzeSB8fCAhW3RoaXMueHlTcGVlZCwgdGhpcy56U3BlZWRdLmV2ZXJ5KHYgPT4gTnVtYmVyLmlzRmluaXRlKHYpICYmIHYgPiAwKSkgcmV0dXJuIGZhbHNlXG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW11cbiAgICBsZXQgcmF0ZSA9IHRoaXMueHlTcGVlZFxuICAgIGZvciAoY29uc3QgYXhpcyBvZiBbJ1gnLCAnWScsICdaJ10gYXMgQXhpc1tdKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHBsYWNlW2F4aXNdXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgY29udGludWVcbiAgICAgIGNvbnN0IGkgPSAnWFlaJy5pbmRleE9mKGF4aXMpXG4gICAgICBpZiAoIXRoaXMuaXNIb21lZChheGlzKSB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCB2YWx1ZSA8IHRoaXMuYXhpc01pbltpXSB8fCB2YWx1ZSA+IHRoaXMuYXhpc01heFtpXSkgcmV0dXJuIGZhbHNlXG4gICAgICBwYXJ0cy5wdXNoKGAke2F4aXN9JHt2YWx1ZX1gKVxuICAgICAgaWYgKGF4aXMgPT09ICdaJykgcmF0ZSA9IE1hdGgubWluKHJhdGUsIHRoaXMuelNwZWVkKVxuICAgIH1cbiAgICBpZiAoIXBhcnRzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgY29uc3Qgd2FpdCA9IHRoaXMuaGFuZE1vdmVXYWl0KClcbiAgICBpZiAod2FpdCkgeyB0aGlzLnJlZnVzZU1vdmUod2FpdCk7IHJldHVybiBmYWxzZSB9XG4gICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5nY29kZU9mZnNldCA/PyBbMCwgMCwgMF1cbiAgICBjb25zdCByZWFsVG8gPSAoWydYJywgJ1knLCAnWiddIGFzIEF4aXNbXSkubWFwKChhLCBpKSA9PiBwbGFjZVthXSAhPT0gdW5kZWZpbmVkID8gKHBsYWNlW2FdIGFzIG51bWJlcikgKyBvZmZzZXRbaV0gOiBOdW1iZXIodGhpcy5wb3NpdGlvbltpXSkpIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVxuICAgIGNvbnN0IHBsYW4gPSB0aGlzLnBsYW5IYW5kTW92ZShyZWFsVG8pXG4gICAgaWYgKCFwbGFuLm9rKSB7IHRoaXMucmVmdXNlTW92ZShwbGFuLnJlYXNvbik7IHJldHVybiBmYWxzZSB9XG4gICAgaWYgKHBsYW4ubGlmdGVkKSB0aGlzLnNlbmRQbGFubmVkTW92ZXMocGxhbi5zdGVwcylcbiAgICBlbHNlIHRoaXMuc2VuZE1vdmVHY29kZShwYXJ0cy5qb2luKCcgJyksIHJhdGUsIHRydWUpXG4gICAgdGhpcy5tYXJrSGFuZE1vdmUocmVhbFRvKVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBob21lV2FpdCAoYXhlcyA9ICcnKTogc3RyaW5nIHtcbiAgICBpZiAoYXhlcyA9PT0gJ1hZJykgcmV0dXJuIHRoaXMuJHdhaXRzLm9uSG9tZVhZXG4gICAgaWYgKGF4ZXMgPT09ICdaJykgcmV0dXJuIHRoaXMuJHdhaXRzLm9uSG9tZVpcbiAgICByZXR1cm4gdGhpcy4kd2FpdHMub25Ib21lQWxsXG4gIH1cblxuICBob21lIChheGVzID0gJycpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuYnVzeSkgcmV0dXJuXG4gICAgdGhpcy5zZW5kR2NvZGUoYXhlcyA/IGBHMjggJHtheGVzLnNwbGl0KCcnKS5qb2luKCcgJyl9YCA6ICdHMjgnLCB0aGlzLmhvbWVXYWl0KGF4ZXMpKVxuICB9XG5cbiAgaG9taW5nIChheGVzID0gJycpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXNXYWl0KHRoaXMuaG9tZVdhaXQoYXhlcykpXG4gIH1cblxuICBtb3RvcnNPZmYgKCkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgdGhpcy5idXN5KSByZXR1cm5cbiAgICB0aGlzLnNlbmRHY29kZSgnTTg0JylcbiAgfVxuXG4gIC8vIC0tIHNwZWVkIGFuZCB0dW5pbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0IGdjb2RlTW92ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5nY29kZV9tb3ZlID8/IHt9XG4gIH1cblxuICBnZXQgc3BlZWRGYWN0b3IgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKCh0aGlzLmdjb2RlTW92ZS5zcGVlZF9mYWN0b3IgYXMgbnVtYmVyIHwgdW5kZWZpbmVkKSA/PyAxKSAqIDEwMClcbiAgfVxuXG4gIGdldCBmbG93RmFjdG9yICgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCgodGhpcy5nY29kZU1vdmUuZXh0cnVkZV9mYWN0b3IgYXMgbnVtYmVyIHwgdW5kZWZpbmVkKSA/PyAxKSAqIDEwMClcbiAgfVxuXG4gIHNldFNwZWVkIChwZXJjZW50OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8ICFOdW1iZXIuaXNGaW5pdGUocGVyY2VudCkgfHwgcGVyY2VudCA8IDEgfHwgcGVyY2VudCA+IDUwMCkgcmV0dXJuXG4gICAgdGhpcy5zZW5kR2NvZGUoYE0yMjAgUyR7TWF0aC5yb3VuZChwZXJjZW50KX1gKVxuICB9XG5cbiAgLyoqIFRoZSBtb3ZlcyBvZiB0aGUgZmlsZSBiZWluZyBwcmludGVkLCB3aGVuIHRoZSBHLWNvZGUgcHJldmlldyBob2xkcyBpdC4gKi9cbiAgZ2V0IHByaW50TW92ZXMgKCk6IHJlYWRvbmx5IE1vdmVbXSB8IG51bGwge1xuICAgIGNvbnN0IHByaW50aW5nID0gKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wcmludF9zdGF0cz8uZmlsZW5hbWUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnJ1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydnY29kZVByZXZpZXcvZ2V0RmlsZSddIGFzIHsgZmlsZW5hbWU6IHN0cmluZywgcGF0aD86IHN0cmluZyB9IHwgdW5kZWZpbmVkXG4gICAgaWYgKCFwcmludGluZyB8fCAhZmlsZSB8fCB0aGlzLiRzdG9yZS5zdGF0ZS5nY29kZVByZXZpZXcucGFyc2VyV29ya2VyKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IHBhdGggPSBmaWxlLnBhdGggPyBgJHtmaWxlLnBhdGh9LyR7ZmlsZS5maWxlbmFtZX1gIDogZmlsZS5maWxlbmFtZVxuICAgIHJldHVybiBwYXRoID09PSBwcmludGluZyA/IHRoaXMuJHN0b3JlLmdldHRlcnNbJ2djb2RlUHJldmlldy9nZXRNb3ZlcyddIGFzIE1vdmVbXSA6IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBTbG93LCBOb3JtYWwgYW5kIEZhc3QgZm9yIHRoZSBwcmludCBydW5uaW5nIChzZXJ2aWNlcy9jb250cm9sL3NwZWVkLnRzKTpcbiAgICogRmFzdCBpcyBhcyBtdWNoIGZhc3RlciBhcyB0aGUgbm96emxlIGNhbiBtZWx0IHRoaXMgZmlsYW1lbnQgZm9yIHRoaXNcbiAgICogcHJpbnQsIG9yIGEgcXVhcnRlciB3aGVuIHRoZSBwcmludCdzIGZsb3cgaXNuJ3Qga25vd24uXG4gICAqL1xuICBnZXQgc3BlZWRDaG9pY2VzICgpOiBTcGVlZENob2ljZVtdIHtcbiAgICBjb25zdCBtb3ZlcyA9IHRoaXMucHJpbnRNb3Zlc1xuICAgIGxldCBwZWFrOiBudW1iZXIgfCBudWxsID0gbnVsbFxuICAgIGlmIChtb3Zlcykge1xuICAgICAgaWYgKCFwZWFrRmxvd3MuaGFzKG1vdmVzKSkge1xuICAgICAgICBjb25zdCBkaWFtZXRlciA9IE51bWJlcih0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZT8uc2V0dGluZ3M/LmV4dHJ1ZGVyPy5maWxhbWVudF9kaWFtZXRlcikgfHwgMS43NVxuICAgICAgICBwZWFrRmxvd3Muc2V0KG1vdmVzLCBwZWFrRmxvdyhtb3ZlcywgZGlhbWV0ZXIpKVxuICAgICAgfVxuICAgICAgcGVhayA9IHBlYWtGbG93cy5nZXQobW92ZXMpID8/IG51bGxcbiAgICB9XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY3VycmVudF9maWxlIGFzIHsgZmlsYW1lbnRfdHlwZT86IHN0cmluZyB9IHwgdW5kZWZpbmVkXG4gICAgY29uc3QgbWF4RmxvdyA9ICh0aGlzLiRzdG9yZS5zdGF0ZS5nY29kZVByZXZpZXcubWF4RmxvdyBhcyBudW1iZXIgfCBudWxsKSA/P1xuICAgICAgbWF0ZXJpYWxNYXhGbG93KG1ldGFkYXRhPy5maWxhbWVudF90eXBlKSA/P1xuICAgICAgbWF0ZXJpYWxNYXhGbG93KHRoaXMubG9hZGVkTWF0ZXJpYWw/Lm5hbWUpXG4gICAgcmV0dXJuIHNwZWVkQ2hvaWNlcyhmYXN0UGVyY2VudChwZWFrLCBtYXhGbG93KSwgcGVhayAhPT0gbnVsbCAmJiBtYXhGbG93ICE9PSBudWxsKVxuICB9XG5cbiAgLyoqIFwiU2xvd1wiLCBcIk5vcm1hbFwiLCBcIkZhc3RcIiwgb3IgXCIxMTAlXCIgZm9yIGFueXRoaW5nIGVsc2UuICovXG4gIGdldCBzcGVlZExhYmVsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNwZWVkQ2hvaWNlcy5maW5kKGMgPT4gYy5wZXJjZW50ID09PSB0aGlzLnNwZWVkRmFjdG9yKT8ubGFiZWwgPz8gYCR7dGhpcy5zcGVlZEZhY3Rvcn0lYFxuICB9XG5cbiAgc2V0RmxvdyAocGVyY2VudDogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSB8fCAhTnVtYmVyLmlzRmluaXRlKHBlcmNlbnQpIHx8IHBlcmNlbnQgPCAxIHx8IHBlcmNlbnQgPiAzMDApIHJldHVyblxuICAgIHRoaXMuc2VuZEdjb2RlKGBNMjIxIFMke01hdGgucm91bmQocGVyY2VudCl9YClcbiAgfVxuXG4gIGdldCBwcmVzc3VyZUFkdmFuY2UgKCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmFjdGl2ZUV4dHJ1ZGVyPy5wcmVzc3VyZV9hZHZhbmNlID8/IG51bGxcbiAgfVxuXG4gIHNldFByZXNzdXJlQWR2YW5jZSAodmFsdWU6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgfHwgdmFsdWUgPCAwIHx8IHZhbHVlID4gMikgcmV0dXJuXG4gICAgdGhpcy5zZW5kR2NvZGUoYFNFVF9QUkVTU1VSRV9BRFZBTkNFIEFEVkFOQ0U9JHt2YWx1ZX1gKVxuICB9XG5cbiAgLyoqIENvbmZpZ3VyZWQgY2VpbGluZy4gTGl2ZSBzdGF0dXMgaXMgYSBjdXJyZW50IHZhbHVlLCBuZXZlciBhdXRob3JpdHkgZm9yIGEgbmV3IGxpbWl0LiAqL1xuICBsaW1pdE1heGltdW0gKGtleTogTGltaXRLZXkpOiBudW1iZXIgfCBudWxsIHtcbiAgICBjb25zdCBzZXR0aW5nID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGU/LnNldHRpbmdzPy5wcmludGVyPy5bbGltaXRTZXR0aW5nW2tleV1dXG4gICAgY29uc3QgcGFyc2VkID0gdHlwZW9mIHNldHRpbmcgPT09ICdudW1iZXInIHx8ICh0eXBlb2Ygc2V0dGluZyA9PT0gJ3N0cmluZycgJiYgc2V0dGluZy50cmltKCkgIT09ICcnKVxuICAgICAgPyBOdW1iZXIoc2V0dGluZylcbiAgICAgIDogTnVtYmVyLk5hTlxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgfHwgcGFyc2VkIDw9IDApIHJldHVybiBudWxsXG4gICAgcmV0dXJuIGtleSA9PT0gJ01JTklNVU1fQ1JVSVNFX1JBVElPJyA/IE1hdGgubWluKHBhcnNlZCwgMSkgOiBwYXJzZWRcbiAgfVxuXG4gIC8qKiBWZWxvY2l0eSwgYWNjZWxlcmF0aW9uLCBzcXVhcmUgY29ybmVyIHZlbG9jaXR5IGFuZCB0aGUgY3J1aXNlIHJhdGlvLCB1bnRpbCBhIHJlc3RhcnQuICovXG4gIHNldExpbWl0IChrZXk6IExpbWl0S2V5LCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgY29uc3QgbWF4aW11bSA9IHRoaXMubGltaXRNYXhpbXVtKGtleSlcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IG1heGltdW0gPT09IG51bGwgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgfHwgdmFsdWUgPCAwIHx8IHZhbHVlID4gbWF4aW11bSB8fCAoWydWRUxPQ0lUWScsICdBQ0NFTCddLmluY2x1ZGVzKGtleSkgJiYgdmFsdWUgPD0gMCkpIHJldHVyblxuICAgIHRoaXMuc2VuZEdjb2RlKGBTRVRfVkVMT0NJVFlfTElNSVQgJHtrZXl9PSR7dmFsdWV9YClcbiAgfVxuXG4gIC8vIC0tIGZhbnMgYW5kIGxpZ2h0cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0IGZhbnMgKCk6IEZhbltdIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0QWxsRmFucyddIGFzIEZhbltdKSA/PyBbXVxuICB9XG5cbiAgZ2V0IHBhcnRGYW4gKCk6IEZhbiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmZhbnMuZmluZChmID0+IGYudHlwZSA9PT0gJ2ZhbicpID8/IG51bGxcbiAgfVxuXG4gIGZhblZhbHVlIChmYW46IEZhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIGZhblBlcmNlbnQoZmFuKVxuICB9XG5cbiAgc2V0RmFuIChmYW46IEZhbiwgcGVyY2VudDogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSB8fCAhTnVtYmVyLmlzRmluaXRlKHBlcmNlbnQpIHx8IHBlcmNlbnQgPCAwIHx8IHBlcmNlbnQgPiAxMDApIHJldHVyblxuICAgIGNvbnN0IGdjb2RlID0gZmFuQ29tbWFuZChmYW4sIHBlcmNlbnQpXG4gICAgaWYgKGdjb2RlKSB0aGlzLnNlbmRHY29kZShnY29kZSlcbiAgfVxuXG4gIGdldCBsaWdodHNQaW4gKCk6IE91dHB1dFBpbiB8IG51bGwge1xuICAgIHJldHVybiBsaWdodHNPdXRwdXQoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UGlucyddIGFzIE91dHB1dFBpbltdKSA/PyBbXSlcbiAgfVxuXG4gIGdldCBsaWdodHNMZWQgKCk6IExlZCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmxpZ2h0c1BpbiA/IG51bGwgOiBsaWdodHNPdXRwdXQoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0QWxsTGVkcyddIGFzIExlZFtdKSA/PyBbXSlcbiAgfVxuXG4gIGdldCBoYXNMaWdodHMgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMubGlnaHRzUGluIHx8ICEhdGhpcy5saWdodHNMZWRcbiAgfVxuXG4gIC8qKiBUaGUgbGlnaHRzLCAwIHRvIDEwMC4gKi9cbiAgZ2V0IGxpZ2h0c1ZhbHVlICgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLmxpZ2h0c1BpbikgcmV0dXJuIHBpblBlcmNlbnQodGhpcy5saWdodHNQaW4udmFsdWUpXG4gICAgY29uc3QgZGF0YSA9IHRoaXMubGlnaHRzTGVkPy5jb2xvcl9kYXRhPy5bMF0gPz8gW11cbiAgICByZXR1cm4gTWF0aC5yb3VuZChNYXRoLm1heCgwLCAuLi5kYXRhKSAqIDEwMClcbiAgfVxuXG4gIHNldExpZ2h0cyAodmFsdWU6IG51bWJlciB8IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8ICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICghTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCB2YWx1ZSA8IDAgfHwgdmFsdWUgPiAxMDApKSkgcmV0dXJuXG4gICAgY29uc3QgcGVyY2VudCA9IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gKHZhbHVlID8gMTAwIDogMCkgOiB2YWx1ZVxuICAgIGlmICh0aGlzLmxpZ2h0c1Bpbikge1xuICAgICAgdGhpcy5zZW5kR2NvZGUocGluQ29tbWFuZCh0aGlzLmxpZ2h0c1BpbiwgdGhpcy5saWdodHNQaW4ucHdtID8gcGVyY2VudCA6IHBlcmNlbnQgPiAwKSlcbiAgICB9IGVsc2UgaWYgKHRoaXMubGlnaHRzTGVkKSB7XG4gICAgICBjb25zdCB2ID0gTWF0aC5yb3VuZChwZXJjZW50KSAvIDEwMFxuICAgICAgdGhpcy5zZW5kR2NvZGUoYFNFVF9MRUQgTEVEPSR7dGhpcy5saWdodHNMZWQubmFtZX0gUkVEPSR7dn0gR1JFRU49JHt2fSBCTFVFPSR7dn0gV0hJVEU9JHt2fWApXG4gICAgfVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLFdBQVcsUUFBUSxhQUFhO0FBQ3pDLE9BQU8sd0JBQXdCO0FBQy9CLFNBQVMsa0JBQWtCO0FBQzNCLE9BQU8sbUJBQW1CO0FBRzFCO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsT0FFSztBQUNQLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsY0FBYyxrQkFBa0IsWUFBWSxjQUFjLGVBQWUsaUJBQWlCLGlCQUFpQixpQkFBaUIsVUFBVSxVQUFVLGdCQUE0RDtBQUNyTixPQUFPLFNBQVM7QUFDaEIsU0FBUyxnQkFBZ0I7QUFFekIsU0FBUyxhQUFhLGlCQUFpQixVQUFVLG9CQUFzQztBQU92RixNQUFNLGNBQWMsSUFBSSxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDL0MsSUFBSSxjQUFvRDtBQUd4RCxNQUFNLFlBQVksb0JBQUksUUFBd0M7QUFLOUQsTUFBTSxlQUF5QztBQUFBLEVBQzdDLFVBQVU7QUFBQSxFQUNWLE9BQU87QUFBQSxFQUNQLHdCQUF3QjtBQUFBLEVBQ3hCLHNCQUFzQjtBQUFBLEVBQ3RCLGdCQUFnQjtBQUNsQjtBQUdPLGFBQU0sZUFBZTtBQUNyQixhQUFNLFlBQVk7QUFRekIsSUFBcUIsZUFBckIsY0FBMEMsT0FBTyxvQkFBb0IsYUFBYSxFQUFFO0FBQUEsRUFDbEYsSUFBSSxlQUF5QjtBQUMzQixXQUFPLEtBQUssMkJBQTJCLEtBQUssZUFBZSxLQUFLO0FBQUEsRUFDbEU7QUFBQSxFQUVBLFFBQVMsSUFBWTtBQUNuQixRQUFJLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxLQUFLLFFBQVEsR0FBRyxLQUFLLEtBQUssUUFBUSxLQUFLLE9BQU8sU0FBUyxFQUFHO0FBR3JGLFFBQUksQ0FBQyxLQUFLLFFBQVEsS0FBSyxHQUFHO0FBQ3hCLFlBQU0sT0FBTyxLQUFLLGFBQWE7QUFDL0IsVUFBSSxNQUFNO0FBQUUsYUFBSyxXQUFXLElBQUk7QUFBRztBQUFBLE1BQU87QUFBQSxJQUM1QztBQUNBLFVBQU0sVUFBVSxlQUFlLElBQUksSUFBSTtBQUN2QyxRQUFJLFFBQVMsTUFBSyxVQUFVLFNBQVMsS0FBSyxPQUFPLFNBQVM7QUFBQSxFQUM1RDtBQUFBLEVBRUEsSUFBSSxjQUF1QjtBQUN6QixXQUFPLEdBQUcsS0FBSyxhQUFhLElBQUksV0FBVyxTQUFTLE1BQU0sRUFBRTtBQUFBLEVBQzlEO0FBQUEsRUFFQSxJQUFJLGNBQXVCO0FBQ3pCLFFBQUksQ0FBQyxLQUFLLHdCQUF5QixRQUFPO0FBQzFDLFdBQU8sS0FBSyxlQUFlLEtBQUssS0FBSztBQUFBLEVBQ3ZDO0FBQUE7QUFBQTtBQUFBLEVBSUEsSUFBSSxpQkFBMEI7QUFDNUIsV0FBTyxLQUFLLGtCQUFrQix5QkFBeUI7QUFBQSxFQUN6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxjQUErQjtBQUNqQyxVQUFNLElBQUksS0FBSyxPQUFPLFFBQVEsc0JBQXNCO0FBQ3BELFdBQU8sTUFBTSxTQUFZLE9BQU87QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksY0FBd0I7QUFDMUIsVUFBTSxRQUFRLE9BQU8sS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLGFBQWEsU0FBUyxFQUFFLEVBQUUsWUFBWTtBQUM3RixXQUFPLFVBQVUsY0FBYyxVQUFVLFlBQVksS0FBSyxtQkFBbUIsS0FBSztBQUFBLEVBQ3BGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxrQkFBNEI7QUFFOUIsVUFBTSxPQUFPLFlBQVksU0FBUztBQUNsQyxVQUFNLFlBQVksS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLFlBQVk7QUFDaEUsV0FBTyxRQUFRLENBQUMsS0FBSyxlQUFlLEtBQUssaUJBQWlCLFVBQVUsZ0JBQWdCLEtBQUssYUFBYSxLQUFLLElBQUksR0FBRyxTQUFTO0FBQUEsRUFDN0g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLE9BQWlCO0FBQ25CLFdBQU8sS0FBSyxlQUFnQixLQUFLLGlCQUFpQixVQUFVLENBQUMsS0FBSztBQUFBLEVBQ3BFO0FBQUEsRUFJQSx5QkFBMEIsS0FBYSxRQUFnQjtBQUNyRCxRQUFJLFdBQVcsVUFBVSxRQUFRLFFBQVE7QUFDdkMsbUJBQWE7QUFDYixrQkFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLElBQUksaUJBQTBCO0FBQzVCLFFBQUksS0FBSyxZQUFhLFFBQU87QUFDN0IsUUFBSSxLQUFLLEtBQU0sUUFBTztBQUN0QixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsSUFBSSxXQUFZO0FBQ2QsV0FBTyxLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsWUFBWSxDQUFDO0FBQUEsRUFDeEQ7QUFBQSxFQUVBLElBQUksV0FBc0I7QUFDeEIsV0FBUSxLQUFLLFNBQVMsWUFBcUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQUEsRUFDeEU7QUFBQSxFQUVBLElBQUksVUFBcUI7QUFDdkIsV0FBUSxLQUFLLFNBQVMsZ0JBQXlDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUN6RTtBQUFBLEVBRUEsSUFBSSxVQUFxQjtBQUN2QixXQUFRLEtBQUssU0FBUyxnQkFBeUMsQ0FBQyxLQUFLLEtBQUssR0FBRztBQUFBLEVBQy9FO0FBQUEsRUFFQSxJQUFJLFlBQXFCO0FBQ3ZCLFlBQVMsS0FBSyxTQUFTLGNBQXFDLElBQUksWUFBWTtBQUFBLEVBQzlFO0FBQUEsRUFFQSxJQUFJLFVBQW1CO0FBQ3JCLFdBQU8sS0FBSyxPQUFPLE1BQU0sT0FBTyxXQUFXLFFBQVE7QUFBQSxFQUNyRDtBQUFBLEVBRUEsSUFBSSxTQUFrQjtBQUNwQixXQUFPLEtBQUssT0FBTyxNQUFNLE9BQU8sV0FBVyxRQUFRO0FBQUEsRUFDckQ7QUFBQTtBQUFBLEVBSUEsSUFBSSxVQUFxQjtBQUN2QixXQUFRLEtBQUssT0FBTyxRQUFRLG9CQUFvQixLQUFrQixDQUFDO0FBQUEsRUFDckU7QUFBQSxFQUVBLElBQUksU0FBeUI7QUFDM0IsV0FBTyxLQUFLLFFBQVEsS0FBSyxPQUFLLEVBQUUsU0FBUyxVQUFVLEtBQUs7QUFBQSxFQUMxRDtBQUFBLEVBRUEsSUFBSSxNQUFzQjtBQUN4QixXQUFPLEtBQUssUUFBUSxLQUFLLE9BQUssRUFBRSxTQUFTLFlBQVksS0FBSztBQUFBLEVBQzVEO0FBQUEsRUFFQSxJQUFJLFVBQTBCO0FBQzVCLFVBQU0sVUFBVyxLQUFLLE9BQU8sUUFBUSxvQkFBb0IsS0FBa0IsQ0FBQztBQUM1RSxXQUFPLFFBQVEsS0FBSyxPQUFLLFdBQVcsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO0FBQUEsRUFDdkQ7QUFBQSxFQUVBLElBQUksVUFBZ0M7QUFDbEMsV0FBUSxLQUFLLE9BQU8sUUFBUSx1QkFBdUIsS0FBNkIsQ0FBQztBQUFBLEVBQ25GO0FBQUEsRUFFQSxJQUFJLFlBQXlCO0FBQzNCLFdBQU8sY0FBYyxLQUFLLE9BQU87QUFBQSxFQUNuQztBQUFBLEVBRUEsSUFBSSxXQUE2QjtBQUMvQixXQUFPLGNBQWMsS0FBSyxXQUFXLEtBQUssUUFBUSxVQUFVLEdBQUcsS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUFBLEVBQ3RGO0FBQUEsRUFFQSxJQUFJLGtCQUFxQztBQUN2QyxXQUFPLGdCQUFnQixLQUFLLFNBQVM7QUFBQSxFQUN2QztBQUFBO0FBQUEsRUFHQSxJQUFJLGdCQUEwQjtBQUM1QixXQUFPLG9CQUFvQixLQUFLLE9BQU8sTUFBTSxRQUFRO0FBQUEsRUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGlCQUF5QztBQUMzQyxVQUFNLE9BQU8sS0FBSyxnQkFDZCxrQkFBa0IsS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLGdCQUFnQixTQUFTLElBQzVFLEtBQUssT0FBTyxNQUFNLE9BQU8sV0FBVyxRQUFRO0FBQ2pELFVBQU0sU0FBUyxhQUFhLEtBQUssaUJBQWlCLElBQUk7QUFDdEQsVUFBTSxTQUFTLEtBQUs7QUFDcEIsV0FBTyxVQUFVLFNBQVMsRUFBRSxHQUFHLFFBQVEsT0FBTyxJQUFJO0FBQUEsRUFDcEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGlCQUFrQztBQUNwQyxXQUFPLGVBQWUsS0FBSyxPQUFPLE1BQU0sUUFBUSxPQUFPO0FBQUEsRUFDekQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLElBQUksaUJBQWtDO0FBQ3BDLFVBQU0sT0FBTyxLQUFLLGdCQUFnQixRQUFRO0FBQzFDLFVBQU0sU0FBUyxLQUFLO0FBQ3BCLFdBQU8sRUFBRSxRQUFRLFVBQVUsQ0FBQyxDQUFDLE1BQU0sS0FBSztBQUFBLEVBQzFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxlQUFnRTtBQUNsRSxRQUFJLEtBQUssa0JBQWtCLEVBQUUsS0FBSyxtQkFBbUIsS0FBSyxlQUFnQixRQUFPO0FBQ2pGLFdBQU8sYUFBYSxLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsWUFBWTtBQUFBLEVBQ3BFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLGVBQStCO0FBQ2pDLFdBQU8sS0FBSyxnQkFDUixvQkFBb0IsS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLGdCQUFnQixTQUFTLElBQy9FLGdCQUFnQixLQUFLLE9BQU8sTUFBTSxPQUFPLFdBQVcsUUFBUSxvQkFBb0I7QUFBQSxFQUN0RjtBQUFBLEVBRUEsa0JBQW1CLFFBQXdCO0FBQ3pDLFFBQUksS0FBSyxlQUFlO0FBQ3RCLFdBQUssVUFBVSxvQkFBb0IsT0FBTyxJQUFJLENBQUM7QUFBQSxJQUNqRCxPQUFPO0FBQ0wsV0FBSyxPQUFPLFNBQVMscUJBQXFCLEVBQUUsTUFBTSxxQ0FBcUMsT0FBTyxPQUFPLE1BQU0sUUFBUSxLQUFLLENBQUM7QUFBQSxJQUMzSDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLGdCQUFpQixRQUFnQjtBQUMvQixVQUFNLE1BQU0sZ0JBQWdCLE1BQU07QUFDbEMsUUFBSSxDQUFDLElBQUs7QUFDVixRQUFJLEtBQUssZUFBZTtBQUN0QixXQUFLLFVBQVUsMEJBQTBCLEdBQUcsQ0FBQztBQUFBLElBQy9DLE9BQU87QUFDTCxXQUFLLE9BQU8sU0FBUyxxQkFBcUIsRUFBRSxNQUFNLDJDQUEyQyxPQUFPLEtBQUssUUFBUSxLQUFLLENBQUM7QUFBQSxJQUN6SDtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsSUFBSSxrQkFBa0M7QUFDcEMsVUFBTSxNQUFNLE9BQU8sS0FBSyxPQUFPLE1BQU0sU0FBUyxTQUFTLFlBQVksVUFBVSxVQUFVLFFBQVE7QUFDL0YsV0FBTyxPQUFPLFNBQVMsR0FBRyxLQUFLLE1BQU0sSUFBSSxNQUFNO0FBQUEsRUFDakQ7QUFBQTtBQUFBLEVBR0EsYUFBYyxNQUEwQixRQUE0QztBQUNsRixVQUFNLFNBQVMsa0JBQWtCLE1BQU0sUUFBUSxLQUFLLGVBQWU7QUFDbkUsUUFBSSxDQUFDLE9BQVEsUUFBTztBQUNwQixhQUFTLE1BQU0sUUFBUSxFQUFFLE1BQU0sU0FBUyxTQUFTLElBQUssQ0FBQztBQUN2RCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUEsRUFHQSxRQUFTLFFBQXdCO0FBQy9CLFFBQUksQ0FBQyxLQUFLLGFBQWM7QUFDeEIsUUFBSSxLQUFLLGFBQWEsT0FBTyxNQUFNLE9BQU8sTUFBTSxFQUFHO0FBQ25ELFVBQU0sU0FBUyxPQUFPLGFBQWEsT0FBTyxTQUFZLEtBQUssUUFBUSxLQUFLLE9BQUssRUFBRSxPQUFPLE9BQU8sUUFBUTtBQUNyRyxRQUFJLFFBQVE7QUFDVixxQkFBZSxNQUFNLEVBQUUsUUFBUSxPQUFLLEtBQUssVUFBVSxDQUFDLENBQUM7QUFDckQ7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPLFdBQVcsS0FBTSxNQUFLLFVBQVUsS0FBSyxRQUFRLE9BQU8sTUFBTTtBQUNyRSxRQUFJLE9BQU8sUUFBUSxLQUFNLE1BQUssVUFBVSxLQUFLLEtBQUssT0FBTyxHQUFHO0FBQUEsRUFDOUQ7QUFBQSxFQUVBLFVBQVcsUUFBdUIsUUFBZ0I7QUFDaEQsVUFBTSxVQUFVLEtBQUssUUFBUSxLQUFLLE9BQUssRUFBRSxTQUFTLFFBQVEsSUFBSTtBQUM5RCxRQUFJLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxTQUFTLE1BQU0sS0FBSyxTQUFTLEtBQUssVUFBVSxRQUFRLFdBQVcsS0FBTTtBQUNuSCxTQUFLLFVBQVUsaUNBQWlDLFFBQVEsSUFBSSxXQUFXLEtBQUssTUFBTSxNQUFNLENBQUMsRUFBRTtBQUFBLEVBQzdGO0FBQUEsRUFFQSxjQUFlLFVBQW9CO0FBQ2pDLFFBQUksQ0FBQyxLQUFLLGFBQWM7QUFDeEIsUUFBSSxLQUFLLGFBQWEsU0FBUyxNQUFNLFNBQVMsTUFBTSxFQUFHO0FBQ3ZELFVBQU0sU0FBUyxLQUFLLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxTQUFTLEVBQUU7QUFDMUQsUUFBSSxPQUFRLGdCQUFlLE1BQU0sRUFBRSxRQUFRLE9BQUssS0FBSyxVQUFVLENBQUMsQ0FBQztBQUFBLEVBQ25FO0FBQUEsRUFFQSxNQUFNLFdBQVk7QUFDaEIsUUFBSSxDQUFDLEtBQUssYUFBYztBQUN4QixVQUFNLFNBQVMsS0FBSztBQUNwQixRQUFJLEtBQUssTUFBTTtBQUNiLFlBQU0sS0FBSyxNQUFNLEtBQUssU0FBUywwRkFBMEY7QUFBQSxRQUN2SCxPQUFPO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxRQUNoQixpQkFBaUI7QUFBQSxRQUNqQixRQUFRO0FBQUEsTUFDVixDQUFDO0FBQ0QsVUFBSSxDQUFDLEdBQUk7QUFBQSxJQUNYO0FBQ0EsUUFBSSxLQUFLLGdCQUFnQixXQUFXLEtBQUssWUFBYSxNQUFLLFVBQVUsa0JBQWtCO0FBQUEsRUFDekY7QUFBQTtBQUFBLEVBSUEsUUFBUyxNQUF1QjtBQUM5QixXQUFPLEtBQUssWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLE1BQU0sT0FBSyxLQUFLLFVBQVUsU0FBUyxDQUFDLENBQUM7QUFBQSxFQUMzRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFNBQVUsTUFBcUI7QUFDN0IsUUFBSSxLQUFLLFlBQVksTUFBTSxPQUFPLEtBQUssT0FBTyxRQUFRLHNCQUFzQixNQUFNLE1BQU8sUUFBTztBQUNoRyxXQUFPLENBQUMsQ0FBQyxLQUFLLE9BQU8sTUFBTSxPQUFPLFdBQVcsUUFBUSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUc7QUFBQSxFQUNuRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksT0FBdUM7QUFDekMsVUFBTSxXQUFXLEtBQUssT0FBTyxNQUFNLFFBQVEsUUFBUSxZQUFZO0FBQy9ELFFBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxLQUFLLFFBQVEsRUFBRSxPQUFRLFFBQU87QUFDdkQsV0FBTyxTQUFTLFNBQVMsUUFBUTtBQUFBLEVBQ25DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLGNBQWdEO0FBQ2xELFVBQU0sUUFBUSxLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsWUFBWTtBQUM1RCxRQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssRUFBRyxRQUFPO0FBQ2xDLFVBQU0sSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsSUFBSSxPQUFLLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxJQUFJLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN4RSxXQUFPLEVBQUUsTUFBTSxPQUFPLFFBQVEsSUFBSSxJQUFnQztBQUFBLEVBQ3BFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWVBLGVBQXdCO0FBQ3RCLFFBQUksQ0FBQyxXQUFXLE1BQU8sUUFBTztBQUM5QixRQUFJLGdCQUFnQixRQUFRLEVBQUcsUUFBTztBQUN0QyxRQUFJLGlCQUFpQixLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsWUFBWSxnQkFBZ0IsS0FBSyxXQUFXLEVBQUcsUUFBTztBQUM3RyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBSUEsMEJBQTJCLE9BQWdCO0FBQ3pDLFFBQUksQ0FBQyxPQUFPO0FBQ1Ysc0JBQWdCO0FBSWhCLFVBQUksQ0FBQyxLQUFLLGVBQWUsQ0FBQyxLQUFLLGdCQUFpQixZQUFXLFFBQVE7QUFBQSxJQUNyRTtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsYUFBYyxRQUE0QztBQUN4RCxVQUFNLE9BQU8sS0FBSztBQUNsQixVQUFNLFNBQVMsRUFBRSxLQUFLLEtBQUssUUFBUSxNQUFNLEdBQUcsQ0FBQyxHQUErQixLQUFLLEtBQUssUUFBUSxNQUFNLEdBQUcsQ0FBQyxFQUE4QjtBQUN0SSxVQUFNLE9BQU8sRUFBRSxHQUFHLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxHQUFHLEdBQUcsT0FBTyxLQUFLLFNBQVMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsRUFBRTtBQUNyRyxVQUFNLEtBQUssRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsRUFBRTtBQUN0RCxRQUFJLFNBQVMsS0FBTSxRQUFPLFNBQVMsTUFBTSxJQUFJLE1BQU0sTUFBTTtBQUN6RCxVQUFNLFNBQVMsS0FBSztBQUNwQixRQUFJLENBQUMsT0FBUSxRQUFPLEVBQUUsSUFBSSxPQUFPLFFBQVEsa0NBQWtDO0FBQzNFLFVBQU0sT0FBTyxTQUFTLE1BQU0sSUFBSSxNQUFNLFFBQVEsU0FBUyxLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsUUFBUSxHQUFHLEtBQUssUUFBUSxHQUFHLEdBQUcsS0FBSyxRQUFRLElBQUksQ0FBQztBQUN6SSxRQUFJLENBQUMsS0FBSyxHQUFJLFFBQU87QUFDckIsVUFBTSxVQUFVLENBQUMsTUFBb0I7QUFDbkMsWUFBTSxNQUFhLENBQUM7QUFDbkIsTUFBQyxDQUFDLEtBQUssS0FBSyxHQUFHLEVBQWEsUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUFFLFlBQUksRUFBRSxDQUFDLE1BQU0sT0FBVyxLQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDLElBQWMsT0FBTyxDQUFDLEtBQUssR0FBSSxJQUFJO0FBQUEsTUFBSyxDQUFDO0FBQzFJLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTyxFQUFFLEdBQUcsTUFBTSxPQUFPLEtBQUssTUFBTSxJQUFJLE9BQU8sRUFBRTtBQUFBLEVBQ25EO0FBQUEsRUFFQSxXQUFZLFFBQWdCO0FBQzFCLGFBQVMsTUFBTSxRQUFRLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFBQSxFQUM1QztBQUFBO0FBQUEsRUFHQSxhQUFjLFFBQWtCO0FBQzlCLFVBQU0sU0FBUyxLQUFLO0FBQ3BCLFFBQUksQ0FBQyxPQUFRO0FBQ2IsVUFBTSxNQUFNLEtBQUssSUFBSTtBQUNyQixVQUFNLFNBQVMsS0FBSyxTQUFTLE1BQU07QUFDbkMsVUFBTSxTQUFTLE9BQU8sTUFBTSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUksSUFBSSxHQUFJO0FBQ3pGLGlCQUFhLFFBQVEsS0FBSyxhQUFhLEtBQUssTUFBTTtBQUdsRCxVQUFNLE9BQVEsS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLFlBQVksZ0JBQXlDLE1BQU0sR0FBRyxDQUFDO0FBQy9HLFVBQU0sS0FBSyxjQUFjLEtBQUssYUFBYSxLQUFLLFFBQVEsS0FBSyxpQkFBaUIsUUFBUSxRQUFRLElBQUk7QUFDbEcsZ0JBQVk7QUFDWixRQUFJLEtBQUssR0FBRztBQUNWLFVBQUksZ0JBQWdCLEtBQU0sY0FBYSxXQUFXO0FBQ2xELG9CQUFjLFdBQVcsTUFBTTtBQUFFLHNCQUFjO0FBQU0sb0JBQVk7QUFBQSxNQUFRLEdBQUcsS0FBSyxFQUFFO0FBQUEsSUFDckY7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsU0FBVSxRQUEwQjtBQUNsQyxVQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLElBQUksT0FBSyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztBQUNyRCxVQUFNLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ3hELFFBQUksSUFBSSxLQUFLLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDakMsVUFBTSxPQUFPLEtBQUs7QUFDbEIsUUFBSSxRQUFRLFNBQVMsV0FBVztBQUM5QixZQUFNLE9BQU8sS0FBSyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNoRSxVQUFJLEtBQUssTUFBTSxLQUFLLFFBQVE7QUFDMUIsY0FBTSxPQUFPLE9BQU8sS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxlQUFlLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO0FBQ3hFLFlBQUksS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksT0FBTyxPQUFPLENBQUMsQ0FBQztBQUFBLE1BQ3ZEO0FBQUEsSUFDRjtBQUNBLFVBQU0sTUFBTSxLQUFLLEtBQUssVUFBVSxJQUFJLEtBQUssVUFBVTtBQUNuRCxXQUFPLE9BQU8sU0FBUyxFQUFFLElBQUksS0FBSztBQUFBLEVBQ3BDO0FBQUE7QUFBQSxFQUdBLGlCQUFrQixPQUFnQjtBQUNoQyxVQUFNLE9BQU8sQ0FBQyxNQUFhO0FBQ3pCLFlBQU0sUUFBUyxDQUFDLEtBQUssS0FBSyxHQUFHLEVBQWEsT0FBTyxPQUFLLEVBQUUsQ0FBQyxNQUFNLE1BQVMsRUFBRSxJQUFJLE9BQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUNoRyxZQUFNLE9BQU8sRUFBRSxNQUFNLFNBQVksS0FBSyxTQUFTLEtBQUs7QUFDcEQsYUFBTyxNQUFNLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLEVBQUU7QUFBQSxJQUM1QztBQUNBLFNBQUssVUFBVSxDQUFDLHNDQUFzQyxPQUFPLEdBQUcsTUFBTSxJQUFJLElBQUksR0FBRyx1Q0FBdUMsRUFBRSxLQUFLLElBQUksQ0FBQztBQUFBLEVBQ3RJO0FBQUE7QUFBQSxFQUdBLE9BQVEsTUFBWSxVQUFrQjtBQUNwQyxRQUFJLENBQUMsS0FBSyxnQkFBZ0IsS0FBSyxRQUFRLENBQUMsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sU0FBUyxRQUFRLEVBQUc7QUFDMUYsUUFBSSxDQUFDLENBQUMsS0FBSyxTQUFTLEtBQUssTUFBTSxFQUFFLE1BQU0sT0FBSyxPQUFPLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFHO0FBQzFFLFVBQU0sT0FBTyxLQUFLLGFBQWE7QUFDL0IsUUFBSSxNQUFNO0FBQUUsV0FBSyxXQUFXLElBQUk7QUFBRztBQUFBLElBQU87QUFDMUMsVUFBTSxJQUFJLE1BQU0sUUFBUSxJQUFJO0FBQzVCLFVBQU0sU0FBUyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsV0FBVztBQUNqRCxVQUFNLFNBQVMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxJQUFJLFFBQVEsS0FBSyxRQUFRLENBQUMsR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQ2xGLFVBQU0sS0FBSyxLQUFLLE9BQU8sU0FBUyxLQUFLLFNBQVMsQ0FBQyxLQUFLLEdBQUksSUFBSTtBQUM1RCxRQUFJLENBQUMsR0FBSTtBQUNULFVBQU0sU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsSUFBSSxPQUFLLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzFELFdBQU8sQ0FBQyxJQUFJO0FBQ1osVUFBTSxPQUFPLEtBQUssYUFBYSxNQUFNO0FBQ3JDLFFBQUksQ0FBQyxLQUFLLElBQUk7QUFBRSxXQUFLLFdBQVcsS0FBSyxNQUFNO0FBQUc7QUFBQSxJQUFPO0FBQ3JELFFBQUksS0FBSyxPQUFRLE1BQUssaUJBQWlCLEtBQUssS0FBSztBQUFBLFFBQzVDLE1BQUssY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLElBQUksU0FBUyxNQUFNLEtBQUssU0FBUyxLQUFLLE9BQU87QUFDakYsU0FBSyxhQUFhLE1BQU07QUFBQSxFQUMxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFNBQVUsSUFBWSxJQUFxQjtBQUN6QyxRQUFJLENBQUMsS0FBSyxnQkFBZ0IsS0FBSyxRQUFRLENBQUMsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sU0FBUyxFQUFFLEtBQUssQ0FBQyxPQUFPLFNBQVMsRUFBRSxFQUFHLFFBQU87QUFDbkgsUUFBSSxDQUFDLENBQUMsS0FBSyxTQUFTLEtBQUssTUFBTSxFQUFFLE1BQU0sT0FBSyxPQUFPLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFHLFFBQU87QUFDakYsVUFBTSxPQUFPLEtBQUssYUFBYTtBQUMvQixRQUFJLE1BQU07QUFBRSxXQUFLLFdBQVcsSUFBSTtBQUFHLGFBQU87QUFBQSxJQUFNO0FBR2hELFVBQU0sU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsSUFBSSxPQUFLLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzFELFVBQU0sS0FBZSxDQUFDLEdBQUcsQ0FBQztBQUN6QixJQUFDLENBQUMsS0FBSyxHQUFHLEVBQWEsUUFBUSxDQUFDLE1BQU0sTUFBTTtBQUMzQyxZQUFNLElBQUksU0FBUyxNQUFNLEtBQUs7QUFDOUIsWUFBTSxTQUFTLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJO0FBQzFDLFlBQU0sU0FBUyxRQUFRLEtBQUssU0FBUyxDQUFDLElBQUksUUFBUSxLQUFLLFFBQVEsQ0FBQyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDbEYsU0FBRyxDQUFDLElBQUksS0FBSyxPQUFPLFNBQVMsS0FBSyxTQUFTLENBQUMsS0FBSyxHQUFJLElBQUk7QUFDekQsYUFBTyxDQUFDLElBQUk7QUFBQSxJQUNkLENBQUM7QUFDRCxRQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRyxRQUFPO0FBQzdCLFVBQU0sT0FBTyxLQUFLLGFBQWEsTUFBTTtBQUNyQyxRQUFJLENBQUMsS0FBSyxJQUFJO0FBQUUsV0FBSyxXQUFXLEtBQUssTUFBTTtBQUFHLGFBQU87QUFBQSxJQUFNO0FBQzNELFFBQUksS0FBSyxPQUFRLE1BQUssaUJBQWlCLEtBQUssS0FBSztBQUFBLFFBQzVDLE1BQUssY0FBYyxDQUFDLEtBQUssR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLE9BQUssR0FBRyxDQUFDLEdBQUcsR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssR0FBRyxHQUFHLEtBQUssT0FBTztBQUN6SCxTQUFLLGFBQWEsTUFBTTtBQUN4QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFlBQWEsT0FBdUQ7QUFDbEUsUUFBSSxDQUFDLEtBQUssYUFBYyxRQUFPLEtBQUssZUFBZTtBQUNuRCxRQUFJLEtBQUssWUFBYSxRQUFPO0FBQzdCLFFBQUksS0FBSyxLQUFNLFFBQU87QUFDdEIsUUFBSSxDQUFDLENBQUMsS0FBSyxTQUFTLEtBQUssTUFBTSxFQUFFLE1BQU0sT0FBSyxPQUFPLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFHLFFBQU87QUFDakYsVUFBTSxPQUFRLENBQUMsS0FBSyxLQUFLLEdBQUcsRUFBYSxPQUFPLE9BQUssTUFBTSxDQUFDLE1BQU0sTUFBUztBQUMzRSxRQUFJLENBQUMsS0FBSyxPQUFRLFFBQU87QUFDekIsZUFBVyxRQUFRLE1BQU07QUFDdkIsWUFBTSxJQUFJLE1BQU0sUUFBUSxJQUFJO0FBQzVCLFlBQU0sUUFBUSxNQUFNLElBQUk7QUFDeEIsVUFBSSxDQUFDLEtBQUssUUFBUSxJQUFJLEVBQUcsUUFBTyxRQUFRLElBQUk7QUFDNUMsVUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLEtBQUssUUFBUSxLQUFLLFFBQVEsQ0FBQyxLQUFLLFFBQVEsS0FBSyxRQUFRLENBQUMsRUFBRyxRQUFPO0FBQUEsSUFDNUY7QUFDQSxVQUFNLFNBQVMsS0FBSyxlQUFlLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDM0MsVUFBTSxTQUFVLENBQUMsS0FBSyxLQUFLLEdBQUcsRUFBYSxJQUFJLENBQUMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLFNBQWEsTUFBTSxDQUFDLElBQWUsT0FBTyxDQUFDLElBQUksT0FBTyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDN0ksVUFBTSxPQUFPLEtBQUssYUFBYSxNQUFNO0FBQ3JDLFdBQU8sS0FBSyxLQUFLLEtBQUssS0FBSztBQUFBLEVBQzdCO0FBQUE7QUFBQSxFQUdBLE9BQVEsT0FBd0Q7QUFDOUQsUUFBSSxDQUFDLEtBQUssZ0JBQWdCLEtBQUssUUFBUSxDQUFDLENBQUMsS0FBSyxTQUFTLEtBQUssTUFBTSxFQUFFLE1BQU0sT0FBSyxPQUFPLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFHLFFBQU87QUFDcEgsVUFBTSxRQUFrQixDQUFDO0FBQ3pCLFFBQUksT0FBTyxLQUFLO0FBQ2hCLGVBQVcsUUFBUSxDQUFDLEtBQUssS0FBSyxHQUFHLEdBQWE7QUFDNUMsWUFBTSxRQUFRLE1BQU0sSUFBSTtBQUN4QixVQUFJLFVBQVUsT0FBVztBQUN6QixZQUFNLElBQUksTUFBTSxRQUFRLElBQUk7QUFDNUIsVUFBSSxDQUFDLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLFNBQVMsS0FBSyxLQUFLLFFBQVEsS0FBSyxRQUFRLENBQUMsS0FBSyxRQUFRLEtBQUssUUFBUSxDQUFDLEVBQUcsUUFBTztBQUNqSCxZQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsS0FBSyxFQUFFO0FBQzVCLFVBQUksU0FBUyxJQUFLLFFBQU8sS0FBSyxJQUFJLE1BQU0sS0FBSyxNQUFNO0FBQUEsSUFDckQ7QUFDQSxRQUFJLENBQUMsTUFBTSxPQUFRLFFBQU87QUFDMUIsVUFBTSxPQUFPLEtBQUssYUFBYTtBQUMvQixRQUFJLE1BQU07QUFBRSxXQUFLLFdBQVcsSUFBSTtBQUFHLGFBQU87QUFBQSxJQUFNO0FBQ2hELFVBQU0sU0FBUyxLQUFLLGVBQWUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUMzQyxVQUFNLFNBQVUsQ0FBQyxLQUFLLEtBQUssR0FBRyxFQUFhLElBQUksQ0FBQyxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sU0FBYSxNQUFNLENBQUMsSUFBZSxPQUFPLENBQUMsSUFBSSxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztBQUM3SSxVQUFNLE9BQU8sS0FBSyxhQUFhLE1BQU07QUFDckMsUUFBSSxDQUFDLEtBQUssSUFBSTtBQUFFLFdBQUssV0FBVyxLQUFLLE1BQU07QUFBRyxhQUFPO0FBQUEsSUFBTTtBQUMzRCxRQUFJLEtBQUssT0FBUSxNQUFLLGlCQUFpQixLQUFLLEtBQUs7QUFBQSxRQUM1QyxNQUFLLGNBQWMsTUFBTSxLQUFLLEdBQUcsR0FBRyxNQUFNLElBQUk7QUFDbkQsU0FBSyxhQUFhLE1BQU07QUFDeEIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLFNBQVUsT0FBTyxJQUFZO0FBQzNCLFFBQUksU0FBUyxLQUFNLFFBQU8sS0FBSyxPQUFPO0FBQ3RDLFFBQUksU0FBUyxJQUFLLFFBQU8sS0FBSyxPQUFPO0FBQ3JDLFdBQU8sS0FBSyxPQUFPO0FBQUEsRUFDckI7QUFBQSxFQUVBLEtBQU0sT0FBTyxJQUFJO0FBQ2YsUUFBSSxDQUFDLEtBQUssZ0JBQWdCLEtBQUssS0FBTTtBQUNyQyxTQUFLLFVBQVUsT0FBTyxPQUFPLEtBQUssTUFBTSxFQUFFLEVBQUUsS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLEtBQUssU0FBUyxJQUFJLENBQUM7QUFBQSxFQUN0RjtBQUFBLEVBRUEsT0FBUSxPQUFPLElBQWE7QUFDMUIsV0FBTyxLQUFLLFFBQVEsS0FBSyxTQUFTLElBQUksQ0FBQztBQUFBLEVBQ3pDO0FBQUEsRUFFQSxZQUFhO0FBQ1gsUUFBSSxDQUFDLEtBQUssZ0JBQWdCLEtBQUssS0FBTTtBQUNyQyxTQUFLLFVBQVUsS0FBSztBQUFBLEVBQ3RCO0FBQUE7QUFBQSxFQUlBLElBQUksWUFBYTtBQUNmLFdBQU8sS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLGNBQWMsQ0FBQztBQUFBLEVBQzFEO0FBQUEsRUFFQSxJQUFJLGNBQXVCO0FBQ3pCLFdBQU8sS0FBSyxPQUFRLEtBQUssVUFBVSxnQkFBdUMsS0FBSyxHQUFHO0FBQUEsRUFDcEY7QUFBQSxFQUVBLElBQUksYUFBc0I7QUFDeEIsV0FBTyxLQUFLLE9BQVEsS0FBSyxVQUFVLGtCQUF5QyxLQUFLLEdBQUc7QUFBQSxFQUN0RjtBQUFBLEVBRUEsU0FBVSxTQUFpQjtBQUN6QixRQUFJLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxPQUFPLFNBQVMsT0FBTyxLQUFLLFVBQVUsS0FBSyxVQUFVLElBQUs7QUFDckYsU0FBSyxVQUFVLFNBQVMsS0FBSyxNQUFNLE9BQU8sQ0FBQyxFQUFFO0FBQUEsRUFDL0M7QUFBQTtBQUFBLEVBR0EsSUFBSSxhQUFzQztBQUN4QyxVQUFNLFdBQVksS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLGFBQWEsWUFBbUM7QUFDcEcsVUFBTSxPQUFPLEtBQUssT0FBTyxRQUFRLHNCQUFzQjtBQUN2RCxRQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsS0FBSyxPQUFPLE1BQU0sYUFBYSxhQUFjLFFBQU87QUFDOUUsVUFBTSxPQUFPLEtBQUssT0FBTyxHQUFHLEtBQUssSUFBSSxJQUFJLEtBQUssUUFBUSxLQUFLLEtBQUs7QUFDaEUsV0FBTyxTQUFTLFdBQVcsS0FBSyxPQUFPLFFBQVEsdUJBQXVCLElBQWM7QUFBQSxFQUN0RjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksZUFBK0I7QUFDakMsVUFBTSxRQUFRLEtBQUs7QUFDbkIsUUFBSSxPQUFzQjtBQUMxQixRQUFJLE9BQU87QUFDVCxVQUFJLENBQUMsVUFBVSxJQUFJLEtBQUssR0FBRztBQUN6QixjQUFNLFdBQVcsT0FBTyxLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsWUFBWSxVQUFVLFVBQVUsaUJBQWlCLEtBQUs7QUFDaEgsa0JBQVUsSUFBSSxPQUFPLFNBQVMsT0FBTyxRQUFRLENBQUM7QUFBQSxNQUNoRDtBQUNBLGFBQU8sVUFBVSxJQUFJLEtBQUssS0FBSztBQUFBLElBQ2pDO0FBQ0EsVUFBTSxXQUFXLEtBQUssT0FBTyxNQUFNLFFBQVEsUUFBUTtBQUNuRCxVQUFNLFVBQVcsS0FBSyxPQUFPLE1BQU0sYUFBYSxXQUM5QyxnQkFBZ0IsVUFBVSxhQUFhLEtBQ3ZDLGdCQUFnQixLQUFLLGdCQUFnQixJQUFJO0FBQzNDLFdBQU8sYUFBYSxZQUFZLE1BQU0sT0FBTyxHQUFHLFNBQVMsUUFBUSxZQUFZLElBQUk7QUFBQSxFQUNuRjtBQUFBO0FBQUEsRUFHQSxJQUFJLGFBQXNCO0FBQ3hCLFdBQU8sS0FBSyxhQUFhLEtBQUssT0FBSyxFQUFFLFlBQVksS0FBSyxXQUFXLEdBQUcsU0FBUyxHQUFHLEtBQUssV0FBVztBQUFBLEVBQ2xHO0FBQUEsRUFFQSxRQUFTLFNBQWlCO0FBQ3hCLFFBQUksQ0FBQyxLQUFLLGdCQUFnQixDQUFDLE9BQU8sU0FBUyxPQUFPLEtBQUssVUFBVSxLQUFLLFVBQVUsSUFBSztBQUNyRixTQUFLLFVBQVUsU0FBUyxLQUFLLE1BQU0sT0FBTyxDQUFDLEVBQUU7QUFBQSxFQUMvQztBQUFBLEVBRUEsSUFBSSxrQkFBa0M7QUFDcEMsV0FBTyxLQUFLLGdCQUFnQixvQkFBb0I7QUFBQSxFQUNsRDtBQUFBLEVBRUEsbUJBQW9CLE9BQWU7QUFDakMsUUFBSSxDQUFDLEtBQUssZ0JBQWdCLENBQUMsT0FBTyxTQUFTLEtBQUssS0FBSyxRQUFRLEtBQUssUUFBUSxFQUFHO0FBQzdFLFNBQUssVUFBVSxnQ0FBZ0MsS0FBSyxFQUFFO0FBQUEsRUFDeEQ7QUFBQTtBQUFBLEVBR0EsYUFBYyxLQUE4QjtBQUMxQyxVQUFNLFVBQVUsS0FBSyxPQUFPLE1BQU0sUUFBUSxRQUFRLFlBQVksVUFBVSxVQUFVLGFBQWEsR0FBRyxDQUFDO0FBQ25HLFVBQU0sU0FBUyxPQUFPLFlBQVksWUFBYSxPQUFPLFlBQVksWUFBWSxRQUFRLEtBQUssTUFBTSxLQUM3RixPQUFPLE9BQU8sSUFDZCxPQUFPO0FBQ1gsUUFBSSxDQUFDLE9BQU8sU0FBUyxNQUFNLEtBQUssVUFBVSxFQUFHLFFBQU87QUFDcEQsV0FBTyxRQUFRLHlCQUF5QixLQUFLLElBQUksUUFBUSxDQUFDLElBQUk7QUFBQSxFQUNoRTtBQUFBO0FBQUEsRUFHQSxTQUFVLEtBQWUsT0FBZTtBQUN0QyxVQUFNLFVBQVUsS0FBSyxhQUFhLEdBQUc7QUFDckMsUUFBSSxDQUFDLEtBQUssZ0JBQWdCLFlBQVksUUFBUSxDQUFDLE9BQU8sU0FBUyxLQUFLLEtBQUssUUFBUSxLQUFLLFFBQVEsV0FBWSxDQUFDLFlBQVksT0FBTyxFQUFFLFNBQVMsR0FBRyxLQUFLLFNBQVMsRUFBSTtBQUM5SixTQUFLLFVBQVUsc0JBQXNCLEdBQUcsSUFBSSxLQUFLLEVBQUU7QUFBQSxFQUNyRDtBQUFBO0FBQUEsRUFJQSxJQUFJLE9BQWU7QUFDakIsV0FBUSxLQUFLLE9BQU8sUUFBUSxvQkFBb0IsS0FBZSxDQUFDO0FBQUEsRUFDbEU7QUFBQSxFQUVBLElBQUksVUFBdUI7QUFDekIsV0FBTyxLQUFLLEtBQUssS0FBSyxPQUFLLEVBQUUsU0FBUyxLQUFLLEtBQUs7QUFBQSxFQUNsRDtBQUFBLEVBRUEsU0FBVSxLQUFrQjtBQUMxQixXQUFPLFdBQVcsR0FBRztBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxPQUFRLEtBQVUsU0FBaUI7QUFDakMsUUFBSSxDQUFDLEtBQUssZ0JBQWdCLENBQUMsT0FBTyxTQUFTLE9BQU8sS0FBSyxVQUFVLEtBQUssVUFBVSxJQUFLO0FBQ3JGLFVBQU0sUUFBUSxXQUFXLEtBQUssT0FBTztBQUNyQyxRQUFJLE1BQU8sTUFBSyxVQUFVLEtBQUs7QUFBQSxFQUNqQztBQUFBLEVBRUEsSUFBSSxZQUErQjtBQUNqQyxXQUFPLGFBQWMsS0FBSyxPQUFPLFFBQVEsaUJBQWlCLEtBQXFCLENBQUMsQ0FBQztBQUFBLEVBQ25GO0FBQUEsRUFFQSxJQUFJLFlBQXlCO0FBQzNCLFdBQU8sS0FBSyxZQUFZLE9BQU8sYUFBYyxLQUFLLE9BQU8sUUFBUSxvQkFBb0IsS0FBZSxDQUFDLENBQUM7QUFBQSxFQUN4RztBQUFBLEVBRUEsSUFBSSxZQUFzQjtBQUN4QixXQUFPLENBQUMsQ0FBQyxLQUFLLGFBQWEsQ0FBQyxDQUFDLEtBQUs7QUFBQSxFQUNwQztBQUFBO0FBQUEsRUFHQSxJQUFJLGNBQXVCO0FBQ3pCLFFBQUksS0FBSyxVQUFXLFFBQU8sV0FBVyxLQUFLLFVBQVUsS0FBSztBQUMxRCxVQUFNLE9BQU8sS0FBSyxXQUFXLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDakQsV0FBTyxLQUFLLE1BQU0sS0FBSyxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRztBQUFBLEVBQzlDO0FBQUEsRUFFQSxVQUFXLE9BQXlCO0FBQ2xDLFFBQUksQ0FBQyxLQUFLLGdCQUFpQixPQUFPLFVBQVUsYUFBYSxDQUFDLE9BQU8sU0FBUyxLQUFLLEtBQUssUUFBUSxLQUFLLFFBQVEsS0FBTztBQUNoSCxVQUFNLFVBQVUsT0FBTyxVQUFVLFlBQWEsUUFBUSxNQUFNLElBQUs7QUFDakUsUUFBSSxLQUFLLFdBQVc7QUFDbEIsV0FBSyxVQUFVLFdBQVcsS0FBSyxXQUFXLEtBQUssVUFBVSxNQUFNLFVBQVUsVUFBVSxDQUFDLENBQUM7QUFBQSxJQUN2RixXQUFXLEtBQUssV0FBVztBQUN6QixZQUFNLElBQUksS0FBSyxNQUFNLE9BQU8sSUFBSTtBQUNoQyxXQUFLLFVBQVUsZUFBZSxLQUFLLFVBQVUsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUFBLElBQzlGO0FBQUEsRUFDRjtBQUNGO0FBdm1CRTtBQUFBLEVBREMsTUFBTSxjQUFjO0FBQUEsR0EzRUYsYUE0RW5CO0FBa1JBO0FBQUEsRUFEQyxNQUFNLGNBQWM7QUFBQSxHQTdWRixhQThWbkI7QUE5Vm1CLGVBQXJCO0FBQUEsRUFEQztBQUFBLEdBQ29CO0FBQXJCO0FBQUEsRUFBTyxnQkFwRVA7QUFBQTsiLCJuYW1lcyI6W119