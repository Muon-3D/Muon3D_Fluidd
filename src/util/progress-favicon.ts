let last: { percent: number; color: string; url: string } | null = null

/**
 * The tab icon for a print: a ring filled to `percent`. Drawing and encoding a
 * canvas is the slow part and the page asks on every status update, so the
 * last picture is kept until the percentage or the colour changes.
 */
export function progressFavicon (percent: number, color: string): string {
  if (last && last.percent === percent && last.color === color) return last.url
  const size = 64
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d') as CanvasRenderingContext2D
  canvas.width = size
  canvas.height = size
  const centerX = size / 2
  const centerY = size / 2
  const lineWidth = 8
  const radius = size / 2 - lineWidth / 2
  const startAngle = 1.5 * Math.PI
  const endAngle = startAngle + (percent * 2 * Math.PI / 100)

  // The grey ring.
  context.moveTo(centerX, centerY)
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)
  context.strokeStyle = 'rgba(255, 255, 255, 0.10)'
  context.lineWidth = lineWidth
  context.stroke()
  context.closePath()

  // The progress arc.
  context.moveTo(centerX, centerY)
  context.beginPath()
  context.arc(centerX, centerY, radius, startAngle, endAngle, false)
  context.strokeStyle = color
  context.lineWidth = lineWidth
  context.stroke()

  const url = canvas.toDataURL('image/png')
  last = { percent, color, url }
  return url
}
