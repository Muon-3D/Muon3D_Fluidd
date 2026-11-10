<template>
  <div
    class="acct-section"
    data-tid="account-security"
  >
    <div class="acct-head">
      <h1>Sign-in and security</h1>
      <p>How you sign in, and what protects your account and your printers</p>
    </div>

    <!-- 1 · How protected you are, with the one thing to do next. -->
    <section
      v-if="me"
      class="lib-surface sec__summary"
      :class="`sec__summary--${health.level}`"
      role="status"
      aria-label="How protected your account is"
      data-tid="security-health"
    >
      <span class="acct-icon-box sec__summary-icon"><frame-icon
        name="shield"
        small
      /></span>
      <span class="sec__summary-text">
        <b>{{ health.title }}</b>
        <span>{{ health.line }}<template v-if="next"> Next: <span data-tid="security-next">{{ next.todo.charAt(0).toLowerCase() + next.todo.slice(1) }}</span>.</template></span>
      </span>
      <span
        class="sec__bar"
        role="meter"
        aria-label="Protection"
        aria-valuemin="0"
        :aria-valuemax="steps.length"
        :aria-valuenow="stepsDone"
        data-tid="security-meter"
      >
        <span
          v-for="step in steps"
          :key="step.id"
          class="sec__bar-step"
          :class="{ 'sec__bar-step--done': step.done }"
        />
      </span>
    </section>

    <!-- 2 · Every way to sign in, in one list. -->
    <div class="acct-gt">
      Signing in
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="Signing in"
      data-tid="security-signing-in"
    >
      <div class="acct-grow sec__row">
        <span class="acct-icon-box"><frame-icon
          name="mail"
          small
        /></span>
        <span class="acct-grow__text">
          <b>Email</b>
          <span>
            {{ email }}<template v-if="details && details.email_verified === true"> · confirmed</template><template v-else-if="details && details.email_verified === false"><span class="sec__warn"> · not confirmed</span></template>
          </span>
          <span
            v-if="pending"
            class="sec__warn"
            data-tid="security-email-pending"
          >Link sent to {{ pending.address }}</span>
        </span>
        <span class="sec__actions">
          <button
            v-if="details && details.email_verified === false"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="resend"
          >
            Send the link again
          </button>
          <button
            v-if="pending"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="cancelEmail"
          >
            Keep the old address
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            data-tid="security-change-email"
            @click="open('email')"
          >
            Change…
          </button>
        </span>
      </div>

      <div class="acct-grow sec__row">
        <span class="acct-icon-box"><frame-icon
          name="key"
          small
        /></span>
        <span class="acct-grow__text">
          <b>Passkeys<template v-if="passkeys.length"> · {{ passkeys.length }}</template></b>
          <span data-tid="security-passkeys-line">{{ passkeysLine }}</span>
        </span>
        <span class="sec__actions">
          <button
            v-if="canAddPasskey"
            type="button"
            class="lib-btn lib-btn--sm"
            :disabled="busy"
            data-tid="security-add-passkey"
            @click="addPasskey"
          >
            Add
          </button>
          <span
            v-else
            class="acct-soon"
          >Not in this browser</span>
          <button
            v-if="passkeys.length"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost sec__more"
            :aria-expanded="showKeys ? 'true' : 'false'"
            aria-label="Your passkeys"
            data-tid="security-passkeys-open"
            @click="showKeys = !showKeys"
          >
            <frame-icon
              :name="showKeys ? 'chevronUp' : 'chevronRight'"
              small
            />
          </button>
        </span>
      </div>
      <template v-if="showKeys">
        <div
          v-for="key in passkeys"
          :key="key.id"
          class="acct-grow sec__sub"
          data-tid="security-passkey"
        >
          <span class="acct-icon-box sec__sub-icon"><frame-icon
            :name="keyIcon(key.name)"
            small
          /></span>
          <span class="acct-grow__text">
            <b class="sec__name">{{ key.name }}</b>
            <span>Added {{ day(key.created_at) }} · {{ key.last_used_at ? `used ${ago(key.last_used_at)}` : 'not used yet' }}</span>
            <span
              v-if="lastWay"
              class="acct-subtle"
              data-tid="security-last-way"
            >Your only way to sign in, so it can't be removed.</span>
          </span>
          <span class="sec__actions">
            <span
              v-if="renameMissing"
              class="acct-soon"
            >Renaming soon</span>
            <button
              v-else
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              @click="openRename(key)"
            >
              Rename
            </button>
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy || lastWay"
              :title="lastWay ? 'Your only way to sign in' : undefined"
              data-tid="security-remove-passkey"
              @click="removePasskey(key)"
            >
              Remove
            </button>
          </span>
        </div>
      </template>

      <div class="acct-grow sec__row">
        <span class="acct-icon-box"><frame-icon
          name="lock"
          small
        /></span>
        <span class="acct-grow__text">
          <b>Password</b>
          <span data-tid="security-password-line">{{ passwordLine }}</span>
        </span>
        <span class="sec__actions">
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            data-tid="security-change-password"
            @click="open('password')"
          >
            {{ hasPassword ? 'Change…' : 'Set…' }}
          </button>
        </span>
      </div>

      <!-- Only linked providers, until linking ships (storyboard answer). -->
      <div
        v-for="provider in linkedProviders"
        :key="provider.id"
        class="acct-grow sec__row"
        :data-tid="`security-provider-${provider.id}`"
      >
        <span class="acct-icon-box sec__letter">{{ provider.letter }}</span>
        <span class="acct-grow__text">
          <b>{{ provider.name }}</b>
          <span>{{ provider.line }}</span>
          <span
            v-if="lastWay"
            class="acct-subtle"
            data-tid="security-last-way"
          >Your only way to sign in, so it can't be unlinked.</span>
        </span>
        <span class="sec__actions">
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            :disabled="busy || lastWay"
            :title="lastWay ? 'Your only way to sign in' : undefined"
            :data-tid="`security-unlink-${provider.id}`"
            @click="unlink(provider.id)"
          >
            Unlink
          </button>
        </span>
      </div>
    </div>

    <!-- 3 · 2-step: where it's asked, with the recovery codes beside it. -->
    <div class="acct-gt">
      2-step
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="2-step"
    >
      <div class="acct-grow">
        <span class="acct-grow__text">
          <b>Code from an authenticator app</b>
          <span>Asked when you make a token that changes things, request your data, or confirm from away.</span>
        </span>
        <toggle-switch
          :value="twoStep"
          label="Code from an authenticator app"
          :disabled="busy"
          data-tid="security-two-step"
          @input="twoStep ? open('twoStepOff') : startTwoStep()"
        />
      </div>
      <div
        v-if="twoStep"
        class="acct-grow"
      >
        <span class="acct-grow__text">
          <b>Recovery codes</b>
          <span data-tid="security-codes-line"><template v-if="recoveryLeft !== null"><span class="sec__num">{{ recoveryLeft }} of 10</span> left. </template>Each works once if you lose your phone.</span>
        </span>
        <span
          v-if="recoveryMissing"
          class="acct-soon"
        >Coming soon</span>
        <button
          v-else
          type="button"
          class="lib-btn lib-btn--sm"
          :disabled="busy"
          data-tid="security-new-codes"
          @click="newCodes"
        >
          Make new codes…
        </button>
      </div>
    </div>

    <div class="acct-gt">
      Alerts
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="Alerts"
    >
      <div class="acct-grow">
        <span class="acct-grow__text">
          <b>Security emails</b>
          <span>New sign-ins, password and email changes, data requests. Always on.</span>
        </span>
        <span
          class="acct-grow__value"
          data-tid="security-emails"
        >Always</span>
      </div>
      <button
        type="button"
        class="acct-grow sec__open"
        :aria-expanded="showActivity ? 'true' : 'false'"
        data-tid="security-activity-open"
        @click="showActivity = !showActivity"
      >
        <span class="acct-grow__text"><b>Recent activity</b></span>
        <frame-icon
          :name="showActivity ? 'chevronUp' : 'chevronRight'"
          small
        />
      </button>
      <template v-if="showActivity">
        <div
          v-for="(line, i) in activity"
          :key="i"
          class="acct-grow sec__event"
          data-tid="security-activity"
        >
          <frame-icon
            :name="line.icon"
            small
          />
          <span class="acct-grow__text">
            <b>{{ line.text }}</b>
            <span>{{ line.when }}</span>
          </span>
        </div>
        <div
          v-if="!activity.length"
          class="acct-grow"
          data-tid="security-activity-empty"
        >
          <span class="acct-grow__text"><span>{{ eventsRead ? 'Nothing yet.' : 'Reading your activity…' }}</span></span>
        </div>
      </template>
    </div>

    <router-link
      :to="linkTo('sessions')"
      class="acct-xl"
      data-tid="security-devices-link"
    >
      <frame-icon
        name="devices"
        small
      />
      <span><b>Signed-in browsers and phones</b>, and signing out everywhere, are in Your devices.</span>
      <span class="acct-xl__go">Your devices ›</span>
    </router-link>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ message }}</span>
    </p>
    <p
      v-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>

    <!-- Change email -->
    <m3-dialog
      :value="dialog === 'email'"
      title="Change your email address"
      :persistent="busy"
      @close="close"
    >
      <p class="m3-dlg__text">
        It changes when you open the link we send.
      </p>
      <label class="m3-field">
        <span class="m3-field__label">New email address</span>
        <span class="m3-field__box"><input
          v-model="form.email"
          type="email"
          autocomplete="email"
          aria-label="New email address"
          @keydown.enter="changeEmail"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.email.includes('@') || busy"
          @click="changeEmail"
        >
          Send the link
        </button>
      </template>
    </m3-dialog>

    <!-- Change or set the password -->
    <m3-dialog
      :value="dialog === 'password'"
      :title="hasPassword ? 'Change your password' : 'Set a password'"
      :persistent="busy"
      @close="close"
    >
      <p class="m3-dlg__text">
        Changing it signs you out everywhere else.
      </p>
      <label class="m3-field">
        <span class="m3-field__label">New password</span>
        <span class="m3-field__box"><input
          v-model="form.next"
          type="password"
          autocomplete="new-password"
          aria-label="New password"
          :aria-describedby="dialogError ? 'security-password-error' : undefined"
        ></span>
        <span class="m3-dlg__note">At least 8 characters.</span>
      </label>
      <p
        v-if="dialogError"
        id="security-password-error"
        class="m3-dlg__error"
        role="alert"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="form.next.length < 8 || busy"
          @click="changePassword"
        >
          {{ hasPassword ? 'Change password' : 'Set password' }}
        </button>
      </template>
    </m3-dialog>

    <!-- Rename a passkey -->
    <m3-dialog
      :value="dialog === 'rename'"
      title="Rename this passkey"
      :persistent="busy"
      @close="close"
    >
      <label class="m3-field">
        <span class="m3-field__label">Name</span>
        <span class="m3-field__box"><input
          v-model="form.name"
          maxlength="64"
          aria-label="Name"
          @keydown.enter="renamePasskey"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.name.trim() || busy"
          @click="renamePasskey"
        >
          Rename
        </button>
      </template>
    </m3-dialog>

    <!-- Two-step: set up, then the recovery codes -->
    <m3-dialog
      :value="dialog === 'twoStep'"
      :title="codes.length ? 'Keep these recovery codes' : 'Scan with your authenticator app'"
      :persistent="busy || codes.length > 0"
      :closable="!codes.length"
      max-width="480"
      @close="close"
    >
      <template v-if="!codes.length">
        <div class="sec__qr">
          <app-qr-code
            v-if="setup"
            :value="setup.otpauth_url"
            :size="168"
          />
          <div class="sec__key">
            <span class="m3-dlg__note">Or type this key</span>
            <span class="sec__mono">{{ setupKey }}</span>
          </div>
        </div>
        <p class="m3-dlg__text">
          Then type the 6-digit code it shows.
        </p>
        <label class="m3-field">
          <span class="m3-field__label">Code from the app</span>
          <span class="m3-field__box m3-field__box--mono"><input
            v-model="form.code"
            inputmode="numeric"
            autocomplete="one-time-code"
            aria-label="Code from the app"
            data-tid="two-step-code"
            @keydown.enter="confirmTwoStep"
          ></span>
        </label>
      </template>
      <template v-else>
        <p class="m3-dlg__text">
          Each works once. Copy or save them now: they're shown only this once.
        </p>
        <div
          class="sec__codes"
          data-tid="recovery-codes"
        >
          <span
            v-for="c in codes"
            :key="c"
          >{{ c }}</span>
        </div>
      </template>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <template v-if="!codes.length">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="form.code.trim().length < 6 || busy"
            @click="confirmTwoStep"
          >
            Turn on
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="cbtn"
            data-tid="recovery-codes-copy"
            @click="copyCodes"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
          <button
            type="button"
            class="cbtn"
            data-tid="recovery-codes-save"
            @click="saveCodes"
          >
            Save
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="recovery-codes-done"
            @click="close"
          >
            I've saved them
          </button>
        </template>
      </template>
    </m3-dialog>

    <!-- Two-step off -->
    <m3-dialog
      :value="dialog === 'twoStepOff'"
      title="Turn off two-step sign-in?"
      tone="warn"
      eyebrow="Less protection"
      :persistent="busy"
      @close="close"
    >
      <p class="m3-dlg__text">
        A password alone gets in again. Type an authenticator or recovery code to confirm.
      </p>
      <label class="m3-field">
        <span class="m3-field__label">Code</span>
        <span class="m3-field__box m3-field__box--mono"><input
          v-model="form.code"
          autocomplete="one-time-code"
          aria-label="Code"
          @keydown.enter="twoStepOff"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Keep it on
        </button>
        <button
          type="button"
          class="cbtn cbtn--danger"
          :disabled="!form.code.trim() || busy"
          @click="twoStepOff"
        >
          Turn off
        </button>
      </template>
    </m3-dialog>

    <reauth-dialog
      v-bind="reauthProps"
      v-on="reauthOn"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import AccountReauthMixin from '@/mixins/account-reauth'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import AppQrCode from '@/components/ui/AppQrCode.vue'
