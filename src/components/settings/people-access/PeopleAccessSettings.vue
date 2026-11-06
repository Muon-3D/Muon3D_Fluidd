<template>
  <section
    id="access"
    class="pa"
    data-tid="people-access"
  >
    <header class="pa__head">
      <div>
        <h2>People and access</h2>
        <p>Who can use {{ printerName }} and what they can do.</p>
        <router-link
          :to="accountTo('printers')"
          class="pa-lnk"
          data-tid="pa-account-link"
        >
          Your own devices and apps are in Account<frame-icon
            name="chevronRight"
            small
          />
        </router-link>
      </div>
      <button
        v-if="viewer === 'owner' && cloudOwned"
        type="button"
        class="lib-btn lib-btn--pri"
        data-tid="pa-invite"
        @click="openInvite"
      >
        <frame-icon
          name="userPlus"
          small
        />Invite someone
      </button>
    </header>

    <p
      v-if="loading && !viewer"
      class="pa__muted"
      data-tid="pa-loading"
    >
      Reading who can use {{ printerName }}…
    </p>

    <p
      v-else-if="!viewer"
      class="pa__note"
      data-tid="pa-unknown"
    >
      {{ printerName }} didn't say who you are here. {{ printerError }}
    </p>

    <template v-else>
      <!-- You, the owner and how you're connected -->
      <div
        class="pa-list pa-own"
        data-tid="pa-you"
      >
        <div class="pa-row">
          <span class="pa-av pa-av--lg">{{ ownerLetter }}</span>
          <div class="pa-row__text">
            <span class="pa-eyebrow">Owner</span>
            <b data-tid="pa-owner">{{ ownerName }}</b>
            <span
              v-if="viewer !== 'owner' && youLine"
              data-tid="pa-you-line"
            >{{ youLine }}</span>
          </div>
        </div>
        <div class="pa-own__pills">
          <span
            class="lib-pill lib-pill--run"
            data-tid="pa-you-role"
          ><frame-icon
            name="user"
            small
          />You: {{ roleWord(viewer).toLowerCase() }}</span>
          <span class="lib-pill"><frame-icon
            :name="remote ? 'cloud' : 'home'"
            small
          />{{ routeText }}</span>
        </div>
      </div>

      <!-- Owner: people -->
      <template v-if="shows('people')">
        <div class="pa-gt">
          People · {{ peopleRows.length + 1 }}
        </div>
        <div
          class="pa-list"
          data-tid="pa-people"
        >
          <div class="pa-row">
            <span class="pa-av">{{ ownerLetter }}</span>
            <div class="pa-row__text">
              <b>{{ ownerName }} <span class="pa__muted">· you</span></b>
              <span v-if="ownerEmail">{{ ownerEmail }}</span>
            </div>
            <span class="lib-pill lib-pill--run">Owner</span>
          </div>
          <div
            v-for="row in peopleRows"
            :key="row.id"
            class="pa-row"
            data-tid="pa-person"
          >
            <span class="pa-av pa-av--b">{{ row.letter }}</span>
            <div class="pa-row__text">
              <b>{{ row.email }}</b>
              <span>{{ row.line }}</span>
            </div>
            <span class="pa-row__acts">
              <span class="lib-pill">{{ roleWord(row.role) }}</span>
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                :disabled="busy"
                data-tid="pa-person-role"
                @click="openRole(row)"
              >Change role</button>
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--danger"
                :disabled="busy"
                data-tid="pa-person-remove"
                @click="removePerson(row)"
              >Remove…</button>
            </span>
          </div>
          <div
            v-if="!peopleRows.length"
            class="pa-empty"
            data-tid="pa-people-empty"
          >
            <span class="pa-empty__ico"><frame-icon name="user" /></span>
            <b>Only you so far</b>
            <span>Invite someone to print or watch.</span>
            <button
              type="button"
              class="lib-btn lib-btn--pri lib-btn--sm"
              @click="openInvite"
            >
              Invite someone
            </button>
          </div>
        </div>
      </template>

      <!-- Owner: waiting for you -->
      <template v-if="shows('waiting')">
        <div class="pa-gt">
          Waiting for you · {{ waitingCount }}
        </div>
        <div
          class="pa-list"
          data-tid="pa-waiting"
        >
          <div
            v-for="request in approvals"
            :key="request.id"
            class="pa-row"
            data-tid="pa-request"
          >
            <span class="pa-av pa-av--d">{{ letterOf(request.requester && request.requester.email) }}</span>
            <div class="pa-row__text">
              <b>{{ (request.requester && request.requester.email) || 'Someone' }} wants to join as {{ roleWord(request.role) }}</b>
              <span>Used your invite link · lapses {{ day(request.expires_at) }}</span>
            </div>
            <span class="pa-row__acts">
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                :disabled="busy"
                data-tid="pa-request-refuse"
                @click="answer(request, false)"
              >Refuse</button>
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--pri"
                :disabled="busy"
                data-tid="pa-request-allow"
                @click="answer(request, true)"
              >Let in</button>
            </span>
          </div>
          <div
            v-for="invite in invites"
            :key="invite.id"
            class="pa-row"
            data-tid="pa-pending-invite"
          >
            <span class="pa-av pa-av--d">@</span>
            <div class="pa-row__text">
              <b>{{ invite.email }}</b>
              <span>Invited as {{ roleWord(invite.role) }} {{ day(invite.created_at) }} · not joined yet</span>
            </div>
            <span class="pa-row__acts">
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                :disabled="busy"
                data-tid="pa-invite-resend"
                @click="resend(invite)"
              >Resend</button>
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                :disabled="busy"
                data-tid="pa-invite-cancel"
                @click="cancelInvite(invite)"
              >Cancel invite</button>
            </span>
          </div>
        </div>
      </template>

      <!-- Owner: invite links -->
      <template v-if="shows('links')">
        <div class="pa-gt">
          Invite links · {{ links.length }}
        </div>
        <div
          class="pa-list"
          data-tid="pa-links"
        >
          <div
            v-for="link in links"
            :key="link.id"
            class="pa-row"
            data-tid="pa-link"
          >
            <span class="pa-ico"><frame-icon name="link" /></span>
            <div class="pa-row__text">
              <b class="pa-mono">{{ link.url || link.name || 'Invite link' }}</b>
              <span>{{ linkLine(link) }}</span>
            </div>
            <span class="pa-row__acts">
              <button
                v-if="link.url"
                type="button"
                class="lib-btn lib-btn--sm"
                @click="copy(link.url)"
              >Copy</button>
              <button
                type="button"
                class="lib-btn lib-btn--sm lib-btn--danger"
                :disabled="busy"
                data-tid="pa-link-end"
                @click="endLink(link)"
              >End</button>
            </span>
          </div>
        </div>
      </template>

      <!-- Owner: devices on this printer (J3, needs the printer) -->
      <template v-if="shows('devices')">
        <div class="pa-gt">
          Devices on this printer
        </div>
        <div
          class="pa-list"
          data-tid="pa-devices"
        >
          <div class="pa-row pa-row--soon">
            <span class="pa-ico"><frame-icon name="devices" /></span>
            <div class="pa-row__text">
              <b>Not available yet</b>
              <span>{{ printerName }} can't list the phones, browsers and agents it has let in yet, so they can't be removed from here.</span>
            </div>
          </div>
        </div>
        <div class="pa-gh">
          <span>Removing a device here will only remove it from {{ printerName }}.</span>
          <router-link
            :to="accountTo('devices')"
            class="pa-lnk"
            data-tid="pa-devices-account"
          >
            Manage your own devices in Account<frame-icon
              name="chevronRight"
              small
            />
          </router-link>
        </div>
      </template>

      <!-- Operator: the people, read-only -->
      <template v-if="shows('peopleReadOnly')">
        <div
          class="pa-list"
          data-tid="pa-people-readonly"
        >
          <div class="pa-row">
            <div class="pa-row__text">
              <b>People</b>
              <span>{{ ownerName }} (Owner), you ({{ roleWord(viewer) }}). The rest of the list isn't available yet.</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Member: what you can do -->
      <template v-if="shows('canDo')">
        <div
          class="pa-list"
          data-tid="pa-can-do"
        >
          <div class="pa-row">
            <div class="pa-row__text">
              <b>What you can do</b>
              <span>{{ canDoLine }}</span>
            </div>
          </div>
          <div
            v-if="shows('needToPrint')"
            class="pa-row"
            data-tid="pa-need-to-print"
          >
            <div class="pa-row__text">
              <b>Need to print?</b>
              <span>Only the owner can change your role. Ask {{ ownerFirstName }}.</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Operator: your devices here -->
      <template v-if="shows('yourDevices')">
        <div
          class="pa-list"
          data-tid="pa-your-devices"
        >
          <div class="pa-row">
            <span class="pa-ico"><frame-icon name="devices" /></span>
            <div class="pa-row__text">
              <b>Your devices</b>
              <span>The devices you use here, signed out or removed everywhere, are in Account.</span>
            </div>
            <router-link
              :to="accountTo('devices')"
              class="pa-lnk"
              data-tid="pa-your-devices-account"
            >
              In Account<frame-icon
                name="chevronRight"
                small
              />
            </router-link>
          </div>
        </div>
      </template>

      <!-- Owner: who can get in -->
      <template v-if="shows('entry') && state">
        <div class="pa-gt">
          Who can get in
        </div>
        <div
          class="pa-list"
          data-tid="pa-entry"
        >
          <div class="pa-row">
            <div class="pa-row__text">
              <b>This printer is</b>
              <span>Protected: only people you let in. Open: anyone on the same network is an Operator.</span>
            </div>
            <span
              :key="`entry-${renderKey}`"
              class="pa-seg"
              role="group"
              aria-label="Who can get in"
            >
              <button
                v-for="entry in ['open', 'protected']"
                :key="entry"
                type="button"
                :class="{ 'pa-seg--on': state.entry === entry }"
                :aria-pressed="state.entry === entry ? 'true' : 'false'"
                :disabled="busy"
                :data-tid="`pa-entry-${entry}`"
                @click="changeEntry(entry)"
              >{{ entry === 'open' ? 'Open' : 'Protected' }}</button>
            </span>
          </div>
          <div class="pa-row pa-row--soon">
            <div class="pa-row__text">
              <b>Allow new devices to ask</b>
              <span>Not available yet: a new phone or browser asking, accepted on the printer's screen or your phone.</span>
            </div>
          </div>
          <div class="pa-row">
            <div class="pa-row__text">
              <b>Where prints go</b>
              <span>One shared drive, a drive for each person, or both.</span>
            </div>
            <select
              :key="`data-${renderKey}`"
              class="pa-select"
              :value="state.dataMode"
              :disabled="busy"
              aria-label="Where prints go"
              data-tid="pa-data"
              @change="changeData"
            >
              <option value="shared">
                One shared drive
              </option>
              <option value="accounts">
                A drive for each person
              </option>
              <option value="both">
                Both
              </option>
            </select>
          </div>
          <div class="pa-row">
            <div class="pa-row__text">
              <b>Private uploads</b>
              <span>Others can't see or reprint someone's uploads. It doesn't hide a file from someone holding the printer.</span>
            </div>
            <toggle-switch
              :key="`private-${renderKey}`"
              :value="state.privateUploads"
              label="Private uploads"
              :disabled="busy"
              data-tid="pa-private"
              @input="apply(() => client.setPrivateUploads(!!$event))"
            />
          </div>
        </div>
      </template>

      <!-- Owner, from away: the printer lets its own screen be asked (protection: ask) -->
      <template v-if="shows('askAtPrinter') && state">
        <div class="pa-gt">
          Who can get in
        </div>
        <div
          class="pa-list"
          data-tid="pa-ask-at-printer"
        >
          <div class="pa-row">
            <div class="pa-row__text">
              <b>This printer is {{ state.entry === 'open' ? 'Open' : 'Protected' }}</b>
              <span>From here, changing it is asked at the printer's own screen, which shows a code to compare.</span>
            </div>
            <button
              type="button"
              class="lib-btn lib-btn--sm"
              :disabled="busy"
              data-tid="pa-ask-at-printer-button"
              @click="askAtPrinter"
            >
              Ask at the printer
            </button>
          </div>
        </div>
      </template>

      <!-- Owner: the role table -->
      <template v-if="shows('roles')">
        <div class="pa-gt">
          What each role can do
        </div>
        <div
          class="pa-list pa-roles"
          data-tid="pa-roles"
        >
          <div
            v-for="row in roleTable"
            :key="row.id"
            class="pa-row"
            :data-role-row="row.id"
          >
            <span class="pa-row__text">{{ row.label }}</span>
            <span class="pa-who">
              <span
                v-for="role in ['owner', 'operator', 'viewer']"
                :key="role"
                :class="{ 'pa-who--y': roleHas(row, role) }"
              >{{ roleWord(role) }}</span>
            </span>
          </div>
        </div>
        <p
          v-if="state && state.levelsPreset"
          class="pa-gh"
          data-tid="pa-roles-preset"
        >
          This is the table Muon printers move to. Until {{ printerName }}'s software fixes its levels to it, its own "{{ presetWord }}" preset decides.
        </p>
      </template>

      <!-- Owner: for older tools -->
      <template v-if="shows('olderTools')">
        <div class="pa-gt">
          For older tools
        </div>
        <div
          class="pa-list"
          data-tid="pa-older-tools"
        >
          <div class="pa-row">
            <span class="pa-ico"><frame-icon name="key" /></span>
            <div class="pa-row__text">
              <b>Moonraker API key</b>
              <span>For tools that predate Muon3D accounts. Full access, no end date. Turning it off isn't available yet.</span>
            </div>
            <button
              type="button"
              class="lib-btn lib-btn--sm"
              data-tid="pa-api-key"
              @click="apiKeyOpen = true"
            >
              Show
            </button>
          </div>
        </div>
      </template>

      <!-- Owner: developer mode, and unlink -->
      <div
        v-if="shows('developer') || shows('unlink')"
        class="pa-list pa-last"
      >
        <router-link
          v-if="shows('developer')"
          :to="developerTo"
          class="pa-row pa-row--link"
          data-tid="pa-developer"
        >
          <span class="pa-ico"><frame-icon name="code" /></span>
          <div class="pa-row__text">
            <b>Developer mode</b>
            <span>{{ developerLine }}</span>
          </div>
          <frame-icon
            name="chevronRight"
            small
          />
        </router-link>
        <div
          v-if="shows('unlink')"
          class="pa-row"
          data-tid="pa-unlink"
        >
          <span class="pa-ico pa-ico--red"><frame-icon name="link" /></span>
          <div class="pa-row__text">
            <b class="pa-red">Unlink {{ accountPrinterName }} from your account</b>
            <span>Everyone you share it with loses access. It keeps working on your network.</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm lib-btn--danger"
            :disabled="busy"
            data-tid="pa-unlink-button"
            @click="unlink"
          >
            Unlink…
          </button>
        </div>
      </div>

      <!-- Member: leave -->
      <template v-if="shows('leave')">
        <div
          class="pa-list"
          data-tid="pa-leave"
        >
          <div class="pa-row">
            <div class="pa-row__text">
              <b class="pa-red">Leave {{ accountPrinterName }}</b>
              <span v-if="!shareId">Leaving from here isn't available yet for this printer.</span>
            </div>
            <button
              v-if="shareId"
              type="button"
              class="lib-btn lib-btn--sm lib-btn--danger"
              :disabled="busy"
              data-tid="pa-leave-button"
              @click="leave"
            >
              Leave…
            </button>
          </div>
        </div>
      </template>

      <p
        v-if="viewer !== 'owner'"
        class="pa-lock"
        data-tid="pa-lock"
      >
        <frame-icon
          name="lock"
          small
        />
        {{ lockLine }}
      </p>
    </template>

    <p
      v-if="signInHint"
      class="pa__note"
      data-tid="pa-sign-in"
    >
      Sign in to manage people on {{ printerName }}: who's in, invites and links are kept with the owner's account.
      <router-link
        to="/sign-in"
        class="pa-lnk"
      >
        Sign in
      </router-link>
    </p>

    <p
      v-if="message"
      class="pa__note"
      role="status"
      data-tid="pa-message"
    >
      {{ message }}
    </p>

    <m3-dialog
      :value="dialog === 'invite'"
      :title="`Invite someone to ${accountPrinterName}`"
      :persistent="busy"
      max-width="460"
      @close="dialog = ''"
    >
      <p class="m3-dlg__text">
        By email: it appears in their account, and you can take it back any time.
      </p>
      <span
        class="pa-seg pa-seg--dlg"
        role="group"
        aria-label="How"
      >
        <button
          type="button"
          class="pa-seg--on"
          aria-pressed="true"
        >Email</button>
        <button
          type="button"
          disabled
          data-tid="pa-invite-link-tab"
          title="Making invite links from Control isn't available yet"
        >Link (not available yet)</button>
      </span>
      <label class="m3-field">
        <span class="m3-field__label">Email</span>
        <span class="m3-field__box"><input
          v-model="form.email"
          type="email"
          aria-label="Email"
          data-tid="pa-invite-email"
        ></span>
      </label>
      <div class="m3-field">
        <span class="m3-field__label">They can</span>
        <div class="pa-opt">
          <button
            v-for="role in ['operator', 'viewer']"
            :key="role"
            type="button"
            :class="{ 'pa-opt--on': form.role === role }"
            :aria-pressed="form.role === role ? 'true' : 'false'"
            :data-tid="`pa-invite-${role}`"
            @click="form.role = role"
          >
            <b>{{ roleWord(role) }}</b><span>{{ role === 'operator' ? 'Print, heat and move' : 'Watch only' }}</span>
          </button>
        </div>
      </div>
      <label class="m3-field">
        <span class="m3-field__label">Access ends <span class="pa__muted">(leave empty for never)</span></span>
        <span class="m3-field__box"><input
          v-model="form.until"
          type="date"
          aria-label="Access ends"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
        role="alert"
      >
        {{ dialogError }}
      </p>
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
          :disabled="!form.email.includes('@') || busy"
          data-tid="pa-invite-send"
          @click="invite"
        >
          Send invite
        </button>
      </template>
    </m3-dialog>

    <m3-dialog
      :value="dialog === 'role'"
      title="Change role"
      :persistent="busy"
      @close="dialog = ''"
    >
      <p class="m3-dlg__text">
        What {{ changing && changing.email }} can do on {{ accountPrinterName }}.
      </p>
      <div class="pa-opt">
        <button
          v-for="role in ['operator', 'viewer']"
          :key="role"
          type="button"
          :class="{ 'pa-opt--on': form.role === role }"
          :aria-pressed="form.role === role ? 'true' : 'false'"
          :data-tid="`pa-role-${role}`"
          @click="form.role = role"
        >
          <b>{{ roleWord(role) }}</b><span>{{ role === 'operator' ? 'Print, heat and move' : 'Watch only' }}</span>
        </button>
      </div>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
        role="alert"
      >
        {{ dialogError }}
      </p>
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
          :disabled="busy || !changing || form.role === changing.role"
          data-tid="pa-role-save"
          @click="changeRole"
        >
          Save role
        </button>
      </template>
    </m3-dialog>

    <api-key-dialog
      v-if="apiKeyOpen"
      v-model="apiKeyOpen"
    />

    <access-request-dialog
      v-if="askingOpen && asking"
      v-model="askingOpen"
      :client="client"
      :ask="asking"
      :printer-name="printerName"
      @answered="refresh"
    />
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import ApiKeyDialog from '@/components/settings/auth/ApiKeyDialog.vue'
import AccessRequestDialog from '@/components/muon-access/AccessRequestDialog.vue'
import { connectedEndpointId, sameEndpoint } from '@/services/people-access/identity'
import {
  currentPrinterAccess,
  type AccessAsk,
  type AccessEntry,
  type AccessState,
  type DataMode,
  type Capability
} from '@/services/muon-access/api'
import { cloudApi, type CloudPrinter } from '@/services/muon-cloud/api'
import { cloudState, refreshPrinters } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { remoteRouteLabel } from '@/services/muon-ble/link'
import { accountApi, type InviteLink, type JoinApproval, type PrinterInvite, type PrinterShare } from '@/services/account/api'
import { accountState, describe, loadApprovals } from '@/services/account/state'
import { isMissing } from '@/services/account/client'
import { dayText } from '@/services/account/model'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'
import type { InstanceConfig } from '@/store/config/types'
import {
  ROLE_TABLE,
  ROLE_WORDS,
  accessViewer,
  accountAccessPath,
  printerGroups,
  roleSummary,
  type AccessViewer,
  type AccountAccessSection,
  type PrinterGroup,
  type RoleRow
} from '@/services/people-access/model'
import '@/scss/muon3d-account.scss'

