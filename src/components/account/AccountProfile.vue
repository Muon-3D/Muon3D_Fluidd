<template>
  <div
    class="acct-section profile"
    data-tid="account-profile"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <h1>Profile</h1>
        <p>One account, one public profile. The same everywhere: Control, the Library and the app.</p>
      </div>
      <a
        v-if="livePage"
        class="lib-btn lib-btn--sm"
        :href="livePage"
        target="_blank"
        rel="noopener"
        data-tid="profile-view-page"
      >View your public page ↗</a>
    </div>

    <section
      v-if="loading"
      class="lib-empty lib-surface"
      data-tid="profile-loading"
    >
      <p>Reading your profile…</p>
    </section>

    <section
      v-else-if="failed"
      class="lib-empty lib-surface"
      role="alert"
      data-tid="profile-error"
    >
      <h2>Your profile can't be loaded</h2>
      <p>{{ failed }}</p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="profile-retry"
          @click="load"
        >
          Try again
        </button>
      </div>
    </section>

    <template v-else>
      <!-- The header tile: as others see you. -->
      <section
        class="lib-surface acct-card acct-card--pad profile__tile"
        aria-label="Your profile"
        data-tid="profile-tile"
      >
        <span class="profile__big">
          <profile-avatar
            :photo="photoUrl"
            :letter="initials"
            size="xl"
            data-tid="profile-tile-photo"
          />
          <button
            type="button"
            class="profile__cam"
            aria-label="Change photo"
            :disabled="!canEditPage || busy === 'photo'"
            data-tid="profile-tile-camera"
            @click="choosePhoto"
          >
            <frame-icon
              name="camera2"
              small
            />
          </button>
        </span>
        <div class="profile__who">
          <b
            class="profile__name"
            data-tid="profile-tile-name"
          >{{ displayName }}</b>
          <span
            class="profile__addr"
            data-tid="profile-tile-address"
          >
            <template v-if="handle">@{{ handle }} · {{ address }}</template>
            <template v-else>No username yet</template>
          </span>
          <span class="profile__pills">
            <span
              class="lib-pill"
              :class="identity && identity.identity_public ? 'lib-pill--ok' : ''"
              data-tid="profile-tile-visibility"
            >{{ identity && identity.identity_public ? 'Public' : 'Private' }}</span>
            <span
              v-if="since"
              class="lib-pill"
              data-tid="profile-tile-since"
            >Maker since {{ since }}</span>
            <span
              v-if="updating"
              class="lib-pill lib-pill--run"
              role="status"
              data-tid="profile-updating"
            >Updating the Library…</span>
          </span>
        </div>
      </section>

      <p
        v-if="libraryError"
        class="acct-error"
        role="alert"
        data-tid="profile-library-error"
      >
        {{ libraryError }}
      </p>

      <!-- Your public profile. -->
      <section
        class="lib-surface acct-card"
        aria-label="Your public profile"
      >
        <div class="acct-card__title">
          <h2>Your public profile</h2>
        </div>
        <div class="acct-list">
          <!-- Photo -->
          <div
            class="acct-row"
            data-tid="profile-row-photo"
          >
            <div class="acct-row__label">
              <b>Photo <span
                v-if="review.photo"
                class="lib-pill lib-pill--warn"
                data-tid="profile-photo-review"
              >Being checked</span></b>
              <span>Shown beside your name everywhere. Square, at least 256 px.</span>
              <span
                v-if="rowError.photo"
                class="acct-error"
                role="alert"
                data-tid="profile-photo-error"
              >{{ rowError.photo }}</span>
            </div>
            <div class="acct-row__control">
              <profile-avatar
                :photo="photoUrl"
                :letter="initials"
                size="lg"
              />
              <input
                ref="photoInput"
                type="file"
                class="profile__file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Choose a photo"
                tabindex="-1"
                data-tid="profile-photo-input"
                @change="uploadPhoto"
              >
              <button
                type="button"
                class="lib-btn lib-btn--sm"
                :disabled="!canEditPage || busy === 'photo'"
                data-tid="profile-photo-change"
                @click="choosePhoto"
              >
                {{ busy === 'photo' ? 'Saving…' : 'Change' }}
              </button>
              <button
                v-if="photoRemove && hasPhoto"
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                :disabled="busy === 'photo'"
                data-tid="profile-photo-remove"
                @click="removePhoto"
              >
                Remove
              </button>
            </div>
          </div>

          <!-- Name -->
          <div
            class="acct-row profile__edit-row"
            data-tid="profile-row-name"
          >
            <div class="acct-row__label">
              <b>Name <span
                v-if="review.name"
                class="lib-pill lib-pill--warn"
                data-tid="profile-name-review"
              >Being checked</span></b>
              <span>What people see: on your makes, in shared printers, in the app.</span>
              <span
                v-if="fromEmail && editing !== 'name'"
                class="profile__warn"
                data-tid="account-name-from-email"
              >Made from your email. Change it to a name you're happy to show.</span>
            </div>
            <div
              v-if="editing !== 'name'"
              class="acct-row__control"
            >
              <span
                class="profile__value"
                data-tid="profile-name-value"
              >{{ currentName }}</span>
              <button
                type="button"
                class="lib-btn lib-btn--sm"
                data-tid="profile-name-change"
                @click="edit('name')"
              >
                Change
              </button>
            </div>
            <form
              v-else
              class="profile__editor"
              @submit.prevent="saveName"
            >
              <span class="lib-field">
                <input
                  v-model="nameDraft"
                  type="text"
                  maxlength="64"
                  autocomplete="name"
                  aria-label="Name"
                  data-tid="account-name"
                >
              </span>
              <span class="profile__editor-acts">
                <button
                  type="button"
                  class="lib-btn lib-btn--sm lib-btn--ghost"
                  data-tid="account-name-cancel"
                  @click="stopEditing"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="lib-btn lib-btn--sm lib-btn--pri"
                  :disabled="!nameChanged || busy === 'name'"
                  data-tid="account-name-save"
                >
                  {{ busy === 'name' ? 'Saving…' : 'Save' }}
                </button>
              </span>
            </form>
            <span
              v-if="rowError.name"
              class="acct-error profile__row-error"
              role="alert"
              data-tid="profile-name-error"
            >{{ rowError.name }}</span>
          </div>

          <!-- Username -->
          <div
            class="acct-row profile__edit-row"
            data-tid="profile-row-username"
          >
            <div class="acct-row__label">
              <b>Username</b>
              <span>Your page address. Change it once every 30 days; old links keep working.</span>
              <span
                v-if="canEditPage === false && !libraryError"
                data-tid="profile-username-needs-age"
              >Confirm your age under Private to you to choose one.</span>
            </div>
            <div class="acct-row__control">
              <span
                class="profile__value"
                data-tid="profile-username-value"
              >{{ handle ? `@${handle}` : 'Not set' }}</span>
              <button
                type="button"
                class="lib-btn lib-btn--sm"
                :disabled="!canEditPage"
                data-tid="profile-username-change"
                @click="openUsername"
              >
                {{ handle ? 'Change' : 'Choose' }}
              </button>
            </div>
          </div>

          <!-- About you -->
          <div
            class="acct-row profile__edit-row"
            data-tid="profile-row-about"
          >
            <div class="acct-row__label">
              <b>About you</b>
              <span>A line or two on your public page.</span>
            </div>
            <div
              v-if="editing !== 'about'"
              class="acct-row__control"
            >
              <span
                class="profile__value"
                data-tid="profile-about-value"
              >{{ about || 'Nothing yet' }}</span>
              <button
                type="button"
                class="lib-btn lib-btn--sm"
                :disabled="!canEditPage"
                data-tid="profile-about-change"
                @click="edit('about')"
              >
                Change
              </button>
            </div>
            <form
              v-else
              class="profile__editor"
              @submit.prevent="saveAbout"
            >
              <span class="lib-field">
                <textarea
                  v-model="aboutDraft"
                  rows="2"
                  maxlength="160"
                  aria-label="About you"
                  data-tid="profile-about-input"
                />
              </span>
              <span class="profile__editor-acts">
                <span class="acct-subtle">{{ aboutDraft.length }}/160</span>
                <button
                  type="button"
                  class="lib-btn lib-btn--sm lib-btn--ghost"
                  @click="stopEditing"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="lib-btn lib-btn--sm lib-btn--pri"
                  :disabled="aboutDraft.trim() === about || busy === 'about'"
                  data-tid="profile-about-save"
                >
                  {{ busy === 'about' ? 'Saving…' : 'Save' }}
                </button>
              </span>
            </form>
            <span
              v-if="rowError.about"
              class="acct-error profile__row-error"
              role="alert"
              data-tid="profile-about-error"
            >{{ rowError.about }}</span>
          </div>

          <!-- Who can see it -->
          <div
            class="acct-row profile__edit-row"
            data-tid="profile-row-visibility"
          >
            <div class="acct-row__label">
              <b>Who can see it</b>
              <span>Private: on your makes you show as "a maker", and your page is hidden. People you share a printer with still see your name.</span>
              <span
                v-if="missing"
                class="profile__warn"
                role="status"
                data-tid="profile-public-missing"
              >{{ missing }}</span>
              <span
                v-if="rowError.visibility"
                class="acct-error"
                role="alert"
                data-tid="profile-visibility-error"
              >{{ rowError.visibility }}</span>
            </div>
            <div
              class="profile__seg"
              role="group"
              aria-label="Who can see it"
            >
              <button
                type="button"
                class="profile__seg-btn"
                :class="{ 'profile__seg-btn--on': choice === 'public' }"
                :aria-pressed="choice === 'public' ? 'true' : 'false'"
                :disabled="busy === 'visibility'"
                data-tid="profile-public"
                @click="choose(true)"
              >
                Public
              </button>
              <button
                type="button"
                class="profile__seg-btn"
                :class="{ 'profile__seg-btn--on': choice === 'private' }"
                :aria-pressed="choice === 'private' ? 'true' : 'false'"
                :disabled="busy === 'visibility'"
                data-tid="profile-private"
                @click="choose(false)"
              >
                Private
              </button>
            </div>
          </div>
        </div>

        <!-- Change your username: the sheet. -->
        <div
          v-if="editing === 'username'"
          class="profile__sheet"
          role="dialog"
          aria-label="Change your username"
          data-tid="profile-username-sheet"
        >
          <b>Change your username</b>
          <form
            class="profile__sheet-form"
            @submit.prevent="saveUsername"
          >
            <span class="lib-field profile__handle">
              <span class="profile__at">@</span>
              <input
                v-model="handleDraft"
                type="text"
                maxlength="25"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                aria-label="Username"
                :disabled="!!cooldown"
                data-tid="community-handle"
                @input="checkHandle"
              >
              <span
                class="profile__avail"
                :class="`profile__avail--${availability.kind}`"
                role="status"
                data-tid="profile-handle-status"
              >{{ availability.text }}</span>
            </span>
            <span
              v-if="cooldown"
              class="profile__warn"
              data-tid="profile-handle-cooldown"
            >Available again on {{ cooldown }}.</span>
            <span
              v-else-if="handleNote"
              class="acct-subtle"
              data-tid="profile-handle-note"
            >{{ handleNote }}</span>
            <span
              v-if="rowError.username"
              class="acct-error"
              role="alert"
              data-tid="profile-username-error"
            >{{ rowError.username }}</span>
            <span class="profile__editor-acts">
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                data-tid="community-cancel"
                @click="stopEditing"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="lib-btn lib-btn--sm lib-btn--pri"
                :disabled="!canClaim"
                data-tid="community-claim"
              >
                {{ busy === 'username' ? 'Saving…' : 'Save username' }}
              </button>
            </span>
          </form>
        </div>
      </section>

      <!-- How others see you. -->
      <section
        class="lib-surface acct-card"
        aria-label="How others see you"
      >
        <div class="acct-card__title">
          <h2>How others see you</h2>
        </div>
        <profile-previews
          :name="displayName"
          :handle="handle"
          :photo="photoUrl"
          :letter="initials"
          :is-public="!!identity && identity.identity_public"
        />
      </section>

      <!-- Private to you. -->
      <section
        class="lib-surface acct-card"
        aria-label="Private to you"
      >
        <div class="acct-card__title">
          <h2>Private to you</h2>
        </div>
        <div class="acct-list">
          <div
            class="acct-row"
            data-tid="profile-row-email"
          >
            <div class="acct-row__label">
              <b>Email</b>
              <span>Never public. Changed in <router-link
                :to="securityLink"
                data-tid="profile-email-link"
              >Sign-in and security</router-link>.</span>
            </div>
            <span
              class="profile__value"
              data-tid="profile-email"
            >{{ email }}</span>
          </div>

          <div
            class="acct-row profile__edit-row"
            data-tid="profile-row-age"
          >
            <div class="acct-row__label">
              <b>Age</b>
              <span>Confirmed once, for the Library's rules. Never shown on your profile. Accounts require age 13 or over.</span>
            </div>
            <span
              v-if="identity && identity.declared_age !== null"
              class="profile__value"
              data-tid="profile-age"
            >{{ ageLine }}</span>
            <form
              v-else
              class="profile__editor"
              @submit.prevent="confirmAge"
            >
              <span class="lib-field">
                <input
                  v-model="age"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="Your age"
                  :aria-invalid="ageError ? 'true' : undefined"
                  data-tid="community-age"
                  @blur="ageTouched = true"
                >
              </span>
              <span
                v-if="ageError"
                class="acct-error"
                role="alert"
                data-tid="profile-age-error"
              >{{ ageError }}</span>
              <span class="profile__editor-acts">
                <button
                  type="submit"
                  class="lib-btn lib-btn--sm lib-btn--pri"
                  :disabled="!validAge || busy === 'age'"
                  data-tid="community-confirm-age"
                >
                  Confirm age
                </button>
              </span>
            </form>
          </div>
        </div>
      </section>

      <p
        v-if="saved"
        class="acct-subtle profile__saved"
        role="status"
        data-tid="profile-saved"
      >
        Saved
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ProfileAvatar from './profile/ProfileAvatar.vue'
import { forgetOwnAvatar, loadOwnAvatar, ownAvatar, removeOwnAvatar, setOwnAvatar } from '@/services/account/avatar'
import ProfilePreviews from './profile/ProfilePreviews.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { storedToken } from '@/services/muon-cloud/api'
import { accountState, describe, loadMe, renameAccount } from '@/services/account/state'
import { communityApi, type CommunityIdentity, type CommunityProfile } from '@/services/account/community'
import { initialsOf } from '@/services/account/model'
import {
  HANDLE_COOLDOWN_DAYS, ageText, cleanHandle, handleChangeableAt, handleProblem, handleStatusText, libraryUpdating, longDay, makerSince,
  missingForPublic, pageAddress, pageUrl, photoProblem, photoRefusal, photoRemoveEnabled, underReview, type PendingChange
} from '@/services/account/profile'
import { LibraryError } from '@/services/library/api'

