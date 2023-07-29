# Bookish

Bookish is a framework and platform for writing and publishing web-based books. I originally created it to make it easier to maintain the many online books on my website (amyjko.com), while adding more sophisticated features to support reading. I'm slowly evolving it to be a simple free online service for authoring and reading online books.

## Status

I'm working on a 1.0 of the platform at [bookish.press](https://bookish.press) and expect to maintain the platform for the foreseeable future. Let me know if you'd like to help!

## Deployment notes

There are two major components to Bookish: the authoring platform and the reading front end. Changes to the authoring platform that do not affect reading can be verified and deployed to Firebase without any other coordination. However, changes to the reading experience have downstream dependencies that need to be managed. Here's the general deployment workflow, which I'm currently using as reminders for myself:

0. Ensure you're working in the `dev` branch
1. Fix bugs, add features
2. Ensure there are no type errors (`npm run check`) or failed tests (`npm run test`).
2. Test with emulator (`npm run emu`), if possible. (Some features aren't possible to perfectly emulate, such as authentication, hosting configurations, permissions.)
3. Test on the [staging server](https://bookish-dev-21ac3.web.app/`) (`npm run stage`).
4. Bump the version in `package.json`
5. Describe the changes in `CHANGELOG.md`, linking to any issues closed
6. Commit changes to `dev`, referring to any issues addressed
7. Release to production (`npm run release`)
8. Verify the change in production on [bookish.press](https://bookish.press)
9. Merge dev to main (`npm run merge`)
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