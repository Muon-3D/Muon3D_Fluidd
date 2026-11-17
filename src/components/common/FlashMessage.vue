<template>
  <m3-toast
    v-model="open"
    :tone="tone"
    :timeout="timeout"
    :stamp="text"
    data-tid="flash-message"
  >
    {{ text }}
    <template
      v-if="action"
      #action
    >
      <button
        type="button"
        data-tid="flash-action"
        @click="retry"
      >
        {{ action.label }}
      </button>
    </template>
  </m3-toast>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, VModel } from 'vue-property-decorator'
import type { FlashMessageTypes, FlashMessage as Message } from '@/types'
import M3Toast, { type ToastTone } from '@/components/ui/M3Toast.vue'

/**
 * Fluidd's flash message (EventBus.$emit), as the redesign's toast. The text
 * is shown as text: it is often the printer's own words, or a file's name.
 */
@Component({ components: { M3Toast } })
export default class FlashMessage extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: 'dark' })
  readonly type!: FlashMessageTypes

  @Prop({ type: String, default: 'Saved' })
  readonly text!: string

  @Prop({ type: Number, default: 1500 })
  readonly timeout!: number

  @Prop({ type: Object })
  readonly action?: Message['action']

  retry () {
    this.open = false
    this.action?.run()
  }

  get tone (): ToastTone {
    switch (this.type) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'info'
    }
  }
}
</script>
