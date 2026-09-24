<template>
  <div v-if="user && !isTrustedOnly">
    <v-divider />

    <v-list dense>
      <v-subheader>{{ currentUser }}</v-subheader>

      <v-list-item
        :disabled="user.source !== 'moonraker'"
        @click="changePassword"
      >
        <v-list-item-icon>
          <v-icon>$lockReset</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.change_password') }}</v-list-item-title>
          <v-list-item-subtitle v-if="user.source !== 'moonraker'">
            {{ $t('app.general.label.user_managed_source', { source: $t(`app.general.label.${user.source}`) }) }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="manageAccounts">
        <v-list-item-icon>
          <v-icon>$addAccount</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.manage_accounts') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="handleLogout">
        <v-list-item-icon>
          <v-icon>$logout</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.btn.logout') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <user-password-dialog
      v-if="passwordDialogOpen"
      v-model="passwordDialogOpen"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { startCase, capitalize } from 'lodash-es'
import UserPasswordDialog from '@/components/settings/auth/UserPasswordDialog.vue'

// The signed-in Moonraker user, in the tools drawer. The toolbar's only
// account control is the Muon3D account; this keeps the printer login's
// password, accounts and log out one tap away.
@Component({
  components: {
    UserPasswordDialog
  }
})
export default class AppUserMenu extends Vue {
  passwordDialogOpen = false

  get user () {
    return this.$store.getters['auth/getCurrentUser']
  }

  get currentUser () {
    if (!this.user) return ''
    if (
      this.user.username === '_TRUSTED_USER_' ||
      this.user.username === '_API__API_KEY_USER_USER_'
    ) {
      return capitalize(startCase(this.user.username))
    } else {
      return this.user.username
    }
  }

  get isTrustedOnly () {
    if (!this.user) return false
    return (
      this.user.username === '_TRUSTED_USER_' ||
      this.user.username === '_API__API_KEY_USER_USER_'
    )
  }

  changePassword () {
    this.passwordDialogOpen = true
    this.$emit('click')
  }

  manageAccounts () {
    this.$filters.routeTo(this.$router, '/settings#auth')
    this.$emit('click')
  }

  async handleLogout () {
    this.$emit('click')
    await this.$store.dispatch('auth/checkTrust')
  }
}
</script>