import ReauthDialog from './ReauthDialog.vue'
import AcctMore from './AcctMore.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { accountApi, type AccountDetails, type Identity, type Me, type Passkey } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { accountState, describe, loadConfig, loadEvents, loadMe } from '@/services/account/state'
import { agoText, dayText, eventLine, nextProtectionStep, protectionSteps, providerName, securityHealth, signInWays, whenText, type AccountSectionId, type ProtectionStep, type SecurityHealth } from '@/services/account/model'
import { cancelledPasskey, createPasskey, deviceLabel, passkeysSupported } from '@/services/account/webauthn'

type Dialog = '' | 'email' | 'password' | 'rename' | 'twoStep' | 'twoStepOff'

/**
 * Sign-in and security (settings/account-security, 6 Nov): a protection
 * summary with the one thing to do next; every way to sign in in one list
 * (email, passkeys, password, then Google and Apple once linked); 2-step and
 * its recovery codes; security emails and the recent activity. Each change
 * asks "Confirm it's you" when the console wants it. The last way to sign
 * in can't be removed, and its button says why.
 */
@Component({ components: { M3Dialog, AppQrCode, ReauthDialog, AcctMore, ToggleSwitch } })
export default class AccountSecurity extends Mixins(AccountReauthMixin) {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  passkeys: Passkey[] = []
  identities: Identity[] = []
  dialog: Dialog = ''
  form = { email: '', current: '', next: '', code: '', name: '' }
  renaming: Passkey | null = null
  setup: { secret: string, otpauth_url: string } | null = null
  codes: string[] = []
  copied = false
  busy = false
  error = ''
  dialogError = ''
  message = ''
  renameMissing = false
  recoveryMissing = false
  showKeys = false
  showActivity = false

