# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: first-paint.spec.ts >> light: the splash is the colour of the page it hands over to
- Location: e2e\first-paint\first-paint.spec.ts:104:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('#muon-loader')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "Switch printer" [ref=e7] [cursor=pointer]:
        - generic [ref=e9]:
          - generic [ref=e10]: Boxwood
          - generic [ref=e13]: Klipper Startup
      - generic [ref=e16]:
        - button "Quick actions" [ref=e17] [cursor=pointer]
        - button "Notices, 1 unread" [ref=e20] [cursor=pointer]:
          - generic [ref=e24]: "1"
      - button "Emergency Stop" [disabled] [ref=e25]: STOP
  - navigation "Pages" [ref=e29]:
    - link "Overview" [ref=e30] [cursor=pointer]:
      - /url: /boxwood-367a
    - link "Jobs" [ref=e35] [cursor=pointer]:
      - /url: /boxwood-367a/jobs
    - link "Control" [ref=e41] [cursor=pointer]:
      - /url: /boxwood-367a/control
    - button "More" [ref=e45] [cursor=pointer]
  - main [ref=e51]:
    - generic [ref=e54]:
      - generic [ref=e55]:
        - heading "Overview" [level=1] [ref=e56]
        - button "Edit" [ref=e58] [cursor=pointer]
      - generic [ref=e59]:
        - generic [ref=e68]:
          - generic [ref=e69]:
            - generic [ref=e70]: Print job
            - paragraph [ref=e72]: Nothing is printing. Pick something to print again, or drop a file here.
            - generic [ref=e73]:
              - generic [ref=e74]:
                - generic [ref=e80]:
                  - generic [ref=e81]: calibration_cube
                  - generic [ref=e82]: printed yesterday
                - button "Print" [disabled] [ref=e83]
              - generic [ref=e84]:
                - generic [ref=e90]:
                  - generic [ref=e91]: benchy_0.16mm_PETG
                  - generic [ref=e92]: printed 2 days ago
                - button "Print" [disabled] [ref=e93]
              - generic [ref=e94]:
                - generic [ref=e100]:
                  - generic [ref=e101]: fan_duct_v3
                  - generic [ref=e102]: printed 3 days ago
                - button "Print" [disabled] [ref=e103]
            - link "All jobs" [ref=e104] [cursor=pointer]:
              - /url: /boxwood-367a/jobs
          - button "More for Print job" [ref=e106] [cursor=pointer]
        - generic [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]: Filament
            - generic [ref=e117]:
              - 'button "Filament: No material loaded. Set material and colour" [disabled] [ref=e119]':
                - generic [ref=e125]:
                  - generic [ref=e126]: No material loaded
                  - generic [ref=e130]: Press to set the material and colour
              - generic [ref=e131]:
                - button "Change filament" [disabled] [ref=e132]
                - button "Load" [disabled] [ref=e133]
                - button "Unload" [disabled] [ref=e134]
          - button "More for Filament" [ref=e136] [cursor=pointer]
        - generic [ref=e143]:
          - button "Hotend controls" [disabled] [ref=e144] [cursor=pointer]:
            - generic [ref=e145]: Hotend
            - generic [ref=e149]: —
          - button "More for Hotend" [ref=e151] [cursor=pointer]
        - generic [ref=e158]:
          - button "Bed controls" [disabled] [ref=e159] [cursor=pointer]:
            - generic [ref=e160]: Bed
            - generic [ref=e164]: —
          - button "More for Bed" [ref=e166] [cursor=pointer]
        - generic [ref=e174]:
          - generic [ref=e175]:
            - generic [ref=e178]: Position
            - button "Motors off" [disabled] [ref=e179]
            - generic [ref=e183]: Not homed
          - generic [ref=e184]:
            - generic [ref=e185]:
              - generic [ref=e186]:
                - generic [ref=e187]: X
                - button "Home X" [disabled] [ref=e188]
              - generic [ref=e191]: not homed
            - generic [ref=e192]:
              - generic [ref=e193]:
                - generic [ref=e194]: "Y"
                - button "Home Y" [disabled] [ref=e195]
              - generic [ref=e198]: not homed
            - generic [ref=e199]:
              - generic [ref=e200]:
                - generic [ref=e201]: Z
                - button "Home Z" [disabled] [ref=e202]
              - generic [ref=e205]: not homed
        - generic [ref=e209]:
          - generic [ref=e210]: Print mode
          - generic [ref=e214]:
            - generic [ref=e215]: Not available on this printer
            - generic [ref=e216]: No print modes set up.
        - generic [ref=e219]:
          - generic [ref=e220]:
            - generic [ref=e221]:
              - generic [ref=e224]: Temperatures
              - radiogroup "Time shown" [ref=e225]:
                - radio "5m" [ref=e226] [cursor=pointer]
                - radio "15m" [checked] [ref=e228] [cursor=pointer]
                - radio "20m" [ref=e230] [cursor=pointer]
            - generic [ref=e232]:
              - img "Temperature history. Hover or touch the graph for exact readings." [ref=e233]
              - group "Temperature series"
          - button "More for Temperatures" [ref=e236] [cursor=pointer]
        - generic [ref=e244]:
          - generic [ref=e245]:
            - heading "Trackpad" [level=2] [ref=e246]
            - button "More for Movement" [ref=e250] [cursor=pointer]
          - paragraph [ref=e255]: Klipper is not ready
        - generic [ref=e261]:
          - generic [ref=e262]:
            - generic [ref=e263]: Jog
            - generic [ref=e267]:
              - group "Move the head" [ref=e268]:
                - button "Head back" [disabled] [ref=e269]
                - button "Head left" [disabled] [ref=e272]
                - button "Head right" [disabled] [ref=e276]
                - button "Head forward" [disabled] [ref=e279]
              - group "Move the plate" [ref=e282]:
                - button "Plate up (Z+)" [disabled] [ref=e283]:
                  - generic [ref=e286]: Plate up
                - button "Plate down (Z−)" [disabled] [ref=e287]:
                  - generic [ref=e290]: Plate down
            - radiogroup "Step" [ref=e291]:
              - radio "0.1 mm" [disabled] [ref=e292]
              - radio "1 mm" [checked] [disabled] [ref=e294]
              - radio "10 mm" [disabled] [ref=e296]
              - radio "100 mm" [disabled] [ref=e298]
            - generic [ref=e300]: Klipper is not ready
          - button "More for Jog" [ref=e302] [cursor=pointer]
        - generic [ref=e310]:
          - generic [ref=e311]: Lighting
          - generic [ref=e316]:
            - generic [ref=e317]: Not available on this printer
            - generic [ref=e318]: The M1 light strips are set through its LED_MODE command, which this printer has not reported.
        - generic [ref=e321]:
          - generic [ref=e322]:
            - generic [ref=e323]: Quick commands
            - generic [ref=e327]:
              - button "Home all" [disabled] [ref=e328]
              - button "All commands" [ref=e332] [cursor=pointer]
            - paragraph [ref=e336]: Klipper is not ready
          - button "More for Quick commands" [ref=e338] [cursor=pointer]
      - status [ref=e343]
  - contentinfo [ref=e344]:
    - generic [ref=e345]:
      - text: Muon3D Control v1.31.0-rc.7-d1270d4 ·
      - link "Licences" [ref=e346] [cursor=pointer]:
        - /url: /licences.html
