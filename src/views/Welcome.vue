<template>
  <div class="muon-welcome">
    <header class="muon-welcome__head">
      <div class="muon-welcome__wordmark">
        MUON3D
      </div>
      <h1 class="muon-welcome__title">
        Set up your printers
      </h1>
      <p class="muon-welcome__lede">
        Connect to a printer on this network, or sign in to reach your linked printers from anywhere.
      </p>
    </header>

    <div class="muon-welcome__grid">
      <section class="muon-welcome__panel">
        <div class="muon-welcome__label">
          <v-icon
            x-small
            class="mr-1"
          >
            {{ icons.lan }}
          </v-icon>
          On this network
          <v-spacer />
          <span
            v-if="searching"
            class="muon-welcome__scan"
          >
            <v-progress-circular
              indeterminate
              size="11"
              width="2"
              class="mr-1"
            />
            {{ scanNetwork || 'searching' }}
          </span>
        </div>

        <div
          v-for="p in localRows"
          :key="p.key"
          class="muon-welcome__printer is-row"
        >
          <span
            class="muon-welcome__dot"
            :class="{ 'is-offline': !p.host }"
          />
          <span class="muon-welcome__printer-text">
            <span class="muon-welcome__printer-name">{{ p.name }}</span>
            <span class="muon-welcome__printer-meta">{{ p.meta }}</span>
          </span>
          <span class="muon-welcome__row-actions">
            <v-progress-circular
              v-if="connecting === p.key"
              indeterminate
              size="18"
              width="2"
            />
            <template v-else>
              <v-btn
                v-if="!p.linked"
                small
                text
                :disabled="!p.canLink"
                :title="p.canLink ? 'Show a code on its screen, then enter it here' : p.status"
                @click="linkRow(p)"
              >
                Link to account
              </v-btn>
              <app-btn
                small
                color="primary"
                :disabled="!p.host || !!connecting"
                @click="openRow(p)"
              >
                Open
              </app-btn>
            </template>
          </span>
        </div>
        <div
          v-if="!localRows.length"
          class="muon-welcome__empty"
        >
          <template v-if="searching">
            Looking for Muon3D printers…
          </template>
          <template v-else>
            No Muon3D printers found on your network yet. Check that the printer is on and connected
            to Wi-Fi. If your browser asks to look for devices on your local network, allow it.
          </template>
        </div>

        <v-alert
          v-if="error"
          type="error"
          dense
          text
          class="mt-3 mb-0"
        >
          {{ error }}
          <template v-if="fallbackHost">
            <a :href="localPage(fallbackHost)">Open the printer's own page</a> instead.
          </template>
        </v-alert>

        <div class="muon-welcome__actions">
          <v-btn
            small
            text
            :disabled="searching"
            @click="rescan"
          >
            Search again
          </v-btn>
          <v-btn
            small
            text
            @click="addressDialog = true"
          >
            Enter an address
          </v-btn>
        </div>
      </section>

      <section class="muon-welcome__panel">
        <div class="muon-welcome__label">
          <v-icon
            x-small
            class="mr-1"
          >
            {{ icons.cloud }}
          </v-icon>
          Muon3D account
          <v-spacer />
          <span
            v-if="account"
            class="muon-welcome__scan"
          >{{ account.email }}</span>
        </div>

        <template v-if="!account">
          <p class="muon-welcome__copy">
            Link a printer to your account once, at the printer. Then open it from any network,
            over an end-to-end encrypted connection.
          </p>
          <div class="muon-welcome__actions">
            <app-btn
              color="primary"
              @click="openAccount('sign-up')"
            >
              Create account
            </app-btn>
            <v-btn
              text
              @click="openAccount('sign-in')"
            >
              Sign in
            </v-btn>
          </div>
        </template>

        <template v-else>
          <button
            v-for="p in cloudPrinters"
            :key="p.id"
            type="button"
            class="muon-welcome__printer"
            :class="{ 'is-offline': !p.online }"
            :disabled="!!connecting"
            @click="openCloud(p.id)"
          >
            <span
              class="muon-welcome__dot"
              :class="{ 'is-offline': !p.online }"
            />
            <span class="muon-welcome__printer-text">
              <span class="muon-welcome__printer-name">{{ p.name }}</span>
              <span class="muon-welcome__printer-meta">{{ p.online ? 'Online' : 'Offline' }}</span>
            </span>
            <v-progress-circular
              v-if="connecting === p.id"
              indeterminate
              size="18"
              width="2"
            />
            <span
              v-else
              class="muon-welcome__go"
            >Open</span>
          </button>
          <div
            v-if="!cloudPrinters.length"
            class="muon-welcome__empty"
          >
            No printers are linked to this account yet.
          </div>
          <div class="muon-welcome__actions">
            <app-btn
              color="primary"
              @click="openLink('', '')"
            >
              Link a printer
            </app-btn>
          </div>
        </template>
      </section>
    </div>

    <add-instance-dialog
      v-if="addressDialog"
      v-model="addressDialog"
      @resolve="connectAddress"
    />
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
      :initial-mode="accountMode"
      @signed-in="onSignedIn"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
      :initial-printer-id="linkPrinterId"
      :initial-host="linkHost"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { InstanceConfig } from '@/store/config/types'
