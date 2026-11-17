import type { Component } from 'vue'
import StageTile from './tiles/StageTile.vue'
import JobTile from './tiles/JobTile.vue'
import FilamentTile from './tiles/FilamentTile.vue'
import HeaterTile from './tiles/HeaterTile.vue'
import FansTile from './tiles/FansTile.vue'
import PrintModeTile from './tiles/PrintModeTile.vue'
import MovementTile from './tiles/MovementTile.vue'
import JogTile from './tiles/JogTile.vue'
import PositionTile from './tiles/PositionTile.vue'
import ZOffsetTile from './tiles/ZOffsetTile.vue'
import MacrosTile from './tiles/MacrosTile.vue'
import GraphTile from './tiles/GraphTile.vue'
import EmbedTile from './tiles/EmbedTile.vue'
import LinkTile from './tiles/LinkTile.vue'
import { widgetMeta, widgetSize, type WidgetMeta } from '@/services/overview/widgets'

/**
 * One tile on the Overview, and where it sits by default. This list is every
 * widget there is and its starting layout; the sizes, categories and which are
 * on by default are the catalogue in services/overview/widgets. Edit mode keeps
 * each person's own order, sizes and hidden widgets per printer
 * (services/overview/layout) and checks them against this list: a widget named
 * there that is not here is dropped, an old id is mapped to the widget that
 * replaced it, and a widget here that it never heard of comes back hidden.
 */
export interface OverviewTileDef extends WidgetMeta {
  component: Component;
  props?: Record<string, unknown>;
  /** The default size, in columns of the 12 on a computer. */
  span: number;
  /** Rows tall on a computer at the default size. */
  rows: number;
  /** Columns wide of 12 on a tablet at the default size. */
  tablet: 6 | 12;
  /** Columns wide of 2 on a phone at the default size: 1 sits two by two, 2 is a row of its own. */
  phone: 1 | 2;
}

interface Drawn { component: Component; props?: Record<string, unknown> }

/** A card that already exists elsewhere, loaded when the widget is on the page. */
const embed = (tile: string, loader: () => Promise<unknown>): Drawn => ({ component: EmbedTile, props: { tile, loader } })

// TODO(care): Care needs a maintenance store; none exists, so it links to the Maintenance page.
// TODO(library): Print next becomes a LibraryShelf (library/v2/LibraryShelf) once the shelf can run without the Library page.
const drawn: Record<string, Drawn> = {
  stage: { component: StageTile },
  job: { component: JobTile },
  filament: { component: FilamentTile },
  hotend: { component: HeaterTile, props: { kind: 'hotend' } },
  bed: { component: HeaterTile, props: { kind: 'bed' } },
  mode: { component: PrintModeTile },
  zoffset: { component: ZOffsetTile },
  jog: { component: JogTile },
  position: { component: PositionTile },
  macros: { component: MacrosTile },
  graph: { component: GraphTile },
  trackpad: { component: MovementTile },
  fans: { component: FansTile },
  camera: embed('camera', () => import('@/components/widgets/camera/CameraCard.vue')),
  bedmesh: embed('bedmesh', () => import('@/components/widgets/bedmesh/BedMeshCard.vue')),
  console: embed('console', () => import('@/components/widgets/console/ConsoleCard.vue')),
  system: embed('system', () => import('@/components/widgets/system/SystemOverviewCard.vue')),
  care: { component: LinkTile, props: { tile: 'care', title: 'Care', icon: 'maintenance', note: 'Maintenance tasks and when they are due.', action: 'Open Maintenance', page: '/maintenance' } },
  library: { component: LinkTile, props: { tile: 'library', title: 'Print next', icon: 'library', note: 'Pick the next print from your Library.', action: 'Open Library', page: '/library' } }
}

/** In reading order, which is also the phone order. */
export const overviewTiles: OverviewTileDef[] = widgetMeta.map(meta => {
  const size = widgetSize(meta)
  return {
    ...meta,
    ...drawn[meta.id],
    span: size.span,
    rows: size.rows,
    tablet: size.span > 6 ? 12 : 6,
    phone: size.span <= 3 ? 1 : 2
  }
})
