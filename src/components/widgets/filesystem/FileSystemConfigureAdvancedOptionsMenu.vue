<template>
  <div>
    <v-menu
      bottom
      left
      offset-y
      transition="slide-y-transition"
      :close-on-content-click="true"
    >
      <template #activator="{ on: menu, attrs }">
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-btn
              :disabled="disabled"
              fab
              small
              text
              v-bind="attrs"
              v-on="{ ...menu, ...tooltip }"
            >
              <v-icon>
                $cog
              </v-icon>
            </v-btn>
          </template>
          <span>{{ $t('app.general.btn.advanced') }}</span>
        </v-tooltip>
      </template>

      <v-list dense>
        <v-list-item
          :disabled="!canManage"
          @click="devModeClick"
        >
          <v-list-item-action class="my-0">
            <v-checkbox
              :input-value="devMode"
              readonly
              :disabled="!canManage"
            />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('app.general.label.developer_mode') }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="!canManage">
              {{ $t('app.general.dev_mode.manage-at-printer') }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <template v-if="devMode && canManage">
          <v-divider class="my-1" />
          <v-list-item
            :disabled="loading"
            @click="restoreDefaults"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.general.dev_mode.restore-defaults') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            :disabled="loading"
            @click="backupConfig"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.general.dev_mode.backup-config') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <!-- Enable Dev Mode modal -->
    <v-dialog
      v-model="confirmDialog"
      max-width="620px"
      :persistent="awaitingConfirmation"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.dev_mode.enable-developer-mode') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('app.general.dev_mode.modal-1') }}</p>

          <!--
            DEV-2: the wording somebody accepted is part of what they accepted,
            so the waiver shown here is the printer's own rather than a copy in
            this bundle. Aux refuses an acknowledgement carrying a version it
            does not recognise, which makes a stale copy a refusal rather than a
            silent mismatch.
          -->
          <template v-if="waiverText">
            <p class="font-weight-bold mb-1">
              {{ $t('app.general.dev_mode.modal-warranty-liability') }}:
            </p>
            <p class="dev-mode-waiver">
              {{ waiverText }}
            </p>
          </template>

          <v-alert
            v-else-if="waiverError"
            type="error"
            dense
            text
            class="mb-0"
          >
            {{ $t('app.general.dev_mode.waiver-unavailable') }}
            <div class="text--secondary">
              {{ waiverError }}
            </div>
          </v-alert>

          <v-skeleton-loader
            v-else
            type="paragraph"
          />

          <v-checkbox
            v-if="waiverText"
            v-model="confirmAccepted"
            :label="$t('app.general.dev_mode.modal-checkbox-message')"
            class="mt-4"
            :disabled="awaitingConfirmation"
          />

          <!--
            The second half of the gate, and the half a browser cannot satisfy on
            its own: somebody has to confirm at the machine. Its own step rather
            than folded into the button, because the operator has to physically
            go and do something and the interface should say so.
          -->
          <v-alert
            v-if="awaitingConfirmation"
            type="info"
            dense
            text
            class="mb-0"
          >
            <div>{{ consentInstruction }}</div>
            <div class="text--secondary">
              {{ $t('app.general.dev_mode.consent-expires', { seconds: secondsRemaining }) }}
            </div>
          </v-alert>

          <v-alert
            v-if="errorMessage"
            type="error"
            dense
            text
            class="mb-0 mt-3"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="loading"
            @click="closeConfirm"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="red darken-1"
            :disabled="!confirmAccepted || !waiverText || loading || awaitingConfirmation"
            :loading="loading"
            @click="confirmEnable"
          >
            {{ $t('app.general.dev_mode.enable-developer-mode') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Disable Dev Mode modal (simple) -->
    <v-dialog
      v-model="confirmDisableDialog"
      max-width="520px"
    >
      <v-card>
        <v-card-title class="headline">
          {{ $t('app.general.dev_mode.disable-developer-mode') }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('app.general.dev_mode.disable-modal-1') /* "You’re returning to the default configuration." */ }}</p>
          <p>
            {{ $t('app.general.dev_mode.disable-modal-2') /* "Your current custom configuration will be saved so you
            can
            switch back later." */ }}
          </p>
          <p class="text--secondary">
            {{ $t('app.general.dev_mode.disable-modal-3') /* "Because Developer Mode was enabled, warranty may remain
            limited for issues caused by custom configuration." */ }}
          </p>
          <v-alert
            v-if="errorMessage"
            type="error"
            dense
            text
            class="mb-0"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="loading"
            @click="closeDisable"
          >
            {{ $t('app.general.btn.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :disabled="loading"
            :loading="loading"
            @click="confirmDisable"
          >
            {{ $t('app.general.dev_mode.disable-developer-mode') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
// TODO: IMPROOVE DEVELOPER MODE WARNING MESSAGES AND LEGAL DISCALIMER
import { Component, Vue } from 'vue-property-decorator'
import { useAuxApi } from '@/aux_api/useAuxApi'
import { httpClientActions } from '@/api/httpClientActions'
import consola from 'consola'

/** How often the browser asks whether the operator has confirmed yet. */
const CONSENT_POLL_MS = 1500

@Component({})
export default class FileSystemConfigureAdvancedOptionsMenu extends Vue {
  private api = useAuxApi().devMode
  private devMode = false
  /** Whether this client may *change* the mode, not merely see it. See updateDevMode. */
  private canManage = false
  private confirmDialog = false // enable modal
  private confirmDisableDialog = false // disable modal
  private confirmAccepted = false
  private disabled = false
  private loading = false

  // DEV-2. The waiver the printer is currently serving, not a copy of it.
  private waiverText = ''
  private waiverVersion: string | null = null
  private waiverError = ''

  // The physical-confirmation challenge, while one is outstanding.
  private challengeId: string | null = null
  private consentInstruction = ''
  private secondsRemaining = 0
  private awaitingConfirmation = false
  private pollTimer: number | null = null
  private countdownTimer: number | null = null

  /** Whatever went wrong last, in the words the printer used. */
  private errorMessage = ''

  async mounted () {
    await this.updateDevMode()
  }

  beforeDestroy () {
    this.stopWaiting()
  }

  // Two questions, and they are not the same question.
  //
  // "Is developer mode on?" is DEV-4, and it must be answerable here as well as
  // on the panel. "May this client manage it?" is a different question, and
  // /server/aux/dev_mode answers it by whether it answers at all.
  //
  // This method used to ask only that endpoint and swallow the failure, which
  // made the absence of an answer render as a confident "off". So a printer with
  // developer mode ON showed an unticked box in Fluidd while the panel showed
  // the amber rim. Measured on two M1s on 2026-09-15: /server/muon/dev_mode said
  // enabled:true, /server/aux/dev_mode said 403.
  //
  // KAN-371 took /server/aux/dev_mode off the floor, so on a current image this
  // succeeds from the LAN and canManage is true. It is kept as a probe rather
  // than assumed, because this same bundle runs against older images where the
  // floor still answers 403 -- and against those, hiding the actions rather than
  // offering ones that fail in silence is still the right behaviour. The state
  // itself comes from the read-only endpoint the Moonraker fork publishes off
  // the floor for exactly this.
  async updateDevMode () {
    try {
      const result = await this.api.getDevModeStatusDevModeGet()
      const enabled = result.data?.enabled
      // Not merely defensive. When the Aux client still holds its initial '/aux'
      // basePath, that path falls through the LAN vhost's SPA location and comes
      // back as 200 text/html -- a success carrying no state at all. Treat
      // anything that is not a boolean as no answer.
      if (typeof enabled !== 'boolean') {
        throw new Error('unexpected /server/aux/dev_mode payload')
      }
      this.devMode = enabled
      this.canManage = true
    } catch (err) {
      consola.debug('Developer mode is not manageable from this client:', err)
      this.canManage = false
      await this.readDevModeStateOffFloor()
    } finally {
      this.$emit('dev-mode', this.devMode)
      consola.info('Dev mode status updated:', this.devMode, '- manageable:', this.canManage)
    }
  }

  private async readDevModeStateOffFloor () {
    try {
      const response = await httpClientActions.serverMuonDevModeGet()
      const enabled = response.data?.result?.enabled
      if (typeof enabled === 'boolean') {
        this.devMode = enabled
      }
    } catch (err) {
      // Keep the last known state rather than asserting "off". A printer in
      // developer mode that is briefly unreachable is still in developer mode,
      // and this is the only warning the interface carries.
      consola.error('Failed to get dev mode status:', err)
    }
  }

  /** The printer's own words for a failure, in preference to ours. */
  private describe (err: unknown): string {
    const detail = (err as any)?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof detail.message === 'string') return detail.message
    const message = (err as any)?.message
    return typeof message === 'string' ? message : String(err)
  }

  devModeClick () {
    if (!this.canManage) return

    this.errorMessage = ''
    if (this.devMode) {
      this.confirmDisableDialog = true
    } else {
      this.confirmDialog = true
      this.loadWaiver()
        .catch(err => consola.error('Failed to load the developer-mode waiver:', err))
    }
  }

  // DEV-2: nobody is asked to accept a waiver this bundle could not load. A
  // hardcoded fallback would be worse than an error -- it would show wording the
  // printer might no longer be serving, and Aux would refuse the version anyway.
  private async loadWaiver () {
    this.waiverText = ''
    this.waiverError = ''
    try {
      const { data } = await this.api.getDevModeWaiverDevModeWaiverGet()
      if (!data?.text || !data?.version) {
        throw new Error('the printer returned an empty waiver')
      }
      this.waiverText = data.text
      this.waiverVersion = data.version
    } catch (err) {
      consola.error('Failed to load the developer-mode waiver:', err)
      this.waiverError = this.describe(err)
    }
  }

  closeConfirm () {
    this.stopWaiting()
    this.confirmAccepted = false
    this.confirmDialog = false
    this.errorMessage = ''
  }

  closeDisable () {
    this.confirmDisableDialog = false
    this.errorMessage = ''
  }

  private stopWaiting () {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    if (this.countdownTimer !== null) {
      window.clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
    this.awaitingConfirmation = false
    this.challengeId = null
  }

  // Enabling takes two things, and a browser cannot supply the second: the
  // acknowledged current waiver, and a challenge somebody redeemed at the
  // machine. This opens the challenge, waits for the hardware, then redeems it.
  //
  // Every failure here is shown. The previous version logged to the console and
  // closed the dialog, so a refusal and a success looked identical to the person
  // who clicked the button.
  async confirmEnable () {
    this.errorMessage = ''
    this.loading = true
    let challenge
    try {
      const { data } = await this.api.openDevModeConsentDevModeConsentPost()
      challenge = data
    } catch (err) {
      // The expected failure on every image shipped so far:
      // KnobConfirmationBackend refuses every challenge until the knob/DSI
      // firmware is wired to it, and answers 503 saying so. Show that sentence
      // rather than a shrug -- it is the difference between "this is broken" and
      // "this cannot be done yet, and here is why".
      this.loading = false
      this.errorMessage = this.describe(err)
      consola.error('Failed to open a developer-mode consent challenge:', err)
      return
    }

    this.challengeId = challenge.challenge_id
    this.consentInstruction = challenge.instruction
    this.secondsRemaining = Math.max(0, Math.round(challenge.expires_in_seconds))
    this.awaitingConfirmation = true
    this.loading = false

    this.countdownTimer = window.setInterval(() => {
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1)
      if (this.secondsRemaining === 0) {
        this.stopWaiting()
        this.errorMessage = this.$t('app.general.dev_mode.consent-expired') as string
      }
    }, 1000)

    this.pollTimer = window.setInterval(
      () => {
        this.pollConsent()
          .catch(err => consola.debug('Consent poll failed:', err))
      },
      CONSENT_POLL_MS
    )
  }

  private async pollConsent () {
    const challengeId = this.challengeId
    if (!challengeId) return
    try {
      const { data } = await this.api.getDevModeConsentDevModeConsentChallengeIdGet(challengeId)
      if (!data?.confirmed) return
    } catch (err) {
      // A challenge that has expired or been consumed stops existing. Let the
      // countdown say so rather than replacing it with a 404.
      consola.debug('Consent poll failed:', err)
      return
    }
    this.stopWaiting()
    await this.redeem(challengeId)
  }

  private async redeem (challengeId: string) {
    this.loading = true
    try {
      await this.api.setDevModeDevModePost({
        enabled: true,
        waiver_acknowledged: true,
        waiver_version: this.waiverVersion,
        challenge_id: challengeId
      })
      this.closeConfirm()
    } catch (err) {
      this.errorMessage = this.describe(err)
      consola.error('Failed to enable dev mode:', err)
    } finally {
      this.loading = false
      await this.updateDevMode()
      this.$emit('refresh-fs')
    }
  }

  // Leaving is a plain unconditional call, deliberately: Aux gates only the
  // enable direction, because getting *out* must not depend on a working knob,
  // a reachable operator, or an attacker's cooperation.
  async confirmDisable () {
    this.errorMessage = ''
    this.loading = true
    try {
      await this.api.setDevModeDevModePost({ enabled: false })
      this.closeDisable()
    } catch (err) {
      this.errorMessage = this.describe(err)
      consola.error('Failed to disable dev mode:', err)
    } finally {
      this.loading = false
      await this.updateDevMode()
      this.$emit('refresh-fs')
    }
  }

  async restoreDefaults () {
    this.loading = true
    try {
      await this.api.refreshDevModeConfigDevModeRefreshPost()
    } catch (err) {
      consola.error('Failed to restore dev-mode defaults:', err)
      this.notifyFailure(this.$t('app.general.dev_mode.restore-defaults') as string, err)
    } finally {
      this.loading = false
      this.$emit('refresh-fs')
    }
  }

  async backupConfig () {
    this.loading = true
    try {
      await this.api.manualBackupDevModeBackupPost()
    } catch (err) {
      consola.error('Failed to back up dev-mode config:', err)
      this.notifyFailure(this.$t('app.general.dev_mode.backup-config') as string, err)
    } finally {
      this.loading = false
      this.$emit('refresh-fs')
    }
  }

  // These two run from a menu with no dialog to put an error in, and both can
  // fail for reasons the operator can act on -- 507 when the backup will not
  // fit, 409 when CORE_CFG is somewhere unexpected. A console line is not
  // telling them.
  private notifyFailure (title: string, err: unknown) {
    this.$store.dispatch('notifications/pushNotification', {
      title,
      description: this.describe(err),
      type: 'error'
    })
  }
}
</script>

<style lang="scss" scoped>
:deep(.v-list-item--active::before) {
  opacity: 0;
}

:deep(.v-list-item--active:hover::before) {
  opacity: 0.08;
}

.dev-mode-waiver {
  white-space: pre-wrap;
}
</style>
