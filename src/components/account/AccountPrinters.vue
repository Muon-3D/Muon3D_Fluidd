<template>
  <div
    class="acct-section"
    data-tid="account-printers"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <h1>Printers and access</h1>
        <p>The printers you can use, and your role on each</p>
      </div>
      <button
        type="button"
        class="lib-btn"
        data-tid="printers-join"
        @click="openJoin"
      >
        <frame-icon
          name="link"
          small
        />Join with a code
      </button>
      <button
        type="button"
        class="lib-btn"
        data-tid="printers-link"
        @click="linkDialog = true"
      >
        <frame-icon
          name="plus"
          small
        />Link a printer
      </button>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="Your printers"
    >
      <div class="acct-card__title">
        <h2>Your printers · {{ rows.length }}</h2>
        <acct-more
          label="Who owns a printer"
          end
        >
          The owner is set on each printer's own screen. Printers on your network work without an account.
        </acct-more>
      </div>
      <div
        v-if="!rows.length"
        class="acct-empty"
        data-tid="printers-empty"
      >
        <span class="acct-empty__icon"><frame-icon
          name="printer"
          large
        /></span>
        <h3>No printers yet</h3>
        <p>Link an M1 with the code on its screen, or join one with an invite code.</p>
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="printers-empty-link"
          @click="linkDialog = true"
        >
          Add a printer
        </button>
      </div>
      <div class="acct-list">
        <div
          v-for="row in rows"
          :key="row.printer.id"
          class="prn__printer"
          :data-tid="row.role === 'owner' ? 'printers-owned' : 'printers-shared'"
          :data-role="row.role"
        >
          <printer-thumb
            :size="48"
            :state="thumbOf(row.printer)"
          />
          <div class="acct-row__label">
            <span class="prn__name"><b>{{ row.printer.name }}</b><span
              class="lib-pill"
              :class="stateOf(row.printer).pill"
            ><span class="lib-dot" />{{ stateOf(row.printer).text }}</span><span
              v-if="row.role !== 'owner' && sharerName(row.printer)"
              class="prn__shared"
              role="img"
              data-tid="shared-by-icon"
              :aria-label="`Shared by ${sharerName(row.printer)}`"
              :title="`Shared by ${sharerName(row.printer)}`"
            ><frame-icon
              name="user"
              small
            /></span></span>
            <span>{{ lineOf(row) }}</span>
            <span
              v-if="row.role === 'owner' && row.printer.discovery"
              class="prn__discovery"
            >
              <label :for="`discovery-${row.printer.id}`">Who can find it</label>
              <span class="prn__select-wrap">
                <select
                  :id="`discovery-${row.printer.id}`"
                  class="prn__select"
                  data-tid="discovery-select"
                  :value="row.printer.discovery"
                  :disabled="busy"
                  @change="changeDiscovery(row.printer, $event)"
                >
                  <option
                    v-for="level in discoveryLevels"
                    :key="level.value"
                    :value="level.value"
                  >{{ level.label }}</option>
                </select>
              </span>
              <span
                class="acct-subtle"
                data-tid="discovery-help"
              >{{ discoveryHelp(row.printer.discovery) }}</span>
            </span>
          </div>
          <div class="prn__acts">
            <span
              class="lib-pill"
              :class="{ 'lib-pill--run': row.role === 'owner' }"
              data-tid="printers-role"
            >{{ roleWord(row.role) }}</span>
            <template v-if="row.role === 'owner'">
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                @click="openRename(row.printer)"
              >
                Rename
              </button>
              <router-link
                v-if="peopleTo(row.printer)"
                :to="peopleTo(row.printer)"
                class="lib-btn lib-btn--sm"
                data-tid="printers-people"
              >
                People<frame-icon
                  name="chevronRight"
                  small
                />
              </router-link>
            </template>
            <template v-else>
              <router-link
                v-if="openTo(row.printer)"
                :to="openTo(row.printer)"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                data-tid="printers-open"
              >
                Open
              </router-link>
              <button
                v-if="shareIdOf(row.printer)"
                type="button"
                class="lib-btn lib-btn--sm lib-btn--danger"
                :disabled="busy"
                data-tid="printers-leave"
                @click="leave(row.printer)"
              >
                Leave…
              </button>
              <span
                v-else
                class="acct-soon"
              >Leaving: not available yet</span>
            </template>
          </div>
        </div>
      </div>
    </section>
    <p class="acct-field__note">
      Owners manage people, invites and Unlink on the printer's own People and access. Everyone else can open the printer, or leave it.
    </p>

    <section
      class="lib-surface acct-card"
      aria-label="Elsewhere in Account"
      data-tid="printers-elsewhere"
    >
      <div class="acct-card__title">
        <h2>Elsewhere in Account</h2>
      </div>
      <div class="acct-list">
        <router-link
          :to="linkTo('sessions')"
          class="acct-row prn__go"
          data-tid="printers-to-devices"
        >
          <span class="acct-row__label">
            <b>Your devices</b>
            <span>Browsers and phones signed in as you</span>
          </span>
          <frame-icon
            name="chevronRight"
            small
          />
        </router-link>
        <router-link
          :to="linkTo('apps')"
          class="acct-row prn__go"
          data-tid="printers-to-apps"
        >
          <span class="acct-row__label">
            <b>Apps and agents</b>
            <span>Connected apps and access tokens</span>
          </span>
          <frame-icon
            name="chevronRight"
            small
          />
        </router-link>
      </div>
    </section>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
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
    >
      {{ error }}
    </p>

    <m3-dialog
      :value="dialog === 'join'"
      title="Join with a code"
      @close="dialog = ''"
    >
      <label class="m3-field">
        <span class="m3-field__label">Invite code</span>
        <span class="m3-field__box"><input
          v-model="form.code"
          aria-label="Invite code"
          autocomplete="off"
          data-tid="join-code"
          @keydown.enter="join"
        ></span>
        <span class="m3-dlg__note">The code from an invite link someone sent you. The next page shows which printer it's for before you join.</span>
      </label>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="dialog = ''"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!joinCode"
          data-tid="join-go"
          @click="join"
        >
          Next
        </button>
      </template>
    </m3-dialog>

    <m3-dialog
      :value="dialog === 'rename'"
      title="Rename this printer"
      :persistent="busy"
      @close="dialog = ''"
    >
      <label class="m3-field">
        <span class="m3-field__label">Name</span>
        <span class="m3-field__box"><input
          v-model="form.name"
          maxlength="64"
          aria-label="Name"
          @keydown.enter="rename"
        ></span>
        <span class="m3-dlg__note">Shown in your account, the app and to people you share it with. The printer's own name on its screen stays.</span>
      </label>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="dialog = ''"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.name.trim() || busy"
          @click="rename"
        >
          Rename
        </button>
      </template>
    </m3-dialog>

    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PrinterThumb, { type ThumbState } from '@/components/ui/PrinterThumb.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'
