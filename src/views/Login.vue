<template>
  <auth-card
    class="login-shell"
    quiet
    :title="`Sign in to ${printerName}`"
    sub="This account belongs to the printer, not to your Muon3D account."
  >
    <v-form
      data-tid="login-form"
      @submit.prevent="handleLogin"
    >
      <v-alert
        v-if="error"
        type="error"
        text
        dense
        class="mb-4"
        data-tid="login-error"
        role="alert"
      >
        {{ $t('app.general.simple_form.error.credentials') }}
      </v-alert>

      <v-text-field
        v-model="username"
        :label="$t('app.general.label.username')"
        autocomplete="username"
        spellcheck="false"
        outlined
        dense
        hide-details="auto"
        :disabled="loading"
        class="mb-3"
        data-tid="login-username"
      />

      <v-text-field
        v-model="password"
        :label="$t('app.general.label.password')"
        autocomplete="current-password"
        outlined
        dense
        type="password"
        hide-details="auto"
        :disabled="loading"
        class="mb-3"
        data-tid="login-password"
      />

      <v-select
        v-if="availableSources.length > 1"
        v-model="source"
        :label="$t('app.general.label.auth_source')"
        outlined
        dense
        hide-details="auto"
        :disabled="loading"
        :items="availableSources.map(value => ({ text: $t(`app.general.label.${value}`), value }))"
        class="mb-3"
        data-tid="login-source"
      />

      <app-btn
        type="submit"
        color="primary"
        :loading="loading"
        :disabled="loading"
        block
        large
        class="login-submit"
        data-tid="login-submit"
      >
        {{ $t('app.general.btn.login') }}
      </app-btn>
    </v-form>

    <div class="login-links">
      <a
        :href="$globals.DOCS_AUTH_LOST_PASSWORD"
        target="_blank"
        rel="noopener"
      >
        {{ $t('app.general.btn.forgot_password') }}
      </a>
      <a
        :href="$globals.DOCS_AUTH"
        target="_blank"
        rel="noopener"
      >
        {{ $t('app.general.btn.auth_unsure') }}
      </a>
    </div>

    <template #alt>
      <router-link
        to="/sign-in"
        data-tid="login-account"
      >
        Use my Muon3D account instead
      </router-link>
    </template>
  </auth-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AuthCard from '@/components/account/AuthCard.vue'
import { appInit } from '@/init'
import { consola } from 'consola'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

@Component({ components: { AuthCard } })
export default class Login extends Vue {
  username = ''
  password = ''
  error = false
  loading = false
  source = 'moonraker'
  availableSources = [this.source]

  get printerName (): string {
    return this.$store.getters['config/getDisplayName']
  }

  async mounted () {
    // A cloud printer has no Moonraker login, and muon-link refuses
    // /access/* to every remote role: asking only raised "Server error".
    if (isManagedApiUrl(this.$store.state.config.apiUrl)) return
    const authInfo = await this.$store.dispatch('auth/getAuthInfo')
    this.source = authInfo.defaultSource ?? this.source
    this.availableSources = authInfo.availableSources ?? this.availableSources
  }

  async handleLogin () {
    if (isManagedApiUrl(this.$store.state.config.apiUrl)) return
    this.error = false
    this.loading = true
    try {
      await this.$store.dispatch('auth/login', { username: this.username, password: this.password, source: this.source })
    } catch (err) {
      this.error = true
    }
    this.loading = false

    // Re-init the app.
    if (!this.error) {
      const instance = this.$store.getters['config/getCurrentInstance']

      const config = await appInit(instance, this.$store.state.config.hostConfig)

      // Reconnect the socket with the new instance url.
      if (config.apiConnected && config.apiAuthenticated) {
        consola.debug('Activating socket with config', config)
        this.$socket.connect(config.apiConfig.socketUrl)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .login-submit {
    margin-top: 8px;
  }

  .login-links {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
    font-size: 0.8125rem;
  }

  .login-links a {
    color: var(--m3d-text-muted);
    text-decoration: none;
  }

  .login-links a:hover {
    color: var(--m3d-accent);
  }
</style>
