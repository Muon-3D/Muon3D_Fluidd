<template>
  <div
    class="mlook"
    role="dialog"
    aria-modal="true"
    :aria-label="card.title"
    data-tid="library-quick-look"
    @click.self="$emit('close')"
  >
    <div class="mlook__card">
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
        </header>
        <div class="mcard__by">
          {{ card.creator }}
          <span
            v-if="card.m1"
            class="mlib-badge mlib-badge--ok"
          >Made for M1</span>
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
          <a
            :href="card.href"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--icon"
            aria-label="Open its page"
          ><frame-icon
            name="external"
            small
          /></a>
        </div>
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
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { PublicPublication } from '@/services/library/api'
import { safePicture } from '@/services/library/discover'
import { loadPublication, minutesText, publicationPrint, type PublicationPrint, type ShelfCard } from '@/services/library/shelves'

/** The big quick look: its pictures, the facts that matter, and Print. */
@Component({})
export default class LibraryQuickLook extends Vue {
  @Prop({ type: Object, required: true }) readonly card!: ShelfCard
  @Prop({ type: String, default: null }) readonly printerName!: string | null

  pic = 0
  busy = false
  error = ''
  publication: PublicPublication | null = null
  print: PublicationPrint | null = null
  before: Element | null = null

  created () {
    if (this.card.kind === 'publication') this.read()
  }

  // Above the rail and the app bar: out of the page's stacking context,
  // into the app's root, where its theme tokens still apply.
  mounted () {
    this.before = document.activeElement;
    (document.querySelector('[data-app]') ?? document.body).appendChild(this.$el);
    (this.$refs.close as HTMLElement | undefined)?.focus()
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

  async read () {
    this.busy = true
    this.error = ''
    try {
      this.publication = await loadPublication(this.card.id)
      this.print = publicationPrint(this.publication, this.card.id)
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    } finally {
      this.busy = false
    }
  }

  get pictures (): string[] {
    const images = (this.publication?.images ?? [])
      .map(image => safePicture(image.url))
      .filter((url): url is string => !!url)
    const all = [this.card.picture, ...images].filter((url): url is string => !!url)
    return all.filter((url, i) => all.indexOf(url) === i).slice(0, 6)
  }

  get shown (): string | null { return this.pictures[this.pic] ?? null }
  get makes (): number { return this.publication?.counts?.makes ?? this.card.makes }
  get remixes (): number { return this.publication?.counts?.remixes ?? this.card.remixes }
  get saves (): number { return this.publication?.counts?.saves ?? this.card.saves }
  get tags (): string[] { return (this.publication?.tags ?? this.card.tags).slice(0, 6) }
  get description (): string { return (this.publication?.description ?? '').trim().slice(0, 400) }

  get specs (): Array<{ label: string, value: string }> {
    const setup = this.print?.item.setups[0]
    if (!setup) return this.card.facts ? [{ label: 'Print', value: this.card.facts }] : []
    return [
      { label: 'Printer', value: setup.printer_model },
      { label: 'Material', value: setup.material },
      { label: 'Nozzle', value: `${setup.nozzle_mm} mm` },
      ...(setup.print_seconds ? [{ label: 'Time', value: minutesText(setup.print_seconds) }] : []),
      ...(setup.filament_g ? [{ label: 'Filament', value: `${Math.round(setup.filament_g)} g` }] : []),
      ...(this.print && this.print.item.setups.length > 1 ? [{ label: 'G-codes', value: String(this.print.item.setups.length) }] : [])
    ]
  }

  go () {
    if (this.card.kind === 'catalogue') {
      window.open(this.card.href, '_blank', 'noopener')
      return
    }
    if (!this.print) return
    this.$emit('print', this.card, this.print)
    this.$emit('close')
  }
}
</script>