interface PersonRow {
  id: string;
  email: string;
  letter: string;
  role: string;
  endsAt: number | null;
  line: string;
}

const PRESET_WORDS: Record<string, string> = { relaxed: 'Relaxed', standard: 'Standard', strict: 'Strict' }

/**
 * Settings › People and access on a Muon printer (Control v3,
 * PEOPLE-ACCESS.md, `access-printer`): the owner, the people and what each
 * role can do, the join requests, invites and links waiting, the entry and
 * file rules, the older-tools key, developer mode's row and Unlink. A member
 * sees their own role, what they can do and Leave; the owner's groups are
 * hidden from them, not greyed.
 *
 * Nothing here decides who may do what. What this browser is comes from the
 * printer (`muon_access` capabilities) and then the console; every change is
 * the printer's or the console's own call, which refuses what it must.
 */
@Component({ components: { M3Dialog, ToggleSwitch, ApiKeyDialog, AccessRequestDialog } })
export default class PeopleAccessSettings extends Mixins(MuonGatesMixin) {
  client = currentPrinterAccess()
  state: AccessState | null = null
  capabilities: Record<string, Capability> = {}
  printerError = ''
  loading = false
  busy = false
  message = ''
  dialog: '' | 'invite' | 'role' = ''
  dialogError = ''
  form = { email: '', role: 'viewer', until: '' }
  changing: PersonRow | null = null
  shares: PrinterShare[] = []
  invites: PrinterInvite[] = []
  links: InviteLink[] = []
  apiKeyOpen = false
  renderKey = 0
  /** The EndpointId the connected printer reports about itself, read with the rest. */
  reportedEndpoint: string | null = null
  asking: AccessAsk | null = null
  /** The ask dialog is mounted only while open, so closing it withdraws the request. */
  askingOpen = false

