/**
 * Overview: the live M1 has the spool on its back and the plug in its power
 * socket (Jack, 9 Nov), on whichever model the page draws. The stage's
 * element marks them (M1Live.markDrawn): data-spool and data-plug, on or off.
 *
 * As in m1-live-states.spec.ts, Windows gives the browser the real GPU for the
 * accurate model; elsewhere (CI) the page asks for the simple model.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

// About the 3D stage: it needs WebGL, which the e2e fixtures turn off by default (KAN-2781).
test.use({ webgl: true })

// E2E_M1_SIMPLE=1 tries the simple model's path on Windows too.
const GPU = process.platform === 'win32' && process.env.E2E_M1_SIMPLE !== '1'

test.use({
  launchOptions: GPU ? { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } : {}
})

test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

// As m1-live-states.spec.ts: on CI's phone project the stage never appears within 60 s (software WebGL).
test.fixme(({ isMobile }) => isMobile && !!process.env.CI, 'the stage never appears on CI phone (software WebGL); passes locally')

test('the model shows its spool and its power plug', async ({ page, open }) => {
  test.setTimeout(150_000)
  const warnings: string[] = []
  page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()) })
  await usePrinter(page, PRESETS.idleHomed({ position: [100, 90, 40] }))
  await open('/')

  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(stage).toHaveAttribute('data-model', GPU ? 'accurate' : 'simple', { timeout: 60_000 })
  await expect(stage).toHaveAttribute('data-spool', 'on')
  await expect(stage).toHaveAttribute('data-plug', 'on')
  expect(warnings.filter(w => w.includes('accurate model could not be shown'))).toEqual([])
})
