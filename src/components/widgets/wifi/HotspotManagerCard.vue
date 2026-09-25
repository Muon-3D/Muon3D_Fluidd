<template>
  <collapsable-card
    :title="$t('app.general.title.hotspot')"
    icon="$accessPoint"
    class="component"
  >
    <protected-notice class="ma-4" />

    <template #menu>
      <!-- hotspot on/off switch -->
      <v-switch
        dense
        :hide-details="true"
        color="primary"
        :input-value="apState"
        :disabled="locked || !apCredentials || !deviceStatus || toggling"
        :loading="toggling"
        class="mobile-only mt-0"
        readonly
        @click.native="requestToggle"
      />
    </template>

    <div
      v-if="!locked"
      class="d-flex align-stretch"
    >
      <v-fade-transition mode="out-in">
        <!-- Skeleton until we have both deviceStatus & credentials -->
        <template v-if="!deviceStatus">
          <v-skeleton-loader
            type="image"
            class="ma-4 mr-0 desktop-only"
            style="height: 160px; width: 160px"
          />
        </template>

        <template v-else>
          <v-card
            v-square
            class="ap-card ma-4 mr-0 desktop-only"
            color="card-heading"
            :loading="toggling ? 'primary' : false"
            :disabled="toggling"
            style="flex-shrink: 0;"
            @click="requestToggle"
          >
            <div
              class="d-flex align-center justify-center"
              style="height:100%"
            >
              <v-icon
                size="60%"
                :color="deviceStatus?.state === 'connected' ? 'green' : deviceStatus?.state === 'disconnected' ? 'red' : ''"
                class=""
              >
                {{ "$accessPointNetwork" + (deviceStatus?.state === 'connected' ? '' : 'Off') }}
              </v-icon>
            </div>
          </v-card>
        </template>
      </v-fade-transition>

      <v-fade-transition mode="out-in">
        <template v-if="!apCredentials">
          <v-skeleton-loader
            type="image"
            class="ma-4 flex-grow-1"
            style="height:160px"
          />
        </template>
        <template v-else>
          <v-card
            class="ap-card ma-4 d-flex flex-row"
            color="card-heading"
            :loading="applying ? 'primary' : false"
            :link="!editing"
            :ripple="!editing"
            :disabled="toggling || applying"
            :class="{ editing: editing }"
            @click="!editing ? toggleEditing() : null"
          >
            <div class="pa-4">
              <v-form
                ref="apForm"
                v-model="formIsValid"
                :disabled="!editing || applying"
                lazy-validation
                class="d-flex flex-row flex-grow-1"
                @submit.prevent="requestApplyChanges"
              >
                <!-- SSID + Password Inputs -->
                <div class="d-flex flex-grow-1">
                  <div class="d-flex flex-column reverse">
                    <div class="flex-grow-1" />
                    <!-- security switch always enabled once creds are loaded -->
                    <v-switch
                      v-model="form.securityEnabled"
                      class="me-2"
                    />
                  </div>
                  <div class="pt-3">
                    <v-text-field
                      v-model="form.ssid"
                      label="SSID"
                      dense
                      :rules="ssidRules"
                    />
                    <v-text-field
                      ref="passwordInput"
                      v-model="form.password"
                      :label="$t('app.general.label.password')"
                      :type="passwordVisible ? 'text' : 'password'"
                      :append-icon="passwordVisible ? '$eyeOff' : '$eye'"
                      :rules="passwordRules"
                      dense
                      :disabled="!form.securityEnabled || !editing || applying"
                      @click:append.stop="passwordVisible = !passwordVisible"
                    />
                  </div>
                </div>

                <!-- Change / Undo buttons -->
                <v-expand-x-transition>
                  <div
                    v-if="(editing ? delayedEditing : editing) || !apState"
                    key="actions"
                    class="actions-outer"
                  >
                    <div
                      key="actions"
                      class="actions-container d-flex flex-column text-right pl-4"
                    >
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="applying"
                        :disabled="!isDirty || !formIsValid || applying || !editing"
                        class="elevation-2"
                      >
                        {{ $t('app.wifi.change') }}
                      </v-btn>
                      <v-btn
                        text
                        type="button"
                        :disabled="applying || !editing"
                        :class="{'editing': editing}"
                        class="back-btn"
                        @click.stop="undoChanges"
                      >
                        {{ isDirty ? "Undo" : "Back" }}
                      </v-btn>
                    </div>
                  </div>
                </v-expand-x-transition>
                <v-expand-x-transition>
                  <div
                    v-if="(editing ? !editing : !delayedEditing) && apState && QrValue"
                    key="qr"
                    class="d-flex"
                  >
                    <v-divider
                      vertical
                      class="mx-4"
                    />
                    <div
                      class="flex-grow-1"
                      style="position: relative;"
                    >
                      <div
                        v-square
                        class="qr-dummy-square"
                      />
                      <qrcode-vue
                        class="qrcode elevation-7"
                        :value="QrValue"
                        :size="50"
                        render-as="svg"
                      />
                    </div>
                  </div>
                </v-expand-x-transition>
              </v-form>
            </div>
          </v-card>
        </template>
      </v-fade-transition>
    </div>

    <v-dialog
      v-model="showToggleWarningDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.wifi.modal.warning.title') }}
        </v-card-title>
        <v-card-text>
          {{ $t('app.wifi.modal.warning.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="toggling || applying"
            @click="showToggleWarningDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="warning"
            :loading="toggling || applying"
            @click="confirmToggle"
          >
            {{ $t('app.general.btn.Proceed') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showChangeWarningDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.wifi.modal.warning.title') }}
        </v-card-title>
        <v-card-text>
          {{ $t('app.wifi.modal.warning.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="toggling || applying"
            @click="showChangeWarningDialog = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="warning"
            :loading="toggling || applying"
            @click="confirmApply"
          >
            {{ $t('app.general.btn.Proceed') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </collapsable-card>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import type { APCredentials, Device } from '@/aux_api'
import QrcodeVue from 'qrcode.vue'
import i18n from '@/plugins/i18n'
import { useHotspotCheck } from '@/aux_api/useHotspotCheck'
import type { VForm } from '@/types'
import { EventBus } from '@/eventBus'
import { moonrakerErrorMessage } from '@/store/protection/helpers'

const { onHotspot } = useHotspotCheck()

@Component({
  directives: {
    square: {
      inserted (el: HTMLElement) {
        // measure → apply
        const update = () => {
          el.style.width = el.offsetHeight + 'px'
        }
        // run once
        update()
        // on window resize
        window.addEventListener('resize', update)
        // on parent-content resize (e.g. right card changes height)
        if ('ResizeObserver' in window) {
          const ro = new ResizeObserver(update)
          ro.observe(el.parentElement!)
          // stash so we can disconnect later
          ; (el as any).__ro__ = ro
        }
        // stash the listener so we can clean up
        (el as any).__sq__ = update
      },
      unbind (el: any) {
        window.removeEventListener('resize', el.__sq__)
        if (el.__ro__) el.__ro__.disconnect()
      }
    }
  },
  components: {
    QrcodeVue
  }
})
export default class HotspotManagerCard extends Vue {
  formIsValid: boolean = false

  get onHotspot () {
    return onHotspot.value
  }

  // MuonOS network protection is on and this browser has no identity, so
  // every hotspot request would be refused. The notice says so instead, and
  // polling waits until that changes.
  get locked (): boolean {
    return this.$store.getters['protection/isLocked']
  }

  // Protection came off while this card was open. The config it skipped
  // while locked is loaded now; the status poll only ever reads the state.
  @Watch('locked')
  onLockedChanged (locked: boolean) {
    if (!locked) this.fetchConfig()
  }

  showToggleWarningDialog: boolean = false
  showChangeWarningDialog: boolean = false

  // “Request” methods show the warning dialog instead of immediately doing the thing
  requestToggle () {
    if (onHotspot.value) {
      this.showToggleWarningDialog = true
    } else {
      // if not on hotspot, just toggle immediately
      this.confirmToggle()
    }
  }

  // “Confirm” methods perform the real action, then hide the dialog
  async confirmToggle () {
    this.showToggleWarningDialog = false
    await this.changeHotspotState(!this.apState)
  }

  async requestApplyChanges () {
    // trigger Vuetify’s validation UI
    const form = this.$refs.apForm as VForm
    if (!form || !(form.validate() && this.isDirty)) return

    if (onHotspot.value) {
      // if we are on hotspot, show the warning dialog
      this.showChangeWarningDialog = true
    } else {
      // if not on hotspot, apply changes immediately
      await this.confirmApply()
    }
  }

  async confirmApply () {
    this.showChangeWarningDialog = false
    await this.applyChanges()
  }

  private auxApi = useAuxApi()

  deviceStatus: Device | null = null
  apCredentials: APCredentials | null = null

  editing = false
  applying = false

  toggleEditing () {
    this.editing = !this.editing
    this.resetForm()
  }

  open: boolean = false

  // local form + pristine copy
  form = {
    ssid: '',
    password: '',
    securityEnabled: true
  }

  private original = { ...this.form }

  passwordVisible = false
  private statusPollId: number | null = null
  private destroyed = false
  private requestedApState: boolean | null = null
  private requestedApStateUntil = 0

  async mounted () {
    await this.fetchConfig()
    if (!this.destroyed) {
      this.statusPollId = window.setInterval(() => {
        this.refreshStatus()
      }, 1000)
    }
  }

  beforeDestroy () {
    this.destroyed = true
    if (this.statusPollId !== null) {
      window.clearInterval(this.statusPollId)
      this.statusPollId = null
    }
  }

  private async fetchConfig () {
    if (this.locked) return
    try {
      const [statusResponse, credentialsResponse] = await Promise.all([
        this.auxApi.ap.wifiStatusWifiApDeviceStatusGet(),
        this.auxApi.ap.apShowCredentialsWifiApShowGet()
      ])
      this.applyDeviceStatus(statusResponse.data)
      this.apCredentials = credentialsResponse.data
      this.resetForm()
    } catch (e) {
      console.error('Failed to load hotspot config', e)
      if ((e as any)?.response?.status === 403) {
        // A load nobody asked for, refused by network protection. The card
        // says so once the level arrives; a toast would only repeat it.
        this.$store.dispatch('protection/onRefused')
      } else {
        EventBus.$emit(`${this.$t('app.wifi.msg.hotspot.load_error')} ${moonrakerErrorMessage(e)}`, { type: 'error', timeout: 5000 })
      }
    }
  }

  private async refreshStatus () {
    if (this.locked) return
    try {
      const response = await this.auxApi.ap.wifiStatusWifiApDeviceStatusGet()
      this.applyDeviceStatus(response.data)
    } catch (_) {
      // Dropping the hotspot can briefly drop Fluidd's request transport too.
      // A later poll reconciles when the printer is reachable again.
    }
  }

  private applyDeviceStatus (status: Device) {
    const observedState = status.state === 'connected'
    if (
      this.requestedApState !== null &&
      Date.now() < this.requestedApStateUntil &&
      observedState !== this.requestedApState
    ) return

    this.requestedApState = null
    this.deviceStatus = status
  }

  get isDirty (): boolean {
    return (
      this.form.ssid !== this.original.ssid ||
      this.form.securityEnabled !== this.original.securityEnabled ||
      (this.form.securityEnabled &&
        this.form.password !== this.original.password)
    )
  }

  private resetForm () {
    if (!this.apCredentials) return
    this.form.ssid = this.apCredentials.ssid
    this.form.password = this.apCredentials.password || ''
    this.passwordVisible = false
    // Older Aux versions do not expose the safe boolean. Keep the secure
    // fallback until the matching OS update reaches the printer.
    this.form.securityEnabled = this.apCredentials.security_enabled ?? true
    this.original = { ...this.form }
  }

  async applyChanges () {
    if (!this.apCredentials) return
    this.applying = true
    try {
      const payload: APCredentials = {
        ssid: this.form.ssid,
        password: this.form.securityEnabled
          ? this.form.password
          : null
      }
      await this.auxApi.ap.apModifyWifiApModifyPost(payload)
      // on success, commit new “original” snapshot
      // this.original = { ...this.form }
      await this.fetchConfig() // re-fetch to get the latest config
      // Re-activate once so NetworkManager applies the saved profile. This is
      // also the only activation request when the hotspot was previously off.
      await this.changeHotspotState(true)
    } catch (e) {
      console.error('Failed to apply hotspot config', e)
      if ((e as any)?.response?.status === 403) this.$store.dispatch('protection/onRefused')
      EventBus.$emit(`${this.$t('app.wifi.msg.hotspot.apply_error')} ${moonrakerErrorMessage(e)}`, { type: 'error', timeout: 5000 })
    }
    this.applying = false
    this.toggleEditing() // close the form
  }

  undoChanges () {
    this.resetForm()
    this.toggleEditing()
  }

  // —— keep switch ↔ password in sync ——
  @Watch('form.password')
  private onPasswordEdited (newVal: string) {
    this.form.securityEnabled = !!newVal
  }

  @Watch('form.securityEnabled')
  private onSecurityToggled (newVal: boolean) {
    if (!newVal) {
      // switching security off wipes the password
      this.form.password = ''
    } else {
      // switching on → focus the password field
      this.$nextTick(() => {
        const pw = this.$refs.passwordInput as any
        if (pw && pw.focus) pw.focus()
        else if (pw && pw.$el) {
          const inp = pw.$el.querySelector('input')
          inp && inp.focus()
        }
      })
    }
  }

  public get ssidRules (): Array<(v: string) => true | string> {
    return [
      (v: string) => !!v || i18n.t('app.general.simple_form.error.required').toString()
    ]
  }

  /**
   * WPA-PSK rule: either
   *  • exactly 64 hex digits, or
   *  • 8–63 printable-ASCII chars (32–126)
   */
  public get passwordRules (): Array<(v: string) => true | string> {
    return [
      (v: string): true | string => {
        if (!this.form.securityEnabled) return true

        // 1) allow exactly 64 hex digits
        if (/^[0-9A-Fa-f]{64}$/.test(v)) {
          return true
        }

        // 2) enforce length
        if (v.length < 8) {
          return i18n.t('app.wifi.password.too-short').toString()
        }
        if (v.length > 63) {
          return i18n.t('app.wifi.password.too-long').toString()
        }

        // 3) catch any non-printable-ASCII chars
        const invalidChars = Array.from(v)
          .filter(ch => {
            const code = ch.charCodeAt(0)
            return code < 32 || code > 126
          })
          // dedupe same character in the list
          .filter((ch, idx, arr) => arr.indexOf(ch) === idx)
        if (invalidChars.length) {
          return i18n.t('app.wifi.password.invalid-character').toString() + ': ' +
            invalidChars.map(c => {
              const code = c.charCodeAt(0)
              // show either the literal or its hex code if whitespace
              return /\s/.test(c)
                ? `0x${code.toString(16).padStart(2, '0')}`
                : `'${c}'`
            }).join(', ')
        }

        // if we made it here, it's valid ASCII & length
        return true
      }
    ]
  }

  toggling: boolean = false

  private async changeHotspotState (wantsOn?: boolean) {
    // guard: need credentials and not already toggling
    if (!this.apCredentials || this.toggling) return

    // determine desired state
    const turnOn = wantsOn !== undefined
      ? wantsOn
      : this.deviceStatus?.state !== 'connected'

    this.toggling = true
    this.requestedApState = turnOn
    this.requestedApStateUntil = Date.now() + 5000
    this.apState = turnOn
    try {
      if (turnOn) {
        await this.auxApi.ap.apUpWifiApUpPost()
      } else {
        await this.auxApi.ap.apDownWifiApDownPost()
      }
    } catch (e) {
      this.requestedApState = null
      this.apState = this.deviceStatus?.state === 'connected'
      console.error('Hotspot toggle failed', e)
      if ((e as any)?.response?.status === 403) this.$store.dispatch('protection/onRefused')
      EventBus.$emit(`${this.$t('app.wifi.msg.hotspot.toggle_error')} ${moonrakerErrorMessage(e)}`, { type: 'error', timeout: 5000 })
    } finally {
      this.toggling = false
    }
  }

  // ------------------------------------------------------
  // NEW: local switch state for the v-switch
  apState: boolean = false

  // Sync switch → deviceStatus whenever we re-fetch
  @Watch('deviceStatus', { immediate: true })
  private onDeviceStatusChanged (newStatus: Device | null) {
    this.apState = newStatus?.state === 'connected'
  }
  // ------------------------------------------------------

  // A join code for the hotspot, or '' when this page cannot write a true one.
  // A secured hotspot whose key the API redacts (KAN-376) has no code here:
  // T:nopass would send a phone to an open network that does not exist. The
  // key and its code are shown only on the printer's screen (setup spec S1).
  get QrValue (): string {
    if (!this.apCredentials) return ''
    const { ssid, password, security_enabled: securityEnabled } = this.apCredentials
    if (!password && securityEnabled !== false) return ''
    const S = ssid.replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    const T = password ? 'WPA' : 'nopass'
    const P = password ? password.replace(/\\/g, '\\\\').replace(/;/g, '\\;') : ''
    return `WIFI:S:${S};T:${T};${password ? `P:${P};` : ''}H:false;;`
  }

  delayedEditing: boolean = this.editing
  @Watch('editing')
  onEditingChanged (newVal: boolean) {
    // set a new one
    window.setTimeout(() => {
      this.delayedEditing = newVal
    }, 100)
  }

    @Watch('deviceStatus', { immediate: true })
  emitDeviceStatus (v: Device|null) {
    this.$emit('update:device-status', v)
  }

  @Watch('toggling', { immediate: true })
    emitToggling (v: boolean) {
      this.$emit('update:toggling', v)
    }
}
</script>

<style scoped>
.component {
  container-type: inline-size;
}

@container (max-width: 600px) {
  /* roughly sm breakpoint */
  .component .desktop-only { display: none !important; }
}

@container (min-width: 601px) {
  .component .mobile-only { display: none !important; }
}

.ap-card {
  cursor: pointer;
  transition: filter 0.3s ease;
}

.ap-card.editing{
  cursor: default;
}

.ap-card:not(.editing) {
  cursor: pointer !important;
}
/* deep‐select every descendant and force pointer */
.ap-card:not(.editing) ::v-deep * {
  cursor: pointer !important;
}
.ap-card:not(.editing) ::v-deep .v-input__control,
.ap-card:not(.editing) ::v-deep .v-input,
.ap-card:not(.editing) ::v-deep input,
.ap-card:not(.editing) ::v-deep textarea,
.ap-card:not(.editing) ::v-deep .v-switch__thumb,
.ap-card:not(.editing) ::v-deep .v-switch__track {
  /* disable their own hit-testing so clicks fall through */
  pointer-events: none !important;
}

.actions-container {
  min-width: 100px;
  justify-content: space-evenly;
}

/* disable the focus‐overlay */
.v-card--link:focus::before {
  opacity: 0 !important;
}

/* re-enable it on hover */
.v-card--link:hover::before {
  opacity: 0.08 !important;
}

.v-card--link.editing:hover::before {
  opacity: 0 !important
}

.v-card--link::before {
  border-radius: inherit;
}

.actions-outer {
  display: flex;
  /* shrink to the inner content width */
  overflow: hidden;
  /* hide overflow during width animation */
}

.qr-dummy-square {
  height: 100%;
}

.qrcode {
  padding: 6px;
  border-radius: 3px;
  background: #fff;
  aspect-ratio: 1/1;
  width: 100% !important;
  height: 100% !important;

  position: absolute;
  top: 0;
  left: 0;
}

.qrcode :deep(svg) {
  width: 100% !important;
  height: 100% !important;
}

.back-btn {
  transition: opacity 0.3s ease;
  opacity: 1;
  &:not(.editing){
    opacity: 0;
  }
}

</style>
