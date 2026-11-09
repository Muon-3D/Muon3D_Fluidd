<template>
  <span class="photo-face">
    <img
      v-if="photo && !broken"
      :src="photo"
      alt=""
      @error="broken = true"
    >
    <template v-else>{{ letter }}</template>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

/**
 * The inside of a round avatar (KAN-1826): the photo, or the initials when
 * there is none or it cannot be loaded (another person's public photo 404s
 * while their page is not visible). The parent draws the circle and its size.
 */
@Component({})
export default class PhotoFace extends Vue {
  @Prop({ type: String, default: null }) readonly photo!: string | null
  @Prop({ type: String, default: '?' }) readonly letter!: string

  broken = false

  @Watch('photo')
  onPhoto () {
    this.broken = false
  }
}
</script>

<style lang="scss" scoped>
  .photo-face {
    display: contents;

    img {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      object-fit: cover;
    }
  }
</style>
