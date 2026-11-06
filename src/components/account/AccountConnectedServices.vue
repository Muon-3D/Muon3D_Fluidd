<template>
  <section
    class="acct-section svc"
    aria-labelledby="services-title"
    data-tid="account-services"
  >
    <div class="acct-head svc__head">
      <h2 id="services-title">
        Connected services
      </h2>
      <p>AI agents you let act on your printers. The colour is the one Control tints a control in while that agent uses it. Revoke one and it stops at once, on every printer.</p>
    </div>

    <section
      v-if="!state.missing && rows.length"
      class="lib-surface acct-card"
      aria-label="Your connected services"
      data-tid="services-list"
    >
      <div class="acct-list">
        <div
          v-for="row in rows"
          :key="row.key"
          class="svc__row"
          :class="{ 'svc__row--off': row.status !== 'active' }"
          data-tid="services-row"
        >
          <span
            class="svc__dot"
            :style="{ background: row.colour }"
            aria-hidden="true"
            data-tid="services-dot"
          />
          <div class="acct-row__label svc__body">
            <span class="svc__name">
              <b data-tid="services-name">{{ row.name }}</b>
              <span
                class="lib-pill"
                :class="statusClass(row.status)"
                data-tid="services-status"
              >{{ statusText(row.status) }}</span>
            </span>
            <span data-tid="services-provider">{{ row.provider }}<template v-if="row.clientUri"> · <span
              class="svc__uri"
              data-tid="services-client-uri"
            >{{ row.clientUri }}</span></template></span>
            <span data-tid="services-printers">{{ row.printers }}</span>
            <span
              class="acct-muted"
              data-tid="services-times"
            >{{ row.expires }} · {{ row.lastActive }}</span>
          </div>
          <button
            v-if="row.agentId && row.status !== 'revoked'"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost svc__revoke"
            :disabled="busy"
            :aria-label="`Revoke ${row.name}`"
            data-tid="services-revoke"
            @click="revoke(row)"
          >
            Revoke
          </button>
        </div>
      </div>
    </section>

    <div
      v-else-if="state.connections === null"
      class="lib-surface acct-card acct-card--pad"
    >
      <p class="acct-muted">
        Reading your connected services…
      </p>
    </div>

    <div
      v-else-if="state.missing"
      class="acct-empty"
      data-tid="services-missing"
    >
      <h3>Connected services come soon</h3>
      <p>This console can't list connected services yet.</p>
    </div>

    <div
      v-else-if="state.loadError"
      class="acct-empty"
      data-tid="services-load-error"
    >
      <h3>Your connected services didn't load</h3>
      <p>This doesn't mean you have none. Try again in a moment.</p>
      <button
        type="button"
        class="lib-btn"
        data-tid="services-retry"
        @click="retry"
      >
        Try again
      </button>
    </div>

    <div
      v-else
      class="acct-empty"
      data-tid="services-empty"
    >
      <h3>No connected services</h3>
      <p>When you let an AI agent act on a printer, it shows here with its colour.</p>
    </div>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
      data-tid="services-message"
    >
      <span>{{ message }}</span>
    </p>
    <p
      v-if="error"
      class="acct-error"
      role="alert"
      data-tid="services-error"
    >
      {{ error }}
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { agentsState, refreshConnections, revokeAgent, watchConnections, type AgentConnection } from '@/services/agents'
import { colourOf } from '@/directives/agentHighlight'
import { isMissing } from '@/services/account/client'
import { appFailure } from '@/services/account/connectedApps'

export interface ServiceRow {
  key: string;
  agentId: string | null;
  name: string;
  colour: string;
  provider: string;
  /** Text only: the client says this about itself, so it's never a link. */
  clientUri: string;
  printers: string;
  expires: string;
  lastActive: string;
  status: string;
}

const STATUS: Record<string, string> = { active: 'Active', paused: 'Paused', expired: 'Expired', revoked: 'Revoked' }

function when (iso: string | null, now: number): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const minutes = Math.round((t - now) / 60_000)
  const abs = Math.abs(minutes)
  const unit = abs < 60 ? ['minute', minutes] : abs < 60 * 48 ? ['hour', Math.round(minutes / 60)] : ['day', Math.round(minutes / 1440)]
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(unit[1] as number, unit[0] as Intl.RelativeTimeFormatUnit)
}

export function serviceRow (c: AgentConnection, index: number, now = Date.now()): ServiceRow {
  const agent = c.agent
  const printers = (c.printers ?? []).map(p => p.name || 'A printer')
  const expires = when(c.expires_at, now)
  const last = when(c.last_active_at, now)
  return {
    key: agent?.id ?? c.client?.id ?? `row-${index}`,
    agentId: agent?.id ?? null,
    name: agent?.name?.trim() || c.client?.name?.trim() || 'Agent',
    colour: agent
      ? colourOf({ agentId: agent.id, colourIndex: typeof agent.colour_index === 'number' ? agent.colour_index : null, colour: agent.colour })
      : 'var(--m3d-agent-neutral)',
    provider: agent?.provider || 'Unknown provider',
    clientUri: typeof c.client?.client_uri === 'string' ? c.client.client_uri : '',
    printers: printers.length ? printers.join(', ') : 'No printers',
    expires: expires ? (Date.parse(c.expires_at as string) > now ? `Expires ${expires}` : `Expired ${expires}`) : 'Never expires',
    lastActive: last ? `Last active ${last}` : 'Never used',
    status: c.status || 'active'
  }
}

/**
 * Connected services (KAN-1359): the agents with a grant on this account's
 * printers, from `GET /v1/agents`, each in the colour Control tints with.
 * Revoke ends every grant the agent holds (`POST /v1/agents/{id}/revoke`);
 * the stream's `agent.revoked` then reaches every open tab.
 */
@Component
export default class AccountConnectedServices extends Vue {
  state = agentsState
  busy = false
  error = ''
  message = ''
  release: (() => void) | null = null

  created () {
    this.release = watchConnections()
  }

  beforeDestroy () {
    this.release?.()
  }

  get rows (): ServiceRow[] {
    return (this.state.connections ?? []).map((c, i) => serviceRow(c, i))
  }

  statusText (status: string): string {
    return STATUS[status] ?? status
  }

  statusClass (status: string): string {
    return status === 'active' ? 'lib-pill--ok' : status === 'revoked' || status === 'expired' ? 'lib-pill--warn' : ''
  }

  retry () {
    refreshConnections()
  }

  async revoke (row: ServiceRow) {
    if (!row.agentId) return
    const sure = await this.$confirm(`${row.name} loses access to every printer at once, and anything it is doing now stops. To use it again, connect it and approve it again.`, {
      title: `Revoke ${row.name}?`,
      buttonTrueText: 'Revoke'
    })
    if (!sure) return
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await revokeAgent(row.agentId)
      this.message = `${row.name} is revoked.`
    } catch (error) {
      this.error = isMissing(error) ? 'This console can\'t revoke services yet.' : appFailure(error)
    } finally {
      this.busy = false
      await refreshConnections()
    }
  }
}
</script>

<style lang="scss" scoped>
  .svc {
    margin-top: 28px;
  }

  .svc__head h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--m3d-text);
  }

  .svc__row {
    display: grid;
    grid-template-columns: 14px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
    padding: 14px 0;
  }

  .svc__row--off {
    opacity: 0.7;
  }

  .svc__dot {
    width: 12px;
    height: 12px;
    margin-top: 4px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--m3d-surface, transparent);
  }

  .svc__body {
    gap: 4px;
  }

  .svc__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .svc__uri {
    word-break: break-all;
  }
</style>
