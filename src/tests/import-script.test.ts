import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';

const run = promisify(execFile);

// Smoke test for the book import script: it should load (which exercises its
// bookish-press/Schema self-import and the styleText/randomUUID replacements)
// and print usage when invoked without arguments.
test('import.js prints usage when run with no arguments', async () => {
    // The script imports bookish-press/Schema, which resolves into dist/;
    // build the package first (CI runs `npm run package:build`).
    expect(
        existsSync('dist/models/book/Schema.js'),
        'dist/ is missing — run `npm run package:build` first',
    ).toBe(true);

    const result: { code?: number; stdout?: string } = await run('node', [
        'scripts/import.js',
    ]).catch((error: { code?: number; stdout?: string }) => error);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
        'usage: node import.js [path-to-book] [bookID]',
    );
});
