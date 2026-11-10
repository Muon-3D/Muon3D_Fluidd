<template>
  <section
    class="et mv"
    :class="`mv--${size}`"
    data-tile="trackpad"
  >
    <control-move :phone="size === 'S'" />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * The Movement trackpad: Control's Move card (ControlMove), so every move
 * goes through the same safe-move path. Small is its compact (phone) layout;
 * medium and large are the full pad with the jog keys beside it.
 */
@Component({ components: { ControlMove: () => import('@/components/control/ControlMove.vue') } })
export default class MovementTile extends Vue {
  @Prop({ type: String, default: 'M' }) readonly size!: 'S' | 'M' | 'L'
}
</script>
