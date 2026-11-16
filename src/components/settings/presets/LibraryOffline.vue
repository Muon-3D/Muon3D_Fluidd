<template>
  <div
    class="libofl"
    role="status"
    data-tid="library-offline"
  >
    <frame-icon
      name="cloud"
      small
    />
    <span>The material library is offline. Materials on {{ printerLabel }} still work.</span>
    <button
      type="button"
      class="libofl__retry"
      data-tid="library-retry"
      @click="$emit('retry')"
    >
      Retry
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { printerNameParts } from '@/util/printer-name'

@Component({})
export default class LibraryOffline extends Vue {
  get printerLabel (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }
}
</script>

<style lang="scss" scoped>
  .libofl {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;

    span {
      flex: 1 1 auto;
    }
  }

  .libofl__retry {
    color: var(--m3d-accent);
    font-weight: 600;
  }
</style>
