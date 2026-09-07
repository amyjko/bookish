import { expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BookishTheme } from '$lib/models/book/Theme';

/**
 * A `var(--bookish-typo)` fails silently: the declaration is simply dropped and
 * the element renders unstyled, which is easy to miss in a browser and easier
 * still in a book compiled by bookish-reader. This pins every reference to the
 * set of variables the theme actually emits.
 */

/** The name transform in themeToCSS()/toRules() in page/Edition.svelte. */
function variableFor(name: string): string {
    return (
        '--bookish-' +
        name
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map((part) => part.toLowerCase())
            .join('-')
            .replace(/([0-9])/g, '-$1-')
    );
}

/**
 * Every variable a book's theme defines. ThemeColors is a type, not a value,
 * so the color names come from the reference theme's own light palette --
 * which is also what themeToCSS() walks.
 */
function emittedVariables(): Set<string> {
    const groups = (
        ['light', 'dark', 'fonts', 'sizes', 'weights', 'spacing'] as const
    ).map((group) => Object.keys(BookishTheme[group] ?? {}));
    return new Set(groups.flat().map(variableFor));
}

/** Every .svelte file under src/lib and src/routes. */
function components(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return components(path);
        return entry.isFile() && entry.name.endsWith('.svelte') ? [path] : [];
    });
}

test('every --bookish- variable a component uses is one the theme defines', () => {
    const defined = emittedVariables();
    const used: { file: string; variable: string }[] = [];

    for (const file of [
        ...components('src/lib'),
        ...components('src/routes'),
    ]) {
        const source = readFileSync(file, 'utf8');
        for (const match of source.matchAll(/var\((--bookish-[a-z0-9-]+)/g))
            if (!defined.has(match[1])) used.push({ file, variable: match[1] });
    }

    expect(
        used.map(({ file, variable }) => `${file}: ${variable}`),
        'these resolve to nothing, so the declaration is dropped',
    ).toEqual([]);
});

test('the transform matches the documented digit rule', () => {
    // themeToCSS wraps digits in dashes after kebab-casing.
    expect(variableFor('header1FontSize')).toBe('--bookish-header-1-font-size');
    expect(variableFor('linkColor')).toBe('--bookish-link-color');
    expect(variableFor('paragraphLineHeightTight')).toBe(
        '--bookish-paragraph-line-height-tight',
    );
});

test('the set of variables is non-trivial, so the test can actually fail', () => {
    const defined = emittedVariables();
    expect(defined.size).toBeGreaterThan(20);
    expect(defined).toContain('--bookish-link-color');
    expect(defined).toContain('--bookish-roundedness');
});