  created () {
    this.refresh()
  }

  refresh () {
    loadMe().catch(() => {})
    loadConfig().catch(() => {})
    loadEvents().catch(() => {})
    accountApi.passkeys().then(r => { this.passkeys = r.passkeys }).catch(() => {})
    accountApi.identities().then(r => { this.identities = r.identities }).catch(() => {})
  }

  get me (): Me | null {
    return accountState.me
  }

  get details (): AccountDetails | null {
    return accountState.me?.account ?? null
  }

  get email (): string {
    return this.details?.email ?? cloudState.account?.email ?? ''
  }

  get pending () {
    return this.details?.email_pending ?? null
  }

  get health (): SecurityHealth {
    return securityHealth(this.me as Me)
  }

  get hasPassword (): boolean {
    return this.me?.sign_in?.password ?? this.details?.has_password !== false
  }

  get twoStep (): boolean {
    return this.me?.sign_in?.two_step ?? this.details?.two_step ?? false
  }

  get recoveryLeft (): number | null {
    const left = this.me?.sign_in?.recovery_left
    return typeof left === 'number' ? left : null
  }

  get steps (): ProtectionStep[] {
    return this.me ? protectionSteps(this.me) : []
  }

  get stepsDone (): number {
    return this.steps.filter(step => step.done).length
  }

