export type AutoLoad = 'idle' | 'loading' | 'grabbed' | 'failed'

/**
 * The Z column (the stem the bed rides on), as z_power's present pin reads
 * it: fitted with its lever down, fitted with the lever up, or out. A
 * printer that can't sense it reads as locked: the model shows it fitted.
 */
export type ColumnState = 'locked' | 'unlocked' | 'absent'

/** Where the accessories were read from: Harry's combined state machine, or each sensor on its own. */
export type AccessorySource = 'm1_machine' | 'sensors'

export interface Accessories {
  plateOn: boolean;
  tubeAttached: boolean;
  tubeUnlocking: boolean;
  filamentLoaded: boolean;
  autoLoad: AutoLoad;
  spoolMounted: boolean;
  column: ColumnState;
  source: AccessorySource;
}

/** The fans as the printer reports them; shown only where the model has fan geometry. */
export interface FanFacts {
  /** The part fan (`fan.speed`), 0 to 1. */
  partSpeed: number;
  /** The hot-end fan's latched fault (m1_machine.conditions.fan_fault). */
  fault: boolean;
}

export interface PromptFacts {
  open: boolean;
  title?: string;
}

/**
 * STUB (KAN-526): Klipper and Moonraker publish no status object for the
 * insert flow. These prompt titles come from FILAMENT_INSERT_SENSORLESS_LOAD,
 * FILAMENT_INSERT_MODE_PROMPT and FILAMENT_INSERT_LOAD_FAILED_PROMPT in
 * Muon3D_Klipper core/M1/macros/filament.cfg. Replace this inference when the
 * firmware publishes an insert-flow status object.
 */
export function autoLoadFromPrompt (prompt: PromptFacts | null | undefined): AutoLoad {
  if (!prompt?.open) return 'idle'
  if (prompt.title === 'Filament Load') return 'loading'
  if (prompt.title === 'Load Mode') return 'grabbed'
  if (prompt.title === 'Filament Load Failed') return 'failed'
  return 'idle'
}

/** z_power's column band ('absent', 'unlocked', 'locked'; null before its first sample, anything else between bands). */
export function columnFrom (band: unknown): ColumnState {
  if (band === 'absent') return 'absent'
  // 'locked', 'reading' (no sample yet), 'none' (no sensing) and no z_power at all show the column fitted.
  if (band === undefined || band === null || band === 'locked' || band === 'reading' || band === 'none') return 'locked'
  // 'unlocked', and anything between bands (the lever part way): the column is there but not locked.
  return 'unlocked'
}

/**
 * The accessories from Harry's printer-state machine (Klipper's `m1_machine`,
 * klippy/extras/m1_machine.py): one status that already combines z_power, the
 * bed removal detector, the toolhead MCU and the filament switch, so the
 * model shows what the printer itself has decided. A condition it reports as
 * 'none' (the printer lacks that sensor) falls back to the sensor read.
 */
function fromMachine (
  conditions: Record<string, any>,
  sensors: Accessories
): Accessories {
  const plate = conditions.plate as string | undefined
  const toolhead = conditions.toolhead as string | undefined
  const filament = conditions.filament as string | undefined
  const column = conditions.column as string | undefined
  // 'unknown' is the detector's first window of readings: the plate is shown on until it reads absent.
  const plateOn = plate === 'absent' ? false : plate === 'present' || plate === 'unknown' ? true : sensors.plateOn
  const tubeAttached = toolhead === 'disconnected' ? false : toolhead === 'connected' ? true : sensors.tubeAttached
  const filamentLoaded = filament === 'present' ? true : filament === 'absent' ? false : sensors.filamentLoaded
  return {
    ...sensors,
    plateOn,
    tubeAttached,
    // m1_machine doesn't carry the unlock button; it is read on its own.
    tubeUnlocking: tubeAttached && sensors.tubeUnlocking,
    filamentLoaded,
    column: column === undefined || column === 'none' ? sensors.column : columnFrom(column),
    source: 'm1_machine'
  }
}

/**
 * The accessories the model shows. From `m1_machine` when the printer runs
 * it; otherwise (printers on Klipper main today) from each sensor's own
 * object, as before.
 *
 * STUB (KAN-526): There is no sensor on the spool holder, so the spool is
 * assumed mounted until the firmware publishes a spool status object.
 */
export function accessoriesFrom (
  printer: Record<string, any>,
  prompt: PromptFacts | null | undefined
): Accessories {
  const sensors = sensorAccessories(printer, prompt)
  const conditions = printer.m1_machine?.conditions
  return conditions && typeof conditions === 'object' ? fromMachine(conditions, sensors) : sensors
}

/** The fans: the part fan's speed, and the hot-end fan fault m1_machine latches (false without it). */
export function fansFrom (printer: Record<string, any>): FanFacts {
  const speed = Number(printer.fan?.speed)
  return {
    partSpeed: Number.isFinite(speed) ? Math.min(1, Math.max(0, speed)) : 0,
    fault: printer.m1_machine?.conditions?.fan_fault === true
  }
}

/** Each sensor's own object: what the model went by before m1_machine. */
function sensorAccessories (
  printer: Record<string, any>,
  prompt: PromptFacts | null | undefined
): Accessories {
  const bed = printer.bed_removal_detector
  const toolheadMcu = printer['mcu toolhead']
  const unlockButton = printer['gcode_button toolhead_umbilical_unlock_button']
  const filamentSensor = printer['filament_switch_sensor filament_sensor_toolhead']

  // A failed bed thermistor reads as a removed plate (KAN-112).
  const plateOn = bed ? !bed.bedRemoved : true
  const tubeAttached = toolheadMcu ? !toolheadMcu.non_critical_disconnected : true
  const tubeUnlocking = tubeAttached && unlockButton?.state === 'PRESSED'
  // KAN-232: gpio3 can float and read "detected" on some units.
  const filamentLoaded = filamentSensor?.enabled !== false && !!filamentSensor?.filament_detected

  return {
    plateOn,
    tubeAttached,
    tubeUnlocking,
    filamentLoaded,
    autoLoad: autoLoadFromPrompt(prompt),
    spoolMounted: true,
    // z_power (Klipper's Z column and bed power path) where the printer has it; else fitted.
    column: columnFrom(printer.z_power?.z),
    source: 'sensors'
  }
}

/**
 * The accessories once the printer's first status has arrived; null before.
 * Until then the store has no sensor objects, so the filament reads as
 * unloaded and the plate as on. Taking that as the first state turned the
 * real status into a change: a page opened with filament in played a load,
 * and one opened with the plate off played a removal.
 */
export function liveAccessories (
  printer: Record<string, any>,
  prompt: PromptFacts | null | undefined,
  statusArrived: boolean
): Accessories | null {
  return statusArrived ? accessoriesFrom(printer, prompt) : null
}

export function sameAccessories (a: Accessories | null, b: Accessories): boolean {
  return a !== null &&
    a.plateOn === b.plateOn &&
    a.tubeAttached === b.tubeAttached &&
    a.tubeUnlocking === b.tubeUnlocking &&
    a.filamentLoaded === b.filamentLoaded &&
    a.autoLoad === b.autoLoad &&
    a.spoolMounted === b.spoolMounted &&
    a.column === b.column &&
    a.source === b.source
}
