// Styles
import '@/scss/global.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// Global Registrations
import './registerComponentHooks'
import './setupConsola'

// Common, 1st party.
import Vue from 'vue'
import { Globals } from './globals'
import i18n from '@/plugins/i18n'
import router from './router'
import store from './store'
import { consola } from 'consola'

// 3rd party.
import vuetify from './plugins/vuetify'
import VueVirtualScroller from 'vue-virtual-scroller'
import VueMeta from 'vue-meta'
import VuetifyConfirm from 'vuetify-confirm'
import Vue2TouchEvents from 'vue2-touch-events'
import { InlineSvgPlugin } from 'vue-inline-svg'

// Init.
import { appInit } from './init'
import { cloudState, initCloud } from './services/muon-cloud/state'
import { activateCloudPrinter, forgetManagedInstance } from './services/muon-cloud/activate'
import type { InitConfig } from './store/config/types'

// Import plugins
import { HttpClientPlugin } from './plugins/httpClient'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'

// Main App component
import App from './App.vue'

// Register global directives.
import Blur from '@/directives/blur'
import { restoreUiStyle } from '@/util/ui-style'
import { applyGlassIcons } from '@/util/glass-icons'

// Directives...
Vue.directive('blur', Blur)

// v-chart component asynchronously loaded from a split chunk
Vue.component('EChart', () => import('./vue-echarts-chunk'))

// Use any Plugins
Vue.use(VueVirtualScroller)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
Vue.use(VuetifyConfirm, {
  vuetify
})
Vue.use(InlineSvgPlugin)
Vue.use(Vue2TouchEvents)

Vue.use(HttpClientPlugin, {
  store
})

// import { AuxClientPlugin } from '@/plugins/auxClient'
// Vue.use(AuxClientPlugin, { store })

// The panel's QR code and the captive portal use the short address /setup,
// which nginx redirects to /#/setup. Should the page be served at /setup
// itself, take the same route; the hash router would otherwise start on /.
// The router is built on import and has already set the hash to #/, but it
// reads the hash again when the app mounts, below.
if (/\/setup$/.test(window.location.pathname) && ['', '#', '#/'].includes(window.location.hash)) {
  const base = window.location.pathname.replace(/setup$/, '')
  window.history.replaceState(null, '', `${base}#/setup${window.location.search}`)
}

// A cloud printer is selected through a placeholder API address that Fluidd
// records as an instance. It must never be the instance Fluidd starts on.
forgetManagedInstance()

const restoredUiStyle = restoreUiStyle()
store.commit('config/setRestoredUiStyle', restoredUiStyle)
applyGlassIcons(vuetify.framework.icons.values as unknown as Record<string, unknown>, restoredUiStyle === 'glass')

appInit()
  .then((config: InitConfig) => {
    consola.debug('Loaded App Configuration', config)

    // Init the socket plugin
    Vue.use(SocketPlugin, {
      url: config.apiConfig.socketUrl,
      reconnectEnabled: true,
      reconnectInterval: Globals.SOCKET_RETRY_DELAY,
      store
    })

    if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
      Vue.$socket.connect(config.apiConfig.socketUrl)
    }

    // Init Vue
    Vue.config.productionTip = false
    new Vue({
      i18n,
      router,
      store,
      vuetify,
      render: (h) => h(App)
    }).$mount('#app')

    // Restore the Muon3D account, and the cloud printer it was last showing.
    // With no printer to show at all, start on the welcome page, which finds
    // printers on this network and offers the account.
    //
    // Wait for the first navigation: a lazy route such as /setup is not the
    // current route until its chunk has loaded, and its meta decides here.
    initCloud().then(() => router.onReady(() => {
      // First-run setup keeps its place. Reopening a cloud printer runs
      // appInit, which sends every route but the dashboard back to it.
      if (router.currentRoute.name === 'setup') return

      const active = cloudState.activePrinterId
      if (active && cloudState.account && cloudState.printers.some(p => p.id === active)) {
        activateCloudPrinter(active).catch((e) => consola.debug('Could not reopen the cloud printer', e))
      } else if (!store.state.config.apiUrl && !router.currentRoute.meta?.printerIndependent) {
        router.replace('/welcome').catch(() => {})
      }
    }))
  })
  .catch((e) => {
    consola.debug('Error attempting to init App:', e)
  })
