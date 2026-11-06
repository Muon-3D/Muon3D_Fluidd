# End-to-end tests

Jack, 5 Nov 2026: "what the user sees and does matters most". Every Control and Library page gets Playwright tests that click, navigate, search, save and share, and that cover the empty, error and offline states. A page isn't done until its e2e tests pass.

```bash
python -m pip install -r e2e/mock/requirements.txt   # once: aiohttp for the mock printer
npx playwright install chromium                       # once
npm run test:e2e                                      # desktop + phone
npm run test:e2e -- --project=desktop library/discover
```

## What runs
- **Control:** served by vite (the config starts it), so a test sees the code in the tree.
- **The printer:** `mock/moonraker.py` on :7125, a mid-print M1 called Boxwood. Control finds it there by itself. A printer's pages live under `/boxwood-367a/...`; `open('/library')` adds that prefix.
- **The model service** (`fakes/models.ts`): models.muon3d.com answered with `page.route` from in-memory state. That covers publications, discover, a print's page and pictures, saves, collections, and the Library basics. Each test gets its own copy as `models`:
  - add data before `open(...)`;
  - flip `models.failWith = 503` for an outage;
  - read `models.seen` to check what was asked.
- **The account service** (`fakes/console.ts`, fixture `account`): one account, its printers, and the model-service assertion. `test.use({ signedIn: true })` starts a test with a stored session; by default it's signed out.
- **Offline:** `await page.context().setOffline(true)`.
- **The mock printer is shared** by every test and worker. A test that changes the printer's state (heats, moves, starts a print) must put it back, or run serially with `test.describe.configure({ mode: 'serial' })`.

## Writing a page test
```ts
import { test, expect } from '../fixtures'

test.use({ signedIn: true })

test('saving from quick look puts it in Yours', async ({ page, models, open }) => {
  await open('/library?view=discover')
  // …click like a person would, then assert on what they would see…
})
```
- **Selectors:** `getByRole` and the visible text first; `getByTestId` (Control's `data-tid`) when the text isn't stable.
- **Layout:** pages go in `e2e/library/` or `e2e/control/`, one file per page.
- **Sizes:** both projects (desktop 1440×900, phone 390×844) run every test. Use `test.skip(({ isMobile }) => …)` only for something that truly exists on one size.
- **Startup:** `global-setup.ts` warms vite once, so the first test doesn't pay for the first compile.

CI: `.github/workflows/e2e.yml` runs on every PR. On failure it uploads the HTML report and the traces.
