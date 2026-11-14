/**
 * The icon a quick command wears: the app bar's Quick actions use the frame's
 * line icons (bolt, flame, snow, spool, mesh, motorsOff, home), so a macro is
 * given the one that says what it does, from its name. Anything it does not
 * recognise gets the bolt, the Quick actions' own icon. Pure, so the Quick
 * commands tile and the tests share it.
 */
const RULES: Array<[RegExp, string]> = [
  [/(^|_)(UNLOAD|LOAD|FILAMENT|SPOOL|M600|M701|M702|CUT)(_|$)/, 'spool'],
  [/(^|_)(PURGE|PRIME|EXTRUDE|RETRACT|NOZZLE|OOZE)(_|$)/, 'nozzle'],
  [/(^|_)(PREHEAT|HEAT|HEATUP|WARM|SOAK)(_|$)/, 'flame'],
  [/(^|_)(COOL|COOLDOWN|COLD|OFF_HEAT)(_|$)/, 'snow'],
  [/(^|_)(LEVEL|MESH|BED|PROBE|TILT|SCREWS|CALIBRATE|CALIBRATION|Z_OFFSET|ZOFFSET)(_|$)|CALIBRAT/, 'mesh'],
  [/(^|_)(CLEAN|WIPE|BRUSH|DOCK|MAINTENANCE|PID|SHAPER|RESONANCE)(_|$)/, 'maintenance'],
  [/(^|_)(HOME|HOMING|G28|PARK|CENTER|CENTRE|STOW)(_|$)/, 'home'],
  [/(^|_)(FAN|FANS)(_|$)/, 'fan'],
  [/(^|_)(LED|LEDS|LIGHT|LIGHTS|LAMP|NEOPIXEL|CASELIGHT)(_|$)/, 'bulb'],
  [/(^|_)(MOTORS?|STEPPERS?|DISABLE)(_|$)|^M84$/, 'motorsOff'],
  [/(^|_)(RESTART|REBOOT|RESET)(_|$)/, 'refresh'],
  [/(^|_)(CAMERA|TIMELAPSE)(_|$)/, 'camera']
]

export const MACRO_FALLBACK_ICON = 'bolt'

export function macroIcon (name: string): string {
  const upper = (name || '').toUpperCase()
  return RULES.find(([re]) => re.test(upper))?.[1] ?? MACRO_FALLBACK_ICON
}
