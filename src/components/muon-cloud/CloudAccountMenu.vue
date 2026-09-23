<template>
  <div class="muon-account">
    <app-btn
      v-if="!account"
      small
      outlined
      class="muon-account__sign-in mx-1"
      @click="dialog = true"
    >
      <v-icon
        small
        left
      >
        {{ icons.account }}
      </v-icon>
      Sign in
    </app-btn>

    <v-menu
      v-else
      bottom
      left
      offset-y
      min-width="260"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          icon
          class="muon-account__avatar mx-1"
          v-bind="attrs"
          v-on="on"
        >
          <v-avatar
            size="30"
            color="primary"
          >
            <span class="white--text text-caption font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-list dense>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="font-weight-medium">
              {{ account.name }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ account.email }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider />
        <v-list-item to="/fleet">
          <v-list-item-icon>
            <v-icon small>
              {{ icons.fleet }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>Fleet</v-list-item-title>
        </v-list-item>
        <v-list-item @click="linkDialog = true">
          <v-list-item-icon>
            <v-icon small>
              {{ icons.link }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>Link a printer</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item @click="doSignOut">
          <v-list-item-icon>
            <v-icon small>
              {{ icons.signOut }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>Sign out</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <cloud-account-dialog
      v-if="dialog"
      v-model="dialog"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mdiAccountCircleOutline, mdiLinkVariantPlus, mdiLogout, mdiViewGridOutline } from '@mdi/js'
import { cloudState, signOut } from '@/services/muon-cloud/state'
import { activationState } from '@/services/muon-cloud/activate'
import CloudAccountDialog from './CloudAccountDialog.vue'
import LinkPrinterDialog from './LinkPrinterDialog.vue'

@Component({ components: { CloudAccountDialog, LinkPrinterDialog } })
export default class CloudAccountMenu extends Vue {
  dialog = false
  linkDialog = false
  icons = {
    account: mdiAccountCircleOutline,
    fleet: mdiViewGridOutline,
    link: mdiLinkVariantPlus,
    signOut: mdiLogout
  }

  get account () {
    return cloudState.account
  }

  get initials () {
    const name = cloudState.account?.name || cloudState.account?.email || '?'
    return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('')
  }

  async doSignOut () {
    const wasCloud = cloudState.activePrinterId !== null || activationState.switching !== null
    await signOut()
    if (wasCloud) window.location.reload()
  }
}
</script>
