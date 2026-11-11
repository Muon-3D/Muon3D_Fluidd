<template>
  <section
    class="et mv"
    :class="`mv--${size}`"
    data-tile="trackpad"
  >
    <control-move
      :phone="size === 'S'"
      trackpad-only
    />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * The Trackpad: Control's Move card (ControlMove) without its jog and
 * position bars (those are the Jog and Position widgets), so every move goes
 * through the same safe-move path. It stays on the page and greys out while
 * the printer is moving. Small is its compact layout.
 */
@Component({ components: { ControlMove: () => import('@/components/control/ControlMove.vue') } })
export default class MovementTile extends Vue {
  @Prop({ type: String, default: 'M' }) readonly size!: 'S' | 'M' | 'L'
}
</script>
