# bookish changelog

# 0.5.64 - 2023-11-13

## Fixed

-   Fixed faulty synchronization of chapter text when multiple clients are editing a book that led to temporarily missing chapter text.
-   Fixed jumpy smooth scrolling of caret position.

# 0.5.63 - 2023-11-11

## Dependencies

-   Updated minor versions of dependencies
-   Updated to Firebase 10.5 libraries.
-   Updated functions dependencies

## Fixed

-   Fixed link in book description instructions.
-   Improved chapter deletion button
-   [#359](https://github.com/amyjko/bookish/issues/359): Show reference IDs when not editing
-   [#358](https://github.com/amyjko/bookish/issues/358): Clarified button label.
-   [#357](https://github.com/amyjko/bookish/issues/357): Fixed multi-agent chapter add/delete async bug.

# 0.5.62 - 2023-10-15

-   Added .gitattributes to avoid cross platform line break issues.

# 0.5.62 - 2023-07-29

-   [#356](https://github.com/amyjko/bookish/issues/356): Fixed faulty horizontal rule margins.
-   Removed caching of editions in hosting, at least until cost becomes an issue.
-   Updated minor versions of Svelte, Sveltekit, Vite, Firebase, and various dev dependencies.

# 0.5.61 - 2023-07-15

## Fixed

-   [#343](https://github.com/amyjko/bookish/issues/343): Convert inline code into block on Enter
-   [#347](https://github.com/amyjko/bookish/issues/347): `overflow-wrap` on chapter body to prevent overflow of very long text.

# 0.5.6 - 2023-07-01

## Feature

-   #355 Added support for inserting line breaks in paragraph with shift-Enter.

# 0.5.4 - 2023-06-24

## Content

-   Added landing page FAQ

## Dependencies

-   Upgraded to Svelte 4

## Fixed

-   Fixed several missing ARIA roles on interactive elements
-   Fixed `ConfirmButton`, which didn't revert to non-confirming state after evaluating command.
-   Fixed [#352](https://github.com/amyjko/bookish/issues/352), correcting command handling.
-   Fixed layout of figure credit.

# 0.5.32 - 2023-06-17

## Content

-   Added better definition of beta to home page.

## Fixed

-   Fixed [#349](https://github.com/amyjko/bookish/issues/349), correcting numbered list numbering.

# 0.5.31 - 2023-06-10

## Fixed

-   Login redirect on session expiration auth change
-   Fixed [#342](https://github.com/amyjko/bookish/issues/342): Prevented runaway escapes in inline code and links.

# 0.5.30 - 2023-06-03

# Dependencies

-   Updated to firebase-functions 4.4.0
-   Updated to TypeScript 5
-   Updated to SvelteKit 1.2
-   Updated to Firebase 9.22

## Fixed

-   Fixed [#340](https://github.com/amyjko/bookish/issues/340): decreased frequency of saves; prevented stale data overwrite on failed save.

# 0.5.29 - 2023-05-13

-   Fixed overlapping book previews.

# 0.5.27 - 2023-04-01

## Fixed

-   Fixed case where an empty format caused a crash.
-   Fixed incorrect editor permissions warning

# 0.5.26 - 2023-03-11

## Fixed

-   Created a change log
-   Updated to Sveltekit 1.11
-   Updated to Vitest 0.29.2
-   Corrected positioning of marginals in callouts, quotes, and other blocks [#323](https://github.com/amyjko/bookish/issues/323)
-   Fixed laggy udpates of chapter cover images
