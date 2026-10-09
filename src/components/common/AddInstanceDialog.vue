<template>
  <app-dialog
    v-model="open"
    max-width="320"
    :save-button-disabled="!verified"
    :valid.sync="valid"
    :title="$t('app.general.title.add_printer')"
    :help-tooltip="$t('app.endpoint.tooltip.endpoint_examples')"
    @save="addInstance"
  >
    <v-card-text>
      <span v-html="helpTxt" />

      <v-text-field
        v-model="url"
        type="text"
        spellcheck="false"
        autofocus
        :label="$t('app.general.label.api_url')"
        persistent-hint
        :hint="$t('app.endpoint.hint.add_printer')"
        :loading="verifying"
        :rules="[
          $rules.required,
          customRules.url
        ]"
      >
        <template #append-outer>
          <v-icon
            v-if="verifying"
            class="spin"
            color="primary"
          >
            $loading
          </v-icon>
          <v-icon
            v-if="!verified && !verifying"
            color="error"
          >
            $cloudAlert
          </v-icon>
          <v-icon
            v-if="verified && !verifying"
            color="success"
          >
            $cloudCheck
          </v-icon>
        </template>
      </v-text-field>

      <v-alert
        v-if="error"
        dense
        text
        type="error"
        class="mt-3 mb-2"
        v-html="error"
      />

      <p
        v-if="note"
        class="mb-0"
        v-html="note"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'
import { Globals } from '@/globals'
import axios from 'axios'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'
import { consola } from 'consola'
import webSocketWrapper from '@/util/web-socket-wrapper'
import { escapeHtml, pageBlocksPrinter, printerPageUrl } from '@/util/page-blocks-printer'
import { discoveryState, instanceFor, pageBlocksLanIpv4, probeAddress, type LanPrinter } from '@/services/muon-cloud/discovery'

@Component({})
export default class AddInstanceDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  valid = true
  verifying = false
  verified = false
  error: any = null
  note: any = null
  /** The Muon3D printer that answered for what was typed, by IP address or by name. */
  resolved: LanPrinter | null = null

  get customRules () {
    return {
      url: (v: string) => (this.validUrl(v)) || this.$t('app.general.simple_form.error.invalid_url')
    }
  }

  /**
   * Validates a URL
   */
  validUrl (url: string) {
    try {
      this.$filters.getApiUrls(url)
    } catch {
      return false
    }
    return true
  }

  timer = 0
  url = ''

  abortController?: AbortController = undefined

  // Watch for url changes. Validity is checked after the debounce: the form
  // revalidates after this watcher runs, so a pasted address read as invalid
  // here and was never checked.
  @Watch('url')
  onUrlChange (value: string, oldVal: string) {
    if (value === oldVal) return
    this.handleUrlChange(value)
  }

  @Debounce(750)
  async handleUrlChange (value: string) {
    if (this.valid) {
      this.verified = false
      this.error = null
      this.note = null
      this.verifying = true
      this.resolved = null

      // A Muon3D printer first: it answers by IP address, by its name
      // (muon-boxwood-367a) and by its name with .local, and says who it is.
      const printer = await probeAddress(value)
      if (value !== this.url) return
      if (printer) {
        this.resolved = printer
        this.verified = true
        this.verifying = false
        this.note = this.$t('app.endpoint.msg.found_printer', {
          name: escapeHtml(printer.name),
          host: escapeHtml(printer.host)
        })
        return
      }

      const { apiUrl, socketUrl } = this.$filters.getApiUrls(value)

      // Handle cancelling axios requests.
      this.abortController?.abort()

      this.abortController = new AbortController()

      const { signal } = this.abortController

      // Start by making a standard request. Maybe it's good?
      // A plain request on the network, never Vue.$httpClient: while a cloud
      // printer is shown, that client travels over Iroh, so the cloud printer
      // would answer for any address typed here. It also carries the current
      // printer's sign-in, which is not this address's to see.
      const request = await axios.get(`${apiUrl}/server/info?t=${Date.now()}`, {
        timeout: Globals.NETWORK_REQUEST_TIMEOUT,
        signal
      })
        .then(() => {
          this.verified = true
          this.verifying = false
          return 'ok'
        })
        .catch(e => {
          // If it failed because we cancelled, set ok and move on.
          if (axios.isCancel(e)) {
            return 'ok'
          } else if (axios.isAxiosError(e)) {
            // If it failed because of a 401, set ok and move on.
            if (e.response?.status === 401) {
              this.verified = true
              this.verifying = false
              return 'ok'
            }

            // If it failed with a network issue..
            if (e.request) return e.message
          }

          // Otherwise pass along the error..
          this.error = e
          return 'ok'
        })

      // The initial request failed with a network issue..
      if (request !== 'ok') {
        if (this.hosted) {
          await webSocketWrapper(socketUrl, signal)
            .then(() => {
              // likely a cors issue, but socket worked
              this.verified = true
            })
            .catch(e => {
              // external host not reachable (fetch returns 'failed to fetch')
              consola.debug('Network Error', e, request)
              this.onUnreachable(apiUrl, request)
            })
            .finally(() => { this.verifying = false })
        } else {
          await fetch(`${apiUrl}/server/info`, { signal, mode: 'no-cors', cache: 'no-cache' })
            .then(() => {
              // likely a cors issue
              this.error = this.$t('app.endpoint.error.cors_error')
              this.note = this.$t('app.endpoint.error.cors_note', {
                url: Globals.DOCS_MULTIPLE_INSTANCES
              })
            })
            .catch(e => {
              // external host not reachable (fetch returns 'failed to fetch')
              consola.debug('Network Error', e, request)
              this.onUnreachable(apiUrl, request)
            })
            .finally(() => { this.verifying = false })
        }
      }
    }
  }

  /**
   * An address this page could not reach at all. From app.muon3d.com (HTTPS)
   * to a plain-HTTP printer that is usually the browser blocking mixed
   * content, not a wrong address, so say so and link the printer's own page
   * rather than asking whether the address is correct.
   */
  async onUnreachable (apiUrl: string, request: string) {
    const typed = this.url
    const blocked = /^http:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?\/?$/.test(apiUrl) && await pageBlocksLanIpv4()
    // The first check can take seconds. If the address changed meanwhile,
    // this answer is about one nobody is looking at any more.
    if (this.url !== typed) return
    if (blocked) {
      const ownUrl = discoveryState.blockedByPage?.ownUrl
      this.error = null
      this.note = this.$t('app.endpoint.error.blocked_ip_from_name', { host: escapeHtml(location.host) }) +
        (ownUrl ? ' ' + this.$t('app.endpoint.error.blocked_ip_from_name_way_round', { url: escapeHtml(ownUrl) }) : '')
      return
    }
    if (pageBlocksPrinter(apiUrl)) {
      this.error = null
      this.note = this.$t('app.endpoint.error.blocked_by_page', {
        host: escapeHtml(location.host),
        url: escapeHtml(printerPageUrl(apiUrl))
      })
      return
    }
    this.error = request
    this.note = this.$t('app.endpoint.error.cant_connect')
  }

  get helpTxt () {
    return this.$t('app.endpoint.msg.trouble', {
      url: Globals.DOCS_MULTIPLE_INSTANCES
    })
  }

  get hosted () {
    return this.$store.state.config.hostConfig.hosted
  }

  addInstance () {
    const apiConfig = this.resolved ? instanceFor(this.resolved) : this.$filters.getApiUrls(this.url)
    this.open = false
    this.$emit('resolve', apiConfig)
  }
}
</script>
