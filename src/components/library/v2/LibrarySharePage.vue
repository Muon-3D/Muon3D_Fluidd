<template>
  <section
    class="mshare"
    data-tid="library-share"
    aria-label="Share a print"
  >
    <header class="mshare__head">
      <div class="mshare__titles">
        <button
          type="button"
          class="mshare__back"
          data-tid="library-share-back"
          @click="$emit('back')"
        >
          ‹ Yours
        </button>
        <h1>Share a print</h1>
        <p class="mshare__muted">
          Put one of your prints in Discover for other people to print
        </p>
      </div>
      <div
        v-if="!done && !setup && !linkShare"
        class="mshare__go"
      >
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          :disabled="!canPublish"
          aria-describedby="library-share-needs"
          data-tid="library-share-publish"
          @click="publish"
        >
          {{ busy ? (audience === 'public' ? 'Publishing…' : 'Sharing…') : audience === 'public' ? 'Publish' : audience === 'private' ? 'Keep it in Yours' : 'Share' }}
        </button>
        <span
          v-if="needs"
          id="library-share-needs"
          class="mshare__muted"
          data-tid="library-share-needs"
        >{{ needs }}</span>
      </div>
    </header>

    <!-- A link was made: its key is shown this once. -->
    <section
      v-if="linkShare"
      class="lib-empty lib-surface mshare__state"
      role="status"
      data-tid="library-share-link-done"
    >
      <h2>Your link</h2>
      <input
        type="text"
        readonly
        class="mshare__link"
        aria-label="Link"
        :value="linkShare.url"
        data-tid="library-share-link-url"
        @focus="$event.target.select()"
      >
      <p
        class="mshare__warn"
        data-tid="library-share-link-once"
      >
        This link is shown once. We don't keep it, so copy it now. Anyone who has it can open this print for 7 days, until you stop sharing. If you lose it, make a new link.
      </p>
      <p
        v-if="linkNote"
        class="mshare__muted"
        role="status"
      >
        {{ linkNote }}
      </p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="library-share-link-copy"
          @click="copyLink"
        >
          Copy link
        </button>
        <button
          type="button"
          class="lib-btn"
          data-tid="library-share-link-done-back"
          @click="$emit('back')"
        >
          Done
        </button>
      </div>
    </section>

    <!-- Sent: what happens next. -->
    <section
      v-else-if="done"
      class="lib-empty lib-surface mshare__state"
      role="status"
      data-tid="library-share-done"
    >
      <template v-if="done.direct">
        <h2>Shared</h2>
        <p>{{ done.title }} is shared with {{ done.direct.map(h => '@' + h).join(', ') }} for 7 days. You can stop sharing from Yours.</p>
        <p
          v-if="done.failed && done.failed.length"
          class="mshare__error"
          role="alert"
          data-tid="library-share-partial"
        >
          {{ done.failed.join(' ') }}
        </p>
      </template>
      <template v-else>
        <h2>Sent for review</h2>
        <p>{{ done.title }} shows in Discover once it has been reviewed, usually within a day. You'll find it in Yours under Shared by you.</p>
      </template>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="library-share-done-back"
          @click="$emit('back')"
        >
          Done
        </button>
      </div>
    </section>

    <!-- Not able to publish yet: say why, and where to fix it. -->
    <section
      v-else-if="setup"
      class="lib-empty lib-surface mshare__state"
      data-tid="library-share-setup"
    >
      <h2>{{ setup.title }}</h2>
      <p>{{ setup.text }}</p>
      <div class="lib-empty__actions">
        <router-link
          v-if="setup.to"
          :to="setup.to"
          class="lib-btn lib-btn--pri"
        >
          {{ setup.action }}
        </router-link>
        <button
          type="button"
          class="lib-btn"
          data-tid="library-share-check-again"
          @click="checkAgain"
        >
          Check again
        </button>
      </div>
    </section>

    <div
      v-else
      class="mshare__grid"
    >
      <!-- Files: the print, from Yours, as it was sliced. -->
      <section
        class="mshare__tile"
        aria-label="Files"
        data-tid="library-share-files"
      >
        <header class="mshare__tile-head">
          <frame-icon
            name="files"
            small
          />
          <h2>Files</h2>
        </header>
        <p
          v-if="itemId && !item && chosen === itemId"
          class="mshare__warn"
          data-tid="library-share-unknown"
        >
          {{ itemsReady ? 'That print isn\'t in Yours any more. Choose another one.' : 'Reading your prints…' }}
        </p>
        <p
          v-if="item && !shareable(item)"
          class="mshare__warn"
          role="alert"
          data-tid="library-share-not-yours"
        >
          {{ notShareableWhy(item) }}
        </p>
        <label
          v-if="!item || !shareable(item)"
          class="mshare__field"
        >
          <span>Which print</span>
          <select
            v-model="chosen"
            data-tid="library-share-choose"
          >
            <option value="">Choose one of your prints</option>
            <option
              v-for="i in printable"
              :key="i.id"
              :value="i.id"
            >{{ i.name }}</option>
          </select>
        </label>
        <div
          v-if="item && shareable(item)"
          class="mshare__file"
          data-tid="library-share-file"
        >
          <span class="mshare__thumb">
            <img
              v-if="picture"
              :src="picture"
              alt=""
            >
            <frame-icon
              v-else
              name="library"
            />
          </span>
          <span class="mshare__file-text">
            <b>{{ item.name }}<template v-if="item.version"> · version {{ item.version }}</template></b>
            <span>{{ fileLine }}</span>
          </span>
          <span
            v-if="forM1"
            class="lib-pill lib-pill--ok"
          >Sliced for M1</span>
          <button
            v-if="!itemId"
            type="button"
            class="lib-btn lib-btn--sm"
            @click="chosen = ''"
          >
            Change
          </button>
        </div>
        <p
          v-if="item && shareable(item) && !gcode"
          class="mshare__warn"
          role="alert"
        >
          This print has no G-code yet. Slice it, save it, then share it, so it arrives ready to print.
        </p>
        <p class="mshare__muted">
          Its picture is the one Slice saved with it.
        </p>
      </section>

      <!-- Details: a title, what it is, a category and tags. -->
      <section
        class="mshare__tile"
        aria-label="Details"
        data-tid="library-share-details"
      >
        <header class="mshare__tile-head">
          <frame-icon
            name="pencil"
            small
          />
          <h2>Details</h2>
        </header>
        <input
          v-model="title"
          type="text"
          maxlength="120"
          placeholder="Title"
          aria-label="Title"
          data-tid="library-share-title"
        >
        <textarea
          v-model="description"
          rows="3"
          maxlength="2000"
          placeholder="What it is, how to print it…"
          aria-label="Description"
          data-tid="library-share-description"
        />
        <div
          class="mlib-chips"
          role="radiogroup"
          aria-label="Category"
          @keydown.left.prevent="step('category', -1, $event)"
          @keydown.right.prevent="step('category', 1, $event)"
        >
          <button
            v-for="c in categories"
            :key="c.id"
            type="button"
            role="radio"
            class="mlib-chip"
            :class="{ 'mlib-chip--on': category === c.id }"
            :aria-checked="category === c.id ? 'true' : 'false'"
            :tabindex="category === c.id ? 0 : -1"
            :data-tid="`library-share-category-${c.id}`"
            @click="category = c.id"
          >
            {{ c.label }}
          </button>
        </div>
        <div
          class="mlib-chips"
          role="group"
          aria-label="Tags"
        >
          <span
            v-for="t in tags"
            :key="t"
            class="mlib-chip mlib-chip--quiet"
          >#{{ t }} <button
            type="button"
            class="mshare__x"
            :aria-label="`Remove ${t}`"
            @click="tags = tags.filter(x => x !== t)"
          >×</button></span>
          <input
            v-if="tags.length < 10"
            v-model="tag"
            type="text"
            maxlength="32"
            class="mshare__tag"
            placeholder="+ tag"
            aria-label="Add a tag"
            data-tid="library-share-tag"
            @keydown.enter.prevent="addTag"
            @keydown.188.prevent="addTag"
          >
        </div>
      </section>

      <!-- Licence and credit: one choice, and the rights. -->
      <section
        v-if="audience === 'public'"
        class="mshare__tile"
        aria-label="Licence and credit"
        data-tid="library-share-licence"
      >
        <header class="mshare__tile-head">
          <frame-icon
            name="shield"
            small
          />
          <h2>Licence and credit</h2>
        </header>
        <label class="mshare__field">
          <select
            v-model="licence"
            aria-label="Licence"
            data-tid="library-share-licence-choose"
          >
            <option
              v-for="l in licences"
              :key="l.id"
              :value="l.id"
            >{{ l.label }}</option>
          </select>
          <span class="mshare__muted">{{ licenceLine }}</span>
        </label>
        <label class="mshare__field">
          <span>Made with AI</span>
          <select
            v-model="ai"
            aria-label="Made with AI"
            data-tid="library-share-ai"
          >
            <option value="no">No</option>
            <option value="partly">Partly</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label
          class="mshare__switch-row"
          data-tid="library-share-rights"
        >
          <input
            v-model="rights"
            type="checkbox"
            role="switch"
            :aria-checked="rights ? 'true' : 'false'"
          >
          <span
            class="mshare__switch"
            aria-hidden="true"
          />
          I made this, or have the right to share it
        </label>
      </section>

      <!-- Who can see it. -->
      <section
        class="mshare__tile"
        aria-label="Who can see it"
        data-tid="library-share-audience"
      >
        <header class="mshare__tile-head">
          <frame-icon
            name="eye"
            small
          />
          <h2>Who can see it</h2>
        </header>
        <div
          class="mlib-seg"
          role="radiogroup"
          aria-label="Who can see it"
          @keydown.left.prevent="step('audience', -1, $event)"
          @keydown.right.prevent="step('audience', 1, $event)"
        >
          <button
            v-for="a in audiences"
            :key="a.id"
            type="button"
            role="radio"
            class="mlib-seg__btn"
            :class="{ 'mlib-seg__btn--on': audience === a.id }"
            :aria-checked="audience === a.id ? 'true' : 'false'"
            :tabindex="audience === a.id ? 0 : -1"
            :data-tid="`library-share-audience-${a.id}`"
            @click="audience = a.id"
          >
            {{ a.label }}
          </button>
        </div>
        <p
          class="mshare__muted"
          data-tid="library-share-audience-line"
        >
          {{ audienceLine }}
        </p>
        <label
          v-if="audience === 'direct'"
          class="mshare__field"
        >
          <span>Handles of the people to share with</span>
          <input
            v-model="handles"
            type="text"
            placeholder="@maker, @another"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            data-tid="library-share-handles"
          >
          <span class="mshare__muted">Exact public handles, separated by commas. Not email addresses.</span>
        </label>
        <p
          v-if="audience === 'direct' || audience === 'link'"
          class="mshare__muted"
          data-tid="library-share-what"
        >
          Shares the project and its picture only. The G-code is not shared. A 3MF keeps its own settings and metadata inside the file, so whoever opens it can see them. It stops working after 7 days, or when you stop sharing.
        </p>
      </section>
    </div>

    <p
      v-if="error"
      class="mshare__error"
      role="alert"
      data-tid="library-share-error"
    >
      {{ error }}
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { describeLibraryError, LibraryError, type LibraryItem } from '@/services/library/api'
import { libraryClient, libraryState } from '@/services/library/store'
import { loadThumbnail, thumbnailFor } from '@/services/library/thumbnails'
import { printFacts, setupLine } from '@/services/library/format'
import { communityApi } from '@/services/account/community'
import { LIBRARY_ORIGIN } from '@/services/account/profile'

