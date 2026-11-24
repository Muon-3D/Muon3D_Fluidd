<template>
  <div class="admin-tools">
    <header class="admin-title">
      <h1>{{ title }}</h1>
      <p class="muted">
        Staff tools
      </p>
    </header>
    <p
      v-if="message"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </p>
    <p class="admin-notice">
            Searches and audit reads are recorded with your account and reason.
          </p>
          <admin-moderation
            v-if="section === 'queue' || section === 'reservations'"
            :key="section"
            :section="section"
            :actor="actor"
            @spent="spent"
            @expired="expired"
          />
          <form
            v-else
            class="admin-card"
            @submit.prevent="read(false)"
          >
            <template v-if="section === 'accounts'">
              <label for="admin-query">Exact email, account ID or handle</label>
              <input
                id="admin-query"
                v-model="query"
                name="query"
                required
                maxlength="254"
                autocomplete="off"
              >
            </template>
            <template v-else>
              <label for="admin-source">Audit log</label>
              <select
                id="admin-source"
                v-model="source"
                @change="clearResults"
              >
                <option value="console">
                  Accounts
                </option><option value="community">
                  Community
                </option>
              </select>
            </template>
            <label for="admin-reason">Why are you looking this up?</label>
            <textarea
              id="admin-reason"
              v-model="reason"
              name="reason"
              required
              minlength="8"
              maxlength="500"
            />
            <button
              type="submit"
              class="cbtn cbtn--primary"
              data-tid="admin-lookup"
              :disabled="busy"
            >
              {{ busy ? 'Reading…' : section === 'accounts' ? 'Find account' : 'Read audit' }}
            </button>
          </form>
          <section
            v-if="account"
            ref="accountResult"
            class="admin-card"
            aria-label="Account result"
            tabindex="-1"
          >
            <h2>{{ account.name }}</h2><p class="muted">
              {{ account.id }}
            </p>
            <dl>
              <dt>Email</dt><dd>{{ account.email }}</dd><dt>Email confirmed</dt><dd>{{ account.email_verified ? 'Yes' : 'No' }}</dd>
              <dt>Active sessions</dt><dd>{{ account.sessions }}</dd><dt>Account status</dt><dd>{{ account.delete_after ? 'Deletion scheduled' : 'Active' }}</dd>
              <template v-if="account.delete_after">
                <dt>Deletion date</dt><dd>{{ date(account.delete_after) }}</dd>
              </template>
            </dl>
            <admin-account-actions
              v-if="account.admin_version !== undefined"
              :key="account.id + ':' + account.admin_version"
              :account="account"
              @spent="spent"
              @expired="expired"
              @refresh="read(false)"
            />
          </section>
          <section
            v-if="entries.length"
            ref="auditResults"
            class="admin-card admin-scroll"
            aria-label="Audit results"
            tabindex="-1"
          >
            <table>
              <caption>Staff audit log</caption>
              <thead><tr><th>Time</th><th>Staff / action</th><th>Reason / result</th></tr></thead><tbody>
                <tr
                  v-for="entry in entries"
                  :key="entry.id"
                >
                  <td>{{ date(entry.at) }}</td><td>{{ entry.actor }}<br>{{ entry.action }}<br>{{ entry.target }}</td><td>{{ entry.reason }}<br><span class="muted">{{ entry.result }}</span></td>
                </tr>
              </tbody>
            </table>
            <button
              v-if="next"
              type="button"
              class="cbtn"
              :disabled="busy"
              aria-label="Load the next page of older audit entries"
              @click="read(true)"
            >
              Load older entries
            </button>
          </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { lookupAccount, readAudit, type AdminAccount, type AuditEntry } from '@/services/admin/client'
import { portal, sync, noteFailure } from '@/services/admin/session'
import AdminModeration from '@/components/admin/AdminModeration.vue'
import AdminAccountActions from '@/components/admin/AdminAccountActions.vue'

const TOOLS: Record<string, { section: string; title: string }> = {
  accounts: { section: 'accounts', title: 'Accounts' },
  audit: { section: 'audit', title: 'Audit log' },
  review: { section: 'queue', title: 'Review queue' },
  handles: { section: 'reservations', title: 'Handle reservations' }
}

