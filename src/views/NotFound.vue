<template>
  <landing-card
    page
    icon="search"
    tone="muted"
    title="That page isn't here"
    sub="The link may be old, or the page moved. Your printers are fine."
    data-tid="not-found"
  >
    <template #foot>
      <router-link
        to="/"
        class="lib-btn lib-btn--pri"
        data-tid="not-found-back"
      >
        Back to printers
      </router-link>
    </template>
  </landing-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import LandingCard from '@/components/ui/LandingCard.vue'

@Component({ components: { LandingCard } })
export default class NotFound extends Vue {}
</script>