import AcctMore from './AcctMore.vue'
import { cloudApi, type CloudPrinter, type DiscoveryLevel } from '@/services/muon-cloud/api'
import { cloudState, refreshPrinters } from '@/services/muon-cloud/state'
import { normalizeJoinCode } from '@/services/muon-cloud/join'
import { knownPrinters, printerPath } from '@/services/printer-pages'
import { accountApi } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { describe } from '@/services/account/state'
import { dayText, type AccountSectionId } from '@/services/account/model'
import { ROLE_WORDS, accessViewer, type AccessViewer } from '@/services/people-access/model'

type AccountPrinter = CloudPrinter & { share_id?: string }

interface PrinterRow {
  printer: AccountPrinter;
  role: AccessViewer;
}

/**
 * Account › Printers and access (Control v3, `access-account`): every printer
 * you belong to, with your role on each. An owner's row goes to that
 * printer's People and access, where people, invites, links and Unlink live;
 * anyone else's row opens the printer or leaves it. Your devices and your
 * apps are their own Account sections, linked from here.
 */
@Component({ components: { M3Dialog, PrinterThumb, LinkPrinterDialog, AcctMore } })
export default class AccountPrinters extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  dialog: '' | 'rename' | 'join' = ''
  form = { name: '', code: '' }
  renaming: CloudPrinter | null = null
  linkDialog = false
  busy = false
  error = ''
  message = ''

  created () {
    refreshPrinters().catch(() => {})
  }

  /** Yours first, then the ones shared with you; the role is the console's. */
  get rows (): PrinterRow[] {
    const rows = cloudState.printers.map(printer => ({
      printer: printer as AccountPrinter,
      role: accessViewer(null, { shared: !!printer.shared, role: printer.role }) ?? 'viewer'
    }))
    return [...rows.filter(r => r.role === 'owner'), ...rows.filter(r => r.role !== 'owner')]
  }

  roleWord (role: AccessViewer): string {
    return ROLE_WORDS[role]
  }

  lineOf (row: PrinterRow): string {
    const p = row.printer
    if (row.role === 'owner') return `${p.model || 'M1'} · linked ${dayText(p.linked_at)}`
    const name = this.sharerName(p)
    const owner = name ? `Owner ${name}` : 'Shared with you'
    return `${owner} · ${p.ends_at ? `until ${dayText(p.ends_at)}` : 'no end date'}`
  }

  thumbOf (p: CloudPrinter): ThumbState {
    if (!p.online) return 'offline'
    const state = cloudState.status[p.id]?.state
    return state === 'printing' || state === 'paused' ? 'printing' : 'idle'
  }

  stateOf (p: CloudPrinter): { text: string, pill: string } {
    if (!p.online) return { text: 'Offline', pill: '' }
    const status = cloudState.status[p.id]
    if (status?.state === 'printing') {
      const progress = typeof status.progress === 'number' ? ` ${Math.round(status.progress * 100)}%` : ''
      return { text: `Printing${progress}`, pill: 'lib-pill--run' }
    }
    if (status?.state === 'paused') return { text: 'Paused', pill: 'lib-pill--warn' }
    return { text: 'Online', pill: 'lib-pill--ok' }
  }

  /** The sharer's display name (never an address), or null. */
  sharerName (p: CloudPrinter): string | null {
    return p.sharer?.display_name || p.shared_by || null
  }

  shareIdOf (p: AccountPrinter): string | null {
    return p.share_id ?? null
  }

  slugOf (p: CloudPrinter): string | null {
    return knownPrinters().find(t => t.kind === 'cloud' && t.printerId === p.id)?.slug ?? null
  }

  /** The printer's own People and access, where the owner manages it. */
  peopleTo (p: CloudPrinter): string | null {
    const slug = this.slugOf(p)
    return slug ? `${printerPath(slug, 'settings')}#access` : null
  }

  openTo (p: CloudPrinter): string | null {
    const slug = this.slugOf(p)
    return slug ? printerPath(slug) : null
  }

  readonly discoveryLevels: Array<{ value: DiscoveryLevel, label: string, help: string }> = [
    { value: 'open', label: 'Anyone on my network', help: 'Anyone on the same network can see this printer when they look for printers, signed in or not.' },
    { value: 'signed_in', label: 'Anyone signed in', help: 'Only people who are signed in to Muon3D can see this printer when they look for printers.' },
    { value: 'chosen', label: 'Just the people I share with', help: 'Only you and the people you have shared this printer with can see it.' },
    { value: 'link', label: 'Only with my invite link', help: 'Hidden from everyone except you, unless they open one of your invite links.' }
  ]

  discoveryHelp (level: DiscoveryLevel): string {
    return this.discoveryLevels.find(l => l.value === level)?.help ?? ''
  }

  /**
   * Saves through the console and shows what the console confirms. Nothing
   * changes on screen until it answers; a refusal puts the old level back and
   * shows the server's own words.
   */
  async changeDiscovery (p: CloudPrinter, event: Event) {
    const select = event.target as HTMLSelectElement
    const level = select.value as DiscoveryLevel
    const before = p.discovery
    const saved = await this.run(async () => {
      const answer = await cloudApi.setDiscovery(p.id, level)
      p.discovery = answer.level
    }, 'Saved. Who can find this printer has changed.')
    if (!saved) select.value = before ?? 'open'
  }

  async run (what: () => Promise<unknown>, done?: string): Promise<boolean> {
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await what()
      if (done) this.message = done
      return true
    } catch (error) {
      if (isMissing(error)) {
        this.message = 'Not available yet.'
        return false
      }
      this.error = describe(error)
      return false
    } finally {
      this.busy = false
    }
  }

  openJoin () {
    this.form.code = ''
    this.dialog = 'join'
  }

  get joinCode (): string | null {
    return normalizeJoinCode(this.form.code)
  }

  /** The join page shows the printer and asks before joining: this only takes you there. */
  join () {
    const code = this.joinCode
    if (!code) return
    this.dialog = ''
    this.$router.push({ path: '/join', query: { code } }).catch(() => {})
  }

  openRename (p: CloudPrinter) {
    this.renaming = p
    this.form.name = p.name
    this.dialog = 'rename'
  }

  async rename () {
    const p = this.renaming
    if (!p) return
    if (await this.run(() => cloudApi.renamePrinter(p.id, this.form.name.trim()))) {
      this.dialog = ''
      refreshPrinters().catch(() => {})
    }
  }

  async leave (p: AccountPrinter) {
    const shareId = p.share_id
    if (!shareId) return
    const owner = this.sharerName(p)
    const sure = await this.$confirm(`Your devices and your agents lose access to ${p.name}. Your files on it stay with ${owner ?? 'its owner'}. ${owner ?? 'The owner'} would need to invite you again.`, {
      title: `Leave ${p.name}?`,
      buttonTrueText: 'Leave',
      danger: true
    })
    if (!sure) return
    await this.run(() => accountApi.removeShare(p.id, shareId), `You've left ${p.name}.`)
    refreshPrinters().catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
  .prn__request {
    align-items: center;
  }

  .prn__grow {
    flex: 1 1 auto;
  }

  .prn__printer {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 0;
  }

  .prn__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .prn__shared {
    display: inline-flex;
    align-items: center;
    color: var(--m3d-text-muted);
  }

  .prn__discovery {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    margin-top: 6px;

    label {
      flex: none;
      color: var(--m3d-text-muted);
      font-size: 13px;
      white-space: nowrap;
    }

    .acct-subtle {
      flex-basis: 100%;
    }
  }

  // A native select with the browser chrome removed reads as plain text, so
  // it gets a border, a chevron and a hover state to show it can be opened.
  .prn__select-wrap {
    position: relative;
    display: inline-flex;
    min-width: 0;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      right: 12px;
      width: 7px;
      height: 7px;
      border-right: 1.5px solid var(--m3d-text-muted);
      border-bottom: 1.5px solid var(--m3d-text-muted);
      transform: translateY(-70%) rotate(45deg);
      pointer-events: none;
    }
  }

  .prn__select {
    min-width: 0;
    min-height: 32px;
    padding: 4px 34px 4px 10px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 8px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 13.5px;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.15s, background-color 0.15s;

    &:hover:not(:disabled) {
      border-color: var(--m3d-accent-border, var(--m3d-accent));
    }

    &:focus-visible {
      outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent));
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  .prn__go {
    color: var(--m3d-text) !important;
    text-decoration: none;
  }

  .prn__acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  @media (max-width: 760px) {
    .prn__printer {
      grid-template-columns: 48px minmax(0, 1fr);
    }

    .prn__printer > :nth-child(3) {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