/** The categories the model service takes (community-api.md), as Discover's chips name them. */
export const SHARE_CATEGORIES = [
  { id: 'home', label: 'Home' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'tools', label: 'Tools' },
  { id: 'toys-games', label: 'Toys & games' },
  { id: 'spare-parts', label: 'Spare parts' },
  { id: 'art', label: 'Art' },
  { id: 'education', label: 'Education' },
  { id: 'cosplay', label: 'Cosplay' },
  { id: 'other', label: 'Other' }
]

export const SHARE_LICENCES = [
  { id: 'CC-BY-4.0', label: 'CC BY 4.0', line: 'Anyone may print, remix and share, crediting you' },
  { id: 'CC-BY-SA-4.0', label: 'CC BY-SA 4.0', line: 'As CC BY, and remixes are shared the same way' },
  { id: 'CC-BY-NC-4.0', label: 'CC BY-NC 4.0', line: 'As CC BY, but not to sell' },
  { id: 'CC-BY-NC-SA-4.0', label: 'CC BY-NC-SA 4.0', line: 'Not to sell, and remixes are shared the same way' },
  { id: 'CC0-1.0', label: 'CC0 1.0', line: 'Anyone may do anything with it; no credit needed' }
]

/** A tag as the service keeps it: lowercase words joined by dashes. */
export function cleanTag (value: string): string {
  return value.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
}

