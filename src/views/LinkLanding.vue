<template>
  <div class="muon-link-landing">
    <landing-card
      icon="link"
      title="Link a printer"
      :sub="signedIn ? 'Type the code shown on the printer\'s screen. It links to your Muon3D account.' : `Sign in to your Muon3D account to link the printer showing code ${code || '—'}.`"
    >
      <template v-if="signedIn">
        <v-otp-input
          v-model="draft"
          class="muon-link-landing__code"
          length="6"
          type="number"
          data-tid="link-code"
          @finish="link"
        />
        <p class="muon-link-landing__hint">
          The printer shows it while it is linking. Then you confirm on the printer with the knob.
        </p>
      </template>
      <template #foot>
        <button
          v-if="!signedIn"
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="link-sign-in"
          @click="accountDialog = true"
        >
          Sign in
        </button>
        <template v-else>
          <button
            type="button"
            class="lib-btn lib-btn--ghost"
            data-tid="link-nearby"
            @click="openDialog('')"
          >
            Find it nearby
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--pri"
            :disabled="draft.length !== 6"
            data-tid="link-button"
            @click="link"
          >
            Link printer
          </button>
        </template>
      </template>
    </landing-card>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
    <link-printer-dialog
      v-if="signedIn && linkDialog"
      v-model="linkDialog"
      :initial-code="dialogCode"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'
import LandingCard from '@/components/ui/LandingCard.vue'

@Component({ components: { CloudAccountDialog, LinkPrinterDialog, LandingCard } })
export default class LinkLanding extends Vue {
  accountDialog = false
  linkDialog = false
  draft = ''
  /** The code the dialog opens with: six digits link straight away, none searches nearby. */
  dialogCode = ''

  get code (): string {
    return String(this.$route.query.code ?? '').replace(/\D/g, '').slice(0, 6)
  }

  get signedIn () {
    return cloudState.account !== null
  }

  created () {
    this.draft = this.code
  }

  mounted () {
    if (!this.signedIn && cloudState.ready) this.accountDialog = true
  }

  /** Linking is a press: a code from the link only fills the boxes. */
  link () {
    const code = this.draft.replace(/\D/g, '').slice(0, 6)
    if (code.length === 6) this.openDialog(code)
  }

  openDialog (code: string) {
    this.dialogCode = code
    this.linkDialog = true
  }

  @Watch('linkDialog')
  onClosed (value: boolean) {
    if (!value && this.signedIn) this.$router.push('/')
  }
}
</script>

<style lang="scss" scoped>
.muon-link-landing__code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}

.muon-link-landing__hint {
  margin: 0;
  color: var(--m3d-text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
