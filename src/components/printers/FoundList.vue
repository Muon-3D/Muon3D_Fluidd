<template>
  <div
    class="rows"
    data-tid="found-list"
  >
    <div
      v-for="tile in tiles"
      :key="tile.key"
      class="row"
      :data-tid="`found-${tile.key}`"
    >
      <span
        class="row__icon"
        :class="{ 'row__icon--accent': tile.state === 'new' }"
      >
        <frame-icon name="wifi" />
      </span>
      <div class="row__text">
        <span class="row__title">{{ tile.name }}</span>
        <span class="row__sub mono">{{ host(tile) }}</span>
        <span
          v-if="about(tile)"
          class="row__sub"
        >{{ about(tile) }}</span>
      </div>
      <tone-pill
        v-if="tile.state !== 'new' && tile.state !== 'ready'"
        :tone="tile.tone"
      >
        {{ tile.label }}
      </tone-pill>
      <button
        v-for="a in secondary(tile)"
        :key="a.id"
        type="button"
        class="btn btn--sm"
        :disabled="a.disabled"
        :data-tid="`found-${a.id}`"
        @click="$emit('action', tile, a.id)"
      >
        {{ a.label }}
      </button>
      <button
        v-if="primary(tile).id"
        type="button"
        class="btn btn--sm btn--primary"
        :disabled="busyKey === tile.key || primary(tile).disabled"
        :data-tid="`found-${primary(tile).id}`"
        @click="$emit('action', tile, primary(tile).id)"
      >
        <v-progress-circular
          v-if="busyKey === tile.key"
          indeterminate
          size="14"
          width="2"
        />
        <frame-icon
          v-else-if="primary(tile).id === 'connect'"
          name="chevronRight"
          small
        />
        {{ primary(tile).label }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { CardAction } from '@/services/muon-cloud/directory'
import type { PrinterTile } from '@/services/printers-page/model'
import TonePill from './TonePill.vue'

/**
 * Printers found on this network that are not yours yet: one row each, with
 * the one thing to do with it on the row (Open, Set it up, What is this?),
 * and the rest beside it. The page hides the whole list when nothing is found.
 */
@Component({ components: { TonePill } })
export default class FoundList extends Vue {
  @Prop({ type: Array, required: true })
  readonly tiles!: PrinterTile[]

  /** The actions a printer offers, by tile. */
  @Prop({ type: Function, required: true })
  readonly actionsFor!: (tile: PrinterTile) => CardAction[]

  @Prop({ type: String, default: null })
  readonly busyKey!: string | null

  host (tile: PrinterTile): string {
    return tile.entry.lan?.host ?? tile.entry.host ?? ''
  }

  /** An action with no id when the printer offers nothing to do. */
  primary (tile: PrinterTile): CardAction {
    if (tile.state === 'new') return { id: 'set-up', label: 'Set it up', icon: '' }
    if (tile.entry.row?.action === 'nearby-info') return { id: 'nearby-info', label: 'What is this?', icon: '' }
    const open = this.actionsFor(tile).find(a => a.id === 'connect')
    return open ? { ...open, label: 'Open' } : { id: '', label: '', icon: '' }
  }

  secondary (tile: PrinterTile): CardAction[] {
    return this.actionsFor(tile).filter(a => a.id !== 'connect')
  }

  about (tile: PrinterTile): string {
    if (tile.state === 'new') return 'Not set up yet. Setup takes a few minutes: Wi-Fi, a name and a test print.'
    if (tile.entry.linkedTo === 'other') return 'Linked to another account. Use it on this network, or ask its owner to share it.'
    if (tile.state === 'locked') return 'It wants to know who you are before it lets this browser in.'
    return tile.entry.detail
  }
}
</script>
