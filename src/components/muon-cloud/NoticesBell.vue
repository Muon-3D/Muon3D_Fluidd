<template>
  <v-menu
    v-if="signedIn"
    v-model="menu"
    bottom
    left
    offset-y
    nudge-bottom="8"
    min-width="300"
    max-width="360"
    content-class="muon-notices__menu"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="muon-notices__bell"
        :aria-label="label"
        data-tid="notices-bell"
        v-bind="attrs"
        v-on="on"
      >
        <frame-icon name="bell" />
        <span
          v-if="unread > 0"
          class="muon-notices__count"
          data-tid="notices-count"
        >{{ unread > 99 ? '99+' : unread }}</span>
      </button>
    </template>
    <div
      class="muon-notices"
      role="menu"
      aria-label="Notices"
    >
      <p class="muon-notices__caps">
        Notices
      </p>
      <p
        v-if="!items.length"
        class="muon-notices__empty"
      >
        No notices
      </p>
      <button
        v-for="n in items"
        :key="n.id"
        type="button"
        role="menuitem"
        class="muon-notices__item"
        :class="{ 'muon-notices__item--unread': n.read_at === null }"
        data-tid="notice"
        @click="open(n)"
      >
        <span
          class="muon-notices__dot"
          :aria-hidden="n.read_at !== null"
        />
        <span class="muon-notices__text">
          <span>{{ text(n) }}</span>
          <span class="muon-notices__when">{{ when(n) }}</span>
        </span>
      </button>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { Notice } from '@/services/muon-cloud/api'
import { cloudState, printerName } from '@/services/muon-cloud/state'
import { dayText } from '@/services/account/model'
import { markNoticeRead, noticeState, watchNotices } from '@/services/muon-cloud/notices'

/**
 * The notices bell in the app header: signed in only. Opening a notice marks
 * it read. The console decides what counts as read.
 */
@Component({})
export default class NoticesBell extends Vue {
  menu = false
  stop: (() => void) | null = null

  get signedIn (): boolean {
    return !!cloudState.account
  }

  get items (): Notice[] {
    return noticeState.items
  }

  get unread (): number {
    return noticeState.unread
  }

  get label (): string {
    return this.unread > 0 ? `Notices, ${this.unread} unread` : 'Notices'
  }

  mounted () {
    this.$watch('signedIn', this.sync, { immediate: true })
  }

  beforeDestroy () {
    this.halt()
  }

  sync (signedIn: boolean) {
    this.halt()
    if (signedIn) this.stop = watchNotices()
  }

  halt () {
    this.stop?.()
    this.stop = null
  }

  text (n: Notice): string {
    const who = n.sharer?.display_name ?? n.shared_by ?? 'Someone'
    const what = n.printer_id ? printerName(n.printer_id) : 'a printer'
    return `${who} shared ${what} with you`
  }

  when (n: Notice): string {
    return dayText(n.created_at)
  }

  open (n: Notice) {
    markNoticeRead(n.id)
  }
}
</script>

<style lang="scss" scoped>
  .muon-notices__bell {
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }

  .muon-notices__count {
    position: absolute;
    top: 3px;
    right: 1px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #fff);
    font-size: 11px;
    font-weight: 600;
    line-height: 17px;
    text-align: center;
  }
</style>

<style lang="scss">
  // Global: the menu mounts outside the header.
  .muon-notices__menu {
    border-radius: 12px !important;
    background: var(--m3d-surface) !important;
    box-shadow: var(--m3d-shadow-float, 0 8px 24px rgb(0 0 0 / 45%)), 0 0 0 1px var(--m3d-border-strong) !important;
  }

  .muon-notices {
    display: flex;
    flex-direction: column;
    max-height: 420px;
    padding: 6px;
    overflow-y: auto;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .muon-notices__caps {
    margin: 0;
    padding: 6px 10px;
    color: var(--m3d-text-muted);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .muon-notices__empty {
    margin: 0;
    padding: 12px 10px 14px;
    color: var(--m3d-text-muted);
  }

  .muon-notices__item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    color: var(--m3d-text-muted);
    text-align: left;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .muon-notices__item--unread {
    color: var(--m3d-text);
    font-weight: 600;
  }

  .muon-notices__dot {
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: 50%;
    background: transparent;
  }

  .muon-notices__item--unread .muon-notices__dot {
    background: var(--m3d-accent);
  }

  .muon-notices__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .muon-notices__when {
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 400;
  }
</style>
