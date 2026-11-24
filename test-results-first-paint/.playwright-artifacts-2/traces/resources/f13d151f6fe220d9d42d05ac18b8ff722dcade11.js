import { MotionPredictor, drawnAt, pointAt } from "/src/services/m1-3d/motion.ts";
import { AccessoryMotion } from "/src/services/m1-3d/accessory-motion.ts";
const SNAP_MM = 25;
const SMOOTH_MS = 90;
const STALE_MS = 3e3;
export const MAX_TRACE = 2e4;
const TRACE_STEP_MM = 0.2;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const length = (a) => Math.hypot(a[0], a[1], a[2]);
export class PlateTrace {
  positions = new Float32Array(MAX_TRACE * 6);
  count = 0;
  /** Bumped when lines already drawn change (cleared, or the oldest dropped), so a view loads them all again. */
  version = 0;
  last = null;
  /** Where the line being laid ends, or null between lines. */
  get tip() {
    return this.last;
  }
  /** Lays filament from the last point to `p`. */
  add(p) {
    const last = this.last;
    if (!last) {
      this.last = [...p];
      return;
    }
    if (length(sub(p, last)) < TRACE_STEP_MM) return;
    if (this.count >= MAX_TRACE) {
      const keep = MAX_TRACE >> 1;
      this.positions.copyWithin(0, (this.count - keep) * 6, this.count * 6);
      this.count = keep;
      this.version++;
    }
    this.positions.set([last[0], last[1], last[2], p[0], p[1], p[2]], this.count * 6);
    this.count++;
    this.last = [...p];
  }
  /** The head stopped laying filament: the next point starts a new line. */
  lift() {
    this.last = null;
  }
  clear() {
    this.count = 0;
    this.last = null;
    this.version++;
  }
}
export class LiveSync {
  predictor = new MotionPredictor();
  trace = new PlateTrace();
  accessories = new AccessoryMotion();
  partGone = false;
  path = null;
  pose = { x: null, y: null, z: null, led: false, progress: 0 };
  /** The segments the file says are done (read ahead of the nozzle); used only until the head is found on the file. */
  fileDone = 0;
  /** The segments done as far as the head has got along the file; it never goes back within a print. */
  placeDone = null;
  shown = null;
  offset = [0, 0, 0];
  offsetAt = 0;
  /** Where the printer says it is (toolhead.position), which axes are homed, the light. */
  setPose(pose) {
    this.pose = pose;
  }
  /** The file being printed, as a path to follow, or null. */
  setPath(path) {
    if (path === this.path) return;
    this.path = path;
    this.placeDone = null;
    this.predictor.setPath(path);
  }
  /** The segments done by the file's read position, for when the head can't be followed along it. */
  /** Returns whether the count moved, so a caller can skip a redraw of the same picture. */
  setFileDone(segments) {
    if (segments === this.fileDone) return false;
    this.fileDone = segments;
    return true;
  }
  /** The current accessory signals for this printer. */
  setAccessories(a, now, hasPart) {
    const carriesPrint = !this.partGone && (hasPart || this.trace.count > 0);
    if (this.accessories.last?.plateOn === false && a.plateOn === true) this.partGone = true;
    this.accessories.set(a, now, carriesPrint);
  }
  /** A new print puts a part back on the plate. */
  newPrint() {
    this.partGone = false;
  }
  homed() {
    return this.pose.x !== null && this.pose.y !== null && this.pose.z !== null;
  }
  /** A report from the printer: correct the head, and lay filament where no file draws it. */
  observe(report) {
    const before = this.shown;
    this.predictor.observe(report);
    const now = this.predictor.at(report.at);
    if (before && now) {
      const off = sub(before, now.position);
      this.offset = length(off) < SNAP_MM ? off : [0, 0, 0];
      this.offsetAt = report.at;
    }
    if (this.homed() && report.extruderVelocity > 0.05 && !now?.place) this.trace.add(report.live);
    else this.trace.lift();
  }
  /** Whether the last report agrees with where the printer says it is, on the axes it knows. */
  agrees(live) {
    const p = this.pose;
    return [p.x, p.y, p.z].every((v, i) => v === null || Math.abs(v - live[i]) < 0.5);
  }
  frame(now) {
    const last = this.predictor.last;
    const predicted = last && (now - last.at < STALE_MS || this.agrees(last.live)) ? this.predictor.at(now) : null;
    let position = null;
    let settling = false;
    if (predicted) {
      const k = Math.exp(-Math.max(0, now - this.offsetAt) / SMOOTH_MS);
      position = [
        predicted.position[0] + this.offset[0] * k,
        predicted.position[1] + this.offset[1] * k,
        predicted.position[2] + this.offset[2] * k
      ];
      settling = length(this.offset) * k > 0.02;
    }
    this.shown = position;
    const pose = this.pose;
    const shown = {
      ...pose,
      x: pose.x === null ? null : position ? position[0] : pose.x,
      y: pose.y === null ? null : position ? position[1] : pose.y,
      z: pose.z === null ? null : position ? position[2] : pose.z
    };
    let nib = null;
    let printDone = this.fileDone;
    if (this.path) {
      const place = predicted?.place;
      if (place) {
        const drawn = drawnAt(this.path, place);
        if (this.placeDone === null || drawn.segments >= this.placeDone) {
          this.placeDone = drawn.segments;
          if (drawn.partial > 0) {
            const z = this.path.z[place.i];
            const from = pointAt(this.path, { i: place.i, f: 0 });
            const to = pointAt(this.path, place);
            nib = [[from[0], from[1], z], [to[0], to[1], z]];
          }
        }
      }
      if (this.placeDone !== null) printDone = this.placeDone;
    }
    const tip = this.trace.tip;
    if (!nib && tip && predicted && !predicted.place && predicted.extruding && position) nib = [tip, position];
    return {
      pose: shown,
      printDone,
      nib,
      moving: !!predicted?.moving || settling,
      accessories: this.accessories.frame(now),
      partGone: this.partGone
    };
  }
}
const syncs = /* @__PURE__ */ new Map();
export function liveSyncFor(printer) {
  let sync = syncs.get(printer);
  if (!sync) {
    sync = new LiveSync();
    syncs.set(printer, sync);
  }
  return sync;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpdmUtc3luYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IE1vZGVsUG9zZSB9IGZyb20gJy4vcG9zZSdcbmltcG9ydCB7IE1vdGlvblByZWRpY3RvciwgZHJhd25BdCwgcG9pbnRBdCwgdHlwZSBNb3Rpb25QYXRoLCB0eXBlIE1vdGlvblJlcG9ydCwgdHlwZSBWZWMzIH0gZnJvbSAnLi9tb3Rpb24nXG5pbXBvcnQgeyBBY2Nlc3NvcnlNb3Rpb24sIHR5cGUgQWNjZXNzb3J5RnJhbWUgfSBmcm9tICcuL2FjY2Vzc29yeS1tb3Rpb24nXG5pbXBvcnQgdHlwZSB7IEFjY2Vzc29yaWVzIH0gZnJvbSAnLi9hY2Nlc3NvcmllcydcblxuLyoqXG4gKiBUaGUgbGl2ZSBNMSBrZXB0IGluIHN0ZXAgd2l0aCBvbmUgcHJpbnRlcjogd2hlcmUgaXRzIGhlYWQgYW5kIGJlZCBhcmVcbiAqIGJldHdlZW4gcmVwb3J0cyAobW90aW9uLnRzKSwgaG93IG11Y2ggb2YgdGhlIHByaW50IGlzIG9uIHRoZSBwbGF0ZSwgYW5kXG4gKiB0aGUgbGluZXMgdGhlIHByaW50ZXIgbGFpZCB0aGF0IG5vIGZpbGUgZHJldyAoYSBwdXJnZSwgYSBtYWNybydzXG4gKiBleHRydXNpb24sIGEgcHJpbnQgd2hvc2UgZmlsZSBGbHVpZGQgaGFzbid0IHJlYWQpLiBJdCBiZWxvbmdzIHRvIHRoZVxuICogcHJpbnRlciwgbm90IHRvIGEgdmlldywgc28gbGVhdmluZyB0aGUgcGFnZSBhbmQgY29taW5nIGJhY2sga2VlcHMgdGhlbS5cbiAqIFRoZSB2aWV3ZXIgYXNrcyBpdCwgZXZlcnkgZnJhbWUgaXQgZHJhd3MsIHdoYXQgdG8gc2hvdy5cbiAqL1xuXG4vKiogRnVydGhlciB0aGFuIHRoaXMgZnJvbSB3aGVyZSB0aGUgaGVhZCB3YXMgZHJhd24sIGEgcmVwb3J0IGlzIGEganVtcCwgbm90IGEgY29ycmVjdGlvbi4gKi9cbmNvbnN0IFNOQVBfTU0gPSAyNVxuLyoqIEEgY29ycmVjdGlvbiBmYWRlcyBvdmVyIGFib3V0IHRoaXMgbG9uZywgc28gdGhlIGhlYWQgbmV2ZXIganVtcHMgYnkgYSBtaWxsaW1ldHJlIG9yIHR3by4gKi9cbmNvbnN0IFNNT09USF9NUyA9IDkwXG4vKiogUmVwb3J0cyBvbGRlciB0aGFuIHRoaXMsIGFuZCB0aGUgcHJpbnRlcidzIG93biBwb3NpdGlvbiBlbHNld2hlcmUsIGFuZCB0aGUgcmVwb3J0cyBoYXZlIHN0b3BwZWQuICovXG5jb25zdCBTVEFMRV9NUyA9IDMwMDBcbi8qKiBUaGUgbW9zdCBsaW5lcyBrZXB0IG9uIHRoZSBwbGF0ZTsgcGFzdCBpdCB0aGUgb2xkZXN0IGhhbGYgZ28uICovXG5leHBvcnQgY29uc3QgTUFYX1RSQUNFID0gMjAwMDBcbi8qKiBQb2ludHMgY2xvc2VyIHRoYW4gdGhpcyBhcmUgb25lIHBvaW50LiAqL1xuY29uc3QgVFJBQ0VfU1RFUF9NTSA9IDAuMlxuXG5jb25zdCBzdWIgPSAoYTogVmVjMywgYjogVmVjMyk6IFZlYzMgPT4gW2FbMF0gLSBiWzBdLCBhWzFdIC0gYlsxXSwgYVsyXSAtIGJbMl1dXG5jb25zdCBsZW5ndGggPSAoYTogVmVjMykgPT4gTWF0aC5oeXBvdChhWzBdLCBhWzFdLCBhWzJdKVxuXG4vKipcbiAqIEZpbGFtZW50IHRoZSBwcmludGVyIGxhaWQgdGhhdCBubyBmaWxlIGRyZXcsIGFzIGxpbmUgc2VnbWVudHMgaW4gdGhlXG4gKiBwcmludGVyJ3MgbWlsbGltZXRyZXM6IHNpeCBudW1iZXJzIGEgc2VnbWVudC4gSXQgZ3Jvd3MgZnJvbSB0aGUgcmVwb3J0cyxcbiAqIHNvIGl0IGlzIGFzIGZpbmUgYXMgdGhleSBhcmUgKGZvdXIgYSBzZWNvbmQpLCB3aGljaCBpcyBwbGVudHkgZm9yIGFcbiAqIHB1cmdlIGxpbmUuXG4gKi9cbmV4cG9ydCBjbGFzcyBQbGF0ZVRyYWNlIHtcbiAgcmVhZG9ubHkgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShNQVhfVFJBQ0UgKiA2KVxuICBjb3VudCA9IDBcbiAgLyoqIEJ1bXBlZCB3aGVuIGxpbmVzIGFscmVhZHkgZHJhd24gY2hhbmdlIChjbGVhcmVkLCBvciB0aGUgb2xkZXN0IGRyb3BwZWQpLCBzbyBhIHZpZXcgbG9hZHMgdGhlbSBhbGwgYWdhaW4uICovXG4gIHZlcnNpb24gPSAwXG4gIHByaXZhdGUgbGFzdDogVmVjMyB8IG51bGwgPSBudWxsXG5cbiAgLyoqIFdoZXJlIHRoZSBsaW5lIGJlaW5nIGxhaWQgZW5kcywgb3IgbnVsbCBiZXR3ZWVuIGxpbmVzLiAqL1xuICBnZXQgdGlwICgpOiBWZWMzIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubGFzdFxuICB9XG5cbiAgLyoqIExheXMgZmlsYW1lbnQgZnJvbSB0aGUgbGFzdCBwb2ludCB0byBgcGAuICovXG4gIGFkZCAocDogVmVjMykge1xuICAgIGNvbnN0IGxhc3QgPSB0aGlzLmxhc3RcbiAgICBpZiAoIWxhc3QpIHtcbiAgICAgIHRoaXMubGFzdCA9IFsuLi5wXVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChsZW5ndGgoc3ViKHAsIGxhc3QpKSA8IFRSQUNFX1NURVBfTU0pIHJldHVyblxuICAgIGlmICh0aGlzLmNvdW50ID49IE1BWF9UUkFDRSkge1xuICAgICAgY29uc3Qga2VlcCA9IE1BWF9UUkFDRSA+PiAxXG4gICAgICB0aGlzLnBvc2l0aW9ucy5jb3B5V2l0aGluKDAsICh0aGlzLmNvdW50IC0ga2VlcCkgKiA2LCB0aGlzLmNvdW50ICogNilcbiAgICAgIHRoaXMuY291bnQgPSBrZWVwXG4gICAgICB0aGlzLnZlcnNpb24rK1xuICAgIH1cbiAgICB0aGlzLnBvc2l0aW9ucy5zZXQoW2xhc3RbMF0sIGxhc3RbMV0sIGxhc3RbMl0sIHBbMF0sIHBbMV0sIHBbMl1dLCB0aGlzLmNvdW50ICogNilcbiAgICB0aGlzLmNvdW50KytcbiAgICB0aGlzLmxhc3QgPSBbLi4ucF1cbiAgfVxuXG4gIC8qKiBUaGUgaGVhZCBzdG9wcGVkIGxheWluZyBmaWxhbWVudDogdGhlIG5leHQgcG9pbnQgc3RhcnRzIGEgbmV3IGxpbmUuICovXG4gIGxpZnQgKCkge1xuICAgIHRoaXMubGFzdCA9IG51bGxcbiAgfVxuXG4gIGNsZWFyICgpIHtcbiAgICB0aGlzLmNvdW50ID0gMFxuICAgIHRoaXMubGFzdCA9IG51bGxcbiAgICB0aGlzLnZlcnNpb24rK1xuICB9XG59XG5cbi8qKiBXaGF0IHRvIGRyYXcgdGhpcyBmcmFtZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3luY0ZyYW1lIHtcbiAgLyoqIFdoZXJlIHRoZSBoZWFkIGFuZCB0aGUgYmVkIGFyZSwgd2l0aCB0aGUgcHJpbnRlcidzIGhvbWVkIGF4ZXMuICovXG4gIHBvc2U6IE1vZGVsUG9zZTtcbiAgLyoqIEhvdyBtYW55IG9mIHRoZSBwcmludCdzIHNlZ21lbnRzIGFyZSBvbiB0aGUgcGxhdGUuICovXG4gIHByaW50RG9uZTogbnVtYmVyO1xuICAvKiogVGhlIGxpbmUgYmVpbmcgbGFpZCByaWdodCBub3csIGZyb20gd2hlcmUgaXQgYmVnYW4gdG8gdGhlIG5venpsZSwgb3IgbnVsbC4gKi9cbiAgbmliOiBbVmVjMywgVmVjM10gfCBudWxsO1xuICAvKiogU3RpbGwgbW92aW5nOiBkcmF3IGFnYWluIHNvb24uICovXG4gIG1vdmluZzogYm9vbGVhbjtcbiAgLyoqIFRoZSBwbGF0ZSwgdW1iaWxpY2FsLCBmaWxhbWVudCBhbmQgc3Bvb2wgYXMgdGhleSBhcmUgbm93LiAqL1xuICBhY2Nlc3NvcmllczogQWNjZXNzb3J5RnJhbWU7XG4gIC8qKiBUaGUgcGFydCB3YXMgdGFrZW4gb2ZmIHRoZSBwbGF0ZTsgc3RvcCBkcmF3aW5nIGl0IHVudGlsIHRoZSBuZXh0IHByaW50LiAqL1xuICBwYXJ0R29uZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIExpdmVTeW5jIHtcbiAgcmVhZG9ubHkgcHJlZGljdG9yID0gbmV3IE1vdGlvblByZWRpY3RvcigpXG4gIHJlYWRvbmx5IHRyYWNlID0gbmV3IFBsYXRlVHJhY2UoKVxuICByZWFkb25seSBhY2Nlc3NvcmllcyA9IG5ldyBBY2Nlc3NvcnlNb3Rpb24oKVxuICBwYXJ0R29uZSA9IGZhbHNlXG4gIHByaXZhdGUgcGF0aDogTW90aW9uUGF0aCB8IG51bGwgPSBudWxsXG4gIHByaXZhdGUgcG9zZTogTW9kZWxQb3NlID0geyB4OiBudWxsLCB5OiBudWxsLCB6OiBudWxsLCBsZWQ6IGZhbHNlLCBwcm9ncmVzczogMCB9XG4gIC8qKiBUaGUgc2VnbWVudHMgdGhlIGZpbGUgc2F5cyBhcmUgZG9uZSAocmVhZCBhaGVhZCBvZiB0aGUgbm96emxlKTsgdXNlZCBvbmx5IHVudGlsIHRoZSBoZWFkIGlzIGZvdW5kIG9uIHRoZSBmaWxlLiAqL1xuICBwcml2YXRlIGZpbGVEb25lID0gMFxuICAvKiogVGhlIHNlZ21lbnRzIGRvbmUgYXMgZmFyIGFzIHRoZSBoZWFkIGhhcyBnb3QgYWxvbmcgdGhlIGZpbGU7IGl0IG5ldmVyIGdvZXMgYmFjayB3aXRoaW4gYSBwcmludC4gKi9cbiAgcHJpdmF0ZSBwbGFjZURvbmU6IG51bWJlciB8IG51bGwgPSBudWxsXG4gIHByaXZhdGUgc2hvd246IFZlYzMgfCBudWxsID0gbnVsbFxuICBwcml2YXRlIG9mZnNldDogVmVjMyA9IFswLCAwLCAwXVxuICBwcml2YXRlIG9mZnNldEF0ID0gMFxuXG4gIC8qKiBXaGVyZSB0aGUgcHJpbnRlciBzYXlzIGl0IGlzICh0b29saGVhZC5wb3NpdGlvbiksIHdoaWNoIGF4ZXMgYXJlIGhvbWVkLCB0aGUgbGlnaHQuICovXG4gIHNldFBvc2UgKHBvc2U6IE1vZGVsUG9zZSkge1xuICAgIHRoaXMucG9zZSA9IHBvc2VcbiAgfVxuXG4gIC8qKiBUaGUgZmlsZSBiZWluZyBwcmludGVkLCBhcyBhIHBhdGggdG8gZm9sbG93LCBvciBudWxsLiAqL1xuICBzZXRQYXRoIChwYXRoOiBNb3Rpb25QYXRoIHwgbnVsbCkge1xuICAgIGlmIChwYXRoID09PSB0aGlzLnBhdGgpIHJldHVyblxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLnBsYWNlRG9uZSA9IG51bGxcbiAgICB0aGlzLnByZWRpY3Rvci5zZXRQYXRoKHBhdGgpXG4gIH1cblxuICAvKiogVGhlIHNlZ21lbnRzIGRvbmUgYnkgdGhlIGZpbGUncyByZWFkIHBvc2l0aW9uLCBmb3Igd2hlbiB0aGUgaGVhZCBjYW4ndCBiZSBmb2xsb3dlZCBhbG9uZyBpdC4gKi9cbiAgLyoqIFJldHVybnMgd2hldGhlciB0aGUgY291bnQgbW92ZWQsIHNvIGEgY2FsbGVyIGNhbiBza2lwIGEgcmVkcmF3IG9mIHRoZSBzYW1lIHBpY3R1cmUuICovXG4gIHNldEZpbGVEb25lIChzZWdtZW50czogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKHNlZ21lbnRzID09PSB0aGlzLmZpbGVEb25lKSByZXR1cm4gZmFsc2VcbiAgICB0aGlzLmZpbGVEb25lID0gc2VnbWVudHNcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqIFRoZSBjdXJyZW50IGFjY2Vzc29yeSBzaWduYWxzIGZvciB0aGlzIHByaW50ZXIuICovXG4gIHNldEFjY2Vzc29yaWVzIChhOiBBY2Nlc3Nvcmllcywgbm93OiBudW1iZXIsIGhhc1BhcnQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCBjYXJyaWVzUHJpbnQgPSAhdGhpcy5wYXJ0R29uZSAmJiAoaGFzUGFydCB8fCB0aGlzLnRyYWNlLmNvdW50ID4gMClcbiAgICBpZiAodGhpcy5hY2Nlc3Nvcmllcy5sYXN0Py5wbGF0ZU9uID09PSBmYWxzZSAmJiBhLnBsYXRlT24gPT09IHRydWUpIHRoaXMucGFydEdvbmUgPSB0cnVlXG4gICAgdGhpcy5hY2Nlc3Nvcmllcy5zZXQoYSwgbm93LCBjYXJyaWVzUHJpbnQpXG4gIH1cblxuICAvKiogQSBuZXcgcHJpbnQgcHV0cyBhIHBhcnQgYmFjayBvbiB0aGUgcGxhdGUuICovXG4gIG5ld1ByaW50ICgpOiB2b2lkIHtcbiAgICB0aGlzLnBhcnRHb25lID0gZmFsc2VcbiAgfVxuXG4gIHByaXZhdGUgaG9tZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnBvc2UueCAhPT0gbnVsbCAmJiB0aGlzLnBvc2UueSAhPT0gbnVsbCAmJiB0aGlzLnBvc2UueiAhPT0gbnVsbFxuICB9XG5cbiAgLyoqIEEgcmVwb3J0IGZyb20gdGhlIHByaW50ZXI6IGNvcnJlY3QgdGhlIGhlYWQsIGFuZCBsYXkgZmlsYW1lbnQgd2hlcmUgbm8gZmlsZSBkcmF3cyBpdC4gKi9cbiAgb2JzZXJ2ZSAocmVwb3J0OiBNb3Rpb25SZXBvcnQpIHtcbiAgICBjb25zdCBiZWZvcmUgPSB0aGlzLnNob3duXG4gICAgdGhpcy5wcmVkaWN0b3Iub2JzZXJ2ZShyZXBvcnQpXG4gICAgY29uc3Qgbm93ID0gdGhpcy5wcmVkaWN0b3IuYXQocmVwb3J0LmF0KVxuICAgIGlmIChiZWZvcmUgJiYgbm93KSB7XG4gICAgICBjb25zdCBvZmYgPSBzdWIoYmVmb3JlLCBub3cucG9zaXRpb24pXG4gICAgICB0aGlzLm9mZnNldCA9IGxlbmd0aChvZmYpIDwgU05BUF9NTSA/IG9mZiA6IFswLCAwLCAwXVxuICAgICAgdGhpcy5vZmZzZXRBdCA9IHJlcG9ydC5hdFxuICAgIH1cbiAgICBpZiAodGhpcy5ob21lZCgpICYmIHJlcG9ydC5leHRydWRlclZlbG9jaXR5ID4gMC4wNSAmJiAhbm93Py5wbGFjZSkgdGhpcy50cmFjZS5hZGQocmVwb3J0LmxpdmUpXG4gICAgZWxzZSB0aGlzLnRyYWNlLmxpZnQoKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGxhc3QgcmVwb3J0IGFncmVlcyB3aXRoIHdoZXJlIHRoZSBwcmludGVyIHNheXMgaXQgaXMsIG9uIHRoZSBheGVzIGl0IGtub3dzLiAqL1xuICBwcml2YXRlIGFncmVlcyAobGl2ZTogVmVjMyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHAgPSB0aGlzLnBvc2VcbiAgICByZXR1cm4gW3AueCwgcC55LCBwLnpdLmV2ZXJ5KCh2LCBpKSA9PiB2ID09PSBudWxsIHx8IE1hdGguYWJzKHYgLSBsaXZlW2ldKSA8IDAuNSlcbiAgfVxuXG4gIGZyYW1lIChub3c6IG51bWJlcik6IFN5bmNGcmFtZSB7XG4gICAgY29uc3QgbGFzdCA9IHRoaXMucHJlZGljdG9yLmxhc3RcbiAgICBjb25zdCBwcmVkaWN0ZWQgPSBsYXN0ICYmIChub3cgLSBsYXN0LmF0IDwgU1RBTEVfTVMgfHwgdGhpcy5hZ3JlZXMobGFzdC5saXZlKSkgPyB0aGlzLnByZWRpY3Rvci5hdChub3cpIDogbnVsbFxuICAgIGxldCBwb3NpdGlvbjogVmVjMyB8IG51bGwgPSBudWxsXG4gICAgbGV0IHNldHRsaW5nID0gZmFsc2VcbiAgICBpZiAocHJlZGljdGVkKSB7XG4gICAgICBjb25zdCBrID0gTWF0aC5leHAoLU1hdGgubWF4KDAsIG5vdyAtIHRoaXMub2Zmc2V0QXQpIC8gU01PT1RIX01TKVxuICAgICAgcG9zaXRpb24gPSBbXG4gICAgICAgIHByZWRpY3RlZC5wb3NpdGlvblswXSArIHRoaXMub2Zmc2V0WzBdICogayxcbiAgICAgICAgcHJlZGljdGVkLnBvc2l0aW9uWzFdICsgdGhpcy5vZmZzZXRbMV0gKiBrLFxuICAgICAgICBwcmVkaWN0ZWQucG9zaXRpb25bMl0gKyB0aGlzLm9mZnNldFsyXSAqIGtcbiAgICAgIF1cbiAgICAgIHNldHRsaW5nID0gbGVuZ3RoKHRoaXMub2Zmc2V0KSAqIGsgPiAwLjAyXG4gICAgfVxuICAgIHRoaXMuc2hvd24gPSBwb3NpdGlvblxuICAgIGNvbnN0IHBvc2UgPSB0aGlzLnBvc2VcbiAgICBjb25zdCBzaG93bjogTW9kZWxQb3NlID0ge1xuICAgICAgLi4ucG9zZSxcbiAgICAgIHg6IHBvc2UueCA9PT0gbnVsbCA/IG51bGwgOiBwb3NpdGlvbiA/IHBvc2l0aW9uWzBdIDogcG9zZS54LFxuICAgICAgeTogcG9zZS55ID09PSBudWxsID8gbnVsbCA6IHBvc2l0aW9uID8gcG9zaXRpb25bMV0gOiBwb3NlLnksXG4gICAgICB6OiBwb3NlLnogPT09IG51bGwgPyBudWxsIDogcG9zaXRpb24gPyBwb3NpdGlvblsyXSA6IHBvc2UuelxuICAgIH1cblxuICAgIGxldCBuaWI6IFtWZWMzLCBWZWMzXSB8IG51bGwgPSBudWxsXG4gICAgbGV0IHByaW50RG9uZSA9IHRoaXMuZmlsZURvbmVcbiAgICBpZiAodGhpcy5wYXRoKSB7XG4gICAgICBjb25zdCBwbGFjZSA9IHByZWRpY3RlZD8ucGxhY2VcbiAgICAgIGlmIChwbGFjZSkge1xuICAgICAgICBjb25zdCBkcmF3biA9IGRyYXduQXQodGhpcy5wYXRoLCBwbGFjZSlcbiAgICAgICAgaWYgKHRoaXMucGxhY2VEb25lID09PSBudWxsIHx8IGRyYXduLnNlZ21lbnRzID49IHRoaXMucGxhY2VEb25lKSB7XG4gICAgICAgICAgdGhpcy5wbGFjZURvbmUgPSBkcmF3bi5zZWdtZW50c1xuICAgICAgICAgIGlmIChkcmF3bi5wYXJ0aWFsID4gMCkge1xuICAgICAgICAgICAgY29uc3QgeiA9IHRoaXMucGF0aC56W3BsYWNlLmldXG4gICAgICAgICAgICBjb25zdCBmcm9tID0gcG9pbnRBdCh0aGlzLnBhdGgsIHsgaTogcGxhY2UuaSwgZjogMCB9KVxuICAgICAgICAgICAgY29uc3QgdG8gPSBwb2ludEF0KHRoaXMucGF0aCwgcGxhY2UpXG4gICAgICAgICAgICBuaWIgPSBbW2Zyb21bMF0sIGZyb21bMV0sIHpdLCBbdG9bMF0sIHRvWzFdLCB6XV1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnBsYWNlRG9uZSAhPT0gbnVsbCkgcHJpbnREb25lID0gdGhpcy5wbGFjZURvbmVcbiAgICB9XG4gICAgY29uc3QgdGlwID0gdGhpcy50cmFjZS50aXBcbiAgICBpZiAoIW5pYiAmJiB0aXAgJiYgcHJlZGljdGVkICYmICFwcmVkaWN0ZWQucGxhY2UgJiYgcHJlZGljdGVkLmV4dHJ1ZGluZyAmJiBwb3NpdGlvbikgbmliID0gW3RpcCwgcG9zaXRpb25dXG5cbiAgICByZXR1cm4ge1xuICAgICAgcG9zZTogc2hvd24sXG4gICAgICBwcmludERvbmUsXG4gICAgICBuaWIsXG4gICAgICBtb3Zpbmc6ICEhcHJlZGljdGVkPy5tb3ZpbmcgfHwgc2V0dGxpbmcsXG4gICAgICBhY2Nlc3NvcmllczogdGhpcy5hY2Nlc3Nvcmllcy5mcmFtZShub3cpLFxuICAgICAgcGFydEdvbmU6IHRoaXMucGFydEdvbmVcbiAgICB9XG4gIH1cbn1cblxuY29uc3Qgc3luY3MgPSBuZXcgTWFwPHN0cmluZywgTGl2ZVN5bmM+KClcblxuLyoqIFRoZSBwcmludGVyJ3Mgc3luYywgbWFkZSB0aGUgZmlyc3QgdGltZSBpdCdzIGFza2VkIGZvci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXZlU3luY0ZvciAocHJpbnRlcjogc3RyaW5nKTogTGl2ZVN5bmMge1xuICBsZXQgc3luYyA9IHN5bmNzLmdldChwcmludGVyKVxuICBpZiAoIXN5bmMpIHtcbiAgICBzeW5jID0gbmV3IExpdmVTeW5jKClcbiAgICBzeW5jcy5zZXQocHJpbnRlciwgc3luYylcbiAgfVxuICByZXR1cm4gc3luY1xufVxuIl0sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLGlCQUFpQixTQUFTLGVBQThEO0FBQ2pHLFNBQVMsdUJBQTRDO0FBYXJELE1BQU0sVUFBVTtBQUVoQixNQUFNLFlBQVk7QUFFbEIsTUFBTSxXQUFXO0FBRVYsYUFBTSxZQUFZO0FBRXpCLE1BQU0sZ0JBQWdCO0FBRXRCLE1BQU0sTUFBTSxDQUFDLEdBQVMsTUFBa0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM5RSxNQUFNLFNBQVMsQ0FBQyxNQUFZLEtBQUssTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQVFoRCxhQUFNLFdBQVc7QUFBQSxFQUNiLFlBQVksSUFBSSxhQUFhLFlBQVksQ0FBQztBQUFBLEVBQ25ELFFBQVE7QUFBQTtBQUFBLEVBRVIsVUFBVTtBQUFBLEVBQ0YsT0FBb0I7QUFB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