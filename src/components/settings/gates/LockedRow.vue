<template>
  <component
    :is="linked ? 'router-link' : 'div'"
    v-bind="linked ? { to } : {}"
    class="locked-row"
    :class="{ 'locked-row--plain': !linked }"
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
  </component>
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
 * `<locked-row v-if="!devModeEnabled" label="..." />`. With
 * `lock="muon"` ("Needs a Muon printer") nothing here can unlock it, so the
 * row has no link. `reason-text` replaces the words, never the link.
 */
@Component({ components: { FrameIcon } })
export default class LockedRow extends Vue {
  @Prop({ type: String, required: true }) readonly label!: string
  /** What locks it. Only developer mode can be unlocked from here, so only it links. */
  @Prop({ type: String, default: 'developer-mode', validator: (v: string) => ['developer-mode', 'muon'].includes(v) })
  readonly lock!: 'developer-mode' | 'muon'

  @Prop({ type: String, default: '' }) readonly reasonText!: string

  get linked (): boolean {
    return this.lock === 'developer-mode'
  }

  get reason (): string {
    return this.reasonText || (this.linked ? 'Needs developer mode' : 'Needs a Muon printer')
  }

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

  .locked-row--plain {
    cursor: default;
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
