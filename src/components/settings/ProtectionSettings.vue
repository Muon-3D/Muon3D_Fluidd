<template>
  <div v-if="status">
    <v-subheader id="protection">
      {{ $t('app.protection.title') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        :title="$t('app.protection.title')"
        :sub-title="$t('app.protection.label.covers')"
      >
        <v-chip
          :color="isProtected ? 'primary' : undefined"
          label
          small
          data-test="protection-level"
        >
          <v-icon
            left
            small
          >
            {{ isProtected ? '$lock' : '$lockOpen' }}
          </v-icon>
          {{ isProtected ? $t('app.protection.label.protected') : $t('app.protection.label.open') }}
        </v-chip>
      </app-setting>

      <v-divider />

      <v-card-text data-test="protection-detail">
        <div>{{ detail }}</div>
        <div class="text-body-2 secondary--text mt-2">
          {{ $t('app.protection.msg.panel_only') }}
          {{ $t('app.protection.msg.unaffected') }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { ProtectionStatus } from '@/store/protection/types'

/**
 * MuonOS network protection (SPEC SEC-8), read-only. The level is set at the
 * printer's panel and Moonraker refuses a change from anywhere else, so there
 * is no switch here to offer.
 */
@Component({})
export default class ProtectionSettings extends Vue {
  get status (): ProtectionStatus | null {
    return this.$store.state.protection.status
  }

  get isProtected (): boolean {
    return this.$store.getters['protection/isProtected']
  }

  get detail (): string {
    if (!this.isProtected) return this.$t('app.protection.msg.open').toString()
    return this.$store.getters['protection/isLocked']
      ? this.$t('app.protection.msg.locked').toString()
      : this.$t('app.protection.msg.paired').toString()
  }
}
</script>
