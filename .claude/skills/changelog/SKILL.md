---
name: changelog
description: Update CHANGELOG.md for a release — categorize entries under Added/Changed/Fixed, reference the GitHub issues the release resolves, and close those issues with a link to the PR.
---

# Updating the changelog for a release

Follow these steps whenever preparing a release entry (usually step 5 of the
deployment ritual in README.md, alongside the version bump in package.json).

## 1. Gather what shipped

- The version comes from `package.json`; the date is today. Header format:
  `# X.Y.Z - YYYY-MM-DD` (h1, matching every prior entry).
- List the work since the last release: `git log --oneline <last-release-commit>..HEAD`
  and `gh pr list --state merged --limit 20` for merged PRs.
- Collect every issue number mentioned in those commits, PR titles, and PR
  bodies (`#N` references).

## 2. Cross-check the issue tracker — this is the step that gets missed

Run `gh issue list --state open` and read the open issues against what this
release actually contains. An issue can be resolved by a release without any
commit ever mentioning its number (e.g., a large migration that fulfills an
old request). For every issue this release resolves:

- Reference it in the relevant bullet as `(#N)` — the same style as prior
  entries like "(#380)".
- Close it: `gh issue close N --comment "..."` with a comment that names the
  release version and links the PR(s) that did the work (e.g., "Shipped in
  0.8.0 via #385: ...", with a sentence on how it was addressed).

Do not close issues the release only partially addresses; reference them in
the bullet and leave a comment on the issue describing what shipped and what
remains.

## 3. Write the entry

Use exactly these h2 sections, in this order, omitting any that are empty:

- `## Added` — new capabilities: features, tests, tooling, workflows.
- `## Changed` — behavior or infrastructure that works differently now,
  migrations, dependency upgrades, removals of unused things. **Breaking
  changes go first in this section, bolded**, stating who is affected and
  what they must do (e.g., peer dependency changes for `bookish-press`
  consumers).
- `## Fixed` — defects repaired, each stating the user-visible symptom, not
  just the code change.
- `## Known issues` — optional; defects discovered but deliberately not fixed
  in this release, so they are recorded rather than lost.

Style, matching the existing file:

- Plain past-tense bullets ("Migrated...", "Fixed...", "Replaced...");
  backticks around identifiers, file names, and commands.
- Describe outcomes, not the chronology of how the work happened. If the
  entry accumulated bullet-by-bullet across many commits, consolidate
  duplicates and delete interim statements that are no longer true.
- One bullet per coherent change; fold sub-details into the bullet rather
  than nesting lists.

## 4. Verify before committing

- Every `#N` in the new entry resolves to a real issue
  (`gh issue view N`), and every issue the release resolves is now closed.
- The version header matches `package.json` and today's date.
- Commit the changelog (with the version bump if not already committed).
