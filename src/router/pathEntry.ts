// Fluidd routes by hash, but some addresses must arrive as a path. The panel's
// account-link QR code opens {console}/link?code=NNNNNN, because iOS Universal
// Links and Android App Links match a URL's path and never its fragment: a
// hash route could never open the Muon3D phone app (KAN-401).
//
// When the page is served at such a path, rewrite the address to the hash
// route of the same name, with the same query, before the router reads it.
// The old {console}/#/link?code= address already carries its hash and is left
// alone, as is any address whose hash names a route of its own.
//
// The hosted console redirects /link?code= to /#/link?code= itself; this is
// the fallback for any server that answers /link with index.html instead.
// Only the exact path: at /link/ the bundle cannot load at all, because the
// build uses relative asset paths (base: './') and would fetch /link/assets/.
const PATH_ENTRY_ROUTES = ['link']

interface EntryLocation {
  pathname: string
  search: string
  hash: string
}

export function hashEntryFor (location: EntryLocation): string | null {
  if (!['', '#', '#/'].includes(location.hash)) return null

  for (const route of PATH_ENTRY_ROUTES) {
    const match = location.pathname.match(new RegExp(`^(.*/)${route}$`))
    if (match) return `${match[1]}#/${route}${location.search}`
  }

  return null
}

export function applyPathEntry (): void {
  const entry = hashEntryFor(window.location)
  if (entry) window.history.replaceState(window.history.state, '', entry)
}