  get next (): ProtectionStep | null {
    return this.me ? nextProtectionStep(this.me) : null
  }

  /** One way in left: it can't be removed (account-security, rule 1). */
  get lastWay (): boolean {
    const ways = this.me?.sign_in ? signInWays(this.me) : (this.hasPassword ? 1 : 0) + this.passkeys.length + this.identities.length
    return ways <= 1
  }

  get passkeysLine (): string {
    if (!this.passkeys.length) return 'Face, fingerprint or screen lock'
    return this.passkeys.map(key => key.name).join(', ')
  }

  get eventsRead (): boolean {
    return accountState.events !== null
  }

  get activity (): Array<{ icon: string, text: string, when: string }> {
    return (accountState.events ?? []).slice(0, 12).map(e => {
      const line = eventLine(e)
      return { text: line.text, icon: line.icon === 'signOut' ? 'logout' : line.icon, when: whenText(e.at) }
    })
  }

  get canAddPasskey (): boolean {
    return passkeysSupported()
  }

  get passwordLine (): string {
    if (!this.hasPassword) return 'Not set'
    const changed = (accountState.events ?? []).find(e => e.kind === 'password_changed' || e.kind === 'password_reset')
    return changed ? `Set · changed ${dayText(changed.at)}` : 'Set'
  }

