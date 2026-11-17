# Signing in from Control's Slice embed

The slicer saves its work before asking its parent Control page to sign in:

```js
window.parent.postMessage({ type: 'account.signIn' }, controlOrigin)
```

This is a **window message**, not a bridge-port operation. Its one field is
exact (as muon3d-slicer #57 sends it, `SIGN_IN_MESSAGE` in `web/src/app/embedSignIn.ts`); extra fields are ignored along with malformed messages. Control accepts
it only from its own slicer iframe's `contentWindow`, at the exact origin of
the configured `VUE_MUON_SLICER_URL`. Use the known Control origin as
`targetOrigin`, never `*`. The vendored printer-client protocol is unchanged.

Signed out, Control starts its normal full-page console authorization flow,
retaining the current Slice path, query and hash as the pending authorization's
`returnTo` in this tab. No popup is used. Repeated requests during the redirect
are ignored. Control bypasses its own dirty-work guard for this requested trip:
the slicer must finish its snapshot before posting.

On return the embed loads normally with the adopted account. If the account is
adopted after the frame starts, Control reloads it once. A sessionStorage marker
is consumed on return even if sign-in failed or was cancelled; it never starts
another sign-in by itself.

Already signed in, Control re-announces `bridge.accountStatus`, then reloads the
embed once per account for this mounted Slice page. Further requests still
announce status but do not cause a reload loop. The embed must restore its
saved work on load and use the existing bridge `account.status` operation/event
to learn the account. There is no window-message acknowledgement or token in
this message. The listener is removed when Slice unmounts.
