<template>
  <v-footer
    app
    absolute
    inset
    color="transparent"
    class="footer justify-end"
  >
    <span class="secondary--text">
      {{ $globals.PRODUCT_NAME }} &middot; built on Fluidd v{{ version }}-{{ hash }}
    </span>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({})
export default class AppFooter extends Vue {
  get version () {
    return import.meta.env.VERSION
  }

  get hash () {
    return import.meta.env.HASH
  }
}
</script>

<style lang="scss" scoped>
  .footer {
    span {
      flex: 0 0 auto;
      font-size: 0.75rem;
    }
  }
</style>
