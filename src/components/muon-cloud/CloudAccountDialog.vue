<template>
  <v-dialog
    v-model="open"
    max-width="420"
  >
    <v-card class="muon-cloud-dialog">
      <v-card-title class="pb-1">
        {{ mfaToken ? 'Enter your code' : mode === 'sign-in' ? 'Sign in to Muon3D' : 'Create your Muon3D account' }}
      </v-card-title>
      <v-card-subtitle class="pt-1">
        Reach your linked printers from anywhere. Printers on this network keep working without an account.
      </v-card-subtitle>

      <v-card-text v-if="redirecting">
        Taking you to the Muon3D sign-in…
      </v-card-text>

      <v-card-text v-else>
        <v-form
          ref="form"
          @submit.prevent="submit"
        >
          <v-text-field
            v-if="mfaToken"
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
          <v-text-field
            v-if="!mfaToken && mode === 'sign-up'"
            v-model="name"
            label="Name"
            autocomplete="name"
            autofocus
            outlined
            dense
          />
          <v-text-field
            v-if="!mfaToken && mode === 'sign-up'"
            v-model="age"
            label="Your age"
            type="text"
            inputmode="numeric"
            hint="Private. Confirm once; accounts require age 13 or over."
            persistent-hint
            outlined
            dense
            data-tid="sign-up-age"
            :aria-describedby="ageError ? 'dialog-sign-up-age-error' : undefined"
            :aria-invalid="ageError ? 'true' : undefined"
          />
          <p
            v-if="ageError"
            id="dialog-sign-up-age-error"
            class="error--text text-caption"
            data-tid="sign-up-age-error"
            role="alert"
          >
            {{ ageError }}
          </p>
          <v-text-field
            v-if="!mfaToken"
            v-model="email"
            label="Email"
            type="email"
            autocomplete="email"
            outlined
            dense
            :autofocus="mode === 'sign-in'"
          />
          <v-text-field
            v-if="!mfaToken"
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'"
            :hint="mode === 'sign-up' ? 'At least 8 characters' : ''"
            :append-icon="showPassword ? icons.eyeOff : icons.eye"
            outlined
            dense
            @click:append="showPassword = !showPassword"
          />
          <v-alert
            v-if="error"
            type="error"
            dense
            text
            class="mb-3"
            role="alert"
            aria-live="assertive"
          >
            {{ error }}
          </v-alert>
          <app-btn
            type="submit"
            color="primary"
            block
            :loading="busy"
          >
            {{ mfaToken ? 'Continue' : mode === 'sign-in' ? 'Sign in' : 'Create account' }}
          </app-btn>
        </v-form>
      </v-card-text>

      <v-card-actions
        v-if="mfaToken"
        class="justify-center pb-4"
      >
        <v-btn
          text
          small
          color="primary"
          data-tid="sign-in-code-back"
          @click="mfaToken = ''; code = ''; error = null"
        >
          Start again
        </v-btn>
      </v-card-actions>

      <v-card-actions
        v-else-if="!redirecting"
        class="justify-center pb-4"
      >
        <span class="text-body-2 text--secondary">
          {{ mode === 'sign-in' ? 'New to Muon3D?' : 'Already have an account?' }}
        </span>
        <v-btn
          text
          small
          color="primary"
          @click="mode = mode === 'sign-in' ? 'sign-up' : 'sign-in'; error = null"
        >
          {{ mode === 'sign-in' ? 'Create an account' : 'Sign in' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'
import { signIn, signInWithCode, signUp } from '@/services/muon-cloud/state'
import { centralLoginEnabled, startCentralSignIn } from '@/services/muon-cloud/centralLogin'

@Component({})
export default class CloudAccountDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: 'sign-in' })
  readonly initialMode!: 'sign-in' | 'sign-up'

  mode: 'sign-in' | 'sign-up' = 'sign-in'
  age = ''
  name = ''
  email = ''
  password = ''
  /** Set once the password was right and the account wants its authenticator code. */
  mfaToken = ''
  code = ''
  showPassword = false
  busy = false
  error: string | null = null
  ageError = ''
  icons = { eye: '$eye', eyeOff: '$eyeOff' }

  redirecting = false

  created () {
    this.mode = this.initialMode
    // Served by the console, sign-in goes through its /authorize (WEB-12):
    // one sign-in for every Muon3D page, kept by the console's browser
    // session rather than by this page.
    if (centralLoginEnabled()) {
      this.redirecting = true
      startCentralSignIn({ silent: false }).catch((error) => {
        this.redirecting = false
        this.error = (error as Error).message
      })
    }
  }

  async submit () {
    this.error = null
    this.ageError = ''
    if (this.mode === 'sign-up') {
      this.ageError = validateAge(this.age)
      if (this.ageError) return
    }
    this.busy = true
    try {
      if (this.mfaToken) {
        await signInWithCode(this.mfaToken, this.code)
      } else if (this.mode === 'sign-in') {
        const mfa = await signIn(this.email, this.password)
        if (mfa) {
          // The password was right; the code finishes it.
          this.password = ''
          this.mfaToken = mfa
          this.code = ''
          return
        }
      } else {
        await signUp(this.email, this.password, this.name, Number(this.age))
      }
      this.password = ''
      this.code = ''
      this.mfaToken = ''
      this.$emit('signed-in')
      this.open = false
    } catch (error) {
      this.error = (error as Error).message
      // A wrong code is the console's 401 as is an expired sign-in: the box
      // stays either way, and "Start again" is there for the expired one.
      if (this.mfaToken) this.code = ''
    } finally {
      this.busy = false
    }
  }
}

function validateAge (age: string): string {
  if (!/^\d+$/.test(age)) return 'Enter your age as a whole number.'
  return Number(age) >= 13 && Number(age) <= 120 ? '' : 'Age must be between 13 and 120.'
}
</script>
