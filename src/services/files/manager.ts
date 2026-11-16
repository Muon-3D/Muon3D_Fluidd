/** From this many rows a folder is drawn a window at a time; fewer are all drawn. */
export const WINDOW_FROM = 60

export interface RowWindow {
  /** First row drawn, and one past the last. */
  start: number
  end: number
  /** Height of the rows above and below the window, so the scrollbar stays true. */
  padTop: number
  padBottom: number
  windowed: boolean
}

/**
 * Which rows of a long, fixed-height list to draw for a scroll position.
 * A short list is drawn whole.
 */
export function windowRows ({ total, scrollTop, viewport, rowHeight, overscan = 8 }: {
  total: number
  scrollTop: number
  viewport: number
  rowHeight: number
  overscan?: number
}): RowWindow {
  if (total < WINDOW_FROM || rowHeight <= 0) return { start: 0, end: total, padTop: 0, padBottom: 0, windowed: false }
  const first = Math.max(0, Math.min(total - 1, Math.floor(scrollTop / rowHeight)))
  const start = Math.max(0, first - overscan)
  const end = Math.min(total, first + Math.ceil(viewport / rowHeight) + overscan)
  return { start, end, padTop: start * rowHeight, padBottom: (total - end) * rowHeight, windowed: true }
}

export interface Crumb { label: string, path: string }

/** The root, then each folder below it, with the path that opens it (without the root). */
export function pathCrumbs (root: string, path: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: root, path: '' }]
  let at = ''
  for (const part of path.split('/').filter(Boolean)) {
    at = at ? `${at}/${part}` : part
    crumbs.push({ label: part, path: at })
  }
  return crumbs
}
