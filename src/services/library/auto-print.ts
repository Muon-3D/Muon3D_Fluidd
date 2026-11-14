/**
 * The site's Print links (`/library?view=discover&print=<id>`) open that
 * model's page and, signed in with a printable file, Print on… once. "Once"
 * is kept on the history entry the link arrived on: a reload or Back keeps
 * the entry's state, so it does not open again, while a fresh click from the
 * site makes a new entry and opens it again. Vue Router's own state keys are
 * kept.
 */
const KEY = 'autoPrinted'

/** Print on… already handled for this model on the current history entry. */
export function autoPrintHandled (id: string): boolean {
  return (history.state as Record<string, unknown> | null)?.[KEY] === id
}

export function markAutoPrintHandled (id: string): void {
  try {
    history.replaceState({ ...(history.state as Record<string, unknown> | null), [KEY]: id }, '')
  } catch { /* the page's own state still stops a second open */ }
}
