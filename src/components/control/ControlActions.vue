<template>
  <div
    class="control-actions"
    data-tid="control-actions"
  >
    <button
      v-if="phone"
      type="button"
      class="cbtn"
      :disabled="!controlReady"
      data-tid="cool-down"
      @click="coolDown"
    >
      <frame-icon
        name="snow"
        small
      />
      Cool down
    </button>
    <component
      :is="phone ? 'details' : 'div'"
      class="control-actions__more"
      :class="{ 'control-actions__more--desktop': !phone }"
    >
      <summary
        v-if="phone"
        class="cbtn"
        aria-label="More printer actions"
      >
        More
      </summary>
      <div class="control-actions__menu">
        <button
          type="button"
          class="cbtn"
          :disabled="!!restartRefusal"
          :title="restartRefusal || undefined"
          data-tid="restart-printer"
          @click="sendTypedGcode('FIRMWARE_RESTART', 'printer')"
        >
          Restart printer
        </button>
      </div>
    </component>
    <p
      v-if="commandRefusal"
      class="control-actions__refusal"
      role="alert"
    >
      {{ commandRefusal }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'

/** Cool down up front on a phone, and one restart; technical restarts stay in System. */
@Component({})
export default class ControlActions extends Mixins(ControlMixin) {
  @Prop({ type: Boolean }) readonly phone?: boolean
}
</script>

<style lang="scss" scoped>
  .control-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    kbd {
      font-size: 11px;
    }
  }
  .control-actions__more { position: relative; }
  .control-actions__more--desktop,
  .control-actions__more--desktop .control-actions__menu {
    display: contents;
  }
  .control-actions__menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: absolute;
    z-index: 10;
    right: 0;
    top: 100%;
    width: max-content;
    max-width: 85vw;
    padding: 10px;
    border: 1px solid var(--m3d-border);
    border-radius: 12px;
    background: var(--m3d-surface);
    box-shadow: 0 6px 20px rgb(0 0 0 / 20%);
  }
  .control-actions__refusal { flex-basis: 100%; margin: 0; font-size: 12px; color: var(--m3d-text-muted); }
</style>
