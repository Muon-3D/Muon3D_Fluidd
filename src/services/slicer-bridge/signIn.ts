import { beginSignIn } from '@/services/account/sign-in'
import { currentAccount, onAccountChange, type AccountIdentity } from '@/services/muon-cloud/account-events'

const RETURN_KEY = 'muon.slice.sign-in'

interface SignInOptions {
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  frame: HTMLIFrameElement;
  url: URL;
  address: () => string;
  accountStatus: (status: AccountIdentity) => void;
  reload: () => void;
  leaving: (value: boolean) => void;
  storage?: Storage;
  identity?: typeof currentAccount;
  subscribe?: typeof onAccountChange;
  signIn?: typeof beginSignIn;
}

export function listenForSlicerSignIn (options: SignInOptions): () => void {
  const identity = options.identity ?? currentAccount
  const signIn = options.signIn ?? beginSignIn
  let redirecting = false
  let closed = false
  let awaitingAccount = false
  let reloadedFor: string | null = null
  try {
    const returning = options.storage?.getItem(RETURN_KEY) === options.address()
    const status = identity()
    awaitingAccount = returning && !status.signedIn
    if (returning && status.signedIn) reloadedFor = status.id
    options.storage?.removeItem(RETURN_KEY)
  } catch { /* storage is optional */ }
  const stopAccount = (options.subscribe ?? onAccountChange)(status => {
    if (!awaitingAccount || !status.signedIn || closed) return
    awaitingAccount = false
    reloadedFor = status.id
    options.accountStatus(status)
    options.reload()
  })
  const onMessage = (event: MessageEvent) => {
    if (closed || redirecting || event.origin !== options.url.origin || event.source !== options.frame.contentWindow || event.source === null) return
    const data: unknown = event.data
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    const request = data as Record<string, unknown>
    if (Object.keys(request).length !== 1 || request.type !== 'account.signIn') return
    const status = identity()
    if (status.signedIn) {
      options.accountStatus(status)
      if (reloadedFor !== status.id) {
        reloadedFor = status.id
        options.reload()
      }
      return
    }
    redirecting = true
    const returnTo = options.address()
    try { options.storage?.setItem(RETURN_KEY, returnTo) } catch { /* storage is optional */ }
    options.leaving(true)
    Promise.resolve().then(() => signIn(returnTo)).catch(() => {
      if (closed) return
      redirecting = false
      options.leaving(false)
      try { options.storage?.removeItem(RETURN_KEY) } catch { /* storage is optional */ }
    })
  }
  options.target.addEventListener('message', onMessage)
  return () => {
    closed = true
    stopAccount()
    options.target.removeEventListener('message', onMessage)
  }
}
