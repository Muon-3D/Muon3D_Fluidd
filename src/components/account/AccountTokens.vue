<template>
  <div
    class="acct-section"
    data-tid="account-tokens"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <div class="acct-head__title">
          <h2 class="acct-tokens__title">
            Access tokens
          </h2>
          <acct-more label="What a token is">
            A token lets a script, a CI job or an AI tool act as you, with fewer powers. It ends on its own, and you can revoke it any time.
          </acct-more>
        </div>
      </div>
      <button
        v-if="!missing && !making && !fresh"
        type="button"
        class="lib-btn lib-btn--pri"
        data-tid="tokens-make"
        @click="openForm"
      >
        <frame-icon
          name="plus"
          small
        />Make a token
      </button>
    </div>

    <!-- The new token: shown once, then gone. Only Done closes it. -->
    <m3-dialog
      :value="!!fresh"
      title="Copy your token now"
      max-width="480"
      persistent
      :closable="false"
      aria-label="Your new token"
      data-tid="tokens-fresh"
    >
      <template v-if="fresh">
        <p class="m3-dlg__text">
          You won't see it again. Treat it like a password.
        </p>
        <div class="tok__secret">
          <input
            ref="secret"
            class="tok__secret-input"
            :type="copyFailed ? 'text' : 'password'"
            readonly
            spellcheck="false"
            autocomplete="off"
            aria-label="Your new token"
            :value="fresh.token"
            data-tid="tokens-secret"
            @focus="selectSecret"
          >
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            data-tid="tokens-copy"
            @click="copySecret"
          >
            <frame-icon
              :name="copied ? 'check' : 'copy'"
              small
            />{{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <span
          v-if="copyFailed"
          class="acct-field__note"
          role="status"
        >Couldn't copy. Select it and copy it by hand.</span>
        <div
          class="tok__agent"
          data-tid="tokens-agent"
        >
          <frame-icon
            name="chip"
            small
          />
          <span>For an AI agent: <button
            type="button"
            class="acct-link tok__link-btn"
            data-tid="tokens-copy-setup"
            @click="copySetup"
          >{{ setupCopied ? 'setup instructions copied' : 'copy setup instructions' }}</button> (the MCP address and this token).</span>
        </div>
        <span class="acct-field__note">For a script, send it as <code>Authorization: Bearer &lt;token&gt;</code>. Keep it out of shared code and chats.</span>
      </template>
      <template #actions>
        <button
          type="button"
          class="lib-btn lib-btn--pri tok__wide"
          data-tid="tokens-done"
          @click="dismissFresh"
        >
          Done
        </button>
      </template>
    </m3-dialog>

    <!-- Make one: a sheet over the page. -->
    <m3-dialog
      :value="making && !fresh"
      title="Make a token"
      max-width="520"
      :persistent="busy"
      aria-label="Make a token"
      data-tid="tokens-form"
      @close="closeForm"
    >
      <label class="acct-field">
        <span class="acct-field__label">Name</span>
        <span class="lib-field">
          <input
            v-model="form.name"
            type="text"
            maxlength="64"
            placeholder="Laptop scripts"
            autocomplete="off"
            aria-label="Name"
            data-tid="tokens-name"
          >
        </span>
        <span class="acct-field__note">So you know which one it is later. Up to 64 characters.</span>
      </label>

      <fieldset class="tok__fieldset">
        <legend class="acct-field__label">
          What it can do
        </legend>
        <div
          v-for="group in groups"
          :key="group.id"
          class="tok__group"
          :class="`tok__group--${group.id}`"
          :data-tid="`tokens-group-${group.id}`"
        >
          <div class="tok__group-head">
            <b>{{ group.title }}</b>
            <span
              v-if="group.twoStep"
              class="lib-pill lib-pill--warn"
            >Needs a two-step code</span>
          </div>
          <span class="acct-field__note">{{ group.blurb }}</span>
          <label
            v-for="scope in group.scopes"
            :key="scope.id"
            class="tok__option"
          >
            <input
              v-model="form.scopes"
              type="checkbox"
              class="acct-checkbox"
              :value="scope.id"
              :disabled="isSoon(scope.id)"
              :data-tid="`tokens-scope-${scope.id}`"
            >
            <span class="tok__option-text">
              <span>{{ scope.label }}
                <span
                  v-if="isSoon(scope.id)"
                  class="lib-pill"
                  :data-tid="`tokens-soon-${scope.id}`"
                >Coming soon</span>
                <span
                  v-else-if="scope.twoStep"
                  class="lib-pill lib-pill--warn"
                >Needs a two-step code</span>
              </span>
              <span
                v-if="scope.note"
                class="acct-field__note"
              >{{ scope.note }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset class="tok__fieldset">
        <legend class="acct-field__label">
          Which printers
        </legend>
        <label class="tok__option">
          <input
            v-model="form.allPrinters"
            type="radio"
            class="acct-radio"
            :value="true"
            name="tok-printers"
            data-tid="tokens-printers-all"
          >
          <span class="tok__option-text">
            <span>All my printers</span>
            <span class="acct-field__note">{{ allPrintersNote }}</span>
          </span>
        </label>
        <label class="tok__option">
          <input
            v-model="form.allPrinters"
            type="radio"
            class="acct-radio"
            :value="false"
            name="tok-printers"
            data-tid="tokens-printers-some"
          >
          <span class="tok__option-text"><span>Only these</span></span>
        </label>
        <div
          v-if="!form.allPrinters"
          class="tok__printers"
        >
          <label
            v-for="printer in ownedPrinters"
            :key="printer.id"
            class="tok__option"
          >
            <input
              v-model="form.printerIds"
              type="checkbox"
              class="acct-checkbox"
              :value="printer.id"
              :data-tid="`tokens-printer-${printer.id}`"
            >
            <span class="tok__option-text"><span>{{ printer.name }}</span></span>
          </label>
          <span
            v-if="!ownedPrinters.length"
            class="acct-field__note"
          >You haven't linked a printer yet. A token only reaches printers you own.</span>
        </div>
      </fieldset>

      <fieldset class="tok__fieldset">
        <legend class="acct-field__label">
          How long it lasts
        </legend>
        <div
          class="tok__seg"
          role="radiogroup"
          aria-label="How long it lasts"
        >
          <label
            v-for="choice in expiries"
            :key="choice.days"
            class="tok__seg-item"
            :class="{ 'tok__seg-item--on': form.days === choice.days }"
          >
            <input
              v-model.number="form.days"
              type="radio"
              class="sr-only"
              name="tok-days"
              :value="choice.days"
              :data-tid="`tokens-days-${choice.days}`"
            >{{ choice.label }}
          </label>
        </div>
        <span class="acct-field__note">Every token ends. Make a new one when it does.</span>
      </fieldset>

      <p
        v-if="bypassSoon"
        class="acct-field__note"
        data-tid="tokens-always-ask"
      >
        Starting a print, heating, moving and publishing always ask you first, whatever it can do.
      </p>
      <fieldset
        v-else
        class="tok__fieldset"
      >
        <legend class="acct-field__label">
          Before it starts a print, heats or moves a printer
        </legend>
        <label
          class="acct-choice"
          :class="{ 'acct-choice--on': !form.bypass }"
        >
          <input
            v-model="form.bypass"
            type="radio"
            class="acct-radio"
            name="tok-mode"
            :value="false"
            data-tid="tokens-mode-ask"
          >
          <span>
            <b>Ask me first</b>
            <span class="acct-field__note tok__block">You OK each publish, print, heat or move this token tries.</span>
          </span>
        </label>
        <label
          class="acct-choice"
          :class="{ 'acct-choice--on': form.bypass }"
        >
          <input
            v-model="form.bypass"
            type="radio"
            class="acct-radio"
            name="tok-mode"
            :value="true"
            data-tid="tokens-mode-bypass"
          >
          <span>
            <b>Bypass: don't ask</b>
            <span class="acct-field__note tok__block">The token does those without asking. Off unless you choose it.</span>
          </span>
        </label>
        <div
          v-if="form.bypass"
          class="acct-note acct-note--bad"
          data-tid="tokens-bypass-warning"
        >
          <frame-icon
            name="alert"
            small
          />
          <span>
            <b>Anyone holding this token can act without your click.</b>
            Bypass is saved but not enforced yet. Once it is, treat a leaked token as a person at your printer.
            You'll be asked for a fresh two-step code.
          </span>
        </div>
        <div
          v-if="form.bypass"
          class="tok__seg"
          role="radiogroup"
          aria-label="How long Bypass lasts"
        >
          <label
            v-for="choice in bypassChoices"
            :key="String(choice.hours)"
            class="tok__seg-item"
            :class="{ 'tok__seg-item--on': form.bypassHours === choice.hours }"
          >
            <input
              v-model="form.bypassHours"
              type="radio"
              class="sr-only"
              name="tok-bypass-hours"
              :value="choice.hours"
              :data-tid="`tokens-bypass-${choice.hours === null ? 'end' : choice.hours}`"
            >{{ choice.label }}
          </label>
        </div>
        <span class="acct-field__note">Saved on the token, but not enforced yet: today no token can publish, start a print, heat or move, so nothing asks.</span>
      </fieldset>

      <div
        v-if="needsTwoStep && !hasTwoStep"
        class="acct-note acct-note--warn"
        data-tid="tokens-needs-two-step"
      >
        <frame-icon
          name="shield"
          small
        />
        <span>Those marked need two-step sign-in. <router-link
          :to="linkTo('security')"
          class="acct-link"
        >Turn it on</router-link>, or leave them out.</span>
      </div>

      <p
        v-if="formError"
        class="acct-error"
        role="alert"
        data-tid="tokens-form-error"
      >
        {{ formError }}
      </p>

      <template #actions>
        <button
          type="button"
          class="lib-btn"
          :disabled="busy"
          data-tid="tokens-cancel"
          @click="closeForm"
        >
          Cancel
        </button>
        <button
          type="button"
          class="lib-btn lib-btn--pri tok__wide"
          :disabled="!canMake || busy"
          data-tid="tokens-create"
          @click="create"
        >
          {{ busy ? 'Making it…' : 'Make token' }}
        </button>
      </template>
    </m3-dialog>

    <!-- The list -->
    <section
      v-if="!missing && tokens && tokens.length"
      class="lib-surface acct-card"
      aria-label="Your tokens"
      data-tid="tokens-list"
    >
      <div class="acct-list">
        <div
          v-for="token in ordered"
          :key="token.id"
          class="tok__row"
          :class="{ 'tok__row--ended': token.status !== 'active' }"
          :data-tid="`tokens-row-${token.status}`"
        >
          <span class="acct-icon-box"><frame-icon
            name="key"
            small
          /></span>
          <div class="acct-row__label tok__body">
            <span class="tok__name">
              <b>{{ token.name }}</b>
              <code class="tok__prefix">{{ token.prefix }}…</code>
              <span
                v-if="token.status !== 'active'"
                class="lib-pill"
              >{{ token.status === 'revoked' ? 'Revoked' : 'Ended' }}</span>
              <span
                v-else-if="token.ask_mode === 'bypass'"
                class="lib-pill lib-pill--err"
                :title="modeLine(token)"
              >Bypass</span>
            </span>
            <span data-tid="tokens-row-line">{{ endsLine(token) }} · {{ usedLine(token) }} · {{ printersLine(token) }}</span>
            <span class="tok__chips">
              <span
                v-for="pill in pillsOf(token)"
                :key="pill.text"
                class="tok__chip"
                :class="{ 'tok__chip--power': pill.changes }"
                :title="token.scopes.map(scopeLabel).join(', ')"
              >{{ pill.text }}</span>
            </span>
          </div>
          <button
            v-if="token.status === 'active'"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost tok__revoke"
            :disabled="busy"
            :aria-label="`Revoke ${token.name}`"
            data-tid="tokens-revoke"
            @click="revoke(token)"
          >
            Revoke…
          </button>
        </div>
      </div>
    </section>

    <div
      v-else-if="tokens === null && !missing && !loadError"
      class="lib-surface acct-card acct-card--pad"
    >
      <p class="acct-muted tok__reading">
        Reading your tokens…
      </p>
    </div>

    <div
      v-else-if="missing"
      class="acct-empty"
      data-tid="tokens-missing"
    >
      <span class="acct-empty__icon"><frame-icon
        name="key"
        large
      /></span>
      <h3>Tokens come soon</h3>
      <p>They appear here once the console supports them.</p>
    </div>

    <div
      v-else-if="tokens && !tokens.length && !making && !fresh"
      class="acct-empty"
      data-tid="tokens-empty"
    >
      <span class="acct-empty__icon"><frame-icon
        name="key"
        large
      /></span>
      <h3>No tokens yet</h3>
      <p>Let a script, a CI job or an AI tool read your printers or Library.</p>
      <button
        type="button"
        class="lib-btn lib-btn--pri"
        data-tid="tokens-make-empty"
        @click="openForm"
      >
        <frame-icon
          name="plus"
          small
        />Make a token
      </button>
    </div>

    <div class="acct-note">
      <frame-icon
        name="info"
        small
      />
      <span>A token can't change access, make tokens or edit your account. See one you don't know? Revoke it.</span>
    </div>

    <div
      class="acct-note acct-note--info tok__printer-note"
      data-tid="tokens-printer-note"
    >
      <frame-icon
        name="printer"
        small
      />
      <span>To see which apps can reach <b>one printer</b>, including other people's, open that printer's People and access. Its owner can cut a token off that printer there; only the token's maker revokes it everywhere, here.</span>
      <router-link
        v-if="peopleLink"
        :to="peopleLink.to"
        class="acct-link tok__printer-link"
        data-tid="tokens-printer-link"
      >
        {{ peopleLink.name }} ›
      </router-link>
    </div>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
      data-tid="tokens-message"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ message }}</span>
    </p>
    <p
      v-if="error"
      class="acct-error"
      role="alert"
      data-tid="tokens-error"
    >
      {{ error }}
    </p>

    <reauth-dialog
      v-bind="reauthProps"
      v-on="reauthOn"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import AccountReauthMixin from '@/mixins/account-reauth'
import ReauthDialog from './ReauthDialog.vue'
import AcctMore from './AcctMore.vue'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import { knownPrinters, printerPath } from '@/services/printer-pages'
import { cloudState } from '@/services/muon-cloud/state'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import { accountApi } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { accountState, loadMe } from '@/services/account/state'
import type { AccountSectionId } from '@/services/account/model'
import {
  BYPASS_CHOICES,
  DEFAULT_EXPIRY_DAYS,
  DEFAULT_SCOPES,
  EXPIRY_CHOICES,
  SCOPE_GROUPS,
  BYPASS_SOON,
  SENSITIVE_SCOPES,
  SOON_SCOPES,
  agentSetupText,
  createBody,
  endsText,
  modeText,
  changesThings,
  needsTwoStep,
  orderTokens,
  printersShort,
  scopeLabel,
  scopePills,
  tokenFailure,
  usedText,
  type CreatedToken,
  type PersonalToken
} from '@/services/account/tokens'

/**
 * Access tokens (KAN-904 milestone 3a): the account's personal access
 * tokens. List them, make one (what it can do, which printers, how long, and
 * whether it asks before it acts), see it once, revoke it. The secret lives
 * in `fresh` only until the person says they've saved it, or leaves: never in
 * the shared account state, storage or the console.
 */
@Component({ components: { ReauthDialog, AcctMore, M3Dialog } })
export default class AccountTokens extends Mixins(AccountReauthMixin) {
  @Prop({ type: Function, default: (id: AccountSectionId) => `/account/${id}` })
  readonly linkTo!: (id: AccountSectionId) => string

  tokens: PersonalToken[] | null = null
  missing = false
  loadError = false
  making = false
  busy = false
  /** The token just made, with its secret. Cleared on dismiss and on leaving. */
  fresh: CreatedToken | null = null
  copied = false
  copyFailed = false
  setupCopied = false
  error = ''
  formError = ''
  message = ''
  form = this.blankForm()
  /** Scopes and Bypass the console won't make yet: shown as "Coming soon". */
  soonScopes: string[] = [...SOON_SCOPES]
  bypassSoon = BYPASS_SOON

  readonly groups = SCOPE_GROUPS
  readonly expiries = EXPIRY_CHOICES
  readonly bypassChoices = BYPASS_CHOICES
  readonly scopeLabel = scopeLabel

  created () {
    if (!accountState.me) loadMe().catch(() => {})
    this.refresh()
  }

  beforeDestroy () {
    // The secret goes with the page.
    this.fresh = null
  }

  blankForm () {
    return {
      name: '',
      scopes: [...DEFAULT_SCOPES],
      allPrinters: true,
      printerIds: [] as string[],
      days: DEFAULT_EXPIRY_DAYS,
      bypass: false,
      bypassHours: 8 as 1 | 8 | null
    }
  }

  async refresh () {
    try {
      this.tokens = (await accountApi.tokens()).tokens
      this.missing = false
      this.loadError = false
    } catch (error) {
      if (isMissing(error)) {
        this.missing = true
        this.tokens = []
      } else {
        this.loadError = true
        this.tokens = this.tokens ?? []
        this.error = tokenFailure(error).text
      }
    }
  }

  get ordered (): PersonalToken[] {
    return orderTokens(this.tokens ?? [])
  }

  /** Printers the account owns: a token can only name those. */
  get ownedPrinters (): CloudPrinter[] {
    return cloudState.printers.filter(p => !p.shared)
  }

  get hasTwoStep (): boolean {
    const me = accountState.me
    return me ? (me.sign_in?.two_step ?? me.account.two_step ?? false) : false
  }

  get allPrintersNote (): string {
    return changesThings(this.form.scopes)
      ? 'The printers you have now. A token that can change things does not cover printers you add later.'
      : 'Including ones you add later.'
  }

  get needsTwoStep (): boolean {
    return needsTwoStep(this.form.scopes, this.form.bypass ? 'bypass' : 'ask')
  }

  get canMake (): boolean {
    const f = this.form
    if (!f.name.trim() || !f.scopes.length) return false
    if (f.scopes.some(s => this.isSoon(s)) || (f.bypass && this.bypassSoon)) return false
    if (!f.allPrinters && !f.printerIds.length) return false
    if (this.needsTwoStep && !this.hasTwoStep) return false
    return true
  }

  isSoon (scope: string): boolean {
    return this.soonScopes.includes(scope)
  }

  isSensitive (scope: string): boolean {
    return SENSITIVE_SCOPES.includes(scope)
  }

  printerName (id: string): string {
    return cloudState.printers.find(p => p.id === id)?.name ?? 'a printer'
  }

  printersLine (token: PersonalToken): string {
    return printersShort(token, id => this.printerName(id))
  }

  modeLine (token: PersonalToken): string {
    return modeText(token)
  }

  endsLine (token: PersonalToken): string {
    return endsText(token)
  }

  usedLine (token: PersonalToken): string {
    const text = usedText(token)
    return text.charAt(0).toLowerCase() + text.slice(1)
  }

  pillsOf (token: PersonalToken) {
    return scopePills(token.scopes)
  }

  /** The first owned printer this browser knows, for "open that printer's People and access". */
  get peopleLink (): { to: string, name: string } | null {
    for (const printer of this.ownedPrinters) {
      const slug = knownPrinters().find(t => t.kind === 'cloud' && t.printerId === printer.id)?.slug
      if (slug) return { to: `${printerPath(slug, 'settings')}#access`, name: printer.name }
    }
    return null
  }

  openForm () {
    this.form = this.blankForm()
    this.formError = ''
    this.message = ''
    this.error = ''
    this.making = true
  }

  closeForm () {
    if (this.busy) return
    this.making = false
    this.formError = ''
  }

  async create () {
    if (!this.canMake || this.busy) return
    const body = createBody(this.form)
    const strong = this.needsTwoStep
    this.busy = true
    this.formError = ''
    try {
      // A strong token always needs a fresh code, so the first try is the
      // console's way of asking for one; plain tokens go straight through.
      const made = await this.withReauth(
        r => accountApi.createToken(body, r),
        {
          action: 'Make token',
          why: strong
            ? 'A token that can start prints, upload files, heat, move, publish or skip the click needs a fresh sign-in and a code from your authenticator app.'
            : undefined
        }
      )
      if (!made) return
      this.fresh = made
      this.copied = false
      this.copyFailed = false
      this.setupCopied = false
      this.making = false
      this.form = this.blankForm()
      this.message = ''
      // The list without the secret.
      await this.refresh()
    } catch (error) {
      const failure = tokenFailure(error)
      if (failure.kind === 'soon') this.learnSoon()
      this.formError = failure.text
    } finally {
      this.busy = false
    }
  }

  /** The console said "not available yet": stop offering what the form asked for. */
  learnSoon () {
    const asked = this.form.scopes.filter(s => s === 'printers:control')
    this.soonScopes = [...new Set([...this.soonScopes, ...asked])]
    this.form.scopes = this.form.scopes.filter(s => !this.soonScopes.includes(s))
    if (this.form.bypass) {
      this.bypassSoon = true
      this.form.bypass = false
    }
  }

  selectSecret (event: Event) {
    (event.target as HTMLInputElement).select()
  }

  async copySecret () {
    if (!this.fresh) return
    try {
      await navigator.clipboard.writeText(this.fresh.token)
      this.copied = true
      this.copyFailed = false
    } catch {
      this.copied = false
      this.copyFailed = true
      const input = this.$refs.secret as HTMLInputElement | undefined
      input?.select()
    }
  }

  /** The MCP address and the token, for an AI agent: to the clipboard only. */
  async copySetup () {
    if (!this.fresh) return
    try {
      await navigator.clipboard.writeText(agentSetupText(this.fresh))
      this.setupCopied = true
    } catch {
      this.setupCopied = false
      this.copyFailed = true
    }
  }

  dismissFresh () {
    const name = this.fresh?.name
    this.fresh = null
    this.copied = false
    this.copyFailed = false
    this.setupCopied = false
    if (name) this.message = `${name} is ready. It works until it ends or you revoke it.`
  }

  async revoke (token: PersonalToken) {
    const sure = await this.$confirm(`${token.name} stops working on every printer on its next request. Anything using it will be refused. You can't undo this, but you can make another token.`, {
      title: `Revoke ${token.name} everywhere?`,
      buttonTrueText: 'Revoke it',
      danger: true
    })
    if (!sure) return
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await accountApi.revokeToken(token.id)
      this.message = `${token.name} is revoked.`
    } catch (error) {
      // Already gone, or on another device: the list says so after a refresh.
      this.error = tokenFailure(error).text
    } finally {
      this.busy = false
      await this.refresh()
    }
  }
}
</script>

