import { Component, Mixins, Watch } from 'vue-property-decorator'
import TypedCommandsMixin from './typed-commands'
import { cloudState } from '@/services/muon-cloud/state'
import ToolheadMixin from './toolhead'
import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, Heater, Led, OutputPin, Sensor } from '@/store/printer/types'
import {
  clampTo,
  fanCommand,
  fanPercent,
  fileFilament,
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
  type Material,
  type MaterialChoice
} from '@/services/control/model'
import { presetCommands } from '@/util/temperature-preset'
import { zAdjustCommand } from '@/services/control/z-adjust'
import { handMoveSettling, headStatus, lockHandMove, releaseHandMove, scriptsInFlight, meshSpan, planMove, readNoGo, type MovePlan, type NoGoConfig, type Place } from '@/services/control/safe-move'
import { EventBus } from '@/eventBus'
import { fastPercent, materialMaxFlow, peakFlow, speedChoices, type SpeedChoice } from '@/services/control/speed'
import type { Move } from '@/store/gcodePreview/types'

/** A print's peak flow, worked out once per parsed file, however many panels ask. */
const peakFlows = new WeakMap<readonly Move[], number | null>()

type Axis = 'X' | 'Y' | 'Z'
export type LimitKey = 'VELOCITY' | 'ACCEL' | 'SQUARE_CORNER_VELOCITY' | 'MINIMUM_CRUISE_RATIO' | 'ACCEL_TO_DECEL'

const limitSetting: Record<LimitKey, string> = {
  VELOCITY: 'max_velocity',
  ACCEL: 'max_accel',
  SQUARE_CORNER_VELOCITY: 'square_corner_velocity',
  MINIMUM_CRUISE_RATIO: 'minimum_cruise_ratio',
  ACCEL_TO_DECEL: 'max_accel_to_decel'
}

/** The heat below which a nozzle's − goes to Off and its + starts. */
export const NOZZLE_FLOOR = 170
export const BED_FLOOR = 40

/**
 * What Control's panels share: the printer's position, heaters, fans and
 * lights, as values, and the commands that change them. Each command is
 * the G-code Fluidd's own cards send, so Control and the cards agree.
 */
@Component
export default class ControlMixin extends Mixins(TypedCommandsMixin, ToolheadMixin) {
  get controlReady (): boolean {
    return this.commandControlAvailable && this.klippyReady && this.klippyConnected
  }

  adjustZ (by: number) {
    if (!this.controlReady || !this.isHomed('Z') || this.hasWait(this.$waits.onZAdjust)) return
    // Idle, a nudge closer moves the head (MOVE=1): not while a hand move or a
    // script is still in flight, or it runs from where they leave the head (KAN-1745).
    if (!this.busy && by < 0) {
      const wait = this.handMoveWait()
      if (wait) { this.refuseMove(wait); return }
    }
    const command = zAdjustCommand(by, true)
    if (command) this.sendGcode(command, this.$waits.onZAdjust)
  }

  get panelTarget (): string {
    return `${this.commandTarget}|${cloudState.account?.id ?? ''}`
  }

  get controlLock (): string {
    if (!this.commandControlAvailable) return 'Connect to a printer you can control first.'
    return this.controlReady ? '' : this.notReadyReason
  }

  /** Printing or paused: moves, extrusion and motors are left alone. */
  /** Why the controls are locked when Klipper isn't ready: the connection, when that is what's gone. */
  get notReadyReason (): string {
    return this.socketConnected ? 'Klipper is not ready' : 'Not connected to the printer'
  }

  /**
   * Whether this is a Muon printer (an M1), from the gate primitive
   * `server/isMuonPrinter` (#296): true, false, or null until server.info
   * has answered. Named apart from MuonGatesMixin's isMuonPrinter so the
   * two mixins can sit together.
   */
  get muonPrinter (): boolean | null {
    const v = this.$store.getters['server/isMuonPrinter'] as boolean | null | undefined
    return v === undefined ? null : v
  }

  get busy (): boolean {
    return this.printerPrinting || this.printerPaused || this.printerState === 'busy'
  }

  get toolhead () {
    return this.$store.state.printer.printer.toolhead ?? {}
  }

  get position (): number[] {
    return (this.toolhead.position as number[] | undefined) ?? [0, 0, 0, 0]
  }

  get axisMin (): number[] {
    return (this.toolhead.axis_minimum as number[] | undefined) ?? [0, 0, 0]
  }

