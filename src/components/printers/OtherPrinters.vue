<template>
  <div
    class="rows"
    data-tid="other-list"
  >
    <article
      v-for="tile in tiles"
      :key="tile.key"
      class="row other"
      role="link"
      tabindex="0"
      :aria-label="`Open ${tile.name}`"
      @click="$emit('open', tile)"
      @keydown.enter.prevent="$emit('open', tile)"
      @keydown.space.prevent="$emit('open', tile)"
    >
      <span class="row__icon other__icon">
        <foreign-silhouette :form-factor="record(tile).formFactor" />
      </span>
      <div class="row__text">
        <span class="row__title">{{ tile.name }}</span>
        <span class="row__sub">
          {{ brand(tile) }}<template v-if="record(tile).model"> · {{ record(tile).model }}</template>
          · {{ record(tile).via === 'direct' ? 'direct' : `through ${record(tile).m1Name || 'M1'}` }}
        </span>
      </div>
      <tone-pill :tone="tile.tone">
        {{ tile.label }}
      </tone-pill>
      <v-menu
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
            @click.stop
            @keydown.stop
          >
            <frame-icon name="more" />
          </button>
        </template>
        <v-list dense>
          <v-list-item @click.stop="$emit('forget', tile)">
            <v-list-item-title class="error--text">
              Forget
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </article>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { PrinterTile } from '@/services/printers-page/model'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import { foreignBrand } from '@/services/foreign-printers/brands'
import ForeignSilhouette from '@/components/foreign/ForeignSilhouette.vue'
import TonePill from './TonePill.vue'

/** Printers saved in this browser that are not M1s (other brands): a row each, with Forget in the menu. */
@Component({ components: { ForeignSilhouette, TonePill } })
export default class OtherPrinters extends Vue {
  @Prop({ type: Array, required: true })
  readonly tiles!: PrinterTile[]

  record (tile: PrinterTile): ForeignPrinterRecord {
    return tile.entry.foreign!.record
  }

  brand (tile: PrinterTile): string {
    return foreignBrand(this.record(tile).kind).label
  }
}
</script>

<style lang="scss" scoped>
  .other { cursor: pointer; }
  .other:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: -2px; }
  .other__icon { overflow: hidden; }
</style>
