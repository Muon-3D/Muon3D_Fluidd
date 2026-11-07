import Vue from 'vue'
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from './control'
import { EventBus } from '@/eventBus'
import { cloudState } from '@/services/muon-cloud/state'
import { hotendLimitReason } from '@/services/control/model'
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

/** How long after a filament send no other is sent, unless Klipper reports itself busy first. */
export const SEND_WINDOW_MS = 5000

/**
 * One guard for every filament button on the page (the Filament card, the
 * material panel, Quick actions), mid-print M600 included: from a send,
 * for 5 s, nothing else is sent, so a double click sends once.
 */
export const filamentSend = Vue.observable({ until: 0, now: Date.now() })

/**
 * Klipper is running a script with no print: idle_timeout says Printing.
 * Read directly: after a cancelled print, printer/getPrinterState says
 * "cancelled", never "busy", however busy Klipper is.
 */
export function scriptRunning (printer: { idle_timeout?: { state?: unknown }, print_stats?: { state?: unknown } }): boolean {
  const idle = String(printer.idle_timeout?.state ?? '').toLowerCase()
  const job = String(printer.print_stats?.state ?? '').toLowerCase()
  return idle === 'printing' && job !== 'printing' && job !== 'paused'
}

/**
 * Which printer, as which account, read from live state ($store, cloudState,
 * the router), never a component's computed values, which freeze once the
 * component is destroyed.
 */
export function liveTarget (vm: Vue): string {
  return JSON.stringify([
    vm.$store?.state?.config?.apiUrl ?? null,
    cloudState.activePrinterId ?? null,
    vm.$router?.currentRoute?.params?.printer ?? null,
    cloudState.account?.id ?? null
  ])
}

const destroyed = (vm: Vue) => !!(vm as unknown as { _isDestroyed?: boolean })._isDestroyed

/**
 * Change filament, Load and Unload, as every filament button runs them
 * (filament-change.ts, KAN-1700): idle Change filament sends nothing, Load
 * and Unload send at once, mid-print M600 asks first, and nothing is sent
 * while paused, busy, prompting or inside the send window.
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

  /** Why the material can't be heated for on this hotend, if it can't. */
  get filamentTooHot (): string | null {
    return hotendLimitReason(this.material?.name ?? this.loadedMaterial?.name, this.filamentTemp, this.extruderMaxTemp)
  }

  get filamentState (): FilamentState {
    return {
      printing: this.printerPrinting,
      paused: this.printerPaused,
      running: scriptRunning(this.$store.state.printer?.printer ?? {}) ||
        (this.printerState === 'busy' && !this.printerPrinting && !this.printerPaused),
      promptOpen: !!this.$store.state.console?.promptDialog?.open,
      sending: filamentSend.until > filamentSend.now
    }
  }

  get changePlan (): FilamentPlan { return changeFilamentPlan(this.filamentState, this.changeMacro, this.filamentTemp, this.filamentTooHot) }
  get loadPlan (): FilamentPlan { return loadUnloadPlan(this.filamentState, 'load', this.loadMacro, this.filamentTemp, this.filamentTooHot) }
  get unloadPlan (): FilamentPlan { return loadUnloadPlan(this.filamentState, 'unload', this.unloadMacro, this.filamentTemp, this.filamentTooHot) }

  /**
   * Sends the plan once. Mid-print M600 asks first, and after the answer the
   * plan is read again and the printer checked to be the same one: a
   * component destroyed meanwhile sends nothing. Resolves whether it sent.
   */
  async runFilamentPlan (which: 'change' | 'load' | 'unload'): Promise<boolean> {
    const read = () => which === 'change' ? this.changePlan : which === 'load' ? this.loadPlan : this.unloadPlan
    filamentSend.now = Date.now()
    const plan = read()
    if (!this.controlReady || !('command' in plan)) return false
    if ('confirm' in plan) {
      const target = liveTarget(this)
      const ok = await this.$confirm(plan.confirm.text, {
        title: plan.confirm.title,
        buttonTrueText: plan.confirm.yes,
        buttonFalseText: plan.confirm.no
      })
      if (!ok || destroyed(this) || target !== liveTarget(this)) return false
      filamentSend.now = Date.now()
      const now = read()
      if (!this.controlReady || !('command' in now) || now.command !== plan.command) return false
    }
    filamentSend.until = Date.now() + SEND_WINDOW_MS
    filamentSend.now = Date.now()
    setTimeout(() => { filamentSend.now = Date.now() }, SEND_WINDOW_MS + 100)
    this.sendGcode(plan.command)
    if (plan.kind === 'unload') EventBus.$emit(UNLOADING_NOTE, { type: 'primary', timeout: 8000 })
    if (plan.kind === 'load') EventBus.$emit(LOADING_NOTE, { type: 'primary', timeout: 8000 })
    return true
  }
}
