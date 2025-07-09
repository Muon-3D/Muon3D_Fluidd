<template>
  <collapsable-card :title="$t('app.general.title.hotspot')" icon="$accessPoint" class="component">

    <template #menu>
      <!-- hotspot on/off switch -->
      <v-switch dense :hide-details="true" color="primary" v-model="switchState" :disabled="!apCredentials || !deviceStatus || toggling"
        :loading="toggling" @change="onSwitchChange" class="mobile-only mt-0" />
    </template>


    <div class="d-flex align-stretch">
      <v-fade-transition mode="out-in">
        <!-- Skeleton until we have both deviceStatus & credentials -->
        <template v-if="!deviceStatus">
          <v-skeleton-loader type="image" class="ma-4 mr-0 desktop-only" style="height: 160px; width: 160px" />
        </template>

        <template v-else>
          <v-card v-square class="ap-card ma-4 mr-0 desktop-only" color="card-heading" @click="toggle"
            :loading="toggling ? 'primary' : false" :disabled="toggling" style="flex-shrink: 0;">
            <div class="d-flex align-center justify-center" style="height:100%">
              <v-icon size="60%"
                :color="deviceStatus?.state === 'connected' ? 'green' : deviceStatus?.state === 'disconnected' ? 'red' : ''"
                class="">
                {{ "$accessPointNetwork" + (deviceStatus?.state === 'connected' ? '' : 'Off') }}
              </v-icon>
            </div>
          </v-card>
        </template>
      </v-fade-transition>

      <v-fade-transition mode="out-in">
        <template v-if="!apCredentials">
          <v-skeleton-loader type="image" class="ma-4 mr-0 flex-grow-1" style="height:160px" />
        </template>
        <template v-else>
          <v-card class="ap-card ma-4 d-flex flex-row" color="card-heading" :loading="applying ? 'primary' : false"
            :link="!editing" @click="!editing ? toggleEditing() : null" :ripple="!editing"
            :class="{ editing: editing }">
            <div class="pa-4">
              <v-form :disabled="!editing || applying" ref="apForm" @submit.prevent="applyChanges"
                class="d-flex flex-row flex-grow-1">
                <!-- SSID + Password Inputs -->
                <div class="d-flex flex-grow-1">
                  <div class="d-flex flex-column reverse">
                    <div class="flex-grow-1"></div>
                    <!-- security switch always enabled once creds are loaded -->
                    <v-switch v-model="form.securityEnabled" class="me-2" />
                  </div>
                  <div class="pt-3">
                    <v-text-field v-model="form.ssid" label="SSID" dense />
                    <v-text-field ref="passwordInput" v-model="form.password" label="$t('app.general.label.password')" type="text"
                      :rules="passwordRules" dense :disabled="!form.securityEnabled || !editing || applying" />
                  </div>
                </div>

                <!-- Change / Undo buttons -->
                <v-expand-x-transition>
                  <div key="actions" class="actions-outer" v-if="editing ? delayedEditing : editing">
                    <div key="actions"
                      class="actions-container d-flex flex-column text-right pl-4">
                      <v-btn color="primary" type="submit" :loading="applying" :disabled="!isDirty || applying" class="elevation-2">
                        {{ $t('app.wifi.change') }} </v-btn>
                      <v-btn text type="button" @click.stop="undoChanges" :disabled="applying">
                        {{ isDirty ? "Undo" : "Back" }}
                      </v-btn>
                    </div>
                  </div>

                </v-expand-x-transition>
                <v-expand-x-transition>

                  <div key="qr" class="d-flex" v-if="editing ? !editing : !delayedEditing">
                    <v-divider vertical class="mx-4"></v-divider>
                    <div class="flex-grow-1" style="position: relative;">
                      <div class="qr-dummy-square" v-square></div>
                      <qrcode-vue class="qrcode elevation-7" :value="QrValue" :size="50" render-as="svg" />
                    </div>
                  </div>

                </v-expand-x-transition>
              </v-form>
            </div>
          </v-card>
        </template>
      </v-fade-transition>
    </div>
  </collapsable-card>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator';
import { useAuxApi } from '@/aux_api/useAuxApi';
import type { APCredentials, Device } from '@/aux_api';
import QrcodeVue from 'qrcode.vue'
import i18n from '@/plugins/i18n'



@Component({
  directives: {
    square: {
      inserted(el: HTMLElement) {
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
        ; (el as any).__sq__ = update
      },
      unbind(el: any) {
        window.removeEventListener('resize', el.__sq__)
        if (el.__ro__) el.__ro__.disconnect()
      }
    },
  },
  components: {
    QrcodeVue
  }
})
export default class HotspotManagerCard extends Vue {
  private auxApi = useAuxApi();

  deviceStatus: Device | null = null;
  apCredentials: APCredentials | null = null;

  editing = false;
  applying = false;


  toggleEditing() {
    this.editing = !this.editing;
    this.resetForm();
  }

  open: boolean = false;

  // local form + pristine copy
  form = {
    ssid: '',
    password: '',
    securityEnabled: true,
  };
  private original = { ...this.form };

  async mounted() {
    await this.fetchConfig();
  }