  get linkedProviders () {
    return this.providers.filter(provider => provider.linked)
  }

  get providers () {
    return (['google', 'apple'] as const).map(id => {
      const linked = this.identities.find(i => i.provider === id)
      return {
        id,
        name: providerName(id),
        letter: id === 'apple' ? 'A' : 'G',
        linked: !!linked,
        line: linked
          ? `Linked${linked.email ? ` · ${linked.email}` : ''}`
          : 'Not linked'
      }
    })
  }

  day (seconds: number): string {
    return dayText(seconds)
  }

  ago (seconds: number): string {
    const text = agoText(seconds)
    return text === 'now' ? 'just now' : text
  }

  keyIcon (name: string): string {
    return /iphone|android|phone|pixel/i.test(name) ? 'phone' : 'laptop'
  }

  open (dialog: Dialog) {
    this.form = { email: '', current: '', next: '', code: '', name: '' }
    this.dialogError = ''
    this.dialog = dialog
  }

  close () {
    if (this.busy) return
    this.dialog = ''
    this.codes = []
    this.setup = null
  }

  async run (what: () => Promise<unknown>, inDialog = false): Promise<boolean> {
    this.busy = true
    this.error = ''
    this.dialogError = ''
    this.message = ''
    try {
      await what()
      return true
    } catch (error) {
      if (inDialog) this.dialogError = describe(error)
      else this.error = describe(error)
      return false
    } finally {
      this.busy = false
    }
  }

  async resend () {
    if (await this.run(() => accountApi.resendVerification())) this.message = `We've sent a new link to ${this.email}.`
  }