<style lang="scss" scoped>
  .tok__title {
    padding-top: 0;
  }

  .tok__fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;

    legend {
      padding: 0;
      margin-bottom: 6px;
    }
  }

  .tok__group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
  }

  .tok__group--power {
    border-color: color-mix(in srgb, var(--m3d-warn, #d49a2a) 55%, var(--m3d-border));
  }

  .tok__group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .tok__option {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    min-height: 32px;
    padding: 4px 0;
    cursor: pointer;
  }

  .tok__option-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 14px;
  }

  .tok__block {
    display: block;
    margin-top: 2px;
  }

  .tok__printers {
    padding-left: 28px;
  }

  .tok__seg {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tok__seg-item {
    padding: 8px 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 8px;
    background: var(--m3d-surface);
    font-size: 13px;
    cursor: pointer;
  }

  .tok__seg-item--on {
    border-color: var(--m3d-accent-border);
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .tok__seg-item:focus-within {
    outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent));
    outline-offset: 2px;
  }

  .tok__secret {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tok__secret-input {
    flex: 1 1 260px;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 8px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
  }

  .tok__row {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
    padding: 14px 0;
  }

  .tok__row--ended {
    opacity: 0.6;
  }

  .tok__body {
    gap: 4px;
  }

  .tok__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .tok__prefix {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .tok__chips {
    display: flex !important;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tok__chip {
    padding: 1px 8px;
    border: 1px solid var(--m3d-border);
    border-radius: 99px;
    color: var(--m3d-text-muted);
    font-size: 11px;
  }

  .tok__chip--power {
    border-color: color-mix(in srgb, var(--m3d-warn, #d49a2a) 60%, var(--m3d-border));
    background: color-mix(in srgb, var(--m3d-warn, #d49a2a) 14%, transparent);
    color: var(--m3d-warn, #d49a2a);
  }

  .tok__agent {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 12px 0 8px;
    padding: 12px 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
    font-size: 13px;
  }

  .tok__link-btn {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    cursor: pointer;
  }

  .tok__wide {
    flex: 1 1 auto;
  }

  .tok__printer-note {
    align-items: center;

    .tok__printer-link {
      margin-left: auto;
      white-space: nowrap;
    }
  }

  .tok__reading {
    margin: 0;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    .tok__row {
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .tok__revoke {
      grid-column: 2;
      justify-self: start;
    }
    .tok__printers {
      padding-left: 0;
    }
  }
</style>
