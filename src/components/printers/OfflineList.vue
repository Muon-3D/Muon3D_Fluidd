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
        <span
          class="row__sub"
          data-tid="offline-reason"
        >{{ reason(tile) }} · Is it switched on and on Wi-Fi?</span>
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
            :data-action="a.id"
            @click="$emit('action', tile, a.id)"
          >
            <v-list-item-content>
              <v-list-item-title :class="{ 'error--text': a.danger }">
                {{ a.label }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="a.hint">
                {{ a.hint }}
              </v-list-item-subtitle>
            </v-list-item-content>
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

  /** "Last seen 3d ago" when the console knows, else what the page knows. */
  reason (tile: PrinterTile): string {
    const seen = tile.entry.cloud?.last_seen
    const group = tile.groupName ? ` · ${tile.groupName}` : ''
    if (seen && seen > 0) return `Last seen ${this.ago(Date.now() / 1000 - seen)}${group}`
    return `${tile.detail}${group}`
  }

  ago (seconds: number): string {
    const minutes = Math.max(1, Math.round(seconds / 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 48) return `${hours}h ago`
    return `${Math.round(hours / 24)} days ago`
  }
}
</script>

<style lang="scss" scoped>
  .rows--dim .row__icon,
  .rows--dim .row__text {
    opacity: 0.6;
  }
</style>
