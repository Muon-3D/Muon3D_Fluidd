/**
 * `v-agent-highlight="'hotend'"`: tints the element it is on while an agent
 * acts on that control of the open printer (KAN-1359). The ids are `home`,
 * `jog`, `hotend`, `bed`, `fans` and `print-start`; see
 * `services/agents/activity.ts` for what each phase looks like.
 *
 * The tint is a layer over the element that takes no clicks; the names on it
 * are read out once, politely, by the layer's live region.
 */
import Vue from 'vue'
import type { DirectiveOptions, VNode } from 'vue'
import { acquireAgentStream, agentActivity, type ControlActivity } from '@/services/agents'
import type { Highlight } from '@/services/agents/activity'

const PALETTE_SIZE = 8

/** The colour a highlight is drawn in: the theme's palette slot, the console's hex, or neutral. */
export function colourOf (h: Pick<Highlight, 'colour' | 'colourIndex' | 'agentId'>): string {
  if (h.agentId === null) return 'var(--m3d-agent-neutral)'
  if (h.colourIndex !== null && h.colourIndex >= 0 && h.colourIndex < PALETTE_SIZE) return `var(--m3d-agent-${h.colourIndex})`
  if (h.colour && /^#[0-9a-f]{6}$/i.test(h.colour)) return h.colour
  return 'var(--m3d-agent-neutral)'
}

export function labelOf (h: Highlight): string {
  switch (h.look) {
    case 'asked': return `${h.agentName} · waiting for you`
    case 'approved': return `${h.agentName} · approved`
    case 'denied': return `${h.agentName} · denied`
    case 'failed': return `${h.agentName} · failed`
    case 'estop': return `${h.agentName} · emergency stop`
    default: return h.agentName
  }
}

interface Layer {
  vm: Vue & { id: string };
  release: () => void;
}

const layers = new WeakMap<HTMLElement, Layer>()

const Overlay = Vue.extend({
  data: () => ({ id: '' }),
  computed: {
    activity (): ControlActivity | null {
      return agentActivity()[this.id as keyof ReturnType<typeof agentActivity>] ?? null
    }
  },
  watch: {
    activity: {
      handler (this: Vue & { activity: ControlActivity | null }) {
        const host = this.$el?.parentElement
        if (!host) return
        if (this.activity) host.setAttribute('data-agent-look', this.activity.look)
        else host.removeAttribute('data-agent-look')
      }
    }
  },
  mounted (this: Vue & { activity: ControlActivity | null }) {
    const host = this.$el.parentElement
    if (host && this.activity) host.setAttribute('data-agent-look', this.activity.look)
  },
  render (this: Vue & { activity: ControlActivity | null, id: string }, h): VNode {
    const a = this.activity
    if (!a) return h('span', { class: 'm3d-agent-hl m3d-agent-hl--off', attrs: { 'aria-live': 'polite', 'data-tid': 'agent-highlight-idle' } })
    const lead = a.stack[a.stack.length - 1]
    return h('span', {
      class: ['m3d-agent-hl', `m3d-agent-hl--${a.look}`],
      style: { '--m3d-agent-hl': colourOf(lead) },
      attrs: { 'aria-live': 'polite', 'data-tid': 'agent-highlight', 'data-control': this.id, 'data-look': a.look }
    }, [
      h('span', { class: 'm3d-agent-hl__names' }, a.stack.map(s => h('span', {
        key: s.key,
        class: ['m3d-agent-hl__name', `m3d-agent-hl__name--${s.look}`],
        style: { '--m3d-agent-hl': colourOf(s) },
        attrs: { 'data-tid': 'agent-highlight-name' }
      }, [h('span', { class: 'm3d-agent-hl__dot', attrs: { 'aria-hidden': 'true' } }), labelOf(s)])))
    ])
  }
})

export const AgentHighlight: DirectiveOptions = {
  inserted (el, binding) {
    if (layers.has(el)) return
    el.classList.add('m3d-agent-host')
    const mount = document.createElement('span')
    el.appendChild(mount)
    const vm = new Overlay() as Vue & { id: string }
    vm.id = String(binding.value ?? '')
    vm.$mount(mount)
    layers.set(el, { vm, release: acquireAgentStream() })
  },
  update (el, binding) {
    const layer = layers.get(el)
    if (layer) layer.vm.id = String(binding.value ?? '')
  },
  unbind (el) {
    const layer = layers.get(el)
    if (!layer) return
    layers.delete(el)
    layer.release()
    layer.vm.$el.remove()
    layer.vm.$destroy()
    el.classList.remove('m3d-agent-host')
    el.removeAttribute('data-agent-look')
  }
}

export default AgentHighlight
