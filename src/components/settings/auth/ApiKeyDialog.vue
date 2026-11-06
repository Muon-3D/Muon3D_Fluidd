<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.api_key')"
    max-width="500"
  >
    <v-card-text>
      <v-text-field
        :value="apiKey"
        filled
        dense
        single-line
        hide-details
        readonly
      />

      <v-layout
        align-center
        column
        class="pt-4"
      >
        <app-qr-code
          :value="apiKey"
          centered
        />
      </v-layout>
    </v-card-text>

    <template #actions>
      <v-spacer />

      <app-btn
        color="primary"
        text
        type="button"
        data-tid="api-key-new"
        @click="handleRefreshApiKey"
      >
        {{ $t('app.general.btn.refresh') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel } from 'vue-property-decorator'

@Component({})
export default class ApiKeyDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  get apiKey () {
    return this.$store.getters['auth/getApiKey']
  }

  /** A new key stops the old one at once, so every tool using it must be given the new one: asked first (R8). */
  async handleRefreshApiKey () {
    const sure = await this.$confirm('Every tool using the current key stops working until you give it the new one.', {
      title: 'Make a new API key?',
      buttonTrueText: 'Make a new key',
      danger: true
    })
    if (sure) this.$store.dispatch('auth/refreshApiKey')
  }
}
</script>
