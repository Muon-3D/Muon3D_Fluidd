<template>
  <div
    v-if="visible"
    class="owner-only"
    data-tid="owner-only"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import { ownerState, refreshOwner } from '@/services/gates'

/**
 * Shows its content to the printer's owner and renders nothing for anyone
 * else: hidden, not greyed (PRINCIPLES.md section 9).
 *
 * The owner is whoever the printer lets change who can use it (the same
 * test Access settings use for "Only the owner can change this"). The
 * printer enforces it either way; this only keeps the controls out of sight.
 *
 * When ownership cannot be known (a printer with no muon_access, so no
 * accounts and no owner, or the printer didn't answer) the content is
 * hidden, as Access settings lock theirs. A row that is safe where nobody
 * has accounts passes `unknown="show"`.
 */
@Component
export default class OwnerOnly extends Mixins(MuonGatesMixin) {
  @Prop({ type: String, default: 'hide', validator: (v: string) => ['hide', 'show'].includes(v) })
  readonly unknown!: 'hide' | 'show'

  mounted () {
    if (this.$store.getters['server/componentSupport']('muon_access') && ownerState.isOwner === null && !ownerState.checking) {
      refreshOwner()
    }
  }

  get visible (): boolean {
    if (this.isOwner === null) return this.unknown === 'show'
    return this.isOwner
  }
}
</script>

<style scoped>
  .owner-only {
    display: contents;
  }
</style>
