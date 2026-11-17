<template>
  <section
    v-if="kind === 'callout'"
    class="mstate-callout"
    role="alert"
    :data-tid="tid"
  >
    <span class="mstate-callout__text">{{ title }}<template v-if="text"> {{ text }}</template></span>
    <button
      v-if="action"
      type="button"
      class="mlib-btn mlib-btn--sm"
      @click="$emit('action')"
    >
      {{ action }}
    </button>
  </section>
  <section
    v-else
    class="mstate"
    :role="kind === 'error' ? 'alert' : 'status'"
    :data-tid="tid"
  >
    <span class="mstate__icon"><frame-icon
      :name="icon"
      large
    /></span>
    <strong class="mstate__title">{{ title }}</strong>
    <p
      v-if="text"
      class="mstate__text"
    >
      {{ text }}
    </p>
    <button
      v-if="action"
      type="button"
      class="mlib-btn"
      :class="{ 'mlib-btn--primary': primary }"
      :data-tid="tid ? `${tid}-action` : undefined"
      @click="$emit('action')"
    >
      {{ action }}
    </button>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * One Library state, the same everywhere (v3 principles §6, L8): an icon,
 * one bold line saying what's missing, one muted line saying how to fix it,
 * at most one button. `callout` is the inline form for a tile or shelf that
 * failed while the rest of the page keeps working.
 */
@Component({})
export default class LibraryState extends Vue {
  @Prop({ type: String, default: 'empty' }) readonly kind!: 'empty' | 'error' | 'callout'
  @Prop({ type: String, default: 'library' }) readonly icon!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, default: '' }) readonly text!: string
  @Prop({ type: String, default: '' }) readonly action!: string
  @Prop({ type: Boolean, default: false }) readonly primary!: boolean
  @Prop({ type: String, default: '' }) readonly tid!: string
}
</script>
