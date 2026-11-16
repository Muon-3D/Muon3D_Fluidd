<template>
  <span
    class="acct-avatar profile-avatar"
    :class="sizeClass"
    :data-tid="dataTid"
  >
    <img
      v-if="photo"
      :src="photo"
      alt=""
    >
    <template v-else>{{ letter }}</template>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * One person's picture: the photo, or the first letter of the name when
 * there is none. Account › Profile's header and its previews draw it, so
 * every place on the page shows the same thing.
 */
@Component({})
export default class ProfileAvatar extends Vue {
  @Prop({ type: String, default: null }) readonly photo!: string | null
  @Prop({ type: String, default: '?' }) readonly letter!: string
  @Prop({ type: String, default: 'md' }) readonly size!: 'xs' | 'md' | 'lg' | 'xl'
  @Prop({ type: String, default: undefined }) readonly dataTid!: string | undefined

  get sizeClass (): string {
    return this.size === 'md' ? '' : `profile-avatar--${this.size}`
  }
}
</script>

<style lang="scss" scoped>
  .profile-avatar {
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .profile-avatar--xs {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }

  .profile-avatar--lg {
    width: 48px;
    height: 48px;
    font-size: 19px;
  }

  .profile-avatar--xl {
    width: 84px;
    height: 84px;
    font-size: 30px;
  }
</style>
