<template>
  <div
    class="cons"
    :class="{ 'cons--phone': isMobileViewport }"
    data-tid="console-page"
  >
    <section
      class="cons__output"
      data-tid="console-output"
    >
      <header class="cons__head">
        <h2><frame-icon name="console" /> Output</h2>
        <span class="cons__head-r">
          <tone-pill :tone="klippyTone">{{ klippyLabel }}</tone-pill>
        </span>
      </header>
      <div class="cons__bar">
        <label class="cons__find">
          <frame-icon
            name="search"
            small
          />
          <input
            v-model="find"
            type="search"
            placeholder="Find in log"
            aria-label="Find in log"
            data-tid="console-find"
          >
        </label>
        <button
          type="button"
          class="cons__chip"
          :class="{ 'cons__chip--on': hideTempWaits }"
          :aria-pressed="hideTempWaits ? 'true' : 'false'"
          title="Hide the temperature lines Klipper prints while it waits to heat"
          @click="hideTempWaits = !hideTempWaits"
        >
          Hide heating lines
        </button>
        <button
          v-if="!isMobileViewport"
          type="button"
          class="cbtn"
          title="Download Klipper's full log from the printer"
          @click="downloadLog"
        >
          <frame-icon
            name="download"
            small
          />
          klippy.log
        </button>
      </div>

      <div
        class="cons__log"
        :class="[`cons__log--${prefs.textSize}`, { 'cons__log--nowrap': !prefs.wrap }]"
        data-tid="console-log"
        aria-live="polite"
      >
        <dynamic-scroller
          ref="scroller"
          :items="shown"
          :min-item-size="22"
          key-field="key"
          class="cons__scroller"
          :buffer="600"
          @resize="toLatest()"
        >
          <template #default="{ item, index, active }">
            <dynamic-scroller-item
              :item="item"
              :active="active"
              :size-dependencies="[item.html, item.why]"
              :data-index="index"
            >
              <div
                class="cons__line"
                :class="[`cons__line--${item.kind}`, { 'cons__line--notime': !prefs.timestamps }]"
              >
                <time v-if="prefs.timestamps">{{ item.time }}</time>
                <span
                  class="cons__msg"
                  @click="onLineClick"
                  v-html="item.html"
                />
                <span
                  v-if="item.why"
                  class="cons__why"
                >What this means: {{ item.why }}</span>
              </div>
            </dynamic-scroller-item>
          </template>
        </dynamic-scroller>
        <p
          v-if="!shown.length"
          class="cons__empty"
        >
          {{ find ? `Nothing in the log matches "${find}".` : filter === 'all' ? 'Nothing yet.' : `No ${filter} in the log.` }}
        </p>
        <button
          v-if="paused"
          type="button"
          class="cons__latest"
          @click="toLatest(true)"
        >
          Latest
          <frame-icon
            :name="flipped ? 'chevronUp' : 'chevronDown'"
            small
          />
        </button>
      </div>

      <div class="cons__input">
        <div
          v-if="quick.length"
          class="cons__chips"
          role="toolbar"
          aria-label="Quick commands"
          data-tid="console-quick"
        >
          <button
            v-for="q in quick"
            :key="q.id"
            type="button"
            class="cons__quick"
            :disabled="chipOff(q)"
            :title="chipTitle(q)"
            :data-tid="`console-quick-${q.command}`"
            @click="tapQuick(q)"
          >
            {{ chipLabel(q) }}
          </button>
          <router-link
            :to="quickSettingsTo"
            class="cons__quick cons__quick--edit"
            aria-label="Edit the quick commands"
            title="Edit the quick commands"
          >
            <frame-icon
              name="settings"
              small
            />
          </router-link>
        </div>
        <p
          v-if="quickNote"
          class="cons__help"
          data-tid="console-quick-note"
        >
          {{ quickNote }}
        </p>
        <p
          v-if="commandRefusal"
          role="alert"
          class="cons__help"
        >
          {{ commandRefusal }}
        </p>
        <p
          v-if="help && !(open && list.length)"
          class="cons__help"
        >
          <code>{{ typedCommand }}</code> {{ help }}
        </p>
        <div class="cons__field">
          <ul
            v-if="open && list.length"
            class="cons__suggest"
            role="listbox"
            aria-label="Suggestions"
            data-tid="console-suggestions"
          >
            <li
              v-for="(s, i) in list"
              :key="`${s.from}-${s.text}`"
              role="option"
              :aria-selected="i === picked ? 'true' : 'false'"
              class="cons__option"
              :class="{ 'cons__option--on': i === picked }"
              @mousedown.prevent="take(s)"
            >
              <code>{{ s.text }}</code>
              <span>{{ s.hint }}</span>
            </li>
          </ul>
          <form
            class="cons__send"
            @submit.prevent="send"
          >
            <span aria-hidden="true">›</span>
            <textarea
              ref="input"
              v-model="command"
              rows="1"
              class="cons__line"
              spellcheck="false"
              autocomplete="off"
              :disabled="!klippyConnected"
              placeholder="G-code, or a command name…"
              aria-label="Send G-code"
              data-tid="console-input"
              @input="open = true; picked = -1"
              @keydown="onKey"
              @blur="open = false"
            />
            <span
              v-if="!isMobileViewport"
              class="cons__hint"
              aria-hidden="true"
            >↑ history</span>
            <button
              type="submit"
              class="cbtn cbtn--primary"
              :disabled="!klippyConnected || !command.trim()"
            >
              Send
            </button>
          </form>
        </div>
        <p class="cons__keys">
          {{ keysLine }}
        </p>
      </div>
    </section>

    <div
      v-if="!isMobileViewport"
      class="cons__side"
    >
      <console-macros
        v-if="!isMobileViewport"
        :locked="!controlReady"
        :busy="busy"
        @run="onMacro"
      />
      <section
        v-if="!isMobileViewport"
        class="cons__tile"
        data-tid="console-now"
      >
        <header class="cons__head">
          <h2><frame-icon name="thermometer" /> Now</h2>
        </header>
        <dl class="cons__now">
          <dt>Hotend</dt>
          <dd>{{ reading(hotendReading) }}</dd>
          <dt>Bed</dt>
          <dd>{{ reading(bedReading) }}</dd>
        </dl>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { Globals } from '@/globals'
