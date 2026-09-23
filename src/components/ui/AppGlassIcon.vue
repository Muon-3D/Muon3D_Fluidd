<script lang="ts">
import type { CreateElement, VNode } from 'vue'
import { Component, Vue, Prop } from 'vue-property-decorator'
import { glassIconNodes } from '@/util/glass-icon-nodes'

// A glass-style line icon: a Lucide drawing stroked like an SF Symbol.
// Vuetify renders it in place of the Material icon of the same name (see
// src/util/glass-icons.ts), so it takes the icon's size and colour.
@Component({})
export default class AppGlassIcon extends Vue {
  @Prop({ type: String, required: true })
  readonly name!: string

  render (h: CreateElement): VNode {
    return h('svg', {
      class: 'app-glass-icon',
      attrs: {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.75',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }
    }, (glassIconNodes[this.name] ?? []).map(([tag, attrs]) => h(tag, { attrs })))
  }
}
</script>

<style scoped>
  /* Sized by the icon's font size, as a font icon is; an explicit size
     (small, large, size=) arrives as an inline style and wins. */
  .app-glass-icon {
    display: block;
    width: 1em;
    height: 1em;
  }
</style>
