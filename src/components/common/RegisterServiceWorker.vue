<template>
  <m3-toast
    v-model="needRefresh"
    position="bottom"
    data-tid="needs-refresh"
  >
    {{ $t('app.general.msg.needs_refresh') }}
    <template #action>
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="needs-refresh-reload"
        @click="updateServiceWorker"
      >
        {{ $t('app.general.btn.reload') }}
      </button>
    </template>
  </m3-toast>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { consola } from 'consola'
import { EventBus } from '@/eventBus'
import M3Toast from '@/components/ui/M3Toast.vue'
import { activationState } from '@/services/muon-cloud/activate'
import { applyUpdateWhenIdle } from '@/util/service-worker-update'
import { watchForNewBuild } from '@/util/build-update'
import { serviceWorkerAllowed, serviceWorkerMustGo, unregisterServiceWorkers } from '@/util/service-worker-policy'

@Component({ components: { M3Toast } })
export default class RegisterServiceWorker extends Vue {
  updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
  needRefresh = false
  stopWatching: () => void = () => {}

  onOfflineReady () {
    consola.debug('[PWA] ready for offline work')
    EventBus.$emit(this.$tc('app.general.msg.offline_ready'), { timeout: 5000 })
  }

  onNeedRefresh () {
    consola.debug('[PWA] needs refresh')
    // KAN-1279: apply the new worker unasked, unless a printer is mid-switch;
    // then the toast stays up and the update lands when the switch is done.
    const { immediate } = applyUpdateWhenIdle(
      () => activationState.switching !== null,
      () => this.updateServiceWorker()
    )
    this.needRefresh = !immediate
  }

  onRegistered (registration?: ServiceWorkerRegistration) {
    consola.debug('[PWA] registered', registration)
    // I-159: look for a newer worker and a newer build on focus, when the tab
    // is shown and every few minutes; a stale tab no longer waits for a click.
    this.stopWatching()
    this.stopWatching = watchForNewBuild({
      running: import.meta.env.BUILD_COMMIT ?? '',
      update: () => registration ? registration.update() : Promise.resolve(),
      onNewer: () => this.onNewer()
    })
  }

  onNewer () {
    consola.debug('[PWA] a newer build is being served')
    const { immediate } = applyUpdateWhenIdle(
      () => activationState.switching !== null,
      () => this.updateServiceWorker()
    )
    this.needRefresh = !immediate
  }

  beforeDestroy () {
    this.stopWatching()
  }

  onRegisterError (e: unknown) {
    consola.error('[PWA] registration error', e)
  }

  updateServiceWorker () {
    // The new worker skips waiting by itself (sw.ts), so there may be none to
    // activate: the reload is what loads the new build.
    const activated = this.updateSW ? this.updateSW(true) : Promise.resolve()
    Promise.resolve(activated).catch(() => {}).then(() => window.location.reload())
  }

  async mounted () {
    // KAN-2198: a printer serves this page itself; no worker caches it.
    if (!serviceWorkerAllowed()) {
      if (serviceWorkerMustGo()) await unregisterServiceWorkers().catch(() => {})
      return
    }
    try {
      const { registerSW } = await import('virtual:pwa-register')

      this.updateSW = registerSW({
        immediate: true,
        onOfflineReady: this.onOfflineReady,
        onNeedRefresh: this.onNeedRefresh,
        onRegistered: this.onRegistered,
        onRegisterError: this.onRegisterError
      })
    } catch {
      consola.error('[PWA] disabled')
    }
  }
}
</script>