/**
 * Share a print (Library v3, page 11): one page of tiles instead of a
 * four-step wizard. Files come from Yours, so it arrives ready to print;
 * Details (title, what it is, a category, tags); Licence and credit (one
 * choice and the rights); Who can see it (Everyone goes through review
 * first). Publish is in the header. Not able to publish yet (no public
 * profile, an unconfirmed email) says why and where to fix it.
 */
@Component({})
export default class LibrarySharePage extends Vue {
  /** Your prints, to choose from. */
  @Prop({ type: Array, default: () => [] }) readonly items!: LibraryItem[]
  /** The print to share, when it was chosen already (its page's Share…). */
  @Prop({ type: String, default: '' }) readonly itemId!: string

  chosen = ''
  title = ''
  description = ''
  category = 'other'
  tags: string[] = []
  tag = ''
  licence = 'CC-BY-4.0'
  rights = false
  audience: 'public' | 'private' | 'direct' | 'link' = 'public'
  handles = ''
  linkShare: { url: string } | null = null
  linkNote = ''
  ai: 'no' | 'partly' | 'yes' = 'no'
  busy = false
  error = ''
  done: { title: string, direct?: string[], failed?: string[] } | null = null
  setup: { title: string, text: string, action?: string, to?: string } | null = null
  categories = SHARE_CATEGORIES
  licences = SHARE_LICENCES
  audiences: Array<{ id: 'public' | 'private' | 'direct' | 'link', label: string }> = [
    { id: 'private', label: 'Only me' },
    { id: 'public', label: 'Everyone' },
    { id: 'direct', label: 'People you choose' },
    { id: 'link', label: 'Anyone with the link' }
  ]

