# bookish changelog

# 0.9.1 - 2026-09-07

## Fixed

- EPUB rendering on e-readers with a minimal default stylesheet. The packaged stylesheet was written on the assumption that the reading system supplies sensible defaults for anything it doesn't mention, which holds on Apple Books and Calibre but not on smaller devices. Testing on an XTeink X3 running Crosspoint firmware found inline code rendering in the prose font, every heading level at the same size, ordered lists showing bullets, wrapped list items not hanging, and glossary terms running straight into their definitions. None of those were device limitations: the firmware applies our CSS faithfully, so each was simply a property we never wrote. The stylesheet now states the whole baseline — a `display` for every element the serializer can emit (including the tables, which would have collapsed into inline text next), an explicit `em` scale and weight for `h1`–`h6`, `monospace` for code, `list-style-type` and `list-style-position: outside` for lists, and block rules for `dl`/`dt`/`dd`. Prose still sets no typeface and no absolute size, so the reader's own choices continue to govern.
- Four `var(--bookish-…)` references that named variables the theme never emits, so the declaration was silently dropped and the element rendered unstyled: a `pragraph` typo in `Code.svelte`'s Prism colors, `--bookish-app-font` for what is app chrome in `EmbedEditor.svelte`, `--bookish-border-color` (only `-light` and `-bold` exist) in `Rows.svelte`, and `--bookish-header-font-size` (only the numbered levels exist) in `Search.svelte`.

## Changed

- The EPUB export UI on the table of contents is drawn with the book's own theme rather than app chrome. The size menu previously rendered in the OS system font — a `<select>` is a native menulist, and WebKit ignores an author `font-family` until `appearance` is turned off — and the download link fell through to the browser's default color because the reader defines no global link rule. The button and the progress and error messages came from `components/app/`, whose `--app-*` variables are only defined in the `(app)` layout, so on reader routes and in books compiled by `bookish-reader` they rendered unstyled; they are now plain elements styled with `--bookish-*`, keeping their `aria-label`, `role="status"` and `role="alert"` semantics.

## Added

- A device-check chapter in the demo book: one page stating what each construct should look like, so a pass on a real e-reader is a matter of reading down the page. Every bug above would have been caught on one screen.
- Tests pinning all of it. A stylesheet contract test derives the element list from the serializer's own output rather than hardcoding it, so a future node type that emits a new element fails until the stylesheet covers it — it named all 28 unstyled elements when run against 0.9.0. An end-to-end test downloads a real EPUB, strips the browser's default stylesheet, and asserts the packaged CSS stands on its own: that a glossary term and its definition land on separate lines, that headings outsize body text, that code is monospace, and that ordered lists are decimal and hang. And a test scans every component for `--bookish-` variables the theme doesn't define, which is what found the four above.

# 0.9.0 - 2026-09-07

## Added

