<template>
  <div
    class="fit-list"
    data-tid="library-your-printers"
  >
    <p
      v-if="!rows.length"
      class="fit-list__none"
    >
      There are no printers in your account yet.
      <router-link to="/">
        Add a printer ›
      </router-link>
    </p>
    <div
      v-for="row in rows"
      :key="row.id"
      class="lib-fit"
      :class="{ 'lib-fit--warn': row.tone === 'warn', 'lib-fit--off': row.tone === 'off' }"
      :data-tid="`library-fit-${row.slug}`"
    >
      <printer-thumb
        :size="44"
        :state="row.tone === 'off' ? 'offline' : row.tone === 'run' ? 'printing' : 'idle'"
      />
      <span class="fit-list__text">
        <span class="lib-fit__name">{{ row.name }}</span>
        <span class="lib-fit__detail">{{ row.detail }}</span>
      </span>
      <button
        v-if="row.action === 'reslice'"
        type="button"
        class="lib-btn lib-btn--sm"
        @click="$emit('reslice', row)"
      >
        {{ row.reslice }}
      </button>
      <!-- A printer that can print this now: Print, here, on that printer
           (KAN-2021, Jack: "your own print's page has a direct Print button"). -->
      <button
        v-else-if="row.action === 'print'"
        type="button"
        class="lib-btn lib-btn--sm lib-btn--pri"
        data-tid="library-fit-print"
        :aria-label="`Print on ${row.name}`"
        @click="$emit('print', row)"
      >
        Print
      </button>
      <!-- Anything else it can do there, as a pill: the page's Print on… does it. -->
      <span
        v-else
        class="lib-pill"
        :class="{ 'lib-pill--run': row.action === 'queue' }"
        data-tid="library-fit-status"
      >{{ row.status }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'
import PrinterRowsMixin from '@/mixins/printer-rows'

/**
 * A print's "Your printers": each account printer and whether the print
 * fits it now (printer-rows.ts). A printer that is ready has a Print button
 * that prints there directly; Queue and Offline are pills (the page's
 * Print on… handles those). Re-slice opens Slice on that printer.
 */
@Component({ components: { PrinterThumb } })
export default class PrinterFitList extends Mixins(PrinterRowsMixin) {}
</script>

<style lang="scss" scoped>
  .fit-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fit-list__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .fit-list__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
