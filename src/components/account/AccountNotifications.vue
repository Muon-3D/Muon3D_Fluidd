<template>
  <div
    class="acct-section"
    data-tid="account-notifications"
  >
    <div class="acct-head">
      <h1>Notifications</h1>
      <p>What we tell you, and where: your phone, email, or Control's bell</p>
    </div>

    <div class="acct-gt">
      Your printers
    </div>
    <div
      class="acct-glist note__mx"
      role="group"
      aria-label="Your printers"
      data-tid="notify-grid"
    >
      <div class="acct-grow note__hd">
        <span class="acct-grow__text" />
        <span
          v-for="channel in channels"
          :key="channel.id"
          class="note__c"
        >{{ channel.label }}</span>
      </div>
      <div
        v-for="kind in printKinds"
        :key="kind.id"
        class="acct-grow"
        :data-tid="`notify-row-${kind.id}`"
      >
        <span class="acct-grow__text"><b>{{ kind.label }}</b><span v-if="kind.sub">{{ kind.sub }}</span></span>
        <span
          v-for="channel in channels"
          :key="channel.id"
          class="note__c"
          :title="supported(cellKey(channel.id, kind.id)) ? undefined : 'Coming soon'"
        >
          <toggle-switch
            small
            :value="preference(cellKey(channel.id, kind.id))"
            :label="`${kind.label}: ${channel.label}${supported(cellKey(channel.id, kind.id)) ? '' : ' (coming soon)'}`"
            :disabled="!supported(cellKey(channel.id, kind.id)) || busy"
            :data-tid="`notify-${cellKey(channel.id, kind.id)}`"
            @input="set(cellKey(channel.id, kind.id), $event)"
          />
        </span>
      </div>
    </div>
    <p
      v-if="!gridSupported"
      class="acct-gh"
      data-tid="notify-grid-soon"
    >
      Coming soon: choosing where each print alert goes.
    </p>
    <p
      class="acct-gh"
      data-tid="notify-phones"
    >
      {{ phonesLine }} Per-printer choices: open the printer's row in <router-link
        :to="printersLink"
        data-tid="notify-printers-link"
      >
        Account › Printers and access
      </router-link>.
    </p>

    <div class="acct-gt">
      People and access
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="People and access"
    >
      <div
        v-for="kind in accessKinds"
        :key="kind.id"
        class="acct-grow"
      >
        <span class="acct-grow__text"><b>{{ kind.label }}</b></span>
        <toggle-switch
          :value="preference(kind.id)"
          :label="kind.label"
          :disabled="!supported(kind.id) || busy"
          :data-tid="`notify-${kind.id}`"
          @input="set(kind.id, $event)"
        />
      </div>
    </div>

    <div class="acct-gt">
      From Muon3D
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="From Muon3D"
    >
      <div class="acct-grow">
        <span class="acct-grow__text"><b>News and new features</b></span>
        <toggle-switch
          :value="preference('email_news')"
          label="News and new features"
          :disabled="!supported('email_news') || busy"
          data-tid="notify-email_news"
          @input="set('email_news', $event)"
        />
      </div>
      <div class="acct-grow">
        <span class="acct-grow__text"><b>Security</b><span>Always on.</span></span>
        <span
          class="acct-grow__value"
          data-tid="notify-security"
        >Always</span>
      </div>
    </div>

    <p
      v-if="prefsMissing"
      class="acct-gh"
      data-tid="notify-soon"
    >
      Email choices come soon. Until then: account emails only, no news.
    </p>

    <p
      v-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import { accountApi, type EmailPreferences } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { accountState, describe, loadSessions } from '@/services/account/state'
import { devicesFrom, type Device } from '@/services/account/model'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

type Channel = 'push' | 'email' | 'bell'
type Preferences = EmailPreferences & Record<string, boolean | undefined>

/** Today's defaults, shown (switched off) while the console has no preferences. */
const DEFAULTS: Record<string, boolean> = { email_access_requests: true, email_shared_with_you: true }

/**
 * Notifications: where each alert goes. The console's `/v1/me/preferences`
 * holds the choices. A switch works only once the console answers with its
 * key: print alerts are `<push|email|bell>_<event>` (none are sent yet, so
 * they say "Coming soon"), sharing alerts and news are the email keys it has
 * today. Nothing is shown as saved that the console doesn't hold. Security
 * email is always on.
 */
@Component({ components: { ToggleSwitch } })
export default class AccountNotifications extends Vue {
  preferences: Preferences | null = null
  prefsMissing = false
  busy = false
  error = ''

  readonly channels: Array<{ id: Channel, label: string }> = [
    { id: 'push', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'bell', label: 'Bell' }
  ]

  readonly printKinds = [
    { id: 'print_finished', label: 'A print finished' },
    { id: 'print_failed', label: 'A print failed or stopped' },
    { id: 'print_paused', label: 'Paused, needs you', sub: 'Filament ran out, or a check failed' },
    { id: 'update_ready', label: 'An update is ready' }
  ]

  readonly accessKinds = [
    { id: 'email_access_requests', label: 'Someone asks to use a printer' },
    { id: 'email_shared_with_you', label: 'A printer is shared with you' }
  ]

  created () {
    loadSessions().catch(() => {})
    accountApi.preferences()
      .then((p) => { this.preferences = p as Preferences })
      .catch((error) => {
        if (isMissing(error)) this.prefsMissing = true
        else this.error = describe(error)
      })
  }

  cellKey (channel: Channel, kind: string): string {
    return `${channel}_${kind}`
  }

  supported (key: string): boolean {
    return typeof this.preferences?.[key] === 'boolean'
  }

  get gridSupported (): boolean {
    return this.printKinds.some(kind => this.channels.some(channel => this.supported(this.cellKey(channel.id, kind.id))))
  }

  get phones (): Device[] {
    return accountState.sessions ? devicesFrom(accountState.sessions).filter(d => d.kind === 'phone') : []
  }

  get phonesLine (): string {
    const names = this.phones.map(p => p.label)
    if (!names.length) return 'Phone alerts need the Muon3D app.'
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
    return `Phone alerts go to the Muon3D app on ${list}.`
  }

  get printersLink (): string {
    return scopedPath('/account/printers', activeSlug())
  }

  preference (key: string): boolean {
    if (!this.preferences) return DEFAULTS[key] === true
    return this.preferences[key] === true
  }

  async set (key: string, value: boolean) {
    if (!this.supported(key)) return
    this.busy = true
    this.error = ''
    try {
      this.preferences = await accountApi.setPreferences({ [key]: value }) as Preferences
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .note__hd {
    min-height: 36px;
    padding-top: 8px;
    padding-bottom: 8px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .note__c {
    display: flex;
    flex: none;
    justify-content: center;
    width: 64px;
  }

  .acct-gh a {
    color: var(--m3d-accent) !important;
    text-decoration: none;
  }

  @media (max-width: 600px) {
    .note__mx .acct-grow {
      gap: 6px;
      padding-right: 10px;
    }

    .note__c {
      width: 52px;
    }
  }
</style>
