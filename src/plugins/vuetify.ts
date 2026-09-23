import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import { Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
  directives: { Ripple }
})

// Surface colours mirror the --m3d-* tokens in src/scss/muon3d.scss. They are
// also set here because components pass them as `color` props (drawer,
// appbar, card-heading, btncolor), which Vuetify paints as inline classes.
export default new Vuetify({
  breakpoint: {
    mobileBreakpoint: 'xs'
  },
  icons: {
    iconfont: 'mdiSvg',
    values: Icons
  },
  theme: {
    dark: true,
    options: {
      customProperties: true
    },
    themes: {
      dark: {
        primary: '#80D6D1',
        'primary-offset': '#3F9C97',
        secondary: '#9EA8AE',
        success: '#5CC98F',
        warning: '#E8B04B',
        error: '#F06B61',
        info: '#80D6D1',
        'card-heading': '#1A1F22',
        btncolor: '#212629',
        drawer: '#1A1F22',
        appbar: '#1A1F22',
        logo: '#80D6D1'
      },
      light: {
        primary: '#2E8580',
        'primary-offset': '#256B67',
        secondary: '#56626A',
        success: '#2C8657',
        warning: '#A8761E',
        error: '#C23B32',
        info: '#2E8580',
        'card-heading': '#FFFFFF',
        btncolor: '#F6F8F9',
        drawer: '#FFFFFF',
        appbar: '#FFFFFF',
        logo: '#2E8580'
      }
    }
  }
})
