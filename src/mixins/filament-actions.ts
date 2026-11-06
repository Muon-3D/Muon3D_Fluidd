import Vue from 'vue'
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from './control'
import { EventBus } from '@/eventBus'
import { findFilamentMacro, type FilamentMacro } from '@/services/quick-actions/model'
import {
  changeFilamentPlan,
  loadUnloadPlan,
  LOADING_NOTE,
  UNLOADING_NOTE,
  type FilamentPlan,
  type FilamentState
} from '@/services/control/filament-change'

const CHANGE_NAMES = ['m600', 'change_filament', 'filament_change']
const LOAD_NAMES = ['load_filament', 'filament_load']
const UNLOAD_NAMES = ['unload_filament', 'filament_unload']

/**
 * One guard for every filament button on the page (the Filament card, the
 * material panel, Quick actions): from a send until Klipper reports itself
 * busy, or 5 s, nothing else is sent, so a double click sends once.
 */
export const filamentSend = Vue.observable({ until: 0, now: Date.now() })

/**
 * Change filament, Load and Unload, as every filament button runs them
 * (filament-change.ts, KAN-1700): each asks first, nothing heats or moves
 * without that, and nothing is sent while paused, busy or prompting.
 */
@Component
export default class FilamentActionsMixin extends Mixins(ControlMixin) {
  get filamentMacros (): Array<{ name?: unknown, config?: { gcode?: unknown } }> {
    return (this.$store.getters['macros/getMacros'] as Array<{ name?: unknown, config?: { gcode?: unknown } }> | undefined) ?? []
  }

  get changeMacro (): FilamentMacro | null { return findFilamentMacro(this.filamentMacros, ...CHANGE_NAMES) }
  get loadMacro (): FilamentMacro | null { return findFilamentMacro(this.filamentMacros, ...LOAD_NAMES) }
  get unloadMacro (): FilamentMacro | null { return findFilamentMacro(this.filamentMacros, ...UNLOAD_NAMES) }

  get filamentTemp (): number | null {
    return this.material?.nozzle ?? this.loadedMaterial?.nozzle ?? null
  }

  get filamentState (): FilamentState {
    return {
      printing: this.printerPrinting,
      paused: this.printerPaused,
      running: filamentSend.until > filamentSend.now ||
        (this.printerState === 'busy' && !this.printerPrinting && !this.printerPaused),
      promptOpen: !!this.$store.state.console.promptDialog?.open
    }
  }

  get changePlan (): FilamentPlan { return changeFilamentPlan(this.filamentState, this.changeMacro, this.filamentTemp) }
  get loadPlan (): FilamentPlan { return loadUnloadPlan(this.filamentState, 'load', this.loadMacro, this.filamentTemp) }
  get unloadPlan (): FilamentPlan { return loadUnloadPlan(this.filamentState, 'unload', this.unloadMacro, this.filamentTemp) }

  /** Asks, reads the plan again after the answer, then sends once. Resolves whether it sent. */
  async runFilamentPlan (which: 'change' | 'load' | 'unload'): Promise<boolean> {
    const read = () => which === 'change' ? this.changePlan : which === 'load' ? this.loadPlan : this.unloadPlan
    const plan = read()
    if (!this.controlReady || !('command' in plan)) return false
    const target = this.panelTarget
    const ok = await this.$confirm(plan.confirm.text, {
      title: plan.confirm.title,
      buttonTrueText: plan.confirm.yes,
      buttonFalseText: plan.confirm.no
    })
    filamentSend.now = Date.now()
    const now = read()
    if (!ok || target !== this.panelTarget || !this.controlReady || !('command' in now) || now.command !== plan.command) return false
    filamentSend.until = Date.now() + 5000
    filamentSend.now = Date.now()
    setTimeout(() => { filamentSend.now = Date.now() }, 5100)
    this.sendGcode(plan.command)
    if (plan.kind === 'unload') EventBus.$emit(UNLOADING_NOTE, { type: 'primary', timeout: 8000 })
    if (plan.kind === 'load') EventBus.$emit(LOADING_NOTE, { type: 'primary', timeout: 8000 })
    return true
  }
}
