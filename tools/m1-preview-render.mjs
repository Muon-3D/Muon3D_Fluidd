// The printer-preview stills (src/assets/m1/m1-accurate-*.webp), rendered from the accurate model through the live
// viewer on the dev stage (src/dev/m1-stage), as the control-polish spec 4.2 defines:
// same camera as the live view, shadows off, two passes (flat black, flat white) and a difference matte
// (alpha = 1 - (white - black)) so the glass plate keeps true transparency. The CSS stage shows through.
// Usage: npm run dev, then  node tools/m1-preview-render.mjs [url] [outDir]
// (needs Playwright's Chromium; WebGL runs on SwiftShader headless).
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const base = process.argv[2] ?? 'http://localhost:5173/src/dev/m1-stage/index.html'
const outDir = process.argv[3] ?? 'src/assets/m1'
const SIZE = 960
const THUMB = 96
const BUDGET = { still: 60 * 1024, thumb: 4 * 1024 }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  const context = await browser.newContext({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('pageerror', e => console.error('page error:', e.message))
  const shot = async (flat) => {
    await page.evaluate(async flat => {
      for (const n of ['hi', 'mid', 'lo']) document.body.style.setProperty(`--m3d-stage-${n}`, flat)
      document.body.style.background = flat
      window.m1Stage.viewer.restyle()
      window.m1Stage.viewer.wake()
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))
    }, flat)
    await page.waitForTimeout(400)
    return (await page.screenshot({ type: 'png' })).toString('base64')
  }

  for (const state of ['idle', 'printing']) {
    await page.goto(`${base}?m1shadow=off${state === 'idle' ? '&print=0' : ''}`, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: `canvas{width:${SIZE}px!important;height:${SIZE}px!important;max-width:none!important;max-height:none!important}` })
    await page.evaluate(() => window.m1Stage.ready)
    await page.waitForTimeout(1500) // the model, the glass and the fade-in settle
    const black = await shot('#000000')
    const white = await shot('#ffffff')
    const result = await page.evaluate(async ({ black, white, SIZE, THUMB, BUDGET }) => {
      const load = async b64 => {
        const img = new Image()
        img.src = `data:image/png;base64,${b64}`
        await img.decode()
        const c = document.createElement('canvas')
        c.width = c.height = SIZE
        const g = c.getContext('2d', { willReadFrequently: true })
        g.drawImage(img, 0, 0, SIZE, SIZE)
        return g.getImageData(0, 0, SIZE, SIZE)
      }
      const b = await load(black)
      const w = await load(white)
      const out = new ImageData(SIZE, SIZE)
      for (let i = 0; i < out.data.length; i += 4) {
        const d = ((w.data[i] - b.data[i]) + (w.data[i + 1] - b.data[i + 1]) + (w.data[i + 2] - b.data[i + 2])) / 3
        const a = Math.min(1, Math.max(0, 1 - d / 255))
        out.data[i + 3] = Math.round(a * 255)
        for (let k = 0; k < 3; k++) out.data[i + k] = a > 0.004 ? Math.min(255, b.data[i + k] / a) : 0
      }
      const full = document.createElement('canvas')
      full.width = full.height = SIZE
      full.getContext('2d').putImageData(out, 0, 0)
      const encode = async (canvas, limit) => {
        for (let q = 0.92; q >= 0.2; q -= 0.04) {
          const blob = await new Promise(r => canvas.toBlob(r, 'image/webp', q))
          if (blob.size <= limit || q < 0.25) {
            const buf = new Uint8Array(await blob.arrayBuffer())
            let s = ''
            for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000))
            return { b64: btoa(s), size: blob.size, q }
          }
        }
      }
      const thumb = document.createElement('canvas')
      thumb.width = thumb.height = THUMB
      const tg = thumb.getContext('2d')
      tg.imageSmoothingQuality = 'high'
      tg.drawImage(full, 0, 0, THUMB, THUMB)
      return { still: await encode(full, BUDGET.still), thumb: await encode(thumb, BUDGET.thumb) }
    }, { black, white, SIZE, THUMB, BUDGET })

    await mkdir(outDir, { recursive: true })
    for (const [kind, file] of [['still', `m1-accurate-${state}.webp`], ['thumb', `m1-accurate-${state}-thumb.webp`]]) {
      await writeFile(path.join(outDir, file), Buffer.from(result[kind].b64, 'base64'))
      console.log(`${file}: ${result[kind].size} B (q ${result[kind].q.toFixed(2)})`)
    }
  }
} finally {
  await browser.close()
}
