import type { TileTone } from '@/services/printers-page/model'

/** A systemd service's state, for people. */
export function serviceState (active: string | undefined, sub: string | undefined): { text: string, tone: TileTone } {
  if (active === 'active') return sub === 'running' || !sub ? { text: 'Running', tone: 'ok' } : { text: sub.charAt(0).toUpperCase() + sub.slice(1), tone: 'ok' }
  if (active === 'activating' || active === 'reloading') return { text: 'Starting', tone: 'run' }
  if (active === 'deactivating') return { text: 'Stopping', tone: 'warn' }
  if (active === 'failed') return { text: 'Failed', tone: 'err' }
  if (active === 'inactive') return { text: 'Stopped', tone: 'off' }
  return { text: active || 'Unknown', tone: 'off' }
}

/**
 * The operating system's name, as Fluidd worked it out: some builds put a
 * version where the name goes (that one is left out), and a name starting
 * with # stands for the id.
 */
export function osName (dist: { name?: string, id?: string, release_info?: { version_id?: string } } | undefined): string | null {
  const name = dist?.name
  if (!name || name.startsWith('0.')) return null
  return `${name.startsWith('#') ? dist?.id : name} ${dist?.release_info?.version_id ?? ''}`.trim()
}

/** Each network interface with its addresses, IPv4 first and IPv6 only when there's no IPv4. */
export function networkLines (network: Record<string, { ip_addresses?: Array<{ family?: string, address?: string }> }> | undefined): string[] {
  return Object.entries(network ?? {}).map(([name, entry]) => {
    const all = entry.ip_addresses ?? []
    const v4 = all.filter(a => a.family === 'ipv4')
    const shown = v4.length ? v4 : all.filter(a => a.family === 'ipv6')
    return shown.length ? `${name} · ${shown.map(a => a.address ?? '').join(', ')}` : name
  })
}

/** "520 MHz", "64 MHz", "12 kHz". */
export function frequency (hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(1)} GHz`
  if (hz >= 1e6) return `${Math.round(hz / 1e6)} MHz`
  if (hz >= 1e3) return `${Math.round(hz / 1e3)} kHz`
  return `${hz} Hz`
}

/** How full the disk is: a share for the bar and a sentence. */
export function diskUse (usage: { total?: number, used?: number, free?: number } | undefined, size: (bytes: number) => string): { share: number, text: string } | null {
  if (!usage?.total) return null
  const used = usage.used ?? usage.total - (usage.free ?? 0)
  const share = Math.min(1, Math.max(0, used / usage.total))
  return { share, text: `${size(used)} of ${size(usage.total)} used · ${size(usage.free ?? usage.total - used)} free` }
}

/** The latest number of a chart series, which the chart store keeps as strings. */
export function latest (points: Array<Record<string, unknown>> | undefined, key: string): number | null {
  const last = points?.[points.length - 1]
  if (!last) return null
  const value = Number(last[key])
  return Number.isFinite(value) ? value : null
}

export interface LoadBar {
  key: 'cpu' | 'memory' | 'disk' | 'temperature';
  label: string;
  /** What the bar says in a word or two: "18%", "47 °C", "—". */
  value: string;
  /** The small print beside it: "of 4 GB". */
  sub: string;
  /** How full the bar is, 0 to 1. */
  share: number;
}

const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0))

/**
 * The four bars of the System page's Load tile: the processor (its load
 * against its cores), memory, disk and temperature (against 85 °C, where a
 * Raspberry Pi starts to slow itself down). A number the printer hasn't
 * reported is a dash and an empty bar, never a made-up zero.
 */
export function loadBars (input: {
  load: number | null;
  cores: number;
  memoryPercent: number | null;
  memoryTotalKb?: number;
  disk: { share: number, text: string } | null;
  temperature: number | null;
}, size: (bytes: number) => string): LoadBar[] {
  const cpu = input.load === null ? null : clamp(input.load / Math.max(1, input.cores))
  const memory = input.memoryPercent === null ? null : clamp(input.memoryPercent / 100)
  return [
    {
      key: 'cpu',
      label: 'CPU',
      value: cpu === null ? '—' : `${Math.round(cpu * 100)}%`,
      sub: `load, of ${input.cores} ${input.cores === 1 ? 'core' : 'cores'}`,
      share: cpu ?? 0
    },
    {
      key: 'memory',
      label: 'Memory',
      value: memory === null ? '—' : `${Math.round(memory * 100)}%`,
      sub: input.memoryTotalKb ? `of ${size(input.memoryTotalKb * 1024)}` : 'in use',
      share: memory ?? 0
    },
    {
      key: 'disk',
      label: 'Disk',
      value: input.disk ? `${Math.round(input.disk.share * 100)}%` : '—',
      sub: input.disk ? input.disk.text : '',
      share: input.disk?.share ?? 0
    },
    {
      key: 'temperature',
      label: 'Temperature',
      value: input.temperature === null ? '—' : `${Math.round(input.temperature)} °C`,
      sub: '',
      share: input.temperature === null ? 0 : clamp(input.temperature / 85)
    }
  ]
}

/** Healthy until anything is nearly full or hot. */
export function loadHealth (bars: LoadBar[]): { text: string, tone: TileTone } {
  return bars.some(b => b.share > 0.9) ? { text: 'Busy', tone: 'warn' } : { text: 'Healthy', tone: 'ok' }
}

/** What the services line under the title says. */
export function servicesLine (services: Array<{ inactive: boolean, state: { tone: TileTone } }>): string {
  if (!services.length) return ''
  const down = services.filter(s => s.state.tone === 'err').length
  if (down) return down === 1 ? '1 service has failed' : `${down} services have failed`
  const stopped = services.filter(s => s.inactive).length
  if (stopped) return stopped === 1 ? '1 service stopped' : `${stopped} services stopped`
  return 'all services running'
}

/** The first network interface named like one of `prefixes` that has an IPv4 address (Wi-Fi: wlan; cable: eth, en). */
export function interfaceIp (network: Record<string, { ip_addresses?: Array<{ family?: string, address?: string }> }> | undefined, prefixes: string[]): { name: string, ip: string } | null {
  for (const [name, entry] of Object.entries(network ?? {})) {
    if (!prefixes.some(p => name.startsWith(p))) continue
    const v4 = (entry.ip_addresses ?? []).find(a => a.family === 'ipv4' && a.address)
    if (v4?.address) return { name, ip: v4.address }
  }
  return null
}

/** A signal percentage in a word. */
export function signalWord (signal: number): string {
  if (signal >= 75) return 'Excellent'
  if (signal >= 50) return 'Good'
  if (signal >= 25) return 'Fair'
  return 'Weak'
}