  async cancelEmail () {
    const done = await this.run(async () => {
      try {
        await accountApi.cancelEmailChange()
      } catch (error) {
        if (isMissing(error)) throw new Error('Cancelling a change isn\'t possible yet. The link stops working after three days.')
        throw error
      }
    })
    if (done) loadMe().catch(() => {})
  }

  async changeEmail () {
    const email = this.form.email.trim()
    let sent = false
    await this.run(async () => {
      sent = (await this.withReauth(r => accountApi.changeEmail(email, r), { action: 'Send the link' })) !== null
    }, true)
    if (sent) {
      this.dialog = ''
      this.message = `We've sent a link to ${email}. Your address changes when you open it.`
      loadMe().catch(() => {})
    }
  }

  async changePassword () {
    const next = this.form.next
    let changed = false
    await this.run(async () => {
      changed = (await this.withReauth(r => accountApi.changePassword(next, r), { action: 'Change password' })) !== null
    }, true)
    if (changed) {
      this.dialog = ''
      this.message = 'Your password is changed. Every other device is signed out.'
      this.refresh()
    }
  }

  async addPasskey () {
    const name = deviceLabel()
    await this.run(async () => {
      try {
        const { ceremony_id: ceremony, options } = await accountApi.passkeyCreateOptions()
        const credential = await createPasskey(options.publicKey)
        const added = await this.withReauth(r => accountApi.passkeyCreate(ceremony, credential, name, r), { action: 'Add passkey' })
        if (added) this.message = `Passkey added: ${added.name}. It works on this device from now on.`
      } catch (error) {
        if (cancelledPasskey(error)) return
        throw error
      }
    })
    this.refresh()
  }

  openRename (key: Passkey) {
    this.renaming = key
    this.open('rename')
    this.form.name = key.name
  }

  async renamePasskey () {
    const key = this.renaming
    if (!key) return
    const name = this.form.name.trim()
    let renamed = false
    const done = await this.run(async () => {
      try {
        const result = await this.withReauth(r => accountApi.renamePasskey(key.id, name, r), { action: 'Rename passkey' })
        renamed = result !== null
      } catch (error) {
        if (isMissing(error)) {
          this.renameMissing = true
          throw new Error('Renaming passkeys comes soon.')
        }
        throw error
      }
    }, true)
    if (done && renamed) {
      this.dialog = ''
      key.name = name
    }
  }

  async removePasskey (key: Passkey) {
    if (this.lastWay) return
    const sure = await this.$confirm(`"${key.name}" won't sign in to your account any more. The passkey stays on the device until you delete it there.`, {
      title: 'Remove this passkey?',
      buttonTrueText: 'Remove',
      danger: true
    })
    if (!sure) return
    await this.run(() => this.withReauth(r => accountApi.removePasskey(key.id, r), { action: 'Remove passkey', danger: true }))
    this.refresh()
  }

  async unlink (provider: string) {
    if (this.lastWay) return
    const sure = await this.$confirm(`You'll sign in with ${this.othersLine(provider)}.`, {
      title: `Unlink ${providerName(provider)}?`,
      buttonTrueText: 'Unlink',
      danger: true
    })
    if (!sure) return
    await this.run(() => this.withReauth(r => accountApi.unlinkIdentity(provider, r), { action: 'Unlink', danger: true }))
    this.refresh()
  }

  /** What's left once a provider goes: "a passkey or your password". */
  othersLine (provider: string): string {
    const rest: string[] = []
    if (this.passkeys.length || (this.me?.sign_in?.passkeys ?? 0) > 0) rest.push('a passkey')
    if (this.hasPassword) rest.push('your password')
    for (const p of this.linkedProviders) if (p.id !== provider) rest.push(p.name)
    return rest.join(' or ') || 'another way in'
  }

  get setupKey (): string {
    return (this.setup?.secret ?? '').replace(/(.{4})/g, '$1 ').trim()
  }

  async startTwoStep () {
    this.setup = null
    await this.run(async () => {
      const setup = await this.withReauth(r => accountApi.totpBegin(r), { action: 'Continue' })
      if (setup) {
        this.open('twoStep')
        this.setup = setup
      }
    })
  }

