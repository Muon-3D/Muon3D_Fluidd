<template>
  <div
    class="acct-section ov"
    data-tid="account-overview"
  >
    <div
      v-if="deletionDay"
      class="acct-note acct-deleting"
      role="status"
      data-tid="account-deletion-waiting"
    >
      <frame-icon
        name="clock"
        small
      />
      <span><b>Your account will be deleted on {{ deletionDay }}.</b> Until then you can keep it.</span>
      <router-link
        :to="linkTo('delete')"
        class="lib-btn lib-btn--sm lib-btn--pri"
      >
        Keep my account
      </router-link>
    </div>

    <section
      class="lib-surface ov-you"
      aria-label="You"
    >
      <span class="acct-avatar acct-avatar--xl">{{ initials }}</span>
      <div class="ov-you__who">
        <h1>{{ account ? account.name : '' }}</h1>
        <span class="ov-you__line">
          <span data-tid="account-email">{{ account ? account.email : '' }}</span>
          <span
            v-if="details && details.email_verified === true"
            class="lib-pill lib-pill--ok"
          ><frame-icon
            name="check"
            small
          />Verified</span>
          <span
            v-else-if="details && details.email_verified === false"
            class="lib-pill lib-pill--warn"
          >Not confirmed</span>
        </span>
      </div>
      <router-link
        :to="linkTo('profile')"
        class="lib-btn"
        data-tid="account-edit-profile"
      >
        Edit profile
      </router-link>
    </section>

    <div class="ov-stats">
      <router-link
        :to="linkTo('security')"
        class="lib-surface ov-stat"
        data-tid="account-tile-security"
      >
        <span class="ov-stat__label"><frame-icon
          name="shield"
          small
        />Security</span>
        <template v-if="me">
          <span class="ov-stat__value"><span
            class="acct-dot"
            :class="`acct-dot--${health.level}`"
          />{{ securityValue }}</span>
          <span class="ov-stat__sub">{{ securitySub }}</span>
        </template>
        <span
          v-else
          class="ov-stat__sub"
        >Reading…</span>
      </router-link>

      <router-link
        :to="linkTo('printers')"
        class="lib-surface ov-stat"
        data-tid="account-tile-printers"
      >
        <span class="ov-stat__label"><frame-icon
          name="printer"
          small
        />Printers</span>
        <span class="ov-stat__value">{{ printers.length }}
          <span
            v-if="printers.length"
            class="ov-stat__thumbs"
            aria-hidden="true"
          ><printer-thumb
            v-for="p in printers.slice(0, 3)"
            :key="p.id"
            :size="28"
            :state="thumbOf(p)"
          /></span>
        </span>
        <span class="ov-stat__sub">{{ printersSub }}</span>
      </router-link>

      <router-link
        :to="linkTo('sessions')"
        class="lib-surface ov-stat"
        data-tid="account-tile-sessions"
      >
        <span class="ov-stat__label"><frame-icon
          name="devices"
          small
        />Devices</span>
        <template v-if="devices">
          <span class="ov-stat__value">{{ deviceCount }}</span>
          <span class="ov-stat__sub">signed in</span>
        </template>
        <span
          v-else
          class="ov-stat__sub"
        >Reading…</span>
      </router-link>

      <router-link
        :to="linkTo('library')"
        class="lib-surface ov-stat"
        data-tid="account-tile-library"
      >
        <span class="ov-stat__label"><frame-icon
          name="library"
          small
        />Library</span>
        <template v-if="libraryOn">
          <span class="ov-stat__value">{{ usedText }}</span>
          <span class="lib-bar"><i :style="{ width: `${usedPercent}%` }" /></span>
          <span class="ov-stat__sub">{{ quotaText || 'used' }}</span>
        </template>
        <template v-else>
          <span class="ov-stat__value">{{ libraryOffText }}</span>
        </template>
      </router-link>
    </div>

    <router-link
      :to="linkTo('plan')"
      class="lib-surface acct-card--pad acct-plan"
      data-tid="account-tile-plan"
    >
      <span class="acct-icon-box"><frame-icon
        name="card"
        small
      /></span>
      <span class="acct-row__label">
        <b>{{ planTitle }}</b>
        <span data-tid="account-tile-plan-line">{{ creditLine }}</span>
      </span>
      <span
        v-if="limitReached"
        class="lib-pill lib-pill--warn"
      >Limit reached</span>
      <frame-icon
        name="chevronRight"
        small
        class="acct-muted"
      />
    </router-link>

    <section
      v-if="recent.length"
      class="lib-surface acct-card"
      aria-label="Recent activity"
      data-tid="account-recent"
    >
      <div class="acct-card__title">
        <h2>Recent activity</h2>
        <router-link
          :to="linkTo('sessions')"
          class="acct-link"
        >
          All activity
        </router-link>
      </div>
      <div class="acct-list">
        <div
          v-for="item in recent"
          :key="item.id"
          class="acct-lrow"
        >
          <frame-icon
            :name="item.icon"
            small
            class="acct-muted"
          />
          <span class="acct-lrow__text">{{ item.text }}</span>
          <span class="acct-lrow__time">{{ item.when }}</span>
        </div>
      </div>
    </section>

    <p
      v-if="error"
      class="acct-error"
    >
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import PrinterThumb, { type ThumbState } from '@/components/ui/PrinterThumb.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { deletionState } from '@/services/muon-cloud/deletion'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import { accountState, loadOverview } from '@/services/account/state'
import {
  dayText,
  deviceCount,
  devicesFrom,
  eventLine,
  initialsOf,
  securityHealth,
  whenText,
  type AccountSectionId,
  type Device,
  type SecurityHealth
} from '@/services/account/model'
import { libraryState, refreshLibrary, watchLibraryAccount } from '@/services/library/store'
import { bytesText } from '@/services/library/format'
import { limitState, loadCredits, planName, usageTileText, usageWindow, type CreditAccount } from '@/services/account/credits'
import type { AccountDetails, Me } from '@/services/account/api'

