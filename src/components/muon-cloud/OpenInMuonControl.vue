<template>
  <div
    class="open-in-control"
    data-tid="open-in-control"
  >
    <p class="open-in-control__line">
      Your Muon3D account is used at Muon Control, not on this page. This page is the printer's own address on your network, and it is not encrypted.
    </p>
    <p class="open-in-control__line text--secondary">
      Everything on this printer keeps working here without an account.
    </p>
    <app-btn
      color="primary"
      block
      :href="url"
      target="_blank"
      rel="noopener"
      data-tid="open-in-control-button"
    >
      Open in Muon Control
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { controlUrl } from '@/services/muon-cloud/api'

/**
 * What a plain-HTTP printer page shows where an account feature would be
 * (KAN-2192): one explanation and one link to the same page on the console.
 * The page takes no password and holds no account secret.
 */
@Component({})
export default class OpenInMuonControl extends Vue {
  /** The hash route to open on the console, such as `/account`. */
  @Prop({ type: String, default: '/' })
  readonly route!: string

  get url (): string {
    return controlUrl(this.route)
  }
}
</script>

<style lang="scss" scoped>
.open-in-control__line {
  margin-bottom: 12px;
}
</style>
