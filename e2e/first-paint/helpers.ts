/**
 * What a person sees of first paint, recorded from the page's first moment:
 * the step names the splash showed, the rim's target at each, and when the
 * splash appeared and left. Install before `goto`.
 */
import type { Page } from '@playwright/test'

export interface Watched {
  labels: string[];
  targets: string[];
  shownAt: number | null;
  goneAt: number | null;
  shownCount: number;
}

export async function watch (page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __fp: Watched }
    w.__fp = { labels: [], targets: [], shownAt: null, goneAt: null, shownCount: 0 }
    const note = () => {
      const fp = w.__fp
      const box = document.querySelector<HTMLElement>('[data-tid=first-paint]')
      if (box) {
        if (fp.shownAt === null) fp.shownAt = performance.now()
        const label = box.querySelector('[data-tid=first-paint-label]')?.textContent
        if (label && fp.labels[fp.labels.length - 1] !== label) fp.labels.push(label)
        const target = box.dataset.target
        if (target && fp.targets[fp.targets.length - 1] !== target) fp.targets.push(target)
      }
      if (fp.shownAt !== null && fp.goneAt === null && !document.getElementById('muon-loader')) fp.goneAt = performance.now()
    }
    new MutationObserver(note).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-target', 'data-stage'] })
  })
}

export const watched = (page: Page) => page.evaluate(() => (window as unknown as { __fp: Watched }).__fp)

/** The rim's pixels (an annulus of the canvas), as a string, so two moments can be compared. */
export const rimPixels = (page: Page) => page.evaluate(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-tid=first-paint] canvas')
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return ''
  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data
  const cx = width / 2
  const cy = height / 2
  const out: number[] = []
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const r = Math.hypot(x - cx, y - cy) / (width / 2)
      if (r > 0.88 && r < 1) out.push(data[(y * width + x) * 4 + 3])
    }
  }
  return out.join(',')
})

/** Every pixel's alpha, for "nothing moves". */
export const allPixels = (page: Page) => page.evaluate(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-tid=first-paint] canvas')
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return ''
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let h = 0
  for (let i = 3; i < data.length; i += 4) h = (h * 31 + data[i]) | 0
  return String(h)
})