type Busy = '' | 'name' | 'about' | 'photo' | 'visibility' | 'username' | 'age'
type Editing = '' | 'name' | 'about' | 'username'

/**
 * Account › Profile (Control v3, one identity): the one place to edit the
 * photo, name, @username, about and who can see it, and the age. Each field
 * is written where it lives: name, privacy and age to the console;
 * username, photo and about to the Library (model) service. No data moves.
 */
@Component({ components: { ProfileAvatar, ProfilePreviews } })
export default class AccountProfile extends Vue {
  @Prop({ type: Function, default: null }) readonly linkTo!: ((id: 'security') => string) | null

  identity: CommunityIdentity | null = null
  profile: CommunityProfile | null = null
  loading = true
  /** The console, or the whole page, could not be read. */
  failed = ''
  /** The Library could not be read: the public rows wait. */
  libraryError = ''
  busy: Busy = ''
  editing: Editing = ''
  nameDraft = ''
  aboutDraft = ''
  handleDraft = ''
  age = ''
  ageTouched = false
  rowError: Record<string, string> = {}
  saved = false
  /** Public was pressed, and it cannot be yet: the row says why instead of asking the console. */
  blockedPublic = false
  availability: { kind: 'idle' | 'checking' | 'free' | 'bad'; text: string } = { kind: 'idle', text: '' }
  handleNote = ''
  pending: PendingChange | null = null
  now = Date.now()
  private checkSeq = 0
  private checkTimer: ReturnType<typeof setTimeout> | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private generation = 0

