<template>
  <section
    class="et"
    :data-tile="tile"
  >
    <component :is="inner" />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * An existing card (the camera, console, bed mesh, system) drawn as an
 * Overview widget. The card is loaded when the widget is first on the page,
 * so a widget nobody added costs nothing. It scrolls inside its tile
 * rather than growing the page.
 */
@Component({})
export default class EmbedTile extends Vue {
  @Prop({ type: String, required: true }) readonly tile!: string
  @Prop({ type: Function, required: true }) readonly loader!: () => Promise<unknown>

  get inner () { return this.loader }
}
</script>

<style lang="scss">
.et { display: flex; flex-direction: column; min-width: 0; overflow: auto; border-radius: 22px; background: var(--m3d-surface); color: var(--m3d-text); }
.et > * { flex: 1 1 auto; min-width: 0; }
</style>
