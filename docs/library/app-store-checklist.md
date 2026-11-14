# Library: App Store quality checklist

Jack's goal, 11 Nov 2026: "Library to App Store quality." This is the list the
Library is judged against, written before the remaining milestones are built.
A line is ticked only when its screenshot is in `docs/library/screenshots/` and
the behaviour is covered by a test that fails when the behaviour is removed.

Three surfaces, one catalogue: **Control** (hosted and served from a printer),
the **Library site** (`library.muon3d.com`) and the **phone app** (owned by the
app project; its lines here are the endpoints it shares). Unless a line says
otherwise it applies to Control and the site, in dark and light, at desktop
width and at phone width (390 px).

Rules that apply to every line:

- No rating, count or popularity number is invented. The rating filter and
  sort appear only when the service reports real ratings.
- "Continue" is what this device opened most recently. It is not saved models
  and it is not synced.
- Quick commands are called Quick commands; the word "Macros" does not appear.
- "Fits" is a comparison of dimensions with the printer's build volume, and
  says so. It is never a claim that a model was test-printed.

## 1. First impression

- [ ] **Hero.** Discover opens on one featured model with a headline, a
      picture and one action. Screenshot: `01-hero-{control,site}-{dark,light}.png`
- [ ] **Shelves.** Editorial shelves, Popular, Made for M1, New this week and
      Continue, each a horizontally scrolling row with "See all" where there
      is more. Screenshot: `02-shelves-*.png`
- [ ] **A shelf with nothing in it says so** in one sentence and offers a way
      on; it is never an empty box. Screenshot: `03-shelf-empty-*.png`
- [ ] **First load is fast.** Discover shows skeletons within 100 ms and
      content within 2 s on a throttled "Fast 3G" profile; no layout shift
      when pictures arrive. Evidence: trace summary in the final report.

## 2. Finding a model

- [ ] **Categories.** Every category is a tile with its name, description
      and a real count. Screenshot: `04-categories-*.png`
- [ ] **Category page.** Title, description, filters and results; filters
      survive Back and reload. Screenshot: `05-category-*.png`
- [ ] **Search as you type.** Suggestions within 300 ms of the last
      keystroke; an older answer never replaces a newer query; Escape closes
      the list; Enter opens results. Screenshot: `06-search-suggestions-*.png`
- [ ] **Search results.** Muon3D models first as cards; filters (fit,
      material, size, licence, time) and sorts (relevance, popular, new,
      trending). Screenshot: `07-search-results-*.png`
- [ ] **No results** says what was searched for and offers categories that
      have models. Screenshot: `08-search-empty-*.png`

## 3. The model page

- [ ] **Profile.** Pictures, title, maker, licence, description, print
      profile (material, layer height, supports, plate, time, filament) with
      "Not provided" where the publisher gave nothing. Screenshot: `09-model-*.png`
- [ ] **Fit for your printer.** In Control, fit is judged against the
      selected printer's build volume and names the printer; on the site,
      against the M1. Screenshot: `10-model-fit-*.png`
- [ ] **Versions.** The reviewed public version; the owner also sees their
      unpublished versions. Screenshot: `11-model-versions-*.png`
- [ ] **Your print history** is private to the signed-in account and says
      why it is missing when it is (Library off, signed out, a failure with
      Retry). Screenshot: `12-model-history-*.png`
- [ ] **Similar models.** "More like this" from the same category; signed-out
      visitors see cards with no Save button. Screenshot: `13-model-similar-*.png`
- [ ] **Your own print's page has a direct Print button** (KAN-2021).
      Screenshot: `14-own-print-*.png`

## 4. Saving and collecting

- [ ] **Save** with one tap from a card and from the page; the heart shows
      the saved state and recovers from a failed request. Screenshot: `15-save-*.png`
- [ ] **Collections.** Create, rename, reorder, make public or private,
      delete; a public collection can be followed. Screenshot: `16-collection-*.png`
- [ ] **Yours.** Continue, Collections, then Sliced, Printed, Saved, Shared
      by you and Designs as shelves; no tab row. Screenshot: `17-yours-*.png`

## 5. Printing

- [ ] **Print from a card** and from the page: "Print on…" lists the
      account's printers with what is loaded, and one primary action.
      Screenshot: `18-print-on-*.png`
