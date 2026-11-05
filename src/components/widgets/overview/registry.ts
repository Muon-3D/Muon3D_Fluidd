import type { Component } from 'vue'
import StageTile from './tiles/StageTile.vue'
import JobTile from './tiles/JobTile.vue'
import FilamentTile from './tiles/FilamentTile.vue'
import HeaterTile from './tiles/HeaterTile.vue'
import FansTile from './tiles/FansTile.vue'
import SpeedTile from './tiles/SpeedTile.vue'
import JogTile from './tiles/JogTile.vue'
import PositionTile from './tiles/PositionTile.vue'
import ZOffsetTile from './tiles/ZOffsetTile.vue'
import MacrosTile from './tiles/MacrosTile.vue'
import GraphTile from './tiles/GraphTile.vue'

/**
 * One tile on the Overview, and where it sits by default. This list is the
 * whole layout: the page only draws it. A later Edit mode can keep a saved
 * copy of `span`, `rows` and the order per person and printer and read it
 * here instead, without touching a tile.
 */
export interface OverviewTileDef {
  /** Stable name; what a saved layout would call it. */
  id: string;
  title: string;
  component: Component;
  props?: Record<string, unknown>;
  /** Columns wide of the 12 on a computer (1100 px and up). */
  span: number;
  /** Rows tall on a computer; 1 when not said. */
  rows?: number;
  /** Columns wide of 12 on a tablet. */
  tablet: 6 | 12;
  /** Columns wide of 2 on a phone: 1 sits two by two, 2 is a row of its own. */
  phone: 1 | 2;
}

/** In reading order, which is also the phone order. */
export const overviewTiles: OverviewTileDef[] = [
  { id: 'stage', title: 'Printer view', component: StageTile, span: 7, rows: 2, tablet: 12, phone: 2 },
  { id: 'job', title: 'Print job', component: JobTile, span: 5, tablet: 12, phone: 2 },
  { id: 'filament', title: 'Filament', component: FilamentTile, span: 5, tablet: 12, phone: 2 },
  { id: 'hotend', title: 'Hotend', component: HeaterTile, props: { kind: 'hotend' }, span: 3, tablet: 6, phone: 1 },
  { id: 'bed', title: 'Bed', component: HeaterTile, props: { kind: 'bed' }, span: 3, tablet: 6, phone: 1 },
  { id: 'fans', title: 'Fans', component: FansTile, span: 3, tablet: 6, phone: 1 },
  { id: 'speed', title: 'Speed / flow', component: SpeedTile, span: 3, tablet: 6, phone: 1 },
  { id: 'jog', title: 'Jog', component: JogTile, span: 4, rows: 2, tablet: 12, phone: 2 },
  { id: 'position', title: 'Position', component: PositionTile, span: 4, tablet: 6, phone: 2 },
  { id: 'zoffset', title: 'Z offset', component: ZOffsetTile, span: 4, tablet: 6, phone: 2 },
  { id: 'macros', title: 'Macros', component: MacrosTile, span: 8, tablet: 12, phone: 2 },
  { id: 'graph', title: 'Temperatures', component: GraphTile, span: 12, tablet: 12, phone: 2 }
]
