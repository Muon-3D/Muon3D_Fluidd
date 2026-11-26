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
import M1PartOptions from "/src/components/m1/M1PartOptions.vue";
import M1Screen from "/src/components/m1/M1Screen.vue";
import { PART_IDS, PART_NAMES } from "/src/services/m1-3d/parts.ts";
import { axisEdges, boundCorners } from "/src/services/m1-3d/drag-bounds.ts";
import { KnobWheel } from "/src/services/m1-3d/knob.ts";
import { HEAD_PLANE_Y, clampMm, headToWorld, plateDragZ, plateTopForZ, releasePlace, ticks, worldToHead, zForPlateTop } from "/src/services/m1-3d/drag-map.ts";
import { modelAnimates } from "/src/services/m1-3d/render-options.ts";
import { modelSettings } from "/src/services/m1-3d/device-settings.ts";
const round = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
const samePx = (a, b) => a === b || !!a && !!b && a.from.x === b.from.x && a.from.y === b.from.y && a.to.x === b.to.x && a.to.y === b.to.y;
const LEAVE_MS = 120;
const HOVER_RELEASE_MS = 700;
const TAP_PX = 10;
const FOLLOW_MS = 700;
const LABEL_INSET = 16;
let M1Parts = class extends Mixins(ControlMixin) {
  viewer;
  canvas;
  stageState;
  ids = PART_IDS;
  names = PART_NAMES;
  hovered = null;
  selected = null;
  /** The selected part's middle on the stage, and where the line meets the label. */
  anchor = null;
  leader = null;
  /** The label sits in the top corner away from the part, out of the way. */
  side = "right";
  focusIndex = 0;
  touch = false;
  reducedMotion = false;
  leaveTimer = 0;
  /** The selection was made by pointing (the filament, Jack 11 Nov), not clicked: it goes again when the pointer goes away. */
  hoverPicked = false;
  releaseTimer = 0;
  labelOver = false;
  pickFrame = 0;
  /** The newest pointer position waiting for the next frame's pick. */
  pickAt = null;
  followFrame = 0;
  followUntil = 0;
  down = null;
  dragged = false;
  bound = null;
  motionQuery = null;
  drag = null;
  /** The pointer a drag may come from: one that went down on the selected part with the main button. Null for anything else. */
  dragPointer = null;
  dragPx = null;
  axisMarks = null;
  /** Looking down: the corners of where the head can go, and the bed's notch, as drawn now. */
  boundsPx = null;
  /** Why the last drag's move was refused, said in the label until the next drag. */
  refused = "";
  /** The printer's own screen, open over the stage. */
  screenOpen = false;
  /** Where the screen was on the stage when it opened: the zoom flies in from there and back out to it. */
  screenFrom = null;
  /**
   * The camera holds still while the toolhead or the plate is selected on an
   * idle printer (Jack, 9 Nov): a drag there moves the part, never the view,
   * and a drag on empty stage leaves the selection as it is.
   */
  get cameraLocked() {
    return this.topView || this.zoomedIn || this.selected === "plate" && this.interactive;
  }
  onCameraLocked(locked) {
    if (this.dragPointer === null) this.viewer?.setOrbit(!locked);
  }
  /** Parts offer their options only on an idle printer this person can control. */
  get interactive() {
    return this.stageState === "idle" && this.controlReady && !this.busy;
  }
  /**
   * The printer reports busy but it is not a print: this page's own Home or jog, a macro, another client. The printer
   * reports busy while the head moves, which would make the stage let go of the part (the camera leaves the top view, the
   * options go): the person chose that view, so it stays until they change it (KAN-3593 for Home, KAN-4816 for any move:
   * the own-move window can end or miss while the head is still moving). A real print still lets go.
   */
  get busyHere() {
    return this.controlReady && !this.printLocked && this.stageState === "printing";
  }
  /** The part's view and options stay: the printer is idle, or is only running this page's own Home. */
  get holdsPart() {
    return this.interactive || this.busyHere;
  }
  /** The selected part can be dragged: the toolhead in X and Y, the plate in Z, once homed, on the accurate model (whose millimetres the drag is read in). */
  get movable() {
    const part = this.selected;
    if (!this.interactive || !this.viewer?.accurate) return null;
    if (part === "toolhead" && this.isHomed("XY")) return "toolhead";
    if (part === "plate" && this.isHomed("Z")) return "plate";
    return null;
  }
  /** The toolhead selected: look straight down for clear axes, the plate out of the way. */
  get topView() {
    return this.selected === "toolhead" && this.holdsPart && !!this.viewer?.accurate;
  }
  get dragHint() {
    if (this.movable === "toolhead") return "Drag the head to move it";
    if (this.movable === "plate") return "Drag the plate up or down to move it";
    if ((this.selected === "toolhead" || this.selected === "plate") && this.interactive && !this.isHomed("XYZ")) return "Home it to move it by hand";
    return "";
  }
  get dragText() {
    const t = this.drag?.target;
    if (!t) return "";
    return "Z" in t ? `Z ${t.Z.toFixed(1)}` : `X ${t.X.toFixed(1)}  Y ${t.Y.toFixed(1)}`;
  }
  get shownPart() {
    return this.selected ?? this.hovered;
  }
  get printerName() {
    return this.$store.getters["config/getDisplayName"] || "The printer";
  }
  /** One live fact per part, as the label and the button name say it. */
  get facts() {
    const printer = this.$store.state.printer.printer;
    const deg = (t) => typeof t === "number" ? `${Math.round(t)} \xB0C` : "\u2013 \xB0C";
    const homed = (printer.toolhead?.homed_axes ?? "").length >= 3;
    const mesh = printer.bed_mesh?.profile_name ?? "";
    const material = this.loadedMaterial;
    return {
      plate: `${deg(printer.heater_bed?.temperature)} \xB7 ${mesh ? "mesh loaded" : "no mesh"}`,
      toolhead: `${deg(printer.extruder?.temperature)} \xB7 ${homed ? "homed" : "not homed"}`,
      filament: material ? material.name : "No material loaded",
      screen: "The printer's own screen"
    };
  }
  mounted() {
    this.touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    this.motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    this.reducedMotion = !!this.motionQuery?.matches;
    this.motionQuery?.addEventListener?.("change", this.onMotionPref);
    document.addEventListener("keydown", this.onEscape);
    this.bind(this.canvas);
  }
  beforeDestroy() {
    this.bind(null);
    this.motionQuery?.removeEventListener?.("change", this.onMotionPref);
    document.removeEventListener("keydown", this.onEscape);
    clearTimeout(this.leaveTimer);
    clearTimeout(this.releaseTimer);
    cancelAnimationFrame(this.pickFrame);
    cancelAnimationFrame(this.followFrame);
    this.viewer?.setFocus(null, "info", false);
    this.viewer?.setView("free");
    this.viewer?.setOrbit(true);
  }
  onMotionPref(e) {
    this.reducedMotion = e.matches;
    this.show();
  }
  bind(canvas) {
    const old = this.bound;
    if (old) {
      old.removeEventListener("pointermove", this.onMove);
      old.removeEventListener("pointerleave", this.onLeave);
      old.removeEventListener("wheel", this.onWheel);
      old.removeEventListener("pointerdown", this.onDown, true);
      old.removeEventListener("pointerup", this.onUp);
      old.removeEventListener("pointercancel", this.onCancel);
      old.removeEventListener("lostpointercapture", this.onCancel);
      old.style.cursor = "";
      old.style.touchAction = "";
    }
    this.bound = canvas;
    if (!canvas) return;
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerleave", this.onLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("pointerdown", this.onDown, true);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onCancel);
    canvas.addEventListener("lostpointercapture", this.onCancel);
    if (this.movable) canvas.style.touchAction = "none";
  }
  /** Ends any drag and sends nothing. */
  onCancel() {
    this.down = null;
    this.dragged = false;
    this.drag = null;
    this.dragPx = null;
    this.dragPointer = null;
    this.viewer?.holdPan(false);
    this.viewer?.setOrbit(!this.cameraLocked);
  }
  onDown(e) {
    if (this.drag || this.dragPointer !== null) {
      this.onCancel();
      return;
    }
    this.down = { x: e.clientX, y: e.clientY };
    this.dragged = false;
    const onPart = !!this.movable && e.button === 0 && e.isPrimary && this.viewer?.pick(e.clientX, e.clientY) === this.movable;
    this.viewer?.setOrbit(!onPart && !this.cameraLocked);
    if (onPart) {
      this.dragPointer = e.pointerId;
      this.viewer?.holdPan(true);
      this.bound?.setPointerCapture?.(e.pointerId);
    }
  }
  onMove(e) {
    if (this.dragPointer !== null) {
      if (e.pointerId !== this.dragPointer) return;
      if (this.drag || this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > TAP_PX) {
        this.dragged = true;
        this.dragTo(e.clientX, e.clientY);
      }
      return;
    }
    if (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > TAP_PX) {
      if (!this.dragged) {
        this.dragged = true;
        this.hovered = null;
      }
      this.follow();
      return;
    }
    if (e.pointerType === "touch" || this.down) return;
    this.pickAt = { x: e.clientX, y: e.clientY };
    if (this.pickFrame) return;
    this.pickFrame = requestAnimationFrame(() => {
      this.pickFrame = 0;
      const at = this.pickAt;
      this.pickAt = null;
      if (at) this.onPoint(this.viewer?.pick(at.x, at.y) ?? null);
    });
  }
  /** The pointer is over this part (or none). */
  onPoint(part) {
    if (this.bound) this.bound.style.cursor = part && this.interactive ? "pointer" : "";
    if (part) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = 0;
      clearTimeout(this.releaseTimer);
      this.releaseTimer = 0;
      if (part !== this.hovered) this.hovered = part;
      this.pointPick(part);
      return;
    }
    if (this.hoverPicked && !this.labelOver && !this.releaseTimer) {
      this.releaseTimer = window.setTimeout(() => {
        this.releaseTimer = 0;
        if (this.hoverPicked && !this.labelOver) this.deselect();
      }, HOVER_RELEASE_MS);
    }
    if (this.hovered && !this.leaveTimer) {
      this.leaveTimer = window.setTimeout(() => {
        this.leaveTimer = 0;
        this.hovered = null;
      }, LEAVE_MS);
    }
  }
  onLeave(e) {
    cancelAnimationFrame(this.pickFrame);
    this.pickFrame = 0;
    this.pickAt = null;
    this.onPoint(null);
    if (!this.selected || !e || e.pointerType === "touch" || this.down || this.drag || this.dragPointer !== null || this.screenOpen) return;
    const to = e.relatedTarget;
    if (to && this.$el.contains(to)) return;
    this.deselect();
  }
  /** Lets the selected part go. */
  deselect() {
    clearTimeout(this.releaseTimer);
    this.releaseTimer = 0;
    this.hoverPicked = false;
    if (!this.selected) return;
    this.selected = null;
    this.refused = "";
  }
  /** Pointing at the filament picks it (Jack, 11 Nov: hover the spool), so its panel is there to use; nothing else is picked by pointing. */
  pointPick(part) {
    if (part !== "filament" || this.selected || this.touch || this.down || this.screenOpen) return;
    this.select(part);
    this.hoverPicked = true;
  }
  onLabelEnter() {
    this.labelOver = true;
    clearTimeout(this.releaseTimer);
    this.releaseTimer = 0;
  }
  onLabelLeave(e) {
    this.labelOver = false;
    if (!this.hoverPicked) return;
    const to = e.relatedTarget;
    if (to?.closest?.('.v-menu__content, .v-dialog, [role="menu"], [role="listbox"], [role="dialog"]')) return;
    this.deselect();
  }
  /** With the printer's screen open, a scroll over the model turns its knob, as the knob on the printer would turn. Only the picture: nothing is sent. */
  knobWheel = new KnobWheel();
  onWheel(e) {
    if (!this.screenOpen || !this.viewer) return;
    e.preventDefault();
    const detents = this.knobWheel.turn(e.deltaY, e.deltaMode);
    if (detents) this.viewer.turnKnob(detents);
  }
  onUp(e) {
    const start = this.down;
    this.down = null;
    const dragPointer = this.dragPointer;
    this.dragPointer = null;
    this.viewer?.holdPan(false);
    this.viewer?.setOrbit(!this.cameraLocked);
    if (this.drag) {
      if (e.pointerId === dragPointer && e.button === 0) this.release();
      else this.onCancel();
      return;
    }
    if (!start || this.dragged || e.button !== 0) return;
    if (this.screenOpen) {
      if (this.viewer?.knobAt(e.clientX, e.clientY) || this.viewer?.pick(e.clientX, e.clientY) === "screen") this.viewer.pressKnob();
      else this.$refs.screen?.close?.();
      return;
    }
    if (this.viewer?.knobAt(e.clientX, e.clientY)) this.viewer.pressKnob();
    const part = this.viewer?.pick(e.clientX, e.clientY) ?? null;
    if (part) this.select(part);
    else this.selected = null;
  }
  /** The drag's target under the pointer: the head on its plane, or the plate up or down from where it was. */
  dragTo(x, y) {
    const viewer = this.viewer;
    const part = this.movable;
    if (!viewer || !part) return;
    if (part === "toolhead") {
      const hit = viewer.onLevel(x, y, HEAD_PLANE_Y);
      if (!hit) return;
      const at = worldToHead(hit);
      if (!this.drag) this.refused = "";
      this.drag = {
        part,
        printer: this.drag?.printer ?? this.panelTarget,
        target: { X: clampMm(at.X, this.axisMin[0], this.axisMax[0]), Y: clampMm(at.Y, this.axisMin[1], this.axisMax[1]) }
      };
    } else {
      const z0 = this.drag?.startZ ?? Number(this.position[2]);
      const through = { x: 0, y: plateTopForZ(z0), z: 0 };
      const hit = viewer.onUpright(x, y, through);
      if (!hit) return;
      if (!this.drag) {
        this.refused = "";
        this.drag = { part, printer: this.panelTarget, target: { Z: z0 }, startZ: z0, startY: hit.y };
      }
      const by = zForPlateTop(hit.y) - zForPlateTop(this.drag.startY ?? hit.y);
      this.drag = { ...this.drag, target: { Z: plateDragZ(z0, by, this.axisMin[2], this.axisMax[2]) } };
    }
    this.follow();
  }
  /**
   * Letting go sends the target once, through moveTo: the same checks as
   * every hand move (homed, idle, the hand-move wait and the no-go planner,
   * lifting over the bed's notch when it must). moveTo takes G-code
   * coordinates; the drag is read in the toolhead's.
   */
  release() {
    const drag = this.drag;
    this.drag = null;
    this.dragPx = null;
    if (!drag || this.movable !== drag.part || drag.printer !== this.panelTarget) return;
    const place = releasePlace(drag.target, this.gcodeOffset ?? [0, 0, 0], this.axisMin, this.axisMax);
    const wait = this.handMoveWait();
    const sent = this.moveTo(place);
    if (!sent) this.refused = `Not moved: ${wait || this.refusalFor(place)}`;
  }
  /** Why moveTo would turn this place down, in words. */
  refusalFor(place) {
    if (!this.controlReady) return this.controlLock;
    if (this.busy) return "the printer is busy.";
    const offset = this.gcodeOffset ?? [0, 0, 0];
    const realTo = ["X", "Y", "Z"].map((a, i) => place[a] !== void 0 ? place[a] + offset[i] : Number(this.position[i]));
    const plan = this.planHandMove(realTo);
    return plan.ok ? "that is outside what the printer can reach." : plan.reason;
  }
  /** The drag's line and target, and the axes' marks, as drawn now. */
  placeDrag() {
    const viewer = this.viewer;
    if (!viewer) return;
    const drag = this.drag;
    if (drag) {
      const t = drag.target;
      const world = "Z" in t ? { x: 0, y: plateTopForZ(t.Z), z: 0 } : headToWorld(t.X, t.Y);
      const to = viewer.project(world);
      const [x, y, z] = this.position;
      const from = viewer.project(drag.part === "plate" ? { x: 0, y: plateTopForZ(z), z: 0 } : headToWorld(x, y));
      const next = to && from ? { from: round(from), to: round(to) } : null;
      if (!samePx(next, this.dragPx)) this.dragPx = next;
    }
    if (this.topView) {
      const lo = [this.axisMin[0], this.axisMin[1]];
      const hi = [this.axisMax[0], this.axisMax[1]];
      const screen = (x, y) => viewer.project(headToWorld(x, y));
      const edges = axisEdges(lo, hi, screen);
      const mark = (v, p, axis) => p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { v, px: Math.round(axis === "x" ? p.x : p.y), at: Math.round(axis === "x" ? p.y : p.x) } : null;
      const xs = ticks(Math.max(0, lo[0]), hi[0]).map((v) => mark(v, screen(v, edges.y), "x"));
      const ys = ticks(Math.max(0, lo[1]), hi[1]).map((v) => mark(v, screen(edges.x, v), "y"));
      const next = {
        x: xs.filter((m) => !!m),
        y: ys.filter((m) => !!m)
      };
      if (JSON.stringify(next) !== JSON.stringify(this.axisMarks)) this.axisMarks = next;
      const noGo = this.noGo;
      const regions = noGo && noGo !== "invalid" ? noGo.regions : [];
      const bounds = {
        corners: boundCorners(lo, hi, screen),
        notch: regions.map((r) => boundCorners(r.min, r.max, screen, true)).filter(Boolean)
      };
      if (JSON.stringify(bounds) !== JSON.stringify(this.boundsPx)) this.boundsPx = bounds;
    } else {
      if (this.axisMarks) this.axisMarks = null;
      if (this.boundsPx) this.boundsPx = null;
    }
  }
  /** The screen open: the camera flies in to it (not with reduced motion: then the screen just opens). */
  get zoomedIn() {
    return this.screenOpen && this.interactive && !this.reducedMotion;
  }
  onZoomedIn() {
    this.onTopView(this.topView);
  }
  onTopView(top) {
    this.viewer?.setView(this.zoomedIn ? "screen" : top ? "top" : "free");
    this.viewer?.setOrbit(!this.cameraLocked);
    this.follow();
  }
  onPrinterChange() {
    if (this.drag || this.dragPointer !== null) this.onCancel();
  }
  onMovable(part) {
    if (this.bound) this.bound.style.touchAction = part ? "none" : "";
    if (!part && (this.drag || this.dragPointer !== null)) this.onCancel();
  }
  select(part) {
    this.hoverPicked = false;
    this.selected = part;
    if (part === "screen" && this.interactive) {
      this.screenFrom = this.anchor ?? this.viewer?.anchor("screen") ?? null;
      this.screenOpen = true;
    }
    this.focusIndex = PART_IDS.indexOf(part);
    this.$emit("select", part);
  }
  onChipFocus(id) {
    this.hoverPicked = false;
    this.focusIndex = PART_IDS.indexOf(id);
    this.selected = id;
  }
  /** ← → and 1–4 move between the parts' buttons. */
  onKeys(e) {
    const n = PART_IDS.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (this.focusIndex + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (this.focusIndex + n - 1) % n;
    else if (/^[1-4]$/.test(e.key)) next = Number(e.key) - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    this.focusIndex = next;
    this.$refs.chips?.[next]?.focus();
  }
  onEscape(e) {
    if (e.key !== "Escape") return;
    if (this.screenOpen) return;
    const t = e.target;
    if (t && t !== document.body && !this.$el.contains(t) && t.closest('input, textarea, select, [contenteditable], .v-dialog, [role="dialog"]')) return;
    if (this.drag || this.dragPointer !== null) {
      this.onCancel();
      return;
    }
    if (!this.selected) return;
    this.selected = null;
    this.refused = "";
  }
  show() {
    const part = this.shownPart;
    this.viewer?.setFocus(part, this.holdsPart ? "active" : "info", this.holdsPart && modelAnimates(modelSettings.animations, this.reducedMotion));
    if (this.bound && !part) this.bound.style.cursor = "";
    this.follow();
  }
  /** Puts the label in the top corner away from the part, and ends the line at its near edge. */
  placeLabel() {
    const a = this.anchor;
    const el = this.$el;
    if (!a || !el) {
      if (this.leader) this.leader = null;
      return;
    }
    const w = el.clientWidth;
    const side = this.topView ? "right" : a.x < w * 0.42 ? "right" : a.x > w * 0.58 ? "left" : this.side;
    if (side !== this.side) this.side = side;
    const label = this.$refs.label;
    if (!label) return;
    const x = this.side === "right" ? el.clientWidth - LABEL_INSET - label.offsetWidth : LABEL_INSET + label.offsetWidth;
    const y = LABEL_INSET + label.offsetHeight / 2;
    if (this.leader?.x !== x || this.leader?.y !== y) this.leader = { x, y };
  }
  updated() {
    if (this.selected) this.placeLabel();
  }
  /** Keeps the label's line on its part while the camera eases. */
  follow() {
    this.followUntil = performance.now() + FOLLOW_MS;
    if (this.followFrame) return;
    const step = () => {
      const part = this.selected;
      const at = part ? this.viewer?.anchor(part) ?? null : null;
      const next = at ? round(at) : null;
      if (next?.x !== this.anchor?.x || next?.y !== this.anchor?.y) this.anchor = next;
      this.placeLabel();
      this.placeDrag();
      const moving = this.selected === "toolhead" || this.selected === "plate";
      this.followFrame = performance.now() < this.followUntil || this.down || moving ? requestAnimationFrame(step) : 0;
    };
    this.followFrame = requestAnimationFrame(step);
  }
};
__decorateClass([
  Prop({ type: Object, default: null })
], M1Parts.prototype, "viewer", 2);
__decorateClass([
  Prop({ type: HTMLCanvasElement, default: null })
], M1Parts.prototype, "canvas", 2);
__decorateClass([
  Prop({ type: String, default: "idle" })
], M1Parts.prototype, "stageState", 2);
__decorateClass([
  Watch("cameraLocked")
], M1Parts.prototype, "onCameraLocked", 1);
__decorateClass([
  Watch("canvas")
], M1Parts.prototype, "bind", 1);
__decorateClass([
  Watch("zoomedIn")
], M1Parts.prototype, "onZoomedIn", 1);
__decorateClass([
  Watch("topView")
], M1Parts.prototype, "onTopView", 1);
__decorateClass([
  Watch("panelTarget")
], M1Parts.prototype, "onPrinterChange", 1);
__decorateClass([
  Watch("movable")
], M1Parts.prototype, "onMovable", 1);
__decorateClass([
  Watch("shownPart"),
  Watch("holdsPart"),
  Watch("viewer")
], M1Parts.prototype, "show", 1);
M1Parts = __decorateClass([
  Component({ components: { M1PartOptions, M1Screen } })
], M1Parts);
const _sfc_main = M1Parts;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "m1-parts", class: { "m1-parts--touch": _vm.touch }, attrs: { "data-tid": "m1-parts", "data-interactive": _vm.interactive ? "on" : "off", "data-hovered": _vm.hovered || "", "data-selected": _vm.selected || "", "data-view": _vm.zoomedIn ? "screen" : _vm.topView ? "top" : "free" } }, [_c("div", { staticClass: "m1-parts__chips", attrs: { "role": "toolbar", "aria-label": `${_vm.printerName}, 3D view: parts` }, on: { "keydown": _vm.onKeys } }, _vm._l(_vm.ids, function(id, i) {
    return _c("button", { key: id, ref: "chips", refInFor: true, staticClass: "m1-parts__chip", class: { "m1-parts__chip--on": _vm.selected === id }, attrs: { "type": "button", "data-tid": `m1-part-${id}`, "aria-pressed": _vm.selected === id ? "true" : "false", "aria-label": `${_vm.names[id]}, ${_vm.facts[id]}`, "tabindex": i === _vm.focusIndex ? 0 : -1 }, on: { "click": function($event) {
      return _vm.select(id);
    }, "focus": function($event) {
      return _vm.onChipFocus(id);
    } } }, [_vm._v(" " + _vm._s(_vm.names[id]) + " ")]);
  }), 0), _vm.topView && _vm.axisMarks ? _c("div", { staticClass: "m1-parts__axes", attrs: { "data-tid": "m1-axes", "aria-hidden": "true" } }, [_vm._l(_vm.axisMarks.x, function(m) {
    return _c("span", { key: `x${m.v}`, staticClass: "m1-parts__tick m1-parts__tick--x", style: { left: `${m.px}px`, top: `${m.at}px` } }, [_vm._v(_vm._s(m.v))]);
  }), _vm.axisMarks.x.length ? _c("span", { staticClass: "m1-parts__axis-name m1-parts__axis-name--x", style: { left: `${_vm.axisMarks.x[_vm.axisMarks.x.length - 1].px}px`, top: `${_vm.axisMarks.x[_vm.axisMarks.x.length - 1].at}px` } }, [_vm._v("X")]) : _vm._e(), _vm._l(_vm.axisMarks.y, function(m) {
    return _c("span", { key: `y${m.v}`, staticClass: "m1-parts__tick m1-parts__tick--y", style: { top: `${m.px}px`, left: `${m.at}px` } }, [_vm._v(_vm._s(m.v))]);
  }), _vm.axisMarks.y.length ? _c("span", { staticClass: "m1-parts__axis-name m1-parts__axis-name--y", style: { top: `${_vm.axisMarks.y[_vm.axisMarks.y.length - 1].px}px`, left: `${_vm.axisMarks.y[_vm.axisMarks.y.length - 1].at}px` } }, [_vm._v("Y")]) : _vm._e()], 2) : _vm._e(), _vm.topView && _vm.boundsPx ? _c("svg", { staticClass: "m1-parts__bounds", attrs: { "data-tid": "m1-bounds", "aria-hidden": "true" } }, [_c("path", { staticClass: "m1-parts__bounds-corners", attrs: { "d": _vm.boundsPx.corners } }), _vm._l(_vm.boundsPx.notch, function(d, i) {
    return _c("path", { key: `notch${i}`, staticClass: "m1-parts__bounds-notch", attrs: { "data-tid": "m1-notch", "d": d } });
  })], 2) : _vm._e(), _vm.drag && _vm.dragPx ? _c("svg", { staticClass: "m1-parts__drag", attrs: { "data-tid": "m1-drag-target", "data-target": _vm.dragText, "aria-hidden": "true" } }, [_c("line", { attrs: { "x1": _vm.dragPx.from.x, "y1": _vm.dragPx.from.y, "x2": _vm.dragPx.to.x, "y2": _vm.dragPx.to.y } }), _c("circle", { attrs: { "cx": _vm.dragPx.to.x, "cy": _vm.dragPx.to.y, "r": "9" } }), _c("path", { attrs: { "d": `M${_vm.dragPx.to.x - 14} ${_vm.dragPx.to.y}h28M${_vm.dragPx.to.x} ${_vm.dragPx.to.y - 14}v28` } }), _c("text", { attrs: { "x": _vm.dragPx.to.x + 14, "y": _vm.dragPx.to.y - 12 } }, [_vm._v(_vm._s(_vm.dragText))])]) : _vm._e(), _vm.selected && _vm.anchor && _vm.leader && !_vm.screenOpen ? _c("svg", { staticClass: "m1-parts__leader", attrs: { "aria-hidden": "true" } }, [_c("circle", { attrs: { "cx": _vm.anchor.x, "cy": _vm.anchor.y, "r": "2.5" } }), _c("line", { attrs: { "x1": _vm.anchor.x, "y1": _vm.anchor.y, "x2": _vm.leader.x, "y2": _vm.leader.y } })]) : _vm._e(), _vm.selected && !_vm.screenOpen ? _c("div", { ref: "label", staticClass: "m1-parts__label", class: [`m1-parts__label--${_vm.side}`, { "m1-parts__label--info": !_vm.interactive }], attrs: { "data-tid": "m1-parts-label", "data-part": _vm.selected }, on: { "pointerenter": _vm.onLabelEnter, "pointerleave": _vm.onLabelLeave, "pointerdown": function($event) {
    _vm.hoverPicked = false;
  }, "focusin": function($event) {
    _vm.hoverPicked = false;
  } } }, [_c("b", [_vm._v(_vm._s(_vm.names[_vm.selected]))]), _c("span", { staticClass: "m1-parts__fact" }, [_vm._v(_vm._s(_vm.facts[_vm.selected]))]), _vm.refused ? _c("span", { staticClass: "m1-parts__refused", attrs: { "role": "status", "data-tid": "m1-drag-refused" } }, [_vm._v(_vm._s(_vm.refused))]) : _vm.dragHint ? _c("span", { staticClass: "m1-parts__hint" }, [_vm._v(_vm._s(_vm.dragHint))]) : _vm._e(), _vm.holdsPart ? _c("m1-part-options", { key: _vm.selected, attrs: { "part": _vm.selected }, on: { "use-screen": function($event) {
    return _vm.select("screen");
  } } }) : _vm._e()], 1) : _vm._e(), _vm.screenOpen && _vm.interactive ? _c("m1-screen", { ref: "screen", attrs: { "from": _vm.screenFrom, "reduced-motion": _vm.reducedMotion, "viewer": _vm.zoomedIn ? _vm.viewer : null }, on: { "turn": function($event) {
    _vm.viewer && _vm.viewer.turnKnob($event);
  }, "close": function($event) {
    _vm.screenOpen = false;
  } } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/m1/M1Parts.vue?vue&type=style&index=0&scoped=f5d34931&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f5d34931",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/m1/M1Parts.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTRLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUdBO0FBRUE7QUFpQkE7QUFFQTtBQUVBO0FBRUE7QUFFQTtBQXNCQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBR0E7QUFDQTtBQUFBLFVBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUNBLHVDQUNBO0FBQ0E7QUFFQTtBQUNBLDBEQUNBLHFDQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0EsbUNBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUlBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsYUFDQTtBQUFBLGFBQ0E7QUFBQSxhQUNBO0FBQUEsYUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTlsQkE7QUFBQSxFQURBO0FBQUEsR0FGQSxRQUdBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FMQSxRQU1BO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FUQSxRQVVBO0FBdURBO0FBQUEsRUFEQTtBQUFBLEdBaEVBLFFBaUVBO0FBc0dBO0FBQUEsRUFEQTtBQUFBLEdBdEtBLFFBdUtBO0FBeVRBO0FBQUEsRUFEQTtBQUFBLEdBL2RBLFFBZ2VBO0FBS0E7QUFBQSxFQURBO0FBQUEsR0FwZUEsUUFxZUE7QUFRQTtBQUFBLEVBREE7QUFBQSxHQTVlQSxRQTZlQTtBQU1BO0FBQUEsRUFEQTtBQUFBLEdBbGZBLFFBbWZBO0FBMERBO0FBQUEsRUFIQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsR0E1aUJBLFFBNmlCQTtBQTdpQkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTTFQYXJ0cy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJtMS1wYXJ0c1wiXG4gICAgOmNsYXNzPVwieyAnbTEtcGFydHMtLXRvdWNoJzogdG91Y2ggfVwiXG4gICAgZGF0YS10aWQ9XCJtMS1wYXJ0c1wiXG4gICAgOmRhdGEtaW50ZXJhY3RpdmU9XCJpbnRlcmFjdGl2ZSA/ICdvbicgOiAnb2ZmJ1wiXG4gICAgOmRhdGEtaG92ZXJlZD1cImhvdmVyZWQgfHwgJydcIlxuICAgIDpkYXRhLXNlbGVjdGVkPVwic2VsZWN0ZWQgfHwgJydcIlxuICAgIDpkYXRhLXZpZXc9XCJ6b29tZWRJbiA/ICdzY3JlZW4nIDogdG9wVmlldyA/ICd0b3AnIDogJ2ZyZWUnXCJcbiAgPlxuICAgIDxkaXZcbiAgICAgIGNsYXNzPVwibTEtcGFydHNfX2NoaXBzXCJcbiAgICAgIHJvbGU9XCJ0b29sYmFyXCJcbiAgICAgIDphcmlhLWxhYmVsPVwiYCR7cHJpbnRlck5hbWV9LCAzRCB2aWV3OiBwYXJ0c2BcIlxuICAgICAgQGtleWRvd249XCJvbktleXNcIlxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1mb3I9XCIoaWQsIGkpIGluIGlkc1wiXG4gICAgICAgIDprZXk9XCJpZFwiXG4gICAgICAgIHJlZj1cImNoaXBzXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwibTEtcGFydHNfX2NoaXBcIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdtMS1wYXJ0c19fY2hpcC0tb24nOiBzZWxlY3RlZCA9PT0gaWQgfVwiXG4gICAgICAgIDpkYXRhLXRpZD1cImBtMS1wYXJ0LSR7aWR9YFwiXG4gICAgICAgIDphcmlhLXByZXNzZWQ9XCJzZWxlY3RlZCA9PT0gaWQgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgOmFyaWEtbGFiZWw9XCJgJHtuYW1lc1tpZF19LCAke2ZhY3RzW2lkXX1gXCJcbiAgICAgICAgOnRhYmluZGV4PVwiaSA9PT0gZm9jdXNJbmRleCA/IDAgOiAtMVwiXG4gICAgICAgIEBjbGljaz1cInNlbGVjdChpZClcIlxuICAgICAgICBAZm9jdXM9XCJvbkNoaXBGb2N1cyhpZClcIlxuICAgICAgPlxuICAgICAgICB7eyBuYW1lc1tpZF0gfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSBMb29raW5nIHN0cmFpZ2h0IGRvd24gYXQgdGhlIGhlYWQ6IFggYW5kIFkgbWFya2VkIGFsb25nIHRoZSBsaW1pdHMgb2YgaXRzIHJlYWNoLCBpbiB0aGUgcHJpbnRlcidzIG1pbGxpbWV0cmVzLiAtLT5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwidG9wVmlldyAmJiBheGlzTWFya3NcIlxuICAgICAgY2xhc3M9XCJtMS1wYXJ0c19fYXhlc1wiXG4gICAgICBkYXRhLXRpZD1cIm0xLWF4ZXNcIlxuICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICA+XG4gICAgICA8c3BhblxuICAgICAgICB2LWZvcj1cIm0gaW4gYXhpc01hcmtzLnhcIlxuICAgICAgICA6a2V5PVwiYHgke20udn1gXCJcbiAgICAgICAgY2xhc3M9XCJtMS1wYXJ0c19fdGljayBtMS1wYXJ0c19fdGljay0teFwiXG4gICAgICAgIDpzdHlsZT1cInsgbGVmdDogYCR7bS5weH1weGAsIHRvcDogYCR7bS5hdH1weGAgfVwiXG4gICAgICA+e3sgbS52IH19PC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cImF4aXNNYXJrcy54Lmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwibTEtcGFydHNfX2F4aXMtbmFtZSBtMS1wYXJ0c19fYXhpcy1uYW1lLS14XCJcbiAgICAgICAgOnN0eWxlPVwieyBsZWZ0OiBgJHtheGlzTWFya3MueFtheGlzTWFya3MueC5sZW5ndGggLSAxXS5weH1weGAsIHRvcDogYCR7YXhpc01hcmtzLnhbYXhpc01hcmtzLngubGVuZ3RoIC0gMV0uYXR9cHhgIH1cIlxuICAgICAgPlg8L3NwYW4+XG4gICAgICA8c3BhblxuICAgICAgICB2LWZvcj1cIm0gaW4gYXhpc01hcmtzLnlcIlxuICAgICAgICA6a2V5PVwiYHkke20udn1gXCJcbiAgICAgICAgY2xhc3M9XCJtMS1wYXJ0c19fdGljayBtMS1wYXJ0c19fdGljay0teVwiXG4gICAgICAgIDpzdHlsZT1cInsgdG9wOiBgJHttLnB4fXB4YCwgbGVmdDogYCR7bS5hdH1weGAgfVwiXG4gICAgICA+e3sgbS52IH19PC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cImF4aXNNYXJrcy55Lmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwibTEtcGFydHNfX2F4aXMtbmFtZSBtMS1wYXJ0c19fYXhpcy1uYW1lLS15XCJcbiAgICAgICAgOnN0eWxlPVwieyB0b3A6IGAke2F4aXNNYXJrcy55W2F4aXNNYXJrcy55Lmxlbmd0aCAtIDFdLnB4fXB4YCwgbGVmdDogYCR7YXhpc01hcmtzLnlbYXhpc01hcmtzLnkubGVuZ3RoIC0gMV0uYXR9cHhgIH1cIlxuICAgICAgPlk8L3NwYW4+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIExvb2tpbmcgZG93bjogd2hlcmUgdGhlIGhlYWQgY2FuIGdvIChpdHMgY29ybmVycyksIGFuZCB0aGUgYmVkJ3Mgbm90Y2gsIHF1aWV0bHkuIC0tPlxuICAgIDxzdmdcbiAgICAgIHYtaWY9XCJ0b3BWaWV3ICYmIGJvdW5kc1B4XCJcbiAgICAgIGNsYXNzPVwibTEtcGFydHNfX2JvdW5kc1wiXG4gICAgICBkYXRhLXRpZD1cIm0xLWJvdW5kc1wiXG4gICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgID5cbiAgICAgIDxwYXRoXG4gICAgICAgIGNsYXNzPVwibTEtcGFydHNfX2JvdW5kcy1jb3JuZXJzXCJcbiAgICAgICAgOmQ9XCJib3VuZHNQeC5jb3JuZXJzXCJcbiAgICAgIC8+XG4gICAgICA8cGF0aFxuICAgICAgICB2LWZvcj1cIihkLCBpKSBpbiBib3VuZHNQeC5ub3RjaFwiXG4gICAgICAgIDprZXk9XCJgbm90Y2gke2l9YFwiXG4gICAgICAgIGNsYXNzPVwibTEtcGFydHNfX2JvdW5kcy1ub3RjaFwiXG4gICAgICAgIGRhdGEtdGlkPVwibTEtbm90Y2hcIlxuICAgICAgICA6ZD1cImRcIlxuICAgICAgLz5cbiAgICA8L3N2Zz5cblxuICAgIDwhLS0gV2hpbGUgZHJhZ2dpbmc6IGEgdGFyZ2V0IG9uIHRoZSBjdXJzb3IsIGFuZCBhIGxpdmUgbGluZSBmcm9tIHdoZXJlIHRoZSBwYXJ0IGlzIHRvIGl0LiAtLT5cbiAgICA8c3ZnXG4gICAgICB2LWlmPVwiZHJhZyAmJiBkcmFnUHhcIlxuICAgICAgY2xhc3M9XCJtMS1wYXJ0c19fZHJhZ1wiXG4gICAgICBkYXRhLXRpZD1cIm0xLWRyYWctdGFyZ2V0XCJcbiAgICAgIDpkYXRhLXRhcmdldD1cImRyYWdUZXh0XCJcbiAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgPlxuICAgICAgPGxpbmVcbiAgICAgICAgOngxPVwiZHJhZ1B4LmZyb20ueFwiXG4gICAgICAgIDp5MT1cImRyYWdQeC5mcm9tLnlcIlxuICAgICAgICA6eDI9XCJkcmFnUHgudG8ueFwiXG4gICAgICAgIDp5Mj1cImRyYWdQeC50by55XCJcbiAgICAgIC8+XG4gICAgICA8Y2lyY2xlXG4gICAgICAgIDpjeD1cImRyYWdQeC50by54XCJcbiAgICAgICAgOmN5PVwiZHJhZ1B4LnRvLnlcIlxuICAgICAgICByPVwiOVwiXG4gICAgICAvPlxuICAgICAgPHBhdGggOmQ9XCJgTSR7ZHJhZ1B4LnRvLnggLSAxNH0gJHtkcmFnUHgudG8ueX1oMjhNJHtkcmFnUHgudG8ueH0gJHtkcmFnUHgudG8ueSAtIDE0fXYyOGBcIiAvPlxuICAgICAgPHRleHRcbiAgICAgICAgOng9XCJkcmFnUHgudG8ueCArIDE0XCJcbiAgICAgICAgOnk9XCJkcmFnUHgudG8ueSAtIDEyXCJcbiAgICAgID57eyBkcmFnVGV4dCB9fTwvdGV4dD5cbiAgICA8L3N2Zz5cblxuICAgIDxzdmdcbiAgICAgIHYtaWY9XCJzZWxlY3RlZCAmJiBhbmNob3IgJiYgbGVhZGVyICYmICFzY3JlZW5PcGVuXCJcbiAgICAgIGNsYXNzPVwibTEtcGFydHNfX2xlYWRlclwiXG4gICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgID5cbiAgICAgIDxjaXJjbGVcbiAgICAgICAgOmN4PVwiYW5jaG9yLnhcIlxuICAgICAgICA6Y3k9XCJhbmNob3IueVwiXG4gICAgICAgIHI9XCIyLjVcIlxuICAgICAgLz5cbiAgICAgIDxsaW5lXG4gICAgICAgIDp4MT1cImFuY2hvci54XCJcbiAgICAgICAgOnkxPVwiYW5jaG9yLnlcIlxuICAgICAgICA6eDI9XCJsZWFkZXIueFwiXG4gICAgICAgIDp5Mj1cImxlYWRlci55XCJcbiAgICAgIC8+XG4gICAgPC9zdmc+XG4gICAgPGRpdlxuICAgICAgdi1pZj1cInNlbGVjdGVkICYmICFzY3JlZW5PcGVuXCJcbiAgICAgIHJlZj1cImxhYmVsXCJcbiAgICAgIGNsYXNzPVwibTEtcGFydHNfX2xhYmVsXCJcbiAgICAgIDpjbGFzcz1cIltgbTEtcGFydHNfX2xhYmVsLS0ke3NpZGV9YCwgeyAnbTEtcGFydHNfX2xhYmVsLS1pbmZvJzogIWludGVyYWN0aXZlIH1dXCJcbiAgICAgIGRhdGEtdGlkPVwibTEtcGFydHMtbGFiZWxcIlxuICAgICAgOmRhdGEtcGFydD1cInNlbGVjdGVkXCJcbiAgICAgIEBwb2ludGVyZW50ZXI9XCJvbkxhYmVsRW50ZXJcIlxuICAgICAgQHBvaW50ZXJsZWF2ZT1cIm9uTGFiZWxMZWF2ZVwiXG4gICAgICBAcG9pbnRlcmRvd249XCJob3ZlclBpY2tlZCA9IGZhbHNlXCJcbiAgICAgIEBmb2N1c2luPVwiaG92ZXJQaWNrZWQgPSBmYWxzZVwiXG4gICAgPlxuICAgICAgPGI+e3sgbmFtZXNbc2VsZWN0ZWRdIH19PC9iPlxuICAgICAgPHNwYW4gY2xhc3M9XCJtMS1wYXJ0c19fZmFjdFwiPnt7IGZhY3RzW3NlbGVjdGVkXSB9fTwvc3Bhbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtaWY9XCJyZWZ1c2VkXCJcbiAgICAgICAgY2xhc3M9XCJtMS1wYXJ0c19fcmVmdXNlZFwiXG4gICAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgICBkYXRhLXRpZD1cIm0xLWRyYWctcmVmdXNlZFwiXG4gICAgICA+e3sgcmVmdXNlZCB9fTwvc3Bhbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtZWxzZS1pZj1cImRyYWdIaW50XCJcbiAgICAgICAgY2xhc3M9XCJtMS1wYXJ0c19faGludFwiXG4gICAgICA+e3sgZHJhZ0hpbnQgfX08L3NwYW4+XG4gICAgICA8bTEtcGFydC1vcHRpb25zXG4gICAgICAgIHYtaWY9XCJob2xkc1BhcnRcIlxuICAgICAgICA6a2V5PVwic2VsZWN0ZWRcIlxuICAgICAgICA6cGFydD1cInNlbGVjdGVkXCJcbiAgICAgICAgQHVzZS1zY3JlZW49XCJzZWxlY3QoJ3NjcmVlbicpXCJcbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gICAgPG0xLXNjcmVlblxuICAgICAgdi1pZj1cInNjcmVlbk9wZW4gJiYgaW50ZXJhY3RpdmVcIlxuICAgICAgcmVmPVwic2NyZWVuXCJcbiAgICAgIDpmcm9tPVwic2NyZWVuRnJvbVwiXG4gICAgICA6cmVkdWNlZC1tb3Rpb249XCJyZWR1Y2VkTW90aW9uXCJcbiAgICAgIDp2aWV3ZXI9XCJ6b29tZWRJbiA/IHZpZXdlciA6IG51bGxcIlxuICAgICAgQHR1cm49XCJ2aWV3ZXIgJiYgdmlld2VyLnR1cm5Lbm9iKCRldmVudClcIlxuICAgICAgQGNsb3NlPVwic2NyZWVuT3BlbiA9IGZhbHNlXCJcbiAgICAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiBmcm9tICdAL21peGlucy9jb250cm9sJ1xuaW1wb3J0IE0xUGFydE9wdGlvbnMgZnJvbSAnLi9NMVBhcnRPcHRpb25zLnZ1ZSdcbmltcG9ydCBNMVNjcmVlbiBmcm9tICcuL00xU2NyZWVuLnZ1ZSdcbmltcG9ydCB7IFBBUlRfSURTLCBQQVJUX05BTUVTLCB0eXBlIFBhcnRJZCB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvcGFydHMnXG5pbXBvcnQgeyBheGlzRWRnZXMsIGJvdW5kQ29ybmVycyB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvZHJhZy1ib3VuZHMnXG5pbXBvcnQgeyBLbm9iV2hlZWwgfSBmcm9tICdAL3NlcnZpY2VzL20xLTNkL2tub2InXG5pbXBvcnQgeyBIRUFEX1BMQU5FX1ksIGNsYW1wTW0sIGhlYWRUb1dvcmxkLCBwbGF0ZURyYWdaLCBwbGF0ZVRvcEZvclosIHJlbGVhc2VQbGFjZSwgdGlja3MsIHdvcmxkVG9IZWFkLCB6Rm9yUGxhdGVUb3AgfSBmcm9tICdAL3NlcnZpY2VzL20xLTNkL2RyYWctbWFwJ1xuaW1wb3J0IHR5cGUgeyBNMVZpZXdlciB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2Qvdmlld2VyJ1xuaW1wb3J0IHsgbW9kZWxBbmltYXRlcyB9IGZyb20gJ0Avc2VydmljZXMvbTEtM2QvcmVuZGVyLW9wdGlvbnMnXG5pbXBvcnQgeyBtb2RlbFNldHRpbmdzIH0gZnJvbSAnQC9zZXJ2aWNlcy9tMS0zZC9kZXZpY2Utc2V0dGluZ3MnXG5cbi8qKiBBIGRyYWcgb24gdGhlIHRvb2xoZWFkIChYIGFuZCBZKSBvciB0aGUgcGxhdGUgKFopLCBpbiB0aGUgcHJpbnRlcidzIHRvb2xoZWFkIG1pbGxpbWV0cmVzLiAqL1xuY29uc3Qgcm91bmQgPSAocDogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9KSA9PiAoeyB4OiBNYXRoLnJvdW5kKHAueCksIHk6IE1hdGgucm91bmQocC55KSB9KVxudHlwZSBQeCA9IHsgZnJvbTogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9LCB0bzogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9IH0gfCBudWxsXG5jb25zdCBzYW1lUHggPSAoYTogUHgsIGI6IFB4KSA9PiBhID09PSBiIHx8ICghIWEgJiYgISFiICYmIGEuZnJvbS54ID09PSBiLmZyb20ueCAmJiBhLmZyb20ueSA9PT0gYi5mcm9tLnkgJiYgYS50by54ID09PSBiLnRvLnggJiYgYS50by55ID09PSBiLnRvLnkpXG5cbmludGVyZmFjZSBQYXJ0RHJhZyB7XG4gIHBhcnQ6ICd0b29saGVhZCcgfCAncGxhdGUnO1xuICAvKiogVGhlIHByaW50ZXIgdGhlIGRyYWcgYmVnYW4gb246IGEgc3dpdGNoIG1pZC1kcmFnIGRyb3BzIGl0LiAqL1xuICBwcmludGVyOiBzdHJpbmc7XG4gIHRhcmdldDogeyBYOiBudW1iZXIsIFk6IG51bWJlciB9IHwgeyBaOiBudW1iZXIgfTtcbiAgLyoqIEZvciB0aGUgcGxhdGU6IHRoZSBiZWQncyBaIGFuZCB0aGUgaGVpZ2h0IHRoZSBwb2ludGVyIG1ldCBpdCBhdCwgd2hlbiB0aGUgZHJhZyBiZWdhbi4gKi9cbiAgc3RhcnRaPzogbnVtYmVyO1xuICBzdGFydFk/OiBudW1iZXI7XG59XG5cbi8qKlxuICogT2ZmIGEgcGFydCBvbnRvIGVtcHR5IHN0YWdlLCB0aGUgZ2xvdyBzdGF5cyB0aGlzIGxvbmc6IGVub3VnaCB0byBicmlkZ2UgYVxuICogZ2FwIGJldHdlZW4gYSBwYXJ0J3MgbWVzaGVzIHdpdGhvdXQgYSBmbGlja2VyLCBzaG9ydCBlbm91Z2ggdG8gcmVhZCBhc1xuICogaW5zdGFudC4gRnJvbSBvbmUgcGFydCBzdHJhaWdodCB0byBhbm90aGVyIGl0IG1vdmVzIGF0IG9uY2UuXG4gKi9cbmNvbnN0IExFQVZFX01TID0gMTIwXG4vKiogQSBwYXJ0IHBpY2tlZCBieSBwb2ludGluZyBsZXRzIGdvIHRoaXMgbG9uZyBhZnRlciB0aGUgcG9pbnRlciBsZWF2ZXMgaXQsIHVubGVzcyB0aGUgcG9pbnRlciBpcyBvbiBpdHMgcGFuZWwgYnkgdGhlbi4gKi9cbmNvbnN0IEhPVkVSX1JFTEVBU0VfTVMgPSA3MDBcbi8qKiBBIHByZXNzIHRoYXQgbW92ZXMgbGVzcyB0aGFuIHRoaXMgaXMgYSBjbGljayBvciBhIHRhcCwgbm90IGEgZHJhZy4gKi9cbmNvbnN0IFRBUF9QWCA9IDEwXG4vKiogVGhlIGxhYmVsIGZvbGxvd3MgdGhlIHBhcnQgd2hpbGUgdGhlIGNhbWVyYSBlYXNlcywgZm9yIHRoaXMgbG9uZyBhZnRlciBhIGNoYW5nZS4gKi9cbmNvbnN0IEZPTExPV19NUyA9IDcwMFxuLyoqIFRoZSBsYWJlbCdzIGRpc3RhbmNlIGZyb20gdGhlIHN0YWdlJ3MgdG9wIGFuZCBzaWRlLCBhcyBpdHMgc3R5bGUgaGFzIGl0LiAqL1xuY29uc3QgTEFCRUxfSU5TRVQgPSAxNlxuXG4vKipcbiAqIFRoZSBwYXJ0cyBvZiB0aGUgTTEgYSBwZXJzb24gY2FuIHBvaW50IGF0IG9uIHRoZSBPdmVydmlldyBzdGFnZVxuICogKGNvbnRyb2wtbW9ja3Vwcy92My9vdmVydmlldy0zZCwgSmFjaydzIE9LIDYgTm92KTogaG92ZXJpbmcgb25lIGdsb3dzIGl0IGluXG4gKiB0aGUgYWNjZW50IGFuZCBsZWFucyB0aGUgY2FtZXJhIHRvd2FyZCBpdDsgYSBjbGljaywgYSB0YXAgb3IgdGhlIGtleWJvYXJkXG4gKiBzZWxlY3RzIGl0LCBhbmQgb25seSB0aGVuIGEgcXVpZXQgcGFuZWwgbmFtZXMgaXQgd2l0aCBvbmUgbGl2ZSBmYWN0LCBvdXQgb2ZcbiAqIHRoZSB3YXkgaW4gYSB0b3AgY29ybmVyLCBqb2luZWQgdG8gdGhlIHBhcnQgYnkgYSBoYWlybGluZSwgd2l0aCB0aGUgcGFydCdzXG4gKiBvcHRpb25zIHVuZGVyIGl0IChNMVBhcnRPcHRpb25zKS4gTm90IGlkbGUsIG9yIG5vdCB0aGUgcGVyc29uJ3MgdG9cbiAqIGNvbnRyb2wsIGEgcGFydCBpcyBvbmx5IG5hbWVkLCBpbiBncmV5LCB3aXRoIG5vIGxlYW4gYW5kIG5vIG9wdGlvbnMuXG4gKlxuICogU2VsZWN0ZWQsIHRoZSB0b29saGVhZCBhbmQgdGhlIHBsYXRlIGNhbiBiZSBkcmFnZ2VkIChKYWNrLCA2IE5vdik6IHRoZVxuICogdG9vbGhlYWQncyBjYW1lcmEgbG9va3Mgc3RyYWlnaHQgZG93biwgdGhlIHBsYXRlIGhpZGRlbiwgd2l0aCBYIGFuZCBZXG4gKiBtYXJrZWQgYWxvbmcgdGhlIGJvdHRvbSBhbmQgbGVmdDsgYSB0YXJnZXQgZm9sbG93cyB0aGUgY3Vyc29yIHdpdGggYSBsaXZlXG4gKiBsaW5lIGZyb20gd2hlcmUgdGhlIHBhcnQgaXMuIExldHRpbmcgZ28gc2VuZHMgdGhlIG1vdmUgdGhyb3VnaCBtb3ZlVG8gYW5kXG4gKiB0aGUgbm8tZ28gcGxhbm5lci4gTm90aGluZyBoZXJlIGJ1aWxkcyBHLWNvZGUgb2YgaXRzIG93bi5cbiAqXG4gKiBUaGUgY2hpcHMgYXJlIHRoZSBzYW1lIHBhcnRzIGFzIHBsYWluIGJ1dHRvbnM6IGEgcm93IHVuZGVyIHRoZSBzdGFnZSBvbiBhXG4gKiB0b3VjaCBzY3JlZW4sIGFuZCBmb3IgdGhlIGtleWJvYXJkIGFuZCBzY3JlZW4gcmVhZGVycyBldmVyeXdoZXJlIChoaWRkZW5cbiAqIG9uIGEgZGVza3RvcCB1bnRpbCBmb2N1c2VkKS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTTFQYXJ0T3B0aW9ucywgTTFTY3JlZW4gfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTTFQYXJ0cyBleHRlbmRzIE1peGlucyhDb250cm9sTWl4aW4pIHtcbiAgLyoqIFRoZSBsaXZlIHZpZXdlciwgb25jZSBpdCBkcmF3cy4gKi9cbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgdmlld2VyITogTTFWaWV3ZXIgfCBudWxsXG5cbiAgQFByb3AoeyB0eXBlOiBIVE1MQ2FudmFzRWxlbWVudCwgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSBjYW52YXMhOiBIVE1MQ2FudmFzRWxlbWVudCB8IG51bGxcblxuICAvKiogVGhlIHN0YWdlJ3Mgb3duIHN0YXRlOiBvZmZsaW5lLCBwcmludGluZyBvciBpZGxlLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ2lkbGUnIH0pXG4gIHJlYWRvbmx5IHN0YWdlU3RhdGUhOiBzdHJpbmdcblxuICByZWFkb25seSBpZHMgPSBQQVJUX0lEU1xuICByZWFkb25seSBuYW1lcyA9IFBBUlRfTkFNRVNcblxuICBob3ZlcmVkOiBQYXJ0SWQgfCBudWxsID0gbnVsbFxuICBzZWxlY3RlZDogUGFydElkIHwgbnVsbCA9IG51bGxcbiAgLyoqIFRoZSBzZWxlY3RlZCBwYXJ0J3MgbWlkZGxlIG9uIHRoZSBzdGFnZSwgYW5kIHdoZXJlIHRoZSBsaW5lIG1lZXRzIHRoZSBsYWJlbC4gKi9cbiAgYW5jaG9yOiB7IHg6IG51bWJlciwgeTogbnVtYmVyIH0gfCBudWxsID0gbnVsbFxuICBsZWFkZXI6IHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfSB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgbGFiZWwgc2l0cyBpbiB0aGUgdG9wIGNvcm5lciBhd2F5IGZyb20gdGhlIHBhcnQsIG91dCBvZiB0aGUgd2F5LiAqL1xuICBzaWRlOiAnbGVmdCcgfCAncmlnaHQnID0gJ3JpZ2h0J1xuICBmb2N1c0luZGV4ID0gMFxuICB0b3VjaCA9IGZhbHNlXG4gIHJlZHVjZWRNb3Rpb24gPSBmYWxzZVxuXG4gIGxlYXZlVGltZXIgPSAwXG4gIC8qKiBUaGUgc2VsZWN0aW9uIHdhcyBtYWRlIGJ5IHBvaW50aW5nICh0aGUgZmlsYW1lbnQsIEphY2sgMTEgTm92KSwgbm90IGNsaWNrZWQ6IGl0IGdvZXMgYWdhaW4gd2hlbiB0aGUgcG9pbnRlciBnb2VzIGF3YXkuICovXG4gIGhvdmVyUGlja2VkID0gZmFsc2VcbiAgcmVsZWFzZVRpbWVyID0gMFxuICBsYWJlbE92ZXIgPSBmYWxzZVxuICBwaWNrRnJhbWUgPSAwXG4gIC8qKiBUaGUgbmV3ZXN0IHBvaW50ZXIgcG9zaXRpb24gd2FpdGluZyBmb3IgdGhlIG5leHQgZnJhbWUncyBwaWNrLiAqL1xuICBwaWNrQXQ6IHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfSB8IG51bGwgPSBudWxsXG4gIGZvbGxvd0ZyYW1lID0gMFxuICBmb2xsb3dVbnRpbCA9IDBcbiAgZG93bjogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9IHwgbnVsbCA9IG51bGxcbiAgZHJhZ2dlZCA9IGZhbHNlXG4gIGJvdW5kOiBIVE1MQ2FudmFzRWxlbWVudCB8IG51bGwgPSBudWxsXG4gIG1vdGlvblF1ZXJ5OiBNZWRpYVF1ZXJ5TGlzdCB8IG51bGwgPSBudWxsXG5cbiAgZHJhZzogUGFydERyYWcgfCBudWxsID0gbnVsbFxuICAvKiogVGhlIHBvaW50ZXIgYSBkcmFnIG1heSBjb21lIGZyb206IG9uZSB0aGF0IHdlbnQgZG93biBvbiB0aGUgc2VsZWN0ZWQgcGFydCB3aXRoIHRoZSBtYWluIGJ1dHRvbi4gTnVsbCBmb3IgYW55dGhpbmcgZWxzZS4gKi9cbiAgZHJhZ1BvaW50ZXI6IG51bWJlciB8IG51bGwgPSBudWxsXG4gIGRyYWdQeDogeyBmcm9tOiB7IHg6IG51bWJlciwgeTogbnVtYmVyIH0sIHRvOiB7IHg6IG51bWJlciwgeTogbnVtYmVyIH0gfSB8IG51bGwgPSBudWxsXG4gIGF4aXNNYXJrczogeyB4OiBBcnJheTx7IHY6IG51bWJlciwgcHg6IG51bWJlciwgYXQ6IG51bWJlciB9PiwgeTogQXJyYXk8eyB2OiBudW1iZXIsIHB4OiBudW1iZXIsIGF0OiBudW1iZXIgfT4gfSB8IG51bGwgPSBudWxsXG4gIC8qKiBMb29raW5nIGRvd246IHRoZSBjb3JuZXJzIG9mIHdoZXJlIHRoZSBoZWFkIGNhbiBnbywgYW5kIHRoZSBiZWQncyBub3RjaCwgYXMgZHJhd24gbm93LiAqL1xuICBib3VuZHNQeDogeyBjb3JuZXJzOiBzdHJpbmcsIG5vdGNoOiBzdHJpbmdbXSB9IHwgbnVsbCA9IG51bGxcbiAgLyoqIFdoeSB0aGUgbGFzdCBkcmFnJ3MgbW92ZSB3YXMgcmVmdXNlZCwgc2FpZCBpbiB0aGUgbGFiZWwgdW50aWwgdGhlIG5leHQgZHJhZy4gKi9cbiAgcmVmdXNlZCA9ICcnXG4gIC8qKiBUaGUgcHJpbnRlcidzIG93biBzY3JlZW4sIG9wZW4gb3ZlciB0aGUgc3RhZ2UuICovXG4gIHNjcmVlbk9wZW4gPSBmYWxzZVxuICAvKiogV2hlcmUgdGhlIHNjcmVlbiB3YXMgb24gdGhlIHN0YWdlIHdoZW4gaXQgb3BlbmVkOiB0aGUgem9vbSBmbGllcyBpbiBmcm9tIHRoZXJlIGFuZCBiYWNrIG91dCB0byBpdC4gKi9cbiAgc2NyZWVuRnJvbTogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9IHwgbnVsbCA9IG51bGxcblxuICAvKipcbiAgICogVGhlIGNhbWVyYSBob2xkcyBzdGlsbCB3aGlsZSB0aGUgdG9vbGhlYWQgb3IgdGhlIHBsYXRlIGlzIHNlbGVjdGVkIG9uIGFuXG4gICAqIGlkbGUgcHJpbnRlciAoSmFjaywgOSBOb3YpOiBhIGRyYWcgdGhlcmUgbW92ZXMgdGhlIHBhcnQsIG5ldmVyIHRoZSB2aWV3LFxuICAgKiBhbmQgYSBkcmFnIG9uIGVtcHR5IHN0YWdlIGxlYXZlcyB0aGUgc2VsZWN0aW9uIGFzIGl0IGlzLlxuICAgKi9cbiAgZ2V0IGNhbWVyYUxvY2tlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMudG9wVmlldyB8fCB0aGlzLnpvb21lZEluIHx8ICh0aGlzLnNlbGVjdGVkID09PSAncGxhdGUnICYmIHRoaXMuaW50ZXJhY3RpdmUpXG4gIH1cblxuICBAV2F0Y2goJ2NhbWVyYUxvY2tlZCcpXG4gIG9uQ2FtZXJhTG9ja2VkIChsb2NrZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5kcmFnUG9pbnRlciA9PT0gbnVsbCkgdGhpcy52aWV3ZXI/LnNldE9yYml0KCFsb2NrZWQpXG4gIH1cblxuICAvKiogUGFydHMgb2ZmZXIgdGhlaXIgb3B0aW9ucyBvbmx5IG9uIGFuIGlkbGUgcHJpbnRlciB0aGlzIHBlcnNvbiBjYW4gY29udHJvbC4gKi9cbiAgZ2V0IGludGVyYWN0aXZlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGFnZVN0YXRlID09PSAnaWRsZScgJiYgdGhpcy5jb250cm9sUmVhZHkgJiYgIXRoaXMuYnVzeVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBwcmludGVyIHJlcG9ydHMgYnVzeSBidXQgaXQgaXMgbm90IGEgcHJpbnQ6IHRoaXMgcGFnZSdzIG93biBIb21lIG9yIGpvZywgYSBtYWNybywgYW5vdGhlciBjbGllbnQuIFRoZSBwcmludGVyXG4gICAqIHJlcG9ydHMgYnVzeSB3aGlsZSB0aGUgaGVhZCBtb3Zlcywgd2hpY2ggd291bGQgbWFrZSB0aGUgc3RhZ2UgbGV0IGdvIG9mIHRoZSBwYXJ0ICh0aGUgY2FtZXJhIGxlYXZlcyB0aGUgdG9wIHZpZXcsIHRoZVxuICAgKiBvcHRpb25zIGdvKTogdGhlIHBlcnNvbiBjaG9zZSB0aGF0IHZpZXcsIHNvIGl0IHN0YXlzIHVudGlsIHRoZXkgY2hhbmdlIGl0IChLQU4tMzU5MyBmb3IgSG9tZSwgS0FOLTQ4MTYgZm9yIGFueSBtb3ZlOlxuICAgKiB0aGUgb3duLW1vdmUgd2luZG93IGNhbiBlbmQgb3IgbWlzcyB3aGlsZSB0aGUgaGVhZCBpcyBzdGlsbCBtb3ZpbmcpLiBBIHJlYWwgcHJpbnQgc3RpbGwgbGV0cyBnby5cbiAgICovXG4gIGdldCBidXN5SGVyZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFJlYWR5ICYmICF0aGlzLnByaW50TG9ja2VkICYmIHRoaXMuc3RhZ2VTdGF0ZSA9PT0gJ3ByaW50aW5nJ1xuICB9XG5cbiAgLyoqIFRoZSBwYXJ0J3MgdmlldyBhbmQgb3B0aW9ucyBzdGF5OiB0aGUgcHJpbnRlciBpcyBpZGxlLCBvciBpcyBvbmx5IHJ1bm5pbmcgdGhpcyBwYWdlJ3Mgb3duIEhvbWUuICovXG4gIGdldCBob2xkc1BhcnQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmludGVyYWN0aXZlIHx8IHRoaXMuYnVzeUhlcmVcbiAgfVxuXG4gIC8qKiBUaGUgc2VsZWN0ZWQgcGFydCBjYW4gYmUgZHJhZ2dlZDogdGhlIHRvb2xoZWFkIGluIFggYW5kIFksIHRoZSBwbGF0ZSBpbiBaLCBvbmNlIGhvbWVkLCBvbiB0aGUgYWNjdXJhdGUgbW9kZWwgKHdob3NlIG1pbGxpbWV0cmVzIHRoZSBkcmFnIGlzIHJlYWQgaW4pLiAqL1xuICBnZXQgbW92YWJsZSAoKTogJ3Rvb2xoZWFkJyB8ICdwbGF0ZScgfCBudWxsIHtcbiAgICBjb25zdCBwYXJ0ID0gdGhpcy5zZWxlY3RlZFxuICAgIGlmICghdGhpcy5pbnRlcmFjdGl2ZSB8fCAhdGhpcy52aWV3ZXI/LmFjY3VyYXRlKSByZXR1cm4gbnVsbFxuICAgIGlmIChwYXJ0ID09PSAndG9vbGhlYWQnICYmIHRoaXMuaXNIb21lZCgnWFknKSkgcmV0dXJuICd0b29saGVhZCdcbiAgICBpZiAocGFydCA9PT0gJ3BsYXRlJyAmJiB0aGlzLmlzSG9tZWQoJ1onKSkgcmV0dXJuICdwbGF0ZSdcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLyoqIFRoZSB0b29saGVhZCBzZWxlY3RlZDogbG9vayBzdHJhaWdodCBkb3duIGZvciBjbGVhciBheGVzLCB0aGUgcGxhdGUgb3V0IG9mIHRoZSB3YXkuICovXG4gIGdldCB0b3BWaWV3ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RlZCA9PT0gJ3Rvb2xoZWFkJyAmJiB0aGlzLmhvbGRzUGFydCAmJiAhIXRoaXMudmlld2VyPy5hY2N1cmF0ZVxuICB9XG5cbiAgZ2V0IGRyYWdIaW50ICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vdmFibGUgPT09ICd0b29saGVhZCcpIHJldHVybiAnRHJhZyB0aGUgaGVhZCB0byBtb3ZlIGl0J1xuICAgIGlmICh0aGlzLm1vdmFibGUgPT09ICdwbGF0ZScpIHJldHVybiAnRHJhZyB0aGUgcGxhdGUgdXAgb3IgZG93biB0byBtb3ZlIGl0J1xuICAgIGlmICgodGhpcy5zZWxlY3RlZCA9PT0gJ3Rvb2xoZWFkJyB8fCB0aGlzLnNlbGVjdGVkID09PSAncGxhdGUnKSAmJiB0aGlzLmludGVyYWN0aXZlICYmICF0aGlzLmlzSG9tZWQoJ1hZWicpKSByZXR1cm4gJ0hvbWUgaXQgdG8gbW92ZSBpdCBieSBoYW5kJ1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgZ2V0IGRyYWdUZXh0ICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHQgPSB0aGlzLmRyYWc/LnRhcmdldFxuICAgIGlmICghdCkgcmV0dXJuICcnXG4gICAgcmV0dXJuICdaJyBpbiB0ID8gYFogJHt0LloudG9GaXhlZCgxKX1gIDogYFggJHt0LlgudG9GaXhlZCgxKX0gIFkgJHt0LlkudG9GaXhlZCgxKX1gXG4gIH1cblxuICBnZXQgc2hvd25QYXJ0ICgpOiBQYXJ0SWQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RlZCA/PyB0aGlzLmhvdmVyZWRcbiAgfVxuXG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXREaXNwbGF5TmFtZSddIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgfHwgJ1RoZSBwcmludGVyJ1xuICB9XG5cbiAgLyoqIE9uZSBsaXZlIGZhY3QgcGVyIHBhcnQsIGFzIHRoZSBsYWJlbCBhbmQgdGhlIGJ1dHRvbiBuYW1lIHNheSBpdC4gKi9cbiAgZ2V0IGZhY3RzICgpOiBSZWNvcmQ8UGFydElkLCBzdHJpbmc+IHtcbiAgICBjb25zdCBwcmludGVyID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgY29uc3QgZGVnID0gKHQ6IHVua25vd24pID0+IHR5cGVvZiB0ID09PSAnbnVtYmVyJyA/IGAke01hdGgucm91bmQodCl9IMKwQ2AgOiAn4oCTIMKwQydcbiAgICBjb25zdCBob21lZCA9ICgocHJpbnRlci50b29saGVhZD8uaG9tZWRfYXhlcyBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKS5sZW5ndGggPj0gM1xuICAgIGNvbnN0IG1lc2ggPSAocHJpbnRlci5iZWRfbWVzaD8ucHJvZmlsZV9uYW1lIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgPz8gJydcbiAgICBjb25zdCBtYXRlcmlhbCA9IHRoaXMubG9hZGVkTWF0ZXJpYWxcbiAgICByZXR1cm4ge1xuICAgICAgcGxhdGU6IGAke2RlZyhwcmludGVyLmhlYXRlcl9iZWQ/LnRlbXBlcmF0dXJlKX0gwrcgJHttZXNoID8gJ21lc2ggbG9hZGVkJyA6ICdubyBtZXNoJ31gLFxuICAgICAgdG9vbGhlYWQ6IGAke2RlZyhwcmludGVyLmV4dHJ1ZGVyPy50ZW1wZXJhdHVyZSl9IMK3ICR7aG9tZWQgPyAnaG9tZWQnIDogJ25vdCBob21lZCd9YCxcbiAgICAgIGZpbGFtZW50OiBtYXRlcmlhbCA/IG1hdGVyaWFsLm5hbWUgOiAnTm8gbWF0ZXJpYWwgbG9hZGVkJyxcbiAgICAgIHNjcmVlbjogXCJUaGUgcHJpbnRlcidzIG93biBzY3JlZW5cIlxuICAgIH1cbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMudG91Y2ggPSB3aW5kb3cubWF0Y2hNZWRpYT8uKCcocG9pbnRlcjogY29hcnNlKScpLm1hdGNoZXMgPz8gZmFsc2VcbiAgICB0aGlzLm1vdGlvblF1ZXJ5ID0gd2luZG93Lm1hdGNoTWVkaWE/LignKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKSA/PyBudWxsXG4gICAgdGhpcy5yZWR1Y2VkTW90aW9uID0gISF0aGlzLm1vdGlvblF1ZXJ5Py5tYXRjaGVzXG4gICAgdGhpcy5tb3Rpb25RdWVyeT8uYWRkRXZlbnRMaXN0ZW5lcj8uKCdjaGFuZ2UnLCB0aGlzLm9uTW90aW9uUHJlZilcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbkVzY2FwZSlcbiAgICB0aGlzLmJpbmQodGhpcy5jYW52YXMpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLmJpbmQobnVsbClcbiAgICB0aGlzLm1vdGlvblF1ZXJ5Py5yZW1vdmVFdmVudExpc3RlbmVyPy4oJ2NoYW5nZScsIHRoaXMub25Nb3Rpb25QcmVmKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uRXNjYXBlKVxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxlYXZlVGltZXIpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucmVsZWFzZVRpbWVyKVxuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucGlja0ZyYW1lKVxuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuZm9sbG93RnJhbWUpXG4gICAgdGhpcy52aWV3ZXI/LnNldEZvY3VzKG51bGwsICdpbmZvJywgZmFsc2UpXG4gICAgdGhpcy52aWV3ZXI/LnNldFZpZXcoJ2ZyZWUnKVxuICAgIHRoaXMudmlld2VyPy5zZXRPcmJpdCh0cnVlKVxuICB9XG5cbiAgb25Nb3Rpb25QcmVmIChlOiBNZWRpYVF1ZXJ5TGlzdEV2ZW50KSB7XG4gICAgdGhpcy5yZWR1Y2VkTW90aW9uID0gZS5tYXRjaGVzXG4gICAgdGhpcy5zaG93KClcbiAgfVxuXG4gIEBXYXRjaCgnY2FudmFzJylcbiAgYmluZCAoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCB8IG51bGwpIHtcbiAgICBjb25zdCBvbGQgPSB0aGlzLmJvdW5kXG4gICAgaWYgKG9sZCkge1xuICAgICAgb2xkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgdGhpcy5vbk1vdmUpXG4gICAgICBvbGQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxlYXZlJywgdGhpcy5vbkxlYXZlKVxuICAgICAgb2xkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5vbldoZWVsKVxuICAgICAgb2xkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgdGhpcy5vbkRvd24sIHRydWUpXG4gICAgICBvbGQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgdGhpcy5vblVwKVxuICAgICAgb2xkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCB0aGlzLm9uQ2FuY2VsKVxuICAgICAgb2xkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvc3Rwb2ludGVyY2FwdHVyZScsIHRoaXMub25DYW5jZWwpXG4gICAgICBvbGQuc3R5bGUuY3Vyc29yID0gJydcbiAgICAgIG9sZC5zdHlsZS50b3VjaEFjdGlvbiA9ICcnXG4gICAgfVxuICAgIHRoaXMuYm91bmQgPSBjYW52YXNcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgdGhpcy5vbk1vdmUpXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsZWF2ZScsIHRoaXMub25MZWF2ZSlcbiAgICAvLyBOb3QgcGFzc2l2ZTogd2l0aCB0aGUgcHJpbnRlcidzIHNjcmVlbiBvcGVuIGEgc2Nyb2xsIHR1cm5zIHRoZSBtb2RlbCdzIGtub2IgYW5kIG11c3Qgbm90IGFsc28gc2Nyb2xsIHRoZSBwYWdlLlxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMub25XaGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9KVxuICAgIC8vIEluIHRoZSBjYXB0dXJlIHBoYXNlLCBzbyBpdCBydW5zIGJlZm9yZSB0aGUgdmlld2VyJ3Mgb3duIHBvaW50ZXJkb3duIGFuZCBjYW4ga2VlcCBhIGRyYWcgb24gYSBwYXJ0IGZyb20gYWxzbyB0dXJuaW5nIHRoZSBtb2RlbC5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCB0aGlzLm9uRG93biwgdHJ1ZSlcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgdGhpcy5vblVwKVxuICAgIC8vIEEgdG91Y2ggdGhhdCBiZWNvbWVzIGEgcGFnZSBzY3JvbGwgZW5kcyBoZXJlLCBub3QgaW4gcG9pbnRlcnVwLlxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgdGhpcy5vbkNhbmNlbClcbiAgICAvLyBDYXB0dXJlIGxvc3QgbWlkLWRyYWcgKGZvY3VzIGdvbmUsIGEgY29udGV4dCBtZW51KTogdGhlIGRyYWcgZW5kcyBhbmQgc2VuZHMgbm90aGluZy5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbG9zdHBvaW50ZXJjYXB0dXJlJywgdGhpcy5vbkNhbmNlbClcbiAgICBpZiAodGhpcy5tb3ZhYmxlKSBjYW52YXMuc3R5bGUudG91Y2hBY3Rpb24gPSAnbm9uZSdcbiAgfVxuXG4gIC8qKiBFbmRzIGFueSBkcmFnIGFuZCBzZW5kcyBub3RoaW5nLiAqL1xuICBvbkNhbmNlbCAoKSB7XG4gICAgdGhpcy5kb3duID0gbnVsbFxuICAgIHRoaXMuZHJhZ2dlZCA9IGZhbHNlXG4gICAgdGhpcy5kcmFnID0gbnVsbFxuICAgIHRoaXMuZHJhZ1B4ID0gbnVsbFxuICAgIHRoaXMuZHJhZ1BvaW50ZXIgPSBudWxsXG4gICAgdGhpcy52aWV3ZXI/LmhvbGRQYW4oZmFsc2UpXG4gICAgdGhpcy52aWV3ZXI/LnNldE9yYml0KCF0aGlzLmNhbWVyYUxvY2tlZClcbiAgfVxuXG4gIG9uRG93biAoZTogUG9pbnRlckV2ZW50KSB7XG4gICAgLy8gQSBzZWNvbmQgZmluZ2VyLCBvciBhbnkgbmV3IHByZXNzLCBlbmRzIGEgZHJhZyBpbiBwcm9ncmVzcyB3aXRob3V0IHNlbmRpbmcgaXQuXG4gICAgaWYgKHRoaXMuZHJhZyB8fCB0aGlzLmRyYWdQb2ludGVyICE9PSBudWxsKSB7XG4gICAgICB0aGlzLm9uQ2FuY2VsKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmRvd24gPSB7IHg6IGUuY2xpZW50WCwgeTogZS5jbGllbnRZIH1cbiAgICB0aGlzLmRyYWdnZWQgPSBmYWxzZVxuICAgIC8vIEEgcGFydCBtb3ZlcyBvbmx5IGJ5IGEgZHJhZyB0aGF0IHN0YXJ0cyBvbiBpdCwgd2l0aCB0aGUgbWFpbiBidXR0b24uXG4gICAgY29uc3Qgb25QYXJ0ID0gISF0aGlzLm1vdmFibGUgJiYgZS5idXR0b24gPT09IDAgJiYgZS5pc1ByaW1hcnkgJiYgdGhpcy52aWV3ZXI/LnBpY2soZS5jbGllbnRYLCBlLmNsaWVudFkpID09PSB0aGlzLm1vdmFibGVcbiAgICB0aGlzLnZpZXdlcj8uc2V0T3JiaXQoIW9uUGFydCAmJiAhdGhpcy5jYW1lcmFMb2NrZWQpXG4gICAgaWYgKG9uUGFydCkge1xuICAgICAgdGhpcy5kcmFnUG9pbnRlciA9IGUucG9pbnRlcklkXG4gICAgICAvLyBUaGUgY2FtZXJhIHN0YXlzIHdoZXJlIGl0IGlzIHdoaWxlIHRoZSBwYXJ0IGlzIGRyYWdnZWQsIHNvIHRoZSB0YXJnZXQgc3RheXMgdW5kZXIgdGhlIHBvaW50ZXIuXG4gICAgICB0aGlzLnZpZXdlcj8uaG9sZFBhbih0cnVlKVxuICAgICAgdGhpcy5ib3VuZD8uc2V0UG9pbnRlckNhcHR1cmU/LihlLnBvaW50ZXJJZClcbiAgICB9XG4gIH1cblxuICBvbk1vdmUgKGU6IFBvaW50ZXJFdmVudCkge1xuICAgIGlmICh0aGlzLmRyYWdQb2ludGVyICE9PSBudWxsKSB7XG4gICAgICBpZiAoZS5wb2ludGVySWQgIT09IHRoaXMuZHJhZ1BvaW50ZXIpIHJldHVyblxuICAgICAgaWYgKHRoaXMuZHJhZyB8fCAodGhpcy5kb3duICYmIE1hdGguaHlwb3QoZS5jbGllbnRYIC0gdGhpcy5kb3duLngsIGUuY2xpZW50WSAtIHRoaXMuZG93bi55KSA+IFRBUF9QWCkpIHtcbiAgICAgICAgdGhpcy5kcmFnZ2VkID0gdHJ1ZVxuICAgICAgICB0aGlzLmRyYWdUbyhlLmNsaWVudFgsIGUuY2xpZW50WSlcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAodGhpcy5kb3duICYmIE1hdGguaHlwb3QoZS5jbGllbnRYIC0gdGhpcy5kb3duLngsIGUuY2xpZW50WSAtIHRoaXMuZG93bi55KSA+IFRBUF9QWCkge1xuICAgICAgLy8gVHVybmluZyB0aGUgbW9kZWw6IGhvdmVyIGlzIG9mZiB1bnRpbCB0aGUgYnV0dG9uIGNvbWVzIHVwLlxuICAgICAgaWYgKCF0aGlzLmRyYWdnZWQpIHtcbiAgICAgICAgdGhpcy5kcmFnZ2VkID0gdHJ1ZVxuICAgICAgICB0aGlzLmhvdmVyZWQgPSBudWxsXG4gICAgICB9XG4gICAgICB0aGlzLmZvbGxvdygpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGUucG9pbnRlclR5cGUgPT09ICd0b3VjaCcgfHwgdGhpcy5kb3duKSByZXR1cm5cbiAgICAvLyBPbmUgcGljayBhIGZyYW1lLCBhdCB0aGUgbmV3ZXN0IHBvc2l0aW9uLiAoQ2FuY2VsbGluZyBhbmQgYXNraW5nIGFnYWluIG9uIGV2ZXJ5IG1vdmUgc3RhcnZlZCBpdDpcbiAgICAvLyBtb3ZlcyBjb21lIG9uY2UgYSBmcmFtZSB0b28sIHNvIHdoaWxlIHRoZSBwb2ludGVyIG1vdmVkIHRoZSBwaWNrIG5ldmVyIHJhbi4pXG4gICAgdGhpcy5waWNrQXQgPSB7IHg6IGUuY2xpZW50WCwgeTogZS5jbGllbnRZIH1cbiAgICBpZiAodGhpcy5waWNrRnJhbWUpIHJldHVyblxuICAgIHRoaXMucGlja0ZyYW1lID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMucGlja0ZyYW1lID0gMFxuICAgICAgY29uc3QgYXQgPSB0aGlzLnBpY2tBdFxuICAgICAgdGhpcy5waWNrQXQgPSBudWxsXG4gICAgICBpZiAoYXQpIHRoaXMub25Qb2ludCh0aGlzLnZpZXdlcj8ucGljayhhdC54LCBhdC55KSA/PyBudWxsKVxuICAgIH0pXG4gIH1cblxuICAvKiogVGhlIHBvaW50ZXIgaXMgb3ZlciB0aGlzIHBhcnQgKG9yIG5vbmUpLiAqL1xuICBvblBvaW50IChwYXJ0OiBQYXJ0SWQgfCBudWxsKSB7XG4gICAgaWYgKHRoaXMuYm91bmQpIHRoaXMuYm91bmQuc3R5bGUuY3Vyc29yID0gcGFydCAmJiB0aGlzLmludGVyYWN0aXZlID8gJ3BvaW50ZXInIDogJydcbiAgICBpZiAocGFydCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMubGVhdmVUaW1lcilcbiAgICAgIHRoaXMubGVhdmVUaW1lciA9IDBcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlbGVhc2VUaW1lcilcbiAgICAgIHRoaXMucmVsZWFzZVRpbWVyID0gMFxuICAgICAgaWYgKHBhcnQgIT09IHRoaXMuaG92ZXJlZCkgdGhpcy5ob3ZlcmVkID0gcGFydFxuICAgICAgdGhpcy5wb2ludFBpY2socGFydClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBPZmYgdGhlIHBhcnQgaXQgd2FzIHBpY2tlZCBieTogaXQgbGV0cyBnbyBzb29uLCB1bmxlc3MgdGhlIHBvaW50ZXIgaGFzIHJlYWNoZWQgaXRzIHBhbmVsLlxuICAgIGlmICh0aGlzLmhvdmVyUGlja2VkICYmICF0aGlzLmxhYmVsT3ZlciAmJiAhdGhpcy5yZWxlYXNlVGltZXIpIHtcbiAgICAgIHRoaXMucmVsZWFzZVRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbGVhc2VUaW1lciA9IDBcbiAgICAgICAgaWYgKHRoaXMuaG92ZXJQaWNrZWQgJiYgIXRoaXMubGFiZWxPdmVyKSB0aGlzLmRlc2VsZWN0KClcbiAgICAgIH0sIEhPVkVSX1JFTEVBU0VfTVMpXG4gICAgfVxuICAgIGlmICh0aGlzLmhvdmVyZWQgJiYgIXRoaXMubGVhdmVUaW1lcikge1xuICAgICAgdGhpcy5sZWF2ZVRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmxlYXZlVGltZXIgPSAwXG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IG51bGxcbiAgICAgIH0sIExFQVZFX01TKVxuICAgIH1cbiAgfVxuXG4gIG9uTGVhdmUgKGU/OiBQb2ludGVyRXZlbnQpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnBpY2tGcmFtZSlcbiAgICB0aGlzLnBpY2tGcmFtZSA9IDBcbiAgICB0aGlzLnBpY2tBdCA9IG51bGxcbiAgICB0aGlzLm9uUG9pbnQobnVsbClcbiAgICAvLyBPZmYgdGhlIHN0YWdlIGFsdG9nZXRoZXIsIHRoZSBzZWxlY3Rpb24gbGV0cyBnbyAoSmFjaywgMTEgTm92KS4gTm90IGZvciBhIGZpbmdlciAoaXQgaGFzIG5vIGN1cnNvciB0byBtb3ZlIG9mZiksXG4gICAgLy8gYSBwcmVzcyBoZWxkICh0dXJuaW5nIHRoZSBtb2RlbCwgb3IgYSBkcmFnIHRoYXQgc2VuZHMgbm90aGluZyB1bnRpbCBpdCBpcyBsZXQgZ28pLCB0aGUgcG9pbnRlciBnb2luZyBvbnRvIHRoZVxuICAgIC8vIHBhcnQncyBvd24gcGFuZWwgb3IgdGhlIHByaW50ZXIncyBzY3JlZW4sIG9yIHRoZSBzY3JlZW4gb3Blbi5cbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWQgfHwgIWUgfHwgZS5wb2ludGVyVHlwZSA9PT0gJ3RvdWNoJyB8fCB0aGlzLmRvd24gfHwgdGhpcy5kcmFnIHx8IHRoaXMuZHJhZ1BvaW50ZXIgIT09IG51bGwgfHwgdGhpcy5zY3JlZW5PcGVuKSByZXR1cm5cbiAgICBjb25zdCB0byA9IGUucmVsYXRlZFRhcmdldCBhcyBOb2RlIHwgbnVsbFxuICAgIGlmICh0byAmJiB0aGlzLiRlbC5jb250YWlucyh0bykpIHJldHVyblxuICAgIHRoaXMuZGVzZWxlY3QoKVxuICB9XG5cbiAgLyoqIExldHMgdGhlIHNlbGVjdGVkIHBhcnQgZ28uICovXG4gIGRlc2VsZWN0ICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5yZWxlYXNlVGltZXIpXG4gICAgdGhpcy5yZWxlYXNlVGltZXIgPSAwXG4gICAgdGhpcy5ob3ZlclBpY2tlZCA9IGZhbHNlXG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkKSByZXR1cm5cbiAgICB0aGlzLnNlbGVjdGVkID0gbnVsbFxuICAgIHRoaXMucmVmdXNlZCA9ICcnXG4gIH1cblxuICAvKiogUG9pbnRpbmcgYXQgdGhlIGZpbGFtZW50IHBpY2tzIGl0IChKYWNrLCAxMSBOb3Y6IGhvdmVyIHRoZSBzcG9vbCksIHNvIGl0cyBwYW5lbCBpcyB0aGVyZSB0byB1c2U7IG5vdGhpbmcgZWxzZSBpcyBwaWNrZWQgYnkgcG9pbnRpbmcuICovXG4gIHBvaW50UGljayAocGFydDogUGFydElkKSB7XG4gICAgaWYgKHBhcnQgIT09ICdmaWxhbWVudCcgfHwgdGhpcy5zZWxlY3RlZCB8fCB0aGlzLnRvdWNoIHx8IHRoaXMuZG93biB8fCB0aGlzLnNjcmVlbk9wZW4pIHJldHVyblxuICAgIHRoaXMuc2VsZWN0KHBhcnQpXG4gICAgdGhpcy5ob3ZlclBpY2tlZCA9IHRydWVcbiAgfVxuXG4gIG9uTGFiZWxFbnRlciAoKSB7XG4gICAgdGhpcy5sYWJlbE92ZXIgPSB0cnVlXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucmVsZWFzZVRpbWVyKVxuICAgIHRoaXMucmVsZWFzZVRpbWVyID0gMFxuICB9XG5cbiAgb25MYWJlbExlYXZlIChlOiBQb2ludGVyRXZlbnQpIHtcbiAgICB0aGlzLmxhYmVsT3ZlciA9IGZhbHNlXG4gICAgaWYgKCF0aGlzLmhvdmVyUGlja2VkKSByZXR1cm5cbiAgICAvLyBBIG1lbnUgb3IgZGlhbG9nIHRoZSBwYW5lbCBvcGVuZWQgaXMgcGFydCBvZiBpdC5cbiAgICBjb25zdCB0byA9IGUucmVsYXRlZFRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGxcbiAgICBpZiAodG8/LmNsb3Nlc3Q/LignLnYtbWVudV9fY29udGVudCwgLnYtZGlhbG9nLCBbcm9sZT1cIm1lbnVcIl0sIFtyb2xlPVwibGlzdGJveFwiXSwgW3JvbGU9XCJkaWFsb2dcIl0nKSkgcmV0dXJuXG4gICAgdGhpcy5kZXNlbGVjdCgpXG4gIH1cblxuICAvKiogV2l0aCB0aGUgcHJpbnRlcidzIHNjcmVlbiBvcGVuLCBhIHNjcm9sbCBvdmVyIHRoZSBtb2RlbCB0dXJucyBpdHMga25vYiwgYXMgdGhlIGtub2Igb24gdGhlIHByaW50ZXIgd291bGQgdHVybi4gT25seSB0aGUgcGljdHVyZTogbm90aGluZyBpcyBzZW50LiAqL1xuICByZWFkb25seSBrbm9iV2hlZWwgPSBuZXcgS25vYldoZWVsKClcblxuICBvbldoZWVsIChlOiBXaGVlbEV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLnNjcmVlbk9wZW4gfHwgIXRoaXMudmlld2VyKSByZXR1cm5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBkZXRlbnRzID0gdGhpcy5rbm9iV2hlZWwudHVybihlLmRlbHRhWSwgZS5kZWx0YU1vZGUpXG4gICAgaWYgKGRldGVudHMpIHRoaXMudmlld2VyLnR1cm5Lbm9iKGRldGVudHMpXG4gIH1cblxuICBvblVwIChlOiBQb2ludGVyRXZlbnQpIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuZG93blxuICAgIHRoaXMuZG93biA9IG51bGxcbiAgICBjb25zdCBkcmFnUG9pbnRlciA9IHRoaXMuZHJhZ1BvaW50ZXJcbiAgICB0aGlzLmRyYWdQb2ludGVyID0gbnVsbFxuICAgIHRoaXMudmlld2VyPy5ob2xkUGFuKGZhbHNlKVxuICAgIHRoaXMudmlld2VyPy5zZXRPcmJpdCghdGhpcy5jYW1lcmFMb2NrZWQpXG4gICAgaWYgKHRoaXMuZHJhZykge1xuICAgICAgaWYgKGUucG9pbnRlcklkID09PSBkcmFnUG9pbnRlciAmJiBlLmJ1dHRvbiA9PT0gMCkgdGhpcy5yZWxlYXNlKClcbiAgICAgIGVsc2UgdGhpcy5vbkNhbmNlbCgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFzdGFydCB8fCB0aGlzLmRyYWdnZWQgfHwgZS5idXR0b24gIT09IDApIHJldHVyblxuICAgIC8vIFRoZSBwcmludGVyJ3Mgc2NyZWVuIG9wZW46IGEgY2xpY2sgb24gdGhlIG1vZGVsJ3Mgc2NyZWVuIG9yIGtub2IgcHJlc3NlcyB0aGUga25vYiAodGhlIGtub2Igc2l0cyB1bmRlciB0aGUgbGl2ZSBzY3JlZW4sXG4gICAgLy8gc28gdGhlIHByZXNzIGlzIHRoZSBwaWN0dXJlJ3MpOyBhIGNsaWNrIGFueXdoZXJlIGVsc2UgbGVhdmVzIHRoZSBzY3JlZW4uXG4gICAgaWYgKHRoaXMuc2NyZWVuT3Blbikge1xuICAgICAgaWYgKHRoaXMudmlld2VyPy5rbm9iQXQoZS5jbGllbnRYLCBlLmNsaWVudFkpIHx8IHRoaXMudmlld2VyPy5waWNrKGUuY2xpZW50WCwgZS5jbGllbnRZKSA9PT0gJ3NjcmVlbicpIHRoaXMudmlld2VyLnByZXNzS25vYigpXG4gICAgICBlbHNlICh0aGlzLiRyZWZzLnNjcmVlbiBhcyB7IGNsb3NlPzogKCkgPT4gdm9pZCB9IHwgdW5kZWZpbmVkKT8uY2xvc2U/LigpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy8gQSBjbGljayBvciBhIHRhcDogdGhlIGtub2IsIGlmIGl0IGlzIHVuZGVyIGl0LCBpcyBwcmVzc2VkIGluIGZvciBhIG1vbWVudDsgdGhlbiBzZWxlY3Qgd2hhdCBpcyB1bmRlciBpdCwgb3IgY2xlYXIgb24gZW1wdHkgc3RhZ2UuXG4gICAgaWYgKHRoaXMudmlld2VyPy5rbm9iQXQoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB0aGlzLnZpZXdlci5wcmVzc0tub2IoKVxuICAgIGNvbnN0IHBhcnQgPSB0aGlzLnZpZXdlcj8ucGljayhlLmNsaWVudFgsIGUuY2xpZW50WSkgPz8gbnVsbFxuICAgIGlmIChwYXJ0KSB0aGlzLnNlbGVjdChwYXJ0KVxuICAgIGVsc2UgdGhpcy5zZWxlY3RlZCA9IG51bGxcbiAgfVxuXG4gIC8qKiBUaGUgZHJhZydzIHRhcmdldCB1bmRlciB0aGUgcG9pbnRlcjogdGhlIGhlYWQgb24gaXRzIHBsYW5lLCBvciB0aGUgcGxhdGUgdXAgb3IgZG93biBmcm9tIHdoZXJlIGl0IHdhcy4gKi9cbiAgZHJhZ1RvICh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIGNvbnN0IHZpZXdlciA9IHRoaXMudmlld2VyXG4gICAgY29uc3QgcGFydCA9IHRoaXMubW92YWJsZVxuICAgIGlmICghdmlld2VyIHx8ICFwYXJ0KSByZXR1cm5cbiAgICBpZiAocGFydCA9PT0gJ3Rvb2xoZWFkJykge1xuICAgICAgY29uc3QgaGl0ID0gdmlld2VyLm9uTGV2ZWwoeCwgeSwgSEVBRF9QTEFORV9ZKVxuICAgICAgaWYgKCFoaXQpIHJldHVyblxuICAgICAgY29uc3QgYXQgPSB3b3JsZFRvSGVhZChoaXQpXG4gICAgICBpZiAoIXRoaXMuZHJhZykgdGhpcy5yZWZ1c2VkID0gJydcbiAgICAgIHRoaXMuZHJhZyA9IHtcbiAgICAgICAgcGFydCxcbiAgICAgICAgcHJpbnRlcjogdGhpcy5kcmFnPy5wcmludGVyID8/IHRoaXMucGFuZWxUYXJnZXQsXG4gICAgICAgIHRhcmdldDogeyBYOiBjbGFtcE1tKGF0LlgsIHRoaXMuYXhpc01pblswXSwgdGhpcy5heGlzTWF4WzBdKSwgWTogY2xhbXBNbShhdC5ZLCB0aGlzLmF4aXNNaW5bMV0sIHRoaXMuYXhpc01heFsxXSkgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB6MCA9IHRoaXMuZHJhZz8uc3RhcnRaID8/IE51bWJlcih0aGlzLnBvc2l0aW9uWzJdKVxuICAgICAgY29uc3QgdGhyb3VnaCA9IHsgeDogMCwgeTogcGxhdGVUb3BGb3JaKHowKSwgejogMCB9XG4gICAgICBjb25zdCBoaXQgPSB2aWV3ZXIub25VcHJpZ2h0KHgsIHksIHRocm91Z2gpXG4gICAgICBpZiAoIWhpdCkgcmV0dXJuXG4gICAgICBpZiAoIXRoaXMuZHJhZykge1xuICAgICAgICB0aGlzLnJlZnVzZWQgPSAnJ1xuICAgICAgICB0aGlzLmRyYWcgPSB7IHBhcnQsIHByaW50ZXI6IHRoaXMucGFuZWxUYXJnZXQsIHRhcmdldDogeyBaOiB6MCB9LCBzdGFydFo6IHowLCBzdGFydFk6IGhpdC55IH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ5ID0gekZvclBsYXRlVG9wKGhpdC55KSAtIHpGb3JQbGF0ZVRvcCh0aGlzLmRyYWcuc3RhcnRZID8/IGhpdC55KVxuICAgICAgdGhpcy5kcmFnID0geyAuLi50aGlzLmRyYWcsIHRhcmdldDogeyBaOiBwbGF0ZURyYWdaKHowLCBieSwgdGhpcy5heGlzTWluWzJdLCB0aGlzLmF4aXNNYXhbMl0pIH0gfVxuICAgIH1cbiAgICB0aGlzLmZvbGxvdygpXG4gIH1cblxuICAvKipcbiAgICogTGV0dGluZyBnbyBzZW5kcyB0aGUgdGFyZ2V0IG9uY2UsIHRocm91Z2ggbW92ZVRvOiB0aGUgc2FtZSBjaGVja3MgYXNcbiAgICogZXZlcnkgaGFuZCBtb3ZlIChob21lZCwgaWRsZSwgdGhlIGhhbmQtbW92ZSB3YWl0IGFuZCB0aGUgbm8tZ28gcGxhbm5lcixcbiAgICogbGlmdGluZyBvdmVyIHRoZSBiZWQncyBub3RjaCB3aGVuIGl0IG11c3QpLiBtb3ZlVG8gdGFrZXMgRy1jb2RlXG4gICAqIGNvb3JkaW5hdGVzOyB0aGUgZHJhZyBpcyByZWFkIGluIHRoZSB0b29saGVhZCdzLlxuICAgKi9cbiAgcmVsZWFzZSAoKSB7XG4gICAgY29uc3QgZHJhZyA9IHRoaXMuZHJhZ1xuICAgIHRoaXMuZHJhZyA9IG51bGxcbiAgICB0aGlzLmRyYWdQeCA9IG51bGxcbiAgICAvLyBPbmx5IHRvIHRoZSBwcmludGVyIHRoZSBkcmFnIGJlZ2FuIG9uLCBhbmQgb25seSB3aGlsZSB0aGF0IHBhcnQgY2FuIHN0aWxsIGJlIG1vdmVkLlxuICAgIGlmICghZHJhZyB8fCB0aGlzLm1vdmFibGUgIT09IGRyYWcucGFydCB8fCBkcmFnLnByaW50ZXIgIT09IHRoaXMucGFuZWxUYXJnZXQpIHJldHVyblxuICAgIGNvbnN0IHBsYWNlID0gcmVsZWFzZVBsYWNlKGRyYWcudGFyZ2V0LCB0aGlzLmdjb2RlT2Zmc2V0ID8/IFswLCAwLCAwXSwgdGhpcy5heGlzTWluLCB0aGlzLmF4aXNNYXgpXG4gICAgLy8gV2h5IGl0IGNhbid0IGdvLCBzYWlkIGluIHRoZSBsYWJlbDogbW92ZVRvIHRvYXN0cyBvbmx5IHRoZSBwbGFubmVyJ3MgcmVmdXNhbHMuXG4gICAgY29uc3Qgd2FpdCA9IHRoaXMuaGFuZE1vdmVXYWl0KClcbiAgICBjb25zdCBzZW50ID0gdGhpcy5tb3ZlVG8ocGxhY2UpXG4gICAgaWYgKCFzZW50KSB0aGlzLnJlZnVzZWQgPSBgTm90IG1vdmVkOiAke3dhaXQgfHwgdGhpcy5yZWZ1c2FsRm9yKHBsYWNlKX1gXG4gIH1cblxuICAvKiogV2h5IG1vdmVUbyB3b3VsZCB0dXJuIHRoaXMgcGxhY2UgZG93biwgaW4gd29yZHMuICovXG4gIHJlZnVzYWxGb3IgKHBsYWNlOiB7IFg/OiBudW1iZXIsIFk/OiBudW1iZXIsIFo/OiBudW1iZXIgfSk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIHRoaXMuY29udHJvbExvY2tcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm4gJ3RoZSBwcmludGVyIGlzIGJ1c3kuJ1xuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZ2NvZGVPZmZzZXQgPz8gWzAsIDAsIDBdXG4gICAgY29uc3QgcmVhbFRvID0gKFsnWCcsICdZJywgJ1onXSBhcyBjb25zdCkubWFwKChhLCBpKSA9PiBwbGFjZVthXSAhPT0gdW5kZWZpbmVkID8gKHBsYWNlW2FdIGFzIG51bWJlcikgKyBvZmZzZXRbaV0gOiBOdW1iZXIodGhpcy5wb3NpdGlvbltpXSkpIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVxuICAgIGNvbnN0IHBsYW4gPSB0aGlzLnBsYW5IYW5kTW92ZShyZWFsVG8pXG4gICAgcmV0dXJuIHBsYW4ub2sgPyAndGhhdCBpcyBvdXRzaWRlIHdoYXQgdGhlIHByaW50ZXIgY2FuIHJlYWNoLicgOiBwbGFuLnJlYXNvblxuICB9XG5cbiAgLyoqIFRoZSBkcmFnJ3MgbGluZSBhbmQgdGFyZ2V0LCBhbmQgdGhlIGF4ZXMnIG1hcmtzLCBhcyBkcmF3biBub3cuICovXG4gIHBsYWNlRHJhZyAoKSB7XG4gICAgY29uc3Qgdmlld2VyID0gdGhpcy52aWV3ZXJcbiAgICBpZiAoIXZpZXdlcikgcmV0dXJuXG4gICAgY29uc3QgZHJhZyA9IHRoaXMuZHJhZ1xuICAgIGlmIChkcmFnKSB7XG4gICAgICBjb25zdCB0ID0gZHJhZy50YXJnZXRcbiAgICAgIGNvbnN0IHdvcmxkID0gJ1onIGluIHRcbiAgICAgICAgPyB7IHg6IDAsIHk6IHBsYXRlVG9wRm9yWih0LlopLCB6OiAwIH1cbiAgICAgICAgOiBoZWFkVG9Xb3JsZCh0LlgsIHQuWSlcbiAgICAgIGNvbnN0IHRvID0gdmlld2VyLnByb2plY3Qod29ybGQpXG4gICAgICAvLyBGcm9tIHRoZSBub3p6bGUgaXRzZWxmIChub3QgdGhlIHBhcnQncyBtaWRkbGUsIHdoZXJlIHRoZSBwYW5lbCdzIG93biBsaW5lIHN0YXJ0cyk6IHdoZXJlIHRoZSBoZWFkIGlzIG5vdywgc28gdGhlIGxpbmUgY2xvc2VzIGFzIGl0IGNvbWVzIGluLlxuICAgICAgY29uc3QgW3gsIHksIHpdID0gdGhpcy5wb3NpdGlvblxuICAgICAgY29uc3QgZnJvbSA9IHZpZXdlci5wcm9qZWN0KGRyYWcucGFydCA9PT0gJ3BsYXRlJ1xuICAgICAgICA/IHsgeDogMCwgeTogcGxhdGVUb3BGb3JaKHopLCB6OiAwIH1cbiAgICAgICAgOiBoZWFkVG9Xb3JsZCh4LCB5KSlcbiAgICAgIGNvbnN0IG5leHQgPSB0byAmJiBmcm9tID8geyBmcm9tOiByb3VuZChmcm9tKSwgdG86IHJvdW5kKHRvKSB9IDogbnVsbFxuICAgICAgaWYgKCFzYW1lUHgobmV4dCwgdGhpcy5kcmFnUHgpKSB0aGlzLmRyYWdQeCA9IG5leHRcbiAgICB9XG4gICAgaWYgKHRoaXMudG9wVmlldykge1xuICAgICAgY29uc3QgbG8gPSBbdGhpcy5heGlzTWluWzBdLCB0aGlzLmF4aXNNaW5bMV1dIGFzIFtudW1iZXIsIG51bWJlcl1cbiAgICAgIGNvbnN0IGhpID0gW3RoaXMuYXhpc01heFswXSwgdGhpcy5heGlzTWF4WzFdXSBhcyBbbnVtYmVyLCBudW1iZXJdXG4gICAgICBjb25zdCBzY3JlZW4gPSAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZpZXdlci5wcm9qZWN0KGhlYWRUb1dvcmxkKHgsIHkpKVxuICAgICAgLy8gWCBtYXJrZWQgYWxvbmcgdGhlIGxpbWl0IG5lYXJlc3QgdGhlIGJvdHRvbSBvZiB0aGUgdmlldywgWSBhbG9uZyB0aGUgb25lIG5lYXJlc3QgdGhlIGxlZnQuXG4gICAgICBjb25zdCBlZGdlcyA9IGF4aXNFZGdlcyhsbywgaGksIHNjcmVlbilcbiAgICAgIGNvbnN0IG1hcmsgPSAodjogbnVtYmVyLCBwOiB7IHg6IG51bWJlciwgeTogbnVtYmVyIH0gfCBudWxsLCBheGlzOiAneCcgfCAneScpID0+XG4gICAgICAgIHAgJiYgTnVtYmVyLmlzRmluaXRlKHAueCkgJiYgTnVtYmVyLmlzRmluaXRlKHAueSkgPyB7IHYsIHB4OiBNYXRoLnJvdW5kKGF4aXMgPT09ICd4JyA/IHAueCA6IHAueSksIGF0OiBNYXRoLnJvdW5kKGF4aXMgPT09ICd4JyA/IHAueSA6IHAueCkgfSA6IG51bGxcbiAgICAgIGNvbnN0IHhzID0gdGlja3MoTWF0aC5tYXgoMCwgbG9bMF0pLCBoaVswXSkubWFwKHYgPT4gbWFyayh2LCBzY3JlZW4odiwgZWRnZXMueSksICd4JykpXG4gICAgICBjb25zdCB5cyA9IHRpY2tzKE1hdGgubWF4KDAsIGxvWzFdKSwgaGlbMV0pLm1hcCh2ID0+IG1hcmsodiwgc2NyZWVuKGVkZ2VzLngsIHYpLCAneScpKVxuICAgICAgY29uc3QgbmV4dCA9IHtcbiAgICAgICAgeDogeHMuZmlsdGVyKChtKTogbSBpcyBOb25OdWxsYWJsZTx0eXBlb2YgbT4gPT4gISFtKSxcbiAgICAgICAgeTogeXMuZmlsdGVyKChtKTogbSBpcyBOb25OdWxsYWJsZTx0eXBlb2YgbT4gPT4gISFtKVxuICAgICAgfVxuICAgICAgLy8gV3JpdHRlbiBvbmx5IHdoZW4gYSBtYXJrIG1vdmVzLCBzbyBhbiBpZGxlIHRvcC1kb3duIHZpZXcgZG9lc24ndCByZW5kZXIgZXZlcnkgZnJhbWUuXG4gICAgICBpZiAoSlNPTi5zdHJpbmdpZnkobmV4dCkgIT09IEpTT04uc3RyaW5naWZ5KHRoaXMuYXhpc01hcmtzKSkgdGhpcy5heGlzTWFya3MgPSBuZXh0XG4gICAgICBjb25zdCBub0dvID0gdGhpcy5ub0dvXG4gICAgICBjb25zdCByZWdpb25zID0gbm9HbyAmJiBub0dvICE9PSAnaW52YWxpZCcgPyBub0dvLnJlZ2lvbnMgOiBbXVxuICAgICAgY29uc3QgYm91bmRzID0ge1xuICAgICAgICBjb3JuZXJzOiBib3VuZENvcm5lcnMobG8sIGhpLCBzY3JlZW4pLFxuICAgICAgICBub3RjaDogcmVnaW9ucy5tYXAociA9PiBib3VuZENvcm5lcnMoci5taW4sIHIubWF4LCBzY3JlZW4sIHRydWUpKS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICAgIGlmIChKU09OLnN0cmluZ2lmeShib3VuZHMpICE9PSBKU09OLnN0cmluZ2lmeSh0aGlzLmJvdW5kc1B4KSkgdGhpcy5ib3VuZHNQeCA9IGJvdW5kc1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5heGlzTWFya3MpIHRoaXMuYXhpc01hcmtzID0gbnVsbFxuICAgICAgaWYgKHRoaXMuYm91bmRzUHgpIHRoaXMuYm91bmRzUHggPSBudWxsXG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSBzY3JlZW4gb3BlbjogdGhlIGNhbWVyYSBmbGllcyBpbiB0byBpdCAobm90IHdpdGggcmVkdWNlZCBtb3Rpb246IHRoZW4gdGhlIHNjcmVlbiBqdXN0IG9wZW5zKS4gKi9cbiAgZ2V0IHpvb21lZEluICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zY3JlZW5PcGVuICYmIHRoaXMuaW50ZXJhY3RpdmUgJiYgIXRoaXMucmVkdWNlZE1vdGlvblxuICB9XG5cbiAgQFdhdGNoKCd6b29tZWRJbicpXG4gIG9uWm9vbWVkSW4gKCkge1xuICAgIHRoaXMub25Ub3BWaWV3KHRoaXMudG9wVmlldylcbiAgfVxuXG4gIEBXYXRjaCgndG9wVmlldycpXG4gIG9uVG9wVmlldyAodG9wOiBib29sZWFuKSB7XG4gICAgdGhpcy52aWV3ZXI/LnNldFZpZXcodGhpcy56b29tZWRJbiA/ICdzY3JlZW4nIDogdG9wID8gJ3RvcCcgOiAnZnJlZScpXG4gICAgdGhpcy52aWV3ZXI/LnNldE9yYml0KCF0aGlzLmNhbWVyYUxvY2tlZClcbiAgICB0aGlzLmZvbGxvdygpXG4gIH1cblxuICAvKiogQW5vdGhlciBwcmludGVyOiBhIGRyYWcgb24gdGhpcyBvbmUgZW5kcywgc2VuZGluZyBub3RoaW5nLiAqL1xuICBAV2F0Y2goJ3BhbmVsVGFyZ2V0JylcbiAgb25QcmludGVyQ2hhbmdlICgpIHtcbiAgICBpZiAodGhpcy5kcmFnIHx8IHRoaXMuZHJhZ1BvaW50ZXIgIT09IG51bGwpIHRoaXMub25DYW5jZWwoKVxuICB9XG5cbiAgLyoqIEEgc2VsZWN0ZWQgcGFydCB0aGF0IGNhbiBiZSBkcmFnZ2VkIHRha2VzIHRoZSBkcmFnIGZyb20gdGhlIG1vZGVsOiB0aGUgbW9kZWwgc3RvcHMgdHVybmluZywgYW5kIHRvdWNoIHN0b3BzIHNjcm9sbGluZyB0aGUgcGFnZS4gKi9cbiAgQFdhdGNoKCdtb3ZhYmxlJylcbiAgb25Nb3ZhYmxlIChwYXJ0OiAndG9vbGhlYWQnIHwgJ3BsYXRlJyB8IG51bGwpIHtcbiAgICBpZiAodGhpcy5ib3VuZCkgdGhpcy5ib3VuZC5zdHlsZS50b3VjaEFjdGlvbiA9IHBhcnQgPyAnbm9uZScgOiAnJ1xuICAgIGlmICghcGFydCAmJiAodGhpcy5kcmFnIHx8IHRoaXMuZHJhZ1BvaW50ZXIgIT09IG51bGwpKSB0aGlzLm9uQ2FuY2VsKClcbiAgfVxuXG4gIHNlbGVjdCAocGFydDogUGFydElkKSB7XG4gICAgdGhpcy5ob3ZlclBpY2tlZCA9IGZhbHNlXG4gICAgdGhpcy5zZWxlY3RlZCA9IHBhcnRcbiAgICAvLyBBIGNsaWNrIG9uIHRoZSBzY3JlZW4gZ29lcyBpbnRvIGl0OiB0aGUgcHJpbnRlcidzIG93biBzY3JlZW4sIGZsb3duIGluIGZyb20gd2hlcmUgaXQgaXMgb24gdGhlIG1vZGVsLlxuICAgIGlmIChwYXJ0ID09PSAnc2NyZWVuJyAmJiB0aGlzLmludGVyYWN0aXZlKSB7XG4gICAgICB0aGlzLnNjcmVlbkZyb20gPSB0aGlzLmFuY2hvciA/PyB0aGlzLnZpZXdlcj8uYW5jaG9yKCdzY3JlZW4nKSA/PyBudWxsXG4gICAgICB0aGlzLnNjcmVlbk9wZW4gPSB0cnVlXG4gICAgfVxuICAgIHRoaXMuZm9jdXNJbmRleCA9IFBBUlRfSURTLmluZGV4T2YocGFydClcbiAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCBwYXJ0KVxuICB9XG5cbiAgb25DaGlwRm9jdXMgKGlkOiBQYXJ0SWQpIHtcbiAgICB0aGlzLmhvdmVyUGlja2VkID0gZmFsc2VcbiAgICB0aGlzLmZvY3VzSW5kZXggPSBQQVJUX0lEUy5pbmRleE9mKGlkKVxuICAgIHRoaXMuc2VsZWN0ZWQgPSBpZFxuICB9XG5cbiAgLyoqIOKGkCDihpIgYW5kIDHigJM0IG1vdmUgYmV0d2VlbiB0aGUgcGFydHMnIGJ1dHRvbnMuICovXG4gIG9uS2V5cyAoZTogS2V5Ym9hcmRFdmVudCkge1xuICAgIGNvbnN0IG4gPSBQQVJUX0lEUy5sZW5ndGhcbiAgICBsZXQgbmV4dCA9IC0xXG4gICAgaWYgKGUua2V5ID09PSAnQXJyb3dSaWdodCcgfHwgZS5rZXkgPT09ICdBcnJvd0Rvd24nKSBuZXh0ID0gKHRoaXMuZm9jdXNJbmRleCArIDEpICUgblxuICAgIGVsc2UgaWYgKGUua2V5ID09PSAnQXJyb3dMZWZ0JyB8fCBlLmtleSA9PT0gJ0Fycm93VXAnKSBuZXh0ID0gKHRoaXMuZm9jdXNJbmRleCArIG4gLSAxKSAlIG5cbiAgICBlbHNlIGlmICgvXlsxLTRdJC8udGVzdChlLmtleSkpIG5leHQgPSBOdW1iZXIoZS5rZXkpIC0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09PSAnSG9tZScpIG5leHQgPSAwXG4gICAgZWxzZSBpZiAoZS5rZXkgPT09ICdFbmQnKSBuZXh0ID0gbiAtIDFcbiAgICBpZiAobmV4dCA8IDApIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHRoaXMuZm9jdXNJbmRleCA9IG5leHRcbiAgICA7KHRoaXMuJHJlZnMuY2hpcHMgYXMgSFRNTEJ1dHRvbkVsZW1lbnRbXSB8IHVuZGVmaW5lZCk/LltuZXh0XT8uZm9jdXMoKVxuICB9XG5cbiAgb25Fc2NhcGUgKGU6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZS5rZXkgIT09ICdFc2NhcGUnKSByZXR1cm5cbiAgICAvLyBXaXRoIHRoZSBwcmludGVyJ3Mgc2NyZWVuIG9wZW4sIEVzYyBjbG9zZXMgaXQgKE0xU2NyZWVuKSwgYW5kIG5vdGhpbmcgZWxzZS5cbiAgICBpZiAodGhpcy5zY3JlZW5PcGVuKSByZXR1cm5cbiAgICAvLyBOb3Qgd2hpbGUgdHlwaW5nIHNvbWV3aGVyZSBvciBpbnNpZGUgYSBkaWFsb2c6IHRoYXQgRXNjIGlzIHRoZWlycy5cbiAgICBjb25zdCB0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsXG4gICAgaWYgKHQgJiYgdCAhPT0gZG9jdW1lbnQuYm9keSAmJiAhdGhpcy4kZWwuY29udGFpbnModCkgJiYgKHQuY2xvc2VzdCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIFtjb250ZW50ZWRpdGFibGVdLCAudi1kaWFsb2csIFtyb2xlPVwiZGlhbG9nXCJdJykpKSByZXR1cm5cbiAgICAvLyBFc2MgbWlkLWRyYWcgZHJvcHMgdGhlIGRyYWcgYW5kIHNlbmRzIG5vdGhpbmc7IG90aGVyd2lzZSBpdCBsZXRzIHRoZSBwYXJ0IGdvLlxuICAgIGlmICh0aGlzLmRyYWcgfHwgdGhpcy5kcmFnUG9pbnRlciAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5vbkNhbmNlbCgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkKSByZXR1cm5cbiAgICB0aGlzLnNlbGVjdGVkID0gbnVsbFxuICAgIHRoaXMucmVmdXNlZCA9ICcnXG4gIH1cblxuICBAV2F0Y2goJ3Nob3duUGFydCcpXG4gIEBXYXRjaCgnaG9sZHNQYXJ0JylcbiAgQFdhdGNoKCd2aWV3ZXInKVxuICBzaG93ICgpIHtcbiAgICBjb25zdCBwYXJ0ID0gdGhpcy5zaG93blBhcnRcbiAgICB0aGlzLnZpZXdlcj8uc2V0Rm9jdXMocGFydCwgdGhpcy5ob2xkc1BhcnQgPyAnYWN0aXZlJyA6ICdpbmZvJywgdGhpcy5ob2xkc1BhcnQgJiYgbW9kZWxBbmltYXRlcyhtb2RlbFNldHRpbmdzLmFuaW1hdGlvbnMsIHRoaXMucmVkdWNlZE1vdGlvbikpXG4gICAgaWYgKHRoaXMuYm91bmQgJiYgIXBhcnQpIHRoaXMuYm91bmQuc3R5bGUuY3Vyc29yID0gJydcbiAgICB0aGlzLmZvbGxvdygpXG4gIH1cblxuICAvKiogUHV0cyB0aGUgbGFiZWwgaW4gdGhlIHRvcCBjb3JuZXIgYXdheSBmcm9tIHRoZSBwYXJ0LCBhbmQgZW5kcyB0aGUgbGluZSBhdCBpdHMgbmVhciBlZGdlLiAqL1xuICBwbGFjZUxhYmVsICgpIHtcbiAgICBjb25zdCBhID0gdGhpcy5hbmNob3JcbiAgICBjb25zdCBlbCA9IHRoaXMuJGVsIGFzIEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkXG4gICAgaWYgKCFhIHx8ICFlbCkge1xuICAgICAgaWYgKHRoaXMubGVhZGVyKSB0aGlzLmxlYWRlciA9IG51bGxcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBMb29raW5nIGRvd24gYXQgdGhlIGhlYWQsIHRoZSBsYWJlbCBrZWVwcyByaWdodCwgY2xlYXIgb2YgdGhlIFkgbWFya3Mgb24gdGhlIGxlZnQuIE90aGVyd2lzZSBpdCBnb2VzXG4gICAgLy8gdG8gdGhlIHNpZGUgYXdheSBmcm9tIHRoZSBwYXJ0LCBhbmQgY2hhbmdlcyBzaWRlIG9ubHkgb25jZSB0aGUgcGFydCBpcyB3ZWxsIHBhc3QgdGhlIG1pZGRsZSwgc28gYVxuICAgIC8vIHBhcnQgbmVhciB0aGUgbWlkZGxlIGRvZXNuJ3QgZmxpcCBpdCBldmVyeSBmcmFtZS5cbiAgICBjb25zdCB3ID0gZWwuY2xpZW50V2lkdGhcbiAgICBjb25zdCBzaWRlID0gdGhpcy50b3BWaWV3ID8gJ3JpZ2h0JyA6IGEueCA8IHcgKiAwLjQyID8gJ3JpZ2h0JyA6IGEueCA+IHcgKiAwLjU4ID8gJ2xlZnQnIDogdGhpcy5zaWRlXG4gICAgaWYgKHNpZGUgIT09IHRoaXMuc2lkZSkgdGhpcy5zaWRlID0gc2lkZVxuICAgIGNvbnN0IGxhYmVsID0gdGhpcy4kcmVmcy5sYWJlbCBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZFxuICAgIGlmICghbGFiZWwpIHJldHVyblxuICAgIC8vIEZyb20gdGhlIGxhYmVsJ3Mgc2l6ZSBhbmQgaXRzIGNvcm5lciAoMTYgcHggaW4sIGFzIHRoZSBzdHlsZSBwdXRzIGl0KSwgbm90IHdoZXJlIGl0IHdhcyBsYXN0IGRyYXduLlxuICAgIGNvbnN0IHggPSB0aGlzLnNpZGUgPT09ICdyaWdodCcgPyBlbC5jbGllbnRXaWR0aCAtIExBQkVMX0lOU0VUIC0gbGFiZWwub2Zmc2V0V2lkdGggOiBMQUJFTF9JTlNFVCArIGxhYmVsLm9mZnNldFdpZHRoXG4gICAgY29uc3QgeSA9IExBQkVMX0lOU0VUICsgbGFiZWwub2Zmc2V0SGVpZ2h0IC8gMlxuICAgIC8vIFNldCBvbmx5IHdoZW4gaXQgbW92ZXM6IHVwZGF0ZWQoKSBjYWxscyB0aGlzLCBhbmQgYSBuZXcgb2JqZWN0IGVhY2ggdGltZSB3b3VsZCByZW5kZXIgZm9yZXZlci5cbiAgICBpZiAodGhpcy5sZWFkZXI/LnggIT09IHggfHwgdGhpcy5sZWFkZXI/LnkgIT09IHkpIHRoaXMubGVhZGVyID0geyB4LCB5IH1cbiAgfVxuXG4gIHVwZGF0ZWQgKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkKSB0aGlzLnBsYWNlTGFiZWwoKVxuICB9XG5cbiAgLyoqIEtlZXBzIHRoZSBsYWJlbCdzIGxpbmUgb24gaXRzIHBhcnQgd2hpbGUgdGhlIGNhbWVyYSBlYXNlcy4gKi9cbiAgZm9sbG93ICgpIHtcbiAgICB0aGlzLmZvbGxvd1VudGlsID0gcGVyZm9ybWFuY2Uubm93KCkgKyBGT0xMT1dfTVNcbiAgICBpZiAodGhpcy5mb2xsb3dGcmFtZSkgcmV0dXJuXG4gICAgY29uc3Qgc3RlcCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnQgPSB0aGlzLnNlbGVjdGVkXG4gICAgICBjb25zdCBhdCA9IHBhcnQgPyB0aGlzLnZpZXdlcj8uYW5jaG9yKHBhcnQpID8/IG51bGwgOiBudWxsXG4gICAgICBjb25zdCBuZXh0ID0gYXQgPyByb3VuZChhdCkgOiBudWxsXG4gICAgICAvLyBXcml0dGVuIG9ubHkgd2hlbiBpdCBtb3ZlcyBhIHBpeGVsOiBhIHNlbGVjdGVkIGhlYWQgdGhhdCBzaXRzIHN0aWxsIHJlbmRlcnMgbm90aGluZy5cbiAgICAgIGlmIChuZXh0Py54ICE9PSB0aGlzLmFuY2hvcj8ueCB8fCBuZXh0Py55ICE9PSB0aGlzLmFuY2hvcj8ueSkgdGhpcy5hbmNob3IgPSBuZXh0XG4gICAgICB0aGlzLnBsYWNlTGFiZWwoKVxuICAgICAgdGhpcy5wbGFjZURyYWcoKVxuICAgICAgLy8gQSBoZWFkIG9yIHBsYXRlIHRoYXQgbWF5IG1vdmUga2VlcHMgaXRzIGxpbmUgZm9sbG93ZWQgZm9yIGFzIGxvbmcgYXMgaXQgaXMgc2VsZWN0ZWQuXG4gICAgICBjb25zdCBtb3ZpbmcgPSB0aGlzLnNlbGVjdGVkID09PSAndG9vbGhlYWQnIHx8IHRoaXMuc2VsZWN0ZWQgPT09ICdwbGF0ZSdcbiAgICAgIHRoaXMuZm9sbG93RnJhbWUgPSBwZXJmb3JtYW5jZS5ub3coKSA8IHRoaXMuZm9sbG93VW50aWwgfHwgdGhpcy5kb3duIHx8IG1vdmluZyA/IHJlcXVlc3RBbmltYXRpb25GcmFtZShzdGVwKSA6IDBcbiAgICB9XG4gICAgdGhpcy5mb2xsb3dGcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShzdGVwKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubTEtcGFydHMge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBpbnNldDogMDtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB6LWluZGV4OiAyO1xuICB9XG5cbiAgLyogT25lIHF1aWV0IHBhbmVsOiB0aGUgcGFydCdzIG5hbWUgYW5kIG9uZSBmYWN0LCBpbiBhIHRvcCBjb3JuZXIuICovXG4gIC5tMS1wYXJ0c19fbGFiZWwge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDE2cHg7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMnB4O1xuICAgIHBhZGRpbmc6IDlweCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgLy8gU2xpZ2h0bHkgc2VlLXRocm91Z2gsIHNvIHRoZSByb3VuZCBzY3JlZW4gdW5kZXIgdGhlIHBhbmVsJ3MgZWRnZSBzdGlsbCBzaG93cyAoS0FOLTM1OTYpLlxuICAgIGJhY2tncm91bmQ6IHJnYigzNiAzNiA0MCAvIDYyJSk7XG4gICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDIwcHgpO1xuICAgIGNvbG9yOiAjZjVmNWY3O1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIGFuaW1hdGlvbjogbTEtcGFydHMtaW4gMC4xNnMgZWFzZS1vdXQ7XG5cbiAgICBiIHtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgJi0tcmlnaHQge1xuICAgICAgcmlnaHQ6IDE2cHg7XG4gICAgfVxuXG4gICAgJi0tbGVmdCB7XG4gICAgICBsZWZ0OiAxNnB4O1xuICAgIH1cblxuICAgICYtLWluZm8gYiB7XG4gICAgICBjb2xvcjogI2Q4ZDhkYztcbiAgICB9XG4gIH1cblxuICAvKiBBIGhhaXJsaW5lIGZyb20gdGhlIHBhcnQgdG8gdGhlIHBhbmVsLCBpbiB0aGUgcGFuZWwncyBvd24gY29sb3VyLiAqL1xuICAubTEtcGFydHNfX2xlYWRlciB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGluc2V0OiAwO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcblxuICAgIGxpbmUge1xuICAgICAgc3Ryb2tlOiByZ2IoMzYgMzYgNDAgLyA3OCUpO1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgIH1cblxuICAgIGNpcmNsZSB7XG4gICAgICBmaWxsOiByZ2IoMzYgMzYgNDAgLyA3OCUpO1xuICAgIH1cbiAgfVxuXG4gIC5tMS1wYXJ0c19faGludCxcbiAgLm0xLXBhcnRzX19yZWZ1c2VkIHtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgY29sb3I6ICM5ODk4OWQ7XG4gIH1cblxuICAubTEtcGFydHNfX3JlZnVzZWQge1xuICAgIGNvbG9yOiAjZmZjNDhhO1xuICB9XG5cbiAgLm0xLXBhcnRzX19sYWJlbCB7XG4gICAgcG9pbnRlci1ldmVudHM6IGF1dG87XG4gICAgd2hpdGUtc3BhY2U6IG5vcm1hbDtcbiAgICBtYXgtd2lkdGg6IDI2MHB4O1xuICB9XG5cbiAgLm0xLXBhcnRzX19kcmFnIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaW5zZXQ6IDA7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIG92ZXJmbG93OiB2aXNpYmxlO1xuXG4gICAgbGluZSB7XG4gICAgICBzdHJva2U6ICM4MGQ2ZDE7XG4gICAgICBzdHJva2Utd2lkdGg6IDEuNTtcbiAgICAgIHN0cm9rZS1kYXNoYXJyYXk6IDQgNDtcbiAgICB9XG5cbiAgICBjaXJjbGUge1xuICAgICAgZmlsbDogcmdiKDEyOCAyMTQgMjA5IC8gMTglKTtcbiAgICAgIHN0cm9rZTogIzgwZDZkMTtcbiAgICAgIHN0cm9rZS13aWR0aDogMS41O1xuICAgIH1cblxuICAgIHBhdGgge1xuICAgICAgc3Ryb2tlOiAjODBkNmQxO1xuICAgICAgc3Ryb2tlLXdpZHRoOiAxO1xuICAgIH1cblxuICAgIHRleHQge1xuICAgICAgZmlsbDogI2Y1ZjVmNztcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICBwYWludC1vcmRlcjogc3Ryb2tlO1xuICAgICAgc3Ryb2tlOiByZ2IoMCAwIDAgLyA2MCUpO1xuICAgICAgc3Ryb2tlLXdpZHRoOiAzcHg7XG4gICAgfVxuICB9XG5cbiAgLm0xLXBhcnRzX19heGVzIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaW5zZXQ6IDA7XG4gICAgY29sb3I6ICM5ODk4OWQ7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAubTEtcGFydHNfX3RpY2sge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcblxuICAgICYtLXgge1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgOHB4KTtcbiAgICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgcmdiKDE1MiAxNTIgMTU3IC8gNTAlKTtcbiAgICAgIHBhZGRpbmctbGVmdDogM3B4O1xuICAgIH1cblxuICAgICYtLXkge1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoY2FsYygtMTAwJSAtIDhweCksIC01MCUpO1xuICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHJnYigxNTIgMTUyIDE1NyAvIDUwJSk7XG4gICAgICBwYWRkaW5nLXRvcDogMXB4O1xuICAgIH1cbiAgfVxuXG4gIC5tMS1wYXJ0c19fYXhpcy1uYW1lIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICBjb2xvcjogI2Q4ZDhkYztcblxuICAgICYtLXgge1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMThweCwgOHB4KTtcbiAgICB9XG5cbiAgICAmLS15IHtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKGNhbGMoLTEwMCUgLSA4cHgpLCBjYWxjKC0xMDAlIC0gMTBweCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qIFdoZXJlIHRoZSBoZWFkIGNhbiBnbywgYW5kIHRoZSBub3RjaCBpdCBtdXN0IG5vdCBjcm9zcyBsb3c6IHF1aWV0LCB1bmRlciBldmVyeXRoaW5nIGVsc2UuICovXG4gIC5tMS1wYXJ0c19fYm91bmRzIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaW5zZXQ6IDA7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIG92ZXJmbG93OiB2aXNpYmxlO1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB9XG5cbiAgLm0xLXBhcnRzX19ib3VuZHMtY29ybmVycyB7XG4gICAgZmlsbDogbm9uZTtcbiAgICBzdHJva2U6IHJnYigyMTYgMjE2IDIyMCAvIDU1JSk7XG4gICAgc3Ryb2tlLXdpZHRoOiAxLjU7XG4gICAgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kO1xuICB9XG5cbiAgLm0xLXBhcnRzX19ib3VuZHMtbm90Y2gge1xuICAgIGZpbGw6IHJnYigyNTUgMTU5IDEwIC8gOCUpO1xuICAgIHN0cm9rZTogcmdiKDI1NSAxNTkgMTAgLyA0NSUpO1xuICAgIHN0cm9rZS13aWR0aDogMTtcbiAgICBzdHJva2UtZGFzaGFycmF5OiAzIDM7XG4gIH1cblxuICAubTEtcGFydHNfX2ZhY3Qge1xuICAgIGNvbG9yOiAjOTg5ODlkO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5tMS1wYXJ0c19fY2hpcHMge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBsZWZ0OiAxNHB4O1xuICAgIHJpZ2h0OiAxNHB4O1xuICAgIGJvdHRvbTogMTRweDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDhweDtcbiAgICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgICAvKiBPbiBhIGRlc2t0b3AgdGhlIGNoaXBzIGFyZSBmb3IgdGhlIGtleWJvYXJkOiBvdXQgb2Ygc2lnaHQgdW50aWwgb25lIGlzIGZvY3VzZWQuICovXG4gICAgY2xpcC1wYXRoOiBpbnNldCg1MCUpO1xuICAgIG9wYWNpdHk6IDA7XG5cbiAgICAmOmZvY3VzLXdpdGhpbiB7XG4gICAgICBjbGlwLXBhdGg6IG5vbmU7XG4gICAgICBvcGFjaXR5OiAxO1xuICAgIH1cbiAgfVxuXG4gIC5tMS1wYXJ0cy0tdG91Y2ggLm0xLXBhcnRzX19jaGlwcyB7XG4gICAgY2xpcC1wYXRoOiBub25lO1xuICAgIG9wYWNpdHk6IDE7XG4gIH1cblxuICAubTEtcGFydHNfX2NoaXAge1xuICAgIGhlaWdodDogMzJweDtcbiAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgLyogTm8gYmFja2Ryb3AgYmx1cjogb3ZlciB0aGUgbGl2ZSBXZWJHTCBjYW52YXMgaXQgbWFrZXMgdGhlIGJyb3dzZXIgcmVhZCB0aGUgY2FudmFzIGJhY2sgYW5kIHJlLWJsdXIgaXQgZXZlcnlcbiAgICAgICBmcmFtZSAoaXQgaGFsdmVzIHRoZSBmcmFtZSByYXRlIHdpdGhvdXQgYSBHUFUsIHdoaWNoIHN0YXJ2ZWQgY2xpY2tzIGluIENJKSwgc28gdGhlIGNoaXAgaXMgYSBsaXR0bGUgbW9yZSBvcGFxdWUuICovXG4gICAgYmFja2dyb3VuZDogcmdiKDQ0IDQ0IDQ4IC8gODYlKTtcbiAgICBjb2xvcjogI2Q4ZDhkYztcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcblxuICAgICYtLW9uIHtcbiAgICAgIGJhY2tncm91bmQ6IHJnYigxMjggMjE0IDIwOSAvIDE2JSk7XG4gICAgICBjb2xvcjogIzgwZDZkMTtcbiAgICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCByZ2IoMTI4IDIxNCAyMDkgLyA0NSUpO1xuICAgIH1cblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBvdXRsaW5lOiAycHggc29saWQgIzgwZDZkMTtcbiAgICAgIG91dGxpbmUtb2Zmc2V0OiAycHg7XG4gICAgfVxuICB9XG5cbiAgQGtleWZyYW1lcyBtMS1wYXJ0cy1pbiB7XG4gICAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgICB0byB7IG9wYWNpdHk6IDE7IH1cbiAgfVxuXG4gIDpyb290Lm0zZC1yZWR1Y2VkLW1vdGlvbiB7XG4gICAgLm0xLXBhcnRzX19sYWJlbCB7XG4gICAgICBhbmltYXRpb246IG5vbmU7XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbTEvTTFQYXJ0cy52dWUifQ==