  mounted () {
    this.refresh()
  }

  /**
   * Which printer the answers belong to. Everything read is that printer's:
   * a switch to another printer, or a reconnect, drops it and reads again, and
   * an answer that arrives for the previous printer is ignored.
   */
  get printerKey (): string {
    return `${this.$store.state.config.apiUrl ?? ''}|${this.cloudPrinterId ?? ''}`
  }

  @Watch('printerKey')
  onPrinterChange () {
    this.forget()
    this.refresh()
  }

  @Watch('socketConnected')
  onReconnect (connected: boolean) {
    if (connected) this.refresh()
    else this.forget()
  }

  /** Nothing known: no owner, role, rules or lists, so nothing owner-only shows. */
  forget () {
    this.state = null
    this.capabilities = {}
    this.reportedEndpoint = null
    this.shares = []
    this.invites = []
    this.links = []
    this.dialog = ''
    this.changing = null
    this.apiKeyOpen = false
    this.askingOpen = false
    this.asking = null
  }

  /** The account's name for the printer acted on: what every console action and its confirm names. */
  get accountPrinterName (): string {
    return this.cloudPrinter?.name ?? this.printerName
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name || 'This printer'
  }

  /** The account's printer Fluidd is on: through Muon3D, or a saved one that said its EndpointId. */
  get cloudPrinterId (): string | null {
    const apiUrl: string = this.$store.state.config.apiUrl
    if (!apiUrl) return null
    if (isManagedApiUrl(apiUrl)) return cloudState.activePrinterId
    const instances = (this.$store.state.config.instances ?? []) as InstanceConfig[]
    return instances.find(i => i.apiUrl === apiUrl)?.endpointId ?? null
  }

