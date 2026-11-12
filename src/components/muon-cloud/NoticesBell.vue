<template>
  <v-menu
    v-if="show"
    v-model="menu"
    bottom
    left
    offset-y
    nudge-bottom="8"
    :close-on-content-click="false"
    min-width="300"
    max-width="380"
    content-class="muon-notices__menu"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="muon-notices__bell"
        :class="`muon-notices__bell--${tone}`"
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
      data-tid="notices"
    >
      <template v-if="printer">
        <div class="muon-notices__head">
          <p class="muon-notices__caps">
            This printer
          </p>
          <button
            v-if="clearable.length"
            type="button"
            class="muon-notices__clear"
            data-tid="notices-clear-all"
            @click="clearAll"
          >
            Clear all
          </button>
        </div>
        <section
          v-if="!klippyReady"
          class="muon-notices__alert muon-notices__alert--error"
          data-tid="notice-klippy"
        >
          <b>Klipper: {{ klippyState }}</b>
          <error-code-notice
            class="muon-notices__desc"
            :message="klippyStateMessage"
          />
        </section>
        <section
          v-for="group in warningGroups"
          :key="group.title"
          class="muon-notices__alert"
          data-tid="notice-warnings"
        >
          <b>{{ group.title }}</b>
          <ul class="muon-notices__desc">
            <li
              v-for="(item, index) in group.items"
              :key="index"
              v-html="linkExternalUrls(item)"
            />
          </ul>
          <span
            v-if="group.help"
            class="muon-notices__desc"
            v-html="group.help"
          />
        </section>
        <div
          v-for="n in printerNotifications"
          :key="`printer-${n.id}`"
          class="muon-notices__note"
          :class="`muon-notices__note--${n.type}`"
          data-tid="printer-notice"
        >
          <span class="muon-notices__dot" />
          <span
            v-if="codedError(n)"
            class="muon-notices__text"
          >
            <error-code-notice
              :code="n.code || ''"
              :message="n.description || n.title"
            />
            <span class="muon-notices__when">{{ $filters.formatRelativeTimeToNow(n.timestamp * 1000) }}</span>
          </span>
          <span
            v-else
            class="muon-notices__text"
          >
            <b v-html="n.title" />
            <span
              v-if="n.description"
              class="muon-notices__desc"
              v-html="n.description"
            />
            <span class="muon-notices__when">{{ $filters.formatRelativeTimeToNow(n.timestamp * 1000) }}</span>
            <span
              v-if="n.to || n.type === 'announcement'"
              class="muon-notices__links"
            >
              <template v-if="n.to">
                <router-link
                  v-if="!n.to.startsWith('http')"
                  :to="n.to"
                  class="muon-notices__link"
                  @click.native="menu = false"
                >{{ n.btnText || 'Show me' }}</router-link>
                <a
                  v-else
                  :href="n.to"
                  target="_blank"
                  rel="noopener"
                  class="muon-notices__link"
                  @click="menu = false"
                >{{ n.btnText || 'Read more' }}</a>
              </template>
              <template v-if="n.type === 'announcement'">
                <button
                  v-for="s in snoozes"
                  :key="s.delay"
                  type="button"
                  class="muon-notices__link"
                  :data-tid="`notice-snooze-${s.delay}`"
                  @click="snooze(n, s.delay)"
                >Snooze {{ s.label }}</button>
              </template>
            </span>
          </span>
          <span
            v-if="n.suffix"
            class="muon-notices__suffix"
            v-html="n.suffix"
          />
          <button
            v-if="n.clear"
            type="button"
            class="muon-notices__x"
            aria-label="Dismiss"
            @click="clear(n)"
          >
            <frame-icon
              name="x"
              small
            />
          </button>
        </div>
        <p
          v-if="printerCount === 0"
          class="muon-notices__empty"
        >
          Nothing new on this printer
        </p>
      </template>
      <template v-if="signedIn">
        <p class="muon-notices__caps">
          {{ printer ? 'Shared with you' : 'Notices' }}
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
      </template>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { Notice } from '@/services/muon-cloud/api'
import { cloudState, printerName } from '@/services/muon-cloud/state'
import { dayText } from '@/services/account/model'
import { markNoticeRead, noticeState, watchNotices } from '@/services/muon-cloud/notices'
import type { AppNotification } from '@/store/notifications/types'
import isSetAppBadgeSupported from '@/util/is-set-app-badge-supported'
import linkExternalUrls from '@/util/link-external-urls'
import { Globals } from '@/globals'
import ErrorCodeNotice from '@/components/common/ErrorCodeNotice.vue'
import { resolveError } from '@/services/error-codes'

interface WarningGroup {
  title: string
  items: string[]
  help?: string
}

/**
 * The one notification icon in the header. With `printer` it also carries
 * that printer's side: Klipper's state when not ready, the printer, Klipper
 * and Moonraker warnings, and the notifications store (Moonraker
 * announcements, update and version notices, throttling). Signed in, it
 * lists the console's sharing notices; opening one marks it read.
 */
