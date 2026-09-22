<template>
  <managed-preview-shell
    title="Managed printers"
    description="This route is ready for managed-console navigation, but printer inventory and access are not connected in this build."
  >
    <section class="managed-surface">
      <header class="fleet-header">
        <div>
          <p class="fleet-header__eyebrow">
            {{ workspaceLabel }}
          </p>
          <h2>Fleet unavailable</h2>
          <p>There are no managed printers to display until the managed fleet service is connected.</p>
        </div>
        <v-btn
          outlined
          small
          @click="signOut"
        >
          Sign out
        </v-btn>
      </header>

      <div
        class="managed-contract-note"
        role="note"
      >
        <strong>Preview-only route</strong>
        <span>Opening a managed printer requires an application-provided session boundary. This route does not start a local or managed printer connection.</span>
      </div>

      <p
        v-if="state.error"
        class="managed-error"
        role="alert"
      >
        {{ state.error }}
      </p>
      <p class="managed-empty">
        Managed printer inventory is unavailable.
      </p>

      <div class="managed-action-row">
        <router-link
          class="fleet-link"
          :to="{ name: 'Link printer' }"
        >
          View linking status
        </router-link>
        <v-btn
          data-testid="managed-account-action"
          color="primary"
          :disabled="!canOpenPrinter"
          @click="openConsole"
        >
          Open managed console
        </v-btn>
      </div>
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
export default class ManagedFleet extends Vue {
  state = managedConsoleState

  get workspaceLabel () {
    return this.state.session?.workspaceName || 'Managed preview'
  }

  get canOpenPrinter () {
    return managedPreviewState.canOpenSelectedPrinter
  }

  signOut () {
    managedPreviewState.signOut()
    this.$router.push({ name: 'Managed sign in' })
  }

  async openConsole () {
    await managedPreviewState.openSelectedPrinter()
  }
}
</script>

<style lang="scss" scoped>
.fleet-header {
  display: flex;
  justify-content: space-between;
  gap: var(--m3d-space-4);
  margin-bottom: var(--m3d-space-4);
}

.fleet-header h2,
.fleet-header p {
  margin: 0;
}

.fleet-header__eyebrow {
  margin-bottom: var(--m3d-space-1) !important;
  color: var(--m3d-accent) !important;
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-eyebrow);
  text-transform: uppercase;
}

.fleet-header p:not(.fleet-header__eyebrow) {
  margin-top: var(--m3d-space-2);
  color: var(--m3d-text-muted);
}

.fleet-link {
  color: var(--m3d-accent);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-caps);
  text-decoration: none;
  text-transform: uppercase;
}

@media (max-width: 600px) {
  .fleet-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
