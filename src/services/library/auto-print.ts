/**
 * The site's Print links (`/library?view=discover&print=<id>`) open that
 * model's page and, signed in with a printable file, Print on… once. "Once"
 * outlives the page (a reload, Back): the ids already handled are kept for
 * the browser tab, so the address can keep naming the model without the
 * chooser opening again.
 */
const KEY = 'muon.library.autoPrinted'

function handled (): string[] {
  try {
    const list = JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Print on… already opened for this model from its address, in this tab. */
export function autoPrintHandled (id: string): boolean {
  return handled().includes(id)
}

export function markAutoPrintHandled (id: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...handled().filter(other => other !== id), id].slice(-20)))
  } catch { /* storage blocked: the page's own flag still stops a second open */ }
}
