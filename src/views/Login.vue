<template>
  <v-row
    class="login-shell"
    :dense="$vuetify.breakpoint.smAndDown"
    justify="center"
    align="center"
  >
    <v-col
      class="login-column"
      cols="12"
      md="4"
      lg="3"
      xl="2"
    >
      <v-card
        class="login-card"
        elevation="0"
      >
        <v-form
          @submit.prevent="handleLogin"
        >
          <div
            class="login-brand"
            aria-label="MuonOS local printer access"
          >
            <div class="login-brand-mark">
              <app-icon />
            </div>
            <div>
              <div class="login-wordmark">
                <strong>MUON</strong><span>OS</span>
              </div>
              <div class="login-eyebrow">
                LOCAL PRINTER ACCESS
              </div>
            </div>
          </div>

          <div class="login-copy">
            <h1>{{ $t('app.general.msg.welcome_back') }}</h1>
            <p>This sign-in is for this printer only — it is not a Muon cloud account.</p>
          </div>

          <v-alert
            v-if="error"
            type="error"
            class="login-alert"
          >
            {{ $t('app.general.simple_form.error.credentials') }}
          </v-alert>

          <v-text-field
            v-model="username"
            :label="$t('app.general.label.username')"
            autocomplete="username"
            spellcheck="false"
            filled
            dense
            hide-details="auto"
            :disabled="loading"
            class="login-field mb-4"
          />

          <v-text-field
            v-model="password"
            :label="$t('app.general.label.password')"
            autocomplete="current-password"
            filled
            dense
            type="password"
            hide-details="auto"
            :disabled="loading"
            class="login-field mb-4"
          />

          <v-select
            v-if="availableSources.length > 1"
            v-model="source"
            :label="$t('app.general.label.auth_source')"
            filled
            dense
            hide-details="auto"
            :disabled="loading"
            :items="availableSources.map(value => ({ text: $t(`app.general.label.${value}`), value }))"
            class="login-field mb-4"
          />

          <app-btn
            type="submit"
            :disabled="loading"
            large
            block
            class="login-submit mb-6"
          >
            <v-icon
              v-if="loading"
              class="spin mr-2"
            >
              $loading
            </v-icon>
            {{ $t('app.general.btn.login') }}
          </app-btn>

          <div class="login-links">
            <app-btn
              color=""
              plain
              class="custom-transform-class text-none"
              :href="$globals.DOCS_AUTH_LOST_PASSWORD"
              target="_blank"
            >
              {{ $t('app.general.btn.forgot_password') }}
            </app-btn>

            <app-btn
              color=""
              plain
              class="custom-transform-class text-none"
              :href="$globals.DOCS_AUTH"
              target="_blank"
            >
              {{ $t('app.general.btn.auth_unsure') }}
            </app-btn>
          </div>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { appInit } from '@/init'
import { consola } from 'consola'

@Component({})
export default class Login extends Vue {
  username = ''
  password = ''
  error = false
  loading = false
  source = 'moonraker'
  availableSources = [this.source]

  async mounted () {
    const authInfo = await this.$store.dispatch('auth/getAuthInfo')
    this.source = authInfo.defaultSource ?? this.source
    this.availableSources = authInfo.availableSources ?? this.availableSources
  }

  async handleLogin () {
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
  .login-shell {
    min-height: min(720px, 100%);
    padding: 28px 12px;
  }

  .login-column {
    max-width: 460px;
  }

  .login-card {
    border: 1px solid var(--m3d-border) !important;
    border-radius: var(--m3d-radius-2xl) !important;
    padding: clamp(24px, 5vw, 44px);
    background: var(--m3d-surface-raised) !important;
    box-shadow: var(--m3d-shadow-lg) !important;
    color: var(--m3d-text);
  }

  .login-brand {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 32px;
  }

  .login-brand-mark {
    display: grid;
    width: 52px;
    height: 52px;
    place-items: center;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-lg);
    background: var(--m3d-surface-2);
  }

  .login-wordmark {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--m3d-text);
    font-family: var(--m3d-font-display);
    font-size: var(--m3d-text-lg);
    letter-spacing: 0.15em;
  }

  .login-wordmark strong {
    font-weight: var(--m3d-weight-regular);
  }

  .login-wordmark span {
    color: var(--m3d-accent);
    font-size: 0.7rem;
    font-weight: var(--m3d-weight-bold);
  }

  .login-eyebrow {
    margin-top: 5px;
    color: var(--m3d-text-muted);
    font-size: 0.64rem;
    font-weight: var(--m3d-weight-bold);
    letter-spacing: 0.12em;
  }

  .login-copy {
    margin-bottom: 24px;
  }

  .login-copy h1 {
    margin: 0 0 8px;
    color: var(--m3d-text);
    font-size: clamp(1.45rem, 4vw, 1.8rem);
    font-weight: var(--m3d-weight-bold);
    letter-spacing: -0.02em;
  }

  .login-copy p {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .login-alert {
    margin-bottom: 18px;
    border-radius: var(--m3d-radius-lg);
  }

  .login-field :deep(.v-input__slot) {
    min-height: 52px !important;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: var(--m3d-surface-1) !important;
  }

  .login-field :deep(.v-label),
  .login-field :deep(input) {
    color: var(--m3d-text) !important;
  }

  .login-field :deep(.v-label) {
    color: var(--m3d-text-muted) !important;
  }

  .login-submit {
    min-height: 52px !important;
    border-radius: var(--m3d-radius-pill) !important;
    font-weight: var(--m3d-weight-bold);
    letter-spacing: 0.01em;
  }

  .login-links {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .login-links :deep(.v-btn) {
    min-height: 40px;
    padding: 0 4px;
    color: var(--m3d-accent) !important;
  }

  @media (max-width: 420px) {
    .login-shell {
      padding: 12px 0;
    }

    .login-card {
      border-right: 0 !important;
      border-left: 0 !important;
      border-radius: 18px !important;
    }
  }
</style>
