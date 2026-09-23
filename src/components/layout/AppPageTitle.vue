<template>
  <header class="app-page-title">
    <h1 class="app-page-title__main">
      {{ pageTitle }}
    </h1>
    <p
      class="app-page-title__sub"
      :class="`app-page-title__sub--${statusTone}`"
    >
      <span class="app-page-title__dot" />
      {{ pageSubtitle }}
    </p>
  </header>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrinterStatusMixin from '@/mixins/printer-status'

// The glass style's large title on a phone. It scrolls away under the
// toolbar, which then shows the same title small, as iOS does.
@Component({})
export default class AppPageTitle extends Mixins(PrinterStatusMixin) {}
</script>

<style lang="scss" scoped>
  .app-page-title {
    padding: 4px 4px 14px;
  }

  .app-page-title__main {
    overflow: hidden;
    margin: 0;
    color: var(--m3d-text);
    font-family: var(--m3d-font-title);
    font-size: 2.125rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.022em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-page-title__sub {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 2px 0 0;
    color: var(--m3d-text-muted);
    font-size: 0.9375rem;
  }

  .app-page-title__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-text-subtle);
  }

  .app-page-title__sub--ok .app-page-title__dot { background: var(--m3d-success); }
  .app-page-title__sub--active .app-page-title__dot { background: var(--m3d-accent); }
  .app-page-title__sub--warn .app-page-title__dot { background: var(--m3d-warning); }
  .app-page-title__sub--fault { color: var(--m3d-danger); }
  .app-page-title__sub--fault .app-page-title__dot { background: var(--m3d-danger); }
</style>
