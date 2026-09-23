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
            v-if="scanning"
            class="muon-welcome__scan"
          >
            <v-progress-circular
              indeterminate
              size="11"
              width="2"
              class="mr-1"
            />
            {{ scanNetwork }}
          </span>
        </div>

        <div
          v-if="lanUnavailable"
          class="muon-welcome__empty"
        >
          This page cannot search the network. Enter the printer's address instead.
        </div>
        <template v-else>
          <button
            v-for="p in lanPrinters"
            :key="p.host"
            type="button"
            class="muon-welcome__printer"
            :disabled="!!connecting"
            @click="connect(p)"
          >
            <span class="muon-welcome__dot" />
            <span class="muon-welcome__printer-text">
              <span class="muon-welcome__printer-name">{{ p.name }}</span>
              <span class="muon-welcome__printer-meta">{{ p.host }}{{ linkNote(p) }}</span>
            </span>
            <v-progress-circular
              v-if="connecting === p.host"
              indeterminate
              size="18"
              width="2"
            />
            <span
              v-else
              class="muon-welcome__go"
            >Connect</span>
          </button>
          <div
            v-if="!lanPrinters.length"
            class="muon-welcome__empty"
          >
            {{ scanning ? 'Looking for Muon3D printers…' : 'No Muon3D printers answered on this network.' }}
          </div>
        </template>

        <v-alert
          v-if="error"
          type="error"
          dense
          text
          class="mt-3 mb-0"
        >
          {{ error }}
        </v-alert>

        <div class="muon-welcome__actions">
          <v-btn
            small
            text
            :disabled="scanning || lanUnavailable"
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
              @click="linkDialog = true"
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
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mdiCloudOutline, mdiLan } from '@mdi/js'
import type { InstanceConfig } from '@/store/config/types'
import { cloudState } from '@/services/muon-cloud/state'
import { activateCloudPrinter, activateLocalPrinter } from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  instanceFor,
  type LanPrinter
} from '@/services/muon-cloud/discovery'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'

@Component({ components: { CloudAccountDialog, LinkPrinterDialog } })
export default class Welcome extends Vue {
  addressDialog = false
  accountDialog = false
  accountMode: 'sign-in' | 'sign-up' = 'sign-up'
  linkDialog = false
  connecting: string | null = null
  error: string | null = null
  icons = { cloud: mdiCloudOutline, lan: mdiLan }

  get account () {
    return cloudState.account
  }

  get cloudPrinters () {
    return cloudState.printers
  }

  get lanPrinters (): LanPrinter[] {
    return discoveryState.found
  }

  get scanning () {
    return discoveryState.scanning
  }

  get scanNetwork () {
    return discoveryState.network
  }

  get lanUnavailable () {
    return discoveryState.unavailable
  }

  created () {
    discoverPrinters().catch(() => {})
  }

  rescan () {
    discoverPrinters(true).catch(() => {})
  }

  linkNote (p: LanPrinter) {
    if (p.link.phase !== 'linked') return ''
    return p.link.account && p.link.account === this.account?.email
      ? ' · in your account'
      : ' · linked to an account'
  }

  openAccount (mode: 'sign-in' | 'sign-up') {
    this.accountMode = mode
    this.accountDialog = true
  }

  onSignedIn () {
    // A new account has nothing to open yet, so go straight to linking.
    if (!cloudState.printers.length) this.linkDialog = true
  }

  async connect (p: LanPrinter) {
    await this.connectInstance(instanceFor(p), p.host)
  }

  async connectAddress (instance: InstanceConfig) {
    await this.connectInstance(instance, instance.apiUrl)
  }

  async connectInstance (instance: InstanceConfig, key: string) {
    this.error = null
    this.connecting = key
    try {
      await activateLocalPrinter(instance)
      if (this.$store.state.config.apiUrl) this.$router.push('/')
      else this.error = `Could not connect to ${instance.name || instance.apiUrl}.`
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.connecting = null
    }
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
