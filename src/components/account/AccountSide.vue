<template>
  <aside
    class="acct-side"
    :class="{ 'acct-side--phone': phone }"
    :data-side="side"
    data-tid="account-side"
  >
    <div
      v-if="account"
      class="acct-side__who"
      data-tid="account-side-who"
    >
      <profile-avatar
        :photo="photo"
        :letter="letter"
        size="md"
        data-tid="account-side-photo"
      />
      <span class="acct-side__name">
        <b data-tid="account-side-name">{{ account.name || account.email }}</b>
        <span
          class="acct-subtle"
          data-tid="account-side-plan"
        >{{ plan || account.email }}</span>
      </span>
    </div>

    <nav
      class="acct-nav"
      aria-label="Account sections"
    >
      <span class="lib-caps">Account</span>
      <template v-for="entry in nav">
        <span
          :key="`group-${entry.group}`"
          class="acct-nav__group"
          :data-tid="`account-nav-group-${entry.group}`"
        >{{ entry.group }}</span>
        <router-link
          v-for="section in entry.sections"
          :key="section.id"
          :to="linkTo(section.id)"
          class="acct-nav__item"
          :class="{ 'acct-nav__item--on': !phone && section.id === navId }"
          :aria-current="section.id === navId ? 'page' : undefined"
          :data-tid="`account-nav-${section.id}`"
        >
          <frame-icon
            :name="section.icon"
            small
          />
          <span class="acct-nav__label">{{ section.label }}</span>
          <frame-icon
            v-if="phone"
            name="chevronRight"
            small
          />
        </router-link>
      </template>
      <div class="acct-nav__rule" />
      <button
        v-if="account"
        type="button"
        class="acct-nav__item"
        data-tid="account-sign-out"
        @click="$emit('sign-out')"
      >
        <frame-icon
          name="logout"
          small
        />
        <span class="acct-nav__label">Sign out</span>
      </button>
    </nav>
  </aside>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import type { CloudAccount } from '@/services/muon-cloud/api'
import { loadOwnAvatar, ownAvatar } from '@/services/account/avatar'
import { loadCredits, planName } from '@/services/account/credits'
import { ACCOUNT_BAR_SIDE } from '@/services/account/layout'
import type { AccountNavGroup, AccountSection, AccountSectionId } from '@/services/account/model'
import ProfileAvatar from '@/components/account/profile/ProfileAvatar.vue'

/**
 * The account bar (KAN-1947): your photo, name and plan, the sections, and
 * Sign out. Beside the page on a desktop (the side is ACCOUNT_BAR_SIDE),
 * at the top of the Account list on a phone.
 */
@Component({ components: { ProfileAvatar } })
export default class AccountSide extends Vue {
  @Prop({ type: Array, required: true }) readonly nav!: Array<{ group: AccountNavGroup, sections: AccountSection[] }>
  @Prop({ type: String, required: true }) readonly navId!: AccountSectionId
  @Prop({ type: Function, required: true }) readonly linkTo!: (id: AccountSectionId) => string
  @Prop({ type: Boolean, default: false }) readonly phone!: boolean

  plan: string | null = null

  get side () {
    return ACCOUNT_BAR_SIDE
  }

  get account (): CloudAccount | null {
    return cloudState.account
  }

  get photo (): string | null {
    return ownAvatar.url
  }

  get letter (): string {
    return (this.account?.name || this.account?.email || '?').trim().charAt(0).toUpperCase() || '?'
  }

  created () {
    if (!this.account) return
    loadOwnAvatar().catch(() => {})
    loadCredits().then(credit => { this.plan = `${planName(credit.plan)} plan` }).catch(() => {})
  }
}
</script>
