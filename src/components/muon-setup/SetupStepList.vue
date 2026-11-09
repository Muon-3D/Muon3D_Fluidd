<template>
  <nav
    class="setup-steps"
    :aria-label="label"
  >
    <ol class="setup-steps__list">
      <li
        v-for="(step, i) in steps"
        :key="step.id"
        :class="`is-${step.status}`"
        :aria-current="step.status === 'on' ? 'step' : undefined"
        :data-tid="`step-${step.id}`"
      >
        <span class="setup-steps__mark">
          <v-icon
            v-if="step.status === 'done'"
            x-small
          >
            $check
          </v-icon>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="setup-steps__label">{{ step.label }}</span>
      </li>
    </ol>
    <div
      class="setup-steps__dots"
      aria-hidden="true"
      data-tid="step-dots"
    >
      <i
        v-for="step in steps"
        :key="step.id"
        :class="`is-${step.status}`"
      />
    </div>
  </nav>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { FrameStep } from '@/services/muon-setup/steps'

/** The setup step list: a numbered list beside the card on a desktop, progress dots above it on a phone. */
@Component({})
export default class SetupStepList extends Vue {
  @Prop({ type: Array, required: true })
  readonly steps!: FrameStep[]

  @Prop({ type: String, default: 'Setup steps' })
  readonly label!: string
}
</script>

<style lang="scss" scoped>
.setup-steps {
  &__list {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--m3d-radius-sm);
      color: var(--m3d-text-muted);
      font-size: var(--m3d-text-sm);

      &.is-on {
        color: var(--m3d-text);
        background: var(--m3d-fill-2);
        font-weight: var(--m3d-weight-medium);
      }

      &.is-done {
        color: var(--m3d-text);
      }
    }
  }

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: var(--m3d-radius-pill);
    background: var(--m3d-fill);
    font-size: var(--m3d-text-xs);

    .is-on & {
      background: var(--m3d-accent);
      color: #fff;
    }

    .is-done & {
      background: var(--m3d-accent-soft);
    }
  }

  &__dots {
    display: none;
    justify-content: center;
    gap: 6px;

    i {
      width: 6px;
      height: 6px;
      border-radius: var(--m3d-radius-pill);
      background: var(--m3d-fill-strong);

      &.is-done {
        background: var(--m3d-accent-soft);
      }

      &.is-on {
        width: 18px;
        background: var(--m3d-accent);
      }
    }
  }
}

@media (max-width: 699px) {
  .setup-steps__list {
    display: none;
  }

  .setup-steps__dots {
    display: flex;
  }
}
</style>
