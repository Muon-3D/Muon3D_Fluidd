import type { Component } from 'vue'
import ControlMove from './ControlMove.vue'
import ControlHeat from './ControlHeat.vue'
import ControlSpeed from './ControlSpeed.vue'
import ControlFans from './ControlFans.vue'
import ControlFilament from './ControlFilament.vue'
import ControlZOffset from './ControlZOffset.vue'
import ControlMacros from './ControlMacros.vue'

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
  { id: 'move', title: 'Move', component: ControlMove, span: 7, rows: 2, tablet: 12, phoneProp: true },
  { id: 'heat', title: 'Heaters', component: ControlHeat, span: 5, tablet: 12, phoneProp: true },
  { id: 'speed', title: 'Speed and flow', component: ControlSpeed, span: 5, tablet: 12 },
  { id: 'fans', title: 'Fans and lights', component: ControlFans, span: 4, tablet: 6, phoneProp: true },
  { id: 'filament', title: 'Filament', component: ControlFilament, span: 4, tablet: 6, phoneProp: true },
  { id: 'zoffset', title: 'Z offset', component: ControlZOffset, span: 4, tablet: 12 },
  { id: 'macros', title: 'Macros', component: ControlMacros, span: 12, tablet: 12 }
]
