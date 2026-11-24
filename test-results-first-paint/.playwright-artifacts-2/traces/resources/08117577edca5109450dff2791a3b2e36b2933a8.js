/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import ControlMixin from "/src/mixins/control.ts";
import { X_RIGHT, Y_BACK } from "/src/services/machine/orientation.ts";
import { bedFrom } from "/src/services/control/trackpad.ts";
import { DragFollow, controlDragHost } from "/src/services/control/drag-follow.ts";
import { TRACKPAD_LIVE_AVAILABLE, TRACKPAD_LIVE_REASON, liveTrackpadStream, readTrackpadMode, writeTrackpadMode } from "/src/services/control/trackpad-mode.ts";
import { zKeyWords } from "/src/services/control/z-keys.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import ControlTrackpad from "/src/components/control/ControlTrackpad.vue";
import ControlPositionReadout from "/src/components/control/ControlPositionReadout.vue";
import DevGuardMixin from "/src/mixins/dev-guard.ts";
import ControlZOffset from "/src/components/control/ControlZOffset.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import NumberField from "/src/components/control/NumberField.vue";
import { normaliseSteps } from "/src/services/settings/motion-limits.ts";
export const MOVE_STEPS = [0.1, 1, 10, 50];
const sign = (n) => n > 0 ? "+" : "\u2212";
export function jogLayout(yBack = Y_BACK, xRight = X_RIGHT) {
  const cell = (id, right, back, label) => {
    const dx = right * xRight;
    const dy = back * yBack;
    const text = right && back ? { "-1,1": "\u2196", "1,1": "\u2197", "-1,-1": "\u2199", "1,-1": "\u2198" }[`${right},${back}`] : right ? `X${sign(dx)}` : `Y${sign(dy)}`;
    const axes = [dx ? `X${sign(dx)}` : "", dy ? `Y${sign(dy)}` : ""].filter(Boolean).join(" ");
    return { id, dx, dy, text, diagonal: !!(right && back), label: right && back ? label : `${label} (${axes})` };
  };
  return [
    cell("nw", -1, 1, "Head back and left"),
    cell("n", 0, 1, "Head back"),
    cell("ne", 1, 1, "Head back and right"),
    cell("w", -1, 0, "Head left"),
    { id: "centre", dx: 0, dy: 0, text: "", diagonal: false, label: "" },
    cell("e", 1, 0, "Head right"),
    cell("sw", -1, -1, "Head forward and left"),
    cell("s", 0, -1, "Head forward"),
    cell("se", 1, -1, "Head forward and right")
  ];
}
export { zKeyWords };
const followers = /* @__PURE__ */ new WeakMap();
let ControlMove = class extends Mixins(ControlMixin, DevGuardMixin) {
  phone;
  trackpadOnly;
  step = 10;
  menu = false;
  showZOffset = false;
  goOpen = false;
  goTo = [null, null, null];
  /** What the fields started at: an axis left as it was isn't sent (so X alone moves at the head's speed). */
  goStart = [null, null, null];
  goTarget = "";
  /** The trackpad's pick, in toolhead (real) coordinates; null when nothing is picked. */
  target = null;
  targetFor = "";
  /** The target is a drag's: cleared once the drag has finished sending. */
  dragTarget = false;
  /** Why the last drag stopped, or ''. */
  dragRefusal = "";
  following = false;
  /** How a drag on the Trackpad moves the head (services/control/trackpad-mode): On release by default, remembered on this device. */
  mode = readTrackpadMode();
  liveAvailable = TRACKPAD_LIVE_AVAILABLE;
  liveReason = TRACKPAD_LIVE_AVAILABLE ? "" : TRACKPAD_LIVE_REASON;
  /**
   * A release that came while this page's last move hadn't landed yet
   * (KAN-2120): the new target is kept and sent, through moveTo, the moment
   * the wait clears. A newer release replaces it. The Klipper half (turning
   * the head mid-move) is the motion project's MUON_JOG.
   */
  queued = false;
  /** Live moving: only on the Overview's Trackpad, and only once the printer can stream it. Never a run of G1s. */
  get liveMoving() {
    return !!this.trackpadOnly && this.liveAvailable && this.mode === "live" && !!liveTrackpadStream(this.$store.getters["printer/getAvailableCommands"]);
  }
  /** The Overview's Trackpad sends one move, when the pointer lifts; nothing while it is down. */
  get releaseOnly() {
    return !!this.trackpadOnly && !this.liveMoving;
  }
  setMode(mode) {
    this.mode = writeTrackpadMode(mode);
  }
  get tileHint() {
    if (!this.xyHomedHere) return "Home first, then tap or drag the bed.";
    if (this.noGo === "invalid") return "The notch could not be read, so only raising the head is allowed.";
    return this.releaseOnly ? "Tap or drag, then let go: the head moves there once." : "Drag, and the head follows.";
  }
  /** Ticks while a pick is shown, so "is the head still moving?" is read again (that state is not reactive). */
  tick = 0;
  ticker = null;
  created() {
    followers.set(this, new DragFollow(controlDragHost(this), {
      onRefused: (reason) => {
        this.dragRefusal = reason;
        this.following = false;
      }
    }));
  }
  get follower() {
    return followers.get(this);
  }
  clearDraft() {
    this.stopDrag();
    this.goTo = [null, null, null];
    this.goOpen = false;
    this.target = null;
  }
  onTarget(target) {
    if (target && this.ticker === null) this.ticker = window.setInterval(() => this.onTick(), 250);
    if (!target && this.ticker !== null) {
      window.clearInterval(this.ticker);
      this.ticker = null;
    }
  }
  onTick() {
    this.tick++;
    if (this.queued) this.sendQueued();
    const following = !!this.follower?.following;
    if (this.following && !following && !this.dragRefusal) {
      if (this.dragTarget) this.target = null;
      this.dragTarget = false;
    }
    this.following = following;
  }
  beforeDestroy() {
    this.follower?.cancel();
    followers.delete(this);
    if (this.ticker !== null) window.clearInterval(this.ticker);
    this.ticker = null;
  }
  onCanMove(can) {
    if (!can) {
      this.stopDrag();
      this.target = null;
      this.queued = false;
    }
  }
  onMoving(moving) {
    if (moving) {
      this.stopDrag();
      this.target = null;
      this.queued = false;
    }
  }
  onGcodePosition() {
    if (this.queued) this.$nextTick(() => this.sendQueued());
  }
  get ready() {
    return this.controlReady;
  }
  /** "Locked while printing" only for a real print (print_stats); never for this page's own moves (KAN-2120). */
  get pill() {
    if (!this.ready) return "";
    if (this.printLocked) return "Locked while printing";
    if (this.busy) return "Busy";
    return this.isHomed("XYZ") ? "Homed" : "Not homed";
  }
  get pillTone() {
    return this.pill === "Homed" ? "ok" : "warn";
  }
  get printingNote() {
    const file = this.$store.state.printer.printer.print_stats?.filename ?? "";
    const name = file.split("/").pop()?.replace(/\.gcode$/i, "") ?? "";
    const what = name ? `${name} is printing.` : "A print is running.";
    return `${what} Moving comes back when it ends. Print mode and Advanced stay live, to change speed and flow mid-print.`;
  }
  /** Settings › Moving and extruding's step sizes for the head and the plate, one picker for both. */
  get moveSteps() {
    const general = this.$store.state.config?.uiSettings?.general;
    const steps = normaliseSteps([...general?.toolheadXYMoveDistances ?? [], ...general?.toolheadZMoveDistances ?? []]);
    return steps.length ? steps : MOVE_STEPS;
  }
  get stepOptions() {
    const steps = this.moveSteps;
    return steps.map((s, i) => ({ value: s, label: i === steps.length - 1 ? `${s} mm` : String(s) }));
  }
  get xyHomedHere() {
    return this.isHomed("XY");
  }
  /** The printer is moving on its own account (a print, or homing): the trackpad greys out and waits (KAN-2039). Existing state only. */
  get moving() {
    return this.busy || this.homing() || this.homing("Z");
  }
  get canMoveXY() {
    return this.ready && !this.busy && this.xyHomedHere;
  }
  get canMoveZ() {
    return this.ready && !this.busy && this.isHomed("Z");
  }
  get plate() {
    return bedFrom(this.axisMin, this.axisMax);
  }
  get jogButtons() {
    return jogLayout().map((b) => ({
      ...b,
      run: () => b.dx && b.dy ? this.moveByXY(b.dx * this.step, b.dy * this.step) : b.dx ? this.moveBy("X", b.dx * this.step) : this.moveBy("Y", b.dy * this.step)
    }));
  }
  get zKeys() {
    return zKeyWords(this.muonPrinter === true);
  }
  fmt(n) {
    return (Math.round(n * 10) / 10).toFixed(1);
  }
  // -- trackpad --------------------------------------------------------------
  get pickHint() {
    if (!this.xyHomedHere) return "Home all, then tap the bed to pick a spot.";
    if (this.noGo === "invalid") return "The notch could not be read, so only raising the head is allowed.";
    return "Tap the bed to pick a spot, then press Move here. Or drag, and the head follows.";
  }
  get pickNote() {
    if (this.dragRefusal) return `Stopped following. ${this.dragRefusal}`;
    if (this.following) return "Following the drag\u2026";
    if (this.queued && !this.targetProblem) return "Goes there as soon as the current move lands.";
    if (this.releaseOnly) return this.targetProblem || this.targetNote;
    return this.targetProblem || this.pickWait || this.targetNote;
  }
  /** Picking only sets the target. Nothing is sent. */
  pick(p) {
    if (!this.canMoveXY || this.following) return;
    this.target = { x: p.x, y: p.y };
    this.targetFor = this.panelTarget;
    this.dragTarget = false;
    this.dragRefusal = "";
  }
  /**
   * The pointer lifted (or Enter was pressed) on the Overview's Trackpad: the
   * one move, through moveTo and its planner (so the notch rule holds).
   * Nothing was sent while the pointer was down. If this page's last move
   * hasn't landed yet, the target is queued and sent when it has (a later
   * release replaces it); a refused target stays on the pad and says why.
   */
  release() {
    if (!this.releaseOnly || !this.target || !this.canMoveXY || this.targetFor !== this.panelTarget) return;
    if (this.targetProblem) {
      this.queued = false;
      return;
    }
    if (this.handMoveWait()) {
      this.queued = true;
      return;
    }
    this.queued = false;
    this.confirmMove();
  }
  /** Send the queued target once nothing is in the way any more; drop it if it can no longer go. */
  sendQueued() {
    if (!this.queued) return;
    if (!this.target || !this.canMoveXY || this.targetFor !== this.panelTarget || this.targetProblem) {
      this.queued = false;
      return;
    }
    if (this.handMoveWait()) return;
    this.queued = false;
    this.confirmMove();
  }
  clearTarget() {
    this.target = null;
    this.dragRefusal = "";
  }
  /** A point in G-code coordinates (what moveTo takes): the real spot minus the offsets in force. */
  placeOf(p) {
    const offset = this.gcodeOffset ?? [0, 0, 0];
    return {
      X: Math.round((p.x - offset[0]) * 1e3) / 1e3,
      Y: Math.round((p.y - offset[1]) * 1e3) / 1e3
    };
  }
  get targetPlace() {
    return this.target ? this.placeOf(this.target) : null;
  }
  // -- live drag -------------------------------------------------------------
  /** A drag began: the head follows it, one planned move at a time (drag-follow). */
  dragStart(p) {
    if (!this.canMoveXY || !this.follower) return;
    if (this.releaseOnly) {
      this.pick(p);
      return;
    }
    this.target = { x: p.x, y: p.y };
    this.targetFor = this.panelTarget;
    this.dragTarget = true;
    this.dragRefusal = "";
    this.following = true;
    this.follower.start(this.placeOf(p));
    this.following = this.follower.following;
  }
  dragTo(p) {
    if (this.releaseOnly) {
      this.pick(p);
      return;
    }
    if (!this.follower?.following || !this.canMoveXY) return;
    this.target = { x: p.x, y: p.y };
    this.follower.update(this.placeOf(p));
  }
  dragEnd() {
    this.follower?.release();
  }
  /** Pointer cancelled, focus or capture lost: stop at once, send nothing more. The pick stays, for Move here. */
  dragCancel() {
    this.stopDrag();
    if (this.releaseOnly) {
      this.target = null;
      this.queued = false;
    }
  }
  stopDrag() {
    this.follower?.cancel();
    this.following = false;
    this.dragTarget = false;
  }
  /** What the planner would do with the pick now: the same plan moveTo makes when it is confirmed. */
  get targetPlan() {
    if (!this.target) return null;
    return this.planHandMove([this.target.x, this.target.y, Number(this.position[2])]);
  }
  /** Why the pick can't be moved to, or ''. */
  get targetProblem() {
    const place = this.targetPlace;
    const plan = this.targetPlan;
    if (!place || !plan) return "";
    if (!plan.ok) return plan.reason;
    if (place.X < this.axisMin[0] || place.X > this.axisMax[0] || place.Y < this.axisMin[1] || place.Y > this.axisMax[1]) return "That spot is outside the machine.";
    return "";
  }
  liftNote(plan, there) {
    if (!plan.ok) return "";
    if (plan.lifted) {
      const lift = Number(plan.steps[0].Z) + (this.gcodeOffset ?? [0, 0, 0])[2];
      return `Lifts to Z ${Math.round(lift * 100) / 100} first, to cross the notch`;
    }
    return there;
  }
  get targetNote() {
    const plan = this.targetPlan;
    if (!plan) return "";
    return this.liftNote(plan, `Straight there, at Z ${(Number(this.position[2]) || 0).toFixed(2)}`);
  }
  /** Why Move here must wait (the last hand move or a script hasn't landed), or ''. */
  get pickWait() {
    const seen = [this.tick, this.$store.state.printer.printer.gcode_move?.gcode_position];
    return this.target && seen ? this.handMoveWait() : "";
  }
  get canConfirm() {
    return this.canMoveXY && !!this.target && !this.targetProblem && !this.pickWait && !this.following && this.targetFor === this.panelTarget;
  }
  /** The confirm step: only here does a pick become a move, through moveTo and its planner. The pick stays if nothing was sent. */
  confirmMove() {
    const place = this.targetPlace;
    if (!this.canConfirm || !place) return;
    if (this.moveTo(place)) this.target = null;
  }
  // -- keys --------------------------------------------------------------------
  /** Arrow keys step the head, PgUp and PgDn the plate; Shift is ten steps. */
  onPadKey(event) {
    const by = this.step * (event.shiftKey ? 10 : 1);
    const keys = {
      ArrowUp: ["Y", Y_BACK * by],
      ArrowDown: ["Y", -Y_BACK * by],
      ArrowLeft: ["X", -X_RIGHT * by],
      ArrowRight: ["X", X_RIGHT * by],
      PageUp: ["Z", by],
      PageDown: ["Z", -by]
    };
    const move = keys[event.key];
    if (!move || event.target !== event.currentTarget) return;
    event.preventDefault();
    if (move[0] === "Z" ? this.canMoveZ : this.canMoveXY) this.moveBy(move[0], move[1]);
  }
  // -- go to -------------------------------------------------------------------
  /** The readout turns into fields, filled with where the head is in G-code coordinates (what Go sends). */
  openGoTo() {
    const g = this.$store.state.printer.printer.gcode_move?.gcode_position;
    const at = Array.isArray(g) ? g : this.position;
    this.goTo = [0, 1, 2].map((i) => Math.round(Number(at[i]) * 100) / 100);
    this.goStart = [...this.goTo];
    this.goTarget = this.panelTarget;
    this.goOpen = true;
  }
  setGoTo(i, value) {
    this.goTo.splice(i, 1, value);
  }
  get goPlace() {
    const changed = (i) => {
      const v = this.goTo[i];
      return v !== null && v !== this.goStart[i] ? v : void 0;
    };
    return { X: changed(0), Y: changed(1), Z: changed(2) };
  }
  get goProblem() {
    if (!this.goOpen) return "";
    const place = this.goPlace;
    if (place.X === void 0 && place.Y === void 0 && place.Z === void 0) return "Change a value to go somewhere.";
    return this.moveRefusal(place);
  }
  get goNote() {
    if (!this.goOpen || this.goProblem) return "";
    const offset = this.gcodeOffset ?? [0, 0, 0];
    const real = ["X", "Y", "Z"].map((a, i) => this.goPlace[a] !== void 0 ? this.goPlace[a] + offset[i] : Number(this.position[i]));
    return this.liftNote(this.planHandMove(real), "Straight there.");
  }
  get canGo() {
    return this.goOpen && this.goTarget === this.panelTarget && !this.goProblem;
  }
  go() {
    if (!this.canGo) return;
    if (this.moveTo(this.goPlace)) this.goOpen = false;
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlMove.prototype, "phone", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlMove.prototype, "trackpadOnly", 2);
__decorateClass([
  Watch("panelTarget")
], ControlMove.prototype, "clearDraft", 1);
__decorateClass([
  Watch("target")
], ControlMove.prototype, "onTarget", 1);
__decorateClass([
  Watch("canMoveXY")
], ControlMove.prototype, "onCanMove", 1);
__decorateClass([
  Watch("moving")
], ControlMove.prototype, "onMoving", 1);
__decorateClass([
  Watch("$store.state.printer.printer.gcode_move.gcode_position")
], ControlMove.prototype, "onGcodePosition", 1);
ControlMove = __decorateClass([
  Component({ components: { ControlCard, ControlTrackpad, ControlPositionReadout, ControlZOffset, SegPicker, NumberField } })
], ControlMove);
const _sfc_main = ControlMove;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": _vm.trackpadOnly ? "Trackpad" : "Movement", "icon": "control", "pill": _vm.pill, "pill-tone": _vm.pillTone, "locked": _vm.ready ? "" : _vm.controlLock, "data-tid": "control-move" }, scopedSlots: _vm._u([{ key: "aside", fn: function() {
    return [_vm.ready ? _c("span", { staticClass: "move__hhomes", attrs: { "data-tid": "move-homes" } }, [_c("button", { staticClass: "move__hbtn", class: { "move__hbtn--icon": _vm.trackpadOnly }, attrs: { "type": "button", "disabled": _vm.busy, "aria-label": _vm.trackpadOnly ? "Home all" : void 0, "title": "Home all (G28)", "data-tid": "home-all" }, on: { "click": function($event) {
      return _vm.home();
    } } }, [_vm.homing() ? _c(__unplugin_components_0, { attrs: { "indeterminate": "", "size": "14", "width": "2" } }) : _c(__unplugin_components_1, { attrs: { "name": "home", "small": "" } }), !_vm.trackpadOnly ? _c("span", [_vm._v("Home all")]) : _vm._e()], 1), !_vm.trackpadOnly ? _c("button", { staticClass: "move__hbtn move__hbtn--z", attrs: { "type": "button", "disabled": _vm.busy, "aria-label": "Home Z", "title": "Home Z (G28 Z)", "data-tid": "home-z" }, on: { "click": function($event) {
      return _vm.home("Z");
    } } }, [_vm.homing("Z") ? _c(__unplugin_components_2, { attrs: { "indeterminate": "", "size": "14", "width": "2" } }) : [_vm._v(" Z ")]], 2) : _vm._e()]) : _vm._e(), _c(__unplugin_components_3, { attrs: { "bottom": "", "left": "", "offset-y": "", "nudge-bottom": "6", "min-width": "240", "content-class": "muon-account__menu" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
      return [_c("button", _vm._g(_vm._b({ staticClass: "move__more", attrs: { "type": "button", "aria-label": "More for Movement", "data-tid": "move-more" } }, "button", attrs, false), on), [_c(__unplugin_components_4, { attrs: { "name": "more", "small": "" } })], 1)];
    } }]), model: { value: _vm.menu, callback: function($$v) {
      _vm.menu = $$v;
    }, expression: "menu" } }, [_c("div", { staticClass: "acct-menu", attrs: { "role": "menu", "aria-label": "More for Movement" } }, [_c("button", { staticClass: "acct-menu__item", attrs: { "type": "button", "role": "menuitem", "disabled": !_vm.ready || _vm.busy, "data-tid": "motors-off" }, on: { "click": _vm.motorsOff } }, [_vm._v(" Turn motors off"), _c("span", { staticClass: "acct-menu__key" }, [_vm._v("M84")])]), !_vm.devOnlyLocked ? [_c("div", { staticClass: "acct-menu__rule" }), _c("button", { staticClass: "acct-menu__item", attrs: { "type": "button", "role": "menuitem", "data-tid": "menu-zoffset" }, on: { "click": function($event) {
      _vm.showZOffset = !_vm.showZOffset;
    } } }, [_vm._v(" " + _vm._s(_vm.showZOffset ? "Hide Z offset" : "Z offset") + " ")])] : _vm._e()], 2)])];
  }, proxy: true }]) }, [_vm.ready ? [_vm.printLocked ? _c("p", { staticClass: "move__note", attrs: { "data-tid": "move-printing" } }, [_vm._v(" " + _vm._s(_vm.printingNote) + " ")]) : _vm.busy ? _c("p", { staticClass: "move__note", attrs: { "data-tid": "move-busy" } }, [_vm._v(" The printer is busy (homing, or running a command). Moving comes back when it finishes. ")]) : _vm._e(), !_vm.isHomed("XYZ") && !_vm.trackpadOnly ? _c("div", { staticClass: "move__callout", attrs: { "data-tid": "move-not-homed" } }, [_c(__unplugin_components_5, { attrs: { "name": "home", "small": "" } }), _c("span", [_vm._v("Home before moving. The trackpad needs to know where the head is.")])], 1) : _vm._e(), _c("div", { staticClass: "move__body", class: { "move__body--phone": _vm.phone, "move__body--solo": _vm.trackpadOnly, "move__body--dim": !_vm.isHomed("XY") && !_vm.isHomed("Z") } }, [_c("div", { staticClass: "move__zone", class: { "move__zone--compact": _vm.trackpadOnly } }, [!_vm.trackpadOnly ? _c("div", { staticClass: "move__sub" }, [_vm._v(" Trackpad"), _c("span", [_vm._v("Tap to pick a spot, or drag and the head follows")])]) : _vm._e(), _c("div", { staticClass: "move__padwrap", class: { "move__padwrap--bare": !_vm.trackpadOnly } }, [_vm.plate ? _c("control-trackpad", { staticClass: "move__pad", attrs: { "bed": _vm.plate, "show-head": _vm.xyHomedHere, "target": _vm.target, "target-bad": !!_vm.targetProblem || !!_vm.dragRefusal, "no-go": _vm.noGo, "disabled": !_vm.canMoveXY || _vm.moving, "on-release": _vm.releaseOnly, "step": _vm.step }, on: { "pick": _vm.pick, "drag-start": _vm.dragStart, "drag": _vm.dragTo, "drag-end": _vm.dragEnd, "drag-cancel": _vm.dragCancel, "release": _vm.release } }, [_vm.trackpadOnly ? [_vm.target ? _c("span", { staticClass: "move__glass move__readout", attrs: { "data-tid": "trackpad-readout" } }, [_vm._v("X " + _vm._s(_vm.fmt(_vm.target.x)) + " \xB7 Y " + _vm._s(_vm.fmt(_vm.target.y)))]) : _vm._e(), _c("span", { staticClass: "move__glass move__mode", attrs: { "role": "radiogroup", "aria-label": "How the trackpad moves", "data-tid": "trackpad-mode" }, on: { "pointerdown": function($event) {
    $event.stopPropagation();
  }, "keydown": function($event) {
    $event.stopPropagation();
  } } }, [_c("span", { staticClass: "move__modewrap", attrs: { "title": _vm.liveReason, "data-tid": "trackpad-live-wrap" } }, [_c("button", { class: { on: _vm.liveMoving }, attrs: { "type": "button", "role": "radio", "aria-checked": _vm.liveMoving ? "true" : "false", "disabled": !_vm.liveAvailable, "aria-description": _vm.liveAvailable ? void 0 : _vm.liveReason, "data-tid": "trackpad-live" }, on: { "click": function($event) {
    return _vm.setMode("live");
  } } }, [_vm._v("Live")])]), _c("button", { class: { on: !_vm.liveMoving }, attrs: { "type": "button", "role": "radio", "aria-checked": _vm.liveMoving ? "false" : "true", "data-tid": "trackpad-release" }, on: { "click": function($event) {
    return _vm.setMode("release");
  } } }, [_vm._v("On release")])])] : _vm._e()], 2) : _vm._e()], 1), _vm.trackpadOnly ? _c("div", { staticClass: "move__pick move__pick--line", attrs: { "data-tid": "trackpad-pick", "aria-live": "polite" } }, [_c("span", { staticClass: "move__pick-note", class: { "move__pick-note--bad": !!_vm.dragRefusal || !!_vm.targetProblem }, attrs: { "data-tid": "trackpad-note" } }, [_vm._v(_vm._s(_vm.target ? _vm.pickNote : _vm.tileHint))])]) : _c("div", { staticClass: "move__pick", attrs: { "data-tid": "trackpad-pick", "aria-live": "polite" } }, [_vm.target ? [_c("span", { staticClass: "move__pick-text" }, [_c("b", [_vm._v("X " + _vm._s(_vm.fmt(_vm.target.x)) + " \xB7 Y " + _vm._s(_vm.fmt(_vm.target.y)))]), _c("span", { staticClass: "move__pick-note", class: { "move__pick-note--bad": !!_vm.dragRefusal || !!_vm.targetProblem }, attrs: { "data-tid": "trackpad-note" } }, [_vm._v(_vm._s(_vm.pickNote))])]), !_vm.following ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "trackpad-clear" }, on: { "click": _vm.clearTarget } }, [_vm._v(" Clear ")]) : _vm._e(), !_vm.following ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.canConfirm, "data-tid": "trackpad-move" }, on: { "click": _vm.confirmMove } }, [_vm._v(" Move here ")]) : _vm._e()] : _c("span", { staticClass: "move__pick-note" }, [_vm._v(_vm._s(_vm.pickHint))])], 2)]), !_vm.trackpadOnly ? _c("div", { staticClass: "move__zone" }, [_c("div", { staticClass: "move__sub" }, [_vm._v(" Fine jog ")]), _c("seg-picker", { attrs: { "options": _vm.stepOptions, "value": _vm.step, "label": "Step", "fill": "" }, on: { "input": function($event) {
    _vm.step = $event;
  } } }), _c("div", { staticClass: "move__jog", attrs: { "tabindex": "0", "role": "group", "aria-label": "Jog pad. Arrow keys step the head, Page Up and Page Down the plate.", "data-tid": "move-pad" }, on: { "keydown": _vm.onPadKey } }, [_c("div", { staticClass: "move__xy" }, [_vm._l(_vm.jogButtons, function(b) {
    return [b.id === "centre" ? _c("span", { key: b.id, staticClass: "move__dot", attrs: { "aria-hidden": "true", "data-tid": "jog-centre" } }, [_c("i")]) : _c("button", { key: b.id, staticClass: "move__b", class: [`move__b--${b.id}`, { "move__b--diag": b.diagonal }], attrs: { "type": "button", "aria-label": b.label, "title": b.label, "disabled": !_vm.canMoveXY }, on: { "click": function($event) {
      return b.run();
    } } }, [_vm._v(" " + _vm._s(b.text) + " ")])];
  })], 2), _c("div", { staticClass: "move__zcol" }, [_c("button", { staticClass: "move__b move__b--z", attrs: { "type": "button", "aria-label": _vm.zKeys.up.label, "title": _vm.zKeys.up.title, "disabled": !_vm.canMoveZ, "data-tid": "jog-z-up" }, on: { "click": function($event) {
    return _vm.moveBy("Z", _vm.step);
  } } }, [_vm._v(" " + _vm._s(_vm.zKeys.up.text) + " ")]), _c("control-position-readout", { staticClass: "move__zv", attrs: { "axes": "Z", "stack": "" } }), _c("button", { staticClass: "move__b move__b--z", attrs: { "type": "button", "aria-label": _vm.zKeys.down.label, "title": _vm.zKeys.down.title, "disabled": !_vm.canMoveZ, "data-tid": "jog-z-down" }, on: { "click": function($event) {
    return _vm.moveBy("Z", -_vm.step);
  } } }, [_vm._v(" " + _vm._s(_vm.zKeys.down.text) + " ")])], 1)])], 1) : _vm._e()]), !_vm.trackpadOnly ? _c("div", { staticClass: "move__bar", attrs: { "data-tid": "move-position" } }, [!_vm.goOpen ? [_c("control-position-readout"), _c("button", { staticClass: "cbtn move__goto", attrs: { "type": "button", "disabled": !_vm.isHomed("XYZ"), "data-tid": "move-goto" }, on: { "click": _vm.openGoTo } }, [_vm._v(" Go to\u2026 ")])] : _c("form", { staticClass: "move__go", attrs: { "aria-label": "Go to a position", "data-tid": "move-go-form" }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.go.apply(null, arguments);
  } } }, [_vm._l(["X", "Y", "Z"], function(axis, i) {
    return _c("label", { key: axis, staticClass: "move__field" }, [_c("span", [_vm._v(_vm._s(axis))]), _c("number-field", { attrs: { "value": _vm.goTo[i], "decimals": 2, "min": _vm.axisMin[i], "max": _vm.axisMax[i], "label": `${axis} to go to` }, on: { "change": function($event) {
      return _vm.setGoTo(i, $event);
    } } })], 1);
  }), _c("span", { staticClass: "move__pick-note move__go-note", class: { "move__pick-note--bad": !!_vm.goProblem }, attrs: { "data-tid": "move-go-note" } }, [_vm._v(_vm._s(_vm.goProblem || _vm.goNote))]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "move-go-cancel" }, on: { "click": function($event) {
    _vm.goOpen = false;
  } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "disabled": !_vm.canGo, "data-tid": "move-go" } }, [_vm._v(" Go ")])], 2)], 2) : _vm._e()] : _vm._e(), !_vm.devOnlyLocked && _vm.showZOffset ? _c("control-z-offset", { staticClass: "move__zoffset" }) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlMove.vue?vue&type=style&index=0&scoped=d8f365c8&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "d8f365c8",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlMove.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQXdhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFLQTtBQUVBO0FBUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FDQSxpR0FDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFHQTtBQUdBO0FBZUE7QUFBQSxFQUVBO0FBQUEsRUFJQTtBQUFBO0VBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUtBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFLQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBbGFBO0FBQUEsRUFEQTtBQUFBLEdBREEsWUFFQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBTEEsWUFNQTtBQWlFQTtBQUFBO0dBdkVBLFlBdUVBO0FBUUE7QUFBQTtHQS9FQSxZQStFQTtBQTBCQTtBQUFBLEVBREE7QUFBQSxHQXhHQSxZQXlHQTtBQVNBO0FBQUE7R0FsSEEsWUFrSEE7QUFVQTtBQUFBLEVBREE7QUFBQSxHQTNIQSxZQTRIQTtBQTVIQTtBQUFBO0FBQUEiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2xNb3ZlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxjb250cm9sLWNhcmRcbiAgICA6dGl0bGU9XCJ0cmFja3BhZE9ubHkgPyAnVHJhY2twYWQnIDogJ01vdmVtZW50J1wiXG4gICAgaWNvbj1cImNvbnRyb2xcIlxuICAgIDpwaWxsPVwicGlsbFwiXG4gICAgOnBpbGwtdG9uZT1cInBpbGxUb25lXCJcbiAgICA6bG9ja2VkPVwicmVhZHkgPyAnJyA6IGNvbnRyb2xMb2NrXCJcbiAgICBkYXRhLXRpZD1cImNvbnRyb2wtbW92ZVwiXG4gID5cbiAgICA8dGVtcGxhdGUgI2FzaWRlPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cInJlYWR5XCJcbiAgICAgICAgY2xhc3M9XCJtb3ZlX19oaG9tZXNcIlxuICAgICAgICBkYXRhLXRpZD1cIm1vdmUtaG9tZXNcIlxuICAgICAgPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJtb3ZlX19oYnRuXCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdtb3ZlX19oYnRuLS1pY29uJzogdHJhY2twYWRPbmx5IH1cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwidHJhY2twYWRPbmx5ID8gJ0hvbWUgYWxsJyA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgdGl0bGU9XCJIb21lIGFsbCAoRzI4KVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJob21lLWFsbFwiXG4gICAgICAgICAgQGNsaWNrPVwiaG9tZSgpXCJcbiAgICAgICAgPlxuICAgICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgICAgICB2LWlmPVwiaG9taW5nKClcIlxuICAgICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgICAgc2l6ZT1cIjE0XCJcbiAgICAgICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICBuYW1lPVwiaG9tZVwiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHNwYW4gdi1pZj1cIiF0cmFja3BhZE9ubHlcIj5Ib21lIGFsbDwvc3Bhbj5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWlmPVwiIXRyYWNrcGFkT25seVwiXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJtb3ZlX19oYnRuIG1vdmVfX2hidG4tLXpcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJIb21lIFpcIlxuICAgICAgICAgIHRpdGxlPVwiSG9tZSBaIChHMjggWilcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiaG9tZS16XCJcbiAgICAgICAgICBAY2xpY2s9XCJob21lKCdaJylcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICAgIHYtaWY9XCJob21pbmcoJ1onKVwiXG4gICAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgICBzaXplPVwiMTRcIlxuICAgICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgICAgICBaXG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3NwYW4+XG4gICAgICA8di1tZW51XG4gICAgICAgIHYtbW9kZWw9XCJtZW51XCJcbiAgICAgICAgYm90dG9tXG4gICAgICAgIGxlZnRcbiAgICAgICAgb2Zmc2V0LXlcbiAgICAgICAgbnVkZ2UtYm90dG9tPVwiNlwiXG4gICAgICAgIG1pbi13aWR0aD1cIjI0MFwiXG4gICAgICAgIGNvbnRlbnQtY2xhc3M9XCJtdW9uLWFjY291bnRfX21lbnVcIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fbW9yZVwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiTW9yZSBmb3IgTW92ZW1lbnRcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLW1vcmVcIlxuICAgICAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICBuYW1lPVwibW9yZVwiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJhY2N0LW1lbnVcIlxuICAgICAgICAgIHJvbGU9XCJtZW51XCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiTW9yZSBmb3IgTW92ZW1lbnRcIlxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImFjY3QtbWVudV9faXRlbVwiXG4gICAgICAgICAgICByb2xlPVwibWVudWl0ZW1cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIXJlYWR5IHx8IGJ1c3lcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtb3RvcnMtb2ZmXCJcbiAgICAgICAgICAgIEBjbGljaz1cIm1vdG9yc09mZlwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVHVybiBtb3RvcnMgb2ZmPHNwYW4gY2xhc3M9XCJhY2N0LW1lbnVfX2tleVwiPk04NDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8dGVtcGxhdGUgdi1pZj1cIiFkZXZPbmx5TG9ja2VkXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYWNjdC1tZW51X19ydWxlXCIgLz5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiYWNjdC1tZW51X19pdGVtXCJcbiAgICAgICAgICAgICAgcm9sZT1cIm1lbnVpdGVtXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJtZW51LXpvZmZzZXRcIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJzaG93Wk9mZnNldCA9ICFzaG93Wk9mZnNldFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt7IHNob3daT2Zmc2V0ID8gJ0hpZGUgWiBvZmZzZXQnIDogJ1ogb2Zmc2V0JyB9fVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3YtbWVudT5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPHRlbXBsYXRlIHYtaWY9XCJyZWFkeVwiPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cInByaW50TG9ja2VkXCJcbiAgICAgICAgY2xhc3M9XCJtb3ZlX19ub3RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLXByaW50aW5nXCJcbiAgICAgID5cbiAgICAgICAge3sgcHJpbnRpbmdOb3RlIH19XG4gICAgICA8L3A+XG4gICAgICA8cFxuICAgICAgICB2LWVsc2UtaWY9XCJidXN5XCJcbiAgICAgICAgY2xhc3M9XCJtb3ZlX19ub3RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLWJ1c3lcIlxuICAgICAgPlxuICAgICAgICBUaGUgcHJpbnRlciBpcyBidXN5IChob21pbmcsIG9yIHJ1bm5pbmcgYSBjb21tYW5kKS4gTW92aW5nIGNvbWVzIGJhY2sgd2hlbiBpdCBmaW5pc2hlcy5cbiAgICAgIDwvcD5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cIiFpc0hvbWVkKCdYWVonKSAmJiAhdHJhY2twYWRPbmx5XCJcbiAgICAgICAgY2xhc3M9XCJtb3ZlX19jYWxsb3V0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLW5vdC1ob21lZFwiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cImhvbWVcIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICAgIDxzcGFuPkhvbWUgYmVmb3JlIG1vdmluZy4gVGhlIHRyYWNrcGFkIG5lZWRzIHRvIGtub3cgd2hlcmUgdGhlIGhlYWQgaXMuPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3M9XCJtb3ZlX19ib2R5XCJcbiAgICAgICAgOmNsYXNzPVwieyAnbW92ZV9fYm9keS0tcGhvbmUnOiBwaG9uZSwgJ21vdmVfX2JvZHktLXNvbG8nOiB0cmFja3BhZE9ubHksICdtb3ZlX19ib2R5LS1kaW0nOiAhaXNIb21lZCgnWFknKSAmJiAhaXNIb21lZCgnWicpIH1cIlxuICAgICAgPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJtb3ZlX196b25lXCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdtb3ZlX196b25lLS1jb21wYWN0JzogdHJhY2twYWRPbmx5IH1cIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1pZj1cIiF0cmFja3BhZE9ubHlcIlxuICAgICAgICAgICAgY2xhc3M9XCJtb3ZlX19zdWJcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFRyYWNrcGFkPHNwYW4+VGFwIHRvIHBpY2sgYSBzcG90LCBvciBkcmFnIGFuZCB0aGUgaGVhZCBmb2xsb3dzPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fcGFkd3JhcFwiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdtb3ZlX19wYWR3cmFwLS1iYXJlJzogIXRyYWNrcGFkT25seSB9XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Y29udHJvbC10cmFja3BhZFxuICAgICAgICAgICAgICB2LWlmPVwicGxhdGVcIlxuICAgICAgICAgICAgICBjbGFzcz1cIm1vdmVfX3BhZFwiXG4gICAgICAgICAgICAgIDpiZWQ9XCJwbGF0ZVwiXG4gICAgICAgICAgICAgIDpzaG93LWhlYWQ9XCJ4eUhvbWVkSGVyZVwiXG4gICAgICAgICAgICAgIDp0YXJnZXQ9XCJ0YXJnZXRcIlxuICAgICAgICAgICAgICA6dGFyZ2V0LWJhZD1cIiEhdGFyZ2V0UHJvYmxlbSB8fCAhIWRyYWdSZWZ1c2FsXCJcbiAgICAgICAgICAgICAgOm5vLWdvPVwibm9Hb1wiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlWFkgfHwgbW92aW5nXCJcbiAgICAgICAgICAgICAgOm9uLXJlbGVhc2U9XCJyZWxlYXNlT25seVwiXG4gICAgICAgICAgICAgIDpzdGVwPVwic3RlcFwiXG4gICAgICAgICAgICAgIEBwaWNrPVwicGlja1wiXG4gICAgICAgICAgICAgIEBkcmFnLXN0YXJ0PVwiZHJhZ1N0YXJ0XCJcbiAgICAgICAgICAgICAgQGRyYWc9XCJkcmFnVG9cIlxuICAgICAgICAgICAgICBAZHJhZy1lbmQ9XCJkcmFnRW5kXCJcbiAgICAgICAgICAgICAgQGRyYWctY2FuY2VsPVwiZHJhZ0NhbmNlbFwiXG4gICAgICAgICAgICAgIEByZWxlYXNlPVwicmVsZWFzZVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwidHJhY2twYWRPbmx5XCI+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtaWY9XCJ0YXJnZXRcIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJtb3ZlX19nbGFzcyBtb3ZlX19yZWFkb3V0XCJcbiAgICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwidHJhY2twYWQtcmVhZG91dFwiXG4gICAgICAgICAgICAgICAgPlgge3sgZm10KHRhcmdldC54KSB9fSDCtyBZIHt7IGZtdCh0YXJnZXQueSkgfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fZ2xhc3MgbW92ZV9fbW9kZVwiXG4gICAgICAgICAgICAgICAgICByb2xlPVwicmFkaW9ncm91cFwiXG4gICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiSG93IHRoZSB0cmFja3BhZCBtb3Zlc1wiXG4gICAgICAgICAgICAgICAgICBkYXRhLXRpZD1cInRyYWNrcGFkLW1vZGVcIlxuICAgICAgICAgICAgICAgICAgQHBvaW50ZXJkb3duLnN0b3BcbiAgICAgICAgICAgICAgICAgIEBrZXlkb3duLnN0b3BcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICBjbGFzcz1cIm1vdmVfX21vZGV3cmFwXCJcbiAgICAgICAgICAgICAgICAgICAgOnRpdGxlPVwibGl2ZVJlYXNvblwiXG4gICAgICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwidHJhY2twYWQtbGl2ZS13cmFwXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgIHJvbGU9XCJyYWRpb1wiXG4gICAgICAgICAgICAgICAgICAgICAgOmFyaWEtY2hlY2tlZD1cImxpdmVNb3ZpbmcgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgICAgICAgICAgICA6Y2xhc3M9XCJ7IG9uOiBsaXZlTW92aW5nIH1cIlxuICAgICAgICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFsaXZlQXZhaWxhYmxlXCJcbiAgICAgICAgICAgICAgICAgICAgICA6YXJpYS1kZXNjcmlwdGlvbj1cImxpdmVBdmFpbGFibGUgPyB1bmRlZmluZWQgOiBsaXZlUmVhc29uXCJcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhLXRpZD1cInRyYWNrcGFkLWxpdmVcIlxuICAgICAgICAgICAgICAgICAgICAgIEBjbGljaz1cInNldE1vZGUoJ2xpdmUnKVwiXG4gICAgICAgICAgICAgICAgICAgID5MaXZlPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICByb2xlPVwicmFkaW9cIlxuICAgICAgICAgICAgICAgICAgICA6YXJpYS1jaGVja2VkPVwibGl2ZU1vdmluZyA/ICdmYWxzZScgOiAndHJ1ZSdcIlxuICAgICAgICAgICAgICAgICAgICA6Y2xhc3M9XCJ7IG9uOiAhbGl2ZU1vdmluZyB9XCJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ0cmFja3BhZC1yZWxlYXNlXCJcbiAgICAgICAgICAgICAgICAgICAgQGNsaWNrPVwic2V0TW9kZSgncmVsZWFzZScpXCJcbiAgICAgICAgICAgICAgICAgID5PbiByZWxlYXNlPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgPC9jb250cm9sLXRyYWNrcGFkPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtaWY9XCJ0cmFja3BhZE9ubHlcIlxuICAgICAgICAgICAgY2xhc3M9XCJtb3ZlX19waWNrIG1vdmVfX3BpY2stLWxpbmVcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ0cmFja3BhZC1waWNrXCJcbiAgICAgICAgICAgIGFyaWEtbGl2ZT1cInBvbGl0ZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgY2xhc3M9XCJtb3ZlX19waWNrLW5vdGVcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdtb3ZlX19waWNrLW5vdGUtLWJhZCc6ICEhZHJhZ1JlZnVzYWwgfHwgISF0YXJnZXRQcm9ibGVtIH1cIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInRyYWNrcGFkLW5vdGVcIlxuICAgICAgICAgICAgPnt7IHRhcmdldCA/IHBpY2tOb3RlIDogdGlsZUhpbnQgfX08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICBjbGFzcz1cIm1vdmVfX3BpY2tcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJ0cmFja3BhZC1waWNrXCJcbiAgICAgICAgICAgIGFyaWEtbGl2ZT1cInBvbGl0ZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCJ0YXJnZXRcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJtb3ZlX19waWNrLXRleHRcIj5cbiAgICAgICAgICAgICAgICA8Yj5YIHt7IGZtdCh0YXJnZXQueCkgfX0gwrcgWSB7eyBmbXQodGFyZ2V0LnkpIH19PC9iPlxuICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cIm1vdmVfX3BpY2stbm90ZVwiXG4gICAgICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdtb3ZlX19waWNrLW5vdGUtLWJhZCc6ICEhZHJhZ1JlZnVzYWwgfHwgISF0YXJnZXRQcm9ibGVtIH1cIlxuICAgICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ0cmFja3BhZC1ub3RlXCJcbiAgICAgICAgICAgICAgICA+e3sgcGlja05vdGUgfX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHYtaWY9XCIhZm9sbG93aW5nXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwidHJhY2twYWQtY2xlYXJcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImNsZWFyVGFyZ2V0XCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIENsZWFyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1pZj1cIiFmb2xsb3dpbmdcIlxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuQ29uZmlybVwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJ0cmFja3BhZC1tb3ZlXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJjb25maXJtTW92ZVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICBNb3ZlIGhlcmVcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fcGljay1ub3RlXCJcbiAgICAgICAgICAgID57eyBwaWNrSGludCB9fTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCIhdHJhY2twYWRPbmx5XCJcbiAgICAgICAgICBjbGFzcz1cIm1vdmVfX3pvbmVcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1vdmVfX3N1YlwiPlxuICAgICAgICAgICAgRmluZSBqb2dcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c2VnLXBpY2tlclxuICAgICAgICAgICAgOm9wdGlvbnM9XCJzdGVwT3B0aW9uc1wiXG4gICAgICAgICAgICA6dmFsdWU9XCJzdGVwXCJcbiAgICAgICAgICAgIGxhYmVsPVwiU3RlcFwiXG4gICAgICAgICAgICBmaWxsXG4gICAgICAgICAgICBAaW5wdXQ9XCJzdGVwID0gJGV2ZW50XCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fam9nXCJcbiAgICAgICAgICAgIHRhYmluZGV4PVwiMFwiXG4gICAgICAgICAgICByb2xlPVwiZ3JvdXBcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkpvZyBwYWQuIEFycm93IGtleXMgc3RlcCB0aGUgaGVhZCwgUGFnZSBVcCBhbmQgUGFnZSBEb3duIHRoZSBwbGF0ZS5cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLXBhZFwiXG4gICAgICAgICAgICBAa2V5ZG93bj1cIm9uUGFkS2V5XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW92ZV9feHlcIj5cbiAgICAgICAgICAgICAgPHRlbXBsYXRlIHYtZm9yPVwiYiBpbiBqb2dCdXR0b25zXCI+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtaWY9XCJiLmlkID09PSAnY2VudHJlJ1wiXG4gICAgICAgICAgICAgICAgICA6a2V5PVwiYi5pZFwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cIm1vdmVfX2RvdFwiXG4gICAgICAgICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJqb2ctY2VudHJlXCJcbiAgICAgICAgICAgICAgICA+PGkgLz48L3NwYW4+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgICAgICA6a2V5PVwiYi5pZFwiXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fYlwiXG4gICAgICAgICAgICAgICAgICA6Y2xhc3M9XCJbYG1vdmVfX2ItLSR7Yi5pZH1gLCB7ICdtb3ZlX19iLS1kaWFnJzogYi5kaWFnb25hbCB9XVwiXG4gICAgICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cImIubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgOnRpdGxlPVwiYi5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuTW92ZVhZXCJcbiAgICAgICAgICAgICAgICAgIEBjbGljaz1cImIucnVuKClcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHt7IGIudGV4dCB9fVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW92ZV9femNvbFwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJtb3ZlX19iIG1vdmVfX2ItLXpcIlxuICAgICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiektleXMudXAubGFiZWxcIlxuICAgICAgICAgICAgICAgIDp0aXRsZT1cInpLZXlzLnVwLnRpdGxlXCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuTW92ZVpcIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwiam9nLXotdXBcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cIm1vdmVCeSgnWicsIHN0ZXApXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt7IHpLZXlzLnVwLnRleHQgfX1cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxjb250cm9sLXBvc2l0aW9uLXJlYWRvdXRcbiAgICAgICAgICAgICAgICBjbGFzcz1cIm1vdmVfX3p2XCJcbiAgICAgICAgICAgICAgICBheGVzPVwiWlwiXG4gICAgICAgICAgICAgICAgc3RhY2tcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fYiBtb3ZlX19iLS16XCJcbiAgICAgICAgICAgICAgICA6YXJpYS1sYWJlbD1cInpLZXlzLmRvd24ubGFiZWxcIlxuICAgICAgICAgICAgICAgIDp0aXRsZT1cInpLZXlzLmRvd24udGl0bGVcIlxuICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlWlwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJqb2ctei1kb3duXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJtb3ZlQnkoJ1onLCAtc3RlcClcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge3sgektleXMuZG93bi50ZXh0IH19XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cIiF0cmFja3BhZE9ubHlcIlxuICAgICAgICBjbGFzcz1cIm1vdmVfX2JhclwiXG4gICAgICAgIGRhdGEtdGlkPVwibW92ZS1wb3NpdGlvblwiXG4gICAgICA+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiIWdvT3BlblwiPlxuICAgICAgICAgIDxjb250cm9sLXBvc2l0aW9uLXJlYWRvdXQgLz5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2J0biBtb3ZlX19nb3RvXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFpc0hvbWVkKCdYWVonKVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIm1vdmUtZ290b1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJvcGVuR29Ub1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgR28gdG/igKZcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPGZvcm1cbiAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICBjbGFzcz1cIm1vdmVfX2dvXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiR28gdG8gYSBwb3NpdGlvblwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLWdvLWZvcm1cIlxuICAgICAgICAgIEBzdWJtaXQucHJldmVudD1cImdvXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxsYWJlbFxuICAgICAgICAgICAgdi1mb3I9XCIoYXhpcywgaSkgaW4gWydYJywgJ1knLCAnWiddXCJcbiAgICAgICAgICAgIDprZXk9XCJheGlzXCJcbiAgICAgICAgICAgIGNsYXNzPVwibW92ZV9fZmllbGRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuPnt7IGF4aXMgfX08L3NwYW4+XG4gICAgICAgICAgICA8bnVtYmVyLWZpZWxkXG4gICAgICAgICAgICAgIDp2YWx1ZT1cImdvVG9baV1cIlxuICAgICAgICAgICAgICA6ZGVjaW1hbHM9XCIyXCJcbiAgICAgICAgICAgICAgOm1pbj1cImF4aXNNaW5baV1cIlxuICAgICAgICAgICAgICA6bWF4PVwiYXhpc01heFtpXVwiXG4gICAgICAgICAgICAgIDpsYWJlbD1cImAke2F4aXN9IHRvIGdvIHRvYFwiXG4gICAgICAgICAgICAgIEBjaGFuZ2U9XCJzZXRHb1RvKGksICRldmVudClcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzcz1cIm1vdmVfX3BpY2stbm90ZSBtb3ZlX19nby1ub3RlXCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ21vdmVfX3BpY2stbm90ZS0tYmFkJzogISFnb1Byb2JsZW0gfVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIm1vdmUtZ28tbm90ZVwiXG4gICAgICAgICAgPnt7IGdvUHJvYmxlbSB8fCBnb05vdGUgfX08L3NwYW4+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLWdvLWNhbmNlbFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJnb09wZW4gPSBmYWxzZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQ2FuY2VsXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuR29cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJtb3ZlLWdvXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBHb1xuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPGNvbnRyb2wtei1vZmZzZXRcbiAgICAgIHYtaWY9XCIhZGV2T25seUxvY2tlZCAmJiBzaG93Wk9mZnNldFwiXG4gICAgICBjbGFzcz1cIm1vdmVfX3pvZmZzZXRcIlxuICAgIC8+XG4gIDwvY29udHJvbC1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgQ29udHJvbE1peGluIGZyb20gJ0AvbWl4aW5zL2NvbnRyb2wnXG5pbXBvcnQgeyBYX1JJR0hULCBZX0JBQ0sgfSBmcm9tICdAL3NlcnZpY2VzL21hY2hpbmUvb3JpZW50YXRpb24nXG5pbXBvcnQgeyBiZWRGcm9tLCB0eXBlIEJlZCwgdHlwZSBQb2ludCB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC90cmFja3BhZCdcbmltcG9ydCB7IERyYWdGb2xsb3csIGNvbnRyb2xEcmFnSG9zdCB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9kcmFnLWZvbGxvdydcbmltcG9ydCB7IFRSQUNLUEFEX0xJVkVfQVZBSUxBQkxFLCBUUkFDS1BBRF9MSVZFX1JFQVNPTiwgbGl2ZVRyYWNrcGFkU3RyZWFtLCByZWFkVHJhY2twYWRNb2RlLCB3cml0ZVRyYWNrcGFkTW9kZSwgdHlwZSBUcmFja3BhZE1vZGUgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvdHJhY2twYWQtbW9kZSdcbmltcG9ydCB7IHpLZXlXb3JkcyB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC96LWtleXMnXG5pbXBvcnQgdHlwZSB7IE1vdmVQbGFuIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3NhZmUtbW92ZSdcbmltcG9ydCBDb250cm9sQ2FyZCBmcm9tICcuL0NvbnRyb2xDYXJkLnZ1ZSdcbmltcG9ydCBDb250cm9sVHJhY2twYWQgZnJvbSAnLi9Db250cm9sVHJhY2twYWQudnVlJ1xuaW1wb3J0IENvbnRyb2xQb3NpdGlvblJlYWRvdXQgZnJvbSAnLi9Db250cm9sUG9zaXRpb25SZWFkb3V0LnZ1ZSdcbmltcG9ydCBEZXZHdWFyZE1peGluIGZyb20gJ0AvbWl4aW5zL2Rldi1ndWFyZCdcbmltcG9ydCBDb250cm9sWk9mZnNldCBmcm9tICcuL0NvbnRyb2xaT2Zmc2V0LnZ1ZSdcbmltcG9ydCBTZWdQaWNrZXIsIHsgdHlwZSBTZWdPcHRpb24gfSBmcm9tICcuL1NlZ1BpY2tlci52dWUnXG5pbXBvcnQgTnVtYmVyRmllbGQgZnJvbSAnLi9OdW1iZXJGaWVsZC52dWUnXG5pbXBvcnQgeyBub3JtYWxpc2VTdGVwcyB9IGZyb20gJ0Avc2VydmljZXMvc2V0dGluZ3MvbW90aW9uLWxpbWl0cydcblxudHlwZSBBeGlzID0gJ1gnIHwgJ1knIHwgJ1onXG5cbi8qKiBUaGUgc3RlcHMgYSBqb2cgdGFrZXMsIG1tLiBGaW5lIGpvZyBkb3duIHRvIGEgdGVudGguICovXG5leHBvcnQgY29uc3QgTU9WRV9TVEVQUyA9IFswLjEsIDEsIDEwLCA1MF1cblxuY29uc3Qgc2lnbiA9IChuOiBudW1iZXIpID0+IChuID4gMCA/ICcrJyA6ICfiiJInKVxuXG4vKipcbiAqIFRoZSBqb2cgcGFkJ3MgbmluZSBjZWxscywgYXMgeW91IGZhY2UgdGhlIHByaW50ZXI6IHVwIGlzIHRoZSBiYWNrLCByaWdodFxuICogaXMgdGhlIHJpZ2h0IChzZXJ2aWNlcy9tYWNoaW5lL29yaWVudGF0aW9uKS4gVGhlIGNlbnRyZSBpcyBhbiBpbmVydCBkb3QsXG4gKiBzbyBhIHNsaXAgYmV0d2VlbiBhcnJvd3Mgc2VuZHMgbm90aGluZy4gYGR4YC9gZHlgIGFyZSB0aGUgYXhpcyBzdGVwcyBwZXJcbiAqIHVuaXQgb2Ygc3RlcCBzaXplLCBzbyB0aGUgcGFkIGFuZCB0aGUgdHJhY2twYWQgYWdyZWUgb24gZXZlcnkgZGlyZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gam9nTGF5b3V0ICh5QmFjayA9IFlfQkFDSywgeFJpZ2h0ID0gWF9SSUdIVCkge1xuICBjb25zdCBjZWxsID0gKGlkOiBzdHJpbmcsIHJpZ2h0OiBudW1iZXIsIGJhY2s6IG51bWJlciwgbGFiZWw6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGR4ID0gcmlnaHQgKiB4UmlnaHRcbiAgICBjb25zdCBkeSA9IGJhY2sgKiB5QmFja1xuICAgIGNvbnN0IHRleHQgPSByaWdodCAmJiBiYWNrXG4gICAgICA/ICh7ICctMSwxJzogJ+KGlicsICcxLDEnOiAn4oaXJywgJy0xLC0xJzogJ+KGmScsICcxLC0xJzogJ+KGmCcgfSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtgJHtyaWdodH0sJHtiYWNrfWBdXG4gICAgICA6IHJpZ2h0ID8gYFgke3NpZ24oZHgpfWAgOiBgWSR7c2lnbihkeSl9YFxuICAgIGNvbnN0IGF4ZXMgPSBbZHggPyBgWCR7c2lnbihkeCl9YCA6ICcnLCBkeSA/IGBZJHtzaWduKGR5KX1gIDogJyddLmZpbHRlcihCb29sZWFuKS5qb2luKCcgJylcbiAgICByZXR1cm4geyBpZCwgZHgsIGR5LCB0ZXh0LCBkaWFnb25hbDogISEocmlnaHQgJiYgYmFjayksIGxhYmVsOiByaWdodCAmJiBiYWNrID8gbGFiZWwgOiBgJHtsYWJlbH0gKCR7YXhlc30pYCB9XG4gIH1cbiAgcmV0dXJuIFtcbiAgICBjZWxsKCdudycsIC0xLCAxLCAnSGVhZCBiYWNrIGFuZCBsZWZ0JyksXG4gICAgY2VsbCgnbicsIDAsIDEsICdIZWFkIGJhY2snKSxcbiAgICBjZWxsKCduZScsIDEsIDEsICdIZWFkIGJhY2sgYW5kIHJpZ2h0JyksXG4gICAgY2VsbCgndycsIC0xLCAwLCAnSGVhZCBsZWZ0JyksXG4gICAgeyBpZDogJ2NlbnRyZScsIGR4OiAwLCBkeTogMCwgdGV4dDogJycsIGRpYWdvbmFsOiBmYWxzZSwgbGFiZWw6ICcnIH0sXG4gICAgY2VsbCgnZScsIDEsIDAsICdIZWFkIHJpZ2h0JyksXG4gICAgY2VsbCgnc3cnLCAtMSwgLTEsICdIZWFkIGZvcndhcmQgYW5kIGxlZnQnKSxcbiAgICBjZWxsKCdzJywgMCwgLTEsICdIZWFkIGZvcndhcmQnKSxcbiAgICBjZWxsKCdzZScsIDEsIC0xLCAnSGVhZCBmb3J3YXJkIGFuZCByaWdodCcpXG4gIF1cbn1cblxuLyoqIFRoZSBaIGtleXMnIHdvcmRzOiBzZXJ2aWNlcy9jb250cm9sL3ota2V5cyAoc2hhcmVkIHdpdGggdGhlIE92ZXJ2aWV3J3MgSm9nKS4gKi9cbmV4cG9ydCB7IHpLZXlXb3JkcyB9XG5cbi8qKiBFYWNoIHRpbGUncyBkcmFnIGZvbGxvd2VyLCBrZXB0IG9mZiB0aGUgY29tcG9uZW50IHNvIFZ1ZSBkb2Vzbid0IG1ha2UgaXQgcmVhY3RpdmUuICovXG5jb25zdCBmb2xsb3dlcnMgPSBuZXcgV2Vha01hcDxvYmplY3QsIERyYWdGb2xsb3c+KClcblxuLyoqXG4gKiBNb3ZlbWVudDogZXZlcnl0aGluZyB0aGF0IG1vdmVzIHRoZSBoZWFkLCBpbiBvbmUgdGlsZSAodGhlIHY0IHN0b3J5Ym9hcmQpLlxuICogVGhlIHRyYWNrcGFkIHBpY2tzIGEgc3BvdCAoTW92ZSBoZXJlIHNlbmRzIGl0KSBvciwgZHJhZ2dlZCwgaGFzIHRoZSBoZWFkXG4gKiBmb2xsb3c7IHRoZSBmaW5lIGpvZyBudWRnZXM7IHRoZSBwb3NpdGlvbiByZWFkb3V0IGRvdWJsZXMgYXMgR28gdG87IGFuZFxuICogaG9taW5nIHNpdHMgaW4gYSBiYXIgdW5kZXIgYSBydWxlLiBNb3RvcnMgb2ZmIGlzIG9ubHkgaW4gdGhlIMK3wrfCtyBtZW51LlxuICogWiBvZmZzZXQgaXMgbm90IG9uIGEgTXVvbiBwcmludGVyIGF0IGFsbDsgb24gYW55IG90aGVyIHByaW50ZXIgaXQgaXMgaW5cbiAqIHRoZSDCt8K3wrcgbWVudSAoaGlkZGVuIHRvbyB3aGlsZSBpdCBpc24ndCBrbm93biB5ZXQgd2hpY2ggaXQgaXMpLlxuICpcbiAqIEV2ZXJ5IG1vdmUgZ29lcyB0aHJvdWdoIENvbnRyb2xNaXhpbidzIG1vdmVCeSAvIG1vdmVCeVhZIC8gbW92ZVRvLCB3aGljaFxuICogZ2F0ZSBvbiBob21lZCBhbmQgcHJpbnRpbmcsIHBsYW4gYWdhaW5zdCB0aGUgcHJpbnRlcidzIG5vLWdvIHJlZ2lvbnMsIGFuZFxuICogaG9sZCBlYWNoIG1vdmUgdW50aWwgdGhlIGxhc3QgaGFuZCBtb3ZlIGhhcyBsYW5kZWQuIEEgZHJhZyBpcyBzdHJlYW1lZFxuICogdGhyb3VnaCBzZXJ2aWNlcy9jb250cm9sL2RyYWctZm9sbG93LCBvbmUgcGxhbm5lZCBtb3ZlIGF0IGEgdGltZS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgQ29udHJvbENhcmQsIENvbnRyb2xUcmFja3BhZCwgQ29udHJvbFBvc2l0aW9uUmVhZG91dCwgQ29udHJvbFpPZmZzZXQsIFNlZ1BpY2tlciwgTnVtYmVyRmllbGQgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29udHJvbE1vdmUgZXh0ZW5kcyBNaXhpbnMoQ29udHJvbE1peGluLCBEZXZHdWFyZE1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBwaG9uZT86IGJvb2xlYW5cblxuICAvKiogT25seSB0aGUgdHJhY2twYWQgYW5kIEhvbWUgYWxsOiBKb2cgYW5kIFBvc2l0aW9uIGFyZSB0aGVpciBvd24gT3ZlcnZpZXcgd2lkZ2V0cyAoS0FOLTIwMzgpLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgdHJhY2twYWRPbmx5PzogYm9vbGVhblxuXG4gIHN0ZXAgPSAxMFxuICBtZW51ID0gZmFsc2VcbiAgc2hvd1pPZmZzZXQgPSBmYWxzZVxuICBnb09wZW4gPSBmYWxzZVxuICBnb1RvOiBBcnJheTxudW1iZXIgfCBudWxsPiA9IFtudWxsLCBudWxsLCBudWxsXVxuICAvKiogV2hhdCB0aGUgZmllbGRzIHN0YXJ0ZWQgYXQ6IGFuIGF4aXMgbGVmdCBhcyBpdCB3YXMgaXNuJ3Qgc2VudCAoc28gWCBhbG9uZSBtb3ZlcyBhdCB0aGUgaGVhZCdzIHNwZWVkKS4gKi9cbiAgZ29TdGFydDogQXJyYXk8bnVtYmVyIHwgbnVsbD4gPSBbbnVsbCwgbnVsbCwgbnVsbF1cbiAgZ29UYXJnZXQgPSAnJ1xuICAvKiogVGhlIHRyYWNrcGFkJ3MgcGljaywgaW4gdG9vbGhlYWQgKHJlYWwpIGNvb3JkaW5hdGVzOyBudWxsIHdoZW4gbm90aGluZyBpcyBwaWNrZWQuICovXG4gIHRhcmdldDogUG9pbnQgfCBudWxsID0gbnVsbFxuICB0YXJnZXRGb3IgPSAnJ1xuICAvKiogVGhlIHRhcmdldCBpcyBhIGRyYWcnczogY2xlYXJlZCBvbmNlIHRoZSBkcmFnIGhhcyBmaW5pc2hlZCBzZW5kaW5nLiAqL1xuICBkcmFnVGFyZ2V0ID0gZmFsc2VcbiAgLyoqIFdoeSB0aGUgbGFzdCBkcmFnIHN0b3BwZWQsIG9yICcnLiAqL1xuICBkcmFnUmVmdXNhbCA9ICcnXG4gIGZvbGxvd2luZyA9IGZhbHNlXG5cbiAgLyoqIEhvdyBhIGRyYWcgb24gdGhlIFRyYWNrcGFkIG1vdmVzIHRoZSBoZWFkIChzZXJ2aWNlcy9jb250cm9sL3RyYWNrcGFkLW1vZGUpOiBPbiByZWxlYXNlIGJ5IGRlZmF1bHQsIHJlbWVtYmVyZWQgb24gdGhpcyBkZXZpY2UuICovXG4gIG1vZGU6IFRyYWNrcGFkTW9kZSA9IHJlYWRUcmFja3BhZE1vZGUoKVxuICByZWFkb25seSBsaXZlQXZhaWxhYmxlID0gVFJBQ0tQQURfTElWRV9BVkFJTEFCTEVcbiAgcmVhZG9ubHkgbGl2ZVJlYXNvbiA9IFRSQUNLUEFEX0xJVkVfQVZBSUxBQkxFID8gJycgOiBUUkFDS1BBRF9MSVZFX1JFQVNPTlxuXG4gIC8qKlxuICAgKiBBIHJlbGVhc2UgdGhhdCBjYW1lIHdoaWxlIHRoaXMgcGFnZSdzIGxhc3QgbW92ZSBoYWRuJ3QgbGFuZGVkIHlldFxuICAgKiAoS0FOLTIxMjApOiB0aGUgbmV3IHRhcmdldCBpcyBrZXB0IGFuZCBzZW50LCB0aHJvdWdoIG1vdmVUbywgdGhlIG1vbWVudFxuICAgKiB0aGUgd2FpdCBjbGVhcnMuIEEgbmV3ZXIgcmVsZWFzZSByZXBsYWNlcyBpdC4gVGhlIEtsaXBwZXIgaGFsZiAodHVybmluZ1xuICAgKiB0aGUgaGVhZCBtaWQtbW92ZSkgaXMgdGhlIG1vdGlvbiBwcm9qZWN0J3MgTVVPTl9KT0cuXG4gICAqL1xuICBxdWV1ZWQgPSBmYWxzZVxuXG4gIC8qKiBMaXZlIG1vdmluZzogb25seSBvbiB0aGUgT3ZlcnZpZXcncyBUcmFja3BhZCwgYW5kIG9ubHkgb25jZSB0aGUgcHJpbnRlciBjYW4gc3RyZWFtIGl0LiBOZXZlciBhIHJ1biBvZiBHMXMuICovXG4gIGdldCBsaXZlTW92aW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLnRyYWNrcGFkT25seSAmJiB0aGlzLmxpdmVBdmFpbGFibGUgJiYgdGhpcy5tb2RlID09PSAnbGl2ZScgJiYgISFsaXZlVHJhY2twYWRTdHJlYW0odGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRBdmFpbGFibGVDb21tYW5kcyddKVxuICB9XG5cbiAgLyoqIFRoZSBPdmVydmlldydzIFRyYWNrcGFkIHNlbmRzIG9uZSBtb3ZlLCB3aGVuIHRoZSBwb2ludGVyIGxpZnRzOyBub3RoaW5nIHdoaWxlIGl0IGlzIGRvd24uICovXG4gIGdldCByZWxlYXNlT25seSAoKTogYm9vbGVhbiB7IHJldHVybiAhIXRoaXMudHJhY2twYWRPbmx5ICYmICF0aGlzLmxpdmVNb3ZpbmcgfVxuXG4gIHNldE1vZGUgKG1vZGU6IFRyYWNrcGFkTW9kZSkge1xuICAgIHRoaXMubW9kZSA9IHdyaXRlVHJhY2twYWRNb2RlKG1vZGUpXG4gIH1cblxuICBnZXQgdGlsZUhpbnQgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnh5SG9tZWRIZXJlKSByZXR1cm4gJ0hvbWUgZmlyc3QsIHRoZW4gdGFwIG9yIGRyYWcgdGhlIGJlZC4nXG4gICAgaWYgKHRoaXMubm9HbyA9PT0gJ2ludmFsaWQnKSByZXR1cm4gJ1RoZSBub3RjaCBjb3VsZCBub3QgYmUgcmVhZCwgc28gb25seSByYWlzaW5nIHRoZSBoZWFkIGlzIGFsbG93ZWQuJ1xuICAgIHJldHVybiB0aGlzLnJlbGVhc2VPbmx5ID8gJ1RhcCBvciBkcmFnLCB0aGVuIGxldCBnbzogdGhlIGhlYWQgbW92ZXMgdGhlcmUgb25jZS4nIDogJ0RyYWcsIGFuZCB0aGUgaGVhZCBmb2xsb3dzLidcbiAgfVxuXG4gIC8qKiBUaWNrcyB3aGlsZSBhIHBpY2sgaXMgc2hvd24sIHNvIFwiaXMgdGhlIGhlYWQgc3RpbGwgbW92aW5nP1wiIGlzIHJlYWQgYWdhaW4gKHRoYXQgc3RhdGUgaXMgbm90IHJlYWN0aXZlKS4gKi9cbiAgdGljayA9IDBcbiAgcHJpdmF0ZSB0aWNrZXI6IG51bWJlciB8IG51bGwgPSBudWxsXG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgZm9sbG93ZXJzLnNldCh0aGlzLCBuZXcgRHJhZ0ZvbGxvdyhjb250cm9sRHJhZ0hvc3QodGhpcyksIHtcbiAgICAgIG9uUmVmdXNlZDogcmVhc29uID0+IHsgdGhpcy5kcmFnUmVmdXNhbCA9IHJlYXNvbjsgdGhpcy5mb2xsb3dpbmcgPSBmYWxzZSB9XG4gICAgfSkpXG4gIH1cblxuICBnZXQgZm9sbG93ZXIgKCk6IERyYWdGb2xsb3cgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBmb2xsb3dlcnMuZ2V0KHRoaXMpXG4gIH1cblxuICBAV2F0Y2goJ3BhbmVsVGFyZ2V0JylcbiAgY2xlYXJEcmFmdCAoKSB7XG4gICAgdGhpcy5zdG9wRHJhZygpXG4gICAgdGhpcy5nb1RvID0gW251bGwsIG51bGwsIG51bGxdXG4gICAgdGhpcy5nb09wZW4gPSBmYWxzZVxuICAgIHRoaXMudGFyZ2V0ID0gbnVsbFxuICB9XG5cbiAgQFdhdGNoKCd0YXJnZXQnKVxuICBvblRhcmdldCAodGFyZ2V0OiBQb2ludCB8IG51bGwpIHtcbiAgICBpZiAodGFyZ2V0ICYmIHRoaXMudGlja2VyID09PSBudWxsKSB0aGlzLnRpY2tlciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB0aGlzLm9uVGljaygpLCAyNTApXG4gICAgaWYgKCF0YXJnZXQgJiYgdGhpcy50aWNrZXIgIT09IG51bGwpIHsgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy50aWNrZXIpOyB0aGlzLnRpY2tlciA9IG51bGwgfVxuICB9XG5cbiAgb25UaWNrICgpIHtcbiAgICB0aGlzLnRpY2srK1xuICAgIGlmICh0aGlzLnF1ZXVlZCkgdGhpcy5zZW5kUXVldWVkKClcbiAgICBjb25zdCBmb2xsb3dpbmcgPSAhIXRoaXMuZm9sbG93ZXI/LmZvbGxvd2luZ1xuICAgIGlmICh0aGlzLmZvbGxvd2luZyAmJiAhZm9sbG93aW5nICYmICF0aGlzLmRyYWdSZWZ1c2FsKSB7XG4gICAgICAvLyBUaGUgZHJhZyBoYXMgc2VudCBpdHMgbGFzdCBtb3ZlOiB0aGUgaGVhZCBpcyBvbiBpdHMgd2F5LCB0aGUgcGljayBpcyBkb25lLlxuICAgICAgaWYgKHRoaXMuZHJhZ1RhcmdldCkgdGhpcy50YXJnZXQgPSBudWxsXG4gICAgICB0aGlzLmRyYWdUYXJnZXQgPSBmYWxzZVxuICAgIH1cbiAgICB0aGlzLmZvbGxvd2luZyA9IGZvbGxvd2luZ1xuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgdGhpcy5mb2xsb3dlcj8uY2FuY2VsKClcbiAgICBmb2xsb3dlcnMuZGVsZXRlKHRoaXMpXG4gICAgaWYgKHRoaXMudGlja2VyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLnRpY2tlcilcbiAgICB0aGlzLnRpY2tlciA9IG51bGxcbiAgfVxuXG4gIC8qKiBBIHBpY2sgYW5kIGFueSBkcmFnIGFyZSBkcm9wcGVkIHRoZSBtb21lbnQgbW92aW5nIGlzIG5vIGxvbmdlciBhbGxvd2VkIChhIHByaW50IHN0YXJ0cywgaG9taW5nIGlzIGxvc3QpLiAqL1xuICBAV2F0Y2goJ2Nhbk1vdmVYWScpXG4gIG9uQ2FuTW92ZSAoY2FuOiBib29sZWFuKSB7XG4gICAgaWYgKCFjYW4pIHtcbiAgICAgIHRoaXMuc3RvcERyYWcoKVxuICAgICAgdGhpcy50YXJnZXQgPSBudWxsXG4gICAgICB0aGlzLnF1ZXVlZCA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgQFdhdGNoKCdtb3ZpbmcnKVxuICBvbk1vdmluZyAobW92aW5nOiBib29sZWFuKSB7XG4gICAgaWYgKG1vdmluZykge1xuICAgICAgdGhpcy5zdG9wRHJhZygpXG4gICAgICB0aGlzLnRhcmdldCA9IG51bGxcbiAgICAgIHRoaXMucXVldWVkID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKiogQSBxdWV1ZWQgdGFyZ2V0IGdvZXMgYXMgc29vbiBhcyB0aGUgcHJpbnRlciByZXBvcnRzIHRoZSBsYXN0IG1vdmUgbGFuZGVkLiAqL1xuICBAV2F0Y2goJyRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZ2NvZGVfbW92ZS5nY29kZV9wb3NpdGlvbicpXG4gIG9uR2NvZGVQb3NpdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucXVldWVkKSB0aGlzLiRuZXh0VGljaygoKSA9PiB0aGlzLnNlbmRRdWV1ZWQoKSlcbiAgfVxuXG4gIGdldCByZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFJlYWR5XG4gIH1cblxuICAvKiogXCJMb2NrZWQgd2hpbGUgcHJpbnRpbmdcIiBvbmx5IGZvciBhIHJlYWwgcHJpbnQgKHByaW50X3N0YXRzKTsgbmV2ZXIgZm9yIHRoaXMgcGFnZSdzIG93biBtb3ZlcyAoS0FOLTIxMjApLiAqL1xuICBnZXQgcGlsbCAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMucmVhZHkpIHJldHVybiAnJ1xuICAgIGlmICh0aGlzLnByaW50TG9ja2VkKSByZXR1cm4gJ0xvY2tlZCB3aGlsZSBwcmludGluZydcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm4gJ0J1c3knXG4gICAgcmV0dXJuIHRoaXMuaXNIb21lZCgnWFlaJykgPyAnSG9tZWQnIDogJ05vdCBob21lZCdcbiAgfVxuXG4gIGdldCBwaWxsVG9uZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5waWxsID09PSAnSG9tZWQnID8gJ29rJyA6ICd3YXJuJ1xuICB9XG5cbiAgZ2V0IHByaW50aW5nTm90ZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWxlID0gKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wcmludF9zdGF0cz8uZmlsZW5hbWUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnJ1xuICAgIGNvbnN0IG5hbWUgPSBmaWxlLnNwbGl0KCcvJykucG9wKCk/LnJlcGxhY2UoL1xcLmdjb2RlJC9pLCAnJykgPz8gJydcbiAgICBjb25zdCB3aGF0ID0gbmFtZSA/IGAke25hbWV9IGlzIHByaW50aW5nLmAgOiAnQSBwcmludCBpcyBydW5uaW5nLidcbiAgICByZXR1cm4gYCR7d2hhdH0gTW92aW5nIGNvbWVzIGJhY2sgd2hlbiBpdCBlbmRzLiBQcmludCBtb2RlIGFuZCBBZHZhbmNlZCBzdGF5IGxpdmUsIHRvIGNoYW5nZSBzcGVlZCBhbmQgZmxvdyBtaWQtcHJpbnQuYFxuICB9XG5cbiAgLyoqIFNldHRpbmdzIOKAuiBNb3ZpbmcgYW5kIGV4dHJ1ZGluZydzIHN0ZXAgc2l6ZXMgZm9yIHRoZSBoZWFkIGFuZCB0aGUgcGxhdGUsIG9uZSBwaWNrZXIgZm9yIGJvdGguICovXG4gIGdldCBtb3ZlU3RlcHMgKCk6IG51bWJlcltdIHtcbiAgICBjb25zdCBnZW5lcmFsID0gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnPy51aVNldHRpbmdzPy5nZW5lcmFsXG4gICAgY29uc3Qgc3RlcHMgPSBub3JtYWxpc2VTdGVwcyhbLi4uKGdlbmVyYWw/LnRvb2xoZWFkWFlNb3ZlRGlzdGFuY2VzID8/IFtdKSwgLi4uKGdlbmVyYWw/LnRvb2xoZWFkWk1vdmVEaXN0YW5jZXMgPz8gW10pXSlcbiAgICByZXR1cm4gc3RlcHMubGVuZ3RoID8gc3RlcHMgOiBNT1ZFX1NURVBTXG4gIH1cblxuICBnZXQgc3RlcE9wdGlvbnMgKCk6IFNlZ09wdGlvbltdIHtcbiAgICBjb25zdCBzdGVwcyA9IHRoaXMubW92ZVN0ZXBzXG4gICAgcmV0dXJuIHN0ZXBzLm1hcCgocywgaSkgPT4gKHsgdmFsdWU6IHMsIGxhYmVsOiBpID09PSBzdGVwcy5sZW5ndGggLSAxID8gYCR7c30gbW1gIDogU3RyaW5nKHMpIH0pKVxuICB9XG5cbiAgZ2V0IHh5SG9tZWRIZXJlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0hvbWVkKCdYWScpXG4gIH1cblxuICAvKiogVGhlIHByaW50ZXIgaXMgbW92aW5nIG9uIGl0cyBvd24gYWNjb3VudCAoYSBwcmludCwgb3IgaG9taW5nKTogdGhlIHRyYWNrcGFkIGdyZXlzIG91dCBhbmQgd2FpdHMgKEtBTi0yMDM5KS4gRXhpc3Rpbmcgc3RhdGUgb25seS4gKi9cbiAgZ2V0IG1vdmluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYnVzeSB8fCB0aGlzLmhvbWluZygpIHx8IHRoaXMuaG9taW5nKCdaJylcbiAgfVxuXG4gIGdldCBjYW5Nb3ZlWFkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnJlYWR5ICYmICF0aGlzLmJ1c3kgJiYgdGhpcy54eUhvbWVkSGVyZVxuICB9XG5cbiAgZ2V0IGNhbk1vdmVaICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5yZWFkeSAmJiAhdGhpcy5idXN5ICYmIHRoaXMuaXNIb21lZCgnWicpXG4gIH1cblxuICBnZXQgcGxhdGUgKCk6IEJlZCB8IG51bGwge1xuICAgIHJldHVybiBiZWRGcm9tKHRoaXMuYXhpc01pbiwgdGhpcy5heGlzTWF4KVxuICB9XG5cbiAgZ2V0IGpvZ0J1dHRvbnMgKCkge1xuICAgIHJldHVybiBqb2dMYXlvdXQoKS5tYXAoYiA9PiAoe1xuICAgICAgLi4uYixcbiAgICAgIHJ1bjogKCkgPT4gKGIuZHggJiYgYi5keSA/IHRoaXMubW92ZUJ5WFkoYi5keCAqIHRoaXMuc3RlcCwgYi5keSAqIHRoaXMuc3RlcCkgOiBiLmR4ID8gdGhpcy5tb3ZlQnkoJ1gnLCBiLmR4ICogdGhpcy5zdGVwKSA6IHRoaXMubW92ZUJ5KCdZJywgYi5keSAqIHRoaXMuc3RlcCkpXG4gICAgfSkpXG4gIH1cblxuICBnZXQgektleXMgKCkge1xuICAgIHJldHVybiB6S2V5V29yZHModGhpcy5tdW9uUHJpbnRlciA9PT0gdHJ1ZSlcbiAgfVxuXG4gIGZtdCAobjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKE1hdGgucm91bmQobiAqIDEwKSAvIDEwKS50b0ZpeGVkKDEpXG4gIH1cblxuICAvLyAtLSB0cmFja3BhZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBwaWNrSGludCAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMueHlIb21lZEhlcmUpIHJldHVybiAnSG9tZSBhbGwsIHRoZW4gdGFwIHRoZSBiZWQgdG8gcGljayBhIHNwb3QuJ1xuICAgIGlmICh0aGlzLm5vR28gPT09ICdpbnZhbGlkJykgcmV0dXJuICdUaGUgbm90Y2ggY291bGQgbm90IGJlIHJlYWQsIHNvIG9ubHkgcmFpc2luZyB0aGUgaGVhZCBpcyBhbGxvd2VkLidcbiAgICByZXR1cm4gJ1RhcCB0aGUgYmVkIHRvIHBpY2sgYSBzcG90LCB0aGVuIHByZXNzIE1vdmUgaGVyZS4gT3IgZHJhZywgYW5kIHRoZSBoZWFkIGZvbGxvd3MuJ1xuICB9XG5cbiAgZ2V0IHBpY2tOb3RlICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmRyYWdSZWZ1c2FsKSByZXR1cm4gYFN0b3BwZWQgZm9sbG93aW5nLiAke3RoaXMuZHJhZ1JlZnVzYWx9YFxuICAgIGlmICh0aGlzLmZvbGxvd2luZykgcmV0dXJuICdGb2xsb3dpbmcgdGhlIGRyYWfigKYnXG4gICAgaWYgKHRoaXMucXVldWVkICYmICF0aGlzLnRhcmdldFByb2JsZW0pIHJldHVybiAnR29lcyB0aGVyZSBhcyBzb29uIGFzIHRoZSBjdXJyZW50IG1vdmUgbGFuZHMuJ1xuICAgIGlmICh0aGlzLnJlbGVhc2VPbmx5KSByZXR1cm4gdGhpcy50YXJnZXRQcm9ibGVtIHx8IHRoaXMudGFyZ2V0Tm90ZVxuICAgIHJldHVybiB0aGlzLnRhcmdldFByb2JsZW0gfHwgdGhpcy5waWNrV2FpdCB8fCB0aGlzLnRhcmdldE5vdGVcbiAgfVxuXG4gIC8qKiBQaWNraW5nIG9ubHkgc2V0cyB0aGUgdGFyZ2V0LiBOb3RoaW5nIGlzIHNlbnQuICovXG4gIHBpY2sgKHA6IFBvaW50KSB7XG4gICAgaWYgKCF0aGlzLmNhbk1vdmVYWSB8fCB0aGlzLmZvbGxvd2luZykgcmV0dXJuXG4gICAgdGhpcy50YXJnZXQgPSB7IHg6IHAueCwgeTogcC55IH1cbiAgICB0aGlzLnRhcmdldEZvciA9IHRoaXMucGFuZWxUYXJnZXRcbiAgICB0aGlzLmRyYWdUYXJnZXQgPSBmYWxzZVxuICAgIHRoaXMuZHJhZ1JlZnVzYWwgPSAnJ1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBwb2ludGVyIGxpZnRlZCAob3IgRW50ZXIgd2FzIHByZXNzZWQpIG9uIHRoZSBPdmVydmlldydzIFRyYWNrcGFkOiB0aGVcbiAgICogb25lIG1vdmUsIHRocm91Z2ggbW92ZVRvIGFuZCBpdHMgcGxhbm5lciAoc28gdGhlIG5vdGNoIHJ1bGUgaG9sZHMpLlxuICAgKiBOb3RoaW5nIHdhcyBzZW50IHdoaWxlIHRoZSBwb2ludGVyIHdhcyBkb3duLiBJZiB0aGlzIHBhZ2UncyBsYXN0IG1vdmVcbiAgICogaGFzbid0IGxhbmRlZCB5ZXQsIHRoZSB0YXJnZXQgaXMgcXVldWVkIGFuZCBzZW50IHdoZW4gaXQgaGFzIChhIGxhdGVyXG4gICAqIHJlbGVhc2UgcmVwbGFjZXMgaXQpOyBhIHJlZnVzZWQgdGFyZ2V0IHN0YXlzIG9uIHRoZSBwYWQgYW5kIHNheXMgd2h5LlxuICAgKi9cbiAgcmVsZWFzZSAoKSB7XG4gICAgaWYgKCF0aGlzLnJlbGVhc2VPbmx5IHx8ICF0aGlzLnRhcmdldCB8fCAhdGhpcy5jYW5Nb3ZlWFkgfHwgdGhpcy50YXJnZXRGb3IgIT09IHRoaXMucGFuZWxUYXJnZXQpIHJldHVyblxuICAgIGlmICh0aGlzLnRhcmdldFByb2JsZW0pIHsgdGhpcy5xdWV1ZWQgPSBmYWxzZTsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5oYW5kTW92ZVdhaXQoKSkgeyB0aGlzLnF1ZXVlZCA9IHRydWU7IHJldHVybiB9XG4gICAgdGhpcy5xdWV1ZWQgPSBmYWxzZVxuICAgIHRoaXMuY29uZmlybU1vdmUoKVxuICB9XG5cbiAgLyoqIFNlbmQgdGhlIHF1ZXVlZCB0YXJnZXQgb25jZSBub3RoaW5nIGlzIGluIHRoZSB3YXkgYW55IG1vcmU7IGRyb3AgaXQgaWYgaXQgY2FuIG5vIGxvbmdlciBnby4gKi9cbiAgc2VuZFF1ZXVlZCAoKSB7XG4gICAgaWYgKCF0aGlzLnF1ZXVlZCkgcmV0dXJuXG4gICAgaWYgKCF0aGlzLnRhcmdldCB8fCAhdGhpcy5jYW5Nb3ZlWFkgfHwgdGhpcy50YXJnZXRGb3IgIT09IHRoaXMucGFuZWxUYXJnZXQgfHwgdGhpcy50YXJnZXRQcm9ibGVtKSB7IHRoaXMucXVldWVkID0gZmFsc2U7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuaGFuZE1vdmVXYWl0KCkpIHJldHVyblxuICAgIHRoaXMucXVldWVkID0gZmFsc2VcbiAgICB0aGlzLmNvbmZpcm1Nb3ZlKClcbiAgfVxuXG4gIGNsZWFyVGFyZ2V0ICgpIHtcbiAgICB0aGlzLnRhcmdldCA9IG51bGxcbiAgICB0aGlzLmRyYWdSZWZ1c2FsID0gJydcbiAgfVxuXG4gIC8qKiBBIHBvaW50IGluIEctY29kZSBjb29yZGluYXRlcyAod2hhdCBtb3ZlVG8gdGFrZXMpOiB0aGUgcmVhbCBzcG90IG1pbnVzIHRoZSBvZmZzZXRzIGluIGZvcmNlLiAqL1xuICBwbGFjZU9mIChwOiBQb2ludCk6IHsgWDogbnVtYmVyLCBZOiBudW1iZXIgfSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5nY29kZU9mZnNldCA/PyBbMCwgMCwgMF1cbiAgICByZXR1cm4ge1xuICAgICAgWDogTWF0aC5yb3VuZCgocC54IC0gb2Zmc2V0WzBdKSAqIDEwMDApIC8gMTAwMCxcbiAgICAgIFk6IE1hdGgucm91bmQoKHAueSAtIG9mZnNldFsxXSkgKiAxMDAwKSAvIDEwMDBcbiAgICB9XG4gIH1cblxuICBnZXQgdGFyZ2V0UGxhY2UgKCk6IHsgWDogbnVtYmVyLCBZOiBudW1iZXIgfSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnRhcmdldCA/IHRoaXMucGxhY2VPZih0aGlzLnRhcmdldCkgOiBudWxsXG4gIH1cblxuICAvLyAtLSBsaXZlIGRyYWcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBBIGRyYWcgYmVnYW46IHRoZSBoZWFkIGZvbGxvd3MgaXQsIG9uZSBwbGFubmVkIG1vdmUgYXQgYSB0aW1lIChkcmFnLWZvbGxvdykuICovXG4gIGRyYWdTdGFydCAocDogUG9pbnQpIHtcbiAgICBpZiAoIXRoaXMuY2FuTW92ZVhZIHx8ICF0aGlzLmZvbGxvd2VyKSByZXR1cm5cbiAgICBpZiAodGhpcy5yZWxlYXNlT25seSkgeyB0aGlzLnBpY2socCk7IHJldHVybiB9XG4gICAgdGhpcy50YXJnZXQgPSB7IHg6IHAueCwgeTogcC55IH1cbiAgICB0aGlzLnRhcmdldEZvciA9IHRoaXMucGFuZWxUYXJnZXRcbiAgICB0aGlzLmRyYWdUYXJnZXQgPSB0cnVlXG4gICAgdGhpcy5kcmFnUmVmdXNhbCA9ICcnXG4gICAgdGhpcy5mb2xsb3dpbmcgPSB0cnVlXG4gICAgdGhpcy5mb2xsb3dlci5zdGFydCh0aGlzLnBsYWNlT2YocCkpXG4gICAgdGhpcy5mb2xsb3dpbmcgPSB0aGlzLmZvbGxvd2VyLmZvbGxvd2luZ1xuICB9XG5cbiAgZHJhZ1RvIChwOiBQb2ludCkge1xuICAgIGlmICh0aGlzLnJlbGVhc2VPbmx5KSB7IHRoaXMucGljayhwKTsgcmV0dXJuIH1cbiAgICBpZiAoIXRoaXMuZm9sbG93ZXI/LmZvbGxvd2luZyB8fCAhdGhpcy5jYW5Nb3ZlWFkpIHJldHVyblxuICAgIHRoaXMudGFyZ2V0ID0geyB4OiBwLngsIHk6IHAueSB9XG4gICAgdGhpcy5mb2xsb3dlci51cGRhdGUodGhpcy5wbGFjZU9mKHApKVxuICB9XG5cbiAgZHJhZ0VuZCAoKSB7XG4gICAgdGhpcy5mb2xsb3dlcj8ucmVsZWFzZSgpXG4gIH1cblxuICAvKiogUG9pbnRlciBjYW5jZWxsZWQsIGZvY3VzIG9yIGNhcHR1cmUgbG9zdDogc3RvcCBhdCBvbmNlLCBzZW5kIG5vdGhpbmcgbW9yZS4gVGhlIHBpY2sgc3RheXMsIGZvciBNb3ZlIGhlcmUuICovXG4gIGRyYWdDYW5jZWwgKCkge1xuICAgIHRoaXMuc3RvcERyYWcoKVxuICAgIC8vIE9uIHJlbGVhc2Ugbm90aGluZyB3YXMgc2VudCwgc28gYSBjYW5jZWxsZWQgcHJlc3MgbGVhdmVzIG5vIHBpY2sgKGFuZCBubyBxdWV1ZWQgbW92ZSkgYmVoaW5kLlxuICAgIGlmICh0aGlzLnJlbGVhc2VPbmx5KSB7IHRoaXMudGFyZ2V0ID0gbnVsbDsgdGhpcy5xdWV1ZWQgPSBmYWxzZSB9XG4gIH1cblxuICBzdG9wRHJhZyAoKSB7XG4gICAgdGhpcy5mb2xsb3dlcj8uY2FuY2VsKClcbiAgICB0aGlzLmZvbGxvd2luZyA9IGZhbHNlXG4gICAgdGhpcy5kcmFnVGFyZ2V0ID0gZmFsc2VcbiAgfVxuXG4gIC8qKiBXaGF0IHRoZSBwbGFubmVyIHdvdWxkIGRvIHdpdGggdGhlIHBpY2sgbm93OiB0aGUgc2FtZSBwbGFuIG1vdmVUbyBtYWtlcyB3aGVuIGl0IGlzIGNvbmZpcm1lZC4gKi9cbiAgZ2V0IHRhcmdldFBsYW4gKCkge1xuICAgIGlmICghdGhpcy50YXJnZXQpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIHRoaXMucGxhbkhhbmRNb3ZlKFt0aGlzLnRhcmdldC54LCB0aGlzLnRhcmdldC55LCBOdW1iZXIodGhpcy5wb3NpdGlvblsyXSldKVxuICB9XG5cbiAgLyoqIFdoeSB0aGUgcGljayBjYW4ndCBiZSBtb3ZlZCB0bywgb3IgJycuICovXG4gIGdldCB0YXJnZXRQcm9ibGVtICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBsYWNlID0gdGhpcy50YXJnZXRQbGFjZVxuICAgIGNvbnN0IHBsYW4gPSB0aGlzLnRhcmdldFBsYW5cbiAgICBpZiAoIXBsYWNlIHx8ICFwbGFuKSByZXR1cm4gJydcbiAgICBpZiAoIXBsYW4ub2spIHJldHVybiBwbGFuLnJlYXNvblxuICAgIGlmIChwbGFjZS5YIDwgdGhpcy5heGlzTWluWzBdIHx8IHBsYWNlLlggPiB0aGlzLmF4aXNNYXhbMF0gfHwgcGxhY2UuWSA8IHRoaXMuYXhpc01pblsxXSB8fCBwbGFjZS5ZID4gdGhpcy5heGlzTWF4WzFdKSByZXR1cm4gJ1RoYXQgc3BvdCBpcyBvdXRzaWRlIHRoZSBtYWNoaW5lLidcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGxpZnROb3RlIChwbGFuOiBNb3ZlUGxhbiwgdGhlcmU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFwbGFuLm9rKSByZXR1cm4gJydcbiAgICBpZiAocGxhbi5saWZ0ZWQpIHtcbiAgICAgIC8vIFRoZSBwbGFuJ3Mgc3RlcHMgYXJlIGluIEctY29kZSBjb29yZGluYXRlczsgc2F5IHRoZSBoZWlnaHQgaW4gcmVhbCBaLCBhcyB0aGUgcmVmdXNhbHMgZG8uXG4gICAgICBjb25zdCBsaWZ0ID0gTnVtYmVyKHBsYW4uc3RlcHNbMF0uWikgKyAodGhpcy5nY29kZU9mZnNldCA/PyBbMCwgMCwgMF0pWzJdXG4gICAgICByZXR1cm4gYExpZnRzIHRvIFogJHtNYXRoLnJvdW5kKGxpZnQgKiAxMDApIC8gMTAwfSBmaXJzdCwgdG8gY3Jvc3MgdGhlIG5vdGNoYFxuICAgIH1cbiAgICByZXR1cm4gdGhlcmVcbiAgfVxuXG4gIGdldCB0YXJnZXROb3RlICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBsYW4gPSB0aGlzLnRhcmdldFBsYW5cbiAgICBpZiAoIXBsYW4pIHJldHVybiAnJ1xuICAgIHJldHVybiB0aGlzLmxpZnROb3RlKHBsYW4sIGBTdHJhaWdodCB0aGVyZSwgYXQgWiAkeyhOdW1iZXIodGhpcy5wb3NpdGlvblsyXSkgfHwgMCkudG9GaXhlZCgyKX1gKVxuICB9XG5cbiAgLyoqIFdoeSBNb3ZlIGhlcmUgbXVzdCB3YWl0ICh0aGUgbGFzdCBoYW5kIG1vdmUgb3IgYSBzY3JpcHQgaGFzbid0IGxhbmRlZCksIG9yICcnLiAqL1xuICBnZXQgcGlja1dhaXQgKCk6IHN0cmluZyB7XG4gICAgLy8gUmVhZCBzbyB0aGlzIGlzIHdvcmtlZCBvdXQgYWdhaW4gb24gZWFjaCB0aWNrIGFuZCBlYWNoIHJlcG9ydGVkIHBvc2l0aW9uLlxuICAgIGNvbnN0IHNlZW4gPSBbdGhpcy50aWNrLCB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZ2NvZGVfbW92ZT8uZ2NvZGVfcG9zaXRpb25dXG4gICAgcmV0dXJuIHRoaXMudGFyZ2V0ICYmIHNlZW4gPyB0aGlzLmhhbmRNb3ZlV2FpdCgpIDogJydcbiAgfVxuXG4gIGdldCBjYW5Db25maXJtICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jYW5Nb3ZlWFkgJiYgISF0aGlzLnRhcmdldCAmJiAhdGhpcy50YXJnZXRQcm9ibGVtICYmICF0aGlzLnBpY2tXYWl0ICYmICF0aGlzLmZvbGxvd2luZyAmJiB0aGlzLnRhcmdldEZvciA9PT0gdGhpcy5wYW5lbFRhcmdldFxuICB9XG5cbiAgLyoqIFRoZSBjb25maXJtIHN0ZXA6IG9ubHkgaGVyZSBkb2VzIGEgcGljayBiZWNvbWUgYSBtb3ZlLCB0aHJvdWdoIG1vdmVUbyBhbmQgaXRzIHBsYW5uZXIuIFRoZSBwaWNrIHN0YXlzIGlmIG5vdGhpbmcgd2FzIHNlbnQuICovXG4gIGNvbmZpcm1Nb3ZlICgpIHtcbiAgICBjb25zdCBwbGFjZSA9IHRoaXMudGFyZ2V0UGxhY2VcbiAgICBpZiAoIXRoaXMuY2FuQ29uZmlybSB8fCAhcGxhY2UpIHJldHVyblxuICAgIGlmICh0aGlzLm1vdmVUbyhwbGFjZSkpIHRoaXMudGFyZ2V0ID0gbnVsbFxuICB9XG5cbiAgLy8gLS0ga2V5cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBBcnJvdyBrZXlzIHN0ZXAgdGhlIGhlYWQsIFBnVXAgYW5kIFBnRG4gdGhlIHBsYXRlOyBTaGlmdCBpcyB0ZW4gc3RlcHMuICovXG4gIG9uUGFkS2V5IChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGNvbnN0IGJ5ID0gdGhpcy5zdGVwICogKGV2ZW50LnNoaWZ0S2V5ID8gMTAgOiAxKVxuICAgIGNvbnN0IGtleXM6IFJlY29yZDxzdHJpbmcsIFtBeGlzLCBudW1iZXJdPiA9IHtcbiAgICAgIEFycm93VXA6IFsnWScsIFlfQkFDSyAqIGJ5XSxcbiAgICAgIEFycm93RG93bjogWydZJywgLVlfQkFDSyAqIGJ5XSxcbiAgICAgIEFycm93TGVmdDogWydYJywgLVhfUklHSFQgKiBieV0sXG4gICAgICBBcnJvd1JpZ2h0OiBbJ1gnLCBYX1JJR0hUICogYnldLFxuICAgICAgUGFnZVVwOiBbJ1onLCBieV0sXG4gICAgICBQYWdlRG93bjogWydaJywgLWJ5XVxuICAgIH1cbiAgICBjb25zdCBtb3ZlID0ga2V5c1tldmVudC5rZXldXG4gICAgaWYgKCFtb3ZlIHx8IGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCkgcmV0dXJuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGlmIChtb3ZlWzBdID09PSAnWicgPyB0aGlzLmNhbk1vdmVaIDogdGhpcy5jYW5Nb3ZlWFkpIHRoaXMubW92ZUJ5KG1vdmVbMF0sIG1vdmVbMV0pXG4gIH1cblxuICAvLyAtLSBnbyB0byAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqIFRoZSByZWFkb3V0IHR1cm5zIGludG8gZmllbGRzLCBmaWxsZWQgd2l0aCB3aGVyZSB0aGUgaGVhZCBpcyBpbiBHLWNvZGUgY29vcmRpbmF0ZXMgKHdoYXQgR28gc2VuZHMpLiAqL1xuICBvcGVuR29UbyAoKSB7XG4gICAgY29uc3QgZyA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5nY29kZV9tb3ZlPy5nY29kZV9wb3NpdGlvbiBhcyBudW1iZXJbXSB8IHVuZGVmaW5lZFxuICAgIGNvbnN0IGF0ID0gQXJyYXkuaXNBcnJheShnKSA/IGcgOiB0aGlzLnBvc2l0aW9uXG4gICAgdGhpcy5nb1RvID0gWzAsIDEsIDJdLm1hcChpID0+IE1hdGgucm91bmQoTnVtYmVyKGF0W2ldKSAqIDEwMCkgLyAxMDApXG4gICAgdGhpcy5nb1N0YXJ0ID0gWy4uLnRoaXMuZ29Ub11cbiAgICB0aGlzLmdvVGFyZ2V0ID0gdGhpcy5wYW5lbFRhcmdldFxuICAgIHRoaXMuZ29PcGVuID0gdHJ1ZVxuICB9XG5cbiAgc2V0R29UbyAoaTogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5nb1RvLnNwbGljZShpLCAxLCB2YWx1ZSlcbiAgfVxuXG4gIGdldCBnb1BsYWNlICgpOiB7IFg/OiBudW1iZXIsIFk/OiBudW1iZXIsIFo/OiBudW1iZXIgfSB7XG4gICAgY29uc3QgY2hhbmdlZCA9IChpOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IHYgPSB0aGlzLmdvVG9baV1cbiAgICAgIHJldHVybiB2ICE9PSBudWxsICYmIHYgIT09IHRoaXMuZ29TdGFydFtpXSA/IHYgOiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIHsgWDogY2hhbmdlZCgwKSwgWTogY2hhbmdlZCgxKSwgWjogY2hhbmdlZCgyKSB9XG4gIH1cblxuICBnZXQgZ29Qcm9ibGVtICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5nb09wZW4pIHJldHVybiAnJ1xuICAgIGNvbnN0IHBsYWNlID0gdGhpcy5nb1BsYWNlXG4gICAgaWYgKHBsYWNlLlggPT09IHVuZGVmaW5lZCAmJiBwbGFjZS5ZID09PSB1bmRlZmluZWQgJiYgcGxhY2UuWiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gJ0NoYW5nZSBhIHZhbHVlIHRvIGdvIHNvbWV3aGVyZS4nXG4gICAgcmV0dXJuIHRoaXMubW92ZVJlZnVzYWwocGxhY2UpXG4gIH1cblxuICBnZXQgZ29Ob3RlICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5nb09wZW4gfHwgdGhpcy5nb1Byb2JsZW0pIHJldHVybiAnJ1xuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZ2NvZGVPZmZzZXQgPz8gWzAsIDAsIDBdXG4gICAgY29uc3QgcmVhbCA9IChbJ1gnLCAnWScsICdaJ10gYXMgQXhpc1tdKS5tYXAoKGEsIGkpID0+IHRoaXMuZ29QbGFjZVthXSAhPT0gdW5kZWZpbmVkID8gKHRoaXMuZ29QbGFjZVthXSBhcyBudW1iZXIpICsgb2Zmc2V0W2ldIDogTnVtYmVyKHRoaXMucG9zaXRpb25baV0pKSBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl1cbiAgICByZXR1cm4gdGhpcy5saWZ0Tm90ZSh0aGlzLnBsYW5IYW5kTW92ZShyZWFsKSwgJ1N0cmFpZ2h0IHRoZXJlLicpXG4gIH1cblxuICBnZXQgY2FuR28gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdvT3BlbiAmJiB0aGlzLmdvVGFyZ2V0ID09PSB0aGlzLnBhbmVsVGFyZ2V0ICYmICF0aGlzLmdvUHJvYmxlbVxuICB9XG5cbiAgZ28gKCkge1xuICAgIGlmICghdGhpcy5jYW5HbykgcmV0dXJuXG4gICAgaWYgKHRoaXMubW92ZVRvKHRoaXMuZ29QbGFjZSkpIHRoaXMuZ29PcGVuID0gZmFsc2VcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm1vdmVfX21vcmUge1xuICAgIGRpc3BsYXk6IGlubGluZS1ncmlkO1xuICAgIHdpZHRoOiAzMnB4O1xuICAgIGhlaWdodDogMzJweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcblxuICAgICY6aG92ZXIgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTsgfVxuICB9XG5cbiAgLm1vdmVfX25vdGUge1xuICAgIG1hcmdpbjogMCAwIDEycHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAubW92ZV9fY2FsbG91dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtYXJnaW4tYm90dG9tOiAxMnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtd2FybmluZykgMTQlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG5cbiAgICBzcGFuIHsgZmxleDogMTsgfVxuICB9XG5cbiAgLm1vdmVfX2JvZHkge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMWZyKTtcbiAgICBnYXA6IDIycHg7XG4gIH1cblxuICAubW92ZV9fYm9keS0tZGltIHtcbiAgICBvcGFjaXR5OiAwLjM4O1xuICB9XG5cbiAgQG1lZGlhIChtaW4td2lkdGg6IDExMDBweCkge1xuICAgIC5tb3ZlX19ib2R5Om5vdCgubW92ZV9fYm9keS0tcGhvbmUpOm5vdCgubW92ZV9fYm9keS0tc29sbykge1xuICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMS4xZnIpIG1pbm1heCgwLCAxZnIpO1xuICAgICAgYWxpZ24taXRlbXM6IHN0YXJ0O1xuICAgIH1cbiAgfVxuXG4gIC5tb3ZlX196b25lIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMHB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5tb3ZlX19zdWIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjA4ZW07XG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcblxuICAgIHNwYW4ge1xuICAgICAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgbGV0dGVyLXNwYWNpbmc6IDA7XG4gICAgICB0ZXh0LXRyYW5zZm9ybTogbm9uZTtcbiAgICB9XG4gIH1cblxuICAubW92ZV9fcGljayB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBtaW4taGVpZ2h0OiA0MHB4O1xuICB9XG5cbiAgLm1vdmVfX3BpY2stdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgMTYwcHg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5tb3ZlX19waWNrLW5vdGUge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLm1vdmVfX3BpY2stbm90ZS0tYmFkIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7XG4gIH1cblxuICAubW92ZV9fam9nIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGdhcDogMjhweDtcbiAgICBtYXJnaW4tdG9wOiA0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTZweDtcblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgICBvdXRsaW5lLW9mZnNldDogNHB4O1xuICAgIH1cbiAgfVxuXG4gIC5tb3ZlX19ib2R5LS1waG9uZSAubW92ZV9fam9nIHtcbiAgICBnYXA6IDIycHg7XG4gIH1cblxuICAubW92ZV9feHkge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMywgNThweCk7XG4gICAgZ3JpZC1hdXRvLXJvd3M6IDU4cHg7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAubW92ZV9femNvbCB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IDU4cHggNzRweCA1OHB4O1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogNzRweDtcbiAgICBnYXA6IDhweDtcbiAgfVxuXG4gIC5tb3ZlX196diB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgfVxuXG4gIC5tb3ZlX19iIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDE1cHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICBsaW5lLWhlaWdodDogMS4xO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcblxuICAgICY6ZGlzYWJsZWQge1xuICAgICAgb3BhY2l0eTogMC4zNTtcbiAgICAgIGN1cnNvcjogZGVmYXVsdDtcbiAgICB9XG5cbiAgICAmOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTtcbiAgICB9XG4gIH1cblxuICAubW92ZV9fYi0tZGlhZyB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE4cHg7XG4gIH1cblxuICAubW92ZV9fYi0teiB7XG4gICAgcGFkZGluZzogMCA2cHg7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLm1vdmVfX2RvdCB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBwbGFjZS1pdGVtczogY2VudGVyO1xuXG4gICAgaSB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIHdpZHRoOiA4cHg7XG4gICAgICBoZWlnaHQ6IDhweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgfVxuICB9XG5cbiAgLm1vdmVfX2JhciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWFyZ2luLXRvcDogMThweDtcbiAgICBwYWRkaW5nLXRvcDogMTZweDtcbiAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gIH1cblxuICAubW92ZV9fYmFyLS1iYXJlIHtcbiAgICBtYXJnaW4tdG9wOiAwO1xuICAgIHBhZGRpbmctdG9wOiAwO1xuICAgIGJvcmRlci10b3A6IDA7XG4gIH1cblxuICAubW92ZV9fZ290byB7XG4gICAgaGVpZ2h0OiBhdXRvO1xuICB9XG5cbiAgLm1vdmVfX2dvIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDEgMSAxMDAlO1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLm1vdmVfX2dvLW5vdGUge1xuICAgIGZsZXg6IDEgMSAxNjBweDtcbiAgfVxuXG4gIC5tb3ZlX19maWVsZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgOTBweDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogNHB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gIH1cblxuICAubW92ZV9fZmllbGQgOmRlZXAoLm51bWZpZWxkKSB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLypcbiAgICogVGhlIE92ZXJ2aWV3J3MgVHJhY2twYWQgKEphY2sncyBwaWNrIEIsIEtBTi0yMDc3KTogdGhlIHBhZCBmaWxscyB0aGVcbiAgICogdGlsZSwgdGhlIHBpY2tlZCBzcG90IGFuZCB0aGUgTGl2ZSAvIE9uIHJlbGVhc2UgY2hvaWNlIHNpdCBvbiB0aGUgcGFkJ3NcbiAgICogbG93ZXIgY29ybmVycywgYW5kIG9uZSBsaW5lIHVuZGVyIGl0IHNheXMgd2hhdCBhIHByZXNzIHdpbGwgZG8uIE5vXG4gICAqIGJ1dHRvbiBzZW5kcyB0aGUgbW92ZTogbGlmdGluZyB0aGUgcG9pbnRlciBkb2VzLlxuICAgKi9cbiAgLm1vdmVfX3pvbmUtLWNvbXBhY3Qge1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLm1vdmVfX3BhZHdyYXAge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgfVxuXG4gIC5tb3ZlX19wYWR3cmFwLS1iYXJlIHtcbiAgICBtYXJnaW46IDA7XG4gIH1cblxuICAubW92ZV9fcGFkd3JhcDpub3QoLm1vdmVfX3BhZHdyYXAtLWJhcmUpIDpkZWVwKC50cGFkKSB7XG4gICAgbWFyZ2luOiAwIGF1dG87XG4gIH1cblxuICAubW92ZV9fZ2xhc3Mge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBib3R0b206IDhweDtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIHBhZGRpbmc6IDRweCAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtc3VyZmFjZSkgODQlLCB0cmFuc3BhcmVudCk7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIH1cblxuICAubW92ZV9fcmVhZG91dCB7XG4gICAgbGVmdDogOHB4O1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLm1vdmVfX21vZGUge1xuICAgIHJpZ2h0OiA4cHg7XG4gICAgZ2FwOiAycHg7XG4gICAgcGFkZGluZzogM3B4O1xuICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuXG4gICAgYnV0dG9uIHtcbiAgICAgIGhlaWdodDogMjRweDtcbiAgICAgIHBhZGRpbmc6IDAgOXB4O1xuICAgICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG5cbiAgICAgICYub24ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICAgICAgY29sb3I6IHZhcigtLW0zZC1vbi1hY2NlbnQsICMwMDIwMWUpO1xuICAgICAgfVxuXG4gICAgICAmOmRpc2FibGVkIHtcbiAgICAgICAgb3BhY2l0eTogMC40NTtcbiAgICAgICAgY3Vyc29yOiBkZWZhdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC5tb3ZlX19tb2Rld3JhcCB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gIH1cblxuICAubW92ZV9fcGljay0tbGluZSB7XG4gICAgbWluLWhlaWdodDogMjBweDtcbiAgfVxuXG4gIC8qIENULTAzOiB0aGUgb25lIEhvbWUgY29udHJvbCBzaXRzIGluIHRoZSBoZWFkZXIsIGJlc2lkZSB0aGUgdGl0bGUsIG9uIHRoZSBPdmVydmlldyBhbmQgb24gQ29udHJvbC4gKi9cbiAgLm1vdmVfX2hob21lcyB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZ2FwOiA2cHg7XG4gIH1cblxuICAubW92ZV9faGJ0biB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBnYXA6IDZweDtcbiAgICBoZWlnaHQ6IDM0cHg7XG4gICAgcGFkZGluZzogMCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuXG4gICAgJjpob3Zlcjpub3QoOmRpc2FibGVkKSB7IGZpbHRlcjogYnJpZ2h0bmVzcygxLjE1KTsgfVxuICAgICY6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ1OyBjdXJzb3I6IGRlZmF1bHQ7IH1cbiAgfVxuXG4gIC5tb3ZlX19oYnRuLS1pY29uLFxuICAubW92ZV9faGJ0bi0teiB7XG4gICAgd2lkdGg6IDM0cHg7XG4gICAgcGFkZGluZzogMDtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubyk7XG4gIH1cblxuICAubW92ZV9fem9mZnNldCB7XG4gICAgbWFyZ2luLXRvcDogMTZweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbE1vdmUudnVlIn0=