const EVENT_ICONS: Record<string, string> = {
  signIn: 'signIn',
  signOut: 'logout',
  key: 'key',
  shield: 'shield',
  userPlus: 'userPlus',
  userMinus: 'userMinus',
  mail: 'mail',
  lock: 'lock',
  alert: 'alert',
  link: 'link'
}

/**
 * The Account overview: who you are, four numbers to glance at (security,
 * printers, devices, Library), the plan, and the last few things that
 * happened. Every other section is one click away in the list beside it, so
 * the overview repeats none of their words (Jack, 2 Nov: "too much text").
 */
@Component({ components: { PrinterThumb } })
export default class AccountOverview extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  credit: CreditAccount | null = null

  created () {
    loadOverview()
    watchLibraryAccount()
    refreshLibrary().catch(() => {})
    loadCredits().then(account => { this.credit = account }).catch(() => {})
  }

  /** "Plus plan", or the section's name until the balance is read. */
  get planTitle (): string {
    return this.credit ? `${planName(this.credit.plan)} plan` : 'Plan and credits'
  }

  /** "34% of this week's limit used · Resets Mon 3 Nov", or the promise when there's no limit to show. */
  get creditLine (): string {
    return this.credit ? usageTileText(this.credit) : 'Printer features are always free'
  }

  /** Only with nothing bought to carry on with. */
  get limitReached (): boolean {
    return !!this.credit && this.credit.packs <= 0 && limitState(usageWindow(this.credit)) === 'reached'
  }

  get me (): Me | null {
    return accountState.me
  }

  get account () {
    return cloudState.account
  }

  get details (): AccountDetails | null {
    return accountState.me?.account ?? null
  }

  get error (): string {
    return accountState.error
  }

  /** A deletion waiting out its 14 days (KAN-532 §2.7). */
  get deletionDay (): string {
    const at = deletionState.deleteAfter
    return at ? dayText(at) : ''
  }

  get initials (): string {
    return initialsOf(this.account?.name, this.account?.email)
  }

  get health (): SecurityHealth {
    return securityHealth(this.me as Me)
  }

  /** Two words for the card; the Security page says the rest. */
  get securityValue (): string {
    return { good: 'Protected', fair: 'One way in', weak: 'Password only' }[this.health.level]
  }

  get securitySub (): string {
    return { good: 'Nothing to do', fair: 'Add a second way in', weak: 'Add a passkey or two-step' }[this.health.level]
  }

  get devices (): Device[] | null {
    return accountState.sessions ? devicesFrom(accountState.sessions) : null
  }

  get deviceCount (): number {
    return this.devices ? deviceCount(this.devices) : 0
  }

  get printers (): CloudPrinter[] {
    return cloudState.printers
  }

  thumbOf (p: CloudPrinter): ThumbState {
    if (!p.online) return 'offline'
    const state = cloudState.status[p.id]?.state
    return state === 'printing' || state === 'paused' ? 'printing' : 'idle'
  }

  /** "2 shared with you", "1 request waiting", or who they belong to. */
  get printersSub (): string {
    const waiting = accountState.approvals?.length ?? 0
    if (waiting) return waiting === 1 ? '1 request waiting' : `${waiting} requests waiting`
    if (!this.printers.length) return 'None yet'
    const shared = this.printers.filter(p => p.shared).length
    return shared ? `${shared} shared with you` : 'All yours'
  }

  get libraryOn (): boolean {
    return libraryState.account !== null && libraryState.checked && libraryState.enabled
  }

  get libraryOffText (): string {
    if (!libraryState.checked) return libraryState.error ? 'Your Library didn\'t answer.' : 'Reading…'
    return 'Off'
  }

  get usedText (): string {
    return libraryState.usedBytes === null ? '…' : bytesText(libraryState.usedBytes)
  }

  get quotaText (): string {
    return libraryState.quotaBytes ? `of ${bytesText(libraryState.quotaBytes)}` : ''
  }

  get usedPercent (): number {
    const used = libraryState.usedBytes ?? 0
    const quota = libraryState.quotaBytes ?? 0
    return quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
  }

  get recent (): Array<{ id: string, icon: string, text: string, when: string }> {
    const name = (id: string) => cloudState.printers.find(p => p.id === id)?.name ?? 'a printer'
    return (accountState.events ?? []).slice(0, 3).map(e => {
      const line = eventLine(e, name)
      return { id: e.id, icon: EVENT_ICONS[line.icon] ?? 'alert', text: line.text, when: whenText(e.at) }
    })
  }
}
</script>

<style lang="scss" scoped>
  .acct-deleting {
    align-items: center;

    > span {
      flex: 1 1 auto;
    }
  }

  .ov {
    gap: 20px;
  }

  .ov-you {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 22px 24px;
  }

  .ov-you__who {
    display: flex;
    flex: 1 1 160px;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 600;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
  }

  .ov-you__line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  // Four numbers: one row when there's room, else two by two (never 3 + 1).
  .ov-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  @media (min-width: 1280px) {
    .ov-stats {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .ov-stat {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 18px 20px;
    color: var(--m3d-text) !important;
    text-decoration: none;

    &:hover {
      border-color: var(--m3d-border-strong);
    }
  }

  .ov-stat__label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;

    .frame-icon {
      color: var(--m3d-accent);
    }
  }

  .ov-stat__value {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.15;
  }

  .ov-stat__thumbs {
    display: inline-flex;
    gap: 4px;
    margin-left: auto;
  }

  .ov-stat__sub {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .acct-plan {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    color: var(--m3d-text) !important;
    text-decoration: none;
  }
</style>