import type { ConsoleEntry, GcodeHelp } from '@/store/console/types'
import { commandHelp, entryKind, explain, filterEntries, suggestions, type LogFilter, type Suggestion } from '@/services/console/model'
import TonePill from '@/components/printers/TonePill.vue'
import ConsoleMacros from '@/components/console/ConsoleMacros.vue'
import { consoleView } from '@/services/console/view'
import { arrowIsHistory, enterAction, MAX_LINE_ROWS } from '@/services/console/keys'
import type { ShownMacro } from '@/mixins/macros'
import { chipText, consoleConfig, quickCommandsFor, accountQuickKey, type ConsoleConfig, type QuickCommand } from '@/services/console/settings'
import { cloudState } from '@/services/muon-cloud/state'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

/** Quick commands that need more than a ready printer: `moves` ones an idle one; `homed` ones every axis homed too. */
const QUICK_RULES: Record<string, { moves: boolean, homed: boolean }> = {
  G28: { moves: true, homed: false },
  BED_MESH_CALIBRATE: { moves: true, homed: true }
}

const firstWord = (command: string) => command.trim().split(/\s/)[0]?.toUpperCase() ?? ''

interface Line {
  key: string;
  kind: string;
  time: string;
  html: string;
  why: string | null;
}

/**
 * Console (Tools): the printer's log, filtered to commands, warnings or
 * errors and searched, with a plain sentence under the errors people
 * meet most; a line to send G-code that suggests what you've sent before
 * and Klipper's commands with their help. A command in the log, clicked,
 * goes into the line.
 */
