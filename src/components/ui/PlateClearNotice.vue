<template>
  <div
    class="plate-notice"
    :class="{ 'plate-notice--inline': inline }"
    role="status"
    aria-live="polite"
    data-tid="plate-clear-notice"
  >
    <div class="plate-notice__row">
      <span
        class="plate-notice__text"
        data-tid="plate-clear-text"
      >{{ done ? 'Confirmed. Waiting for the printer to say so.' : 'Clear the plate before the next print.' }}</span>
      <button
        type="button"
        class="cbtn"
        :class="inline ? '' : 'cbtn--primary'"
        :disabled="busy || done"
        :aria-busy="busy ? 'true' : 'false'"
        data-tid="plate-clear-btn"
        @click="ask"
      >
        The plate is clear
      </button>
    </div>
    <p
      v-if="message"
      class="plate-notice__message"
      role="alert"
      data-tid="plate-clear-message"
    >
      {{ message }}
      <router-link
        v-if="showSettingsLink"
        :to="settingsPath"
        class="plate-notice__link"
        data-tid="plate-clear-settings"
      >
        Settings &rsaquo; Security
      </router-link>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { confirmPlateClear } from '@/services/plate/clear'
import type { PlateClearResult } from '@/services/plate/clear'

/**
 * The plate-clear notice (CT-14, KAN-2187): the printer refuses the next
 * print until the plate is confirmed clear, so Control shows it with the
 * same confirm the printer has. Shown by PlateClearBar on Overview and
 * Control while the printer says `plate_cleared: false`, and inline in the
 * print sheet. The button asks first ("Is the plate clear?"), sends one
 * POST (a double-click sends once), and never fakes the answer: the notice
 * goes away when the printer reports the plate clear. A refusal shows in
 * the printer's words; only the owner gets a link to Settings > Security.
 */
@Component({})
export default class PlateClearNotice extends Vue {
  @Prop({ type: Boolean })
  readonly managed!: boolean

  @Prop({ type: Boolean })
  readonly inline!: boolean

  /** This session may manage access (the owner): shows the link to Settings > Security on a refusal. */
  @Prop({ type: Boolean })
  readonly owner!: boolean

  @Prop({ type: String, default: '/settings#security' })
  readonly settingsPath!: string

  busy = false
  done = false
  message = ''
  result: PlateClearResult | null = null

  get showSettingsLink (): boolean {
    return this.owner && this.result?.kind === 'refused'
  }

  async ask () {
    if (this.busy || this.done) return
    this.busy = true
    try {
      const yes = await this.$confirm('Check that nothing from the last print is still on it, then confirm.', {
        title: 'Is the plate clear?',
        buttonTrueText: 'The plate is clear',
        buttonFalseText: 'Cancel'
      })
      if (!yes) return
      this.message = ''
      this.result = await confirmPlateClear(this.managed, this.$httpClient)
      if (this.result.kind === 'cleared') this.done = true
      else this.message = this.result.message
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
.plate-notice {
  padding: 12px 16px;
  border: 1px solid var(--m3d-border);
  border-radius: 10px;
  background: var(--m3d-surface);
  color: var(--m3d-text);
  font-size: 14px;
}
.plate-notice--inline {
  margin: 12px 0;
  padding: 12px;
  background: var(--m3d-surface-2);
}
.plate-notice__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.plate-notice__text { font-weight: 600; }
.plate-notice__message {
  margin: 8px 0 0;
  color: var(--m3d-danger);
  font-size: 13px;
}
.plate-notice__link {
  margin-left: 6px;
  color: var(--m3d-accent);
  text-decoration: underline;
}
</style>
