/**
 * Whether the PRINTER has the screen's embed build (its `/panel/`), asked over
 * the route Control is using for it (Vue.$httpClient: LAN, Bluetooth, relay),
 * not of the page's own origin. Hosted Control (control.muon3d.com) never
 * serves /panel/, so asking the page said "needs an update" on every printer
 * reached through it (KAN-3595).
 *
 * 'yes': the printer answered with the page. 'no': it answered, and has none
 * (404 and the like), the one case that is an old build. 'unknown': no answer
 * over this route (offline, a route that cannot carry it): no claim is made.
 */
export type PanelOnPrinter = 'yes' | 'no' | 'unknown'

export type PanelGet = (url: string) => Promise<{ status: number, headers?: Record<string, unknown> }>

export function classifyPanelResponse (response: { status: number, headers?: Record<string, unknown> }): PanelOnPrinter {
  const type = String(response.headers?.['content-type'] ?? '')
  if (response.status >= 200 && response.status < 300) return type.includes('text/html') ? 'yes' : 'no'
  if (response.status === 404 || response.status === 410) return 'no'
  return 'unknown'
}

export async function panelOnPrinter (get: PanelGet): Promise<PanelOnPrinter> {
  try {
    return classifyPanelResponse(await get('/panel/index.html'))
  } catch {
    return 'unknown'
  }
}
