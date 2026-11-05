/**
 * A fixed-size, column-wise history buffer for the temperature graph.
 *
 * It lives outside Vue's reactivity on purpose: pushing a sample costs a few
 * typed-array writes and never wakes a component. The graph reads it once a
 * second and draws from it.
 */
const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v)
  return NaN
}

export class SeriesRing {
  private times: Float64Array
  private columns = new Map<string, Float64Array>()
  private start = 0
  size = 0

  constructor (readonly capacity: number) {
    if (!(capacity > 0)) throw new RangeError('capacity must be positive')
    this.times = new Float64Array(capacity)
  }

  clear () { this.start = 0; this.size = 0; this.columns.forEach(c => c.fill(NaN)) }

  /** Replaces everything held with `rows` (oldest first). */
  seed (rows: ReadonlyArray<{ date: Date }>) {
    this.clear()
    for (const row of rows) this.push(row)
  }

  /** Adds a sample. One older than the newest is dropped, so the order never breaks. */
  push (row: { date: Date, [key: string]: unknown }) {
    const t = row.date.getTime()
    if (!Number.isFinite(t)) return
    if (this.size > 0 && t < this.newest()!) return
    let slot: number
    if (this.size < this.capacity) slot = (this.start + this.size++) % this.capacity
    else { slot = this.start; this.start = (this.start + 1) % this.capacity }
    this.times[slot] = t
    for (const c of this.columns.values()) c[slot] = NaN
    for (const key of Object.keys(row)) {
      if (key === 'date') continue
      const v = toNumber(row[key])
      let col = this.columns.get(key)
      if (!col) {
        if (!Number.isFinite(v)) continue
        col = new Float64Array(this.capacity).fill(NaN)
        this.columns.set(key, col)
      }
      col[slot] = v
    }
  }

  oldest (): number | null { return this.size ? this.times[this.start] : null }
  newest (): number | null { return this.size ? this.times[(this.start + this.size - 1) % this.capacity] : null }

  /** Newest finite reading of a column, or null. */
  latest (key: string): number | null {
    const col = this.columns.get(key)
    if (!col) return null
    for (let i = this.size - 1; i >= 0; i--) {
      const v = col[(this.start + i) % this.capacity]
      if (Number.isFinite(v)) return v
    }
    return null
  }

  /** Logical index of the first sample at or after `t`. */
  private lowerBound (t: number): number {
    let lo = 0
    let hi = this.size
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (this.times[(this.start + mid) % this.capacity] < t) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  /**
   * Points of one column between `from` and `to` (ms, inclusive), in time order,
   * missing readings left out. Over `maxPoints` it keeps the lowest and highest
   * reading of each bucket, so a spike always survives.
   */
  extract (key: string, from: number, to: number, maxPoints: number, scale = 1): Array<[number, number]> {
    const col = this.columns.get(key)
    if (!col || !this.size) return []
    const first = this.lowerBound(from)
    const last = this.lowerBound(to + 1)
    const valid: number[] = []
    for (let i = first; i < last; i++) {
      if (Number.isFinite(col[(this.start + i) % this.capacity])) valid.push(i)
    }
    const point = (i: number): [number, number] => {
      const slot = (this.start + i) % this.capacity
      return [this.times[slot], col[slot] * scale]
    }
    if (valid.length <= maxPoints) return valid.map(point)
    const buckets = Math.max(1, Math.floor(maxPoints / 2))
    const per = valid.length / buckets
    const out: Array<[number, number]> = []
    for (let b = 0; b < buckets; b++) {
      const lo = Math.floor(b * per)
      const hi = Math.min(valid.length, Math.floor((b + 1) * per))
      if (lo >= hi) continue
      let min = valid[lo]
      let max = valid[lo]
      for (let j = lo + 1; j < hi; j++) {
        const slot = (this.start + valid[j]) % this.capacity
        if (col[slot] < col[(this.start + min) % this.capacity]) min = valid[j]
        if (col[slot] > col[(this.start + max) % this.capacity]) max = valid[j]
      }
      if (b === 0 && valid[lo] !== min && valid[lo] !== max) out.push(point(valid[lo]))
      if (min === max) out.push(point(min))
      else if (min < max) out.push(point(min), point(max))
      else out.push(point(max), point(min))
    }
    return out
  }
}
