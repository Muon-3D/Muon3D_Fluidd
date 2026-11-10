/**
 * Cold load of the Overview, timed (KAN-2013): first paint, the Overview
 * interactive, and the live M1's first frame, at each CPU slowdown.
 * See e2e/playwright.perf.config.ts for how to run it.
 */
import { appendFileSync } from 'fs'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from '../control/printer'

const RATES = (process.env.PERF_RATES || '1,6').split(',').map(Number)
const RUNS = Number(process.env.PERF_RUNS || 3)
/** A long-task-free stretch this long after the tiles are up counts as interactive (as TTI's quiet window). */
const QUIET_MS = 500

interface Marks {
  longTasks: Array<[number, number]>;
  loaderGone?: number;
  tiles?: number;
  placeholder?: number;
  liveMounted?: number;
}

for (const rate of RATES) {
  for (let run = 1; run <= RUNS; run++) {
    test(`cold load, ${rate}x CPU, run ${run}`, async ({ page }) => {
      await usePrinter(page, PRESETS.idleHomed())
      await page.addInitScript(() => {
        const marks: Record<string, unknown> & { longTasks: Array<[number, number]> } = { longTasks: [] }
        ;(window as unknown as { __perf: typeof marks }).__perf = marks
        try {
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) marks.longTasks.push([e.startTime, e.duration])
          }).observe({ type: 'longtask', buffered: true })
        } catch {}
        const seen = (key: string, test: () => boolean) => { if (marks[key] === undefined && test()) marks[key] = performance.now() }
        const check = () => {
          seen('loaderGone', () => !!document.querySelector('.v-application') && !document.getElementById('muon-loader'))
          seen('tiles', () => !!document.querySelector('[data-cell="stage"]') && !!document.querySelector('[data-cell="job"]'))
          seen('placeholder', () => !!document.querySelector('[data-tid="m1-placeholder"]'))
          seen('liveMounted', () => !!document.querySelector('[data-tid="m1-live"]'))
        }
        new MutationObserver(check).observe(document, { childList: true, subtree: true })
      })
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate })
      await page.goto('/boxwood-367a')
      await expect(page.locator('[data-cell="job"]')).toBeVisible({ timeout: 120_000 })
      await page.waitForFunction(() => performance.getEntriesByName('m1:first-frame').length > 0, undefined, { timeout: 300_000, polling: 250 })
      // Let a quiet window pass after the first frame, so the long tasks around it are all in.
      await page.waitForTimeout(QUIET_MS * 2)
      const result = await page.evaluate((quiet) => {
        const m = (window as unknown as { __perf: Marks }).__perf
        const paint = (name: string) => performance.getEntriesByName(name)[0]?.startTime
        const mark = (name: string) => performance.getEntriesByName(name)[0]?.startTime
        const tasks = m.longTasks.slice().sort((a, b) => a[0] - b[0])
        // Interactive: the first moment after the tiles are up with no long task for `quiet` ms.
        let t = m.tiles ?? 0
        for (const [start, duration] of tasks) {
          if (start + duration <= t) continue
          if (start - t >= quiet) break
          t = Math.max(t, start + duration)
        }
        const firstFrame = mark('m1:first-frame')
        const blocking = tasks
          .filter(([start]) => start >= (m.tiles ?? 0) && start < (firstFrame ?? Infinity))
          .reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0)
        const longest = tasks.filter(([start]) => start >= (m.tiles ?? 0)).reduce((max, [, d]) => Math.max(max, d), 0)
        const r = (v?: number) => (v === undefined ? null : Math.round(v))
        return {
          firstPaint: r(paint('first-paint')),
          firstContentfulPaint: r(paint('first-contentful-paint')),
          loaderGone: r(m.loaderGone),
          tiles: r(m.tiles),
          overviewInteractive: r(t),
          placeholder: r(m.placeholder),
          liveMounted: r(m.liveMounted),
          viewerCreate: r(mark('m1:create')),
          firstFrame: r(firstFrame),
          blockingAfterTiles: Math.round(blocking),
          longestTaskAfterTiles: Math.round(longest),
          m1Marks: Object.fromEntries(performance.getEntriesByType('mark').filter(e => e.name.startsWith('m1:')).map(e => [e.name, Math.round(e.startTime)])),
          longTasks: tasks.filter(([, d]) => d >= 200).map(([s0, d]) => [Math.round(s0), Math.round(d)])
        }
      }, QUIET_MS)
      const line = { build: process.env.PERF_LABEL || '', rate, run, ...result }
      console.log(JSON.stringify(line))
      if (process.env.PERF_OUT) appendFileSync(process.env.PERF_OUT, `${JSON.stringify(line)}\n`)
    })
  }
}
