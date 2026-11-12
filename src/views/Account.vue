<template>
  <div
    class="acct-page"
    :class="[{ 'acct-page--phone': isMobileViewport }, `acct-page--bar-${barSide}`]"
    data-tid="account-page"
  >
    <a
      v-if="returnToLibrary"
      :href="returnToLibrary"
      class="acct-back"
      :class="{ 'acct-back--saved': profileSaved }"
      data-tid="account-library-return"
    >
      <frame-icon
        name="chevronLeft"
        small
      />
      Back to Library
    </a>
    <router-link
      v-else-if="printerBack"
      :to="printerBack.to"
      class="acct-back acct-back--chip"
      data-tid="account-printer-return"
    >
      <frame-icon
        name="chevronLeft"
        small
      />
      Back to {{ printerBack.name }}
    </router-link>
    <account-side
      v-if="showList"
      :nav="nav"
      :nav-id="navId"
      :link-to="linkTo"
      :phone="isMobileViewport"
      @sign-out="signOut"
    />

    <div
      v-if="showPane"
      class="acct-pane"
      :class="{ 'acct-pane--wide': current.id === 'overview' }"
      data-tid="account-pane"
    >
      <router-link
        v-if="isMobileViewport"
        :to="linkTo('overview', true)"
        class="acct-back"
      >
        <frame-icon
          name="chevronLeft"
          small
        />
        Account
      </router-link>

      <!-- Signed out: the account is what these pages are about. -->
      <section
        v-if="!ready"
        class="lib-empty lib-surface"
      >
        <p>Reading your account…</p>
      </section>

      <section
        v-else-if="!signedIn"
        class="lib-empty lib-surface"
        data-tid="account-signed-out"
      >
        <span class="lib-empty__icon"><frame-icon
          name="user"
          large
        /></span>
        <h2>Sign in to see your account</h2>
        <p>Reach your printers from anywhere, and keep your Library.</p>
        <div class="lib-empty__actions">
          <button
            type="button"
            class="lib-btn lib-btn--pri"
            data-tid="account-sign-in"
            @click="accountDialog = true"
          >
            Sign in
          </button>
        </div>
      </section>

      <!-- A printer's own page: the account's settings live on the console's page (KAN-532 §2.1). -->
      <section
        v-else-if="!consoleHere"
        class="lib-empty lib-surface"
        data-tid="account-elsewhere"
      >
        <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
          name="user"
          large
        /></span>
        <h2>Your account opens on {{ consoleHost }}</h2>
        <p>You're on a printer's own page.</p>
        <div class="lib-empty__actions">
          <a
            class="lib-btn lib-btn--pri"
            :href="consoleAccountUrl"
            target="_blank"
            rel="noopener"
            data-tid="account-open-console"
          >
            Manage your account
            <frame-icon
              name="external"
              small
            />
          </a>
        </div>
      </section>

      <template v-else>
        <account-overview
          v-if="current.id === 'overview'"
          :link-to="linkTo"
        />
        <account-profile
          v-else-if="current.id === 'profile'"
          :link-to="linkTo"
          @saved="profileSaved = true"
        />
        <account-security
          v-else-if="current.id === 'security'"
          :link-to="linkTo"
        />
        <account-sessions
          v-else-if="current.id === 'sessions'"
          :link-to="linkTo"
        />
        <account-printers
          v-else-if="current.id === 'printers'"
          :link-to="linkTo"
        />
        <template v-else-if="current.id === 'apps'">
          <!-- Apps and agents: connected apps and access tokens, on one page (J12). -->
          <account-connected-apps :link-to="linkTo" />
          <account-tokens />
        </template>
        <account-notifications v-else-if="current.id === 'notifications'" />
        <library-settings v-else-if="current.id === 'library'" />
        <account-plan v-else-if="current.id === 'plan'" />
        <template v-else-if="current.id === 'privacy'">
          <!-- Your data: privacy, then Delete account (settings/MAP.md). -->
          <account-privacy :link-to="linkTo" />
          <router-link
            v-if="deleteSection"
            :to="linkTo('delete')"
            class="lib-surface acct-card acct-data-delete"
            data-tid="account-data-delete"
          >
            <span class="acct-row">
              <span class="acct-row__label">
                <b class="acct-data-delete__title">Delete account…</b>
                <span>You'll be asked to unlink the printers you own first. Takes effect after 14 days; sign in to undo.</span>
              </span>
              <frame-icon
                name="chevronRight"
                small
              />
            </span>
          </router-link>
          <p
            class="acct-note acct-note--good"
            data-tid="account-data-printer-note"
          >
            <frame-icon
              name="printer"
              small
            />
            <span><b>Data on a printer</b> stays on the printer. Each printer's own files and logs are under its Settings › System.</span>
          </p>
        </template>
        <account-delete
          v-else-if="current.id === 'delete'"
          :link-to="linkTo"
        />
      </template>
    </div>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { cloudState } from '@/services/muon-cloud/state'
