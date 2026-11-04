<template>
  <div
    v-if="entry && actions.length"
    class="page-menu"
    data-tid="printer-page-menu"
  >
    <v-menu
      left
      offset-y
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="page-menu__button"
          :aria-label="`Options for ${entry.name}`"
          data-tid="printer-page-menu-button"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon name="more" />
        </button>
      </template>
      <v-list dense>
        <v-list-item
          v-for="a in actions"
          :key="a.id"
          :disabled="a.disabled"
          :data-action="a.id"
          @click="onAction(entry, a.id)"
        >
          <v-list-item-icon class="mr-3">
            <v-icon small>
              {{ a.icon }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ a.label }}</v-list-item-title>
            <v-list-item-subtitle v-if="a.hint">
              {{ a.hint }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-snackbar
      :value="!!message"
      :timeout="-1"
      color="surface"
      data-tid="printer-page-menu-note"
      @input="clearMessage"
    >
      {{ message }}
      <template #action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="clearMessage"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrinterEntriesMixin from '@/mixins/printer-entries'
import { activationState } from '@/services/muon-cloud/activate'
import type { CardAction, DirectoryEntry } from '@/services/muon-cloud/directory'

/** What the printer's own page offers from its menu: the card's Bluetooth ways in, and its access settings. */
const PAGE_ACTIONS = ['connect-bluetooth', 'retry-bluetooth', 'access']

/**
 * The three-dot menu on a printer's own page (KAN-1429). It lists the same
 * items the printer's card does, from the same rules and handlers in
 * PrinterEntriesMixin, for the printer this page is on.
 */
@Component({})
export default class PrinterPageMenu extends Mixins(PrinterEntriesMixin) {
  /** The linked printer this page is on. */
  get entry (): DirectoryEntry | null {
    return this.directory.cloud.find(e => e.active) ?? null
  }

  get actions (): CardAction[] {
    return this.entry ? this.actionsFor(this.entry).filter(a => PAGE_ACTIONS.includes(a.id)) : []
  }

  get message (): string {
    return this.notice ?? activationState.error ?? ''
  }

  clearMessage () {
    this.notice = null
    activationState.error = null
  }
}
</script>

<style lang="scss" scoped>
  .page-menu__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
    }
  }
</style>
