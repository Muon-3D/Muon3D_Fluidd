<template>
  <managed-preview-shell
    title="Link a managed printer"
    description="The route and readiness checks are in place; managed discovery and linking are intentionally unavailable."
  >
    <section class="managed-surface">
      <div
        class="managed-contract-note"
        role="note"
      >
        <strong>Preview-only route</strong>
        <span>No discovery request, pairing request, approval flow, or printer connection is started here.</span>
      </div>

      <h2>Linking unavailable</h2>
      <p class="link-description">
        Connect a managed account and printer-linking service before this route can offer a printer for selection.
      </p>
      <div class="managed-action-row">
        <router-link
          class="link-status__fleet"
          :to="{ name: 'Fleet' }"
        >
          Back to managed printers
        </router-link>
        <v-btn
          data-testid="printer-link-action"
          outlined
          disabled
        >
          Managed discovery unavailable
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

@Component({
  components: {
    ManagedCapabilitySummary,
    ManagedPreviewShell
  }
})
export default class ManagedPrinterLink extends Vue {}
</script>

<style lang="scss" scoped>
h2,
.link-description {
  margin: 0;
}

.link-description {
  max-width: 640px;
  margin-top: var(--m3d-space-2);
  color: var(--m3d-text-muted);
  line-height: var(--m3d-leading-relaxed);
}

.link-status__fleet {
  color: var(--m3d-accent);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-caps);
  text-decoration: none;
  text-transform: uppercase;
}
</style>
