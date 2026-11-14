import type { CreateElement, VNode } from 'vue'

/**
 * Stand-ins for the design-system components the account surfaces use, so a
 * mount test sees the surface's own structure (what is shown and what is
 * not) without a Vuetify instance. A container renders its content; a text
 * field renders an `<input>`, so "is there anything to type into" is a real
 * question about the DOM.
 */
const container = (tag: string) => ({
  render (this: { $slots: { default?: VNode[] } }, h: CreateElement): VNode {
    return h(tag, this.$slots.default)
  }
})

const field = {
  render (h: CreateElement): VNode {
    return h('input')
  }
}

const nothing = {
  render (h: CreateElement): VNode {
    return h('span')
  }
}

const kebab: Record<string, object> = {
  'v-card': container('div'),
  'v-card-title': container('div'),
  'v-card-subtitle': container('div'),
  'v-card-text': container('div'),
  'v-card-actions': container('div'),
  'v-dialog': container('div'),
  'v-form': container('form'),
  'v-alert': container('div'),
  'v-btn': container('button'),
  'v-divider': nothing,
  'v-icon': nothing,
  'v-progress-circular': nothing,
  'v-text-field': field,
  'v-checkbox': field,
  'app-btn': container('a'),
  'frame-icon': nothing,
  'router-link': container('a')
}

const pascal = (name: string) => name.replace(/(^|-)([a-z])/g, (_all, _dash, letter: string) => letter.toUpperCase())

/** Under both spellings: globally registered components are matched by their registered name. */
export const surfaceStubs: Record<string, object> = Object.fromEntries(
  Object.entries(kebab).flatMap(([name, stub]) => [[name, stub], [pascal(name), stub]])
)