  /**
   * The account's record of the printer connected, only once that printer has
   * said it is that one. Through Muon3D the connection is to that id; on the
   * network a saved address can belong to another printer now (DHCP), so the
   * printer's own EndpointId must match, or the console's groups stay hidden
   * and nothing is sent to the wrong printer's people. Names aren't compared:
   * renaming in Account doesn't rename the printer's own screen.
   */
  get cloudPrinter (): (CloudPrinter & { share_id?: string }) | null {
    if (!cloudState.account) return null
    const id = this.cloudPrinterId
    const record = id ? cloudState.printers.find(p => p.id === id) ?? null : null
    if (!record) return null
    if (isManagedApiUrl(this.$store.state.config.apiUrl)) return record
    return sameEndpoint(record.id, this.reportedEndpoint) ? record : null
  }

  /** Owner, operator or viewer: the printer's owner and your level there, else the console. Never from "may manage access". */
  get viewer (): AccessViewer | null {
    const printer = this.state ? { owner: this.state.owner, level: this.state.you.level, role: this.state.you.role } : null
    const cloud = this.cloudPrinter ? { shared: !!this.cloudPrinter.shared, role: this.cloudPrinter.role } : null
    return accessViewer(printer, cloud, cloudState.account?.email ?? null)
  }

  /**
   * The printer lets this browser change its rules now: the shared gate
   * (`canManageAccess`, #296) and this page's own read for this printer must
   * both say yes. Refused, failed, unknown or not yet asked is no.
   */
  get canManage (): boolean {
    return this.canManageAccess === true && this.capabilities.protection === 'allowed'
  }