  private async fetchConfig() {
    try {
      this.deviceStatus = (await this.auxApi.api.wifiStatusWifiApDeviceStatusGet()).data
      this.apCredentials = (await this.auxApi.api.apShowCredentialsWifiApShowGet()).data
      this.resetForm();
    } catch (e) {
      console.error('Failed to load hotspot config', e);
    }
  }


  get isDirty(): boolean {
    return (
      this.form.ssid !== this.original.ssid ||
      this.form.securityEnabled !== this.original.securityEnabled ||
      (this.form.securityEnabled &&
        this.form.password !== this.original.password)
    );
  }

  private resetForm() {
    if (!this.apCredentials) return
    this.form.ssid = this.apCredentials.ssid
    this.form.password = this.apCredentials.password || ''
    this.form.securityEnabled = !!this.apCredentials.password
    this.original = { ...this.form }
  }

  async applyChanges() {
    if (!this.apCredentials) return
    this.applying = true
    try {
      const payload: APCredentials = {
        ssid: this.form.ssid,
        password: this.form.securityEnabled
          ? this.form.password
          : null,
        autoconnect: true,
      }
      await this.auxApi.api.apModifyWifiApModifyPost(payload)
      // on success, commit new “original” snapshot
      // this.original = { ...this.form }
      await this.fetchConfig() // re-fetch to get the latest config
      if (this.deviceStatus?.state !== 'connected') {
        // if we were connected, turn the hotspot on
        await this.toggle()
      }
    } catch (e) {
      console.error('Failed to apply hotspot config', e)
    }
    this.applying = false
    this.toggleEditing() // close the form
  }

  undoChanges() {
    this.resetForm()
    this.toggleEditing()
  }

  // —— keep switch ↔ password in sync ——
  @Watch('form.password')
  private onPasswordEdited(newVal: string) {
    this.form.securityEnabled = !!newVal
  }

  @Watch('form.securityEnabled')
  private onSecurityToggled(newVal: boolean) {
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


  /**
   * WPA-PSK rule: either
   *  • exactly 64 hex digits, or
   *  • 8–63 printable-ASCII chars (32–126)
   */
  public get passwordRules(): Array<(v: string) => true | string> {
    return [
      (v: string): true | string => {
        if (!this.form.securityEnabled) return true

        // 1) allow exactly 64 hex digits
        if (/^[0-9A-Fa-f]{64}$/.test(v)) {
          return true
        }

        // 2) enforce length
        if (v.length < 8) {
          return  i18n.t('app.wifi.password.too-short').toString()
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
          return i18n.t('app.wifi.password.invalid-character').toString() + ": " +
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




  toggling: boolean = false;

  async toggle() {
    try {
      this.toggling = true;
      if (this.deviceStatus && this.deviceStatus.state === 'connected') {
        await this.auxApi.api.apDownWifiApDownPost()
      } else if (this.deviceStatus) {
        await this.auxApi.api.apUpWifiApUpPost()
      }
    }
    catch (e) {
      console.error('Failed to toggle hotspot', e);
      // optionally show error toast
    }
    await this.fetchConfig();
    this.toggling = false;
  }



  // ------------------------------------------------------
  // NEW: local switch state for the v-switch
  switchState: boolean = false;

  // Sync switch → deviceStatus whenever we re-fetch
  @Watch('deviceStatus', { immediate: true })
  private onDeviceStatusChanged(newStatus: Device | null) {
    this.switchState = newStatus?.state === 'connected';
  }
  // ------------------------------------------------------

  // ------------------------------------------------------
  /**
   * Fired whenever the user flips the v-switch.
   * Optimistically shows the new position,
   * disables & loads, then calls the API,
   * then re-fetches the real status and clears loading.
   */
  private async onSwitchChange(wantsOn: boolean) {
    if (!this.apCredentials || this.toggling) return;

    this.toggling = true;
    try {
      if (wantsOn) {
        await this.auxApi.api.apUpWifiApUpPost();
      } else {
        await this.auxApi.api.apDownWifiApDownPost();
      }
    } catch (e) {
      console.error('Hotspot toggle failed', e);
    }
    // re-sync deviceStatus & switchState
    await this.fetchConfig();
    this.toggling = false;
  }
  // ------------------------------------------------------


  get QrValue(): string {
    if (!this.apCredentials) return '';
    const ssid = this.apCredentials.ssid;
    const password = this.apCredentials.password;
    const S = ssid.replace(/\\/g, '\\\\').replace(/;/g, '\\;');
    const T = password ? 'WPA' : 'nopass';
    const P = password ? password.replace(/\\/g, '\\\\').replace(/;/g, '\\;') : '';
    return `WIFI:S:${S};T:${T};${password ? `P:${P};` : ''}H:false;;`;
  }


  delayedEditing: boolean = this.editing;
  @Watch('editing')
  onEditingChanged(newVal: boolean) {
    // set a new one
    window.setTimeout(() => {
      this.delayedEditing = newVal
    }, 100)
  }



    @Watch('deviceStatus', { immediate: true })
  emitDeviceStatus(v: Device|null) {
    this.$emit('update:device-status', v)
  }

  @Watch('toggling', { immediate: true })
  emitToggling(v: boolean) {
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
</style>
