<template>
  <seg-picker
    class="files-actions"
    :options="options"
    :value="view.pane"
    label="Files"
    data-tid="files-actions"
    @input="view.pane = $event"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { filesView } from '@/services/files/view'

/** Files' page-header choice on a phone: the config files, or the other files. */
@Component({ components: { SegPicker } })
export default class FilesActions extends Vue {
  view = filesView

  options: SegOption[] = [
    { value: 'config', label: 'Config files' },
    { value: 'other', label: 'Other files' }
  ]
}
</script>

<style lang="scss" scoped>
  .files-actions {
    min-width: 0;
  }
</style>
