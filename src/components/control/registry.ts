import type { Component } from 'vue'
import ControlMove from './ControlMove.vue'
import ControlHeat from './ControlHeat.vue'
import ControlPrintMode from './ControlPrintMode.vue'
import ControlFans from './ControlFans.vue'
import ControlFilament from './ControlFilament.vue'
import ControlQuickCommands from './ControlQuickCommands.vue'

/**
 * One tile of the Control page, and where it sits by default (D3 tiles, the
 * v3 mockup). Edit layout keeps each person's own order, sizes and hidden
 * tiles per printer, checked against this list (services/overview/layout):
 * a tile a saved layout names that is not here is dropped, and a tile here
 * that it never heard of comes back hidden.
 */
export interface ControlTileDef {
  /** Stable name; what a saved layout calls it. Never reuse or rename one. */
  id: string
  title: string
  component: Component
  /** Columns wide of the 12 on a computer. */
  span: number
  /** Rows tall on a computer; 1 when not said. */
  rows?: number
  /** Columns wide of 12 on a tablet. */
  tablet: 6 | 12
  /** Whether the tile takes the `phone` prop (its own phone layout). */
  phoneProp?: boolean
}

/** In reading order, which is also the phone order. */
export const controlTiles: ControlTileDef[] = [
  // v4: Movement takes in the position, Go to and homing at 8 wide; Print
  // mode replaces Speed and flow, Quick commands replace Macros (same ids, so
  // saved layouts keep them). The Z offset tile is gone: on a printer that
  // isn't a Muon, Z offset is in Movement's ··· menu.
  { id: 'move', title: 'Movement', component: ControlMove, span: 8, rows: 2, tablet: 12, phoneProp: true },
  { id: 'heat', title: 'Heaters', component: ControlHeat, span: 4, tablet: 12, phoneProp: true },
  { id: 'speed', title: 'Print mode', component: ControlPrintMode, span: 4, tablet: 12 },
  { id: 'fans', title: 'Fans and lights', component: ControlFans, span: 4, tablet: 6, phoneProp: true },
  { id: 'filament', title: 'Filament', component: ControlFilament, span: 4, tablet: 6, phoneProp: true },
  { id: 'macros', title: 'Quick commands', component: ControlQuickCommands, span: 4, tablet: 12 }
]
