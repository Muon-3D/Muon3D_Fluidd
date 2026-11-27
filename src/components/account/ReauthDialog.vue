<template>
  <m3-dialog
    :value="value"
    title="Confirm it's you"
    :eyebrow="eyebrow"
    :tone="danger ? 'danger' : ''"
    :persistent="busy"
    max-width="440"
    content-class="m3-dlg-frame--sheet"
    data-tid="reauth-dialog"
    @close="cancel"
  >
    <p class="m3-dlg__text">
      {{ why }}
    </p>
    <dl
      v-if="rows.length"
      class="m3-dlg__panel m3-dlg__rows"
      data-tid="reauth-rows"
    >
      <div
        v-for="row in rows"
        :key="row.label"
      >
        <dt>{{ row.label }}</dt>
        <dd :class="{ 'is-mono': row.mono }">
          {{ row.value }}
        </dd>
      </div>
    </dl>
    <button
      v-if="hasPasskey"
      type="button"
      class="cbtn cbtn--primary"
      :disabled="busy"
      :aria-busy="passkeyBusy ? 'true' : undefined"
      data-tid="reauth-passkey"
      @click="$emit('passkey')"
    >
      <frame-icon name="key" />
      {{ passkeyBusy ? 'Waiting for your passkey…' : 'Confirm with passkey' }}
    </button>
    <p
      v-if="note"
      class="m3-dlg__note"
      data-tid="reauth-note"
    >
      {{ note }}
    </p>
    <template v-if="hasPassword && !passkeyOnly">
      <label class="m3-field">
        <span class="m3-field__label">Password</span>
        <span class="m3-field__box">
          <input
            ref="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            aria-label="Password"
            :aria-describedby="error ? errorId : undefined"
            data-tid="reauth-password"
            @keydown.enter="submit"
          >
        </span>
      </label>
      <label
        v-if="twoStep"
        class="m3-field"
      >
        <span class="m3-field__label">Code from your authenticator app</span>
        <span class="m3-field__box m3-field__box--mono">
          <input
            v-model="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            aria-label="Code from your authenticator app"
            :aria-describedby="error ? errorId : undefined"
            data-tid="reauth-code"
            @keydown.enter="submit"
          >
        </span>
        <span class="m3-dlg__note">Or a recovery code.</span>
      </label>
    </template>
    <p
      v-else-if="!hasPasskey && !passkeyOnly"
      class="m3-dlg__text"
    >
      This account has no password. Sign out and sign in again, then do this within ten minutes.
    </p>
    <p
      v-if="error"
      :id="errorId"
      class="m3-dlg__error"
      role="alert"
    >
      {{ error }}
    </p>
    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        :disabled="busy"
        @click="cancel"
      >
        Cancel
      </button>
      <button
        v-if="hasPassword && !passkeyOnly"
        type="button"
        class="cbtn"
        :class="danger ? 'cbtn--danger' : 'cbtn--primary'"
        :disabled="!ready || busy"
        data-tid="reauth-submit"
        @click="submit"
      >
        {{ action }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import type { Reauth } from '@/services/account/api'

/**
 * "Confirm it's you" (the canvas's delete step 2, for every sensitive
 * change): the password, and a code with two-step sign-in on. The console
 * asks for this when the last sign-in was more than ten minutes ago
 * (`403 reauth_required`). `submit` hands the answer to the parent, which
 * tries again and shows `error` if the console still refuses.
 */
@Component({ components: { M3Dialog, FrameIcon } })
export default class ReauthDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  @Prop({ type: Boolean, default: true })
  readonly hasPassword!: boolean

  @Prop({ type: Boolean, default: false })
  readonly hasPasskey!: boolean

  @Prop({ type: Boolean, default: false })
  readonly twoStep!: boolean

  @Prop({ type: String, default: 'This needs a fresh sign-in, so someone at an unlocked computer can\'t do it.' })
  readonly why!: string

  @Prop({ type: String, default: 'Confirm' })
  readonly action!: string

  @Prop({ type: String, default: '' })
  readonly eyebrow!: string

  @Prop({ type: Boolean, default: false })
  readonly danger!: boolean

  @Prop({ type: Boolean, default: false })
  readonly busy!: boolean

  /** The browser's passkey sheet is up. */
  @Prop({ type: Boolean, default: false })
  readonly passkeyBusy!: boolean

  /** What is being confirmed, shown exactly as sent (a Fleet request: "Request", "Role", "Target", "Reason"). */
  @Prop({ type: Array, default: () => [] })
  readonly rows!: Array<{ label: string, value: string, mono?: boolean }>

  /** A small muted line, e.g. a time limit. */
  @Prop({ type: String, default: '' })
  readonly note!: string

  /** Passkey only: the password and code fields are never drawn (admin, Fleet). */
  @Prop({ type: Boolean, default: false })
  readonly passkeyOnly!: boolean

  @Prop({ type: String, default: '' })
  readonly error!: string

  password = ''
  code = ''
  readonly errorId = 'reauth-confirmation-error'

  @Watch('value')
  onOpen (open: boolean) {
    if (open) {
      this.password = ''
      this.code = ''
    }
  }

  get ready (): boolean {
    return this.password.length > 0 && (!this.twoStep || this.code.trim().length > 0)
  }

  submit () {
    if (!this.ready || this.busy) return
    const answer: Reauth = { password: this.password }
    if (this.twoStep) answer.code = this.code.replace(/\s+/g, '')
    this.$emit('submit', answer)
  }

  cancel () {
    if (this.busy) return
    this.$emit('input', false)
    this.$emit('cancel')
  }
}
</script>