  created () {
    this.load()
  }

  beforeDestroy () {
    this.generation++
    this.stopPolling()
    if (this.checkTimer) clearTimeout(this.checkTimer)
  }

  // ---- what the console and the Library say -------------------------------

  get account () {
    return accountState.me?.account ?? null
  }

  get currentName (): string {
    return this.account?.name ?? cloudState.account?.name ?? ''
  }

  get displayName (): string {
    return this.currentName || 'Your name'
  }

  get initials (): string {
    return initialsOf(this.currentName, cloudState.account?.email)
  }

  get email (): string {
    return this.account?.email ?? cloudState.account?.email ?? ''
  }

  get handle (): string | null {
    return this.profile?.handle ?? null
  }

  get address (): string {
    return this.handle ? pageAddress(this.handle) : ''
  }

  get about (): string {
    return (this.profile?.bio ?? '').trim()
  }

  get since (): string | null {
    return makerSince(this.account?.created_at)
  }

  get hasPhoto (): boolean {
    return !!this.photoUrl
  }

  get photoRemove (): boolean {
    return photoRemoveEnabled()
  }

  get review () {
    return underReview(this.profile)
  }

  /** The Library part (username, photo, about) works once the age is confirmed. */
  get canEditPage (): boolean {
    return !!this.profile && !this.libraryError
  }

