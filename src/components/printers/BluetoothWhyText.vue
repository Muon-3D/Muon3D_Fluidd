<template>
  <span>
    <template v-if="link">{{ before }}<a
      :href="link.href"
      target="_self"
      data-tid="bluetooth-secure-link"
    >{{ link.text }}</a>{{ after }}</template>
    <template v-else>{{ text }}</template>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { WHY_UNSUPPORTED, type BluetoothWhy } from '@/services/muon-ble/unavailable'

/** The plain reason Bluetooth cannot be used here (KAN-4802), with its link opening in the same tab. */
@Component({})
export default class BluetoothWhyText extends Vue {
  @Prop({ type: Object, default: null })
  readonly why!: BluetoothWhy | null

  get text () {
    return this.why?.text ?? WHY_UNSUPPORTED
  }

  get link () {
    const link = this.why?.link
    return link && this.text.includes(link.text) ? link : null
  }

  get before () {
    return this.link ? this.text.slice(0, this.text.indexOf(this.link.text)) : ''
  }

  get after () {
    return this.link ? this.text.slice(this.text.indexOf(this.link.text) + this.link.text.length) : ''
  }
}
</script>
