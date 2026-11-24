<template>
  <span
    v-if="entry && buttons.length > 1"
    class="route-buttons"
    data-tid="route-buttons"
  >
    <span
      class="route-buttons__row"
      role="group"
      aria-label="Connection route"
    >
      <button
        v-for="b in buttons"
        :key="b.route"
        type="button"
        class="route-buttons__btn"
        :class="{ 'route-buttons__btn--active': b.active && !switchingTo, 'route-buttons__btn--busy': switchingTo === b.route }"
        :aria-label="b.label"
        :title="b.label"
        :aria-pressed="b.active ? 'true' : 'false'"
        :aria-busy="switchingTo === b.route ? 'true' : undefined"
        :disabled="!!switchingTo"
        :data-tid="`route-button-${b.route}`"
        @click="pick(b)"
      >
        <v-progress-circular
          v-if="switchingTo === b.route"
          indeterminate
          :size="14"
          :width="2"
        />
        <v-icon
          v-else
          small
        >
          {{ b.icon }}
        </v-icon>
      </button>
    </span>
    <span
      v-if="switchingTo"
      class="route-buttons__note"
      role="status"
      data-tid="route-switching"
    >{{ switchingLine }}</span>
    <span
      v-else-if="failedLine"
      class="route-buttons__note route-buttons__note--fail"
      role="alert"
      data-tid="route-failed"
    >{{ failedLine }}</span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins } from 'vue-property-decorator'
import PrinterEntriesMixin, { routeButtonsOf } from '@/mixins/printer-entries'
import { chooseRouteMode } from '@/services/muon-cloud/route-choice'
import type { Route } from '@/services/muon-cloud/route-choice'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type RouteButton = ReturnType<typeof routeButtonsOf>[number]

const WORDS: Record<Route, string> = { lan: 'locally', cloud: 'over Muon3D', ble: 'over Bluetooth' }
const SWITCH: Record<Route, string> = { lan: 'Switching to local…', cloud: 'Switching to Muon3D…', ble: 'Switching to Bluetooth…' }

// Kept outside the component: a route change can reload the printer's page and mount this again.
const shared = Vue.observable({ switchingTo: null as Route | null, failed: null as string | null })

/**
 * Very small route buttons at the top of the Wi-Fi and network page (KAN-5973, I-585): one per route that is
 * there (local, Muon3D, Bluetooth), the current one active. A click connects over that route and holds it
 * (chooseRouteMode, inside the same handlers the printer menu uses). From the click to connected or failed
 * the button shows it is switching (KAN-5977, I-589); a failure says so and leaves the other buttons usable.
 */
@Component({})
export default class RouteButtons extends Mixins(PrinterEntriesMixin) {
  get entry (): DirectoryEntry | null {
    const d = this.directory
    return d.cloud.find(e => e.active) ?? d.local.find(e => e.active) ?? null
  }

  get buttons () {
    return this.entry ? routeButtonsOf(this.entry) : []
  }

  get switchingTo (): Route | null {
    return shared.switchingTo
  }

  get switchingLine (): string {
    return shared.switchingTo ? SWITCH[shared.switchingTo] : ''
  }

  get failedLine (): string | null {
    return shared.failed
  }

  async pick (b: RouteButton) {
    const e = this.entry
    if (!e || shared.switchingTo) return
    shared.failed = null
    if (b.active) {
      // Already on it: only hold it.
      const id = e.cloud?.id ?? e.endpointId
      if (id) chooseRouteMode(id, b.route)
      return
    }
    shared.switchingTo = b.route
    try {
      const opened = await this.onAction(e, b.id)
      if (opened === false) shared.failed = `Couldn't connect ${WORDS[b.route]}.`
    } catch {
      shared.failed = `Couldn't connect ${WORDS[b.route]}.`
    } finally {
      shared.switchingTo = null
    }
  }
}
</script>

<style lang="scss" scoped>
  .route-buttons {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .route-buttons__row {
    display: inline-flex;
    gap: 4px;
  }

  .route-buttons__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    color: var(--m3d-text-muted);

    &:hover:not(:disabled) {
      background: var(--m3d-hover);
    }

    &:disabled {
      opacity: 0.6;
    }
  }

  .route-buttons__btn--active {
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    box-shadow: inset 0 0 0 1px currentColor;
  }

  .route-buttons__btn--busy {
    opacity: 1 !important;
  }

  .route-buttons__note {
    font-size: 12px;
    color: var(--m3d-text-muted);
  }

  .route-buttons__note--fail {
    color: var(--v-error-base, #e5484d);
  }
</style>
