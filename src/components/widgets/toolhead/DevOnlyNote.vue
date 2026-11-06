<template>
  <span
    class="dev-only-note text-caption text--secondary"
    data-tid="dev-only-note"
  >{{ note }}</span>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { DEV_ONLY_NOTE } from '@/services/dev-guard'

/** The plain note beside a control Control will not send outside developer mode. */
@Component({})
export default class DevOnlyNote extends Vue {
  get note (): string {
    return DEV_ONLY_NOTE
  }
}
</script>
