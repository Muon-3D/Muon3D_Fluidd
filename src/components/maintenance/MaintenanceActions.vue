<template>
  <div
    class="mactions"
    data-tid="maintenance-actions"
  >
    <seg-picker
      v-if="page === 'health' && supportsBedMesh"
      :options="options"
      value="health"
      label="Maintenance page"
      @input="open"
    />
    <button
      v-if="page === 'bed' && meshRow"
      type="button"
      class="cbtn cbtn--primary"
      :disabled="!!checksBlocked"
      :title="checksBlocked || undefined"
      data-tid="mesh-calibrate"
      @click="runCheck(meshRow)"
    >
      <frame-icon name="refresh" />
      {{ measuring ? 'Calibrating…' : 'Calibrate mesh' }}
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Maintenance's page-header actions. Health: the switch to Bed (Bed also
 * opens from its own tile). Bed: Calibrate mesh, the one primary action, which
 * is the same check as Health's Bed mesh calibrate and asks the same first.
 */
@Component({ components: { SegPicker } })
export default class MaintenanceActions extends Mixins(MaintenanceMixin) {
  @Prop({ type: String, default: 'health' })
  readonly page!: 'health' | 'bed'

  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }

  get meshRow () {
    return this.checks.find(c => c.id === 'bedMesh')
  }

  get options (): SegOption[] {
    return [{ value: 'health', label: 'Health' }, { value: 'bed', label: 'Bed' }]
  }

  open (value: string) {
    if (value === 'bed') this.$router.push(scopedPath('/tune', activeSlug()))
  }
}
</script>

<style lang="scss" scoped>
  .mactions {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
  }
</style>