```

# Test source

```ts
  10  | import { allPixels, rimPixels, watch, watched } from './helpers'
  11  | 
  12  | const box = '[data-tid=first-paint]'
  13  | const STEP_NAMES = ['Opening Control', 'Connecting', 'Asking the printer', 'Starting Klipper', 'Loading the printer', 'Nearly there', 'Ready']
  14  | 
  15  | test.beforeEach(async ({ page }) => {
  16  |   await watch(page)
  17  | })
  18  | 
  19  | test('opening Control shows the rim and the wordmark, in the loader\'s place', async ({ page }) => {
  20  |   const printer = await usePrinter(page, PRESETS.idleHomed())
  21  |   printer.state.results['server.info'] = { klippy_state: 'startup' }
  22  |   await page.goto(PRINTER)
  23  |   await expect(page.locator(box)).toBeVisible()
  24  |   await expect(page.locator(`${box} canvas`)).toBeVisible()
  25  |   await expect(page.getByTestId('first-paint-label')).toHaveText(/\S/)
  26  |   // The loader's own bar and wordmark are not drawn under it.
  27  |   await expect(page.locator('.muon-loader__bar')).toBeHidden()
  28  |   await expect(page.locator('.muon-loader__word')).toBeHidden()
  29  |   await expect(page.locator(box)).toHaveAttribute('data-logo', /printing|done/)
  30  | })
  31  | 
  32  | test('the rim advances with the printer\'s real start-up, and the splash gives way to the real page', async ({ page }) => {
  33  |   const printer = await usePrinter(page, PRESETS.idleHomed())
  34  |   printer.state.results['server.info'] = { klippy_state: 'startup' }
  35  |   await page.goto(PRINTER)
  36  |   await expect(page.locator(box)).toHaveAttribute('data-stage', '2')
  37  |   await expect(page.getByTestId('first-paint-label')).toHaveText('Starting Klipper')
  38  |   await expect(page.locator(box)).toHaveAttribute('data-target', '0.50')
  39  |   // Klipper comes up: the next time Control asks, it is ready.
  40  |   delete printer.state.results['server.info']
  41  |   await expect(page.locator(box)).toHaveAttribute('data-outcome', 'ready', { timeout: 30_000 })
  42  |   await expect(page.locator(box)).toHaveAttribute('data-target', '1.00')
  43  |   await ready(page)
  44  |   await expect(page.getByTestId('printer-switch')).toContainText('Boxwood')
  45  | 
  46  |   const seen = await watched(page)
  47  |   // Only real states were named, in order, and the fill never went back.
  48  |   expect(seen.labels.length).toBeGreaterThanOrEqual(3)
  49  |   for (const label of seen.labels) expect(STEP_NAMES).toContain(label)
  50  |   const order = seen.labels.map(l => STEP_NAMES.indexOf(l))
  51  |   expect(order).toEqual([...order].sort((a, b) => a - b))
  52  |   const targets = seen.targets.map(Number)
  53  |   expect(targets).toEqual([...targets].sort((a, b) => a - b))
  54  |   expect(targets).toContain(0.5)
  55  |   expect(targets[targets.length - 1]).toBe(1)
  56  |   expect(seen.labels[seen.labels.length - 1]).toBe('Ready')
  57  | })
  58  | 
  59  | test('a stalled start stops the fill but the comet keeps lapping', async ({ page }) => {
  60  |   const printer = await usePrinter(page, PRESETS.idleHomed())
  61  |   printer.state.results['server.info'] = { klippy_state: 'startup' }
  62  |   await page.goto(PRINTER)
  63  |   await expect(page.locator(box)).toHaveAttribute('data-logo', 'done', { timeout: 20_000 })
  64  |   const target = await page.locator(box).getAttribute('data-target')
  65  |   expect(target).toBe('0.50')
  66  |   const a = await rimPixels(page)
  67  |   await page.waitForTimeout(350)
  68  |   const b = await rimPixels(page)
  69  |   await page.waitForTimeout(350)
  70  |   const c = await rimPixels(page)
  71  |   expect(a).not.toBe('')
  72  |   expect(new Set([a, b, c]).size).toBeGreaterThan(1)
  73  |   // The fill did not creep on while it was stuck, and the splash still holds the page.
  74  |   expect(await page.locator(box).getAttribute('data-target')).toBe(target)
  75  |   await expect(page.locator('#muon-loader')).toHaveCount(1)
  76  |   expect((await watched(page)).labels).not.toContain('Ready')
  77  | })
  78  | 
  79  | test('a quick start still gives the wordmark its full time', async ({ page }) => {
  80  |   await usePrinter(page, PRESETS.idleHomed())
  81  |   await page.goto(PRINTER)
  82  |   await ready(page)
  83  |   const seen = await watched(page)
  84  |   expect(seen.shownAt).not.toBeNull()
  85  |   expect(seen.goneAt).not.toBeNull()
  86  |   // 0.4 s run-in + 3.6 s of printing, from when it was first shown.
  87  |   expect(seen.goneAt! - seen.shownAt!).toBeGreaterThanOrEqual(3900)
  88  |   expect(seen.labels).toContain('Ready')
  89  | })
  90  | 
  91  | test('with the printer unreachable the splash hands over to the real screen', async ({ page }) => {
  92  |   const printer = await usePrinter(page, PRESETS.idleHomed())
  93  |   printer.state.offline = true
  94  |   await page.goto(PRINTER)
  95  |   await expect(page.locator('#muon-loader')).toHaveCount(0, { timeout: 30_000 })
  96  |   await expect(page.getByTestId('connection-unreachable').or(page.getByTestId('connection-connecting'))).toBeVisible()
  97  |   const seen = await watched(page)
  98  |   expect(seen.labels).not.toContain('Ready')
  99  |   // It did not sit on its wordmark for the print time: this is not a start-up that finished.
  100 |   expect(seen.goneAt! - seen.shownAt!).toBeLessThan(15_000)
  101 | })
  102 | 
  103 | for (const theme of ['light', 'dark'] as const) {
  104 |   test(`${theme}: the splash is the colour of the page it hands over to`, async ({ page }) => {
  105 |     await page.addInitScript(t => { try { localStorage.setItem('muon3d.theme', t) } catch {} }, theme)
  106 |     const printer = await usePrinter(page, PRESETS.idleHomed())
  107 |     printer.state.results['server.info'] = { klippy_state: 'startup' }
  108 |     await page.goto(PRINTER)
  109 |     await expect(page.locator(box)).toBeVisible()
> 110 |     const look = await page.locator('#muon-loader').evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, canvasInside: !!el.querySelector('canvas') }))
      |                                                     ^ Error: locator.evaluate: Test timeout of 90000ms exceeded.
  111 |     expect(look.canvasInside).toBe(true)
  112 |     expect(look.bg).toBe(theme === 'light' ? 'rgb(242, 242, 247)' : 'rgb(0, 0, 0)')
  113 |   })
  114 | }
  115 | 
  116 | test('it fits the screen: no sideways scroll, the rim inside the viewport', async ({ page }) => {
  117 |   const printer = await usePrinter(page, PRESETS.idleHomed())
  118 |   printer.state.results['server.info'] = { klippy_state: 'startup' }
  119 |   await page.goto(PRINTER)
  120 |   await expect(page.locator(box)).toBeVisible()
  121 |   const view = page.viewportSize()!
  122 |   const rect = await page.locator(`${box} canvas`).boundingBox()
  123 |   expect(rect!.x).toBeGreaterThanOrEqual(0)
  124 |   expect(rect!.x + rect!.width).toBeLessThanOrEqual(view.width)
  125 |   expect(rect!.y).toBeGreaterThanOrEqual(0)
  126 |   expect(rect!.y + rect!.height).toBeLessThanOrEqual(view.height)
  127 |   const label = await page.getByTestId('first-paint-label').boundingBox()
  128 |   expect(label!.x).toBeGreaterThanOrEqual(0)
  129 |   expect(label!.x + label!.width).toBeLessThanOrEqual(view.width)
  130 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  131 | })
  132 | 
  133 | test.describe('reduced motion', () => {
  134 |   test.use({ colorScheme: 'dark' })
  135 | 
  136 |   test('a still rim and the finished wordmark: nothing moves, and it does not wait for the print', async ({ page }) => {
  137 |     await page.emulateMedia({ reducedMotion: 'reduce' })
  138 |     const printer = await usePrinter(page, PRESETS.idleHomed())
  139 |     printer.state.results['server.info'] = { klippy_state: 'startup' }
  140 |     await page.goto(PRINTER)
  141 |     await expect(page.locator(box)).toHaveAttribute('data-stage', '2')
  142 |     await expect(page.locator(box)).toHaveAttribute('data-animating', 'false')
  143 |     await expect(page.locator(box)).toHaveAttribute('data-logo', 'done')
  144 |     const a = await allPixels(page)
  145 |     await page.waitForTimeout(700)
  146 |     const b = await allPixels(page)
  147 |     expect(a).not.toBe('')
  148 |     expect(b).toBe(a)
  149 |     // Ready: it leaves at once, with no sweep and no wait for a print time.
  150 |     delete printer.state.results['server.info']
  151 |     const before = Date.now()
  152 |     await ready(page)
  153 |     expect(Date.now() - before).toBeLessThan(20_000)
  154 |     const seen = await watched(page)
  155 |     expect(seen.labels).not.toContain('Nearly there')
  156 |   })
  157 | })
  158 | 
```