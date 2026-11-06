<template>
  <div
    class="rows rows--dim"
    data-tid="offline-list"
  >
    <div
      v-for="tile in tiles"
      :key="tile.key"
      class="row"
    >
      <span class="row__icon"><frame-icon name="printer" /></span>
      <div class="row__text">
        <span class="row__title">{{ tile.name }}</span>
        <span class="row__sub">{{ tile.detail }} · Is it switched on and on Wi-Fi?</span>
      </div>
      <tone-pill tone="err">
        Offline
      </tone-pill>
      <v-menu
        v-if="actionsFor(tile).length"
        left
        offset-y
      >
        <template #activator="{ on, attrs }">
          <button
            type="button"
            class="icon-btn"
            :aria-label="`Options for ${tile.name}`"
            v-bind="attrs"
            v-on="on"
          >
            <frame-icon name="more" />
          </button>
        </template>
        <v-list dense>
          <v-list-item
            v-for="a in actionsFor(tile)"
            :key="a.id"
            :disabled="a.disabled"
            @click="$emit('action', tile, a.id)"
          >
            <v-list-item-title :class="{ 'error--text': a.danger }">
              {{ a.label }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { CardAction } from '@/services/muon-cloud/directory'
import type { PrinterTile } from '@/services/printers-page/model'
import TonePill from './TonePill.vue'

/** Printers that are not answering: last, dimmed, with the reason and what can still be done. */
@Component({ components: { TonePill } })
export default class OfflineList extends Vue {
  @Prop({ type: Array, required: true })
  readonly tiles!: PrinterTile[]

  @Prop({ type: Function, required: true })
  readonly actionsFor!: (tile: PrinterTile) => CardAction[]
}
</script>

<style lang="scss" scoped>
  .rows--dim .row__icon,
  .rows--dim .row__text {
    opacity: 0.6;
  }
</style>