  /** The console's owner calls apply: a printer this account linked. */
  get cloudOwned (): boolean {
    return !!this.cloudPrinter && !this.cloudPrinter.shared
  }

  get approvals (): JoinApproval[] {
    const id = this.cloudPrinter?.id
    return (accountState.approvals ?? []).filter(a => a.printer_id === id && a.state === 'pending')
  }

  get waitingCount (): number {
    return this.approvals.length + this.invites.length
  }

  get groups (): PrinterGroup[] {
    if (!this.viewer) return []
    return printerGroups(this.viewer, {
      cloud: this.viewer === 'owner' ? this.cloudOwned : !!this.cloudPrinter,
      canManage: this.canManage,
      waiting: this.waitingCount,
      links: this.links.length,
      olderTools: this.$store.getters['server/componentSupport']('authorization') as boolean,
      canAsk: !!this.state && this.capabilities.protection === 'ask'
    })
  }

  shows (group: PrinterGroup): boolean {
    return this.groups.includes(group)
  }

  roleWord (role: string): string {
    return ROLE_WORDS[role as AccessViewer] ?? role
  }

  letterOf (text: string | null | undefined): string {
    return (text || '?').charAt(0).toUpperCase()
  }

  day (seconds: number): string {
    return dayText(seconds)
  }

