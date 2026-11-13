/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="vuetify" />
/// <reference types="vue-meta" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.yaml' {
  const data: unknown
  export default data
}

declare module '@/locales/*.yaml' {
  import type { LocaleMessageObject } from 'vue-i18n'

  const data: LocaleMessageObject
  export default data
}

interface ImportMetaEnv {
  readonly VUE_APP_I18N_LOCALE?: string
  readonly VUE_APP_I18N_FALLBACK_LOCALE?: string
  /** The Muon3D Slicer's embed.html, which Fluidd > Slice frames (views/Slice.vue). */
  readonly VUE_MUON_SLICER_URL?: string
  /** The model service's address (services/library/transport.ts); https://library.muon3d.com/models when unset. */
  readonly VITE_MODELS_URL?: string
  /** What the service's assertions are addressed to: an identifier, not an address. VITE_MODELS_URL when that is set, else the production audience. */
  readonly VITE_MODELS_AUDIENCE?: string
  readonly VERSION: string
  readonly HASH: string
  /** The full commit this build was made from (vite.config.inject-version.ts). */
  readonly BUILD_COMMIT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  /** index.html starts the config.json request while parsing (KAN-2011); init.ts takes it. */
  __muonHostConfig?: Promise<import("@/store/config/types").HostConfig | null>
}
