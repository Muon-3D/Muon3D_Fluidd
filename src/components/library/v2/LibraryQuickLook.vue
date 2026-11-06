<template>
  <div
    class="mlook"
    role="dialog"
    aria-modal="true"
    :aria-label="card.title"
    data-tid="library-quick-look"
    @click.self="$emit('close')"
  >
    <div
      ref="card"
      class="mlook__card"
      tabindex="-1"
    >
      <div class="mlook__stage">
        <span class="mlib-badge mlib-badge--glass mlook__tag">Quick look</span>
        <button
          ref="close"
          type="button"
          class="mlib-btn mlib-btn--icon mlook__close"
          aria-label="Close"
          data-tid="library-quick-look-close"
          @click="$emit('close')"
        >
          <frame-icon
            name="x"
            small
          />
        </button>
        <img
          v-if="shown"
          :src="shown"
          alt=""
          class="mlook__img"
        >
        <span
          v-else
          class="mlook__img mcard__blank"
        ><frame-icon
          name="library"
          large
        /></span>
        <div
          v-if="pictures.length > 1"
          class="mlook__strip"
        >
          <button
            v-for="(src, i) in pictures"
            :key="src"
            type="button"
            class="mlook__thumb"
            :class="{ 'mlook__thumb--on': pic === i }"
            :aria-label="`Picture ${i + 1}`"
            @click="pic = i"
          >
            <img
              :src="src"
              alt=""
            >
          </button>
        </div>
      </div>

      <div class="mlook__side">
        <header class="mlook__head">
          <h2>{{ card.title }}</h2>
          <template v-if="signedIn && card.kind === 'publication'">
            <button
              type="button"
              class="mlib-btn mlib-btn--icon mlib-btn--sm mlook__heart"
              :class="{ 'mlook__heart--on': saveId }"
              :aria-pressed="saveId ? 'true' : 'false'"
              :aria-label="saveId ? `Unsave ${card.title}` : `Save ${card.title}`"
              :aria-busy="saving ? 'true' : 'false'"
              data-tid="library-quick-look-save"
              @click="toggleSave"
            >
              {{ saveId ? '♥' : '♡' }}
            </button>
          </template>
        </header>
        <p
          class="mlib-muted mlook__note"
          role="status"
          aria-live="polite"
        >
          {{ note }}
        </p>
        <div class="mcard__by">
          {{ card.creator }}
          <span
            v-if="card.m1"
            class="mlib-badge mlib-badge--ok"
          >Made for M1</span>
          <span
            v-if="card.m1 && printerFits && printerName"
            class="mlib-badge mlib-badge--ok"
            data-tid="library-quick-look-fits"
          >Fits {{ printerName }}</span>
        </div>
        <div class="mlook__stats">
          <span class="mlib-stat"><frame-icon
            name="printer"
            small
          />{{ makes }} made</span>
          <span
            v-if="remixes"
            class="mlib-stat"
          ><frame-icon
            name="copy"
            small
          />{{ remixes }} {{ remixes === 1 ? 'remix' : 'remixes' }}</span>
          <span
            v-if="saves"
            class="mlib-stat"
          >♡ {{ saves }}</span>
        </div>

        <p
          v-if="busy"
          class="mlib-muted"
          role="status"
        >
          Reading the print…
        </p>
        <p
          v-else-if="error"
          class="mlib-muted"
          role="alert"
        >
          {{ error }}
        </p>
        <template v-else>
          <dl
            v-if="specs.length"
            class="mlook__specs"
          >
            <div
              v-for="s in specs"
              :key="s.label"
            >
              <dt>{{ s.label }}</dt><dd>{{ s.value }}</dd>
            </div>
          </dl>
          <p
            v-if="description"
            class="mlook__desc"
          >
            {{ description }}
          </p>
        </template>

        <div
          v-if="colours.length || loadedLine"
          class="mlook__colours"
          data-tid="library-quick-look-colours"
        >
          <template v-if="colours.length">
            <span class="mlib-muted">Shown in</span>
            <span
              v-for="c in colours"
              :key="c"
              class="mlook__dot"
              :class="{ 'mlook__dot--on': c === loadedColour }"
              :style="{ background: c }"
              role="img"
              :aria-label="c === loadedColour ? `${colourLabel(c)}, loaded` : colourLabel(c)"
            />
          </template>
          <span
            v-if="loadedLine"
            class="mlib-muted mlook__loaded"
            data-tid="library-quick-look-loaded"
          >{{ loadedLine }}</span>
        </div>

        <div class="mlook__acts">
          <button
            v-if="print || card.kind === 'catalogue'"
            type="button"
            class="mlib-btn mlib-btn--primary mlook__go"
            :disabled="busy"
            data-tid="library-quick-look-print"
            @click="go"
          >
            <frame-icon
              name="printer"
              small
            />
            {{ printerName ? `Print on ${printerName}` : 'Print on…' }}
          </button>
          <a
            v-else-if="!busy"
            :href="card.href"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--primary mlook__go"
            data-tid="library-quick-look-slice"
          >Slice it on library.muon3d.com ↗</a>
        </div>
        <div
          class="mlook__secondary"
          data-tid="library-quick-look-more"
        >
          <select
            v-if="signedIn && card.kind === 'publication'"
            class="mlook__collect"
            aria-label="Add to collection"
            data-tid="library-quick-look-collect"
            :aria-busy="saving ? 'true' : 'false'"
            @change="collect($event)"
          >
            <option value="">
              Add to collection
            </option>
            <option value="__new">
              New collection…
            </option>
            <option
              v-for="c in collections"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </option>
          </select>
          <button
            v-if="card.kind === 'publication'"
            type="button"
            class="mlib-btn mlib-btn--sm"
            data-tid="library-quick-look-page"
            @click="$emit('page', card); $emit('close')"
          >
            Open page
          </button>
          <a
            v-else
            :href="card.href"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--sm"
            data-tid="library-quick-look-page"
          >Open page ↗</a>
          <a
            v-if="card.kind === 'publication'"
            :href="remixHref"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--sm"
            data-tid="library-quick-look-remix"
          >Remix ↗</a>
          <button
            v-if="signedIn && inCollection"
            type="button"
            class="mlib-btn mlib-btn--sm"
            :disabled="saving"
            data-tid="library-quick-look-uncollect"
            @click="uncollect"
          >
            Remove from {{ inCollection.name }}
          </button>
          <button
            v-if="signedIn && print"
            type="button"
            class="mlib-btn mlib-btn--sm"
            :aria-busy="downloading ? 'true' : 'false'"
            data-tid="library-quick-look-download"
            @click="download"
          >
            {{ downloading ? 'Downloading…' : 'Download' }}
          </button>
        </div>
        <form
          v-if="naming"
          class="mlook__new"
          data-tid="library-quick-look-new"
          @submit.prevent="createAndAdd"
        >
          <input
            ref="newName"
            v-model="newName"
            type="text"
            maxlength="80"
            placeholder="Name"
            aria-label="New collection name"
            data-tid="library-quick-look-new-name"
            @keydown.esc.stop="naming = false"
          >
          <button
            type="submit"
            class="mlib-btn mlib-btn--sm mlib-btn--primary"
            :disabled="!newName.trim() || saving"
          >
            Create and add
          </button>
        </form>
        <p
          v-if="!busy && !print && card.kind === 'publication' && !error"
          class="mlib-muted mlook__note"
        >
          This print has no G-code yet. Slice it for your printer, then print it from here.
        </p>

        <div
          v-if="tags.length"
          class="mlib-chips mlook__tags"
        >
          <span
            v-for="t in tags"
            :key="t"
            class="mlib-chip mlib-chip--quiet"
          >#{{ t }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import LibraryPublicationMixin from '@/mixins/library-publication'

