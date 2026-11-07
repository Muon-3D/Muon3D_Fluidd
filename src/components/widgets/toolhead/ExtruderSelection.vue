<template>
  <div>
    <v-select
      v-model="extruder"
      :items="extruders"
      :readonly="printerPrinting || devOnlyLocked"
      :disabled="!klippyReady || printerPrinting || devOnlyLocked"
      item-value="key"
      item-text="name"
      hide-details
      outlined
      dense
      class="mb-2 v-input--x-dense"
      style="max-width: 256px;"
    />
    <dev-only-note
      v-if="devOnlyLocked"
      class="d-block mb-2"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import DevGuardMixin from '@/mixins/dev-guard'
import DevOnlyNote from './DevOnlyNote.vue'

@Component({ components: { DevOnlyNote } })
export default class ExtruderSelection extends Mixins(StateMixin, DevGuardMixin) {
  get extruders () {
    return this.$store.getters['printer/getExtruders']
  }

  get extruder () {
    return this.$store.state.printer.printer.toolhead.extruder
  }

  set extruder (extruder: string) {
    // ACTIVATE_EXTRUDER is developer-mode only (Klipper#112).
    if (this.devOnlyLocked) return
    this.sendGcode(`ACTIVATE_EXTRUDER EXTRUDER=${extruder}`, this.$waits.onExtruderChange)
  }
}
</script>