  get ownerName (): string {
    if (this.viewer === 'owner' && cloudState.account) return cloudState.account.name || cloudState.account.email
    const owner = this.state?.owner
    if (owner?.name) return owner.name
    if (owner?.email) return owner.email
    const sharer = this.cloudPrinter?.sharer?.display_name || this.cloudPrinter?.shared_by
    if (sharer) return sharer
    if (owner?.kind === 'none') return 'No owner yet'
    return 'Not known yet'
  }

  get ownerFirstName (): string {
    const name = this.ownerName
    return name === 'Not known yet' || name === 'No owner yet' ? 'the owner' : name.split(/[\s@]/)[0]
  }

  get ownerEmail (): string {
    if (this.viewer === 'owner' && cloudState.account) return cloudState.account.email
    return this.state?.owner.email ?? ''
  }

  get ownerLetter (): string {
    return this.letterOf(this.ownerName)
  }

  get youLine (): string {
    const ends = this.cloudPrinter?.ends_at
    return `You're ${this.viewer === 'operator' ? 'an Operator' : 'a Viewer'}${ends ? ` until ${dayText(ends)}` : ''}`
  }

  get remote (): boolean {
    return !!cloudState.activePrinterId && isManagedApiUrl(this.$store.state.config.apiUrl)
  }

  /** How this browser reached the printer, as the rest of Control words it. */
  get routeText (): string {
    return this.remote ? remoteRouteLabel(cloudState.activePrinterId) : 'On this network'
  }

  get canDoLine (): string {
    return roleSummary(this.viewer ?? 'viewer')
  }

  get roleTable () {
    return ROLE_TABLE
  }

  get presetWord (): string {
    const preset = this.state?.levelsPreset ?? ''
    return PRESET_WORDS[preset] ?? preset
  }

  get lockLine (): string {
    return this.viewer === 'viewer'
      ? "Viewers don't see the list of people. The owner's settings are hidden."
      : 'Invites, requests, links, devices, rules and the key are the owner\'s and are hidden.'
  }

  get peopleRows (): PersonRow[] {
    return this.shares.map(s => ({
      id: s.id,
      email: s.email,
      letter: this.letterOf(s.email),
      role: s.role,
      endsAt: s.ends_at ?? null,
      line: s.ends_at ? `Access ends ${dayText(s.ends_at)}` : s.accepted === false ? 'Not signed in yet' : `Since ${dayText(s.created_at)}`
    }))
  }

  get shareId (): string | null {
    return this.cloudPrinter?.share_id ?? null
  }

  get developerLine (): string {
    // The gate's answer for this printer (devModeState is one global that can hold another printer's).
    const state = this.devModeEnabled ? 'On. ' : ''
    return `${state}The first time it's turned on, the printer's screen confirms it.`
  }

  get developerTo (): string {
    const slug = activeSlug()
    return `${slug ? `/${slug}` : ''}/settings#developer`
  }

  accountTo (section: AccountAccessSection): string {
    return accountAccessPath(section)
  }

  linkLine (link: InviteLink): string {
    const parts = [this.roleWord(link.role)]
    if (link.max_uses === 1) parts.push('single use')
    else if (link.max_uses) parts.push(`${link.uses ?? 0} of ${link.max_uses} uses`)
    parts.push(link.expires_at ? `ends ${dayText(link.expires_at)}` : 'no end date')
    if (link.approve_each) parts.push('you let each person in')
    return parts.join(' · ')
  }

  async refresh () {
    const key = this.printerKey
    this.loading = true
    let state: AccessState | null = null
    let capabilities: Record<string, Capability> = {}
    let printerError = ''
    const managed = isManagedApiUrl(this.$store.state.config.apiUrl)
    const endpoint = managed ? Promise.resolve(null) : connectedEndpointId()
    try {
      [state, capabilities] = await Promise.all([this.client.get(), this.client.capabilities()])
    } catch (error) {
      // A refusal or failure (403, timeout, 5xx) is "not allowed": nothing it would gate shows.
      state = null
      capabilities = {}
      printerError = (error as Error).message
    }
    if (cloudState.account) await refreshPrinters().catch(() => {})
    const reported = await endpoint
    if (key !== this.printerKey) return
    this.reportedEndpoint = reported
    this.state = state
    this.capabilities = capabilities
    this.printerError = printerError
    this.loading = false
    this.renderKey++
    await this.refreshCloud()
  }

