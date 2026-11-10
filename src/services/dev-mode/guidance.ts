/**
 * What Settings > Developer mode says it unlocks. Static copy and links
 * only: it decides nothing and sends nothing; the device is the authority.
 */

/** What developer mode unlocks, each with the Settings page where its locked row lives. */
export interface Unlock {
  id: string;
  title: string;
  where: string;
  /** A route path under the printer, with an optional #anchor. */
  to: string;
}

export const UNLOCKS: Unlock[] = [
  { id: 'config', title: 'Edit the configuration files', where: 'Your own copy of printer.cfg and the rest · Files and editor', to: '/configure' },
  { id: 'macros', title: 'Edit what macros do', where: 'Macros', to: '/settings#macros' },
  { id: 'materials', title: 'G-code on material presets', where: 'Materials', to: '/settings#presets' },
  { id: 'moving', title: "Reverse X or Y, plate speed, speeds past the M1's limits, move without homing", where: 'Moving and extruding', to: '/settings#toolhead' },
  { id: 'timelapse', title: 'Custom timelapse parking', where: 'Timelapse', to: '/settings#timelapse' },
  { id: 'console', title: 'Moving or homing from the console while printing', where: 'Console', to: '/settings#console' },
  { id: 'updates', title: 'Update Klipper, Moonraker or packages on their own', where: 'Updates', to: '/settings#versions' },
  { id: 'older', title: 'The key for older tools, when it would let them edit macros or config', where: 'People and access · For older tools', to: '/settings#access' }
]