@Component({ components: { ErrorCodeNotice } })
export default class NoticesBell extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  readonly printer!: boolean

  menu = false
  stop: (() => void) | null = null

  get signedIn (): boolean {
    return !!cloudState.account
  }

  get show (): boolean {
    return this.signedIn || this.printer
  }

  get items (): Notice[] {
    return noticeState.items
  }

  get printerNotifications (): AppNotification[] {
    return this.printer ? this.$store.getters['notifications/getNotifications'] : []
  }

  /** An error notification the book knows (by its code, or its wording) shows as code + short line. */
  codedError (n: AppNotification): boolean {
    if (n.type !== 'error') return false
    return resolveError({ code: n.code, message: n.description || n.title }).entry !== null
  }

  get clearable (): AppNotification[] {
    return this.printerNotifications.filter(n => n.clear)
  }

  get warningGroups (): WarningGroup[] {
    if (!this.printer) return []
    const getters = this.$store.getters
    const groups: WarningGroup[] = []
    const printerWarnings = getters['printer/getPrinterWarnings'] as Array<{ message: string }>
    if (printerWarnings.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.app_warnings_found', undefined, { appName: Globals.PRODUCT_NAME }),
        items: printerWarnings.map(warning => warning.message),
        help: this.$tc('app.general.error.app_setup_link', undefined, { url: Globals.DOCS_REQUIRED_CONFIGURATION })
      })
    }
    const klipperWarnings = getters['printer/getKlipperWarnings'] as Array<{ message: string }>
    if (klipperWarnings.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.app_warnings_found', undefined, { appName: 'Klipper' }),
        items: klipperWarnings.map(warning => warning.message)
      })
    }
    const failedComponents = getters['printer/getMoonrakerFailedComponents'] as string[]
    if (failedComponents.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.failed_components'),
        items: failedComponents,
        help: this.$tc('app.general.error.components_config', undefined, { url: Globals.DOCS_MOONRAKER_COMPONENTS })
      })
    }
    const moonrakerWarnings = getters['printer/getMoonrakerWarnings'] as string[]
    if (moonrakerWarnings.length > 0) {
      groups.push({
        title: this.$tc('app.general.error.app_warnings_found', undefined, { appName: 'Moonraker' }),
        items: moonrakerWarnings
      })
    }
    return groups
  }

  get klippyDown (): boolean {
    return this.printer && !this.klippyReady
  }

  get printerCount (): number {
    return (this.klippyDown ? 1 : 0) +
      this.warningGroups.reduce((sum, g) => sum + g.items.length, 0) +
      this.printerNotifications.filter(n => !n.noCount).length
  }

  get unread (): number {
    return this.printerCount + (this.signedIn ? noticeState.unread : 0)
  }

  /** The worst thing in it: red for Klipper down or an error, orange for a warning. */
  get tone (): 'error' | 'warning' | 'none' {
    if (this.klippyDown || this.printerNotifications.some(n => n.type === 'error')) return 'error'
    if (this.warningGroups.length || this.printerNotifications.some(n => n.type === 'warning')) return 'warning'
    return 'none'
  }

  get label (): string {
    return this.unread > 0 ? `Notices, ${this.unread} unread` : 'Notices'
  }

  get snoozes (): Array<{ label: string, delay: number }> {
    return [
      { label: '1 hour', delay: 3600 },
      { label: '1 day', delay: 3600 * 24 },
      { label: '1 week', delay: 3600 * 24 * 7 }
    ]
  }

  @Watch('unread')
  onUnread (value: number) {
    if (isSetAppBadgeSupported(navigator)) navigator.setAppBadge(value)
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

  clear (n: AppNotification) {
    this.$store.dispatch('notifications/clearNotification', n)
  }

  clearAll () {
    this.$store.dispatch('notifications/clearAll')
  }

  snooze (n: AppNotification, wake_time: number) {
    this.$store.dispatch('announcements/dismiss', { entry_id: n.id, wake_time })
  }

  linkExternalUrls = linkExternalUrls
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
  .muon-notices__bell--warning {
    color: var(--m3d-warning);
  }

  .muon-notices__bell--error {
    color: var(--m3d-danger);
  }

  .muon-notices__bell--warning .muon-notices__count {
    background: var(--m3d-warning);
    color: #1d1300;
  }

  .muon-notices__bell--error .muon-notices__count {
    background: var(--m3d-danger);
    color: #fff;
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

  .muon-notices__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .muon-notices__clear,
  .muon-notices__link {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .muon-notices__clear {
    color: var(--m3d-accent);

    &:hover {
      background: var(--m3d-accent-soft);
    }
  }

  .muon-notices__link {
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
  }

  .muon-notices__links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .muon-notices__alert,
  .muon-notices__note {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    overflow-wrap: anywhere;
  }

  .muon-notices__alert {
    flex-direction: column;
    gap: 4px;
    border-left: 3px solid var(--m3d-warning);
  }

  .muon-notices__alert--error {
    border-left-color: var(--m3d-danger);
  }

  .muon-notices__note .muon-notices__dot {
    background: var(--m3d-accent);
  }

  .muon-notices__note--success .muon-notices__dot { background: var(--m3d-success); }
  .muon-notices__note--warning .muon-notices__dot { background: var(--m3d-warning); }
  .muon-notices__note--error .muon-notices__dot { background: var(--m3d-danger); }

  .muon-notices__desc {
    margin: 0;
    padding-left: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
    list-style-position: inside;
  }

  .muon-notices__note .muon-notices__text {
    flex: 1 1 auto;
    min-width: 0;
  }

  .muon-notices__suffix {
    flex: none;
    color: var(--m3d-text-muted);
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }

  .muon-notices__x {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--m3d-text-subtle);

    &:hover {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }
</style>