  /** The console's people, invites, links and requests for this printer: its owner's only. */
  async refreshCloud () {
    const key = this.printerKey
    const p = this.cloudPrinter
    if (!p || p.shared || this.viewer !== 'owner') return
    loadApprovals().catch(() => {})
    const [shares, invites, links] = await Promise.all([
      accountApi.shares(p.id).then(r => r.shares).catch(() => []),
      accountApi.invites(p.id).then(r => r.invites).catch(() => []),
      accountApi.links(p.id).then(r => r.links).catch(() => [])
    ])
    if (key !== this.printerKey) return
    this.shares = shares
    this.invites = invites
    this.links = links
  }

  async run (what: () => Promise<unknown>, done?: string, inDialog = false): Promise<boolean> {
    this.busy = true
    this.message = ''
    this.dialogError = ''
    try {
      await what()
      if (done) this.message = done
      return true
    } catch (error) {
      const text = isMissing(error) ? 'Not available yet.' : describe(error)
      if (inDialog) this.dialogError = text
      else this.message = text
      return false
    } finally {
      this.busy = false
    }
  }

  /** A printer setting: says plainly when the printer did not take it, then shows what it holds. */
  async apply (change: () => Promise<boolean>) {
    await this.run(async () => {
      if (!await change()) throw new Error('Not changed: only the owner can change this.')
    })
    await this.refresh()
  }

  changeEntry (entry: string) {
    if (!this.state || this.state.entry === entry || (entry !== 'open' && entry !== 'protected')) return
    const chosen = entry as AccessEntry
    return this.apply(() => this.client.setEntry(chosen))
  }

  changeData (event: Event) {
    const mode = (event.target as HTMLSelectElement).value
    if (mode !== 'shared' && mode !== 'accounts' && mode !== 'both') return
    const chosen = mode as DataMode
    return this.apply(() => this.client.setData(chosen))
  }

  roleHas (row: RoleRow, role: string): boolean {
    return role === 'owner' || role === 'operator' || role === 'viewer' ? row[role] : false
  }

  openInvite () {
    this.form = { email: '', role: 'viewer', until: '' }
    this.dialogError = ''
    this.dialog = 'invite'
  }

  async invite () {
    const p = this.cloudPrinter
    if (!p) return
    const email = this.form.email.trim()
    const endsAt = this.form.until ? Math.floor(new Date(`${this.form.until}T23:59:59`).getTime() / 1000) : null
    if (await this.run(() => accountApi.share(p.id, email, this.form.role, endsAt), `${email} can use ${p.name}. We've emailed them.`, true)) {
      this.dialog = ''
      this.refreshCloud()
    }
  }

  openRole (row: PersonRow) {
    this.changing = row
    this.form.role = row.role
    this.dialogError = ''
    this.dialog = 'role'
  }

  async changeRole () {
    const p = this.cloudPrinter
    const row = this.changing
    if (!p || !row) return
    const role = this.form.role
    if (await this.run(() => accountApi.share(p.id, row.email, role, row.endsAt), `${row.email} is ${role === 'viewer' ? 'a Viewer' : 'an Operator'} now.`, true)) {
      this.dialog = ''
      this.changing = null
      this.refreshCloud()
    }
  }

  async removePerson (row: PersonRow) {
    const p = this.cloudPrinter
    if (!p) return
    const key = this.printerKey
    const sure = await this.$confirm(`${row.email} loses access to ${p.name} now, from every device. Their account and other printers aren't touched.`, {
      title: `Remove ${row.email} from ${p.name}?`,
      buttonTrueText: 'Remove',
      danger: true
    })
    if (!sure || !this.stillOn(key, p.id)) return
    await this.run(() => accountApi.removeShare(p.id, row.id), `${row.email} can't use ${p.name} any more.`)
    this.refreshCloud()
  }

  async answer (request: JoinApproval, allow: boolean) {
    const who = request.requester?.email ?? 'Someone'
    await this.run(() => accountApi.answerApproval(request.id, allow), allow ? `${who} can use ${this.printerName} now.` : 'Refused.')
    await loadApprovals().catch(() => {})
    this.refreshCloud()
  }

  async resend (invite: PrinterInvite) {
    const p = this.cloudPrinter
    if (!p) return
    await this.run(() => accountApi.sendInvite(p.id, invite.email, invite.role, invite.ends_at), `Invitation sent to ${invite.email}.`)
    this.refreshCloud()
  }

  async cancelInvite (invite: PrinterInvite) {
    const p = this.cloudPrinter
    if (!p) return
    const key = this.printerKey
    const sure = await this.$confirm(`${invite.email} won't be able to join ${p.name} with it.`, {
      title: `Cancel this invite to ${p.name}?`,
      buttonTrueText: 'Cancel invite',
      danger: true
    })
    if (!sure || !this.stillOn(key, p.id)) return
    await this.run(() => accountApi.withdrawInvite(p.id, invite.id), 'Invite cancelled.')
    this.refreshCloud()
  }

  async endLink (link: InviteLink) {
    await this.run(() => accountApi.revokeLink(link.printer_id, link.id), 'That invite link no longer works. People who joined with it keep their access.')
    this.refreshCloud()
  }

  async copy (text: string) {
    try {
      await navigator.clipboard.writeText(text)
      this.message = 'Link copied.'
    } catch {
      this.message = "Copying didn't work in this browser."
    }
  }

  async unlink () {
    const p = this.cloudPrinter
    if (!p) return
    const key = this.printerKey
    const sure = await this.$confirm(`${p.name} leaves your account: you can't reach it from outside your home, and everyone you share it with loses access. It keeps working on your network, and you can link it again at its screen.`, {
      title: `Unlink ${p.name}?`,
      buttonTrueText: 'Unlink',
      danger: true
    })
    if (!sure || !this.stillOn(key, p.id)) return
    if (await this.run(() => cloudApi.unlinkPrinter(p.id), `${p.name} is unlinked.`)) await refreshPrinters().catch(() => {})
  }