/**
 * The four staff tools, now children of the admin portal (KAN-6100). The shell
 * owns the session (60 minutes, 15 idle) and draws this only while it is open;
 * the tools no longer confirm or lock themselves.
 */
@Component({ components: { AdminModeration, AdminAccountActions } })
export default class AdminTools extends Vue {
  source: 'console' | 'community' = 'console'
  query = ''
  reason = ''
  message = ''
  busy = false
  account: AdminAccount | null = null
  entries: AuditEntry[] = []
  next: number | null = null
  revision = 0

  get tool () { return TOOLS[String(this.$route.params.tool)] ?? TOOLS.accounts }
  get section (): string { return this.tool.section }
  get title (): string { return this.tool.title }
  get actor (): string { return portal.actor }

  @Watch('section')
  onSection () { this.clearResults() }

  beforeDestroy () { this.revision++ }
  clearResults () { this.revision++; this.account = null; this.entries = []; this.next = null; this.message = ''; this.busy = false }
  spent () { this.clearResults(); this.message = 'Saved.' }
  expired () { this.clearResults(); void sync() }
  date (seconds: number): string { return new Date(seconds * 1000).toLocaleString() }
  failure (error: unknown) {
    if (noteFailure(error)) { this.message = ''; return }
    this.message = error instanceof Error ? error.message : 'Staff tools could not be reached. Try again.'
  }

  async read (older: boolean) {
    const revision = ++this.revision
    if (!older) { this.account = null; this.entries = []; this.next = null }
    this.busy = true; this.message = 'Loading…'
    try {
      const result = this.section === 'accounts' ? await lookupAccount(this.query, this.reason) : await readAudit(this.source, older ? this.next : null, this.reason)
      if (revision !== this.revision) return
      if ('account' in result) { this.account = result.account; this.message = result.account ? 'Account result loaded.' : 'No account matched that exact email, ID or handle.' } else {
        this.entries = older ? [...this.entries, ...result.entries] : result.entries; this.next = result.next
        this.message = !this.entries.length ? 'No audit entries yet.' : older ? 'Older audit entries loaded.' : 'Audit log loaded.'
      }
      await this.$nextTick()
      if (!older) ((this.account ? this.$refs.accountResult : this.$refs.auditResults) as HTMLElement | undefined)?.focus()
    } catch (error) { if (revision === this.revision) this.failure(error) } finally { if (revision === this.revision) this.busy = false }
  }
}
</script>

<style lang="scss" scoped>
.admin-title h1 { font-family: var(--m3d-font-display); font-size: 18px; font-weight: 400; }
h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.muted { color: var(--m3d-text-muted); font-size: 13px; } p { margin-top: 8px; } .admin-notice { padding: 12px 16px; margin: 16px 0; border: 1px solid var(--m3d-border); border-radius: 6px; color: var(--m3d-text-muted); }
.admin-card { padding: 24px; margin-bottom: 20px; border: 1px solid var(--m3d-border); border-radius: 6px; background: var(--m3d-surface); }
label { display: block; margin-bottom: 8px; font-weight: 500; } input, textarea, select { display: block; width: 100%; padding: 10px 12px; margin-bottom: 20px; border: 1px solid var(--m3d-border); border-radius: 4px; background: var(--m3d-inset); color: var(--m3d-text); font: inherit; } textarea { min-height: 80px; }
dl { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 12px; } dt { color: var(--m3d-text-muted); } dd { margin: 0; overflow-wrap: anywhere; }
.admin-scroll { max-width: 100%; overflow-x: auto; } table { width: 100%; table-layout: fixed; border-collapse: collapse; } caption { padding: 0 0 12px; text-align: left; font-weight: 600; } th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--m3d-border); overflow-wrap: anywhere; word-break: break-word; } th { font-size: 11px; color: var(--m3d-text-muted); }
@media (max-width: 760px) { .admin-card { padding: 16px; } dl { grid-template-columns: minmax(0, 1fr); gap: 4px; } dd { margin-bottom: 12px; } }
</style>
