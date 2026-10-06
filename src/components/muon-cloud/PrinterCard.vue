<template>
  <div
    class="muon-card"
    :class="{ 'is-active': !!entry.active, 'is-dim': dim }"
    role="button"
    tabindex="0"
    :data-health="entry.health"
    @click="$emit('open')"
    @keydown.enter.self="$emit('open')"
  >
    <div class="muon-card__row">
      <span
        class="muon-card__status"
        :title="statusTitle"
      >
        <v-progress-circular
          v-if="busy || spinning"
          indeterminate
          size="14"
          width="2"
          :color="busy ? 'primary' : 'warning'"
        />
        <v-icon
          v-else
          small
          :class="`is-${entry.health}`"
        >
          {{ statusIcon }}
        </v-icon>
      </span>
      <span class="muon-card__name">{{ entry.name }}</span>
      <span
        v-if="entry.active"
        class="muon-card__badge"
      >{{ entry.active === 'cloud' ? 'Cloud' : 'Local' }}</span>
      <v-spacer />
      <v-menu
        v-if="actions.length"
        left
        offset-y
      >
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            x-small
            class="muon-card__menu"
            :aria-label="`Options for ${entry.name}`"
            v-bind="attrs"
            @click.stop
            v-on="on"
          >
            <v-icon small>
              $menu
            </v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
            v-for="a in actions"
            :key="a.id"
            :disabled="a.disabled"
            :data-action="a.id"
            @click="$emit('action', a.id)"
          >
            <v-list-item-icon class="mr-3">
              <v-icon
                small
                :color="a.danger ? 'error' : undefined"
              >
                {{ a.icon }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title :class="{ 'error--text': a.danger }">
                {{ a.label }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="a.hint">
                {{ a.hint }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <div class="muon-card__meta">
      <v-icon
        v-if="entry.nearby"
        x-small
        class="muon-card__meta-icon"
      >
        $bluetooth
      </v-icon>{{ entry.detail }}
    </div>
    <div
      v-if="note"
      class="muon-card__meta muon-card__note"
    >
      {{ note }}
    </div>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { healthLabel, type DirectoryEntry } from '@/services/muon-cloud/directory'

export interface CardAction {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * One printer in the side panel. The icon says how it is now: green when it
 * answered and Klipper is ready, a spinner while it is being reached, grey
 * when nothing answers, red when it answered with a fault, amber when it
 * wants access. What can be done with the printer is in its own menu.
 */
@Component({})
export default class PrinterCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly entry!: DirectoryEntry

  @Prop({ type: Array, default: () => [] })
  readonly actions!: CardAction[]

  /** This card's printer is being opened now. */
  @Prop({ type: Boolean, default: false })
  readonly busy!: boolean

  @Prop({ type: String, default: '' })
  readonly note!: string

  get spinning () {
    return this.entry.health === 'connecting' || this.entry.health === 'searching'
  }

  get dim () {
    return this.entry.health === 'offline' && !this.entry.active
  }

  get statusTitle () {
    return healthLabel(this.entry.health)
  }

  get statusIcon () {
    switch (this.entry.health) {
      case 'online': return '$printerOnline'
      case 'printing': return '$printerPrinting'
      case 'paused': return '$printerPaused'
      case 'error': return '$printerError'
      case 'locked': return '$printerLocked'
      case 'offline': return '$printerOffline'
      default: return '$printerAvailable'
    }
  }
}
</script>

<style lang="scss" scoped>
.muon-card {
  display: block;
  width: calc(100% - 16px);
  margin: 0 8px 6px;
  padding: 10px 8px 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.18);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover,
  &:focus-visible {
    background: rgba(128, 128, 128, 0.08);
    outline: none;
  }

  &.is-active {
    border-color: var(--v-primary-base);
    background: rgba(128, 128, 128, 0.06);
  }

  &.is-dim {
    opacity: 0.65;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 24px;
  }

  &__status {
    display: inline-flex;
    width: 16px;
    justify-content: center;
    flex: none;

    .is-online { color: #3fb950 !important; }
    .is-printing { color: var(--v-primary-base) !important; }
    .is-paused,
    .is-locked { color: #d29922 !important; }
    .is-error { color: #f85149 !important; }
    .is-offline,
    .is-available { color: #8b949e !important; }
  }

  &__name {
    font-weight: 600;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid var(--v-primary-base);
    color: var(--v-primary-base);
    flex: none;
  }

  &__menu {
    flex: none;
  }

  &__meta {
    margin: 4px 0 0 24px;
    font-size: 12px;
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__note {
    white-space: normal;
  }

  &__meta-icon {
    margin-right: 4px;
    vertical-align: -1px;
    color: inherit !important;
  }
}
</style>