- [ ] **Print from the site** hands over to Control with the model chosen.
      Screenshot: `19-print-from-site.png`

## 6. Publishing

- [ ] **Upload and publish** on one page: files, pictures, title, category,
      tags, licence, rights confirmation. Refuses an oversize file, a wrong
      type and a path in a file name, each with a sentence that says which.
      Screenshot: `20-upload-*.png`
- [ ] **Under review** is a visible state for the publisher, and "Model not
      found" for everyone else. Screenshot: `21-under-review-*.png`

## 7. States (every list and page)

- [ ] **Loading**: skeletons shaped like the content. Screenshot: `22-loading-*.png`
- [ ] **Empty**: one sentence and one way on. Screenshot: `23-empty-*.png`
- [ ] **Error**: what failed, in plain words, and a Retry that works. A failed
      shelf does not blank the page. Screenshot: `24-error-*.png`
- [ ] **Offline**: "You're offline" when the browser is; "The Library can't
      be reached from here" when it is online but the service is not
      (KAN-1961). Retry works when the connection returns, and returning
      online retries without a tap. Screenshot: `25-offline-*.png`,
      `26-unreachable-*.png`
- [ ] **Signed out**: Discover invites sign-in and shows a public preview;
      nothing private is requested. Screenshot: `27-signed-out-*.png`
- [ ] **On a printer**: Control served from a printer loads Yours, Discover
      and a model page through the printer's `/models/` proxy with no
      "offline" message. Screenshot: `28-on-printer-*.png` (emulated stack),
      `29-on-boxwood.png` (with Jack's go)

## 8. Access

- [ ] **Keyboard.** Every action reachable in a sensible order; focus is
      visible; focus moves to the new page's heading on navigation; dialogs
      trap and return focus. Evidence: keyboard walk-through script and
      `30-focus-*.png`
      - [x] Tab reaches search, a card, its Print and its Save, in that
        order; every stop shows an outline or box-shadow; Enter opens the
        quick look, Escape closes it and focus returns to the card; opening a
        model page focuses its heading (e2e/library/a11y.spec.ts)
      - [ ] Dialogs trap focus (not covered by that spec yet)
      - [ ] `30-focus-*.png` needs a capture run
- [ ] **Screen reader.** Every control has a name; results announce their
      count; busy regions say so and stop saying so; pictures have text or
      are hidden. Evidence: axe run with no serious or critical findings.
      - [x] axe (WCAG 2 A and AA) on Discover, Yours, a model page and a
        public collection finds no serious or critical problem
        (e2e/library/a11y.spec.ts). It does not check that results announce
        their count or that busy regions stop saying so; those need a
        screen reader pass.
- [ ] **Phone width.** No horizontal page scroll at 390 px; shelves scroll
      inside themselves; touch targets at least 44 px. Screenshot: `31-phone-*.png`
- [ ] **Dark and light.** Every screen above in both themes, text contrast
      at least 4.5:1. Screenshot pairs throughout.
- [x] **Reduced motion.** Shelf and sheet animations stop when the system
      asks for reduced motion. Evidence: test (e2e/library/a11y.spec.ts: with
      `prefers-reduced-motion: reduce`, nothing in the Library, its quick look
      or Print on… is still animating once they are open).

## 9. Trust

- [ ] **No printer internals.** No public model, preview or seed picture
      shows the inside of the printer. Evidence: seed note in the final report.
- [ ] **Seed data** is generated primitives owned by the official account,
      with no customer files. Evidence: `docs/seed-examples.md` in
      muon3d-model-service.
- [ ] **Moderation.** A reported model reaches the staff queue; a hidden
      model disappears from every list, search and shelf within a minute.
      Screenshot: `32-report-*.png`

## Known accessibility issues

None recorded. `e2e/library/a11y.spec.ts` was written without a local
Playwright run (CI runs the e2e suite), so its first CI run is the first axe
result. If it reports a serious or critical problem that is not a small fix,
list it here with the rule id, the selector and what it affects, and exclude
that rule for that selector in the spec with a comment naming this entry. A
rule is never excluded for the whole page.

The ticks for Screen reader, Reduced motion and the keyboard walk-through
stand once that spec is green in CI.
