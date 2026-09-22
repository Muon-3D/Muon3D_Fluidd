<template>
  <managed-preview-shell
    title="Set up your workspace"
    description="Complete this preview-only step before viewing the managed route boundary."
  >
    <section class="managed-surface onboarding-card">
      <p class="onboarding-card__step">
        Preview checkpoint 1 of 2
      </p>
      <h2>Name this preview workspace</h2>
      <p>
        This label exists only in browser memory. It does not create an account or modify a printer.
      </p>
      <form
        class="managed-form"
        @submit.prevent="submit"
      >
        <label class="managed-field">
          Workspace name
          <input
            v-model="workspaceName"
            autocomplete="organization"
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
          <router-link
            class="onboarding-card__back"
            :to="{ name: 'Managed sign in' }"
          >
            Back
          </router-link>
          <v-btn
            data-testid="onboarding-action"
            color="primary"
            type="submit"
          >
            Continue to fleet
          </v-btn>
        </div>
      </form>
    </section>

    <managed-capability-summary />
  </managed-preview-shell>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ManagedCapabilitySummary from '@/components/muon/ManagedCapabilitySummary.vue'
import ManagedPreviewShell from '@/components/muon/ManagedPreviewShell.vue'
import { managedConsoleState, managedPreviewState } from '@/store/managed/contractMock'

@Component({
  components: {
    ManagedCapabilitySummary,
    ManagedPreviewShell
  }
})
export default class ManagedOnboarding extends Vue {
  state = managedConsoleState
  workspaceName = managedConsoleState.session?.workspaceName ?? ''

  submit () {
    if (managedPreviewState.completeOnboarding(this.workspaceName)) {
      this.$router.push({ name: 'Fleet' })
    }
  }
}
</script>

<style lang="scss" scoped>
.onboarding-card {
  max-width: 620px;
}

.onboarding-card__step {
  color: var(--m3d-accent);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-caps);
  text-transform: uppercase;
}

h2 {
  margin: 10px 0;
}

p {
  max-width: 660px;
  margin: 0;
  color: var(--m3d-text-muted);
  line-height: var(--m3d-leading-relaxed);
}

.onboarding-card__back {
  color: var(--m3d-text-muted);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-caps);
  text-decoration: none;
  text-transform: uppercase;
}
</style>