import { cloudState } from '@/services/muon-cloud/state'
import { activateCloudPrinter, activateLocalPrinter } from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  instanceForHost,
  lanLinkAvailability,
  localPageUrl,
  sameNamedPrinter,
  type LanPrinter
} from '@/services/muon-cloud/discovery'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'

/** One printer on this network, from the LAN search, the service, or both. */
interface LocalRow {
  key: string;
  name: string;
  /** Its address on this network, when known. */
  host: string | null;
  meta: string;
  /** Why it can or cannot be linked, in words. */
  status: string;
  linked: boolean;
  canLink: boolean;
  /** Set when the service sees it: the code is then asked for through the service. */
  cloudId?: string;
  lan?: LanPrinter;
}

@Component({ components: { CloudAccountDialog, LinkPrinterDialog } })
export default class Welcome extends Vue {
  addressDialog = false
  accountDialog = false
  accountMode: 'sign-in' | 'sign-up' = 'sign-up'
  linkDialog = false
  /** A printer the service found, to show a code as soon as the link dialog opens. */
  linkPrinterId = ''
  /** A printer the LAN search found, to show a code as soon as the link dialog opens. */
  linkHost = ''
  /** A printer picked for linking before sign-in. */
  pendingLink: LocalRow | null = null
  connecting: string | null = null
  error: string | null = null
  /** A printer that would not connect from this page, to offer its own page instead. */
  fallbackHost: string | null = null
  icons = { cloud: '$cloud', lan: '$lan' }

  get account () {
    return cloudState.account
  }

  get cloudPrinters () {
    return cloudState.printers
  }

  /**
   * Every printer on this network, linked or not. A printer both searches
   * found appears once, with what the service knows about its link.
   */
  get localRows (): LocalRow[] {
    const rows: LocalRow[] = []
    for (const l of discoveryState.found) {
      const c = discoveryState.cloud.find(x => sameNamedPrinter(x.name, l.name))
      if (c) {
        rows.push(this.row(c.printerId, l.name, l.host, c.linked, this.isMine(c.printerId), c.printerId, l))
        continue
      }
      const linked = l.link.phase === 'linked'
      const mine = linked && !!l.link.account && l.link.account === this.account?.email
      const { canShow, note } = lanLinkAvailability(l.link)
      rows.push({
        key: l.host,
        name: l.name,
        host: l.host,
        meta: `${l.host} · ${linked ? (mine ? 'in your account' : 'linked to an account') : note}`,
        status: note,
        linked,
        canLink: canShow,
        lan: l
      })
    }
    for (const c of discoveryState.cloud) {
      if (discoveryState.found.some(l => sameNamedPrinter(c.name, l.name))) continue
      rows.push(this.row(c.printerId, c.name, c.localAddrs[0] ?? null, c.linked, this.isMine(c.printerId), c.printerId))
    }
    return rows
  }

  row (key: string, name: string, host: string | null, linked: boolean, mine: boolean, cloudId: string, lan?: LanPrinter): LocalRow {
    const status = !linked
      ? 'not linked to an account'
      : mine ? 'in your account' : 'linked to another account'
    return {
      key,
      name,
      host,
      meta: `${host ?? 'address unknown'} · ${status}`,
      status,
      linked,
      canLink: !linked,
      cloudId,
      lan
    }
  }

  get scanning () {
    return discoveryState.scanning
  }

  get searching () {
    return discoveryState.scanning || !discoveryState.cloudChecked
  }

  get scanNetwork () {
    return discoveryState.network
  }

  created () {
    discoverPrinters().catch(() => {})
  }

  rescan () {
    discoveryState.cloudChecked = false
    discoverPrinters(true).catch(() => {})
  }

  isMine (printerId: string) {
    return cloudState.printers.some(p => p.id === printerId)
  }

  localPage (host: string) {
    return localPageUrl(host)
  }

