<template>
  <v-alert
    v-if="locked"
    type="info"
    text
    icon="$lock"
    class="protected-notice mb-0"
  >
    <div>{{ $t('app.protection.msg.locked') }}</div>
    <div class="text-caption mt-1">
      {{ $t('app.protection.msg.panel_only') }}
    </div>
  </v-alert>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/**
 * Shown in place of a control that MuonOS network protection (SPEC SEC-8)
 * takes away from this browser, so the answer is "protected, and here is
 * where it is changed" rather than an error or a silently empty card.
 */
@Component({})
export default class ProtectedNotice extends Vue {
  get locked (): boolean {
    return this.$store.getters['protection/isLocked']
  }
}
</script>