  get fromEmail (): boolean {
    const me = this.account
    if (me?.name_source) return me.name_source === 'email'
    const email = cloudState.account?.email ?? ''
    return !!email && this.currentName === email.split('@')[0]
  }

  get nameChanged (): boolean {
    const draft = this.nameDraft.trim()
    return draft.length > 0 && draft !== this.currentName
  }

  get choice (): 'public' | 'private' {
    return this.blockedPublic || this.identity?.identity_public ? 'public' : 'private'
  }

  get missing (): string | null {
    if (this.choice !== 'public') return null
    return missingForPublic(this.identity, this.profile)
  }

  /** The public page, linked by handle, once nothing stops it. */
  get livePage (): string {
    if (!this.handle || !this.identity?.identity_public || this.missing) return ''
    return pageUrl(this.handle)
  }

  get updating (): boolean {
    return libraryUpdating(this.pending, this.profile, this.now)
  }

  get ageLine (): string {
    return ageText(this.identity?.declared_age) ?? ''
  }

  get validAge (): boolean {
    return /^\d+$/.test(this.age) && Number(this.age) >= 13 && Number(this.age) <= 120
  }

  get ageError (): string {
    if (!this.ageTouched || !this.age) return ''
    return !/^\d+$/.test(this.age) ? 'Enter your age as a whole number.' : this.validAge ? '' : 'Age must be between 13 and 120.'
  }

