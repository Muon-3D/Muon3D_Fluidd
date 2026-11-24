<template>
  <div
    v-if="problem || ask"
    class="route-problem"
    data-tid="route-problem"
  >
    <template v-if="problem">
      <p
        class="route-problem__line"
        data-tid="route-problem-line"
      >
        {{ problem.line }}
      </p>
      <div class="route-problem__buttons">
        <button
          v-for="c in problem.choices"
          :key="c.id"
          type="button"
          class="route-problem__btn"
          :data-tid="`route-choice-${c.id}`"
          @click="$emit('choose', c.id)"
        >
          {{ c.label }}
        </button>
      </div>
    </template>
    <template v-if="ask">
      <p
        class="route-problem__line"
        data-tid="muon-local-question"
      >
        {{ question }}
      </p>
      <div class="route-problem__buttons">
        <button
          type="button"
          class="route-problem__btn"
          data-tid="muon-local-open"
          @click="open"
        >
          Open muon3d.local
        </button>
        <button
          type="button"
          class="route-problem__btn"
          data-tid="muon-local-cancel"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { MUON_LOCAL_QUESTION, openMuonLocal } from '@/services/muon-cloud/muon-local'

export interface RouteProblem {
  line: string;
  choices: Array<{ id: string, label: string }>;
}

/**
 * Said when a printer would not open: for a route the person picked, what failed and the other routes as buttons
 * (nothing switches by itself); for Auto with nothing left, the question about muon3d.local, which only the
 * "Open" button follows.
 */
@Component({})
export default class PrinterRouteProblem extends Vue {
  @Prop({ default: null }) readonly problem!: RouteProblem | null
  @Prop({ default: false }) readonly ask!: boolean

  question = MUON_LOCAL_QUESTION

  open () {
    openMuonLocal()
  }
}
</script>

<style lang="scss" scoped>
  .route-problem {
    margin: 8px 0;
    font-size: 14px;
  }

  .route-problem__line {
    margin: 0 0 6px;
  }

  .route-problem__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .route-problem__btn {
    padding: 6px 12px;
    border: 1px solid currentcolor;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
</style>