  get axisMax (): number[] {
    return (this.toolhead.axis_maximum as number[] | undefined) ?? [200, 200, 200]
  }

  get homedAxes (): string {
    return ((this.toolhead.homed_axes as string | undefined) ?? '').toUpperCase()
  }

  get xySpeed (): number {
    return this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed as number
  }

  get zSpeed (): number {
    return this.$store.state.config.uiSettings.general.defaultToolheadZSpeed as number
  }

  // -- heat ------------------------------------------------------------------

  get heaters (): Heater[] {
    return (this.$store.getters['printer/getHeaters'] as Heater[]) ?? []
  }

  get nozzle (): Heater | null {
    return this.heaters.find(h => h.name === 'extruder') ?? null
  }

  get bed (): Heater | null {
    return this.heaters.find(h => h.name === 'heater_bed') ?? null
  }

  get chamber (): Sensor | null {
    const sensors = (this.$store.getters['printer/getSensors'] as Sensor[]) ?? []
    return sensors.find(s => /chamber/i.test(s.name)) ?? null
  }

  get presets (): TemperaturePreset[] {
    return (this.$store.getters['config/getTempPresets'] as TemperaturePreset[]) ?? []
  }

  get materials (): Material[] {
    return materialsFrom(this.presets)
  }

  get material (): Material | null {
    return materialInUse(this.materials, this.nozzle?.target ?? 0, this.bed?.target ?? 0)
  }

  get materialChoices (): MaterialChoice[] {
    return materialChoices(this.materials)
  }

  /** Whether the printer can remember the material itself (Klipper's [save_variables]; the M1 has it). */
  get savesMaterial (): boolean {
    return 'save_variables' in this.$store.state.printer.printer
  }

  /**
   * The material loaded: the one the printer remembers (the panel and this
   * page set the same save_variables muon_material), else, on a printer
   * that can't remember one, the one set here.
   */
  get loadedMaterial (): MaterialChoice | null {
    const name = this.savesMaterial
      ? savedMaterialName(this.$store.state.printer.printer.save_variables?.variables)
      : (this.$store.state.config.uiSettings.general.loadedMaterial as string | null)
    const choice = loadedChoice(this.materialChoices, name)
    const colour = this.loadedColour
    return choice && colour ? { ...choice, colour } : choice
  }

  /**
   * While a print runs and nobody has said what's loaded: what its file was
   * sliced for, which is what is feeding now. Shown as that, never saved as
   * the loaded record (14 Oct: Walnut printing showed "Not set").
   */
  get printingWith (): { name: string, colour: string | null } | null {
    if (this.loadedMaterial || !(this.printerPrinting || this.printerPaused)) return null
    return fileFilament(this.$store.state.printer.printer.current_file)
  }

  /**
   * The loaded filament's colour, when someone has said it: the printer's
   * save_variables muon_material_colour (set here, on Control and from the
   * slicer), else, on a printer that can't remember one, the one set here.
   * Null when nobody has: a material's swatch is not its colour.
   */
  get loadedColour (): string | null {
    return this.savesMaterial
      ? savedMaterialColour(this.$store.state.printer.printer.save_variables?.variables)
      : normaliseColour(this.$store.state.config.uiSettings.general.loadedMaterialColour)
  }

  setLoadedMaterial (choice: MaterialChoice) {
    if (this.savesMaterial) {
      this.sendGcode(saveMaterialCommand(choice.name))
    } else {
      this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.loadedMaterial', value: choice.name, server: true })
    }
  }

  setLoadedColour (colour: string) {
    const hex = normaliseColour(colour)
    if (!hex) return
    if (this.savesMaterial) {
      this.sendGcode(saveMaterialColourCommand(hex))
    } else {
      this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.loadedMaterialColour', value: hex, server: true })
    }
  }

  /** Heats for a material: as its preset says when it has one, else to its temperatures. */
  heatFor (choice: MaterialChoice) {
    if (!this.controlReady) return
    const preset = choice.presetId === null ? undefined : this.presets.find(p => p.id === choice.presetId)
    if (preset) {
      presetCommands(preset).forEach(g => this.sendGcode(g))
      return
    }
    if (choice.nozzle !== null) this.setHeater(this.nozzle, choice.nozzle)
    if (choice.bed !== null) this.setHeater(this.bed, choice.bed)
  }

