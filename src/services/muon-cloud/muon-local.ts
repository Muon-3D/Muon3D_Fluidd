/**
 * muon3d.local: the offline page for printers on this network (KAN-5459). No imports, so a component that only
 * asks the question does not pull in the connection code.
 */
/** The offline page for every printer on this network. The only address this module ever sends the tab to. */
export const MUON_LOCAL_URL = 'http://muon3d.local/'

/** Said before the tab may leave for muon3d.local: Jack's words, 23 Nov. */
export const MUON_LOCAL_QUESTION = "Can't reach your printers from here. Open muon3d.local, the offline page for printers on this network?"

let leave = (url: string) => window.location.assign(url)

/** For tests: replaces how the tab is sent to muon3d.local. */
export function setLeave (fn: (url: string) => void) {
  leave = fn
}

/** The person chose "Open muon3d.local". Nothing else in Control sends the tab to a printer's address. */
export function openMuonLocal () {
  leave(MUON_LOCAL_URL)
}