  get securityLink (): string {
    return this.linkTo ? this.linkTo('security') : '/account/security'
  }

  get cooldown (): string {
    const at = handleChangeableAt(this.profile?.handle_changed_at, this.now)
    return at === null ? '' : longDay(at)
  }

  get canClaim (): boolean {
    return !this.cooldown && this.busy !== 'username' && this.availability.kind === 'free' && cleanHandle(this.handleDraft) !== (this.handle ?? '')
  }

  // ---- loading ------------------------------------------------------------

  @Watch('session')
  onSession () {
    // Another account, or none: nothing of the last one stays (edits, drafts, polls, notices).
    this.generation++
    forgetOwnAvatar()
    this.stopPolling()
    if (this.checkTimer) clearTimeout(this.checkTimer)
    this.checkSeq++
    this.identity = null
    this.profile = null
    this.editing = ''
    this.nameDraft = ''
    this.aboutDraft = ''
    this.handleDraft = ''
    this.age = ''
    this.ageTouched = false
    this.rowError = {}
    this.saved = false
    this.blockedPublic = false
    this.pending = null
    this.busy = ''
    this.failed = ''
    this.libraryError = ''
    this.availability = { kind: 'idle', text: '' }
    this.handleNote = ''
    if (this.session) this.load()
  }