@Component({ components: { TonePill, ConsoleMacros } })
export default class Console extends Mixins(ControlMixin, FilesMixin, BrowserMixin) {
  @Ref('scroller')
  readonly scroller!: { $el: HTMLElement, scrollToBottom: () => void }

  get filter (): LogFilter { return consoleView.filter }
  set filter (value: LogFilter) { consoleView.filter = value }

  find = ''
  command = ''

  @Watch('command')
  onCommandChange () { this.fit() }

  open = false
  picked = -1
  /** Where ↑ has got to in the history; -1 is the line being typed. */
  back = -1
  paused = false

  get entries (): ConsoleEntry[] {
    return (this.$store.getters['console/getConsoleEntries'] as ConsoleEntry[]) ?? []
  }

  get knownCommands (): GcodeHelp {
    return (this.$store.getters['console/getAllKnownCommands'] as GcodeHelp) ?? {}
  }

  /** Settings › Console. */
  get prefs (): ConsoleConfig {
    return consoleConfig(this.$store.state.config.uiSettings.console)
  }

  /** Newest at the top (Settings › Console › Newest at). */
  get flipped (): boolean {
    return !!this.$store.state.config.uiSettings.general?.flipConsoleLayout
  }

  get shown (): Line[] {
    const lines = filterEntries(this.entries.slice(-this.prefs.linesKept), this.filter, this.find).map((e, i) => {
      const kind = entryKind(e)
      return {
        key: `${e.id ?? 'n'}-${e.time ?? 0}-${i}`,
        kind,
        time: e.time ? this.$filters.formatTimeWithSeconds(e.time * 1000) : '',
        html: this.linked(e, kind),
        why: kind === 'error' || kind === 'warning' ? explain(e.message) : null
      }
    })
    return this.flipped ? lines.reverse() : lines
  }

  /** Commands Klipper knows, in a reply, become links that put them in the line, as Fluidd's console does. */
  linked (e: ConsoleEntry, kind: string): string {
    if (kind === 'command') return `${Globals.CONSOLE_SEND_PREFIX}<a class="cons__cmd">${e.message}</a>`
    return e.message.replace(/\b([A-Z][A-Z0-9_]{2,})\b/g, (match, word: string) => (word in this.knownCommands ? `<a class="cons__cmd">${word}</a>` : match))
  }

  onLineClick (event: MouseEvent) {
    const target = event.target as HTMLElement
    if (target.tagName !== 'A') return
    this.command = (target.textContent ?? '').trim()
    this.open = false;
    (this.$refs.input as HTMLInputElement).focus()
  }

  // -- the log's scrolling ------------------------------------------------------

  mounted () {
    this.scroller.$el.addEventListener('scroll', this.onScroll)
    this.$nextTick(() => this.toLatest(true))
  }

  beforeDestroy () {
    this.scroller.$el.removeEventListener('scroll', this.onScroll)
  }

  /** Scrolled up to read, the log stays put; at the bottom, it follows. */
  onScroll () {
    const el = this.scroller.$el
    this.paused = this.flipped ? el.scrollTop > 4 : el.scrollHeight - el.scrollTop - el.clientHeight > 4
  }

  @Watch('shown')
  onShown () {
    this.$nextTick(() => this.toLatest())
  }

  toLatest (force = false) {
    if (this.paused && !force) return
    if (this.flipped) {
      if (this.scroller) this.scroller.$el.scrollTop = 0
    } else this.scroller?.scrollToBottom()
    if (force) this.paused = false
  }

  // -- the bar ------------------------------------------------------------------------

  get hideTempWaits (): boolean {
    return !!this.$store.state.config.uiSettings.general.hideTempWaits
  }

  set hideTempWaits (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.hideTempWaits', value, server: true })
  }

  downloadLog () {
    this.downloadFile('klippy.log', 'logs')
  }

  // -- the line ---------------------------------------------------------------------

  /** Sent commands, newest first, as Fluidd keeps them (repeats included, so they can be counted). */
  get history (): string[] {
    return (this.$store.state.console.commandHistory as string[]) ?? []
  }

  get uniqueHistory (): string[] {
    return [...new Set(this.history)]
  }

