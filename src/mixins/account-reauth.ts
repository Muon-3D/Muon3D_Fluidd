import { Component, Vue } from 'vue-property-decorator'
import type { Reauth } from '@/services/account/api'
import { AccountError } from '@/services/account/client'
import { storedToken } from '@/services/muon-cloud/api'
import { confirmAccount } from '@/services/account/confirmation'
import { accountState, describe } from '@/services/account/state'
import { stepUpMessage } from '@/services/account/sign-in-errors'

export interface ReauthAsk {
  /** Why it's asked, in a line. */
  why?: string;
  /** The button: "Remove passkey". */
  action?: string;
  danger?: boolean;
  /** What is being confirmed, as sent (the sheet's `rows`). */
  rows?: Array<{ label: string, value: string, mono?: boolean }>;
  /** A small muted line under the buttons, such as a time limit. */
  note?: string;
  /** Passkey only: no password fields. */
  passkeyOnly?: boolean;
}

interface ReauthDialogState extends Required<ReauthAsk> {
  open: boolean;
  busy: boolean;
  passkeyBusy: boolean;
  error: string;
}

/**
 * Runs a change that may need "Confirm it's you" (KAN-532): first with
 * nothing, since the console lets a sign-in of the last ten minutes through;
 * when it answers `reauth_required`, opens ReauthDialog and runs the change
 * again with a passkey or the password (and code). The page puts
 * `<reauth-dialog v-bind="reauthProps" v-on="reauthOn" />` in its template.
 */
@Component
export default class AccountReauthMixin extends Vue {
  reauthState: ReauthDialogState = { open: false, busy: false, passkeyBusy: false, error: '', why: '', action: 'Confirm', danger: false, rows: [], note: '', passkeyOnly: false }
  reauthSubmit: ((answer: Reauth) => void) | null = null
  reauthCancel: (() => void) | null = null
  reauthPasskey: (() => Promise<void>) | null = null
  reauthAlive = true
  beforeDestroy () { this.reauthAlive = false; this.reauthCancel?.() }

  get reauthProps () {
    const me = accountState.me
    return {
      value: this.reauthState.open,
      busy: this.reauthState.busy,
      passkeyBusy: this.reauthState.passkeyBusy,
      rows: this.reauthState.rows,
      note: this.reauthState.note,
      passkeyOnly: this.reauthState.passkeyOnly,
      error: this.reauthState.error,
      why: this.reauthState.why || undefined,
      action: this.reauthState.action,
      danger: this.reauthState.danger,
      hasPassword: me ? (me.sign_in?.password ?? me.account.has_password !== false) : true,
      hasPasskey: (me?.sign_in?.passkeys ?? 0) > 0,
      twoStep: me ? (me.sign_in?.two_step ?? me.account.two_step ?? false) : false
    }
  }

  get reauthOn () {
    return {
      passkey: () => this.reauthPasskey?.(),
      submit: (answer: Reauth) => this.reauthSubmit?.(answer),
      cancel: () => this.reauthCancel?.(),
      input: (open: boolean) => { if (!open) this.reauthCancel?.() }
    }
  }

  /**
   * The change's result, or null when the person cancelled. Any error but a
   * `reauth_required` is thrown as it came.
   */
  async withReauth<T> (act: (answer: Reauth) => Promise<T>, ask: ReauthAsk = {}): Promise<T | null> {
    const initialToken = storedToken()
    const initialCurrent = () => this.reauthAlive && storedToken() === initialToken && !document.hidden
    if (!initialCurrent()) return null
    try {
      const result = await act({})
      return initialCurrent() ? result : null
    } catch (error) {
      if (!(error instanceof AccountError && error.reauthRequired)) throw error
    }
    if (!initialCurrent()) return null
    return new Promise<T | null>((resolve) => {
      this.reauthState = { open: true, busy: false, passkeyBusy: false, error: '', why: ask.why ?? '', action: ask.action ?? 'Confirm', danger: ask.danger ?? false, rows: ask.rows ?? [], note: ask.note ?? '', passkeyOnly: ask.passkeyOnly ?? false }
      const token = storedToken()
      let active = true
      const current = () => active && this.reauthAlive && storedToken() === token && !document.hidden
      const finish = (result: T | null) => {
        active = false; this.reauthState.open = false
        this.reauthSubmit = null; this.reauthPasskey = null; this.reauthCancel = null
        resolve(result)
      }
      const submit = async (answer: Reauth, passkey = false) => {
        if (this.reauthState.busy) return
        if (!current()) { finish(null); return }
        this.reauthState.busy = true
        this.reauthState.passkeyBusy = passkey
        this.reauthState.error = ''
        try {
          if (passkey) await confirmAccount(current)
          if (!current()) { finish(null); return }
          const result = await act(answer)
          if (current()) finish(result)
          else finish(null)
        } catch (error) {
          if (!current()) finish(null)
          else {
            this.reauthState.error = error instanceof DOMException && error.name === 'NotAllowedError'
              ? stepUpMessage(error)
              : describe(error)
          }
        } finally {
          this.reauthState.busy = false
          this.reauthState.passkeyBusy = false
        }
      }
      this.reauthSubmit = answer => submit(answer)
      this.reauthPasskey = () => submit({}, true)
      this.reauthCancel = () => finish(null)
    })
  }
}