- `npm run demo` seeds a book that uses every feature into dedicated emulators and serves it at `/demo`, with no sign-in needed to read it. It exists so a change to the reading experience can be checked against something real rather than whichever book happens to exercise it, and it is the fastest way to see what an EPUB export looks like on a device. Its images are drawn rather than committed (`scripts/demo-images.js`) and are chosen to stress a small screen: a photograph with fine texture, a diagram of hairlines, a stepped grey wedge, extreme aspect ratios, transparency, and an SVG. It uses the offset emulator ports from `firebase.test.json` so it never collides with another project's emulators.
- EPUB export (#95). A book's table of contents now has an "E-book" section that builds an EPUB in the reader's browser and hands back a file to download. No server, no cloud function, and no cost per download: the whole book's text is already in memory by the time the table of contents renders, and images are fetched directly (Firebase's download URLs allow cross-origin reads, and books compiled by `bookish-reader` serve theirs from the same origin). This replaces the abandoned server-side attempt whose commented-out download button has sat in `Publish.svelte` since it was written; that dead `publishEdition` path is still there and can now be removed.
- Readers choose an image budget, because they know their device. Compact (480x640, greyscale) is for pocket-sized e-ink readers, which are greyscale anyway; Standard (1280x1720, the default) sits just above a Kindle Paperwhite's 1236x1648 so a full-page image is never shrunk here only to be scaled back up by the device; Large (1600x2200) leaves room to zoom into diagrams on a tablet. Every image is re-encoded to fit, since the server-side thumbnails are 320px wide, below even the smallest preset. An image that can't be fetched (an author-linked host that sends no CORS headers, say) is reported and skipped, keeping its caption.
- Images are encoded as both JPEG and PNG at the target size and the smaller one is kept, because JPEG is far better for photographs and PNG for the flat colors and hairlines of a diagram. An image already close to its budget keeps its original encoding when that is smaller, since resampling line art can double a file for no gain; one that is well past the budget (more than 1.5x on its longest edge) is shrunk regardless, because decoding it costs a small reader memory it may not have. Transparency is composited onto white only for the JPEG candidate, so a PNG that stays a PNG keeps its alpha.
- The EPUB is built by new dependency-free modules in `src/lib/epub/`: a minimal ZIP writer (EPUB requires an uncompressed `mimetype` as the first entry, which most convenience wrappers don't expose), an XHTML serializer, an image pipeline, and the package assembler. Nothing was added to `package.json`, which matters because `bookish-press` is a published package and its dependencies flow to every consumer.
- The three things the web reader shows as marginal pop-ups become real links, since an e-reader has no margin: footnotes become endnotes at the end of each chapter with links in both directions, citations link to a references section, and definitions link to a glossary. Both back-matter documents exist mainly so those links have somewhere to land. Chapter links are rewritten to the chapter's document, and a link to a chapter that isn't in the package keeps its words rather than becoming a dead link. Index, search, and media are skipped as derived or interactive.
- The packaged stylesheet deliberately sets no typeface and no size. E-reader users set their own, and overriding that is the most common way an EPUB becomes unpleasant to read; a book's theme would also `@import` Google Fonts an offline reader can't fetch and encode color e-ink can't show.
- Tests: unit coverage of the ZIP writer (verified by parsing archives back, with the CRC-32 specification check value), the serializer (every node type, each asserted to produce well-formed XML, which is what decides whether a reader will open the file at all), the image budgets, and a full build verified by unzipping it; plus two emulator Playwright tests that download an EPUB in a real browser and confirm a smaller preset really does produce a smaller image. Output was also validated with `epubcheck` 5.2.1 against a book exercising every feature: no errors or warnings.

## Fixed

- `TextNode.toHTML()` escaped only the _first_ occurrence of each markup character, because it used `String.replace` with string patterns rather than regular expressions, and escaped `&` after `<` and `>`, so any entity it produced was escaped again (`<` became `&amp;lt;`). This is the serializer behind the editor's clipboard `text/html` payload.

# 0.8.2 - 2026-09-02

## Fixed

- The `og:image` social-preview meta tag emitted the cover's raw Bookish embed markup instead of its image URL, breaking social previews for every published book (and producing stray prerendered pages when `bookish-reader`'s static site generator crawled the markup as a link). Discovered while migrating `bookish-reader` to Svelte 5.

# 0.8.1 - 2026-09-02

## Added

- Regression tests pinning each fix below: unit and route-level tests for string-form references, a component test that delivers Firestore listener snapshots in adversarial orders around local edits, an emulator test of rapid successive glossary edits surviving a reload, and an emulator assertion that the add-synonym button focuses the new synonym.

## Fixed

- All three known issues recorded in 0.8.0: legacy string-form references no longer crash the edition editor (already-parsed references now survive the copy-on-write constructor's re-normalization); a save's Firestore listener echo no longer overwrites edits made while the save was pending (stale snapshots are skipped until the save completes, while chapter text the client doesn't have yet still merges in at load); and adding a synonym now moves focus to the new synonym field (focus is deferred past the button click's default action, which was stealing it back).
- `scripts/import.js` crashed with `error is not defined` on any invalid input; fatal errors now print in red and exit.
- Eliminated every remaining `svelte-check` and build warning. Two were latent defects: `Chapter.svelte` computed its editability once and never updated it across chapter navigation, and `ImageThumbnail.svelte` never reset or retried a failed thumbnail when its unkeyed list row was reused. The rest were invalid HTML (an `<aside>` inside a `<p>` in rendered references), dead code, a Svelte 4 nested-selector idiom in `List.svelte`, and deliberate initial-value captures now expressed with `untrack()` (script-level `svelte-ignore` comments are stripped by `vitePreprocess` before the compiler sees them).

# 0.8.0 - 2026-09-02

## Added

- A signed-in Playwright suite (`npm run test:e2e:emu`) against dedicated Firebase emulators (`firebase.test.json`; offset ports, overridable via `PUBLIC_EMULATOR_*`; credential-free `demo-` project): email-link sign-in, every toolbar sub-editor (links, citations, footnotes, comments, inline code, tables) with Firestore persistence, image upload through the embed editor's file input, glossary create/use/delete, the change-email page, the write print view, and invalid-login-link rejection.
- Unit and browser tests: chapter rendering and the marginal layout contract, effect-cycle regressions that mount the real route stacks, marginal positioning and editor behavior against local-only `/fixture` routes, and a usage smoke test for `scripts/import.js`.
- A CI verify workflow on pull requests (replacing the deploy-on-PR workflow): type check, unit tests, npm package build, app build, and both Playwright suites, with a 15-minute job timeout. Deploys remain manual.

## Changed

- **Migrated to Svelte 5** (#379). **Breaking for `bookish-press` consumers**: the package now requires Svelte 5 (`peerDependencies: { svelte: "^5.0.0" }`); published under the `next` dist-tag until `bookish-reader` migrates, with the `0.7.x` branch holding the Svelte 4 line. All 154 components use runes (Svelte 5.57, Vite 7, vite-plugin-svelte 6, svelte-check 4, prettier-plugin-svelte 4, vitest 4; svelte-preprocess replaced with vitePreprocess); every `$:` side effect was triaged into `$derived` or `$effect` by hand, and `$app/stores` became `$app/state` throughout. The rich text editor was verified behavior-identical to the Svelte 4 editor by direct comparison. Deferred on purpose: Vite 8 (optional) and TypeScript 7 (no Svelte tooling support yet).
- The marginal layout system coalesces layout requests into one pass per animation frame (`ChapterContext.requestLayout`) instead of one per component update.
- Server-side rendering moved from the retired Firebase Hosting web-frameworks experiment to a Cloud Run service (`bookish-ssr`) behind a Hosting rewrite, reusing the adapter-node build. Deploys build locally once and ship the artifacts (see `Dockerfile`), so Hosting and the SSR server share one set of asset hashes.
- Firebase across the board: client SDK 11→12, firebase-admin 12→14 (modular API in the server route and functions), firebase-functions 6→7, @google-cloud/storage 7→8; SvelteKit 2.70 and all other in-range updates.
- Replaced `uuid` with `crypto.randomUUID()` and `chalk` with `node:util`'s `styleText`; removed unused dependencies (`globals`, `@types/sharp`, `firebase-functions-test`, the functions' unused `bookish-press`) and the dead `vite.reader.config.ts`; `firebase-tools` is now a pinned devDependency.

## Fixed

- Two effect cycles introduced by the migration, both from Svelte 5 tracking every read in an effect's call stack where `$:` tracked only compile-time references: the app layout's save/debounce bookkeeping (blanked every editor page), and TextEditor's auto-save tracking its inline `save`/`valid` function props. Both are pinned by regression tests.
- Prism token styles had silently become scoped (and thus inert) when svelte-preprocess was removed; they are global again via native `:global` blocks.
- The change-email page's error feedback was dead code (a shadowed catch variable, a non-reactive `error`, and two typo'd Firebase error codes).
- The scheduled Firestore backups in both projects had been failing silently since May 2024: the functions' service accounts lacked the Firestore export role. Granted, force-ran, and verified fresh exports in both buckets.
- Two `$page.params` nullability errors surfaced by the SvelteKit update.

## Known issues (pre-existing, recorded while testing)

- Legacy string-form references crash the edition editor with "e is not iterable"; the array (APA) form works.
- Editing again before a save's Firestore listener echo arrives can lose the newer edits to the echoed snapshot.
- The add-synonym focus behavior doesn't survive that echo re-render.

# 0.7.4 - 2026-05-02

- Updated to node 22, and related downstream dependencies.
- When in editing mode, the print route should just show the page as it would be shown in reading mode.
- Set a sensible page title for the print route (#380).
- Removed page break preceding first chapter in print mode (#381).
- Improved the outline width to avoid clipping before entering a mobile layout (#382).

# 0.7.3 - 2026-03-20

- Fixed edition numbering on edition creation.
- Fixed edition chapter text copying.

# 0.7.2 - 2026-01-17

- Formatted edition revision summary.
- Better error handling on edition creation.

# 0.7.1 - 2025-05-11

## Fixed

- Fixed type error in toolbar invocation.
- Fixed type errors in edition creation caused by Firebase use of `any`.
- Hide references

# 0.7.0 - 2025-04-26

## Added

- Editing built-in chapter names and table of contents headers.
- Added support for dead key accent insertion.

## Fixed

- Fixed glossary saving error.

## Maintenance

- Updated minor versions of vite, vitest, Typescript, prettier, vite, Svelte, SvelteKit, ajv, firebase, firebase-functions.
- Removed eslint.

# 0.6.54 - 2024-05-26

## Maintenance

- Updated to vitest 1.6.0
- Updated to Typescript 5.4.5
- Updated to prettier 3.2.5
- Updated to vite 5.2.11
- Updated to Sveltekit 2.5.10 and related dependencies.
- Updated ajv and ajv-formats
- Updated firebase to 10.12.1
- Updated firebase-functions to 5.0.1
- Upgraded all Firebase functions to Gen 2

## Added

Created an import script for loading a book from local files into Firebase.

# 0.6.53 - 2024-04-21

## Fixed

- Removed errant space after citations.
- Added Java syntax highlighting support (in a hacky way, given PrismJS is defunct.)

# 0.6.52 - 2024-03-03

## Enhancement

- Label book as edited if any chapters have explicit authors.

# 0.6.51 - 2024-03-03

## Enhancement

- Added link to link editor in the toolbar to simplify link testing.
- Allow chapter editors to edit references.

## Fixed

- Fixed issue where image alignment setting was not saved.
- Update links to chapters when chapter IDs change.

# 0.6.5 - 2024-02-25

## Fixed

- Preserve alt text when new image is uploaded for an embed, or new image is selected. This prevents data loss in case its a revised image (while also risking being out of date and an author forgetting to update it).
- [#370](https://github.com/amyjko/bookish/issues/370). Clarified that references are sorted by ID.
- [#369](https://github.com/amyjko/bookish/issues/369). Case-insensitive reference IDs.
- [#368](https://github.com/amyjko/bookish/issues/368). Account for identical reference IDs in bulk add.

# 0.6.11 - 2024-01-20

## Enhancement

- Added "coming soon" feedback to unpublished book URLs.

## Fixed

- Fixed critical defect preventing Firebase initialization in book reading SSR cloud functionb.
- Better toolbar wrapping on large image editor.
- Moved theme settings from table of contents entry to link in settings.
- Avoid name collisions in image uploads.

# 0.6.1 - 2023-12-30

## Enhancements

- [#360](https://github.com/amyjko/bookish/issues/360) Streamlined server-side rendering of book for faster first load. Also removing the cache for freshness.

# 0.6.0 - 2023-12-16

## Enhancements

- [#366](https://github.com/amyjko/bookish/issues/366) Added ability to rich text format authors, including links.

## Fixed

- [#362](https://github.com/amyjko/bookish/issues/362) Soft wrap code while editing to ensure cursor is visible.
- Constant height of toolbar to prevent jumpiness.

## Dependencies

- Updated to SvelteKit 2
- Updated to Vite 5

# 0.5.78 - 2023-12-12

## Fixed

- Account for very long chapter outlines on shorter displays.
- Handle pastes into atom nodes.

# 0.5.74 - 2023-12-06

## Fixed

- [#365](https://github.com/amyjko/bookish/issues/365) Save on glossry definition exit.
- Added support for custom Google Analytics tag on an edition.

# 0.5.72 - 2023-11-27

## Fixed

- [#364](https://github.com/amyjko/bookish/issues/364) Escape reserved characters on paste.
- [#363](https://github.com/amyjko/bookish/issues/363) Level 4 headers.

# 0.5.71 - 2023-11-20

- Link to header feature.
- Don't replace selection on comment insertion.
- Don't focus on tables on cell click.
- Fix off by one on table row and column deletion.
- More context sensitive paste.

# 0.5.7 - 2023-11-18

- Updated minor versions.
- Enable SvelteKit server-side rendering.

# 0.5.64 - 2023-11-13

## Fixed

- Fixed faulty synchronization of chapter text when multiple clients are editing a book that led to temporarily missing chapter text.
- Fixed jumpy smooth scrolling of caret position.
- Place new empty references at top of list.
- Gave edition and chapter editors permission to upload images.
- Make unpublished editions visible to users with edition edit privileges.
- Maximum width on select widgets.
- Improved position of reference ID in edit mode.
- Fixed editability of code blocks.
- Allow chapter navigation to forthcoming chapters if editable.
- No error on book domain if it's the book domain.
- More robust reference mining.
- Fixed missing return statement in paste command.
- Parse text as chapter before inserting into document.

# 0.5.63 - 2023-11-11

## Dependencies

- Updated minor versions of dependencies
- Updated to Firebase 10.5 libraries.
- Updated functions dependencies

## Fixed

- Fixed link in book description instructions.
- Improved chapter deletion button
- [#359](https://github.com/amyjko/bookish/issues/359): Show reference IDs when not editing
- [#358](https://github.com/amyjko/bookish/issues/358): Clarified button label.
- [#357](https://github.com/amyjko/bookish/issues/357): Fixed multi-agent chapter add/delete async bug.

# 0.5.62 - 2023-10-15

- Added .gitattributes to avoid cross platform line break issues.

# 0.5.62 - 2023-07-29

- [#356](https://github.com/amyjko/bookish/issues/356): Fixed faulty horizontal rule margins.
- Removed caching of editions in hosting, at least until cost becomes an issue.
- Updated minor versions of Svelte, Sveltekit, Vite, Firebase, and various dev dependencies.

# 0.5.61 - 2023-07-15

## Fixed

- [#343](https://github.com/amyjko/bookish/issues/343): Convert inline code into block on Enter
- [#347](https://github.com/amyjko/bookish/issues/347): `overflow-wrap` on chapter body to prevent overflow of very long text.

# 0.5.6 - 2023-07-01

## Feature

- #355 Added support for inserting line breaks in paragraph with shift-Enter.

# 0.5.4 - 2023-06-24

## Content

- Added landing page FAQ

## Dependencies

- Upgraded to Svelte 4

## Fixed

- Fixed several missing ARIA roles on interactive elements
- Fixed `ConfirmButton`, which didn't revert to non-confirming state after evaluating command.
- Fixed [#352](https://github.com/amyjko/bookish/issues/352), correcting command handling.
- Fixed layout of figure credit.

# 0.5.32 - 2023-06-17

## Content

- Added better definition of beta to home page.

## Fixed

- Fixed [#349](https://github.com/amyjko/bookish/issues/349), correcting numbered list numbering.

# 0.5.31 - 2023-06-10

## Fixed

- Login redirect on session expiration auth change
- Fixed [#342](https://github.com/amyjko/bookish/issues/342): Prevented runaway escapes in inline code and links.

# 0.5.30 - 2023-06-03

# Dependencies

- Updated to firebase-functions 4.4.0
- Updated to TypeScript 5
- Updated to SvelteKit 1.2
- Updated to Firebase 9.22

## Fixed

- Fixed [#340](https://github.com/amyjko/bookish/issues/340): decreased frequency of saves; prevented stale data overwrite on failed save.

# 0.5.29 - 2023-05-13

- Fixed overlapping book previews.

# 0.5.27 - 2023-04-01

## Fixed

- Fixed case where an empty format caused a crash.
- Fixed incorrect editor permissions warning

# 0.5.26 - 2023-03-11

## Fixed

- Created a change log
- Updated to Sveltekit 1.11
- Updated to Vitest 0.29.2
- Corrected positioning of marginals in callouts, quotes, and other blocks [#323](https://github.com/amyjko/bookish/issues/323)
- Fixed laggy udpates of chapter cover images
