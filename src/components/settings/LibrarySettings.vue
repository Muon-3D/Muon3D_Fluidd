<template>
  <div
    id="library"
    class="lib-set"
    data-tid="library-settings"
  >
    <div class="lib-set__titles">
      <h2>Library</h2>
      <p>What your Library keeps for you, and how much room it takes</p>
    </div>

    <!-- Signed out: the Library is the account's. -->
    <section
      v-if="!signedIn"
      class="lib-empty lib-surface"
      data-tid="library-settings-signed-out"
    >
      <span class="lib-empty__icon"><frame-icon
        name="user"
        large
      /></span>
      <h2>Sign in to keep a Library</h2>
      <p>
        Your Library keeps the prints you save in Slice in your Muon3D account, so you can print them again on any of
        your printers.
      </p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="library-sign-in"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>
    </section>

    <section
      v-else-if="!state.checked"
      class="lib-empty lib-surface"
    >
      <p>{{ state.error || 'Reading your Library…' }}</p>
      <div
        v-if="state.error"
        class="lib-empty__actions"
      >
        <button
          type="button"
          class="lib-btn"
          @click="refresh"
        >
          Try again
        </button>
      </div>
    </section>

    <!-- Not turned on: the promise, and turning it on (the consent names that promise's version). -->
    <section
      v-else-if="!state.enabled"
      class="lib-surface lib-set__card lib-set__off"
      data-tid="library-settings-off"
    >
      <div class="lib-set__off-head">
        <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
          name="library"
          large
        /></span>
        <div>
          <b>Your Library is off</b>
          <span>Turn it on to keep the prints you slice, and print them again on any of your printers.</span>
        </div>
      </div>
      <p
        v-if="purgeDay"
        class="lib-set__warn"
        data-tid="library-purge"
      >
        What was in it is deleted on {{ purgeDay }} unless you turn it back on.
      </p>
      <div
        v-if="promise"
        class="lib-set__promise"
      >
        <b>{{ promiseTitle }}</b>
        <ul>
          <li
            v-for="line in promise.lines"
            :key="line"
          >
            {{ line }}
          </li>
        </ul>
        <a
          :href="promiseUrl"
          target="_blank"
          rel="noopener"
        >What we read and keep, in full</a>
      </div>
      <p v-else>
        The Library has a promise this version of Control cannot show. Update Control before turning it on.
      </p>
      <p
        v-if="error"
        class="lib-set__error"
      >
        {{ error }}
      </p>
      <div>
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          :disabled="busy || !promise"
          data-tid="library-turn-on"
          @click="turnOn"
        >
          Turn on the Library
        </button>
      </div>
    </section>

    <template v-else>
      <section
        class="acct-tile"
        aria-label="Storage"
        data-tid="library-storage-tile"
      >
        <div class="acct-tile__head">
          <frame-icon name="library" />
          Storage
        </div>
        <div
          class="acct-big"
          data-tid="library-storage"
        >
          {{ usedText }} <small>{{ quotaText }}</small>
        </div>
        <div
          class="lib-bar lib-set__bar"
          role="meter"
          aria-label="Library storage used"
          :aria-valuenow="usedPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <i
            :class="{ 'lib-set__bar--full': usedPercent >= 90 }"
            :style="{ width: `${usedPercent}%` }"
          />
        </div>
        <div
          v-if="split.length"
          class="lib-set__split"
          data-tid="library-storage-split"
        >
          <div
            v-for="part in split"
            :key="part.kind"
            class="lib-set__part"
            :data-tid="`library-storage-${part.kind}`"
          >
            <span>{{ part.label }}</span>
            <b>{{ part.text }}</b>
          </div>
        </div>
        <router-link
          to="/library"
          class="lib-set__link"
        >
          Open your Library
        </router-link>
      </section>

      <div class="acct-gt">
        Saving
      </div>
      <section
        class="acct-glist"
        aria-label="Saving"
        data-tid="library-settings-on"
      >
        <div class="acct-grow">
          <div class="acct-grow__text">
            <b>Save every slice</b>
            <span>Each slice saves a new version, without asking.</span>
          </div>
          <toggle-switch
            :value="preference('autosave')"
            label="Save every slice"
            :disabled="!state.preferences || busy"
            data-tid="library-autosave"
            @input="setPreference('autosave', $event)"
          />
        </div>
        <div class="acct-grow">
          <div class="acct-grow__text">
            <b>Ask after slicing something new</b>
            <span>{{ preference('autosave') ? 'Not while every slice is saved.' : '"Keep this in your Library?"' }}</span>
          </div>
          <toggle-switch
            :value="preference('ask')"
            label="Ask after slicing something new"
            :disabled="!state.preferences || busy"
            data-tid="library-ask"
            @input="setPreference('ask', $event)"
          />
        </div>
        <div class="acct-grow">
          <div class="acct-grow__text">
            <b>Offer to save it when you print</b>
            <span>Adds "Keep in my Library", ticked, to the print check.</span>
          </div>
          <toggle-switch
            :value="preference('save_from_print_check')"
            label="Offer to save it when you print"
            :disabled="!state.preferences || busy"
            data-tid="library-print-check"
            @input="setPreference('save_from_print_check', $event)"
          />
        </div>
      </section>
      <p class="acct-gh">
        The same in Control, Slice and the app on every device.
      </p>

      <!-- KAN-1886: the starting choices for new things; the Share dialog offers them and never assumes them. -->
      <div class="acct-gt">
        When you add something new
      </div>
      <section
        class="acct-glist"
        aria-label="When you add something new"
        data-tid="library-defaults"
      >
        <div class="acct-grow">
          <div class="acct-grow__text">
            <b>Who can see it</b>
            <span>The starting choice for new uploads, designs and sliced files. You can change it on each one. Nothing is shared until you say so.</span>
          </div>
          <div
            class="lib-set__seg"
            role="radiogroup"
            aria-label="Who can see it"
          >
            <button
              type="button"
              role="radio"
              class="lib-set__seg-btn"
              :class="{ 'lib-set__seg-btn--on': defaults.visibility === 'private' }"
              :aria-checked="defaults.visibility === 'private' ? 'true' : 'false'"
              :disabled="!defaults.supported || defaultsBusy"
              data-tid="library-visibility-private"
              @click="setVisibility('private')"
            >
              Only you
            </button>
            <button
              type="button"
              role="radio"
              class="lib-set__seg-btn"
              aria-checked="false"
              title="Coming soon"
              disabled
              data-tid="library-visibility-chosen"
            >
              People I choose
            </button>
            <button
              type="button"
              role="radio"
              class="lib-set__seg-btn"
              :class="{ 'lib-set__seg-btn--on': defaults.visibility === 'public' }"
              :aria-checked="defaults.visibility === 'public' ? 'true' : 'false'"
              :disabled="!defaults.supported || defaultsBusy"
              data-tid="library-visibility-public"
              @click="setVisibility('public')"
            >
              Anyone
            </button>
          </div>
        </div>
        <div class="acct-grow">
          <div class="acct-grow__text">
            <b>Licence to offer</b>
            <span>Offered when you publish. It's never assumed: you always see it and can change it before publishing.</span>
            <span
              v-if="defaults.supported && !defaults.licenceChosen"
              data-tid="library-licence-suggested"
            >Suggested, not chosen yet: nothing is saved until you pick one.</span>
          </div>
          <select
            class="lib-set__select"
            aria-label="Licence to offer"
            :value="defaults.licenceChosen ? defaults.licence : ''"
            :disabled="!defaults.supported || defaultsBusy"
            data-tid="library-licence"
            @change="setLicence($event)"
          >
            <option
              v-if="!defaults.licenceChosen"
              value=""
            >
              {{ licenceLabel(defaults.licence) }} (suggested)
            </option>
            <option
              v-for="licence in licences"
              :key="licence.id"
              :value="licence.id"
            >
              {{ licence.label }}
            </option>
          </select>
        </div>
      </section>
      <p
        v-if="!defaults.supported"
        class="acct-gh"
        data-tid="library-defaults-soon"
      >
        Coming soon: your account service has not answered for these yet.
      </p>
      <p
        v-else
        class="acct-gh"
      >
        "Anyone" still asks you to confirm each time you publish; this only sets the first choice in the Share dialog.
      </p>
      <p
        v-if="defaultsError"
        class="lib-set__error"
        role="alert"
      >
        {{ defaultsError }}
      </p>

      <router-link
        :to="profileLink"
        class="acct-xl"
        data-tid="library-profile-link"
      >
        <frame-icon name="user" />
        <span>Your <b>name, username and photo</b> on Library are set in Profile.</span>
        <span class="acct-xl__go">Profile ›</span>
      </router-link>

      <p
        v-if="error"
        class="lib-set__error"
      >
        {{ error }}
      </p>
    </template>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import { accountApi, LICENCES, libraryDefaultsView, type EmailPreferences, type LibraryVisibility } from '@/services/account/api'
import { describe } from '@/services/account/state'
import { describeLibraryError, type Preferences, type StorageKind } from '@/services/library/api'
import { bytesText, dayText } from '@/services/library/format'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { libraryPromise, PROMISE_TITLE, PROMISE_URL } from '@/services/library/promise'
import {
  libraryState,
  refreshLibrary,
  setLibraryPreferences,
  turnLibraryOn,
  watchLibraryAccount
} from '@/services/library/store'

type Switch = 'autosave' | 'ask' | 'save_from_print_check'

const KINDS: Array<{ kind: StorageKind, label: string }> = [
  { kind: 'uploads', label: 'Uploads' },
  { kind: 'slices', label: 'Slices' },
  { kind: 'designs', label: 'Designs' }
]

/**
 * Account › Library: the account's Library, the same on every printer.
 * Signed out, it says why it needs the account; off, it shows the promise
 * and turns it on (the consent names that promise's version); on, the
 * storage used (split by kind only when the service sends the split), the
 * three switches, and a link to Profile. There is no off switch (Jack,
 * 2 Nov, KAN-1198): saving is a prompt unless Save every slice is on, and
 * "off" is only shown for an account an older turn-off left with a deletion
 * pending. Erasing it is in library.muon3d.com's settings.
 */
@Component({ components: { ToggleSwitch, CloudAccountDialog } })
export default class LibrarySettings extends Vue {
  busy = false
  error = ''
  accountDialog = false

  /** The account's own preferences (`/v1/me/preferences`), where the defaults for new things are kept. */
  accountPrefs: EmailPreferences | null = null
  defaultsBusy = false
  defaultsError = ''
  licences = LICENCES

  promiseTitle = PROMISE_TITLE
  promiseUrl = PROMISE_URL

  get promise () {
    return libraryState.checked ? libraryPromise(libraryState.promiseVersion) : null
  }

  created () {
    watchLibraryAccount()
    this.refresh()
    this.loadDefaults()
  }

  get defaults () {
    return libraryDefaultsView(this.accountPrefs)
  }

  licenceLabel (id: string): string {
    return LICENCES.find(licence => licence.id === id)?.label ?? id
  }

  loadDefaults () {
    // A console from before the field (or the endpoint) leaves the rows disabled: nothing is faked.
    accountApi.preferences().then((p) => { this.accountPrefs = p }).catch(() => { this.accountPrefs = null })
  }

  async saveDefaults (patch: { visibility?: LibraryVisibility, licence?: string }) {
    this.defaultsBusy = true
    this.defaultsError = ''
    try {
      this.accountPrefs = await accountApi.setLibraryDefaults(patch)
    } catch (error) {
      this.defaultsError = describe(error)
    } finally {
      this.defaultsBusy = false
    }
  }

  setVisibility (visibility: LibraryVisibility) {
    if (visibility === this.defaults.visibility) return
    return this.saveDefaults({ visibility })
  }

  setLicence (event: Event) {
    const licence = (event.target as HTMLSelectElement).value
    if (!licence) return
    return this.saveDefaults({ licence })
  }

  get state () {
    return libraryState
  }

  get signedIn (): boolean {
    return libraryState.account !== null
  }

  get purgeDay (): string {
    return dayText(libraryState.purgeAfter)
  }

  get usedText (): string {
    return libraryState.usedBytes === null ? 'Reading…' : bytesText(libraryState.usedBytes)
  }

  get quotaText (): string {
    return libraryState.quotaBytes ? `of ${bytesText(libraryState.quotaBytes)}` : ''
  }

  get usedPercent (): number {
    const used = libraryState.usedBytes ?? 0
    const quota = libraryState.quotaBytes ?? 0
    return quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
  }

  get split (): Array<{ kind: StorageKind, label: string, text: string }> {
    const by = libraryState.usedByKind
    if (!by) return []
    return KINDS.filter(k => typeof by[k.kind] === 'number').map(k => ({ ...k, text: bytesText(by[k.kind] as number) }))
  }

  get profileLink (): string {
    return scopedPath('/account/profile', activeSlug())
  }

  preference (name: Switch): boolean {
    return libraryState.preferences?.[name] === true
  }

  refresh () {
    refreshLibrary().catch(() => {})
  }

  async run (what: () => Promise<void>) {
    this.busy = true
    this.error = ''
    try {
      await what()
    } catch (error) {
      this.error = describeLibraryError(error)
    } finally {
      this.busy = false
    }
  }

  setPreference (name: Switch, value: boolean) {
    const patch: Partial<Preferences> = { [name]: value }
    return this.run(() => setLibraryPreferences(patch))
  }

  turnOn () {
    const version = this.promise?.version
    if (version) return this.run(() => turnLibraryOn(version))
  }
}
</script>

<style lang="scss" scoped>
  .lib-set {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 820px;
    color: var(--m3d-text);
  }

  .lib-set__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .lib-set__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px;
  }

  .lib-set__bar {
    height: 10px;
    margin: 12px 0 4px;
    border-radius: 5px;
  }

  .lib-set__split {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 10px;
  }

  .lib-set__part {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    font-variant-numeric: tabular-nums;

    span {
      color: var(--m3d-text-muted);
    }
  }

  .lib-set__seg {
    display: inline-flex;
    flex: none;
    padding: 3px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
  }

  .lib-set__seg-btn {
    padding: 6px 12px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--m3d-text-muted);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
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

  .lib-set__select {
    flex: none;
    max-width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--m3d-border, rgba(255, 255, 255, 0.16));
    border-radius: 8px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 14px;

    &:disabled {
      opacity: 0.6;
    }
  }

  .lib-set__bar--full {
    background: var(--m3d-warning) !important;
  }

  .lib-set__link {
    align-self: flex-start;
    margin-top: 12px;
    color: var(--m3d-accent) !important;
    font-size: 13px;
    text-decoration: none;
  }

  .lib-set__off-head {
    display: flex;
    align-items: center;
    gap: 14px;

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .lib-set__promise {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 9px;
    background: var(--m3d-surface-2);
    font-size: 14px;

    ul {
      margin: 0;
      padding-left: 18px;
      color: var(--m3d-text-muted);
    }

    a {
      color: var(--m3d-accent) !important;
      font-size: 13px;
      text-decoration: none;
    }
  }

  .lib-set__warn {
    margin: 0;
    color: var(--m3d-warning);
    font-size: 13px;
  }

  .lib-set__error {
    margin: 0;
    color: var(--m3d-danger);
    font-size: 13px;
  }

  @media (max-width: 600px) {
    .lib-set__titles h2 {
      font-size: 20px;
    }

    .lib-set__seg-btn {
      padding: 6px 9px;
      font-size: 12px;
    }
  }
</style>
