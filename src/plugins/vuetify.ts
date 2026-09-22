import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import { Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
  directives: { Ripple }
})

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
        secondary: '#A8B3B5',
        success: '#57C08A',
        warning: '#E8B04B',
        error: '#E5695F',
        info: '#80D6D1',
        'card-heading': '#1F2A2D',
        btncolor: '#2B3739',
        drawer: '#182123',
        appbar: '#101719',
        logo: '#80D6D1'
      },
      light: {
        primary: '#57BDB8',
        'primary-offset': '#3F9C97',
        secondary: '#5A6668',
        success: '#359062',
        warning: '#B3822A',
        error: '#C04138',
        info: '#57BDB8',
        'card-heading': '#EEF2F2',
        btncolor: '#F7F9F9',
        drawer: '#F7F9F9',
        appbar: '#FFFFFF',
        logo: '#57BDB8'
      }
    }
  }
})
