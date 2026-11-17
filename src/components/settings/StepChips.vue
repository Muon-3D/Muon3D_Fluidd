<template>
  <div
    class="step-chips"
    role="list"
    :aria-label="label"
    :data-tid="tid"
  >
    <template v-for="(value, i) in values">
      <input
        v-if="editing === i"
        :key="`edit-${i}`"
        ref="edit"
        v-model="draft"
        class="step-chips__chip step-chips__input"
        inputmode="decimal"
        :aria-label="`${label}: change ${value}, or clear it to remove it`"
        :data-tid="`${tid}-input`"
        @keydown.enter.prevent="commit"
        @keydown.esc="cancel"
        @blur="commit"
      >
      <button
        v-else
        :key="`chip-${value}`"
        type="button"
        role="listitem"
        class="step-chips__chip"
        :disabled="disabled"
        :aria-label="`${value}${unit ? ` ${unit}` : ''}. Change it, or clear it to remove it.`"
        :data-tid="`${tid}-chip`"
        @click="edit(i)"
      >
        {{ value }}
      </button>
    </template>
    <input
      v-if="editing === values.length"
      key="new"
      ref="edit"
      v-model="draft"
      class="step-chips__chip step-chips__input"
      inputmode="decimal"
      :aria-label="`${label}: a new size`"
      :data-tid="`${tid}-input`"
      @keydown.enter.prevent="commit"
      @keydown.esc="cancel"
      @blur="commit"
    >
    <button
      v-else
      type="button"
      class="step-chips__chip step-chips__add"
      :disabled="disabled"
      :aria-label="`Add a size to ${label}`"
      :data-tid="`${tid}-add`"
      @click="edit(values.length)"
    >
      +
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { normaliseSteps } from '@/services/settings/motion-limits'

/**
 * Step sizes as chips: press one to change it (clear it to remove it), "+"
 * adds one. Emits `change` with the whole list, once each, smallest first.
 * At least one size always stays.
 */
@Component({})
export default class StepChips extends Vue {
  @Prop({ type: Array, required: true }) readonly values!: number[]
  @Prop({ type: String, required: true }) readonly label!: string
  @Prop({ type: String, default: '' }) readonly unit!: string
  @Prop({ type: String, default: 'step-chips' }) readonly tid!: string
  @Prop({ type: Boolean }) readonly disabled?: boolean

  editing: number | null = null
  draft = ''

  edit (index: number) {
    this.editing = index
    this.draft = index < this.values.length ? String(this.values[index]) : ''
    this.$nextTick(() => {
      const el = this.$refs.edit as HTMLInputElement | HTMLInputElement[] | undefined
      const input = Array.isArray(el) ? el[0] : el
      input?.focus()
      input?.select()
    })
  }

  cancel () {
    this.editing = null
    this.draft = ''
  }

  commit () {
    const index = this.editing
    if (index === null) return
    this.editing = null
    const text = this.draft.trim().replace(',', '.')
    this.draft = ''
    const next = [...this.values]
    if (text === '') {
      if (index < next.length && next.length > 1) next.splice(index, 1)
    } else {
      const n = Number(text)
      if (!Number.isFinite(n) || n <= 0) return
      if (index < next.length) next[index] = n
      else next.push(n)
    }
    const saved = normaliseSteps(next)
    if (saved.length && saved.join() !== this.values.join()) this.$emit('change', saved)
  }
}
</script>

<style lang="scss" scoped>
  .step-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .step-chips__chip {
    min-width: 40px;
    height: 32px;
    padding: 0 10px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
    font-weight: 600;
    text-align: center;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  .step-chips__input {
    width: 72px;
    outline: none;
    box-shadow: inset 0 0 0 1.5px var(--m3d-accent);
  }

  .step-chips__add {
    color: var(--m3d-text-muted);
  }
</style>