  get list (): Suggestion[] {
    return this.prefs.suggest ? suggestions(this.command, this.knownCommands, this.history) : []
  }

  get typedCommand (): string {
    return this.command.trim().split(/\s/)[0]?.toUpperCase() ?? ''
  }

  get help (): string | null {
    return commandHelp(this.command, this.knownCommands)
  }

  take (s: Suggestion) {
    this.command = s.from === 'command' ? `${s.text} ` : s.text
    this.open = false
    this.picked = -1
  }

  onKey (event: KeyboardEvent) {
    const listing = this.open && this.list.length > 0
    switch (event.key) {
      case 'Tab':
        if (!listing) return
        this.take(this.list[Math.max(0, this.picked)])
        break
      case 'ArrowDown':
        if (!listing && !this.caretOnEdge('down')) return
        if (listing) this.picked = Math.min(this.list.length - 1, this.picked + 1)
        else this.recall(-1)
        break
      case 'ArrowUp':
        if (!listing && !this.caretOnEdge('up')) return
        if (listing && this.picked > 0) this.picked--
        else if (listing && this.picked === 0) this.picked = -1
        else this.recall(1)
        break
      case 'Enter':
        if (listing && this.picked >= 0 && !event.shiftKey) this.take(this.list[this.picked])
        else if (enterAction(event, this.prefs.enterSends) === 'send') this.send()
        else return
        break
      case 'Escape':
        if (!listing) return
        this.open = false
        break
      default:
        return
    }
    event.preventDefault()
  }

  /** ↑ and ↓ recall history only from the first or last line of what is typed. */
  caretOnEdge (direction: 'up' | 'down'): boolean {
    const el = this.$refs.input as HTMLTextAreaElement | undefined
    if (!el) return true
    return arrowIsHistory(direction, this.command, el.selectionStart, el.selectionEnd)
  }

  /** Grows the line to fit what is typed, up to MAX_LINE_ROWS, then it scrolls. */
  fit () {
    this.$nextTick(() => {
      const el = this.$refs.input as HTMLTextAreaElement | undefined
      if (!el) return
      el.style.height = 'auto'
      const line = parseFloat(getComputedStyle(el).lineHeight) || 21
      el.style.height = `${Math.min(el.scrollHeight, line * MAX_LINE_ROWS)}px`
    })
  }

  /** ↑ goes back through what was sent, ↓ forward again, to an empty line. */
  recall (by: number) {
    const next = Math.max(-1, Math.min(this.uniqueHistory.length - 1, this.back + by))
    this.back = next
    this.command = next < 0 ? '' : this.uniqueHistory[next]
    this.open = false
  }

  // -- the side tiles -----------------------------------------------------------

  /** This person's chips on this printer (Settings › Console). */
  get quick (): QuickCommand[] {
    const key = accountQuickKey(cloudState)
    return key ? quickCommandsFor(this.prefs, key) : []
  }

  get quickSettingsTo (): string {
    return `${scopedPath('/settings', activeSlug())}#console`
  }

  readonly chipLabel = chipText

  /** Why the chips are greyed out, said once under them. */
  get quickNote (): string {
    if (!this.quick.length) return ''
    if (!this.commandControlAvailable) return "You can't send commands to this printer, so the quick commands are off. Who may type is set in People and access."
    return ''
  }

  get keysLine (): string {
    return [this.prefs.suggest ? 'Tab completes' : '', '↑ history', this.prefs.enterSends ? 'Enter sends · Shift Enter adds a line' : 'Enter adds a line · Ctrl Enter sends'].filter(Boolean).join(' · ')
  }

  /** A chip set to "Put it in the input" fills the line to be edited; the rest send. */
  tapQuick (q: QuickCommand) {
    if (q.send) { this.sendNow(q.command); return }
    this.command = q.command
    this.open = false
    this.$nextTick(() => (this.$refs.input as HTMLInputElement | undefined)?.focus())
  }

