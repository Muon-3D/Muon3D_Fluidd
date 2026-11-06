<template>
  <router-link
    :to="to"
    class="locked-row"
    data-tid="locked-row"
  >
    <frame-icon
      name="lock"
      small
    />
    <span class="locked-row__text">
      <span
        class="locked-row__label"
        data-tid="locked-row-label"
      >{{ label }}</span>
      <span
        class="locked-row__reason"
        data-tid="locked-row-reason"
      >{{ reason }}</span>
    </span>
  </router-link>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * A settings row that is on this printer but locked. Developer-mode rows
 * stay visible, never hidden (PRINCIPLES.md section 9), with the reason
 * and a way to unlock them. There is no separate explainer sheet in
 * Control, so a tap goes to Settings > Developer mode, which is it.
 *
 * Render it in place of the real row while `devModeEnabled` is false:
 * `<locked-row v-if="!devModeEnabled" label="..." />`.
 */
@Component({ components: { FrameIcon } })
export default class LockedRow extends Vue {
  @Prop({ type: String, required: true }) readonly label!: string
  @Prop({ type: String, default: 'Needs developer mode' }) readonly reason!: string

  get to (): string {
    return `${scopedPath('/settings', activeSlug())}#developer`
  }
}
</script>

<style lang="scss" scoped>
  .locked-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    text-decoration: none;
    cursor: pointer;
  }

  .locked-row__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .locked-row__label {
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 500;
  }

  .locked-row__reason {
    font-size: 13px;
  }
</style>
