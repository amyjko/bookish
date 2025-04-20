# bookish changelog

# 0.7.0 - 2024-05-26

## Maintenance

- Updated minor versions of vite, vitest, Typescript, prettier, vite, Svelte, SvelteKit, ajv, firebase, firebase-functions.

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