  async confirmTwoStep () {
    const code = this.form.code.replace(/\s+/g, '')
    await this.run(async () => {
      const { recovery_codes: codes } = await accountApi.totpConfirm(code)
      this.codes = codes
    }, true)
    loadMe().catch(() => {})
  }

  async twoStepOff () {
    const done = await this.run(() => accountApi.totpOff(this.form.code.replace(/\s+/g, '')), true)
    if (done) {
      this.dialog = ''
      this.message = 'Two-step sign-in is off.'
      loadMe().catch(() => {})
    }
  }

  async newCodes () {
    const sure = await this.$confirm('The codes you have now stop working, and you get ten new ones.', {
      title: 'Make new recovery codes?',
      buttonTrueText: 'Make new codes'
    })
    if (!sure) return
    await this.run(async () => {
      try {
        const answer = await this.withReauth(r => accountApi.newRecoveryCodes(r), { action: 'Make new codes' })
        if (answer) {
          this.form.code = ''
          this.codes = answer.recovery_codes
          this.dialog = 'twoStep'
        }
      } catch (error) {
        if (isMissing(error)) {
          this.recoveryMissing = true
          return
        }
        throw error
      }
    })
    loadMe().catch(() => {})
  }

  /** Saved as a file on this device: never sent anywhere, never in an address bar. */
  saveCodes () {
    const blob = new Blob([`Muon3D recovery codes\nEach works once.\n\n${this.codes.join('\n')}\n`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'muon3d-recovery-codes.txt'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async copyCodes () {
    try {
      await navigator.clipboard.writeText(this.codes.join('\n'))
      this.copied = true
    } catch {
      this.copied = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .sec__summary {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 16px 18px;
  }

  .sec__summary-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;

    b {
      color: var(--m3d-text);
      font-size: 15px;
      font-weight: 600;
    }
  }

  .sec__summary--good .sec__summary-icon {
    color: var(--m3d-success, #10b981);
  }

  .sec__summary--weak .sec__summary-icon {
    color: var(--m3d-warning, #f59e0b);
  }

  .sec__bar {
    display: flex;
    grid-column: 1 / -1;
    gap: 4px;
  }

  .sec__bar-step {
    flex: 1 1 0;
    height: 6px;
    border-radius: 3px;
    background: var(--m3d-surface-2);
  }

  .sec__bar-step--done {
    background: var(--m3d-success, #10b981);
  }

  .sec__row {
    flex-wrap: wrap;
  }

  .sec__actions {
    display: inline-flex;
    flex: none;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-left: auto;
  }

  .sec__more {
    padding: 0 6px !important;
  }

  .sec__open {
    width: 100%;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .sec__event {
    min-height: 44px;
    padding-left: 24px;
  }

  @media (max-width: 760px) {
    .sec__actions {
      margin-left: 54px;
    }
  }

  .sec__method {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 0;
  }

  .sec__sub {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 8px 0 8px 54px;
    border-top: 0 !important;
  }

  .sec__sub-icon {
    width: 32px;
    height: 32px;
  }

  // On a phone the words take the width and the buttons go underneath.
  @media (max-width: 760px) {
    .sec__method {
      grid-template-columns: 40px minmax(0, 1fr);
    }

    .sec__sub {
      grid-template-columns: 32px minmax(0, 1fr);
      padding-left: 20px;
    }

    .sec__method > :nth-child(3),
    .sec__sub > :nth-child(3) {
      grid-column: 2;
      justify-self: start;
    }
  }

  .sec__name {
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .sec__letter {
    color: var(--m3d-text);
    font-size: 16px;
    font-weight: 700;
  }

  .sec__ok {
    color: var(--m3d-success);
  }

  .sec__warn {
    color: var(--m3d-warning) !important;
  }

  .sec__num {
    font-variant-numeric: tabular-nums;
  }

  .sec__qr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  .sec__key {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sec__mono {
    font-family: var(--m3d-font-mono);
    font-size: 14px;
    letter-spacing: 0.04em;
  }

  .sec__codes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 16px;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    font-family: var(--m3d-font-mono);
    font-size: 14px;
  }
</style>