  get klippyTone (): 'ok' | 'warn' | 'err' | 'off' {
    if (!this.socketConnected || !this.klippyConnected) return 'off'
    return this.klippyReady ? 'ok' : 'warn'
  }

  get klippyLabel (): string {
    if (!this.socketConnected) return 'Offline'
    if (!this.klippyConnected) return 'Klipper not connected'
    return this.klippyReady ? 'Klipper ready' : 'Klipper not ready'
  }

  get hotendReading (): { temperature?: number, target?: number } { return this.$store.state.printer.printer.extruder ?? {} }
  get bedReading (): { temperature?: number, target?: number } { return this.$store.state.printer.printer.heater_bed ?? {} }

  reading (h: { temperature?: number, target?: number }): string {
    if (typeof h.temperature !== 'number') return '–'
    return `${h.temperature.toFixed(1)}° / ${Math.round(h.target ?? 0)}`
  }

  /** Why a chip can't be tapped now, or '' when it can. FIRMWARE_RESTART follows the restart rule, since it is how a stopped Klipper is recovered. */
  chipRefusal (chip: QuickCommand): string {
    const word = firstWord(chip.command)
    const q = QUICK_RULES[word] ?? { moves: false, homed: false }
    if (!chip.send) return this.commandControlAvailable ? '' : 'You can only send when you can control this printer'
    if (word === 'FIRMWARE_RESTART') return this.restartRefusal ? 'Not now. The printer must be connected, under your control, and idle.' : ''
    if (!this.controlReady) return 'You can only send when Klipper is ready and you can control this printer'
    if (q.moves && this.busy) return 'Not while the printer is busy'
    if (q.homed && !this.isHomed('XYZ')) return 'Home the printer first'
    return ''
  }

  chipOff (q: QuickCommand): boolean {
    return !!this.chipRefusal(q)
  }

  chipTitle (q: QuickCommand): string {
    return this.chipRefusal(q) || q.command
  }

  /** A tap on a chip goes the way a typed line does: same checks, same restart confirm. */
  async sendNow (gcode: string) {
    if (!await this.sendTypedGcode(gcode)) return
    this.$store.dispatch('console/onUpdateCommandHistory', [gcode, ...this.history].slice(0, this.prefs.historyCount))
    this.toLatest(true)
  }

  /** A macro with no values runs; one that needs values goes in the line to be filled in. */
  onMacro (macro: ShownMacro) {
    if (!macro.params.length) { this.sendNow(macro.name); return }
    this.command = `${macro.name} `
    this.open = false
    this.$nextTick(() => (this.$refs.input as HTMLInputElement | undefined)?.focus())
  }

  async send () {
    const gcode = this.command.trim()
    if (!await this.sendTypedGcode(gcode)) return
    this.$store.dispatch('console/onUpdateCommandHistory', [gcode, ...this.history].slice(0, this.prefs.historyCount))
    this.command = ''
    this.back = -1
    this.open = false
    this.toLatest(true)
  }
}
</script>

