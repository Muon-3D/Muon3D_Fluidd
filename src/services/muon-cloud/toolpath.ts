/**
 * Reads a G-code file into extrusion segments, each tagged with the file
 * offset where it ends, so a renderer can draw exactly what the printer has
 * printed so far from `virtual_sdcard.file_position`.
 */

export interface Toolpath {
  /** xyz pairs: 6 floats per segment. */
  positions: Float32Array;
  /** File offset at the end of each segment's line. */
  offsets: Float64Array;
  count: number;
  bounds: { min: [number, number, number], max: [number, number, number] };
}

const MAX_SEGMENTS = 400_000

export function parseToolpath (text: string): Toolpath {
  const positions = new Float32Array(MAX_SEGMENTS * 6)
  const offsets = new Float64Array(MAX_SEGMENTS)
  let count = 0
  let x = 0
  let y = 0
  let z = 0
  let e = 0
  let absolute = true
  let absoluteE = true
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  let offset = 0
  let lineStart = 0
  const n = text.length

  while (lineStart < n) {
    let lineEnd = text.indexOf('\n', lineStart)
    if (lineEnd === -1) lineEnd = n
    // Moonraker's file_position counts bytes; this counts UTF-16 units, which
    // agree for the ASCII G-code slicers write.
    offset = lineEnd + 1
    let line = text.slice(lineStart, lineEnd)
    lineStart = lineEnd + 1
    const comment = line.indexOf(';')
    if (comment >= 0) line = line.slice(0, comment)
    line = line.trim()
    if (!line) continue
    const c0 = line.charCodeAt(0)
    if (c0 !== 71 && c0 !== 77) continue // G or M
    const parts = line.split(/\s+/)
    const cmd = parts[0].toUpperCase()
    if (cmd === 'G90') { absolute = true; absoluteE = true; continue }
    if (cmd === 'G91') { absolute = false; absoluteE = false; continue }
    if (cmd === 'M82') { absoluteE = true; continue }
    if (cmd === 'M83') { absoluteE = false; continue }
    if (cmd === 'G92') {
      for (const p of parts.slice(1)) if (p[0] === 'E' || p[0] === 'e') e = parseFloat(p.slice(1)) || 0
      continue
    }
    if (cmd !== 'G0' && cmd !== 'G1' && cmd !== 'G00' && cmd !== 'G01') continue
    let nx = x
    let ny = y
    let nz = z
    let extruding = false
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i]
      const v = parseFloat(p.slice(1))
      if (Number.isNaN(v)) continue
      switch (p[0]) {
        case 'X': case 'x': nx = absolute ? v : x + v; break
        case 'Y': case 'y': ny = absolute ? v : y + v; break
        case 'Z': case 'z': nz = absolute ? v : z + v; break
        case 'E': case 'e': {
          const ne = absoluteE ? v : e + v
          extruding = ne > e + 1e-5
          e = ne
          break
        }
      }
    }
    if (extruding && (nx !== x || ny !== y) && count < MAX_SEGMENTS) {
      const k = count * 6
      positions[k] = x; positions[k + 1] = y; positions[k + 2] = z
      positions[k + 3] = nx; positions[k + 4] = ny; positions[k + 5] = nz
      offsets[count] = offset
      count++
      if (nx < min[0]) min[0] = nx; if (nx > max[0]) max[0] = nx
      if (ny < min[1]) min[1] = ny; if (ny > max[1]) max[1] = ny
      if (nz < min[2]) min[2] = nz; if (nz > max[2]) max[2] = nz
    }
    x = nx; y = ny; z = nz
  }
  return {
    positions: positions.subarray(0, count * 6),
    offsets: offsets.subarray(0, count),
    count,
    bounds: { min, max }
  }
}

/** How many segments end at or before `filePosition`. */
export function segmentsPrinted (path: Toolpath, filePosition: number): number {
  let lo = 0
  let hi = path.count
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (path.offsets[mid] <= filePosition) lo = mid + 1
    else hi = mid
  }
  return lo
}
