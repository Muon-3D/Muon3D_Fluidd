<template>
  <collapsable-card
    :title="$t('app.general.title.hotspot')"
    icon="$accessPoint"
    class="component"
  >
    <template #menu>
      <!-- hotspot on/off switch -->
      <v-switch
        dense
        :hide-details="true"
        color="primary"
        :input-value="apState"
        :disabled="!apCredentials || !deviceStatus || toggling"
        :loading="toggling"
        class="mobile-only mt-0"
        readonly
        @click.native="requestToggle"
      />
    </template>

    <div class="d-flex align-stretch">
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
            class="ma-4 mr-0 flex-grow-1"
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
                      type="text"
                      :rules="passwordRules"
                      dense
                      :disabled="!form.securityEnabled || !editing || applying"
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
                    v-if="(editing ? !editing : !delayedEditing) && apState"
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
        <v-card-text v-if="!onHotspot">
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
        <v-card-text v-if="!onHotspot">
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
    // pass the new desired state explicitly
    const prom = this.changeHotspotState(!this.apState)
    this.apState = !this.apState // toggle the local switch state
    await prom // wait for the API call to finish
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
    await this.auxApi.api.apUpWifiApUpPost()
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

  async mounted () {
    await this.fetchConfig()
  }

  private async fetchConfig () {
    try {
      this.deviceStatus = (await this.auxApi.api.wifiStatusWifiApDeviceStatusGet()).data
      this.apCredentials = (await this.auxApi.api.apShowCredentialsWifiApShowGet()).data
      this.resetForm()
    } catch (e) {
      console.error('Failed to load hotspot config', e)
    }
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
    this.form.securityEnabled = !!this.apCredentials.password
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
          : null,
        autoconnect: true
      }
      await this.auxApi.api.apModifyWifiApModifyPost(payload)
      // on success, commit new “original” snapshot
      // this.original = { ...this.form }
      await this.fetchConfig() // re-fetch to get the latest config
      if (this.deviceStatus?.state !== 'connected') {
        // if we were connected, turn the hotspot on
        await this.changeHotspotState()
      }
    } catch (e) {
      console.error('Failed to apply hotspot config', e)
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
    try {
      if (turnOn) {
        await this.auxApi.api.apUpWifiApUpPost()

        if (this.apCredentials && !this.apCredentials.autoconnect) {
          const payload: APCredentials = {
            ssid: this.apCredentials.ssid,
            password: this.apCredentials.password,
            autoconnect: true
          }
          await this.auxApi.api.apModifyWifiApModifyPost(payload) // Set autoconnect to false
        }
      } else {
        await this.auxApi.api.apDownWifiApDownPost()

        if (this.apCredentials && this.apCredentials.autoconnect) {
          const payload: APCredentials = {
            ssid: this.apCredentials.ssid,
            password: this.apCredentials.password,
            autoconnect: false
          }
          await this.auxApi.api.apModifyWifiApModifyPost(payload) // Set autoconnect to false
        }
      }
    } catch (e) {
      console.error('Hotspot toggle failed', e)
    }

    // refresh status & UI
    await this.fetchConfig()
    this.toggling = false
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

  get QrValue (): string {
    if (!this.apCredentials) return ''
    const ssid = this.apCredentials.ssid
    const password = this.apCredentials.password
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
