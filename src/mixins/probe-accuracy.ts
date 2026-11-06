import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from './maintenance'
import type { ConsoleEntry } from '@/store/console/types'
import { bedMiddle, parseProbeAccuracy, probeAccuracyScript, probeVerdict, type ProbeAccuracy } from '@/services/maintenance/model'
import { meshSpan, readNoGo } from '@/services/control/safe-move'
import { EventBus } from '@/eventBus'
import { plateCheckNeeded } from '@/services/jobs/plate'

/**
 * Probe accuracy: ten probes in the middle of the bed, and how repeatable the
 * heights are. The result comes from Klipper's own line in the console. Used
 * by the Probe tile on Bed and by Calibration on Health, so both ask the same
 * confirmation and go to the middle of the bed by the same no-go-aware path.
 */
@Component({})
export default class ProbeAccuracyMixin extends Mixins(MaintenanceMixin) {
  /** The newest PROBE_ACCURACY result in the console, and when it came. */
  get latest (): { result: ProbeAccuracy, time: number } | null {
    const entries = (this.$store.state.console.console as ConsoleEntry[] | undefined) ?? []
    for (let i = entries.length - 1; i >= 0; i--) {
      const result = parseProbeAccuracy(entries[i].message ?? '')
      if (result) return { result, time: entries[i].time ?? 0 }
    }
    return null
  }

  get accuracy (): ProbeAccuracy | null {
    return this.latest?.result ?? null
  }

  get verdict () {
    return probeVerdict(this.accuracy?.stddev ?? 0)
  }

  get accuracyWhen (): string {
    const t = this.latest?.time
    if (!t) return ''
    const d = new Date(t * 1000)
    return `· ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
  }

  micron (mm: number): string {
    return `${Math.round(mm * 1000)} µm`
  }

  get checking (): boolean {
    return this.hasWait(this.$waits.onProbeAccuracy)
  }

  get canCheck (): boolean {
    return 'PROBE_ACCURACY' in this.gcodeCommands && !this.checksBlocked && !this.checking
  }

  get middle (): [number, number] {
    const mesh = this.$store.state.printer.printer.configfile?.settings?.bed_mesh
    return bedMiddle(mesh?.mesh_min, mesh?.mesh_max, this.axisMin, this.axisMax)
  }

  async checkAccuracy () {
    if (!this.canCheck) return
    const target = this.maintenanceTarget
    const [x, y] = this.middle
    const ok = await this.$confirm(
      `${this.allHomed ? 'The head' : 'It homes, then the head'} goes to the middle of the bed (X${x} Y${y}) and probes there ten times. Keep the plate on and the nozzle clean.`,
      // It touches the middle of the plate ten times: the plate check first, as for a print.
      { title: 'Check how steady the probe is?', buttonTrueText: 'Start', plateCheck: plateCheckNeeded(this.$store.state.history?.jobs) }
    )
    if (!ok || target !== this.maintenanceTarget || !this.canCheck) return
    // Config not loaded yet counts as unreadable, as for every hand move.
    const settings = this.$store.state.printer.printer.configfile?.settings
    const noGo = settings && Object.keys(settings).length ? readNoGo(settings.bed_mesh) : 'invalid'
    if (noGo === 'invalid') {
      EventBus.$emit('The printer’s no-go regions could not be read, so the probe check will not move the head. Check [bed_mesh] in printer.cfg.', { type: 'warning' })
      return
    }
    let lift: number | undefined
    if (noGo) {
      // Where homing leaves the head isn't known here, so with no-go regions
      // the check starts from a homed head whose height is known.
      if (!this.allHomed) {
        EventBus.$emit('Home the printer first: the way to the middle of the bed passes the notch.', { type: 'warning' })
        return
      }
      // Lift only if the head is below the crossing height (never lower it onto
      // whatever is on the plate), sent in G-code coordinates.
      const printer = this.$store.state.printer.printer
      const toolZ = Number(printer.toolhead?.position?.[2])
      const gcodeZ = Number(printer.gcode_move?.gcode_position?.[2])
      if (!Number.isFinite(toolZ) || !Number.isFinite(gcodeZ)) return
      const clear = noGo.traverseZ + meshSpan(printer.bed_mesh)
      if (toolZ < clear) lift = Math.round((clear - (toolZ - gcodeZ)) * 1000) / 1000
    }
    this.sendGcode(probeAccuracyScript(this.allHomed, this.middle, lift), this.$waits.onProbeAccuracy)
  }
}