import { deletionState } from '@/services/muon-cloud/deletion'
import { cloudBaseUrl } from '@/services/muon-cloud/api'
import { centralLoginEnabled } from '@/services/muon-cloud/centralLogin'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'
import { accountCameFrom, backTarget } from '@/services/account/came-from'
import { scopedPath } from '@/router/printerPagePaths'
import { accountNav, accountNavId, accountSectionFor, accountSections, libraryReturnUrl, type AccountNavGroup, type AccountSection, type AccountSectionId } from '@/services/account/model'
import { accountState, loadMe } from '@/services/account/state'
import AccountOverview from '@/components/account/AccountOverview.vue'
import AccountProfile from '@/components/account/AccountProfile.vue'
import AccountPlan from '@/components/account/AccountPlan.vue'
import AccountSide from '@/components/account/AccountSide.vue'
import { ACCOUNT_BAR_SIDE } from '@/services/account/layout'
import { beginSignOut } from '@/services/account/sign-out'
import LibrarySettings from '@/components/settings/LibrarySettings.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import '@/scss/muon3d-account.scss'

/**
 * Your account (`/account`, KAN-532): the chosen section, with the account
 * bar (AccountSide: you, the sections, Sign out) beside it on the side
 * ACCOUNT_BAR_SIDE names, by the address (`/account/profile`). Always top-level,
 * never inside a printer's view: `/boxwood-367a/account` opens `/account`,
 * and with a printer open there's a way back to it. On a phone the list is a page and a section opens over it.
 *
 * Only where the console serves Fluidd: on a printer's own page the account's
 * settings open on the console's page instead, where passkeys work and the
 * session is the console's own (the canvas's "Account menu on a printer's
 * own page").
 */
@Component({
  components: {
    AccountOverview,
    AccountProfile,
    AccountSecurity: () => import('@/components/account/AccountSecurity.vue'),
    AccountSessions: () => import('@/components/account/AccountSessions.vue'),
    AccountPrinters: () => import('@/components/account/AccountPrinters.vue'),
    AccountTokens: () => import('@/components/account/AccountTokens.vue'),
    AccountConnectedApps: () => import('@/components/account/AccountConnectedApps.vue'),
    AccountNotifications: () => import('@/components/account/AccountNotifications.vue'),
    AccountPrivacy: () => import('@/components/account/AccountPrivacy.vue'),
    AccountDelete: () => import('@/components/account/AccountDelete.vue'),
    AccountPlan,
    AccountSide,
    LibrarySettings,
    CloudAccountDialog
  }
})
export default class Account extends Mixins(BrowserMixin) {
  accountDialog = false
  readonly barSide = ACCOUNT_BAR_SIDE
  /** Profile saved: the way back to the Library is emphasised. */
  profileSaved = false

  /** Account is its own page (Jack, 6 Nov); with a printer open, a way back to it. */
  get printerBack (): { to: string, name: string } | null {
    const slug = activeSlug()
    if (!slug) return null
    const name = printerNameParts((this.$store.getters['config/getDisplayName'] as string) || '').name
    // The page you came from on that printer, else its home.
    return { to: backTarget(accountCameFrom.path, slug), name: name || 'the printer' }
  }

  get returnToLibrary (): string | null {
    return libraryReturnUrl(this.$route.query.return)
  }

  created () {
    if (!accountState.me) loadMe().catch(() => {})
  }

  /**
   * Waiting out its 14 days before deletion (console #28), the account
   * answers only its own details, the export and Keep my account: the
   * other sections have nothing to show until it's kept.
   */
  get deleting (): boolean {
    return deletionState.deleteAfter !== null
  }

  get ready (): boolean {
    return cloudState.ready
  }

  get signedIn (): boolean {
    return cloudState.account !== null
  }

  /** The console serves this page: the account's own pages work here. */
  get consoleHere (): boolean {
    return centralLoginEnabled()
  }

  get consoleHost (): string {
    try {
      return new URL(cloudBaseUrl()).host
    } catch {
      return 'control.muon3d.com'
    }
  }

  get consoleAccountUrl (): string {
    return `${cloudBaseUrl()}/account`
  }

  get sections (): AccountSection[] {
    const all = accountSections()
    return this.deleting ? all.filter(section => section.id === 'privacy' || section.id === 'delete') : all
  }

  /** The nav, in its three groups. */
  get nav (): Array<{ group: AccountNavGroup, sections: AccountSection[] }> {
    return accountNav(this.sections)
  }

  /** The nav item lit for this page: Delete account is inside Your data. */
  get navId (): AccountSectionId {
    return accountNavId(this.current.id)
  }

  get deleteSection (): AccountSection | undefined {
    return this.sections.find(section => section.id === 'delete')
  }

  get current (): AccountSection {
    const section = accountSectionFor(this.$route.params.section)
    if (this.deleting && section.id !== 'privacy') return accountSectionFor('delete')
    return section
  }

  /** On a phone, the list on its own until a section is chosen. */
  get showList (): boolean {
    return !this.isMobileViewport || !this.$route.params.section
  }

  get showPane (): boolean {
    return !this.isMobileViewport || !!this.$route.params.section
  }

  linkTo (id: AccountSectionId, list = false): string {
    const path = id === 'overview' && (list || !this.isMobileViewport) ? '/account' : `/account/${id}`
    const scoped = scopedPath(path, activeSlug())
    return this.returnToLibrary ? `${scoped}?return=${encodeURIComponent(this.returnToLibrary)}` : scoped
  }

  signOut () {
    return beginSignOut(this.$router)
  }
}
</script>