  get session (): string {
    return cloudState.account?.id ?? ''
  }

  async load () {
    const mine = ++this.generation
    const token = storedToken()
    this.loading = !this.identity
    this.failed = ''
    this.libraryError = ''
    try {
      const [identity] = await Promise.all([communityApi.identity(), loadMe().catch(() => null)])
      if (mine !== this.generation) return
      this.identity = identity
      if (identity.declared_age !== null && identity.can_community) {
        try {
          const profile = await communityApi.profile()
          if (mine !== this.generation || token !== storedToken()) return
          this.setProfile(profile)
          this.loadPhoto()
        } catch (error) {
          if (mine === this.generation) this.libraryError = (error as Error).message
        }
      } else {
        this.profile = null
      }
    } catch (error) {
      if (mine === this.generation) this.failed = describe(error)
    } finally {
      if (mine === this.generation) this.loading = false
    }
  }

  setProfile (profile: CommunityProfile) {
    this.profile = profile
    if (profile.identity_public || this.identity?.can_public) this.blockedPublic = false
    if (!this.updating) this.stopPolling()
  }

  /**
   * Your own photo comes from the authenticated GET /v1/community/profile/avatar,
   * never from avatar_url (the public route, which 404s while the page is not
   * visible). No photo, or the Library unreachable: the initials stand in.
   */
  async loadPhoto () {
    // Shared with the top bar: one fetch, and a change here shows there at once.
    await loadOwnAvatar(true)
  }

  get photoUrl (): string | null {
    return ownAvatar.url
  }

  // ---- "Updating the Library…" --------------------------------------------

  startPolling (change: PendingChange) {
    this.pending = { ...this.pending, ...change, since: Date.now() }
    this.now = Date.now()
    this.stopPolling()
    this.pollTimer = setInterval(() => this.poll(), 3000)
  }

  stopPolling () {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = null
  }

  async poll () {
    this.now = Date.now()
    try {
      const profile = await communityApi.profile()
      this.now = Date.now()
      this.profile = profile
    } catch {
      // Try again at the next beat; the 2 minutes still end it.
    }
    if (!this.updating) {
      this.stopPolling()
      this.pending = null
    }
  }

  // ---- editing ------------------------------------------------------------

  edit (what: 'name' | 'about') {
    this.editing = what
    this.rowError = {}
    this.saved = false
    if (what === 'name') this.nameDraft = this.currentName
    else this.aboutDraft = this.about
  }

  stopEditing () {
    this.editing = ''
    this.rowError = {}
    this.availability = { kind: 'idle', text: '' }
  }

  fail (row: string, error: unknown) {
    this.rowError = { ...this.rowError, [row]: describe(error) }
  }

  succeeded () {
    this.saved = true
    this.$emit('saved')
  }

