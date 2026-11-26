const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return NaN;
};
export class SeriesRing {
  constructor(capacity) {
    this.capacity = capacity;
    if (!(capacity > 0)) throw new RangeError("capacity must be positive");
    this.times = new Float64Array(capacity);
  }
  times;
  columns = /* @__PURE__ */ new Map();
  start = 0;
  size = 0;
  clear() {
    this.start = 0;
    this.size = 0;
    this.columns.forEach((c) => c.fill(NaN));
  }
  /** Replaces everything held with `rows` (oldest first). */
  seed(rows) {
    this.clear();
    for (const row of rows) this.push(row);
  }
  /** Adds a sample. One older than the newest is dropped, so the order never breaks. */
  push(row) {
    const t = row.date.getTime();
    if (!Number.isFinite(t)) return;
    if (this.size > 0 && t < this.newest()) return;
    let slot;
    if (this.size < this.capacity) slot = (this.start + this.size++) % this.capacity;
    else {
      slot = this.start;
      this.start = (this.start + 1) % this.capacity;
    }
    this.times[slot] = t;
    for (const c of this.columns.values()) c[slot] = NaN;
    for (const key of Object.keys(row)) {
      if (key === "date") continue;
      const v = toNumber(row[key]);
      let col = this.columns.get(key);
      if (!col) {
        if (!Number.isFinite(v)) continue;
        col = new Float64Array(this.capacity).fill(NaN);
        this.columns.set(key, col);
      }
      col[slot] = v;
    }
  }
  oldest() {
    return this.size ? this.times[this.start] : null;
  }
  newest() {
    return this.size ? this.times[(this.start + this.size - 1) % this.capacity] : null;
  }
  /** Newest finite reading of a column, or null. */
  latest(key) {
    const col = this.columns.get(key);
    if (!col) return null;
    for (let i = this.size - 1; i >= 0; i--) {
      const v = col[(this.start + i) % this.capacity];
      if (Number.isFinite(v)) return v;
    }
    return null;
  }
  /** Logical index of the first sample at or after `t`. */
  lowerBound(t) {
    let lo = 0;
    let hi = this.size;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (this.times[(this.start + mid) % this.capacity] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  /**
   * Points of one column between `from` and `to` (ms, inclusive), in time order,
   * missing readings left out. Over `maxPoints` it keeps the lowest and highest
   * reading of each bucket, so a spike always survives.
   */
  extract(key, from, to, maxPoints, scale = 1) {
    const col = this.columns.get(key);
    if (!col || !this.size) return [];
    const first = this.lowerBound(from);
    const last = this.lowerBound(to + 1);
    const valid = [];
    for (let i = first; i < last; i++) {
      if (Number.isFinite(col[(this.start + i) % this.capacity])) valid.push(i);
    }
    const point = (i) => {
      const slot = (this.start + i) % this.capacity;
      return [this.times[slot], col[slot] * scale];
    };
    if (valid.length <= maxPoints) return valid.map(point);
    const buckets = Math.max(1, Math.floor(maxPoints / 2));
    const per = valid.length / buckets;
    const out = [];
    for (let b = 0; b < buckets; b++) {
      const lo = Math.floor(b * per);
      const hi = Math.min(valid.length, Math.floor((b + 1) * per));
      if (lo >= hi) continue;
      let min = valid[lo];
      let max = valid[lo];
      for (let j = lo + 1; j < hi; j++) {
        const slot = (this.start + valid[j]) % this.capacity;
        if (col[slot] < col[(this.start + min) % this.capacity]) min = valid[j];
        if (col[slot] > col[(this.start + max) % this.capacity]) max = valid[j];
      }
      if (b === 0 && valid[lo] !== min && valid[lo] !== max) out.push(point(valid[lo]));
      if (min === max) out.push(point(min));
      else if (min < max) out.push(point(min), point(max));
      else out.push(point(max), point(min));
    }
    return out;
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBIGZpeGVkLXNpemUsIGNvbHVtbi13aXNlIGhpc3RvcnkgYnVmZmVyIGZvciB0aGUgdGVtcGVyYXR1cmUgZ3JhcGguXG4gKlxuICogSXQgbGl2ZXMgb3V0c2lkZSBWdWUncyByZWFjdGl2aXR5IG9uIHB1cnBvc2U6IHB1c2hpbmcgYSBzYW1wbGUgY29zdHMgYSBmZXdcbiAqIHR5cGVkLWFycmF5IHdyaXRlcyBhbmQgbmV2ZXIgd2FrZXMgYSBjb21wb25lbnQuIFRoZSBncmFwaCByZWFkcyBpdCBvbmNlIGFcbiAqIHNlY29uZCBhbmQgZHJhd3MgZnJvbSBpdC5cbiAqL1xuY29uc3QgdG9OdW1iZXIgPSAodjogdW5rbm93bik6IG51bWJlciA9PiB7XG4gIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicpIHJldHVybiB2XG4gIGlmICh0eXBlb2YgdiA9PT0gJ3N0cmluZycgJiYgdi50cmltKCkgIT09ICcnKSByZXR1cm4gTnVtYmVyKHYpXG4gIHJldHVybiBOYU5cbn1cblxuZXhwb3J0IGNsYXNzIFNlcmllc1Jpbmcge1xuICBwcml2YXRlIHRpbWVzOiBGbG9hdDY0QXJyYXlcbiAgcHJpdmF0ZSBjb2x1bW5zID0gbmV3IE1hcDxzdHJpbmcsIEZsb2F0NjRBcnJheT4oKVxuICBwcml2YXRlIHN0YXJ0ID0gMFxuICBzaXplID0gMFxuXG4gIGNvbnN0cnVjdG9yIChyZWFkb25seSBjYXBhY2l0eTogbnVtYmVyKSB7XG4gICAgaWYgKCEoY2FwYWNpdHkgPiAwKSkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2NhcGFjaXR5IG11c3QgYmUgcG9zaXRpdmUnKVxuICAgIHRoaXMudGltZXMgPSBuZXcgRmxvYXQ2NEFycmF5KGNhcGFjaXR5KVxuICB9XG5cbiAgY2xlYXIgKCkgeyB0aGlzLnN0YXJ0ID0gMDsgdGhpcy5zaXplID0gMDsgdGhpcy5jb2x1bW5zLmZvckVhY2goYyA9PiBjLmZpbGwoTmFOKSkgfVxuXG4gIC8qKiBSZXBsYWNlcyBldmVyeXRoaW5nIGhlbGQgd2l0aCBgcm93c2AgKG9sZGVzdCBmaXJzdCkuICovXG4gIHNlZWQgKHJvd3M6IFJlYWRvbmx5QXJyYXk8eyBkYXRlOiBEYXRlIH0+KSB7XG4gICAgdGhpcy5jbGVhcigpXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykgdGhpcy5wdXNoKHJvdylcbiAgfVxuXG4gIC8qKiBBZGRzIGEgc2FtcGxlLiBPbmUgb2xkZXIgdGhhbiB0aGUgbmV3ZXN0IGlzIGRyb3BwZWQsIHNvIHRoZSBvcmRlciBuZXZlciBicmVha3MuICovXG4gIHB1c2ggKHJvdzogeyBkYXRlOiBEYXRlLCBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pIHtcbiAgICBjb25zdCB0ID0gcm93LmRhdGUuZ2V0VGltZSgpXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodCkpIHJldHVyblxuICAgIGlmICh0aGlzLnNpemUgPiAwICYmIHQgPCB0aGlzLm5ld2VzdCgpISkgcmV0dXJuXG4gICAgbGV0IHNsb3Q6IG51bWJlclxuICAgIGlmICh0aGlzLnNpemUgPCB0aGlzLmNhcGFjaXR5KSBzbG90ID0gKHRoaXMuc3RhcnQgKyB0aGlzLnNpemUrKykgJSB0aGlzLmNhcGFjaXR5XG4gICAgZWxzZSB7IHNsb3QgPSB0aGlzLnN0YXJ0OyB0aGlzLnN0YXJ0ID0gKHRoaXMuc3RhcnQgKyAxKSAlIHRoaXMuY2FwYWNpdHkgfVxuICAgIHRoaXMudGltZXNbc2xvdF0gPSB0XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucy52YWx1ZXMoKSkgY1tzbG90XSA9IE5hTlxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHJvdykpIHtcbiAgICAgIGlmIChrZXkgPT09ICdkYXRlJykgY29udGludWVcbiAgICAgIGNvbnN0IHYgPSB0b051bWJlcihyb3dba2V5XSlcbiAgICAgIGxldCBjb2wgPSB0aGlzLmNvbHVtbnMuZ2V0KGtleSlcbiAgICAgIGlmICghY29sKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHYpKSBjb250aW51ZVxuICAgICAgICBjb2wgPSBuZXcgRmxvYXQ2NEFycmF5KHRoaXMuY2FwYWNpdHkpLmZpbGwoTmFOKVxuICAgICAgICB0aGlzLmNvbHVtbnMuc2V0KGtleSwgY29sKVxuICAgICAgfVxuICAgICAgY29sW3Nsb3RdID0gdlxuICAgIH1cbiAgfVxuXG4gIG9sZGVzdCAoKTogbnVtYmVyIHwgbnVsbCB7IHJldHVybiB0aGlzLnNpemUgPyB0aGlzLnRpbWVzW3RoaXMuc3RhcnRdIDogbnVsbCB9XG4gIG5ld2VzdCAoKTogbnVtYmVyIHwgbnVsbCB7IHJldHVybiB0aGlzLnNpemUgPyB0aGlzLnRpbWVzWyh0aGlzLnN0YXJ0ICsgdGhpcy5zaXplIC0gMSkgJSB0aGlzLmNhcGFjaXR5XSA6IG51bGwgfVxuXG4gIC8qKiBOZXdlc3QgZmluaXRlIHJlYWRpbmcgb2YgYSBjb2x1bW4sIG9yIG51bGwuICovXG4gIGxhdGVzdCAoa2V5OiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgICBjb25zdCBjb2wgPSB0aGlzLmNvbHVtbnMuZ2V0KGtleSlcbiAgICBpZiAoIWNvbCkgcmV0dXJuIG51bGxcbiAgICBmb3IgKGxldCBpID0gdGhpcy5zaXplIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHYgPSBjb2xbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMuY2FwYWNpdHldXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHYpKSByZXR1cm4gdlxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLyoqIExvZ2ljYWwgaW5kZXggb2YgdGhlIGZpcnN0IHNhbXBsZSBhdCBvciBhZnRlciBgdGAuICovXG4gIHByaXZhdGUgbG93ZXJCb3VuZCAodDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBsZXQgbG8gPSAwXG4gICAgbGV0IGhpID0gdGhpcy5zaXplXG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIGNvbnN0IG1pZCA9IChsbyArIGhpKSA+PiAxXG4gICAgICBpZiAodGhpcy50aW1lc1sodGhpcy5zdGFydCArIG1pZCkgJSB0aGlzLmNhcGFjaXR5XSA8IHQpIGxvID0gbWlkICsgMVxuICAgICAgZWxzZSBoaSA9IG1pZFxuICAgIH1cbiAgICByZXR1cm4gbG9cbiAgfVxuXG4gIC8qKlxuICAgKiBQb2ludHMgb2Ygb25lIGNvbHVtbiBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYCAobXMsIGluY2x1c2l2ZSksIGluIHRpbWUgb3JkZXIsXG4gICAqIG1pc3NpbmcgcmVhZGluZ3MgbGVmdCBvdXQuIE92ZXIgYG1heFBvaW50c2AgaXQga2VlcHMgdGhlIGxvd2VzdCBhbmQgaGlnaGVzdFxuICAgKiByZWFkaW5nIG9mIGVhY2ggYnVja2V0LCBzbyBhIHNwaWtlIGFsd2F5cyBzdXJ2aXZlcy5cbiAgICovXG4gIGV4dHJhY3QgKGtleTogc3RyaW5nLCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIsIG1heFBvaW50czogbnVtYmVyLCBzY2FsZSA9IDEpOiBBcnJheTxbbnVtYmVyLCBudW1iZXJdPiB7XG4gICAgY29uc3QgY29sID0gdGhpcy5jb2x1bW5zLmdldChrZXkpXG4gICAgaWYgKCFjb2wgfHwgIXRoaXMuc2l6ZSkgcmV0dXJuIFtdXG4gICAgY29uc3QgZmlyc3QgPSB0aGlzLmxvd2VyQm91bmQoZnJvbSlcbiAgICBjb25zdCBsYXN0ID0gdGhpcy5sb3dlckJvdW5kKHRvICsgMSlcbiAgICBjb25zdCB2YWxpZDogbnVtYmVyW10gPSBbXVxuICAgIGZvciAobGV0IGkgPSBmaXJzdDsgaSA8IGxhc3Q7IGkrKykge1xuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShjb2xbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMuY2FwYWNpdHldKSkgdmFsaWQucHVzaChpKVxuICAgIH1cbiAgICBjb25zdCBwb2ludCA9IChpOiBudW1iZXIpOiBbbnVtYmVyLCBudW1iZXJdID0+IHtcbiAgICAgIGNvbnN0IHNsb3QgPSAodGhpcy5zdGFydCArIGkpICUgdGhpcy5jYXBhY2l0eVxuICAgICAgcmV0dXJuIFt0aGlzLnRpbWVzW3Nsb3RdLCBjb2xbc2xvdF0gKiBzY2FsZV1cbiAgICB9XG4gICAgaWYgKHZhbGlkLmxlbmd0aCA8PSBtYXhQb2ludHMpIHJldHVybiB2YWxpZC5tYXAocG9pbnQpXG4gICAgY29uc3QgYnVja2V0cyA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IobWF4UG9pbnRzIC8gMikpXG4gICAgY29uc3QgcGVyID0gdmFsaWQubGVuZ3RoIC8gYnVja2V0c1xuICAgIGNvbnN0IG91dDogQXJyYXk8W251bWJlciwgbnVtYmVyXT4gPSBbXVxuICAgIGZvciAobGV0IGIgPSAwOyBiIDwgYnVja2V0czsgYisrKSB7XG4gICAgICBjb25zdCBsbyA9IE1hdGguZmxvb3IoYiAqIHBlcilcbiAgICAgIGNvbnN0IGhpID0gTWF0aC5taW4odmFsaWQubGVuZ3RoLCBNYXRoLmZsb29yKChiICsgMSkgKiBwZXIpKVxuICAgICAgaWYgKGxvID49IGhpKSBjb250aW51ZVxuICAgICAgbGV0IG1pbiA9IHZhbGlkW2xvXVxuICAgICAgbGV0IG1heCA9IHZhbGlkW2xvXVxuICAgICAgZm9yIChsZXQgaiA9IGxvICsgMTsgaiA8IGhpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgc2xvdCA9ICh0aGlzLnN0YXJ0ICsgdmFsaWRbal0pICUgdGhpcy5jYXBhY2l0eVxuICAgICAgICBpZiAoY29sW3Nsb3RdIDwgY29sWyh0aGlzLnN0YXJ0ICsgbWluKSAlIHRoaXMuY2FwYWNpdHldKSBtaW4gPSB2YWxpZFtqXVxuICAgICAgICBpZiAoY29sW3Nsb3RdID4gY29sWyh0aGlzLnN0YXJ0ICsgbWF4KSAlIHRoaXMuY2FwYWNpdHldKSBtYXggPSB2YWxpZFtqXVxuICAgICAgfVxuICAgICAgaWYgKGIgPT09IDAgJiYgdmFsaWRbbG9dICE9PSBtaW4gJiYgdmFsaWRbbG9dICE9PSBtYXgpIG91dC5wdXNoKHBvaW50KHZhbGlkW2xvXSkpXG4gICAgICBpZiAobWluID09PSBtYXgpIG91dC5wdXNoKHBvaW50KG1pbikpXG4gICAgICBlbHNlIGlmIChtaW4gPCBtYXgpIG91dC5wdXNoKHBvaW50KG1pbiksIHBvaW50KG1heCkpXG4gICAgICBlbHNlIG91dC5wdXNoKHBvaW50KG1heCksIHBvaW50KG1pbikpXG4gICAgfVxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFPQSxNQUFNLFdBQVcsQ0FBQyxNQUF1QjtBQUN2QyxNQUFJLE9BQU8sTUFBTSxTQUFVLFFBQU87QUFDbEMsTUFBSSxPQUFPLE1BQU0sWUFBWSxFQUFFLEtBQUssTUFBTSxHQUFJLFFBQU8sT0FBTyxDQUFDO0FBQzdELFNBQU87QUFDVDtBQUVPLGFBQU0sV0FBVztBQUFBLEVBTXRCLFlBQXNCLFVBQWtCO0FBQWxCO0FBQ3BCLFFBQUksRUFBRSxXQUFXLEdBQUksT0FBTSxJQUFJLFdBQVcsMkJBQTJCO0FBQ3JFLFNBQUssUUFBUSxJQUFJLGFBQWEsUUFBUTtBQUFBLEVBQ3hDO0FBQUEsRUFSUTtBQUFBLEVBQ0EsVUFBVSxvQkFBSSxJQUEwQjtBQUFBLEVBQ3hDLFFBQVE7QUFBQSxFQUNoQixPQUFPO0FBQUEsRUFPUCxRQUFTO0FBQUUsU0FBSyxRQUFRO0FBQUcsU0FBSyxPQUFPO0FBQUcsU0FBSyxRQUFRLFFBQVEsT0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFBRTtBQUFBO0FBQUEsRUFHakYsS0FBTSxNQUFxQztBQUN6QyxTQUFLLE1BQU07QUFDWCxlQUFXLE9BQU8sS0FBTSxNQUFLLEtBQUssR0FBRztBQUFBLEVBQ3ZDO0FBQUE7QUFBQSxFQUdBLEtBQU0sS0FBNkM7QUFDakQsVUFBTSxJQUFJLElBQUksS0FBSyxRQUFRO0FBQzNCLFFBQUksQ0FBQyxPQUFPLFNBQVMsQ0FBQyxFQUFHO0FBQ3pCLFFBQUksS0FBSyxPQUFPLEtBQUssSUFBSSxLQUFLLE9BQU8sRUFBSTtBQUN6QyxRQUFJO0FBQ0osUUFBSSxLQUFLLE9BQU8sS0FBSyxTQUFVLFNBQVEsS0FBSyxRQUFRLEtBQUssVUFBVSxL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