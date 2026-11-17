import {
  BED_POWER_FAULT,
  BED_POWER_SHORT,
  FAN_FAULT,
  HOTEND_FAILED,
  unknownFault
} from './strings'

/**
 * The printer's machine faults (KAN-3418), from Klipper's `m1_machine`
 * status object (Muon3D_Klipper, klippy/extras/m1_machine.py):
 *   faults: ['bed_power_fault', 'fan_fault', 'hotend_failed']   (bare codes)
 *   conditions.bed_power_reason: the plain sentence for the bed power fault
 * A printer without the object has no faults here: nothing shows.
 */
export interface MachineFault {
  code: string
  /** The words, the same as the panel's. */
  text: string
  /** A plain reason the printer gave, shown under the words. */
  detail: string
  /** Control may offer Reset (Z_POWER_RESET) for this one. */
  canReset: boolean
}

export const BED_POWER_CODE = 'bed_power_fault'
export const RESET_GCODE = 'Z_POWER_RESET'

type Json = Record<string, unknown>
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The fault codes the printer reports. A list of codes, or an object keyed by code (a true value). */
export function faultCodes (status: unknown): string[] {
  const machine = isObject(status) ? status.m1_machine : undefined
  if (!isObject(machine)) return []
  const faults = machine.faults
  if (Array.isArray(faults)) return faults.filter((f): f is string => typeof f === 'string' && f !== '')
  if (isObject(faults)) return Object.keys(faults).filter(k => faults[k])
  return []
}

/**
 * Engineering text is never shown: amps, PGOOD, eFuse, G-code names. Only a
 * plain sentence from the printer is used as the detail line.
 */
const ENGINEERING = /PGOOD|eFuse|Z_POWER|overcurrent|\d\s?(m?A|V|W)\b/i

export function plainReason (status: unknown): string {
  const machine = isObject(status) ? status.m1_machine : undefined
  const conditions = isObject(machine) && isObject(machine.conditions) ? machine.conditions : {}
  const reason = typeof conditions.bed_power_reason === 'string' ? conditions.bed_power_reason.trim() : ''
  return reason && !ENGINEERING.test(reason) ? reason : ''
}

const WORDS: Record<string, string> = {
  [BED_POWER_CODE]: BED_POWER_FAULT,
  fan_fault: FAN_FAULT,
  hotend_failed: HOTEND_FAILED
}

/** Every fault the printer reports now, in words. Bed power comes first. */
export function machineFaults (status: unknown): MachineFault[] {
  const reason = plainReason(status)
  const list = faultCodes(status).map((code): MachineFault => ({
    code,
    text: WORDS[code] ?? unknownFault(code),
    detail: code === BED_POWER_CODE ? reason : '',
    canReset: code === BED_POWER_CODE
  }))
  return list.sort((a, b) => Number(b.canReset) - Number(a.canReset))
}

/** The short words for a printer's card in the list: the first fault, or null. */
export function faultSummary (codes: readonly string[] | undefined): string | null {
  if (!codes || codes.length === 0) return null
  const first = codes.includes(BED_POWER_CODE) ? BED_POWER_CODE : codes[0]
  return first === BED_POWER_CODE ? BED_POWER_SHORT : (WORDS[first] ?? unknownFault(first))
}

/**
 * Whether Reset may be offered: the printer is not printing or paused (Klipper
 * refuses Z_POWER_RESET during a print too), and a bed power fault is there.
 */
export function resetAvailable (faults: MachineFault[], printerState: string): boolean {
  return !printRunning(printerState) && faults.some(f => f.canReset)
}

/** A print is running or paused: Klipper refuses Z_POWER_RESET then. */
export function printRunning (printerState: string): boolean {
  const s = printerState.toLowerCase()
  return s === 'printing' || s === 'paused'
}

/**
 * Tells a fault that came back after Reset from one that was never cleared.
 * After Reset, a fault that clears and returns, or that is still there after
 * `WAIT_MS`, is a re-latch: the cause is still there, so Reset is not offered
 * again (no loop) until the fault has been gone for `CALM_MS`.
 */
export const WAIT_MS = 3000
export const CALM_MS = 5000

export class RelatchTracker {
  relatched = false
  private sentAt: number | null = null
  private sawClear = false
  private present = false
  private absentSince: number | null = null

  resetSent (now: number): void {
    this.sentAt = now
    this.sawClear = false
  }

  observe (present: boolean, now: number): void {
    this.present = present
    if (present) {
      this.absentSince = null
      if (this.sentAt !== null && this.sawClear) {
        this.relatched = true
        this.sentAt = null
      }
      return
    }
    if (this.sentAt !== null) this.sawClear = true
    this.absentSince ??= now
    if (this.sentAt !== null && now - this.sentAt >= WAIT_MS) this.sentAt = null
    if (this.relatched && now - this.absentSince >= CALM_MS) this.relatched = false
  }

  tick (now: number): void {
    if (this.sentAt !== null && !this.sawClear && this.present && now - this.sentAt >= WAIT_MS) {
      this.relatched = true
      this.sentAt = null
    }
    if (!this.present && this.absentSince !== null) this.observe(false, now)
  }
}
