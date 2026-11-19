import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { httpClientActions } from '@/api/httpClientActions'
import {
  DEFAULT_LIGHT,
  LedModeBackend,
  MAX_FAVOURITES,
  MAX_SAVED_PRESETS,
  PRESET_NAME_MAX,
  createLatestWriter,
  cleanFavourites,
  effectFor,
  newPresetId,
  patchLight,
  presetBoxes,
  presetState,
  type EffectId,
  type LatestWriter,
  type LightPreset,
  type LightState,
  type LightsBackend,
  type LightsLibrary,
  type LightsTransport,
  type PresetBox
} from './lights'

/** Today's I/O: G-code over the printer's socket (not echoed to the console), the library over Moonraker's HTTP database. */
export const moonrakerTransport: LightsTransport = {
  // A refused script resolves to undefined (the socket reports the error itself): that is a refusal here.
  gcode: async script => {
    const answer = await SocketActions.printerGcodeScript(script)
    if (answer === undefined) throw new Error('The printer did not take the script')
  },
  dbRead: async namespace => {
    const response = await httpClientActions.serverDatabaseItemGet<Record<string, unknown>>(namespace)
    const value = response.data?.result?.value
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  },
  dbWrite: (namespace, key, value) => httpClientActions.serverDatabaseItemPost(namespace, key, value)
}

/** How long a change waits for the printer to report it before the screen goes back to what the printer says. */
export const SETTLE_MS = 2500

export const CHANGE_REFUSED = 'The printer refused that change.'
export const SAVE_REFUSED = 'The printer refused that save. It may not let this account keep presets.'
export const SAVE_UNREACHED = 'Could not save. Check the printer is reachable and try again.'

/** A refusal is an answer (a status or an error from the printer); anything else never got there. */
export const saveFailure = (error: unknown): string => (error as { response?: unknown } | null)?.response ? SAVE_REFUSED : SAVE_UNREACHED

/**
 * What the Lighting screen and its widgets share: the change the person just
 * made (shown at once, so a slider does not jump back), the one writer that
 * keeps the printer to three settings a second, and the preset library. Every
 * screen reads the lights from the printer's own report; this only holds what
 * is in flight.
 */
export class LightsStore {
  state = Vue.observable({
    pending: null as LightState | null,
    resume: 'solid' as EffectId,
    library: null as LightsLibrary | null,
    libraryState: 'idle' as 'idle' | 'loading' | 'ready' | 'failed',
    /** What the last failed save said, for the screen to show. */
    error: ''
  })

  readonly backend: LightsBackend
  private writer: LatestWriter<LightState>
  private settleTimer: ReturnType<typeof setTimeout> | null = null
  private loading: Promise<void> | null = null
  /** Writes that left for the printer, for tests and the API card. */
  sent = 0

  constructor (backend: LightsBackend, writer?: LatestWriter<LightState>) {
    this.backend = backend
    this.writer = writer ?? createLatestWriter(state => this.send(state), backend.capabilities.writesPerSecond)
  }

  /** One setting to the printer. A refusal (or a throw) is caught here: the screen says so and goes back to what the printer reports. */
  private send (state: LightState) {
    this.sent++
    const refused = () => {
      this.state.error = CHANGE_REFUSED
      this.clearPending()
    }
    try {
      Promise.resolve(this.backend.apply(state)).catch(refused)
    } catch { refused() }
  }

  /** What the lights are: the change in flight, else what the printer reports. null: this printer has no lights to set. */
  current (printer: Record<string, any> | undefined): LightState | null {
    return this.state.pending ?? this.backend.read(printer, this.state.resume)
  }

  /** The printer reported: drop the change in flight once it shows, and remember the effect to come back to after Off. */
  observe (printer: Record<string, any> | undefined) {
    const reported = this.backend.read(printer, this.state.resume)
    if (!reported) return
    if (reported.on && reported.effect !== this.state.resume) this.state.resume = reported.effect
    const pending = this.state.pending
    if (pending && this.backend.describe(pending) === this.backend.describe(reported)) this.clearPending()
  }

  private clearPending () {
    this.state.pending = null
    if (this.settleTimer) clearTimeout(this.settleTimer)
    this.settleTimer = null
  }