  setHeater (heater: Heater | null, target: number) {
    const current = this.heaters.find(h => h.name === heater?.name)
    if (!this.controlReady || !current || !Number.isFinite(target) || target < 0 || target > (current.maxTemp ?? 300)) return
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${current.name} TARGET=${Math.round(target)}`)
  }

  applyMaterial (material: Material) {
    if (!this.controlReady) return
    const preset = this.presets.find(p => p.id === material.id)
    if (preset) presetCommands(preset).forEach(g => this.sendGcode(g))
  }

  async coolDown () {
    if (!this.controlReady) return
    const target = this.panelTarget
    if (this.busy) {
      const ok = await this.$confirm('The printer is busy. With the heaters off, what it is doing now will most likely fail.', {
        title: 'Turn the heaters off?',
        buttonTrueText: 'Turn them off',
        buttonFalseText: 'Leave them on',
        danger: true
      })
      if (!ok) return
    }
    if (this.controlReady && target === this.panelTarget) this.sendGcode('TURN_OFF_HEATERS')
  }

  // -- move ------------------------------------------------------------------

  isHomed (axes: string): boolean {
    return axes.toUpperCase().split('').every(a => this.homedAxes.includes(a))
  }

  inverted (axis: Axis): boolean {
    return !!this.$store.state.config.uiSettings.general.axis?.[axis.toLowerCase()]?.inverted
  }

  /**
   * The no-go regions this printer declares in [bed_mesh], read live. Until
   * the printer's config has loaded at all, the regions are unknown: treated
   * as unreadable, so only raising the head is allowed.
   */
  get noGo (): NoGoConfig | null | 'invalid' {
    const settings = this.$store.state.printer.printer.configfile?.settings
    if (!settings || !Object.keys(settings).length) return 'invalid'
    return readNoGo(settings.bed_mesh)
  }

  /**
   * Toolhead minus G-code position, per axis: the mesh and G-code offsets now
   * in force. Planning is done in toolhead (real) coordinates; a move is sent
   * in G-code coordinates, so a planned place is sent minus this. Null when
   * the G-code position isn't known.
   */
  get gcodeOffset (): [number, number, number] | null {
    const gcode = this.$store.state.printer.printer.gcode_move?.gcode_position as number[] | undefined
    if (!Array.isArray(gcode)) return null
    const d = [0, 1, 2].map(i => Number(this.position[i]) - Number(gcode[i]))
    return d.every(Number.isFinite) ? d as [number, number, number] : null
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
  handMoveWait (): string {
    if (!headStatus.fresh) return 'Wait for the printer to report where the head is.'
    if (scriptsInFlight.count > 0) return 'Wait for the printer to finish what it is doing.'
    if (handMoveSettling(this.$store.state.printer.printer.gcode_move?.gcode_position, this.panelTarget)) return 'Wait for the head to finish moving.'
    return ''
  }

  /** Losing control (disconnect, Klippy not ready, sign-out) ends any wait: the next move plans afresh. */
  @Watch('controlReady')
  onControlReadyForHandMove (ready: boolean) {
    if (!ready) {
      releaseHandMove()
      // Klippy gone (restart, shutdown, disconnect): it is subscribed afresh
      // when it comes back, so wait for that status before planning. (Losing
      // control for other reasons keeps the same subscription.)
      if (!this.klippyReady || !this.klippyConnected) headStatus.fresh = false
    }
  }

  /**
   * Plan a move to `realTo` (toolhead coordinates) against the bed's no-go
   * regions. Steps come back in G-code coordinates, ready to send.
   */
  planHandMove (realTo: [number, number, number]): MovePlan {
    const noGo = this.noGo
    const limits = { min: this.axisMin.slice(0, 3) as [number, number, number], max: this.axisMax.slice(0, 3) as [number, number, number] }
    const from = { x: Number(this.position[0]), y: Number(this.position[1]), z: Number(this.position[2]) }
    const to = { x: realTo[0], y: realTo[1], z: realTo[2] }
    if (noGo === null) return planMove(from, to, null, limits)
    const offset = this.gcodeOffset
    if (!offset) return { ok: false, reason: 'The head position is not known.' }
    const plan = planMove(from, to, noGo, limits, meshSpan(this.$store.state.printer.printer.bed_mesh))
    if (!plan.ok) return plan
    const toGcode = (p: Place): Place => {
      const out: Place = {}
      ;(['X', 'Y', 'Z'] as Axis[]).forEach((a, i) => { if (p[a] !== undefined) out[a] = Math.round((p[a] as number - offset[i]) * 1000) / 1000 })
      return out
    }
    return { ...plan, steps: plan.steps.map(toGcode) }
  }

  refuseMove (reason: string) {
    EventBus.$emit(reason, { type: 'warning' })
  }

  /** Make the next hand move wait for this one to land (on every printer: see handMoveWait). */
  markHandMove (realTo: number[]) {
    const offset = this.gcodeOffset
    if (!offset) return
    lockHandMove(realTo.slice(0, 3).map((v, i) => Math.round((v - offset[i]) * 1000) / 1000), this.panelTarget)
  }

  /** Send a planned move: lift, across, down, as one absolute script. */
  sendPlannedMoves (steps: Place[]) {
    const line = (p: Place) => {
      const words = (['X', 'Y', 'Z'] as Axis[]).filter(a => p[a] !== undefined).map(a => `${a}${p[a]}`)
      const rate = p.Z !== undefined ? this.zSpeed : this.xySpeed
      return `G1 ${words.join(' ')} F${rate * 60}`
    }
    this.sendGcode(['SAVE_GCODE_STATE NAME=_ui_movement', 'G90', ...steps.map(line), 'RESTORE_GCODE_STATE NAME=_ui_movement'].join('\n'))
  }

  /** A step along one axis, cut short at the machine's limits, kept out of the bed's no-go regions. */
  moveBy (axis: Axis, distance: number) {
    if (!this.controlReady || this.busy || !this.isHomed(axis) || !Number.isFinite(distance)) return
    if (![this.xySpeed, this.zSpeed].every(v => Number.isFinite(v) && v > 0)) return
    const wait = this.handMoveWait()
    if (wait) { this.refuseMove(wait); return }
    const i = 'XYZ'.indexOf(axis)
    const signed = this.inverted(axis) ? -distance : distance
    const target = clampTo(this.position[i] + signed, this.axisMin[i], this.axisMax[i])
    const by = Math.round((target - this.position[i]) * 1000) / 1000
    if (!by) return
    const realTo = [0, 1, 2].map(j => Number(this.position[j])) as [number, number, number]
    realTo[i] = target
    const plan = this.planHandMove(realTo)
    if (!plan.ok) { this.refuseMove(plan.reason); return }
    if (plan.lifted) this.sendPlannedMoves(plan.steps)
    else this.sendMoveGcode(`${axis}${by}`, axis === 'Z' ? this.zSpeed : this.xySpeed)
    this.markHandMove(realTo)
  }

  /**
   * A diagonal step: X and Y at once, cut short at the machine's limits.
   * Sent through moveTo, so it gets the same checks as every hand move
   * (homed, not printing, the hand-move wait and the no-go planner).
   */
  moveByXY (dx: number, dy: number): boolean {
    if (!this.controlReady || this.busy || !this.isHomed('XY') || !Number.isFinite(dx) || !Number.isFinite(dy)) return false
    if (![this.xySpeed, this.zSpeed].every(v => Number.isFinite(v) && v > 0)) return false
    const wait = this.handMoveWait()
    if (wait) { this.refuseMove(wait); return false }
    // Planned from the toolhead (commanded) position and sent as a relative
    // step, as moveBy does, so a position that lags can't swallow a step.
    const realTo = [0, 1, 2].map(j => Number(this.position[j])) as [number, number, number]
    const by: number[] = [0, 0]
    ;(['X', 'Y'] as Axis[]).forEach((axis, i) => {
      const d = axis === 'X' ? dx : dy
      const signed = this.inverted(axis) ? -d : d
      const target = clampTo(this.position[i] + signed, this.axisMin[i], this.axisMax[i])
      by[i] = Math.round((target - this.position[i]) * 1000) / 1000
      realTo[i] = target
    })
    if (!by[0] && !by[1]) return false
    const plan = this.planHandMove(realTo)
    if (!plan.ok) { this.refuseMove(plan.reason); return false }
    if (plan.lifted) this.sendPlannedMoves(plan.steps)
    else this.sendMoveGcode(['X', 'Y'].filter((_, i) => by[i]).map(a => `${a}${by['XY'.indexOf(a)]}`).join(' '), this.xySpeed)
    this.markHandMove(realTo)
    return true
  }

  /**
   * Why a move to a place in G-code coordinates would be refused now, or ''
   * when moveTo would send it: the same gates and the same plan as moveTo,
   * in words, not counting the hand-move wait. A live drag stops on it.
   */
  moveRefusal (place: { X?: number, Y?: number, Z?: number }): string {
    if (!this.controlReady) return this.controlLock || 'Not connected to the printer'
    if (this.busy) return 'Not while printing: moving the head would ruin the print.'
    if (![this.xySpeed, this.zSpeed].every(v => Number.isFinite(v) && v > 0)) return 'Set the jog speeds in Settings first.'
    const axes = (['X', 'Y', 'Z'] as Axis[]).filter(a => place[a] !== undefined)
    if (!axes.length) return 'Nothing to move.'
    for (const axis of axes) {
      const i = 'XYZ'.indexOf(axis)
      const value = place[axis] as number
      if (!this.isHomed(axis)) return `Home ${axis} first.`
      if (!Number.isFinite(value) || value < this.axisMin[i] || value > this.axisMax[i]) return 'That spot is outside the machine.'
    }
    const offset = this.gcodeOffset ?? [0, 0, 0]
    const realTo = (['X', 'Y', 'Z'] as Axis[]).map((a, i) => place[a] !== undefined ? (place[a] as number) + offset[i] : Number(this.position[i])) as [number, number, number]
    const plan = this.planHandMove(realTo)
    return plan.ok ? '' : plan.reason
  }

  /** To a place given in G-code coordinates, inside the machine and out of the bed's no-go regions. True when it was sent. */
  moveTo (place: { X?: number, Y?: number, Z?: number }): boolean {
    if (!this.controlReady || this.busy || ![this.xySpeed, this.zSpeed].every(v => Number.isFinite(v) && v > 0)) return false
    const parts: string[] = []
    let rate = this.xySpeed
    for (const axis of ['X', 'Y', 'Z'] as Axis[]) {
      const value = place[axis]
      if (value === undefined) continue
      const i = 'XYZ'.indexOf(axis)
      if (!this.isHomed(axis) || !Number.isFinite(value) || value < this.axisMin[i] || value > this.axisMax[i]) return false
      parts.push(`${axis}${value}`)
      if (axis === 'Z') rate = Math.min(rate, this.zSpeed)
    }
    if (!parts.length) return false
    const wait = this.handMoveWait()
    if (wait) { this.refuseMove(wait); return false }
    const offset = this.gcodeOffset ?? [0, 0, 0]
    const realTo = (['X', 'Y', 'Z'] as Axis[]).map((a, i) => place[a] !== undefined ? (place[a] as number) + offset[i] : Number(this.position[i])) as [number, number, number]
    const plan = this.planHandMove(realTo)
    if (!plan.ok) { this.refuseMove(plan.reason); return false }
    if (plan.lifted) this.sendPlannedMoves(plan.steps)
    else this.sendMoveGcode(parts.join(' '), rate, true)
    this.markHandMove(realTo)
    return true
  }

  homeWait (axes = ''): string {
    if (axes === 'XY') return this.$waits.onHomeXY
    if (axes === 'Z') return this.$waits.onHomeZ
    return this.$waits.onHomeAll
  }

  home (axes = '') {
    if (!this.controlReady || this.busy) return
    this.sendGcode(axes ? `G28 ${axes.split('').join(' ')}` : 'G28', this.homeWait(axes))
  }

  homing (axes = ''): boolean {
    return this.hasWait(this.homeWait(axes))
  }

  motorsOff () {
    if (!this.controlReady || this.busy) return
    this.sendGcode('M84')
  }

  // -- speed and tuning ------------------------------------------------------

  get gcodeMove () {
    return this.$store.state.printer.printer.gcode_move ?? {}
  }

  get speedFactor (): number {
    return Math.round(((this.gcodeMove.speed_factor as number | undefined) ?? 1) * 100)
  }

  get flowFactor (): number {
    return Math.round(((this.gcodeMove.extrude_factor as number | undefined) ?? 1) * 100)
  }

  setSpeed (percent: number) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 1 || percent > 500) return
    this.sendGcode(`M220 S${Math.round(percent)}`)
  }

  /** The moves of the file being printed, when the G-code preview holds it. */
  get printMoves (): readonly Move[] | null {
    const printing = (this.$store.state.printer.printer.print_stats?.filename as string | undefined) ?? ''
    const file = this.$store.getters['gcodePreview/getFile'] as { filename: string, path?: string } | undefined
    if (!printing || !file || this.$store.state.gcodePreview.parserWorker) return null
    const path = file.path ? `${file.path}/${file.filename}` : file.filename
    return path === printing ? this.$store.getters['gcodePreview/getMoves'] as Move[] : null
  }

  /**
   * Slow, Normal and Fast for the print running (services/control/speed.ts):
   * Fast is as much faster as the nozzle can melt this filament for this
   * print, or a quarter when the print's flow isn't known.
   */
  get speedChoices (): SpeedChoice[] {
    const moves = this.printMoves
    let peak: number | null = null
    if (moves) {
      if (!peakFlows.has(moves)) {
        const diameter = Number(this.$store.state.printer.printer.configfile?.settings?.extruder?.filament_diameter) || 1.75
        peakFlows.set(moves, peakFlow(moves, diameter))
      }
      peak = peakFlows.get(moves) ?? null
    }
    const metadata = this.$store.state.printer.printer.current_file as { filament_type?: string } | undefined
    const maxFlow = (this.$store.state.gcodePreview.maxFlow as number | null) ??
      materialMaxFlow(metadata?.filament_type) ??
      materialMaxFlow(this.loadedMaterial?.name)
    return speedChoices(fastPercent(peak, maxFlow), peak !== null && maxFlow !== null)
  }

  /** "Slow", "Normal", "Fast", or "110%" for anything else. */
  get speedLabel (): string {
    return this.speedChoices.find(c => c.percent === this.speedFactor)?.label ?? `${this.speedFactor}%`
  }

  setFlow (percent: number) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 1 || percent > 300) return
    this.sendGcode(`M221 S${Math.round(percent)}`)
  }

  get pressureAdvance (): number | null {
    return this.activeExtruder?.pressure_advance ?? null
  }

  setPressureAdvance (value: number) {
    if (!this.controlReady || !Number.isFinite(value) || value < 0 || value > 2) return
    this.sendGcode(`SET_PRESSURE_ADVANCE ADVANCE=${value}`)
  }

  /** Configured ceiling. Live status is a current value, never authority for a new limit. */
  limitMaximum (key: LimitKey): number | null {
    const setting = this.$store.state.printer.printer.configfile?.settings?.printer?.[limitSetting[key]]
    const parsed = typeof setting === 'number' || (typeof setting === 'string' && setting.trim() !== '')
      ? Number(setting)
      : Number.NaN
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return key === 'MINIMUM_CRUISE_RATIO' ? Math.min(parsed, 1) : parsed
  }

  /** Velocity, acceleration, square corner velocity and the cruise ratio, until a restart. */
  setLimit (key: LimitKey, value: number) {
    const maximum = this.limitMaximum(key)
    if (!this.controlReady || maximum === null || !Number.isFinite(value) || value < 0 || value > maximum || (['VELOCITY', 'ACCEL'].includes(key) && value <= 0)) return
    this.sendGcode(`SET_VELOCITY_LIMIT ${key}=${value}`)
  }

  // -- fans and lights -------------------------------------------------------

  get fans (): Fan[] {
    return (this.$store.getters['printer/getAllFans'] as Fan[]) ?? []
  }

  get partFan (): Fan | null {
    return this.fans.find(f => f.type === 'fan') ?? null
  }

  fanValue (fan: Fan): number {
    return fanPercent(fan)
  }

  setFan (fan: Fan, percent: number) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 0 || percent > 100) return
    const gcode = fanCommand(fan, percent)
    if (gcode) this.sendGcode(gcode)
  }

  get lightsPin (): OutputPin | null {
    return lightsOutput((this.$store.getters['printer/getPins'] as OutputPin[]) ?? [])
  }

  get lightsLed (): Led | null {
    return this.lightsPin ? null : lightsOutput((this.$store.getters['printer/getAllLeds'] as Led[]) ?? [])
  }

  get hasLights (): boolean {
    return !!this.lightsPin || !!this.lightsLed
  }

  /** The lights, 0 to 100. */
  get lightsValue (): number {
    if (this.lightsPin) return pinPercent(this.lightsPin.value)
    const data = this.lightsLed?.color_data?.[0] ?? []
    return Math.round(Math.max(0, ...data) * 100)
  }

  setLights (value: number | boolean) {
    if (!this.controlReady || (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 100))) return
    const percent = typeof value === 'boolean' ? (value ? 100 : 0) : value
    if (this.lightsPin) {
      this.sendGcode(pinCommand(this.lightsPin, this.lightsPin.pwm ? percent : percent > 0))
    } else if (this.lightsLed) {
      const v = Math.round(percent) / 100
      this.sendGcode(`SET_LED LED=${this.lightsLed.name} RED=${v} GREEN=${v} BLUE=${v} WHITE=${v}`)
    }
  }
}
