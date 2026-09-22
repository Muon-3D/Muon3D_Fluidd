<template>
  <section
    class="capabilities"
    aria-labelledby="managed-capabilities-title"
  >
    <h2 id="managed-capabilities-title">
      Preview boundary
    </h2>
    <dl>
      <div>
        <dt>Account</dt>
        <dd>Preview-only state in this browser; no identity or credential is retained.</dd>
      </div>
      <div>
        <dt>Fleet and discovery</dt>
        <dd>Unavailable until a managed service is connected.</dd>
      </div>
      <div>
        <dt>Printer access</dt>
        <dd>Unavailable until an application-provided managed session boundary is installed.</dd>
      </div>
    </dl>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ManagedCapabilitySummary extends Vue {}
</script>

<style lang="scss" scoped>
.capabilities {
  margin-top: var(--m3d-space-5);
  padding: var(--m3d-space-6);
  border: 1px solid var(--m3d-border);
  border-radius: var(--m3d-radius-xl);
  background: var(--m3d-surface-raised);
}

h2 {
  margin: 0 0 var(--m3d-space-4);
  font-size: var(--m3d-text-lg);
}

dl {
  display: grid;
  gap: var(--m3d-space-3);
  margin: 0;
}

dl > div {
  display: grid;
  grid-template-columns: minmax(150px, 0.7fr) 1.3fr;
  gap: var(--m3d-space-4);
}

dt {
  font-weight: var(--m3d-weight-semibold);
}

dd {
  margin: 0;
  color: var(--m3d-text-muted);
}

@media (max-width: 600px) {
  dl > div {
    grid-template-columns: 1fr;
    gap: var(--m3d-space-1);
  }
}
</style>