/**
 * The big quick look: its pictures, the facts that matter, and Print. What
 * it does with the print is mixins/library-publication.ts (a print's page
 * shares it); here is only being a dialog over the page.
 */
@Component({})
export default class LibraryQuickLook extends Mixins(LibraryPublicationMixin) {
  before: Element | null = null

  // Above the rail and the app bar: out of the page's stacking context,
  // into the app's root, where its theme tokens still apply.
  mounted () {
    this.before = document.activeElement;
    (document.querySelector('[data-app]') ?? document.body).appendChild(this.$el)
    // Focus moves into the quick look: its Close where it shows (phone),
    // else the dialog itself, so Escape and Tab start inside it.
    const close = this.$refs.close as HTMLElement | undefined
    const target = close && close.offsetParent !== null ? close : this.$refs.card as HTMLElement | undefined
    target?.focus()
    document.addEventListener('keydown', this.onKey)
  }

  beforeDestroy () {
    document.removeEventListener('keydown', this.onKey)
    this.$el.remove();
    (this.before as HTMLElement | null)?.focus?.()
  }

  onKey (event: KeyboardEvent) {
    // A dialog opened over the quick look (Print on…) takes its own Escape.
    const inside = this.$el.contains(document.activeElement)
    if (event.key === 'Escape' && (inside || document.activeElement === document.body)) {
      this.$emit('close')
      return
    }
    if (event.key !== 'Tab' || (!inside && document.activeElement !== document.body)) return
    const focusable = Array.from(this.$el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    // Focus fell to the page (a control went disabled): back into the quick look.
    if (!inside) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}
</script>
