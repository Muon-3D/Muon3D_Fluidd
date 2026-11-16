<template>
  <div
    class="acct-section"
    data-tid="account-sessions"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <div class="acct-head__title">
          <h1>Your devices</h1>
          <acct-more label="What signing out does">
            Signing a device out ends its remote connections to your printers. Prints carry on. A device unused for 30 days signs out by itself.
          </acct-more>
        </div>
        <p>Where your account is signed in, and the devices paired straight to your printers</p>
      </div>
      <button
        v-if="others.length && !everywhereMissing"
        type="button"
        class="lib-btn lib-btn--dng"
        :disabled="busy"
        data-tid="sessions-everywhere-else"
        @click="signOutOthers"
      >
        Sign out everywhere else…
      </button>
    </div>

    <!-- 1 · Signed in to your account. -->
    <div
      class="acct-gt"
      data-tid="sessions-signed-in-title"
    >
      Signed in to your account<template v-if="devices">
        · {{ devices.length }}
      </template>
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="Signed in to your account"
    >
      <p
        v-if="!devices"
        class="acct-grow acct-muted sess__reading"
      >
        Reading your devices…
      </p>
      <div
        v-for="device in devices || []"
        :key="device.id"
        class="acct-grow sess__device"
        :data-tid="device.current ? 'sessions-this-device' : 'sessions-device'"
      >
        <span
          class="acct-icon-box"
          :class="{ 'sess__icon--here': device.current }"
        ><frame-icon
          :name="iconOf(device)"
          small
        /></span>
        <div class="acct-grow__text">
          <span class="sess__name">
            <b>{{ device.label }}</b>
            <span
              v-if="device.current"
              class="lib-pill lib-pill--run"
            >This device</span>
            <span
              v-else-if="isNew(device)"
              class="lib-pill sess__new"
            >New</span>
          </span>
          <span>{{ detail(device) }}</span>
        </div>
        <button
          v-if="!device.current"
          type="button"
          class="lib-btn lib-btn--sm"
          :disabled="busy"
          data-tid="sessions-sign-out"
          @click="signOutDevice(device)"
        >
          Sign out
        </button>
      </div>
    </div>
    <div class="acct-gh">
      A device unused for 30 days signs out by itself.
    </div>
    <div
      v-if="devices && !others.length"
      class="acct-empty"
      data-tid="sessions-empty"
    >
      <span class="acct-empty__icon acct-empty__icon--good"><frame-icon
        name="monitor"
        large
      /></span>
      <h3>Only this device is signed in</h3>
      <p>Get the Muon3D app for print alerts away from home.</p>
    </div>

    <!-- 2 · Paired over Bluetooth or let in at a printer. -->
    <div class="acct-gt">
      Paired over Bluetooth or let in at a printer
    </div>
    <div
      class="acct-glist"
      role="group"
      aria-label="Paired over Bluetooth or let in at a printer"
      data-tid="sessions-paired"
    >
      <div
        class="acct-grow"
        data-tid="sessions-paired-unavailable"
      >
        <span class="acct-icon-box"><frame-icon
          name="devices"
          small
        /></span>
        <span class="acct-grow__text">
          <b>Not available yet</b>
          <span>Your account can't list the devices your printers have paired or let in yet, with the printers each one reaches, so they can't be removed everywhere from here.</span>
        </span>
      </div>
    </div>
    <div class="acct-gh">
      These reach a printer directly. Removing one here will sign it out and end its pairings on every printer. To take one off a single printer, use that printer's People and access.
    </div>

    <div class="acct-note acct-note--warn">
      <frame-icon
        name="alert"
        small
      />
      <span>Don't recognise a device? Sign it out, then <router-link
        :to="linkTo('security')"
        class="acct-link"
      >change your password</router-link>.</span>
    </div>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ message }}</span>
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
import { Component, Prop, Vue } from 'vue-property-decorator'
import { accountApi } from '@/services/account/api'
import { AccountError, isMissing } from '@/services/account/client'
import { accountState, describe, loadSessions } from '@/services/account/state'
import { agoText, devicesFrom, listText, type AccountSectionId, type Device } from '@/services/account/model'
import { beginSignOut } from '@/services/account/sign-out'
import AcctMore from './AcctMore.vue'

/** Signed in for less than this, and not this browser: "New". */
const NEW_FOR_S = 3 * 86400

/**
 * Your devices (settings/account-devices, 6 Nov): each device signed in to
 * the account once, with what it uses and when it was last used; signing one
 * out, or every other one (Bluetooth pairings stay). Devices paired at a
 * printer, with Remove everywhere (People and access R11), wait for the
 * console to list them: until then the row says so. The account's activity
 * is in Sign-in and security.
 */
@Component({ components: { AcctMore } })
export default class AccountSessions extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  busy = false
  error = ''
  message = ''
  everywhereMissing = false

  created () {
    this.refresh()
  }

  refresh () {
    loadSessions().catch(() => {})
  }

  get devices (): Device[] | null {
    return accountState.sessions ? devicesFrom(accountState.sessions) : null
  }

  get others (): Device[] {
    return (this.devices ?? []).filter(d => !d.current)
  }

  iconOf (device: Device): string {
    if (device.kind === 'phone') return 'phone'
    return /mac|laptop/i.test(device.label) ? 'laptop' : 'monitor'
  }

  isNew (device: Device): boolean {
    return !device.leftover && Date.now() / 1000 - device.signedInAt < NEW_FOR_S
  }

  detail (device: Device): string {
    const parts: string[] = []
    if (device.uses) parts.push(device.uses)
    if (device.phoneKey) parts.push(`key ${device.phoneKey}`)
    const used = agoText(device.lastUsedAt)
    parts.push(device.current ? 'active now' : used === 'now' ? 'active now' : `active ${used}`)
    return parts.join(' · ')
  }

  async signOutDevice (device: Device) {
    if (device.current) {
      beginSignOut(this.$router)
      return
    }
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await accountApi.endDevice(device.id).catch((error) => {
        // Already ended by another device. A missing route is an upgrade gap.
        if (!(error instanceof AccountError && error.status === 404 && !isMissing(error))) throw error
      })
      this.message = `${device.label} is signed out.`
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
      this.refresh()
    }
  }

  async signOutOthers () {
    const n = this.others.length
    const sure = await this.$confirm(`${listText(this.others.map(d => d.label))}. Bluetooth pairings to your printers stay.`, {
      title: `Sign out ${n === 1 ? 'one other device' : `${n} other devices`}?`,
      buttonTrueText: 'Sign out',
      danger: true
    })
    if (!sure) return
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await accountApi.endSessions('others')
      this.message = 'Every other device is signed out. Bluetooth pairings to your printers stay.'
    } catch (error) {
      if (isMissing(error)) {
        this.everywhereMissing = true
        this.message = 'Signing every other device out at once comes soon. Until then, sign them out one by one above.'
      } else {
        this.error = describe(error)
      }
    } finally {
      this.busy = false
      this.refresh()
    }
  }
}
</script>

<style lang="scss" scoped>
  .sess__device {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
  }

  .sess__icon--here {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .sess__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .sess__new {
    background: color-mix(in srgb, var(--m3d-accent) 14%, transparent);
    color: var(--m3d-accent);
  }

  .sess__reading {
    margin: 0;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    .sess__device {
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .sess__device > button {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