<style lang="scss" scoped>
  // Output and its line to send from are one tile; quick commands, macros and the readings sit beside it.
  .cons {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    min-width: 0;
  }

  .cons__output,
  .cons__tile {
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .cons__output {
    height: calc(100vh - 260px);
    height: calc(100svh - 260px);
    min-height: 460px;
  }

  .cons__tile {
    padding: 18px;
    gap: 12px;
  }

  .cons__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .cons__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }
  }

  .cons__output > .cons__head {
    padding: 16px 18px 0;
  }

  .cons__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 18px 0;
  }

  .cons__find {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 180px;
    max-width: 260px;
    height: 36px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  .cons__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .cons__chip--on {
    background: rgba(128, 214, 209, 0.14);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.5);
    color: var(--m3d-accent);
  }

  .cons__log {
    position: relative;
    flex: 1 1 0;
    min-height: 160px;
    overflow: hidden;
  }

  .cons__scroller {
    height: 100%;
    padding: 8px 18px 12px;
  }

  .cons__line {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 14px;
    padding: 2px 0;
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12.5px;
    line-height: 1.6;

    time {
      color: var(--m3d-text-subtle);
      white-space: nowrap;
    }
  }

  .cons__line--notime {
    grid-template-columns: minmax(0, 1fr);

    .cons__why { grid-column: 1; }
  }

  // Settings › Console › Text size.
  .cons__log--nowrap .cons__msg {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cons__log--sm .cons__line { font-size: 11px; }
  .cons__log--lg .cons__line { font-size: 14.5px; }

  .cons__msg {
    min-width: 0;
    color: var(--m3d-text-muted);
    overflow-wrap: anywhere;
    white-space: pre-wrap;

    :deep(.cons__cmd) {
      color: var(--m3d-accent);
      cursor: pointer;
      text-decoration: none;
    }
  }

  .cons__line--command .cons__msg {
    color: var(--m3d-accent);
  }

  .cons__line--error .cons__msg {
    color: var(--m3d-danger);
  }

  .cons__line--warning .cons__msg {
    color: var(--m3d-warning, #ff9f0a);
  }

  .cons__why {
    grid-column: 2;
    margin: 4px 0 6px;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-family: var(--m3d-font-sans, inherit);
    font-size: 13px;
    line-height: 1.45;
  }

  .cons__empty {
    position: absolute;
    top: 16px;
    left: 18px;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .cons__latest {
    position: absolute;
    right: 16px;
    bottom: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    box-shadow: var(--m3d-shadow-float, 0 4px 16px rgb(0 0 0 / 40%));
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
  }

  // The line to send from stays at the foot of the tile.
  .cons__input {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border-top: 1px solid var(--m3d-border);
  }

  .cons__field {
    position: relative;
  }

  .cons__suggest {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    left: 0;
    z-index: 3;
    margin: 0;
    padding: 6px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    box-shadow: var(--m3d-shadow-float, 0 8px 24px rgb(0 0 0 / 45%));
    list-style: none;
  }

  .cons__option {
    display: flex;
    align-items: baseline;
    gap: 14px;
    padding: 7px 10px;
    border-radius: 10px;
    cursor: pointer;

    code {
      overflow: hidden;
      background: none;
      color: var(--m3d-text);
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      flex: none;
      margin-left: auto;
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .cons__option--on {
    background: rgba(128, 214, 209, 0.12);
  }

  .cons__help {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;

    code {
      background: none;
      color: var(--m3d-accent);
    }
  }

  .cons__send {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 4px 4px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono, monospace);

    textarea {
      flex: 1 1 auto;
      min-width: 0;
      padding: 9px 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      overflow-y: auto;
    }

    input {
      flex: 1 1 auto;
      min-width: 0;
      height: 40px;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  .cons__hint {
    flex: none;
    font-size: 12px;
  }

  // The ring goes round the well, not the text box in it.
  .cons__send input:focus-visible,
  .cons__send textarea:focus-visible,
  .cons__find input:focus-visible {
    outline: none;
  }

  .cons__send:focus-within,
  .cons__find:focus-within {
    box-shadow: 0 0 0 2px var(--m3d-accent);
  }

  .cons__keys {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .cons__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cons__quick {
    padding: 7px 12px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12px;

    &:disabled { opacity: 0.45; }
  }

  .cons__quick--edit {
    display: inline-flex;
    align-items: center;
    color: var(--m3d-text-muted);
    text-decoration: none;
  }

  .cons__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .cons__now {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0;
    color: var(--m3d-text-muted);

    dd {
      margin: 0;
      color: var(--m3d-text);
      font-weight: 700;
      text-align: right;
    }
  }

  @media (max-width: 1023px) {
    .cons {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  // A phone: the output first, the quick commands under it, the line to send always in view.
  .cons--phone {
    .cons__output {
      height: calc(100svh - 330px);
      min-height: 380px;
    }

    .cons__scroller {
      padding: 8px 12px;
    }

    .cons__log--md .cons__line {
      font-size: 11.5px;
    }

    .cons__keys {
      display: none;
    }
  }
</style>
