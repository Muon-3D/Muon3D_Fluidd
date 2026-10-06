// Fluidd's front-channel logout (WEB-12); see logout.html.
//
// Forgets this browser's Muon3D session for the Fluidd the console serves:
// the access and refresh tokens, the printer it was showing, and the
// browser's Iroh key, as Fluidd's own sign-out does. Every open Fluidd tab
// hears the token go (the `storage` event) and signs out too.
//
// Only when the console asked: `iss` must be this page's own origin, which
// is the console that serves it, and the page must be framed by a page of
// that origin. Anything else does nothing.
(function () {
  try {
    var iss = new URLSearchParams(window.location.search).get('iss')
    if (!iss || iss.replace(/\/$/, '') !== window.location.origin) return
    if (window.parent === window) return
    if (!document.referrer || new URL(document.referrer).origin !== window.location.origin) return
    ;['muon.cloud.token', 'muon.cloud.refresh', 'muon.cloud.active', 'muon.cloud.key'].forEach(function (key) {
      window.localStorage.removeItem(key)
    })
  } catch (e) {
    // No storage, or an unreadable address: nothing to forget.
  }
})()
