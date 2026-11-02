<template>
  <v-footer
    app
    absolute
    inset
    color="transparent"
    class="footer justify-end"
  >
    <span class="secondary--text">
      {{ $globals.PRODUCT_NAME }} Control v{{ version }}-{{ hash }} &middot;
      <!-- The GPL notice for Fluidd, which Control is based on, lives on this page. -->
      <a
        :href="licencesUrl"
        target="_blank"
        rel="noopener"
        class="secondary--text"
      >Licences</a>
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

  get licencesUrl () {
    return `${import.meta.env.BASE_URL}licences.html`
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
