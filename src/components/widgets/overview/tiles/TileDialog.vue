<template>
  <m3-dialog
    :value="value"
    :title="title"
    :max-width="maxWidth"
    data-tid="tile-dialog"
    @close="$emit('close')"
  >
    <slot />
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/** The depth behind a ⋯ item: the existing control or list, in one of our dialogs. */
@Component({})
export default class TileDialog extends Vue {
  @Prop({ type: Boolean }) readonly value!: boolean
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: [String, Number], default: 560 }) readonly maxWidth!: string | number
}
</script>
