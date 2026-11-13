<!--
  An invite link (AB-CON-1, muon-link-cloud#14): the console sends /j/<code>
  here as /#/join?code=<code>.

  Signed out, the page asks the person to sign in, which on the console's
  own page goes through its /authorize and comes back here. Signed in, Join
  posts the code, and the page says the printer was joined, or that it is
  waiting for the owner to approve, which it then follows until the owner
  answers or the request expires.

  Join is a press, not something the page does on opening: following a link
  someone sent should not by itself put a printer into the account.
-->
<template>
  <div class="muon-join-landing">
    <landing-card
      :icon="card.icon"
      :tone="card.tone"
      :title="card.title"
      :sub="card.sub"
    >
      <p
        v-if="!code"
        data-tid="join-bad-code"
      >
        This invite link is incomplete. Open it again from the message it came in, or ask the printer's owner for a new one.
      </p>

      <p
        v-else-if="!signedIn"
        data-tid="join-sign-in"
      >
        Sign in to your Muon3D account to join the printer this link was made for.
      </p>

      <template v-else-if="!state || state.kind === 'error'">
        <div
          class="muon-join-landing__invite"
          data-tid="join-invite"
        >
          <span class="muon-join-landing__invite-icon"><frame-icon name="printers" /></span>
          <span>
            <b>An invite to a shared printer</b>
            <span class="muon-join-landing__muted">Invite code <strong class="muon-join-landing__code">{{ groupedCode }}</strong></span>
          </span>
        </div>
        <p
          v-if="state"
          class="muon-join-landing__error"
          role="alert"
          data-tid="join-error"
        >
          {{ state.message }}
        </p>
      </template>

      <p
        v-else-if="state.kind === 'joined'"
        data-tid="join-joined"
      >
        You've joined {{ joinedName }}. It's in your printer list now.
      </p>

      <p
        v-else-if="state.kind === 'pending'"
        data-tid="join-pending"
      >
        Waiting for the owner of {{ state.printerName }} to approve. You can leave this page; the printer appears in your list once they do.
      </p>

      <p
        v-else-if="state.kind === 'refused'"
        data-tid="join-refused"
      >
        The owner of {{ state.printerName }} did not approve this request.
      </p>

      <p
        v-else-if="state.kind === 'expired'"
        data-tid="join-expired"
      >
        The owner of {{ state.printerName }} did not answer in time. Ask them for a new invite link.
      </p>

      <template #foot>
        <button
          v-if="code && !signedIn"
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="join-sign-in-button"
          @click="accountDialog = true"
        >
          Sign in
        </button>
        <template v-else-if="code && (!state || state.kind === 'error')">
          <button
            type="button"
            class="lib-btn lib-btn--ghost"
            data-tid="join-not-now"
            @click="$router.push('/')"
          >
            Not now
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--pri"
            :disabled="busy"
            :aria-busy="busy ? 'true' : undefined"
            data-tid="join-button"
            @click="join"
          >
            {{ busy ? 'Joining…' : 'Accept invite' }}
          </button>
        </template>
        <button
          v-else
          type="button"
          class="lib-btn"
          :class="{ 'lib-btn--pri': state && state.kind === 'joined' }"
          data-tid="join-open"
          @click="$router.push('/')"
        >
          {{ state && state.kind === 'joined' ? 'Open your printers' : 'Back to printers' }}
        </button>
      </template>
    </landing-card>
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudApi } from '@/services/muon-cloud/api'
import { cloudState, printerName, refreshPrinters } from '@/services/muon-cloud/state'
import { fromApproval, fromJoinAnswer, fromJoinError, normalizeJoinCode, type JoinState } from '@/services/muon-cloud/join'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LandingCard from '@/components/ui/LandingCard.vue'
import FrameIcon from '@/components/ui/FrameIcon.vue'

interface Card { icon: string, tone: 'accent' | 'ok' | 'warn' | 'danger' | 'muted', title: string, sub: string }

/** How often to ask whether the owner has answered. */
export const APPROVAL_POLL_MS = 10_000

@Component({ components: { CloudAccountDialog, LandingCard, FrameIcon } })
export default class JoinLanding extends Vue {
  accountDialog = false
  busy = false
  state: JoinState | null = null
  timer: number | null = null
  left = false

  get code (): string | null {
    return normalizeJoinCode(this.$route.query.code)
  }

  get groupedCode (): string {
    return this.code ? `${this.code.slice(0, 5)}-${this.code.slice(5)}` : ''
  }

  get signedIn (): boolean {
    return cloudState.account !== null
  }

  get joinedName (): string {
    return this.state?.kind === 'joined' ? printerName(this.state.printerId) : ''
  }

  /** The card's head for where the join has got to: one card from invite to joined. */
  get card (): Card {
    if (!this.code) return { icon: 'alert', tone: 'danger', title: 'Join a shared printer', sub: '' }
    if (!this.signedIn) return { icon: 'printers', tone: 'accent', title: 'Join a shared printer', sub: '' }
    switch (this.state?.kind) {
      case 'joined': return { icon: 'check', tone: 'ok', title: `You've joined ${this.joinedName}`, sub: '' }
      case 'pending': return { icon: 'clock', tone: 'accent', title: 'Waiting for the owner', sub: '' }
      case 'refused': return { icon: 'x', tone: 'danger', title: 'Not approved', sub: '' }
      case 'expired': return { icon: 'clock', tone: 'warn', title: 'The request ran out', sub: '' }
      default: return { icon: 'printers', tone: 'accent', title: 'Join a shared printer', sub: 'Accept to add it to your printer list. Its owner may need to approve first.' }
    }
  }

  async join () {
    if (!this.code || this.busy) return
    this.busy = true
    try {
      this.state = fromJoinAnswer(await cloudApi.join(this.code))
      await this.settle()
    } catch (error) {
      this.state = fromJoinError(error)
    } finally {
      this.busy = false
    }
  }

  async poll () {
    if (this.state?.kind !== 'pending') return
    try {
      this.state = fromApproval((await cloudApi.approval(this.state.approvalId)).approval)
      await this.settle()
    } catch {
      // Keep waiting: a blip is not an answer.
      this.schedule()
    }
  }

  async settle () {
    if (this.state?.kind === 'joined') await refreshPrinters()
    else if (this.state?.kind === 'pending') this.schedule()
  }

  schedule () {
    this.stop()
    if (!this.left) this.timer = window.setTimeout(() => { this.poll() }, APPROVAL_POLL_MS)
  }

  stop () {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
  }

  beforeDestroy () {
    this.left = true
    this.stop()
  }
}
</script>

<style lang="scss" scoped>
.muon-join-landing p {
  margin: 0;
}

.muon-join-landing__code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  letter-spacing: 0.08em;
}

.muon-join-landing__invite {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 14px;
  background: var(--m3d-fill-2);

  b,
  span {
    display: block;
  }
}

.muon-join-landing__invite-icon {
  display: grid !important;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--m3d-fill);
}

.muon-join-landing__muted {
  color: var(--m3d-text-muted);
  font-size: 13px;
}

.muon-join-landing__error {
  color: var(--m3d-danger);
}
</style>
