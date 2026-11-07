<template>
  <div
    class="pv"
    data-tid="profile-previews"
  >
    <div class="pv__cell">
      <span class="pv__label">A make in the Library</span>
      <!-- The Library's own card, so what is shown is what the Library shows. Not for pressing. -->
      <div
        class="mlib mlib--control pv__card"
        aria-hidden="true"
        data-tid="profile-preview-card"
      >
        <library-model-card
          :card="card"
          inert
        />
      </div>
    </div>

    <div class="pv__cell">
      <span class="pv__label">People on a printer</span>
      <div
        class="pv__row"
        data-tid="profile-preview-person"
      >
        <profile-avatar
          :photo="photo"
          :letter="letter"
          size="lg"
        />
        <span class="pv__text">
          <b>{{ name }}</b>
          <span>{{ handle ? `@${handle}` : 'No username yet' }} · Owner</span>
        </span>
      </div>
    </div>

    <div class="pv__cell">
      <span class="pv__label">Top bar, everywhere</span>
      <div
        class="pv__row"
        data-tid="profile-preview-topbar"
      >
        <profile-avatar
          :photo="photo"
          :letter="letter"
          size="xs"
        />
        <span class="pv__text">
          <span>Control, library.muon3d.com and the app show the same photo and name.</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import LibraryModelCard from '@/components/library/v2/LibraryModelCard.vue'
import ProfileAvatar from './ProfileAvatar.vue'
import type { ShelfCard } from '@/services/library/shelves'

/**
 * "How others see you": a Library print card with its maker line (the real
 * LibraryModelCard), a person on a printer, and the top bar's avatar.
 * Private shows "a maker" on makes, as the Library does. The sample print is
 * only an example.
 */
@Component({ components: { LibraryModelCard, ProfileAvatar } })
export default class ProfilePreviews extends Vue {
  @Prop({ type: String, default: '' }) readonly name!: string
  @Prop({ type: String, default: null }) readonly handle!: string | null
  @Prop({ type: String, default: null }) readonly photo!: string | null
  @Prop({ type: String, default: '?' }) readonly letter!: string
  @Prop({ type: Boolean, default: false }) readonly isPublic!: boolean

  get card (): ShelfCard {
    return {
      key: 'pub:profile-preview',
      kind: 'publication',
      id: 'profile-preview',
      slug: 'profile-preview',
      title: 'Cable clip, 6 mm',
      picture: null,
      creator: this.isPublic ? this.name : 'a maker',
      handle: this.isPublic ? this.handle : null,
      makes: 41,
      remixes: 0,
      saves: 0,
      facts: '',
      m1: false,
      tags: [],
      remixOf: null,
      makeOf: null,
      createdAt: null,
      href: '#'
    }
  }
}
</script>

<style lang="scss">
  @import '../../library/v2/library-v2.scss';
</style>

<style lang="scss" scoped>
  .pv {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 4px 0 16px;

    @media (max-width: 720px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .pv__cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 12px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
  }

  .pv__label {
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pv__card {
    padding: 0 0 0;
    padding-bottom: 0;
    pointer-events: none;
    min-width: 0;
  }

  .pv__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .pv__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 13px;
    overflow-wrap: anywhere;

    span {
      color: var(--m3d-text-muted);
    }
  }
</style>
