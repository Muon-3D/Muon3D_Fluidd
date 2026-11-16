<template>
  <div
    v-if="refusal"
    class="prn"
    role="alert"
    data-tid="permission-refusal"
  >
    <p
      v-if="detail"
      class="prn__text"
      data-tid="permission-refusal-detail"
    >
      {{ detail }}
    </p>
    <p
      class="prn__detail"
      data-tid="permission-refusal-text"
    >
      {{ text }}
    </p>
    <p
      class="prn__detail"
      data-tid="permission-refusal-instead"
    >
      {{ instead }}
    </p>
    <div class="prn__actions">
      <button
        v-if="!signedIn"
        type="button"
        class="cbtn cbtn--primary"
        data-tid="permission-refusal-sign-in"
        @click="signInOpen = true"
      >
        Sign in
      </button>
      <router-link
        v-else-if="canManageAccess === true"
        :to="securityTo"
        class="cbtn cbtn--ghost"
        data-tid="permission-refusal-change"
      >
        Change who can do this
      </router-link>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="permission-refusal-dismiss"
        @click="$emit('dismiss')"
      >
        Dismiss
      </button>
    </div>
    <cloud-account-dialog v-model="signInOpen" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { permissionMessage } from '@/services/wifi/panel-only'
import type { RefusalKind } from '@/services/wifi/panel-only'

type PermissionRefusal = Extract<RefusalKind, { kind: 'permission' }>

/**
 * KAN-2457 (Jack, 13 Nov): the printer's own message first, then who may and
 * the ways to do it instead: at the printer, over Bluetooth, or through the
 * account's cloud route. Never "try again here" (KAN-2466 not landed).
 * KAN-2457: the printer's permission store refused a Wi-Fi or hotspot action.
 * Says who may do it, and offers the action that fits: Sign in when this
 * browser has no account, Change who can do this (Settings > Security) when
 * it does and may manage access. Not a panel-only printer.
 */
@Component({ components: { CloudAccountDialog } })
export default class PermissionRefusalNotice extends Mixins(MuonGatesMixin) {
  @Prop({ type: Object, default: null }) readonly refusal!: PermissionRefusal | null

  signInOpen = false

  get signedIn (): boolean {
    return !!cloudState.account
  }

  /** The other ways to do it. Only the printer's screen when the printer allows nothing else. */
  get instead (): string {
    const r = this.refusal
    const atPrinterOnly = !!r && (r.required === 'owner_at_printer' || (!r.required && r.allowed.length === 1 && r.allowed[0] === 'owner_at_printer'))
    return atPrinterOnly
      ? "Instead: at the printer's screen."
      : "Instead: at the printer's screen, over Bluetooth (Connect over Bluetooth), or signed in, through Muon3D."
  }

  get text (): string {
    return this.refusal ? permissionMessage(this.refusal, this.signedIn) : ''
  }

  /** The printer's own wording, when it adds something. */
  get detail (): string {
    const message = this.refusal?.message ?? ''
    return message && message !== this.text ? message : ''
  }

  get securityTo () {
    return { path: scopedPath('/settings', activeSlug()), hash: '#security' }
  }
}
</script>

<style lang="scss" scoped>
  .prn {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--m3d-line, rgba(128, 128, 128, 0.35));
    border-radius: 10px;
  }

  .prn__text,
  .prn__detail {
    margin: 0;
    font-size: 14px;
  }

  .prn__detail {
    opacity: 0.75;
    font-size: 13px;
  }

  .prn__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
