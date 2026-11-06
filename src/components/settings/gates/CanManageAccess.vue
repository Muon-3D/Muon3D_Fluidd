<template>
  <div
    v-if="visible"
    class="can-manage-access"
    data-tid="can-manage-access"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'

/**
 * Shows its content to a client the printer lets manage access, and renders
 * nothing for anyone else: hidden, not greyed (PRINCIPLES.md section 9).
 * Use it for the controls of the protection rows (who can use the printer,
 * entry, levels, data), where Access settings says "Only the owner can
 * change this".
 *
 * What it tests is the printer's own answer: `protection: allowed` from
 * `server.muon.access.capabilities`. That is "may manage access", which
 * the printer also grants to any admin, to the panel, to local addresses
 * and to gateway callers with no level. It is not "is the account owner",
 * and no account-owner check is provided yet. The printer enforces the
 * rule either way; this only keeps the controls out of sight.
 *
 * Anything that is not a clear yes hides the content: a member, a viewer,
 * a refused (403), failed (5xx) or timed-out call, an answer for another
 * printer, and a printer whose server info has not loaded. A Muon printer
 * with only muon_protection has no access route, so it hides too.
 *
 * A printer that is certainly not a Muon (a loaded component list with
 * neither Muon component) has no accounts and no owner. A row that is
 * harmless there opts in with `non-muon="show"`; nothing else shows
 * content on an unknown answer.
 */
@Component
export default class CanManageAccess extends Mixins(MuonGatesMixin) {
  @Prop({ type: String, default: 'hide', validator: (v: string) => ['hide', 'show'].includes(v) })
  readonly nonMuon!: 'hide' | 'show'

  get visible (): boolean {
    if (this.isMuonPrinter === false) return this.nonMuon === 'show'
    return this.canManageAccess === true
  }
}
</script>

<style scoped>
  .can-manage-access {
    display: contents;
  }
</style>
