<template>
  <div
    class="ol"
    data-tid="objects-list"
  >
    <p class="ot__note">
      Skip one if it fails. The rest of the plate carries on.
    </p>
    <div
      v-for="object in objects"
      :key="object.name"
      class="ol__row"
    >
      <span class="ol__name">{{ object.name }}</span>
      <span
        v-if="excluded.includes(object.name)"
        class="ol__skipped"
      >Skipped</span>
      <button
        v-else
        type="button"
        class="cbtn"
        :disabled="!controlReady || !busy"
        :data-skip="object.name"
        @click="skip(object.name)"
      >
        Skip
      </button>
    </div>
    <p
      v-if="!objects.length"
      class="ot__note"
    >
      This print has no separate objects.
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'

/** The objects on the plate, each with a Skip. A skipped object cannot be added back. */
@Component({})
export default class ObjectsList extends Mixins(OverviewMixin) {
  get objects (): Array<{ name: string }> { return this.$store.state.printer.printer.exclude_object?.objects ?? [] }
  get excluded (): string[] { return this.$store.state.printer.printer.exclude_object?.excluded_objects ?? [] }

  async skip (name: string) {
    if (!this.controlReady || !(this.printerPrinting || this.printerPaused) || !this.objects.some(o => o.name === name) || this.excluded.includes(name) || !/^[a-z0-9_.-]+$/i.test(name)) return
    const target = this.panelTarget
    const file = this.jobFile
    const job = this.activePrintJob?.job_id
    const duration = this.printStats.total_duration ?? 0
    const ok = await this.$confirm('A skipped object cannot be added back to this print.', { title: `Stop printing ${name}?`, buttonTrueText: 'Skip it', danger: true })
    if (ok && job === this.activePrintJob?.job_id && (this.printStats.total_duration ?? 0) >= duration && target === this.panelTarget && file === this.jobFile && this.controlReady && (this.printerPrinting || this.printerPaused) && this.objects.some(o => o.name === name) && !this.excluded.includes(name)) await this.sendTypedGcode(`EXCLUDE_OBJECT NAME=${name}`)
  }
}
</script>

<style lang="scss" scoped>
.ol { display: flex; flex-direction: column; gap: 8px; }
.ol__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; }
.ol__name { overflow-wrap: anywhere; }
.ol__skipped { color: var(--m3d-text-subtle); font-size: 13px; }
</style>