  get audienceLine (): string {
    switch (this.audience) {
      case 'public': return 'Everyone: it is reviewed first, then shows in Discover, usually within a day.'
      case 'direct': return 'People you choose: only the handles you name can open it.'
      case 'link': return 'Anyone with the link: whoever has the link can open it. You get the link once.'
      default: return 'Only you: it stays in Yours, and nobody else sees it.'
    }
  }

  /** The handles typed: lowercase, no @, no repeats. */
  get handleList (): string[] {
    return [...new Set(this.handles.split(/[\s,;]+/).map(h => h.trim().replace(/^@/, '').toLowerCase()).filter(Boolean))]
  }

  created () {
    this.checkProfile()
  }

  /** The print the address names (its page's Share…), followed if it changes. */
  @Watch('itemId', { immediate: true })
  onItemId (id: string) {
    this.chosen = id
  }

  /**
   * Publishing needs a public profile the server will show (community/guard.rs:
   * a handle, can_community, can_public, a public identity and the page on):
   * asked first, so the page says so before anything is filled in.
   */
  async checkProfile () {
    try {
      const p = await communityApi.profile()
      if (!p.handle || !p.can_community || !p.can_public || !p.identity_public || !p.page_on) this.setup = SETUP
    } catch (error) {
      if (error instanceof LibraryError && error.code === 'community_setup_required') this.setup = SETUP
      // Anything else: Publish says what went wrong, if it does.
    }
  }

