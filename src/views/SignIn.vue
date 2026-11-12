<template>
  <auth-card
    class="muon-sign-in"
    wordmark
    fill
    :title="title"
    :sub="subtitle"
  >
    <v-alert
      v-if="notice"
      type="info"
      dense
      text
      data-tid="sign-in-notice"
    >
      {{ notice }}
    </v-alert>

    <div
      v-if="mode === 'sign-in' || mode === 'sign-up'"
      class="muon-sign-in__seg"
      role="tablist"
      aria-label="Sign in or create an account"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'sign-in' ? 'true' : 'false'"
        :class="{ 'is-on': mode === 'sign-in' }"
        data-tid="sign-in-tab"
        @click="setMode('sign-in')"
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'sign-up' ? 'true' : 'false'"
        :class="{ 'is-on': mode === 'sign-up' }"
        data-tid="sign-up-tab"
        @click="setMode('sign-up')"
      >
        Create account
      </button>
    </div>

    <template v-if="mode === 'sign-in' && passkeys">
      <app-btn
        outlined
        block
        large
        class="muon-sign-in__passkey"
        :loading="busy && passkeyBusy"
        :disabled="busy"
        data-tid="sign-in-passkey"
        @click="passkey"
      >
        <v-icon
          left
          small
        >
          $key
        </v-icon>
        Sign in with a passkey
      </app-btn>
      <div class="muon-sign-in__or">
        or
      </div>
    </template>

    <v-form
      v-if="mode !== 'sent'"
      ref="form"
      class="muon-sign-in__form"
      @submit.prevent="submit"
    >
      <template v-if="mode === 'code'">
        <v-text-field
          v-model="code"
          label="Code"
          inputmode="numeric"
          autocomplete="one-time-code"
          hint="Six digits from your authenticator app, or a recovery code."
          persistent-hint
          outlined
          dense
          autofocus
          data-tid="sign-in-code"
          class="mb-3"
        />
      </template>
      <template v-else>
        <v-text-field
          v-if="mode === 'sign-up'"
          v-model="name"
          label="Name"
          autocomplete="name"
          autofocus
          outlined
          dense
        />
        <v-text-field
          v-if="mode === 'sign-up'"
          v-model="age"
          label="Your age"
          type="text"
          inputmode="numeric"
          hint="Private. Confirm once; accounts require age 13 or over."
          persistent-hint
          outlined
          dense
          data-tid="sign-up-age"
          :aria-describedby="ageError ? 'sign-up-age-error' : undefined"
          :aria-invalid="ageError ? 'true' : undefined"
        />
        <p
          v-if="ageError"
          id="sign-up-age-error"
          class="error--text text-caption"
          data-tid="sign-up-age-error"
          role="alert"
        >
          {{ ageError }}
        </p>
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email webauthn"
          outlined
          dense
          :autofocus="mode !== 'sign-up' && !passkeys"
          data-tid="sign-in-email"
        />
        <v-text-field
          v-if="mode !== 'forgot'"
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'"
          :hint="mode === 'sign-up' ? 'At least 8 characters' : ''"
          outlined
          dense
          data-tid="sign-in-password"
        >
          <template
            v-if="mode === 'sign-in'"
            #append
          >
            <button
              type="button"
              class="muon-sign-in__forgot"
              data-tid="sign-in-forgot"
              @click="setMode('forgot')"
            >
              Forgot?
            </button>
          </template>
        </v-text-field>
      </template>
      <v-alert
        v-if="error"
        type="error"
        dense
        text
        class="mb-3"
        data-tid="sign-in-error"
        role="alert"
        aria-live="assertive"
      >
        {{ error }}
      </v-alert>
      <app-btn
        type="submit"
        color="primary"
        block
        large
        class="muon-sign-in__submit"
        :loading="busy && !passkeyBusy"
        :disabled="busy"
        data-tid="sign-in-submit"
      >
        {{ submitText }}
      </app-btn>
    </v-form>

    <p
      v-else
      class="mb-0"
      data-tid="sign-in-sent"
    >
      If there's an account for {{ email }}, we've sent it a link to choose a new password. It works once, for an hour.
    </p>

    <template #alt>
      <template v-if="mode === 'sign-in'">
        Printing on this network only?
        <router-link
          to="/login"
          data-tid="sign-in-printer"
        >
          Sign in to a printer instead
        </router-link>
      </template>
      <a
        v-else-if="mode !== 'sign-up'"
        href="#"
        data-tid="sign-in-back"
        @click.prevent="setMode('sign-in')"
      >
        Back to sign in
      </a>
    </template>
  </auth-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AuthCard from '@/components/account/AuthCard.vue'
