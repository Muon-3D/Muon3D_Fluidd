<template>
  <textarea
    ref="text"
    v-model="content"
    class="v-input v-textarea px-2"
    :class="{
      [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
    }"
    :readonly="readonly"
    spellcheck="false"
  />
</template>

<script lang="ts">
import { Vue, Component, Prop, VModel, Ref } from 'vue-property-decorator'

@Component({})
export default class FileEditorText extends Vue {
  @VModel({ type: String })
    content?: string

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  /** A line to open at, 1-based. */
  @Prop({ type: Number, default: 0 })
  readonly line!: number

  @Ref('text')
  readonly text!: HTMLTextAreaElement

  mounted () {
    this.$emit('ready')
    if (this.line > 0) this.goToLine(this.line)
  }

  // The caret on that line, which is scrolled to.
  goToLine (line: number) {
    const lines = (this.content ?? '').split('\n')
    const index = Math.min(line, lines.length) - 1
    const start = lines.slice(0, index).reduce((n, l) => n + l.length + 1, 0)
    this.text.setSelectionRange(start, start + (lines[index]?.length ?? 0))
    const height = parseFloat(getComputedStyle(this.text).lineHeight) || 20
    this.text.scrollTop = Math.max(0, index * height - this.text.clientHeight / 2)
  }
}
</script>

<style lang="scss" scoped>
  :deep() {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 100 !important;
    min-width: 100%;
    height: calc(100% - 48px) !important;
    resize: none;
  }
</style>
