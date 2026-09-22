<template>
  <managed-preview-shell
    title="Enter the managed-console preview"
    description="Exercise the managed-console contract while retaining Fluidd’s existing local printer controls."
  >
    <section
      class="managed-surface managed-auth"
      aria-labelledby="managed-sign-in-form"
    >
      <div
        class="managed-contract-note"
        role="note"
      >
        <strong>Preview-only state</strong>
        <span>No account request leaves this browser, and the email and password are used only to validate this screen.</span>
      </div>

      <form
        id="managed-sign-in-form"
        class="managed-form"
        @submit.prevent="submit"
      >
        <label class="managed-field">
          Email
          <input
            v-model.trim="email"
            autocomplete="email"
            inputmode="email"
            type="email"
            required
          >
        </label>
        <label class="managed-field">
          Password
          <input
            v-model="password"
            autocomplete="current-password"
            minlength="8"
            type="password"
            required
          >
        </label>
        <p
          v-if="state.error"
          class="managed-error"
          role="alert"
        >
          {{ state.error }}
        </p>
        <div class="managed-action-row">
          <span class="managed-auth__hint">Local printer access does not require a managed account.</span>
          <v-btn
            color="primary"
            type="submit"
          >
            Enter preview
          </v-btn>
        </div>
      </form>
    </section>
  </managed-preview-shell>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ManagedPreviewShell from '@/components/muon/ManagedPreviewShell.vue'
import { managedConsoleState, managedPreviewState } from '@/store/managed/contractMock'

@Component({ components: { ManagedPreviewShell } })
export default class ManagedSignIn extends Vue {
  email = ''
  password = ''
  state = managedConsoleState

  submit () {
    if (!managedPreviewState.signIn(this.email, this.password)) return
    const next = typeof this.$route.query.next === 'string' && this.$route.query.next.startsWith('/')
      ? this.$route.query.next
      : '/onboarding'
    this.$router.push(next)
  }
}
</script>

<style lang="scss" scoped>
.managed-auth {
  max-width: 540px;
}

.managed-auth__hint {
  color: var(--m3d-text-muted);
  font-size: var(--m3d-text-xs);
}
</style>