  async saveName () {
    if (!this.nameChanged || this.busy) return
    this.busy = 'name'
    this.rowError = {}
    try {
      const name = this.nameDraft.trim()
      await renameAccount(name)
      this.editing = ''
      // The Library keeps a copy of the name that arrives within about 2 minutes.
      if (this.profile) this.startPolling({ name, since: 0 })
      this.succeeded()
    } catch (error) {
      this.fail('name', error)
    } finally {
      this.busy = ''
    }
  }

  async saveAbout () {
    if (this.busy) return
    this.busy = 'about'
    this.rowError = {}
    try {
      this.setProfile(await communityApi.saveAbout(this.aboutDraft.trim()))
      this.editing = ''
      this.succeeded()
    } catch (error) {
      this.fail('about', error)
    } finally {
      this.busy = ''
    }
  }

  async choose (makePublic: boolean) {
    if (this.busy) return
    this.rowError = {}
    this.saved = false
    if (makePublic && this.identity && (!this.identity.can_public || this.identity.declared_age === null)) {
      // The console would refuse: say what is missing instead.
      this.blockedPublic = true
      return
    }
    this.blockedPublic = false
    if (!this.identity || makePublic === this.identity.identity_public) return
    this.busy = 'visibility'
    try {
      this.identity = await communityApi.saveIdentity({ identity_public: makePublic })
      if (this.profile) this.startPolling({ identityPublic: makePublic, since: 0 })
      // The model service decides whether the page comes back (page_on); read what it says.
      if (this.profile) {
        try { this.setProfile(await communityApi.profile()) } catch { /* the poll tries again */ }
      }
      this.succeeded()
    } catch (error) {
      this.fail('visibility', error)
    } finally {
      this.busy = ''
    }
  }

  async confirmAge () {
    this.ageTouched = true
    if (!this.validAge || this.busy) return
    this.busy = 'age'
    this.rowError = {}
    try {
      this.identity = await communityApi.saveIdentity({ declared_age: Number(this.age) })
    } catch (error) {
      // Another tab got there first (409): read what is there now.
      if ((error as { status?: number }).status !== 409) this.fail('age', error)
    } finally {
      this.busy = ''
    }
    if (this.identity?.declared_age !== null) {
      await this.load()
      this.succeeded()
    }
  }

  // ---- photo --------------------------------------------------------------

  choosePhoto () {
    const input = this.$refs.photoInput as HTMLInputElement | undefined
    input?.click()
  }

