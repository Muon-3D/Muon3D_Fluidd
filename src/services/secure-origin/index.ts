/**
 * The printer's secure address (KAN-2198, KAN-1873).
 *
 * A printer that holds a valid certificate serves this same page over HTTPS
 * under its own name, `<label>.<zone>`, and says so in a small file on its
 * plain-HTTP address. This module, on a plain-HTTP printer page only, reads
 * that file, proves from THIS browser that the secure address really
 * answers, and only then offers to move there.
 *
 * The proof is the point. The printer cannot know whether this browser can
 * resolve and trust the name: some home routers refuse public names that
 * point at private addresses, the certificate may have lapsed, the phone's
 * clock may be wrong. So nothing here redirects blindly, the printer never
 * redirects at all, and when no probe succeeds the page simply stays where
 * it is. A printer is never harder to reach because of this.
 */

/**
 * The DNS zones printer names live under. A name anywhere else is ignored.
 * Only zones Muon3D controls: a zone anyone else could register would let a
 * spoofed HTTP page send people to a site with a valid certificate.
 *
 * A build setting, `VITE_PRINTER_NAME_ZONE`, so the zone moves in one place
 * when decision D-115 picks a separate domain (the console refuses a zone
 * under muon3d.com until then). Only ever a domain registered to Muon3D.
 */
export const PRINTER_NAME_ZONES: readonly string[] = [printerNameZone(import.meta.env.VITE_PRINTER_NAME_ZONE)]

/** The build setting as a zone: DNS labels ending in letters, else the default. */
export function printerNameZone (setting: unknown): string {
  const zone = String(setting ?? '').trim().toLowerCase()
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(zone) ? zone : 'lan.muon3d.com'
}

/** What the printer's probe location answers, and nothing else. */
export const PROBE_MARKER = 'muon3d-secure-origin-1'

const DESCRIPTION_PATH = '/muon/secure-origin.json'
const PROBE_PATH = '/muon/secure-probe.txt'
const PROBE_TIMEOUT_MS = 1500
/** A remembered switch happens by itself only if the proof came this soon after load. */
export const AUTO_SWITCH_WITHIN_MS = 3000
const AUTO_KEY = 'muon.secureOrigin.auto'
const LABEL = '[a-z2-7]{20}'

type PageLocation = Pick<Location, 'protocol' | 'hostname'>

/** Whether this page is one that could have a secure twin: plain HTTP, not loopback, not the hotspot. */
export function couldHaveSecureAddress (location: PageLocation = globalThis.location): boolean {
  if (location.protocol !== 'http:') return false
  if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return false
  // The hotspot has no internet and its address is the same on every printer.
  return location.hostname !== '10.42.0.1'
}

/** The stable name in `name`, if it is a printer name under a zone we know. */
export function printerName (name: unknown): string | null {
  if (typeof name !== 'string') return null
  const lower = name.toLowerCase()
  for (const zone of PRINTER_NAME_ZONES) {
    if (new RegExp(`^${LABEL}\\.${zone.replace(/\./g, '\\.')}$`).test(lower)) return lower
  }
  return null
}

/**
 * The secure origins worth trying, best first: the stable name, then the name
 * with this page's own address written into it, which needs no DNS record to
 * be current.
 */
export function candidateOrigins (name: string, pageHost: string): string[] {
  const out = [`https://${name}`]
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(pageHost)
  if (ipv4 && ipv4.slice(1).every(part => Number(part) <= 255)) {
    out.push(`https://${ipv4.slice(1).map(Number).join('-')}.${name}`)
  }
  return out
}

/**
 * The status and body of `url`, or a throw if either takes longer than `ms`.
 * The limit covers the body as well: a server that sends headers and then
 * stalls must not hold the page.
 */
async function fetchText (url: string, ms: number): Promise<{ ok: boolean, text: string }> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error('timed out'))
    }, ms)
  })
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal })
        return { ok: response.ok, text: await response.text() }
      })(),
      late
    ])
  } finally {
    clearTimeout(timer)
  }
}

/** Whether `origin` answers as a Muon printer's secure address, from this browser, now. */
export async function probe (origin: string): Promise<boolean> {
  try {
    const response = await fetchText(`${origin}${PROBE_PATH}`, PROBE_TIMEOUT_MS)
    if (!response.ok) return false
    return response.text.trim() === PROBE_MARKER
  } catch {
    // No such name here, no route, a certificate the browser refuses, or too slow.
    return false
  }
}

/**
 * The secure origin of the printer serving this page, proven to work from
 * this browser, or null. Null is the normal answer for most pages.
 */
export async function findSecureOrigin (location: Pick<Location, 'protocol' | 'hostname'> = globalThis.location, now = Date.now()): Promise<string | null> {
  if (!couldHaveSecureAddress(location)) return null
  let description: { version?: unknown, name?: unknown, not_after?: unknown }
  try {
    const response = await fetchText(DESCRIPTION_PATH, PROBE_TIMEOUT_MS)
    if (!response.ok) return null
    description = JSON.parse(response.text)
  } catch {
    return null
  }
  // The file comes over plain HTTP, so anyone on the network could have
  // written it. It is trusted for one thing only: which name to TRY. The name
  // must be a printer name under our zone, and the destination must then
  // prove itself with a certificate for that name, which only the printer has.
  const name = printerName(description?.name)
  if (description?.version !== 1 || !name) return null
  if (typeof description.not_after === 'number' && description.not_after * 1000 <= now) return null
  for (const origin of candidateOrigins(name, location.hostname)) {
    if (await probe(origin)) return origin
  }
  return null
}

/** The same page on the secure origin. */
export function secureUrl (origin: string, location: Pick<Location, 'pathname' | 'search' | 'hash'> = globalThis.location): string {
  return `${origin}${location.pathname}${location.search}${location.hash}`
}

/** Whether this browser moves to the secure address by itself. On after the first switch; a person can turn it off. */
export function switchesAutomatically (): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) === '1'
  } catch {
    return false
  }
}

export function setSwitchesAutomatically (on: boolean) {
  try {
    if (on) localStorage.setItem(AUTO_KEY, '1')
    else localStorage.setItem(AUTO_KEY, '0')
  } catch { /* no storage: ask each time */ }
}

/**
 * Whether this address asks to stay on plain HTTP: `secure=off` in the query
 * or in the hash route's query. The way back for anyone the automatic switch
 * would otherwise take to a secure address that does not work for them.
 */
export function asksToStay (location: Pick<Location, 'search' | 'hash'> = globalThis.location): boolean {
  const query = (text: string) => new URLSearchParams(text.slice(text.indexOf('?') + 1))
  const has = (text: string) => text.includes('?') && query(text).get('secure') === 'off'
  return has(location.search) || has(location.hash)
}

/** True once a person has said "stay here" on this browser: do not offer again this visit or later. */
export function declinedSwitch (): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) === '0'
  } catch {
    return false
  }
}
