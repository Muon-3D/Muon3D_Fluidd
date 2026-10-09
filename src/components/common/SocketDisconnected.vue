<template>
  <v-container style="height: 400px;">
    <v-row
      class="fill-height"
      align-content="center"
      justify="center"
    >
      <v-col
        class="subtitle-1 text-center"
        cols="12"
      >
        <div v-if="activeInstance">
          {{ activeInstance.apiUrl }}
        </div>
        <span v-if="socketConnecting">{{ $t('app.socket.msg.connecting') }}</span>
        <span v-if="!socketConnecting">{{ $t('app.socket.msg.no_connection') }}</span>
        <div
          v-if="socketConnecting && retryPending"
          class="body-2 mt-2"
        >
          {{ $t('app.socket.msg.retrying') }}
        </div>
      </v-col>
      <v-col
        cols="6"
        lg="4"
      >
        <v-progress-linear
          v-if="socketConnecting"
          class="mb-4"
          color="warning"
          indeterminate
          rounded
          height="6"
        />
        <app-btn
          v-if="socketConnecting && retryPending"
          block
          color="info"
          class="me-2 mb-2"
          @click="tryNow()"
        >
          {{ $t('app.general.btn.socket_try_now') }}
        </app-btn>
        <app-btn
          v-if="!socketConnecting"
          block
          color="info"
          class="me-2 mb-2"
          @click="reconnect()"
        >
          {{ $t('app.general.btn.socket_reconnect') }}
        </app-btn>
        <app-btn
          block
          color="warning"
          class="me-2 mb-2"
          @click="reload()"
        >
          {{ $t('app.general.btn.socket_refresh') }}
        </app-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { appInit } from '@/init'
import StateMixin from '@/mixins/state'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

@Component({
  components: {}
})
export default class SocketDisconnected extends Mixins(StateMixin) {
  reload () {
    window.location.reload()
  }

  get activeInstance () {
    return this.$store.getters['config/getCurrentInstance']
  }

  /** Whether the socket client is waiting out its backoff before the next try. */
  get retryPending (): boolean {
    // Read the store so this recomputes as the connection state changes.
    return this.$store.state.socket.connecting && !!this.$socket?.retryPending
  }

  tryNow () {
    this.$socket.retryNow()
  }

  async reconnect () {
    // A cloud printer has no address to connect to: its socket comes over
    // Iroh, so open it again through the account.
    const printerId = cloudState.activePrinterId
    if (printerId && isManagedApiUrl(this.activeInstance?.apiUrl ?? '')) {
      await activateCloudPrinter(printerId).catch(() => {})
      return
    }

    // Re-init the app.
    const config = await appInit(this.activeInstance, this.$store.state.config.hostConfig)

    // Reconnect the socket with the instance url.
    if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
      this.$socket.connect(config.apiConfig.socketUrl)
    }
  }
}
</script>