  async uploadPhoto (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file || this.busy) return
    this.rowError = {}
    this.saved = false
    const problem = photoProblem(file)
    if (problem) {
      this.rowError = { photo: problem }
      return
    }
    this.busy = 'photo'
    try {
      this.setProfile(await communityApi.uploadPhoto(file))
      // Show the new photo at once; the Library's processed copy replaces it when it can be read.
      setOwnAvatar(file)
      this.loadPhoto()
      this.succeeded()
    } catch (error) {
      const code = error instanceof LibraryError ? error.code : ''
      const words = photoRefusal(code)
      if (words) this.rowError = { photo: words }
      else this.fail('photo', error)
    } finally {
      this.busy = ''
    }
  }

  async removePhoto () {
    if (this.busy) return
    this.busy = 'photo'
    this.rowError = {}
    this.saved = false
    try {
      this.setProfile(await communityApi.removePhoto())
      removeOwnAvatar()
      this.succeeded()
    } catch (error) {
      this.fail('photo', error)
    } finally {
      this.busy = ''
    }
  }

  // ---- username -----------------------------------------------------------

  openUsername () {
    this.editing = 'username'
    this.rowError = {}
    this.saved = false
    this.handleDraft = this.handle ?? ''
    this.availability = { kind: 'idle', text: '' }
    this.handleNote = ''
  }

  checkHandle () {
    this.saved = false
    this.rowError = {}
    if (this.checkTimer) clearTimeout(this.checkTimer)
    const seq = ++this.checkSeq
    const handle = cleanHandle(this.handleDraft)
    this.handleNote = ''
    if (!handle) {
      this.availability = { kind: 'idle', text: '' }
      return
    }
    if (handle === (this.handle ?? '')) {
      this.availability = { kind: 'bad', text: 'That is your username now.' }
      return
    }
    const problem = handleProblem(handle)
    if (problem) {
      this.availability = { kind: 'bad', text: problem }
      return
    }
    this.availability = { kind: 'checking', text: 'Checking…' }
    this.checkTimer = setTimeout(async () => {
      try {
        const { status } = await communityApi.available(handle)
        if (seq !== this.checkSeq) return
        const reason = handleStatusText(status)
        this.availability = reason ? { kind: 'bad', text: reason } : { kind: 'free', text: 'Free' }
        if (!reason) {
          const when = longDay(Date.now() + HANDLE_COOLDOWN_DAYS * 86_400_000)
          const old = this.handle ? ` Links to @${this.handle} keep working for 12 months.` : ''
          this.handleNote = `Your page moves to ${pageAddress(handle)}.${old} You can change it again on ${when}.`
        }
      } catch (error) {
        if (seq !== this.checkSeq) return
        this.availability = { kind: 'bad', text: describe(error) }
      }
    }, 250)
  }

  async saveUsername () {
    if (!this.canClaim) return
    this.busy = 'username'
    this.rowError = {}
    try {
      this.setProfile(await communityApi.claim(cleanHandle(this.handleDraft)))
      this.editing = ''
      this.now = Date.now()
      this.succeeded()
    } catch (error) {
      const code = error instanceof LibraryError ? error.code : ''
      const words: Record<string, string> = {
        handle_taken: 'That username is taken.',
        handle_reserved: 'That username is reserved.',
        handle_held: 'That username is held for its last owner for now.',
        handle_cooldown: 'You changed your username recently. It can change once every 30 days.'
      }
      this.rowError = { username: words[code] ?? describe(error) }
      if (code === 'handle_cooldown') {
        try { this.setProfile(await communityApi.profile()) } catch { /* the message stands */ }
      }
    } finally {
      this.busy = ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .profile__tile {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }

  .profile__big {
    position: relative;
    flex: none;
  }

  .profile__cam {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    box-shadow: 0 0 0 3px var(--m3d-surface);
    color: var(--m3d-text);
    cursor: pointer;

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }
  }

  .profile__who {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .profile__name {
    font-size: 20px;
    overflow-wrap: anywhere;
  }

  .profile__addr {
    color: var(--m3d-text-muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .profile__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
  }

  .profile__value {
    min-width: 0;
    max-width: 280px;
    overflow: hidden;
    color: var(--m3d-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile__warn {
    color: var(--m3d-warning);
  }

  .profile__file {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .profile__edit-row {
    flex-wrap: wrap;
  }

  .profile__row-error {
    flex-basis: 100%;
  }

  .profile__editor {
    display: flex;
    flex: 1 1 280px;
    flex-direction: column;
    gap: 8px;
    max-width: 420px;
  }

  .profile__editor-acts {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .profile__seg {
    display: inline-flex;
    flex: none;
    padding: 3px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
  }

  .profile__seg-btn {
    padding: 6px 14px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--m3d-text-muted);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &--on {
      background: var(--m3d-accent);
      color: var(--m3d-on-accent, #fff);
    }

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  .profile__sheet {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 -18px;
    padding: 16px 18px;
    border-top: 1px solid var(--m3d-border);
    background: var(--m3d-surface-2);
  }

  .profile__sheet-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 480px;
  }

  .profile__handle {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .profile__at {
    color: var(--m3d-text-muted);
  }

  .profile__avail {
    flex: none;
    font-size: 13px;

    &--free {
      color: var(--m3d-success);
    }

    &--bad {
      color: var(--m3d-danger);
    }
  }

  .profile__saved {
    margin: 0;
  }

  @media (max-width: 720px) {
    .profile__tile {
      align-items: flex-start;
    }

    .profile__value {
      max-width: 160px;
    }

    .profile__sheet {
      margin: 0 -18px;
    }
  }
</style>