  /** Set up elsewhere, then back: look again. */
  checkAgain () {
    this.setup = null
    this.error = ''
    this.checkProfile()
  }

  /** Your own work only: a print imported or remixed from someone else's is theirs to share. */
  shareable (item: LibraryItem): boolean {
    return !!item.versioned && item.state !== 'deleted' && !item.deleted_at && item.origin !== 'import' && item.origin !== 'remix'
  }

  notShareableWhy (item: LibraryItem): string {
    if (item.origin === 'import' || item.origin === 'remix') return 'This print came from someone else\'s. Share your own prints here; a remix is shared from its page on library.muon3d.com, crediting the original.'
    return 'This one can\'t be shared: it isn\'t a print saved from Slice. Choose another one.'
  }

  get printable (): LibraryItem[] {
    return this.items.filter(i => this.shareable(i))
  }

  /** Your prints have been read (the synced Library), so a missing one is really missing. */
  get itemsReady (): boolean {
    return libraryState.synced
  }

  get item (): LibraryItem | null {
    return this.items.find(i => i.id === this.chosen) ?? null
  }

  /** What Publish still needs, said beside it. */
  get needs (): string {
    if (this.busy || this.audience === 'private') return ''
    if (!this.item || !this.shareable(this.item)) return 'Choose one of your prints.'
    if (this.audience === 'direct' || this.audience === 'link') {
      if (!this.title.trim()) return 'Give it a title.'
      if (this.item.version == null) return 'It needs a saved version: save it from Slice.'
      if (this.audience === 'direct') {
        if (!this.handleList.length) return 'Type at least one handle.'
        const bad = this.handleList.find(h => !HANDLE.test(h))
        if (bad) return `"${bad}" isn't a handle: 3 to 24 letters, numbers, dots or underscores, starting with a letter.`
        if (this.handleList.length > 10) return 'Share with up to 10 people at a time.'
      }
      return ''
    }
    if (!this.gcode) return 'It needs a G-code: slice it first.'
    if (!this.title.trim()) return 'Give it a title.'
    if (this.item.version == null) return 'It needs a saved version: save it from Slice.'
    if (!this.rights) return 'Confirm you made it, or may share it.'
    return ''
  }