  /**
   * Connects Fluidd, on this page, to a printer on this network. That is a
   * local connection, open to anyone on the network unless the printer has a
   * password, and it needs no account.
   */
  async openRow (p: LocalRow) {
    if (!p.host) return
    await this.connectInstance(instanceForHost(p.host, p.name), p.key, p.host)
  }

  /** Makes the printer show a link code, and opens the dialog to type it into. */
  linkRow (p: LocalRow) {
    if (!this.account) {
      this.pendingLink = p
      this.openAccount('sign-in')
      return
    }
    if (p.cloudId) this.openLink(p.cloudId, '')
    else if (p.lan) this.openLink('', p.lan.host)
  }

  openLink (printerId: string, host: string) {
    this.linkPrinterId = printerId
    this.linkHost = host
    this.linkDialog = true
  }

  openAccount (mode: 'sign-in' | 'sign-up') {
    this.accountMode = mode
    this.accountDialog = true
  }

  onSignedIn () {
    // A printer picked before sign-in, or a new account with nothing to open
    // yet: go straight to linking.
    const pending = this.pendingLink
    this.pendingLink = null
    if (pending) this.linkRow(pending)
    else if (!cloudState.printers.length) this.openLink('', '')
  }

  async connectAddress (instance: InstanceConfig) {
    await this.connectInstance(instance, instance.apiUrl, null)
  }

  async connectInstance (instance: InstanceConfig, key: string, host: string | null) {
    this.error = null
    this.fallbackHost = null
    this.connecting = key
    try {
      await activateLocalPrinter(instance)
      if (this.$store.state.config.apiUrl) {
        this.$router.push('/')
        return
      }
      this.error = `Could not connect to ${instance.name || instance.apiUrl} from this page.`
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.connecting = null
    }
    // Browsers other than Chromium block a secure page from reaching a
    // plain-HTTP printer. The printer's own page still works there.
    if (host && location.protocol === 'https:') this.fallbackHost = host
  }

  async openCloud (id: string) {
    this.error = null
    this.connecting = id
    try {
      await activateCloudPrinter(id)
      this.$router.push('/')
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.connecting = null
    }
  }
}
</script>

<style lang="scss" scoped>
.muon-welcome {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 0 48px;

  &__head {
    margin-bottom: 28px;
  }

  &__wordmark {
    font-family: var(--m3d-font-display);
    font-size: var(--m3d-text-sm);
    letter-spacing: 0.18em;
    color: var(--m3d-accent);
    margin-bottom: 14px;
  }

  &__title {
    font-size: var(--m3d-text-2xl);
    font-weight: var(--m3d-weight-semibold);
    line-height: var(--m3d-leading-tight);
    color: var(--m3d-text);
    margin: 0 0 8px;
  }

  &__lede {
    font-size: var(--m3d-text-md);
    color: var(--m3d-text-muted);
    max-width: 560px;
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }

  &__panel {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: var(--m3d-surface);
  }

  &__label {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: var(--m3d-text-2xs);
    font-weight: var(--m3d-weight-semibold);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--m3d-text-muted);
  }

  &__scan {
    display: inline-flex;
    align-items: center;
    font-family: var(--m3d-font-mono);
    letter-spacing: 0;
    text-transform: none;
    max-width: 55%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__copy {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
    margin: 0 0 4px;
  }

  &__printer {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: var(--m3d-surface-2);
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color var(--m3d-duration-fast) var(--m3d-ease), background var(--m3d-duration-fast) var(--m3d-ease);

    &:hover:not(:disabled) {
      border-color: var(--m3d-accent-line);
      background: var(--m3d-accent-soft);
    }

    &:disabled {
      cursor: default;
      opacity: 0.7;
    }

    &.is-offline {
      opacity: 0.6;
    }

    &.is-row {
      flex-wrap: wrap;
      cursor: default;

      &:hover {
        border-color: var(--m3d-border);
        background: var(--m3d-surface-2);
      }
    }
  }

  &__row-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  &__dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-success);

    &.is-offline {
      background: var(--m3d-text-subtle);
    }

    &.is-waiting {
      background: var(--m3d-accent);
    }
  }

  &__printer-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  &__printer-name {
    font-weight: var(--m3d-weight-medium);
    color: var(--m3d-text);
  }

  &__printer-meta {
    font-family: var(--m3d-font-mono);
    font-size: var(--m3d-text-xs);
    color: var(--m3d-text-muted);
  }

  &__go {
    font-size: var(--m3d-text-xs);
    font-weight: var(--m3d-weight-semibold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--m3d-accent);
  }

  &__empty {
    padding: 14px 12px;
    margin-bottom: 8px;
    border: 1px dashed var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;
  }
}
</style>
