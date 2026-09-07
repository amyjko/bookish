# Bookish

Bookish is a framework and platform for writing and publishing web-based books. I originally created it to make it easier to maintain the many online books on my website (amyjko.com), while adding more sophisticated features to support reading. I'm slowly evolving it to be a simple free online service for authoring and reading online books.

## Status

I'm working on a 1.0 of the platform at [bookish.press](https://bookish.press) and expect to maintain the platform for the foreseeable future. Let me know if you'd like to help!

## Hosting architecture

The app is a SvelteKit app. Server-side rendering runs on a [Cloud Run](https://cloud.google.com/run) service named `bookish-ssr` (region `us-central1`) in each Firebase project; Firebase Hosting serves the static client assets from `build/client` and rewrites everything else to that service (see `firebase.json`). The `stage` and `release` scripts handle both: they build the app locally with the environment-specific `.env` (which is inlined at build time), deploy the resulting `build/` to Cloud Run (see `Dockerfile` and `.gcloudignore`), and then run `firebase deploy` for hosting, rules, and functions.

One-time setup on a new machine: install the [gcloud CLI](https://cloud.google.com/sdk/docs/install) and run `gcloud auth login`. (This replaced the experimental Firebase Hosting "web frameworks" integration, which required `firebase experiments:enable webframeworks` and capped the Vite version; the old auto-generated `ssrbookishprod` Cloud Function can be deleted once the Cloud Run deploy is verified.)

## The demo book

`npm run demo` seeds a book that uses every feature Bookish has into a set of
dedicated emulators, then serves it at <http://localhost:5173/demo>. Nothing is
uploaded and no sign-in is needed to read it; sign in as `demo@example.com` at
`/login` to edit it at `/write/demo/1`.

It exists so a change to the reading experience can be checked against
something real without hunting for a book that happens to exercise it. The
chapters cover every Bookdown construct — formatting, links of each kind,
footnotes, citations, definitions, lists, tables, quotes, callouts, code,
symbols, labels, comments — and the images are chosen to stress a small screen:
a photograph with fine texture, a diagram of hairlines, a stepped grey wedge,
extreme aspect ratios, transparency, and an SVG. That makes it the fastest way
to see what an EPUB export actually looks like on an e-reader.

The content lives in `scripts/demo-book.js` and the images are drawn by
`scripts/demo-images.js` rather than committed. Chapters must not use the ids
the reader reserves for its built-in pages (`references`, `search`, `media`,
`index`, `glossary`, `unknown`, `cover`); the seed script refuses to run if one
does.

It uses the offset emulator ports from `firebase.test.json`, so it does not
collide with another project's emulators on the default ports, and it builds
the app rather than running `vite dev` — the reader route's server render pulls
the chapter model through a module cycle that Vite's dev SSR evaluator cannot
order, though the production build resolves it fine.

## The demo book

`npm run demo` seeds a book that uses every feature Bookish has into a set of dedicated emulators, then serves it at <http://localhost:5173/demo>. Nothing is uploaded and no sign-in is needed to read it; sign in as `demo@example.com` at `/login` to edit it at `/write/demo/1`.

It exists so a change to the reading experience can be checked against something real without hunting for a book that happens to exercise it. The chapters cover every Bookdown construct — formatting, links of each kind, footnotes, citations, definitions, lists, tables, quotes, callouts, code, symbols, labels, comments — and the images are chosen to stress a small screen: a photograph with fine texture, a diagram of hairlines, a stepped grey wedge, extreme aspect ratios, transparency, and an SVG. That makes it the fastest way to see what an EPUB export actually looks like on an e-reader.

The content lives in `scripts/demo-book.js` and the images are drawn by `scripts/demo-images.js` rather than committed. Chapters must not use the ids the reader reserves for its built-in pages (`references`, `search`, `media`, `index`, `glossary`, `unknown`, `cover`); the seed script refuses to run if one does.

It uses the offset emulator ports from `firebase.test.json`, so it doesn't collide with another project's emulators on the default ports, and it builds the app rather than running `vite dev` — the reader route's server render pulls the chapter model through a module cycle that Vite's dev SSR evaluator can't order, though the production build resolves it fine.

## Deployment notes

There are two major components to Bookish: the authoring platform and the reading front end. Changes to the authoring platform that do not affect reading can be verified and deployed to Firebase without any other coordination. However, changes to the reading experience have downstream dependencies that need to be managed. Here's the general deployment workflow, which I'm currently using as reminders for myself:

0. Ensure you're working in the `dev` branch
1. Fix bugs, add features
2. Ensure there are no type errors (`npm run check`) or failed tests (`npm run test`).
3. Test with emulator (`npm run emu`), if possible. (Some features aren't possible to perfectly emulate, such as authentication, hosting configurations, permissions.)
4. Test on the [staging server](https://bookish-dev-21ac3.web.app/`) (`npm run stage`).
5. Bump the version in `package.json`
6. Describe the changes in `CHANGELOG.md`, linking to any issues closed
7. Commit changes to `dev`, referring to any issues addressed
8. Release to production (`npm run release`)
9. Verify the change in production on [bookish.press](https://bookish.press)
10. Merge dev to main (`npm run merge`)

> **Svelte 5 note**: as of 0.8.0, `bookish-press` requires Svelte 5 (declared as a peer dependency), which is a breaking change for consumers. Until `bookish-reader` has been migrated to Svelte 5, publish with `npm publish --tag next` so `latest` keeps pointing at the last Svelte 4 compatible release; flip the tag once the reader has migrated. The `0.7.x` branch exists for emergency maintenance releases of the Svelte 4 line.

10. If any of the changes affected the reading experience (essentially if any `.svelte` file or its dependencies in `/src/lib/components` changed), then we need to update the reader package for authors who pre-build their books manually:
    1. Update the bookish package with the Sveltekit package tooling (`npm run package`)
    2. Publish the package to npm (`npm publish`)
    3. Open the `bookish-reader` repository
    4. Pull the revisions (`npm update`), ensuring you update the repository's `package.json` dependencies, in case there was a major version change
    5. Update reader's `CHANGELOG.md` to describe any changes.
    6. Bump the reader's version in `package.json`
    7. Commit the changes directly to `main`, and sync them
    8. For any of these changes to make it to pre-built books, authors need ot use the updated `bookish-reader` repo to rebuild their books. That generally involves:
        1. Cloning the reader repo: `git clone https://github.com/amyjko/bookish-reader`
        2. Entering the repo directory: `cd bookish-reader`
        3. Binding the book: `bind.sh`
        4. Deploying the bound book in the newly created `build` folder to wherever it's hosted.
