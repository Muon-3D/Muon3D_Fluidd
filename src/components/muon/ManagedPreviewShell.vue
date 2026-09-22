<template>
  <main class="managed-preview-shell">
    <header class="managed-preview-shell__header">
      <p class="managed-preview-shell__eyebrow">
        Muon managed connectivity
      </p>
      <p
        class="managed-preview-shell__status"
        data-testid="managed-preview-status"
      >
        Contract mock · no managed network activity
      </p>
      <h1>{{ title }}</h1>
      <p class="managed-preview-shell__description">
        {{ description }}
      </p>
    </header>

    <section class="managed-preview-shell__content">
      <slot />
    </section>
  </main>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ManagedPreviewShell extends Vue {
  @Prop({ required: true }) readonly title!: string
  @Prop({ required: true }) readonly description!: string
}
</script>

<style lang="scss" scoped>
.managed-preview-shell {
  max-width: 880px;
  margin: 0 auto;
  padding: var(--m3d-space-8) var(--m3d-space-5) var(--m3d-space-16);
}

.managed-preview-shell__header {
  padding: var(--m3d-space-8);
  border: 1px solid var(--m3d-accent-border);
  border-radius: var(--m3d-radius-2xl);
  background: var(--m3d-surface-1);
}

.managed-preview-shell__eyebrow {
  margin: 0 0 var(--m3d-space-2);
  color: var(--m3d-accent);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-eyebrow);
  text-transform: uppercase;
}

.managed-preview-shell__status {
  display: inline-block;
  margin: 0 0 var(--m3d-space-5);
  padding: var(--m3d-space-1) var(--m3d-space-3);
  border: 1px solid var(--m3d-border-strong);
  border-radius: var(--m3d-radius-pill);
  color: var(--m3d-warning);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-semibold);
}

h1 {
  margin: 0;
  color: var(--m3d-text);
  font-family: var(--m3d-font-sans) !important;
  font-size: clamp(var(--m3d-text-2xl), 4vw, var(--m3d-text-3xl)) !important;
  font-weight: var(--m3d-weight-bold) !important;
  line-height: var(--m3d-leading-snug) !important;
  text-transform: none !important;
}

.managed-preview-shell__description {
  max-width: 680px;
  margin: var(--m3d-space-3) 0 0;
  color: var(--m3d-text-muted);
  line-height: var(--m3d-leading-relaxed);
}

.managed-preview-shell__content {
  margin-top: var(--m3d-space-5);
}

:deep(.managed-surface) {
  padding: var(--m3d-space-6);
  border: 1px solid var(--m3d-border);
  border-radius: var(--m3d-radius-xl);
  background: var(--m3d-surface-raised);
}

:deep(.managed-contract-note) {
  display: grid;
  gap: var(--m3d-space-1);
  margin: 0 0 var(--m3d-space-5);
  padding: var(--m3d-space-4);
  border: 1px solid var(--m3d-accent-border);
  border-radius: var(--m3d-radius-md);
  background: var(--m3d-accent-soft);
  color: var(--m3d-text-muted);
  font-size: var(--m3d-text-sm);
}

:deep(.managed-contract-note strong) {
  color: var(--m3d-text);
}

:deep(.managed-form) {
  display: grid;
  gap: var(--m3d-space-4);
}

:deep(.managed-field) {
  display: grid;
  gap: var(--m3d-space-2);
  color: var(--m3d-text-muted);
  font-size: var(--m3d-text-xs);
  font-weight: var(--m3d-weight-bold);
  letter-spacing: var(--m3d-tracking-caps);
  text-transform: uppercase;
}

:deep(.managed-field input) {
  min-height: 46px;
  padding: 0 var(--m3d-space-4);
  border: 1px solid var(--m3d-border);
  border-radius: var(--m3d-radius-md);
  background: var(--m3d-surface-1);
  color: var(--m3d-text);
  font: var(--m3d-weight-regular) var(--m3d-text-sm) / var(--m3d-leading-normal) var(--m3d-font-sans);
  letter-spacing: normal;
  text-transform: none;
}

:deep(.managed-field input:focus) {
  border-color: var(--m3d-accent);
}

:deep(.managed-action-row) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--m3d-space-3);
  margin-top: var(--m3d-space-5);
}

:deep(.managed-error),
:deep(.managed-success),
:deep(.managed-empty) {
  margin: var(--m3d-space-4) 0 0;
  padding: var(--m3d-space-3) var(--m3d-space-4);
  border-radius: var(--m3d-radius-md);
  font-size: var(--m3d-text-sm);
}

:deep(.managed-error) {
  border: 1px solid var(--m3d-danger);
  color: var(--m3d-danger);
}

:deep(.managed-success) {
  border: 1px solid var(--m3d-success);
  color: var(--m3d-success);
}

:deep(.managed-empty) {
  color: var(--m3d-text-muted);
  text-align: center;
}

@media (max-width: 600px) {
  .managed-preview-shell {
    padding: var(--m3d-space-4) var(--m3d-space-2) var(--m3d-space-10);
  }

  .managed-preview-shell__header,
  :deep(.managed-surface) {
    padding: var(--m3d-space-5);
  }

  :deep(.managed-action-row > *) {
    flex: 1 1 100%;
  }
}
</style>
