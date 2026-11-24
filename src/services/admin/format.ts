/** Number formatting for the admin portal (spec section 6, "Numbers"). Values arrive in the unit the catalogue declares. */
const BINARY = ['B', 'KiB', 'MiB', 'GiB', 'TiB']

export function formatValue (value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  switch (unit) {
    case 'ms': return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`
    case 's': return value < 1 ? `${Math.round(value * 1000)} ms` : `${value.toFixed(1)} s`
    case '%': return `${Number(value.toFixed(2))} %`
    case 'bytes': {
      let n = Math.abs(value); let i = 0
      while (n >= 1024 && i < BINARY.length - 1) { n /= 1024; i++ }
      return `${value < 0 ? '-' : ''}${n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)} ${BINARY[i]}`
    }
    case 'duration': return formatDuration(value)
    default: return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}${unit && unit !== 'count' ? ` ${unit}` : ''}`
  }
}

export function formatDuration (seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)} s`
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`
  if (seconds < 172800) return `${(seconds / 3600).toFixed(1)} h`
  return `${Math.round(seconds / 86400)} d`
}

/** `m:ss` under ten minutes, `mm:ss` above. */
export function countdown (seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  return `${m < 10 ? m : String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function ago (seconds: number): string {
  return seconds < 5 ? 'just now' : `${formatDuration(seconds)} ago`
}