import { safeContinue } from '@/services/muon-cloud/centralLogin'
import { AccountError } from '@/services/account/client'
import { codeSignIn, finishSignIn, forgotPassword, passkeySignIn, passwordSignIn, signUp } from '@/services/account/sign-in'
import { cancelledPasskey, passkeysSupported } from '@/services/account/webauthn'

type Mode = 'sign-in' | 'sign-up' | 'code' | 'forgot' | 'sent'

@Component({ components: { AuthCard } })
export default class SignIn extends Vue {
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
  error: string | null = null
  ageError = ''

  /** Where the console carries on after the handoff, if it is one it may. */
  get continuePath (): string | null {
    return safeContinue(this.$route.query.continue)
  }

  get notice (): string | null {
    if (this.$route.query.error === 'handoff_expired') return 'That sign-in took too long to finish. Sign in again.'
    return null
  }

  get passkeys (): boolean {
    return passkeysSupported()
  }

  get title (): string {
    switch (this.mode) {
      case 'sign-up': return 'Create your Muon3D account'
      case 'code': return 'Enter your code'
      case 'forgot': return 'Forgot your password?'
      case 'sent': return 'Check your email'
      default: return 'Sign in to Muon3D'
    }
  }

  get subtitle (): string {
    switch (this.mode) {
      case 'code': return 'This account has two-step sign-in.'
      case 'forgot': return 'We\'ll email you a link to choose a new one.'
      case 'sent': return ''
      default: return 'One account for your printers, the slicer and your models.'
    }
  }

  get submitText (): string {
    switch (this.mode) {
      case 'sign-up': return 'Create account'
      case 'code': return 'Continue'
      case 'forgot': return 'Send the link'
      default: return 'Continue'
    }
  }

  setMode (mode: Mode) {
    this.mode = mode
    this.error = null
    this.ageError = ''
    if (mode !== 'code') {
      this.code = ''
      this.mfaToken = ''
    }
  }

  /** Overridable in tests: a full-page navigation. */
  go (url: string) {
    window.location.assign(url)
  }

  async passkey () {
    this.error = null
    this.busy = true
    this.passkeyBusy = true
    try {
      await this.finish(await passkeySignIn())
    } catch (error) {
      this.busy = false
      this.passkeyBusy = false
      if (!cancelledPasskey(error)) this.error = (error as Error).message
    }
  }

  async submit () {
    this.error = null
    this.busy = true
    try {
      switch (this.mode) {
        case 'forgot':
          await forgotPassword(this.email.trim())
          this.busy = false
          this.mode = 'sent'
          return
        case 'code':
          await this.finish(await codeSignIn(this.mfaToken, this.code))
          return
        case 'sign-up':
          this.ageError = validateAge(this.age)
          if (this.ageError) { this.busy = false; return }
          await this.finish(await signUp(this.email.trim(), this.password, this.name.trim(), Number(this.age)))
          return
        default:
          await this.finish(await passwordSignIn(this.email.trim(), this.password))
      }
    } catch (error) {
      this.busy = false
      const mfa = error instanceof AccountError ? error.mfaToken : null
      if (mfa) {
        // The password was right; the code finishes it.
        this.password = ''
        this.mfaToken = mfa
        this.mode = 'code'
        return
      }
      this.error = (error as Error).message
    }
  }

  /** The handoff, then the page's own session ends, then on to the console. */
  async finish (token: string) {
    this.password = ''
    this.code = ''
    this.go(await finishSignIn(token, this.continuePath))
  }
}

function validateAge (age: string): string {
  if (!/^\d+$/.test(age)) return 'Enter your age as a whole number.'
  return Number(age) >= 13 && Number(age) <= 120 ? '' : 'Age must be between 13 and 120.'
}
</script>

<style lang="scss" scoped>
.muon-sign-in__seg {
  display: flex;
  gap: 2px;
  margin-bottom: 18px;
  padding: 3px;
  border-radius: 10px;
  background: var(--m3d-fill-2);

  button {
    flex: 1;
    padding: 6px 12px;
    border-radius: 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  button.is-on {
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    box-shadow: 0 2px 6px rgb(0 0 0 / 30%);
  }
}

.muon-sign-in__or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--m3d-text-subtle);
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--m3d-border);
  }
}

.muon-sign-in__forgot {
  color: var(--m3d-text-muted);
  font-size: 0.8125rem;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    color: var(--m3d-accent);
  }
}

.muon-sign-in__submit {
  margin-top: 8px;
}
</style>
