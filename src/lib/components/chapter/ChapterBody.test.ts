import { beforeAll, expect, test, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import Parser from '$lib/models/chapter/Parser';
import Chapter from '$lib/models/book/Chapter';
import ChapterBody from './ChapterBody.svelte';
import { CARET, CHAPTER, EDITION } from '$lib/components/page/Contexts';
import type ChapterContext from '$lib/components/page/ChapterContext';

// The page state only exists inside a running SvelteKit app; Contexts.ts
// reads it to decide whether a route is editable.
vi.mock('$app/state', () => ({
    page: {
        route: { id: '/(reader)/[bookid]' },
        params: {},
        url: new URL('http://localhost/'),
    },
}));

beforeAll(() => {
    // jsdom doesn't implement matchMedia, which Marginal uses for mobile layout.
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => undefined,
            removeListener: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            dispatchEvent: () => false,
        }) as unknown as MediaQueryList;
});

function makeChapterContext(requestLayout: () => void) {
    const context: ChapterContext = {
        chapter: Chapter.fromJSON({
            id: 'test',
            title: 'Test Chapter',
            authors: [],
            image: null,
            numbered: true,
            forthcoming: false,
            text: '',
            uids: [],
        }),
        marginal: writable<string | undefined>(undefined),
        requestLayout,
    };
    return context;
}

function renderChapter(
    markup: string,
    requestLayout: () => void = () => undefined,
) {
    return render(ChapterBody, {
        props: { node: Parser.parseChapter(undefined, markup) },
        context: new Map<symbol, unknown>([
            [CHAPTER, writable(makeChapterContext(requestLayout))],
            [EDITION, writable(undefined)],
            [CARET, writable(undefined)],
        ]),
    });
}

test('renders paragraphs and code blocks', () => {
    const { container } = renderChapter(
        "Hello world, this is a paragraph.\n\n`\nconsole.log('hi');\n`\n",
    );
    expect(container.textContent).toContain(
        'Hello world, this is a paragraph.',
    );
    expect(container.querySelector('code.bookish-code')).not.toBeNull();
});

test('renders footnote content in a marginal', () => {
    const { container } = renderChapter(
        'This is a claim.{And this is the footnote that supports it.}',
    );
    expect(container.textContent).toContain('This is a claim.');
    const footnote = container.querySelector('.bookish-footnote');
    expect(footnote).not.toBeNull();
    expect(footnote?.textContent).toContain(
        'And this is the footnote that supports it.',
    );
});

// This guards the marginal layout contract: every render of a marginal
// component must request a chapter-wide layout pass, including re-renders
// caused by content changes. (Marginal components do this in an $effect
// that tracks their rendered inputs; see Footnote.svelte and friends.)
test('lays out marginals on render and again when content changes', async () => {
    const layout = vi.fn();
    const { rerender } = renderChapter('A fact.{A footnote.}', layout);
    await tick();
    expect(layout).toHaveBeenCalled();
    const initialCalls = layout.mock.calls.length;

    await rerender({
        node: Parser.parseChapter(
            undefined,
            'A revised fact.{A revised footnote.}',
        ),
    });
    await tick();
    expect(layout.mock.calls.length).toBeGreaterThan(initialCalls);
});