  /** Changes the lights: at once on screen, and to the printer at no more than three a second, the latest winning. */
  set (printer: Record<string, any> | undefined, patch: Partial<LightState>) {
    const base = this.current(printer) ?? DEFAULT_LIGHT
    const next = patchLight(base, patch, this.backend.capabilities)
    this.state.error = ''
    this.state.pending = next
    if (next.on) this.state.resume = next.effect
    if (this.settleTimer) clearTimeout(this.settleTimer)
    this.settleTimer = setTimeout(() => this.clearPending(), SETTLE_MS)
    this.writer.push(next)
  }

  /** On, with the effect it had before Off. */
  setOn (printer: Record<string, any> | undefined, on: boolean) {
    this.set(printer, on ? { on: true, effect: effectFor(this.backend.capabilities, this.state.resume).id } : { on: false })
  }

  // ---- the library -----------------------------------------------------------

  ensureLibrary (): Promise<void> {
    if (this.state.libraryState === 'ready') return Promise.resolve()
    if (this.loading) return this.loading
    this.state.libraryState = 'loading'
    this.loading = this.backend.loadLibrary().then(library => {
      this.state.library = library
      this.state.libraryState = 'ready'
    }, () => {
      this.state.library = { presets: [], favourites: [] }
      this.state.libraryState = 'failed'
    }).finally(() => { this.loading = null })
    return this.loading
  }

  get presets (): LightPreset[] { return this.state.library?.presets ?? [] }
  get favourites (): string[] { return this.state.library?.favourites ?? [] }

  get boxes (): PresetBox[] { return presetBoxes(this.presets, this.state.library ? this.favourites : undefined) }

  applyPreset (printer: Record<string, any> | undefined, preset: LightPreset) {
    this.set(printer, presetState(preset, this.current(printer) ?? DEFAULT_LIGHT, this.backend.capabilities))
  }

  /** The preset the lights match now, for the ring on its box. */
  matching (state: LightState | null): string | null {
    if (!state?.on) return null
    const caps = this.backend.capabilities
    const colours = (s: { effect: EffectId; colors: string[] }) => s.colors.slice(0, Math.max(1, effectFor(caps, s.effect).colours)).join(',')
    return this.presets.find(p => p.effect === state.effect && colours(p) === colours(state))?.id ?? null
  }

  /** Saves the lights as a preset (its effect and colours), and stars it when there is room. Resolves to the preset, or null when it could not be saved. */
  async savePreset (printer: Record<string, any> | undefined, name: string): Promise<LightPreset | null> {
    const state = this.current(printer)
    await this.ensureLibrary()
    const library = this.state.library
    if (!state || !library) return null
    const saved = library.presets.filter(p => !p.builtin)
    if (saved.length >= MAX_SAVED_PRESETS) {
      this.state.error = `You can keep ${MAX_SAVED_PRESETS} presets of your own. Delete one first.`
      return null
    }
    const info = effectFor(this.backend.capabilities, state.effect)
    const preset: LightPreset = {
      id: newPresetId(library.presets),
      name: name.trim().slice(0, PRESET_NAME_MAX) || `Custom ${saved.length + 1}`,
      effect: info.id,
      colors: state.colors.slice(0, Math.max(1, info.colours))
    }
    const presets = [...library.presets, preset]
    const favourites = library.favourites.length < MAX_FAVOURITES ? [...library.favourites, preset.id] : library.favourites
    const before = this.state.library
    this.state.library = { presets, favourites }
    this.state.error = ''
    try {
      await this.backend.saveLibrary(presets, favourites)
    } catch (error) {
      this.state.library = before
      this.state.error = saveFailure(error)
      return null
    }
    return preset
  }

  /** Keeps the list of favourites a person chose in More. */
  async setFavourites (ids: string[]): Promise<boolean> {
    const library = this.state.library
    if (!library) return false
    const clean = cleanFavourites(ids, library.presets)
    const before = library
    this.state.library = { ...library, favourites: clean }
    this.state.error = ''
    try {
      await this.backend.saveLibrary(library.presets, clean)
      return true
    } catch (error) {
      this.state.library = before
      this.state.error = saveFailure(error)
      return false
    }
  }

  /** Drops what is in flight (leaving a page, a test). */
  reset () {
    this.writer.cancel()
    this.clearPending()
    this.state.library = null
    this.state.libraryState = 'idle'
    this.state.resume = 'solid'
    this.state.error = ''
    this.loading = null
    this.sent = 0
  }
}

/** The one the screens share. */
export const lightsStore = new LightsStore(new LedModeBackend(moonrakerTransport))
