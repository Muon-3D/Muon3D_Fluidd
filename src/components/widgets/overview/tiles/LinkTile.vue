<template>
  <tile-shell
    :tile="tile"
    :title="title"
    :icon="icon"
    class="lt"
  >
    <span
      v-if="size !== 'S'"
      class="ot__sub"
    >{{ note }}</span>
    <router-link
      class="lt__go"
      :to="target"
      data-tid="link-tile-go"
    >
      {{ action }}
    </router-link>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import TileShell from './TileShell.vue'

/**
 * A widget whose data does not exist on the printer side yet (Care) or whose
 * shelf is still the Library page's (Print next): it says what it is for and
 * goes to the page that has it. Replace it with the widget itself when the
 * data lands (see the TODOs in registry.ts).
 */
@Component({ components: { TileShell } })
export default class LinkTile extends Mixins(OverviewMixin) {
  @Prop({ type: String, required: true }) readonly tile!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, default: 'pulse' }) readonly icon!: string
  @Prop({ type: String, required: true }) readonly note!: string
  @Prop({ type: String, required: true }) readonly action!: string
  /** The page, under the printer ("/maintenance"). */
  @Prop({ type: String, required: true }) readonly page!: string

  get target (): string { return this.pagePath(this.page) }
}
</script>

<style lang="scss">
.lt__go { align-self: flex-start; margin-top: auto; padding: 6px 14px; border-radius: 999px; background: var(--m3d-accent-soft, var(--m3d-fill)); color: var(--m3d-accent); font-size: 13.5px; font-weight: 600; text-decoration: none; }
</style>