  async leave () {
    const p = this.cloudPrinter
    const shareId = this.shareId
    if (!p || !shareId) return
    const key = this.printerKey
    const sure = await this.$confirm(`You'll lose access to ${p.name} from all your devices. ${this.ownerFirstName === 'the owner' ? 'The owner' : this.ownerFirstName} would need to invite you again. The owner can't leave; they unlink instead.`, {
      title: `Leave ${p.name}?`,
      buttonTrueText: 'Leave',
      danger: true
    })
    if (!sure || !this.stillOn(key, p.id)) return
    if (await this.run(() => accountApi.removeShare(p.id, shareId), `You've left ${p.name}.`)) await refreshPrinters().catch(() => {})
  }

  /** After a confirm: still the same printer, still that account printer. A switch while it was open cancels the action. */
  stillOn (key: string, printerId: string): boolean {
    return key === this.printerKey && this.cloudPrinter?.id === printerId
  }

  /** The printer lets this browser ask its own screen to change who can get in (protection: ask). */
  askAtPrinter () {
    if (!this.state) return
    this.asking = { kind: 'entry', entry: this.state.entry === 'open' ? 'protected' : 'open' }
    this.askingOpen = true
  }

  /** Signed out on a printer an account owns: the owner's groups need the owner signed in. */
  get signInHint (): boolean {
    return !cloudState.account && this.state?.owner.kind === 'account'
  }
}
</script>

<style lang="scss" scoped>
  .pa {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .pa__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;

    h2 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
    }

    a {
      color: var(--m3d-accent);
    }
  }

  .pa__muted {
    color: var(--m3d-text-muted);
    font-weight: 500;
  }

  .pa__note {
    margin: 12px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .pa-gt {
    margin: 22px 0 8px;
    color: var(--m3d-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pa-list {
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md, 16px);
    background: var(--m3d-surface);
    overflow: hidden;

    & + & {
      margin-top: 12px;
    }
  }

  .pa-list > * + * {
    border-top: 1px solid var(--m3d-border);
  }

  .pa-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 10px 16px;
    color: var(--m3d-text);
    text-decoration: none;
  }

  .pa-row--link:hover {
    background: var(--m3d-hover);
  }

  .pa-row__text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .pa-row__acts {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .pa-row--soon .pa-row__text b {
    color: var(--m3d-text-muted);
  }

  .pa-own {
    padding-bottom: 12px;

    .pa-row {
      border: 0;
    }
  }

  .pa-own__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px;
    border: 0 !important;
  }

  .pa-eyebrow {
    color: var(--m3d-text-subtle) !important;
    font-size: 11px !important;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pa-av {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 700;
  }

  .pa-av--lg {
    width: 48px;
    height: 48px;
    font-size: 18px;
  }

  .pa-av--b {
    background: var(--m3d-fill-2);
    color: var(--m3d-text);
  }

  .pa-av--d {
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
  }

  .pa-ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
  }

  .pa-ico--red,
  .pa-red {
    color: var(--m3d-danger) !important;
  }

  .pa-mono {
    font-family: var(--m3d-font-mono);
  }

  .pa-gh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    margin: 8px 2px 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .pa-lnk {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 2px;
    color: var(--m3d-accent) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .pa-seg {
    display: inline-flex;
    flex: none;
    padding: 2px;
    border-radius: var(--m3d-radius-pill, 999px);
    background: var(--m3d-fill);

    button {
      min-height: 30px;
      padding: 0 12px;
      border-radius: var(--m3d-radius-pill, 999px);
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 600;
    }

    button:disabled {
      opacity: 0.6;
    }

    .pa-seg--on {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }

  .pa-seg--dlg {
    margin-bottom: 8px;
  }

  .pa-select {
    flex: none;
    min-height: 32px;
    padding: 4px 10px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 8px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 13px;
  }

  .pa-roles .pa-row {
    min-height: 44px;
  }

  .pa-who {
    display: flex;
    flex: none;
    gap: 4px;

    span {
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--m3d-fill-2);
      color: var(--m3d-text-subtle);
      font-size: 11px;
      font-weight: 700;
    }

    .pa-who--y {
      background: var(--m3d-accent-soft);
      color: var(--m3d-accent);
    }
  }

  .pa-opt {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    button {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 12px;
      border-radius: 14px;
      background: var(--m3d-fill-2);
      color: var(--m3d-text);
      text-align: left;

      span {
        color: var(--m3d-text-muted);
        font-size: 12px;
      }
    }

    .pa-opt--on {
      background: var(--m3d-accent-soft);
      box-shadow: inset 0 0 0 1px var(--m3d-accent-line, var(--m3d-accent));
    }
  }

  .pa-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 24px 16px;
    color: var(--m3d-text-muted);
    text-align: center;

    b {
      color: var(--m3d-text);
    }

    button {
      margin-top: 10px;
    }
  }

  .pa-empty__ico {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin-bottom: 6px;
    border-radius: 12px;
    background: var(--m3d-fill);
  }

  .pa-last {
    margin-top: 16px;
  }

  .pa-lock {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 12px 2px 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }
</style>
