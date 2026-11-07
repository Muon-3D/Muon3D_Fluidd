<template>
  <v-menu
    offset-y
    left
    max-height="420"
  >
    <template #activator="{ on, attrs }">
      <slot
        name="activator"
        :on="on"
        :attrs="attrs"
      />
    </template>
    <v-list
      dense
      data-tid="preview-open-list"
    >
      <v-list-item
        v-if="!files.length"
        disabled
      >
        <v-list-item-title>No G-code on the printer</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-for="f in files"
        :key="f.key"
        :data-file="f.file.filename"
        @click="$emit('pick', f.file)"
      >
        <v-list-item-title>{{ f.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobsMixin from '@/mixins/jobs'

/** The printer's G-code, newest first, to open in the preview. */
@Component({})
export default class PreviewOpenMenu extends Mixins(JobsMixin) {
  get files () {
    return [...this.jobFiles].sort((a, b) => b.modified - a.modified)
  }
}
</script>
