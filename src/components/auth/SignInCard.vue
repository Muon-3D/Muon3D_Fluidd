<!--
  The MUON3D sign-in card (KAN-6114; spec docs/control/sign-in.md, one
  MUON3D account). Every surface sends the browser to the console's
  /#/sign-in, and this is what it shows: passkey first, then email (a
  password, and the two-step code when the account has one), then the
  providers (greyed until each has a browser flow). The method used last
  is badged "Last used" and drawn first. The card finishes with the
  console's handoff (`POST /v1/handoff`, then `GET /handoff`), which carries
  on to `continuePath`, the `/authorize?...` the surface asked with.

  Exported for reuse: `<sign-in-card :continue-path="..." :return-to="..." />`
  is the whole card, with or without its page (`:page="false"`).
-->
<template>
  <auth-card
    :title="title"
    :subtitle="subtitle"
    :continuing="mode === 'sign-in' || mode === 'password' ? surface : null"
    :page="page"
  >
    <template #alert>
      <template v-if="sessionAllowed">
        <div
          v-if="notice"
          class="auth-alert"
          role="status"
          data-tid="sign-in-notice"
        >
          {{ notice }}
        </div>
        <div
          v-if="alert"
          class="auth-alert"
          :class="`auth-alert--${alert.kind}`"
          :role="alert.kind === 'error' ? 'alert' : 'status'"
          data-tid="sign-in-error"
        >
          <strong>{{ alert.title }}</strong>
          <span class="auth-alert__extra">{{ alertBody }}</span>
          <button
            v-if="alert.action === 'retry'"
            type="button"
            class="auth-link"
            data-tid="sign-in-retry"
            @click="retryOnline"
          >
            Try again
          </button>
        </div>
      </template>
    </template>

    <div v-if="!sessionAllowed">
      <open-in-muon-control route="/sign-in" />
    </div>

    <!-- Sign in: the methods, in order. -->
    <div
      v-else-if="mode === 'sign-in' || mode === 'password'"
      data-tid="sign-in-methods"
    >
        <template v-if="mode === 'sign-in'">
          <template v-for="(method, index) in order">
            <div
              v-if="index > 0"
              :key="`or-${method}`"
              class="auth-or"
            >
              or
            </div>
            <div
              :key="method"
              class="auth-method"
              :class="`auth-method--${method}`"
              :data-method="method"
            >
              <span
                v-if="last === method"
                :id="`signin-last-${method}`"
                class="auth-badge"
                data-tid="sign-in-last-used"
              >Last used</span>

              <template v-if="method === 'passkey'">
                <button
                  ref="passkeyButton"
                  type="button"
                  class="cbtn cbtn--lg"
                  :class="{ 'cbtn--primary': index === 0 }"
                  :disabled="busy"
                  :aria-disabled="offline ? 'true' : undefined"
                  :aria-busy="passkeyBusy ? 'true' : undefined"
                  :aria-describedby="last === 'passkey' ? 'signin-last-passkey' : undefined"
                  data-tid="sign-in-passkey"
                  @click="passkey"
                >
                  <frame-icon name="key" />
                  {{ passkeyBusy ? 'Waiting for your passkey…' : 'Sign in with a passkey' }}
                </button>
                <p
                  v-if="passkeyCancelled"
                  class="auth-muted"
                  role="status"
                  data-tid="sign-in-passkey-cancelled"
                >
                  Passkey sign-in cancelled.
                </p>
              </template>

              <form
                v-else-if="method === 'email'"
                class="auth-method"
                novalidate
                @submit.prevent="continueWithEmail"
              >
                <label class="m3-field">
                  <span class="m3-field__label">Email</span>
                  <span
                    class="m3-field__box"
                    :class="{ 'm3-field__box--err': emailError }"
                  >
                    <input
                      ref="emailInput"
                      v-model="email"
                      type="email"
                      placeholder="you@example.com"
                      autocomplete="username webauthn"
                      inputmode="email"
                      autocapitalize="off"
                      spellcheck="false"
                      :disabled="busy"
                      :aria-invalid="emailError ? 'true' : undefined"
                      :aria-describedby="[emailError ? 'signin-email-error' : '', last === 'email' ? 'signin-last-email' : ''].join(' ').trim() || undefined"
                      data-tid="sign-in-email"
                    >
                  </span>
                </label>
                <p
                  v-if="emailError"
                  id="signin-email-error"
                  class="auth-field-error"
                  data-tid="sign-in-email-error"
                >
                  {{ emailError }}
                </p>
                <button
                  type="submit"
                  class="cbtn cbtn--lg"
                  :class="{ 'cbtn--primary': index === 0 }"
                  :disabled="busy || limited"
                  :aria-disabled="offline ? 'true' : undefined"
                  data-tid="sign-in-continue"
                >
                  Continue with email
                </button>
                <p
                  v-if="!passkeys"
                  class="auth-muted"
                  data-tid="sign-in-no-passkeys"
                >
                  This browser can't use passkeys.
                </p>
              </form>

              <button
                v-else
                type="button"
                class="cbtn cbtn--lg"
                :class="{ 'cbtn--primary': index === 0 }"
                :disabled="busy"
                :aria-disabled="offline ? 'true' : undefined"
                :aria-describedby="last === method ? `signin-last-${method}` : undefined"
                :data-tid="`sign-in-provider-${method}`"
                @click="$emit('provider', method)"
              >
                <frame-icon :name="providerOf(method).icon" />
                Continue with {{ providerOf(method).label }}
              </button>
            </div>
          </template>

          <template v-if="soonProviders.length">
            <div class="auth-or">
              or
            </div>
            <div
              class="auth-providers"
              data-tid="sign-in-providers"
            >
              <button
                v-for="p in soonProviders"
                :key="p.id"
                type="button"
                aria-disabled="true"
                :aria-describedby="`soon-${p.id}`"
                :class="{ 'is-tipped': tipped === p.id }"
                :data-tid="`sign-in-provider-${p.id}`"
                @click.prevent="tip(p.id)"
                @keydown.enter.prevent
                @keydown.space.prevent
              >
                <frame-icon :name="p.icon" />
                {{ p.label }}
                <span
                  :id="`soon-${p.id}`"
                  class="auth-tip"
                  role="tooltip"
                >Coming soon</span>
              </button>
            </div>
          </template>
        </template>

        <!-- The password step (C7). -->
        <form
          v-else
          class="auth-method"
          @submit.prevent="submit"
        >
          <div class="auth-row">
            <input
              :value="email"
              type="email"
              readonly
              autocomplete="username"
              class="auth-readonly"
              aria-label="Email"
              data-tid="sign-in-email-readonly"
            >
            <button
              type="button"
              class="auth-link"
              data-tid="sign-in-change"
              @click="changeEmail"
            >
              Change
            </button>
          </div>
          <label class="m3-field">
            <span class="m3-field__label">Password</span>
            <span class="m3-field__box auth-pw">
              <input
                ref="passwordInput"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :disabled="busy"
                data-tid="sign-in-password"
              >
              <button
                type="button"
                class="auth-link"
                :aria-pressed="showPassword ? 'true' : 'false'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <frame-icon name="eye" />
              </button>
            </span>
          </label>
          <button
            type="submit"
            class="cbtn cbtn--lg cbtn--primary"
            :disabled="busy || limited"
            :aria-busy="busy ? 'true' : undefined"
            data-tid="sign-in-submit"
          >
            Sign in
          </button>
          <button
            type="button"
            class="auth-link"
            data-tid="sign-in-forgot"
            @click="setMode('forgot')"
          >
            Forgot your password?
          </button>
          <button
            v-if="emailLink"
            type="button"
            class="auth-link"
            data-tid="sign-in-email-link"
            @click="$emit('email-link', email)"
          >
            Email me a sign-in link instead
          </button>
        </form>
      </div>

      <!-- Two-step code (C8), create account (C9), forgot (C10). -->
      <form
        v-else-if="mode === 'code' || mode === 'sign-up' || mode === 'forgot'"
        class="auth-method"
        novalidate
        @submit.prevent="submit"
      >
        <label
          v-if="mode === 'code'"
          class="m3-field"
        >
          <span class="m3-field__label">Code</span>
          <span class="m3-field__box m3-field__box--mono">
            <input
              ref="codeInput"
              v-model="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              :disabled="busy"
              aria-describedby="signin-code-hint"
              data-tid="sign-in-code"
            >
          </span>
          <span
            id="signin-code-hint"
            class="auth-muted"
          >Six digits from your authenticator app, or a recovery code.</span>
        </label>
        <template v-else>
          <label
            v-if="mode === 'sign-up'"
            class="m3-field"
          >
            <span class="m3-field__label">Name</span>
            <span class="m3-field__box">
              <input
                v-model="name"
                autocomplete="name"
                :disabled="busy"
                data-tid="sign-up-name"
              >
            </span>
          </label>
          <template v-if="mode === 'sign-up'">
            <label class="m3-field">
              <span class="m3-field__label">Your age</span>
              <span
                class="m3-field__box"
                :class="{ 'm3-field__box--err': ageError }"
              >
                <input
                  v-model="age"
                  inputmode="numeric"
                  :disabled="busy"
                  :aria-invalid="ageError ? 'true' : undefined"
                  aria-describedby="sign-up-age-hint"
                  data-tid="sign-up-age"
                >
              </span>
              <span
                id="sign-up-age-hint"
                class="auth-muted"
              >Private. Confirm once; accounts require age 13 or over.</span>
            </label>
            <p
              v-if="ageError"
              id="sign-up-age-error"
              class="auth-field-error"
              role="alert"
              data-tid="sign-up-age-error"
            >
              {{ ageError }}
            </p>
          </template>
          <label class="m3-field">
            <span class="m3-field__label">Email</span>
            <span
              class="m3-field__box"
              :class="{ 'm3-field__box--err': emailError }"
            >
              <input
                v-model="email"
                type="email"
                placeholder="you@example.com"
                :autocomplete="mode === 'sign-up' ? 'email' : 'username'"
                inputmode="email"
                autocapitalize="off"
                spellcheck="false"
                :disabled="busy"
                data-tid="sign-in-email"
              >
            </span>
          </label>
          <p
            v-if="emailError"
            class="auth-field-error"
            data-tid="sign-in-email-error"
          >
            {{ emailError }}
          </p>
          <label
            v-if="mode === 'sign-up'"
            class="m3-field"
          >
            <span class="m3-field__label">Password</span>
            <span class="m3-field__box">
              <input
                v-model="password"
                type="password"
                autocomplete="new-password"
                :disabled="busy"
                aria-describedby="sign-up-password-hint"
                data-tid="sign-in-password"
              >
            </span>
            <span
              id="sign-up-password-hint"
              class="auth-muted"
            >At least 8 characters</span>
          </label>
        </template>
        <button
          type="submit"
          class="cbtn cbtn--lg cbtn--primary"
          :disabled="busy || limited"
          :aria-busy="busy ? 'true' : undefined"
          data-tid="sign-in-submit"
        >
          {{ submitText }}
        </button>
      </form>

      <!-- Email sent (C11). -->
      <div
        v-else-if="mode === 'sent'"
        data-tid="sign-in-sent"
      >
        <div class="auth-icon">
          <frame-icon name="mail" />
        </div>
        <p class="auth-sub">
          If there's an account for <strong>{{ email }}</strong>, we've sent it a link to choose a new password. It works once, for an hour.
        </p>
        <div class="auth-actions">
          <button
            type="button"
            class="cbtn cbtn--lg"
            :disabled="cooldown > 0 || busy || limited"
            data-tid="sign-in-send-again"
            @click="sendAgain"
          >
            {{ cooldown > 0 ? `Send again in ${clock(cooldown)}` : 'Send again' }}
          </button>
        </div>
        <p class="auth-muted">
          Nothing there? Check your spam folder, or go back and try a different address.
        </p>
      </div>

      <!-- Add a passkey (C17). -->
      <div
        v-else-if="mode === 'nudge'"
        data-tid="sign-in-nudge"
      >
        <div class="auth-icon">
          <frame-icon name="key" />
        </div>
        <p class="auth-sub">
          Add a passkey and sign in with your face, fingerprint or screen lock. No password to type.
        </p>
        <p
          v-if="nudgeDone"
          class="auth-muted"
          role="status"
          data-tid="sign-in-nudge-done"
        >
          Passkey added. Next time, choose "Sign in with a passkey".
        </p>
        <p
          v-else-if="nudgeFailed"
          class="auth-muted"
          role="status"
          data-tid="sign-in-nudge-failed"
        >
          No passkey was added.
        </p>
        <div
          v-if="!nudgeDone"
          class="auth-actions"
        >
          <button
            type="button"
            class="cbtn cbtn--lg cbtn--primary"
            :disabled="busy"
            :aria-busy="busy ? 'true' : undefined"
            data-tid="sign-in-nudge-add"
            @click="addPasskey"
          >
            {{ nudgeFailed ? 'Try again' : 'Add a passkey' }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--lg cbtn--ghost"
            :disabled="busy"
            data-tid="sign-in-nudge-skip"
            @click="skipNudge(nudgeFailed ? null : 30)"
          >
            {{ nudgeFailed ? 'Continue without one' : 'Not now' }}
          </button>
          <button
            v-if="!nudgeFailed"
            type="button"
            class="auth-link"
            :disabled="busy"
            data-tid="sign-in-nudge-never"
            @click="skipNudge(0)"
          >
            Don't ask again on this device
          </button>
        </div>
      </div>

      <template #footer>
        <template v-if="mode === 'sign-in' || mode === 'sign-up'">
          {{ mode === 'sign-in' ? 'New to Muon3D?' : 'Already have an account?' }}
          <button
            type="button"
            class="auth-link"
            data-tid="sign-in-switch"
            @click="setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')"
          >
            {{ mode === 'sign-in' ? 'Create an account' : 'Sign in' }}
          </button>
        </template>
        <button
          v-else-if="mode !== 'nudge'"
          type="button"
          class="auth-link"
          data-tid="sign-in-back"
          @click="setMode('sign-in')"
        >
          Back to sign in
        </button>
      </template>
  </auth-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import AuthCard from '@/components/auth/AuthCard.vue'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import OpenInMuonControl from '@/components/muon-cloud/OpenInMuonControl.vue'
import { AccountError } from '@/services/account/client'
import { accountApi, type ConsoleConfig } from '@/services/account/api'
import { addPasskeyAfterSignIn, codeSignIn, finishSignIn, forgotPassword, passkeyCount, passkeySignIn, passwordSignIn, signUp } from '@/services/account/sign-in'
import { alertFor, isOffline, waitText, type AuthAlert } from '@/services/account/sign-in-errors'
import {
  PROVIDERS, nudgeSnoozed, orderMethods, providerState, readLastMethod, snoozeNudge, surfaceOf, writeLastMethod,
  type MethodId, type Provider
} from '@/services/account/sign-in-methods'
import { cancelledPasskey, conditionalPasskeysAvailable, deviceLabel, passkeysSupported } from '@/services/account/webauthn'
import { cloudSessionAllowed } from '@/services/muon-cloud/api'

type Mode = 'sign-in' | 'password' | 'code' | 'sign-up' | 'forgot' | 'sent' | 'nudge'

const NUDGE_PATIENCE_MS = 5 * 60 * 1000
const CONDITIONAL_RENEW_MS = 4 * 60 * 1000

@Component({ components: { AuthCard, FrameIcon, OpenInMuonControl } })
export default class SignInCard extends Vue {
  /** The `/authorize?...` to carry on to after the handoff, already checked by `safeContinue`. */
  @Prop({ type: String, default: null })
  readonly continuePath!: string | null

  /** Where a sign-in with no `continue` lands in Control. */
  @Prop({ type: String, default: '/' })
  readonly returnTo!: string

  /** The card with its own page (brand row, centred). */
  @Prop({ type: Boolean, default: true })
  readonly page!: boolean

  @Prop({ type: String, default: 'sign-in' })
  readonly initialMode!: Mode

  /** An emailed sign-in link is designed but off (D-210): on only when the console says `email_link`. */
  @Prop({ type: Boolean, default: false })
  readonly emailLink!: boolean

  /** An `?error=` the page was opened with. */
  @Prop({ type: String, default: '' })
  readonly arrivalError!: string

  /** False on the printer's plain-HTTP address: no form, one link to the console (KAN-2192). */
  sessionAllowed = cloudSessionAllowed()

  mode: Mode = 'sign-in'
  age = ''
  name = ''
  email = ''
  password = ''
  code = ''
  mfaToken = ''
  showPassword = false
  busy = false
  passkeyBusy = false
  passkeyCancelled = false
  alert: AuthAlert | null = null
  emailError = ''
  ageError = ''
  last: MethodId | null = readLastMethod()
  config: ConsoleConfig | null = null
  offline = isOffline()
  tipped: string | null = null
  waitLeft = 0
  cooldown = 0
  nudgeDone = false
  nudgeFailed = false

  private nudgeToken = ''
  private nudgeMethod: MethodId = 'email'
  private nudgeTimer: number | null = null
  private ticker: number | null = null
  private tipTimer: number | null = null
  private conditional: AbortController | null = null
  private renewTimer: number | null = null
  private renewing = false
  private gone = false

  get passkeys (): boolean {
    return passkeysSupported()
  }

  get surface (): string | null {
    return surfaceOf(this.continuePath)
  }

  get limited (): boolean {
    return this.waitLeft > 0
  }

  get notice (): string | null {
    return this.arrivalError === 'handoff_expired' ? 'That sign-in took too long to finish. Sign in again.' : null
  }

  get onProviders (): Provider[] {
    return PROVIDERS.filter(p => providerState(p, this.config) === 'on')
  }

  get soonProviders (): Provider[] {
    return PROVIDERS.filter(p => providerState(p, this.config) === 'soon')
  }

  /** Passkey, email, then the providers that are on; the last used one first. */
  get order (): MethodId[] {
    return orderMethods({ passkeys: this.passkeys, last: this.last, on: this.onProviders.map(p => p.id) })
  }

  get title (): string {
    switch (this.mode) {
      case 'sign-up': return 'Create your MUON3D account'
      case 'code': return 'Enter your code'
      case 'forgot': return 'Forgot your password?'
      case 'sent': return 'Check your email'
      case 'nudge': return 'Sign in faster next time'
      default: return 'Sign in to MUON3D'
    }
  }

  get subtitle (): string {
    switch (this.mode) {
      case 'code': return 'This account has two-step sign-in.'
      case 'forgot': return 'We\'ll email you a link to choose a new one.'
      case 'sent':
      case 'nudge': return ''
      default: return 'One account for your printers, the slicer and your models.'
    }
  }

  get submitText (): string {
    switch (this.mode) {
      case 'sign-up': return 'Create account'
      case 'code': return 'Continue'
      case 'forgot': return 'Send the link'
      default: return 'Sign in'
    }
  }

  get alertBody (): string {
    if (!this.alert) return ''
    if (this.alert.waitS === undefined) return this.alert.body
    const extra = this.passkeys ? ' You can still sign in with a passkey.' : ''
    return `${this.limited ? waitText(this.waitLeft) : 'You can try again now.'}${extra}`
  }

  providerOf (id: MethodId): Provider {
    return PROVIDERS.find(p => p.id === id) as Provider
  }

  clock (seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  }

  created () {
    this.mode = this.initialMode
    window.addEventListener('offline', this.onOffline)
    window.addEventListener('online', this.onOnline)
    if (this.offline) this.alert = alertFor(new AccountError('offline', 0), 'other')
  }

  mounted () {
    if (!this.sessionAllowed) return
    // The provider flags: today every provider is greyed whatever the console says (`webFlow`), so a failure is silent.
    accountApi.config().then(config => { if (!this.gone) this.config = config }).catch(() => {})
    this.focusFirst()
    this.startConditional()
  }

  beforeDestroy () {
    this.gone = true
    this.stopConditional()
    window.removeEventListener('offline', this.onOffline)
    window.removeEventListener('online', this.onOnline)
    for (const timer of [this.ticker, this.tipTimer, this.nudgeTimer]) if (timer !== null) window.clearTimeout(timer)
    if (this.ticker !== null) window.clearInterval(this.ticker)
  }

  /** Overridable in tests: a full-page navigation. */
  go (url: string) {
    window.location.assign(url)
  }

  focusFirst () {
    this.$nextTick(() => {
      const first = this.order[0]
      const target = first === 'passkey' ? this.$refs.passkeyButton : first === 'email' ? this.$refs.emailInput : null
      const element = (Array.isArray(target) ? target[0] : target) as HTMLElement | undefined
      element?.focus?.()
    })
  }

  // ---- offline -------------------------------------------------------------

  onOffline () {
    this.offline = true
    this.alert = alertFor(new AccountError('offline', 0), 'other')
    this.stopConditional()
  }

  onOnline () {
    this.offline = false
    if (this.alert?.action === 'retry') this.alert = null
    this.startConditional()
  }

  retryOnline () {
    this.offline = isOffline()
    if (!this.offline) this.onOnline()
  }

  // ---- conditional mediation: passkeys in the email field's autofill ------

  async startConditional () {
    if (this.gone || this.offline || this.mode !== 'sign-in' || !(await conditionalPasskeysAvailable()) || this.gone || this.conditional) return
    const controller = new AbortController()
    this.conditional = controller
    // A ceremony lives 300 s: renew it every 4 minutes.
    this.renewTimer = window.setTimeout(() => { this.renewing = true; controller.abort() }, CONDITIONAL_RENEW_MS)
    let token: string | null = null
    try {
      token = await passkeySignIn({ conditional: true, signal: controller.signal })
    } catch {
      // Silent: never an alert, never a state change.
    }
    if (this.renewTimer !== null) window.clearTimeout(this.renewTimer)
    this.renewTimer = null
    const renew = this.renewing
    this.renewing = false
    if (this.conditional === controller) this.conditional = null
    if (token !== null) {
      if (this.gone || this.busy) return
      this.busy = true
      try {
        await this.finish(token, 'passkey')
      } catch (error) {
        this.busy = false
        this.fail(error, 'passkey')
        this.startConditional()
      }
      return
    }
    if (renew && !this.gone) this.startConditional()
  }

  stopConditional () {
    this.renewing = false
    const controller = this.conditional
    this.conditional = null
    if (this.renewTimer !== null) window.clearTimeout(this.renewTimer)
    this.renewTimer = null
    controller?.abort()
  }

  // ---- modes ---------------------------------------------------------------

  setMode (mode: Mode) {
    this.mode = mode
    this.alert = null
    this.emailError = ''
    this.ageError = ''
    this.passkeyCancelled = false
    if (mode !== 'code') {
      this.code = ''
      this.mfaToken = ''
    }
    this.password = ''
    if (mode === 'sign-in') this.startConditional()
    else this.stopConditional()
    this.$nextTick(() => {
      const ref = mode === 'code' ? this.$refs.codeInput : mode === 'password' ? this.$refs.passwordInput : null
      ;((Array.isArray(ref) ? ref[0] : ref) as HTMLElement | undefined)?.focus?.()
    })
  }

  changeEmail () {
    this.setMode('sign-in')
  }

  tip (id: string) {
    // Does nothing but explain: no request, no navigation, no state change.
    this.tipped = id
    if (this.tipTimer !== null) window.clearTimeout(this.tipTimer)
    this.tipTimer = window.setTimeout(() => { this.tipped = null }, 2000)
  }

  validEmail (): boolean {
    if (/^\S+@\S+\.\S+$/.test(this.email.trim())) return true
    this.emailError = 'Enter your email address.'
    return false
  }

  continueWithEmail () {
    if (this.busy || this.offline) return
    this.alert = null
    this.emailError = ''
    this.passkeyCancelled = false
    if (!this.validEmail()) return
    this.stopConditional()
    this.setMode('password')
  }

  // ---- the methods ---------------------------------------------------------

  async passkey () {
    if (this.busy || this.offline) return
    this.alert = null
    this.passkeyCancelled = false
    this.stopConditional()
    this.busy = true
    this.passkeyBusy = true
    try {
      await this.finish(await passkeySignIn(), 'passkey')
    } catch (error) {
      this.busy = false
      this.passkeyBusy = false
      if (cancelledPasskey(error)) this.passkeyCancelled = true
      else this.fail(error, 'passkey')
      this.startConditional()
    }
  }

  async submit () {
    if (this.busy || this.limited || this.offline) return
    this.alert = null
    this.emailError = ''
    this.busy = true
    try {
      switch (this.mode) {
        case 'forgot':
          if (!this.validEmail()) { this.busy = false; return }
          await forgotPassword(this.email.trim())
          this.busy = false
          this.setMode('sent')
          this.startCooldown()
          return
        case 'code':
          await this.finish(await codeSignIn(this.mfaToken, this.code), 'email')
          return
        case 'sign-up':
          this.ageError = validateAge(this.age)
          if (this.ageError || !this.validEmail()) { this.busy = false; return }
          await this.finish(await signUp(this.email.trim(), this.password, this.name.trim(), Number(this.age)), 'email')
          return
        default:
          await this.finish(await passwordSignIn(this.email.trim(), this.password), 'email')
      }
    } catch (error) {
      this.busy = false
      this.password = ''
      this.code = ''
      const mfa = error instanceof AccountError ? error.mfaToken : null
      if (mfa) {
        // The password was right; the code finishes it.
        this.mfaToken = mfa
        this.mode = 'code'
        this.$nextTick(() => (this.$refs.codeInput as HTMLElement | undefined)?.focus?.())
        return
      }
      this.fail(error, this.mode === 'code' ? 'code' : this.mode === 'sign-up' ? 'sign-up' : this.mode === 'forgot' ? 'forgot' : 'password')
    }
  }

  /** Shows the alert for an error, and acts on what it asks for. */
  fail (error: unknown, flow: Parameters<typeof alertFor>[1]) {
    const alert = alertFor(error, flow)
    if (alert.action === 'restart') {
      this.setMode('sign-in')
    } else if (alert.action === 'sign-in') {
      this.setMode('sign-in')
    }
    this.alert = alert
    if (alert.waitS !== undefined) this.startWait(alert.waitS)
  }

  startWait (seconds: number) {
    this.waitLeft = seconds
    this.tick(() => {
      this.waitLeft = Math.max(0, this.waitLeft - 1)
      return this.waitLeft > 0
    }, () => { if (this.alert?.waitS !== undefined) this.alert = { ...this.alert, body: 'You can try again now.' } })
  }

  startCooldown () {
    this.cooldown = 60
    this.tick(() => {
      this.cooldown = Math.max(0, this.cooldown - 1)
      return this.cooldown > 0
    })
  }

  private tick (step: () => boolean, done?: () => void) {
    if (this.ticker !== null) window.clearInterval(this.ticker)
    this.ticker = window.setInterval(() => {
      if (step()) return
      if (this.ticker !== null) window.clearInterval(this.ticker)
      this.ticker = null
      done?.()
    }, 1000)
  }

  async sendAgain () {
    if (this.cooldown > 0 || this.busy || this.limited) return
    this.busy = true
    this.alert = null
    try {
      await forgotPassword(this.email.trim())
      this.startCooldown()
    } catch (error) {
      this.fail(error, 'forgot')
    } finally {
      this.busy = false
    }
  }

  // ---- finishing, and the passkey nudge -----------------------------------

  /** Whether to offer a passkey now: not after a passkey, only where one can be made, never too often. */
  nudgeWanted (method: MethodId): boolean {
    return method !== 'passkey' && this.passkeys && !nudgeSnoozed() && (this.continuePath === null || this.surface !== null)
  }

  /** The page's token, then (maybe) the nudge, then the handoff. */
  async finish (token: string, method: MethodId) {
    this.password = ''
    this.code = ''
    if (this.nudgeWanted(method) && await passkeyCount(token) === 0) {
      this.nudgeToken = token
      this.nudgeMethod = method
      this.stopConditional()
      this.busy = false
      this.passkeyBusy = false
      this.mode = 'nudge'
      this.alert = null
      // Carries on as "Not now" (without writing) if nobody answers: the page's token lasts minutes.
      this.nudgeTimer = window.setTimeout(() => { if (this.mode === 'nudge' && !this.busy) this.skipNudge(undefined) }, NUDGE_PATIENCE_MS)
      return
    }
    await this.complete(token, method)
  }

  /** Remembers the method (only now the console accepted it), then the handoff and on to the surface. */
  async complete (token: string, method: MethodId) {
    writeLastMethod(method)
    this.go(await finishSignIn(token, this.continuePath, this.returnTo))
  }

  async addPasskey () {
    if (this.busy) return
    this.busy = true
    this.nudgeFailed = false
    try {
      const token = await addPasskeyAfterSignIn(this.nudgeToken, deviceLabel())
      this.nudgeDone = true
      this.busy = false
      window.setTimeout(() => this.carryOn(token, 'passkey'), 1200)
    } catch {
      this.busy = false
      this.nudgeFailed = true
    }
  }

  /** `30` = not now (30 days), `0` = never on this device, undefined = timed out (writes nothing). */
  skipNudge (days: number | null | undefined) {
    if (this.busy) return
    if (days === 0) snoozeNudge(null)
    else if (days === 30) snoozeNudge(30)
    this.carryOn(this.nudgeToken, this.nudgeMethod)
  }

  async carryOn (token: string, method: MethodId) {
    if (this.nudgeTimer !== null) window.clearTimeout(this.nudgeTimer)
    this.busy = true
    try {
      await this.complete(token, method)
    } catch (error) {
      this.busy = false
      this.nudgeDone = false
      this.setMode('sign-in')
      this.fail(error, 'other')
    }
  }
}

function validateAge (age: string): string {
  if (!/^\d+$/.test(age)) return 'Enter your age as a whole number.'
  return Number(age) >= 13 && Number(age) <= 120 ? '' : 'Age must be between 13 and 120.'
}
</script>

<style lang="scss" scoped>
.auth-readonly {
  flex: 1 1 0;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--m3d-text);
  font: inherit;
}
</style>