  /** Arrow keys in a radio group: the next choice, and focus with it. */
  step (group: 'category' | 'audience', by: number, event: KeyboardEvent) {
    const ids = group === 'category' ? this.categories.map(c => c.id) : this.audiences.map(a => a.id)
    const now = ids.indexOf(group === 'category' ? this.category : this.audience)
    const next = ids[(now + by + ids.length) % ids.length]
    if (group === 'category') this.category = next
    else this.audience = next as 'public' | 'private' | 'direct' | 'link'
    this.$nextTick(() => {
      const box = (event.currentTarget as HTMLElement | null)
      ;(box?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus()
    })
  }

  /** The print's name the title was filled in from (a title typed since is kept). */
  titleFrom = ''

  @Watch('item', { immediate: true })
  onItem (item: LibraryItem | null) {
    if (!item) return
    loadThumbnail(item)
    // Another print: its name as the title, unless one was typed.
    if (!this.title.trim() || this.title === this.titleFrom) {
      this.title = item.name
      this.titleFrom = item.name
    }
  }

  get picture (): string | null {
    return this.item ? thumbnailFor(this.item) : null
  }

  get gcode (): boolean {
    return (this.item?.setups?.length ?? 0) > 0
  }

  get forM1 (): boolean {
    return !!this.item?.setups?.some(s => /\bM1\b/i.test(s.printer_model))
  }

  /** "From Yours: G-code for M1 · 0.4 · PETG · 1h 45m · 37 g". */
  get fileLine (): string {
    const setup = this.item?.setups?.[0]
    if (!setup) return 'From Yours: no G-code yet'
    return `From Yours: G-code for ${[setupLine(setup), printFacts(setup)].filter(Boolean).join(' · ')}`
  }

  get licenceLine (): string {
    return this.licences.find(l => l.id === this.licence)?.line ?? ''
  }

  addTag () {
    const t = cleanTag(this.tag)
    this.tag = ''
    if (t && !this.tags.includes(t) && this.tags.length < 10) this.tags = [...this.tags, t]
  }

  get canPublish (): boolean {
    if (this.busy || !this.item || this.setup || !this.shareable(this.item)) return false
    if (this.audience === 'private') return true
    if (this.audience === 'direct' || this.audience === 'link') return !this.needs
    return this.gcode && !!this.title.trim() && this.rights && this.item.version != null
  }

  /** People you choose (one share per handle) or a link (its key comes back once). */
  async shareWith (item: LibraryItem) {
    this.busy = true
    this.error = ''
    try {
      const now = await libraryClient().item(item.id)
      if (!this.shareable(now)) throw new Error('This print cannot be shared now: it is no longer one of your own prints.')
      if (now.version == null) throw new Error('This print has no saved version now. Save it from Slice, then share it.')
      const title = this.title.trim()
      if (this.audience === 'link') {
        const share = await libraryClient().share({ item: item.id, version: now.version, title, audience: 'link' })
        if (!share.key) throw new Error('The Library made the link but sent no key. Stop sharing it from Yours and try again.')
        // The key stays in the fragment: it is never sent to a server when the link is opened.
        this.linkShare = { url: shareLinkUrl(share.id, share.key) }
        this.$emit('published', share.id)
        return
      }
      const sent: string[] = []
      const failed: string[] = []
      for (const handle of this.handleList) {
        try {
          const share = await libraryClient().share({ item: item.id, version: now.version, title, audience: 'direct', recipient: handle })
          sent.push(handle)
          this.$emit('published', share.id)
        } catch (error) {
          if (error instanceof LibraryError && error.code === 'community_setup_required') { this.setup = SETUP; return }
          if (error instanceof LibraryError && error.code === 'email_unverified') { this.setup = EMAIL; return }
          failed.push(shareRefusal(error, handle))
        }
      }
      if (sent.length) this.done = { title, direct: sent, failed }
      else this.error = failed.join(' ')
    } catch (error) {
      if (error instanceof LibraryError && error.code === 'community_setup_required') this.setup = SETUP
      else if (error instanceof LibraryError && error.code === 'email_unverified') this.setup = EMAIL
      else this.error = shareRefusal(error)
    } finally {
      this.busy = false
    }
  }

  /** Copy the link; where the browser won't, say so and leave it selectable. */
  async copyLink () {
    if (!this.linkShare) return
    try {
      await navigator.clipboard.writeText(this.linkShare.url)
      this.linkNote = 'Link copied.'
    } catch {
      this.linkNote = 'Copying was blocked. Select the link above and copy it yourself.'
    }
  }

  async publish () {
    const item = this.item
    if (!item || !this.canPublish) return
    // Only me: nothing to send; it stays in Yours.
    if (this.audience === 'private') {
      this.$emit('back')
      return
    }
    if (this.audience === 'direct' || this.audience === 'link') {
      await this.shareWith(item)
      return
    }
    this.addTag()
    this.busy = true
    this.error = ''
    try {
      // The version as the Library has it now (another device may have saved a newer one since).
      const now = await libraryClient().item(item.id)
      if (!this.shareable(now)) throw new Error('This print cannot be shared now: it is no longer one of your own prints.')
      if (now.version == null || !(now.setups?.length)) throw new Error('This print has no G-code now. Slice it, save it, then share it.')
      const share = await libraryClient().publish(item.id, {
        version: now.version,
        title: this.title.trim(),
        publication: {
          licence: this.licence,
          rights_confirmed: true,
          category: this.category,
          tags: this.tags,
          ...(this.description.trim() ? { description: this.description.trim() } : {}),
          ai_generated: this.ai
        }
      })
      this.done = { title: share.title || this.title.trim() }
      this.$emit('published', share.id)
    } catch (error) {
      if (error instanceof LibraryError && error.code === 'community_setup_required') this.setup = SETUP
      else if (error instanceof LibraryError && error.code === 'email_unverified') this.setup = EMAIL
      else this.error = describeLibraryError(error)
    } finally {
      this.busy = false
    }
  }
}

/** What a person reads when the service refuses a share, in plain words. */
export function shareRefusal (error: unknown, handle = ''): string {
  if (error instanceof LibraryError) {
    const who = handle ? `@${handle}` : 'that person'
    const text = `${error.code} ${error.message}`.toLowerCase()
    if (error.status === 429 || text.includes('rate') || text.includes('too many') || text.includes('limit')) return 'You have shared a lot just now, or have too many shares open. Wait a while, or stop sharing something, then try again.'
    if (text.includes('block')) return `${who} can't be shared with.`
    if (error.status === 404 || text.includes('recipient') || text.includes('handle') || text.includes('not_found')) return handle ? `No one has the handle @${handle}. Check the spelling.` : 'That print or person was not found.'
  }
  return describeLibraryError(error)
}

/** A link share: the key rides in the fragment, which browsers never send to a server. */
export function shareLinkUrl (id: string, key: string): string {
  return `${LIBRARY_ORIGIN}/s/${encodeURIComponent(id)}#${encodeURIComponent(key)}`
}

const HANDLE = /^[a-z][a-z0-9._]{2,23}$/

const SETUP = {
  title: 'Set up your public profile first',
  text: 'Prints in Discover show who shared them. Choose your public name and handle, then come back to share.',
  action: 'Set up your profile',
  to: '/account/profile'
}

const EMAIL = {
  title: 'Confirm your email first',
  text: 'Sharing a print with everyone needs a confirmed email. Open the link we sent you, then try again.',
  action: 'Your account',
  to: '/account/profile'
}
</script>

<style lang="scss" scoped>
  .mshare {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .mshare__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .mshare__titles h1 {
    margin: 2px 0 0;
    font-size: 28px;
    font-weight: 700;
  }

  .mshare__back {
    padding: 0;
    border: 0;
    background: none;
    color: var(--mlib-link);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  .mshare__muted {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .mshare__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .mshare__grid { grid-template-columns: minmax(0, 1fr); }
  }

  .mshare__tile {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding: 16px;
    border-radius: 18px;
    background: var(--m3d-surface-2);

    input[type='text'],
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: 12px;
      background: var(--m3d-surface-3, rgba(255, 255, 255, 0.05));
      color: var(--m3d-text);
      font: inherit;
    }

    textarea { resize: vertical; }
  }

  .mshare__tile-head {
    display: flex;
    align-items: center;
    gap: 8px;

    h2 { margin: 0; font-size: 16px; font-weight: 700; }
  }

  .mshare__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mshare__file {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    background: var(--m3d-surface-3, rgba(255, 255, 255, 0.05));
  }

  .mshare__thumb {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border-radius: 10px;
    background: var(--m3d-surface-2);

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  .mshare__file-text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;

    span { color: var(--m3d-text-muted); font-size: 12px; }
  }

  .mshare__tag {
    width: 110px !important;
    padding: 6px 10px !important;
    border-radius: 999px !important;
  }

  .mshare__x {
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  .mshare__switch-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    cursor: pointer;

    input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
    }

    input:focus-visible + .mshare__switch { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
  }

  .mshare__switch {
    position: relative;
    flex: none;
    width: 40px;
    height: 24px;
    border-radius: 12px;
    background: var(--m3d-border-strong);

    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.15s;
    }
  }

  input:checked + .mshare__switch {
    background: var(--m3d-success);

    &::after { transform: translateX(16px); }
  }

  // The switch's slide is decoration: off for anyone who asked for less motion.
  @media (prefers-reduced-motion: reduce) {
    .mshare__switch::after { transition: none; }
  }

  .mshare__warn { margin: 0; color: color-mix(in srgb, var(--m3d-warning) 60%, var(--m3d-text)); font-size: 13px; }
  .mshare__error { margin: 0; color: var(--m3d-danger); }

  .mshare__state {
    max-width: 560px;
    width: 100%;
    margin: 24px auto 0;
  }
</style>
