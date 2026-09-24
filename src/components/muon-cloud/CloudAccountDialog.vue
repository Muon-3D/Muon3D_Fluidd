<template>
  <v-dialog
    v-model="open"
    max-width="420"
  >
    <v-card class="muon-cloud-dialog">
      <v-card-title class="pb-1">
        {{ mode === 'sign-in' ? 'Sign in to Muon3D' : 'Create your Muon3D account' }}
      </v-card-title>
      <v-card-subtitle class="pt-1">
        Reach your linked printers from anywhere. Printers on this network keep working without an account.
      </v-card-subtitle>

      <v-card-text>
        <v-form
          ref="form"
          @submit.prevent="submit"
        >
          <v-text-field
            v-if="mode === 'sign-up'"
            v-model="name"
            label="Name"
            autocomplete="name"
            outlined
            dense
          />
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            autocomplete="email"
            outlined
            dense
            autofocus
          />
          <v-text-field
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
          >
            {{ error }}
          </v-alert>
          <app-btn
            type="submit"
            color="primary"
            block
            :loading="busy"
          >
            {{ mode === 'sign-in' ? 'Sign in' : 'Create account' }}
          </app-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center pb-4">
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
import { signIn, signUp } from '@/services/muon-cloud/state'

@Component({})
export default class CloudAccountDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: 'sign-in' })
  readonly initialMode!: 'sign-in' | 'sign-up'

  mode: 'sign-in' | 'sign-up' = 'sign-in'
  name = ''
  email = ''
  password = ''
  showPassword = false
  busy = false
  error: string | null = null
  icons = { eye: '$eye', eyeOff: '$eyeOff' }

  created () {
    this.mode = this.initialMode
  }

  async submit () {
    this.error = null
    this.busy = true
    try {
      if (this.mode === 'sign-in') await signIn(this.email, this.password)
      else await signUp(this.email, this.password, this.name)
      this.password = ''
      this.$emit('signed-in')
      this.open = false
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.busy = false
    }
  }
}
</script>
