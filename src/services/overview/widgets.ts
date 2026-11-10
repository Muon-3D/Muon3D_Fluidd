import type { SizeVariant } from './layout'

/**
 * The Overview's widget catalogue, as plain data: what each widget is called,
 * where it sits in the Add widget sheet, the sizes it offers and whether it is
 * on the page by default. The components that draw them are matched to these
 * in components/widgets/overview/registry. Ids are what a saved layout calls a
 * widget: never reuse or rename one; a widget that replaces another lists the
 * old id in `legacy` so saved layouts follow it.
 */
export type WidgetCategory = 'Printer' | 'Print' | 'Temperature' | 'Motion' | 'Tools' | 'Library'
export const widgetCategories: WidgetCategory[] = ['Printer', 'Print', 'Temperature', 'Motion', 'Tools', 'Library']

export interface WidgetMeta {
  id: string;
  title: string;
  category: WidgetCategory;
  /** One line for the Add widget sheet. */
  blurb: string;
  /** S is 3 columns, M is 4 to 6, L is 8 to 12 or two rows. A widget may leave one out. */
  sizes: SizeVariant[];
  /** The size it has when added, and in the default layout. */
  size: 'S' | 'M' | 'L';
  defaultOn: boolean;
  /** Saved ids that now mean this widget. */
  legacy?: string[];
}

const S = (rows = 1, span = 3): SizeVariant => ({ key: 'S', span, rows })
const M = (span: number, rows = 1): SizeVariant => ({ key: 'M', span, rows })
const L = (span: number, rows = 1): SizeVariant => ({ key: 'L', span, rows })

/** In reading order, which is also the phone order. The default layout is the widgets with `defaultOn`, in this order. */
export const widgetMeta: WidgetMeta[] = [
  // The current Overview: the printer on the left, the job and filament stacked on its right.
  { id: 'stage', title: 'Printer view', category: 'Printer', blurb: 'The live 3D view of the printer. It needs both rows, so it has no S.', sizes: [M(8, 2), L(12, 2)], size: 'M', defaultOn: true },
  { id: 'job', title: 'Print job', category: 'Print', blurb: 'What is printing, or last printed, with time left.', sizes: [S(), M(4), L(4, 2)], size: 'M', defaultOn: true },
  { id: 'filament', title: 'Filament', category: 'Print', blurb: 'The spool in the printer, by type and colour.', sizes: [S(), M(4), L(4, 2)], size: 'M', defaultOn: true },
  // The row of four under them.
  { id: 'hotend', title: 'Hotend', category: 'Temperature', blurb: 'Hotend temperature and target.', sizes: [S(), M(6)], size: 'S', defaultOn: true },
  { id: 'bed', title: 'Bed', category: 'Temperature', blurb: 'Bed temperature and target.', sizes: [S(), M(6)], size: 'S', defaultOn: true },
  { id: 'mode', title: 'Print mode', category: 'Print', blurb: 'Quiet, Normal or Turbo in one tap.', sizes: [S(), M(6)], size: 'M', defaultOn: true, legacy: ['speed'] },
  // The fourth tile: part cooling is the fan people reach for most, and it is on every printer.
  { id: 'fans', title: 'Fans', category: 'Tools', blurb: 'Part cooling and the other fans.', sizes: [S(), M(4), L(6, 2)], size: 'S', defaultOn: false },
  // Movement (the trackpad, live drag), then Jog and Position as separate widgets.
  { id: 'trackpad', title: 'Movement', category: 'Motion', blurb: 'The trackpad: drag to move the head, with the no-go zones.', sizes: [S(2), M(8, 2), L(12, 2)], size: 'M', defaultOn: true },
  { id: 'jog', title: 'Jog', category: 'Motion', blurb: 'Buttons to move the head and home it.', sizes: [S(2), M(4, 2), L(6, 2)], size: 'M', defaultOn: true },
  { id: 'position', title: 'Position', category: 'Motion', blurb: 'Where the head is, and whether it is homed.', sizes: [S(), M(4), L(8)], size: 'M', defaultOn: true },
  { id: 'macros', title: 'Quick commands', category: 'Tools', blurb: 'The commands you press most.', sizes: [S(), M(6), L(8)], size: 'L', defaultOn: true },
  { id: 'graph', title: 'Temperatures', category: 'Temperature', blurb: 'The temperature graph. Hotend, bed and chamber show to begin with.', sizes: [S(), M(6), L(12)], size: 'L', defaultOn: true },
  // Off until added.
  // Never on a Muon printer (see muonHidden); in Add widget on the others.
  { id: 'zoffset', title: 'Z offset', category: 'Print', blurb: 'The live Z offset, to nudge the first layer.', sizes: [S(), M(4)], size: 'S', defaultOn: false },
  { id: 'camera', title: 'Camera', category: 'Printer', blurb: 'The webcam.', sizes: [S(), M(6, 2), L(12, 2)], size: 'M', defaultOn: false },
  { id: 'bedmesh', title: 'Bed mesh', category: 'Print', blurb: 'The bed mesh, as numbers.', sizes: [S(), M(6, 2), L(8, 2)], size: 'M', defaultOn: false },
  { id: 'console', title: 'Console', category: 'Tools', blurb: 'The last lines of the console.', sizes: [M(6, 2), L(12, 2)], size: 'M', defaultOn: false },
  { id: 'system', title: 'Power and system', category: 'Tools', blurb: 'CPU, memory, disk and uptime.', sizes: [S(), M(4, 2), L(6, 2)], size: 'M', defaultOn: false },
  { id: 'care', title: 'Care', category: 'Tools', blurb: 'The next maintenance task due.', sizes: [S(), M(4), L(6, 2)], size: 'M', defaultOn: false },
  { id: 'library', title: 'Print next', category: 'Library', blurb: 'A Library shelf, so an idle printer always offers its next print.', sizes: [M(6), L(12)], size: 'L', defaultOn: false }
]

export const widgetSize = (meta: WidgetMeta): SizeVariant => meta.sizes.find(s => s.key === meta.size) ?? meta.sizes[0]

/** Widgets matching what was typed in the sheet (title, blurb or category) and the category chosen. */
export function searchWidgets (list: WidgetMeta[], query: string, category: WidgetCategory | null): WidgetMeta[] {
  const q = query.trim().toLowerCase()
  return list.filter(w => (!category || w.category === category) && (!q || `${w.title} ${w.blurb} ${w.category}`.toLowerCase().includes(q)))
}

/** Widgets a Muon printer never shows: not in the default layout, not in Add widget, dropped from saved layouts. */
export const muonHidden: string[] = ['zoffset']

/**
 * Whether the Overview treats this printer as a Muon one, from the
 * `server/isMuonPrinter` getter. While it is not known yet (null) it counts as
 * Muon, so Z offset never flashes up on one.
 */
export const treatAsMuon = (isMuon: boolean | null | undefined): boolean => isMuon !== false

/** The widgets that exist on this printer. */
export function widgetsFor<T extends { id: string }> (list: T[], muon: boolean): T[] {
  return muon ? list.filter(w => !muonHidden.includes(w.id)) : list
}
